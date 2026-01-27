"use client";

import {
  useState,
  FormEvent,
  ChangeEvent,
  useEffect,
  useCallback,
} from "react";
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
import { courses, halls, departmentNameMap } from "@/components/Constant";
import { Loader2 } from "lucide-react"; // Standard loader icon

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
        },
      );

      if (response.ok) {
        const data = await response.json();
        const automation = data.automation;

        if (automation) {
          let gender = "";
          if (["M", "F"].includes(automation.gender)) {
            gender = automation.gender;
          } else {
            gender = "None";
          }

          setProfileData({
            ...profileData,
            name: automation.name || "",
            rollNo: automation.roll_no || "",
            dept:
              departmentNameMap[
                automation.department as keyof typeof departmentNameMap
              ] || "",
            course: automation.program || "",
            gender: gender,
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

  useEffect(() => {
    fetchAutomationData();
  }, [fetchAutomationData]);

  // Handles changes for all text inputs
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
  };

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
        },
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
    <Card className="w-full max-w-xl shadow-lg border-muted/60">
      <CardHeader className="space-y-1.5">
        <CardTitle className="text-2xl font-bold tracking-tight">
          Complete Your Profile
        </CardTitle>
        <CardDescription className="text-sm">
          {isFetchingData
            ? "Fetching your profile data..."
            : "Fill in your details to finish setting up your account. Fields with * are required."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            {/* Full Name */}
            <div className="grid gap-2">
              <Label htmlFor="name" className="text-sm font-medium">
                Full Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                name="name"
                value={profileData.name}
                onChange={handleChange}
                required
                className="capitalize focus-visible:ring-primary"
                disabled={isFetchingData}
              />
            </div>

            {/* Roll Number */}
            <div className="grid gap-2">
              <Label htmlFor="rollNo" className="text-sm font-medium">
                Roll Number <span className="text-destructive">*</span>
              </Label>
              <Input
                id="rollNo"
                name="rollNo"
                value={profileData.rollNo}
                onChange={handleChange}
                required
                className="uppercase focus-visible:ring-primary"
                disabled={isFetchingData}
              />
            </div>

            {/* Department */}
            <div className="grid gap-2 md:col-span-2">
              <Label className="text-sm font-medium">
                Department <span className="text-destructive">*</span>
              </Label>
              <Select
                onValueChange={handleSelectChange("dept")}
                value={profileData.dept}
                disabled={isFetchingData}
                required
              >
                <SelectTrigger className="w-full focus:ring-primary">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent className="max-h-80">
                  {Object.entries(departmentNameMap).map(([fullName, Code]) => (
                    <SelectItem key={Code} value={Code}>
                      <div className="flex items-center justify-between gap-4 w-full">
                        <span className="truncate">{fullName}</span>
                        <span className="text-muted-foreground text-[10px] font-mono bg-muted px-1 rounded shrink-0">
                          {Code}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Course */}
            <div className="grid gap-2">
              <Label className="text-sm font-medium">
                Course <span className="text-destructive">*</span>
              </Label>
              <Select
                onValueChange={handleSelectChange("course")}
                value={profileData.course}
                disabled={isFetchingData}
                required
              >
                <SelectTrigger className="focus:ring-primary">
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

            {/* Gender */}
            <div className="grid gap-2">
              <Label className="text-sm font-medium">
                Gender <span className="text-destructive">*</span>
              </Label>
              <Select
                onValueChange={handleSelectChange("gender")}
                value={profileData.gender}
                disabled={isFetchingData}
                required
              >
                <SelectTrigger className="focus:ring-primary">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="M">Male</SelectItem>
                  <SelectItem value="F">Female</SelectItem>
                  <SelectItem value="O">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Hall & Room Number */}
            <div className="grid gap-2 md:col-span-1">
              <Label className="text-sm font-medium">Hall & Room Number</Label>
              <div className="flex gap-2">
                <div className="w-3/5">
                  <Select
                    onValueChange={handleSelectChange("hall")}
                    value={profileData.hall}
                    disabled={isFetchingData}
                  >
                    <SelectTrigger className="focus:ring-primary">
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
                <div className="w-2/5">
                  <Input
                    name="roomNo"
                    placeholder="D123"
                    value={profileData.roomNo}
                    onChange={handleChange}
                    className="uppercase focus-visible:ring-primary"
                    disabled={isFetchingData}
                  />
                </div>
              </div>
            </div>

            {/* Home Town */}
            <div className="grid gap-2 md:col-span-1">
              <Label htmlFor="homeTown" className="text-sm font-medium">
                Home Town, State
              </Label>
              <Input
                id="homeTown"
                name="homeTown"
                value={profileData.homeTown}
                onChange={handleChange}
                className="capitalize focus-visible:ring-primary"
                disabled={isFetchingData}
              />
            </div>
          </div>

          <div className="pt-2 space-y-4">

            <Button
              type="submit"
              className="w-full h-11 text-base font-semibold shadow-sm transition-all active:scale-[0.98]"
              disabled={isLoading || isFetchingData}
            >
              {isFetchingData ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Fetching...
                </>
              ) : isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save and Finish"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}