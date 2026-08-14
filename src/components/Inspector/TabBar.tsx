import React from 'react';
import {Animated, ScrollView, Text, View} from 'react-native';
import {useInspector} from './InspectorContext';
import TouchableScale from '../TouchableScale';
import styles from '../../styles';
import {AppColors} from '../../styles/AppColors';
import {
  SignalIcon,
  TerminalIcon,
  AnalyticsIcon,
  PackageIcon,
  ReduxIcon,
} from '../NetworkIcons';

const TabBar = React.memo(() => {
  const {
    activeTab,
    switchActiveTab,
    tabVisibility,
    logs,
    consoleLogs,
    analyticsEvents,
    lastReadApisCount,
    lastReadLogsCount,
    unreadPulseAnim,
  } = useInspector();

  return (
    <View style={styles.tabBarContainer}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{paddingRight: 16}}>
        {(
          [
            {
              key: 'apis',
              label: 'APIs',
              count: logs.length,
              icon: 'apis',
            },
            {
              key: 'logs',
              label: 'Logs',
              count: consoleLogs.length,
              icon: 'logs',
            },
            {
              key: 'analytics',
              label: 'Analytics',
              count: analyticsEvents.length,
              icon: 'analytics',
            },
            {
              key: 'redux',
              label: 'Redux',
              count: 0,
              icon: 'redux',
            },
            {
              key: 'bundle',
              label: 'Bundle',
              count: 0,
              icon: 'bundle',
            },
          ] as const
        )
          .filter(tab => tabVisibility?.[tab.key])
          .map(tab => {
            const isActive = activeTab === tab.key;
            const iconColor = isActive
              ? AppColors.white
              : AppColors.grayText;
            const countLabel =
              tab.count > 9 ? '9+' : String(tab.count);
            const hasUnreadApis =
              activeTab !== 'apis' &&
              logs.length > lastReadApisCount;
            const hasUnreadLogs =
              activeTab !== 'logs' &&
              consoleLogs.length > lastReadLogsCount;
            return (
              <TouchableScale
                key={tab.key}
                onPress={() => switchActiveTab(tab.key)}
                style={[
                  styles.contentTabButton,
                  isActive && styles.contentTabButtonActive,
                ]}>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                  }}>
                  {tab.icon === 'apis' && (
                    <SignalIcon color={iconColor} size={14} />
                  )}
                  {tab.icon === 'logs' && (
                    <TerminalIcon color={iconColor} size={14} />
                  )}
                  {tab.icon === 'analytics' && (
                    <AnalyticsIcon color={iconColor} size={14} />
                  )}
                  {tab.icon === 'redux' && (
                    <ReduxIcon color={iconColor} size={14} />
                  )}
                  {tab.icon === 'bundle' && (
                    <PackageIcon color={iconColor} size={14} />
                  )}
                  <Text
                    numberOfLines={1}
                    ellipsizeMode="tail"
                    style={[
                      styles.contentTabButtonText,
                      isActive &&
                        styles.contentTabButtonTextActive,
                    ]}>
                    {tab.label}{' '}
                    {tab.count > 0 ? `(${countLabel})` : ''}
                  </Text>
                  {((tab.key === 'apis' && hasUnreadApis) ||
                    (tab.key === 'logs' && hasUnreadLogs)) && (
                    <Animated.View
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: AppColors.errorColor,
                        marginLeft: 4,
                        alignSelf: 'center',
                        transform: [{scale: unreadPulseAnim}],
                      }}
                    />
                  )}
                </View>
              </TouchableScale>
            );
          })}
      </ScrollView>
    </View>
  );
});

export default TabBar;
