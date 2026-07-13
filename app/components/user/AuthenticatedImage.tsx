"use client";

import { useEffect, useState } from "react";
import { ImageIcon, Loader2 } from "lucide-react";

interface AuthenticatedImageProps {
  src: string;
  alt: string;
  className?: string;
  requiresAuth?: boolean;
}

export function AuthenticatedImage({
  src,
  alt,
  className,
  requiresAuth = true,
}: AuthenticatedImageProps) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!requiresAuth) {
      setObjectUrl(src);
      setFailed(false);
      return;
    }

    let cancelled = false;
    let blobUrl: string | null = null;

    setObjectUrl(null);
    setFailed(false);

    fetch(src, { credentials: "include" })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to load image: ${response.status}`);
        }
        return response.blob();
      })
      .then((blob) => {
        if (cancelled) return;
        blobUrl = URL.createObjectURL(blob);
        setObjectUrl(blobUrl);
      })
      .catch(() => {
        if (!cancelled) {
          setFailed(true);
        }
      });

    return () => {
      cancelled = true;
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [src, requiresAuth]);

  if (failed) {
    return (
      <div
        className={`flex items-center justify-center bg-muted ${className ?? ""}`}
      >
        <ImageIcon className="h-6 w-6 text-muted-foreground" />
      </div>
    );
  }

  if (!objectUrl) {
    return (
      <div
        className={`flex items-center justify-center bg-muted ${className ?? ""}`}
      >
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!requiresAuth) {
    return <img src={objectUrl} alt={alt} className={className} />;
  }

  return <img src={objectUrl} alt={alt} className={className} />;
}

export function getImageId(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === "string") return value;
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    const id = record.imageId ?? record.ImageID ?? record.imageID;
    return id ? String(id) : null;
  }
  return null;
}

export function getImageStatus(img: unknown): string {
  if (!img || typeof img !== "object") return "approved";
  const record = img as Record<string, unknown>;
  return String(record.status ?? record.Status ?? "approved").toLowerCase();
}

export function buildReviewImageUrl(
  imageId: string,
  status: string,
  assetUrl?: string,
): { url: string; requiresAuth: boolean } {
  const base = assetUrl ?? process.env.NEXT_PUBLIC_ASSET_URL ?? "";

  if (status === "approved") {
    return { url: `${base}/assets/${imageId}.webp`, requiresAuth: false };
  }

  return { url: `${base}/protected-assets/${imageId}`, requiresAuth: true };
}
