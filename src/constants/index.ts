import {Method} from '../types';

// Styles
import {AppColors} from '../styles/AppColors';

// Type Definition
import {StatusFilter} from '../types';

export const STATUS_FILTERS: StatusFilter[] = [
  'ALL',
  '2xx',
  '3xx',
  '4xx',
  '5xx',
  'Failed',
];

export const METHOD_COLORS: Record<Method, string> = {
  ALL: AppColors.grayText,
  GET: AppColors.purple,
  POST: AppColors.greenColor,
  PUT: AppColors.lightOrange,
  PATCH: AppColors.offerPurple,
  DELETE: AppColors.errorColor,
};

export const DOMAIN_COLORS = [
  '#1a5276',
  '#8e44ad',
  '#1e8449',
  '#c0392b',
  '#d35400',
  '#d68910',
  '#16a085',
  '#27ae60',
  '#2c3e50',
  '#c2185b',
];

export const DURATION_FAST_MS = 200;
export const DURATION_SLOW_MS = 800;

// Package version — auto-generated from package.json at build time.
// See scripts/gen-version.js (wired to the "prebuild" npm script).
export {LIB_VERSION} from './version';
