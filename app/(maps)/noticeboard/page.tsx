"use client";

import  { useState, useEffect, useRef, useCallback } from "react";
import { Search } from "lucide-react";
import ShareDialog from "../../../components/ui/ShareDialog";
import Link from "next/link";
import { useGContext } from "@/components/ContextProvider";
import { toast } from "sonner";

import { NoticeCard } from "@/components/noticeboard/NoticeComponent";

interface Notice {
  id: string;
  title: string;
  description: string;
  body: string;
  entity: string;
  location: string;
  eventTime: string;
}


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
        `${process.env.NEXT_PUBLIC_MAPS_URL}/api/maps/notice?page=${page}`,
      );
      if (!res.ok) throw new Error(`Failed (status: ${res.status})`);
      const json = await res.json();

      if (json?.noticeboard_list?.length > 0) {
        setNotices((prev) => {
          // TODO: add correct interface for noticeboard_list
   const incoming = json.noticeboard_list.map((n:any)=>({
  ...n,
  id:n.NoticeId || n.id
}));

const newNotices = [
  ...prev,
  ...incoming.filter(
    (n:any)=>!prev.some(p=>p.id===n.id)
  )
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
  }, [page]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (!isSearching && entries[0].isIntersecting && hasMore && !loading) {
          setPage((prev) => prev + 1);
        }
      },
      { threshold: 1.0 },
    );
    const current = loaderRef.current;
    if (current) observer.observe(current);
    return () => {
      if (current) observer.unobserve(current);
    };
  }, [hasMore, loading]);

  //cache and fuzzy search effect
  // Cache and fuzzy search effect
  useEffect(() => {
    const timeout = setTimeout(async () => {
      const query = searchTerm.trim();

      // If search is empty, reset to paginated view
      if (!query) {
    if(isSearching){

    setIsSearching(false);
    setNotices([]);
    setPage(1);
    setHasMore(true);

  }
        return;
      }

      setIsSearching(true);
      setLoading(true);

      const CACHE_KEY = "notice_search_cache";

      try {
        const rawCache = localStorage.getItem(CACHE_KEY);
        const cache = rawCache ? JSON.parse(rawCache) : {};

        let results;

        // Check cache first
        if (cache[query]) {
          results = cache[query];
        } else {
          // Fetch from API
          const res = await fetch(
            `${process.env.NEXT_PUBLIC_MAPS_URL}/api/maps/notice/fuzzy?query=${encodeURIComponent(query)}&limit=20`,
          );

          if (!res.ok) throw new Error(`Failed (status: ${res.status})`);

          const data = await res.json();
          results = data.results || [];

          // Save to cache
          const newCache = { ...cache, [query]: results };
          const cacheSize = new Blob([JSON.stringify(newCache)]).size;
          const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

          if (cacheSize > MAX_SIZE) {
            // Keep only current result if cache is too large
            localStorage.setItem(
              CACHE_KEY,
              JSON.stringify({ [query]: results }),
            );
          } else {
            localStorage.setItem(CACHE_KEY, JSON.stringify(newCache));
          }
        }

        // Map results to match Notice interface
        const mappedResults = results.map((n: any) => ({
          ...n,
          id: n.NoticeId || n.id,
        }));

        setNotices(mappedResults);
        setHasMore(false); // Disable infinite scroll during search
      } catch (err) {
        console.error("Fuzzy search error:", err);
        toast.error("Error searching notices.");
        setNotices([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [searchTerm]);

  const handleShare = (notice: Notice) => {
    setShareNotice(notice);
  };

  const handleCopy = async (notice: Notice) => {
    const text = `${notice.title}\n\n${notice.description}\n\nTime: ${new Date(
      notice.eventTime,
    ).toLocaleString()}\nLocation: ${notice.location}`;
    try {
      await navigator.clipboard.writeText(text);
         toast.success("Notice copied to clipboard!");
    } catch (err) {
      toast.error("Failed to copy notice. Please try manually.");
      console.error(err);
    }
  };

  const { isAdmin } = useGContext();

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 overflow-y-scroll max-h-[100vh]">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">
          Campus Notices
        </h1>

        <div className="relative mb-8">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          {isAdmin ? (
            <button
              type="button"
              onClick={() => {
                window.location.href = "/admin/publishNotice";
              }}
              className="absolute inset-y-0 right-2 my-auto
             h-8 px-3
             flex items-center gap-1 cursor-pointer
             rounded-xl bg-blue-500 text-white
             hover:bg-blue-600 shadow
             transition active:scale-95"
            >
              <span className="text-lg font-semibold">+</span>
              <span className="text-sm font-medium whitespace-nowrap">
                Publish a Notice
              </span>
            </button>
          ) : null}

          <input
            type="text"
            placeholder="Search notices by title, content, or department..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-44 py-3 rounded-xl
               border border-gray-300 focus:ring-2 focus:ring-blue-400
               shadow-sm text-gray-800 placeholder-gray-500 transition-all"
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
    </div>
  );
}
