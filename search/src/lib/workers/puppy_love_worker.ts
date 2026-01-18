import { Decryption, Decryption_AES, SHA256, Encryption, Encryption_AES, RandInt, generateRandomString } from './Encryption';

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
});