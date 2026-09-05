import {ActiveTab} from '../types';

/**
 * Supported Remote Config keys for each module:
 *
 * 1. JSON Configuration:
 *    - `inspector_modules` (e.g. `{"apis": true, "logs": true, "analytics": true, ...}`)
 *    - `inapp_inspector_modules`
 *
 * 2. Individual Boolean Keys:
 *    - `inspector_module_apis` / `inapp_inspector_apis` / `inspector_apis`
 *    - `inspector_module_logs` / `inapp_inspector_logs` / `inspector_logs`
 *    - `inspector_module_analytics` / `inapp_inspector_analytics` / `inspector_analytics`
 *    - `inspector_module_redux` / `inapp_inspector_redux` / `inspector_redux`
 *    - `inspector_module_storage` / `inapp_inspector_storage` / `inspector_storage`
 *    - `inspector_module_device` / `inapp_inspector_device` / `inspector_device`
 *    - `inspector_module_crash` / `inapp_inspector_crash` / `inspector_crash`
 *    - `inspector_module_bundle` / `inapp_inspector_bundle` / `inspector_bundle`
 *    - `inspector_module_performance` / `inapp_inspector_performance` / `inspector_performance`
 *    - `inspector_module_debugging` / `inapp_inspector_debugging` / `inspector_debugging`
 */

const MODULE_KEYS: ActiveTab[] = [
  'apis',
  'logs',
  'analytics',
  'redux',
  'storage',
  'device',
  'crash',
  'bundle',
  'performance',
  'debugging',
];

let cachedRemoteConfigInstance: any = null;

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
 * Fetches and activates latest values from Firebase Remote Config, then parses module enable/disable statuses.
 * Returns a partial or complete mapping of module visibility flags, or null if Remote Config is unavailable.
 *
 * @param customInstance Optional custom remoteConfig instance from consumer app
 * @param fetchTimeoutMs Timeout for fetch operation in ms (default: 8000)
 */
export async function fetchRemoteConfigModuleStatus(
  customInstance?: any,
  fetchTimeoutMs = 8000,
): Promise<Partial<Record<ActiveTab, boolean>> | null> {
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

    // 2. Read values from Remote Config
    const result: Partial<Record<ActiveTab, boolean>> = {};

    // Check JSON bundle key first: `inspector_modules` or `inapp_inspector_modules`
    const jsonKeys = [
      'inspector_modules',
      'inapp_inspector_modules',
      'react_native_inapp_inspector_modules',
    ];

    for (const jKey of jsonKeys) {
      let rawVal: any;
      if (typeof rc.getValue === 'function') {
        try {
          rawVal = rc.getValue(jKey);
        } catch {}
      } else if (rc[jKey] !== undefined) {
        rawVal = rc[jKey];
      }

      const parsed = extractValue(rawVal);
      if (parsed && typeof parsed === 'object') {
        for (const modKey of MODULE_KEYS) {
          if (typeof parsed[modKey] === 'boolean') {
            result[modKey] = parsed[modKey];
          }
        }
      }
    }

    // Check individual module boolean flags (overrides JSON if explicitly defined)
    for (const modKey of MODULE_KEYS) {
      const paramKeys = [
        `inspector_module_${modKey}`,
        `inapp_inspector_${modKey}`,
        `inspector_${modKey}`,
        `inapp_inspector_module_${modKey}`,
        `rn_inspector_${modKey}`,
      ];

      for (const pKey of paramKeys) {
        let rawVal: any;
        if (typeof rc.getValue === 'function') {
          try {
            rawVal = rc.getValue(pKey);
          } catch {}
        } else if (rc[pKey] !== undefined) {
          rawVal = rc[pKey];
        }

        const boolVal = extractValue(rawVal);
        if (typeof boolVal === 'boolean') {
          result[modKey] = boolVal;
          break;
        }
      }
    }

    // APIs module is fundamental core, keep true unless explicitly disabled via remote config
    if (result.apis === undefined) {
      result.apis = true;
    }

    return Object.keys(result).length > 0 ? result : null;
  } catch (error) {
    return null;
  }
}
