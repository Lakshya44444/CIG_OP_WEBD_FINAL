"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, FileText, Globe, Lock, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import LocationInput from "@/components/ui/location-input";
import { EVENT_CATEGORIES } from "@/lib/utils";
import Link from "next/link";
import toast from "react-hot-toast";

export default function NewEventPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    date: "",
    location: "",
    category: "OTHER",
    isPublic: true,
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.date) {
      toast.error("Name and date are required");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to create event");
        return;
      }

      toast.success("Event created!");
      router.push(`/events/${data.event.id}`);
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-container py-8 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Link href="/events">
          <Button variant="ghost" size="icon-sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create Event</h1>
          <p className="text-gray-500 text-sm mt-0.5">Set up a new event to organize your media</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6 space-y-5">
          {/* Event Name */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-600">Event Name *</label>
            <Input
              placeholder="Annual Photography Workshop 2024"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              icon={<Calendar className="h-4 w-4" />}
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-600">Description</label>
            <Textarea
              placeholder="Tell us what this event is about..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
            />
          </div>

          {/* Date & Location */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-600">Date *</label>
              <Input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                icon={<Calendar className="h-4 w-4" />}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-600">Location</label>
              <LocationInput
                value={form.location}
                onChange={(val) => setForm({ ...form, location: val })}
                placeholder="Search city…"
              />
            </div>
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-600">Category</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="flex h-10 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              {EVENT_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value} className="bg-white">
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          {/* Visibility */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-600">Visibility</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setForm({ ...form, isPublic: true })}
                className={`flex items-center gap-3 rounded-xl border p-4 transition-all ${
                  form.isPublic
                    ? "border-violet-500 bg-violet-500/10 text-violet-300"
                    : "border-gray-200 text-gray-500 hover:border-gray-300"
                }`}
              >
                <Globe className="h-5 w-5" />
                <div className="text-left">
                  <p className="font-medium text-sm">Public</p>
                  <p className="text-xs opacity-60">Anyone can view</p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setForm({ ...form, isPublic: false })}
                className={`flex items-center gap-3 rounded-xl border p-4 transition-all ${
                  !form.isPublic
                    ? "border-violet-500 bg-violet-500/10 text-violet-300"
                    : "border-gray-200 text-gray-500 hover:border-gray-300"
                }`}
              >
                <Lock className="h-5 w-5" />
                <div className="text-left">
                  <p className="font-medium text-sm">Private</p>
                  <p className="text-xs opacity-60">Members only</p>
                </div>
              </button>
            </div>
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <Link href="/events">
            <Button variant="outline">Cancel</Button>
          </Link>
          <Button type="submit" loading={loading}>
            <FileText className="h-4 w-4" />
            Create Event
          </Button>
        </div>
      </form>
    </div>
  );
}
