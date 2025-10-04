"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LocationCard } from "@/components/profile/LocationCard";

interface ContributionsCardProps {
  locations?: any[];
  reviews?: any[];
  notices?: any[];
}

export function ContributionsCard({
  locations = [],
  reviews = [],
  notices = [],
}: ContributionsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>My Contributions</CardTitle>
      </CardHeader>
      <CardContent>
        {locations.length + reviews.length + notices.length > 0 ? (
          <Tabs defaultValue="locations">
            <TabsList className="grid w-full grid-cols-3">
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
              {notices.length ? (
                <TabsTrigger value="notices">Notices</TabsTrigger>
              ) : (
                <></>
              )}
            </TabsList>
            {locations.length ? (
              <TabsContent value="locations" className="mt-4">
                <div className="space-y-4">
                  {locations.map((loc) => (
                    <LocationCard key={loc.locationId} location={loc} />
                  ))}
                </div>
              </TabsContent>
            ) : (
              <></>
            )}
            {reviews.length ? (
              <TabsContent value="locations" className="mt-4">
                {/* <div className="space-y-4">
                  {reviews.map((rev) => (
                    <ReviewCard  />
                  ))}
                </div> */}
              </TabsContent>
            ) : (
              <></>
            )}
            {notices.length ? (
              <TabsContent value="locations" className="mt-4">
                {/* <div className="space-y-4">
                  {notices.map((loc) => (
                    <LocationCard key={loc.LocationId} location={loc} />
                  ))}
                </div> */}
              </TabsContent>
            ) : (
              <></>
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
