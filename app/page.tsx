"use client";
import { useEffect, useRef, useState } from "react";
import { Metadata } from "next";
import { ThemeDD } from "./components/ThemeDD";
import BottomNav from "./components/bottomnav";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

// using --- https://ui.shadcn.com/docs/components/navigation-menu ---
// for navigation bar

// see end for updates

// This meta data line is giving error when used along with 'use client'

// export const metadata: Metadata = {
//   title: 'Campus Compass',
// };

export default function Page() {
  const mapRef = useRef<maplibregl.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [markers, setMarkers] = useState([]);

  useEffect(() => {
    mapRef.current = new maplibregl.Map({
      container: mapContainerRef.current!,
      style:
        "https://api.maptiler.com/maps/streets-v2/style.json?key=LlBgIboBwPwSOXm52XBf",
      center: [80.2335, 26.5123],
      zoom: 15,
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
      }
    }; // cleanup on unmount
  }, []);

  const searchPlace = async () => {
    console.log("Search function called");
    if (!query) return;
    console.log("query:", query);

    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        query
      )}`
    );
    const results = await res.json();

    if (results.length === 0) {
      alert("No results found");
      return;
    }

    const { lat, lon, display_name } = results[0];

    const coordinates = [parseFloat(lon), parseFloat(lat)];
    console.log("Display Name:", display_name);
    {
      if (mapRef.current) {
        mapRef.current.flyTo({ center: coordinates, zoom: 18 });
      }
    }
    // Remove previous markers if any
    markers.forEach((marker) => marker.remove());

    const newMarker = new maplibregl.Marker()
      .setLngLat(coordinates)
      .setPopup(
        new maplibregl.Popup().setHTML(
          `<div style="color:black;">${display_name}</div>`
        )
      )
      .addTo(mapRef.current);
    // Update the markers state with the new marker
    setMarkers([newMarker]); // Add the new marker to the state
  };

  return (
    <>
      <ThemeDD></ThemeDD>
      <div
        ref={mapContainerRef}
        className="w-full h-full"
        style={{ height: "100vh", width: "100vw" }}
      ></div>

      <div
        style={{
          position: "absolute",
          top: 10,
          left: 10,
          zIndex: 999,
          background: "white",
          padding: "10px",
          borderRadius: "8px",
        }}
      >
        <input
          type="text"
          placeholder="Search a place..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ padding: "6px", width: "200px", marginRight: "8px" }}
        />
        <button onClick={searchPlace} style={{ padding: "6px 12px" }}>
          Search
        </button>
      </div>

      <div>
        <main className="p-4">
          <h1 className="text-2xl font-bold">Campus Compass</h1>
          {/* <p>Welcome to the app!</p> */}
        </main>

        <BottomNav />
      </div>
    </>
  );
}
// have to properly apply the bottom nav bar, have created the the links and buttons
// specific links are to be done by respective members
// rest done

// eg, search: hall 2 canteen

// have to apply IIT Kanpur area-based restrictions
// might apply regex-based filters to filter out IITK
// connect to iitk-sec and go to http://172.23.156.156:3000/
