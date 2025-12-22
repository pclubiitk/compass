"use client";

import { useState, FormEvent, ChangeEvent, useEffect, useCallback } from "react";
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
import {  courses, halls, departmentNameMap } from "@/components/Constant";

export function Step3Profile() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingData, setIsFetchingData] = useState(true);
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
 const fetchAutomationData = useCallback(async () => {
    try {
      setIsFetchingData(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_AUTH_URL}/api/profile/oa`,
        {
          method: "GET",
          credentials: "include",
        }
      );

      if (response.ok) {
        const data = await response.json();
        const automation = data.automation;

        if (automation) {
          // Parse hostel info (format: "HALL13, C-106")
          let hall = "";
          let roomNo = "";
          if (automation.hostel_info) {
            const hostelParts = automation.hostel_info.split(",").map((s: string) => s.trim());
            hall = hostelParts[0] || "";
            roomNo = hostelParts[1] || "";
          }

          // Map gender (M -> Male, F -> Female)
          let gender = "";
          if (automation.gender === "M") {
            gender = "Male";
          } else if (automation.gender === "F") {
            gender = "Female";
          } else {
            gender = "Other";
          }
          let homeTown = ""

          if (automation.location) {
            homeTown = automation.location
          }
          

          // Set the profile data
          setProfileData({
            name: automation.name || "",
            rollNo: automation.roll_no || "",
            dept: departmentNameMap[automation.department as keyof typeof departmentNameMap] || "",
            course: automation.program || "",
            gender: gender,
            hall: hall,
            roomNo: roomNo,
            homeTown: homeTown || "",
          });

        }
      } else {
        console.warn("Could not fetch automation data");
      }
    } catch (error) {
      console.error("Error fetching automation data:", error);
    } finally {
      setIsFetchingData(false);
    }
  }, []);

  // Fetch automation data on component mount
  useEffect(() => {
    fetchAutomationData();
  }, [fetchAutomationData]);

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
        `${process.env.NEXT_PUBLIC_AUTH_URL}/api/profile`,
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
    } catch {
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
          {isFetchingData 
            ? "Fetching your profile data..." 
            : "Fill in your details to finish setting up your account. Fields with * are required."}
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
              disabled={isFetchingData}
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
              disabled={isFetchingData}
            />
          </div>
          <div className="grid gap-2 md:col-span-2">
            <Label>
              Department <span className="text-red-500">*</span>
            </Label>
            <Select 
              onValueChange={handleSelectChange("dept")} 
              value={profileData.dept}
              disabled={isFetchingData}
              required
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                {
                  Object.entries(departmentNameMap).map(([fullName, Code]) => (
                    <SelectItem key={Code} value={Code}>
                      <div className="flex items-center justify-between gap-4 w-full">
                        <span className="truncate">{fullName}</span>
                        <span className="text-muted-foreground text-xs font-mono shrink-0">{Code}</span>
                      </div>
                    </SelectItem>
                  ))
                }
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>
              Course <span className="text-red-500">*</span>
            </Label>
            <Select 
              onValueChange={handleSelectChange("course")} 
              value={profileData.course}
              disabled={isFetchingData}
              required
            >
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
            <Select 
              onValueChange={handleSelectChange("gender")} 
              value={profileData.gender}
              disabled={isFetchingData}
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

          {/* --- Optional Fields --- */}
          {/* Combined Hall and Room Number Field */}
          <div className="grid gap-2">
            <Label>Hall & Room Number</Label>
            <div className="flex gap-2">
              <div>
                <Select 
                  onValueChange={handleSelectChange("hall")}
                  value={profileData.hall}
                  disabled={isFetchingData}
                >
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
                  disabled={isFetchingData}
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
              disabled={isFetchingData}
            />
          </div>

          <div className="md:col-span-2">
            <Button type="submit" className="w-full" disabled={isLoading || isFetchingData}>
              {isFetchingData ? "Loading..." : isLoading ? "Saving..." : "Save and Finish"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
