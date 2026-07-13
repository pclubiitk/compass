"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import RatedStars from "./RatedStars";
import { ImageIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { format } from "timeago.js";
import {
  AuthenticatedImage,
  buildReviewImageUrl,
  getImageId,
  getImageStatus,
} from "./AuthenticatedImage";

export type ReviewProps = {
  author?: string;
  rating: number;
  review_body?: string;
  time: string;
  imgs?: { ImageID: string; Status: string }[];
  Location?: any;
  location?: any;
  locationId?: string;
};

function ReviewAttachmentImage({ img }: { img: unknown }) {
  const imageId = getImageId(img);
  if (!imageId) return null;

  const status = getImageStatus(img);
  const { url, requiresAuth } = buildReviewImageUrl(imageId, status);

  return (
    <div className="relative w-32 h-32 rounded-md overflow-hidden justify-self-start">
      <AuthenticatedImage
        src={url}
        alt="Review attachment"
        className="w-full h-full object-cover"
        requiresAuth={requiresAuth}
      />
    </div>
  );
}

export default function ReviewCard(props: ReviewProps) {
  const { rating, review_body = "", time, Location, location } = props as any;
  const imgs = (props as any).imgs || (props as any).images || [];
  const body =
    (props as any).review_body ||
    (props as any).description ||
    review_body ||
    "";

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

  if (!parsedTime && time) {
    const t = new Date(time);
    parsedTime = isNaN(t.getTime()) ? null : t;
  }

  const loc = Location || location;
  const [remoteLoc, setRemoteLoc] = useState<any | null>(null);

  useEffect(() => {
    const id =
      props.locationId ||
      (props as any).locationId ||
      (props as any).LocationId;
    if (loc || !id) return;

    const mapsUrl = process.env.NEXT_PUBLIC_MAPS_URL;
    if (!mapsUrl) return;

    let mounted = true;
    fetch(`${mapsUrl}/api/maps/location/${id}`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!mounted || !data) return;
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
  }, [loc, props.locationId, props]);

  const locFinal = loc || remoteLoc;
  const locName = locFinal?.name || locFinal?.Name || null;
  const cover = locFinal?.coverpic || locFinal?.CoverPic || null;
  const coverId = getImageId(cover);
  const coverStatus = getImageStatus(cover);
  const coverSrc = coverId
    ? buildReviewImageUrl(coverId, coverStatus)
    : null;

  return (
    <Card className="mx-3 my-3 p-0 bg-white dark:bg-black text-black dark:text-white">
      <div className="flex gap-3 p-3">
        <div className="w-24 h-24 flex-shrink-0 rounded overflow-hidden bg-muted flex items-center justify-center">
          {coverSrc ? (
            <AuthenticatedImage
              src={coverSrc.url}
              alt={locName || "location"}
              className="w-full h-full object-cover"
              requiresAuth={coverSrc.requiresAuth}
            />
          ) : (
            <ImageIcon className="h-8 w-8 text-muted-foreground" />
          )}
        </div>

        <div className="flex-1">
          <CardHeader className="p-0">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-base font-semibold">
                  {locName || "Unknown location"}
                </CardTitle>
              </div>
              <div className="text-right text-xs text-muted-foreground">
                <div>{parsedTime ? format(parsedTime) : format(time)}</div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0 pt-2">
            <div className="flex items-center justify-between mb-2">
              <RatedStars
                count={5}
                rating={rating}
                iconSize={14}
                icon={""}
                color={"yellow"}
              />
            </div>

            <Separator />

            <p className="my-3 text-sm leading-relaxed">{body}</p>

            {imgs.length > 0 && (
              <div className="grid grid-cols-2 gap-2 mt-2">
                {imgs.map((img: unknown, index: number) => {
                  const imageId = getImageId(img);
                  return (
                    <ReviewAttachmentImage
                      key={imageId ?? `review-image-${index}`}
                      img={img}
                    />
                  );
                })}
              </div>
            )}
          </CardContent>
        </div>
      </div>
    </Card>
  );
}
