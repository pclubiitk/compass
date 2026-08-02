"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import type { Img } from "@/app/components/lib/types";
import { Gallery } from "@/app/components/location/Gallery";
import { parseGalleryImages } from "./gallery-data";

function csrfHeaders(): HeadersInit {
  const csrfToken = document.cookie
    .split("; ")
    .find((row) => row.startsWith("csrf_token="))
    ?.slice("csrf_token=".length);

  return {
    "Content-Type": "application/json",
    ...(csrfToken ? { "X-CSRF-Token": decodeURIComponent(csrfToken) } : {}),
  };
}

function GalleryPage() {
  const [images, setImages] = useState<Img[]>([]);
  const [refreshVersion, setRefreshVersion] = useState(0);
  const assetUrl = process.env.NEXT_PUBLIC_ASSET_URL;

  useEffect(() => {
    const controller = new AbortController();

    async function loadImages() {
      if (!assetUrl) {
        toast.error("Asset backend URL is not configured.");
        return;
      }

      try {
        const response = await fetch(`${assetUrl}/gallery`, {
          credentials: "include",
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error(`Failed to load gallery (${response.status})`);
        }

        setImages(parseGalleryImages(await response.json()));
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error("Failed to load gallery:", error);
        setImages([]);
        toast.error("Failed to load gallery.");
      }
    }

    void loadImages();
    return () => controller.abort();
  }, [assetUrl, refreshVersion]);

  const refresh = useCallback(() => {
    setRefreshVersion((version) => version + 1);
  }, []);

  const handleApprove = useCallback(
    async (image: Img) => {
      if (!assetUrl) return;

      try {
        const response = await fetch(`${assetUrl}/gallery/${image.imageId}`, {
          method: "PUT",
          credentials: "include",
          headers: csrfHeaders(),
        });
        const result = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(
            result?.error ||
              result?.message ||
              `Failed to approve (${response.status})`,
          );
        }

        toast.success(result?.message || "Image approved");
        refresh();
      } catch (error) {
        console.error("Failed to approve image:", error);
        toast.error(
          error instanceof Error ? error.message : "Failed to approve image.",
        );
      }
    },
    [assetUrl, refresh],
  );

  const handleDelete = useCallback(
    async (image: Img) => {
      if (!assetUrl) return;

      try {
        const response = await fetch(`${assetUrl}/gallery/${image.imageId}`, {
          method: "DELETE",
          credentials: "include",
          headers: csrfHeaders(),
        });
        const result = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(
            result?.error ||
              result?.message ||
              `Failed to delete (${response.status})`,
          );
        }

        toast.success(result?.message || "Image deleted");
        refresh();
      } catch (error) {
        console.error("Failed to delete image:", error);
        toast.error(
          error instanceof Error ? error.message : "Failed to delete image.",
        );
      }
    },
    [assetUrl, refresh],
  );

  return (
    <div className="p-8">
      <h1 className="mb-4 text-center text-2xl font-bold">Gallery Management</h1>
      <div className="m-auto w-[30vw] py-6 text-justify italic text-muted-foreground">
        As an admin, you can review all the images uploaded here. Images will be
        made publicly visible on the platform only after approval by an admin.
        You may approve or delete any image.
      </div>
      <Gallery
        images={images}
        handleApprove={handleApprove}
        handleDelete={handleDelete}
      />
    </div>
  );
}

export default GalleryPage;
