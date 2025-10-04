"use client";

import { useState, FormEvent, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
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
import { toast } from "sonner";
import { departments, courses, halls } from "@/components/Constant";

export function Step3Profile() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    name: "",
    rollNo: "",
    dept: "",
    course: "",
    gender: "",
    hall: "",
    roomNo: "",
    homeTown: "",
  });

  // Handles changes for all text inputs
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
  };

  // Generic handler for all Select components to keep code DRY
  const handleSelectChange =
    (name: keyof typeof profileData) => (value: string) => {
      setProfileData((prev) => ({ ...prev, [name]: value }));
    };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    const { name, rollNo, dept, course, gender } = profileData;
    if (!name || !rollNo || !dept || !course || !gender) {
      toast.error("Please fill out all mandatory fields.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_AUTH_URL}/profile`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(profileData),
        }
      );
      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || "Profile updated successfully!");
        router.push("/profile");
      } else {
        toast.error(data.error || "Failed to update profile.");
      }
    } catch (error) {
      toast.error("An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle className="text-2xl">Complete Your Profile</CardTitle>
        <CardDescription>
          Fill in your details to finish setting up your account. Fields with *
          are required.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          {/* --- Mandatory Fields --- */}
          <div className="grid gap-2">
            <Label htmlFor="name">
              Full Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              name="name"
              value={profileData.name}
              onChange={handleChange}
              required
              className="capitalize"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="rollNo">
              Roll Number <span className="text-red-500">*</span>
            </Label>
            <Input
              id="rollNo"
              name="rollNo"
              value={profileData.rollNo}
              onChange={handleChange}
              required
              className="uppercase"
            />
          </div>
          <div className="grid gap-2">
            <Label>
              Department <span className="text-red-500">*</span>
            </Label>
            <Select onValueChange={handleSelectChange("dept")} required>
              <SelectTrigger>
                <SelectValue placeholder="Select department" />
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
          <div className="grid gap-2">
            <Label>
              Course <span className="text-red-500">*</span>
            </Label>
            <Select onValueChange={handleSelectChange("course")} required>
              <SelectTrigger>
                <SelectValue placeholder="Select course" />
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
          <div className="grid gap-2">
            <Label>
              Gender <span className="text-red-500">*</span>
            </Label>
            <Select onValueChange={handleSelectChange("gender")} required>
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

          {/* --- Optional Fields --- */}
          {/* Combined Hall and Room Number Field */}
          <div className="grid gap-2">
            <Label>Hall & Room Number</Label>
            <div className="flex gap-2">
              <div>
                <Select onValueChange={handleSelectChange("hall")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select hall" />
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
              <div>
                <Input
                  name="roomNo"
                  placeholder="D123"
                  value={profileData.roomNo}
                  onChange={handleChange}
                  className="uppercase"
                />
              </div>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="homeTown">Home Town, State</Label>
            <Input
              id="homeTown"
              name="homeTown"
              value={profileData.homeTown}
              onChange={handleChange}
              className="capitalize"
            />
          </div>

          <div className="md:col-span-2">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Saving..." : "Save and Finish"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
