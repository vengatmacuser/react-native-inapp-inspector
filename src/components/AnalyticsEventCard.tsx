import React, {useEffect, useRef} from 'react';
import {Animated, StyleSheet, Text, View} from 'react-native';
import {AppColors} from '../styles/AppColors';
import {AppFonts} from '../styles/AppFonts';
import {AnalyticsEventCardProps} from '../types';
import {formatGap, formatTime} from '../helpers';
import HighlightText from './HighlightText';
import TouchableScale from './TouchableScale';

// ─── Palette (Google Analytics colours) ───────────────────────────────────────

const EVENT_PALETTE = [
  AppColors.googleBlue, // blue
  AppColors.googleGreen, // green
  AppColors.googlePurple, // purple
  AppColors.googleTeal, // teal
  AppColors.googleRed, // red
  AppColors.googleOrange, // orange
  AppColors.blue700, // dark blue
  AppColors.materialGreen, // dark green
];

export function getEventColor(name: string): string {
  const safeName = typeof name === 'string' ? name : String(name || '');
  let hash = 0;
  for (let i = 0; i < safeName.length; i++) {
    hash = (hash * 31 + safeName.charCodeAt(i)) | 0;
  }
  return EVENT_PALETTE[Math.abs(hash) % EVENT_PALETTE.length];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getEventCategory(name: string): string {
  if (!name) return 'Custom';
  const lowercaseName = name.toLowerCase();
  
  if (lowercaseName === 'screen_view' || lowercaseName === 'page_view') {
    return 'Page View';
  }
  
  // Ecommerce events
  const ecommerceEvents = [
    'purchase', 'add_to_cart', 'begin_checkout', 'view_item', 
    'select_item', 'remove_from_cart', 'view_cart', 
    'add_shipping_info', 'add_payment_info', 'refund',
    'view_item_list', 'select_promotion', 'view_promotion'
  ];
  if (ecommerceEvents.includes(lowercaseName)) {
    return 'Ecommerce';
  }
  
  // Firebase System Auto-events
  const systemEvents = [
    'first_open', 'session_start', 'user_engagement', 
    'app_clear_data', 'app_exception', 'app_update', 'os_update',
    'notification_receive', 'notification_open', 'notification_dismiss',
    'screen_active', 'screen_inactive'
  ];
  if (systemEvents.includes(lowercaseName) || lowercaseName.startsWith('firebase_') || lowercaseName.startsWith('_')) {
    return 'System';
  }
  
  return 'Custom';
}

function getCategoryColors(category: string) {
  switch (category) {
    case 'Page View':
      return {
        bg: AppColors.blueBg,
        border: AppColors.blueBorder,
        text: AppColors.blue800,
      };
    case 'Ecommerce':
      return {
        bg: AppColors.greenBg,
        border: AppColors.greenBorder,
        text: AppColors.materialGreen,
      };
    case 'System':
      return {
        bg: AppColors.greyBg,
        border: AppColors.greyBorder,
        text: AppColors.grey600,
      };
    default:
      return {
        bg: AppColors.purpleBg,
        border: AppColors.purpleBorder,
        text: AppColors.purpleText,
      };
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

const AnalyticsEventCard = React.memo(function AnalyticsEventCard({
  event,
  onPress,
  isNew = false,
  searchStr = '',
  msSincePrev,
  computedScreenName,
}: AnalyticsEventCardProps) {
  const color = getEventColor(event.name);
  const paramCount = event.params ? Object.keys(event.params).length : 0;
  const userPropCount = event.userProperties
    ? Object.keys(event.userProperties).length
    : 0;

  // Flash animation for newly logged events
  const flashOpacity = useRef(new Animated.Value(isNew ? 1 : 0)).current;
  useEffect(() => {
    if (isNew) {
      Animated.timing(flashOpacity, {
        toValue: 0,
        duration: 1200,
        useNativeDriver: true,
      }).start();
    }
  }, [isNew]);

  const showGap = msSincePrev != null && msSincePrev >= 2000;

  return (
    <View style={cardStyles.container}>
      {/* ── Gap Indicator ─────────────────────────────────────────────────── */}
      {showGap && (
        <View style={cardStyles.gapContainer}>
          <Text style={[cardStyles.gapText, {color: AppColors.grayTextWeak}]}>{formatGap(msSincePrev)}</Text>
        </View>
      )}

      {/* ── Main Card ─────────────────────────────────────────────────────── */}
      <TouchableScale onPress={onPress} style={[cardStyles.modernCard, {backgroundColor: AppColors.primaryLight, borderColor: AppColors.grayBorderSecondary}]}>
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: color,
              opacity: flashOpacity.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 0.08],
              }),
            },
          ]}
        />

        {/* Top Row: Event Name & Timestamp */}
        <View style={cardStyles.cardHeader}>
          <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
            <View
              style={[
                cardStyles.nameBadge,
                {backgroundColor: `${color}1A`, borderColor: `${color}30`},
              ]}>
              <HighlightText
                text={event.name}
                search={searchStr}
                style={[cardStyles.eventName, {color: color}]}
                highlightStyle={cardStyles.highlight}
              />
            </View>

            {(() => {
              const category = getEventCategory(event.name);
              const tagColors = getCategoryColors(category);
              return (
                <View
                  style={[
                    cardStyles.categoryBadge,
                    {backgroundColor: tagColors.bg, borderColor: tagColors.border},
                  ]}>
                  <Text style={[cardStyles.categoryText, {color: tagColors.text}]}>
                    {category}
                  </Text>
                </View>
              );
            })()}

            {event.count !== undefined ? (
              <View
                style={[
                  cardStyles.duplicateBadge,
                  event.count === 1 && {
                    backgroundColor: AppColors.grayBackground,
                    borderColor: AppColors.grayBorderSecondary,
                  },
                ]}>
                <Text
                  style={[
                    cardStyles.duplicateText,
                    event.count === 1 && {color: AppColors.grayTextStrong},
                  ]}>
                  {event.count}×{event.count > 1 ? ' Duplicate' : ''}
                </Text>
              </View>
            ) : null}
          </View>
          <Text style={[cardStyles.timestamp, {color: AppColors.grayTextWeak}]}>
            {formatTime(event.timestamp)}
          </Text>
        </View>

        {/* Bottom Row: Metadata Chips & Sparkline */}
        <View style={cardStyles.cardBody}>
          <View style={cardStyles.chipsRow}>
            {(() => {
              const rawScreenName =
                computedScreenName ||
                event.screenName ||
                event.params?.firebase_screen ||
                event.params?.screen_name ||
                event.params?.firebase_screen_class;
              if (!rawScreenName) return null;
              const screenNameStr = typeof rawScreenName === 'object'
                ? JSON.stringify(rawScreenName)
                : String(rawScreenName);
              return (
                <View style={[cardStyles.chip, {backgroundColor: AppColors.grayBackground, borderColor: AppColors.grayBorderSecondary}]}>
                  <View
                    style={[cardStyles.screenDot, {backgroundColor: color}]}
                  />
                  <Text style={[cardStyles.chipText, {color: AppColors.grayText}]} numberOfLines={1}>
                    {screenNameStr}
                  </Text>
                </View>
              );
            })()}

            <View style={[cardStyles.chip, {backgroundColor: AppColors.grayBackground, borderColor: AppColors.grayBorderSecondary}]}>
              <Text style={[cardStyles.chipText, {color: AppColors.grayText}]}>
                {'{} '} {paramCount} params
              </Text>
            </View>

            {userPropCount > 0 && (
              <View style={[cardStyles.chip, {backgroundColor: AppColors.grayBackground, borderColor: AppColors.grayBorderSecondary}]}>
                <Text style={[cardStyles.chipText, {color: AppColors.grayText}]}>★ {userPropCount} props</Text>
              </View>
            )}

            {(() => {
              const items = event.params?.items;
              if (Array.isArray(items) && items.length > 0) {
                return (
                  <View style={[cardStyles.chip, {backgroundColor: AppColors.amberBg, borderColor: AppColors.amberBorder}]}>
                    <Text style={[cardStyles.chipText, {color: AppColors.amber700, fontFamily: AppFonts.interBold}]}>
                      🛒 {items.length} {items.length === 1 ? 'item' : 'items'}
                    </Text>
                  </View>
                );
              }
              return null;
            })()}

            {(() => {
              const val = event.params?.value ?? event.params?.price;
              const currency = event.params?.currency ?? '';
              const isPrimitive = typeof val === 'string' || typeof val === 'number';
              if (isPrimitive) {
                const currencyStr = typeof currency === 'string' || typeof currency === 'number' ? String(currency) : '';
                return (
                  <View style={[cardStyles.chip, {backgroundColor: AppColors.emeraldBg, borderColor: AppColors.emeraldBorder}]}>
                    <Text style={[cardStyles.chipText, {color: AppColors.emerald600, fontFamily: AppFonts.interBold}]}>
                      💰 {String(val)} {currencyStr}
                    </Text>
                  </View>
                );
              }
              return null;
            })()}
          </View>
        </View>
      </TouchableScale>
    </View>
  );
});

// ─── Styles ───────────────────────────────────────────────────────────────────

const cardStyles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingVertical: 3,
  },
  gapContainer: {
    alignItems: 'center',
    marginVertical: 4,
  },
  gapText: {
    fontFamily: AppFonts.interMedium,
    fontSize: 10,
    color: AppColors.grayTextWeak,
    letterSpacing: 0.5,
  },
  modernCard: {
    backgroundColor: AppColors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: AppColors.dividerColor,
    padding: 8,
    shadowColor: AppColors.black,
    shadowOpacity: 0.03,
    shadowRadius: 3,
    shadowOffset: {width: 0, height: 1},
    elevation: 1,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  nameBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2.5,
    borderRadius: 6,
    borderWidth: 1,
  },
  eventName: {
    fontFamily: AppFonts.interBold,
    fontSize: 12,
    letterSpacing: 0.2,
  },
  timestamp: {
    fontFamily: AppFonts.interMedium,
    fontSize: 11,
    color: AppColors.grayTextWeak,
  },
  highlight: {
    backgroundColor: AppColors.yellowHighlight,
    color: AppColors.primaryBlack,
    borderRadius: 2,
  },
  cardBody: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  chipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    flex: 1,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.grayBackground,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: AppColors.grayBorderSecondary,
  },
  chipText: {
    fontFamily: AppFonts.interMedium,
    fontSize: 10,
    color: AppColors.grayText,
  },
  screenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  duplicateBadge: {
    backgroundColor: AppColors.roseBg,
    borderColor: AppColors.roseBorder,
    borderWidth: 1,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  duplicateText: {
    fontFamily: AppFonts.interBold,
    fontSize: 9,
    color: AppColors.rose600,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  categoryBadge: {
    borderWidth: 1,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  categoryText: {
    fontFamily: AppFonts.interBold,
    fontSize: 9,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  miniGraphWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 18,
    gap: 2,
    marginLeft: 12,
  },
  miniGraphBar: {
    width: 4,
    borderRadius: 2,
    opacity: 0.7,
  },
});

export default AnalyticsEventCard;
