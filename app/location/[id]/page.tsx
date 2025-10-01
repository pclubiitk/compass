"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { X, Share2, Heart, Star, StarHalf } from "lucide-react";
import Image from "next/image";
import {
  FacebookShareButton,
  FacebookIcon,
  RedditShareButton,
  RedditIcon,
  WhatsappShareButton,
  WhatsappIcon,
  LinkedinShareButton,
  LinkedinIcon,
} from "next-share";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2, XCircle } from "lucide-react";

import ReviewCard from "@/app/components/user/ReviewCard";
import StarRating from "@/app/components/user/Rate";

export default function LocationPage() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const page = searchParams.get("page") || "1";
  const router = useRouter();

  const [location, setLocation] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [ratting, setRatting] = useState<number>(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [mode, setMode] = useState<"light" | "dark">("light");

  useEffect(() => {
    if (!id) return;

    const fetchLocation = async () => {
      try {
        const res = await fetch(
          `http://localhost:8081/api/maps/location/${id}`
        );
        const data = await res.json();
        setLocation(data.location);
      } catch (err) {
        console.error("Failed to fetch location:", err);
      }
    };

    const fetchReviews = async () => {
      try {
        const res = await fetch(
          `http://localhost:8081/api/maps/reviews/${id}/${page}`
        );
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
    return (
      <div className="p-4 max-w-md mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="flex justify-between items-center">
            <div className="h-6 bg-gray-300 rounded w-1/3"></div>
            <div className="flex space-x-2">
              <div className="h-6 w-6 bg-gray-300 rounded-full"></div>
              <div className="h-6 w-6 bg-gray-300 rounded-full"></div>
            </div>
          </div>

          <div className="h-48 bg-gray-300 rounded-xl"></div>

          <div className="flex items-center space-x-2">
            <div className="h-4 w-10 bg-gray-300 rounded"></div>
            <div className="h-4 w-24 bg-gray-300 rounded"></div>
          </div>

          <div className="space-y-2">
            <div className="h-4 bg-gray-300 rounded w-full"></div>
            <div className="h-4 bg-gray-300 rounded w-5/6"></div>
            <div className="h-4 bg-gray-300 rounded w-2/3"></div>
          </div>

          <div className="flex space-x-2">
            <div className="h-24 w-32 bg-gray-300 rounded-lg"></div>
            <div className="h-24 w-32 bg-gray-300 rounded-lg"></div>
          </div>

          <div className="flex justify-between items-center mt-4">
            <div className="h-5 w-20 bg-gray-300 rounded"></div>
            <div className="h-8 w-24 bg-gray-300 rounded-lg"></div>
          </div>

          <div className="p-3 border rounded-xl bg-gray-100 space-y-2">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-gray-300 rounded-full"></div>
              <div className="h-4 w-16 bg-gray-300 rounded"></div>
            </div>
            <div className="h-4 bg-gray-300 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  const rating = location.avg_rating || 0;
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;

  const handleReviewSubmit = async () => {
    const form = document.querySelector("form")!;

    const rating = ratting.toString();
    const description = (form.querySelector("textarea") as HTMLTextAreaElement)
      ?.value;
    const image = (form.querySelector('input[type="file"]') as HTMLInputElement)
      ?.files?.[0];

    if (!rating || !description) {
      setErrorMessage("Please provide both rating and description.");
      setShowSuccess(false);

      setTimeout(() => setErrorMessage(""), 2000);
      return;
    }

    const payload = new FormData();
    payload.append("rating", rating);
    payload.append("location_id", id as string);
    payload.append("description", description);
    if (image) payload.append("image", image);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_MAPS_URL}/api/maps/review`,
        { method: "POST", body: payload, credentials: "include" }
      );
      const data = await res.json();

      if (res.ok) {
        setShowSuccess(true);
        setDrawerOpen(false);
        setTimeout(() => setShowSuccess(false), 1500);
        setErrorMessage("");
      } else {
        setErrorMessage(data.error);
        setShowSuccess(false);

        setTimeout(() => setErrorMessage(""), 2000);
      }
    } catch (err) {
      setErrorMessage("Submission failed. Try again.");
      setShowSuccess(false);
      setDrawerOpen(false);
      setTimeout(() => setErrorMessage(""), 2000);
    }
  };

  // const imagess=["https://images.unsplash.com/photo-1506744038136-46273834b3fb","https://images.unsplash.com/photo-1506744038136-46273834b3fb"]
  const imagess = location.biopics;
  return (
    <div
      className={`min-h-screen w-[100vw] flex justify-center ${
        mode === "dark" ? "bg-gray-600" : "bg-gray-200"
      }`}
    >
      <div
        className={`w-full  max-w-md mx-auto flex flex-col  ${
          mode === "dark" ? "bg-black" : "bg-gray-200"
        } `}
      >
        <div className="fixed top-4 right-4 space-y-2 transition-all">
          {showSuccess && (
            <Alert
              variant="default"
              className="bg-green-50 border-green-400 text-green-800 shadow-lg rounded-lg animate-fade-in"
            >
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <AlertTitle className="font-semibold">Success!</AlertTitle>
              <AlertDescription>
                Your review has been successfully submitted.
              </AlertDescription>
            </Alert>
          )}

          {errorMessage && (
            <Alert
              variant="destructive"
              className="bg-red-50 border-red-400 text-red-800 shadow-lg rounded-lg animate-fade-in"
            >
              <XCircle className="h-5 w-5 text-red-600" />
              <AlertTitle className="font-semibold">Error</AlertTitle>
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <h1
              className={`text-2xl font-bold ${
                mode === "dark" ? "text-white" : "text-gray-900"
              }`}
            >
              {location.name}
            </h1>
            <div className="flex items-center gap-2">
              <button
                onClick={() => router.back()}
                className="p-2 rounded-full bg-gray-100 hover:bg-gray-200"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button className="p-2 rounded-full bg-gray-100 hover:bg-gray-200">
                    <Share2 className="w-5 h-5 text-gray-600" />
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Social Share</AlertDialogTitle>
                    <div className="flex justify-center gap-4 mt-2">
                      <FacebookShareButton
                        url={
                          typeof window !== "undefined"
                            ? window.location.href
                            : ""
                        }
                      >
                        <FacebookIcon size={40} round />
                      </FacebookShareButton>
                      <RedditShareButton
                        url={
                          typeof window !== "undefined"
                            ? window.location.href
                            : ""
                        }
                      >
                        <RedditIcon size={40} round />
                      </RedditShareButton>
                      <WhatsappShareButton
                        url={
                          typeof window !== "undefined"
                            ? window.location.href
                            : ""
                        }
                      >
                        <WhatsappIcon size={40} round />
                      </WhatsappShareButton>
                      <LinkedinShareButton
                        url={
                          typeof window !== "undefined"
                            ? window.location.href
                            : ""
                        }
                      >
                        <LinkedinIcon size={40} round />
                      </LinkedinShareButton>
                    </div>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Close</AlertDialogCancel>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <button className="p-2 rounded-full bg-gray-100 hover:bg-gray-200">
                <Heart className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
          {/* /here */}
          <div className="w-full relative h-64">
            <Image
              //just replace link with location...
              src={location.coverpic}
              alt="back"
              fill
              className=" object-cover"
            />
          </div>

          <div className="px-4 py-3">
            <div className="flex items-center gap-3">
              {/* Rating Value */}
              <span
                className={`text-lg font-semibold ${
                  mode === "dark" ? "text-white" : "text-gray-900"
                }`}
              >
                {rating.toFixed(1)}
              </span>

              {/* Stars */}
              <div className="flex items-center">
                {[...Array(fullStars)].map((_, i) => (
                  <Star
                    key={i}
                    className="w-5 h-5 text-yellow-400 fill-yellow-400"
                  />
                ))}
                {hasHalfStar && (
                  <StarHalf className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                )}
                {[...Array(5 - fullStars - (hasHalfStar ? 1 : 0))].map(
                  (_, i) => (
                    <Star
                      key={`empty-${i}`}
                      className="w-5 h-5 text-gray-300"
                    />
                  )
                )}
              </div>
              <span className="text-sm text-gray-500">
                ({location.ReviewCount} reviews)
              </span>
            </div>

            <div className="flex justify-between mt-2 text-sm text-gray-600">
              <div className="flex items-center gap-4 text-gray-700">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-1 text-sm rounded-full font-medium ${
                      mode === "dark"
                        ? "bg-gray-300 text-gray-200"
                        : "bg-gray-300 text-gray-700"
                    }`}
                  >
                    {location.Tag}
                  </span>

                  <span
                    className={`px-2 py-1 text-sm rounded-full font-medium ${
                      mode === "dark"
                        ? "bg-gray-800 text-gray-200"
                        : "bg-gray-300 text-gray-700"
                    }`}
                  >
                    {location.Time}
                  </span>
                </div>
              </div>

              <Popover>
                <PopoverTrigger asChild>
                  <CircleUserRound className="cursor-pointer text-gray-700" />
                </PopoverTrigger>
                <PopoverContent className="w-64">
                  <h4 className="font-semibold mb-1">{location.Contact}</h4>
                  <p className="text-gray-500">{location.contact}</p>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <CardDescription>
            <div className="px-4 py-3 border-t">
              <div
                className={`{
    ${mode === "dark" ? "bg-gray-800" : "bg-gray-200"}  rounded-lg  p-3 border`}
              >
                <p
                  className={`${
                    mode == "dark" ? "text-white" : "text-gray-700"
                  } leading-relaxed`}
                >
                  {location.description}
                </p>
              </div>
            </div>
            <div className="px-4 py-3 w-full">
              <CardContent className="p-0">
                <ScrollArea className="w-full overflow-x-auto">
                  <div className="flex flex-nowrap space-x-4 p-4 w-max">
                    {imagess?.length > 0 ? (
                      imagess.map((img: string, i: number) => (
                        <Drawer key={i}>
                          <DrawerTrigger asChild>
                            <div className="relative cursor-pointer w-[300px] h-[200px] flex-shrink-0">
                              <Image
                                src={img}
                                alt={`Image ${i}`}
                                fill
                                className="rounded-md object-cover"
                              />
                              <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition rounded-md" />
                            </div>
                          </DrawerTrigger>
                          <DrawerContent className="h-screen p-0 overflow-hidden">
                            <DrawerHeader>
                              <DrawerClose
                                asChild
                                className="text-black bg-white hover:bg-white/50 p-2 rounded-full m-auto"
                              >
                                <Button variant="outline">Close</Button>
                              </DrawerClose>
                              <DrawerTitle>
                                <Image
                                  src={img}
                                  alt={`Image ${i}`}
                                  fill
                                  className="object-contain bg-black m-auto"
                                />
                              </DrawerTitle>
                              <DrawerDescription className="text-center text-white">
                                This is a photo description.
                              </DrawerDescription>
                            </DrawerHeader>
                            <DrawerFooter />
                          </DrawerContent>
                        </Drawer>
                      ))
                    ) : (
                      <div className="w-full text-center py-6 text-gray-500 italic">
                        📷 No photos yet. Be the first to upload!
                      </div>
                    )}
                  </div>
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
              </CardContent>
            </div>
          </CardDescription>
        </div>

        <div className="px-4 w-full py-3 border-t">
          <div className="flex justify-between items-center mb-3">
            <h2
              className={`text-lg font-semibold ${
                mode === "dark" ? "text-white" : "text-gray-900"
              } `}
            >
              Reviews
            </h2>
            <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
              <DrawerTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  Add Review
                </Button>
              </DrawerTrigger>

              <DrawerContent
                className={`${mode == "dark" ? "bg-black" : "bg-white"}`}
              >
                <DrawerHeader>
                  <DrawerTitle
                    className={` ${
                      mode == "dark" ? "text-white" : "text-black"
                    }`}
                  >
                    Share your experience to help others
                  </DrawerTitle>

                  <form className="space-y-4 mt-4">
                    <div></div>

                    <StarRating
                      initialRating={3}
                      onChange={(value) => setRatting(value)}
                    />

                    <div>
                      <label
                        className={`block text-sm font-medium ${
                          mode == "dark" ? "text-white" : "text-gray-700"
                        } mb-1`}
                      >
                        Your Review
                      </label>
                      <textarea
                        rows={4}
                        placeholder="Write your experience..."
                        className={`w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${
                          mode == "dark" ? "text-white" : "text-gray-700"
                        } `}
                      />
                    </div>

                    <div>
                      <label
                        className={`block text-sm font-medium  ${
                          mode == "dark" ? "text-white" : "text-gray-700"
                        } mb-1`}
                      >
                        Upload Image (optional)
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        className={`block w-full text-sm  ${
                          mode == "dark" ? "text-white" : "text-gray-700"
                        }`}
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
                          <AlertDialogAction onClick={handleReviewSubmit}>
                            Done
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </form>

                  <DrawerDescription className="mt-4 text-sm text-gray-500"></DrawerDescription>
                </DrawerHeader>
                <DrawerFooter>
                  <DrawerClose asChild>
                    <Button variant="outline">Cancel</Button>
                  </DrawerClose>
                </DrawerFooter>
              </DrawerContent>
            </Drawer>
          </div>
          <div className="width-full">
            {reviews?.length > 0 ? (
              <div className="space-y-4">
                {reviews.map((review, index) => (
                  <ReviewCard
                    key={index}
                    author={review.User.name}
                    rating={review.rating}
                    review_body={review.description}
                    time={review.CreatedAt}
                    mode={mode}
                    // img={review.image_url ? `http://localhost:8081${review.image_url}` : null}
                    img={review.image_url ? review.image_url : null}
                  />
                ))}
              </div>
            ) : (
              <div className="mt-4 text-center text-gray-500 italic">
                📝 No reviews yet.
                <p className="text-sm ">
                  Be the first to share your experience!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
