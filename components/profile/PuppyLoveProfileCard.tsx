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
    bg: "bg-violet-100",
    text: "text-violet-700",
    border: "border-violet-300",
  },
  "Sports & Fitness": {
    bg: "bg-green-100",
    text: "text-green-700",
    border: "border-green-300",
  },
  "Gaming & Tech": {
    bg: "bg-blue-100",
    text: "text-blue-700",
    border: "border-blue-300",
  },
  Entertainment: {
    bg: "bg-pink-100",
    text: "text-pink-700",
    border: "border-pink-300",
  },
  "Outdoor & Adventure": {
    bg: "bg-amber-100",
    text: "text-amber-700",
    border: "border-amber-300",
  },
  "Books & Learning": {
    bg: "bg-indigo-100",
    text: "text-indigo-700",
    border: "border-indigo-300",
  },
  "Food & Lifestyle": {
    bg: "bg-orange-100",
    text: "text-orange-700",
    border: "border-orange-300",
  },
  Social: {
    bg: "bg-cyan-100",
    text: "text-cyan-700",
    border: "border-cyan-300",
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
      <Card className="border-rose-200 bg-linear-to-br from-rose-50/50 to-pink-50/50 dark:from-rose-950/10 dark:to-pink-950/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-rose-600">
            <Heart className="h-5 w-5 fill-rose-500" />
            PuppyLove Profile
          </CardTitle>
          <CardDescription>
            Valentine&apos;s matching is now active!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center py-4">
            <Heart className="h-12 w-12 mx-auto mb-3 text-rose-300" />
            <h3 className="text-lg font-semibold mb-2">Join PuppyLove</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Register on PuppyLove to find your perfect match anonymously. Your
              choices are encrypted and revealed only when there&apos;s a mutual
              match!
            </p>
            <a
              href={process.env.NEXT_PUBLIC_SEARCH_UI_URL || "/"}
              className="inline-flex items-center justify-center gap-2 px-6 py-2 rounded-full bg-linear-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-medium transition-all"
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
    <Card className="border-pink-200 bg-linear-to-br from-pink-50 to-rose-50 dark:from-pink-950/20 dark:to-rose-950/20">
      <CardHeader className="flex flex-col items-start sm:flex-row justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2 text-pink-600">
            <Heart className="h-5 w-5 fill-rose-500" />
            PuppyLove Profile
          </CardTitle>
          <CardDescription className="text-pink-600/70">
            Your bio and interests are visible to other PuppyLove participants
          </CardDescription>
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
                disabled={isSaving || !hasChanges}
              >
                <Save className="mr-1 h-4 w-4" />
                {isSaving ? "Saving..." : "Save"}
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={() => setIsEditing(true)}>
              <Edit className="h-4 w-4" />
              Edit
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Bio Section */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-pink-700">About Me</label>
          {isEditing ? (
            <>
              <Textarea
                value={bio}
                onChange={(e) =>
                  setBio(e.target.value.slice(0, BIO_MAX_LENGTH))
                }
                placeholder="Write something about yourself..."
                className="min-h-20 resize-none bg-white/50 border-pink-200 focus:border-pink-400"
              />
              <p className="text-xs text-pink-600/70 text-right">
                {bio.length}/{BIO_MAX_LENGTH}
              </p>
            </>
          ) : (
            <p className="text-foreground py-2">
              {bio || <span className="text-pink-400/70">Not provided</span>}
            </p>
          )}
        </div>

        {/* Interests Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-pink-700">
              Interests
            </label>
            {isEditing && (
              <span className="text-xs text-pink-600/70">
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
                      <h4 className="text-xs font-semibold text-pink-700/80 uppercase tracking-wide">
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
                                  : "bg-white/60 hover:bg-white/80 border-pink-200 text-gray-700",
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
                <span className="text-pink-400/70 text-sm">Not provided</span>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default PuppyLoveProfileCard;
