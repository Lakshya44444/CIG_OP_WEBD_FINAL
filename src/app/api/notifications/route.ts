import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "20");

    const [notifications, unreadCount] = await Promise.all([
      db.notification.findMany({
        where: { receiverId: session.user.id },
        orderBy: { createdAt: "desc" },
        take: limit,
        include: {
          sender: { select: { name: true, avatar: true } },
        },
      }),
      db.notification.count({
        where: { receiverId: session.user.id, isRead: false },
      }),
    ]);

    return NextResponse.json({ notifications, unreadCount });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
