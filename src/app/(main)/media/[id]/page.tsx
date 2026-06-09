import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import Link from "next/link";
import { Calendar, ArrowLeft, Sparkles, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatRelativeTime } from "@/lib/utils";
import MediaActions from "@/components/media/MediaActions";
import CommentSection from "@/components/media/CommentSection";
import TagFriend from "@/components/media/TagFriend";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function MediaDetailPage({ params }: PageProps) {
  const session = await auth();
  if (!session) redirect("/login");

  const { id } = await params;

  // Parallel queries — faster than one big nested query
  const [media, comments] = await Promise.all([
    db.media.findUnique({
      where: { id },
      include: {
        uploadedBy: { select: { id: true, name: true, avatar: true, username: true } },
        event: { select: { id: true, name: true, date: true } },
        _count: { select: { likes: true, comments: true, favorites: true } },
        likes: { where: { userId: session.user.id }, select: { id: true } },
        favorites: { where: { userId: session.user.id }, select: { id: true } },
        tags: { include: { user: { select: { id: true, name: true, username: true, avatar: true } } } },
      },
    }),
    db.comment.findMany({
      where: { mediaId: id },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { user: { select: { name: true, avatar: true, username: true } } },
    }),
  ]);

  if (!media) notFound();

  return (
    <div className="page-container py-6 max-w-5xl">
      <Link href={`/events/${media.event.id}`}>
        <Button variant="ghost" size="sm" className="mb-4">
          <ArrowLeft className="h-4 w-4" />
          {media.event.name}
        </Button>
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Media — left */}
        <div className="lg:col-span-3">
          <div className="rounded-2xl overflow-hidden border border-gray-200 bg-black">
            {media.type === "VIDEO" ? (
              <video
                src={media.url}
                controls
                className="w-full"
                poster={media.thumbnailUrl || undefined}
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={media.url}
                alt={media.title || ""}
                className="w-full object-contain max-h-[70vh]"
              />
            )}
          </div>

          {/* AI Tags */}
          {media.aiTags.length > 0 && (
            <div className="mt-3 space-y-1.5">
              <p className="text-xs font-medium text-gray-400 flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5 text-purple-500" /> AI Tags
              </p>
              <div className="flex flex-wrap gap-1.5">
                {media.aiTags.map((tag) => (
                  <Link key={tag} href={`/search?q=${encodeURIComponent(tag)}`}>
                    <Badge variant="ai" className="cursor-pointer hover:bg-purple-100 transition-colors text-xs">
                      #{tag}
                    </Badge>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Tagged people — interactive */}
          <div className="mt-3">
            <TagFriend
              mediaId={media.id}
              initialTags={media.tags.map((t) => ({
                id: t.user.id,
                name: t.user.name,
                username: t.user.username,
                avatar: t.user.avatar,
              }))}
              currentUserId={session.user.id}
              uploaderId={media.uploadedBy.id}
            />
          </div>
        </div>

        {/* Sidebar — right */}
        <div className="lg:col-span-2 space-y-4">
          {/* Uploader */}
          <div className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 bg-white">
            <Avatar className="h-10 w-10">
              <AvatarImage src={media.uploadedBy.avatar || ""} />
              <AvatarFallback>{media.uploadedBy.name[0]}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-gray-900">{media.uploadedBy.name}</p>
              <p className="text-xs text-gray-400">
                {formatRelativeTime(media.createdAt.toISOString())} ·
                <Link href={`/events/${media.event.id}`} className="ml-1 hover:text-blue-600">
                  {media.event.name}
                </Link>
              </p>
            </div>
          </div>

          {media.title && (
            <h1 className="text-lg font-semibold text-gray-900 px-1">{media.title}</h1>
          )}

          {/* Social actions */}
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <MediaActions
              mediaId={media.id}
              isLiked={media.likes.length > 0}
              isFavorited={media.favorites.length > 0}
              likesCount={media._count.likes}
              commentsCount={media._count.comments}
              favoritesCount={media._count.favorites}
              eventName={media.event.name}
              currentUserId={session.user.id}
              uploaderId={media.uploadedBy.id}
              publicId={media.publicId}
            />
          </div>

          {/* Comments */}
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <CommentSection
              mediaId={media.id}
              initialComments={comments.map((c) => ({
                ...c,
                createdAt: c.createdAt.toISOString(),
                updatedAt: c.updatedAt.toISOString(),
              }))}
              currentUser={session.user}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
