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
import { Notice } from "@/lib/types";
import { env } from "process";

const mapServer = env.NEXT_PUBLIC_MAP_SERVER; 
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
  const [notices, setNotices] = useState<Notice[]>([]);
 
  //hardcoded events for demo
   useEffect(() => {
  const fetchNotices = async () => {
    try {
      const res = await fetch(`${mapServer}/api/maps/notice?page=1`);
      const data = await res.json();

      const formatted: Notice[] = data.noticeboard_list.map((n: any) => ({
        id: n.id,
        title: n.title,
        description: n.description,
        type: n.type || "Event",
        recipient: n.recipient || "All",
        location: n.location || "Campus",
        eventTime: n.eventTime || n.time, 
        eventEndTime: n.eventEndTime || n.endTime,
      }));

      setNotices(formatted);

      // build calendar events *after* data is fetched
      const eventss: IEvent[] = formatted

        .map((notice, index) => {
          const start = new Date(notice.eventTime);
          const end= new Date(notice.eventEndTime)
          if (isNaN(start.getTime())) {
            console.warn("Invalid date in notice:", notice);
            return null;
          }

          // Add a small offset for uniqueness
        

          return {
            id: index + 1,
            title: notice.title,
            description: notice.description,
      
            startDate: start.toISOString(),
            endDate: end.toISOString(),
            location: notice.location || "Campus",
            color: "blue",
          };
        })
        .filter(Boolean) as unknown as IEvent[];

      setCalendarEvents(eventss);
    } catch (err) {
      console.error("Failed to fetch notices:", err);
    } finally {
      setIsLoading(false);
    }
  };

  fetchNotices();
}, []);


  
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
   
    <div className="h-80">
     
  <CalendarProvider events={calendarEvents}>

          <CalendarInner />
        </CalendarProvider>
    </div>
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