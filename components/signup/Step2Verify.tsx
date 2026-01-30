"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from "@/components/ui/input-otp";
import { toast } from "sonner";
import { REGEXP_ONLY_DIGITS_AND_CHARS } from "input-otp";

interface Step2VerifyProps {
  userID: string;
  onSuccess: () => void;
}

export function Step2Verify({ userID, onSuccess }: Step2VerifyProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [otp, setOtp] = useState("");
  const searchParams = useSearchParams();

  // This handles the verification when the user clicks the link in their email
  useEffect(() => {
    const tokenFromUrl = searchParams.get("token");
    const userIDFromUrl = searchParams.get("userID");

    if (tokenFromUrl && userIDFromUrl) {
      setOtp(tokenFromUrl); // Pre-fill the OTP input
      handleVerify(tokenFromUrl, userIDFromUrl);
    }
  }, [searchParams]);

  const handleVerify = async (token: string, currentUserID: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_AUTH_URL}/api/auth/verify?token=${token}&userID=${currentUserID}`,
        {
          method: "GET",
          credentials: "include",
        },
      );
      const data = await response.json();

      if (response.ok) {
        toast.success(data.message);
        onSuccess();
      } else {
        toast.error(data.error);
      }
    } catch {
      toast.error("An unexpected error occurred during verification.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (otp.length === 6) {
      // Assuming OTP is 6 digits
      handleVerify(otp, userID);
    } else {
      toast.error("Please enter a valid 6-digit OTP.");
    }
  };

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-2xl">Verify Your Account</CardTitle>
        <CardDescription>
          Enter the 6-digit code sent to your email.
          <br></br>
          <p className="italic">
            <Button variant="link" asChild className="p-0 h-auto">
              <a
                href="https://nwm.iitk.ac.in/"
                target="_blank"
                rel="noopener noreferrer"
              >
                nwm
              </a>
            </Button>{" "}
            is preferred over any other mail client for faster mail delivery
          </p>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="flex justify-center w-full">
            {" "}
            <InputOTP
              maxLength={6}
              value={otp}
              onChange={setOtp}
              pattern={REGEXP_ONLY_DIGITS_AND_CHARS}
              inputMode="text"
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
              </InputOTPGroup>
              <InputOTPSeparator />
              <InputOTPGroup>
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Verifying..." : "Verify Account"}
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
            onClick={() => (window.location.href = "/login")}
          >
            Go to Login
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
