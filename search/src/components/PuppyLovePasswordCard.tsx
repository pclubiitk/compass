import { useState } from "react";
import { Heart } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { initPuppyLoveWorker, verifyPuppyLovePassword, decryptPrivateKey } from "@/lib/workers/puppyLoveWorkerClient";
import { PUPPYLOVE_POINT } from "@/lib/constant";
// import { useGContext } from "./ContextProvider";
// import PuppyLoveFirstLogin from "./PuppyLoveFirstLogin";

interface PuppyLovePasswordCardProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export const PuppyLovePasswordCard = ({ onSuccess, onCancel }: PuppyLovePasswordCardProps) => {
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  // const [isCheckingProfile, setIsCheckingProfile] = useState(true);
  // const [needsFirstLogin, setNeedsFirstLogin] = useState(false);
  // const [userRollNo, setUserRollNo] = useState("");
  // const { currentUserProfile } = useGContext();

  // useEffect(() => {
  //   checkPuppyLoveProfile();
  // }, []);

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

  const checkPassword = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      initPuppyLoveWorker();
      
      // Verify password
      const isValid = await verifyPuppyLovePassword(password);
      if (!isValid) {
        alert("Wrong password!");
        setIsSubmitting(false);
        return;
      }

      // Fetch encrypted private key from backend
      const res = await fetch(`${PUPPYLOVE_POINT}/api/puppylove/users/data`, {
        method: "GET",
        credentials: "include",
      });

      if (!res.ok) {
        alert("Failed to fetch user data");
        setIsSubmitting(false);
        return;
      }

      const userData = await res.json();
      const encryptedPrivKey = userData.privK;

      if (!encryptedPrivKey) {
        alert("No private key found. Please contact support.");
        setIsSubmitting(false);
        return;
      }

      // Decrypt private key with password
      const privateKey = await decryptPrivateKey(encryptedPrivKey, password);
      
      if (!privateKey) {
        alert("Failed to decrypt private key. Wrong password?");
        setIsSubmitting(false);
        return;
      }

      
      if (typeof window !== "undefined") {
        sessionStorage.setItem("puppylove_private_key", privateKey);
        sessionStorage.setItem("puppylove_encrypted_private_key", encryptedPrivKey);
      }

      onSuccess();
      setPassword("");
    } catch (err) {
      console.error("Password verification error:", err);
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

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in duration-300 p-4">
      <Card className="relative w-full max-w-[20rem] overflow-hidden border-none bg-white p-8 shadow-2xl rounded-[2.5rem] text-center flex flex-col items-center transform animate-in zoom-in-95 duration-300">
        
        <div className="absolute -top-12 -left-12 h-32 w-32 bg-rose-50 rounded-full blur-2xl" />

        <div className="relative mb-6">
          <div className="h-24 w-24 rounded-3xl overflow-hidden border-4 border-white shadow-lg rotate-3 bg-stone-50">
            <Image 
              src="/icons/puppyLoveLogo.png" 
              alt="Puppy" 
              fill
              className="object-contain p-3"
            />
          </div>
          <div className="absolute -bottom-1 -right-1 bg-rose-500 p-2 rounded-full shadow-md border-2 border-white">
            <Heart className="h-3.5 w-3.5 text-white fill-white" />
          </div>
        </div>

        <div className="space-y-1 mb-6">
          <p className="text-[0.7rem] text-rose-400 font-bold uppercase tracking-[0.2em]">Puppy Love</p>
          <p className="text-stone-500 text-sm font-medium">Enter your password</p>
        </div>
        
        <div className="w-full space-y-3">
          <input 
            type="password" 
            autoFocus
            className="w-full px-4 py-3 bg-stone-50 border-2 border-stone-100 rounded-xl text-center text-rose-600 placeholder-stone-300 focus:bg-white focus:border-rose-200 focus:outline-none transition-all duration-300 text-lg tracking-[0.4em]"
            placeholder="••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && checkPassword()}
            disabled={isSubmitting}
          />

          <Button 
            className="w-full py-6 bg-stone-900 hover:bg-rose-600 text-white rounded-xl font-bold transition-all active:scale-95"
            onClick={checkPassword}
            disabled={isSubmitting}
          >
           {isSubmitting ? "Verifying..." : "Submit"}
          </Button>
          <button 
            className="text-xs text-stone-400 hover:text-stone-600 transition-colors font-medium"
            onClick={onCancel}
          >
            Cancel
          </button>
        </div>
      </Card>
    </div>
  );
};
