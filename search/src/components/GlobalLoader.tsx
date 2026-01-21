"use client";

import { RingLoader } from "react-spinners";
import { useGContext } from "./ContextProvider";

export function GlobalLoader() {
  const { isGlobalLoading } = useGContext();

  if (!isGlobalLoading) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 9999,
      }}
    >
      <RingLoader color="#ffffff" size={80} />
    </div>
  );
}
