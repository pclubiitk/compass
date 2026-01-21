import type { TEventColor } from "@/calendar/types";

/**
 * User interface - kept for upstream compatibility
 * In Campus Compass context, this represents contributors/admins
 */
export interface IUser {
  id: string;
  name: string;
  picturePath: string | null;
}

/**
 * Entity interface - represents event organizers
 * Entities are departments, clubs, cells, etc.
 * Separate from the user/admin who creates the event
 */
export interface IEntity {
  id: string;
  name: string;
  shortName: string;
  type: "department" | "club" | "cell" | "administration" | "other";
  color: TEventColor;
  logo?: string;
}

/**
 * Event interface for calendar display
 *
 * In Campus Compass:
 * - Events are the same as Notices from the noticeboard
 * - entity: The organization hosting the event (club, dept, etc.)
 * - The contributor (admin who created it) is NOT stored here
 */
export interface IEvent {
  id: number | string;
  startDate: string;
  endDate: string;
  title: string;
  color: TEventColor;
  description: string;
  location?: string;
  // Entity that published/organizes the event
  entity?: string;
  // Original notice ID for linking back to noticeboard
  noticeId?: string;
}

export interface ICalendarCell {
  day: number;
  currentMonth: boolean;
  date: Date;
}
