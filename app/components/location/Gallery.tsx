"use client";

import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
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


import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { DialogTitle } from "@radix-ui/react-dialog";
import { disableInstantTransitions } from "framer-motion";

interface PhotoGalleryProps {
  images: Img[];
}
const handleApprove = async (img: Img) => {

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_ASSET_URL}/gallery/${img.ImageID}`, { 
        method: 'PUT',
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
      alert('Failed to update item.');
    }
  };

const handleDelete = async (img: Img) => {

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_ASSET_URL}/gallery/${img.ImageID}`, { 
        method: 'DELETE',
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
      alert('Failed to update item.');
    }
  };


export function Gallery({ images }: PhotoGalleryProps) {

  if (!images || images.length === 0) {
    return (
      <div className="w-full text-center py-6 text-muted-foreground italic">
        📷 No photos yet. Be the first to upload!
      </div>
    );
  }

  return (<>
      <Accordion
      type="single"
      collapsible
      defaultValue="shipping"
      className="max-w-lg"
    >
        <AccordionItem value="Approved">
        <AccordionTrigger>Approved Images</AccordionTrigger>
         <AccordionContent className="w-[100VW] grid grid-cols-3">
    {images.filter(image => image.Status == "approved").map((img, i) => (   
        // <div className="bg-sky-50">
        //     hehe
        // </div>
    <Card className="relative max-w-sm pt-0 m-4" key={i}>

              {/* <div className="relative cursor-pointer w-[300px] h-[00px] flex-shrink-0 group overflow-hidden rounded-md"> */}
                   <Image
                  alt={`Location photo ${i + 1}`}
                  src={`${process.env.NEXT_PUBLIC_ASSET_URL}/assets/${img.ImageID}.webp`}
                  width="1000"
                  height="100"
                //   fill
                  className="rounded w-full"
                />

      <CardHeader>
        <CardAction>
          <Badge variant="secondary">{img.Status}</Badge>
        </CardAction>
        <CardTitle>{img.ImageID}</CardTitle>
        <CardDescription>
            {/* <span>Uploaded at: </span> {img.CreatedAt.toISOString()} */}
        </CardDescription>
      </CardHeader>
      <CardFooter className="flex space-x-4">
        <Drawer>
            <DrawerTrigger asChild>
        <Button className="flex-1 bg-blue-500 cursor-pointer">View Details</Button>
            </DrawerTrigger>
            <DrawerContent className="h-[90vh] p-0 border-none">
                <DrawerTitle>{img.ImageID}</DrawerTitle>

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
                <div className="flex-1 relative w-full h-full flex-column items-center justify-center p-4">
                  <Image
                  src={`${process.env.NEXT_PUBLIC_ASSET_URL}/assets/${img.ImageID}.webp`}
                    alt={`Full screen photo ${i + 1}`}
                    width={400}
                    height={400}
                    className="object-contain rounded"
                  />
                  {/* <div>{img.CreatedAt.toDateString()}</div> */}
                  <div>Owner: {img.OwnerID}</div>
                  <div>Parent Asset ID: {img.ParentAssetID}</div>
                  <div>Parent Asset Type: {img.ParentAssetType}</div>
                  {/* <div>{img.UpdatedAt}</div> */}
                </div>
              </div>
            </DrawerContent>
        </Drawer>
        <Button className="flex-1 bg-green-500 cursor-pointer" disabled onClick={() => handleApprove(img) }>Approve</Button>
        <Button className="flex-1 bg-red-500 cursor-pointer" onClick={() => handleDelete(img)}>Delete</Button>
      </CardFooter>
    </Card>


))}
</AccordionContent>
        </AccordionItem>
        </Accordion>


              <Accordion
      type="single"
      collapsible
      defaultValue="shipping"
      className="max-w-lg"
    >
        <AccordionItem value="Pending">
        <AccordionTrigger>Pending Images</AccordionTrigger>
         <AccordionContent className="w-[100VW] grid grid-cols-3">
    {images.filter(image => image.Status == "pending").map((img, i) => (   
        // <div className="bg-sky-50">
        //     hehe
        // </div>
    <Card className="relative max-w-sm pt-0 m-4" key={i}>

              {/* <div className="relative cursor-pointer w-[300px] h-[00px] flex-shrink-0 group overflow-hidden rounded-md"> */}
                   <Image
                  alt={`Location photo ${i + 1}`}
                  src={`${process.env.NEXT_PUBLIC_ASSET_URL}/tmp/${img.ImageID}.webp`}
                  width="1000"
                  height="100"
                //   fill
                  className="rounded w-full cursor-pointer"
                />

      <CardHeader>
        <CardAction>
          <Badge variant="secondary">{img.Status}</Badge>
        </CardAction>
        <CardTitle>{img.ImageID}</CardTitle>
        <CardDescription>
            {/* <span>Uploaded at: </span> {img.CreatedAt.toISOString()} */}
        </CardDescription>
      </CardHeader>
      <CardFooter className="flex space-x-4">
        <Drawer>
            <DrawerTrigger asChild>
        <Button className="flex-1 bg-blue-500 cursor-pointer">View Details</Button>
            </DrawerTrigger>
            
            <DrawerContent className="h-[90vh] p-0 border-none">
                <DrawerTitle>{img.ImageID}</DrawerTitle>
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
                <div className="flex-1 relative w-full h-full flex-column items-center justify-center p-4">
                  <Image
                  src={`${process.env.NEXT_PUBLIC_ASSET_URL}/tmp/${img.ImageID}.webp`}
                    alt={`Full screen photo ${i + 1}`}
                    width={400}
                    height={400}
                    className="object-contain rounded"
                  />
                  {/* <div>{img.CreatedAt.toDateString()}</div> */}
                  <div>Owner: {img.OwnerID}</div>
                  <div>Parent Asset ID: {img.ParentAssetID}</div>
                  <div>Parent Asset Type: {img.ParentAssetType}</div>
                  {/* <div>{img.UpdatedAt}</div> */}
                </div>
              </div>
            </DrawerContent>
        </Drawer>
        <Button className="flex-1 bg-green-500 cursor-pointer" onClick={() => handleApprove(img)}>Approve</Button>
        <Button className="flex-1 bg-red-500 cursor-pointer" onClick={() => handleDelete(img)}>Delete</Button>
      </CardFooter>
    </Card>


))}
</AccordionContent>
        </AccordionItem>
        </Accordion>
    </>
  );
}
