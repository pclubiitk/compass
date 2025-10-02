"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, User, BookOpen, Megaphone, Plus } from "lucide-react";

const Map = dynamic(() => import("@/app/components/Map"), { ssr: false });

export default function Home() {
  const [query, setQuery] = useState("");
  const router = useRouter();

  const onMarkerClick = () => {
    router.push("/location/review");
  };

  const handleSearch = async () => {
    if (!window || !query.trim()) return;

    const mapRef = window.mapRef;
    const markerRef = window.markerRef;

    const coordMatch = query.match(
      /^\s*(-?\d+(\.\d+)?),\s*(-?\d+(\.\d+)?)\s*$/
    );

    let lng: number, lat: number;

    if (coordMatch) {
      lng = parseFloat(coordMatch[1]);
      lat = parseFloat(coordMatch[3]);
    } else {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          query
        )}&format=json`
      );
      const data = await res.json();
      if (!data[0]) return alert("Location not found");
      lat = parseFloat(data[0].lat);
      lng = parseFloat(data[0].lon);
    }

    if (mapRef && mapRef.current) {
      mapRef.current.flyTo({ center: [lng, lat], zoom: 14 });

      if (markerRef && markerRef.current) {
        markerRef.current.setLngLat([lng, lat]);
      } else {
        const maplibregl = (await import("maplibre-gl")).default;
        markerRef.current = new maplibregl.Marker({ color: "#f00" })
          .setLngLat([lng, lat])
          .addTo(mapRef.current);
      }
    }
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      {/* Search Bar */}
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

      {/* Pass onMarkerClick */}
      <Map onMarkerClick={onMarkerClick} />
     
    </div>
  );
}
