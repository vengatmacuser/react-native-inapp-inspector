import React from 'react';
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
import BrandSquareIcon from '../BrandSquareIcon';
import styles from '../../styles';
import {AppColors} from '../../styles/AppColors';
import {AppFonts} from '../../styles/AppFonts';
import {METHOD_COLORS} from '../../constants';
import {LIB_VERSION} from '../../constants';
import {Method} from '../../types';
import {getStatusColor} from '../../helpers';
import {getAppName} from '../../helpers';
import {getBundleIdentifier} from '../../helpers';
import {formatTime} from '../../helpers';
import {
  WhiteBackNavigation,
  TrashIcon,
  SettingsIcon,
  CloseWhite,
  ChevronIcon,
  ClockIcon,
} from '../NetworkIcons';

const InspectorHeader = React.memo(() => {
  const {
    modalHeightPercent,
    selected,
    setSelected,
    selectedEvent,
    setSelectedEvent,
    selectedLog,
    setSelectedLog,
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
  } = useInspector();

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
                gap: 16,
                flex:
                  selected == null &&
                  selectedEvent == null &&
                  selectedLog == null
                    ? 5
                    : 1,
              },
            ]}>
            <TouchableScale
              onPress={() => {
                requestAnimationFrame(() => {
                  setSelected(null);
                  setSelectedEvent(null);
                  setSelectedLog(null);
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
                selected == null &&
                  selectedEvent == null &&
                  selectedLog == null && {display: 'none'},
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

            {selected == null &&
            selectedEvent == null &&
            selectedLog == null ? (
              <TouchableScale
                onPress={() => setShowHeaderInfo(prev => !prev)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                  gap: 10,
                  flex: 1,
                }}>
                <View
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: 12,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: `${AppColors.white}21`,
                    borderWidth: 1.5,
                    borderColor: `${AppColors.white}40`,
                    shadowColor: AppColors.black,
                    shadowOpacity: 0.15,
                    shadowRadius: 4,
                    shadowOffset: {width: 0, height: 2},
                    flexShrink: 0,
                  }}>
                  <BrandSquareIcon size={42} />
                </View>
                <View style={{gap: 2, flex: 1}}>
                  <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
                    <Text style={[styles.headerTitle]} numberOfLines={1}>
                      {getAppName()}
                    </Text>
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
                            paddingHorizontal: 5,
                            paddingVertical: 2,
                            backgroundColor: `${AppColors.white}47`,
                          }}>
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
                            paddingVertical: 2,
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
                            paddingHorizontal: 5,
                            paddingVertical: 2,
                            backgroundColor: `${AppColors.white}47`,
                          }}>
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

          {(selected != null ||
            selectedEvent != null ||
            selectedLog != null) && (
            <View style={styles.headerCenter}>
              {selected != null ? (
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
                  </View>
                </View>
              ) : selectedEvent != null ? (
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
              ) : selectedLog != null ? (
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
              ) : null}
            </View>
          )}

          <View
            style={[
              styles.headerRight,
              selected == null &&
                selectedEvent == null &&
                selectedLog == null && {
                  flexShrink: 0,
                  minWidth: 116,
                },
            ]}>
            {selected == null &&
              selectedEvent == null &&
              selectedLog == null && (
              <TouchableScale
                onPress={() => {
                  Alert.alert(
                    'Clear Everything',
                    'This clears all tabs — APIs, Logs, Analytics and Redux timeline. Continue?',
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
                style={[
                  styles.closeButtonSquare,
                  {
                    marginRight: 8,
                    backgroundColor: `${AppColors.white}26`,
                  },
                ]}>
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

            {selected == null &&
              selectedEvent == null &&
              selectedLog == null && (
              <TouchableScale
                onPress={() => setSettingsPage('main')}
                hitSlop={15}
                style={[
                  styles.closeButtonSquare,
                  {
                    marginRight: 8,
                    backgroundColor: `${AppColors.white}26`,
                  },
                ]}>
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