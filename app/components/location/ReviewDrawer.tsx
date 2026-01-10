"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import StarRating from "@/app/components/user/Rate";
import { toast } from "sonner";
import { ImagePlus, Loader2 } from "lucide-react";
import { useMediaQuery } from "@/app/hooks/use-media-query";

interface ReviewDrawerProps {
  locationId: string;
  onReviewAdded: () => void;
  children: React.ReactNode;
}

export function ReviewDrawer({
  locationId,
  onReviewAdded,
  children,
}: ReviewDrawerProps) {
  const [rating, setRating] = useState(0);
  const [description, setDescription] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const handleSubmit = async () => {
    if (!rating) {
      toast.error("Please select a rating.");
      return;
    }
    if (!description.trim()) {
      toast.error("Please write a review description.");
      return;
    }

    setIsSubmitting(true);

    try {
      let imageId = null;

      // 1. Upload Image if present
      if (image) {
        try {
          const imagePayload = new FormData();
          imagePayload.append("file", image);

          // Asset server is on port 8082, Maps is on 8081
          const assetUrl =
            process.env.NEXT_PUBLIC_MAPS_URL?.replace(":8081", ":8082") ||
            "http://localhost:8082";
          const imgRes = await fetch(`${assetUrl}/assets`, {
            method: "POST",
            credentials: "include",
            body: imagePayload,
          });

          if (!imgRes.ok) {
            const errorText = await imgRes.text();
            console.error(
              "Image upload failed:",
              imgRes.status,
              imgRes.statusText,
              errorText
            );
            throw new Error(
              `Failed to upload image: ${imgRes.status} ${errorText}`
            );
          }

          const imgData = await imgRes.json();
          imageId = imgData.ImageID;
        } catch (uploadErr) {
          console.error("Image upload error:", uploadErr);
          toast.warning(
            "Image upload failed. Submitting review without image."
          );
          imageId = null;
        }
      }

      // 2. Submit Review Data
      const reviewPayload = {
        rating: rating,
        locationId: locationId,
        description: description,
        images: imageId ? [imageId] : [],
      };

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_MAPS_URL}/api/maps/review`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(reviewPayload),
          credentials: "include",
        }
      );
      const data = await res.json();

      if (res.ok) {
        toast.success("Review submitted successfully!");
        setIsOpen(false);
        onReviewAdded();
        // Reset form
        setRating(0);
        setDescription("");
        setImage(null);
      } else {
        toast.error(data.error || "Failed to submit review.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Submission failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const ReviewForm = (
    <div className="space-y-6">
      <div className="flex flex-col items-center justify-center space-y-2">
        <span className="text-sm font-medium text-muted-foreground">
          Tap to Rate
        </span>
        <StarRating initialRating={rating} onChange={setRating} />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Your Review</label>
        <textarea
          className="w-full min-h-[150px] p-3 rounded-md border bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          placeholder="What did you like or dislike? How was the atmosphere?"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium block">
          Add Photo (Optional)
        </label>
        <div className="flex items-center gap-4">
          <Button
            type="button"
            variant="outline"
            className="w-full relative overflow-hidden"
            onClick={() => document.getElementById("review-image")?.click()}
          >
            <ImagePlus className="mr-2 h-4 w-4" />
            {image ? image.name : "Choose Image"}
          </Button>
          <input
            id="review-image"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => setImage(e.target.files?.[0] || null)}
          />
        </div>
      </div>

      <Button className="w-full" onClick={handleSubmit} disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Submitting...
          </>
        ) : (
          "Submit Review"
        )}
      </Button>
    </div>
  );

  if (isDesktop) {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>{children}</DialogTrigger>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Share your experience</DialogTitle>
            <DialogDescription>
              Help others by rating and reviewing this location.
            </DialogDescription>
          </DialogHeader>
          {ReviewForm}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={isOpen} onOpenChange={setIsOpen}>
      <DrawerTrigger asChild>{children}</DrawerTrigger>
      <DrawerContent>
        <div className="mx-auto w-full max-w-lg">
          <DrawerHeader>
            <DrawerTitle>Share your experience</DrawerTitle>
            <DrawerDescription>
              Help others by rating and reviewing this location.
            </DrawerDescription>
          </DrawerHeader>
          <div className="p-4">{ReviewForm}</div>
          <DrawerFooter>
            <DrawerClose asChild>
              <Button variant="ghost">Cancel</Button>
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
