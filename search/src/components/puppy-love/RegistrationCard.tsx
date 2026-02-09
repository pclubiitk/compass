import { useState } from "react";
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

interface PuppyLoveRegistrationCardProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export const PuppyLoveRegistrationCard = ({
  onSuccess,
  onCancel,
}: PuppyLoveRegistrationCardProps) => {
  const [password, setPassword] = useState("");
  const [agreedToTnC, setAgreedToTnC] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleRegister = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      // Verify password with backend to confirm registration eligibility
      const verifyRes = await fetch(
        `${PUPPYLOVE_POINT}/api/puppylove/users/verify-password`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ password }),
        },
      );
      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) {
        toast(verifyData.error || "Invalid password");
        return;
      }
      let pubKey: string = "";
      let privKey: string = "";
      // Confirm user is still unregistered
      if (!verifyData.is_dirty) {
        initPuppyLoveWorker();
        // Initialize worker and generate RSA keys
        const keys = await generateKeys();
        pubKey = keys.pubKey;
        privKey = keys.privKey;
        // Encrypt private key with user's password
        const encryptedPrivKey = await encryptPrivateKey(privKey, password);
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
        if (!registerRes.ok) {
          const errorData = await registerRes.json();
          toast(errorData.error || "Registration failed. Please try again.");
          setIsSubmitting(false);
          return;
        }
      } else {
        toast("You are already registered for PuppyLove!");
        pubKey = verifyData.pubKey;
        privKey = await decryptPrivateKey(verifyData.privKey, password);
      }
      // Success - profile created with dirty: true
      // Store keys in sessionStorage for immediate use
      if (typeof window !== "undefined") {
        sessionStorage.setItem(
          "data",
          JSON.stringify({ k1: privKey, k2: pubKey }),
        );
      }

      // TODO: later shift this public keys fetching into the sent heart feature.
      // Fetch and cache all public keys
      try {
        const keysRes = await fetch(
          `${PUPPYLOVE_POINT}/api/puppylove/users/fetchPublicKeys`,
          {
            method: "GET",
            credentials: "include",
          },
        );
        if (keysRes.ok) {
          const publicKeys = await keysRes.json();
          if (typeof window !== "undefined") {
            localStorage.setItem(
              "puppylove_public_keys",
              JSON.stringify(publicKeys),
            );
          }
        }
        onSuccess();
      } catch (err) {
        console.warn("Could not fetch public keys after registration:", err);
      }
    } catch (err) {
      console.error("Registration error:", err);
      toast("Unable to complete registration. Please try again.");
    } finally {
      setPassword("");
      setIsSubmitting(false);
    }
  };

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
            Register for Puppy Love
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
                  <p className="font-medium">Generating encryption keys</p>
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
                    onClick={() => router.push(FORGOT_POINT)}
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
                  onKeyDown={(e) => e.key === "Enter" && handleRegister()}
                  disabled={isSubmitting}
                />
              </div>

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
                  onClick={handleRegister}
                  disabled={isSubmitting || !agreedToTnC || !password.length}
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
