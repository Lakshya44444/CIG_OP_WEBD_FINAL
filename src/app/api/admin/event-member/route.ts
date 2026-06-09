import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// Add a user as member of a specific club/event
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Only ADMIN or CLUB_ADMIN of that event can add members
  const { userId, eventId } = await req.json();
  if (!userId || !eventId) {
    return NextResponse.json({ error: "userId and eventId required" }, { status: 400 });
  }

  const isClubAdmin = session.user.role === "ADMIN" ||
    await db.eventAdmin.findUnique({
      where: { userId_eventId: { userId: session.user.id, eventId } },
    }).then(Boolean);

  if (!isClubAdmin) {
    return NextResponse.json({ error: "Only club admin can add members" }, { status: 403 });
  }

  const member = await db.eventMember.upsert({
    where: { userId_eventId: { userId, eventId } },
    update: {},
    create: { userId, eventId },
    include: {
      user: { select: { name: true, email: true } },
      event: { select: { name: true } },
    },
  });

  return NextResponse.json({ member }, { status: 201 });
}

// Remove a member from a club/event
export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { userId, eventId } = await req.json();
  if (!userId || !eventId) {
    return NextResponse.json({ error: "userId and eventId required" }, { status: 400 });
  }

  const isClubAdmin = session.user.role === "ADMIN" ||
    await db.eventAdmin.findUnique({
      where: { userId_eventId: { userId: session.user.id, eventId } },
    }).then(Boolean);

  if (!isClubAdmin) {
    return NextResponse.json({ error: "Only club admin can remove members" }, { status: 403 });
  }

  await db.eventMember.deleteMany({ where: { userId, eventId } });
  return NextResponse.json({ message: "Member removed" });
}

// List members of an event
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const eventId = searchParams.get("eventId");
  const userId = searchParams.get("userId");

  const members = await db.eventMember.findMany({
    where: {
      ...(eventId ? { eventId } : {}),
      ...(userId ? { userId } : {}),
    },
    include: {
      user: { select: { id: true, name: true, email: true, avatar: true } },
      event: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ members });
}
