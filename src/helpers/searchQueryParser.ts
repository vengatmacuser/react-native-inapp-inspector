import {NetworkLog, SearchScope} from '../types';

export interface SearchQueryOptions {
  scope?: SearchScope;
  isRegex?: boolean;
  isCaseSensitive?: boolean;
}

/**
 * Parses query strings like `method:POST is:error slow:>1s status:200 auth`
 * and checks whether a given NetworkLog matches all tokens against the specified scope.
 */
export function matchNetworkLogQuery(
  log: NetworkLog,
  searchQuery: string,
  routePath?: string,
  options?: SearchQueryOptions,
): boolean {
  if (!searchQuery || searchQuery.trim().length === 0) return true;

  // Split tokens by spaces or commas while respecting quotes
  const rawTokens =
    searchQuery.trim().match(/(?:[^\s,"']+|"[^"]*"|'[^']*')+/g) || [];

  if (rawTokens.length === 0) return true;

  const isCaseSensitive = Boolean(options?.isCaseSensitive);
  const isRegex = Boolean(options?.isRegex);
  const scope = options?.scope || 'all';

  const methodRaw = log.method || '';
  const urlRaw = log.url || '';
  const statusNum =
    typeof log.status === 'number'
      ? log.status
      : log.status != null
      ? parseInt(String(log.status), 10)
      : null;
  const statusStr = log.status != null ? String(log.status) : 'pending';
  const durationNum = log.duration || 0;
  const clientRaw = log.client || '';
  const callerRaw = log.caller || '';
  const reqRaw =
    typeof log.request === 'string'
      ? log.request
      : log.request != null
      ? JSON.stringify(log.request)
      : '';
  const resRaw =
    typeof log.response === 'string'
      ? log.response
      : log.response != null
      ? JSON.stringify(log.response)
      : '';
  const reqHeadersRaw = log.requestHeaders
    ? JSON.stringify(log.requestHeaders)
    : '';
  const resHeadersRaw = log.responseHeaders
    ? JSON.stringify(log.responseHeaders)
    : '';
  const pathRaw = routePath || (log as any)?.routeInfo?.path || '';

  // Construct search corpus based on active scope
  const getScopedCorpus = (caseSens: boolean): string => {
    let parts: string[] = [];
    if (scope === 'url') {
      parts = [methodRaw, urlRaw, pathRaw, callerRaw];
    } else if (scope === 'reqBody') {
      parts = [reqRaw];
    } else if (scope === 'resBody') {
      parts = [resRaw];
    } else if (scope === 'headers') {
      parts = [reqHeadersRaw, resHeadersRaw];
    } else {
      parts = [
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
      ];
    }
    const combined = parts.join(' ');
    return caseSens ? combined : combined.toLowerCase();
  };

  const targetCorpus = getScopedCorpus(isCaseSensitive);

  const methodStr = methodRaw.toLowerCase();
  const urlStr = urlRaw.toLowerCase();
  const clientStr = clientRaw.toLowerCase();
  const callerStr = callerRaw.toLowerCase();
  const reqStr = reqRaw.toLowerCase();
  const resStr = resRaw.toLowerCase();
  const reqHeadersStr = reqHeadersRaw.toLowerCase();
  const resHeadersStr = resHeadersRaw.toLowerCase();
  const pathStr = pathRaw.toLowerCase();

  for (const rawToken of rawTokens) {
    const token = rawToken.replace(/^["']|["']$/g, '').trim();
    if (!token) continue;

    const lowerToken = token.toLowerCase();

    // 1. method:<VAL> or m:<VAL>
    if (lowerToken.startsWith('method:') || lowerToken.startsWith('m:')) {
      const targetMethod = lowerToken.replace(/^(method:|m:)/, '').trim();
      if (targetMethod.startsWith('!')) {
        if (methodStr === targetMethod.slice(1)) return false;
      } else {
        if (methodStr !== targetMethod) return false;
      }
      continue;
    }

    // 2. status:<VAL> or s:<VAL>
    if (lowerToken.startsWith('status:') || lowerToken.startsWith('s:')) {
      const val = lowerToken.replace(/^(status:|s:)/, '').trim();
      if (val === 'pending' || val === 'loading') {
        if (log.status != null) return false;
      } else if (val.startsWith('>=')) {
        const threshold = parseInt(val.slice(2), 10);
        if (isNaN(threshold) || statusNum === null || statusNum < threshold) return false;
      } else if (val.startsWith('>')) {
        const threshold = parseInt(val.slice(1), 10);
        if (isNaN(threshold) || statusNum === null || statusNum <= threshold) return false;
      } else if (val.startsWith('<=')) {
        const threshold = parseInt(val.slice(2), 10);
        if (isNaN(threshold) || statusNum === null || statusNum > threshold) return false;
      } else if (val.startsWith('<')) {
        const threshold = parseInt(val.slice(1), 10);
        if (isNaN(threshold) || statusNum === null || statusNum >= threshold) return false;
      } else if (val.endsWith('xx') || val.endsWith('x')) {
        const prefix = val.replace(/x/g, '');
        if (!statusStr.startsWith(prefix)) return false;
      } else {
        const targetCode = parseInt(val, 10);
        if (!isNaN(targetCode)) {
          if (statusNum !== targetCode) return false;
        } else if (!statusStr.includes(val)) {
          return false;
        }
      }
      continue;
    }

    // 3. is:<FLAG>
    if (lowerToken.startsWith('is:')) {
      const flag = lowerToken.slice(3).trim();
      if (
        flag === 'error' ||
        flag === 'failed' ||
        flag === 'err' ||
        flag === 'fail'
      ) {
        const isErr =
          log.status === 0 || (statusNum !== null && statusNum >= 400);
        if (!isErr) return false;
      } else if (flag === 'success' || flag === 'ok' || flag === '2xx') {
        const isSuccess = statusNum !== null && statusNum >= 200 && statusNum < 300;
        if (!isSuccess) return false;
      } else if (flag === 'pending' || flag === 'loading') {
        if (log.status != null) return false;
      } else if (flag === 'slow') {
        if (durationNum < 1000) return false;
      } else if (flag === 'fast') {
        if (durationNum >= 200) return false;
      } else if (flag === 'graphql' || flag === 'gql') {
        const isGql =
          urlStr.includes('graphql') ||
          clientStr === 'graphql' ||
          clientStr === 'apollo';
        if (!isGql) return false;
      } else if (flag === 'https') {
        if (!urlStr.startsWith('https')) return false;
      } else if (flag === 'http') {
        if (urlStr.startsWith('https') || !urlStr.startsWith('http'))
          return false;
      } else if (flag === 'json') {
        const isJson =
          reqHeadersStr.includes('application/json') ||
          resHeadersStr.includes('application/json') ||
          urlStr.includes('.json');
        if (!isJson) return false;
      } else if (flag === 'image') {
        const isImg =
          resHeadersStr.includes('image/') ||
          /\.(png|jpe?g|gif|webp|svg)/i.test(urlStr);
        if (!isImg) return false;
      }
      continue;
    }

    // 4. slow:<DURATION> or dur:<DURATION> or duration:<DURATION>
    if (
      lowerToken.startsWith('slow:') ||
      lowerToken.startsWith('dur:') ||
      lowerToken.startsWith('duration:')
    ) {
      const val = lowerToken.replace(/^(slow:|dur:|duration:)/, '').trim();
      let thresholdMs = 0;
      let isGreater = true;

      let cleanVal = val;
      if (val.startsWith('>=')) {
        isGreater = true;
        cleanVal = val.slice(2);
      } else if (val.startsWith('>')) {
        isGreater = true;
        cleanVal = val.slice(1);
      } else if (val.startsWith('<=')) {
        isGreater = false;
        cleanVal = val.slice(2);
      } else if (val.startsWith('<')) {
        isGreater = false;
        cleanVal = val.slice(1);
      }

      if (cleanVal.endsWith('s') && !cleanVal.endsWith('ms')) {
        thresholdMs = parseFloat(cleanVal.slice(0, -1)) * 1000;
      } else if (cleanVal.endsWith('ms')) {
        thresholdMs = parseFloat(cleanVal.slice(0, -2));
      } else {
        thresholdMs = parseFloat(cleanVal);
      }

      if (!isNaN(thresholdMs)) {
        if (isGreater) {
          if (durationNum < thresholdMs) return false;
        } else {
          if (durationNum > thresholdMs) return false;
        }
      }
      continue;
    }

    // 5. client:<CLIENT> or c:<CLIENT>
    if (lowerToken.startsWith('client:') || lowerToken.startsWith('c:')) {
      const targetClient = lowerToken.replace(/^(client:|c:)/, '').trim();
      if (!clientStr.includes(targetClient)) return false;
      continue;
    }

    // 6. domain:<DOMAIN> or d:<DOMAIN>
    if (lowerToken.startsWith('domain:') || lowerToken.startsWith('d:')) {
      const targetDomain = lowerToken.replace(/^(domain:|d:)/, '').trim();
      if (!urlStr.includes(targetDomain)) return false;
      continue;
    }

    // 7. path:<PATH> or p:<PATH> or page:<PAGE>
    if (
      lowerToken.startsWith('path:') ||
      lowerToken.startsWith('p:') ||
      lowerToken.startsWith('page:')
    ) {
      const targetPath = lowerToken
        .replace(/^(path:|p:|page:)/, '')
        .trim();
      if (
        !urlStr.includes(targetPath) &&
        !pathStr.includes(targetPath) &&
        !callerStr.includes(targetPath)
      ) {
        return false;
      }
      continue;
    }

    // 8. req:<TERM> or body:<TERM>
    if (lowerToken.startsWith('req:') || lowerToken.startsWith('body:')) {
      const target = lowerToken.replace(/^(req:|body:)/, '').trim();
      if (!reqStr.includes(target)) return false;
      continue;
    }

    // 9. res:<TERM>
    if (lowerToken.startsWith('res:')) {
      const target = lowerToken.slice(4).trim();
      if (!resStr.includes(target)) return false;
      continue;
    }

    // 10. header:<TERM> or h:<TERM>
    if (lowerToken.startsWith('header:') || lowerToken.startsWith('h:')) {
      const target = lowerToken.replace(/^(header:|h:)/, '').trim();
      if (!reqHeadersStr.includes(target) && !resHeadersStr.includes(target)) {
        return false;
      }
      continue;
    }

    // 11. Generic Match (handles Regex, Case-sensitivity, and Scoped corpus)
    if (isRegex) {
      try {
        const re = new RegExp(token, isCaseSensitive ? '' : 'i');
        if (!re.test(targetCorpus)) return false;
      } catch {
        const queryTerm = isCaseSensitive ? token : lowerToken;
        if (!targetCorpus.includes(queryTerm)) return false;
      }
    } else {
      const queryTerm = isCaseSensitive ? token : lowerToken;
      if (!targetCorpus.includes(queryTerm)) {
        // Special case: if user typed "error" / "failed", check error status
        if (
          queryTerm === 'error' ||
          queryTerm === 'failed' ||
          queryTerm === 'fail'
        ) {
          const isErr =
            log.status === 0 || (statusNum !== null && statusNum >= 400);
          if (isErr) continue;
        }
        return false;
      }
    }
  }

  return true;
}
