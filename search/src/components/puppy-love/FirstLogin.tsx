"use client";

import { useState } from "react";
import { Heart, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { generateKeys, encryptPrivateKey, firstLogin } from "@/lib/workers/puppyLoveWorkerClient";

interface PuppyLoveFirstLoginProps {
  rollNo: string;
  onSuccess: (encryptedPrivateKey: string, publicKey: string) => void;
  onCancel?: () => void;
}

export default function PuppyLoveFirstLogin({ rollNo, onSuccess, onCancel }: PuppyLoveFirstLoginProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleFirstLogin = async () => {
    setError("");

    if (!password.trim()) {
      setError("Enter password");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }
    if (password.length < 6) {
      setError("Password must be 6+ characters");
      return;
    }

    setLoading(true);

    try {
      const keys = await generateKeys();
      const encryptedPrivKey = await encryptPrivateKey(keys.privKey, password);
      
      // Use empty authCode since we're not using OTP for now
      await firstLogin(rollNo, password, "", keys.pubKey, encryptedPrivKey, "");

      // if (typeof window !== "undefined") {
      //   sessionStorage.setItem("puppylove_encrypted_private_key", encryptedPrivKey);
      //   sessionStorage.setItem("puppylove_public_key", keys.pubKey);
      // }

      onSuccess(encryptedPrivKey, keys.pubKey);
    } catch (err) {
      console.error("First login error:", err);
      setError((err as Error).message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

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
          <p className="text-stone-500 text-sm font-medium">Create Your Password</p>
        </div>

        {error && (
          <div className="w-full mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-xs text-red-800">{error}</p>
          </div>
        )}
        
        <div className="w-full space-y-3">
          <input 
            type="password" 
            className="w-full px-4 py-3 bg-stone-50 border-2 border-stone-100 rounded-xl text-center placeholder-stone-300 focus:bg-white focus:border-rose-200 focus:outline-none transition-all duration-300"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            onKeyDown={(e) => e.key === 'Enter' && handleFirstLogin()}
          />

          <input 
            type="password" 
            className="w-full px-4 py-3 bg-stone-50 border-2 border-stone-100 rounded-xl text-center placeholder-stone-300 focus:bg-white focus:border-rose-200 focus:outline-none transition-all duration-300"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={loading}
            onKeyDown={(e) => e.key === 'Enter' && handleFirstLogin()}
          />

          <Button 
            className="w-full py-6 bg-stone-900 hover:bg-rose-600 text-white rounded-xl font-bold transition-all active:scale-95"
            onClick={handleFirstLogin}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Setting up...
              </>
            ) : (
              "Complete Setup"
            )}
          </Button>

          {onCancel && (
            <button 
              className="text-xs text-stone-400 hover:text-stone-600 transition-colors font-medium"
              onClick={onCancel}
            >
              Cancel
            </button>
          )}
        </div>
      </Card>
    </div>
  );
}
