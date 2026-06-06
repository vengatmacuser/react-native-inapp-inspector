import React, {useRef} from 'react';
import {Animated, Pressable} from 'react-native';

const TouchableScale = ({
  onPress,
  style,
  children,
  hitSlop,
  disabled,
}: {
  onPress?: () => void;
  style?: any;
  children: React.ReactNode;
  hitSlop?: any;
  disabled?: boolean;
}) => {
  const scale = useRef(new Animated.Value(1)).current;

  return (
    <Pressable
      disabled={disabled}
      style={style}
      onPressIn={() =>
        Animated.spring(scale, {toValue: 0.94, useNativeDriver: true}).start()
      }
      onPressOut={() =>
        Animated.spring(scale, {toValue: 1, useNativeDriver: true}).start()
      }
      onPress={onPress}
      hitSlop={hitSlop}>
      <Animated.View style={{transform: [{scale}]}}>{children}</Animated.View>
    </Pressable>
  );
};

export default TouchableScale;
