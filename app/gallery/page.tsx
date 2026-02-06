'use client';
import { useState, useEffect, use } from "react";
import { PhotoGallery } from "../components/location/PhotoGallery";
import { Gallery } from "../components/location/Gallery";
import { Img } from  "@/app/components/lib/types";

export function GalleryPage() {

    const [images, setImages] = useState<Img[]>([]);

    useEffect(() => {
        // Simulate fetching images from an API
        // In a real application, replace this with actual data fetching logic
        // fetch(`${process.env.NEXT_PUBLIC_AUTH_URL}/api/auth/me`)
        fetch( `${process.env.NEXT_PUBLIC_ASSET_URL}/gallery`,{
          credentials: "include",
        },).then(response => response.json()).then(data => setImages(data.images))
        
    }, [images]);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4 text-center">Gallery Management</h1>
            <div className="w-[30vw] m-auto text-justify py-6 text-muted-foreground italic">
              As an admin, you can review all the images uploaded here.
              Images will be made publicly visible on the platform only after approval by an admin.
              You may approve or delete any image
      </div>
        <Gallery images={images}/>
    </div>
  );
}

export default GalleryPage;