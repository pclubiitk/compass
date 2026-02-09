import { Decryption, Decryption_AES, SHA256, Encryption, Encryption_AES, RandInt, generateRandomString, GenerateKeys } from './Encryption';
import { PUPPYLOVE_POINT } from "@/lib/constant";

self.addEventListener('message', async (e: MessageEvent) => {
  const { type, payload } = e.data;

  
  if (type === 'DECRYPT_HEARTS') {
    const { items, privKey } = payload;
    try {
      const results = await Promise.all(
        items.map(async (el: any) => ({
          original: el,
          decrypted: await Decryption(el.enc, privKey),
        }))
      );

      self.postMessage({ type: 'DECRYPTED_HEARTS', results, error: null });
    } catch (err) {
      self.postMessage({ type: 'DECRYPTED_HEARTS', results: null, error: (err as Error).message });
    }
  }


  if (type === 'DECRYPT_DATA') {
    const { idEncrypts, songEncrypts, privKey } = payload;
    try {
      const idResults = await Promise.all(
        idEncrypts.map((enc: string) => Decryption(enc, privKey))
      );
      const songResults = await Promise.all(
        songEncrypts.map((enc: string) => Decryption(enc, privKey))
      );
      self.postMessage({ 
        type: 'DECRYPTED_DATA', 
        results: { idResults, songResults }, 
        error: null 
      });
    } catch (err) {
      self.postMessage({ type: 'DECRYPTED_DATA', results: null, error: (err as Error).message });
    }
  }

  
  if (type === 'DECRYPT_RETURNED_HEARTS') {
    const { items, privKey } = payload;
    try {
      const results = await Promise.all(
        items.map(async (el: any) => ({
          original: el,
          decrypted: await Decryption(el.enc, privKey),
        }))
      );
      self.postMessage({ type: 'DECRYPTED_RETURNED_HEARTS', results, error: null });
    } catch (err) {
      self.postMessage({ type: 'DECRYPTED_RETURNED_HEARTS', results: null, error: (err as Error).message });
    }
  }

  if (type === 'DECRYPT_AES') {
    const { encrypted, password } = payload;
    try {
      const result = await Decryption_AES(encrypted, password);
      self.postMessage({ type: 'DECRYPTED_AES', result, error: null });
    } catch (err) {
      self.postMessage({ type: 'DECRYPTED_AES', result: null, error: (err as Error).message });
    }
  }

  if (type === 'ENCRYPT') {
    const { sha, publicKey } = payload;
    try {
      const result = await Encryption(sha, publicKey);
      self.postMessage({ type: 'ENCRYPTED', result, error: null });  
    } catch (err) {
      self.postMessage({ type: 'ENCRYPTED', result: null, error: (err as Error).message });
    }
  }

  if (type === 'ENCRYPT_AES') {
    const { plaintext, password } = payload;
    try {
      const result = await Encryption_AES(plaintext, password);
      self.postMessage({ type: 'ENCRYPTED_AES', result, error: null });
    } catch (err) {
      self.postMessage({ type: 'ENCRYPTED_AES', result: null, error: (err as Error).message });
    }
  }

  if (type === 'SHA256') {
    const { data } = payload;
    try {
      const result = await SHA256(data);
      self.postMessage({ type: 'SHA256_RESULT', result, error: null });
    } catch (err) {
      self.postMessage({ type: 'SHA256_RESULT', result: null, error: (err as Error).message });
    }
  }

  if (type === 'RAND_INT') {
    try {
      const result = await RandInt();
      self.postMessage({ type: 'RAND_INT_RESULT', result, error: null });
    } catch (err) {
      self.postMessage({ type: 'RAND_INT_RESULT', result: null, error: (err as Error).message });
    }
  }

  if (type === 'GENERATE_RANDOM_STRING') {
    const { length } = payload;
    try {
      const result = generateRandomString(length);
      self.postMessage({ type: 'RANDOM_STRING_RESULT', result, error: null });
    } catch (err) {
      self.postMessage({ type: 'RANDOM_STRING_RESULT', result: null, error: (err as Error).message });
    }
  }

  if (type === 'VERIFY_PUPPYLOVE_PASSWORD') {
    const { password } = payload;
    try {
      const res = await fetch(`${PUPPYLOVE_POINT}/api/puppylove/users/verify-password`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (!res.ok) {
        throw new Error(`Server responded with status ${res.status}`);
      }

      const data = await res.json();
      const isValid = data?.valid === true;
      self.postMessage({ type: 'VERIFY_PUPPYLOVE_PASSWORD_RESULT', result: isValid, error: null });
    } catch (err) {
      self.postMessage({ type: 'VERIFY_PUPPYLOVE_PASSWORD_RESULT', result: null, error: (err as Error).message });
    }
  }

  // PuppyLove API Operations
  if (type === 'SEND_HEART') {
    const payload_data = payload;
    try {
      const res = await fetch(`${PUPPYLOVE_POINT}/api/puppylove/users/sendheart`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload_data),
      });
      const data = await res.json();
      self.postMessage({ type: 'SEND_HEART_RESULT', result: data, error: null });
    } catch (err) {
      self.postMessage({ type: 'SEND_HEART_RESULT', result: null, error: (err as Error).message });
    }
  }

  if (type === 'SEND_VIRTUAL_HEART') {
    const payload_data = payload;
    console.log("📤 Sending SEND_VIRTUAL_HEART:", JSON.stringify(payload_data, null, 2));
    try {
      const res = await fetch(`${PUPPYLOVE_POINT}/api/puppylove/users/sendheartVirtual`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload_data),
      });
      const data = await res.json();
      console.log("SEND_VIRTUAL_HEART response status:", res.status);
      console.log("SEND_VIRTUAL_HEART response:", data);
      self.postMessage({ type: 'SEND_VIRTUAL_HEART_RESULT', result: data, error: null });
    } catch (err) {
      console.error("SEND_VIRTUAL_HEART error:", err);
      self.postMessage({ type: 'SEND_VIRTUAL_HEART_RESULT', result: null, error: (err as Error).message });
    }
  }

  if (type === 'GET_VIRTUAL_HEART_COUNT') {
    try {
      const res = await fetch(`${PUPPYLOVE_POINT}/api/puppylove/users/virtualheartcount`, {
        method: 'GET',
        credentials: 'include',
      });
      const data = await res.json();
      self.postMessage({ type: 'GET_VIRTUAL_HEART_COUNT_RESULT', result: data, error: null });
    } catch (err) {
      self.postMessage({ type: 'GET_VIRTUAL_HEART_COUNT_RESULT', result: null, error: (err as Error).message });
    }
  }

  if (type === 'FETCH_AND_CLAIM_HEARTS') {
    const { privateKey } = payload;
    try {
      const res = await fetch(`${PUPPYLOVE_POINT}/api/puppylove/users/fetchall`, {
        method: 'GET',
        credentials: 'include',
      });
      const hearts = await res.json();

      if (!Array.isArray(hearts)) {
        self.postMessage({ type: 'FETCH_AND_CLAIM_HEARTS_RESULT', result: [], error: null });
        return;
      }

      const decrypted = await Promise.all(
        hearts.map(async (heart: any) => {
          const sha = await Decryption(heart.enc, privateKey);
          return { ...heart, sha };
        })
      );

      const claims = await Promise.all(
        decrypted.map(async (heart: any) => {
          const claimRes = await fetch(`${PUPPYLOVE_POINT}/api/puppylove/users/claimheart`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              enc: heart.enc,
              sha: heart.sha,
              genderOfSender: heart.genderOfSender,
            }),
          });
          const claimData = await claimRes.json();
          return { ...heart, claim: claimData };
        })
      );

      self.postMessage({ type: 'FETCH_AND_CLAIM_HEARTS_RESULT', result: claims, error: null });
    } catch (err) {
      self.postMessage({ type: 'FETCH_AND_CLAIM_HEARTS_RESULT', result: null, error: (err as Error).message });
    }
  }

  if (type === 'FETCH_RETURN_HEARTS') {
    try {
      const res = await fetch(`${PUPPYLOVE_POINT}/api/puppylove/users/fetchReturnHearts`, {
        method: 'GET',
        credentials: 'include',
      });
      const data = await res.json();
      self.postMessage({ type: 'FETCH_RETURN_HEARTS_RESULT', result: data, error: null });
    } catch (err) {
      self.postMessage({ type: 'FETCH_RETURN_HEARTS_RESULT', result: null, error: (err as Error).message });
    }
  }

  if (type === 'CLAIM_HEART') {
    const payload_data = payload;
    try {
      const res = await fetch(`${PUPPYLOVE_POINT}/api/puppylove/users/claimheart`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload_data),
      });
      const data = await res.json();
      self.postMessage({ type: 'CLAIM_HEART_RESULT', result: data, error: null });
    } catch (err) {
      self.postMessage({ type: 'CLAIM_HEART_RESULT', result: null, error: (err as Error).message });
    }
  }

  if (type === 'VERIFY_RETURN_HEARTS') {
    const payload_data = payload;
    try {
      const res = await fetch(`${PUPPYLOVE_POINT}/api/puppylove/users/verifyreturnhearts`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload_data),
      });
      const data = await res.json();
      self.postMessage({ type: 'VERIFY_RETURN_HEARTS_RESULT', result: data, error: null });
    } catch (err) {
      self.postMessage({ type: 'VERIFY_RETURN_HEARTS_RESULT', result: null, error: (err as Error).message });
    }
  }

  if (type === 'RETURN_LATE_HEARTS') {
    const payload_data = payload;
    try {
      const res = await fetch(`${PUPPYLOVE_POINT}/api/puppylove/special/returnclaimedheartlate`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload_data),
      });
      const data = await res.json();
      self.postMessage({ type: 'RETURN_LATE_HEARTS_RESULT', result: data, error: null });
    } catch (err) {
      self.postMessage({ type: 'RETURN_LATE_HEARTS_RESULT', result: null, error: (err as Error).message });
    }
  }

  if (type === 'FETCH_PUBLIC_KEYS') {
    try {
      const res = await fetch(`${PUPPYLOVE_POINT}/api/puppylove/users/fetchPublicKeys`, {
        method: 'GET',
        credentials: 'include',
      });
      const data = await res.json();
      self.postMessage({ type: 'FETCH_PUBLIC_KEYS_RESULT', result: data, error: null });
    } catch (err) {
      self.postMessage({ type: 'FETCH_PUBLIC_KEYS_RESULT', result: null, error: (err as Error).message });
    }
  }

  if (type === 'GET_USER_DATA') {
    try {
      const res = await fetch(`${PUPPYLOVE_POINT}/api/puppylove/users/data`, {
        method: 'GET',
        credentials: 'include',
      });
      const data = await res.json();
      console.log("📥 GET_USER_DATA worker received from API:", data);
      self.postMessage({ type: 'GET_USER_DATA_RESULT', result: data, error: null });
    } catch (err) {
      console.error("❌ GET_USER_DATA worker error:", err);
      self.postMessage({ type: 'GET_USER_DATA_RESULT', result: null, error: (err as Error).message });
    }
  }

  if (type === 'UPDATE_ABOUT') {
    const payload_data = payload;
    try {
      const res = await fetch(`${PUPPYLOVE_POINT}/api/puppylove/users/about`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload_data),
      });
      const data = await res.json();
      self.postMessage({ type: 'UPDATE_ABOUT_RESULT', result: data, error: null });
    } catch (err) {
      self.postMessage({ type: 'UPDATE_ABOUT_RESULT', result: null, error: (err as Error).message });
    }
  }

  if (type === 'UPDATE_INTERESTS') {
    const payload_data = payload;
    try {
      const res = await fetch(`${PUPPYLOVE_POINT}/api/puppylove/users/interests`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload_data),
      });
      const data = await res.json();
      self.postMessage({ type: 'UPDATE_INTERESTS_RESULT', result: data, error: null });
    } catch (err) {
      self.postMessage({ type: 'UPDATE_INTERESTS_RESULT', result: null, error: (err as Error).message });
    }
  }

  if (type === 'PUBLISH_PROFILE') {
    try {
      const res = await fetch(`${PUPPYLOVE_POINT}/api/puppylove/users/publish`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      self.postMessage({ type: 'PUBLISH_PROFILE_RESULT', result: data, error: null });
    } catch (err) {
      self.postMessage({ type: 'PUBLISH_PROFILE_RESULT', result: null, error: (err as Error).message });
    }
  }

  if (type === 'GET_MY_MATCHES') {
    try {
      const res = await fetch(`${PUPPYLOVE_POINT}/api/puppylove/users/mymatches`, {
        method: 'GET',
        credentials: 'include',
      });
      const data = await res.json();
      self.postMessage({ type: 'GET_MY_MATCHES_RESULT', result: data, error: null });
    } catch (err) {
      self.postMessage({ type: 'GET_MY_MATCHES_RESULT', result: null, error: (err as Error).message });
    }
  }

  if (type === 'SENT_HEART_DECODED') {
    const payload_data = payload;
    try {
      const res = await fetch(`${PUPPYLOVE_POINT}/api/puppylove/users/sentHeartDecoded`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload_data),
      });
      const data = await res.json();
      self.postMessage({ type: 'SENT_HEART_DECODED_RESULT', result: data, error: null });
    } catch (err) {
      self.postMessage({ type: 'SENT_HEART_DECODED_RESULT', result: null, error: (err as Error).message });
    }
  }

  // Send Heart with full encryption flow
  if (type === 'PREPARE_SEND_HEART') {
    const { senderPublicKey, senderPrivateKey, receiverPublicKey, senderRollNo, receiverRollNo, gender } = payload;
    try {
      // Step 1: Order IDs (smaller ID first for consistency)
      const orderedIds = [senderRollNo, receiverRollNo].sort();
      const R1 = orderedIds[0];
      const R2 = orderedIds[1];

      // Step 2: Create 4 hearts with proper encryption
      const hearts = [];
      for (let i = 0; i < 4; i++) {
        // A. Create Plain Text ID: R1-R2-128charRandomString
        const randomString = generateRandomString(128);
        const id_plain = `${R1}-${R2}-${randomString}`;

        // B. Generate SHA256 Hash of the plain text ID
        const sha = await SHA256(id_plain);

        // C. Create THREE Encrypted Versions:
        // 1. id_encrypt: Encrypt id_plain with YOUR public key (your record)
        const id_encrypt = await Encryption(id_plain, senderPublicKey);

        // 2. sha_encrypt: Encrypt sha with YOUR private key using AES (your signature)
        const sha_encrypt = await Encryption_AES(sha, senderPrivateKey);

        // 3. enc: Encrypt sha with RECEIVER's public key (they receive this)
        const enc = await Encryption(sha, receiverPublicKey);

        hearts.push({ 
          id_plain,
          sha,
          id_encrypt,    // Your record (encrypted with your public key)
          sha_encrypt,   // Your signature (encrypted with your private key)
          enc            // Receiver's heart (encrypted with their public key)
        });
      }

      self.postMessage({ 
        type: 'PREPARE_SEND_HEART_RESULT', 
        result: { hearts, senderRollNo, receiverRollNo, gender }, 
        error: null 
      });
    } catch (err) {
      self.postMessage({ type: 'PREPARE_SEND_HEART_RESULT', result: null, error: (err as Error).message });
    }
  }

  // Generate RSA key pair for first-time login
  if (type === 'GENERATE_KEYS') {
    try {
      const keys = await GenerateKeys();
      self.postMessage({ type: 'GENERATE_KEYS_RESULT', result: keys, error: null });
    } catch (err) {
      self.postMessage({ type: 'GENERATE_KEYS_RESULT', result: null, error: (err as Error).message });
    }
  }

  // Encrypt private key with password using AES
  if (type === 'ENCRYPT_PRIVATE_KEY') {
    const { privateKey, password } = payload;
    try {
      const encryptedPrivateKey = await Encryption_AES(privateKey, password);
      self.postMessage({ type: 'ENCRYPT_PRIVATE_KEY_RESULT', result: encryptedPrivateKey, error: null });
    } catch (err) {
      self.postMessage({ type: 'ENCRYPT_PRIVATE_KEY_RESULT', result: null, error: (err as Error).message });
    }
  }

  // Decrypt private key with password using AES
  if (type === 'DECRYPT_PRIVATE_KEY') {
    const { encryptedPrivateKey, password } = payload;
    try {
      const privateKey = await Decryption_AES(encryptedPrivateKey, password);
      if (!privateKey) {
        self.postMessage({ type: 'DECRYPT_PRIVATE_KEY_RESULT', result: null, error: 'Invalid password' });
        return;
      }
      self.postMessage({ type: 'DECRYPT_PRIVATE_KEY_RESULT', result: privateKey, error: null });
    } catch (err) {
      self.postMessage({ type: 'DECRYPT_PRIVATE_KEY_RESULT', result: null, error: 'Invalid password' });
    }
  }

  // First-time login with key generation
  if (type === 'FIRST_LOGIN') {
    const { rollNo, password, authCode, publicKey, encryptedPrivateKey, data } = payload;
    try {
      const passHash = await SHA256(password);
      const res = await fetch(`${PUPPYLOVE_POINT}/api/puppylove/users/login/first`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roll: rollNo,
          authCode,
          passHash,
          pubKey: publicKey,
          privKey: encryptedPrivateKey,
          data: data || '',
        }),
      });
      
      const text = await res.text();
      let result;
      try {
        result = JSON.parse(text);
      } catch {
        console.error("Failed to parse response:", text);
        self.postMessage({ type: 'FIRST_LOGIN_RESULT', result: null, error: `Server error: ${text}` });
        return;
      }
      
      if (!res.ok) {
        self.postMessage({ type: 'FIRST_LOGIN_RESULT', result: null, error: result.error || 'First login failed' });
        return;
      }
      self.postMessage({ type: 'FIRST_LOGIN_RESULT', result, error: null });
    } catch (err) {
      self.postMessage({ type: 'FIRST_LOGIN_RESULT', result: null, error: (err as Error).message });
    }
  }

  // Calculate Jaccard similarity between users' interests for "Suggest Match" feature
  if (type === 'CALCULATE_SIMILAR_USERS') {
    const { myInterests, allProfiles, excludeRolls, limit } = payload;
    try {
      // myInterests: string[] - current user's interests
      // allProfiles: Record<string, { about: string; interests: string[] }> - all user profiles
      // excludeRolls: string[] - rollNos to exclude (e.g., already sent hearts to)
      // limit: number - max number of suggestions to return

      // Jaccard similarity: |A ∩ B| / |A ∪ B|
      const calculateJaccard = (arrA: string[], arrB: string[]): number => {
        if (arrA.length === 0 && arrB.length === 0) return 0;
        
        const setB = new Set(arrB);
        let intersection = 0;
        for (let i = 0; i < arrA.length; i++) {
          if (setB.has(arrA[i])) intersection++;
        }
        
        // Union = |A| + |B| - |intersection|
        const uniqueA = new Set(arrA);
        const union = uniqueA.size + setB.size - intersection;
        return union === 0 ? 0 : intersection / union;
      };

      const myInterestsArr: string[] = (myInterests || []).map((i: string) => i.toLowerCase().trim());
      const excludeSet = new Set<string>(excludeRolls || []);
      
      const similarities: Array<{ rollNo: string; score: number; interests: string[] }> = [];
      
      const profileEntries = Object.entries(allProfiles || {});
      for (let i = 0; i < profileEntries.length; i++) {
        const [rollNo, profile] = profileEntries[i];
        if (excludeSet.has(rollNo)) continue;
        
        const profileData = profile as { about: string; interests: string[] };
        if (!profileData.interests || profileData.interests.length === 0) continue;
        
        const theirInterestsArr: string[] = profileData.interests.map((int: string) => int.toLowerCase().trim());
        const score = calculateJaccard(myInterestsArr, theirInterestsArr);
        
        if (score > 0) {
          similarities.push({
            rollNo,
            score,
            interests: profileData.interests,
          });
        }
      }
      
      // Sort by score descending, take top N
      similarities.sort((a, b) => b.score - a.score);
      const topMatches = similarities.slice(0, limit || 10);
      
      self.postMessage({ 
        type: 'CALCULATE_SIMILAR_USERS_RESULT', 
        result: topMatches, 
        error: null 
      });
    } catch (err) {
      self.postMessage({ type: 'CALCULATE_SIMILAR_USERS_RESULT', result: null, error: (err as Error).message });
    }
  }
});