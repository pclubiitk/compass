"use client";

import { MapPinSearch, UserSearch, Megaphone, Plus, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter, usePathname } from "next/navigation";
import { useGContext } from "@/components/ContextProvider";
import { toast } from "sonner";

export function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const { isLoggedIn, isGlobalLoading } = useGContext();

  const navItems = [
    { icon: MapPinSearch, label: "Location", path: "/maps" },
    { icon: UserSearch, label: "Search", path: process.env.NEXT_PUBLIC_SEARCH_DOMAIN || ""},
    { icon: Megaphone, label: "Noticeboard", path: "/noticeboard" },
    { icon: Plus, label: "Location", path: "" },
    { icon: User, label: "Profile", path: "/" },
  ];

  const handleClick = async (
    label: string,
    path: string,
    e?: React.MouseEvent,
  ) => {
    e?.preventDefault();

    if (label === "Location") {
      if (isGlobalLoading) return;

      if (!isLoggedIn) {
        router.push(`/login?callbackUrl=${encodeURIComponent("/")}`);
        return;
      }

      if (pathname !== "/maps") {
        toast.error(" Please select a location on the map first.", {
          duration: 2000,
        });
        router.push("/maps");
        return;
      }

      const mapRef = window.mapRef.current;
      const userMarker = window.userMarkerRef?.current;

      if (mapRef) {
        const pos = userMarker ? userMarker.getLngLat() : mapRef.getCenter();
        localStorage.setItem("selected_lat", pos.lat.toString());
        localStorage.setItem("selected_lon", pos.lng.toString());
        window.dispatchEvent(new Event("trigger-add-location"));
      } else {
        toast.warning("Map not ready yet — please wait a moment.");
      }

      return;
    }

    if (label === "Noticeboard") {
      if (isGlobalLoading) return;
      if (!isLoggedIn) {
        router.push(`/login?callbackUrl=${encodeURIComponent("/noticeboard")}`);
        return;
      }
    }

    if (path) {
      router.push(path);
      window.scrollTo(0, 0);
    }
  };

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md bg-white py-2 rounded-full shadow-md flex items-center justify-between gap-0.5 border">
      {navItems.map(({ icon: Icon, label, path }) => (
        <Button
          key={label}
          variant="link"
          className="flex flex-col items-center justify-center min-w-15"
          onClick={(e) => handleClick(label, path, e)}
        >
          <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-gray-700" />
          <span className="text-xs sm:text-sm text-gray-700 font-medium">
            {label}
          </span>
        </Button>
      ))}
    </div>
  );
}
