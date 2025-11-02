"use client";

import { useEffect, useState } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer";
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

  // 🧭 Auto-fill lat/lon + trigger open when event fired
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

    window.addEventListener("trigger-add-location", handler);
    return () => window.removeEventListener("trigger-add-location", handler);
  }, [onOpenChange]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const type =
      formData.locationType === "other"
        ? formData.customType.trim() || "other"
        : formData.locationType;

    const payload = {
      name: formData.name.trim(),
      latitude: parseFloat(formData.latitude),
      longitude: parseFloat(formData.longitude),
      locationType: type.trim(),
      description: formData.description.trim(),
      coverpic: null,
      biopics: [],
    };

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_MAPS_URL}/api/maps/location`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        toast.success(data.message || "✅ Location added successfully!");
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
        onOpenChange(false);
        window.dispatchEvent(new Event("refresh-markers"));
      }
       else {
        toast.error(data.error || "❌ Failed to add location.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong, please try again.");
    }
  };
  

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="h-[85vh] sm:h-[70vh] bg-background border-t border-border rounded-t-3xl overflow-y-auto">
        <DrawerHeader>
          <DrawerTitle className="text-xl font-semibold text-foreground">
            Add New Location
          </DrawerTitle>
          <DrawerDescription className="text-muted-foreground">
            Fill in details of your selected point.
          </DrawerDescription>
        </DrawerHeader>

        <motion.form
          onSubmit={handleSubmit}
          className="p-6 pt-2 space-y-5"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          {/* 🏷️ Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Location Name</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Ex: Lecture Hall Complex"
              required
            />
          </div>

          {/* 🧭 Type dropdown + custom */}
          <div className="space-y-2">
            <Label htmlFor="locationType">Type</Label>
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
                <SelectValue placeholder="Select location type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lecturehall">Lecture Hall</SelectItem>
                <SelectItem value="hostel">Hostel</SelectItem>
                <SelectItem value="food">Food</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="recreation">Recreation</SelectItem>
                <SelectItem value="other">Other (Custom)</SelectItem>
              </SelectContent>
            </Select>

            {/* 🧠 If 'Other', show input */}
            {formData.locationType === "other" && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Input
                  id="customType"
                  name="customType"
                  value={formData.customType}
                  onChange={handleChange}
                  placeholder="Enter custom type (e.g. Library, Gym)"
                  required
                />
              </motion.div>
            )}
          </div>

          {/* 📝 Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe this location (max 250 chars)"
              maxLength={250}
            />
            <p className="text-xs text-muted-foreground text-right">
              {formData.description.length}/250
            </p>
          </div>

          {/* 🌍 Coordinates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="latitude">Latitude</Label>
              <Input id="latitude" value={formData.latitude} readOnly />
            </div>
            <div>
              <Label htmlFor="longitude">Longitude</Label>
              <Input id="longitude" value={formData.longitude} readOnly />
            </div>
          </div>

          {/* 🚀 Submit */}
          <motion.div whileTap={{ scale: 0.97 }}>
            <Button
              type="submit"
              className="w-full py-3 font-medium bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 rounded-xl shadow-md"
            >
              Submit Location
            </Button>
          </motion.div>
        </motion.form>

        <DrawerFooter>
          <DrawerClose asChild>
            <Button variant="outline" className="w-full">
              Cancel
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
