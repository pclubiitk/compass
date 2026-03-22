import { useEffect, useState } from "react";
import {
  formatEventTimeRange,
  getMinutesSinceDayStart,
} from "@/calendar/helpers";

interface IProps {
  firstVisibleHour: number;
  lastVisibleHour: number;
  pixelsPerMinute?: number; // allow zoom later
}

export function CalendarTimeline({
  firstVisibleHour,
  lastVisibleHour,
  pixelsPerMinute = 1,
}: IProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60 * 1000);

    return () => clearInterval(timer);
  }, []);

  const currentMinutes = getMinutesSinceDayStart(currentTime);
  const visibleStartMinutes = firstVisibleHour * 60;
  const visibleEndMinutes = lastVisibleHour * 60;

  if (
    currentMinutes < visibleStartMinutes ||
    currentMinutes >= visibleEndMinutes
  )
    return null;

  const topPx =
    (currentMinutes - visibleStartMinutes) * pixelsPerMinute;

  const formattedTime = currentTime.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <div
      className="pointer-events-none absolute inset-x-0 z-50 border-t border-primary"
      style={{ top: `${topPx}px` }}
    >
      <div className="absolute left-0 top-0 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary" />

      <div className="absolute -left-18 flex w-16 -translate-y-1/2 justify-end bg-background pr-1 text-xs font-medium text-primary">
        {formattedTime}
      </div>
    </div>
  );
}