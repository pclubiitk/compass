import { z } from "zod";

/**
 * Schema for user-created personal calendar events.
 * Simpler than the main eventSchema — no entity selection (always "Personal").
 * Kept separate so the original eventSchema is never modified.
 */
export const userEventSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().default(""),
  startDate: z.date({ error: "Start date is required" }),
  startTime: z.object(
    { hour: z.number(), minute: z.number() },
    { error: "Start time is required" }
  ),
  endDate: z.date({ error: "End date is required" }),
  endTime: z.object(
    { hour: z.number(), minute: z.number() },
    { error: "End time is required" }
  ),
  color: z.enum(
    ["blue", "green", "red", "yellow", "purple", "orange", "gray"],
    { error: "Color is required" }
  ),
});

export type TUserEventFormData = z.infer<typeof userEventSchema>;
