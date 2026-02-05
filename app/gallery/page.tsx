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
        // fetchImages()
        // setImages([
        //     "/images/photo1.jpg",
        //     "/images/photo2.jpg",
        //     "/images/photo3.jpg",
        // ]);
        fetch( `${process.env.NEXT_PUBLIC_ASSET_URL}/gallery`).then(response => response.json()).then(data => setImages(data.images))
        
    }, []);
    
    // const fetchImages = async() => {
    //   const res = await fetch( `${process.env.NEXT_PUBLIC_ASSET_URL}/gallery`)
    //   const images = res.json()
    //   console.log(images)
    

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Gallery Page</h1>
        {/* <PhotoGallery images={images} /> */}
        <Gallery images={images}/>
    </div>
  );
}

export default GalleryPage;