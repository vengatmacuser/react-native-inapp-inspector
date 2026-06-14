import {Method} from '../types';
import React, {useEffect, useRef} from 'react';
import {Animated, View, Pressable, Text, StyleSheet} from 'react-native';
import Svg, {Path} from 'react-native-svg';
import {AppColors} from '../styles/AppColors';
import {METHOD_COLORS} from '../constants';
import {
  getStatusColor,
  getDurationColor,
  getPath,
  getBaseUrl,
  formatDateTime,
} from '../helpers';
import {CalendarIcon, ClockIcon} from './NetworkIcons';
import {AppFonts} from '../styles/AppFonts';
import styles from '../styles';
import {LogCardProps} from '../types';
import HighlightText from './HighlightText';
import TouchableScale from './TouchableScale';

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
  const methodColor = METHOD_COLORS[item.method as Method] ?? METHOD_COLORS.ALL;

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

  const path = getPath(item.url);
  const baseUrl = getBaseUrl(item.url) || item.url;
  const showPathRow = baseUrl !== item.url && path !== '/';
  const triggeredAt = formatDateTime(item.startTime);
  const isJson = item.url.split('?')[0].toLowerCase().endsWith('.json');

  return (
    <TouchableScale
      onPress={onPress}
      style={[
        styles.card,
        {
          borderLeftWidth: 4,
          borderLeftColor: cardStatusColor,
        },
      ]}>
      <View style={styles.cardBody}>
        <View style={styles.cardTopRow}>
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
                  stroke="#FFF"
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
            <Text style={[styles.methodBadgeText, {color: '#FFFFFF'}]}>
              {item.method}
            </Text>
          </View>

          <HighlightText
            text={baseUrl}
            search={searchStr}
            style={styles.urlPathText}
            highlightStyle={styles.highlight}
            numberOfLines={0}
          />

          {isJson && (
            <View
              style={[
                styles.chip,
                {
                  backgroundColor: `${AppColors.darkOrange}15`,
                  borderColor: `${AppColors.darkOrange}30`,
                  marginLeft: 6,
                },
              ]}>
              <Text style={[styles.chipText, {color: AppColors.darkOrange}]}>
                .json
              </Text>
            </View>
          )}

          {/* #9 — collapsed duplicate counter */}
          {item.duplicateCount != null && item.duplicateCount > 1 && (
            <View
              style={[
                styles.chip,
                {
                  backgroundColor: `${AppColors.purple}15`,
                  borderColor: `${AppColors.purple}30`,
                  marginLeft: 6,
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

        {showPathRow && (
          <View style={{flexDirection: 'row', alignItems: 'flex-start', marginTop: 3, marginBottom: 5, paddingLeft: 30, gap: 6}}>
            <Text style={{color: AppColors.grayTextWeak, fontSize: 9, fontFamily: AppFonts.interBold, letterSpacing: 0.5, marginTop: 2.5}}>PATH</Text>
            <HighlightText
              text={path}
              search={searchStr}
              style={{
                fontFamily: AppFonts.Sfprotext || 'System',
                fontSize: 12,
                color: AppColors.grayText,
                flex: 1,
              }}
              highlightStyle={styles.highlight}
              numberOfLines={0}
            />
          </View>
        )}

        <View style={styles.cardBottomRow}>
          <View style={styles.cardDateRow}>
            <CalendarIcon color={AppColors.grayTextWeak} size={11} />
            <Text style={styles.cardDateText}>{triggeredAt}</Text>
          </View>

          <View style={styles.cardMetaRow}>
            {item.duration != null && !isFailed && (
              <View
                style={[
                  styles.chip,
                  {
                    backgroundColor: `${durationColor}15`,
                    borderColor: `${durationColor}30`,
                  },
                ]}>
                <ClockIcon color={durationColor} size={10} />
                <Text style={[styles.chipText, {color: durationColor}]}>
                  {item.duration}ms
                </Text>
              </View>
            )}

            <View
              style={[
                styles.chip,
                {
                  backgroundColor: isFailed
                    ? `${AppColors.errorColor}15`
                    : `${statusColor}15`,
                  borderColor: isFailed
                    ? `${AppColors.errorColor}30`
                    : `${statusColor}30`,
                },
              ]}>
              <Text
                style={[
                  styles.chipText,
                  {color: isFailed ? AppColors.errorColor : statusColor},
                ]}>
                {isFailed ? 'Failed' : item.status}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.timelineTrack}>
          <View
            style={[
              styles.timelineBar,
              {
                left: `${Math.max(0, leftPercent)}%`,
                width: `${Math.min(100, widthPercent)}%`,
                backgroundColor: methodColor,
              },
            ]}
          />
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
