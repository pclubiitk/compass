"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useMediaQuery } from "@/app/hooks/use-media-query";

export interface EditableLocation {
  locationId: string;
  name: string;
  description: string;
  tag?: string;
  time?: string;
  Contact?: string;
  contact?: string;
  location_type?: string;
  locationType?: string;
  layer?: number;
}

interface EditLocationModalProps {
  location: EditableLocation;
  onLocationUpdated: () => void;
  children: React.ReactNode;
}

const LOCATION_TYPES = [
  { value: "lecturehall", label: "Lecture Hall" },
  { value: "hostel", label: "Hostel" },
  { value: "food", label: "Food & Dining" },
  { value: "admin", label: "Admin Block" },
  { value: "recreation", label: "Recreation" },
  { value: "other", label: "Other" },
];

export function EditLocationModal({
  location,
  onLocationUpdated,
  children,
}: EditLocationModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    tag: "",
    time: "",
    contact: "",
    locationType: "",
    customType: "",
    layer: "",
  });
  console.log(location.locationId);

  useEffect(() => {
    if (!isOpen) return;

    const type = location.location_type || location.locationType || "";
    const isKnownType = LOCATION_TYPES.some((t) => t.value === type);

    setFormData({
      name: location.name || "",
      description: location.description || "",
      tag: location.tag || location.tag || "",
      time: location.time || location.time || "",
      contact: location.contact || location.Contact || "",
      locationType: isKnownType ? type : type ? "other" : "",
      customType: isKnownType ? "" : type,
      layer: String(location.layer || 1),
    });
  }, [isOpen, location]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error("Location name is required.");
      return;
    }

    const locationType =
      formData.locationType === "other"
        ? formData.customType.trim() || "other"
        : formData.locationType;

    setIsSubmitting(true);

    try {
      console.log(location.locationId);
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_MAPS_URL}/api/maps/editLocation/${location.locationId}`,
        {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.name.trim(),
            description: formData.description.trim(),
            tag: formData.tag.trim(),
            time: formData.time.trim(),
            contact: formData.contact.trim(),
            locationType,
            layer: parseInt(formData.layer),
          }),
        },
      );

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        toast.error(data.error || "Failed to update location");
        throw new Error(data.error || "Failed to update location");
      }

      toast.success(data.message || "Location updated successfully");
      setIsOpen(false);
      onLocationUpdated();
      window.dispatchEvent(new Event("refresh-markers"));
    } catch (err) {
      console.error("Failed to update location:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to update location",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const FormContent = (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="edit-name">Location Name</Label>
        <Input
          id="edit-name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="e.g. Main Auditorium"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="edit-description">Description</Label>
        <Textarea
          id="edit-description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Add details about this location..."
          className="min-h-[100px] resize-none"
          maxLength={250}
        />
        <p className="text-xs text-muted-foreground text-right">
          {formData.description.length}/250
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="edit-tag">tag</Label>
          <Input
            id="edit-tag"
            name="tag"
            value={formData.tag}
            onChange={handleChange}
            placeholder="e.g. Open 24/7"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="edit-time">Hours</Label>
          <Input
            id="edit-time"
            name="time"
            value={formData.time}
            onChange={handleChange}
            placeholder="e.g. 9 AM – 5 PM"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="edit-locationType">Category</Label>
        <Select
          value={formData.locationType}
          onValueChange={(value) =>
            setFormData((prev) => ({
              ...prev,
              locationType: value,
              customType: value === "other" ? prev.customType : "",
            }))
          }
        >
          <SelectTrigger id="edit-locationType">
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            {LOCATION_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {formData.locationType === "other" && (
          <Input
            id="edit-customType"
            name="customType"
            value={formData.customType}
            onChange={handleChange}
            placeholder="Specify category..."
          />
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="edit-layer">Layer</Label>
        <Select
          value={formData.layer}
          onValueChange={(value) =>
            setFormData((prev) => ({
              ...prev,
              layer: value,
            }))
          }
        >
          <SelectTrigger id="edit-layer">
            <SelectValue placeholder="Select a layer" />
          </SelectTrigger>
          <SelectContent>
            {[1, 2, 3, 4, 5].map((type) => (
              <SelectItem key={type} value={type.toString()}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="edit-contact">Contact (phone or email)</Label>
        <Input
          id="edit-contact"
          name="contact"
          value={formData.contact}
          onChange={handleChange}
          placeholder="e.g. +91 98765 43210"
        />
      </div>

      <Button
        className="w-full"
        onClick={handleSubmit}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          "Save Changes"
        )}
      </Button>
    </div>
  );

  if (isDesktop) {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>{children}</DialogTrigger>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Location</DialogTitle>
            <DialogDescription>
              Update the details for this location.
            </DialogDescription>
          </DialogHeader>
          {FormContent}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={isOpen} onOpenChange={setIsOpen}>
      <DrawerTrigger asChild>{children}</DrawerTrigger>
      <DrawerContent>
        <div className="mx-auto w-full max-w-lg">
          <DrawerHeader>
            <DrawerTitle>Edit Location</DrawerTitle>
            <DrawerDescription>
              Update the details for this location.
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-4">{FormContent}</div>
          <DrawerFooter>
            <DrawerClose asChild>
              <Button variant="ghost">Cancel</Button>
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
