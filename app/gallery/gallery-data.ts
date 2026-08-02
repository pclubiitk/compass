import type { Img } from "@/app/components/lib/types";

function isGalleryImage(value: unknown): value is Img {
  if (!value || typeof value !== "object") return false;

  const image = value as Record<string, unknown>;
  return typeof image.imageId === "string" && typeof image.status === "string";
}

export function parseGalleryImages(payload: unknown): Img[] {
  if (!payload || typeof payload !== "object") return [];

  const images = (payload as Record<string, unknown>).images;
  return Array.isArray(images) ? images.filter(isGalleryImage) : [];
}

export function galleryImagesWithStatus(
  images: Img[],
  status: string,
): Img[] {
  return images.filter((image) => image.status === status);
}
