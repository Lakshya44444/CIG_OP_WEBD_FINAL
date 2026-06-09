import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const target = new Date(date);
  const diff = now.getTime() - target.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return formatDate(date);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function generateQRData(albumId: string): string {
  return `${process.env.NEXT_PUBLIC_APP_URL}/albums/${albumId}`;
}

export const EVENT_CATEGORIES = [
  { value: "PHOTOSHOOT", label: "Photoshoot" },
  { value: "WORKSHOP", label: "Workshop" },
  { value: "TRIP", label: "Trip" },
  { value: "COMPETITION", label: "Competition" },
  { value: "CULTURAL", label: "Cultural Fest" },
  { value: "PARTY", label: "Party" },
  { value: "SPORTS", label: "Sports" },
  { value: "OTHER", label: "Other" },
];

export const ROLES = {
  ADMIN: { label: "Admin", color: "bg-red-500" },
  CLUB_ADMIN: { label: "Club Admin", color: "bg-orange-500" },
  PHOTOGRAPHER: { label: "Photographer", color: "bg-purple-500" },
  MEMBER: { label: "Viewer", color: "bg-gray-500" },
  VIEWER: { label: "Viewer", color: "bg-gray-500" },
};

export const ACCEPTED_IMAGE_TYPES = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/webp": [".webp"],
  "image/gif": [".gif"],
  "video/mp4": [".mp4"],
  "video/webm": [".webm"],
  "video/quicktime": [".mov"],
};

export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
