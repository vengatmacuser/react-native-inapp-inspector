/**
 * Centralized testID Locator Taxonomy for react-native-inapp-inspector
 * Hierarchy: scope.module.element.action
 */

export const LOCATORS = {
  // Library Inspector Shell & Launcher
  FAB_LAUNCHER: 'inspector.fab.launcher',
  FAB_BADGE: 'inspector.fab.badge',
  MAIN_MODAL: 'inspector.modal.container',
  HEADER_CLOSE: 'inspector.header.closeBtn',
  HEADER_CLEAR: 'inspector.header.clearBtn',
  HEADER_SEARCH: 'inspector.header.searchInput',
  HEADER_PEEK: 'inspector.header.peekBtn',
  HEADER_SETTINGS: 'inspector.header.settingsBtn',

  // Tab Navigation Locators
  TAB: {
    APIS: 'inspector.tab.apis',
    LOGS: 'inspector.tab.logs',
    REDUX: 'inspector.tab.redux',
    STORAGE: 'inspector.tab.storage',
    CRASH: 'inspector.tab.crash',
    ANALYTICS: 'inspector.tab.analytics',
    SOCKET: 'inspector.tab.socket',
    PUSH: 'inspector.tab.push',
    DEVICE: 'inspector.tab.device',
    MEDIA: 'inspector.tab.media',
    SETTINGS: 'inspector.tab.settings',
  },

  // Network Tab Details
  NETWORK: {
    ITEM_PREFIX: 'inspector.network.item.',
    DETAIL_PANEL: 'inspector.network.detail.panel',
    COPY_CURL: 'inspector.network.detail.copyCurl',
    COPY_RESPONSE: 'inspector.network.detail.copyResponse',
    RESPONSE_BODY: 'inspector.network.detail.responseBody',
    FILTER_ALL: 'inspector.network.filter.all',
    FILTER_ERRORS: 'inspector.network.filter.errors',
    FILTER_GRAPHQL: 'inspector.network.filter.graphql',
  },

  // Console Logs Tab Details
  CONSOLE: {
    ITEM_PREFIX: 'inspector.console.item.',
    FILTER_LOG: 'inspector.console.filter.log',
    FILTER_WARN: 'inspector.console.filter.warn',
    FILTER_ERROR: 'inspector.console.filter.error',
    SYMBOLICATED_STACK: 'inspector.console.stacktrace',
  },

  // Redux Tab Details
  REDUX: {
    SLICE_PREFIX: 'inspector.redux.slice.',
    ACTION_PREFIX: 'inspector.redux.action.',
    STATE_DIFF_TREE: 'inspector.redux.diffTree',
  },

  // Storage Tab Details
  STORAGE: {
    ITEM_PREFIX: 'inspector.storage.item.',
    ADD_BTN: 'inspector.storage.addBtn',
    KEY_INPUT: 'inspector.storage.keyInput',
    VALUE_INPUT: 'inspector.storage.valueInput',
    SAVE_BTN: 'inspector.storage.saveBtn',
    CLEAR_ALL_BTN: 'inspector.storage.clearAllBtn',
  },

  // Crash & Global Error Boundary Modal
  CRASH: {
    GLOBAL_MODAL: 'inspector.crash.globalModal',
    VIEW_IN_INSPECTOR_BTN: 'inspector.crash.viewInInspectorBtn',
    DISMISS_BTN: 'inspector.crash.dismissBtn',
    STACKTRACE_VIEW: 'inspector.crash.stacktraceView',
  },

  // Media Studio
  MEDIA: {
    RECORD_TRIGGER: 'inspector.media.recordBtn',
    SCREENSHOT_TRIGGER: 'inspector.media.screenshotBtn',
    PREVIEW_MODAL: 'inspector.media.previewModal',
    SCRUBBER_HUD: 'inspector.media.scrubberHud',
    ZOOM_DOCK: 'inspector.media.zoomDock',
    COMPARE_BTN: 'inspector.media.compareBtn',
  },

  // Example App Screen Action Triggers
  HOME: {
    TRIGGER_GET: 'home.trigger.get',
    TRIGGER_POST: 'home.trigger.post',
    TRIGGER_GRAPHQL: 'home.trigger.graphql',
    TRIGGER_ERROR: 'home.trigger.error',
    TRIGGER_LOG: 'home.trigger.consoleLog',
    TRIGGER_WARN: 'home.trigger.consoleWarn',
    TRIGGER_ERR_LOG: 'home.trigger.consoleError',
    TRIGGER_REDUX: 'home.trigger.reduxAction',
    TRIGGER_CRASH: 'home.trigger.crash',
    TRIGGER_ANALYTICS: 'home.trigger.analytics',
    TRIGGER_SOCKET: 'home.trigger.socket',
    TRIGGER_PUSH: 'home.trigger.push',
  },
} as const;
