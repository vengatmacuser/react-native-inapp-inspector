import React, {useState, useEffect, useRef} from 'react';
import {Animated, StyleSheet, Text, View, Platform} from 'react-native';
import {subscribeToast} from '../helpers/toast';
import {CheckIcon} from './NetworkIcons';
import {AppColors} from '../styles/AppColors';
import {AppFonts} from '../styles/AppFonts';

const Toast = React.memo(() => {
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(20)).current;
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToast((message: string) => {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }

      setToastMessage(message);

      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.spring(translateYAnim, {
          toValue: 0,
          tension: 80,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();

      hideTimerRef.current = setTimeout(() => {
        Animated.parallel([
          Animated.timing(opacityAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(translateYAnim, {
            toValue: 20,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start(() => {
          setToastMessage(null);
        });
      }, 2000);
    });

    return () => {
      unsubscribe();
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }
    };
  }, [opacityAnim, translateYAnim]);

  if (!toastMessage) {
    return null;
  }

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.toastContainer,
        {
          opacity: opacityAnim,
          transform: [{translateY: translateYAnim}],
        },
      ]}>
      <View style={styles.toastCard}>
        <View style={styles.iconCircle}>
          <CheckIcon color={AppColors.white} size={11} />
        </View>
        <Text style={styles.toastText} numberOfLines={2}>
          {toastMessage}
        </Text>
      </View>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 44 : 28,
    left: 20,
    right: 20,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999999,
  },
  toastCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.toastBg,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 24,
    shadowColor: AppColors.black,
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 8,
    borderWidth: 1,
    borderColor: AppColors.toastBorder,
    maxWidth: '90%',
    gap: 9,
  },
  iconCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: AppColors.greenColor,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toastText: {
    color: AppColors.white,
    fontFamily: AppFonts.interBold,
    fontSize: 12.5,
    letterSpacing: -0.1,
  },
});

export default Toast;
