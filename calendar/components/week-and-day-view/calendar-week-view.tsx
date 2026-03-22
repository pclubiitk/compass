import {
  startOfWeek,
  addDays,
  format,
  isSameDay,
  areIntervalsOverlapping,
} from "date-fns";

import { useCalendar } from "@/calendar/contexts/calendar-context";

import { ScrollArea } from "@/components/ui/scroll-area";

import { EventBlock } from "@/calendar/components/week-and-day-view/event-block";
import { CalendarTimeline } from "@/calendar/components/week-and-day-view/calendar-time-line";
import { WeekViewMultiDayEventsRow } from "@/calendar/components/week-and-day-view/week-view-multi-day-events-row";

import { cn } from "@/lib/utils";

import {
  groupEvents,
  getEventBlockStyle,
  isWorkingHour,
  getVisibleHours,
  toDate,
  formatHourLabel,
} from "@/calendar/helpers";

import type { IEvent } from "@/calendar/interfaces";

interface IProps {
  singleDayEvents: IEvent[];
  multiDayEvents: IEvent[];
}

const PIXELS_PER_MINUTE = 1;
const HOUR_HEIGHT = 60 * PIXELS_PER_MINUTE;

export function CalendarWeekView({
  singleDayEvents,
  multiDayEvents,
}: IProps) {
  const { selectedDate, workingHours, visibleHours } =
    useCalendar();

  const startHour = 0;
  const endHour = 24;

  const hours = Array.from({ length: endHour - startHour }, (_, i) => startHour + i);

  const weekStart = startOfWeek(selectedDate);
  const weekDays = Array.from({ length: 7 }, (_, i) =>
    addDays(weekStart, i)
  );

  return (
    <>
      <div className="flex flex-col items-center justify-center border-b py-4 text-sm text-muted-foreground sm:hidden">
        <p>Weekly view is not available on smaller devices.</p>
        <p>Please switch to daily or monthly view.</p>
      </div>

      <div className="hidden flex-col sm:flex">
        <div>
          <WeekViewMultiDayEventsRow
            selectedDate={selectedDate}
            multiDayEvents={multiDayEvents}
          />

          {/* Week header */}
          <div className="relative z-20 flex border-b">
            <div className="w-18"></div>
            <div className="grid flex-1 grid-cols-7 divide-x border-l">
              {weekDays.map((day, index) => (
                <span
                  key={index}
                  className="py-2 text-center text-xs font-medium text-muted-foreground"
                >
                  {format(day, "EE")}{" "}
                  <span className="ml-1 font-semibold text-foreground">
                    {format(day, "d")}
                  </span>
                </span>
              ))}
            </div>
          </div>
        </div>

        <ScrollArea className="h-[736px]" type="always">
          <div className="flex overflow-hidden">
            {/* Hours column */}
            <div className="relative w-18">
              {hours.map(hour => (
                <div
                  key={hour}
                  className="relative border-b"
                  style={{ height: `${HOUR_HEIGHT}px` }}
                >
                  <div className="absolute -top-3 right-2 text-xs text-muted-foreground">
                    {formatHourLabel(hour)}
                  </div>
                </div>
              ))}
            </div>

            {/* Week grid */}
            <div className="relative flex-1 border-l">
              <div className="grid grid-cols-7 divide-x">
                {weekDays.map((day, dayIndex) => {
                  const dayEvents = singleDayEvents.filter(
                    event =>
                      isSameDay(toDate(event.startDate), day) ||
                      isSameDay(toDate(event.endDate), day)
                  );

                  const groupedEvents = groupEvents(dayEvents);

                  return (
                    <div key={dayIndex} className="relative">
                      {hours.map(hour => {
                        const isDisabled = !isWorkingHour(
                          day,
                          hour,
                          workingHours
                        );

                        return (
                          <div
                            key={hour}
                            className={cn(
                              "relative",
                              isDisabled &&
                              "bg-calendar-disabled-hour"
                            )}
                            style={{
                              height: `${HOUR_HEIGHT}px`,
                            }}
                          >
                            <div className="pointer-events-none absolute inset-x-0 top-1/2 border-b border-dashed" />
                          </div>
                        );
                      })}

                      {/* Event Blocks */}
                      {groupedEvents.map(
                        (group, groupIndex) =>
                          group.map(event => {
                            let style =
                              getEventBlockStyle(
                                event,
                                day,
                                groupIndex,
                                groupedEvents.length,
                                {
                                  from: startHour,
                                  to: endHour,
                                }
                              );

                            const hasOverlap =
                              groupedEvents.some(
                                (otherGroup, otherIndex) =>
                                  otherIndex !== groupIndex &&
                                  otherGroup.some(
                                    otherEvent =>
                                      areIntervalsOverlapping(
                                        {
                                          start: toDate(
                                            event.startDate
                                          ),
                                          end: toDate(
                                            event.endDate
                                          ),
                                        },
                                        {
                                          start: toDate(
                                            otherEvent.startDate
                                          ),
                                          end: toDate(
                                            otherEvent.endDate
                                          ),
                                        }
                                      )
                                  )
                              );

                            if (!hasOverlap)
                              style = {
                                ...style,
                                width: "100%",
                                left: "0%",
                              };

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
                  );
                })}
              </div>

              <CalendarTimeline
                firstVisibleHour={startHour}
                lastVisibleHour={endHour}
                pixelsPerMinute={PIXELS_PER_MINUTE}
              />
            </div>
          </div>
        </ScrollArea>
      </div>
    </>
  );
}