import { Decryption, Decryption_AES, SHA256, Encryption, Encryption_AES, RandInt, generateRandomString, GenerateKeys } from './Encryption';
import { PUPPYLOVE_POINT } from "@/lib/constant";
import { setClaims, setData } from './utils';

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

  // TODO: The function is identically same to the DECRYPT_HEARTS
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

  // TODO: the sha, rand_int, etc functions do not need worker to be used, later correct this.
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
    const payload_data = payload.hearts;
    const body = JSON.stringify({
        hearts: {
          heart1: {
            sha_encrypt: payload_data[0]?.sha_encrypt ?? '',
            id_encrypt: payload_data[0]?.id_encrypt ?? '',
            songID_enc: payload_data[0]?.songID_enc ?? '',
          },
          heart2: {
            sha_encrypt: payload_data[1]?.sha_encrypt ?? '',
            id_encrypt: payload_data[1]?.id_encrypt ?? '',
            songID_enc: payload_data[1]?.songID_enc ?? '',
          },
          heart3: {
            sha_encrypt: payload_data[2]?.sha_encrypt ?? '',
            id_encrypt: payload_data[2]?.id_encrypt ?? '',
            songID_enc: payload_data[2]?.songID_enc ?? '',
          },
          heart4: {
            sha_encrypt: payload_data[3]?.sha_encrypt ?? '',
            id_encrypt: payload_data[3]?.id_encrypt ?? '',
            songID_enc: payload_data[3]?.songID_enc ?? '',
          },
        },
      })
    try {
      const res = await fetch(`${PUPPYLOVE_POINT}/api/puppylove/users/sendheartVirtual`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: body,
      });
      const data = await res.json();
      console.log("SEND_VIRTUAL_HEART response status:", res.status);
      console.log("SEND_VIRTUAL_HEART response:", data);
      
      if (res.status === 400) {
        self.postMessage({ type: 'SEND_VIRTUAL_HEART_RESULT', result: data, error: data?.error || 'Failed to send virtual heart' });
        return;
      }
      
      self.postMessage({ type: 'SEND_VIRTUAL_HEART_RESULT', result: data, error: null });
    } catch (err) {
      console.error("SEND_VIRTUAL_HEART error:", err);
      self.postMessage({ type: 'SEND_VIRTUAL_HEART_RESULT', result: null, error: (err as Error).message });
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
          console.log(`Attempting to decrypt heart: enc ${heart.enc}, genderOfSender ${heart.genderOfSender}, \n pvtKey ${privateKey}`);
          const sha = await Decryption(heart.enc, privateKey);
          console.log(`Decrypted heart: enc ${heart.enc}, sha ${sha}, genderOfSender ${heart.genderOfSender}`);
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
    const { privateKey: privKey, puppyLoveHeartsSent } = payload || {};
    try {
      const res = await fetch(`${PUPPYLOVE_POINT}/api/puppylove/users/fetchReturnHearts`, {
        method: 'GET',
        credentials: 'include',
      });
      const data = await res.json();
      // TODO: commented cause its giving bugs

      if (!Array.isArray(data) || data.length === 0 || !privKey || !puppyLoveHeartsSent) {
        console.warn('No return hearts found or missing private key/sent hearts data');
        self.postMessage({ type: 'FETCH_RETURN_HEARTS_RESULT', result: { returnHearts: data, matches: [] }, error: null });
        return;
      }

      // Parse sent hearts if it's a string
      let sentHearts = puppyLoveHeartsSent;

      const matchResults: any[] = [];
      await Promise.all(
        data.map(async (elem: any) => {
          const encoded_sha = elem.enc;
          // Decrypt enc with private key (RSA) to get the SHA
          console.log(`Decrypted returned heart: enc ${encoded_sha}, pvtKey ${privKey}`);
          const sha = await Decryption(encoded_sha, privKey);
          if (sha === 'Fail' || !sha) {
            console.error(`Failed to decrypt returned heart: enc ${encoded_sha}`);
            return;
          } 
          console.log(`Decrypted returned heart: enc ${encoded_sha}, sha ${sha}`);
          // Check against each of our sent hearts
          for (const key in sentHearts) {
            console.log("reached inside loop: ", key)
            const heart = sentHearts[key];
            if (!heart || !heart.sha_encrypt || !heart.id_encrypt) continue;

            // Decrypt sha_encrypt with private key (AES) to get our stored SHA
            const my_sha = await Decryption_AES(heart.sha_encrypt, privKey);
            console.log(`Comparing with sent heart \n\n ${key}: \n\nmy_sha ${my_sha},\n\n returned sha ${sha}`);
            if (my_sha === sha) {
              // Match found — decrypt id_encrypt to get the secret (id_plain)
              const id_plain = await Decryption(heart.id_encrypt, privKey);
              if (!id_plain || id_plain === 'Fail') continue;
              console.log(`Match found for heart ${key}: SHA ${sha}, ID ${id_plain}`);
              // Call verifyreturnhearts to register the match on server
              self.postMessage({ type: 'VERIFY_RETURN_HEARTS', payload: {encoded_sha, id_plain}}); // Optional: indicate verification started
              try {
                const verifyRes = await fetch(`${PUPPYLOVE_POINT}/api/puppylove/users/verifyreturnhearts`, {
                  method: 'POST',
                  credentials: 'include',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ enc: encoded_sha, secret: id_plain }),
                });
                const verifyData = await verifyRes.json();
                matchResults.push({ key, sha, verified: verifyData });
              } catch (verifyErr) {
                console.error('Error verifying return heart:', verifyErr);
              }
              break; // Found the matching sent heart, no need to check others
            }
          }
        })
      );
      
      self.postMessage({ type: 'FETCH_RETURN_HEARTS_RESULT', result: { returnHearts: data, matches: matchResults }, error: null });
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
    const {encoded_sha, id_plain} = payload;
    try {
      const res = await fetch(`${PUPPYLOVE_POINT}/api/puppylove/users/verifyreturnhearts`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({enc: encoded_sha, secret: id_plain}),
      });
      const data = await res.json();
      console.log("match; ", id_plain)
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
      const rawPrivateKey = payload?.privateKey ?? null;
      const decryptedReceiverIds = await setData(data.data, rawPrivateKey, data.id);
      console.log("Decrypted Receiver IDs in GET_USER_DATA:", decryptedReceiverIds);
      let claimsArray = await setClaims(data.claims);
      self.postMessage({ type: 'GET_USER_DATA_RESULT', result: { ...data, receiverIds: decryptedReceiverIds, claimsArray }, error: null });
    } catch (err) {
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
    const { senderPublicKey,
    senderPrivateKey,
    puppyLovePublicKeys,
    senderRollNo,
    receiverIds } = payload;

    try {
      const encList: string[] = [];
      const shaList: string[] = [];
      const sha_encryptList: string[] = [];
      const ids_encryptList: string[] = [];
      const hearts = [];

      // Step 1: Order IDs (smaller ID first for consistency)
      for (const id of receiverIds){
        if (id === '') {
          encList.push('');
          shaList.push('');
          ids_encryptList.push('');
          sha_encryptList.push('');
          continue;
        }
        const orderedIds = [senderRollNo, id].sort();
        const R1 = orderedIds[0];
        const R2 = orderedIds[1];
        // Step 2: Create 4 hearts with proper encryption
          // A. Create Plain Text ID: R1-R2-128charRandomString
        const randomString = generateRandomString(128);
        const id_plain = `${R1}-${R2}-${randomString}`;

        // B. Generate SHA256 Hash of the plain text ID
        const shaHash = await SHA256(id_plain);

        // C. Create THREE Encrypted Versions:
        // 1. id_encrypt: Encrypt id_plain with YOUR public key (your record)
        const id_encrypt = await Encryption(id_plain, senderPublicKey);

        // 2. sha_encrypt: Encrypt shaHash with YOUR private key using AES (your signature)
        const sha_encrypt = await Encryption_AES(shaHash, senderPrivateKey);

        let receiverPublicKey = puppyLovePublicKeys[id];
        // 3. encHeart: Encrypt shaHash with RECEIVER's public key (they receive this)
        const encHeart = await Encryption(shaHash, receiverPublicKey);
        console.log(`Prepared heart for receiver ${id} with PUBLICKEY=${receiverPublicKey}: id_plain ${id_plain}, shaHash ${shaHash}, id_encrypt ${id_encrypt}, sha_encrypt ${sha_encrypt}, encHeart ${encHeart}`);
        hearts.push({ 
          id_plain,
          shaHash,
          id_encrypt,    // Your record (encrypted with your public key)
          sha_encrypt,   // Your signature (encrypted with your private key)
          encHeart       // Receiver's heart (encrypted with their public key)
        });
      }
    

      self.postMessage({ 
        type: 'PREPARE_SEND_HEART_RESULT', 
        result: { hearts }, 
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
    const { myInterests, allProfiles, excludeRolls} = payload;
    try {
      // myInterests: string[] - current user's interests
      // allProfiles: Record<string, string> - all user profiles
      // excludeRolls: string[] - rollNos to exclude (e.g., already sent hearts to)

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
      
      // allProfiles is Record<string, string> where value is comma-separated interests
      const profileEntries = Object.entries(allProfiles || {});
      for (let i = 0; i < profileEntries.length; i++) {
        const [rollNo, interestsStr] = profileEntries[i];
        if (excludeSet.has(rollNo)) continue;
        
        // Parse comma-separated interests string
        const interestsRaw = typeof interestsStr === 'string' ? interestsStr : '';
        if (!interestsRaw || interestsRaw.trim().length === 0) continue;
        
        const theirInterests = interestsRaw.split(',').map((s: string) => s.trim()).filter((s: string) => s.length > 0);
        if (theirInterests.length === 0) continue;
        
        const theirInterestsArr: string[] = theirInterests.map((int: string) => int.toLowerCase().trim());
        const score = calculateJaccard(myInterestsArr, theirInterestsArr);
        
        if (score > 0) {
          similarities.push({
            rollNo,
            score,
            interests: theirInterests,
          });
        }
      }
      
      // Sort by score descending, take top N
      similarities.sort((a, b) => b.score - a.score);
      const topMatches = similarities;
      
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