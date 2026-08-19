import {Method} from '../types';
import React, {useEffect, useRef} from 'react';
import {
  Alert,
  Animated,
  Linking,
  View,
  Pressable,
  Text,
  StyleSheet,
} from 'react-native';
import Svg, {Path} from 'react-native-svg';
import {AppColors} from '../styles/AppColors';
import {METHOD_COLORS} from '../constants';
import {
  getStatusColor,
  getDurationColor,
  formatDateTime,
  getSize,
} from '../helpers';
import {CalendarIcon, ClockIcon, SizeIcon} from './NetworkIcons';
import {AppFonts} from '../styles/AppFonts';
import styles from '../styles';
import {LogCardProps} from '../types';
import HighlightText from './HighlightText';
import TouchableScale from './TouchableScale';
import {useTranslation} from '../i18n';

const LogCard = React.memo(function LogCard({
  item,
  onPress,
  timelineMinStart,
  timelineTotalRange,
  isNew,
  isSelected,
  onToggleSelect,
  searchStr,
}: LogCardProps) {
  const {t} = useTranslation();
  const methodColor = METHOD_COLORS[item.method as Method] ?? METHOD_COLORS.ALL;

  const handleOpenUrl = (e?: any) => {
    e?.stopPropagation?.();
    Alert.alert(
      t('common.openInBrowser') || 'Open in Browser',
      `${t('common.openInBrowserPrompt') || 'Are you sure you want to open this URL in your external browser?'}\n\n${item.url}`,
      [
        {text: t('common.cancel') || 'Cancel', style: 'cancel'},
        {
          text: t('common.open') || 'Open',
          onPress: () => {
            Linking.canOpenURL(item.url)
              .then(supported => {
                if (supported) {
                  Linking.openURL(item.url);
                } else {
                  Linking.openURL(item.url).catch(() => {});
                }
              })
              .catch(() => {});
          },
        },
      ],
    );
  };

  const isFailed =
    item.status === 0 || (item.status != null && item.status >= 400);
  const isLoading = item.status == null;
  const statusColor = getStatusColor(item.status);
  const durationColor = getDurationColor(item.duration);

  const cardStatusColor = isLoading
    ? AppColors.darkOrange
    : isFailed
    ? AppColors.errorColor
    : AppColors.greenColor;

  const leftPercent =
    timelineTotalRange > 0
      ? ((item.startTime - timelineMinStart) / timelineTotalRange) * 100
      : 0;
  const widthPercent =
    timelineTotalRange > 0
      ? ((item.duration || 10) / timelineTotalRange) * 100
      : 100;

  const shimmerOpacity = useRef(new Animated.Value(isNew ? 0.35 : 0)).current;
  useEffect(() => {
    if (isNew) {
      Animated.timing(shimmerOpacity, {
        toValue: 0,
        duration: 1200,
        useNativeDriver: true,
      }).start();
    }
  }, [isNew]);

  const triggeredAt = formatDateTime(item.startTime);
  const isJson = item.url.split('?')[0].toLowerCase().endsWith('.json');

  return (
    <TouchableScale
      onPress={onPress}
      style={[
        styles.card,
        {
          borderLeftWidth: 3.5,
          borderLeftColor: cardStatusColor,
        },
      ]}>
      <View style={styles.cardBody}>
        {/* Row 1: Header (Checkbox, Serial, Method Badge, Client Tag, Status Pill) */}
        <View style={styles.cardHeaderRow}>
          <View style={styles.cardHeaderLeft}>
            <Pressable
              onPress={() => onToggleSelect(item.id)}
              hitSlop={12}
              style={[
                styles.smallCheckbox,
                isSelected && styles.smallCheckboxChecked,
              ]}>
              {isSelected && (
                <Svg width={9} height={9} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M20 6L9 17l-5-5"
                    stroke={AppColors.white}
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              )}
            </Pressable>

            <Text style={styles.serialNumber}>#{item.id + 1}</Text>

            <View
              style={[styles.methodBadge, {backgroundColor: methodColor}]}>
              <Text style={[styles.methodBadgeText, {color: AppColors.white}]}>
                {item.method}
              </Text>
            </View>

            {item.client && (
              <View
                style={[
                  styles.chip,
                  {
                    backgroundColor:
                      item.client === 'axios'
                        ? `${AppColors.purple}14`
                        : item.client === 'apollo' || item.client === 'graphql'
                        ? `${AppColors.pink500}14`
                        : item.client === 'xhr'
                        ? `${AppColors.amber500}14`
                        : `${AppColors.sky500}14`,
                    borderColor:
                      item.client === 'axios'
                        ? `${AppColors.purple}30`
                        : item.client === 'apollo' || item.client === 'graphql'
                        ? `${AppColors.pink500}30`
                        : item.client === 'xhr'
                        ? `${AppColors.amber500}30`
                        : `${AppColors.sky500}30`,
                    paddingHorizontal: 4.5,
                    paddingVertical: 1,
                    borderRadius: 4,
                  },
                ]}>
                <Text
                  style={[
                    styles.chipText,
                    {
                      fontFamily: AppFonts.interBold,
                      fontSize: 8.5,
                      color:
                        item.client === 'axios'
                          ? AppColors.purple
                          : item.client === 'apollo' || item.client === 'graphql'
                          ? AppColors.pink500
                          : item.client === 'xhr'
                          ? AppColors.amber700
                          : AppColors.sky600,
                    },
                  ]}>
                  {item.client.toUpperCase()}
                </Text>
              </View>
            )}

            {/* Protocol / HTTPS Badge */}
            <View
              style={[
                styles.chip,
                {
                  backgroundColor: item.url.toLowerCase().startsWith('https')
                    ? '#ECFDF5'
                    : '#FFFBEB',
                  borderColor: item.url.toLowerCase().startsWith('https')
                    ? '#A7F3D0'
                    : '#FDE68A',
                  paddingHorizontal: 4,
                  paddingVertical: 1,
                  borderRadius: 4,
                },
              ]}>
              <Text
                style={[
                  styles.chipText,
                  {
                    fontFamily: AppFonts.interBold,
                    fontSize: 8,
                    color: item.url.toLowerCase().startsWith('https')
                      ? '#059669'
                      : '#D97706',
                  },
                ]}>
                {item.url.toLowerCase().startsWith('https') ? 'HTTPS' : 'HTTP'}
              </Text>
            </View>

            {/* GraphQL Indicator */}
            {(item.url.toLowerCase().includes('graphql') ||
              item.client === 'apollo' ||
              item.client === 'graphql') && (
              <View
                style={[
                  styles.chip,
                  {
                    backgroundColor: '#FDF2F8',
                    borderColor: '#FBCFE8',
                    paddingHorizontal: 4,
                    paddingVertical: 1,
                    borderRadius: 4,
                  },
                ]}>
                <Text
                  style={[
                    styles.chipText,
                    {
                      fontFamily: AppFonts.interBold,
                      fontSize: 8,
                      color: '#DB2777',
                    },
                  ]}>
                  GQL
                </Text>
              </View>
            )}

            {/* In-Line Duration / Latency Pill */}
            {item.duration != null && !isFailed && (
              <View
                style={[
                  styles.chip,
                  {
                    backgroundColor: `${durationColor}12`,
                    borderColor: `${durationColor}2E`,
                    paddingHorizontal: 4.5,
                    paddingVertical: 1,
                    borderRadius: 4,
                  },
                ]}>
                <Text
                  style={[
                    styles.chipText,
                    {
                      fontFamily: AppFonts.interBold,
                      fontSize: 8.5,
                      color: durationColor,
                    },
                  ]}>
                  {item.duration}ms
                </Text>
              </View>
            )}
          </View>

          <View
            style={[
              styles.statusPill,
              {
                backgroundColor: isFailed
                  ? `${AppColors.errorColor}15`
                  : isLoading
                  ? `${AppColors.darkOrange}15`
                  : `${statusColor}15`,
                borderColor: isFailed
                  ? `${AppColors.errorColor}30`
                  : isLoading
                  ? `${AppColors.darkOrange}30`
                  : `${statusColor}30`,
              },
            ]}>
            <Text
              style={[
                styles.statusPillText,
                {
                  color: isFailed
                    ? AppColors.errorColor
                    : isLoading
                    ? AppColors.darkOrange
                    : statusColor,
                },
              ]}>
              {isLoading
                ? '...'
                : isFailed
                ? (item.status ? `${item.status}` : t('network.statusFailed'))
                : item.status}
            </Text>
          </View>
        </View>

        {/* Row 2: Full URL Capsule Container (Clickable with link prompt) */}
        <View style={styles.cardSlugBox}>
          <Pressable
            onPress={handleOpenUrl}
            style={styles.slugLeft}
            hitSlop={6}>
            <Text style={styles.slugTag}>URL ↗</Text>
            <HighlightText
              text={item.url}
              search={searchStr}
              style={[styles.slugText, {color: AppColors.skyBlue, textDecorationLine: 'underline'}]}
              highlightStyle={styles.highlight}
              numberOfLines={2}
              ellipsizeMode="middle"
            />
          </Pressable>

          <View style={styles.slugRight}>
            {isJson && (
              <View
                style={[
                  styles.chip,
                  {
                    backgroundColor: `${AppColors.darkOrange}12`,
                    borderColor: `${AppColors.darkOrange}28`,
                  },
                ]}>
                <Text style={[styles.chipText, {color: AppColors.darkOrange}]}>
                  .json
                </Text>
              </View>
            )}

            {item.duplicateCount != null && item.duplicateCount > 1 && (
              <View
                style={[
                  styles.chip,
                  {
                    backgroundColor: `${AppColors.purple}12`,
                    borderColor: `${AppColors.purple}28`,
                  },
                ]}>
                <Text
                  style={[
                    styles.chipText,
                    {color: AppColors.purple, fontWeight: '700'},
                  ]}>
                  ×{item.duplicateCount}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Row 3: Footer (Timestamp on Left, Response Size & Duration on Right) */}
        <View style={styles.cardFooterRow}>
          <View style={styles.cardDateRow}>
            <CalendarIcon color={AppColors.grayTextWeak} size={10} />
            <Text style={styles.cardDateText}>{triggeredAt}</Text>
          </View>

          <View style={styles.cardFooterRight}>
            {item.response != null && (
              <View
                style={[
                  styles.chip,
                  {
                    backgroundColor: `${AppColors.purple}12`,
                    borderColor: `${AppColors.purple}2E`,
                  },
                ]}>
                <SizeIcon color={AppColors.purple} size={9} />
                <Text
                  style={[
                    styles.chipText,
                    {color: AppColors.purple, fontSize: 9.5},
                  ]}>
                  {getSize(item.response)}
                </Text>
              </View>
            )}

            {item.duration != null && !isFailed && (
              <View
                style={[
                  styles.chip,
                  {
                    backgroundColor: `${durationColor}15`,
                    borderColor: `${durationColor}30`,
                  },
                ]}>
                <ClockIcon color={durationColor} size={9} />
                <Text style={[styles.chipText, {color: durationColor, fontSize: 9.5}]}>
                  {item.duration}ms
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          {backgroundColor: methodColor, opacity: shimmerOpacity},
        ]}
      />
    </TouchableScale>
  );
});

export default LogCard;
