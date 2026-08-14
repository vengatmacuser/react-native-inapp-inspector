import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {AppColors} from '../styles/AppColors';
import {AppFonts} from '../styles/AppFonts';
import {CheckIcon} from './NetworkIcons';

interface EndOfListFooterProps {
  count?: number;
  label?: string;
  message?: string;
}

export const EndOfListFooter: React.FC<EndOfListFooterProps> = ({
  count,
  label,
  message = "You've reached the end of the list",
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.dividerLine} />
      <View style={styles.badgePill}>
        <View style={styles.iconCircle}>
          <CheckIcon color={AppColors.purple} size={8} />
        </View>
        <Text style={styles.messageText}>{message}</Text>
        {count != null && count > 0 && (
          <View style={styles.countBadge}>
            <Text style={styles.countText}>
              {count} {label ? (count === 1 ? label.replace(/s$/, '') : label) : ''}
            </Text>
          </View>
        )}
      </View>
      <View style={styles.dividerLine} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 28,
    gap: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: AppColors.dividerColor,
    opacity: 0.7,
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
