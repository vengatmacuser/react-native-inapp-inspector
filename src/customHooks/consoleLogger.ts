import {NativeModules} from 'react-native';
import {ConsoleLog} from '../types';
import {IGNORED_LOG_PREFIXES} from './logFilters';
import {setupGlobalCrashHandler} from './crashHandler';

let logs: ConsoleLog[] = [];
let listeners: ((logs: ConsoleLog[]) => void)[] = [];
let counter = 0;
let isIntercepting = false;
let isConsoleModuleEnabled = true;

export const setConsoleModuleEnabled = (enabled: boolean) => {
  isConsoleModuleEnabled = enabled;
};

export const getConsoleModuleEnabled = () => isConsoleModuleEnabled;

let maxConsoleLogsLimit = 100;

export const setMaxConsoleLogsLimit = (limit: number): void => {
  maxConsoleLogsLimit = Math.max(10, limit);
  if (logs.length > maxConsoleLogsLimit) {
    logs = logs.slice(0, maxConsoleLogsLimit);
    notify();
  }
};

export const getMaxConsoleLogsLimit = (): number => maxConsoleLogsLimit;

export const pruneConsoleLogs = (targetCount?: number): number => {
  const countToKeep = targetCount !== undefined ? Math.max(0, targetCount) : Math.floor(logs.length / 2);
  const pruned = logs.length - countToKeep;
  if (pruned > 0) {
    logs = logs.slice(0, countToKeep);
    notify();
  }
  return Math.max(0, pruned);
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatArgs = (args: any[]): string => {
  return args
    .map(arg => {
      if (arg === null) return 'null';
      if (arg === undefined) return 'undefined';
      if (typeof arg === 'object') {
        try {
          return JSON.stringify(arg, null, 2);
        } catch {
          return Object.prototype.toString.call(arg);
        }
      }
      return String(arg);
    })
    .join(' ');
};

// ─── Dynamic Symbolication Helper for React Native Metro ────────────────────

const getMetroSymbolicateUrl = (): string => {
  try {
    const scriptURL =
      (NativeModules.SourceCode as any)?.scriptURL ||
      (NativeModules?.PlatformConstants as any)?.serverHost ||
      (NativeModules?.DevSettings as any)?.serverHost;
    if (typeof scriptURL === 'string' && scriptURL.length > 0) {
      const match = scriptURL.match(/^(https?:\/\/[^\/]+)/);
      if (match) {
        return `${match[1]}/symbolicate`;
      } else if (!scriptURL.startsWith('http') && scriptURL.includes(':')) {
        return `http://${scriptURL}/symbolicate`;
      }
    }
  } catch {}
  return 'http://localhost:8081/symbolicate';
};

interface MetroSymbolicatedFrame {
  file: string;
  lineNumber?: number;
  column?: number;
  methodName?: string;
  collapse?: boolean;
}

const symbolicateStack = async (
  stackString: string,
): Promise<MetroSymbolicatedFrame[] | null> => {
  if (typeof __DEV__ === 'undefined' || !__DEV__ || !stackString) return null;
  
  // 1. Try React Native built-in symbolicateStackTrace if available
  try {
    let symModule: any = null;
    try {
      // @ts-ignore
      symModule = require('react-native/Libraries/Core/Devtools/symbolicateStackTrace');
    } catch {}

    const symFn = symModule?.default || symModule;
    if (typeof symFn === 'function') {
      const res = await symFn(stackString);
      if (res && Array.isArray(res.stack) && res.stack.length > 0) {
        return res.stack;
      }
    }
  } catch {}

  // 2. Direct HTTP symbolication to dynamic Metro packager endpoint
  try {
    const metroUrl = getMetroSymbolicateUrl();
    const scriptURL = (NativeModules.SourceCode as any)?.scriptURL || 'http://localhost:8081/index.bundle?platform=ios&dev=true';

    // Parse Hermes stack string into frame objects for Metro symbolicate endpoint
    const lines = stackString.split('\n');
    const inputFrames: any[] = [];

    for (const rawLine of lines) {
      const line = rawLine.trim().replace(/^at /, '');
      if (!line) continue;

      let methodName = '<anonymous>';
      let locationPart = line;

      const parenMatch = line.match(/^(.*?)\s*\((.*?)\)$/);
      if (parenMatch) {
        methodName = parenMatch[1].trim() || '<anonymous>';
        locationPart = parenMatch[2].trim();
      } else if (line.includes('@')) {
        const atIdx = line.indexOf('@');
        methodName = line.substring(0, atIdx).trim() || '<anonymous>';
        locationPart = line.substring(atIdx + 1).trim();
      }

      locationPart = locationPart.replace(/^address at /, '');

      const locMatch = locationPart.match(/^(.*?):(\d+):(\d+)$/);
      if (locMatch) {
        let file = locMatch[1];
        if (!file.startsWith('http') && file !== 'native' && !file.includes('InternalBytecode')) {
          file = scriptURL;
        }
        inputFrames.push({
          file,
          lineNumber: parseInt(locMatch[2], 10),
          column: parseInt(locMatch[3], 10),
          methodName,
        });
      }
    }

    if (inputFrames.length > 0) {
      const response = await fetch(metroUrl, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({stack: inputFrames}),
      });

      if (response.ok) {
        const json = await response.json();
        if (json && Array.isArray(json.stack) && json.stack.length > 0) {
          return json.stack;
        }
      }
    }
  } catch {}

  return null;
};

const isLoggerInternal = (line: string): boolean => {
  const l = line.toLowerCase();
  return (
    l.includes('getstackdetails') ||
    l.includes('addlog') ||
    l.includes('consolelogger') ||
    l.includes('setupconsolelogger') ||
    l.includes('formatargs') ||
    l.includes('react-native-inapp-inspector') ||
    l.trim() === 'error'
  );
};

const getStackDetails = (
  args?: any[],
): {caller: string; stack?: string; errorStack?: string; stackToUse?: string} => {
  try {
    let errorStack: string | undefined;
    if (args && args.length > 0) {
      for (const arg of args) {
        if (arg instanceof Error && arg.stack) {
          errorStack = arg.stack;
          break;
        } else if (
          arg &&
          typeof arg === 'object' &&
          typeof arg.stack === 'string'
        ) {
          errorStack = arg.stack;
          break;
        }
      }
    }

    const rawStack = new Error().stack;
    const stackToUse = errorStack || rawStack;
    if (!stackToUse) return {caller: 'Unknown', errorStack};

    const lines = stackToUse.split('\n');
    let userCaller: string | undefined;
    let fallbackCaller: string | undefined;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line || isLoggerInternal(line)) {
        continue;
      }

      const isInternal =
        line.includes('react-native/Libraries') ||
        line.includes('setUpConsole') ||
        line.includes('ExceptionsManager') ||
        line.includes('MessageQueue') ||
        line.includes('metro-runtime') ||
        line.includes('regenerator-runtime');

      if (!fallbackCaller && !line.includes('setUpConsole')) {
        fallbackCaller = line.trim().replace(/^at /, '');
      }

      if (!isInternal) {
        userCaller = line.trim().replace(/^at /, '');
        break;
      }
    }

    const cleanedStack = lines.filter(l => !isLoggerInternal(l)).join('\n');
    const caller = userCaller || fallbackCaller || 'Unknown';
    return {caller, stack: cleanedStack || stackToUse, errorStack, stackToUse};
  } catch (e) {
    return {caller: 'Unknown'};
  }
};

const notify = () => {
  const snapshot = [...logs];
  listeners.forEach(cb => cb(snapshot));
};

const addLog = (
  type: 'info' | 'warn' | 'error',
  args: any[],
  sourceMethod?: 'log' | 'info' | 'warn' | 'error',
) => {
  if (!isConsoleModuleEnabled) return;
  if (isIntercepting) return;
  isIntercepting = true;
  try {
    const message = formatArgs(args);

    // Check if the log should be ignored based on starting prefixes across all categories
    const allPrefixes = [
      ...((IGNORED_LOG_PREFIXES && IGNORED_LOG_PREFIXES.info) || []),
      ...((IGNORED_LOG_PREFIXES && IGNORED_LOG_PREFIXES.warn) || []),
      ...((IGNORED_LOG_PREFIXES && IGNORED_LOG_PREFIXES.error) || []),
    ].filter(p => typeof p === 'string' && p.trim().length > 0);
    if (
      allPrefixes.some(
        prefix =>
          message
            .toLowerCase()
            .trim()
            .startsWith(prefix.toLowerCase().trim()) ||
          message.toLowerCase().trim().includes(prefix.toLowerCase().trim()),
      )
    ) {
      return;
    }

    const {caller, stack, errorStack, stackToUse} = getStackDetails(args);
    const newLog: ConsoleLog = {
      id: counter++,
      type,
      message,
      timestamp: Date.now(),
      caller,
      stack,
      errorStack,
      rawArgs: args,
      sourceMethod,
    };
    logs.unshift(newLog);
    logs = logs.slice(0, maxConsoleLogsLimit);
    notify();

    // Asynchronously symbolicate stack trace via Metro in development
    const stackToSymbolicate = errorStack || stackToUse || stack;
    if (stackToSymbolicate && typeof __DEV__ !== 'undefined' && __DEV__) {
      const currentLogId = newLog.id;
      symbolicateStack(stackToSymbolicate)
        .then(symFrames => {
          if (symFrames && Array.isArray(symFrames) && symFrames.length > 0) {
            const symLines: string[] = [];
            let symUserCaller: string | undefined;

            for (const frame of symFrames) {
              const file = (frame.file || '').replace(/^webpack:\/\/\/?/, '');
              const method = frame.methodName || '<anonymous>';
              const line = frame.lineNumber != null ? `:${frame.lineNumber}` : '';
              const col = frame.column != null ? `:${frame.column}` : '';

              // Skip logger internal frames
              const isInternal =
                file.includes('customHooks/consoleLogger') ||
                file.includes('setupConsoleLogger') ||
                file.includes('getStackDetails') ||
                file.includes('react-native-inapp-inspector/dist') ||
                file.includes('react-native-inapp-inspector/src') ||
                method === 'getStackDetails' ||
                method === 'addLog' ||
                (method === 'log' && file.includes('consoleLogger'));

              if (isInternal) {
                continue;
              }

              const lineStr = `at ${method} (${file}${line}${col})`;
              symLines.push(lineStr);

              const isUserFile =
                file &&
                !file.includes('node_modules') &&
                !file.includes('react-native/') &&
                (file.endsWith('.tsx') ||
                  file.endsWith('.jsx') ||
                  file.endsWith('.ts') ||
                  file.endsWith('.js'));

              if (!symUserCaller && isUserFile) {
                const cleanFile = file.split('/').pop() || file;
                symUserCaller = `${method} (${cleanFile}${line}${col})`;
              }
            }

            const targetLog = logs.find(l => l.id === currentLogId);
            if (targetLog) {
              if (symUserCaller) {
                targetLog.caller = symUserCaller;
              } else if (symLines.length > 0) {
                targetLog.caller = symLines[0].replace(/^at /, '');
              }
              if (symLines.length > 0) {
                targetLog.stack = symLines.join('\n');
              }
              notify();
            }
          }
        })
        .catch(() => {});
    }
  } catch (e) {
    // Fail-safe to prevent crash during logging
  } finally {
    isIntercepting = false;
  }
};

// ─── Public API ───────────────────────────────────────────────────────────────

export const addLogFromCrash = (
  error: any,
  message: string,
  stack?: string,
  isFatal?: boolean,
): ConsoleLog => {
  const {caller, errorStack} = getStackDetails([error]);
  const newLog: ConsoleLog = {
    id: counter++,
    type: 'error',
    message: message || (error?.message ?? 'Runtime Crash'),
    timestamp: Date.now(),
    caller:
      caller !== 'Unknown'
        ? caller
        : isFatal
        ? 'Fatal Crash'
        : 'Unhandled Exception',
    stack: stack || error?.stack || errorStack,
    errorStack: stack || error?.stack,
    rawArgs: [error],
    sourceMethod: 'error',
  };
  logs.unshift(newLog);
  logs = logs.slice(0, maxConsoleLogsLimit);
  notify();

  const stackToSym = stack || error?.stack || errorStack;
  if (stackToSym && typeof __DEV__ !== 'undefined' && __DEV__) {
    symbolicateStack(stackToSym)
      .then(symFrames => {
        if (symFrames && Array.isArray(symFrames) && symFrames.length > 0) {
          const symLines = symFrames.map(
            f =>
              `at ${f.methodName || '<anonymous>'} (${(f.file || '').replace(
                /^webpack:\/\/\/?/,
                '',
              )}:${f.lineNumber ?? 0}:${f.column ?? 0})`,
          );
          const target = logs.find(l => l.id === newLog.id);
          if (target) {
            target.stack = symLines.join('\n');
            notify();
          }
        }
      })
      .catch(() => {});
  }
  return newLog;
};

export const subscribeConsoleLogs = (
  callback: (logs: ConsoleLog[]) => void,
) => {
  listeners.push(callback);
  callback([...logs]);
  return () => {
    listeners = listeners.filter(l => l !== callback);
  };
};

export const clearConsoleLogs = () => {
  logs = [];
  notify();
};

export const getConsoleLogs = () => [...logs];

export const setupConsoleLogger = () => {
  if ((globalThis as any).__CONSOLE_LOGGER_INITIALIZED__) return;

  const originalConsole = {
    log: console.log,
    info: console.info,
    warn: console.warn,
    error: console.error,
  };

  // Intercept console.log
  console.log = (...args: any[]) => {
    try {
      addLog('info', args, 'log');
    } catch {}
    originalConsole.log(...args);
  };

  // Intercept console.info
  console.info = (...args: any[]) => {
    try {
      addLog('info', args, 'info');
    } catch {}
    originalConsole.info(...args);
  };

  // Intercept console.warn
  console.warn = (...args: any[]) => {
    try {
      addLog('warn', args, 'warn');
    } catch {}
    originalConsole.warn(...args);
  };

  // Intercept console.error
  console.error = (...args: any[]) => {
    try {
      addLog('error', args, 'error');
    } catch {}

    const firstArg = args && args[0];
    const isRenderError =
      typeof firstArg === 'string' &&
      (firstArg.includes('The above error occurred in') ||
        firstArg.includes('Render Error') ||
        firstArg.includes('ReferenceError') ||
        firstArg.includes('TypeError'));

    // Suppress console.error if it's a React render crash to prevent RedBox dialog
    if (!isRenderError) {
      originalConsole.error(...args);
    }
  };

  try {
    setupGlobalCrashHandler();
  } catch {}

  (globalThis as any).__CONSOLE_LOGGER_INITIALIZED__ = true;
};
