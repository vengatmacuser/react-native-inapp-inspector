import {Clipboard, Platform, ToastAndroid, Alert, NativeModules} from 'react-native';

// Stylesheet
import {AppColors} from '../styles/AppColors';

// Constants
import {DOMAIN_COLORS, DURATION_FAST_MS, DURATION_SLOW_MS} from '../constants';

// Type Definition
import {NetworkLog, RouteInfo, DiffResult} from '../types';

export const getDomainColor = (domain: string): string => {
  if (!domain) return DOMAIN_COLORS[0];
  let hash = 0;
  for (let i = 0; i < domain.length; i++) {
    hash = domain.charCodeAt(i) + ((hash << 5) - hash);
  }
  return DOMAIN_COLORS[Math.abs(hash) % DOMAIN_COLORS.length];
};

export const formatDateTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  const pad = (n: number, len = 2) => String(n).padStart(len, '0');
  const day = pad(date.getDate());
  const month = pad(date.getMonth() + 1);
  const year = date.getFullYear();
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());
  return `${day}/${month}/${year}  ${hours}:${minutes}:${seconds}`;
};

export const getStatusColor = (status: number | null): string => {
  if (!status || status === 0) return AppColors.errorColor;
  if (status >= 500) return AppColors.errorColor;
  if (status >= 400) return AppColors.darkOrange;
  if (status >= 300) return AppColors.warningIconGold;
  return AppColors.greenColor;
};

export const getDurationColor = (duration: number | null): string => {
  if (duration == null) return AppColors.grayTextWeak;
  if (duration < DURATION_FAST_MS) return AppColors.greenColor;
  if (duration < DURATION_SLOW_MS) return AppColors.lightOrange;
  return AppColors.errorColor;
};

export const getSize = (data: unknown): string => {
  try {
    const bytes = JSON.stringify(data)?.length ?? 0;
    return bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} KB`;
  } catch {
    return '—';
  }
};

export const copyToClipboard = (value: unknown, label: string): void => {
  const resolved = typeof value === 'function' ? (value as Function)() : value;
  const text =
    typeof resolved === 'string' ? resolved : JSON.stringify(resolved, null, 2);
  Clipboard.setString(text ?? '');
  if (Platform.OS === 'android') {
    ToastAndroid.show(`${label} copied`, ToastAndroid.SHORT);
  } else {
    Alert.alert('Copied', `${label} copied to clipboard`, [{text: 'OK'}]);
  }
};

export const getPath = (url: string): string => {
  try {
    const u = new URL(url);
    return u.pathname + (u.search ? u.search : '');
  } catch {
    const withoutDomain = url.replace(/^https?:\/\/[^/?#]+/, '');
    return withoutDomain || '/';
  }
};

export const getBaseUrl = (url: string): string => {
  try {
    const u = new URL(url);
    return `${u.protocol}//${u.host}`;
  } catch {
    const match = url.match(/^(https?:\/\/[^/]+)/);
    return match ? match[1] : '';
  }
};

export const getCurlCommand = (log: NetworkLog): string => {
  let cmd = `curl -X ${log.method} "${log.url}"`;
  if (log.requestHeaders) {
    Object.entries(log.requestHeaders).forEach(([k, v]) => {
      cmd += ` \\\n  -H "${k}: ${v}"`;
    });
  }
  if (log.request && log.method !== 'GET') {
    const body =
      typeof log.request === 'string'
        ? log.request
        : JSON.stringify(log.request);
    cmd += ` \\\n  -d '${body.replace(/'/g, "'\\''")}'`;
  }
  return cmd;
};

export const getFetchCommand = (log: NetworkLog): string => {
  const opts: Record<string, unknown> = {method: log.method};
  if (log.requestHeaders && Object.keys(log.requestHeaders).length > 0) {
    opts.headers = log.requestHeaders;
  }
  if (log.request && log.method !== 'GET') {
    opts.body = JSON.stringify(log.request);
  }
  return `fetch("${log.url}", ${JSON.stringify(opts, null, 2)})`;
};

export const deduplicateLogs = (raw: NetworkLog[]): NetworkLog[] => {
  const map = new Map<number, NetworkLog>();
  raw.forEach(entry => {
    if (!map.has(entry.id) || entry.status != null) {
      map.set(entry.id, entry);
    }
  });
  return Array.from(map.values()).sort((a, b) => b.id - a.id);
};

export const escapeRegex = (str: string): string => {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

export const getNavigationInfo = (
  state: any,
  path: string[] = [],
): RouteInfo => {
  if (!state?.routes) {
    return {
      path: path.length > 0 ? path.join(' ➔ ') : 'Navigators',
      params: null,
    };
  }
  const route = state.routes[state.index ?? 0];
  if (!route) {
    return {
      path: path.length > 0 ? path.join(' ➔ ') : 'Navigators',
      params: null,
    };
  }
  const currentPath = route.name ? [...path, route.name] : path;

  if (route?.state) {
    return getNavigationInfo(route.state, currentPath);
  }
  const resolved =
    currentPath.length > 0 ? currentPath.join(' ➔ ') : 'Navigators';
  return {path: resolved, params: route.params || null};
};

export const flattenObject = (obj: any, prefix = ''): Record<string, any> => {
  let result: Record<string, any> = {};
  if (typeof obj === 'object' && obj !== null) {
    if (Array.isArray(obj)) {
      obj.forEach((v, i) => {
        Object.assign(
          result,
          flattenObject(v, prefix ? `${prefix}[${i}]` : `[${i}]`),
        );
      });
    } else {
      Object.keys(obj).forEach(k => {
        Object.assign(
          result,
          flattenObject(obj[k], prefix ? `${prefix}.${k}` : k),
        );
      });
    }
  } else {
    result[prefix || 'root'] = obj;
  }
  return result;
};

export const getDiff = (oldObj: any, newObj: any): DiffResult[] => {
  const oldFlat = flattenObject(oldObj);
  const newFlat = flattenObject(newObj);
  const diff: DiffResult[] = [];

  const allKeys = new Set([...Object.keys(oldFlat), ...Object.keys(newFlat)]);
  allKeys.forEach(k => {
    if (!(k in oldFlat)) {
      diff.push({type: 'added', path: k, newVal: newFlat[k]});
    } else if (!(k in newFlat)) {
      diff.push({type: 'removed', path: k, oldVal: oldFlat[k]});
    } else if (oldFlat[k] !== newFlat[k]) {
      diff.push({
        type: 'changed',
        path: k,
        oldVal: oldFlat[k],
        newVal: newFlat[k],
      });
    }
  });
  return diff.sort((a, b) => a.path.localeCompare(b.path));
};

export const formatDisplayUrl = (url: string) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `https://${url}`;
};

export const getLocalizedFilePath = (
  path: string | any,
  country: string | any,
  language: string | any,
) => {
  const url = path.replace(
    'country-language',
    `${country?.toLowerCase()}-${language?.toLowerCase()}`,
  );
  return url;
};

export const getLocalizedFilePathWithSlash = (
  path: string | any,
  country: string | any,
  language: string | any,
) => {
  const url = path.replace(
    'country/language',
    `${country?.toLowerCase()}/${language?.toLowerCase()}`,
  );
  return url;
};

export const isAllValuesEmpty = (obj: Record<string, any>) => {
  if (!obj || typeof obj !== 'object') return true;

  return Object.values(obj).every(
    value =>
      value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      Object.keys(value).length === 0,
  );
};

export const formatDateTimeToAnalytics = (ts: number): string => {
  const d = new Date(ts);

  return d?.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

export const getBundleIdentifier = (): string => {
  const RNDeviceInfo = NativeModules.RNDeviceInfo;
  if (RNDeviceInfo && typeof RNDeviceInfo.bundleId === 'string') {
    return RNDeviceInfo.bundleId;
  }
  if (RNDeviceInfo && typeof RNDeviceInfo.getBundleId === 'function') {
    try {
      const res = RNDeviceInfo.getBundleId();
      if (typeof res === 'string') return res;
    } catch (e) {}
  }

  const ExponentConstants = NativeModules.ExponentConstants;
  if (ExponentConstants && ExponentConstants.manifest) {
    const manifest = ExponentConstants.manifest;
    if (manifest.ios && manifest.ios.bundleIdentifier) {
      return manifest.ios.bundleIdentifier;
    }
    if (manifest.android && manifest.android.package) {
      return manifest.android.package;
    }
  }

  const ExpoApplication = NativeModules.ExpoApplication;
  if (ExpoApplication && typeof ExpoApplication.applicationId === 'string') {
    return ExpoApplication.applicationId;
  }

  const SourceCode = NativeModules.SourceCode;
  if (SourceCode && typeof SourceCode.scriptURL === 'string') {
    const url = SourceCode.scriptURL;
    if (url.includes('assets/')) {
      try {
        const match = url.match(/assets\/([^/?#]+)/);
        if (match && match[1]) {
          return match[1];
        }
      } catch (e) {}
    }
  }

  return 'org.reactjs.native.example';
};

export const getAppName = (): string => {
  // Try iOS via PlatformConstants
  const constants = NativeModules.PlatformConstants;
  if (constants && typeof constants.interfaceIdiom === 'string') {
    // On iOS, try to get display name from the main bundle
    const SettingsManager = NativeModules.SettingsManager;
    if (SettingsManager && SettingsManager.settings) {
      const appName = SettingsManager.settings.AppleLocale
        ? undefined
        : undefined;
      // Fallback: try to parse from SourceCode
    }
  }

  // Try react-native-device-info
  const RNDeviceInfo = NativeModules.RNDeviceInfo;
  if (RNDeviceInfo && typeof RNDeviceInfo.appName === 'string') {
    return RNDeviceInfo.appName;
  }

  // Try Expo
  const ExpoApplication = NativeModules.ExpoApplication;
  if (ExpoApplication && typeof ExpoApplication.applicationName === 'string') {
    return ExpoApplication.applicationName;
  }

  const ExponentConstants = NativeModules.ExponentConstants;
  if (ExponentConstants && ExponentConstants.manifest) {
    const manifest = ExponentConstants.manifest;
    if (manifest.name) return manifest.name;
  }

  // Android: try to get from AndroidInfoModule
  const AppInfo = NativeModules.AppInfo;
  if (AppInfo && typeof AppInfo.appName === 'string') {
    return AppInfo.appName;
  }

  // Fallback: derive from bundle ID (last segment, cleaned up)
  const bundleId = getBundleIdentifier();
  if (bundleId && bundleId !== 'org.reactjs.native.example') {
    const parts = bundleId.split('.');
    const last = parts[parts.length - 1];
    // Capitalize first letter
    return last ? last.charAt(0).toUpperCase() + last.slice(1) : 'App';
  }

  return 'App';
};
