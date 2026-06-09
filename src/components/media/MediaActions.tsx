"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Heart, Download, Bookmark, Check, Link as LinkIcon, Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

interface Props {
  mediaId: string;
  isLiked: boolean;
  isFavorited: boolean;
  likesCount: number;
  commentsCount: number;
  favoritesCount: number;
  eventName: string;
  currentUserId: string;
  uploaderId: string;
  publicId: string;
}

export default function MediaActions({
  mediaId, isLiked: initialLiked, isFavorited: initialFavorited,
  likesCount: initialLikes, favoritesCount: initialFavs,
  eventName, currentUserId, uploaderId,
}: Props) {
  const router = useRouter();
  const [liked, setLiked] = useState(initialLiked);
  const [favorited, setFavorited] = useState(initialFavorited);
  const [likes, setLikes] = useState(initialLikes);
  const [favs, setFavs] = useState(initialFavs);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const isOwner = currentUserId === uploaderId;

  async function toggleLike() {
    const wasLiked = liked;
    setLiked(!wasLiked);
    setLikes((n) => n + (wasLiked ? -1 : 1));
    try {
      const res = await fetch("/api/social/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mediaId }),
      });
      if (!res.ok) { setLiked(wasLiked); setLikes((n) => n + (wasLiked ? 1 : -1)); }
    } catch {
      setLiked(wasLiked);
    }
  }

  async function toggleFavorite() {
    const wasFav = favorited;
    setFavorited(!wasFav);
    setFavs((n) => n + (wasFav ? -1 : 1));
    try {
      const res = await fetch("/api/social/favorite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mediaId }),
      });
      if (!res.ok) { setFavorited(wasFav); setFavs((n) => n + (wasFav ? 1 : -1)); }
      else toast.success(wasFav ? "Removed from favorites" : "Added to favorites");
    } catch {
      setFavorited(wasFav);
    }
  }

  async function handleDownload() {
    setDownloading(true);
    try {
      const res = await fetch(`/api/media/download?mediaId=${mediaId}`);
      const data = await res.json();
      if (!res.ok) { toast.error("Download failed"); return; }
      const a = document.createElement("a");
      a.href = data.url;
      a.download = `pixora-${mediaId}.jpg`;
      a.target = "_blank";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      if (data.watermarked) toast.success("Downloaded with watermark");
    } catch {
      toast.error("Download failed");
    } finally {
      setDownloading(false);
    }
  }

  async function copyLink() {
    await navigator.clipboard.writeText(`${window.location.origin}/media/${mediaId}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Link copied!");
  }

  async function handleDelete() {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setDeleting(true);
    try {
      const res = await fetch(`/api/media/${mediaId}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Photo deleted");
        // Use window.history to go back then force a full reload so the deleted photo disappears
        window.history.back();
        setTimeout(() => window.location.reload(), 150);
      } else {
        toast.error("Delete failed");
        setConfirmDelete(false);
      }
    } catch {
      toast.error("Delete failed");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-3">
      {/* Social buttons */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={toggleLike}
          className={cn(
            "flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all border",
            liked
              ? "bg-red-50 text-red-500 border-red-200"
              : "bg-gray-50 text-gray-500 border-gray-200 hover:text-red-500 hover:border-red-200"
          )}
        >
          <Heart className={cn("h-4 w-4", liked && "fill-current")} />
          {likes}
        </button>

        <button
          onClick={toggleFavorite}
          className={cn(
            "flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all border",
            favorited
              ? "bg-amber-50 text-amber-500 border-amber-200"
              : "bg-gray-50 text-gray-500 border-gray-200 hover:text-amber-500"
          )}
        >
          <Bookmark className={cn("h-4 w-4", favorited && "fill-current")} />
          {favs > 0 ? favs : "Save"}
        </button>

        <button
          onClick={copyLink}
          className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
        >
          {copied ? <Check className="h-4 w-4 text-green-500" /> : <LinkIcon className="h-4 w-4" />}
          {copied ? "Copied!" : "Copy Link"}
        </button>
      </div>

      {/* Download */}
      <Button variant="outline" className="w-full" onClick={handleDownload} loading={downloading}>
        <Download className="h-4 w-4" />
        Download (with watermark)
      </Button>

      {/* Delete — only for owner */}
      {isOwner && (
        <button
          onClick={handleDelete}
          disabled={deleting}
          className={cn(
            "w-full flex items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-all",
            confirmDelete
              ? "border-red-400 bg-red-50 text-red-600 hover:bg-red-100"
              : "border-gray-200 bg-white text-gray-500 hover:border-red-300 hover:text-red-500"
          )}
        >
          <Trash2 className="h-4 w-4" />
          {deleting ? "Deleting…" : confirmDelete ? "Click again to confirm delete" : "Delete Photo"}
        </button>
      )}
    </div>
  );
}
