// Replace the entire content of this file with the code below.

"use client";
import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

// --- IMPORTANT: Make sure these are imported ---
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Notice {
  id: string;
  title: string;
  description: string;
  body: string;
  type: string;
  recipient: string;
  location: string;
  time: string;
}

const mapServer = process.env.NEXT_PUBLIC_MAPS_URL;

export default function NoticeDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [notice, setNotice] = useState<Notice | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Safety check: Don't fetch if the ID isn't available yet.
    if (!id || id === 'undefined') {
      return;
    }

    const fetchNotice = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${mapServer}/api/maps/notice/${id}`);
        if (!res.ok) {
          throw new Error('Notice not found');
        }
        const data = await res.json();
        
        // The backend response uses different field names, so we map them here.
        setNotice({
          id: data.id,
          title: data.title,
          description: data.description,
          body: data.body,
          type: data.entity,
          recipient: data.recipient || "All",
          location: data.location,
          time: data.eventTime,
        });
      } catch (err: any) {
        console.error("Failed to fetch notice:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchNotice();
  }, [id]);

  if (loading) return <div className="p-10 text-center">Loading notice...</div>;
  if (!notice) return <div className="p-10 text-center">Notice not found.</div>;
  console.log(notice.description);
  return (
    <div className="max-w-4xl mx-auto p-8 bg-white dark:bg-gray-800 rounded-lg shadow-md my-10">
      <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">{notice.title}</h1>
      <div className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        <span><strong>Location:</strong> {notice.location}</span>
        <span className="ml-4"><strong>Time:</strong> {new Date(notice.time).toLocaleString()}</span>
      </div>
    
      <article className="markdown-content">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {notice.body}
        </ReactMarkdown>
      </article>
    </div>
  );
}