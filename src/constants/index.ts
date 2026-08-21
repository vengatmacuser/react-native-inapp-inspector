import {Method} from '../types';

// Styles
import {AppColors} from '../styles/AppColors';

// Type Definition
import {StatusFilter} from '../types';

export const STATUS_FILTERS: string[] = [
  'ALL',
  '2xx',
  '200',
  '3xx',
  '4xx',
  '400',
  '404',
  '5xx',
  '500',
  'Failed',
];

export const METHOD_COLORS: Record<Method, string> = {
  ALL: '#64748B',     // Slate
  GET: '#059669',     // Emerald
  POST: '#2563EB',    // Royal Blue
  PUT: '#D97706',     // Amber Gold
  PATCH: '#7C3AED',   // Rich Violet
  DELETE: '#DC2626',  // Crimson Red
};

export const DOMAIN_COLORS: string[] = AppColors.domainColors;

export const DURATION_FAST_MS = 200;
export const DURATION_SLOW_MS = 800;

// Package version — auto-generated from package.json at build time.
// See scripts/gen-version.js (wired to the "prebuild" npm script).
export {LIB_VERSION} from './version';
