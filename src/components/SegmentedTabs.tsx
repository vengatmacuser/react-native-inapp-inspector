import React from 'react';
import {Pressable, ScrollView, Text, View, ViewStyle} from 'react-native';
import {AppColors} from '../styles/AppColors';
import {AppFonts} from '../styles/AppFonts';

export interface SegmentedTab {
  key: string;
  label: string;
  themeColor?: string;
  color?: string;
  icon?: (isActive: boolean, themeColor?: string) => React.ReactNode;
}

interface SegmentedTabsProps {
  tabs: SegmentedTab[];
  activeKey: string;
  onChange: (key: string) => void;
  style?: ViewStyle | ViewStyle[];
  scrollable?: boolean;
}

export const DEFAULT_INNER_TAB_THEMES: Record<string, string> = {
  // Network / API detail
  metadata: AppColors.sky600,
  headers: AppColors.teal600,
  request: AppColors.amber600,
  response: AppColors.brandPurple,
  req: AppColors.amber600,
  res: AppColors.brandPurple,

  // Console / Log detail
  output: AppColors.teal600,
  arguments: AppColors.amber600,
  stack: AppColors.errorColor,
  caller: AppColors.sky600,
  error: AppColors.errorColor,
  app: AppColors.green600,
  all: AppColors.brandPurple,

  // Redux detail
  live: AppColors.violet600,
  timeline: AppColors.orange600,
  persisted: AppColors.teal600,
  payload: AppColors.violet600,
  diff: AppColors.green600,
  raw: AppColors.brandPurple,

  // Crash detail
  diagnostics: AppColors.amber600,
  breadcrumbs: AppColors.orange600,

  // Analytics detail
  overview: AppColors.sky600,
  json: AppColors.brandPurple,
  tree: AppColors.violet600,

  // Push detail
  preview: AppColors.brandPurple,
  delivery: AppColors.amber600,
  domainAttrs: AppColors.sky600,

  // JSON viewer
  pretty: AppColors.violet600,
  table: AppColors.teal600,

  // Device / Storage / Generic
  production: AppColors.brandPurple,
  files: AppColors.teal600,
  packages: AppColors.orange600,
  media: AppColors.pink600,
  optimizer: AppColors.violet600,
  hardware: AppColors.orange600,
  network: AppColors.teal600,
  display: AppColors.pink600,
  runtime: AppColors.amber600,
  security: AppColors.errorColor,
  fatal: AppColors.errorColor,
  promise: AppColors.orange600,
  render: AppColors.pink600,
  native: AppColors.cyan600,
  js: AppColors.amber600,
  asyncStorage: AppColors.brandPurple,
  mmkv: AppColors.teal600,
};

const SegmentedTabs = React.memo(
  ({tabs, activeKey, onChange, style, scrollable}: SegmentedTabsProps & {scrollable?: boolean}) => {
    const content = tabs.map(tab => {
      const isActive = activeKey === tab.key;
      const tabThemeColor =
        tab.themeColor ||
        tab.color ||
        DEFAULT_INNER_TAB_THEMES[tab.key] ||
        AppColors.brandPurple;

      return (
        <Pressable
          key={tab.key}
          onPress={() => onChange(tab.key)}
          style={({pressed}) => [
            {
              flex: scrollable ? undefined : 1,
              paddingVertical: 7,
              paddingHorizontal: scrollable ? 12 : 6,
              borderRadius: 7,
              backgroundColor: isActive ? tabThemeColor : 'transparent',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4.5,
              flexDirection: 'row',
              opacity: pressed ? 0.8 : 1,
            },
            isActive && {
              shadowColor: tabThemeColor,
              shadowOffset: {width: 0, height: 1},
              shadowOpacity: 0.28,
              shadowRadius: 3,
              elevation: 2,
            },
          ]}>
          {tab.icon
            ? typeof tab.icon === 'function'
              ? tab.icon(isActive, tabThemeColor)
              : tab.icon
            : null}
          <Text
            numberOfLines={1}
            style={{
              fontFamily: AppFonts.interBold,
              fontSize: 10.5,
              color: isActive ? AppColors.white : AppColors.grayText,
              letterSpacing: 0.2,
            }}>
            {tab.label}
          </Text>
        </Pressable>
      );
    });

    if (scrollable) {
      return (
        <View
          style={[
            {
              borderRadius: 10,
              backgroundColor: `${AppColors.slate200}80`,
              padding: 3,
              borderWidth: 1,
              borderColor: AppColors.dividerColor,
            },
            style,
          ]}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
            }}>
            {content}
          </ScrollView>
        </View>
      );
    }

    return (
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
        {content}
      </View>
    );
  },
);

export default SegmentedTabs;