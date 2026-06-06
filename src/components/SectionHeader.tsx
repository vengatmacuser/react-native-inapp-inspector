import React, {useRef, useEffect} from 'react';
import {Animated, View, Pressable, Text} from 'react-native';

// Stylesheet
import {AppColors} from '../styles/AppColors';

// Components
import CopyButton from './CopyButton';
import TouchableScale from './TouchableScale';

// Assets
import {
  RequestIcon,
  ResponseIcon,
  HeadersIcon,
  DiffIcon,
  ChevronIcon,
} from './NetworkIcons';

// Stylesheet
import styles from '../styles';

// Type Definition
import {SectionHeaderProps} from '../types';

const SectionHeader = ({
  title,
  value,
  expanded,
  onToggleExpand,
  showDiff,
  isDiffing,
  onToggleDiff,
}: SectionHeaderProps) => {
  const isOpen = expanded === undefined ? false : !!expanded;
  const chevronAnim = useRef(new Animated.Value(isOpen ? 1 : 0)).current;
  useEffect(() => {
    Animated.timing(chevronAnim, {
      toValue: isOpen ? 1 : 0,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [isOpen]);
  const chevronRotate = chevronAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  return (
    <View style={styles.sectionHeaderGradient}>
      <View style={styles.sectionHeaderRow}>
        <Pressable
          style={styles.sectionTitleRow}
          onPress={onToggleExpand}
          hitSlop={12}>
          {title === 'Request' || title === 'API' ? (
            <RequestIcon color={AppColors.offerPurple} />
          ) : title === 'Response' ? (
            <ResponseIcon color={AppColors.greenColor} />
          ) : (
            <HeadersIcon color={AppColors.skyBlue} />
          )}
          <Text style={styles.sectionTitle}>{title}</Text>
        </Pressable>
        <View style={styles.sectionHeaderActions}>
          {showDiff && (
            <TouchableScale
              onPress={onToggleDiff}
              hitSlop={12}
              style={[
                styles.iconSquareBtn,
                isDiffing ? styles.iconSquareBtnActive : null,
              ]}>
              <DiffIcon
                color={isDiffing ? AppColors.skyBlue : AppColors.grayTextWeak}
                size={14}
              />
            </TouchableScale>
          )}
          <CopyButton value={value} label={title} />
          <TouchableScale
            onPress={onToggleExpand}
            hitSlop={12}
            style={styles.iconSquareBtn}>
            <Animated.View style={{transform: [{rotate: chevronRotate}]}}>
              <ChevronIcon color={AppColors.grayTextStrong} size={14} />
            </Animated.View>
          </TouchableScale>
        </View>
      </View>
    </View>
  );
};

export default SectionHeader;
