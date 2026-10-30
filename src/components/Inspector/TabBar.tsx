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
  SpeedometerIcon,
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
  perf: HEADER_TAB_THEME,
  analytics: HEADER_TAB_THEME,
  redux: HEADER_TAB_THEME,
  storage: HEADER_TAB_THEME,
  device: HEADER_TAB_THEME,
  crash: HEADER_TAB_THEME,
  push: HEADER_TAB_THEME,
  socket: HEADER_TAB_THEME,
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
  const showMediaTab = (tabVisibility?.media ?? true) && (mediaCount > 0 || isMediaActive || __DEV__);

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
              width: 24,
              height: 24,
              borderRadius: 12,
              backgroundColor: AppColors.primaryLight,
              borderTopWidth: 1.5,
              borderLeftWidth: 1,
              borderRightWidth: 1,
              borderBottomWidth: 2,
              borderTopColor: AppColors.white,
              borderLeftColor: '#CBD5E1',
              borderRightColor: '#CBD5E1',
              borderBottomColor: '#94A3B8',
              shadowColor: AppColors.black,
              shadowOffset: {width: 0, height: 1},
              shadowOpacity: 0.10,
              shadowRadius: 2,
              elevation: 2,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <ChevronIcon direction="left" size={13} color={AppColors.grayTextStrong} />
          </View>
        </TouchableOpacity>
      )}

      {/* Scrollable Main Tabs (#1 - #10) */}
      <ScrollView
        testID="inspector.tab.scrollview"
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
              icon: 'apis',
            },
            {
              id: 2,
              key: 'logs',
              label: 'Logs',
              icon: 'logs',
            },
            {
              id: 3,
              key: 'perf',
              label: 'Perf / FPS',
              icon: 'perf',
            },
            {
              id: 4,
              key: 'analytics',
              label: 'Analytics',
              icon: 'analytics',
            },
            {
              id: 5,
              key: 'redux',
              label: 'Redux',
              icon: 'redux',
            },
            {
              id: 6,
              key: 'storage',
              label: 'Storage',
              icon: 'storage',
            },
            {
              id: 7,
              key: 'device',
              label: 'Device',
              icon: 'device',
            },
            {
              id: 8,
              key: 'crash',
              label: 'Crash',
              icon: 'crash',
            },
            {
              id: 9,
              key: 'push',
              label: 'Push',
              icon: 'push',
            },
            {
              id: 10,
              key: 'socket',
              label: 'WebSocket',
              icon: 'socket',
            },
          ] as const
        )
          .filter(tab => {
            if (!tabVisibility?.[tab.key]) return false;
            if (tab.key === 'redux' && !isReduxAvail) return false;
            if (tab.key === 'analytics' && !isAnalyticsAvail) return false;
            return true;
          })
          .map(tab => {
            const isActive = activeTab === tab.key;
            const theme = TAB_THEMES[tab.key] || TAB_THEMES.apis;
            const iconColor = isActive ? AppColors.white : theme.iconInactive;
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
                testID={`inspector.tab.${tab.key}`}
                accessible={true}
                accessibilityRole="tab"
                accessibilityState={{selected: isActive}}
                accessibilityLabel={`${t(`tabs.${tab.key}`, tab.label)} tab`}
                accessibilityHint={t('accessibility.tabSwitchHint', 'Double tap to switch to this tab')}
                onPress={() => {
                  switchActiveTab(tab.key);
                }}
                style={[
                  styles.contentTabButton,
                  isActive
                    ? {
                        backgroundColor: theme.themeColor,
                        borderTopColor: 'rgba(255, 255, 255, 0.45)',
                        borderLeftColor: 'rgba(255, 255, 255, 0.25)',
                        borderRightColor: 'rgba(0, 0, 0, 0.12)',
                        borderBottomColor: 'rgba(0, 0, 0, 0.25)',
                        shadowColor: theme.themeColor,
                        shadowOffset: {width: 0, height: 3},
                        shadowOpacity: 0.35,
                        shadowRadius: 5,
                        elevation: 3,
                      }
                    : {
                        backgroundColor: AppColors.white,
                        borderTopColor: AppColors.white,
                        borderLeftColor: AppColors.grayBorderSecondary,
                        borderRightColor: AppColors.grayBorderSecondary,
                        borderBottomColor: AppColors.slate200,
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
                  {tab.icon === 'perf' && (
                    <SpeedometerIcon color={iconColor} size={14} />
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
              width: 24,
              height: 24,
              borderRadius: 12,
              backgroundColor: AppColors.primaryLight,
              borderTopWidth: 1.5,
              borderLeftWidth: 1,
              borderRightWidth: 1,
              borderBottomWidth: 2,
              borderTopColor: AppColors.white,
              borderLeftColor: '#CBD5E1',
              borderRightColor: '#CBD5E1',
              borderBottomColor: '#94A3B8',
              shadowColor: AppColors.black,
              shadowOffset: {width: 0, height: 1},
              shadowOpacity: 0.10,
              shadowRadius: 2,
              elevation: 2,
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
            borderLeftColor: '#CBD5E1',
            backgroundColor: AppColors.grayBackground,
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
            testID="inspector.tab.media"
            onPress={() => {
              switchActiveTab('media');
            }}
            accessible={true}
            accessibilityRole="tab"
            accessibilityState={{selected: isMediaActive}}
            accessibilityLabel={`${t('tabs.media', 'Media')} tab${mediaCount > 0 ? `, ${mediaCount} items` : ''}`}
            accessibilityHint={t('accessibility.tabSwitchHint', 'Double tap to switch to this tab')}
            style={[
              styles.contentTabButton,
              {
                marginRight: 0,
                borderRadius: 12,
                backgroundColor: isMediaActive
                  ? AppColors.purple
                  : AppColors.primaryLight,
                borderTopWidth: 1.5,
                borderLeftWidth: 1.5,
                borderRightWidth: 1.5,
                borderBottomWidth: isMediaActive ? 3.5 : 3,
                borderTopColor: isMediaActive ? 'rgba(255, 255, 255, 0.45)' : AppColors.white,
                borderLeftColor: isMediaActive ? 'rgba(255, 255, 255, 0.2)' : '#CBD5E1',
                borderRightColor: isMediaActive ? 'rgba(0, 0, 0, 0.15)' : '#CBD5E1',
                borderBottomColor: isMediaActive ? 'rgba(0, 0, 0, 0.35)' : '#94A3B8',
                paddingHorizontal: 10,
                paddingVertical: 7,
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: isMediaActive ? AppColors.purple : AppColors.black,
                shadowOffset: {width: 0, height: 2},
                shadowOpacity: isMediaActive ? 0.32 : 0.10,
                shadowRadius: 4,
                elevation: isMediaActive ? 3 : 2,
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
