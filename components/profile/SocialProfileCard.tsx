"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Map, LogOut, Camera } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useGContext } from "@/components/ContextProvider";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { useState, useEffect } from "react";

export function SocialProfileCard({
  email,
  profilePic,
  onProfileUpdate,
}: {
  email: string;
  profilePic?: string;
  onProfileUpdate?: () => void;
}) {
  console.log(email);
  console.log(profilePic);
  const router = useRouter();
  const { setLoggedIn, setGlobalLoading } = useGContext();

  const BACKEND_URL = process.env.NEXT_PUBLIC_AUTH_URL;

  const [preview, setPreview] = useState<string | null>(
    profilePic ? `${BACKEND_URL}/${profilePic}` : null
  );
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

//for showing temporary preview when user selects a new image
  useEffect(() => {
    if (!selectedImage) return;
    const url = URL.createObjectURL(selectedImage);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [selectedImage]);

 //uploading a new image
  const handleUpload = async (file: File) => {
    const formData = new FormData();
    formData.append("profileImage", file);

    try {
      setUploading(true);

      const res = await fetch(`${BACKEND_URL}/profile/upload-image`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Profile image updated!");
        setPreview(`${BACKEND_URL}/${data.imagePath}`);
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
    } finally {
      setGlobalLoading(false);
    }
  };

  return (
    <Card className="overflow-hidden pt-0">
      <div className="h-32 md:h-40 bg-gradient-to-r from-blue-100 to-teal-100 dark:from-slate-800 dark:to-slate-900" />

      <div className="flex flex-col items-center -mt-24 sm:-mt-30 p-6 relative">
        <div className="relative group w-32 h-32 sm:w-36 sm:h-36">
          <Avatar className="w-full h-full border-4 border-card cursor-pointer">
            <AvatarImage
              src={
    profilePic
      ? `http://localhost:8080/public/${profilePic}`
      : email
      ? `https://home.iitk.ac.in/~${email.split("@")[0]}/dp`
      : ""
  }
            />
            <AvatarFallback>
              {email ? email.slice(0, 2).toUpperCase() : "NA"}
            </AvatarFallback>
          </Avatar>

          {/* Hover overlay & file input */}
          <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-all cursor-pointer rounded-full">
            <Camera className="text-white w-7 h-7" />
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
              disabled={uploading}
            />
          </label>
        </div>

       
        <p className="text-muted-foreground">{email}</p>

        <div className="flex gap-2 mt-6">
          <Button variant="outline" size="icon" className="h-12 w-12" onClick={() => router.push("https://search.pclub.in")}>
            <Search />
          </Button>

          <Button variant="outline" size="icon" className="h-12 w-12" onClick={() => router.push("/")}>
            <Map />
          </Button>

          <ModeToggle />

          <Button variant="outline" size="icon" className="h-12 w-12" onClick={logOut}>
            <LogOut />
          </Button>
        </div>
      </div>
    </Card>
  );
}
