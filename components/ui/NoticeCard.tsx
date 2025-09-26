'use client';

import React, { useState, useEffect } from 'react';
import {
  Share2,
  Calendar,
  MapPin,
  Building,
} from 'lucide-react';
import { Notice } from '@/lib/types';

function NoticeCard({
  notice,
  isExpanded,
  onToggleExpand,
  
  onShare,
}: {
  notice: Notice;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onShare: (notice: Notice) => void;
   onCopy: (notice: Notice) => void;
}) {
  const formattedDate = new Date(notice.eventTime).toLocaleString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const truncatedDescription =
    notice.description.length > 120
      ? notice.description.slice(0, 120) + '...'
      : notice.description;

  // defining carousel state for biopics
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!notice.biopics || notice.biopics.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % notice.biopics.length);
    }, 2000); // this is auto scroll every 2s

    return () => clearInterval(interval);
  }, [notice.biopics]);

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-md transition hover:shadow-lg overflow-hidden">
      <div className="p-6 space-y-3">
        <div className="flex lg:flex-row flex-col justify-between items-start">
          <h3 className="text-xl font-semibold text-gray-900">{notice.title}</h3>
          <span className="flex items-center gap-1 text-xs font-medium bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
            <Building className="w-3 h-3" />
            {notice.entity}
          </span>
        </div>

        {/* Cover Picture */}
        {notice.coverpic && (
          <img
           src={`/assets/${notice.coverpic.id}.webp`}
            alt="Cover"
            className="w-full h-48 object-cover rounded-lg"
          />
        )}

        <p className="text-gray-700 text-sm leading-relaxed">
          {isExpanded ? notice.description : truncatedDescription}
        </p>

        {/* Bio Pics Carousel */}
        {notice.biopics && notice.biopics.length > 0 && (
          <div className="relative w-full h-40 overflow-hidden rounded-lg">
            <div
              className="flex transition-transform duration-500 ease-in-out"
              style={{
                transform: `translateX(-${currentIndex * 100}%)`,
                width: `${notice.biopics.length * 100}%`,
              }}
            >
              {notice.biopics.map((pic) => (
                <img
                  key={pic.id}
    src={`/assets/${pic.id}.webp`}
                  alt="Bio"
                  className="w-full h-40 object-cover flex-shrink-0"
                />
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-2 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            {formattedDate}
          </div>
          <div className="flex items-center gap-2 col-span-2 sm:col-span-1">
            <MapPin className="w-4 h-4 text-gray-500" />
            {notice.location}
          </div>
        </div>
      </div>

      <div className="border-t border-gray-100 px-6 py-3 flex justify-between items-center bg-gray-50">
        <button
          onClick={onToggleExpand}
          className="text-sm text-blue-600 hover:text-blue-800 font-medium transition hover:underline"
        >
          {isExpanded ? 'Show less' : 'Details'}
        </button>
        <div className="flex gap-2">
          <button
            onClick={() => onShare(notice)}
            className="w-9 h-9 rounded-full bg-white border border-gray-300 hover:bg-gray-100 flex items-center justify-center"
            title="Share"
            aria-label="Share notice"
          >
            <Share2 className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default NoticeCard;
