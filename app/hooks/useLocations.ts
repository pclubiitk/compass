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

//Hook to fetch and cache locations using SWR + localStorage fallback.Automatically merges incremental updates and handles deletions.

export function useLocations() {
  // Read existing local cache
  // Initialize Cache: Read existing locations and timestamp from localStorage
  // This ensures we have data to show immediately while fetching updates.
  const cached =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("cached_locations") || "[]")
      : [];

  const cachedTime =
    typeof window !== "undefined"
      ? localStorage.getItem("cached_time")
      : null;

  // Prepare Incremental Fetch: If we have a timestamp, ask for updates since then.
  // If no timestamp (first run), this will be empty, fetching ALL locations.
  const sinceParam = cachedTime
    ? `?since=${encodeURIComponent(cachedTime)}`
    : "";

  // Fetch Updates: Use SWR to fetch from the incremental endpoint.
  // We pass 'cached' as fallbackData so SWR uses it initially.
  const { data, error, mutate, isValidating } = useSWR(
    "locations",
    async () => {
      const cachedTime = localStorage.getItem("cached_time");
      const sinceParam = cachedTime
        ? `?since=${encodeURIComponent(cachedTime)}`
        : "";
      // Call the incremental endpoint. Returns { locations: [], deleted: [], lastFetchTime: ... }
      const url = `${process.env.NEXT_PUBLIC_MAPS_URL}/api/maps/locations/incremental${sinceParam}`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch locations");
      return res.json();
    },
    {
      refreshInterval: 5 * 60 * 1000, // every 5 minutes
      revalidateOnFocus: true,
      dedupingInterval: 30000,
      fallbackData: { locations: cached },
    }
  );



  // Merge Logic: Combine cached data with updates from the server.
  const merged = useMemo(() => {
    if (!data) return cached;

    // 'data' here is the response from the server (incremental updates)
    const updated = data.updated || data.locations || [];
    const deleted = data.deleted || []; // List of IDs to remove
    const timestamp = data.lastFetchTime || new Date().toISOString();

    // Remove deleted locations from the cache
    const filtered = cached.filter(
      (l: Location) =>
        !deleted.some(
          (d: any) =>
            (d.locationId || d.location_id) ===
            (l.locationId)
        )
    );

    // Update existing locations and add new ones
    // We filter out old versions of updated locations, then append the new versions.
    const merged = [
      ...filtered.filter(
        (l: Location) =>
          !updated.some(
            (n: any) =>
              (n.locationId || n.location_id) ===
              (l.locationId)
          )
      ),
      ...updated,
    ];

    //  Persist: Save the merged list and new timestamp to localStorage
    if (typeof window !== "undefined" && (updated.length || deleted.length)) {
      localStorage.setItem("cached_locations", JSON.stringify(merged));
      localStorage.setItem("cached_time", timestamp);
      (window as any).locations = merged; // Update global variable if used
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
