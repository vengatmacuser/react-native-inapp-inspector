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
import {useTranslation} from '../../i18n';
import styles from '../../styles';
import {AppColors} from '../../styles/AppColors';
import {AppFonts} from '../../styles/AppFonts';
import TouchableScale from '../TouchableScale';
import {
  SignalIcon,
  TerminalIcon,
  AnalyticsIcon,
  ReduxIcon,
  CrashIcon,
  BellIcon,
  SmartphoneIcon,
  DatabaseIcon,
  QrCodeIcon,
  ScreencastIcon,
  ChevronIcon,
  WebsocketIcon,
} from '../NetworkIcons';

import {isReduxConnected} from '../../customHooks/reduxLogger';
import {isAnalyticsConnected} from '../../customHooks/analyticsLogger';
import {isLocalDebugEnvironment} from '../../helpers';

const HEADER_TAB_THEME = {
  themeColor: AppColors.brandPurple, // #4F46E5 Header Brand Purple
  bgInactive: `${AppColors.brandPurple}0D`,
  borderInactive: `${AppColors.brandPurple}2B`,
  iconInactive: AppColors.brandPurple,
  idBadgeBg: `${AppColors.brandPurple}1C`,
  idBadgeBorder: `${AppColors.brandPurple}3D`,
  idBadgeText: AppColors.brandPurple,
};

const TAB_THEMES: Record<
  string,
  {
    themeColor: string;
    bgInactive: string;
    borderInactive: string;
    iconInactive: string;
    idBadgeBg: string;
    idBadgeBorder: string;
    idBadgeText: string;
  }
> = {
  apis: HEADER_TAB_THEME,
  logs: HEADER_TAB_THEME,
  analytics: HEADER_TAB_THEME,
  redux: HEADER_TAB_THEME,
  storage: HEADER_TAB_THEME,
  device: HEADER_TAB_THEME,
  crash: HEADER_TAB_THEME,
  push: HEADER_TAB_THEME,
  socket: HEADER_TAB_THEME,
  debugging: HEADER_TAB_THEME,
  media: HEADER_TAB_THEME,
};

const TabBar = React.memo(() => {
  const {t} = useTranslation();
  const {
    activeTab,
    switchActiveTab,
    tabVisibility,
    logs,
    consoleLogs,
    analyticsEvents,
    crashRecords,
    pushRecords,
    socketRecords,
    unreadPushCount,
    unreadSocketCount,
    lastReadApisCount,
    lastReadLogsCount,
    lastReadCrashesCount,
    lastReadSocketCount,
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
              backgroundColor: AppColors.grayBorderSecondary,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <ChevronIcon direction="left" size={13} color={AppColors.grayTextStrong} />
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
              key: 'push',
              label: 'Push',
              count: pushRecords?.length || 0,
              icon: 'push',
            },
            {
              id: 9,
              key: 'socket',
              label: 'WebSocket',
              count: socketRecords?.length || 0,
              icon: 'socket',
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
            const theme = TAB_THEMES[tab.key] || TAB_THEMES.apis;
            const iconColor = isActive ? AppColors.white : theme.iconInactive;
            const countLabel = tab.count > 99 ? '99+' : String(tab.count);
            const hasUnreadApis =
              activeTab !== 'apis' && logs.length > lastReadApisCount;
            const hasUnreadLogs =
              activeTab !== 'logs' && consoleLogs.length > lastReadLogsCount;
            const hasUnreadCrashes =
              activeTab !== 'crash' &&
              (crashRecords?.length || 0) > (lastReadCrashesCount || 0);
            const hasUnreadSockets =
              activeTab !== 'socket' &&
              ((socketRecords?.length || 0) > (lastReadSocketCount || 0) || unreadSocketCount > 0);

            return (
              <TouchableScale
                key={tab.key}
                onPress={() => {
                  switchActiveTab(tab.key);
                }}
                style={[
                  styles.contentTabButton,
                  {
                    backgroundColor: isActive ? theme.themeColor : theme.bgInactive,
                    borderColor: isActive ? theme.themeColor : theme.borderInactive,
                  },
                  isActive && {
                    shadowColor: theme.themeColor,
                    shadowOffset: {width: 0, height: 2},
                    shadowOpacity: 0.28,
                    shadowRadius: 3.5,
                    elevation: 3,
                  },
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
                  {tab.icon === 'push' && (
                    <BellIcon color={iconColor} size={14} />
                  )}
                  {tab.icon === 'socket' && (
                    <WebsocketIcon color={iconColor} size={14} />
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
                        : theme.idBadgeBg,
                      borderWidth: 1,
                      borderColor: isActive
                        ? `${AppColors.white}66`
                        : theme.idBadgeBorder,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                    <Text
                      style={{
                        fontFamily: AppFonts.interBold,
                        fontSize: 9.5,
                        lineHeight: 12,
                        color: isActive ? AppColors.white : theme.idBadgeText,
                      }}>
                      #{tab.id}
                    </Text>
                  </View>
                  <Text
                    numberOfLines={1}
                    ellipsizeMode="tail"
                    style={[
                      styles.contentTabButtonText,
                      {
                        color: isActive ? AppColors.white : AppColors.grayTextStrong,
                        fontFamily: isActive ? AppFonts.interBold : AppFonts.interSemiBold,
                      },
                    ]}>
                    {t(`tabs.${tab.key}`, tab.label)}
                  </Text>
                  {tab.count > 0 && tab.key !== 'push' && (
                    <View
                      style={{
                        paddingHorizontal: 5,
                        paddingVertical: 1,
                        borderRadius: 8,
                        backgroundColor: isActive
                          ? 'rgba(255,255,255,0.25)'
                          : theme.idBadgeBg,
                        borderWidth: 0.5,
                        borderColor: isActive
                          ? 'rgba(255,255,255,0.45)'
                          : theme.idBadgeBorder,
                        marginLeft: 1,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                      <Text
                        style={{
                          fontFamily: AppFonts.interBold,
                          fontSize: 9.5,
                          lineHeight: 12,
                          color: isActive ? AppColors.white : theme.themeColor,
                        }}>
                        {countLabel}
                      </Text>
                    </View>
                  )}
                  {((tab.key === 'apis' && hasUnreadApis) ||
                    (tab.key === 'logs' && hasUnreadLogs) ||
                    (tab.key === 'crash' && hasUnreadCrashes) ||
                    (tab.key === 'push' &&
                      ((pushRecords?.length || 0) > 0 || unreadPushCount > 0)) ||
                    (tab.key === 'socket' && hasUnreadSockets)) && (
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
              backgroundColor: AppColors.grayBorderSecondary,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <ChevronIcon direction="right" size={13} color={AppColors.grayTextStrong} />
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
            borderLeftColor: AppColors.dividerColor,
            backgroundColor: AppColors.primaryLight,
            justifyContent: 'center',
            shadowColor: AppColors.shadowColorString,
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
                backgroundColor: isMediaActive
                  ? AppColors.brandPurple
                  : `${AppColors.brandPurple}0D`,
                borderColor: isMediaActive
                  ? AppColors.brandPurple
                  : `${AppColors.brandPurple}2B`,
                borderWidth: 1,
                paddingHorizontal: 10,
                paddingVertical: 7,
                alignItems: 'center',
                justifyContent: 'center',
              },
              isMediaActive && {
                shadowColor: AppColors.brandPurple,
                shadowOffset: {width: 0, height: 2},
                shadowOpacity: 0.28,
                shadowRadius: 3.5,
                elevation: 3,
              },
            ]}>
            <View
              style={{
                position: 'relative',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <ScreencastIcon
                color={isMediaActive ? AppColors.white : AppColors.brandPurple}
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
                      ? AppColors.white
                      : AppColors.brandPurple,
                    borderWidth: 1.2,
                    borderColor: isMediaActive
                      ? AppColors.brandPurple
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
