"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"

export function ModeToggle() {
  const { setTheme } = useTheme()

  // Force system on mount
  React.useEffect(() => {
    setTheme("system")
  }, [setTheme])

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="h-12 w-12" variant="outline" size="icon">
          <Sun className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        <DropdownMenuItem
          disabled
          onClick={() => toast("Light mode coming soon")}
        >
          Light <span className="ml-auto text-xs text-muted-foreground">Coming soon</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          disabled
          onClick={() => toast("Dark mode coming soon")}
        >
          Dark <span className="ml-auto text-xs text-muted-foreground">Coming soon</span>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => setTheme("system")}>
          System 
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
