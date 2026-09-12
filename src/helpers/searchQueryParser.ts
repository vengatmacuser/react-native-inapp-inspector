import {NetworkLog, SearchScope} from '../types';
import {markSearchFilterUsed} from './telemetry';

export interface SearchQueryOptions {
  scope?: SearchScope;
  isRegex?: boolean;
  isCaseSensitive?: boolean;
}

// Infrastructure / CDN / proxy headers that should not cause false positive search matches
const PROXY_INFRA_HEADERS = new Set([
  'via',
  'nel',
  'report-to',
  'reporting-endpoints',
  'cf-ray',
  'cf-cache-status',
  'alt-svc',
  'server',
  'etag',
  'date',
  'x-powered-by',
  'x-request-id',
  'x-content-type-options',
  'accept-ranges',
  'transfer-encoding',
  'connection',
  'keep-alive',
]);

/**
 * Tokenize a search query string respecting quotes (e.g. 'hello "world query" -term')
 */
function tokenizeQuery(query: string): string[] {
  const tokens: string[] = [];
  const regex = /[^\s"']+|"([^"]*)"|'([^']*)'/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(query)) !== null) {
    if (match[1] != null) {
      tokens.push(match[1]);
    } else if (match[2] != null) {
      tokens.push(match[2]);
    } else if (match[0]) {
      tokens.push(match[0]);
    }
  }
  return tokens;
}

/**
 * Advanced, high-accuracy search engine for NetworkLog.
 * - Accurately filters by URL, Method, Status, Client, Page/Route, and Body.
 * - Automatically excludes proxy/CDN routing noise (e.g. 'via: 2.0 heroku-router') from false matching.
 * - Supports smart prefixes (url:, method:, status:, header:, body:, client:, page:).
 * - Supports negative filter (-term), regex matching, and search scopes.
 */
export function matchNetworkLogQuery(
  log: NetworkLog,
  searchQuery: string,
  routePath?: string,
  options?: SearchQueryOptions,
): boolean {
  if (!searchQuery || searchQuery.trim().length === 0) return true;

  markSearchFilterUsed();

  const isCaseSensitive = Boolean(options?.isCaseSensitive);
  const isRegex = Boolean(options?.isRegex);
  const scope: SearchScope = options?.scope || 'all';

  // Extract core properties
  const rawMethod = log.method || '';
  const rawUrl = log.url || '';
  const rawStatus = log.status != null ? String(log.status) : 'pending';
  const statusNum =
    typeof log.status === 'number'
      ? log.status
      : log.status != null
      ? parseInt(String(log.status), 10)
      : null;
  const rawClient = log.client || '';
  const rawCaller = log.caller || '';
  const rawPage = routePath || (log as any)?.routeInfo?.path || '';

  const serializePayload = (data: any): string => {
    if (data == null) return '';
    if (typeof data === 'string') return data;
    try {
      return JSON.stringify(data);
    } catch {
      return '';
    }
  };

  const rawReqBody = serializePayload(log.request);
  const rawResBody = serializePayload(log.response);

  // Filter application headers from infrastructure proxy headers
  const extractHeaders = (
    headers?: Record<string, string>,
    includeAll = false,
  ): string => {
    if (!headers || typeof headers !== 'object') return '';
    const entries = Object.entries(headers);
    if (includeAll) {
      return entries.map(([k, v]) => `${k}: ${v}`).join('\n');
    }
    return entries
      .filter(([k]) => !PROXY_INFRA_HEADERS.has(k.toLowerCase()))
      .map(([k, v]) => `${k}: ${v}`)
      .join('\n');
  };

  const rawReqHeaders = extractHeaders(log.requestHeaders, scope === 'headers');
  const rawResHeaders = extractHeaders(log.responseHeaders, scope === 'headers');

  // Build target corpus based on scope
  const buildScopeCorpus = (targetScope: SearchScope): string => {
    switch (targetScope) {
      case 'url':
        return rawUrl;
      case 'reqBody':
        return rawReqBody;
      case 'resBody':
        return rawResBody;
      case 'headers':
        return `${rawReqHeaders}\n${rawResHeaders}`;
      case 'all':
      default:
        return [
          rawUrl,
          rawMethod,
          rawStatus,
          rawPage,
          rawClient,
          rawCaller,
          rawReqBody,
          rawResBody,
          rawReqHeaders,
          rawResHeaders,
        ].join(' ');
    }
  };

  const defaultCorpus = buildScopeCorpus(scope);

  // Helper to match a single token with case / regex settings
  const matchField = (field: string, token: string): boolean => {
    if (isRegex) {
      try {
        const re = new RegExp(token, isCaseSensitive ? '' : 'i');
        return re.test(field);
      } catch {
        // Fallback to literal search if regex is invalid
      }
    }
    if (isCaseSensitive) {
      return field.includes(token);
    }
    return field.toLowerCase().includes(token.toLowerCase());
  };

  const tokens = tokenizeQuery(searchQuery);
  if (tokens.length === 0) return true;

  return tokens.every(token => {
    let isNegated = false;
    let actualToken = token;

    // Negation prefix support: -term or !term
    if (
      actualToken.length > 1 &&
      (actualToken.startsWith('-') || actualToken.startsWith('!'))
    ) {
      isNegated = true;
      actualToken = actualToken.slice(1);
    }

    if (!actualToken) return true;

    let matched = false;

    // 1. Smart Prefixes: url:, method:, status:, header:, body:, client:, page:
    const colonIdx = actualToken.indexOf(':');
    if (colonIdx > 0) {
      const prefix = actualToken.slice(0, colonIdx).toLowerCase();
      const val = actualToken.slice(colonIdx + 1);

      if (prefix === 'url' || prefix === 'u' || prefix === 'path') {
        matched = matchField(rawUrl, val);
      } else if (prefix === 'method' || prefix === 'm') {
        matched = matchField(rawMethod, val);
      } else if (prefix === 'status' || prefix === 's') {
        if (val === 'error' || val === 'failed' || val === 'err') {
          matched = log.status === 0 || (statusNum !== null && statusNum >= 400);
        } else if (val === 'success' || val === 'ok') {
          matched = statusNum !== null && statusNum >= 200 && statusNum < 300;
        } else if (val.endsWith('xx')) {
          const lead = val[0];
          matched = rawStatus.startsWith(lead);
        } else {
          matched = rawStatus.includes(val);
        }
      } else if (prefix === 'header' || prefix === 'h') {
        const allHeaders = `${extractHeaders(log.requestHeaders, true)}\n${extractHeaders(log.responseHeaders, true)}`;
        matched = matchField(allHeaders, val);
      } else if (prefix === 'body' || prefix === 'b') {
        matched = matchField(rawReqBody, val) || matchField(rawResBody, val);
      } else if (prefix === 'client' || prefix === 'c') {
        matched = matchField(rawClient, val);
      } else if (prefix === 'page' || prefix === 'p') {
        matched = matchField(rawPage, val);
      } else {
        matched = matchField(defaultCorpus, actualToken);
      }
    } else {
      // 2. Status shorthand: 404, 500, 200, 4xx, 5xx, error, success
      const lowerToken = actualToken.toLowerCase();
      if (
        lowerToken === 'error' ||
        lowerToken === 'failed' ||
        lowerToken === 'err' ||
        lowerToken === 'fail'
      ) {
        matched =
          log.status === 0 ||
          (statusNum !== null && statusNum >= 400) ||
          matchField(defaultCorpus, actualToken);
      } else if (
        lowerToken === 'success' ||
        lowerToken === 'ok' ||
        lowerToken === '2xx'
      ) {
        matched =
          (statusNum !== null && statusNum >= 200 && statusNum < 300) ||
          matchField(defaultCorpus, actualToken);
      } else if (/^[1-5]xx$/.test(lowerToken)) {
        matched = rawStatus.startsWith(lowerToken[0]);
      } else {
        // 3. Primary Corpus Search
        matched = matchField(defaultCorpus, actualToken);
      }
    }

    return isNegated ? !matched : matched;
  });
}
