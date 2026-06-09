"use client";

import React, { useState, useEffect, useRef } from "react";
import { Bell } from "lucide-react";
import { useSession } from "next-auth/react";
import { formatRelativeTime } from "@/lib/utils";
import { getPusherClient, CHANNELS, EVENTS } from "@/lib/pusher";
import Link from "next/link";

interface Notification {
  id: string;
  type: string;
  message: string;
  isRead: boolean;
  link?: string;
  createdAt: string;
}

export default function NotificationBell() {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!session?.user?.id) return;
    fetchNotifications();

    const pusher = getPusherClient();
    if (!pusher) return;
    const channel = pusher.subscribe(CHANNELS.notifications(session.user.id));
    channel.bind(EVENTS.NEW_NOTIFICATION, (data: Notification) => {
      setNotifications((prev) => [data, ...prev.slice(0, 19)]);
      setUnreadCount((prev) => prev + 1);
    });
    return () => {
      channel.unbind_all();
      pusher.unsubscribe(CHANNELS.notifications(session.user.id));
    };
  }, [session?.user?.id]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function fetchNotifications() {
    try {
      const res = await fetch("/api/notifications?limit=20");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch {}
  }

  async function markAllRead() {
    try {
      await fetch("/api/notifications/read-all", { method: "POST" });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {}
  }

  const typeIcons: Record<string, string> = {
    LIKE: "❤️", COMMENT: "💬", TAG: "🏷️", SHARE: "↗️", FOLLOW: "👤", SYSTEM: "🔔",
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => { setOpen(!open); if (!open && unreadCount > 0) markAllRead(); }}
        className="relative flex h-9 w-9 items-center justify-center rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-80 rounded-xl border border-gray-200 bg-white shadow-lg z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900 text-sm">Notifications</h3>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-xs text-blue-600 hover:text-blue-700">
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-gray-400 text-sm">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-30" />
                No notifications yet
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`flex gap-3 px-4 py-3 hover:bg-gray-50 border-b border-gray-50 last:border-0 ${!n.isRead ? "bg-blue-50/50" : ""}`}
                >
                  <span className="text-lg mt-0.5 shrink-0">{typeIcons[n.type] || "🔔"}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-gray-700 leading-snug">{n.message}</p>
                    <p className="text-xs text-gray-400 mt-1">{formatRelativeTime(n.createdAt)}</p>
                  </div>
                  {!n.isRead && <div className="h-2 w-2 rounded-full bg-blue-500 shrink-0 mt-2" />}
                </div>
              ))
            )}
          </div>

          <div className="border-t border-gray-100 p-2">
            <Link
              href="/notifications"
              className="block w-full text-center text-xs text-blue-600 hover:text-blue-700 py-1"
              onClick={() => setOpen(false)}
            >
              View all notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
