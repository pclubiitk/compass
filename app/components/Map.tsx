"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

import { Button } from "@/components/ui/button";
import { Plus, Minus, LocateFixed } from "lucide-react";

type MapProps = {
  onMarkerClick: () => void;
};

export default function Map({ onMarkerClick }: MapProps) {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && "permissions" in navigator) {
      navigator.permissions
        .query({ name: "geolocation" as PermissionName })
        .then((result) => {
          if (result.state === "prompt") {
            navigator.geolocation.getCurrentPosition(
              () => {},
              () => {}
            );
          }
        })
        .catch(() => {});
    }
    setIsReady(true);
  }, []);

  useEffect(() => {
    if (!isReady || !mapContainer.current || mapRef.current) return;

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const map = new maplibregl.Map({
          container: mapContainer.current!,
          style:
            "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
          center: [coords.longitude, coords.latitude],
          zoom: 14,
        });

        // Allow map double click zoom (no disabling needed)

        const marker = new maplibregl.Marker({ color: "#f00" })
          .setLngLat([coords.longitude, coords.latitude])
          .addTo(map);

        // Add single click event on marker element
        const markerEl = marker.getElement();
        markerEl.style.cursor = "pointer";
        markerEl.addEventListener("click", (e) => {
          e.stopPropagation();
          onMarkerClick();
        });

        mapRef.current = map;
        markerRef.current = marker;

        (window as any).mapRef = mapRef;
        (window as any).markerRef = markerRef;

        map.on("click", (e) => {
          const { lng, lat } = e.lngLat;
          map.flyTo({ center: [lng, lat], zoom: 14 });

          if (markerRef.current) {
            markerRef.current.setLngLat([lng, lat]);
            // Reattach single click listener on moved marker element
            const el = markerRef.current.getElement();
            el.style.cursor = "pointer";
            el.addEventListener("click", (ev) => {
              ev.stopPropagation();
              onMarkerClick();
            });
          } else {
            const newMarker = new maplibregl.Marker({ color: "#f00" })
              .setLngLat([lng, lat])
              .addTo(map);
            const el = newMarker.getElement();
            el.style.cursor = "pointer";
            el.addEventListener("click", (ev) => {
              ev.stopPropagation();
              onMarkerClick();
            });
            markerRef.current = newMarker;
          }
        });

        window.addEventListener("search-location", (e: any) => {
          const { lng, lat } = e.detail;
          map.flyTo({ center: [lng, lat], zoom: 14 });

          if (markerRef.current) {
            markerRef.current.setLngLat([lng, lat]);
            const el = markerRef.current.getElement();
            el.style.cursor = "pointer";
            el.addEventListener("click", (ev) => {
              ev.stopPropagation();
              onMarkerClick();
            });
          } else {
            const newMarker = new maplibregl.Marker({ color: "#f00" })
              .setLngLat([lng, lat])
              .addTo(map);
            const el = newMarker.getElement();
            el.style.cursor = "pointer";
            el.addEventListener("click", (ev) => {
              ev.stopPropagation();
              onMarkerClick();
            });
            markerRef.current = newMarker;
          }
        });

        setTimeout(() => {
          map.resize();
        }, 200);
      },
      (err) => console.error("Geolocation error:", err)
    );

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [isReady, onMarkerClick]);

  const handleZoomIn = () => {
    if (mapRef.current) mapRef.current.zoomIn();
  };

  const handleZoomOut = () => {
    if (mapRef.current) mapRef.current.zoomOut();
  };

  const handleLocateUser = () => {
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const lng = coords.longitude;
        const lat = coords.latitude;
        if (mapRef.current) {
          mapRef.current.flyTo({ center: [lng, lat], zoom: 14 });
          if (markerRef.current) {
            markerRef.current.setLngLat([lng, lat]);
            const el = markerRef.current.getElement();
            el.style.cursor = "pointer";
            el.addEventListener("click", (ev) => {
              ev.stopPropagation();
              onMarkerClick();
            });
          } else {
            const newMarker = new maplibregl.Marker({ color: "#f00" })
              .setLngLat([lng, lat])
              .addTo(mapRef.current);
            const el = newMarker.getElement();
            el.style.cursor = "pointer";
            el.addEventListener("click", (ev) => {
              ev.stopPropagation();
              onMarkerClick();
            });
            markerRef.current = newMarker;
          }
        }
      },
      (err) => {
        console.error("Geolocation error:", err);
        alert("Location access denied or unavailable.");
      }
    );
  };

  return (
    <div className="relative h-full w-full" style={{ minHeight: "97vh" }}>
      <div ref={mapContainer} className="h-full w-full" />

      {/* Custom Controller Buttons */}
      <div className="absolute top-20 right-4 z-50 flex flex-col gap-2">
        <Button
          size="icon"
          className="bg-white text-black hover:bg-gray-100 shadow-md rounded-xl"
          onClick={handleZoomIn}
        >
          <Plus className="h-5 w-5" />
        </Button>
        <Button
          size="icon"
          className="bg-white text-black hover:bg-gray-100 shadow-md rounded-xl"
          onClick={handleZoomOut}
        >
          <Minus className="h-5 w-5" />
        </Button>
        <Button
          size="icon"
          className="bg-white text-black hover:bg-gray-100 shadow-md rounded-xl"
          onClick={handleLocateUser}
        >
          <LocateFixed className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
