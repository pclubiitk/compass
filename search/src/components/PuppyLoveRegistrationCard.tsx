import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import { PUPPYLOVE_POINT } from "@/lib/constant";
import { generateKeys, initPuppyLoveWorker, encryptPrivateKey } from "@/lib/workers/puppyLoveWorkerClient";

interface PuppyLoveRegistrationCardProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export const PuppyLoveRegistrationCard = ({ onSuccess, onCancel }: PuppyLoveRegistrationCardProps) => {
  const [step, setStep] = useState<"welcome" | "password" | "tnc">("welcome");
  const [password, setPassword] = useState("");
  const [agreedToTnC, setAgreedToTnC] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleNext = () => {
    if (step === "welcome") {
      setStep("password");
    } else if (step === "password") {
      if (!password) {
        alert("Please enter your password");
        return;
      }
      setStep("tnc");
    }
  };

  const handleRegister = async () => {
    if (!agreedToTnC) {
      alert("Please agree to Terms & Conditions to proceed");
      return;
    }

    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      // Verify password with backend to confirm registration eligibility
      const verifyRes = await fetch(`${PUPPYLOVE_POINT}/api/puppylove/users/verify-password`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });

      if (!verifyRes.ok) {
        alert("Invalid password");
        setIsSubmitting(false);
        return;
      }

      const verifyData = await verifyRes.json();

      // Confirm user is still unregistered
      if (verifyData.is_dirty) {
        alert("You are already registered for PuppyLove!");
        setIsSubmitting(false);
        return;
      }

      // Initialize worker and generate RSA keys
      initPuppyLoveWorker();
      const { pubKey, privKey } = await generateKeys();
      
      // Encrypt private key with user's password
      const encryptedPrivKey = await encryptPrivateKey(privKey, password);
      
      // Register user with backend
      const registerRes = await fetch(`${PUPPYLOVE_POINT}/api/puppylove/users/login/first`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          roll: verifyData.roll_no || "unknown",
          authCode: "DIRECT_LOGIN",
          passHash: password,
          pubKey: pubKey,
          privKey: encryptedPrivKey,
          data: "{}",
        }),
      });

      if (!registerRes.ok) {
        const errorData = await registerRes.json();
        alert(errorData.error || "Registration failed. Please try again.");
        setIsSubmitting(false);
        return;
      }

      // Success - profile created with dirty: true
      onSuccess();
      setPassword("");
    } catch (err) {
      console.error("Registration error:", err);
      alert("Unable to complete registration. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
      <Card className="w-full max-w-md">
        {step === "welcome" && (
          <>
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
              <CardTitle className="text-2xl text-center">Welcome to Puppy Love</CardTitle>
              <CardDescription className="text-center">Find your perfect match anonymously</CardDescription>
            </CardHeader>

            <CardContent>
              <div className="grid gap-4">
                <div className="space-y-3 text-sm text-muted-foreground">
                  <p>• 100% Anonymous matching</p>
                  <p>• Encrypted private keys</p>
                  <p>• Secure heart exchange</p>
                </div>

                <Button 
                  className="w-full"
                  onClick={handleNext}
                >
                  Get Started
                </Button>
                <Button 
                  variant="outline"
                  className="w-full"
                  onClick={onCancel}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </>
        )}

        {step === "password" && (
          <>
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
              <CardTitle className="text-2xl text-center">Enter Password</CardTitle>
              <CardDescription className="text-center">Use your Compass password</CardDescription>
            </CardHeader>

            <CardContent>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="password">Password</Label>
                  <Input 
                    id="password"
                    type="password" 
                    autoFocus
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleNext()}
                    disabled={isSubmitting}
                  />
                  <p className="text-xs text-muted-foreground">Enter the same password you use for Compass</p>
                </div>

                <Button 
                  className="w-full"
                  onClick={handleNext}
                  disabled={isSubmitting}
                >
                  Next
                </Button>
                <Button 
                  variant="outline"
                  className="w-full"
                  onClick={() => setStep("welcome")}
                >
                  Back
                </Button>
              </div>
            </CardContent>
          </>
        )}

        {step === "tnc" && (
          <>
            {isSubmitting ? (
              <>
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
                  <CardTitle className="text-2xl text-center">Processing</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center justify-center py-8 gap-4">
                    <Loader2 className="h-12 w-12 text-rose-500 animate-spin" />
                    <div className="text-center">
                      <p className="font-medium">Generating encryption keys</p>
                      <p className="text-xs text-muted-foreground mt-1">This may take a moment...</p>
                    </div>
                  </div>
                </CardContent>
              </>
            ) : (
              <>
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
                  <CardTitle className="text-2xl text-center">Terms & Conditions</CardTitle>
                  <CardDescription className="text-center">Please read carefully</CardDescription>
                </CardHeader>

                <CardContent>
                  <div className="grid gap-4">
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

                    <label className="flex items-center gap-3 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={agreedToTnC}
                        onChange={(e) => setAgreedToTnC(e.target.checked)}
                        className="w-4 h-4 rounded"
                      />
                      <span className="text-sm">I agree to the Terms & Conditions</span>
                    </label>

                    <Button 
                      className="w-full"
                      onClick={handleRegister}
                      disabled={!agreedToTnC}
                    >
                      Complete Registration
                    </Button>
                    <Button 
                      variant="outline"
                      className="w-full"
                      onClick={() => setStep("password")}
                    >
                      Back
                    </Button>
                  </div>
                </CardContent>
              </>
            )}
          </>
        )}
      </Card>
    </div>
  );
};
