import React from 'react'

const DEFAULT_COUNT = 5;
const DEFAULT_ICON = "⭐";
const DEFAULT_SELECTED = "yellow";
const DEFAULT_UNSELECTED = "grey";

export default function RatingStars({count, rating, icon, color, iconSize}:{count:number, rating:number, iconSize:number, icon:string, color:string}) {

    let stars = Array(count || DEFAULT_COUNT).fill(icon || DEFAULT_ICON);

    return (
        <div className="flex">
            {stars.map((item, index) => {
                const isActiveColor =
                    (rating) &&
                    (index < rating);
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
                    >
                        {icon ? icon : DEFAULT_ICON}
                    </div>
                );
            })}
        </div>
    );
}