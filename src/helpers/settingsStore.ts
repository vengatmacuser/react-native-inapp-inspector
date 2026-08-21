// #5 — Persistence layer for the inspector's settings selections.
//
// Backed by iOS Settings (NSUserDefaults) for iOS, or custom storage if passed (e.g. AsyncStorage/MMKV).
// Contains an in-memory fallback for Android or Jest test environments.

import { Platform, Settings } from 'react-native';
import {InspectorStorage, PersistedSettings} from '../types';
import {
  getNativeStorageItem,
  setNativeStorageItem,
  isNativeModuleAvailable,
} from '../native/NativeInspector';

export {InspectorStorage, PersistedSettings};

// In-memory fallback (settings survive for the app session only).
const memory = new Map<string, string>();

let customStorage: InspectorStorage | null = null;

export function setCustomStorage(storage: InspectorStorage | null) {
  customStorage = storage;
}

const SETTINGS_KEY = 'rn-inapp-inspector.settings.v1';

export async function loadSettings(): Promise<PersistedSettings> {
  try {
    if (customStorage) {
      const raw = await customStorage.getItem(SETTINGS_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : {};
    }

    if (isNativeModuleAvailable()) {
      const raw = await getNativeStorageItem(SETTINGS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === 'object' ? parsed : {};
      }
    }

    if (Platform.OS === 'ios') {
      const raw = Settings.get(SETTINGS_KEY);
      if (!raw) return {};
      if (typeof raw === 'string') {
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === 'object' ? parsed : {};
      }
      return raw && typeof raw === 'object' ? raw : {};
    }

    // In-memory fallback
    const raw = memory.get(SETTINGS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function saveSettings(settings: PersistedSettings): void {
  try {
    const raw = JSON.stringify(settings);

    if (customStorage) {
      customStorage.setItem(SETTINGS_KEY, raw);
      return;
    }

    if (isNativeModuleAvailable()) {
      setNativeStorageItem(SETTINGS_KEY, raw);
    }

    if (Platform.OS === 'ios') {
      Settings.set({ [SETTINGS_KEY]: raw });
      return;
    }

    memory.set(SETTINGS_KEY, raw);
  } catch {
    // ignore
  }
}

export async function clearPersistedSettings(): Promise<void> {
  try {
    if (customStorage) {
      if (typeof (customStorage as any).removeItem === 'function') {
        await (customStorage as any).removeItem(SETTINGS_KEY);
      } else {
        await customStorage.setItem(SETTINGS_KEY, '');
      }
      return;
    }

    if (isNativeModuleAvailable()) {
      await setNativeStorageItem(SETTINGS_KEY, null);
    }

    if (Platform.OS === 'ios') {
      Settings.set({ [SETTINGS_KEY]: null });
      return;
    }

    memory.delete(SETTINGS_KEY);
  } catch {
    // ignore
  }
}

export const isPersistentStorageAvailable = () => {
  return customStorage !== null || isNativeModuleAvailable() || Platform.OS === 'ios';
};

export function getCustomStorage(): InspectorStorage | null {
  return customStorage;
}

export interface RamLimitsProfile {
  maxNetworkLogs: number;
  maxConsoleLogs: number;
  maxAnalyticsEvents: number;
  maxCrashRecords: number;
  profileName: 'High-End' | 'Standard' | 'Compact' | 'Ultra-Light';
  freeRamMb: number;
}

export function calculateRamBasedLimits(freeRamMb: number): RamLimitsProfile {
  if (freeRamMb >= 3000) {
    return {
      maxNetworkLogs: 100,
      maxConsoleLogs: 100,
      maxAnalyticsEvents: 75,
      maxCrashRecords: 50,
      profileName: 'High-End',
      freeRamMb,
    };
  } else if (freeRamMb >= 1500) {
    return {
      maxNetworkLogs: 100,
      maxConsoleLogs: 100,
      maxAnalyticsEvents: 75,
      maxCrashRecords: 50,
      profileName: 'Standard',
      freeRamMb,
    };
  } else if (freeRamMb >= 600) {
    return {
      maxNetworkLogs: 100,
      maxConsoleLogs: 100,
      maxAnalyticsEvents: 50,
      maxCrashRecords: 25,
      profileName: 'Compact',
      freeRamMb,
    };
  } else {
    return {
      maxNetworkLogs: 50,
      maxConsoleLogs: 50,
      maxAnalyticsEvents: 25,
      maxCrashRecords: 15,
      profileName: 'Ultra-Light',
      freeRamMb,
    };
  }
}


