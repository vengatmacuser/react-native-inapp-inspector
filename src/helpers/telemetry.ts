import {Platform} from 'react-native';
import {LIB_VERSION} from '../constants/version';
import {loadSettings, saveSettings} from './settingsStore';
import {
  ENC_MID,
  ENC_SEC,
  TELEMETRY_SALT,
} from '../constants/telemetryConfig';

// ─── Runtime Keystream Deobfuscation ────────────────────────────────────────

const PKG_NAME = 'react-native-inapp-inspector';
const KEY_MATERIAL = `${PKG_NAME}::${TELEMETRY_SALT}`;

function getKeystream(material: string, length: number): number[] {
  const stream: number[] = [];
  let acc = 0x5a827999;
  for (let i = 0; i < length; i++) {
    const charCode = material.charCodeAt(i % material.length);
    acc = ((acc * 31 + charCode * 17 + i * 13) ^ (acc >>> 7)) & 0xffffffff;
    stream.push((acc >>> (i % 24)) & 0xff);
  }
  return stream;
}

function deobfuscate(hexStr: string): string {
  if (!hexStr) return '';
  const bytes: number[] = [];
  for (let i = 0; i < hexStr.length; i += 2) {
    bytes.push(parseInt(hexStr.substring(i, i + 2), 16));
  }
  const keystream = getKeystream(KEY_MATERIAL, bytes.length);
  const out: string[] = [];
  for (let i = 0; i < bytes.length; i++) {
    const k = keystream[i];
    const s = TELEMETRY_SALT.charCodeAt(i % TELEMETRY_SALT.length);
    const dec = (bytes[i] ^ k ^ s) & 0xff;
    out.push(String.fromCharCode(dec));
  }
  return out.join('');
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
    _cachedMid = deobfuscate(ENC_MID);
    _cachedSec = deobfuscate(ENC_SEC);
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

// ─── Telemetry State & Heartbeat ───────────────────────────────────────────

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
