import {NetworkLog} from '../types';

/**
 * Parses query strings like `method:POST is:error slow:>1s status:200 auth`
 * and checks whether a given NetworkLog matches all tokens.
 */
export function matchNetworkLogQuery(
  log: NetworkLog,
  searchQuery: string,
  routePath?: string,
): boolean {
  if (!searchQuery || searchQuery.trim().length === 0) return true;

  const rawTokens = searchQuery
    .trim()
    .match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g) || [];

  if (rawTokens.length === 0) return true;

  const methodStr = (log.method || '').toLowerCase();
  const urlStr = (log.url || '').toLowerCase();
  const statusNum = typeof log.status === 'number' ? log.status : parseInt(String(log.status || 0), 10);
  const statusStr = String(log.status ?? '');
  const durationNum = log.duration || 0;
  const clientStr = (log.client || '').toLowerCase();
  const reqStr = typeof log.request === 'string' ? log.request : JSON.stringify(log.request || '');
  const resStr = typeof log.response === 'string' ? log.response : JSON.stringify(log.response || '');
  const reqHeadersStr = JSON.stringify(log.requestHeaders || '').toLowerCase();
  const resHeadersStr = JSON.stringify(log.responseHeaders || '').toLowerCase();
  const pathStr = routePath ? routePath.toLowerCase() : '';

  const fullSearchCorpus = [
    methodStr,
    urlStr,
    statusStr,
    pathStr,
    clientStr,
    reqStr.toLowerCase(),
    resStr.toLowerCase(),
    reqHeadersStr,
    resHeadersStr,
  ].join(' ');

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
      if (val.startsWith('>=')) {
        const threshold = parseInt(val.slice(2), 10);
        if (isNaN(threshold) || statusNum < threshold) return false;
      } else if (val.startsWith('>')) {
        const threshold = parseInt(val.slice(1), 10);
        if (isNaN(threshold) || statusNum <= threshold) return false;
      } else if (val.startsWith('<=')) {
        const threshold = parseInt(val.slice(2), 10);
        if (isNaN(threshold) || statusNum > threshold) return false;
      } else if (val.startsWith('<')) {
        const threshold = parseInt(val.slice(1), 10);
        if (isNaN(threshold) || statusNum >= threshold) return false;
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
      if (flag === 'error' || flag === 'failed' || flag === 'err' || flag === 'fail') {
        const isErr = log.status === 0 || log.status == null || statusNum >= 400;
        if (!isErr) return false;
      } else if (flag === 'success' || flag === 'ok' || flag === '2xx') {
        const isSuccess = statusNum >= 200 && statusNum < 300;
        if (!isSuccess) return false;
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
        if (urlStr.startsWith('https') || !urlStr.startsWith('http')) return false;
      } else if (flag === 'json') {
        const isJson =
          reqHeadersStr.includes('application/json') ||
          resHeadersStr.includes('application/json') ||
          urlStr.includes('.json');
        if (!isJson) return false;
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

    // 7. path:<PATH> or p:<PATH>
    if (lowerToken.startsWith('path:') || lowerToken.startsWith('p:')) {
      const targetPath = lowerToken.replace(/^(path:|p:)/, '').trim();
      if (!urlStr.includes(targetPath) && !pathStr.includes(targetPath)) {
        return false;
      }
      continue;
    }

    // 8. req:<TERM> or body:<TERM>
    if (lowerToken.startsWith('req:') || lowerToken.startsWith('body:')) {
      const target = lowerToken.replace(/^(req:|body:)/, '').trim();
      if (!reqStr.toLowerCase().includes(target)) return false;
      continue;
    }

    // 9. res:<TERM>
    if (lowerToken.startsWith('res:')) {
      const target = lowerToken.slice(4).trim();
      if (!resStr.toLowerCase().includes(target)) return false;
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

    // 11. Generic Plain Substring Match
    if (!fullSearchCorpus.includes(lowerToken)) {
      return false;
    }
  }

  return true;
}
