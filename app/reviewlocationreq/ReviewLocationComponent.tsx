"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, MapPin, User, Clock, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

interface LocationRequest {
  locationId: string;
  name: string;
  description?: string;
  locationType?: string;
  latitude?: number;
  longitude?: number;
  contact?: string;
  time?: string;
  user?: {
    email?: string;
    profile?: {
      fullName?: string;
    };
  };
  coverpic?: {
    imageId: string;
  };
}

export default function ReviewLocationComponent() {
  const router = useRouter();
  const [locations, setLocations] = useState<LocationRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPendingLocations = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_MAPS_URL}/api/maps/newLocation`,
          {
            credentials: "include",
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch pending location requests");
        }
        const data = await response.json();
        console.log("Full API Response:", data);
console.log("First Location:", data.requests?.[0]);
console.log("CoverPic:", data.requests?.[0]?.coverpic);
console.log("ImageID:", data.requests?.[0]?.coverpic?.imageId);
console.log(
  "Image URL:",
  `${process.env.NEXT_PUBLIC_ASSET_URL}/tmp/${data.requests?.[0]?.coverpic?.imageId}.webp`
);
        setLocations(Array.isArray(data?.requests) ? data.requests : []);
      } catch (error) {
        console.error(error);
        toast.error("Failed to load location requests");
      } finally {
        setLoading(false);
      }
    };

    fetchPendingLocations();
  }, []);

  const handleViewOnMap = (location: LocationRequest) => {
    if (location.latitude !== undefined && location.longitude !== undefined) {
      // Store coordinates in sessionStorage
      sessionStorage.setItem(
        "mapMarker",
        JSON.stringify({
          lat: location.latitude,
          lng: location.longitude,
          name: location.name,
        })
      );
    }
    router.push(`/`);
  };

  const handleApprove = async (locationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_MAPS_URL}/api/maps/location/${locationId}`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: "approved",
            message: "Your location request has been approved.",
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to approve location");
      }

      toast.success("Location approved!");
      setLocations((prev) =>
        prev.filter((loc) => loc.locationId !== locationId)
      );
    } catch (error) {
      toast.error("Failed to approve location");
    }
  };

  const handleReject = async (locationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_MAPS_URL}/api/maps/location/${locationId}`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: "rejected",
            message: "Your location request has been rejected.",
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to reject location");
      }

      toast.success("Location rejected!");
      setLocations((prev) =>
        prev.filter((loc) => loc.locationId !== locationId)
      );
    } catch (error) {
      toast.error("Failed to reject location");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="p-8">
        {/* Back Button and Title Section */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push("/profile")}
            className="hover:bg-accent"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-bold">Review Location Requests</h1>
        </div>


        {/* Content */}
        {locations.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-semibold">No pending requests</p>
              <p className="text-muted-foreground">
                All location requests have been reviewed
              </p>
            </div>
          </div>
        ) : (
          <div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {locations.map((location) => (
                
                <Card
                  key={location.locationId}
                  className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer flex flex-col"
                  onClick={() => handleViewOnMap(location)}
                >
                  {/* Cover Image */}
                  <div className="relative w-full h-48 bg-muted">
                    {location.coverpic?.imageId ? (
                      <Image
                        src={`${process.env.NEXT_PUBLIC_ASSET_URL}/tmp/${location.coverpic.imageId}.webp`}
                        alt={location.name}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-muted">
                        <MapPin className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                 <div className="p-4 flex flex-col flex-1">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-semibold text-lg line-clamp-2 flex-1">
                        {location.name}
                      </h3>
                      <Badge variant="outline" className="bg-black-100">
                        Pending
                      </Badge>
                    </div>

                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4 whitespace-pre-wrap break-words">
                      {location.description || "No description"}
                    </p>

                    {/* Details */}
                    <div className="space-y-2 mb-4 text-sm flex-1">
                      {location.locationType && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span>{location.locationType}</span>
                        </div>
                      )}
                      {location.user?.profile?.fullName || location.user?.email ? (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <User className="h-4 w-4" />
                          <span className="truncate">
                            {location.user.profile?.fullName || location.user.email}
                          </span>
                        </div>
                      ) : null}
                      {location.time && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>{location.time}</span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 mt-4 pt-4 border-t">
                      <Button
                        size="sm"
                        variant="default"
                        className="flex-1 bg-blue-500 hover:bg-blue-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewOnMap(location);
                        }}
                      >
                        View on Map
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1 bg-green-500 hover:bg-green-600"
                        onClick={(e) => handleApprove(location.locationId, e)}
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="flex-1"
                        onClick={(e) => handleReject(location.locationId, e)}
                      >
                        Reject
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
