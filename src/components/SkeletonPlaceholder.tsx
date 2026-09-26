import React, {useEffect, useRef} from 'react';
import {Animated, StyleSheet, View} from 'react-native';
import {AppColors} from '../styles/AppColors';
import {ActiveTab} from '../types';

export interface SkeletonPlaceholderProps {
  tab?: ActiveTab;
  type?: 'card' | 'detail' | 'list' | 'table';
  cardCount?: number;
}

export const SkeletonPlaceholder = React.memo(function SkeletonPlaceholder({
  tab = 'apis',
  type = 'card',
  cardCount = 4,
}: SkeletonPlaceholderProps) {
  const shimmerAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 0.95,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0.4,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [shimmerAnim]);

  // ─── Detail View Skeleton ───
  if (type === 'detail') {
    return (
      <View
        style={skeletonStyles.container}
        accessible={true}
        accessibilityRole="progressbar"
        accessibilityLabel="Loading details, please wait"
        accessibilityLiveRegion="polite">
        <Animated.View style={[skeletonStyles.detailHeader, {opacity: shimmerAnim}]} />
        <View style={skeletonStyles.chipStripSkeleton}>
          <Animated.View style={[skeletonStyles.chipSkeleton, {width: 70, opacity: shimmerAnim}]} />
          <Animated.View style={[skeletonStyles.chipSkeleton, {width: 90, opacity: shimmerAnim}]} />
          <Animated.View style={[skeletonStyles.chipSkeleton, {width: 80, opacity: shimmerAnim}]} />
        </View>
        <Animated.View style={[skeletonStyles.detailCodeCard, {opacity: shimmerAnim}]}>
          <View style={[skeletonStyles.urlLineLong, {width: '85%'}]} />
          <View style={[skeletonStyles.urlLineLong, {width: '70%', marginTop: 8}]} />
          <View style={[skeletonStyles.urlLineLong, {width: '92%', marginTop: 8}]} />
          <View style={[skeletonStyles.urlLineLong, {width: '60%', marginTop: 8}]} />
          <View style={[skeletonStyles.urlLineLong, {width: '78%', marginTop: 8}]} />
        </Animated.View>
      </View>
    );
  }

  // ─── Media Gallery Tab Grid Skeleton ───
  if (tab === 'media') {
    return (
      <View
        style={skeletonStyles.container}
        accessible={true}
        accessibilityRole="progressbar"
        accessibilityLabel="Loading media gallery, please wait"
        accessibilityLiveRegion="polite">
        <View style={skeletonStyles.mediaGrid}>
          {Array.from({length: 6}).map((_, i) => (
            <Animated.View
              key={`skeleton_media_${i}`}
              style={[skeletonStyles.mediaTile, {opacity: shimmerAnim}]}
            />
          ))}
        </View>
      </View>
    );
  }

  // ─── Performance Tab Skeleton ───
  if (tab === 'perf') {
    return (
      <View
        style={skeletonStyles.container}
        accessible={true}
        accessibilityRole="progressbar"
        accessibilityLabel="Loading performance diagnostics, please wait"
        accessibilityLiveRegion="polite">
        <Animated.View style={[skeletonStyles.heroCard, {opacity: shimmerAnim}]}>
          <View style={skeletonStyles.cardTopRow}>
            <View style={skeletonStyles.timeSkeleton} />
            <View style={skeletonStyles.statusBadgeSkeleton} />
          </View>
          <View style={[skeletonStyles.urlLineLong, {height: 32, marginTop: 12}]} />
        </Animated.View>
        <Animated.View style={[skeletonStyles.cardSkeleton, {opacity: shimmerAnim}]}>
          <View style={[skeletonStyles.urlLineLong, {width: '40%'}]} />
          <View style={[skeletonStyles.urlLineShort, {marginTop: 10}]} />
          <View style={[skeletonStyles.urlLineLong, {marginTop: 8}]} />
        </Animated.View>
      </View>
    );
  }

  // ─── Standard List Tabs (apis, logs, crash, push, socket, redux, storage, device) ───
  return (
    <View
      style={skeletonStyles.container}
      accessible={true}
      accessibilityRole="progressbar"
      accessibilityLabel={`Loading ${tab} data, please wait`}
      accessibilityLiveRegion="polite">
      {/* ─── Search & Scope Toolbar Skeleton ─── */}
      <View style={skeletonStyles.toolbarSkeleton}>
        <Animated.View
          style={[skeletonStyles.searchBarSkeleton, {opacity: shimmerAnim}]}
        />
        <View style={skeletonStyles.actionButtonsRow}>
          <Animated.View
            style={[skeletonStyles.iconButtonSkeleton, {opacity: shimmerAnim}]}
          />
          <Animated.View
            style={[skeletonStyles.iconButtonSkeleton, {opacity: shimmerAnim}]}
          />
        </View>
      </View>

      {/* ─── Quick Filter Chips Skeleton Strip ─── */}
      <View style={skeletonStyles.chipStripSkeleton}>
        <Animated.View
          style={[skeletonStyles.chipSkeleton, {width: 48, opacity: shimmerAnim}]}
        />
        <Animated.View
          style={[skeletonStyles.chipSkeleton, {width: 68, opacity: shimmerAnim}]}
        />
        <Animated.View
          style={[skeletonStyles.chipSkeleton, {width: 76, opacity: shimmerAnim}]}
        />
        <Animated.View
          style={[skeletonStyles.chipSkeleton, {width: 58, opacity: shimmerAnim}]}
        />
      </View>

      {/* ─── List Cards Skeleton (Tab-Adaptive Layout) ─── */}
      {Array.from({length: cardCount}).map((_, i) => (
        <Animated.View
          key={`skeleton_card_${i}`}
          style={[skeletonStyles.cardSkeleton, {opacity: shimmerAnim}]}>
          {/* Top row */}
          <View style={skeletonStyles.cardTopRow}>
            <View style={skeletonStyles.badgeGroup}>
              <View style={skeletonStyles.statusBadgeSkeleton} />
              <View style={skeletonStyles.methodBadgeSkeleton} />
            </View>
            <View style={skeletonStyles.timeSkeleton} />
          </View>

          {/* Middle row */}
          <View style={skeletonStyles.urlLineLong} />
          <View style={skeletonStyles.urlLineShort} />

          {/* Bottom row */}
          <View style={skeletonStyles.cardBottomRow}>
            <View style={skeletonStyles.metaPillSkeleton} />
            <View style={skeletonStyles.metaPillSkeleton} />
          </View>
        </Animated.View>
      ))}
    </View>
  );
});

const skeletonStyles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  toolbarSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  searchBarSkeleton: {
    flex: 1,
    height: 36,
    borderRadius: 8,
    backgroundColor: AppColors.graySurface,
    borderWidth: 1,
    borderColor: AppColors.dividerColor,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  iconButtonSkeleton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: AppColors.graySurface,
    borderWidth: 1,
    borderColor: AppColors.dividerColor,
  },
  chipStripSkeleton: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
  },
  chipSkeleton: {
    height: 24,
    borderRadius: 6,
    backgroundColor: AppColors.graySurface,
    borderWidth: 1,
    borderColor: AppColors.dividerColor,
  },
  cardSkeleton: {
    backgroundColor: AppColors.primaryLight,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: AppColors.dividerColor,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  badgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusBadgeSkeleton: {
    width: 38,
    height: 18,
    borderRadius: 4,
    backgroundColor: AppColors.slate200,
  },
  methodBadgeSkeleton: {
    width: 44,
    height: 18,
    borderRadius: 4,
    backgroundColor: AppColors.slate200,
  },
  timeSkeleton: {
    width: 48,
    height: 12,
    borderRadius: 4,
    backgroundColor: AppColors.slate200,
  },
  urlLineLong: {
    height: 13,
    borderRadius: 4,
    backgroundColor: AppColors.slate200,
    marginBottom: 5,
    width: '90%',
  },
  urlLineShort: {
    height: 11,
    borderRadius: 4,
    backgroundColor: AppColors.slate200,
    marginBottom: 8,
    width: '55%',
  },
  cardBottomRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
  },
  metaPillSkeleton: {
    width: 52,
    height: 14,
    borderRadius: 4,
    backgroundColor: AppColors.slate200,
  },
  heroCard: {
    backgroundColor: AppColors.primaryLight,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: AppColors.dividerColor,
  },
  detailHeader: {
    height: 48,
    borderRadius: 8,
    backgroundColor: AppColors.graySurface,
    marginBottom: 12,
  },
  detailCodeCard: {
    flex: 1,
    backgroundColor: AppColors.primaryLight,
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: AppColors.dividerColor,
  },
  mediaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  mediaTile: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: 8,
    backgroundColor: AppColors.graySurface,
    borderWidth: 1,
    borderColor: AppColors.dividerColor,
  },
});

export default SkeletonPlaceholder;
