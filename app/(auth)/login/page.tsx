"use client";
import { FormEvent, useEffect, useState, useRef } from "react";
import ReCAPTCHA from "react-google-recaptcha";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import { useGContext } from "@/components/ContextProvider";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { isLoggedIn, setLoggedIn } = useGContext();

  // ReCaptcha Set up
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY!;
  const recaptchaRef = useRef<ReCAPTCHA>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // To redirect to the initiator page setup, extract the url of previous page
  const searchParams = useSearchParams();
  const callbackUrl =
    searchParams.get("callbackUrl") ||
    process.env.NEXT_PUBLIC_PROFILE_URL ||
    "/";

  useEffect(() => {
    if (isLoggedIn) router.replace(callbackUrl);
    // The dependency array ensures effect only runs once on mount,
    // unless the router or callbackUrl changes.
  }, [callbackUrl, router, isLoggedIn]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setIsLoading(true);

    try {
      // Executing invisible v2 reCAPTCHA
      const token = await recaptchaRef.current?.executeAsync();
      if (!token) {
        toast.error("Error in captcha validation");
        return;
      }

      // Getting form values
      const formData = new FormData(formRef.current!);
      const email = formData.get("email");
      const password = formData.get("password");

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_AUTH_URL}/api/auth/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, token }),
          credentials: "include",
        }
      );

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message);
        setLoggedIn(true); // global context
        // From where ever you redirect use router.push(`/login?callbackUrl=${encodeURIComponent(router.asPath)}`);
        router.replace(callbackUrl);
      } else {
        toast.error(data.error || "Login failed");
      }
    } catch (err) {
      toast.error("Something went wrong. Try again later.");
    } finally {
      setIsLoading(false);
      recaptchaRef.current?.reset();
    }
  }

  // Extract the form component into other
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-r from-blue-100 to-teal-100 dark:from-slate-800 dark:to-slate-900">
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
          <CardTitle className="text-2xl">Log In</CardTitle>
          <CardDescription>
            Please Login to continue. Don&apos;t have an account?{" "}
            <a href="/signup" className="underline underline-offset-4">
              Sign up
            </a>
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form ref={formRef} onSubmit={onSubmit} className="grid gap-4">
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
                required
              />
            </div>

            {/* Invisible v2 reCAPTCHA */}
            <ReCAPTCHA sitekey={siteKey} ref={recaptchaRef} size="invisible" />

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Verifying..." : "Login"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
