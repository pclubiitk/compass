// import { CalendarIc } from "lucide-react"

"use client";

import { Button } from "@/components/ui/button";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Check, Clipboard } from "lucide-react";
import { useState } from "react";

export function ShareButton() {
  const [isCopied, setIsCopied] = useState(false);

  const copyToClipboard = (text: string) => {
    return () => {
      navigator.clipboard
        .writeText(text)
        .then(() => {
          setIsCopied(true);
          setTimeout(() => setIsCopied(false), 2000); // Reset after 2 seconds
        })
        .catch((err) => {
          console.error("Failed to copy:", err);
        });
    };
  };

  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <Button
          onPointerEnter={(e) => e.preventDefault()}
          onPointerLeave={(e) => e.preventDefault()}
          variant="default"
        >
          Share
        </Button>
      </HoverCardTrigger>

      <HoverCardContent>
        <div className="flex flex-col gap-2">
          <input
            type="text"
            className="p-4 border-1 "
            value={window.location.href}
            readOnly
          />
          {isCopied ? (
            <Check />
          ) : (
            <Clipboard onClick={copyToClipboard(window.location.href)} />
          )}
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
