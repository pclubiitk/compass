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



// Define the type for BeforeInstallPromptEvent
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

// Declare global interface to recognize the event
declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}
function isMobileDevice(): boolean{
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent;
  return /android|iphone|ipod|windows phone/i.test(ua);

}

export default function InstallPWA() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const handlePrompt = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      if (!isMobileDevice()) return;
         setInstallPrompt(e);
         setShowPopup(true);
    };

    window.addEventListener('beforeinstallprompt', handlePrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handlePrompt);
    };
  }, []);

  const installApp = async () => {
    if (!installPrompt) return;
    
    try {
      await installPrompt.prompt();
      const choiceResult = await installPrompt.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
    } catch (error) {
      console.error('Error showing install prompt:', error);
    } finally {
      setInstallPrompt(null);
      setShowPopup(false);
    }
  };
  const closePopup = () => {
    setShowPopup(false);
    setDismissed(true);
  };


  if (!installPrompt) return null;
   
  return (
    <><Dialog open={showPopup} onOpenChange={(open) => !open && closePopup()}>
      <DialogContent
        className="sm:max-w-sm top-4 right-4 left-auto translate-x-0 translate-y-0 [&>button]:hidden"
      >
        <DialogHeader>
          <DialogTitle>Add Search to your homescreen</DialogTitle>
          <DialogDescription>
            Download the Search Web Application for a better experience. You can install it on your device and access it like a native app.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button variant="ghost" onClick={closePopup}>
            Not now
          </Button>
          <Button onClick={installApp}>
            Install App
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    <Button
      variant="outline"
      onClick={installApp}
      className="fixed bottom-4 right-4 text:white shadow-md hover:shadow-lg transition-all hover:scale-105 hover:bg-red-50 dark:hover:bg-red-950/20"
    >
        Install App
      </Button></>
  );
}