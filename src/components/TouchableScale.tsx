import React, {useRef} from 'react';
import {Animated, Pressable, PressableProps, StyleSheet, Platform} from 'react-native';

export interface TouchableScaleProps extends PressableProps {
  onPress?: () => void;
  onLongPress?: () => void;
  style?: any;
  children?: React.ReactNode;
  hitSlop?: any;
  disabled?: boolean;
}

const TouchableScale = React.memo(function TouchableScale({
  onPress,
  onLongPress,
  style,
  children,
  hitSlop,
  disabled,
  accessible,
  accessibilityRole,
  accessibilityLabel,
  accessibilityHint,
  accessibilityState,
  accessibilityValue,
  ...rest
}: TouchableScaleProps) {
  if (Platform.OS === 'android') {
    return (
      <Pressable
        accessible={accessible}
        accessibilityRole={accessibilityRole}
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        accessibilityState={accessibilityState}
        accessibilityValue={accessibilityValue}
        disabled={disabled}
        onPress={onPress}
        onLongPress={onLongPress}
        hitSlop={hitSlop}
        style={({pressed}) => [
          style,
          {opacity: pressed ? 0.75 : 1},
        ]}
        {...rest}>
        {children}
      </Pressable>
    );
  }

  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  const animatePress = (pressed: boolean) => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: pressed ? 0.94 : 1,
        friction: 6,
        tension: 120,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: pressed ? 0.86 : 1,
        duration: pressed ? 90 : 140,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const flattenedStyle = StyleSheet.flatten(style) || {};
  const layoutStyle = {
    flex: flattenedStyle.flex,
    flexDirection: flattenedStyle.flexDirection,
    alignItems: flattenedStyle.alignItems,
    justifyContent: flattenedStyle.justifyContent,
    flexWrap: flattenedStyle.flexWrap,
    alignSelf: flattenedStyle.alignSelf,
    flexGrow: flattenedStyle.flexGrow,
    flexShrink: flattenedStyle.flexShrink,
    gap: flattenedStyle.gap,
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
      style={style}
      onPressIn={() => animatePress(true)}
      onPressOut={() => animatePress(false)}
      onPress={onPress}
      onLongPress={onLongPress}
      hitSlop={hitSlop}
      {...rest}>
      <Animated.View style={[{opacity, transform: [{scale}]}, layoutStyle]}>
        {children}
      </Animated.View>
    </Pressable>
  );
});

export default TouchableScale;
