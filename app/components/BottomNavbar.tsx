// "use client";

// import { Search, Megaphone, Plus, User, Sun, Moon } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import { useRouter } from "next/navigation";
// import { useTheme } from "next-themes";
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu";


// export function BottomNav() {
//   const router = useRouter();
//   const { theme, setTheme } = useTheme();

//   const navItems = [
//     { icon: Search, label: "Search", path: "/" },
//     { icon: Megaphone, label: "Noticeboard", path: "/noticeboard/v1" },
//     { icon: Plus, label: "Add Location", path: "/location" },
//     { icon: User, label: "Profile", path: "/profile" },
//   ];

//   return (
//     <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 w-[100%] max-w-md bg-white px-2 py-2 rounded-full shadow-md flex items-center justify-between gap-0.5 border">
//       {navItems.map(({ icon: Icon, label, path }) => (
//         <Button
//           key={label}
//           variant="ghost"
//           className="flex flex-col items-center justify-center gap-0.5 px-0 min-w-[50px] sm:min-w-[64px]"
//           onClick={() => {
//             router.push(path);
//             window.scrollTo(0, 0);
//           }}
//         >
//           <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
//           <span className="text-[9px] sm:text-[11px] text-gray-600 text-center leading-tight">
//             {label}
//           </span>
//         </Button>
//       ))}

//       {/* Theme Selector as part of nav */}
//       <DropdownMenu>
//         <DropdownMenuTrigger asChild>
//           <Button
//             variant="ghost"
//             className="flex flex-col items-center justify-center gap-0.5 px-0 min-w-[50px] sm:min-w-[64px]"
//           >
//             {theme === "dark" ? (
//               <Moon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
//             ) : (
//               <Sun className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
//             )}
//             <span className="text-[9px] sm:text-[11px] text-gray-600 text-center leading-tight">
//               Theme
//             </span>
//           </Button>
//         </DropdownMenuTrigger>
//         <DropdownMenuContent align="end" className="w-40">
//           <DropdownMenuItem onClick={() => setTheme("light")}>
//             <Sun className="mr-2 h-4 w-4" />
//             Light
//           </DropdownMenuItem>
//           <DropdownMenuItem onClick={() => setTheme("dark")}>
//             <Moon className="mr-2 h-4 w-4" />
//             Dark
//           </DropdownMenuItem>
//         </DropdownMenuContent>
//       </DropdownMenu>
//     </div>
//   );
// }
"use client";

import { Search, Megaphone, Plus, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export function BottomNav() {
  const router = useRouter();

  const navItems = [
    { icon: Search, label: "Search", path: "/" },
    { icon: Megaphone, label: "Noticeboard", path: "/noticeboard/v1" },
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
