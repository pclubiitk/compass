import React, { useState, useEffect } from "react";
import SCard from "@/components/student/SCard";
import { useGContext } from "@/components/ContextProvider";
import RedirectIn5Sec from "@/components/cards/RedirectIn5Sec";
import FadeAnim from "@/components/ui/animations/fadeAnim";

import { Student } from "@/lib/types/data";
import { throttle } from "@/lib/utils";
import { NavBar } from "./NavBar";
import { PROFILE_POINT } from "@/lib/constant";

interface DisplayProps {
  toShow: Student[];
  displayCard: (item: Student) => void;
  displayInfo: (item: any) => void;
}

function Display(props: DisplayProps) {
  const { isLoggedIn, profileVisibility, isPLseason } = useGContext();
  // Current position (number of cards)
  const [pos, setPos] = useState(50);
  // Make students' card objects at the start form the data
  const students = props.toShow.map((el) => (
    <SCard
      data={el}
      key={el.UserID}
      onClick={() => props.displayCard(el)}
      pointer={true}
      type={"normal"}
    />
  ));

  // Help reset the pos to 50 when new set of students
  // should have used props.toShow or simply students,
  // but it causes the reset every time i scroll,
  // mostly as rerenders may affect the students array
  useEffect(() => {
    setPos(50);
  }, [students.length]); // HotFix
  // // Issue: maybe possible when the length remains same,
  // // very unlikely and does not affect much

  // Handel scroll effect
  useEffect(() => {
    // No students left
    if (pos >= students.length) {
      return;
    }
    // Function to check if more is needed
    const loadMore = () => {
      // viewport height + current page distance from top >= total page height - 200 (the tolerance)
      if (
        window.innerHeight + document.documentElement.scrollTop >=
        document.documentElement.offsetHeight - 200
      ) {
        setPos((prevPos) => prevPos + 50);
      }
    };
    // Improve performance by calling the function every 200 ms
    const throttledLoadMore = throttle(loadMore, 200);

    // Add event listener to the browser
    window.addEventListener("scroll", throttledLoadMore);
    // Cleanup function runs when, component unmounts or when the dependencies change.
    return () => {
      window.removeEventListener("scroll", throttledLoadMore);
    };
  }, [pos, students.length]);

  // If logged out, redirect to login
  if (!isLoggedIn) return <RedirectIn5Sec />;

  // Give and Take relations :)
  if (!profileVisibility) {
    return (
      <div className="text-center p-8">
        Please make your profile visible to view other profiles.{" "}
        <a href={PROFILE_POINT} className="text-blue-600 underline">
          Visit Profile
        </a>
      </div>
    );
  }

  return (
    // Two Component UI
    // 1. Sticky Nav bar, results, quick links
    // 2. Animated Student Card render components
    <div className="space-y-4">
      <NavBar
        length={students.length}
        pos={pos}
        isPLseason={isPLseason}
        displayInfo={props.displayInfo}
      ></NavBar>
      <FadeAnim myname="display">{students.slice(0, pos)}</FadeAnim>
    </div>
  );
}

export default Display;
