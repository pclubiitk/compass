"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Map, LogOut, Camera } from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  AvatarBadge,
} from "@/components/ui/avatar";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useGContext } from "@/components/ContextProvider";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { useState, useEffect } from "react";

// TODO: Add tool tips

export function SocialProfileCard({
  email,
  userID,
  onProfileUpdate,
}: {
  email: string;
  userID?: string;
  onProfileUpdate?: () => void;
}) {
  const router = useRouter();
  const { setLoggedIn, setGlobalLoading } = useGContext();

  const BACKEND_URL = process.env.NEXT_PUBLIC_AUTH_URL;

  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [timestamp, setTimestamp] = useState(Date.now());

  // Background Image Logic Construction
  const imageUrls: string[] = [];

  if (preview) {
    imageUrls.push(`url("${preview}")`);
  }

  //for showing temporary preview when user selects a new image
  useEffect(() => {
    if (!selectedImage) return;
    const url = URL.createObjectURL(selectedImage);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [selectedImage]);

  // Reset preview when the profile picture is updated from the server i.e. the uploading is done
  useEffect(() => {
    if (!uploading) {
      setPreview(null);
      setSelectedImage(null);
    }
  }, [uploading]);

  // Uploading a new image
  const handleUpload = async (file: File) => {
    const formData = new FormData();
    formData.append("profileImage", file);

    try {
      setUploading(true);

      const res = await fetch(`${BACKEND_URL}/api/profile/pfp`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Profile image updated!");
        setTimestamp(Date.now());
        onProfileUpdate?.();
      } else {
        toast.error(data.error || "Upload failed");
      }
    } catch {
      toast.error("Error uploading image");
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2097152) {
      toast("File is too big!");
      return;
    }
    setSelectedImage(file);
    handleUpload(file);
  };

  const logOut = async () => {
    try {
      setGlobalLoading(true);
      const res = await fetch(`${BACKEND_URL}/api/auth/logout`, {
        method: "GET",
        credentials: "include",
      });

      const data = await res.json();

      if (res.ok) {
        toast(data.message);
        setLoggedIn(false);
        router.replace("/login");
      }
    } catch {
      toast("Something went wrong, Try again later.");
    } finally {
      setGlobalLoading(false);
    }
  };

  return (
    <Card className="overflow-hidden pt-0">
      <div className="h-32 md:h-40 bg-linear-to-r from-blue-100 to-teal-100 dark:from-slate-800 dark:to-slate-900" />
      <div className="flex flex-col items-center -mt-24 sm:-mt-30 p-6 relative">
        <div className="relative group w-32 h-32 sm:w-36 sm:h-36">
          <Avatar
            key={timestamp}
            className="w-full h-full border-4 border-card shadow-2xl transition-transform duration-300 ring-4 ring-purple-500/20 dark:ring-purple-400/30"
          >
            {/* updating timestamp makes the asset reload once uploaded */}
            <AvatarImage
              src={
                preview
                  ? preview
                  : `${process.env.NEXT_PUBLIC_ASSET_URL}/pfp/${userID}.webp?t=${timestamp}`
              }
              className="object-cover"
            />
            <AvatarFallback className="text-2xl font-semibold bg-linear-to-br from-blue-500 to-purple-600 text-white">
              {email ? email.slice(0, 2).toUpperCase() : "NA"}
            </AvatarFallback>
          </Avatar>

          {/* Camera icon at the bottom of the avatar */}
          <label
            htmlFor="profile-upload"
            className="absolute bottom-0 left-1/2 translate-x-1/2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-full p-2.5 cursor-pointer shadow-lg transition-all hover:scale-110 ring-4 ring-card z-10"
          >
            <Camera className="h-4 w-4" />
            <input
              id="profile-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
              disabled={uploading}
            />
          </label>
        </div>

        {/* Email with better styling */}
        <p className="text-muted-foreground mt-4 text-sm font-medium">
          {email}
        </p>

        {/* Action buttons with better spacing and styling */}
        <div className="flex flex-wrap gap-3 mt-6 justify-center">
          <Button
            variant="outline"
            size="icon"
            className="h-12 w-12 shadow-md hover:shadow-lg transition-all hover:scale-105"
            onClick={() =>
              router.push(
                process.env.NEXT_PUBLIC_SEARCH_UI_URL ||
                  "https://search.pclub.in",
              )
            }
          >
            <Search className="h-5 w-5" />
          </Button>

          {/* Map button with "Under Development" badge */}
          <div className="relative">
            <Button
              variant="outline"
              size="icon"
              className="h-12 w-12 shadow-md hover:shadow-lg transition-all opacity-60 cursor-not-allowed"
              onClick={() => router.push("/")}
              disabled
            >
              <Map className="h-5 w-5" />
            </Button>
            <Badge
              variant="secondary"
              className="absolute -top-2 -right-2 text-[10px] px-1.5 py-0.5 shadow-md bg-yellow-500/90 dark:bg-yellow-600/90 text-white border-0"
            >
              Dev
            </Badge>
          </div>

          {/* ModeToggle with "Under Development" badge */}
          <div className="relative">
            <div className="opacity-60 pointer-events-none">
              <ModeToggle />
            </div>
            <Badge
              variant="secondary"
              className="absolute -top-2 -right-2 text-[10px] px-1.5 py-0.5 shadow-md bg-yellow-500/90 dark:bg-yellow-600/90 text-white border-0"
            >
              Dev
            </Badge>
          </div>

          <Button
            variant="outline"
            size="icon"
            className="h-12 w-12 shadow-md hover:shadow-lg transition-all hover:scale-105 hover:bg-red-50 dark:hover:bg-red-950/20"
            onClick={logOut}
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
