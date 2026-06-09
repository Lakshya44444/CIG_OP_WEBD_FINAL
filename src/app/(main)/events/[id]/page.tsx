import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import Link from "next/link";
import {
  Calendar, MapPin, Upload, Image, Edit, Globe, Lock,
  Camera, ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate, EVENT_CATEGORIES } from "@/lib/utils";
import { getEventCoverImage } from "@/lib/placeholder-images";
import MediaGrid from "@/components/media/MediaGrid";
import QRCodeShare from "@/components/events/QRCodeShare";
import EventMemberManager from "@/components/events/EventMemberManager";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EventDetailPage({ params }: PageProps) {
  const session = await auth();
  if (!session) redirect("/login");

  const { id } = await params;

  // Check club membership first (needed for media filtering)
  const [clubAdminRecord, memberRecord] = await Promise.all([
    db.eventAdmin.findUnique({ where: { userId_eventId: { userId: session.user.id, eventId: id } } }),
    db.eventMember.findUnique({ where: { userId_eventId: { userId: session.user.id, eventId: id } } }),
  ]);

  const isClubAdmin = session.user?.role === "ADMIN" || !!clubAdminRecord;
  const isEventMember = !!memberRecord; // direct EventMember (any role)

  // EventMembers and admins can see ALL media (including memberOnly uploads by regular members).
  // Photographers (not EventMember) and unauthenticated viewers see only memberOnly=false media.
  const canSeeAllMedia = isClubAdmin || isEventMember;

  // Media filter: admins/members see everything; others see only non-memberOnly media
  const mediaFilter = canSeeAllMedia ? {} : { memberOnly: false };

  const event = await db.event.findUnique({
    where: { id },
    include: {
      createdBy: { select: { id: true, name: true, avatar: true, username: true } },
      albums: {
        include: { _count: { select: { media: true } } },
        orderBy: { createdAt: "desc" },
      },
      media: {
        where: mediaFilter,
        orderBy: { createdAt: "desc" },
        include: {
          uploadedBy: { select: { id: true, name: true, avatar: true } },
          _count: { select: { likes: true, comments: true } },
          likes: { where: { userId: session.user.id }, select: { id: true } },
          favorites: { where: { userId: session.user.id }, select: { id: true } },
        },
      },
      _count: { select: { media: true, albums: true } },
    },
  });

  if (!event) notFound();

  // Private events: only admins and EventMembers can access
  if (!event.isPublic && !canSeeAllMedia) redirect("/events");

  const categoryLabel = EVENT_CATEGORIES.find((c) => c.value === event.category)?.label || event.category;
  const canEdit = isClubAdmin || event.createdById === session.user?.id;
  // Admins and EventMembers can upload; photographers can also upload to public events
  const canUpload =
    isClubAdmin ||
    isEventMember ||
    (session.user?.role === "PHOTOGRAPHER" && event.isPublic);

  return (
    <div className="page-container py-8 space-y-6">
      {/* Back */}
      <Link href="/events">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="h-4 w-4" />
          All Events
        </Button>
      </Link>

      {/* Event Header */}
      <div className="relative rounded-2xl overflow-hidden border border-gray-200">
        {/* Cover Image */}
        <div className="relative h-48 sm:h-64 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={event.coverImage || getEventCoverImage(event.category)}
            alt={event.name}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent" />
        </div>

        {/* Event Info */}
        <div className="relative px-6 pb-6 -mt-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="default">{categoryLabel}</Badge>
                {event.isPublic ? (
                  <Badge variant="success"><Globe className="h-3 w-3" /> Public</Badge>
                ) : (
                  <Badge variant="warning"><Lock className="h-3 w-3" /> Private</Badge>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">{event.name}</h1>
              {event.description && (
                <p className="text-white/70 mt-2 max-w-2xl">{event.description}</p>
              )}
              <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-white/60">
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  {formatDate(event.date)}
                </span>
                {event.location && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4" />
                    {event.location}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Image className="h-4 w-4" />
                  {event._count.media} photos
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <QRCodeShare eventId={event.id} eventName={event.name} />
              {canEdit && (
                <Link href={`/events/${event.id}/edit`}>
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4" />
                    Edit
                  </Button>
                </Link>
              )}
              {canUpload && (
                <Link href={`/upload?eventId=${event.id}`}>
                  <Button size="sm" variant="glow">
                    <Upload className="h-4 w-4" />
                    Upload
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Albums */}
      {event.albums.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Albums</h2>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {event.albums.map((album) => (
              <Link key={album.id} href={`/albums/${album.id}`}>
                <div className="shrink-0 w-40 rounded-xl border border-gray-200 bg-gray-50 p-3 hover:border-violet-500/30 transition-colors cursor-pointer">
                  <div className="h-20 rounded-lg bg-linear-to-br from-violet-600/20 to-indigo-600/20 mb-2 flex items-center justify-center">
                    <Camera className="h-6 w-6 text-violet-400/50" />
                  </div>
                  <p className="text-sm font-medium text-gray-900 truncate">{album.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{album._count.media} photos</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Club Member Management — visible to Club Admin and Super Admin only */}
      {canEdit && (
        <EventMemberManager eventId={event.id} eventName={event.name} />
      )}

      {/* Media Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">All Photos & Videos</h2>
          <span className="text-sm text-gray-400">{event._count.media} items</span>
        </div>
        <MediaGrid
          media={event.media.map((m) => ({
            ...m,
            isLiked: m.likes.length > 0,
            isFavorited: m.favorites.length > 0,
          }))}
          currentUserId={session.user.id}
        />
      </div>
    </div>
  );
}
