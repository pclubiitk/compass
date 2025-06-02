'use client';

import { useRouter } from 'next/navigation';

export default function Page() {
    const router = useRouter();

    const handleReviewClick = () => {
        const lat = 12.34;
        const lng = 56.78;
        router.push(`/review?lat=${lat}&lng=${lng}`);
    };

    return (
        <div className="p-6">
            <p>Home Screen, current location on the map will be shown here</p>
            <button
                onClick={handleReviewClick}
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
            >
                Reviews
            </button>
        </div>
    );
}
