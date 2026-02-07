import CryptoJS from 'crypto-js';

export async function SHA256(password: string) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
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

//   return {
//   pubKey: btoa(pubKeyArray.map(b => String.fromCharCode(b)).join('')),
//   privKey: btoa(privKeyArray.map(b => String.fromCharCode(b)).join('')),
// };

  return {
    pubKey: Buffer.from(publicKey).toString('base64'),
    privKey: Buffer.from(privateKey).toString('base64'),
  };
}

export async function Encryption(SHA: string, publicKey: string) {
  // const publicKeyBuffer = new Uint8Array(binaryString.length);
  // for (let i = 0; i < binaryString.length; i++) {
  //   publicKeyBuffer[i] = binaryString.charCodeAt(i);
  // }
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
  // const encryptedArray = Array.from(new Uint8Array(encryptedArrayBuffer));
  // return btoa(encryptedArray.map(b => String.fromCharCode(b)).join(''));
  return Buffer.from(encryptedArrayBuffer).toString('base64');
}

export async function Decryption(ENC: string, privateKey: string) {
  try {
    // const binaryString = atob(privateKey);
    // const privateKeyBuffer = new Uint8Array(binaryString.length);
    // for (let i = 0; i < binaryString.length; i++) {
    //   privateKeyBuffer[i] = binaryString.charCodeAt(i);
    // }
    const privateKeyBuffer = Buffer.from(privateKey, 'base64') as BufferSource;
    const privateKeyImported = await crypto.subtle.importKey(
      'pkcs8',
      privateKeyBuffer,
      { name: 'RSA-OAEP', hash: 'SHA-256' },
      false,
      ['decrypt']
    );

    // const encBinaryString = atob(ENC);
    // const encryptedData = new Uint8Array(encBinaryString.length);
    // for (let i = 0; i < encBinaryString.length; i++) {
    //   encryptedData[i] = encBinaryString.charCodeAt(i);
    // }
    const encryptedData = Buffer.from(ENC, 'base64') as BufferSource;
    const decryptedArrayBuffer = await crypto.subtle.decrypt(
      { name: 'RSA-OAEP' },
      privateKeyImported,
      encryptedData
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

export async function RandInt() {
  const randomBytes = new Uint32Array(1);
  crypto.getRandomValues(randomBytes);
  return randomBytes[0];
}

export const generateRandomString = (length: number): string => {
  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const values = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(values, (x) => possible[x % possible.length]).join("");
};

