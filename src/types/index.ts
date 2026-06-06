import React from 'react';

// ─── Analytics ────────────────────────────────────────────────────────────────

export type ActiveTab = 'insights' | 'apis' | 'analytics' | 'logs' | 'webview' | 'redux';

export interface ConsoleLog {
  id: number;
  type: 'info' | 'warn' | 'error';
  message: string;
  timestamp: number;
  caller?: string;
  sourceMethod?: 'log' | 'info' | 'warn' | 'error';
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
}

export interface RouteInfo {
  path: string;
  params: any;
}

export type Method = 'ALL' | 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
export type StatusFilter = 'ALL' | '2xx' | '3xx' | '4xx' | '5xx' | 'Failed';
export type SortOrder = 'newest' | 'oldest';

export type LocalFilter = 'success' | 'failed' | 'loading';

export type GroupedListItem =
  | {
      type: 'header';
      id: string;
      pageName: string;
      color: string;
      stats: {success: number; failed: number; loading: number};
      timestamp: number;
      activeFilters: Set<LocalFilter>;
      isCollapsed: boolean;
      isFirst: boolean;
    }
  | {type: 'log'; id: number; log: NetworkLog; isLast: boolean; color: string};

export type DiffResult = {
  type: 'added' | 'removed' | 'changed';
  path: string;
  oldVal?: any;
  newVal?: any;
};

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
}

export interface TreeNodeProps {
  data: unknown;
  name?: string | number;
  level?: number;
  search?: string;
  forceOpen?: boolean;
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
  status: number | null;
  statusColor: string;
  duration: number | null;
  size: string;
  triggeredAt: string;
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
