"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

const Map = dynamic(() => import("@/app/components/Map"), { ssr: false });

declare global {
  interface Window {
    mapRef: any;
    markerRef: any; // will be used as an array of markers
  }
}

export default function Home() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]); // storing results for dropdown
  const router = useRouter();

  const onMarkerClick = () => {
    router.push("/location/review");
  };

  // Ensure markerRef is always an array
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (!window.markerRef || !Array.isArray(window.markerRef)) {
        window.markerRef = [];
      }
    }
  }, []);

  //fuzzy search function with caching
  const fuzzySearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return [];

    const CACHE_KEY = "search_cache";
    const rawCache = localStorage.getItem(CACHE_KEY);
    const cache = rawCache ? JSON.parse(rawCache) : {};

    //Checking local cache first
    if (cache[searchQuery]) {
      return cache[searchQuery];
    }

    //calling backend if query not found in cache
    const res = await fetch(
  `${process.env.NEXT_PUBLIC_MAPS_URL}/api/maps/location/fuzzy?query=${encodeURIComponent(searchQuery)}`
);
    const data = await res.json();
    const results = data.results || [];

    //saving new results in cache
    cache[searchQuery] = results;
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));

    // Auto-clearing cache if it exceeds 5 MB
    const size = new Blob([JSON.stringify(cache)]).size;
    const MAX = 5 * 1024 * 1024;
    if (size > MAX) {
      console.warn("Cache exceeded 5MB. Clearing cache.");
      localStorage.removeItem(CACHE_KEY);
    }

    return results;
  };

  //search handler
  const handleSearch = async () => {
    if (!window || !query.trim()) return;

    const mapRef = window.mapRef;

    // Clearing previous markers if needed
    if (window.markerRef && Array.isArray(window.markerRef) && window.markerRef.length) {
      window.markerRef.forEach((m: any) => {
        try {
          m.remove();
        } catch (e) {
        }
      });
    }
    // reseting to empty array
    window.markerRef = [];

   const coordMatch = query.match(/^\s*(-?\d+(\.\d+)?),\s*(-?\d+(\.\d+)?)\s*$/);

if (coordMatch) {
  const lat = parseFloat(coordMatch[1]);   
  const lng = parseFloat(coordMatch[3]);   

  const maplibregl = (await import("maplibre-gl")).default;

  const marker = new maplibregl.Marker({ color: "#f00" })
    .setLngLat([lng, lat])
    .addTo(mapRef.current);

  window.markerRef.push(marker);

  setTimeout(() => {
    mapRef.current.flyTo({ center: [lng, lat], zoom: 14 });
  }, 50);

  setResults([]);
}
 else {
      const resultsFromBackend = await fuzzySearch(query);
      setResults(resultsFromBackend); // showing in dropdown
    }
  };

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timeout = setTimeout(() => {
      handleSearch();
    }, 300);

    return () => clearTimeout(timeout);
  }, [query]);

  // Handling selecting a location from dropdown
  const handleSelect = async (loc: any) => {
    setQuery(loc.name); // update input
    setResults([]); // hide dropdown

    const mapRef = window.mapRef;
    if (!mapRef || !mapRef.current) return;

    if (window.markerRef && Array.isArray(window.markerRef) && window.markerRef.length) {
      window.markerRef.forEach((m: any) => {
        try {
          m.remove();
        } catch (e) {
          // ignore
        }
      });
    }
    window.markerRef = [];

    const maplibregl = (await import("maplibre-gl")).default;
    const marker = new maplibregl.Marker({ color: "#f00" })
      .setLngLat([loc.longitude, loc.latitude])
      .addTo(mapRef.current);

    // push into array (consistent)
    window.markerRef.push(marker);

    mapRef.current.flyTo({ center: [loc.longitude, loc.latitude], zoom: 14 });
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      {/* Search Bar */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 w-[90%] max-w-md flex flex-col gap-2">
        <div className="flex gap-2 bg-white px-4 py-2 rounded-full shadow-md">
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
          <div className="bg-white max-h-60 overflow-auto rounded shadow-lg border">
            {results.map((loc) => (
              <div
                key={loc.locationId}
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                onClick={() => handleSelect(loc)}
              >
                {loc.name}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Map */}
      <Map onMarkerClick={onMarkerClick} />
    </div>
  );
}
