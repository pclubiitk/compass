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
  img: string;
  mode: string;
};

export default function ReviewCard({
  author,
  rating,
  review_body,
  time,
  img,
  mode,
}: ReviewProps) {
  return (
    <Card
      className={`mx-3 my-3 py-0 gap-0 ${
        mode == "dark" ? "bg-black text-white" : "bg-white text-black"
      }`}
    >
      <div className="mx-4 py-3">
        <CardTitle className="text-lg py-1 my-0"> {author} </CardTitle>
        <img src={img}></img>
        <div className="flex items-center justify-between mb-3">
          <RatedStars
            count={5}
            rating={rating}
            iconSize={12}
            icon={""}
            color={"yellow"}
          />
          <p className="my-1">{format(time)}</p>
        </div>
        <Separator />

        <p className="my-3">{review_body}</p>
      </div>
    </Card>
  );
}
