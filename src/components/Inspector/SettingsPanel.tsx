import React, {useMemo, useState, useEffect, useRef} from 'react';
import {
  Alert,
  Animated,
  DevSettings,
  Dimensions,
  Linking,
  PixelRatio,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
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
import {
  isPersistentStorageAvailable,
  calculateRamBasedLimits,
} from '../../helpers/settingsStore';
import {clearNetworkLogs} from '../../customHooks/networkLogger';
import {clearConsoleLogs} from '../../customHooks/consoleLogger';
import {clearAnalyticsEvents} from '../../customHooks/analyticsLogger';
import {clearCrashRecords} from '../../customHooks/crashHandler';
import {clearCachedBundleAnalysis} from '../../customHooks/bundleAnalyzer';
import {clearPerformanceEvents} from '../../customHooks/performanceTracker';
import {isReduxConnected} from '../../customHooks/reduxLogger';
import {isAnalyticsConnected} from '../../customHooks/analyticsLogger';
import {useTranslation} from '../../i18n';
import {ActiveTab} from '../../types';
import {
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
  PerformanceIcon,
  CrashIcon,
  ShieldAlertIcon,
  ForwardChevronIcon,
  ChevronDownIcon,
  NpmIcon,
  BoltIcon,
  BrainIcon,
  SmartphoneIcon,
  DatabaseIcon,
  QrCodeIcon,
  GitHubIcon,
  InfoCircleIcon,
  CopyIcon,
} from '../NetworkIcons';
import {LIB_VERSION} from '../../constants';
import {
  copyToClipboard,
  isLocalDebugEnvironment,
  getAppName,
  getBundleIdentifier,
  getAppVersionAndBuild,
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
    resetToDefaults,
    closeModal,
    storage,
    logs,
    consoleLogs,
    analyticsEvents,
    reduxState,
    maxNetworkLogs,
    setMaxNetworkLogs,
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
    switchActiveTab,
    setSelected,
    setSelectedEvent,
    setReduxState,
    crashRecords,
    maxCrashLogs,
    setMaxCrashLogs,
    updateAvailable,
    latestNpmVersion,
  } = useInspector();

  const [stagedHeight, setStagedHeight] = useState(modalHeightPercent);

  useEffect(() => {
    setStagedHeight(modalHeightPercent);
  }, [modalHeightPercent]);

  const autoRamProfile = calculateRamBasedLimits(deviceFreeRamMb);

  const isPersistent = isPersistentStorageAvailable();

  // Safe Area & Status Bar Padding for All Device Form Factors
  const statusBarHeight =
    Platform.OS === 'android' ? StatusBar.currentHeight || 24 : 44;
  const headerTopPadding = modalHeightPercent >= 95 ? statusBarHeight : 0;

  const allModules = useMemo(
    () =>
      (
        [
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
            key: 'analytics',
            label: 'Analytics Logger',
            category: 'telemetry',
            icon: 'analytics',
            desc: 'Firebase & custom analytics events, user properties & params',
          },
          {
            id: 4,
            key: 'redux',
            label: 'Redux Inspector',
            category: 'telemetry',
            icon: 'redux',
            desc: 'Store state diffing, action history & reducer timeline',
          },
          {
            id: 5,
            key: 'storage',
            label: 'Storage Inspector',
            category: 'telemetry',
            icon: 'storage',
            desc: 'AsyncStorage & MMKV key-value store viewer with full CRUD support',
          },
          {
            id: 6,
            key: 'device',
            label: 'Device Info',
            category: 'diagnostic',
            icon: 'device',
            desc: 'Hardware specs, IP address, screen metrics, UDID & runtime stats',
          },
          {
            id: 7,
            key: 'crash',
            label: 'Crash Protection',
            category: 'diagnostic',
            icon: 'crash',
            desc: 'Runtime exception guard, breadcrumbs & memory snapshot',
          },
          {
            id: 8,
            key: 'bundle',
            label: 'Bundle Analyzer',
            category: 'diagnostic',
            icon: 'bundle',
            desc: 'Metro packager dependencies, source maps & asset breakdown',
          },
          {
            id: 9,
            key: 'performance',
            label: 'Performance & Tracker',
            category: 'diagnostic',
            icon: 'performance',
            desc: '60 FPS monitor, Hermes memory telemetry & re-render profiler',
          },
          {
            id: 10,
            key: 'debugging',
            label: 'Multi-Device Debugging',
            category: 'diagnostic',
            icon: 'debugging',
            desc: 'QR Code bridge for direct Debug APK download & Metro live-reload sync',
          },
        ] as const
      ).filter(m =>
        m.key === 'debugging'
          ? Platform.OS === 'android' && isLocalDebugEnvironment()
          : true,
      ),
    [],
  );

  // Staged selection state for checkboxes before clicking "Save Changes"
  const [stagedTabVisibility, setStagedTabVisibility] = useState<
    Record<ActiveTab, boolean>
  >(() => ({
    apis: true,
    logs: Boolean(tabVisibility?.logs),
    analytics: Boolean(tabVisibility?.analytics),
    redux: Boolean(tabVisibility?.redux),
    storage: Boolean(tabVisibility?.storage),
    device: Boolean(tabVisibility?.device),
    crash: Boolean(tabVisibility?.crash),
    bundle: Boolean(tabVisibility?.bundle),
    performance: Boolean(tabVisibility?.performance),
    debugging: Boolean(tabVisibility?.debugging),
  }));

  // Synchronize staged state with tabVisibility when tabVisibility updates
  useEffect(() => {
    setStagedTabVisibility({
      apis: true,
      logs: Boolean(tabVisibility?.logs),
      analytics: Boolean(tabVisibility?.analytics),
      redux: Boolean(tabVisibility?.redux),
      storage: Boolean(tabVisibility?.storage),
      device: Boolean(tabVisibility?.device),
      crash: Boolean(tabVisibility?.crash),
      bundle: Boolean(tabVisibility?.bundle),
      performance: Boolean(tabVisibility?.performance),
      debugging: Boolean(tabVisibility?.debugging),
    });
  }, [tabVisibility]);

  const hasUnsavedChanges = useMemo(() => {
    return allModules.some(
      m =>
        Boolean(stagedTabVisibility[m.key as ActiveTab]) !==
        Boolean(tabVisibility?.[m.key as ActiveTab]),
    );
  }, [stagedTabVisibility, tabVisibility, allModules]);

  const stagedActiveCount = allModules.filter(
    m => m.key === 'apis' || Boolean(stagedTabVisibility[m.key as ActiveTab]),
  ).length;

  const handleSaveChanges = () => {
    if (!hasUnsavedChanges) return;

    Alert.alert(
      'Apply Changes & Reload',
      'Are you sure you want to save module changes? The inspector will close and reload the app to apply the new configuration.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => {
            // Discard: Revert staged visibility back to saved tabVisibility
            setStagedTabVisibility({
              apis: true,
              logs: Boolean(tabVisibility?.logs),
              analytics: Boolean(tabVisibility?.analytics),
              redux: Boolean(tabVisibility?.redux),
              storage: Boolean(tabVisibility?.storage),
              device: Boolean(tabVisibility?.device),
              crash: Boolean(tabVisibility?.crash),
              bundle: Boolean(tabVisibility?.bundle),
              performance: Boolean(tabVisibility?.performance),
              debugging: Boolean(tabVisibility?.debugging),
            });
          },
        },
        {
          text: 'Save & Reload',
          style: 'default',
          onPress: () => {
            animateNextLayout();
            allModules.forEach(m => {
              if (m.key !== 'apis') {
                const isStagedOn = Boolean(stagedTabVisibility[m.key as ActiveTab]);
                const isCurrentOn = Boolean(tabVisibility?.[m.key as ActiveTab]);
                if (isStagedOn !== isCurrentOn) {
                  toggleTabVisibility(m.key as ActiveTab);
                }
              }
            });
            closeModal();
            setTimeout(() => {
              if (__DEV__ && DevSettings && DevSettings.reload) {
                DevSettings.reload();
              }
            }, 350);
          },
        },
      ],
    );
  };

  const [isDefaultTabDropdownOpen, setIsDefaultTabDropdownOpen] =
    useState(false);

  const goBackToMain = () => {
    animateNextLayout();
    setSettingsPage('main');
  };

  // Helper: settings row with icon + label + optional description
  const renderSettingRow = (opts: {
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
        {/* Segmented Top Navigation Sub-Tabs */}
        {/* ─── Modern Scrollable Settings Sub-Tabs Bar ─── */}
        <View
          style={{
            backgroundColor: AppColors.primaryLight,
            borderRadius: 13,
            paddingVertical: 4,
            paddingHorizontal: 4,
            borderWidth: 1,
            borderColor: AppColors.grayBorderSecondary,
            shadowColor: AppColors.black,
            shadowOpacity: 0.04,
            shadowRadius: 4,
            shadowOffset: {width: 0, height: 2},
          }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              paddingHorizontal: 2,
            }}>
            {[
              {
                key: 'module' as const,
                label: t('settings.modulesAndTools', 'Modules & Tools'),
                Icon: LayersIcon,
                badge: `${allModules.filter(m => stagedTabVisibility?.[m.key as ActiveTab] || m.key === 'apis').length}/${allModules.length}`,
              },
              {
                key: 'ui' as const,
                label: t('settings.uiPreferences', 'UI Preferences'),
                Icon: ScreenIcon,
              },
              {
                key: 'limits' as const,
                label: t('settings.ramLimits', 'RAM & Limits'),
                Icon: BrainIcon,
              },
              {
                key: 'about' as const,
                label: t('settings.aboutAndSpecs', 'About & Specs'),
                Icon: InfoCircleIcon,
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
                    animateNextLayout();
                    setSettingsActiveSubTab(tab.key);
                  }}
                  style={{
                    paddingVertical: 8,
                    paddingHorizontal: 14,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    borderRadius: 9,
                    backgroundColor: isActive
                      ? AppColors.purple
                      : 'transparent',
                  }}>
                  <IconComp
                    color={isActive ? AppColors.white : AppColors.grayText}
                    size={13}
                  />
                  <Text
                    style={{
                      fontFamily: AppFonts.interBold,
                      fontSize: 12.5,
                      lineHeight: 16,
                      color: isActive
                        ? AppColors.white
                        : AppColors.grayText,
                    }}>
                    {tab.label}
                  </Text>
                  {tab.badge && (
                    <View
                      style={{
                        backgroundColor: isActive
                          ? 'rgba(255,255,255,0.25)'
                          : `${AppColors.purple}18`,
                        paddingHorizontal: 5.5,
                        paddingVertical: 1,
                        borderRadius: 10,
                      }}>
                      <Text
                        style={{
                          fontFamily: AppFonts.interBold,
                          fontSize: 9.5,
                          color: isActive
                            ? AppColors.white
                            : AppColors.purple,
                        }}>
                        {tab.badge}
                      </Text>
                    </View>
                  )}
                </TouchableScale>
              );
            })}
          </ScrollView>
        </View>

        {settingsActiveSubTab === 'module' && (
          <View style={{gap: 12}}>
            {/* Individual Module Cards with Left Checkboxes */}
            <View style={{gap: 10}}>
              {allModules.map(moduleItem => {
                const isReduxAvail = isReduxConnected();
                const isAnalyticsAvail = isAnalyticsConnected();
                const isUnavailable =
                  (moduleItem.key === 'redux' && !isReduxAvail) ||
                  (moduleItem.key === 'analytics' && !isAnalyticsAvail);
                const isLocked = moduleItem.key === 'apis' || isUnavailable;
                const isChecked =
                  moduleItem.key === 'apis' ||
                  (Boolean(
                    stagedTabVisibility?.[moduleItem.key as ActiveTab],
                  ) &&
                    !isUnavailable);

                const liveStats =
                  moduleItem.key === 'apis'
                    ? `${logs.length} requests • Limit: ${maxNetworkLogs}`
                    : moduleItem.key === 'logs'
                    ? `${consoleLogs.length} logs • Limit: ${maxConsoleLogs}`
                    : moduleItem.key === 'performance'
                    ? '60 FPS Target • Memory Telemetry'
                    : moduleItem.key === 'bundle'
                    ? 'Metro Packager • Dependency Map'
                    : moduleItem.key === 'crash'
                    ? `${
                        crashRecords?.length || 0
                      } crashes recorded • Crash Guard`
                    : moduleItem.key === 'analytics'
                    ? `${analyticsEvents.length} events logged`
                    : moduleItem.key === 'redux'
                    ? `${
                        Object.keys(reduxState || {}).length
                      } slices • Depth: ${reduxExpandDepth}`
                    : '';

                return (
                  <View
                    key={moduleItem.key}
                    style={{
                      backgroundColor: AppColors.primaryLight,
                      borderRadius: 14,
                      borderWidth: 1.5,
                      borderColor: isChecked
                        ? `${AppColors.purple}38`
                        : AppColors.grayBorderSecondary,
                      padding: 14,
                      gap: 10,
                      shadowColor: AppColors.black,
                      shadowOpacity: isChecked ? 0.04 : 0.02,
                      shadowRadius: 5,
                      shadowOffset: {width: 0, height: 2},
                    }}>
                    {/* Top Row: [Checkbox] -> [Icon Tile] -> [Title & Subtitle] */}
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'flex-start',
                        gap: 10,
                      }}>
                      {/* 1. Checkbox on the Left */}
                      <TouchableScale
                        accessible={true}
                        accessibilityRole="checkbox"
                        accessibilityLabel={`Select ${moduleItem.label}`}
                        accessibilityState={{
                          checked: isChecked,
                          disabled: isLocked,
                        }}
                        disabled={isLocked}
                        onPress={() => {
                          if (isLocked) return;
                          setStagedTabVisibility(prev => ({
                            ...prev,
                            [moduleItem.key]:
                              !prev[moduleItem.key as ActiveTab],
                          }));
                        }}
                        hitSlop={8}
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: 6,
                          borderWidth: isChecked ? 0 : 1.8,
                          borderColor: isLocked
                            ? AppColors.dividerColor
                            : AppColors.grayBorderSecondary,
                          backgroundColor:
                            moduleItem.key === 'apis'
                              ? `${AppColors.blue500}22`
                              : isChecked
                              ? AppColors.purple
                              : AppColors.grayBackground,
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginTop: 7,
                          shadowColor: isChecked
                            ? AppColors.purple
                            : 'transparent',
                          shadowOpacity: isChecked ? 0.25 : 0,
                          shadowRadius: 2,
                          elevation: isChecked ? 2 : 0,
                        }}>
                        {moduleItem.key === 'apis' ? (
                          <CheckIcon size={12} color={AppColors.blue500} />
                        ) : isChecked ? (
                          <CheckIcon size={12} color={AppColors.white} />
                        ) : isLocked ? (
                          <Svg
                            width={10}
                            height={10}
                            viewBox="0 0 24 24"
                            fill="none">
                            <Path
                              d="M7 10V7a5 5 0 0 1 10 0v3"
                              stroke={AppColors.grayText}
                              strokeWidth="2.2"
                              strokeLinecap="round"
                            />
                            <Path
                              d="M5 10h14v9a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1z"
                              fill={AppColors.grayText}
                            />
                          </Svg>
                        ) : null}
                      </TouchableScale>

                      {/* 2. Middle Tap Zone: Icon + Title & Desc */}
                      <TouchableScale
                        accessible={true}
                        accessibilityRole="button"
                        accessibilityLabel={`${moduleItem.label} settings`}
                        disabled={isUnavailable}
                        onPress={() => {
                          animateNextLayout();
                          setSettingsPage(moduleItem.key);
                        }}
                        style={{
                          flex: 1,
                          flexDirection: 'row',
                          alignItems: 'flex-start',
                          gap: 10,
                        }}>
                        {/* Icon Tile */}
                        <View
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 10,
                            backgroundColor: isLocked
                              ? `${AppColors.grayBorderSecondary}4D`
                              : isChecked
                              ? `${AppColors.purple}14`
                              : AppColors.grayBackground,
                            borderWidth: 1,
                            borderColor: isLocked
                              ? AppColors.dividerColor
                              : isChecked
                              ? `${AppColors.purple}33`
                              : AppColors.grayBorderSecondary,
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginTop: 1,
                          }}>
                          {moduleItem.icon === 'apis' && (
                            <SignalIcon
                              color={
                                isChecked
                                  ? AppColors.purple
                                  : AppColors.grayTextWeak
                              }
                              size={16}
                            />
                          )}
                          {moduleItem.icon === 'logs' && (
                            <TerminalIcon
                              color={
                                isChecked
                                  ? AppColors.purple
                                  : AppColors.grayTextWeak
                              }
                              size={16}
                            />
                          )}
                          {moduleItem.icon === 'performance' && (
                            <PerformanceIcon
                              color={
                                isChecked
                                  ? AppColors.purple
                                  : AppColors.grayTextWeak
                              }
                              size={16}
                            />
                          )}
                          {moduleItem.icon === 'bundle' && (
                            <PackageIcon
                              color={
                                isChecked
                                  ? AppColors.purple
                                  : AppColors.grayTextWeak
                              }
                              size={16}
                            />
                          )}
                          {moduleItem.icon === 'crash' && (
                            <CrashIcon
                              color={
                                isChecked
                                  ? AppColors.purple
                                  : AppColors.grayTextWeak
                              }
                              size={16}
                            />
                          )}
                          {moduleItem.icon === 'analytics' && (
                            <AnalyticsIcon
                              color={
                                isChecked
                                  ? AppColors.purple
                                  : AppColors.grayTextWeak
                              }
                              size={16}
                            />
                          )}
                          {moduleItem.icon === 'redux' && (
                            <ReduxIcon
                              color={
                                isChecked
                                  ? AppColors.purple
                                  : AppColors.grayTextWeak
                              }
                              size={16}
                            />
                          )}
                          {moduleItem.icon === 'device' && (
                            <SmartphoneIcon
                              color={
                                isChecked
                                  ? AppColors.purple
                                  : AppColors.grayTextWeak
                              }
                              size={16}
                            />
                          )}
                          {moduleItem.icon === 'storage' && (
                            <DatabaseIcon
                              color={
                                isChecked
                                  ? AppColors.purple
                                  : AppColors.grayTextWeak
                              }
                              size={16}
                            />
                          )}
                          {moduleItem.icon === 'debugging' && (
                            <QrCodeIcon
                              color={
                                isChecked
                                  ? AppColors.purple
                                  : AppColors.grayTextWeak
                              }
                              size={16}
                            />
                          )}
                        </View>

                        {/* Titles & Status Pill */}
                        <View style={{flex: 1, gap: 2}}>
                          <View
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              gap: 6,
                              flexWrap: 'wrap',
                            }}>
                            <View
                              style={{
                                minWidth: 22,
                                height: 22,
                                paddingHorizontal: 5,
                                borderRadius: 11,
                                backgroundColor: isChecked
                                  ? `${AppColors.purple}1C`
                                  : `${AppColors.grayBorderSecondary}80`,
                                borderWidth: 1,
                                borderColor: isChecked
                                  ? `${AppColors.purple}44`
                                  : AppColors.grayBorderSecondary,
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}>
                              <Text
                                style={{
                                  fontFamily: AppFonts.interBold,
                                  fontSize: 10,
                                  lineHeight: 13,
                                  color: isChecked
                                    ? AppColors.purple
                                    : AppColors.grayText,
                                }}>
                                #{moduleItem.id}
                              </Text>
                            </View>
                            <Text
                              style={{
                                fontFamily: AppFonts.interBold,
                                fontSize: 14,
                                lineHeight: 18,
                                color: isLocked
                                  ? AppColors.grayText
                                  : AppColors.primaryBlack,
                              }}>
                              {moduleItem.label}
                            </Text>

                            {/* Default Startup Tab Badge */}
                            {moduleItem.key === defaultTab &&
                              !isUnavailable && (
                                <View
                                  style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    backgroundColor: `${AppColors.purple}14`,
                                    borderRadius: 12,
                                    paddingHorizontal: 5,
                                    paddingVertical: 1.5,
                                    borderWidth: 1,
                                    borderColor: `${AppColors.purple}2E`,
                                    gap: 3,
                                  }}>
                                  <View
                                    style={{
                                      width: 4,
                                      height: 4,
                                      borderRadius: 2,
                                      backgroundColor: AppColors.purple,
                                    }}
                                  />
                                  <Text
                                    style={{
                                      fontFamily: AppFonts.interBold,
                                      fontSize: 8,
                                      lineHeight: 11,
                                      color: AppColors.purple,
                                      letterSpacing: 0.4,
                                    }}>
                                    {t('settings.defaultBadge')}
                                  </Text>
                                </View>
                              )}

                            {/* Status Pill */}
                            {moduleItem.key === 'apis' ? (
                              <View
                                style={{
                                  backgroundColor: `${AppColors.blue500}14`,
                                  borderRadius: 4,
                                  paddingHorizontal: 5,
                                  paddingVertical: 1.5,
                                  borderWidth: 1,
                                  borderColor: `${AppColors.blue500}33`,
                                }}>
                                <Text
                                  style={{
                                    fontFamily: AppFonts.interBold,
                                    fontSize: 8,
                                    lineHeight: 11,
                                    color: AppColors.blue500,
                                    letterSpacing: 0.3,
                                  }}>
                                  {t('settings.coreBadge')}
                                </Text>
                              </View>
                            ) : isUnavailable ? (
                              <View
                                style={{
                                  backgroundColor: `${AppColors.amber500}18`,
                                  borderRadius: 4,
                                  paddingHorizontal: 5,
                                  paddingVertical: 1.5,
                                  borderWidth: 1,
                                  borderColor: `${AppColors.amber500}35`,
                                }}>
                                <Text
                                  style={{
                                    fontFamily: AppFonts.interBold,
                                    fontSize: 8,
                                    lineHeight: 11,
                                    color: AppColors.amber700,
                                    letterSpacing: 0.3,
                                  }}>
                                  {moduleItem.key === 'redux'
                                    ? t('settings.notConnectedBadge')
                                    : t('settings.notDetectedBadge')}
                                </Text>
                              </View>
                            ) : isChecked ? (
                              <View
                                style={{
                                  backgroundColor: `${AppColors.liveGreen}18`,
                                  borderRadius: 4,
                                  paddingHorizontal: 5,
                                  paddingVertical: 1.5,
                                  borderWidth: 1,
                                  borderColor: `${AppColors.liveGreen}38`,
                                }}>
                                <Text
                                  style={{
                                    fontFamily: AppFonts.interBold,
                                    fontSize: 8,
                                    lineHeight: 11,
                                    color: AppColors.green700,
                                    letterSpacing: 0.3,
                                  }}>
                                  {t('settings.activeBadge')}
                                </Text>
                              </View>
                            ) : (
                              <View
                                style={{
                                  backgroundColor: `${AppColors.grayTextWeak}18`,
                                  borderRadius: 4,
                                  paddingHorizontal: 5,
                                  paddingVertical: 1.5,
                                  borderWidth: 1,
                                  borderColor: `${AppColors.grayTextWeak}2E`,
                                }}>
                                <Text
                                  style={{
                                    fontFamily: AppFonts.interBold,
                                    fontSize: 8,
                                    lineHeight: 11,
                                    color: AppColors.grayTextWeak,
                                    letterSpacing: 0.3,
                                  }}>
                                  {t('settings.dormantBadge')}
                                </Text>
                              </View>
                            )}
                          </View>

                          <Text
                            style={{
                              fontFamily: AppFonts.interRegular,
                              fontSize: 11,
                              color: AppColors.grayText,
                              lineHeight: 15,
                              marginTop: 1,
                            }}>
                            {moduleItem.desc}
                          </Text>
                        </View>
                      </TouchableScale>
                    </View>

                    {/* Card Footer: Live Stats + Configure Button */}
                    {!isUnavailable && (
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          paddingTop: 8,
                          borderTopWidth: 1,
                          borderTopColor: AppColors.dividerColor,
                        }}>
                        {/* Live Info Pill */}
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 6,
                            flex: 1,
                          }}>
                          <View
                            style={{
                              width: 6,
                              height: 6,
                              borderRadius: 3,
                              backgroundColor: isChecked
                                ? AppColors.liveGreen
                                : AppColors.grayTextWeak,
                            }}
                          />
                          <Text
                            style={{
                              fontFamily: AppFonts.interMedium,
                              fontSize: 11,
                              color: AppColors.grayText,
                              lineHeight: 14,
                            }}>
                            {liveStats}
                          </Text>
                        </View>

                        {/* Sleek Configure Button */}
                        <TouchableScale
                          accessible={true}
                          accessibilityRole="button"
                          accessibilityLabel={`Configure ${moduleItem.label} settings`}
                          onPress={() => {
                            animateNextLayout();
                            setSettingsPage(moduleItem.key);
                          }}
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 5,
                            backgroundColor: `${AppColors.purple}12`,
                            paddingHorizontal: 10,
                            paddingVertical: 5,
                            borderRadius: 8,
                            borderWidth: 1,
                            borderColor: `${AppColors.purple}26`,
                          }}>
                          <SettingsIcon color={AppColors.purple} size={11} />
                          <Text
                            style={{
                              fontFamily: AppFonts.interBold,
                              fontSize: 11,
                              lineHeight: 14,
                              color: AppColors.purple,
                            }}>
                            {t('settings.configure')}
                          </Text>
                          <ForwardChevronIcon
                            color={AppColors.purple}
                            size={9}
                          />
                        </TouchableScale>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {settingsActiveSubTab === 'ui' && (
          <View style={{gap: 14}}>
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
                        ? `#${allModules.find(m => m.key === defaultTab)?.id} ${allModules.find(m => m.key === defaultTab)?.label}`
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
                          stagedTabVisibility?.[tab.key as ActiveTab] ||
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
                      Show a floating toast banner with countdown progress when
                      a newer release is published on npm.
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
          </View>
        )}

        {settingsActiveSubTab === 'limits' && (
          <View style={{gap: 14}}>
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
                      Dynamically sets log limits according to available device memory
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
                  style={{flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4}}>
                  {[
                    {
                      label: 'APIs',
                      value: isAutoRamLimitEnabled
                        ? autoRamProfile.maxNetworkLogs
                        : maxNetworkLogs,
                      color: AppColors.blue500,
                    },
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
                    Automatically prunes in-memory buffers by 50% when the OS signals low memory
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
                    Manual Memory Cleanup
                  </Text>
                  <Text
                    style={{
                      fontFamily: AppFonts.interRegular,
                      fontSize: 11,
                      color: AppColors.grayText,
                      marginTop: 1,
                    }}>
                    Prune older entries across all log stores and free RAM
                  </Text>
                </View>
                <TouchableScale
                  onPress={() => {
                    const summary = pruneAllLogs('manual', 0.5);
                    showToast(
                      `Pruned ${summary.totalPruned} items from memory`,
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
          </View>
        )}
        {settingsActiveSubTab === 'about' && (
          <View style={{gap: 14}}>
            {/* Header Hero Branding Card */}
            <View
              style={{
                backgroundColor: AppColors.primaryLight,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: AppColors.grayBorderSecondary,
                padding: 16,
                gap: 12,
              }}>
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
                    gap: 12,
                    flex: 1,
                  }}>
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      backgroundColor: `${AppColors.purple}1A`,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: 1,
                      borderColor: `${AppColors.purple}33`,
                    }}>
                    <PackageIcon color={AppColors.purple} size={22} />
                  </View>
                  <View style={{flex: 1}}>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 8,
                        flexWrap: 'wrap',
                      }}>
                      <Text
                        style={{
                          fontFamily: AppFonts.interBold,
                          fontSize: 15,
                          lineHeight: 20,
                          color: AppColors.primaryBlack,
                        }}>
                        In-App Inspector
                      </Text>
                      <View
                        style={{
                          backgroundColor: `${AppColors.purple}18`,
                          paddingHorizontal: 7,
                          paddingVertical: 2,
                          borderRadius: 6,
                          borderWidth: 1,
                          borderColor: `${AppColors.purple}33`,
                        }}>
                        <Text
                          style={{
                            fontFamily: AppFonts.interBold,
                            fontSize: 10,
                            color: AppColors.purple,
                          }}>
                          v{LIB_VERSION}
                        </Text>
                      </View>
                      {updateAvailable ? (
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 3,
                            backgroundColor: '#F59E0B20',
                            paddingHorizontal: 6,
                            paddingVertical: 2,
                            borderRadius: 6,
                            borderWidth: 1,
                            borderColor: '#F59E0B60',
                          }}>
                          <Text
                            style={{
                              fontFamily: AppFonts.interBold,
                              fontSize: 9.5,
                              color: '#D97706',
                            }}>
                            v{latestNpmVersion} Available
                          </Text>
                          <BoltIcon size={9} color="#D97706" />
                        </View>
                      ) : (
                        <View
                          style={{
                            backgroundColor: `${AppColors.emerald500}20`,
                            paddingHorizontal: 6,
                            paddingVertical: 2,
                            borderRadius: 6,
                            borderWidth: 1,
                            borderColor: `${AppColors.emerald500}50`,
                          }}>
                          <Text
                            style={{
                              fontFamily: AppFonts.interBold,
                              fontSize: 9.5,
                              color: AppColors.emerald600,
                            }}>
                            Up to date
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text
                      style={{
                        fontFamily: AppFonts.interRegular,
                        fontSize: 11,
                        lineHeight: 15,
                        color: AppColors.grayText,
                        marginTop: 2,
                      }}>
                      react-native-inapp-inspector
                    </Text>
                  </View>
                </View>
              </View>

              <Text
                style={{
                  fontFamily: AppFonts.interRegular,
                  fontSize: 11.5,
                  lineHeight: 16,
                  color: AppColors.grayText,
                }}>
                High-performance in-app debugging, network logging, console inspection, performance profiling, storage viewer & telemetry diagnostics for React Native.
              </Text>

              {updateAvailable && (
                <TouchableScale
                  onPress={() => {
                    copyToClipboard(
                      'npm install react-native-inapp-inspector@latest',
                      'Install Command',
                    );
                    showToast('Copied npm upgrade command!');
                  }}
                  style={{
                    backgroundColor: AppColors.purple,
                    paddingVertical: 8,
                    paddingHorizontal: 12,
                    borderRadius: 8,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                  }}>
                  <BoltIcon size={12} color={AppColors.white} />
                  <Text
                    style={{
                      fontFamily: AppFonts.interBold,
                      fontSize: 12,
                      color: AppColors.white,
                    }}>
                    Copy Upgrade Command (v{latestNpmVersion})
                  </Text>
                </TouchableScale>
              )}
            </View>

            {/* Quick Actions & Developer Community Grid */}
            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: 8,
              }}>
              <TouchableScale
                onPress={() => {
                  Linking.openURL(
                    'https://github.com/vengatmacuser/react-native-inapp-inspector',
                  ).catch(() => {});
                }}
                style={{
                  flex: 1,
                  minWidth: '47%',
                  backgroundColor: `${AppColors.purple}0F`,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: `${AppColors.purple}30`,
                  paddingVertical: 10,
                  paddingHorizontal: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                }}>
                <GitHubIcon color={AppColors.purple} size={18} />
                <View style={{flex: 1}}>
                  <Text
                    style={{
                      fontFamily: AppFonts.interBold,
                      fontSize: 11.5,
                      color: AppColors.primaryBlack,
                    }}>
                    ⭐ Star on GitHub
                  </Text>
                  <Text
                    style={{
                      fontFamily: AppFonts.interRegular,
                      fontSize: 9.5,
                      color: AppColors.grayText,
                    }}>
                    Support open source
                  </Text>
                </View>
              </TouchableScale>

              <TouchableScale
                onPress={() => {
                  Linking.openURL(
                    'https://www.npmjs.com/package/react-native-inapp-inspector',
                  ).catch(() => {});
                }}
                style={{
                  flex: 1,
                  minWidth: '47%',
                  backgroundColor: AppColors.primaryLight,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: AppColors.grayBorderSecondary,
                  paddingVertical: 10,
                  paddingHorizontal: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                }}>
                <NpmIcon color="#CB3837" size={18} />
                <View style={{flex: 1}}>
                  <Text
                    style={{
                      fontFamily: AppFonts.interBold,
                      fontSize: 11.5,
                      color: AppColors.primaryBlack,
                    }}>
                    NPM Registry
                  </Text>
                  <Text
                    style={{
                      fontFamily: AppFonts.interRegular,
                      fontSize: 9.5,
                      color: AppColors.grayText,
                    }}>
                    Package repository
                  </Text>
                </View>
              </TouchableScale>

              <TouchableScale
                onPress={() => {
                  Linking.openURL(
                    'https://github.com/vengatmacuser/react-native-inapp-inspector#readme',
                  ).catch(() => {});
                }}
                style={{
                  flex: 1,
                  minWidth: '47%',
                  backgroundColor: AppColors.primaryLight,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: AppColors.grayBorderSecondary,
                  paddingVertical: 10,
                  paddingHorizontal: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                }}>
                <Text style={{fontSize: 16}}>📖</Text>
                <View style={{flex: 1}}>
                  <Text
                    style={{
                      fontFamily: AppFonts.interBold,
                      fontSize: 11.5,
                      color: AppColors.primaryBlack,
                    }}>
                    Documentation
                  </Text>
                  <Text
                    style={{
                      fontFamily: AppFonts.interRegular,
                      fontSize: 9.5,
                      color: AppColors.grayText,
                    }}>
                    Setup & API guide
                  </Text>
                </View>
              </TouchableScale>

              <TouchableScale
                onPress={() => {
                  Linking.openURL(
                    'https://github.com/vengatmacuser/react-native-inapp-inspector/issues',
                  ).catch(() => {});
                }}
                style={{
                  flex: 1,
                  minWidth: '47%',
                  backgroundColor: AppColors.primaryLight,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: AppColors.grayBorderSecondary,
                  paddingVertical: 10,
                  paddingHorizontal: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                }}>
                <Text style={{fontSize: 16}}>🐞</Text>
                <View style={{flex: 1}}>
                  <Text
                    style={{
                      fontFamily: AppFonts.interBold,
                      fontSize: 11.5,
                      color: AppColors.primaryBlack,
                    }}>
                    Report Issue
                  </Text>
                  <Text
                    style={{
                      fontFamily: AppFonts.interRegular,
                      fontSize: 9.5,
                      color: AppColors.grayText,
                    }}>
                    Bugs & feature requests
                  </Text>
                </View>
              </TouchableScale>

              <TouchableScale
                onPress={() => {
                  Linking.openURL(
                    'https://github.com/vengatmacuser/react-native-inapp-inspector/releases',
                  ).catch(() => {});
                }}
                style={{
                  flex: 1,
                  minWidth: '47%',
                  backgroundColor: AppColors.primaryLight,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: AppColors.grayBorderSecondary,
                  paddingVertical: 10,
                  paddingHorizontal: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                }}>
                <Text style={{fontSize: 16}}>🏷️</Text>
                <View style={{flex: 1}}>
                  <Text
                    style={{
                      fontFamily: AppFonts.interBold,
                      fontSize: 11.5,
                      color: AppColors.primaryBlack,
                    }}>
                    Release Notes
                  </Text>
                  <Text
                    style={{
                      fontFamily: AppFonts.interRegular,
                      fontSize: 9.5,
                      color: AppColors.grayText,
                    }}>
                    Version changelog
                  </Text>
                </View>
              </TouchableScale>

              <TouchableScale
                onPress={() => {
                  const win = Dimensions.get('window');
                  const scr = Dimensions.get('screen');
                  const rnVer = (Platform.constants as any)?.reactNativeVersion;
                  const specsPayload = {
                    package: {
                      name: 'react-native-inapp-inspector',
                      version: `v${LIB_VERSION}`,
                      latestNpmVersion: latestNpmVersion ? `v${latestNpmVersion}` : 'Checking...',
                      license: 'MIT',
                      repository: 'https://github.com/vengatmacuser/react-native-inapp-inspector',
                    },
                    hostApp: {
                      name: getAppName(),
                      bundleId: getBundleIdentifier(),
                      versionAndBuild: getAppVersionAndBuild().formatted,
                      buildVariant: __DEV__ ? 'Development (Debug)' : 'Production (Release)',
                      metroConnected: isLocalDebugEnvironment(),
                    },
                    runtime: {
                      reactNativeVersion: rnVer ? `${rnVer.major}.${rnVer.minor}.${rnVer.patch}` : '0.74+',
                      reactVersion: React.version,
                      jsEngine: Boolean((global as any)?.HermesInternal) ? 'Hermes' : 'JavaScriptCore (JSC)',
                      architecture: Boolean((global as any)?.nativeFabricUIManager) ? 'Fabric (New Architecture)' : 'Paper (Legacy Bridge)',
                      turboModules: Boolean((global as any)?.__turboModuleProxy || (global as any)?.TurboModuleRegistry),
                    },
                    device: {
                      platform: Platform.OS,
                      osVersion: Platform.Version,
                      deviceModel: (Platform.constants as any)?.Model || 'Unknown Device',
                      windowDimensions: `${Math.round(win.width)}x${Math.round(win.height)} pt`,
                      screenDimensions: `${Math.round(scr.width)}x${Math.round(scr.height)} pt`,
                      pixelRatio: PixelRatio.get(),
                      fontScale: PixelRatio.getFontScale(),
                      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Unknown',
                      locale: Intl.DateTimeFormat().resolvedOptions().locale || 'en',
                    },
                    storageAndCapabilities: {
                      storageEngine: isPersistentStorageAvailable() ? 'MMKV (Fast Native Storage)' : 'In-Memory State',
                      hasNativeModule: Boolean((global as any)?.NativeInspectorModule || (global as any)?.__IN_APP_INSPECTOR_NATIVE__),
                      reduxConnected: isReduxConnected(),
                      analyticsConnected: isAnalyticsConnected(),
                    },
                  };

                  copyToClipboard(
                    JSON.stringify(specsPayload, null, 2),
                    'Diagnostic Specifications',
                  );
                  showToast('Copied full diagnostic specs to clipboard!');
                }}
                style={{
                  flex: 1,
                  minWidth: '47%',
                  backgroundColor: AppColors.primaryLight,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: AppColors.grayBorderSecondary,
                  paddingVertical: 10,
                  paddingHorizontal: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                }}>
                <CopyIcon color={AppColors.purple} size={16} />
                <View style={{flex: 1}}>
                  <Text
                    style={{
                      fontFamily: AppFonts.interBold,
                      fontSize: 11.5,
                      color: AppColors.primaryBlack,
                    }}>
                    Copy Specs JSON
                  </Text>
                  <Text
                    style={{
                      fontFamily: AppFonts.interRegular,
                      fontSize: 9.5,
                      color: AppColors.grayText,
                    }}>
                    Diagnostics payload
                  </Text>
                </View>
              </TouchableScale>
            </View>

            {/* Section: Package Version & Upgrades */}
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
                PACKAGE VERSION & UPGRADES
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
                    marginRight: 8,
                  }}>
                  <View
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 9,
                      backgroundColor: '#CB383715',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                    <NpmIcon color="#CB3837" size={17} />
                  </View>
                  <View style={{flex: 1}}>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 6,
                      }}>
                      <Text
                        style={{
                          fontFamily: AppFonts.interBold,
                          fontSize: 14,
                          lineHeight: 18,
                          color: AppColors.primaryBlack,
                        }}>
                        v{LIB_VERSION}
                      </Text>
                      {updateAvailable ? (
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 3,
                            backgroundColor: '#F59E0B20',
                            paddingHorizontal: 6,
                            paddingVertical: 1.5,
                            borderRadius: 5,
                            borderWidth: 1,
                            borderColor: '#F59E0B60',
                          }}>
                          <Text
                            style={{
                              fontFamily: AppFonts.interBold,
                              fontSize: 9.5,
                              color: '#D97706',
                            }}>
                            v{latestNpmVersion} Available
                          </Text>
                          <BoltIcon size={9} color="#D97706" />
                        </View>
                      ) : (
                        <View
                          style={{
                            backgroundColor: `${AppColors.emerald500}20`,
                            paddingHorizontal: 6,
                            paddingVertical: 1.5,
                            borderRadius: 5,
                            borderWidth: 1,
                            borderColor: `${AppColors.emerald500}50`,
                          }}>
                          <Text
                            style={{
                              fontFamily: AppFonts.interBold,
                              fontSize: 9.5,
                              color: AppColors.emerald600,
                            }}>
                            Up to date
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text
                      style={{
                        fontFamily: AppFonts.interRegular,
                        fontSize: 11,
                        lineHeight: 15,
                        color: AppColors.grayText,
                        marginTop: 1,
                      }}>
                      {updateAvailable
                        ? `A newer release (v${latestNpmVersion}) is available on npm registry.`
                        : 'You are running the latest version from npm registry.'}
                    </Text>
                  </View>
                </View>

                <TouchableScale
                  onPress={() => {
                    copyToClipboard(
                      'npm install react-native-inapp-inspector@latest',
                      'Install Command',
                    );
                    showToast('Copied npm install command!');
                  }}
                  style={{
                    backgroundColor: updateAvailable ? AppColors.purple : `${AppColors.purple}18`,
                    paddingVertical: 7,
                    paddingHorizontal: 11,
                    borderRadius: 8,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 5,
                  }}>
                  <CopyIcon color={updateAvailable ? AppColors.white : AppColors.purple} size={12} />
                  <Text
                    style={{
                      fontFamily: AppFonts.interBold,
                      fontSize: 11,
                      color: updateAvailable ? AppColors.white : AppColors.purple,
                    }}>
                    {updateAvailable ? 'Copy Upgrade' : 'Copy Install'}
                  </Text>
                </TouchableScale>
              </View>
            </View>

            {/* Section 1: Host Application Specs */}
            <View
              style={{
                backgroundColor: AppColors.primaryLight,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: AppColors.grayBorderSecondary,
                padding: 14,
                gap: 10,
              }}>
              <Text
                style={{
                  fontFamily: AppFonts.interBold,
                  fontSize: 11,
                  lineHeight: 14,
                  color: AppColors.grayTextWeak,
                  letterSpacing: 0.8,
                }}>
                HOST APPLICATION & BUILD
              </Text>

              <View style={{gap: 8}}>
                <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                  <Text style={{fontFamily: AppFonts.interRegular, fontSize: 11.5, color: AppColors.grayText}}>
                    Application Name
                  </Text>
                  <Text style={{fontFamily: AppFonts.interBold, fontSize: 11.5, color: AppColors.primaryBlack}}>
                    {getAppName()}
                  </Text>
                </View>

                <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                  <Text style={{fontFamily: AppFonts.interRegular, fontSize: 11.5, color: AppColors.grayText}}>
                    Bundle ID / Package
                  </Text>
                  <Text style={{fontFamily: AppFonts.interRegular, fontSize: 11, color: AppColors.primaryBlack}}>
                    {getBundleIdentifier()}
                  </Text>
                </View>

                <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                  <Text style={{fontFamily: AppFonts.interRegular, fontSize: 11.5, color: AppColors.grayText}}>
                    Version & Build Number
                  </Text>
                  <Text style={{fontFamily: AppFonts.interBold, fontSize: 11.5, color: AppColors.primaryBlack}}>
                    {getAppVersionAndBuild().formatted}
                  </Text>
                </View>

                <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                  <Text style={{fontFamily: AppFonts.interRegular, fontSize: 11.5, color: AppColors.grayText}}>
                    Build Variant
                  </Text>
                  <View
                    style={{
                      backgroundColor: __DEV__ ? `${AppColors.amber500}20` : `${AppColors.emerald500}20`,
                      paddingHorizontal: 6,
                      paddingVertical: 1.5,
                      borderRadius: 5,
                      borderWidth: 1,
                      borderColor: __DEV__ ? `${AppColors.amber500}50` : `${AppColors.emerald500}50`,
                    }}>
                    <Text
                      style={{
                        fontFamily: AppFonts.interBold,
                        fontSize: 10,
                        color: __DEV__ ? AppColors.amber500 : AppColors.emerald600,
                      }}>
                      {__DEV__ ? 'Development (Debug)' : 'Production (Release)'}
                    </Text>
                  </View>
                </View>

                <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                  <Text style={{fontFamily: AppFonts.interRegular, fontSize: 11.5, color: AppColors.grayText}}>
                    Metro Bundler Connection
                  </Text>
                  <Text
                    style={{
                      fontFamily: AppFonts.interBold,
                      fontSize: 11.5,
                      color: isLocalDebugEnvironment() ? AppColors.emerald600 : AppColors.grayText,
                    }}>
                    {isLocalDebugEnvironment() ? 'Connected (Hot Reload Active)' : 'Offline / Standalone'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Section 2: React Native Engine & Runtime Specs */}
            <View
              style={{
                backgroundColor: AppColors.primaryLight,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: AppColors.grayBorderSecondary,
                padding: 14,
                gap: 10,
              }}>
              <Text
                style={{
                  fontFamily: AppFonts.interBold,
                  fontSize: 11,
                  lineHeight: 14,
                  color: AppColors.grayTextWeak,
                  letterSpacing: 0.8,
                }}>
                FRAMEWORK & RUNTIME ENGINE
              </Text>

              <View style={{gap: 8}}>
                <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                  <Text style={{fontFamily: AppFonts.interRegular, fontSize: 11.5, color: AppColors.grayText}}>
                    React Native Version
                  </Text>
                  <Text style={{fontFamily: AppFonts.interBold, fontSize: 11.5, color: AppColors.primaryBlack}}>
                    v{((Platform.constants as any)?.reactNativeVersion?.major != null)
                      ? `${(Platform.constants as any).reactNativeVersion.major}.${(Platform.constants as any).reactNativeVersion.minor}.${(Platform.constants as any).reactNativeVersion.patch}`
                      : '0.74+'}
                  </Text>
                </View>

                <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                  <Text style={{fontFamily: AppFonts.interRegular, fontSize: 11.5, color: AppColors.grayText}}>
                    React Core Version
                  </Text>
                  <Text style={{fontFamily: AppFonts.interBold, fontSize: 11.5, color: AppColors.primaryBlack}}>
                    v{React.version}
                  </Text>
                </View>

                <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                  <Text style={{fontFamily: AppFonts.interRegular, fontSize: 11.5, color: AppColors.grayText}}>
                    JavaScript Engine
                  </Text>
                  <View
                    style={{
                      backgroundColor: `${AppColors.purple}15`,
                      paddingHorizontal: 6,
                      paddingVertical: 1.5,
                      borderRadius: 5,
                      borderWidth: 1,
                      borderColor: `${AppColors.purple}40`,
                    }}>
                    <Text style={{fontFamily: AppFonts.interBold, fontSize: 10.5, color: AppColors.purple}}>
                      {Boolean((global as any)?.HermesInternal) ? 'Hermes Engine (Active)' : 'JavaScriptCore (JSC)'}
                    </Text>
                  </View>
                </View>

                <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                  <Text style={{fontFamily: AppFonts.interRegular, fontSize: 11.5, color: AppColors.grayText}}>
                    Rendering Architecture
                  </Text>
                  <Text style={{fontFamily: AppFonts.interBold, fontSize: 11.5, color: AppColors.primaryBlack}}>
                    {Boolean((global as any)?.nativeFabricUIManager) ? 'Fabric (New Architecture)' : 'Paper (Legacy Bridge)'}
                  </Text>
                </View>

                <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                  <Text style={{fontFamily: AppFonts.interRegular, fontSize: 11.5, color: AppColors.grayText}}>
                    TurboModules Support
                  </Text>
                  <Text style={{fontFamily: AppFonts.interBold, fontSize: 11.5, color: AppColors.primaryBlack}}>
                    {Boolean((global as any)?.__turboModuleProxy || (global as any)?.TurboModuleRegistry)
                      ? 'Enabled (C++ JSI)'
                      : 'Standard Bridge'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Section 3: Device & Display Metrics */}
            <View
              style={{
                backgroundColor: AppColors.primaryLight,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: AppColors.grayBorderSecondary,
                padding: 14,
                gap: 10,
              }}>
              <Text
                style={{
                  fontFamily: AppFonts.interBold,
                  fontSize: 11,
                  lineHeight: 14,
                  color: AppColors.grayTextWeak,
                  letterSpacing: 0.8,
                }}>
                DEVICE & DISPLAY METRICS
              </Text>

              <View style={{gap: 8}}>
                <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                  <Text style={{fontFamily: AppFonts.interRegular, fontSize: 11.5, color: AppColors.grayText}}>
                    Operating System
                  </Text>
                  <Text style={{fontFamily: AppFonts.interBold, fontSize: 11.5, color: AppColors.primaryBlack}}>
                    {Platform.OS === 'ios' ? 'Apple iOS' : Platform.OS === 'android' ? 'Google Android' : Platform.OS}{' '}
                    {Platform.Version}
                  </Text>
                </View>

                <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                  <Text style={{fontFamily: AppFonts.interRegular, fontSize: 11.5, color: AppColors.grayText}}>
                    Device Hardware Model
                  </Text>
                  <Text style={{fontFamily: AppFonts.interBold, fontSize: 11.5, color: AppColors.primaryBlack}}>
                    {(Platform.constants as any)?.Model ||
                      (Platform.OS === 'ios' ? 'Apple Device' : 'Android Device')}
                  </Text>
                </View>

                <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                  <Text style={{fontFamily: AppFonts.interRegular, fontSize: 11.5, color: AppColors.grayText}}>
                    Window Viewport (Points)
                  </Text>
                  <Text style={{fontFamily: AppFonts.interBold, fontSize: 11.5, color: AppColors.primaryBlack}}>
                    {Math.round(Dimensions.get('window').width)} × {Math.round(Dimensions.get('window').height)} pt
                  </Text>
                </View>

                <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                  <Text style={{fontFamily: AppFonts.interRegular, fontSize: 11.5, color: AppColors.grayText}}>
                    Native Physical Resolution
                  </Text>
                  <Text style={{fontFamily: AppFonts.interBold, fontSize: 11.5, color: AppColors.primaryBlack}}>
                    {Math.round(Dimensions.get('screen').width * PixelRatio.get())} × {Math.round(Dimensions.get('screen').height * PixelRatio.get())} px
                  </Text>
                </View>

                <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                  <Text style={{fontFamily: AppFonts.interRegular, fontSize: 11.5, color: AppColors.grayText}}>
                    Pixel Density & Font Scale
                  </Text>
                  <Text style={{fontFamily: AppFonts.interBold, fontSize: 11.5, color: AppColors.primaryBlack}}>
                    {PixelRatio.get().toFixed(1)}x ({PixelRatio.get() >= 3 ? '@3x' : PixelRatio.get() >= 2 ? '@2x' : '@1x'}) • Font: {PixelRatio.getFontScale().toFixed(2)}x
                  </Text>
                </View>

                <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                  <Text style={{fontFamily: AppFonts.interRegular, fontSize: 11.5, color: AppColors.grayText}}>
                    Timezone & Locale
                  </Text>
                  <Text style={{fontFamily: AppFonts.interBold, fontSize: 11.5, color: AppColors.primaryBlack}}>
                    {Intl.DateTimeFormat().resolvedOptions().timeZone || 'System'} ({Intl.DateTimeFormat().resolvedOptions().locale || 'en'})
                  </Text>
                </View>
              </View>
            </View>

            {/* Section 4: Inspector Capabilities & Storage */}
            <View
              style={{
                backgroundColor: AppColors.primaryLight,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: AppColors.grayBorderSecondary,
                padding: 14,
                gap: 10,
              }}>
              <Text
                style={{
                  fontFamily: AppFonts.interBold,
                  fontSize: 11,
                  lineHeight: 14,
                  color: AppColors.grayTextWeak,
                  letterSpacing: 0.8,
                }}>
                INSPECTOR STORAGE & CAPABILITIES
              </Text>

              <View style={{gap: 8}}>
                <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                  <Text style={{fontFamily: AppFonts.interRegular, fontSize: 11.5, color: AppColors.grayText}}>
                    Storage Persistence Engine
                  </Text>
                  <View
                    style={{
                      backgroundColor: isPersistentStorageAvailable() ? `${AppColors.emerald500}18` : `${AppColors.amber500}18`,
                      paddingHorizontal: 6,
                      paddingVertical: 1.5,
                      borderRadius: 5,
                      borderWidth: 1,
                      borderColor: isPersistentStorageAvailable() ? `${AppColors.emerald500}50` : `${AppColors.amber500}50`,
                    }}>
                    <Text
                      style={{
                        fontFamily: AppFonts.interBold,
                        fontSize: 10.5,
                        color: isPersistentStorageAvailable() ? AppColors.emerald600 : AppColors.amber500,
                      }}>
                      {isPersistentStorageAvailable() ? 'MMKV Fast Native Storage' : 'In-Memory State'}
                    </Text>
                  </View>
                </View>

                <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                  <Text style={{fontFamily: AppFonts.interRegular, fontSize: 11.5, color: AppColors.grayText}}>
                    Native Module Status
                  </Text>
                  <Text
                    style={{
                      fontFamily: AppFonts.interBold,
                      fontSize: 11.5,
                      color: Boolean((global as any)?.NativeInspectorModule) ? AppColors.emerald600 : AppColors.grayText,
                    }}>
                    {Boolean((global as any)?.NativeInspectorModule) ? 'Linked & Active' : 'JavaScript Only'}
                  </Text>
                </View>

                <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                  <Text style={{fontFamily: AppFonts.interRegular, fontSize: 11.5, color: AppColors.grayText}}>
                    Network Logger Interceptor
                  </Text>
                  <Text style={{fontFamily: AppFonts.interBold, fontSize: 11.5, color: AppColors.emerald600}}>
                    Active (XMLHttpRequest & Fetch Hooked)
                  </Text>
                </View>

                <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                  <Text style={{fontFamily: AppFonts.interRegular, fontSize: 11.5, color: AppColors.grayText}}>
                    Redux & Analytics Watchers
                  </Text>
                  <Text style={{fontFamily: AppFonts.interBold, fontSize: 11.5, color: AppColors.primaryBlack}}>
                    Redux: {isReduxConnected() ? 'Connected' : 'Listening'} • Analytics: {isAnalyticsConnected() ? 'Connected' : 'Listening'}
                  </Text>
                </View>

                <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                  <Text style={{fontFamily: AppFonts.interRegular, fontSize: 11.5, color: AppColors.grayText}}>
                    Crash & Exception Boundary
                  </Text>
                  <Text style={{fontFamily: AppFonts.interBold, fontSize: 11.5, color: AppColors.emerald600}}>
                    Global JS Exception Handler Active
                  </Text>
                </View>

                <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                  <Text style={{fontFamily: AppFonts.interRegular, fontSize: 11.5, color: AppColors.grayText}}>
                    Memory Management
                  </Text>
                  <Text style={{fontFamily: AppFonts.interBold, fontSize: 11.5, color: AppColors.emerald600}}>
                    Dynamic Auto RAM Tiering Active
                  </Text>
                </View>
              </View>
            </View>

            {/* Section 5: License & Copyright */}
            <View
              style={{
                backgroundColor: AppColors.primaryLight,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: AppColors.grayBorderSecondary,
                padding: 14,
                gap: 8,
              }}>
              <Text
                style={{
                  fontFamily: AppFonts.interBold,
                  fontSize: 11,
                  lineHeight: 14,
                  color: AppColors.grayTextWeak,
                  letterSpacing: 0.8,
                }}>
                LICENSE & CREDITS
              </Text>

              <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                <Text style={{fontFamily: AppFonts.interRegular, fontSize: 11.5, color: AppColors.grayText}}>
                  License
                </Text>
                <Text style={{fontFamily: AppFonts.interBold, fontSize: 11.5, color: AppColors.emerald600}}>
                  MIT Permissive Open Source
                </Text>
              </View>

              <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                <Text style={{fontFamily: AppFonts.interRegular, fontSize: 11.5, color: AppColors.grayText}}>
                  Created & Maintained By
                </Text>
                <Text style={{fontFamily: AppFonts.interBold, fontSize: 11.5, color: AppColors.primaryBlack}}>
                  Vengateswaran
                </Text>
              </View>

              <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                <Text style={{fontFamily: AppFonts.interRegular, fontSize: 11.5, color: AppColors.grayText}}>
                  Repository
                </Text>
                <Text style={{fontFamily: AppFonts.interRegular, fontSize: 11, color: AppColors.purple}}>
                  github.com/vengatmacuser/react-native-inapp-inspector
                </Text>
              </View>
            </View>
          </View>
        )}
        <View style={{height: 48}} />
      </ScrollView>

      {/* Bottom Sticky Action Bar for Save Changes */}
      {settingsActiveSubTab === 'module' && (
        <View
          style={{
            paddingHorizontal: 16,
            paddingTop: 12,
            paddingBottom: Platform.OS === 'ios' ? 36 : 24,
            backgroundColor: AppColors.primaryLight,
            borderTopWidth: 1,
            borderTopColor: AppColors.dividerColor,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            shadowColor: AppColors.black,
            shadowOpacity: 0.08,
            shadowRadius: 8,
            shadowOffset: {width: 0, height: -3},
            elevation: 8,
          }}>
          <View style={{flex: 1}}>
            <Text
              style={{
                fontFamily: AppFonts.interBold,
                fontSize: 13,
                lineHeight: 17,
                color: AppColors.primaryBlack,
              }}>
              {stagedActiveCount} of {allModules.length} Modules Active
            </Text>
            <Text
              style={{
                fontFamily: AppFonts.interRegular,
                fontSize: 11,
                lineHeight: 15,
                color: hasUnsavedChanges
                  ? AppColors.purple
                  : AppColors.grayText,
                marginTop: 1,
              }}>
              {hasUnsavedChanges
                ? t('settings.unsavedPending')
                : t('settings.allSynchronized')}
            </Text>
          </View>

          <TouchableScale
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Save Changes"
            onPress={handleSaveChanges}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              backgroundColor: hasUnsavedChanges
                ? AppColors.purple
                : `${AppColors.purple}22`,
              paddingHorizontal: 18,
              paddingVertical: 10,
              borderRadius: 10,
            }}>
            <CheckIcon
              size={14}
              color={hasUnsavedChanges ? AppColors.white : AppColors.purple}
            />
            <Text
              style={{
                fontFamily: AppFonts.interBold,
                fontSize: 13,
                lineHeight: 17,
                color: hasUnsavedChanges ? AppColors.white : AppColors.purple,
              }}>
              {t('settings.saveChanges')}
            </Text>
          </TouchableScale>
        </View>
      )}
    </View>
  );

  let content: React.ReactNode = null;
  let title = '';
  let icon: React.ReactNode = null;
  let rightInfo = '';

  if (settingsPage === 'apis') {
    title = t('settings.apis.title');
    icon = <SignalIcon color={AppColors.white} size={16} />;
    rightInfo = t('settings.apis.total', {count: logs.length});
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
            icon: <SignalIcon color={AppColors.purple} size={16} />,
            label: t('settings.apis.maxRequestLogs'),
            description: t('settings.apis.maxRequestLogsDescription'),
            numericInput: {
              value: maxNetworkLogs,
              onChange: setMaxNetworkLogs,
              min: 10,
              max: 100,
              placeholder: 'Enter max requests (10-100)',
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
    title = t('settings.logs.title');
    icon = <TerminalIcon color={AppColors.white} size={16} />;
    rightInfo = t('settings.logs.total', {count: consoleLogs.length});
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
    title = t('settings.analytics.title');
    icon = <AnalyticsIcon color={AppColors.white} size={16} />;
    rightInfo = t('settings.analytics.total', {count: analyticsEvents.length});
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
    title = t('settings.redux.title');
    icon = <ReduxIcon color={AppColors.white} size={16} />;
    rightInfo = t('settings.redux.reducers', {
      count: Object.keys(reduxState || {}).length,
    });
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
    title = t('settings.crash.title');
    icon = <CrashIcon color={AppColors.white} size={16} />;
    rightInfo = `Total: ${crashRecords?.length || 0}`;
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
            icon: <LayersIcon color={AppColors.purple} size={16} />,
            label: t('settings.crash.maxCrashLogs'),
            description: t('settings.crash.maxCrashLogsDesc'),
            numericInput: {
              value: maxCrashLogs,
              onChange: setMaxCrashLogs,
              min: 5,
              max: 50,
              placeholder: 'Enter max crashes (5-50)',
            },
          })}
          <View style={{height: 1, backgroundColor: AppColors.dividerColor}} />
          {renderSettingRow({
            icon: <ShieldAlertIcon color={AppColors.greenColor} size={16} />,
            label: t('settings.crash.globalGuard'),
            description: t('settings.crash.globalGuardDesc'),
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
                  {t('settings.protectedBadge')}
                </Text>
              </View>
            ),
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
            label: t('settings.crash.clearHistory'),
            description: t('settings.crash.clearHistoryDesc', {
              count: crashRecords?.length || 0,
            }),
            isLast: true,
            onPress: () => {
              clearCrashRecords();
              Alert.alert(
                t('common.success'),
                t('settings.crash.historyCleared'),
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
  } else if (settingsPage === 'bundle') {
    title = t('settings.bundle.title');
    icon = <PackageIcon color={AppColors.white} size={16} />;
    rightInfo = 'Metro';
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
            gap: 8,
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
              <PackageIcon color={AppColors.purple} size={16} />
            </View>
            <View style={{flex: 1}}>
              <Text
                style={{
                  fontFamily: AppFonts.interBold,
                  fontSize: 14,
                  lineHeight: 18,
                  color: AppColors.primaryBlack,
                }}>
                {t('settings.bundle.sourceBundler')}
              </Text>
              <Text
                style={{
                  fontFamily: AppFonts.interRegular,
                  fontSize: 11,
                  lineHeight: 15,
                  color: AppColors.grayText,
                  marginTop: 1,
                }}>
                {t('settings.bundle.sourceBundlerDesc')}
              </Text>
            </View>
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
            label: t('settings.bundle.clearCache'),
            description: t('settings.bundle.clearCacheDesc'),
            isLast: true,
            onPress: () => {
              clearCachedBundleAnalysis();
              Alert.alert(
                t('common.success'),
                t('settings.bundle.cacheCleared'),
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
  } else if (settingsPage === 'performance') {
    title = t('settings.performance.title');
    icon = <PerformanceIcon color={AppColors.white} size={16} />;
    rightInfo = '60 FPS Target';
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
            gap: 8,
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
              <PerformanceIcon color={AppColors.purple} size={16} />
            </View>
            <View style={{flex: 1}}>
              <Text
                style={{
                  fontFamily: AppFonts.interBold,
                  fontSize: 14,
                  lineHeight: 18,
                  color: AppColors.primaryBlack,
                }}>
                {t('settings.performance.frameMeasurement')}
              </Text>
              <Text
                style={{
                  fontFamily: AppFonts.interRegular,
                  fontSize: 11,
                  lineHeight: 15,
                  color: AppColors.grayText,
                  marginTop: 1,
                }}>
                {t('settings.performance.frameMeasurementDesc')}
              </Text>
            </View>
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
            label: t('settings.performance.clearEvents'),
            description: t('settings.performance.clearEventsDesc'),
            isLast: true,
            onPress: () => {
              clearPerformanceEvents();
              Alert.alert(
                t('common.success'),
                t('settings.performance.eventsCleared'),
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
    </View>
  );
};

export default SettingsPanel;
