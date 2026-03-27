// "use client";

// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import {
//   LocationCard,
//   LocationCardProps,
// } from "@/components/profile/LocationCard";
// import ReviewCard from "@/app/components/user/ReviewCard";
// import ComingSoon from "../ui/ComingSoon";

// // Review shape used by ReviewCard (match property names exactly)
// type Review = {
//   author: string;
//   rating: number;
//   review_body: string;
//   time: string;
//   imgs: { ImageID: string }[];
// };

// interface ContributionsCardProps {
//   locations: [];
//   reviews: Review[];
//   notices: any[];
// }

// export function ContributionsCard({
//   locations = [],
//   reviews = [],
//   notices = [],
// }: ContributionsCardProps) {
//   return (
//     <Card>
//       <CardHeader>
//         <CardTitle>
//           My Contributions
//           <ComingSoon />
//         </CardTitle>
//       </CardHeader>
//       <CardContent>
//         {locations.length + reviews.length + notices.length > 0 ? (
//           <Tabs defaultValue="locations">
//             <TabsList className="grid w-full auto-cols-fr grid-flow-col">
//               {locations.length ? (
//                 <TabsTrigger value="locations">Locations</TabsTrigger>
//               ) : (
//                 <></>
//               )}
//               {reviews.length ? (
//                 <TabsTrigger value="reviews">Reviews</TabsTrigger>
//               ) : (
//                 <></>
//               )}
//               {notices.length ? (
//                 <TabsTrigger value="notices">Notices</TabsTrigger>
//               ) : (
//                 <></>
//               )}
//             </TabsList>
//             {locations.length ? (
//               <TabsContent value="locations" className="mt-4">
//                 <div className="space-y-4">
//                   {locations.map((loc: LocationCardProps["location"]) => (
//                     <LocationCard key={loc.locationId} location={loc} />
//                   ))}
//                 </div>
//               </TabsContent>
//             ) : (
//               <></>
//             )}
//             {reviews.length ? (
//               <TabsContent value="reviews" className="mt-4">
//                 { <div className="space-y-4">
//                   {reviews.map((rev, idx) => (
//                     <ReviewCard
//                       key={idx}
//                       author={rev.author}
//                       rating={rev.rating}
//                       review_body={rev.review_body}
//                       time={rev.time}
//                       imgs={rev.imgs}
//                     />
//                   ))}
//                 </div> }
//               </TabsContent>
//             ) : (
//               <></>
//             )}
//             {notices.length ? (
//               <TabsContent value="notices" className="mt-4">
//                 {/* <div className="space-y-4">
//                   {notices.map((loc) => (
//                     <LocationCard key={loc.LocationId} location={loc} />
//                   ))}
//                 </div> */}
//               </TabsContent>
//             ) : (
//               <></>
//             )}
//           </Tabs>
//         ) : (
//           <p className="text-sm text-center text-muted-foreground py-8">
//             No contributions yet, to the Compass Community.
//           </p>
//         )}
//       </CardContent>
//     </Card>
//   );
// }
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  LocationCard,
  LocationCardProps,
} from "@/components/profile/LocationCard";
import ReviewCard from "@/app/components/user/ReviewCard";
import ComingSoon from "../ui/ComingSoon";

/* ---------------- Types ---------------- */

export type Review = {
  author: string;
  rating: number;
  review_body: string;
  time: string;
  imgs: { ImageID: string }[];
};

interface ContributionsCardProps {
  locations: LocationCardProps["location"][];
  reviews: Review[];
  notices: any[];
}

/* ---------------- Component ---------------- */

export function ContributionsCard({
  locations = [],
  reviews = [],
  notices = [],
}: ContributionsCardProps) {
  const hasContent = locations.length + reviews.length + notices.length > 0;

  const defaultTab =
    locations.length > 0
      ? "locations"
      : reviews.length > 0
      ? "reviews"
      : "notices";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          My Contributions
          <ComingSoon />
        </CardTitle>
      </CardHeader>

      <CardContent>
        {hasContent ? (
          <Tabs defaultValue={defaultTab}>
            {/* Tabs Header */}
            <TabsList>
              <TabsTrigger value="locations">Locations</TabsTrigger>
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
              <TabsTrigger value="notices">Notices</TabsTrigger>
            </TabsList>

            {/* Locations */}
            <TabsContent value="locations" className="mt-4 space-y-4">
              {locations.length > 0 ? (
                locations.map((loc) => (
                  <LocationCard key={loc.locationId} location={loc} />
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No locations yet.</p>
              )}
            </TabsContent>

            {/* Reviews */}
            <TabsContent value="reviews" className="mt-4 space-y-4">
              {reviews.length > 0 ? (
                reviews.map((rev: any) => (
                  <ReviewCard
                    key={rev.reviewId || rev.ReviewId || `${rev.author || 'anon'}-${rev.time || rev.createdAt || ''}`}
                    {...rev}
                  />
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No reviews yet.</p>
              )}
            </TabsContent>

            {/* Notices */}
            <TabsContent value="notices" className="mt-4 space-y-4">
              {notices.length > 0 ? (
                notices.map((notice, idx) => (
                  <div
                    key={idx}
                    className="rounded-md border p-3 text-sm text-muted-foreground"
                  >
                    {notice.message || "Notice content"}
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No notices yet.</p>
              )}
            </TabsContent>
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
