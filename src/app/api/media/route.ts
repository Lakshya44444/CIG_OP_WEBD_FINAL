import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const { searchParams } = new URL(req.url);

    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const type = searchParams.get("type");
    const sort = searchParams.get("sort") || "newest";
    const eventId = searchParams.get("eventId");
    const q = searchParams.get("q");
    const tags = searchParams.get("tags")?.split(",").filter(Boolean) || [];

    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (!session) {
      // Not logged in — public only
      where.isPublic = true;
    } else if (session.user?.role === "ADMIN") {
      // Super admin sees everything
    } else if (session.user?.role === "CLUB_ADMIN") {
      // Club admin sees public media + private media of their clubs
      const adminEvents = await db.eventAdmin.findMany({
        where: { userId: session.user.id },
        select: { eventId: true },
      });
      const adminEventIds = adminEvents.map((e) => e.eventId);
      where.OR = [
        { isPublic: true },
        { eventId: { in: adminEventIds } },
      ];
    } else if (session.user?.role === "PHOTOGRAPHER") {
      // Photographer: public events + private events they're EventMember of
      // but never see memberOnly=true media (casual member uploads)
      const memberships = await db.eventMember.findMany({
        where: { userId: session.user.id },
        select: { eventId: true },
      });
      const memberEventIds = memberships.map((m) => m.eventId);
      if (memberEventIds.length > 0) {
        where.OR = [
          { isPublic: true, memberOnly: false },
          { eventId: { in: memberEventIds }, memberOnly: false },
        ];
      } else {
        where.isPublic = true;
        where.memberOnly = false;
      }
    } else {
      // VIEWER: public non-memberOnly media + all media (including memberOnly) for their EventMember events
      const memberships = await db.eventMember.findMany({
        where: { userId: session.user.id },
        select: { eventId: true },
      });
      const memberEventIds = memberships.map((m) => m.eventId);
      if (memberEventIds.length > 0) {
        where.OR = [
          { isPublic: true, memberOnly: false },
          { eventId: { in: memberEventIds } }, // full access including memberOnly
        ];
      } else {
        where.isPublic = true;
        where.memberOnly = false;
      }
    }

    if (type && type !== "ALL") where.type = type;
    if (eventId) where.eventId = eventId;

    if (q) {
      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        { aiTags: { has: q.toLowerCase() } },
      ];
    }

    if (tags.length > 0) {
      where.aiTags = { hasSome: tags };
    }

    const orderBy =
      sort === "oldest" ? { createdAt: "asc" as const } :
      sort === "most_liked" ? { likes: { _count: "desc" as const } } :
      { createdAt: "desc" as const };

    const [media, total] = await Promise.all([
      db.media.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          uploadedBy: { select: { name: true, avatar: true } },
          event: { select: { name: true, id: true } },
          _count: { select: { likes: true, comments: true } },
          ...(session && {
            likes: { where: { userId: session.user.id }, select: { id: true } },
            favorites: { where: { userId: session.user.id }, select: { id: true } },
          }),
        },
      }),
      db.media.count({ where }),
    ]);

    type MediaWithRelations = typeof media[number] & {
      likes?: { id: string }[];
      favorites?: { id: string }[];
    };
    const formatted = (media as MediaWithRelations[]).map((m) => ({
      ...m,
      isLiked: (m.likes?.length ?? 0) > 0,
      isFavorited: (m.favorites?.length ?? 0) > 0,
    }));

    return NextResponse.json({
      media: formatted,
      total,
      hasMore: skip + limit < total,
      page,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
