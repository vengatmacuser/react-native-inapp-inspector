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
import {
  CartIcon,
  MoneyIcon,
  GlobeIcon,
  BoltIcon,
  SparkleIcon,
  ClockIcon,
} from './NetworkIcons';

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

  const catKey = getEventCategory(event.name);
  const tagColors = getCategoryColors(catKey);

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

  const categoryLabel =
    catKey === 'page_view'
      ? t('analytics.pageViewCategory')
      : catKey === 'ecommerce'
      ? t('analytics.ecommerceCategory')
      : catKey === 'system'
      ? t('analytics.systemCategory')
      : t('analytics.customCategory');

  return (
    <View style={cardStyles.container}>
      {/* ── Gap Indicator ─────────────────────────────────────────────────── */}
      {showGap && (
        <View style={cardStyles.gapContainer}>
          <View style={cardStyles.gapLine} />
          <Text style={[cardStyles.gapText, {color: AppColors.grayTextWeak}]}>
            +{formatGap(msSincePrev)}
          </Text>
          <View style={cardStyles.gapLine} />
        </View>
      )}

      {/* ── Main Card ─────────────────────────────────────────────────────── */}
      <TouchableScale
        onPress={onPress}
        style={[
          cardStyles.modernCard,
          {
            borderLeftWidth: 3.5,
            borderLeftColor: tagColors.text,
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

        {/* Top Row: Icon Badge, Event Name, Category Badge & Timestamp */}
        <View style={cardStyles.cardHeader}>
          <View style={{flexDirection: 'row', alignItems: 'center', gap: 7, flex: 1}}>
            {/* Category Icon Badge */}
            <View
              style={[
                cardStyles.iconBadge,
                {backgroundColor: tagColors.bg, borderColor: tagColors.border},
              ]}>
              {catKey === 'ecommerce' ? (
                <CartIcon color={tagColors.text} size={12} />
              ) : catKey === 'page_view' ? (
                <GlobeIcon color={tagColors.text} size={12} />
              ) : catKey === 'system' ? (
                <BoltIcon color={tagColors.text} size={12} />
              ) : (
                <SparkleIcon color={tagColors.text} size={12} />
              )}
            </View>

            {/* Event Name */}
            <HighlightText
              text={event.name}
              search={searchStr}
              style={[cardStyles.eventName, {color: AppColors.primaryBlack}]}
              highlightStyle={cardStyles.highlight}
              numberOfLines={1}
            />

            {/* Category Pill Tag */}
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

            {/* Duplicate Multiplier */}
            {event.count !== undefined && event.count > 0 ? (
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
                </Text>
              </View>
            ) : null}
          </View>

          {/* Timestamp */}
          <View style={{flexDirection: 'row', alignItems: 'center', gap: 3}}>
            <ClockIcon color={AppColors.grayTextWeak} size={10} />
            <Text style={[cardStyles.timestamp, {color: AppColors.grayTextWeak}]}>
              {formatTime(event.timestamp)}
            </Text>
          </View>
        </View>

        {/* Bottom Row: Metadata Chips (Screen, Params, Value) */}
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
                      backgroundColor: `${AppColors.amber500}12`,
                      borderColor: `${AppColors.amber500}2E`,
                    },
                  ]}>
                  <View
                    style={[cardStyles.screenDot, {backgroundColor: AppColors.amber500}]}
                  />
                  <Text
                    style={[cardStyles.chipText, {color: AppColors.amber700, fontFamily: AppFonts.interBold}]}
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
                    backgroundColor: `${AppColors.brandPurple}10`,
                    borderColor: `${AppColors.brandPurple}25`,
                  },
                ]}>
                <SparkleIcon color={AppColors.brandPurple} size={10} />
                <Text
                  style={[cardStyles.chipText, {color: AppColors.brandPurple, fontFamily: AppFonts.interBold}]}>
                  {userPropCount} {t('analytics.props')}
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
                    <CartIcon color={AppColors.amber700} size={11} />
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
              if (val != null && isPrimitive && String(val).trim() !== '') {
                const currencyStr =
                  typeof currency === 'string' && currency.trim() !== ''
                    ? currency.toUpperCase()
                    : '';
                return (
                  <View
                    style={[
                      cardStyles.chip,
                      {
                        backgroundColor: `${AppColors.emerald500}15`,
                        borderColor: `${AppColors.emerald500}35`,
                      },
                    ]}>
                    <MoneyIcon color={AppColors.emerald600} size={11} />
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
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  gapContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 6,
    gap: 8,
  },
  gapLine: {
    flex: 1,
    height: 1,
    backgroundColor: `${AppColors.dividerColor}`,
  },
  gapText: {
    fontFamily: AppFonts.interBold,
    fontSize: 9.5,
    color: AppColors.grayTextWeak,
    letterSpacing: 0.5,
  },
  modernCard: {
    backgroundColor: AppColors.white,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: AppColors.dividerColor,
    padding: 10,
    shadowColor: AppColors.black,
    shadowOpacity: 0.03,
    shadowRadius: 3,
    shadowOffset: {width: 0, height: 1},
    elevation: 1,
    overflow: 'hidden',
    gap: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconBadge: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventName: {
    fontFamily: AppFonts.interBold,
    fontSize: 13,
    letterSpacing: 0.1,
    color: AppColors.primaryBlack,
  },
  timestamp: {
    fontFamily: AppFonts.interMedium,
    fontSize: 10,
    color: AppColors.grayTextWeak,
  },
  highlight: {
    backgroundColor: AppColors.yellowHighlight,
    color: AppColors.primaryBlack,
    borderRadius: 2,
  },
  cardBody: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    flex: 1,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2.5,
    borderRadius: 5,
    borderWidth: 1,
    gap: 3.5,
  },
  chipText: {
    fontFamily: AppFonts.interMedium,
    fontSize: 10,
    color: AppColors.grayText,
  },
  screenDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  duplicateBadge: {
    backgroundColor: AppColors.roseBg,
    borderColor: AppColors.roseBorder,
    borderWidth: 1,
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  duplicateText: {
    fontFamily: AppFonts.interBold,
    fontSize: 9,
    color: AppColors.rose600,
    textTransform: 'uppercase',
  },
  categoryBadge: {
    borderWidth: 1,
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  categoryText: {
    fontFamily: AppFonts.interBold,
    fontSize: 8.5,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
});

export default AnalyticsEventCard;
