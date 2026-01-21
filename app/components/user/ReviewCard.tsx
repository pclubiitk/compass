import { Card, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import RatedStars from "./RatedStars";
import { format } from "timeago.js";

type ReviewProps = {
  author: string;
  rating: number;
  review_body: string;
  //once confirm why there was a never
  time: string;
  imgs: { ImageID: string }[];
};

export default function ReviewCard({
  author,
  rating,
  review_body,
  time,
  imgs,
}: Omit<ReviewProps, "mode">) {
  return (
    <Card className="mx-3 my-3 py-0 gap-0 bg-white dark:bg-black text-black dark:text-white">
      <div className="mx-4 py-3">
        <CardTitle className="text-lg py-1 my-0"> {author} </CardTitle>
        {imgs.map((img) => (
          <div className="relative w-full h-48 my-2 rounded-md overflow-hidden" key={img.ImageID}>
            <img
              src={`${process.env.NEXT_PUBLIC_ASSET_URL}/assets/${img.ImageID}.webp`}
              alt="Review attachment"
              className="w-full h-full object-cover"
            />
          </div>
        ))}
        <div className="flex items-center justify-between mb-3">
          <RatedStars
            count={5}
            rating={rating}
            iconSize={12}
            icon={""}
            color={"yellow"}
          />
          <p className="my-1 text-sm text-muted-foreground">{format(time)}</p>
        </div>
        <Separator />

        <p className="my-3 text-sm leading-relaxed">{review_body}</p>
      </div>
    </Card>
  );
}
