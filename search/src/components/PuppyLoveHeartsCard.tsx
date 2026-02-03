import React from "react";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import Image from "next/image";
import { useGContext } from "./ContextProvider";

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
    <Card className={`${compact ? 'w-[260px]' : 'w-[350px]'}`}>
      <CardHeader>
        <CardTitle className="flex flex-col items-center gap-2">
          <Image 
            src="/icons/puppyLoveLogo.png" 
            alt="Puppy Love"
            width={compact ? 48 : 64}
            height={compact ? 48 : 64}
            className="rounded-2xl"
          />
        </CardTitle>
        <CardTitle className={`${compact ? 'text-lg' : 'text-2xl'} text-center`}>Puppy Love</CardTitle>
        <CardDescription className="text-center">Your Hearts</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3"> 
        <div className="flex justify-between items-center bg-muted rounded-lg px-3 py-2">
          <span className="text-sm font-medium">Hearts Sent</span>
          <span className="font-bold text-rose-600">
            {puppyLoveHeartsSent ? puppyLoveHeartsSent.length : 0}
          </span>
        </div>
        <div className="flex justify-between items-center bg-muted rounded-lg px-3 py-2">
          <span className="text-sm font-medium">Hearts Received</span>
          <span className="font-bold text-rose-600">
            {puppyLoveHeartsReceived ? puppyLoveHeartsReceived.length : 0}
          </span>
        </div>
        {/* Details (hidden in compact mode) */}
        {!compact && puppyLoveHeartsSent && puppyLoveHeartsSent.length > 0 && (
          <div className="mt-2">
            <h3 className="text-sm font-semibold mb-2">Sent To:</h3>
            <ul className="list-disc pl-5 text-sm space-y-1">
              {puppyLoveHeartsSent.map((h: any, idx: number) => (
                <li key={idx}>{h.recipientName || h.recipientId}</li>
              ))}
            </ul>
          </div>
        )}
        {!compact && (
          <div className="mt-2">
            <h3 className="text-sm font-semibold mb-2">Received From:</h3>
            <div className="mb-2">
              <span className="font-semibold text-pink-600 text-sm">Females:</span>
              {females.length > 0 ? (
                <ul className="list-disc pl-5 text-sm space-y-1">
                  {females.map((h: any, idx: number) => (
                    <li key={idx}>{h.senderName || h.senderId}</li>
                  ))}
                </ul>
              ) : (
                <span className="text-xs text-muted-foreground ml-2">None</span>
              )}
            </div>
            <div>
              <span className="font-semibold text-blue-600 text-sm">Males:</span>
              {males.length > 0 ? (
                <ul className="list-disc pl-5 text-sm space-y-1">
                  {males.map((h: any, idx: number) => (
                    <li key={idx}>{h.senderName || h.senderId}</li>
                  ))}
                </ul>
              ) : (
                <span className="text-xs text-muted-foreground ml-2">None</span>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
