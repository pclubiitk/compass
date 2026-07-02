"use client";

import { useState, useEffect, useCallback } from "react";
import { CalendarDays, Copy, RefreshCw, ExternalLink, CheckCircle2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

import { getCalendarToken, regenerateCalendarToken } from "@/calendar/requests";
import type { CalendarTokenResponse } from "@/calendar/requests";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogHeader,
  DialogContent,
  DialogTrigger,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";

interface CalendarSyncDialogProps {
  children: React.ReactNode;
}

export function CalendarSyncDialog({ children }: CalendarSyncDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tokenData, setTokenData] = useState<CalendarTokenResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [copied, setCopied] = useState<"webcal" | "https" | null>(null);
  const [showRegenerateConfirm, setShowRegenerateConfirm] = useState(false);

  const fetchToken = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const data = await getCalendarToken();
      setTokenData(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setLoadError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchToken();
    }
  }, [isOpen, fetchToken]);

  const handleCopy = async (url: string, type: "webcal" | "https") => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(type);
      toast.success("URL copied to clipboard!");
      setTimeout(() => setCopied(null), 2500);
    } catch {
      toast.error("Failed to copy. Please copy manually.");
    }
  };

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    setShowRegenerateConfirm(false);
    try {
      const data = await regenerateCalendarToken();
      setTokenData(data);
      toast.success("Calendar token regenerated. Update your subscriptions with the new URL.");
    } catch {
      toast.error("Failed to regenerate token. Please try again.");
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarDays className="size-5 text-primary" />
            Sync with Calendar Apps
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2 min-w-0">
          <p className="text-sm text-muted-foreground">
            Subscribe to your Campus Compass calendar in Google Calendar, Apple Calendar, or Outlook.
            Your personal events and campus notices will sync automatically.
          </p>

          {isLoading ? (
            <div className="flex items-center justify-center py-6">
              <RefreshCw className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : loadError ? (
            <div className="rounded-md border border-destructive/30 bg-destructive/5 p-4 space-y-2">
              <p className="text-xs text-destructive flex items-start gap-1.5">
                <AlertTriangle className="size-3.5 mt-0.5 shrink-0" />
                Failed to load your sync URL. Make sure you&apos;re logged in and the server is running.
              </p>
              <p className="text-xs text-muted-foreground font-mono">{loadError}</p>
              <Button size="sm" variant="outline" className="text-xs h-7" onClick={fetchToken}>
                <RefreshCw className="size-3 mr-1" />
                Retry
              </Button>
            </div>
          ) : tokenData ? (
            <>
              {/* webcal:// URL (primary) */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Subscription URL
                </label>
                <div className="flex items-center gap-2 min-w-0">
                  <code className="flex-1 min-w-0 truncate rounded-md border bg-muted px-3 py-2 text-xs font-mono">
                    {tokenData.webcal_url}
                  </code>
                  <Button
                    size="icon"
                    variant="outline"
                    className="shrink-0"
                    onClick={() => handleCopy(tokenData.webcal_url, "webcal")}
                    aria-label="Copy webcal URL"
                  >
                    {copied === "webcal" ? (
                      <CheckCircle2 className="size-4 text-green-500" />
                    ) : (
                      <Copy className="size-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Step-by-step instructions */}
              <div className="rounded-lg border bg-muted/40 p-4 space-y-3">
                <p className="text-xs font-semibold">How to subscribe:</p>
                <ol className="text-xs text-muted-foreground space-y-3 list-decimal list-inside">
                  <li>
                    <span className="font-medium text-foreground">Google Calendar: </span>
                    Other calendars (left sidebar) → <em>From URL</em> → paste the URL above
                    <div className="text-[10px] text-muted-foreground/80 pl-4 pt-1 leading-snug">
                      * Works only on the Google Calendar website. On mobile, open the website in your browser in desktop mode.
                    </div>
                  </li>
                  <li>
                    <span className="font-medium text-foreground">Apple Calendar (macOS): </span>
                    File → New Calendar Subscription → paste the URL above
                  </li>
                  <li>
                    <span className="font-medium text-foreground">Apple Calendar (iOS): </span>
                    Settings → Calendar → Accounts → Add Account → Other → Add Subscribed Calendar → paste URL
                  </li>
                </ol>
                <p className="text-xs text-muted-foreground/70 mt-2 border-t pt-2">
                  Apple Calendar refreshes every minute. Google Calendar refreshes every 12–24 hours.
                </p>
              </div>

              {/* Alternative https URL */}
              <details className="text-xs">
                <summary className="cursor-pointer text-muted-foreground hover:text-foreground select-none">
                  Need an https:// URL instead?
                </summary>
                <div className="flex items-center gap-2 mt-2 min-w-0">
                  <code className="flex-1 min-w-0 truncate rounded-md border bg-muted px-3 py-2 text-xs font-mono">
                    {tokenData.https_url}
                  </code>
                  <Button
                    size="icon"
                    variant="outline"
                    className="shrink-0"
                    onClick={() => handleCopy(tokenData.https_url, "https")}
                    aria-label="Copy https URL"
                  >
                    {copied === "https" ? (
                      <CheckCircle2 className="size-4 text-green-500" />
                    ) : (
                      <Copy className="size-4" />
                    )}
                  </Button>
                  <a
                    href={tokenData.https_url}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Open ICS feed in browser"
                  >
                    <Button size="icon" variant="outline" className="shrink-0">
                      <ExternalLink className="size-4" />
                    </Button>
                  </a>
                </div>
              </details>

              {/* Regenerate section */}
              <div className="border-t pt-3">
                {!showRegenerateConfirm ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-1.5 text-xs"
                    onClick={() => setShowRegenerateConfirm(true)}
                    disabled={isRegenerating}
                  >
                    <RefreshCw className="size-3.5" />
                    Regenerate URL
                  </Button>
                ) : (
                  <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 space-y-2">
                    <p className="text-xs flex items-start gap-1.5 text-destructive">
                      <AlertTriangle className="size-3.5 mt-0.5 shrink-0" />
                      This will invalidate your current subscription URL. You&apos;ll need to re-subscribe in your calendar app.
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="destructive"
                        className="text-xs h-7"
                        onClick={handleRegenerate}
                        disabled={isRegenerating}
                      >
                        {isRegenerating ? (
                          <RefreshCw className="size-3 animate-spin mr-1" />
                        ) : null}
                        Yes, regenerate
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs h-7"
                        onClick={() => setShowRegenerateConfirm(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Please log in to get your calendar sync URL.
            </p>
          )}
        </div>

        <div className="flex justify-end pt-2">
          <DialogClose asChild>
            <Button variant="outline" size="sm">Close</Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}
