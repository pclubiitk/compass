"use-client";

import Image from "next/image";
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

enum Status {
  "approved",
  "pending",
  "rejected",
  "rejectedByBot",
}

type Location = {
  CreatedAt: Date;
  locationId: string;
  name: string;
  description: string;
  locationType: string;
  status: Status;
  avgRating: number;
  reviewCount: number;
  tag: string;
  contact: string;
  time: string;
  coverpic: string;
  biopics: string[];
};

interface LocationCardProps {
  location: Location;
}

export function LocationCard({ location }: LocationCardProps) {
  const router = useRouter();
  const imageUrl = location.coverpic
    ? `${process.env.NEXT_PUBLIC_ASSET_URL}/assets/${location.coverpic}.webp`
    : null;

  const handleNavigation = () => {
    router.push(`/location/${location.locationId}`);
  };

  return (
    <Card
      onClick={handleNavigation}
      className="overflow-hidden transition-shadow hover:shadow-md pt-0 sm:p-4"
    >
      <div className="flex flex-col sm:flex-row">
        {/* Left Side: Image */}
        <div className="w-full sm:w-1/3 md:w-1/4 flex-shrink-0">
          <div className="relative aspect-[4/3] bg-muted">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={location.name}
                fill
                className="object-cover"
              />
            ) : (
              // Fallback icon if no image is available
              <div className="flex h-full w-full items-center justify-center">
                <ImageIcon className="h-12 w-12 text-gray-400" />
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Content */}
        <div className="flex flex-1 flex-col p-4">
          <CardHeader className="p-0">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold capitalize">
                {location.name}
              </CardTitle>
              <div className="flex-col justify-end gap-1 lg:flex-row">
                <Badge variant="secondary">{location.status}</Badge>
                <Badge variant="outline">{location.locationType}</Badge>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0 pt-2 flex-grow">
            <p className="text-sm text-muted-foreground line-clamp-2">
              {location.description}
            </p>
          </CardContent>

          <CardFooter className="p-0 pt-4 flex items-center justify-between">
            {/* Rating and Review Count */}
            <div className="flex items-center gap-1 text-sm">
              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
              <span className="font-bold">{location.avgRating.toFixed(1)}</span>
              {location.reviewCount ? (
                <span className="text-muted-foreground">
                  ({location.reviewCount} reviews)
                </span>
              ) : (
                <></>
              )}
              {location.contact && (
                <span>
                  | <PhoneCall className="h-4 w-4 inline text-green-600" />
                  {location.contact}
                </span>
              )}
              {location.time && (
                <span>
                  | <TimerIcon className="h-4 w-4 inline text-green-600" />
                  Open {location.time}
                  {"1234"}
                </span>
              )}
            </div>

            <MapPin className="h-5 w-5" />
          </CardFooter>
        </div>
      </div>
    </Card>
  );
}
