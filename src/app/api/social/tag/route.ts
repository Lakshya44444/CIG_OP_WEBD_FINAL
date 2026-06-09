import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { triggerNotification } from "@/lib/pusher";

// Add a user tag on a photo
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { mediaId, taggedUserId } = await req.json();
    if (!mediaId || !taggedUserId) {
      return NextResponse.json({ error: "mediaId and taggedUserId required" }, { status: 400 });
    }

    // Can't tag yourself (or can — up to you, but let's allow it)
    const existing = await db.mediaTag.findUnique({
      where: { userId_mediaId: { userId: taggedUserId, mediaId } },
    });
    if (existing) return NextResponse.json({ error: "User already tagged" }, { status: 409 });

    const tag = await db.mediaTag.create({
      data: { userId: taggedUserId, mediaId },
      include: { user: { select: { name: true, username: true, avatar: true } } },
    });

    // Notify tagged user
    if (taggedUserId !== session.user.id) {
      const notification = await db.notification.create({
        data: {
          type: "TAG",
          message: `${session.user.name} tagged you in a photo`,
          receiverId: taggedUserId,
          senderId: session.user.id,
          mediaId,
          link: `/media/${mediaId}`,
        },
      });

      await triggerNotification(taggedUserId, {
        type: notification.type,
        message: notification.message,
        mediaId,
        senderId: session.user.id || undefined,
        senderName: session.user.name || "",
        link: `/media/${mediaId}`,
      });
    }

    return NextResponse.json({ tag }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Remove a tag
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { mediaId, taggedUserId } = await req.json();

    const tag = await db.mediaTag.findUnique({
      where: { userId_mediaId: { userId: taggedUserId, mediaId } },
    });
    if (!tag) return NextResponse.json({ error: "Tag not found" }, { status: 404 });

    await db.mediaTag.delete({ where: { id: tag.id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
