import React from 'react';
import {View, ViewStyle} from 'react-native';

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
  style,
}: AnimatedEntranceProps) {
  return <View style={style}>{children}</View>;
});

export default AnimatedEntrance;
