import React from 'react';
import {Pressable, Text, View, ViewStyle} from 'react-native';
import {AppColors} from '../styles/AppColors';
import {AppFonts} from '../styles/AppFonts';

export interface SegmentedTab {
  key: string;
  label: string;
  icon?: (isActive: boolean) => React.ReactNode;
}

interface SegmentedTabsProps {
  tabs: SegmentedTab[];
  activeKey: string;
  onChange: (key: string) => void;
  style?: ViewStyle | ViewStyle[];
}

const SegmentedTabs = ({tabs, activeKey, onChange, style}: SegmentedTabsProps) => (
  <View
    style={[
      {
        flexDirection: 'row',
        borderRadius: 8,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: AppColors.dividerColor,
        backgroundColor: AppColors.primaryLight,
      },
      style,
    ]}>
    {tabs.map((tab, index) => {
      const isActive = activeKey === tab.key;
      return (
        <Pressable
          key={tab.key}
          onPress={() => onChange(tab.key)}
          style={{
            flex: 1,
            paddingVertical: 8,
            paddingHorizontal: 8,
            backgroundColor: isActive
              ? AppColors.brandPurple
              : AppColors.primaryLight,
            borderRightWidth: index < tabs.length - 1 ? 1 : 0,
            borderRightColor: AppColors.dividerColor,
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
            flexDirection: 'row',
          }}>
          {tab.icon ? tab.icon(isActive) : null}
          <Text
            style={{
              fontFamily: AppFonts.interBold,
              fontSize: 10,
              color: isActive
                ? AppColors.white
                : AppColors.grayTextWeak,
              textTransform: 'capitalize',
              letterSpacing: 0.3,
            }}>
            {tab.label}
          </Text>
        </Pressable>
      );
    })}
  </View>
);

export default SegmentedTabs;