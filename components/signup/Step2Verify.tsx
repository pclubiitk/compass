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
        }
      );
      const data = await response.json();

      if (response.ok) {
        toast.success(data.message);
        onSuccess();
      } else {
        toast.error(data.error);
      }
    } catch (error) {
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
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-4 justify-center">
          <InputOTP maxLength={6} value={otp} onChange={setOtp}>
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
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Verifying..." : "Verify Account"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
