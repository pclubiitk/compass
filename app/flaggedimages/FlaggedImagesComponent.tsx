"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Flag,
  Loader2,
  MessageSquareText,
  Star,
  User,
  Image as ImageIcon,
} from "lucide-react";
import { toast } from "sonner";
import { useGContext } from "@/components/ContextProvider";

interface FlaggedImage {
  imageId: string;
  ownerId: string;
  parentAssetId?: string;
  parentAssetType?: string;
  status: string;
}

interface FlaggedReview {
  reviewId: string;
  description: string;
  rating: number;
  status: string;
  locationId: string;
  contributedBy: string;
  imageId?: string; // Added to hold the review's associated image
}

function normalizeImage(raw: Record<string, unknown>): FlaggedImage | null {
  const imageId = raw.imageId as string | undefined;
  if (!imageId) return null;

  return {
    imageId,
    ownerId: String(raw.ownerId ?? ""),
    parentAssetId: String(raw.parentAssetId ?? ""),
    parentAssetType: String(raw.parentAssetType ?? ""),
    status: String(raw.status ?? ""),
  };
}

function normalizeReview(raw: Record<string, unknown>): FlaggedReview | null {
  const reviewId = raw.reviewId as string | undefined;
  if (!reviewId) return null;

  // Check if the backend sent the polymorphic 'images' array
  let imageId: string | undefined = undefined;
  if (Array.isArray(raw.images) && raw.images.length > 0) {
    // Grab the ID from the first image in the array
    const firstImage = raw.images[0] as Record<string, unknown>;
    imageId = String(firstImage.imageId ?? "");
  }

  return {
    reviewId,
    description: String(raw.description ?? ""),
    rating: Number(raw.rating ?? 0),
    status: String(raw.status ?? ""),
    locationId: String(raw.locationId ?? ""),
    contributedBy: String(raw.contributedBy ?? ""),
    ...(imageId && { imageId: String(imageId) }),
  };
}

function isFlaggedImageStatus(status: string) {
  const normalized = status.toLowerCase();
  return normalized === "rejected" || normalized === "rejectedbybot";
}

export default function FlaggedImagesComponent() {
  const router = useRouter();
  const [images, setImages] = useState<FlaggedImage[]>([]);
  const [reviews, setReviews] = useState<FlaggedReview[]>([]);
  const { setGlobalLoading } = useGContext();
  const [actionId, setActionId] = useState<string | null>(null);

  const assetUrl = process.env.NEXT_PUBLIC_ASSET_URL;
  const mapsUrl = process.env.NEXT_PUBLIC_MAPS_URL;

  const fetchFlaggedContent = async () => {
    if (!assetUrl || !mapsUrl) {
      toast.error("Backend URLs not configured");
      return;
    }

    try {
      setGlobalLoading(true);
      const [imagesRes, reviewsRes] = await Promise.all([
        fetch(`${assetUrl}/gallery`, { credentials: "include" }),
        fetch(`${mapsUrl}/api/maps/flag`, { credentials: "include" }),
      ]);

      if (imagesRes.ok) {
        const imagesData = await imagesRes.json();
        const allImages = Array.isArray(imagesData?.images)
          ? imagesData.images
          : [];
        const flaggedImages = allImages
          .map((img: Record<string, unknown>) => normalizeImage(img))
          .filter((img: FlaggedImage | null): img is FlaggedImage => {
            return (
              img !== null &&
              isFlaggedImageStatus(img.status) &&
              img.parentAssetType !== "Review" // Prevents duplication
            );
          });
        setImages(flaggedImages);
      } else {
        setImages([]);
        throw new Error("Failed to fetch flagged images");
      }

      if (reviewsRes.ok) {
        const reviewsData = await reviewsRes.json();
        const allReviews = Array.isArray(reviewsData?.flagged_reviews)
          ? reviewsData.flagged_reviews
          : [];
        const flaggedReviews = allReviews
          .map((review: Record<string, unknown>) => normalizeReview(review))
          .filter((review: FlaggedReview | null): review is FlaggedReview => {
            return review !== null;
          });
        setReviews(flaggedReviews);
      } else {
        setReviews([]);
        throw new Error("Failed to fetch flagged reviews");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load flagged content");
    } finally {
      setGlobalLoading(false);
    }
  };

  useEffect(() => {
    fetchFlaggedContent();
  }, []);

  const handleApproveImage = async (imageId: string) => {
    if (!assetUrl) return;

    try {
      setActionId(`image-${imageId}`);
      const response = await fetch(`${assetUrl}/gallery/${imageId}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error("Failed to approve image");
      }

      const result = await response.json();
      toast.success(result.message || "Image approved");
      setImages((prev) => prev.filter((img) => img.imageId !== imageId));
    } catch (error) {
      console.error(error);
      toast.error("Failed to approve image");
    } finally {
      setActionId(null);
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    if (!assetUrl) return;

    try {
      setActionId(`image-${imageId}`);
      const response = await fetch(`${assetUrl}/gallery/${imageId}`, {
        method: "DELETE",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error("Failed to delete image");
      }

      const result = await response.json();
      toast.success(result.message || "Image deleted");
      setImages((prev) => prev.filter((img) => img.imageId !== imageId));
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete image");
    } finally {
      setActionId(null);
    }
  };

  const handleApproveReview = async (reviewId: string) => {
    if (!mapsUrl) return;

    try {
      setActionId(`review-${reviewId}`);
      const response = await fetch(`${mapsUrl}/api/maps/flag/${reviewId}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approved" }),
      });

      if (!response.ok) {
        throw new Error("Failed to approve review");
      }

      const result = await response.json();
      toast.success(result.message || "Review approved");
      setReviews((prev) =>
        prev.filter((review) => review.reviewId !== reviewId),
      );
    } catch (error) {
      console.error(error);
      toast.error("Failed to approve review");
    } finally {
      setActionId(null);
    }
  };

  const handleRejectReview = async (reviewId: string) => {
    if (!mapsUrl) return;

    const message =
      window.prompt(
        "Rejection message for the user:",
        "Your review was rejected after admin review.",
      ) ?? "";

    if (!message.trim()) {
      toast.error("A rejection message is required");
      return;
    }

    try {
      setActionId(`review-${reviewId}`);
      const response = await fetch(`${mapsUrl}/api/maps/flag/${reviewId}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "rejected", message: message.trim() }),
      });

      if (!response.ok) {
        throw new Error("Failed to reject review");
      }

      const result = await response.json();
      toast.success(result.message || "Review rejected");
      setReviews((prev) =>
        prev.filter((review) => review.reviewId !== reviewId),
      );
    } catch (error) {
      console.error(error);
      toast.error("Failed to reject review");
    } finally {
      setActionId(null);
    }
  };

  const totalFlagged = reviews.length + images.length;

  return (
    <div className="min-h-screen bg-background">
      <div className="p-8">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push("/profile")}
            className="hover:bg-accent"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-bold">Flagged Content</h1>
        </div>

        <p className="text-muted-foreground mb-8 max-w-3xl">
          Content flagged by the moderation system appears here. Review text and
          images, then approve if the AI made a mistake or reject/delete if the
          content should stay removed.
        </p>

        {totalFlagged === 0 ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <Flag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-semibold">No flagged content</p>
              <p className="text-muted-foreground">
                All flagged items have been reviewed
              </p>
            </div>
          </div>
        ) : (
          <Tabs defaultValue="reviews" className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="reviews">
                Reviews ({reviews.length})
              </TabsTrigger>
              <TabsTrigger value="images">Images ({images.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="reviews">
              {reviews.length === 0 ? (
                <div className="flex items-center justify-center py-16 text-center">
                  <div>
                    <MessageSquareText className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                    <p className="font-semibold">No flagged reviews</p>
                    <p className="text-sm text-muted-foreground">
                      AI-flagged review text will appear here
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {reviews.map((review) => {
                    const isBusy = actionId === `review-${review.reviewId}`;

                    return (
                      <Card
                        key={review.reviewId}
                        className="overflow-hidden hover:shadow-lg transition-shadow flex flex-col"
                      >
                        {review.imageId && (
                          <div className="relative w-full h-48 bg-muted border-b">
                            <Image
                              src={`${assetUrl}/tmp/${review.imageId}.webp`}
                              alt="Review associated image"
                              fill
                              className="object-cover"
                              unoptimized
                            />
                            <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded flex items-center gap-1 backdrop-blur-sm">
                              <ImageIcon className="h-3 w-3" />
                              Has Attached Image
                            </div>
                          </div>
                        )}

                        <div className="p-4 flex flex-col flex-1">
                          <div className="flex items-start justify-between gap-2 mb-3">
                            <div className="flex items-center gap-2">
                              <MessageSquareText className="h-5 w-5 text-muted-foreground" />
                              <h3 className="font-semibold">Review</h3>
                            </div>
                            <Badge
                              variant="outline"
                              className="bg-red-100 shrink-0 text-black"
                            >
                              Flagged
                            </Badge>
                          </div>

                          <p className="text-sm mb-4 line-clamp-6 flex-1">
                            {review.description || "No description"}
                          </p>

                          <div className="space-y-2 mb-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <Star className="h-4 w-4" />
                              <span>Rating: {review.rating}/5</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              <span className="truncate">
                                {review.contributedBy || "Unknown user"}
                              </span>
                            </div>
                            <p>
                              <span className="font-medium text-foreground">
                                Location:
                              </span>{" "}
                              <span className="break-all">
                                {review.locationId}
                              </span>
                            </p>
                            <p>
                              <span className="font-medium text-foreground">
                                Status:
                              </span>{" "}
                              {review.status}
                            </p>
                          </div>

                          <div className="flex gap-2 mt-4 pt-4 border-t">
                            <Button
                              size="sm"
                              className="flex-1 bg-green-500 hover:bg-green-600 dark:hover:bg-green-400"
                              disabled={isBusy}
                              onClick={() =>
                                handleApproveReview(review.reviewId)
                              }
                            >
                              {isBusy ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                "Approve"
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="flex-1 bg-red-500 hover:bg-red-600 dark:hover:bg-red-400"
                              disabled={isBusy}
                              onClick={() =>
                                handleRejectReview(review.reviewId)
                              }
                            >
                              Reject
                            </Button>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="images">
              {images.length === 0 ? (
                <div className="flex items-center justify-center py-16 text-center">
                  <div>
                    <Flag className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                    <p className="font-semibold">No flagged images</p>
                    <p className="text-sm text-muted-foreground">
                      AI-flagged images will appear here
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {images.map((image) => {
                    const isBusy = actionId === `image-${image.imageId}`;

                    return (
                      <Card
                        key={image.imageId}
                        className="overflow-hidden hover:shadow-lg transition-shadow flex flex-col"
                      >
                        <div className="relative w-full h-48 bg-muted">
                          <Image
                            src={`${assetUrl}/tmp/${image.imageId}.webp`}
                            alt="Flagged image"
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        </div>

                        <div className="p-4 flex flex-col flex-1">
                          <div className="flex items-start justify-between gap-2 mb-3">
                            <h3 className="font-semibold text-sm line-clamp-2 flex-1 break-all">
                              {image.imageId}
                            </h3>
                            <Badge
                              variant="outline"
                              className="bg-red-100 shrink-0"
                            >
                              Flagged
                            </Badge>
                          </div>

                          <div className="space-y-1 mb-4 text-sm text-muted-foreground flex-1">
                            <p>
                              <span className="font-medium text-foreground">
                                Owner:
                              </span>{" "}
                              {image.ownerId || "Unknown"}
                            </p>
                            {image.parentAssetType ? (
                              <p>
                                <span className="font-medium text-foreground">
                                  Type:
                                </span>{" "}
                                {image.parentAssetType}
                              </p>
                            ) : null}
                            <p>
                              <span className="font-medium text-foreground">
                                Status:
                              </span>{" "}
                              {image.status}
                            </p>
                          </div>

                          <div className="flex gap-2 mt-4 pt-4 border-t">
                            <Button
                              size="sm"
                              className="flex-1 bg-green-500 hover:bg-green-600"
                              disabled={isBusy}
                              onClick={() => handleApproveImage(image.imageId)}
                            >
                              {isBusy ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                "Approve"
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="flex-1"
                              disabled={isBusy}
                              onClick={() => handleDeleteImage(image.imageId)}
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
