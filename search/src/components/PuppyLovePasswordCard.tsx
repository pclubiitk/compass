import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { initPuppyLoveWorker, verifyPuppyLovePassword, decryptPrivateKey, fetchAndClaimHearts } from "@/lib/workers/puppyLoveWorkerClient";
import { PUPPYLOVE_POINT } from "@/lib/constant";
import { PuppyLoveRegistrationCard } from "./PuppyLoveRegistrationCard";
import { PasswordRecoveryOptionsCard } from "./PasswordRecoveryOptionsCard";
import { RecoveryCodeVerificationCard } from "./RecoveryCodeVerificationCard";

interface PuppyLovePasswordCardProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export const PuppyLovePasswordCard = ({ onSuccess, onCancel }: PuppyLovePasswordCardProps) => {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRegistration, setShowRegistration] = useState(false);
  const [recoveryStep, setRecoveryStep] = useState<"options" | "code" | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [privateKey, setPrivateKey] = useState<string | null>(null);

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
            console.log("[PuppyLove] Fetching and claiming hearts with stored key...");
            const claimedHearts = await fetchAndClaimHearts(privateKey);
            console.log("[PuppyLove] Hearts claimed:", claimedHearts);
            
            if (claimedHearts) {
              if (typeof window !== "undefined") {
                if (claimedHearts.claims) {
                  sessionStorage.setItem("puppylove_claims", JSON.stringify(claimedHearts.claims));
                }
                if (claimedHearts.claims_late && claimedHearts.claims_late.length > 0) {
                  console.log("[PuppyLove] Late hearts detected:", claimedHearts.claims_late);
                  sessionStorage.setItem("puppylove_claims_late", JSON.stringify(claimedHearts.claims_late));
                }
              }
            }
          } catch (heartErr) {
            console.warn("[PuppyLove] Error fetching hearts (non-critical):", heartErr);
          }
          onSuccess();
          return;
        }

        // Check if keys are stored in sessionStorage
        if (typeof window !== "undefined") {
          const storedData = sessionStorage.getItem('data');
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

  // const checkPuppyLoveProfile = async () => {
  //   try {
  //     const res = await fetch(`${PUPPYLOVE_POINT}/api/puppylove/users/data`, {
  //       method: "GET",
  //       credentials: "include",
  //     });

  //     if (res.status === 404 || res.status === 401) {
  //       // User doesn't have PuppyLove profile yet
  //       console.log("User needs first-time login");
  //       setNeedsFirstLogin(true);
  //       setUserRollNo(currentUserProfile?.rollNo || "");
  //     } else if (res.ok) {
  //       // User has profile, proceed with password verification
  //       console.log("User has existing profile");
  //       setNeedsFirstLogin(false);
  //     } else {
  //       // Log the actual error for debugging
  //       const errorData = await res.text();
  //       console.warn(`Profile check returned status ${res.status}:`, errorData);
  //       // Assume first login needed on any error
  //       setNeedsFirstLogin(true);
  //       setUserRollNo(currentUserProfile?.rollNo || "");
  //     }
  //   } catch (err) {
  //     console.error("Error checking PuppyLove profile:", err);
  //     // Assume first login needed if we can't determine
  //     setNeedsFirstLogin(true);
  //     setUserRollNo(currentUserProfile?.rollNo || "");
  //   } finally {
  //     setIsCheckingProfile(false);
  //   }
  // };

  // const handleFirstLoginSuccess = (encryptedPrivateKey: string, publicKey: string) => {
  //   setNeedsFirstLogin(false);
  //   onSuccess();
  // };

  const verifyAndProceed = async (pwd: string) => {
    try {
      // Verify password with backend
      const verifyRes = await fetch(`${PUPPYLOVE_POINT}/api/puppylove/users/verify-password`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password: pwd }),
      });

      if (!verifyRes.ok) {
        return { success: false, reason: 'verification_failed' };
      }

      const verifyData = await verifyRes.json();
      
      // Check if user is registered (dirty == true)
      if (!verifyData.is_dirty) {
        // User is unregistered - show registration flow
        setShowRegistration(true);
        setPassword("");
        return { success: false, reason: 'not_registered' };
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
          'data',
          JSON.stringify({ k1: privateKey, k2: userData.pubKey || "" })
        );
        // Also store encrypted key for reference
        sessionStorage.setItem("puppylove_encrypted_private_key", encryptedPrivKey);
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
              sessionStorage.setItem("puppylove_claims", JSON.stringify(claimedHearts.claims));
            }
            // Store late claims if any
            if (claimedHearts.claims_late && claimedHearts.claims_late.length > 0) {
              console.log("[PuppyLove] Late hearts detected:", claimedHearts.claims_late);
              sessionStorage.setItem("puppylove_claims_late", JSON.stringify(claimedHearts.claims_late));
            }
          }
        }
      } catch (heartErr) {
        console.warn("[PuppyLove] Error fetching hearts (non-critical):", heartErr);
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
      alert("Please enter a password");
      return;
    }
    
    setIsSubmitting(true);
    try {
      const result = await verifyAndProceed(passwordToUse);
      
      // Check if result indicates registration needed
      if (result && typeof result === 'object' && result.reason === 'not_registered') {
        // Registration flow will be shown via showRegistration state
        return;
      }
      
      if (!result) {
        alert("Wrong password or unable to verify. Please try again.");
        setPassword("");
      }
    } catch (err) {
      console.error("Password check error:", err);
      alert("Unable to verify password. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // if (isCheckingProfile) {
  //   return (
  //     <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md">
  //       <Card className="relative w-full max-w-[20rem] overflow-hidden border-none bg-white p-8 shadow-2xl rounded-[2.5rem] text-center flex flex-col items-center">
  //         <p className="text-stone-500">Checking profile...</p>
  //       </Card>
  //     </div>
  //   );
  // }

  // if (needsFirstLogin) {
  //   return <PuppyLoveFirstLogin rollNo={userRollNo} onSuccess={handleFirstLoginSuccess} />;
  // }

  if (showRegistration) {
    return <PuppyLoveRegistrationCard onSuccess={onSuccess} onCancel={() => setShowRegistration(false)} />;
  }

  // Recovery options flow
  if (recoveryStep === "options") {
    return (
      <PasswordRecoveryOptionsCard 
        onChooseRecoveryCode={() => setRecoveryStep("code")}
        onChooseNewPassword={() => {
          // Redirect directly to forgot-password page
          window.location.href = process.env.NEXT_PUBLIC_FORGOT_PASSWORD_URL || "http://localhost:3001/forgot-password";
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

  // Show loading while initializing
  if (isInitializing) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
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
          </CardHeader>
          <CardContent className="flex justify-center py-8">
            <p className="text-muted-foreground">Loading...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If private key is in memory, skip password prompt and auto-login
  if (privateKey) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
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
          </CardHeader>
          <CardContent className="flex justify-center py-8">
            <p className="text-muted-foreground">Logging in...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
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
          <CardDescription className="text-center">Enter your password to continue</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <input 
                type="password" 
                autoFocus
                className="w-full px-4 py-2 border rounded-md"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && checkPassword()}
                disabled={isSubmitting}
              />
            </div>

            <Button 
              onClick={() => checkPassword()}
              disabled={isSubmitting}
              className="w-full"
            >
             {isSubmitting ? "Verifying..." : "Submit"}
            </Button>

            <div className="flex gap-2">
              <Button 
                variant="outline"
                className="flex-1"
                onClick={onCancel}
              >
                Cancel
              </Button>
              <Button 
                variant="outline"
                className="flex-1"
                onClick={() => setRecoveryStep("options")}
              >
                Forgot Password?
              </Button>
            </div>

            <Button 
              variant="outline"
              className="w-full"
              onClick={() => setShowRegistration(true)}
            >
              Register on Puppy Love
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
