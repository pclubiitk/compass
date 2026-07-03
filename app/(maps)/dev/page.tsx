"use client";

import { useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Map, Source, Layer } from "@vis.gl/react-maplibre";
import type { MapLayerMouseEvent } from "@vis.gl/react-maplibre";
import type { CircleLayerSpecification, SymbolLayerSpecification } from "maplibre-gl";
import type { FeatureCollection } from "geojson";
import { useLocations, type Location } from "@/app/hooks/useLocations";
import "maplibre-gl/dist/maplibre-gl.css";

const IITK_CENTER = {
  longitude: 80.23273232675717,
  latitude: 26.50939610022435,
  zoom: 14,
};

const LAYER_COLORS: Record<number, string> = {
  1: "#029987",
  2: "#123456",
  3: "#530299",
  4: "#0be3ff",
  5: "#52ff63",
};

function maxLayerForZoom(zoom: number): number {
  if (zoom > 17) return 5;
  if (zoom > 16.5) return 4;
  if (zoom > 16) return 3;
  if (zoom > 15) return 2;
  return 1;
}

function buildCircleLayer(maxVisibleLayer: number): CircleLayerSpecification {
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
      "circle-color": [
        "match",
        ["get", "layer"],
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
        "#6b806c",
      ],
      "circle-stroke-width": 2,
      "circle-stroke-color": "#ffffff",
    },
  };
}

function buildTextLayer(maxVisibleLayer: number): SymbolLayerSpecification {
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
      "text-color": "#333333",
      "text-halo-color": "#ffffff",
      "text-halo-width": 1.5,
    },
  };
}

export default function AdminMap() {
  const { locations } = useLocations();
  const router = useRouter();
  const [zoom, setZoom] = useState(IITK_CENTER.zoom);
  const [cursor, setCursor] = useState<string>("grab");

  const maxVisibleLayer = maxLayerForZoom(zoom);

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
    () => buildCircleLayer(maxVisibleLayer),
    [maxVisibleLayer],
  );

  const textLayer = useMemo(
    () => buildTextLayer(maxVisibleLayer),
    [maxVisibleLayer],
  );

  const handleClick = useCallback(
    (e: MapLayerMouseEvent) => {
      const feature = e.features?.[0];
      const locationId = feature?.properties?.locationId;
      if (!locationId) return;

      router.push(`/location/${locationId}`);
    },
    [router],
  );

  const handleMouseEnter = useCallback(() => setCursor("pointer"), []);
  const handleMouseLeave = useCallback(() => setCursor("grab"), []);

  return (
    <div className="relative h-screen w-screen">
      <Map
        initialViewState={IITK_CENTER}
        style={{ width: "100%", height: "100%" }}
        mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
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

      <div className="absolute top-4 left-4 z-10 rounded-lg border bg-white/90 px-3 py-2 text-sm shadow-md backdrop-blur">
        <p className="font-medium">Layer visibility</p>
        <p className="text-muted-foreground">
          Zoom {zoom.toFixed(1)} · showing layers 1–{maxVisibleLayer}
        </p>
        <p className="text-muted-foreground">{geojson.features.length} locations</p>
      </div>
    </div>
  );
}
