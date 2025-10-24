"use client";

import { FormEvent, useEffect, useState } from "react";
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
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const router = useRouter();
  const { isLoggedIn, setLoggedIn } = useGContext();

  // To redirect to the initiator page setup, extract the url of previous page
  const searchParams = useSearchParams();
  const callbackUrl =
    searchParams.get("callbackUrl") ||
    process.env.NEXT_PUBLIC_PROFILE_URL ||
    "/";
  useEffect(() => {
    console.log(isLoggedIn);
    if (isLoggedIn === true) router.replace(callbackUrl);
    // The dependency array ensures effect only runs once on mount,
    // unless the router or callbackUrl changes.
  }, [callbackUrl, router, isLoggedIn]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    try {
      const formData = new FormData(event.currentTarget);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_AUTH_URL}/api/auth/login`,
        {
          method: "POST",
          body: formData,
          credentials: "include",
        }
      );
      // TODO: Handel the error more elegantly
      const data = await response.json();
      if (response.ok) {
        toast(data.message);
        setLoggedIn(true); // global context
        // From where ever you redirect use router.push(`/login?callbackUrl=${encodeURIComponent(router.asPath)}`);
        router.replace(callbackUrl);
      } else {
        toast(data.error);
      }
    } catch (error) {
      toast("Something went wrong, Try again later.");
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  }

  // Extract the form component into other
  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-r 
  from-blue-100 to-teal-100 
  dark:from-slate-800 dark:to-slate-900"
    >
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
          <CardTitle className="text-2xl">Log In</CardTitle>
          <CardDescription>
            Please Login to continue, Don&apos;t have an account?{" "}
            <a href="/signup" className="underline underline-offset-4">
              Sign up
            </a>{" "}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={onSubmit} method="post" className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="@iik.ac.in"
                minLength={8}
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
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Verifying.." : "Login"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
