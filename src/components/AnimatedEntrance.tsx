import React, {useEffect, useRef} from 'react';
import {Animated, Platform, View, ViewStyle} from 'react-native';

interface AnimatedEntranceProps {
  children: React.ReactNode;
  delay?: number;
  distance?: number;
  duration?: number;
  index?: number;
  style?: ViewStyle | ViewStyle[];
}

const AnimatedEntrance = React.memo(function AnimatedEntrance({
  children,
  delay = 0,
  distance = 10,
  duration = 220,
  index = 0,
  style,
}: AnimatedEntranceProps) {
  if (Platform.OS === 'android') {
    return <View style={style}>{children}</View>;
  }

  const progress = useRef(new Animated.Value(0)).current;
  const initialIndex = useRef(index).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration,
      delay: delay + Math.min(initialIndex, 8) * 12,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: progress,
          transform: [
            {
              translateY: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [distance, 0],
              }),
            },
            {
              scale: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [0.985, 1],
              }),
            },
          ],
        },
      ]}>
      {children}
    </Animated.View>
  );
});

export default AnimatedEntrance;
