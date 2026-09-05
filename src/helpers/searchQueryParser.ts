import {NetworkLog, SearchScope} from '../types';
import {markSearchFilterUsed} from './telemetry';

export interface SearchQueryOptions {
  scope?: SearchScope;
  isRegex?: boolean;
  isCaseSensitive?: boolean;
}

/**
 * Universal substring search for NetworkLog.
 * Checks whether a given NetworkLog matches all query keywords across all log fields.
 */
export function matchNetworkLogQuery(
  log: NetworkLog,
  searchQuery: string,
  routePath?: string,
  _options?: SearchQueryOptions,
): boolean {
  if (!searchQuery || searchQuery.trim().length === 0) return true;

  markSearchFilterUsed();

  const rawTokens = searchQuery.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (rawTokens.length === 0) return true;

  const methodRaw = (log.method || '').toLowerCase();
  const urlRaw = (log.url || '').toLowerCase();
  const statusStr = log.status != null ? String(log.status).toLowerCase() : 'pending';
  const statusNum =
    typeof log.status === 'number'
      ? log.status
      : log.status != null
      ? parseInt(String(log.status), 10)
      : null;
  const clientRaw = (log.client || '').toLowerCase();
  const callerRaw = (log.caller || '').toLowerCase();
  const pathRaw = (routePath || (log as any)?.routeInfo?.path || '').toLowerCase();

  const reqRaw =
    typeof log.request === 'string'
      ? log.request.toLowerCase()
      : log.request != null
      ? JSON.stringify(log.request).toLowerCase()
      : '';
  const resRaw =
    typeof log.response === 'string'
      ? log.response.toLowerCase()
      : log.response != null
      ? JSON.stringify(log.response).toLowerCase()
      : '';
  const reqHeadersRaw = log.requestHeaders
    ? JSON.stringify(log.requestHeaders).toLowerCase()
    : '';
  const resHeadersRaw = log.responseHeaders
    ? JSON.stringify(log.responseHeaders).toLowerCase()
    : '';

  const corpus = [
    methodRaw,
    urlRaw,
    statusStr,
    pathRaw,
    callerRaw,
    clientRaw,
    reqRaw,
    resRaw,
    reqHeadersRaw,
    resHeadersRaw,
  ].join(' ');

  return rawTokens.every(token => {
    if (corpus.includes(token)) return true;
    // Error status keywords
    if (token === 'error' || token === 'failed' || token === 'err' || token === 'fail') {
      return log.status === 0 || (statusNum !== null && statusNum >= 400);
    }
    // Success status keywords
    if (token === 'success' || token === 'ok' || token === '2xx') {
      return statusNum !== null && statusNum >= 200 && statusNum < 300;
    }
    return false;
  });
}
