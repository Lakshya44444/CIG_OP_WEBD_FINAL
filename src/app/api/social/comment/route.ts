import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { triggerNotification } from "@/lib/pusher";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { mediaId, text } = await req.json();
    if (!mediaId || !text?.trim()) {
      return NextResponse.json({ error: "mediaId and text required" }, { status: 400 });
    }

    const comment = await db.comment.create({
      data: { text: text.trim(), userId: session.user.id, mediaId },
      include: {
        user: { select: { name: true, avatar: true, username: true } },
      },
    });

    // Notify media owner
    const media = await db.media.findUnique({
      where: { id: mediaId },
      select: { uploadedById: true },
    });

    if (media && media.uploadedById !== session.user.id) {
      const notification = await db.notification.create({
        data: {
          type: "COMMENT",
          message: `${session.user.name} commented: "${text.slice(0, 50)}${text.length > 50 ? "…" : ""}"`,
          receiverId: media.uploadedById,
          senderId: session.user.id,
          mediaId,
          link: `/media/${mediaId}`,
        },
      });

      await triggerNotification(media.uploadedById, {
        type: notification.type,
        message: notification.message,
        mediaId: notification.mediaId || undefined,
        senderId: notification.senderId || undefined,
        senderName: session.user.name || "",
        link: notification.link || undefined,
      });
    }

    return NextResponse.json({ comment }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const mediaId = searchParams.get("mediaId");
    if (!mediaId) return NextResponse.json({ error: "mediaId required" }, { status: 400 });

    const comments = await db.comment.findMany({
      where: { mediaId },
      orderBy: { createdAt: "asc" },
      include: {
        user: { select: { name: true, avatar: true, username: true } },
      },
    });

    return NextResponse.json({ comments });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
