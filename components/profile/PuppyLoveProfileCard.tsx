/**
 * PuppyLoveProfileCard
 *
 * Card component for editing the user's PuppyLove profile (bio + interests).
 * Displays in the profile page. Only visible when PuppyLove mode is active.
 */

"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Heart, Save, Loader2, Check, Edit, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Import interest groups and color utilities
const PUPPYLOVE_INTEREST_GROUPS = {
  "Music & Arts": [
    "Singing",
    "Dance",
    "Guitar",
    "Drums",
    "Piano",
    "Drawing",
    "Painting",
    "Photography",
  ],
  "Sports & Fitness": [
    "Cricket",
    "Football",
    "Basketball",
    "Badminton",
    "Tennis",
    "Swimming",
    "Gym",
    "Running",
    "Cycling",
    "Yoga",
  ],
  "Gaming & Tech": [
    "PC Gaming",
    "Mobile Gaming",
    "Console Gaming",
    "Coding",
    "AI/ML",
    "Web Dev",
    "Anime",
  ],
  Entertainment: [
    "Movies",
    "TV Shows",
    "K-Drama",
    "K-Pop",
    "Podcasts",
    "Stand-up",
    "Memes",
  ],
  "Outdoor & Adventure": [
    "Trekking",
    "Camping",
    "Travel",
    "Road Trips",
    "Stargazing",
  ],
  "Books & Learning": [
    "Fiction",
    "Non-Fiction",
    "Poetry",
    "Philosophy",
    "History",
    "Science",
  ],
  "Food & Lifestyle": ["Cooking", "Baking", "Coffee", "Tea", "Foodie", "Vegan"],
  Social: [
    "Public Speaking",
    "Debating",
    "Volunteering",
    "Networking",
    "Party Games",
  ],
} as const;

// Backend limits: about max 70 chars, interests max 50 chars total (comma-separated)
const BIO_MAX_LENGTH = 70;
const MAX_INTERESTS = 4;

const INTEREST_COLORS: Record<
  string,
  { bg: string; text: string; border: string }
> = {
  "Music & Arts": {
    bg: "bg-violet-100 dark:bg-violet-900/40",
    text: "text-violet-800 dark:text-violet-200",
    border: "border-violet-300/80 dark:border-violet-600",
  },
  "Sports & Fitness": {
    bg: "bg-emerald-100 dark:bg-emerald-900/40",
    text: "text-emerald-800 dark:text-emerald-200",
    border: "border-emerald-300/80 dark:border-emerald-600",
  },
  "Gaming & Tech": {
    bg: "bg-sky-100 dark:bg-sky-900/40",
    text: "text-sky-800 dark:text-sky-200",
    border: "border-sky-300/80 dark:border-sky-600",
  },
  Entertainment: {
    bg: "bg-fuchsia-100 dark:bg-fuchsia-900/40",
    text: "text-fuchsia-800 dark:text-fuchsia-200",
    border: "border-fuchsia-300/80 dark:border-fuchsia-600",
  },
  "Outdoor & Adventure": {
    bg: "bg-amber-100 dark:bg-amber-900/40",
    text: "text-amber-800 dark:text-amber-200",
    border: "border-amber-300/80 dark:border-amber-600",
  },
  "Books & Learning": {
    bg: "bg-indigo-100 dark:bg-indigo-900/40",
    text: "text-indigo-800 dark:text-indigo-200",
    border: "border-indigo-300/80 dark:border-indigo-600",
  },
  "Food & Lifestyle": {
    bg: "bg-orange-100 dark:bg-orange-900/40",
    text: "text-orange-800 dark:text-orange-200",
    border: "border-orange-300/80 dark:border-orange-600",
  },
  Social: {
    bg: "bg-teal-100 dark:bg-teal-900/40",
    text: "text-teal-800 dark:text-teal-200",
    border: "border-teal-300/80 dark:border-teal-600",
  },
};

function getInterestCategory(interest: string): string {
  for (const [category, categoryInterests] of Object.entries(
    PUPPYLOVE_INTEREST_GROUPS,
  )) {
    if ((categoryInterests as readonly string[]).includes(interest)) {
      return category;
    }
  }
  return "Social";
}

function getInterestColorClass(interest: string): string {
  const category = getInterestCategory(interest);
  const colors = INTEREST_COLORS[category] || INTEREST_COLORS["Social"];
  return `${colors.bg} ${colors.text} ${colors.border}`;
}

interface PuppyLoveProfileCardProps {
  initialBio?: string;
  initialInterests?: string[];
  isPuppyLoveActive?: boolean;
  isRegistered?: boolean;
  onUpdate?: () => void;
}

export function PuppyLoveProfileCard({
  initialBio = "",
  initialInterests = [],
  isPuppyLoveActive = false,
  isRegistered = false,
  onUpdate,
}: PuppyLoveProfileCardProps) {
  const [bio, setBio] = useState(initialBio);
  const [interests, setInterests] = useState<string[]>(initialInterests);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Sync local state when initial values change
  useEffect(() => {
    setBio(initialBio);
    setInterests([...initialInterests]);
  }, [initialBio, initialInterests]);

  // Track changes
  useEffect(() => {
    const bioChanged = bio !== initialBio;
    const interestsChanged =
      JSON.stringify(interests.sort()) !==
      JSON.stringify(initialInterests.sort());
    setHasChanges(bioChanged || interestsChanged);
  }, [bio, interests, initialBio, initialInterests]);

  const toggleInterest = (interest: string) => {
    setInterests((prev) => {
      if (prev.includes(interest)) {
        return prev.filter((i) => i !== interest);
      }
      if (prev.length >= MAX_INTERESTS) {
        toast.error(`You can select up to ${MAX_INTERESTS} interests`);
        return prev;
      }
      return [...prev, interest];
    });
  };

  const handleCancel = () => {
    setBio(initialBio);
    setInterests([...initialInterests]);
    setIsEditing(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Save bio (max 70 chars per backend)
      const puppyLoveUrl = process.env.NEXT_PUBLIC_PUPPYLOVE_URL;
      const bioRes = await fetch(`${puppyLoveUrl}/api/puppylove/users/about`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ about: bio }),
      });

      if (!bioRes.ok) {
        throw new Error("Failed to save bio");
      }

      // Save interests as comma-separated string (backend expects string, max 50 chars)
      const interestsStr = interests.join(",");
      if (interestsStr.length > 50) {
        toast.error("Too many interests selected. Please remove some.");
        return;
      }

      const interestsRes = await fetch(
        `${puppyLoveUrl}/api/puppylove/users/interests`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ interests: interestsStr }),
        },
      );

      if (!interestsRes.ok) {
        throw new Error("Failed to save interests");
      }

      toast.success(
        "PuppyLove profile updated, it will be reflected onto portal in few hours",
      );
      setHasChanges(false);
      setIsEditing(false);
      onUpdate?.();
    } catch (error) {
      console.error("[PuppyLove] Save error:", error);
      toast.error("Failed to save profile");
    } finally {
      setIsSaving(false);
    }
  };

  // Don't render if PuppyLove is not active
  if (!isPuppyLoveActive) {
    return null;
  }

  // Show registration banner if not registered
  if (!isRegistered) {
    return (
      <Card className="border-rose-200/60 bg-linear-to-br from-rose-50 via-pink-50/80 to-fuchsia-50/60 shadow-sm dark:border-rose-800/40 dark:from-rose-950/30 dark:via-pink-950/20 dark:to-fuchsia-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
            <Heart className="h-5 w-5 fill-rose-500 dark:fill-rose-400" />
            PuppyLove Profile
          </CardTitle>
          <CardDescription className="text-rose-500/80 dark:text-rose-400/60">
            Valentine&apos;s matching is now active!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center py-6">
            <div className="relative inline-block mb-4">
              <Heart className="h-14 w-14 text-rose-300/80 dark:text-rose-500/50" />
              <Heart className="h-6 w-6 absolute -top-1 -right-2 text-pink-400/60 dark:text-pink-400/40 rotate-12" />
            </div>
            <h3 className="text-lg font-semibold mb-2 text-rose-900 dark:text-rose-100">Join PuppyLove</h3>
            <p className="text-sm text-rose-700/60 dark:text-rose-300/60 mb-5 max-w-xs mx-auto">
              Register on PuppyLove to find your perfect match anonymously. Your
              choices are encrypted and revealed only when there&apos;s a mutual
              match!
            </p>
            <a
              href={process.env.NEXT_PUBLIC_SEARCH_UI_URL || "/"}
              className="inline-flex items-center justify-center gap-2 px-7 py-2.5 rounded-full bg-linear-to-r from-rose-500 via-pink-500 to-fuchsia-500 hover:from-rose-600 hover:via-pink-600 hover:to-fuchsia-600 text-white font-medium transition-all shadow-md shadow-rose-500/25 hover:shadow-lg hover:shadow-rose-500/30"
            >
              <Heart className="h-4 w-4" />
              Register Now
            </a>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-rose-200/50 bg-linear-to-br from-rose-50 via-pink-50/90 to-fuchsia-50/60 shadow-sm dark:border-rose-800/30 dark:from-rose-950/30 dark:via-pink-950/20 dark:to-fuchsia-950/15">
      <CardHeader className="flex flex-col items-start sm:flex-row justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
            <Heart className="h-5 w-5 fill-rose-500 dark:fill-rose-400" />
            PuppyLove Profile
          </CardTitle>
          <CardDescription className="text-rose-500/70 dark:text-rose-400/60">
            Your bio and interests are visible to other PuppyLove participants
          </CardDescription>
        </div>
        <div className="flex flex-row items-start gap-2">
          {isEditing ? (
            <>
              <Button
                variant="outline"
                className="mr-2 border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:border-rose-700 dark:text-rose-400 dark:hover:bg-rose-950/40"
                onClick={handleCancel}
                disabled={isSaving}
              >
                <X className="mr-1 h-4 w-4" />
                Cancel
              </Button>
              <Button
                variant="outline"
                className="border-rose-300 bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 hover:text-rose-700 dark:border-rose-600 dark:text-rose-400 dark:hover:bg-rose-500/20"
                onClick={handleSave}
                disabled={isSaving || !hasChanges}
              >
                <Save className="mr-1 h-4 w-4" />
                {isSaving ? "Saving..." : "Save"}
              </Button>
            </>
          ) : (
            <Button
              variant="outline"
              className="border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:border-rose-700 dark:text-rose-400 dark:hover:bg-rose-950/40"
              onClick={() => setIsEditing(true)}
            >
              <Edit className="h-4 w-4" />
              Edit
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Bio Section */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-rose-700 dark:text-rose-300">About Me</label>
          {isEditing ? (
            <>
              <Textarea
                value={bio}
                onChange={(e) =>
                  setBio(e.target.value.slice(0, BIO_MAX_LENGTH))
                }
                placeholder="Write something about yourself..."
                className="min-h-20 resize-none bg-white/70 border-rose-200 focus:border-rose-400 placeholder:text-rose-300 dark:bg-rose-950/20 dark:border-rose-700 dark:focus:border-rose-500 dark:placeholder:text-rose-600"
              />
              <p className="text-xs text-rose-500/70 dark:text-rose-400/60 text-right">
                {bio.length}/{BIO_MAX_LENGTH}
              </p>
            </>
          ) : (
            <p className="text-foreground py-2">
              {bio || <span className="text-rose-400/60 dark:text-rose-500/50 italic">Not provided</span>}
            </p>
          )}
        </div>

        {/* Interests Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-rose-700 dark:text-rose-300">
              Interests
            </label>
            {isEditing && (
              <span className="text-xs text-rose-500/70 dark:text-rose-400/60">
                {interests.length}/{MAX_INTERESTS} selected
              </span>
            )}
          </div>

          {isEditing ? (
            <>
              {/* Selected interests in edit mode */}
              {interests.length > 0 && (
                <div className="flex flex-wrap gap-2 pb-2">
                  {interests.map((interest) => (
                    <Badge
                      key={interest}
                      variant="outline"
                      className={cn(
                        "cursor-pointer transition-all",
                        getInterestColorClass(interest),
                      )}
                      onClick={() => toggleInterest(interest)}
                    >
                      {interest}
                      <Check className="h-3 w-3 ml-1" />
                    </Badge>
                  ))}
                </div>
              )}

              {/* Interest groups in edit mode */}
              <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
                {Object.entries(PUPPYLOVE_INTEREST_GROUPS).map(
                  ([category, categoryInterests]) => (
                    <div key={category} className="space-y-2">
                      <h4 className="text-xs font-semibold text-rose-600/80 dark:text-rose-400/70 uppercase tracking-wider">
                        {category}
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {categoryInterests.map((interest) => {
                          const isSelected = interests.includes(interest);
                          const colors = INTEREST_COLORS[category];
                          return (
                            <Badge
                              key={interest}
                              variant="outline"
                              className={cn(
                                "cursor-pointer transition-all text-xs",
                                isSelected
                                  ? `${colors.bg} ${colors.text} ${colors.border}`
                                  : "bg-white/70 hover:bg-rose-50 border-rose-200/60 text-rose-900/70 dark:bg-rose-950/20 dark:hover:bg-rose-900/30 dark:border-rose-700/40 dark:text-rose-200/70",
                              )}
                              onClick={() => toggleInterest(interest)}
                            >
                              {interest}
                              {isSelected && (
                                <Check className="h-2.5 w-2.5 ml-1" />
                              )}
                            </Badge>
                          );
                        })}
                      </div>
                    </div>
                  ),
                )}
              </div>
            </>
          ) : (
            /* View mode interests */
            <div className="flex flex-wrap gap-2">
              {interests.length > 0 ? (
                interests.map((interest) => (
                  <Badge
                    key={interest}
                    className={cn("text-xs", getInterestColorClass(interest))}
                  >
                    {interest}
                  </Badge>
                ))
              ) : (
                <span className="text-rose-400/60 dark:text-rose-500/50 text-sm italic">Not provided</span>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default PuppyLoveProfileCard;
