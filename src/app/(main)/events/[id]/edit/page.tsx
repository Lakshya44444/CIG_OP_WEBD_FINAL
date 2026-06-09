"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Calendar, MapPin, Globe, Lock, ArrowLeft, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import LocationInput from "@/components/ui/location-input";
import { EVENT_CATEGORIES } from "@/lib/utils";
import Link from "next/link";
import toast from "react-hot-toast";

export default function EditEventPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = params.id as string;

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [form, setForm] = useState({
    name: "", description: "", date: "", location: "", category: "OTHER", isPublic: true,
  });

  useEffect(() => {
    fetch(`/api/events/${eventId}`)
      .then((r) => r.json())
      .then(({ event }) => {
        if (event) {
          setForm({
            name: event.name || "",
            description: event.description || "",
            date: new Date(event.date).toISOString().split("T")[0],
            location: event.location || "",
            category: event.category || "OTHER",
            isPublic: event.isPublic,
          });
        }
      })
      .catch(() => toast.error("Failed to load event"))
      .finally(() => setFetching(false));
  }, [eventId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.date) { toast.error("Name and date are required"); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/events/${eventId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Update failed"); return; }
      toast.success("Event updated!");
      router.push(`/events/${eventId}`);
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (fetching) {
    return (
      <div className="page-container py-8 max-w-2xl flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="page-container py-8 max-w-2xl">
      <div className="flex items-center gap-3 mb-8">
        <Link href={`/events/${eventId}`}>
          <Button variant="ghost" size="icon-sm"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Event</h1>
          <p className="text-gray-500 text-sm mt-0.5">Update event details</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 space-y-5 shadow-sm">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Event Name *</label>
            <Input placeholder="Annual Photography Workshop" value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              icon={<Calendar className="h-4 w-4" />} />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Description</label>
            <Textarea placeholder="What is this event about?" value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Date *</label>
              <Input type="date" value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                icon={<Calendar className="h-4 w-4" />} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Location</label>
              <LocationInput value={form.location}
                onChange={(val) => setForm({ ...form, location: val })} />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Category</label>
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500">
              {EVENT_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Visibility</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: true, icon: Globe, label: "Public", desc: "Anyone can view" },
                { value: false, icon: Lock, label: "Private", desc: "Members only" },
              ].map(({ value, icon: Icon, label, desc }) => (
                <button key={label} type="button" onClick={() => setForm({ ...form, isPublic: value })}
                  className={`flex items-center gap-3 rounded-xl border p-4 transition-all text-left ${
                    form.isPublic === value ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-500 hover:border-gray-300"
                  }`}>
                  <Icon className="h-5 w-5" />
                  <div>
                    <p className="font-medium text-sm">{label}</p>
                    <p className="text-xs opacity-60">{desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <Link href={`/events/${eventId}`}><Button variant="outline">Cancel</Button></Link>
          <Button type="submit" loading={loading}>
            <Save className="h-4 w-4" /> Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
}
