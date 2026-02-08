"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Heart, Clock, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { returnLateHearts } from "@/lib/workers/puppyLoveWorkerClient";

interface LateHeart {
  rollNo?: string;
  enc: string;
  sha: string;
  song_enc?: string;
  genderOfSender?: string;
}

interface LateMatchPromptProps {
  isOpen: boolean;
  onClose: () => void;
  lateHearts: LateHeart[];
  onComplete?: () => void;
}

export const LateMatchPrompt = ({
  isOpen,
  onClose,
  lateHearts,
  onComplete,
}: LateMatchPromptProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  // Reset state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setStatus("idle");
      setErrorMessage("");
    }
  }, [isOpen]);

  const handleAccept = async () => {
    setIsProcessing(true);
    setStatus("processing");

    try {
      // Get original songs from sessionStorage if available
      const storedSongs = sessionStorage.getItem("a");
      const originalSongs: Record<string, string> = storedSongs ? JSON.parse(storedSongs) : {};

      // Prepare return hearts data in the expected format
      const returnHeartsArray = lateHearts.map((heart) => ({
        ENC: heart.enc,
        SHA: heart.sha,
        SONG_ENC: heart.song_enc || originalSongs[heart.rollNo || ""] || "",
      }));

      const result = await returnLateHearts({
        returnHearts: returnHeartsArray,
      });

      if (result && result.message) {
        setStatus("success");
        // Clear late hearts from sessionStorage after processing
        sessionStorage.removeItem("puppylove_claims_late");
        
        // Delay before closing to show success message
        setTimeout(() => {
          if (onComplete) onComplete();
          onClose();
        }, 2000);
      } else {
        setStatus("error");
        setErrorMessage("Failed to process late hearts. Please try again.");
      }
    } catch (err) {
      setStatus("error");
      setErrorMessage((err as Error).message || "An unexpected error occurred.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDecline = () => {
    // Clear late hearts from sessionStorage - user chose not to match
    sessionStorage.removeItem("puppylove_claims_late");
    onClose();
  };

  if (!lateHearts || lateHearts.length === 0) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isProcessing && onClose()}>
      <DialogContent className="sm:max-w-[425px] bg-gradient-to-br from-rose-50 to-amber-50 border-none shadow-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-rose-600">
            <Clock className="w-5 h-5" />
            Late Hearts Detected!
          </DialogTitle>
          <DialogDescription className="text-stone-600">
            You have <strong className="text-rose-500">{lateHearts.length}</strong> heart(s) that 
            arrived after you submitted. Would you like to include them for matching?
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {status === "idle" && (
            <div className="bg-white/80 rounded-lg p-4 border border-rose-200">
              <div className="flex items-start gap-3">
                <Heart className="w-8 h-8 text-rose-500 fill-rose-200 flex-shrink-0 mt-1" />
                <div>
                  <p className="text-sm text-stone-700 mb-2">
                    These late hearts can still create potential matches! If you choose to accept, 
                    we&apos;ll process them and they&apos;ll be included in the matching algorithm.
                  </p>
                  <p className="text-xs text-stone-500">
                    Note: You can only do this once. If you decline, these hearts won&apos;t be 
                    included in matching.
                  </p>
                </div>
              </div>
            </div>
          )}

          {status === "processing" && (
            <div className="flex flex-col items-center justify-center py-4">
              <Loader2 className="w-10 h-10 text-rose-500 animate-spin mb-3" />
              <p className="text-sm text-stone-600">Processing late hearts...</p>
            </div>
          )}

          {status === "success" && (
            <div className="flex flex-col items-center justify-center py-4 text-center">
              <CheckCircle2 className="w-12 h-12 text-green-500 mb-3" />
              <p className="text-sm font-semibold text-green-600 mb-1">Success!</p>
              <p className="text-xs text-stone-500">
                Your late hearts have been processed and will be included in matching.
              </p>
            </div>
          )}

          {status === "error" && (
            <div className="flex flex-col items-center justify-center py-4 text-center">
              <XCircle className="w-12 h-12 text-red-500 mb-3" />
              <p className="text-sm font-semibold text-red-600 mb-1">Something went wrong</p>
              <p className="text-xs text-stone-500">{errorMessage}</p>
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2 sm:gap-0">
          {status === "idle" && (
            <>
              <Button
                variant="outline"
                onClick={handleDecline}
                disabled={isProcessing}
                className="border-stone-300 text-stone-600 hover:bg-stone-100"
              >
                No, Skip
              </Button>
              <Button
                onClick={handleAccept}
                disabled={isProcessing}
                className="bg-rose-500 hover:bg-rose-600 text-white"
              >
                <Heart className="w-4 h-4 mr-2 fill-white" />
                Yes, Include Them!
              </Button>
            </>
          )}

          {status === "error" && (
            <>
              <Button
                variant="outline"
                onClick={onClose}
                className="border-stone-300 text-stone-600 hover:bg-stone-100"
              >
                Close
              </Button>
              <Button
                onClick={handleAccept}
                disabled={isProcessing}
                className="bg-rose-500 hover:bg-rose-600 text-white"
              >
                Try Again
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LateMatchPrompt;
