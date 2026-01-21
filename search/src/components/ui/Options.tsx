import React, { useState, useCallback, useEffect, forwardRef } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  const { isGlobalLoading } = useGContext();

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

  return (
    <Card className="p-4 md:p-6 w-4/5 max-w-4xl m-auto">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Batch */}
        <MultiSelectField
          disabled={isGlobalLoading}
          query={query}
          name="batch"
          options={props.listOpts.batch}
          setQuery={setQuery}
        />

        {/* Hall */}
        <MultiSelectField
          disabled={isGlobalLoading}
          query={query}
          name="hall"
          options={props.listOpts.hall}
          setQuery={setQuery}
        />

        {/* Course */}
        <MultiSelectField
          disabled={isGlobalLoading}
          query={query}
          name="course"
          label="Course"
          options={props.listOpts.course}
          setQuery={setQuery}
        />

        {/* Department */}
        <MultiSelectField
          disabled={isGlobalLoading}
          query={query}
          name="dept"
          label="Department"
          options={props.listOpts.dept}
          setQuery={setQuery}
        />

        {/* Gender */}
        <div
          className={cn(
            "grid w-full items-center lg:-mt-2",
            isGlobalLoading && "cursor-not-allowed opacity-50"
          )}
        >
          <div className="w-full">
            <Label htmlFor="gender" className="mb-1">
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
              <SelectTrigger id="gender">
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
          <Label htmlFor="hometown" className="mb-1">
            Hometown
          </Label>
          <Input
            id="hometown"
            type="text"
            placeholder="e.g., Kanpur"
            value={query.address}
            onChange={(e) => setQuery({ ...query, address: e.target.value })}
            disabled={isGlobalLoading}
          />
        </div>
      </div>

      {/* Name, roll number, username input bar */}
      <div>
        <Label htmlFor="main-search" className="mb-2">
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
            className="pr-10" // Add padding to the right for the clear button
          />
        </div>
      </div>
    </Card>
  );
}
export default Options;
