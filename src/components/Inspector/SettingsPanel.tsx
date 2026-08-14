import React from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, {Path} from 'react-native-svg';
import LinearGradient from 'react-native-linear-gradient';
import {animateNextLayout, useInspector} from './InspectorContext';
import TouchableScale from '../TouchableScale';
import styles, {toggleGlobalTheme} from '../../styles';
import {AppColors} from '../../styles/AppColors';
import {AppFonts} from '../../styles/AppFonts';
import {LIB_VERSION} from '../../constants';
import {isPersistentStorageAvailable} from '../../helpers/settingsStore';
import {clearNetworkLogs} from '../../customHooks/networkLogger';
import {clearConsoleLogs} from '../../customHooks/consoleLogger';
import {clearAnalyticsEvents} from '../../customHooks/analyticsLogger';
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
  WhiteBackNavigation,
} from '../NetworkIcons';

const SettingsPanel = () => {
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
    showConsoleLevels,
    setShowConsoleLevels,
    resetToDefaults,
    storage,
    logs,
    consoleLogs,
    analyticsEvents,
    reduxState,
    maxNetworkLogs,
    setMaxNetworkLogs,
    maxConsoleLogs,
    setMaxConsoleLogs,
    reduxAutoRefresh,
    setReduxAutoRefreshState,
    reduxExpandDepth,
    setReduxExpandDepth,
    switchActiveTab,
    setSelected,
    setSelectedEvent,
    setReduxState,
  } = useInspector();

  const headerTopPadding =
    Platform.OS === 'ios' && modalHeightPercent >= 95 ? 44 : 0;

  if (settingsPage === 'main') {
    const settingsTabs = [
      {key: 'apis', label: 'APIs', icon: 'apis'},
      {key: 'logs', label: 'Logs', icon: 'logs'},
      {key: 'analytics', label: 'Analytics', icon: 'analytics'},
      {key: 'redux', label: 'Redux', icon: 'redux'},
    ] as const;

    return (
      <View style={{flex: 1, backgroundColor: AppColors.grayBackground}}>
        {/* Settings Header with back button */}
        <LinearGradient
          colors={[AppColors.purple, AppColors.brandPurple]}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 0}}
          style={styles.headerGradient}>
          <View style={{paddingTop: headerTopPadding, width: '100%'}}>
            <View style={[styles.header, {paddingHorizontal: 16, gap: 12}]}>
            <TouchableScale
              onPress={() => {
                animateNextLayout();
                setSettingsPage(null);
                switchActiveTab('apis');
              }}
              hitSlop={12}
              style={{
                padding: 8,
                borderRadius: 10,
                backgroundColor: `${AppColors.white}26`,
                borderWidth: 1,
                borderColor: `${AppColors.white}14`,
              }}>
              <WhiteBackNavigation color={AppColors.white} size={16} />
            </TouchableScale>
            <View style={{flex: 1}}>
              <Text
                style={{
                  fontFamily: AppFonts.interBold,
                  fontSize: 17,
                  color: AppColors.white,
                }}>
                Settings
              </Text>
              <Text
                style={{
                  fontFamily: AppFonts.interRegular,
                  fontSize: 11,
                  color: `${AppColors.white}BF`,
                  marginTop: 1,
                }}>
                Manage modules and preferences
              </Text>
            </View>
            <View
              style={{
                backgroundColor: `${AppColors.white}26`,
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: `${AppColors.white}1A`,
              }}>
              <Text
                style={{
                  fontFamily: AppFonts.interBold,
                  fontSize: 10.5,
                  color: AppColors.white,
                }}>
                v{LIB_VERSION}
              </Text>
            </View>
          </View>
        </View>
      </LinearGradient>

        <ScrollView
          style={{flex: 1}}
          contentContainerStyle={{padding: 16, gap: 12}}>
          {/* Sub Tabs */}
          <View
            style={{
              flexDirection: 'row',
              backgroundColor: AppColors.primaryLight,
              borderRadius: 10,
              padding: 3,
              borderWidth: 1,
              borderColor: AppColors.grayBorderSecondary,
              marginBottom: 4,
            }}>
            <TouchableOpacity
              onPress={() => {
                animateNextLayout();
                setSettingsActiveSubTab('module');
              }}
              style={{
                flex: 1,
                paddingVertical: 8,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 8,
                backgroundColor:
                  settingsActiveSubTab === 'module'
                    ? AppColors.purple
                    : 'transparent',
              }}>
              <Text
                style={{
                  fontFamily: AppFonts.interBold,
                  fontSize: 12,
                  color:
                    settingsActiveSubTab === 'module'
                      ? AppColors.white
                      : AppColors.grayText,
                }}>
                Module
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                animateNextLayout();
                setSettingsActiveSubTab('ui');
              }}
              style={{
                flex: 1,
                paddingVertical: 8,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 8,
                backgroundColor:
                  settingsActiveSubTab === 'ui'
                    ? AppColors.purple
                    : 'transparent',
              }}>
              <Text
                style={{
                  fontFamily: AppFonts.interBold,
                  fontSize: 12,
                  color:
                    settingsActiveSubTab === 'ui'
                      ? AppColors.white
                      : AppColors.grayText,
                }}>
                UI Preferences
              </Text>
            </TouchableOpacity>
          </View>

          {settingsActiveSubTab === 'module' ? (
            /* Tab list */
            <View
              style={{
                backgroundColor: AppColors.primaryLight,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: AppColors.grayBorderSecondary,
                overflow: 'hidden',
              }}>
              {/* Table Header */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 8,
                  paddingHorizontal: 14,
                  backgroundColor: AppColors.grayBackground,
                  borderBottomWidth: 1,
                  borderBottomColor: AppColors.dividerColor,
                  gap: 12,
                }}>
                <Text
                  style={{
                    fontFamily: AppFonts.interBold,
                    fontSize: 10,
                    color: AppColors.grayTextWeak,
                    letterSpacing: 0.6,
                    flex: 1,
                  }}>
                  MODULE
                </Text>
                <Text
                  style={{
                    fontFamily: AppFonts.interBold,
                    fontSize: 10,
                    color: AppColors.grayTextWeak,
                    letterSpacing: 0.6,
                    width: 90,
                    textAlign: 'right',
                    paddingRight: 4,
                  }}>
                  VISIBILITY
                </Text>
              </View>

              {settingsTabs.map((tab, idx) => {
                const isVisible = tab.key === 'apis' || tabVisibility?.[tab.key];
                const isLast = idx === settingsTabs.length - 1;
                const isLocked = tab.key === 'apis';

                return (
                  <View
                    key={tab.key}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingVertical: 10,
                      paddingHorizontal: 14,
                      borderBottomWidth: isLast ? 0 : 1,
                      borderBottomColor: AppColors.dividerColor,
                      gap: 12,
                    }}>
                    {/* Icon + Label — fills remaining space */}
                    <View
                      style={{
                        flex: 1,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 8,
                      }}>
                      {/* Small icon tile */}
                      <View
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: 6,
                          backgroundColor: isLocked
                            ? AppColors.grayBorderSecondary
                            : AppColors.purpleShade50,
                          borderWidth: 1,
                          borderColor: isLocked
                            ? AppColors.dividerColor
                            : `${AppColors.purple}33`,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
                        {tab.icon === 'apis' && (
                          <SignalIcon
                            color={
                              isLocked
                                ? AppColors.grayTextWeak
                                : AppColors.purple
                            }
                            size={11}
                          />
                        )}
                        {tab.icon === 'logs' && (
                          <TerminalIcon
                            color={
                              isLocked
                                ? AppColors.grayTextWeak
                                : AppColors.purple
                            }
                            size={11}
                          />
                        )}
                        {tab.icon === 'analytics' && (
                          <AnalyticsIcon
                            color={
                              isLocked
                                ? AppColors.grayTextWeak
                                : AppColors.purple
                            }
                            size={11}
                          />
                        )}
                        {tab.icon === 'redux' && (
                          <TerminalIcon
                            color={
                              isLocked
                                ? AppColors.grayTextWeak
                                : AppColors.purple
                            }
                            size={11}
                          />
                        )}
                      </View>
                      {/* Label + Required badge */}
                      <Text
                        style={{
                          fontFamily: AppFonts.interBold,
                          fontSize: 13,
                          color: isLocked
                            ? AppColors.grayText
                            : AppColors.primaryBlack,
                        }}>
                        {tab.label}
                      </Text>
                      {/* #6 — badge marks the configured default tab */}
                      {tab.key === defaultTab && (
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            backgroundColor: `${AppColors.purple}14`,
                            borderRadius: 20,
                            paddingHorizontal: 6,
                            paddingVertical: 2,
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
                              opacity: 0.7,
                            }}
                          />
                          <Text
                            style={{
                              fontFamily: AppFonts.interBold,
                              fontSize: 8.5,
                              color: AppColors.purple,
                              letterSpacing: 0.4,
                            }}>
                            DEFAULT
                          </Text>
                        </View>
                      )}

                      {/* Settings gear icon next to label */}
                      <TouchableScale
                        onPress={() => {
                          animateNextLayout();
                          setSettingsPage(tab.key);
                        }}
                        hitSlop={8}
                        style={{
                          marginLeft: 4,
                          padding: 4,
                          borderRadius: 6,
                          backgroundColor: AppColors.purpleShade50,
                          borderWidth: 1,
                          borderColor: `${AppColors.purple}26`,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
                        <SettingsIcon color={AppColors.purple} size={10} />
                      </TouchableScale>
                    </View>

                    {/* Visibility Switch in VISIBILITY column */}
                    <View
                      style={{
                        width: 90,
                        alignItems: 'flex-end',
                        justifyContent: 'center',
                      }}>
                      <TouchableScale
                        disabled={isLocked}
                        onPress={() => toggleTabVisibility(tab.key as any)}
                        style={{
                          width: 38,
                          height: 22,
                          borderRadius: 11,
                          backgroundColor: isLocked
                            ? AppColors.grayBackground
                            : isVisible
                            ? AppColors.purple
                            : AppColors.grayBorderSecondary,
                          borderWidth: isLocked ? 1.5 : 0,
                          borderColor: isLocked
                            ? AppColors.grayBorderSecondary
                            : 'transparent',
                          borderStyle: isLocked ? 'dashed' : 'solid',
                          padding: 2,
                          justifyContent: 'center',
                          alignItems: isVisible ? 'flex-end' : 'flex-start',
                          opacity: isLocked ? 0.9 : 1,
                        }}>
                        <View
                          style={{
                            width: 18,
                            height: 18,
                            borderRadius: 9,
                            backgroundColor: isLocked
                              ? AppColors.grayBorderSecondary
                              : AppColors.white,
                            alignItems: 'center',
                            justifyContent: 'center',
                            shadowColor: AppColors.black,
                            shadowOpacity: isLocked ? 0 : 0.15,
                            shadowRadius: 1.5,
                            shadowOffset: {width: 0, height: 1},
                          }}>
                          {isLocked && (
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
                          )}
                        </View>
                      </TouchableScale>
                      {isLocked && (
                        <Text
                          style={{
                            fontFamily: AppFonts.interBold,
                            fontSize: 8,
                            color: AppColors.grayTextWeak,
                            letterSpacing: 0.4,
                            marginTop: 3,
                          }}>
                          REQUIRED
                        </Text>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          ) : (
            /* UI Preferences Section */
            <View
              style={{
                backgroundColor: AppColors.primaryLight,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: AppColors.grayBorderSecondary,
                overflow: 'hidden',
              }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 12,
                  paddingHorizontal: 14,
                  gap: 12,
                }}>
                {/* Icon + Label */}
                <View
                  style={{
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                  }}>
                  <View
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 6,
                      backgroundColor: AppColors.purpleShade50,
                      borderWidth: 1,
                      borderColor: `${AppColors.purple}33`,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                    {isDark ? (
                      <SunIcon color={AppColors.purple} size={11} />
                    ) : (
                      <MoonIcon color={AppColors.purple} size={11} />
                    )}
                  </View>
                  <View style={{flex: 1}}>
                    <Text
                      style={{
                        fontFamily: AppFonts.interBold,
                        fontSize: 13,
                        color: AppColors.primaryBlack,
                      }}>
                      Dark Theme
                    </Text>
                  </View>
                </View>

                {/* Toggle Switch */}
                <TouchableScale
                  onPress={() => {
                    const newTheme = !isDark;
                    setIsDark(newTheme);
                    toggleGlobalTheme(newTheme);
                  }}
                  style={{
                    width: 38,
                    height: 22,
                    borderRadius: 11,
                    backgroundColor: isDark
                      ? AppColors.purple
                      : AppColors.grayBorderSecondary,
                    padding: 2,
                    justifyContent: 'center',
                    alignItems: isDark ? 'flex-end' : 'flex-start',
                  }}>
                  <View
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: 9,
                      backgroundColor: AppColors.white,
                      shadowColor: AppColors.black,
                      shadowOpacity: 0.15,
                      shadowRadius: 1.5,
                      shadowOffset: {width: 0, height: 1},
                    }}
                  />
                </TouchableScale>
              </View>

              {/* Divider */}
              <View
                style={{
                  height: 1,
                  backgroundColor: AppColors.dividerColor,
                }}
              />

              {/* Modal Height */}
              <View
                style={{
                  paddingVertical: 12,
                  paddingHorizontal: 14,
                }}>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                  }}>
                  <View
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 6,
                      backgroundColor: AppColors.purpleShade50,
                      borderWidth: 1,
                      borderColor: `${AppColors.purple}33`,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                    <ScreenIcon color={AppColors.purple} size={11} />
                  </View>
                  <View style={{flex: 1}}>
                    <Text
                      style={{
                        fontFamily: AppFonts.interBold,
                        fontSize: 13,
                        color: AppColors.primaryBlack,
                      }}>
                      Modal Height
                    </Text>
                    <Text
                      style={{
                        fontFamily: AppFonts.interRegular,
                        fontSize: 11,
                        color: AppColors.grayText,
                        marginTop: 1,
                      }}>
                      Height of the inspector panel relative to the screen
                    </Text>
                  </View>
                </View>

                {/* Segmented picker */}
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
                  {[50, 70, 90, 100].map(opt => {
                    const isActive = modalHeightPercent === opt;
                    return (
                      <TouchableScale
                        key={opt}
                        onPress={() => setModalHeightPercent(opt)}
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
                            color: isActive ? AppColors.white : AppColors.grayText,
                          }}>
                          {opt}%
                        </Text>
                      </TouchableScale>
                    );
                  })}
                </View>
              </View>

              {/* Divider */}
              <View
                style={{
                  height: 1,
                  backgroundColor: AppColors.dividerColor,
                }}
              />

              {/* Modal Animation */}
              <View
                style={{
                  paddingVertical: 12,
                  paddingHorizontal: 14,
                }}>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                  }}>
                  <View
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 6,
                      backgroundColor: AppColors.purpleShade50,
                      borderWidth: 1,
                      borderColor: `${AppColors.purple}33`,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                    <MotionIcon color={AppColors.purple} size={11} />
                  </View>
                  <View style={{flex: 1}}>
                    <Text
                      style={{
                        fontFamily: AppFonts.interBold,
                        fontSize: 13,
                        color: AppColors.primaryBlack,
                      }}>
                      Modal Animation
                    </Text>
                    <Text
                      style={{
                        fontFamily: AppFonts.interRegular,
                        fontSize: 11,
                        color: AppColors.grayText,
                        marginTop: 1,
                      }}>
                      How the inspector panel enters and exits the screen
                    </Text>
                  </View>
                </View>

                {/* Segmented picker */}
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
                  {([
                    {key: 'slide' as const, label: 'Slide Up'},
                    {key: 'fade' as const, label: 'Fade'},
                    {key: 'none' as const, label: 'None'},
                  ]).map(opt => {
                    const isActive = modalAnimationType === opt.key;
                    return (
                      <TouchableScale
                        key={opt.key}
                        onPress={() => setModalAnimationType(opt.key)}
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
                            color: isActive ? AppColors.white : AppColors.grayText,
                          }}>
                          {opt.label}
                        </Text>
                      </TouchableScale>
                    );
                  })}
                </View>
              </View>

              {/* Divider */}
              <View
                style={{
                  height: 1,
                  backgroundColor: AppColors.dividerColor,
                }}
              />

              {/* #6 — Default Tab */}
              <View
                style={{
                  paddingVertical: 12,
                  paddingHorizontal: 14,
                }}>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                  }}>
                  <View
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 6,
                      backgroundColor: AppColors.purpleShade50,
                      borderWidth: 1,
                      borderColor: `${AppColors.purple}33`,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                    <LayersIcon color={AppColors.purple} size={11} />
                  </View>
                  <View style={{flex: 1}}>
                    <Text
                      style={{
                        fontFamily: AppFonts.interBold,
                        fontSize: 13,
                        color: AppColors.primaryBlack,
                      }}>
                      Default Tab
                    </Text>
                    <Text
                      style={{
                        fontFamily: AppFonts.interRegular,
                        fontSize: 11,
                        color: AppColors.grayText,
                        marginTop: 1,
                      }}>
                      Tab shown when the inspector opens
                    </Text>
                  </View>
                </View>

                {/* Grid of Default Tab Cards */}
                <View
                  style={{
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    gap: 8,
                    marginTop: 12,
                  }}>
                  {settingsTabs
                    .filter(
                      tab => tab.key === 'apis' || tabVisibility?.[tab.key],
                    )
                    .map(tab => {
                      const isActive = defaultTab === tab.key;
                      return (
                        <TouchableScale
                          key={tab.key}
                          onPress={() => setDefaultTab(tab.key)}
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 8,
                            paddingVertical: 10,
                            paddingHorizontal: 12,
                            borderRadius: 10,
                            borderWidth: 1.5,
                            borderColor: isActive ? AppColors.purple : AppColors.grayBorderSecondary,
                            backgroundColor: isActive ? `${AppColors.purple}0F` : AppColors.primaryLight,
                            minWidth: '47%',
                            flex: 1,
                          }}>
                          <View
                            style={{
                              width: 22,
                              height: 22,
                              borderRadius: 6,
                              backgroundColor: isActive ? AppColors.purple : AppColors.purpleShade50,
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}>
                            {tab.icon === 'apis' && (
                              <SignalIcon color={isActive ? AppColors.white : AppColors.purple} size={11} />
                            )}
                            {tab.icon === 'logs' && (
                              <TerminalIcon color={isActive ? AppColors.white : AppColors.purple} size={11} />
                            )}
                            {tab.icon === 'analytics' && (
                              <AnalyticsIcon color={isActive ? AppColors.white : AppColors.purple} size={11} />
                            )}
                            {tab.icon === 'redux' && (
                              <TerminalIcon color={isActive ? AppColors.white : AppColors.purple} size={11} />
                            )}
                          </View>
                          <Text
                            style={{
                              fontFamily: AppFonts.interBold,
                              fontSize: 13,
                              color: isActive ? AppColors.purple : AppColors.primaryBlack,
                              flex: 1,
                            }}>
                              {tab.label}
                          </Text>
                          {isActive && (
                            <View
                              style={{
                                width: 14,
                                height: 14,
                                borderRadius: 7,
                                backgroundColor: AppColors.purple,
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}>
                              <CheckIcon size={8} color={AppColors.white} />
                            </View>
                          )}
                        </TouchableScale>
                      );
                    })}
                </View>
              </View>

              {/* Divider */}
              <View
                style={{
                  height: 1,
                  backgroundColor: AppColors.dividerColor,
                }}
              />

              {/* #9 — Show Duplicate Logs */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 12,
                  paddingHorizontal: 14,
                  gap: 12,
                }}>
                <View
                  style={{
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                  }}>
                  <View
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 6,
                      backgroundColor: AppColors.purpleShade50,
                      borderWidth: 1,
                      borderColor: `${AppColors.purple}33`,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                    <EyeIcon color={AppColors.purple} size={11} />
                  </View>
                  <View style={{flex: 1}}>
                    <Text
                      style={{
                        fontFamily: AppFonts.interBold,
                        fontSize: 13,
                        color: AppColors.primaryBlack,
                      }}>
                      Show Duplicate Logs
                    </Text>
                    <Text
                      style={{
                        fontFamily: AppFonts.interRegular,
                        fontSize: 11,
                        color: AppColors.grayText,
                        marginTop: 1,
                      }}>
                      Off: repeated identical entries collapse into one row
                      with a ×N count
                    </Text>
                  </View>
                </View>

                {/* Toggle Switch */}
                <TouchableScale
                  onPress={() => setShowDuplicateLogs(prev => !prev)}
                  style={{
                    width: 38,
                    height: 22,
                    borderRadius: 11,
                    backgroundColor: showDuplicateLogs
                      ? AppColors.purple
                      : AppColors.grayBorderSecondary,
                    padding: 2,
                    justifyContent: 'center',
                    alignItems: showDuplicateLogs ? 'flex-end' : 'flex-start',
                  }}>
                  <View
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: 9,
                      backgroundColor: AppColors.white,
                      shadowColor: AppColors.black,
                      shadowOpacity: 0.15,
                      shadowRadius: 1.5,
                      shadowOffset: {width: 0, height: 1},
                    }}
                  />
                </TouchableScale>
              </View>

              {/* Divider */}
              <View
                style={{
                  height: 1,
                  backgroundColor: AppColors.dividerColor,
                }}
              />

              {/* Logs Console Levels */}
              <View
                style={{
                  paddingVertical: 12,
                  paddingHorizontal: 14,
                }}>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                  }}>
                  <View
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 6,
                      backgroundColor: AppColors.purpleShade50,
                      borderWidth: 1,
                      borderColor: `${AppColors.purple}33`,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                    <TerminalIcon color={AppColors.purple} size={11} />
                  </View>
                  <View style={{flex: 1}}>
                    <Text
                      style={{
                        fontFamily: AppFonts.interBold,
                        fontSize: 13,
                        color: AppColors.primaryBlack,
                      }}>
                      Logs Console Levels
                    </Text>
                    <Text
                      style={{
                        fontFamily: AppFonts.interRegular,
                        fontSize: 11,
                        color: AppColors.grayText,
                        marginTop: 1,
                      }}>
                      Toggle which log levels are visible in the Logs tab
                    </Text>
                  </View>
                </View>

                <View
                  style={{
                    flexDirection: 'row',
                    gap: 8,
                    marginTop: 10,
                  }}>
                  {([
                    {key: 'info' as const, label: 'Info', color: AppColors.blue500},
                    {key: 'warn' as const, label: 'Warning', color: AppColors.amber500},
                    {key: 'error' as const, label: 'Error', color: AppColors.errorColor},
                  ]).map(level => {
                    const isActive = showConsoleLevels[level.key];
                    return (
                      <TouchableScale
                        key={level.key}
                        onPress={() =>
                          setShowConsoleLevels(prev => ({
                            ...prev,
                            [level.key]: !prev[level.key],
                          }))
                        }
                        style={{
                          flex: 1,
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                          paddingVertical: 8,
                          borderRadius: 8,
                          borderWidth: 1.5,
                          borderColor: isActive ? level.color : AppColors.grayBorderSecondary,
                          backgroundColor: isActive ? `${level.color}0D` : AppColors.primaryLight,
                        }}>
                        <View
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: isActive ? level.color : AppColors.grayBorderSecondary,
                          }}
                        />
                        <Text
                          style={{
                            fontFamily: AppFonts.interBold,
                            fontSize: 11,
                            color: isActive ? level.color : AppColors.grayText,
                          }}>
                          {level.label}
                        </Text>
                      </TouchableScale>
                    );
                  })}
                </View>
              </View>

              {/* Divider */}
              <View
                style={{
                  height: 1,
                  backgroundColor: AppColors.dividerColor,
                }}
              />

              {/* Reset Settings */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 12,
                  paddingHorizontal: 14,
                  gap: 12,
                }}>
                <View
                  style={{
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                  }}>
                  <View
                    style={{
                      width: 20,
                    height: 20,
                      borderRadius: 6,
                      backgroundColor: `${AppColors.errorColor}14`,
                      borderWidth: 1,
                      borderColor: `${AppColors.errorColor}33`,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                    <TrashIcon color={AppColors.errorColor} size={11} />
                  </View>
                  <View style={{flex: 1}}>
                    <Text
                      style={{
                        fontFamily: AppFonts.interBold,
                        fontSize: 13,
                        color: AppColors.primaryBlack,
                      }}>
                      Reset Settings
                    </Text>
                    <Text
                      style={{
                        fontFamily: AppFonts.interRegular,
                        fontSize: 11,
                        color: AppColors.grayText,
                        marginTop: 1,
                      }}>
                      Wipe custom configurations and load package defaults
                    </Text>
                  </View>
                </View>

                <TouchableScale
                  onPress={resetToDefaults}
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 5,
                    borderRadius: 7,
                    backgroundColor: `${AppColors.errorColor}14`,
                    borderWidth: 1,
                    borderColor: `${AppColors.errorColor}33`,
                  }}>
                  <Text
                    style={{
                      fontFamily: AppFonts.interBold,
                      fontSize: 11,
                      color: AppColors.errorColor,
                    }}>
                    Reset
                  </Text>
                </TouchableScale>
              </View>
            </View>
          )}


          {/* Storage Status */}
          <View
            style={{
              backgroundColor: isPersistentStorageAvailable()
                ? `${AppColors.liveGreen}14`
                : `${AppColors.amber600}14`,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: isPersistentStorageAvailable()
                ? `${AppColors.liveGreen}33`
                : `${AppColors.amber600}33`,
              padding: 12,
              marginTop: 16,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
            }}>
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: isPersistentStorageAvailable() ? AppColors.green500 : AppColors.amber600,
              }}
            />
            <View style={{flex: 1}}>
              <Text
                style={{
                  fontFamily: AppFonts.interBold,
                  fontSize: 12,
                  color: isPersistentStorageAvailable() ? AppColors.green700 : AppColors.amber800,
                }}>
                {isPersistentStorageAvailable()
                  ? `Storage: Persistent (${storage ? 'Custom' : 'iOS Settings'})`
                  : 'Storage: Temporary (In-Memory)'}
              </Text>
              <Text
                style={{
                  fontFamily: AppFonts.interRegular,
                  fontSize: 10.5,
                  color: isPersistentStorageAvailable() ? AppColors.green800 : AppColors.amber800,
                  marginTop: 2,
                  opacity: 0.8,
                }}>
                {isPersistentStorageAvailable()
                  ? 'Your settings are saved across app restarts.'
                  : 'Settings reset when closed. To persist settings, pass a storage object to <NetworkInspector storage={...} />.'}
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

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
    onPress?: () => void;
    isLast?: boolean;
  }) => (
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
              color: AppColors.primaryBlack,
            }}>
            {opts.label}
          </Text>
          {opts.description ? (
            <Text
              style={{
                fontFamily: AppFonts.interRegular,
                fontSize: 11,
                color: AppColors.grayText,
                marginTop: 1,
              }}>
              {opts.description}
            </Text>
          ) : null}
        </View>
        {opts.right || null}
      </TouchableScale>
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

  let content: React.ReactNode = null;
  let title = '';
  let icon: React.ReactNode = null;
  let rightInfo = '';

  if (settingsPage === 'apis') {
    title = 'APIs Settings';
    icon = <SignalIcon color={AppColors.white} size={16} />;
    rightInfo = `Total: ${logs.length}`;
    content = (
      <ScrollView
        style={{flex: 1}}
        contentContainerStyle={{padding: 16}}>
        <View
          style={{
            backgroundColor: AppColors.primaryLight,
            padding: 16,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: AppColors.grayBorderSecondary,
            gap: 4,
          }}>
          {renderSettingRow({
            icon: <SignalIcon color={AppColors.purple} size={16} />,
            label: 'Max Request Logs',
            description: 'How many network requests to keep in memory',
            picker: {
              options: [50, 100, 200, 500] as const,
              selectedValue: maxNetworkLogs,
              onSelect: setMaxNetworkLogs,
            },
            isLast: true,
          })}
        </View>

        <View
          style={{
            backgroundColor: AppColors.primaryLight,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: AppColors.grayBorderSecondary,
            padding: 16,
            marginTop: 12,
          }}>
          {renderSettingRow({
            icon: <TrashIcon color={AppColors.errorColor} size={16} />,
            label: 'Clear Network Logs',
            description: `${logs.length} requests stored`,
            isLast: true,
            onPress: () => {
              clearNetworkLogs();
              setSelected(null);
              Alert.alert('Success', 'Network logs cleared.');
            },
            right: (
              <View
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  borderRadius: 7,
                  backgroundColor: `${AppColors.errorColor}14`,
                  borderWidth: 1,
                  borderColor: `${AppColors.errorColor}33`,
                }}>
                <Text
                  style={{
                    fontFamily: AppFonts.interBold,
                    fontSize: 11,
                    color: AppColors.errorColor,
                  }}>
                  Clear
                </Text>
              </View>
            ),
          })}
        </View>
      </ScrollView>
    );
  } else if (settingsPage === 'logs') {
    title = 'Logs Settings';
    icon = <TerminalIcon color={AppColors.white} size={16} />;
    rightInfo = `Total: ${consoleLogs.length}`;
    content = (
      <ScrollView
        style={{flex: 1}}
        contentContainerStyle={{padding: 16}}>
        <View
          style={{
            backgroundColor: AppColors.primaryLight,
            padding: 16,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: AppColors.grayBorderSecondary,
            gap: 4,
          }}>
          {renderSettingRow({
            icon: <TerminalIcon color={AppColors.purple} size={16} />,
            label: 'Max Console Logs',
            description: 'How many console messages to retain',
            picker: {
              options: [100, 200, 500, 1000] as const,
              selectedValue: maxConsoleLogs,
              onSelect: setMaxConsoleLogs,
            },
          })}
          <View
            style={{height: 1, backgroundColor: AppColors.dividerColor}}
          />
          <Text
            style={{
              fontFamily: AppFonts.interBold,
              fontSize: 13,
              color: AppColors.primaryBlack,
              paddingTop: 4,
            }}>
            Log Levels
          </Text>
          {(['info', 'warn', 'error'] as const).map(level => {
            const isLvlActive = showConsoleLevels?.[level];
            const levelColor =
              level === 'error'
                ? AppColors.errorColor
                : level === 'warn'
                ? AppColors.warningIconGold
                : AppColors.skyBlue;
            return renderSettingRow({
              icon: (
                <View
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 5,
                    backgroundColor: levelColor,
                  }}
                />
              ),
              label: `Show ${
                level.charAt(0).toUpperCase() + level.slice(1)
              } logs`,
              description:
                level === 'info'
                  ? 'Informational messages'
                  : level === 'warn'
                  ? 'Warning messages'
                  : 'Error messages',
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

        <View
          style={{
            backgroundColor: AppColors.primaryLight,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: AppColors.grayBorderSecondary,
            padding: 16,
            marginTop: 12,
          }}>
          {renderSettingRow({
            icon: <TrashIcon color={AppColors.errorColor} size={16} />,
            label: 'Clear Console Logs',
            description: `${consoleLogs.length} logs stored`,
            isLast: true,
            onPress: () => {
              clearConsoleLogs();
              Alert.alert('Success', 'Console logs cleared.');
            },
            right: (
              <View
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  borderRadius: 7,
                  backgroundColor: `${AppColors.errorColor}14`,
                  borderWidth: 1,
                  borderColor: `${AppColors.errorColor}33`,
                }}>
                <Text
                  style={{
                    fontFamily: AppFonts.interBold,
                    fontSize: 11,
                    color: AppColors.errorColor,
                  }}>
                  Clear
                </Text>
              </View>
            ),
          })}
        </View>
      </ScrollView>
    );
  } else if (settingsPage === 'analytics') {
    title = 'Analytics Settings';
    icon = <AnalyticsIcon color={AppColors.white} size={16} />;
    rightInfo = `Events: ${analyticsEvents.length}`;
    content = (
      <ScrollView
        style={{flex: 1}}
        contentContainerStyle={{padding: 16}}>
        <View
          style={{
            backgroundColor: AppColors.primaryLight,
            padding: 16,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: AppColors.grayBorderSecondary,
            gap: 4,
          }}>
          {renderSettingRow({
            icon: <AnalyticsIcon color={AppColors.purple} size={16} />,
            label: 'Events Captured',
            description: `${analyticsEvents.length} analytics events stored`,
            isLast: true,
          })}
        </View>
        <View
          style={{
            backgroundColor: AppColors.primaryLight,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: AppColors.grayBorderSecondary,
            padding: 16,
            marginTop: 12,
          }}>
          {renderSettingRow({
            icon: <TrashIcon color={AppColors.errorColor} size={16} />,
            label: 'Clear Analytics History',
            description: 'Remove all captured events',
            isLast: true,
            onPress: () => {
              clearAnalyticsEvents();
              setSelectedEvent(null);
              Alert.alert('Success', 'Analytics events cleared.');
            },
            right: (
              <View
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  borderRadius: 7,
                  backgroundColor: `${AppColors.errorColor}14`,
                  borderWidth: 1,
                  borderColor: `${AppColors.errorColor}33`,
                }}>
                <Text
                  style={{
                    fontFamily: AppFonts.interBold,
                    fontSize: 11,
                    color: AppColors.errorColor,
                  }}>
                  Clear
                </Text>
              </View>
            ),
          })}
        </View>
      </ScrollView>
    );
  } else if (settingsPage === 'redux') {
    title = 'Redux Settings';
    icon = <TerminalIcon color={AppColors.white} size={16} />;
    rightInfo = `Reducers: ${Object.keys(reduxState || {}).length}`;
    content = (
      <ScrollView
        style={{flex: 1}}
        contentContainerStyle={{padding: 16}}>
        <View
          style={{
            backgroundColor: AppColors.primaryLight,
            padding: 16,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: AppColors.grayBorderSecondary,
            gap: 4,
          }}>
          {renderSettingRow({
            icon: <TerminalIcon color={AppColors.purple} size={16} />,
            label: 'Auto-refresh Store',
            description: 'Automatically capture Redux store state updates',
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
          <View
            style={{height: 1, backgroundColor: AppColors.dividerColor}}
          />
          {renderSettingRow({
            icon: <LayersIcon color={AppColors.purple} size={16} />,
            label: 'Default JSON Expand Depth',
            description: 'Initial depth of Redux state tree to auto-expand',
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
            borderRadius: 12,
            borderWidth: 1,
            borderColor: AppColors.grayBorderSecondary,
            padding: 16,
            marginTop: 12,
          }}>
          {renderSettingRow({
            icon: <TrashIcon color={AppColors.errorColor} size={16} />,
            label: 'Clear Redux State',
            description: reduxState
              ? 'Reset state snapshot in inspector'
              : 'No store snapshot stored',
            isLast: true,
            onPress: () => {
              setReduxState(null);
              Alert.alert('Success', 'Redux state snapshot cleared.');
            },
            right: (
              <View
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  borderRadius: 7,
                  backgroundColor: `${AppColors.errorColor}14`,
                  borderWidth: 1,
                  borderColor: `${AppColors.errorColor}33`,
                }}>
                <Text
                  style={{
                    fontFamily: AppFonts.interBold,
                    fontSize: 11,
                    color: AppColors.errorColor,
                  }}>
                  Clear
                </Text>
              </View>
            ),
          })}
        </View>
      </ScrollView>
    );
  }

  return (
    <View style={{flex: 1, backgroundColor: AppColors.grayBackground}}>
      <LinearGradient
        colors={[AppColors.purple, AppColors.brandPurple]}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 0}}
        style={styles.headerGradient}>
        <View style={{paddingTop: headerTopPadding, width: '100%'}}>
          <View style={[styles.header, {paddingHorizontal: 16, gap: 12}]}>
          <TouchableScale
            onPress={goBackToMain}
            hitSlop={12}
            style={{
              padding: 8,
              borderRadius: 10,
              backgroundColor: `${AppColors.white}26`,
              borderWidth: 1,
              borderColor: `${AppColors.white}14`,
            }}>
            <WhiteBackNavigation color={AppColors.white} size={16} />
          </TouchableScale>
          {icon && (
            <View
              style={{
                width: 30,
                height: 30,
                borderRadius: 8,
                backgroundColor: `${AppColors.white}26`,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              {icon}
            </View>
          )}
          <View style={{flex: 1}}>
            <Text
              style={{
                fontFamily: AppFonts.interBold,
                fontSize: 17,
                color: AppColors.white,
              }}>
              {title}
            </Text>
          </View>
          {rightInfo ? (
            <View
              style={{
                backgroundColor: `${AppColors.white}26`,
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: `${AppColors.white}1A`,
              }}>
              <Text
                style={{
                  fontFamily: AppFonts.interBold,
                  fontSize: 11,
                  color: AppColors.white,
                }}>
                {rightInfo}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </LinearGradient>
      {content}
    </View>
  );
};

export default SettingsPanel;