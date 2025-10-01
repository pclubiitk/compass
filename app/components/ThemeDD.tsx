"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { IconChevronDown } from "@tabler/icons-react";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Laptop, Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes";

export function ThemeDD() {
  const Themes=[
  {theme:"system",children:(
  <>
  <Laptop className="mr-2 h-4 w-4" />
  <span>System</span>
  </>
  )}
  ,{theme:"light",children:(
  <>
  <Sun className="mr-2 h-4 w-4" />
  <span>Light</span>
  </>
  )},{theme:"dark",children:(
  <>
  <Moon className="mr-2 h-4 w-4" />
  <span>Dark</span>
  </>
  )}]








  const { theme,setTheme } = useTheme()

  // Handle initial load and system preference
  React.useEffect(() => {
    const html = document.documentElement;

    // Clear all theme classes
    html.classList.remove('light', 'dark', 'theme-rose', 'theme-slate');

    if (theme === 'system') {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      html.classList.toggle('dark', isDark);
    } else if (theme === 'dark') {
      html.classList.add('dark');
    } else if (theme === 'light') {
      html.classList.add('light');
    } else if (theme === 'theme-rose') {
      html.classList.add('theme-rose');
    } else if (theme === 'theme-slate') {
      html.classList.add('theme-slate');
    }
  }, [theme]);



  return (
    <div className="flex flex-col gap-3 m-10">
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="group flex items-center gap-2">
          Select Theme{" "}
          <IconChevronDown
            stroke={2}
            className="h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-180"
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        {Themes.map((themeObj) => (
          <DropdownMenuCheckboxItem
            key={themeObj.theme}
            checked={theme === themeObj.theme}
            onClick={() => setTheme(themeObj.theme)}
          >
            {themeObj.children}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
    </div>
  );
}
