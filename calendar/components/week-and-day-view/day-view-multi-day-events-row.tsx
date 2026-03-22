import {
  differenceInDays,
  startOfDay,
  endOfDay,
} from "date-fns";

import { MonthEventBadge } from "@/calendar/components/month-view/month-event-badge";

import { toDate } from "@/calendar/helpers";

import type { IEvent } from "@/calendar/interfaces";

interface IProps {
  selectedDate: Date;
  multiDayEvents: IEvent[];
}

export function DayViewMultiDayEventsRow({
  selectedDate,
  multiDayEvents,
}: IProps) {
  const dayStart = startOfDay(selectedDate);
  const dayEnd = endOfDay(selectedDate);

  const multiDayEventsInDay = multiDayEvents
    .filter(event => {
      const eventStart = toDate(event.startDate);
      const eventEnd = toDate(event.endDate);

      return eventStart <= dayEnd && eventEnd >= dayStart;
    })
    .sort((a, b) => {
      const aStart = toDate(a.startDate);
      const aEnd = toDate(a.endDate);
      const bStart = toDate(b.startDate);
      const bEnd = toDate(b.endDate);

      const durationA = differenceInDays(aEnd, aStart);
      const durationB = differenceInDays(bEnd, bStart);

      return durationB - durationA;
    });

  if (multiDayEventsInDay.length === 0) return null;

  return (
    <div className="flex border-b">
      <div className="w-18"></div>

      <div className="flex flex-1 flex-col gap-1 border-l py-1">
        {multiDayEventsInDay.map(event => {
          const eventStart = startOfDay(toDate(event.startDate));
          const eventEnd = startOfDay(toDate(event.endDate));
          const currentDate = startOfDay(selectedDate);

          const eventTotalDays =
            differenceInDays(eventEnd, eventStart) + 1;

          const eventCurrentDay =
            differenceInDays(currentDate, eventStart) + 1;

          return (
            <MonthEventBadge
              key={event.id}
              event={event}
              cellDate={selectedDate}
              eventCurrentDay={eventCurrentDay}
              eventTotalDays={eventTotalDays}
            />
          );
        })}
      </div>
    </div>
  );
}