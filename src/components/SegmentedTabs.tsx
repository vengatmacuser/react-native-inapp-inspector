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

const SegmentedTabs = React.memo(({tabs, activeKey, onChange, style}: SegmentedTabsProps) => (
  <View
    style={[
      {
        flexDirection: 'row',
        borderRadius: 10,
        backgroundColor: `${AppColors.slate200}80`,
        padding: 3,
        borderWidth: 1,
        borderColor: AppColors.dividerColor,
        gap: 3,
        minWidth: 0,
      },
      style,
    ]}>
    {tabs.map((tab) => {
      const isActive = activeKey === tab.key;
      return (
        <Pressable
          key={tab.key}
          onPress={() => onChange(tab.key)}
          style={({pressed}) => [
            {
              flex: 1,
              paddingVertical: 7,
              paddingHorizontal: 6,
              borderRadius: 7,
              backgroundColor: isActive
                ? AppColors.brandPurple
                : 'transparent',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4.5,
              flexDirection: 'row',
              opacity: pressed ? 0.8 : 1,
            },
            isActive && {
              shadowColor: AppColors.brandPurple,
              shadowOffset: {width: 0, height: 1},
              shadowOpacity: 0.25,
              shadowRadius: 3,
              elevation: 2,
            },
          ]}>
          {tab.icon ? tab.icon(isActive) : null}
          <Text
            numberOfLines={1}
            ellipsizeMode="tail"
            style={{
              flexShrink: 1,
              fontFamily: AppFonts.interBold,
              fontSize: 10.5,
              color: isActive
                ? AppColors.white
                : AppColors.grayText,
              letterSpacing: 0.2,
            }}>
            {tab.label}
          </Text>
        </Pressable>
      );
    })}
  </View>
));

export default SegmentedTabs;