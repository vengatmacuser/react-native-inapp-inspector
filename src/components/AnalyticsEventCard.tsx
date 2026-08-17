import React, {useEffect, useRef} from 'react';
import {Animated, StyleSheet, Text, View} from 'react-native';
import {AppColors} from '../styles/AppColors';
import {AppFonts} from '../styles/AppFonts';
import {AnalyticsEventCardProps} from '../types';
import {
  formatGap,
  formatTime,
  getEventColor,
  getEventCategory,
  getCategoryColors,
} from '../helpers';
import {useTranslation} from '../i18n';
import HighlightText from './HighlightText';
import TouchableScale from './TouchableScale';
import {CartIcon, MoneyIcon} from './NetworkIcons';

// ─── Component ────────────────────────────────────────────────────────────────

const AnalyticsEventCard = React.memo(function AnalyticsEventCard({
  event,
  onPress,
  isNew = false,
  searchStr = '',
  msSincePrev,
  computedScreenName,
}: AnalyticsEventCardProps) {
  const {t} = useTranslation();
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
          <Text style={[cardStyles.gapText, {color: AppColors.grayTextWeak}]}>
            {formatGap(msSincePrev)}
          </Text>
        </View>
      )}

      {/* ── Main Card ─────────────────────────────────────────────────────── */}
      <TouchableScale
        onPress={onPress}
        style={[
          cardStyles.modernCard,
          {
            backgroundColor: AppColors.primaryLight,
            borderColor: AppColors.grayBorderSecondary,
          },
        ]}>
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
              const catKey = getEventCategory(event.name);
              const tagColors = getCategoryColors(catKey);
              const categoryLabel =
                catKey === 'page_view'
                  ? t('analytics.pageViewCategory')
                  : catKey === 'ecommerce'
                  ? t('analytics.ecommerceCategory')
                  : catKey === 'system'
                  ? t('analytics.systemCategory')
                  : t('analytics.customCategory');
              return (
                <View
                  style={[
                    cardStyles.categoryBadge,
                    {backgroundColor: tagColors.bg, borderColor: tagColors.border},
                  ]}>
                  <Text
                    style={[cardStyles.categoryText, {color: tagColors.text}]}>
                    {categoryLabel}
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
                  {event.count}×
                  {event.count > 1 ? ` ${t('analytics.duplicate')}` : ''}
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
              const screenNameStr =
                typeof rawScreenName === 'object'
                  ? JSON.stringify(rawScreenName)
                  : String(rawScreenName);
              return (
                <View
                  style={[
                    cardStyles.chip,
                    {
                      backgroundColor: AppColors.grayBackground,
                      borderColor: AppColors.grayBorderSecondary,
                    },
                  ]}>
                  <View
                    style={[cardStyles.screenDot, {backgroundColor: color}]}
                  />
                  <Text
                    style={[cardStyles.chipText, {color: AppColors.grayText}]}
                    numberOfLines={1}>
                    {screenNameStr}
                  </Text>
                </View>
              );
            })()}

            <View
              style={[
                cardStyles.chip,
                {
                  backgroundColor: AppColors.grayBackground,
                  borderColor: AppColors.grayBorderSecondary,
                },
              ]}>
              <Text style={[cardStyles.chipText, {color: AppColors.grayText}]}>
                {'{} '} {paramCount} {t('analytics.params')}
              </Text>
            </View>

            {userPropCount > 0 && (
              <View
                style={[
                  cardStyles.chip,
                  {
                    backgroundColor: AppColors.grayBackground,
                    borderColor: AppColors.grayBorderSecondary,
                  },
                ]}>
                <Text
                  style={[cardStyles.chipText, {color: AppColors.grayText}]}>
                  ★ {userPropCount} {t('analytics.props')}
                </Text>
              </View>
            )}

            {(() => {
              const items = event.params?.items;
              if (Array.isArray(items) && items.length > 0) {
                return (
                  <View
                    style={[
                      cardStyles.chip,
                      {
                        backgroundColor: AppColors.amberBg,
                        borderColor: AppColors.amberBorder,
                      },
                    ]}>
                    <CartIcon color={AppColors.amber700} size={12} />
                    <Text
                      style={[
                        cardStyles.chipText,
                        {
                          color: AppColors.amber700,
                          fontFamily: AppFonts.interBold,
                        },
                      ]}>
                      {items.length}{' '}
                      {items.length === 1
                        ? t('analytics.item')
                        : t('analytics.items')}
                    </Text>
                  </View>
                );
              }
              return null;
            })()}

            {(() => {
              const val = event.params?.value ?? event.params?.price;
              const currency = event.params?.currency ?? '';
              const isPrimitive =
                typeof val === 'string' || typeof val === 'number';
              if (isPrimitive) {
                const currencyStr =
                  typeof currency === 'string' || typeof currency === 'number'
                    ? String(currency)
                    : '';
                return (
                  <View
                    style={[
                      cardStyles.chip,
                      {
                        backgroundColor: AppColors.emeraldBg,
                        borderColor: AppColors.emeraldBorder,
                      },
                    ]}>
                    <MoneyIcon color={AppColors.emerald600} size={12} />
                    <Text
                      style={[
                        cardStyles.chipText,
                        {
                          color: AppColors.emerald600,
                          fontFamily: AppFonts.interBold,
                        },
                      ]}>
                      {String(val)} {currencyStr}
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
