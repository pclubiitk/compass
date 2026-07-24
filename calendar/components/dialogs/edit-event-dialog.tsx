"use client";

import { useState } from "react";
import { parseISO, format, differenceInDays, startOfDay, addDays } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Time } from "@internationalized/date";

import { useDisclosure } from "@/calendar/components/hooks/use-disclosure";
import { useCalendar } from "@/calendar/contexts/calendar-context";
import { updateUserEvent, createUserEvent, deleteUserEvent } from "@/calendar/requests";
import { userEventSchema } from "@/calendar/schemas.user-event";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { TimeInput } from "@/calendar/components/ui/time-input";
import { SingleDayPicker } from "@/calendar/components/ui/single-day-picker";
import { Form, FormField, FormLabel, FormItem, FormControl, FormMessage } from "@/calendar/components/ui/form";
import { Select, SelectItem, SelectContent, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogHeader, DialogClose, DialogContent, DialogTrigger, DialogTitle, DialogFooter } from "@/components/ui/dialog";

import type { IEvent } from "@/calendar/interfaces";
import type { TimeValue } from "react-aria-components";
import type { TUserEventFormData } from "@/calendar/schemas.user-event";

interface IProps {
  children: React.ReactNode;
  event: IEvent;
}

export function EditEventDialog({ children, event }: IProps) {
  const { isOpen, onClose, onToggle } = useDisclosure();
  const startDate = parseISO(event.startDate);
  const endDate = parseISO(event.endDate);

  const form = useForm<TUserEventFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(userEventSchema) as any,
    defaultValues: {
      title: event.title,
      description: event.description,
      startDate: startDate,
      startTime: new Time(startDate.getHours(), startDate.getMinutes()),
      endDate: endDate,
      endTime: new Time(endDate.getHours(), endDate.getMinutes()),
      color: (event.color as TUserEventFormData["color"]) || "blue",
      repeatWeekly: event.recurrenceType === "weekly",
      recurrenceEndDate: event.recurrenceEnd ? parseISO(event.recurrenceEnd) : null,
    },
  });

  const isClassEvent = event.title.startsWith("Lec-") || event.title.startsWith("Tut-") || event.title.startsWith("Prc-");
  const watchRepeatWeekly = form.watch("repeatWeekly");

  const [pendingEdit, setPendingEdit] = useState<TUserEventFormData | null>(null);
  const [showRecurrencePrompt, setShowRecurrencePrompt] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const { rawEvents, refreshEvents, updateLocalEvent, events: allEvents } = useCalendar();

  const isDetached = rawEvents.some(
    e => e.title === event.title && e.recurrenceType === "weekly" && e.userEventId !== event.userEventId
  );

  const isRecurring = event.recurrenceType === "weekly";

  const onSubmit = async (values: TUserEventFormData) => {
    if (!event.userEventId) {
      toast.error("Cannot edit this event");
      return;
    }

    // If user unticked "Repeat weekly" on a recurring event, stop recurrence
    // from this occurrence onwards (keep past ones) — no prompt needed
    if (isRecurring && !values.repeatWeekly) {
      const endOfThisDay = startOfDay(parseISO(event.startDate));
      endOfThisDay.setHours(23, 59, 59, 999);

      const baseEvent = rawEvents.find(e => e.userEventId === event.userEventId) || event;

      setIsUpdating(true);
      try {
        await updateUserEvent(event.userEventId, {
          title: values.title,
          description: values.description || "",
          eventTime: baseEvent.startDate,
          eventEndTime: baseEvent.endDate,
          color: values.color,
          recurrenceType: "weekly",
          recurrenceEnd: endOfThisDay.toISOString(),
          recurrenceExceptions: baseEvent.recurrenceExceptions
            ? baseEvent.recurrenceExceptions.split(",").map(d => d.trim()).filter(Boolean)
            : undefined,
        });

        // Clean up any detached standalone exceptions that happen after the new end date
        const standaloneEvents = rawEvents.filter(
          e => e.title === baseEvent.title && e.recurrenceType === "" && e.userEventId !== event.userEventId
        );
        for (const standalone of standaloneEvents) {
          if (!standalone.userEventId) continue;
          if (parseISO(standalone.startDate) > endOfThisDay) {
            await deleteUserEvent(standalone.userEventId);
          }
        }

        await refreshEvents();
        toast.success("Future occurrences removed!");
        onClose();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to update event");
      } finally {
        setIsUpdating(false);
      }
      return;
    }

    const isRecurrenceEndChanged = form.formState.dirtyFields.recurrenceEndDate;
    const occurrences = allEvents.filter(e => e.userEventId === event.userEventId);

    if (isRecurring && !isRecurrenceEndChanged && occurrences.length > 1) {
      setPendingEdit(values);
      setShowRecurrencePrompt(true);
    } else {
      await handleEditSeries(values);
    }
  };

  const handleEditSeries = async (values: TUserEventFormData) => {
    if (!event.userEventId) return;
    setIsUpdating(true);

    const baseEvent = rawEvents.find(e => e.userEventId === event.userEventId) || event;
    const originalInstanceDate = startOfDay(parseISO(event.startDate));
    const newInstanceDate = startOfDay(values.startDate);
    const daysOffset = differenceInDays(newInstanceDate, originalInstanceDate);

    const baseStartDate = parseISO(baseEvent.startDate);
    const newBaseStartDate = addDays(baseStartDate, daysOffset);
    newBaseStartDate.setHours(values.startTime.hour, values.startTime.minute, 0, 0);

    const baseEndDate = parseISO(baseEvent.endDate);
    const newBaseEndDate = addDays(baseEndDate, daysOffset);
    newBaseEndDate.setHours(values.endTime.hour, values.endTime.minute, 0, 0);

    let newExceptions: string[] | undefined = undefined;
    if (baseEvent.recurrenceExceptions) {
      newExceptions = baseEvent.recurrenceExceptions
        .split(",")
        .map(d => d.trim())
        .filter(Boolean)
        .map(d => {
          if (daysOffset === 0) return d;
          return format(addDays(parseISO(d), daysOffset), "yyyy-MM-dd");
        });
    }

    try {
      const updatedEvent = await updateUserEvent(event.userEventId, {
        title: values.title,
        description: values.description || "",
        eventTime: newBaseStartDate.toISOString(),
        eventEndTime: newBaseEndDate.toISOString(),
        color: values.color,
        recurrenceType: values.repeatWeekly ? "weekly" : "",
        recurrenceEnd: values.recurrenceEndDate ? values.recurrenceEndDate.toISOString() : null,
        recurrenceExceptions: newExceptions,
      });

      // Also update any detached standalone occurrences that share the same title
      const standaloneEvents = rawEvents.filter(
        e => e.title === baseEvent.title && e.recurrenceType === "" && e.userEventId !== event.userEventId
      );

      for (const standalone of standaloneEvents) {
        if (!standalone.userEventId) continue;

        if (!values.repeatWeekly) {
          await deleteUserEvent(standalone.userEventId);
          continue;
        }

        const newStandaloneStart = addDays(parseISO(standalone.startDate), daysOffset);
        newStandaloneStart.setHours(values.startTime.hour, values.startTime.minute, 0, 0);

        const newStandaloneEnd = addDays(parseISO(standalone.endDate), daysOffset);
        newStandaloneEnd.setHours(values.endTime.hour, values.endTime.minute, 0, 0);

        await updateUserEvent(standalone.userEventId, {
          title: values.title,
          description: values.description || "",
          eventTime: newStandaloneStart.toISOString(),
          eventEndTime: newStandaloneEnd.toISOString(),
          color: values.color,
          recurrenceType: "",
          recurrenceEnd: null,
        });
      }

      await refreshEvents();

      updateLocalEvent(updatedEvent);
      toast.success("Event updated!");
      setShowRecurrencePrompt(false);
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update event");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleEditSingle = async () => {
    if (!event.userEventId || !pendingEdit) return;
    setIsUpdating(true);

    try {
      const baseEvent = rawEvents.find(e => e.userEventId === event.userEventId);
      if (!baseEvent) throw new Error("Base event not found");

      // 1. Add exception to base event for this specific occurrence
      const dateStr = format(parseISO(event.startDate), "yyyy-MM-dd");
      const existing = new Set<string>();
      if (baseEvent.recurrenceExceptions) {
        baseEvent.recurrenceExceptions.split(",").forEach(d => {
          if (d.trim()) existing.add(d.trim());
        });
      }
      existing.add(dateStr);
      const newExceptionsStr = Array.from(existing).sort().join(",");

      await updateUserEvent(baseEvent.userEventId!, {
        title: baseEvent.title,
        description: baseEvent.description || "",
        eventTime: baseEvent.startDate,
        eventEndTime: baseEvent.endDate,
        color: baseEvent.color || "blue",
        recurrenceType: baseEvent.recurrenceType,
        recurrenceEnd: baseEvent.recurrenceEnd,
        recurrenceExceptions: newExceptionsStr ? newExceptionsStr.split(",") : [],
      });

      // 2. Create a new standalone event for the edits
      const startDateTime = new Date(pendingEdit.startDate);
      startDateTime.setHours(pendingEdit.startTime.hour, pendingEdit.startTime.minute, 0, 0);

      const endDateTime = new Date(pendingEdit.endDate);
      endDateTime.setHours(pendingEdit.endTime.hour, pendingEdit.endTime.minute, 0, 0);

      await createUserEvent({
        title: pendingEdit.title,
        description: pendingEdit.description || "",
        eventTime: startDateTime.toISOString(),
        eventEndTime: endDateTime.toISOString(),
        color: pendingEdit.color,
        recurrenceType: "",
        recurrenceEnd: null,
      });

      await refreshEvents();
      toast.success("Occurrence updated!");
      setShowRecurrencePrompt(false);
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update occurrence");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onToggle}>
        <DialogTrigger asChild>{children}</DialogTrigger>

        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Event</DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form id="edit-event-form" onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel htmlFor="title">Title</FormLabel>
                    <FormControl>
                      <Input id="title" disabled={event.title.startsWith("Lec-") || event.title.startsWith("Tut-") || event.title.startsWith("Prc-")} placeholder="Event title" maxLength={50} data-invalid={fieldState.invalid} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex items-start gap-2">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field, fieldState }) => (
                    <FormItem className="flex-1">
                      <FormLabel htmlFor="startDate">Start Date</FormLabel>
                      <FormControl>
                        <SingleDayPicker
                          id="startDate"
                          value={field.value}
                          onSelect={date => field.onChange(date as Date)}
                          placeholder="Select a date"
                          data-invalid={fieldState.invalid}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="startTime"
                  render={({ field, fieldState }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Start Time</FormLabel>
                      <FormControl>
                        <TimeInput value={field.value as TimeValue} onChange={field.onChange} hourCycle={12} data-invalid={fieldState.invalid} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex items-start gap-2">
                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field, fieldState }) => (
                    <FormItem className="flex-1">
                      <FormLabel>End Date</FormLabel>
                      <FormControl>
                        <SingleDayPicker
                          value={field.value}
                          onSelect={date => field.onChange(date as Date)}
                          placeholder="Select a date"
                          data-invalid={fieldState.invalid}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="endTime"
                  render={({ field, fieldState }) => (
                    <FormItem className="flex-1">
                      <FormLabel>End Time</FormLabel>
                      <FormControl>
                        <TimeInput value={field.value as TimeValue} onChange={field.onChange} hourCycle={12} data-invalid={fieldState.invalid} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="color"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel>Color</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger data-invalid={fieldState.invalid}>
                          <SelectValue placeholder="Select a color" />
                        </SelectTrigger>
                        <SelectContent>
                          {[
                            { value: "blue", label: "Blue", bg: "bg-blue-500" },
                            { value: "green", label: "Green", bg: "bg-green-500" },
                            { value: "red", label: "Red", bg: "bg-red-500" },
                            { value: "yellow", label: "Yellow", bg: "bg-yellow-500" },
                            { value: "purple", label: "Purple", bg: "bg-purple-500" },
                            { value: "orange", label: "Orange", bg: "bg-orange-500" },
                            { value: "gray", label: "Gray", bg: "bg-neutral-500" },
                          ].map(c => (
                            <SelectItem key={c.value} value={c.value}>
                              <div className="flex items-center gap-2">
                                <div className={`size-3.5 rounded-full ${c.bg}`} />
                                {c.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {!isClassEvent && !isDetached && (
                <>
                  {/* Recurrence toggle */}
                  <FormField
                    control={form.control}
                    name="repeatWeekly"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center gap-2">
                          <FormControl>
                            <input
                              type="checkbox"
                              id="edit-repeatWeekly"
                              checked={field.value}
                              onChange={field.onChange}
                              className="h-4 w-4 rounded border-border accent-primary"
                            />
                          </FormControl>
                          <FormLabel htmlFor="edit-repeatWeekly" className="!mt-0 cursor-pointer">
                            Repeat weekly
                          </FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />

                  {watchRepeatWeekly && (
                    <FormField
                      control={form.control}
                      name="recurrenceEndDate"
                      render={({ field, fieldState }) => (
                        <FormItem>
                          <FormLabel>Repeat until (optional — leave empty for forever)</FormLabel>
                          <FormControl>
                            <SingleDayPicker
                              value={field.value ?? undefined}
                              onSelect={date => field.onChange(date as Date)}
                              placeholder="No end date (forever)"
                              data-invalid={fieldState.invalid}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </>
              )}

              <FormField
                control={form.control}
                name="description"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel>Description (optional)</FormLabel>
                    <FormControl>
                      <Textarea {...field} value={field.value} data-invalid={fieldState.invalid} placeholder="Add a description..." />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>

            <Button form="edit-event-form" type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showRecurrencePrompt} onOpenChange={setShowRecurrencePrompt}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Recurring Event</DialogTitle>
          </DialogHeader>
          <div className="py-4 text-sm">
            You are editing a recurring class event. Do you want to apply these changes to only this specific occurrence, or all occurrences in the series?
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setShowRecurrencePrompt(false)} disabled={isUpdating}>
              Cancel
            </Button>
            <Button variant="secondary" onClick={handleEditSingle} disabled={isUpdating}>
              This Occurrence Only
            </Button>
            <Button onClick={() => pendingEdit && handleEditSeries(pendingEdit)} disabled={isUpdating}>
              All Occurrences
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
