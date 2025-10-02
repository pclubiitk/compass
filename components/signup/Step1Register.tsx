"use client";

import { useState, FormEvent } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface Step1RegisterProps {
  onSuccess: (data: { userID: string }) => void;
}

export function Step1Register({ onSuccess }: Step1RegisterProps) {
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    const formData = new FormData(event.currentTarget);
    const email = formData.get("email");
    const password = formData.get("password");

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_AUTH_URL}/api/auth/signup`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message);
        onSuccess({ userID: data.userID });
      } else {
        toast.error(data.error);
      }
    } catch (error) {
      toast.error("An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="flex flex-col items-center gap-2">
          <a
            href="https://pclub.in"
            className="flex flex-col items-center gap-2 font-medium"
          >
            <div className="flex size-8 items-center justify-center rounded-md">
              <Image
                src="/pclub.png"
                alt="Programming Club Logo"
                className="rounded-2xl"
                width={60}
                height={60}
              ></Image>
            </div>
            <span className="sr-only">Programming Club</span>
          </a>
        </CardTitle>
        <CardDescription className="flex flex-col items-center gap-2">
          <p>Programming Club IIT Kanpur</p>
        </CardDescription>
        <CardTitle className="text-2xl">Sign Up</CardTitle>
        <CardDescription>
          Enter your email and password to create an account. Already have an
          account?{" "}
          <a href="/login" className="underline underline-offset-4">
            Login
          </a>{" "}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="@iik.ac.in"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="no one is watching..."
              minLength={8}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Creating Account..." : "Continue"}
          </Button>
        </form>
      </CardContent>
      <CardFooter>
        <div className="text-muted-foreground *:[a]:hover:text-primary text-center text-xs text-balance *:[a]:underline *:[a]:underline-offset-4">
          By clicking continue, you agree to our{" "}
          <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.
          {/* TODO: Add TnC and Privacy Policy page */}
        </div>
      </CardFooter>
    </Card>
  );
}
