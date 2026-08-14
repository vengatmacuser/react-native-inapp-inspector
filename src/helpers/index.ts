import {Clipboard, Platform, ToastAndroid, Alert, NativeModules, Linking} from 'react-native';

// Stylesheet
import {AppColors} from '../styles/AppColors';

// Constants
import {DOMAIN_COLORS, DURATION_FAST_MS, DURATION_SLOW_MS} from '../constants';

// Type Definition
import {NetworkLog, RouteInfo, DiffResult, JsonContent} from '../types';

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

// Try loading community clipboard or native clipboard modules with graceful fallbacks
const getClipboardModule = () => {
  try {
    // @ts-ignore
    const community = require('@react-native-clipboard/clipboard');
    if (community?.default?.setString) return community.default;
    if (community?.setString) return community;
  } catch {}

  try {
    // @ts-ignore
    const oldCommunity = require('@react-native-community/clipboard');
    if (oldCommunity?.default?.setString) return oldCommunity.default;
    if (oldCommunity?.setString) return oldCommunity;
  } catch {}

  try {
    if (NativeModules?.RNCClipboard?.setString) return NativeModules.RNCClipboard;
  } catch {}

  return Clipboard;
};

export const copyToClipboard = (value: unknown, label: string): void => {
  const resolved = typeof value === 'function' ? (value as Function)() : value;
  const text =
    typeof resolved === 'string' ? resolved : JSON.stringify(resolved, null, 2);
  const textToCopy = text ?? '';

  try {
    const cb = getClipboardModule();
    if (cb && typeof cb.setString === 'function') {
      cb.setString(textToCopy);
    } else {
      Clipboard.setString(textToCopy);
    }
  } catch {
    try {
      Clipboard.setString(textToCopy);
    } catch {}
  }

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
    // Fallback: try to parse from SourceCode
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

export const handleOpenExternalLink = (url: string): void => {
  if (!url) return;
  const openUrl = formatDisplayUrl(url);
  Alert.alert(
    'Open Link',
    `Do you want to open this link in your web browser?\n\n${openUrl}`,
    [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Open',
        onPress: () => {
          Linking.openURL(openUrl).catch(() => {});
        },
      },
    ]
  );
};

/** Formats a timestamp as HH:MM:SS (no milliseconds). */
export const formatTimeShort = (ts: number): string => {
  const d = new Date(ts);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
};

/** Formats a timestamp as HH:MM:SS.mmm (with milliseconds). */
export const formatTime = (ts: number): string => {
  const d = new Date(ts);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  const ms = String(d.getMilliseconds()).padStart(3, '0');
  return `${hh}:${mm}:${ss}.${ms}`;
};

/** Formats a relative gap like "+2s" / "+1m 5s" / "+350ms". */
export const formatGap = (ms: number): string => {
  if (ms < 1000) return `+${ms}ms`;
  const s = Math.round(ms / 1000);
  if (s < 60) return `+${s}s`;
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return rem > 0 ? `+${m}m ${rem}s` : `+${m}m`;
};

/** Finds the first JSON object/array embedded anywhere in a log message. */
export const getJsonContent = (message: string): JsonContent | null => {
  if (!message) return null;

  const indices: number[] = [];
  for (let i = 0; i < message.length; i++) {
    if (message[i] === '{' || message[i] === '[') {
      indices.push(i);
    }
  }

  for (const index of indices) {
    const candidate = message.substring(index).trim();
    try {
      const parsed = JSON.parse(candidate);
      if (parsed !== null && typeof parsed === 'object') {
        const header = message.substring(0, index).trim();
        return {header, data: parsed};
      }
    } catch (e) {
      // Ignore
    }
  }

  return null;
};

/** Pretty-prints JSON data showing 3-4 lines with trailing "..." */
export const getJsonPreviewText = (data: any, maxLines = 4): {text: string; hasMore: boolean} => {
  try {
    const formatted = JSON.stringify(data, null, 2);
    const lines = formatted.split('\n');
    if (lines.length > maxLines) {
      return {
        text: lines.slice(0, maxLines).join('\n') + '\n...',
        hasMore: true,
      };
    }
    return {
      text: formatted,
      hasMore: false,
    };
  } catch (e) {
    return {
      text: String(data),
      hasMore: false,
    };
  }
};

export interface ParsedStackFrame {
  raw: string;
  functionName: string;
  fileName: string;
  fullPath: string;
  fileExt?: 'tsx' | 'jsx' | 'ts' | 'js' | 'other';
  isUserCode?: boolean;
  lineNumber?: string;
  columnNumber?: string;
  isOrigin?: boolean;
}

/** Parses a stack trace line to extract function name, file name, extension (.tsx/.jsx/.ts), line, and column numbers */
export const parseStackLine = (rawLine: string, isOrigin = false): ParsedStackFrame => {
  let line = rawLine.trim().replace(/^at /, '');

  // Format: func@file:line:col (JSC / Hermes format)
  if (line.includes('@')) {
    const atIndex = line.indexOf('@');
    const funcPart = line.substring(0, atIndex).trim();
    const pathPart = line.substring(atIndex + 1).trim();
    line = funcPart ? `${funcPart} (${pathPart})` : pathPart;
  }

  // Check for "func (path:line:col)" or "path:line:col"
  const parenMatch = line.match(/^(.*?)\s*\((.*?)\)$/);
  let functionName = '<anonymous>';
  let locationPart = line;

  if (parenMatch) {
    functionName = parenMatch[1].trim() || '<anonymous>';
    locationPart = parenMatch[2].trim();
  }

  // Remove "address at " prefix if present in Hermes
  locationPart = locationPart.replace(/^address at /, '');

  // Extract file, line, and col from locationPart (e.g. "path/to/file.tsx:42:15" or "http://...:42:15")
  const locMatch = locationPart.match(/^(.*?):(\d+):(\d+)$/);
  let fullPath = locationPart;
  let lineNumber: string | undefined;
  let columnNumber: string | undefined;

  if (locMatch) {
    fullPath = locMatch[1];
    lineNumber = locMatch[2];
    columnNumber = locMatch[3];
  }

  // Clean file name (remove query strings, packager urls, and parent paths)
  let cleanPath = fullPath.split('?')[0].split('&')[0].replace(/[)]+$/, '');
  // Remove protocol prefixes
  cleanPath = cleanPath.replace(/^(?:https?:\/\/[^\/]+\/|file:\/\/\/|webpack:\/\/\/?)/, '');
  const fileName = cleanPath.split('/').pop() || cleanPath;

  // Determine file extension (.tsx, .jsx, .ts, .js)
  const extMatch = fileName.match(/\.([a-z0-9]+)$/i);
  const ext = extMatch ? extMatch[1].toLowerCase() : '';
  const fileExt: 'tsx' | 'jsx' | 'ts' | 'js' | 'other' =
    ext === 'tsx' || ext === 'jsx' || ext === 'ts' || ext === 'js'
      ? (ext as 'tsx' | 'jsx' | 'ts' | 'js')
      : 'other';

  const isUserCode =
    !cleanPath.includes('node_modules') &&
    !cleanPath.includes('react-native/') &&
    !cleanPath.includes('react-native-inapp-inspector') &&
    (fileExt === 'tsx' || fileExt === 'jsx' || fileExt === 'ts' || fileExt === 'js');

  return {
    raw: rawLine,
    functionName,
    fileName,
    fullPath: cleanPath,
    fileExt,
    isUserCode,
    lineNumber,
    columnNumber,
    isOrigin,
  };
};

