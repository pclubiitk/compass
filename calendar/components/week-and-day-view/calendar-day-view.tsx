import { format } from "date-fns";
import { areIntervalsOverlapping } from "date-fns";

import { useCalendar } from "@/calendar/contexts/calendar-context";

import { EventBlock } from "@/calendar/components/week-and-day-view/event-block";
import { CalendarTimeline } from "@/calendar/components/week-and-day-view/calendar-time-line";
import { DayViewMultiDayEventsRow } from "@/calendar/components/week-and-day-view/day-view-multi-day-events-row";

import { cn } from "@/lib/utils";

import {
  groupEvents,
  getEventBlockStyle,
  isWorkingHour,
  getCurrentEvents,
  toDate,
  formatHourLabel,
} from "@/calendar/helpers";

import type { IEvent } from "@/calendar/interfaces";
import { useEffect } from "react";

interface IProps {
  singleDayEvents: IEvent[];
  multiDayEvents: IEvent[];
}

const PIXELS_PER_MINUTE = 1;
const HOUR_HEIGHT = 60 * PIXELS_PER_MINUTE; // 60px per hour

export function CalendarDayView({
  singleDayEvents,
  multiDayEvents,
}: IProps) {
  const { selectedDate, workingHours } = useCalendar();

  const now = new Date();
  const currentHour = now.getHours();

  const startHour = 0;
  const endHour = 24;

  const hours = Array.from({ length: endHour - startHour }, (_, i) => startHour + i);

  const currentEvents = getCurrentEvents(singleDayEvents);

  const dayEvents = singleDayEvents.filter(event => {
    const eventDate = toDate(event.startDate);
    return (
      eventDate.getDate() === selectedDate.getDate() &&
      eventDate.getMonth() === selectedDate.getMonth() &&
      eventDate.getFullYear() === selectedDate.getFullYear()
    );
  });

  useEffect(() => {
    const now = new Date();
    const minutes = now.getHours() * 60 + now.getMinutes();
    window.scrollTo({ top: minutes });
  }, []);

  const groupedEvents = groupEvents(dayEvents);

  return (
    <div className="flex">
      <div className="flex flex-1 flex-col">
        <div>
          <DayViewMultiDayEventsRow
            selectedDate={selectedDate}
            multiDayEvents={multiDayEvents}
          />

          {/* Day header */}
          <div className="relative z-20 flex border-b">
            <div className="w-18"></div>
            <span className="flex-1 border-l py-2 text-center text-xs font-medium text-muted-foreground">
              {format(selectedDate, "EE")}{" "}
              <span className="font-semibold text-foreground">
                {format(selectedDate, "d")}
              </span>
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          <div className="h-[736px] overflow-y-auto">
            <div className="flex">
              {/* Hours column */}
              <div className="relative w-18">
                {hours.map(hour => {
                  const isDisabled = !isWorkingHour(
                    selectedDate,
                    hour,
                    workingHours
                  );

                  return (
                    <div
                      key={hour}
                      className={cn(
                        "relative border-b",
                        isDisabled && "bg-calendar-disabled-hour"
                      )}
                      style={{ height: `${HOUR_HEIGHT}px` }}
                    >
                      <div className="absolute -top-3 right-2 text-xs text-muted-foreground">
                        {formatHourLabel(hour)}
                      </div>

                      <div className="pointer-events-none absolute inset-x-0 top-1/2 border-b border-dashed" />
                    </div>
                  );
                })}
              </div>

              {/* Day grid */}
              <div className="relative flex-1 border-l">
                <div className="relative" style={{ height: `${24 * 60}px` }}>
                  {hours.map(hour => {
                    const isDisabled = !isWorkingHour(
                      selectedDate,
                      hour,
                      workingHours
                    );

                    return (
                      <div
                        key={hour}
                        className={cn(
                          "relative",
                          isDisabled && "bg-calendar-disabled-hour"
                        )}
                        style={{ height: `${HOUR_HEIGHT}px` }}
                      >
                        <div className="pointer-events-none absolute inset-x-0 top-1/2 border-b border-dashed" />
                      </div>
                    );
                  })}

                  {/* Event Blocks */}
                  {groupedEvents.map((group, groupIndex) =>
                    group.map(event => {
                      let style = getEventBlockStyle(
                        event,
                        selectedDate,
                        groupIndex,
                        groupedEvents.length,
                        { from: startHour, to: endHour }
                      );
                      const hasOverlap = groupedEvents.some(
                        (otherGroup, otherIndex) =>
                          otherIndex !== groupIndex &&
                          otherGroup.some(otherEvent =>
                            areIntervalsOverlapping(
                              {
                                start: toDate(event.startDate),
                                end: toDate(event.endDate),
                              },
                              {
                                start: toDate(otherEvent.startDate),
                                end: toDate(otherEvent.endDate),
                              }
                            )
                          )
                      );

                      if (!hasOverlap)
                        style = { ...style, width: "100%", left: "0%" };

                      return (
                        <div
                          key={event.id}
                          className="absolute p-1"
                          style={style}
                        >
                          <EventBlock event={event} />
                        </div>
                      );
                    })
                  )}
                </div>

                <CalendarTimeline
                  firstVisibleHour={startHour}
                  lastVisibleHour={endHour}
                  pixelsPerMinute={PIXELS_PER_MINUTE}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}