import {AppState} from 'react-native';
import type {PushNotificationRecord, PushSource} from '../types';

let pushRecords: PushNotificationRecord[] = [];
let maxPushRecordsLimit = 50;
const listeners = new Set<(records: PushNotificationRecord[]) => void>();

function notifyListeners() {
  const snapshot = [...pushRecords];
  listeners.forEach(fn => {
    try {
      fn(snapshot);
    } catch {}
  });
}

function generatePushId(): string {
  return `push_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Universal dynamic heuristic extractor to parse notifications from ANY domain/SDK.
 */
export function normalizePushPayload(
  raw: any,
  options?: Partial<PushNotificationRecord>,
): PushNotificationRecord {
  if (!raw || typeof raw !== 'object') {
    return {
      id: options?.id || generatePushId(),
      title: options?.title || 'Notification',
      body: options?.body || String(raw || ''),
      source: options?.source || 'custom',
      domain: options?.domain || 'custom',
      appState: options?.appState || (AppState.currentState === 'active' ? 'foreground' : 'background'),
      action: options?.action || 'received',
      timestamp: options?.timestamp || Date.now(),
      data: options?.data || {},
      rawPayload: raw,
    };
  }

  // 1. Identify Raw / Data / Notification sub-dictionaries
  const notifObj = raw.notification || raw.aps?.alert || raw.alert || raw;
  const dataObj = raw.data || raw.custom || raw.customKeys || raw.userInfo || raw.payload || {};

  // 2. Resolve ID
  const resolvedId =
    options?.id ||
    raw.id ||
    raw.messageId ||
    raw.message_id ||
    raw._m ||
    raw.identifier ||
    raw['gcm.message_id'] ||
    raw['google.message_id'] ||
    generatePushId();

  // 3. Resolve Title
  const resolvedTitle =
    options?.title ||
    (typeof notifObj === 'object' ? notifObj.title || notifObj.subject || notifObj.headline : null) ||
    dataObj.title ||
    raw.title ||
    (typeof raw.alert === 'string' ? raw.alert : undefined) ||
    'Push Notification';

  // 4. Resolve Body
  const resolvedBody =
    options?.body ||
    (typeof notifObj === 'object' ? notifObj.body || notifObj.message || notifObj.text || notifObj.alert : null) ||
    dataObj.body ||
    dataObj.message ||
    raw.body ||
    raw.message ||
    (typeof raw.alert === 'string' ? raw.alert : undefined) ||
    '';

  // 5. Resolve Subtitle
  const resolvedSubtitle =
    options?.subtitle ||
    (typeof notifObj === 'object' ? notifObj.subtitle || notifObj.subTitle : null) ||
    dataObj.subtitle ||
    raw.subtitle;

  // 6. Resolve Image / Media URL
  const resolvedImage =
    options?.imageUrl ||
    (typeof notifObj === 'object' ? notifObj.imageUrl || notifObj.image || notifObj.bigPicture : null) ||
    dataObj.imageUrl ||
    dataObj.image ||
    raw.imageUrl ||
    raw.image ||
    raw.fcm_options?.image;

  // 7. Resolve Sound & Badge & Priority & Channel
  const resolvedSound =
    options?.sound ||
    (typeof notifObj === 'object' ? notifObj.sound : null) ||
    dataObj.sound ||
    raw.sound ||
    raw.aps?.sound;

  const resolvedBadge =
    options?.badge ??
    (typeof raw.badge === 'number' ? raw.badge : null) ??
    (typeof raw.aps?.badge === 'number' ? raw.aps.badge : null);

  const resolvedChannelId =
    options?.channelId ||
    (typeof notifObj === 'object' ? notifObj.channelId || notifObj.android?.channelId : null) ||
    dataObj.channelId ||
    raw.channelId;

  const resolvedPriority =
    options?.priority ||
    raw.priority ||
    (raw.highPriority ? 'high' : undefined);

  // 8. Dynamic Domain / Source Inference
  let inferredSource: PushSource = options?.source || 'push';
  let inferredDomain = options?.domain;

  // Detect Salesforce Marketing Cloud
  if (raw._m || raw._sid || raw._od || raw._h || raw._r || dataObj._m || dataObj._sid || dataObj.customKeys) {
    inferredSource = 'salesforce';
    inferredDomain = 'Salesforce Marketing Cloud';
  } else if (raw.ab_ || dataObj.ab_ || raw.braze_id) {
    inferredSource = 'braze';
    inferredDomain = 'Braze';
  } else if (raw.custom?.i || raw.os_ || dataObj.os_) {
    inferredSource = 'onesignal';
    inferredDomain = 'OneSignal';
  } else if (raw.experienceId || raw.projectId) {
    inferredSource = 'expo';
    inferredDomain = 'Expo Notifications';
  } else if (raw['gcm.message_id'] || raw.fcm_options || raw.from) {
    inferredSource = 'fcm';
    inferredDomain = 'Firebase Cloud Messaging';
  } else if (raw.aps) {
    inferredSource = 'apns';
    inferredDomain = 'Apple Push Notification Service';
  } else if (options?.source) {
    inferredSource = options.source;
    inferredDomain = options.domain || options.source;
  }

  // 9. Discover Domain-Specific Attributes
  const customDomainAttributes: Record<string, any> = {};
  if (inferredSource === 'salesforce') {
    if (raw._m || dataObj._m) customDomainAttributes.messageId = raw._m || dataObj._m;
    if (raw._sid || dataObj._sid) customDomainAttributes.sendId = raw._sid || dataObj._sid;
    if (raw._od || dataObj._od) customDomainAttributes.openDirectUrl = raw._od || dataObj._od;
    if (raw._h || dataObj._h) customDomainAttributes.cloudPageUrl = raw._h || dataObj._h;
    if (raw._r || dataObj._r) customDomainAttributes.receiptUrl = raw._r || dataObj._r;
    if (raw.customKeys || dataObj.customKeys) customDomainAttributes.customKeys = raw.customKeys || dataObj.customKeys;
  }

  // 10. Combine full data object (preserves ALL dynamic keys)
  const combinedData: Record<string, any> = {
    ...(typeof raw === 'object' ? raw : {}),
    ...(typeof dataObj === 'object' ? dataObj : {}),
    ...(options?.data || {}),
  };

  const currentAppState = AppState.currentState === 'active' ? 'foreground' : 'background';

  return {
    id: String(resolvedId),
    title: resolvedTitle,
    body: resolvedBody,
    subtitle: resolvedSubtitle,
    source: inferredSource,
    domain: inferredDomain || inferredSource,
    appState: options?.appState || currentAppState,
    action: options?.action || 'received',
    actionId: options?.actionId,
    userText: options?.userText,
    timestamp: options?.timestamp || Date.now(),
    data: combinedData,
    rawPayload: raw,
    channelId: resolvedChannelId,
    imageUrl: resolvedImage,
    sound: resolvedSound ? String(resolvedSound) : undefined,
    badge: resolvedBadge != null ? Number(resolvedBadge) : undefined,
    collapseKey: raw.collapseKey || raw.collapse_key,
    priority: resolvedPriority,
    customDomainAttributes: Object.keys(customDomainAttributes).length > 0 ? customDomainAttributes : undefined,
  };
}

/**
 * Record any incoming or opened push notification from any domain or SDK.
 */
export function recordPushNotification(
  payload: any,
  options?: Partial<PushNotificationRecord>,
): PushNotificationRecord {
  const record = normalizePushPayload(payload, options);

  // Prepend new record to buffer
  pushRecords.unshift(record);

  // Maintain max limit
  if (pushRecords.length > maxPushRecordsLimit) {
    pushRecords = pushRecords.slice(0, maxPushRecordsLimit);
  }

  notifyListeners();
  return record;
}

/**
 * Specialized helper for Salesforce Marketing Cloud SDK integration.
 */
export function recordSalesforcePush(
  payload: any,
  options?: Partial<PushNotificationRecord>,
): PushNotificationRecord {
  return recordPushNotification(payload, {
    source: 'salesforce',
    domain: 'Salesforce Marketing Cloud',
    ...options,
  });
}

/**
 * Get all captured push notification records.
 */
export function getPushRecords(): PushNotificationRecord[] {
  return [...pushRecords];
}

/**
 * Clear all push notification records.
 */
export function clearPushRecords(): void {
  pushRecords = [];
  notifyListeners();
}

/**
 * Prune push records for low memory conditions.
 */
export function prunePushRecords(keepCount: number = 20): void {
  if (pushRecords.length > keepCount) {
    pushRecords = pushRecords.slice(0, keepCount);
    notifyListeners();
  }
}

/**
 * Update maximum push records storage limit.
 */
export function setMaxPushRecordsLimit(limit: number): void {
  maxPushRecordsLimit = Math.max(10, Math.min(limit, 500));
  if (pushRecords.length > maxPushRecordsLimit) {
    pushRecords = pushRecords.slice(0, maxPushRecordsLimit);
    notifyListeners();
  }
}

/**
 * Get the current maximum push records storage limit.
 */
export function getMaxPushRecordsLimit(): number {
  return maxPushRecordsLimit;
}

/**
 * Emit / record a push notification event (alias for recordPushNotification).
 */
export const emitPushEvent = recordPushNotification;

/**
 * Subscribe to real-time push notification updates.
 */
export function subscribePushEvents(
  callback: (records: PushNotificationRecord[]) => void,
): () => void {
  listeners.add(callback);
  callback([...pushRecords]);
  return () => {
    listeners.delete(callback);
  };
}

/**
 * Discover all unique sources/domains seen across recorded pushes.
 */
export function getDiscoveredPushSources(): string[] {
  const set = new Set<string>();
  pushRecords.forEach(r => {
    if (r.source) set.add(r.source.toLowerCase());
  });
  return Array.from(set);
}

/**
 * Built-in push simulation presets for testing.
 */
export function simulateTestPush(
  preset: 'salesforce' | 'fcm' | 'apns' | 'deeplink' | 'rich_media' | 'custom' = 'salesforce',
  customData?: any,
): PushNotificationRecord {
  const now = Date.now();

  switch (preset) {
    case 'salesforce':
      return recordPushNotification({
        _m: `sfmc_msg_${Math.floor(Math.random() * 900000 + 100000)}`,
        _sid: 'journey_flash_sale_q3',
        _od: 'app://deals/flash-50-off',
        _h: 'https://cloud.email.salesforce.com/pages/view',
        _r: `receipt_${now}`,
        title: '🔥 Salesforce Flash 50% Off Sale!',
        body: 'Special VIP weekend access unlocked! Tap to claim your discount.',
        customKeys: {
          campaign: 'LaborDayPromo',
          discountCode: 'FLASH50',
          tier: 'Diamond VIP',
          loyaltyPoints: 1250,
        },
        channelId: 'promotions',
        priority: 'high',
      }, {
        source: 'salesforce',
        domain: 'Salesforce Marketing Cloud',
        appState: 'foreground',
        action: 'received',
      });

    case 'fcm':
      return recordPushNotification({
        'gcm.message_id': `fcm_${Math.floor(Math.random() * 9000000)}`,
        notification: {
          title: '📦 Order #98421 Out for Delivery',
          body: 'Your courier is 5 minutes away with your package.',
          imageUrl: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=300',
          channelId: 'deliveries',
        },
        data: {
          orderId: 'ORD-98421',
          courier: 'Express Delivery',
          trackingUrl: 'https://track.example.com/98421',
        },
      }, {
        source: 'fcm',
        domain: 'Firebase Cloud Messaging',
        appState: 'background',
        action: 'received',
      });

    case 'apns':
      return recordPushNotification({
        aps: {
          alert: {
            title: '💬 New Message from Alex',
            subtitle: 'Direct Message',
            body: 'Hey! Are you ready for the team sync at 11 AM?',
          },
          badge: 3,
          sound: 'chime.aiff',
          'thread-id': 'chat_thread_102',
        },
        customData: {
          senderId: 'user_alex_84',
          chatRoomId: 'room_dev_sync',
        },
      }, {
        source: 'apns',
        domain: 'Apple Push (APNs)',
        appState: 'foreground',
        action: 'received',
      });

    case 'deeplink':
      return recordPushNotification({
        id: `dl_${now}`,
        title: '🚀 Deep Link Received',
        body: 'Tap to navigate to the new payment analytics dashboard.',
        data: {
          deepLink: 'myapp://analytics/payments?period=monthly',
          screen: 'AnalyticsDetail',
          sourceCampaign: 'in_app_reminder',
        },
      }, {
        source: 'deeplink',
        domain: 'Custom Deep Link',
        appState: 'foreground',
        action: 'opened',
      });

    case 'rich_media':
      return recordPushNotification({
        id: `rich_${now}`,
        title: '🎬 New Video Available',
        body: 'Watch the product keynote highlights now in HD.',
        imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500',
        data: {
          videoId: 'vid_launch_2026',
          category: 'Keynotes',
          duration: 340,
        },
      }, {
        source: 'rich_media',
        domain: 'Media Service',
        appState: 'foreground',
        action: 'received',
      });

    case 'custom':
    default:
      return recordPushNotification(
        customData || {
          id: `custom_${now}`,
          title: '⚡ Custom Domain Push',
          body: 'This is a flexible dynamic push payload from an arbitrary backend.',
          data: {
            domain: 'api.mycustomservice.io',
            event: 'custom_alert',
            nestedData: {level: 'high', score: 98.4},
          },
        },
        {
          source: 'custom',
          domain: 'Custom API',
        },
      );
  }
}

/**
 * One-line auto-setup helper for various messaging frameworks.
 */
export function autoSetupPushLogger(options?: {
  messaging?: any;
  notifee?: any;
  expoNotifications?: any;
  marketingCloud?: any;
}): () => void {
  const unsubscribers: Array<() => void> = [];

  // Firebase Messaging
  if (options?.messaging) {
    try {
      const msg = typeof options.messaging === 'function' ? options.messaging() : options.messaging;
      if (typeof msg.onMessage === 'function') {
        const unsub1 = msg.onMessage(async (remoteMessage: any) => {
          recordPushNotification(remoteMessage, {
            source: 'fcm',
            appState: 'foreground',
            action: 'received',
          });
        });
        if (typeof unsub1 === 'function') unsubscribers.push(unsub1);
      }
      if (typeof msg.onNotificationOpenedApp === 'function') {
        const unsub2 = msg.onNotificationOpenedApp((remoteMessage: any) => {
          recordPushNotification(remoteMessage, {
            source: 'fcm',
            appState: 'background',
            action: 'opened',
          });
        });
        if (typeof unsub2 === 'function') unsubscribers.push(unsub2);
      }
    } catch {}
  }

  // Notifee
  if (options?.notifee) {
    try {
      if (typeof options.notifee.onForegroundEvent === 'function') {
        const unsubNotifee = options.notifee.onForegroundEvent(({type, detail}: any) => {
          recordPushNotification(detail.notification, {
            source: 'notifee',
            appState: 'foreground',
            action: type === 1 ? 'opened' : 'received',
            actionId: detail.pressAction?.id,
          });
        });
        if (typeof unsubNotifee === 'function') unsubscribers.push(unsubNotifee);
      }
    } catch {}
  }

  // Salesforce Marketing Cloud
  if (options?.marketingCloud) {
    try {
      if (typeof options.marketingCloud.setNotificationOpenedListener === 'function') {
        options.marketingCloud.setNotificationOpenedListener((event: any) => {
          recordSalesforcePush(event, {
            action: 'opened',
            appState: 'foreground',
          });
        });
      }
    } catch {}
  }

  return () => {
    unsubscribers.forEach(fn => {
      try {
        fn();
      } catch {}
    });
  };
}
