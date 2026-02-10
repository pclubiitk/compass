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
import {
  getUserData,
  initPuppyLoveWorker,
} from "@/lib/workers/puppyLoveWorkerClient";

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
  PLpermit: boolean;
  PLpublish: boolean;
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
  matchedIds?: string[];
  setMatchedIds?: (val: any) => void;

  needsFirstTimeLogin?: boolean;
  setNeedsFirstTimeLogin?: (val: boolean) => void;

  // Loading state for heart decryption (worker task)
  isDecryptingHearts: boolean;
  setIsDecryptingHearts: (val: boolean) => void;

  privateKey: string | null;
  setPrivateKey: (val: any) => void;

  // Selections panel visibility
  showSelections: boolean;
  setShowSelections: (val: boolean) => void;
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
  PLpermit: true,
  PLpublish: false,
  isPuppyLove: false,
  setIsPuppyLove: () => {},

  isDecryptingHearts: false,
  setIsDecryptingHearts: () => {},

  privateKey: null,
  setPrivateKey: () => {},

  showSelections: false,
  setShowSelections: () => {},
});

export function GlobalContextProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setLoggedIn] = useState<boolean>(false);
  const [isGlobalLoading, setGlobalLoading] = useState<boolean>(false);
  const [globalError, setGlobalError] = useState<boolean>(false);
  const [profileVisibility, setProfileVisibility] = useState<boolean>(false);
  const [isPLseason, setPLseason] = useState<boolean>(false);
  const [PLpermit, setPLPermit] = useState<boolean>(true);
  const [PLpublish, setPLPublished] = useState<boolean>(false);
  const [isPuppyLove, setIsPuppyLove] = useState<boolean>(false); // Always starts false, toggled by user
  const [currentUserProfile, setCurrentUserProfile] = useState<any>(null);
  const [needsFirstTimeLogin, setNeedsFirstTimeLogin] =
    useState<boolean>(false);

  // Puppy Love worker state
  const [puppyLovePublicKeys, setPuppyLovePublicKeys] = useState<Object>({});
  const [puppyLoveHeartsSent, setPuppyLoveHeartsSent] = useState<any>([]);
  const [puppyLoveHeartsReceived, setPuppyLoveHeartsReceived] =
    useState<any>(null);
  const [isDecryptingHearts, setIsDecryptingHearts] = useState<boolean>(false);
  const [matchedIds, setMatchedIds] = useState<string[]>([]);
  const [puppyLoveProfile, setPuppyLoveProfile] = useState<any>(null);
  // Puppy Lover user keys
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [privateKey, setPrivateKey] = useState<string | null>(null);
  // Selections panel visibility
  const [showSelections, setShowSelections] = useState<boolean>(false);

  // Reset function to be called to clear all.
  const resetForRefresh = () => {
    setPuppyLoveHeartsReceived([]);
    setPuppyLoveHeartsSent([]);
    setPuppyLovePublicKeys({});
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
          const res_json = await response.json();
          setProfileVisibility(true);
          setLoggedIn(true);
          if (response.status === 202) {
            setPLseason(true);
            setPLPermit(res_json?.permit);
            setPLPublished(res_json?.publish);
            if (res_json?.publish) {
              await fetchMatches(res_json?.publish);
            }
            setIsPuppyLove(false); // Always start disabled on new session, user must toggle it on
          } else if (response.status === 203) {
            setProfileVisibility(false);
            setLoggedIn(false);
          }
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

  // Fetch Matches - pass publish flag directly to avoid stale closure
  const fetchMatches = async (isPublished: boolean) => {
    if (isPublished) {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_AUTH_URL}/api/puppylove/users/mymatches`,
          {
            method: "GET",
            credentials: "include",
          },
        );
        if (response.ok) {
          const res_json = await response.json();
          if (response.status === 202) {
            // User chose not to publish the results
            // TODO: set user publish to false
          }
          setMatchedIds(Object.keys(res_json.matches));
          // Can later do the song decryption part.
        }
      } catch {
        console.log("Unable to fetch my matches");
      }
    }
  };

  // On mount, read the private key from sessionStorage if it exists
  // This runs once on refresh to restore the key
  useEffect(() => {
    const storedData = sessionStorage.getItem("data");
    if (storedData) {
      try {
        const parsed = JSON.parse(storedData);
        if (parsed.k1) {
          setPrivateKey(parsed.k1);
        }
      } catch (parseErr) {
        console.error("Error parsing stored data:", parseErr);
      }
    }
  }, []);

  // Puppy Love worker initialization and message handling
  // Fetch hearts when we have a private key
  useEffect(() => {
    if (isPuppyLove && privateKey) {
      // Reset to start fresh.
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
          if (type === "FETCH_AND_CLAIM_HEARTS_RESULT") {
            setPuppyLoveHeartsReceived(Array.isArray(payload) ? payload : []);
            // Clear loading state after decryption completes
            setIsDecryptingHearts(false);
          }
          if (type === "FETCH_RETURN_HEARTS_RESULT") {
            // Nothing to do right now,
            // The function would have, fetched the returned hearts, and if it were of user, then its a match, hence save in the backend.
          }
          if (type === "GET_USER_DATA_RESULT") {
            console.log(" GET_USER_DATA_RESULT received:", payload);
            setPuppyLoveProfile(payload ?? null);
          }
        };
        // Fetch public keys and set them into the global state.
        worker.postMessage({ type: "FETCH_PUBLIC_KEYS" });
        getUserData();

        if (privateKey) {
          worker.postMessage({
            type: "FETCH_AND_CLAIM_HEARTS",
            payload: { privateKey: privateKey },
          });
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
    PLpermit,
    PLpublish,
    isPuppyLove,
    matchedIds,
    setMatchedIds,
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
    privateKey,
    setPrivateKey,
    isDecryptingHearts,
    setIsDecryptingHearts,
    showSelections,
    setShowSelections,
  };

  return (
    <GlobalContext.Provider value={value}>{children}</GlobalContext.Provider>
  );
}

export const useGContext = () => useContext(GlobalContext);
