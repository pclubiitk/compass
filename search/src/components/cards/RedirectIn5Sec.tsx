"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LOGIN_POINT } from "@/lib/constant";
export default function RedirectIn5Sec() {
  const router = useRouter();
  const [timeLeft, setTimeLeft] = useState(5); // State to hold the countdown

  useEffect(() => {
    // If timeLeft reaches 0, redirect the user
    if (timeLeft <= 0) {
      router.replace(LOGIN_POINT);
      setTimeLeft(0);
    }
    const intervalId = setInterval(() => {
      setTimeLeft(timeLeft - 1);
    }, 1000);

    // Cleanup function: clear the interval when the component unmounts
    // or when timeLeft changes, to prevent memory leaks.
    return () => clearInterval(intervalId);
  }, [timeLeft, router]);

  return (
    <div className="text-center p-8">
      You are not logged In. Redirecting in {timeLeft} seconds...
    </div>
  );
}
