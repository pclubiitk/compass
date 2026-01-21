"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import {
  X,
  Share2,
  Heart,
  Star,
  StarHalf,
  CircleUserRound,
  MapPin,
  Clock,
  Phone,
} from "lucide-react";
import { motion } from "framer-motion";
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
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
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
import { Badge } from "@/components/ui/badge";

import ReviewCard from "@/app/components/user/ReviewCard";
import { LocationSkeleton } from "@/app/components/location/LocationSkeleton";
import { PhotoGallery } from "@/app/components/location/PhotoGallery";
import { ReviewDrawer } from "@/app/components/location/ReviewDrawer";

import { toast } from "sonner";

// Types
interface LocationData {
  id: string;
  name: string;
  description: string;
  avg_rating: number;
  ReviewCount: number;
  Tag: string;
  Time: string;
  Contact: string; // Name of contact person?
  contact: string; // Phone/Email?
  coverpic: string;
  biopics: string[];
  location_type?: string;
}

interface ReviewData {
  id: string;
  rating: number;
  description: string;
  CreatedAt: string;
  Images?: {
    ImageID: string;
  }[];
  User: {
    name: string;
    profile_pic?: string;
  };
}

export default function LocationPage() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const page = searchParams.get("page") || "1";
  const router = useRouter();

  const [location, setLocation] = useState<LocationData | null>(null);
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLocation = async () => {
    if (!id) return;
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_MAPS_URL}/api/maps/location/${id}`
      );

      if (!res.ok) {
        throw new Error("Failed to fetch location");
      }

      const data = await res.json();

      if (!data.location) {
        throw new Error("Location not found");
      }

      setLocation(data.location);
    } catch (err) {
      console.error("Failed to fetch location:", err);
      toast.error("Wrong location id");
      router.push("/");
    }
  };

  const fetchReviews = async () => {
    if (!id) return;
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_MAPS_URL}/api/maps/reviews/${id}/${page}`
      );
      const data = await res.json();
      setReviews(data.reviews || []);
    } catch (err) {
      console.error("Failed to fetch reviews:", err);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchLocation(), fetchReviews()]);
      setLoading(false);
    };
    loadData();
  }, [id, page]);

  if (loading || !location) {
    return <LocationSkeleton />;
  }

  const rating = location.avg_rating || 0;
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;

  return (
    <div className="min-h-screen w-full flex justify-center bg-gray-50 dark:bg-zinc-950 transition-colors duration-300 pb-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-7xl mx-auto p-4 lg:p-8 text-foreground"
      >
        <div className="grid grid-cols-1 lg:grid-cols-5 lg:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            <div className="rounded-xl shadow-sm border bg-white dark:bg-zinc-900 dark:border-zinc-800 overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b dark:border-zinc-800">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {location.name}
                </h1>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full"
                    onClick={() => router.back()}
                  >
                    <X className="w-5 h-5" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full"
                      >
                        <Share2 className="w-5 h-5" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Share this location</AlertDialogTitle>
                        <div className="flex justify-center gap-4 mt-4 pt-2">
                          <FacebookShareButton
                            url={
                              typeof window !== "undefined"
                                ? window.location.href
                                : ""
                            }
                          >
                            <FacebookIcon size={48} round />
                          </FacebookShareButton>
                          <RedditShareButton
                            url={
                              typeof window !== "undefined"
                                ? window.location.href
                                : ""
                            }
                          >
                            <RedditIcon size={48} round />
                          </RedditShareButton>
                          <WhatsappShareButton
                            url={
                              typeof window !== "undefined"
                                ? window.location.href
                                : ""
                            }
                          >
                            <WhatsappIcon size={48} round />
                          </WhatsappShareButton>
                          <LinkedinShareButton
                            url={
                              typeof window !== "undefined"
                                ? window.location.href
                                : ""
                            }
                          >
                            <LinkedinIcon size={48} round />
                          </LinkedinShareButton>
                        </div>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Close</AlertDialogCancel>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <Heart className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              {/* Cover Image */}
              <div className="w-full relative h-64 md:h-80 lg:h-[400px]">
                <Image
                  src={location.coverpic || "/404.png"}
                  alt={location.name}
                  fill
                  className="object-cover"
                  priority
                />
              </div>

              {/* Info Bar */}
              <div className="px-6 py-4 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">
                      {rating.toFixed(1)}
                    </span>
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => {
                        if (i < fullStars) {
                          return (
                            <Star
                              key={i}
                              className="w-5 h-5 text-yellow-400 fill-yellow-400"
                            />
                          );
                        }
                        if (i === fullStars && hasHalfStar) {
                          return (
                            <StarHalf
                              key={i}
                              className="w-5 h-5 text-yellow-400 fill-yellow-400"
                            />
                          );
                        }
                        return (
                          <Star
                            key={i}
                            className="w-5 h-5 text-gray-300 dark:text-gray-600"
                          />
                        );
                      })}
                    </div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      ({location.ReviewCount} reviews)
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="px-3 py-1">
                      {location.Tag}
                    </Badge>
                    <Badge
                      variant="outline"
                      className="px-3 py-1 flex items-center gap-1"
                    >
                      <Clock className="w-3 h-3" />
                      {location.Time}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t dark:border-zinc-800">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span>Campus Location</span>
                  </div>

                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <CircleUserRound className="w-4 h-4 mr-2" />
                        Contact Info
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64">
                      <h4 className="font-semibold mb-1">{location.Contact}</h4>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="w-3 h-3" />
                        {location.contact}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Description */}
              <div className="px-6 py-4 border-t dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/50">
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {location.description}
                </p>
              </div>

              {/* Photos */}
              <div className="border-t dark:border-zinc-800">
                <PhotoGallery images={location.biopics} />
              </div>
            </div>
          </div>

          {/* Sidebar (Reviews) */}
          <div className="lg:col-span-2 mt-6 lg:mt-0">
            <div className="rounded-xl shadow-sm border bg-white dark:bg-zinc-900 dark:border-zinc-800 p-4 md:p-6 sticky top-4">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Reviews
                </h2>
                <ReviewDrawer
                  locationId={id as string}
                  onReviewAdded={fetchReviews}
                >
                  <Button>Add Review</Button>
                </ReviewDrawer>
              </div>

              <div className="space-y-4 lg:max-h-[calc(100vh-200px)] lg:overflow-y-auto pr-2 custom-scrollbar">
                {reviews.length > 0 ? (
                  reviews.map((review) => (
                    <ReviewCard
                      key={review.id}
                      author={review.User?.name || "Anonymous"}
                      rating={review.rating}
                      review_body={review.description}
                      time={review.CreatedAt}
                      imgs={review.Images || []}
                    />
                  ))
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <div className="bg-gray-100 dark:bg-zinc-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Star className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="font-medium">No reviews yet</p>
                    <p className="text-sm mt-1">
                      Be the first to share your experience!
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
