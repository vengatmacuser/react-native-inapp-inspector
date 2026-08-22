// ─── Google Analytics 4 (GA4) Measurement Protocol Telemetry ───────────────
//
// Comprehensive, anonymous usage telemetry for react-native-inapp-inspector.
//
// - NEVER collects user PII, auth tokens, device names, or network payload bodies.
// - Zero main-thread blocking; 100% fail-safe fire-and-forget.
// - Full environment diagnostics (Hermes, New Arch, RN version, screen size, UI mode).
// - Tracks developer interactions: tab switches, page views, search, exports, retries.
// - Supports opt-out via `telemetry={false}` or `DO_NOT_TRACK=1`.
// ─────────────────────────────────────────────────────────────────────────────

import {Platform, Dimensions, Appearance} from 'react-native';
import {LIB_VERSION} from '../constants';
import {
  getNativeStorageItem,
  setNativeStorageItem,
  isNativeModuleAvailable,
  getNativeDeviceMetrics,
} from '../native/NativeInspector';

// ─── GA4 Measurement Protocol Configuration ──────────────────────────────────
// Automatically replaced at build-time from .env by scripts/inject-telemetry.js
export const GA4_MEASUREMENT_ID = 'G-XXXXXXXXXX';
export const GA4_API_SECRET = 'YOUR_GA4_API_SECRET';

const GA4_ENDPOINT = 'https://www.google-analytics.com/mp/collect';
const CLIENT_ID_KEY = 'telemetry_client_id';

// Stable session ID created once per JavaScript runtime instance
const CURRENT_SESSION_ID = String(Math.floor(Date.now() / 1000));

let hasPingedSession = false;
let cachedClientId: string | null = null;
let lastModalOpenTimestamp: number = 0;
let cachedAppDiagnostics: Record<string, any> | null = null;

/**
 * Generates an anonymous, pseudorandom UUIDv4-like string for client grouping.
 * Contains zero hardware or personal identifiers.
 */
function generateAnonymousClientId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Retrieves or generates the anonymous client identifier.
 */
async function getOrCreateClientId(): Promise<string> {
  if (cachedClientId) return cachedClientId;

  try {
    const stored = await getNativeStorageItem(CLIENT_ID_KEY);
    if (stored && typeof stored === 'string' && stored.length > 0) {
      cachedClientId = stored;
      return stored;
    }
  } catch {
    // Fallback to memory
  }

  const newId = generateAnonymousClientId();
  cachedClientId = newId;

  try {
    await setNativeStorageItem(CLIENT_ID_KEY, newId);
  } catch {
    // Silently ignore storage errors
  }

  return newId;
}

/**
 * Asynchronously loads host application and device metadata (strictly non-PII/technical).
 */
export async function loadAppDiagnosticsAsync(): Promise<Record<string, any>> {
  if (cachedAppDiagnostics) return cachedAppDiagnostics;
  try {
    const metrics = await getNativeDeviceMetrics();
    cachedAppDiagnostics = {
      app_name:
        metrics?.appName ||
        (Platform.constants as any)?.appName ||
        'unknown',
      app_version:
        metrics?.appVersion ||
        (Platform.constants as any)?.appVersion ||
        'unknown',
      app_build: metrics?.appBuild || 'unknown',
      app_bundle_id:
        metrics?.appBundleId || metrics?.appPackageName || 'unknown',
      device_brand:
        metrics?.deviceBrand ||
        (Platform.constants as any)?.Brand ||
        (Platform.constants as any)?.systemName ||
        'unknown',
      device_model:
        metrics?.deviceModel ||
        (Platform.constants as any)?.Model ||
        (Platform.constants as any)?.interfaceIdiom ||
        'unknown',
    };
  } catch {
    cachedAppDiagnostics = {
      app_name: (Platform.constants as any)?.appName || 'unknown',
      app_version: (Platform.constants as any)?.appVersion || 'unknown',
      app_build: 'unknown',
      app_bundle_id: 'unknown',
      device_brand: (Platform.constants as any)?.Brand || 'unknown',
      device_model: (Platform.constants as any)?.Model || 'unknown',
    };
  }
  return cachedAppDiagnostics;
}

/**
 * Extracts React Native framework version string (e.g. "0.81.4").
 */
function getReactNativeVersion(): string {
  try {
    const constants = (Platform as any).constants;
    if (constants && constants.reactNativeVersion) {
      const {major, minor, patch, prerelease} = constants.reactNativeVersion;
      return `${major}.${minor}.${patch}${prerelease ? `-${prerelease}` : ''}`;
    }
  } catch {
    // Fallback
  }
  return 'unknown';
}

/**
 * Collects complete anonymous device, host app & runtime environment diagnostics.
 */
function getEnvironmentDiagnostics(extraParams: Record<string, any> = {}) {
  const isHermes = Boolean((global as any).HermesInternal);
  const isNewArch = Boolean(
    (global as any)._RN_FABRIC_ENABLED || (global as any).__turboModuleProxy,
  );
  const isNativeLinked = isNativeModuleAvailable();
  const rnVersion = getReactNativeVersion();
  const isExpo = Boolean(
    (global as any)?.expo?.modules?.ExponentConstants ||
      (global as any)?.__expo ||
      (typeof process !== 'undefined' &&
        process?.env?.EXPO_PUBLIC_PROJECT_ROOT),
  );

  let screenResolution = 'unknown';
  let fontScale = 1;
  try {
    const {width, height, scale, fontScale: fs} = Dimensions.get('window');
    screenResolution = `${Math.round(width)}x${Math.round(height)}@${scale}x`;
    fontScale = fs || 1;
  } catch {
    // Ignore dimension errors
  }

  let colorScheme = 'unknown';
  try {
    colorScheme = Appearance.getColorScheme() || 'unspecified';
  } catch {
    // Ignore appearance errors
  }

  const appMeta = cachedAppDiagnostics || {
    app_name: (Platform.constants as any)?.appName || 'unknown',
    app_version: (Platform.constants as any)?.appVersion || 'unknown',
    app_build: 'unknown',
    app_bundle_id: 'unknown',
    device_brand:
      (Platform.constants as any)?.Brand ||
      (Platform.constants as any)?.systemName ||
      'unknown',
    device_model:
      (Platform.constants as any)?.Model ||
      (Platform.constants as any)?.interfaceIdiom ||
      'unknown',
  };

  return {
    session_id: CURRENT_SESSION_ID,
    engagement_time_msec: 100,
    lib_version: LIB_VERSION,
    platform: Platform.OS,
    os_version: String(Platform.Version),
    rn_version: rnVersion,
    is_hermes: isHermes,
    is_new_arch: isNewArch,
    is_native_linked: isNativeLinked,
    is_expo: isExpo,
    is_dev: Boolean(typeof __DEV__ !== 'undefined' && __DEV__),
    screen_resolution: screenResolution,
    font_scale: fontScale,
    color_scheme: colorScheme,
    ...appMeta,
    ...extraParams,
  };
}

const CONSENT_STORAGE_KEY = 'telemetry_consent_status';
let cachedConsentStatus: 'granted' | 'declined' | 'undetermined' | null = null;

/**
 * Returns the developer's telemetry consent status.
 */
export async function getTelemetryConsentStatus(): Promise<'granted' | 'declined' | 'undetermined'> {
  if (cachedConsentStatus) return cachedConsentStatus;
  try {
    const stored = await getNativeStorageItem(CONSENT_STORAGE_KEY);
    if (stored === 'granted' || stored === 'declined') {
      cachedConsentStatus = stored;
      return stored;
    }
  } catch {
    // Fallback
  }
  return 'undetermined';
}

/**
 * Saves the developer's telemetry consent choice.
 */
export async function setTelemetryConsent(granted: boolean): Promise<void> {
  const status = granted ? 'granted' : 'declined';
  cachedConsentStatus = status;
  try {
    await setNativeStorageItem(CONSENT_STORAGE_KEY, status);
  } catch {
    // Ignore storage errors
  }
}

/**
 * Checks if the user or environment has opted out of telemetry.
 */
export function isTelemetryOptedOut(explicitSetting?: boolean): boolean {
  if (explicitSetting === false) return true;
  if (cachedConsentStatus === 'declined') return true;
  try {
    if (
      typeof process !== 'undefined' &&
      process?.env &&
      (process.env.DO_NOT_TRACK === '1' || process.env.DISABLE_TELEMETRY === '1')
    ) {
      return true;
    }
  } catch {
    // Ignore environments where process is undefined or restricted
  }
  return false;
}

/**
 * Track an anonymous event via GA4 Measurement Protocol.
 */
export async function trackTelemetryEvent(
  eventName: string,
  params: Record<string, any> = {},
  options?: {telemetry?: boolean; force?: boolean},
): Promise<void> {
  if (isTelemetryOptedOut(options?.telemetry)) return;

  // Don't send if credentials haven't been configured yet
  if (
    !GA4_MEASUREMENT_ID ||
    GA4_MEASUREMENT_ID === 'G-XXXXXXXXXX' ||
    !GA4_API_SECRET ||
    GA4_API_SECRET === 'YOUR_GA4_API_SECRET'
  ) {
    return;
  }

  try {
    const clientId = await getOrCreateClientId();
    await loadAppDiagnosticsAsync();
    const eventParams = getEnvironmentDiagnostics(params);

    const payload = {
      client_id: clientId,
      events: [
        {
          name: eventName,
          params: eventParams,
        },
      ],
    };

    const url = `${GA4_ENDPOINT}?measurement_id=${encodeURIComponent(
      GA4_MEASUREMENT_ID,
    )}&api_secret=${encodeURIComponent(GA4_API_SECRET)}`;

    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    }).catch(() => {
      // If offline on initial cold start, allow a single delayed retry
      if (eventName === 'inspector_session_init') {
        hasPingedSession = false;
        setTimeout(() => {
          sendSessionTelemetryPing(options);
        }, 8000);
      }
    });
  } catch {
    // Fail silently
  }
}

/**
 * 1. Session initialization heartbeat ping.
 */
export async function sendSessionTelemetryPing(options?: {
  telemetry?: boolean;
  environment?: string;
  hasNavigation?: boolean;
  hasAppIcon?: boolean;
  force?: boolean;
}): Promise<void> {
  if (hasPingedSession && !options?.force) return;
  if (isTelemetryOptedOut(options?.telemetry)) return;

  hasPingedSession = true;

  await trackTelemetryEvent(
    'inspector_session_init',
    {
      environment: options?.environment || 'unknown',
      has_navigation: Boolean(options?.hasNavigation),
      has_app_icon: Boolean(options?.hasAppIcon),
    },
    options,
  );
}

/**
 * 2. Track when the inspector modal is opened.
 */
export function trackInspectorOpen(options?: {
  activeTab?: string;
  openSource?: 'fab' | 'shake' | 'programmatic';
  telemetry?: boolean;
}): void {
  lastModalOpenTimestamp = Date.now();
  trackTelemetryEvent(
    'inspector_open',
    {
      open_source: options?.openSource || 'fab',
      active_tab: options?.activeTab || 'apis',
    },
    options,
  );
}

/**
 * 3. Track when the inspector modal is closed.
 */
export function trackInspectorClose(options?: {telemetry?: boolean}): void {
  const durationSec = lastModalOpenTimestamp > 0
    ? Math.round((Date.now() - lastModalOpenTimestamp) / 1000)
    : 0;
  trackTelemetryEvent(
    'inspector_close',
    {
      open_duration_seconds: durationSec,
    },
    options,
  );
}

/**
 * 4. Track tab / page view navigation inside the inspector.
 */
export function trackTabSwitch(
  tabName: string,
  options?: {telemetry?: boolean; fromTab?: string},
): void {
  trackTelemetryEvent(
    'page_view',
    {
      page_title: `Tab: ${tabName}`,
      page_location: `inapp-inspector://tab/${tabName}`,
      tab_name: tabName,
      from_tab: options?.fromTab || 'unknown',
    },
    options,
  );
}

/**
 * 5. Track network API interaction (inspect details, copy cURL, retry).
 */
export function trackNetworkInteraction(
  action: 'view_detail' | 'copy_curl' | 'retry_request' | 'copy_url' | 'clear_logs' | 'export_har',
  options?: {
    method?: string;
    statusCode?: number;
    durationMs?: number;
    telemetry?: boolean;
  },
): void {
  trackTelemetryEvent(
    'network_interaction',
    {
      action_type: action,
      http_method: options?.method || 'GET',
      status_code: options?.statusCode || 0,
      duration_ms: options?.durationMs || 0,
    },
    options,
  );
}

/**
 * 6. Track Redux / State management interaction.
 */
export function trackReduxInteraction(
  action: 'view_diff' | 'view_state' | 'view_action' | 'filter_reducer',
  options?: {reducerName?: string; telemetry?: boolean},
): void {
  trackTelemetryEvent(
    'redux_interaction',
    {
      action_type: action,
      reducer_name: options?.reducerName || 'root',
    },
    options,
  );
}

/**
 * 7. Track Crash & Exception interaction.
 */
export function trackCrashInteraction(
  action: 'view_crash_detail' | 'share_crash_report' | 'copy_stacktrace' | 'clear_crashes',
  options?: {crashType?: string; telemetry?: boolean},
): void {
  trackTelemetryEvent(
    'crash_interaction',
    {
      action_type: action,
      crash_type: options?.crashType || 'js_exception',
    },
    options,
  );
}

/**
 * 8. Track Performance monitoring tab interaction.
 */
export function trackPerformanceInteraction(
  subTab: 'fps' | 'memory' | 'rerenders' | 'bundles',
  options?: {telemetry?: boolean},
): void {
  trackTelemetryEvent(
    'performance_interaction',
    {
      sub_tab: subTab,
    },
    options,
  );
}

/**
 * 9. Track search queries and filter applications.
 */
export function trackSearchOrFilter(
  target: 'apis' | 'console' | 'redux' | 'crashes' | 'analytics',
  actionType: 'search_query' | 'status_filter' | 'method_filter' | 'tag_filter',
  options?: {filterValue?: string; telemetry?: boolean},
): void {
  trackTelemetryEvent(
    'search_and_filter',
    {
      target_tab: target,
      action_type: actionType,
      filter_value: options?.filterValue || 'all',
    },
    options,
  );
}

/**
 * 10. Track when logs / reports are exported or shared.
 */
export function trackLogExport(
  exportType: 'logs_json' | 'logs_har' | 'curl' | 'crash_report',
  options?: {telemetry?: boolean; count?: number},
): void {
  trackTelemetryEvent(
    'log_export',
    {
      export_type: exportType,
      item_count: options?.count || 1,
    },
    options,
  );
}
