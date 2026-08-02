"use client";

import type { Img } from "@/app/components/lib/types";
import { galleryImagesWithStatus } from "@/app/gallery/gallery-data";
import { GallerySection } from "./GallerySection";

interface PhotoGalleryProps {
  images: Img[];
  handleApprove: (img: Img) => void;
  handleDelete: (img: Img) => void;
}

export function Gallery({
  images,
  handleApprove,
  handleDelete,
}: PhotoGalleryProps) {
  if (!images || images.length === 0) {
    return (
      <div className="w-full text-center py-6 text-muted-foreground italic">
        No photos yet. Be the first to upload!
      </div>
    );
  }

  return (
    <>
      <GallerySection
        images={galleryImagesWithStatus(images, "approved")}
        handleApprove={handleApprove}
        handleDelete={handleDelete}
      />
      <GallerySection
        images={galleryImagesWithStatus(images, "pending")}
        handleApprove={handleApprove}
        handleDelete={handleDelete}
      />
    </>
  );
}
