import { useCalendar } from "@/calendar/contexts/calendar-context";
import { updateUserEvent } from "@/calendar/requests";
import { toast } from "sonner";

import type { IEvent } from "@/calendar/interfaces";

export function useUpdateEvent() {
  const { setLocalEvents, refreshEvents } = useCalendar();

  const updateEvent = async (event: IEvent) => {
    // Only personal user events can be dragged and updated
    if (!event.isUserEvent || !event.userEventId) {
      toast.error("Cannot move notice events. Only personal events can be moved.");
      return;
    }

    const newEvent = { ...event };
    newEvent.startDate = new Date(event.startDate).toISOString();
    newEvent.endDate = new Date(event.endDate).toISOString();

    // Optimistic UI update
    setLocalEvents(prev => {
      const index = prev.findIndex(e => e.id === event.id);
      if (index === -1) return prev;
      return [...prev.slice(0, index), newEvent, ...prev.slice(index + 1)];
    });

    try {
      const payload = {
        title: newEvent.title,
        description: newEvent.description,
        eventTime: newEvent.startDate,
        eventEndTime: newEvent.endDate,
        color: newEvent.color
      };
      
      await updateUserEvent(event.userEventId, payload);
      toast.success("Event moved successfully");
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Failed to move event");
      // Revert optimistic update on failure by refreshing from server
      refreshEvents();
    }
  };

  return { updateEvent };
}
