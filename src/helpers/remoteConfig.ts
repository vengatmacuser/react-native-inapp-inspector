import {ActiveTab} from '../types';

/**
 * Supported Remote Config parameters in Firebase Console:
 *
 * 1. JSON Configuration:
 *    - `inspector_modules` (e.g. `{"apis": true, "logs": true, "media": true, ...}`)
 *    - `inapp_inspector_modules`
 *
 * 2. Individual Module Boolean Keys:
 *    - `inspector_module_apis` / `inapp_inspector_apis`
 *    - `inspector_module_logs` / `inapp_inspector_logs`
 *    - `inspector_module_analytics` / `inapp_inspector_analytics`
 *    - `inspector_module_redux` / `inapp_inspector_redux`
 *    - `inspector_module_storage` / `inapp_inspector_storage`
 *    - `inspector_module_device` / `inapp_inspector_device`
 *    - `inspector_module_crash` / `inapp_inspector_crash`
 *    - `inspector_module_debugging` / `inapp_inspector_debugging`
 *    - `inspector_module_media` / `inapp_inspector_media`
 *    - `inspector_module_socket` / `inapp_inspector_socket`
 *
 * 3. Dynamic Sponsor & Monetization Keys:
 *    - `inspector_sponsor_publisher_id` (e.g. your approved EthicalAds publisher slug)
 *    - `inspector_sponsor_endpoint` (custom JSON ad API endpoint)
 *
 * 4. Feature & Kill-switch Flags:
 *    - `inspector_enabled` (boolean kill switch)
 *    - `inspector_capture_widget_enabled` (floating capture widget switch)
 */

const MODULE_KEYS: ActiveTab[] = [
  'apis',
  'logs',
  'analytics',
  'redux',
  'storage',
  'device',
  'crash',
  'debugging',
  'media',
  'socket',
];

let cachedRemoteConfigInstance: any = null;

export interface InspectorRemoteConfigResult {
  modules?: Partial<Record<ActiveTab, boolean>>;
  sponsorPublisherId?: string;
  sponsorEndpoint?: string;
  captureWidgetEnabled?: boolean;
  enabled?: boolean;
}

/**
 * Dynamically resolves Firebase Remote Config instance if installed.
 */
export function getFirebaseRemoteConfig(customInstance?: any): any {
  if (customInstance && typeof customInstance === 'object') {
    cachedRemoteConfigInstance = customInstance;
    return customInstance;
  }
  if (cachedRemoteConfigInstance) {
    return cachedRemoteConfigInstance;
  }
  try {
    const rcModule = require('@react-native-firebase/remote-config');
    const instance =
      typeof rcModule.default === 'function'
        ? rcModule.default()
        : typeof rcModule === 'function'
        ? rcModule()
        : rcModule;
    cachedRemoteConfigInstance = instance;
    return instance;
  } catch {
    return null;
  }
}

/**
 * Checks if @react-native-firebase/remote-config is available in the environment.
 */
export function isFirebaseRemoteConfigAvailable(customInstance?: any): boolean {
  return Boolean(getFirebaseRemoteConfig(customInstance));
}

/**
 * Helper to extract a boolean or JSON value from a Firebase Remote Config parameter.
 */
function extractValue(val: any): any {
  if (val === null || val === undefined) return undefined;
  if (typeof val === 'boolean') return val;
  if (typeof val === 'number') return val !== 0;
  if (typeof val === 'string') {
    const lower = val.trim().toLowerCase();
    if (lower === 'true' || lower === '1' || lower === 'enabled' || lower === 'on') return true;
    if (lower === 'false' || lower === '0' || lower === 'disabled' || lower === 'off') return false;
    try {
      return JSON.parse(val);
    } catch {
      return undefined;
    }
  }
  // Firebase Remote Config Value object with .asBoolean() or .asString()
  if (typeof val.asBoolean === 'function') {
    return val.asBoolean();
  }
  if (typeof val.asString === 'function') {
    const str = val.asString();
    const lower = str.trim().toLowerCase();
    if (lower === 'true' || lower === '1' || lower === 'enabled' || lower === 'on') return true;
    if (lower === 'false' || lower === '0' || lower === 'disabled' || lower === 'off') return false;
    try {
      return JSON.parse(str);
    } catch {
      return undefined;
    }
  }
  return undefined;
}

/**
 * Helper to extract string values (such as publisher IDs or custom endpoints)
 */
function extractStringValue(val: any): string | undefined {
  if (val === null || val === undefined) return undefined;
  if (typeof val === 'string' && val.trim().length > 0) return val.trim();
  if (typeof val.asString === 'function') {
    const str = val.asString();
    if (typeof str === 'string' && str.trim().length > 0) return str.trim();
  }
  return undefined;
}

/**
 * Fetches and activates latest values from Firebase Remote Config, returning full dynamic config.
 */
export async function fetchRemoteConfigSettings(
  customInstance?: any,
  fetchTimeoutMs = 8000,
): Promise<InspectorRemoteConfigResult | null> {
  const rc = getFirebaseRemoteConfig(customInstance);
  if (!rc) {
    return null;
  }

  try {
    // 1. Fetch & Activate with timeout protection
    const fetchPromise = (async () => {
      if (typeof rc.fetchAndActivate === 'function') {
        await rc.fetchAndActivate();
      } else {
        if (typeof rc.fetch === 'function') {
          await rc.fetch();
        }
        if (typeof rc.activate === 'function') {
          await rc.activate();
        }
      }
    })();

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Remote Config fetch timeout')), fetchTimeoutMs),
    );

    await Promise.race([fetchPromise, timeoutPromise]).catch(() => {
      // If network fetch fails/times out, we still read cached/activated values
    });

    const getParamVal = (key: string) => {
      if (typeof rc.getValue === 'function') {
        try {
          return rc.getValue(key);
        } catch {
          return undefined;
        }
      }
      return rc[key];
    };

    const result: InspectorRemoteConfigResult = {};
    const modules: Partial<Record<ActiveTab, boolean>> = {};

    // ─── 1. JSON Modules Object ──────────────────────────────────────────────
    const jsonKeys = [
      'inspector_modules',
      'inapp_inspector_modules',
      'react_native_inapp_inspector_modules',
    ];

    for (const jKey of jsonKeys) {
      const rawVal = getParamVal(jKey);
      const parsed = extractValue(rawVal);
      if (parsed && typeof parsed === 'object') {
        for (const modKey of MODULE_KEYS) {
          if (typeof parsed[modKey] === 'boolean') {
            modules[modKey] = parsed[modKey];
          }
        }
      }
    }

    // ─── 2. Individual Module Boolean Flags ──────────────────────────────────
    for (const modKey of MODULE_KEYS) {
      const paramKeys = [
        `inspector_module_${modKey}`,
        `inapp_inspector_${modKey}`,
        `inspector_${modKey}`,
        `inapp_inspector_module_${modKey}`,
        `rn_inspector_${modKey}`,
      ];

      for (const pKey of paramKeys) {
        const rawVal = getParamVal(pKey);
        const boolVal = extractValue(rawVal);
        if (typeof boolVal === 'boolean') {
          modules[modKey] = boolVal;
          break;
        }
      }
    }

    if (Object.keys(modules).length > 0) {
      if (modules.apis === undefined) {
        modules.apis = true;
      }
      result.modules = modules;
    }

    // ─── 3. Sponsor Publisher ID (EthicalAds) ────────────────────────────────
    const publisherIdKeys = [
      'inspector_sponsor_publisher_id',
      'inapp_inspector_sponsor_publisher_id',
      'inspector_publisher_id',
      'ethicalads_publisher_id',
    ];
    for (const pKey of publisherIdKeys) {
      const strVal = extractStringValue(getParamVal(pKey));
      if (strVal) {
        result.sponsorPublisherId = strVal;
        break;
      }
    }

    // ─── 4. Custom Sponsor Endpoint ──────────────────────────────────────────
    const endpointKeys = [
      'inspector_sponsor_endpoint',
      'inapp_inspector_sponsor_endpoint',
      'inspector_custom_sponsor_endpoint',
    ];
    for (const eKey of endpointKeys) {
      const strVal = extractStringValue(getParamVal(eKey));
      if (strVal) {
        result.sponsorEndpoint = strVal;
        break;
      }
    }

    // ─── 5. Capture Widget Enabled ───────────────────────────────────────────
    const captureWidgetKeys = [
      'inspector_capture_widget_enabled',
      'inapp_inspector_capture_widget',
      'inspector_floating_capture_enabled',
    ];
    for (const cKey of captureWidgetKeys) {
      const val = extractValue(getParamVal(cKey));
      if (typeof val === 'boolean') {
        result.captureWidgetEnabled = val;
        break;
      }
    }

    // ─── 6. Global Inspector Kill Switch ─────────────────────────────────────
    const enabledKeys = ['inspector_enabled', 'inapp_inspector_enabled'];
    for (const enKey of enabledKeys) {
      const val = extractValue(getParamVal(enKey));
      if (typeof val === 'boolean') {
        result.enabled = val;
        break;
      }
    }

    return Object.keys(result).length > 0 ? result : null;
  } catch {
    return null;
  }
}

/**
 * Backward compatibility: Fetches and activates latest values from Firebase Remote Config, returning module statuses.
 */
export async function fetchRemoteConfigModuleStatus(
  customInstance?: any,
  fetchTimeoutMs = 8000,
): Promise<Partial<Record<ActiveTab, boolean>> | null> {
  const result = await fetchRemoteConfigSettings(customInstance, fetchTimeoutMs);
  return result?.modules || null;
}
