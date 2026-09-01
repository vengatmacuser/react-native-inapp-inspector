import React, {useEffect, useMemo, useRef, useState, useCallback} from 'react';
import {
  Alert,
  Animated,
  PanResponder,
  Platform,
  UIManager,
  LogBox,
  InteractionManager,
} from 'react-native';
import {NavigationContext} from '@react-navigation/native';

// i18n
import {I18nextProvider, i18n} from './i18n';

// Components
import ErrorBoundary from './components/ErrorBoundary';
import MainScreen from './components/Inspector/MainScreen';
import {
  InspectorContext,
  animateNextLayout,
  InspectorContextValue,
} from './components/Inspector/InspectorContext';

// Helpers
import {
  formatDisplayUrl,
  getNavigationInfo,
  getLogPageName,
  deduplicateLogs,
  getDomainColor,
  getEventCategory,
  matchNetworkLogQuery,
  setupMemoryWarningHandler,
  pruneAllLogs,
  subscribeMemoryWarning,
} from './helpers';
// #5 — settings persistence
import {
  loadSettings,
  saveSettings,
  setCustomStorage,
  clearPersistedSettings,
  calculateRamBasedLimits,
} from './helpers/settingsStore';
import {
  getNativeSystemMetrics,
  pushNativeLogRecord,
  fetchNativeCachedPage,
} from './native/NativeInspector';

// Network
import {
  setupNetworkLogger,
  clearNetworkLogs,
  subscribeNetworkLogs,
  setNetworkModuleEnabled,
  setMaxNetworkLogsLimit,
  setRouteInfoProvider,
} from './customHooks/networkLogger';

// Console
import {
  setupConsoleLogger,
  clearConsoleLogs,
  subscribeConsoleLogs,
  getConsoleLogs,
  setConsoleModuleEnabled,
  setMaxConsoleLogsLimit,
} from './customHooks/consoleLogger';
import {IGNORED_LOG_PREFIXES} from './customHooks/logFilters';

// Crash Protection
import {
  setupGlobalCrashHandler,
  subscribeCrashEvents,
  emitCrashEvent,
  getCrashRecords,
  clearCrashRecords,
  simulateTestCrash,
  exportCrashReport,
  parseCrashStackTrace,
  setMaxCrashLogsLimit,
  setCrashModuleEnabled,
} from './customHooks/crashHandler';

import {
  trackActiveTelemetryHeartbeat,
  setTelemetryEnabled,
} from './helpers/telemetry';

import {
  subscribeAnalyticsEvents,
  clearAnalyticsEvents,
  autoSetupAnalyticsLogger,
  isAnalyticsConnected,
  setAnalyticsModuleEnabled,
  setMaxAnalyticsLogsLimit,
} from './customHooks/analyticsLogger';

import {
  getReduxState,
  subscribeReduxState,
  setReduxAutoRefresh,
  getLastActionForReducer,
  clearActionHistory,
  isReduxConnected,
  setReduxModuleEnabled,
} from './customHooks/reduxLogger';

import {setPerformanceModuleEnabled} from './customHooks/performanceTracker';
import {setBundleModuleEnabled} from './customHooks/bundleAnalyzer';
import {
  showNativeFloatingButton,
  hideNativeFloatingButton,
  setNativeFloatingButtonBadge,
  subscribeNativeFloatingButtonPress,
  subscribeNativeDeviceShake,
  startNativeFpsMonitoring,
  stopNativeFpsMonitoring,
  getNativeFpsMetrics,
  getNativeStorageItem,
  setNativeStorageItem,
  isNativeModuleAvailable,
} from './native/NativeInspector';

// Constants
import {
  StatusFilter,
  NetworkLog,
  RouteInfo,
  LocalFilter,
  SortOrder,
  GroupedListItem,
  ActiveTab,
  SettingsSubTab,
  ConsoleLog,
  Method,
  AnalyticsEvent,
  AnalyticsFilters,
  NetworkInspectorProps,
  CrashRecord,
  ParsedStackFrame,
  CrashBreadcrumb,
  SearchScope,
} from './types';
import {LIB_VERSION} from './constants';

// Stylesheet
import {toggleGlobalTheme} from './styles';

const NetworkInspector = ({
  enabled = true,
  storage,
  navigationRef,
  appIcon,
  environment,
  initialVisible = false,
  visible: controlledVisible,
}: NetworkInspectorProps): React.JSX.Element | null => {
  // Set custom storage synchronously during render phase
  setCustomStorage(storage || null);

  const [isDark, setIsDark] = useState(false);
  const [reduxState, setReduxState] = useState<any>(null);
  // Per-reducer last action is kept in component state so the
  // Redux tab re-renders live on every dispatch, independent of the state tree ref.
  const [reduxLastActionMap, setReduxLastActionMap] = useState<
    Record<string, any>
  >({});
  // Inspector panel height as a percentage of the screen (configurable in Settings).
  const [modalHeightPercent, setModalHeightPercent] = useState<number>(90);
  const [modalAnimationType, setModalAnimationType] = useState<'slide' | 'fade' | 'none'>('slide');

  const [logs, setLogs] = useState<NetworkLog[]>([]);
  const [visible, setVisible] = useState<boolean>(
    controlledVisible ?? initialVisible ?? false,
  );

  useEffect(() => {
    if (controlledVisible !== undefined) {
      setVisible(controlledVisible);
    }
  }, [controlledVisible]);

  const [isReady, setIsReady] = useState(false);
  const [selected, setSelected] = useState<NetworkLog | null>(null);
  const [selectedLogs, setSelectedLogs] = useState<Set<number>>(new Set());
  const [search, setSearch] = useState('');
  const [searchScope, setSearchScope] = useState<SearchScope>('all');
  const [isRegexSearch, setIsRegexSearch] = useState<boolean>(false);
  const [isCaseSensitive, setIsCaseSensitive] = useState<boolean>(false);
  const [quickFilter, setQuickFilter] = useState<string>('all');
  const [detailSearch, setDetailSearch] = useState('');
  const [reduxSearch, setReduxSearch] = useState('');
  const [selectedReduxSlice, setSelectedReduxSlice] = useState<string | null>(null);
  const [selectedReduxAction, setSelectedReduxAction] = useState<any | null>(null);
  const [reduxActiveSubTab, setReduxActiveSubTab] = useState<'state' | 'timeline'>('state');

  const [apiDetailActiveTab, setApiDetailActiveTab] = useState<
    'metadata' | 'headers' | 'request' | 'response'
  >('response');

  useEffect(() => {
    LogBox.ignoreAllLogs(enabled);
    return () => {
      LogBox.ignoreAllLogs(false);
    };
  }, [enabled]);

  useEffect(() => {
    if (selected) {
      setApiDetailActiveTab('response');
      setDetailSearch('');
    }
  }, [selected]);
  const [statusFilters, setStatusFilters] = useState<Set<StatusFilter>>(
    new Set(),
  );
  const [methodFilters, setMethodFilters] = useState<Set<Method>>(new Set());
  const [sectionFilters, setSectionFilters] = useState<
    Record<string, Set<LocalFilter>>
  >({});
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(
    new Set(),
  );
  const [showHeaderInfo, setShowHeaderInfo] = useState(true);
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');
  // #7 — sort order for the Logs (console) tab
  const [logSortOrder, setLogSortOrder] = useState<SortOrder>('newest');
  const [reqExpanded, setReqExpanded] = useState<boolean | undefined>(true);
  const [resExpanded, setResExpanded] = useState<boolean | undefined>(true);
  const [showReqDiff, setShowReqDiff] = useState<boolean>(false);
  const [showResDiff, setShowResDiff] = useState<boolean>(false);

  // ─── Analytics state ───────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<ActiveTab>('apis');
  const [analyticsEvents, setAnalyticsEvents] = useState<AnalyticsEvent[]>([]);

  // ─── Logs state ────────────────────────────────────────────────────────────
  const [consoleLogs, setConsoleLogs] = useState<ConsoleLog[]>([]);
  const [selectedLog, setSelectedLog] = useState<ConsoleLog | null>(null);
  // ─── Pause states ─────────────────────────────────────────────────────────
  const [isNetworkPaused, setIsNetworkPaused] = useState<boolean>(false);
  const isNetworkPausedRef = useRef(isNetworkPaused);
  isNetworkPausedRef.current = isNetworkPaused;
  const latestNetworkLogsRef = useRef<NetworkLog[]>([]);

  const [isConsolePaused, setIsConsolePaused] = useState<boolean>(false);
  const isConsolePausedRef = useRef(isConsolePaused);
  isConsolePausedRef.current = isConsolePaused;
  const latestConsoleLogsRef = useRef<ConsoleLog[]>([]);

  const [isAnalyticsPaused, setIsAnalyticsPaused] = useState<boolean>(false);
  const isAnalyticsPausedRef = useRef(isAnalyticsPaused);
  isAnalyticsPausedRef.current = isAnalyticsPaused;
  const latestAnalyticsEventsRef = useRef<AnalyticsEvent[]>([]);

  const [lastReadLogsCount, setLastReadLogsCount] = useState(0);
  const [lastReadApisCount, setLastReadApisCount] = useState(0);
  const [lastReadCrashesCount, setLastReadCrashesCount] = useState(0);

  // ─── Crash state ───────────────────────────────────────────────────────────
  const [crashRecords, setCrashRecords] = useState<CrashRecord[]>(() =>
    getCrashRecords(),
  );
  const [selectedCrash, setSelectedCrash] = useState<CrashRecord | null>(null);
  const [maxCrashLogs, setMaxCrashLogs] = useState<number>(50);

  useEffect(() => {
    setMaxCrashLogsLimit(maxCrashLogs);
  }, [maxCrashLogs]);

  useEffect(() => {
    if (visible) {
      if (activeTab === 'apis') {
        setLastReadApisCount(logs.length);
      }
      if (activeTab === 'logs') {
        setLastReadLogsCount(consoleLogs.length);
      }
      if (activeTab === 'crash') {
        setLastReadCrashesCount(crashRecords.length);
      }
    }
  }, [visible]);

  useEffect(() => {
    if (activeTab === 'apis') {
      setLastReadApisCount(logs.length);
    }
  }, [activeTab, logs.length]);

  useEffect(() => {
    if (activeTab === 'logs') {
      setLastReadLogsCount(consoleLogs.length);
    }
  }, [activeTab, consoleLogs.length]);

  useEffect(() => {
    if (activeTab === 'crash') {
      setLastReadCrashesCount(crashRecords.length);
    }
  }, [activeTab, crashRecords.length]);

  const [maxConsoleLogs, setMaxConsoleLogs] = useState<number>(100);
  const [showConsoleLevels, setShowConsoleLevels] = useState<{
    info: boolean;
    warn: boolean;
    error: boolean;
  }>({
    info: true,
    warn: false,
    error: true,
  });
  const visibleConsoleLogs = useMemo(() => {
    const filtered = consoleLogs.filter(log => {
      const type = log.type;
      if (type === 'info' && !showConsoleLevels?.info) return false;
      if (type === 'warn' && !showConsoleLevels?.warn) return false;
      if (type === 'error' && !showConsoleLevels?.error) return false;

      const message = log.message || '';
      const allPrefixes = [
        ...((IGNORED_LOG_PREFIXES && IGNORED_LOG_PREFIXES.info) || []),
        ...((IGNORED_LOG_PREFIXES && IGNORED_LOG_PREFIXES.warn) || []),
        ...((IGNORED_LOG_PREFIXES && IGNORED_LOG_PREFIXES.error) || []),
      ].filter(p => typeof p === 'string' && p.trim().length > 0);
      const isIgnored = allPrefixes.some(
        prefix =>
          message
            .toLowerCase()
            .trim()
            .startsWith(prefix.toLowerCase().trim()) ||
          message.toLowerCase().trim().includes(prefix.toLowerCase().trim()),
      );
      return !isIgnored;
    });
    return filtered.slice(0, maxConsoleLogs);
  }, [consoleLogs, showConsoleLevels, maxConsoleLogs]);
  const [logSearch, setLogSearch] = useState('');
  const [logFilters, setLogFilters] = useState<
    Set<'all' | 'info' | 'warn' | 'error' | 'user-log' | 'analytics'>
  >(new Set(['user-log']));

  // ─── Settings state ──────────────────────────────────────────────────────────
  const [settingsPage, setSettingsPage] = useState<
    | 'main'
    | 'apis'
    | 'logs'
    | 'analytics'
    | 'redux'
    | null
  >(null);
  const [settingsActiveSubTab, setSettingsActiveSubTab] = useState<SettingsSubTab>('module');
  const [tabVisibility, setTabVisibility] = useState<
    Record<ActiveTab, boolean>
  >({
    apis: true,
    logs: true,
    analytics: false,
    redux: false,
    bundle: false,
    performance: false,
    crash: false,
    device: false,
    storage: false,
  });

  const [maxNetworkLogs, setMaxNetworkLogs] = useState<number>(100);
  const [maxAnalyticsEventsLimit, setMaxAnalyticsEventsLimit] = useState<number>(75);
  const [isAutoRamLimitEnabled, setIsAutoRamLimitEnabled] = useState<boolean>(true);
  const [deviceFreeRamMb, setDeviceFreeRamMb] = useState<number>(1800);

  const [reduxAutoRefresh, setReduxAutoRefreshState] = useState<boolean>(true);
  const [reduxExpandDepth, setReduxExpandDepth] = useState<number>(1);

  // #6 — tab the inspector opens on. Shown with a DEFAULT badge in Settings.
  const [defaultTab, setDefaultTab] = useState<ActiveTab>('apis');
  const [showDuplicateLogs, setShowDuplicateLogs] = useState<boolean>(false);
  const [showUpdateToast, setShowUpdateToast] = useState<boolean>(true);

  // Synchronize runtime background listeners with active settings
  useEffect(() => {
    setNetworkModuleEnabled(!!tabVisibility.apis);
    setConsoleModuleEnabled(!!tabVisibility.logs);
    setAnalyticsModuleEnabled(!!tabVisibility.analytics);
    setReduxModuleEnabled(!!tabVisibility.redux);
    setPerformanceModuleEnabled(!!tabVisibility.performance);
    setCrashModuleEnabled(!!tabVisibility.crash);
    setBundleModuleEnabled(!!tabVisibility.bundle);
  }, [tabVisibility]);

  // Query native hardware RAM and auto-tune limits if auto-RAM is active
  useEffect(() => {
    getNativeSystemMetrics()
      .then(metrics => {
        if (metrics) {
          const freeRam = metrics.totalPhysicalRamMb - metrics.residentRamMb;
          const freeMb = Math.max(200, Math.round(freeRam > 0 ? freeRam : 1500));
          setDeviceFreeRamMb(freeMb);
          if (isAutoRamLimitEnabled) {
            const profile = calculateRamBasedLimits(freeMb);
            setMaxNetworkLogs(profile.maxNetworkLogs);
            setMaxConsoleLogs(profile.maxConsoleLogs);
            setMaxAnalyticsEventsLimit(profile.maxAnalyticsEvents);
            setMaxCrashLogs(profile.maxCrashRecords);
          }
        }
      })
      .catch(() => {});
  }, [isAutoRamLimitEnabled]);

  const resetToDefaults = async () => {
    await clearPersistedSettings();
    setIsDark(false);
    toggleGlobalTheme(false);
    setModalHeightPercent(90);
    setModalAnimationType('slide');
    setTabVisibility({
      apis: true,
      logs: true,
      analytics: false,
      redux: false,
      bundle: false,
      performance: false,
      crash: false,
      device: false,
      storage: false,
    });
    setDefaultTab('apis');
    setIsAutoRamLimitEnabled(true);
    const profile = calculateRamBasedLimits(deviceFreeRamMb);
    setMaxCrashLogs(profile.maxCrashRecords);
    setMaxNetworkLogs(profile.maxNetworkLogs);
    setMaxConsoleLogs(profile.maxConsoleLogs);
    setMaxAnalyticsEventsLimit(profile.maxAnalyticsEvents);
    setShowConsoleLevels({
      info: true,
      warn: true,
      error: true,
    });
    setReduxAutoRefreshState(true);
    setReduxExpandDepth(1);
    setShowDuplicateLogs(false);
    setShowUpdateToast(true);
    Alert.alert('Settings Reset', 'All settings have been reset to default values.');
  };

  // #5 — hydrate persisted settings once, then auto-save on any change.
  const settingsHydratedRef = useRef(false);
  useEffect(() => {
    let cancelled = false;
    loadSettings().then(saved => {
      if (cancelled) return;
      if (saved.isDark != null) {
        setIsDark(saved.isDark);
        toggleGlobalTheme(saved.isDark);
      }
      if (saved.modalHeightPercent != null)
        setModalHeightPercent(saved.modalHeightPercent);
      if (saved.modalAnimationType)
        setModalAnimationType(saved.modalAnimationType as 'slide' | 'fade' | 'none');
      if (saved.tabVisibility)
        setTabVisibility(prev => ({
          ...prev,
          ...(saved.tabVisibility as Record<ActiveTab, boolean>),
          apis: true, // APIs is always required
        }));
      if (saved.defaultTab) setDefaultTab(saved.defaultTab as ActiveTab);
      if (saved.isAutoRamLimitEnabled != null)
        setIsAutoRamLimitEnabled(saved.isAutoRamLimitEnabled);
      if (saved.maxNetworkLogs != null) setMaxNetworkLogs(saved.maxNetworkLogs);
      if (saved.maxConsoleLogs != null) setMaxConsoleLogs(saved.maxConsoleLogs);
      if (saved.maxAnalyticsEventsLimit != null)
        setMaxAnalyticsEventsLimit(saved.maxAnalyticsEventsLimit);
      if (saved.maxCrashLogs != null) setMaxCrashLogs(saved.maxCrashLogs);
      if (saved.showConsoleLevels)
        setShowConsoleLevels(saved.showConsoleLevels);
      if (saved.reduxAutoRefresh != null)
        setReduxAutoRefreshState(saved.reduxAutoRefresh);
      if (saved.reduxExpandDepth != null)
        setReduxExpandDepth(saved.reduxExpandDepth);
      if (saved.showDuplicateLogs != null)
        setShowDuplicateLogs(saved.showDuplicateLogs);
      if (saved.showUpdateToast != null)
        setShowUpdateToast(saved.showUpdateToast);
      if (saved.defaultTab) {
        const dt = saved.defaultTab as ActiveTab;
        const vis = {
          ...{
            apis: true,
            logs: true,
            analytics: false,
            redux: false,
            bundle: false,
            performance: false,
            crash: false,
            device: false,
            storage: false,
          },
          ...(saved.tabVisibility || {}),
          apis: true,
        } as Record<ActiveTab, boolean>;
        setActiveTab(vis[dt] ? dt : 'apis');
      }
      settingsHydratedRef.current = true;
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!settingsHydratedRef.current) return;
    saveSettings({
      isDark,
      modalHeightPercent,
      modalAnimationType,
      tabVisibility,
      defaultTab,
      maxNetworkLogs,
      maxConsoleLogs,
      maxAnalyticsEventsLimit,
      maxCrashLogs,
      isAutoRamLimitEnabled,
      showConsoleLevels,
      reduxAutoRefresh,
      reduxExpandDepth,
      showDuplicateLogs,
      showUpdateToast,
    });
  }, [
    isDark,
    modalHeightPercent,
    modalAnimationType,
    tabVisibility,
    defaultTab,
    maxNetworkLogs,
    maxConsoleLogs,
    maxAnalyticsEventsLimit,
    maxCrashLogs,
    isAutoRamLimitEnabled,
    showConsoleLevels,
    reduxAutoRefresh,
    reduxExpandDepth,
    showDuplicateLogs,
  ]);

  // #1 — check NPM for a newer published version; surfaces an animated dot
  // in the header next to the npm chip when an update is available.
  const [latestNpmVersion, setLatestNpmVersion] = useState<string | null>(null);
  const updateAvailable = useMemo(() => {
    if (!latestNpmVersion) return false;
    const parse = (v: string) =>
      v
        .replace(/^v/, '')
        .split('.')
        .map(n => parseInt(n, 10) || 0);
    const cur = parse(LIB_VERSION);
    const latest = parse(latestNpmVersion);
    for (let i = 0; i < 3; i++) {
      if ((latest[i] || 0) > (cur[i] || 0)) return true;
      if ((latest[i] || 0) < (cur[i] || 0)) return false;
    }
    return false;
  }, [latestNpmVersion]);

  useEffect(() => {
    let cancelled = false;
    fetch('https://registry.npmjs.org/react-native-inapp-inspector/latest')
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (!cancelled && data && typeof data.version === 'string') {
          setLatestNpmVersion(data.version);
        }
      })
      .catch(() => {
        // Offline / blocked — silently skip the update check.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setReduxAutoRefresh(reduxAutoRefresh);
  }, [reduxAutoRefresh]);

  // Auto-unselect Redux or Analytics tab if module is not connected / available
  useEffect(() => {
    if (activeTab === 'redux' && !isReduxConnected()) {
      setActiveTab('apis');
    }
    if (activeTab === 'analytics' && !isAnalyticsConnected()) {
      setActiveTab('apis');
    }
  }, [activeTab]);

  const toggleTabVisibility = (key: ActiveTab) => {
    if (key === 'apis') return;
    if (key === 'redux' && !isReduxConnected()) return;
    if (key === 'analytics' && !isAnalyticsConnected()) return;
    setTabVisibility(prev => {
      const nextVal = !prev[key];
      const newVisibility = {...prev, [key]: nextVal};
      if (!nextVal && activeTab === key) {
        animateNextLayout();
        setActiveTab('apis');
      }
      // #6 — a hidden module can't be the default landing tab.
      if (!nextVal && defaultTab === key) {
        setDefaultTab('apis');
      }
      return newVisibility;
    });
  };

  const loadNativePage = useCallback(async (tabKey: ActiveTab, query: string = '') => {
    if (tabKey === 'apis' || tabKey === 'logs' || tabKey === 'analytics' || tabKey === 'crash') {
      const pageData = await fetchNativeCachedPage(tabKey, 0, 100, query);
      if (pageData && pageData.items && pageData.items.length > 0) {
        if (tabKey === 'apis') setLogs(pageData.items);
        else if (tabKey === 'logs') setConsoleLogs(pageData.items);
        else if (tabKey === 'analytics') setAnalyticsEvents(pageData.items);
        else if (tabKey === 'crash') setCrashRecords(pageData.items);
      }
    }
  }, []);

  const switchActiveTab = useCallback((key: ActiveTab) => {
    if (key === 'redux' && !isReduxConnected()) return;
    if (key === 'analytics' && !isAnalyticsConnected()) return;

    setSelected(null);
    setSelectedEvent(null);
    setSelectedLog(null);
    setSelectedReduxSlice(null);
    setSelectedReduxAction(null);
    setSelectedCrash(null);

    if (typeof React.startTransition === 'function') {
      React.startTransition(() => {
        setActiveTab(key);
        loadNativePage(key);
      });
    } else {
      setActiveTab(key);
      loadNativePage(key);
    }
  }, [loadNativePage]);

  const [selectedEvent, setSelectedEvent] = useState<AnalyticsEvent | null>(
    null,
  );
  const [analyticsSearch, setAnalyticsSearch] = useState('');
  const [analyticsFilters, setAnalyticsFilters] = useState<AnalyticsFilters>({
    categories: new Set(['all']),
    screens: new Set(),
    sources: new Set(['all']),
    userTypes: new Set(['all']),
    timeWindow: 'all',
    payloadComplexity: 'all',
    hasRevenue: false,
    hasItems: false,
    hasUserProps: false,
    hasParams: false,
    onlyDuplicates: false,
    onlyConversions: false,
    sortBy: 'time_desc',
  });

  const isAnalyticsFilterApplied = useMemo(() => {
    if (analyticsFilters.categories.size > 0 && !analyticsFilters.categories.has('all')) return true;
    if (analyticsFilters.screens.size > 0) return true;
    if (analyticsFilters.sources.size > 0 && !analyticsFilters.sources.has('all')) return true;
    if (analyticsFilters.userTypes.size > 0 && !analyticsFilters.userTypes.has('all')) return true;
    if (analyticsFilters.timeWindow !== 'all') return true;
    if (analyticsFilters.payloadComplexity !== 'all') return true;
    if (analyticsFilters.hasRevenue) return true;
    if (analyticsFilters.hasItems) return true;
    if (analyticsFilters.hasUserProps) return true;
    if (analyticsFilters.hasParams) return true;
    if (analyticsFilters.onlyDuplicates) return true;
    if (analyticsFilters.onlyConversions) return true;
    if (analyticsFilters.sortBy !== 'time_desc') return true;
    return false;
  }, [analyticsFilters]);

  const resetAnalyticsFilters = useCallback(() => {
    setAnalyticsFilters({
      categories: new Set(['all']),
      screens: new Set(),
      sources: new Set(['all']),
      userTypes: new Set(['all']),
      timeWindow: 'all',
      payloadComplexity: 'all',
      hasRevenue: false,
      hasItems: false,
      hasUserProps: false,
      hasParams: false,
      onlyDuplicates: false,
      onlyConversions: false,
      sortBy: 'time_desc',
    });
  }, []);

  const [isAnalyticsLayoutReady, setIsAnalyticsLayoutReady] = useState(false);
  const [analyticsHeaderExpanded, setAnalyticsHeaderExpanded] = useState(false);

  const [newEventIds, setNewEventIds] = useState<Set<number>>(new Set());
  const prevEventIdsRef = useRef<Set<number>>(new Set());

  const [navState, setNavState] = useState<any>(null);
  const navigationContext = React.useContext(NavigationContext);
  const hasNavigationContext = navigationContext !== undefined;

  const currentRouteRef = useRef<RouteInfo>({
    path: '',
    params: null,
  });

  useEffect(() => {
    setRouteInfoProvider(() => currentRouteRef.current);
    return () => {
      setRouteInfoProvider(null);
    };
  }, []);

  useEffect(() => {
    if (navState) {
      const info = getNavigationInfo(navState);
      if (info?.path) {
        currentRouteRef.current = info;
      }
    }
  }, [navState]);

  useEffect(() => {
    if (!navigationRef) return;

    const updateState = () => {
      try {
        if (typeof navigationRef.isReady === 'function' && navigationRef.isReady()) {
          const currentRoute = typeof navigationRef.getCurrentRoute === 'function'
            ? navigationRef.getCurrentRoute()
            : null;
          if (currentRoute?.name) {
            currentRouteRef.current = {
              path: currentRoute.name,
              params: currentRoute.params || null,
            };
          }
          const state = navigationRef.getRootState();
          if (state) {
            setNavState(state);
            const routeInfo = getNavigationInfo(state);
            if (routeInfo?.path) {
              currentRouteRef.current = routeInfo;
            }
          }
        }
      } catch (err) {
        // Safe check
      }
    };

    // Initialize state
    updateState();

    // Listen to changes
    const unsubscribe = typeof navigationRef.addListener === 'function'
      ? navigationRef.addListener('state', () => {
          updateState();
        })
      : null;

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [navigationRef]);

  const logRouteMapRef = useRef<Map<number, RouteInfo>>(new Map());
  const prevLogIdsRef = useRef<Set<number>>(new Set());
  const [newLogIds, setNewLogIds] = useState<Set<number>>(new Set());

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const activePulseAnim = useRef(new Animated.Value(0.4)).current;
  const unreadPulseAnim = useRef(new Animated.Value(1)).current;
  // #4 — diagonal light streak sweeping across the floating launcher
  const fabShineAnim = useRef(new Animated.Value(0)).current;
  // #11 — header "clear all" icon spin/scale animation
  const clearAnim = useRef(new Animated.Value(0)).current;

  // #4 — draggable floating launcher (drag anywhere on screen)
  const fabPan = useRef(new Animated.ValueXY({x: 0, y: 0})).current;
  const fabPanRef = useRef({x: 0, y: 0});
  useEffect(() => {
    const idX = fabPan.x.addListener(v => (fabPanRef.current.x = v.value));
    const idY = fabPan.y.addListener(v => (fabPanRef.current.y = v.value));
    return () => {
      fabPan.x.removeListener(idX);
      fabPan.y.removeListener(idY);
    };
  }, [fabPan]);
  const fabDraggedRef = useRef(false);
  const fabPanResponder = useRef(
    PanResponder.create({
      // Let taps fall through to the launcher; only hijack once the
      // finger actually moves, so onPress still fires on a tap.
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_e, g) =>
        Math.abs(g.dx) > 4 || Math.abs(g.dy) > 4,
      onPanResponderGrant: () => {
        fabDraggedRef.current = true;
        fabPan.setOffset({
          x: fabPanRef.current.x,
          y: fabPanRef.current.y,
        });
        fabPan.setValue({x: 0, y: 0});
      },
      onPanResponderMove: Animated.event([null, {dx: fabPan.x, dy: fabPan.y}], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: () => {
        fabPan.flattenOffset();
        // small delay so the trailing tap (if any) is ignored
        setTimeout(() => {
          fabDraggedRef.current = false;
        }, 50);
      },
      onPanResponderTerminate: () => {
        fabPan.flattenOffset();
        fabDraggedRef.current = false;
      },
    }),
  ).current;

  // #2 — scroll-to-top button for the main APIs list, always visible at the
  // bottom right of the list.

  const runClearAllWithAnimation = useCallback(() => {
    Animated.sequence([
      Animated.timing(clearAnim, {
        toValue: 1,
        duration: 320,
        useNativeDriver: true,
      }),
      Animated.timing(clearAnim, {
        toValue: 0,
        duration: 0,
        useNativeDriver: true,
      }),
    ]).start();
    handleClearAll();
  }, [clearAnim]);

  useEffect(() => {
    if (Platform.OS === 'android') {
      UIManager.setLayoutAnimationEnabledExperimental?.(true);
    }
  }, []);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulseAnim]);

  // #4 — sweep the shine streak across the launcher, pause, repeat.
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(fabShineAnim, {
          toValue: 1,
          duration: 1100,
          useNativeDriver: true,
        }),
        Animated.delay(1600),
        Animated.timing(fabShineAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [fabShineAnim]);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(activePulseAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(activePulseAnim, {
          toValue: 0.4,
          duration: 1200,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [activePulseAnim]);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(unreadPulseAnim, {
          toValue: 1.3,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(unreadPulseAnim, {
          toValue: 0.8,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [unreadPulseAnim]);

  const isNativeModule = useMemo(() => isNativeModuleAvailable(), []);
  const useNativeFab =
    (Platform.OS === 'ios' || Platform.OS === 'android') && isNativeModule;



  // 100% Native Main-Thread Floating Button Lifecycle
  useEffect(() => {
    if (!useNativeFab || !enabled) {
      if (useNativeFab) {
        hideNativeFloatingButton().catch(() => {});
      }
      return;
    }

    if (visible) {
      hideNativeFloatingButton().catch(() => {});
    } else {
      showNativeFloatingButton().catch(() => {});
      setNativeFloatingButtonBadge(
        logs.length > 0 || analyticsEvents.length > 0,
      ).catch(() => {});
    }

    return () => {
      if (useNativeFab) {
        hideNativeFloatingButton().catch(() => {});
      }
    };
  }, [
    useNativeFab,
    enabled,
    visible,
    logs.length,
    analyticsEvents.length,
  ]);

  // Subscribe to native UI-thread floating button tap events
  useEffect(() => {
    if (!useNativeFab) return;
    const unsubscribe = subscribeNativeFloatingButtonPress(() => {
      setVisible(true);
    });
    return () => {
      unsubscribe();
    };
  }, [useNativeFab]);

  // Subscribe to physical hardware shake events (or Cmd+Ctrl+Z on iOS simulator)
  useEffect(() => {
    if (!useNativeFab) return;
    const unsubscribe = subscribeNativeDeviceShake(() => {
      setVisible(prev => !prev);
    });
    return () => {
      unsubscribe();
    };
  }, [useNativeFab]);

  const isVisibleRefObj = useRef(visible);

  // #6 — every time the inspector is opened, land on chosen default tab & sync latest logs
  useEffect(() => {
    isVisibleRefObj.current = visible;
    if (visible) {
      const target =
        defaultTab === 'apis' || tabVisibility?.[defaultTab]
          ? defaultTab
          : 'apis';
      setActiveTab(target);



      // Instant synchronization of data collected while modal was closed
      if (latestNetworkLogsRef.current.length > 0) {
        const deduped = deduplicateLogs(latestNetworkLogsRef.current);
        const incoming = new Set(deduped.map(l => l.id));
        prevLogIdsRef.current = incoming;
        setLogs(deduped);
      }
      if (latestConsoleLogsRef.current.length > 0) {
        setConsoleLogs(latestConsoleLogsRef.current);
      }
      if (latestAnalyticsEventsRef.current.length > 0) {
        setAnalyticsEvents(latestAnalyticsEventsRef.current);
      }
      const freshState = getReduxState();
      if (freshState) {
        setReduxState(typeof freshState === 'object' ? {...freshState} : freshState);
        setReduxLastActionMap({...getLastActionForReducer()});
      }
      const freshCrashes = getCrashRecords();
      if (freshCrashes.length > 0) {
        setCrashRecords(freshCrashes);
      }

      const frame = requestAnimationFrame(() => {
        setIsReady(true);
      });
      return () => {
        cancelAnimationFrame(frame);
      };
    } else {
      setIsReady(false);
      setSelectedLogs(new Set());
    }
  }, [visible]);

  useEffect(() => {
    setupNetworkLogger();
    clearNetworkLogs();
    setupConsoleLogger();
    autoSetupAnalyticsLogger();
    setupGlobalCrashHandler();
    const cleanupMemoryWarning = setupMemoryWarningHandler();

    const isVisibleRef = isVisibleRefObj;

    const unsubscribeCrash = subscribeCrashEvents(crashInfo => {
      if (crashInfo.message === '__CLEARED__') {
        setCrashRecords([]);
        setSelectedCrash(null);
        return;
      }
      const updated = getCrashRecords();
      if (updated.length > 0) {
        pushNativeLogRecord('crash', JSON.stringify(updated[0]));
      }
      if (isVisibleRef.current) {
        setCrashRecords(updated);
      }
    });

    // Sync crashes recorded before this subscription ran (e.g. a render crash
    // during the very first commit, which fires before effects are mounted).
    const pendingCrashes = getCrashRecords();
    if (pendingCrashes.length > 0) {
      pendingCrashes.forEach(c => pushNativeLogRecord('crash', JSON.stringify(c)));
      setCrashRecords(pendingCrashes);
    }

    let timeoutId: ReturnType<typeof setTimeout>;

    let isFirstNetworkCall = true;
    const unsubscribe = subscribeNetworkLogs((raw: NetworkLog[]) => {
      latestNetworkLogsRef.current = raw;
      if (raw.length > 0) {
        pushNativeLogRecord('apis', JSON.stringify(raw[0]));
      }
      if (isNetworkPausedRef.current) return;
      if (!isVisibleRef.current) return; // ZERO-RENDER INACTIVE MODE

      clearTimeout(timeoutId);
      const updateNetworkState = () => {
        const deduped = deduplicateLogs(raw);
        const incoming = new Set(deduped.map(l => l.id));
        const freshIds = new Set<number>();
        incoming.forEach(id => {
          if (!prevLogIdsRef.current.has(id)) freshIds.add(id);
        });
        prevLogIdsRef.current = incoming;
        if (freshIds.size > 0) {
          freshIds.forEach(id => {
            if (!logRouteMapRef.current.has(id)) {
              const matchedLog = deduped.find(l => l.id === id);
              const resolvedRoute =
                (matchedLog as any)?.routeInfo || currentRouteRef.current;
              logRouteMapRef.current.set(id, resolvedRoute);
            }
          });
          setNewLogIds(freshIds);
          setTimeout(() => setNewLogIds(new Set()), 1200);
        }
        setLogs(deduped);
      };

      if (isFirstNetworkCall) {
        isFirstNetworkCall = false;
        const deduped = deduplicateLogs(raw);
        const incoming = new Set(deduped.map(l => l.id));
        prevLogIdsRef.current = incoming;
        deduped.forEach(l => {
          if (!logRouteMapRef.current.has(l.id)) {
            const resolvedRoute =
              (l as any)?.routeInfo || currentRouteRef.current;
            logRouteMapRef.current.set(l.id, resolvedRoute);
          }
        });
        setLogs(deduped);
      } else {
        timeoutId = setTimeout(updateNetworkState, 250);
      }
    });

    // ─── Analytics subscription ──────────────────────────────────────────────
    let analyticsTimeoutId: ReturnType<typeof setTimeout>;
    let isFirstAnalyticsCall = true;

    const unsubscribeAnalytics = subscribeAnalyticsEvents(
      (raw: AnalyticsEvent[]) => {
        latestAnalyticsEventsRef.current = raw;
        if (raw.length > 0) {
          pushNativeLogRecord('analytics', JSON.stringify(raw[0]));
        }
        if (isAnalyticsPausedRef.current) return;
        if (!isVisibleRef.current) return; // ZERO-RENDER INACTIVE MODE

        clearTimeout(analyticsTimeoutId);
        const updateAnalyticsState = () => {
          const incoming = new Set(raw.map(e => e.id));
          const freshIds = new Set<number>();
          incoming.forEach(id => {
            if (!prevEventIdsRef.current.has(id)) freshIds.add(id);
          });
          prevEventIdsRef.current = incoming;
          if (freshIds.size > 0) {
            freshIds.forEach(id => {
              if (!logRouteMapRef.current.has(id + 1000000)) {
                logRouteMapRef.current.set(
                  id + 1000000,
                  currentRouteRef.current,
                );
              }
            });
            setNewEventIds(freshIds);
            setTimeout(() => setNewEventIds(new Set()), 1200);
          }
          setAnalyticsEvents(raw);
        };

        if (isFirstAnalyticsCall) {
          isFirstAnalyticsCall = false;
          const incoming = new Set(raw.map(e => e.id));
          prevEventIdsRef.current = incoming;
          setAnalyticsEvents(raw);
        } else {
          analyticsTimeoutId = setTimeout(updateAnalyticsState, 200);
        }
      },
    );

    // ─── Console subscription ────────────────────────────────────────────────
    let consoleTimeoutId: ReturnType<typeof setTimeout>;
    let isFirstConsoleCall = true;

    const unsubscribeConsole = subscribeConsoleLogs((raw: ConsoleLog[]) => {
      latestConsoleLogsRef.current = raw;
      if (raw.length > 0) {
        pushNativeLogRecord('logs', JSON.stringify(raw[0]));
      }
      if (isConsolePausedRef.current) return;
      if (!isVisibleRef.current) return; // ZERO-RENDER INACTIVE MODE

      clearTimeout(consoleTimeoutId);
      if (isFirstConsoleCall) {
        isFirstConsoleCall = false;
        setConsoleLogs(raw);
      } else {
        consoleTimeoutId = setTimeout(() => {
          setConsoleLogs(raw);
        }, 200);
      }
    });

    const initialReduxState = getReduxState();
    if (initialReduxState) {
      setReduxState(typeof initialReduxState === 'object' ? {...initialReduxState} : initialReduxState);
      setReduxLastActionMap({...getLastActionForReducer()});
    }
    const unsubscribeRedux = subscribeReduxState(() => {
      if (!isVisibleRef.current) return; // ZERO-RENDER INACTIVE MODE
      const freshState = getReduxState();
      setReduxState(freshState && typeof freshState === 'object' ? {...freshState} : freshState);
      setReduxLastActionMap({...getLastActionForReducer()});
    });

    return () => {
      unsubscribe();
      clearTimeout(timeoutId);
      unsubscribeAnalytics();
      clearTimeout(analyticsTimeoutId);
      unsubscribeConsole();
      clearTimeout(consoleTimeoutId);
      unsubscribeRedux();
      unsubscribeCrash();
      cleanupMemoryWarning();
    };
  }, []);

  useEffect(() => {
    setMaxNetworkLogsLimit(maxNetworkLogs);
  }, [maxNetworkLogs]);

  useEffect(() => {
    setMaxCrashLogsLimit(maxCrashLogs);
  }, [maxCrashLogs]);

  useEffect(() => {
    if (!isNetworkPaused && latestNetworkLogsRef.current.length > 0) {
      const deduped = deduplicateLogs(latestNetworkLogsRef.current);
      setLogs(deduped);
    }
  }, [isNetworkPaused]);

  useEffect(() => {
    if (!isAnalyticsPaused && latestAnalyticsEventsRef.current.length > 0) {
      setAnalyticsEvents(latestAnalyticsEventsRef.current);
    }
  }, [isAnalyticsPaused]);

  useEffect(() => {
    if (!isConsolePaused && latestConsoleLogsRef.current.length > 0) {
      setConsoleLogs(latestConsoleLogsRef.current);
    }
  }, [isConsolePaused]);

  useEffect(() => {
    setReqExpanded(true);
    setResExpanded(true);
    setShowReqDiff(false);
    setShowResDiff(false);
    setDetailSearch('');
  }, [selected]);

  const filteredLogs = useMemo(() => {
    let result = logs.filter(log => {
      // 1. Quick Filter Check (All, Errors, Success, Slow, GET, POST, GraphQL)
      if (quickFilter && quickFilter !== 'all') {
        if (quickFilter === 'errors') {
          const isErr =
            log.status === 0 ||
            log.status == null ||
            (typeof log.status === 'number' && log.status >= 400);
          if (!isErr) return false;
        } else if (quickFilter === 'success') {
          const isSuccess =
            typeof log.status === 'number' &&
            log.status >= 200 &&
            log.status < 400;
          if (!isSuccess) return false;
        } else if (quickFilter === 'slow') {
          if ((log.duration || 0) < 500) return false;
        } else if (quickFilter === 'graphql') {
          const isGql =
            (log.url || '').toLowerCase().includes('graphql') ||
            (log.client || '').toLowerCase().includes('graphql') ||
            (log.client || '').toLowerCase().includes('apollo');
          if (!isGql) return false;
        } else {
          if (log.method?.toUpperCase() !== quickFilter.toUpperCase()) {
            return false;
          }
        }
      }

      // 2. Status Filter Check (from filters accordion dropdown)
      if (statusFilters.size > 0) {
        const matched = [...statusFilters].some(f => {
          if (f === 'ALL') return true;
          if (f === 'Failed') return log.status === 0 || log.status == null;
          const codeNum = parseInt(f, 10);
          if (!isNaN(codeNum)) {
            return Number(log.status) === codeNum;
          }
          return String(log.status)[0] === f[0];
        });
        if (!matched) return false;
      }

      // 3. Method Filter Check (from filters accordion dropdown)
      if (methodFilters.size > 0) {
        const matchedMethod = [...methodFilters].some(m => {
          if (m === 'ALL') return true;
          return log.method?.toUpperCase() === m;
        });
        if (!matchedMethod) return false;
      }

      // 4. Advanced Search Query Engine Check with Scope, Regex and Case-Sensitivity
      if (search && search.trim().length > 0) {
        const routePath = logRouteMapRef.current.get(log.id)?.path || '';
        const isMatch = matchNetworkLogQuery(log, search, routePath, {
          scope: searchScope,
          isRegex: isRegexSearch,
          isCaseSensitive: isCaseSensitive,
        });
        if (!isMatch) return false;
      }

      return true;
    });

    if (sortOrder === 'oldest') {
      result = [...result].reverse();
    }

    // #9 — collapse consecutive identical requests
    if (!showDuplicateLogs) {
      const collapsed: NetworkLog[] = [];
      for (const log of result) {
        const last = collapsed[collapsed.length - 1];
        if (
          last &&
          last.method === log.method &&
          last.url === log.url &&
          last.status === log.status
        ) {
          collapsed[collapsed.length - 1] = {
            ...last,
            duplicateCount: (last.duplicateCount || 1) + 1,
          };
        } else {
          collapsed.push({...log, duplicateCount: 1});
        }
      }
      result = collapsed;
    }

    return result.slice(0, maxNetworkLogs);
  }, [
    logs,
    search,
    searchScope,
    isRegexSearch,
    isCaseSensitive,
    quickFilter,
    statusFilters,
    methodFilters,
    sortOrder,
    maxNetworkLogs,
    showDuplicateLogs,
  ]);

  const availableMethods = useMemo(() => {
    const methods = new Set<Method>();
    logs.forEach(log => {
      if (log.method) methods.add(log.method.toUpperCase() as Method);
    });
    return ['ALL' as Method, ...Array.from(methods)];
  }, [logs]);

  const toggleSectionFilter = useCallback(
    (pageName: string, filter: LocalFilter) => {
      setSectionFilters(prev => {
        const current =
          prev[pageName] || new Set(['success', 'failed', 'loading']);
        const next = new Set(current);

        if (next.has(filter)) {
          next.delete(filter);
        } else {
          next.add(filter);
        }

        return {...prev, [pageName]: next};
      });
    },
    [],
  );

  const toggleSectionCollapse = useCallback((pageName: string) => {
    setCollapsedSections(prev => {
      const next = new Set(prev);
      if (next.has(pageName)) next.delete(pageName);
      else next.add(pageName);
      return next;
    });
  }, []);

  const groupedData = useMemo(() => {
    const result: GroupedListItem[] = [];
    const groups: {pageName: string; color: string; logs: NetworkLog[]}[] = [];

    for (let i = 0; i < filteredLogs.length; i++) {
      const log = filteredLogs[i];
      const routeInfo =
        logRouteMapRef.current.get(log.id) || (log as any)?.routeInfo;
      const pageName = getLogPageName(log, routeInfo);

      if (
        groups.length === 0 ||
        groups[groups.length - 1].pageName !== pageName
      ) {
        groups.push({pageName, color: getDomainColor(pageName), logs: []});
      }
      groups[groups.length - 1].logs.push(log);
    }

    groups.forEach((g, idx) => {
      let success = 0;
      let failed = 0;
      let loading = 0;

      g.logs.forEach(l => {
        if (l.status == null) loading++;
        else if (l.status === 0 || l.status >= 400) failed++;
        else success++;
      });

      const activeFilters =
        sectionFilters[g.pageName] || new Set(['success', 'failed', 'loading']);

      const isCollapsed = collapsedSections.has(g.pageName);
      const timestamp = g.logs[0]?.startTime || 0;

      result.push({
        type: 'header',
        id: `hdr-${g.logs[0]?.id || 'empty'}-${g.pageName}`,
        pageName: g.pageName,
        color: g.color,
        stats: {success, failed, loading},
        timestamp,
        activeFilters,
        isCollapsed,
        isFirst: idx === 0,
      });

      if (!isCollapsed) {
        const displayLogs = g.logs.filter(l => {
          if (l.status == null) return activeFilters.has('loading');
          if (l.status === 0 || l.status >= 400)
            return activeFilters.has('failed');
          return activeFilters.has('success');
        });

        displayLogs.forEach((log, index) => {
          result.push({
            type: 'log',
            id: log.id,
            log,
            isLast: index === displayLogs.length - 1,
            color: g.color,
          });
        });
      }
    });

    return result;
  }, [filteredLogs, logs, sectionFilters, collapsedSections]);

  const {minStart, totalRange} = useMemo(() => {
    if (filteredLogs.length === 0) return {minStart: 0, totalRange: 0};
    const min = Math.min(...filteredLogs.map(l => l.startTime));
    const max = Math.max(
      ...filteredLogs.map(l => l.startTime + (l.duration || 10)),
    );
    return {minStart: min, totalRange: max - min};
  }, [filteredLogs]);

  const prevSameRequest = useMemo(() => {
    if (!selected) return null;
    const index = logs.findIndex(l => l.id === selected.id);
    if (index === -1) return null;
    for (let i = index + 1; i < logs.length; i++) {
      const l = logs[i];
      if (l.url === selected.url && l.method === selected.method) {
        return l;
      }
    }
    return null;
  }, [selected, logs]);

  const prevRequestData = prevSameRequest ? prevSameRequest.request : null;
  const prevResponseData = prevSameRequest ? prevSameRequest.response : null;

  const filteredAnalyticsEvents = useMemo(() => {
    let events = analyticsEvents;

    // Search query filter
    if (analyticsSearch && analyticsSearch.trim().length > 0) {
      const queryTokens = analyticsSearch.trim().toLowerCase().split(/\s+/).filter(Boolean);
      events = events.filter(e => {
        const searchTarget = [
          e.name || '',
          JSON.stringify(e.params || ''),
          JSON.stringify(e.userProperties || ''),
          e.screenName || '',
          e.pageTitle || '',
          e.userId || '',
          e.source || '',
        ].join(' ').toLowerCase();

        return queryTokens.every(token => searchTarget.includes(token));
      });
    }

    // Category filter
    if (analyticsFilters.categories.size > 0 && !analyticsFilters.categories.has('all')) {
      events = events.filter(e => {
        const cat = getEventCategory(e.name);
        return analyticsFilters.categories.has(cat);
      });
    }

    // Time window filter
    if (analyticsFilters.timeWindow !== 'all') {
      const now = Date.now();
      const cutoff =
        analyticsFilters.timeWindow === '1m'
          ? now - 60 * 1000
          : analyticsFilters.timeWindow === '5m'
          ? now - 5 * 60 * 1000
          : analyticsFilters.timeWindow === '15m'
          ? now - 15 * 60 * 1000
          : now - 60 * 60 * 1000;
      events = events.filter(e => e.timestamp >= cutoff);
    }

    // Source filter
    if (analyticsFilters.sources.size > 0 && !analyticsFilters.sources.has('all')) {
      events = events.filter(e => analyticsFilters.sources.has(e.source || 'manual'));
    }

    // User identification filter
    if (analyticsFilters.userTypes.size > 0 && !analyticsFilters.userTypes.has('all')) {
      events = events.filter(e => {
        const isIdentified = Boolean(e.userId && e.userId.trim() !== '');
        if (analyticsFilters.userTypes.has('identified') && isIdentified) return true;
        if (analyticsFilters.userTypes.has('anonymous') && !isIdentified) return true;
        return false;
      });
    }

    // Payload complexity filter
    if (analyticsFilters.payloadComplexity !== 'all') {
      if (analyticsFilters.payloadComplexity === 'none') {
        events = events.filter(
          e => !e.params || Object.keys(e.params).length === 0,
        );
      } else if (analyticsFilters.payloadComplexity === 'simple') {
        events = events.filter(
          e => e.params && Object.keys(e.params).length <= 3,
        );
      } else if (analyticsFilters.payloadComplexity === 'heavy') {
        events = events.filter(
          e => e.params && Object.keys(e.params).length > 3,
        );
      }
    }

    // Conversion / Goal events filter
    if (analyticsFilters.onlyConversions) {
      const CONVERSION_PATTERNS = [
        'purchase',
        'item_purchase',
        'ecommerce_purchase',
        'sign_up',
        'login',
        'lead',
        'generate_lead',
        'tutorial_complete',
        'add_payment_info',
        'begin_checkout',
        'spend_virtual_currency',
      ];
      events = events.filter(e =>
        CONVERSION_PATTERNS.some(pat => e.name.toLowerCase().includes(pat)),
      );
    }

    // Screen filter
    if (analyticsFilters.screens.size > 0) {
      events = events.filter(e => {
        const scr =
          e.screenName ||
          e.params?.firebase_screen ||
          e.params?.screen_name ||
          e.params?.firebase_screen_class ||
          e.screenClass ||
          '';
        return analyticsFilters.screens.has(scr);
      });
    }

    // Has Revenue filter
    if (analyticsFilters.hasRevenue) {
      events = events.filter(
        e =>
          (e.params?.value != null && !isNaN(Number(e.params.value))) ||
          (e.params?.price != null && !isNaN(Number(e.params.price))),
      );
    }

    // Has Items filter
    if (analyticsFilters.hasItems) {
      events = events.filter(
        e => Array.isArray(e.params?.items) && e.params.items.length > 0,
      );
    }

    // Has User Props filter
    if (analyticsFilters.hasUserProps) {
      events = events.filter(
        e => e.userProperties && Object.keys(e.userProperties).length > 0,
      );
    }

    // Has Params filter
    if (analyticsFilters.hasParams) {
      events = events.filter(
        e => e.params && Object.keys(e.params).length > 0,
      );
    }

    // Deduplication
    const deduplicatedEvents: (AnalyticsEvent & {count?: number})[] = [];
    for (const e of events) {
      if (deduplicatedEvents.length === 0) {
        deduplicatedEvents.push({...e, count: 1});
        continue;
      }
      const last = deduplicatedEvents[deduplicatedEvents.length - 1];
      if (
        last.name === e.name &&
        JSON.stringify(last.params) === JSON.stringify(e.params) &&
        JSON.stringify(last.userProperties) === JSON.stringify(e.userProperties)
      ) {
        last.count = (last.count || 1) + 1;
        // Point to the newest timestamp and id
        last.timestamp = e.timestamp;
        last.id = e.id;
      } else {
        deduplicatedEvents.push({...e, count: 1});
      }
    }

    let result = deduplicatedEvents;

    // Only duplicates filter
    if (analyticsFilters.onlyDuplicates) {
      result = result.filter(e => (e.count || 1) > 1);
    }

    // Sorting
    if (analyticsFilters.sortBy === 'time_asc') {
      result = [...result].sort((a, b) => a.timestamp - b.timestamp);
    } else if (analyticsFilters.sortBy === 'revenue_desc') {
      result = [...result].sort((a, b) => {
        const valA = Number(a.params?.value ?? a.params?.price ?? 0);
        const valB = Number(b.params?.value ?? b.params?.price ?? 0);
        return valB - valA;
      });
    } else if (analyticsFilters.sortBy === 'count_desc') {
      result = [...result].sort((a, b) => (b.count || 1) - (a.count || 1));
    }

    return result.slice(0, maxAnalyticsEventsLimit);
  }, [analyticsEvents, analyticsSearch, analyticsFilters, maxAnalyticsEventsLimit]);

  const filteredConsoleLogs = useMemo(() => {
    let result = visibleConsoleLogs;

    // Filters check
    if (logFilters.size > 0 && !logFilters.has('all')) {
      result = result.filter(log => {
        if (logFilters.has(log.type)) return true;
        if (logFilters.has('user-log') && log.sourceMethod === 'log')
          return true;
        if (
          logFilters.has('analytics') &&
          log.message?.toLowerCase().includes('[analytics error]')
        )
          return true;
        return false;
      });
    }

    // Comprehensive Search bar check
    if (logSearch && logSearch.trim().length > 0) {
      const queryTokens = logSearch.trim().toLowerCase().split(/\s+/).filter(Boolean);
      result = result.filter(log => {
        const searchTarget = [
          log.message || '',
          log.caller || '',
          log.type || '',
          log.sourceMethod || '',
        ].join(' ').toLowerCase();

        return queryTokens.every(token => {
          if (token.startsWith('level:') || token.startsWith('is:') || token.startsWith('type:')) {
            const flag = token.replace(/^(level:|is:|type:)/, '').trim();
            if (flag === 'error' || flag === 'err') return log.type === 'error';
            if (flag === 'warn' || flag === 'warning') return log.type === 'warn';
            if (flag === 'info') return log.type === 'info';
            if (flag === 'log') return log.sourceMethod === 'log';
            if (flag === 'analytics') return (log.message || '').toLowerCase().includes('[analytics');
          }
          if (token === 'error' || token === 'err') {
            return log.type === 'error' || searchTarget.includes(token);
          }
          if (token === 'warn' || token === 'warning') {
            return log.type === 'warn' || searchTarget.includes(token);
          }
          return searchTarget.includes(token);
        });
      });
    }

    // #7 — apply sort order (newest/oldest first)
    result = [...result].sort((a, b) =>
      logSortOrder === 'newest'
        ? b.timestamp - a.timestamp
        : a.timestamp - b.timestamp,
    );

    // #9 — collapse consecutive identical messages into one row with a ×N
    // counter unless duplicates are explicitly enabled in Settings.
    if (!showDuplicateLogs) {
      const collapsed: ConsoleLog[] = [];
      for (const log of result) {
        const last = collapsed[collapsed.length - 1];
        if (
          last &&
          last.type === log.type &&
          last.sourceMethod === log.sourceMethod &&
          last.message === log.message
        ) {
          collapsed[collapsed.length - 1] = {
            ...last,
            duplicateCount: (last.duplicateCount || 1) + 1,
          };
        } else {
          collapsed.push({...log, duplicateCount: 1});
        }
      }
      result = collapsed;
    }

    return result;
  }, [
    visibleConsoleLogs,
    logFilters,
    logSearch,
    logSortOrder,
    showDuplicateLogs,
  ]);

  const logCounts = useMemo(() => {
    let searchedLogs = visibleConsoleLogs;
    if (logSearch && logSearch.trim().length > 0) {
      const queryTokens = logSearch.trim().toLowerCase().split(/\s+/).filter(Boolean);
      searchedLogs = visibleConsoleLogs.filter(log => {
        const searchTarget = [
          log.message || '',
          log.caller || '',
          log.type || '',
          log.sourceMethod || '',
        ].join(' ').toLowerCase();

        return queryTokens.every(token => searchTarget.includes(token));
      });
    }

    const total = visibleConsoleLogs.length;

    return {
      all: `${searchedLogs.length}/${total}`,
      info: `${searchedLogs.filter(l => l.type === 'info').length}/${total}`,
      warn: `${searchedLogs.filter(l => l.type === 'warn').length}/${total}`,
      error: `${searchedLogs.filter(l => l.type === 'error').length}/${total}`,
      'user-log': `${
        searchedLogs.filter(l => l.sourceMethod === 'log').length
      }/${total}`,
      analytics: `${
        searchedLogs.filter(l =>
          l.message.toLowerCase().includes('[analytics error]'),
        ).length
      }/${total}`,
    };
  }, [visibleConsoleLogs, logSearch]);

  function closeModal() {
    animateNextLayout();
    setVisible(false);
    setSelected(null);
    setSelectedEvent(null);
    setSelectedLog(null);
    setSelectedReduxSlice(null);
    setSelectedReduxAction(null);
    setSelectedCrash(null);
  }

  function handleClearAll() {
    clearNetworkLogs();
    setLogs([]);
    setSelectedLogs(new Set());
    setSectionFilters({});
    setCollapsedSections(new Set());
    setStatusFilters(new Set());
    setMethodFilters(new Set());
    prevLogIdsRef.current = new Set();
    logRouteMapRef.current = new Map();
    // Also clear analytics
    clearAnalyticsEvents();
    setAnalyticsEvents([]);
    prevEventIdsRef.current = new Set();
    // Also clear console logs
    clearConsoleLogs();
    setConsoleLogs([]);
  }

  function handleDelete() {
    if (activeTab === 'logs') {
      Alert.alert(
        'Clear Logs',
        'Are you sure you want to clear all console logs?',
        [
          {text: 'Cancel', style: 'cancel'},
          {
            text: 'Clear All',
            onPress: () => {
              clearConsoleLogs();
              setConsoleLogs([]);
            },
            style: 'destructive',
          },
        ],
      );
      return;
    }
    if (activeTab === 'analytics') {
      Alert.alert(
        'Clear Analytics',
        'Are you sure you want to clear all analytics events?',
        [
          {text: 'Cancel', style: 'cancel'},
          {
            text: 'Clear All',
            onPress: () => {
              clearAnalyticsEvents();
              setAnalyticsEvents([]);
              setSelectedEvent(null);
              prevEventIdsRef.current = new Set();
            },
            style: 'destructive',
          },
        ],
      );
      return;
    }
    if (activeTab === 'redux') {
      Alert.alert(
        'Clear Redux Timeline',
        'Are you sure you want to clear the dispatched action history?',
        [
          {text: 'Cancel', style: 'cancel'},
          {
            text: 'Clear All',
            onPress: () => {
              clearActionHistory();
              setReduxLastActionMap({});
            },
            style: 'destructive',
          },
        ],
      );
      return;
    }
    if (activeTab === 'crash') {
      Alert.alert(
        'Clear Crash History',
        'Are you sure you want to clear all intercepted crash records?',
        [
          {text: 'Cancel', style: 'cancel'},
          {
            text: 'Clear All',
            onPress: () => {
              clearCrashRecords();
              setCrashRecords([]);
              setSelectedCrash(null);
            },
            style: 'destructive',
          },
        ],
      );
      return;
    }
    // Default: APIs tab. Only clears NETWORK logs — never touches the other tabs.
    if (selectedLogs.size > 0) {
      setLogs(prev => prev.filter(l => !selectedLogs.has(l.id)));
      setSelectedLogs(new Set());
    } else {
      Alert.alert(
        'Clear Logs',
        'Are you sure you want to clear all network logs?',
        [
          {text: 'Cancel', style: 'cancel'},
          {
            text: 'Clear All',
            onPress: clearNetworkOnly,
            style: 'destructive',
          },
        ],
      );
    }
  }

  // Clears ONLY network logs + their derived selection/filter state.
  function clearNetworkOnly() {
    clearNetworkLogs();
    setLogs([]);
    setSelectedLogs(new Set());
    setSectionFilters({});
    setCollapsedSections(new Set());
    setStatusFilters(new Set());
    setMethodFilters(new Set());
    prevLogIdsRef.current = new Set();
    logRouteMapRef.current = new Map();
  }

  const detailTitle = useMemo(() => {
    if (!selected) return '';
    try {
      const path = new URL(selected.url).pathname;
      const parts = path.split('/').filter(Boolean);
      return parts.length > 0 ? `/${parts.slice(-2).join('/')}` : '/';
    } catch {
      const parts = selected.url.split('/').filter(Boolean);
      return parts.length > 0 ? `/${parts.slice(-2).join('/')}` : selected.url;
    }
  }, [selected]);

  const detailDisplayUrl = useMemo(() => {
    return selected ? formatDisplayUrl(selected.url) : '';
  }, [selected]);

  const toggleSelect = useCallback((id: number) => {
    setSelectedLogs(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const contextValue: InspectorContextValue = {
    // ─── Modal / launcher ───────────────────────────────────────────────
    visible,
    setVisible,
    closeModal,
    isReady,
    enabled,
    isEnabled: enabled,
    appIcon,
    environment,
    modalHeightPercent,
    setModalHeightPercent,
    modalAnimationType,
    setModalAnimationType,
    hasNavigationContext,
    setNavState,

    // ─── Tabs ───────────────────────────────────────────────────────────
    activeTab,
    switchActiveTab,
    tabVisibility,
    toggleTabVisibility,
    lastReadApisCount,
    lastReadLogsCount,

    // ─── Selection / header state ───────────────────────────────────────
    selected,
    setSelected,
    selectedEvent,
    setSelectedEvent,
    selectedLog,
    setSelectedLog,
    showHeaderInfo,
    setShowHeaderInfo,
    settingsPage,
    setSettingsPage,
    updateAvailable,
    latestNpmVersion,
    clearAnim,
    activePulseAnim,
    unreadPulseAnim,
    runClearAllWithAnimation,

    // ─── FAB / launcher ─────────────────────────────────────────────────
    useNativeFab,
    fabPan,
    fabPanResponder,
    fabDraggedRef,
    pulseAnim,
    fabShineAnim,

    // ─── Network (APIs) ─────────────────────────────────────────────────
    logs,
    filteredLogs,
    groupedData,
    search,
    setSearch,
    searchScope,
    setSearchScope,
    isRegexSearch,
    setIsRegexSearch,
    isCaseSensitive,
    setIsCaseSensitive,
    quickFilter,
    setQuickFilter,
    statusFilters,
    setStatusFilters,
    methodFilters,
    setMethodFilters,
    availableMethods,
    sortOrder,
    setSortOrder,
    selectedLogs,
    toggleSelect,
    minStart,
    totalRange,
    newLogIds,
    toggleSectionFilter,
    toggleSectionCollapse,
    handleDelete,
    isNetworkPaused,
    setIsNetworkPaused,

    // ─── Network detail ─────────────────────────────────────────────────
    detailTitle,
    detailDisplayUrl,
    apiDetailActiveTab,
    setApiDetailActiveTab,
    detailSearch,
    setDetailSearch,
    reqExpanded,
    setReqExpanded,
    resExpanded,
    setResExpanded,
    showReqDiff,
    setShowReqDiff,
    showResDiff,
    setShowResDiff,
    prevRequestData,
    prevResponseData,
    logRouteMapRef,

    // ─── Console (Logs) ─────────────────────────────────────────────────
    consoleLogs,
    visibleConsoleLogs,
    filteredConsoleLogs,
    logSearch,
    setLogSearch,
    logFilters,
    setLogFilters,
    logCounts,
    logSortOrder,
    setLogSortOrder,
    isConsolePaused,
    setIsConsolePaused,

    // ─── Analytics ──────────────────────────────────────────────────────
    analyticsEvents,
    filteredAnalyticsEvents,
    analyticsSearch,
    setAnalyticsSearch,
    analyticsFilters,
    setAnalyticsFilters,
    isAnalyticsFilterApplied,
    resetAnalyticsFilters,
    newEventIds,
    isAnalyticsLayoutReady,
    setIsAnalyticsLayoutReady,
    analyticsHeaderExpanded,
    setAnalyticsHeaderExpanded,
    isAnalyticsPaused,
    setIsAnalyticsPaused,

    // ─── Redux ──────────────────────────────────────────────────────────
    reduxState,
    setReduxState,
    reduxLastActionMap,
    reduxSearch,
    setReduxSearch,
    selectedReduxSlice,
    setSelectedReduxSlice,
    selectedReduxAction,
    setSelectedReduxAction,
    reduxActiveSubTab,
    setReduxActiveSubTab,

    // ─── Crash ───────────────────────────────────────────────────────────
    crashRecords,
    setCrashRecords,
    selectedCrash,
    setSelectedCrash,
    lastReadCrashesCount,
    maxCrashLogs,
    setMaxCrashLogs,
    clearAllCrashes: () => {
      clearCrashRecords();
      setCrashRecords([]);
      setSelectedCrash(null);
    },

    // ─── Settings ───────────────────────────────────────────────────────
    settingsActiveSubTab,
    setSettingsActiveSubTab,
    defaultTab,
    setDefaultTab,
    isDark,
    setIsDark,
    showDuplicateLogs,
    setShowDuplicateLogs,
    showUpdateToast,
    setShowUpdateToast,
    showConsoleLevels,
    setShowConsoleLevels,
    resetToDefaults,
    storage,
    maxNetworkLogs,
    setMaxNetworkLogs,
    maxConsoleLogs,
    setMaxConsoleLogs,
    maxAnalyticsEventsLimit,
    setMaxAnalyticsEventsLimit,
    isAutoRamLimitEnabled,
    setIsAutoRamLimitEnabled,
    deviceFreeRamMb,
    reduxAutoRefresh,
    setReduxAutoRefreshState,
    reduxExpandDepth,
    setReduxExpandDepth,
  };

  return (
    <InspectorContext.Provider value={contextValue}>
      <MainScreen />
    </InspectorContext.Provider>
  );
};

const NetworkInspectorWrapper = (props: NetworkInspectorProps) => {
  const enabled = props?.enabled ?? true;
  const telemetry = props?.telemetry ?? true;

  useEffect(() => {
    if (!enabled) {
      // When inspector is disabled: hide FAB and kill all telemetry
      hideNativeFloatingButton().catch(() => {});
      setTelemetryEnabled(false);
    } else if (telemetry) {
      // Inspector is enabled and telemetry is on — fire heartbeat
      trackActiveTelemetryHeartbeat(true, props?.environment);
    } else {
      // Inspector is enabled but telemetry is explicitly off
      setTelemetryEnabled(false);
    }
    return () => {
      hideNativeFloatingButton().catch(() => {});
    };
  }, [enabled, telemetry, props?.environment]);

  // If enabled is false, return null immediately with 0 overhead
  if (!enabled) {
    return null;
  }

  return (
    <I18nextProvider i18n={i18n}>
      <ErrorBoundary fallbackType="inline">
        <NetworkInspector
          {...props}
          enabled={enabled}
        />
      </ErrorBoundary>
    </I18nextProvider>
  );
};

export default NetworkInspectorWrapper;

// Re-export public APIs
export {
  setupNetworkLogger,
  clearNetworkLogs,
  subscribeNetworkLogs,
  addAxiosInterceptors,
} from './customHooks/networkLogger';

export {
  setupConsoleLogger,
  clearConsoleLogs,
  subscribeConsoleLogs,
} from './customHooks/consoleLogger';

export {
  setupAnalyticsLogger,
  logAnalyticsEvent,
  subscribeAnalyticsEvents,
  clearAnalyticsEvents,
  getCurrentUserProperties,
  getCurrentUserId,
  getDefaultEventParameters,
  getCollectionEnabled,
} from './customHooks/analyticsLogger';

export {
  setupGlobalCrashHandler,
  subscribeCrashEvents,
  emitCrashEvent,
  getCrashRecords,
  clearCrashRecords,
  simulateTestCrash,
  exportCrashReport,
  parseCrashStackTrace,
  recordCustomCrash,
  addCrashBreadcrumb,
  recordNavigationBreadcrumb,
  recordNetworkBreadcrumb,
  recordReduxBreadcrumb,
  recordUserActionBreadcrumb,
  computeCrashFingerprint,
  type CrashEventPayload,
} from './customHooks/crashHandler';

export {default as CrashTab} from './components/Inspector/CrashTab';
export {default as ErrorBoundary} from './components/ErrorBoundary';

export {
  connectReduxStore,
  inspectorReduxMiddleware,
  getReduxState,
  subscribeReduxState,
  getActionHistory,
  clearActionHistory,
  getLastActionForReducer,
} from './customHooks/reduxLogger';

export {
  getEventCategory,
  registerGAPlugin,
  type GAPlugin,
} from './helpers/gaAnalyticsRegistry';

export {
  usePerformanceTracker,
  useComponentProfiler,
  useNavigationProfiler,
  trackComponentRender,
  trackNavigationTransition,
  trackHeavyTask,
  measureAsync,
  getHermesMemoryStats,
  registerComponentProfile,
  subscribeRenderProfiles,
  getRenderProfiles,
  logPerformanceEvent,
  clearPerformanceEvents,
  subscribePerformanceEvents,
  getPerformanceEvents,
  getInitialRenderProfiles,
  getInitialPerformanceEvents,
  generateFixSnippet,
} from './customHooks/performanceTracker';

export {
  InspectLog,
  InspectTrackTime,
  InspectCatch,
  type InspectLogOptions,
} from './decorators';

export {
  getNativeDeviceMetrics,
  enableNativeCrashProtection,
  subscribeNativeCrashes,
  showNativeFloatingButton,
  hideNativeFloatingButton,
  setNativeFloatingButtonBadge,
  subscribeNativeFloatingButtonPress,
  subscribeNativeDeviceShake,
  startNativeFpsMonitoring,
  stopNativeFpsMonitoring,
  getNativeFpsMetrics,
  getNativeStorageItem,
  setNativeStorageItem,
  isNativeModuleAvailable,
  type NativeDeviceMetrics,
  type NativeCrashEvent,
  type FloatingButtonOptions,
  type NativeFpsMetrics,
} from './native/NativeInspector';

export {
  setupMemoryWarningHandler,
  pruneAllLogs,
  subscribeMemoryWarning,
  type MemoryPruneSummary,
} from './helpers';

export {
  setMaxNetworkLogsLimit,
  getMaxNetworkLogsLimit,
  pruneNetworkLogs,
} from './customHooks/networkLogger';

export {
  setMaxConsoleLogsLimit,
  getMaxConsoleLogsLimit,
  pruneConsoleLogs,
} from './customHooks/consoleLogger';

export {
  setMaxReduxHistoryLimit,
  getMaxReduxHistoryLimit,
  pruneReduxHistory,
} from './customHooks/reduxLogger';

export {
  setMaxAnalyticsLogsLimit,
  getMaxAnalyticsLogsLimit,
  pruneAnalyticsLogs,
} from './customHooks/analyticsLogger';

export {
  getMaxCrashLogsLimit,
  pruneCrashRecords,
} from './customHooks/crashHandler';

export {
  setMaxPerformanceEventsLimit,
  getMaxPerformanceEventsLimit,
  prunePerformanceEvents,
} from './customHooks/performanceTracker';

export {
  BrandSquareIcon,
  BrandCircleIcon,
} from './components/NetworkIcons';

export {
  connectAsyncStorage,
  connectMMKV,
  isAsyncStorageConnected,
  isMMKVConnected,
  getRegisteredMMKVInstanceIds,
  fetchStorageEntries,
  setStorageEntry,
  removeStorageEntry,
  clearStorageDriver,
  subscribeToStorageChanges,
  type StorageEntry,
  type StorageDriver,
} from './customHooks/storageInspector';

export {
  ActiveTab,
  Method,
  StatusFilter,
  SortOrder,
  LocalFilter,
  ModalAnimationType,
  SettingsPage,
  SettingsSubTab,
  LogFilter,
  ConsoleLogType,
  AnalyticsEventSource,
  GAEventCategory,
  StackFrameType,
  DiffResultType,
  BundleSubTab,
  PerformanceSubTab,
  CrashType,
  CrashExportFormat,
  CrashDetailSubTab,
  CrashFilterType,
  BreadcrumbType,
} from './types';

export {
  AppFonts,
  setAppFonts,
  type AppFontConfig,
} from './styles/AppFonts';

export {
  AppColors,
  setAppColors,
  getThemeColors,
  updateAppColorsTheme,
} from './styles/AppColors';

export {
  t,
  i18n,
  useTranslation,
  setLanguage,
  addTranslations,
  setTranslations,
  I18nextProvider,
} from './i18n';