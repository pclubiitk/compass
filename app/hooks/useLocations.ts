"use client";

import useSWR from "swr";
import { useEffect, useMemo, useRef, useState } from "react";

export type Location = {
  locationId?: string;
  id?: string;
  name: string;
  latitude: number;
  longitude: number;
  locationType?: string;
  location_type?: string;
  layer?: number;
};

const LOCATION_CACHE_VERSION = "2";

type CachedLocationState = {
  locations: Location[];
  usable: boolean;
};

function readCachedLocations(): CachedLocationState {
  if (typeof window === "undefined") return { locations: [], usable: false };


  if (localStorage.getItem("cached_locations_version") !== LOCATION_CACHE_VERSION) {
    return { locations: [], usable: false };
  }

  try {
    const value = JSON.parse(localStorage.getItem("cached_locations") || "[]");
    return Array.isArray(value)
      ? { locations: value, usable: true }
      : { locations: [], usable: false };
  } catch {
    return { locations: [], usable: false };
  }
}


export function useLocations() {
  
  const [cache, setCache] = useState<CachedLocationState>(readCachedLocations);
  const cached = cache.locations;
  const persistedFetchTime = useRef<string | null>(null);


  // Fetch Updates: Use SWR to fetch from the incremental endpoint.
  // We pass 'cached' as fallbackData so SWR uses it initially.
  const { data, error, mutate, isValidating } = useSWR(
    "locations",
    async () => {
      const cachedTime = cache.usable
        ? localStorage.getItem("cached_time")
        : null;
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

    return merged;
  }, [data, cached]);

  useEffect(() => {
    const timestamp = data?.lastFetchTime;
    if (!timestamp || persistedFetchTime.current === timestamp) return;

    persistedFetchTime.current = timestamp;
    localStorage.setItem("cached_locations", JSON.stringify(merged));
    localStorage.setItem("cached_time", timestamp);
    localStorage.setItem("cached_locations_version", LOCATION_CACHE_VERSION);
    setCache({ locations: merged, usable: true });
  }, [data, merged]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      (window as any).locations = merged;
    }
  }, [merged]);

  return {
    locations: merged,
    isLoading: !error && !data?.lastFetchTime && !cached.length,
    isValidating,
    error,
    mutate,
  };
}
