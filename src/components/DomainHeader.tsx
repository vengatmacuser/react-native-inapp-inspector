import React, {useEffect, useRef} from 'react';
import {Animated, Pressable, View, Text} from 'react-native';

// Stylesheet
import {AppColors} from '../styles/AppColors';

// Helpers
import {formatDateTime} from '../helpers';

// Assets
import {
  ChevronIcon,
  ScreenIcon,
  CheckIcon,
  FailIcon,
  ClockIcon,
} from './NetworkIcons';

// Stylesheet
import styles from '../styles';

// Type Definition
import {LocalFilter} from '../types';

const DomainHeader = ({
  pageName,
  color,
  stats,
  activeFilters,
  onToggleFilter,
  isCollapsed,
  onToggleCollapse,
  isFirst,
  timestamp,
}: {
  pageName: string;
  color: string;
  stats: {success: number; failed: number; loading: number};
  activeFilters: Set<LocalFilter>;
  onToggleFilter: (pageName: string, filter: LocalFilter) => void;
  isCollapsed: boolean;
  onToggleCollapse: (pageName: string) => void;
  isFirst: boolean;
  timestamp: number;
}) => {
  const chevronAnim = useRef(new Animated.Value(isCollapsed ? 0 : 1)).current;
  useEffect(() => {
    Animated.timing(chevronAnim, {
      toValue: isCollapsed ? 0 : 1,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [isCollapsed]);

  const chevronRotate = chevronAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['-90deg', '0deg'],
  });

  const visibleStats = ['success', 'failed', 'loading'];

  return (
    <Pressable
      style={[styles.domainHeaderRow, !isFirst && styles.domainHeaderSeparator]}
      onPress={() => onToggleCollapse(pageName)}>
      <View style={styles.domainHeaderLeft}>
        <Animated.View style={{transform: [{rotate: chevronRotate}]}}>
          <ChevronIcon color={AppColors.grayTextWeak} size={14} />
        </Animated.View>
        <ScreenIcon color={color} size={16} />
        <View style={{flex: 1, marginLeft: 6, justifyContent: 'center'}}>
          <Text
            style={[styles.domainHeaderText, {color, marginLeft: 0}]}
            numberOfLines={1}>
            {pageName}
          </Text>
          <View style={styles.domainSubRow}>
            <Text style={styles.domainTimestamp}>
              {formatDateTime(timestamp)}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.domainStatsGroup}>
        {visibleStats.map((type, index) => {
          const isLast = index === visibleStats.length - 1;
          const isActive = activeFilters.has(type as LocalFilter);

          let IconComponent;
          let activeColor = '';
          let count = 0;
          let bgStyle = {};

          if (type === 'success') {
            IconComponent = CheckIcon;
            activeColor = AppColors.greenColor;
            count = stats.success;
            bgStyle = {
              backgroundColor: isActive
                ? `${AppColors.greenColor}15`
                : 'transparent',
            };
          } else if (type === 'failed') {
            IconComponent = FailIcon;
            activeColor = AppColors.errorColor;
            count = stats.failed;
            bgStyle = {
              backgroundColor: isActive
                ? `${AppColors.errorColor}15`
                : 'transparent',
            };
          } else {
            IconComponent = ClockIcon;
            activeColor = AppColors.darkOrange;
            count = stats.loading;
            bgStyle = {
              backgroundColor: isActive
                ? `${AppColors.darkOrange}15`
                : 'transparent',
            };
          }

          return (
            <Pressable
              key={type}
              onPress={() => onToggleFilter(pageName, type as LocalFilter)}
              style={[
                styles.groupBtnItem,
                bgStyle,
                !isLast && styles.groupBtnBorderRight,
              ]}>
              <IconComponent
                color={isActive ? activeColor : AppColors.grayTextWeak}
                size={type === 'failed' ? 8 : 10}
              />
              <Text
                style={[
                  styles.domainStatText,
                  {color: isActive ? activeColor : AppColors.grayTextWeak},
                ]}>
                {count}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </Pressable>
  );
};

export default DomainHeader;
