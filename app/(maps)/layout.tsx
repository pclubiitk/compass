"use client";

import dynamic from "next/dynamic";
import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import AddLocationDrawer from "@/components/AddLocationDrawer";
import { BottomNav } from "@/components/BottomNavbar";
import { useLocations } from "@/app/hooks/useLocations";
import { usePathname, useRouter } from "next/navigation";
import { useGContext } from "@/components/ContextProvider";
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

const Map = dynamic(() => import("@/app/components/Map"), {
  ssr: false,
  loading: () => <div className="h-screen w-screen bg-gray-100" />,
});

export default function MapsLayout({ children }: { children: React.ReactNode }) {
  const { locations } = useLocations();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { isLoggedIn } = useGContext();
  const isLocationPage = pathname?.startsWith("/location");

  // Trigger drawer open globally when "Add Location" pressed
  useEffect(() => {
    const handler = () => setDrawerOpen(true);
    window.addEventListener("trigger-add-location", handler);
    return () => window.removeEventListener("trigger-add-location", handler);
  }, []);

  // Memoize the handler to prevent Map re-initialization
  const handleMarkerClick = useMemo(() => () => {
    if (!isLoggedIn) {
      setLoginDialogOpen(true);
      return;
    }
    setDrawerOpen(true);
  }, [isLoggedIn]);

  // Keep the map stable — only update when locations change
  const memoMap = useMemo(
    () => (
      <div id="map-wrapper" className="h-full w-full">
        <Map onMarkerClick={handleMarkerClick} locations={locations} />
      </div>
    ),
    [locations, handleMarkerClick]
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

      <div
        className={`absolute inset-0 z-30 ${isLocationPage
          ? "overflow-y-auto pointer-events-auto bg-gray-50/50 dark:bg-zinc-950/50"
          : "pointer-events-none"
          }`}
      >
        <div className={isLocationPage ? "min-h-full" : "pointer-events-auto"}>
          {children}
        </div>
      </div>

      <BottomNav />

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
    </div>
  );
}
