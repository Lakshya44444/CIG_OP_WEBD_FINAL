import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// Assign a user as admin of a specific event
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Super admin only" }, { status: 403 });
  }

  const { userId, eventId } = await req.json();
  if (!userId || !eventId) {
    return NextResponse.json({ error: "userId and eventId required" }, { status: 400 });
  }

  // Auto-upgrade to CLUB_ADMIN if not already a higher role
  const user = await db.user.findUnique({ where: { id: userId }, select: { role: true } });
  const needsUpgrade = user?.role === "VIEWER" || user?.role === "MEMBER" || user?.role === "PHOTOGRAPHER";

  if (needsUpgrade) {
    await db.user.update({
      where: { id: userId },
      data: { role: "CLUB_ADMIN" },
    });
  }

  // Upsert so re-assigning existing admin always works
  const eventAdmin = await db.eventAdmin.upsert({
    where: { userId_eventId: { userId, eventId } },
    update: {},
    create: { userId, eventId },
    include: {
      user: { select: { name: true, email: true, role: true } },
      event: { select: { name: true } },
    },
  });

  return NextResponse.json({ eventAdmin, roleUpgraded: needsUpgrade }, { status: 201 });
}

// Remove a user as admin of a specific event
export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Super admin only" }, { status: 403 });
  }

  const { userId, eventId } = await req.json();
  if (!userId || !eventId) {
    return NextResponse.json({ error: "userId and eventId required" }, { status: 400 });
  }

  await db.eventAdmin.deleteMany({ where: { userId, eventId } });
  return NextResponse.json({ message: "Removed event admin" });
}

// List all event admins (or for a specific event)
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Super admin only" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const eventId = searchParams.get("eventId");
  const userId = searchParams.get("userId");

  const eventAdmins = await db.eventAdmin.findMany({
    where: {
      ...(eventId ? { eventId } : {}),
      ...(userId ? { userId } : {}),
    },
    include: {
      user: { select: { id: true, name: true, email: true, avatar: true, role: true } },
      event: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ eventAdmins });
}
