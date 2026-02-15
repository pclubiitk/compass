'use client';
import { useState, useEffect, use, Dispatch, SetStateAction } from "react";
import { PhotoGallery } from "../components/location/PhotoGallery";
import { Gallery } from "../components/location/Gallery";
import { Img } from  "@/app/components/lib/types";
import { toast } from "sonner";


const handleApprove = async (img: Img, load: boolean, setLoad: Dispatch<SetStateAction<boolean>>) => {
  
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_ASSET_URL}/gallery/${img.ImageID}`, { 
        method: 'PUT',
        credentials: "include",
        headers: {
          'Content-Type': 'application/json',
        }
      });
      console.log(response)
      if (!response.ok) {
        // attempts to parse server error, fallback to generic
        const errorData = await response.json().catch(() => null); 
        throw new Error(errorData?.message || `Error ${response.status}: Failed to approve`);
      }

      const result = await response.json();
      console.log('Success:', result);
      toast.success(result.message);

      setLoad(prev => !prev);
    } catch (error: any) {
      console.error('Error:', error);
      toast.error('Failed to update item.');
    }
};

const handleDelete = async (img: Img, load: boolean, setLoad: (load: boolean)=> void) => {

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_ASSET_URL}/gallery/${img.ImageID}`, { 
        method: 'DELETE',
        credentials: "include",
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const result = await response.json();
      toast.success(result.message);
      setLoad(!load)
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to update item.');
    }
  };


export function GalleryPage() {

    const [images, setImages] = useState<Img[]>([]);
    const [load, setLoad] = useState<boolean>(true);

    useEffect(() => {
        // Simulate fetching images from an API
        // In a real application, replace this with actual data fetching logic
        // fetch(`${process.env.NEXT_PUBLIC_AUTH_URL}/api/auth/me`)
        fetch( `${process.env.NEXT_PUBLIC_ASSET_URL}/gallery`,{
          credentials: "include",
        },).then(response => response.json()).then(data => setImages(data.images))
        // TODO: fix dependency array so that too many requests are not sent to backendx
    }, [load]);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4 text-center">Gallery Management</h1>
            <div className="w-[30vw] m-auto text-justify py-6 text-muted-foreground italic">
              As an admin, you can review all the images uploaded here.
              Images will be made publicly visible on the platform only after approval by an admin.
              You may approve or delete any image
      </div>
        <Gallery images={images} handleApprove={handleApprove} handleDelete={handleDelete} load={load} setLoad={setLoad}/>
    </div>
  );
}

export default GalleryPage;