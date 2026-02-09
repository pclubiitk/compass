"use client";

import { Img } from "@/app/components/lib/types";
import { GallerySection } from "./GallerySection";

interface PhotoGalleryProps {
  images: Img[];
  handleApprove: (img: Img, load: Boolean, setLoad: (load: Boolean)=> void) => void;
  handleDelete: (img: Img, load: Boolean, setLoad: (load: Boolean)=> void) => void;
  load: Boolean;
  setLoad: (load:Boolean) => void;
}

export function Gallery({ images, handleApprove, handleDelete, load, setLoad}: PhotoGalleryProps) {
  if (!images || images.length === 0) {
    return (
      <div className="w-full text-center py-6 text-muted-foreground italic">
        📷 No photos yet. Be the first to upload!
      </div>
    );
  }

  return (<>
  <GallerySection images={images.filter(image => image.Status == "approved")} handleApprove={handleApprove} handleDelete={handleDelete} load={load} setLoad={setLoad}/>
  <GallerySection images={images.filter(image => image.Status == "pending")} handleApprove={handleApprove} handleDelete={handleDelete} load={load} setLoad={setLoad}/>
  </>
  );
}
