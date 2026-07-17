import React, {useEffect, useMemo, useRef, useState, useCallback} from 'react';
import {
  Alert,
  Animated,
  StyleSheet,
  FlatList,
  LayoutAnimation,
  Modal,
  PanResponder,
  Dimensions,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  Linking,
  Image,
  InteractionManager,
  ActivityIndicator,
  StatusBar,
  TouchableOpacity,
  UIManager,
  LogBox,
} from 'react-native';
import Svg, {Circle, Path} from 'react-native-svg';
import LinearGradient from 'react-native-linear-gradient';
import {useNavigationState, NavigationContext} from '@react-navigation/native';

// Components
import TouchableScale from './components/TouchableScale';
import useAccordion from './customHooks/useAccordion';
import MetaAccordion from './components/MetaAccordion';
import CopyButton from './components/CopyButton';
import SectionHeader from './components/SectionHeader';
import EmptyState from './components/EmptyState';
import JsonViewer from './components/JsonViewer';
import {
  ReduxTreeView,
} from './components/ReduxTreeView';
import DomainHeader from './components/DomainHeader';
import DiffViewer from './components/DiffViewer';
import LogCard from './components/LogCard';
import HeadersSection from './components/HeadersSection';
import SourcePageCard from './components/SourcePageCard';
import {ConsoleLogCard} from './components/ConsoleLogCard';
import HighlightText from './components/HighlightText';
import CodeSnippet from './components/CodeSnippet';
import AnimatedEntrance from './components/AnimatedEntrance';

// Helpers
import {
  formatDateTime,
  getStatusColor,
  getNavigationInfo,
  deduplicateLogs,
  getDomainColor,
  formatDisplayUrl,
  getFetchCommand,
  getCurlCommand,
  getSize,
  getBundleIdentifier,
  getAppName,
} from './helpers';
// #5 — settings persistence
import {
  loadSettings,
  saveSettings,
  setCustomStorage,
  isPersistentStorageAvailable,
  clearPersistedSettings,
} from './helpers/settingsStore';

// Assets
import {
  EmptyRadarIcon,
  FailIcon,
  SearchIcon,
  ScreenIcon,
  ClearIcon,
  SortArrowIcon,
  FilterIcon,
  InsightsIcon,
  GlobeIcon,
  DownloadIcon,
  CloseWhite,
  TrashIcon,
  WhiteBackNavigation,
  TerminalIcon,
  SignalIcon,
  AnalyticsIcon,
  SunIcon,
  MoonIcon,
  BrandCircleIcon,
  BrandSquareIcon,
  HtmlIcon,
  CssIcon,
  JsIcon,
  ClockIcon,
  EyeIcon,
  CheckIcon,
  SettingsIcon,
  RequestIcon,
  ResponseIcon,
  HeadersIcon,
  StatusIcon,
  ChevronIcon,
  WipeIcon,
  LayersIcon,
  UserIcon,
  InfoCircleIcon,
  WarningTriangleIcon,
  ErrorCircleIcon,
  TrendingUpIcon,
  MotionIcon,
} from './components/NetworkIcons';

import ErrorBoundary from './components/ErrorBoundary';

// Stylesheet
import {AppColors} from './styles/AppColors';
import {AppFonts} from './styles/AppFonts';
import styles, {toggleGlobalTheme} from './styles';

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
} from './customHooks/consoleLogger';
import {IGNORED_LOG_PREFIXES} from './customHooks/logFilters';

import {
  subscribeAnalyticsEvents,
  clearAnalyticsEvents,
  autoSetupAnalyticsLogger,
} from './customHooks/analyticsLogger';
import AnalyticsEventCard, {
  getEventColor,
} from './components/AnalyticsEventCard';
import AnalyticsDetail from './components/AnalyticsDetail';

import {
  WebViewLog,
  WebViewNavState,
  getWebViewLogs,
  getWebViewNavHistory,
  getWebViewHtml,
  getWebViewCss,
  getWebViewJs,
  getWebViewHtmlUrl,
  clearWebViewData,
  subscribeWebView,
} from './customHooks/webViewLogger';

let OriginalWebView: any = null;
try {
  const RNWebView = require('react-native-webview');
  OriginalWebView = RNWebView.WebView || RNWebView.default;
} catch (e) {
  // Silent fail
}

const previewInspectScript = `
(function() {
  var style = document.createElement('style');
  style.innerHTML = '* { cursor: pointer !important; }';
  document.head.appendChild(style);

  document.addEventListener('click', function(e) {
    var el = e.target;
    if (!el) return;

    e.preventDefault();
    e.stopPropagation();

    var oldOutline = el.style.outline;
    var oldTransition = el.style.transition;
    el.style.transition = 'outline 0.15s ease';
    el.style.outline = '3px solid #684B9B';
    setTimeout(function() {
      el.style.outline = oldOutline;
      el.style.transition = oldTransition;
    }, 600);

    var tagName = el.tagName.toLowerCase();
    var searchStr = '<' + tagName;
    
    if (el.id) {
      searchStr += ' id="' + el.id + '"';
    } else if (el.className && typeof el.className === 'string') {
      var firstClass = el.className.trim().split(/\\s+/)[0];
      if (firstClass) {
        searchStr += ' class="' + firstClass;
      }
    } else {
      var text = (el.textContent || '').trim().substring(0, 25);
      if (text) {
        searchStr = text;
      }
    }

    if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'preview-inspect',
        tagName: tagName,
        id: el.id || '',
        className: typeof el.className === 'string' ? el.className : '',
        searchStr: searchStr
      }));
    }
  }, true);
})();
true;
`;

import {
  getReduxState,
  subscribeReduxState,
  setReduxAutoRefresh,
  getLastActionForReducer,
  getActionHistory,
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
} from './types';
import {METHOD_COLORS, STATUS_FILTERS, LIB_VERSION} from './constants';

interface NavigationTrackerProps {
  onStateChange: (state: any) => void;
}

const NavigationTracker = ({onStateChange}: NavigationTrackerProps): null => {
  const navState = useNavigationState(state => state);
  useEffect(() => {
    onStateChange(navState);
  }, [navState, onStateChange]);
  return null;
};

interface NetworkInspectorProps {
  enabled?: boolean;
  storage?: {
    getItem: (key: string) => string | null | Promise<string | null>;
    setItem: (key: string, value: string) => void | Promise<void>;
    removeItem?: (key: string) => void | Promise<void>;
  };
  navigationRef?: any;
}

const animateNextLayout = () => {
  // Disabled LayoutAnimation to prevent iOS NSRangeException crashes under Fabric
  // and Android rendering performance freezes.
};

const NetworkInspector = ({
  enabled = true,
  storage,
  navigationRef,
}: NetworkInspectorProps): React.JSX.Element => {
  // Set custom storage synchronously during render phase
  setCustomStorage(storage || null);

  const [isDark, setIsDark] = useState(false);
  const [reduxState, setReduxState] = useState<any>(null);
  // Action timeline + per-reducer last action are kept in component state so the
  // Redux tab re-renders live on every dispatch, independent of the state tree ref.
  const [reduxActionHistory, setReduxActionHistory] = useState<any[]>([]);
  const [reduxLastActionMap, setReduxLastActionMap] = useState<
    Record<string, any>
  >({});
  // Inspector panel height as a percentage of the screen (configurable in Settings).
  const [modalHeightPercent, setModalHeightPercent] = useState<number>(90);
  const [modalAnimationType, setModalAnimationType] = useState<'slide' | 'fade' | 'none'>('slide');
  const headerTopPadding = Platform.OS === 'ios' && modalHeightPercent >= 95 ? 44 : 0;
  const [expandedReducers, setExpandedReducers] = useState<
    Record<string, boolean>
  >({});

  const [logs, setLogs] = useState<NetworkLog[]>([]);
  const [visible, setVisible] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [selected, setSelected] = useState<NetworkLog | null>(null);
  const [selectedLogs, setSelectedLogs] = useState<Set<number>>(new Set());
  const [search, setSearch] = useState('');
  const [detailSearch, setDetailSearch] = useState('');
  const [reduxSearch, setReduxSearch] = useState('');

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
  const [showNetworkMenu, setShowNetworkMenu] = useState(false);
  const [showHeaderInfo, setShowHeaderInfo] = useState(false);
  const [showUiMenu, setShowUiMenu] = useState(false);
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');
  // #7 — sort order for the Logs (console) tab
  const [logSortOrder, setLogSortOrder] = useState<SortOrder>('newest');
  const [reqExpanded, setReqExpanded] = useState<boolean | undefined>(
    undefined,
  );
  const [resExpanded, setResExpanded] = useState<boolean | undefined>(
    undefined,
  );
  const [showReqDiff, setShowReqDiff] = useState<boolean>(false);
  const [showResDiff, setShowResDiff] = useState<boolean>(false);
  const filtersAccordion = useAccordion(false, 300, 260);

  // ─── Analytics state ───────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<ActiveTab>('apis');
  const [analyticsEvents, setAnalyticsEvents] = useState<AnalyticsEvent[]>([]);

  // ─── Logs state ────────────────────────────────────────────────────────────
  const [consoleLogs, setConsoleLogs] = useState<ConsoleLog[]>([]);
  const [lastReadLogsCount, setLastReadLogsCount] = useState(0);
  const [lastReadApisCount, setLastReadApisCount] = useState(0);

  useEffect(() => {
    if (visible) {
      if (activeTab === 'apis') {
        setLastReadApisCount(logs.length);
      }
      if (activeTab === 'logs') {
        setLastReadLogsCount(consoleLogs.length);
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

  // ─── WebView state ─────────────────────────────────────────────────────────
  const [webViewLogs, setWebViewLogs] = useState<WebViewLog[]>([]);
  const [webViewNavHistory, setWebViewNavHistory] = useState<WebViewNavState[]>(
    [],
  );
  const [webViewSubTab, setWebViewSubTab] = useState<
    'html' | 'navigation' | 'preview' | 'console'
  >('html');
  const [inspectedElement, setInspectedElement] = useState<{
    tagName: string;
    id?: string;
    className?: string;
    searchStr: string;
  } | null>(null);

  // ─── Settings state ──────────────────────────────────────────────────────────
  const [settingsPage, setSettingsPage] = useState<
    | 'main'
    | 'insights'
    | 'apis'
    | 'logs'
    | 'analytics'
    | 'webview'
    | 'redux'
    | null
  >(null);
  const [settingsActiveSubTab, setSettingsActiveSubTab] = useState<'module' | 'ui'>('module');
  const [insightsActiveSubTab, setInsightsActiveSubTab] = useState<'apis' | 'logs' | 'analytics' | 'webview' | 'redux'>('apis');
  const [tabVisibility, setTabVisibility] = useState<
    Record<ActiveTab, boolean>
  >({
    insights: false,
    apis: true,
    logs: true,
    analytics: true,
    webview: false,
    redux: false,
  });

  const [maxNetworkLogs, setMaxNetworkLogs] = useState<number>(100);
  const [webViewCaptureCssJs, setWebViewCaptureCssJs] = useState<boolean>(true);

  const [reduxAutoRefresh, setReduxAutoRefreshState] = useState<boolean>(true);
  const [reduxExpandDepth, setReduxExpandDepth] = useState<number>(1);
  const [slowRequestThreshold, setSlowRequestThreshold] =
    useState<number>(1000);
  const [insightsShowConsoleAlerts, setInsightsShowConsoleAlerts] =
    useState<boolean>(true);

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
      insights: false,
      apis: true,
      logs: true,
      analytics: true,
      webview: false,
      redux: false,
    });
    setDefaultTab('apis');
    setMaxNetworkLogs(100);
    setMaxConsoleLogs(200);
    setShowConsoleLevels({
      info: true,
      warn: true,
      error: true,
    });
    setWebViewCaptureCssJs(true);
    setReduxAutoRefreshState(true);
    setReduxExpandDepth(1);
    setSlowRequestThreshold(1000);
    setInsightsShowConsoleAlerts(true);
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
        }));
      if (saved.defaultTab) setDefaultTab(saved.defaultTab as ActiveTab);
      if (saved.maxNetworkLogs != null) setMaxNetworkLogs(saved.maxNetworkLogs);
      if (saved.maxConsoleLogs != null) setMaxConsoleLogs(saved.maxConsoleLogs);
      if (saved.showConsoleLevels)
        setShowConsoleLevels(saved.showConsoleLevels);
      if (saved.webViewCaptureCssJs != null)
        setWebViewCaptureCssJs(saved.webViewCaptureCssJs);
      if (saved.reduxAutoRefresh != null)
        setReduxAutoRefreshState(saved.reduxAutoRefresh);
      if (saved.reduxExpandDepth != null)
        setReduxExpandDepth(saved.reduxExpandDepth);
      if (saved.slowRequestThreshold != null)
        setSlowRequestThreshold(saved.slowRequestThreshold);
      if (saved.insightsShowConsoleAlerts != null)
        setInsightsShowConsoleAlerts(saved.insightsShowConsoleAlerts);
      if (saved.showDuplicateLogs != null)
        setShowDuplicateLogs(saved.showDuplicateLogs);
      if (saved.defaultTab) {
        const dt = saved.defaultTab as ActiveTab;
        const vis = {
          ...{
            insights: false,
            apis: true,
            logs: true,
            analytics: true,
            webview: false,
            redux: false,
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
      webViewCaptureCssJs,
      reduxAutoRefresh,
      reduxExpandDepth,
      slowRequestThreshold,
      insightsShowConsoleAlerts,
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
    webViewCaptureCssJs,
    reduxAutoRefresh,
    reduxExpandDepth,
    slowRequestThreshold,
    insightsShowConsoleAlerts,
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
      if (!nextVal && insightsActiveSubTab === key) {
        setInsightsActiveSubTab('apis');
      }
      return newVisibility;
    });
  };

  const switchActiveTab = useCallback((key: ActiveTab) => {
    setActiveTab(key);
  }, []);

  const navigateFromDashboard = (key: ActiveTab) => {
    animateNextLayout();
    setTabVisibility(prev => ({...prev, [key]: true}));
    setActiveTab(key);
  };

  const getSearchTermForTab = () => {
    if (!inspectedElement) return '';
    const {tagName, id, className, searchStr} = inspectedElement;
    if (htmlSubTab === 'html') {
      return searchStr;
    }
    if (htmlSubTab === 'css') {
      if (className) {
        const firstClass = className.trim().split(/\s+/)[0];
        if (firstClass) return `.${firstClass}`;
      }
      if (id) return `#${id}`;
      return tagName;
    }
    if (htmlSubTab === 'javascript') {
      if (id) return id;
      if (className) {
        const firstClass = className.trim().split(/\s+/)[0];
        if (firstClass) return firstClass;
      }
      return tagName;
    }
    return '';
  };

  const [webViewSearch, setWebViewSearch] = useState('');
  const [webViewHtml, setWebViewHtml] = useState('');
  const [webViewCss, setWebViewCss] = useState('');
  const [webViewJs, setWebViewJs] = useState('');
  const [webViewHtmlUrl, setWebViewHtmlUrl] = useState('');
  const [htmlSubTab, setHtmlSubTab] = useState<'html' | 'css' | 'javascript'>(
    'html',
  );
  const [isHtmlTabReady, setIsHtmlTabReady] = useState(true);

  useEffect(() => {
    setIsHtmlTabReady(false);
    const timer = setTimeout(() => {
      setIsHtmlTabReady(true);
    }, 120);
    return () => clearTimeout(timer);
  }, [htmlSubTab, webViewSubTab, activeTab]);

  const [selectedEvent, setSelectedEvent] = useState<AnalyticsEvent | null>(
    null,
  );
  const [analyticsSearch, setAnalyticsSearch] = useState('');
  const [hideScreenView, setHideScreenView] = useState(true);
  const [isAnalyticsLayoutReady, setIsAnalyticsLayoutReady] = useState(false);

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
  const badgeAnim = useRef(new Animated.Value(1)).current;
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
  const apisListRef = useRef<FlatList<any>>(null);

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

  useEffect(() => {
    if ((logs.length > 0 || analyticsEvents.length > 0) && newLogIds.size > 0) {
      badgeAnim.setValue(0.8);
      Animated.spring(badgeAnim, {
        toValue: 1,
        tension: 300,
        friction: 10,
        useNativeDriver: true,
      }).start();
    }
  }, [newLogIds]);

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

    let timeoutId: ReturnType<typeof setTimeout>;

    let isFirstNetworkCall = true;
    const unsubscribe = subscribeNetworkLogs((raw: NetworkLog[]) => {
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

    setWebViewLogs(getWebViewLogs());
    setWebViewNavHistory(getWebViewNavHistory());
    setWebViewHtml(getWebViewHtml());
    setWebViewCss(getWebViewCss());
    setWebViewJs(getWebViewJs());
    setWebViewHtmlUrl(getWebViewHtmlUrl());

    // ─── WebView subscription ────────────────────────────────────────────────
    let webViewTimeoutId: ReturnType<typeof setTimeout>;
    let isFirstWebViewCall = true;

    const unsubscribeWebView = subscribeWebView(() => {
      clearTimeout(webViewTimeoutId);
      const updateWebViewState = () => {
        setWebViewLogs(getWebViewLogs());
        setWebViewNavHistory(getWebViewNavHistory());
        setWebViewHtml(getWebViewHtml());
        setWebViewCss(getWebViewCss());
        setWebViewJs(getWebViewJs());
        setWebViewHtmlUrl(getWebViewHtmlUrl());
      };

      if (isFirstWebViewCall) {
        isFirstWebViewCall = false;
        updateWebViewState();
      } else {
        webViewTimeoutId = setTimeout(updateWebViewState, 200);
      }
    });

    const initialReduxState = getReduxState();
    setReduxState(initialReduxState && typeof initialReduxState === 'object' ? {...initialReduxState} : initialReduxState);
    setReduxActionHistory([...getActionHistory()]);
    setReduxLastActionMap({...getLastActionForReducer()});
    const unsubscribeRedux = subscribeReduxState(() => {
      // New references each time guarantee the Redux tab updates live, even when
      // the root state object reference is unchanged or auto-refresh is paused.
      const freshState = getReduxState();
      setReduxState(freshState && typeof freshState === 'object' ? {...freshState} : freshState);
      setReduxActionHistory([...getActionHistory()]);
      setReduxLastActionMap({...getLastActionForReducer()});
    });

    return () => {
      unsubscribe();
      clearTimeout(timeoutId);
      unsubscribeAnalytics();
      clearTimeout(analyticsTimeoutId);
      unsubscribeConsole();
      clearTimeout(consoleTimeoutId);
      unsubscribeWebView();
      clearTimeout(webViewTimeoutId);
      unsubscribeRedux();
    };
  }, []);

  useEffect(() => {
    if (activeTab !== 'analytics') {
      setIsAnalyticsLayoutReady(false);
    }
  }, [activeTab]);

  useEffect(() => {
    setReqExpanded(undefined);
    setResExpanded(undefined);
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

  const stats = useMemo(() => {
    const total = logs.length;
    const errors = filteredLogs.filter(
      l => (l.status != null && l.status >= 400) || l.status === 0,
    ).length;
    const durations = filteredLogs
      .filter(l => l.duration != null)
      .map(l => l.duration!);
    const avgDuration =
      durations.length > 0
        ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
        : null;

    const totalBytes = filteredLogs.reduce((acc, log) => {
      const resSize = log.response
        ? JSON.stringify(log.response)?.length || 0
        : 0;
      return acc + resSize;
    }, 0);
    const size =
      totalBytes < 1024
        ? `${totalBytes} B`
        : totalBytes < 1048576
        ? `${(totalBytes / 1024).toFixed(1)} KB`
        : `${(totalBytes / 1048576).toFixed(1)} MB`;

    const recentLogs = [...filteredLogs].slice(0, 10).reverse();
    const durationTrend = recentLogs.map(l => l.duration || 0);
    const sizeTrend = recentLogs.map(
      l => JSON.stringify(l.response)?.length || 0,
    );
    const errorTrend = recentLogs.map(l =>
      l.status === 0 || (l.status && l.status >= 400) ? 1 : 0,
    );
    const reqTrend = recentLogs.map(() => Math.random() * 5 + 5);

    return {
      total,
      errors,
      avgDuration,
      filtered: filteredLogs.length,
      size,
      durationTrend,
      sizeTrend,
      errorTrend,
      reqTrend,
    };
  }, [logs, filteredLogs]);

  const hasErrors = useMemo(
    () =>
      logs.some(l => (l.status != null && l.status >= 400) || l.status === 0),
    [logs],
  );

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
    if (hideScreenView) {
      events = events.filter(e => e.name !== 'screen_view');
    }

    if (analyticsSearch) {
      const s = analyticsSearch.toLowerCase();
      events = events.filter(
        e =>
          e.name.toLowerCase().includes(s) ||
          JSON.stringify(e.params).toLowerCase().includes(s) ||
          (e.pageTitle ?? '').toLowerCase().includes(s),
      );
    }

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

    return deduplicatedEvents;
  }, [analyticsEvents, analyticsSearch, hideScreenView]);

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

  const filteredWebViewLogs = useMemo(() => {
    let result = webViewLogs;
    if (webViewSearch) {
      const s = webViewSearch.toLowerCase();
      result = result.filter(log => log.message.toLowerCase().includes(s));
    }
    return result;
  }, [webViewLogs, webViewSearch]);

  const filteredNavHistory = useMemo(() => {
    let result = webViewNavHistory;
    if (webViewSearch) {
      const s = webViewSearch.toLowerCase();
      result = result.filter(
        nav =>
          nav.url.toLowerCase().includes(s) ||
          (nav.title ?? '').toLowerCase().includes(s),
      );
    }
    return result;
  }, [webViewNavHistory, webViewSearch]);

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
    // Also clear webview logs/nav history
    clearWebViewData();
    setWebViewLogs([]);
    setWebViewNavHistory([]);
    setWebViewHtml('');
    setWebViewCss('');
    setWebViewJs('');
    setWebViewHtmlUrl('');
  }

  function handleDelete() {
    if (activeTab === 'webview') {
      Alert.alert(
        'Clear WebView Data',
        'Are you sure you want to clear all WebView logs and navigation history?',
        [
          {text: 'Cancel', style: 'cancel'},
          {
            text: 'Clear All',
            onPress: () => {
              clearWebViewData();
              setWebViewLogs([]);
              setWebViewNavHistory([]);
              setWebViewHtml('');
              setWebViewCss('');
              setWebViewJs('');
              setWebViewHtmlUrl('');
            },
            style: 'destructive',
          },
        ],
      );
      return;
    }
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
              setReduxActionHistory([]);
              setReduxLastActionMap({});
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

  const renderItem = useCallback(
    ({item, index}: {item: GroupedListItem; index: number}) => {
      if (item.type === 'header') {
        return (
          <AnimatedEntrance index={index} distance={8}>
            <DomainHeader
              pageName={item.pageName}
              color={item.color}
              stats={item.stats}
              activeFilters={item.activeFilters}
              onToggleFilter={toggleSectionFilter}
              isCollapsed={item.isCollapsed}
              onToggleCollapse={toggleSectionCollapse}
              isFirst={item.isFirst}
              timestamp={item.timestamp}
            />
          </AnimatedEntrance>
        );
      }

      const {log, isLast, color} = item;
      return (
        <AnimatedEntrance index={index} distance={8} style={styles.treeNodeRow}>
          <View style={styles.treeLines}>
            <View
              style={[
                styles.modernTreeLine,
                {borderColor: color},
                isLast && styles.modernTreeLineLast,
              ]}
            />
            {!isLast && (
              <View style={[styles.modernTreeBranch, {borderColor: color}]} />
            )}
          </View>
          <View style={styles.treeCardWrapper}>
            <LogCard
              item={log}
              isSelected={selectedLogs.has(log.id)}
              onToggleSelect={toggleSelect}
              onPress={() => {
                animateNextLayout();
                setSelected(log);
              }}
              timelineMinStart={minStart}
              timelineTotalRange={totalRange}
              isNew={newLogIds.has(log.id)}
              searchStr={search}
            />
          </View>
        </AnimatedEntrance>
      );
    },
    [
      minStart,
      totalRange,
      newLogIds,
      selectedLogs,
      toggleSelect,
      search,
      toggleSectionFilter,
      toggleSectionCollapse,
    ],
  );

  const renderSettings = () => {
    if (settingsPage === 'main') {
      const settingsTabs = [
        {key: 'insights', label: 'Insights', icon: 'insights'},
        {key: 'apis', label: 'APIs', icon: 'apis'},
        {key: 'logs', label: 'Logs', icon: 'logs'},
        {key: 'analytics', label: 'Analytics', icon: 'analytics'},
        {key: 'webview', label: 'WebView', icon: 'webview'},
        {key: 'redux', label: 'Redux', icon: 'redux'},
      ] as const;

      return (
        <View style={{flex: 1, backgroundColor: AppColors.grayBackground}}>
          {/* Settings Header with back button */}
          <LinearGradient
            colors={[AppColors.purple, '#6B4EFF']}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 0}}
            style={styles.headerGradient}>
            <View style={{paddingTop: headerTopPadding, width: '100%'}}>
              <View style={[styles.header, {paddingHorizontal: 16, gap: 12}]}>
              <TouchableScale
                onPress={() => {
                  animateNextLayout();
                  setSettingsPage(null);
                  switchActiveTab('apis');
                }}
                hitSlop={12}
                style={{
                  padding: 8,
                  borderRadius: 10,
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  borderWidth: 1,
                  borderColor: 'rgba(255, 255, 255, 0.08)',
                }}>
                <WhiteBackNavigation color="#FFFFFF" size={16} />
              </TouchableScale>
              <View style={{flex: 1}}>
                <Text
                  style={{
                    fontFamily: AppFonts.interBold,
                    fontSize: 17,
                    color: '#FFFFFF',
                  }}>
                  Settings
                </Text>
                <Text
                  style={{
                    fontFamily: AppFonts.interRegular,
                    fontSize: 11,
                    color: 'rgba(255,255,255,0.75)',
                    marginTop: 1,
                  }}>
                  Manage modules and preferences
                </Text>
              </View>
              <View
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: 'rgba(255, 255, 255, 0.1)',
                }}>
                <Text
                  style={{
                    fontFamily: AppFonts.interBold,
                    fontSize: 10.5,
                    color: '#FFFFFF',
                  }}>
                  v{LIB_VERSION}
                </Text>
              </View>
            </View>
          </View>
        </LinearGradient>

          <ScrollView
            style={{flex: 1}}
            contentContainerStyle={{padding: 16, gap: 12}}>
            {/* Sub Tabs */}
            <View
              style={{
                flexDirection: 'row',
                backgroundColor: AppColors.primaryLight,
                borderRadius: 10,
                padding: 3,
                borderWidth: 1,
                borderColor: AppColors.grayBorderSecondary,
                marginBottom: 4,
              }}>
              <TouchableOpacity
                onPress={() => {
                  animateNextLayout();
                  setSettingsActiveSubTab('module');
                }}
                style={{
                  flex: 1,
                  paddingVertical: 8,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 8,
                  backgroundColor:
                    settingsActiveSubTab === 'module'
                      ? AppColors.purple
                      : 'transparent',
                }}>
                <Text
                  style={{
                    fontFamily: AppFonts.interBold,
                    fontSize: 12,
                    color:
                      settingsActiveSubTab === 'module'
                        ? '#FFFFFF'
                        : AppColors.grayText,
                  }}>
                  Module
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  animateNextLayout();
                  setSettingsActiveSubTab('ui');
                }}
                style={{
                  flex: 1,
                  paddingVertical: 8,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 8,
                  backgroundColor:
                    settingsActiveSubTab === 'ui'
                      ? AppColors.purple
                      : 'transparent',
                }}>
                <Text
                  style={{
                    fontFamily: AppFonts.interBold,
                    fontSize: 12,
                    color:
                      settingsActiveSubTab === 'ui'
                        ? '#FFFFFF'
                        : AppColors.grayText,
                  }}>
                  UI Preferences
                </Text>
              </TouchableOpacity>
            </View>

            {settingsActiveSubTab === 'module' ? (
              /* Tab list */
              <View
                style={{
                  backgroundColor: AppColors.primaryLight,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: AppColors.grayBorderSecondary,
                  overflow: 'hidden',
                }}>
                {/* Table Header */}
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 8,
                    paddingHorizontal: 14,
                    backgroundColor: AppColors.grayBackground,
                    borderBottomWidth: 1,
                    borderBottomColor: AppColors.dividerColor,
                    gap: 12,
                  }}>
                  <Text
                    style={{
                      fontFamily: AppFonts.interBold,
                      fontSize: 10,
                      color: AppColors.grayTextWeak,
                      letterSpacing: 0.6,
                      flex: 1,
                    }}>
                    MODULE
                  </Text>
                  <Text
                    style={{
                      fontFamily: AppFonts.interBold,
                      fontSize: 10,
                      color: AppColors.grayTextWeak,
                      letterSpacing: 0.6,
                      width: 90,
                      textAlign: 'right',
                      paddingRight: 4,
                    }}>
                    VISIBILITY
                  </Text>
                </View>

                {settingsTabs.map((tab, idx) => {
                  const isVisible = tab.key === 'apis' || tabVisibility?.[tab.key];
                  const isLast = idx === settingsTabs.length - 1;
                  const isLocked = tab.key === 'apis';

                  return (
                    <View
                      key={tab.key}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingVertical: 10,
                        paddingHorizontal: 14,
                        borderBottomWidth: isLast ? 0 : 1,
                        borderBottomColor: AppColors.dividerColor,
                        gap: 12,
                      }}>
                      {/* Icon + Label — fills remaining space */}
                      <View
                        style={{
                          flex: 1,
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 8,
                        }}>
                        {/* Small icon tile */}
                        <View
                          style={{
                            width: 20,
                            height: 20,
                            borderRadius: 6,
                            backgroundColor: isLocked
                              ? AppColors.grayBorderSecondary
                              : AppColors.purpleShade50,
                            borderWidth: 1,
                            borderColor: isLocked
                              ? AppColors.dividerColor
                              : 'rgba(104,75,155,0.2)',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}>
                          {tab.icon === 'insights' && (
                            <InsightsIcon
                              color={
                                isLocked
                                  ? AppColors.grayTextWeak
                                  : AppColors.purple
                              }
                              size={11}
                            />
                          )}
                          {tab.icon === 'apis' && (
                            <SignalIcon
                              color={
                                isLocked
                                  ? AppColors.grayTextWeak
                                  : AppColors.purple
                              }
                              size={11}
                            />
                          )}
                          {tab.icon === 'logs' && (
                            <TerminalIcon
                              color={
                                isLocked
                                  ? AppColors.grayTextWeak
                                  : AppColors.purple
                              }
                              size={11}
                            />
                          )}
                          {tab.icon === 'analytics' && (
                            <AnalyticsIcon
                              color={
                                isLocked
                                  ? AppColors.grayTextWeak
                                  : AppColors.purple
                              }
                              size={11}
                            />
                          )}
                          {tab.icon === 'webview' && (
                            <GlobeIcon
                              color={
                                isLocked
                                  ? AppColors.grayTextWeak
                                  : AppColors.purple
                              }
                              size={11}
                            />
                          )}
                          {tab.icon === 'redux' && (
                            <TerminalIcon
                              color={
                                isLocked
                                  ? AppColors.grayTextWeak
                                  : AppColors.purple
                              }
                              size={11}
                            />
                          )}
                        </View>
                        {/* Label + Required badge */}
                        <Text
                          style={{
                            fontFamily: AppFonts.interBold,
                            fontSize: 13,
                            color: isLocked
                              ? AppColors.grayText
                              : AppColors.primaryBlack,
                          }}>
                          {tab.label}
                        </Text>
                        {/* #6 — badge marks the configured default tab */}
                        {tab.key === defaultTab && (
                          <View
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              backgroundColor: 'rgba(104,75,155,0.08)',
                              borderRadius: 20,
                              paddingHorizontal: 6,
                              paddingVertical: 2,
                              borderWidth: 1,
                              borderColor: 'rgba(104,75,155,0.18)',
                              gap: 3,
                            }}>
                            <View
                              style={{
                                width: 4,
                                height: 4,
                                borderRadius: 2,
                                backgroundColor: AppColors.purple,
                                opacity: 0.7,
                              }}
                            />
                            <Text
                              style={{
                                fontFamily: AppFonts.interBold,
                                fontSize: 8.5,
                                color: AppColors.purple,
                                letterSpacing: 0.4,
                              }}>
                              DEFAULT
                            </Text>
                          </View>
                        )}

                        {/* Settings gear icon next to label */}
                        <TouchableScale
                          onPress={() => {
                            animateNextLayout();
                            setSettingsPage(tab.key);
                          }}
                          hitSlop={8}
                          style={{
                            marginLeft: 4,
                            padding: 4,
                            borderRadius: 6,
                            backgroundColor: AppColors.purpleShade50,
                            borderWidth: 1,
                            borderColor: 'rgba(104,75,155,0.15)',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}>
                          <SettingsIcon color={AppColors.purple} size={10} />
                        </TouchableScale>
                      </View>

                      {/* Visibility Switch in VISIBILITY column */}
                      <View
                        style={{
                          width: 90,
                          alignItems: 'flex-end',
                          justifyContent: 'center',
                        }}>
                        <TouchableScale
                          disabled={isLocked}
                          onPress={() => toggleTabVisibility(tab.key as any)}
                          style={{
                            width: 38,
                            height: 22,
                            borderRadius: 11,
                            backgroundColor: isLocked
                              ? AppColors.grayBackground
                              : isVisible
                              ? AppColors.purple
                              : AppColors.grayBorderSecondary,
                            borderWidth: isLocked ? 1.5 : 0,
                            borderColor: isLocked
                              ? AppColors.grayBorderSecondary
                              : 'transparent',
                            borderStyle: isLocked ? 'dashed' : 'solid',
                            padding: 2,
                            justifyContent: 'center',
                            alignItems: isVisible ? 'flex-end' : 'flex-start',
                            opacity: isLocked ? 0.9 : 1,
                          }}>
                          <View
                            style={{
                              width: 18,
                              height: 18,
                              borderRadius: 9,
                              backgroundColor: isLocked
                                ? AppColors.grayBorderSecondary
                                : '#FFFFFF',
                              alignItems: 'center',
                              justifyContent: 'center',
                              shadowColor: '#000',
                              shadowOpacity: isLocked ? 0 : 0.15,
                              shadowRadius: 1.5,
                              shadowOffset: {width: 0, height: 1},
                            }}>
                            {isLocked && (
                              <Svg
                                width={10}
                                height={10}
                                viewBox="0 0 24 24"
                                fill="none">
                                <Path
                                  d="M7 10V7a5 5 0 0 1 10 0v3"
                                  stroke={AppColors.grayText}
                                  strokeWidth="2.2"
                                  strokeLinecap="round"
                                />
                                <Path
                                  d="M5 10h14v9a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1z"
                                  fill={AppColors.grayText}
                                />
                              </Svg>
                            )}
                          </View>
                        </TouchableScale>
                        {isLocked && (
                          <Text
                            style={{
                              fontFamily: AppFonts.interBold,
                              fontSize: 8,
                              color: AppColors.grayTextWeak,
                              letterSpacing: 0.4,
                              marginTop: 3,
                            }}>
                            REQUIRED
                          </Text>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            ) : (
              /* UI Preferences Section */
              <View
                style={{
                  backgroundColor: AppColors.primaryLight,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: AppColors.grayBorderSecondary,
                  overflow: 'hidden',
                }}>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 12,
                    paddingHorizontal: 14,
                    gap: 12,
                  }}>
                  {/* Icon + Label */}
                  <View
                    style={{
                      flex: 1,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 8,
                    }}>
                    <View
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: 6,
                        backgroundColor: AppColors.purpleShade50,
                        borderWidth: 1,
                        borderColor: 'rgba(104,75,155,0.2)',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                      {isDark ? (
                        <SunIcon color={AppColors.purple} size={11} />
                      ) : (
                        <MoonIcon color={AppColors.purple} size={11} />
                      )}
                    </View>
                    <View style={{flex: 1}}>
                      <Text
                        style={{
                          fontFamily: AppFonts.interBold,
                          fontSize: 13,
                          color: AppColors.primaryBlack,
                        }}>
                        Dark Theme
                      </Text>
                    </View>
                  </View>

                  {/* Toggle Switch */}
                  <TouchableScale
                    onPress={() => {
                      const newTheme = !isDark;
                      setIsDark(newTheme);
                      toggleGlobalTheme(newTheme);
                    }}
                    style={{
                      width: 38,
                      height: 22,
                      borderRadius: 11,
                      backgroundColor: isDark
                        ? AppColors.purple
                        : AppColors.grayBorderSecondary,
                      padding: 2,
                      justifyContent: 'center',
                      alignItems: isDark ? 'flex-end' : 'flex-start',
                    }}>
                    <View
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: 9,
                        backgroundColor: '#FFFFFF',
                        shadowColor: '#000',
                        shadowOpacity: 0.15,
                        shadowRadius: 1.5,
                        shadowOffset: {width: 0, height: 1},
                      }}
                    />
                  </TouchableScale>
                </View>

                {/* Divider */}
                <View
                  style={{
                    height: 1,
                    backgroundColor: AppColors.dividerColor,
                  }}
                />

                {/* Modal Height */}
                <View
                  style={{
                    paddingVertical: 12,
                    paddingHorizontal: 14,
                  }}>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 8,
                    }}>
                    <View
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: 6,
                        backgroundColor: AppColors.purpleShade50,
                        borderWidth: 1,
                        borderColor: 'rgba(104,75,155,0.2)',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                      <ScreenIcon color={AppColors.purple} size={11} />
                    </View>
                    <View style={{flex: 1}}>
                      <Text
                        style={{
                          fontFamily: AppFonts.interBold,
                          fontSize: 13,
                          color: AppColors.primaryBlack,
                        }}>
                        Modal Height
                      </Text>
                      <Text
                        style={{
                          fontFamily: AppFonts.interRegular,
                          fontSize: 11,
                          color: AppColors.grayText,
                          marginTop: 1,
                        }}>
                        Height of the inspector panel relative to the screen
                      </Text>
                    </View>
                  </View>

                  {/* Segmented picker */}
                  <View
                    style={{
                      flexDirection: 'row',
                      backgroundColor: AppColors.grayBackground,
                      borderRadius: 8,
                      padding: 2.5,
                      marginTop: 10,
                      borderWidth: 1,
                      borderColor: AppColors.dividerColor,
                    }}>
                    {[50, 70, 90, 100].map(opt => {
                      const isActive = modalHeightPercent === opt;
                      return (
                        <TouchableScale
                          key={opt}
                          onPress={() => setModalHeightPercent(opt)}
                          style={{
                            flex: 1,
                            paddingVertical: 6,
                            alignItems: 'center',
                            borderRadius: 6,
                            backgroundColor: isActive
                              ? AppColors.purple
                              : 'transparent',
                          }}>
                          <Text
                            style={{
                              fontFamily: AppFonts.interBold,
                              fontSize: 11,
                              color: isActive ? '#FFFFFF' : AppColors.grayText,
                            }}>
                            {opt}%
                          </Text>
                        </TouchableScale>
                      );
                    })}
                  </View>
                </View>

                {/* Divider */}
                <View
                  style={{
                    height: 1,
                    backgroundColor: AppColors.dividerColor,
                  }}
                />

                {/* Modal Animation */}
                <View
                  style={{
                    paddingVertical: 12,
                    paddingHorizontal: 14,
                  }}>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 8,
                    }}>
                    <View
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: 6,
                        backgroundColor: AppColors.purpleShade50,
                        borderWidth: 1,
                        borderColor: 'rgba(104,75,155,0.2)',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                      <MotionIcon color={AppColors.purple} size={11} />
                    </View>
                    <View style={{flex: 1}}>
                      <Text
                        style={{
                          fontFamily: AppFonts.interBold,
                          fontSize: 13,
                          color: AppColors.primaryBlack,
                        }}>
                        Modal Animation
                      </Text>
                      <Text
                        style={{
                          fontFamily: AppFonts.interRegular,
                          fontSize: 11,
                          color: AppColors.grayText,
                          marginTop: 1,
                        }}>
                        How the inspector panel enters and exits the screen
                      </Text>
                    </View>
                  </View>

                  {/* Segmented picker */}
                  <View
                    style={{
                      flexDirection: 'row',
                      backgroundColor: AppColors.grayBackground,
                      borderRadius: 8,
                      padding: 2.5,
                      marginTop: 10,
                      borderWidth: 1,
                      borderColor: AppColors.dividerColor,
                    }}>
                    {([
                      {key: 'slide' as const, label: 'Slide Up'},
                      {key: 'fade' as const, label: 'Fade'},
                      {key: 'none' as const, label: 'None'},
                    ]).map(opt => {
                      const isActive = modalAnimationType === opt.key;
                      return (
                        <TouchableScale
                          key={opt.key}
                          onPress={() => setModalAnimationType(opt.key)}
                          style={{
                            flex: 1,
                            paddingVertical: 6,
                            alignItems: 'center',
                            borderRadius: 6,
                            backgroundColor: isActive
                              ? AppColors.purple
                              : 'transparent',
                          }}>
                          <Text
                            style={{
                              fontFamily: AppFonts.interBold,
                              fontSize: 11,
                              color: isActive ? '#FFFFFF' : AppColors.grayText,
                            }}>
                            {opt.label}
                          </Text>
                        </TouchableScale>
                      );
                    })}
                  </View>
                </View>

                {/* Divider */}
                <View
                  style={{
                    height: 1,
                    backgroundColor: AppColors.dividerColor,
                  }}
                />

                {/* #6 — Default Tab */}
                <View
                  style={{
                    paddingVertical: 12,
                    paddingHorizontal: 14,
                  }}>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 8,
                    }}>
                    <View
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: 6,
                        backgroundColor: AppColors.purpleShade50,
                        borderWidth: 1,
                        borderColor: 'rgba(104,75,155,0.2)',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                      <LayersIcon color={AppColors.purple} size={11} />
                    </View>
                    <View style={{flex: 1}}>
                      <Text
                        style={{
                          fontFamily: AppFonts.interBold,
                          fontSize: 13,
                          color: AppColors.primaryBlack,
                        }}>
                        Default Tab
                      </Text>
                      <Text
                        style={{
                          fontFamily: AppFonts.interRegular,
                          fontSize: 11,
                          color: AppColors.grayText,
                          marginTop: 1,
                        }}>
                        Tab shown when the inspector opens
                      </Text>
                    </View>
                  </View>

                  {/* Grid of Default Tab Cards */}
                  <View
                    style={{
                      flexDirection: 'row',
                      flexWrap: 'wrap',
                      gap: 8,
                      marginTop: 12,
                    }}>
                    {settingsTabs
                      .filter(
                        tab => tab.key === 'apis' || tabVisibility?.[tab.key],
                      )
                      .map(tab => {
                        const isActive = defaultTab === tab.key;
                        return (
                          <TouchableScale
                            key={tab.key}
                            onPress={() => setDefaultTab(tab.key)}
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              gap: 8,
                              paddingVertical: 10,
                              paddingHorizontal: 12,
                              borderRadius: 10,
                              borderWidth: 1.5,
                              borderColor: isActive ? AppColors.purple : AppColors.grayBorderSecondary,
                              backgroundColor: isActive ? 'rgba(104,75,155,0.06)' : AppColors.primaryLight,
                              minWidth: '47%',
                              flex: 1,
                            }}>
                            <View
                              style={{
                                width: 22,
                                height: 22,
                                borderRadius: 6,
                                backgroundColor: isActive ? AppColors.purple : AppColors.purpleShade50,
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}>
                              {tab.icon === 'insights' && (
                                <InsightsIcon color={isActive ? '#FFFFFF' : AppColors.purple} size={11} />
                              )}
                              {tab.icon === 'apis' && (
                                <SignalIcon color={isActive ? '#FFFFFF' : AppColors.purple} size={11} />
                              )}
                              {tab.icon === 'logs' && (
                                <TerminalIcon color={isActive ? '#FFFFFF' : AppColors.purple} size={11} />
                              )}
                              {tab.icon === 'analytics' && (
                                <AnalyticsIcon color={isActive ? '#FFFFFF' : AppColors.purple} size={11} />
                              )}
                              {tab.icon === 'webview' && (
                                <GlobeIcon color={isActive ? '#FFFFFF' : AppColors.purple} size={11} />
                              )}
                              {tab.icon === 'redux' && (
                                <TerminalIcon color={isActive ? '#FFFFFF' : AppColors.purple} size={11} />
                              )}
                            </View>
                            <Text
                              style={{
                                fontFamily: AppFonts.interBold,
                                fontSize: 13,
                                color: isActive ? AppColors.purple : AppColors.primaryBlack,
                                flex: 1,
                              }}>
                                {tab.label}
                            </Text>
                            {isActive && (
                              <View
                                style={{
                                  width: 14,
                                  height: 14,
                                  borderRadius: 7,
                                  backgroundColor: AppColors.purple,
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}>
                                <CheckIcon size={8} color="#FFFFFF" />
                              </View>
                            )}
                          </TouchableScale>
                        );
                      })}
                  </View>
                </View>

                {/* Divider */}
                <View
                  style={{
                    height: 1,
                    backgroundColor: AppColors.dividerColor,
                  }}
                />

                {/* #9 — Show Duplicate Logs */}
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 12,
                    paddingHorizontal: 14,
                    gap: 12,
                  }}>
                  <View
                    style={{
                      flex: 1,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 8,
                    }}>
                    <View
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: 6,
                        backgroundColor: AppColors.purpleShade50,
                        borderWidth: 1,
                        borderColor: 'rgba(104,75,155,0.2)',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                      <EyeIcon color={AppColors.purple} size={11} />
                    </View>
                    <View style={{flex: 1}}>
                      <Text
                        style={{
                          fontFamily: AppFonts.interBold,
                          fontSize: 13,
                          color: AppColors.primaryBlack,
                        }}>
                        Show Duplicate Logs
                      </Text>
                      <Text
                        style={{
                          fontFamily: AppFonts.interRegular,
                          fontSize: 11,
                          color: AppColors.grayText,
                          marginTop: 1,
                        }}>
                        Off: repeated identical entries collapse into one row
                        with a ×N count
                      </Text>
                    </View>
                  </View>

                  {/* Toggle Switch */}
                  <TouchableScale
                    onPress={() => setShowDuplicateLogs(prev => !prev)}
                    style={{
                      width: 38,
                      height: 22,
                      borderRadius: 11,
                      backgroundColor: showDuplicateLogs
                        ? AppColors.purple
                        : AppColors.grayBorderSecondary,
                      padding: 2,
                      justifyContent: 'center',
                      alignItems: showDuplicateLogs ? 'flex-end' : 'flex-start',
                    }}>
                    <View
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: 9,
                        backgroundColor: '#FFFFFF',
                        shadowColor: '#000',
                        shadowOpacity: 0.15,
                        shadowRadius: 1.5,
                        shadowOffset: {width: 0, height: 1},
                      }}
                    />
                  </TouchableScale>
                </View>

                {/* Divider */}
                <View
                  style={{
                    height: 1,
                    backgroundColor: AppColors.dividerColor,
                  }}
                />

                {/* Logs Console Levels */}
                <View
                  style={{
                    paddingVertical: 12,
                    paddingHorizontal: 14,
                  }}>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 8,
                    }}>
                    <View
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: 6,
                        backgroundColor: AppColors.purpleShade50,
                        borderWidth: 1,
                        borderColor: 'rgba(104,75,155,0.2)',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                      <TerminalIcon color={AppColors.purple} size={11} />
                    </View>
                    <View style={{flex: 1}}>
                      <Text
                        style={{
                          fontFamily: AppFonts.interBold,
                          fontSize: 13,
                          color: AppColors.primaryBlack,
                        }}>
                        Logs Console Levels
                      </Text>
                      <Text
                        style={{
                          fontFamily: AppFonts.interRegular,
                          fontSize: 11,
                          color: AppColors.grayText,
                          marginTop: 1,
                        }}>
                        Toggle which log levels are visible in the Logs tab
                      </Text>
                    </View>
                  </View>

                  <View
                    style={{
                      flexDirection: 'row',
                      gap: 8,
                      marginTop: 10,
                    }}>
                    {([
                      {key: 'info' as const, label: 'Info', color: '#3B82F6'},
                      {key: 'warn' as const, label: 'Warning', color: '#F59E0B'},
                      {key: 'error' as const, label: 'Error', color: '#EF4444'},
                    ]).map(level => {
                      const isActive = showConsoleLevels[level.key];
                      return (
                        <TouchableScale
                          key={level.key}
                          onPress={() =>
                            setShowConsoleLevels(prev => ({
                              ...prev,
                              [level.key]: !prev[level.key],
                            }))
                          }
                          style={{
                            flex: 1,
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 6,
                            paddingVertical: 8,
                            borderRadius: 8,
                            borderWidth: 1.5,
                            borderColor: isActive ? level.color : AppColors.grayBorderSecondary,
                            backgroundColor: isActive ? `${level.color}0D` : AppColors.primaryLight,
                          }}>
                          <View
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: 4,
                              backgroundColor: isActive ? level.color : AppColors.grayBorderSecondary,
                            }}
                          />
                          <Text
                            style={{
                              fontFamily: AppFonts.interBold,
                              fontSize: 11,
                              color: isActive ? level.color : AppColors.grayText,
                            }}>
                            {level.label}
                          </Text>
                        </TouchableScale>
                      );
                    })}
                  </View>
                </View>

                {/* Divider */}
                <View
                  style={{
                    height: 1,
                    backgroundColor: AppColors.dividerColor,
                  }}
                />

                {/* Reset Settings */}
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 12,
                    paddingHorizontal: 14,
                    gap: 12,
                  }}>
                  <View
                    style={{
                      flex: 1,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 8,
                    }}>
                    <View
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: 6,
                        backgroundColor: 'rgba(239,68,68,0.08)',
                        borderWidth: 1,
                        borderColor: 'rgba(239,68,68,0.2)',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                      <TrashIcon color={AppColors.errorColor} size={11} />
                    </View>
                    <View style={{flex: 1}}>
                      <Text
                        style={{
                          fontFamily: AppFonts.interBold,
                          fontSize: 13,
                          color: AppColors.primaryBlack,
                        }}>
                        Reset Settings
                      </Text>
                      <Text
                        style={{
                          fontFamily: AppFonts.interRegular,
                          fontSize: 11,
                          color: AppColors.grayText,
                          marginTop: 1,
                        }}>
                        Wipe custom configurations and load package defaults
                      </Text>
                    </View>
                  </View>

                  <TouchableScale
                    onPress={resetToDefaults}
                    style={{
                      paddingHorizontal: 10,
                      paddingVertical: 5,
                      borderRadius: 7,
                      backgroundColor: 'rgba(255,46,87,0.08)',
                      borderWidth: 1,
                      borderColor: 'rgba(255,46,87,0.2)',
                    }}>
                    <Text
                      style={{
                        fontFamily: AppFonts.interBold,
                        fontSize: 11,
                        color: AppColors.errorColor,
                      }}>
                      Reset
                    </Text>
                  </TouchableScale>
                </View>
              </View>
            )}


            {/* Storage Status */}
            <View
              style={{
                backgroundColor: isPersistentStorageAvailable()
                  ? 'rgba(74,222,128,0.08)'
                  : 'rgba(234,179,8,0.08)',
                borderRadius: 12,
                borderWidth: 1,
                borderColor: isPersistentStorageAvailable()
                  ? 'rgba(74,222,128,0.2)'
                  : 'rgba(234,179,8,0.2)',
                padding: 12,
                marginTop: 16,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
              }}>
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: isPersistentStorageAvailable() ? '#22C55E' : '#EAB308',
                }}
              />
              <View style={{flex: 1}}>
                <Text
                  style={{
                    fontFamily: AppFonts.interBold,
                    fontSize: 12,
                    color: isPersistentStorageAvailable() ? '#15803D' : '#854D0E',
                  }}>
                  {isPersistentStorageAvailable()
                    ? `Storage: Persistent (${storage ? 'Custom' : 'iOS Settings'})`
                    : 'Storage: Temporary (In-Memory)'}
                </Text>
                <Text
                  style={{
                    fontFamily: AppFonts.interRegular,
                    fontSize: 10.5,
                    color: isPersistentStorageAvailable() ? '#166534' : '#854D0E',
                    marginTop: 2,
                    opacity: 0.8,
                  }}>
                  {isPersistentStorageAvailable()
                    ? 'Your settings are saved across app restarts.'
                    : 'Settings reset when closed. To persist settings, pass a storage object to <NetworkInspector storage={...} />.'}
                </Text>
              </View>
            </View>
          </ScrollView>
        </View>
      );
    }

    const goBackToMain = () => {
      animateNextLayout();
      setSettingsPage('main');
    };

    // Helper: settings row with icon + label + optional description
    const renderSettingRow = (opts: {
      icon: React.ReactNode;
      label: string;
      description?: string;
      right?: React.ReactNode;
      picker?: {
        options: readonly any[];
        selectedValue: any;
        onSelect: (val: any) => void;
        formatLabel?: (val: any) => string;
      };
      onPress?: () => void;
      isLast?: boolean;
    }) => (
      <View
        style={{
          paddingVertical: 12,
          borderBottomWidth: opts.isLast ? 0 : 1,
          borderBottomColor: AppColors.dividerColor,
        }}>
        <TouchableScale
          disabled={!opts.onPress}
          onPress={opts.onPress}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
          }}>
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              backgroundColor: AppColors.purpleShade50,
              borderWidth: 1,
              borderColor: 'rgba(104,75,155,0.18)',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            {opts.icon}
          </View>
          <View style={{flex: 1}}>
            <Text
              style={{
                fontFamily: AppFonts.interBold,
                fontSize: 14,
                color: AppColors.primaryBlack,
              }}>
              {opts.label}
            </Text>
            {opts.description ? (
              <Text
                style={{
                  fontFamily: AppFonts.interRegular,
                  fontSize: 11,
                  color: AppColors.grayText,
                  marginTop: 1,
                }}>
                {opts.description}
              </Text>
            ) : null}
          </View>
          {opts.right || null}
        </TouchableScale>
        {opts.picker && (
          <View
            style={{
              flexDirection: 'row',
              backgroundColor: AppColors.grayBackground,
              borderRadius: 8,
              padding: 2.5,
              marginTop: 10,
              borderWidth: 1,
              borderColor: AppColors.dividerColor,
            }}>
            {opts.picker.options.map(opt => {
              const isActive = opts.picker!.selectedValue === opt;
              return (
                <TouchableScale
                  key={String(opt)}
                  onPress={() => opts.picker!.onSelect(opt)}
                  style={{
                    flex: 1,
                    paddingVertical: 6,
                    alignItems: 'center',
                    borderRadius: 6,
                    backgroundColor: isActive
                      ? AppColors.purple
                      : 'transparent',
                  }}>
                  <Text
                    style={{
                      fontFamily: AppFonts.interBold,
                      fontSize: 11,
                      color: isActive ? '#FFFFFF' : AppColors.grayText,
                    }}>
                    {opts.picker!.formatLabel
                      ? opts.picker!.formatLabel(opt)
                      : typeof opt === 'number' &&
                        opt >= 500 &&
                        settingsPage === 'insights'
                      ? `${opt}ms`
                      : opt}
                  </Text>
                </TouchableScale>
              );
            })}
          </View>
        )}
      </View>
    );

    let content: React.ReactNode = null;
    let title = '';
    let icon: React.ReactNode = null;
    let rightInfo = '';

    if (settingsPage === 'apis') {
      title = 'APIs Settings';
      icon = <SignalIcon color="#FFFFFF" size={16} />;
      rightInfo = `Total: ${logs.length}`;
      content = (
        <ScrollView
          style={{flex: 1}}
          contentContainerStyle={{padding: 16}}>
          <View
            style={{
              backgroundColor: AppColors.primaryLight,
              padding: 16,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: AppColors.grayBorderSecondary,
              gap: 4,
            }}>
            {renderSettingRow({
              icon: <SignalIcon color={AppColors.purple} size={16} />,
              label: 'Max Request Logs',
              description: 'How many network requests to keep in memory',
              picker: {
                options: [50, 100, 200, 500] as const,
                selectedValue: maxNetworkLogs,
                onSelect: setMaxNetworkLogs,
              },
              isLast: true,
            })}
          </View>

          <View
            style={{
              backgroundColor: AppColors.primaryLight,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: AppColors.grayBorderSecondary,
              padding: 16,
              marginTop: 12,
            }}>
            {renderSettingRow({
              icon: <TrashIcon color={AppColors.errorColor} size={16} />,
              label: 'Clear Network Logs',
              description: `${logs.length} requests stored`,
              isLast: true,
              onPress: () => {
                clearNetworkLogs();
                setSelected(null);
                Alert.alert('Success', 'Network logs cleared.');
              },
              right: (
                <View
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 5,
                    borderRadius: 7,
                    backgroundColor: 'rgba(255,46,87,0.08)',
                    borderWidth: 1,
                    borderColor: 'rgba(255,46,87,0.2)',
                  }}>
                  <Text
                    style={{
                      fontFamily: AppFonts.interBold,
                      fontSize: 11,
                      color: AppColors.errorColor,
                    }}>
                    Clear
                  </Text>
                </View>
              ),
            })}
          </View>
        </ScrollView>
      );
    } else if (settingsPage === 'logs') {
      title = 'Logs Settings';
      icon = <TerminalIcon color="#FFFFFF" size={16} />;
      rightInfo = `Total: ${consoleLogs.length}`;
      content = (
        <ScrollView
          style={{flex: 1}}
          contentContainerStyle={{padding: 16}}>
          <View
            style={{
              backgroundColor: AppColors.primaryLight,
              padding: 16,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: AppColors.grayBorderSecondary,
              gap: 4,
            }}>
            {renderSettingRow({
              icon: <TerminalIcon color={AppColors.purple} size={16} />,
              label: 'Max Console Logs',
              description: 'How many console messages to retain',
              picker: {
                options: [100, 200, 500, 1000] as const,
                selectedValue: maxConsoleLogs,
                onSelect: setMaxConsoleLogs,
              },
            })}
            <View
              style={{height: 1, backgroundColor: AppColors.dividerColor}}
            />
            <Text
              style={{
                fontFamily: AppFonts.interBold,
                fontSize: 13,
                color: AppColors.primaryBlack,
                paddingTop: 4,
              }}>
              Log Levels
            </Text>
            {(['info', 'warn', 'error'] as const).map((level, li) => {
              const isLvlActive = showConsoleLevels?.[level];
              const levelColor =
                level === 'error'
                  ? AppColors.errorColor
                  : level === 'warn'
                  ? AppColors.warningIconGold
                  : AppColors.skyBlue;
              return renderSettingRow({
                icon: (
                  <View
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 5,
                      backgroundColor: levelColor,
                    }}
                  />
                ),
                label: `Show ${
                  level.charAt(0).toUpperCase() + level.slice(1)
                } logs`,
                description:
                  level === 'info'
                    ? 'Informational messages'
                    : level === 'warn'
                    ? 'Warning messages'
                    : 'Error messages',
                isLast: level === 'error',
                onPress: () =>
                  setShowConsoleLevels(prev => ({
                    ...prev,
                    [level]: !prev[level],
                  })),
                right: (
                  <View
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 6,
                      borderWidth: 2,
                      borderColor: isLvlActive
                        ? AppColors.purple
                        : AppColors.grayTextWeak,
                      backgroundColor: isLvlActive
                        ? 'rgba(104, 75, 155, 0.1)'
                        : 'transparent',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                    {isLvlActive && (
                      <CheckIcon size={12} color={AppColors.purple} />
                    )}
                  </View>
                ),
              });
            })}
          </View>

          <View
            style={{
              backgroundColor: AppColors.primaryLight,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: AppColors.grayBorderSecondary,
              padding: 16,
              marginTop: 12,
            }}>
            {renderSettingRow({
              icon: <TrashIcon color={AppColors.errorColor} size={16} />,
              label: 'Clear Console Logs',
              description: `${consoleLogs.length} logs stored`,
              isLast: true,
              onPress: () => {
                clearConsoleLogs();
                Alert.alert('Success', 'Console logs cleared.');
              },
              right: (
                <View
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 5,
                    borderRadius: 7,
                    backgroundColor: 'rgba(255,46,87,0.08)',
                    borderWidth: 1,
                    borderColor: 'rgba(255,46,87,0.2)',
                  }}>
                  <Text
                    style={{
                      fontFamily: AppFonts.interBold,
                      fontSize: 11,
                      color: AppColors.errorColor,
                    }}>
                    Clear
                  </Text>
                </View>
              ),
            })}
          </View>
        </ScrollView>
      );
    } else if (settingsPage === 'analytics') {
      title = 'Analytics Settings';
      icon = <AnalyticsIcon color="#FFFFFF" size={16} />;
      rightInfo = `Events: ${analyticsEvents.length}`;
      content = (
        <ScrollView
          style={{flex: 1}}
          contentContainerStyle={{padding: 16}}>
          <View
            style={{
              backgroundColor: AppColors.primaryLight,
              padding: 16,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: AppColors.grayBorderSecondary,
              gap: 4,
            }}>
            {renderSettingRow({
              icon: <AnalyticsIcon color={AppColors.purple} size={16} />,
              label: 'Events Captured',
              description: `${analyticsEvents.length} analytics events stored`,
              isLast: true,
            })}
          </View>
          <View
            style={{
              backgroundColor: AppColors.primaryLight,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: AppColors.grayBorderSecondary,
              padding: 16,
              marginTop: 12,
            }}>
            {renderSettingRow({
              icon: <TrashIcon color={AppColors.errorColor} size={16} />,
              label: 'Clear Analytics History',
              description: 'Remove all captured events',
              isLast: true,
              onPress: () => {
                clearAnalyticsEvents();
                setSelectedEvent(null);
                Alert.alert('Success', 'Analytics events cleared.');
              },
              right: (
                <View
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 5,
                    borderRadius: 7,
                    backgroundColor: 'rgba(255,46,87,0.08)',
                    borderWidth: 1,
                    borderColor: 'rgba(255,46,87,0.2)',
                  }}>
                  <Text
                    style={{
                      fontFamily: AppFonts.interBold,
                      fontSize: 11,
                      color: AppColors.errorColor,
                    }}>
                    Clear
                  </Text>
                </View>
              ),
            })}
          </View>
        </ScrollView>
      );
    } else if (settingsPage === 'webview') {
      title = 'WebView Settings';
      icon = <GlobeIcon color="#FFFFFF" size={16} />;
      rightInfo = `History: ${webViewNavHistory.length}`;
      content = (
        <ScrollView
          style={{flex: 1}}
          contentContainerStyle={{padding: 16}}>
          <View
            style={{
              backgroundColor: AppColors.primaryLight,
              padding: 16,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: AppColors.grayBorderSecondary,
              gap: 4,
            }}>
            {renderSettingRow({
              icon: <GlobeIcon color={AppColors.purple} size={16} />,
              label: 'Capture CSS & JavaScript',
              description: 'Extract stylesheet and script source from pages',
              onPress: () => setWebViewCaptureCssJs(prev => !prev),
              right: (
                <View
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 6,
                    borderWidth: 2,
                    borderColor: webViewCaptureCssJs
                      ? AppColors.purple
                      : AppColors.grayTextWeak,
                    backgroundColor: webViewCaptureCssJs
                      ? 'rgba(104, 75, 155, 0.1)'
                      : 'transparent',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  {webViewCaptureCssJs && (
                    <CheckIcon size={12} color={AppColors.purple} />
                  )}
                </View>
              ),
              isLast: true,
            })}
          </View>
          <View
            style={{
              backgroundColor: AppColors.primaryLight,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: AppColors.grayBorderSecondary,
              padding: 16,
              marginTop: 12,
            }}>
            {renderSettingRow({
              icon: <TrashIcon color={AppColors.errorColor} size={16} />,
              label: 'Clear WebView Data',
              description: 'Remove all captured source & navigation history',
              isLast: true,
              onPress: () => {
                clearWebViewData();
                Alert.alert('Success', 'WebView source history cleared.');
              },
              right: (
                <View
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 5,
                    borderRadius: 7,
                    backgroundColor: 'rgba(255,46,87,0.08)',
                    borderWidth: 1,
                    borderColor: 'rgba(255,46,87,0.2)',
                  }}>
                  <Text
                    style={{
                      fontFamily: AppFonts.interBold,
                      fontSize: 11,
                      color: AppColors.errorColor,
                    }}>
                    Clear
                  </Text>
                </View>
              ),
            })}
          </View>
        </ScrollView>
      );
    } else if (settingsPage === 'redux') {
      title = 'Redux Settings';
      icon = <TerminalIcon color="#FFFFFF" size={16} />;
      rightInfo = `Reducers: ${Object.keys(reduxState || {}).length}`;
      content = (
        <ScrollView
          style={{flex: 1}}
          contentContainerStyle={{padding: 16}}>
          <View
            style={{
              backgroundColor: AppColors.primaryLight,
              padding: 16,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: AppColors.grayBorderSecondary,
              gap: 4,
            }}>
            {renderSettingRow({
              icon: <TerminalIcon color={AppColors.purple} size={16} />,
              label: 'Auto-refresh Store',
              description: 'Automatically capture Redux store state updates',
              onPress: () => setReduxAutoRefreshState(prev => !prev),
              right: (
                <View
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 6,
                    borderWidth: 2,
                    borderColor: reduxAutoRefresh
                      ? AppColors.purple
                      : AppColors.grayTextWeak,
                    backgroundColor: reduxAutoRefresh
                      ? 'rgba(104, 75, 155, 0.1)'
                      : 'transparent',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  {reduxAutoRefresh && (
                    <CheckIcon size={12} color={AppColors.purple} />
                  )}
                </View>
              ),
            })}
            <View
              style={{height: 1, backgroundColor: AppColors.dividerColor}}
            />
            {renderSettingRow({
              icon: <InsightsIcon color={AppColors.purple} size={16} />,
              label: 'Default JSON Expand Depth',
              description: 'Initial depth of Redux state tree to auto-expand',
              picker: {
                options: [1, 2, 3, 5] as const,
                selectedValue: reduxExpandDepth,
                onSelect: setReduxExpandDepth,
              },
              isLast: true,
            })}
          </View>

          <View
            style={{
              backgroundColor: AppColors.primaryLight,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: AppColors.grayBorderSecondary,
              padding: 16,
              marginTop: 12,
            }}>
            {renderSettingRow({
              icon: <TrashIcon color={AppColors.errorColor} size={16} />,
              label: 'Clear Redux State',
              description: reduxState
                ? 'Reset state snapshot in inspector'
                : 'No store snapshot stored',
              isLast: true,
              onPress: () => {
                setReduxState(null);
                Alert.alert('Success', 'Redux state snapshot cleared.');
              },
              right: (
                <View
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 5,
                    borderRadius: 7,
                    backgroundColor: 'rgba(255,46,87,0.08)',
                    borderWidth: 1,
                    borderColor: 'rgba(255,46,87,0.2)',
                  }}>
                  <Text
                    style={{
                      fontFamily: AppFonts.interBold,
                      fontSize: 11,
                      color: AppColors.errorColor,
                    }}>
                    Clear
                  </Text>
                </View>
              ),
            })}
          </View>
        </ScrollView>
      );
    } else {
      title = 'Insights Settings';
      icon = <InsightsIcon color="#FFFFFF" size={16} />;
      content = (
        <ScrollView
          style={{flex: 1}}
          contentContainerStyle={{padding: 16}}>
          <View
            style={{
              backgroundColor: AppColors.primaryLight,
              padding: 16,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: AppColors.grayBorderSecondary,
              gap: 4,
            }}>
            {renderSettingRow({
              icon: <SignalIcon color={AppColors.purple} size={16} />,
              label: 'Slow Latency Warning',
              description: 'Alert threshold for slow API request duration',
              picker: {
                options: [500, 1000, 2000] as const,
                selectedValue: slowRequestThreshold,
                onSelect: setSlowRequestThreshold,
              },
            })}
            <View style={{height: 1, backgroundColor: AppColors.dividerColor}} />
            {renderSettingRow({
              icon: <TerminalIcon color={AppColors.purple} size={16} />,
              label: 'Show Console Alerts',
              description: 'Flags critical warnings or crash events on dashboard',
              isLast: true,
              onPress: () => setInsightsShowConsoleAlerts(prev => !prev),
              right: (
                <View
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 6,
                    borderWidth: 2,
                    borderColor: insightsShowConsoleAlerts
                      ? AppColors.purple
                      : AppColors.grayTextWeak,
                    backgroundColor: insightsShowConsoleAlerts
                      ? 'rgba(104, 75, 155, 0.1)'
                      : 'transparent',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  {insightsShowConsoleAlerts && (
                    <CheckIcon size={12} color={AppColors.purple} />
                  )}
                </View>
              ),
            })}
          </View>
        </ScrollView>
      );
    }

    return (
      <View style={{flex: 1, backgroundColor: AppColors.grayBackground}}>
        <LinearGradient
          colors={[AppColors.purple, '#6B4EFF']}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 0}}
          style={styles.headerGradient}>
          <View style={{paddingTop: headerTopPadding, width: '100%'}}>
            <View style={[styles.header, {paddingHorizontal: 16, gap: 12}]}>
            <TouchableScale
              onPress={goBackToMain}
              hitSlop={12}
              style={{
                padding: 8,
                borderRadius: 10,
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.08)',
              }}>
              <WhiteBackNavigation color="#FFFFFF" size={16} />
            </TouchableScale>
            {icon && (
              <View
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 8,
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                {icon}
              </View>
            )}
            <View style={{flex: 1}}>
              <Text
                style={{
                  fontFamily: AppFonts.interBold,
                  fontSize: 17,
                  color: '#FFFFFF',
                }}>
                {title}
              </Text>
            </View>
            {rightInfo ? (
              <View
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: 'rgba(255, 255, 255, 0.1)',
                }}>
                <Text
                  style={{
                    fontFamily: AppFonts.interBold,
                    fontSize: 11,
                    color: '#FFFFFF',
                  }}>
                  {rightInfo}
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      </LinearGradient>
        {content}
      </View>
    );
  };

  const renderInsightsDashboard = () => {
    const apiTotal = logs.length;
    const apiErrors = logs.filter(
      l =>
        (l.status != null && l.status >= 400) ||
        l.status === 0 ||
        l.status == null,
    ).length;
    const apiSuccess = apiTotal - apiErrors;
    const apiSuccessRate =
      apiTotal > 0 ? Math.round((apiSuccess / apiTotal) * 100) : 100;
    const durations = logs
      .filter(l => l.duration != null)
      .map(l => l.duration!);
    const avgTime =
      durations.length > 0
        ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
        : null;

    const logTotal = visibleConsoleLogs.length;
    const logErrors = visibleConsoleLogs.filter(l => l.type === 'error').length;
    const logWarns = visibleConsoleLogs.filter(l => l.type === 'warn').length;
    const logInfos = visibleConsoleLogs.filter(l => l.type === 'info').length;

    const analyticsTotal = analyticsEvents.length;
    const uniqueEvents = new Set(analyticsEvents.map(e => e.name)).size;
    const screenViews = analyticsEvents.filter(
      e =>
        e.name === 'screen_view' ||
        e.name === 'page_view' ||
        e.name === 'firebase_screen_class',
    ).length;

    const webviewTotal = webViewNavHistory.length;

    // --- Richer insights metrics ---
    const slowestTime = durations.length > 0 ? Math.max(...durations) : null;
    const fastestTime = durations.length > 0 ? Math.min(...durations) : null;
    const slowCount = durations.filter(d => d >= slowRequestThreshold).length;

    const status2xx = logs.filter(
      l => l.status != null && l.status >= 200 && l.status < 300,
    ).length;
    const status3xx = logs.filter(
      l => l.status != null && l.status >= 300 && l.status < 400,
    ).length;
    const status4xx = logs.filter(
      l => l.status != null && l.status >= 400 && l.status < 500,
    ).length;
    const status5xx = logs.filter(
      l => l.status != null && l.status >= 500,
    ).length;

    const totalSignals = apiTotal + logTotal + analyticsTotal + webviewTotal;
    const totalIssues = apiErrors + logErrors;
    const activeModules = [
      tabVisibility?.apis,
      tabVisibility?.logs,
      tabVisibility?.analytics,
      tabVisibility?.webview,
      tabVisibility?.redux,
    ].filter(Boolean).length;

    // Composite health score: success rate penalised by error volume and slow requests.
    const healthScore =
      totalSignals === 0
        ? 100
        : Math.max(
            0,
            Math.min(
              100,
              Math.round(
                apiSuccessRate -
                  (logErrors > 0 ? Math.min(15, logErrors * 3) : 0) -
                  (slowCount > 0 ? Math.min(10, slowCount * 2) : 0),
              ),
            ),
          );
    const healthColor =
      healthScore >= 90
        ? AppColors.greenColor
        : healthScore >= 70
        ? AppColors.warningIconGold
        : AppColors.errorColor;
    const healthLabel =
      healthScore >= 90
        ? 'Healthy'
        : healthScore >= 70
        ? 'Needs attention'
        : 'Degraded';

    return (
      <View style={styles.dashboardContainer}>
        {/* Overview hero card */}
        <View
          style={{
            backgroundColor: AppColors.primaryLight,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: AppColors.grayBorderSecondary,
            padding: 16,
            marginBottom: 12,
          }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 14,
            }}>
            {/* Health ring stand-in */}
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                borderWidth: 4,
                borderColor: healthColor,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: AppColors.purpleShade50,
              }}>
              <Text
                style={{
                  fontFamily: AppFonts.interBold,
                  fontSize: 18,
                  color: healthColor,
                }}>
                {healthScore}
              </Text>
              <Text
                style={{
                  fontFamily: AppFonts.interMedium,
                  fontSize: 7.5,
                  color: AppColors.grayTextWeak,
                  letterSpacing: 0.4,
                }}>
                HEALTH
              </Text>
            </View>
            <View style={{flex: 1}}>
              <Text
                style={{
                  fontFamily: AppFonts.interBold,
                  fontSize: 15,
                  color: AppColors.primaryBlack,
                }}>
                Session Overview
              </Text>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  marginTop: 3,
                }}>
                <View
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: 3.5,
                    backgroundColor: healthColor,
                  }}
                />
                <Text
                  style={{
                    fontFamily: AppFonts.interMedium,
                    fontSize: 11.5,
                    color: healthColor,
                  }}>
                  {healthLabel}
                </Text>
                <Text
                  style={{
                    fontFamily: AppFonts.interRegular,
                    fontSize: 11.5,
                    color: AppColors.grayTextWeak,
                  }}>
                  • {activeModules} modules active
                </Text>
              </View>
            </View>
          </View>

          {/* Quick totals strip */}
          <View
            style={{
              flexDirection: 'row',
              marginTop: 14,
              borderTopWidth: 1,
              borderTopColor: AppColors.dividerColor,
              paddingTop: 12,
            }}>
            <View style={{flex: 1, alignItems: 'center'}}>
              <Text
                style={{
                  fontFamily: AppFonts.interBold,
                  fontSize: 16,
                  color: AppColors.primaryBlack,
                }}>
                {totalSignals}
              </Text>
              <Text
                style={{
                  fontFamily: AppFonts.interRegular,
                  fontSize: 10,
                  color: AppColors.grayTextWeak,
                  marginTop: 1,
                }}>
                Signals
              </Text>
            </View>
            <View style={{width: 1, backgroundColor: AppColors.dividerColor}} />
            <View style={{flex: 1, alignItems: 'center'}}>
              <Text
                style={{
                  fontFamily: AppFonts.interBold,
                  fontSize: 16,
                  color:
                    totalIssues > 0
                      ? AppColors.errorColor
                      : AppColors.primaryBlack,
                }}>
                {totalIssues}
              </Text>
              <Text
                style={{
                  fontFamily: AppFonts.interRegular,
                  fontSize: 10,
                  color: AppColors.grayTextWeak,
                  marginTop: 1,
                }}>
                Issues
              </Text>
            </View>
            <View style={{width: 1, backgroundColor: AppColors.dividerColor}} />
            <View style={{flex: 1, alignItems: 'center'}}>
              <Text
                style={{
                  fontFamily: AppFonts.interBold,
                  fontSize: 16,
                  color:
                    slowCount > 0
                      ? AppColors.warningIconGold
                      : AppColors.primaryBlack,
                }}>
                {slowCount}
              </Text>
              <Text
                style={{
                  fontFamily: AppFonts.interRegular,
                  fontSize: 10,
                  color: AppColors.grayTextWeak,
                  marginTop: 1,
                }}>
                Slow ({slowRequestThreshold}ms+)
              </Text>
            </View>
          </View>
        </View>

        {/* ── Insights Sub-Tab Selector ── */}
        {(() => {
          const insightTabs: Array<{
            key: 'apis' | 'logs' | 'analytics' | 'webview' | 'redux';
            label: string;
            icon: (c: string, s: number) => React.ReactNode;
            color: string;
            count: number;
            visible: boolean;
          }> = [
            {
              key: 'apis',
              label: 'APIs',
              icon: (c, s) => <SignalIcon color={c} size={s} />,
              color: AppColors.purple,
              count: apiTotal,
              visible: !!tabVisibility?.apis,
            },
            {
              key: 'logs',
              label: 'Logs',
              icon: (c, s) => <TerminalIcon color={c} size={s} />,
              color: '#0D9488',
              count: logTotal,
              visible: !!tabVisibility?.logs,
            },
            {
              key: 'analytics',
              label: 'Analytics',
              icon: (c, s) => <AnalyticsIcon color={c} size={s} />,
              color: '#EA580C',
              count: analyticsTotal,
              visible: !!tabVisibility?.analytics,
            },
            {
              key: 'webview',
              label: 'WebView',
              icon: (c, s) => <GlobeIcon color={c} size={s} />,
              color: '#2563EB',
              count: webviewTotal,
              visible: !!tabVisibility?.webview,
            },
            {
              key: 'redux',
              label: 'Redux',
              icon: (c, s) => <TerminalIcon color={c} size={s} />,
              color: AppColors.purple,
              count: reduxState ? Object.keys(reduxState).length : 0,
              visible: !!tabVisibility?.redux,
            },
          ];
          const visibleTabs = insightTabs.filter(t => t.visible);
          if (visibleTabs.length === 0) return null;

          return (
            <>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{
                  paddingHorizontal: 2,
                  paddingVertical: 2,
                  gap: 8,
                }}
                style={{
                  marginBottom: 12,
                  flexGrow: 0,
                }}>
                {visibleTabs.map(tab => {
                  const isActive = insightsActiveSubTab === tab.key;
                  return (
                    <TouchableOpacity
                      key={tab.key}
                      onPress={() => {
                        animateNextLayout();
                        setInsightsActiveSubTab(tab.key);
                      }}
                      activeOpacity={0.7}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 6,
                        paddingHorizontal: 14,
                        paddingVertical: 8,
                        borderRadius: 20,
                        backgroundColor: isActive
                          ? tab.color
                          : AppColors.primaryLight,
                        borderWidth: 1,
                        borderColor: isActive
                          ? tab.color
                          : AppColors.grayBorderSecondary,
                      }}>
                      {tab.icon(isActive ? '#FFFFFF' : tab.color, 14)}
                      <Text
                        style={{
                          fontFamily: AppFonts.interBold,
                          fontSize: 11.5,
                          color: isActive ? '#FFFFFF' : AppColors.grayTextStrong,
                        }}>
                        {tab.label}
                      </Text>
                      <View
                        style={{
                          minWidth: 20,
                          height: 18,
                          borderRadius: 9,
                          paddingHorizontal: 5,
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: isActive
                            ? 'rgba(255,255,255,0.25)'
                            : AppColors.grayBackground,
                        }}>
                        <Text
                          style={{
                            fontFamily: AppFonts.interBold,
                            fontSize: 9.5,
                            color: isActive ? '#FFFFFF' : AppColors.grayTextWeak,
                          }}>
                          {tab.count}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* ── Active Module Card ── */}
              {insightsActiveSubTab === 'apis' && tabVisibility?.apis && (
                <TouchableScale
                  style={styles.dashboardModuleCard}
                  onPress={() => switchActiveTab('apis')}>
                  <View style={styles.dashboardModuleHeader}>
                    <View
                      style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
                      <SignalIcon color={AppColors.purple} size={18} />
                      <Text style={styles.dashboardModuleTitle}>APIs & Network</Text>
                    </View>
                    <Text style={styles.dashboardModuleGoText}>View Details →</Text>
                  </View>
                  <View style={styles.dashboardModuleGrid}>
                    <View style={styles.dashboardGridItem}>
                      <Text style={styles.dashboardGridVal}>{apiTotal}</Text>
                      <Text style={styles.dashboardGridLbl}>Requests</Text>
                    </View>
                    <View style={styles.dashboardGridItem}>
                      <Text
                        style={[
                          styles.dashboardGridVal,
                          apiSuccessRate < 90 && {color: AppColors.warningIconGold},
                        ]}>
                        {apiSuccessRate}%
                      </Text>
                      <Text style={styles.dashboardGridLbl}>Success Rate</Text>
                    </View>
                    <View style={styles.dashboardGridItem}>
                      <Text
                        style={[
                          styles.dashboardGridVal,
                          apiErrors > 0 && {color: AppColors.errorColor},
                        ]}>
                        {apiErrors}
                      </Text>
                      <Text style={styles.dashboardGridLbl}>Errors</Text>
                    </View>
                    <View style={styles.dashboardGridItem}>
                      <Text style={styles.dashboardGridVal}>
                        {avgTime != null ? `${avgTime}ms` : '—'}
                      </Text>
                      <Text style={styles.dashboardGridLbl}>Avg Latency</Text>
                    </View>
                  </View>

                  {/* Status-class breakdown + latency range */}
                  <View
                    style={{
                      marginTop: 10,
                      paddingTop: 10,
                      borderTopWidth: 1,
                      borderTopColor: AppColors.dividerColor,
                      flexDirection: 'row',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: 6,
                    }}>
                    {[
                      {label: '2xx', value: status2xx, color: AppColors.greenColor},
                      {label: '3xx', value: status3xx, color: AppColors.skyBlue},
                      {
                        label: '4xx',
                        value: status4xx,
                        color: AppColors.warningIconGold,
                      },
                      {label: '5xx', value: status5xx, color: AppColors.errorColor},
                    ].map(s => (
                      <View
                        key={s.label}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 4,
                          backgroundColor: AppColors.grayBackground,
                          borderRadius: 6,
                          borderWidth: 1,
                          borderColor: AppColors.dividerColor,
                          paddingHorizontal: 7,
                          paddingVertical: 3,
                        }}>
                        <View
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: 3,
                            backgroundColor: s.color,
                          }}
                        />
                        <Text
                          style={{
                            fontFamily: AppFonts.interBold,
                            fontSize: 10,
                            color: AppColors.grayTextStrong,
                          }}>
                          {s.label} {s.value}
                        </Text>
                      </View>
                    ))}
                    {slowestTime != null && (
                      <View
                        style={{
                          marginLeft: 'auto',
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 4,
                        }}>
                        <Text
                          style={{
                            fontFamily: AppFonts.interRegular,
                            fontSize: 10,
                            color: AppColors.grayTextWeak,
                          }}>
                          Range
                        </Text>
                        <Text
                          style={{
                            fontFamily: AppFonts.interBold,
                            fontSize: 10,
                            color: AppColors.grayTextStrong,
                          }}>
                          {fastestTime}–{slowestTime}ms
                        </Text>
                      </View>
                    )}
                  </View>
                </TouchableScale>
              )}

              {insightsActiveSubTab === 'logs' && tabVisibility?.logs && (
                <TouchableScale
                  style={styles.dashboardModuleCard}
                  onPress={() => switchActiveTab('logs')}>
                  <View style={styles.dashboardModuleHeader}>
                    <View
                      style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
                      <TerminalIcon color="#0D9488" size={18} />
                      <Text style={styles.dashboardModuleTitle}>Console Logs</Text>
                    </View>
                    <Text style={styles.dashboardModuleGoText}>View Details →</Text>
                  </View>
                  <View style={styles.dashboardModuleGrid}>
                    <View style={styles.dashboardGridItem}>
                      <Text style={styles.dashboardGridVal}>{logTotal}</Text>
                      <Text style={styles.dashboardGridLbl}>Total Logs</Text>
                    </View>
                    <View style={styles.dashboardGridItem}>
                      <Text style={[styles.dashboardGridVal, {color: '#0D9488'}]}>
                        {logInfos}
                      </Text>
                      <Text style={styles.dashboardGridLbl}>Info</Text>
                    </View>
                    <View style={styles.dashboardGridItem}>
                      <Text
                        style={[
                          styles.dashboardGridVal,
                          logWarns > 0 && {color: AppColors.warningIconGold},
                        ]}>
                        {logWarns}
                      </Text>
                      <Text style={styles.dashboardGridLbl}>Warnings</Text>
                    </View>
                    <View style={styles.dashboardGridItem}>
                      <Text
                        style={[
                          styles.dashboardGridVal,
                          logErrors > 0 && {color: AppColors.errorColor},
                        ]}>
                        {logErrors}
                      </Text>
                      <Text style={styles.dashboardGridLbl}>Errors</Text>
                    </View>
                  </View>
                </TouchableScale>
              )}

              {insightsActiveSubTab === 'analytics' && tabVisibility?.analytics && (
                <TouchableScale
                  style={styles.dashboardModuleCard}
                  onPress={() => switchActiveTab('analytics')}>
                  <View style={styles.dashboardModuleHeader}>
                    <View
                      style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
                      <AnalyticsIcon color="#EA580C" size={18} />
                      <Text style={styles.dashboardModuleTitle}>
                        Analytics Events
                      </Text>
                    </View>
                    <Text style={styles.dashboardModuleGoText}>View Details →</Text>
                  </View>
                  <View style={styles.dashboardModuleGrid}>
                    <View style={styles.dashboardGridItem}>
                      <Text style={styles.dashboardGridVal}>{analyticsTotal}</Text>
                      <Text style={styles.dashboardGridLbl}>Total Events</Text>
                    </View>
                    <View style={styles.dashboardGridItem}>
                      <Text style={[styles.dashboardGridVal, {color: '#EA580C'}]}>
                        {uniqueEvents}
                      </Text>
                      <Text style={styles.dashboardGridLbl}>Unique Names</Text>
                    </View>
                    <View style={styles.dashboardGridItem}>
                      <Text style={styles.dashboardGridVal}>{screenViews}</Text>
                      <Text style={styles.dashboardGridLbl}>Screen Views</Text>
                    </View>
                    <View style={styles.dashboardGridItem}>
                      <Text style={styles.dashboardGridVal}>
                        {analyticsTotal > 0
                          ? Math.round(analyticsTotal / Math.max(1, logs.length / 5))
                          : 0}
                      </Text>
                      <Text style={styles.dashboardGridLbl}>Events Ratio</Text>
                    </View>
                  </View>
                </TouchableScale>
              )}

              {insightsActiveSubTab === 'webview' && tabVisibility?.webview && (
                <TouchableScale
                  style={styles.dashboardModuleCard}
                  onPress={() => switchActiveTab('webview')}>
                  <View style={styles.dashboardModuleHeader}>
                    <View
                      style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
                      <GlobeIcon color="#2563EB" size={18} />
                      <Text style={styles.dashboardModuleTitle}>
                        WebView Captures
                      </Text>
                    </View>
                    <Text style={styles.dashboardModuleGoText}>View Details →</Text>
                  </View>
                  <View style={styles.dashboardModuleGrid}>
                    <View style={styles.dashboardGridItem}>
                      <Text style={styles.dashboardGridVal}>{webviewTotal}</Text>
                      <Text style={styles.dashboardGridLbl}>History Size</Text>
                    </View>
                    <View style={styles.dashboardGridItem}>
                      <Text style={[styles.dashboardGridVal, {color: '#16A34A'}]}>
                        Active
                      </Text>
                      <Text style={styles.dashboardGridLbl}>Status</Text>
                    </View>
                    <View style={styles.dashboardGridItem}>
                      <Text numberOfLines={1} style={styles.dashboardGridVal}>
                        {webviewTotal > 0
                          ? `${
                              webViewNavHistory[0]?.title?.substring(0, 10) ?? ''
                            }...`
                          : '—'}
                      </Text>
                      <Text style={styles.dashboardGridLbl}>Last URL</Text>
                    </View>
                  </View>
                </TouchableScale>
              )}

              {insightsActiveSubTab === 'redux' && tabVisibility?.redux && (
                <TouchableScale
                  style={styles.dashboardModuleCard}
                  onPress={() => switchActiveTab('redux')}>
                  <View style={styles.dashboardModuleHeader}>
                    <View
                      style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
                      <TerminalIcon color={AppColors.purple} size={18} />
                      <Text style={styles.dashboardModuleTitle}>
                        Redux Store State
                      </Text>
                    </View>
                    <Text style={styles.dashboardModuleGoText}>View Details →</Text>
                  </View>
                  {reduxState ? (
                    <View style={{paddingHorizontal: 12, paddingBottom: 12, gap: 6}}>
                      <View
                        style={{
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          marginBottom: 4,
                        }}>
                        <Text
                          style={{
                            fontFamily: AppFonts.interBold,
                            fontSize: 10,
                            color: AppColors.grayTextWeak,
                            letterSpacing: 0.5,
                          }}>
                          REDUCER NAME
                        </Text>
                        <Text
                          style={{
                            fontFamily: AppFonts.interBold,
                            fontSize: 10,
                            color: AppColors.grayTextWeak,
                            letterSpacing: 0.5,
                          }}>
                          SIZE / FIELDS
                        </Text>
                      </View>
                      {Object.keys(reduxState).map(key => {
                        const val = reduxState[key];
                        const fieldsCount =
                          typeof val === 'object' && val !== null
                            ? Object.keys(val).length
                            : 0;
                        const sizeStr = getSize(val);
                        return (
                          <View
                            key={key}
                            style={{
                              flexDirection: 'row',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              paddingVertical: 2,
                            }}>
                            <Text
                              style={{
                                fontFamily: AppFonts.interMedium,
                                fontSize: 12,
                                color: AppColors.grayTextStrong,
                              }}>
                              {key}
                            </Text>
                            <Text
                              style={{
                                fontFamily: AppFonts.interRegular,
                                fontSize: 11,
                                color: AppColors.grayTextWeak,
                              }}>
                              {sizeStr} ({fieldsCount} fields)
                            </Text>
                          </View>
                        );
                      })}
                    </View>
                  ) : (
                    <View style={{padding: 12, alignItems: 'center'}}>
                      <Text
                        style={{
                          fontFamily: AppFonts.interRegular,
                          fontSize: 12,
                          color: AppColors.grayTextWeak,
                        }}>
                        No connected Redux store.
                      </Text>
                    </View>
                  )}
                </TouchableScale>
              )}
            </>
          );
        })()}
      </View>
    );
  };

  const renderReduxTab = () => {
    if (!reduxState) {
      return (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconWrap}>
            <TerminalIcon color={AppColors.purple} size={32} />
          </View>
          <Text style={styles.emptyTitle}>No Redux Store</Text>
          <Text style={styles.emptySub}>
            To inspect Redux store, call connectReduxStore(store) at app start.
          </Text>
        </View>
      );
    }

    const reducerKeys = Object.keys(reduxState);
    if (reducerKeys.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>Empty Store</Text>
          <Text style={styles.emptySub}>Connected store state is empty.</Text>
        </View>
      );
    }

    const lastActionMap = reduxLastActionMap;

    return (
      <ScrollView
        style={styles.detailScroll}
        contentContainerStyle={{paddingBottom: 24}}>
        {/* Search Bar */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: AppColors.grayBackground,
            borderRadius: 8,
            marginHorizontal: 16,
            marginTop: 16,
            marginBottom: 12,
            paddingHorizontal: 10,
            borderWidth: 1,
            borderColor: AppColors.dividerColor,
            height: 36,
          }}>
          <TextInput
            placeholder="Search Redux keys or values..."
            placeholderTextColor={AppColors.grayTextWeak}
            value={reduxSearch}
            onChangeText={setReduxSearch}
            style={{
              flex: 1,
              fontFamily: AppFonts.interRegular,
              fontSize: 12,
              color: AppColors.grayTextStrong,
              padding: 0,
            }}
            autoCorrect={false}
            autoCapitalize="none"
          />
          {reduxSearch.length > 0 && (
            <Pressable onPress={() => setReduxSearch('')} hitSlop={10}>
              <ClearIcon color={AppColors.grayTextWeak} size={14} />
            </Pressable>
          )}
        </View>

        {/* Main Content Card */}
        <View
          style={{
            backgroundColor: AppColors.primaryLight,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: AppColors.grayBorderSecondary,
            marginHorizontal: 16,
            padding: 12,
          }}>
          <ReduxTreeView
            state={reduxState}
            lastActionMap={lastActionMap}
            search={reduxSearch}
          />
        </View>
      </ScrollView>
    );
  };

  return (
    <>
      {hasNavigationContext && (
        <NavigationTracker onStateChange={setNavState} />
      )}
      <Animated.View
        style={[styles.fabWrapper, {transform: fabPan.getTranslateTransform()}]}
        {...fabPanResponder.panHandlers}>
        <TouchableScale
          style={{alignItems: 'center', justifyContent: 'center'}}
          onPress={() => {
            if (fabDraggedRef.current) return;
            setVisible(true);
          }}
          hitSlop={10}>
          <Animated.View
            style={[styles.fabPulseRing, {transform: [{scale: pulseAnim}]}]}
          />
          <BrandCircleIcon size={62} />
          {/* #4 — shining sweep, clipped inside the circular launcher */}
          <View pointerEvents="none" style={styles.fabShineClip}>
            <Animated.View
              style={[
                styles.fabShineStreak,
                {
                  transform: [
                    {
                      translateX: fabShineAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-48, 96],
                      }),
                    },
                    {rotate: '25deg'},
                  ],
                },
              ]}>
              <LinearGradient
                colors={[
                  'rgba(255,255,255,0)',
                  'rgba(255,255,255,0.55)',
                  'rgba(255,255,255,0)',
                ]}
                start={{x: 0, y: 0.5}}
                end={{x: 1, y: 0.5}}
                style={{flex: 1}}
              />
            </Animated.View>
          </View>
          {(logs.length > 0 || analyticsEvents.length > 0) && (
            <Animated.View
              style={[
                styles.fabBadge,
                hasErrors ? styles.fabBadgeError : styles.fabBadgeNormal,
                {transform: [{scale: badgeAnim}]},
              ]}>
              <Text style={styles.fabBadgeText}>
                {logs.length + analyticsEvents.length > 99
                  ? '99+'
                  : logs.length + analyticsEvents.length}
              </Text>
            </Animated.View>
          )}
        </TouchableScale>
      </Animated.View>

      <Modal visible={visible} animationType={modalAnimationType} transparent>
        {visible && (
          <ErrorBoundary onClose={closeModal}>
            <View style={styles.modalBackdrop}>
              <Pressable
                style={styles.modalBackdropPressable}
                onPress={closeModal}
              />
              <View
                style={[
                  styles.modalContentCard,
                  {height: `${modalHeightPercent}%`},
                ]}>
                <StatusBar
                  translucent
                  backgroundColor="transparent"
                  barStyle="light-content"
                />

                <LinearGradient
                  colors={[AppColors.purple, '#6B4EFF']}
                  style={styles.headerGradient}>
                  <View style={{paddingTop: headerTopPadding, width: '100%'}}>
                    <View style={styles.header}>
                    <View
                      style={[
                        styles.headerLeft,
                        {
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 16,
                          flex:
                            selected == null && selectedEvent == null ? 5 : 1,
                        },
                      ]}>
                      <TouchableScale
                        onPress={() => {
                          requestAnimationFrame(() => {
                            animateNextLayout();
                            setSelected(null);
                            setSelectedEvent(null);
                          });
                        }}
                        hitSlop={15}
                        style={[
                          {
                            width: 38,
                            height: 38,
                            borderRadius: 19,
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: 'rgba(255,255,255,0.18)',
                            borderWidth: 1,
                            borderColor: 'rgba(255,255,255,0.30)',
                          },
                          selected == null &&
                            selectedEvent == null && {display: 'none'},
                        ]}>
                        {/* Soft outer glow to fake a blurred circle */}
                        <View
                          style={{
                            position: 'absolute',
                            width: 48,
                            height: 48,
                            borderRadius: 24,
                            backgroundColor: 'rgba(255,255,255,0.10)',
                          }}
                        />
                        <WhiteBackNavigation />
                      </TouchableScale>

                      {selected == null && selectedEvent == null ? (
                        <TouchableScale
                          onPress={() => setShowHeaderInfo(prev => !prev)}
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 10,
                            flex: 1,
                          }}>
                          <View
                            style={{
                              width: 38,
                              height: 38,
                              borderRadius: 19,
                              backgroundColor: 'rgba(255,255,255,0.13)',
                              borderWidth: 1.5,
                              borderColor: 'rgba(255,255,255,0.25)',
                              alignItems: 'center',
                              justifyContent: 'center',
                              shadowColor: '#000',
                              shadowOpacity: 0.15,
                              shadowRadius: 4,
                              shadowOffset: {width: 0, height: 2},
                            }}>
                            <BrandCircleIcon size={34} />
                          </View>
                          <View style={{gap: 2, flex: 1}}>
                            <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
                              <Text style={[styles.headerTitle]} numberOfLines={1}>
                                {getAppName()}
                              </Text>
                              {updateAvailable && (
                                <Pressable
                                  hitSlop={10}
                                  onPress={() =>
                                    Alert.alert(
                                      'Update Available',
                                      `react-native-inapp-inspector v${latestNpmVersion} is available on NPM (installed: v${LIB_VERSION}).`,
                                      [
                                        {text: 'Later', style: 'cancel'},
                                        {
                                          text: 'View on NPM',
                                          onPress: () =>
                                            Linking.openURL(
                                              'https://www.npmjs.com/package/react-native-inapp-inspector',
                                            ).catch(() => {}),
                                        },
                                      ],
                                    )
                                  }
                                  style={{
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                  }}>
                                  <Animated.View
                                    style={{
                                      width: 8,
                                      height: 8,
                                      borderRadius: 4,
                                      backgroundColor: '#4ADE80',
                                      borderWidth: 1,
                                      borderColor: 'rgba(255,255,255,0.9)',
                                      opacity: activePulseAnim,
                                      transform: [{scale: unreadPulseAnim}],
                                    }}
                                  />
                                </Pressable>
                              )}
                            </View>
                            <View
                              style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                alignSelf: 'flex-start',
                                backgroundColor: 'rgba(255,255,255,0.1)',
                                borderRadius: 10,
                                paddingHorizontal: 8,
                                paddingVertical: 3,
                                gap: 5,
                                borderWidth: 1,
                                borderColor: 'rgba(255,255,255,0.15)',
                              }}>
                              <View
                                style={{
                                  width: 6,
                                  height: 6,
                                  borderRadius: 3,
                                  backgroundColor: '#4ADE80',
                                }}
                              />
                              <Text
                                style={{
                                  fontFamily: AppFonts.interMedium,
                                  fontSize: 10,
                                  color: 'rgba(255, 255, 255, 0.85)',
                                  letterSpacing: 0.2,
                                }}
                                numberOfLines={1}>
                                {getBundleIdentifier()}
                              </Text>
                              <Animated.View
                                style={{
                                  transform: [{rotate: showHeaderInfo ? '180deg' : '0deg'}],
                                  marginLeft: 2,
                                }}>
                                <ChevronIcon color="rgba(255,255,255,0.6)" size={12} />
                              </Animated.View>
                            </View>
                            {showHeaderInfo && (
                              <View
                                style={{
                                  flexDirection: 'row',
                                  alignItems: 'center',
                                  gap: 6,
                                  marginTop: 4,
                                }}>
                                <View
                                  style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    borderRadius: 6,
                                    overflow: 'hidden',
                                    borderWidth: 1,
                                    borderColor: 'rgba(255,255,255,0.18)',
                                  }}>
                                  <View
                                    style={{
                                      paddingHorizontal: 5,
                                      paddingVertical: 2,
                                      backgroundColor: 'rgba(255,255,255,0.28)',
                                    }}>
                                    <Text
                                      style={{
                                        fontFamily: AppFonts.interBold,
                                        fontSize: 9,
                                        color: '#FFFFFF',
                                        letterSpacing: 0.3,
                                      }}>
                                      {Platform.OS === 'ios' ? 'iOS' : 'Android'}
                                    </Text>
                                  </View>
                                  <View
                                    style={{
                                      paddingHorizontal: 5,
                                      paddingVertical: 2,
                                      backgroundColor: 'rgba(255,255,255,0.12)',
                                    }}>
                                    <Text
                                      style={{
                                        fontFamily: AppFonts.interMedium,
                                        fontSize: 9.5,
                                        color: 'rgba(255,255,255,0.92)',
                                      }}>
                                      {String(Platform.Version)}
                                    </Text>
                                  </View>
                                </View>
                                <View
                                  style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    borderRadius: 6,
                                    overflow: 'hidden',
                                    borderWidth: 1,
                                    borderColor: 'rgba(255,255,255,0.18)',
                                  }}>
                                  <View
                                    style={{
                                      paddingHorizontal: 5,
                                      paddingVertical: 2,
                                      backgroundColor: 'rgba(255,255,255,0.28)',
                                    }}>
                                    <Text
                                      style={{
                                        fontFamily: AppFonts.interBold,
                                        fontSize: 9,
                                        color: '#FFFFFF',
                                        letterSpacing: 0.3,
                                      }}>
                                      npm
                                    </Text>
                                  </View>
                                  <View
                                    style={{
                                      paddingHorizontal: 5,
                                      paddingVertical: 2,
                                      backgroundColor: 'rgba(255,255,255,0.12)',
                                    }}>
                                    <Text
                                      style={{
                                        fontFamily: AppFonts.interMedium,
                                        fontSize: 9.5,
                                        color: 'rgba(255,255,255,0.92)',
                                      }}>
                                      v{LIB_VERSION}
                                    </Text>
                                  </View>
                                </View>
                              </View>
                            )}
                          </View>
                        </TouchableScale>
                      ) : null}
                    </View>

                    <View style={styles.headerCenter}>
                      {selected != null ? (
                        <View style={styles.headerDetailCenter}>
                          <View style={styles.headerDetailRow}>
                            <View
                              style={[
                                styles.headerMethodBadge,
                                {
                                  backgroundColor:
                                    METHOD_COLORS[selected.method as Method] ??
                                    AppColors.grayText,
                                },
                              ]}>
                              <Text style={styles.headerMethodText}>
                                {selected.method}
                              </Text>
                            </View>
                            <Text
                              style={styles.headerDetailTitle}
                              numberOfLines={1}
                              ellipsizeMode="middle">
                              {detailTitle}
                            </Text>
                          </View>
                          <View style={styles.headerDetailSubRow}>
                            <View
                              style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 5,
                                paddingHorizontal: 8,
                                paddingVertical: 3,
                                borderRadius: 20,
                                backgroundColor: `${getStatusColor(
                                  selected.status,
                                )}26`,
                                borderWidth: 1,
                                borderColor: `${getStatusColor(
                                  selected.status,
                                )}55`,
                              }}>
                              <View
                                style={[
                                  styles.headerStatusDot,
                                  {
                                    backgroundColor: getStatusColor(
                                      selected.status,
                                    ),
                                  },
                                ]}
                              />
                              <Text
                                style={[
                                  styles.headerSubTitle,
                                  {fontFamily: AppFonts.interBold},
                                ]}>
                                {selected.status === 0
                                  ? 'Failed'
                                  : selected.status ?? 'Pending'}
                              </Text>
                            </View>
                            <View
                              style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 4,
                                paddingHorizontal: 8,
                                paddingVertical: 3,
                                borderRadius: 20,
                                backgroundColor: 'rgba(255,255,255,0.16)',
                              }}>
                              <ClockIcon color="#FFFFFF" size={11} />
                              <Text style={styles.headerSubTitle}>
                                {selected.duration != null
                                  ? `${selected.duration}ms`
                                  : '—'}
                              </Text>
                            </View>
                          </View>
                        </View>
                      ) : selectedEvent != null ? (
                        <View style={styles.headerDetailCenter}>
                          <View style={styles.headerDetailRow}>
                            <View
                              style={[
                                styles.headerMethodBadge,
                                {
                                  backgroundColor:
                                    selectedEvent.source === 'firebase'
                                      ? 'rgba(224,123,26,0.3)'
                                      : 'rgba(124,92,191,0.3)',
                                },
                              ]}>
                              <Text style={styles.headerMethodText}>
                                {selectedEvent.source === 'firebase'
                                  ? 'FB'
                                  : 'MAN'}
                              </Text>
                            </View>
                            <Text
                              style={styles.headerDetailTitle}
                              numberOfLines={1}
                              ellipsizeMode="middle">
                              {selectedEvent.name}
                            </Text>
                          </View>
                          <View style={styles.headerDetailSubRow}>
                            <View
                              style={[
                                styles.headerStatusDot,
                                {
                                  backgroundColor:
                                    selectedEvent.source === 'firebase'
                                      ? '#E07B1A'
                                      : AppColors.purple,
                                },
                              ]}
                            />
                            <Text style={styles.headerSubTitle}>
                              {Object.keys(selectedEvent.params).length} param
                              {Object.keys(selectedEvent.params).length !== 1
                                ? 's'
                                : ''}
                              {' · '}
                              {selectedEvent.source}
                            </Text>
                          </View>
                        </View>
                      ) : null}
                    </View>

                    <View
                      style={[
                        styles.headerRight,
                        selected == null &&
                          selectedEvent == null && {
                            flexShrink: 0,
                            minWidth: 116,
                          },
                      ]}>
                      {selected == null && selectedEvent == null && (
                        <TouchableScale
                          onPress={() => {
                            Alert.alert(
                              'Clear Everything',
                              'This clears all tabs — APIs, Logs, Analytics, WebView and Redux timeline. Continue?',
                              [
                                {text: 'Cancel', style: 'cancel'},
                                {
                                  text: 'Clear All',
                                  onPress: runClearAllWithAnimation,
                                  style: 'destructive',
                                },
                              ],
                            );
                          }}
                          hitSlop={15}
                          style={[
                            styles.closeButtonSquare,
                            {
                              marginRight: 8,
                              backgroundColor: 'rgba(255,255,255,0.15)',
                            },
                          ]}>
                          <Animated.View
                            style={{
                              transform: [
                                {
                                  rotate: clearAnim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: ['0deg', '-25deg'],
                                  }),
                                },
                                {
                                  scale: clearAnim.interpolate({
                                    inputRange: [0, 0.5, 1],
                                    outputRange: [1, 1.25, 1],
                                  }),
                                },
                              ],
                            }}>
                            <WipeIcon color="#FFFFFF" size={16} />
                          </Animated.View>
                        </TouchableScale>
                      )}

                      {selected == null && selectedEvent == null && (
                        <TouchableScale
                          onPress={() => setSettingsPage('main')}
                          hitSlop={15}
                          style={[
                            styles.closeButtonSquare,
                            {
                              marginRight: 8,
                              backgroundColor: 'rgba(255,255,255,0.15)',
                            },
                          ]}>
                          <SettingsIcon color="#FFFFFF" size={16} />
                        </TouchableScale>
                      )}

                      <TouchableScale
                        onPress={closeModal}
                        hitSlop={15}
                        style={styles.closeButtonSquare}>
                        <CloseWhite size={16} />
                      </TouchableScale>
                    </View>
                  </View>
                </View>
              </LinearGradient>

                {/* ─── Horizontal Scrollable Tab Bar inside Content ─── */}
                {selected == null &&
                selectedEvent == null &&
                settingsPage === null ? (
                  <View style={styles.tabBarContainer}>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={{paddingRight: 16}}>
                      {(
                        [
                          {
                            key: 'insights',
                            label: 'Insights',
                            count: 0,
                            icon: 'insights',
                          },
                          {
                            key: 'apis',
                            label: 'APIs',
                            count: logs.length,
                            icon: 'apis',
                          },
                          {
                            key: 'logs',
                            label: 'Logs',
                            count: consoleLogs.length,
                            icon: 'logs',
                          },
                          {
                            key: 'analytics',
                            label: 'Analytics',
                            count: analyticsEvents.length,
                            icon: 'analytics',
                          },
                          {
                            key: 'webview',
                            label: 'WebView',
                            count: webViewNavHistory.length,
                            icon: 'webview',
                          },
                          {
                            key: 'redux',
                            label: 'Redux',
                            count: 0,
                            icon: 'redux',
                          },
                        ] as const
                      )
                        .filter(tab => tabVisibility?.[tab.key])
                        .map(tab => {
                          const isActive = activeTab === tab.key;
                          const iconColor = isActive
                            ? '#FFFFFF'
                            : AppColors.grayText;
                          const countLabel =
                            tab.count > 9 ? '9+' : String(tab.count);
                          const hasUnreadApis =
                            activeTab !== 'apis' &&
                            logs.length > lastReadApisCount;
                          const hasUnreadLogs =
                            activeTab !== 'logs' &&
                            consoleLogs.length > lastReadLogsCount;
                          return (
                            <TouchableScale
                              key={tab.key}
                              onPress={() => {
                                requestAnimationFrame(() => {
                                  switchActiveTab(tab.key);
                                });
                              }}
                              style={[
                                styles.contentTabButton,
                                isActive && styles.contentTabButtonActive,
                              ]}>
                              <View
                                style={{
                                  flexDirection: 'row',
                                  alignItems: 'center',
                                  gap: 6,
                                }}>
                                {tab.icon === 'insights' && (
                                  <InsightsIcon color={iconColor} size={14} />
                                )}
                                {tab.icon === 'apis' && (
                                  <SignalIcon color={iconColor} size={14} />
                                )}
                                {tab.icon === 'logs' && (
                                  <TerminalIcon color={iconColor} size={14} />
                                )}
                                {tab.icon === 'analytics' && (
                                  <AnalyticsIcon color={iconColor} size={14} />
                                )}
                                {tab.icon === 'webview' && (
                                  <GlobeIcon color={iconColor} size={14} />
                                )}
                                {tab.icon === 'redux' && (
                                  <TerminalIcon color={iconColor} size={14} />
                                )}
                                <Text
                                  numberOfLines={1}
                                  ellipsizeMode="tail"
                                  style={[
                                    styles.contentTabButtonText,
                                    isActive &&
                                      styles.contentTabButtonTextActive,
                                  ]}>
                                  {tab.label}{' '}
                                  {tab.count > 0 ? `(${countLabel})` : ''}
                                </Text>
                                {((tab.key === 'apis' && hasUnreadApis) ||
                                  (tab.key === 'logs' && hasUnreadLogs)) && (
                                  <Animated.View
                                    style={{
                                      width: 6,
                                      height: 6,
                                      borderRadius: 3,
                                      backgroundColor: AppColors.errorColor,
                                      marginLeft: 4,
                                      alignSelf: 'center',
                                      transform: [{scale: unreadPulseAnim}],
                                    }}
                                  />
                                )}
                              </View>
                            </TouchableScale>
                          );
                        })}
                    </ScrollView>
                  </View>
                ) : null}

                {/* ─── Secondary Tab Bar for Analytics ──────────────────────── */}
                {isReady &&
                  activeTab === 'analytics' &&
                  selectedEvent == null && (
                    <View>
                      {/* ─── Search + Shared Toolbar for Analytics ──────────────────────── */}
                      <View
                        style={[
                          styles.toolbarRow,
                          {marginTop: 12, marginBottom: 8},
                        ]}>
                        <View style={styles.searchContainer}>
                          <SearchIcon
                            color={AppColors.grayTextWeak}
                            size={16}
                          />
                          <TextInput
                            placeholder="Search events..."
                            placeholderTextColor={AppColors.grayTextWeak}
                            value={analyticsSearch}
                            onChangeText={setAnalyticsSearch}
                            style={styles.searchInput}
                            autoCorrect={false}
                            autoCapitalize="none"
                          />
                          {analyticsSearch.length > 0 && (
                            <Pressable
                              onPress={() => setAnalyticsSearch('')}
                              hitSlop={10}
                              style={styles.clearBtn}>
                              <ClearIcon
                                color={AppColors.grayTextWeak}
                                size={14}
                              />
                            </Pressable>
                          )}
                        </View>
                        <View style={styles.toolbarRight}>
                          <TouchableScale
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              gap: 4,
                              paddingHorizontal: 10,
                              paddingVertical: 5,
                              borderRadius: 8,
                              backgroundColor: 'rgba(255,46,87,0.06)',
                              borderWidth: 1,
                              borderColor: 'rgba(255,46,87,0.15)',
                            }}
                            onPress={handleDelete}
                            hitSlop={6}>
                            <WipeIcon
                              color={AppColors.errorColor}
                              size={13}
                            />
                            <Text
                              style={{
                                fontFamily: AppFonts.interBold,
                                fontSize: 10.5,
                                color: AppColors.errorColor,
                              }}>
                                Clear
                            </Text>
                          </TouchableScale>
                        </View>
                      </View>
                    </View>
                  )}

                {isReady ? (
                  activeTab === 'insights' ? (
                    <ScrollView
                      style={styles.insightsContainer}
                      contentContainerStyle={styles.insightsContent}
                      showsVerticalScrollIndicator={false}>
                      {renderInsightsDashboard()}
                    </ScrollView>
                  ) : activeTab === 'analytics' ? (
                    <View
                      style={{flex: 1}}
                      onLayout={() => setIsAnalyticsLayoutReady(true)}>
                      {selectedEvent != null ? (
                        <AnalyticsDetail event={selectedEvent} />
                      ) : isAnalyticsLayoutReady ? (
                        <FlatList
                          data={filteredAnalyticsEvents}
                          keyExtractor={(item, index) => item?.id?.toString() ?? index.toString()}
                          renderItem={({item, index}) => {
                            const prev = filteredAnalyticsEvents[index + 1];
                            const next = filteredAnalyticsEvents[index - 1];
                            const msSincePrev = prev
                              ? item.timestamp - prev.timestamp
                              : undefined;
                            const thisMin = Math.floor(item.timestamp / 60000);
                            const nextMin = next
                              ? Math.floor(next.timestamp / 60000)
                              : -1;
                            const showTimestamp =
                              index === 0 || thisMin !== nextMin;
                            return (
                              <AnalyticsEventCard
                                event={item}
                                onPress={() => {
                                  animateNextLayout();
                                  setSelectedEvent(item);
                                }}
                                isNew={newEventIds.has(item.id)}
                                searchStr={analyticsSearch}
                                isFirst={index === 0}
                                isLast={
                                  index === filteredAnalyticsEvents.length - 1
                                }
                                msSincePrev={msSincePrev}
                                showTimestamp={showTimestamp}
                                computedScreenName={(() => {
                                  if (!item) return '';
                                  const rawScreenName =
                                    item.screenName ||
                                    item.screenClass ||
                                    item.pageTitle ||
                                    item.pageLocation ||
                                    item.params?.firebase_screen ||
                                    item.params?.screen_name ||
                                    item.params?.firebase_screen_class ||
                                    item.params?.screen_class;
                                  let screenName = typeof rawScreenName === 'string'
                                    ? rawScreenName
                                    : (rawScreenName ? JSON.stringify(rawScreenName) : '');
                                  const routeInfo = logRouteMapRef.current.get(
                                    item.id + 1000000,
                                  );
                                  if (!screenName) {
                                    if (
                                      routeInfo &&
                                      routeInfo.path !== 'Navigators'
                                    ) {
                                      const parts = routeInfo.path.split(' ➔ ');
                                      screenName = parts[parts.length - 1];
                                    }
                                  }
                                  return screenName;
                                })()}
                              />
                            );
                          }}
                          initialNumToRender={20}
                          maxToRenderPerBatch={20}
                          windowSize={5}
                          removeClippedSubviews={false}
                          ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                              <View style={styles.emptyIconWrap}>
                                <EmptyRadarIcon
                                  color={AppColors.purple}
                                  size={32}
                                />
                              </View>
                              <Text style={styles.emptyTitle}>
                                {analyticsSearch.length > 0
                                  ? 'No matching events'
                                  : 'No analytics events yet'}
                              </Text>
                              <Text style={styles.emptySub}>
                                {analyticsSearch.length > 0
                                  ? 'Try adjusting your search.'
                                  : 'Call setupAnalyticsLogger(analytics()) at app start.'}
                              </Text>
                            </View>
                          }
                          contentContainerStyle={[
                            styles.listContent,
                            filteredAnalyticsEvents.length === 0 && {
                              flexGrow: 1,
                            },
                          ]}
                          keyboardShouldPersistTaps="handled"
                        />
                      ) : null}
                    </View>
                  ) : activeTab === 'apis' && selected == null ? (
                    <View style={{flex: 1}}>
                      <FlatList
                        ref={apisListRef}
                        data={groupedData}
                        keyExtractor={item => item?.id?.toString()}
                        renderItem={renderItem}
                        initialNumToRender={10}
                        maxToRenderPerBatch={10}
                        windowSize={5}
                        removeClippedSubviews={true}
                        ListHeaderComponent={
                          <View style={{marginTop: 8}}>
                            <View style={styles.toolbarRow}>
                              <View style={styles.searchContainer}>
                                <SearchIcon
                                  color={AppColors.grayTextWeak}
                                  size={16}
                                />
                                <TextInput
                                  placeholder="Search endpoints..."
                                  placeholderTextColor={AppColors.grayTextWeak}
                                  value={search}
                                  onChangeText={setSearch}
                                  style={styles.searchInput}
                                  autoCorrect={false}
                                  autoCapitalize="none"
                                />
                                {search.length > 0 && (
                                  <Pressable
                                    onPress={() => setSearch('')}
                                    hitSlop={10}
                                    style={styles.clearBtn}>
                                    <ClearIcon
                                      color={AppColors.grayTextWeak}
                                      size={14}
                                    />
                                  </Pressable>
                                )}
                              </View>

                              <View style={styles.toolbarRight}>
                                <TouchableScale
                                  style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    gap: 4,
                                    paddingHorizontal: 10,
                                    paddingVertical: 5,
                                    borderRadius: 8,
                                    backgroundColor: 'rgba(255,46,87,0.06)',
                                    borderWidth: 1,
                                    borderColor: 'rgba(255,46,87,0.15)',
                                  }}
                                  onPress={handleDelete}
                                  hitSlop={6}>
                                  <WipeIcon
                                    color={AppColors.errorColor}
                                    size={13}
                                  />
                                  <Text
                                    style={{
                                      fontFamily: AppFonts.interBold,
                                      fontSize: 10.5,
                                      color: AppColors.errorColor,
                                    }}>
                                    {selectedLogs.size > 0
                                      ? `Delete (${selectedLogs.size})`
                                      : 'Clear'}
                                  </Text>
                                </TouchableScale>

                                <TouchableScale
                                  style={styles.toolbarBtn}
                                  onPress={() =>
                                    setSortOrder(o =>
                                      o === 'newest' ? 'oldest' : 'newest',
                                    )
                                  }
                                  hitSlop={10}>
                                  <SortArrowIcon
                                    direction={
                                      sortOrder === 'newest' ? 'down' : 'up'
                                    }
                                    color={AppColors.grayTextStrong}
                                    size={18}
                                  />
                                </TouchableScale>

                                <TouchableScale
                                  style={[
                                    styles.toolbarBtn,
                                    filtersAccordion.isOpen &&
                                      styles.toolbarBtnActive,
                                  ]}
                                  onPress={filtersAccordion.toggleOpen}
                                  hitSlop={10}>
                                  <FilterIcon
                                    color={
                                      filtersAccordion.isOpen
                                        ? AppColors.purple
                                        : AppColors.grayTextStrong
                                    }
                                    size={18}
                                  />
                                </TouchableScale>
                              </View>
                            </View>

                            <Animated.View
                              style={[
                                filtersAccordion.bodyStyle,
                                {overflow: 'hidden'},
                              ]}>
                              <View style={styles.filtersContainer}>
                                <Text style={styles.filtersHeading}>
                                  STATUS
                                </Text>
                                <ScrollView
                                  horizontal
                                  showsHorizontalScrollIndicator={false}
                                  contentContainerStyle={
                                    styles.statusRowContent
                                  }>
                                  {STATUS_FILTERS.map(filter => {
                                    const isAll = filter === 'ALL';
                                    const active = isAll
                                      ? statusFilters.size === 0
                                      : statusFilters.has(filter);
                                    return (
                                      <TouchableScale
                                        key={filter}
                                        style={styles.statusFilterWrap}
                                        onPress={() => {
                                          if (isAll) {
                                            setStatusFilters(new Set());
                                          } else {
                                            setStatusFilters(prev => {
                                              const next = new Set(prev);
                                              next.has(filter)
                                                ? next.delete(filter)
                                                : next.add(filter);
                                              return next;
                                            });
                                          }
                                        }}
                                        hitSlop={10}>
                                        {active ? (
                                          <View
                                            style={[
                                              styles.statusFilterChip,
                                              styles.statusFilterActive,
                                              {overflow: 'hidden'},
                                            ]}>
                                            <LinearGradient
                                              colors={[
                                                AppColors.purpleShade50,
                                                '#EAE5FF',
                                              ]}
                                              style={StyleSheet.absoluteFill}
                                              start={{x: 0, y: 0}}
                                              end={{x: 1, y: 0}}
                                            />
                                            <Text
                                              style={[
                                                styles.statusFilterText,
                                                {color: AppColors.purple},
                                              ]}>
                                              {filter}
                                            </Text>
                                          </View>
                                        ) : (
                                          <View style={styles.statusFilterChip}>
                                            <Text
                                              style={styles.statusFilterText}>
                                              {filter}
                                            </Text>
                                          </View>
                                        )}
                                      </TouchableScale>
                                    );
                                  })}
                                </ScrollView>

                                <Text
                                  style={[
                                    styles.filtersHeading,
                                    {marginTop: 16},
                                  ]}>
                                  METHOD
                                </Text>
                                <ScrollView
                                  horizontal
                                  showsHorizontalScrollIndicator={false}
                                  contentContainerStyle={
                                    styles.statusRowContent
                                  }>
                                  {availableMethods.map(filter => {
                                    const isAll = filter === 'ALL';
                                    const active = isAll
                                      ? methodFilters.size === 0
                                      : methodFilters.has(filter as Method);
                                    return (
                                      <TouchableScale
                                        key={filter}
                                        style={styles.statusFilterWrap}
                                        onPress={() => {
                                          if (isAll) {
                                            setMethodFilters(new Set());
                                          } else {
                                            setMethodFilters(prev => {
                                              const next = new Set(prev);
                                              next.has(filter as Method)
                                                ? next.delete(filter as Method)
                                                : next.add(filter as Method);
                                              return next;
                                            });
                                          }
                                        }}
                                        hitSlop={10}>
                                        {active ? (
                                          <View
                                            style={[
                                              styles.statusFilterChip,
                                              styles.statusFilterActive,
                                              {overflow: 'hidden'},
                                            ]}>
                                            <LinearGradient
                                              colors={[
                                                AppColors.purpleShade50,
                                                '#EAE5FF',
                                              ]}
                                              style={StyleSheet.absoluteFill}
                                              start={{x: 0, y: 0}}
                                              end={{x: 1, y: 0}}
                                            />
                                            <Text
                                              style={[
                                                styles.statusFilterText,
                                                {color: AppColors.purple},
                                              ]}>
                                              {filter}
                                            </Text>
                                          </View>
                                        ) : (
                                          <View style={styles.statusFilterChip}>
                                            <Text
                                              style={styles.statusFilterText}>
                                              {filter}
                                            </Text>
                                          </View>
                                        )}
                                      </TouchableScale>
                                    );
                                  })}
                                </ScrollView>
                              </View>
                            </Animated.View>

                            {(search ||
                              statusFilters.size > 0 ||
                              methodFilters.size > 0) && (
                              <Text style={styles.resultCount}>
                                {filteredLogs.length === logs.length
                                  ? `${logs.length} requests`
                                  : `${filteredLogs.length} of ${logs.length} filtered requests`}
                              </Text>
                            )}
                          </View>
                        }
                        ListEmptyComponent={
                          <EmptyState
                            isSearch={
                              search.length > 0 || statusFilters.size > 0
                            }
                          />
                        }
                        contentContainerStyle={[
                          styles.listContent,
                          filteredLogs.length === 0 && {flexGrow: 1},
                        ]}
                        keyboardShouldPersistTaps="handled"
                      />
                      {/* #2 — always-visible scroll-to-top, bottom right */}
                      <TouchableScale
                        onPress={() => {
                          apisListRef.current?.scrollToOffset({
                            offset: 0,
                            animated: true,
                          });
                        }}
                        hitSlop={10}
                        style={styles.scrollTopBtn}>
                        <View style={{transform: [{rotate: '180deg'}]}}>
                          <ChevronIcon color="#FFFFFF" size={18} />
                        </View>
                      </TouchableScale>
                    </View>
                  ) : activeTab === 'logs' ? (
                    <View style={{flex: 1}}>
                      <View
                        style={{
                          backgroundColor: '#FFFFFF',
                          borderBottomWidth: 1,
                          borderBottomColor: AppColors.dividerColor,
                          paddingBottom: 6,
                        }}>
                        <View
                          style={[
                            styles.toolbarRow,
                            {marginTop: 12, marginBottom: 8},
                          ]}>
                          <View style={styles.searchContainer}>
                            <SearchIcon
                              color={AppColors.grayTextWeak}
                              size={16}
                            />
                            <TextInput
                              placeholder="Search logs..."
                              placeholderTextColor={AppColors.grayTextWeak}
                              value={logSearch}
                              onChangeText={setLogSearch}
                              style={styles.searchInput}
                              autoCorrect={false}
                              autoCapitalize="none"
                            />
                            {logSearch.length > 0 && (
                              <Pressable
                                onPress={() => setLogSearch('')}
                                hitSlop={10}
                                style={styles.clearBtn}>
                                <ClearIcon
                                  color={AppColors.grayTextWeak}
                                  size={14}
                                />
                              </Pressable>
                            )}
                          </View>

                          <View style={styles.toolbarRight}>
                            <TouchableScale
                              style={styles.toolbarBtn}
                              onPress={() =>
                                setLogSortOrder(o =>
                                  o === 'newest' ? 'oldest' : 'newest',
                                )
                              }
                              hitSlop={10}>
                              <SortArrowIcon
                                color={AppColors.grayTextStrong}
                                size={18}
                                direction={
                                  logSortOrder === 'newest' ? 'down' : 'up'
                                }
                              />
                            </TouchableScale>
                            <TouchableScale
                              style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 4,
                                paddingHorizontal: 10,
                                paddingVertical: 5,
                                borderRadius: 8,
                                backgroundColor: 'rgba(255,46,87,0.06)',
                                borderWidth: 1,
                                borderColor: 'rgba(255,46,87,0.15)',
                              }}
                              onPress={handleDelete}
                              hitSlop={6}>
                              <WipeIcon
                                color={AppColors.errorColor}
                                size={13}
                              />
                              <Text
                                style={{
                                  fontFamily: AppFonts.interBold,
                                  fontSize: 10.5,
                                  color: AppColors.errorColor,
                                }}>
                                Clear
                              </Text>
                            </TouchableScale>
                          </View>
                        </View>

                        <ScrollView
                          horizontal
                          showsHorizontalScrollIndicator={false}
                          style={{marginVertical: 4, maxHeight: 46}}
                          contentContainerStyle={{
                            paddingHorizontal: 16,
                            paddingBottom: 4,
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 8,
                          }}>
                          {(() => {
                            const active = logFilters.has('all');
                            return (
                              <TouchableScale
                                onPress={() => {
                                  setLogFilters(new Set(['all']));
                                }}>
                                <View
                                  style={[
                                    styles.statusFilterChip,
                                    active && {
                                      borderColor: AppColors.purpleShade700,
                                      backgroundColor: '#F4EBFF',
                                    },
                                  ]}>
                                  {/* #7 */}
                                  <View
                                    style={{
                                      flexDirection: 'row',
                                      alignItems: 'center',
                                      gap: 5,
                                    }}>
                                    <LayersIcon
                                      size={12}
                                      color={
                                        active
                                          ? AppColors.purpleShade700
                                          : AppColors.grayTextStrong
                                      }
                                    />
                                    <Text
                                      numberOfLines={1}
                                      style={[
                                        styles.statusFilterText,
                                        active && {
                                          color: AppColors.purpleShade700,
                                          fontFamily: AppFonts.interBold,
                                        },
                                      ]}>
                                      All ({logCounts.all})
                                    </Text>
                                  </View>
                                </View>
                              </TouchableScale>
                            );
                          })()}

                          {(() => {
                            const active = logFilters.has('user-log');
                            return (
                              <TouchableScale
                                onPress={() => {
                                  setLogFilters(prev => {
                                    const next = new Set(prev);
                                    next.delete('all');
                                    next.has('user-log')
                                      ? next.delete('user-log')
                                      : next.add('user-log');
                                    if (next.size === 0) next.add('all');
                                    return next;
                                  });
                                }}>
                                <View
                                  style={[
                                    styles.statusFilterChip,
                                    active && {
                                      borderColor: '#64748B',
                                      backgroundColor: '#F1F5F9',
                                    },
                                  ]}>
                                  {/* #7 */}
                                  <View
                                    style={{
                                      flexDirection: 'row',
                                      alignItems: 'center',
                                      gap: 5,
                                    }}>
                                    <UserIcon
                                      size={12}
                                      color={
                                        active
                                          ? '#334155'
                                          : AppColors.grayTextStrong
                                      }
                                    />
                                    <Text
                                      numberOfLines={1}
                                      style={[
                                        styles.statusFilterText,
                                        active && {
                                          color: '#334155',
                                          fontFamily: AppFonts.interBold,
                                        },
                                      ]}>
                                      User Log ({logCounts['user-log']})
                                    </Text>
                                  </View>
                                </View>
                              </TouchableScale>
                            );
                          })()}

                          {(() => {
                            const active = logFilters.has('info');
                            return (
                              <TouchableScale
                                onPress={() => {
                                  setLogFilters(prev => {
                                    const next = new Set(prev);
                                    next.delete('all');
                                    next.has('info')
                                      ? next.delete('info')
                                      : next.add('info');
                                    if (next.size === 0) next.add('all');
                                    return next;
                                  });
                                }}>
                                <View
                                  style={[
                                    styles.statusFilterChip,
                                    active && {
                                      borderColor: AppColors.purple,
                                      backgroundColor: AppColors.purpleShade50,
                                    },
                                  ]}>
                                  {/* #7 */}
                                  <View
                                    style={{
                                      flexDirection: 'row',
                                      alignItems: 'center',
                                      gap: 5,
                                    }}>
                                    <InfoCircleIcon
                                      size={12}
                                      color={
                                        active
                                          ? AppColors.purple
                                          : AppColors.grayTextStrong
                                      }
                                    />
                                    <Text
                                      numberOfLines={1}
                                      style={[
                                        styles.statusFilterText,
                                        active && {
                                          color: AppColors.purple,
                                          fontFamily: AppFonts.interBold,
                                        },
                                      ]}>
                                      Info ({logCounts.info})
                                    </Text>
                                  </View>
                                </View>
                              </TouchableScale>
                            );
                          })()}

                          {(() => {
                            const active = logFilters.has('warn');
                            return (
                              <TouchableScale
                                onPress={() => {
                                  setLogFilters(prev => {
                                    const next = new Set(prev);
                                    next.delete('all');
                                    next.has('warn')
                                      ? next.delete('warn')
                                      : next.add('warn');
                                    if (next.size === 0) next.add('all');
                                    return next;
                                  });
                                }}>
                                <View
                                  style={[
                                    styles.statusFilterChip,
                                    active && {
                                      borderColor: AppColors.lightOrange,
                                      backgroundColor: '#FFFDF6',
                                    },
                                  ]}>
                                  {/* #7 */}
                                  <View
                                    style={{
                                      flexDirection: 'row',
                                      alignItems: 'center',
                                      gap: 5,
                                    }}>
                                    <WarningTriangleIcon
                                      size={12}
                                      color={
                                        active
                                          ? AppColors.darkOrange ||
                                            AppColors.lightOrange
                                          : AppColors.grayTextStrong
                                      }
                                    />
                                    <Text
                                      numberOfLines={1}
                                      style={[
                                        styles.statusFilterText,
                                        active && {
                                          color:
                                            AppColors.darkOrange ||
                                            AppColors.lightOrange,
                                          fontFamily: AppFonts.interBold,
                                        },
                                      ]}>
                                      Warning ({logCounts.warn})
                                    </Text>
                                  </View>
                                </View>
                              </TouchableScale>
                            );
                          })()}

                          {(() => {
                            const active = logFilters.has('error');
                            return (
                              <TouchableScale
                                onPress={() => {
                                  setLogFilters(prev => {
                                    const next = new Set(prev);
                                    next.delete('all');
                                    next.has('error')
                                      ? next.delete('error')
                                      : next.add('error');
                                    if (next.size === 0) next.add('all');
                                    return next;
                                  });
                                }}>
                                <View
                                  style={[
                                    styles.statusFilterChip,
                                    active && {
                                      borderColor: AppColors.errorColor,
                                      backgroundColor: '#FFF5F6',
                                    },
                                  ]}>
                                  {/* #7 */}
                                  <View
                                    style={{
                                      flexDirection: 'row',
                                      alignItems: 'center',
                                      gap: 5,
                                    }}>
                                    <ErrorCircleIcon
                                      size={12}
                                      color={
                                        active
                                          ? AppColors.errorColor
                                          : AppColors.grayTextStrong
                                      }
                                    />
                                    <Text
                                      numberOfLines={1}
                                      style={[
                                        styles.statusFilterText,
                                        active && {
                                          color: AppColors.errorColor,
                                          fontFamily: AppFonts.interBold,
                                        },
                                      ]}>
                                      Error ({logCounts.error})
                                    </Text>
                                  </View>
                                </View>
                              </TouchableScale>
                            );
                          })()}

                          {(() => {
                            const active = logFilters.has('analytics');
                            return (
                              <TouchableScale
                                onPress={() => {
                                  setLogFilters(prev => {
                                    const next = new Set(prev);
                                    next.delete('all');
                                    next.has('analytics')
                                      ? next.delete('analytics')
                                      : next.add('analytics');
                                    if (next.size === 0) next.add('all');
                                    return next;
                                  });
                                }}>
                                <View
                                  style={[
                                    styles.statusFilterChip,
                                    active && {
                                      borderColor: AppColors.skyBlue,
                                      backgroundColor: `${AppColors.skyBlue}15`,
                                    },
                                  ]}>
                                  {/* #7 */}
                                  <View
                                    style={{
                                      flexDirection: 'row',
                                      alignItems: 'center',
                                      gap: 5,
                                    }}>
                                    <AnalyticsIcon
                                      size={12}
                                      color={
                                        active
                                          ? AppColors.skyBlue
                                          : AppColors.grayTextStrong
                                      }
                                    />
                                    <Text
                                      numberOfLines={1}
                                      style={[
                                        styles.statusFilterText,
                                        active && {
                                          color: AppColors.skyBlue,
                                          fontFamily: AppFonts.interBold,
                                        },
                                      ]}>
                                      Analytics ({logCounts.analytics})
                                    </Text>
                                  </View>
                                </View>
                              </TouchableScale>
                            );
                          })()}
                        </ScrollView>
                      </View>

                      <FlatList
                        data={filteredConsoleLogs}
                        keyExtractor={(item, index) => item?.id?.toString() ?? index.toString()}
                        ListHeaderComponent={(() => {
                          const total = visibleConsoleLogs.length;
                          const filtered = filteredConsoleLogs.length;
                          const isAllSelected =
                            logFilters.has('all') ||
                            !Array.from(logFilters).some(f => f !== 'all');
                          if (isAllSelected) {
                            return (
                              <Text
                                style={[
                                  styles.resultCount,
                                  {marginBottom: 4, marginTop: 12},
                                ]}>
                                Showing ({filtered}/{total}) logs showing
                              </Text>
                            );
                          } else {
                            const activeFilterNames = Array.from(logFilters)
                              .filter(f => f !== 'all')
                              .map(f => {
                                if (f === 'user-log') return 'User Log';
                                if (f === 'analytics') return 'Analytics';
                                return (
                                  (f as string).charAt(0).toUpperCase() +
                                  (f as string).slice(1)
                                );
                              });
                            return (
                              <Text
                                style={[
                                  styles.resultCount,
                                  {marginBottom: 4, marginTop: 12},
                                ]}>
                                Filtering with {activeFilterNames.join(', ')} (
                                {filtered}/{total}) logs is showing
                              </Text>
                            );
                          }
                        })()}
                        renderItem={({item, index}) => (
                          <AnimatedEntrance index={index} distance={8}>
                            <ConsoleLogCard item={item} searchStr={logSearch} />
                          </AnimatedEntrance>
                        )}
                        initialNumToRender={15}
                        maxToRenderPerBatch={15}
                        windowSize={7}
                        removeClippedSubviews={true}
                        ListEmptyComponent={
                          <EmptyState
                            isSearch={
                              logSearch.length > 0 || logFilters.size > 0
                            }
                          />
                        }
                        contentContainerStyle={[
                          styles.listContent,
                          filteredConsoleLogs.length === 0 && {flexGrow: 1},
                        ]}
                        keyboardShouldPersistTaps="handled"
                      />
                    </View>
                  ) : activeTab === 'webview' ? (
                    webViewNavHistory.length === 0 ? (
                      <View style={styles.emptyContainer}>
                        <View style={styles.emptyIconWrap}>
                          <GlobeIcon color={AppColors.purple} size={32} />
                        </View>
                        <Text style={styles.emptyTitle}>
                          No WebView Activity
                        </Text>
                        <Text style={styles.emptySub}>
                          Load a webpage within a connected WebView component to
                          inspect pages, page source, and console logs.
                        </Text>
                      </View>
                    ) : (
                      <View style={{flex: 1}}>
                        {/* ─── Current Page Address Bar (Now on top) ─── */}
                        {(() => {
                          const currentUrl = webViewNavHistory[0]?.url;
                          if (!currentUrl) return null;
                          return (
                            <View
                              style={{
                                paddingHorizontal: 12,
                                paddingTop: 6,
                                paddingBottom: 6,
                                backgroundColor: AppColors.primaryLight,
                                borderBottomWidth: 1,
                                borderBottomColor: AppColors.dividerColor,
                              }}>
                              <View
                                style={{
                                  flexDirection: 'row',
                                  alignItems: 'center',
                                  backgroundColor: AppColors.grayBackground,
                                  borderRadius: 8,
                                  borderWidth: 1.5,
                                  borderColor: AppColors.grayBorderSecondary,
                                  paddingHorizontal: 10,
                                  paddingVertical: 5,
                                  gap: 8,
                                }}>
                                {/* Left: Lock and HTTPS label */}
                                <View
                                  style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    gap: 4,
                                  }}>
                                  <Text style={{fontSize: 11}}>🔒</Text>
                                  <Text
                                    style={{
                                      fontFamily: AppFonts.interBold,
                                      fontSize: 9.5,
                                      color: AppColors.greenColor,
                                      letterSpacing: 0.5,
                                    }}>
                                    HTTPS
                                  </Text>
                                </View>
                                <View
                                  style={{
                                    width: 1.5,
                                    height: 12,
                                    backgroundColor:
                                      AppColors.grayBorderSecondary,
                                  }}
                                />

                                {/* Middle: URL text (Address style) */}
                                <View style={{flex: 1}}>
                                  <HighlightText
                                    text={currentUrl}
                                    search={webViewSearch}
                                    numberOfLines={1}
                                    ellipsizeMode="tail"
                                    style={{
                                      fontFamily: AppFonts.interMedium,
                                      fontSize: 11.5,
                                      color: AppColors.primaryBlack,
                                    }}
                                    highlightStyle={styles.highlight}
                                    detectLinks={false}
                                  />
                                </View>

                                {/* Right: Copy Button */}
                                <CopyButton value={currentUrl} label="URL" />

                                {/* Right: Globe Icon button to open browser */}
                                <TouchableScale
                                  onPress={() => Linking.openURL(currentUrl)}
                                  hitSlop={8}
                                  style={{
                                    width: 26,
                                    height: 26,
                                    borderRadius: 13,
                                    backgroundColor: AppColors.grayBackground,
                                    borderWidth: 1,
                                    borderColor: AppColors.grayBorderSecondary,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                  }}>
                                  <GlobeIcon
                                    size={11}
                                    color={AppColors.purple}
                                  />
                                </TouchableScale>
                              </View>
                            </View>
                          );
                        })()}

                        {/* ─── WebView Sub-Tabs (Now below Address Bar) ─── */}
                        <View
                          style={{
                            backgroundColor: AppColors.primaryLight,
                            borderBottomWidth: 1,
                            borderBottomColor: AppColors.dividerColor,
                            paddingVertical: 6,
                          }}>
                          <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={{
                              paddingHorizontal: 12,
                              flexDirection: 'row',
                              gap: 8,
                            }}>
                            {/* Sub-tab 1: Preview */}
                            <Pressable
                              style={[
                                {
                                  paddingVertical: 6,
                                  paddingHorizontal: 14,
                                  borderRadius: 8,
                                  alignItems: 'center',
                                  flexDirection: 'row',
                                  gap: 6,
                                  backgroundColor: 'rgba(0, 0, 0, 0.03)',
                                  borderWidth: 1,
                                  borderColor: 'transparent',
                                },
                                webViewSubTab === 'preview' && {
                                  backgroundColor: AppColors.purple,
                                  borderColor: AppColors.purple,
                                },
                              ]}
                              onPress={() => {
                                animateNextLayout();
                                setWebViewSubTab('preview');
                              }}>
                              <EyeIcon
                                color={
                                  webViewSubTab === 'preview'
                                    ? '#FFFFFF'
                                    : AppColors.grayTextWeak
                                }
                                size={13}
                              />
                              <Text
                                style={{
                                  fontFamily:
                                    webViewSubTab === 'preview'
                                      ? AppFonts.interBold
                                      : AppFonts.interMedium,
                                  fontSize: 12,
                                  color:
                                    webViewSubTab === 'preview'
                                      ? '#FFFFFF'
                                      : AppColors.grayTextStrong,
                                }}>
                                Preview
                              </Text>
                            </Pressable>

                            {/* Sub-tab 2: Page Source */}
                            <Pressable
                              style={[
                                {
                                  paddingVertical: 6,
                                  paddingHorizontal: 14,
                                  borderRadius: 8,
                                  alignItems: 'center',
                                  flexDirection: 'row',
                                  gap: 6,
                                  backgroundColor: 'rgba(0, 0, 0, 0.03)',
                                  borderWidth: 1,
                                  borderColor: 'transparent',
                                },
                                webViewSubTab === 'html' && {
                                  backgroundColor: AppColors.purple,
                                  borderColor: AppColors.purple,
                                },
                              ]}
                              onPress={() => {
                                animateNextLayout();
                                setWebViewSubTab('html');
                              }}>
                              <HtmlIcon
                                color={
                                  webViewSubTab === 'html'
                                    ? '#FFFFFF'
                                    : AppColors.grayTextWeak
                                }
                                size={13}
                              />
                              <Text
                                style={{
                                  fontFamily:
                                    webViewSubTab === 'html'
                                      ? AppFonts.interBold
                                      : AppFonts.interMedium,
                                  fontSize: 12,
                                  color:
                                    webViewSubTab === 'html'
                                      ? '#FFFFFF'
                                      : AppColors.grayTextStrong,
                                }}>
                                Page Source
                              </Text>
                            </Pressable>

                            {/* Sub-tab 3: History */}
                            <Pressable
                              style={[
                                {
                                  paddingVertical: 6,
                                  paddingHorizontal: 14,
                                  borderRadius: 8,
                                  alignItems: 'center',
                                  flexDirection: 'row',
                                  gap: 6,
                                  backgroundColor: 'rgba(0, 0, 0, 0.03)',
                                  borderWidth: 1,
                                  borderColor: 'transparent',
                                },
                                webViewSubTab === 'navigation' && {
                                  backgroundColor: AppColors.purple,
                                  borderColor: AppColors.purple,
                                },
                              ]}
                              onPress={() => {
                                animateNextLayout();
                                setWebViewSubTab('navigation');
                              }}>
                              <ClockIcon
                                color={
                                  webViewSubTab === 'navigation'
                                    ? '#FFFFFF'
                                    : AppColors.grayTextWeak
                                }
                                size={13}
                              />
                              <Text
                                style={{
                                  fontFamily:
                                    webViewSubTab === 'navigation'
                                      ? AppFonts.interBold
                                      : AppFonts.interMedium,
                                  fontSize: 12,
                                  color:
                                    webViewSubTab === 'navigation'
                                      ? '#FFFFFF'
                                      : AppColors.grayTextStrong,
                                }}>
                                History ({webViewNavHistory.length})
                              </Text>
                            </Pressable>

                            {/* Sub-tab 4: Console */}
                            <Pressable
                              style={[
                                {
                                  paddingVertical: 6,
                                  paddingHorizontal: 14,
                                  borderRadius: 8,
                                  alignItems: 'center',
                                  flexDirection: 'row',
                                  gap: 6,
                                  backgroundColor: 'rgba(0, 0, 0, 0.03)',
                                  borderWidth: 1,
                                  borderColor: 'transparent',
                                },
                                webViewSubTab === 'console' && {
                                  backgroundColor: AppColors.purple,
                                  borderColor: AppColors.purple,
                                },
                              ]}
                              onPress={() => {
                                animateNextLayout();
                                setWebViewSubTab('console');
                              }}>
                              <TerminalIcon
                                color={
                                  webViewSubTab === 'console'
                                    ? '#FFFFFF'
                                    : AppColors.grayTextWeak
                                }
                                size={13}
                              />
                              <Text
                                style={{
                                  fontFamily:
                                    webViewSubTab === 'console'
                                      ? AppFonts.interBold
                                      : AppFonts.interMedium,
                                  fontSize: 12,
                                  color:
                                    webViewSubTab === 'console'
                                      ? '#FFFFFF'
                                      : AppColors.grayTextStrong,
                                }}>
                                Console ({webViewLogs.length})
                              </Text>
                            </Pressable>
                          </ScrollView>
                        </View>

                        {webViewSubTab === 'html' ? (
                          <View style={{flex: 1}}>
                            {webViewHtml || webViewCss || webViewJs ? (
                              <View style={{flex: 1}}>
                                {/* Clear Inspect Banner */}
                                {inspectedElement && (
                                  <View
                                    style={{
                                      flexDirection: 'row',
                                      alignItems: 'center',
                                      justifyContent: 'space-between',
                                      backgroundColor: AppColors.purpleShade50,
                                      paddingHorizontal: 12,
                                      paddingVertical: 6,
                                      borderBottomWidth: 1,
                                      borderBottomColor: AppColors.dividerColor,
                                    }}>
                                    <Text
                                      style={{
                                        fontFamily: AppFonts.interMedium,
                                        fontSize: 11.5,
                                        color: AppColors.purple,
                                        flex: 1,
                                      }}>
                                      Inspecting element:{' '}
                                      <Text
                                        style={{
                                          fontFamily: AppFonts.interBold,
                                        }}>
                                        &lt;{inspectedElement.tagName}
                                        {inspectedElement.id
                                          ? ` id="${inspectedElement.id}"`
                                          : ''}
                                        {inspectedElement.className
                                          ? ` class="${
                                              inspectedElement.className
                                                .trim()
                                                .split(/\s+/)[0]
                                            }"`
                                          : ''}
                                        &gt;
                                      </Text>
                                    </Text>
                                    <Pressable
                                      onPress={() => setInspectedElement(null)}
                                      style={{
                                        paddingHorizontal: 8,
                                        paddingVertical: 4,
                                      }}>
                                      <Text
                                        style={{
                                          fontFamily: AppFonts.interBold,
                                          fontSize: 11,
                                          color: AppColors.purple,
                                        }}>
                                        Clear Inspect
                                      </Text>
                                    </Pressable>
                                  </View>
                                )}

                                {/* Inner sub-tabs inside HTML source view */}
                                <View
                                  style={{
                                    flexDirection: 'row',
                                    borderBottomWidth: 1,
                                    borderBottomColor: AppColors.dividerColor,
                                    backgroundColor: AppColors.primaryLight,
                                    paddingHorizontal: 12,
                                    gap: 12,
                                  }}>
                                  {(['html', 'css', 'javascript'] as const).map(
                                    tab => {
                                      const active = htmlSubTab === tab;
                                      const label =
                                        tab === 'html'
                                          ? 'HTML'
                                          : tab === 'css'
                                          ? 'CSS'
                                          : 'JavaScript';
                                      const activeColor =
                                        tab === 'html'
                                          ? '#EA580C' // Orange
                                          : tab === 'css'
                                          ? '#2563EB' // Blue
                                          : '#D97706'; // Dark Yellow/Amber
                                      return (
                                        <Pressable
                                          key={tab}
                                          onPress={() => {
                                            animateNextLayout();
                                            setHtmlSubTab(tab);
                                          }}
                                          style={{
                                            paddingVertical: 8,
                                            paddingHorizontal: 4,
                                            borderBottomWidth: 2,
                                            borderBottomColor: active
                                              ? activeColor
                                              : 'transparent',
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            gap: 4,
                                          }}>
                                          {tab === 'html' && (
                                            <HtmlIcon
                                              color={
                                                active
                                                  ? activeColor
                                                  : AppColors.grayTextWeak
                                              }
                                              size={14}
                                            />
                                          )}
                                          {tab === 'css' && (
                                            <CssIcon
                                              color={
                                                active
                                                  ? activeColor
                                                  : AppColors.grayTextWeak
                                              }
                                              size={14}
                                            />
                                          )}
                                          {tab === 'javascript' && (
                                            <JsIcon
                                              color={
                                                active
                                                  ? activeColor
                                                  : AppColors.grayTextWeak
                                              }
                                              size={14}
                                            />
                                          )}
                                          <Text
                                            style={{
                                              fontFamily: active
                                                ? AppFonts.interBold
                                                : AppFonts.interMedium,
                                              fontSize: 13,
                                              color: active
                                                ? activeColor
                                                : AppColors.grayTextWeak,
                                            }}>
                                            {label}
                                          </Text>
                                        </Pressable>
                                      );
                                    },
                                  )}
                                </View>
                                <View style={{flex: 1, padding: 12}}>
                                  {!isHtmlTabReady ? (
                                    <View
                                      style={{
                                        flex: 1,
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        minHeight: 200,
                                      }}>
                                      <ActivityIndicator
                                        size="large"
                                        color={AppColors.purple}
                                      />
                                    </View>
                                  ) : htmlSubTab === 'html' ? (
                                    webViewHtml ? (
                                      <CodeSnippet
                                        code={webViewHtml}
                                        language="html"
                                        search={getSearchTermForTab()}
                                      />
                                    ) : (
                                      <Text
                                        style={{
                                          fontFamily: 'monospace',
                                          fontSize: 11,
                                          color: '#94A3B8',
                                          padding: 12,
                                        }}>
                                        No HTML content captured.
                                      </Text>
                                    )
                                  ) : htmlSubTab === 'css' ? (
                                    webViewCss ? (
                                      <CodeSnippet
                                        code={webViewCss}
                                        language="css"
                                        search={getSearchTermForTab()}
                                      />
                                    ) : (
                                      <Text
                                        style={{
                                          fontFamily: 'monospace',
                                          fontSize: 11,
                                          color: '#94A3B8',
                                          padding: 12,
                                        }}>
                                        No CSS styles detected on this page.
                                      </Text>
                                    )
                                  ) : webViewJs ? (
                                    <CodeSnippet
                                      code={webViewJs}
                                      language="javascript"
                                      search={getSearchTermForTab()}
                                    />
                                  ) : (
                                    <Text
                                      style={{
                                        fontFamily: 'monospace',
                                        fontSize: 11,
                                        color: '#94A3B8',
                                        padding: 12,
                                      }}>
                                      No scripts detected on this page.
                                    </Text>
                                  )}
                                </View>
                              </View>
                            ) : (
                              <View style={styles.emptyContainer}>
                                <View style={styles.emptyIconWrap}>
                                  <GlobeIcon
                                    color={AppColors.purple}
                                    size={32}
                                  />
                                </View>
                                <Text style={styles.emptyTitle}>
                                  No Page Source Captured
                                </Text>
                                <Text style={styles.emptySub}>
                                  Load a page in the WebView to inspect its
                                  HTML, CSS, or Javascript source.
                                </Text>
                              </View>
                            )}
                          </View>
                        ) : webViewSubTab === 'navigation' ? (
                          <FlatList
                            data={filteredNavHistory}
                            keyExtractor={(
                              item: WebViewNavState,
                              index: number,
                            ) => `${index}-${item.timestamp}`}
                            style={{
                              flex: 1,
                              backgroundColor: AppColors.grayBackground,
                            }}
                            ListHeaderComponent={
                              <View
                                style={{
                                  paddingHorizontal: 16,
                                  paddingTop: 12,
                                  paddingBottom: 8,
                                }}>
                                <Text style={styles.resultCount}>
                                  Navigation History ({webViewNavHistory.length}
                                  )
                                </Text>
                              </View>
                            }
                            renderItem={({
                              item,
                              index,
                            }: {
                              item: WebViewNavState;
                              index: number;
                            }) => {
                              const isLatest = index === 0;
                              const formatNavTime = (ts: number): string => {
                                const d = new Date(ts);
                                return `${String(d.getHours()).padStart(
                                  2,
                                  '0',
                                )}:${String(d.getMinutes()).padStart(
                                  2,
                                  '0',
                                )}:${String(d.getSeconds()).padStart(2, '0')}`;
                              };
                              return (
                                <AnimatedEntrance
                                  index={index}
                                  distance={8}
                                  style={{
                                    marginHorizontal: 16,
                                    marginVertical: 6,
                                    borderRadius: 12,
                                    borderWidth: 1,
                                    borderColor: AppColors.grayBorderSecondary,
                                    backgroundColor: isLatest
                                      ? AppColors.purpleShade50
                                      : AppColors.primaryLight,
                                    padding: 14,
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    gap: 12,
                                    shadowColor: '#000000',
                                    shadowOffset: {width: 0, height: 2},
                                    shadowOpacity: isDark ? 0.2 : 0.04,
                                    shadowRadius: 4,
                                    elevation: 2,
                                  }}>
                                  <View style={{flex: 1, gap: 8}}>
                                    {/* Top row: Title and Badge */}
                                    <View
                                      style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        gap: 8,
                                        flexWrap: 'wrap',
                                      }}>
                                      <Text
                                        numberOfLines={1}
                                        ellipsizeMode="tail"
                                        style={{
                                          fontFamily: AppFonts.interBold,
                                          fontSize: 14,
                                          color: AppColors.primaryBlack,
                                          flexShrink: 1,
                                        }}>
                                        {item.title || 'Untitled Page'}
                                      </Text>
                                      {isLatest && (
                                        <View
                                          style={{
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            gap: 4,
                                            backgroundColor:
                                              AppColors.greenStatus,
                                            paddingHorizontal: 8,
                                            paddingVertical: 3,
                                            borderRadius: 12,
                                          }}>
                                          <View
                                            style={{
                                              width: 6,
                                              height: 6,
                                              borderRadius: 3,
                                              backgroundColor:
                                                AppColors.greenBaggageText,
                                            }}
                                          />
                                          <Text
                                            style={{
                                              fontFamily: AppFonts.interBold,
                                              fontSize: 9.5,
                                              color: AppColors.greenBaggageText,
                                            }}>
                                            Active
                                          </Text>
                                        </View>
                                      )}
                                    </View>

                                    {/* Middle row: URL with Globe Icon */}
                                    <View
                                      style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        gap: 6,
                                      }}>
                                      <GlobeIcon
                                        size={12}
                                        color={AppColors.grayTextWeak}
                                      />
                                      <HighlightText
                                        text={item.url}
                                        search={webViewSearch}
                                        numberOfLines={2}
                                        ellipsizeMode="tail"
                                        style={{
                                          fontFamily: AppFonts.interRegular,
                                          fontSize: 12,
                                          color: AppColors.grayText,
                                          flex: 1,
                                        }}
                                        highlightStyle={styles.highlight}
                                        detectLinks={true}
                                      />
                                    </View>

                                    {/* Bottom row: Time */}
                                    <View
                                      style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        gap: 6,
                                      }}>
                                      <ClockIcon
                                        size={11}
                                        color={AppColors.grayTextWeak}
                                      />
                                      <Text
                                        style={{
                                          fontFamily: AppFonts.interRegular,
                                          fontSize: 11,
                                          color: AppColors.grayTextWeak,
                                        }}>
                                        {formatNavTime(item.timestamp)}
                                      </Text>
                                    </View>
                                  </View>
                                  <CopyButton value={item.url} label="URL" />
                                </AnimatedEntrance>
                              );
                            }}
                            initialNumToRender={15}
                            maxToRenderPerBatch={15}
                            windowSize={7}
                            removeClippedSubviews={true}
                            ListEmptyComponent={
                              <EmptyState isSearch={webViewSearch.length > 0} />
                            }
                            contentContainerStyle={[
                              styles.listContent,
                              filteredNavHistory.length === 0 && {
                                flexGrow: 1,
                              },
                            ]}
                            keyboardShouldPersistTaps="handled"
                          />
                        ) : webViewSubTab === 'console' ? (
                          <View
                            style={{
                              flex: 1,
                              backgroundColor: AppColors.grayBackground,
                            }}>
                            {webViewLogs.length > 0 ? (
                              <FlatList
                                data={webViewLogs}
                                keyExtractor={(item: WebViewLog) =>
                                  String(item.id)
                                }
                                style={{flex: 1}}
                                ListHeaderComponent={
                                  <View
                                    style={{
                                      paddingHorizontal: 16,
                                      paddingTop: 12,
                                      paddingBottom: 8,
                                      flexDirection: 'row',
                                      justifyContent: 'space-between',
                                      alignItems: 'center',
                                    }}>
                                    <Text style={styles.resultCount}>
                                      Console Logs ({webViewLogs.length})
                                    </Text>
                                    <TouchableScale
                                      onPress={() => clearWebViewData()}
                                      style={{
                                        padding: 6,
                                        borderRadius: 6,
                                        backgroundColor: AppColors.primaryLight,
                                        borderWidth: 1,
                                        borderColor:
                                          AppColors.grayBorderSecondary,
                                      }}>
                                      <TrashIcon
                                        color={AppColors.errorColor}
                                        size={14}
                                      />
                                    </TouchableScale>
                                  </View>
                                }
                                renderItem={({item}: {item: WebViewLog}) => {
                                  const logColor =
                                    item.type === 'error'
                                      ? AppColors.errorColor
                                      : item.type === 'warn'
                                      ? AppColors.warningIconGold
                                      : item.type === 'info'
                                      ? AppColors.skyBlue
                                      : AppColors.grayTextWeak;
                                  const bgColor =
                                    item.type === 'error'
                                      ? 'rgba(255, 46, 87, 0.06)'
                                      : item.type === 'warn'
                                      ? 'rgba(191, 162, 82, 0.08)'
                                      : AppColors.primaryLight;
                                  const d = new Date(item.timestamp);
                                  const timeStr = `${String(
                                    d.getHours(),
                                  ).padStart(2, '0')}:${String(
                                    d.getMinutes(),
                                  ).padStart(2, '0')}:${String(
                                    d.getSeconds(),
                                  ).padStart(2, '0')}`;
                                  return (
                                    <AnimatedEntrance
                                      index={item.id}
                                      distance={8}
                                      style={{
                                        marginHorizontal: 12,
                                        marginVertical: 3,
                                        borderRadius: 8,
                                        borderWidth: 1,
                                        borderColor:
                                          AppColors.grayBorderSecondary,
                                        borderLeftWidth: 3,
                                        borderLeftColor: logColor,
                                        backgroundColor: bgColor,
                                        padding: 10,
                                        flexDirection: 'row',
                                        gap: 8,
                                        alignItems: 'flex-start',
                                      }}>
                                      <View style={{paddingTop: 1}}>
                                        <TerminalIcon
                                          color={logColor}
                                          size={11}
                                        />
                                      </View>
                                      <View style={{flex: 1, gap: 3}}>
                                        <View
                                          style={{
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                          }}>
                                          <Text
                                            style={{
                                              fontFamily: AppFonts.interBold,
                                              fontSize: 10,
                                              color: logColor,
                                              textTransform: 'uppercase',
                                              letterSpacing: 0.5,
                                            }}>
                                            {item.type}
                                          </Text>
                                          <Text
                                            style={{
                                              fontFamily: AppFonts.interRegular,
                                              fontSize: 10,
                                              color: AppColors.grayTextWeak,
                                            }}>
                                            {timeStr}
                                          </Text>
                                        </View>
                                        <Text
                                          style={{
                                            fontFamily: AppFonts.interRegular,
                                            fontSize: 12,
                                            color: AppColors.primaryBlack,
                                            lineHeight: 16,
                                          }}>
                                          {item.message}
                                        </Text>
                                      </View>
                                    </AnimatedEntrance>
                                  );
                                }}
                                initialNumToRender={20}
                                maxToRenderPerBatch={20}
                                windowSize={7}
                                contentContainerStyle={[
                                  styles.listContent,
                                  webViewLogs.length === 0 && {flexGrow: 1},
                                ]}
                              />
                            ) : (
                              <View style={styles.emptyContainer}>
                                <View style={styles.emptyIconWrap}>
                                  <TerminalIcon
                                    color={AppColors.purple}
                                    size={32}
                                  />
                                </View>
                                <Text style={styles.emptyTitle}>
                                  No Console Logs
                                </Text>
                                <Text style={styles.emptySub}>
                                  Console logs from the WebView will appear
                                  here.
                                </Text>
                              </View>
                            )}
                          </View>
                        ) : (
                          <View
                            style={{
                              flex: 1,
                              backgroundColor: AppColors.grayBackground,
                            }}>
                            {webViewHtml ? (
                              OriginalWebView ? (
                                <OriginalWebView
                                  source={{
                                    html: webViewHtml,
                                    baseUrl: webViewHtmlUrl,
                                  }}
                                  injectedJavaScript={previewInspectScript}
                                  onMessage={(event: any) => {
                                    try {
                                      const data = JSON.parse(
                                        event.nativeEvent.data,
                                      );
                                      if (data.type === 'preview-inspect') {
                                        setInspectedElement({
                                          tagName: data.tagName,
                                          id: data.id,
                                          className: data.className,
                                          searchStr: data.searchStr,
                                        });
                                        setWebViewSubTab('html');
                                        setHtmlSubTab('html');
                                      }
                                    } catch (err) {}
                                  }}
                                  style={{flex: 1}}
                                />
                              ) : (
                                <View
                                  style={{
                                    flex: 1,
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    padding: 20,
                                  }}>
                                  <Text
                                    style={{
                                      color: AppColors.grayText,
                                      textAlign: 'center',
                                      fontFamily: AppFonts.interMedium,
                                    }}>
                                    react-native-webview is not installed in the
                                    target project. Install it to enable Preview
                                    mode.
                                  </Text>
                                </View>
                              )
                            ) : (
                              <View style={styles.emptyContainer}>
                                <View style={styles.emptyIconWrap}>
                                  <GlobeIcon
                                    color={AppColors.purple}
                                    size={32}
                                  />
                                </View>
                                <Text style={styles.emptyTitle}>
                                  No Preview Available
                                </Text>
                                <Text style={styles.emptySub}>
                                  Load a page in the WebView to see its visual
                                  preview.
                                </Text>
                              </View>
                            )}
                          </View>
                        )}
                      </View>
                    )
                  ) : activeTab === 'redux' ? (
                    renderReduxTab()
                  ) : (
                    <View style={{flex: 1}}>
                      {/* Non-scrollable details header */}
                      <View style={{paddingHorizontal: 6, paddingTop: 4}}>
                        <View style={styles.detailInfoBar}>
                          {(() => {
                            let hostStr = '';
                            let pathStr = detailDisplayUrl;
                            let queryStr = '';
                            try {
                              // Simple parsing fallback for React Native environments
                              const qIndex = detailDisplayUrl.indexOf('?');
                              let cleanUrlForParsing = detailDisplayUrl;
                              if (qIndex !== -1) {
                                pathStr = detailDisplayUrl.substring(0, qIndex);
                                queryStr = detailDisplayUrl.substring(qIndex);
                                cleanUrlForParsing = pathStr;
                              }
                              const schemeIndex =
                                cleanUrlForParsing.indexOf('://');
                              if (schemeIndex !== -1) {
                                const withoutScheme =
                                  cleanUrlForParsing.substring(schemeIndex + 3);
                                const firstSlash = withoutScheme.indexOf('/');
                                if (firstSlash !== -1) {
                                  hostStr = withoutScheme.substring(
                                    0,
                                    firstSlash,
                                  );
                                  pathStr = withoutScheme.substring(firstSlash);
                                } else {
                                  hostStr = withoutScheme;
                                  pathStr = '/';
                                }
                              }
                            } catch (e) {}

                            return (
                              <>
                                <View style={styles.detailInfoTop}>
                                  <View
                                    style={{
                                      flexDirection: 'row',
                                      alignItems: 'center',
                                      gap: 8,
                                    }}>
                                    <View
                                      style={[
                                        styles.methodBadge,
                                        {
                                          backgroundColor:
                                            METHOD_COLORS[
                                              selected.method as Method
                                            ] ?? METHOD_COLORS.ALL,
                                        },
                                      ]}>
                                      <Text
                                        style={[
                                          styles.methodBadgeText,
                                          {
                                            color: '#FFFFFF',
                                          },
                                        ]}>
                                        {selected.method}
                                      </Text>
                                    </View>

                                    {selected.status != null && (
                                      <View
                                        style={[
                                          styles.chip,
                                          {
                                            backgroundColor:
                                              selected.status === 0
                                                ? `${AppColors.errorColor}15`
                                                : `${getStatusColor(
                                                    selected.status,
                                                  )}15`,
                                            borderColor:
                                              selected.status === 0
                                                ? `${AppColors.errorColor}40`
                                                : `${getStatusColor(
                                                    selected.status,
                                                  )}40`,
                                          },
                                        ]}>
                                        {selected.status === 0 ? (
                                          <FailIcon
                                            size={8}
                                            color={AppColors.errorColor}
                                          />
                                        ) : (
                                          <Svg
                                            width={6}
                                            height={6}
                                            viewBox="0 0 10 10"
                                            fill="none">
                                            <Circle
                                              cx="5"
                                              cy="5"
                                              r="5"
                                              fill={getStatusColor(
                                                selected.status,
                                              )}
                                            />
                                          </Svg>
                                        )}
                                        <Text
                                          style={[
                                            styles.chipText,
                                            {
                                              color:
                                                selected.status === 0
                                                  ? AppColors.errorColor
                                                  : getStatusColor(
                                                      selected.status,
                                                    ),
                                            },
                                          ]}>
                                          {selected.status === 0
                                            ? 'Failed'
                                            : String(selected.status)}
                                        </Text>
                                      </View>
                                    )}

                                    {selected.duration != null && (
                                      <View
                                        style={[
                                          styles.chip,
                                          {
                                            backgroundColor:
                                              'rgba(104,75,155,0.08)',
                                            borderColor:
                                              'rgba(104,75,155,0.18)',
                                          },
                                        ]}>
                                        <Text
                                          style={[
                                            styles.chipText,
                                            {color: AppColors.purple},
                                          ]}>
                                          {selected.duration}ms
                                        </Text>
                                      </View>
                                    )}
                                  </View>
                                  <View style={styles.detailInfoRight}>
                                    <TouchableScale
                                      style={styles.iconSquareBtn}
                                      onPress={() =>
                                        Linking.openURL(detailDisplayUrl)
                                      }
                                      hitSlop={12}>
                                      <GlobeIcon
                                        color={AppColors.grayTextWeak}
                                        size={14}
                                      />
                                    </TouchableScale>
                                    <CopyButton
                                      value={getFetchCommand(selected)}
                                      label="fetch()"
                                      iconType="fetch"
                                    />
                                    <CopyButton
                                      value={getCurlCommand(selected)}
                                      label="cURL"
                                      iconType="terminal"
                                    />
                                    <CopyButton
                                      value={detailDisplayUrl}
                                      label="URL"
                                    />
                                  </View>
                                </View>

                                <Pressable
                                  style={{
                                    backgroundColor: AppColors.grayBackground,
                                    borderRadius: 10,
                                    borderWidth: 1,
                                    borderColor: AppColors.dividerColor,
                                    padding: 10,
                                    marginTop: 6,
                                  }}
                                  onPress={() =>
                                    Linking.openURL(detailDisplayUrl)
                                  }>
                                  <View
                                    style={{
                                      flexDirection: 'row',
                                      alignItems: 'center',
                                      justifyContent: 'space-between',
                                      marginBottom: 2,
                                    }}>
                                    <Text
                                      style={{
                                        fontFamily: AppFonts.interMedium,
                                        fontSize: 10,
                                        color: AppColors.grayTextWeak,
                                        flex: 1,
                                      }}
                                      numberOfLines={1}>
                                      {hostStr || 'API Endpoint'}
                                    </Text>
                                    {queryStr ? (
                                      <View
                                        style={{
                                          backgroundColor:
                                            'rgba(104,75,155,0.08)',
                                          paddingHorizontal: 5,
                                          paddingVertical: 1,
                                          borderRadius: 4,
                                        }}>
                                        <Text
                                          style={{
                                            fontFamily: AppFonts.interBold,
                                            fontSize: 8.5,
                                            color: AppColors.purple,
                                          }}>
                                          Query Params
                                        </Text>
                                      </View>
                                    ) : null}
                                  </View>
                                  <Text
                                    selectable={true}
                                    style={{
                                      fontFamily: AppFonts.interBold,
                                      fontSize: 12,
                                      color: AppColors.primaryBlack,
                                      marginTop: 2,
                                    }}
                                    numberOfLines={2}>
                                    {pathStr}
                                  </Text>
                                  {queryStr ? (
                                    <Text
                                      selectable={true}
                                      style={{
                                        fontFamily: AppFonts.interRegular,
                                        fontSize: 10,
                                        color: AppColors.grayTextWeak,
                                        marginTop: 4,
                                      }}
                                      numberOfLines={1}>
                                      {queryStr}
                                    </Text>
                                  ) : null}
                                </Pressable>
                              </>
                            );
                          })()}
                        </View>
                      </View>

                      {/* Sticky Segment Control */}
                      <View
                        style={{
                          flexDirection: 'row',
                          backgroundColor: AppColors.grayBackground,
                          borderRadius: 10,
                          padding: 3,
                          marginHorizontal: 6,
                          marginBottom: 10,
                          marginTop: 6,
                          borderWidth: 1,
                          borderColor: AppColors.dividerColor,
                        }}>
                        {(
                          [
                            'metadata',
                            'headers',
                            'request',
                            'response',
                          ] as const
                        ).map(tab => {
                          const isActive = apiDetailActiveTab === tab;
                          if (tab === 'request' && selected.request == null)
                            return null;

                          const getLabel = () => {
                            if (tab === 'metadata') return 'Metadata';
                            if (tab === 'headers') return 'Headers';
                            if (tab === 'request') return 'Request';
                            return 'Response';
                          };

                          const getIcon = () => {
                            const iconColor = isActive
                              ? '#FFFFFF'
                              : AppColors.grayText;
                            if (tab === 'metadata')
                              return <StatusIcon color={iconColor} />;
                            if (tab === 'headers')
                              return <HeadersIcon color={iconColor} />;
                            if (tab === 'request')
                              return <RequestIcon color={iconColor} />;
                            return <ResponseIcon color={iconColor} />;
                          };

                          return (
                            <TouchableOpacity
                              key={tab}
                              onPress={() => {
                                animateNextLayout();
                                setApiDetailActiveTab(tab);
                              }}
                              style={{
                                flex: 1,
                                paddingVertical: 6,
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: 8,
                                backgroundColor: isActive
                                  ? AppColors.purple
                                  : 'transparent',
                                gap: 4,
                              }}>
                              {getIcon()}
                              <Text
                                style={{
                                  fontFamily: AppFonts.interBold,
                                  fontSize: 10,
                                  color: isActive
                                    ? '#FFFFFF'
                                    : AppColors.grayText,
                                }}>
                                {getLabel()}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>

                      {/* Scrollable Tab Content */}
                      <ScrollView
                        style={styles.detailScroll}
                        contentContainerStyle={{
                          paddingHorizontal: 6,
                          paddingBottom: 24,
                        }}
                        showsVerticalScrollIndicator={true}>
                        {apiDetailActiveTab === 'metadata' && (
                          <>
                            <MetaAccordion
                              status={selected.status}
                              statusColor={getStatusColor(selected.status)}
                              duration={selected.duration}
                              size={getSize(selected.response)}
                              triggeredAt={formatDateTime(selected.startTime)}
                              method={selected.method}
                              contentType={
                                selected.responseHeaders?.['content-type'] ||
                                selected.responseHeaders?.['Content-Type']
                              }
                              url={selected.url}
                            />

                            {(() => {
                              const routeInfo = logRouteMapRef.current.get(
                                selected.id,
                              );
                              if (!routeInfo || routeInfo.path === 'Navigators')
                                return null;
                              return <SourcePageCard routeInfo={routeInfo} />;
                            })()}

                            {(() => {
                              const cType =
                                selected.responseHeaders?.['content-type'] ||
                                selected.responseHeaders?.['Content-Type'];
                              if (cType?.includes('image/')) {
                                return (
                                  <View style={styles.imagePreviewWrapper}>
                                    <Image
                                      source={{uri: selected.url}}
                                      style={styles.imagePreview}
                                      resizeMode="contain"
                                    />
                                    <TouchableScale
                                      style={styles.imageDownloadBtn}
                                      onPress={() =>
                                        Linking.openURL(selected.url)
                                      }
                                      hitSlop={10}>
                                      <DownloadIcon
                                        color={AppColors.purple}
                                        size={18}
                                      />
                                    </TouchableScale>
                                  </View>
                                );
                              }
                              return null;
                            })()}
                          </>
                        )}

                        {apiDetailActiveTab === 'headers' && (
                          <>
                            <View style={styles.detailSearchRow}>
                              <View style={styles.detailSearchBox}>
                                <TextInput
                                  placeholder="Search headers..."
                                  placeholderTextColor={AppColors.grayTextWeak}
                                  value={detailSearch}
                                  onChangeText={setDetailSearch}
                                  style={styles.detailSearchInput}
                                  autoCorrect={false}
                                  autoCapitalize="none"
                                />
                                {detailSearch.length > 0 && (
                                  <Pressable
                                    onPress={() => setDetailSearch('')}
                                    hitSlop={10}
                                    style={{padding: 8}}>
                                    <ClearIcon
                                      color={AppColors.grayTextWeak}
                                      size={14}
                                    />
                                  </Pressable>
                                )}
                              </View>
                            </View>

                            <HeadersSection
                              title="Request Headers"
                              headers={selected.requestHeaders}
                              search={detailSearch}
                              resetKey={selected.id}
                            />
                            <HeadersSection
                              title="Response Headers"
                              headers={selected.responseHeaders}
                              search={detailSearch}
                              resetKey={selected.id}
                            />
                          </>
                        )}

                        {apiDetailActiveTab === 'request' &&
                          selected.request != null && (
                            <>
                              <View style={styles.detailSearchRow}>
                                <View style={styles.detailSearchBox}>
                                  <TextInput
                                    placeholder="Search request..."
                                    placeholderTextColor={
                                      AppColors.grayTextWeak
                                    }
                                    value={detailSearch}
                                    onChangeText={setDetailSearch}
                                    style={styles.detailSearchInput}
                                    autoCorrect={false}
                                    autoCapitalize="none"
                                  />
                                  {detailSearch.length > 0 && (
                                    <Pressable
                                      onPress={() => setDetailSearch('')}
                                      hitSlop={10}
                                      style={{padding: 8}}>
                                      <ClearIcon
                                        color={AppColors.grayTextWeak}
                                        size={14}
                                      />
                                    </Pressable>
                                  )}
                                </View>
                              </View>

                              <View style={styles.sectionContainer}>
                                <SectionHeader
                                  title="Request"
                                  value={selected.request}
                                  expanded={reqExpanded}
                                  onToggleExpand={() => setReqExpanded(v => !v)}
                                  showDiff={prevRequestData != null}
                                  isDiffing={showReqDiff}
                                  onToggleDiff={() => {
                                    setShowReqDiff(v => !v);
                                    if (!reqExpanded && !showReqDiff)
                                      setReqExpanded(true);
                                  }}
                                />
                                {showReqDiff ? (
                                  <DiffViewer
                                    oldData={prevRequestData}
                                    newData={selected.request}
                                    forceOpen={reqExpanded}
                                  />
                                ) : (
                                  <JsonViewer
                                    data={selected.request}
                                    search={detailSearch}
                                    forceOpen={reqExpanded}
                                  />
                                )}
                              </View>
                            </>
                          )}

                        {apiDetailActiveTab === 'response' && (
                          <>
                            <View style={styles.detailSearchRow}>
                              <View style={styles.detailSearchBox}>
                                <TextInput
                                  placeholder="Search response..."
                                  placeholderTextColor={AppColors.grayTextWeak}
                                  value={detailSearch}
                                  onChangeText={setDetailSearch}
                                  style={styles.detailSearchInput}
                                  autoCorrect={false}
                                  autoCapitalize="none"
                                />
                                {detailSearch.length > 0 && (
                                  <Pressable
                                    onPress={() => setDetailSearch('')}
                                    hitSlop={10}
                                    style={{padding: 8}}>
                                    <ClearIcon
                                      color={AppColors.grayTextWeak}
                                      size={14}
                                    />
                                  </Pressable>
                                )}
                              </View>
                            </View>

                            <View style={styles.sectionContainer}>
                              <SectionHeader
                                title="Response"
                                value={selected.response}
                                expanded={resExpanded}
                                onToggleExpand={() => setResExpanded(v => !v)}
                                showDiff={prevResponseData != null}
                                isDiffing={showResDiff}
                                onToggleDiff={() => {
                                  setShowResDiff(v => !v);
                                  if (!resExpanded && !showResDiff)
                                    setResExpanded(true);
                                }}
                              />
                              {showResDiff ? (
                                <DiffViewer
                                  oldData={prevResponseData}
                                  newData={selected.response}
                                  forceOpen={resExpanded}
                                />
                              ) : (
                                <JsonViewer
                                  data={selected.response}
                                  search={detailSearch}
                                  forceOpen={resExpanded}
                                  wrap
                                />
                              )}
                            </View>
                          </>
                        )}
                      </ScrollView>
                    </View>
                  )
                ) : (
                  <View style={styles.empty}>
                    <ActivityIndicator size="large" color={AppColors.purple} />
                    <Text style={[styles.emptySub, {marginTop: 12}]}>
                      Loading logs...
                    </Text>
                  </View>
                )}

                {settingsPage !== null && (
                  <View
                    style={[
                      StyleSheet.absoluteFill,
                      {
                        backgroundColor: AppColors.grayBackground,
                        zIndex: 99999,
                      },
                    ]}>
                    {renderSettings()}
                  </View>
                )}
              </View>
            </View>
          </ErrorBoundary>
        )}
      </Modal>
    </>
  );
};

const NetworkInspectorWrapper = (props: any) => {
  return (
    <ErrorBoundary fallbackType="inline">
      <NetworkInspector {...props} />
    </ErrorBoundary>
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
} from './customHooks/analyticsLogger';

export {
  WebView,
  getWebViewLogs,
  getWebViewNavHistory,
  getWebViewHtml,
  getWebViewCss,
  getWebViewJs,
  getWebViewHtmlUrl,
  clearWebViewData,
  subscribeWebView,
} from './customHooks/webViewLogger';

export {default as ErrorBoundary} from './components/ErrorBoundary';

export {
  connectReduxStore,
  inspectorReduxMiddleware,
  getReduxState,
  subscribeReduxState,
  getActionHistory,
  clearActionHistory,
} from './customHooks/reduxLogger';
