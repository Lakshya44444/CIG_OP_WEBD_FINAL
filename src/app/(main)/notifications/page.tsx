import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { formatRelativeTime } from "@/lib/utils";
import Link from "next/link";
import { Bell, Heart, MessageCircle, Tag, Share2, User } from "lucide-react";

export const dynamic = "force-dynamic";

const TYPE_CONFIG = {
  LIKE: { icon: Heart, color: "text-red-500 bg-red-50", label: "liked your photo" },
  COMMENT: { icon: MessageCircle, color: "text-blue-500 bg-blue-50", label: "commented on your photo" },
  TAG: { icon: Tag, color: "text-purple-500 bg-purple-50", label: "tagged you in a photo" },
  SHARE: { icon: Share2, color: "text-green-500 bg-green-50", label: "shared your photo" },
  FOLLOW: { icon: User, color: "text-indigo-500 bg-indigo-50", label: "started following you" },
  SYSTEM: { icon: Bell, color: "text-gray-500 bg-gray-50", label: "system notification" },
};

export default async function NotificationsPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const notifications = await db.notification.findMany({
    where: { receiverId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      sender: { select: { name: true, avatar: true, username: true } },
    },
  });

  // Mark all as read
  await db.notification.updateMany({
    where: { receiverId: session.user.id, isRead: false },
    data: { isRead: true },
  });

  return (
    <div className="page-container py-8 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600">
          <Bell className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-500 text-sm">{notifications.length} total</p>
        </div>
      </div>

      {notifications.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-16 text-center">
          <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">No notifications yet</p>
          <p className="text-gray-400 text-sm mt-1">When someone likes or comments on your photos, you&apos;ll see it here.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden divide-y divide-gray-100">
          {notifications.map((n) => {
            const config = TYPE_CONFIG[n.type as keyof typeof TYPE_CONFIG] || TYPE_CONFIG.SYSTEM;
            const Icon = config.icon;

            return (
              <Link
                key={n.id}
                href={n.link || (n.mediaId ? `/media/${n.mediaId}` : "/gallery")}
                className="flex items-start gap-4 px-5 py-4 hover:bg-gray-50 transition-colors"
              >
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${config.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-gray-800">
                    {n.sender && (
                      <span className="font-semibold">{n.sender.name} </span>
                    )}
                    {n.message}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">{formatRelativeTime(n.createdAt.toISOString())}</p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
