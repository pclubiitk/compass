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
  fetchPublicKeys,
  initPuppyLoveWorker,
} from "@/lib/workers/puppyLoveWorkerClient";

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
  resetReceivedHearts,
} from "@/lib/puppyLoveState";
import { PUPPYLOVE_POINT } from "@/lib/constant";

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

// PuppyLove all users data type (interests and bio)
interface PuppyLoveAllUsersData {
  about: Record<string, string>;
  interests: Record<string, string>;
}

// LocalStorage cache key and expiry for PuppyLove data
const PUPPYLOVE_CACHE_KEY = "puppylove_all_users_data";
const PUPPYLOVE_CACHE_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

// Helper functions for localStorage cache
function getPuppyLoveDataFromCache(): PuppyLoveAllUsersData | null {
  if (typeof window === "undefined") return null;
  try {
    const cached = localStorage.getItem(PUPPYLOVE_CACHE_KEY);
    if (!cached) return null;
    const parsed = JSON.parse(cached);
    const now = Date.now();
    if (now > parsed.expiry) {
      localStorage.removeItem(PUPPYLOVE_CACHE_KEY);
      return null;
    }
    return parsed.data as PuppyLoveAllUsersData;
  } catch {
    return null;
  }
}

function setPuppyLoveDataInCache(data: PuppyLoveAllUsersData): void {
  if (typeof window === "undefined") return;
  try {
    const cacheEntry = {
      data,
      expiry: Date.now() + PUPPYLOVE_CACHE_EXPIRY_MS,
    };
    localStorage.setItem(PUPPYLOVE_CACHE_KEY, JSON.stringify(cacheEntry));
  } catch {
    console.error("[PuppyLove] Failed to cache data in localStorage");
  }
}

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

  // Puppy Love specific context
  privateKey: string | null;
  setPrivateKey: (val: any) => void;
  // TODO: Where it is used?
  studentSelection?: any;
  setStudentSelection?: (val: any) => void;

  // Selections panel visibility
  showSelections: boolean;
  setShowSelections: (val: boolean) => void;

  // Suggested roll numbers for PuppyLove suggest match feature
  suggestedRollNos: string[];
  setSuggestedRollNos: (val: any) => void;
  // Display Block State:
  // When true, prevents search queries from executing and allows the Display component
  // to show alternative content (e.g., suggested matches, PuppyLove results).
  // Activated when:
  // 1. Suggestions mode is active (user clicked "Suggest" button)
  // 2. PuppyLove mode is on but permit is off (showing match results after deadline)
  isDisplayBlocked: boolean;
  setIsDisplayBlocked: (val: boolean) => void;
  isSuggestLoading: boolean;
  setIsSuggestLoading: (val: boolean) => void;

  // PuppyLove all users interests/bio data (cached in localStorage)
  puppyLoveAllUsersData: PuppyLoveAllUsersData | null;
  isPuppyLoveDataLoading: boolean;
  refreshPuppyLoveData: () => Promise<void>;
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

  // Suggested roll numbers defaults
  suggestedRollNos: [],
  setSuggestedRollNos: () => {},
  isDisplayBlocked: false,
  setIsDisplayBlocked: () => {},
  isSuggestLoading: false,
  setIsSuggestLoading: () => {},

  // PuppyLove all users data defaults
  puppyLoveAllUsersData: null,
  isPuppyLoveDataLoading: false,
  refreshPuppyLoveData: async () => {},
});

export function GlobalContextProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setLoggedIn] = useState<boolean>(false);
  const [isGlobalLoading, setGlobalLoading] = useState<boolean>(false);
  const [globalError, setGlobalError] = useState<boolean>(false);
  const [profileVisibility, setProfileVisibility] = useState<boolean>(false);
  const [isPLseason, setPLseason] = useState<boolean>(true);
  const [PLpermit, setPLPermit] = useState<boolean>(true);
  const [PLpublish, setPLPublished] = useState<boolean>(false);
  const [isPuppyLove, setIsPuppyLove] = useState<boolean>(false); // Always starts false, toggled by user
  const [currentUserProfile, setCurrentUserProfile] = useState<any>(null);
  const [needsFirstTimeLogin, setNeedsFirstTimeLogin] =
    useState<boolean>(false);

  // Puppy Love worker state
  const [puppyLovePublicKeys, setPuppyLovePublicKeys] = useState<Object>({});
  // const [puppyLoveHeartsSent, setPuppyLoveHeartsSent] = useState<any>([]);
  // const [puppyLoveHeartsReceived, setPuppyLoveHeartsReceived] = useState<any>(null);
  const [isDecryptingHearts, setIsDecryptingHearts] = useState<boolean>(false);
  const [matchedIds, setMatchedIds] = useState<string[]>([]);
  const [puppyLoveProfile, setPuppyLoveProfile] = useState<any>(null);
  const [privateKey, setPrivateKey] = useState<string | null>(null);
  // Selections panel visibility
  const [studentSelection, setStudentSelection] = useState<any>(null);
  const [showSelections, setShowSelections] = useState<boolean>(false);

  // Suggested roll numbers for PuppyLove suggest match feature
  const [suggestedRollNos, setSuggestedRollNos] = useState<string[]>([]);
  // Display Block State: blocks search queries to preserve Display content
  // (see interface definition for full documentation)
  const [isDisplayBlocked, setIsDisplayBlocked] = useState<boolean>(false);
  const [isSuggestLoading, setIsSuggestLoading] = useState<boolean>(false);

  // PuppyLove all users interests/bio data (cached in localStorage with 1hr expiry)
  const [puppyLoveAllUsersData, setPuppyLoveAllUsersData] =
    useState<PuppyLoveAllUsersData | null>(null);
  const [isPuppyLoveDataLoading, setIsPuppyLoveDataLoading] =
    useState<boolean>(false);

  // Fetch PuppyLove all users data (interests/bio) with localStorage caching
  const fetchPuppyLoveAllUsersData = async (
    forceRefresh = false,
  ): Promise<void> => {
    // Check localStorage cache first (unless force refresh)
    if (!forceRefresh) {
      const cached = getPuppyLoveDataFromCache();
      if (cached) {
        // console.log("[PuppyLove] Using cached data from localStorage");
        setPuppyLoveAllUsersData(cached);
        return;
      }
    }

    setIsPuppyLoveDataLoading(true);
    try {
      // console.log("[PuppyLove] Fetching all users data from API...");
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_PUPPYLOVE_URL}/api/puppylove/users/alluserInfo`,
        { credentials: "include" },
      );
      if (!res.ok) {
        console.error(
          `[PuppyLove] API returned ${res.status}: ${res.statusText}`,
        );
        return;
      }

      const data = await res.json();
      const allUsersData: PuppyLoveAllUsersData = {
        about: data.about || {},
        interests: data.interests || {},
      };
      // console.log(`[PuppyLove] Fetched data for ${Object.keys(allUsersData.about).length} users`);
      // Cache in localStorage
      setPuppyLoveDataInCache(allUsersData);
      setPuppyLoveAllUsersData(allUsersData);
    } catch (err) {
      console.error("[PuppyLove] Error fetching all users data:", err);
    } finally {
      setIsPuppyLoveDataLoading(false);
    }
  };

  // Refresh function exposed via context
  const refreshPuppyLoveData = async (): Promise<void> => {
    await fetchPuppyLoveAllUsersData(true);
  };

  // Reset function to be called to clear all puppy love data
  const resetForRefresh = () => {
    resetPuppyLoveState();
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
          setPuppyLovePublicKeys(await fetchPublicKeys());
          if (response.status === 202) {
            setPLseason(true);
            setPLPermit(res_json?.permit);
            setPLPublished(res_json?.publish);
            if (res_json?.publish) {
              await fetchMatches(res_json?.publish);
            }
            setIsPuppyLove(false); // Always start disabled on new session, user must toggle it on
          } else if (response.status === 203) {
            notLoggedInReset();
            setProfileVisibility(false);
            setLoggedIn(false);
          }
        } else {
          notLoggedInReset();
          setLoggedIn(false);
          setGlobalError(true);
        }
      } catch {
        setLoggedIn(false);
      } finally {
        setGlobalLoading(false);
      }
    }
    verifyingLogin();
  }, []);

  // Centralized cleanup effect (ONLY addition)
  const notLoggedInReset = () => {
    if (!isLoggedIn) {
      // console.log("Logged out : clearing all storage on 3000");

      sessionStorage.clear();
      localStorage.clear();

      // also clear in-memory state
      resetPuppyLoveState();
      setPrivateKey(null);
      setPuppyLovePublicKeys({});
      setMatchedIds([]);
      setPuppyLoveProfile(null);
      setIsPuppyLove(false);
    }
  };

  // Fetch Matches - pass publish flag directly to avoid stale closure
  const fetchMatches = async (isPublished: boolean) => {
    if (isPublished) {
      try {
        const response = await fetch(
          `${PUPPYLOVE_POINT}/api/puppylove/users/mymatches`,
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

  // Fetch PuppyLove all users data (interests/bio) when PuppyLove mode is enabled
  useEffect(() => {
    if (isPuppyLove) {
      fetchPuppyLoveAllUsersData();
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
          if (type === "FETCH_AND_CLAIM_HEARTS_RESULT") {
            // Clear loading state after decryption completes
            setIsDecryptingHearts(false);
            // Claiming is done on the server. Now fetch user data
            // so GET_USER_DATA_RESULT has the complete claims list.
            worker.postMessage({
              type: "GET_USER_DATA",
              payload: { privateKey },
            });
          }
          if (type === "FETCH_RETURN_HEARTS_RESULT") {
            // Nothing to do right now,
            // The function would have, fetched the returned hearts, and if it were of user, then its a match, hence save in the backend.
          }
          if (type === "GET_USER_DATA_RESULT") {
            // console.log(" GET_USER_DATA_RESULT received:", payload);
            if (payload?.receiverIds) {
              setReceiverIds(payload.receiverIds);
            }
            // Parse hearts data on the main thread so getNumberOfHeartsSent() works
            if (payload?.data && payload.data !== "FIRST_LOGIN") {
              try {
                setPuppyLoveHeartsSent(JSON.parse(payload.data) as Hearts);
              } catch (e) {
                console.error("Failed to parse hearts data:", e);
              }
            }
            // Reset received hearts state before re-populating to avoid double counting
            resetReceivedHearts();
            if (payload?.claimsArray) {
              payload.claimsArray.forEach((claim: any) => {
                addReceivedHeart(claim);
                if (claim.genderOfSender === "M") incHeartsMalesBy(1);
                else if (claim.genderOfSender === "F") incHeartsFemalesBy(1);
              });
            }
            setPuppyLoveProfile(payload ?? null);

            worker.postMessage({
              type: "FETCH_RETURN_HEARTS",
              payload: { privateKey, puppyLoveHeartsSent },
            });
          }
          if (type === "PREPARE_SEND_HEART_RESULT") {
            console.log("PREPARE_SEND_HEART_RESULT received:", payload);
          }
          // TODO: Add more message types as needed
        };
        // Fetch public keys and set them into the global state.
        worker.postMessage({ type: "FETCH_PUBLIC_KEYS" });
        // First claim any new hearts, then GET_USER_DATA is triggered
        // in FETCH_AND_CLAIM_HEARTS_RESULT handler to get the complete picture.
        if (privateKey) {
          setIsDecryptingHearts(true);
          worker.postMessage({
            type: "FETCH_AND_CLAIM_HEARTS",
            payload: { privateKey: privateKey },
          });
        }
        // TODO: No Need, can look into it more.
        // else {
        //   // No private key — can't claim, just fetch user data directly
        //   worker.postMessage({ type: "GET_USER_DATA", payload: { privateKey } });
        // }
        // worker.postMessage({
        //   type: "FETCH_RETURN_HEARTS",
        //   payload: { privateKey, puppyLoveHeartsSent },
        // });
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
    needsFirstTimeLogin,
    setNeedsFirstTimeLogin,
    currentUserProfile,
    puppyLovePublicKeys,
    setPuppyLovePublicKeys,
    puppyLoveProfile,
    setPuppyLoveProfile,
    privateKey,
    setPrivateKey,
    isDecryptingHearts,
    setIsDecryptingHearts,
    showSelections,
    setShowSelections,
    studentSelection,
    setStudentSelection,
    // Suggested roll numbers
    suggestedRollNos,
    setSuggestedRollNos,
    isDisplayBlocked,
    setIsDisplayBlocked,
    isSuggestLoading,
    setIsSuggestLoading,
    // PuppyLove all users interests/bio data
    puppyLoveAllUsersData,
    isPuppyLoveDataLoading,
    refreshPuppyLoveData,
  };

  return (
    <GlobalContext.Provider value={value}>{children}</GlobalContext.Provider>
  );
}

export const useGContext = () => useContext(GlobalContext);
