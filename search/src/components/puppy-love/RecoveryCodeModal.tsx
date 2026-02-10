import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { PUPPYLOVE_POINT } from "@/lib/constant";
import { Copy, Download, Key, Eye, EyeOff } from "lucide-react";
import { Encryption_AES } from "@/lib/workers/Encryption";

interface RecoveryCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Generate recovery code: xxxxxxxx-xxxxxxxx (16 chars)
const generateCode = (): string => {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  const values = new Uint8Array(16);
  crypto.getRandomValues(values);
  const code = Array.from(values, (v) => chars[v % chars.length]).join("");
  return `${code.slice(0, 8)}-${code.slice(8, 16)}`;
};

export const RecoveryCodeModal = ({ isOpen, onClose }: RecoveryCodeModalProps) => {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [code, setCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success("Copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const content = `PUPPY LOVE RECOVERY CODE\n========================\n${code}\n\nKeep this safe! Generated: ${new Date().toLocaleString()}`;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([content], { type: "text/plain" }));
    a.download = "puppy-love-recovery.txt";
    a.click();
    toast.success("Downloaded!");
  };

  const handleSave = async () => {
    if (!password.trim() || !code) {
      toast.error("Please fill all fields");
      return;
    }

    setIsSubmitting(true);
    try {
      // Encrypt password with recovery code using AES
      const encrypted = await Encryption_AES(password, code);
      
      const res = await fetch(`${PUPPYLOVE_POINT}/api/puppylove/users/addRecovery`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passHash: password, code: encrypted }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to save");
      }

      toast.success("Recovery code saved!");
      handleClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to save");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setPassword("");
    setCode("");
    setCopied(false);
    setShowPassword(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-rose-500">
            <Key className="h-5 w-5" />
            Setup Recovery Code
          </DialogTitle>
          <DialogDescription>
            Save this code to recover your password later.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Recovery Code */}
          <div className="space-y-2">
            <Label>Recovery Code</Label>
            {code ? (
              <>
                <div className="rounded-lg bg-muted p-3 font-mono text-sm text-center select-all">
                  {code}
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleCopy} variant="outline" size="sm" className="flex-1">
                    <Copy className="h-3 w-3 mr-1" />
                    {copied ? "Copied!" : "Copy"}
                  </Button>
                  <Button onClick={handleDownload} variant="outline" size="sm" className="flex-1">
                    <Download className="h-3 w-3 mr-1" />
                    Download
                  </Button>
                </div>
              </>
            ) : (
              <Button onClick={() => setCode(generateCode())} variant="outline" className="w-full">
                Generate Code
              </Button>
            )}
          </div>

          {/* Password */}
          {code && (
            <div className="space-y-2">
              <Label>Your Password</Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isSubmitting}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-amber-600">⚠️ Save the code before continuing!</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClose} className="flex-1">
              Cancel
            </Button>
            {code && (
              <Button
                onClick={handleSave}
                disabled={isSubmitting || !password.trim()}
                className="flex-1 bg-rose-500 hover:bg-rose-600"
              >
                {isSubmitting ? "Saving..." : "Save"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
