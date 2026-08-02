"use client";

import Image from "next/image";
import { X } from "lucide-react";

import type { Img } from "@/app/components/lib/types";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

interface GallerySectionProps {
  images: Img[];
  handleApprove: (img: Img) => void;
  handleDelete: (img: Img) => void;
}

function imageUrl(image: Img): string {
  const directory = image.status === "approved" ? "assets" : "tmp";
  return `${process.env.NEXT_PUBLIC_ASSET_URL}/${directory}/${image.imageId}.webp`;
}

export function GallerySection({
  images,
  handleApprove,
  handleDelete,
}: GallerySectionProps) {
  if (images.length === 0) return null;

  const status = images[0].status;
  const title = status.charAt(0).toUpperCase() + status.slice(1);

  return (
    <Accordion
      type="single"
      collapsible
      defaultValue={status}
      className="mx-auto w-full max-w-7xl"
    >
      <AccordionItem value={status}>
        <AccordionTrigger>
          <h2 className="my-2 scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0">
            {title} Images
          </h2>
        </AccordionTrigger>
        <AccordionContent className="grid w-full grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {images.map((image, index) => (
            <Card className="relative m-4 max-w-sm pt-0" key={image.imageId}>
              <Image
                alt={`Location photo ${index + 1}`}
                src={imageUrl(image)}
                width={1000}
                height={1000}
                className="w-full rounded"
                unoptimized
              />
              <CardHeader>
                <CardAction>
                  <Badge
                    className={
                      status === "approved" ? "bg-green-100" : "bg-red-100"
                    }
                    variant="secondary"
                  >
                    {title}
                  </Badge>
                </CardAction>
                <CardTitle>{image.imageId}</CardTitle>
              </CardHeader>
              <CardFooter className="flex space-x-4">
                <Drawer>
                  <DrawerTrigger asChild>
                    <Button className="flex-1 cursor-pointer bg-blue-500">
                      View Details
                    </Button>
                  </DrawerTrigger>
                  <DrawerContent className="h-[80vh] border p-4">
                    <div className="relative flex h-full w-full flex-col">
                      <DrawerHeader className="absolute right-0 top-0 z-50 p-4">
                        <DrawerClose asChild>
                          <Button
                            variant="secondary"
                            size="icon"
                            className="rounded-full border-none bg-white/10 hover:bg-white/20"
                          >
                            <X className="h-6 w-6" />
                            <span className="sr-only">Close</span>
                          </Button>
                        </DrawerClose>
                      </DrawerHeader>
                      <div className="m-auto flex h-full w-[80vw] items-center justify-around p-4">
                        <Image
                          src={imageUrl(image)}
                          alt={`Full screen photo ${index + 1}`}
                          width={500}
                          height={500}
                          className="rounded object-contain"
                          unoptimized
                        />
                        <div>
                          <DrawerTitle>ImageID: {image.imageId}</DrawerTitle>
                          <div>Owner: {image.ownerId}</div>
                          <div>Parent Asset ID: {image.parentAssetId}</div>
                          <div>Parent Asset Type: {image.parentAssetType}</div>
                          <div>Status: {image.status}</div>
                        </div>
                      </div>
                    </div>
                  </DrawerContent>
                </Drawer>
                <Button
                  className="flex-1 cursor-pointer bg-green-500"
                  disabled={status === "approved"}
                  onClick={() => handleApprove(image)}
                >
                  Approve
                </Button>
                <Button
                  className="flex-1 cursor-pointer bg-red-500"
                  onClick={() => handleDelete(image)}
                >
                  Delete
                </Button>
              </CardFooter>
            </Card>
          ))}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
