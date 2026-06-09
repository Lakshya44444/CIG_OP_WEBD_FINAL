import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { validate, eventSchema } from "@/lib/validations";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const event = await db.event.findUnique({
      where: { id },
      include: {
        createdBy: { select: { name: true, username: true, avatar: true } },
        albums: { include: { _count: { select: { media: true } } } },
        _count: { select: { media: true } },
      },
    });
    if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });
    return NextResponse.json({ event });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const event = await db.event.findUnique({ where: { id }, select: { createdById: true } });
    if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

    const isOwner = event.createdById === session.user.id;
    const isAdmin = session.user?.role === "ADMIN";
    if (!isOwner && !isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const { data, error } = validate(eventSchema.partial(), body);
    if (error) return NextResponse.json({ error }, { status: 400 });

    const updated = await db.event.update({
      where: { id },
      data: {
        ...(data!.name && { name: data!.name }),
        ...(data!.description !== undefined && { description: data!.description }),
        ...(data!.date && { date: new Date(data!.date) }),
        ...(data!.location !== undefined && { location: data!.location }),
        ...(data!.category && { category: data!.category }),
        ...(data!.isPublic !== undefined && { isPublic: data!.isPublic }),
        ...(data!.coverImage !== undefined && { coverImage: data!.coverImage }),
      },
    });

    return NextResponse.json({ event: updated });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const event = await db.event.findUnique({ where: { id }, select: { createdById: true } });
    if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

    const isOwner = event.createdById === session.user.id;
    const isAdmin = session.user?.role === "ADMIN";
    if (!isOwner && !isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    await db.event.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
