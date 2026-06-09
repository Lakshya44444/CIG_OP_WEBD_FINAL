import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import {
  Users, Image, Calendar, Download, Heart, MessageCircle,
  TrendingUp, Shield, Camera, Zap, Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDate, ROLES } from "@/lib/utils";
import UserRoleManager from "@/components/admin/UserRoleManager";

export default async function AdminPage() {
  const session = await auth();
  if (!session || session.user?.role !== "ADMIN") redirect("/dashboard");

  const [
    totalUsers,
    totalMedia,
    totalEvents,
    totalLikes,
    totalComments,
    totalDownloads,
    recentUsers,
    topMedia,
    storageUsed,
    totalTaggedMedia,
    totalFaceMatches,
    totalVideos,
  ] = await Promise.all([
    db.user.count(),
    db.media.count(),
    db.event.count(),
    db.like.count(),
    db.comment.count(),
    db.download.count(),
    db.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: { id: true, name: true, email: true, avatar: true, role: true, createdAt: true },
    }),
    db.media.findMany({
      orderBy: { likes: { _count: "desc" } },
      take: 5,
      include: {
        _count: { select: { likes: true, comments: true } },
        event: { select: { name: true } },
      },
    }),
    db.media.aggregate({ _sum: { size: true } }),
    db.media.count({ where: { aiTags: { isEmpty: false } } }),
    db.faceMatch.count(),
    db.media.count({ where: { type: "VIDEO" } }),
  ]);

  const storageMB = Math.round((storageUsed._sum.size || 0) / (1024 * 1024));

  const stats = [
    { label: "Total Users", value: totalUsers, icon: Users, color: "from-violet-500 to-purple-600" },
    { label: "Media Files", value: totalMedia, icon: Image, color: "from-pink-500 to-rose-600" },
    { label: "Events", value: totalEvents, icon: Calendar, color: "from-blue-500 to-indigo-600" },
    { label: "Likes", value: totalLikes.toLocaleString(), icon: Heart, color: "from-red-500 to-pink-600" },
    { label: "Comments", value: totalComments.toLocaleString(), icon: MessageCircle, color: "from-emerald-500 to-teal-600" },
    { label: "Downloads", value: totalDownloads.toLocaleString(), icon: Download, color: "from-amber-500 to-orange-600" },
    { label: "Storage Used", value: `${storageMB} MB`, icon: Camera, color: "from-cyan-500 to-sky-600" },
    { label: "AI Tagged Photos", value: totalTaggedMedia, icon: Sparkles, color: "from-purple-500 to-pink-600" },
    { label: "Face Matches", value: totalFaceMatches, icon: Users, color: "from-indigo-500 to-blue-600" },
    { label: "Videos", value: totalVideos, icon: Zap, color: "from-orange-500 to-red-600" },
    { label: "Engagement", value: `${totalLikes + totalComments}`, icon: Zap, color: "from-fuchsia-500 to-violet-600" },
  ];

  return (
    <div className="page-container py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-red-600 to-pink-600">
          <Shield className="h-5 w-5 text-gray-900" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-500 text-sm">Platform analytics and management</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-xl border border-gray-200 bg-gray-50 p-4">
            <div className={`inline-flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-br ${color} mb-3`}>
              <Icon className="h-4 w-4 text-gray-900" />
            </div>
            <div className="text-xl font-bold text-gray-900">{value}</div>
            <div className="text-xs text-gray-400 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Users className="h-4 w-4 text-violet-400" />
              Recent Users
            </h2>
            <TrendingUp className="h-4 w-4 text-gray-400" />
          </div>

          <div className="space-y-2">
            {recentUsers.map((user) => {
              const roleInfo = ROLES[user.role as keyof typeof ROLES];
              const displayRole = user.role === "MEMBER" ? ROLES.VIEWER : roleInfo;
              return (
                <div key={user.id} className="rounded-xl border border-gray-100 bg-white p-3 space-y-2.5">
                  {/* Top row: avatar + name + role badge */}
                  <div className="flex items-center gap-2.5">
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarImage src={user.avatar || ""} />
                      <AvatarFallback className="text-xs bg-violet-100 text-violet-700">{user.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-900 truncate leading-tight">{user.name}</p>
                      <p className="text-xs text-gray-400 truncate">{user.email}</p>
                    </div>
                    <span className={`shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium text-white ${displayRole?.color || "bg-gray-400"}`}>
                      {displayRole?.label || user.role}
                    </span>
                  </div>
                  {/* Bottom row: role controls */}
                  <UserRoleManager userId={user.id} currentRole={user.role} userName={user.name} />
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Media */}
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5 space-y-4">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-pink-400" />
            Most Liked Photos
          </h2>

          <div className="space-y-3">
            {topMedia.map((media, idx) => (
              <div key={media.id} className="flex items-center gap-3">
                <div className="text-lg font-bold text-gray-300 w-6 text-right shrink-0">
                  {idx + 1}
                </div>
                <div className="h-10 w-10 rounded-lg overflow-hidden shrink-0 border border-gray-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={media.thumbnailUrl || media.url}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {media.title || "Untitled"}
                  </p>
                  <p className="text-xs text-gray-400 truncate">{media.event.name}</p>
                </div>
                <div className="shrink-0 flex items-center gap-1.5 text-xs text-gray-500">
                  <Heart className="h-3.5 w-3.5 text-red-400" />
                  {media._count.likes}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
