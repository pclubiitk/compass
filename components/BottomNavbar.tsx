"use client";

import { Search, Megaphone, Plus, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter, usePathname } from "next/navigation";
import { useGContext } from "@/components/ContextProvider";
import { useState } from "react";
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
import { toast } from "sonner";

export function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const { isLoggedIn, isGlobalLoading } = useGContext();
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);

  const navItems = [
    { icon: Search, label: "Search", path: "/" },
    { icon: Megaphone, label: "Noticeboard", path: "/noticeboard" },
    { icon: Plus, label: "Add Location", path: "" },
    { icon: User, label: "Profile", path: "/profile" },
  ];

  const handleClick = async (
    label: string,
    path: string,
    e?: React.MouseEvent
  ) => {
    e?.preventDefault();

    // Instant drawer trigger (no routing)
    if (label === "Add Location") {
      if (isGlobalLoading) return;

      //  Require login
      if (!isLoggedIn) {
        setLoginDialogOpen(true);
        return;
      }

      // If not on map → go home first then open
      if (pathname !== "/") {
        toast.error(" Please select a location on the map first.", {
          duration: 2000,
        });
        router.push("/");
        
        return;
      }

      //  Already on map — open instantly
      const mapRef = window.mapRef.current;
      const markerRef = window.markerRef.current;

      // TODO: Verify the logic
      if (mapRef) {
        const pos = markerRef.length
          ? markerRef[0].getLngLat()
          : mapRef.getCenter();
        localStorage.setItem("selected_lat", pos.lat.toString());
        localStorage.setItem("selected_lon", pos.lng.toString());
        window.dispatchEvent(new Event("trigger-add-location")); // 💫 open drawer
      } else {
        toast.warning("Map not ready yet — please wait a moment.");
      }

      return;
    }

    // Normal navigation for others
    if (path) {
      router.push(path);
      window.scrollTo(0, 0);
    }
  };

  return (
    <>
      {/*  Login Required Dialog */}
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

      {/*  Bottom Navigation Bar */}
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md bg-white px-2 py-2 rounded-full shadow-md flex items-center justify-between gap-0.5 border">
        {navItems.map(({ icon: Icon, label, path }) => (
          <Button
            key={label}
            variant="ghost"
            className="flex flex-col items-center justify-center px-0 min-w-15 sm:min-w-18"
            onClick={(e) => handleClick(label, path, e)}
          >
            <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-gray-700" />
            <span className="text-xs sm:text-sm text-gray-700 font-medium">
              {label}
            </span>
          </Button>
        ))}
      </div>
    </>
  );
}
