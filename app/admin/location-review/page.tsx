"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ShieldCheck, XCircle, CheckCircle } from "lucide-react";

type LocationRequest = {
  locationId: string;
  name: string;
  description?: string;
  latitude: number;
  longitude: number;
  status: string;
  contributedBy: string;
};

export default function LocationReviewPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<LocationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_MAPS_URL}/api/maps/newLocation`,
        { credentials: "include" },
      );
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          toast.error("Unauthorized. Redirecting to home.");
          router.push("/");
          return;
        }
        const err = await res.json();
        throw new Error(err.error || "Failed to fetch location requests");
      }
      const data = await res.json();
      setRequests(data.requests || []);
    } catch (err) {
      console.error(err);
      toast.error((err as Error).message || "Failed to load requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleAction = async (
    locationId: string,
    action: "approved" | "rejected",
    message?: string,
  ) => {
    setSubmittingId(locationId);

    try {
      const body: any = { status: action };
      if (action === "rejected") {
        body.message = message || "Rejected by admin";
      }

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_MAPS_URL}/api/maps/location/${locationId}`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        },
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to update request");
      }

      toast.success(data.message || "Updated successfully");
      await fetchRequests();
    } catch (err) {
      console.error(err);
      toast.error((err as Error).message || "Failed to update request");
    } finally {
      setSubmittingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-medium">Loading location review requests…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/40 p-6 lg:p-10">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Location Review Queue</h1>
            <p className="text-sm text-muted-foreground">
              Approve or reject locations contributed by users.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/")}
          >
            Back to map
          </Button>
        </div>

        {requests.length === 0 ? (
          <Card>
            <CardContent className="text-center py-20">
              <ShieldCheck className="mx-auto mb-4 w-10 h-10 text-green-500" />
              <p className="text-lg font-medium">No locations pending review</p>
              <p className="text-sm text-muted-foreground">
                Once users submit new locations, they will appear here.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {requests.map((req) => (
              <Card key={req.locationId} className="bg-white dark:bg-zinc-900">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between gap-4">
                    <span className="font-semibold text-lg">{req.name}</span>
                    <span className="text-xs text-muted-foreground">
                      Contributed by {req.contributedBy}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {req.description ? (
                    <p className="text-sm text-muted-foreground">
                      {req.description}
                    </p>
                  ) : null}
                  <div className="flex flex-wrap gap-2">
                    <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
                      Lat: {req.latitude.toFixed(5)}
                    </span>
                    <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
                      Lon: {req.longitude.toFixed(5)}
                    </span>
                    <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
                      Status: {req.status}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={submittingId === req.locationId}
                      onClick={() => handleAction(req.locationId, "approved")}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" /> Approve
                    </Button>
                    <Button
                      size="sm"
                      disabled={submittingId === req.locationId}
                      onClick={async () => {
                        const message = window.prompt(
                          "Rejection reason (will be sent to contributor):",
                          "Not suitable for this map",
                        );
                        if (message === null) return;
                        await handleAction(req.locationId, "rejected", message);
                      }}
                    >
                      <XCircle className="w-4 h-4 mr-2" /> Reject
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
