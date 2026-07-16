// #5 — Persistence layer for the inspector's settings selections.
//
// Backed by iOS Settings (NSUserDefaults) for iOS, or custom storage if passed (e.g. AsyncStorage/MMKV).
// Contains an in-memory fallback for Android or Jest test environments.

import { Platform, Settings } from 'react-native';

// In-memory fallback (settings survive for the app session only).
const memory = new Map<string, string>();

export interface InspectorStorage {
  getItem: (key: string) => string | null | Promise<string | null>;
  setItem: (key: string, value: string) => void | Promise<void>;
}

let customStorage: InspectorStorage | null = null;

export function setCustomStorage(storage: InspectorStorage | null) {
  customStorage = storage;
}

const SETTINGS_KEY = 'rn-inapp-inspector.settings.v1';

export interface PersistedSettings {
  isDark?: boolean;
  modalHeightPercent?: number;
  modalAnimationType?: string;
  tabVisibility?: Record<string, boolean>;
  defaultTab?: string;
  maxNetworkLogs?: number;
  maxConsoleLogs?: number;
  showConsoleLevels?: {info: boolean; warn: boolean; error: boolean};
  webViewCaptureCssJs?: boolean;
  reduxAutoRefresh?: boolean;
  reduxExpandDepth?: number;
  slowRequestThreshold?: number;
  insightsShowConsoleAlerts?: boolean;
  showDuplicateLogs?: boolean;
}

export async function loadSettings(): Promise<PersistedSettings> {
  try {
    if (customStorage) {
      const raw = await customStorage.getItem(SETTINGS_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : {};
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

    // Android/fallback: memory
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

    if (Platform.OS === 'ios') {
      Settings.set({ [SETTINGS_KEY]: raw });
      return;
    }

    // Android/fallback: memory
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
  return customStorage !== null || Platform.OS === 'ios';
};

export function getCustomStorage(): InspectorStorage | null {
  return customStorage;
}

