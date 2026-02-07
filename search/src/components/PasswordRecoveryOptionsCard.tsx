import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";

interface PasswordRecoveryOptionsCardProps {
  onChooseRecoveryCode: () => void;
  onChooseNewPassword: () => void;
  onCancel: () => void;
}

export const PasswordRecoveryOptionsCard = ({ 
  onChooseRecoveryCode,
  onChooseNewPassword,
  onCancel
}: PasswordRecoveryOptionsCardProps) => {
  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-linear-to-r from-rose-100 to-pink-100 dark:from-slate-800 dark:to-slate-900 p-4">
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
          <CardTitle className="text-2xl text-center">Password Recovery</CardTitle>
          <CardDescription className="text-center">
            Choose how you want to recover your Puppy Love password.
          </CardDescription>
        </CardHeader>

        <CardContent>

          <div className="grid gap-4">
            <Button
              onClick={onChooseRecoveryCode}
              variant="outline"
              className="w-full h-auto py-4 flex flex-col items-start gap-1"
            >
              <p className="font-bold text-sm">Use Recovery Code</p>
              <p className="text-xs text-muted-foreground font-normal">Enter the recovery code you saved during signup</p>
            </Button>

            <Button
              onClick={onChooseNewPassword}
              variant="outline"
              className="w-full h-auto py-4 flex flex-col items-start gap-1 border-red-200 hover:bg-red-50"
            >
              <p className="font-bold text-sm">Create New Password</p>
              <p className="text-xs text-red-600 font-normal">This will erase all Puppy Love data</p>
            </Button>

            <div className="text-sm text-muted-foreground text-center mt-2">
              <p><span className="font-semibold">Tip:</span> Use your recovery code if you have it.</p>
            </div>

            <Button 
              variant="ghost"
              onClick={onCancel}
              className="w-full"
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
