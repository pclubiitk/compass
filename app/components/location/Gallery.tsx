"use client";

import { Img } from "@/app/components/lib/types";
import { GallerySection } from "./GallerySection";

interface PhotoGalleryProps {
  images: Img[];
}

export function Gallery({ images }: PhotoGalleryProps) {
  if (!images || images.length === 0) {
    return (
      <div className="w-full text-center py-6 text-muted-foreground italic">
        📷 No photos yet. Be the first to upload!
      </div>
    );
  }

  return (<>
  <GallerySection images={images.filter(image => image.Status == "approved")}/>
  <GallerySection images={images.filter(image => image.Status == "pending")}/>
  </>
  );
}
