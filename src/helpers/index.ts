import {
  Platform,
  ToastAndroid,
  Alert,
  NativeModules,
  Linking,
} from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import {showToast} from './toast';

// Stylesheet
import {AppColors} from '../styles/AppColors';

// Constants
import {DOMAIN_COLORS, DURATION_FAST_MS, DURATION_SLOW_MS} from '../constants';

// Type Definition
import {
  NetworkLog,
  RouteInfo,
  DiffResult,
  JsonContent,
  StackFrameType,
} from '../types';
export * from './searchQueryParser';
export * from './memoryManager';
export * from './toast';

/**
 * Returns true if running in local debug environment (connected to Metro/dev server, __DEV__ is true).
 * Returns false in standalone release / signed APKs.
 */
export const isLocalDebugEnvironment = (): boolean => {
  const isDev = typeof __DEV__ !== 'undefined' && Boolean(__DEV__);
  const scriptURL: string = NativeModules.SourceCode?.scriptURL || '';
  const hasDevServer =
    scriptURL.startsWith('http://') ||
    scriptURL.startsWith('https://') ||
    scriptURL.includes(':8081') ||
    scriptURL.includes(':8082');
  return isDev || hasDevServer;
};

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

export const formatTimestamp = (timestamp: number): string => {
  try {
    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    const ms = date.getMilliseconds().toString().padStart(3, '0');
    return `${hours}:${minutes}:${seconds}.${ms}`;
  } catch {
    return '—';
  }
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

export const formatBytes = (bytes: number): string => {
  if (bytes === 0 || !bytes || isNaN(bytes)) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i] || 'B'}`;
};

export const copyToClipboard = (value: unknown, label?: string): void => {

  const resolved = typeof value === 'function' ? (value as Function)() : value;
  let textToCopy = '';
  if (typeof resolved === 'string') {
    textToCopy = resolved;
  } else {
    try {
      textToCopy = JSON.stringify(resolved, null, 2);
    } catch {
      textToCopy = String(resolved);
    }
  }

  // Use @react-native-clipboard/clipboard npm package
  try {
    if (typeof Clipboard?.setString === 'function') {
      Clipboard.setString(textToCopy);
    } else if (typeof (Clipboard as any)?.default?.setString === 'function') {
      (Clipboard as any).default.setString(textToCopy);
    }
  } catch (err) {
    if (__DEV__) {
      console.warn('[NetworkInspector] Clipboard.setString failed:', err);
    }
  }

  // Trigger floating in-app bottom toast notification
  try {
    showToast(label ? `${label} copied to clipboard` : 'Copied to clipboard');
  } catch {}

  // Native Android Toast fallback
  try {
    if (Platform.OS === 'android' && ToastAndroid?.show) {
      ToastAndroid.show(
        label ? `${label} copied to clipboard` : 'Copied to clipboard',
        ToastAndroid.SHORT,
      );
    }
  } catch {}
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
    if (!map.has(entry.id)) {
      map.set(entry.id, entry);
    } else {
      const existing = map.get(entry.id)!;
      if (existing.status == null && entry.status != null) {
        map.set(entry.id, entry);
      } else if ((entry.startTime ?? 0) >= (existing.startTime ?? 0)) {
        map.set(entry.id, entry);
      }
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
  if (!state) {
    return {
      path: path.length > 0 ? path.join(' ➔ ') : '',
      params: null,
    };
  }
  if (state.name && !state.routes) {
    const fullPath =
      path.length > 0 ? [...path, state.name].join(' ➔ ') : state.name;
    return {path: fullPath, params: state.params || null};
  }
  if (
    !state.routes ||
    !Array.isArray(state.routes) ||
    state.routes.length === 0
  ) {
    return {
      path: path.length > 0 ? path.join(' ➔ ') : '',
      params: null,
    };
  }
  const index =
    typeof state.index === 'number' &&
    state.index >= 0 &&
    state.index < state.routes.length
      ? state.index
      : 0;
  const route = state.routes[index];
  if (!route) {
    return {
      path: path.length > 0 ? path.join(' ➔ ') : '',
      params: null,
    };
  }
  const currentPath = route.name ? [...path, route.name] : path;

  if (route?.state) {
    return getNavigationInfo(route.state, currentPath);
  }
  const resolved =
    currentPath.length > 0 ? currentPath.join(' ➔ ') : route.name || '';
  return {path: resolved, params: route.params || null};
};

export const getLogPageName = (
  log: NetworkLog,
  routeInfo?: RouteInfo | null,
): string => {
  // 1. If routeInfo has a valid path, resolve the leaf screen name
  const effectiveRoute = routeInfo || (log as any)?.routeInfo;
  if (
    effectiveRoute &&
    effectiveRoute.path &&
    effectiveRoute.path !== 'Navigators'
  ) {
    const parts = effectiveRoute.path
      .split(' ➔ ')
      .map((s: string) => s.trim())
      .filter(Boolean);
    if (parts.length > 0) {
      return parts[parts.length - 1]; // Leaf screen name, e.g. "HomeScreen", "ProfileScreen"
    }
    return effectiveRoute.path;
  }

  // 2. Extract screen / component name from log.caller stack trace
  if (log.caller && log.caller !== 'Unknown') {
    try {
      const match = log.caller.match(/([^/\\]+)\.(tsx|jsx|ts|js)/i);
      if (match && match[1]) {
        const file = match[1];
        const ignored = [
          'networklogger',
          'fetch',
          'axios',
          'apiclient',
          'request',
          'http',
          'index',
          'nativeinspector',
          'inappinspector',
          'bundleanalyzer',
        ];
        if (!ignored.includes(file.toLowerCase())) {
          return file;
        }
      }
    } catch (e) {}
  }

  // 3. Fallback to API resource / endpoint category from URL
  if (log.url) {
    try {
      const cleanUrl = log.url.split('?')[0].split('#')[0];
      const withoutProto = cleanUrl.replace(/^https?:\/\//i, '');
      const slashIdx = withoutProto.indexOf('/');
      if (slashIdx !== -1) {
        const pathSegments = withoutProto
          .substring(slashIdx + 1)
          .split('/')
          .filter(Boolean);
        const ignoredSegments = [
          'api',
          'v1',
          'v2',
          'v3',
          'v4',
          'rest',
          'graphql',
          'json',
          'data',
          'service',
          'app',
        ];
        const meaningful = pathSegments.filter(
          s => !ignoredSegments.includes(s.toLowerCase()),
        );
        if (meaningful.length > 0) {
          const seg = meaningful[0];
          return seg.charAt(0).toUpperCase() + seg.slice(1);
        }
      }
      const host = withoutProto.split('/')[0];
      if (host) return host;
    } catch (e) {}
  }

  return 'General';
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

export const getAppVersionAndBuild = (): {
  version: string;
  build: string;
  formatted: string;
} => {
  let version = '';
  let build = '';

  // 1. Try ExpoApplication / ExponentConstants
  const ExpoApplication = NativeModules.ExpoApplication;
  if (ExpoApplication) {
    if (typeof ExpoApplication.nativeAppVersion === 'string') {
      version = ExpoApplication.nativeAppVersion;
    }
    if (typeof ExpoApplication.nativeBuildVersion === 'string') {
      build = ExpoApplication.nativeBuildVersion;
    }
  }

  const ExponentConstants = NativeModules.ExponentConstants;
  if (ExponentConstants) {
    const manifest = ExponentConstants.manifest || ExponentConstants.expoConfig;
    if (manifest) {
      if (!version && manifest.version) {
        version = String(manifest.version);
      }
      if (!build) {
        if (manifest.ios?.buildNumber) {
          build = String(manifest.ios.buildNumber);
        } else if (manifest.android?.versionCode) {
          build = String(manifest.android.versionCode);
        }
      }
    }
  }

  // 2. Try react-native-device-info
  const RNDeviceInfo = NativeModules.RNDeviceInfo;
  if (RNDeviceInfo) {
    if (!version) {
      if (typeof RNDeviceInfo.appVersion === 'string') {
        version = RNDeviceInfo.appVersion;
      } else if (typeof RNDeviceInfo.getVersion === 'function') {
        try {
          version = RNDeviceInfo.getVersion();
        } catch (e) {}
      }
    }
    if (!build) {
      if (typeof RNDeviceInfo.buildNumber === 'string') {
        build = RNDeviceInfo.buildNumber;
      } else if (typeof RNDeviceInfo.getBuildNumber === 'function') {
        try {
          build = RNDeviceInfo.getBuildNumber();
        } catch (e) {}
      }
    }
  }

  // 3. Try PlatformConstants / Platform.constants
  const constants =
    (Platform.constants as any) || NativeModules.PlatformConstants;
  if (constants) {
    if (
      !version &&
      constants.Version &&
      typeof constants.Version === 'string' &&
      constants.Version.includes('.')
    ) {
      version = constants.Version;
    }
    if (!version && constants.reactNativeVersion) {
      const rnv = constants.reactNativeVersion;
      if (rnv.major !== undefined) {
        version = `${rnv.major}.${rnv.minor}.${rnv.patch}`;
      }
    }
  }

  // 4. Try Android AppInfo
  const AppInfo = NativeModules.AppInfo;
  if (AppInfo) {
    if (!version && typeof AppInfo.versionName === 'string') {
      version = AppInfo.versionName;
    }
    if (!build && typeof AppInfo.versionCode === 'string') {
      build = AppInfo.versionCode;
    }
  }

  // Fallbacks
  if (!version) version = '1.0.0';
  if (!build) build = '1';

  return {
    version,
    build,
    formatted: `${version} (${build})`,
  };
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
    ],
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
export const getJsonPreviewText = (
  data: any,
  maxLines = 4,
): {text: string; hasMore: boolean} => {
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
  fileExt: string;
  frameType: StackFrameType | 'app' | 'dependency' | 'runtime' | 'native';
  isUserCode: boolean;
  isRuntimeNoise: boolean;
  rawFilePath?: string;
  lineNumber?: string;
  columnNumber?: string;
  isOrigin?: boolean;
  copyableLocation: string;
}

/** Parses a stack trace line to extract function name, file name, extension (.tsx/.jsx/.ts), line, and column numbers */
export const parseStackLine = (
  rawLine: string,
  isOrigin = false,
): ParsedStackFrame => {
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

  // Clean Babel/Hermes artifacts in function names like ?anon_0_, _callee$, etc.
  if (functionName.startsWith('?anon_') || functionName === '?') {
    functionName = 'anonymous';
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
  let cleanPath = fullPath
    .split('?')[0]
    .split('&')[0]
    .replace(/[)]+$/, '')
    .replace(/\/\/+$/, '');
  // Remove protocol prefixes
  cleanPath = cleanPath.replace(
    /^(?:https?:\/\/[^\/]+\/|file:\/\/\/|webpack:\/\/\/?)/,
    '',
  );
  const fileName = cleanPath.split('/').filter(Boolean).pop() || cleanPath;

  // Determine file extension (.tsx, .jsx, .ts, .js)
  const extMatch = fileName.match(/\.([a-z0-9]+)$/i);
  const ext = extMatch ? extMatch[1].toLowerCase() : '';
  const fileExt: 'tsx' | 'jsx' | 'ts' | 'js' | 'other' =
    ext === 'tsx' || ext === 'jsx' || ext === 'ts' || ext === 'js'
      ? (ext as 'tsx' | 'jsx' | 'ts' | 'js')
      : 'other';

  const isNative = locationPart === 'native' || cleanPath === 'native';
  const isInternalBytecode =
    cleanPath.includes('InternalBytecode') ||
    cleanPath.includes('metro-runtime') ||
    cleanPath.includes('regenerator-runtime') ||
    functionName === 'tryCallOne' ||
    functionName === 'asyncGeneratorStep' ||
    functionName === '_next' ||
    (functionName === 'next' && isNative);

  const isDependency =
    cleanPath.includes('node_modules') ||
    cleanPath.includes('react-native/Libraries') ||
    (cleanPath.includes('react-native-inapp-inspector') &&
      !cleanPath.includes('/example/'));

  const isUserCode =
    !isNative &&
    !isInternalBytecode &&
    !isDependency &&
    (fileExt === 'tsx' ||
      fileExt === 'jsx' ||
      fileExt === 'ts' ||
      fileExt === 'js' ||
      !fileName.includes('.bundle'));

  const frameType: 'app' | 'dependency' | 'runtime' | 'native' = isUserCode
    ? 'app'
    : isDependency
    ? 'dependency'
    : isNative
    ? 'native'
    : 'runtime';

  const isRuntimeNoise =
    isInternalBytecode ||
    isNative ||
    functionName === 'asyncGeneratorStep' ||
    functionName === '_next';

  // Format clean relative project path
  let relativePath = cleanPath;
  if (relativePath.includes('/example/')) {
    relativePath = relativePath.substring(
      relativePath.indexOf('/example/') + 9,
    );
  } else if (relativePath.includes('/src/')) {
    relativePath = relativePath.substring(relativePath.indexOf('/src/') + 1);
  } else if (relativePath.includes('/node_modules/')) {
    relativePath = relativePath.substring(
      relativePath.indexOf('/node_modules/') + 14,
    );
  }

  const copyableLocation = lineNumber
    ? `${fileName}:${lineNumber}${columnNumber ? `:${columnNumber}` : ''}`
    : fileName;

  return {
    raw: rawLine,
    functionName,
    fileName,
    fullPath: relativePath,
    rawFilePath: fullPath,
    fileExt,
    frameType,
    isUserCode,
    isRuntimeNoise,
    lineNumber,
    columnNumber,
    isOrigin,
    copyableLocation,
  };
};

/** Opens a file and line number directly in VS Code / system editor */
export const openInVSCode = (
  filePath: string,
  lineNumber?: string | number,
  columnNumber?: string | number,
) => {
  const numLine = lineNumber ? Number(lineNumber) : 1;
  const numCol = columnNumber ? Number(columnNumber) : 1;
  const line = lineNumber ? `:${lineNumber}` : '';
  const col = columnNumber ? `:${columnNumber}` : '';
  const cleanPath = filePath.replace(/^file:\/\//, '');

  // 1. Notify Metro dev server on host to launch editor directly on local system
  let extractedOrigin: string | null = null;
  try {
    const scriptURL =
      (NativeModules?.SourceCode as any)?.scriptURL ||
      (NativeModules?.PlatformConstants as any)?.serverHost ||
      (NativeModules?.DevSettings as any)?.serverHost;
    if (typeof scriptURL === 'string' && scriptURL.length > 0) {
      const match = scriptURL.match(/^(https?:\/\/[^/]+)/);
      if (match) {
        extractedOrigin = match[1];
      } else if (!scriptURL.startsWith('http') && scriptURL.includes(':')) {
        extractedOrigin = `http://${scriptURL}`;
      }
    }
  } catch {}

  const metroHosts = Array.from(
    new Set([
      ...(extractedOrigin ? [extractedOrigin] : []),
      'http://localhost:8081',
      'http://127.0.0.1:8081',
      'http://10.0.2.2:8081',
    ]),
  );

  metroHosts.forEach(host => {
    try {
      fetch(`${host}/open-stack-frame`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          file: cleanPath,
          lineNumber: numLine,
          column: numCol,
        }),
      }).catch(() => {});
    } catch {}
  });

  // 2. Also invoke native URL scheme handlers
  const vscodeUrl = `vscode://file/${cleanPath.replace(/^\/+/, '')}${line}${col}`;
  const cursorUrl = `cursor://file/${cleanPath.replace(/^\/+/, '')}${line}${col}`;
  const vscodeInsidersUrl = `vscode-insiders://file/${cleanPath.replace(/^\/+/, '')}${line}${col}`;

  Linking.openURL(vscodeUrl).catch(() => {
    Linking.openURL(cursorUrl).catch(() => {
      Linking.openURL(vscodeInsidersUrl).catch(() => {
        // Fallback: Copy to clipboard so user can jump immediately
        copyToClipboard(`${cleanPath}${line}${col}`, 'Location');
      });
    });
  });
};

// ─── Analytics Helpers ────────────────────────────────────────────────────────

export const ANALYTICS_EVENT_PALETTE = [
  AppColors.googleBlue,
  AppColors.googleGreen,
  AppColors.googlePurple,
  AppColors.googleTeal,
  AppColors.googleRed,
  AppColors.googleOrange,
  AppColors.blue700,
  AppColors.materialGreen,
];

export const getEventColor = (name: string): string => {
  const safeName = typeof name === 'string' ? name : String(name || '');
  let hash = 0;
  for (let i = 0; i < safeName.length; i++) {
    hash = (hash * 31 + safeName.charCodeAt(i)) | 0;
  }
  return ANALYTICS_EVENT_PALETTE[
    Math.abs(hash) % ANALYTICS_EVENT_PALETTE.length
  ];
};

export {
  getEventCategory,
  registerGAPlugin,
  type GAEventCategory,
  type GAPlugin,
} from './gaAnalyticsRegistry';

export const getCategoryColors = (category: string) => {
  switch (category) {
    case 'page_view':
    case 'Page View':
      return {
        bg: AppColors.blueBg,
        border: AppColors.blueBorder,
        text: AppColors.blue800,
      };
    case 'ecommerce':
    case 'Ecommerce':
      return {
        bg: AppColors.greenBg,
        border: AppColors.greenBorder,
        text: AppColors.materialGreen,
      };
    case 'system':
    case 'System':
      return {
        bg: AppColors.greyBg,
        border: AppColors.greyBorder,
        text: AppColors.grey600,
      };
    default:
      return {
        bg: AppColors.purpleBg,
        border: AppColors.purpleBorder,
        text: AppColors.purpleText,
      };
  }
};

export interface RuntimeDiagnostics {
  engineType: 'hermes' | 'v8' | 'jsc';
  archType: 'fabric' | 'paper';
  usedHeapMb: number;
  totalAllocMb: number;
}

export const getRuntimeDiagnostics = (): RuntimeDiagnostics => {
  const isHermes = typeof (global as any).HermesInternal !== 'undefined';
  const isV8 = typeof (global as any)._v8runtime !== 'undefined';
  const engineType: 'hermes' | 'v8' | 'jsc' = isHermes
    ? 'hermes'
    : isV8
    ? 'v8'
    : 'jsc';

  const isFabric =
    typeof (global as any).nativeFabricUIManager !== 'undefined' ||
    Boolean((global as any).__turboModuleProxy);
  const archType: 'fabric' | 'paper' = isFabric ? 'fabric' : 'paper';

  let usedHeapMb = 32.4;
  let totalAllocMb = 64.0;

  try {
    const hermesStats = (
      global as any
    ).HermesInternal?.getInstrumentedStats?.();
    if (hermesStats?.js_heap_size) {
      usedHeapMb = Number(
        (hermesStats.js_heap_size / (1024 * 1024)).toFixed(1),
      );
      totalAllocMb = Number(
        (
          (hermesStats.js_allocated_bytes || hermesStats.js_heap_size * 1.6) /
          (1024 * 1024)
        ).toFixed(1),
      );
    } else if ((global as any).performance?.memory?.usedJSHeapSize) {
      usedHeapMb = Number(
        (
          (global as any).performance.memory.usedJSHeapSize /
          (1024 * 1024)
        ).toFixed(1),
      );
      totalAllocMb = Number(
        (
          (global as any).performance.memory.totalJSHeapSize /
          (1024 * 1024)
        ).toFixed(1),
      );
    }
  } catch {}

  return {
    engineType,
    archType,
    usedHeapMb,
    totalAllocMb,
  };
};
