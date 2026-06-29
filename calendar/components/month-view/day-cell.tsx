import { useMemo, useState } from "react";
import { isToday, startOfDay, isSameDay } from "date-fns";

import { EventBullet } from "@/calendar/components/month-view/event-bullet";
import { DroppableDayCell } from "@/calendar/components/dnd/droppable-day-cell";
import { MonthEventBadge } from "@/calendar/components/month-view/month-event-badge";
import { EventDetailsDialog } from "@/calendar/components/dialogs/event-details-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { cn } from "@/lib/utils";
import { getMonthCellEvents } from "@/calendar/helpers";

import type { ICalendarCell, IEvent } from "@/calendar/interfaces";


interface IProps {
  cell: ICalendarCell;
  events: IEvent[];
  eventPositions: Record<string, number>;
}

const MAX_VISIBLE_EVENTS = 3;

export function DayCell({ cell, events, eventPositions }: IProps) {
  const { day, currentMonth, date } = cell;
  const [open, setOpen] = useState(false);
  const cellEvents = useMemo(() => getMonthCellEvents(date, events, eventPositions), [date, events, eventPositions]);
  const isSunday = date.getDay() === 0;

  return (
    <>
      <DroppableDayCell cell={cell}>
        <div className={cn("flex h-full flex-col gap-1 border-l border-t py-1.5 lg:py-2", isSunday && "border-l-0")} onClick={() => {
          // Only open on mobile screens
          if (window.innerWidth < 1024 && cellEvents.length > 0) {
            setOpen(true);
          }
        }}>
          <span
            className={cn(
              "h-6 px-1 text-xs font-semibold lg:px-2",
              !currentMonth && "opacity-20",
              isToday(date) && "flex w-6 translate-x-1 items-center justify-center rounded-full bg-primary px-0 font-bold text-primary-foreground"
            )}
          >
            {day}
          </span>

          <div className={cn("flex h-6 gap-1 px-2 lg:h-[94px] lg:flex-col lg:gap-2 lg:px-0", !currentMonth && "opacity-50")}>
            {[0, 1, 2].map(position => {
              const event = cellEvents.find(e => e.position === position);
              const eventKey = event ? `event-${event.id}-${position}` : `empty-${position}`;

              return (
                <div key={eventKey} className="lg:flex-1">
                  {event && (
                    <>
                      <EventBullet className="lg:hidden" color={event.color} />
                      <MonthEventBadge className="hidden lg:flex" event={event} cellDate={startOfDay(date)} />
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {cellEvents.length > MAX_VISIBLE_EVENTS && (
            <div
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                setOpen(true);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  e.stopPropagation();
                  setOpen(true);
                }
              }}
              className={cn(
                "h-4.5 px-1.5 text-xs font-semibold text-muted-foreground hover:underline cursor-pointer",
                !currentMonth && "opacity-50"
              )}
            >
              <span className="sm:hidden">+{cellEvents.length - MAX_VISIBLE_EVENTS}</span>
              <span className="hidden sm:inline"> {cellEvents.length - MAX_VISIBLE_EVENTS} more...</span>
            </div>
          )}
        </div>
      </DroppableDayCell>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>
              Events on {date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-2 mt-2">
            {cellEvents.map((event) => {
              const itemStart = new Date(event.startDate);
              const itemEnd = new Date(event.endDate);
              
              const isFirst = isSameDay(date, itemStart);
              const isLast = isSameDay(date, itemEnd);
              
              let timeText = "";
              if (isFirst && isLast) {
                 timeText = `${itemStart.toLocaleTimeString("en-IN", {hour: "2-digit", minute: "2-digit"})} - ${itemEnd.toLocaleTimeString("en-IN", {hour: "2-digit", minute: "2-digit"})}`;
              } else if (isFirst) {
                 timeText = `from ${itemStart.toLocaleTimeString("en-IN", {hour: "2-digit", minute: "2-digit"})}`;
              } else if (isLast) {
                 timeText = `till ${itemEnd.toLocaleTimeString("en-IN", {hour: "2-digit", minute: "2-digit"})}`;
              } else {
                 timeText = "All day";
              }

              return (
                <EventDetailsDialog key={event.id} event={event}>
                  <div
                    role="button"
                    tabIndex={0}
                    className="flex items-center gap-2 rounded-lg border p-2 hover:bg-muted/30 transition text-left cursor-pointer"
                  >
                    <EventBullet color={event.color} className="" />
                    <div className="flex flex-col flex-1 overflow-hidden">
                      <span className="text-sm font-semibold truncate">{event.title}</span>

                      {/* Time */}
                      <span className="text-xs text-muted-foreground">
                        {timeText}
                      </span>

                      {/* Description */}
                      {event.description && (
                        <span className="text-xs text-muted-foreground truncate">
                          {event.description}
                        </span>
                      )}
                      {event.location && (
                        <span className="text-xs text-muted-foreground truncate">
                          📍 {event.location}
                        </span>
                      )}
                    </div>
                  </div>
                </EventDetailsDialog>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
