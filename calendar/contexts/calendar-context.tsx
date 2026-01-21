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

import { createContext, useContext, useState, useEffect, useCallback } from "react";

import type { Dispatch, SetStateAction } from "react";
import type { IEvent } from "@/calendar/interfaces";
import type {
  TBadgeVariant,
  TCalendarView,
  TVisibleHours,
  TWorkingHours,
} from "@/calendar/types";

interface ICalendarContext {
  selectedDate: Date;
  setSelectedDate: (date: Date | undefined) => void;
  // Entity filtering (replaces user filtering)
  selectedEntity: string | "all";
  setSelectedEntity: (entity: string | "all") => void;
  badgeVariant: TBadgeVariant;
  setBadgeVariant: (variant: TBadgeVariant) => void;
  workingHours: TWorkingHours;
  setWorkingHours: Dispatch<SetStateAction<TWorkingHours>>;
  visibleHours: TVisibleHours;
  setVisibleHours: Dispatch<SetStateAction<TVisibleHours>>;
  events: IEvent[];
  setLocalEvents: Dispatch<SetStateAction<IEvent[]>>;
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
  const [visibleHours, setVisibleHours] = useState<TVisibleHours>(VISIBLE_HOURS);
  const [workingHours, setWorkingHours] = useState<TWorkingHours>(WORKING_HOURS);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedEntity, setSelectedEntity] = useState<string | "all">("all");
  const [view, setView] = useState<TCalendarView>("month");
  const [isLoading, setIsLoading] = useState(false);

  // Local events state - allows for optimistic updates
  // TODO: Look into the local fetching and caching logic
  const [localEvents, setLocalEvents] = useState<IEvent[]>(events);

  // Sync local events when prop changes
  useEffect(() => {
    setLocalEvents(events);
  }, [events]);

  const handleSelectDate = (date: Date | undefined) => {
    if (!date) return;
    setSelectedDate(date);
  };

  // Refresh events from server
  const refreshEvents = useCallback(async () => {
    if (!fetchEvents) return;

    setIsLoading(true);
    try {
      const freshEvents = await fetchEvents();
      setLocalEvents(freshEvents);
    } catch (error) {
      console.error("Failed to refresh events:", error);
    } finally {
      setIsLoading(false);
    }
  }, [fetchEvents]);

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
        events: localEvents,
        setLocalEvents,
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
