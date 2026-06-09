"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { User, AtSign, FileText, Camera, ArrowLeft, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import toast from "react-hot-toast";

export default function ProfileSettingsPage() {
  const { data: session, update: updateSession } = useSession();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [form, setForm] = useState({ name: "", username: "", bio: "" });

  useEffect(() => {
    if (session?.user) {
      setForm({
        name: session.user.name || "",
        username: session.user.username || "",
        bio: "",
      });
      // Fetch current bio
      fetch("/api/profile").then((r) => r.json()).then(({ user }) => {
        if (user?.bio) setForm((f) => ({ ...f, bio: user.bio || "" }));
      });
    }
  }, [session]);

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Avatar must be under 5MB"); return; }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { toast.error("Name is required"); return; }
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("name", form.name);
      formData.append("username", form.username);
      formData.append("bio", form.bio);
      if (avatarFile) formData.append("avatar", avatarFile);

      const res = await fetch("/api/profile", { method: "PUT", body: formData });
      const data = await res.json();

      if (!res.ok) { toast.error(data.error || "Update failed"); return; }

      await updateSession({ name: data.user.name, image: data.user.avatar });
      toast.success("Profile updated!");
      router.push("/profile");
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const initials = form.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "U";

  return (
    <div className="page-container py-8 max-w-lg">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/profile">
          <Button variant="ghost" size="icon-sm"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
          <p className="text-gray-500 text-sm mt-0.5">Update your account information</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Avatar */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">Profile Photo</h3>
          <div className="flex items-center gap-5">
            <div className="relative">
              <Avatar className="h-20 w-20 text-xl">
                <AvatarImage src={avatarPreview || session?.user?.image || ""} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <button type="button" onClick={() => fileRef.current?.click()}
                className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-white shadow-md hover:bg-blue-700 transition-colors">
                <Camera className="h-3.5 w-3.5" />
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Change profile photo</p>
              <p className="text-xs text-gray-400 mt-0.5">JPG, PNG up to 5MB</p>
              {avatarPreview && (
                <button type="button" onClick={() => { setAvatarPreview(null); setAvatarFile(null); }}
                  className="text-xs text-red-500 hover:text-red-600 mt-1">Remove</button>
              )}
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
          <h3 className="font-semibold text-gray-900">Basic Information</h3>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Full Name *</label>
            <Input placeholder="Your full name" value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              icon={<User className="h-4 w-4" />} />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Username</label>
            <Input placeholder="yourusername" value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value.toLowerCase() })}
              icon={<AtSign className="h-4 w-4" />} />
            <p className="text-xs text-gray-400">Letters, numbers, underscores only (3-20 chars)</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Bio</label>
            <Textarea placeholder="Tell people a bit about yourself…" value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              rows={3} />
            <p className="text-xs text-gray-400 text-right">{form.bio.length}/300</p>
          </div>
        </div>

        {/* Email (read-only) */}
        <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
          <p className="text-xs font-medium text-gray-500 mb-1">Email (cannot be changed)</p>
          <p className="text-sm text-gray-700">{session?.user?.email}</p>
        </div>

        <div className="flex gap-3 justify-end">
          <Link href="/profile"><Button variant="outline">Cancel</Button></Link>
          <Button type="submit" loading={loading}>
            <Save className="h-4 w-4" /> Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
}
