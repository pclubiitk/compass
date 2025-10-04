"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { SocialProfileCard } from "@/components/profile/SocialProfileCard";
import { EditableProfileCard } from "@/components/profile/EditableProfileCard";
import { ContributionsCard } from "@/components/profile/ContributionsCard";

// Data Type
export type Profile = {
  name: string;
  email: string;
  rollNo: string;
  dept: string;
  course: string;
  gender: string;
  hall: string;
  roomNo: string;
  homeTown: string;
};
export type UserData = {
  role: number;
  profile: Profile;
  ContributedLocations: any[];
  ContributedReview: any[];
  ContributedNotice: any[];
};

export default function ProfilePage() {
  const router = useRouter();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = async () => {
    // We don't reset loading to true on refetch to avoid skeleton flashes
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_AUTH_URL}/profile`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setUserData(data.profile);
      } else {
        toast.error("Invalid Session. Redirecting to login.");
        // After login again direct to profile
        router.push("/login?callbackUrl%2Fprofile");
      }
    } catch (err) {
      console.log(err)
      toast.error("An error occurred while fetching your profile.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col lg:flex-row min-h-screen bg-muted/40">
        <aside className="w-full lg:w-1/3 xl:w-1/4 p-4 sm:p-6 lg:p-8">
          <Skeleton className="h-80 w-full" />
        </aside>
        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-8">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </main>
      </div>
    );
  }

  if (!userData) {
    return <div className="text-center p-12">Could not load profile data.</div>;
  }

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-muted/40">
      {/* --- Left Column (Fixed) --- */}
      <aside className="w-full lg:w-1/3 xl:w-1/3 p-4 sm:p-6 lg:p-8">
        <div className="lg:sticky lg:top-8">
          <SocialProfileCard profile={userData.profile} />
        </div>
      </aside>

      {/* --- Right Column (Scrollable) --- */}
      <main className="flex-1 lg:h-screen lg:overflow-y-auto p-4 sm:p-6 lg:p-8 lg:pl-0">
        <div className="space-y-8">
          <EditableProfileCard
            profile={userData.profile}
            onUpdate={fetchProfile}
          />
          <ContributionsCard
            locations={userData.ContributedLocations}
            reviews={userData.ContributedReview}
            notices={userData.ContributedNotice}
          />
        </div>
      </main>
    </div>
  );
}
