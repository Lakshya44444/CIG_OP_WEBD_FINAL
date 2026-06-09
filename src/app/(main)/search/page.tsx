"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Search, Calendar, Image, User, Loader2, Tag } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { useSession } from "next-auth/react";

interface SearchResults {
  events: Array<{ id: string; name: string; date: string; category: string; _count: { media: number } }>;
  media: Array<{ id: string; url: string; thumbnailUrl?: string; title?: string; aiTags: string[]; event: { name: string }; _count: { likes: number } }>;
  users: Array<{ id: string; name: string; username: string; avatar?: string; role: string }>;
}

const POPULAR_TAGS = ["mountains", "crowd", "sports", "indoor", "outdoor", "celebration", "group", "portrait", "beach", "workshop"];

function SearchPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [dateFrom, setDateFrom] = useState(searchParams.get("dateFrom") || "");
  const [dateTo, setDateTo] = useState(searchParams.get("dateTo") || "");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResults | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function doSearch(q: string, from?: string, to?: string) {
    if (q.trim().length < 2 && !from && !to) {
      setResults(null);
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q.trim()) params.set("q", q);
      if (from) params.set("dateFrom", from);
      if (to) params.set("dateTo", to);
      const res = await fetch(`/api/search?${params}`);
      const data = await res.json();
      setResults(data);
    } finally {
      setLoading(false);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setQuery(val);
    clearTimeout(debounceRef.current ?? undefined);
    debounceRef.current = setTimeout(() => {
      router.replace(`/search?q=${encodeURIComponent(val)}`, { scroll: false });
      doSearch(val);
    }, 300);
  }

  useEffect(() => {
    const q = searchParams.get("q") || "";
    if (q) {
      setQuery(q);
      doSearch(q);
    }
  }, []);

  const totalResults = results
    ? results.events.length + results.media.length + results.users.length
    : 0;

  return (
    <div className="page-container py-8 space-y-6 max-w-4xl">
      {/* Search bar */}
      <div className="space-y-3">
        <h1 className="text-2xl font-bold text-gray-900">Discover</h1>
        <Input
          value={query}
          onChange={handleChange}
          placeholder="Search events, photos, tags, people…"
          icon={loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          className="text-base h-12"
        />
        {/* Date filter — search by upload date */}
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span className="text-gray-500 flex items-center gap-1.5">
            <Calendar className="h-4 w-4" /> Filter by date:
          </span>
          <input type="date" value={dateFrom}
            onChange={(e) => { setDateFrom(e.target.value); doSearch(query, e.target.value, dateTo); }}
            className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <span className="text-gray-400">to</span>
          <input type="date" value={dateTo}
            onChange={(e) => { setDateTo(e.target.value); doSearch(query, dateFrom, e.target.value); }}
            className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          {(dateFrom || dateTo) && (
            <button onClick={() => { setDateFrom(""); setDateTo(""); doSearch(query, "", ""); }}
              className="text-xs text-red-500 hover:text-red-600 font-medium">✕ Clear</button>
          )}
        </div>
      </div>

      {/* Popular tags */}
      {!query && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-500 flex items-center gap-1.5">
            <Tag className="h-4 w-4" /> Popular Tags
          </p>
          <div className="flex flex-wrap gap-2">
            {POPULAR_TAGS.map((tag) => (
              <button
                key={tag}
                onClick={() => {
                  setQuery(tag);
                  doSearch(tag);
                }}
                className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-sm text-gray-500 hover:text-gray-900 hover:border-violet-500/50 hover:bg-violet-500/10 transition-colors"
              >
                #{tag}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {results && (
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            {loading ? "Searching…" : `${totalResults} results for "${query}"`}
          </p>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all">All ({totalResults})</TabsTrigger>
              <TabsTrigger value="media">Photos ({results.media.length})</TabsTrigger>
              <TabsTrigger value="events">Events ({results.events.length})</TabsTrigger>
              <TabsTrigger value="users">People ({results.users.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-6">
              {/* Events */}
              {results.events.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-gray-500 flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" /> Events
                  </h3>
                  {results.events.map((e) => (
                    <Link key={e.id} href={`/events/${e.id}`}>
                      <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 p-3 hover:border-violet-500/30 transition-colors">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-600/20">
                          <Calendar className="h-5 w-5 text-violet-400" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{e.name}</p>
                          <p className="text-xs text-gray-400">{formatDate(e.date)} · {e._count.media} photos</p>
                        </div>
                        <Badge variant="secondary" className="ml-auto">{e.category}</Badge>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {/* Media */}
              {results.media.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-gray-500 flex items-center gap-1.5">
                    <Image className="h-4 w-4" /> Photos
                  </h3>
                  <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
                    {results.media.map((m) => (
                      <Link key={m.id} href={`/media/${m.id}`}>
                        <div className="relative group aspect-square rounded-xl overflow-hidden border border-gray-200 hover:border-violet-500/30 transition-all">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={m.thumbnailUrl || m.url}
                            alt={m.title || ""}
                            className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                          />
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Users */}
              {results.users.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-gray-500 flex items-center gap-1.5">
                    <User className="h-4 w-4" /> People
                  </h3>
                  {results.users.map((u) => (
                    <div key={u.id} className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 p-3">
                      <div className="h-10 w-10 rounded-full bg-linear-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-gray-900 font-medium text-sm">
                        {u.name[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{u.name}</p>
                        <p className="text-xs text-gray-400">@{u.username}</p>
                      </div>
                      <Badge variant="secondary" className="ml-auto">{u.role}</Badge>
                    </div>
                  ))}
                </div>
              )}

              {totalResults === 0 && !loading && (
                <div className="py-12 text-center">
                  <Search className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-400">No results for &ldquo;{query}&rdquo;</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="media">
              <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3">
                {results.media.map((m) => (
                  <Link key={m.id} href={`/media/${m.id}`}>
                    <div className="aspect-square rounded-xl overflow-hidden border border-gray-200 hover:border-violet-500/30 transition-all">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={m.thumbnailUrl || m.url} alt="" className="h-full w-full object-cover" />
                    </div>
                  </Link>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="events">
              <div className="space-y-3">
                {results.events.map((e) => (
                  <Link key={e.id} href={`/events/${e.id}`}>
                    <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4 hover:border-violet-500/30 transition-colors">
                      <Calendar className="h-5 w-5 text-violet-400" />
                      <div>
                        <p className="font-medium text-gray-900">{e.name}</p>
                        <p className="text-sm text-gray-400">{formatDate(e.date)}</p>
                      </div>
                      <span className="ml-auto text-sm text-gray-400">{e._count.media} photos</span>
                    </div>
                  </Link>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="users">
              <div className="space-y-3">
                {results.users.map((u) => (
                  <div key={u.id} className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4">
                    <div className="h-12 w-12 rounded-full bg-linear-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-gray-900 font-medium">
                      {u.name[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{u.name}</p>
                      <p className="text-sm text-gray-400">@{u.username} · {u.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense>
      <SearchPageInner />
    </Suspense>
  );
}
