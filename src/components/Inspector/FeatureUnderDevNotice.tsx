import React, {useState} from 'react';
import {StyleSheet, Text, View, Pressable} from 'react-native';
import {AppColors} from '../../styles/AppColors';
import {AppFonts} from '../../styles/AppFonts';
import {WarningTriangleIcon, SparkleIcon, ClearIcon} from '../NetworkIcons';

interface FeatureUnderDevNoticeProps {
  featureName?: string;
  compact?: boolean;
}

export const FeatureUnderDevNotice: React.FC<FeatureUnderDevNoticeProps> = ({
  featureName,
  compact = false,
}) => {
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) return null;

  return (
    <View style={[styles.container, compact && styles.containerCompact]}>
      <View style={styles.contentRow}>
        <View style={styles.badgeWrap}>
          <WarningTriangleIcon color={AppColors.warningIconGold} size={12} />
          <Text style={styles.badgeText}>IN ACTIVE DEVELOPMENT</Text>
        </View>

        <Pressable
          onPress={() => setIsDismissed(true)}
          hitSlop={8}
          style={styles.dismissBtn}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Dismiss notice">
          <ClearIcon color={AppColors.grayTextWeak} size={11} />
        </Pressable>
      </View>

      <Text style={styles.messageText}>
        {featureName ? `${featureName} is` : 'This module is'} currently in active
        development. Results and metrics may vary in accuracy. We are continuously
        improving this feature for upcoming releases.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 12,
    marginTop: 8,
    marginBottom: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: `${AppColors.warningIconGold}12`,
    borderWidth: 1,
    borderColor: `${AppColors.warningIconGold}30`,
  },
  containerCompact: {
    marginTop: 4,
    marginBottom: 4,
    paddingVertical: 7,
    paddingHorizontal: 10,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  badgeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4.5,
  },
  badgeText: {
    fontFamily: AppFonts.interBold,
    fontSize: 9.5,
    color: AppColors.warningIconGold,
    letterSpacing: 0.4,
  },
  dismissBtn: {
    padding: 2,
  },
  messageText: {
    fontFamily: AppFonts.interRegular,
    fontSize: 10.5,
    color: AppColors.grayText,
    lineHeight: 15,
  },
});

export default FeatureUnderDevNotice;
