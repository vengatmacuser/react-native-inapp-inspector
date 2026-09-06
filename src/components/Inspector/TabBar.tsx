import React, {useRef, useState} from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
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
  ScreencastIcon,
  ChevronIcon,
} from '../NetworkIcons';

import {isReduxConnected} from '../../customHooks/reduxLogger';
import {isAnalyticsConnected} from '../../customHooks/analyticsLogger';
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
    mediaCount,
  } = useInspector();

  const isReduxAvail = isReduxConnected();
  const isAnalyticsAvail = isAnalyticsConnected();

  const isMediaActive = activeTab === 'media';
  const showMediaTab = (tabVisibility?.media ?? true) && mediaCount > 0;

  const scrollViewRef = useRef<ScrollView>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const scrollOffsetRef = useRef(0);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const {contentOffset, layoutMeasurement, contentSize} = event.nativeEvent;
    const x = contentOffset.x;
    scrollOffsetRef.current = x;
    const hasLeft = x > 8;
    const hasRight = x < contentSize.width - layoutMeasurement.width - 8;
    if (canScrollLeft !== hasLeft) setCanScrollLeft(hasLeft);
    if (canScrollRight !== hasRight) setCanScrollRight(hasRight);
  };

  const scrollTabs = (offset: number) => {
    scrollViewRef.current?.scrollTo({
      x: Math.max(0, scrollOffsetRef.current + offset),
      animated: true,
    });
  };

  return (
    <View
      style={[
        styles.tabBarContainer,
        {
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 0,
        },
      ]}>
      {/* Scroll Left Arrow Icon — Initially hidden until scrolled */}
      {canScrollLeft && (
        <TouchableOpacity
          onPress={() => scrollTabs(-160)}
          hitSlop={{top: 6, bottom: 6, left: 6, right: 6}}
          activeOpacity={0.7}
          style={{
            paddingLeft: 6,
            paddingRight: 2,
            justifyContent: 'center',
            alignItems: 'center',
          }}>
          <View
            style={{
              width: 22,
              height: 22,
              borderRadius: 11,
              backgroundColor: '#E5E7EB',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <ChevronIcon direction="left" size={13} color={AppColors.purple} />
          </View>
        </TouchableOpacity>
      )}

      {/* Scrollable Main Tabs (#1 - #10) */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={{flex: 1}}
        contentContainerStyle={{
          paddingLeft: canScrollLeft ? 4 : 12,
          paddingRight: showMediaTab ? 6 : 12,
        }}>
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

      {/* Scroll Right Arrow Icon */}
      {canScrollRight && (
        <TouchableOpacity
          onPress={() => scrollTabs(160)}
          hitSlop={{top: 6, bottom: 6, left: 6, right: 6}}
          activeOpacity={0.7}
          style={{
            paddingLeft: 2,
            paddingRight: showMediaTab ? 4 : 8,
            justifyContent: 'center',
            alignItems: 'center',
          }}>
          <View
            style={{
              width: 22,
              height: 22,
              borderRadius: 11,
              backgroundColor: '#E5E7EB',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <ChevronIcon direction="right" size={13} color={AppColors.purple} />
          </View>
        </TouchableOpacity>
      )}

      {/* Sticky Right Screencast Tab — Visible only when mediaCount > 0 */}
      {showMediaTab && (
        <View
          style={{
            paddingLeft: 6,
            paddingRight: 10,
            borderLeftWidth: 1,
            borderLeftColor: '#E5E7EB',
            backgroundColor: '#ffffff',
            justifyContent: 'center',
            shadowColor: '#000000',
            shadowOffset: {width: -3, height: 0},
            shadowOpacity: 0.12,
            shadowRadius: 4,
            elevation: 4,
            zIndex: 10,
          }}>
          <TouchableScale
            key="media"
            onPress={() => {
              switchActiveTab('media');
            }}
            accessibilityRole="button"
            accessibilityLabel="Media Gallery"
            style={[
              styles.contentTabButton,
              {
                marginRight: 0,
                borderRadius: 8,
                backgroundColor: isMediaActive ? AppColors.purple : '#eeeeee',
                borderColor: isMediaActive ? AppColors.purple : '#E5E7EB',
                borderWidth: 1,
                paddingHorizontal: 10,
                paddingVertical: 7,
                alignItems: 'center',
                justifyContent: 'center',
              },
              isMediaActive && styles.contentTabButtonActive,
            ]}>
            <View
              style={{
                position: 'relative',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <ScreencastIcon
                color={isMediaActive ? AppColors.white : AppColors.grayText}
                size={15}
              />
              {mediaCount > 0 && (
                <View
                  style={{
                    position: 'absolute',
                    top: -3,
                    right: -4,
                    width: 7,
                    height: 7,
                    borderRadius: 3.5,
                    backgroundColor: isMediaActive
                      ? AppColors.emerald400
                      : AppColors.purple,
                    borderWidth: 1.2,
                    borderColor: isMediaActive
                      ? AppColors.purple
                      : AppColors.white,
                  }}
                />
              )}
            </View>
          </TouchableScale>
        </View>
      )}
    </View>
  );
});

export default TabBar;
