"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { X, Share2, Heart, Star, StarHalf } from "lucide-react";
import Image from "next/image";
import { FacebookShareButton, FacebookIcon, RedditShareButton, RedditIcon, WhatsappShareButton, WhatsappIcon, LinkedinShareButton, LinkedinIcon } from "next-share";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { CircleUserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import ReviewCard from "@/app/components/user/ReviewCard";

export default function LocationPage() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const page = searchParams.get("page") || "1";
  const router = useRouter();

  const [location, setLocation] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);

  useEffect(() => {
    if (!id) return;

    const fetchLocation = async () => {
      try {
        const res = await fetch(`http://localhost:8081/api/maps/location/${id}`);
        const data = await res.json();
        setLocation(data.location);
      } catch (err) {
        console.error("Failed to fetch location:", err);
      }
    };

    const fetchReviews = async () => {
      try {
        const res = await fetch(`http://localhost:8081/api/maps/reviews/${id}/${page}`);
        const data = await res.json();
        setReviews(data.reviews || []);
      } catch (err) {
        console.error("Failed to fetch reviews:", err);
      }
    };

    fetchLocation();
    fetchReviews();
  }, [id, page]);

  if (!id || !location) {
    return <p className="text-center p-4">Loading location...</p>;
  }

  const rating = location.avg_rating || 0;
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;

  const handleReviewSubmit = async () => {
    const form = document.querySelector("form")!;

    const rating = form.querySelector<HTMLInputElement>('input[name="rating-2"]:checked')?.getAttribute("aria-label")?.[0];
    const description = (form.querySelector("textarea") as HTMLTextAreaElement)?.value;
    const image = (form.querySelector('input[type="file"]') as HTMLInputElement)?.files?.[0];

    if (!rating || !description) {
      alert("Please provide both rating and description.");
      return;
    }

    const payload = new FormData();
    payload.append("rating", rating);
    payload.append("contributed_by", "muragesh24");
    payload.append("location_id", id as string);
    payload.append("description", description);
    if (image) payload.append("image", image);

    try {
      const res = await fetch("http://localhost:8081/api/maps/reviews", {
        method: "POST",
        body: payload,
      });
// need to handle the multi page rendering of reviews
      const data = await res.json();
      if (res.ok) {
        alert("Review submitted successfully!");
      } else {
        alert("Error: " + data.error);
      }
    } catch (err) {
      console.error("Submit error:", err);
      alert("Submission failed. Try again.");
    }
  };


  return (
      <div className="a">
        <div className="p-0 w-full max-w-md mx-auto my-0 pb-0">
          {/* its better admin to choose the banner photo by the admin, else we can randomly use first photo .... */}
          <Image
              src="https://www.iitk.ac.in/hall11/img/portfolio/02-large.jpg"
              alt="image"
              width={500}
              height={300}
              className="r"
          />
        </div>

        <Card className="w-full max-w-md mx-auto bg-white ">
          <div className="absolute top-2 left-0 right-0 mx-auto w-fit flex justify-between">
            <X
                className="w-7 h-7 m-1 mx-10 p-1 rounded-full bg-cyan-50 text-black cursor-pointer hover:bg-cyan-200 hover:text-red-500"
                onClick={() => router.back()}
            />
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button className="w-7 h-7 m-1 mx-10 p-1 rounded-full bg-cyan-50 text-black cursor-pointer hover:bg-cyan-200 hover:text-red-500">
                  <Share2 />
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Social Share</AlertDialogTitle>
                  <div className="flex justify-center gap-4 mt-2">
                    <FacebookShareButton url={typeof window !== "undefined" ? window.location.href : ""}>
                      <FacebookIcon size={40} round />
                    </FacebookShareButton>
                    <RedditShareButton url={typeof window !== "undefined" ? window.location.href : ""}>
                      <RedditIcon size={40} round />
                    </RedditShareButton>
                    <WhatsappShareButton url={typeof window !== "undefined" ? window.location.href : ""}>
                      <WhatsappIcon size={40} round />
                    </WhatsappShareButton>
                    <LinkedinShareButton url={typeof window !== "undefined" ? window.location.href : ""}>
                      <LinkedinIcon size={40} round />
                    </LinkedinShareButton>
                  </div>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Close</AlertDialogCancel>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Heart className="w-7 h-7 m-1 mx-10 p-1 rounded-full bg-cyan-50 text-black cursor-pointer hover:bg-cyan-200 hover:text-red-500" />
          </div>

          <CardHeader>
            <div className="flex content-center ">
              <p className="text-2xl">
                <b className="text-black">{location.name}</b>
              </p>
            </div>

            <div className="flex">
              <p className="mr-1 text-black">{rating}/5</p>
              <div className="flex text-[#FFD700]">
                {[...Array(fullStars)].map((_, i) => (
                    <Star key={`full-${i}`} fill="#FFD700" stroke="#FFD700" />
                ))}
                {hasHalfStar && (
                    <StarHalf key="half" fill="#FFD700" stroke="#FFD700" />
                )}
              </div>{" "}
              ({location.review_count})
            </div>

            <div className="flex justify-between my-4">
              <div>
                <p className="text-gray-600">{location.tag}</p>
                <p className="text-gray-600">{location.timings}</p>
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <CircleUserRound className="font-semibold mt-2 cursor-pointer text-black" />
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <div className="space-y-2">
                    <h4 className="leading-none font-medium">Phone Number</h4>
                    <p className="text-muted-foreground text-sm">
                      {location.contact}
                    </p>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <CardDescription>
              <p>{location.description}</p>
            </CardDescription>
          </CardHeader>

          <CardContent>
            <ScrollArea className="max-w-5xl mx-auto border whitespace-nowrap rounded-md">
              <ScrollBar orientation="horizontal" />
              <div className="flex w-max space-x-4 p-4">
                {(location.images || []).map((img: string, i: number) => (
                    <Drawer>
                      <DrawerTrigger asChild>
                        <div className="relative cursor-pointer w-[300px] h-[200px]">
                          <Image src={`http://localhost:8081${img}`}
                                 alt={`Image ${i}`} fill className="rounded-md object-cover" />
                          <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition rounded-md" />
                        </div>
                      </DrawerTrigger>
                      <DrawerContent className="h-screen p-0 overflow-hidden">
                        <DrawerHeader>
                          <DrawerClose asChild className="text-black bg-white hover:bg-white/50 p-2 rounded-full m-auto">
                            <Button variant="outline">Close</Button>
                          </DrawerClose>
                          <DrawerTitle>
                            <Image src={`http://localhost:8081${img}`}
                                   alt={`Image ${i}`} fill className="object-contain bg-black m-auto" />
                          </DrawerTitle>
                          <DrawerDescription className="text-center text-white">
                            This is a photo description.
                          </DrawerDescription>
                        </DrawerHeader>
                        <DrawerFooter />
                      </DrawerContent>
                    </Drawer>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
          <Drawer>
            <DrawerTrigger asChild>
              <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg w-32 mx-auto">
                Add Review
              </button>
            </DrawerTrigger>
            <p className="mx-5">
              <b className="text-black">Review summary</b>
            </p>

            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>Help Others by giving review</DrawerTitle>

                <form className="space-y-4 mt-4">
                  <div>


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
                        <AlertDialogAction onClick={handleReviewSubmit}>Done</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </form>

                <DrawerDescription className="mt-4 text-sm text-gray-500">

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
            {reviews?.length > 0 ? (
                <div className="space-y-4">
                  {reviews.map((review, index) => (
                      <ReviewCard
                          key={index}
                          author={review.contributedBy}
                          rating={review.rating}
                          review_body={review.description}
                          time={review.created_at}
                          img={review.image_url ? `http://localhost:8081${review.image_url}` : null}
                      />
                  ))}
                </div>
            ) : (
                <p className="mt-4 text-gray-500 italic">No reviews yet.</p>
            )}
          </CardFooter>
        </Card>
      </div>
  );
}