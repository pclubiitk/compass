"use client";

import dynamic from "next/dynamic";
import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import AddLocationDrawer from "@/components/AddLocationDrawer";
import { BottomNav } from "@/components/BottomNavbar";
import { useLocations } from "@/app/hooks/useLocations";

const Map = dynamic(() => import("@/app/components/Map"), {
  ssr: false,
  loading: () => <div className="h-screen w-screen bg-gray-100" />,
});

export default function MapsLayout({ children }: { children: React.ReactNode }) {
  const { locations } = useLocations();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Trigger drawer open globally when "Add Location" pressed
  useEffect(() => {
    const handler = () => setDrawerOpen(true);
    window.addEventListener("trigger-add-location", handler);
    return () => window.removeEventListener("trigger-add-location", handler);
  }, []);

  // Keep the map stable — no rerender when locations update
  const memoMap = useMemo(
    () => (
      <div id="map-wrapper" className="h-full w-full">
        <Map onMarkerClick={() => setDrawerOpen(true)} locations={locations} />
      </div>
    ),
    [] //  do NOT depend on locations (we’ll refresh markers manually)
  );

  // Trigger refresh-markers event when new data fetched
  useEffect(() => {
    if (locations?.length) {
      window.dispatchEvent(new Event("refresh-markers"));
    }
  }, [locations]);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-gray-50">
      {memoMap}

      {/* Render Drawer outside Map React tree for isolation */}
      {typeof window !== "undefined" &&
        createPortal(
          <AddLocationDrawer
            open={drawerOpen}
            onOpenChange={(open) => {
              setDrawerOpen(open);
              if (!open) {
                // Trigger global events to re-sync markers & layout
                window.dispatchEvent(new Event("drawer-close"));
                window.dispatchEvent(new Event("refresh-markers"));
              }
            }}
          />,
          document.body
        )}

      <div className="absolute inset-0 pointer-events-none">
        <div className="pointer-events-auto">{children}</div>
      </div>

      <BottomNav />
    </div>
  );
}
