import {
  addDays,
  addMonths,
  addWeeks,
  subDays,
  subMonths,
  subWeeks,
  isSameWeek,
  isSameDay,
  isSameMonth,
  startOfWeek,
  startOfMonth,
  endOfMonth,
  endOfWeek,
  format,
  eachDayOfInterval,
  startOfDay,
  differenceInDays,
  endOfYear,
  startOfYear,
  subYears,
  addYears,
  isSameYear,
  isWithinInterval,
} from "date-fns";

import type { ICalendarCell, IEvent } from "@/calendar/interfaces";
import type { TCalendarView, TVisibleHours, TWorkingHours } from "@/calendar/types";


export const PIXELS_PER_MINUTE = 1;
export const MINUTES_PER_DAY = 1440;
export const DAY_HEIGHT = PIXELS_PER_MINUTE * MINUTES_PER_DAY;


/* ============================================================
  CORE TIME NORMALIZATION (BACKEND SAFE)
============================================================ */

export function toDate(value: string | Date): Date {
  return value instanceof Date ? value : new Date(value);
}

export function getMinutesSinceDayStart(date: Date): number {
  return (
    date.getHours() * 60 +
    date.getMinutes() +
    date.getSeconds() / 60
  );
}

export function formatHourLabel(hour: number) {
  const d = new Date();
  d.setHours(hour, 0, 0, 0);
  return d.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatEventTimeRange(start: Date, end: Date) {
  const opts: Intl.DateTimeFormatOptions = {
    hour: "numeric",
    minute: "2-digit",
  };

  return `${start.toLocaleTimeString([], opts)} – ${end.toLocaleTimeString([], opts)}`;
}

/* ============================================================
  Header helpers
============================================================ */

export function rangeText(view: TCalendarView, date: Date) {
  const formatString = "MMM d, yyyy";
  let start: Date;
  let end: Date;

  switch (view) {
    case "agenda":
    case "month":
      start = startOfMonth(date);
      end = endOfMonth(date);
      break;
    case "year":
      start = startOfYear(date);
      end = endOfYear(date);
      break;
    case "week":
      start = startOfWeek(date);
      end = endOfWeek(date);
      break;
    case "day":
      return format(date, formatString);
    default:
      return "Invalid range";
  }

  return `${format(start, formatString)} - ${format(end, formatString)}`;
}

export function navigateDate(
  date: Date,
  view: TCalendarView,
  direction: "previous" | "next"
): Date {
  const ops = {
    agenda: direction === "next" ? addMonths : subMonths,
    year: direction === "next" ? addYears : subYears,
    month: direction === "next" ? addMonths : subMonths,
    week: direction === "next" ? addWeeks : subWeeks,
    day: direction === "next" ? addDays : subDays,
  };

  return ops[view](date, 1);
}

export function getEventsBreakdown(
  events: IEvent[],
  date: Date,
  view: TCalendarView
): { classCount: number; eventCount: number } {
  const breakdown = { classCount: 0, eventCount: 0 };

  const countEvents = (filteredEvents: IEvent[]) => {
    for (const event of filteredEvents) {
      const isClass =
        event.title.startsWith("Lec-") ||
        event.title.startsWith("Tut-") ||
        event.title.startsWith("Prc-");
      if (isClass) {
        breakdown.classCount++;
      } else {
        breakdown.eventCount++;
      }
    }
    return breakdown;
  };

  // For day view: count events that START on this day OR span across it
  if (view === "day") {
    return countEvents(
      events.filter(event => {
        const start = startOfDay(toDate(event.startDate));
        const end = startOfDay(toDate(event.endDate));
        const day = startOfDay(date);
        return day >= start && day <= end;
      })
    );
  }

  // For week view: count events that overlap with this week
  if (view === "week") {
    return countEvents(
      events.filter(event => {
        const eventStart = toDate(event.startDate);
        const eventEnd = toDate(event.endDate);
        const weekStart = startOfWeek(date);
        const weekEnd = endOfWeek(date);
        return eventStart <= weekEnd && eventEnd >= weekStart;
      })
    );
  }

  // For month/agenda/year views: compare by startDate granularity is sufficient
  const compareFns = {
    agenda: isSameMonth,
    year: isSameYear,
    month: isSameMonth,
  } as const;

  const fn = compareFns[view as keyof typeof compareFns];
  if (fn) {
    return countEvents(events.filter(event => fn(toDate(event.startDate), date)));
  }

  return breakdown;
}

/* ============================================================
  Week / Day View Helpers (TIMELINE CORE)
============================================================ */

export function getCurrentEvents(events: IEvent[]) {
  const now = new Date();
  return (
    events.filter(event =>
      isWithinInterval(now, {
        start: toDate(event.startDate),
        end: toDate(event.endDate),
      })
    ) || null
  );
}

export function groupEvents(dayEvents: IEvent[]) {
  const sorted = [...dayEvents].sort(
    (a, b) =>
      toDate(a.startDate).getTime() - toDate(b.startDate).getTime()
  );

  const groups: IEvent[][] = [];

  for (const event of sorted) {
    const start = toDate(event.startDate);
    let placed = false;

    for (const group of groups) {
      const lastEnd = toDate(group[group.length - 1].endDate);
      if (start >= lastEnd) {
        group.push(event);
        placed = true;
        break;
      }
    }

    if (!placed) groups.push([event]);
  }

  return groups;
}

export function getEventBlockStyle(
  event: IEvent,
  day: Date,
  groupIndex: number,
  groupSize: number,
  visibleHoursRange?: { from: number; to: number }
) {
  const start = toDate(event.startDate);
  const end = toDate(event.endDate);

  const dayStart = startOfDay(day);
  const dayEnd = new Date(dayStart);
  dayEnd.setHours(23, 59, 59, 999);

  // clip event to the visible day
  const effectiveStart = start < dayStart ? dayStart : start;
  const effectiveEnd = end > dayEnd ? dayEnd : end;

  const startMinutes = getMinutesSinceDayStart(effectiveStart);

  // correct duration calculation
  const durationMinutes = Math.max(
    15,
    (effectiveEnd.getTime() - effectiveStart.getTime()) / 60000
  );


  let topPx = startMinutes * PIXELS_PER_MINUTE;

  if (visibleHoursRange) {
    const visibleStart = visibleHoursRange.from * 60;
    topPx = Math.max(
      0,
      (startMinutes - visibleStart) * PIXELS_PER_MINUTE
    );
  }

  const heightPx = durationMinutes * PIXELS_PER_MINUTE;

  const width = 100 / groupSize;
  const left = groupIndex * width;

  return {
    top: `${topPx}px`,
    height: `${heightPx}px`,
    width: `${width}%`,
    left: `${left}%`,
  };
}

export function isWorkingHour(
  day: Date,
  hour: number,
  workingHours: TWorkingHours
) {
  const dayIndex = day.getDay() as keyof typeof workingHours;
  const hours = workingHours[dayIndex];
  return hour >= hours.from && hour < hours.to;
}

export function getVisibleHours(
  visibleHours: TVisibleHours,
  singleDayEvents: IEvent[]
) {
  let earliest = visibleHours.from;
  let latest = visibleHours.to;

  singleDayEvents.forEach(event => {
    const start = toDate(event.startDate);
    const end = toDate(event.endDate);

    earliest = Math.min(earliest, start.getHours());
    latest = Math.max(latest, end.getHours() + (end.getMinutes() ? 1 : 0));
  });

  latest = Math.min(latest, 24);

  const hours = Array.from(
    { length: latest - earliest },
    (_, i) => i + earliest
  );

  return { hours, earliestEventHour: earliest, latestEventHour: latest };
}

/* ============================================================
  Month View Helpers (unchanged logic, safer dates)
============================================================ */

export function getCalendarCells(selectedDate: Date): ICalendarCell[] {
  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const prevMonthDays = new Date(year, month, 0).getDate();

  const prev = Array.from({ length: firstDay }, (_, i) => ({
    day: prevMonthDays - firstDay + i + 1,
    currentMonth: false,
    date: new Date(year, month - 1, prevMonthDays - firstDay + i + 1),
  }));

  const current = Array.from({ length: daysInMonth }, (_, i) => ({
    day: i + 1,
    currentMonth: true,
    date: new Date(year, month, i + 1),
  }));

  const next = Array.from(
    { length: (7 - ((firstDay + daysInMonth) % 7)) % 7 },
    (_, i) => ({
      day: i + 1,
      currentMonth: false,
      date: new Date(year, month + 1, i + 1),
    })
  );

  return [...prev, ...current, ...next];
}

/* ============================================================
  Positioning Helpers
============================================================ */


export function calculateMonthEventPositions(
  multiDayEvents: IEvent[],
  singleDayEvents: IEvent[],
  selectedDate: Date
) {
  const monthStart = startOfMonth(selectedDate);
  const monthEnd = endOfMonth(selectedDate);

  const eventPositions: { [key: string]: number } = {};
  const occupiedPositions: { [key: string]: boolean[] } = {};

  eachDayOfInterval({ start: monthStart, end: monthEnd }).forEach(day => {
    occupiedPositions[startOfDay(day).toISOString()] = [false, false, false];
  });

  const sortedEvents = [
    ...multiDayEvents.sort((a, b) => {
      const aStart = toDate(a.startDate);
      const aEnd = toDate(a.endDate);
      const bStart = toDate(b.startDate);
      const bEnd = toDate(b.endDate);

      const aDuration = differenceInDays(aEnd, aStart);
      const bDuration = differenceInDays(bEnd, bStart);

      return bDuration - aDuration || aStart.getTime() - bStart.getTime();
    }),
    ...singleDayEvents.sort((a, b) => {
      const isClassA = a.title.startsWith("Lec-") || a.title.startsWith("Tut-") || a.title.startsWith("Prc-");
      const isClassB = b.title.startsWith("Lec-") || b.title.startsWith("Tut-") || b.title.startsWith("Prc-");
      if (!isClassA && isClassB) return -1;
      if (isClassA && !isClassB) return 1;
      return toDate(a.startDate).getTime() - toDate(b.startDate).getTime();
    }),
  ];

  sortedEvents.forEach(event => {
    const eventStart = toDate(event.startDate);
    const eventEnd = toDate(event.endDate);

    const eventDays = eachDayOfInterval({
      start: eventStart < monthStart ? monthStart : eventStart,
      end: eventEnd > monthEnd ? monthEnd : eventEnd,
    });

    let position = -1;

    for (let i = 0; i < 3; i++) {
      if (
        eventDays.every(day => {
          const key = startOfDay(day).toISOString();
          const dayPositions = occupiedPositions[key];
          return dayPositions && !dayPositions[i];
        })
      ) {
        position = i;
        break;
      }
    }

    if (position !== -1) {
      eventDays.forEach(day => {
        const key = startOfDay(day).toISOString();
        occupiedPositions[key][position] = true;
      });

      eventPositions[event.id] = position;
    }
  });

  return eventPositions;
}
export function getMonthCellEvents(
  date: Date,
  events: IEvent[],
  eventPositions: Record<string, number>
) {
  const eventsForDate = events.filter(event => {
    const eventStart = toDate(event.startDate);
    const eventEnd = toDate(event.endDate);

    return (
      isSameDay(date, eventStart) ||
      isSameDay(date, eventEnd) ||
      (date >= startOfDay(eventStart) &&
        date <= startOfDay(eventEnd))
    );
  });

  return eventsForDate
    .map(event => {
      const start = toDate(event.startDate);
      const end = toDate(event.endDate);

      return {
        ...event,
        position: eventPositions[event.id] ?? -1,
        isMultiDay:
          differenceInDays(startOfDay(end), startOfDay(start)) > 0,
      };
    })
    .sort((a, b) => {
      if (a.isMultiDay && !b.isMultiDay) return -1;
      if (!a.isMultiDay && b.isMultiDay) return 1;

      // Class events (Lec-, Tut-, Prc-) should be sorted below non-class events
      const isClassA = a.title.startsWith("Lec-") || a.title.startsWith("Tut-") || a.title.startsWith("Prc-");
      const isClassB = b.title.startsWith("Lec-") || b.title.startsWith("Tut-") || b.title.startsWith("Prc-");

      if (!isClassA && isClassB) return -1;
      if (isClassA && !isClassB) return 1;
      
      // Push overflow events (position: -1) to the bottom of the list
      const posA = a.position === -1 ? 999 : a.position;
      const posB = b.position === -1 ? 999 : b.position;
      
      if (posA !== posB) return posA - posB;
      
      // If both are overflow (or somehow have same position), preserve time sequence
      return toDate(a.startDate).getTime() - toDate(b.startDate).getTime();
    });
}