import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { mediaId } = await req.json();
    if (!mediaId) return NextResponse.json({ error: "mediaId required" }, { status: 400 });

    const existing = await db.favorite.findUnique({
      where: { userId_mediaId: { userId: session.user.id, mediaId } },
    });

    if (existing) {
      await db.favorite.delete({ where: { id: existing.id } });
      return NextResponse.json({ favorited: false });
    }

    await db.favorite.create({ data: { userId: session.user.id, mediaId } });
    return NextResponse.json({ favorited: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
