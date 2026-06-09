"use client";

import React from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { EVENT_CATEGORIES } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { useCallback } from "react";

const SORT_OPTIONS = [
  { value: "date_desc", label: "Newest First" },
  { value: "date_asc", label: "Oldest First" },
  { value: "name_asc", label: "Name A-Z" },
  { value: "name_desc", label: "Name Z-A" },
];

interface Props {
  currentCategory?: string;
  currentSort?: string;
  currentQ?: string;
}

export default function EventFilters({ currentCategory, currentSort, currentQ }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const updateParam = useCallback(
    (key: string, value: string | undefined) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      router.push(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams]
  );

  return (
    <div className="space-y-3">
      {/* Search */}
      <Input
        placeholder="Search events..."
        defaultValue={currentQ}
        icon={<Search className="h-4 w-4" />}
        onChange={(e) => {
          const val = e.target.value;
          const w = window as Window & { __searchTimeout?: ReturnType<typeof setTimeout> };
          clearTimeout(w.__searchTimeout);
          w.__searchTimeout = setTimeout(() => updateParam("q", val || undefined), 400);
        }}
        className="max-w-sm"
      />

      {/* Sort & Category */}
      <div className="flex flex-wrap items-center gap-2">
        <SlidersHorizontal className="h-4 w-4 text-gray-400 shrink-0" />

        {/* Sort */}
        <select
          value={currentSort || "date_desc"}
          onChange={(e) => updateParam("sort", e.target.value)}
          className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-500"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value} className="bg-white">
              {o.label}
            </option>
          ))}
        </select>

        {/* Category pills */}
        <button
          onClick={() => updateParam("category", undefined)}
          className={cn(
            "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
            !currentCategory
              ? "border-violet-500 bg-violet-500/20 text-violet-300"
              : "border-gray-200 text-gray-500 hover:text-gray-900 hover:border-gray-300"
          )}
        >
          All
        </button>
        {EVENT_CATEGORIES.map((c) => (
          <button
            key={c.value}
            onClick={() => updateParam("category", currentCategory === c.value ? undefined : c.value)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              currentCategory === c.value
                ? "border-violet-500 bg-violet-500/20 text-violet-300"
                : "border-gray-200 text-gray-500 hover:text-gray-900 hover:border-gray-300"
            )}
          >
            {c.label}
          </button>
        ))}
      </div>
    </div>
  );
}
