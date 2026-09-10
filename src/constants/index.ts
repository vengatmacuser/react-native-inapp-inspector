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
  ALL: AppColors.slate500,     // Slate
  GET: AppColors.emerald600,   // Emerald
  POST: AppColors.blue600,     // Royal Blue
  PUT: AppColors.amber600,     // Amber Gold
  PATCH: AppColors.violet600,  // Rich Violet
  DELETE: AppColors.red600,    // Crimson Red
  QUERY: AppColors.sky600,     // Sky Cyan (HTTP QUERY RFC 9535)
  OPTIONS: AppColors.slate600, // Cool Slate
  HEAD: AppColors.cyan600,     // Cyan
};

export const DOMAIN_COLORS: string[] = AppColors.domainColors;

export const DURATION_FAST_MS = 200;
export const DURATION_SLOW_MS = 800;

// Package version — auto-generated from package.json at build time.
// See scripts/gen-version.js (wired to the "prebuild" npm script).
export {LIB_VERSION} from './version';
