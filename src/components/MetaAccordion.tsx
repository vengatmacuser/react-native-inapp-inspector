import React from 'react';
import {View, Pressable, Text, Animated, Linking} from 'react-native';

// Constants
import {DURATION_FAST_MS, DURATION_SLOW_MS} from '../constants';

// Custom Hooks
import useAccordion from '../customHooks/useAccordion';

// Helpers
import {getDurationColor} from '../helpers';

// Assets
import {
  ChevronIcon,
  CalendarIcon,
  StatusIcon,
  ClockIcon,
  SizeIcon,
  TerminalIcon,
  GlobeIcon,
} from './NetworkIcons';

// Stylesheet
import {AppColors} from '../styles/AppColors';
import styles from '../styles';

// Type Definition
import {MetaAccordionProps} from '../types';
import {AppFonts} from '../styles/AppFonts';

const MetaAccordion = ({
  status,
  statusColor,
  duration,
  size,
  triggeredAt,
  method,
  contentType,
  url,
}: MetaAccordionProps) => {
  const {toggleOpen, chevronStyle, bodyStyle} = useAccordion(true, 400, 390);
  const isFailed = status === 0 || status == null;

  return (
    <View style={styles.metaContainer}>
      <Pressable onPress={toggleOpen} hitSlop={12}>
        <View style={styles.metaHeader}>
          <Text style={styles.metaTitle}>Metadata</Text>
          <Animated.View style={chevronStyle}>
            <ChevronIcon color={AppColors.grayTextWeak} size={14} />
          </Animated.View>
        </View>
      </Pressable>

      <Animated.View style={bodyStyle}>
        <View style={styles.metaBody}>
          <View style={styles.metaRow}>
            <View style={styles.metaLabelRow}>
              <CalendarIcon color={AppColors.grayTextWeak} size={14} />
              <Text style={styles.metaLabel}>Triggered At</Text>
            </View>
            <Text
              style={[
                styles.metaValue,
                {color: AppColors.purple, fontSize: 12},
              ]}>
              {triggeredAt}
            </Text>
          </View>
          <View style={styles.metaDivider} />

          <View style={styles.metaRow}>
            <View style={styles.metaLabelRow}>
              <TerminalIcon color={AppColors.grayTextWeak} size={14} />
              <Text style={styles.metaLabel}>Method</Text>
            </View>
            <View
              style={[
                styles.statusChip,
                {
                  borderColor: 'rgba(107, 78, 255, 0.25)',
                  backgroundColor: 'rgba(107, 78, 255, 0.08)',
                },
              ]}>
              <Text
                style={[
                  styles.statusText,
                  {color: AppColors.purple, fontFamily: AppFonts.interBold},
                ]}>
                {method || 'GET'}
              </Text>
            </View>
          </View>
          <View style={styles.metaDivider} />

          <View style={styles.metaRow}>
            <View style={styles.metaLabelRow}>
              <StatusIcon color={AppColors.grayTextWeak} />
              <Text style={styles.metaLabel}>Status</Text>
            </View>
            <View
              style={[
                styles.statusChip,
                {
                  borderColor: isFailed
                    ? `${AppColors.errorColor}40`
                    : `${statusColor}40`,
                  backgroundColor: isFailed
                    ? `${AppColors.errorColor}15`
                    : `${statusColor}15`,
                },
              ]}>
              <Text
                style={[
                  styles.statusText,
                  {color: isFailed ? AppColors.errorColor : statusColor},
                ]}>
                {isFailed ? 'Failed (Network Error)' : String(status)}
              </Text>
            </View>
          </View>
          <View style={styles.metaDivider} />

          <View style={styles.metaRow}>
            <View style={styles.metaLabelRow}>
              <GlobeIcon color={AppColors.grayTextWeak} size={14} />
              <Text style={styles.metaLabel}>Content Type</Text>
            </View>
            <Text style={styles.metaValue}>
              {contentType || 'application/json'}
            </Text>
          </View>
          <View style={styles.metaDivider} />

          <View style={styles.metaRow}>
            <View style={styles.metaLabelRow}>
              <ClockIcon color={AppColors.grayTextWeak} size={14} />
              <Text style={styles.metaLabel}>Duration</Text>
            </View>
            <View style={styles.metaValueRow}>
              {duration != null && !isFailed && (
                <View
                  style={[
                    styles.perfBadge,
                    {
                      backgroundColor: `${getDurationColor(duration)}15`,
                      borderColor: `${getDurationColor(duration)}40`,
                    },
                  ]}>
                  <Text
                    style={[
                      styles.perfBadgeText,
                      {color: getDurationColor(duration)},
                    ]}>
                    {duration < DURATION_FAST_MS
                      ? 'Fast'
                      : duration < DURATION_SLOW_MS
                      ? 'Moderate'
                      : 'Slow'}
                  </Text>
                </View>
              )}
              <Text style={styles.metaValue}>
                {duration != null ? `${duration} ms` : '—'}
              </Text>
            </View>
          </View>
          <View style={styles.metaDivider} />

          <View style={styles.metaRow}>
            <View style={styles.metaLabelRow}>
              <SizeIcon color={AppColors.grayTextWeak} />
              <Text style={styles.metaLabel}>Size</Text>
            </View>
            <Text style={styles.metaValue}>{size}</Text>
          </View>
          <View style={styles.metaDivider} />

          <View style={[styles.metaRow, {alignItems: 'flex-start'}]}>
            <View style={styles.metaLabelRow}>
              <GlobeIcon color={AppColors.grayTextWeak} size={14} />
              <Text style={styles.metaLabel}>Full URL</Text>
            </View>
            <Text
              selectable={true}
              numberOfLines={3}
              ellipsizeMode="tail"
              onPress={() => {
                if (url) {
                  Linking.openURL(url).catch(() => {});
                }
              }}
              style={[
                styles.metaValue,
                {
                  fontSize: 11.5,
                  color: url ? AppColors.purple : AppColors.grayTextWeak,
                  textDecorationLine: url ? 'underline' : 'none',
                  fontFamily: AppFonts.interMedium,
                  flex: 1,
                  textAlign: 'right',
                  lineHeight: 16,
                },
              ]}>
              {url || '—'}
            </Text>
          </View>
        </View>
      </Animated.View>
    </View>
  );
};

export default MetaAccordion;
