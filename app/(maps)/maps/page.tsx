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
import { Search } from "lucide-react";
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

// Use for testing
// const LAYER_COLORS: Record<number, string> = {
//   1: "#029987",
//   2: "#123456",
//   3: "#530299",
//   4: "#0be3ff",
//   5: "#52ff63",
// };


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
    filter: ["<=", ["get", "layer"], maxVisibleLayer],
    paint: {
      "circle-radius": [
        "interpolate",
        ["linear"],
        ["zoom"],
        12,
        5,
        14,
        8,
        17,
        12,
      ],
      "circle-color": "#029987",
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
    filter: ["<=", ["get", "layer"], maxVisibleLayer],
    layout: {
      "text-field": ["get", "name"],
      "text-font": ["Open Sans Regular", "Arial Unicode MS Regular"],
      "text-size": 13,
      
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
  const [mounted, setMounted] = useState(false);
  const skipNextSearch = useRef(false);
  const lastSearchMarker = useRef<any>(null);
  const mapRef = useRef<any>(null);
  const userMarkerRef = useRef<any>(null);

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
            layer: loc.layer ?? 1,
            locationType: loc.locationType || loc.location_type || "",
          },
        })),
    };
  }, [locations]);

  const circleLayer = useMemo(
    () => buildCircleLayer(maxVisibleLayer, currentTheme),
    [maxVisibleLayer],
  );

  const textLayer = useMemo(
    () => buildTextLayer(maxVisibleLayer, currentTheme),
    [maxVisibleLayer],
  );

  const handleClick = useCallback(async (e: MapLayerMouseEvent) => {
    // Check if click was on a location marker
    if (e.features && e.features.length > 0) {
      const locationId = e.features[0]?.properties?.locationId;
      if (locationId) {
        router.push(`/maps/location/${locationId}`);
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

    // Fly to the clicked location
    map.flyTo({ center: [lng, lat], zoom: 14 });

    // Dispatch event for other components
    window.dispatchEvent(
      new CustomEvent("marker-selected", { detail: { lat, lng } }),
    );
  }, [router]);

  const handleMouseEnter = useCallback(() => setCursor("pointer"), []);
  const handleMouseLeave = useCallback(() => setCursor("grab"), []);

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
    // Store mapRef in window for compatibility with existing marker code
    if (typeof window !== "undefined") {
      window.mapRef = mapRef;
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
  }, [mapRef]);

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

  return (
    <div className="relative h-screen w-screen">
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

      // Uncomment for testing layer-wise rendering
      {/* <div className="absolute top-4 left-4 z-10 rounded-lg border bg-white/90 px-3 py-2 text-sm shadow-md backdrop-blur">
        <p className="font-medium">Layer visibility</p>
        <p className="text-muted-foreground">
          Zoom {zoom.toFixed(1)} · showing layers 1–{maxVisibleLayer}
        </p>
      </div> */}
    </div>
  );
}
