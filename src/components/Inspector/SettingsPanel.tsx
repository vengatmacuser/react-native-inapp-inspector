import React, {useMemo, useState, useEffect, useRef} from 'react';
import {
  Alert,
  Animated,
  DevSettings,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import Svg, {Path} from 'react-native-svg';
import {animateNextLayout, useInspector} from './InspectorContext';
import TouchableScale from '../TouchableScale';
import Slider from '../Slider';
import {toggleGlobalTheme} from '../../styles';
import {AppColors} from '../../styles/AppColors';
import {AppFonts} from '../../styles/AppFonts';
import {DEFAULT_HIDDEN_URL_PATTERNS} from '../../constants';
import {
  calculateRamBasedLimits,
} from '../../helpers/settingsStore';
import {clearNetworkLogs} from '../../customHooks/networkLogger';
import {clearConsoleLogs} from '../../customHooks/consoleLogger';
import {clearAnalyticsEvents, isAnalyticsConnected} from '../../customHooks/analyticsLogger';
import {clearCrashRecords} from '../../customHooks/crashHandler';
import {isReduxConnected} from '../../customHooks/reduxLogger';
import {useTranslation, SUPPORTED_LANGUAGES, setLanguage, getLanguage} from '../../i18n';
import {LanguageSelectorModal} from './LanguageSelectorModal';
import {loadSettings, saveSettings} from '../../helpers/settingsStore';
import {ActiveTab} from '../../types';
import {
  GlobeIcon,
  SignalIcon,
  TerminalIcon,
  AnalyticsIcon,
  SettingsIcon,
  SunIcon,
  MoonIcon,
  ScreenIcon,
  MotionIcon,
  LayersIcon,
  EyeIcon,
  CheckIcon,
  TrashIcon,
  PackageIcon,
  ReduxIcon,
  CrashIcon,
  ShieldAlertIcon,
  ShieldCheckIcon,
  ShieldBanIcon,
  ScaleBalanceIcon,
  VolumeMuteIcon,
  JsIcon,
  ChipIcon,
  LayoutIcon,
  HourglassIcon,
  CodeBracketsIcon,
  LockIcon,
  RefreshCcwIcon,
  ForwardChevronIcon,
  ChevronDownIcon,
  BrainIcon,
  SmartphoneIcon,
  DatabaseIcon,
  QrCodeIcon,
  FilmIcon,
  ScreencastIcon,
  CameraIcon,
  VideoCameraIcon,
  MicrophoneIcon,
  GifIcon,
  ImageIcon,
  BellIcon,
  WebsocketIcon,
  SpeedometerIcon,
  BoltIcon,
} from '../NetworkIcons';
import {ScreenCapture} from '../../capture';
import {triggerNativeHaptic} from '../../native/NativeInspector';

import {
  isLocalDebugEnvironment,
} from '../../helpers';
import {showToast} from '../../helpers/toast';
import {pruneAllLogs} from '../../helpers/memoryManager';

const SettingsPanel = () => {
  const {t} = useTranslation();
  const {
    settingsPage,
    setSettingsPage,
    settingsActiveSubTab,
    setSettingsActiveSubTab,
    tabVisibility,
    toggleTabVisibility,
    defaultTab,
    setDefaultTab,
    isDark,
    setIsDark,
    modalHeightPercent,
    setModalHeightPercent,
    modalAnimationType,
    setModalAnimationType,
    showDuplicateLogs,
    setShowDuplicateLogs,
    showUpdateToast,
    setShowUpdateToast,
    showConsoleLevels,
    setShowConsoleLevels,
    closeModal,
    logs,
    consoleLogs,
    analyticsEvents,
    reduxState,
    maxConsoleLogs,
    setMaxConsoleLogs,
    maxAnalyticsEventsLimit,
    setMaxAnalyticsEventsLimit,
    isAutoRamLimitEnabled,
    setIsAutoRamLimitEnabled,
    deviceFreeRamMb,
    reduxAutoRefresh,
    setReduxAutoRefreshState,
    reduxExpandDepth,
    setReduxExpandDepth,
    setSelected,
    setSelectedEvent,
    setReduxState,
    crashRecords,
    maxCrashLogs,
    setMaxCrashLogs,
    crashIgnoredTypes,
    setCrashIgnoredTypes,
    crashModalTriggerPolicy,
    setCrashModalTriggerPolicyState,
    applyCrashPolicyPreset,
    pushRecords,
    maxPushLogs,
    setMaxPushLogs,
    clearAllPushLogs,
    simulatePush,
    socketRecords,
    maxSocketLogs,
    setMaxSocketLogs,
    clearAllSocketLogs,
    simulateSocket,
    captureImageFormat,
    setCaptureImageFormat,
    captureAutoHide,
    setCaptureAutoHide,
    captureAudioMode,
    setCaptureAudioMode,
    captureFps,
    setCaptureFps,
    captureScale,
    setCaptureScale,
    captureBitrate,
    setCaptureBitrate,
    captureMaxDurationSeconds,
    setCaptureMaxDurationSeconds,
    captureAutoGif,
    setCaptureAutoGif,
    captureWidgetEnabled,
    setCaptureWidgetEnabled,
    peekOpacity,
    setPeekOpacity,
    hiddenUrlPatterns,
    setHiddenUrlPatterns,
  } = useInspector();

  const [newUrlPattern, setNewUrlPattern] = useState('');
  const [stagedHeight, setStagedHeight] = useState(modalHeightPercent);

  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const currentLangCode = getLanguage();
  const currentLangObj =
    SUPPORTED_LANGUAGES.find(l => l.code === currentLangCode) ||
    SUPPORTED_LANGUAGES[0];

  const handleAddUrlPattern = () => {
    const trimmed = newUrlPattern.trim();
    if (!trimmed) return;
    if (hiddenUrlPatterns.includes(trimmed)) {
      showToast('Pattern already exists in filter list');
      return;
    }
    // Validate regex syntax
    try {
      new RegExp(trimmed);
    } catch {
      // Still allow string matching but warn user
    }
    triggerNativeHaptic('light');
    setHiddenUrlPatterns(prev => [...prev, trimmed]);
    setNewUrlPattern('');
    showToast('Hidden URL pattern added');
  };

  const handleRemoveUrlPattern = (indexToRemove: number) => {
    const targetPattern = hiddenUrlPatterns[indexToRemove];
    if (DEFAULT_HIDDEN_URL_PATTERNS.includes(targetPattern)) {
      showToast('Default system filter cannot be removed');
      return;
    }
    triggerNativeHaptic('light');
    setHiddenUrlPatterns(prev => prev.filter((_, idx) => idx !== indexToRemove));
    showToast('Pattern removed');
  };


  useEffect(() => {
    setStagedHeight(modalHeightPercent);
  }, [modalHeightPercent]);

  const subTabTransitionAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    subTabTransitionAnim.setValue(0);
    Animated.spring(subTabTransitionAnim, {
      toValue: 1,
      friction: 8,
      tension: 65,
      useNativeDriver: true,
    }).start();
  }, [settingsActiveSubTab]);

  const autoRamProfile = calculateRamBasedLimits(deviceFreeRamMb);

  const allModules = useMemo(
    () => [
      {
        id: 1,
        key: 'apis',
        label: 'APIs (Network)',
            category: 'core',
            icon: 'apis',
            desc: 'HTTP/HTTPS requests, GraphQL, Axios & WebSocket inspector',
          },
          {
            id: 2,
            key: 'logs',
            label: 'Console Logs',
            category: 'core',
            icon: 'logs',
            desc: 'Terminal console logs, warnings, errors & stack traces',
          },
          {
            id: 3,
            key: 'perf',
            label: 'Performance & FPS',
            category: 'telemetry',
            icon: 'perf',
            desc: 'Live 60 FPS graph, JS event loop queue lag, memory heap & jank monitor',
          },
          {
            id: 4,
            key: 'analytics',
            label: 'Analytics Logger',
            category: 'telemetry',
            icon: 'analytics',
            desc: 'Firebase & custom analytics events, user properties & params',
          },
          {
            id: 5,
            key: 'redux',
            label: 'Redux Inspector',
            category: 'telemetry',
            icon: 'redux',
            desc: 'Store state diffing, action history & reducer timeline',
          },
          {
            id: 6,
            key: 'storage',
            label: 'Storage Inspector',
            category: 'telemetry',
            icon: 'storage',
            desc: 'AsyncStorage & MMKV key-value store viewer with full CRUD support',
          },
          {
            id: 7,
            key: 'device',
            label: 'Device Info',
            category: 'diagnostic',
            icon: 'device',
            desc: 'Hardware specs, IP address, screen metrics, UDID & runtime stats',
          },
          {
            id: 8,
            key: 'crash',
            label: 'Crash Protection',
            category: 'diagnostic',
            icon: 'crash',
            desc: 'Runtime exception guard, breadcrumbs & memory snapshot',
          },
          {
            id: 9,
            key: 'media',
            label: 'Screencast',
            category: 'diagnostic',
            icon: 'media',
            desc: 'Screenshots, video recordings, audio narration & animated GIFs',
          },
          {
            id: 10,
            key: 'push',
            label: 'Push Notifications',
            category: 'telemetry',
            icon: 'push',
            desc: 'Universal push & local notification logger (Salesforce, FCM, APNs, Braze, Expo)',
          },
          {
            id: 11,
            key: 'socket',
            label: 'WebSocket & Socket.IO',
            category: 'telemetry',
            icon: 'socket',
            desc: 'Real-time WebSocket & Socket.IO message inspector, frames & event logger',
          },
        ] as const,
    [],
  );

  const MODULE_THEMES: Record<
    string,
    {color: string; bg: string; border: string}
  > = {
    apis: {
      color: AppColors.blue500,
      bg: `${AppColors.blue500}14`,
      border: `${AppColors.blue500}2E`,
    },
    logs: {
      color: AppColors.purple,
      bg: `${AppColors.purple}14`,
      border: `${AppColors.purple}2E`,
    },
    perf: {
      color: AppColors.purple,
      bg: `${AppColors.purple}14`,
      border: `${AppColors.purple}2E`,
    },
    analytics: {
      color: AppColors.amber600,
      bg: `${AppColors.amber600}14`,
      border: `${AppColors.amber600}2E`,
    },
    redux: {
      color: AppColors.violet600,
      bg: `${AppColors.violet600}14`,
      border: `${AppColors.violet600}2E`,
    },
    storage: {
      color: AppColors.cyan600,
      bg: `${AppColors.cyan600}14`,
      border: `${AppColors.cyan600}2E`,
    },
    device: {
      color: AppColors.emerald600,
      bg: `${AppColors.emerald600}14`,
      border: `${AppColors.emerald600}2E`,
    },
    crash: {
      color: AppColors.red600,
      bg: `${AppColors.red600}14`,
      border: `${AppColors.red600}2E`,
    },
    media: {
      color: AppColors.pink600,
      bg: `${AppColors.pink600}14`,
      border: `${AppColors.pink600}2E`,
    },
    push: {
      color: AppColors.orange600,
      bg: `${AppColors.orange600}14`,
      border: `${AppColors.orange600}2E`,
    },
    socket: {
      color: AppColors.teal600,
      bg: `${AppColors.teal600}14`,
      border: `${AppColors.teal600}2E`,
    },
  };

  const selectableModules = useMemo(() => {
    return allModules.filter(m => {
      if (m.key === 'apis') return false;
      if (m.key === 'redux' && !isReduxConnected()) return false;
      if (m.key === 'analytics' && !isAnalyticsConnected()) return false;
      return true;
    });
  }, [allModules]);

  const activeModulesCount = allModules.filter(
    m => m.key === 'apis' || Boolean(tabVisibility?.[m.key as ActiveTab]),
  ).length;

  const isAllSelectableChecked = useMemo(() => {
    if (selectableModules.length === 0) return false;
    return selectableModules.every(
      m => Boolean(tabVisibility?.[m.key as ActiveTab]),
    );
  }, [selectableModules, tabVisibility]);

  const handleToggleModule = (key: string) => {
    if (key === 'apis') return;
    triggerNativeHaptic('light');
    toggleTabVisibility(key as ActiveTab);
  };

  const handleToggleSelectAll = () => {
    triggerNativeHaptic('medium');
    const nextState = !isAllSelectableChecked;
    selectableModules.forEach(m => {
      const isCurrentOn = Boolean(tabVisibility?.[m.key as ActiveTab]);
      if (isCurrentOn !== nextState) {
        toggleTabVisibility(m.key as ActiveTab);
      }
    });
    showToast(nextState ? 'All modules enabled' : 'Optional modules disabled');
  };

  const [isDefaultTabDropdownOpen, setIsDefaultTabDropdownOpen] =
    useState(false);

  // Helper: settings row with icon + label + optional description
  const renderSettingRow = (opts: {
    key?: React.Key;
    icon: React.ReactNode;
    label: string;
    description?: string;
    right?: React.ReactNode;
    picker?: {
      options: readonly any[];
      selectedValue: any;
      onSelect: (val: any) => void;
      formatLabel?: (val: any) => string;
    };
    numericInput?: {
      value: number;
      onChange: (val: number) => void;
      min?: number;
      max?: number;
      placeholder?: string;
      keyboardType?: 'numeric' | 'number-pad' | 'decimal-pad';
    };
    onPress?: () => void;
    isLast?: boolean;
  }) => {
    return (
      <View
        key={opts.key}
        style={{
          paddingVertical: 12,
          borderBottomWidth: opts.isLast ? 0 : 1,
          borderBottomColor: AppColors.dividerColor,
        }}>
        <TouchableScale
          disabled={!opts.onPress}
          onPress={opts.onPress}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
          }}>
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              backgroundColor: AppColors.purpleShade50,
              borderWidth: 1,
              borderColor: `${AppColors.purple}2E`,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            {opts.icon}
          </View>
          <View style={{flex: 1}}>
            <Text
              style={{
                fontFamily: AppFonts.interBold,
                fontSize: 14,
                lineHeight: 18,
                color: AppColors.primaryBlack,
              }}>
              {opts.label}
            </Text>
            {opts.description ? (
              <Text
                style={{
                  fontFamily: AppFonts.interRegular,
                  fontSize: 11,
                  lineHeight: 15,
                  color: AppColors.grayText,
                  marginTop: 1,
                }}>
                {opts.description}
              </Text>
            ) : null}
          </View>
          {opts.right || null}
        </TouchableScale>
        {opts.numericInput && (
          <View style={{marginTop: 10, gap: 6}}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: AppColors.grayBackground,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: AppColors.dividerColor,
                paddingHorizontal: 12,
                paddingVertical: 4,
              }}>
              <TextInput
                style={{
                  flex: 1,
                  fontFamily: AppFonts.interMedium,
                  fontSize: 14,
                  lineHeight: 18,
                  color: AppColors.primaryBlack,
                  paddingVertical: 6,
                }}
                value={String(opts.numericInput.value || '')}
                onChangeText={text => {
                  const num = parseInt(text.replace(/[^0-9]/g, ''), 10);
                  if (!isNaN(num)) {
                    const clamped = Math.max(
                      opts.numericInput?.min ?? 1,
                      Math.min(opts.numericInput?.max ?? 10000, num),
                    );
                    opts.numericInput?.onChange(clamped);
                  }
                }}
                keyboardType={opts.numericInput.keyboardType ?? 'number-pad'}
                placeholder={opts.numericInput.placeholder}
                placeholderTextColor={AppColors.grayTextWeak}
                maxLength={6}
                selectTextOnFocus
              />
              <Text
                style={{
                  fontFamily: AppFonts.interBold,
                  fontSize: 11,
                  color: AppColors.purple,
                  marginLeft: 6,
                }}>
                MAX
              </Text>
            </View>
            {opts.numericInput.min !== undefined ||
            opts.numericInput.max !== undefined ? (
              <Text
                style={{
                  fontFamily: AppFonts.interRegular,
                  fontSize: 10,
                  lineHeight: 13,
                  color: AppColors.grayTextWeak,
                }}>
                Range: {opts.numericInput.min ?? 1} -{' '}
                {opts.numericInput.max ?? '∞'}
              </Text>
            ) : null}
          </View>
        )}
        {opts.picker && (
          <View
            style={{
              flexDirection: 'row',
              backgroundColor: AppColors.grayBackground,
              borderRadius: 8,
              padding: 2.5,
              marginTop: 10,
              borderWidth: 1,
              borderColor: AppColors.dividerColor,
            }}>
            {opts.picker.options.map(opt => {
              const isActive = opts.picker!.selectedValue === opt;
              return (
                <TouchableScale
                  key={String(opt)}
                  onPress={() => opts.picker!.onSelect(opt)}
                  style={{
                    flex: 1,
                    paddingVertical: 6,
                    alignItems: 'center',
                    borderRadius: 6,
                    backgroundColor: isActive
                      ? AppColors.purple
                      : 'transparent',
                  }}>
                  <Text
                    style={{
                      fontFamily: AppFonts.interBold,
                      fontSize: 11,
                      lineHeight: 14,
                      color: isActive ? AppColors.white : AppColors.grayText,
                    }}>
                    {opts.picker!.formatLabel
                      ? opts.picker!.formatLabel(opt)
                      : opt}
                  </Text>
                </TouchableScale>
              );
            })}
          </View>
        )}
      </View>
    );
  };

  const renderMainSettingsContent = () => (
    <View
      style={{
        flex: 1,
        backgroundColor: AppColors.grayBackground,
      }}>
      <ScrollView
        style={{flex: 1}}
        contentContainerStyle={{padding: 16, paddingBottom: 100, gap: 14}}
        showsVerticalScrollIndicator={false}>
        {/* ─── Modern Segmented 4-Column Category Bar (100% Width, Zero Scroll Cutoff) ─── */}
        <View
          style={{
            backgroundColor: AppColors.primaryLight,
            borderRadius: 12,
            padding: 3,
            borderWidth: 1,
            borderColor: AppColors.grayBorderSecondary,
            flexDirection: 'row',
            alignItems: 'center',
            shadowColor: AppColors.black,
            shadowOpacity: 0.04,
            shadowRadius: 4,
            shadowOffset: {width: 0, height: 2},
            elevation: 2,
          }}>
          {[
            {
              key: 'module' as const,
              label: t('settings.navModules', 'Modules'),
              Icon: LayersIcon,
            },
            {
              key: 'ui' as const,
              label: t('settings.navDisplay', 'Display'),
              Icon: ScreenIcon,
            },
            {
              key: 'limits' as const,
              label: t('settings.navLimits', 'Limits'),
              Icon: BrainIcon,
            },
            {
              key: 'capture' as const,
              label: t('settings.navCapture', 'Capture'),
              Icon: CameraIcon,
            },
          ].map(tab => {
            const isActive = settingsActiveSubTab === tab.key;
            const IconComp = tab.Icon;
            return (
              <TouchableScale
                key={tab.key}
                accessible={true}
                accessibilityRole="tab"
                accessibilityLabel={tab.label}
                accessibilityState={{selected: isActive}}
                onPress={() => {
                  triggerNativeHaptic('light');
                  animateNextLayout();
                  setSettingsActiveSubTab(tab.key);
                }}
                style={{
                  flex: 1,
                  minWidth: 0,
                  paddingVertical: 8,
                  paddingHorizontal: 2,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 4,
                  borderRadius: 9,
                  backgroundColor: isActive ? AppColors.purple : 'transparent',
                }}>
                <IconComp
                  color={isActive ? AppColors.white : AppColors.grayText}
                  size={12}
                />
                <Text
                  style={{
                    fontFamily: AppFonts.interBold,
                    fontSize: 11,
                    lineHeight: 14,
                    color: isActive ? AppColors.white : AppColors.grayText,
                  }}
                  numberOfLines={1}
                  ellipsizeMode="tail">
                  {tab.label}
                </Text>
              </TouchableScale>
            );
          })}
        </View>

        {settingsActiveSubTab === 'module' && (
          <Animated.View
            style={{
              gap: 10,
              opacity: subTabTransitionAnim,
              transform: [
                {
                  translateY: subTabTransitionAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [10, 0],
                  }),
                },
              ],
            }}>
            {/* Header Control Row: Active count on the left, Select/Deselect All button on the right */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: 4,
                paddingVertical: 2,
              }}>
              <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
                <Text
                  style={{
                    fontFamily: AppFonts.interBold,
                    fontSize: 12.5,
                    lineHeight: 16,
                    color: AppColors.primaryBlack,
                  }}>
                  Active Modules
                </Text>
                <View
                  style={{
                    backgroundColor: `${AppColors.purple}14`,
                    paddingHorizontal: 6,
                    paddingVertical: 1.5,
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: `${AppColors.purple}25`,
                  }}>
                  <Text
                    style={{
                      fontFamily: AppFonts.interBold,
                      fontSize: 9.5,
                      color: AppColors.purple,
                    }}>
                    {activeModulesCount} of {allModules.length}
                  </Text>
                </View>
              </View>

              <TouchableScale
                onPress={handleToggleSelectAll}
                hitSlop={6}
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 4.5,
                  borderRadius: 7,
                  backgroundColor: isAllSelectableChecked
                    ? `${AppColors.purple}14`
                    : AppColors.purple,
                  borderWidth: 1,
                  borderColor: isAllSelectableChecked
                    ? `${AppColors.purple}30`
                    : 'transparent',
                }}>
                <Text
                  style={{
                    fontFamily: AppFonts.interBold,
                    fontSize: 11,
                    color: isAllSelectableChecked
                      ? AppColors.purple
                      : AppColors.white,
                  }}>
                  {isAllSelectableChecked ? 'Deselect All' : 'Select All'}
                </Text>
              </TouchableScale>
            </View>

            {/* Individual Module Cards */}
            <View style={{gap: 8}}>
              {allModules.map(moduleItem => {
                const isReduxAvail = isReduxConnected();
                const isAnalyticsAvail = isAnalyticsConnected();
                const isUnavailable =
                  (moduleItem.key === 'redux' && !isReduxAvail) ||
                  (moduleItem.key === 'analytics' && !isAnalyticsAvail);
                const isLocked = moduleItem.key === 'apis' || isUnavailable;
                const isChecked =
                  moduleItem.key === 'apis' ||
                  (Boolean(tabVisibility?.[moduleItem.key as ActiveTab]) &&
                    !isUnavailable);

                const theme =
                  MODULE_THEMES[moduleItem.key] || {
                    color: AppColors.purple,
                    bg: `${AppColors.purple}14`,
                    border: `${AppColors.purple}2E`,
                  };

                const hasConfigurePage =
                  moduleItem.key === 'apis' ||
                  moduleItem.key === 'logs' ||
                  moduleItem.key === 'analytics' ||
                  moduleItem.key === 'redux' ||
                  moduleItem.key === 'crash' ||
                  moduleItem.key === 'push' ||
                  moduleItem.key === 'socket';

                const liveStats =
                  moduleItem.key === 'apis'
                    ? logs.length > 0
                      ? `${logs.length} requests`
                      : ''
                    : moduleItem.key === 'logs'
                    ? consoleLogs.length > 0
                      ? `${consoleLogs.length} logs`
                      : ''
                    : moduleItem.key === 'crash'
                    ? crashRecords && crashRecords.length > 0
                      ? `${crashRecords.length} crashes`
                      : ''
                    : moduleItem.key === 'analytics'
                    ? analyticsEvents.length > 0
                      ? `${analyticsEvents.length} events`
                      : ''
                    : moduleItem.key === 'redux'
                    ? reduxState && Object.keys(reduxState).length > 0
                      ? `${Object.keys(reduxState).length} slices`
                      : ''
                    : moduleItem.key === 'push'
                    ? pushRecords && pushRecords.length > 0
                      ? `${pushRecords.length} notifications`
                      : ''
                    : moduleItem.key === 'socket'
                    ? socketRecords && socketRecords.length > 0
                      ? `${socketRecords.length} sockets`
                      : ''
                    : '';

                return (
                  <View
                    key={moduleItem.key}
                    style={{
                      backgroundColor: AppColors.primaryLight,
                      borderRadius: 13,
                      borderWidth: 1,
                      borderColor: isChecked
                        ? `${theme.color}38`
                        : AppColors.grayBorderSecondary,
                      padding: 12,
                      gap: 8,
                      shadowColor: AppColors.black,
                      shadowOpacity: isChecked ? 0.03 : 0.01,
                      shadowRadius: 3,
                      shadowOffset: {width: 0, height: 1.5},
                      elevation: 1.5,
                    }}>
                    {/* Top Row: Icon Tile + Title/Badges/Desc + Switch Toggle */}
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 10,
                      }}>
                      {/* Left: Icon Tile */}
                      <View
                        style={{
                          width: 38,
                          height: 38,
                          borderRadius: 10,
                          backgroundColor: isChecked ? theme.bg : AppColors.grayBackground,
                          borderWidth: 1,
                          borderColor: isChecked ? theme.border : AppColors.grayBorderSecondary,
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}>
                        {moduleItem.icon === 'apis' && (
                          <SignalIcon
                            color={isChecked ? theme.color : AppColors.grayTextWeak}
                            size={16}
                          />
                        )}
                        {moduleItem.icon === 'logs' && (
                          <TerminalIcon
                            color={isChecked ? theme.color : AppColors.grayTextWeak}
                            size={16}
                          />
                        )}
                        {moduleItem.icon === 'perf' && (
                          <SpeedometerIcon
                            color={isChecked ? theme.color : AppColors.grayTextWeak}
                            size={16}
                          />
                        )}
                        {moduleItem.icon === 'crash' && (
                          <CrashIcon
                            color={isChecked ? theme.color : AppColors.grayTextWeak}
                            size={16}
                          />
                        )}
                        {moduleItem.icon === 'analytics' && (
                          <AnalyticsIcon
                            color={isChecked ? theme.color : AppColors.grayTextWeak}
                            size={16}
                          />
                        )}
                        {moduleItem.icon === 'redux' && (
                          <ReduxIcon
                            color={isChecked ? theme.color : AppColors.grayTextWeak}
                            size={16}
                          />
                        )}
                        {moduleItem.icon === 'device' && (
                          <SmartphoneIcon
                            color={isChecked ? theme.color : AppColors.grayTextWeak}
                            size={16}
                          />
                        )}
                        {moduleItem.icon === 'storage' && (
                          <DatabaseIcon
                            color={isChecked ? theme.color : AppColors.grayTextWeak}
                            size={16}
                          />
                        )}
                        {moduleItem.icon === 'media' && (
                          <ScreencastIcon
                            color={isChecked ? theme.color : AppColors.grayTextWeak}
                            size={16}
                          />
                        )}
                        {moduleItem.icon === 'push' && (
                          <BellIcon
                            color={isChecked ? theme.color : AppColors.grayTextWeak}
                            size={16}
                          />
                        )}
                        {moduleItem.icon === 'socket' && (
                          <WebsocketIcon
                            color={isChecked ? theme.color : AppColors.grayTextWeak}
                            size={16}
                          />
                        )}
                      </View>

                      {/* Middle: Title, Status Pills & 1-line Description with full width */}
                      <View style={{flex: 1, minWidth: 0, justifyContent: 'center'}}>
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 5,
                          }}>
                          <Text
                            style={{
                              fontFamily: AppFonts.interBold,
                              fontSize: 13.5,
                              lineHeight: 18,
                              color: isLocked
                                ? AppColors.grayText
                                : AppColors.primaryBlack,
                            }}
                            numberOfLines={1}>
                            {moduleItem.label}
                          </Text>

                          {/* Status / Feature Pills */}
                          {moduleItem.key === 'apis' && (
                            <View
                              style={{
                                backgroundColor: `${AppColors.blue500}14`,
                                paddingHorizontal: 4.5,
                                paddingVertical: 1,
                                borderRadius: 4,
                                borderWidth: 1,
                                borderColor: `${AppColors.blue500}33`,
                              }}>
                              <Text
                                style={{
                                  fontFamily: AppFonts.interBold,
                                  fontSize: 7.5,
                                  lineHeight: 10,
                                  color: AppColors.blue500,
                                  letterSpacing: 0.3,
                                }}>
                                CORE
                              </Text>
                            </View>
                          )}

                          {moduleItem.key === defaultTab && (
                            <View
                              style={{
                                backgroundColor: `${AppColors.purple}14`,
                                paddingHorizontal: 4.5,
                                paddingVertical: 1,
                                borderRadius: 4,
                                borderWidth: 1,
                                borderColor: `${AppColors.purple}2E`,
                              }}>
                              <Text
                                style={{
                                  fontFamily: AppFonts.interBold,
                                  fontSize: 7.5,
                                  lineHeight: 10,
                                  color: AppColors.purple,
                                  letterSpacing: 0.3,
                                }}>
                                DEFAULT
                              </Text>
                            </View>
                          )}

                          {isUnavailable && (
                            <View
                              style={{
                                backgroundColor: `${AppColors.amber500}14`,
                                paddingHorizontal: 4.5,
                                paddingVertical: 1,
                                borderRadius: 4,
                                borderWidth: 1,
                                borderColor: `${AppColors.amber500}33`,
                              }}>
                              <Text
                                style={{
                                  fontFamily: AppFonts.interBold,
                                  fontSize: 7.5,
                                  lineHeight: 10,
                                  color: AppColors.amber700,
                                  letterSpacing: 0.3,
                                }}>
                                OFFLINE
                              </Text>
                            </View>
                          )}
                        </View>

                        <Text
                          style={{
                            fontFamily: AppFonts.interRegular,
                            fontSize: 11,
                            lineHeight: 15,
                            color: AppColors.grayTextWeak,
                            marginTop: 1.5,
                          }}
                          numberOfLines={1}
                          ellipsizeMode="tail">
                          {moduleItem.desc}
                        </Text>
                      </View>

                      {/* Right: Switch Toggle */}
                      <Switch
                        value={isChecked}
                        disabled={isLocked}
                        onValueChange={() => handleToggleModule(moduleItem.key)}
                        trackColor={{
                          false: AppColors.grayBorderSecondary,
                          true: AppColors.purple,
                        }}
                        thumbColor={AppColors.white}
                        ios_backgroundColor={AppColors.grayBorderSecondary}
                        style={{transform: [{scaleX: 0.8}, {scaleY: 0.8}]}}
                      />
                    </View>

                    {/* Bottom Metadata & Configure Row (Only if stats exist OR configure page is available) */}
                    {(liveStats || hasConfigurePage || moduleItem.key === 'media') && (
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          paddingTop: 7,
                          borderTopWidth: 1,
                          borderTopColor: `${AppColors.dividerColor}99`,
                          marginTop: 1,
                        }}>
                        {/* Left: Live stats counter dot indicator */}
                        <View style={{flexDirection: 'row', alignItems: 'center', gap: 5, flex: 1}}>
                          {liveStats ? (
                            <View style={{flexDirection: 'row', alignItems: 'center', gap: 5}}>
                              <View
                                style={{
                                  width: 5.5,
                                  height: 5.5,
                                  borderRadius: 3,
                                  backgroundColor: isChecked ? theme.color : AppColors.grayTextWeak,
                                }}
                              />
                              <Text
                                style={{
                                  fontFamily: AppFonts.interMedium,
                                  fontSize: 10.5,
                                  lineHeight: 14,
                                  color: isChecked ? AppColors.grayTextStrong : AppColors.grayTextWeak,
                                }}>
                                {liveStats}
                              </Text>
                            </View>
                          ) : (
                            <View />
                          )}
                        </View>

                        {/* Right: Dedicated Configure Button */}
                        {(hasConfigurePage || moduleItem.key === 'media') && (
                          <TouchableScale
                            onPress={() => {
                              triggerNativeHaptic('light');
                              if (moduleItem.key === 'media') {
                                animateNextLayout();
                                setSettingsActiveSubTab('capture');
                              } else {
                                setSettingsPage(moduleItem.key);
                              }
                            }}
                            hitSlop={6}
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              gap: 3.5,
                              paddingHorizontal: 8.5,
                              paddingVertical: 4,
                              borderRadius: 6.5,
                              backgroundColor: `${theme.color}14`,
                              borderWidth: 1,
                              borderColor: `${theme.color}2A`,
                            }}>
                            <SettingsIcon color={theme.color} size={10} />
                            <Text
                              style={{
                                fontFamily: AppFonts.interBold,
                                fontSize: 10,
                                lineHeight: 13,
                                color: theme.color,
                              }}>
                              {t('settings.configure', 'Configure')}
                            </Text>
                            <ForwardChevronIcon color={theme.color} size={8} />
                          </TouchableScale>
                        )}
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          </Animated.View>
        )}

        {settingsActiveSubTab === 'ui' && (
          <Animated.View
            style={{
              gap: 14,
              opacity: subTabTransitionAnim,
              transform: [
                {
                  translateY: subTabTransitionAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [10, 0],
                  }),
                },
              ],
            }}>
            {/* Section 1: Appearance */}
            <View
              style={{
                backgroundColor: AppColors.primaryLight,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: AppColors.grayBorderSecondary,
                overflow: 'hidden',
                padding: 14,
                gap: 12,
              }}>
              <Text
                style={{
                  fontFamily: AppFonts.interBold,
                  fontSize: 11,
                  lineHeight: 14,
                  color: AppColors.grayTextWeak,
                  letterSpacing: 0.8,
                }}>
                {t('settings.appearanceTheme')}
              </Text>

              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 10,
                    flex: 1,
                  }}>
                  <View
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      backgroundColor: AppColors.purpleShade50,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                    {isDark ? (
                      <SunIcon color={AppColors.purple} size={15} />
                    ) : (
                      <MoonIcon color={AppColors.purple} size={15} />
                    )}
                  </View>
                  <View style={{flex: 1}}>
                    <Text
                      style={{
                        fontFamily: AppFonts.interBold,
                        fontSize: 13.5,
                        lineHeight: 18,
                        color: AppColors.primaryBlack,
                      }}>
                      {t('settings.general.darkMode')}
                    </Text>
                    <Text
                      style={{
                        fontFamily: AppFonts.interRegular,
                        fontSize: 11,
                        lineHeight: 15,
                        color: AppColors.grayText,
                        marginTop: 1,
                      }}>
                      {t('settings.general.darkModeDescription')}
                    </Text>
                  </View>
                </View>

                <TouchableScale
                  accessible={true}
                  accessibilityRole="switch"
                  accessibilityLabel="Toggle Dark Theme"
                  accessibilityState={{checked: isDark}}
                  onPress={() => {
                    const newTheme = !isDark;
                    setIsDark(newTheme);
                    toggleGlobalTheme(newTheme);
                  }}
                  style={{
                    width: 42,
                    height: 24,
                    borderRadius: 12,
                    backgroundColor: isDark
                      ? AppColors.purple
                      : AppColors.grayBorderSecondary,
                    padding: 2,
                    justifyContent: 'center',
                    alignItems: isDark ? 'flex-end' : 'flex-start',
                  }}>
                  <View
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 10,
                      backgroundColor: AppColors.white,
                      shadowColor: AppColors.black,
                      shadowOpacity: 0.18,
                      shadowRadius: 2,
                      shadowOffset: {width: 0, height: 1},
                    }}
                  />
                </TouchableScale>
              </View>

              <View
                style={{
                  height: 1,
                  backgroundColor: AppColors.grayBorderSecondary,
                  opacity: 0.6,
                }}
              />

              {/* Language Selector Row */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 10,
                    flex: 1,
                  }}>
                  <View
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      backgroundColor: `${AppColors.blue600}14`,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                    <GlobeIcon color={AppColors.blue600} size={15} />
                  </View>
                  <View style={{flex: 1}}>
                    <Text
                      style={{
                        fontFamily: AppFonts.interBold,
                        fontSize: 13.5,
                        lineHeight: 18,
                        color: AppColors.primaryBlack,
                      }}>
                      {t('settings.general.language', 'Language')}
                    </Text>
                    <Text
                      style={{
                        fontFamily: AppFonts.interRegular,
                        fontSize: 11,
                        lineHeight: 15,
                        color: AppColors.grayText,
                        marginTop: 1,
                      }}>
                      {t(
                        'settings.general.languageDescription',
                        'Choose preferred display language',
                      )}
                    </Text>
                  </View>
                </View>

                <TouchableScale
                  onPress={() => {
                    triggerNativeHaptic('light');
                    setShowLanguageModal(true);
                  }}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: AppColors.purpleShade50,
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    borderRadius: 8,
                    gap: 5,
                    borderWidth: 1,
                    borderColor: `${AppColors.purple}20`,
                  }}>
                  {currentLangObj?.flag ? (
                    <Text style={{fontSize: 13}}>{currentLangObj.flag}</Text>
                  ) : (
                    <GlobeIcon size={14} color={AppColors.purple} />
                  )}
                  <Text
                    style={{
                      fontFamily: AppFonts.interSemiBold,
                      fontSize: 12,
                      color: AppColors.purple,
                    }}>
                    {currentLangObj?.nativeName || currentLangObj?.name || 'English'}
                  </Text>
                  <ForwardChevronIcon size={11} color={AppColors.purple} />
                </TouchableScale>
              </View>
            </View>

            {/* Section 2: Window & Layout */}
            <View
              style={{
                backgroundColor: AppColors.primaryLight,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: AppColors.grayBorderSecondary,
                overflow: 'hidden',
                padding: 14,
                gap: 14,
              }}>
              <Text
                style={{
                  fontFamily: AppFonts.interBold,
                  fontSize: 11,
                  lineHeight: 14,
                  color: AppColors.grayTextWeak,
                  letterSpacing: 0.8,
                }}>
                {t('settings.windowLayout')}
              </Text>

              {/* Modal Height */}
              <View style={{gap: 8}}>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 10,
                  }}>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 10,
                      flex: 1,
                    }}>
                    <View
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        backgroundColor: AppColors.purpleShade50,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                      <ScreenIcon color={AppColors.purple} size={15} />
                    </View>
                    <View style={{flex: 1}}>
                      <Text
                        style={{
                          fontFamily: AppFonts.interBold,
                          fontSize: 13.5,
                          lineHeight: 18,
                          color: AppColors.primaryBlack,
                        }}>
                        {t('settings.general.modalHeight')}
                      </Text>
                      <Text
                        style={{
                          fontFamily: AppFonts.interRegular,
                          fontSize: 11,
                          lineHeight: 15,
                          color: AppColors.grayText,
                          marginTop: 1,
                        }}>
                        {t('settings.general.modalHeightDescription')}
                      </Text>
                    </View>
                  </View>

                  {stagedHeight !== modalHeightPercent && (
                    <TouchableScale
                      onPress={() => {
                        setModalHeightPercent(stagedHeight);
                      }}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 5,
                        backgroundColor: AppColors.purple,
                        paddingHorizontal: 10,
                        paddingVertical: 5,
                        borderRadius: 7,
                        shadowColor: AppColors.purple,
                        shadowOffset: {width: 0, height: 1},
                        shadowOpacity: 0.28,
                        shadowRadius: 2,
                        elevation: 2,
                      }}>
                      <CheckIcon size={11} color={AppColors.white} />
                      <Text
                        style={{
                          fontFamily: AppFonts.interBold,
                          fontSize: 11,
                          color: AppColors.white,
                        }}>
                        Save ({stagedHeight}%)
                      </Text>
                    </TouchableScale>
                  )}
                </View>

                <View style={{marginTop: 6}}>
                  <Slider
                    value={stagedHeight}
                    onValueChange={setStagedHeight}
                    min={50}
                    max={90}
                    step={5}
                    quickPresets={[50, 60, 70, 80, 90]}
                    formatLabel={val => `${Math.round(val)}%`}
                  />
                </View>
              </View>

              <View
                style={{height: 1, backgroundColor: AppColors.dividerColor}}
              />

              {/* Peek-Through Opacity */}
              <View style={{gap: 8}}>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 10,
                  }}>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 10,
                      flex: 1,
                    }}>
                    <View
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        backgroundColor: 'rgba(6, 182, 212, 0.12)',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                      <EyeIcon color={'#06B6D4'} size={15} />
                    </View>
                    <View style={{flex: 1}}>
                      <Text
                        style={{
                          fontFamily: AppFonts.interBold,
                          fontSize: 13.5,
                          lineHeight: 18,
                          color: AppColors.primaryBlack,
                        }}>
                        {t('settings.general.peekOpacity', 'Peek-Through Opacity')}
                      </Text>
                      <Text
                        style={{
                          fontFamily: AppFonts.interRegular,
                          fontSize: 11,
                          lineHeight: 15,
                          color: AppColors.grayText,
                          marginTop: 1,
                        }}>
                        {t('settings.general.peekOpacityDescription', 'Transparency level when the eye icon is enabled')}
                      </Text>
                    </View>
                  </View>

                  <View
                    style={{
                      backgroundColor: 'rgba(6, 182, 212, 0.14)',
                      paddingHorizontal: 8,
                      paddingVertical: 3,
                      borderRadius: 6,
                      borderWidth: 1,
                      borderColor: 'rgba(6, 182, 212, 0.30)',
                    }}>
                    <Text
                      style={{
                        fontFamily: AppFonts.interBold,
                        fontSize: 12,
                        color: '#06B6D4',
                      }}>
                      {peekOpacity.toFixed(1)}
                    </Text>
                  </View>
                </View>

                <View style={{marginTop: 6}}>
                  <Slider
                    value={peekOpacity}
                    onValueChange={(val: number) => {
                      const rounded = Math.round(val * 10) / 10;
                      setPeekOpacity(rounded);
                    }}
                    min={0.1}
                    max={1.0}
                    step={0.1}
                    quickPresets={[0.1, 0.3, 0.5, 0.7, 1.0]}
                    formatLabel={(val: number) => val.toFixed(1)}
                  />
                </View>
              </View>

              <View
                style={{height: 1, backgroundColor: AppColors.dividerColor}}
              />

              {/* Modal Animation */}
              <View style={{gap: 8}}>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 10,
                  }}>
                  <View
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      backgroundColor: AppColors.purpleShade50,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                    <MotionIcon color={AppColors.purple} size={15} />
                  </View>
                  <View style={{flex: 1}}>
                    <Text
                      style={{
                        fontFamily: AppFonts.interBold,
                        fontSize: 13.5,
                        lineHeight: 18,
                        color: AppColors.primaryBlack,
                      }}>
                      {t('settings.general.modalAnimation')}
                    </Text>
                    <Text
                      style={{
                        fontFamily: AppFonts.interRegular,
                        fontSize: 11,
                        lineHeight: 15,
                        color: AppColors.grayText,
                        marginTop: 1,
                      }}>
                      {t('settings.general.modalAnimationDescription')}
                    </Text>
                  </View>
                </View>

                <View
                  style={{
                    flexDirection: 'row',
                    backgroundColor: AppColors.grayBackground,
                    borderRadius: 10,
                    padding: 3,
                    borderWidth: 1,
                    borderColor: AppColors.dividerColor,
                  }}>
                  {[
                    {key: 'slide' as const, label: 'Slide Up'},
                    {key: 'fade' as const, label: 'Fade'},
                    {key: 'none' as const, label: 'None'},
                  ].map(opt => {
                    const isActive = modalAnimationType === opt.key;
                    return (
                      <TouchableScale
                        key={opt.key}
                        accessible={true}
                        accessibilityRole="button"
                        accessibilityLabel={`Set transition animation to ${opt.label}`}
                        accessibilityState={{selected: isActive}}
                        onPress={() => setModalAnimationType(opt.key)}
                        style={{
                          flex: 1,
                          paddingVertical: 7,
                          alignItems: 'center',
                          borderRadius: 8,
                          backgroundColor: isActive
                            ? AppColors.purple
                            : 'transparent',
                        }}>
                        <Text
                          style={{
                            fontFamily: AppFonts.interBold,
                            fontSize: 11.5,
                            lineHeight: 15,
                            color: isActive
                              ? AppColors.white
                              : AppColors.grayText,
                          }}>
                          {opt.label}
                        </Text>
                      </TouchableScale>
                    );
                  })}
                </View>
              </View>
            </View>

            {/* Section 3: Default Startup Tab */}
            <View
              style={{
                backgroundColor: AppColors.primaryLight,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: AppColors.grayBorderSecondary,
                overflow: 'hidden',
                padding: 14,
                gap: 12,
              }}>
              <Text
                style={{
                  fontFamily: AppFonts.interBold,
                  fontSize: 11,
                  lineHeight: 14,
                  color: AppColors.grayTextWeak,
                  letterSpacing: 0.8,
                }}>
                {t('settings.startupDefault')}
              </Text>

              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                }}>
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    backgroundColor: AppColors.purpleShade50,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  <LayersIcon color={AppColors.purple} size={15} />
                </View>
                <View style={{flex: 1}}>
                  <Text
                    style={{
                      fontFamily: AppFonts.interBold,
                      fontSize: 13.5,
                      lineHeight: 18,
                      color: AppColors.primaryBlack,
                    }}>
                    {t('settings.general.defaultOpeningTab')}
                  </Text>
                  <Text
                    style={{
                      fontFamily: AppFonts.interRegular,
                      fontSize: 11,
                      lineHeight: 15,
                      color: AppColors.grayText,
                      marginTop: 1,
                    }}>
                    {t('settings.general.defaultOpeningTabDesc')}
                  </Text>
                </View>
              </View>

              {/* Sleek Interactive Dropdown Picker */}
              <View style={{marginTop: 6, gap: 6}}>
                <TouchableScale
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel={`Default opening tab: ${
                    allModules.find(m => m.key === defaultTab)?.label || 'APIs'
                  }`}
                  onPress={() => setIsDefaultTabDropdownOpen(prev => !prev)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: AppColors.grayBackground,
                    borderRadius: 10,
                    borderWidth: 1.5,
                    borderColor: isDefaultTabDropdownOpen
                      ? AppColors.purple
                      : AppColors.grayBorderSecondary,
                    paddingHorizontal: 14,
                    paddingVertical: 11,
                  }}>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 10,
                      flex: 1,
                    }}>
                    <View
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: AppColors.purple,
                      }}
                    />
                    <Text
                      style={{
                        fontFamily: AppFonts.interBold,
                        fontSize: 13.5,
                        lineHeight: 18,
                        color: AppColors.primaryBlack,
                      }}>
                      {allModules.find(m => m.key === defaultTab)
                        ? `#${allModules.find(m => m.key === defaultTab)?.id} ${
                            allModules.find(m => m.key === defaultTab)?.label
                          }`
                        : '#1 APIs (Network)'}
                    </Text>
                    <View
                      style={{
                        backgroundColor: `${AppColors.purple}14`,
                        paddingHorizontal: 6,
                        paddingVertical: 1.5,
                        borderRadius: 6,
                      }}>
                      <Text
                        style={{
                          fontFamily: AppFonts.interBold,
                          fontSize: 8.5,
                          color: AppColors.purple,
                        }}>
                        DEFAULT
                      </Text>
                    </View>
                  </View>

                  <View
                    style={{
                      transform: [
                        {rotate: isDefaultTabDropdownOpen ? '180deg' : '0deg'},
                      ],
                    }}>
                    <ChevronDownIcon color={AppColors.grayText} size={15} />
                  </View>
                </TouchableScale>

                {/* Dropdown Options List */}
                {isDefaultTabDropdownOpen && (
                  <View
                    style={{
                      backgroundColor: AppColors.primaryLight,
                      borderRadius: 10,
                      borderWidth: 1,
                      borderColor: AppColors.grayBorderSecondary,
                      overflow: 'hidden',
                      shadowColor: AppColors.black,
                      shadowOpacity: 0.08,
                      shadowRadius: 6,
                      shadowOffset: {width: 0, height: 3},
                      elevation: 4,
                    }}>
                    {allModules
                      .filter(
                        tab =>
                          tab.key === 'apis' ||
                          tabVisibility?.[tab.key as ActiveTab],
                      )
                      .map((tab, idx, arr) => {
                        const isActive = defaultTab === tab.key;
                        const isLast = idx === arr.length - 1;
                        return (
                          <TouchableScale
                            key={tab.key}
                            accessible={true}
                            accessibilityRole="button"
                            accessibilityLabel={`Select ${tab.label} as default tab`}
                            onPress={() => {
                              setDefaultTab(tab.key);
                              setIsDefaultTabDropdownOpen(false);
                            }}
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              paddingHorizontal: 14,
                              paddingVertical: 11,
                              backgroundColor: isActive
                                ? `${AppColors.purple}0F`
                                : 'transparent',
                              borderBottomWidth: isLast ? 0 : 1,
                              borderBottomColor: AppColors.dividerColor,
                            }}>
                            <View
                              style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 10,
                              }}>
                              <View
                                style={{
                                  width: 6,
                                  height: 6,
                                  borderRadius: 3,
                                  backgroundColor: isActive
                                    ? AppColors.purple
                                    : AppColors.grayTextWeak,
                                }}
                              />
                              <Text
                                style={{
                                  fontFamily: isActive
                                    ? AppFonts.interBold
                                    : AppFonts.interMedium,
                                  fontSize: 13,
                                  color: isActive
                                    ? AppColors.purple
                                    : AppColors.primaryBlack,
                                }}>
                                #{tab.id} {tab.label}
                              </Text>
                            </View>
                            {isActive && (
                              <CheckIcon size={14} color={AppColors.purple} />
                            )}
                          </TouchableScale>
                        );
                      })}
                  </View>
                )}
              </View>
            </View>

            {/* Section 4: Notifications & Toasts */}
            <View
              style={{
                backgroundColor: AppColors.primaryLight,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: AppColors.grayBorderSecondary,
                overflow: 'hidden',
                padding: 14,
                gap: 12,
              }}>
              <Text
                style={{
                  fontFamily: AppFonts.interBold,
                  fontSize: 11,
                  lineHeight: 14,
                  color: AppColors.grayTextWeak,
                  letterSpacing: 0.8,
                }}>
                NOTIFICATIONS & TOASTS
              </Text>

              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 10,
                    flex: 1,
                    marginRight: 10,
                  }}>
                  <View
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      backgroundColor: AppColors.purpleShade50,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                    <PackageIcon color={AppColors.purple} size={15} />
                  </View>
                  <View style={{flex: 1}}>
                    <Text
                      style={{
                        fontFamily: AppFonts.interBold,
                        fontSize: 13.5,
                        lineHeight: 18,
                        color: AppColors.primaryBlack,
                      }}>
                      NPM Update Toast
                    </Text>
                    <Text
                      style={{
                        fontFamily: AppFonts.interRegular,
                        fontSize: 11,
                        lineHeight: 15,
                        color: AppColors.grayText,
                        marginTop: 1,
                      }}>
                      {t('settings.npmUpdateToastDesc', 'Show a floating toast banner with countdown progress when a newer release is published on npm.')}
                    </Text>
                  </View>
                </View>

                <TouchableScale
                  accessible={true}
                  accessibilityRole="switch"
                  accessibilityLabel="Toggle NPM Update Toast"
                  accessibilityState={{checked: showUpdateToast}}
                  onPress={() => setShowUpdateToast(prev => !prev)}
                  style={{
                    width: 42,
                    height: 24,
                    borderRadius: 12,
                    backgroundColor: showUpdateToast
                      ? AppColors.purple
                      : AppColors.grayBorderSecondary,
                    padding: 2,
                    justifyContent: 'center',
                    alignItems: showUpdateToast ? 'flex-end' : 'flex-start',
                  }}>
                  <View
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 10,
                      backgroundColor: AppColors.white,
                      shadowColor: AppColors.black,
                      shadowOpacity: 0.18,
                      shadowRadius: 2,
                      shadowOffset: {width: 0, height: 1},
                    }}
                  />
                </TouchableScale>
              </View>
            </View>
          </Animated.View>
        )}

        {settingsActiveSubTab === 'limits' && (
          <Animated.View
            style={{
              gap: 14,
              opacity: subTabTransitionAnim,
              transform: [
                {
                  translateY: subTabTransitionAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [10, 0],
                  }),
                },
              ],
            }}>
            {/* Section 1: Device RAM & Auto Profile */}
            <View
              style={{
                backgroundColor: AppColors.primaryLight,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: AppColors.grayBorderSecondary,
                overflow: 'hidden',
                padding: 14,
                gap: 12,
              }}>
              <Text
                style={{
                  fontFamily: AppFonts.interBold,
                  fontSize: 11,
                  lineHeight: 14,
                  color: AppColors.grayTextWeak,
                  letterSpacing: 0.8,
                }}>
                DEVICE MEMORY & AUTO PROFILES
              </Text>

              {/* Auto RAM Limit Toggle */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 10,
                    flex: 1,
                  }}>
                  <View
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      backgroundColor: AppColors.purpleShade50,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                    <BrainIcon color={AppColors.purple} size={16} />
                  </View>
                  <View style={{flex: 1}}>
                    <Text
                      style={{
                        fontFamily: AppFonts.interBold,
                        fontSize: 13.5,
                        lineHeight: 18,
                        color: AppColors.primaryBlack,
                      }}>
                      Auto-Calculate Limits from RAM
                    </Text>
                    <Text
                      style={{
                        fontFamily: AppFonts.interRegular,
                        fontSize: 11,
                        lineHeight: 15,
                        color: AppColors.grayText,
                        marginTop: 1,
                      }}>
                      {t('settings.autoCalculateLimitsRamDesc', 'Dynamically sets log limits according to available device memory')}
                    </Text>
                  </View>
                </View>

                <TouchableScale
                  accessible={true}
                  accessibilityRole="switch"
                  accessibilityLabel="Toggle auto RAM limit calculation"
                  accessibilityState={{checked: isAutoRamLimitEnabled}}
                  onPress={() => setIsAutoRamLimitEnabled(prev => !prev)}
                  style={{
                    width: 42,
                    height: 24,
                    borderRadius: 12,
                    backgroundColor: isAutoRamLimitEnabled
                      ? AppColors.purple
                      : AppColors.grayBorderSecondary,
                    padding: 2,
                    justifyContent: 'center',
                    alignItems: isAutoRamLimitEnabled
                      ? 'flex-end'
                      : 'flex-start',
                  }}>
                  <View
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 10,
                      backgroundColor: AppColors.white,
                      shadowColor: AppColors.black,
                      shadowOpacity: 0.18,
                      shadowRadius: 2,
                      shadowOffset: {width: 0, height: 1},
                    }}
                  />
                </TouchableScale>
              </View>

              <View
                style={{height: 1, backgroundColor: AppColors.dividerColor}}
              />

              {/* Device Free RAM Display */}
              <View
                style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    backgroundColor: isAutoRamLimitEnabled
                      ? `${AppColors.purple}14`
                      : AppColors.grayBackground,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  <SignalIcon
                    color={
                      isAutoRamLimitEnabled
                        ? AppColors.purple
                        : AppColors.grayTextWeak
                    }
                    size={15}
                  />
                </View>
                <View style={{flex: 1}}>
                  <Text
                    style={{
                      fontFamily: AppFonts.interBold,
                      fontSize: 13.5,
                      lineHeight: 18,
                      color: isAutoRamLimitEnabled
                        ? AppColors.primaryBlack
                        : AppColors.grayText,
                    }}>
                    Detected Available RAM
                  </Text>
                  <Text
                    style={{
                      fontFamily: AppFonts.interRegular,
                      fontSize: 11,
                      lineHeight: 15,
                      color: AppColors.grayText,
                      marginTop: 1,
                    }}>
                    {deviceFreeRamMb} MB available on device
                  </Text>
                </View>
                <View
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 5,
                    borderRadius: 8,
                    backgroundColor: isAutoRamLimitEnabled
                      ? `${AppColors.purple}12`
                      : AppColors.grayBackground,
                    borderWidth: 1,
                    borderColor: isAutoRamLimitEnabled
                      ? `${AppColors.purple}26`
                      : AppColors.dividerColor,
                  }}>
                  <Text
                    style={{
                      fontFamily: AppFonts.interBold,
                      fontSize: 12,
                      lineHeight: 15,
                      color: isAutoRamLimitEnabled
                        ? AppColors.purple
                        : AppColors.grayText,
                    }}>
                    {deviceFreeRamMb} MB
                  </Text>
                </View>
              </View>

              {/* Profile Overview */}
              <View
                style={{
                  marginTop: 4,
                  paddingTop: 8,
                  borderTopWidth: 1,
                  borderTopColor: AppColors.dividerColor,
                  gap: 6,
                }}>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}>
                  <Text
                    style={{
                      fontFamily: AppFonts.interBold,
                      fontSize: 11.5,
                      lineHeight: 15,
                      color: AppColors.purple,
                    }}>
                    Profile: {autoRamProfile.profileName}
                  </Text>
                  <View
                    style={{
                      backgroundColor: isAutoRamLimitEnabled
                        ? `${AppColors.emerald500}18`
                        : `${AppColors.purple}18`,
                      paddingHorizontal: 7,
                      paddingVertical: 2.5,
                      borderRadius: 4,
                    }}>
                    <Text
                      style={{
                        fontFamily: AppFonts.interBold,
                        fontSize: 9.5,
                        color: isAutoRamLimitEnabled
                          ? AppColors.emerald500
                          : AppColors.purple,
                      }}>
                      {isAutoRamLimitEnabled ? 'AUTO-TUNED' : 'MANUAL'}
                    </Text>
                  </View>
                </View>

                <View
                  style={{
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    gap: 8,
                    marginTop: 4,
                  }}>
                  {[
                    {
                      label: 'Logs',
                      value: isAutoRamLimitEnabled
                        ? autoRamProfile.maxConsoleLogs
                        : maxConsoleLogs,
                      color: AppColors.sky500,
                    },
                    {
                      label: 'Analytics',
                      value: isAutoRamLimitEnabled
                        ? autoRamProfile.maxAnalyticsEvents
                        : maxAnalyticsEventsLimit,
                      color: AppColors.purple,
                    },
                    {
                      label: 'Crash',
                      value: isAutoRamLimitEnabled
                        ? autoRamProfile.maxCrashRecords
                        : maxCrashLogs,
                      color: AppColors.errorColor,
                    },
                  ].map(item => (
                    <View
                      key={item.label}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 4,
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: 6,
                        backgroundColor: `${item.color}14`,
                        borderWidth: 1,
                        borderColor: `${item.color}33`,
                      }}>
                      <Text
                        style={{
                          fontFamily: AppFonts.interBold,
                          fontSize: 10.5,
                          lineHeight: 14,
                          color: item.color,
                        }}>
                        {item.label}:
                      </Text>
                      <Text
                        style={{
                          fontFamily: AppFonts.interBold,
                          fontSize: 10.5,
                          lineHeight: 14,
                          color: item.color,
                        }}>
                        {item.value} max
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>

            {/* Section 2: Memory-Safe OS Pruning Shield */}
            <View
              style={{
                backgroundColor: AppColors.primaryLight,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: AppColors.grayBorderSecondary,
                overflow: 'hidden',
                padding: 14,
                gap: 12,
              }}>
              <Text
                style={{
                  fontFamily: AppFonts.interBold,
                  fontSize: 11,
                  lineHeight: 14,
                  color: AppColors.grayTextWeak,
                  letterSpacing: 0.8,
                }}>
                LOW MEMORY PRESSURE PROTECTION
              </Text>

              <View
                style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    backgroundColor: `${AppColors.emerald500}14`,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  <ShieldAlertIcon color={AppColors.emerald500} size={15} />
                </View>
                <View style={{flex: 1}}>
                  <Text
                    style={{
                      fontFamily: AppFonts.interBold,
                      fontSize: 13.5,
                      lineHeight: 18,
                      color: AppColors.primaryBlack,
                    }}>
                    OS Memory Warning Guard
                  </Text>
                  <Text
                    style={{
                      fontFamily: AppFonts.interRegular,
                      fontSize: 11,
                      lineHeight: 15,
                      color: AppColors.grayText,
                      marginTop: 1,
                    }}>
                    {t('settings.osMemoryWarningGuardDesc', 'Automatically prunes in-memory buffers by 50% when the OS signals low memory')}
                  </Text>
                </View>
                <View
                  style={{
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    borderRadius: 6,
                    backgroundColor: `${AppColors.emerald500}18`,
                  }}>
                  <Text
                    style={{
                      fontFamily: AppFonts.interBold,
                      fontSize: 10,
                      color: AppColors.emerald500,
                    }}>
                    ACTIVE
                  </Text>
                </View>
              </View>

              <View
                style={{height: 1, backgroundColor: AppColors.dividerColor}}
              />

              {/* Instant Prune Button */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 10,
                }}>
                <View style={{flex: 1}}>
                  <Text
                    style={{
                      fontFamily: AppFonts.interBold,
                      fontSize: 13,
                      color: AppColors.primaryBlack,
                    }}>
                    {t('settings.memory.manualTitle', 'Manual Memory Cleanup')}
                  </Text>
                  <Text
                    style={{
                      fontFamily: AppFonts.interRegular,
                      fontSize: 11,
                      color: AppColors.grayText,
                      marginTop: 1,
                    }}>
                    {t(
                      'settings.memory.manualDescription',
                      'Prune older entries across all log stores and free RAM',
                    )}
                  </Text>
                </View>
                <TouchableScale
                  onPress={() => {
                    const summary = pruneAllLogs('manual', 0.5);
                    showToast(
                      t(
                        'settings.memory.pruned',
                        {count: summary.totalPruned},
                        `Pruned ${summary.totalPruned} items from memory`,
                      ),
                    );
                  }}
                  style={{
                    backgroundColor: AppColors.purple,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 8,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 5,
                  }}>
                  <TrashIcon size={13} color={AppColors.white} />
                  <Text
                    style={{
                      fontFamily: AppFonts.interBold,
                      fontSize: 11.5,
                      color: AppColors.white,
                    }}>
                    Prune Now
                  </Text>
                </TouchableScale>
              </View>
            </View>
          </Animated.View>
        )}
        {settingsActiveSubTab === 'capture' && (
          <Animated.View
            style={{
              gap: 16,
              opacity: subTabTransitionAnim,
              transform: [
                {
                  translateY: subTabTransitionAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [10, 0],
                  }),
                },
              ],
            }}>
            {/* Floating Quick Capture Widget Card */}
            <View
              style={{
                backgroundColor: AppColors.primaryLight,
                padding: 16,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: AppColors.grayBorderSecondary,
                gap: 12,
              }}>
              <View
                style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    backgroundColor: `${AppColors.rose500}1A`,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  <VideoCameraIcon color={AppColors.rose500} size={16} />
                </View>
                <View style={{flex: 1}}>
                  <Text
                    style={{
                      fontFamily: AppFonts.interBold,
                      fontSize: 14,
                      lineHeight: 18,
                      color: AppColors.primaryBlack,
                    }}>
                    {t(
                      'settings.media.floatingWidgetTitle',
                      'Floating Capture Widget',
                    )}
                  </Text>
                  <Text
                    style={{
                      fontFamily: AppFonts.interRegular,
                      fontSize: 11,
                      lineHeight: 15,
                      color: AppColors.grayText,
                      marginTop: 1,
                    }}>
                    {t(
                      'settings.media.floatingWidgetDesc',
                      'On-screen floating button to quickly take screenshots and record videos (Disabled by default)',
                    )}
                  </Text>
                </View>
              </View>

              {renderSettingRow({
                icon: <CameraIcon color={AppColors.purple} size={16} />,
                label: t(
                  'settings.media.enableFloatingWidget',
                  'Enable Floating Widget',
                ),
                description: t(
                  'settings.media.enableFloatingWidgetDesc',
                  'Shows draggable quick screenshot & video recording button on screen',
                ),
                isLast: true,
                onPress: () => {
                  triggerNativeHaptic('light');
                  setCaptureWidgetEnabled(prev => !prev);
                  showToast(
                    `Capture widget: ${!captureWidgetEnabled ? 'ON' : 'OFF'}`,
                  );
                },
                right: (
                  <TouchableScale
                    onPress={() => {
                      triggerNativeHaptic('light');
                      setCaptureWidgetEnabled(prev => !prev);
                      showToast(
                        `Capture widget: ${!captureWidgetEnabled ? 'ON' : 'OFF'}`,
                      );
                    }}
                    style={{
                      paddingHorizontal: 10,
                      paddingVertical: 5,
                      borderRadius: 7,
                      backgroundColor: captureWidgetEnabled
                        ? `${AppColors.emerald500}26`
                        : `${AppColors.grayText}20`,
                      borderWidth: 1,
                      borderColor: captureWidgetEnabled
                        ? `${AppColors.emerald500}4D`
                        : `${AppColors.grayText}33`,
                    }}>
                    <Text
                      style={{
                        fontFamily: AppFonts.interBold,
                        fontSize: 10.5,
                        color: captureWidgetEnabled
                          ? AppColors.emerald500
                          : AppColors.grayText,
                      }}>
                      {captureWidgetEnabled
                        ? t('settings.media.enabled', 'ON')
                        : 'OFF'}
                    </Text>
                  </TouchableScale>
                ),
              })}
            </View>

            {/* Screenshot Preferences Card */}
            <View
              style={{
                backgroundColor: AppColors.primaryLight,
                padding: 16,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: AppColors.grayBorderSecondary,
                gap: 12,
              }}>
              <View
                style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    backgroundColor: AppColors.purpleShade50,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  <CameraIcon color={AppColors.purple} size={16} />
                </View>
                <View style={{flex: 1}}>
                  <Text
                    style={{
                      fontFamily: AppFonts.interBold,
                      fontSize: 14,
                      lineHeight: 18,
                      color: AppColors.primaryBlack,
                    }}>
                    {t(
                      'settings.media.screenshotCardTitle',
                      'Screenshot Capture Settings',
                    )}
                  </Text>
                  <Text
                    style={{
                      fontFamily: AppFonts.interRegular,
                      fontSize: 11,
                      lineHeight: 15,
                      color: AppColors.grayText,
                      marginTop: 1,
                    }}>
                    {t(
                      'settings.media.screenshotCardDesc',
                      'Image encoding format, compression quality and overlay auto-hide',
                    )}
                  </Text>
                </View>
              </View>

              {renderSettingRow({
                icon: <ImageIcon color={AppColors.purple} size={16} />,
                label: t('settings.media.imageFormat', 'Image Format'),
                description: t(
                  'settings.media.imageFormatDesc',
                  'Export formats (PNG lossless, JPEG lossy, WebP)',
                ),
                right: (
                  <View style={{flexDirection: 'row', gap: 5}}>
                    {(['png', 'jpeg', 'webp'] as const).map(fmt => {
                      const isSelected = captureImageFormat === fmt;
                      return (
                        <TouchableScale
                          key={fmt}
                          onPress={() => {
                            triggerNativeHaptic('light');
                            setCaptureImageFormat(fmt);
                            showToast(`Screenshot format: ${fmt.toUpperCase()}`);
                          }}
                          style={{
                            paddingHorizontal: 9,
                            paddingVertical: 5,
                            borderRadius: 7,
                            backgroundColor: isSelected
                              ? AppColors.purple
                              : `${AppColors.purple}14`,
                            borderWidth: 1,
                            borderColor: isSelected
                              ? AppColors.purple
                              : `${AppColors.purple}2E`,
                          }}>
                          <Text
                            style={{
                              fontFamily: AppFonts.interBold,
                              fontSize: 10.5,
                              color: isSelected
                                ? AppColors.white
                                : AppColors.purple,
                            }}>
                            {fmt.toUpperCase()}
                          </Text>
                        </TouchableScale>
                      );
                    })}
                  </View>
                ),
              })}

              {renderSettingRow({
                icon: <EyeIcon color={AppColors.purple} size={16} />,
                label: t(
                  'settings.media.autoHide',
                  'Auto-Hide Inspector During Capture',
                ),
                description: t(
                  'settings.media.autoHideDesc',
                  'Temporarily hides the inspector overlay during screen capture',
                ),
                isLast: true,
                onPress: () => {
                  triggerNativeHaptic('light');
                  setCaptureAutoHide(prev => !prev);
                  showToast(`Auto-hide overlay: ${!captureAutoHide ? 'ON' : 'OFF'}`);
                },
                right: (
                  <TouchableScale
                    onPress={() => {
                      triggerNativeHaptic('light');
                      setCaptureAutoHide(prev => !prev);
                      showToast(`Auto-hide overlay: ${!captureAutoHide ? 'ON' : 'OFF'}`);
                    }}
                    style={{
                      paddingHorizontal: 10,
                      paddingVertical: 5,
                      borderRadius: 7,
                      backgroundColor: captureAutoHide
                        ? `${AppColors.emerald500}26`
                        : `${AppColors.grayText}20`,
                      borderWidth: 1,
                      borderColor: captureAutoHide
                        ? `${AppColors.emerald500}4D`
                        : `${AppColors.grayText}33`,
                    }}>
                    <Text
                      style={{
                        fontFamily: AppFonts.interBold,
                        fontSize: 10.5,
                        color: captureAutoHide
                          ? AppColors.emerald500
                          : AppColors.grayText,
                      }}>
                      {captureAutoHide
                        ? t('settings.media.enabled', 'ON')
                        : 'OFF'}
                    </Text>
                  </TouchableScale>
                ),
              })}
            </View>

            {/* Video & GIF Recording Card */}
            <View
              style={{
                backgroundColor: AppColors.primaryLight,
                padding: 16,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: AppColors.grayBorderSecondary,
                gap: 12,
              }}>
              <View
                style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    backgroundColor: AppColors.purpleShade50,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  <VideoCameraIcon color={AppColors.purple} size={16} />
                </View>
                <View style={{flex: 1}}>
                  <Text
                    style={{
                      fontFamily: AppFonts.interBold,
                      fontSize: 14,
                      lineHeight: 18,
                      color: AppColors.primaryBlack,
                    }}>
                    {t(
                      'settings.media.videoCardTitle',
                      'Video Recording & GIF Conversion',
                    )}
                  </Text>
                  <Text
                    style={{
                      fontFamily: AppFonts.interRegular,
                      fontSize: 11,
                      lineHeight: 15,
                      color: AppColors.grayText,
                      marginTop: 1,
                    }}>
                    {t(
                      'settings.media.videoCardDesc',
                      'ReplayKit hardware encoding, frame capture fallback and GIF generation',
                    )}
                  </Text>
                </View>
              </View>

              {renderSettingRow({
                icon: <MicrophoneIcon color={AppColors.purple} size={16} />,
                label: t('settings.media.audioMode', 'Audio Source'),
                description: t(
                  'settings.media.audioModeDesc',
                  'Record video with muted, app audio, or microphone commentary',
                ),
                right: (
                  <View style={{flexDirection: 'row', gap: 5}}>
                    {(
                      [
                        {key: 'none', label: 'Muted'},
                        {key: 'app', label: 'App'},
                        {key: 'mic', label: 'Mic'},
                      ] as const
                    ).map(aud => {
                      const isSelected = captureAudioMode === aud.key;
                      return (
                        <TouchableScale
                          key={aud.key}
                          onPress={() => {
                            triggerNativeHaptic('light');
                            setCaptureAudioMode(aud.key);
                            showToast(`Audio source: ${aud.label}`);
                          }}
                          style={{
                            paddingHorizontal: 8,
                            paddingVertical: 5,
                            borderRadius: 7,
                            backgroundColor: isSelected
                              ? AppColors.purple
                              : `${AppColors.purple}14`,
                            borderWidth: 1,
                            borderColor: isSelected
                              ? AppColors.purple
                              : `${AppColors.purple}2E`,
                          }}>
                          <Text
                            style={{
                              fontFamily: AppFonts.interBold,
                              fontSize: 10.5,
                              color: isSelected
                                ? AppColors.white
                                : AppColors.purple,
                            }}>
                            {aud.label}
                          </Text>
                        </TouchableScale>
                      );
                    })}
                  </View>
                ),
              })}

              {renderSettingRow({
                icon: <FilmIcon color={AppColors.purple} size={16} />,
                label: t(
                  'settings.media.frameRate',
                  'Recording Frame Rate (FPS)',
                ),
                description: t(
                  'settings.media.frameRateDesc',
                  'Target video smoothness: 15, 24, 30, or 60 FPS',
                ),
                right: (
                  <View style={{flexDirection: 'row', gap: 5}}>
                    {([15, 24, 30, 60] as const).map(fps => {
                      const isSelected = captureFps === fps;
                      return (
                        <TouchableScale
                          key={fps}
                          onPress={() => {
                            triggerNativeHaptic('light');
                            setCaptureFps(fps);
                            showToast(`Recording FPS: ${fps}`);
                          }}
                          style={{
                            paddingHorizontal: 7,
                            paddingVertical: 5,
                            borderRadius: 7,
                            backgroundColor: isSelected
                              ? AppColors.purple
                              : `${AppColors.purple}14`,
                            borderWidth: 1,
                            borderColor: isSelected
                              ? AppColors.purple
                              : `${AppColors.purple}2E`,
                          }}>
                          <Text
                            style={{
                              fontFamily: AppFonts.interBold,
                              fontSize: 10.5,
                              color: isSelected
                                ? AppColors.white
                                : AppColors.purple,
                            }}>
                            {fps}fps
                          </Text>
                        </TouchableScale>
                      );
                    })}
                  </View>
                ),
              })}

              {renderSettingRow({
                icon: <GifIcon color={AppColors.purple} size={16} />,
                label: t('settings.media.gifAutoOpt', 'Auto GIF Optimization'),
                description: t(
                  'settings.media.gifAutoOptDesc',
                  'Automatic palette reduction and frame skip for lightweight animated GIFs',
                ),
                isLast: true,
                onPress: () => {
                  triggerNativeHaptic('light');
                  setCaptureAutoGif(prev => !prev);
                  showToast(`GIF optimization: ${!captureAutoGif ? 'ON' : 'OFF'}`);
                },
                right: (
                  <TouchableScale
                    onPress={() => {
                      triggerNativeHaptic('light');
                      setCaptureAutoGif(prev => !prev);
                      showToast(`GIF optimization: ${!captureAutoGif ? 'ON' : 'OFF'}`);
                    }}
                    style={{
                      paddingHorizontal: 10,
                      paddingVertical: 5,
                      borderRadius: 7,
                      backgroundColor: captureAutoGif
                        ? `${AppColors.emerald500}26`
                        : `${AppColors.grayText}20`,
                      borderWidth: 1,
                      borderColor: captureAutoGif
                        ? `${AppColors.emerald500}4D`
                        : `${AppColors.grayText}33`,
                    }}>
                    <Text
                      style={{
                        fontFamily: AppFonts.interBold,
                        fontSize: 10.5,
                        color: captureAutoGif
                          ? AppColors.emerald500
                          : AppColors.grayText,
                      }}>
                      {captureAutoGif ? 'ON' : 'OFF'}
                    </Text>
                  </TouchableScale>
                ),
              })}
            </View>

            {/* Media Storage Cache Management */}
            <View
              style={{
                backgroundColor: AppColors.primaryLight,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: AppColors.grayBorderSecondary,
                padding: 16,
              }}>
              {renderSettingRow({
                icon: <TrashIcon color={AppColors.errorColor} size={16} />,
                label: t(
                  'settings.media.purgeAll',
                  'Purge Captured Media Cache',
                ),
                description: t(
                  'settings.media.purgeAllDesc',
                  'Delete all local screenshots, screen recordings and converted GIFs',
                ),
                isLast: true,
                onPress: () => {
                  Alert.alert(
                    t(
                      'settings.media.purgeConfirmTitle',
                      'Purge Media Storage?',
                    ),
                    t(
                      'settings.media.purgeConfirmMessage',
                      'This will permanently delete all captured screenshots and videos from disk.',
                    ),
                    [
                      {text: t('common.cancel', 'Cancel'), style: 'cancel'},
                      {
                        text: t('settings.media.purgeCacheBtn', 'Purge All'),
                        style: 'destructive',
                        onPress: async () => {
                          await ScreenCapture.clearAllMedia();
                          showToast(
                            t(
                              'settings.media.purgedSuccess',
                              'Media cache cleared successfully',
                            ),
                          );
                        },
                      },
                    ],
                  );
                },
                right: (
                  <View
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 8,
                      backgroundColor: `${AppColors.errorColor}14`,
                      borderWidth: 1,
                      borderColor: `${AppColors.errorColor}33`,
                    }}>
                    <Text
                      style={{
                        fontFamily: AppFonts.interBold,
                        fontSize: 11,
                        lineHeight: 14,
                        color: AppColors.errorColor,
                      }}>
                      {t('settings.media.purgeCacheBtn', 'Purge All')}
                    </Text>
                  </View>
                ),
              })}
            </View>
          </Animated.View>
        )}

        <View style={{height: 48}} />
      </ScrollView>
    </View>
  );

  let content: React.ReactNode = null;

  if (settingsPage === 'apis') {
    content = (
      <ScrollView
        style={{flex: 1}}
        contentContainerStyle={{padding: 16, paddingBottom: 100, gap: 12}}>

        {/* Hidden URL Filters (Regex) Configuration */}
        <View
          style={{
            backgroundColor: AppColors.primaryLight,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: AppColors.grayBorderSecondary,
            padding: 16,
            gap: 12,
          }}>
          <View style={{flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8}}>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1}}>
              <EyeIcon color={AppColors.purple} size={16} />
              <View style={{flex: 1}}>
                <Text
                  style={{
                    fontFamily: AppFonts.interBold,
                    fontSize: 13.5,
                    lineHeight: 18,
                    color: AppColors.primaryBlack,
                  }}>
                  {t('settings.apis.hideUrlRegexTitle', 'Hidden URL Filters (Regex)')}
                </Text>
                <Text
                  style={{
                    fontFamily: AppFonts.interRegular,
                    fontSize: 11,
                    lineHeight: 15,
                    color: AppColors.grayTextWeak,
                    marginTop: 2,
                  }}>
                  {t(
                    'settings.apis.hideUrlRegexDesc',
                    'Hide matching URLs from Network list and search results (calls will still execute normally).',
                  )}
                </Text>
              </View>
            </View>
            {hiddenUrlPatterns.length > 0 && (
              <TouchableScale
                onPress={() => {
                  triggerNativeHaptic('light');
                  setHiddenUrlPatterns([...DEFAULT_HIDDEN_URL_PATTERNS]);
                  showToast(t('settings.apis.resetFilterToast', 'Reset to default URL filters'));
                }}
                hitSlop={8}
                style={{
                  paddingHorizontal: 8,
                  paddingVertical: 4.5,
                  borderRadius: 6,
                  backgroundColor: `${AppColors.purple}14`,
                  borderWidth: 1,
                  borderColor: `${AppColors.purple}33`,
                  alignSelf: 'flex-start',
                }}>
                <Text
                  style={{
                    fontFamily: AppFonts.interSemiBold,
                    fontSize: 10,
                    lineHeight: 13,
                    color: AppColors.purple,
                  }}>
                  {t('common.resetDefaults', 'Reset Defaults')}
                </Text>
              </TouchableScale>
            )}
          </View>

          {/* Add New Regex / URL Pattern Input */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              backgroundColor: AppColors.grayBackground,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: AppColors.grayBorderSecondary,
              paddingHorizontal: 10,
              paddingVertical: Platform.OS === 'ios' ? 8 : 4,
            }}>
            <CodeBracketsIcon size={14} color={AppColors.grayTextWeak} />
            <TextInput
              style={{
                flex: 1,
                fontFamily: AppFonts.interMedium,
                fontSize: 12,
                lineHeight: 16,
                color: AppColors.primaryBlack,
                padding: 0,
              }}
              placeholder={t('settings.apis.addPatternPlaceholder', 'e.g. https://api.example.com or .*analytics.*')}
              placeholderTextColor={AppColors.grayTextWeak}
              value={newUrlPattern}
              onChangeText={setNewUrlPattern}
              autoCapitalize="none"
              autoCorrect={false}
              onSubmitEditing={handleAddUrlPattern}
              returnKeyType="done"
            />
            <TouchableScale
              onPress={handleAddUrlPattern}
              disabled={!newUrlPattern.trim()}
              style={{
                paddingHorizontal: 10,
                paddingVertical: 5.5,
                borderRadius: 7,
                backgroundColor: newUrlPattern.trim() ? AppColors.purple : `${AppColors.purple}33`,
              }}>
              <Text
                style={{
                  fontFamily: AppFonts.interBold,
                  fontSize: 11,
                  lineHeight: 14,
                  color: AppColors.white,
                }}>
                {t('common.add', '+ Add')}
              </Text>
            </TouchableScale>
          </View>

          {/* List of active patterns */}
          <View style={{gap: 6}}>
            {hiddenUrlPatterns.map((pattern, idx) => {
              const isDefault = DEFAULT_HIDDEN_URL_PATTERNS.includes(pattern);
              return (
                <View
                  key={`${pattern}-${idx}`}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: isDefault
                      ? `${AppColors.slate200}44`
                      : AppColors.grayBackground,
                    borderRadius: 8,
                    paddingHorizontal: 10,
                    paddingVertical: 7,
                    borderWidth: 1,
                    borderColor: isDefault
                      ? `${AppColors.grayBorderSecondary}`
                      : AppColors.grayBorderSecondary,
                    gap: 8,
                  }}>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                      flex: 1,
                      minWidth: 0,
                    }}>
                    <View
                      style={{
                        paddingHorizontal: 5,
                        paddingVertical: 1.5,
                        borderRadius: 4,
                        backgroundColor: isDefault
                          ? `${AppColors.blue500}18`
                          : `${AppColors.purple}1F`,
                      }}>
                      <Text
                        style={{
                          fontFamily: AppFonts.interBold,
                          fontSize: 9,
                          lineHeight: 11,
                          color: isDefault
                            ? AppColors.blue600
                            : AppColors.purple,
                        }}>
                        {isDefault ? 'DEFAULT' : 'CUSTOM'}
                      </Text>
                    </View>
                    <Text
                      style={{
                        fontFamily: AppFonts.interMedium,
                        fontSize: 11.5,
                        lineHeight: 15,
                        color: isDefault
                          ? AppColors.grayTextStrong
                          : AppColors.primaryBlack,
                        flex: 1,
                      }}
                      numberOfLines={1}
                      ellipsizeMode="middle">
                      {pattern}
                    </Text>
                  </View>
                  {isDefault ? (
                    <View
                      style={{
                        padding: 5,
                        borderRadius: 5,
                        backgroundColor: `${AppColors.grayTextWeak}18`,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                      <LockIcon size={12} color={AppColors.grayTextWeak} />
                    </View>
                  ) : (
                    <TouchableScale
                      onPress={() => handleRemoveUrlPattern(idx)}
                      hitSlop={8}
                      style={{
                        padding: 5,
                        borderRadius: 5,
                        backgroundColor: `${AppColors.errorColor}14`,
                      }}>
                      <TrashIcon size={12} color={AppColors.errorColor} />
                    </TouchableScale>
                  )}
                </View>
              );
            })}
            {hiddenUrlPatterns.length === 0 && (
              <Text
                style={{
                  fontFamily: AppFonts.interRegular,
                  fontSize: 11,
                  lineHeight: 15,
                  color: AppColors.grayTextWeak,
                  textAlign: 'center',
                  paddingVertical: 8,
                }}>
                {t('settings.apis.noFiltersActive', 'No URL filters active. All URLs will be displayed.')}
              </Text>
            )}
          </View>
        </View>

        {/* Clear Network Logs Card */}
        <View
          style={{
            backgroundColor: AppColors.primaryLight,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: AppColors.grayBorderSecondary,
            padding: 16,
          }}>
          {renderSettingRow({
            icon: <TrashIcon color={AppColors.errorColor} size={16} />,
            label: t('settings.apis.clearNetworkLogs'),
            description: t('settings.apis.clearNetworkLogsDescription', {
              count: logs.length,
            }),
            isLast: true,
            onPress: () => {
              clearNetworkLogs();
              setSelected(null);
              Alert.alert(
                t('common.success'),
                t('settings.apis.networkLogsCleared'),
              );
            },
            right: (
              <View
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 8,
                  backgroundColor: `${AppColors.errorColor}14`,
                  borderWidth: 1,
                  borderColor: `${AppColors.errorColor}33`,
                }}>
                <Text
                  style={{
                    fontFamily: AppFonts.interBold,
                    fontSize: 11,
                    lineHeight: 14,
                    color: AppColors.errorColor,
                  }}>
                  {t('common.clear')}
                </Text>
              </View>
            ),
          })}
        </View>
        <View style={{height: 48}} />
      </ScrollView>
    );
  } else if (settingsPage === 'logs') {
    content = (
      <ScrollView
        style={{flex: 1}}
        contentContainerStyle={{padding: 16, paddingBottom: 100, gap: 12}}>
        <View
          style={{
            backgroundColor: AppColors.primaryLight,
            padding: 16,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: AppColors.grayBorderSecondary,
            gap: 4,
          }}>
          {renderSettingRow({
            icon: <TerminalIcon color={AppColors.purple} size={16} />,
            label: t('settings.logs.maxConsoleLogs'),
            description: t('settings.logs.maxConsoleLogsDescription'),
            numericInput: {
              value: maxConsoleLogs,
              onChange: setMaxConsoleLogs,
              min: 10,
              max: 100,
              placeholder: 'Enter max logs (10-100)',
            },
          })}
          <View style={{height: 1, backgroundColor: AppColors.dividerColor}} />
          <Text
            style={{
              fontFamily: AppFonts.interBold,
              fontSize: 13,
              lineHeight: 17,
              color: AppColors.primaryBlack,
              paddingTop: 6,
            }}>
            {t('settings.logs.logLevels')}
          </Text>
          {(['info', 'warn', 'error'] as const).map(level => {
            const isLvlActive = showConsoleLevels?.[level];
            const levelColor =
              level === 'error'
                ? AppColors.errorColor
                : level === 'warn'
                ? AppColors.warningIconGold
                : AppColors.skyBlue;
            const label =
              level === 'info'
                ? t('settings.logs.showInfo')
                : level === 'warn'
                ? t('settings.logs.showWarn')
                : t('settings.logs.showError');
            const desc =
              level === 'info'
                ? t('settings.logs.showInfoDesc')
                : level === 'warn'
                ? t('settings.logs.showWarnDesc')
                : t('settings.logs.showErrorDesc');

            return renderSettingRow({
              icon: (
                <View
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: 6,
                    backgroundColor: levelColor,
                  }}
                />
              ),
              label,
              description: desc,
              isLast: level === 'error',
              onPress: () =>
                setShowConsoleLevels(prev => ({
                  ...prev,
                  [level]: !prev[level],
                })),
              right: (
                <View
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 6,
                    borderWidth: 2,
                    borderColor: isLvlActive
                      ? AppColors.purple
                      : AppColors.grayTextWeak,
                    backgroundColor: isLvlActive
                      ? `${AppColors.purple}1A`
                      : 'transparent',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  {isLvlActive && (
                    <CheckIcon size={12} color={AppColors.purple} />
                  )}
                </View>
              ),
            });
          })}
        </View>

        {/* Log Deduplication Card */}
        <View
          style={{
            backgroundColor: AppColors.primaryLight,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: AppColors.grayBorderSecondary,
            overflow: 'hidden',
            padding: 16,
            gap: 14,
          }}>
          <Text
            style={{
              fontFamily: AppFonts.interBold,
              fontSize: 11,
              lineHeight: 14,
              color: AppColors.grayTextWeak,
              letterSpacing: 0.8,
            }}>
            {t('settings.logFiltersDeduplication')}
          </Text>

          {/* Show Duplicate Logs */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                flex: 1,
              }}>
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  backgroundColor: AppColors.purpleShade50,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <EyeIcon color={AppColors.purple} size={15} />
              </View>
              <View style={{flex: 1}}>
                <Text
                  style={{
                    fontFamily: AppFonts.interBold,
                    fontSize: 13.5,
                    lineHeight: 18,
                    color: AppColors.primaryBlack,
                  }}>
                  {t('settings.general.duplicateLogs')}
                </Text>
                <Text
                  style={{
                    fontFamily: AppFonts.interRegular,
                    fontSize: 11,
                    lineHeight: 15,
                    color: AppColors.grayText,
                    marginTop: 1,
                  }}>
                  {t('settings.general.duplicateLogsDescription')}
                </Text>
              </View>
            </View>

            <TouchableScale
              accessible={true}
              accessibilityRole="switch"
              accessibilityLabel="Toggle show duplicate logs"
              accessibilityState={{checked: showDuplicateLogs}}
              onPress={() => setShowDuplicateLogs(prev => !prev)}
              style={{
                width: 42,
                height: 24,
                borderRadius: 12,
                backgroundColor: showDuplicateLogs
                  ? AppColors.purple
                  : AppColors.grayBorderSecondary,
                padding: 2,
                justifyContent: 'center',
                alignItems: showDuplicateLogs ? 'flex-end' : 'flex-start',
              }}>
              <View
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  backgroundColor: AppColors.white,
                  shadowColor: AppColors.black,
                  shadowOpacity: 0.18,
                  shadowRadius: 2,
                  shadowOffset: {width: 0, height: 1},
                }}
              />
            </TouchableScale>
          </View>
        </View>

        <View
          style={{
            backgroundColor: AppColors.primaryLight,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: AppColors.grayBorderSecondary,
            padding: 16,
          }}>
          {renderSettingRow({
            icon: <TrashIcon color={AppColors.errorColor} size={16} />,
            label: t('settings.logs.clearConsoleLogs'),
            description: t('settings.logs.clearConsoleLogsDescription', {
              count: consoleLogs.length,
            }),
            isLast: true,
            onPress: () => {
              clearConsoleLogs();
              Alert.alert(
                t('common.success'),
                t('settings.logs.consoleLogsCleared'),
              );
            },
            right: (
              <View
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 8,
                  backgroundColor: `${AppColors.errorColor}14`,
                  borderWidth: 1,
                  borderColor: `${AppColors.errorColor}33`,
                }}>
                <Text
                  style={{
                    fontFamily: AppFonts.interBold,
                    fontSize: 11,
                    lineHeight: 14,
                    color: AppColors.errorColor,
                  }}>
                  {t('common.clear')}
                </Text>
              </View>
            ),
          })}
        </View>
        <View style={{height: 48}} />
      </ScrollView>
    );
  } else if (settingsPage === 'analytics') {
    content = (
      <ScrollView
        style={{flex: 1}}
        contentContainerStyle={{padding: 16, paddingBottom: 100, gap: 12}}>
        <View
          style={{
            backgroundColor: AppColors.primaryLight,
            padding: 16,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: AppColors.grayBorderSecondary,
          }}>
          {renderSettingRow({
            icon: <AnalyticsIcon color={AppColors.purple} size={16} />,
            label: t('settings.analytics.maxAnalyticsEvents'),
            description: t('settings.analytics.maxAnalyticsEventsDescription', {
              count: analyticsEvents.length,
            }),
            numericInput: {
              value: maxAnalyticsEventsLimit,
              onChange: setMaxAnalyticsEventsLimit,
              min: 10,
              max: 75,
              placeholder: 'Enter max events (10-75)',
            },
            isLast: true,
          })}
        </View>
        <View
          style={{
            backgroundColor: AppColors.primaryLight,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: AppColors.grayBorderSecondary,
            padding: 16,
          }}>
          {renderSettingRow({
            icon: <TrashIcon color={AppColors.errorColor} size={16} />,
            label: t('settings.analytics.clearAnalyticsEvents'),
            description: t(
              'settings.analytics.clearAnalyticsEventsDescription',
            ),
            isLast: true,
            onPress: () => {
              clearAnalyticsEvents();
              setSelectedEvent(null);
              Alert.alert(
                t('common.success'),
                t('settings.analytics.analyticsEventsCleared'),
              );
            },
            right: (
              <View
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 8,
                  backgroundColor: `${AppColors.errorColor}14`,
                  borderWidth: 1,
                  borderColor: `${AppColors.errorColor}33`,
                }}>
                <Text
                  style={{
                    fontFamily: AppFonts.interBold,
                    fontSize: 11,
                    lineHeight: 14,
                    color: AppColors.errorColor,
                  }}>
                  {t('common.clear')}
                </Text>
              </View>
            ),
          })}
        </View>
        <View style={{height: 48}} />
      </ScrollView>
    );
  } else if (settingsPage === 'redux') {
    content = (
      <ScrollView
        style={{flex: 1}}
        contentContainerStyle={{padding: 16, paddingBottom: 100, gap: 12}}>
        <View
          style={{
            backgroundColor: AppColors.primaryLight,
            padding: 16,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: AppColors.grayBorderSecondary,
            gap: 4,
          }}>
          {renderSettingRow({
            icon: <ReduxIcon color={AppColors.purple} size={16} />,
            label: t('settings.redux.autoRefresh'),
            description: t('settings.redux.autoRefreshDescription'),
            onPress: () => setReduxAutoRefreshState(prev => !prev),
            right: (
              <View
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 6,
                  borderWidth: 2,
                  borderColor: reduxAutoRefresh
                    ? AppColors.purple
                    : AppColors.grayTextWeak,
                  backgroundColor: reduxAutoRefresh
                    ? `${AppColors.purple}1A`
                    : 'transparent',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                {reduxAutoRefresh && (
                  <CheckIcon size={12} color={AppColors.purple} />
                )}
              </View>
            ),
          })}
          <View style={{height: 1, backgroundColor: AppColors.dividerColor}} />
          {renderSettingRow({
            icon: <LayersIcon color={AppColors.purple} size={16} />,
            label: t('settings.redux.defaultJsonExpandDepth'),
            description: t('settings.redux.defaultJsonExpandDepthDescription'),
            picker: {
              options: [1, 2, 3, 5] as const,
              selectedValue: reduxExpandDepth,
              onSelect: setReduxExpandDepth,
            },
            isLast: true,
          })}
        </View>

        <View
          style={{
            backgroundColor: AppColors.primaryLight,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: AppColors.grayBorderSecondary,
            padding: 16,
          }}>
          {renderSettingRow({
            icon: <TrashIcon color={AppColors.errorColor} size={16} />,
            label: t('settings.redux.clearReduxState'),
            description: reduxState
              ? t('settings.redux.clearReduxStateDescription')
              : t('settings.redux.clearReduxStateEmpty'),
            isLast: true,
            onPress: () => {
              setReduxState(null);
              Alert.alert(
                t('common.success'),
                t('settings.redux.reduxStateCleared'),
              );
            },
            right: (
              <View
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 8,
                  backgroundColor: `${AppColors.errorColor}14`,
                  borderWidth: 1,
                  borderColor: `${AppColors.errorColor}33`,
                }}>
                <Text
                  style={{
                    fontFamily: AppFonts.interBold,
                    fontSize: 11,
                    lineHeight: 14,
                    color: AppColors.errorColor,
                  }}>
                  {t('common.clear')}
                </Text>
              </View>
            ),
          })}
        </View>
        <View style={{height: 48}} />
      </ScrollView>
    );
  } else if (settingsPage === 'crash') {
    const isBalancedPreset =
      Boolean(crashIgnoredTypes?.js) &&
      !crashIgnoredTypes?.native &&
      Boolean(crashIgnoredTypes?.render) &&
      !crashIgnoredTypes?.promise &&
      !crashIgnoredTypes?.custom;

    const isMaxShieldPreset =
      !crashIgnoredTypes?.js &&
      !crashIgnoredTypes?.native &&
      !crashIgnoredTypes?.render &&
      !crashIgnoredTypes?.promise &&
      !crashIgnoredTypes?.custom;

    const isSilentPreset =
      Boolean(crashIgnoredTypes?.js) &&
      Boolean(crashIgnoredTypes?.native) &&
      Boolean(crashIgnoredTypes?.render) &&
      Boolean(crashIgnoredTypes?.promise) &&
      Boolean(crashIgnoredTypes?.custom);

    const protectedCount = (['js', 'native', 'render', 'promise', 'custom'] as const).filter(
      k => !crashIgnoredTypes?.[k],
    ).length;

    const crashCategories = [
      {
        key: 'js' as const,
        label: t('settings.crash.ignoreJs', 'Ignore JS Runtime Crashes'),
        desc: t(
          'settings.crash.ignoreJsDesc',
          'Bypasses unhandled JS runtime exceptions, TypeError, SyntaxError & ErrorUtils',
        ),
        icon: <JsIcon size={16} color={AppColors.yellow400} />,
      },
      {
        key: 'native' as const,
        label: t('settings.crash.ignoreNative', 'Ignore Native Platform Crashes'),
        desc: t(
          'settings.crash.ignoreNativeDesc',
          'Bypasses iOS Mach-O signals, SIGSEGV, NullPointerException & ExceptionsManager',
        ),
        icon: <ChipIcon size={16} color={AppColors.cyan600} />,
      },
      {
        key: 'render' as const,
        label: t('settings.crash.ignoreRender', 'Ignore React Render Errors'),
        desc: t(
          'settings.crash.ignoreRenderDesc',
          'Bypasses React component tree render failures & ErrorBoundary',
        ),
        icon: <LayoutIcon size={16} color={AppColors.purple400} />,
      },
      {
        key: 'promise' as const,
        label: t('settings.crash.ignorePromise', 'Ignore Promise Rejections'),
        desc: t(
          'settings.crash.ignorePromiseDesc',
          'Bypasses unhandled asynchronous Promise rejections',
        ),
        icon: <HourglassIcon size={16} color={AppColors.amber400} />,
      },
      {
        key: 'custom' as const,
        label: t('settings.crash.ignoreCustom', 'Ignore Custom Recorded Errors'),
        desc: t(
          'settings.crash.ignoreCustomDesc',
          'Bypasses manual recordCustomCrash exceptions & telemetry triggers',
        ),
        icon: <CodeBracketsIcon size={16} color={AppColors.emerald400} />,
      },
    ];

    content = (
      <ScrollView
        style={{flex: 1}}
        contentContainerStyle={{padding: 16, paddingBottom: 100, gap: 14}}
        showsVerticalScrollIndicator={false}>
        {/* ─── Governance Status Banner & Presets Card ─── */}
        <View
          style={{
            backgroundColor: AppColors.primaryLight,
            padding: 16,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: AppColors.grayBorderSecondary,
            gap: 12,
          }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
              <ShieldCheckIcon size={16} color={AppColors.purple} />
              <Text
                style={{
                  fontFamily: AppFonts.interBold,
                  fontSize: 12.5,
                  letterSpacing: 0.5,
                  color: AppColors.purple,
                }}>
                {t('settings.crash.governancePresets', 'GOVERNANCE PRESETS')}
              </Text>
            </View>
            <View
              style={{
                paddingHorizontal: 8,
                paddingVertical: 3,
                borderRadius: 6,
                backgroundColor: `${AppColors.purple}14`,
              }}>
              <Text
                style={{
                  fontFamily: AppFonts.interBold,
                  fontSize: 10.5,
                  color: AppColors.purple,
                }}>
                {protectedCount} / 5 PROTECTED
              </Text>
            </View>
          </View>

          {/* Preset Buttons Grid */}
          <View style={{flexDirection: 'row', gap: 8}}>
            <TouchableScale
              onPress={() => applyCrashPolicyPreset('balanced')}
              style={{
                flex: 1,
                paddingVertical: 10,
                paddingHorizontal: 6,
                borderRadius: 10,
                borderWidth: 1.5,
                borderColor: isBalancedPreset
                  ? AppColors.purple
                  : AppColors.grayBorderSecondary,
                backgroundColor: isBalancedPreset
                  ? `${AppColors.purple}12`
                  : AppColors.grayBackground,
                alignItems: 'center',
                gap: 4,
              }}>
              <ScaleBalanceIcon
                size={16}
                color={isBalancedPreset ? AppColors.purple : AppColors.grayText}
              />
              <Text
                style={{
                  fontFamily: AppFonts.interBold,
                  fontSize: 11,
                  color: isBalancedPreset
                    ? AppColors.purple
                    : AppColors.primaryBlack,
                }}>
                {t('settings.crash.presetBalanced', 'Balanced')}
              </Text>
            </TouchableScale>

            <TouchableScale
              onPress={() => applyCrashPolicyPreset('max_shield')}
              style={{
                flex: 1,
                paddingVertical: 10,
                paddingHorizontal: 6,
                borderRadius: 10,
                borderWidth: 1.5,
                borderColor: isMaxShieldPreset
                  ? AppColors.greenColor
                  : AppColors.grayBorderSecondary,
                backgroundColor: isMaxShieldPreset
                  ? `${AppColors.greenColor}12`
                  : AppColors.grayBackground,
                alignItems: 'center',
                gap: 4,
              }}>
              <ShieldCheckIcon
                size={16}
                color={isMaxShieldPreset ? AppColors.greenColor : AppColors.grayText}
              />
              <Text
                style={{
                  fontFamily: AppFonts.interBold,
                  fontSize: 11,
                  color: isMaxShieldPreset
                    ? AppColors.greenColor
                    : AppColors.primaryBlack,
                }}>
                {t('settings.crash.presetMaxShield', 'Max Shield')}
              </Text>
            </TouchableScale>

            <TouchableScale
              onPress={() => applyCrashPolicyPreset('silent')}
              style={{
                flex: 1,
                paddingVertical: 10,
                paddingHorizontal: 6,
                borderRadius: 10,
                borderWidth: 1.5,
                borderColor: isSilentPreset
                  ? AppColors.grayTextWeak
                  : AppColors.grayBorderSecondary,
                backgroundColor: isSilentPreset
                  ? `${AppColors.grayTextWeak}1A`
                  : AppColors.grayBackground,
                alignItems: 'center',
                gap: 4,
              }}>
              <VolumeMuteIcon
                size={16}
                color={isSilentPreset ? AppColors.grayText : AppColors.grayTextWeak}
              />
              <Text
                style={{
                  fontFamily: AppFonts.interBold,
                  fontSize: 11,
                  color: isSilentPreset
                    ? AppColors.grayText
                    : AppColors.primaryBlack,
                }}>
                {t('settings.crash.presetSilent', 'Silent Mode')}
              </Text>
            </TouchableScale>
          </View>

          <Text
            style={{
              fontFamily: AppFonts.interRegular,
              fontSize: 11,
              lineHeight: 15,
              color: AppColors.grayText,
            }}>
            {isBalancedPreset
              ? t(
                  'settings.crash.presetBalancedDesc',
                  'Recommended: Native & Promise protected; JS & Render ignored for clean dev workflow',
                )
              : isMaxShieldPreset
              ? t(
                  'settings.crash.presetMaxShieldDesc',
                  '100% Protection: Intercepts & captures all 5 error categories',
                )
              : isSilentPreset
              ? t(
                  'settings.crash.presetSilentDesc',
                  'Bypasses all error modals & badges for screencasts & clean demos',
                )
              : t(
                  'settings.crash.categoryMatrix',
                  'Customized rule matrix actively configured below',
                )}
          </Text>
        </View>

        {/* ─── Category Matrix (5 Interactive Ignored Toggles) ─── */}
        <View
          style={{
            backgroundColor: AppColors.primaryLight,
            padding: 16,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: AppColors.grayBorderSecondary,
            gap: 4,
          }}>
          <Text
            style={{
              fontFamily: AppFonts.interBold,
              fontSize: 12.5,
              letterSpacing: 0.5,
              color: AppColors.purple,
              marginBottom: 4,
            }}>
            {t('settings.crash.categoryMatrix', 'ERROR INTERCEPTION & IGNORED CATEGORIES')}
          </Text>

          {crashCategories.map((cat, idx) => {
            const isIgnored = Boolean(crashIgnoredTypes?.[cat.key]);
            const isLast = idx === crashCategories.length - 1;

            return renderSettingRow({
              key: cat.key,
              icon: cat.icon,
              label: cat.label,
              description: cat.desc,
              isLast,
              onPress: () => {
                setCrashIgnoredTypes(prev => ({
                  ...prev,
                  [cat.key]: !prev[cat.key],
                }));
              },
              right: (
                <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
                  <View
                    style={{
                      paddingHorizontal: 6,
                      paddingVertical: 2.5,
                      borderRadius: 5,
                      backgroundColor: isIgnored
                        ? `${AppColors.warningIconGold}18`
                        : `${AppColors.greenColor}18`,
                    }}>
                    <Text
                      style={{
                        fontFamily: AppFonts.interBold,
                        fontSize: 9.5,
                        color: isIgnored
                          ? AppColors.warningIconGold
                          : AppColors.greenColor,
                      }}>
                      {isIgnored
                        ? t('settings.crash.ignoredBadge', 'IGNORED')
                        : t('settings.crash.protectedBadge', 'PROTECTED')}
                    </Text>
                  </View>
                  <View
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 6,
                      borderWidth: 2,
                      borderColor: isIgnored
                        ? AppColors.purple
                        : AppColors.grayTextWeak,
                      backgroundColor: isIgnored
                        ? `${AppColors.purple}1A`
                        : 'transparent',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                    {isIgnored && (
                      <CheckIcon size={12} color={AppColors.purple} />
                    )}
                  </View>
                </View>
              ),
            });
          })}
        </View>

        {/* ─── Modal Alert Display Policy Picker ─── */}
        <View
          style={{
            backgroundColor: AppColors.primaryLight,
            padding: 16,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: AppColors.grayBorderSecondary,
          }}>
          {renderSettingRow({
            icon: <ShieldAlertIcon color={AppColors.purple} size={16} />,
            label: t('settings.crash.modalTriggerTitle', 'Modal Alert Display Policy'),
            description: t(
              'settings.crash.modalTriggerDesc',
              'Configure when the full-screen diagnostic modal appears',
            ),
            isLast: true,
            picker: {
              options: ['fatal_only', 'all_errors', 'silent_tab_only'] as const,
              selectedValue: crashModalTriggerPolicy || 'fatal_only',
              onSelect: val => setCrashModalTriggerPolicyState(val),
              formatLabel: val =>
                val === 'fatal_only'
                  ? t('settings.crash.policyFatalOnly', 'Fatal Only')
                  : val === 'all_errors'
                  ? t('settings.crash.policyAllErrors', 'All Caught')
                  : t('settings.crash.policySilent', 'Silent Only'),
            },
          })}
        </View>

        {/* ─── Buffer Limit & Reset / Clear Maintenance Actions ─── */}
        <View
          style={{
            backgroundColor: AppColors.primaryLight,
            padding: 16,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: AppColors.grayBorderSecondary,
            gap: 4,
          }}>
          {renderSettingRow({
            icon: <LayersIcon color={AppColors.purple} size={16} />,
            label: t('settings.crash.maxCrashLogs', 'Max Crash Logs Buffer'),
            description: t(
              'settings.crash.maxCrashLogsDesc',
              'How many crash records to preserve in history (5-100)',
            ),
            numericInput: {
              value: maxCrashLogs,
              onChange: setMaxCrashLogs,
              min: 5,
              max: 100,
              placeholder: 'Enter max crashes (5-100)',
            },
          })}
          <View style={{height: 1, backgroundColor: AppColors.dividerColor}} />
          {renderSettingRow({
            icon: <RefreshCcwIcon color={AppColors.purple} size={16} />,
            label: t('settings.crash.resetDefaults', 'Reset to Defaults'),
            description: t(
              'settings.crash.resetDefaultsDesc',
              'Restore recommended balanced crash protection settings',
            ),
            onPress: () => {
              applyCrashPolicyPreset('balanced');
              setMaxCrashLogs(50);
              setCrashModalTriggerPolicyState('fatal_only');
              Alert.alert(
                t('common.success', 'Success'),
                t('settings.crash.resetDefaultsDesc', 'Restore recommended balanced crash protection settings'),
              );
            },
            right: (
              <View
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  borderRadius: 8,
                  backgroundColor: `${AppColors.purple}14`,
                  borderWidth: 1,
                  borderColor: `${AppColors.purple}33`,
                }}>
                <Text
                  style={{
                    fontFamily: AppFonts.interBold,
                    fontSize: 11,
                    color: AppColors.purple,
                  }}>
                  {t('settings.reset', 'Reset')}
                </Text>
              </View>
            ),
          })}
          <View style={{height: 1, backgroundColor: AppColors.dividerColor}} />
          {renderSettingRow({
            icon: <TrashIcon color={AppColors.errorColor} size={16} />,
            label: t('settings.crash.clearHistory', 'Clear Crash History'),
            description: t('settings.crash.clearHistoryDesc', {
              count: crashRecords?.length || 0,
            }),
            isLast: true,
            onPress: () => {
              clearCrashRecords();
              Alert.alert(
                t('common.success', 'Success'),
                t('settings.crash.historyCleared', 'Crash logs cleared.'),
              );
            },
            right: (
              <View
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 8,
                  backgroundColor: `${AppColors.errorColor}14`,
                  borderWidth: 1,
                  borderColor: `${AppColors.errorColor}33`,
                }}>
                <Text
                  style={{
                    fontFamily: AppFonts.interBold,
                    fontSize: 11,
                    lineHeight: 14,
                    color: AppColors.errorColor,
                  }}>
                  {t('common.clear', 'Clear')}
                </Text>
              </View>
            ),
          })}
        </View>
        <View style={{height: 48}} />
      </ScrollView>
    );
  } else if (settingsPage === 'push') {
    content = (
      <ScrollView
        style={{flex: 1}}
        contentContainerStyle={{padding: 16, paddingBottom: 100, gap: 12}}>
        {/* Settings Card: Limits & Engine Status */}
        <View
          style={{
            backgroundColor: AppColors.primaryLight,
            padding: 16,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: AppColors.grayBorderSecondary,
            gap: 4,
          }}>
          {renderSettingRow({
            icon: <LayersIcon color={AppColors.purple} size={16} />,
            label: 'Max Push Notification Logs',
            description: 'Buffer size limit for recorded push payloads (10-200)',
            numericInput: {
              value: maxPushLogs,
              onChange: setMaxPushLogs,
              min: 10,
              max: 200,
              placeholder: 'Enter max logs (10-200)',
            },
          })}
          <View style={{height: 1, backgroundColor: AppColors.dividerColor}} />
          {renderSettingRow({
            icon: <BellIcon color={AppColors.greenColor} size={16} />,
            label: 'Universal Ingestion Engine',
            description: 'Captures any push domain (Salesforce, FCM, APNs, Expo, Braze, Custom)',
            isLast: true,
            right: (
              <View
                style={{
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: 6,
                  backgroundColor: `${AppColors.greenColor}1F`,
                }}>
                <Text
                  style={{
                    fontFamily: AppFonts.interBold,
                    fontSize: 10,
                    lineHeight: 13,
                    color: AppColors.greenColor,
                  }}>
                  ACTIVE
                </Text>
              </View>
            ),
          })}
        </View>

        {/* Test Push Triggers Card */}
        <View
          style={{
            backgroundColor: AppColors.primaryLight,
            padding: 16,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: AppColors.grayBorderSecondary,
            gap: 8,
          }}>
          <View style={{flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4}}>
            <BoltIcon size={13} color={AppColors.amber500} />
            <Text
              style={{
                fontFamily: AppFonts.interBold,
                fontSize: 12,
                color: AppColors.primaryBlack,
              }}>
              {t('settings.simulatePushTitle', 'SIMULATE TEST PUSH NOTIFICATIONS')}
            </Text>
          </View>

          <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 6}}>
            <TouchableScale
              onPress={() => {
                simulatePush('salesforce');
                showToast(
                  t(
                    'settings.simulator.salesforce',
                    'Simulated Salesforce Marketing Cloud push',
                  ),
                );
              }}
              style={{
                backgroundColor: `${AppColors.sky600}14`,
                borderColor: `${AppColors.sky600}33`,
                borderWidth: 1,
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 8,
              }}>
              <Text style={{fontSize: 11, fontFamily: AppFonts.interSemiBold, color: AppColors.sky600}}>
                + Salesforce MC
              </Text>
            </TouchableScale>

            <TouchableScale
              onPress={() => {
                simulatePush('fcm');
                showToast(
                  t('settings.simulator.fcm', 'Simulated Firebase FCM push'),
                );
              }}
              style={{
                backgroundColor: `${AppColors.darkOrange}14`,
                borderColor: `${AppColors.darkOrange}33`,
                borderWidth: 1,
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 8,
              }}>
              <Text style={{fontSize: 11, fontFamily: AppFonts.interSemiBold, color: AppColors.darkOrange}}>
                + Firebase FCM
              </Text>
            </TouchableScale>

            <TouchableScale
              onPress={() => {
                simulatePush('apns');
                showToast(
                  t('settings.simulator.apns', 'Simulated Apple APNs push'),
                );
              }}
              style={{
                backgroundColor: `${AppColors.primaryBlack}10`,
                borderColor: `${AppColors.primaryBlack}25`,
                borderWidth: 1,
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 8,
              }}>
              <Text style={{fontSize: 11, fontFamily: AppFonts.interSemiBold, color: AppColors.primaryBlack}}>
                + Apple APNs
              </Text>
            </TouchableScale>

            <TouchableScale
              onPress={() => {
                simulatePush('deeplink');
                showToast(
                  t(
                    'settings.simulator.deepLink',
                    'Simulated Deep Link push',
                  ),
                );
              }}
              style={{
                backgroundColor: `${AppColors.brandPurple}14`,
                borderColor: `${AppColors.brandPurple}33`,
                borderWidth: 1,
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 8,
              }}>
              <Text style={{fontSize: 11, fontFamily: AppFonts.interSemiBold, color: AppColors.brandPurple}}>
                + Deep Link
              </Text>
            </TouchableScale>
          </View>
        </View>

        {/* Clear History Card */}
        <View
          style={{
            backgroundColor: AppColors.primaryLight,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: AppColors.grayBorderSecondary,
            padding: 16,
          }}>
          {renderSettingRow({
            icon: <TrashIcon color={AppColors.errorColor} size={16} />,
            label: t('push.clearTitle', 'Clear Push History'),
            description: `Permanently remove all ${pushRecords?.length || 0} recorded notifications`,
            isLast: true,
            onPress: () => {
              clearAllPushLogs();
              Alert.alert(t('common.success', 'Success'), t('settings.pushHistoryCleared', 'Push notification history cleared'));
            },
            right: (
              <View
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 8,
                  backgroundColor: `${AppColors.errorColor}14`,
                  borderWidth: 1,
                  borderColor: `${AppColors.errorColor}33`,
                }}>
                <Text
                  style={{
                    fontFamily: AppFonts.interBold,
                    fontSize: 11,
                    lineHeight: 14,
                    color: AppColors.errorColor,
                  }}>
                  {t('common.clear')}
                </Text>
              </View>
            ),
          })}
        </View>
        <View style={{height: 48}} />
      </ScrollView>
    );
  } else if (settingsPage === 'socket') {
    content = (
      <ScrollView
        style={{flex: 1}}
        contentContainerStyle={{padding: 16, paddingBottom: 100, gap: 12}}>
        {/* Settings Card: Limits & Engine Status */}
        <View
          style={{
            backgroundColor: AppColors.primaryLight,
            padding: 16,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: AppColors.grayBorderSecondary,
            gap: 4,
          }}>
          {renderSettingRow({
            icon: <LayersIcon color={AppColors.purple} size={16} />,
            label: 'Max WebSocket Connections',
            description: 'Ring buffer limit for active & closed socket sessions (10-200)',
            numericInput: {
              value: maxSocketLogs,
              onChange: setMaxSocketLogs,
              min: 10,
              max: 200,
              placeholder: 'Enter max sockets (10-200)',
            },
          })}
          <View style={{height: 1, backgroundColor: AppColors.dividerColor}} />
          {renderSettingRow({
            icon: <WebsocketIcon color={AppColors.greenColor} size={16} />,
            label: 'Global WebSocket Interceptor',
            description: 'Automatic capture for WebSocket, WSS & Socket.IO traffic',
            isLast: true,
            right: (
              <View
                style={{
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: 6,
                  backgroundColor: `${AppColors.greenColor}1F`,
                }}>
                <Text
                  style={{
                    fontFamily: AppFonts.interBold,
                    fontSize: 10,
                    lineHeight: 13,
                    color: AppColors.greenColor,
                  }}>
                  ACTIVE
                </Text>
              </View>
            ),
          })}
        </View>

        {/* Test Socket Triggers Card */}
        <View
          style={{
            backgroundColor: AppColors.primaryLight,
            padding: 16,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: AppColors.grayBorderSecondary,
            gap: 8,
          }}>
          <View style={{flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4}}>
            <BoltIcon size={13} color={AppColors.amber500} />
            <Text
              style={{
                fontFamily: AppFonts.interBold,
                fontSize: 12,
                color: AppColors.primaryBlack,
              }}>
              {t('settings.simulateSocketTitle', 'SIMULATE TEST SOCKET CONNECTIONS')}
            </Text>
          </View>

          <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 6}}>
            <TouchableScale
              onPress={() => {
                simulateSocket('chat');
                showToast(
                  t(
                    'settings.simulator.chat',
                    'Simulated Real-time Chat WebSocket session',
                  ),
                );
              }}
              style={{
                backgroundColor: `${AppColors.blue600}14`,
                borderColor: `${AppColors.blue600}33`,
                borderWidth: 1,
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 8,
              }}>
              <Text style={{fontSize: 11, fontFamily: AppFonts.interSemiBold, color: AppColors.blue600}}>
                + Chat Room (WS)
              </Text>
            </TouchableScale>

            <TouchableScale
              onPress={() => {
                simulateSocket('crypto');
                showToast(
                  t(
                    'settings.simulator.crypto',
                    'Simulated Binance Crypto Ticker stream',
                  ),
                );
              }}
              style={{
                backgroundColor: `${AppColors.emerald600}14`,
                borderColor: `${AppColors.emerald600}33`,
                borderWidth: 1,
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 8,
              }}>
              <Text style={{fontSize: 11, fontFamily: AppFonts.interSemiBold, color: AppColors.emerald600}}>
                + Crypto Feed (WSS)
              </Text>
            </TouchableScale>

            <TouchableScale
              onPress={() => {
                simulateSocket('socketio');
                showToast(
                  t(
                    'settings.simulator.socketio',
                    'Simulated Socket.IO v4 session',
                  ),
                );
              }}
              style={{
                backgroundColor: `${AppColors.violet600}14`,
                borderColor: `${AppColors.violet600}33`,
                borderWidth: 1,
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 8,
              }}>
              <Text style={{fontSize: 11, fontFamily: AppFonts.interSemiBold, color: AppColors.violet600}}>
                + Socket.IO Room
              </Text>
            </TouchableScale>

            <TouchableScale
              onPress={() => {
                simulateSocket('echo');
                showToast(
                  t(
                    'settings.simulator.echo',
                    'Simulated WebSocket Echo test',
                  ),
                );
              }}
              style={{
                backgroundColor: `${AppColors.brandPurple}14`,
                borderColor: `${AppColors.brandPurple}33`,
                borderWidth: 1,
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 8,
              }}>
              <Text style={{fontSize: 11, fontFamily: AppFonts.interSemiBold, color: AppColors.brandPurple}}>
                + Echo Test
              </Text>
            </TouchableScale>
          </View>
        </View>

        {/* Clear History Card */}
        <View
          style={{
            backgroundColor: AppColors.primaryLight,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: AppColors.grayBorderSecondary,
            padding: 16,
          }}>
          {renderSettingRow({
            icon: <TrashIcon color={AppColors.errorColor} size={16} />,
            label: t('socket.clearTitle', 'Clear All WebSocket Logs').replace('All WebSocket Logs', 'Socket History'),
            description: `Permanently remove all ${socketRecords?.length || 0} recorded sessions`,
            isLast: true,
            onPress: () => {
              clearAllSocketLogs();
              Alert.alert(t('common.success', 'Success'), t('settings.socketHistoryCleared', 'WebSocket history cleared'));
            },
            right: (
              <View
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 8,
                  backgroundColor: `${AppColors.errorColor}14`,
                  borderWidth: 1,
                  borderColor: `${AppColors.errorColor}33`,
                }}>
                <Text
                  style={{
                    fontFamily: AppFonts.interBold,
                    fontSize: 11,
                    lineHeight: 14,
                    color: AppColors.errorColor,
                  }}>
                  {t('common.clear')}
                </Text>
              </View>
            ),
          })}
        </View>
        <View style={{height: 48}} />
      </ScrollView>
    );
  } else if (settingsPage === 'media') {
    content = (
      <ScrollView
        style={{flex: 1}}
        contentContainerStyle={{padding: 16, paddingBottom: 100, gap: 12}}>
        {/* Quick Capture Actions */}
        <View
          style={{
            backgroundColor: AppColors.primaryLight,
            padding: 16,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: AppColors.grayBorderSecondary,
            gap: 8,
          }}>
          <View style={{flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4}}>
            <BoltIcon size={13} color={AppColors.amber500} />
            <Text
              style={{
                fontFamily: AppFonts.interBold,
                fontSize: 12,
                color: AppColors.primaryBlack,
              }}>
              {t('settings.directCaptureShortcuts', 'DIRECT CAPTURE SHORTCUTS')}
            </Text>
          </View>

          <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 8}}>
            <TouchableScale
              onPress={async () => {
                triggerNativeHaptic('light');
                const result = await ScreenCapture.takeScreenshot({
                  format: captureImageFormat.toLowerCase() as any,
                  quality: 0.9,
                  hideInspector: captureAutoHide,
                });
                if (result) {
                  triggerNativeHaptic('success');
                  showToast(
                    t(
                      'settings.simulator.screenshotSaved',
                      'Screenshot captured and saved!',
                    ),
                  );
                }
              }}
              style={{
                backgroundColor: `${AppColors.purple}14`,
                borderColor: `${AppColors.purple}33`,
                borderWidth: 1,
                paddingHorizontal: 12,
                paddingVertical: 7,
                borderRadius: 8,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
              }}>
              <CameraIcon color={AppColors.purple} size={14} />
              <Text
                style={{
                  fontSize: 11,
                  fontFamily: AppFonts.interBold,
                  color: AppColors.purple,
                }}>
                Take Screenshot
              </Text>
            </TouchableScale>
          </View>
        </View>

        {/* Screenshot Preferences Card */}
        <View
          style={{
            backgroundColor: AppColors.primaryLight,
            padding: 16,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: AppColors.grayBorderSecondary,
            gap: 12,
          }}>
          <View style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                backgroundColor: AppColors.purpleShade50,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <CameraIcon color={AppColors.purple} size={16} />
            </View>
            <View style={{flex: 1}}>
              <Text
                style={{
                  fontFamily: AppFonts.interBold,
                  fontSize: 14,
                  lineHeight: 18,
                  color: AppColors.primaryBlack,
                }}>
                {t(
                  'settings.media.screenshotCardTitle',
                  'Screenshot Capture Settings',
                )}
              </Text>
              <Text
                style={{
                  fontFamily: AppFonts.interRegular,
                  fontSize: 11,
                  lineHeight: 15,
                  color: AppColors.grayText,
                  marginTop: 1,
                }}>
                {t(
                  'settings.media.screenshotCardDesc',
                  'Image encoding format, compression quality and overlay auto-hide',
                )}
              </Text>
            </View>
          </View>

          {renderSettingRow({
            icon: <ImageIcon color={AppColors.purple} size={16} />,
            label: t('settings.media.imageFormat', 'Image Format'),
            description: t(
              'settings.media.imageFormatDesc',
              'Export formats (PNG lossless, JPEG lossy, WebP)',
            ),
            right: (
              <View style={{flexDirection: 'row', gap: 5}}>
                {(['png', 'jpeg', 'webp'] as const).map(fmt => {
                  const isSelected = captureImageFormat === fmt;
                  return (
                    <TouchableScale
                      key={fmt}
                      onPress={() => {
                        triggerNativeHaptic('light');
                        setCaptureImageFormat(fmt);
                        showToast(`Screenshot format: ${fmt.toUpperCase()}`);
                      }}
                      style={{
                        paddingHorizontal: 9,
                        paddingVertical: 5,
                        borderRadius: 7,
                        backgroundColor: isSelected
                          ? AppColors.purple
                          : `${AppColors.purple}14`,
                        borderWidth: 1,
                        borderColor: isSelected
                          ? AppColors.purple
                          : `${AppColors.purple}2E`,
                      }}>
                      <Text
                        style={{
                          fontFamily: AppFonts.interBold,
                          fontSize: 10.5,
                          color: isSelected
                            ? AppColors.white
                            : AppColors.purple,
                        }}>
                        {fmt.toUpperCase()}
                      </Text>
                    </TouchableScale>
                  );
                })}
              </View>
            ),
          })}

          {renderSettingRow({
            icon: <EyeIcon color={AppColors.purple} size={16} />,
            label: t(
              'settings.media.autoHide',
              'Auto-Hide Inspector During Capture',
            ),
            description: t(
              'settings.media.autoHideDesc',
              'Temporarily hides the inspector overlay during screen capture',
            ),
            isLast: true,
            onPress: () => {
              triggerNativeHaptic('light');
              setCaptureAutoHide(prev => !prev);
              showToast(`Auto-hide overlay: ${!captureAutoHide ? 'ON' : 'OFF'}`);
            },
            right: (
              <TouchableScale
                onPress={() => {
                  triggerNativeHaptic('light');
                  setCaptureAutoHide(prev => !prev);
                  showToast(`Auto-hide overlay: ${!captureAutoHide ? 'ON' : 'OFF'}`);
                }}
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  borderRadius: 7,
                  backgroundColor: captureAutoHide
                    ? `${AppColors.emerald500}26`
                    : `${AppColors.grayText}20`,
                  borderWidth: 1,
                  borderColor: captureAutoHide
                    ? `${AppColors.emerald500}4D`
                    : `${AppColors.grayText}33`,
                }}>
                <Text
                  style={{
                    fontFamily: AppFonts.interBold,
                    fontSize: 10.5,
                    color: captureAutoHide
                      ? AppColors.emerald500
                      : AppColors.grayText,
                  }}>
                  {captureAutoHide
                    ? t('settings.media.enabled', 'ON')
                    : 'OFF'}
                </Text>
              </TouchableScale>
            ),
          })}
        </View>

        {/* Video & GIF Recording Card */}
        <View
          style={{
            backgroundColor: AppColors.primaryLight,
            padding: 16,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: AppColors.grayBorderSecondary,
            gap: 12,
          }}>
          <View style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                backgroundColor: AppColors.purpleShade50,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <VideoCameraIcon color={AppColors.purple} size={16} />
            </View>
            <View style={{flex: 1}}>
              <Text
                style={{
                  fontFamily: AppFonts.interBold,
                  fontSize: 14,
                  lineHeight: 18,
                  color: AppColors.primaryBlack,
                }}>
                {t(
                  'settings.media.videoCardTitle',
                  'Video Recording & GIF Conversion',
                )}
              </Text>
              <Text
                style={{
                  fontFamily: AppFonts.interRegular,
                  fontSize: 11,
                  lineHeight: 15,
                  color: AppColors.grayText,
                  marginTop: 1,
                }}>
                {t(
                  'settings.media.videoCardDesc',
                  'ReplayKit hardware encoding, frame capture fallback and GIF generation',
                )}
              </Text>
            </View>
          </View>

          {renderSettingRow({
            icon: <MicrophoneIcon color={AppColors.purple} size={16} />,
            label: t('settings.media.audioMode', 'Audio Source'),
            description: t(
              'settings.media.audioModeDesc',
              'Record video with muted, app audio, or microphone commentary',
            ),
            right: (
              <View style={{flexDirection: 'row', gap: 5}}>
                {(
                  [
                    {key: 'none', label: 'Muted'},
                    {key: 'app', label: 'App'},
                    {key: 'mic', label: 'Mic'},
                  ] as const
                ).map(aud => {
                  const isSelected = captureAudioMode === aud.key;
                  return (
                    <TouchableScale
                      key={aud.key}
                      onPress={() => {
                        triggerNativeHaptic('light');
                        setCaptureAudioMode(aud.key);
                        showToast(`Audio source: ${aud.label}`);
                      }}
                      style={{
                        paddingHorizontal: 8,
                        paddingVertical: 5,
                        borderRadius: 7,
                        backgroundColor: isSelected
                          ? AppColors.purple
                          : `${AppColors.purple}14`,
                        borderWidth: 1,
                        borderColor: isSelected
                          ? AppColors.purple
                          : `${AppColors.purple}2E`,
                      }}>
                      <Text
                        style={{
                          fontFamily: AppFonts.interBold,
                          fontSize: 10.5,
                          color: isSelected
                            ? AppColors.white
                            : AppColors.purple,
                        }}>
                        {aud.label}
                      </Text>
                    </TouchableScale>
                  );
                })}
              </View>
            ),
          })}

          {renderSettingRow({
            icon: <FilmIcon color={AppColors.purple} size={16} />,
            label: t(
              'settings.media.frameRate',
              'Recording Frame Rate (FPS)',
            ),
            description: t(
              'settings.media.frameRateDesc',
              'Target video smoothness: 15, 24, 30, or 60 FPS',
            ),
            right: (
              <View style={{flexDirection: 'row', gap: 5}}>
                {([15, 24, 30, 60] as const).map(fps => {
                  const isSelected = captureFps === fps;
                  return (
                    <TouchableScale
                      key={fps}
                      onPress={() => {
                        triggerNativeHaptic('light');
                        setCaptureFps(fps);
                        showToast(`Recording FPS: ${fps}`);
                      }}
                      style={{
                        paddingHorizontal: 7,
                        paddingVertical: 5,
                        borderRadius: 7,
                        backgroundColor: isSelected
                          ? AppColors.purple
                          : `${AppColors.purple}14`,
                        borderWidth: 1,
                        borderColor: isSelected
                          ? AppColors.purple
                          : `${AppColors.purple}2E`,
                      }}>
                      <Text
                        style={{
                          fontFamily: AppFonts.interBold,
                          fontSize: 10.5,
                          color: isSelected
                            ? AppColors.white
                            : AppColors.purple,
                        }}>
                        {fps}fps
                      </Text>
                    </TouchableScale>
                  );
                })}
              </View>
            ),
          })}

          {renderSettingRow({
            icon: <GifIcon color={AppColors.purple} size={16} />,
            label: t('settings.media.gifAutoOpt', 'Auto GIF Optimization'),
            description: t(
              'settings.media.gifAutoOptDesc',
              'Automatic palette reduction and frame skip for lightweight animated GIFs',
            ),
            isLast: true,
            onPress: () => {
              triggerNativeHaptic('light');
              setCaptureAutoGif(prev => !prev);
              showToast(`GIF optimization: ${!captureAutoGif ? 'ON' : 'OFF'}`);
            },
            right: (
              <TouchableScale
                onPress={() => {
                  triggerNativeHaptic('light');
                  setCaptureAutoGif(prev => !prev);
                  showToast(`GIF optimization: ${!captureAutoGif ? 'ON' : 'OFF'}`);
                }}
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  borderRadius: 7,
                  backgroundColor: captureAutoGif
                    ? `${AppColors.emerald500}26`
                    : `${AppColors.grayText}20`,
                  borderWidth: 1,
                  borderColor: captureAutoGif
                    ? `${AppColors.emerald500}4D`
                    : `${AppColors.grayText}33`,
                }}>
                <Text
                  style={{
                    fontFamily: AppFonts.interBold,
                    fontSize: 10.5,
                    color: captureAutoGif
                      ? AppColors.emerald500
                      : AppColors.grayText,
                  }}>
                  {captureAutoGif ? 'ON' : 'OFF'}
                </Text>
              </TouchableScale>
            ),
          })}
        </View>

        {/* Media Storage Cache Management */}
        <View
          style={{
            backgroundColor: AppColors.primaryLight,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: AppColors.grayBorderSecondary,
            padding: 16,
          }}>
          {renderSettingRow({
            icon: <TrashIcon color={AppColors.errorColor} size={16} />,
            label: t(
              'settings.media.purgeAll',
              'Purge Captured Media Cache',
            ),
            description: t(
              'settings.media.purgeAllDesc',
              'Delete all local screenshots, screen recordings and converted GIFs',
            ),
            isLast: true,
            onPress: () => {
              Alert.alert(
                t(
                  'settings.media.purgeConfirmTitle',
                  'Purge Media Storage?',
                ),
                t(
                  'settings.media.purgeConfirmMessage',
                  'This will permanently delete all captured screenshots and videos from disk.',
                ),
                [
                  {text: t('common.cancel', 'Cancel'), style: 'cancel'},
                  {
                    text: t('settings.media.purgeCacheBtn', 'Purge All'),
                    style: 'destructive',
                    onPress: async () => {
                      await ScreenCapture.clearAllMedia();
                      showToast(
                        t(
                          'settings.media.purgedSuccess',
                          'Media cache cleared successfully',
                        ),
                      );
                    },
                  },
                ],
              );
            },
            right: (
              <View
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 8,
                  backgroundColor: `${AppColors.errorColor}14`,
                  borderWidth: 1,
                  borderColor: `${AppColors.errorColor}33`,
                }}>
                <Text
                  style={{
                    fontFamily: AppFonts.interBold,
                    fontSize: 11,
                    lineHeight: 14,
                    color: AppColors.errorColor,
                  }}>
                  {t('settings.media.purgeCacheBtn', 'Purge All')}
                </Text>
              </View>
            ),
          })}
        </View>
        <View style={{height: 48}} />
      </ScrollView>
    );
  }

  const subPageAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (settingsPage !== 'main') {
      subPageAnim.setValue(0);
      Animated.spring(subPageAnim, {
        toValue: 1,
        friction: 8,
        tension: 65,
        useNativeDriver: true,
      }).start();
    }
  }, [settingsPage]);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: AppColors.grayBackground,
      }}>
      {/* ─── Persistent Main Settings (Retains 100% scroll position) ─── */}
      <View
        style={[
          StyleSheet.absoluteFill,
          settingsPage !== 'main' && {pointerEvents: 'none'},
        ]}>
        {renderMainSettingsContent()}
      </View>

      {/* ─── Sub-module Settings Overlay (Smooth Animated Slide) ─── */}
      {settingsPage !== 'main' && (
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: AppColors.grayBackground,
              opacity: subPageAnim,
              transform: [
                {
                  translateX: subPageAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [30, 0],
                  }),
                },
              ],
            },
          ]}>
          {content}
        </Animated.View>
      )}

      {/* ─── Language Picker Modal ─── */}
      <LanguageSelectorModal
        visible={showLanguageModal}
        onClose={() => setShowLanguageModal(false)}
      />
    </View>
  );
};

export default SettingsPanel;
