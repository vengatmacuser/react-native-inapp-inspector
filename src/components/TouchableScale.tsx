import React, {useRef} from 'react';
import {Animated, Pressable, PressableProps} from 'react-native';
import {triggerNativeHaptic} from '../native/NativeInspector';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

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
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (disabled) return;
    if (enableHaptics) {
      triggerNativeHaptic('light');
    }
    Animated.parallel([
      Animated.timing(scale, {
        toValue: 0.94,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0.85,
        duration: 50,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.timing(scale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  return (
    <AnimatedPressable
      accessible={accessible}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={accessibilityState}
      accessibilityValue={accessibilityValue}
      disabled={disabled}
      style={[style, {opacity, transform: [{scale}]}]}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
      onLongPress={onLongPress}
      hitSlop={hitSlop}
      {...rest}>
      {children}
    </AnimatedPressable>
  );
});

export default TouchableScale;
