"use client";

import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerHeader,
    DrawerTrigger,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { X } from "lucide-react";

interface PhotoGalleryProps {
    images: string[];
}

export function PhotoGallery({ images }: PhotoGalleryProps) {
    if (!images || images.length === 0) {
        return (
            <div className="w-full text-center py-6 text-muted-foreground italic">
                📷 No photos yet. Be the first to upload!
            </div>
        );
    }

    return (
        <ScrollArea className="w-full overflow-x-auto">
            <div className="flex flex-nowrap space-x-4 p-4 w-max">
                {images.map((img, i) => (
                    <Drawer key={i}>
                        <DrawerTrigger asChild>
                            <div className="relative cursor-pointer w-[300px] h-[200px] flex-shrink-0 group overflow-hidden rounded-md">
                                <Image
                                    src={img}
                                    alt={`Location photo ${i + 1}`}
                                    fill
                                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                            </div>
                        </DrawerTrigger>
                        <DrawerContent className="h-[90vh] p-0 bg-black border-none">
                            <div className="relative w-full h-full flex flex-col">
                                <DrawerHeader className="absolute top-0 right-0 z-50 p-4">
                                    <DrawerClose asChild>
                                        <Button
                                            variant="secondary"
                                            size="icon"
                                            className="rounded-full bg-white/10 hover:bg-white/20 text-white border-none"
                                        >
                                            <X className="h-6 w-6" />
                                            <span className="sr-only">Close</span>
                                        </Button>
                                    </DrawerClose>
                                </DrawerHeader>
                                <div className="flex-1 relative w-full h-full flex items-center justify-center p-4">
                                    <Image
                                        src={img}
                                        alt={`Full screen photo ${i + 1}`}
                                        fill
                                        className="object-contain"
                                    />
                                </div>
                            </div>
                        </DrawerContent>
                    </Drawer>
                ))}
            </div>
            <ScrollBar orientation="horizontal" />
        </ScrollArea>
    );
}
