"use client";

import { useState, useEffect, ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Edit, Save, X } from "lucide-react";
import { toast } from "sonner";
import type { Profile } from "@/app/profile/page";
import { courses, departments, halls } from "@/components/Constant";
import {
  AlertDeleteProfileInfo,
  AlertVisibilityProfileInfo,
} from "./ProfileAction";

export function EditableProfileCard({
  profile,
  onUpdate,
}: {
  profile: Profile;
  onUpdate: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<Profile>>(profile);

  // Sync form state if the profile prop changes (e.g., after a refetch)
  useEffect(() => {
    setFormData(profile);
  }, [profile]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      // Convert the name to camel case
      [name[0].toLowerCase() + name.substring(1)]: value,
    }));
  };
  const handleSelectChange = (name: keyof Profile) => (value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCancel = () => {
    setFormData(profile);
    setIsEditing(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_AUTH_URL}/profile`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(formData),
        }
      );
      const data = await response.json();
      if (response.ok) {
        toast.success("Profile updated!");
        setIsEditing(false);
        onUpdate();
      } else {
        toast.error(data.error || "Failed to update.");
      }
    } catch (error) {
      toast.error("An unexpected error occurred.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-col items-start sm:flex-row justify-between gap-4">
        <div>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>Your personal and academic details.</CardDescription>
        </div>
        <div className="flex flex-row items-start gap-2">
          {isEditing ? (
            <>
              <Button
                variant="outline"
                className="mr-2"
                onClick={handleCancel}
                disabled={isSaving}
              >
                <X className="mr-1 h-4 w-4" />
                Cancel
              </Button>
              <Button
                variant="outline"
                onClick={handleSave}
                disabled={isSaving}
              >
                <Save className="mr-1 h-4 w-4" />{" "}
                {isSaving ? "Saving..." : "Save"}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setIsEditing(true)}>
                <Edit className="h-4 w-4" />
                Edit
              </Button>
              <AlertDeleteProfileInfo />
              <AlertVisibilityProfileInfo initialVisibility={true} />
            </>
          )}
        </div>
      </CardHeader>
      <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="space-y-1">
          <Label>Full Name</Label>
          <Input
            name="name"
            value={formData.name || ""}
            onChange={handleChange}
            readOnly={!isEditing}
            className={"font-medium capitalize"}
          />
        </div>
        <div className="space-y-1">
          <Label>Roll Number</Label>

          <Input
            name="RollNo"
            value={formData.rollNo || ""}
            onChange={handleChange}
            readOnly={!isEditing}
            className={"font-medium uppercase"}
          />
        </div>
        <div className="space-y-1">
          <div className="flex gap-2">
            <div className="space-y-1">
              <Label>Course</Label>
              <Select
                value={formData.course || ""}
                onValueChange={
                  isEditing ? handleSelectChange("course") : () => {}
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Department</Label>
              <Select
                value={formData?.dept || ""}
                onValueChange={
                  isEditing ? handleSelectChange("dept") : () => {}
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <div className="space-y-1">
          <Label>Gender</Label>
          <Select
            value={formData?.gender || ""}
            onValueChange={isEditing ? handleSelectChange("gender") : () => {}}
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="Select gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Male">Male</SelectItem>
              <SelectItem value="Female">Female</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <div className="flex gap-2">
            <div className="space-y-1">
              <Label>Hall</Label>
              <Select
                value={formData.hall || ""}
                onValueChange={
                  isEditing ? handleSelectChange("hall") : () => {}
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Hall" />
                </SelectTrigger>
                <SelectContent>
                  {halls.map((h) => (
                    <SelectItem key={h} value={h}>
                      {h}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Room</Label>
              <Input
                // className=
                name="roomNo"
                placeholder="Room"
                value={formData.roomNo || ""}
                onChange={handleChange}
                className={"font-medium uppercase"}
                readOnly={!isEditing}
              />
            </div>
          </div>
        </div>
        <div className="space-y-1">
          <Label>Home Town</Label>
          <Input
            name="HomeTown"
            placeholder="Pratapgarh, Rajasthan"
            value={formData.homeTown || ""}
            onChange={handleChange}
            className={"font-medium capitalize"}
            readOnly={!isEditing}
          />
        </div>
      </CardContent>
    </Card>
  );
}
