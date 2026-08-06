import { useRouter } from "next/navigation";
import { useState, useCallback, useEffect } from "react";

import { Share2, Copy, Edit, Trash, ChevronLeft, ChevronRight } from "lucide-react";

import { useGContext } from "@/components/ContextProvider";
import { toast } from "sonner";
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
  entity: string;
  location: string;
  eventTime: string;
  eventEndTime?: string;
  coverpic?: unknown;
  biopics?: Image[];
}

const NoticeCard = ({
  notice,
  onShare,
  onCopy,
}: {
  notice: Notice;
  onShare: (notice: Notice) => void;
  onCopy: (notice: Notice) => void;
  onEdit?: (notice: Notice) => void;
}) => {
  const { isAdmin } = useGContext();

  const seenImageIds = new Set<string>();
  const biopicItems = [notice.coverpic, ...(notice.biopics || [])]
    .map((pic) => ({
      id: getImageId(pic) || "",
      status: getImageStatus(pic),
    }))
    .filter(({ id }) => {
      if (!id || seenImageIds.has(id)) return false;
      seenImageIds.add(id);
      return true;
    });
  const [imgIndex, setImgIndex] = useState(0);

  useEffect(() => {
    setImgIndex(0);
  }, [notice.id, biopicItems.length]);

  const activeImgIndex = Math.min(imgIndex, Math.max(0, biopicItems.length - 1));

  const prevImg = useCallback(() => {
    setImgIndex((i) => (i > 0 ? i - 1 : biopicItems.length - 1));
  }, [biopicItems.length]);

  const nextImg = useCallback(() => {
    setImgIndex((i) => (i < biopicItems.length - 1 ? i + 1 : 0));
  }, [biopicItems.length]);

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const confirmed = window.confirm(
      "Are you sure you want to delete this notice? This action cannot be undone.",
    );

    if (!confirmed) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_MAPS_URL}/api/maps/deleteNotice/${notice.id}`,
        {
          method: "DELETE",
          credentials: "include",
        },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete notice");
      }

      const data = await response.json();
      toast.success(data.message || "Notice deleted successfully");

      localStorage.removeItem("notice_search_cache");

      window.location.reload();
    } catch (error) {
      console.error("Error deleting notice:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete notice",
      );
    }
  };

  const router = useRouter();

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow group">
      {biopicItems.length > 0 ? (
        <div className="relative w-full h-48 mb-4 rounded-lg overflow-hidden bg-muted">
          <AuthenticatedImage
            src={buildReviewImageUrl(biopicItems[activeImgIndex].id, biopicItems[activeImgIndex].status).url}
            alt={notice.title}
            className="w-full h-full object-cover"
            requiresAuth={buildReviewImageUrl(biopicItems[activeImgIndex].id, biopicItems[activeImgIndex].status).requiresAuth}
          />
          {biopicItems.length > 1 && (
            <>
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); prevImg(); }}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-1 transition"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); nextImg(); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-1 transition"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                {biopicItems.map((_, i) => (
                  <button
                    key={i}
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setImgIndex(i); }}
                    className={`w-2 h-2 rounded-full transition ${i === activeImgIndex ? "bg-white" : "bg-white/40"}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      ) : null}
      <h2 className="text-xl font-bold text-gray-800 group-hover:text-blue-600 transition-colors">
        {notice.title}
      </h2>
      <p className="text-gray-600 mt-2">{notice.description}</p>
      <div className="text-sm text-gray-500 mt-4">
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            router.push(`/maps?search=${encodeURIComponent(notice.location)}`);
          }}
          className="hover:text-blue-600 transition-colors text-left"
        >
          <strong>Location:</strong> {notice.location}
        </button>
        {notice.eventTime ? (
          <span className="ml-4">
            <strong>Start:</strong> {new Date(notice.eventTime).toLocaleString()}
          </span>
        ) : null}
        {notice.eventEndTime ? (
          <span className="ml-4">
            <strong>End:</strong> {new Date(notice.eventEndTime).toLocaleString()}
          </span>
        ) : null}
      </div>
      <div className="flex items-center space-x-4 mt-4 pt-4 border-t border-gray-100">
        {isAdmin && (
          <>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                router.push(`/admin/publishNotice?noticeid=${notice.id}`);
              }}
              className="flex items-center space-x-2 text-sm text-gray-500 hover:text-blue-600 transition-colors"
            >
              <Edit className="w-4 h-4" />
              <span>Edit</span>
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleDelete(e);
              }}
              className="flex items-center space-x-2 text-sm text-gray-500 hover:text-red-600 transition-colors"
            >
              <Trash className="w-4 h-4" />
              <span>Delete</span>
            </button>
          </>
        )}
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
};

export { NoticeCard };
