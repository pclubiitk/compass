"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { hasAdminRole } from "../lib/admin";

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_AUTH_URL}/api/profile`, {
          credentials: "include",
        });
        
        if (res.ok) {
          const data = await res.json();
          if (hasAdminRole(data)) {
            setIsAuthorized(true);
          } else {
            toast.error("You are not authorized to view this page.");
            router.push("/");
          }
        } else {
          toast.error("Please log in to continue.");
          router.push("/login");
        }
      } catch (err) {
        toast.error("Failed to verify authorization.");
        router.push("/");
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAdmin();
  }, [router]);

  if (isLoading) {
    return <div className="flex h-screen w-full items-center justify-center">Loading...</div>;
  }

  if (!isAuthorized) {
    return null;
  }

  return <>{children}</>;
}
