"use client";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { useLocations } from "@/app/hooks/useLocations";
import type maplibregl from "maplibre-gl";

function getSearchMarkers(): maplibregl.Marker[] {
  if (typeof window === "undefined") return [];
  if (!window.searchMarkerRef) {
    window.searchMarkerRef = { current: [] };
  } else if (!Array.isArray(window.searchMarkerRef.current)) {
    window.searchMarkerRef.current = [];
  }
  return window.searchMarkerRef.current;
}

function clearSearchMarkers() {
  getSearchMarkers().forEach((marker) => {
    try {
      marker.remove();
    } catch {
      // ignore
    }
  });
  window.searchMarkerRef!.current = [];
}

export default function Home() {
  const [results, setResults] = useState<any[]>([]); // storing results for dropdown
  const { isValidating } = useLocations();
  const [query, setQuery] = useState("");
  const [mounted, setMounted] = useState(false);
  const skipNextSearch = useRef(false);
  const lastSearchMarker = useRef<any>(null);

  useEffect(() => {
    setMounted(true);
<<<<<<< HEAD
    getSearchMarkers();
=======
>>>>>>> pr-99-fuzzy-search
  }, []);

  // Fuzzy search function with caching
  // TODO: Update the logic to do the fuzzy search on the local location store not on the api
  const fuzzySearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return [];

    const CACHE_KEY = "search_cache";
    const rawCache = localStorage.getItem(CACHE_KEY);
    const cache = rawCache ? JSON.parse(rawCache) : {};

    // Checking local cache first
    if (cache[searchQuery]) {
      return cache[searchQuery];
    }

    // Calling backend if query not found in cache
    const res = await fetch(
      `${
        process.env.NEXT_PUBLIC_MAPS_URL
      }/api/maps/location/fuzzy?query=${encodeURIComponent(searchQuery)}`,
    );
    const data = await res.json();
    const results = data.results || [];

    // Saving new results in cache
    cache[searchQuery] = results;
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));

    // Auto-clearing cache if it exceeds 5 MB
    const size = new Blob([JSON.stringify(cache)]).size;
    const MAX = 5 * 1024 * 1024;
    if (size > MAX) {
      // console.warn("Cache exceeded 5MB. Clearing cache.");
      localStorage.removeItem(CACHE_KEY);
    }

    return results;
  };

  // Search handler
  const handleSearch = async () => {
    if (!window || !query.trim()) return;
    const mapRef = window.mapRef;
    if (!mapRef?.current) return;

<<<<<<< HEAD
    clearSearchMarkers();
=======
    // clear previous search markers
    if (lastSearchMarker.current) {
      try {
        lastSearchMarker.current.remove();
      } catch {}
      lastSearchMarker.current = null;
    }
>>>>>>> pr-99-fuzzy-search

    const coordMatch = query.match(
      /^\s*(-?\d+(\.\d+)?),\s*(-?\d+(\.\d+)?)\s*$/,
    );

    if (coordMatch) {
      const lat = parseFloat(coordMatch[1]);
      const lng = parseFloat(coordMatch[3]);

      const maplibregl = (await import("maplibre-gl")).default;

      lastSearchMarker.current = new maplibregl.Marker({ color: "#f00" })
        .setLngLat([lng, lat])
        .addTo(mapRef.current);

<<<<<<< HEAD
      getSearchMarkers().push(marker);

=======
>>>>>>> pr-99-fuzzy-search
      setTimeout(() => {
        mapRef.current.flyTo({
          center: [lng, lat],
          zoom: 16,
          speed: 1.2,
          curve: 1.5,
          essential: true,
        });
      }, 50);

      setResults([]);
    } else {
      const resultsFromBackend = await fuzzySearch(query);
      setResults(resultsFromBackend); // showing in dropdown
    }
  };

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    if (skipNextSearch.current) {
      skipNextSearch.current = false;
      return;
    }

    const timeout = setTimeout(() => {
      handleSearch();
    }, 300);

    return () => clearTimeout(timeout);
  }, [query]);

  // Handling selecting a location from dropdown
  const handleSelect = async (loc: any) => {
    skipNextSearch.current = true;
    setQuery(loc.name); // update input
    setResults([]); // hide dropdown

    const mapRef = window.mapRef;
    if (!mapRef || !mapRef.current) return;

<<<<<<< HEAD
    clearSearchMarkers();
=======
    // Remove previous search pin
    if (lastSearchMarker.current) {
      try {
        lastSearchMarker.current.remove();
      } catch {}
      lastSearchMarker.current = null;
    }
>>>>>>> pr-99-fuzzy-search

    const maplibregl = (await import("maplibre-gl")).default;
    lastSearchMarker.current = new maplibregl.Marker({ color: "#f00" })
      .setLngLat([loc.longitude, loc.latitude])
      .addTo(mapRef.current);

<<<<<<< HEAD
    getSearchMarkers().push(marker);

    mapRef.current.flyTo({ center: [loc.longitude, loc.latitude], zoom: 14 });
=======
    mapRef.current.flyTo({
      center: [loc.longitude, loc.latitude],
      zoom: 16,
      speed: 1.2,
      curve: 1.5,
      essential: true,
    });
>>>>>>> pr-99-fuzzy-search
  };

  // TODO: Fall back of nominator api, but first need to verify if it accounts for the user or the server (the api limits?)
  // const res = await fetch(
  //       `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
  //         query
  //       )}&format=json`
  //     );
  //     const data = await res.json();
  //     if (!data[0]) return alert("Location not found");
  //     lat = parseFloat(data[0].lat);
  //     lng = parseFloat(data[0].lon);

  return (
    <>
      {/* Search Bar Overlay */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 w-[90%] max-w-md flex flex-col gap-1">
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-md">
          <Input
            placeholder="Search by name or coordinates"
            className="flex-1 border-none text-black placeholder:text-gray-500 focus-visible:ring-0 focus-visible:ring-offset-0"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          <Button size="icon" variant="ghost" onClick={handleSearch}>
            <Search className="h-5 w-5 text-gray-500" />
          </Button>
        </div>
        {/* Dropdown with search results */}
        {results.length > 0 && (
          <div className="bg-white max-h-72 overflow-y-auto rounded-xl shadow-lg border border-gray-100 mt-1">
            {results.map((loc) => (
              <div
                key={loc.locationId || loc.id}
                className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0 border-gray-100 transition-colors"
                onClick={() => handleSelect(loc)}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-800 text-sm">
                    {loc.name}
                  </span>
                  {(loc.category || loc.locationType || loc.location_type) && (
                    <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-medium ml-2 uppercase tracking-wide">
                      {loc.category || loc.locationType || loc.location_type}
                    </span>
                  )}
                </div>
                {loc.description && (
                  <p className="text-xs text-gray-500 line-clamp-1 mt-1">
                    {loc.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sync indicator */}
      {mounted && isValidating && (
        <div className="absolute bottom-4 right-4 text-xs text-gray-600 bg-white/80 px-3 py-1 rounded-md shadow">
          Syncing latest data…
        </div>
      )}
    </>
  );
}
