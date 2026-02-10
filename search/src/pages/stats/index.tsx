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
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Heart,
  Users,
  HeartHandshake,
  TrendingUp,
  BarChart3,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { PUPPYLOVE_POINT } from "@/lib/constant";

interface PuppyLoveStats {
  totalRegisters: number;
  maleRegisters: number;
  femaleRegisters: number;
  batchwiseRegistration: Record<string, number>;
  totalMatches: number;
  batchwiseMatches: Record<string, number>;
  msg?: string;
}

export default function StatsPage() {
  const [stats, setStats] = useState<PuppyLoveStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(
          `${PUPPYLOVE_POINT}/api/puppylove/stats`,
          { credentials: "include" },
        );

        if (!res.ok) {
          throw new Error("Failed to fetch stats");
        }

        const data = await res.json();
        if (data.msg) {
          // Stats not yet published
          setError(data.msg);
        } else {
          setStats(data);
        }
      } catch (err) {
        console.error("[PuppyLove Stats] Error:", err);
        setError("Could not load statistics");
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  // Sort batches for display
  const sortedBatches = stats?.batchwiseRegistration 
    ? Object.entries(stats.batchwiseRegistration).sort(([a], [b]) => b.localeCompare(a))
    : [];

  const sortedMatchBatches = stats?.batchwiseMatches
    ? Object.entries(stats.batchwiseMatches).sort(([a], [b]) => b.localeCompare(a))
    : [];

  return (
    <div className="min-h-screen bg-linear-to-br from-rose-50 via-pink-50 to-purple-50 dark:from-gray-900 dark:via-rose-950/10 dark:to-purple-950/10 px-6 py-12">
      <div className="mx-auto w-full max-w-5xl space-y-10">
        <header className="space-y-3 text-center">
          <div className="flex justify-center">
            <Image
              src="/icons/puppyLoveLogo.png"
              alt="PuppyLove"
              width={64}
              height={64}
              className="rounded-lg"
            />
          </div>
          <h1 className="text-4xl font-bold tracking-wide text-rose-600">
            PuppyLove Stats
          </h1>
          <p className="text-muted-foreground">Valentine&apos;s 2026 Statistics</p>
        </header>
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
            <Card className="overflow-hidden p-0">
              <div
                className={cn(
                  "p-6 flex items-center justify-between",
                  "bg-linear-to-r from-rose-500 to-pink-500 text-white",
                )}
              >
                <div className="flex items-center gap-4">
                  <Sparkles className="h-8 w-8" />
                  <div>
                    <h2 className="text-2xl font-bold">PuppyLove 2026</h2>
                    <p className="text-rose-100">Find your Valentine</p>
                  </div>
                </div>
                <div
                  className={cn(
                    "px-4 py-2 rounded-full font-medium",
                    "bg-white/20 backdrop-blur-sm",
                  )}
                >
                  Results Published
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
                    {stats.totalRegisters.toLocaleString()}
                  </div>
                  <div className="mt-2 flex gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                      {stats.maleRegisters} Male
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-pink-500"></span>
                      {stats.femaleRegisters} Female
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Matches */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <HeartHandshake className="h-5 w-5 text-green-500" />
                    Total Matches
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-green-600">
                    {stats.totalMatches.toLocaleString()}
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Successful matches
                  </p>
                </CardContent>
              </Card>

              {/* Match Rate */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <TrendingUp className="h-5 w-5 text-purple-500" />
                    Match Rate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-purple-600">
                    {stats.totalRegisters > 0
                      ? ((stats.totalMatches * 2 / stats.totalRegisters) * 100).toFixed(1)
                      : "0"}%
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Of participants matched
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Batch-wise Registration */}
            {sortedBatches.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-blue-500" />
                    Batch-wise Registrations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {sortedBatches.map(([batch, count]) => {
                      const maxCount = Math.max(...sortedBatches.map(([, c]) => c));
                      const percentage = (count / maxCount) * 100;
                      return (
                        <div key={batch} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="font-medium">{batch}</span>
                            <span className="text-muted-foreground">{count}</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-linear-to-r from-blue-400 to-blue-600 rounded-full transition-all"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Batch-wise Matches */}
            {sortedMatchBatches.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <HeartHandshake className="h-5 w-5 text-rose-500" />
                    Batch-wise Matches
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {sortedMatchBatches.map(([batch, count]) => {
                      const maxCount = Math.max(...sortedMatchBatches.map(([, c]) => c));
                      const percentage = (count / maxCount) * 100;
                      return (
                        <div key={batch} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="font-medium">{batch}</span>
                            <span className="text-muted-foreground">{count}</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-linear-to-r from-rose-400 to-rose-600 rounded-full transition-all"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Facts */}
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
                    <div className="text-2xl font-bold text-purple-600">4</div>
                    <p className="text-xs text-muted-foreground">
                      Max hearts allowed
                    </p>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {stats.totalRegisters > 0
                        ? ((stats.maleRegisters / stats.totalRegisters) * 100).toFixed(0)
                        : "0"}%
                    </div>
                    <p className="text-xs text-muted-foreground">Male ratio</p>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold text-pink-600">
                      {stats.totalRegisters > 0
                        ? ((stats.femaleRegisters / stats.totalRegisters) * 100).toFixed(0)
                        : "0"}%
                    </div>
                    <p className="text-xs text-muted-foreground">Female ratio</p>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {sortedBatches.length}
                    </div>
                    <p className="text-xs text-muted-foreground">Batches participating</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}
      </div>
    </div>
  );
}
