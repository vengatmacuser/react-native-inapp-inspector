import React, {useEffect, useRef} from 'react';
import {Animated, ViewStyle} from 'react-native';

interface AnimatedEntranceProps {
  children: React.ReactNode;
  delay?: number;
  distance?: number;
  duration?: number;
  index?: number;
  style?: ViewStyle | ViewStyle[];
}

const AnimatedEntrance = ({
  children,
  delay = 0,
  distance = 10,
  duration = 220,
  index = 0,
  style,
}: AnimatedEntranceProps) => {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    progress.setValue(0);
    Animated.timing(progress, {
      toValue: 1,
      duration,
      delay: delay + Math.min(index, 12) * 18,
      useNativeDriver: true,
    }).start();
  }, [delay, duration, index, progress]);

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
};

export default AnimatedEntrance;
