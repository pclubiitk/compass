import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Image from "next/image";

interface RecoveryCodeVerificationCardProps {
  onVerified: (password: string) => void;
  onBack: () => void;
}

export const RecoveryCodeVerificationCard = ({ 
  onVerified,
  onBack
}: RecoveryCodeVerificationCardProps) => {
  const [email, setEmail] = useState("");
  const [recoveryCode, setRecoveryCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleVerify = async () => {
    if (!email.trim()) {
      alert("Please enter your email");
      return;
    }

    if (!recoveryCode.trim()) {
      alert("Please enter your recovery code");
      return;
    }

    setIsSubmitting(true);
    try {
      // This will call the backend endpoint to decrypt password
      // const res = await fetch(`/api/auth/puppylove-recover`, {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({
      //     email: email.trim(),
      //     recoveryCode: recoveryCode.trim()
      //   })
      // });

      // if (!res.ok) {
      //   alert("Invalid recovery code or email");
      //   setIsSubmitting(false);
      //   return;
      // }

      // const data = await res.json();
      // onVerified(data.password);

      // For now, just show mock success
      alert("Recovery code verified! Your password has been recovered.");
      onVerified("recovered_password");
    } catch (err) {
      console.error("Recovery verification error:", err);
      alert("Failed to verify recovery code");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gradient-to-r from-rose-100 to-pink-100 dark:from-slate-800 dark:to-slate-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex flex-col items-center gap-2">
            <div className="flex size-16 items-center justify-center rounded-md">
              <Image 
                src="/icons/puppyLoveLogo.png" 
                alt="Puppy Love" 
                width={64}
                height={64}
                className="rounded-2xl"
              />
            </div>
          </CardTitle>
          <CardTitle className="text-2xl text-center">Recover with Code</CardTitle>
          <CardDescription className="text-center">
            Enter the 32-character recovery code you received when you registered for Puppy Love.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="@iitk.ac.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="recoveryCode">Recovery Code</Label>
              <Input
                id="recoveryCode"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your 32-character code"
                value={recoveryCode}
                onChange={(e) => setRecoveryCode(e.target.value)}
                disabled={isSubmitting}
                className="font-mono"
                required
              />
            </div>

            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input 
                type="checkbox" 
                checked={showPassword}
                onChange={(e) => setShowPassword(e.target.checked)}
                className="rounded"
              />
              Show code
            </label>

            <Button 
              type="button"
              className="w-full"
              onClick={handleVerify}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Verifying..." : "Verify Code"}
            </Button>

            <Button 
              type="button"
              variant="outline"
              className="w-full"
              onClick={onBack}
              disabled={isSubmitting}
            >
              Back
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
