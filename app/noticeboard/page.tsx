"use client";

import React, {
  useState,
  useMemo,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { Search } from "lucide-react";
import { Notice } from "@/lib/types";
import NoticeCard from "@/components/ui/NoticeCard";
import ShareDialog from "./ShareDialog";

export default function NoticeBoardPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedCards, setExpandedCards] = useState(new Set<string>());
  const [shareNotice, setShareNotice] = useState<Notice | null>(null);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // TODO: Enable the search query in the page so the id of the notice can be directly shared

  const loaderRef = useRef<HTMLDivElement | null>(null);

  const fetchNotices = useCallback(async () => {
    if (!hasMore || loading) return;
    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_MAPS_URL}/api/maps/notice?page=${page}`
      );
      if (!res.ok) throw new Error(`Failed (status: ${res.status})`);
      const json = await res.json();

      if (json?.noticeboard_list?.length > 0) {
        setNotices((prev) => {
          const newNotices = [...prev, ...json.noticeboard_list];
          setHasMore(newNotices.length < json.total_notices);
          return newNotices;
        });
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error("Error fetching notices:", err);
    } finally {
      setLoading(false);
    }
  }, [page, hasMore, loading]);

  // this triggers fetch when page changes
  useEffect(() => {
    fetchNotices();
  }, [page]);

  // this is intersectionObserver to detect scroll bottom
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          setPage((prev) => prev + 1); // increment only when visible and fetch done
        }
      },
      { threshold: 1.0 }
    );

    const current = loaderRef.current;
    if (current) observer.observe(current);

    return () => {
      if (current) observer.unobserve(current);
    };
  }, [hasMore, loading]);

  const filteredNotices = useMemo(() => {
    return notices.filter((notice) =>
      [notice.title, notice.description, notice.entity]
        .join(" ")
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, notices]);

  const toggleExpand = (noticeId: string) => {
    setExpandedCards((prev) => {
      const newSet = new Set(prev);
      newSet.has(noticeId) ? newSet.delete(noticeId) : newSet.add(noticeId);
      return newSet;
    });
  };

  const handleShare = (notice: Notice) => {
    setShareNotice(notice);
  };

  const handleCopy = async (notice: Notice) => {
    const text = `${notice.title}\n\n${notice.description}\n\nTime: ${new Date(
      notice.eventTime
    ).toLocaleString()}\nLocation: ${notice.location}`;
    try {
      await navigator.clipboard.writeText(text);
      alert("Notice copied to clipboard!");
    } catch (err) {
      alert("Failed to copy notice. Please try manually.");
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">
          Campus Notices
        </h1>

        <div className="space-y-6">
          {filteredNotices.length > 0 ? (
            filteredNotices.map((notice) => (
              <NoticeCard
                key={notice.id}
                notice={notice}
                isExpanded={expandedCards.has(notice.id)}
                onToggleExpand={() => toggleExpand(notice.id)}
                onShare={handleShare}
                onCopy={handleCopy}
              />
            ))
          ) : loading ? (
            <p className="text-center text-gray-500 py-12">
              No notices available at the moment.
            </p>
          ) : null}
        </div>

        {/* this is loader for infinite scroll */}
        {filteredNotices.length > 0 && (
          <div ref={loaderRef} className="text-center py-6 text-gray-500">
            {loading
              ? "Loading more notices..."
              : hasMore
              ? "Scroll down to load more"
              : "No more notices"}
          </div>
        )}
      </div>

      {shareNotice && (
        <ShareDialog
          url={`${window.location.origin}/noticeboard#${shareNotice.id}`}
          title={shareNotice.title}
          onClose={() => setShareNotice(null)}
        />
      )}
    </div>
  );
}
