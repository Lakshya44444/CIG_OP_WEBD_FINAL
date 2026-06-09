"use client";

import React, { useState, useRef, useEffect } from "react";
import { Tag, Search, X, UserPlus, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import toast from "react-hot-toast";

interface TaggedUser {
  id: string;
  name: string;
  username: string;
  avatar?: string | null;
}

interface Props {
  mediaId: string;
  initialTags: TaggedUser[];
  currentUserId: string;
  uploaderId: string;
}

export default function TagFriend({ mediaId, initialTags, currentUserId, uploaderId }: Props) {
  const [tags, setTags] = useState<TaggedUser[]>(initialTags);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<TaggedUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [tagging, setTagging] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  async function searchUsers(q: string) {
    if (q.length < 2) { setResults([]); return; }
    setSearching(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&type=users`);
      const data = await res.json();
      setResults(data.users || []);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => searchUsers(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  async function addTag(user: TaggedUser) {
    if (tags.find((t) => t.id === user.id)) {
      toast("Already tagged"); return;
    }
    setTagging(user.id);
    try {
      const res = await fetch("/api/social/tag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mediaId, taggedUserId: user.id }),
      });
      if (res.ok) {
        setTags((prev) => [...prev, user]);
        toast.success(`Tagged @${user.username}`);
        setQuery("");
        setResults([]);
      } else {
        const d = await res.json();
        toast.error(d.error || "Failed to tag");
      }
    } catch {
      toast.error("Failed to tag");
    } finally {
      setTagging(null);
    }
  }

  async function removeTag(userId: string) {
    try {
      await fetch("/api/social/tag", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mediaId, taggedUserId: userId }),
      });
      setTags((prev) => prev.filter((t) => t.id !== userId));
    } catch {}
  }

  const canTag = currentUserId === uploaderId;

  return (
    <div className="space-y-2" ref={ref}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-gray-400 flex items-center gap-1.5">
          <Tag className="h-3.5 w-3.5" /> Tagged People
        </p>
        {canTag && (
          <button
            onClick={() => setOpen(!open)}
            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
          >
            <UserPlus className="h-3.5 w-3.5" />
            Tag someone
          </button>
        )}
      </div>

      {/* Tag search dropdown */}
      {open && canTag && (
        <div className="rounded-xl border border-gray-200 bg-white shadow-lg p-3 space-y-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or username…"
              className="w-full rounded-lg border border-gray-200 bg-gray-50 pl-8 pr-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {searching && <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 animate-spin text-gray-400" />}
          </div>

          {results.length > 0 && (
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {results.map((user) => (
                <button
                  key={user.id}
                  onClick={() => addTag(user)}
                  disabled={!!tagging || !!tags.find((t) => t.id === user.id)}
                  className="flex items-center gap-2.5 w-full rounded-lg px-2 py-1.5 hover:bg-gray-50 transition-colors disabled:opacity-50 text-left"
                >
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={user.avatar || ""} />
                    <AvatarFallback className="text-xs">{user.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                    <p className="text-xs text-gray-400">@{user.username}</p>
                  </div>
                  {tagging === user.id && <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-500" />}
                  {tags.find((t) => t.id === user.id) && (
                    <span className="text-xs text-green-500">Tagged</span>
                  )}
                </button>
              ))}
            </div>
          )}

          {query.length >= 2 && results.length === 0 && !searching && (
            <p className="text-xs text-gray-400 text-center py-2">No users found</p>
          )}
        </div>
      )}

      {/* Display current tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((user) => (
            <div key={user.id} className="flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-100 pl-1 pr-2 py-0.5">
              <Avatar className="h-5 w-5">
                <AvatarImage src={user.avatar || ""} />
                <AvatarFallback className="text-[8px]">{user.name[0]}</AvatarFallback>
              </Avatar>
              <span className="text-xs font-medium text-blue-700">@{user.username}</span>
              {canTag && (
                <button onClick={() => removeTag(user.id)} className="text-blue-400 hover:text-red-500 transition-colors ml-0.5">
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {tags.length === 0 && (
        <p className="text-xs text-gray-400">No one tagged yet</p>
      )}
    </div>
  );
}
