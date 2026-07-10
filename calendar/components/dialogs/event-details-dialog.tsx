"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import { Calendar, Clock, Text, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { useCalendar } from "@/calendar/contexts/calendar-context";
import { deleteUserEvent } from "@/calendar/requests";
import { Button } from "@/components/ui/button";
import { EditEventDialog } from "@/calendar/components/dialogs/edit-event-dialog";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

import type { IEvent } from "@/calendar/interfaces";

interface IProps {
  event: IEvent;
  children: React.ReactNode;
}

export function EventDetailsDialog({ event, children }: IProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const startDate = parseISO(event.startDate);
  const endDate = parseISO(event.endDate);

  const { entities, removeLocalEvent, refreshEvents } = useCalendar();

  const eventEntity = entities.find(e => e.id === event.entity);

  const handleDelete = async () => {
    if (!event.userEventId) return;
    setIsDeleting(true);
    try {
      await deleteUserEvent(event.userEventId);
      removeLocalEvent(event.userEventId);
      await refreshEvents(); // Guarantee sync with backend to fix lingering deleted events
      toast.success("Event deleted");
      setIsOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete event");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
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
                <p className="text-sm font-medium">Start</p>
                <p className="text-sm text-muted-foreground">{format(startDate, "MMM d, yyyy h:mm a")}</p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Clock className="mt-1 size-4 shrink-0" />
              <div>
                <p className="text-sm font-medium">End</p>
                <p className="text-sm text-muted-foreground">{format(endDate, "MMM d, yyyy h:mm a")}</p>
              </div>
            </div>

            {event.description && (
              <div className="flex items-start gap-2">
                <Text className="mt-1 size-4 shrink-0" />
                <div>
                  <p className="text-sm font-medium">Description</p>
                  <p className="text-sm text-muted-foreground">{event.description}</p>
                  {event.location && (
                    <span className="text-xs text-muted-foreground">
                      📍 {event.location}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            {/* Edit and Delete only available for personal events the user created */}
            {event.isUserEvent && (
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  disabled={isDeleting}
                  onClick={handleDelete}
                >
                  <Trash2 className="size-4 mr-1" />
                  {isDeleting ? "Deleting..." : "Delete"}
                </Button>

                <EditEventDialog event={event}>
                  <Button type="button" variant="outline" size="sm">
                    Edit
                  </Button>
                </EditEventDialog>
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
