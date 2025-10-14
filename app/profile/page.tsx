"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { SocialProfileCard } from "@/components/profile/SocialProfileCard";
import { EditableProfileCard } from "@/components/profile/EditableProfileCard";
import { ContributionsCard } from "@/components/profile/ContributionsCard";
import { useCalendar } from "@/calendar/contexts/calendar-context";
import { CalendarProvider } from "@/calendar/contexts/calendar-context";
import { ClientContainer } from "@/calendar/components/client-container";

import { IEvent } from "@/calendar/interfaces";

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
  const [calendarEvents, setCalendarEvents] = useState<IEvent[]>([]);
  const [calendarType, setCalendarType] = useState<'year' | 'week' | 'day' | 'month'>('day');
  const [isLoading, setIsLoading] = useState(true);
 
  //hardcoded events for demo
    const eventss: IEvent[] = [
    {
      id: 1,
      title: "Team Standup Meeting",
      description: "Daily sync-up with the development team.",
      startDate: "2025-10-10T00:00:00.000Z",
      endDate: "2025-10-10T09:30:00.000Z",
      color: "blue",
    },
    {
      id: 2,
      title: "Project Planning",
      description: "Sprint planning and backlog refinement.",
      startDate: "2025-10-10T09:00:00.000Z",
      endDate: "2025-10-11T12:30:00.000Z",
      color: "green",
    },
    {
      id: 3,
      title: "Design Review",
      description: "UI/UX review for the upcoming release.",
      startDate: "2025-10-10T15:00:00.000Z",
      endDate: "2025-10-10T16:00:00.000Z",
      color: "purple",
    },
    {
      id: 4,
      title: "Client Presentation",
      description: "Presenting the project demo to the client.",
      startDate: "2025-10-10T10:00:00.000Z",
      endDate: "2025-10-10T11:30:00.000Z",
      color: "red",
    },
    {
      id: 5,
      title: "Team Lunch",
      description: "Casual lunch with the product and design teams.",
      startDate: "2025-10-14T13:00:00.000Z",
      endDate: "2025-10-14T14:00:00.000Z",
      color: "yellow",
    },
    {
      id: 6,
      title: "Code Review Session",
      description: "Reviewing pull requests for sprint tasks.",
      startDate: "2025-10-15T16:00:00.000Z",
      endDate: "2025-10-15T17:00:00.000Z",
      color: "orange",
    },
    {
      id: 7,
      title: "Hackathon",
      description: "Company-wide internal hackathon event.",
      startDate: "2025-10-16T09:00:00.000Z",
      endDate: "2025-10-17T17:00:00.000Z",
      color: "blue",
    },
  ];
  
useEffect(() => {
  setCalendarEvents(eventss);
}, []); //
  
  const fetchProfile = async () => {
    // We don't reset loading to true on refetch to avoid skeleton flashes
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_AUTH_URL}/profile`
, {
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
   
  <CalendarProvider events={calendarEvents}>
          <CalendarInner />
        </CalendarProvider>
</div>




      </main>
    </div>
  );
}

function CalendarInner() {
  const { view } = useCalendar();

  useEffect(() => {
    console.log("Current calendar view:", view);
  }, [view]);

  return (
    <div className="mx-auto flex max-w-screen-2xl flex-col gap-4 p-4">
      <ClientContainer view={view} />
 
    </div>
  );
}