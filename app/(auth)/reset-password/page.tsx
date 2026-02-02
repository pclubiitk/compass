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
    // TODO: extract this out for all this auth pages
    const LogoHeader = () => (
        <>
            <CardTitle className="flex flex-col items-center gap-2">
                <a
                    href="https://pclub.in"
                    className="flex flex-col items-center gap-2 font-medium"
                >
                    <div className="flex size-8 items-center justify-center rounded-md">
                        <Image
                            src="/pclub.png"
                            alt="Programming Club Logo"
                            width={60}
                            height={60}
                            className="rounded-2xl"
                        />
                    </div>
                    <span className="sr-only">Programming Club</span>
                </a>
            </CardTitle>
            <CardDescription className="flex flex-col items-center gap-2">
                <p>Programming Club IIT Kanpur</p>
            </CardDescription>
        </>
    );

    if (!token || !id) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-linear-to-r from-blue-100 to-teal-100 dark:from-slate-800 dark:to-slate-900">
                <Card className="w-full max-w-sm">
                    <CardHeader>
                        <LogoHeader />
                        <CardTitle className="text-destructive text-2xl pt-2">Invalid Link</CardTitle>
                        <CardDescription>
                            This password reset link is invalid or expired.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button onClick={() => router.push("/login")} className="w-full">
                            Back to Login
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-linear-to-r from-blue-100 to-teal-100 dark:from-slate-800 dark:to-slate-900">
            <Card className="w-full max-w-sm">
                <CardHeader>
                    <LogoHeader />
                    
                    {/* Left-aligned title like the login page */}
                    <CardTitle className="text-2xl pt-2">Reset Password</CardTitle>
                    <CardDescription>
                        Enter your new password below.
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    <form onSubmit={onSubmit} className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="password">New Password</Label>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                required
                                minLength={8}
                                placeholder="New password"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="confirmPassword">Confirm Password</Label>
                            <Input
                                id="confirmPassword"
                                name="confirmPassword"
                                type="password"
                                required
                                minLength={8}
                                placeholder="Repeat new password"
                            />
                        </div>

                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? "Resetting..." : "Reset Password"}
                        </Button>
                        
                        <div className="text-sm text-center">
                            <a href="/login" className="underline underline-offset-4">
                                Cancel
                            </a>
                        </div>
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
