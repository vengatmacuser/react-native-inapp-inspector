/**
 * Sub-module entry point: react-native-inapp-inspector/push
 * Universal, domain-agnostic push notification capture & inspector engine.
 */
export {
  recordPushNotification,
  recordSalesforcePush,
  getPushRecords,
  clearPushRecords,
  subscribePushEvents,
  emitPushEvent,
  simulateTestPush,
  autoSetupPushLogger,
  setMaxPushRecordsLimit,
  getMaxPushRecordsLimit,
  getDiscoveredPushSources,
  prunePushRecords,
} from './customHooks/pushNotificationLogger';

export {
  sharePushReport,
  formatPushReport,
} from './helpers/shareFormatter';

export type {
  PushNotificationRecord,
  PushSource,
  PushFilterState,
  PushStats,
  PushCardProps,
  PushDetailProps,
} from './types';

export {
  PushAppState,
  PushActionType,
  PushDetailSubTab,
  PushFilterType,
} from './types';
