"use client";
import data from "../../../dummy.json";
import { use } from "react";
import { useParams } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Star, StarHalf, StarOff } from "lucide-react";
import Image from "next/image";
import { Heart } from 'lucide-react';
type Props = {
  params: { id: string };
};
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const rating = data.ratting;
const fullStars = Math.floor(rating);
const hasHalfStar = rating % 1 >= 0.5;
const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
import { useRouter } from "next/navigation";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import { CircleX } from "lucide-react";
import { X } from "lucide-react";
import { Share2 } from "lucide-react";
import { Progress } from "@/components/ui/progress"
import { CircleUserRound } from 'lucide-react';
import * as React from "react"

export default function LocationPage() {
  
  const router = useRouter();
   const paramss = useParams();
  const locationId = paramss.id;
     const totalphoto=data.images.length
     const pro_step=100/(totalphoto-1)
   const [progress, setProgress] = React.useState(0)


  return (
    <div className="a">
       <div className="p-0 w-full max-w-md mx-auto my-0 pb-0">
        {/* we need to add a bg image which is hardcoded for now */}
         <Image
          src="https://www.iitk.ac.in/hall11/img/portfolio/02-large.jpg"
          alt="image"
          width={500}
          height={300}
          className="r"
        />
         <X
              className=" absolute top-2 left-[-2rem] w-7 h-7 m-1 mx-10 p-1 rounded-full bg-cyan-50 text-black  cursor-pointer hover:bg-cyan-200transition-colors hover:text-red-500"
              onClick={() => router.back()}
              aria-label="Close"
            />
             <Share2  className=" absolute top-2 left-[0rem] w-7 h-7 m-1 mx-10 p-1 rounded-full bg-cyan-50 text-black  cursor-pointer hover:bg-cyan-200transition-colors hover:text-red-500"/>
              <Heart className=" absolute top-2 left-[2rem] hover:text-red-500 w-7 h-7 m-1 mx-10 p-1 rounded-full bg-cyan-50 text-black  cursor-pointer hover:bg-cyan-200transition-colors " />
        </div>
      <Card className="w-full max-w-md mx-auto bg-white ">
        <CardHeader>
         
          {/* we need to change these dummy data using real data */}
          {/* <CardTitle>Location: {locationId}</CardTitle> */}
          <div className="flex content-center ">
            <p className="text-2xl">
              <b>{data.name}</b>
            </p>
           
          </div>
          <div
            className="a
"
          >
            <div className="flex">
             <p className="mr-1">{data.ratting }/5</p>
              <div className="flex text-[#FFD700]">
                {[...Array(fullStars)].map((_, i) => (
                  <Star key={`full-${i}`} fill="#FFD700" stroke="#FFD700" />
                ))}
                {hasHalfStar && (
                  <StarHalf key="half" fill="#FFD700" stroke="#FFD700" />
                )}
              </div>{" "}
              ({data.Comments.length})
            </div>
            <div className="flex justify-between my-4">
              <div>
            <p className="text-gray-600">{data.tag}</p>
            <p className="text-gray-600">{data.timing}</p>
            </div>
            <Popover >
              <PopoverTrigger asChild>
                {/* <Button className=" my-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold   rounded-lg w-28  ">
                  Contact
                </Button> */}
                 <CircleUserRound className="font-semibold mt-2" />
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <h4 className="leading-none font-medium">Phone Number</h4>
                    <p className="text-muted-foreground text-sm">
                      {data.contact}
                    </p>
                  </div>
              
                </div>
              </PopoverContent>
            </Popover>
            </div>
          </div>

          <CardDescription>
            <p>{data.discription}</p>
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Carousel className="w-full max-w-xs mx-auto h-auto">
            <CarouselContent>
              {/* Array.from({ length: 5 }).map((_, index) */}
              {data.images.map((item, index) => (
                <CarouselItem key={index}>
                  <div className="p-1">
                    <CardContent className="flex items-center justify-center p-6">
                <div><Drawer key={index}>
    <DrawerTrigger asChild>
      <div className="relative cursor-pointer">
        <Image
          src={item.link}
          alt={`Image ${index}`}
          width={500}
          height={300}
          className="rounded-xl"
        />
        <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition rounded-xl" />
      </div>
    </DrawerTrigger>

    <DrawerContent className="h-screen p-0 overflow-hidden">
      <DrawerHeader>
        
        <DrawerClose className=" z-50 text-black bg-white hover:bg-white/50 p-2 rounded-full m-auto">
          <Button variant="outline" >Cancel</Button>
        </DrawerClose>
        <DrawerTitle>


           <Image
          src={item.link}
          alt={`Image ${index}`}
           fill
           className="object-contain bg-black m-auto"
        />
        </DrawerTitle>
        <DrawerDescription>{"we can add details about photo"}</DrawerDescription>
      </DrawerHeader>
      <DrawerFooter>
        
      </DrawerFooter>
    </DrawerContent>
  </Drawer>
</div>
                    </CardContent>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
              <Progress value={progress} className="w-[60%] m-auto" />
          <div
  className="absolute top-1/2 -translate-y-1/2 left-[-1px]"
  onClick={()=>{
    setProgress(progress-pro_step)
  }}
>
            <CarouselPrevious className="absolute top-1/2 -translate-y-1/2 left-[-1px]" /></div>
            <div
  className="absolute top-1/2 right-2 -translate-y-1/2 z-50"
  onClick={()=>{
    setProgress(progress+pro_step)
  }}
>
            <CarouselNext className="absolute top-1/2 -translate-y-1/2 right-[-1px]"/>
            </div>
          </Carousel>
        </CardContent>

        <Drawer>
          <DrawerTrigger asChild>
            <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg w-32 mx-auto">
              Add Review
            </button>
          </DrawerTrigger>
          <p className="mx-5"><b>Review summary</b></p>
          
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Help Others by giving review</DrawerTitle>

              <form className="space-y-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Your Name
                  </label>
                  <input
                    type="text"
                    placeholder="Enter your name"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="rating">
                  <input
                    type="radio"
                    name="rating-2"
                    className="mask mask-star-2 bg-orange-400"
                    aria-label="1 star"
                  />
                  <input
                    type="radio"
                    name="rating-2"
                    className="mask mask-star-2 bg-orange-400"
                    aria-label="2 star"
                    defaultChecked
                  />
                  <input
                    type="radio"
                    name="rating-2"
                    className="mask mask-star-2 bg-orange-400"
                    aria-label="3 star"
                  />
                  <input
                    type="radio"
                    name="rating-2"
                    className="mask mask-star-2 bg-orange-400"
                    aria-label="4 star"
                  />
                  <input
                    type="radio"
                    name="rating-2"
                    className="mask mask-star-2 bg-orange-400"
                    aria-label="5 star"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Your Review
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Write your experience..."
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Upload Image (optional)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    className="block w-full text-sm text-gray-600"
                  />
                </div>

                {/* <button
    type="submit"
    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md font-medium transition"
  >
    Submit Review
  </button> */}
                <AlertDialog>
                  <AlertDialogTrigger className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md font-medium transition">
                    Submit Review
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Are you absolutely sure?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will add a review
                        with your name to this place.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction>Done</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </form>

              <DrawerDescription className="mt-4 text-sm text-gray-500">
                “Your reviews help others discover the best places!”
              </DrawerDescription>
            </DrawerHeader>
            <DrawerFooter>
              <DrawerClose asChild>
                <Button variant="outline">Cancel</Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
        <CardFooter>
          <div className="w-full max-w-xs mx-auto max-h-96 overflow-y-auto">
            {data.Comments.map((item, index) => {
              const ratting = item.Rating; // corrected from 'ratting'
              const fullStars = Math.floor(ratting);
              const hasHalfStar = ratting % 1 >= 0.5;
              const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

              return (
                <div key={index} className="p-1">
                  <Card>
                    <div className="flex items-center justify-center p-6">
                      <div className="bg-white rounded-xl p-4 w-full h-full flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="text-lg font-semibold text-gray-800">
                              {item.user}
                            </h3>
                            <span className="text-sm text-gray-500">
                              {item.time}
                            </span>
                          </div>

                          <div className="flex items-center text-yellow-400 mb-2">
                            <div className="flex text-[#FFD700]">
                              {[...Array(fullStars)].map((_, i) => (
                                <Star
                                  key={`full-${i}`}
                                  fill="#FFD700"
                                  stroke="#FFD700"
                                />
                              ))}
                              {hasHalfStar && (
                                <StarHalf
                                  key="half"
                                  fill="#FFD700"
                                  stroke="#FFD700"
                                />
                              )}
                              {[...Array(emptyStars)].map((_, i) => (
                                <Star
                                  key={`empty-${i}`}
                                  fill="none"
                                  stroke="#FFD700"
                                />
                              ))}
                            </div>
                          </div>

                          <p className="text-sm text-gray-700">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              );
            })}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
