"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { Search, Share2, Copy } from "lucide-react";
import ShareDialog from "./ShareDialog";
import Link from "next/link";
import { toast } from "sonner";

interface Notice {
  id: string;
  title: string;
  description: string;
  body: string;
  entity: string;
  location: string;
  eventTime: string;
}

const NoticeCard = ({
  notice,
  onShare,
  onCopy,
}: {
  notice: Notice;
  onShare: (notice: Notice) => void;
  onCopy: (notice: Notice) => void;
}) => (
  <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow group">
    <h2 className="text-xl font-bold text-gray-800 group-hover:text-blue-600 transition-colors">
      {notice.title}
    </h2>
    <p className="text-gray-600 mt-2">{notice.description}</p>
    <div className="text-sm text-gray-500 mt-4">
      <span>
        <strong>Location:</strong> {notice.location}
      </span>
      <span className="ml-4">
        <strong>Time:</strong> {new Date(notice.eventTime).toLocaleString()}
      </span>
    </div>
    <div className="flex items-center space-x-4 mt-4 pt-4 border-t border-gray-100">
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onShare(notice);
        }}
        className="flex items-center space-x-2 text-sm text-gray-500 hover:text-blue-600 transition-colors"
      >
        <Share2 className="w-4 h-4" />
        <span>Share</span>
      </button>
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onCopy(notice);
        }}
        className="flex items-center space-x-2 text-sm text-gray-500 hover:text-blue-600 transition-colors"
      >
        <Copy className="w-4 h-4" />
        <span>Copy</span>
      </button>
    </div>
  </div>
);

export default function NoticeBoardPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [shareNotice, setShareNotice] = useState<Notice | null>(null);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
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
           // TODO: add correct interface for noticeboard_list
          const newNotices = [
            ...prev,
            ...json.noticeboard_list.map((n: any) => ({
              ...n,
              id: n.NoticeId || n.id,
            })),
          ];
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

  useEffect(() => {
    fetchNotices();
  }, [page, fetchNotices]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (!isSearching && entries[0].isIntersecting && hasMore && !loading) {
          setPage((prev) => prev + 1);
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

  //cache and fuzzy search effect
  useEffect(() => {
    const timeout = setTimeout(async () => {
      const query = searchTerm.trim();
      if (!query) {
        setIsSearching(false);
        setPage(1);
        setNotices([]);
        return;
      }

      setIsSearching(true);

      const CACHE_KEY = "notice_search_cache";
      const rawCache = localStorage.getItem(CACHE_KEY);
      const cache = rawCache ? JSON.parse(rawCache) : {};

      // Checking cache first
      if (cache[query]) {
        setNotices(cache[query]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const res = await fetch(
          `${
            process.env.NEXT_PUBLIC_MAPS_URL
          }/api/maps/notice/fuzzy?query=${encodeURIComponent(query)}&limit=20`
        );
        if (!res.ok) throw new Error(`Failed (status: ${res.status})`);
        const data = await res.json();
        const results = data.notices || [];

        setNotices(results);

        // Saving to cache
        cache[query] = results;
        localStorage.setItem(CACHE_KEY, JSON.stringify(cache));

        // Auto-clearing if cache exceeds 5 MB
        const cacheSize = new Blob([JSON.stringify(cache)]).size;
        const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
        if (cacheSize > MAX_SIZE) {
          // console.warn("Cache exceeded 5 MB. Clearing localStorage cache.");
          localStorage.removeItem(CACHE_KEY);
        }
      } catch {
        // console.error("Fuzzy search error:", err);
        toast.error("Error searching notice.");
      } finally {
        setLoading(false);
      }
    }, 300); // debounce delay

    return () => clearTimeout(timeout);
  }, [searchTerm]);

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

        <div className="relative mb-8">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search notices by title, content, or department..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-400 shadow-sm text-gray-800 placeholder-gray-500 transition-all"
          />
        </div>

        <div className="space-y-6">
          {notices.length > 0 ? (
            notices.map((notice) => (
              <Link
                href={`/noticeboard/${notice.id}`}
                key={notice.id}
                className="block no-underline"
              >
                <NoticeCard
                  notice={notice}
                  onShare={() => handleShare(notice)}
                  onCopy={handleCopy}
                />
              </Link>
            ))
          ) : !loading ? (
            <p className="text-center text-gray-500 py-12">
              No notices available at the moment.
            </p>
          ) : null}
        </div>

        {notices.length > 0 && (
          <div ref={loaderRef} className="text-center py-6 text-gray-500">
            {loading
              ? "Loading more notices..."
              : hasMore
              ? "Scroll down to load more"
              : "You've reached the end."}
          </div>
        )}
      </div>

      {shareNotice && (
        <ShareDialog
          url={`${shareNotice.id}`}
          title={shareNotice.title}
          onClose={() => setShareNotice(null)}
        />
      )}
    </div>
  );
}