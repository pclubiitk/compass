"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogHeader,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Clipboard } from "lucide-react";
import { useGContext } from "../ContextProvider";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";

interface LocationRequest {
  locationId: string;
  name: string;
  latitude: number;
  longitude: number;
  locationType: string;
  description?: string;
  status: string;
  contributedBy: string;
  createdAt?: string;
  user?: {
    email: string;
  };
}

export function AdminReviewModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [locations, setLocations] = useState<LocationRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedLocation, setSelectedLocation] =
    useState<LocationRequest | null>(null);
  const [rejectionMessage, setRejectionMessage] = useState("");
  const { setGlobalLoading } = useGContext();

  const fetchPendingLocations = async () => {
    setLoading(true);
    try {
      console.log(
        "Fetching pending locations from:",
        `${process.env.NEXT_PUBLIC_MAPS_URL}/api/maps/newLocation`,
      );
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_MAPS_URL}/api/maps/newLocation`,
        {
          credentials: "include",
        },
      );

      if (!res.ok) throw new Error("Failed to fetch pending locations");

      const data = await res.json();
      console.log("Fetched locations:", data);
      setLocations(data.requests || []);
    } catch (error) {
      console.error("Fetch error:", error);
      toast.error("Failed to fetch pending locations");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (locationId: string) => {
    setGlobalLoading(true);
    try {
      console.log("Approving location:", locationId);
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_MAPS_URL}/api/maps/location/${locationId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "approved" }),
          credentials: "include",
        },
      );

      const data = await res.json();
      console.log("Approve response:", res.status, data);

      if (!res.ok) {
        throw new Error(data.error || "Failed to approve location");
      }

      toast.success("Location approved!");
      setLocations(locations.filter((l) => l.locationId !== locationId));
      setSelectedLocation(null);
      await fetchPendingLocations(); // Refresh the list
    } catch (error) {
      console.error("Approve error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to approve location",
      );
    } finally {
      setGlobalLoading(false);
    }
  };

  const handleReject = async (locationId: string) => {
    if (!rejectionMessage.trim()) {
      toast.error("Please provide a rejection message");
      return;
    }

    setGlobalLoading(true);
    try {
      console.log(
        "Rejecting location:",
        locationId,
        "Message:",
        rejectionMessage,
      );
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_MAPS_URL}/api/maps/location/${locationId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "rejected",
            message: rejectionMessage,
          }),
          credentials: "include",
        },
      );

      const data = await res.json();
      console.log("Reject response:", res.status, data);

      if (!res.ok) {
        throw new Error(data.error || "Failed to reject location");
      }

      toast.success("Location rejected!");
      setLocations(locations.filter((l) => l.locationId !== locationId));
      setSelectedLocation(null);
      setRejectionMessage("");
      await fetchPendingLocations(); // Refresh the list
    } catch (error) {
      console.error("Reject error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to reject location",
      );
    } finally {
      setGlobalLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchPendingLocations();
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="h-12 w-12 shadow-md hover:shadow-lg transition-all hover:scale-105"
          title="Review pending location requests"
        >
          <Clipboard className="h-5 w-5" />
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Review Location Requests</DialogTitle>
          <DialogDescription>
            Review and approve/reject submitted location requests
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : locations.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No pending location requests
          </div>
        ) : (
          <div className="space-y-4">
            {locations.map((location) => (
              <Card
                key={location.locationId}
                className={`cursor-pointer hover:bg-accent transition-colors ${
                  selectedLocation?.locationId === location.locationId
                    ? "border-blue-500"
                    : ""
                }`}
                onClick={() => {
                  setSelectedLocation(location);
                  setRejectionMessage("");
                }}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{location.name}</CardTitle>
                      <CardDescription>{location.locationType}</CardDescription>
                    </div>
                    <Badge variant="outline">{location.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {location.description && (
                    <p className="text-sm text-muted-foreground">
                      {location.description}
                    </p>
                  )}
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>
                      📍 {location.latitude.toFixed(4)},{" "}
                      {location.longitude.toFixed(4)}
                    </p>
                    {location.user?.email && (
                      <p>Submitted by: {location.user.email}</p>
                    )}
                  </div>

                  {selectedLocation?.locationId === location.locationId && (
                    <div className="space-y-3 pt-2 border-t mt-3">
                      <Textarea
                        placeholder="Rejection message (required for rejection)"
                        value={rejectionMessage}
                        onChange={(e) => setRejectionMessage(e.target.value)}
                        className="text-sm"
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="default"
                          className="flex-1 bg-green-600 hover:bg-green-700"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleApprove(location.locationId);
                          }}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="flex-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleReject(location.locationId);
                          }}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <DialogClose asChild>
          <Button variant="outline" className="w-full">
            Close
          </Button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
}
