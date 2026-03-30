"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LocationCard,
  LocationCardProps,
} from "@/components/profile/LocationCard";
import ReviewCard from "@/app/components/user/Contribution_ReviewCard";
import ComingSoon from "../ui/ComingSoon";
import { useGContext } from "@/components/ContextProvider";

// Review shape used by ReviewCard (match property names exactly)
type Review = {
  author: string;
  rating: number;
  review_body: string;
  time: string;
  imgs: { ImageID: string }[];
};

interface ContributionsCardProps {
  locations: [];
  reviews: Review[];
  notices: any[];
}

export function ContributionsCard({
  locations = [],
  reviews = [],
  notices = [],
}: ContributionsCardProps) {

  const { isAdmin } = useGContext();
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          My Contributions
          <ComingSoon />
        </CardTitle>
      </CardHeader>
      <CardContent>
        {locations.length + reviews.length + notices.length > 0 ? (
          <Tabs defaultValue="locations">
            <TabsList className="grid w-full auto-cols-fr grid-flow-col">
              {locations.length ? (
                <TabsTrigger value="locations">Locations</TabsTrigger>
              ) : (
                <></>
              )}
              {reviews.length ? (
                <TabsTrigger value="reviews">Reviews</TabsTrigger>
              ) : (
                <></>
              )}

              {isAdmin && notices.length ? (
                <TabsTrigger value="notices">Notices</TabsTrigger>
              ): (
                <></> )}
               

            </TabsList>
            {locations.length ? (
              <TabsContent value="locations" className="mt-4">
                <div className="space-y-4">
                  {locations.map((loc: LocationCardProps["location"]) => (
                    <LocationCard key={loc.locationId} location={loc} />
                  ))}
                </div>
              </TabsContent>
            ) : (
              <></>
            )}
            {reviews.length ? (
              <TabsContent value="reviews" className="mt-4 space-y-4">
                {reviews.length > 0 ? (
                  reviews.map((rev: any) => (
                    <>
                    <ReviewCard
    key={rev.ReviewId}
    rating={rev.rating}
    review_body={rev.description}
    time={rev.CreatedAt}
    imgs={rev.images} 
    author={rev.User?.name || "Unknown Location"}
  
                    /></>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No reviews yet.</p>
                )}
              </TabsContent>
            ) : (
              <></>
            )}


            {isAdmin && (
              <TabsContent value="notices" className="mt-4">
                {notices.length > 0 ? (
                  <div className="space-y-4">
                    {notices.map((loc) => (
                      <LocationCard key={loc.LocationId} location={loc} />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No notices yet.
                  </p>
                )}
              </TabsContent>
            )}
          </Tabs>
        ) : (
          <p className="text-sm text-center text-muted-foreground py-8">
            No contributions yet, to the Compass Community.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
