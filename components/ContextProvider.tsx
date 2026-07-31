"use client";
// TODO: Lets start with basic context management for login state
// TODO: can later use libraries like, redux, zustand, or more
import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

interface GlobalContextType {
  isLoggedIn: boolean | null;
  setLoggedIn: (isLoggedIn: boolean | null) => void;
  isGlobalLoading: boolean;
  setGlobalLoading: (isGlobalLoading: boolean) => void;
  isPLseason: boolean;
  isAdmin: boolean;
  setAdmin: (isAdmin: boolean) => void;
}

const GlobalContext = createContext<GlobalContextType>({
  isLoggedIn: null,
  setLoggedIn: () => {},
  isGlobalLoading: false,
  setGlobalLoading: () => {},
  isPLseason: false,
  isAdmin: false,
  setAdmin: () => {},
});

export function GlobalContextProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setLoggedIn] = useState<boolean | null>(null);
  const [isGlobalLoading, setGlobalLoading] = useState<boolean>(true);
  const [isPLseason, setPLseason] = useState<boolean>(true);
  const [isAdmin, setAdmin] = useState<boolean>(false);

  useEffect(() => {
    // Patch fetch globally to include CSRF token on state-changing requests
    if (typeof window !== "undefined" && !(window as any).__fetchPatched) {
      const originalFetch = window.fetch;
      window.fetch = async (input, init) => {
        const method = (init?.method || "GET").toUpperCase();
        if (["POST", "PUT", "DELETE", "PATCH"].includes(method)) {
          const csrfToken = document.cookie
            .split("; ")
            .find((row) => row.startsWith("csrf_token="))
            ?.split("=")[1] || "";
          if (csrfToken) {
            init = {
              ...init,
              headers: {
                ...init?.headers,
                "X-CSRF-Token": csrfToken,
              },
            };
          }
        }
        return originalFetch(input, init);
      };
      (window as any).__fetchPatched = true;
    }

    async function verifyingLogin() {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_AUTH_URL}/api/auth/me`,
          {
            method: "GET",
            credentials: "include",
          },
        );
        if (response.ok) {
          setLoggedIn(true);
          if (response.status === 202) {
            setPLseason(true);
          } else {
            setPLseason(false);
          }
          const data = await response.json();
          if (data.role && data.role >= 100) {
            setAdmin(true);
          } else {
            setAdmin(false);
          }
        } else {
          setLoggedIn(false);
        }
      } catch {
        setGlobalLoading(false);
      } finally {
        setGlobalLoading(false);
      }
    }
    verifyingLogin();
  }, []);

  const value = {
    isLoggedIn,
    setLoggedIn,
    isGlobalLoading,
    setGlobalLoading,
    isPLseason,
    isAdmin,
    setAdmin,
  };

  return (
    <GlobalContext.Provider value={value}>{children}</GlobalContext.Provider>
  );
}

export const useGContext = () => useContext(GlobalContext);
