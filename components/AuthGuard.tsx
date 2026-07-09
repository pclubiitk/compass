"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useGContext } from "@/components/ContextProvider";

/**
 * Wraps any page that requires authentication.
 *
 * States of isLoggedIn from ContextProvider:
 *   null  → still fetching /api/auth/me (isGlobalLoading is true)
 *   false → confirmed not logged in → redirect to login
 *   true  → confirmed logged in → render children
 *
 * We wait for isGlobalLoading to be false before redirecting so we
 * never redirect on a page refresh before the auth check completes.
 */
export function AuthGuard({
  children,
  callbackUrl,
}: {
  children: React.ReactNode;
  callbackUrl: string;
}) {
  const { isLoggedIn, isGlobalLoading } = useGContext();
  const router = useRouter();

  useEffect(() => {
    if (!isGlobalLoading && isLoggedIn === false) {
      router.push(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
    }
  }, [isLoggedIn, isGlobalLoading, router, callbackUrl]);

  // Auth check still in flight — render nothing, GlobalLoader handles the spinner
  if (isGlobalLoading || isLoggedIn !== true) return null;

  return <>{children}</>;
}
