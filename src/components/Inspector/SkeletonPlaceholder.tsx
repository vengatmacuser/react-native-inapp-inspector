import React, {useEffect, useRef} from 'react';
import {Animated, StyleSheet, View} from 'react-native';
import {AppColors} from '../../styles/AppColors';

export interface SkeletonPlaceholderProps {
  cardCount?: number;
}

export const SkeletonPlaceholder = React.memo(function SkeletonPlaceholder({
  cardCount = 4,
}: SkeletonPlaceholderProps) {
  const shimmerAnim = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 0.85,
          duration: 750,
          useNativeDriver: false,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0.35,
          duration: 750,
          useNativeDriver: false,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [shimmerAnim]);

  return (
    <View style={skeletonStyles.container}>
      {/* ─── Search & Scope Toolbar Skeleton ─── */}
      <View style={skeletonStyles.toolbarSkeleton}>
        <Animated.View
          style={[
            skeletonStyles.searchBarSkeleton,
            {opacity: shimmerAnim},
          ]}
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

      {/* ─── List Cards Skeleton ─── */}
      {Array.from({length: cardCount}).map((_, i) => (
        <Animated.View
          key={`skeleton_card_${i}`}
          style={[skeletonStyles.cardSkeleton, {opacity: shimmerAnim}]}>
          {/* Top row: Status pill + Method + Time */}
          <View style={skeletonStyles.cardTopRow}>
            <View style={skeletonStyles.badgeGroup}>
              <View style={skeletonStyles.statusBadgeSkeleton} />
              <View style={skeletonStyles.methodBadgeSkeleton} />
            </View>
            <View style={skeletonStyles.timeSkeleton} />
          </View>

          {/* Middle row: URL lines */}
          <View style={skeletonStyles.urlLineLong} />
          <View style={skeletonStyles.urlLineShort} />

          {/* Bottom row: Latency & Size */}
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
    backgroundColor: AppColors.graySurface,
  },
  methodBadgeSkeleton: {
    width: 44,
    height: 18,
    borderRadius: 4,
    backgroundColor: AppColors.graySurface,
  },
  timeSkeleton: {
    width: 48,
    height: 12,
    borderRadius: 4,
    backgroundColor: AppColors.graySurface,
  },
  urlLineLong: {
    height: 13,
    borderRadius: 4,
    backgroundColor: AppColors.graySurface,
    marginBottom: 5,
    width: '90%',
  },
  urlLineShort: {
    height: 11,
    borderRadius: 4,
    backgroundColor: AppColors.graySurface,
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
    backgroundColor: AppColors.graySurface,
  },
});

export default SkeletonPlaceholder;
