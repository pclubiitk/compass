/**
 * Campus Compass - Entity Constants
 *
 * Entities represent organizations that can publish events/notices.
 * These include Departments, Clubs, Cells, and Administrative bodies.
 *
 * The entity system is separate from the contributor (admin who creates the event).
 * An admin can create events for any entity.
 *
 * Color mapping is used for calendar event display.
 */

import type { TEventColor } from "@/calendar/types";

export interface IEntity {
  id: string;
  name: string;
  shortName: string;
  type: "department" | "club" | "cell" | "administration" | "other";
  color: TEventColor;
  logo?: string; // Optional path to entity logo
}

/**
 * Entity definitions for Campus Compass
 * Add new entities here as needed
 */
export const ENTITIES: IEntity[] = [
  // Departments
  {
    id: "dept-cse",
    name: "Computer Science and Engineering",
    shortName: "CSE",
    type: "department",
    color: "blue",
  },
  {
    id: "dept-ee",
    name: "Electrical Engineering",
    shortName: "EE",
    type: "department",
    color: "yellow",
  },
  {
    id: "dept-me",
    name: "Mechanical Engineering",
    shortName: "ME",
    type: "department",
    color: "orange",
  },
  {
    id: "dept-ce",
    name: "Civil Engineering",
    shortName: "CE",
    type: "department",
    color: "gray",
  },
  {
    id: "dept-che",
    name: "Chemical Engineering",
    shortName: "CHE",
    type: "department",
    color: "purple",
  },

  // Clubs
  {
    id: "club-pclub",
    name: "Programming Club",
    shortName: "PClub",
    type: "club",
    color: "blue",
  },
  {
    id: "club-eclub",
    name: "Electronics Club",
    shortName: "EClub",
    type: "club",
    color: "green",
  },
  {
    id: "club-robotics",
    name: "Robotics Club",
    shortName: "Robo",
    type: "club",
    color: "red",
  },
  {
    id: "club-aeromodelling",
    name: "Aeromodelling Club",
    shortName: "AeroClub",
    type: "club",
    color: "purple",
  },
  {
    id: "club-astronomy",
    name: "Astronomy Club",
    shortName: "AstroClub",
    type: "club",
    color: "blue",
  },

  // Administration
  {
    id: "admin-doaa",
    name: "Dean of Academic Affairs",
    shortName: "DoAA",
    type: "administration",
    color: "gray",
  },
  {
    id: "admin-dosa",
    name: "Dean of Student Affairs",
    shortName: "DoSA",
    type: "administration",
    color: "gray",
  },
  {
    id: "admin-senate",
    name: "Senate",
    shortName: "Senate",
    type: "administration",
    color: "blue",
  },

  // Fallback
  {
    id: "other",
    name: "General",
    shortName: "General",
    type: "other",
    color: "gray",
  },
];

/**
 * Get entity by ID
 */
export function getEntityById(id: string): IEntity | undefined {
  return ENTITIES.find((e) => e.id === id);
}

/**
 * Get entity by name (case-insensitive partial match)
 */
export function getEntityByName(name: string): IEntity | undefined {
  const lowerName = name.toLowerCase();
  return ENTITIES.find(
    (e) =>
      e.name.toLowerCase().includes(lowerName) ||
      e.shortName.toLowerCase() === lowerName
  );
}

/**
 * Get color for an entity name
 * Falls back to "gray" if entity not found
 */
export function getEntityColor(entityName: string): TEventColor {
  const entity = getEntityByName(entityName);
  return entity?.color ?? "gray";
}

/**
 * Get all entities by type
 */
export function getEntitiesByType(type: IEntity["type"]): IEntity[] {
  return ENTITIES.filter((e) => e.type === type);
}

/**
 * Entity type labels for UI display
 */
export const ENTITY_TYPE_LABELS: Record<IEntity["type"], string> = {
  department: "Departments",
  club: "Clubs",
  cell: "Cells & Councils",
  administration: "Administration",
  other: "Other",
};
