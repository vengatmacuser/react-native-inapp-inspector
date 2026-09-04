import axios from "axios";
import {setupGlobalCrashHandler} from "./crashHandler";
import {RouteInfo} from "../types";

type NetworkLog = {
  id: number;
  url: string;
  method: string;
  status?: number;
  request?: any;
  response?: any;
  duration?: number;
  startTime: number;
  caller?: string; // ✅ Captures the file and line number
  client?: string; // ✅ Captures request client: axios, fetch, xhr, apollo, etc.
  requestHeaders?: Record<string, string>;
  responseHeaders?: Record<string, string>;
  routeInfo?: RouteInfo;
};

let logs: NetworkLog[] = [];
let listeners: ((logs: NetworkLog[]) => void)[] = [];
let counter = 0;
let isNetworkModuleEnabled = true;
let currentRouteProvider: (() => RouteInfo | null) | null = null;

export const setRouteInfoProvider = (
  provider: (() => RouteInfo | null) | null,
) => {
  currentRouteProvider = provider;
};

export const setNetworkModuleEnabled = (enabled: boolean) => {
  isNetworkModuleEnabled = enabled;
};

export const getNetworkModuleEnabled = () => isNetworkModuleEnabled;

const ALLOWED_METHODS = [
  "GET",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
  "HEAD",
  "OPTIONS",
  "CONNECT",
  "TRACE",
];

const IGNORED_URL_PATTERNS: RegExp[] = [
  /\/symbolicate(?:\?|$)/i,
  /\/index\.bundle(?:\?|$)/i,
  /\/open-debugger(?:\?|$)/i,
  /:(?:8081|8082|8083|19000|19001)\/(?:index\.bundle|symbolicate|hot|message|status)/i,
  /google-analytics\.com\/mp\/collect/i,
  /analytics\.google\.com/i,
];

function shouldIgnoreUrl(url: string | undefined | null): boolean {
  if (!url) return false;
  return IGNORED_URL_PATTERNS.some((re) => re.test(url));
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseXHRResponseHeaders(
  headerStr: string | null | undefined,
): Record<string, string> | undefined {
  if (!headerStr || typeof headerStr !== "string") return undefined;
  const lines = headerStr.trim().split(/[\r\n]+/);
  const result: Record<string, string> = {};
  lines.forEach((line) => {
    const idx = line.indexOf(":");
    if (idx > 0) {
      const key = line.substring(0, idx).trim().toLowerCase();
      const val = line.substring(idx + 1).trim();
      result[key] = val;
    }
  });
  return Object.keys(result).length > 0 ? result : undefined;
}

function normaliseHeaders(
  raw: Headers | undefined | null,
): Record<string, string> | undefined {
  if (!raw) return undefined;

  if (typeof (raw as Headers).forEach === "function") {
    const result: Record<string, string> = {};
    (raw as Headers).forEach((value: string, key: string | number) => {
      result[key] = value;
    });
    return Object.keys(result).length > 0 ? result : undefined;
  }

  if (Array.isArray(raw)) {
    const result: Record<string, string> = {};
    (raw as string[][]).forEach(([key, value]) => {
      result[key] = value;
    });
    return Object.keys(result).length > 0 ? result : undefined;
  }

  const obj = raw as any as Record<string, string>;
  const result: Record<string, string> = {};
  Object.entries(obj).forEach(([key, value]) => {
    if (value != null) {
      result[key] = String(value);
    }
  });
  return Object.keys(result).length > 0 ? result : undefined;
}

// ✅ Parse FormData for File Upload previews
function parseRequestData(data: any): any {
  if (!data) return data;

  if (data && data._parts && Array.isArray(data._parts)) {
    const parsedFormData: any = {};
    data._parts.forEach((part: any) => {
      const key = part[0];
      const value = part[1];

      if (value && typeof value === "object" && value.uri) {
        parsedFormData[key] = {
          _isFile: true,
          name: value.name || "unknown",
          type: value.type || "unknown",
          uri: value.uri,
        };
      } else {
        parsedFormData[key] = value;
      }
    });
    return { _isFormData: true, ...parsedFormData };
  }

  return data;
}

// ✅ Magic function to extract file and line number from the call stack
function getCallerFromStack(): string {
  try {
    const stack = new Error().stack;
    if (!stack) return "Unknown";
    const lines = stack.split("\n");
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // Skip internal react-native network modules and the logger itself
      if (
        line.includes("networkLogger") ||
        line.includes("node_modules") ||
        line.includes("Error") ||
        line.includes("regeneratorRuntime")
      ) {
        continue;
      }
      return line.trim().replace(/^at /, "");
    }
  } catch (e) {}
  return "Unknown";
}

// ─── Subscribe ────────────────────────────────────────────────────────────────

export const subscribeNetworkLogs = (
  callback: (logs: NetworkLog[]) => void,
) => {
  listeners.push(callback);
  callback([...logs]);
  return () => {
    listeners = listeners.filter((l) => l !== callback);
  };
};

export const clearNetworkLogs = () => {
  logs = [];
  notify();
};

export const getNetworkLogs = () => [...logs];

let maxNetworkLogsLimit = 250;

export const setMaxNetworkLogsLimit = (limit: number): void => {
  maxNetworkLogsLimit = Math.max(10, limit);
  if (logs.length > maxNetworkLogsLimit) {
    logs = logs.slice(0, maxNetworkLogsLimit);
    notify();
  }
};

export const getMaxNetworkLogsLimit = (): number => maxNetworkLogsLimit;

export const pruneNetworkLogs = (targetCount?: number): number => {
  const countToKeep = targetCount !== undefined ? Math.max(0, targetCount) : Math.floor(logs.length / 2);
  const pruned = logs.length - countToKeep;
  if (pruned > 0) {
    logs = logs.slice(0, countToKeep);
    notify();
  }
  return Math.max(0, pruned);
};

// ─── Internal ─────────────────────────────────────────────────────────────────

const notify = () => {
  const snapshot = [...logs];
  listeners.forEach((cb) => cb(snapshot));
};

const addOrUpdateLog = (log: NetworkLog) => {
  if (!isNetworkModuleEnabled) return;
  const method = log.method?.toUpperCase();

  if (method && !ALLOWED_METHODS.includes(method)) return;

  if (shouldIgnoreUrl(log.url)) return;

  const index = logs.findIndex((l) => l.id === log.id);

  if (index >= 0) {
    logs[index] = { ...logs[index], ...log };
  } else {
    logs.unshift(log);
  }

  logs = logs.slice(0, maxNetworkLogsLimit);
  notify();
};

let isInsideFetch = false;

// ─── Setup ────────────────────────────────────────────────────────────────────

export const setupNetworkLogger = () => {
  if ((globalThis as any).__NETWORK_LOGGER_INITIALIZED__) return;
  (globalThis as any).__NETWORK_LOGGER__ = addOrUpdateLog;

  // 1. Hook XMLHttpRequest
  const globalXHR = (globalThis as any).XMLHttpRequest;
  if (globalXHR && globalXHR.prototype && !(globalThis as any).__XHR_LOGGER_INITIALIZED__) {
    (globalThis as any).__XHR_LOGGER_INITIALIZED__ = true;
    const originalOpen = globalXHR.prototype.open;
    const originalSend = globalXHR.prototype.send;
    const originalSetRequestHeader = globalXHR.prototype.setRequestHeader;

    globalXHR.prototype.open = function (
      method: string,
      url: string | any,
      async?: boolean,
      user?: string | null,
      password?: string | null,
    ) {
      this.__logMethod = (method || "GET").toUpperCase();
      this.__logUrl = typeof url === "string" ? url : String(url);
      this.__logRequestHeaders = {};
      this.__logStartTime = Date.now();
      this.__logCaller = getCallerFromStack();

      return originalOpen.apply(this, [method, url, async !== false, user, password]);
    };

    globalXHR.prototype.setRequestHeader = function (header: string, value: string) {
      if (header && value != null) {
        if (!this.__logRequestHeaders) this.__logRequestHeaders = {};
        this.__logRequestHeaders[header.toLowerCase()] = String(value);
      }
      return originalSetRequestHeader.apply(this, [header, value]);
    };

    globalXHR.prototype.send = function (body?: any) {
      if (!isNetworkModuleEnabled || isInsideFetch || this.__inAppInspectorTracked) {
        return originalSend.apply(this, [body]);
      }

      const url = this.__logUrl || "";
      const method = this.__logMethod || "GET";

      if (shouldIgnoreUrl(url)) {
        return originalSend.apply(this, [body]);
      }

      const id = counter++;
      this.__logId = id;
      const start = this.__logStartTime || Date.now();
      const caller = this.__logCaller || "Unknown";
      const requestHeaders = this.__logRequestHeaders;

      let client = "xhr";
      if (
        requestHeaders?.["apollographql-client-name"] ||
        url.toLowerCase().includes("/graphql")
      ) {
        client = "apollo";
      } else if (caller.toLowerCase().includes("axios")) {
        client = "axios";
      }

      const currentRoute = currentRouteProvider ? currentRouteProvider() : null;

      addOrUpdateLog({
        id,
        url,
        method,
        startTime: start,
        caller,
        client,
        routeInfo: currentRoute || undefined,
        request: method === "GET" ? undefined : parseRequestData(body),
        requestHeaders:
          Object.keys(requestHeaders || {}).length > 0 ? requestHeaders : undefined,
      });

      const onFinished = () => {
        if (this.__logFinished) return;
        this.__logFinished = true;
        const duration = Date.now() - start;
        let responseData: any = null;

        try {
          if (this.responseType === "" || this.responseType === "text") {
            const raw = this.responseText;
            try {
              responseData = JSON.parse(raw);
            } catch {
              responseData = raw;
            }
          } else if (this.responseType === "json") {
            responseData = this.response;
          } else if (this.responseType === "blob") {
            responseData = `[Blob: ${this.response?.size || 0} bytes]`;
          } else {
            responseData = `[${this.responseType || "Unknown"} Data]`;
          }
        } catch {
          responseData = this.response || null;
        }

        const rawRespHeaders = this.getAllResponseHeaders
          ? this.getAllResponseHeaders()
          : "";
        const responseHeaders = parseXHRResponseHeaders(rawRespHeaders);

        addOrUpdateLog({
          id,
          url,
          method,
          status: this.status,
          response: responseData,
          duration,
          startTime: start,
          caller,
          client,
          responseHeaders,
        });
      };

      const onErrorOrAbort = () => {
        if (this.__logFinished) return;
        this.__logFinished = true;
        const duration = Date.now() - start;

        addOrUpdateLog({
          id,
          url,
          method,
          status: this.status || 0,
          response: "Network request failed",
          duration,
          startTime: start,
          caller,
          client,
        });
      };

      this.addEventListener("load", onFinished);
      this.addEventListener("error", onErrorOrAbort);
      this.addEventListener("abort", onErrorOrAbort);
      this.addEventListener("timeout", onErrorOrAbort);

      return originalSend.apply(this, [body]);
    };
  }

  // 2. Hook fetch
  const originalFetch = (globalThis as any).fetch;

  if (originalFetch) {
    (globalThis as any).fetch = async (url: any, options: any = {}) => {
      if (!isNetworkModuleEnabled) return originalFetch(url, options);
      const method = (options?.method || "GET").toUpperCase();

      const id = counter++;
      const start = Date.now();
      const finalUrl = typeof url === "string" ? url : url?.url;

      if (shouldIgnoreUrl(finalUrl)) return originalFetch(url, options);

      let caller = "Unknown";
      let requestHeaders: Record<string, string> | undefined;
      let client = "fetch";

      try {
        requestHeaders = normaliseHeaders(options?.headers);
        caller = getCallerFromStack(); // ✅ Capture call line

        if (
          requestHeaders?.["apollographql-client-name"] ||
          finalUrl?.toLowerCase().includes("/graphql")
        ) {
          client = "apollo";
        } else if (
          requestHeaders?.["x-requested-with"]?.toLowerCase().includes("xmlhttprequest")
        ) {
          client = "xhr";
        } else if (caller?.toLowerCase().includes("axios")) {
          client = "axios";
        }

        const currentRoute = currentRouteProvider ? currentRouteProvider() : null;

        addOrUpdateLog({
          id,
          url: finalUrl,
          method,
          startTime: start,
          caller,
          client,
          routeInfo: currentRoute || undefined,
          request: method === "GET" ? undefined : parseRequestData(options?.body),
          requestHeaders,
        });
      } catch {}

      try {
        isInsideFetch = true;
        let response: any;
        try {
          response = await originalFetch(url, options);
        } finally {
          isInsideFetch = false;
        }
        const duration = Date.now() - start;

        try {
          const responseHeaders = normaliseHeaders(response.headers);
          let data: any = null;
          const contentType =
            responseHeaders?.["content-type"] ||
            responseHeaders?.["Content-Type"] ||
            "";
          if (contentType.includes("image/")) {
            data = "[Image Data]";
          } else {
            try {
              const clone = response.clone();
              const text = await clone.text();
              try {
                data = JSON.parse(text);
              } catch {
                data = text;
              }
            } catch {}
          }

          addOrUpdateLog({
            id,
            url: finalUrl,
            method,
            status: response.status,
            response: data,
            duration,
            startTime: start,
            caller,
            client,
            responseHeaders,
          });
        } catch {}

        return response;
      } catch (error) {
        try {
          addOrUpdateLog({
            id,
            url: finalUrl,
            method,
            status: 0,
            startTime: start,
            response: error,
            caller,
            client,
            duration: Date.now() - start,
          });
        } catch {}
        throw error;
      }
    };
  }

  // 3. Hook Axios — patches default instance and future axios.create() instances
  try {
    if (axios) {
      addAxiosInterceptors(axios);
      const originalCreate = axios.create;
      if (typeof originalCreate === "function") {
        axios.create = function (...args: any[]) {
          const instance = originalCreate.apply(this, args);
          addAxiosInterceptors(instance);
          return instance;
        };
      }
    }
  } catch (_e) {
    // Axios not available — fetch/XHR mode
  }

  try {
    setupGlobalCrashHandler();
  } catch {}

  (globalThis as any).__NETWORK_LOGGER_INITIALIZED__ = true;
};

// ─── Axios interceptor helper ─────────────────────────────────────────────────
export const addAxiosInterceptors = (axiosInstance: any) => {
  axiosInstance.interceptors.request.use(async (config: any) => {
    const method = (config.method || "GET").toUpperCase();

    const id = counter++;
    const start = Date.now();
    const caller = getCallerFromStack(); // ✅ Capture call line

    let url = config.url ?? "";
    if (!url.startsWith("http")) url = `${config.baseURL ?? ""}${url}`;

    // ✅ Leave config untagged so the response interceptor skips it too.
    if (shouldIgnoreUrl(url)) return config;

    config.__logId = id;
    config.__logStart = start;
    config.__logCaller = caller;

    const currentRoute = currentRouteProvider ? currentRouteProvider() : null;

    addOrUpdateLog({
      id,
      url,
      method,
      startTime: start,
      caller,
      client: "axios",
      routeInfo: currentRoute || undefined,
      request: method === "GET" ? undefined : parseRequestData(config.data),
      requestHeaders: normaliseHeaders(config.headers),
    });

    return config;
  });

  axiosInstance.interceptors.response.use(
    (response: any) => {
      const config = response.config || {};
      const id = config.__logId;
      const start = config.__logStart;
      const caller = config.__logCaller;
      const method = (config.method || "GET").toUpperCase();

      if (id == null) return response;

      let url = config.url ?? "";
      if (!url.startsWith("http")) url = `${config.baseURL ?? ""}${url}`;

      addOrUpdateLog({
        id,
        url,
        method,
        status: response.status,
        response: response.data,
        startTime: start || Date.now(),
        duration: start != null ? Date.now() - start : undefined,
        caller,
        client: "axios",
        responseHeaders: normaliseHeaders(response.headers),
      });

      return response;
    },
    (error: any) => {
      const config = error.config || {};
      const id = config.__logId;
      const start = config.__logStart;
      const caller = config.__logCaller;
      const method = (config.method || "GET").toUpperCase();

      if (id != null) {
        let url = config.url ?? "";
        if (!url.startsWith("http")) url = `${config.baseURL ?? ""}${url}`;

        addOrUpdateLog({
          id,
          url,
          method,
          status: error.response?.status ?? 0,
          response: error.response?.data ?? error.message,
          startTime: start || Date.now(),
          duration: start != null ? Date.now() - start : undefined,
          caller,
          client: "axios",
          responseHeaders: normaliseHeaders(error.response?.headers),
        });
      }
      return Promise.reject(error);
    },
  );
};

// Auto-initialize logger on module load so startup requests are never missed
if (typeof globalThis !== "undefined") {
  try {
    setupNetworkLogger();
  } catch {}
}
