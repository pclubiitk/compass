import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useGContext } from "@/components/ContextProvider";

interface DraftEntry {
  rollNo: string;
  name: string;
  dept?: string;
  course?: string;
  hall?: string;
  email?: string;
  gender?: string;
}

interface PuppyLoveSelectionsPanelProps {
  onClose: () => void;
  variant?: "desktop" | "mobile";
}

export const PuppyLoveSelectionsPanel = ({ onClose, variant = "desktop" }: PuppyLoveSelectionsPanelProps) => {
  const { puppyLoveHeartsSent } = useGContext();
  const [drafts, setDrafts] = useState<DraftEntry[]>([]);

  const handleSearchClick = (searchTerm: string) => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent('puppylove:search', { detail: { name: searchTerm } }));
    }
  };

  const loadDrafts = () => {
    if (typeof window === "undefined") return;
    try {
      const stored = sessionStorage.getItem("puppylove_draft_hearts");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setDrafts(parsed);
          return;
        }
      }
    } catch {
      // ignore parsing errors
    }
    setDrafts([]);
  };

  useEffect(() => {
    loadDrafts();
  }, []);

  useEffect(() => {
    const handleDraftSaved = () => loadDrafts();
    const handleSelectionsOpen = () => loadDrafts();

    if (typeof window !== "undefined") {
      window.addEventListener("puppylove:draftSaved", handleDraftSaved);
      window.addEventListener("puppylove:selectionsOpen", handleSelectionsOpen);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("puppylove:draftSaved", handleDraftSaved);
        window.removeEventListener("puppylove:selectionsOpen", handleSelectionsOpen);
      }
    };
  }, []);

  const wrapperClassName =
    variant === "desktop"
      ? "hidden md:block fixed top-6 right-6 z-50 w-[260px] max-h-[80vh]"
      : "md:hidden w-full px-4 flex justify-center mt-2";

  return (
    <div className={wrapperClassName}>
      <Card
        className={
          variant === "mobile"
            ? "w-full max-w-md overflow-hidden border-none bg-rose-50/90 shadow-[0_10px_40px_rgba(225,29,72,0.15)]"
            : "h-full overflow-hidden border-none bg-rose-50/90 shadow-[0_10px_40px_rgba(225,29,72,0.15)]"
        }
      >
        <CardHeader className="flex flex-row items-center justify-between border-b border-rose-200/70 px-2">
          <CardTitle className="text-lg text-rose-500">Your Selections</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-rose-500">
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4 overflow-auto max-h-[70vh] px-2 pr-1">
          <div>
            <h3 className="text-sm font-semibold mb-2 text-rose-500">Drafts</h3>
            {drafts.length === 0 ? (
              <p className="text-xs text-muted-foreground">No drafts yet.</p>
            ) : (
              <div className="space-y-2">
                {drafts.map((d) => (
                  <div 
                    key={d.rollNo} 
                    className="rounded-lg bg-rose-100/80 px-3 py-2 cursor-pointer hover:bg-rose-200/70 transition-colors"
                    onClick={() => handleSearchClick(d.rollNo)}
                  >
                    <div className="text-sm font-medium text-rose-500">{d.name}</div>
                    <div className="text-xs text-rose-400">{d.rollNo}{d.dept ? ` • ${d.dept}` : ""}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-2 text-rose-500">Sent</h3>
            {!puppyLoveHeartsSent || puppyLoveHeartsSent.length === 0 ? (
              <p className="text-xs text-muted-foreground">No sent hearts yet.</p>
            ) : (
              <div className="space-y-2">
                {puppyLoveHeartsSent.map((h: any, idx: number) => (
                  <div 
                    key={`${h.recipientId || idx}`} 
                    className="rounded-lg bg-rose-100/80 px-3 py-2 cursor-pointer hover:bg-rose-200/70 transition-colors"
                    onClick={() => handleSearchClick(h.recipientId)}
                  >
                    <div className="text-sm font-medium text-rose-500">{h.recipientName || h.recipientId}</div>
                    <div className="text-xs text-rose-400">{h.recipientId || ""}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
