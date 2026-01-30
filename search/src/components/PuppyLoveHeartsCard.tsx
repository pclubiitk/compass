import React from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGContext } from "./ContextProvider";
import Link from "next/link";

interface PuppyLoveHeartsCardProps {
  compact?: boolean;
}

export const PuppyLoveHeartsCard = ({ compact }: PuppyLoveHeartsCardProps) => {
  const { puppyLoveHeartsSent, puppyLoveHeartsReceived, isPuppyLove } = useGContext();
  // Separate received hearts by gender
  const normalizeGender = (value: string | undefined) => {
    if (!value) return "";
    const v = value.toLowerCase();
    if (v === "m" || v === "male") return "male";
    if (v === "f" || v === "female") return "female";
    return v;
  };
  const males = (puppyLoveHeartsReceived || []).filter((h: any) => normalizeGender(h.genderOfSender || h.gender) === 'male');
  const females = (puppyLoveHeartsReceived || []).filter((h: any) => normalizeGender(h.genderOfSender || h.gender) === 'female');
  return (
    <Card className={`rounded-2xl shadow-xl border-2 border-rose-200/70 backdrop-blur-md bg-gradient-to-br from-rose-50/95 to-pink-100/90 ${compact ? 'w-full max-w-xs md:w-[240px] p-3' : 'w-full max-w-xs md:w-[320px] p-5'}`}>
      <CardHeader className={`flex flex-col items-center gap-1 pb-1 ${compact ? 'mb-1' : ''}`}>
        <div className="flex items-center gap-2">
          <Heart className={`text-rose-500 animate-pulse drop-shadow ${compact ? 'w-5 h-5' : 'w-7 h-7'}`} />
          <span className={`font-bold text-rose-600 tracking-wide ${compact ? 'text-base' : 'text-lg'}`}>Puppy Love</span>
        </div>
        <span className="text-[10px] text-rose-400 font-semibold tracking-widest uppercase">Your Hearts</span>
      </CardHeader>
      <CardContent className={`space-y-2 pt-1 ${compact ? '' : 'pt-2'}`}> 
        <div className="flex flex-row justify-between items-center bg-white/80 rounded-lg px-2 py-1 shadow-sm">
          <span className="font-medium text-rose-500 flex items-center gap-1 text-xs">
            <Heart className="w-3 h-3 text-rose-400" /> Sent
          </span>
          <span className="font-bold text-base text-rose-600">
            {puppyLoveHeartsSent ? puppyLoveHeartsSent.length : 0}
          </span>
        </div>
        <div className="flex flex-row justify-between items-center bg-white/80 rounded-lg px-2 py-1 shadow-sm">
          <span className="font-medium text-rose-500 flex items-center gap-1 text-xs">
            <Heart className="w-3 h-3 text-rose-400 fill-rose-400" /> Received
          </span>
          <span className="font-bold text-base text-rose-600">
            {puppyLoveHeartsReceived ? puppyLoveHeartsReceived.length : 0}
          </span>
        </div>
        {/* Details (hidden in compact mode) */}
        {!compact && puppyLoveHeartsSent && puppyLoveHeartsSent.length > 0 && (
          <div className="mt-2">
            <h3 className="text-xs font-semibold text-rose-400 mb-1">Sent To:</h3>
            <ul className="list-disc pl-5 text-rose-500 text-sm space-y-0.5">
              {puppyLoveHeartsSent.map((h: any, idx: number) => (
                <li key={idx}>{h.recipientName || h.recipientId}</li>
              ))}
            </ul>
          </div>
        )}
        {!compact && (
          <div className="mt-2">
            <h3 className="text-xs font-semibold text-rose-400 mb-1">Received From:</h3>
            <div className="mb-1">
              <span className="font-semibold text-pink-500 text-xs">Females:</span>
              {females.length > 0 ? (
                <ul className="list-disc pl-5 text-rose-500 text-sm space-y-0.5">
                  {females.map((h: any, idx: number) => (
                    <li key={idx}>{h.senderName || h.senderId}</li>
                  ))}
                </ul>
              ) : (
                <span className="text-xs text-rose-300 ml-2">None</span>
              )}
            </div>
            <div>
              <span className="font-semibold text-blue-500 text-xs">Males:</span>
              {males.length > 0 ? (
                <ul className="list-disc pl-5 text-blue-500 text-sm space-y-0.5">
                  {males.map((h: any, idx: number) => (
                    <li key={idx}>{h.senderName || h.senderId}</li>
                  ))}
                </ul>
              ) : (
                <span className="text-xs text-blue-300 ml-2">None</span>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
