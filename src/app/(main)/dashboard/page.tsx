import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCachedDashboardStats, getCachedRecentEvents } from "@/lib/cache";
import Link from "next/link";
import {
  Calendar, Image, Heart, Upload, TrendingUp,
  Sparkles, Clock, ArrowRight, Camera,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";

export const revalidate = 30;

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/login");

  // Build media visibility filter for "Latest Photos" based on user role
  let mediaVisibility: Record<string, unknown> = {};
  if (session.user?.role === "ADMIN") {
    // sees everything
  } else if (session.user?.role === "CLUB_ADMIN") {
    const adminEvents = await db.eventAdmin.findMany({
      where: { userId: session.user.id },
      select: { eventId: true },
    });
    const ids = adminEvents.map((e) => e.eventId);
    mediaVisibility = { OR: [{ isPublic: true }, { eventId: { in: ids } }] };
  } else if (session.user?.role === "PHOTOGRAPHER") {
    // Photographer: accessible media, never see memberOnly casual uploads
    const memberships = await db.eventMember.findMany({
      where: { userId: session.user.id },
      select: { eventId: true },
    });
    const ids = memberships.map((m) => m.eventId);
    mediaVisibility = ids.length > 0
      ? { OR: [{ isPublic: true, memberOnly: false }, { eventId: { in: ids }, memberOnly: false }] }
      : { isPublic: true, memberOnly: false };
  } else {
    // VIEWER / MEMBER — public non-memberOnly media + all media for their EventMember events
    const memberships = await db.eventMember.findMany({
      where: { userId: session.user.id },
      select: { eventId: true },
    });
    const ids = memberships.map((m) => m.eventId);
    mediaVisibility = ids.length > 0
      ? { OR: [{ isPublic: true, memberOnly: false }, { eventId: { in: ids } }] }
      : { isPublic: true, memberOnly: false };
  }

  // Parallel fetches — cached global stats + user-specific data
  const [stats, recentEvents, recentMedia, userUploads] = await Promise.all([
    getCachedDashboardStats(),
    getCachedRecentEvents(),
    db.media.findMany({
      where: { type: "IMAGE", ...mediaVisibility },
      orderBy: { createdAt: "desc" },
      take: 6,
      select: {
        id: true, url: true, thumbnailUrl: true, title: true,
        _count: { select: { likes: true, comments: true } },
      },
    }),
    db.media.count({ where: { uploadedById: session.user.id } }),
  ]);

  const statCards = [
    { label: "Total Events", value: stats.eventsCount, icon: Calendar, color: "from-violet-500 to-purple-600" },
    { label: "Media Files", value: stats.mediaCount.toLocaleString(), icon: Image, color: "from-pink-500 to-rose-600" },
    { label: "Your Uploads", value: userUploads, icon: Upload, color: "from-blue-500 to-indigo-600" },
    { label: "Total Likes", value: stats.likesCount.toLocaleString(), icon: Heart, color: "from-emerald-500 to-teal-600" },
  ];

  return (
    <div className="page-container py-8 space-y-8">
      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Good day, {session.user?.name?.split(" ")[0]} 👋
          </h1>
          <p className="text-gray-500 mt-1">Here&apos;s what&apos;s happening on Pixora</p>
        </div>
        {session.user?.role !== "VIEWER" && (
          <Link href="/upload">
            <Button>
              <Upload className="h-4 w-4" />
              Upload Media
            </Button>
          </Link>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-xl border border-gray-200 bg-white p-5 hover:shadow-sm transition-shadow">
            <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br ${color} mb-3`}>
              <Icon className="h-5 w-5 text-white" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{value}</div>
            <div className="text-sm text-gray-500 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Events */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-500" />
              Recent Events
            </h2>
            <Link href="/events" className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {recentEvents.length === 0 ? (
              <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
                <Calendar className="h-8 w-8 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">No events yet</p>
                <Link href="/events/new">
                  <Button size="sm" className="mt-3">Create First Event</Button>
                </Link>
              </div>
            ) : (
              recentEvents.map((event) => (
                <Link key={event.id} href={`/events/${event.id}`}>
                  <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 hover:border-blue-200 hover:shadow-sm transition-all">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 border border-blue-100">
                      <Camera className="h-5 w-5 text-blue-500" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 truncate">{event.name}</p>
                      <p className="text-sm text-gray-400 flex items-center gap-1 mt-0.5">
                        <Clock className="h-3 w-3" />
                        {formatDate(event.date)}
                      </p>
                    </div>
                    <div className="text-sm text-gray-400 shrink-0">{event._count.media} photos</div>
                  </div>
                </Link>
              ))
            )}
          </div>

          {/* Quick actions */}
          <div className="grid grid-cols-2 gap-3">
            <Link href="/events/new">
              <div className="flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 hover:bg-blue-100 transition-colors cursor-pointer">
                <Calendar className="h-5 w-5 text-blue-500" />
                <span className="text-sm font-medium text-blue-700">New Event</span>
              </div>
            </Link>
            <Link href="/ai">
              <div className="flex items-center gap-3 rounded-xl border border-purple-200 bg-purple-50 p-4 hover:bg-purple-100 transition-colors cursor-pointer">
                <Sparkles className="h-5 w-5 text-purple-500" />
                <span className="text-sm font-medium text-purple-700">AI Features</span>
              </div>
            </Link>
          </div>
        </div>

        {/* Latest Photos */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              Latest Photos
            </h2>
            <Link href="/gallery" className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
              Gallery <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {recentMedia.slice(0, 6).map((media) => (
              <Link key={media.id} href={`/media/${media.id}`}>
                <div className="relative aspect-square overflow-hidden rounded-xl border border-gray-200 hover:border-blue-300 transition-all group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={media.thumbnailUrl || media.url}
                    alt={media.title || ""}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-1 left-2 flex items-center gap-1 text-white text-xs">
                      <Heart className="h-3 w-3" /> {media._count.likes}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {recentMedia.length === 0 && (
            <div className="rounded-xl border border-gray-200 bg-white p-6 text-center">
              <Image className="h-8 w-8 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">No photos yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
