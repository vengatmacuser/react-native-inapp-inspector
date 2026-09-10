import React from 'react';
import {Platform, StyleSheet, Text, View} from 'react-native';
import {AppColors} from '../styles/AppColors';
import {AppFonts} from '../styles/AppFonts';
import {CheckIcon, ChevronIcon, PlusIcon} from './NetworkIcons';
import TouchableScale from './TouchableScale';
import {useTranslation} from '../i18n';

export interface EndOfListFooterProps {
  count?: number;
  totalCount?: number;
  label?: string;
  message?: string;
  hasMore?: boolean;
  onLoadMore?: () => void;
  loadMoreStep?: number;
}

export const EndOfListFooter: React.FC<EndOfListFooterProps> = React.memo(({
  count,
  totalCount,
  label = 'items',
  message,
  hasMore = false,
  onLoadMore,
  loadMoreStep = 10,
}) => {
  const {t} = useTranslation();
  const displayMessage = message ?? t('footer.endOfList', "You've reached the end of the list");

  const isMoreAvailable =
    hasMore ||
    (totalCount != null && count != null && count < totalCount && Boolean(onLoadMore));

  const remaining =
    totalCount != null && count != null ? Math.max(0, totalCount - count) : loadMoreStep;
  const nextStep = Math.min(remaining || loadMoreStep, loadMoreStep);

  if (isMoreAvailable && onLoadMore) {
    return (
      <View style={styles.container}>
        <View style={styles.dividerLine} />
        <View style={styles.loadMoreContainer}>
          <TouchableScale
            onPress={onLoadMore}
            hitSlop={6}
            style={styles.loadMoreBtn}>
            <View style={styles.loadMoreIconWrap}>
              <ChevronIcon color={AppColors.white} size={9} direction="down" />
            </View>
            <Text style={styles.loadMoreBtnText}>
              {t('footer.loadMore', {count: nextStep, defaultValue: `Load ${nextStep} More`})}
            </Text>
            {totalCount != null && count != null && (
              <View style={styles.loadMoreCountBadge}>
                <Text style={styles.loadMoreCountText}>
                  {count}/{totalCount}
                </Text>
              </View>
            )}
          </TouchableScale>
          {totalCount != null && count != null && (
            <Text style={styles.loadMoreSubtitle}>
              {t('footer.showingOf', {count, total: totalCount, label, defaultValue: `Showing ${count} of ${totalCount} ${label}`})}
            </Text>
          )}
        </View>
        <View style={styles.dividerLine} />
      </View>
    );
  }

  const displayCount = count ?? totalCount;

  return (
    <View style={styles.container}>
      <View style={styles.dividerLine} />
      <View style={styles.badgePill}>
        <View style={styles.iconCircle}>
          <CheckIcon color={AppColors.purple} size={8} />
        </View>
        <Text style={styles.messageText}>{displayMessage}</Text>
        {displayCount != null && displayCount > 0 && (
          <View style={styles.countBadge}>
            <Text style={styles.countText}>
              {displayCount}{' '}
              {label
                ? displayCount === 1
                  ? label.replace(/s$/, '')
                  : label
                : ''}
            </Text>
          </View>
        )}
      </View>
      <View style={styles.dividerLine} />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: Platform.OS === 'ios' ? 40 : 28,
    gap: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: AppColors.dividerColor,
    opacity: 0.7,
  },
  loadMoreContainer: {
    alignItems: 'center',
    gap: 5,
  },
  loadMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.brandPurple,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 6,
    shadowColor: AppColors.brandPurple,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  loadMoreIconWrap: {
    width: 15,
    height: 15,
    borderRadius: 7.5,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadMoreBtnText: {
    fontFamily: AppFonts.interBold,
    fontSize: 11,
    color: AppColors.white,
    letterSpacing: 0.2,
  },
  loadMoreCountBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 10,
  },
  loadMoreCountText: {
    fontFamily: AppFonts.interBold,
    fontSize: 9.5,
    color: AppColors.white,
  },
  loadMoreSubtitle: {
    fontFamily: AppFonts.interMedium,
    fontSize: 10,
    color: AppColors.grayTextWeak,
    letterSpacing: 0.1,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: AppColors.primaryLight,
    borderWidth: 1,
    borderColor: AppColors.grayBorderSecondary,
    shadowColor: AppColors.black,
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  iconCircle: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: `${AppColors.purple}18`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageText: {
    fontFamily: AppFonts.interMedium,
    fontSize: 11,
    color: AppColors.grayTextWeak,
    letterSpacing: 0.1,
  },
  countBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 6,
    backgroundColor: AppColors.grayBackground,
    borderWidth: 1,
    borderColor: AppColors.grayBorderSecondary,
  },
  countText: {
    fontFamily: AppFonts.interBold,
    fontSize: 9.5,
    color: AppColors.grayTextStrong,
  },
});

export default EndOfListFooter;
