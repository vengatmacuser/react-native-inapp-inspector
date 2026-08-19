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
import {getStatusColor, getAppName, getBundleIdentifier, formatTime, getSize} from '../../helpers';
import {
  WhiteBackNavigation,
  TrashIcon,
  SettingsIcon,
  CloseWhite,
  ChevronIcon,
  ClockIcon,
  SizeIcon,
  AppleIcon,
  AndroidIcon,
  PackageBoxIcon,
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
    setSettingsPage,
    closeModal,
    detailTitle,
    activeTab,
    environment,
    selectedCrash,
    setSelectedCrash,
  } = useInspector();

  const envConfig = useMemo(() => {
    const rawEnv = (environment || (__DEV__ ? 'DEV' : 'PROD')).trim();
    const clean = rawEnv.toUpperCase();

    if (clean === 'DEV' || clean.includes('DEV') || clean === 'LOCAL') {
      return {
        label: rawEnv,
        bg: 'rgba(16, 185, 129, 0.25)', // emerald
        border: 'rgba(110, 231, 183, 0.55)',
        text: '#A7F3D0',
      };
    }
    if (clean === 'UAT' || clean === 'QA' || clean === 'TEST') {
      return {
        label: rawEnv,
        bg: 'rgba(245, 158, 11, 0.28)', // amber
        border: 'rgba(252, 211, 77, 0.6)',
        text: '#FDE68A',
      };
    }
    if (clean === 'PREPROD' || clean === 'STAGE' || clean === 'STAGING') {
      return {
        label: rawEnv,
        bg: 'rgba(139, 92, 246, 0.28)', // purple
        border: 'rgba(196, 181, 253, 0.6)',
        text: '#DDD6FE',
      };
    }
    // PROD / Live
    return {
      label: rawEnv,
      bg: 'rgba(244, 63, 94, 0.25)', // rose
      border: 'rgba(253, 164, 175, 0.55)',
      text: '#FECDD3',
    };
  }, [environment]);

  const isDetailView =
    (activeTab === 'apis' && selected != null) ||
    (activeTab === 'analytics' && selectedEvent != null) ||
    (activeTab === 'logs' && selectedLog != null) ||
    (activeTab === 'redux' && (selectedReduxSlice != null || selectedReduxAction != null)) ||
    (activeTab === 'crash' && selectedCrash != null);

  const isAnySelected = isDetailView;

  const headerTopPadding =
    Platform.OS === 'ios' && modalHeightPercent >= 95 ? 44 : 0;

  return (
    <LinearGradient
      colors={[AppColors.purple, AppColors.brandPurple]}
      style={styles.headerGradient}>
      <View style={{paddingTop: headerTopPadding, width: '100%'}}>
        <View style={styles.header}>
          <View
            style={[
              styles.headerLeft,
              {
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                flex: !isDetailView ? 1 : 0,
                minWidth: 0,
              },
            ]}>
            <TouchableScale
              onPress={() => {
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

            {!isAnySelected ? (
              <TouchableScale
                onPress={() => setShowHeaderInfo(prev => !prev)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                  gap: 10,
                  flex: 1,
                }}>
                <AppHeaderLogo size={46} customIcon={appIcon} />
                <View style={{gap: 2, flex: 1, minWidth: 0}}>
                  <View style={{flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'nowrap', minWidth: 0}}>
                    <Text style={[styles.headerTitle, {flexShrink: 1}]} numberOfLines={1}>
                      {getAppName()}
                    </Text>
                    <View
                      style={[
                        styles.envBadge,
                        {
                          backgroundColor: envConfig.bg,
                          borderColor: envConfig.border,
                        },
                      ]}>
                      <Text
                        style={[
                          styles.envBadgeText,
                          {color: envConfig.text},
                        ]}>
                        {envConfig.label}
                      </Text>
                    </View>
                    {updateAvailable && (
                      <Pressable
                        hitSlop={10}
                        onPress={() =>
                          Alert.alert(
                            'Update Available',
                            `react-native-inapp-inspector v${latestNpmVersion} is available on NPM (installed: v${LIB_VERSION}).`,
                            [
                              {text: 'Later', style: 'cancel'},
                              {
                                text: 'View on NPM',
                                onPress: () =>
                                  Linking.openURL(
                                    'https://www.npmjs.com/package/react-native-inapp-inspector',
                                  ).catch(() => {}),
                              },
                            ],
                          )
                        }
                        style={{
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
                        <Animated.View
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: AppColors.liveGreen,
                            borderWidth: 1,
                            borderColor: `${AppColors.white}E6`,
                            opacity: activePulseAnim,
                            transform: [{scale: unreadPulseAnim}],
                          }}
                        />
                      </Pressable>
                    )}
                  </View>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      alignSelf: 'flex-start',
                      backgroundColor: `${AppColors.white}1A`,
                      borderRadius: 10,
                      paddingHorizontal: 8,
                      paddingVertical: 3,
                      gap: 5,
                      borderWidth: 1,
                      borderColor: `${AppColors.white}26`,
                    }}>
                    <View
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: AppColors.liveGreen,
                      }}
                    />
                    <Text
                      style={{
                        fontFamily: AppFonts.interMedium,
                        fontSize: 10,
                        color: `${AppColors.white}D9`,
                        letterSpacing: 0.2,
                      }}
                      numberOfLines={1}>
                      {getBundleIdentifier()}
                    </Text>
                    <Animated.View
                      style={{
                        transform: [{rotate: showHeaderInfo ? '180deg' : '0deg'}],
                        marginLeft: 2,
                      }}>
                      <ChevronIcon color="rgba(255,255,255,0.6)" size={12} />
                    </Animated.View>
                  </View>
                  {showHeaderInfo && (
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 6,
                        marginTop: 4,
                      }}>
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          borderRadius: 6,
                          overflow: 'hidden',
                          borderWidth: 1,
                          borderColor: `${AppColors.white}2E`,
                        }}>
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 3.5,
                            paddingHorizontal: 6,
                            paddingVertical: 2.5,
                            backgroundColor: `${AppColors.white}47`,
                          }}>
                          {Platform.OS === 'ios' ? (
                            <AppleIcon color={AppColors.white} size={10} />
                          ) : (
                            <AndroidIcon color={AppColors.white} size={10} />
                          )}
                          <Text
                            style={{
                              fontFamily: AppFonts.interBold,
                              fontSize: 9,
                              color: AppColors.white,
                              letterSpacing: 0.3,
                            }}>
                            {Platform.OS === 'ios' ? 'iOS' : 'Android'}
                          </Text>
                        </View>
                        <View
                          style={{
                            paddingHorizontal: 5,
                            paddingVertical: 2.5,
                            backgroundColor: `${AppColors.white}1F`,
                          }}>
                          <Text
                            style={{
                              fontFamily: AppFonts.interMedium,
                              fontSize: 9.5,
                              color: `${AppColors.white}EB`,
                            }}>
                            {String(Platform.Version)}
                          </Text>
                        </View>
                      </View>
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          borderRadius: 6,
                          overflow: 'hidden',
                          borderWidth: 1,
                          borderColor: `${AppColors.white}2E`,
                        }}>
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 3.5,
                            paddingHorizontal: 6,
                            paddingVertical: 2.5,
                            backgroundColor: `${AppColors.white}47`,
                          }}>
                          <PackageBoxIcon color={AppColors.white} size={10} />
                          <Text
                            style={{
                              fontFamily: AppFonts.interBold,
                              fontSize: 9,
                              color: AppColors.white,
                              letterSpacing: 0.3,
                            }}>
                            npm
                          </Text>
                        </View>
                        <View
                          style={{
                            paddingHorizontal: 5,
                            paddingVertical: 2,
                            backgroundColor: `${AppColors.white}1F`,
                          }}>
                          <Text
                            style={{
                              fontFamily: AppFonts.interMedium,
                              fontSize: 9.5,
                              color: `${AppColors.white}EB`,
                            }}>
                            v{LIB_VERSION}
                          </Text>
                        </View>
                      </View>
                    </View>
                  )}
                </View>
              </TouchableScale>
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
                        backgroundColor: `${getStatusColor(
                          selected.status,
                        )}26`,
                        borderWidth: 1,
                        borderColor: `${getStatusColor(
                          selected.status,
                        )}55`,
                      }}>
                      <View
                        style={[
                          styles.headerStatusDot,
                          {
                            backgroundColor: getStatusColor(
                              selected.status,
                            ),
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
                        {selectedEvent.source === 'firebase'
                          ? 'FB'
                          : 'MAN'}
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
                      {(selectedLog.sourceMethod) ||
                        selectedLog.type ||
                        'log'}
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
                          <Text style={styles.headerMethodText}>
                            SLICE
                          </Text>
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
                        <Text style={styles.headerSubTitle}>
                          Live
                        </Text>
                        <Text style={[styles.headerSubTitle, {opacity: 0.6}]}>•</Text>
                        <Text style={styles.headerSubTitle}>
                          {keyCount} keys
                        </Text>
                        <Text style={[styles.headerSubTitle, {opacity: 0.6}]}>•</Text>
                        <Text style={styles.headerSubTitle}>
                          {sliceSize}
                        </Text>
                        {lastAction?.timestamp && (
                          <>
                            <Text style={[styles.headerSubTitle, {opacity: 0.6}]}>•</Text>
                            <View style={{flexDirection: 'row', alignItems: 'center', gap: 3}}>
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
                      <Text style={styles.headerMethodText}>
                        ACTION
                      </Text>
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
                            ? '#DC2626'
                            : '#D97706',
                        },
                      ]}>
                      <Text style={styles.headerMethodText}>
                        {selectedCrash.isFatal ? 'FATAL' : selectedCrash.type.toUpperCase()}
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
                            ? '#DC2626'
                            : '#F59E0B',
                        },
                      ]}
                    />
                    <Text style={styles.headerSubTitle}>
                      {selectedCrash.timeStr || new Date(selectedCrash.timestamp).toLocaleTimeString()}
                    </Text>
                    {selectedCrash.deviceInfo?.platform && (
                      <>
                        <Text style={[styles.headerSubTitle, {opacity: 0.6}]}>•</Text>
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
                  <TrashIcon color={AppColors.white} size={16} />
                </Animated.View>
              </TouchableScale>
            )}

            {!isAnySelected && (
              <TouchableScale
                onPress={() => setSettingsPage('main')}
                hitSlop={15}
                style={styles.closeButtonSquare}>
                <SettingsIcon color={AppColors.white} size={16} />
              </TouchableScale>
            )}

            <TouchableScale
              onPress={closeModal}
              hitSlop={15}
              style={styles.closeButtonSquare}>
              <CloseWhite size={16} />
            </TouchableScale>
          </View>
        </View>
      </View>
    </LinearGradient>
  );
});

export default InspectorHeader;