import { useState } from "react";
import { FaStar } from "react-icons/fa";

type StarRatingProps = {
  initialRating?: number;
  onChange?: (rating: number) => void;
};
export default function StarRating({ initialRating = 0, onChange }: StarRatingProps) {
  const [rating, setRating] = useState(initialRating);
  const [hover, setHover] = useState(0);

  return (
    <div className="flex space-x-1">
      {[1, 2, 3, 4, 5].map((star) => {
        const isFilled = star <= (hover || rating);
        return (
          <FaStar
            key={star}
            size={28}
            className={`cursor-pointer transition-colors duration-200 ${
              isFilled ? "text-yellow-400" : "text-gray-300"
            }`}
            onClick={() => {
              setRating(star);
              if (onChange) onChange(star);
            }}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
          />
        );
      })}
    </div>
  );
}
