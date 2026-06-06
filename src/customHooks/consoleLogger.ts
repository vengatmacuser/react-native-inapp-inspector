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

const getCallerFromStack = (): string => {
  try {
    const stack = new Error().stack;
    if (!stack) return 'Unknown';
    const lines = stack.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // Skip internal console logger stack frames and native helpers
      if (
        line.includes('consoleLogger') ||
        line.includes('setupConsoleLogger') ||
        line.includes('node_modules') ||
        line.includes('Error')
      ) {
        continue;
      }
      return line.trim().replace(/^at /, '');
    }
  } catch (e) {}
  return 'Unknown';
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

    const caller = getCallerFromStack();
    const newLog: ConsoleLog = {
      id: counter++,
      type,
      message,
      timestamp: Date.now(),
      caller,
      sourceMethod,
    };
    logs.unshift(newLog);
    logs = logs.slice(0, MAX_LOGS);
    notify();
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
  if ((global as any).__CONSOLE_LOGGER_INITIALIZED__) return;

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

  (global as any).__CONSOLE_LOGGER_INITIALIZED__ = true;
};
