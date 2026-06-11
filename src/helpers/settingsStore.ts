// #5 — Persistence layer for the inspector's settings selections.
//
// Backed by @react-native-async-storage/async-storage when the host app has it
// installed (most RN apps do), with a transparent in-memory fallback so this
// library never crashes and never forces a new native dependency.

type AsyncStorageLike = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
};

let storage: AsyncStorageLike | null = null;
try {
  // Optional dependency — resolved only if the host app already ships it.
  const mod = require('@react-native-async-storage/async-storage');
  storage = mod?.default ?? mod ?? null;
  if (storage && typeof storage.getItem !== 'function') storage = null;
} catch {
  storage = null;
}

// In-memory fallback (settings survive for the app session only).
const memory = new Map<string, string>();

const SETTINGS_KEY = 'rn-inapp-inspector.settings.v1';

export interface PersistedSettings {
  isDark?: boolean;
  modalHeightPercent?: number;
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
    const raw = storage
      ? await storage.getItem(SETTINGS_KEY)
      : memory.get(SETTINGS_KEY) ?? null;
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;

/** Debounced save so rapid toggling doesn't hammer storage. */
export function saveSettings(settings: PersistedSettings): void {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    try {
      const raw = JSON.stringify(settings);
      if (storage) {
        await storage.setItem(SETTINGS_KEY, raw);
      } else {
        memory.set(SETTINGS_KEY, raw);
      }
    } catch {
      // Persistence is best-effort — never crash the host app over it.
    }
  }, 250);
}

export async function clearPersistedSettings(): Promise<void> {
  try {
    if (storage) {
      await storage.removeItem(SETTINGS_KEY);
    } else {
      memory.delete(SETTINGS_KEY);
    }
  } catch {
    // ignore
  }
}

export const isPersistentStorageAvailable = () => storage != null;
