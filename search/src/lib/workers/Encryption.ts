import CryptoJS from 'crypto-js';

export async function SHA256(password: string) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password) as BufferSource;
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const passHash = hashArray
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
  return passHash;
}

export async function GenerateKeys() {
  const keyPair = await crypto.subtle.generateKey(
    {
      name: 'RSA-OAEP',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256',
    },
    true,
    ['encrypt', 'decrypt']
  );

  const publicKey = await crypto.subtle.exportKey('spki', keyPair.publicKey);
  const privateKey = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey);

  const pubKeyBuffer = Buffer.from(publicKey);
  const privKeyBuffer = Buffer.from(privateKey);

  return {
    pubKey: pubKeyBuffer.toString('base64'),
    privKey: privKeyBuffer.toString('base64'),
  };
}

export async function Encryption(SHA: string, publicKey: string) {
  const publicKeyBuffer = Buffer.from(publicKey, 'base64');
  const publicKeyImported = await crypto.subtle.importKey(
    'spki',
    publicKeyBuffer as BufferSource,
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    false,
    ['encrypt']
  );

  const encodedData = new TextEncoder().encode(SHA) as BufferSource;
  const encryptedArrayBuffer = await crypto.subtle.encrypt(
    { name: 'RSA-OAEP' },
    publicKeyImported,
    encodedData
  );

  const encryptedBuffer = Buffer.from(encryptedArrayBuffer);
  return encryptedBuffer.toString('base64');
}

export async function Decryption(ENC: string, privateKey: string) {
  try {
    const privateKeyBuffer = Buffer.from(privateKey, 'base64');
    const privateKeyImported = await crypto.subtle.importKey(
      'pkcs8',
      privateKeyBuffer as BufferSource,
      { name: 'RSA-OAEP', hash: 'SHA-256' },
      false,
      ['decrypt']
    );

    const encryptedData = Buffer.from(ENC, 'base64');
    const decryptedArrayBuffer = await crypto.subtle.decrypt(
      { name: 'RSA-OAEP' },
      privateKeyImported,
      encryptedData as BufferSource
    );

    return new TextDecoder().decode(decryptedArrayBuffer);
  } catch (err) {
    return 'Fail';
  }
}

// AES encryption of pvtKey using password
export async function Encryption_AES(privateKey: string, pass: string) {
  const encrypted = CryptoJS.AES.encrypt(privateKey, pass);
  return encrypted.toString();
}

// AES decryption of pvtKey using password
export async function Decryption_AES(ENC: string, pass: string) {
  const decrypted = CryptoJS.AES.decrypt(ENC, pass);
  return decrypted.toString(CryptoJS.enc.Utf8);
}

export function RandInt() {
  const randomBytes = new Uint32Array(1);
  crypto.getRandomValues(randomBytes);
  return randomBytes[0];
}

export const generateRandomString = (length: number): string => {
  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const values = crypto.getRandomValues(new Uint8Array(length));
  let result = '';
  for (let i = 0; i < length; i++) {
    result += possible[values[i] % possible.length];
  }
  return result;
};

