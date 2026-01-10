import { z } from "zod";

export const eventSchema = z.object({
  entity: z.string().optional(), // Entity organizing the event
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
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

export type TEventFormData = z.infer<typeof eventSchema>;
