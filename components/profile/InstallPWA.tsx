"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

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

export default function InstallPWA() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const handlePrompt = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      setInstallPrompt(e);
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
    }
  };

  if (!installPrompt) return null;

  return (
    <Button 
      variant="outline"
      onClick={installApp}
      className="fixed bottom-4 right-4 text:white shadow-md hover:shadow-lg transition-all hover:scale-105 hover:bg-red-50 dark:hover:bg-red-950/20"
      //className="h-12 w-12 shadow-md hover:shadow-lg transition-all hover:scale-105"
    >
      Install App
    </Button>
  );
}