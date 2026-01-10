"use client";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { useLocations } from "@/app/hooks/useLocations";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";

export default function Home() {
  const [results, setResults] = useState<any[]>([]); // storing results for dropdown
  const { isValidating } = useLocations();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Ensure markerRef is initialized as a ref object with current property
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (!window.markerRef) {
        window.markerRef = { current: [] };
      } else if (!window.markerRef.current) {
        window.markerRef.current = [];
      }
    }
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
      }/api/maps/location/fuzzy?query=${encodeURIComponent(searchQuery)}`
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

    // Clearing previous markers if needed
    if (
      window.markerRef?.current &&
      Array.isArray(window.markerRef.current) &&
      window.markerRef.current.length
    ) {
      window.markerRef.current.forEach((m: any) => {
        try {
          m.remove();
        } catch {}
      });
      // Resetting to empty array
      window.markerRef.current = [];
    }

    const coordMatch = query.match(
      /^\s*(-?\d+(\.\d+)?),\s*(-?\d+(\.\d+)?)\s*$/
    );

    if (coordMatch) {
      const lat = parseFloat(coordMatch[1]);
      const lng = parseFloat(coordMatch[3]);

      const maplibregl = (await import("maplibre-gl")).default;

      const marker = new maplibregl.Marker({ color: "#f00" })
        .setLngLat([lng, lat])
        .addTo(mapRef.current);

      window.markerRef.current.push(marker);

      setTimeout(() => {
        mapRef.current.flyTo({ center: [lng, lat], zoom: 14 });
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

    if (
      window.markerRef?.current &&
      Array.isArray(window.markerRef.current) &&
      window.markerRef.current.length
    ) {
      window.markerRef.current.forEach((m: any) => {
        try {
          m.remove();
        } catch {
          // ignore
        }
      });
      window.markerRef.current = [];
    }

    const maplibregl = (await import("maplibre-gl")).default;
    const marker = new maplibregl.Marker({ color: "#f00" })
      .setLngLat([loc.longitude, loc.latitude])
      .addTo(mapRef.current);

    // push into array (consistent)
    window.markerRef.current.push(marker);

    mapRef.current.flyTo({ center: [loc.longitude, loc.latitude], zoom: 14 });
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
      {/* TODO: can extract the login dialog pop up, as it will be required at multiple place. */}
      {/* Login Required Dialog */}
      <AlertDialog open={loginDialogOpen} onOpenChange={setLoginDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Login Required</AlertDialogTitle>
            <AlertDialogDescription>
              You need to log in to add a new location.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setLoginDialogOpen(false);
                router.push("/login?next=/");
              }}
            >
              Log In
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Search Bar Overlay */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 w-[90%] max-w-md flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-md">
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

      {/* Sync indicator */}
      {mounted && isValidating && (
        <div className="absolute bottom-4 right-4 text-xs text-gray-600 bg-white/80 px-3 py-1 rounded-md shadow">
          Syncing latest data…
        </div>
      )}
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
    </>
  );
}
