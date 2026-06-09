"use client";

import React, { useState, useRef, useEffect } from "react";
import { MapPin, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

interface Suggestion {
  display_name: string;
  place_id: number;
}

export default function LocationInput({ value, onChange, placeholder = "Search city or place…", className }: Props) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  async function fetchSuggestions(query: string) {
    if (query.length < 2) { setSuggestions([]); return; }
    setLoading(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&addressdetails=0`,
        { headers: { "Accept-Language": "en" } }
      );
      const data = await res.json();
      // Shorten display names to city, country format
      const clean = data.map((item: Suggestion) => ({
        ...item,
        display_name: item.display_name.split(",").slice(0, 3).join(", "),
      }));
      setSuggestions(clean);
      setOpen(true);
    } catch {
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    onChange(val);
    clearTimeout(debounceRef.current ?? undefined);
    debounceRef.current = setTimeout(() => fetchSuggestions(val), 350);
  }

  function select(name: string) {
    onChange(name);
    setOpen(false);
    setSuggestions([]);
  }

  return (
    <div className="relative" ref={containerRef}>
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
        </div>
        <input
          type="text"
          value={value}
          onChange={handleChange}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          placeholder={placeholder}
          className={cn(
            "flex h-10 w-full rounded-lg border border-gray-300 bg-white pl-10 pr-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 transition-colors",
            "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
            className
          )}
          autoComplete="off"
        />
      </div>

      {open && suggestions.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden">
          {suggestions.map((s) => (
            <button
              key={s.place_id}
              type="button"
              onClick={() => select(s.display_name)}
              className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 text-left transition-colors"
            >
              <MapPin className="h-3.5 w-3.5 text-gray-400 shrink-0" />
              <span className="truncate">{s.display_name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
