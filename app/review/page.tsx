'use client';

import { useSearchParams } from 'next/navigation';

export default function ReviewPage() {
    const searchParams = useSearchParams();
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');

    return (
        <div className="p-6">
            <h2 className="text-xl font-bold mb-4">Reviews</h2>
            <h1 className="text-3xl mb-4 text-gray-700">Name</h1>

            <div>
                <label className="block mb-1 font-semibold">Rating</label>
            </div>
            <div className="mb-4">
                <label className="block mb-1 font-semibold">Description</label>
            </div>
            <div className="mb-4">
                <label className="block mb-1 font-semibold">Images</label>

                {/*<input type="file" className="border p-2 w-full rounded" />*/}
            </div>
        </div>
    );
}
