"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Sparkles, Camera, Search, Upload, Loader2, User,
  Tag, CheckCircle, Wand2, RefreshCw, ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import Link from "next/link";
import toast from "react-hot-toast";

interface MediaItem {
  id: string;
  url: string;
  thumbnailUrl?: string;
  aiTags: string[];
  event: { name: string };
}

interface MatchedMedia {
  id: string;
  url: string;
  thumbnailUrl?: string;
  event: { name: string; id: string };
}

// ─── Smart Tagging Tab ───────────────────────────────────────────────────────

function SmartTaggingTab() {
  const [photos, setPhotos] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tagging, setTagging] = useState<string | null>(null);
  const [taggedIds, setTaggedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch("/api/media?limit=30&type=IMAGE")
      .then((r) => r.json())
      .then((d) => setPhotos(d.media || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function tagPhoto(mediaId: string) {
    setTagging(mediaId);
    try {
      const res = await fetch("/api/ai/tag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mediaId }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Tagging failed"); return; }

      // Update the photo's tags in state
      setPhotos((prev) =>
        prev.map((p) => (p.id === mediaId ? { ...p, aiTags: data.tags } : p))
      );
      setTaggedIds((prev) => new Set([...prev, mediaId]));
      toast.success(`Generated ${data.tags.length} tags!`);
    } catch {
      toast.error("Tagging failed");
    } finally {
      setTagging(null);
    }
  }

  async function tagAll() {
    const untagged = photos.filter((p) => p.aiTags.length === 0 && !taggedIds.has(p.id));
    if (untagged.length === 0) { toast("All photos already have tags!"); return; }
    toast.success(`Tagging ${untagged.length} photos…`);
    for (const photo of untagged) {
      await tagPhoto(photo.id);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <div className="text-center py-16">
        <ImageIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500 font-medium">No photos yet</p>
        <p className="text-gray-400 text-sm mt-1">Upload some photos first, then use AI tagging here.</p>
        <Link href="/upload">
          <Button className="mt-4">Upload Photos</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <Tag className="h-5 w-5 text-purple-500" />
            Your Photos
          </h3>
          <p className="text-sm text-gray-500 mt-0.5">
            Click <strong>Tag</strong> on any photo to generate AI tags, or tag all at once.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={tagAll}>
          <Wand2 className="h-4 w-4" />
          Tag All Untagged
        </Button>
      </div>

      {/* Info box */}
      <div className="rounded-xl border border-purple-200 bg-purple-50 px-4 py-3 text-sm text-purple-700 flex items-start gap-2">
        <Sparkles className="h-4 w-4 mt-0.5 shrink-0" />
        <span>
          AI uses <strong>Cloudinary Vision</strong> (face detection + color analysis) to generate tags.
          Detects people, groups, outdoor/indoor scenes, lighting and more.
          Tags improve search results across the platform.
        </span>
      </div>

      {/* Photos grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {photos.map((photo) => {
          const isTagging = tagging === photo.id;
          const isDone = photo.aiTags.length > 0; // only show checkmark when tags actually exist

          return (
            <div key={photo.id} className="rounded-xl border border-gray-200 overflow-hidden bg-white hover:shadow-md transition-shadow">
              {/* Image */}
              <div className="relative aspect-square overflow-hidden bg-gray-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.thumbnailUrl || photo.url}
                  alt=""
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
                {isDone && (
                  <div className="absolute top-2 right-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500 shadow">
                      <CheckCircle className="h-4 w-4 text-white" />
                    </div>
                  </div>
                )}
              </div>

              {/* Tags + button */}
              <div className="p-2.5 space-y-2">
                {photo.aiTags.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {photo.aiTags.slice(0, 4).map((tag) => (
                      <span key={tag} className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-medium text-purple-700">
                        #{tag}
                      </span>
                    ))}
                    {photo.aiTags.length > 4 && (
                      <span className="text-[10px] text-gray-400">+{photo.aiTags.length - 4} more</span>
                    )}
                  </div>
                ) : (
                  <p className="text-[11px] text-gray-400">No tags yet</p>
                )}

                <button
                  onClick={() => tagPhoto(photo.id)}
                  disabled={!!tagging}
                  className="w-full flex items-center justify-center gap-1.5 rounded-lg border border-purple-200 bg-purple-50 py-1.5 text-xs font-medium text-purple-700 hover:bg-purple-100 disabled:opacity-50 transition-colors"
                >
                  {isTagging ? (
                    <><Loader2 className="h-3 w-3 animate-spin" /> Analysing… (may take ~15s)</>
                  ) : isDone ? (
                    <><RefreshCw className="h-3 w-3" /> Re-tag</>
                  ) : (
                    <><Sparkles className="h-3 w-3" /> Tag Photo</>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Facial Recognition Tab ──────────────────────────────────────────────────

function FaceSearchTab() {
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [searching, setSearching] = useState(false);
  const [matches, setMatches] = useState<MatchedMedia[]>([]);
  const [referenceUrl, setReferenceUrl] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    fetch("/api/ai/face-search")
      .then((r) => r.json())
      .then((d) => {
        if (d.matches) setMatches(d.matches);
        if (d.referenceImageUrl) setReferenceUrl(d.referenceImageUrl);
        if (d.matches?.length > 0) setSearched(true);
      })
      .catch(() => {});
  }, []);

  const onDrop = useCallback((accepted: File[]) => {
    if (accepted[0]) {
      setSelfieFile(accepted[0]);
      setSelfiePreview(URL.createObjectURL(accepted[0]));
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".jpg", ".jpeg", ".png", ".webp"] },
    maxFiles: 1,
  });

  async function runSearch() {
    if (!selfieFile) { toast.error("Please upload a selfie first"); return; }
    setSearching(true);
    try {
      const formData = new FormData();
      formData.append("selfie", selfieFile);
      const res = await fetch("/api/ai/face-search", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Search failed"); return; }
      setMatches(data.matches || []);
      setReferenceUrl(data.referenceImageUrl);
      setSearched(true);
      if (data.matchCount === 0) {
        toast("No photos found with your face.", { icon: "🔍" });
      } else {
        toast.success(`Found ${data.matchCount} photo(s) with your face!`);
      }
    } catch {
      toast.error("Search failed — please try again");
    } finally {
      setSearching(false);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left — upload selfie */}
      <div className="space-y-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 space-y-4">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <Camera className="h-5 w-5 text-blue-500" />
            Step 1: Upload Your Selfie
          </h3>

          <div
            {...getRootProps()}
            className={`rounded-xl border-2 border-dashed p-8 text-center cursor-pointer transition-all ${
              isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-blue-400 hover:bg-gray-50"
            }`}
          >
            <input {...getInputProps()} />
            {selfiePreview ? (
              <div className="flex flex-col items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={selfiePreview} alt="selfie" className="h-28 w-28 rounded-full object-cover border-4 border-blue-200 shadow" />
                <p className="text-sm text-blue-600 font-medium">Click to change selfie</p>
              </div>
            ) : referenceUrl ? (
              <div className="flex flex-col items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={referenceUrl} alt="reference" className="h-28 w-28 rounded-full object-cover border-4 border-gray-200" />
                <p className="text-sm text-gray-400">Saved selfie · click to update</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center">
                  <User className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-sm text-gray-600 font-medium">Drop your selfie here</p>
                <p className="text-xs text-gray-400">Clear, front-facing photo works best</p>
              </div>
            )}
          </div>

          <Button className="w-full" onClick={runSearch} loading={searching} disabled={!selfieFile}>
            <Search className="h-4 w-4" />
            {searching ? "Scanning photos…" : "Find My Photos"}
          </Button>
        </div>

        {/* How it works */}
        <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 space-y-1.5 text-sm">
          <p className="font-semibold text-blue-800">How it works:</p>
          <ol className="list-decimal list-inside text-blue-700 space-y-1">
            <li>Upload a clear, front-facing selfie</li>
            <li>Cloudinary detects and crops faces in every event photo</li>
            <li>Your face is compared to each detected face using pixel similarity</li>
            <li>Matching photos appear on the right</li>
          </ol>
        </div>
      </div>

      {/* Right — results */}
      <div className="space-y-3">
        <h3 className="font-semibold text-gray-900">
          Your Photos
          {matches.length > 0 && <span className="ml-2 text-sm font-normal text-blue-600">{matches.length} found</span>}
        </h3>

        {searching ? (
          <div className="flex flex-col items-center justify-center py-16 rounded-xl border border-gray-200 bg-white gap-3">
            <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
            <p className="text-gray-500 text-sm">Scanning event photos for your face…</p>
          </div>
        ) : !searched ? (
          <div className="rounded-xl border border-gray-200 bg-white p-10 text-center">
            <User className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Upload a selfie and click <strong>Find My Photos</strong> to get started.</p>
          </div>
        ) : matches.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white p-10 text-center">
            <Search className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm font-medium">No matching photos found</p>
            <p className="text-gray-400 text-xs mt-1">Try uploading more event photos first.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {matches.map((m) => (
              <Link key={m.id} href={`/media/${m.id}`}>
                <div className="group relative rounded-xl overflow-hidden border border-gray-200 hover:border-blue-400 transition-all shadow-sm hover:shadow-md">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={m.thumbnailUrl || m.url}
                    alt=""
                    className="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-2 left-2 right-2">
                      <p className="text-white text-xs font-medium truncate">{m.event.name}</p>
                    </div>
                  </div>
                  <div className="absolute top-2 right-2">
                    <CheckCircle className="h-5 w-5 text-green-400 drop-shadow" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AIFeaturesPage() {
  const { data: session } = useSession();
  const router = useRouter();

  if (session?.user?.role === "VIEWER") {
    return (
      <div className="page-container py-16 space-y-6 max-w-2xl text-center">
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-12">
          <Sparkles className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">AI Features</h2>
          <p className="text-gray-600 mb-6">AI features are only available to Members and Photographers.</p>
          <p className="text-sm text-gray-500">Contact an administrator to upgrade your account.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container py-8 space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-linear-to-br from-purple-500 to-pink-500 shadow-lg shadow-purple-200">
          <Sparkles className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI Features</h1>
          <p className="text-gray-500 text-sm">Powered by Cloudinary Vision · Face Detection · Pixel Comparison</p>
        </div>
      </div>

      <Tabs defaultValue="tags">
        <TabsList>
          <TabsTrigger value="tags" className="flex items-center gap-2">
            <Tag className="h-4 w-4" /> Smart Tagging
          </TabsTrigger>
          <TabsTrigger value="face" className="flex items-center gap-2">
            <User className="h-4 w-4" /> Facial Recognition
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tags">
          <SmartTaggingTab />
        </TabsContent>

        <TabsContent value="face">
          <FaceSearchTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
