"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

export default function ChangeRoleDialog({
  open,
  onOpenChange,
  isSuperAdmin,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isSuperAdmin?: boolean;
}) {
  const BACKEND_URL = process.env.NEXT_PUBLIC_AUTH_URL;
  const BACKEND_URL_M = process.env.NEXT_PUBLIC_MAPS_URL;

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [rollNo, setRollNo] = useState("");
  const [loading, setLoading] = useState(false);

  // Fetch user details by email with debounce
  useEffect(() => {
    if (!email || !email.includes("@")) {
      setName("");
      setRollNo("");
      return;
    }

    const id = setTimeout(async () => {
      try {
        setLoading(true);
        const res = await fetch(
          `${BACKEND_URL}/api/user?email=${encodeURIComponent(email)}`,
          { credentials: "include" },
        );
        if (!res.ok) {
          setName("");
          setRollNo("");
          return;
        }
        const data = await res.json();
        // Expecting { name, rollNo } or similar shape from backend
        setName(data.name || data.fullName || "");
        setRollNo(data.rollNo || data.roll || "");
      } catch (err) {
        setName("");
        setRollNo("");
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => clearTimeout(id);
  }, [email]);

  const makeAdmin = async () => {
    if (!email) return toast.error("Enter an email");
    try {
      setLoading(true);
      const res = await fetch(`${BACKEND_URL_M}/api/maps/make-admin`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      let data = {};

      try {
        const text = await res.text();
        if (text.trim()) {
          data = JSON.parse(text);
        }
      } catch (e) {
        console.warn("Response is not valid JSON");
      }
      if (res.ok) {
        toast.success("User promoted to admin");
        setEmail("");
        setName("");
        setRollNo("");
        onOpenChange(false);
        window.dispatchEvent(new Event("adminsUpdated"));
      } else {
        const errorMsg = data?.error || "Failed to make admin";
        console.error("Admin promotion error:", data);
        toast.error(errorMsg);
      }      
    } catch (err) {
      console.error("Request error:", err);
      toast.error("Request failed: " + (err instanceof Error ? err.message : "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Make a new admin</AlertDialogTitle>
          <AlertDialogDescription>
            {isSuperAdmin 
              ? "Enter the email of the user to promote to admin role."
              : "Only super admins can promote users to admin role."
            }
          </AlertDialogDescription>
        </AlertDialogHeader>

        {!isSuperAdmin ? (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-sm text-red-800 font-medium">
              You don't have permission to promote users to admin.
            </p>
            <p className="text-xs text-red-700 mt-1">
              Only super admins can perform this action.
            </p>
          </div>
        ) : (
          <div className="grid gap-2">
            <div className="grid gap-1">
              <Label>Email</Label>
              <Input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@domain.com"
                autoComplete="email"
              />
            </div>

            <div className="bg-muted/50 border border-dashed rounded-md p-3 space-y-2">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Name</p>
                <p className="text-sm font-semibold">{loading ? "Loading..." : name || "-"}</p>
              </div>

              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Roll No.</p>
                <p className="text-sm font-semibold">{rollNo || "-"}</p>
              </div>
            </div>
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => onOpenChange(false)}>
            Cancel
          </AlertDialogCancel>
          {isSuperAdmin && (
            <AlertDialogAction onClick={makeAdmin} disabled={loading || !email}>
              {loading ? "Working..." : "Make Admin"}
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}