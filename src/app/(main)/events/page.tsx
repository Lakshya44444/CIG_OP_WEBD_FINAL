import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import Link from "next/link";
import { Calendar, Plus, MapPin, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate, EVENT_CATEGORIES } from "@/lib/utils";
import { getEventCoverImage } from "@/lib/placeholder-images";
import EventFilters from "@/components/events/EventFilters";

// Dynamic — results depend on user's club memberships
export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{
    category?: string;
    sort?: string;
    q?: string;
  }>;
}

export default async function EventsPage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session) redirect("/login");

  const params = await searchParams;
  const { category, sort = "date_desc", q } = params;

  const orderBy =
    sort === "name_asc" ? { name: "asc" as const } :
    sort === "name_desc" ? { name: "desc" as const } :
    sort === "date_asc" ? { date: "asc" as const } :
    { date: "desc" as const };

  const textFilter = q ? {
    OR: [
      { name: { contains: q, mode: "insensitive" as const } },
      { description: { contains: q, mode: "insensitive" as const } },
    ],
  } : {};
  const categoryFilter = category ? { category: category as never } : {};

  // Build visibility: public events + private events user belongs to
  let visibilityFilter: Record<string, unknown> = { isPublic: true };

  if (session.user?.role === "ADMIN") {
    visibilityFilter = {}; // admin sees all
  } else {
    const [memberEvents, adminEvents] = await Promise.all([
      db.eventMember.findMany({ where: { userId: session.user.id }, select: { eventId: true } }),
      db.eventAdmin.findMany({ where: { userId: session.user.id }, select: { eventId: true } }),
    ]);
    const privateIds = [
      ...memberEvents.map((m) => m.eventId),
      ...adminEvents.map((a) => a.eventId),
    ];
    if (privateIds.length > 0) {
      visibilityFilter = { OR: [{ isPublic: true }, { id: { in: privateIds } }] };
    }
  }

  const events = await db.event.findMany({
    where: { AND: [visibilityFilter, textFilter, categoryFilter] },
    orderBy,
    include: {
      _count: { select: { media: true, albums: true } },
      createdBy: { select: { name: true, avatar: true } },
    },
  });

  const categoryMap = Object.fromEntries(EVENT_CATEGORIES.map((c) => [c.value, c.label]));

  return (
    <div className="page-container py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Calendar className="h-6 w-6 text-violet-400" />
            Events
          </h1>
          <p className="text-gray-500 mt-1">{events.length} event{events.length !== 1 ? "s" : ""} found</p>
        </div>
        {session.user?.role !== "VIEWER" && (
          <Link href="/events/new">
            <Button variant="glow">
              <Plus className="h-4 w-4" />
              Create Event
            </Button>
          </Link>
        )}
      </div>

      {/* Filters */}
      <EventFilters currentCategory={category} currentSort={sort} currentQ={q} />

      {/* Events Grid */}
      {events.length === 0 ? (
        <div className="py-20 text-center">
          <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-500">No events found</h3>
          <p className="text-gray-400 mt-1 text-sm">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {events.map((event) => (
            <Link key={event.id} href={`/events/${event.id}`}>
              <div className="group rounded-2xl border border-gray-200 bg-gray-50 overflow-hidden hover:border-violet-500/30 hover:shadow-lg hover:shadow-gray-200 transition-all duration-300 cursor-pointer">
                {/* Cover */}
                <div className="relative h-40 bg-linear-to-br from-violet-900/40 to-indigo-900/40 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={event.coverImage || getEventCoverImage(event.category)}
                    alt={event.name}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black/50 to-transparent" />

                  {/* Category badge */}
                  <div className="absolute top-3 left-3">
                    <Badge variant="default" className="text-xs">
                      {categoryMap[event.category] || event.category}
                    </Badge>
                  </div>

                  {/* Public/Private badge */}
                  {!event.isPublic && (
                    <div className="absolute top-3 right-3">
                      <Badge variant="warning" className="text-xs">Private</Badge>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 truncate group-hover:text-violet-300 transition-colors">
                    {event.name}
                  </h3>
                  {event.description && (
                    <p className="text-sm text-gray-400 mt-1 line-clamp-2">{event.description}</p>
                  )}
                  <div className="mt-3 flex items-center gap-3 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {formatDate(event.date)}
                    </span>
                    {event.location && (
                      <span className="flex items-center gap-1 truncate">
                        <MapPin className="h-3.5 w-3.5 shrink-0" />
                        {event.location}
                      </span>
                    )}
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="flex items-center gap-1 text-xs text-gray-400">
                      <Image className="h-3.5 w-3.5" />
                      {event._count.media} photos
                    </span>
                    <span className="text-xs text-gray-400">by {event.createdBy.name}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
