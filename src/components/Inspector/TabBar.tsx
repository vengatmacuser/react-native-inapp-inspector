import React from 'react';
import {
  Animated,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {useInspector} from './InspectorContext';
import styles from '../../styles';
import {AppColors} from '../../styles/AppColors';
import {AppFonts} from '../../styles/AppFonts';
import TouchableScale from '../TouchableScale';
import {
  SignalIcon,
  TerminalIcon,
  AnalyticsIcon,
  PackageIcon,
  ReduxIcon,
  PerformanceIcon,
  CrashIcon,
  SmartphoneIcon,
  DatabaseIcon,
  QrCodeIcon,
} from '../NetworkIcons';

import {isReduxConnected} from '../../customHooks/reduxLogger';
import {isAnalyticsConnected} from '../../customHooks/analyticsLogger';
import {triggerNativeHaptic} from '../../native/NativeInspector';
import {isLocalDebugEnvironment} from '../../helpers';

const TabBar = React.memo(() => {
  const {
    activeTab,
    switchActiveTab,
    tabVisibility,
    logs,
    consoleLogs,
    analyticsEvents,
    crashRecords,
    lastReadApisCount,
    lastReadLogsCount,
    lastReadCrashesCount,
    unreadPulseAnim,
  } = useInspector();

  const isReduxAvail = isReduxConnected();
  const isAnalyticsAvail = isAnalyticsConnected();

  return (
    <View style={styles.tabBarContainer}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{paddingRight: 16}}>
        {(
          [
            {
              id: 1,
              key: 'apis',
              label: 'APIs',
              count: logs.length,
              icon: 'apis',
            },
            {
              id: 2,
              key: 'logs',
              label: 'Logs',
              count: consoleLogs.length,
              icon: 'logs',
            },
            {
              id: 3,
              key: 'analytics',
              label: 'Analytics',
              count: analyticsEvents.length,
              icon: 'analytics',
            },
            {
              id: 4,
              key: 'redux',
              label: 'Redux',
              count: 0,
              icon: 'redux',
            },
            {
              id: 5,
              key: 'storage',
              label: 'Storage',
              count: 0,
              icon: 'storage',
            },
            {
              id: 6,
              key: 'device',
              label: 'Device',
              count: 0,
              icon: 'device',
            },
            {
              id: 7,
              key: 'crash',
              label: 'Crash',
              count: crashRecords?.length || 0,
              icon: 'crash',
            },
            {
              id: 8,
              key: 'bundle',
              label: 'Bundle',
              count: 0,
              icon: 'bundle',
            },
            {
              id: 9,
              key: 'performance',
              label: 'Performance',
              count: 0,
              icon: 'performance',
            },
            {
              id: 10,
              key: 'debugging',
              label: 'Debugging',
              count: 0,
              icon: 'debugging',
            },
          ] as const
        )
          .filter(tab => {
            if (tab.key === 'debugging') {
              return (
                Platform.OS === 'android' &&
                isLocalDebugEnvironment() &&
                Boolean(tabVisibility?.debugging)
              );
            }
            if (!tabVisibility?.[tab.key]) return false;
            if (tab.key === 'redux' && !isReduxAvail) return false;
            if (tab.key === 'analytics' && !isAnalyticsAvail) return false;
            return true;
          })
          .map(tab => {
            const isActive = activeTab === tab.key;
            const iconColor = isActive
              ? AppColors.white
              : tab.key === 'crash' && tab.count > 0
              ? AppColors.errorColor
              : AppColors.grayText;
            const countLabel = tab.count > 9 ? '9+' : String(tab.count);
            const hasUnreadApis =
              activeTab !== 'apis' && logs.length > lastReadApisCount;
            const hasUnreadLogs =
              activeTab !== 'logs' && consoleLogs.length > lastReadLogsCount;
            const hasUnreadCrashes =
              activeTab !== 'crash' &&
              (crashRecords?.length || 0) > (lastReadCrashesCount || 0);
            return (
              <TouchableScale
                key={tab.key}
                onPress={() => {
                  switchActiveTab(tab.key);
                }}
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
                  {tab.icon === 'storage' && (
                    <DatabaseIcon color={iconColor} size={14} />
                  )}
                  {tab.icon === 'device' && (
                    <SmartphoneIcon color={iconColor} size={14} />
                  )}
                  {tab.icon === 'crash' && (
                    <CrashIcon color={iconColor} size={14} />
                  )}
                  {tab.icon === 'bundle' && (
                    <PackageIcon color={iconColor} size={14} />
                  )}
                  {tab.icon === 'performance' && (
                    <PerformanceIcon color={iconColor} size={14} />
                  )}
                  {tab.icon === 'debugging' && (
                    <QrCodeIcon color={iconColor} size={14} />
                  )}
                  <View
                    style={{
                      minWidth: 20,
                      height: 20,
                      paddingHorizontal: 4,
                      borderRadius: 10,
                      backgroundColor: isActive
                        ? `${AppColors.white}33`
                        : `${AppColors.purple}1F`,
                      borderWidth: 1,
                      borderColor: isActive
                        ? `${AppColors.white}66`
                        : `${AppColors.purple}40`,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                    <Text
                      style={{
                        fontFamily: AppFonts.interBold,
                        fontSize: 9.5,
                        lineHeight: 12,
                        color: isActive ? AppColors.white : AppColors.purple,
                      }}>
                      #{tab.id}
                    </Text>
                  </View>
                  <Text
                    numberOfLines={1}
                    ellipsizeMode="tail"
                    style={[
                      styles.contentTabButtonText,
                      isActive && styles.contentTabButtonTextActive,
                    ]}>
                    {tab.label} {tab.count > 0 ? `(${countLabel})` : ''}
                  </Text>
                  {((tab.key === 'apis' && hasUnreadApis) ||
                    (tab.key === 'logs' && hasUnreadLogs) ||
                    (tab.key === 'crash' && hasUnreadCrashes)) && (
                    <View
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: AppColors.errorColor,
                        marginLeft: 4,
                        alignSelf: 'center',
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
