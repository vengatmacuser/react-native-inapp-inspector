// ─── Analytics Logger ─────────────────────────────────────────────────────────
//
// Captures @react-native-firebase/analytics events by monkey-patching the
// analytics instance returned by `analytics()`.
//
// Setup (call once at app startup, before any analytics calls):
//
//   import analytics from '@react-native-firebase/analytics';
//   import { setupAnalyticsLogger } from './network/analyticsLogger';
//
//   setupAnalyticsLogger(analytics());
//
// That's it — every subsequent logEvent / logScreenView / setUserProperty call
// will be intercepted and shown in the Analytics tab of NetworkInspector.
//
// Patched methods:
//   logEvent(name, params)
//   logScreenView({ screen_name, screen_class })
//   setUserProperty(name, value)
//   setUserProperties(properties)
//   setUserId(id)
// ─────────────────────────────────────────────────────────────────────────────

import {AnalyticsEvent} from '../types';

// ─── Internal state ───────────────────────────────────────────────────────────

let events: AnalyticsEvent[] = [];
let listeners: ((events: AnalyticsEvent[]) => void)[] = [];
let counter = 0;
let isAnalyticsModuleEnabled = false;

export const setAnalyticsModuleEnabled = (enabled: boolean) => {
  isAnalyticsModuleEnabled = enabled;
};

export const getAnalyticsModuleEnabled = () => isAnalyticsModuleEnabled;

// Running snapshot of user properties set so far — attached to every event
let currentUserProperties: Record<string, any> = {};
let currentUserId: string | undefined;
let currentDefaultEventParameters: Record<string, any> = {};
let isCollectionEnabled = true;

// ─── Core helpers ─────────────────────────────────────────────────────────────

const notify = () => {
  const snapshot = [...events];
  listeners.forEach(cb => cb(snapshot));
};

const addEvent = (event: AnalyticsEvent) => {
  if (!isAnalyticsModuleEnabled) return;
  events.unshift(event);
  events = events.slice(0, 200);
  notify();
};

// ─── Public subscribe / query API ────────────────────────────────────────────

export const subscribeAnalyticsEvents = (
  callback: (events: AnalyticsEvent[]) => void,
) => {
  listeners.push(callback);
  callback([...events]);
  return () => {
    listeners = listeners.filter(l => l !== callback);
  };
};

export const clearAnalyticsEvents = () => {
  events = [];
  notify();
};

export const getAnalyticsEvents = () => [...events];

export const getCurrentUserProperties = () => ({...currentUserProperties});
export const getCurrentUserId = () => currentUserId;
export const getDefaultEventParameters = () => ({...currentDefaultEventParameters});
export const getCollectionEnabled = () => isCollectionEnabled;

// ─── Manual logging (escape hatch, rarely needed) ────────────────────────────

/**
 * Directly push an event into the inspector without going through Firebase.
 * Useful for custom analytics wrappers or testing.
 */
export const logAnalyticsEvent = (
  name: string,
  params: Record<string, any> = {},
  userProperties: Record<string, any> = {},
) => {
  addEvent({
    id: counter++,
    name,
    params,
    userProperties: {...currentUserProperties, ...userProperties},
    timestamp: Date.now(),
    source: 'manual',
    userId: currentUserId ?? '',
    screenName: '',
    screenClass: '',
  });
};

// ─── Firebase Analytics instance patcher ─────────────────────────────────────

/**
 * Monkey-patches a @react-native-firebase/analytics instance so all calls
 * are intercepted and forwarded to the NetworkInspector analytics tab.
 *
 * Pass the result of `analytics()` (the default app instance or any named one).
 * Safe to call multiple times with the same instance — won't double-patch.
 *
 * @example
 *   import analytics from '@react-native-firebase/analytics';
 *   setupAnalyticsLogger(analytics());
 */
let isAnalyticsPatched = false;

/**
 * Returns true if analytics logging is active (always ready for custom and Firebase events).
 */
export const isAnalyticsConnected = () => true;

export const isFirebaseAnalyticsPatched = () => isAnalyticsPatched;

export const setupAnalyticsLogger = (analyticsInstance: any): void => {
  if (!analyticsInstance) {
    console.warn(
      '[AnalyticsLogger] No analytics instance provided — skipping setup.',
    );
    return;
  }

  isAnalyticsPatched = true;

  // Guard against double-patching the same instance
  if (analyticsInstance.__INSPECTOR_PATCHED__) return;
  analyticsInstance.__INSPECTOR_PATCHED__ = true;

  // ── logEvent ──────────────────────────────────────────────────────────────
  const originalLogEvent = analyticsInstance.logEvent.bind(analyticsInstance);
  analyticsInstance.logEvent = async (
    name: string,
    params?: Record<string, any>,
  ) => {
    try {
      addEvent({
        id: counter++,
        name,
        params: params ?? {},
        userProperties: {...currentUserProperties},
        timestamp: Date.now(),
        source: 'firebase',
        userId: currentUserId ?? '',
        screenName: '',
        screenClass: '',
      });
    } catch {}
    return originalLogEvent(name, params);
  };

  // ── logScreenView ─────────────────────────────────────────────────────────
  const originalLogScreenView =
    analyticsInstance.logScreenView.bind(analyticsInstance);
  analyticsInstance.logScreenView = async (params?: {
    screen_name?: string;
    screen_class?: string;
    [key: string]: any;
  }) => {
    try {
      addEvent({
        id: counter++,
        name: 'screen_view',
        params: params ?? {},
        userProperties: {...currentUserProperties},
        timestamp: Date.now(),
        source: 'firebase',
        screenName: params?.screen_name ?? '',
        screenClass: params?.screen_class ?? '',
        userId: currentUserId ?? '',
      });
    } catch {}
    return originalLogScreenView(params);
  };

  // ── setUserProperty ───────────────────────────────────────────────────────
  const originalSetUserProperty =
    analyticsInstance.setUserProperty.bind(analyticsInstance);
  analyticsInstance.setUserProperty = async (
    name: string,
    value: string | null,
  ) => {
    try {
      if (value === null) {
        delete currentUserProperties[name];
      } else {
        currentUserProperties[name] = value;
      }
    } catch {}
    return originalSetUserProperty(name, value);
  };

  // ── setUserProperties ─────────────────────────────────────────────────────
  const originalSetUserProperties =
    analyticsInstance.setUserProperties.bind(analyticsInstance);
  analyticsInstance.setUserProperties = async (
    properties: Record<string, string | null>,
  ) => {
    try {
      if (properties && typeof properties === 'object') {
        Object.entries(properties).forEach(([k, v]) => {
          if (v === null) delete currentUserProperties[k];
          else currentUserProperties[k] = v;
        });
      }
    } catch {}
    return originalSetUserProperties(properties);
  };

  // ── setUserId ─────────────────────────────────────────────────────────────
  const originalSetUserId = analyticsInstance.setUserId.bind(analyticsInstance);
  analyticsInstance.setUserId = async (id: string | null) => {
    try {
      currentUserId = id ?? undefined;
      notify();
    } catch {}
    return originalSetUserId(id);
  };

  // ── setDefaultEventParameters ──────────────────────────────────────────────
  if (typeof analyticsInstance.setDefaultEventParameters === 'function') {
    const originalSetDefaultEventParameters =
      analyticsInstance.setDefaultEventParameters.bind(analyticsInstance);
    analyticsInstance.setDefaultEventParameters = async (
      params: Record<string, any> | null,
    ) => {
      try {
        currentDefaultEventParameters = params ?? {};
        notify();
      } catch {}
      return originalSetDefaultEventParameters(params);
    };
  }

  // ── setAnalyticsCollectionEnabled ───────────────────────────────────────────
  if (typeof analyticsInstance.setAnalyticsCollectionEnabled === 'function') {
    const originalSetAnalyticsCollectionEnabled =
      analyticsInstance.setAnalyticsCollectionEnabled.bind(analyticsInstance);
    analyticsInstance.setAnalyticsCollectionEnabled = async (enabled: boolean) => {
      try {
        isCollectionEnabled = enabled;
        notify();
      } catch {}
      return originalSetAnalyticsCollectionEnabled(enabled);
    };
  }

  // ── resetAnalyticsData ──────────────────────────────────────────────────────
  if (typeof analyticsInstance.resetAnalyticsData === 'function') {
    const originalResetAnalyticsData =
      analyticsInstance.resetAnalyticsData.bind(analyticsInstance);
    analyticsInstance.resetAnalyticsData = async () => {
      try {
        clearAnalyticsEvents();
        currentUserProperties = {};
        currentUserId = undefined;
        currentDefaultEventParameters = {};
        notify();
      } catch {}
      return originalResetAnalyticsData();
    };
  }
};

export const autoSetupAnalyticsLogger = (): boolean => {
  if ((globalThis as any).__INSPECTOR_ANALYTICS_AUTOSETUP__) return true;

  let mod: any;
  try {
    mod = require('@react-native-firebase/analytics'); // optional dep
  } catch {
    return false; // GA not installed — silent no-op
  }

  const accessor = mod?.default ?? mod;
  if (typeof accessor !== 'function') return false;

  try {
    setupAnalyticsLogger(accessor());
  } catch {} // patch default-app instance

  if (!accessor.__INSPECTOR_WRAPPED__) {
    // patch future/named instances
    const wrapped: any = function (this: any, ...args: any[]) {
      const instance = accessor.apply(this, args);
      try {
        setupAnalyticsLogger(instance);
      } catch {}
      return instance;
    };
    Object.setPrototypeOf(wrapped, accessor);
    Object.assign(wrapped, accessor);
    wrapped.__INSPECTOR_WRAPPED__ = true;
    try {
      if (mod.default !== undefined) mod.default = wrapped;
    } catch {}
  }

  (globalThis as any).__INSPECTOR_ANALYTICS_AUTOSETUP__ = true;
  return true;
};
