import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";

// Cache for 60 seconds — public events only (no user context in cache)
export const getCachedEvents = unstable_cache(
  async (filters: { category?: string; sort?: string; q?: string }) => {
    const { category, sort = "date_desc", q } = filters;
    return db.event.findMany({
      where: {
        AND: [
          { isPublic: true },
          q ? { OR: [{ name: { contains: q, mode: "insensitive" as const } }, { description: { contains: q, mode: "insensitive" as const } }] } : {},
          category ? { category: category as never } : {},
        ],
      },
      orderBy:
        sort === "name_asc" ? { name: "asc" as const } :
        sort === "name_desc" ? { name: "desc" as const } :
        sort === "date_asc" ? { date: "asc" as const } :
        { date: "desc" as const },
      include: {
        _count: { select: { media: true, albums: true } },
        createdBy: { select: { name: true, avatar: true } },
      },
    });
  },
  ["events-list"],
  { revalidate: 60 }
);

// Cache dashboard counts for 30 seconds
export const getCachedDashboardStats = unstable_cache(
  async () => {
    const [eventsCount, mediaCount, likesCount] = await Promise.all([
      db.event.count(),
      db.media.count(),
      db.like.count(),
    ]);
    return { eventsCount, mediaCount, likesCount };
  },
  ["dashboard-stats"],
  { revalidate: 30 }
);

// Cache recent public events for dashboard (global cache — private events excluded)
export const getCachedRecentEvents = unstable_cache(
  async () => {
    return db.event.findMany({
      where: { isPublic: true },
      orderBy: { createdAt: "desc" },
      take: 4,
      include: {
        _count: { select: { media: true } },
        createdBy: { select: { name: true, avatar: true } },
      },
    });
  },
  ["recent-events"],
  { revalidate: 30 }
);
