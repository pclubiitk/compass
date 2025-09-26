"use client";

import Image from "next/image";
import * as React from "react";
import { useEffect, useState } from "react";

import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Edit, LogOut, Sun, PenLine, MapPinX } from "lucide-react";
import { Button } from "@/components/ui/button";
import ReviewsCard from "./components/ReviewsCard";
import LocationCard from "./components/LocationCard";

export default function Home() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);



  // TODO:
  // 1. Design it using shadcn components
  // 2. Default image handling
  // 3. Error handling
  // 4. Removal of extra files, and etc
  // 5. Proper integration of the pages, nav bar
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_AUTH_URL}/profile`, {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        });
        const data = await res.json();
        if (res.ok) {
          console.log("Done");
        } else {
          console.log("I am leaving");
        }

        setUser(data.profile);
        setLocations(data.profile.ContributedLocations || []);
        setReviews(data.profile.ContributedReview || []);
      } catch (err) {
        console.error("Failed to fetch profile:", err);
      }
    };

    fetchProfile();
  }, []);

  useEffect(() => {
    console.log("hello i am here");
  }, []);

  return (
    <div className="flex flex-col items-center">
      {/* Header */}
      <div className="w-full h-30 bg-gray-500 rounded-b-lg"></div>

      <main className="flex flex-col gap-6 items-center w-full max-w-md p-4">
        <Card className="-mt-25 w-11/12 flex gap-4 p-4 shadow-md rounded-xl flex-col">
          <div className="flex flex-row">
            <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center m-3">
              <Image
                // TODO: Add a default profile pic in assets
                src={
                  user?.profilepic
                    ? `${process.env.ASSET_URL}/assets/${user.profilepic}.webp`
                    : "/pclub.png"
                }
                alt="Profile Picture"
                width={80}
                height={80}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="gap-0 flex flex-col pt-6 mx-2">
              <h2 className="font-semibold text-lg w-40 my-0">{user?.name}</h2>
              <p className="text-gray-500 text-sm">{user?.email}</p>
            </div>
          </div>
          <Separator />
          <div className="flex flex-row items-center justify-center p-2">
            <Button variant="ghost" className="rounded-full h-9 w-9 mx-4">
              <Edit className="!h-6 !w-6" />
            </Button>
            <Button variant="ghost" className="rounded-full h-9 w-9 mx-4">
              <Sun className="!h-6 !w-6" />
            </Button>
            <Button variant="ghost" className="rounded-full h-9 w-9 mx-4">
              <LogOut className="!h-6 !w-6" />
            </Button>
          </div>
        </Card>

        {/* Locations */}
        <div className="w-full">
          <h2 className="text-lg font-semibold mb-3">Locations added by you</h2>

          <div className="width-full">
            {locations?.length > 0 ? (
              <div className="space-y-4">
                {locations.map((location, index) => (
                  <LocationCard
                    key={index}
                    locationID={location.LocationId}
                    img={`${process.env.NEXT_PUBLIC_ASSET_URL}/assets/${location.coverpic}.webp`}
                    name={location.name}
                    rating={location.rating}
                    description={location.description}
                  />
                ))}
              </div>
            ) : (
              <div className="mt-4 text-center flex-row flex gap-3 justify-center">
                <MapPinX color="#666" />
                <p className="text-gray-500 italic">
                  You have not added any locations yet.
                </p>
              </div>
            )}
          </div>
        </div>
        <Separator />

        {/* Reviews Section */}
        <div className="w-full px-2">
          <h2 className="text-lg font-semibold mb-3">Your Reviews</h2>

          <div className="width-full">
            {reviews?.length > 0 ? (
              <div className="space-y-4">
                {reviews.map((review, index) => (
                  <ReviewsCard
                    key={index}
                    locationID={review.locationId}
                    rating={review.rating}
                    review_body={review.description}
                  />
                ))}
              </div>
            ) : (
              <div className="mt-4 text-center flex-row flex gap-3 justify-center">
                <PenLine color="#666" />
                <p className="text-gray-500 italic">Write your first review.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
