import { z } from "zod";

/**
 * Schema for user-created personal calendar events.
 * Simpler than the main eventSchema — no entity selection (always "Personal").
 * Kept separate so the original eventSchema is never modified.
 */
export const userEventSchema = z.object({
  title: z.string().min(1, "Title is required").max(50, "Title must be 50 characters or less"),
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
  // Recurrence fields
  repeatWeekly: z.boolean().default(false),
  recurrenceEndDate: z.date().optional().nullable(),
}).superRefine((data, ctx) => {
  const startDateTime = new Date(data.startDate);
  startDateTime.setHours(data.startTime.hour, data.startTime.minute, 0, 0);

  const endDateTime = new Date(data.endDate);
  endDateTime.setHours(data.endTime.hour, data.endTime.minute, 0, 0);

  if (startDateTime >= endDateTime) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "End time must be after start time",
      path: ["endTime"],
    });
  }

  if (data.repeatWeekly && data.recurrenceEndDate) {
    const recurrenceEnd = new Date(data.recurrenceEndDate);
    recurrenceEnd.setHours(23, 59, 59, 999);
    if (recurrenceEnd < startDateTime) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Recurrence end date must be after start date",
        path: ["recurrenceEndDate"],
      });
    }
  }
});

export type TUserEventFormData = z.infer<typeof userEventSchema>;
