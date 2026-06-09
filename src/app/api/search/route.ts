import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || "";
    const type = searchParams.get("type") || "all";
    const dateFrom = searchParams.get("dateFrom");   // YYYY-MM-DD
    const dateTo = searchParams.get("dateTo");       // YYYY-MM-DD
    const tag = searchParams.get("tag");             // exact tag filter

    // Require at least a query OR a tag OR a date filter
    if (q.trim().length < 2 && !tag && !dateFrom) {
      return NextResponse.json({ events: [], users: [], media: [] });
    }

    const query = q.toLowerCase().trim();

    // Date range for media
    const dateFilter = (dateFrom || dateTo) ? {
      createdAt: {
        ...(dateFrom && { gte: new Date(dateFrom) }),
        ...(dateTo && { lte: new Date(`${dateTo}T23:59:59.999Z`) }),
      },
    } : {};

    // Build media search conditions
    const mediaWhere = {
      isPublic: true,
      ...dateFilter,
      ...(query || tag ? {
        OR: [
          ...(query ? [
            { title: { contains: query, mode: "insensitive" as const } },
            { aiTags: { has: query } },
            { description: { contains: query, mode: "insensitive" as const } },
            { uploadedBy: { name: { contains: query, mode: "insensitive" as const } } },
            { event: { name: { contains: query, mode: "insensitive" as const } } },
          ] : []),
          ...(tag ? [{ aiTags: { has: tag } }] : []),
        ],
      } : {}),
    };

    const [events, media, users] = await Promise.all([
      type === "all" || type === "events"
        ? db.event.findMany({
            where: {
              OR: query ? [
                { name: { contains: query, mode: "insensitive" } },
                { description: { contains: query, mode: "insensitive" } },
                { location: { contains: query, mode: "insensitive" } },
              ] : [{ name: { not: "" } }],
              ...(dateFrom || dateTo ? {
                date: {
                  ...(dateFrom && { gte: new Date(dateFrom) }),
                  ...(dateTo && { lte: new Date(`${dateTo}T23:59:59.999Z`) }),
                },
              } : {}),
            },
            take: 5,
            include: { _count: { select: { media: true } } },
            orderBy: { date: "desc" },
          })
        : [],

      type === "all" || type === "media"
        ? db.media.findMany({
            where: mediaWhere,
            take: 20,
            orderBy: { createdAt: "desc" },
            include: {
              event: { select: { name: true, id: true } },
              uploadedBy: { select: { name: true, username: true } },
              _count: { select: { likes: true } },
            },
          })
        : [],

      type === "all" || type === "users"
        ? db.user.findMany({
            where: query ? {
              OR: [
                { name: { contains: query, mode: "insensitive" } },
                { username: { contains: query, mode: "insensitive" } },
              ],
            } : { id: { not: "" } },
            take: 5,
            select: { id: true, name: true, username: true, avatar: true, role: true },
          })
        : [],
    ]);

    return NextResponse.json({ events, media, users });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
