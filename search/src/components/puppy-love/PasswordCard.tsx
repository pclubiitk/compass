import { useState, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import {
  initPuppyLoveWorker,
  decryptPrivateKey,
  fetchAndClaimHearts,
} from "@/lib/workers/puppyLoveWorkerClient";
import { PUPPYLOVE_POINT } from "@/lib/constant";
import { PuppyLoveRegistrationCard } from "./RegistrationCard";
import { PasswordRecoveryOptionsCard } from "../PasswordRecoveryOptionsCard";
import { RecoveryCodeVerificationCard } from "./RecoveryCodeVerificationCard";
import { LateMatchPrompt } from "./LateMatchPrompt";
import { Label } from "@radix-ui/react-label";
import { toast } from "sonner";

interface PuppyLovePasswordCardProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export const PuppyLovePasswordCard = ({
  onSuccess,
  onCancel,
}: PuppyLovePasswordCardProps) => {
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRegistration, setShowRegistration] = useState(false);
  const [recoveryStep, setRecoveryStep] = useState<"options" | "code" | null>(
    null,
  );
  const [isInitializing, setIsInitializing] = useState(true);
  const [privateKey, setPrivateKey] = useState<string | null>(null);

  // Late hearts state
  const [showLateMatchPrompt, setShowLateMatchPrompt] = useState(false);
  const [lateHearts, setLateHearts] = useState<any[]>([]);
  const [pendingSuccess, setPendingSuccess] = useState(false);

  // Check for private key in memory or sessionStorage on mount
  useEffect(() => {
    const checkStoredKey = async () => {
      try {
        // If privateKey is already in state, skip password prompt
        if (privateKey) {
          setIsInitializing(false);
          // Fetch hearts when we have a private key
          try {
            initPuppyLoveWorker();
            // console.log("[PuppyLove] Fetching and claiming hearts with stored key...");
            const claimedHearts = await fetchAndClaimHearts(privateKey);
            console.log("[PuppyLove] Hearts claimed:", claimedHearts);
            if (claimedHearts) {
              if (typeof window !== "undefined") {
                if (claimedHearts.claims) {
                  sessionStorage.setItem(
                    "puppylove_claims",
                    JSON.stringify(claimedHearts.claims),
                  );
                }
                if (
                  claimedHearts.claims_late &&
                  claimedHearts.claims_late.length > 0
                ) {
                  console.log(
                    "[PuppyLove] Late hearts detected:",
                    claimedHearts.claims_late,
                  );
                  sessionStorage.setItem(
                    "puppylove_claims_late",
                    JSON.stringify(claimedHearts.claims_late),
                  );
                  // Show late match prompt instead of immediately calling onSuccess
                  setLateHearts(claimedHearts.claims_late);
                  setShowLateMatchPrompt(true);
                  setPendingSuccess(true);
                  return; // Don't call onSuccess yet - wait for user decision
                }
              }
            }
          } catch (heartErr) {
            console.warn(
              "[PuppyLove] Error fetching hearts (non-critical):",
              heartErr,
            );
          }
          onSuccess();
          return;
        }

        // Check if keys are stored in sessionStorage
        if (privateKey === null && typeof window !== "undefined") {
          const storedData = sessionStorage.getItem("data");
          if (storedData) {
            try {
              const parsed = JSON.parse(storedData);
              if (parsed.k1) {
                // Keys exist in sessionStorage, skip password prompt
                setPrivateKey(parsed.k1);
                setIsInitializing(false);
                return;
              }
            } catch (parseErr) {
              console.error("Error parsing stored data:", parseErr);
            }
          }
        }
      } catch (err) {
        console.error("Error checking stored key:", err);
      } finally {
        if (!privateKey) {
          setIsInitializing(false);
        }
      }
    };

    if (typeof window !== "undefined") {
      checkStoredKey();
    }
  }, [privateKey, onSuccess]);

  // FIXME(ppy): how ?? Check for existing late hearts in sessionStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedLateHearts = sessionStorage.getItem("puppylove_claims_late");
      if (storedLateHearts) {
        try {
          const parsed = JSON.parse(storedLateHearts);
          if (Array.isArray(parsed) && parsed.length > 0) {
            console.log(
              "[PuppyLove] Found existing late hearts in storage:",
              parsed,
            );
            setLateHearts(parsed);
            setShowLateMatchPrompt(true);
            setPendingSuccess(true);
          }
        } catch (parseErr) {
          console.error("Error parsing stored late hearts:", parseErr);
        }
      }
    }
  }, []);

  const verifyAndProceed = async (pwd: string) => {
    try {
      // Verify password with backend
      const verifyRes = await fetch(
        `${PUPPYLOVE_POINT}/api/puppylove/users/verify-password`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ password: pwd }),
        },
      );

      if (!verifyRes.ok) {
        return { success: false, reason: "verification_failed" };
      }

      const verifyData = await verifyRes.json();

      // Check if user is registered (dirty == true)
      if (!verifyData.is_dirty) {
        // User is unregistered - show registration flow
        setShowRegistration(true);
        setPassword("");
        return { success: false, reason: "not_registered" };
      }

      initPuppyLoveWorker();

      // Fetch encrypted private key from backend
      const res = await fetch(`${PUPPYLOVE_POINT}/api/puppylove/users/data`, {
        method: "GET",
        credentials: "include",
      });

      if (!res.ok) {
        return false;
      }

      const userData = await res.json();
      const encryptedPrivKey = userData.privK;

      if (!encryptedPrivKey) {
        return false;
      }

      // Decrypt private key with password
      const privateKey = await decryptPrivateKey(encryptedPrivKey, pwd);

      if (!privateKey) {
        return false;
      }

      if (typeof window !== "undefined") {
        // Store the private key and public key in sessionStorage
        sessionStorage.setItem(
          "data",
          JSON.stringify({ k1: privateKey, k2: userData.pubKey || "" }),
        );
        // Store decrypted key in state
        setPrivateKey(privateKey);
      }

      // Fetch and claim hearts in the background
      try {
        console.log("[PuppyLove] Fetching and claiming hearts...");
        const claimedHearts = await fetchAndClaimHearts(privateKey);
        console.log("[PuppyLove] Hearts claimed:", claimedHearts);

        // Store claimed hearts and late hearts for later use
        if (claimedHearts) {
          if (typeof window !== "undefined") {
            // Store normal claims
            if (claimedHearts.claims) {
              sessionStorage.setItem(
                "puppylove_claims",
                JSON.stringify(claimedHearts.claims),
              );
            }
            // Store late claims if any - show prompt to user
            if (
              claimedHearts.claims_late &&
              claimedHearts.claims_late.length > 0
            ) {
              console.log(
                "[PuppyLove] Late hearts detected:",
                claimedHearts.claims_late,
              );
              sessionStorage.setItem(
                "puppylove_claims_late",
                JSON.stringify(claimedHearts.claims_late),
              );
              // Show late match prompt instead of immediately calling onSuccess
              setLateHearts(claimedHearts.claims_late);
              setShowLateMatchPrompt(true);
              setPendingSuccess(true);
              return true; // Return success but don't call onSuccess yet
            }
          }
        }
      } catch (heartErr) {
        console.warn(
          "[PuppyLove] Error fetching hearts (non-critical):",
          heartErr,
        );
      }

      onSuccess();
      return true;
    } catch (err) {
      console.error("Password verification error:", err);
      return false;
    }
  };

  const checkPassword = async (pwd?: string) => {
    const passwordToUse = pwd || password;
    if (isSubmitting) return;
    if (!passwordToUse) {
      toast("Please enter a password");
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await verifyAndProceed(passwordToUse);

      // Check if result indicates registration needed
      if (
        result &&
        typeof result === "object" &&
        result.reason === "not_registered"
      ) {
        // Registration flow will be shown via showRegistration state
        return;
      }

      if (!result) {
        toast("Wrong password or unable to verify. Please try again.");
        setPassword("");
      }
    } catch (err) {
      console.error("Password check error:", err);
      toast("Unable to verify password. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler for late match prompt close
  const handleLateMatchPromptClose = () => {
    setShowLateMatchPrompt(false);
    setLateHearts([]);
    // If we were waiting to call onSuccess, do it now
    if (pendingSuccess) {
      setPendingSuccess(false);
      onSuccess();
    }
  };

  // Handler for late match prompt complete (after processing late hearts)
  const handleLateMatchComplete = () => {
    // Late hearts have been processed successfully
    console.log("[PuppyLove] Late hearts processed successfully");
  };

  // Show late match prompt if there are late hearts
  if (showLateMatchPrompt && lateHearts.length > 0) {
    return (
      <LateMatchPrompt
        isOpen={showLateMatchPrompt}
        onClose={handleLateMatchPromptClose}
        lateHearts={lateHearts}
        onComplete={handleLateMatchComplete}
      />
    );
  }

  if (showRegistration) {
    return (
      <PuppyLoveRegistrationCard
        onSuccess={onSuccess}
        onCancel={() => setShowRegistration(false)}
      />
    );
  }

  // Recovery options flow
  if (recoveryStep === "options") {
    return (
      <PasswordRecoveryOptionsCard
        onChooseRecoveryCode={() => setRecoveryStep("code")}
        onChooseNewPassword={() => {
          // Redirect directly to forgot-password page
          window.location.href =
            process.env.NEXT_PUBLIC_AUTH_DOMAIN + "/forgot-password";
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
          // Trigger login with recovered password
          checkPassword(recoveredPassword);
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
          <CardTitle className="text-2xl text-center">Puppy Love</CardTitle>
          {isInitializing || privateKey ? (
            <></>
          ) : (
            <CardDescription className="text-center">
              Enter your profile password to continue
            </CardDescription>
          )}
        </CardHeader>
        {/*
        // Show loading while initializing
        // OR
        // If private key is in memory, skip password prompt and auto-login
        */}
        {isInitializing || privateKey ? (
          <CardContent className="flex justify-center py-8">
            <p className="text-muted-foreground">
              {isInitializing
                ? "Loading..."
                : privateKey
                  ? "Logging in.."
                  : "Please wait, we are processing"}
            </p>
          </CardContent>
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
                <input
                  type="password"
                  name="password"
                  autoFocus
                  className="w-full px-4 py-2 border rounded-md"
                  placeholder="Enter your profile password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && checkPassword()}
                  disabled={isSubmitting}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={onCancel}
                >
                  Cancel
                </Button>

                <Button
                  onClick={() => checkPassword()}
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  {isSubmitting ? "Verifying..." : "Submit"}
                </Button>
              </div>

              <Button
                variant="secondary"
                className="w-full"
                onClick={() => setShowRegistration(true)}
              >
                Register for Puppy Love
              </Button>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
};
