import React from 'react';
import {ViewStyle} from 'react-native';
import {Animated, PanResponderInstance} from 'react-native';
import type {
  ActiveTab,
  BreadcrumbType,
  CrashType,
  GroupedListItem,
  LocalFilter,
  LogFilter,
  Method,
  PushActionType,
  PushAppState,
  SettingsPage,
  SettingsSubTab,
  SocketDetailSubTab,
  SocketFilterType,
  SocketFrameDirection,
  SocketFrameType,
  SocketStatus,
  SortOrder,
  StatusFilter,
} from './index';

export type SearchScope = 'all' | 'url' | 'reqBody' | 'resBody' | 'headers';

export interface ParsedStackFrame {
  method: string;
  file: string;
  lineNumber: number;
  column: number;
  raw?: string;
  isAppCode?: boolean;
}

export interface CrashBreadcrumb {
  type: BreadcrumbType;
  message: string;
  timestamp: number;
  data?: any;
}

export interface CrashRecord {
  id: string;
  error?: Error | any;
  isFatal: boolean;
  type: CrashType;
  message: string;
  name?: string;
  stack?: string;
  parsedStack?: ParsedStackFrame[];
  componentStack?: string;
  timestamp: number;
  dateStr: string;
  timeStr: string;
  deviceInfo?: {
    platform: string;
    osVersion?: string;
    rnVersion?: string;
    isHermes?: boolean;
    isFabric?: boolean;
    appState?: string;
  };
  memoryInfo?: {
    usedJSHeapSize?: number;
    totalJSHeapSize?: number;
  };
  breadcrumbs?: CrashBreadcrumb[];
  logId?: number;
}

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

export interface AnalyticsFilters {
  categories: Set<string>;
  screens: Set<string>;
  sources: Set<string>;
  userTypes: Set<string>;
  timeWindow: 'all' | '1m' | '5m' | '15m' | '1h';
  payloadComplexity: 'all' | 'none' | 'simple' | 'heavy';
  hasRevenue: boolean;
  hasItems: boolean;
  hasUserProps: boolean;
  hasParams: boolean;
  onlyDuplicates: boolean;
  onlyConversions: boolean;
  sortBy: 'time_desc' | 'time_asc' | 'revenue_desc' | 'count_desc';
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
  /** Client identifier: axios, fetch, xhr, apollo, etc. */
  client?: 'axios' | 'fetch' | 'xhr' | 'apollo' | 'graphql' | string;
  caller?: string;
  routeInfo?: RouteInfo;
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
  stack?: string;
  caller?: string;
  callerFile?: string;
  callerLine?: number;
  callerCol?: number;
  originType?: 'saga' | 'thunk' | 'ui' | 'direct' | 'listener';
  sliceName?: string;
}

// ─── Settings persistence ─────────────────────────────────────────────────────

export interface InspectorStorage {
  getItem: (key: string) => string | null | Promise<string | null>;
  setItem: (key: string, value: string) => void | Promise<void>;
  removeItem?: (key: string) => void | Promise<void>;
}

export interface PersistedSettings {
  isDark?: boolean;
  language?: string;
  modalHeightPercent?: number;
  modalAnimationType?: string;
  tabVisibility?: Record<string, boolean>;
  defaultTab?: string;
  maxNetworkLogs?: number;
  maxConsoleLogs?: number;
  maxAnalyticsEventsLimit?: number;
  maxCrashLogs?: number;
  maxPushLogsLimit?: number;
  maxSocketLogsLimit?: number;
  isSocketAutoCaptureEnabled?: boolean;
  isGroupByPageEnabled?: boolean;
  isAutoRamLimitEnabled?: boolean;
  showConsoleLevels?: {info: boolean; warn: boolean; error: boolean};
  reduxAutoRefresh?: boolean;
  reduxExpandDepth?: number;
  showDuplicateLogs?: boolean;
  showUpdateToast?: boolean;
  useNativeFab?: boolean;
  shakeToOpen?: boolean;
  telemetryClientId?: string;
  telemetryDeviceId?: string;
  deviceRegistered?: boolean;
  deviceFirstSeen?: number;
  telemetryLastPing?: number;
  telemetryLastActive?: number;
  starPromptActioned?: boolean;
  starPromptLastShown?: number;
  starPromptFirstSeen?: number;
  // ─── Capture & Recording Settings ──────────────────────────────────────────
  captureImageFormat?: 'png' | 'jpeg' | 'webp';
  captureAutoHide?: boolean;
  captureAudioMode?: 'none' | 'app' | 'mic';
  captureFps?: number;
  captureScale?: number;
  captureBitrate?: number;
  captureMaxDurationSeconds?: number;
  captureAutoGif?: boolean;
}

// ─── Inspector component props / context ──────────────────────────────────────

export interface NetworkInspectorProps {
  enabled?: boolean;
  telemetry?: boolean;
  storage?: InspectorStorage;
  navigationRef?: any;
  appIcon?: any;
  environment?: 'DEV' | 'UAT' | 'PrePROD' | 'PROD' | 'QA' | 'Staging' | string;
  initialVisible?: boolean;
  visible?: boolean;
  remoteConfig?: boolean | any;
}

export interface NavigationTrackerProps {
  onStateChange: (state: any) => void;
}

export interface InspectorContextValue {
  // ─── Modal / launcher ──────────────────────────────────────────────────────
  visible: boolean;
  setVisible: React.Dispatch<React.SetStateAction<boolean>>;
  closeModal: () => void;
  isMinimized: boolean;
  setIsMinimized: React.Dispatch<React.SetStateAction<boolean>>;
  minimizeInspector: () => void;
  isDismissed: boolean;
  setIsDismissed: React.Dispatch<React.SetStateAction<boolean>>;
  dismissInspector: () => void;
  isReady: boolean;
  enabled: boolean;
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
  mediaCount: number;
  refreshMediaCount: () => Promise<number>;

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
  isAboutOpen: boolean;
  setIsAboutOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isSupportOpen: boolean;
  setIsSupportOpen: React.Dispatch<React.SetStateAction<boolean>>;
  updateAvailable: boolean;
  latestNpmVersion: string | null;
  clearAnim: Animated.Value;
  activePulseAnim: Animated.Value;
  unreadPulseAnim: Animated.Value;
  runClearAllWithAnimation: () => void;

  // ─── FAB / launcher ────────────────────────────────────────────────────────
  useNativeFab: boolean;
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
  searchScope: SearchScope;
  setSearchScope: React.Dispatch<React.SetStateAction<SearchScope>>;
  isRegexSearch: boolean;
  setIsRegexSearch: React.Dispatch<React.SetStateAction<boolean>>;
  isCaseSensitive: boolean;
  setIsCaseSensitive: React.Dispatch<React.SetStateAction<boolean>>;
  quickFilter: string;
  setQuickFilter: React.Dispatch<React.SetStateAction<string>>;
  statusFilters: Set<StatusFilter>;
  setStatusFilters: React.Dispatch<React.SetStateAction<Set<StatusFilter>>>;
  methodFilters: Set<Method>;
  setMethodFilters: React.Dispatch<React.SetStateAction<Set<Method>>>;
  latencyFilter: 'all' | 'fast' | 'normal' | 'slow';
  setLatencyFilter: React.Dispatch<React.SetStateAction<'all' | 'fast' | 'normal' | 'slow'>>;
  protocolFilter: 'all' | 'https' | 'http';
  setProtocolFilter: React.Dispatch<React.SetStateAction<'all' | 'https' | 'http'>>;
  networkSortBy: 'time_desc' | 'time_asc' | 'duration_desc' | 'duration_asc' | 'size_desc';
  setNetworkSortBy: React.Dispatch<React.SetStateAction<'time_desc' | 'time_asc' | 'duration_desc' | 'duration_asc' | 'size_desc'>>;
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
  loadMoreSection: (pageName: string, step?: number) => void;
  handleDelete: () => void;
  isGroupByPageEnabled: boolean;
  setIsGroupByPageEnabled: React.Dispatch<React.SetStateAction<boolean>>;

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

  // ─── Analytics ─────────────────────────────────────────────────────────────
  analyticsEvents: AnalyticsEvent[];
  filteredAnalyticsEvents: (AnalyticsEvent & {count?: number})[];
  analyticsSearch: string;
  setAnalyticsSearch: React.Dispatch<React.SetStateAction<string>>;
  analyticsFilters: AnalyticsFilters;
  setAnalyticsFilters: React.Dispatch<React.SetStateAction<AnalyticsFilters>>;
  isAnalyticsFilterApplied: boolean;
  resetAnalyticsFilters: () => void;
  newEventIds: Set<number>;
  isAnalyticsLayoutReady: boolean;
  setIsAnalyticsLayoutReady: React.Dispatch<React.SetStateAction<boolean>>;
  analyticsHeaderExpanded: boolean;
  setAnalyticsHeaderExpanded: React.Dispatch<React.SetStateAction<boolean>>;

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

  // ─── Crash ─────────────────────────────────────────────────────────────────
  crashRecords: CrashRecord[];
  setCrashRecords: React.Dispatch<React.SetStateAction<CrashRecord[]>>;
  selectedCrash: CrashRecord | null;
  setSelectedCrash: React.Dispatch<React.SetStateAction<CrashRecord | null>>;
  lastReadCrashesCount: number;
  maxCrashLogs: number;
  setMaxCrashLogs: React.Dispatch<React.SetStateAction<number>>;
  clearAllCrashes: () => void;

  // ─── Push Notifications ──────────────────────────────────────────────────
  pushRecords: PushNotificationRecord[];
  filteredPushRecords: PushNotificationRecord[];
  selectedPush: PushNotificationRecord | null;
  setSelectedPush: React.Dispatch<React.SetStateAction<PushNotificationRecord | null>>;
  pushSearch: string;
  setPushSearch: React.Dispatch<React.SetStateAction<string>>;
  pushQuickFilter: string;
  setPushQuickFilter: React.Dispatch<React.SetStateAction<string>>;
  lastReadPushCount: number;
  unreadPushCount: number;
  maxPushLogs: number;
  setMaxPushLogs: React.Dispatch<React.SetStateAction<number>>;
  clearAllPushLogs: () => void;
  simulatePush: (preset?: 'salesforce' | 'fcm' | 'apns' | 'deeplink' | 'rich_media' | 'custom', customData?: any) => void;

  // ─── WebSocket / Socket.IO ────────────────────────────────────────────────
  socketRecords: SocketConnectionRecord[];
  filteredSocketRecords: SocketConnectionRecord[];
  selectedSocket: SocketConnectionRecord | null;
  setSelectedSocket: React.Dispatch<React.SetStateAction<SocketConnectionRecord | null>>;
  socketSearch: string;
  setSocketSearch: React.Dispatch<React.SetStateAction<string>>;
  socketQuickFilter: string;
  setSocketQuickFilter: React.Dispatch<React.SetStateAction<string>>;
  lastReadSocketCount: number;
  unreadSocketCount: number;
  maxSocketLogs: number;
  setMaxSocketLogs: React.Dispatch<React.SetStateAction<number>>;
  clearAllSocketLogs: () => void;
  deleteSocketRecord?: (id: string) => void;
  deleteMultipleSocketRecords?: (ids: string[]) => void;
  simulateSocket: (preset?: 'chat' | 'crypto' | 'socketio' | 'echo' | 'custom', customData?: any) => void;

  // ─── Settings ──────────────────────────────────────────────────────────────
  settingsActiveSubTab: SettingsSubTab;
  setSettingsActiveSubTab: React.Dispatch<React.SetStateAction<SettingsSubTab>>;
  defaultTab: ActiveTab;
  setDefaultTab: React.Dispatch<React.SetStateAction<ActiveTab>>;
  isDark: boolean;
  setIsDark: React.Dispatch<React.SetStateAction<boolean>>;
  showDuplicateLogs: boolean;
  setShowDuplicateLogs: React.Dispatch<React.SetStateAction<boolean>>;
  showUpdateToast: boolean;
  setShowUpdateToast: React.Dispatch<React.SetStateAction<boolean>>;
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
  maxAnalyticsEventsLimit: number;
  setMaxAnalyticsEventsLimit: React.Dispatch<React.SetStateAction<number>>;
  isAutoRamLimitEnabled: boolean;
  setIsAutoRamLimitEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  deviceFreeRamMb: number;
  reduxAutoRefresh: boolean;
  setReduxAutoRefreshState: React.Dispatch<React.SetStateAction<boolean>>;
  reduxExpandDepth: number;
  setReduxExpandDepth: React.Dispatch<React.SetStateAction<number>>;

  // ─── Capture & Recording Settings ──────────────────────────────────────────
  captureFps: number;
  setCaptureFps: React.Dispatch<React.SetStateAction<number>>;
  captureScale: number;
  setCaptureScale: React.Dispatch<React.SetStateAction<number>>;
  captureBitrate: number;
  setCaptureBitrate: React.Dispatch<React.SetStateAction<number>>;
  captureMaxDurationSeconds: number;
  setCaptureMaxDurationSeconds: React.Dispatch<React.SetStateAction<number>>;
  captureImageFormat: 'png' | 'jpeg' | 'webp';
  setCaptureImageFormat: React.Dispatch<React.SetStateAction<'png' | 'jpeg' | 'webp'>>;
  captureAudioMode: 'none' | 'app' | 'mic';
  setCaptureAudioMode: React.Dispatch<React.SetStateAction<'none' | 'app' | 'mic'>>;
  captureAutoHide: boolean;
  setCaptureAutoHide: React.Dispatch<React.SetStateAction<boolean>>;
  captureAutoGif: boolean;
  setCaptureAutoGif: React.Dispatch<React.SetStateAction<boolean>>;
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
  onPress?: (item: ConsoleLog) => void;
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

export type PushSource = string;

export interface PushNotificationRecord {
  id: string;
  title?: string;
  body?: string;
  subtitle?: string;
  source: PushSource;
  domain?: string;
  appState: PushAppState;
  action: PushActionType;
  actionId?: string;
  userText?: string;
  timestamp: number;
  data: Record<string, any>;
  rawPayload: any;
  channelId?: string;
  imageUrl?: string;
  sound?: string;
  badge?: number;
  collapseKey?: string;
  priority?: string;
  customDomainAttributes?: Record<string, any>;
}

export interface PushFilterState {
  search: string;
  source: string;
  appState: string;
  action: string;
}

export interface PushStats {
  total: number;
  foreground: number;
  background: number;
  opened: number;
  sources: Record<string, number>;
}

export interface PushCardProps {
  item: PushNotificationRecord;
  onPress: () => void;
  searchStr?: string;
  isNew?: boolean;
}

export interface PushDetailProps {
  item: PushNotificationRecord | null;
  onClose: () => void;
}

// ─── WebSocket / Socket.IO ──────────────────────────────────────────────────

export interface SocketFrame {
  id: string;
  timestamp: number;
  direction: SocketFrameDirection;
  type: SocketFrameType;
  data: any;
  raw?: any;
  size?: number;
  eventName?: string;
  ackId?: number;
}

export interface SocketConnectionRecord {
  id: string;
  url: string;
  protocols?: string | string[];
  readyState: number;
  status: SocketStatus;
  startTime: number;
  endTime?: number;
  duration?: number;
  closeCode?: number;
  closeReason?: string;
  error?: string | any;
  client: 'websocket' | 'socket.io' | string;
  frames: SocketFrame[];
  sentCount: number;
  receivedCount: number;
  totalBytesSent: number;
  totalBytesReceived: number;
  caller?: string;
  query?: Record<string, string>;
  headers?: Record<string, string>;
  routeInfo?: RouteInfo;
}

export interface SocketFilterState {
  search: string;
  status: Set<string>;
  types: Set<string>;
  sortBy: 'time_desc' | 'time_asc' | 'frames_desc' | 'duration_desc';
}

export interface SocketStats {
  total: number;
  open: number;
  closed: number;
  error: number;
  totalFrames: number;
  sentFrames: number;
  receivedFrames: number;
  totalBytes: number;
}

export interface SocketCardProps {
  item: SocketConnectionRecord;
  onPress: () => void;
  searchStr?: string;
  isNew?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
  serialNumber?: number;
}

export interface SocketDetailProps {
  item: SocketConnectionRecord | null;
  onClose: () => void;
}