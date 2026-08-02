"use client";

import { useEffect, useState } from "react";
import { useHistoryBack } from "@/app/hooks/use-history-back";

import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MapPin,
  AlignLeft,
  Navigation,
  X,
  UploadCloud,
  Loader2,
} from "lucide-react";
import { useMediaQuery } from "@/app/hooks/use-media-query";

export default function AddLocationDrawer({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    locationType: "",
    customType: "",
    latitude: "",
    longitude: "",
  });
  const [lastCoords, setLastCoords] = useState<{ lat: string; lng: string } | null>(null);
  const [coverPic, setCoverPic] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 768px)");

  // Close drawer on phone back button instead of navigating away
  useHistoryBack(open, () => onOpenChange(false));

  // Auto-fill lat/lon + trigger open
  useEffect(() => {
    const lat = localStorage.getItem("selected_lat");
    const lon = localStorage.getItem("selected_lon");
    if (lat && lon) {
      setFormData((prev) => ({ ...prev, latitude: lat, longitude: lon }));
    }

    const handler = () => {
      const lat = localStorage.getItem("selected_lat");
      const lon = localStorage.getItem("selected_lon");
      if (!lat || !lon) {
        toast.error("Select a location on the map first.");
        return;
      }
      setFormData((prev) => ({ ...prev, latitude: lat, longitude: lon }));
      onOpenChange(true);
    };

    window.dispatchEvent(new Event("refresh-markers")); // Optional: Ensure map state is consistent
    window.addEventListener("trigger-add-location", handler);
    return () => window.removeEventListener("trigger-add-location", handler);
  }, [onOpenChange]);

  // Update coordinates when drawer opens
  useEffect(() => {
    if (open) {
      const lat = localStorage.getItem("selected_lat");
      const lon = localStorage.getItem("selected_lon");
      if (lat && lon) {
        setLastCoords({ lat, lng: lon });
      }
    } else {
      setLastCoords(null);
    }
  }, [open]);

  // Sync coordinates from localStorage to form when they change
  useEffect(() => {
    if (open && lastCoords) {
      setFormData((prev) => ({ ...prev, latitude: lastCoords.lat, longitude: lastCoords.lng }));
    }
  }, [lastCoords, open]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File must be less than 10 MB.");
      return;
    }
    setCoverPic(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const removeImage = () => {
    setCoverPic(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const type =
      formData.locationType === "other"
        ? formData.customType.trim() || "other"
        : formData.locationType;

    try {
      let coverPicId = null;

      // 1. Upload Image (Optional)
      if (coverPic) {
        try {
          const imagePayload = new FormData();
          imagePayload.append("file", coverPic);

          const imgRes = await fetch(
            `${process.env.NEXT_PUBLIC_ASSET_URL}/assets`,
            {
              method: "POST",
              credentials: "include",
              body: imagePayload,
            },
          );

          if (!imgRes.ok) {
            const errorText = await imgRes.text();
            // TODO: discuss correct approach.
            console.error("Image upload failed:", imgRes.status, errorText);
            toast.warning("Image upload failed. Submitting without image.");
          } else {
            const imgData = await imgRes.json();
            coverPicId = imgData.ImageID;
          }
        } catch (uploadErr) {
          console.error("Image upload network error:", uploadErr);
          toast.warning("Image upload failed. Submitting without image.");
        }
      }

      // 2. Submit Location
      const payload = {
        name: formData.name.trim(),
        latitude: parseFloat(formData.latitude || localStorage.getItem("selected_lat") || "0"),
        longitude: parseFloat(formData.longitude || localStorage.getItem("selected_lon") || "0"),
        locationType: type.trim(),
        description: formData.description.trim(),
        coverpic: coverPicId,
        biopics: [],
      };

      const apiUrl = `${process.env.NEXT_PUBLIC_MAPS_URL}/api/maps/location`;
      console.log("Submitting location to:", apiUrl);

      const res = await fetch(apiUrl, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        toast.success(data.message || "Location added successfully!");
        localStorage.removeItem("selected_lat");
        localStorage.removeItem("selected_lon");
        setFormData({
          name: "",
          description: "",
          locationType: "",
          customType: "",
          latitude: "",
          longitude: "",
        });
        removeImage();
        onOpenChange(false);
        window.dispatchEvent(new Event("refresh-markers"));
      } else {
        toast.error(data.error || "Failed to add location.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong, please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const FormContent = (
    <motion.form
      onSubmit={handleSubmit}
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      <div className="space-y-4">
        {/* Name & Type Group */}
        <div className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Location Name</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Main Auditorium"
                className="pl-9"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="locationType">Category</Label>
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
              <SelectTrigger id="locationType">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lecturehall">Lecture Hall</SelectItem>
                <SelectItem value="hostel">Hostel</SelectItem>
                <SelectItem value="food">Food & Dining</SelectItem>
                <SelectItem value="admin">Admin Block</SelectItem>
                <SelectItem value="recreation">Recreation</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>

            {formData.locationType === "other" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="pt-1"
              >
                <Input
                  id="customType"
                  name="customType"
                  value={formData.customType}
                  onChange={handleChange}
                  placeholder="Specify category..."
                  required
                />
              </motion.div>
            )}
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <div className="relative">
            <AlignLeft className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Add details about this location..."
              className="pl-9 min-h-[100px] resize-none"
              maxLength={250}
            />
          </div>
          <p className="text-xs text-muted-foreground text-right">
            {formData.description.length}/250
          </p>
        </div>

        {/* Cover Image Upload - Clean & Minimal */}
        <div className="space-y-2">
          <Label>Cover Image</Label>
          <p className="text-xs text-muted-foreground">10 MB</p>
          {!previewUrl ? (
            <div
              onClick={() =>
                document.getElementById("location-cover-image")?.click()
              }
              className="border border-dashed border-muted-foreground/30 rounded-lg p-8 flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-muted/50 transition-colors"
            >
              <div className="p-2.5 rounded-full bg-muted text-muted-foreground">
                <UploadCloud className="h-5 w-5" />
              </div>
              <div className="text-center space-y-1">
                <p className="text-sm font-medium text-foreground">
                  Click to upload image
                </p>
              </div>
            </div>
          ) : (
            <div className="relative rounded-lg overflow-hidden border bg-muted">
              <img
                src={previewUrl}
                alt="Preview"
                className="w-full h-48 object-cover"
              />
              <div className="absolute top-2 right-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  className="h-8 w-8 rounded-full bg-background/80 hover:bg-background shadow-sm backdrop-blur-sm"
                  onClick={removeImage}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
          <input
            id="location-cover-image"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageChange}
          />
        </div>

        {/* Coordinates - Technical/Data Look */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Navigation className="h-3.5 w-3.5" />
            Coordinates
          </Label>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-muted/40 border rounded-md px-3 py-2">
              <span className="text-[10px] uppercase text-muted-foreground font-semibold tracking-wider block mb-0.5">
                Latitude
              </span>
              <div className="font-mono text-sm text-foreground">
                {formData.latitude || localStorage.getItem("selected_lat") || "—"}
              </div>
            </div>
            <div className="bg-muted/40 border rounded-md px-3 py-2">
              <span className="text-[10px] uppercase text-muted-foreground font-semibold tracking-wider block mb-0.5">
                Longitude
              </span>
              <div className="font-mono text-sm text-foreground">
                {formData.longitude || localStorage.getItem("selected_lon") || "—"}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-2">
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            "Confirm Location"
          )}
        </Button>
      </div>
    </motion.form>
  );

  // Desktop Dialog
  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[480px] p-0 gap-0 overflow-hidden">
          <DialogHeader className="px-6 py-4 border-b">
            <DialogTitle className="text-lg font-semibold">
              Add New Location
            </DialogTitle>
            <DialogDescription>
              Fill in the details to add a marker to the map.
            </DialogDescription>
          </DialogHeader>

          <div className="px-6 py-6 max-h-[70vh] overflow-y-auto">
            {FormContent}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Mobile Drawer
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader className="text-left border-b pb-4">
          <DrawerTitle>Add New Location</DrawerTitle>
          <DrawerDescription>
            Fill in the details to add a marker to the map.
          </DrawerDescription>
        </DrawerHeader>

        <div className="px-6 py-6 overflow-y-auto">{FormContent}</div>

        <DrawerFooter className="border-t pt-4">
          <DrawerClose asChild>
            <Button variant="outline">Cancel</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}