import { useState, useEffect, useMemo } from "react";
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
import { Lightbulb, Key, Edit, Eye, Heart, Loader2 } from "lucide-react";
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
import { receiverIds, useGContext } from "../ContextProvider";
import { cn } from "@/lib/utils";
import { PROFILE_POINT, PUPPYLOVE_POINT } from "@/lib/constant";
import { RecoveryCodeModal } from "@/components/puppy-love/RecoveryCodeModal";
import { fetchReturnHearts } from "@/lib/workers/puppyLoveWorkerClient";
import { calculateSimilarUsers } from "@/lib/workers/puppyLoveWorkerClient";
import { toast } from "sonner";

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
    showSelections,
    puppyLoveProfile,
    puppyLoveAllUsersData,
    setSuggestedRollNos,
    isDisplayBlocked,
    setIsDisplayBlocked,
    setIsSuggestLoading,
    isSuggestLoading,
  } = useGContext();

  // Local state to track if suggestions mode is active (subset of isDisplayBlocked)
  const [isSuggestionModeOn, setIsSuggestionModeOn] = useState(false);

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
  const [isYesLoading, setIsYesLoading] = useState(false);

  const [hasOptedIn, setHasOptedIn] = useState(!!puppyLoveProfile?.publish);

  // Sync hasOptedIn when puppyLoveProfile loads asynchronously
  useEffect(() => {
    if (puppyLoveProfile?.publish) {
      setHasOptedIn(true);
    }
  }, [puppyLoveProfile?.publish]);

  const handleSuggestMatch = async () => {
    if (isSuggestionModeOn) {
      // Turn off suggestion mode
      setSuggestedRollNos([]);
      setIsSuggestionModeOn(false);
      setIsDisplayBlocked(false);
      return;
    } else {
      // Turn on suggestion mode - blocks display from being overwritten by queries
      setIsSuggestionModeOn(true);
      setIsDisplayBlocked(true);
    }
    // Get current user's interests from their profile
    let myInterests: string[] = [];

    // Parse comma-separated interests from user's profile
    const rawInterests = puppyLoveProfile?.interests
      ?.split(",")
      .map((s: string) => s.trim())
      .filter((s: string) => s.length > 0);
    if (Array.isArray(rawInterests) && rawInterests.length > 0) {
      myInterests = rawInterests;
    }

    if (myInterests.length === 0) {
      toast.error("Add some interests to your profile first!");
      return;
    }

    if (!puppyLoveAllUsersData?.interests) {
      toast.error("Loading user data... Please try again.");
      return;
    }
    setIsSuggestLoading(true);
    try {
      const suggestions = await calculateSimilarUsers(
        myInterests,
        puppyLoveAllUsersData?.interests,
        [],
      );

      if (suggestions.length === 0) {
        toast.info("No similar users found. Try adding more interests!");
        setIsSuggestLoading(false);
        return;
      }

      // Set suggested rollNos in global context for index.tsx to pick up
      const rollNos = suggestions.map((s) => s.rollNo);
      setSuggestedRollNos(rollNos);
      toast.success(`Found ${suggestions.length} similar users!`);
    } catch (err) {
      toast.error("Error finding suggestions");
      setIsSuggestLoading(false);
    }
  };

  // Debounced query - use useMemo to create stable reference that supports cancel
  const debouncedSendQuery = useMemo(
    () => debounce(props.sendQuery, 300),
    [props.sendQuery],
  );

  // Cancel pending debounced queries when display is blocked
  // (e.g., suggestions active or PuppyLove results showing)
  useEffect(() => {
    if (isDisplayBlocked) {
      debouncedSendQuery.cancel();
    }
  }, [isDisplayBlocked, debouncedSendQuery]);

  useEffect(() => {
    // Block search queries when display is showing alternative content:
    // 1. Suggestions mode is active (user clicked "Suggest" button)
    // 2. PuppyLove mode is on but permit is off (showing match results after deadline)
    if (isDisplayBlocked) {
      return;
    }
    debouncedSendQuery(query);
  }, [query, debouncedSendQuery, isDisplayBlocked]);

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

  const handleYesClick = async () => {
    if (isYesLoading) return;
    if (PLpermit) return;
    try {
      setIsYesLoading(true);

      // Mark user as willing to publish matches
      const publishRes = await fetch(
        `${PUPPYLOVE_POINT}/api/puppylove/users/publish`,
        {
          method: "POST",
          credentials: "include",
        },
      );

      if (!publishRes.ok) {
        const errData = await publishRes.json();
        toast.error(errData?.error || "Failed to opt-in for matching.");
        return;
      }

      setHasOptedIn(true);
      // Then fetch return hearts
      await fetchReturnHearts();
      toast.success("You're now opted-in for matching!");
    } catch (err) {
      toast.error("Failed to opt-in for matching.");
      console.error("[PuppyLove] handleYesClick failed:", err);
    } finally {
      setIsYesLoading(false);
    }
  };

  return (
    <Card
      className={cn(
        "p-4 md:p-6 w-4/5 max-w-4xl m-auto",
        isPuppyLove &&
          "border-rose-200/40 bg-linear-to-br from-rose-50 via-pink-50/90 to-fuchsia-50/60 text-rose-600 shadow-[0_10px_40px_rgba(225,29,72,0.12)] dark:border-rose-800/30 dark:from-rose-950/30 dark:via-pink-950/20 dark:to-fuchsia-950/15 dark:text-rose-400",
      )}
    >
      {/* PuppyLove badge */}
      {isPuppyLove && (
        <div className="flex justify-end mb-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-300/50 text-xs font-bold text-rose-500 dark:bg-rose-500/15 dark:border-rose-500/40 dark:text-rose-400 select-none">
            <Heart className="h-3.5 w-3.5 fill-rose-500/60" />
            PuppyLove
          </div>
        </div>
      )}
      {/* Show only when not (puppylove mode and permit is off) */}
      {(isPuppyLove && PLpermit) || !isPuppyLove ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Batch */}
            <MultiSelectField
              disabled={isGlobalLoading || isDisplayBlocked}
              query={query}
              name="batch"
              options={props.listOpts.batch || []}
              setQuery={setQuery}
              theme={isPuppyLove ? "puppylove" : "default"}
            />

            {/* Hall */}
            <MultiSelectField
              disabled={isGlobalLoading || isDisplayBlocked}
              query={query}
              name="hall"
              options={props.listOpts.hall || []}
              setQuery={setQuery}
              theme={isPuppyLove ? "puppylove" : "default"}
            />

            {/* Course */}
            <MultiSelectField
              disabled={isGlobalLoading || isDisplayBlocked}
              query={query}
              name="course"
              label="Course"
              options={props.listOpts.course || []}
              setQuery={setQuery}
              theme={isPuppyLove ? "puppylove" : "default"}
            />

            {/* Department */}
            <MultiSelectField
              disabled={isGlobalLoading || isDisplayBlocked}
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
                (isGlobalLoading || isDisplayBlocked) &&
                  "cursor-not-allowed opacity-50",
              )}
            >
              <div className="w-full">
                <Label
                  htmlFor="gender"
                  className={cn(
                    "mb-1",
                    isPuppyLove && "text-rose-600 dark:text-rose-400",
                  )}
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
                  disabled={isGlobalLoading || isDisplayBlocked}
                >
                  <SelectTrigger
                    id="gender"
                    className={cn(
                      isPuppyLove &&
                        "border-rose-200/60 bg-white/70 text-rose-600 placeholder:text-rose-300 focus:border-rose-400 dark:bg-rose-950/20 dark:border-rose-700 dark:text-rose-300",
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
                className={cn(
                  "mb-1",
                  isPuppyLove && "text-rose-600 dark:text-rose-400",
                )}
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
                disabled={isGlobalLoading || isDisplayBlocked}
                className={cn(
                  isPuppyLove &&
                    "border-rose-200/60 bg-white/70 text-rose-600 placeholder:text-rose-300 focus:border-rose-400 dark:bg-rose-950/20 dark:border-rose-700 dark:text-rose-300",
                )}
              />
            </div>
          </div>
          {/* Name, roll number, username input bar */}
          <div>
            <Label
              htmlFor="main-search"
              className={cn(
                "mb-2",
                isPuppyLove && "text-rose-600 dark:text-rose-400",
              )}
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
                disabled={isGlobalLoading || isDisplayBlocked}
                // ref={ref}      // Forward the ref here
                autoFocus
                className={cn(
                  "pr-10",
                  isPuppyLove &&
                    "border-rose-200/60 bg-white/70 text-rose-600 placeholder:text-rose-300 focus:border-rose-400 dark:bg-rose-950/20 dark:border-rose-700 dark:text-rose-300",
                )} // Add padding to the right for the clear button
              />
            </div>
          </div>
        </>
      ) : !PLpublish ? (
        hasOptedIn ? (
          <Card className="border-rose-200/40 bg-linear-to-br from-rose-50/80 via-pink-50/60 to-fuchsia-50/40 dark:border-rose-800/30 dark:from-rose-950/20 dark:via-pink-950/15 dark:to-fuchsia-950/10">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-2 text-rose-400 dark:text-rose-500">
                <Heart className="h-10 w-10 fill-rose-400/30" />
              </div>
              <CardTitle className="text-rose-700 dark:text-rose-300">
                You&apos;re all set! 💌
              </CardTitle>
              <CardDescription className="text-rose-500/80 dark:text-rose-400/60">
                Your profile will be considered in the matching algorithm.
                Results will be out soon; stay tuned!
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <Card className="border-rose-200/40 bg-linear-to-br from-rose-50/80 via-pink-50/60 to-fuchsia-50/40 dark:border-rose-800/30 dark:from-rose-950/20 dark:via-pink-950/15 dark:to-fuchsia-950/10">
            <CardHeader>
              <CardTitle className="text-rose-700 dark:text-rose-300">
                Puppy Love Mode active.
              </CardTitle>
              <CardDescription className="text-rose-500/80 dark:text-rose-400/60">
                Do you want to get matched? If clicked yes, your profile will be
                considered in the matching algorithm.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="md:grid grid-cols-4 gap-2 flex flex-col">
                <Button
                  variant="outline"
                  size="icon"
                  className="w-full text-wrap h-10 border-rose-300/70 text-rose-600 hover:text-rose-700 hover:bg-rose-100/80 shadow-sm dark:border-rose-600 dark:text-rose-400 dark:hover:bg-rose-950/40"
                  onClick={handleYesClick}
                  disabled={isYesLoading}
                >
                  YES
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="w-full text-wrap h-10 border-rose-300/70 text-rose-600 hover:text-rose-700 hover:bg-rose-100/80 shadow-sm dark:border-rose-600 dark:text-rose-400 dark:hover:bg-rose-950/40"
                  onClick={() => {
                    toast(
                      "Its fine, you can leave it behind ;), but the option will be available till deadline.",
                    );
                  }}
                >
                  NO
                </Button>
              </div>
            </CardContent>
          </Card>
        )
      ) : (
        // TODO: If User agreed to publish (the state in the user data), then we can show the results, else it will be empty.
        <Card className="border-rose-200/40 bg-linear-to-br from-rose-50/80 via-pink-50/60 to-fuchsia-50/40 dark:border-rose-800/30 dark:from-rose-950/20 dark:via-pink-950/15 dark:to-fuchsia-950/10">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto mb-2 text-rose-400 dark:text-rose-500">
              <Heart className="h-10 w-10 fill-rose-400/40" />
            </div>
            <CardTitle className="text-rose-700 dark:text-rose-300">
              Puppy Love Mode active.
            </CardTitle>
            <CardDescription className="text-rose-500/80 dark:text-rose-400/60">
              The PuppyLove Match Results are now Out! 🎉
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
              className="w-full text-wrap h-10 border-rose-300/60 bg-white/50 text-rose-600 hover:text-rose-700 hover:bg-rose-100/80 shadow-sm transition-colors dark:border-rose-600 dark:bg-rose-950/20 dark:text-rose-400 dark:hover:bg-rose-950/40"
              onClick={handleSuggestMatch}
              disabled={isSuggestLoading}
            >
              {isSuggestLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Lightbulb className="h-4 w-4" />
              )}
              {isSuggestLoading
                ? "Finding..."
                : isSuggestionModeOn
                  ? "Suggestions Off"
                  : "Suggest"}
            </Button>
          )}
          <Button
            variant="outline"
            size="icon"
            className="w-full h-10 border-rose-300/60 bg-white/50 text-rose-600 hover:text-rose-700 hover:bg-rose-100/80 shadow-sm transition-colors dark:border-rose-600 dark:bg-rose-950/20 dark:text-rose-400 dark:hover:bg-rose-950/40"
            onClick={() => setShowRecoveryModal(true)}
          >
            <Key className="h-4 w-4" /> Recovery Codes
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="w-full text-wrap h-10 border-rose-300/60 bg-white/50 text-rose-600 hover:text-rose-700 hover:bg-rose-100/80 shadow-sm transition-colors dark:border-rose-600 dark:bg-rose-950/20 dark:text-rose-400 dark:hover:bg-rose-950/40"
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
            className="w-full h-10 border-rose-300/60 bg-white/50 text-rose-600 hover:text-rose-700 hover:bg-rose-100/80 shadow-sm transition-colors dark:border-rose-600 dark:bg-rose-950/20 dark:text-rose-400 dark:hover:bg-rose-950/40"
            onClick={() =>
              setShowSelections && setShowSelections(!showSelections)
            }
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
