import React from 'react'
import {useState} from 'react'

const DEFAULT_COUNT = 5;
const DEFAULT_ICON = "⭐";
const DEFAULT_SELECTED = "yellow";
const DEFAULT_UNSELECTED = "grey";

export default function RatingStars({count, defaultRating, icon, color, iconSize}:{count:number, defaultRating:number, iconSize:number, icon:string, color:string}) {
    const [rating, setRating] = useState(defaultRating);
    const [temporaryRating, setTemporaryRating] = useState(0);

    let stars = Array(count || DEFAULT_COUNT).fill(icon || DEFAULT_ICON);

    const handleClick = (rating:number) => {
        setRating(rating);
        localStorage.setItem("starRating", String(rating));
    };

    return (
        <div className="flex">
            {stars.map((item, index) => {
                const isActiveColor =
                    (rating || temporaryRating) &&
                    (index < rating || index < temporaryRating);
                let elementColor = "";
                if (isActiveColor) {
                    elementColor = color || DEFAULT_SELECTED;
                } else {
                    elementColor = DEFAULT_UNSELECTED;
                }

                return (
                    <div className="star" key={index} style={{
                        fontSize: iconSize ? `${iconSize}px` : "14px",
                        color: elementColor,
                        filter: `${isActiveColor ? "grayscale(0%)" : "grayscale(100%)"}`
                        }}
                         onMouseEnter={() => setTemporaryRating(index + 1)}
                         onMouseLeave={() => setTemporaryRating(0)}
                         onClick={() => handleClick(index + 1)}
                    >
                        {icon ? icon : DEFAULT_ICON}
                    </div>
                );
            })}
        </div>
    );
}