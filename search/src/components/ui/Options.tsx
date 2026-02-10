import React, { useState, useCallback, useEffect } from "react";
import {
  Card,
  CardDescription,
  CardTitle,
  CardHeader,
  CardContent,
} from "@/components/ui/card";
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
import { RecoveryCodeModal } from "@/components/puppy-love/RecoveryCodeModal";

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
  const {
    isGlobalLoading,
    isPuppyLove,
    PLpermit,
    PLpublish,
    setShowSelections,
  } = useGContext();

  const [query, setQuery] = useState<Query>({
    gender: "",
    name: "",
    batch: [],
    hall: [],
    course: [],
    dept: [],
    address: "",
  });

  // Recovery code modal state
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);

  // Debounced query
  const debouncedSendQuery = useCallback(debounce(props.sendQuery, 300), [
    props.sendQuery,
  ]);

  useEffect(() => {
    // NOTE: Deactivate the search, once we are showing the student cards in some other way.
    // For Ex: if we wish to render the matches, for puppylove then once its set, the query resets it to the [] array
    if (isPuppyLove && !PLpermit) {
      return;
    }
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
      {/* Show only when not (puppylove mode and permit is off) */}
      {(isPuppyLove && PLpermit) || !isPuppyLove ? (
        <>
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
                    setQuery({
                      ...query,
                      gender: value === "none" ? "" : value,
                    })
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
                onChange={(e) =>
                  setQuery({ ...query, address: e.target.value })
                }
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
        </>
      ) : !PLpublish ? (
        // TODO: And userPublish should be false.
        // This will happen only when, PLpermit is false, hence if admin has not published yet then, ask user.
        <Card>
          <CardHeader>
            <CardTitle>Puppy Love Mode active.</CardTitle>
            <CardDescription>Do you want to get matched?</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="md:grid grid-cols-4 gap-2 flex flex-col">
              <Button
                variant="outline"
                size="icon"
                className="w-full text-wrap h-10 border-rose-200/80 text-rose-500 hover:text-rose-500 hover:bg-rose-100 shadow-sm"
                onClick={() => {}}
              >
                YES
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="w-full text-wrap h-10 border-rose-200/80 text-rose-500 hover:text-rose-500 hover:bg-rose-100 shadow-sm"
                onClick={() => {}}
              >
                NO
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        // TODO: If User agreed to publish (the state in the user data), then we can show the results, else it will be empty.
        <Card>
          <CardHeader>
            <CardTitle>Puppy Love Mode active.</CardTitle>
            <CardDescription>
              The PuppyLove Match Results are now Out!
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* PuppyLove Action Buttons */}
      {isPuppyLove && (
        <div className="md:grid grid-cols-4 gap-2 flex flex-col">
          {/* Only show the suggest button till the deadline */}
          {PLpermit && (
            <Button
              variant="outline"
              size="icon"
              className="w-full text-wrap h-10 border-rose-200/80 text-rose-500 hover:text-rose-500 hover:bg-rose-100 shadow-sm"
            >
              <Lightbulb className="h-4 w-4" />
              Suggest
            </Button>
          )}
          <Button
            variant="outline"
            size="icon"
            className="w-full h-10 border-rose-200/80 text-rose-500 hover:text-rose-500 hover:bg-rose-100 shadow-sm"
            onClick={() => setShowRecoveryModal(true)}
          >
            <Key className="h-4 w-4" /> Recovery Codes
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="w-full text-wrap h-10 border-rose-200/80 text-rose-500 hover:text-rose-500 hover:bg-rose-100 shadow-sm"
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
            onClick={() => setShowSelections && setShowSelections(true)}
          >
            <Eye className="h-4 w-4" /> View Selections
          </Button>
        </div>
      )}

      {/* Recovery Code Modal */}
      <RecoveryCodeModal
        isOpen={showRecoveryModal}
        onClose={() => setShowRecoveryModal(false)}
      />
    </Card>
  );
}
export default Options;
