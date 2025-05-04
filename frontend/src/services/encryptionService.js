import config from '../../config'; // Adjust path if needed

const algorithm = 'AES-CBC';
const PINATA_SECRET_API_KEY = config.ipfs?.pinataSecretApiKey || process.env.REACT_APP_PINATA_SECRET_API_KEY;

if (!PINATA_SECRET_API_KEY) {
  throw new Error('PINATA_SECRET_API_KEY is not defined in config or environment variables');
}

// Derive key using PBKDF2
async function deriveKey(password, salt) {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode(salt),
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-CBC', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
}

export async function encrypt(data) {
  try {
    const encoder = new TextEncoder();
    const iv = crypto.getRandomValues(new Uint8Array(16));
    const key = await deriveKey(PINATA_SECRET_API_KEY, 'salt');
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-CBC', iv },
      key,
      encoder.encode(JSON.stringify(data))
    );
    return {
      iv: Array.from(new Uint8Array(iv))
        .map(b => b.toString(16).padStart(2, '0'))
        .join(''),
      encryptedData: Array.from(new Uint8Array(encrypted))
        .map(b => b.toString(16).padStart(2, '0'))
        .join(''),
    };
  } catch (error) {
    console.error('Encryption failed:', error.message);
    throw new Error('Failed to encrypt data');
  }
}

export async function decrypt(encryptedData, ivHex) {
  try {
    const decoder = new TextDecoder();
    const key = await deriveKey(PINATA_SECRET_API_KEY, 'salt');
    const iv = new Uint8Array(ivHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
    const encrypted = new Uint8Array(encryptedData.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-CBC', iv },
      key,
      encrypted
    );
    return JSON.parse(decoder.decode(decrypted));
  } catch (error) {
    console.error('Decryption failed:', error.message);
    throw new Error('Failed to decrypt data');
  }
}