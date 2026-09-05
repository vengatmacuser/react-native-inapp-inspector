import React from 'react';
import {Appearance, Dimensions, PixelRatio, Platform, NativeModules} from 'react-native';
import {LIB_VERSION} from '../constants/version';
import {loadSettings, saveSettings, PersistedSettings} from './settingsStore';
import {isReduxConnected} from '../customHooks/reduxLogger';
import {isFirebaseAnalyticsPatched} from '../customHooks/analyticsLogger';
import {getCrashRecords} from '../customHooks/crashHandler';
import {getNetworkLogs} from '../customHooks/networkLogger';
import {isNativeModuleAvailable} from '../native/NativeInspector';
import {
  getAppName,
  getBundleIdentifier,
  getAppVersionAndBuild,
  isLocalDebugEnvironment,
} from './index';
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
let _hasSearchFilterBeenUsed = false;

export function setTelemetryEnabled(enabled: boolean): void {
  isTelemetryEnabled = enabled;
}

export function markSearchFilterUsed(): void {
  _hasSearchFilterBeenUsed = true;
}

async function getOrCreateClientId(): Promise<string> {
  try {
    const settings = await loadSettings();
    if (settings.telemetryClientId || settings.telemetryDeviceId) {
      const id = settings.telemetryClientId || settings.telemetryDeviceId || '';
      if (!settings.telemetryDeviceId) {
        await saveSettings({...settings, telemetryDeviceId: id});
      }
      return id;
    }
    const part1 = Math.floor(100000000 + Math.random() * 900000000);
    const part2 = Math.floor(1000000000 + Math.random() * 9000000000);
    const newId = `${part1}.${part2}`;
    const now = Date.now();
    await saveSettings({
      ...settings,
      telemetryClientId: newId,
      telemetryDeviceId: newId,
      deviceFirstSeen: settings.deviceFirstSeen || now,
    });
    return newId;
  } catch {
    return `${Math.floor(100000000 + Math.random() * 900000000)}.${Math.floor(1000000000 + Math.random() * 9000000000)}`;
  }
}

function isDeviceEmulator(): boolean {
  try {
    if (Platform.OS === 'android') {
      const c = (Platform.constants as any) || {};
      const model = String(c.Model || '').toLowerCase();
      const brand = String(c.Brand || '').toLowerCase();
      const fingerprint = String(c.Fingerprint || '').toLowerCase();
      const hardware = String(c.Hardware || '').toLowerCase();
      const manufacturer = String(c.Manufacturer || '').toLowerCase();
      return (
        model.includes('emulator') ||
        model.includes('sdk') ||
        model.includes('google_sdk') ||
        model.includes('vbox') ||
        brand.includes('generic') ||
        fingerprint.startsWith('generic') ||
        hardware.includes('goldfish') ||
        hardware.includes('ranchu') ||
        manufacturer.includes('genymotion')
      );
    }
    if (Platform.OS === 'ios') {
      const c = (Platform.constants as any) || {};
      const model = String(c.Model || '').toLowerCase();
      return model.includes('simulator') || Boolean(c.isSimulator);
    }
  } catch {
    return false;
  }
  return false;
}

function getDeviceLocaleInfo(): {countryCode: string; locale: string; timeZone: string} {
  try {
    const opts = typeof Intl !== 'undefined' && Intl.DateTimeFormat ? Intl.DateTimeFormat().resolvedOptions() : {} as any;
    const timeZone = opts.timeZone || 'unknown';
    const locale = opts.locale || 'unknown';
    let countryCode = 'unknown';

    if (locale && locale !== 'unknown') {
      const parts = locale.split(/[-_]/);
      if (parts.length > 1) {
        countryCode = parts[parts.length - 1].toUpperCase();
      }
    }

    return { countryCode, locale, timeZone };
  } catch {
    return { countryCode: 'unknown', locale: 'unknown', timeZone: 'unknown' };
  }
}

function getSystemMetadata(environment?: string, currentSettings?: PersistedSettings) {
  const rnConstants = Platform.constants as any;
  const rnVersion = rnConstants?.reactNativeVersion
    ? `${rnConstants.reactNativeVersion.major}.${rnConstants.reactNativeVersion.minor}.${rnConstants.reactNativeVersion.patch}`
    : 'unknown';

  const isHermes = Boolean(typeof (global as any).HermesInternal === 'object' && (global as any).HermesInternal !== null);
  const isFabric = Boolean((global as any)?.nativeFabricUIManager !== undefined);
  const isBridgeless = Boolean((global as any)?._rn_bridgeless || (global as any)?.RN$Bridgeless);
  const isDev = Boolean(typeof __DEV__ !== 'undefined' && __DEV__);
  const isEmulator = isDeviceEmulator();
  const { countryCode, locale, timeZone } = getDeviceLocaleInfo();

  let screenRes = 'unknown';
  let screenDensity = 1;
  let fontScale = 1;
  let deviceFormFactor = 'phone';
  let screenOrientation = 'portrait';
  try {
    const dim = Dimensions.get('window');
    screenRes = `${Math.round(dim.width)}x${Math.round(dim.height)}`;
    screenDensity = PixelRatio.get();
    fontScale = PixelRatio.getFontScale();
    screenOrientation = dim.width > dim.height ? 'landscape' : 'portrait';
    const isTablet = (Platform.OS === 'ios' && Boolean((Platform as any).isPad)) ||
      (Math.min(dim.width, dim.height) >= 600);
    deviceFormFactor = isTablet ? 'tablet' : 'phone';
  } catch {}

  let appearanceMode = 'unknown';
  try {
    appearanceMode = Appearance?.getColorScheme?.() || 'unknown';
  } catch {}

  const isExpo = Boolean(
    (globalThis as any)?.expo ||
    (globalThis as any)?.__expo ||
    (globalThis as any)?.__turboModuleProxy?.name === 'Expo' ||
    (Platform.constants as any)?.ExpoVersion
  );

  let hermesVersion = 'non_hermes';
  let jsEngine = 'jsc';
  if (isHermes) {
    jsEngine = 'hermes';
    try {
      const props = (global as any).HermesInternal?.getRuntimeProperties?.() || {};
      hermesVersion = props['OSS Release Version'] || (props['Bytecode Version'] ? `bc_v${props['Bytecode Version']}` : 'hermes');
    } catch {
      hermesVersion = 'hermes';
    }
  } else if ((globalThis as any)?._v8) {
    jsEngine = 'v8';
  }

  let reduxAttached = false;
  try {
    reduxAttached = isReduxConnected();
  } catch {}

  let analyticsAttached = false;
  try {
    analyticsAttached = isFirebaseAnalyticsPatched();
  } catch {}

  const hasNativeModule = isNativeModuleAvailable();
  const hasMmkv = Boolean(NativeModules?.RNMMKV || (globalThis as any)?.MMKV);

  let capturedCrashesCount = 0;
  try {
    capturedCrashesCount = getCrashRecords().length;
  } catch {}

  let capturedApisBracket = '0';
  try {
    const apiCount = getNetworkLogs().length;
    capturedApisBracket =
      apiCount === 0
        ? '0'
        : apiCount <= 10
        ? '1-10'
        : apiCount <= 50
        ? '11-50'
        : apiCount <= 100
        ? '51-100'
        : '100+';
  } catch {}

  let isMetroConnected = false;
  try {
    isMetroConnected = isLocalDebugEnvironment();
  } catch {}

  const defaultLandingTab = currentSettings?.defaultTab || 'apis';
  const fabMode =
    hasNativeModule && currentSettings?.useNativeFab !== false
      ? 'native_ui_thread'
      : 'js_floating_button';

  const deviceBrand = String(
    rnConstants?.Brand ||
    (Platform.OS === 'ios' ? 'Apple' : 'unknown'),
  );

  const deviceModel = String(
    rnConstants?.Model ||
    rnConstants?.systemName ||
    (Platform.OS === 'ios' ? 'iPhone/iPad' : 'unknown'),
  );

  const deviceManufacturer = String(
    rnConstants?.Manufacturer ||
    (Platform.OS === 'ios' ? 'Apple' : 'unknown'),
  );

  let appName = 'App';
  let bundleId = 'unknown';
  let appVersion = 'unknown';
  let appBuild = 'unknown';
  try {
    appName = getAppName() || 'App';
    bundleId = getBundleIdentifier() || 'unknown';
    const verInfo = getAppVersionAndBuild();
    appVersion = verInfo.version || 'unknown';
    appBuild = verInfo.build || 'unknown';
  } catch {}

  const reactVer = typeof React !== 'undefined' && React.version ? React.version : 'unknown';

  return {
    pkg_name: PKG_NAME,
    pkg_version: LIB_VERSION,
    lib_version: LIB_VERSION,
    install_type: isDev ? 'local_dev' : 'bundled_production',
    app_name: appName,
    bundle_id: bundleId,
    app_version: appVersion,
    app_build: appBuild,
    react_version: reactVer,
    platform: Platform.OS,
    os_version: String(Platform.Version || 'unknown'),
    rn_version: rnVersion,
    country_code: countryCode,
    device_locale: locale,
    time_zone: timeZone,
    device_brand: deviceBrand,
    device_model: deviceModel,
    device_manufacturer: deviceManufacturer,
    device_form_factor: deviceFormFactor,
    screen_resolution: screenRes,
    screen_density: screenDensity,
    screen_orientation: screenOrientation,
    font_scale: fontScale,
    appearance_mode: appearanceMode,
    is_expo: isExpo,
    js_engine: jsEngine,
    hermes_version: hermesVersion,
    is_hermes: isHermes,
    is_fabric: isFabric,
    is_bridgeless: isBridgeless,
    has_native_module: hasNativeModule,
    has_mmkv: hasMmkv,
    fab_mode: fabMode,
    default_landing_tab: defaultLandingTab,
    captured_crashes_count: capturedCrashesCount,
    captured_apis_bracket: capturedApisBracket,
    search_filter_used: _hasSearchFilterBeenUsed,
    is_metro_connected: isMetroConnected,
    is_dev: isDev,
    is_emulator: isEmulator,
    device_type: isEmulator ? 'emulator' : 'real_device',
    app_mode: isDev ? 'local_mode' : 'bundled_application',
    redux_attached: reduxAttached,
    analytics_attached: analyticsAttached,
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
    const isNewDevice = !settings.deviceRegistered;

    // Send on first launch or if 24h passed since last ping
    if (!isNewDevice && now - lastPing < PING_INTERVAL_MS) return;

    const clientId = await getOrCreateClientId();
    const params = getSystemMetadata(environment, settings);

    const deviceParams = {
      ...params,
      device_id: clientId,
      is_new_device: isNewDevice,
      device_first_seen: settings.deviceFirstSeen || now,
    };

    const eventsToDispatch = isNewDevice
      ? [
          {name: 'active_device', params: deviceParams},
          {name: 'first_device_install', params: deviceParams},
          {name: 'inspector_active_heartbeat', params: deviceParams},
        ]
      : [
          {name: 'active_device', params: deviceParams},
          {name: 'inspector_active_heartbeat', params: deviceParams},
        ];

    await fetch(url, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        client_id: clientId,
        user_id: clientId,
        non_personalized_ads: true,
        user_properties: {
          device_id: { value: clientId },
          pkg_name: { value: params.pkg_name },
          pkg_version: { value: params.pkg_version },
          install_type: { value: params.install_type },
          app_name: { value: params.app_name },
          bundle_id: { value: params.bundle_id },
          app_version: { value: params.app_version },
          react_version: { value: params.react_version },
          country: { value: params.country_code },
          country_code: { value: params.country_code },
          locale: { value: params.device_locale },
          time_zone: { value: params.time_zone },
          device_brand: { value: params.device_brand },
          device_model: { value: params.device_model },
          device_form_factor: { value: params.device_form_factor },
          screen_resolution: { value: params.screen_resolution },
          appearance_mode: { value: params.appearance_mode },
          is_expo: { value: String(params.is_expo) },
          js_engine: { value: params.js_engine },
          is_fabric: { value: String(params.is_fabric) },
          is_bridgeless: { value: String(params.is_bridgeless) },
          has_native_module: { value: String(params.has_native_module) },
          has_mmkv: { value: String(params.has_mmkv) },
          fab_mode: { value: params.fab_mode },
          default_landing_tab: { value: params.default_landing_tab },
          captured_crashes_count: { value: String(params.captured_crashes_count) },
          captured_apis_bracket: { value: params.captured_apis_bracket },
          search_filter_used: { value: String(params.search_filter_used) },
          is_metro_connected: { value: String(params.is_metro_connected) },
          redux_attached: { value: String(params.redux_attached) },
          analytics_attached: { value: String(params.analytics_attached) },
          platform: { value: params.platform },
          rn_version: { value: params.rn_version },
          lib_version: { value: params.lib_version },
        },
        events: eventsToDispatch,
      }),
    });

    await saveSettings({
      ...settings,
      telemetryClientId: clientId,
      telemetryDeviceId: clientId,
      deviceRegistered: true,
      deviceFirstSeen: settings.deviceFirstSeen || now,
      telemetryLastPing: now,
      telemetryLastActive: now,
    });
  } catch {
    // silent
  }
}

export async function trackTelemetryEvent(
  eventName: string,
  eventParams?: Record<string, any>,
): Promise<void> {
  if (!isTelemetryEnabled) return;
  const url = getCollectUrl();
  if (!url) return;

  try {
    const clientId = await getOrCreateClientId();
    const settings = await loadSettings().catch(() => ({} as PersistedSettings));
    const metadata = getSystemMetadata(undefined, settings);

    const params = {
      ...metadata,
      device_id: clientId,
      ...eventParams,
      engagement_time_msec: 100,
    };

    await fetch(url, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        client_id: clientId,
        user_id: clientId,
        non_personalized_ads: true,
        user_properties: {
          device_id: { value: clientId },
          pkg_name: { value: metadata.pkg_name },
          pkg_version: { value: metadata.pkg_version },
          install_type: { value: metadata.install_type },
          app_name: { value: metadata.app_name },
          bundle_id: { value: metadata.bundle_id },
          app_version: { value: metadata.app_version },
          react_version: { value: metadata.react_version },
          country: { value: metadata.country_code },
          country_code: { value: metadata.country_code },
          locale: { value: metadata.device_locale },
          time_zone: { value: metadata.time_zone },
          device_brand: { value: metadata.device_brand },
          device_model: { value: metadata.device_model },
          device_form_factor: { value: metadata.device_form_factor },
          screen_resolution: { value: metadata.screen_resolution },
          appearance_mode: { value: metadata.appearance_mode },
          is_expo: { value: String(metadata.is_expo) },
          js_engine: { value: metadata.js_engine },
          is_fabric: { value: String(metadata.is_fabric) },
          is_bridgeless: { value: String(metadata.is_bridgeless) },
          has_native_module: { value: String(metadata.has_native_module) },
          has_mmkv: { value: String(metadata.has_mmkv) },
          fab_mode: { value: metadata.fab_mode },
          default_landing_tab: { value: metadata.default_landing_tab },
          captured_crashes_count: { value: String(metadata.captured_crashes_count) },
          captured_apis_bracket: { value: metadata.captured_apis_bracket },
          search_filter_used: { value: String(metadata.search_filter_used) },
          is_metro_connected: { value: String(metadata.is_metro_connected) },
          redux_attached: { value: String(metadata.redux_attached) },
          analytics_attached: { value: String(metadata.analytics_attached) },
          platform: { value: metadata.platform },
          rn_version: { value: metadata.rn_version },
          lib_version: { value: metadata.lib_version },
        },
        events: [{ name: eventName, params }],
      }),
    });
  } catch {
    // silent
  }
}

/**
 * Tracks when a developer opens/switches tabs in the In-App Inspector (e.g. APIs, Logs, Redux, Performance, Storage, etc.)
 */
export function trackInspectorTabView(tabName: string): void {
  trackTelemetryEvent('inspector_tab_view', {
    tab_name: tabName,
    screen_name: `tab_${tabName}`,
    screen_class: 'NetworkInspector',
  });
}

/**
 * Tracks screen views within the In-App Inspector
 */
export function trackInspectorScreenView(screenName: string): void {
  trackTelemetryEvent('screen_view', {
    screen_name: screenName,
    screen_class: 'NetworkInspector',
  });
}

/**
 * Tracks screen / performance recording events
 */
export function trackInspectorScreenRecord(
  action: 'start' | 'stop' | 'toggle',
  recordingType = 'screen',
): void {
  trackTelemetryEvent('inspector_screen_record', {
    action,
    recording_type: recordingType,
  });
}


