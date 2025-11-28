"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
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
import { useLocations } from "@/app/hooks/useLocations";

export default function Home() {
  const { isLoggedIn, isGlobalLoading } = useGContext();
  const { isValidating } = useLocations();
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Search handler
  const handleSearch = async () => {
    if (!query.trim()) return;
    const mapRef = (window as any).mapRef;
    if (!mapRef?.current) return;

    const coordMatch = query.match(/^\s*(-?\d+(\.\d+)?),\s*(-?\d+(\.\d+)?)\s*$/);
    let lng, lat;

    if (coordMatch) {
      lng = parseFloat(coordMatch[1]);
      lat = parseFloat(coordMatch[3]);
    } else {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json`
      );
      const data = await res.json();
      if (!data[0]) return alert("❌ Location not found");
      lat = parseFloat(data[0].lat);
      lng = parseFloat(data[0].lon);
    }

    mapRef.current.flyTo({ center: [lng, lat], zoom: 14 });
  };

  return (
    <>
      {/* Login Required Dialog */}
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

      {/* Search Bar Overlay */}
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

      {/* Sync indicator */}
      {mounted && isValidating && (
        <div className="absolute bottom-4 right-4 text-xs text-gray-600 bg-white/80 px-3 py-1 rounded-md shadow">
          Syncing latest data…
        </div>
      )}
    </>
  );
}
