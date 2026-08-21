import {
  LogBox,
  NativeModules,
  TurboModuleRegistry,
  NativeEventEmitter,
  Platform,
  AppState,
  Dimensions,
} from 'react-native';
import {CrashRecord, ParsedStackFrame, CrashBreadcrumb} from '../types';
import {CrashExportFormat, CrashType} from '../types/enums';
import {addLogFromCrash} from './consoleLogger';
import {
  showNativeFloatingButton,
  setNativeFloatingButtonBadge,
} from '../native/NativeInspector';
import {t} from '../i18n';

export interface CrashEventPayload {
  error: Error | any;
  isFatal?: boolean;
  message: string;
  stack?: string;
  timestamp: number;
  logId?: number;
  crashRecord?: CrashRecord;
}

export {CrashExportFormat};

type CrashListener = (payload: CrashEventPayload) => void;

let crashListeners: CrashListener[] = [];
let isCrashHandlerInitialized = false;
let lastHandledErrorTimestamp = 0;
let crashRecordsStore: CrashRecord[] = [];
let breadcrumbsStore: CrashBreadcrumb[] = [];
const MAX_BREADCRUMBS = 50;
let maxStoredCrashes = 100;
const appStartTime = Date.now();
let isCrashModuleEnabled = false;

export const setCrashModuleEnabled = (enabled: boolean) => {
  isCrashModuleEnabled = enabled;
};

export const getCrashModuleEnabled = () => isCrashModuleEnabled;

// ─── BREADCRUMB MANAGERS ───────────────────────────────────────────────────────

export const setMaxCrashLogsLimit = (max: number): void => {
  maxStoredCrashes = Math.max(10, max);
  if (crashRecordsStore.length > maxStoredCrashes) {
    crashRecordsStore = crashRecordsStore.slice(0, maxStoredCrashes);
  }
};

export const addCrashBreadcrumb = (
  type: CrashBreadcrumb['type'],
  message: string,
  data?: any,
): void => {
  if (!isCrashModuleEnabled) return;
  try {
    const entry: CrashBreadcrumb = {
      type,
      message,
      timestamp: Date.now(),
      data,
    };
    breadcrumbsStore.unshift(entry);
    if (breadcrumbsStore.length > MAX_BREADCRUMBS) {
      breadcrumbsStore = breadcrumbsStore.slice(0, MAX_BREADCRUMBS);
    }
  } catch {}
};

export const recordNavigationBreadcrumb = (
  fromRoute: string,
  toRoute: string,
): void => {
  addCrashBreadcrumb(
    'navigation',
    t('crash.breadcrumbNavigation', {from: fromRoute || '/', to: toRoute || '/'}),
    {
      from: fromRoute,
      to: toRoute,
    },
  );
};

export const recordNetworkBreadcrumb = (
  url: string,
  method: string,
  status?: number,
  duration?: number,
): void => {
  const statusStr = status != null ? ` [${status}]` : '';
  const durStr = duration != null ? ` (${Math.round(duration)}ms)` : '';
  addCrashBreadcrumb(
    'network',
    `${method.toUpperCase()} ${url}${statusStr}${durStr}`,
    {
      url,
      method,
      status,
      duration,
    },
  );
};

export const recordReduxBreadcrumb = (
  actionType: string,
  payload?: any,
): void => {
  addCrashBreadcrumb('redux', t('crash.breadcrumbAction', {actionType}), {
    type: actionType,
    payloadSummary:
      typeof payload === 'object' && payload !== null
        ? Object.keys(payload)
        : typeof payload,
  });
};

export const recordUserActionBreadcrumb = (
  action: string,
  metadata?: any,
): void => {
  addCrashBreadcrumb('user', action, metadata);
};

export const clearCrashBreadcrumbs = (): void => {
  breadcrumbsStore = [];
};

export const getCrashBreadcrumbs = (): CrashBreadcrumb[] => {
  return [...breadcrumbsStore];
};

// ─── STACK TRACE PARSING & INTELLIGENT SOURCE DETECTION ───────────────────────

/**
 * Intelligent stack trace parser with multi-engine support:
 * - Hermes bytecode & source maps
 * - Android Java / Kotlin native frames
 * - iOS Objective-C / Swift symbols
 * - JavaScript standard V8 & SpiderMonkey
 */
export const parseCrashStackTrace = (stack?: string): ParsedStackFrame[] => {
  if (!stack || typeof stack !== 'string') return [];
  const lines = stack.split('\n');
  const frames: ParsedStackFrame[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Filter out internal wrapper noise
    if (
      trimmed.includes('crashHandler.ts') ||
      trimmed.includes('handleInterceptedCrash') ||
      trimmed.includes('addLogFromCrash') ||
      trimmed.includes('setupGlobalCrashHandler')
    ) {
      continue;
    }

    // Pattern 1: iOS/Hermes format: method@file:line:column or method@url:line:col
    const iosMatch = trimmed.match(/^([^@]+)@(.*):(\d+):(\d+)$/);
    if (iosMatch) {
      const [, method, file, lineNum, colNum] = iosMatch;
      const cleanFile = file.split('?')[0].split('/').pop() || file;
      const isAppCode =
        !file.includes('node_modules') &&
        !file.includes('react-native') &&
        !file.includes('react-dom') &&
        !file.includes('hermes') &&
        !file.includes('internal');
      frames.push({
        method: method.trim(),
        file: cleanFile,
        lineNumber: parseInt(lineNum, 10),
        column: parseInt(colNum, 10),
        raw: trimmed,
        isAppCode,
      });
      continue;
    }

    // Pattern 2: V8/Android JS format: at method (file:line:column)
    const androidMatch = trimmed.match(/^at\s+(.+)\s+\((.+):(\d+):(\d+)\)$/);
    if (androidMatch) {
      const [, method, file, lineNum, colNum] = androidMatch;
      const cleanFile = file.split('?')[0].split('/').pop() || file;
      const isAppCode =
        !file.includes('node_modules') &&
        !file.includes('react-native') &&
        !file.includes('react-dom') &&
        !file.includes('internal');
      frames.push({
        method: method.trim(),
        file: cleanFile,
        lineNumber: parseInt(lineNum, 10),
        column: parseInt(colNum, 10),
        raw: trimmed,
        isAppCode,
      });
      continue;
    }

    // Pattern 3: Simple at file:line:column
    const simpleMatch = trimmed.match(/^at\s+(.+):(\d+):(\d+)$/);
    if (simpleMatch) {
      const [, file, lineNum, colNum] = simpleMatch;
      const cleanFile = file.split('?')[0].split('/').pop() || file;
      const isAppCode =
        !file.includes('node_modules') && !file.includes('react-native');
      frames.push({
        method: '<anonymous>',
        file: cleanFile,
        lineNumber: parseInt(lineNum, 10),
        column: parseInt(colNum, 10),
        raw: trimmed,
        isAppCode,
      });
      continue;
    }

    // Pattern 4: Java / Android Native Frame: at com.pkg.Class.method(Class.java:123)
    const javaMatch = trimmed.match(
      /^at\s+([a-zA-Z0-9_$.]+)\(([a-zA-Z0-9_$]+\.java):(\d+)\)$/,
    );
    if (javaMatch) {
      const [, methodPath, fileName, lineNum] = javaMatch;
      const isAppCode =
        !methodPath.startsWith('com.facebook.react') &&
        !methodPath.startsWith('android.');
      frames.push({
        method: methodPath,
        file: fileName,
        lineNumber: parseInt(lineNum, 10),
        column: 0,
        raw: trimmed,
        isAppCode,
      });
      continue;
    }

    // Pattern 5: iOS Mach-O Symbol: 0   AppName   0x000000010... -[ViewController method] + 48
    const machOMatch = trimmed.match(
      /^\d+\s+([^\s]+)\s+(0x[0-9a-fA-F]+)\s+(.+)$/,
    );
    if (machOMatch) {
      const [, binaryName, address, symbol] = machOMatch;
      const isAppCode =
        !binaryName.startsWith('lib') &&
        !binaryName.startsWith('Core') &&
        !binaryName.startsWith('React');
      frames.push({
        method: symbol,
        file: binaryName,
        lineNumber: 0,
        column: 0,
        raw: trimmed,
        isAppCode,
      });
      continue;
    }

    // Pattern 6: Fallback for generic frame lines
    frames.push({
      method: trimmed.startsWith('at ') ? trimmed.slice(3) : trimmed,
      file: 'runtime',
      lineNumber: 0,
      column: 0,
      raw: trimmed,
      isAppCode: false,
    });
  }

  return frames;
};

// ─── DIAGNOSTICS & SYSTEM METRICS ─────────────────────────────────────────────

const getMemoryDiagnostics = () => {
  try {
    const performance = (globalThis as any).performance;
    if (performance && performance.memory) {
      return {
        usedJSHeapSize: Math.round(
          performance.memory.usedJSHeapSize / (1024 * 1024),
        ),
        totalJSHeapSize: Math.round(
          performance.memory.totalJSHeapSize / (1024 * 1024),
        ),
      };
    }
  } catch {}
  return undefined;
};

const getScreenDimensions = () => {
  try {
    const window = Dimensions.get('window');
    return `${Math.round(window.width)}x${Math.round(window.height)} (${
      window.scale
    }x)`;
  } catch {
    return t('crash.unknown');
  }
};

/**
 * Computes a unique fingerprint signature to group recurring crash occurrences.
 */
export const computeCrashFingerprint = (crash: CrashRecord): string => {
  const type = crash.type || 'js';
  const name = crash.name || 'Error';
  const topFrame =
    crash.parsedStack && crash.parsedStack.length > 0
      ? crash.parsedStack[0]
      : null;
  const location = topFrame
    ? `${topFrame.file}:${topFrame.lineNumber}`
    : 'unknown';
  return `${type}_${name}_${location}`;
};

// ─── CRASH RECORD MANAGEMENT & INTERCEPTION ───────────────────────────────────

export const getCrashRecords = (): CrashRecord[] => {
  return [...crashRecordsStore];
};

export const clearCrashRecords = (): void => {
  crashRecordsStore = [];
  emitCrashEvent({
    error: null,
    message: '__CLEARED__',
    timestamp: Date.now(),
  });
};

export const subscribeCrashEvents = (listener: CrashListener): (() => void) => {
  crashListeners.push(listener);
  return () => {
    crashListeners = crashListeners.filter(l => l !== listener);
  };
};

export const emitCrashEvent = (payload: CrashEventPayload): void => {
  if (payload.message !== '__CLEARED__') {
    const now = Date.now();
    // Throttle duplicate rapid crash emissions within 250ms
    if (now - lastHandledErrorTimestamp < 250) {
      return;
    }
    lastHandledErrorTimestamp = now;
  }

  crashListeners.forEach(listener => {
    try {
      listener(payload);
    } catch {}
  });
};

/**
 * Core exception interceptor. Ingests all forms of errors, parses call stacks,
 * collects device telemetry, records breadcrumbs, and updates the store.
 */
export const handleInterceptedCrash = (
  errorOrTitle: any,
  rawStack?: any,
  isFatal = false,
  customType?: CrashType,
  componentStack?: string,
): CrashRecord => {
  try {
    const errorObj =
      errorOrTitle instanceof Error
        ? errorOrTitle
        : typeof errorOrTitle === 'object' && errorOrTitle !== null
        ? errorOrTitle
        : new Error(String(errorOrTitle || t('crash.runtimeException')));

    const rawMsg =
      errorObj.message ||
      (typeof errorOrTitle === 'string' ? errorOrTitle : t('crash.runtimeException'));

    let stackString = '';
    if (typeof rawStack === 'string') {
      stackString = rawStack;
    } else if (Array.isArray(rawStack)) {
      stackString = rawStack
        .map(
          f =>
            `at ${f.methodName || '<anonymous>'} (${f.file || 'unknown'}:${
              f.lineNumber || 0
            }:${f.column || 0})`,
        )
        .join('\n');
    } else {
      stackString = errorObj.stack || new Error().stack || '';
    }

    // Determine Crash Type
    let inferredType: CrashType = customType || CrashType.Js;
    const lowMsg = rawMsg.toLowerCase();
    if (!customType) {
      if (
        lowMsg.includes('native') ||
        lowMsg.includes('sigsegv') ||
        lowMsg.includes('nsrange') ||
        lowMsg.includes('nullpointerexception') ||
        lowMsg.includes('fatal signal')
      ) {
        inferredType = CrashType.Native;
      } else if (
        lowMsg.includes('promise') ||
        lowMsg.includes('unhandled rejection') ||
        lowMsg.includes('unhandledrejection')
      ) {
        inferredType = CrashType.Promise;
      } else if (
        lowMsg.includes('render') ||
        lowMsg.includes('errorboundary') ||
        componentStack
      ) {
        inferredType = CrashType.Render;
      } else {
        inferredType = CrashType.Js;
      }
    }

    const now = new Date();
    const dateStr = now.toLocaleDateString();
    const timeStr = now.toLocaleTimeString();

    const parsedStack = parseCrashStackTrace(stackString);

    const log = addLogFromCrash(
      errorObj,
      `[${isFatal ? t('crash.logFatalCrash') : t('crash.logUnhandledError')}] ${rawMsg}`,
      stackString,
      isFatal,
    );

    const isHermes = typeof (globalThis as any).HermesInternal !== 'undefined';
    const isFabric =
      typeof (globalThis as any).nativeFabricUIManager !== 'undefined';

    const crashRecord: CrashRecord = {
      id: `crash_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      error: errorObj,
      isFatal,
      type: inferredType,
      message: rawMsg,
      name: errorObj.name || (isFatal ? t('crash.errorNameFatal') : t('crash.errorNameUnhandled')),
      stack: stackString,
      parsedStack,
      componentStack: componentStack || undefined,
      timestamp: Date.now(),
      dateStr,
      timeStr,
      deviceInfo: {
        platform: Platform.OS,
        osVersion: String(Platform.Version),
        rnVersion: (Platform.constants as any)?.reactNativeVersion
          ? `${(Platform.constants as any).reactNativeVersion.major}.${
              (Platform.constants as any).reactNativeVersion.minor
            }.${(Platform.constants as any).reactNativeVersion.patch}`
          : t('crash.unknown'),
        isHermes,
        isFabric,
        appState: AppState.currentState || 'active',
      },
      memoryInfo: getMemoryDiagnostics(),
      breadcrumbs: [...breadcrumbsStore],
      logId: log?.id,
    };

    crashRecordsStore.unshift(crashRecord);
    if (crashRecordsStore.length > maxStoredCrashes) {
      crashRecordsStore = crashRecordsStore.slice(0, maxStoredCrashes);
    }

    emitCrashEvent({
      error: errorObj,
      isFatal,
      message: `[${isFatal ? t('crash.logFatalCrash') : t('crash.logUnhandledError')}] ${rawMsg}`,
      stack: stackString,
      timestamp: Date.now(),
      logId: log?.id,
      crashRecord,
    });

    // Ensure native floating icon is visible & badged even if React UI is broken
    try {
      showNativeFloatingButton();
      setNativeFloatingButtonBadge(true);
    } catch {}

    return crashRecord;
  } catch (err: any) {
    const fallbackRecord: CrashRecord = {
      id: `crash_${Date.now()}`,
      isFatal: true,
      type: CrashType.Js,
      message: String(errorOrTitle || t('crash.unknownException')),
      timestamp: Date.now(),
      dateStr: new Date().toLocaleDateString(),
      timeStr: new Date().toLocaleTimeString(),
    };
    return fallbackRecord;
  }
};

/**
 * Manually report a caught error with custom metadata.
 */
export const recordCustomCrash = (
  error: Error | string,
  options?: {
    isFatal?: boolean;
    type?: CrashType;
    componentStack?: string;
  },
): CrashRecord => {
  return handleInterceptedCrash(
    error,
    typeof error === 'object' ? (error as Error).stack : undefined,
    options?.isFatal ?? false,
    options?.type || CrashType.Custom,
    options?.componentStack,
  );
};

/**
 * Simulates a crash for developer testing without crashing the host app.
 * Uses real runtime Error objects — no mocked file paths or fake stacks.
 */
export const simulateTestCrash = (
  type: CrashType = CrashType.Js,
  customMessage?: string,
  customStack?: string,
): CrashRecord => {
  const err = new Error(customMessage || _defaultSimMessage(type));

  return handleInterceptedCrash(
    type === CrashType.Native ? err.message : err,
    customStack || err.stack,
    type === CrashType.Native,
    type,
    type === CrashType.Render ? _buildComponentStack() : undefined,
  );
};

/** Generates a generic error message per type — no fake references. */
const _defaultSimMessage = (type: CrashType): string => {
  switch (type) {
    case 'native':
      return t('crash.simNativeMessage');
    case 'promise':
      return t('crash.simPromiseMessage');
    case 'render':
      return t('crash.simRenderMessage');
    default:
      return t('crash.simJsMessage');
  }
};

/** Builds a component stack from the real React tree if possible. */
const _buildComponentStack = (): string | undefined => {
  try {
    const err = new Error();
    if (err.stack) {
      // Return the live stack as a pseudo component-stack
      return err.stack
        .split('\n')
        .slice(1, 6)
        .map(line => `    ${line.trim()}`)
        .join('\n');
    }
  } catch {}
  return undefined;
};

// ─── EXPORT & REPORTING UTILITIES ─────────────────────────────────────────────

/**
 * Formats a crash into Text, Markdown, or JSON.
 */
export const exportCrashReport = (
  crash: CrashRecord,
  format: CrashExportFormat = 'text',
): string => {
  if (format === 'json') {
    return JSON.stringify(crash, null, 2);
  }

  const uptimeSec = Math.round((crash.timestamp - appStartTime) / 1000);

  if (format === 'markdown') {
    const lines: string[] = [];
    lines.push(`## ${t('crash.mdReportTitle', {name: crash.name || 'Error'})}`);
    lines.push(`> **${crash.message}**`);
    lines.push('');
    lines.push(
      `- **${t('crash.reportType')}** \`${crash.type.toUpperCase()}\``,
    );
    lines.push(
      `- **${t('crash.reportFatal')}** \`${
        crash.isFatal
          ? t('crash.mdSeverityFatal')
          : t('crash.mdSeverityHandled')
      }\``,
    );
    lines.push(
      `- **${t('crash.reportTimestamp')}** ${crash.dateStr} ${crash.timeStr}`,
    );
    lines.push(`- **${t('crash.reportUptime')}** ${uptimeSec}s`);
    lines.push(
      `- **${t(
        'crash.reportPlatform',
      )}** ${crash.deviceInfo?.platform?.toUpperCase()} (v${
        crash.deviceInfo?.osVersion
      })`,
    );
    lines.push(
      `- **${t('crash.reportReactNative')}** v${
        crash.deviceInfo?.rnVersion || 'N/A'
      }`,
    );
    lines.push(
      `- **${t('crash.jsEngine')}** ${
        crash.deviceInfo?.isHermes ? t('crash.hermesEngine') : t('crash.jsc')
      }`,
    );
    lines.push(
      `- **${t('crash.reportArchitecture')}** ${
        crash.deviceInfo?.isFabric
          ? t('crash.reportFabricNew')
          : t('crash.reportPaperLegacy')
      }`,
    );
    if (crash.memoryInfo) {
      lines.push(
        `- **${t('crash.reportJsMemory')}** ${
          crash.memoryInfo.usedJSHeapSize
        } MB / ${crash.memoryInfo.totalJSHeapSize} MB`,
      );
    }
    lines.push('');
    lines.push(`### ${t('crash.mdStackTrace')}`);
    lines.push('```');
    lines.push(crash.stack || t('crash.reportNoStackTrace'));
    lines.push('```');
    if (crash.componentStack) {
      lines.push('');
      lines.push(`### ${t('crash.mdComponentHierarchy')}`);
      lines.push('```');
      lines.push(crash.componentStack);
      lines.push('```');
    }
    if (crash.breadcrumbs && crash.breadcrumbs.length > 0) {
      lines.push('');
      lines.push(`### ${t('crash.mdRecentBreadcrumbs')}`);
      crash.breadcrumbs.forEach(b => {
        const time = new Date(b.timestamp).toLocaleTimeString();
        lines.push(
          `- \`[${time}]\` **[${b.type.toUpperCase()}]** ${b.message}`,
        );
      });
    }
    return lines.join('\n');
  }

  // Standard Text format
  const lines: string[] = [];
  lines.push('====================================================');
  lines.push(`               ${t('crash.reportTitle')}              `);
  lines.push('====================================================');
  lines.push(`${t('crash.reportErrorName')}    ${crash.name || 'Error'}`);
  lines.push(`${t('crash.reportMessage')}       ${crash.message}`);
  lines.push(`${t('crash.reportType')}          ${crash.type.toUpperCase()}`);
  lines.push(
    `${t('crash.reportFatal')}         ${
      crash.isFatal ? t('crash.reportFatalYes') : t('crash.reportFatalNo')
    }`,
  );
  lines.push(
    `${t('crash.reportTimestamp')}     ${crash.dateStr} ${crash.timeStr} (${
      crash.timestamp
    })`,
  );
  lines.push(
    `${t('crash.reportUptime')}    ${t('crash.reportUptimeValue', {
      seconds: uptimeSec,
    })}`,
  );
  lines.push(
    `${t(
      'crash.reportPlatform',
    )}      ${crash.deviceInfo?.platform?.toUpperCase()} (v${
      crash.deviceInfo?.osVersion
    })`,
  );
  lines.push(
    `${t('crash.reportReactNative')}  ${crash.deviceInfo?.rnVersion || 'N/A'}`,
  );
  lines.push(
    `${t('crash.reportHermes')}        ${
      crash.deviceInfo?.isHermes
        ? t('crash.reportEnabled')
        : t('crash.reportDisabled')
    }`,
  );
  lines.push(
    `${t('crash.reportArchitecture')}  ${
      crash.deviceInfo?.isFabric
        ? t('crash.reportFabricNew')
        : t('crash.reportPaperLegacy')
    }`,
  );
  lines.push(`${t('crash.reportScreenSize')}   ${getScreenDimensions()}`);
  lines.push(
    `${t('crash.reportAppState')}     ${
      crash.deviceInfo?.appState || 'active'
    }`,
  );
  if (crash.memoryInfo) {
    lines.push(
      `${t('crash.reportJsMemory')}     ${
        crash.memoryInfo.usedJSHeapSize
      } MB / ${crash.memoryInfo.totalJSHeapSize} MB`,
    );
  }
  lines.push('----------------------------------------------------');
  lines.push(`${t('crash.reportStackTrace')}`);
  lines.push(crash.stack || t('crash.reportNoStackTrace'));
  if (crash.componentStack) {
    lines.push('----------------------------------------------------');
    lines.push(`${t('crash.reportComponentHierarchy')}`);
    lines.push(crash.componentStack);
  }
  if (crash.breadcrumbs && crash.breadcrumbs.length > 0) {
    lines.push('----------------------------------------------------');
    lines.push(`${t('crash.reportRecentBreadcrumbs')}`);
    crash.breadcrumbs.forEach(b => {
      const time = new Date(b.timestamp).toLocaleTimeString();
      lines.push(` [${time}] [${b.type.toUpperCase()}] ${b.message}`);
    });
  }
  lines.push('====================================================');
  return lines.join('\n');
};

// ─── GLOBAL HANDLER INITIALIZATION ────────────────────────────────────────────

/**
 * Natively intercepts and prevents crashes, native RedBox dialogues,
 * unhandled JS errors, and unhandled promise rejections.
 */
export const setupGlobalCrashHandler = (): void => {
  if (isCrashHandlerInitialized) return;
  isCrashHandlerInitialized = true;

  // 1. Completely silence React Native LogBox & RedBox overlays
  try {
    if (LogBox && typeof LogBox.ignoreAllLogs === 'function') {
      LogBox.ignoreAllLogs(true);
    }
  } catch {}

  try {
    // @ts-ignore
    const LogBoxData = (require as any)(
      'react-native/Libraries/LogBox/Data/LogBoxData',
    );
    if (LogBoxData && typeof LogBoxData.setDisabled === 'function') {
      LogBoxData.setDisabled(true);
    }
  } catch {}

  // 2. Intercept Native Module: NetworkInspectorModule (Android & iOS)
  try {
    const networkInspectorModule = NativeModules?.NetworkInspectorModule;
    if (networkInspectorModule) {
      if (
        typeof networkInspectorModule.enableNativeCrashProtection === 'function'
      ) {
        networkInspectorModule.enableNativeCrashProtection();
      }

      const nativeEmitter = new NativeEventEmitter(networkInspectorModule);
      nativeEmitter.addListener('onNativeCrash', (event: any) => {
        const platform = event?.platform || Platform.OS;
        const msg = `[${platform.toUpperCase()} ${t('crash.nativeCrashTitle')}] ${
          event?.message || t('crash.nativeUncaughtException')
        }`;
        const stack = event?.stack || '';
        handleInterceptedCrash(msg, stack, true, 'native');
      });
    }
  } catch {}

  // 3. Intercept Native ExceptionsManager & RedBox modules (Bridge & TurboModules)
  try {
    const tmReg =
      (TurboModuleRegistry as any) || (globalThis as any).__turboModuleProxy;
    const nativeExceptionsManager =
      NativeModules?.ExceptionsManager ||
      (tmReg?.get ? tmReg.get('ExceptionsManager') : null);

    if (nativeExceptionsManager) {
      nativeExceptionsManager.reportFatalException = (
        title: string,
        stack: any,
        exceptionId?: number,
      ) => {
        handleInterceptedCrash(title, stack, true, 'native');
        try {
          if (typeof nativeExceptionsManager.dismissRedbox === 'function') {
            nativeExceptionsManager.dismissRedbox();
          }
        } catch {}
      };

      nativeExceptionsManager.reportSoftException = (
        title: string,
        stack: any,
        exceptionId?: number,
      ) => {
        handleInterceptedCrash(title, stack, false, 'js');
        try {
          if (typeof nativeExceptionsManager.dismissRedbox === 'function') {
            nativeExceptionsManager.dismissRedbox();
          }
        } catch {}
      };

      nativeExceptionsManager.reportException = (data: any) => {
        const msg = data?.message || data?.title || t('crash.nativeException');
        const stack = data?.stack || data?.rawStack;
        handleInterceptedCrash(msg, stack, data?.isFatal ?? true, 'js');
        try {
          if (typeof nativeExceptionsManager.dismissRedbox === 'function') {
            nativeExceptionsManager.dismissRedbox();
          }
        } catch {}
      };

      nativeExceptionsManager.updateExceptionMessage = () => {};
      try {
        if (typeof nativeExceptionsManager.dismissRedbox === 'function') {
          nativeExceptionsManager.dismissRedbox();
        }
      } catch {}
    }

    const nativeRedBox =
      NativeModules?.RedBox ||
      NativeModules?.RCTRedBox ||
      (tmReg?.get ? tmReg.get('RedBox') || tmReg.get('RCTRedBox') : null);

    if (nativeRedBox) {
      if (typeof nativeRedBox.showErrorMessage === 'function') {
        nativeRedBox.showErrorMessage = () => {};
      }
      if (typeof nativeRedBox.showUserError === 'function') {
        nativeRedBox.showUserError = () => {};
      }
      if (typeof nativeRedBox.dismiss === 'function') {
        nativeRedBox.dismiss();
      }
    }
  } catch {}

  // 4. Hook React Native ErrorUtils
  try {
    const globalObj = globalThis as any;
    const errorUtils = globalObj.ErrorUtils;

    if (errorUtils) {
      if (typeof errorUtils.setGlobalHandler === 'function') {
        errorUtils.setGlobalHandler((error: Error, isFatal?: boolean) => {
          handleInterceptedCrash(error, error?.stack, isFatal ?? false, 'js');
          // Suppress calling default crashing handler to prevent termination & RedBox
        });
      }
      if (typeof errorUtils.reportFatalError === 'function') {
        errorUtils.reportFatalError = (error: Error) => {
          handleInterceptedCrash(error, error?.stack, true, 'js');
        };
      }
      if (typeof errorUtils.reportError === 'function') {
        errorUtils.reportError = (error: Error) => {
          handleInterceptedCrash(error, error?.stack, false, 'js');
        };
      }
    }
  } catch {}

  // 5. Hook global Promise unhandled rejections
  try {
    const globalObj = globalThis as any;

    const handleUnhandledPromise = (eventOrError: any) => {
      try {
        const reason =
          eventOrError?.reason || eventOrError?.detail?.reason || eventOrError;
        const message =
          reason?.message || String(reason || t('crash.unhandledPromiseRejection'));
        const stack =
          reason?.stack || (eventOrError?.stack ?? new Error().stack);

        handleInterceptedCrash(reason, stack, false, 'promise');
      } catch {}
    };

    if (typeof globalObj.addEventListener === 'function') {
      globalObj.addEventListener('unhandledrejection', handleUnhandledPromise);
    }
    if (typeof globalObj.onunhandledrejection !== 'undefined') {
      globalObj.onunhandledrejection = handleUnhandledPromise;
    }
  } catch {}
};
