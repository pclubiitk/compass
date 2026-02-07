import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";

interface RecoveryCodeDownloadCardProps {
  recoveryCode: string;
  email: string;
  onContinue: () => void;
}

export const RecoveryCodeDownloadCard = ({
  recoveryCode,
  email,
  onContinue,
}: RecoveryCodeDownloadCardProps) => {
  const [copied, setCopied] = useState(false);

  const handleDownloadFile = () => {
    const fileContent = `PUPPY LOVE RECOVERY CODE
=======================
Email: ${email}
Recovery Code: ${recoveryCode}

IMPORTANT: Keep this file safe and secure!
You will need this code if you ever forget your Puppy Love password.
Do NOT share this code with anyone.

Generated: ${new Date().toLocaleString()}`;

    const blob = new Blob([fileContent], { type: "text/plain" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `puppy-love-recovery-${email}.txt`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(recoveryCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
          <CardTitle className="text-2xl text-center">Recovery Code</CardTitle>
          <CardDescription className="text-center">
            <span className="font-bold">Save this code immediately!</span>{" "}
            You&apos;ll need it if you forget your Puppy Love password.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="grid gap-4">
            <div className="bg-muted rounded-lg p-4 font-mono text-sm break-all select-all text-center">
              {recoveryCode}
            </div>

            <Button onClick={handleDownloadFile} className="w-full">
              Download as File
            </Button>

            <Button
              onClick={handleCopyCode}
              variant="outline"
              className="w-full"
            >
              {copied ? "✓ Copied!" : "Copy Code"}
            </Button>

            <Button onClick={onContinue} className="w-full mt-4">
              Continue to Puppy Love
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
