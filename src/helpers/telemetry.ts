import React from 'react';
import {Appearance, Dimensions, PixelRatio, Platform, NativeModules} from 'react-native';
import {LIB_VERSION} from '../constants/version';
import {loadSettings, saveSettings, PersistedSettings} from './settingsStore';
import {isReduxConnected} from '../customHooks/reduxLogger';
import {isFirebaseAnalyticsPatched} from '../customHooks/analyticsLogger';
import {getCrashRecords} from '../customHooks/crashHandler';
import {getNetworkLogs} from '../customHooks/networkLogger';
import {getConsoleLogs} from '../customHooks/consoleLogger';
import {isNativeModuleAvailable} from '../native/NativeInspector';
import {getLanguage} from '../i18n';
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

function getPlatformUserAgent(params: Record<string, any>): string {
  try {
    const os = Platform.OS;
    const osVer = String(params.os_version || (os === 'ios' ? '17.0' : '14.0'));
    const locale = (params.device_locale || 'en_US').replace('_', '-');
    if (os === 'android') {
      const model = params.device_model || 'Android';
      return `Mozilla/5.0 (Linux; U; Android ${osVer}; ${locale}; ${model}) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/126.0.0.0 Mobile Safari/537.36 (react-native-inapp-inspector/${LIB_VERSION})`;
    } else if (os === 'ios') {
      const iosVer = osVer.replace(/\./g, '_');
      const model = params.device_model || 'iPhone';
      return `Mozilla/5.0 (${model}; CPU iPhone OS ${iosVer} like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 (react-native-inapp-inspector/${LIB_VERSION})`;
    }
    return `${params.app_name || 'App'}/${params.app_version || '1.0'} (${os}; ${osVer}) react-native-inapp-inspector/${LIB_VERSION}`;
  } catch {
    return `react-native-inapp-inspector/${LIB_VERSION}`;
  }
}

// ─── Telemetry Session Lifecycle ───────────────────────────────────────────

const DAILY_PING_INTERVAL_MS = 24 * 60 * 60 * 1000;
const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes inactivity creates new session

let isTelemetryEnabled = true;
let _hasSearchFilterBeenUsed = false;
let _currentSessionId: string = String(Math.floor(Date.now() / 1000));
let _currentSessionNumber = 1;
let _sessionInitialized = false;

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

async function getSessionInfo(): Promise<{sessionId: string; sessionNumber: number}> {
  const now = Date.now();
  if (!_sessionInitialized) {
    try {
      const settings = await loadSettings();
      const lastSessionTime = settings.telemetryLastSessionTime || 0;
      let count = settings.telemetrySessionCount || 0;
      if (now - lastSessionTime >= SESSION_TIMEOUT_MS || count === 0) {
        count += 1;
        _currentSessionId = String(Math.floor(now / 1000));
        _currentSessionNumber = count;
        await saveSettings({
          ...settings,
          telemetrySessionCount: count,
          telemetryLastSessionTime: now,
        });
      } else {
        _currentSessionNumber = count;
      }
      _sessionInitialized = true;
    } catch {
      _currentSessionNumber = 1;
    }
  }
  return {sessionId: _currentSessionId, sessionNumber: _currentSessionNumber};
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

function getSystemMetadata(environment?: string, currentSettings?: PersistedSettings): Record<string, any> {
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
  let screenWidth = 0;
  let screenHeight = 0;
  let screenDensity = 1;
  let fontScale = 1;
  let deviceFormFactor = 'phone';
  let screenOrientation = 'portrait';
  try {
    const dim = Dimensions.get('window');
    screenWidth = Math.round(dim.width);
    screenHeight = Math.round(dim.height);
    screenRes = `${screenWidth}x${screenHeight}`;
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
  const expoVersion = isExpo ? String((Platform.constants as any)?.ExpoVersion || 'managed') : 'bare';

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

  let capturedApisCount = 0;
  let capturedApisBracket = '0';
  try {
    capturedApisCount = getNetworkLogs().length;
    capturedApisBracket =
      capturedApisCount === 0
        ? '0'
        : capturedApisCount <= 10
        ? '1-10'
        : capturedApisCount <= 50
        ? '11-50'
        : capturedApisCount <= 100
        ? '51-100'
        : '100+';
  } catch {}

  let capturedLogsCount = 0;
  try {
    capturedLogsCount = getConsoleLogs().length;
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
  let activeLanguage = 'en';
  try {
    activeLanguage = getLanguage() || 'en';
  } catch {}

  return {
    pkg_name: PKG_NAME,
    pkg_version: LIB_VERSION,
    lib_version: LIB_VERSION,
    inspector_version: LIB_VERSION,
    install_type: isDev ? 'local_dev' : 'bundled_production',
    app_name: appName,
    bundle_id: bundleId,
    app_version: appVersion,
    app_build: appBuild,
    react_version: reactVer,
    platform: Platform.OS,
    operating_system: Platform.OS === 'ios' ? 'iOS' : 'Android',
    os_version: String(Platform.Version || 'unknown'),
    operating_system_version: String(Platform.Version || 'unknown'),
    rn_version: rnVersion,
    country_code: countryCode,
    device_locale: locale,
    time_zone: timeZone,
    device_brand: deviceBrand,
    device_model: deviceModel,
    device_manufacturer: deviceManufacturer,
    device_type: isEmulator ? 'emulator' : 'real_device',
    device_category: deviceFormFactor,
    device_form_factor: deviceFormFactor,
    screen_resolution: screenRes,
    screen_width: screenWidth,
    screen_height: screenHeight,
    screen_density: screenDensity,
    screen_orientation: screenOrientation,
    font_scale: fontScale,
    appearance_mode: appearanceMode,
    is_expo: isExpo,
    expo_version: expoVersion,
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
    captured_apis_count: capturedApisCount,
    captured_logs_count: capturedLogsCount,
    search_filter_used: _hasSearchFilterBeenUsed,
    is_metro_connected: isMetroConnected,
    is_dev: isDev,
    is_emulator: isEmulator,
    app_mode: isDev ? 'local_mode' : 'bundled_application',
    redux_attached: reduxAttached,
    analytics_attached: analyticsAttached,
    active_language: activeLanguage,
    environment: environment || (isDev ? 'DEV' : 'PROD'),
    engagement_time_msec: 1000,
  };
}

function getClientCollectUrl(
  eventName: string,
  params: Record<string, any>,
  clientId: string,
  sessionId: string,
  sessionNum: number,
): string {
  const {measurementId} = getCredentials();
  if (!measurementId) return '';
  const nowSec = sessionId || String(Math.floor(Date.now() / 1000));
  const queryParams = new URLSearchParams({
    v: '2',
    tid: measurementId,
    cid: clientId,
    en: eventName,
    _p: String(Math.floor(1000000 + Math.random() * 9000000)),
    ul: (params.device_locale || 'en_US').toLowerCase().replace('_', '-'),
    sr: params.screen_resolution || '1080x1920',
    _s: '1',
    _ee: '1',
    seg: '1',
    _et: String(params.engagement_time_msec || 1000),
    sid: nowSec,
    sct: String(sessionNum || 1),
    dl: `https://${params.bundle_id || 'app.native'}/inspector/${params.screen_name || eventName}`,
    dt: `${params.app_name || 'App'} - Inspector`,
  });

  // Attach all relevant event parameters with 'ep.' or 'epn.' prefix
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;
    if (['v', 'tid', 'cid', 'en', '_p', 'ul', 'sr', '_s', '_ee', 'seg', '_et', 'sid', 'sct', 'dl', 'dt'].includes(key)) {
      continue;
    }
    if (typeof value === 'number') {
      queryParams.set(`epn.${key}`, String(value));
    } else {
      queryParams.set(`ep.${key}`, String(value));
    }
  }

  return `https://www.google-analytics.com/g/collect?${queryParams.toString()}`;
}

async function dispatchGAEvents(
  clientId: string,
  sessionId: string,
  sessionNumber: number,
  events: Array<{name: string; params: Record<string, any>}>,
  metadata: Record<string, any>,
): Promise<void> {
  const url = getCollectUrl();
  if (!url) return;

  const firstEvent = events[0] || {name: 'app_open', params: {}};
  const clientUrl = getClientCollectUrl(
    firstEvent.name,
    firstEvent.params,
    clientId,
    sessionId,
    sessionNumber,
  );

  // Channel 1: Direct Google Analytics client collection (resolves IP -> Country/Region/City automatically)
  if (clientUrl) {
    fetch(clientUrl, {
      method: 'POST',
      headers: {
        'User-Agent': getPlatformUserAgent(metadata),
      },
    }).catch(() => {});
  }

  // Channel 2: Measurement Protocol with rich structured parameters
  // Note: GA4 allows up to 25 custom user properties. We curate the top 18 core dimensions.
  const userProperties = {
    app_name: { value: String(metadata.app_name || '') },
    bundle_id: { value: String(metadata.bundle_id || '') },
    app_version: { value: String(metadata.app_version || '') },
    pkg_version: { value: String(metadata.pkg_version || '') },
    platform: { value: String(metadata.platform || '') },
    os_version: { value: String(metadata.os_version || '') },
    rn_version: { value: String(metadata.rn_version || '') },
    react_version: { value: String(metadata.react_version || '') },
    js_engine: { value: String(metadata.js_engine || '') },
    is_fabric: { value: String(Boolean(metadata.is_fabric)) },
    device_brand: { value: String(metadata.device_brand || '') },
    device_model: { value: String(metadata.device_model || '') },
    device_type: { value: String(metadata.device_type || '') },
    country_code: { value: String(metadata.country_code || '') },
    device_locale: { value: String(metadata.device_locale || '') },
    time_zone: { value: String(metadata.time_zone || '') },
    environment: { value: String(metadata.environment || 'DEV') },
    active_language: { value: String(metadata.active_language || 'en') },
  };

  const formattedEvents = events.map(e => ({
    name: e.name,
    params: {
      session_id: sessionId,
      ga_session_id: sessionId,
      session_number: sessionNumber,
      ga_session_number: sessionNumber,
      engagement_time_msec: e.params?.engagement_time_msec ?? 1000,
      screen_name: e.params?.screen_name || `inspector_${metadata.default_landing_tab || 'apis'}`,
      screen_class: 'NetworkInspector',
      ...e.params,
    },
  }));

  await fetch(url, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      client_id: clientId,
      user_id: clientId,
      non_personalized_ads: true,
      user_properties: userProperties,
      events: formattedEvents,
    }),
  }).catch(() => {});
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

  if (process.env.NODE_ENV === 'test' || typeof (globalThis as any).jest !== 'undefined') {
    return;
  }

  try {
    const settings = await loadSettings();
    const lastDailyPing = settings.telemetryLastPing || 0;
    const now = Date.now();
    const isNewDevice = !settings.deviceRegistered;
    const isDailyDue = isNewDevice || (now - lastDailyPing >= DAILY_PING_INTERVAL_MS);

    const clientId = await getOrCreateClientId();
    const {sessionId, sessionNumber} = await getSessionInfo();
    const metadata = getSystemMetadata(environment, settings);

    const baseEventParams = {
      ...metadata,
      device_id: clientId,
      session_id: sessionId,
      session_number: sessionNumber,
      is_new_device: isNewDevice,
      device_first_seen: settings.deviceFirstSeen || now,
    };

    const eventsToDispatch: Array<{name: string; params: Record<string, any>}> = [];

    if (isNewDevice) {
      eventsToDispatch.push(
        {name: 'first_open', params: baseEventParams},
        {name: 'first_device_install', params: baseEventParams},
      );
    }

    eventsToDispatch.push(
      {name: 'session_start', params: baseEventParams},
      {name: 'app_open', params: baseEventParams},
    );

    if (isDailyDue) {
      eventsToDispatch.push(
        {name: 'active_device', params: baseEventParams},
        {name: 'inspector_active_heartbeat', params: baseEventParams},
      );
    }

    await dispatchGAEvents(clientId, sessionId, sessionNumber, eventsToDispatch, metadata);

    await saveSettings({
      ...settings,
      telemetryClientId: clientId,
      telemetryDeviceId: clientId,
      deviceRegistered: true,
      deviceFirstSeen: settings.deviceFirstSeen || now,
      telemetryLastPing: isDailyDue ? now : lastDailyPing,
      telemetryLastActive: now,
      telemetryLastSessionTime: now,
      telemetrySessionCount: sessionNumber,
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
  if (process.env.NODE_ENV === 'test' || typeof (globalThis as any).jest !== 'undefined') return;

  try {
    const clientId = await getOrCreateClientId();
    const {sessionId, sessionNumber} = await getSessionInfo();
    const settings = await loadSettings().catch(() => ({} as PersistedSettings));
    const metadata = getSystemMetadata(undefined, settings);

    const params = {
      ...metadata,
      device_id: clientId,
      session_id: sessionId,
      session_number: sessionNumber,
      ...eventParams,
      engagement_time_msec: eventParams?.engagement_time_msec ?? 500,
    };

    await dispatchGAEvents(clientId, sessionId, sessionNumber, [{name: eventName, params}], metadata);
  } catch {
    // silent
  }
}

/**
 * Tracks when the In-App Inspector is opened (via FAB, shake, or manual trigger)
 */
export function trackInspectorOpen(trigger = 'fab', extraDetails?: Record<string, any>): void {
  trackTelemetryEvent('inspector_open', {
    trigger,
    screen_name: 'inspector_main',
    screen_class: 'NetworkInspector',
    ...extraDetails,
  });
}

/**
 * Tracks when the In-App Inspector is minimized or closed
 */
export function trackInspectorClose(durationMs?: number): void {
  trackTelemetryEvent('inspector_close', {
    duration_ms: durationMs || 0,
    screen_name: 'inspector_closed',
  });
}

/**
 * Tracks when a developer opens/switches tabs in the In-App Inspector (e.g. APIs, Logs, Redux, Performance, Storage, etc.)
 */
export function trackInspectorTabView(tabName: string, previousTab?: string): void {
  trackTelemetryEvent('inspector_tab_view', {
    tab_name: tabName,
    previous_tab: previousTab || '',
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
 * Tracks when data is exported (cURL, HAR, JSON, Markdown, Logs)
 */
export function trackInspectorExport(
  module: string,
  exportFormat: string,
  recordCount = 1,
): void {
  trackTelemetryEvent('inspector_export', {
    module,
    export_format: exportFormat,
    record_count: recordCount,
  });
}

/**
 * Tracks when data is cleared (Clear network, Clear console, Clear crashes, Clear storage)
 */
export function trackInspectorClear(module: string, clearedCount = 0): void {
  trackTelemetryEvent('inspector_clear', {
    module,
    cleared_count: clearedCount,
  });
}

/**
 * Tracks search query submissions or filter toggles
 */
export function trackInspectorFilter(
  module: string,
  filterType: string,
  filterValue?: string,
): void {
  markSearchFilterUsed();
  trackTelemetryEvent('inspector_filter', {
    module,
    filter_type: filterType,
    filter_value: filterValue || '',
  });
}

/**
 * Tracks screen captures and video recordings
 */
export function trackInspectorMediaCapture(
  captureType: 'screenshot' | 'video',
  format = 'png',
  durationSec = 0,
): void {
  trackTelemetryEvent('inspector_media_capture', {
    capture_type: captureType,
    format,
    duration_sec: durationSec,
  });
}

/**
 * Tracks when unhandled crashes or exceptions are intercepted
 */
export function trackInspectorCrashCaptured(crash: {
  message?: string;
  caller?: string;
  isFatal?: boolean;
}): void {
  trackTelemetryEvent('inspector_crash_captured', {
    is_fatal: Boolean(crash.isFatal),
    error_caller: crash.caller || 'Unknown',
    error_summary: (crash.message || 'Error').slice(0, 100),
  });
}

/**
 * Tracks Inspector language changes
 */
export function trackInspectorLanguageChanged(newLanguage: string, previousLanguage?: string): void {
  trackTelemetryEvent('inspector_language_changed', {
    new_language: newLanguage,
    previous_language: previousLanguage || '',
  });
}

/**
 * Tracks user actions such as copying cURL, URL, payload, or replaying requests
 */
export function trackInspectorAction(
  actionType: string,
  module: string,
  details?: Record<string, any>,
): void {
  trackTelemetryEvent('inspector_action', {
    action_type: actionType,
    module,
    ...details,
  });
}
