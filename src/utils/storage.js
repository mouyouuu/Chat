const STORAGE_SECRET_KEY = 'unified-chat-local-secret-v1';
const FALLBACK_PREFIX = 'plain:';
const ENCRYPTED_PREFIX = 'aes-gcm:';
const SALT = 'unified-chat-settings-v1';

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function hasWebCrypto() {
  return Boolean(window.crypto?.subtle && window.crypto?.getRandomValues);
}

function bytesToBase64(bytes) {
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return window.btoa(binary);
}

function base64ToBytes(value) {
  const binary = window.atob(value);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

function getOrCreateSecret() {
  const envSecret = import.meta.env.VITE_STORAGE_SECRET;

  if (envSecret) {
    return envSecret;
  }

  const existing = window.localStorage.getItem(STORAGE_SECRET_KEY);

  if (existing) {
    return existing;
  }

  const randomBytes = new Uint8Array(32);
  window.crypto.getRandomValues(randomBytes);
  const nextSecret = bytesToBase64(randomBytes);
  window.localStorage.setItem(STORAGE_SECRET_KEY, nextSecret);
  return nextSecret;
}

async function deriveKey(secret) {
  const material = await window.crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    'PBKDF2',
    false,
    ['deriveKey'],
  );

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode(SALT),
      iterations: 120000,
      hash: 'SHA-256',
    },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

async function encrypt(value) {
  if (!hasWebCrypto()) {
    return `${FALLBACK_PREFIX}${window.btoa(unescape(encodeURIComponent(JSON.stringify(value))))}`;
  }

  const iv = new Uint8Array(12);
  window.crypto.getRandomValues(iv);
  const key = await deriveKey(getOrCreateSecret());
  const payload = encoder.encode(JSON.stringify(value));
  const encrypted = await window.crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, payload);

  return `${ENCRYPTED_PREFIX}${JSON.stringify({
    iv: bytesToBase64(iv),
    data: bytesToBase64(new Uint8Array(encrypted)),
  })}`;
}

async function decrypt(payload) {
  if (payload.startsWith(FALLBACK_PREFIX)) {
    return JSON.parse(decodeURIComponent(escape(window.atob(payload.slice(FALLBACK_PREFIX.length)))));
  }

  if (!payload.startsWith(ENCRYPTED_PREFIX)) {
    return JSON.parse(payload);
  }

  if (!hasWebCrypto()) {
    throw new Error('Web Crypto API indisponible dans ce navigateur.');
  }

  const envelope = JSON.parse(payload.slice(ENCRYPTED_PREFIX.length));
  const key = await deriveKey(getOrCreateSecret());
  const decrypted = await window.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: base64ToBytes(envelope.iv) },
    key,
    base64ToBytes(envelope.data),
  );

  return JSON.parse(decoder.decode(decrypted));
}

export async function loadEncryptedItem(key, fallbackValue) {
  const raw = window.localStorage.getItem(key);

  if (!raw) {
    return fallbackValue;
  }

  try {
    return await decrypt(raw);
  } catch (error) {
    console.warn('Impossible de lire les paramètres locaux.', error);
    return fallbackValue;
  }
}

export async function saveEncryptedItem(key, value) {
  const encrypted = await encrypt(value);
  window.localStorage.setItem(key, encrypted);
}

export function clearEncryptedItem(key) {
  window.localStorage.removeItem(key);
}
