"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useMediaQuery } from "@/app/hooks/use-media-query";

interface LocationData {
  locationId: string;
  name: string;
  description: string;
  avg_rating: number;
  ReviewCount: number;
  Tag: string;
  Time: string;
  Contact: string;
  contact: string;
  coverpic: string;
  biopics: string[];
  location_type?: string;
}

interface EditLocationDrawerProps {
  location: LocationData;
  onLocationUpdated: () => void;
  children: React.ReactNode;
}

export function EditLocationDrawer({
  location,
  onLocationUpdated,
  children,
}: EditLocationDrawerProps) {
  const [name, setName] = useState(location.name);
  const [description, setDescription] = useState(location.description);
  const [tag, setTag] = useState(location.Tag);
  const [time, setTime] = useState(location.Time);
  const [contactPerson, setContactPerson] = useState(location.Contact);
  const [contactInfo, setContactInfo] = useState(location.contact);
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const handleSubmit = async () => {
    if (!name || !description || !tag || !time || !contactPerson || !contactInfo) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setIsSubmitting(true);
    try {
      const updateData = {
        name,
        description,
        Tag: tag,
        Time: time,
        Contact: contactPerson,
        contact: contactInfo,
      };

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_MAPS_URL}/api/maps/location/${location.locationId}`,
        {
          method: "PUT",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updateData),
        }
      );

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to update location");
      }

      toast.success("Location updated successfully!");
      setIsOpen(false);
      onLocationUpdated();
    } catch (err) {
      console.error("Failed to update location:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to update location"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isDesktop) {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>{children}</DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Location</DialogTitle>
            <DialogDescription>
              Update the location details below.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Location Name *</Label>
              <Input
                id="edit-name"
                placeholder="Location name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Description *</Label>
              <Textarea
                id="edit-description"
                placeholder="Location description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isSubmitting}
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-tag">Category/Tag *</Label>
                <Input
                  id="edit-tag"
                  placeholder="e.g., Library, Cafe"
                  value={tag}
                  onChange={(e) => setTag(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-time">Hours *</Label>
                <Input
                  id="edit-time"
                  placeholder="e.g., 9AM - 5PM"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-contact-person">Contact Person *</Label>
              <Input
                id="edit-contact-person"
                placeholder="Name of contact person"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-contact-info">Contact Information *</Label>
              <Input
                id="edit-contact-info"
                placeholder="Phone or Email"
                value={contactInfo}
                onChange={(e) => setContactInfo(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Update Location
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={isOpen} onOpenChange={setIsOpen}>
      <DrawerTrigger asChild>{children}</DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle>Edit Location</DrawerTitle>
          <DrawerDescription>
            Update the location details below.
          </DrawerDescription>
        </DrawerHeader>

        <div className="space-y-4 px-4 py-4 max-h-[60vh] overflow-y-auto">
          <div className="space-y-2">
            <Label htmlFor="edit-name-mobile">Location Name *</Label>
            <Input
              id="edit-name-mobile"
              placeholder="Location name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-description-mobile">Description *</Label>
            <Textarea
              id="edit-description-mobile"
              placeholder="Location description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isSubmitting}
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-tag-mobile">Category/Tag *</Label>
            <Input
              id="edit-tag-mobile"
              placeholder="e.g., Library, Cafe"
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-time-mobile">Hours *</Label>
            <Input
              id="edit-time-mobile"
              placeholder="e.g., 9AM - 5PM"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-contact-person-mobile">Contact Person *</Label>
            <Input
              id="edit-contact-person-mobile"
              placeholder="Name of contact person"
              value={contactPerson}
              onChange={(e) => setContactPerson(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-contact-info-mobile">
              Contact Information *
            </Label>
            <Input
              id="edit-contact-info-mobile"
              placeholder="Phone or Email"
              value={contactInfo}
              onChange={(e) => setContactInfo(e.target.value)}
              disabled={isSubmitting}
            />
          </div>
        </div>

        <DrawerFooter className="pt-2">
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Update Location
          </Button>
          <DrawerClose asChild>
            <Button variant="outline" disabled={isSubmitting}>
              Cancel
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
