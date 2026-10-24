import {
  InAppInspector,
  ScreenCapture,
  ScreenRecorder,
  MediaEditor,
  AppFonts,
  AppColors,
  getThemeColors,
  LIB_VERSION,
  setupNetworkLogger,
  clearNetworkLogs,
  subscribeNetworkLogs,
  getNetworkLogs,
  setupConsoleLogger,
  clearConsoleLogs,
  subscribeConsoleLogs,
  setupGlobalCrashHandler,
  subscribeCrashEvents,
  getCrashRecords,
  clearCrashRecords,
  simulateTestCrash,
  triggerGlobalCrashScreen,
  GlobalCrashScreenModal,
  setupSocketLogger,
  simulateTestSocket,
  subscribeSocketRecords,
  getSocketRecords,
  clearSocketRecords,
  simulateTestPush,
  subscribePushEvents,
  getPushRecords,
  clearPushRecords,
  openInspector,
  closeInspector,
  reopenInspector,
} from 'react-native-inapp-inspector';
import React from 'react';
import { NativeModules } from 'react-native';

describe('Inspector Full Regression & Safety Test Suite', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Core Inspector Initialization & Lifecycle', () => {
    it('initializes InAppInspector component and exports without crashing', () => {
      expect(InAppInspector).toBeDefined();
      expect(typeof InAppInspector).toBe('function');
      expect(typeof LIB_VERSION).toBe('string');
      expect(LIB_VERSION.length).toBeGreaterThan(0);
    });

    it('exposes design system tokens and fonts', () => {
      expect(AppFonts).toBeDefined();
      expect(AppColors).toBeDefined();
      const theme = getThemeColors(true);
      expect(theme).toBeDefined();
      expect(theme.primaryLight).toBeDefined();
    });
  });

  describe('Network Module Integrity', () => {
    it('sets up network logger and subscribes to logs', () => {
      expect(typeof setupNetworkLogger).toBe('function');
      expect(typeof clearNetworkLogs).toBe('function');
      expect(typeof subscribeNetworkLogs).toBe('function');

      const unsubscribe = subscribeNetworkLogs(jest.fn());
      expect(typeof unsubscribe).toBe('function');
      unsubscribe();
      clearNetworkLogs();
    });

    it('captures failed GET requests and preserves method and error status', async () => {
      clearNetworkLogs();

      // Test logging a failed GET request
      const logger = (globalThis as any).__NETWORK_LOGGER__;
      expect(typeof logger).toBe('function');
      logger({
        id: 9999,
        url: 'https://api.example.com/failed-get',
        method: 'GET',
        status: 0,
        startTime: Date.now(),
        response: 'Network request failed',
        client: 'fetch',
      });

      const logs = getNetworkLogs();
      expect(logs.length).toBeGreaterThan(0);
      const failedGetLog = logs.find(l => l.url.includes('failed-get'));
      expect(failedGetLog).toBeDefined();
      expect(failedGetLog?.method).toBe('GET');
      expect(failedGetLog?.status).toBe(0);
      expect(failedGetLog?.response).toContain('Network request failed');

      clearNetworkLogs();
    });

    it('intercepts XHR completion via onloadend property assigned before and after send', () => {
      clearNetworkLogs();

      const originalXHR = (globalThis as any).XMLHttpRequest;
      class MockXHR {
        __logMethod?: string;
        __logUrl?: string;
        __logRequestHeaders?: Record<string, string>;
        __logStartTime?: number;
        __logFinished?: boolean;
        __logId?: number;
        status = 200;
        responseType = 'text';
        responseText = '{"success":true}';
        response = '{"success":true}';
        onloadend: any = null;
        private listeners: Record<string, Function[]> = {};

        open(method: string, url: string) {}
        setRequestHeader(h: string, v: string) {}
        send(body?: any) {}
        getAllResponseHeaders() {
          return 'content-type: application/json\r\n';
        }
        addEventListener(event: string, fn: Function) {
          if (!this.listeners[event]) this.listeners[event] = [];
          this.listeners[event].push(fn);
        }
        dispatchEvent(event: string) {
          (this.listeners[event] || []).forEach(fn => fn.call(this));
        }
      }

      (globalThis as any).XMLHttpRequest = MockXHR;
      (globalThis as any).__XHR_LOGGER_INITIALIZED__ = false;
      (globalThis as any).__NETWORK_LOGGER_INITIALIZED__ = false;
      setupNetworkLogger();

      // 1. onloadend assigned AFTER send()
      const xhr1 = new (globalThis as any).XMLHttpRequest();
      xhr1.open('GET', 'https://api.example.com/test-onloadend-after');
      xhr1.send();

      let callback1Fired = false;
      xhr1.onloadend = () => {
        callback1Fired = true;
      };

      if (typeof xhr1.onloadend === 'function') {
        xhr1.onloadend();
      }

      expect(callback1Fired).toBe(true);
      let logs = getNetworkLogs();
      const log1 = logs.find(l => l.url.includes('test-onloadend-after'));
      expect(log1).toBeDefined();
      expect(log1?.status).toBe(200);
      expect(log1?.response).toEqual({ success: true });

      // 2. onloadend assigned BEFORE send()
      const xhr2 = new (globalThis as any).XMLHttpRequest();
      xhr2.open('POST', 'https://api.example.com/test-onloadend-before');
      let callback2Fired = false;
      xhr2.onloadend = () => {
        callback2Fired = true;
      };
      xhr2.send(JSON.stringify({ test: 123 }));

      if (typeof xhr2.onloadend === 'function') {
        xhr2.onloadend();
      }

      expect(callback2Fired).toBe(true);
      logs = getNetworkLogs();
      const log2 = logs.find(l => l.url.includes('test-onloadend-before'));
      expect(log2).toBeDefined();
      expect(log2?.method).toBe('POST');
      expect(log2?.status).toBe(200);

      (globalThis as any).XMLHttpRequest = originalXHR;
      clearNetworkLogs();
    });

    it('intercepts XHR completion via addEventListener loadend event', () => {
      clearNetworkLogs();

      const originalXHR = (globalThis as any).XMLHttpRequest;
      class MockXHR {
        status = 201;
        responseType = 'json';
        response = { created: true };
        private listeners: Record<string, Function[]> = {};

        open() {}
        setRequestHeader() {}
        send() {}
        getAllResponseHeaders() {
          return '';
        }
        addEventListener(event: string, fn: Function) {
          if (!this.listeners[event]) this.listeners[event] = [];
          this.listeners[event].push(fn);
        }
        trigger(event: string) {
          (this.listeners[event] || []).forEach(fn => fn.call(this));
        }
      }

      (globalThis as any).XMLHttpRequest = MockXHR;
      (globalThis as any).__XHR_LOGGER_INITIALIZED__ = false;
      (globalThis as any).__NETWORK_LOGGER_INITIALIZED__ = false;
      setupNetworkLogger();

      const xhr = new (globalThis as any).XMLHttpRequest();
      xhr.open('PUT', 'https://api.example.com/resource/42');
      xhr.send();
      xhr.trigger('loadend');

      const logs = getNetworkLogs();
      const log = logs.find(l => l.url.includes('resource/42'));
      expect(log).toBeDefined();
      expect(log?.method).toBe('PUT');
      expect(log?.status).toBe(201);
      expect(log?.response).toEqual({ created: true });

      (globalThis as any).XMLHttpRequest = originalXHR;
      clearNetworkLogs();
    });

    it('queues pre-UI mount requests in memory and flushes them when subscribed or modal opens', () => {
      clearNetworkLogs();

      // Simulate network requests before UI mounts
      const logger = (globalThis as any).__NETWORK_LOGGER__;
      logger({
        id: 101,
        url: 'https://api.example.com/startup-config',
        method: 'GET',
        status: 200,
        response: { theme: 'dark' },
        startTime: Date.now() - 500,
        duration: 80,
        client: 'xhr',
      });
      logger({
        id: 102,
        url: 'https://api.example.com/auth-token',
        method: 'POST',
        status: 200,
        response: { token: 'xyz123' },
        startTime: Date.now() - 300,
        duration: 120,
        client: 'xhr',
      });

      // 1. Verify requests are queued in memory immediately
      const queuedLogs = getNetworkLogs();
      expect(queuedLogs.length).toBe(2);
      expect(queuedLogs.some(l => l.url.includes('startup-config'))).toBe(true);
      expect(queuedLogs.some(l => l.url.includes('auth-token'))).toBe(true);

      // 2. Verify subscription delivers all queued logs instantly
      let deliveredLogs: any[] = [];
      const unsub = subscribeNetworkLogs(logs => {
        deliveredLogs = logs;
      });

      expect(deliveredLogs.length).toBe(2);
      expect(deliveredLogs[0].url).toContain('auth-token');
      expect(deliveredLogs[1].url).toContain('startup-config');

      unsub();
      clearNetworkLogs();
    });
  });

  describe('Console Logger Module Integrity', () => {
    it('subscribes and clears console logs safely', () => {
      expect(typeof setupConsoleLogger).toBe('function');
      expect(typeof clearConsoleLogs).toBe('function');
      expect(typeof subscribeConsoleLogs).toBe('function');

      const listener = jest.fn();
      const unsubscribe = subscribeConsoleLogs(listener);
      expect(typeof unsubscribe).toBe('function');
      unsubscribe();
      clearConsoleLogs();
    });
  });

  describe('Crash & Error Protection Module', () => {
    it('subscribes to crash events and retrieves records safely', () => {
      expect(typeof setupGlobalCrashHandler).toBe('function');
      expect(typeof subscribeCrashEvents).toBe('function');
      expect(typeof getCrashRecords).toBe('function');
      expect(typeof clearCrashRecords).toBe('function');
      expect(typeof simulateTestCrash).toBe('function');
      expect(typeof triggerGlobalCrashScreen).toBe('function');
      expect(GlobalCrashScreenModal).toBeDefined();

      let lastPayload: any = null;
      const unsubscribe = subscribeCrashEvents(payload => {
        lastPayload = payload;
      });
      expect(typeof unsubscribe).toBe('function');

      clearCrashRecords();
      simulateTestCrash('js', 'Test Custom JS Crash');

      const records = getCrashRecords();
      expect(Array.isArray(records)).toBe(true);
      expect(records.length).toBeGreaterThan(0);
      expect(records[0].message).toContain('Test Custom JS Crash');
      expect(lastPayload).toBeDefined();

      unsubscribe();
      clearCrashRecords();
    });
  });

  describe('WebSocket Logger Module', () => {
    it('simulates test socket events and retrieves records', () => {
      expect(typeof setupSocketLogger).toBe('function');
      expect(typeof simulateTestSocket).toBe('function');
      expect(typeof subscribeSocketRecords).toBe('function');

      clearSocketRecords();
      simulateTestSocket('chat');
      const records = getSocketRecords();
      expect(Array.isArray(records)).toBe(true);
      expect(records.length).toBeGreaterThan(0);
      clearSocketRecords();
    });
  });

  describe('Push Notification Module', () => {
    it('simulates push notifications and retrieves records', () => {
      expect(typeof simulateTestPush).toBe('function');
      expect(typeof subscribePushEvents).toBe('function');
      expect(typeof getPushRecords).toBe('function');
      expect(typeof clearPushRecords).toBe('function');

      clearPushRecords();
      simulateTestPush('fcm');
      const records = getPushRecords();
      expect(Array.isArray(records)).toBe(true);
      expect(records.length).toBeGreaterThan(0);
      clearPushRecords();
    });
  });

  describe('ScreenCapture & ScreenRecorder Module', () => {
    it('provides high-level capture APIs with fallback handling', async () => {
      expect(ScreenCapture).toBeDefined();
      expect(typeof ScreenCapture.captureScreenshot).toBe('function');
      expect(ScreenRecorder).toBeDefined();
      expect(typeof ScreenRecorder.startRecording).toBe('function');
      expect(typeof ScreenRecorder.stopRecording).toBe('function');

      // Native module mock test
      NativeModules.NetworkInspectorModule.takeScreenshot = jest.fn().mockResolvedValue({
        uri: 'file:///data/cache/screenshot.jpg',
        width: 1080,
        height: 1920,
        size: 245000,
      });

      const shot = await ScreenCapture.captureScreenshot({ format: 'jpeg', quality: 0.8 });
      expect(shot).toBeDefined();
      expect(shot?.uri).toBe('file:///data/cache/screenshot.jpg');
    });
  });

  describe('MediaEditor Module Compatibility', () => {
    it('does not interfere with inspector modules when invoked simultaneously', async () => {
      NativeModules.NetworkInspectorModule.editPhoto = jest.fn().mockResolvedValue({
        uri: 'file:///data/cache/edit.jpg',
        width: 800,
        height: 800,
        size: 120000,
        mimeType: 'image/jpeg',
        format: 'jpeg',
      });

      const [editRes, crashRecords, socketRecords] = await Promise.all([
        MediaEditor.editPhoto({ uri: 'photo.jpg', rotation: 180 }),
        Promise.resolve(getCrashRecords()),
        Promise.resolve(getSocketRecords()),
      ]);

      expect(editRes).toBeDefined();
      expect(editRes?.width).toBe(800);
      expect(Array.isArray(crashRecords)).toBe(true);
      expect(Array.isArray(socketRecords)).toBe(true);
    });
  });

  describe('Programmatic Control & Dismissal (GitHub Issue #4 & #3)', () => {
    it('provides openInspector, closeInspector, and reopenInspector methods', () => {
      expect(typeof openInspector).toBe('function');
      expect(typeof closeInspector).toBe('function');
      expect(typeof reopenInspector).toBe('function');

      // Calling them does not throw
      expect(() => openInspector()).not.toThrow();
      expect(() => closeInspector()).not.toThrow();
      expect(() => reopenInspector(false)).not.toThrow();
      expect(() => reopenInspector(true)).not.toThrow();
    });

    it('exports InAppInspector which accepts onHide, onOpen, onClose, and appIcon props', () => {
      expect(InAppInspector).toBeDefined();
      const onHideMock = jest.fn();
      const onOpenMock = jest.fn();
      const onCloseMock = jest.fn();

      // Render props check (React element creation)
      const element = React.createElement(InAppInspector, {
        enabled: true,
        appIcon: 123,
        onHide: onHideMock,
        onOpen: onOpenMock,
        onClose: onCloseMock,
      });
      expect(React.isValidElement(element)).toBe(true);
      expect(element.props.appIcon).toBe(123);
      expect(element.props.onHide).toBe(onHideMock);
    });
  });
});

