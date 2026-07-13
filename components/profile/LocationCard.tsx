"use client";

import { useRouter } from "next/navigation";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, MapPin, ImageIcon, PhoneCall, TimerIcon } from "lucide-react";
import {
  AuthenticatedImage,
  buildReviewImageUrl,
  getImageId,
  getImageStatus,
} from "@/app/components/user/AuthenticatedImage";

type Location = {
  CreatedAt?: Date;
  locationId: string;
  name: string;
  description: string;
  locationType: string;
  status: string;
  avgRating: number;
  reviewCount: number;
  tag: string;
  contact: string;
  time: string;
  coverpic?: unknown;
};

export interface LocationCardProps {
  location: Location;
}

function normalizeLocation(raw: Record<string, unknown>): Location {
  const coverpic =
    raw.coverpic ?? raw.coverPic ?? raw.CoverPic ?? raw.Coverpic ?? null;

  return {
    CreatedAt: raw.CreatedAt as Date | undefined,
    locationId: String(raw.locationId ?? raw.LocationId ?? ""),
    name: String(raw.name ?? raw.Name ?? "Untitled location"),
    description: String(raw.description ?? raw.Description ?? ""),
    locationType: String(raw.locationType ?? raw.LocationType ?? ""),
    status: String(raw.status ?? raw.Status ?? "pending"),
    avgRating: Number(raw.avgRating ?? raw.AverageRating ?? 0),
    reviewCount: Number(raw.reviewCount ?? raw.ReviewCount ?? 0),
    tag: String(raw.tag ?? raw.Tag ?? ""),
    contact: String(raw.contact ?? raw.Contact ?? ""),
    time: String(raw.time ?? raw.Time ?? ""),
    coverpic,
  };
}

export function LocationCard({ location: rawLocation }: LocationCardProps) {
  const router = useRouter();
  const location = normalizeLocation(rawLocation as Record<string, unknown>);

  const coverId = getImageId(location.coverpic);
  const coverStatus = getImageStatus(location.coverpic);
  const coverSrc = coverId
    ? buildReviewImageUrl(coverId, coverStatus)
    : null;

  const handleNavigation = () => {
    if (!location.locationId) return;
    router.push(`/location/${location.locationId}`);
  };

  return (
    <Card
      onClick={handleNavigation}
      className="overflow-hidden transition-shadow hover:shadow-md pt-0 sm:p-4 cursor-pointer"
    >
      <div className="flex flex-col sm:flex-row">
        <div className="w-full sm:w-1/3 md:w-1/4 flex-shrink-0">
          <div className="relative aspect-[4/3] bg-muted">
            {coverSrc ? (
              <AuthenticatedImage
                src={coverSrc.url}
                alt={location.name}
                className="h-full w-full object-cover"
                requiresAuth={coverSrc.requiresAuth}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <ImageIcon className="h-12 w-12 text-gray-400" />
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-1 flex-col p-4">
          <CardHeader className="p-0">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-lg font-semibold capitalize">
                {location.name}
              </CardTitle>
              <div className="flex flex-col items-end gap-1 lg:flex-row">
                <Badge variant="secondary">{location.status}</Badge>
                {location.locationType ? (
                  <Badge variant="outline">{location.locationType}</Badge>
                ) : null}
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0 pt-2 flex-grow">
            <p className="text-sm text-muted-foreground line-clamp-2">
              {location.description || "No description"}
            </p>
          </CardContent>

          <CardFooter className="p-0 pt-4 flex items-center justify-between">
            <div className="flex items-center gap-1 text-sm flex-wrap">
              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
              <span className="font-bold">
                {location.avgRating?.toFixed(1) ?? "0.0"}
              </span>
              {location.reviewCount ? (
                <span className="text-muted-foreground">
                  ({location.reviewCount} reviews)
                </span>
              ) : null}
              {location.contact ? (
                <span>
                  | <PhoneCall className="h-4 w-4 inline text-green-600" />
                  {location.contact}
                </span>
              ) : null}
              {location.time ? (
                <span>
                  | <TimerIcon className="h-4 w-4 inline text-green-600" />
                  Open {location.time}
                </span>
              ) : null}
            </div>

            <MapPin className="h-5 w-5" />
          </CardFooter>
        </div>
      </div>
    </Card>
  );
}
