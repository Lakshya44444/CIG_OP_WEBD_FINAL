import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const album = await db.album.findUnique({
      where: { id },
      include: {
        media: {
          orderBy: { createdAt: "desc" },
          include: {
            uploadedBy: { select: { name: true, avatar: true } },
            _count: { select: { likes: true } },
          },
        },
        _count: { select: { media: true } },
        createdBy: { select: { name: true, avatar: true } },
        event: { select: { name: true, id: true } },
      },
    });
    if (!album) return NextResponse.json({ error: "Album not found" }, { status: 404 });
    return NextResponse.json({ album });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const album = await db.album.findUnique({ where: { id }, select: { createdById: true } });
    if (!album) return NextResponse.json({ error: "Album not found" }, { status: 404 });

    if (album.createdById !== session.user.id && session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { name, description, isPublic } = await req.json();
    const updated = await db.album.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(isPublic !== undefined && { isPublic }),
      },
    });

    return NextResponse.json({ album: updated });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const album = await db.album.findUnique({ where: { id }, select: { createdById: true } });
    if (!album) return NextResponse.json({ error: "Album not found" }, { status: 404 });

    if (album.createdById !== session.user.id && session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await db.album.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
