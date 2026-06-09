import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { validate, albumSchema } from "@/lib/validations";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get("eventId");
    if (!eventId) return NextResponse.json({ error: "eventId required" }, { status: 400 });

    const albums = await db.album.findMany({
      where: { eventId },
      include: {
        _count: { select: { media: true } },
        createdBy: { select: { name: true, avatar: true } },
        media: { take: 4, orderBy: { createdAt: "desc" }, select: { thumbnailUrl: true, url: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ albums });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { data, error } = validate(albumSchema, body);
    if (error) return NextResponse.json({ error }, { status: 400 });

    const event = await db.event.findUnique({ where: { id: data!.eventId } });
    if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

    const album = await db.album.create({
      data: {
        name: data!.name,
        description: data!.description,
        isPublic: data!.isPublic,
        eventId: data!.eventId,
        createdById: session.user.id,
      },
    });

    return NextResponse.json({ album }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
