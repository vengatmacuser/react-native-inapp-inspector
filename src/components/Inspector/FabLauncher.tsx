import React from 'react';
import {Animated, View} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useInspector} from './InspectorContext';
import TouchableScale from '../TouchableScale';
import BrandCircleIcon from '../BrandCircleIcon';
import {AppColors} from '../../styles/AppColors';
import styles from '../../styles';

const FabLauncher = () => {
  const {
    setVisible,
    fabPan,
    fabPanResponder,
    fabDraggedRef,
    pulseAnim,
    fabShineAnim,
    unreadPulseAnim,
    logs,
    analyticsEvents,
  } = useInspector();

  return (
    <Animated.View
      style={[styles.fabWrapper, {transform: fabPan.getTranslateTransform()}]}
      {...fabPanResponder.panHandlers}>
      <TouchableScale
        style={{alignItems: 'center', justifyContent: 'center'}}
        onPress={() => {
          if (fabDraggedRef.current) return;
          setVisible(true);
        }}
        hitSlop={10}>
        <Animated.View
          style={[styles.fabPulseRing, {transform: [{scale: pulseAnim}]}]}
        />
        <BrandCircleIcon size={62} />
        {/* #4 — shining sweep, clipped inside the circular launcher */}
        <View pointerEvents="none" style={styles.fabShineClip}>
          <Animated.View
            style={[
              styles.fabShineStreak,
              {
                transform: [
                  {
                    translateX: fabShineAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-48, 96],
                    }),
                  },
                  {rotate: '25deg'},
                ],
              },
            ]}>
            <LinearGradient
              colors={[
                `${AppColors.white}00`,
                `${AppColors.white}8C`,
                `${AppColors.white}00`,
              ]}
              start={{x: 0, y: 0.5}}
              end={{x: 1, y: 0.5}}
              style={{flex: 1}}
            />
          </Animated.View>
        </View>
        {(logs.length > 0 || analyticsEvents.length > 0) && (
          <Animated.View
            style={[
              styles.fabGreenDot,
              {transform: [{scale: unreadPulseAnim}]},
            ]}
          />
        )}
      </TouchableScale>
    </Animated.View>
  );
};

export default FabLauncher;
