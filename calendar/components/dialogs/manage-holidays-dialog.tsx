"use client";

import { useState, useMemo } from "react";
import { parseISO, format, isAfter, isBefore } from "date-fns";
import { Trash2, Plus } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { SingleDayPicker } from "@/calendar/components/ui/single-day-picker";

import { useCalendar } from "@/calendar/contexts/calendar-context";
import { updateUserEvent, deleteAllClassEvents } from "@/calendar/requests";
import type { IEvent } from "@/calendar/interfaces";

export function ManageHolidaysDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const { rawEvents, refreshEvents } = useCalendar();

  const [newStart, setNewStart] = useState<Date | null>(null);
  const [newEnd, setNewEnd] = useState<Date | null>(null);

  // Identify all class events
  const classEvents = useMemo(() => {
    return rawEvents.filter(
      (e) =>
        e.isUserEvent &&
        e.recurrenceType === "weekly" &&
        e.recurrenceEnd !== null &&
        (e.title?.startsWith("Lec-") ||
          e.title?.startsWith("Tut-") ||
          e.title?.startsWith("Prc-"))
    );
  }, [rawEvents]);

  // Extract all unique exceptions from class events
  const uniqueExceptions = useMemo(() => {
    const dates = new Set<string>();
    classEvents.forEach((evt) => {
      if (evt.recurrenceExceptions) {
        evt.recurrenceExceptions.split(",").forEach((d) => {
          const trimmed = d.trim();
          if (trimmed) dates.add(trimmed);
        });
      }
    });
    return Array.from(dates).sort();
  }, [classEvents]);

  const handleAddHoliday = async () => {
    if (!newStart || !newEnd) {
      toast.error("Please select a start and end date.");
      return;
    }
    if (isBefore(newEnd, newStart)) {
      toast.error("End date cannot be before start date.");
      return;
    }

    setIsUpdating(true);
    const datesToAdd: string[] = [];
    const cursor = new Date(newStart);
    cursor.setHours(0, 0, 0, 0);
    const end = new Date(newEnd);
    end.setHours(23, 59, 59, 999);

    while (cursor <= end) {
      datesToAdd.push(format(cursor, "yyyy-MM-dd"));
      cursor.setDate(cursor.getDate() + 1);
    }

    try {
      // Bulk update all class events
      await Promise.all(
        classEvents.map(async (evt) => {
          if (!evt.userEventId) return;

          const existing = new Set<string>();
          if (evt.recurrenceExceptions) {
            evt.recurrenceExceptions.split(",").forEach((d) => {
              if (d.trim()) existing.add(d.trim());
            });
          }

          datesToAdd.forEach((d) => existing.add(d));
          const newExceptionsStr = Array.from(existing).sort().join(",");

          // Only update if changed
          if (newExceptionsStr !== evt.recurrenceExceptions) {
            await updateUserEvent(evt.userEventId, {
              title: evt.title,
              description: evt.description,
              eventTime: evt.startDate,
              eventEndTime: evt.endDate,
              color: evt.color || "blue",
              recurrenceType: evt.recurrenceType,
              recurrenceEnd: evt.recurrenceEnd,
              recurrenceExceptions: newExceptionsStr ? newExceptionsStr.split(",") : [],
            });
          }
        })
      );
      toast.success("Holiday added to all classes!");
      setNewStart(null);
      setNewEnd(null);
      await refreshEvents();
    } catch (err) {
      toast.error("Failed to add holiday.");
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemoveHoliday = async (dateStr: string) => {
    setIsUpdating(true);
    try {
      await Promise.all(
        classEvents.map(async (evt) => {
          if (!evt.userEventId || !evt.recurrenceExceptions) return;

          const existing = new Set<string>();
          evt.recurrenceExceptions.split(",").forEach((d) => {
            if (d.trim() && d.trim() !== dateStr) {
              existing.add(d.trim());
            }
          });

          const newExceptionsStr = Array.from(existing).sort().join(",");

          // Only update if changed
          if (newExceptionsStr !== evt.recurrenceExceptions) {
            await updateUserEvent(evt.userEventId, {
              title: evt.title,
              description: evt.description,
              eventTime: evt.startDate,
              eventEndTime: evt.endDate,
              color: evt.color || "blue",
              recurrenceType: evt.recurrenceType,
              recurrenceEnd: evt.recurrenceEnd,
              recurrenceExceptions: newExceptionsStr ? newExceptionsStr.split(",") : [],
            });
          }
        })
      );
      toast.success("Holiday removed from all classes!");
      await refreshEvents();
    } catch (err) {
      toast.error("Failed to remove holiday.");
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleClearTimetable = async () => {
    setShowClearConfirm(false);
    setIsUpdating(true);
    try {
      await deleteAllClassEvents();
      toast.success("Timetable cleared successfully!");
      await refreshEvents();
      setIsOpen(false);
    } catch (err) {
      toast.error("Failed to clear timetable.");
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            Manage Timetable
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Manage Timetable</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <div className="text-sm text-muted-foreground">
              Classes are skipped on these dates. Add holidays below to hide classes, or remove them to restore classes.
            </div>

            <div className="space-y-4">
              <h4 className="font-medium">Add New Holiday Range</h4>
              <div className="flex gap-4 items-end">
                <div className="flex-1 space-y-2">
                  <Label>Start Date</Label>
                  <SingleDayPicker placeholder="Start date" value={newStart || undefined} onSelect={(d) => setNewStart(d || null)} />
                </div>
                <div className="flex-1 space-y-2">
                  <Label>End Date</Label>
                  <SingleDayPicker placeholder="End date" value={newEnd || undefined} onSelect={(d) => setNewEnd(d || null)} />
                </div>
              </div>
              <Button
                className="w-full"
                onClick={handleAddHoliday}
                disabled={isUpdating || !newStart || !newEnd}
              >
                {isUpdating ? "Updating..." : "Add Holiday to Classes"}
              </Button>
            </div>

            <div className="space-y-3 pt-4 border-t">
              <h4 className="font-medium">Existing Holidays</h4>
              {uniqueExceptions.length === 0 ? (
                <div className="text-sm text-muted-foreground">No holidays added yet.</div>
              ) : (
                <div className="max-h-48 overflow-y-auto space-y-2 pr-2">
                  {uniqueExceptions.map((dateStr) => (
                    <div key={dateStr} className="flex items-center justify-between p-2 rounded-md border bg-muted/50">
                      <span className="text-sm font-medium">
                        {format(parseISO(dateStr), "MMMM do, yyyy")}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveHoliday(dateStr)}
                        disabled={isUpdating}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="space-y-3 pt-4 border-t">
              <h4 className="font-medium text-destructive">Danger Zone</h4>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Remove all imported Pingala class events.</span>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowClearConfirm(true)}
                  disabled={isUpdating}
                >
                  Clear Timetable
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear Timetable</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to clear all imported Pingala class events? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClearTimetable}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Clear Timetable
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
