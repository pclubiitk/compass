"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Share } from "lucide-react";


interface NavigatorStandalone extends Navigator {
  standalone?: boolean;
}


function isIos(): boolean {
  if (typeof window === "undefined") return false;
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

//function isSafari(): boolean {
//  if (typeof window === "undefined") return false;
//  const ua = window.navigator.userAgent;

//  const isOtherBrowser =
//    /crios|fxios|edgios|opios|mercury|chrome|chromium|edg|opr|firefox|android/i.test(
//      ua
//    );
// return /safari/i.test(ua) && !isOtherBrowser;
//}


function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const nav = window.navigator as NavigatorStandalone;
  return (
    nav.standalone === true ||
    window.matchMedia("(display-mode: standalone)").matches
  );
}

export default function InstallPWASafari() {
  const [showPopup, setShowPopup] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (isStandalone() || !isIos()) return;
    setShowPopup(true);
  }, []);

  const closePopup = () => {
    setShowPopup(false);
    setDismissed(true);
  };

  if (!showPopup || dismissed) return null;

  return (
    <Dialog open={showPopup} onOpenChange={(open) => !open && closePopup()}>
      <DialogContent className="w-[90vw] max-w-[380px] top-4 right-4 left-auto translate-x-0 translate-y-0 [&>button]:hidden p-6 rounded-xl">
        <DialogHeader>
          <DialogTitle>Add Search to your homescreen</DialogTitle>
          <DialogDescription>
           Download the Search Web Application for a better experience. You can install it on your device and access it like a native app.
          </DialogDescription>
        </DialogHeader>

        <ol className="space-y-3 text-sm text-neutral-600 dark:text-neutral-300 my-2">         
              <li className="flex items-center gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800 text-xs font-medium">
                  1
                </span>
                <span className="flex items-center gap-1.5">
                  Click the Share icon <Share className="h-4 w-4 inline" /> in the toolbar
                </span>
              </li>
              <li className="flex items-center gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800 text-xs font-medium">
                  2
                </span>
                <span>Select &quot;Add to Dock/Homescreen&quot;</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800 text-xs font-medium">
                  3
                </span>
                <span>Click &quot;Add&quot; to confirm</span>
              </li>
        </ol>

        <DialogFooter>
          <Button variant="ghost" onClick={closePopup}>
            Got it
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}