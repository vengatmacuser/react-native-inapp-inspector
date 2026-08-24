import {
  NativeModules,
  NativeEventEmitter,
  DeviceEventEmitter,
  Platform,
} from 'react-native';
import NativeNetworkInspector from './NativeNetworkInspector';

export interface NativeDeviceMetrics {
  totalRAM?: number;
  freeRAM?: number;
  usedRAM?: number;
  residentMemory?: number;
  virtualMemory?: number;
  isLowMemory?: boolean;
  nativeHeapAllocated?: number;
  nativeHeapSize?: number;
  nativeHeapFree?: number;
  freeStorage?: number;
  totalStorage?: number;
  batteryPercent?: number;
  isCharging?: boolean;
  deviceModel?: string;
  deviceBrand?: string;
  osVersion?: string;
  apiLevel?: number;
  cpuAbi?: string;
  appName?: string;
  appVersion?: string;
  appBuild?: string;
  appBundleId?: string;
  appPackageName?: string;
}

export interface NativeCrashEvent {
  platform: 'android' | 'ios';
  error: string;
  name?: string;
  stack?: string;
  threadName?: string;
  timestamp: number;
}

// Seamless TurboModule (New Architecture / JSI) & Legacy NativeModules Bridge resolution
const NativeModule: any =
  NativeNetworkInspector || NativeModules.NetworkInspectorModule;

export const isNativeModuleAvailable = (): boolean => {
  return !!NativeModule;
};

const getNativeEmitter = () => {
  try {
    if (NativeModules && NativeModules.NetworkInspectorModule) {
      return new NativeEventEmitter(NativeModules.NetworkInspectorModule);
    }
  } catch (e) {}
  return null;
};

const nativeEmitter = getNativeEmitter();

/**
 * Retrieves low-level native hardware and system metrics (RAM, Heap, Disk, Battery, CPU).
 */
export const getNativeDeviceMetrics = async (): Promise<NativeDeviceMetrics | null> => {
  if (!NativeModule || !NativeModule.getDeviceMetrics) {
    return null;
  }
  try {
    const metrics: NativeDeviceMetrics = await NativeModule.getDeviceMetrics();
    return metrics;
  } catch (error) {
    return null;
  }
};

/**
 * Enables native signal and uncaught exception protection in the iOS / Android runtime.
 * Automatically ensures the native floating icon is shown and available before UI renders.
 */
export const enableNativeCrashProtection = async (options?: {
  showFloatingButton?: boolean;
}): Promise<boolean> => {
  if (!NativeModule || !NativeModule.enableNativeCrashProtection) {
    return false;
  }
  try {
    const result = await NativeModule.enableNativeCrashProtection();
    if (options?.showFloatingButton !== false) {
      await showNativeFloatingButton();
    }
    return !!result;
  } catch (error) {
    return false;
  }
};

/**
 * Subscribes to fatal native crash events caught by the iOS / Kotlin exception handlers.
 */
export const subscribeNativeCrashes = (
  callback: (event: NativeCrashEvent) => void,
): (() => void) => {
  const cleanups: Array<() => void> = [];

  try {
    const sub1 = DeviceEventEmitter.addListener('onNativeCrash', callback);
    cleanups.push(() => sub1.remove());
  } catch (e) {}

  if (nativeEmitter) {
    try {
      const sub2 = nativeEmitter.addListener('onNativeCrash', callback);
      cleanups.push(() => sub2.remove());
    } catch (e) {}
  }

  return () => {
    cleanups.forEach(fn => {
      try {
        fn();
      } catch (e) {}
    });
  };
};

export interface FloatingButtonOptions {
  size?: number;
  x?: number;
  y?: number;
}

/**
 * Displays the 100% native main-thread floating overlay button.
 * Dragging & touches run on the native UI thread, completely isolated from JS thread stalls.
 */
export const showNativeFloatingButton = async (
  options?: FloatingButtonOptions,
): Promise<boolean> => {
  if (!NativeModule || !NativeModule.showFloatingButton) {
    return false;
  }
  try {
    const result = await NativeModule.showFloatingButton(options || {});
    return !!result;
  } catch (error) {
    return false;
  }
};

/**
 * Hides the native floating overlay button.
 */
export const hideNativeFloatingButton = async (): Promise<boolean> => {
  if (!NativeModule || !NativeModule.hideFloatingButton) {
    return false;
  }
  try {
    const result = await NativeModule.hideFloatingButton();
    return !!result;
  } catch (error) {
    return false;
  }
};

/**
 * Updates the badge/status dot on the native floating overlay button.
 */
export const setNativeFloatingButtonBadge = async (
  hasBadge: boolean,
): Promise<boolean> => {
  if (!NativeModule || !NativeModule.setFloatingButtonBadge) {
    return false;
  }
  try {
    const result = await NativeModule.setFloatingButtonBadge(hasBadge);
    return !!result;
  } catch (error) {
    return false;
  }
};

/**
 * Subscribes to tap events on the native floating button.
 */
export const subscribeNativeFloatingButtonPress = (
  callback: () => void,
): (() => void) => {
  const cleanups: Array<() => void> = [];

  try {
    const sub1 = DeviceEventEmitter.addListener(
      'onFloatingButtonPress',
      callback,
    );
    cleanups.push(() => sub1.remove());
  } catch (e) {}

  if (nativeEmitter) {
    try {
      const sub2 = nativeEmitter.addListener(
        'onFloatingButtonPress',
        callback,
      );
      cleanups.push(() => sub2.remove());
    } catch (e) {}
  }

  // Active Bridgeless / TurboModule tap detection
  const interval = setInterval(async () => {
    if (NativeModule && NativeModule.checkFloatingButtonPress) {
      try {
        const pressed = await NativeModule.checkFloatingButtonPress();
        if (pressed) {
          callback();
        }
      } catch (e) {}
    }
  }, 180);
  cleanups.push(() => clearInterval(interval));

  return () => {
    cleanups.forEach(fn => {
      try {
        fn();
      } catch (e) {}
    });
  };
};

/**
 * Starts hardware-accurate native UI thread FPS tracking (CADisplayLink / Choreographer).
 */
export const startNativeFpsMonitoring = async (): Promise<boolean> => {
  if (!NativeModule || !NativeModule.startFpsMonitoring) {
    return false;
  }
  try {
    const result = await NativeModule.startFpsMonitoring();
    return !!result;
  } catch {
    return false;
  }
};

/**
 * Stops native FPS tracking.
 */
export const stopNativeFpsMonitoring = async (): Promise<boolean> => {
  if (!NativeModule || !NativeModule.stopFpsMonitoring) {
    return false;
  }
  try {
    const result = await NativeModule.stopFpsMonitoring();
    return !!result;
  } catch {
    return false;
  }
};

export interface NativeFpsMetrics {
  fps: number;
  targetFps: number;
}

/**
 * Reads the latest live hardware FPS from CADisplayLink (iOS) or Choreographer (Android).
 */
export const getNativeFpsMetrics = async (): Promise<NativeFpsMetrics> => {
  if (!NativeModule || !NativeModule.getFpsMetrics) {
    return {fps: 60, targetFps: 60};
  }
  try {
    const metrics = await NativeModule.getFpsMetrics();
    return {
      fps: typeof metrics?.fps === 'number' ? metrics.fps : 60,
      targetFps: typeof metrics?.targetFps === 'number' ? metrics.targetFps : 60,
    };
  } catch {
    return {fps: 60, targetFps: 60};
  }
};

/**
 * Subscribes to physical hardware shake events (or Cmd+Ctrl+Z on iOS simulator).
 */
export const subscribeNativeDeviceShake = (
  callback: () => void,
): (() => void) => {
  if (!nativeEmitter) {
    return () => {};
  }
  try {
    const subscription = nativeEmitter.addListener('onDeviceShake', callback);
    return () => {
      subscription.remove();
    };
  } catch {
    return () => {};
  }
};

/**
 * Reads a persisted value synchronously from native NSUserDefaults / SharedPreferences.
 */
export const getNativeStorageItem = async (
  key: string,
): Promise<string | null> => {
  if (!NativeModule || !NativeModule.getNativeStorageItem) {
    return null;
  }
  try {
    const val = await NativeModule.getNativeStorageItem(key);
    return typeof val === 'string' ? val : null;
  } catch {
    return null;
  }
};

/**
 * Persists a key-value pair to native NSUserDefaults / SharedPreferences with 0ms latency.
 */
export const setNativeStorageItem = async (
  key: string,
  value: string | null,
): Promise<boolean> => {
  if (!NativeModule || !NativeModule.setNativeStorageItem) {
    return false;
  }
  try {
    const result = await NativeModule.setNativeStorageItem(key, value);
    return !!result;
  } catch {
    return false;
  }
};

export type HapticStyle = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';

/**
 * Triggers hardware native haptic feedback (iOS UIFeedbackGenerator / Android VibrationEffect).
 */
export const triggerNativeHaptic = async (
  style: HapticStyle = 'light',
): Promise<boolean> => {
  if (!NativeModule || !NativeModule.triggerHaptic) {
    return false;
  }
  try {
    const result = await NativeModule.triggerHaptic(style);
    return !!result;
  } catch {
    return false;
  }
};

export interface NativeSystemMetrics {
  thermalState: 'nominal' | 'fair' | 'serious' | 'critical';
  residentRamMb: number;
  totalPhysicalRamMb: number;
  fps: number;
  activeCpuCores: number;
}

/**
 * Retrieves live system thermal state and RAM telemetry directly from native layer.
 */
export const getNativeSystemMetrics = async (): Promise<NativeSystemMetrics | null> => {
  if (!NativeModule || !NativeModule.getNativeSystemMetrics) {
    return null;
  }
  try {
    const metrics = await NativeModule.getNativeSystemMetrics();
    return metrics as NativeSystemMetrics;
  } catch {
    return null;
  }
};

/**
 * Pushes a log payload to native background worker queues for instant native page caching.
 */
export const pushNativeLogRecord = async (
  pageKey: 'apis' | 'logs' | 'analytics' | 'crash',
  jsonPayload: string,
): Promise<boolean> => {
  if (!NativeModule || !NativeModule.pushNativeLogRecord) {
    return false;
  }
  try {
    const result = await NativeModule.pushNativeLogRecord(pageKey, jsonPayload);
    return !!result;
  } catch {
    return false;
  }
};

export interface NativeCachedPageResult<T = any> {
  pageKey: string;
  total: number;
  offset: number;
  items: T[];
}

/**
 * Fetches pre-indexed, pre-sliced page data directly from native background memory queues.
 * Delivers instantaneous 0ms page loading without blocking JS render thread.
 */
export const fetchNativeCachedPage = async <T = any>(
  pageKey: 'apis' | 'logs' | 'analytics' | 'crash',
  offset: number = 0,
  limit: number = 50,
  query: string = '',
): Promise<NativeCachedPageResult<T> | null> => {
  if (!NativeModule || !NativeModule.getNativeCachedPage) {
    return null;
  }
  try {
    const rawJson: string = await NativeModule.getNativeCachedPage(
      pageKey,
      offset,
      limit,
      query,
    );
    if (!rawJson) return null;
    const parsed = JSON.parse(rawJson);
    const parsedItems = (parsed.items || []).map((item: string | object) =>
      typeof item === 'string' ? JSON.parse(item) : item,
    );
    return {
      pageKey: parsed.pageKey || pageKey,
      total: parsed.total || 0,
      offset: parsed.offset || offset,
      items: parsedItems,
    };
  } catch {
    return null;
  }
};


