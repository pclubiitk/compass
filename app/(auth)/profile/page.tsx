"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SocialProfileCard } from "@/components/profile/SocialProfileCard";
import { EditableProfileCard } from "@/components/profile/EditableProfileCard";
import { ContributionsCard } from "@/components/profile/ContributionsCard";
import { PuppyLoveProfileCard } from "@/components/profile/PuppyLoveProfileCard";
import {
  useCalendar,
  CalendarProvider,
} from "@/calendar/contexts/calendar-context";
import { ClientContainer } from "@/calendar/components/client-container";
import { getEvents } from "@/calendar/requests";
import { Calendar } from "lucide-react";

import type { IEvent } from "@/calendar/interfaces";
import ComingSoon from "@/components/ui/ComingSoon";
import { useGContext } from "@/components/ContextProvider";

// Data Type
export type Profile = {
  UserID: string;
  name: string;
  email: string;
  rollNo: string;
  dept: string;
  course: string;
  gender: string;
  hall: string;
  roomNo: string;
  homeTown: string;
  visibility: boolean;
};

export type UserData = {
  role: number;
  profile: Profile;
  ContributedLocations: [];
  ContributedReview: [];
  ContributedNotice: [];
};

export default function ProfilePage() {
  const router = useRouter();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [calendarEvents, setCalendarEvents] = useState<IEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [calendarLoading, setCalendarLoading] = useState(true);

  // PuppyLove state
  const { isPLseason } = useGContext();
  const [isPuppyLoveRegistered, setIsPuppyLoveRegistered] = useState(true);
  const [puppyLoveBio, setPuppyLoveBio] = useState("");
  const [puppyLoveInterests, setPuppyLoveInterests] = useState<string[]>([]);

  // Fetch calendar events using the new requests module
  const fetchCalendarEvents = useCallback(async () => {
    setCalendarLoading(true);
    try {
      const events = await getEvents();
      setCalendarEvents(events);
      return events;
    } catch (err) {
      console.error("Failed to fetch calendar events:", err);
      return [];
    } finally {
      setCalendarLoading(false);
    }
  }, []);

  // Load calendar events on mount
  useEffect(() => {
    fetchCalendarEvents();
  }, [fetchCalendarEvents]);

  // Check PuppyLove status and fetch profile
  useEffect(() => {
    const checkPuppyLove = async () => {
      try {
        // Check if user is registered (has dirty = true)
        const dataRes = await fetch(
          `${process.env.NEXT_PUBLIC_PUPPYLOVE_URL}/api/puppylove/users/data`,
          { credentials: "include" },
        );

        if (dataRes.ok) {
          const data = await dataRes.json();
          // User is registered if they have a profile with dirty = true
          setIsPuppyLoveRegistered(data.dirty === true);
          
          // Set bio and interests
          setPuppyLoveBio(data.about || "");
          setPuppyLoveInterests(
            Array.isArray(data.interests)
              ? data.interests
              : typeof data.interests === "string"
                ? data.interests
                    .split(",")
                    .map((s: string) => s.trim())
                    .filter(Boolean)
                : [],
          );
        } else if (dataRes.status === 404) {
          setIsPuppyLoveRegistered(false);
        }
      } catch (err) {
        console.error("Failed to check PuppyLove status:", err);
      }
    };
    if (isPLseason) checkPuppyLove();
  }, [isPLseason]);
 
  const fetchProfile = async () => {
    // We don't reset loading to true on refetch to avoid skeleton flashes
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_AUTH_URL}/api/profile`,
        {
          credentials: "include",
        },
      );
      if (res.ok) {
        const data = await res.json();

        const normalized = {
          ...data,
          profile: {
            ...data.profile,
            profile: {
              ...data.profile.profile,
              // profilePic: data.profile.profilepic ?? data.profile.profilePic,
            },
          },
        };

        // console.log("Normalized profilePic:", normalized.profile.profilePic);

        setUserData(normalized.profile);
        // If profile incomplete redirect to signup step 3
        if (
          normalized.profile.profile.name.length === 0 ||
          normalized.profile.profile.rollNo.length === 0 ||
          normalized.profile.profile.dept.length === 0 ||
          normalized.profile.profile.course === 0
        ) {
          router.push("/signup?step=3");
        }
      } else {
        toast.error("Invalid Session. Redirecting to login.");
        // After login again direct to profile
        router.push("/login?callbackUrl%2Fprofile");
      }
    } catch (err) {
      console.log(err);
      toast.error("An error occurred while fetching your profile.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // Loading Skeleton
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

  const profile = userData.profile;
  

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-muted/40">
      {/* --- Left Column (Fixed) --- */}
      <aside className="w-full lg:w-1/3 xl:w-1/3 p-4 sm:p-6 lg:p-8">
        <div className="lg:sticky lg:top-8">
          <SocialProfileCard
            email={profile.email}
            userID={profile.UserID}
            onProfileUpdate={fetchProfile}
          />
        </div>
      </aside>

      {/* --- Right Column (Scrollable) --- */}
      <main className="flex-1 lg:h-screen lg:overflow-y-auto p-4 sm:p-6 lg:p-8 lg:pl-0">
        <div className="space-y-8">
          <EditableProfileCard
            profile={userData.profile}
            onUpdate={fetchProfile}
          />


          {/* PuppyLove Profile Card - only visible during Valentine's mode */}
          <PuppyLoveProfileCard
            rollNo={profile.rollNo}
            initialBio={puppyLoveBio}
            initialInterests={puppyLoveInterests}
            isPuppyLoveActive={isPLseason}
            isRegistered={isPuppyLoveRegistered}
          />

          <ContributionsCard
            locations={userData.ContributedLocations}
            reviews={userData.ContributedReview}
            notices={userData.ContributedNotice}
          />

          {/* Calendar Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Campus Events
                <ComingSoon />
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {calendarLoading ? (
                <div className="h-96 flex items-center justify-center">
                  <Skeleton className="h-80 w-full mx-4" />
                </div>
              ) : (
                <div className="min-h-125">
                  <CalendarProvider
                    events={calendarEvents}
                    fetchEvents={fetchCalendarEvents}
                  >
                    <CalendarInner />
                  </CalendarProvider>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

function CalendarInner() {
  const { view } = useCalendar();

  return (
    <div className="flex flex-col">
      <ClientContainer view={view} />
    </div>
  );
}
