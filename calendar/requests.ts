/**
 * Calendar Data Requests
 * 
 * This file handles fetching and transforming data for the calendar.
 * In Campus Compass, calendar events come from the Noticeboard API.
 * 
 * Events (Notices) are published by entities (clubs, depts, cells)
 * and display on the calendar for users to see upcoming activities.
 */

import type { IEvent } from "@/calendar/interfaces";
import { getEntityColor } from "@/calendar/entities";

/**
 * Raw notice structure from the backend API
 */
interface NoticeFromAPI {
  NoticeId: string;
  title: string;
  description: string;
  body?: string;
  entity: string;
  eventTime: string;
  eventEndTime: string;
  location: string;
  created_at: string;
  ContributedBy?: string;
  user?: {
    name: string;
    email: string;
  };
}

/**
 * API Response structure
 */
interface NoticeAPIResponse {
  noticeboard_list: NoticeFromAPI[];
  total_notices: number;
  current_page: number;
}

/**
 * Transform a notice from the API into a calendar event
 */
function noticeToEvent(notice: NoticeFromAPI, index: number): IEvent | null {
  //const start = new Date(notice.eventTime);
  //const end = new Date(notice.eventEndTime);

  const cleanStartTime = notice.eventTime.replace(/(Z|[+-]\d{2}:?\d{2})$/, '');
  const cleanEndTime = notice.eventEndTime.replace(/(Z|[+-]\d{2}:?\d{2})$/, '');

  const start = new Date(cleanStartTime);
  const end = new Date(cleanEndTime);

  // Skip notices with invalid dates
  if (isNaN(start.getTime())) {
    console.warn("Invalid date in notice:", notice.title, notice.eventTime);
    return null;
  }

  // If end date is invalid, default to start date + 1 hour
  const validEnd = isNaN(end.getTime())
    ? new Date(start.getTime() + 60 * 60 * 1000)
    : end;

  return {
    id: index + 1,
    noticeId: notice.NoticeId,
    title: notice.title,
    description: notice.description || "",
    startDate: start.toISOString(),
    endDate: validEnd.toISOString(),
    location: notice.location || "Campus",
    entity: notice.entity || "General",
    color: getEntityColor(notice.entity || ""),
  };
}

/**
 * Fetch events (notices) from the Noticeboard API
 * 
 * @param page - Page number for pagination (default: 1)
 * @returns Array of calendar events
 */
export async function getEvents(page: number = 1, pagination: boolean = true): Promise<IEvent[]> {
  const mapServer = process.env.NEXT_PUBLIC_MAP_SERVER || process.env.NEXT_PUBLIC_MAPS_URL;

  if (!mapServer) {
    console.error("Map server URL not configured");
    return [];
  }

  try {
    const res = await fetch(`${mapServer}/api/maps/notice?page=${page}&pagination=${pagination}`);
    // console.log(`Fetching events from: ${mapServer}/api/maps/notice?page=${page}&pagination=${pagination}`);

    if (!res.ok) {
      throw new Error(`Failed to fetch notices: ${res.status}`);
    }

    const data: NoticeAPIResponse = await res.json();

    // Transform notices to calendar events, filtering out invalid ones
    const events: IEvent[] = data.noticeboard_list
      .map((notice, index) => noticeToEvent(notice, index))
      .filter((event): event is IEvent => event !== null);

    return events;
  } catch (err) {
    console.error("Failed to fetch notices for calendar:", err);
    return [];
  }
}

/**
 * Fetch all events by loading multiple pages
 * Useful for getting complete calendar data
 * 
 * @param maxPages - Maximum pages to fetch (default: 5)
 */
export async function getAllEvents(maxPages: number = 5): Promise<IEvent[]> {
  const allEvents: IEvent[] = [];

  for (let page = 1; page <= maxPages; page++) {
    const events = await getEvents(page);
    if (events.length === 0) break; // No more events
    allEvents.push(...events);
  }

  // Re-index all events to have unique IDs
  return allEvents.map((event, index) => ({
    ...event,
    id: index + 1,
  }));
}

/**
 * @deprecated Kept for upstream compatibility - not used in Campus Compass
 * Users in our context are the contributors/admins, not shown in calendar
 */
export async function getUsers() {
  return [];
}

// ─────────────────────────────────────────────
// Personal User Event API
// ─────────────────────────────────────────────

/**
 * Raw user event structure from the backend API
 */
interface UserEventFromAPI {
  eventId: string;
  title: string;
  description: string;
  eventTime: string;    // ISO string
  eventEndTime: string; // ISO string
  color: string;
  contributedBy: string;
  recurrenceType?: string;
  recurrenceEnd?: string | null;
  recurrenceExceptions?: string;
}

/**
 * Transform a UserEvent from the API into a calendar IEvent
 */
function userEventToIEvent(event: UserEventFromAPI, index: number): IEvent {
  return {
    id: `user-${event.eventId}`,
    userEventId: event.eventId,
    title: event.title,
    description: event.description || "",
    startDate: event.eventTime,
    endDate: event.eventEndTime,
    color: (event.color as IEvent["color"]) || "blue",
    entity: "personal",      // Always tagged as Personal
    isUserEvent: true,
    recurrenceType: event.recurrenceType || "",
    recurrenceEnd: event.recurrenceEnd || null,
    recurrenceExceptions: event.recurrenceExceptions || "",
  };
}

/**
 * Fetch the authenticated user's personal calendar events
 */
export async function getUserEvents(): Promise<IEvent[]> {
  const mapServer = process.env.NEXT_PUBLIC_MAP_SERVER || process.env.NEXT_PUBLIC_MAPS_URL;
  if (!mapServer) return [];

  try {
    const res = await fetch(`${mapServer}/api/maps/user-events`, {
      credentials: "include",
      cache: "no-store",
      headers: {
        "Cache-Control": "no-cache",
      },
    });
    if (!res.ok) {
      if (res.status === 401) return []; // Not logged in — silently return empty
      throw new Error(`Failed to fetch user events: ${res.status}`);
    }
    const data: { events: UserEventFromAPI[] } = await res.json();
    return (data.events || []).map((e, i) => userEventToIEvent(e, i));
  } catch (err) {
    console.warn("Failed to fetch personal events:", err);
    return [];
  }
}

export interface CreateUserEventPayload {
  title: string;
  description: string;
  eventTime: string;    // ISO string
  eventEndTime: string; // ISO string
  color: string;
  recurrenceType?: string;
  recurrenceEnd?: string | null;
  recurrenceExceptions?: string[];
}

/**
 * Create a new personal calendar event
 */
export async function createUserEvent(payload: CreateUserEventPayload): Promise<IEvent> {
  const mapServer = process.env.NEXT_PUBLIC_MAP_SERVER || process.env.NEXT_PUBLIC_MAPS_URL;
  if (!mapServer) throw new Error("Map server not configured");

  const res = await fetch(`${mapServer}/api/maps/user-event`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to create event");
  }

  const data: { event: UserEventFromAPI } = await res.json();
  return userEventToIEvent(data.event, 0);
}

/**
 * Update a personal calendar event (ownership enforced server-side)
 */
export async function updateUserEvent(eventId: string, payload: CreateUserEventPayload): Promise<IEvent> {
  const mapServer = process.env.NEXT_PUBLIC_MAP_SERVER || process.env.NEXT_PUBLIC_MAPS_URL;
  if (!mapServer) throw new Error("Map server not configured");

  const res = await fetch(`${mapServer}/api/maps/user-event/${eventId}`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to update event");
  }

  const data: { event: UserEventFromAPI } = await res.json();
  return userEventToIEvent(data.event, 0);
}

/**
 * Delete a personal calendar event (ownership enforced server-side)
 */
export async function deleteUserEvent(eventId: string): Promise<void> {
  const mapServer = process.env.NEXT_PUBLIC_MAP_SERVER || process.env.NEXT_PUBLIC_MAPS_URL;
  if (!mapServer) throw new Error("Map server not configured");

  const res = await fetch(`${mapServer}/api/maps/user-event/${eventId}`, {
    method: "DELETE",
    credentials: "include",
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to delete event");
  }
}


// WebCal API

export interface CalendarTokenResponse {
  /** https:// calendar subscription URL */
  https_url: string;
}

/**
 * Derive a webcal:// URL from an https (or http) URL.
 * Calendar apps like Google Calendar and Apple Calendar recognise webcal://
 * as a subscription hint.
 */
export function toWebcalUrl(httpsUrl: string): string {
  return httpsUrl.replace(/^https?:\/\//, "webcal://");
}

/**
 * Fetch the authenticated user's calendar sync token and subscription URLs, returns null if the user is not authenticated.
 */
export async function getCalendarToken(): Promise<CalendarTokenResponse | null> {
  const mapServer = process.env.NEXT_PUBLIC_MAP_SERVER || process.env.NEXT_PUBLIC_MAPS_URL;
  if (!mapServer) return null;

  const res = await fetch(`${mapServer}/api/maps/calendar/token`, {
    credentials: "include",
  });

  if (!res.ok) {
    if (res.status === 401) return null; // not logged in
    throw new Error(`Failed to fetch calendar token: ${res.status}`);
  }

  return res.json() as Promise<CalendarTokenResponse>;
}

/**
 * Regenerate the user's calendar token, the old subscription URL will stop working immediately, returns the new token and subscription URLs.
 */
export async function regenerateCalendarToken(): Promise<CalendarTokenResponse> {
  const mapServer = process.env.NEXT_PUBLIC_MAP_SERVER || process.env.NEXT_PUBLIC_MAPS_URL;
  if (!mapServer) throw new Error("Map server not configured");

  const res = await fetch(`${mapServer}/api/maps/calendar/token/regenerate`, {
    method: "POST",
    credentials: "include",
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to regenerate calendar token");
  }

  return res.json() as Promise<CalendarTokenResponse>;
}

/**
 * Delete all imported class events for the authenticated user.
 */
export async function deleteAllClassEvents(): Promise<{ message: string }> {
  const mapServer = process.env.NEXT_PUBLIC_MAP_SERVER || process.env.NEXT_PUBLIC_MAPS_URL;
  if (!mapServer) throw new Error("Map server not configured");

  const res = await fetch(`${mapServer}/api/maps/user-events/classes`, {
    method: "DELETE",
    credentials: "include",
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to clear timetable");
  }

  return res.json();
}
