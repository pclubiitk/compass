"use client"

// export default function Page() {
//   return <p>All the notices will appear here</p>;
// }

import { Accordion } from "@/components/ui/accordion"
import NoticeCard  from '../../components/user/noticeboard/NoticeCard';
import { ThemeDD } from '../../components/ThemeDD';
import React, { useEffect, useState } from 'react';
import { Label } from "@radix-ui/react-dropdown-menu";
import { DatePicker } from "../../components/user/noticeboard/DatePicker";
import Pagination from "../../components/user/noticeboard/pagination";
import { useRouter } from "next/navigation";



export default function NoticeList({
  searchParams,
}: {
  searchParams?: { page?: string };
}) {
  const currentPage = Number(searchParams?.page) || 1;
  const [notices,setNotices]=useState([])
  const router = useRouter();

  const today = new Date();
  const fiveDaysAgo = new Date(today);
  fiveDaysAgo.setDate(today.getDate() - 5);

  const [openItem, setOpenItem] = useState<string>("")
  const [dateStart, setDateStart] = React.useState<Date | undefined>(
    fiveDaysAgo
  )
  const [openStart, setOpenStart] = React.useState<boolean>(
    false
  )

  const [dateEnd, setDateEnd] = React.useState<Date | undefined>(
    new Date()
  )
  const [openEnd, setOpenEnd] = React.useState<boolean>(
    false
  )

  const [totalPages,setTotalPages]=useState<number>(1)
  useEffect(()=>{
    if(openItem==""){
      console.log("shivang")
      window.history.replaceState(null, "", window.location.pathname);
    }
  },[openItem])



  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    
    if (dateStart) {
      params.set("start", dateStart.toISOString().split("T")[0]);
    }
    if (dateEnd) {
      params.set("end", dateEnd.toISOString().split("T")[0]);
    }

    // Preserve current page
    params.set("page", currentPage.toString());

    // Update the URL (without full reload)
    router.push(`?${params.toString()}`);
  }, [dateStart, dateEnd]);


  
  useEffect(() => {
      const origin=process.env.NEXT_PUBLIC_ORIGIN
      const fetchNotices = async () => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        start: dateStart?.toISOString().split("T")[0] || "",
        end: dateEnd?.toISOString().split("T")[0] || "",
      });

      const res = await fetch(`${origin}/api/maps/notice?${params.toString()}`, {
        method: "GET",
        credentials: "include",
      });

      const data = await res.json();
      setTotalPages(data.total); // or whatever your API returns
      setNotices(data.noticeboard_list); // optionally load notices from backend
      console.log(notices)
    };

    fetchNotices();
  }, [currentPage, dateStart, dateEnd]);

  useEffect(()=>{
    
  },[])

  const notices2 = [
    {
      id: "notice-1",
      cardTitle: "Exam Announcement",
      cardDescription: "Midterm exam schedule released",
      noticePreview: "The midterm exam will start from next week...",
      description: `
        <p>
          The complete schedule of the midterm exams is available on the student portal. Please log in to view your personalized timetable.
        </p>
      `,
    },
    {
      id: "notice-2",
      cardTitle: "Holiday Notice",
      cardDescription: "Campus closed on Friday",
      noticePreview: "Due to administrative reasons...",
      description: `
        <p>
          The university will remain closed on Friday due to staff training. Classes will resume on Saturday.
        </p>
      `,
    },
    {
      id: "notice-3",
      cardTitle: "Holiday Notice",
      cardDescription: "Campus closed on Friday",
      noticePreview: "Due to administrative reasons...",
      description: `<p>
          The university will remain closed on Friday due to staff training. Classes will resume on Saturday.
        </p>`
      ,
    },
    {
      id: "notice-4",
      cardTitle: "Holiday Notice",
      cardDescription: "Campus closed on Friday",
      noticePreview: "Due to administrative reasons...",
      description: `<p>
          The university will remain closed on Friday due to staff training. Classes will resume on Saturday.
        </p>`
      ,
    },
    {
      id: "notice-5",
      cardTitle: "Holiday Notice",
      cardDescription: "Campus closed on Friday",
      noticePreview: "Due to administrative reasons...",
      description: `
      <div className="space-y-2">
            <p>Antaragni, IIT Kanpur&apos;s premier cultural festival, returns with its biggest edition yet!</p>
            <Image src="/Antaragni.svg" alt="Antaragni 2025 Poster" width={210} height={297} />

            <p className="font-bold text-lg">🌟 Special Attraction: Arijit Singh Live Concert on 17th October! 🌟</p>

            <p>Other highlights include:</p>
            <ul className="list-disc pl-5">
                <li>Star nights with top artists</li>
                <li>Competitions in dance, music, drama and more</li>
                <li>Celebrity talks and workshops</li>
                <li>Food stalls and cultural exhibitions</li>
            </ul>

            <p>Venue: Open Air Theatre (OAT), IIT Kanpur</p>
            <p>Registrations open soon at <a href="https://antaragni.in" className="text-blue-500">antaragni.in</a></p>
            <p className="text-red-500">Limited passes available for Arijit Singh&apos;s performance!</p>
            <ShareButton/>
            </div>
        `
      ,
    },
  ]




  return (
    <>
      <ThemeDD></ThemeDD>
      <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <Label>Start Date:</Label>
          <DatePicker open={openStart} setOpen={setOpenStart} setDate={setDateStart} date={dateStart} />
        </div>
        <div className="flex items-center gap-2">
          <Label>End Date:</Label>
          <DatePicker open={openEnd} setOpen={setOpenEnd} setDate={setDateEnd} date={dateEnd} />
        </div>
      </div>
      <Accordion
      type="single"
      collapsible
      className="w-full space-y-4"
      value={openItem}
      onValueChange={(val) => {
        setOpenItem(val)
        // console.log(val)
      }}>
        {notices2.map((notice) => (
          <NoticeCard
            key={notice.id}
            id={notice.id}
            cardTitle={notice.cardTitle}
            cardDescription={notice.cardDescription}
            noticePreview={notice.noticePreview}
            isOpen={openItem==notice.id}
            description={notice.description}
          />
        ))}
        {/* {notices.map((notice) => (
          <NoticeCard
            key={notice.id}
            id={notice.id}
            cardTitle={notice.cardTitle}
            cardDescription={notice.cardDescription}
            noticePreview={notice.noticePreview}
            isOpen={openItem==notice.id}
            description={notice.description}
          />
        ))} */}
      </Accordion>
      <div className="mt-5 flex w-full justify-center">
        <Pagination totalPages={totalPages} />
      </div>
    </>
  )
}
