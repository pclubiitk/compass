"use client";

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
// In a real app, you would install and import this:
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { Notice } from "@/lib/types";
export default function UserNoticeDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [notice, setNotice] = useState<Notice | null>(null);
  const [loading, setLoading] = useState(true);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

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

        setNotice(data);
        console.log("Fetched notice:", data);
      } catch (err) {
        console.error("Failed to fetch notice:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchNotice();
  }, [id]);

  // Lock page scroll while lightbox is open, and allow Esc to close
  useEffect(() => {
    if (!lightboxUrl) return;
    document.body.style.overflow = "hidden";
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxUrl(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [lightboxUrl]);

  if (loading) return <div className="p-10 text-center">Loading notice...</div>;
  if (!notice) return <div className="p-10 text-center">Sorry, we couldn`&apos;`t find that notice.</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto p-8 bg-white rounded-lg shadow-md">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
          {notice.title}
        </h1>
        {notice.coverPic ? (
          <img
            src={`${process.env.NEXT_PUBLIC_ASSET_URL}/assets/${notice.coverPic.ImageID}.webp`}
            alt="Cover"
            className="w-full h-64 object-cover rounded-lg mb-6"
            onClick={() =>
              setLightboxUrl(`${process.env.NEXT_PUBLIC_ASSET_URL}/assets/${notice.coverPic?.ImageID}.webp`)
            }
          />
        ) : (
          <p className="text-gray-500">No cover image available</p>
        )}
        {notice.bioPics && notice.bioPics.length > 0 && (
          <div className="flex space-x-4 mb-6">
            {notice.bioPics.map((bioPic, index) => (
              <img src={`${process.env.NEXT_PUBLIC_ASSET_URL}/assets/${bioPic.ImageID}.webp`} alt={`Bio Pic ${index + 1}`} key={index} className="w-24 h-24 object-cover rounded-lg"
                onClick={() =>
                  setLightboxUrl(`${process.env.NEXT_PUBLIC_ASSET_URL}/assets/${bioPic.ImageID}.webp`)
                } />
            ))}
          </div>
        )}

        <div className="text-sm text-gray-500 mb-6">
          <span><strong>Location:</strong> {notice.location}</span>
          <span className="ml-4">
            <strong>Time:</strong> {new Date(notice.eventTime).toLocaleString()} {notice.eventEndTime ? "To " + (new Date(notice.eventEndTime).toLocaleString()) : null}
          </span>
        </div>

        <article className="markdown-content">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {notice.body}
          </ReactMarkdown>
        </article>
      </div>

      {/* Lightbox overlay */}
      {lightboxUrl && (
        <div
          onClick={() => setLightboxUrl(null)}
          className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50 p-4"
        >
          <button
            onClick={() => setLightboxUrl(null)}
            className="absolute top-4 right-4 text-white text-3xl leading-none"
            aria-label="Close"
          >
            &times;
          </button>
          <img
            src={lightboxUrl}
            alt="Full size"
            onClick={(e) => e.stopPropagation()}
            className="max-w-full max-h-full object-contain rounded-lg"
          />
        </div>
      )}
    </div>
  );
}