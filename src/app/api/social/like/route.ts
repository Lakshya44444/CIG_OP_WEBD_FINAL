import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { triggerNotification } from "@/lib/pusher";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { mediaId } = await req.json();
    if (!mediaId) return NextResponse.json({ error: "mediaId required" }, { status: 400 });

    const existing = await db.like.findUnique({
      where: { userId_mediaId: { userId: session.user.id, mediaId } },
    });

    if (existing) {
      await db.like.delete({ where: { id: existing.id } });
      return NextResponse.json({ liked: false });
    }

    await db.like.create({ data: { userId: session.user.id, mediaId } });

    // Notify media owner
    const media = await db.media.findUnique({
      where: { id: mediaId },
      select: { uploadedById: true, title: true },
    });

    if (media && media.uploadedById !== session.user.id) {
      const notification = await db.notification.create({
        data: {
          type: "LIKE",
          message: `${session.user.name} liked your photo`,
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

    return NextResponse.json({ liked: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
