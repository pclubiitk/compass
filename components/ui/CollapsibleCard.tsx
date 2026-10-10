"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";

interface CollapsibleCardProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  /** Use naked=true when children already render their own Card shell */
  naked?: boolean;
}

export function CollapsibleCard({
  title,
  icon,
  children,
  defaultOpen = true,
  naked = false,
}: CollapsibleCardProps) {
  const [open, setOpen] = useState(defaultOpen);

  const chevron = (
    <ChevronDown
      className={`w-5 h-5 text-muted-foreground transition-transform duration-200 ${open ? "rotate-180" : ""}`}
    />
  );

  if (naked) {
    return (
      <div>
        <div
          className="cursor-pointer select-none flex items-center justify-between px-6 py-4 rounded-lg border bg-card text-card-foreground shadow-sm"
          onClick={() => setOpen((o) => !o)}
        >
          <span className="flex items-center gap-2 font-semibold text-lg">
            {icon}
            {title}
          </span>
          {chevron}
        </div>
        {open && <div className="mt-2">{children}</div>}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader
        className="cursor-pointer select-none"
        onClick={() => setOpen((o) => !o)}
      >
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            {icon}
            {title}
          </span>
          {chevron}
        </CardTitle>
      </CardHeader>
      {open && (
        <div className="p-2 sm:p-4 lg:p-6 pt-0">
          {children}
        </div>
      )}
    </Card>
  );
}
