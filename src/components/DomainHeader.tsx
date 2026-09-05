import React from 'react';
import {Pressable, View, Text} from 'react-native';

// Stylesheet
import {AppColors} from '../styles/AppColors';
import {AppFonts} from '../styles/AppFonts';

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

  const visibleStats = ['success', 'failed', 'loading'];

  const total = stats.success + stats.failed + stats.loading;
  const pctSuccess =
    total > 0 ? Math.round((stats.success / total) * 100) : 0;
  const pctFailed =
    total > 0 ? Math.round((stats.failed / total) * 100) : 0;
  const pctLoading =
    total > 0 ? Math.round((stats.loading / total) * 100) : 0;

  return (
    <Pressable
      style={[
        styles.domainHeaderCard,
        !isCollapsed && styles.domainHeaderCardExpanded,
      ]}
      onPress={() => onToggleCollapse(pageName)}>
      <View style={styles.domainHeaderTopRow}>
        <View style={styles.domainHeaderLeft}>
          <View style={{transform: [{rotate: isCollapsed ? '-90deg' : '0deg'}], flexShrink: 0}}>
            <ChevronIcon color={AppColors.grayTextWeak} size={13} />
          </View>
          <View style={[styles.domainIconWrap, {backgroundColor: `${color}18`, flexShrink: 0}]}>
            <ScreenIcon color={color} size={14} />
          </View>
          <View style={{flex: 1, justifyContent: 'center', minWidth: 0}}>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 6, minWidth: 0}}>
              <Text
                style={[styles.domainTitleText, {flexShrink: 1}]}
                numberOfLines={1}
                ellipsizeMode="tail">
                {pageName}
              </Text>
              {total > 0 && (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4,
                    backgroundColor:
                      stats.failed > 0
                        ? AppColors.red100
                        : stats.loading > 0
                        ? AppColors.amber100
                        : AppColors.emerald100,
                    paddingHorizontal: 5,
                    paddingVertical: 1.5,
                    borderRadius: 4,
                    flexShrink: 0,
                  }}>
                  <View
                    style={{
                      width: 22,
                      height: 3.5,
                      borderRadius: 2,
                      backgroundColor: AppColors.gray200,
                      flexDirection: 'row',
                      overflow: 'hidden',
                    }}>
                    {pctSuccess > 0 && (
                      <View
                        style={{
                          width: `${pctSuccess}%`,
                          height: '100%',
                          backgroundColor: AppColors.emerald500,
                        }}
                      />
                    )}
                    {pctFailed > 0 && (
                      <View
                        style={{
                          width: `${pctFailed}%`,
                          height: '100%',
                          backgroundColor: AppColors.red500,
                        }}
                      />
                    )}
                    {pctLoading > 0 && (
                      <View
                        style={{
                          width: `${pctLoading}%`,
                          height: '100%',
                          backgroundColor: AppColors.amber500,
                        }}
                      />
                    )}
                  </View>
                  <Text
                    style={{
                      fontFamily: AppFonts.interBold,
                      fontSize: 8.5,
                      color:
                        stats.failed > 0
                          ? AppColors.redErrorText
                          : stats.loading > 0
                          ? AppColors.amber800Warm
                          : AppColors.emerald700,
                    }}>
                    {pctSuccess}%
                  </Text>
                </View>
              )}
            </View>
            <Text style={styles.domainSummaryText} numberOfLines={1} ellipsizeMode="tail">
              {formatDateTime(timestamp)}
            </Text>
          </View>
        </View>

        <View style={styles.domainStatsGroup}>
          {visibleStats.map(type => {
            const isActive = activeFilters.has(type as LocalFilter);

            let IconComponent;
            let activeColor = '';
            let count = 0;

            if (type === 'success') {
              IconComponent = CheckIcon;
              activeColor = AppColors.greenColor;
              count = stats.success;
            } else if (type === 'failed') {
              IconComponent = FailIcon;
              activeColor = AppColors.errorColor;
              count = stats.failed;
            } else {
              IconComponent = ClockIcon;
              activeColor = AppColors.darkOrange;
              count = stats.loading;
            }

            return (
              <Pressable
                key={type}
                onPress={() => onToggleFilter(pageName, type as LocalFilter)}
                hitSlop={6}
                style={[
                  styles.domainStatPill,
                  isActive && {
                    borderColor: `${activeColor}40`,
                    backgroundColor: `${activeColor}12`,
                  },
                ]}>
                <View
                  style={[
                    styles.filterCheckbox,
                    {marginRight: 0, width: 11, height: 11, borderRadius: 2.5},
                    isActive && [
                      styles.filterCheckboxActive,
                      {backgroundColor: activeColor},
                    ],
                  ]}>
                  {isActive && (
                    <CheckIcon color={AppColors.white} size={7} />
                  )}
                </View>
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
      </View>
    </Pressable>
  );
};

export default DomainHeader;
