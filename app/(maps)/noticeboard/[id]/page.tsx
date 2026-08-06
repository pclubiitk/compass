"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  AuthenticatedImage,
  buildReviewImageUrl,
  getImageId,
  getImageStatus,
} from "@/app/components/user/AuthenticatedImage";

interface Image {
  id: string;
  url?: string;
  status?: string;
  parentAssetId?: string;
  parentAssetType?: string;
}

interface Notice {
  id: string;
  title: string;
  description: string;
  body: string;
  type: string;
  location: string;
  time: string;
  eventEndTime?: string;
  coverpic?: unknown;
  biopics?: Image[];
}

export default function UserNoticeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [notice, setNotice] = useState<Notice | null>(null);
  const [loading, setLoading] = useState(true);
  const [imgIndex, setImgIndex] = useState(0);

  useEffect(() => {
    if (!id) return;
    setImgIndex(0);

    const fetchNotice = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_MAPS_URL}/api/maps/notice/${id}`
        );
        if (!res.ok) throw new Error("Notice not found");

        const data = await res.json();

        function valid(iso: string | undefined | null): string {
          if (!iso) return "";
          const d = new Date(iso);
          return isNaN(d.getTime()) || d.getFullYear() <= 1 ? "" : iso;
        }

        setNotice({
          id: data.id,
          title: data.title,
          description: data.description,
          body: data.body,
          type: data.entity,
          location: data.location,
          time: valid(data.eventTime),
          eventEndTime: valid(data.eventEndTime) || undefined,
          coverpic: data.coverpic,
          biopics: data.biopics,
        });
      } catch (err) {
        console.error("Failed to fetch notice:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchNotice();
  }, [id]);

  const seenImageIds = new Set<string>();
  const biopicItems = [notice?.coverpic, ...(notice?.biopics || [])]
    .map((pic) => ({
      id: getImageId(pic) || "",
      status: getImageStatus(pic),
    }))
    .filter(({ id }) => {
      if (!id || seenImageIds.has(id)) return false;
      seenImageIds.add(id);
      return true;
    });

  const prevImg = useCallback(() => {
    setImgIndex((i) => (i > 0 ? i - 1 : biopicItems.length - 1));
  }, [biopicItems.length]);

  const nextImg = useCallback(() => {
    setImgIndex((i) => (i < biopicItems.length - 1 ? i + 1 : 0));
  }, [biopicItems.length]);

  const activeImgIndex = Math.min(imgIndex, Math.max(0, biopicItems.length - 1));

  if (loading) return <div className="p-10 text-center">Loading notice...</div>;
  if (!notice) return <div className="p-10 text-center">Sorry, we couldn&apos;t find that notice.</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto p-8 bg-white rounded-lg shadow-md">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
          {notice.title}
        </h1>
        <div className="text-sm text-gray-500 mb-6">
          <button
            onClick={() => router.push(`/maps?search=${encodeURIComponent(notice.location)}`)}
            className="hover:text-blue-600 transition-colors text-left"
          >
            <strong>Location:</strong> {notice.location}
          </button>
          {notice.time ? (
            <span className="ml-4">
              <strong>Start:</strong> {new Date(notice.time).toLocaleString()}
            </span>
          ) : null}
          {notice.eventEndTime ? (
            <span className="ml-4">
              <strong>End:</strong> {new Date(notice.eventEndTime).toLocaleString()}
            </span>
          ) : null}
        </div>

        {biopicItems.length > 0 ? (
          <div className="relative w-full h-64 mb-6 rounded-lg overflow-hidden bg-muted">
            <AuthenticatedImage
              src={buildReviewImageUrl(biopicItems[activeImgIndex].id, biopicItems[activeImgIndex].status).url}
              alt={notice.title}
              className="w-full h-full object-cover"
              requiresAuth={buildReviewImageUrl(biopicItems[activeImgIndex].id, biopicItems[activeImgIndex].status).requiresAuth}
            />
            {biopicItems.length > 1 && (
              <>
                <button
                  onClick={prevImg}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-1 transition"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={nextImg}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-1 transition"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {biopicItems.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setImgIndex(i)}
                      className={`w-2 h-2 rounded-full transition ${i === activeImgIndex ? "bg-white" : "bg-white/40"}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        ) : null}

        <article className="markdown-content">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {notice.body}
          </ReactMarkdown>
        </article>
      </div>
    </div>
  );
}
