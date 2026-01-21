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
  const start = new Date(notice.eventTime);
  const end = new Date(notice.eventEndTime);

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
export async function getEvents(page: number = 1): Promise<IEvent[]> {
  const mapServer = process.env.NEXT_PUBLIC_MAP_SERVER || process.env.NEXT_PUBLIC_MAPS_URL;
  
  if (!mapServer) {
    console.error("Map server URL not configured");
    return [];
  }

  try {
    const res = await fetch(`${mapServer}/api/maps/notice?page=${page}`);
    
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
