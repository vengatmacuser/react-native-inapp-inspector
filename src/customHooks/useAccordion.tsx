import {useCallback, useRef, useState} from 'react';
import {Animated} from 'react-native';

const useAccordion = (
  initialOpen = false,
  maxBodyHeight = 1200,
  duration = 280,
) => {
  const [isOpen, setIsOpen] = useState(initialOpen);
  const animVal = useRef(new Animated.Value(initialOpen ? 1 : 0)).current;

  const toggleOpen = useCallback(() => {
    const next = !isOpen;
    setIsOpen(next);
    Animated.timing(animVal, {
      toValue: next ? 1 : 0,
      duration,
      useNativeDriver: false,
    }).start();
  }, [isOpen, animVal, duration]);

  const forceOpen = useCallback(
    (open: boolean) => {
      setIsOpen(open);
      Animated.timing(animVal, {
        toValue: open ? 1 : 0,
        duration,
        useNativeDriver: false,
      }).start();
    },
    [animVal, duration],
  );

  const chevronStyle = {
    transform: [
      {
        rotate: animVal.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', '180deg'],
        }),
      },
    ],
  };

  const bodyStyle = {
    maxHeight: animVal.interpolate({
      inputRange: [0, 1],
      outputRange: [0, maxBodyHeight],
    }),
    overflow: 'hidden' as const,
    opacity: animVal.interpolate({
      inputRange: [0, 0.4, 1],
      outputRange: [0, 0.7, 1],
    }),
  };

  return {isOpen, toggleOpen, forceOpen, chevronStyle, bodyStyle};
};

export default useAccordion;
