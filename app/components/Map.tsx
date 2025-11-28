"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useGContext } from "@/components/ContextProvider";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Minus,
  LocateFixed,
  UtensilsCrossed,
  GraduationCap,
  Home,
  Building2,
  TreePalm,
  MapPin,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { createRoot } from "react-dom/client";

type MapProps = {
  onMarkerClick: () => void;
  locations: any[];
};

// Colors + Icons 
const colorMap: Record<string, string> = {
  food: "#ef4444",
  lecturehall: "#3b82f6",
  hostel: "#22c55e",
  admin: "#f97316",
  recreation: "#14b8a6",
  default: "#6b7280",
};

const iconMap: Record<string, any> = {
  food: UtensilsCrossed,
  lecturehall: GraduationCap,
  hostel: Home,
  admin: Building2,
  recreation: TreePalm,
  default: MapPin,
};

const formatCount = (n?: number) => (typeof n === "number" ? n : 0);


// Main Map
export default function Map({ onMarkerClick, locations }: MapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const userMarkerRef = useRef<maplibregl.Marker | null>(null);
  const locationMarkers = useRef<maplibregl.Marker[]>([]);
  const router = useRouter();
  const [mapLoaded, setMapLoaded] = useState(false);
  const { setGlobalLoading } = useGContext();

  //  Initialize map once
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    setGlobalLoading(true);

    // Add keyframes for pulsing marker animation
    const styleSheet = document.createElement("style");
    styleSheet.type = "text/css";
    styleSheet.innerText = `
      @keyframes pulse {
        0% { transform: scale(1); opacity: 0.6; }
        100% { transform: scale(2.5); opacity: 0; }
      }
      @keyframes popIn {
        0% { transform: scale(0); opacity: 0; }
        60% { transform: scale(1.1); opacity: 1; }
        100% { transform: scale(1); opacity: 1; }
      }
    `;
    document.head.appendChild(styleSheet);

    const savedCenter = JSON.parse(localStorage.getItem("map_center") || "null");
    const savedZoom = Number(localStorage.getItem("map_zoom")) || 14;

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const startCenter = savedCenter || [coords.longitude, coords.latitude];

        const map = new maplibregl.Map({
          container: mapContainer.current!,
          style: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
          center: startCenter,
          zoom: savedZoom,
        });

        mapRef.current = map;
        (window as any).mapRef = mapRef;

        //  Create a custom pulsating marker for the user
        const userWrapper = document.createElement("div");
        userWrapper.style.cursor = "pointer";

        // Inner element for visual styling
        const userInner = document.createElement("div");
        userInner.style.cssText = `
          display: flex; align-items: center; justify-content: center;
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
        `;

        userWrapper.appendChild(userInner);

        // Render Custom SVG Marker (Teardrop shape)
        const userRoot = createRoot(userInner);
        userRoot.render(
          <div className="relative flex flex-col items-center justify-center -mt-10">
            {/* Custom SVG Marker */}
            <div className="relative z-10 filter drop-shadow-md transform transition-transform hover:scale-110">
              <svg
                width="33"
                height="37"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 0C7.58 0 4 3.58 4 8C4 13.5 12 24 12 24C12 24 20 13.5 20 8C20 3.58 16.42 0 12 0Z"
                  fill="#EF4444"
                />
                <circle cx="12" cy="8" r="3.5" fill="white" />
              </svg>
            </div>
          </div>
        );

        const userMarker = new maplibregl.Marker({
          element: userWrapper,
          anchor: "bottom", // Pin tip is at the bottom
          offset: [0, 0]
        })
          .setLngLat(startCenter)
          .addTo(map);

        userMarkerRef.current = userMarker;
        (window as any).markerRef = userMarkerRef;

        //  Click to open Add Drawer
        userMarker.getElement().addEventListener("click", (e) => {
          e.stopPropagation();
          onMarkerClick();
        });

        //  Handle map click to move marker
        map.on("click", (e) => {
          const { lng, lat } = e.lngLat;
          if (!userMarkerRef.current) return;

          userMarkerRef.current.setLngLat([lng, lat]);
          localStorage.setItem("selected_lat", lat.toString());
          localStorage.setItem("selected_lon", lng.toString());
          map.flyTo({ center: [lng, lat], zoom: 14 });
          window.dispatchEvent(
            new CustomEvent("marker-selected", { detail: { lat, lng } })
          );
        });

        // Handle trigger from Add button
        window.addEventListener("trigger-add-location", () => {
          if (!mapRef.current || !userMarkerRef.current) return;
          const center = mapRef.current.getCenter();
          userMarkerRef.current.setLngLat(center);
          localStorage.setItem("selected_lat", center.lat.toString());
          localStorage.setItem("selected_lon", center.lng.toString());
          onMarkerClick();
        });

        //  Save camera position on move
        map.on("moveend", () => {
          localStorage.setItem(
            "map_center",
            JSON.stringify(map.getCenter().toArray())
          );
          localStorage.setItem("map_zoom", map.getZoom().toString());
        });

        map.on("load", () => {
          setMapLoaded(true);
          setGlobalLoading(false);
          map.resize();
          window.dispatchEvent(new Event("map-ready"));
        });
      },
      (err) => {
        console.error("Geolocation error:", err);
        setGlobalLoading(false);
      }
    );

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
      document.head.removeChild(styleSheet);
    };
  }, [onMarkerClick]);

  // Marker rendering
  const renderMarkers = useCallback(
    (force = false) => {
      if (!mapLoaded || !mapRef.current) return;
      const map = mapRef.current;

      // Clear previous markers
      locationMarkers.current.forEach((m) => m.remove());
      locationMarkers.current = [];

      if (!locations?.length) {
        console.log("⚠️ No locations to render");
        return;
      }

      locations.forEach((loc, index) => {
        if (!loc.latitude || !loc.longitude) return;

        const rawType = (
          loc.locationType ||
          loc.location_type ||
          ""
        ).toLowerCase().trim();
        const Icon = iconMap[rawType] || iconMap.default;
        const color = colorMap[rawType] || colorMap.default;

        // Wrapper element for MapLibre positioning (no transforms here!)
        const el = document.createElement("div");
        el.style.cursor = "pointer";

        // Inner element for visual styling and animation
        const inner = document.createElement("div");
        inner.style.cssText = `
          width: 28px; height: 28px;
          display: flex; align-items: center; justify-content: center;
          background: ${color};
          color: white;
          border-radius: 50%;
          box-shadow: 0 4px 10px ${color}70, 0 2px 4px rgba(0,0,0,0.1);
          transition: transform 140ms ease;
          border: 2px solid white;
          animation: popIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
          opacity: 0;
          animation-delay: ${index * 0.03}s;
        `;

        el.appendChild(inner);

        const root = createRoot(inner);
        root.render(<Icon size={16} color="white" />);

        const marker = new maplibregl.Marker({ element: el, anchor: "center" })
          .setLngLat([loc.longitude, loc.latitude])
          .addTo(map);

        el.addEventListener("click", (e) => {
          e.stopPropagation();

          //  fly to marker position
          map.flyTo({
            center: [loc.longitude, loc.latitude],
            zoom: Math.max(map.getZoom(), 16),
            speed: 1.2,
            curve: 1.5,
            essential: true,
          });

          //  bounce animation (CSS scale) - Animate INNER element
          inner.animate(
            [
              { transform: "scale(1)" },
              { transform: "scale(1.3)" },
              { transform: "scale(1)" },
            ],
            { duration: 300, easing: "ease-out" }
          );

          //  Then navigate after small delay
          setTimeout(() => {
            router.push(`/location/${loc.locationId || loc.id}`);
          }, 400);
        });

        locationMarkers.current.push(marker);
      });

      console.log(` Rendered ${locations.length} markers`);
    },
    [locations, mapLoaded, router]
  );

  useEffect(() => {
    if (mapLoaded) renderMarkers();
  }, [locations, mapLoaded, renderMarkers]);

  // Refresh markers when drawer closes (No changes)
  useEffect(() => {
    const handler = () => {
      setTimeout(() => {
        mapRef.current?.resize();
        renderMarkers(true);
      }, 350);
    };
    window.addEventListener("drawer-close", handler);
    return () => window.removeEventListener("drawer-close", handler);
  }, [renderMarkers]);

  // Refresh markers externally (No changes)
  useEffect(() => {
    const handler = () => renderMarkers();
    window.addEventListener("refresh-markers", handler);
    return () => window.removeEventListener("refresh-markers", handler);
  }, [renderMarkers]);

  // Zoom scaling (No changes)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const handleZoom = () => {
      const zoom = map.getZoom();
      const scale = Math.min(Math.max((zoom - 12) / 6 + 0.9, 0.9), 1.4);
      locationMarkers.current.forEach((m) => {
        const el = m.getElement();
        // The inner element is the first child
        const inner = el.firstElementChild as HTMLElement;
        if (inner) {
          inner.style.width = `${28 * scale}px`;
          inner.style.height = `${28 * scale}px`;
        }
      });
    };
    map.on("zoom", handleZoom);
    return () => {
      map.off("zoom", handleZoom);
    };
  }, [mapLoaded]);

  // Controls
  const handleZoomIn = () => mapRef.current?.zoomIn();
  const handleZoomOut = () => mapRef.current?.zoomOut();
  const handleLocateUser = () => {
    navigator.geolocation.getCurrentPosition(({ coords }) => {
      const { longitude, latitude } = coords;
      mapRef.current?.flyTo({ center: [longitude, latitude], zoom: 14 });
      userMarkerRef.current?.setLngLat([longitude, latitude]);
    });
  };

  return (
    <div className="relative h-full w-full min-h-[97vh]">
      <div ref={mapContainer} className="h-full w-full" />




      <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
        <div className="flex flex-col gap-1 p-1 rounded-xl bg-white/80 backdrop-blur-lg border border-gray-200 shadow-lg">
          <Button
            size="icon"
            //  UPDATED: Cleaner button styling
            className="bg-transparent text-gray-800 hover:bg-gray-100 rounded-lg"
            onClick={handleZoomIn}
            aria-label="Zoom in"
            title="Zoom in"
          >
            <Plus className="h-5 w-5" />
          </Button>

          <Button
            size="icon"
            className="bg-transparent text-gray-800 hover:bg-gray-100 rounded-lg"
            onClick={handleZoomOut}
            aria-label="Zoom out"
            title="Zoom out"
          >
            <Minus className="h-5 w-5" />
          </Button>

          <Button
            size="icon"
            className="bg-transparent text-gray-800 hover:bg-gray-100 rounded-lg"
            onClick={handleLocateUser}
            aria-label="Locate me"
            title="Locate me"
          >
            <LocateFixed className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
