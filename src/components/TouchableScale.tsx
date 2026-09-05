import React from 'react';
import {Pressable, PressableProps} from 'react-native';
import {triggerNativeHaptic} from '../native/NativeInspector';

export interface TouchableScaleProps extends PressableProps {
  onPress?: () => void;
  onLongPress?: () => void;
  style?: any;
  children?: React.ReactNode;
  hitSlop?: any;
  disabled?: boolean;
  enableHaptics?: boolean;
}

const TouchableScale = React.memo(function TouchableScale({
  onPress,
  onLongPress,
  style,
  children,
  hitSlop,
  disabled,
  enableHaptics = true,
  accessible,
  accessibilityRole,
  accessibilityLabel,
  accessibilityHint,
  accessibilityState,
  accessibilityValue,
  ...rest
}: TouchableScaleProps) {
  const handlePressIn = () => {
    if (disabled) return;
    if (enableHaptics) {
      triggerNativeHaptic('light');
    }
  };

  return (
    <Pressable
      accessible={accessible}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={accessibilityState}
      accessibilityValue={accessibilityValue}
      disabled={disabled}
      style={({pressed}) => [
        typeof style === 'function' ? style({pressed}) : style,
        pressed && !disabled && {opacity: 0.82, transform: [{scale: 0.96}]},
      ]}
      onPressIn={handlePressIn}
      onPress={onPress}
      onLongPress={onLongPress}
      hitSlop={hitSlop}
      {...rest}>
      {children}
    </Pressable>
  );
});

export default TouchableScale;
