/**
 * Sub-module entry point: react-native-inapp-inspector/console
 * Clean tree-shaking & isolated console logger.
 */
export {
  setupConsoleLogger,
  clearConsoleLogs,
  subscribeConsoleLogs,
  getConsoleLogs,
  setConsoleModuleEnabled,
  getConsoleModuleEnabled,
  setMaxConsoleLogsLimit,
  getMaxConsoleLogsLimit,
  pruneConsoleLogs,
} from './customHooks/consoleLogger';

export type {
  ConsoleLog,
} from './types';

export {
  ConsoleLogType,
  LogFilter,
} from './types';
