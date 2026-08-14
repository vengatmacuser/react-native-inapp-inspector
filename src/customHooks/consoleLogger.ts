import {ConsoleLog} from '../types';
import {IGNORED_LOG_PREFIXES} from './logFilters';

let logs: ConsoleLog[] = [];
let listeners: ((logs: ConsoleLog[]) => void)[] = [];
let counter = 0;
let isIntercepting = false;

const MAX_LOGS = 100;

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

// ─── Symbolication Helper for React Native Metro ────────────────────────────

const symbolicateStack = async (
  stackString: string,
): Promise<{file: string; lineNumber?: number; column?: number; methodName: string}[] | null> => {
  if (typeof __DEV__ === 'undefined' || !__DEV__) return null;
  try {
    // 1. Try React Native's built-in symbolicateStackTrace if available
    let symModule: any = null;
    try {
      // @ts-ignore
      symModule = require('react-native/Libraries/Core/Devtools/symbolicateStackTrace');
    } catch {}

    const symFn = symModule?.default || symModule;
    if (typeof symFn === 'function') {
      const res = await symFn(stackString);
      if (res && Array.isArray(res.stack)) {
        return res.stack;
      }
    }
  } catch {}

  try {
    // 2. Direct HTTP symbolication to Metro packager endpoint
    const metroUrl = 'http://localhost:8081/symbolicate';
    const response = await fetch(metroUrl, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({stack: stackString}),
    });
    if (response.ok) {
      const json = await response.json();
      if (json && Array.isArray(json.stack)) {
        return json.stack;
      }
    }
  } catch {}

  return null;
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
      if (
        !line ||
        line.includes('consoleLogger') ||
        line.includes('setupConsoleLogger') ||
        line.includes('react-native-inapp-inspector') ||
        line.trim() === 'Error'
      ) {
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

    const cleanedStack = lines
      .filter(
        l =>
          !l.includes('consoleLogger') &&
          !l.includes('setupConsoleLogger'),
      )
      .join('\n');

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
    logs = logs.slice(0, MAX_LOGS);
    notify();

    // Asynchronously symbolicate stack trace using Metro in DEV mode
    if (stackToUse && typeof __DEV__ !== 'undefined' && __DEV__) {
      const currentLogId = newLog.id;
      symbolicateStack(stackToUse)
        .then(symFrames => {
          if (symFrames && Array.isArray(symFrames) && symFrames.length > 0) {
            const symLines: string[] = [];
            let symUserCaller: string | undefined;

            for (const frame of symFrames) {
              const file = (frame.file || '').replace(/^webpack:\/\/\/?/, '');
              const method = frame.methodName || '<anonymous>';
              const line = frame.lineNumber != null ? `:${frame.lineNumber}` : '';
              const col = frame.column != null ? `:${frame.column}` : '';
              const lineStr = `at ${method} (${file}${line}${col})`;
              symLines.push(lineStr);

              const isUserFile =
                file &&
                !file.includes('node_modules') &&
                !file.includes('react-native/') &&
                !file.includes('consoleLogger') &&
                !file.includes('setupConsoleLogger') &&
                (file.endsWith('.tsx') ||
                  file.endsWith('.jsx') ||
                  file.endsWith('.ts') ||
                  file.endsWith('.js'));

              if (!symUserCaller && isUserFile) {
                symUserCaller = `${method} (${file}${line}${col})`;
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
    addLog('info', args, 'log');
    originalConsole.log(...args);
  };

  // Intercept console.info
  console.info = (...args: any[]) => {
    addLog('info', args, 'info');
    originalConsole.info(...args);
  };

  // Intercept console.warn
  console.warn = (...args: any[]) => {
    addLog('warn', args, 'warn');
    originalConsole.warn(...args);
  };

  // Intercept console.error
  console.error = (...args: any[]) => {
    addLog('error', args, 'error');
    originalConsole.error(...args);
  };

  (globalThis as any).__CONSOLE_LOGGER_INITIALIZED__ = true;
};
