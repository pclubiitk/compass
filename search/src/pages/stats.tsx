/**
 * PuppyLove Stats Page
 *
 * Displays aggregate statistics for the PuppyLove Valentine's event:
 * - Total registrations
 * - Hearts sent/received metrics
 * - Match statistics (after event ends)
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Heart,
  Users,
  HeartHandshake,
  ArrowLeft,
  TrendingUp,
  BarChart3,
  Sparkles,
} from "lucide-react";
import { useRouter } from "next/router";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface PuppyLoveStats {
  totalRegistrations: number;
  maleRegistrations: number;
  femaleRegistrations: number;
  totalHeartsSent: number;
  totalMatches: number;
  lastUpdated: string;
  eventPhase:
    | "registration"
    | "heart-sending"
    | "matching"
    | "results"
    | "closed";
}

export default function StatsPage() {
  const router = useRouter();
  const [stats, setStats] = useState<PuppyLoveStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_AUTH_URL}/api/puppylove/stats`,
          { credentials: "include" },
        );

        if (!res.ok) {
          throw new Error("Failed to fetch stats");
        }

        const data = await res.json();
        setStats(data);
      } catch (err) {
        console.error("[PuppyLove Stats] Error:", err);
        setError("Could not load statistics");
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  const getPhaseInfo = (phase: PuppyLoveStats["eventPhase"]) => {
    switch (phase) {
      case "registration":
        return {
          label: "Registration Open",
          color: "text-blue-500",
          bgColor: "bg-blue-100",
        };
      case "heart-sending":
        return {
          label: "Sending Hearts",
          color: "text-rose-500",
          bgColor: "bg-rose-100",
        };
      case "matching":
        return {
          label: "Processing Matches",
          color: "text-amber-500",
          bgColor: "bg-amber-100",
        };
      case "results":
        return {
          label: "Results Available",
          color: "text-green-500",
          bgColor: "bg-green-100",
        };
      case "closed":
        return {
          label: "Event Ended",
          color: "text-gray-500",
          bgColor: "bg-gray-100",
        };
      default:
        return {
          label: "Unknown",
          color: "text-gray-500",
          bgColor: "bg-gray-100",
        };
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-rose-50 via-pink-50 to-purple-50 dark:from-gray-900 dark:via-rose-950/10 dark:to-purple-950/10">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 py-3 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/")}
            className="shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <Image
              src="/icons/puppyLoveLogo.png"
              alt="PuppyLove"
              width={40}
              height={40}
              className="rounded-lg"
            />
            <div>
              <h1 className="font-bold text-lg">PuppyLove Stats</h1>
              <p className="text-xs text-muted-foreground">
                Valentine&apos;s 2025
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-40 w-full rounded-xl" />
            ))}
          </div>
        ) : error ? (
          <Card className="max-w-md mx-auto">
            <CardContent className="py-12 text-center">
              <Heart className="h-12 w-12 mx-auto mb-4 text-rose-300" />
              <p className="text-muted-foreground">{error}</p>
              <Button
                variant="outline"
                onClick={() => window.location.reload()}
                className="mt-4"
              >
                Try Again
              </Button>
            </CardContent>
          </Card>
        ) : stats ? (
          <div className="space-y-8">
            {/* Event Phase Banner */}
            <Card className="overflow-hidden">
              <div
                className={cn(
                  "p-6 flex items-center justify-between",
                  "bg-linear-to-r from-rose-500 to-pink-500 text-white",
                )}
              >
                <div className="flex items-center gap-4">
                  <Sparkles className="h-8 w-8" />
                  <div>
                    <h2 className="text-2xl font-bold">PuppyLove 2025</h2>
                    <p className="text-rose-100">Find your Valentine</p>
                  </div>
                </div>
                <div
                  className={cn(
                    "px-4 py-2 rounded-full font-medium",
                    "bg-white/20 backdrop-blur-sm",
                  )}
                >
                  {getPhaseInfo(stats.eventPhase).label}
                </div>
              </div>
            </Card>

            {/* Main Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Total Registrations */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Users className="h-5 w-5 text-blue-500" />
                    Total Participants
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-blue-600">
                    {stats.totalRegistrations.toLocaleString()}
                  </div>
                  <div className="mt-2 flex gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                      {stats.maleRegistrations} Male
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-pink-500"></span>
                      {stats.femaleRegistrations} Female
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Hearts Sent */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Heart className="h-5 w-5 text-rose-500" />
                    Hearts Sent
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-rose-600">
                    {stats.totalHeartsSent.toLocaleString()}
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Across all participants
                  </p>
                </CardContent>
              </Card>

              {/* Matches */}
              <Card
                className={cn(
                  stats.eventPhase === "results" &&
                    "border-green-200 bg-green-50/50",
                )}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <HeartHandshake className="h-5 w-5 text-green-500" />
                    Total Matches
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {stats.eventPhase === "results" ||
                  stats.eventPhase === "closed" ? (
                    <>
                      <div className="text-4xl font-bold text-green-600">
                        {stats.totalMatches.toLocaleString()}
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Successful matches
                      </p>
                    </>
                  ) : (
                    <div className="py-4 text-center text-muted-foreground">
                      <BarChart3 className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                      <p className="text-sm">Available after matching</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Fun Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-purple-500" />
                  Quick Facts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {stats.totalRegistrations > 0
                        ? (
                            stats.totalHeartsSent / stats.totalRegistrations
                          ).toFixed(1)
                        : "0"}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Avg hearts per person
                    </p>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold text-rose-600">4</div>
                    <p className="text-xs text-muted-foreground">
                      Max hearts allowed
                    </p>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {stats.totalRegistrations > 0
                        ? (
                            (stats.maleRegistrations /
                              stats.totalRegistrations) *
                            100
                          ).toFixed(0)
                        : "0"}
                      %
                    </div>
                    <p className="text-xs text-muted-foreground">Male ratio</p>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold text-pink-600">
                      {stats.totalRegistrations > 0
                        ? (
                            (stats.femaleRegistrations /
                              stats.totalRegistrations) *
                            100
                          ).toFixed(0)
                        : "0"}
                      %
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Female ratio
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Last Updated */}
            <p className="text-center text-xs text-muted-foreground">
              Last updated: {new Date(stats.lastUpdated).toLocaleString()}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
