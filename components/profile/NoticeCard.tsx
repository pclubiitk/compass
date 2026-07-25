import { useRouter } from "next/navigation";

import { Share2, Copy, Edit, Trash, ImageIcon } from "lucide-react";

import { useGContext } from "@/components/ContextProvider";
import { toast } from "sonner";
import { Notice } from "@/lib/types";

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
    const router = useRouter();

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



    return (
        <div

            className="bg-white p-4 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow group cursor-pointer"
        >
            <div className="flex gap-4">
                {/* Left: fixed-size thumbnail */}
                <div className="flex-shrink-0 w-20 h-20 rounded-md bg-gray-100 overflow-hidden flex items-center justify-center">
                    {notice.coverPic ? (
                        <img
                            src={`${process.env.NEXT_PUBLIC_ASSET_URL}/assets/${notice.coverPic.imageId}.webp`}
                            alt="Cover"
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <ImageIcon className="w-6 h-6 text-gray-400" />
                    )}
                </div>

                {/* Right: content */}
                <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-bold text-gray-800 group-hover:text-blue-600 transition-colors truncate">
                        {notice.title}
                    </h2>
                    <p className="text-sm text-gray-600 mt-1 overflow-hidden line-clamp-2">
                        {notice.description}
                    </p>
                    <div className="text-xs text-gray-500 mt-2 flex flex-wrap gap-x-4 gap-y-1">
                        <span>
                            <strong>Location:</strong> {notice.location}
                        </span>
                        <span>
                            <strong>Time:</strong>{" "}
                            {new Date(notice.eventTime).toLocaleString()}
                        </span>
                    </div>
                </div>
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
