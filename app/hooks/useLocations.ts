"use client";

import useSWR from "swr";
import { useEffect, useMemo } from "react";

type Location = {
  locationId?: string;
  id?: string;
  name: string;
  latitude: number;
  longitude: number;
  locationType?: string;
  location_type?: string;
};

const fetcher = async (url: string) => {
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch locations");
  return res.json();
};

/**
 * Custom hook to fetch and cache locations using SWR + localStorage fallback.
 * Automatically merges incremental updates and handles deletions.
 */
export function useLocations() {
  // Read existing local cache
  const cached =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("cached_locations") || "[]")
      : [];

  const cachedTime =
    typeof window !== "undefined"
      ? localStorage.getItem("cached_time")
      : null;

  // incremental fetching param
  const sinceParam = cachedTime
    ? `?since=${encodeURIComponent(cachedTime)}`
    : "";

    const { data, error, mutate, isValidating } = useSWR(
        "locations",
        async () => {
          const cachedTime = localStorage.getItem("cached_time");
          const sinceParam = cachedTime
            ? `?since=${encodeURIComponent(cachedTime)}`
            : "";
          const url = `${process.env.NEXT_PUBLIC_MAPS_URL}/api/maps/locations${sinceParam}`;
          const res = await fetch(url, { credentials: "include" });
          if (!res.ok) throw new Error("Failed to fetch locations");
          return res.json();
        },
        {
          refreshInterval: 5 * 60 * 1000,
          revalidateOnFocus: true,
          dedupingInterval: 30000,
          fallbackData: { locations: cached }, 
        }
      );
      
  

  // Merge logic for incremental updates
  const merged = useMemo(() => {
    if (!data) return cached;

    const updated = data.updated || data.locations || [];
    const deleted = data.deleted || [];
    const timestamp = data.lastFetchTime || new Date().toISOString();

    const filtered = cached.filter(
      (l: Location) =>
        !deleted.some(
          (d: any) =>
            (d.locationId || d.location_id) ===
            (l.locationId )
        )
    );

    const merged = [
      ...filtered.filter(
        (l: Location) =>
          !updated.some(
            (n: any) =>
              (n.locationId || n.location_id) ===
              (l.locationId )
          )
      ),
      ...updated,
    ];

    // Save to cache
    if (typeof window !== "undefined" && (updated.length || deleted.length)) {
      localStorage.setItem("cached_locations", JSON.stringify(merged));
      localStorage.setItem("cached_time", timestamp);
      (window as any).locations = merged;
    }

    return merged;
  }, [data, cached]);

  //  On mount: make sure window reference exists
  useEffect(() => {
    if (typeof window !== "undefined") {
      (window as any).locations = cached;
    }
  }, []);

  return {
    locations: merged,
    isLoading: !error && !data && !cached.length,
    isValidating,
    error,
    mutate,
  };
}
