import type {
  SocketConnectionRecord,
  SocketFrame,
  SocketFrameDirection,
  SocketFrameType,
  SocketStatus,
  RouteInfo,
} from '../types';

let socketRecords: SocketConnectionRecord[] = [];
let maxSocketRecordsLimit = 50;
let isSocketModuleEnabled = true;
let isWebSocketProxied = false;
let currentRouteProvider: (() => RouteInfo | null) | null = null;
const listeners = new Set<(records: SocketConnectionRecord[]) => void>();

export const setSocketRouteInfoProvider = (
  provider: (() => RouteInfo | null) | null,
) => {
  currentRouteProvider = provider;
};

export const setSocketModuleEnabled = (enabled: boolean) => {
  isSocketModuleEnabled = enabled;
};

export const getSocketModuleEnabled = () => isSocketModuleEnabled;

export const setMaxSocketRecordsLimit = (limit: number) => {
  maxSocketRecordsLimit = Math.max(10, Math.min(500, limit));
  if (socketRecords.length > maxSocketRecordsLimit) {
    socketRecords = socketRecords.slice(0, maxSocketRecordsLimit);
    notifyListeners();
  }
};

export const getMaxSocketRecordsLimit = () => maxSocketRecordsLimit;

export function getSocketRecords(): SocketConnectionRecord[] {
  return [...socketRecords];
}

export function clearSocketRecords() {
  socketRecords = [];
  notifyListeners();
}

export function deleteSocketRecord(id: string) {
  socketRecords = socketRecords.filter(r => r.id !== id);
  notifyListeners();
}

export function deleteMultipleSocketRecords(ids: string[]) {
  const idSet = new Set(ids);
  socketRecords = socketRecords.filter(r => !idSet.has(r.id));
  notifyListeners();
}

export function subscribeSocketRecords(
  callback: (records: SocketConnectionRecord[]) => void,
): () => void {
  listeners.add(callback);
  callback([...socketRecords]);
  return () => {
    listeners.delete(callback);
  };
}

export function pruneSocketRecords(keepCount = 25) {
  if (socketRecords.length > keepCount) {
    socketRecords = socketRecords.slice(0, keepCount);
    notifyListeners();
  }
}

function notifyListeners() {
  const snapshot = [...socketRecords];
  listeners.forEach(fn => {
    try {
      fn(snapshot);
    } catch {}
  });
}

function generateSocketId(): string {
  return `ws_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

function generateFrameId(): string {
  return `f_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
}

// ─── Stack Trace & Caller Resolver ──────────────────────────────────────────

function extractCallerInfo(): string | undefined {
  try {
    const stack = new Error().stack;
    if (!stack) return undefined;
    const lines = stack.split('\n');
    for (const line of lines) {
      if (
        !line.includes('socketLogger') &&
        !line.includes('NativeInspector') &&
        !line.includes('InspectorWebSocket') &&
        !line.includes('node_modules/react-native') &&
        !line.includes('node_modules/expo') &&
        line.includes('.js') || line.includes('.tsx') || line.includes('.ts')
      ) {
        const match = line.match(/(?:at\s+)?(?:(.+?)\s+\()?(.*?):(\d+):(\d+)\)?$/);
        if (match) {
          const fn = match[1] || 'anonymous';
          const file = match[2]?.split('/').pop() || match[2];
          const row = match[3];
          return `${file}:${row} (${fn})`;
        }
      }
    }
  } catch {}
  return undefined;
}

// ─── Query Params Parser ────────────────────────────────────────────────────

function parseUrlQuery(url: string): Record<string, string> {
  const result: Record<string, string> = {};
  try {
    const queryIdx = url.indexOf('?');
    if (queryIdx >= 0) {
      const qs = url.substring(queryIdx + 1).split('#')[0];
      const pairs = qs.split('&');
      for (const pair of pairs) {
        const [k, v] = pair.split('=');
        if (k) {
          result[decodeURIComponent(k)] = v ? decodeURIComponent(v) : '';
        }
      }
    }
  } catch {}
  return result;
}

// ─── Payload Analyzer & Socket.IO Parser ────────────────────────────────────

interface ParsedPayloadInfo {
  data: any;
  type: SocketFrameType;
  eventName?: string;
  size: number;
}

export function analyzeSocketPayload(raw: any): ParsedPayloadInfo {
  if (raw === null || raw === undefined) {
    return {data: null, type: 'text', size: 0};
  }

  // 1. String Payload
  if (typeof raw === 'string') {
    const size = new Blob ? raw.length : raw.length; // Approximate bytes

    // Socket.IO / Engine.IO protocol parser
    // Packet formats:
    // 0{"sid":"..."} -> Engine.IO open
    // 2 / 3 -> Ping / Pong
    // 40 / 41 -> Connect / Disconnect namespace
    // 42["event_name", payload] -> Event emit
    // 43[ackId, payload] -> Event ACK
    if (/^\d+/.test(raw)) {
      if (raw.startsWith('2')) {
        return {data: 'ping', type: 'ping', size};
      }
      if (raw.startsWith('3')) {
        return {data: 'pong', type: 'pong', size};
      }
      if (raw.startsWith('42') || raw.startsWith('43')) {
        try {
          const jsonPart = raw.substring(2);
          const parsed = JSON.parse(jsonPart);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const eventName = typeof parsed[0] === 'string' ? parsed[0] : 'socket.io';
            const eventData = parsed.length > 1 ? (parsed.length === 2 ? parsed[1] : parsed.slice(1)) : null;
            return {
              data: eventData !== null ? eventData : parsed,
              type: 'socket.io',
              eventName,
              size,
            };
          }
        } catch {}
      }
      if (raw.startsWith('0')) {
        try {
          const parsed = JSON.parse(raw.substring(1));
          return {
            data: parsed,
            type: 'socket.io',
            eventName: 'handshake',
            size,
          };
        } catch {}
      }
    }

    // Standard JSON string check
    const trimmed = raw.trim();
    if (
      (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
      (trimmed.startsWith('[') && trimmed.endsWith(']'))
    ) {
      try {
        const parsedJson = JSON.parse(trimmed);
        return {data: parsedJson, type: 'json', size};
      } catch {}
    }

    return {data: raw, type: 'text', size};
  }

  // 2. Binary Payload (ArrayBuffer / Blob / Uint8Array)
  if (typeof ArrayBuffer !== 'undefined' && raw instanceof ArrayBuffer) {
    return {
      data: `[ArrayBuffer ${raw.byteLength} bytes]`,
      type: 'binary',
      size: raw.byteLength,
    };
  }
  if (typeof Uint8Array !== 'undefined' && raw instanceof Uint8Array) {
    return {
      data: `[Uint8Array ${raw.byteLength} bytes]`,
      type: 'binary',
      size: raw.byteLength,
    };
  }
  if (typeof Blob !== 'undefined' && raw instanceof Blob) {
    return {
      data: `[Blob ${raw.size} bytes: ${raw.type || 'binary'}]`,
      type: 'binary',
      size: raw.size,
    };
  }

  // 3. Plain JavaScript Object
  if (typeof raw === 'object') {
    return {
      data: raw,
      type: 'json',
      size: JSON.stringify(raw).length,
    };
  }

  return {data: String(raw), type: 'text', size: String(raw).length};
}

// ─── Manual / Explicit Recording Helpers ────────────────────────────────────

export function recordSocketConnection(
  url: string,
  options?: Partial<SocketConnectionRecord>,
): SocketConnectionRecord {
  const query = parseUrlQuery(url);
  const isSocketIo = url.includes('/socket.io') || Boolean(options?.client === 'socket.io');

  const record: SocketConnectionRecord = {
    id: options?.id || generateSocketId(),
    url,
    protocols: options?.protocols,
    readyState: options?.readyState ?? 1,
    status: options?.status || 'open',
    startTime: options?.startTime || Date.now(),
    client: options?.client || (isSocketIo ? 'socket.io' : 'websocket'),
    frames: options?.frames || [],
    sentCount: options?.sentCount || 0,
    receivedCount: options?.receivedCount || 0,
    totalBytesSent: options?.totalBytesSent || 0,
    totalBytesReceived: options?.totalBytesReceived || 0,
    caller: options?.caller || extractCallerInfo(),
    query,
    headers: options?.headers,
    routeInfo: options?.routeInfo || (currentRouteProvider ? currentRouteProvider() || undefined : undefined),
  };

  socketRecords.unshift(record);
  if (socketRecords.length > maxSocketRecordsLimit) {
    socketRecords = socketRecords.slice(0, maxSocketRecordsLimit);
  }
  notifyListeners();
  return record;
}

export function recordSocketFrame(
  socketId: string,
  rawPayload: any,
  direction: SocketFrameDirection = 'send',
  options?: Partial<SocketFrame>,
): SocketFrame | null {
  const conn = socketRecords.find(r => r.id === socketId);
  if (!conn) return null;

  const analyzed = analyzeSocketPayload(rawPayload);
  const frame: SocketFrame = {
    id: options?.id || generateFrameId(),
    timestamp: options?.timestamp || Date.now(),
    direction,
    type: options?.type || analyzed.type,
    data: options?.data !== undefined ? options.data : analyzed.data,
    raw: rawPayload,
    size: options?.size !== undefined ? options.size : analyzed.size,
    eventName: options?.eventName || analyzed.eventName,
    ackId: options?.ackId,
  };

  conn.frames.push(frame);
  if (direction === 'send') {
    conn.sentCount += 1;
    conn.totalBytesSent += frame.size || 0;
  } else {
    conn.receivedCount += 1;
    conn.totalBytesReceived += frame.size || 0;
  }

  notifyListeners();
  return frame;
}

export function recordSocketClose(
  socketId: string,
  closeCode = 1000,
  closeReason = 'Normal closure',
) {
  const conn = socketRecords.find(r => r.id === socketId);
  if (!conn) return;

  conn.readyState = 3;
  conn.status = 'closed';
  conn.closeCode = closeCode;
  conn.closeReason = closeReason;
  conn.endTime = Date.now();
  conn.duration = conn.endTime - conn.startTime;

  notifyListeners();
}

export function recordSocketError(
  socketId: string,
  error: any,
) {
  const conn = socketRecords.find(r => r.id === socketId);
  if (!conn) return;

  conn.status = 'error';
  conn.error = typeof error === 'string' ? error : (error?.message || 'WebSocket error occurred');
  notifyListeners();
}

// ─── Global WebSocket Interceptor (Monkey-patching) ─────────────────────────

const OriginalWebSocket = (typeof global !== 'undefined' && (global as any).WebSocket)
  ? (global as any).WebSocket
  : undefined;

export function setupSocketLogger() {
  if (isWebSocketProxied || !OriginalWebSocket) return;

  class InspectorWebSocket extends OriginalWebSocket {
    private _inspectorId: string;
    private _inspectorUrl: string;

    constructor(url: string | URL, protocols?: string | string[]) {
      const urlStr = typeof url === 'string' ? url : url.toString();
      super(url as any, protocols as any);

      this._inspectorUrl = urlStr;
      this._inspectorId = generateSocketId();

      if (isSocketModuleEnabled) {
        const query = parseUrlQuery(urlStr);
        const isSocketIo = urlStr.includes('/socket.io');

        const record: SocketConnectionRecord = {
          id: this._inspectorId,
          url: urlStr,
          protocols: protocols,
          readyState: 0, // CONNECTING
          status: 'connecting',
          startTime: Date.now(),
          client: isSocketIo ? 'socket.io' : 'websocket',
          frames: [],
          sentCount: 0,
          receivedCount: 0,
          totalBytesSent: 0,
          totalBytesReceived: 0,
          caller: extractCallerInfo(),
          query,
          routeInfo: currentRouteProvider ? currentRouteProvider() || undefined : undefined,
        };

        socketRecords.unshift(record);
        if (socketRecords.length > maxSocketRecordsLimit) {
          socketRecords = socketRecords.slice(0, maxSocketRecordsLimit);
        }
        notifyListeners();

        // Hook open event
        this.addEventListener('open', () => {
          const rec = socketRecords.find(r => r.id === this._inspectorId);
          if (rec) {
            rec.readyState = 1;
            rec.status = 'open';
            notifyListeners();
          }
        });

        // Hook message event
        this.addEventListener('message', (event: any) => {
          if (!isSocketModuleEnabled) return;
          const rec = socketRecords.find(r => r.id === this._inspectorId);
          if (!rec) return;

          const rawData = event?.data;
          const analyzed = analyzeSocketPayload(rawData);
          const frame: SocketFrame = {
            id: generateFrameId(),
            timestamp: Date.now(),
            direction: 'receive',
            type: analyzed.type,
            data: analyzed.data,
            raw: rawData,
            size: analyzed.size,
            eventName: analyzed.eventName,
          };

          rec.frames.push(frame);
          rec.receivedCount += 1;
          rec.totalBytesReceived += frame.size || 0;
          notifyListeners();
        });

        // Hook error event
        this.addEventListener('error', (event: any) => {
          const rec = socketRecords.find(r => r.id === this._inspectorId);
          if (rec) {
            rec.status = 'error';
            rec.error = event?.message || 'WebSocket connection error';
            notifyListeners();
          }
        });

        // Hook close event
        this.addEventListener('close', (event: any) => {
          const rec = socketRecords.find(r => r.id === this._inspectorId);
          if (rec) {
            rec.readyState = 3;
            rec.status = 'closed';
            rec.closeCode = event?.code || 1000;
            rec.closeReason = event?.reason || 'Closed';
            rec.endTime = Date.now();
            rec.duration = rec.endTime - rec.startTime;
            notifyListeners();
          }
        });
      }
    }

    send(data: any): void {
      if (isSocketModuleEnabled && this._inspectorId) {
        const rec = socketRecords.find(r => r.id === this._inspectorId);
        if (rec) {
          const analyzed = analyzeSocketPayload(data);
          const frame: SocketFrame = {
            id: generateFrameId(),
            timestamp: Date.now(),
            direction: 'send',
            type: analyzed.type,
            data: analyzed.data,
            raw: data,
            size: analyzed.size,
            eventName: analyzed.eventName,
          };

          rec.frames.push(frame);
          rec.sentCount += 1;
          rec.totalBytesSent += frame.size || 0;
          notifyListeners();
        }
      }
      super.send(data);
    }
  }

  // Retain original static constants
  (InspectorWebSocket as any).CONNECTING = 0;
  (InspectorWebSocket as any).OPEN = 1;
  (InspectorWebSocket as any).CLOSING = 2;
  (InspectorWebSocket as any).CLOSED = 3;

  (global as any).WebSocket = InspectorWebSocket;
  isWebSocketProxied = true;
}

// ─── Simulation Generator ───────────────────────────────────────────────────

export function simulateTestSocket(
  preset: 'chat' | 'crypto' | 'socketio' | 'echo' | 'custom' = 'chat',
  customData?: any,
) {
  const now = Date.now();

  if (preset === 'chat') {
    const id = generateSocketId();
    const startTime = now - 18450;
    const record: SocketConnectionRecord = {
      id,
      url: 'wss://chat.example.com/v2/rooms/engineering?user=lead_dev',
      protocols: 'chat.v2',
      readyState: 1,
      status: 'open',
      startTime,
      client: 'websocket',
      sentCount: 3,
      receivedCount: 5,
      totalBytesSent: 412,
      totalBytesReceived: 890,
      caller: 'ChatRoomScreen.tsx:84 (initChatWebSocket)',
      query: {user: 'lead_dev', version: '2.0.4'},
      frames: [
        {
          id: generateFrameId(),
          timestamp: startTime + 120,
          direction: 'send',
          type: 'json',
          data: {action: 'auth', token: 'bearer_token_sec_99182', userId: 'usr_81723'},
          size: 78,
        },
        {
          id: generateFrameId(),
          timestamp: startTime + 380,
          direction: 'receive',
          type: 'json',
          data: {status: 'authenticated', room: 'engineering', activeUsers: 14},
          size: 64,
        },
        {
          id: generateFrameId(),
          timestamp: startTime + 2400,
          direction: 'send',
          type: 'json',
          data: {action: 'send_message', message: 'Hello team, the new release build is ready! 🚀'},
          size: 82,
        },
        {
          id: generateFrameId(),
          timestamp: startTime + 3100,
          direction: 'receive',
          type: 'json',
          data: {user: 'Sarah_QA', message: 'Awesome! Starting regression tests on iOS 18 now.', timestamp: startTime + 3090},
          size: 114,
        },
        {
          id: generateFrameId(),
          timestamp: startTime + 7500,
          direction: 'receive',
          type: 'json',
          data: {user: 'Alex_Backend', message: 'API response times look great on staging cluster.', timestamp: startTime + 7490},
          size: 98,
        },
        {
          id: generateFrameId(),
          timestamp: startTime + 12000,
          direction: 'send',
          type: 'ping',
          data: 'ping',
          size: 4,
        },
        {
          id: generateFrameId(),
          timestamp: startTime + 12045,
          direction: 'receive',
          type: 'pong',
          data: 'pong',
          size: 4,
        },
        {
          id: generateFrameId(),
          timestamp: startTime + 16200,
          direction: 'receive',
          type: 'json',
          data: {event: 'typing_indicator', user: 'David_Design', status: 'typing'},
          size: 56,
        },
      ],
    };

    socketRecords.unshift(record);
    notifyListeners();
    return record;
  }

  if (preset === 'crypto') {
    const id = generateSocketId();
    const startTime = now - 45000;
    const record: SocketConnectionRecord = {
      id,
      url: 'wss://stream.binance.com:9443/ws/btcusdt@ticker/ethusdt@ticker',
      protocols: undefined,
      readyState: 1,
      status: 'open',
      startTime,
      client: 'websocket',
      sentCount: 1,
      receivedCount: 6,
      totalBytesSent: 86,
      totalBytesReceived: 2140,
      caller: 'CryptoLiveTicker.tsx:42 (connectTickerStream)',
      query: {symbols: 'btcusdt,ethusdt'},
      frames: [
        {
          id: generateFrameId(),
          timestamp: startTime + 80,
          direction: 'send',
          type: 'json',
          data: {method: 'SUBSCRIBE', params: ['btcusdt@ticker', 'ethusdt@ticker'], id: 1},
          size: 86,
        },
        {
          id: generateFrameId(),
          timestamp: startTime + 250,
          direction: 'receive',
          type: 'json',
          data: {result: null, id: 1},
          size: 24,
        },
        {
          id: generateFrameId(),
          timestamp: startTime + 1200,
          direction: 'receive',
          type: 'json',
          data: {
            s: 'BTCUSDT',
            c: '92,450.00',
            h: '93,120.00',
            l: '90,800.00',
            v: '18420.45',
            q: '1702891240.50',
            P: '+2.45%',
          },
          size: 142,
        },
        {
          id: generateFrameId(),
          timestamp: startTime + 5400,
          direction: 'receive',
          type: 'json',
          data: {
            s: 'ETHUSDT',
            c: '3,420.50',
            h: '3,480.00',
            l: '3,360.00',
            v: '84120.12',
            q: '287890124.00',
            P: '+1.82%',
          },
          size: 138,
        },
        {
          id: generateFrameId(),
          timestamp: startTime + 18000,
          direction: 'receive',
          type: 'json',
          data: {
            s: 'BTCUSDT',
            c: '92,610.00',
            h: '93,120.00',
            l: '90,800.00',
            v: '18650.10',
            q: '1724120890.00',
            P: '+2.62%',
          },
          size: 142,
        },
      ],
    };

    socketRecords.unshift(record);
    notifyListeners();
    return record;
  }

  if (preset === 'socketio') {
    const id = generateSocketId();
    const startTime = now - 32000;
    const record: SocketConnectionRecord = {
      id,
      url: 'https://api.myapp.io/socket.io/?EIO=4&transport=websocket&sid=U9k1l_892Zq',
      readyState: 1,
      status: 'open',
      startTime,
      client: 'socket.io',
      sentCount: 3,
      receivedCount: 4,
      totalBytesSent: 280,
      totalBytesReceived: 560,
      caller: 'SocketIOClient.ts:62 (io.connect)',
      query: {EIO: '4', transport: 'websocket', sid: 'U9k1l_892Zq'},
      frames: [
        {
          id: generateFrameId(),
          timestamp: startTime + 90,
          direction: 'receive',
          type: 'socket.io',
          eventName: 'handshake',
          data: {sid: 'U9k1l_892Zq', upgrades: [], pingInterval: 25000, pingTimeout: 20000},
          size: 96,
        },
        {
          id: generateFrameId(),
          timestamp: startTime + 210,
          direction: 'send',
          type: 'socket.io',
          eventName: 'connect_namespace',
          data: {token: 'jwt_auth_pass_token_99'},
          size: 54,
        },
        {
          id: generateFrameId(),
          timestamp: startTime + 340,
          direction: 'receive',
          type: 'socket.io',
          eventName: 'connect',
          data: {status: 'ok', sid: 'U9k1l_892Zq'},
          size: 42,
        },
        {
          id: generateFrameId(),
          timestamp: startTime + 4200,
          direction: 'send',
          type: 'socket.io',
          eventName: 'subscribe_order_feed',
          data: {orderId: 'ORD_99182', tenantId: 'enterprise_gold'},
          size: 72,
        },
        {
          id: generateFrameId(),
          timestamp: startTime + 8900,
          direction: 'receive',
          type: 'socket.io',
          eventName: 'order_status_updated',
          data: {
            orderId: 'ORD_99182',
            status: 'DISPATCHED',
            driverName: 'Michael Brown',
            etaMinutes: 12,
            location: {lat: 37.7749, lng: -122.4194},
          },
          size: 168,
        },
        {
          id: generateFrameId(),
          timestamp: startTime + 25000,
          direction: 'send',
          type: 'ping',
          data: 'ping',
          size: 4,
        },
        {
          id: generateFrameId(),
          timestamp: startTime + 25032,
          direction: 'receive',
          type: 'pong',
          data: 'pong',
          size: 4,
        },
      ],
    };

    socketRecords.unshift(record);
    notifyListeners();
    return record;
  }

  // Echo test preset / Closed connection
  const id = generateSocketId();
  const startTime = now - 60000;
  const endTime = now - 2000;
  const record: SocketConnectionRecord = {
    id,
    url: 'wss://echo.websocket.events',
    readyState: 3,
    status: 'closed',
    startTime,
    endTime,
    duration: endTime - startTime,
    closeCode: 1000,
    closeReason: 'Normal session closure',
    client: 'websocket',
    sentCount: 2,
    receivedCount: 2,
    totalBytesSent: 110,
    totalBytesReceived: 110,
    caller: 'HomeScreen.tsx:120 (testWebSocketEcho)',
    frames: [
      {
        id: generateFrameId(),
        timestamp: startTime + 200,
        direction: 'send',
        type: 'text',
        data: 'Echo ping test #1',
        size: 17,
      },
      {
        id: generateFrameId(),
        timestamp: startTime + 380,
        direction: 'receive',
        type: 'text',
        data: 'Echo ping test #1',
        size: 17,
      },
      {
        id: generateFrameId(),
        timestamp: startTime + 15000,
        direction: 'send',
        type: 'json',
        data: {type: 'diagnostics', timestamp: startTime + 15000},
        size: 45,
      },
      {
        id: generateFrameId(),
        timestamp: startTime + 15210,
        direction: 'receive',
        type: 'json',
        data: {type: 'diagnostics', timestamp: startTime + 15000},
        size: 45,
      },
    ],
  };

  if (customData) {
    Object.assign(record, customData);
  }

  socketRecords.unshift(record);
  notifyListeners();
  return record;
}
