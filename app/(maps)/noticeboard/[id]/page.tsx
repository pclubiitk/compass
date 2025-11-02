"use client";

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
// In a real app, you would install and import this:
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Notice {
  id: string;
  title: string;
  description: string;
  body: string;
  type: string;
  location: string;
  time: string;
}

export default function UserNoticeDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [notice, setNotice] = useState<Notice | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const fetchNotice = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_MAPS_URL}/api/maps/notice/${id}`
        );
        if (!res.ok) throw new Error("Notice not found");
        
        const data = await res.json();
        
        setNotice({
          id: data.id,
          title: data.title,
          description: data.description,
          body: data.body,
          type: data.entity,
          location: data.location,
          time: data.eventTime,
        });
      } catch (err) {
        console.error("Failed to fetch notice:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchNotice();
  }, [id]);

  if (loading) return <div className="p-10 text-center">Loading notice...</div>;
  if (!notice) return <div className="p-10 text-center">Sorry, we couldn't find that notice.</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto p-8 bg-white rounded-lg shadow-md">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
          {notice.title}
        </h1>
        <div className="text-sm text-gray-500 mb-6">
          <span><strong>Location:</strong> {notice.location}</span>
          <span className="ml-4">
            <strong>Time:</strong> {new Date(notice.time).toLocaleString()}
          </span>
        </div>
        
        <article className="markdown-content">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {notice.body}
          </ReactMarkdown>
        </article>
      </div>
    </div>
  );
}