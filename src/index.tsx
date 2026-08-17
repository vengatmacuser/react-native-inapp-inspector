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
  deduplicateLogs,
  getDomainColor,
  getEventCategory,
} from './helpers';
// #5 — settings persistence
import {
  loadSettings,
  saveSettings,
  setCustomStorage,
  clearPersistedSettings,
} from './helpers/settingsStore';

// Network
import {
  setupNetworkLogger,
  clearNetworkLogs,
  subscribeNetworkLogs,
} from './customHooks/networkLogger';

// Console
import {
  setupConsoleLogger,
  clearConsoleLogs,
  subscribeConsoleLogs,
  getConsoleLogs,
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
} from './customHooks/crashHandler';

import {
  subscribeAnalyticsEvents,
  clearAnalyticsEvents,
  autoSetupAnalyticsLogger,
} from './customHooks/analyticsLogger';

import {
  getReduxState,
  subscribeReduxState,
  setReduxAutoRefresh,
  getLastActionForReducer,
  clearActionHistory,
} from './customHooks/reduxLogger';

// Constants
import {
  StatusFilter,
  NetworkLog,
  RouteInfo,
  LocalFilter,
  SortOrder,
  GroupedListItem,
  ActiveTab,
  ConsoleLog,
  Method,
  AnalyticsEvent,
  AnalyticsFilters,
  NetworkInspectorProps,
  CrashRecord,
  ParsedStackFrame,
  CrashBreadcrumb,
} from './types';
import {LIB_VERSION} from './constants';

// Stylesheet
import {toggleGlobalTheme} from './styles';

const NetworkInspector = ({
  enabled = true,
  isEnabled = true,
  storage,
  navigationRef,
  appIcon,
  environment,
}: NetworkInspectorProps): React.JSX.Element => {
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
  const [visible, setVisible] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [selected, setSelected] = useState<NetworkLog | null>(null);
  const [selectedLogs, setSelectedLogs] = useState<Set<number>>(new Set());
  const [search, setSearch] = useState('');
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
  const [maxCrashLogs, setMaxCrashLogs] = useState<number>(100);

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

  const [maxConsoleLogs, setMaxConsoleLogs] = useState<number>(200);
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
  const [settingsActiveSubTab, setSettingsActiveSubTab] = useState<'module' | 'ui'>('module');
  const [tabVisibility, setTabVisibility] = useState<
    Record<ActiveTab, boolean>
  >({
    apis: true,
    logs: true,
    analytics: true,
    redux: false,
    bundle: false,
    performance: false,
    crash: true,
  });

  const [maxNetworkLogs, setMaxNetworkLogs] = useState<number>(100);

  const [reduxAutoRefresh, setReduxAutoRefreshState] = useState<boolean>(true);
  const [reduxExpandDepth, setReduxExpandDepth] = useState<number>(1);

  // #6 — tab the inspector opens on. Shown with a DEFAULT badge in Settings.
  const [defaultTab, setDefaultTab] = useState<ActiveTab>('apis');
  const [showDuplicateLogs, setShowDuplicateLogs] = useState<boolean>(false);

  const resetToDefaults = async () => {
    await clearPersistedSettings();
    setIsDark(false);
    toggleGlobalTheme(false);
    setModalHeightPercent(90);
    setModalAnimationType('slide');
    setTabVisibility({
      apis: true,
      logs: true,
      analytics: true,
      redux: false,
      bundle: false,
      performance: false,
      crash: true,
    });
    setDefaultTab('apis');
    setMaxCrashLogs(100);
    setMaxNetworkLogs(100);
    setMaxConsoleLogs(200);
    setShowConsoleLevels({
      info: true,
      warn: true,
      error: true,
    });
    setReduxAutoRefreshState(true);
    setReduxExpandDepth(1);
    setShowDuplicateLogs(false);
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
          crash:
            (saved.tabVisibility as any).crash !== undefined
              ? (saved.tabVisibility as any).crash
              : true,
        }));
      if (saved.defaultTab) setDefaultTab(saved.defaultTab as ActiveTab);
      if (saved.maxNetworkLogs != null) setMaxNetworkLogs(saved.maxNetworkLogs);
      if (saved.maxConsoleLogs != null) setMaxConsoleLogs(saved.maxConsoleLogs);
      if (saved.showConsoleLevels)
        setShowConsoleLevels(saved.showConsoleLevels);
      if (saved.reduxAutoRefresh != null)
        setReduxAutoRefreshState(saved.reduxAutoRefresh);
      if (saved.reduxExpandDepth != null)
        setReduxExpandDepth(saved.reduxExpandDepth);
      if (saved.showDuplicateLogs != null)
        setShowDuplicateLogs(saved.showDuplicateLogs);
      if (saved.defaultTab) {
        const dt = saved.defaultTab as ActiveTab;
        const vis = {
          ...{
            apis: true,
            logs: true,
            analytics: true,
            redux: false,
            bundle: false,
            performance: false,
            crash: true,
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
      showConsoleLevels,
      reduxAutoRefresh,
      reduxExpandDepth,
      showDuplicateLogs,
    });
  }, [
    isDark,
    modalHeightPercent,
    modalAnimationType,
    tabVisibility,
    defaultTab,
    maxNetworkLogs,
    maxConsoleLogs,
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

  const toggleTabVisibility = (key: ActiveTab) => {
    if (key === 'apis') return;
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

  const switchActiveTab = useCallback((key: ActiveTab) => {
    setActiveTab(key);
  }, []);

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
    path: 'Navigators',
    params: null,
  });
  useEffect(() => {
    if (navState) {
      currentRouteRef.current = getNavigationInfo(navState);
    }
  }, [navState]);

  useEffect(() => {
    if (!navigationRef) return;

    const updateState = () => {
      try {
        if (typeof navigationRef.isReady === 'function' && navigationRef.isReady()) {
          const state = navigationRef.getRootState();
          if (state) {
            setNavState(state);
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

  // #6 — every time the inspector is opened, land on the chosen default tab.
  useEffect(() => {
    if (visible) {
      const target =
        defaultTab === 'apis' || tabVisibility?.[defaultTab]
          ? defaultTab
          : 'apis';
      setActiveTab(target);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  useEffect(() => {
    if (visible) {
      const task = InteractionManager.runAfterInteractions(() => {
        setIsReady(true);
      });
      const fallbackTimer = setTimeout(() => {
        setIsReady(true);
      }, 350);
      return () => {
        task.cancel();
        clearTimeout(fallbackTimer);
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

    const unsubscribeCrash = subscribeCrashEvents(crashInfo => {
      if (crashInfo.message === '__CLEARED__') {
        setCrashRecords([]);
        setSelectedCrash(null);
        return;
      }
      const updated = getCrashRecords();
      setCrashRecords(updated);
    });

    // Sync crashes recorded before this subscription ran (e.g. a render crash
    // during the very first commit, which fires before effects are mounted).
    const pendingCrashes = getCrashRecords();
    if (pendingCrashes.length > 0) {
      setCrashRecords(pendingCrashes);
    }

    let timeoutId: ReturnType<typeof setTimeout>;

    let isFirstNetworkCall = true;
    const unsubscribe = subscribeNetworkLogs((raw: NetworkLog[]) => {
      latestNetworkLogsRef.current = raw;
      if (isNetworkPausedRef.current) return;
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
              logRouteMapRef.current.set(id, currentRouteRef.current);
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
        if (isAnalyticsPausedRef.current) return;
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
      if (isConsolePausedRef.current) return;
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
    setReduxState(initialReduxState && typeof initialReduxState === 'object' ? {...initialReduxState} : initialReduxState);
    setReduxLastActionMap({...getLastActionForReducer()});
    const unsubscribeRedux = subscribeReduxState(() => {
      // New references each time guarantee the Redux tab updates live, even when
      // the root state object reference is unchanged or auto-refresh is paused.
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
    };
  }, []);

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
      // Status Filter Check
      if (statusFilters.size > 0) {
        const matched = [...statusFilters].some(f => {
          if (f === 'ALL') return true;
          if (f === 'Failed') return log.status === 0 || log.status == null;
          return String(log.status)[0] === f[0];
        });
        if (!matched) return false;
      }

      // Method Filter Check
      if (methodFilters.size > 0) {
        const matchedMethod = [...methodFilters].some(m => {
          if (m === 'ALL') return true;
          return log.method?.toUpperCase() === m;
        });
        if (!matchedMethod) return false;
      }

      // Search Bar Check
      if (search && !log.url?.toLowerCase().includes(search.toLowerCase()))
        return false;

      return true;
    });

    if (sortOrder === 'oldest') {
      result = [...result].reverse();
    }

    // #9 — collapse consecutive identical requests (same method + url +
    // status) into one row carrying a ×N counter, unless the user opted in
    // to seeing every duplicate via Settings → "Show Duplicate Logs".
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
      const routeInfo = logRouteMapRef.current.get(log.id);
      const pageName = routeInfo?.path || 'Navigators';

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
    if (analyticsSearch) {
      const s = analyticsSearch.toLowerCase();
      events = events.filter(
        e =>
          e.name.toLowerCase().includes(s) ||
          JSON.stringify(e.params || {}).toLowerCase().includes(s) ||
          (e.screenName ?? '').toLowerCase().includes(s) ||
          (e.pageTitle ?? '').toLowerCase().includes(s),
      );
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
      events = events.filter(e => {
        const count = e.params ? Object.keys(e.params).length : 0;
        if (analyticsFilters.payloadComplexity === 'none') return count === 0;
        if (analyticsFilters.payloadComplexity === 'simple') return count >= 1 && count <= 5;
        if (analyticsFilters.payloadComplexity === 'heavy') return count > 5;
        return true;
      });
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
      events = events.filter(e => {
        const val = e.params?.value ?? e.params?.price;
        return val !== undefined && val !== null && Number(val) > 0;
      });
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

    return result;
  }, [analyticsEvents, analyticsSearch, analyticsFilters]);

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
          log.message.toLowerCase().includes('[analytics error]')
        )
          return true;
        return false;
      });
    }

    // Search bar check
    if (logSearch) {
      const s = logSearch.toLowerCase();
      result = result.filter(
        log =>
          log.message.toLowerCase().includes(s) ||
          (log.caller ?? '').toLowerCase().includes(s),
      );
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
    if (logSearch) {
      const s = logSearch.toLowerCase();
      searchedLogs = visibleConsoleLogs.filter(
        log =>
          log.message.toLowerCase().includes(s) ||
          (log.caller ?? '').toLowerCase().includes(s),
      );
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
    isEnabled,
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
    showConsoleLevels,
    setShowConsoleLevels,
    resetToDefaults,
    storage,
    maxNetworkLogs,
    setMaxNetworkLogs,
    maxConsoleLogs,
    setMaxConsoleLogs,
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
  // If running in production release build and not explicitly force-enabled (e.g. for QA builds),
  // return null immediately for 0-overhead production stubbing.
  if (typeof __DEV__ !== 'undefined' && !__DEV__ && !props?.forceEnable) {
    return null;
  }

  return (
    <I18nextProvider i18n={i18n}>
      <ErrorBoundary fallbackType="inline">
        <NetworkInspector {...props} />
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
  logPerformanceEvent,
  clearPerformanceEvents,
  subscribePerformanceEvents,
  getPerformanceEvents,
} from './customHooks/performanceTracker';

export {
  InspectLog,
  InspectTrackTime,
  InspectCatch,
  type InspectLogOptions,
} from './decorators';

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