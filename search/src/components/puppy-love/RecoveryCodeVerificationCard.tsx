import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import { toast } from "sonner";
import { PUPPYLOVE_POINT } from "@/lib/constant";
import { Copy, Eye, EyeOff, CheckCircle } from "lucide-react";
import { Decryption_AES } from "@/lib/workers/Encryption";

interface RecoveryCodeVerificationCardProps {
  onVerified: (password: string) => void;
  onBack: () => void;
}

export const RecoveryCodeVerificationCard = ({
  onVerified,
  onBack,
}: RecoveryCodeVerificationCardProps) => {
  const [code, setCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [recoveredPassword, setRecoveredPassword] = useState<string | null>(
    null,
  );
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleVerify = async () => {
    if (!code.trim()) {
      toast.error("Please enter your recovery code");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(
        `${PUPPYLOVE_POINT}/api/puppylove/users/retrieve`,
        {
          method: "GET",
          credentials: "include",
        },
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to retrieve");
      }

      const data = await res.json();
      if (!data.code) {
        toast.error("No recovery code found");
        return;
      }

      // Decrypt with AES - returns empty string if wrong key
      const password = await Decryption_AES(data.code, code.trim());
      if (!password) {
        throw new Error("Invalid recovery code");
      }
      setRecoveredPassword(password);
      toast.success("Password recovered!");
    } catch (err: any) {
      toast.error(err.message || "Invalid recovery code");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopy = async () => {
    if (!recoveredPassword) return;
    await navigator.clipboard.writeText(recoveredPassword);
    setCopied(true);
    toast.success("Copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  // Success screen
  if (recoveredPassword) {
    return (
      <div className="fixed inset-0 z-100 flex items-center justify-center bg-linear-to-r from-rose-100 to-pink-100 dark:from-slate-800 dark:to-slate-900 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-2">
              <CheckCircle className="h-12 w-12 text-green-500" />
            </div>
            <CardTitle className="text-green-600">
              Password Recovered!
            </CardTitle>
            <CardDescription>
              Copy your password and use it to log in.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Your Password</Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={recoveredPassword}
                  readOnly
                  className="pr-16 font-mono"
                />
                <div className="absolute right-1 top-1/2 -translate-y-1/2 flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={handleCopy}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
            <Button
              className="w-full"
              onClick={() => onVerified(recoveredPassword)}
            >
              {copied ? "✓ Copied!" : "Continue to Login"}
            </Button>
            <Button variant="outline" className="w-full" onClick={onBack}>
              Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Input screen
  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-linear-to-r from-rose-100 to-pink-100 dark:from-slate-800 dark:to-slate-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <Image
              src="/icons/puppyLoveLogo.png"
              alt="Puppy Love"
              width={64}
              height={64}
              className="rounded-2xl"
            />
          </div>
          <CardTitle>Recover Password</CardTitle>
          <CardDescription>
            Enter your recovery code to get your password.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Recovery Code</Label>
            <Input
              type={showCode ? "text" : "password"}
              placeholder="XXXX-XXXX-XXXX-..."
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleVerify()}
              disabled={isSubmitting}
              className="font-mono"
              autoFocus
            />
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={showCode}
                onChange={(e) => setShowCode(e.target.checked)}
                className="rounded"
              />
              Show code
            </label>
          </div>
          <Button
            className="w-full"
            onClick={handleVerify}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Verifying..." : "Recover Password"}
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={onBack}
            disabled={isSubmitting}
          >
            Back
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
