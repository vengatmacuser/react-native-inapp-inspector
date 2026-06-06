import React, {useEffect, useRef} from 'react';
import {Animated, StyleSheet, Text, View} from 'react-native';
import {AppColors} from '../styles/AppColors';
import {AppFonts} from '../styles/AppFonts';
import {AnalyticsEvent} from '../types';
import HighlightText from './HighlightText';
import TouchableScale from './TouchableScale';

// ─── Palette (Google Analytics colours) ───────────────────────────────────────

const EVENT_PALETTE = [
  '#4285F4', // blue
  '#34A853', // green
  '#9C27B0', // purple
  '#00897B', // teal
  '#E53935', // red
  '#F57C00', // orange
  '#1565C0', // dark blue
  '#2E7D32', // dark green
];

export function getEventColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) | 0;
  }
  return EVENT_PALETTE[Math.abs(hash) % EVENT_PALETTE.length];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(ts: number): string {
  const d = new Date(ts);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  const ms = String(d.getMilliseconds()).padStart(3, '0');
  return `${hh}:${mm}:${ss}.${ms}`;
}

function formatGap(ms: number): string {
  if (ms < 1000) return `+${ms}ms`;
  const s = Math.round(ms / 1000);
  if (s < 60) return `+${s}s`;
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return rem > 0 ? `+${m}m ${rem}s` : `+${m}m`;
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface AnalyticsEventCardProps {
  event: AnalyticsEvent & {count?: number};
  onPress: () => void;
  isNew?: boolean;
  searchStr?: string;
  isFirst: boolean;
  isLast: boolean;
  msSincePrev?: number;
  showTimestamp?: boolean;
  computedScreenName?: string;
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
          <Text style={cardStyles.gapText}>{formatGap(msSincePrev)}</Text>
        </View>
      )}

      {/* ── Main Card ─────────────────────────────────────────────────────── */}
      <TouchableScale onPress={onPress} style={cardStyles.modernCard}>
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
          <Text style={cardStyles.timestamp}>
            {formatTime(event.timestamp)}
          </Text>
        </View>

        {/* Bottom Row: Metadata Chips & Sparkline */}
        <View style={cardStyles.cardBody}>
          <View style={cardStyles.chipsRow}>
            {computedScreenName ||
            event.screenName ||
            event.params?.firebase_screen ||
            event.params?.screen_name ||
            event.params?.firebase_screen_class ? (
              <View style={cardStyles.chip}>
                <View
                  style={[cardStyles.screenDot, {backgroundColor: color}]}
                />
                <Text style={cardStyles.chipText} numberOfLines={1}>
                  {computedScreenName ||
                    event.screenName ||
                    event.params?.firebase_screen ||
                    event.params?.screen_name ||
                    event.params?.firebase_screen_class}
                </Text>
              </View>
            ) : null}

            <View style={cardStyles.chip}>
              <Text style={cardStyles.chipText}>
                {'{} '} {paramCount} params
              </Text>
            </View>

            {userPropCount > 0 && (
              <View style={cardStyles.chip}>
                <Text style={cardStyles.chipText}>★ {userPropCount} props</Text>
              </View>
            )}
          </View>

          {/* Inline Mini Graph for E-commerce Items */}
          {(() => {
            const items = event.params?.items;
            if (!Array.isArray(items) || items.length === 0) return null;

            const prices = items
              .map((item: any) => parseFloat(item.price || item.value))
              .filter(p => !isNaN(p));

            if (prices.length === 0) return null;
            const max = Math.max(...prices);
            if (max === 0) return null;

            return (
              <View style={cardStyles.miniGraphWrapper}>
                {prices.map((val, idx) => {
                  const hPct = (val / max) * 100;
                  return (
                    <View
                      key={idx}
                      style={[
                        cardStyles.miniGraphBar,
                        {
                          height: `${Math.max(15, hPct)}%`,
                          backgroundColor: color,
                        },
                      ]}
                    />
                  );
                })}
              </View>
            );
          })()}
        </View>
      </TouchableScale>
    </View>
  );
});

// ─── Styles ───────────────────────────────────────────────────────────────────

const cardStyles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 4,
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
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    padding: 12,
    shadowColor: '#000',
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
    marginBottom: 8,
  },
  nameBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
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
    backgroundColor: '#FFE44D',
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
    paddingHorizontal: 6,
    paddingVertical: 3,
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
    backgroundColor: '#FFE4E6',
    borderColor: '#FCC2D7',
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  duplicateText: {
    fontFamily: AppFonts.interBold,
    fontSize: 9,
    color: '#E11D48',
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
