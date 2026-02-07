"use client"

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Loader2, Clock, AlertCircle } from "lucide-react";
import { returnLateHearts } from "@/lib/workers/puppyLoveWorkerClient";

interface LateHeart {
  rollNo: string;
  enc: string;
  sha: string;
  song_enc: string;
}

interface LateReturnHeartsProps {
  lateHearts: LateHeart[];
  originalSongs: Record<string, string>; // Map of rollNo -> songEnc
  onComplete?: () => void;
}

export const LateReturnHeartsComponent = ({
  lateHearts,
  originalSongs,
  onComplete,
}: LateReturnHeartsProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<string>("");
  const [completedHearts, setCompletedHearts] = useState<Set<string>>(new Set());

  if (!lateHearts || lateHearts.length === 0) {
    return null;
  }

  const handleReturnLateHearts = async () => {
    setIsProcessing(true);
    setStatus("Processing late return hearts...");

    try {
      // Prepare return hearts data in the expected format
      const returnHeartsArray = lateHearts.map((heart) => ({
        ENC: heart.enc,
        SHA: heart.sha,
        SONG_ENC: originalSongs[heart.rollNo] || heart.song_enc,
      }));

      const result = await returnLateHearts({
        returnHearts: returnHeartsArray,
      });

      if (result && result.message) {
        setStatus("✅ Late hearts processed successfully!");
        setCompletedHearts(new Set(lateHearts.map((h) => h.rollNo)));

        // Call completion callback after a delay
        setTimeout(() => {
          if (onComplete) onComplete();
        }, 2000);
      } else {
        setStatus("Failed to process late hearts");
      }
    } catch (err) {
      setStatus("Error: " + (err as Error).message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="border-2 border-amber-200 bg-amber-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-amber-700">
          <Clock className="w-6 h-6" />
          Late Return Hearts
          <AlertCircle className="w-5 h-5 text-amber-600" />
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="bg-white/80 rounded-lg p-4">
          <p className="text-sm text-gray-700 mb-3">
            <strong>You have {lateHearts.length} late heart(s)</strong> that arrived after you
            submitted your hearts. These can still be returned to create potential matches!
          </p>

          <div className="space-y-2 max-h-48 overflow-y-auto">
            {lateHearts.map((heart) => (
              <div
                key={heart.rollNo}
                className={`flex items-center justify-between p-2 rounded bg-gray-100 ${
                  completedHearts.has(heart.rollNo) ? "opacity-50" : ""
                }`}
              >
                <span className="font-medium text-gray-800">{heart.rollNo}</span>
                {completedHearts.has(heart.rollNo) && (
                  <span className="text-xs text-green-600 font-semibold">✓ Returned</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {status && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-700">{status}</p>
          </div>
        )}

        <div className="flex gap-3">
          <Button
            className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-semibold"
            onClick={handleReturnLateHearts}
            disabled={isProcessing || completedHearts.size > 0}
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : completedHearts.size > 0 ? (
              <>
                <Heart className="w-4 h-4 mr-2 fill-white" />
                Completed
              </>
            ) : (
              <>
                <Heart className="w-4 h-4 mr-2 fill-white" />
                Return Late Hearts
              </>
            )}
          </Button>
        </div>

        <p className="text-xs text-gray-500 text-center">
          Late hearts use your original song choices to maintain consistency
        </p>
      </CardContent>
    </Card>
  );
};
