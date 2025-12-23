"use client";

import { SWRConfig } from "swr";
import React from "react";

const localStorageProvider = () => {
  if (typeof window === "undefined") return new Map();

  try {
    // Rehydrate cache from localStorage
    const stored = localStorage.getItem("swr-cache");
    const map = new Map<string, any>(stored ? JSON.parse(stored) : []);

    // Persist cache before unload
    const persist = () => {
      localStorage.setItem(
        "swr-cache",
        JSON.stringify(Array.from(map.entries()))
      );
    };
    window.addEventListener("beforeunload", persist);

    return map;
  } catch (err) {
    console.warn("SWR localStorage cache failed:", err);
    return new Map();
  }
};

export default function SWRProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SWRConfig
      value={{
        provider: localStorageProvider,
        revalidateOnFocus: true,
        dedupingInterval: 30000, // 30s dedupe window // If multiple components request the same data within 30 seconds, SWR only sends one network request.
        shouldRetryOnError: false,
      }}
    >
      {children}
    </SWRConfig>
  );
}
