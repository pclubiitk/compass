export let puppyLoveWorker: Worker | null = null;

export const initPuppyLoveWorker = () => {
  if (!puppyLoveWorker) {
    console.info("[PuppyLove Worker] Initializing worker...");
    puppyLoveWorker = new Worker(
      new URL("@/lib/workers/puppy_love_worker.ts", import.meta.url),
    );

    puppyLoveWorker.onmessage = (e) => {
      const { type, results, error } = e.data;
      console.log("[PuppyLove Worker]", type, results, error);
    };

    puppyLoveWorker.onerror = (err) => {
      console.error("[PuppyLove Worker Error]", err);
    };

    console.info("[PuppyLove Worker] Starting...");
    puppyLoveWorker.postMessage({ type: "START_PUPPY_LOVE", payload: {} });
  }
  return puppyLoveWorker;
};

// Generic worker API caller for PuppyLove operations
const callWorkerAPI = (type: string, payload?: any): Promise<any> => {
  return new Promise((resolve, reject) => {
    if (!puppyLoveWorker) {
      initPuppyLoveWorker();
    }
    if (!puppyLoveWorker) {
      reject("Worker not initialized");
      return;
    }
    const worker = puppyLoveWorker;
    const resultType = type + "_RESULT";

    const handler = (e: MessageEvent) => {
      if (e.data.type === resultType) {
        worker.removeEventListener("message", handler);
        if (e.data.error) {
          reject(e.data.error);
        } else {
          resolve(e.data.result);
        }
      }
    };
    worker.addEventListener("message", handler);
    worker.postMessage({ type, payload: payload || {} });
  });
};

export const sendHeart = (heartData: any) => callWorkerAPI('SEND_HEART', heartData);
export const sendVirtualHeart = (heartData: any) => callWorkerAPI('SEND_VIRTUAL_HEART', heartData);
export const getVirtualHeartCount = () => callWorkerAPI('GET_VIRTUAL_HEART_COUNT');
export const fetchAndClaimHearts = (privateKey: string) => callWorkerAPI('FETCH_AND_CLAIM_HEARTS', { privateKey });
export const fetchReturnHearts = () => callWorkerAPI('FETCH_RETURN_HEARTS');
export const verifyReturnHearts = (verifyData: any) => callWorkerAPI('VERIFY_RETURN_HEARTS', verifyData);
export const returnLateHearts = (lateHeartsData: any) => callWorkerAPI('RETURN_LATE_HEARTS', lateHeartsData);
export const fetchPublicKeys = () => callWorkerAPI('FETCH_PUBLIC_KEYS');
export const getUserData = () => callWorkerAPI('GET_USER_DATA');
export const updateAbout = (aboutData: any) => callWorkerAPI('UPDATE_ABOUT', aboutData);
export const updateInterests = (interestData: any) => callWorkerAPI('UPDATE_INTERESTS', interestData);
export const publishProfile = () => callWorkerAPI('PUBLISH_PROFILE');
export const getMyMatches = () => callWorkerAPI('GET_MY_MATCHES');
export const sentHeartDecoded = (decodedData: any) => callWorkerAPI('SENT_HEART_DECODED', decodedData);

export const prepareSendHeart = (
  senderPublicKey: string,
  senderPrivateKey: string,
  puppyLovePublicKeys: Record<string, string>,
  senderRollNo: string,
  receiverIds: string[],
): Promise<any> => {
  return callWorkerAPI("PREPARE_SEND_HEART", {
    senderPublicKey,
    senderPrivateKey,
    puppyLovePublicKeys,
    senderRollNo,
    receiverIds,
  });
};

// First-time login operations
export const generateKeys = (): Promise<{
  pubKey: string;
  privKey: string;
}> => {
  return callWorkerAPI("GENERATE_KEYS");
};

export const encryptPrivateKey = (
  privateKey: string,
  password: string,
): Promise<string> => {
  return callWorkerAPI("ENCRYPT_PRIVATE_KEY", { privateKey, password });
};

export const decryptPrivateKey = (
  encryptedPrivateKey: string,
  password: string,
): Promise<string> => {
  return callWorkerAPI("DECRYPT_PRIVATE_KEY", {
    encryptedPrivateKey,
    password,
  });
};

export const firstLogin = (
  rollNo: string,
  password: string,
  authCode: string,
  publicKey: string,
  encryptedPrivateKey: string,
  data?: string,
): Promise<any> => {
  return callWorkerAPI("FIRST_LOGIN", {
    rollNo,
    password,
    authCode,
    publicKey,
    encryptedPrivateKey,
    data,
  });
};
// Promise-based SHA256 hashing
export const hashPassword = (data: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!puppyLoveWorker) {
      reject("Worker not initialized");
      return;
    }
    const worker = puppyLoveWorker;
    const handler = (e: MessageEvent) => {
      if (e.data.type === "SHA256_RESULT") {
        worker.removeEventListener("message", handler);
        e.data.error ? reject(e.data.error) : resolve(e.data.result);
      }
    };
    worker.addEventListener("message", handler);
    worker.postMessage({ type: "SHA256", payload: { data } });
  });
};

// Calculate similar users based on Jaccard similarity of interests
export const calculateSimilarUsers = (
  myInterests: string[],
  allProfiles: Record<string, string>,
  excludeRolls: string[],
): Promise<Array<{ rollNo: string }>> => {
  return callWorkerAPI("CALCULATE_SIMILAR_USERS", {
    myInterests,
    allProfiles,
    excludeRolls,
  });
};

export const decryptAES = (
  encrypted: string,
  password: string,
): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!puppyLoveWorker) {
      reject("Worker not initialized");
      return;
    }
    const worker = puppyLoveWorker;

    const handler = (e: MessageEvent) => {
      if (e.data.type === "DECRYPTED_AES") {
        worker.removeEventListener("message", handler);
        e.data.error ? reject(e.data.error) : resolve(e.data.result);
      }
    };
    worker.addEventListener("message", handler);
    worker.postMessage({
      type: "DECRYPT_AES",
      payload: { encrypted, password },
    });
  });
};
