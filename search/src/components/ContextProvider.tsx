"use client";

// SUGGESTION: Currently we are using basic context management,
// can later use libraries like, redux, zustand, or more

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { initPuppyLoveWorker } from "@/lib/workers/puppyLoveWorkerClient";

// Need following context
// 1. Logged In (if not logged in redirect to login in 5 seconds)
// 2. Profile Visibility (if not, then delete all the local data)
// 3. Puppy Love Season (if so, received hearts, etc)

interface GlobalContextType {
  isLoggedIn: boolean;
  setLoggedIn: (isLoggedIn: boolean) => void;

  profileVisibility: boolean;

  isGlobalLoading: boolean;
  setGlobalLoading: (isGlobalLoading: boolean) => void;

  globalError: boolean;
  setGlobalError: (globalError: boolean) => void;

  isPLseason: boolean;
  isPuppyLove: boolean;
  setIsPuppyLove: (val: boolean) => void;

  puppyLovePublicKeys?: any;
  setPuppyLovePublicKeys?: (val: any) => void;
  puppyLoveHeartsSent?: any;
  puppyLoveHeartsReceived?: any;
  setPuppyLoveHeartsSent?: (val: any) => void;
  puppyLoveProfile?: any;
  setPuppyLoveProfile?: (val: any) => void;
  currentUserProfile?: any;

  needsFirstTimeLogin?: boolean;
  setNeedsFirstTimeLogin?: (val: boolean) => void;
}

const GlobalContext = createContext<GlobalContextType>({
  isLoggedIn: false,
  setLoggedIn: () => {},

  profileVisibility: false,

  isGlobalLoading: false,
  setGlobalLoading: () => {},

  globalError: false,
  setGlobalError: () => {},

  isPLseason: false,
  isPuppyLove: false,
  setIsPuppyLove: () => {},
});

export function GlobalContextProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setLoggedIn] = useState<boolean>(false);
  const [isGlobalLoading, setGlobalLoading] = useState<boolean>(false);
  const [isPLseason, setPLseason] = useState<boolean>(false);
  const [globalError, setGlobalError] = useState<boolean>(false);
  const [profileVisibility, setProfileVisibility] = useState<boolean>(false);
  const [isPuppyLove, setIsPuppyLove] = useState<boolean>(false); // Always starts false, toggled by user
  const [currentUserProfile, setCurrentUserProfile] = useState<any>(null);
  const [needsFirstTimeLogin, setNeedsFirstTimeLogin] =
    useState<boolean>(false);

  // Puppy Love worker state
  const [puppyLovePublicKeys, setPuppyLovePublicKeys] = useState<any>(null);
  const [puppyLoveHeartsSent, setPuppyLoveHeartsSent] = useState<any>([]);
  const [puppyLoveHeartsReceived, setPuppyLoveHeartsReceived] =
    useState<any>(null);
  const [puppyLoveProfile, setPuppyLoveProfile] = useState<any>(null);

  useEffect(() => {
    async function verifyingLogin() {
      try {
        setGlobalLoading(true);
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_AUTH_URL}/api/auth/me`,
          {
            method: "GET",
            credentials: "include",
          },
        );
        if (response.ok) {
          setProfileVisibility(true);
          setLoggedIn(true);
          if (response.status === 202) {
            setPLseason(true);
            setIsPuppyLove(false); // Always start disabled on new session, user must toggle it on
          }
        } else if (response.status === 401) {
          setProfileVisibility(false);
          setLoggedIn(false);
        } else {
          setGlobalError(true);
        }
      } catch (error) {
        setGlobalLoading(false);
      } finally {
        setGlobalLoading(false);
      }
    }
    verifyingLogin();
  }, []);

  // Load public keys from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const cachedKeys = localStorage.getItem("puppylove_public_keys");
      if (cachedKeys) {
        try {
          setPuppyLovePublicKeys(JSON.parse(cachedKeys));
        } catch {
          localStorage.removeItem("puppylove_public_keys");
        }
      }
    }
  }, []);

  // Puppy Love worker initialization and message handling
  useEffect(() => {
    if (isPuppyLove) {
      // Reset received hearts when entering mode (will be refetched from backend)
      setPuppyLoveHeartsReceived([]);

      const worker = initPuppyLoveWorker();
      if (worker) {
        worker.onmessage = (e) => {
          const { type, results, result, error } = e.data;
          const payload = result ?? results;
          if (type === "FETCH_PUBLIC_KEYS_RESULT") {
            setPuppyLovePublicKeys(payload);
            // Store in localStorage for future use
            if (typeof window !== "undefined") {
              localStorage.setItem(
                "puppylove_public_keys",
                JSON.stringify(payload),
              );
            }
          }
          if (type === "FETCH_HEARTS_RESULT") {
            setPuppyLoveHeartsReceived(Array.isArray(payload) ? payload : []);
          }
          if (type === "FETCH_AND_CLAIM_HEARTS_RESULT") {
            setPuppyLoveHeartsReceived(Array.isArray(payload) ? payload : []);
          }
          if (type === "FETCH_RETURN_HEARTS_RESULT") {
            // optional: store returned hearts for later use
          }
          if (type === "GET_USER_DATA_RESULT") {
            console.log(" GET_USER_DATA_RESULT received:", payload);
            setPuppyLoveProfile(payload ?? null);
          }
          // Add more message types as needed
        };
        // Trigger fetches
        worker.postMessage({ type: "FETCH_PUBLIC_KEYS" });
        console.log("📤 Sending GET_USER_DATA message to worker");
        worker.postMessage({ type: "GET_USER_DATA" });
        const privKey =
          typeof window !== "undefined"
            ? sessionStorage.getItem("puppylove_private_key")
            : null;
        if (privKey) {
          worker.postMessage({
            type: "FETCH_AND_CLAIM_HEARTS",
            payload: { privateKey: privKey },
          });
        } else {
          worker.postMessage({ type: "FETCH_HEARTS" });
        }
        worker.postMessage({ type: "FETCH_RETURN_HEARTS" });
      }
    }
  }, [isPuppyLove]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedSent = sessionStorage.getItem("puppylove_sent_hearts");
      if (storedSent) {
        try {
          setPuppyLoveHeartsSent(JSON.parse(storedSent));
        } catch {
          setPuppyLoveHeartsSent([]);
        }
      } else {
        setPuppyLoveHeartsSent([]);
      }
    }
  }, []);

  const value = {
    isLoggedIn,
    setLoggedIn,
    profileVisibility,
    isGlobalLoading,
    setGlobalLoading,
    globalError,
    setGlobalError,
    isPLseason,
    isPuppyLove,
    setIsPuppyLove,
    puppyLovePublicKeys,
    setPuppyLovePublicKeys,
    puppyLoveHeartsSent,
    puppyLoveHeartsReceived,
    setPuppyLoveHeartsSent,
    puppyLoveProfile,
    setPuppyLoveProfile,
    needsFirstTimeLogin,
    setNeedsFirstTimeLogin,
    currentUserProfile,
  };

  return (
    <GlobalContext.Provider value={value}>{children}</GlobalContext.Provider>
  );
}

export const useGContext = () => useContext(GlobalContext);
