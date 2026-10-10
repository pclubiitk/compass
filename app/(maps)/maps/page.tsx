"use client";

import { useMemo, useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Map, Source, Layer } from "@vis.gl/react-maplibre";
import type { MapLayerMouseEvent } from "@vis.gl/react-maplibre";
import type { CircleLayerSpecification, SymbolLayerSpecification } from "maplibre-gl";
import type { FeatureCollection } from "geojson";
import { useLocations, type Location } from "@/app/hooks/useLocations";
import "maplibre-gl/dist/maplibre-gl.css";
import { useTheme } from "next-themes";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Home, Search } from "lucide-react";
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

const IITK_CENTER = {
  longitude: 80.23273232675717,
  latitude: 26.50939610022435,
  zoom: 14,
};

const LAYER_COLORS: Record<number, string> = {
  1: "#029987",
  2: "#017a8c",
  3: "#e2ce72",
  4: "#57cc99",
  5: "#c7f9cc",
};

const LAYER_BY_TYPE: Record<string, number> = {
  admin: 1,
  lecturehall: 1,
  hostel: 1,
  food: 2,
  recreation: 3,
};

function resolveLocationLayer(loc: Location): number {
  const stored = Number(loc.layer);
  if (stored >= 2 && stored <= 5) return stored;

  const type = (loc.locationType || loc.location_type || "").toLowerCase().trim();
  if (LAYER_BY_TYPE[type]) return LAYER_BY_TYPE[type];

  const key = String(loc.locationId || loc.id || loc.name || "");
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  }
  return (hash % 5) + 1;
}

function maxLayerForZoom(zoom: number): number {
  if (zoom > 17) return 5;
  if (zoom > 16.5) return 4;
  if (zoom > 16) return 3;
  if (zoom > 15) return 2;
  return 1;
}

function buildCircleLayer(maxVisibleLayer: number, theme: string | undefined): CircleLayerSpecification {
  return {
    id: "locations",
    type: "circle",
    source: "locations",
    filter: ["<=", ["to-number", ["get", "layer"]], maxVisibleLayer],
    paint: {
      "circle-radius": [
        "interpolate",
        ["linear"],
        ["zoom"],
        12,
        2,
        14,
        3,
        17,
        5,
      ],
      "circle-color": [
        "match",
        ["to-number", ["get", "layer"]],
        1,
        LAYER_COLORS[1],
        2,
        LAYER_COLORS[2],
        3,
        LAYER_COLORS[3],
        4,
        LAYER_COLORS[4],
        5,
        LAYER_COLORS[5],
        LAYER_COLORS[1],
      ],
      "circle-stroke-width": 2,
      "circle-stroke-color": theme === "dark" ? "#000000" : "#ffffff",
    },
  };
}

function buildTextLayer(maxVisibleLayer: number, theme: string | undefined): SymbolLayerSpecification {
  return {
    id: "location-labels",
    type: "symbol",
    source: "locations",
    filter: ["<=", ["to-number", ["get", "layer"]], maxVisibleLayer],
    layout: {
      "text-field": ["get", "name"],
      "text-font": ["Open Sans Regular", "Arial Unicode MS Regular"],
      "text-size": 10,
      
      "text-variable-anchor": ["top", "bottom", "left", "right"],
      "text-radial-offset": 0, 
      
      "text-allow-overlap": false, 
      "text-ignore-placement": false,
    },
    paint: {
      "text-color": theme === "dark" ? "#cccccc" : "#333333",
      "text-halo-color": theme === "dark" ? "#000000" : "#ffffff",
      "text-halo-width": 1.5,
    },
  };
}

export default function AdminMap() {
  const { locations, isValidating } = useLocations();
  const router = useRouter();
  const [zoom, setZoom] = useState(IITK_CENTER.zoom);
  const [cursor, setCursor] = useState<string>("grab");
  const [results, setResults] = useState<any[]>([]);
  const [query, setQuery] = useState("");
  const [placeholder, setPlaceholder] = useState("Search by name or coordinates");

  useEffect(() => {
    const placeholders = ["Search by name or coordinates", "⌘K / Ctrl+K to search"];
    let i = 0;
    const interval = setInterval(() => {
      i = (i + 1) % placeholders.length;
      setPlaceholder(placeholders[i]);
    }, 3000);
    return () => clearInterval(interval);
  }, []);
  const [mounted, setMounted] = useState(false);
  const skipNextSearch = useRef(false);
  const lastSearchMarker = useRef<any>(null);
  const mapRef = useRef<any>(null);
  const userMarkerRef = useRef<any>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const maxVisibleLayer = maxLayerForZoom(zoom);

  const { theme, systemTheme } = useTheme();
  const currentTheme = theme === "system" ? systemTheme : theme;
  const mapStyle =
    currentTheme === "dark"
      ? "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
      : "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";

  const geojson = useMemo((): FeatureCollection => {
    return {
      type: "FeatureCollection",
      features: (locations as Location[])
        .filter((loc) => loc.latitude != null && loc.longitude != null)
        .map((loc) => ({
          type: "Feature" as const,
          geometry: {
            type: "Point" as const,
            coordinates: [loc.longitude, loc.latitude],
          },
          properties: {
            locationId: loc.locationId || loc.id || "",
            name: loc.name,
            layer: resolveLocationLayer(loc),
            locationType: loc.locationType || loc.location_type || "",
          },
        })),
    };
  }, [locations]);

  const layerStats = useMemo(() => {
    const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const loc of locations as Location[]) {
      if (loc.latitude == null || loc.longitude == null) continue;
      counts[resolveLocationLayer(loc)]++;
    }
    const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
    const visible = Object.entries(counts)
      .filter(([layer]) => Number(layer) <= maxVisibleLayer)
      .reduce((sum, [, count]) => sum + count, 0);
    const usesAutoLayers = (locations as Location[]).every(
      (loc) => (loc.layer ?? 1) === 1,
    );
    return { counts, total, visible, usesAutoLayers };
  }, [locations, maxVisibleLayer]);

  const circleLayer = useMemo(
    () => buildCircleLayer(maxVisibleLayer, currentTheme),
    [maxVisibleLayer, currentTheme],
  );

  const textLayer = useMemo(
    () => buildTextLayer(maxVisibleLayer, currentTheme),
    [maxVisibleLayer, currentTheme],
  );

  const handleClick = useCallback(async (e: MapLayerMouseEvent) => {
    // Check if click was on a location marker
    if (e.features && e.features.length > 0) {
      const locationId = e.features[0]?.properties?.locationId;
      if (locationId) {
        router.push(`/location/${locationId}`);
        return;
      }
    }

    // If not on a location marker, place user marker for add location
    const { lng, lat } = e.lngLat;
    const map = mapRef.current?.getMap();

    if (!map) return;

    // Remove existing user marker
    if (userMarkerRef.current) {
      try {
        userMarkerRef.current.remove();
      } catch {}
      userMarkerRef.current = null;
    }

    // Create new user marker (red)
    const maplibregl = (await import("maplibre-gl")).default;
    userMarkerRef.current = new maplibregl.Marker({ color: "#f00" })
      .setLngLat([lng, lat])
      .addTo(map);

    // Store coordinates for add location
    localStorage.setItem("selected_lat", lat.toString());
    localStorage.setItem("selected_lon", lng.toString());

    // Dispatch event for other components
    window.dispatchEvent(
      new CustomEvent("marker-selected", { detail: { lat, lng } }),
    );
  }, [router]);

  const handleMouseEnter = useCallback(() => setCursor("pointer"), []);
  const handleMouseLeave = useCallback(() => setCursor("grab"), []);

  const handleResetView = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (!map) return;

    map.flyTo({
      center: [IITK_CENTER.longitude, IITK_CENTER.latitude],
      zoom: IITK_CENTER.zoom,
      speed: 1.2,
      curve: 1.5,
      essential: true,
    });

    if (lastSearchMarker.current) {
      try {
        lastSearchMarker.current.remove();
      } catch {}
      lastSearchMarker.current = null;
    }

    if (userMarkerRef.current) {
      try {
        userMarkerRef.current.remove();
      } catch {}
      userMarkerRef.current = null;
    }
  }, []);

  const fuzzySearch = async (searchQuery: string) => {
    // Calling backend if query not found in cache
    const res = await fetch(
      `${
        process.env.NEXT_PUBLIC_MAPS_URL
      }/api/maps/location/fuzzy?query=${encodeURIComponent(searchQuery)}`,
    );
    const data = await res.json();
    const results = data.results || [];
    return results;
  };

  // Search handler
  const handleSearch = async () => {
    if (!window || !query.trim()) return;
    if (!mapRef?.current) return;

    // Get the raw maplibre-gl instance
    const map = mapRef.current.getMap();

    // clear previous search markers
    if (lastSearchMarker.current) {
      try {
        lastSearchMarker.current.remove();
      } catch {}
      lastSearchMarker.current = null;
    }

    const coordMatch = query.match(
      /^\s*(-?\d+(\.\d+)?),\s*(-?\d+(\.\d+)?)\s*$/,
    );

    if (coordMatch) {
      const lat = parseFloat(coordMatch[1]);
      const lng = parseFloat(coordMatch[3]);

      const maplibregl = (await import("maplibre-gl")).default;

      lastSearchMarker.current = new maplibregl.Marker({ color: "#f00" })
        .setLngLat([lng, lat])
        .addTo(map);

      setTimeout(() => {
        map.flyTo({
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

  // Handling selecting a location from dropdown
  const handleSelect = async (loc: any) => {
    skipNextSearch.current = true;
    setQuery(loc.name); // update input
    setResults([]); // hide dropdown

    if (!mapRef || !mapRef.current) return;

    // Get the raw maplibre-gl instance
    const map = mapRef.current.getMap();

    // Remove previous search pin
    if (lastSearchMarker.current) {
      try {
        lastSearchMarker.current.remove();
      } catch {}
      lastSearchMarker.current = null;
    }

    const maplibregl = (await import("maplibre-gl")).default;
    lastSearchMarker.current = new maplibregl.Marker({ color: "#f00" })
      .setLngLat([loc.longitude, loc.latitude])
      .addTo(map);

    map.flyTo({
      center: [loc.longitude, loc.latitude],
      zoom: 16,
      speed: 1.2,
      curve: 1.5,
      essential: true,
    });
  };

  useEffect(() => {
    setMounted(true);
    // Store refs in window for compatibility with the bottom navigation.
    if (typeof window !== "undefined") {
      window.mapRef = mapRef;
      window.userMarkerRef = userMarkerRef;
    }
    // Check for marker data in sessionStorage and auto-place it
    if (typeof window !== "undefined") {
      const markerData = sessionStorage.getItem("mapMarker");
      if (markerData) {
        try {
          const { lat, lng } = JSON.parse(markerData);
          setQuery(`${lat}, ${lng}`);
          sessionStorage.removeItem("mapMarker");
        } catch (e) {
          console.error("Failed to parse marker data:", e);
        }
      }
    }
    // Auto-search from URL param ?search= (read once on mount)
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const searchQ = urlParams.get("search");
      if (searchQ) {
        setQuery(searchQ);
      }
    }
    return () => {
      if (window.mapRef === mapRef) {
        delete (window as Partial<Window>).mapRef;
      }
      if (window.userMarkerRef === userMarkerRef) {
        delete (window as Partial<Window>).userMarkerRef;
      }
    };
  }, []);

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

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div className="relative h-screen w-screen">
      {/* Search Bar Overlay */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 w-[90%] max-w-md flex flex-col gap-1">
        <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-4 py-2 rounded-full shadow-md">
          <Input
            ref={searchInputRef}
            placeholder={placeholder}
            className="flex-1 border-none text-black dark:text-gray-300 placeholder:text-gray-500 focus-visible:ring-0 focus-visible:ring-offset-0"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          <Button size="icon" variant="ghost" onClick={handleSearch} className="dark:hover:bg-gray-700">
            <Search className="h-5 w-5 text-gray-500 dark:text-gray-300" />
          </Button>
        </div>
        {/* Dropdown with search results */}
        {results.length > 0 && (
          <div className="bg-white dark:bg-gray-800 max-h-72 overflow-y-auto rounded-xl shadow-lg border border-gray-100 dark:border-gray-900 mt-1">
            {results.map((loc) => (
              <div
                key={loc.locationId || loc.id}
                className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border-b last:border-b-0 border-gray-100 transition-colors"
                onClick={() => handleSelect(loc)}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-800 dark:text-gray-300 text-sm">
                    {loc.name}
                  </span>
                  {(loc.category || loc.locationType || loc.location_type) && (
                    <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-medium ml-2 uppercase tracking-wide">
                      {loc.category || loc.locationType || loc.location_type}
                    </span>
                  )}
                </div>
                {loc.description && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 mt-1">
                    {loc.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="absolute top-20 right-4 z-50">
        <Button
          size="icon"
          variant="secondary"
          className="rounded-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg shadow-lg border border-gray-200 dark:border-gray-700"
          onClick={handleResetView}
          aria-label="Reset map view"
          title="Reset map view"
        >
          <Home className="h-5 w-5 text-gray-700 dark:text-gray-300" />
        </Button>
      </div>

      {/* Sync indicator */}
      {mounted && isValidating && (
        <div className="absolute bottom-4 right-4 text-xs text-gray-600 bg-white/80 px-3 py-1 rounded-md shadow">
          Syncing latest data…
        </div>
      )}

      <Map
        ref={mapRef}
        initialViewState={IITK_CENTER}
        style={{ width: "100%", height: "100%" }}
        mapStyle={mapStyle}
        cursor={cursor}
        interactiveLayerIds={["locations"]}
        onMove={(evt) => setZoom(evt.viewState.zoom)}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <Source id="locations" type="geojson" data={geojson}>
          <Layer {...circleLayer} />
          <Layer {...textLayer} />
        </Source>
      </Map>
    </div>
  );
}
