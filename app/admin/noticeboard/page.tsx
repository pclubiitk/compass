"use client"
import { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle, AlertTriangle, Ban } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

import removeMd from 'remove-markdown'; // <--- 1. IMPORT REMOVE-MARKDOWN


// export const metadata: Metadata = {
//   title: 'Noticeboard',
// };

const mapServer = process.env.NEXT_PUBLIC_MAPS_URL; //edit this, why tho?

interface Notice {
  id: string;
  title: string;
  description: string;
  type: "Event" | "Warning" | "Ban";
  // publisher: string
  recipient: string;
  location: string;
  time: string;
}

export default function Page() {
  const [notices, setNotices] = useState<Notice[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1); // added this - SS
  // const [totalPages, setTotalPages] = useState(1); // removing this | where is api backend ToT
  const [hasMorePages, setHasMorePages] = useState(true);

  // this too needs to be corrected
  const typeStyles: Record<string, string> = {
    Event: "bg-green-50 border-l-4 border-green-500",
    Warning: "bg-yellow-50 border-l-4 border-yellow-500",
    Ban: "bg-red-50 border-l-4 border-red-500",
  };
  // have to correct this logic --- ye category vaala
  const getIcon = (type: string) => {
    const baseClass = "w-6 h-6";
    switch (type) {
      case "Event":
        return (
          <div className="min-w-min flex items-center gap-2">
            <CheckCircle className={`${baseClass} text-green-600`} />
          </div>
        );
      case "Warning":
        return (
          <div className="min-w-min flex items-center gap-2">
            <AlertTriangle
              className={`${baseClass} text-yellow-600  dark:text-[lab(78_30.26_107.78)]`}
            />
          </div>
        );
      case "Ban":
        return (
          <div className="min-w-min flex items-center gap-2">
            <Ban className={`${baseClass} text-red-600`} />
          </div>
        );
      default:
        return null;
    }
  };

  // prevoew helper fxn
  const createPreview = (markdown: string, length: number = 100) => {
    const plainText = removeMd(markdown);
    if (plainText.length <= length) {
      return plainText;
    }
    return `${plainText.substring(0, length)}...`;
  };

  useEffect(() => {
    const fetchNotices = async () => {
      setLoading(true); // to ensure loading is true at the start of fetch
      try {
        const res = await fetch(
          `${mapServer}/api/maps/notice?page=${currentPage}` // have to change this to avoid vuln
        )
        const data = await res.json()

        // adapt based on backend response shape
        const formatted: Notice[] = data.noticeboard_list.map((n: any) => ({
          id: n.NoticeId,
          title: n.title,
          description: n.description,
          type: n.entity || "Event", // fallback until backend provides
          // publisher: n.user?.name || "Admin",
          recipient: n.recipient || "All",
          location: n.location || "Campus",
          time: n.CreatedAt,
        }))

        setNotices(formatted)

        // setTotalPages(data.totalPages||1); // to match the actual API response key.
        setHasMorePages(formatted.length >= 5);

      } catch (err) {
        console.error("Failed to fetch notices:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchNotices()
  }, [currentPage]) // add currentPage to dependency array

  // --- Button Handlers ---
  const handleNextPage = () => {
    setCurrentPage(prevPage => prevPage + 1);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prevPage => prevPage - 1);
    }
  };


  return (
    <>
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-blue-900 dark:text-[lab(49_18.52_-85.84)]">
            Published Notices
          </h1>
          <Link
            href="/admin/noticeboard/publishNotice"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Publish New Notice
          </Link>
        </div>

        <div className="space-y-4">
          {/* {mockNotices.map((notice, idx) => ( //edit this */}
          {loading ? (
            <p>Loading notices...</p>
          ) : notices.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              {currentPage > 1 ? "You've reached the end." : "No notices found."}
            </p> // changed - SS
          ) : (
            // aaply the link and preview fxn
            notices.map((notice) => (
            <Link
            href={`/admin/noticeboard/${notice.id}`}
            
            // For each notice, a unique link is created.
            // If notice.id is "abc-123", the URL becomes "/admin/noticeboard/abc-123"
              key={notice.id}
              // className={`p-4 rounded-xl shadow-sm ${typeStyles[notice.type]}`}
              className='block' // makes the area clickable
            >
              <Card
                className={`cursor-pointer border-2 rounded-2xl shadow-sm transition-all hover:shadow-md ${typeStyles[notice.type]}`}
              >
                <CardHeader className="flex flex-row items-center gap-2 pb-1">
                  {getIcon(notice.type)}
                  <span className="text-sm font-semibold text-gray-700">
                    ({notice.type})
                  </span>
                </CardHeader>

                <CardContent className="pt-0">
                  <CardTitle className="text-xl font-bold text-gray-800 mb-1">
                    {notice.title}
                  </CardTitle>

                  <CardDescription className="text-gray-700 mb-2">
                    {createPreview(notice.description, 150)}
                  </CardDescription>

                  <div className="text-sm text-gray-700 space-y-1">
                    <p> 
                      {/* shows invalid date for now */}
                      <strong>Time:</strong> {new Date(notice.time).toLocaleString()}
                    </p>
                    <p>
                      <strong>Recipient:</strong> {notice.recipient}
                    </p>
                    <p>
                      <strong>Location:</strong> {notice.location}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
        </div> 

        <div className="flex justify-center items-center space-x-4 mt-8">
          <button
            onClick={handlePrevPage}
            disabled={currentPage === 1 || loading}
            className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-400 transition"
          >
            Previous
          </button>
          <span className="text-lg font-medium text-gray-700">
            Page {currentPage}
          </span>
          <button
            onClick={handleNextPage}
            // button is disabled if we know there are no more pages or if it's loading
            disabled={!hasMorePages || loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            Next
          </button>
        </div>

      </div>
    </>
  );
}
