import React, {useCallback, useState} from 'react';
import {StyleProp, Text, ViewStyle} from 'react-native';
import TouchableScale from './TouchableScale';
import {ShareIcon, CheckIcon} from './NetworkIcons';
import {triggerNativeHaptic} from '../native/NativeInspector';
import {AppColors} from '../styles/AppColors';
import styles from '../styles';

export interface ShareButtonProps {
  onShare: () => void | Promise<void>;
  label?: string;
  style?: StyleProp<ViewStyle>;
  color?: string;
  size?: number;
}

const ShareButton = React.memo(({
  onShare,
  label,
  style,
  color = AppColors.brandPurple,
  size = 14,
}: ShareButtonProps) => {
  const [shared, setShared] = useState<boolean>(false);

  const handlePress = useCallback(async () => {
    try {
      triggerNativeHaptic('medium');
      await onShare();
      setShared(true);
      setTimeout(() => setShared(false), 1200);
    } catch {}
  }, [onShare]);

  const containerStyle = [
    styles.iconSquareBtn,
    {
      backgroundColor: `${color}14`,
      borderColor: `${color}30`,
    },
    shared && styles.iconSquareBtnSuccess,
    style,
  ];

  return (
    <TouchableScale
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={`Share ${label}`}
      accessibilityHint={`Opens native share sheet to export ${label}`}
      style={containerStyle}
      onPress={handlePress}
      hitSlop={8}>
      {shared ? (
        <CheckIcon color={AppColors.greenColor} size={size} strokeWidth={2.4} />
      ) : (
        <ShareIcon color={color} size={size} />
      )}
      {label ? (
        <Text
          style={[
            styles.iconSquareBtnText,
            {color: shared ? AppColors.greenColor : color},
          ]}>
          {shared ? 'Shared' : label}
        </Text>
      ) : null}
    </TouchableScale>
  );
});

ShareButton.displayName = 'ShareButton';

export default ShareButton;
