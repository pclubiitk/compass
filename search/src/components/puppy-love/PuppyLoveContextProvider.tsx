// "use client";

// import {
//   createContext,
//   useContext,
//   useState,
//   useEffect,
//   ReactNode,
// } from "react";
// import { initPuppyLoveWorker } from "@/lib/workers/puppyLoveWorkerClient";
// import { useGContext } from "@/components/ContextProvider";
// import { setData } from "@/lib/workers/utils";


// interface PuppyLoveContextType {
//   puppyLovePublicKeys?: any;
//   setPuppyLovePublicKeys?: (val: any) => void;
//   puppyLoveProfile?: any;
//   setPuppyLoveProfile?: (val: any) => void;

//   privateKey: string | null;
//   setPrivateKey: (val: any) => void;
// }

// const PuppyLoveContext = createContext<PuppyLoveContextType>({
//   privateKey: null,
//   setPrivateKey: () => {},
// });

// export let receiverIds: string[] = [];

// export interface Heart {
//   sha_encrypt: string;
//   id_encrypt: string;
//   songID_enc: string;
// }

// export interface Hearts {
//   heart1: Heart;
//   heart2: Heart;
//   heart3: Heart;
//   heart4: Heart;
// }

// export let puppyLoveHeartsSent: Hearts | null = null;
// export let heartsReceivedFromMales = 0;
// export let heartsReceivedFromFemales = 0;
// export let puppyLoveHeartsReceived: any[] = [];

// export function setPuppyLoveHeartsSent(hearts: Hearts | null) {
//   puppyLoveHeartsSent = hearts;
// }

// export function getNumberOfHeartsSent() {
//     if (!puppyLoveHeartsSent) return 0;
//     return Object.values(puppyLoveHeartsSent).filter(value => value != null).length;
// }

// export function incHeartsMalesBy(heartsMales: number) {
//   heartsReceivedFromMales += heartsMales;
// }

// export function addReceivedHeart(claim: any) {
//   puppyLoveHeartsReceived.push(claim);
// }

// export function incHeartsFemalesBy(heartsFemales: number) {
//   heartsReceivedFromFemales += heartsFemales;
// }

// export function PuppyLoveContextProvider({ children }: { children: ReactNode }) {
//   const { isPuppyLove } = useGContext();

//   // Puppy Love worker state
//   const [puppyLovePublicKeys, setPuppyLovePublicKeys] = useState<any>(null);
//   const [puppyLoveProfile, setPuppyLoveProfile] = useState<any>(null);
//   // Puppy Love user keys
//   const [privateKey, setPrivateKey] = useState<string | null>(null);

//   // Reset function to be called to clear all.
//   const resetForRefresh = () => {
//     puppyLoveHeartsReceived.length = 0;
//     setPuppyLoveHeartsSent(null);
//     setPuppyLovePublicKeys([]);

//   };


//   // Puppy Love mode enabled, read the private key from the session storage
//   useEffect(() => {
//     if (isPuppyLove) {
//       const storedData = sessionStorage.getItem("data");
//       if (storedData) {
//         try {
//           const parsed = JSON.parse(storedData);
//           if (parsed.k1) {
//             setPrivateKey(parsed.k1);
//             return;
//           }
//         } catch (parseErr) {
//           console.error("Error parsing stored data:", parseErr);
//         }
//       }
//     }
//   }, [isPuppyLove]);

//   // Puppy Love worker initialization and message handling
//   // Fetch hearts when we have a private key
//   useEffect(() => {
//     if (isPuppyLove && privateKey) {
//       // Reset to start fresh.
//       resetForRefresh();
//       // Initialize the worker
//       const worker = initPuppyLoveWorker();
//       if (worker) {
//         worker.onmessage = (e) => {
//           const { type, results, result, error } = e.data;
//           const payload = result ?? results;
//           if (type === "FETCH_PUBLIC_KEYS_RESULT") {
//             setPuppyLovePublicKeys(payload);
//           }
//           if (type === "FETCH_HEARTS_RESULT") {
//             puppyLoveHeartsReceived.length = 0;
//             if (Array.isArray(payload)) {
//               payload.forEach((heart: any) => addReceivedHeart(heart));
//             }
//           }
//           if (type === "FETCH_AND_CLAIM_HEARTS_RESULT") {
//             puppyLoveHeartsReceived.length = 0;
//             if (Array.isArray(payload)) {
//               payload.forEach((heart: any) => addReceivedHeart(heart));
//             }
//           }
//           if (type === "FETCH_RETURN_HEARTS_RESULT") {
//             // optional: store returned hearts for later use
//           }
//           if (type === "GET_USER_DATA_RESULT") {
//             console.log(" GET_USER_DATA_RESULT received:", payload);
//             setPuppyLoveProfile(payload ?? null); 
//           }
//           // TODO: Add more message types as needed
//         };
//         // Trigger the reset worker messages
//         worker.postMessage({ type: "FETCH_PUBLIC_KEYS" });
//         worker.postMessage({ type: "GET_USER_DATA" });
//         if (privateKey) {
//           worker.postMessage({
//             type: "FETCH_AND_CLAIM_HEARTS",
//             payload: { privateKey: privateKey },
//           });
//         } else {
//           worker.postMessage({ type: "FETCH_HEARTS" });
//         }
//         worker.postMessage({ type: "FETCH_RETURN_HEARTS" });
//       }
//     }
//   }, [isPuppyLove, privateKey]);

//   const value = {
//     puppyLovePublicKeys,
//     setPuppyLovePublicKeys,
//     puppyLoveHeartsSent,
//     puppyLoveProfile,
//     setPuppyLoveProfile,
//     privateKey,
//     setPrivateKey,
//   };

//   return (
//     <PuppyLoveContext.Provider value={value}>{children}</PuppyLoveContext.Provider>
//   );
// }

// export const usePuppyLoveContext = () => useContext(PuppyLoveContext);
