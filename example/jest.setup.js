const reactNative = require('react-native');
const { NativeModules, Platform } = reactNative;


NativeModules.KeyboardObserver = {
  addListener: jest.fn(),
  removeListeners: jest.fn(),
};

NativeModules.RNCClipboard = {
  setString: jest.fn(),
  getString: jest.fn().mockResolvedValue(''),
  hasString: jest.fn().mockResolvedValue(false),
  hasURL: jest.fn().mockResolvedValue(false),
  hasImage: jest.fn().mockResolvedValue(false),
  hasNumber: jest.fn().mockResolvedValue(false),
  addListener: jest.fn(),
  removeListeners: jest.fn(),
};

NativeModules.NetworkInspector = {
  enableNativeCrashProtection: jest.fn().mockResolvedValue(true),
  getDeviceMetrics: jest.fn().mockResolvedValue({}),
  editPhoto: jest.fn().mockResolvedValue(null),
  trimVideo: jest.fn().mockResolvedValue(null),
  generateFilmstrip: jest.fn().mockResolvedValue(null),
  takeScreenshot: jest.fn().mockResolvedValue(null),
  captureScreenshot: jest.fn().mockResolvedValue(null),
  startVideoRecording: jest.fn().mockResolvedValue(true),
  stopVideoRecording: jest.fn().mockResolvedValue(null),
  startScreenRecording: jest.fn().mockResolvedValue(null),
  stopScreenRecording: jest.fn().mockResolvedValue(null),
  isRecording: jest.fn().mockResolvedValue(false),
  getCapturedMedia: jest.fn().mockResolvedValue('[]'),
  deleteCapturedMedia: jest.fn().mockResolvedValue(true),
  clearAllCapturedMedia: jest.fn().mockResolvedValue(true),
  copyMediaToClipboard: jest.fn().mockResolvedValue({ success: true }),
  showFloatingButton: jest.fn().mockResolvedValue(true),
  hideFloatingButton: jest.fn().mockResolvedValue(true),
  setFloatingButtonBadge: jest.fn().mockResolvedValue(true),
  setFloatingButtonPosition: jest.fn().mockResolvedValue(true),
  startFpsMonitoring: jest.fn().mockResolvedValue(true),
  stopFpsMonitoring: jest.fn().mockResolvedValue(true),
  getFpsMetrics: jest.fn().mockResolvedValue({ fps: 60, targetFps: 60 }),
  getNativeStorageItem: jest.fn().mockResolvedValue(null),
  setNativeStorageItem: jest.fn().mockResolvedValue(true),
  triggerHaptic: jest.fn().mockResolvedValue(true),
  getNativeSystemMetrics: jest.fn().mockResolvedValue({}),
  pushNativeLogRecord: jest.fn().mockResolvedValue(true),
  checkFloatingButtonPress: jest.fn().mockResolvedValue(false),
  addListener: jest.fn(),
  removeListeners: jest.fn(),
};

NativeModules.NetworkInspectorModule = NativeModules.NetworkInspector;
NativeModules.RNInAppInspectorSpec = NativeModules.NetworkInspector;

try {
  const TurboModuleRegistry = require('react-native/Libraries/TurboModule/TurboModuleRegistry');
  const originalGetEnforcing = TurboModuleRegistry.getEnforcing;
  const originalGet = TurboModuleRegistry.get;

  TurboModuleRegistry.getEnforcing = (name) => {
    if (name === 'RNCClipboard') {
      return NativeModules.RNCClipboard;
    }
    if (name === 'RNInAppInspectorSpec' || name === 'NetworkInspector' || name === 'NetworkInspectorModule') {
      return NativeModules.NetworkInspector;
    }
    try {
      return originalGetEnforcing(name);
    } catch {
      return NativeModules[name] || { addListener: jest.fn(), removeListeners: jest.fn() };
    }
  };
  TurboModuleRegistry.get = (name) => {
    if (name === 'RNCClipboard') {
      return NativeModules.RNCClipboard;
    }
    if (name === 'RNInAppInspectorSpec' || name === 'NetworkInspector' || name === 'NetworkInspectorModule') {
      return NativeModules.NetworkInspector;
    }
    try {
      return originalGet(name);
    } catch {
      return NativeModules[name] || null;
    }
  };
} catch {}

jest.mock('@react-native-clipboard/clipboard', () => ({
  setString: jest.fn(),
  getString: jest.fn().mockResolvedValue(''),
  hasString: jest.fn().mockResolvedValue(false),
  hasURL: jest.fn().mockResolvedValue(false),
  hasImage: jest.fn().mockResolvedValue(false),
  hasNumber: jest.fn().mockResolvedValue(false),
  addListener: jest.fn(),
  removeListeners: jest.fn(),
}));

jest.mock('react-native-svg', () => {
  const React = require('react');
  const MockSvg = (props) => React.createElement('Svg', props, props.children);
  const MockElement = (props) => React.createElement('MockSvgElement', props, props.children);
  return {
    __esModule: true,
    default: MockSvg,
    Svg: MockSvg,
    SvgXml: MockElement,
    Path: MockElement,
    Circle: MockElement,
    Rect: MockElement,
    G: MockElement,
    Line: MockElement,
    Polygon: MockElement,
    Polyline: MockElement,
    Text: MockElement,
    TSpan: MockElement,
    TextPath: MockElement,
    Use: MockElement,
    Defs: MockElement,
    Stop: MockElement,
    LinearGradient: MockElement,
    RadialGradient: MockElement,
    ClipPath: MockElement,
    Pattern: MockElement,
    Mask: MockElement,
    Marker: MockElement,
    ForeignObject: MockElement,
  };
});

jest.mock('react-native-linear-gradient', () => 'LinearGradient');
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: ({ children }) => children,
  SafeAreaView: ({ children }) => children,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

