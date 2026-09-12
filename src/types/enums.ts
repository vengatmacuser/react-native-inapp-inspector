// ─── Enums & Constants ─────────────────────────────────────────────────────────
// Universal TypeScript Enum Objects and Type Aliases.
// Allows both enum-style access (e.g. ActiveTab.Apis) and string literals ('apis').

export const ActiveTab = {
  Apis: 'apis',
  Analytics: 'analytics',
  Logs: 'logs',
  Redux: 'redux',
  Crash: 'crash',
  Push: 'push',
  Socket: 'socket',
  Device: 'device',
  Storage: 'storage',
  Debugging: 'debugging',
  Media: 'media',
} as const;
export type ActiveTab = (typeof ActiveTab)[keyof typeof ActiveTab];


export const Method = {
  All: 'ALL',
  Get: 'GET',
  Post: 'POST',
  Put: 'PUT',
  Patch: 'PATCH',
  Delete: 'DELETE',
  Query: 'QUERY',
  Options: 'OPTIONS',
  Head: 'HEAD',
} as const;
export type Method = (typeof Method)[keyof typeof Method];

export const StatusFilter = {
  All: 'ALL',
  TwoXx: '2xx',
  ThreeXx: '3xx',
  FourXx: '4xx',
  FiveXx: '5xx',
  Failed: 'Failed',
} as const;
export type StatusFilter = (typeof StatusFilter)[keyof typeof StatusFilter] | string;

export const SortOrder = {
  Newest: 'newest',
  Oldest: 'oldest',
} as const;
export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder];

export const LocalFilter = {
  Success: 'success',
  Failed: 'failed',
  Loading: 'loading',
} as const;
export type LocalFilter = (typeof LocalFilter)[keyof typeof LocalFilter];

export const ModalAnimationType = {
  Slide: 'slide',
  Fade: 'fade',
  None: 'none',
} as const;
export type ModalAnimationType =
  (typeof ModalAnimationType)[keyof typeof ModalAnimationType];

export const SettingsPage = {
  Main: 'main',
  Apis: 'apis',
  Logs: 'logs',
  Analytics: 'analytics',
  Redux: 'redux',
  Crash: 'crash',
  Device: 'device',
  Storage: 'storage',
  Debugging: 'debugging',
  Media: 'media',
  Push: 'push',
  Socket: 'socket',
} as const;
export type SettingsPage =
  | (typeof SettingsPage)[keyof typeof SettingsPage]
  | null;


export const SettingsSubTab = {
  Module: 'module',
  Ui: 'ui',
  Limits: 'limits',
  Capture: 'capture',
} as const;
export type SettingsSubTab =
  (typeof SettingsSubTab)[keyof typeof SettingsSubTab];

export const LogFilter = {
  All: 'all',
  Info: 'info',
  Warn: 'warn',
  Error: 'error',
  UserLog: 'user-log',
  Analytics: 'analytics',
} as const;
export type LogFilter = (typeof LogFilter)[keyof typeof LogFilter];

export const ConsoleLogType = {
  Info: 'info',
  Warn: 'warn',
  Error: 'error',
} as const;
export type ConsoleLogType =
  (typeof ConsoleLogType)[keyof typeof ConsoleLogType];

export const AnalyticsEventSource = {
  Firebase: 'firebase',
  Manual: 'manual',
} as const;
export type AnalyticsEventSource =
  (typeof AnalyticsEventSource)[keyof typeof AnalyticsEventSource];

export const GAEventCategory = {
  PageView: 'page_view',
  Ecommerce: 'ecommerce',
  System: 'system',
  Custom: 'custom',
} as const;
export type GAEventCategory =
  (typeof GAEventCategory)[keyof typeof GAEventCategory];

export const StackFrameType = {
  App: 'app',
  Dependency: 'dependency',
  Runtime: 'runtime',
  Native: 'native',
} as const;
export type StackFrameType =
  (typeof StackFrameType)[keyof typeof StackFrameType];

export const DiffResultType = {
  Added: 'added',
  Removed: 'removed',
  Changed: 'changed',
} as const;
export type DiffResultType =
  (typeof DiffResultType)[keyof typeof DiffResultType];

export const CrashType = {
  Native: 'native',
  Js: 'js',
  Promise: 'promise',
  Render: 'render',
  Custom: 'custom',
} as const;
export type CrashType = (typeof CrashType)[keyof typeof CrashType];

export const CrashExportFormat = {
  Text: 'text',
  Markdown: 'markdown',
  Json: 'json',
} as const;
export type CrashExportFormat =
  (typeof CrashExportFormat)[keyof typeof CrashExportFormat];

export const CrashDetailSubTab = {
  Stack: 'stack',
  Diagnostics: 'diagnostics',
  Breadcrumbs: 'breadcrumbs',
  Raw: 'raw',
} as const;
export type CrashDetailSubTab =
  (typeof CrashDetailSubTab)[keyof typeof CrashDetailSubTab];

export const CrashFilterType = {
  All: 'all',
  Fatal: 'fatal',
  Js: 'js',
  Promise: 'promise',
  Render: 'render',
  Native: 'native',
} as const;
export type CrashFilterType =
  (typeof CrashFilterType)[keyof typeof CrashFilterType];

export const BreadcrumbType = {
  Navigation: 'navigation',
  Network: 'network',
  Redux: 'redux',
  Console: 'console',
  User: 'user',
  System: 'system',
} as const;
export type BreadcrumbType =
  (typeof BreadcrumbType)[keyof typeof BreadcrumbType];

export const PushAppState = {
  Foreground: 'foreground',
  Background: 'background',
  Quit: 'quit',
  ColdStart: 'cold_start',
} as const;
export type PushAppState =
  (typeof PushAppState)[keyof typeof PushAppState] | string;

export const PushActionType = {
  Received: 'received',
  Opened: 'opened',
  Dismissed: 'dismissed',
  ActionPress: 'action_press',
} as const;
export type PushActionType =
  (typeof PushActionType)[keyof typeof PushActionType] | string;

export const PushDetailSubTab = {
  Preview: 'preview',
  Payload: 'payload',
  Headers: 'headers',
  Raw: 'raw',
} as const;
export type PushDetailSubTab =
  (typeof PushDetailSubTab)[keyof typeof PushDetailSubTab];

export const PushFilterType = {
  All: 'all',
  Foreground: 'foreground',
  Background: 'background',
  Opened: 'opened',
} as const;
export type PushFilterType =
  (typeof PushFilterType)[keyof typeof PushFilterType] | string;

export const SocketStatus = {
  Connecting: 'connecting',
  Open: 'open',
  Closed: 'closed',
  Error: 'error',
} as const;
export type SocketStatus =
  (typeof SocketStatus)[keyof typeof SocketStatus] | string;

export const SocketFrameDirection = {
  Send: 'send',
  Receive: 'receive',
} as const;
export type SocketFrameDirection =
  (typeof SocketFrameDirection)[keyof typeof SocketFrameDirection];

export const SocketFrameType = {
  Text: 'text',
  Json: 'json',
  Binary: 'binary',
  Ping: 'ping',
  Pong: 'pong',
  SocketIo: 'socket.io',
  Custom: 'custom',
} as const;
export type SocketFrameType =
  (typeof SocketFrameType)[keyof typeof SocketFrameType] | string;

export const SocketDetailSubTab = {
  Messages: 'messages',
  Overview: 'overview',
  Params: 'params',
  Raw: 'raw',
} as const;
export type SocketDetailSubTab =
  (typeof SocketDetailSubTab)[keyof typeof SocketDetailSubTab];

export const SocketFilterType = {
  All: 'all',
  Open: 'open',
  Closed: 'closed',
  Error: 'error',
  SocketIo: 'socket.io',
  WebSocket: 'ws',
} as const;
export type SocketFilterType =
  (typeof SocketFilterType)[keyof typeof SocketFilterType] | string;