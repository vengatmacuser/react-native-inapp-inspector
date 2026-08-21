import React, {useRef, useState, useCallback, useMemo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  PanResponder,
  LayoutChangeEvent,
  GestureResponderEvent,
  PanResponderGestureState,
} from 'react-native';
import {AppColors} from '../styles/AppColors';
import {AppFonts} from '../styles/AppFonts';
import TouchableScale from './TouchableScale';

export interface SliderProps {
  value: number;
  onValueChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  formatLabel?: (value: number) => string;
  quickPresets?: number[];
  disabled?: boolean;
}

export const Slider: React.FC<SliderProps> = React.memo(
  ({
    value,
    onValueChange,
    min = 50,
    max = 90,
    step = 5,
    formatLabel = val => `${Math.round(val)}%`,
    quickPresets = [50, 60, 70, 80, 90],
    disabled = false,
  }) => {
    const trackWidthRef = useRef<number>(0);
    const [trackWidth, setTrackWidth] = useState<number>(0);
    const [isDragging, setIsDragging] = useState<boolean>(false);

    const clampedValue = Math.max(min, Math.min(max, value));
    const percentage = (clampedValue - min) / (max - min || 1);

    const updateValueFromPosition = useCallback(
      (pageX: number, trackPageX: number) => {
        if (trackWidthRef.current <= 0) return;
        const relativeX = Math.max(
          0,
          Math.min(trackWidthRef.current, pageX - trackPageX),
        );
        const rawRatio = relativeX / trackWidthRef.current;
        let newValue = min + rawRatio * (max - min);

        if (step > 0) {
          newValue = Math.round(newValue / step) * step;
        }
        newValue = Math.max(min, Math.min(max, newValue));
        onValueChange(newValue);
      },
      [min, max, step, onValueChange],
    );

    const trackContainerRef = useRef<View>(null);
    const trackPageXRef = useRef<number>(0);

    const measureTrack = useCallback(() => {
      if (trackContainerRef.current) {
        trackContainerRef.current.measure((_x, _y, _width, _height, pageX) => {
          trackPageXRef.current = pageX;
        });
      }
    }, []);

    const panResponder = useMemo(
      () =>
        PanResponder.create({
          onStartShouldSetPanResponder: () => !disabled,
          onMoveShouldSetPanResponder: () => !disabled,
          onPanResponderGrant: (evt: GestureResponderEvent) => {
            setIsDragging(true);
            measureTrack();
            updateValueFromPosition(evt.nativeEvent.pageX, trackPageXRef.current);
          },
          onPanResponderMove: (
            evt: GestureResponderEvent,
            _gestureState: PanResponderGestureState,
          ) => {
            updateValueFromPosition(evt.nativeEvent.pageX, trackPageXRef.current);
          },
          onPanResponderRelease: () => {
            setIsDragging(false);
          },
          onPanResponderTerminate: () => {
            setIsDragging(false);
          },
        }),
      [disabled, measureTrack, updateValueFromPosition],
    );

    const handleLayout = (e: LayoutChangeEvent) => {
      const w = e.nativeEvent.layout.width;
      trackWidthRef.current = w;
      setTrackWidth(w);
      measureTrack();
    };

    const thumbPosition = percentage * (trackWidth || 0);

    return (
      <View style={styles.container}>
        {/* Value Display Row */}
        <View style={styles.valueRow}>
          <Text style={styles.rangeText}>{min}%</Text>
          <View
            style={[
              styles.currentValueBadge,
              isDragging && styles.currentValueBadgeActive,
            ]}>
            <Text style={styles.currentValueText}>{formatLabel(clampedValue)}</Text>
          </View>
          <Text style={styles.rangeText}>{max}%</Text>
        </View>

        {/* Interactive Track Area */}
        <View
          ref={trackContainerRef}
          onLayout={handleLayout}
          {...panResponder.panHandlers}
          style={styles.touchArea}>
          {/* Background Rail */}
          <View style={styles.rail}>
            {/* Active Filled Bar */}
            <View
              style={[
                styles.fillBar,
                {width: `${Math.round(percentage * 100)}%`},
              ]}
            />
          </View>

          {/* Draggable Thumb */}
          <View
            style={[
              styles.thumb,
              {
                left: Math.max(
                  0,
                  Math.min(
                    (trackWidth || 0) - 24,
                    thumbPosition - 12,
                  ),
                ),
              },
              isDragging && styles.thumbActive,
            ]}>
            <View style={styles.thumbCenterDot} />
          </View>
        </View>

        {/* Quick Presets */}
        {quickPresets && quickPresets.length > 0 && (
          <View style={styles.presetRow}>
            {quickPresets.map(preset => {
              const isSelected = Math.round(clampedValue) === preset;
              return (
                <TouchableScale
                  key={preset}
                  onPress={() => onValueChange(preset)}
                  style={[
                    styles.presetButton,
                    isSelected && styles.presetButtonActive,
                  ]}>
                  <Text
                    style={[
                      styles.presetText,
                      isSelected && styles.presetTextActive,
                    ]}>
                    {preset}%
                  </Text>
                </TouchableScale>
              );
            })}
          </View>
        )}
      </View>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    paddingVertical: 4,
    gap: 8,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  rangeText: {
    fontFamily: AppFonts.interMedium,
    fontSize: 11,
    color: AppColors.grayText,
  },
  currentValueBadge: {
    backgroundColor: `${AppColors.purple}1A`,
    borderColor: `${AppColors.purple}33`,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 2.5,
  },
  currentValueBadgeActive: {
    backgroundColor: AppColors.purple,
    borderColor: AppColors.purple,
    transform: [{scale: 1.05}],
  },
  currentValueText: {
    fontFamily: AppFonts.interBold,
    fontSize: 12,
    color: AppColors.purple,
  },
  touchArea: {
    height: 36,
    justifyContent: 'center',
    position: 'relative',
  },
  rail: {
    height: 8,
    backgroundColor: `${AppColors.grayTextWeak}2B`,
    borderRadius: 4,
    overflow: 'hidden',
    position: 'relative',
  },
  fillBar: {
    height: '100%',
    backgroundColor: AppColors.purple,
    borderRadius: 4,
  },
  thumb: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: AppColors.white,
    borderWidth: 2.5,
    borderColor: AppColors.purple,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: AppColors.black,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.18,
    shadowRadius: 3.5,
    elevation: 4,
  },
  thumbActive: {
    transform: [{scale: 1.15}],
    shadowOpacity: 0.28,
    shadowRadius: 5,
    elevation: 6,
    borderColor: AppColors.purple,
  },
  thumbCenterDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: AppColors.purple,
  },
  presetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 2,
  },
  presetButton: {
    flex: 1,
    paddingVertical: 5,
    borderRadius: 7,
    alignItems: 'center',
    backgroundColor: AppColors.grayBackground,
    borderWidth: 1,
    borderColor: AppColors.dividerColor,
  },
  presetButtonActive: {
    backgroundColor: `${AppColors.purple}20`,
    borderColor: AppColors.purple,
  },
  presetText: {
    fontFamily: AppFonts.interBold,
    fontSize: 10.5,
    color: AppColors.grayText,
  },
  presetTextActive: {
    color: AppColors.purple,
  },
});

export default Slider;
