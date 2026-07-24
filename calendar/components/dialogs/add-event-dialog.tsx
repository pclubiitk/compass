"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { useDisclosure } from "@/calendar/components/hooks/use-disclosure";
import { useCalendar } from "@/calendar/contexts/calendar-context";
import { createUserEvent } from "@/calendar/requests";
import { userEventSchema } from "@/calendar/schemas.user-event";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { TimeInput } from "@/calendar/components/ui/time-input";
import { SingleDayPicker } from "@/calendar/components/ui/single-day-picker";
import { Form, FormField, FormLabel, FormItem, FormControl, FormMessage } from "@/calendar/components/ui/form";
import { Select, SelectItem, SelectContent, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogHeader, DialogClose, DialogContent, DialogTrigger, DialogTitle, DialogFooter } from "@/components/ui/dialog";

import type { TimeValue } from "react-aria-components";
import type { TUserEventFormData } from "@/calendar/schemas.user-event";

interface IProps {
  children: React.ReactNode;
  startDate?: Date;
  startTime?: { hour: number; minute: number };
}

export function AddEventDialog({ children, startDate, startTime }: IProps) {
  const { addLocalEvent } = useCalendar();
  const { isOpen, onClose, onToggle } = useDisclosure();

  const form = useForm<TUserEventFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(userEventSchema) as any,
    defaultValues: {
      title: "",
      description: "",
      color: "blue",
      repeatWeekly: false,
      recurrenceEndDate: null,
      startDate: typeof startDate !== "undefined" ? startDate : undefined,
      startTime: typeof startTime !== "undefined" ? startTime : undefined,
    },
  });

  const watchRepeatWeekly = form.watch("repeatWeekly");

  const onSubmit = async (values: TUserEventFormData) => {
    const startDateTime = new Date(values.startDate);
    startDateTime.setHours(values.startTime.hour, values.startTime.minute, 0, 0);

    const endDateTime = new Date(values.endDate);
    endDateTime.setHours(values.endTime.hour, values.endTime.minute, 0, 0);

    try {
      const newEvent = await createUserEvent({
        title: values.title,
        description: values.description || "",
        eventTime: startDateTime.toISOString(),
        eventEndTime: endDateTime.toISOString(),
        color: values.color,
        recurrenceType: values.repeatWeekly ? "weekly" : "",
        recurrenceEnd: values.recurrenceEndDate ? values.recurrenceEndDate.toISOString() : null,
      });

      // Optimistically add to calendar immediately
      addLocalEvent(newEvent);
      toast.success("Event created!");
      onClose();
      form.reset();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create event");
    }
  };

  useEffect(() => {
    if (isOpen) {
      form.reset({
        title: "",
        description: "",
        color: "blue",
        repeatWeekly: false,
        recurrenceEndDate: null,
        startDate,
        startTime,
      });
    }
  }, [isOpen, startDate, startTime, form]);

  return (
    <Dialog open={isOpen} onOpenChange={onToggle}>
      <DialogTrigger asChild>{children}</DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Personal Event</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form id="user-event-form" onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel htmlFor="title">Title</FormLabel>
                  <FormControl>
                    <Input id="title" placeholder="Event title" maxLength={50} data-invalid={fieldState.invalid} {...field} />
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
                        id="repeatWeekly"
                        checked={field.value}
                        onChange={field.onChange}
                        className="h-4 w-4 rounded border-border accent-primary"
                      />
                    </FormControl>
                    <FormLabel htmlFor="repeatWeekly" className="!mt-0 cursor-pointer">
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

          <Button form="user-event-form" type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Creating..." : "Create Event"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
