"use client";

import { format, parseISO } from "date-fns";
import { Calendar, Clock, Text, User } from "lucide-react";
import { useCalendar } from "@/calendar/contexts/calendar-context";
import { Button } from "@/components/ui/button";
// import { EditEventDialog } from "@/calendar/components/dialogs/edit-event-dialog";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

import type { IEvent } from "@/calendar/interfaces";

interface IProps {
  event: IEvent;
  children: React.ReactNode;
}

export function EventDetailsDialog({ event, children }: IProps) {

  //const cleanStart = event.startDate.replace(/(Z|[+-]\d{2}:\d{2})$/, '');
  //const cleanEnd = event.endDate.replace(/(Z|[+-]\d{2}:\d{2})$/, '');

  const startDate = parseISO(event.startDate);
  const endDate = parseISO(event.endDate);
  //const startDate = parseISO(cleanStart);
  // const endDate = parseISO(cleanEnd);
  const { entities } = useCalendar();

  const eventEntity = entities.find(e => e.id === event.entity);
  const displayColor = eventEntity ? eventEntity.color : "blue";

  return (
    <>
      <Dialog>
        <DialogTrigger asChild>{children}</DialogTrigger>

        <DialogContent>
          <DialogHeader>
            <DialogTitle>{event.title}</DialogTitle>
            {eventEntity && (
              <p className="text-sm font-semibold tracking-wide" style={{ color: eventEntity.color }}>
                {eventEntity.name}
              </p>
            )}
          </DialogHeader>

          <div className="space-y-4">

            <div className="flex items-start gap-2">
              <Calendar className="mt-1 size-4 shrink-0" />
              <div>
                <p className="text-sm font-medium">Start Date</p>
                <p className="text-sm text-muted-foreground">{format(startDate, "MMM d, yyyy h:mm a")}</p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Clock className="mt-1 size-4 shrink-0" />
              <div>
                <p className="text-sm font-medium">End Date</p>
                <p className="text-sm text-muted-foreground">{format(endDate, "MMM d, yyyy h:mm a")}</p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Text className="mt-1 size-4 shrink-0" />
              <div>
                <p className="text-sm font-medium">Description</p>
                <p className="text-sm text-muted-foreground">{event.description}</p>
                {event.location && (<span className="text-xs text-muted-foreground">
                  📍 {event.location}
                </span>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            {/* <EditEventDialog event={event}>
              <Button type="button" variant="outline">
                Edit
              </Button>
            </EditEventDialog> */}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
