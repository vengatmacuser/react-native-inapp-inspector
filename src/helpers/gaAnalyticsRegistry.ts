// ─── Google Analytics (GA4) & Firebase Analytics Dynamic Registry ─────────────
//
// Dynamically inspects GA4 / Firebase Analytics runtime schemas, auto-detects
// standard GA4 event taxonomies, and supports dynamic GA plugins.
// ─────────────────────────────────────────────────────────────────────────────

import {GAEventCategory} from '../types/enums';

export {GAEventCategory};

export interface GAPlugin {
  name: string;
  resolveCategory?: (
    eventName: string,
    params?: Record<string, any>,
  ) => GAEventCategory | string | null | undefined;
}

// ─── Official GA4 & Firebase Standard Event Sets ─────────────────────────────

const GA4_PAGE_VIEW_EVENTS = new Set([
  'screen_view',
  'page_view',
  'screen_active',
  'screen_inactive',
  'view_search_results',
  'search',
]);

const GA4_ECOMMERCE_EVENTS = new Set([
  'purchase',
  'refund',
  'add_to_cart',
  'remove_from_cart',
  'view_cart',
  'begin_checkout',
  'add_shipping_info',
  'add_payment_info',
  'view_item',
  'view_item_list',
  'select_item',
  'select_promotion',
  'view_promotion',
  'add_to_wishlist',
  'generate_lead',
  'in_app_purchase',
  'earn_virtual_currency',
  'spend_virtual_currency',
  'join_group',
  'level_up',
  'level_start',
  'level_end',
  'post_score',
  'select_content',
  'tutorial_begin',
  'tutorial_complete',
  'unlock_achievement',
]);

const GA4_SYSTEM_EVENTS = new Set([
  'first_open',
  'first_visit',
  'session_start',
  'user_engagement',
  'app_clear_data',
  'app_exception',
  'app_remove',
  'app_store_refund',
  'app_store_subscription_cancel',
  'app_store_subscription_convert',
  'app_store_subscription_renew',
  'app_update',
  'os_update',
  'notification_receive',
  'notification_open',
  'notification_dismiss',
  'notification_foreground',
  'dynamic_link_first_open',
  'dynamic_link_app_open',
  'dynamic_link_app_update',
  'ad_impression',
  'ad_click',
  'ad_reward',
  'ad_query',
  'ad_exposure',
]);

// ─── Registered Dynamic Plugins ──────────────────────────────────────────────

const registeredPlugins: GAPlugin[] = [];

/**
 * Register a dynamic Google Analytics / Firebase plugin or custom resolver.
 */
export const registerGAPlugin = (plugin: GAPlugin): void => {
  if (!registeredPlugins.some(p => p.name === plugin.name)) {
    registeredPlugins.push(plugin);
  }
};

/**
 * Attempt dynamic inspection of host runtime Firebase / Google Analytics modules.
 */
const tryInspectRuntimeFirebaseAnalytics = (): void => {
  try {
    const firebaseAnalytics = require('@react-native-firebase/analytics');
    const mod = firebaseAnalytics?.default || firebaseAnalytics;
    if (mod?.EventNames) {
      Object.keys(mod.EventNames).forEach(k => {
        const val = mod.EventNames[k]?.toLowerCase();
        if (val) {
          if (
            val.includes('cart') ||
            val.includes('checkout') ||
            val.includes('purchase') ||
            val.includes('item')
          ) {
            GA4_ECOMMERCE_EVENTS.add(val);
          } else if (val.includes('screen') || val.includes('page')) {
            GA4_PAGE_VIEW_EVENTS.add(val);
          }
        }
      });
    }
  } catch {
    // Optional dependency - safe fallback to built-in GA4 taxonomy
  }
};

// Initialize dynamic runtime inspection once
tryInspectRuntimeFirebaseAnalytics();

/**
 * Dynamically resolves the GA4 event category using:
 * 1. Registered dynamic GA plugins
 * 2. Runtime Firebase Analytics inspection
 * 3. GA4 standard event taxonomies (O(1) Set lookup)
 * 4. Semantic pattern & prefix analysis
 */
export const getEventCategory = (
  name: string,
  params?: Record<string, any>,
): GAEventCategory => {
  if (!name || typeof name !== 'string') return 'custom';
  const cleanName = name.trim().toLowerCase();

  // 1. Run through registered dynamic plugins
  for (const plugin of registeredPlugins) {
    if (plugin.resolveCategory) {
      const category = plugin.resolveCategory(cleanName, params);
      if (category) return category as GAEventCategory;
    }
  }

  // 2. Exact GA4 taxonomy matching (O(1))
  if (GA4_PAGE_VIEW_EVENTS.has(cleanName)) {
    return 'page_view';
  }

  if (GA4_ECOMMERCE_EVENTS.has(cleanName)) {
    return 'ecommerce';
  }

  if (GA4_SYSTEM_EVENTS.has(cleanName)) {
    return 'system';
  }

  // 3. Prefix & namespace detection
  if (
    cleanName.startsWith('firebase_') ||
    cleanName.startsWith('ga_') ||
    cleanName.startsWith('gtag_') ||
    cleanName.startsWith('_') ||
    cleanName.startsWith('google_')
  ) {
    return 'system';
  }

  // 4. Semantic pattern matching
  if (
    cleanName.endsWith('_view') ||
    cleanName.endsWith('_screen') ||
    cleanName.startsWith('screen_') ||
    cleanName.startsWith('page_') ||
    cleanName.includes('screen_view') ||
    cleanName.includes('page_view')
  ) {
    return 'page_view';
  }

  if (
    cleanName.includes('cart') ||
    cleanName.includes('checkout') ||
    cleanName.includes('purchase') ||
    cleanName.includes('payment') ||
    cleanName.includes('order') ||
    cleanName.includes('refund') ||
    cleanName.includes('shipping')
  ) {
    return 'ecommerce';
  }

  return 'custom';
};
