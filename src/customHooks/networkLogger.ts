import axios from "axios";

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
  requestHeaders?: Record<string, string>;
  responseHeaders?: Record<string, string>;
};

let logs: NetworkLog[] = [];
let listeners: ((logs: NetworkLog[]) => void)[] = [];
let counter = 0;

const ALLOWED_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"];

const IGNORED_URL_PATTERNS: RegExp[] = [
  /\/symbolicate(?:[/?#]|$)/i,
  /\/index\.bundle(?:\?|$)/i,
  /\/hot(?:\?|$)/i,
  /\/message(?:\?|$)/i,
  /\/open-debugger(?:\?|$)/i,
  /\/status(?:\?|$)/i,
  /127\.0\.0\.1:(?:8081|8082|8083|19000|19001|19002|3000|8000)/i,
  /localhost:(?:8081|8082|8083|19000|19001|19002|3000|8000)\/index\.bundle/i,
];

function shouldIgnoreUrl(url: string | undefined | null): boolean {
  if (!url) return false;
  return IGNORED_URL_PATTERNS.some((re) => re.test(url));
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

// ─── Internal ─────────────────────────────────────────────────────────────────

const notify = () => {
  const snapshot = [...logs];
  listeners.forEach((cb) => cb(snapshot));
};

const addOrUpdateLog = (log: NetworkLog) => {
  const method = log.method?.toUpperCase();

  if (!ALLOWED_METHODS.includes(method)) return;

  if (shouldIgnoreUrl(log.url)) return;

  const index = logs.findIndex((l) => l.id === log.id);

  if (index >= 0) {
    logs[index] = { ...logs[index], ...log };
  } else {
    logs.unshift(log);
  }

  logs = logs.slice(0, 100);
  notify();
};

// ─── Setup ────────────────────────────────────────────────────────────────────

export const setupNetworkLogger = () => {
  if ((globalThis as any).__NETWORK_LOGGER_INITIALIZED__) return;
  (globalThis as any).__NETWORK_LOGGER__ = addOrUpdateLog;

  const originalFetch = (globalThis as any).fetch;

  if (originalFetch) {
    (globalThis as any).fetch = async (url: any, options: any = {}) => {
      const method = (options?.method || "GET").toUpperCase();
      if (!ALLOWED_METHODS.includes(method)) return originalFetch(url, options);

      const id = counter++;
      const start = Date.now();
      const finalUrl = typeof url === "string" ? url : url?.url;

      if (shouldIgnoreUrl(finalUrl)) return originalFetch(url, options);

      let caller = "Unknown";
      let requestHeaders: Record<string, string> | undefined;

      try {
        requestHeaders = normaliseHeaders(options?.headers);
        caller = getCallerFromStack(); // ✅ Capture call line

        addOrUpdateLog({
          id,
          url: finalUrl,
          method,
          startTime: start,
          caller,
          request: method === "GET" ? undefined : parseRequestData(options?.body),
          requestHeaders,
        });
      } catch {}

      try {
        const response = await originalFetch(url, options);
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
            duration: Date.now() - start,
          });
        } catch {}
        throw error;
      }
    };
  }

  // Hook Axios — patches both the default instance and any future axios.create() instances
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
    // Axios not available — fetch-only mode
  }

  (globalThis as any).__NETWORK_LOGGER_INITIALIZED__ = true;
};

// ─── Axios interceptor helper ─────────────────────────────────────────────────
export const addAxiosInterceptors = (axiosInstance: any) => {
  axiosInstance.interceptors.request.use(async (config: any) => {
    const method = (config.method || "GET").toUpperCase();
    if (!ALLOWED_METHODS.includes(method)) return config;

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

    addOrUpdateLog({
      id,
      url,
      method,
      startTime: start,
      caller,
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

      if (id == null || !ALLOWED_METHODS.includes(method)) return response;

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

      if (id != null && ALLOWED_METHODS.includes(method)) {
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
          responseHeaders: normaliseHeaders(error.response?.headers),
        });
      }
      return Promise.reject(error);
    },
  );
};
