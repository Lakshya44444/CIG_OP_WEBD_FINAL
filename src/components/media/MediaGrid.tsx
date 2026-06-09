"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Heart, MessageCircle, Download, Bookmark, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

interface MediaItem {
  id: string;
  url: string;
  thumbnailUrl?: string | null;
  type: string;
  title?: string | null;
  aiTags: string[];
  isLiked: boolean;
  isFavorited: boolean;
  _count: { likes: number; comments: number };
  uploadedBy: { name: string; avatar?: string | null };
}

interface Props {
  media: MediaItem[];
  currentUserId: string;
  layout?: "masonry" | "grid";
}

export default function MediaGrid({ media, currentUserId, layout = "masonry" }: Props) {
  const [liked, setLiked] = useState<Record<string, boolean>>(
    Object.fromEntries(media.map((m) => [m.id, m.isLiked]))
  );
  const [counts, setCounts] = useState<Record<string, number>>(
    Object.fromEntries(media.map((m) => [m.id, m._count.likes]))
  );

  async function toggleLike(e: React.MouseEvent, mediaId: string) {
    e.preventDefault();
    e.stopPropagation();

    const wasLiked = liked[mediaId];
    setLiked((prev) => ({ ...prev, [mediaId]: !wasLiked }));
    setCounts((prev) => ({ ...prev, [mediaId]: prev[mediaId] + (wasLiked ? -1 : 1) }));

    try {
      const res = await fetch("/api/social/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mediaId }),
      });
      if (!res.ok) {
        setLiked((prev) => ({ ...prev, [mediaId]: wasLiked }));
        setCounts((prev) => ({ ...prev, [mediaId]: prev[mediaId] + (wasLiked ? 1 : -1) }));
      }
    } catch {
      setLiked((prev) => ({ ...prev, [mediaId]: wasLiked }));
    }
  }

  async function toggleFavorite(e: React.MouseEvent, mediaId: string) {
    e.preventDefault();
    e.stopPropagation();
    try {
      const res = await fetch("/api/social/favorite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mediaId }),
      });
      if (res.ok) {
        toast.success("Added to favorites");
      }
    } catch {}
  }

  if (media.length === 0) {
    return (
      <div className="py-16 text-center">
        <div className="h-16 w-16 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
          <Download className="h-8 w-8 text-gray-300" />
        </div>
        <p className="text-gray-400">No photos yet</p>
      </div>
    );
  }

  if (layout === "masonry") {
    return (
      <div className="masonry-grid">
        {media.map((item) => (
          <div key={item.id} className="masonry-item group relative overflow-hidden rounded-xl border border-gray-200 cursor-pointer hover:border-violet-500/30 transition-all">
            <Link href={`/media/${item.id}`}>
              {item.type === "VIDEO" ? (
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.thumbnailUrl || item.url}
                    alt={item.title || ""}
                    className="w-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black/60 backdrop-blur">
                      <Play className="h-5 w-5 text-gray-900 fill-white" />
                    </div>
                  </div>
                </div>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.thumbnailUrl || item.url}
                  alt={item.title || ""}
                  className="w-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
              )}

              {/* Hover overlay */}
              <div className="absolute inset-0 bg-linear-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => toggleLike(e, item.id)}
                        className={cn(
                          "flex items-center gap-1 text-xs transition-colors",
                          liked[item.id] ? "text-red-400" : "text-gray-600 hover:text-red-400"
                        )}
                      >
                        <Heart className={cn("h-4 w-4", liked[item.id] && "fill-current")} />
                        {counts[item.id]}
                      </button>
                      <span className="flex items-center gap-1 text-xs text-gray-600">
                        <MessageCircle className="h-4 w-4" />
                        {item._count.comments}
                      </span>
                    </div>
                    <button
                      onClick={(e) => toggleFavorite(e, item.id)}
                      className="text-gray-600 hover:text-yellow-400 transition-colors"
                    >
                      <Bookmark className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* AI tags */}
              {item.aiTags.length > 0 && (
                <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex flex-wrap gap-1">
                    {item.aiTags.slice(0, 2).map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-violet-500/80 px-1.5 py-0.5 text-[10px] text-gray-900 backdrop-blur"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </Link>
          </div>
        ))}
      </div>
    );
  }

  // Grid layout
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
      {media.map((item) => (
        <Link key={item.id} href={`/media/${item.id}`}>
          <div className="group relative aspect-square overflow-hidden rounded-xl border border-gray-200 hover:border-violet-500/30 transition-all">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.thumbnailUrl || item.url}
              alt={item.title || ""}
              className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="absolute bottom-2 left-2 flex items-center gap-2 text-xs text-gray-900">
                <Heart className={cn("h-3.5 w-3.5", liked[item.id] && "fill-red-400 text-red-400")} />
                {counts[item.id]}
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
