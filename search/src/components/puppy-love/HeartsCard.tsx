import { useState, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import Image from "next/image";
import { useGContext } from "@/components/ContextProvider";
import { getVirtualHeartCount } from "@/lib/workers/puppyLoveWorkerClient";

interface PuppyLoveHeartsCardProps {
  compact?: boolean;
}
import { puppyLoveHeartsSent, puppyLoveHeartsReceived, getNumberOfHeartsSent } from "./PuppyLoveContextProvider";

export const PuppyLoveHeartsCard = ({ compact }: PuppyLoveHeartsCardProps) => {
  const { isPuppyLove } =
    useGContext();
  const [draftCount, setDraftCount] = useState(0);

  const fetchDraftCount = async () => {
    try {
      const countResult = await getVirtualHeartCount();
      setDraftCount(countResult?.count || 0);
    } catch (err) {
      console.error("Failed to fetch draft count:", err);
    }
  };

  // Fetch draft count only when component mounts (first time entering PuppyLove mode)
  useEffect(() => {
    if (isPuppyLove) {
      fetchDraftCount();
    }
  }, [isPuppyLove]);

  // Listen for custom event when draft is saved
  useEffect(() => {
    const handleDraftSaved = () => {
      fetchDraftCount();
    };

    window.addEventListener("puppylove:draftSaved", handleDraftSaved);
    return () =>
      window.removeEventListener("puppylove:draftSaved", handleDraftSaved);
  }, []);

  // Separate received hearts by gender
  const normalizeGender = (value: string | undefined) => {
    if (!value) return "";
    const v = value.toLowerCase();
    if (v === "m" || v === "male") return "male";
    if (v === "f" || v === "female") return "female";
    return v;
  };
  const males = (puppyLoveHeartsReceived || []).filter(
    (h: any) => normalizeGender(h.genderOfSender || h.gender) === "male",
  );
  const females = (puppyLoveHeartsReceived || []).filter(
    (h: any) => normalizeGender(h.genderOfSender || h.gender) === "female",
  );

  return (
    <div className="flex gap-4 items-start">
      <Card
        className={`${compact ? "w-[260px]" : "w-[350px]"} border-none bg-rose-50/90 shadow-[0_10px_40px_rgba(225,29,72,0.15)]`}
      >
        <CardHeader>
          <CardTitle className="flex flex-col items-center gap-2">
            <div className="relative w-fit">
              <Image
                src="/icons/puppyLoveLogo.png"
                alt="Puppy Love"
                width={compact ? 48 : 64}
                height={compact ? 48 : 64}
                className="rounded-2xl"
              />
              {!compact &&
                puppyLoveHeartsSent &&
                getNumberOfHeartsSent() > 0 && (
                  <div className="absolute -top-2 -right-2 flex items-center justify-center bg-rose-600 text-white rounded-full w-6 h-6 text-xs font-bold">
                    {getNumberOfHeartsSent()}
                  </div>
                )}
            </div>
          </CardTitle>
          <CardTitle
            className={`${compact ? "text-lg" : "text-2xl"} text-center text-rose-500`}
          >
            Puppy Love
          </CardTitle>
          <CardDescription className="text-center text-rose-400">
            Your Hearts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center rounded-lg px-3 py-2 bg-rose-100/80">
            <span className="text-sm font-medium text-rose-500">
              Virtual Hearts
            </span>
            <span className="font-bold text-rose-500">{draftCount}/4</span>
          </div>
          <div className="flex justify-between items-center rounded-lg px-3 py-2 bg-rose-100/80">
            <span className="text-sm font-medium text-rose-500">
              Hearts Sent
            </span>
            <span className="font-bold text-rose-500">
              {puppyLoveHeartsSent ? getNumberOfHeartsSent() : 0}
            </span>
          </div>
          <div className="flex justify-between items-center rounded-lg px-3 py-2 bg-rose-100/80">
            <span className="text-sm font-medium text-rose-500">
              Hearts Received
            </span>
            <span className="font-bold text-rose-500">
              {puppyLoveHeartsReceived ? puppyLoveHeartsReceived.length : 0}
            </span>
          </div>
          {/* Details (hidden in compact mode) */}
          {!compact &&
            puppyLoveHeartsSent &&
            getNumberOfHeartsSent() > 0 && (
              <div className="mt-2">
                <h3 className="text-sm font-semibold mb-2">Sent To:</h3>
                <ul className="list-disc pl-5 text-sm space-y-1">
                  {Object.values(puppyLoveHeartsSent).map((h: any, idx: number) => (
                    <li key={idx}>{h.recipientName || h.recipientId}</li>
                  ))}
                </ul>
              </div>
            )}
          {!compact && (
            <div className="mt-2">
              <h3 className="text-sm font-semibold mb-2">Received From:</h3>
              <div className="mb-2">
                <span className="font-semibold text-pink-600 text-sm">
                  Females:
                </span>
                {females.length > 0 ? (
                  <ul className="list-disc pl-5 text-sm space-y-1">
                    {females.map((h: any, idx: number) => (
                      <li key={idx}>{h.senderName || h.senderId}</li>
                    ))}
                  </ul>
                ) : (
                  <span className="text-xs text-muted-foreground ml-2">
                    None
                  </span>
                )}
              </div>
              <div>
                <span className="font-semibold text-blue-600 text-sm">
                  Males:
                </span>
                {males.length > 0 ? (
                  <ul className="list-disc pl-5 text-sm space-y-1">
                    {males.map((h: any, idx: number) => (
                      <li key={idx}>{h.senderName || h.senderId}</li>
                    ))}
                  </ul>
                ) : (
                  <span className="text-xs text-muted-foreground ml-2">
                    None
                  </span>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {!compact && puppyLoveHeartsSent && getNumberOfHeartsSent() > 0 && (
        <Card className="w-[250px] border-none bg-rose-50/90 shadow-[0_10px_40px_rgba(225,29,72,0.15)]">
          <CardHeader>
            <CardTitle className="text-lg">Sent Hearts</CardTitle>
            <CardDescription>
              {getNumberOfHeartsSent()} recipient(s)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="max-h-[400px] overflow-y-auto space-y-2">
              {puppyLoveHeartsSent && Object.entries(puppyLoveHeartsSent).map(([key, heart]: any) => (
          <div key={key} className="p-2 bg-rose-100/80 rounded-lg">
            <p className="text-sm font-medium text-rose-500 truncate">
              {heart.recipientName || heart.recipientId}
            </p>
          </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
