"use client";

import { Search, Megaphone, Plus, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export function BottomNav() {
  const router = useRouter();

  const navItems = [
    { icon: Search, label: "Search", path: "/" },
    { icon: Megaphone, label: "Noticeboard", path: "/noticeboard" },
    { icon: Plus, label: "Add Location", path: "/location" },
    { icon: User, label: "Profile", path: "/profile" },
  ];

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 w-[100%] max-w-md bg-white px-2 py-2 rounded-full shadow-md flex items-center justify-between gap-0.5 border">
      {navItems.map(({ icon: Icon, label, path }) => (
        <Button
          key={label}
          variant="ghost"
          className="flex flex-col items-center justify-center px-0 min-w-[60px] sm:min-w-[72px]"
          onClick={() => {
            router.push(path);
            window.scrollTo(0, 0);
          }}
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
