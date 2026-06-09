import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const sort = searchParams.get("sort") || "date_desc";
    const q = searchParams.get("q");
    const limit = parseInt(searchParams.get("limit") || "50");

    const events = await db.event.findMany({
      where: {
        AND: [
          q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { description: { contains: q, mode: "insensitive" } }] } : {},
          category ? { category: category as never } : {},
        ],
      },
      orderBy:
        sort === "name_asc" ? { name: "asc" } :
        sort === "name_desc" ? { name: "desc" } :
        sort === "date_asc" ? { date: "asc" } :
        { date: "desc" },
      take: limit,
      include: {
        _count: { select: { media: true } },
        createdBy: { select: { name: true } },
      },
    });

    return NextResponse.json({ events });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (session.user.role === "VIEWER") {
      return NextResponse.json({ error: "Viewers cannot create events" }, { status: 403 });
    }
    // CLUB_ADMIN, PHOTOGRAPHER, ADMIN can create events; VIEWER cannot

    const body = await req.json();

    // Zod validation
    const { validate, eventSchema } = await import("@/lib/validations");
    const { data, error } = validate(eventSchema, body);
    if (error) return NextResponse.json({ error }, { status: 400 });

    const event = await db.event.create({
      data: {
        name: data!.name,
        description: data!.description || null,
        date: new Date(data!.date),
        location: data!.location || null,
        category: data!.category || "OTHER",
        isPublic: data!.isPublic !== false,
        createdById: session.user.id,
      },
    });

    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
