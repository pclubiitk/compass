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
  isAdmin: boolean;
  setAdmin: (isAdmin: boolean) => void;
}

const GlobalContext = createContext<GlobalContextType>({
  isLoggedIn: null,
  setLoggedIn: () => {},
  isGlobalLoading: false,
  setGlobalLoading: () => {},
  isAdmin: false,
  setAdmin: () => {},
});

export function GlobalContextProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setLoggedIn] = useState<boolean | null>(null);
  const [isGlobalLoading, setGlobalLoading] = useState<boolean>(true);
  const [isAdmin, setAdmin] = useState<boolean>(false);

  useEffect(() => {
    async function verifyingLogin() {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_AUTH_URL}/api/auth/me`,
          {
            method: "GET",
            credentials: "include",
          }
        );
        if (response.ok) {
          setLoggedIn(true);
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
    isAdmin,
    setAdmin,
  };

  return (
    <GlobalContext.Provider value={value}>{children}</GlobalContext.Provider>
  );
}

export const useGContext = () => useContext(GlobalContext);
