"use client";

import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { X } from "lucide-react";
import { Img } from "@/app/components/lib/types";
import { Accordion } from "@radix-ui/react-accordion";
import { AccordionContent } from "@radix-ui/react-accordion";
import { AccordionItem } from "@radix-ui/react-accordion";
import { AccordionTrigger } from "@radix-ui/react-accordion";

import { Badge } from "@/components/ui/badge"
import { toast } from "sonner";
import { ChevronDown } from "lucide-react";

import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"



interface GallerySectionProps {
  images: Img[];
}

const handleApprove = async (img: Img) => {

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_ASSET_URL}/gallery/${img.ImageID}`, { 
        method: 'PUT',
        credentials: "include",
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
            toast.error("Some error occurred");

      }

      const result = await response.json();
      console.log('Success:', result);
      toast.success(result.message)
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to update item.');
    }
  };

const handleDelete = async (img: Img) => {

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
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to update item.');
    }
  };


export function GallerySection({ images }: GallerySectionProps) {

  if (!images || images.length === 0) {
    return 
  }

  return (
   
      <Accordion
      type="single"
      collapsible
      defaultValue="shipping"
      className="max-w-lg"
    >
        <AccordionItem value={images[0].Status.toString()}>
        <AccordionTrigger>
            <h2 className="scroll-m-20 border-b my-2 pb-2 text-3xl font-semibold tracking-tight first:mt-0" >
                {images[0].Status.charAt(0).toUpperCase() + images[0].Status.slice(1)} Images <ChevronDown className="inline"/>
            </h2>
            </AccordionTrigger>
         <AccordionContent className="w-[100VW] grid grid-cols-3">
    {images.map((img, i) => (   
    <Card className="relative max-w-sm pt-0 m-4" key={i}>
                   <Image
                  alt={`Location photo ${i + 1}`}
                  src={img.Status == "approved" ? `${process.env.NEXT_PUBLIC_ASSET_URL}/assets/${img.ImageID}.webp`: `${process.env.NEXT_PUBLIC_ASSET_URL}/tmp/${img.ImageID}.webp`}
                  width="1000"
                  height="1000"
                  className="rounded w-full"
                  unoptimized
                />
      <CardHeader>
        <CardAction>
          <Badge className={img.Status == "approved" ? "bg-green-100" : "bg-red-100"} variant="secondary">{img.Status.charAt(0).toUpperCase() + img.Status.slice(1)}</Badge>
        </CardAction>
        <CardTitle>{img.ImageID}</CardTitle>
        <CardDescription>
        </CardDescription>
      </CardHeader>
      <CardFooter className="flex space-x-4">
        <Drawer>
            <DrawerTrigger asChild>
        <Button className="flex-1 bg-blue-500 cursor-pointer">View Details</Button>
            </DrawerTrigger>
            <DrawerContent className="h-[80vh] p-4 border">
              <div className="relative w-full h-full flex flex-col">
                <DrawerHeader className="absolute top-0 right-0 z-50 p-4">
                  <DrawerClose asChild>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="rounded-full bg-white/10 hover:bg-white/20 border-none"
                    >
                      <X className="h-6 w-6" />
                      <span className="sr-only">Close</span>
                    </Button>
                  </DrawerClose>
                  
                </DrawerHeader>

                <div className="flex relative w-[80vw] h-full items-center justify-around p-4 m-auto">
                    <div>
                  <Image
                  src={img.Status == "approved" ? `${process.env.NEXT_PUBLIC_ASSET_URL}/assets/${img.ImageID}.webp`: `${process.env.NEXT_PUBLIC_ASSET_URL}/tmp/${img.ImageID}.webp`}
                    alt={`Full screen photo ${i + 1}`}
                    width={500}
                    height={500}
                    className="object-contain rounded"
                    // unoptimized
                  />
                  </div>
                  <div>
                <DrawerTitle>ImageID: {img.ImageID}</DrawerTitle>
                  <div>Owner: {img.OwnerID}</div>
                  <div>Parent Asset ID: {img.ParentAssetID}</div>
                  <div>Parent Asset Type: {img.ParentAssetType}</div>
                  <div>Status: {img.Status}</div>
                  </div>
                </div>
              </div>
            </DrawerContent>
        </Drawer>
        <Button className="flex-1 bg-green-500 cursor-pointer" disabled={img.Status == "approved" ? true: false} onClick={() => handleApprove(img) }>Approve</Button>
        <Button className="flex-1 bg-red-500 cursor-pointer" onClick={() => handleDelete(img)}>Delete</Button>
      </CardFooter>
    </Card>


))}
</AccordionContent>
        </AccordionItem>
        </Accordion>
  );
}
