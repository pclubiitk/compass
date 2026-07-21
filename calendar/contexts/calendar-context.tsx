"use client";

/**
 * Calendar Context Provider
 *
 * Provides global state management for the calendar component.
 * Adapted for Campus Compass where:
 * - Events come from the Noticeboard (notices = events)
 * - Entities (clubs, depts) are the organizers, not users
 * - Users/contributors are the admins who create events
 *
 */

import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { addWeeks, startOfDay, format } from "date-fns";

import type { Dispatch, SetStateAction } from "react";
import type { IEntity, IEvent } from "@/calendar/interfaces";
import type {
  TBadgeVariant,
  TCalendarView,
  TVisibleHours,
  TWorkingHours,
} from "@/calendar/types";
import { ENTITIES } from "@/calendar/entities";
import { getUserEvents } from "@/calendar/requests";

/**
 * Expand recurring weekly events into individual virtual instances for rendering.
 * - Non-recurring events pass through unchanged.
 * - Weekly events are cloned for each week from their base date until recurrenceEnd
 *   (or up to 1 year ahead if repeating forever).
 * - Exception dates (holidays, breaks) are skipped.
 */
function expandRecurringEvents(events: IEvent[]): IEvent[] {
  const expanded: IEvent[] = [];
  const maxHorizon = addWeeks(new Date(), 52); // 1-year expansion window

  for (const event of events) {
    if (event.recurrenceType !== "weekly") {
      expanded.push(event);
      continue;
    }

    const baseStart = new Date(event.startDate);
    const baseEnd = new Date(event.endDate);
    const duration = baseEnd.getTime() - baseStart.getTime();

    // Determine the end boundary for expansion
    const recEnd = event.recurrenceEnd
      ? new Date(event.recurrenceEnd)
      : maxHorizon;
    if (event.recurrenceEnd) {
      recEnd.setHours(23, 59, 59, 999);
    }

    // Build a set of exception dates for fast lookup
    const exceptionSet = new Set<string>();
    if (event.recurrenceExceptions) {
      for (const d of event.recurrenceExceptions.split(",")) {
        const trimmed = d.trim();
        if (trimmed) exceptionSet.add(trimmed);
      }
    }

    let cursor = new Date(baseStart);
    let idx = 0;
    while (cursor <= recEnd) {
      const dateKey = format(startOfDay(cursor), "yyyy-MM-dd");

      if (!exceptionSet.has(dateKey)) {
        expanded.push({
          ...event,
          id: `${event.id}-r${idx}`,
          startDate: cursor.toISOString(),
          endDate: new Date(cursor.getTime() + duration).toISOString(),
        });
      }

      cursor = addWeeks(cursor, 1);
      idx++;
    }
  }
  return expanded;
}

interface ICalendarContext {
  selectedDate: Date;
  setSelectedDate: (date: Date | undefined) => void;
  // Entity filtering (replaces user filtering)
  entities: IEntity[];
  selectedEntity: string | "all";
  setSelectedEntity: (entity: string | "all") => void;
  badgeVariant: TBadgeVariant;
  setBadgeVariant: (variant: TBadgeVariant) => void;
  workingHours: TWorkingHours;
  setWorkingHours: Dispatch<SetStateAction<TWorkingHours>>;
  visibleHours: TVisibleHours;
  setVisibleHours: Dispatch<SetStateAction<TVisibleHours>>;
  events: IEvent[];
  rawEvents: IEvent[];
  setLocalEvents: Dispatch<SetStateAction<IEvent[]>>;
  addLocalEvent: (event: IEvent) => void;
  removeLocalEvent: (eventId: string) => void;
  updateLocalEvent: (event: IEvent) => void;
  view: TCalendarView;
  setView: Dispatch<SetStateAction<TCalendarView>>;
  // Loading state for async event fetching
  isLoading: boolean;
  // Refresh events from server
  refreshEvents: () => Promise<void>;
}

const CalendarContext = createContext({} as ICalendarContext);

const WORKING_HOURS = {
  0: { from: 0, to: 0 },
  1: { from: 8, to: 17 },
  2: { from: 8, to: 17 },
  3: { from: 8, to: 17 },
  4: { from: 8, to: 17 },
  5: { from: 8, to: 17 },
  6: { from: 8, to: 12 },
};

const VISIBLE_HOURS = { from: 7, to: 18 };

interface CalendarProviderProps {
  children: React.ReactNode;
  events: IEvent[];
  /** Optional: function to fetch fresh events */
  fetchEvents?: () => Promise<IEvent[]>;
}

export function CalendarProvider({
  children,
  events,
  fetchEvents,
}: CalendarProviderProps) {
  const [badgeVariant, setBadgeVariant] = useState<TBadgeVariant>("colored");
  // const [entities, setEntities] = useState<IEntity[]>([]);
  const [visibleHours, setVisibleHours] = useState<TVisibleHours>(VISIBLE_HOURS);
  const [workingHours, setWorkingHours] = useState<TWorkingHours>(WORKING_HOURS);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedEntity, setSelectedEntity] = useState<string | "all">("all");
  const [view, setView] = useState<TCalendarView>("day");
  const [isLoading, setIsLoading] = useState(false);

  // Local events state - allows for optimistic updates
  const [localEvents, setLocalEvents] = useState<IEvent[]>(events);

  // Expand recurring events for display
  const expandedEvents = useMemo(() => expandRecurringEvents(localEvents), [localEvents]);

  // When the notices prop changes (e.g. parent fetched fresh notices),
  // replace only the notice portion and keep personal events intact.
  useEffect(() => {
    setLocalEvents(prev => {
      const personalEvents = prev.filter(e => e.isUserEvent);
      return [...events, ...personalEvents];
    });
  }, [events]);

  // On mount, fetch personal user events and merge them in.
  useEffect(() => {
    getUserEvents()
      .then(userEvts => {
        if (userEvts.length > 0) {
          setLocalEvents(prev => {
            // Remove any stale personal events then add fresh ones
            const noticeEvents = prev.filter(e => !e.isUserEvent);
            return [...noticeEvents, ...userEvts];
          });
        }
      })
      .catch(() => { /* user not logged in — ignore */ });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally run once on mount only

  const handleSelectDate = (date: Date | undefined) => {
    if (!date) return;
    setSelectedDate(date);
  };

  // Refresh events from server (notices + personal events merged)
  const refreshEvents = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch fresh notices (passed-in fetchEvents function)
      const freshNotices = fetchEvents ? await fetchEvents() : [];

      // Fetch personal user events — silently ignored if user not logged in
      let freshUserEvents: IEvent[] = [];
      try {
        freshUserEvents = await getUserEvents();
      } catch {
        // Not logged in or network error — skip personal events gracefully
      }

      setLocalEvents([...freshNotices, ...freshUserEvents]);
    } catch (error) {
      console.error("Failed to refresh events:", error);
    } finally {
      setIsLoading(false);
    }
  }, [fetchEvents]);

  // Optimistic helpers for immediate UI feedback
  const addLocalEvent = useCallback((event: IEvent) => {
    setLocalEvents(prev => [...prev, event]);
  }, []);

  const removeLocalEvent = useCallback((eventId: string) => {
    setLocalEvents(prev => prev.filter(e => e.userEventId !== eventId && String(e.id) !== eventId));
  }, []);

  const updateLocalEvent = useCallback((updated: IEvent) => {
    setLocalEvents(prev =>
      prev.map(e =>
        e.userEventId === updated.userEventId && updated.userEventId ? updated : e
      )
    );
  }, []);

  return (
    <CalendarContext.Provider
      value={{
        selectedDate,
        setSelectedDate: handleSelectDate,
        selectedEntity,
        setSelectedEntity,
        badgeVariant,
        setBadgeVariant,
        visibleHours,
        setVisibleHours,
        workingHours,
        setWorkingHours,
        view,
        setView,
        entities: ENTITIES,
        events: expandedEvents,
        rawEvents: localEvents,
        setLocalEvents,
        addLocalEvent,
        removeLocalEvent,
        updateLocalEvent,
        isLoading,
        refreshEvents,
      }}
    >
      {children}
    </CalendarContext.Provider>
  );
}

export function useCalendar(): ICalendarContext {
  const context = useContext(CalendarContext);
  if (!context)
    throw new Error("useCalendar must be used within a CalendarProvider.");
  return context;
}
