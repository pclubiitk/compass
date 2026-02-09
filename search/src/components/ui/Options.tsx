import React, { useState, useCallback, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Lightbulb, Key, Edit, Eye } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import MultiSelectField from "@/components/ui/msf"; // Using our refactored MSF
import { debounce } from "@/lib/utils";
import { Query, Options as OptionsType } from "@/lib/types/data";
import { useGContext } from "../ContextProvider";
import { cn } from "@/lib/utils";
import { PROFILE_POINT } from "@/lib/constant";

// NOTE:
// 1. Earlier cycle of reference was made, the parent component created a ref,
// // passed it to the PreOptions component, the forwardRef code (show below)
// // connected it to the parent ref, and in the parent we can focus on it
// // but this logic is not working as expected, hence removing for now
//
// // const Options = forwardRef(PreOptions);
// // Options.displayName = "SearchOptions";
//
// Options was earlier told as PreOptions with one more param ==
// // ref: React.Ref<HTMLInputElement> (along with the props)
//
// // const searchBar = useRef<HTMLInputElement>(null);
// // This is how the searchBar was initialized and passed
interface OptionsProps {
  sendQuery: (query: Query) => void;
  listOpts: OptionsType;
}

function Options(props: OptionsProps) {
  const { isGlobalLoading, isPuppyLove } = useGContext();

  const [query, setQuery] = useState<Query>({
    gender: "",
    name: "",
    batch: [],
    hall: [],
    course: [],
    dept: [],
    address: "",
  });

  // Debounced query
  const debouncedSendQuery = useCallback(debounce(props.sendQuery, 300), [
    props.sendQuery,
  ]);

  useEffect(() => {
    debouncedSendQuery(query);
  }, [query, debouncedSendQuery]);

  // Clear search field when puppy love mode is toggled to prevent autofill
  useEffect(() => {
    setQuery((prevQuery) => ({
      ...prevQuery,
      name: "",
    }));
  }, [isPuppyLove]);

  // Listen for search events from selections panel
  useEffect(() => {
    const handleSearch = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { name } = customEvent.detail;
      setQuery((prevQuery) => ({
        ...prevQuery,
        name: name,
      }));
    };

    if (typeof window !== "undefined") {
      window.addEventListener("puppylove:search", handleSearch);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("puppylove:search", handleSearch);
      }
    };
  }, []);

  return (
    <Card
      className={cn(
        "p-4 md:p-6 w-4/5 max-w-4xl m-auto",
        isPuppyLove &&
          "border-none bg-rose-50/90 text-rose-500 shadow-[0_10px_40px_rgba(225,29,72,0.15)]",
      )}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Batch */}
        <MultiSelectField
          disabled={isGlobalLoading}
          query={query}
          name="batch"
          options={props.listOpts.batch || []}
          setQuery={setQuery}
          theme={isPuppyLove ? "puppylove" : "default"}
        />

        {/* Hall */}
        <MultiSelectField
          disabled={isGlobalLoading}
          query={query}
          name="hall"
          options={props.listOpts.hall || []}
          setQuery={setQuery}
          theme={isPuppyLove ? "puppylove" : "default"}
        />

        {/* Course */}
        <MultiSelectField
          disabled={isGlobalLoading}
          query={query}
          name="course"
          label="Course"
          options={props.listOpts.course || []}
          setQuery={setQuery}
          theme={isPuppyLove ? "puppylove" : "default"}
        />

        {/* Department */}
        <MultiSelectField
          disabled={isGlobalLoading}
          query={query}
          name="dept"
          label="Department"
          options={props.listOpts.dept || []}
          setQuery={setQuery}
          theme={isPuppyLove ? "puppylove" : "default"}
        />

        {/* Gender */}
        <div
          className={cn(
            "grid w-full items-center lg:-mt-2",
            isGlobalLoading && "cursor-not-allowed opacity-50",
          )}
        >
          <div className="w-full">
            <Label
              htmlFor="gender"
              className={cn("mb-1", isPuppyLove && "text-rose-500")}
            >
              Gender
            </Label>
            <Select
              value={query.gender}
              onValueChange={(value) =>
                // When i select the none option, it clears previous selection
                setQuery({ ...query, gender: value === "none" ? "" : value })
              }
              disabled={isGlobalLoading}
            >
              <SelectTrigger
                id="gender"
                className={cn(
                  isPuppyLove &&
                    "border-rose-200/80 bg-rose-100/70 text-rose-500 placeholder:text-rose-300",
                )}
              >
                <SelectValue placeholder="Select Gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="F">Female</SelectItem>
                <SelectItem value="M">Male</SelectItem>
                <SelectItem value="O">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* HomeTown */}
        <div className="grid w-full items-center lg:-mt-2">
          <Label
            htmlFor="hometown"
            className={cn("mb-1", isPuppyLove && "text-rose-500")}
          >
            Hometown
          </Label>
          <Input
            id="hometown"
            type="text"
            placeholder="e.g., Kanpur"
            value={query.address}
            onChange={(e) => setQuery({ ...query, address: e.target.value })}
            disabled={isGlobalLoading}
            className={cn(
              isPuppyLove &&
                "border-rose-200/80 bg-rose-100/70 text-rose-500 placeholder:text-rose-300",
            )}
          />
        </div>
      </div>

      {/* Name, roll number, username input bar */}
      <div>
        <Label
          htmlFor="main-search"
          className={cn("mb-2", isPuppyLove && "text-rose-500")}
        >
          Enter name, username or roll no.
        </Label>
        <div className="flex flex-row m-0 p-0">
          <Input
            id="main-search"
            type="text"
            placeholder="Search"
            value={query.name}
            onChange={(e) => setQuery({ ...query, name: e.target.value })}
            disabled={isGlobalLoading}
            // ref={ref}      // Forward the ref here
            autoFocus
            className={cn(
              "pr-10",
              isPuppyLove &&
                "border-rose-200/80 bg-rose-100/70 text-rose-500 placeholder:text-rose-300",
            )} // Add padding to the right for the clear button
          />
        </div>
      </div>

      {/* PuppyLove Action Buttons */}
      {isPuppyLove && (
        <div className="grid grid-cols-4 gap-2">
          <Button
            variant="outline"
            size="icon"
            className="w-full h-10 border-rose-200/80 text-rose-500 hover:text-rose-500 hover:bg-rose-100 shadow-sm"
          >
            <Lightbulb className="h-4 w-4" />
            Suggest
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="w-full h-10 border-rose-200/80 text-rose-500 hover:text-rose-500 hover:bg-rose-100 shadow-sm"
          >
            <Key className="h-4 w-4" /> Recovery Codes
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="w-full h-10 border-rose-200/80 text-rose-500 hover:text-rose-500 hover:bg-rose-100 shadow-sm"
            onClick={() => {
              if (typeof window !== "undefined") {
                window.location.href = PROFILE_POINT;
              }
            }}
          >
            <Edit className="h-4 w-4" /> Edit Bio
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="w-full h-10 border-rose-200/80 text-rose-500 hover:text-rose-500 hover:bg-rose-100 shadow-sm"
            onClick={() => {
              if (typeof window !== "undefined") {
                window.dispatchEvent(
                  new CustomEvent("puppylove:toggleSelections"),
                );
              }
            }}
          >
            <Eye className="h-4 w-4" /> View Selections
          </Button>
        </div>
      )}
    </Card>
  );
}
export default Options;
