import { useMemo } from "react";
import {
  startOfDay,
  startOfWeek,
  endOfWeek,
  addDays,
  differenceInDays,
} from "date-fns";

import { MonthEventBadge } from "@/calendar/components/month-view/month-event-badge";
import { toDate } from "@/calendar/helpers";

import type { IEvent } from "@/calendar/interfaces";

interface IProps {
  selectedDate: Date;
  multiDayEvents: IEvent[];
}

export function WeekViewMultiDayEventsRow({
  selectedDate,
  multiDayEvents,
}: IProps) {
  const weekStart = startOfWeek(selectedDate);
  const weekEnd = endOfWeek(selectedDate);
  const weekDays = Array.from({ length: 7 }, (_, i) =>
    addDays(weekStart, i)
  );

  const processedEvents = useMemo(() => {
    return multiDayEvents
      .map(event => {
        const start = startOfDay(toDate(event.startDate));
        const end = startOfDay(toDate(event.endDate));

        if (!(start <= weekEnd && end >= weekStart)) {
          return null;
        }

        const adjustedStart = start < weekStart ? weekStart : start;
        const adjustedEnd = end > weekEnd ? weekEnd : end;

        const startIndex = differenceInDays(
          adjustedStart,
          weekStart
        );
        const endIndex = differenceInDays(
          adjustedEnd,
          weekStart
        );

        return {
          ...event,
          adjustedStart,
          adjustedEnd,
          startIndex,
          endIndex,
        };
      })
      .filter(
        (e): e is NonNullable<typeof e> => e !== null
      )
      .sort((a: any, b: any) => {
        const startDiff =
          a.adjustedStart.getTime() -
          b.adjustedStart.getTime();

        if (startDiff !== 0) return startDiff;

        const lengthA = a.endIndex - a.startIndex;
        const lengthB = b.endIndex - b.startIndex;

        return lengthB - lengthA;
      });
  }, [multiDayEvents, weekStart, weekEnd]);

  const eventRows = useMemo(() => {
    const rows: any[][] = [];

    processedEvents.forEach(event => {
      let rowIndex = rows.findIndex(row =>
        row.every(
          e =>
            e.endIndex < event.startIndex ||
            e.startIndex > event.endIndex
        )
      );

      if (rowIndex === -1) {
        rowIndex = rows.length;
        rows.push([]);
      }

      rows[rowIndex].push(event);
    });

    return rows;
  }, [processedEvents]);

  if (processedEvents.length === 0) return null;

  return (
    <div className="hidden overflow-hidden sm:flex">
      <div className="w-18 border-b"></div>

      <div className="grid flex-1 grid-cols-7 divide-x border-b border-l">
        {weekDays.map((day, dayIndex) => (
          <div
            key={day.toISOString()}
            className="flex h-full flex-col gap-1 py-1"
          >
            {eventRows.map((row, rowIndex) => {
              const event = row.find(
                e =>
                  e.startIndex <= dayIndex &&
                  e.endIndex >= dayIndex
              );

              if (!event) {
                return (
                  <div
                    key={`${rowIndex}-${dayIndex}`}
                    className="h-6.5"
                  />
                );
              }

              let position:
                | "first"
                | "middle"
                | "last"
                | "none" = "none";

              if (
                dayIndex === event.startIndex &&
                dayIndex === event.endIndex
              ) {
                position = "none";
              } else if (dayIndex === event.startIndex) {
                position = "first";
              } else if (dayIndex === event.endIndex) {
                position = "last";
              } else {
                position = "middle";
              }

              return (
                <MonthEventBadge
                  key={`${event.id}-${dayIndex}`}
                  event={event}
                  cellDate={startOfDay(day)}
                  position={position}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}