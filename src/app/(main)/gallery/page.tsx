"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Image, LayoutGrid, AlignJustify, Filter, Loader2 } from "lucide-react";
import MediaGrid from "@/components/media/MediaGrid";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";

const MEDIA_TYPES = ["ALL", "IMAGE", "VIDEO"];
const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "most_liked", label: "Most Liked" },
];

export default function GalleryPage() {
  const { data: session } = useSession();
  const [media, setMedia] = useState<Parameters<typeof MediaGrid>[0]["media"]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [layout, setLayout] = useState<"masonry" | "grid">("masonry");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [sort, setSort] = useState("newest");
  const loaderRef = useRef<HTMLDivElement>(null);

  const fetchMedia = useCallback(
    async (pageNum: number, reset = false) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: String(pageNum),
          limit: "20",
          sort,
          ...(typeFilter !== "ALL" && { type: typeFilter }),
        });

        const res = await fetch(`/api/media?${params}`);
        const data = await res.json();

        if (reset) {
          setMedia(data.media || []);
        } else {
          setMedia((prev) => [...prev, ...(data.media || [])]);
        }
        setHasMore(data.hasMore || false);
      } finally {
        setLoading(false);
      }
    },
    [sort, typeFilter]
  );

  // Reset on filter change
  useEffect(() => {
    setPage(1);
    fetchMedia(1, true);
  }, [sort, typeFilter, fetchMedia]);

  // Infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          const nextPage = page + 1;
          setPage(nextPage);
          fetchMedia(nextPage);
        }
      },
      { threshold: 0.1 }
    );

    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [hasMore, loading, page, fetchMedia]);

  return (
    <div className="page-container py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Image className="h-6 w-6 text-violet-400" />
            Gallery
          </h1>
          <p className="text-gray-500 mt-1">Browse all event photos and videos</p>
        </div>

        {/* Layout toggle */}
        <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 p-1">
          <button
            onClick={() => setLayout("masonry")}
            className={cn(
              "rounded-md p-2 transition-colors",
              layout === "masonry" ? "bg-violet-600 text-gray-900" : "text-gray-400 hover:text-gray-900"
            )}
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setLayout("grid")}
            className={cn(
              "rounded-md p-2 transition-colors",
              layout === "grid" ? "bg-violet-600 text-gray-900" : "text-gray-400 hover:text-gray-900"
            )}
          >
            <AlignJustify className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Filter className="h-4 w-4 text-gray-400" />

        {/* Type filter */}
        {MEDIA_TYPES.map((type) => (
          <button
            key={type}
            onClick={() => setTypeFilter(type)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              typeFilter === type
                ? "border-violet-500 bg-violet-500/20 text-violet-300"
                : "border-gray-200 text-gray-500 hover:text-gray-900"
            )}
          >
            {type === "ALL" ? "All Media" : type === "IMAGE" ? "Photos" : "Videos"}
          </button>
        ))}

        <div className="ml-auto">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-500"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value} className="bg-white">{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid */}
      {media.length > 0 ? (
        <MediaGrid
          media={media}
          currentUserId={session?.user?.id || ""}
          layout={layout}
        />
      ) : !loading ? (
        <div className="py-20 text-center">
          <Image className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-400">No media found</p>
        </div>
      ) : null}

      {/* Infinite scroll loader */}
      <div ref={loaderRef} className="flex justify-center py-4">
        {loading && (
          <Loader2 className="h-6 w-6 text-violet-400 animate-spin" />
        )}
        {!hasMore && media.length > 0 && (
          <p className="text-sm text-gray-400">You've seen everything!</p>
        )}
      </div>
    </div>
  );
}
