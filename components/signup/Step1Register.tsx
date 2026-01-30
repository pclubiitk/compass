"use client";

import { useState, useRef, FormEvent } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import ReCAPTCHA from "react-google-recaptcha";

interface Step1RegisterProps {
  onSuccess: (data: { userID: string }) => void;
}

export function Step1Register({ onSuccess }: Step1RegisterProps) {
  const [isLoading, setIsLoading] = useState(false);
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY!;
  const formRef = useRef<HTMLFormElement>(null);
  const recaptchaRef = useRef<ReCAPTCHA>(null);
  const [agreedToTnC, setAgreedToTnC] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setIsLoading(true);

    try {
      if (!agreedToTnC) {
        toast.error("Agree to TnC to continue signing up.");
        return;
      }

      // Executing invisible reCAPTCHA
      const token = await recaptchaRef.current?.executeAsync();
      if (!token) {
        toast.error("Error in captcha validation");
        return;
      }

      const formData = new FormData(formRef.current!);
      const email = formData.get("email")?.toString().toLowerCase();
      const password = formData.get("password");

      // Only allow IITK email addresses
      if (typeof email !== "string" || !email.endsWith("@iitk.ac.in")) {
        toast.error("Please use a valid IIT Kanpur email address.");
        setIsLoading(false);
        return;
      }
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_AUTH_URL}/api/auth/signup`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, token }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message);
        onSuccess({ userID: data.userID });
      } else {
        toast.error(data.error || "Signup failed");
      }
    } catch {
      toast.error("An unexpected error occurred.");
    } finally {
      setIsLoading(false);
      recaptchaRef.current?.reset();
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
              />
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
          <Button
            variant="link"
            asChild
            className="p-0 h-auto underline-offset-4"
          >
            <a href="/login">Login</a>
          </Button>
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form ref={formRef} onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="@iitk.ac.in"
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

          <div className="flex items-start space-x-2 text-sm text-gray-600 dark:text-gray-400">
            <input
              id="privacy"
              type="checkbox"
              checked={agreedToTnC}
              onChange={(e) => setAgreedToTnC(e.target.checked)}
              className="mt-1"
            />
            <label htmlFor="privacy">
              I have read and agree to the{" "}
              <Button
                variant="link"
                asChild
                className="p-0 h-auto text-blue-600"
              >
                <a href="/privacy-policy" target="_blank">
                  Data handling & Privacy Policy
                </a>
              </Button>{" "}
              followed by Programming Club.
            </label>
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Creating Account..." : "Continue"}
          </Button>

          {/* Divider with OR text */}
          <div className="relative -my-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-gray-600" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500 dark:bg-slate-950 dark:text-gray-400">
                or
              </span>
            </div>
          </div>

          {/* Alternative action */}
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => window.location.href = "/login"}
          >
            Login Instead
          </Button>

          {/* Invisible reCAPTCHA v3 */}
          <ReCAPTCHA sitekey={siteKey} ref={recaptchaRef} size="invisible" />
        </form>
      </CardContent>
    </Card>
  );
}
