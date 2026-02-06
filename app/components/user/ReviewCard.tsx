"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import RatedStars from "./RatedStars";
import { MapPin, ImageIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { format } from "timeago.js";

export type ReviewProps = {
  author?: string;
  rating: number;
  review_body?: string;
  time: string;
  imgs?: { ImageID: string }[];
  // backend may return Location or location
  Location?: any;
  location?: any;
};

export default function ReviewCard(props: ReviewProps) {
  const { rating, review_body = "", time, imgs = [], Location, location } = props as any;
  // backend may return `description` instead of `review_body`
  const body = (props as any).review_body || (props as any).description || review_body || "";
  // derive time from possible backend fields (per-review)
  const timeVal =
    (props as any).createdAt ||
    (props as any).CreatedAt ||
    (props as any).created_at ||
    (props as any).time ||
    (props as any).Time ||
    null;

  let parsedTime: Date | null = null;
  if (timeVal) {
    if (typeof timeVal === "string" || typeof timeVal === "number") {
      const t = new Date(timeVal);
      parsedTime = isNaN(t.getTime()) ? null : t;
    } else if (timeVal instanceof Date) {
      parsedTime = timeVal;
    }
  }

  // If no valid per-review timestamp, fall back to provided `time` prop
  if (!parsedTime && time) {
    const t = new Date(time);
    parsedTime = isNaN(t.getTime()) ? null : t;
  }

  // Final fallback: show nothing instead of forcing same current time
  const timeDisplay = parsedTime ? parsedTime.toLocaleString() : "";
  const loc = Location || location;

  const [remoteLoc, setRemoteLoc] = useState<any | null>(null);

  // If the review does not include full location object but has an id, fetch it
  useEffect(() => {
    const id = (props as any).locationId || (props as any).LocationId || (props as any).locationId || (props as any).LocationId;
    if (loc || !id) return;
    const mapsUrl = process.env.NEXT_PUBLIC_MAPS_URL;
    if (!mapsUrl) return;
    let mounted = true;
    fetch(`${mapsUrl}/api/maps/location/${id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!mounted || !data) return;
        // handler.locationDetailProvider returns { location: loc }
        const l = data.location || data;
        setRemoteLoc(l || null);
      })
      .catch(() => {
        if (!mounted) return;
        setRemoteLoc(null);
      });
    return () => {
      mounted = false;
    };
  }, [loc, props]);

  const locFinal = loc || remoteLoc;
  const locName = locFinal?.name || locFinal?.Name || null;
  const cover = locFinal?.coverpic || locFinal?.CoverPic || null;

  const imageUrl = (imgId: string) => `${process.env.NEXT_PUBLIC_ASSET_URL}/assets/${imgId}.webp`;

  return (
    <Card className="mx-3 my-3 p-0 bg-white dark:bg-black text-black dark:text-white">
      <div className="flex gap-3 p-3">
        {/* Left: optional cover */}
        <div className="w-24 h-24 flex-shrink-0 rounded overflow-hidden bg-muted flex items-center justify-center">
          {cover ? (
            <img src={imageUrl(cover)} alt={locName || "location"} className="w-full h-full object-cover" />
          ) : (
            <ImageIcon className="h-8 w-8 text-muted-foreground" />
          )}
        </div>

        {/* Right: content */}
        <div className="flex-1">
          <CardHeader className="p-0">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-base font-semibold">{locName || "Unknown location"}</CardTitle>
              </div>
              <div className="text-right text-xs text-muted-foreground">
                <div>{timeDisplay}</div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0 pt-2">
            <div className="flex items-center justify-between mb-2">
              <RatedStars count={5} rating={rating} iconSize={14} icon={""} color={"yellow"} />
            </div>

            <Separator />

            <p className="my-3 text-sm leading-relaxed">{body}</p>

            {imgs.length > 0 && (
              <div className="grid grid-cols-2 gap-2 mt-2">
                {imgs.map((img) => (
                  <div className="relative w-full h-32 rounded-md overflow-hidden" key={img.ImageID}>
                    <img src={imageUrl(img.ImageID)} alt="attachment" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </div>
      </div>
    </Card>
  );
}
