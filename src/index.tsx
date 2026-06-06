import React, {useEffect, useMemo, useRef, useState, useCallback} from 'react';
import {
  Alert,
  Animated,
  StyleSheet,
  FlatList,
  SectionList,
  Modal,
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
  SafeAreaView,
} from 'react-native';
import Svg, {Circle, Path} from 'react-native-svg';
import LinearGradient from 'react-native-linear-gradient';
import {useNavigationState, NavigationContext} from '@react-navigation/native';

// Components
import TouchableScale from './components/TouchableScale';
import useAccordion from './customHooks/useAccordion';
import MetaAccordion from './components/MetaAccordion';
import CopyButton from './components/CopyButton';
import MiniBarChart from './components/MiniBarChart';
import MiniLineChart from './components/MiniLineChart';
import SectionHeader from './components/SectionHeader';
import EmptyState from './components/EmptyState';
import JsonViewer from './components/JsonViewer';
import DomainHeader from './components/DomainHeader';
import DiffViewer from './components/DiffViewer';
import LogCard from './components/LogCard';
import HeadersSection from './components/HeadersSection';
import SourcePageCard from './components/SourcePageCard';
import {ConsoleLogCard} from './components/ConsoleLogCard';
import HighlightText from './components/HighlightText';
import CodeSnippet from './components/CodeSnippet';

// Helpers
import {
  formatDateTime,
  getStatusColor,
  getDurationColor,
  getNavigationInfo,
  deduplicateLogs,
  getDomainColor,
  formatDisplayUrl,
  getFetchCommand,
  getCurlCommand,
  getSize,
} from './helpers';

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
  ExpandCollapseIcon,
  ChevronIcon,
  CloseWhite,
  TrashIcon,
  WhiteBackNavigation,
  TerminalIcon,
  SignalIcon,
  AnalyticsIcon,
  SunIcon,
  MoonIcon,
  DebugIcon,
} from './components/NetworkIcons';

import ErrorBoundary from './components/ErrorBoundary';

// Stylesheet
import {AppColors} from './styles/AppColors';
import {AppFonts} from './styles/AppFonts';
import styles, { toggleGlobalTheme } from './styles';

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
} from './customHooks/analyticsLogger';
import AnalyticsEventCard, {
  getEventColor,
} from './components/AnalyticsEventCard';
import AnalyticsDetail from './components/AnalyticsDetail';

// WebView
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

import {
  getReduxState,
  subscribeReduxState,
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
import {METHOD_COLORS, STATUS_FILTERS} from './constants';

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

const NetworkInspector = (): React.JSX.Element => {
  const [isDark, setIsDark] = useState(false);
  const [reduxState, setReduxState] = useState<any>(null);
  const [expandedReducers, setExpandedReducers] = useState<Record<string, boolean>>({});
  const [logs, setLogs] = useState<NetworkLog[]>([]);
  const [visible, setVisible] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [selected, setSelected] = useState<NetworkLog | null>(null);
  const [selectedLogs, setSelectedLogs] = useState<Set<number>>(new Set());
  const [search, setSearch] = useState('');
  const [detailSearch, setDetailSearch] = useState('');
  const [reduxSearch, setReduxSearch] = useState('');
  const [apiDetailActiveTab, setApiDetailActiveTab] = useState<'metadata' | 'headers' | 'request' | 'response'>('metadata');

  useEffect(() => {
    if (selected) {
      setApiDetailActiveTab('metadata');
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
  const [showUiMenu, setShowUiMenu] = useState(false);
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');
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
  const visibleConsoleLogs = useMemo(() => {
    return consoleLogs.filter(log => {
      const type = log.type;
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
  }, [consoleLogs]);
  const [logSearch, setLogSearch] = useState('');
  const [logFilters, setLogFilters] = useState<
    Set<'all' | 'info' | 'warn' | 'error' | 'user-log' | 'analytics'>
  >(new Set(['user-log']));

  // ─── WebView state ─────────────────────────────────────────────────────────
  const [webViewLogs, setWebViewLogs] = useState<WebViewLog[]>([]);
  const [webViewNavHistory, setWebViewNavHistory] = useState<WebViewNavState[]>(
    [],
  );
  const [webViewSubTab, setWebViewSubTab] = useState<'html' | 'navigation'>(
    'html',
  );
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
  const [analyticsSubTab, setAnalyticsSubTab] = useState<
    'ga_events' | 'top_events'
  >('ga_events');
  const [topEventsExpanded, setTopEventsExpanded] = useState(true);
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

  const logRouteMapRef = useRef<Map<number, RouteInfo>>(new Map());
  const prevLogIdsRef = useRef<Set<number>>(new Set());
  const [newLogIds, setNewLogIds] = useState<Set<number>>(new Set());

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const badgeAnim = useRef(new Animated.Value(1)).current;

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

  useEffect(() => {
    if (visible) {
      const task = InteractionManager.runAfterInteractions(() => {
        setIsReady(true);
      });
      return () => task.cancel();
    } else {
      setIsReady(false);
      setSelectedLogs(new Set());
    }
  }, [visible]);

  useEffect(() => {
    setupNetworkLogger();
    clearNetworkLogs();
    setupConsoleLogger();
    // Note: setupAnalyticsLogger(analytics()) is called by the consumer at app startup

    let timeoutId: ReturnType<typeof setTimeout>;

    const unsubscribe = subscribeNetworkLogs((raw: NetworkLog[]) => {
      clearTimeout(timeoutId);

      timeoutId = setTimeout(() => {
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
      }, 250);
    });

    // ─── Analytics subscription ──────────────────────────────────────────────
    let analyticsTimeoutId: ReturnType<typeof setTimeout>;

    const unsubscribeAnalytics = subscribeAnalyticsEvents(
      (raw: AnalyticsEvent[]) => {
        clearTimeout(analyticsTimeoutId);
        analyticsTimeoutId = setTimeout(() => {
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
        }, 200);
      },
    );

    // ─── Console subscription ────────────────────────────────────────────────
    let consoleTimeoutId: ReturnType<typeof setTimeout>;

    const unsubscribeConsole = subscribeConsoleLogs((raw: ConsoleLog[]) => {
      clearTimeout(consoleTimeoutId);
      consoleTimeoutId = setTimeout(() => {
        setConsoleLogs(raw);
      }, 200);
    });

    setWebViewLogs(getWebViewLogs());
    setWebViewNavHistory(getWebViewNavHistory());
    setWebViewHtml(getWebViewHtml());
    setWebViewCss(getWebViewCss());
    setWebViewJs(getWebViewJs());
    setWebViewHtmlUrl(getWebViewHtmlUrl());

    // ─── WebView subscription ────────────────────────────────────────────────
    let webViewTimeoutId: ReturnType<typeof setTimeout>;

    const unsubscribeWebView = subscribeWebView(() => {
      clearTimeout(webViewTimeoutId);
      webViewTimeoutId = setTimeout(() => {
        setWebViewLogs(getWebViewLogs());
        setWebViewNavHistory(getWebViewNavHistory());
        setWebViewHtml(getWebViewHtml());
        setWebViewCss(getWebViewCss());
        setWebViewJs(getWebViewJs());
        setWebViewHtmlUrl(getWebViewHtmlUrl());
      }, 200);
    });

    setReduxState(getReduxState());
    const unsubscribeRedux = subscribeReduxState(() => {
      setReduxState(getReduxState());
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
    return result;
  }, [logs, search, statusFilters, methodFilters, sortOrder]);

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

    return result;
  }, [visibleConsoleLogs, logFilters, logSearch]);

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

  const topEventsArray = useMemo(() => {
    const freq: Record<string, number> = {};
    filteredAnalyticsEvents.forEach(e => {
      if (e.name === 'screen_view') return;
      freq[e.name] = (freq[e.name] || 0) + 1;
    });
    return Object.entries(freq).sort((a, b) => b[1] - a[1]);
  }, [filteredAnalyticsEvents]);

  function closeModal() {
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
    if (selectedLogs.size > 0) {
      setLogs(prev => prev.filter(l => !selectedLogs.has(l.id)));
      setSelectedLogs(new Set());
    } else {
      Alert.alert(
        'Clear Logs',
        'Are you sure you want to clear all network logs?',
        [
          {text: 'Cancel', style: 'cancel'},
          {text: 'Clear All', onPress: handleClearAll, style: 'destructive'},
        ],
      );
    }
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
    ({item}: {item: GroupedListItem}) => {
      if (item.type === 'header') {
        return (
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
        );
      }

      const {log, isLast, color} = item;
      return (
        <View style={styles.treeNodeRow}>
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
              onPress={() => setSelected(log)}
              timelineMinStart={minStart}
              timelineTotalRange={totalRange}
              isNew={newLogIds.has(log.id)}
              searchStr={search}
            />
          </View>
        </View>
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

  const renderInsightsDashboard = () => {
    const apiTotal = logs.length;
    const apiErrors = logs.filter(
      l => (l.status != null && l.status >= 400) || l.status === 0 || l.status == null,
    ).length;
    const apiSuccess = apiTotal - apiErrors;
    const apiSuccessRate = apiTotal > 0 ? Math.round((apiSuccess / apiTotal) * 100) : 100;
    const durations = logs.filter(l => l.duration != null).map(l => l.duration!);
    const avgTime = durations.length > 0
      ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
      : null;

    const logTotal = visibleConsoleLogs.length;
    const logErrors = visibleConsoleLogs.filter(l => l.type === 'error').length;
    const logWarns = visibleConsoleLogs.filter(l => l.type === 'warn').length;
    const logInfos = visibleConsoleLogs.filter(l => l.type === 'info').length;

    const analyticsTotal = analyticsEvents.length;
    const uniqueEvents = new Set(analyticsEvents.map(e => e.name)).size;
    const screenViews = analyticsEvents.filter(
      e => e.name === 'screen_view' || e.name === 'page_view' || e.name === 'firebase_screen_class'
    ).length;

    const webviewTotal = webViewNavHistory.length;

    return (
      <View style={styles.dashboardContainer}>
        {/* Module 1: APIs */}
        <TouchableScale style={styles.dashboardModuleCard} onPress={() => setActiveTab('apis')}>
          <View style={styles.dashboardModuleHeader}>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
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
              <Text style={[styles.dashboardGridVal, apiSuccessRate < 90 && {color: AppColors.warningIconGold}]}>
                {apiSuccessRate}%
              </Text>
              <Text style={styles.dashboardGridLbl}>Success Rate</Text>
            </View>
            <View style={styles.dashboardGridItem}>
              <Text style={[styles.dashboardGridVal, apiErrors > 0 && {color: AppColors.errorColor}]}>
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
        </TouchableScale>

        {/* Module 2: Logs */}
        <TouchableScale style={styles.dashboardModuleCard} onPress={() => setActiveTab('logs')}>
          <View style={styles.dashboardModuleHeader}>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
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
              <Text style={[styles.dashboardGridVal, {color: '#0D9488'}]}>{logInfos}</Text>
              <Text style={styles.dashboardGridLbl}>Info</Text>
            </View>
            <View style={styles.dashboardGridItem}>
              <Text style={[styles.dashboardGridVal, logWarns > 0 && {color: AppColors.warningIconGold}]}>
                {logWarns}
              </Text>
              <Text style={styles.dashboardGridLbl}>Warnings</Text>
            </View>
            <View style={styles.dashboardGridItem}>
              <Text style={[styles.dashboardGridVal, logErrors > 0 && {color: AppColors.errorColor}]}>
                {logErrors}
              </Text>
              <Text style={styles.dashboardGridLbl}>Errors</Text>
            </View>
          </View>
        </TouchableScale>

        {/* Module 3: Analytics */}
        <TouchableScale style={styles.dashboardModuleCard} onPress={() => setActiveTab('analytics')}>
          <View style={styles.dashboardModuleHeader}>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
              <AnalyticsIcon color="#EA580C" size={18} />
              <Text style={styles.dashboardModuleTitle}>Analytics Events</Text>
            </View>
            <Text style={styles.dashboardModuleGoText}>View Details →</Text>
          </View>
          <View style={styles.dashboardModuleGrid}>
            <View style={styles.dashboardGridItem}>
              <Text style={styles.dashboardGridVal}>{analyticsTotal}</Text>
              <Text style={styles.dashboardGridLbl}>Total Events</Text>
            </View>
            <View style={styles.dashboardGridItem}>
              <Text style={[styles.dashboardGridVal, {color: '#EA580C'}]}>{uniqueEvents}</Text>
              <Text style={styles.dashboardGridLbl}>Unique Names</Text>
            </View>
            <View style={styles.dashboardGridItem}>
              <Text style={styles.dashboardGridVal}>{screenViews}</Text>
              <Text style={styles.dashboardGridLbl}>Screen Views</Text>
            </View>
            <View style={styles.dashboardGridItem}>
              <Text style={styles.dashboardGridVal}>
                {analyticsTotal > 0 ? Math.round(analyticsTotal / Math.max(1, logs.length / 5)) : 0}
              </Text>
              <Text style={styles.dashboardGridLbl}>Events Ratio</Text>
            </View>
          </View>
        </TouchableScale>

        {/* Module 4: WebView */}
        <TouchableScale style={styles.dashboardModuleCard} onPress={() => setActiveTab('webview')}>
          <View style={styles.dashboardModuleHeader}>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
              <GlobeIcon color="#2563EB" size={18} />
              <Text style={styles.dashboardModuleTitle}>WebView Captures</Text>
            </View>
            <Text style={styles.dashboardModuleGoText}>View Details →</Text>
          </View>
          <View style={styles.dashboardModuleGrid}>
            <View style={styles.dashboardGridItem}>
              <Text style={styles.dashboardGridVal}>{webviewTotal}</Text>
              <Text style={styles.dashboardGridLbl}>History Size</Text>
            </View>
            <View style={styles.dashboardGridItem}>
              <Text style={[styles.dashboardGridVal, {color: '#16A34A'}]}>Active</Text>
              <Text style={styles.dashboardGridLbl}>Status</Text>
            </View>
            <View style={styles.dashboardGridItem}>
              <Text numberOfLines={1} style={styles.dashboardGridVal}>
                {webviewTotal > 0 ? `${webViewNavHistory[0]?.title?.substring(0, 10) ?? ''}...` : '—'}
              </Text>
              <Text style={styles.dashboardGridLbl}>Last URL</Text>
            </View>
          </View>
        </TouchableScale>

        {/* Module 5: Redux Store */}
        <TouchableScale style={styles.dashboardModuleCard} onPress={() => setActiveTab('redux')}>
          <View style={styles.dashboardModuleHeader}>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
              <TerminalIcon color={AppColors.purple} size={18} />
              <Text style={styles.dashboardModuleTitle}>Redux Store State</Text>
            </View>
            <Text style={styles.dashboardModuleGoText}>View Details →</Text>
          </View>
          {reduxState ? (
            <View style={{ paddingHorizontal: 12, paddingBottom: 12, gap: 6 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={{ fontFamily: AppFonts.interBold, fontSize: 10, color: AppColors.grayTextWeak, letterSpacing: 0.5 }}>
                  REDUCER NAME
                </Text>
                <Text style={{ fontFamily: AppFonts.interBold, fontSize: 10, color: AppColors.grayTextWeak, letterSpacing: 0.5 }}>
                  SIZE / FIELDS
                </Text>
              </View>
              {Object.keys(reduxState).map(key => {
                const val = reduxState[key];
                const fieldsCount = typeof val === 'object' && val !== null ? Object.keys(val).length : 0;
                const sizeStr = getSize(val);
                return (
                  <View key={key} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 2 }}>
                    <Text style={{ fontFamily: AppFonts.interMedium, fontSize: 12, color: AppColors.grayTextStrong }}>
                      {key}
                    </Text>
                    <Text style={{ fontFamily: AppFonts.interRegular, fontSize: 11, color: AppColors.grayTextWeak }}>
                      {sizeStr} ({fieldsCount} fields)
                    </Text>
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={{ padding: 12, alignItems: 'center' }}>
              <Text style={{ fontFamily: AppFonts.interRegular, fontSize: 12, color: AppColors.grayTextWeak }}>
                No connected Redux store.
              </Text>
            </View>
          )}
        </TouchableScale>
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

    return (
      <ScrollView style={styles.detailScroll} contentContainerStyle={{ paddingBottom: 24 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderBottomColor: AppColors.dividerColor,
            backgroundColor: AppColors.primaryLight,
          }}>
          <Text
            style={{
              fontFamily: AppFonts.interBold,
              color: AppColors.grayTextStrong,
              fontSize: 12,
              textTransform: 'uppercase',
              letterSpacing: 0.6,
            }}>
            Redux Store ({reducerKeys.length} Reducers)
          </Text>
          <CopyButton value={() => reduxState} label="Overall Store" />
        </View>

        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: AppColors.grayBackground,
          borderRadius: 8,
          marginHorizontal: 16,
          marginTop: 12,
          marginBottom: 8,
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

        {reducerKeys.map(key => {
          const isExpanded = expandedReducers[key];
          const val = reduxState[key];
          return (
            <View
              key={key}
              style={{
                backgroundColor: AppColors.primaryLight,
                borderBottomWidth: 1,
                borderBottomColor: AppColors.dividerColor,
              }}>
              <Pressable
                onPress={() => {
                  setExpandedReducers(prev => ({
                    ...prev,
                    [key]: !prev[key],
                  }));
                }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                  <Animated.View style={{ transform: [{ rotate: isExpanded ? '0deg' : '-90deg' }] }}>
                    <ChevronIcon color={AppColors.grayTextWeak} size={14} />
                  </Animated.View>
                  <Text
                    style={{
                      fontFamily: AppFonts.interBold,
                      fontSize: 13,
                      color: AppColors.purple,
                    }}>
                    {key}
                  </Text>
                  <Text
                    style={{
                      fontFamily: AppFonts.interRegular,
                      fontSize: 11,
                      color: AppColors.grayTextWeak,
                    }}>
                    ({typeof val === 'object' && val !== null ? `${Object.keys(val).length} fields` : typeof val})
                  </Text>
                </View>
                <CopyButton value={() => val} label={`${key} Reducer`} />
              </Pressable>

              {isExpanded && (
                <View
                  style={{
                    backgroundColor: AppColors.grayBackground,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderTopWidth: 1,
                    borderTopColor: AppColors.dividerColor,
                  }}>
                  <JsonViewer data={val} search={reduxSearch} />
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    );
  };

  return (
    <>
      {hasNavigationContext && (
        <NavigationTracker onStateChange={setNavState} />
      )}
      <TouchableScale
        style={styles.fabWrapper}
        onPress={() => setVisible(true)}
        hitSlop={10}>
        <Animated.View
          style={[styles.fabPulseRing, {transform: [{scale: pulseAnim}]}]}
        />
        <LinearGradient
          colors={[AppColors.purple, '#8F6EFF']}
          style={styles.fab}>
          <DebugIcon color="#FFFFFF" size={28} />
        </LinearGradient>
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

      <Modal visible={visible} animationType="slide" transparent>
        {visible && (
          <ErrorBoundary onClose={closeModal}>
            <View style={styles.modalBackdrop}>
            <Pressable style={styles.modalBackdropPressable} onPress={closeModal} />
            <View style={styles.modalContentCard}>
              <StatusBar
                translucent
                backgroundColor="transparent"
                barStyle="light-content"
              />

              <LinearGradient
                colors={[AppColors.purple, '#6B4EFF']}
                style={styles.headerGradient}>
                <View style={styles.header}>
                  <View
                    style={[
                      styles.headerLeft,
                      {
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 16,
                        flex: (selected == null && selectedEvent == null) ? 5 : 1,
                      },
                    ]}>
                    <TouchableScale
                      onPress={() => {
                        requestAnimationFrame(() => {
                          setSelected(null);
                          setSelectedEvent(null);
                        });
                      }}
                      hitSlop={15}
                      style={[
                        styles.iconBtnMinimal,
                        selected == null &&
                          selectedEvent == null && {display: 'none'},
                      ]}>
                      <WhiteBackNavigation />
                    </TouchableScale>

                    {selected == null && selectedEvent == null ? (
                      <Text style={styles.headerTitle}>RN-InApp-Inspector</Text>
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
                            style={[
                              styles.headerStatusDot,
                              {backgroundColor: getStatusColor(selected.status)},
                            ]}
                          />
                          <Text style={styles.headerSubTitle}>
                            {selected.status === 0
                              ? 'Failed'
                              : selected.status ?? 'Pending'}{' '}
                            •{' '}
                            {selected.duration != null
                              ? `${selected.duration}ms`
                              : '-'}
                          </Text>
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
                              {selectedEvent.source === 'firebase' ? 'FB' : 'MAN'}
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

                  <View style={styles.headerRight}>
                    <TouchableScale
                      onPress={() => {
                        const newTheme = !isDark;
                        setIsDark(newTheme);
                        toggleGlobalTheme(newTheme);
                      }}
                      hitSlop={15}
                      style={[styles.closeButtonCircle, {marginRight: 8}]}>
                      {isDark ? (
                        <SunIcon color="#FFFFFF" size={16} />
                      ) : (
                        <MoonIcon color="#FFFFFF" size={16} />
                      )}
                    </TouchableScale>

                    <TouchableScale
                      onPress={closeModal}
                      hitSlop={15}
                      style={styles.closeButtonCircle}>
                      <CloseWhite size={16} />
                    </TouchableScale>
                  </View>
                </View>
              </LinearGradient>

              {/* ─── Horizontal Scrollable Tab Bar inside Content ─── */}
              {selected == null && selectedEvent == null ? (
                <View style={styles.tabBarContainer}>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{paddingRight: 16}}>
                    {([
                      { key: 'insights', label: 'Insights', count: 0, icon: 'insights' },
                      { key: 'apis', label: 'APIs', count: logs.length, icon: 'apis' },
                      { key: 'logs', label: 'Logs', count: consoleLogs.length, icon: 'logs' },
                      { key: 'analytics', label: 'Analytics', count: analyticsEvents.length, icon: 'analytics' },
                      { key: 'webview', label: 'WebView', count: webViewNavHistory.length, icon: 'webview' },
                      { key: 'redux', label: 'Redux', count: 0, icon: 'redux' },
                    ] as const).map(tab => {
                      const isActive = activeTab === tab.key;
                      const iconColor = isActive ? '#FFFFFF' : AppColors.grayText;
                      const countLabel = tab.count > 9 ? '9+' : String(tab.count);
                      return (
                        <TouchableScale
                          key={tab.key}
                          onPress={() => {
                            requestAnimationFrame(() => {
                              setActiveTab(tab.key);
                            });
                          }}
                          style={[
                            styles.contentTabButton,
                            isActive && styles.contentTabButtonActive,
                          ]}>
                          <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
                            {tab.icon === 'insights' && <InsightsIcon color={iconColor} size={14} />}
                            {tab.icon === 'apis' && <SignalIcon color={iconColor} size={14} />}
                            {tab.icon === 'logs' && <TerminalIcon color={iconColor} size={14} />}
                            {tab.icon === 'analytics' && <AnalyticsIcon color={iconColor} size={14} />}
                            {tab.icon === 'webview' && <GlobeIcon color={iconColor} size={14} />}
                            {tab.icon === 'redux' && <TerminalIcon color={iconColor} size={14} />}
                            <Text
                              numberOfLines={1}
                              ellipsizeMode="tail"
                              style={[
                                styles.contentTabButtonText,
                                isActive && styles.contentTabButtonTextActive,
                              ]}>
                              {tab.label} {tab.count > 0 ? `(${countLabel})` : ''}
                            </Text>
                          </View>
                        </TouchableScale>
                      );
                    })}
                  </ScrollView>
                </View>
              ) : null}



            {/* ─── Secondary Tab Bar for Analytics ──────────────────────── */}
            {isReady && activeTab === 'analytics' && selectedEvent == null && (
              <View>
                {/* ─── Search + Shared Toolbar for Analytics ──────────────────────── */}
                <View
                  style={[styles.toolbarRow, {marginTop: 12, marginBottom: 4}]}>
                  <View style={styles.searchContainer}>
                    <SearchIcon color={AppColors.grayTextWeak} size={16} />
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
                        <ClearIcon color={AppColors.grayTextWeak} size={14} />
                      </Pressable>
                    )}
                  </View>
                  {analyticsSubTab === 'ga_events' && (
                    <View style={styles.toolbarRight}>
                      <TouchableScale
                        style={[
                          styles.toolbarBtn,
                          !hideScreenView && styles.toolbarBtnActive,
                        ]}
                        onPress={() => setHideScreenView(prev => !prev)}
                        hitSlop={10}>
                        <ScreenIcon
                          color={
                            !hideScreenView
                              ? AppColors.purple
                              : AppColors.grayTextStrong
                          }
                          size={18}
                        />
                      </TouchableScale>
                      <TouchableScale
                        style={styles.toolbarBtn}
                        onPress={handleDelete}
                        hitSlop={10}>
                        <TrashIcon color={AppColors.grayTextStrong} size={18} />
                      </TouchableScale>
                    </View>
                  )}
                </View>

                {/* ─── Secondary Tab Bar for Analytics ──────────────────────── */}
                <View
                  style={{
                    marginHorizontal: 16,
                    marginTop: 4,
                    marginBottom: 8,
                    backgroundColor: AppColors.grayBackground,
                    borderRadius: 8,
                    padding: 4,
                    flexDirection: 'row',
                    borderWidth: 1,
                    borderColor: AppColors.grayBorderSecondary,
                  }}>
                  <Pressable
                    style={[
                      {
                        flex: 1,
                        paddingVertical: 8,
                        borderRadius: 6,
                        alignItems: 'center',
                      },
                      analyticsSubTab === 'ga_events' && {
                        backgroundColor: AppColors.primaryLight,
                        shadowColor: '#000',
                        shadowOpacity: 0.1,
                        shadowRadius: 3,
                        shadowOffset: {width: 0, height: 1},
                        elevation: 2,
                      },
                    ]}
                    onPress={() => setAnalyticsSubTab('ga_events')}>
                    <Text
                      style={[
                        {
                          fontFamily: AppFonts.interMedium,
                          fontSize: 13,
                          color: AppColors.grayTextStrong,
                        },
                        analyticsSubTab === 'ga_events' && {
                          fontFamily: AppFonts.interBold,
                          color: AppColors.purple,
                        },
                      ]}>
                      GA Events (
                      {analyticsSearch
                        ? filteredAnalyticsEvents.length
                        : analyticsEvents.length}
                      )
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[
                      {
                        flex: 1,
                        paddingVertical: 8,
                        borderRadius: 6,
                        alignItems: 'center',
                      },
                      analyticsSubTab === 'top_events' && {
                        backgroundColor: AppColors.primaryLight,
                        shadowColor: '#000',
                        shadowOpacity: 0.1,
                        shadowRadius: 3,
                        shadowOffset: {width: 0, height: 1},
                        elevation: 2,
                      },
                    ]}
                    onPress={() => setAnalyticsSubTab('top_events')}>
                    <Text
                      style={[
                        {
                          fontFamily: AppFonts.interMedium,
                          fontSize: 13,
                          color: AppColors.grayTextStrong,
                        },
                        analyticsSubTab === 'top_events' && {
                          fontFamily: AppFonts.interBold,
                          color: AppColors.purple,
                        },
                      ]}>
                      Top Events ({topEventsArray.length})
                    </Text>
                  </Pressable>
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
                selectedEvent != null ? (
                  <AnalyticsDetail event={selectedEvent} />
                ) : analyticsSubTab === 'top_events' ? (
                  <FlatList
                    data={topEventsArray}
                    keyExtractor={item => item[0]}
                    contentContainerStyle={[
                      styles.listContent,
                      {paddingHorizontal: 16, paddingTop: 16},
                    ]}
                    renderItem={({item: [name, count]}) => {
                      const maxCount = topEventsArray[0]?.[1] || 1;
                      const color = getEventColor(name);
                      return (
                        <View
                          style={[
                            styles.analyticsTopEventsCard,
                            {marginBottom: 12, paddingVertical: 16},
                          ]}>
                          <View style={styles.analyticsTopEventRow}>
                            <View
                              style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 8,
                                flex: 1,
                              }}>
                              <View
                                style={[
                                  styles.analyticsIconCircle,
                                  {backgroundColor: `${color}1A`},
                                ]}>
                                <Svg
                                  width={14}
                                  height={14}
                                  viewBox="0 0 24 24"
                                  fill={color}>
                                  <Circle
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    opacity="0.3"
                                  />
                                  <Path
                                    d="M7 14l3-3 4 4 6-6"
                                    stroke={color}
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    fill="none"
                                  />
                                </Svg>
                              </View>
                              <Text
                                style={styles.analyticsTopEventName}
                                numberOfLines={2}>
                                {name}
                              </Text>
                            </View>
                            <View style={styles.analyticsTopEventBarWrap}>
                              <LinearGradient
                                colors={[color, `${color}99`]}
                                start={{x: 0, y: 0}}
                                end={{x: 1, y: 0}}
                                style={[
                                  styles.analyticsTopEventBar,
                                  {
                                    width: `${Math.max(
                                      6,
                                      (count / maxCount) * 100,
                                    )}%`,
                                  },
                                ]}
                              />
                            </View>
                            <Text style={styles.analyticsTopEventCount}>
                              {count}
                            </Text>
                          </View>
                        </View>
                      );
                    }}
                    ListEmptyComponent={
                      <View style={styles.emptyContainer}>
                        <View style={styles.emptyIconWrap}>
                          <EmptyRadarIcon color={AppColors.purple} size={32} />
                        </View>
                        <Text style={styles.emptyTitle}>No Top Events</Text>
                      </View>
                    }
                  />
                ) : (
                  <FlatList
                    data={filteredAnalyticsEvents}
                    keyExtractor={item => item.id.toString()}
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
                      const showTimestamp = index === 0 || thisMin !== nextMin;
                      return (
                        <AnalyticsEventCard
                          event={item}
                          onPress={() => setSelectedEvent(item)}
                          isNew={newEventIds.has(item.id)}
                          searchStr={analyticsSearch}
                          isFirst={index === 0}
                          isLast={index === filteredAnalyticsEvents.length - 1}
                          msSincePrev={msSincePrev}
                          showTimestamp={showTimestamp}
                          computedScreenName={(() => {
                            let screenName =
                              item.screenName ||
                              item.screenClass ||
                              item.pageTitle ||
                              item.pageLocation ||
                              item.params?.firebase_screen ||
                              item.params?.screen_name ||
                              item.params?.firebase_screen_class ||
                              item.params?.screen_class;
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
                    removeClippedSubviews
                    ListEmptyComponent={
                      <View style={styles.emptyContainer}>
                        <View style={styles.emptyIconWrap}>
                          <EmptyRadarIcon color={AppColors.purple} size={32} />
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
                      filteredAnalyticsEvents.length === 0 && {flexGrow: 1},
                    ]}
                    keyboardShouldPersistTaps="handled"
                  />
                )
              ) : activeTab === 'apis' && selected == null ? (
                <FlatList
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
                              style={styles.toolbarBtn}
                              onPress={handleDelete}
                              hitSlop={10}>
                              <TrashIcon
                                color={AppColors.grayTextStrong}
                                size={18}
                              />
                              {selectedLogs.size > 0 && (
                                <View style={styles.trashBadge}>
                                  <Text style={styles.trashBadgeText}>
                                    {selectedLogs.size}
                                  </Text>
                                </View>
                              )}
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
                            <Text style={styles.filtersHeading}>STATUS</Text>
                            <ScrollView
                              horizontal
                              showsHorizontalScrollIndicator={false}
                              contentContainerStyle={styles.statusRowContent}>
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
                                        <Text style={styles.statusFilterText}>
                                          {filter}
                                        </Text>
                                      </View>
                                    )}
                                  </TouchableScale>
                                );
                              })}
                            </ScrollView>

                            <Text
                              style={[styles.filtersHeading, {marginTop: 16}]}>
                              METHOD
                            </Text>
                            <ScrollView
                              horizontal
                              showsHorizontalScrollIndicator={false}
                              contentContainerStyle={styles.statusRowContent}>
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
                                        <Text style={styles.statusFilterText}>
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
                        isSearch={search.length > 0 || statusFilters.size > 0}
                      />
                    }
                    contentContainerStyle={[
                      styles.listContent,
                      filteredLogs.length === 0 && {flexGrow: 1},
                    ]}
                    keyboardShouldPersistTaps="handled"
                  />
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
                        <SearchIcon color={AppColors.grayTextWeak} size={16} />
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
                          onPress={handleDelete}
                          hitSlop={10}>
                          <TrashIcon
                            color={AppColors.grayTextStrong}
                            size={18}
                          />
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
                          </TouchableScale>
                        );
                      })()}
                    </ScrollView>
                  </View>

                  <FlatList
                    data={filteredConsoleLogs}
                    keyExtractor={item => item.id.toString()}
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
                            return (f as string).charAt(0).toUpperCase() + (f as string).slice(1);
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
                    renderItem={({item}) => (
                      <ConsoleLogCard item={item} searchStr={logSearch} />
                    )}
                    initialNumToRender={15}
                    maxToRenderPerBatch={15}
                    windowSize={7}
                    removeClippedSubviews={true}
                    ListEmptyComponent={
                      <EmptyState
                        isSearch={logSearch.length > 0 || logFilters.size > 0}
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
                <View style={{flex: 1}}>
                  <View
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderBottomWidth: 1,
                      borderBottomColor: AppColors.dividerColor,
                      paddingBottom: 6,
                    }}>
                    {/* ─── WebView Sub-Tabs ─────────────────────────────────────── */}
                    <View
                      style={{
                        marginHorizontal: 16,
                        marginTop: webViewSubTab === 'navigation' ? 12 : 4,
                        marginBottom: 8,
                        backgroundColor: AppColors.grayBackground,
                        borderRadius: 8,
                        padding: 4,
                        flexDirection: 'row',
                        borderWidth: 1,
                        borderColor: AppColors.grayBorderSecondary,
                      }}>
                      <Pressable
                        style={[
                          {
                            flex: 1,
                            paddingVertical: 8,
                            borderRadius: 6,
                            alignItems: 'center',
                          },
                          webViewSubTab === 'html' && {
                            backgroundColor: AppColors.primaryLight,
                            shadowColor: '#000',
                            shadowOpacity: 0.1,
                            shadowRadius: 3,
                            shadowOffset: {width: 0, height: 1},
                            elevation: 2,
                          },
                        ]}
                        onPress={() => setWebViewSubTab('html')}>
                        <Text
                          style={[
                            {
                              fontFamily: AppFonts.interMedium,
                              fontSize: 12,
                              color: AppColors.grayTextStrong,
                            },
                            webViewSubTab === 'html' && {
                              fontFamily: AppFonts.interBold,
                              color: '#475569',
                            },
                          ]}>
                          HTML Source
                        </Text>
                      </Pressable>
                      <Pressable
                        style={[
                          {
                            flex: 1,
                            paddingVertical: 8,
                            borderRadius: 6,
                            alignItems: 'center',
                          },
                          webViewSubTab === 'navigation' && {
                            backgroundColor: AppColors.primaryLight,
                            shadowColor: '#000',
                            shadowOpacity: 0.1,
                            shadowRadius: 3,
                            shadowOffset: {width: 0, height: 1},
                            elevation: 2,
                          },
                        ]}
                        onPress={() => setWebViewSubTab('navigation')}>
                        <Text
                          style={[
                            {
                              fontFamily: AppFonts.interMedium,
                              fontSize: 12,
                              color: AppColors.grayTextStrong,
                            },
                            webViewSubTab === 'navigation' && {
                              fontFamily: AppFonts.interBold,
                              color: '#475569',
                            },
                          ]}>
                          Nav History ({webViewNavHistory.length})
                        </Text>
                      </Pressable>
                    </View>
                  </View>

                  {/* ─── Current Page Address Bar (Always visible at the top) ─── */}
                  {(() => {
                    const currentUrl = webViewNavHistory[0]?.url;
                    if (!currentUrl) return null;
                    return (
                      <View
                        style={{
                          paddingHorizontal: 16,
                          paddingTop: 10,
                          paddingBottom: 10,
                          backgroundColor: '#FFFFFF',
                          borderBottomWidth: 1,
                          borderBottomColor: AppColors.dividerColor,
                        }}>
                        <Text
                          style={{
                            fontFamily: AppFonts.interBold,
                            fontSize: 10,
                            color: '#64748B',
                            textTransform: 'uppercase',
                            letterSpacing: 0.5,
                            marginBottom: 6,
                          }}>
                          Currently debugging for URL
                        </Text>
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            backgroundColor: '#F1F5F9',
                            borderRadius: 20,
                            borderWidth: 1,
                            borderColor: '#E2E8F0',
                            paddingHorizontal: 12,
                            paddingVertical: 6,
                            gap: 8,
                          }}>
                          {/* Left: Clickable Globe Icon to open browser */}
                          <TouchableScale
                            onPress={() => Linking.openURL(currentUrl)}
                            hitSlop={8}
                            style={{
                              width: 24,
                              height: 24,
                              borderRadius: 12,
                              backgroundColor: '#E2E8F0',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                            children={<GlobeIcon size={12} color="#475569" />}
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
                                fontSize: 11,
                                color: '#475569',
                              }}
                              highlightStyle={styles.highlight}
                              detectLinks={false}
                            />
                          </View>

                          {/* Right: Copy Button */}
                          <CopyButton value={currentUrl} label="URL" />
                        </View>
                      </View>
                    );
                  })()}

                  {webViewSubTab === 'html' ? (
                    <View style={{flex: 1}}>
                      {webViewHtml || webViewCss || webViewJs ? (
                        <View style={{flex: 1}}>
                          {/* Inner sub-tabs inside HTML source view */}
                          <View
                            style={{
                              flexDirection: 'row',
                              borderBottomWidth: 1,
                              borderBottomColor: '#E2E8F0',
                              backgroundColor: '#FFFFFF',
                              paddingHorizontal: 16,
                            }}>
                            {(['html', 'css', 'javascript'] as const).map(
                              tab => {
                                const active = htmlSubTab === tab;
                                const label =
                                  tab === 'html'
                                    ? 'HTML'
                                    : tab === 'css'
                                    ? 'CSS'
                                    : 'Javascript';
                                return (
                                  <Pressable
                                    key={tab}
                                    onPress={() => setHtmlSubTab(tab)}
                                    style={{
                                      paddingVertical: 10,
                                      marginRight: 16,
                                      borderBottomWidth: 2,
                                      borderBottomColor: active
                                        ? AppColors.purple
                                        : 'transparent',
                                    }}>
                                    <Text
                                      style={{
                                        fontFamily: active
                                          ? AppFonts.interBold
                                          : AppFonts.interMedium,
                                        fontSize: 12,
                                        color: active
                                          ? AppColors.purple
                                          : '#64748B',
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
                              <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', minHeight: 200}}>
                                <ActivityIndicator size="large" color={AppColors.purple} />
                              </View>
                            ) : htmlSubTab === 'html' ? (
                              webViewHtml ? (
                                <CodeSnippet
                                  code={webViewHtml}
                                  language="html"
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
                            <GlobeIcon color={AppColors.purple} size={32} />
                          </View>
                          <Text style={styles.emptyTitle}>
                            No Page Source Captured
                          </Text>
                          <Text style={styles.emptySub}>
                            Load a page in the WebView to inspect its HTML, CSS,
                            or Javascript source.
                          </Text>
                        </View>
                      )}
                    </View>
                  ) : (
                    <FlatList
                      data={filteredNavHistory}
                      keyExtractor={(item: WebViewNavState, index: number) =>
                        `${index}-${item.timestamp}`
                      }
                      ListHeaderComponent={
                        <View
                          style={{
                            paddingHorizontal: 16,
                            paddingTop: 12,
                            paddingBottom: 8,
                          }}>
                          <Text style={styles.resultCount}>
                            Navigation History ({webViewNavHistory.length})
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
                          <View
                            style={{
                              paddingHorizontal: 16,
                              paddingVertical: 8,
                              backgroundColor: isLatest ? '#F1F5F9' : '#FFFFFF',
                              borderBottomWidth: 1,
                              borderBottomColor: '#E2E8F0',
                              flexDirection: 'row',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: 12,
                            }}>
                            <View style={{flex: 1, gap: 2}}>
                              <View
                                style={{
                                  flexDirection: 'row',
                                  alignItems: 'center',
                                  gap: 6,
                                  flexWrap: 'wrap',
                                }}>
                                <Text
                                  numberOfLines={1}
                                  ellipsizeMode="tail"
                                  style={{
                                    fontFamily: AppFonts.interBold,
                                    fontSize: 13,
                                    color: '#334155',
                                    flexShrink: 1,
                                  }}>
                                  {item.title || 'Untitled Page'}
                                </Text>
                                {isLatest && (
                                  <View
                                    style={{
                                      backgroundColor: '#E2E8F0',
                                      paddingHorizontal: 6,
                                      paddingVertical: 2,
                                      borderRadius: 4,
                                    }}>
                                    <Text
                                      style={{
                                        fontFamily: AppFonts.interBold,
                                        fontSize: 9,
                                        color: '#475569',
                                      }}>
                                      Active
                                    </Text>
                                  </View>
                                )}
                              </View>
                              <HighlightText
                                text={item.url}
                                search={webViewSearch}
                                numberOfLines={3}
                                ellipsizeMode="tail"
                                style={{
                                  fontFamily: AppFonts.interRegular,
                                  fontSize: 11,
                                  color: '#64748B',
                                  flexShrink: 1,
                                }}
                                highlightStyle={styles.highlight}
                                detectLinks={true}
                              />
                              <Text
                                style={{
                                  fontFamily: AppFonts.interRegular,
                                  fontSize: 10,
                                  color: '#94A3B8',
                                }}>
                                {formatNavTime(item.timestamp)}
                              </Text>
                            </View>
                            <CopyButton value={item.url} label="Copy URL" />
                          </View>
                        );
                      }}
                      initialNumToRender={15}
                      maxToRenderPerBatch={15}
                      windowSize={7}
                      removeClippedSubviews={true}
                      ListEmptyComponent={<EmptyState isSearch={false} />}
                      contentContainerStyle={[
                        styles.listContent,
                        filteredNavHistory.length === 0 && {flexGrow: 1},
                      ]}
                      keyboardShouldPersistTaps="handled"
                    />
                  )}
                </View>
              ) : activeTab === 'redux' ? (
                renderReduxTab()
              ) : (
              ) : (
                <View style={{ flex: 1 }}>
                  {/* Non-scrollable details header */}
                  <View style={{ paddingHorizontal: 6, paddingTop: 4 }}>
                    {(() => {
                      const routeInfo = logRouteMapRef.current.get(selected.id);
                      const screenPath =
                        routeInfo && routeInfo.path !== 'Navigators'
                          ? routeInfo.path.split(' ➔ ')
                          : [];
                      const parts = ['APIs', ...screenPath];
                      return (
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            backgroundColor: AppColors.primaryLight,
                            borderRadius: 8,
                            paddingVertical: 8,
                            paddingHorizontal: 12,
                            borderWidth: 1,
                            borderColor: AppColors.dividerColor,
                            marginBottom: 12,
                            marginTop: 4,
                          }}>
                          <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              gap: 6,
                            }}>
                            {parts.map((part, index) => {
                              const isLast = index === parts.length - 1;
                              return (
                                <React.Fragment key={index}>
                                  {index > 0 && (
                                    <Text style={{ color: AppColors.grayTextWeak, fontSize: 11, marginHorizontal: 2 }}>
                                      /
                                    </Text>
                                  )}
                                  <View
                                    style={
                                      isLast
                                        ? {
                                            backgroundColor: `${AppColors.purple}12`,
                                            paddingHorizontal: 8,
                                            paddingVertical: 3,
                                            borderRadius: 6,
                                          }
                                        : {
                                            paddingHorizontal: 4,
                                            paddingVertical: 2,
                                          }
                                    }>
                                    <Text
                                      style={{
                                        fontFamily: isLast ? AppFonts.interBold : AppFonts.interMedium,
                                        fontSize: 11.5,
                                        color: isLast ? AppColors.purple : AppColors.grayText,
                                      }}>
                                      {part}
                                    </Text>
                                  </View>
                                </React.Fragment>
                              );
                            })}
                          </ScrollView>
                        </View>
                      );
                    })()}

                    <View style={styles.detailInfoBar}>
                      <View style={styles.detailInfoTop}>
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 10,
                          }}>
                          <View
                            style={[
                              styles.methodBadge,
                              {
                                backgroundColor: `${
                                  METHOD_COLORS[selected.method as Method] ??
                                  METHOD_COLORS.ALL
                                }15`,
                              },
                            ]}>
                            <Text
                              style={[
                                styles.methodBadgeText,
                                {
                                  color:
                                    METHOD_COLORS[selected.method as Method] ??
                                    METHOD_COLORS.ALL,
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
                                      : `${getStatusColor(selected.status)}15`,
                                  borderColor:
                                    selected.status === 0
                                      ? `${AppColors.errorColor}40`
                                      : `${getStatusColor(selected.status)}40`,
                                },
                              ]}>
                              {selected.status === 0 ? (
                                <FailIcon size={8} color={AppColors.errorColor} />
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
                                    fill={getStatusColor(selected.status)}
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
                                        : getStatusColor(selected.status),
                                  },
                                ]}>
                                {selected.status === 0
                                  ? 'Failed'
                                  : String(selected.status)}
                              </Text>
                            </View>
                          )}
                        </View>
                        <View style={styles.detailInfoRight}>
                          <TouchableScale
                            style={styles.iconSquareBtn}
                            onPress={() => Linking.openURL(detailDisplayUrl)}
                            hitSlop={12}>
                            <GlobeIcon color={AppColors.grayTextWeak} size={14} />
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
                          <CopyButton value={detailDisplayUrl} label="URL" />
                        </View>
                      </View>

                      <Pressable
                        style={styles.detailUrlContainer}
                        onPress={() => Linking.openURL(detailDisplayUrl)}>
                        <Text selectable={true} style={styles.detailUrl}>
                          {detailDisplayUrl}
                        </Text>
                      </Pressable>
                    </View>
                  </View>

                  {/* Sticky Segment Control */}
                  <View style={{
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
                    {(['metadata', 'headers', 'request', 'response'] as const).map(tab => {
                      const isActive = apiDetailActiveTab === tab;
                      if (tab === 'request' && selected.request == null) return null;
                      
                      const getLabel = () => {
                        if (tab === 'metadata') return 'Metadata';
                        if (tab === 'headers') return 'Headers';
                        if (tab === 'request') return 'Request';
                        return 'Response';
                      };

                      return (
                        <TouchableOpacity
                          key={tab}
                          onPress={() => setApiDetailActiveTab(tab)}
                          style={{
                            flex: 1,
                            paddingVertical: 6,
                            alignItems: 'center',
                            borderRadius: 8,
                            backgroundColor: isActive ? AppColors.purple : 'transparent',
                          }}
                        >
                          <Text style={{
                            fontFamily: AppFonts.interBold,
                            fontSize: 11,
                            color: isActive ? '#FFFFFF' : AppColors.grayText,
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
                    contentContainerStyle={{ paddingHorizontal: 6, paddingBottom: 24 }}
                    showsVerticalScrollIndicator={true}
                  >
                    {apiDetailActiveTab === 'metadata' && (
                      <>
                        <MetaAccordion
                          status={selected.status}
                          statusColor={getStatusColor(selected.status)}
                          duration={selected.duration}
                          size={getSize(selected.response)}
                          triggeredAt={formatDateTime(selected.startTime)}
                        />

                        {(() => {
                          const routeInfo = logRouteMapRef.current.get(selected.id);
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
                                  onPress={() => Linking.openURL(selected.url)}
                                  hitSlop={10}>
                                  <DownloadIcon color={AppColors.purple} size={18} />
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
                                <ClearIcon color={AppColors.grayTextWeak} size={14} />
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

                    {apiDetailActiveTab === 'request' && selected.request != null && (
                      <>
                        <View style={styles.detailSearchRow}>
                          <View style={styles.detailSearchBox}>
                            <TextInput
                              placeholder="Search request..."
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
                                <ClearIcon color={AppColors.grayTextWeak} size={14} />
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
                                <ClearIcon color={AppColors.grayTextWeak} size={14} />
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
                              if (!resExpanded && !showResDiff) setResExpanded(true);
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
                            />
                          )}
                        </View>
                      </>
                    )}
                  </ScrollView>
                </View>
              )
              )
            ) : (
              <View style={styles.empty}>
                <ActivityIndicator size="large" color={AppColors.purple} />
                <Text style={[styles.emptySub, {marginTop: 12}]}>
                  Loading logs...
                </Text>
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

export { default as ErrorBoundary } from './components/ErrorBoundary';

export {
  connectReduxStore,
  getReduxState,
  subscribeReduxState,
} from './customHooks/reduxLogger';

