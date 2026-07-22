"use client";

import { useEffect } from "react";
import { LOGIN_POINT } from "@/lib/constant";

export default function RedirectIn5Sec() {
  useEffect(() => {
    window.location.replace(LOGIN_POINT);
  }, []);

  return (
    <div className="text-center p-8">
      Redirecting to login...
    </div>
  );
}
