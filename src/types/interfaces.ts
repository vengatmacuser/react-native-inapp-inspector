import React from 'react';
import {ViewStyle} from 'react-native';
import {Animated, PanResponderInstance} from 'react-native';
import type {
  ActiveTab,
  GroupedListItem,
  LocalFilter,
  LogFilter,
  Method,
  SettingsPage,
  SettingsSubTab,
  SortOrder,
  StatusFilter,
} from './index';

// ─── Analytics ────────────────────────────────────────────────────────────────

export interface ConsoleLog {
  id: number;
  type: 'info' | 'warn' | 'error';
  message: string;
  timestamp: number;
  caller?: string;
  stack?: string;
  errorStack?: string;
  rawArgs?: any[];
  sourceMethod?: 'log' | 'info' | 'warn' | 'error';
  /** #9 — number of consecutive identical logs collapsed into this entry. */
  duplicateCount?: number;
}

export interface AnalyticsEvent {
  id: number;
  name: string;
  screenName: string;
  screenClass: string;
  userId: string;
  params: Record<string, any>;
  userProperties: Record<string, any>;
  timestamp: number;
  source: 'firebase' | 'manual';
  raw?: string;
  trackingId?: string;
  clientId?: string;
  sessionId?: string;
  pageTitle?: string;
  pageLocation?: string;
}

// ─── Network ──────────────────────────────────────────────────────────────────

export interface NetworkLog {
  id: number;
  url: string;
  method: string;
  status: number | null;
  duration: number | null;
  startTime: number;
  request?: unknown;
  response?: unknown;
  requestHeaders?: Record<string, string>;
  responseHeaders?: Record<string, string>;
  /** #9 — number of consecutive identical requests collapsed into this entry. */
  duplicateCount?: number;
}

export interface RouteInfo {
  path: string;
  params: any;
}

// ─── Redux ────────────────────────────────────────────────────────────────────

export interface ReduxHistoryEntry {
  id: number;
  type: string;
  payload: any;
  timestamp: string;
  updatedAt?: number;
  affectedSlices: string[];
  prevState?: any;
  nextState?: any;
}

// ─── Settings persistence ─────────────────────────────────────────────────────

export interface InspectorStorage {
  getItem: (key: string) => string | null | Promise<string | null>;
  setItem: (key: string, value: string) => void | Promise<void>;
  removeItem?: (key: string) => void | Promise<void>;
}

export interface PersistedSettings {
  isDark?: boolean;
  modalHeightPercent?: number;
  modalAnimationType?: string;
  tabVisibility?: Record<string, boolean>;
  defaultTab?: string;
  maxNetworkLogs?: number;
  maxConsoleLogs?: number;
  showConsoleLevels?: {info: boolean; warn: boolean; error: boolean};
  reduxAutoRefresh?: boolean;
  reduxExpandDepth?: number;
  showDuplicateLogs?: boolean;
}

// ─── Inspector component props / context ──────────────────────────────────────

export interface NetworkInspectorProps {
  enabled?: boolean;
  isEnabled?: boolean;
  storage?: InspectorStorage;
  navigationRef?: any;
  appIcon?: any;
  environment?: 'DEV' | 'UAT' | 'PrePROD' | 'PROD' | 'QA' | 'Staging' | string;
}

export interface NavigationTrackerProps {
  onStateChange: (state: any) => void;
}

export interface InspectorContextValue {
  // ─── Modal / launcher ──────────────────────────────────────────────────────
  visible: boolean;
  setVisible: React.Dispatch<React.SetStateAction<boolean>>;
  closeModal: () => void;
  isReady: boolean;
  isEnabled: boolean;
  appIcon?: any;
  environment?: string;
  modalHeightPercent: number;
  setModalHeightPercent: React.Dispatch<React.SetStateAction<number>>;
  modalAnimationType: 'slide' | 'fade' | 'none';
  setModalAnimationType: React.Dispatch<
    React.SetStateAction<'slide' | 'fade' | 'none'>
  >;
  hasNavigationContext: boolean;
  setNavState: React.Dispatch<React.SetStateAction<any>>;

  // ─── Tabs ──────────────────────────────────────────────────────────────────
  activeTab: ActiveTab;
  switchActiveTab: (key: ActiveTab) => void;
  tabVisibility: Record<ActiveTab, boolean>;
  toggleTabVisibility: (key: ActiveTab) => void;
  lastReadApisCount: number;
  lastReadLogsCount: number;

  // ─── Selection / header state ──────────────────────────────────────────────
  selected: NetworkLog | null;
  setSelected: React.Dispatch<React.SetStateAction<NetworkLog | null>>;
  selectedEvent: AnalyticsEvent | null;
  setSelectedEvent: React.Dispatch<React.SetStateAction<AnalyticsEvent | null>>;
  selectedLog: ConsoleLog | null;
  setSelectedLog: React.Dispatch<React.SetStateAction<ConsoleLog | null>>;
  showHeaderInfo: boolean;
  setShowHeaderInfo: React.Dispatch<React.SetStateAction<boolean>>;
  settingsPage: SettingsPage;
  setSettingsPage: React.Dispatch<React.SetStateAction<SettingsPage>>;
  updateAvailable: boolean;
  latestNpmVersion: string | null;
  clearAnim: Animated.Value;
  activePulseAnim: Animated.Value;
  unreadPulseAnim: Animated.Value;
  runClearAllWithAnimation: () => void;

  // ─── FAB / launcher ────────────────────────────────────────────────────────
  fabPan: Animated.ValueXY;
  fabPanResponder: PanResponderInstance;
  fabDraggedRef: React.MutableRefObject<boolean>;
  pulseAnim: Animated.Value;
  fabShineAnim: Animated.Value;

  // ─── Network (APIs) ────────────────────────────────────────────────────────
  logs: NetworkLog[];
  filteredLogs: NetworkLog[];
  groupedData: GroupedListItem[];
  search: string;
  setSearch: React.Dispatch<React.SetStateAction<string>>;
  statusFilters: Set<StatusFilter>;
  setStatusFilters: React.Dispatch<React.SetStateAction<Set<StatusFilter>>>;
  methodFilters: Set<Method>;
  setMethodFilters: React.Dispatch<React.SetStateAction<Set<Method>>>;
  availableMethods: Method[];
  sortOrder: SortOrder;
  setSortOrder: React.Dispatch<React.SetStateAction<SortOrder>>;
  selectedLogs: Set<number>;
  toggleSelect: (id: number) => void;
  minStart: number;
  totalRange: number;
  newLogIds: Set<number>;
  toggleSectionFilter: (pageName: string, filter: LocalFilter) => void;
  toggleSectionCollapse: (pageName: string) => void;
  handleDelete: () => void;
  isNetworkPaused: boolean;
  setIsNetworkPaused: React.Dispatch<React.SetStateAction<boolean>>;

  // ─── Network detail ────────────────────────────────────────────────────────
  detailTitle: string;
  detailDisplayUrl: string;
  apiDetailActiveTab: 'metadata' | 'headers' | 'request' | 'response';
  setApiDetailActiveTab: React.Dispatch<
    React.SetStateAction<'metadata' | 'headers' | 'request' | 'response'>
  >;
  detailSearch: string;
  setDetailSearch: React.Dispatch<React.SetStateAction<string>>;
  reqExpanded: boolean | undefined;
  setReqExpanded: React.Dispatch<React.SetStateAction<boolean | undefined>>;
  resExpanded: boolean | undefined;
  setResExpanded: React.Dispatch<React.SetStateAction<boolean | undefined>>;
  showReqDiff: boolean;
  setShowReqDiff: React.Dispatch<React.SetStateAction<boolean>>;
  showResDiff: boolean;
  setShowResDiff: React.Dispatch<React.SetStateAction<boolean>>;
  prevRequestData: unknown;
  prevResponseData: unknown;
  logRouteMapRef: React.MutableRefObject<Map<number, RouteInfo>>;

  // ─── Console (Logs) ────────────────────────────────────────────────────────
  consoleLogs: ConsoleLog[];
  visibleConsoleLogs: ConsoleLog[];
  filteredConsoleLogs: ConsoleLog[];
  logSearch: string;
  setLogSearch: React.Dispatch<React.SetStateAction<string>>;
  logFilters: Set<LogFilter>;
  setLogFilters: React.Dispatch<React.SetStateAction<Set<LogFilter>>>;
  logCounts: Record<string, string>;
  logSortOrder: SortOrder;
  setLogSortOrder: React.Dispatch<React.SetStateAction<SortOrder>>;
  isConsolePaused: boolean;
  setIsConsolePaused: React.Dispatch<React.SetStateAction<boolean>>;

  // ─── Analytics ─────────────────────────────────────────────────────────────
  analyticsEvents: AnalyticsEvent[];
  filteredAnalyticsEvents: (AnalyticsEvent & {count?: number})[];
  analyticsSearch: string;
  setAnalyticsSearch: React.Dispatch<React.SetStateAction<string>>;
  newEventIds: Set<number>;
  isAnalyticsLayoutReady: boolean;
  setIsAnalyticsLayoutReady: React.Dispatch<React.SetStateAction<boolean>>;
  analyticsHeaderExpanded: boolean;
  setAnalyticsHeaderExpanded: React.Dispatch<React.SetStateAction<boolean>>;
  isAnalyticsPaused: boolean;
  setIsAnalyticsPaused: React.Dispatch<React.SetStateAction<boolean>>;

  // ─── Redux ─────────────────────────────────────────────────────────────────
  reduxState: any;
  setReduxState: React.Dispatch<React.SetStateAction<any>>;
  reduxLastActionMap: Record<string, any>;
  reduxSearch: string;
  setReduxSearch: React.Dispatch<React.SetStateAction<string>>;
  selectedReduxSlice: string | null;
  setSelectedReduxSlice: React.Dispatch<React.SetStateAction<string | null>>;
  selectedReduxAction: any | null;
  setSelectedReduxAction: React.Dispatch<React.SetStateAction<any | null>>;
  reduxActiveSubTab: 'state' | 'timeline';
  setReduxActiveSubTab: React.Dispatch<React.SetStateAction<'state' | 'timeline'>>;

  // ─── Settings ──────────────────────────────────────────────────────────────
  settingsActiveSubTab: SettingsSubTab;
  setSettingsActiveSubTab: React.Dispatch<React.SetStateAction<SettingsSubTab>>;
  defaultTab: ActiveTab;
  setDefaultTab: React.Dispatch<React.SetStateAction<ActiveTab>>;
  isDark: boolean;
  setIsDark: React.Dispatch<React.SetStateAction<boolean>>;
  showDuplicateLogs: boolean;
  setShowDuplicateLogs: React.Dispatch<React.SetStateAction<boolean>>;
  showConsoleLevels: {info: boolean; warn: boolean; error: boolean};
  setShowConsoleLevels: React.Dispatch<
    React.SetStateAction<{info: boolean; warn: boolean; error: boolean}>
  >;
  resetToDefaults: () => Promise<void>;
  storage: InspectorStorage | undefined;
  maxNetworkLogs: number;
  setMaxNetworkLogs: React.Dispatch<React.SetStateAction<number>>;
  maxConsoleLogs: number;
  setMaxConsoleLogs: React.Dispatch<React.SetStateAction<number>>;
  reduxAutoRefresh: boolean;
  setReduxAutoRefreshState: React.Dispatch<React.SetStateAction<boolean>>;
  reduxExpandDepth: number;
  setReduxExpandDepth: React.Dispatch<React.SetStateAction<number>>;
}

// ─── Shared component props ───────────────────────────────────────────────────

export interface CopyButtonProps {
  value: unknown | (() => unknown);
  label: string;
  iconType?: 'copy' | 'terminal' | 'fetch';
}

export interface SectionHeaderProps {
  title: string;
  value: unknown;
  expanded: boolean | undefined;
  onToggleExpand: () => void;
  showDiff?: boolean;
  isDiffing?: boolean;
  onToggleDiff?: () => void;
  showSearch?: boolean;
  isSearching?: boolean;
  onToggleSearch?: () => void;
}

export interface TreeNodeProps {
  data: unknown;
  name?: string | number;
  level?: number;
  search?: string;
  forceOpen?: boolean;
  defaultExpandDepth?: number;
}

export interface LogCardProps {
  item: NetworkLog;
  onPress: () => void;
  timelineMinStart: number;
  timelineTotalRange: number;
  isNew?: boolean;
  isSelected: boolean;
  onToggleSelect: (id: number) => void;
  searchStr?: string;
}

export interface MetaAccordionProps {
  status: number | null | undefined;
  statusColor: string;
  duration: number | null | undefined;
  size: string;
  triggeredAt: string;
  method: string;
  contentType?: string;
  url: string;
}

export interface HeadersSectionProps {
  title: string;
  headers: Record<string, string> | undefined;
  search?: string;
  resetKey?: string | number;
}

export interface SourcePageCardProps {
  routeInfo: RouteInfo;
}

export interface SectionCardProps {
  title?: string;
  count?: number;
  accentColor?: string;
  children?: React.ReactNode;
}

export interface AnalyticsEventCardProps {
  event: AnalyticsEvent & {count?: number};
  onPress: () => void;
  isNew?: boolean;
  searchStr?: string;
  isFirst: boolean;
  isLast: boolean;
  msSincePrev?: number;
  showTimestamp?: boolean;
  computedScreenName?: string;
}

export interface CodeSnippetProps {
  code: string;
  language: 'html' | 'css' | 'javascript';
  search?: string;
}

export interface AnimatedEntranceProps {
  children: React.ReactNode;
  delay?: number;
  distance?: number;
  duration?: number;
  index?: number;
  style?: ViewStyle | ViewStyle[];
}

export interface ConsoleLogCardProps {
  item: ConsoleLog;
  searchStr?: string;
}

export interface JsonContent {
  header: string;
  data: any;
}

export interface AnalyticsGraphProps {
  event: AnalyticsEvent;
  accentColor: string;
}

export interface ErrorBoundaryProps {
  children: React.ReactNode;
  onClose?: () => void;
  onReset?: () => void;
  fallbackType?: 'modal' | 'inline';
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}