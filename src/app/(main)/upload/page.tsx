"use client";

import React, { useState, useCallback, Suspense } from "react";
import { useDropzone } from "react-dropzone";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Upload, X, CheckCircle, AlertCircle, Image, Video,
  Sparkles, FolderOpen, ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatBytes, ACCEPTED_IMAGE_TYPES, MAX_FILE_SIZE } from "@/lib/utils";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import Link from "next/link";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface FileItem {
  file: File;
  id: string;
  preview: string;
  status: "pending" | "uploading" | "done" | "error";
  progress: number;
  error?: string;
  mediaId?: string;
}

function UploadPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const eventId = searchParams.get("eventId") || "";

  const { data: eventsData } = useSWR("/api/events", fetcher);
  const [selectedEventId, setSelectedEventId] = useState(eventId);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [aiTag, setAiTag] = useState(false);

  const onDrop = useCallback((accepted: File[], rejected: { file: File }[]) => {
    if (rejected.length > 0) {
      toast.error(`${rejected.length} file(s) rejected. Check size/format.`);
    }

    const newFiles: FileItem[] = accepted.map((file) => ({
      file,
      id: Math.random().toString(36).slice(2),
      preview: URL.createObjectURL(file),
      status: "pending",
      progress: 0,
    }));

    setFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_IMAGE_TYPES,
    maxSize: MAX_FILE_SIZE,
    multiple: true,
  });

  function removeFile(id: string) {
    setFiles((prev) => {
      const f = prev.find((f) => f.id === id);
      if (f) URL.revokeObjectURL(f.preview);
      return prev.filter((f) => f.id !== id);
    });
  }

  async function uploadAll() {
    if (!selectedEventId) {
      toast.error("Please select an event");
      return;
    }
    if (files.filter((f) => f.status === "pending").length === 0) return;

    setUploading(true);

    for (const item of files.filter((f) => f.status === "pending")) {
      setFiles((prev) =>
        prev.map((f) => (f.id === item.id ? { ...f, status: "uploading", progress: 0 } : f))
      );

      try {
        // Check for duplicates first
        const dupCheck = await fetch("/api/media/check-duplicate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileSize: item.file.size, eventId: selectedEventId, fileName: item.file.name }),
        });
        const dupData = await dupCheck.json();
        if (dupData.isDuplicate) {
          toast(`⚠️ Skipped "${item.file.name}" — duplicate detected`, { icon: "🔄" });
          setFiles((prev) => prev.map((f) => f.id === item.id ? { ...f, status: "error", error: "Duplicate" } : f));
          continue;
        }

        const formData = new FormData();
        formData.append("file", item.file);
        formData.append("eventId", selectedEventId);
        formData.append("aiTag", aiTag.toString());

        const res = await fetch("/api/media/upload", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();

        if (!res.ok) {
          setFiles((prev) =>
            prev.map((f) =>
              f.id === item.id ? { ...f, status: "error", error: data.error } : f
            )
          );
        } else {
          setFiles((prev) =>
            prev.map((f) =>
              f.id === item.id
                ? { ...f, status: "done", progress: 100, mediaId: data.media.id }
                : f
            )
          );
        }
      } catch {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === item.id ? { ...f, status: "error", error: "Upload failed" } : f
          )
        );
      }
    }

    setUploading(false);
    const doneCount = files.filter((f) => f.status === "done").length;
    if (doneCount > 0) toast.success(`${doneCount} file(s) uploaded!`);
  }

  const pendingCount = files.filter((f) => f.status === "pending").length;
  const doneCount = files.filter((f) => f.status === "done").length;
  const errorCount = files.filter((f) => f.status === "error").length;

  return (
    <div className="page-container py-8 max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href={selectedEventId ? `/events/${selectedEventId}` : "/events"}>
          <Button variant="ghost" size="icon-sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Upload Media</h1>
          <p className="text-gray-500 text-sm">Add photos and videos to your event</p>
        </div>
      </div>

      {/* Event selector */}
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-5 space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
          <FolderOpen className="h-4 w-4" />
          Select Event
        </div>
        <select
          value={selectedEventId}
          onChange={(e) => setSelectedEventId(e.target.value)}
          className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-500"
        >
          <option value="" className="bg-white">-- Choose an event --</option>
          {eventsData?.events?.map((event: { id: string; name: string }) => (
            <option key={event.id} value={event.id} className="bg-white">
              {event.name}
            </option>
          ))}
        </select>

        <label className="flex items-center gap-2 cursor-pointer">
          <div
            className={cn(
              "relative h-5 w-9 rounded-full transition-colors",
              aiTag ? "bg-violet-600" : "bg-gray-200"
            )}
            onClick={() => setAiTag(!aiTag)}
          >
            <div
              className={cn(
                "absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform",
                aiTag ? "translate-x-4" : "translate-x-0.5"
              )}
            />
          </div>
          <span className="text-sm text-gray-600">
            <Sparkles className="inline h-3.5 w-3.5 text-violet-400 mr-1" />
            AI auto-tagging
          </span>
        </label>
      </div>

      {/* Drop zone */}
      <div
        {...getRootProps()}
        className={cn(
          "rounded-2xl border-2 border-dashed p-12 text-center cursor-pointer transition-all",
          isDragActive
            ? "border-violet-500 bg-violet-500/10"
            : "border-gray-300 hover:border-violet-500/50 hover:bg-gray-50"
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-br from-violet-600/20 to-indigo-600/20 border border-violet-500/20">
            <Upload className={cn("h-7 w-7 transition-colors", isDragActive ? "text-violet-400" : "text-gray-400")} />
          </div>
          {isDragActive ? (
            <p className="text-lg font-medium text-violet-300">Drop to upload!</p>
          ) : (
            <>
              <p className="text-lg font-medium text-gray-900">Drag & drop files here</p>
              <p className="text-gray-400 text-sm">or click to browse</p>
              <p className="text-xs text-gray-400">
                JPG, PNG, WebP, MP4, WebM up to 50MB each
              </p>
            </>
          )}
        </div>
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-600">
              {files.length} file{files.length !== 1 ? "s" : ""}
              {doneCount > 0 && ` · ${doneCount} uploaded`}
              {errorCount > 0 && ` · ${errorCount} failed`}
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setFiles([])}
                disabled={uploading}
              >
                Clear all
              </Button>
              <Button
                size="sm"
                loading={uploading}
                disabled={pendingCount === 0}
                onClick={uploadAll}
              >
                <Upload className="h-4 w-4" />
                Upload {pendingCount > 0 ? `(${pendingCount})` : ""}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {files.map((item) => (
              <div key={item.id} className="relative rounded-xl overflow-hidden border border-gray-200 bg-gray-50 group">
                {/* Preview */}
                <div className="aspect-square overflow-hidden">
                  {item.file.type.startsWith("video/") ? (
                    <div className="flex h-full items-center justify-center bg-white">
                      <Video className="h-8 w-8 text-gray-400" />
                    </div>
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.preview}
                      alt="preview"
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>

                {/* Overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-start justify-end p-2">
                  {item.status === "pending" && (
                    <button
                      onClick={() => removeFile(item.id)}
                      className="rounded-full bg-black/60 p-1 text-gray-600 hover:text-gray-900"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {/* Status indicator */}
                <div className="absolute bottom-0 left-0 right-0 p-2">
                  {item.status === "uploading" && (
                    <div className="h-1 rounded-full bg-gray-200">
                      <div
                        className="h-1 rounded-full bg-violet-500 transition-all"
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                  )}
                  {item.status === "done" && (
                    <div className="flex items-center gap-1 text-green-400 text-xs">
                      <CheckCircle className="h-3.5 w-3.5" />
                      Uploaded
                    </div>
                  )}
                  {item.status === "error" && (
                    <div className="flex items-center gap-1 text-red-400 text-xs">
                      <AlertCircle className="h-3.5 w-3.5" />
                      Failed
                    </div>
                  )}
                  {item.status === "pending" && (
                    <p className="text-xs text-gray-400 truncate">
                      {item.file.name.split(".")[0]}
                    </p>
                  )}
                </div>

                {/* File type badge */}
                <div className="absolute top-2 left-2">
                  {item.file.type.startsWith("video/") ? (
                    <Video className="h-4 w-4 text-blue-400 drop-shadow" />
                  ) : (
                    <Image className="h-4 w-4 text-violet-400 drop-shadow" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Done state */}
      {doneCount > 0 && doneCount === files.length && (
        <div className="flex justify-center gap-3">
          <Button variant="outline" onClick={() => setFiles([])}>
            Upload More
          </Button>
          <Button onClick={() => router.push(`/events/${selectedEventId}`)}>
            View Event
          </Button>
        </div>
      )}
    </div>
  );
}

export default function UploadPage() {
  return (
    <Suspense>
      <UploadPageInner />
    </Suspense>
  );
}
