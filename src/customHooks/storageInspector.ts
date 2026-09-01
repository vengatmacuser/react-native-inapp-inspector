// Universal In-App Storage Inspector Adapter for AsyncStorage & MMKV
// Supports automatic module resolution, NativeModules SQLite fallback, custom instances, and full CRUD operations.

import {NativeModules} from 'react-native';

export interface StorageEntry {
  key: string;
  value: string;
  parsedValue?: any;
  type: 'json' | 'string' | 'number' | 'boolean' | 'null';
  byteSize: number;
}

export type StorageDriver = 'asyncStorage' | 'mmkv';

// In-memory registered storage references
let customAsyncStorage: any = null;
const customMMKVInstances = new Map<string, any>();

// Listeners for storage mutations
const changeListeners = new Set<() => void>();

const notifyChange = () => {
  changeListeners.forEach(listener => {
    try {
      listener();
    } catch {}
  });
};

/**
 * Register an AsyncStorage instance with the inspector (optional override).
 */
export const connectAsyncStorage = (storageInstance: any) => {
  if (storageInstance) {
    customAsyncStorage = storageInstance;
    notifyChange();
  }
};

/**
 * Register an MMKV instance with the inspector (optional override).
 */
export const connectMMKV = (mmkvInstance: any, id: string = 'default') => {
  if (mmkvInstance) {
    customMMKVInstances.set(id, mmkvInstance);
    notifyChange();
  }
};

/**
 * Native Bridge Fallback for AsyncStorage:
 * Directly interfaces with NativeModules.RNCAsyncStorage without needing JS package imports.
 */
const getNativeAsyncStorageBridge = (): any => {
  const nativeModule =
    NativeModules.RNCAsyncStorage ||
    NativeModules.RNC_AsyncSQLiteDBStorage ||
    NativeModules.AsyncSQLiteDBStorage;

  if (nativeModule) {
    return {
      getAllKeys: (): Promise<string[]> => {
        return new Promise((resolve, reject) => {
          if (typeof nativeModule.getAllKeys !== 'function') {
            resolve([]);
            return;
          }
          nativeModule.getAllKeys((err: any, keys: string[]) => {
            if (err) reject(err);
            else resolve(keys || []);
          });
        });
      },
      multiGet: (keys: string[]): Promise<[string, string | null][]> => {
        return new Promise((resolve, reject) => {
          if (typeof nativeModule.multiGet !== 'function') {
            resolve([]);
            return;
          }
          nativeModule.multiGet(keys, (err: any, result: [string, string | null][]) => {
            if (err) reject(err);
            else resolve(result || []);
          });
        });
      },
      getItem: (key: string): Promise<string | null> => {
        return new Promise((resolve, reject) => {
          if (typeof nativeModule.multiGet !== 'function') {
            resolve(null);
            return;
          }
          nativeModule.multiGet([key], (err: any, result: [string, string | null][]) => {
            if (err) reject(err);
            else resolve(result?.[0]?.[1] ?? null);
          });
        });
      },
      setItem: (key: string, value: string): Promise<void> => {
        return new Promise((resolve, reject) => {
          if (typeof nativeModule.multiSet !== 'function') {
            resolve();
            return;
          }
          nativeModule.multiSet([[key, value]], (err: any) => {
            if (err) reject(err);
            else resolve();
          });
        });
      },
      removeItem: (key: string): Promise<void> => {
        return new Promise((resolve, reject) => {
          if (typeof nativeModule.multiRemove !== 'function') {
            resolve();
            return;
          }
          nativeModule.multiRemove([key], (err: any) => {
            if (err) reject(err);
            else resolve();
          });
        });
      },
      clear: (): Promise<void> => {
        return new Promise((resolve, reject) => {
          if (typeof nativeModule.clear !== 'function') {
            resolve();
            return;
          }
          nativeModule.clear((err: any) => {
            if (err) reject(err);
            else resolve();
          });
        });
      },
    };
  }
  return null;
};

/**
 * Auto-detect AsyncStorage:
 * 1. Explicit connection
 * 2. Global instance
 * 3. Dynamic require '@react-native-async-storage/async-storage'
 * 4. Native Bridge Direct interface
 */
export const getResolvedAsyncStorage = (): any => {
  if (customAsyncStorage) return customAsyncStorage;

  // 1. Global instances
  try {
    const maybeReq =
      (globalThis as any)?.__inAppAsyncStorage ||
      (globalThis as any)?.AsyncStorage ||
      (global as any)?.AsyncStorage;
    if (maybeReq && typeof maybeReq.getAllKeys === 'function') {
      return maybeReq;
    }
  } catch {}

  // 2. Dynamic runtime require
  try {
    const req =
      typeof (globalThis as any)?.require === 'function'
        ? (globalThis as any).require
        : typeof require === 'function'
        ? require
        : null;

    if (req) {
      try {
        const mod = req('@react-native-async-storage/async-storage');
        const resolved = mod?.default || mod;
        if (resolved && typeof resolved.getAllKeys === 'function') {
          return resolved;
        }
      } catch {}

      try {
        const legacyMod = req('@react-native-community/async-storage');
        const resolved = legacyMod?.default || legacyMod;
        if (resolved && typeof resolved.getAllKeys === 'function') {
          return resolved;
        }
      } catch {}
    }
  } catch {}

  // 3. Native Bridge Fallback (Direct SQLite)
  const nativeBridge = getNativeAsyncStorageBridge();
  if (nativeBridge) {
    return nativeBridge;
  }

  return null;
};

/**
 * Auto-detect MMKV:
 * 1. Explicit connection
 * 2. Dynamic require 'react-native-mmkv' & instantiate default instance
 * 3. Global MMKV / JSI instances
 */
export const getResolvedMMKV = (id: string = 'default'): any => {
  if (customMMKVInstances.has(id)) {
    return customMMKVInstances.get(id);
  }

  // 1. Dynamic require
  try {
    const req =
      typeof (globalThis as any)?.require === 'function'
        ? (globalThis as any).require
        : typeof require === 'function'
        ? require
        : null;

    if (req) {
      const mmkvMod = req('react-native-mmkv');
      const MMKVClass = mmkvMod?.MMKV || mmkvMod?.default?.MMKV;
      if (MMKVClass && typeof MMKVClass === 'function') {
        if (!customMMKVInstances.has('default')) {
          try {
            const defaultInst = new MMKVClass();
            customMMKVInstances.set('default', defaultInst);
          } catch {}
        }
      }
    }
  } catch {}

  // 2. Global references
  try {
    const globalMMKV =
      (globalThis as any)?.mmkv ||
      (global as any)?.mmkv ||
      (globalThis as any)?.__MMKV__;
    if (globalMMKV && typeof globalMMKV.getAllKeys === 'function') {
      if (!customMMKVInstances.has('default')) {
        customMMKVInstances.set('default', globalMMKV);
      }
    }
  } catch {}

  if (customMMKVInstances.has(id)) {
    return customMMKVInstances.get(id);
  }
  if (customMMKVInstances.size > 0) {
    return customMMKVInstances.values().next().value;
  }
  return null;
};

export const isAsyncStorageConnected = (): boolean => {
  return Boolean(getResolvedAsyncStorage());
};

export const isMMKVConnected = (): boolean => {
  return Boolean(getResolvedMMKV());
};

export const getRegisteredMMKVInstanceIds = (): string[] => {
  getResolvedMMKV(); // trigger auto-discovery
  return Array.from(customMMKVInstances.keys());
};

/**
 * Calculate approximate byte size of a UTF-8 string
 */
export const calculateByteSize = (str: string): number => {
  if (!str) return 0;
  return str.length * 2;
};

/**
 * Determine type and format value safely without blocking JS thread
 */
export const analyzeStorageValue = (
  rawVal: any,
): {
  strVal: string;
  parsedValue?: any;
  type: 'json' | 'string' | 'number' | 'boolean' | 'null';
  byteSize: number;
} => {
  if (rawVal === null || rawVal === undefined) {
    return {strVal: 'null', type: 'null', byteSize: 4};
  }

  const strVal = typeof rawVal === 'string' ? rawVal : String(rawVal);
  const byteSize = strVal.length * 2;

  if (typeof rawVal === 'number') {
    return {strVal, parsedValue: rawVal, type: 'number', byteSize};
  }

  if (typeof rawVal === 'boolean') {
    return {strVal, parsedValue: rawVal, type: 'boolean', byteSize};
  }

  const trimmed = strVal.trim();
  if (
    (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
    (trimmed.startsWith('[') && trimmed.endsWith(']'))
  ) {
    // For small/medium JSON, parse eagerly; for huge payloads (>10KB), parse lazily on expand
    if (trimmed.length < 10000) {
      try {
        const parsed = JSON.parse(trimmed);
        return {strVal, parsedValue: parsed, type: 'json', byteSize};
      } catch {}
    }
    return {strVal, type: 'json', byteSize};
  }

  if (trimmed === 'true' || trimmed === 'false') {
    return {strVal, parsedValue: trimmed === 'true', type: 'boolean', byteSize};
  }

  if (!isNaN(Number(trimmed)) && trimmed !== '') {
    return {strVal, parsedValue: Number(trimmed), type: 'number', byteSize};
  }

  return {strVal, type: 'string', byteSize};
};

/**
 * Fetch all storage entries for given driver
 */
export const fetchStorageEntries = async (
  driver: StorageDriver,
  instanceId?: string,
): Promise<StorageEntry[]> => {
  const entries: StorageEntry[] = [];

  if (driver === 'asyncStorage') {
    const storage = getResolvedAsyncStorage();
    if (!storage || typeof storage.getAllKeys !== 'function') {
      return [];
    }

    try {
      const keys: string[] = await storage.getAllKeys();
      if (!keys || keys.length === 0) return [];

      if (typeof storage.multiGet === 'function') {
        const pairs: [string, string | null][] = await storage.multiGet(keys);
        for (const [k, v] of pairs) {
          const analysis = analyzeStorageValue(v);
          entries.push({
            key: k,
            value: analysis.strVal,
            parsedValue: analysis.parsedValue,
            type: analysis.type,
            byteSize: analysis.byteSize,
          });
        }
      } else {
        for (const k of keys) {
          const v = await storage.getItem(k);
          const analysis = analyzeStorageValue(v);
          entries.push({
            key: k,
            value: analysis.strVal,
            parsedValue: analysis.parsedValue,
            type: analysis.type,
            byteSize: analysis.byteSize,
          });
        }
      }
    } catch (err) {
      console.warn('[StorageInspector] Error reading AsyncStorage keys:', err);
    }
  } else if (driver === 'mmkv') {
    const mmkv = getResolvedMMKV(instanceId);
    if (!mmkv || typeof mmkv.getAllKeys !== 'function') {
      return [];
    }

    try {
      const keys: string[] = mmkv.getAllKeys();
      for (const k of keys) {
        let rawVal: any = null;
        if (typeof mmkv.getString === 'function') {
          rawVal = mmkv.getString(k);
        }
        if (rawVal === undefined || rawVal === null) {
          if (typeof mmkv.getNumber === 'function') {
            const num = mmkv.getNumber(k);
            if (num !== undefined && !isNaN(num)) rawVal = num;
          }
        }
        if (rawVal === undefined || rawVal === null) {
          if (typeof mmkv.getBoolean === 'function') {
            const bool = mmkv.getBoolean(k);
            if (bool !== undefined) rawVal = bool;
          }
        }

        const analysis = analyzeStorageValue(rawVal);
        entries.push({
          key: k,
          value: analysis.strVal,
          parsedValue: analysis.parsedValue,
          type: analysis.type,
          byteSize: analysis.byteSize,
        });
      }
    } catch (err) {
      console.warn('[StorageInspector] Error reading MMKV keys:', err);
    }
  }

  // Sort alphabetically by key
  entries.sort((a, b) => a.key.localeCompare(b.key));
  return entries;
};

/**
 * Create or Update a key-value entry (CRUD: Create / Update)
 */
export const setStorageEntry = async (
  driver: StorageDriver,
  key: string,
  value: string,
  instanceId?: string,
): Promise<boolean> => {
  if (!key.trim()) return false;

  try {
    if (driver === 'asyncStorage') {
      const storage = getResolvedAsyncStorage();
      if (!storage || typeof storage.setItem !== 'function') return false;
      await storage.setItem(key.trim(), value);
      notifyChange();
      return true;
    } else if (driver === 'mmkv') {
      const mmkv = getResolvedMMKV(instanceId);
      if (!mmkv || typeof mmkv.set !== 'function') return false;
      mmkv.set(key.trim(), value);
      notifyChange();
      return true;
    }
  } catch (err) {
    console.warn('[StorageInspector] Error setting storage item:', err);
  }
  return false;
};

/**
 * Delete a single key (CRUD: Delete)
 */
export const removeStorageEntry = async (
  driver: StorageDriver,
  key: string,
  instanceId?: string,
): Promise<boolean> => {
  try {
    if (driver === 'asyncStorage') {
      const storage = getResolvedAsyncStorage();
      if (!storage || typeof storage.removeItem !== 'function') return false;
      await storage.removeItem(key);
      notifyChange();
      return true;
    } else if (driver === 'mmkv') {
      const mmkv = getResolvedMMKV(instanceId);
      if (!mmkv || typeof mmkv.delete !== 'function') return false;
      mmkv.delete(key);
      notifyChange();
      return true;
    }
  } catch (err) {
    console.warn('[StorageInspector] Error removing storage item:', err);
  }
  return false;
};

/**
 * Wipe all keys for given storage (CRUD: Clear All)
 */
export const clearStorageDriver = async (
  driver: StorageDriver,
  instanceId?: string,
): Promise<boolean> => {
  try {
    if (driver === 'asyncStorage') {
      const storage = getResolvedAsyncStorage();
      if (!storage || typeof storage.clear !== 'function') return false;
      await storage.clear();
      notifyChange();
      return true;
    } else if (driver === 'mmkv') {
      const mmkv = getResolvedMMKV(instanceId);
      if (!mmkv || typeof mmkv.clearAll !== 'function') return false;
      mmkv.clearAll();
      notifyChange();
      return true;
    }
  } catch (err) {
    console.warn('[StorageInspector] Error clearing storage:', err);
  }
  return false;
};

/**
 * Subscribe to storage mutations
 */
export const subscribeToStorageChanges = (listener: () => void): (() => void) => {
  changeListeners.add(listener);
  return () => {
    changeListeners.delete(listener);
  };
};
