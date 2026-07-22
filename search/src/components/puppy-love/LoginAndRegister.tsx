import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import { PUPPYLOVE_POINT, FORGOT_POINT } from "@/lib/constant";
import {
  generateKeys,
  initPuppyLoveWorker,
  encryptPrivateKey,
  decryptPrivateKey,
} from "@/lib/workers/puppyLoveWorkerClient";
import { toast } from "sonner";
import { useRouter } from "next/router";
import { useGContext } from "@/components/ContextProvider";
import { PasswordRecoveryOptionsCard } from "./PasswordRecoveryOptionsCard";
import { RecoveryCodeVerificationCard } from "./RecoveryCodeVerificationCard";

interface PuppyLoveLoginAndRegistrationCardProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export const PuppyLoveLoginAndRegisterPasswordCard = ({
  onSuccess,
  onCancel,
}: PuppyLoveLoginAndRegistrationCardProps) => {
  const [password, setPassword] = useState("");
  const [agreedToTnC, setAgreedToTnC] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { setPrivateKey, privateKey } = useGContext();
  const [recoveryStep, setRecoveryStep] = useState<"options" | "code" | null>(
    null,
  );
  const [isRegistered, setIsRegistered] = useState(true);
  const router = useRouter();

  // If the privatekey already exits in the state, no need.
  useEffect(() => {
    if (privateKey) {
      onSuccess();
    }
  }, [privateKey]);

  const handlerAll = async (
    providedPassword: string = "",
    withPassword: boolean = false,
  ) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    if (withPassword && providedPassword === "") {
      toast("No password found");
      setIsSubmitting(false);
      return;
    } else if (withPassword) {
      setPassword(providedPassword);
    }

    const usePassword = withPassword ? providedPassword : password;

    try {
      // If user is in registration mode (TnC agreed), skip verify-password and register directly
      if (!isRegistered && agreedToTnC) {
        initPuppyLoveWorker();
        const keys = await generateKeys();
        const pubKey = keys.pubKey;
        const privKey = keys.privKey;
        const encryptedPrivKey = await encryptPrivateKey(privKey, usePassword);

        const registerRes = await fetch(
          `${PUPPYLOVE_POINT}/api/puppylove/users/login/first`,
          {
            method: "POST",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              pubKey: pubKey,
              privKey: encryptedPrivKey,
              data: "{}",
            }),
          },
        );
        const errorData = await registerRes.json();
        if (registerRes.status !== 201) {
          setPassword("");
          toast(errorData.error || "Registration failed. Please try again.");
          setIsSubmitting(false);
          return;
        }
        const rollNo = errorData?.id || "";
        if (typeof window !== "undefined") {
          sessionStorage.setItem(
            "data",
            JSON.stringify({ id: rollNo, k1: privKey, k2: pubKey }),
          );
        }
        setPrivateKey(privKey);
        setIsRegistered(true);
        onSuccess();
        return;
      }

      // Otherwise, verify password with backend to confirm registration eligibility
      const verifyRes = await fetch(
        `${PUPPYLOVE_POINT}/api/puppylove/users/verify-password`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            password: usePassword,
          }),
        },
      );
      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) {
        if (verifyRes.status === 404) {
          toast("User not registered, Please agree to TnC and register first");
          setIsRegistered(false);
          return;
        }
        toast(verifyData.error || "Invalid password");
        return;
      }
      let pubKey: string = "";
      let privKey: string = "";
      let rollNo: string = "";
      // Confirm user is still unregistered
      if (!verifyData.is_dirty) {
        initPuppyLoveWorker();
        // Initialize worker and generate RSA keys
        const keys = await generateKeys();
        pubKey = keys.pubKey;
        privKey = keys.privKey;
        // Encrypt private key with user's password
        const encryptedPrivKey = await encryptPrivateKey(privKey, usePassword);
        // Register user with backend
        const registerRes = await fetch(
          `${PUPPYLOVE_POINT}/api/puppylove/users/login/first`,
          {
            method: "POST",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              pubKey: pubKey,
              privKey: encryptedPrivKey,
              data: "{}",
            }),
          },
        );
        const errorData = await registerRes.json();
        if (registerRes.status !== 201) {
          setPassword("");
          toast(errorData.error || "Registration failed. Please try again.");
          setIsSubmitting(false);
          return;
        } else {
          setIsRegistered(true);
          rollNo = errorData?.id || "";
        }
      } else {
        toast("Great you are already registered for PuppyLove!");
        setPassword("");
        pubKey = verifyData.pubKey;
        privKey = await decryptPrivateKey(verifyData.privKey, usePassword);
        rollNo = verifyData?.roll;
      }
      // Success - profile created with dirty: true
      // Store keys in sessionStorage for immediate use
      if (typeof window !== "undefined") {
        sessionStorage.setItem(
          "data",
          JSON.stringify({ id: rollNo, k1: privKey, k2: pubKey }),
        );
      }
      setPrivateKey(privKey);
      onSuccess();
    } catch (err) {
      console.error("Registration error:", err);
      toast("Unable to complete registration. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Recovery options flow
  if (recoveryStep === "options") {
    return (
      <PasswordRecoveryOptionsCard
        onChooseRecoveryCode={() => setRecoveryStep("code")}
        onChooseNewPassword={() => {
          router.push(FORGOT_POINT);
        }}
        onCancel={() => {
          setRecoveryStep(null);
          setPassword("");
        }}
      />
    );
  }

  if (recoveryStep === "code") {
    return (
      <RecoveryCodeVerificationCard
        onVerified={(recoveredPassword) => {
          // Password recovered, auto-login
          setPassword(recoveredPassword);
          setRecoveryStep(null);
          handlerAll(recoveredPassword, true);
        }}
        onBack={() => setRecoveryStep("options")}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex flex-col items-center gap-2">
            <Image
              src="/icons/puppyLoveLogo.png"
              alt="Puppy Love"
              width={64}
              height={64}
              className="rounded-2xl"
            />
          </CardTitle>
          <CardTitle className="text-2xl text-center">
            Log Into <span className="text-xl font-light">or</span> Register for{" "}
            <br></br> Puppy Love
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground text-start">
            <p>• 100% Anonymous matching via Encrypted keys</p>
            <p>• Secure heart exchange</p>
          </CardDescription>
        </CardHeader>
        {isSubmitting ? (
          <>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-8 gap-4">
                <Loader2 className="h-12 w-12 text-rose-500 animate-spin" />
                <div className="text-center">
                  <p className="font-medium">
                    Loading, decrypting, and generating encryption keys
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    This may take a moment...
                  </p>
                </div>
              </div>
            </CardContent>
          </>
        ) : (
          <CardContent>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                  <Button
                    variant="link"
                    className="ml-auto h-auto text-sm underline-offset-4"
                    onClick={() => setRecoveryStep("options")}
                  >
                    Forgot your password?
                  </Button>
                </div>
                <Input
                  id="password"
                  type="password"
                  autoFocus
                  placeholder="Enter your profile password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" &&
                    (isRegistered || agreedToTnC) &&
                    handlerAll()
                  }
                  disabled={isSubmitting}
                />
              </div>

              {!isRegistered && (
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreedToTnC}
                    onChange={(e) => setAgreedToTnC(e.target.checked)}
                    className="w-4 h-4 rounded"
                  />
                  <p className="text-sm text-muted-foreground text-center">
                    By registering, you agree to our{" "}
                    <a
                      href="/puppylove-tnc"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-rose-600 hover:underline font-semibold"
                    >
                      Terms & Conditions
                    </a>
                  </p>
                </label>
              )}

              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={onCancel}
                >
                  Back
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => {
                    handlerAll();
                  }}
                  disabled={
                    isSubmitting ||
                    !(isRegistered || agreedToTnC) ||
                    !password.length
                  }
                >
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
};
