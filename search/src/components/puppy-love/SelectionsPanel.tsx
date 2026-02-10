import { useEffect, useMemo, useState } from "react";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { X, Send, Trash2, Heart } from "lucide-react";
import { receiverIds, setPuppyLoveHeartsSent, useGContext } from "@/components/ContextProvider";
import {
  prepareSendHeart,
  sendHeart,
  sendVirtualHeart,
} from "@/lib/workers/puppyLoveWorkerClient";
import { returnHeartsHandler } from "@/lib/workers/utils";
import { toast } from "sonner";

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
}

export const PuppyLoveSelectionsPanel = ({
  onClose,
}: PuppyLoveSelectionsPanelProps) => {
  const [nameCache, setNameCache] = useState<Record<string, DraftEntry>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null);
  const [updateCounter, setUpdateCounter] = useState(0); // Force re-render trigger
  const {
    puppyLovePublicKeys,
    puppyLoveProfile,
    privateKey,
    isPuppyLove,
    currentUserProfile,
  } = useGContext();

  // Derive active selections from receiverIds (the single source of truth)
  // updateCounter in deps forces recalculation when selections change
  const activeSelections = useMemo(
    () => receiverIds.filter((id) => id !== ""),
    [updateCounter],
  );
  const handleSearchClick = (searchTerm: string) => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("puppylove:search", { detail: { name: searchTerm } }),
      );
    }
  };

  const loadNameCache = () => {
    if (typeof window === "undefined") return;
    try {
      const stored = sessionStorage.getItem("puppylove_draft_hearts");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const cache: Record<string, DraftEntry> = {};
          parsed.forEach((d: DraftEntry) => {
            cache[d.rollNo] = d;
          });
          setNameCache(cache);
          return;
        }
      }
    } catch {
      // ignore
    }
    setNameCache({});
  };

  useEffect(() => {
    loadNameCache();

    const handleUpdate = () => {
      loadNameCache();
      setUpdateCounter((c) => c + 1); // Trigger re-render for selections
    };
    window.addEventListener("puppylove:draftSaved", handleUpdate);
    window.addEventListener("puppylove:selectionsOpen", handleUpdate);

    return () => {
      window.removeEventListener("puppylove:draftSaved", handleUpdate);
      window.removeEventListener("puppylove:selectionsOpen", handleUpdate);
    };
  }, []);

  const handleWithdraw = async (rollNo: string) => {
    const activeProfile =
      isPuppyLove && puppyLoveProfile ? puppyLoveProfile : currentUserProfile;

    if (!activeProfile?.id) {
      toast.error("Your PuppyLove profile data is not available.");
      return;
    }

    const senderPublicKey = puppyLovePublicKeys?.[activeProfile.id];
    const senderPrivateKey = privateKey;
    if (!senderPublicKey || !senderPrivateKey) {
      toast.error(
        "Your keys are not available. Please log in to PuppyLove first.",
      );
      return;
    }

    setWithdrawingId(rollNo);
    try {
      // Remove the heart from receiverIds (find its slot and clear it)
      const slotIndex = receiverIds.indexOf(rollNo);
      if (slotIndex !== -1) {
        receiverIds[slotIndex] = "";
      }

      // Re-encrypt and send updated virtual hearts with the withdrawn heart removed
      const heartData = await prepareSendHeart(
        senderPublicKey,
        senderPrivateKey as string,
        puppyLovePublicKeys,
        activeProfile.id,
        receiverIds,
      );

      const result = await sendVirtualHeart(heartData);

      if (result?.error) {
        // Revert receiverIds on failure
        if (slotIndex !== -1) {
          receiverIds[slotIndex] = rollNo;
        }
        toast.error("Error withdrawing heart: " + result.error);
      } else {
        toast.success("Heart withdrawn successfully!");
        // Update session storage and notify listeners
        if (typeof window !== "undefined") {
          try {
            const stored = sessionStorage.getItem("puppylove_draft_hearts");
            if (stored) {
              const parsed = JSON.parse(stored);
              if (Array.isArray(parsed)) {
                const updated = parsed.filter(
                  (d: DraftEntry) => d.rollNo !== rollNo,
                );
                sessionStorage.setItem(
                  "puppylove_draft_hearts",
                  JSON.stringify(updated),
                );
              }
            }
          } catch {
            // ignore
          }
          window.dispatchEvent(new CustomEvent("puppylove:draftSaved"));
        }
      }
    } catch (err) {
      toast.error("Error withdrawing heart: " + (err as Error).message);
    } finally {
      setWithdrawingId(null);
    }
  };

  const handleSubmit = async () => {
    const activeProfile =
      isPuppyLove && puppyLoveProfile ? puppyLoveProfile : currentUserProfile;

    if (!activeProfile?.id) {
      toast.error(
        "Your PuppyLove profile data is not available. Please try again.",
      );
      return;
    }

    const userGender = activeProfile?.gender?.trim();
    if (!userGender) {
      toast.error("Your profile gender is required to submit hearts.");
      return;
    }

    const senderPublicKey = puppyLovePublicKeys?.[activeProfile.id];
    const senderPrivateKey = privateKey;
    if (!senderPublicKey || !senderPrivateKey) {
      toast.error(
        "Your keys are not available. Please log in to PuppyLove first.",
      );
      return;
    }

    if (activeSelections.length === 0) {
      toast.error("No selections to submit.");
      return;
    }

    setIsSubmitting(true);
    try {
      const heartData = await prepareSendHeart(
        senderPublicKey,
        senderPrivateKey as string,
        puppyLovePublicKeys,
        activeProfile.id,
        receiverIds,
      );

      const returnHearts = await returnHeartsHandler(puppyLovePublicKeys);
      await sendVirtualHeart(heartData);
      setPuppyLoveHeartsSent(heartData.hearts);
      const result = await sendHeart({
        genderOfSender: userGender,
        enc1: heartData.hearts[0]?.encHeart ?? "",
        sha1: heartData.hearts[0]?.shaHash ?? "",
        enc2: heartData.hearts[1]?.encHeart ?? "",
        sha2: heartData.hearts[1]?.shaHash ?? "",
        enc3: heartData.hearts[2]?.encHeart ?? "",
        sha3: heartData.hearts[2]?.shaHash ?? "",
        enc4: heartData.hearts[3]?.encHeart ?? "",
        sha4: heartData.hearts[3]?.shaHash ?? "",
        returnhearts: returnHearts,
      });

      if (result?.error) {
        toast.error("Error submitting hearts: " + result.error);
      } else {
        toast.success(result?.message || "Hearts submitted successfully!");
        // Clear drafts from session storage after successful submission
        if (typeof window !== "undefined") {
          sessionStorage.removeItem("puppylove_draft_hearts");
          window.dispatchEvent(new CustomEvent("puppylove:draftSaved"));
        }
      }
    } catch (err) {
      toast.error("Error submitting hearts: " + (err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <div className="h-full">
      <Card className="h-full border-none bg-linear-to-br from-rose-50/95 to-pink-50/95 shadow-[0_10px_40px_rgba(225,29,72,0.15)] backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between border-b border-rose-200/50 px-3 py-2">
          <CardTitle className="text-sm text-rose-500">
            Your Selections
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-rose-500 h-6 w-6 shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-2 overflow-auto max-h-[50vh] px-3 py-2">
          <div>
            {activeSelections.length === 0 ? (
              <div className="text-center py-4">
                <Heart className="h-8 w-8 mx-auto text-rose-300 mb-1" />
                <p className="text-xs text-rose-400">
                  No selections yet. Send hearts to add people here.
                </p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {activeSelections.map((id, idx) => {
                  const cached = nameCache[id];
                  return (
                    <div
                      key={`${id}-${idx}`}
                      className="rounded-lg bg-linear-to-r from-rose-100/90 to-pink-100/90 border border-rose-200/50 px-3 py-2 flex items-center justify-between gap-2 transition-all hover:shadow-md"
                    >
                      <div
                        className="flex-1 cursor-pointer hover:opacity-80 transition-opacity min-w-0"
                        onClick={() => handleSearchClick(id)}
                      >
                        <div className="text-xs font-medium text-rose-500 truncate">
                          {cached?.name || `Heart #${idx + 1}`}
                        </div>
                        <div className="text-[10px] text-rose-400 truncate">
                          {id}
                          {cached?.dept ? ` • ${cached.dept}` : ""}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-rose-400 hover:text-rose-600 hover:bg-rose-200/60 shrink-0"
                        onClick={() => handleWithdraw(id)}
                        disabled={withdrawingId === id || isSubmitting}
                      >
                        {withdrawingId === id ? (
                          <span className="h-3 w-3 animate-spin rounded-full border-2 border-rose-400 border-t-transparent" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="pt-1">
            <Button
              className="w-full bg-linear-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white text-sm font-semibold py-2"
              onClick={() => setShowConfirm(true)}
              disabled={isSubmitting || activeSelections.length === 0}
            >
              <Send className="w-3.5 h-3.5 mr-1.5" />
              {isSubmitting ? "Submitting..." : "Submit"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent className="bg-rose-50 border-rose-200 max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-rose-600">
              Confirm Submission
            </DialogTitle>
            <DialogDescription className="text-rose-500/80">
              Are you sure you want to submit your selections? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              className="border-rose-300 text-rose-600 hover:bg-rose-100"
              onClick={() => setShowConfirm(false)}
            >
              Cancel
            </Button>
            <Button
              className="bg-linear-to-r from-rose-500 ml-4 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-semibold"
              onClick={() => {
                setShowConfirm(false);
                handleSubmit();
              }}
            >
              <Send className="w-4 h-4 mr-2" />
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
