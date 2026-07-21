"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import { Calendar, Clock, Text, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { useCalendar } from "@/calendar/contexts/calendar-context";
import { deleteUserEvent, updateUserEvent } from "@/calendar/requests";
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

  const [showRecurrencePrompt, setShowRecurrencePrompt] = useState(false);
  const { entities, removeLocalEvent, refreshEvents, rawEvents } = useCalendar();

  const eventEntity = entities.find(e => e.id === event.entity);

  const isClassEvent = event.title.startsWith("Lec-") || event.title.startsWith("Tut-") || event.title.startsWith("Prc-");
  const isRecurring = event.recurrenceType === "weekly";

  const handleDeleteClick = () => {
    if (isRecurring) {
      setShowRecurrencePrompt(true);
    } else {
      handleDeleteSeries();
    }
  };

  const handleDeleteSeries = async () => {
    if (!event.userEventId) return;
    setIsDeleting(true);
    try {
      await deleteUserEvent(event.userEventId);
      
      const baseEvent = rawEvents.find(e => e.userEventId === event.userEventId) || event;
      
      // Only delete detached standalone occurrences when deleting the recurring parent series
      if (baseEvent.recurrenceType === "weekly") {
        const standaloneEvents = rawEvents.filter(
          e => e.title === baseEvent.title && e.recurrenceType === "" && e.userEventId !== event.userEventId
        );
        
        for (const standalone of standaloneEvents) {
          if (!standalone.userEventId) continue;
          try {
            await deleteUserEvent(standalone.userEventId);
          } catch (e) {
            console.error("Failed to delete standalone event", e);
          }
        }
      }

      removeLocalEvent(event.userEventId);
      await refreshEvents(); // Guarantee sync with backend to fix lingering deleted events
      toast.success("Event deleted");
      setShowRecurrencePrompt(false);
      setIsOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete event");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteSingle = async () => {
    if (!event.userEventId) return;
    setIsDeleting(true);
    try {
      const baseEvent = rawEvents.find(e => e.userEventId === event.userEventId);
      if (!baseEvent) throw new Error("Base event not found");

      const dateStr = format(parseISO(event.startDate), "yyyy-MM-dd");
      const existing = new Set<string>();
      if (baseEvent.recurrenceExceptions) {
        baseEvent.recurrenceExceptions.split(",").forEach(d => {
          if (d.trim()) existing.add(d.trim());
        });
      }
      existing.add(dateStr);
      const newExceptionsStr = Array.from(existing).sort().join(",");

      await updateUserEvent(baseEvent.userEventId!, {
        title: baseEvent.title,
        description: baseEvent.description || "",
        eventTime: baseEvent.startDate,
        eventEndTime: baseEvent.endDate,
        color: baseEvent.color || "blue",
        recurrenceType: baseEvent.recurrenceType,
        recurrenceEnd: baseEvent.recurrenceEnd,
        recurrenceExceptions: newExceptionsStr ? newExceptionsStr.split(",") : [],
      });

      await refreshEvents();
      toast.success("Occurrence deleted");
      setShowRecurrencePrompt(false);
      setIsOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete occurrence");
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
                  onClick={handleDeleteClick}
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

      <Dialog open={showRecurrencePrompt} onOpenChange={setShowRecurrencePrompt}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Recurring Event</DialogTitle>
          </DialogHeader>
          <div className="py-4 text-sm">
            You are deleting a recurring class event. Do you want to delete only this specific occurrence, or all occurrences in the series?
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setShowRecurrencePrompt(false)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button variant="secondary" onClick={handleDeleteSingle} disabled={isDeleting}>
              This Occurrence Only
            </Button>
            <Button variant="destructive" onClick={handleDeleteSeries} disabled={isDeleting}>
              All Occurrences
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
