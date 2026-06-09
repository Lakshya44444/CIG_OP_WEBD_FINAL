import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { triggerNotification } from "@/lib/pusher";

export async function POST(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { userId } = await params;
    if (userId === session.user.id) {
      return NextResponse.json({ error: "You cannot follow yourself" }, { status: 400 });
    }

    const target = await db.user.findUnique({ where: { id: userId }, select: { id: true, name: true } });
    if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const existing = await db.follow.findUnique({
      where: { followerId_followingId: { followerId: session.user.id, followingId: userId } },
    });

    if (existing) {
      await db.follow.delete({ where: { id: existing.id } });
      return NextResponse.json({ following: false });
    }

    await db.follow.create({ data: { followerId: session.user.id, followingId: userId } });

    // Notify the followed user
    const notification = await db.notification.create({
      data: {
        type: "FOLLOW",
        message: `${session.user.name} started following you`,
        receiverId: userId,
        senderId: session.user.id,
        link: `/profile/${session.user.id}`,
      },
    });

    await triggerNotification(userId, {
      type: notification.type,
      message: notification.message,
      senderId: session.user.id || undefined,
      senderName: session.user.name || "",
      link: notification.link || undefined,
    });

    return NextResponse.json({ following: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const session = await auth();
    const { userId } = await params;

    const [followers, following, isFollowing] = await Promise.all([
      db.follow.count({ where: { followingId: userId } }),
      db.follow.count({ where: { followerId: userId } }),
      session ? db.follow.findUnique({
        where: { followerId_followingId: { followerId: session.user.id, followingId: userId } },
        select: { id: true },
      }) : null,
    ]);

    return NextResponse.json({ followers, following, isFollowing: !!isFollowing });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
