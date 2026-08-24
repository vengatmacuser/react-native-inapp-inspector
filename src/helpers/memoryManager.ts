import {AppState, NativeEventSubscription, Platform} from 'react-native';
import {pruneNetworkLogs} from '../customHooks/networkLogger';
import {pruneConsoleLogs} from '../customHooks/consoleLogger';
import {pruneReduxHistory} from '../customHooks/reduxLogger';
import {pruneAnalyticsLogs} from '../customHooks/analyticsLogger';
import {pruneCrashRecords, addCrashBreadcrumb} from '../customHooks/crashHandler';
import {prunePerformanceEvents} from '../customHooks/performanceTracker';
import {showToast} from './toast';

export interface MemoryPruneSummary {
  timestamp: number;
  prunedNetwork: number;
  prunedConsole: number;
  prunedRedux: number;
  prunedAnalytics: number;
  prunedCrashes: number;
  prunedPerformance: number;
  totalPruned: number;
  triggeredBy: 'memory-warning' | 'manual' | 'ram-threshold';
}

type MemoryWarningListener = (summary: MemoryPruneSummary) => void;

const memoryListeners = new Set<MemoryWarningListener>();
let appStateSubscription: NativeEventSubscription | null = null;
let isMemoryWarningHandlerActive = false;
let lastPruneTimestamp = 0;

/**
 * Prunes all in-memory log stores to prevent OOM / memory pressure.
 * Keeps targetRetentionPct (default: 50%) of existing logs.
 */
export const pruneAllLogs = (
  triggeredBy: MemoryPruneSummary['triggeredBy'] = 'manual',
  targetRetentionPct: number = 0.5,
): MemoryPruneSummary => {
  const targetPct = Math.max(0.1, Math.min(1.0, targetRetentionPct));

  const prunedNetwork = pruneNetworkLogs(undefined);
  const prunedConsole = pruneConsoleLogs(undefined);
  const prunedRedux = pruneReduxHistory(undefined);
  const prunedAnalytics = pruneAnalyticsLogs(undefined);
  const prunedCrashes = pruneCrashRecords(undefined);
  const prunedPerformance = prunePerformanceEvents(undefined);

  const totalPruned =
    prunedNetwork +
    prunedConsole +
    prunedRedux +
    prunedAnalytics +
    prunedCrashes +
    prunedPerformance;

  lastPruneTimestamp = Date.now();

  // Trigger Hermes/V8 Garbage Collection if exposed
  if (typeof (globalThis as any).gc === 'function') {
    try {
      (globalThis as any).gc();
    } catch {}
  }

  const summary: MemoryPruneSummary = {
    timestamp: lastPruneTimestamp,
    prunedNetwork,
    prunedConsole,
    prunedRedux,
    prunedAnalytics,
    prunedCrashes,
    prunedPerformance,
    totalPruned,
    triggeredBy,
  };

  try {
    addCrashBreadcrumb(
      'system',
      `[MemoryManager] Low memory auto-prune executed (${triggeredBy}). Freed ${totalPruned} log records.`,
      summary,
    );
  } catch {}

  memoryListeners.forEach(listener => {
    try {
      listener(summary);
    } catch {}
  });

  return summary;
};

/**
 * Starts listening to OS memory pressure warnings via AppState 'memoryWarning'.
 * Automatically prunes logs and notifies subscribers when memory is constrained.
 */
export const setupMemoryWarningHandler = (): (() => void) => {
  if (isMemoryWarningHandlerActive) {
    return () => {};
  }

  isMemoryWarningHandlerActive = true;

  try {
    appStateSubscription = AppState.addEventListener('memoryWarning' as any, (state: any) => {
      const summary = pruneAllLogs('memory-warning', 0.5);
      try {
        showToast(`Memory Warning: Auto-pruned ${summary.totalPruned} inspector logs`);
      } catch {}
    });
  } catch (e) {
    // AppState memoryWarning might not be supported on all mock/test platforms
  }

  return () => {
    if (appStateSubscription) {
      try {
        appStateSubscription.remove();
      } catch {}
      appStateSubscription = null;
    }
    isMemoryWarningHandlerActive = false;
  };
};

/**
 * Subscribes to memory prune events.
 */
export const subscribeMemoryWarning = (
  listener: MemoryWarningListener,
): (() => void) => {
  memoryListeners.add(listener);
  return () => {
    memoryListeners.delete(listener);
  };
};

export const getLastPruneTimestamp = (): number => lastPruneTimestamp;
export const isMemoryHandlerActive = (): boolean => isMemoryWarningHandlerActive;
