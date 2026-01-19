"use client";
import { FormEvent, useState, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

function ResetPasswordPageHolder() {
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get("token");
    const id = searchParams.get("id");

    async function onSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!token || !id) {
            toast.error("Missing reset token or user ID");
            return;
        }

        setIsLoading(true);

        try {
            const formData = new FormData(event.currentTarget);
            const password = formData.get("password");
            const confirmPassword = formData.get("confirmPassword");

            if (password !== confirmPassword) {
                toast.error("Passwords do not match");
                setIsLoading(false);
                return;
            }

            if (typeof password !== "string" || password.length < 8) {
                toast.error("Password must be at least 8 characters long");
                setIsLoading(false);
                return;
            }

            const response = await fetch(
                `${process.env.NEXT_PUBLIC_AUTH_URL}/api/auth/reset-password`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ token, password, id }),
                }
            );

            const data = await response.json();

            if (response.ok) {
                toast.success(data.message);
                router.push("/login");
            } else {
                toast.error(data.error || "Failed to reset password");
            }
        } catch {
            toast.error("Something went wrong. Try again later.");
        } finally {
            setIsLoading(false);
        }
    }

    if (!token || !id) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-linear-to-r from-blue-100 to-teal-100 dark:from-slate-800 dark:to-slate-900">
                <Card className="w-full max-w-md rounded-3xl shadow-2xl border-none">
                    <CardHeader className="pt-8">
                        <CardTitle className="text-destructive text-center text-xl">Invalid Link</CardTitle>
                        <CardDescription className="text-center px-4">
                            This password reset link is invalid or missing a token.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-8">
                        <Button onClick={() => router.push("/login")} className="w-full rounded-xl h-12 text-base font-medium">
                            Go to Login
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }
    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-linear-to-r from-blue-100 to-teal-100 dark:from-slate-800 dark:to-slate-900">
            <Card className="w-full max-w-md rounded-3xl shadow-2xl border-none">
                <CardHeader className="space-y-1.5 items-center pt-8">
                    <div className="flex size-12 items-center justify-center rounded-2xl mb-4 bg-primary/10">
                        <Image
                            src="/pclub.png"
                            alt="Programming Club Logo"
                            width={60}
                            height={60}
                            className="rounded-2xl"
                        />
                    </div>
                    <CardTitle className="text-2xl font-bold tracking-tight text-center">Reset Password</CardTitle>
                    <CardDescription className="text-center px-4">
                        Enter your new password below.
                    </CardDescription>
                </CardHeader>

                <CardContent className="p-8">
                    <form onSubmit={onSubmit} className="grid gap-6">
                        <div className="grid gap-2">
                            <Label htmlFor="password" className="ml-1">New Password</Label>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                required
                                minLength={8}
                                placeholder="New password"
                                className="rounded-xl h-12"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="confirmPassword" className="ml-1">Confirm Password</Label>
                            <Input
                                id="confirmPassword"
                                name="confirmPassword"
                                type="password"
                                required
                                minLength={8}
                                placeholder="Confirm new password"
                                className="rounded-xl h-12"
                            />
                        </div>

                        <Button type="submit" className="w-full rounded-xl h-12 text-base font-medium" disabled={isLoading}>
                            {isLoading ? "Resetting..." : "Reset Password"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ResetPasswordPageHolder />
        </Suspense>
    );
}
