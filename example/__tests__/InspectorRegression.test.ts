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
} from 'react-native-inapp-inspector';
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
});
