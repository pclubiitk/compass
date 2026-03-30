import { useRouter } from "next/navigation";

import {  Share2, Copy, Edit, Trash } from "lucide-react";


import { useGContext } from "@/components/ContextProvider";
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
  onEdit?: (notice: Notice) => void;
}) => {
  const { isAdmin } = useGContext();

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const confirmed = window.confirm(
      "Are you sure you want to delete this notice? This action cannot be undone.",
    );

    if (!confirmed) return; // user clicked Cancel

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