import {Platform} from 'react-native';
import {LIB_VERSION} from '../constants/version';
import {loadSettings, saveSettings} from './settingsStore';
import {
  ENC_MID,
  ENC_MID_IV,
  ENC_MID_TAG,
  ENC_SEC,
  ENC_SEC_IV,
  ENC_SEC_TAG,
  TELEMETRY_SALT,
} from '../constants/telemetryConfig';

// ─── Runtime AES-256-GCM Decryption ────────────────────────────────────────
// Credentials are encrypted at build time by scripts/gen-telemetry.js.
// The key is derived from public package metadata + salt using SHA-256.
// This prevents plain-text secrets from appearing in source code or npm tarball.

const PKG_NAME = 'react-native-inapp-inspector';
const PKG_REPO = 'git+https://github.com/vengatmacuser/react-native-inapp-inspector.git';

/**
 * SHA-256 hash (returns hex string). Works in React Native / Hermes
 * via a lightweight iterative implementation (no native crypto needed).
 */
function sha256Hex(input: string): string {
  // Lightweight SHA-256 for runtime key derivation.
  // Adapted from a minimal pure-JS implementation.
  const K = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1,
    0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
    0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786,
    0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147,
    0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
    0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b,
    0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a,
    0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
    0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ];

  function rr(n: number, x: number) {
    return ((n >>> x) | (n << (32 - x))) >>> 0;
  }

  // Convert string to UTF-8 bytes
  const bytes: number[] = [];
  for (let i = 0; i < input.length; i++) {
    const c = input.charCodeAt(i);
    if (c < 0x80) bytes.push(c);
    else if (c < 0x800) {
      bytes.push(0xc0 | (c >> 6), 0x80 | (c & 0x3f));
    } else {
      bytes.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 0x3f), 0x80 | (c & 0x3f));
    }
  }

  // Pre-processing: padding
  const bitLen = bytes.length * 8;
  bytes.push(0x80);
  while (bytes.length % 64 !== 56) bytes.push(0);
  // Append original length in bits as 64-bit big-endian
  for (let i = 56; i >= 0; i -= 8) {
    bytes.push((bitLen >>> i) & 0xff);
  }

  let h0 = 0x6a09e667, h1 = 0xbb67ae85, h2 = 0x3c6ef372, h3 = 0xa54ff53a;
  let h4 = 0x510e527f, h5 = 0x9b05688c, h6 = 0x1f83d9ab, h7 = 0x5be0cd19;

  for (let offset = 0; offset < bytes.length; offset += 64) {
    const w = new Array(64);
    for (let i = 0; i < 16; i++) {
      w[i] = ((bytes[offset + i * 4] << 24) | (bytes[offset + i * 4 + 1] << 16) |
        (bytes[offset + i * 4 + 2] << 8) | bytes[offset + i * 4 + 3]) >>> 0;
    }
    for (let i = 16; i < 64; i++) {
      const s0 = rr(w[i - 15], 7) ^ rr(w[i - 15], 18) ^ (w[i - 15] >>> 3);
      const s1 = rr(w[i - 2], 17) ^ rr(w[i - 2], 19) ^ (w[i - 2] >>> 10);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
    }
    let a = h0, b = h1, c = h2, d = h3, e = h4, f = h5, g = h6, h = h7;
    for (let i = 0; i < 64; i++) {
      const S1 = rr(e, 6) ^ rr(e, 11) ^ rr(e, 25);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (h + S1 + ch + K[i] + w[i]) >>> 0;
      const S0 = rr(a, 2) ^ rr(a, 13) ^ rr(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (S0 + maj) >>> 0;
      h = g; g = f; f = e; e = (d + temp1) >>> 0;
      d = c; c = b; b = a; a = (temp1 + temp2) >>> 0;
    }
    h0 = (h0 + a) >>> 0; h1 = (h1 + b) >>> 0; h2 = (h2 + c) >>> 0; h3 = (h3 + d) >>> 0;
    h4 = (h4 + e) >>> 0; h5 = (h5 + f) >>> 0; h6 = (h6 + g) >>> 0; h7 = (h7 + h) >>> 0;
  }

  function toHex(n: number) {
    return ('00000000' + n.toString(16)).slice(-8);
  }
  return toHex(h0) + toHex(h1) + toHex(h2) + toHex(h3) + toHex(h4) + toHex(h5) + toHex(h6) + toHex(h7);
}

function hexToBytes(hex: string): number[] {
  const bytes: number[] = [];
  for (let i = 0; i < hex.length; i += 2) {
    bytes.push(parseInt(hex.substring(i, i + 2), 16));
  }
  return bytes;
}

/**
 * AES-256-GCM decryption (pure JS for React Native / Hermes compatibility).
 * Uses a lightweight AES + GCM implementation that runs without native crypto.
 */
function aesGcmDecrypt(ctHex: string, ivHex: string, _tagHex: string, keyHex: string): string {
  // For React Native runtime where SubtleCrypto is unavailable,
  // we use AES-CTR mode (GCM's encryption layer) for decryption.
  // The auth tag was verified at build time; runtime skips tag verification
  // since we control both the encryption and decryption.
  const keyBytes = hexToBytes(keyHex);
  const ivBytes = hexToBytes(ivHex);
  const ctBytes = hexToBytes(ctHex);

  // ─── AES key expansion ───
  const Sbox = [
    0x63,0x7c,0x77,0x7b,0xf2,0x6b,0x6f,0xc5,0x30,0x01,0x67,0x2b,0xfe,0xd7,0xab,0x76,
    0xca,0x82,0xc9,0x7d,0xfa,0x59,0x47,0xf0,0xad,0xd4,0xa2,0xaf,0x9c,0xa4,0x72,0xc0,
    0xb7,0xfd,0x93,0x26,0x36,0x3f,0xf7,0xcc,0x34,0xa5,0xe5,0xf1,0x71,0xd8,0x31,0x15,
    0x04,0xc7,0x23,0xc3,0x18,0x96,0x05,0x9a,0x07,0x12,0x80,0xe2,0xeb,0x27,0xb2,0x75,
    0x09,0x83,0x2c,0x1a,0x1b,0x6e,0x5a,0xa0,0x52,0x3b,0xd6,0xb3,0x29,0xe3,0x2f,0x84,
    0x53,0xd1,0x00,0xed,0x20,0xfc,0xb1,0x5b,0x6a,0xcb,0xbe,0x39,0x4a,0x4c,0x58,0xcf,
    0xd0,0xef,0xaa,0xfb,0x43,0x4d,0x33,0x85,0x45,0xf9,0x02,0x7f,0x50,0x3c,0x9f,0xa8,
    0x51,0xa3,0x40,0x8f,0x92,0x9d,0x38,0xf5,0xbc,0xb6,0xda,0x21,0x10,0xff,0xf3,0xd2,
    0xcd,0x0c,0x13,0xec,0x5f,0x97,0x44,0x17,0xc4,0xa7,0x7e,0x3d,0x64,0x5d,0x19,0x73,
    0x60,0x81,0x4f,0xdc,0x22,0x2a,0x90,0x88,0x46,0xee,0xb8,0x14,0xde,0x5e,0x0b,0xdb,
    0xe0,0x32,0x3a,0x0a,0x49,0x06,0x24,0x5c,0xc2,0xd3,0xac,0x62,0x91,0x95,0xe4,0x79,
    0xe7,0xc8,0x37,0x6d,0x8d,0xd5,0x4e,0xa9,0x6c,0x56,0xf4,0xea,0x65,0x7a,0xae,0x08,
    0xba,0x78,0x25,0x2e,0x1c,0xa6,0xb4,0xc6,0xe8,0xdd,0x74,0x1f,0x4b,0xbd,0x8b,0x8a,
    0x70,0x3e,0xb5,0x66,0x48,0x03,0xf6,0x0e,0x61,0x35,0x57,0xb9,0x86,0xc1,0x1d,0x9e,
    0xe1,0xf8,0x98,0x11,0x69,0xd9,0x8e,0x94,0x9b,0x1e,0x87,0xe9,0xce,0x55,0x28,0xdf,
    0x8c,0xa1,0x89,0x0d,0xbf,0xe6,0x42,0x68,0x41,0x99,0x2d,0x0f,0xb0,0x54,0xbb,0x16,
  ];

  const Rcon = [0x01,0x02,0x04,0x08,0x10,0x20,0x40,0x80,0x1b,0x36];

  // Key schedule for AES-256
  const Nk = 8, Nr = 14;
  const expandedKey = new Uint8Array(4 * 4 * (Nr + 1));
  for (let i = 0; i < 32; i++) expandedKey[i] = keyBytes[i];

  for (let i = Nk; i < 4 * (Nr + 1); i++) {
    const t = expandedKey.slice((i - 1) * 4, i * 4);
    if (i % Nk === 0) {
      const tmp = t[0];
      t[0] = Sbox[t[1]] ^ Rcon[i / Nk - 1];
      t[1] = Sbox[t[2]];
      t[2] = Sbox[t[3]];
      t[3] = Sbox[tmp];
    } else if (Nk > 6 && i % Nk === 4) {
      t[0] = Sbox[t[0]]; t[1] = Sbox[t[1]]; t[2] = Sbox[t[2]]; t[3] = Sbox[t[3]];
    }
    for (let j = 0; j < 4; j++) {
      expandedKey[i * 4 + j] = expandedKey[(i - Nk) * 4 + j] ^ t[j];
    }
  }

  // AES single-block encryption (for CTR mode counter blocks)
  function aesEncryptBlock(block: Uint8Array): Uint8Array {
    const state = new Uint8Array(16);
    for (let i = 0; i < 16; i++) state[i] = block[i] ^ expandedKey[i];

    for (let round = 1; round <= Nr; round++) {
      // SubBytes
      for (let i = 0; i < 16; i++) state[i] = Sbox[state[i]];
      // ShiftRows
      let t = state[1]; state[1] = state[5]; state[5] = state[9]; state[9] = state[13]; state[13] = t;
      t = state[2]; state[2] = state[10]; state[10] = t; t = state[6]; state[6] = state[14]; state[14] = t;
      t = state[15]; state[15] = state[11]; state[11] = state[7]; state[7] = state[3]; state[3] = t;
      // MixColumns (skip on last round)
      if (round < Nr) {
        for (let c = 0; c < 4; c++) {
          const s0 = state[c*4], s1 = state[c*4+1], s2 = state[c*4+2], s3 = state[c*4+3];
          const xtime = (v: number) => ((v << 1) ^ ((v & 0x80) ? 0x1b : 0)) & 0xff;
          state[c*4]   = xtime(s0) ^ xtime(s1) ^ s1 ^ s2 ^ s3;
          state[c*4+1] = s0 ^ xtime(s1) ^ xtime(s2) ^ s2 ^ s3;
          state[c*4+2] = s0 ^ s1 ^ xtime(s2) ^ xtime(s3) ^ s3;
          state[c*4+3] = xtime(s0) ^ s0 ^ s1 ^ s2 ^ xtime(s3);
        }
      }
      // AddRoundKey
      const rkOffset = round * 16;
      for (let i = 0; i < 16; i++) state[i] ^= expandedKey[rkOffset + i];
    }
    return state;
  }

  // ─── AES-CTR decryption (GCM uses CTR internally) ───
  // Build initial counter block: IV (12 bytes) + counter (4 bytes, starts at 2 for GCM)
  const result: number[] = [];
  let counter = 2; // GCM starts CTR at 2 for ciphertext (1 is used for tag)

  for (let i = 0; i < ctBytes.length; i += 16) {
    const counterBlock = new Uint8Array(16);
    for (let j = 0; j < 12; j++) counterBlock[j] = ivBytes[j];
    counterBlock[12] = (counter >>> 24) & 0xff;
    counterBlock[13] = (counter >>> 16) & 0xff;
    counterBlock[14] = (counter >>> 8) & 0xff;
    counterBlock[15] = counter & 0xff;
    counter++;

    const keystream = aesEncryptBlock(counterBlock);
    const blockLen = Math.min(16, ctBytes.length - i);
    for (let j = 0; j < blockLen; j++) {
      result.push(ctBytes[i + j] ^ keystream[j]);
    }
  }

  return String.fromCharCode(...result);
}

// ─── Lazy-initialized credentials ──────────────────────────────────────────
let _cachedMid: string | null = null;
let _cachedSec: string | null = null;

function getCredentials(): {measurementId: string; apiSecret: string} {
  if (_cachedMid !== null && _cachedSec !== null) {
    return {measurementId: _cachedMid, apiSecret: _cachedSec};
  }

  if (!ENC_MID || !ENC_SEC || !TELEMETRY_SALT) {
    _cachedMid = '';
    _cachedSec = '';
    return {measurementId: '', apiSecret: ''};
  }

  try {
    const keyMaterial = `${PKG_NAME}::${TELEMETRY_SALT}::${PKG_REPO}`;
    const keyHex = sha256Hex(keyMaterial);
    _cachedMid = aesGcmDecrypt(ENC_MID, ENC_MID_IV, ENC_MID_TAG, keyHex);
    _cachedSec = aesGcmDecrypt(ENC_SEC, ENC_SEC_IV, ENC_SEC_TAG, keyHex);
  } catch {
    _cachedMid = '';
    _cachedSec = '';
  }

  return {measurementId: _cachedMid, apiSecret: _cachedSec};
}

function getCollectUrl(): string {
  const {measurementId, apiSecret} = getCredentials();
  if (!measurementId || !apiSecret) return '';
  return `https://www.google-analytics.com/mp/collect?measurement_id=${measurementId}&api_secret=${apiSecret}`;
}

// ─── Telemetry State ────────────────────────────────────────────────────────

const PING_INTERVAL_MS = 24 * 60 * 60 * 1000;

let isTelemetryEnabled = true;

export function setTelemetryEnabled(enabled: boolean): void {
  isTelemetryEnabled = enabled;
}

async function getOrCreateClientId(): Promise<string> {
  try {
    const settings = await loadSettings();
    if (settings.telemetryClientId) {
      return settings.telemetryClientId;
    }
    const part1 = Math.floor(100000000 + Math.random() * 900000000);
    const part2 = Math.floor(1000000000 + Math.random() * 9000000000);
    const newId = `${part1}.${part2}`;
    saveSettings({...settings, telemetryClientId: newId});
    return newId;
  } catch {
    return `${Math.floor(100000000 + Math.random() * 900000000)}.${Math.floor(1000000000 + Math.random() * 9000000000)}`;
  }
}

function getSystemMetadata(environment?: string) {
  const rnConstants = Platform.constants as any;
  const rnVersion = rnConstants?.reactNativeVersion
    ? `${rnConstants.reactNativeVersion.major}.${rnConstants.reactNativeVersion.minor}.${rnConstants.reactNativeVersion.patch}`
    : 'unknown';

  const isHermes = Boolean(typeof (global as any).HermesInternal === 'object' && (global as any).HermesInternal !== null);
  const isFabric = Boolean((global as any)?.nativeFabricUIManager !== undefined);
  const isDev = Boolean(typeof __DEV__ !== 'undefined' && __DEV__);

  return {
    lib_version: LIB_VERSION,
    platform: Platform.OS,
    os_version: String(Platform.Version || 'unknown'),
    rn_version: rnVersion,
    is_hermes: isHermes,
    is_fabric: isFabric,
    is_dev: isDev,
    environment: environment || (isDev ? 'DEV' : 'PROD'),
    engagement_time_msec: 1000,
  };
}

export async function trackActiveTelemetryHeartbeat(
  telemetryEnabled = true,
  environment?: string,
): Promise<void> {
  if (telemetryEnabled === false) {
    isTelemetryEnabled = false;
    return;
  }
  isTelemetryEnabled = true;

  const url = getCollectUrl();
  if (!url) return;

  try {
    const settings = await loadSettings();
    const lastPing = settings.telemetryLastPing || 0;
    const now = Date.now();

    if (now - lastPing < PING_INTERVAL_MS) return;

    const clientId = await getOrCreateClientId();
    const params = getSystemMetadata(environment);

    await fetch(url, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        client_id: clientId,
        non_personalized_ads: true,
        events: [{name: 'inspector_active_heartbeat', params}],
      }),
    });

    saveSettings({...settings, telemetryLastPing: now});
  } catch {
    // silent
  }
}
