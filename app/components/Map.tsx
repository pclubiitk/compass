"use client";

import { useEffect, useRef, useState, useCallback } from "react";
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

  // Store the click handler and element to enable proper cleanup
  const markerClickHandlerRef = useRef<{
    handler: (e: Event) => void;
    element: HTMLElement;
  } | null>(null);

  // Helper function to attach click handler to marker element
  const attachMarkerClickHandler = useCallback((marker: maplibregl.Marker) => {
    const el = marker.getElement();
    el.style.cursor = "pointer";
    
    // Remove previous listener if it exists
    if (markerClickHandlerRef.current) {
      markerClickHandlerRef.current.element.removeEventListener(
        "click",
        markerClickHandlerRef.current.handler
      );
    }
    
    // Create and store new handler
    const handler = (e: Event) => {
      e.stopPropagation();
      onMarkerClick();
    };
    markerClickHandlerRef.current = { handler, element: el };
    el.addEventListener("click", handler);
  }, [onMarkerClick]);

  // Helper function to update or create marker at a position
  const updateMarker = useCallback((map: maplibregl.Map, lng: number, lat: number) => {
    if (markerRef.current) {
      markerRef.current.setLngLat([lng, lat]);
      attachMarkerClickHandler(markerRef.current);
    } else {
      const newMarker = new maplibregl.Marker({ color: "#f00" })
        .setLngLat([lng, lat])
        .addTo(map);
      attachMarkerClickHandler(newMarker);
      markerRef.current = newMarker;
    }
  }, [attachMarkerClickHandler]);

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

    let handleSearchLocation: ((e: any) => void) | null = null;

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const map = new maplibregl.Map({
          container: mapContainer.current!,
          style:
            "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
          center: [coords.longitude, coords.latitude],
          zoom: 14,
        });

        // Create initial marker
        const marker = new maplibregl.Marker({ color: "#f00" })
          .setLngLat([coords.longitude, coords.latitude])
          .addTo(map);

        attachMarkerClickHandler(marker);
        markerRef.current = marker;
        mapRef.current = map;

        window.mapRef = mapRef;
        window.markerRef = markerRef;

        // Handle map clicks to move marker
        map.on("click", (e) => {
          const { lng, lat } = e.lngLat;
          map.flyTo({ center: [lng, lat], zoom: 14 });
          updateMarker(map, lng, lat);
        });

        // Handle search location events
        handleSearchLocation = (e: any) => {
          const { lng, lat } = e.detail;
          map.flyTo({ center: [lng, lat], zoom: 14 });
          updateMarker(map, lng, lat);
        };
        window.addEventListener("search-location", handleSearchLocation);

        setTimeout(() => {
          map.resize();
        }, 200);
      },
      (err) => console.error("Geolocation error:", err)
    );

    // Cleanup function for the effect
    return () => {
      if (handleSearchLocation) {
        window.removeEventListener("search-location", handleSearchLocation);
      }
      if (markerClickHandlerRef.current) {
        markerClickHandlerRef.current.element.removeEventListener(
          "click",
          markerClickHandlerRef.current.handler
        );
        markerClickHandlerRef.current = null;
      }
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      if (markerRef.current) {
        markerRef.current = null;
      }
    };
  }, [isReady, attachMarkerClickHandler, updateMarker]);

  const handleZoomIn = useCallback(() => {
    if (mapRef.current) mapRef.current.zoomIn();
  }, []);

  const handleZoomOut = useCallback(() => {
    if (mapRef.current) mapRef.current.zoomOut();
  }, []);

  const handleLocateUser = useCallback(() => {
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const lng = coords.longitude;
        const lat = coords.latitude;
        if (mapRef.current) {
          mapRef.current.flyTo({ center: [lng, lat], zoom: 14 });
          updateMarker(mapRef.current, lng, lat);
        }
      },
      (err) => {
        console.error("Geolocation error:", err);
        alert("Location access denied or unavailable.");
      }
    );
  }, [updateMarker]);

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
