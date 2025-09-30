"use client"
import { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle, AlertTriangle, Ban } from 'lucide-react';
import { useEffect, useState } from 'react';


// export const metadata: Metadata = {
//   title: 'Noticeboard',
// };

const mapServer = "http://localhost:8081"; //edit this

interface Notice {
  id: string
  title: string
  description: string
  type: "Event" | "Warning" | "Ban"
  // publisher: string
  recipient: string
  location: string
  time: string
}

export default function Page() {
  // const mockNotices = [];
  const [notices, setNotices] = useState<Notice[]>([])
  const [loading, setLoading] = useState(true)

  const typeStyles: Record<string, string> = {
    Event: 'bg-green-50 border-l-4 border-green-500',
    Warning: 'bg-yellow-50 border-l-4 border-yellow-500',
    Ban: 'bg-red-50 border-l-4 border-red-500',
  };

  const getIcon = (type: string) => {
    const baseClass = 'w-6 h-6';
    switch (type) {
      case 'Event':
        return <div className="min-w-min flex items-center gap-2"><CheckCircle className={`${baseClass} text-green-600`} /></div>;
      case 'Warning':
        return <div className="min-w-min flex items-center gap-2"><AlertTriangle className={`${baseClass} text-yellow-600`} /></div>;
      case 'Ban':
        return <div className="min-w-min flex items-center gap-2"><Ban className={`${baseClass} text-red-600`} /></div>;
      default:
        return null;
    }
  };

  useEffect(() => {
    const fetchNotices = async () => {
      try {
        const res = await fetch(
          `${mapServer}/api/maps/notice?page=1`
        )
        const data = await res.json()

        // adapt based on backend response shape
        const formatted: Notice[] = data.noticeboard_list.map((n: any) => ({
          id: n.id,
          title: n.title,
          description: n.description,
          type: n.type || "Event", // fallback until backend provides
          // publisher: n.user?.name || "Admin",
          recipient: n.recipient || "All",
          location: n.location || "Campus",
          time: n.created_at,
        }))

        setNotices(formatted)
      } catch (err) {
        console.error("Failed to fetch notices:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchNotices()
  }, [])


  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 px-6 py-10">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-blue-900">Published Notices</h1>
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
            <p>No notices found.</p>
          ) : (
            notices.map((notice) => (
            <div
              key={notice.id}
              className={`p-4 rounded-xl shadow-sm ${typeStyles[notice.type]}`}
            >
              <div className="flex items-center space-x-2">
                {getIcon(notice.type)}
                <span className="text-sm text-gray-600">({notice.type})</span>
              </div>
              <h2 className="text-xl font-semibold text-gray-700 placeholder:text-gray-400">{notice.title}</h2>
              <p className="text-gray-700 mt-1">{notice.description}</p>
              <p className="text-sm text-gray-600 mt-2">
                {/* <strong>Publisher:</strong> {notice.publisher} <br /> */}
                <strong>Time:</strong> {new Date(notice.time).toLocaleString()} <br />
                <strong>Recipient:</strong> {notice.recipient} <br />
                <strong>Location:</strong> {notice.location}
              </p>
            </div>
          ))
        )}
        </div>
      </div>
    </div>
  );
}
