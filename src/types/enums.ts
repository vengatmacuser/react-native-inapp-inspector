// ─── Enum-like union types ────────────────────────────────────────────────────
// The codebase treats these as string enums (used for tab keys, filters, etc.).

export type ActiveTab = 'apis' | 'analytics' | 'logs' | 'redux';

export type Method = 'ALL' | 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
export type StatusFilter = 'ALL' | '2xx' | '3xx' | '4xx' | '5xx' | 'Failed';
export type SortOrder = 'newest' | 'oldest';

export type LocalFilter = 'success' | 'failed' | 'loading';

export type ModalAnimationType = 'slide' | 'fade' | 'none';

export type SettingsPage =
  | 'main'
  | 'apis'
  | 'logs'
  | 'analytics'
  | 'redux'
  | null;

export type SettingsSubTab = 'module' | 'ui';
export type LogFilter = 'all' | 'info' | 'warn' | 'error' | 'user-log' | 'analytics';