export let puppyLoveWorker: Worker | null = null;

export const initPuppyLoveWorker = () => {
  if (!puppyLoveWorker) {
    puppyLoveWorker = new Worker(
      new URL('@/lib/workers/puppy_love_worker.ts', import.meta.url)
    );

    puppyLoveWorker.onmessage = (e) => {
      const { type, results, error } = e.data;
      console.log('[PuppyLove Worker]', type, results, error); 
    };

    puppyLoveWorker.onerror = (err) => {
      console.error('[PuppyLove Worker Error]', err);
    };

    
    puppyLoveWorker.postMessage({ type: 'START_PUPPY_LOVE', payload: {} });
  }
  return puppyLoveWorker;
};

// Promise-based SHA256 hashing
export const hashPassword = (data: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!puppyLoveWorker) {
      reject('Worker not initialized');
      return;
    }
    const worker = puppyLoveWorker;
    
    const handler = (e: MessageEvent) => {
      if (e.data.type === 'SHA256_RESULT') {
        worker.removeEventListener('message', handler);
        e.data.error ? reject(e.data.error) : resolve(e.data.result);
      }
    };
    worker.addEventListener('message', handler);
    worker.postMessage({ type: 'SHA256', payload: { data } });
  });
};

export const decryptAES = (encrypted: string, password: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!puppyLoveWorker) {
      reject('Worker not initialized');
      return;
    }
    const worker = puppyLoveWorker;
    
    const handler = (e: MessageEvent) => {
      if (e.data.type === 'DECRYPTED_AES') {
        worker.removeEventListener('message', handler);
        e.data.error ? reject(e.data.error) : resolve(e.data.result);
      }
    };
    worker.addEventListener('message', handler);
    worker.postMessage({ type: 'DECRYPT_AES', payload: { encrypted, password } });
  });
};
