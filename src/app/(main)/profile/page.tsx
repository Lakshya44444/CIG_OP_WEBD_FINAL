import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import Link from "next/link";
import { Camera, Upload, Heart, Bookmark, Download, Settings, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { formatDate, ROLES } from "@/lib/utils";
import MediaGrid from "@/components/media/MediaGrid";

export default async function ProfilePage() {
  const session = await auth();
  if (!session) redirect("/login");

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    include: {
      _count: {
        select: {
          media: true,
          likes: true,
          favorites: true,
          downloads: true,
          events: true,
        },
      },
    },
  });

  if (!user) redirect("/login");

  const [uploadedMedia, likedMedia, favorites] = await Promise.all([
    db.media.findMany({
      where: { uploadedById: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        uploadedBy: { select: { name: true, avatar: true } },
        event: { select: { name: true } },
        _count: { select: { likes: true, comments: true } },
        likes: { where: { userId: session.user.id }, select: { id: true } },
        favorites: { where: { userId: session.user.id }, select: { id: true } },
      },
    }),
    db.media.findMany({
      where: { likes: { some: { userId: session.user.id } } },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        uploadedBy: { select: { name: true, avatar: true } },
        event: { select: { name: true } },
        _count: { select: { likes: true, comments: true } },
        likes: { where: { userId: session.user.id }, select: { id: true } },
        favorites: { where: { userId: session.user.id }, select: { id: true } },
      },
    }),
    db.media.findMany({
      where: { favorites: { some: { userId: session.user.id } } },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        uploadedBy: { select: { name: true, avatar: true } },
        event: { select: { name: true } },
        _count: { select: { likes: true, comments: true } },
        likes: { where: { userId: session.user.id }, select: { id: true } },
        favorites: { where: { userId: session.user.id }, select: { id: true } },
      },
    }),
  ]);

  const roleInfo = ROLES[user.role as keyof typeof ROLES];
  const initials = user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  const addMediaProps = (media: typeof uploadedMedia) =>
    media.map((m) => ({
      ...m,
      isLiked: m.likes.length > 0,
      isFavorited: m.favorites.length > 0,
    }));

  return (
    <div className="page-container py-8 space-y-6">
      {/* Profile Header */}
      <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
          {/* Avatar */}
          <div className="relative">
            <Avatar className="h-24 w-24 text-2xl">
              <AvatarImage src={user.avatar || ""} />
              <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
            </Avatar>
            {user.referenceImageUrl && (
              <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-green-500 border-2 border-gray-950 flex items-center justify-center">
                <Camera className="h-3 w-3 text-gray-900" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
              <Badge variant="default" className={`${roleInfo?.color} border-0 text-gray-900 text-xs`}>
                {roleInfo?.label || user.role}
              </Badge>
            </div>
            <p className="text-gray-500">@{user.username}</p>
            {user.bio && <p className="text-gray-600 mt-2 max-w-lg">{user.bio}</p>}
            <p className="text-xs text-gray-400 mt-1">Joined {formatDate(user.createdAt)}</p>
          </div>

          <Link href="/profile/settings">
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4" />
              Settings
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-200">
          {[
            { label: "Uploads", value: user._count.media, icon: Upload },
            { label: "Likes Given", value: user._count.likes, icon: Heart },
            { label: "Favorites", value: user._count.favorites, icon: Bookmark },
            { label: "Downloads", value: user._count.downloads, icon: Download },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="text-center">
              <div className="flex items-center justify-center gap-1.5 text-lg font-bold text-gray-900">
                <Icon className="h-4 w-4 text-violet-400" />
                {value}
              </div>
              <p className="text-xs text-gray-400 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="uploads">
        <TabsList>
          <TabsTrigger value="uploads">My Uploads ({user._count.media})</TabsTrigger>
          <TabsTrigger value="liked">Liked</TabsTrigger>
          <TabsTrigger value="favorites">Favorites</TabsTrigger>
        </TabsList>

        <TabsContent value="uploads">
          <MediaGrid
            media={addMediaProps(uploadedMedia)}
            currentUserId={session.user.id}
            layout="grid"
          />
        </TabsContent>

        <TabsContent value="liked">
          <MediaGrid
            media={addMediaProps(likedMedia)}
            currentUserId={session.user.id}
            layout="grid"
          />
        </TabsContent>

        <TabsContent value="favorites">
          <MediaGrid
            media={addMediaProps(favorites)}
            currentUserId={session.user.id}
            layout="grid"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
