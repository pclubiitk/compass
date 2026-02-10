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

// Import and re-export shared Puppy Love state from separate file
// This avoids circular dependencies with workers
import {
  type Heart,
  type Hearts,
  receiverIds,
  puppyLoveHeartsSent,
  heartsReceivedFromMales,
  heartsReceivedFromFemales,
  puppyLoveHeartsReceived,
  setPuppyLoveHeartsSent,
  getNumberOfHeartsSent,
  incHeartsMalesBy,
  addReceivedHeart,
  incHeartsFemalesBy,
  setReceiverIds,
  resetPuppyLoveState,
} from "@/lib/puppyLoveState";

// Re-export for backwards compatibility
export type { Heart, Hearts };
export {
  receiverIds,
  puppyLoveHeartsSent,
  heartsReceivedFromMales,
  heartsReceivedFromFemales,
  puppyLoveHeartsReceived,
  setPuppyLoveHeartsSent,
  getNumberOfHeartsSent,
  incHeartsMalesBy,
  addReceivedHeart,
  incHeartsFemalesBy,
};

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

  currentUserProfile?: any;

  needsFirstTimeLogin?: boolean;
  setNeedsFirstTimeLogin?: (val: boolean) => void;

  // Puppy Love specific context
  puppyLovePublicKeys?: any;
  setPuppyLovePublicKeys?: (val: any) => void;
  puppyLoveProfile?: any;
  setPuppyLoveProfile?: (val: any) => void;
  privateKey: string | null;
  setPrivateKey: (val: any) => void;
  studentSelection?: any;
  setStudentSelection?: (val: any) => void;
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

  privateKey: null,
  setPrivateKey: () => {},
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

  // Puppy Love specific state
  const [puppyLovePublicKeys, setPuppyLovePublicKeys] = useState<any>(null);
  const [puppyLoveProfile, setPuppyLoveProfile] = useState<any>(null);
  const [privateKey, setPrivateKey] = useState<string | null>(null);
  const [studentSelection, setStudentSelection] = useState<any>(null);

  // Reset function to be called to clear all puppy love data
  const resetForRefresh = () => {
    resetPuppyLoveState();
    setPuppyLovePublicKeys([]);
  };

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

  // Puppy Love mode: read private key from session storage
  useEffect(() => {
    if (isPuppyLove) {
      const storedData = sessionStorage.getItem("data");
      if (storedData) {
        try {
          const parsed = JSON.parse(storedData);
          if (parsed.k1) {
            setPrivateKey(parsed.k1);
            return;
          }
        } catch (parseErr) {
          console.error("Error parsing stored data:", parseErr);
        }
      }
    }
  }, [isPuppyLove]);

  // Puppy Love worker initialization and message handling
  // Fetch hearts when we have a private key
  useEffect(() => {
    if (isPuppyLove && privateKey) {
      // Reset to start fresh
      resetForRefresh();
      // Initialize the worker
      const worker = initPuppyLoveWorker();
      if (worker) {
        worker.onmessage = (e) => {
          const { type, results, result, error } = e.data;
          const payload = result ?? results;
          if (type === "FETCH_PUBLIC_KEYS_RESULT") {
            setPuppyLovePublicKeys(payload);
          }
          if (type === "FETCH_HEARTS_RESULT") {
            puppyLoveHeartsReceived.length = 0;
            if (Array.isArray(payload)) {
              payload.forEach((heart: any) => addReceivedHeart(heart));
            }
          }
          if (type === "FETCH_AND_CLAIM_HEARTS_RESULT") {
            puppyLoveHeartsReceived.length = 0;
            if (Array.isArray(payload)) {
              payload.forEach((heart: any) => addReceivedHeart(heart));
            }
          }
          if (type === "FETCH_RETURN_HEARTS_RESULT") {
            // optional: store returned hearts for later use
          }
          if (type === "GET_USER_DATA_RESULT") {
            console.log(" GET_USER_DATA_RESULT received:", payload);
            if (payload?.receiverIds) {
              setReceiverIds(payload.receiverIds);
            }
            // Parse hearts data on the main thread so getNumberOfHeartsSent() works
            if (payload?.data && payload.data !== 'FIRST_LOGIN') {
              try {
                setPuppyLoveHeartsSent(JSON.parse(payload.data) as Hearts);
              } catch (e) {
                console.error("Failed to parse hearts data:", e);
              }
            }
            setPuppyLoveProfile(payload ?? null);
          }
          if (type === "PREPARE_SEND_HEART_RESULT") {
            console.log("PREPARE_SEND_HEART_RESULT received:", payload);
            // optional: handle any state updates needed after preparing heart
          }
          // TODO: Add more message types as needed
        };
        // Trigger the reset worker messages
        worker.postMessage({ type: "FETCH_PUBLIC_KEYS" });
        worker.postMessage({ type: "GET_USER_DATA" });
        if (privateKey) {
          worker.postMessage({
            type: "FETCH_AND_CLAIM_HEARTS",
            payload: { privateKey: privateKey },
          });
        } else {
          worker.postMessage({ type: "FETCH_HEARTS" });
        }
        worker.postMessage({ type: "FETCH_RETURN_HEARTS" });
      }
    }
  }, [isPuppyLove, privateKey]);

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
    needsFirstTimeLogin,
    setNeedsFirstTimeLogin,
    currentUserProfile,
    puppyLovePublicKeys,
    setPuppyLovePublicKeys,
    puppyLoveProfile,
    setPuppyLoveProfile,
    privateKey,
    setPrivateKey,
    studentSelection,
    setStudentSelection,
  };

  return (
    <GlobalContext.Provider value={value}>{children}</GlobalContext.Provider>
  );
}

export const useGContext = () => useContext(GlobalContext);
