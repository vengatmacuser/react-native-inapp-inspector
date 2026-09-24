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

/**
 * Calculates a field-weighted relevance score for a NetworkLog against a search query.
 * Higher score = higher relevance ranking.
 *
 * Weighting Hierarchy:
 * - Exact Endpoint Match (e.g. '/order/retrieve-booking' vs 'retrieve-booking' / 'retrieve-book'): 300-500 pts
 * - URL Pathname Match: 180-400 pts
 * - Full URL Match: 120 pts
 * - HTTP Method Match: 100 pts
 * - Status Code Match: 90 pts
 * - Route/Screen Name Match: 80 pts
 * - Query Params Match: 60 pts
 * - Request Headers Match: 40 pts
 * - Request Body Match: 30 pts
 * - Response Headers Match: 20 pts
 * - Response Body JSON Payload Match: 5 pts (kept lowest to prevent large JSON noise from ranking above URLs)
 */
export function scoreNetworkLogQuery(
  log: NetworkLog,
  searchQuery: string,
  routePath?: string,
  options?: SearchQueryOptions,
): number {
  if (!searchQuery || searchQuery.trim().length === 0) return 0;

  const isCaseSensitive = Boolean(options?.isCaseSensitive);
  const scope: SearchScope = options?.scope || 'all';

  const rawMethod = (log.method || '').trim();
  const rawUrl = (log.url || '').trim();
  const rawStatus = log.status != null ? String(log.status) : 'pending';
  const rawClient = log.client || '';
  const rawCaller = log.caller || '';
  const rawPage = routePath || (log as any)?.routeInfo?.path || '';

  // Extract pathname, endpoint segment, and query string from URL
  let pathname = rawUrl;
  let queryString = '';
  let endpoint = '';
  try {
    const qIndex = rawUrl.indexOf('?');
    const pathPart = qIndex >= 0 ? rawUrl.slice(0, qIndex) : rawUrl;
    queryString = qIndex >= 0 ? rawUrl.slice(qIndex + 1) : '';
    const schemeIndex = pathPart.indexOf('://');
    const pathWithoutScheme =
      schemeIndex >= 0 ? pathPart.slice(schemeIndex + 3) : pathPart;
    const firstSlash = pathWithoutScheme.indexOf('/');
    pathname =
      firstSlash >= 0 ? pathWithoutScheme.slice(firstSlash) : pathWithoutScheme;
    const segments = pathname.split('/').filter(Boolean);
    endpoint = segments[segments.length - 1] || '';
  } catch {
    pathname = rawUrl;
    endpoint = rawUrl;
  }

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

  const norm = (s: string) => (isCaseSensitive ? s : s.toLowerCase());

  const qTrimmed = norm(searchQuery.trim());
  const normEndpoint = norm(endpoint);
  const normPathname = norm(pathname);
  const normUrl = norm(rawUrl);
  const normMethod = norm(rawMethod);
  const normStatus = norm(rawStatus);
  const normPage = norm(rawPage);
  const normClient = norm(rawClient);
  const normCaller = norm(rawCaller);
  const normQueryString = norm(queryString);
  const normReqHeaders = norm(rawReqHeaders);
  const normResHeaders = norm(rawResHeaders);
  const normReqBody = norm(rawReqBody);
  const normResBody = norm(rawResBody);

  let score = 0;

  // 1. Full Query phrase evaluation
  if (normEndpoint === qTrimmed) {
    score += 500; // Exact endpoint name match
  } else if (normEndpoint.startsWith(qTrimmed)) {
    score += 350; // Endpoint starts with query (e.g. 'retrieve-book' on 'retrieve-booking')
  } else if (normEndpoint.includes(qTrimmed)) {
    score += 250; // Endpoint contains query
  }

  if (normPathname === qTrimmed) {
    score += 400; // Exact path match
  } else if (normPathname.includes(qTrimmed)) {
    score += 180; // Path contains query
  }

  if (normUrl.includes(qTrimmed)) {
    score += 120;
  }

  if (normMethod === qTrimmed) {
    score += 100;
  }

  if (normStatus === qTrimmed) {
    score += 90;
  }

  if (normPage.includes(qTrimmed)) {
    score += 80;
  }

  if (normQueryString.includes(qTrimmed)) {
    score += 60;
  }

  if (normReqHeaders.includes(qTrimmed)) {
    score += 40;
  }

  if (normReqBody.includes(qTrimmed)) {
    score += 30;
  }

  if (normResHeaders.includes(qTrimmed)) {
    score += 20;
  }

  if (normResBody.includes(qTrimmed)) {
    score += 5; // Low weight for response body JSON
  }

  // 2. Token-by-token evaluation
  const tokens = tokenizeQuery(searchQuery);
  tokens.forEach(token => {
    if (!token || token.startsWith('-') || token.startsWith('!')) return;
    const t = norm(token);

    // Smart Prefixes
    const colonIdx = t.indexOf(':');
    if (colonIdx > 0) {
      const prefix = t.slice(0, colonIdx);
      const val = t.slice(colonIdx + 1);
      if (prefix === 'url' || prefix === 'u' || prefix === 'path') {
        if (normPathname.includes(val)) score += 150;
        else if (normUrl.includes(val)) score += 100;
      } else if (prefix === 'method' || prefix === 'm') {
        if (normMethod === val) score += 150;
      } else if (prefix === 'status' || prefix === 's') {
        if (normStatus.includes(val)) score += 150;
      } else if (prefix === 'body' || prefix === 'b') {
        if (normReqBody.includes(val)) score += 80;
        if (normResBody.includes(val)) score += 40;
      } else if (prefix === 'header' || prefix === 'h') {
        if (normReqHeaders.includes(val) || normResHeaders.includes(val))
          score += 80;
      }
      return;
    }

    if (normEndpoint === t) score += 150;
    else if (normEndpoint.startsWith(t)) score += 100;
    else if (normEndpoint.includes(t)) score += 70;

    if (normPathname.includes(t)) score += 40;
    else if (normUrl.includes(t)) score += 25;

    if (normMethod === t) score += 50;
    if (normStatus === t) score += 40;
    if (normPage.includes(t)) score += 30;
    if (normClient.includes(t) || normCaller.includes(t)) score += 20;
    if (normReqHeaders.includes(t)) score += 15;
    if (normReqBody.includes(t)) score += 10;
    if (normResHeaders.includes(t)) score += 8;
    if (normResBody.includes(t)) score += 2;
  });

  return score;
}
