"use client";

import React, { useState, useEffect, useRef } from "react";
import { Users, Search, X, Plus, ChevronDown, ChevronUp, Crown } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import toast from "react-hot-toast";

interface Member {
  id: string;
  userId: string;
  user: { id: string; name: string; email: string; avatar: string | null };
}

interface SearchUser {
  id: string;
  name: string;
  email: string;
  username: string;
  avatar: string | null;
  role: string;
}

interface Props {
  eventId: string;
  eventName: string;
}

export default function EventMemberManager({ eventId, eventName }: Props) {
  const [open, setOpen] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);
  const searchRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (open) loadMembers();
  }, [open]);

  async function loadMembers() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/event-member?eventId=${eventId}`);
      const data = await res.json();
      setMembers(data.members || []);
    } finally {
      setLoading(false);
    }
  }

  function handleSearch(value: string) {
    setQuery(value);
    if (searchRef.current) clearTimeout(searchRef.current);
    if (value.length < 2) { setResults([]); return; }
    setSearching(true);
    searchRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/users/search?q=${encodeURIComponent(value)}`);
        const data = await res.json();
        // Exclude already-members
        const memberIds = new Set(members.map((m) => m.userId));
        setResults((data.users || []).filter((u: SearchUser) => !memberIds.has(u.id)));
      } finally {
        setSearching(false);
      }
    }, 300);
  }

  async function addMember(user: SearchUser) {
    setAdding(user.id);
    try {
      const res = await fetch("/api/admin/event-member", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, eventId }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`${user.name} added to ${eventName}`);
        setMembers((prev) => [...prev, data.member]);
        setResults((prev) => prev.filter((u) => u.id !== user.id));
        setQuery("");
      } else {
        toast.error(data.error || "Failed to add member");
      }
    } finally {
      setAdding(null);
    }
  }

  async function removeMember(userId: string, userName: string) {
    try {
      await fetch("/api/admin/event-member", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, eventId }),
      });
      setMembers((prev) => prev.filter((m) => m.userId !== userId));
      toast.success(`${userName} removed from ${eventName}`);
    } catch {
      toast.error("Failed to remove member");
    }
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
      {/* Header — always visible */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-green-500" />
          <span className="font-semibold text-gray-900 text-sm">Club Members</span>
          {members.length > 0 && (
            <span className="inline-flex items-center justify-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
              {members.length}
            </span>
          )}
        </div>
        {open ? (
          <ChevronUp className="h-4 w-4 text-gray-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-400" />
        )}
      </button>

      {open && (
        <div className="border-t border-gray-100 px-5 pb-5 space-y-4">
          {/* Search to add */}
          <div className="pt-4">
            <p className="text-xs text-gray-500 mb-2">Search by name, email or username to add a member:</p>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search users..."
                className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-8 pr-3 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent"
              />
              {searching && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 rounded-full border-2 border-green-400 border-t-transparent animate-spin" />
              )}
            </div>

            {/* Search results dropdown */}
            {results.length > 0 && (
              <div className="mt-1 rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
                {results.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 border-b border-gray-100 last:border-0"
                  >
                    <Avatar className="h-7 w-7 shrink-0">
                      <AvatarImage src={user.avatar || ""} />
                      <AvatarFallback className="text-xs bg-gray-100">{user.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                      <p className="text-xs text-gray-400 truncate">{user.email}</p>
                    </div>
                    <button
                      onClick={() => addMember(user)}
                      disabled={adding === user.id}
                      className="shrink-0 flex items-center gap-1 rounded-lg bg-green-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50 transition"
                    >
                      <Plus className="h-3 w-3" />
                      {adding === user.id ? "Adding…" : "Add"}
                    </button>
                  </div>
                ))}
              </div>
            )}

            {query.length >= 2 && !searching && results.length === 0 && (
              <p className="mt-2 text-xs text-gray-400 text-center">No users found</p>
            )}
          </div>

          {/* Current members list */}
          {loading ? (
            <p className="text-xs text-gray-400 text-center py-2">Loading members…</p>
          ) : members.length > 0 ? (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2">Current members ({members.length})</p>
              <div className="space-y-1.5">
                {members.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2"
                  >
                    <Avatar className="h-6 w-6 shrink-0">
                      <AvatarImage src={m.user.avatar || ""} />
                      <AvatarFallback className="text-xs bg-green-100 text-green-700">{m.user.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-800 truncate">{m.user.name}</p>
                      <p className="text-xs text-gray-400 truncate">{m.user.email}</p>
                    </div>
                    <button
                      onClick={() => removeMember(m.userId, m.user.name)}
                      className="shrink-0 text-gray-300 hover:text-red-500 transition"
                      title="Remove member"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <Crown className="h-6 w-6 text-gray-300 mx-auto mb-1" />
              <p className="text-xs text-gray-400">No members yet. Add people above to give them access to private photos.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
