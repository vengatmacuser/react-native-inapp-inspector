import React, {useMemo} from 'react';
import {
  Alert,
  Animated,
  Linking,
  Platform,
  Pressable,
  Text,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useInspector} from './InspectorContext';
import TouchableScale from '../TouchableScale';
import AppHeaderLogo from '../AppHeaderLogo';
import styles from '../../styles';
import {AppColors} from '../../styles/AppColors';
import {AppFonts} from '../../styles/AppFonts';
import {METHOD_COLORS} from '../../constants';
import {LIB_VERSION} from '../../constants';
import {Method} from '../../types';
import {getStatusColor, getAppName, formatTime, getSize} from '../../helpers';
import {UpdateAvailableModal} from './UpdateAvailableModal';
import {
  WhiteBackNavigation,
  TrashIcon,
  SettingsIcon,
  CloseWhite,
  ClockIcon,
  SizeIcon,
  AppleIcon,
  AndroidIcon,
  NpmIcon,
  ResetIcon,
  BoltIcon,
} from '../NetworkIcons';

const InspectorHeader = React.memo(() => {
  const {
    modalHeightPercent,
    appIcon,
    selected,
    setSelected,
    selectedEvent,
    setSelectedEvent,
    selectedLog,
    setSelectedLog,
    selectedReduxSlice,
    setSelectedReduxSlice,
    selectedReduxAction,
    setSelectedReduxAction,
    reduxState,
    reduxLastActionMap,
    showHeaderInfo,
    setShowHeaderInfo,
    updateAvailable,
    latestNpmVersion,
    clearAnim,
    activePulseAnim,
    unreadPulseAnim,
    runClearAllWithAnimation,
    settingsPage,
    setSettingsPage,
    resetToDefaults,
    closeModal,
    detailTitle,
    activeTab,
    environment,
    visible,
    selectedCrash,
    setSelectedCrash,
  } = useInspector();

  const [showUpdateModal, setShowUpdateModal] = React.useState<boolean>(false);

  const envConfig = useMemo(() => {
    const rawEnv = (environment || (__DEV__ ? 'DEV' : 'PROD')).trim();
    const clean = rawEnv.toUpperCase();

    if (clean === 'DEV' || clean.includes('DEV') || clean === 'LOCAL') {
      return {
        label: rawEnv,
        bg: `${AppColors.emerald500}40`, // emerald
        border: `${AppColors.emerald400}8C`,
        text: AppColors.mintGreenBorder,
      };
    }
    if (clean === 'UAT' || clean === 'QA' || clean === 'TEST') {
      return {
        label: rawEnv,
        bg: `${AppColors.amber500}47`, // amber
        border: `${AppColors.amber400}99`,
        text: AppColors.amberWarmBorder,
      };
    }
    if (clean === 'PREPROD' || clean === 'STAGE' || clean === 'STAGING') {
      return {
        label: rawEnv,
        bg: `${AppColors.purple500}47`, // purple
        border: `${AppColors.purple400}99`,
        text: AppColors.violetSoftBorder,
      };
    }
    // PROD / Live
    return {
      label: rawEnv,
      bg: `${AppColors.rose500}40`, // rose
      border: `${AppColors.roseBorder}8C`,
      text: AppColors.errorBorder,
    };
  }, [environment]);

  const isDetailView =
    (activeTab === 'apis' && selected != null) ||
    (activeTab === 'analytics' && selectedEvent != null) ||
    (activeTab === 'logs' && selectedLog != null) ||
    (activeTab === 'redux' &&
      (selectedReduxSlice != null || selectedReduxAction != null)) ||
    (activeTab === 'crash' && selectedCrash != null);

  const isSettingsView = settingsPage !== null;
  const isAnySelected = isDetailView || isSettingsView;

  const settingsModuleTitle = useMemo(() => {
    switch (settingsPage) {
      case 'apis':
        return 'APIs (Network)';
      case 'logs':
        return 'Console Logs';
      case 'performance':
        return 'Performance Tracker';
      case 'bundle':
        return 'Bundle Analyzer';
      case 'crash':
        return 'Crash Protection';
      case 'analytics':
        return 'Analytics Logger';
      case 'redux':
        return 'Redux Inspector';
      default:
        return 'Settings & Modules';
    }
  }, [settingsPage]);

  const headerTopPadding =
    Platform.OS === 'ios' && modalHeightPercent >= 95 ? 44 : 0;

  return (
    <>
      <LinearGradient
        colors={['#4F46E5', '#7C3AED']}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
        style={styles.headerGradient}>
      <View style={{paddingTop: headerTopPadding, width: '100%'}}>
        <View style={styles.header}>
          <View
            style={[
              styles.headerLeft,
              {
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                flex: !isDetailView ? 1 : 0,
                minWidth: 0,
              },
            ]}>
            <TouchableScale
              onPress={() => {
                if (isSettingsView) {
                  if (settingsPage === 'main') {
                    setSettingsPage(null);
                  } else {
                    setSettingsPage('main');
                  }
                  return;
                }
                requestAnimationFrame(() => {
                  setSelected(null);
                  setSelectedEvent(null);
                  setSelectedLog(null);
                  setSelectedReduxSlice(null);
                  setSelectedReduxAction(null);
                  setSelectedCrash(null);
                });
              }}
              hitSlop={15}
              style={[
                {
                  width: 38,
                  height: 38,
                  borderRadius: 19,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: `${AppColors.white}2E`,
                  borderWidth: 1,
                  borderColor: `${AppColors.white}4D`,
                },
                !isAnySelected && {display: 'none'},
              ]}>
              {/* Soft outer glow to fake a blurred circle */}
              <View
                style={{
                  position: 'absolute',
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: `${AppColors.white}1A`,
                }}
              />
              <WhiteBackNavigation />
            </TouchableScale>

            {isSettingsView ? (
              <View style={{gap: 2, flex: 1, minWidth: 0}}>
                <View
                  style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
                  <Text
                    style={{
                      fontFamily: AppFonts.interBold,
                      fontSize: 16,
                      color: AppColors.white,
                      letterSpacing: -0.2,
                    }}
                    numberOfLines={1}>
                    {settingsModuleTitle}
                  </Text>
                  {settingsPage === 'main' && (
                    <View
                      style={{
                        backgroundColor: `${AppColors.white}26`,
                        paddingHorizontal: 6,
                        paddingVertical: 1.5,
                        borderRadius: 10,
                        borderWidth: 1,
                        borderColor: `${AppColors.white}20`,
                      }}>
                      <Text
                        style={{
                          fontFamily: AppFonts.interBold,
                          fontSize: 9,
                          color: AppColors.white,
                        }}>
                        v{LIB_VERSION}
                      </Text>
                    </View>
                  )}
                </View>
                <Text
                  style={{
                    fontFamily: AppFonts.interRegular,
                    fontSize: 10.5,
                    color: `${AppColors.white}CC`,
                  }}
                  numberOfLines={1}>
                  {settingsPage === 'main'
                    ? 'Manage modules and preferences'
                    : 'Configure module parameters'}
                </Text>
              </View>
            ) : !isAnySelected ? (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  flex: 1,
                  minWidth: 0,
                  marginRight: 6,
                }}>
                <AppHeaderLogo size={46} customIcon={appIcon} />
                <View style={{gap: 2.5, flex: 1, minWidth: 0}}>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                      minWidth: 0,
                    }}>
                    <Text
                      style={[styles.headerTitle, {flexShrink: 1}]}
                      numberOfLines={1}
                      ellipsizeMode="tail">
                      {getAppName()}
                    </Text>
                    <View
                      style={[
                        styles.envBadge,
                        {
                          backgroundColor: envConfig.bg,
                          borderColor: envConfig.border,
                          flexShrink: 0,
                          paddingVertical: 1.5,
                          marginBottom: 0,
                        },
                      ]}>
                      <Text
                        style={[styles.envBadgeText, {color: envConfig.text}]}>
                        {envConfig.label}
                      </Text>
                    </View>
                    {updateAvailable && (
                      <Pressable
                        hitSlop={10}
                        onPress={() => setShowUpdateModal(true)}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          backgroundColor: '#F59E0B',
                          borderRadius: 5,
                          paddingHorizontal: 5.5,
                          paddingVertical: 1.5,
                          gap: 3.5,
                          shadowColor: '#F59E0B',
                          shadowOffset: {width: 0, height: 1.5},
                          shadowOpacity: 0.35,
                          shadowRadius: 3,
                          elevation: 3,
                          flexShrink: 0,
                        }}>
                        <Animated.View
                          style={{
                            width: 5,
                            height: 5,
                            borderRadius: 2.5,
                            backgroundColor: '#FFFFFF',
                            opacity: activePulseAnim,
                            transform: [{scale: unreadPulseAnim}],
                          }}
                        />
                        <Text
                          style={{
                            fontFamily: AppFonts.interBold,
                            fontSize: 9,
                            color: '#FFFFFF',
                            letterSpacing: 0.3,
                          }}>
                          UPDATE
                        </Text>
                        <BoltIcon size={9} color="#FFFFFF" />
                      </Pressable>
                    )}
                  </View>

                  {/* OS & NPM Version Representation */}
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 5,
                      minWidth: 0,
                    }}>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: `${AppColors.white}1F`,
                        borderRadius: 5,
                        paddingHorizontal: 6,
                        paddingVertical: 2,
                        gap: 4,
                        borderWidth: 1,
                        borderColor: `${AppColors.white}2E`,
                        flexShrink: 0,
                      }}>
                      {Platform.OS === 'ios' ? (
                        <AppleIcon color={`${AppColors.white}E6`} size={10} />
                      ) : (
                        <AndroidIcon color={`${AppColors.white}E6`} size={10} />
                      )}
                      <Text
                        style={{
                          fontFamily: AppFonts.interMedium,
                          fontSize: 9.5,
                          color: `${AppColors.white}EB`,
                          letterSpacing: 0.1,
                        }}
                        numberOfLines={1}>
                        {Platform.OS === 'ios'
                          ? `iOS ${Platform.Version}`
                          : `Android ${Platform.Version}`}
                      </Text>
                    </View>

                    <Pressable
                      onPress={() => {
                        if (updateAvailable) {
                          setShowUpdateModal(true);
                        } else {
                          Linking.openURL(
                            'https://www.npmjs.com/package/react-native-inapp-inspector',
                          ).catch(() => {});
                        }
                      }}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: `${AppColors.white}1F`,
                        borderRadius: 5,
                        paddingHorizontal: 6,
                        paddingVertical: 2,
                        gap: 4,
                        borderWidth: 1,
                        borderColor: `${AppColors.white}2E`,
                        flexShrink: 0,
                      }}>
                      <NpmIcon size={10} color="#FF6B6B" />
                      <Text
                        style={{
                          fontFamily: AppFonts.interMedium,
                          fontSize: 9.5,
                          color: `${AppColors.white}EB`,
                          letterSpacing: 0.1,
                        }}
                        numberOfLines={1}>
                        v{LIB_VERSION}
                      </Text>
                      {updateAvailable && (
                        <Text
                          style={{
                            fontFamily: AppFonts.interBold,
                            fontSize: 9,
                            color: '#F59E0B',
                          }}>
                          ●
                        </Text>
                      )}
                    </Pressable>
                  </View>
                </View>
              </View>
            ) : null}
          </View>

          {isDetailView && (
            <View style={styles.headerCenter}>
              {activeTab === 'apis' && selected != null ? (
                <View style={styles.headerDetailCenter}>
                  <View style={styles.headerDetailRow}>
                    <View
                      style={[
                        styles.headerMethodBadge,
                        {
                          backgroundColor:
                            METHOD_COLORS[selected.method as Method] ??
                            AppColors.grayText,
                        },
                      ]}>
                      <Text style={styles.headerMethodText}>
                        {selected.method}
                      </Text>
                    </View>
                    <Text
                      style={styles.headerDetailTitle}
                      numberOfLines={1}
                      ellipsizeMode="middle">
                      {detailTitle}
                    </Text>
                  </View>
                  <View style={styles.headerDetailSubRow}>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 5,
                        paddingHorizontal: 8,
                        paddingVertical: 3,
                        borderRadius: 20,
                        backgroundColor: `${getStatusColor(selected.status)}26`,
                        borderWidth: 1,
                        borderColor: `${getStatusColor(selected.status)}55`,
                      }}>
                      <View
                        style={[
                          styles.headerStatusDot,
                          {
                            backgroundColor: getStatusColor(selected.status),
                          },
                        ]}
                      />
                      <Text
                        style={[
                          styles.headerSubTitle,
                          {fontFamily: AppFonts.interBold},
                        ]}>
                        {selected.status === 0
                          ? 'Failed'
                          : selected.status ?? 'Pending'}
                      </Text>
                    </View>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 4,
                        paddingHorizontal: 8,
                        paddingVertical: 3,
                        borderRadius: 20,
                        backgroundColor: `${AppColors.white}29`,
                      }}>
                      <ClockIcon color={AppColors.white} size={11} />
                      <Text style={styles.headerSubTitle}>
                        {selected.duration != null
                          ? `${selected.duration}ms`
                          : '—'}
                      </Text>
                    </View>
                    {selected.response != null && (
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 4,
                          paddingHorizontal: 8,
                          paddingVertical: 3,
                          borderRadius: 20,
                          backgroundColor: `${AppColors.white}29`,
                        }}>
                        <SizeIcon color={AppColors.white} size={11} />
                        <Text style={styles.headerSubTitle}>
                          {getSize(selected.response)}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              ) : activeTab === 'analytics' && selectedEvent != null ? (
                <View style={styles.headerDetailCenter}>
                  <View style={styles.headerDetailRow}>
                    <View
                      style={[
                        styles.headerMethodBadge,
                        {
                          backgroundColor:
                            selectedEvent.source === 'firebase'
                              ? `${AppColors.firebaseOrange}4D`
                              : `${AppColors.purple}4D`,
                        },
                      ]}>
                      <Text style={styles.headerMethodText}>
                        {selectedEvent.source === 'firebase' ? 'FB' : 'MAN'}
                      </Text>
                    </View>
                    <Text
                      style={styles.headerDetailTitle}
                      numberOfLines={1}
                      ellipsizeMode="middle">
                      {selectedEvent.name}
                    </Text>
                  </View>
                  <View style={styles.headerDetailSubRow}>
                    <View
                      style={[
                        styles.headerStatusDot,
                        {
                          backgroundColor:
                            selectedEvent.source === 'firebase'
                              ? AppColors.firebaseOrange
                              : AppColors.purple,
                        },
                      ]}
                    />
                    <Text style={styles.headerSubTitle}>
                      {Object.keys(selectedEvent.params).length} param
                      {Object.keys(selectedEvent.params).length !== 1
                        ? 's'
                        : ''}
                      {' · '}
                      {selectedEvent.source}
                    </Text>
                  </View>
                </View>
              ) : activeTab === 'logs' && selectedLog != null ? (
                <View style={styles.headerDetailCenter}>
                  <View style={styles.headerDetailRow}>
                    <View
                      style={[
                        styles.headerMethodBadge,
                        {
                          backgroundColor:
                            selectedLog.type === 'error'
                              ? `${AppColors.errorColor}4D`
                              : selectedLog.type === 'warn'
                              ? `${AppColors.lightOrange}4D`
                              : `${AppColors.purple}4D`,
                        },
                      ]}>
                      <Text style={styles.headerMethodText}>
                        {selectedLog.type.toUpperCase()}
                      </Text>
                    </View>
                    <Text
                      style={styles.headerDetailTitle}
                      numberOfLines={1}
                      ellipsizeMode="middle">
                      console.
                      {selectedLog.sourceMethod || selectedLog.type || 'log'}
                    </Text>
                  </View>
                  <View style={styles.headerDetailSubRow}>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 4,
                        paddingHorizontal: 8,
                        paddingVertical: 3,
                        borderRadius: 20,
                        backgroundColor: `${AppColors.white}29`,
                      }}>
                      <ClockIcon color={AppColors.white} size={11} />
                      <Text style={styles.headerSubTitle}>
                        {formatTime(selectedLog.timestamp)}
                      </Text>
                    </View>
                  </View>
                </View>
              ) : activeTab === 'redux' && selectedReduxSlice != null ? (
                (() => {
                  const sliceData = reduxState?.[selectedReduxSlice];
                  const keyCount =
                    sliceData && typeof sliceData === 'object'
                      ? Object.keys(sliceData).length
                      : typeof sliceData !== 'undefined'
                      ? 1
                      : 0;
                  const sliceSize = getSize(sliceData);
                  const lastAction = reduxLastActionMap[selectedReduxSlice];

                  return (
                    <View style={styles.headerDetailCenter}>
                      <View style={styles.headerDetailRow}>
                        <View
                          style={[
                            styles.headerMethodBadge,
                            {
                              backgroundColor: `${AppColors.purple}4D`,
                            },
                          ]}>
                          <Text style={styles.headerMethodText}>SLICE</Text>
                        </View>
                        <Text
                          style={styles.headerDetailTitle}
                          numberOfLines={1}
                          ellipsizeMode="middle">
                          {selectedReduxSlice}
                        </Text>
                      </View>
                      <View style={styles.headerDetailSubRow}>
                        <View
                          style={[
                            styles.headerStatusDot,
                            {backgroundColor: AppColors.liveGreen},
                          ]}
                        />
                        <Text style={styles.headerSubTitle}>Live</Text>
                        <Text style={[styles.headerSubTitle, {opacity: 0.6}]}>
                          •
                        </Text>
                        <Text style={styles.headerSubTitle}>
                          {keyCount} keys
                        </Text>
                        <Text style={[styles.headerSubTitle, {opacity: 0.6}]}>
                          •
                        </Text>
                        <Text style={styles.headerSubTitle}>{sliceSize}</Text>
                        {lastAction?.timestamp && (
                          <>
                            <Text
                              style={[styles.headerSubTitle, {opacity: 0.6}]}>
                              •
                            </Text>
                            <View
                              style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 3,
                              }}>
                              <ClockIcon color={AppColors.white} size={10} />
                              <Text style={styles.headerSubTitle}>
                                {lastAction.timestamp}
                              </Text>
                            </View>
                          </>
                        )}
                      </View>
                    </View>
                  );
                })()
              ) : activeTab === 'redux' && selectedReduxAction != null ? (
                <View style={styles.headerDetailCenter}>
                  <View style={styles.headerDetailRow}>
                    <View
                      style={[
                        styles.headerMethodBadge,
                        {
                          backgroundColor: `${AppColors.brandPurple}4D`,
                        },
                      ]}>
                      <Text style={styles.headerMethodText}>ACTION</Text>
                    </View>
                    <Text
                      style={styles.headerDetailTitle}
                      numberOfLines={1}
                      ellipsizeMode="middle">
                      {selectedReduxAction.type}
                    </Text>
                  </View>
                  <View style={styles.headerDetailSubRow}>
                    <View
                      style={[
                        styles.headerStatusDot,
                        {backgroundColor: AppColors.purple},
                      ]}
                    />
                    <Text style={styles.headerSubTitle}>
                      {selectedReduxAction.timestamp || 'Dispatched'}
                    </Text>
                  </View>
                </View>
              ) : activeTab === 'crash' && selectedCrash != null ? (
                <View style={styles.headerDetailCenter}>
                  <View style={styles.headerDetailRow}>
                    <View
                      style={[
                        styles.headerMethodBadge,
                        {
                          backgroundColor: selectedCrash.isFatal
                            ? AppColors.red600
                            : AppColors.amber600,
                        },
                      ]}>
                      <Text style={styles.headerMethodText}>
                        {selectedCrash.isFatal
                          ? 'FATAL'
                          : selectedCrash.type.toUpperCase()}
                      </Text>
                    </View>
                    <Text
                      style={styles.headerDetailTitle}
                      numberOfLines={1}
                      ellipsizeMode="middle">
                      {selectedCrash.name || selectedCrash.message}
                    </Text>
                  </View>
                  <View style={styles.headerDetailSubRow}>
                    <View
                      style={[
                        styles.headerStatusDot,
                        {
                          backgroundColor: selectedCrash.isFatal
                            ? AppColors.red600
                            : AppColors.amber500,
                        },
                      ]}
                    />
                    <Text style={styles.headerSubTitle}>
                      {selectedCrash.timeStr ||
                        new Date(selectedCrash.timestamp).toLocaleTimeString()}
                    </Text>
                    {selectedCrash.deviceInfo?.platform && (
                      <>
                        <Text style={[styles.headerSubTitle, {opacity: 0.6}]}>
                          •
                        </Text>
                        <Text style={styles.headerSubTitle}>
                          {selectedCrash.deviceInfo.platform.toUpperCase()}
                        </Text>
                      </>
                    )}
                  </View>
                </View>
              ) : null}
            </View>
          )}

          <View
            style={[
              styles.headerRight,
              {
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'flex-end',
                flexShrink: 0,
                gap: 8,
              },
            ]}>
            {isSettingsView && (
              <TouchableScale
                onPress={() => {
                  Alert.alert(
                    'Reset All Settings',
                    'This restores all module visibility and UI preferences to defaults. Continue?',
                    [
                      {text: 'Cancel', style: 'cancel'},
                      {
                        text: 'Reset',
                        style: 'destructive',
                        onPress: resetToDefaults,
                      },
                    ],
                  );
                }}
                hitSlop={15}
                style={styles.closeButtonSquare}>
                <ResetIcon color={AppColors.white} size={14} />
              </TouchableScale>
            )}

            {!isAnySelected && (
              <TouchableScale
                onPress={() => {
                  Alert.alert(
                    'Clear Everything',
                    'This clears all tabs — APIs, Logs, Analytics, Redux timeline and Crash history. Continue?',
                    [
                      {text: 'Cancel', style: 'cancel'},
                      {
                        text: 'Clear All',
                        onPress: runClearAllWithAnimation,
                        style: 'destructive',
                      },
                    ],
                  );
                }}
                hitSlop={15}
                style={styles.closeButtonSquare}>
                <Animated.View
                  style={{
                    transform: [
                      {
                        rotate: clearAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0deg', '-25deg'],
                        }),
                      },
                      {
                        scale: clearAnim.interpolate({
                          inputRange: [0, 0.5, 1],
                          outputRange: [1, 1.25, 1],
                        }),
                      },
                    ],
                  }}>
                  <TrashIcon color={AppColors.white} size={14} />
                </Animated.View>
              </TouchableScale>
            )}

            {!isAnySelected && (
              <TouchableScale
                onPress={() => setSettingsPage('main')}
                hitSlop={15}
                style={styles.closeButtonSquare}>
                <SettingsIcon color={AppColors.white} size={14} />
              </TouchableScale>
            )}

            <TouchableScale
              onPress={closeModal}
              hitSlop={15}
              style={styles.closeButtonSquare}>
              <CloseWhite size={14} />
            </TouchableScale>
          </View>
        </View>
      </View>
    </LinearGradient>

    {/* Dedicated Update Available Details Modal */}
    <UpdateAvailableModal
      visible={showUpdateModal}
      latestVersion={latestNpmVersion}
      onClose={() => setShowUpdateModal(false)}
    />
    </>
  );
});

export default InspectorHeader;
