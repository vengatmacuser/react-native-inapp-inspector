import React, {useMemo} from 'react';
import {
  Alert,
  Animated,
  Linking,
  Platform,
  Pressable,
  StatusBar,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useInspector} from './InspectorContext';
import TouchableScale from '../TouchableScale';
import AppHeaderLogo from '../AppHeaderLogo';
import {BrandCircleIcon} from '../BrandCircleIcon';
import styles from '../../styles';
import {AppColors} from '../../styles/AppColors';
import {AppFonts} from '../../styles/AppFonts';
import {METHOD_COLORS} from '../../constants';
import {LIB_VERSION} from '../../constants';
import {Method} from '../../types';
import {
  getStatusColor,
  getAppName,
  formatTime,
  formatTimeShort,
  getSize,
  formatByteSize,
  getAppVersionAndBuild,
  showToast,
} from '../../helpers';
import {
  triggerNativeHaptic,
} from '../../native/NativeInspector';
import {ScreenCapture, CapturedMediaItem, generateCaptureId} from '../../capture';
import {MediaPreviewModal} from './MediaPreviewModal';
import {LanguageSelectorModal} from './LanguageSelectorModal';
import CountryFlag from '../CountryFlag';
import {
  WhiteBackNavigation,
  TrashIcon,
  SettingsIcon,
  CloseWhite,
  ChevronDownIcon,
  ClockIcon,
  SizeIcon,
  AppleIcon,
  AndroidIcon,
  NpmIcon,
  ResetIcon,
  BoltIcon,
  InfoCircleIcon,
  CameraIcon,
  VideoCameraIcon,
  EyeIcon,
} from '../NetworkIcons';
import {useTranslation, SUPPORTED_LANGUAGES, getLanguage} from '../../i18n';

const InspectorHeader = React.memo(() => {
  const {t, language} = useTranslation();
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
    clearAnim,
    runClearAllWithAnimation,
    settingsPage,
    setSettingsPage,
    isAboutOpen,
    setIsAboutOpen,
    resetToDefaults,
    closeModal,
    minimizeInspector,
    detailTitle,
    activeTab,
    environment,
    selectedCrash,
    setSelectedCrash,
    selectedPush,
    setSelectedPush,
    selectedSocket,
    setSelectedSocket,
    refreshMediaCount,
    peekMode,
    setPeekMode,
    previewMediaItem,
    setPreviewMediaItem,
  } = useInspector();

  const {width: windowWidth} = useWindowDimensions();
  const isNarrow = windowWidth < 360;
  const isCompact = windowWidth < 400;

  const [showCopyBanner, setShowCopyBanner] = React.useState<boolean>(false);
  const [showLanguageModal, setShowLanguageModal] = React.useState<boolean>(false);
  const [appVersionString] = React.useState<string>(() => {
    return getAppVersionAndBuild().formatted;
  });

  const currentLang = useMemo(() => {
    const code = language || getLanguage();
    return (
      SUPPORTED_LANGUAGES.find(l => l.code === code) || SUPPORTED_LANGUAGES[0]
    );
  }, [language]);

  const [isRecording, setIsRecording] = React.useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = React.useState<number>(0);
  const recordingTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    ScreenCapture.isRecording()
      .then(active => {
        setIsRecording(active);
      })
      .catch(() => {});
  }, []);

  React.useEffect(() => {
    if (isRecording) {
      setRecordingSeconds(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds(s => s + 1);
      }, 1000);
    } else {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
      setRecordingSeconds(0);
    }
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    };
  }, [isRecording]);

  const handleTakeScreenshot = React.useCallback(async () => {
    try {
      triggerNativeHaptic('light');
      const result = await ScreenCapture.takeScreenshot({
        format: 'png',
        quality: 0.9,
        hideInspector: true,
      });
      if (result) {
        triggerNativeHaptic('success');
        const captureId = generateCaptureId('screenshot', result.format || 'png');
        const newItem: CapturedMediaItem = {
          id: captureId,
          type: 'image',
          format: result.format,
          uri: result.uri,
          filename:
            result.uri.split('/').pop() || captureId,
          sizeBytes: result.sizeBytes,
          timestamp: result.timestamp,
          width: result.width,
          height: result.height,
        };
        setPreviewMediaItem(newItem);
        refreshMediaCount?.().catch(() => {});
        showToast(t('header.screenshotCaptured'));
      } else {
        showToast(t('header.screenshotFailed'));
      }
    } catch {
      showToast(t('header.screenshotError'));
    }
  }, [refreshMediaCount, t]);

  const handleToggleVideoRecording = React.useCallback(async () => {
    try {
      if (isRecording) {
        triggerNativeHaptic('medium');
        const result = await ScreenCapture.stopRecording();
        setIsRecording(false);
        if (result) {
          triggerNativeHaptic('success');
          const captureId = generateCaptureId('video', result.format);
          const newItem: CapturedMediaItem = {
            id: captureId,
            type: result.format === 'gif' ? 'gif' : 'video',
            format: result.format,
            uri: result.uri,
            filename:
              result.uri.split('/').pop() ||
              captureId,
            sizeBytes: result.sizeBytes,
            timestamp: result.timestamp,
            durationMs: result.durationMs,
            width: result.width,
            height: result.height,
            hasAudio: result.hasAudio,
          };
          setPreviewMediaItem(newItem);
          refreshMediaCount?.().catch(() => {});
          showToast(
            t('header.recordingSaved', {
              duration: (result.durationMs / 1000).toFixed(1),
            }),
          );
        }
      } else {
        triggerNativeHaptic('medium');
        const started = await ScreenCapture.startRecording({
          fps: 24,
          audioSource: 'none',
        });
        if (started) {
          setIsRecording(true);
          showToast(t('header.recordingStarted'));
        } else {
          showToast(t('header.recordingStartFailed'));
        }
      }
    } catch {
      showToast(t('header.recordingError'));
      setIsRecording(false);
    }
  }, [isRecording, t]);

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`;
  };

  const envConfig = useMemo(() => {
    const rawEnv = (environment || (__DEV__ ? 'DEV' : 'PROD')).trim();
    const clean = rawEnv.toUpperCase();

    if (clean === 'DEV' || clean.includes('DEV') || clean === 'LOCAL') {
      return {
        label: rawEnv,
        bg: `${AppColors.emerald500}40`,
        border: `${AppColors.emerald400}8C`,
        text: AppColors.mintGreenBorder,
      };
    }
    if (clean === 'UAT' || clean === 'QA' || clean === 'TEST') {
      return {
        label: rawEnv,
        bg: `${AppColors.amber500}47`,
        border: `${AppColors.amber400}99`,
        text: AppColors.amberWarmBorder,
      };
    }
    if (clean === 'PREPROD' || clean === 'STAGE' || clean === 'STAGING') {
      return {
        label: rawEnv,
        bg: `${AppColors.purple500}47`,
        border: `${AppColors.purple400}99`,
        text: AppColors.violetSoftBorder,
      };
    }
    return {
      label: rawEnv,
      bg: `${AppColors.rose500}40`,
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
    (activeTab === 'crash' && selectedCrash != null) ||
    (activeTab === 'push' && selectedPush != null) ||
    (activeTab === 'socket' && selectedSocket != null);

  const isSettingsView = settingsPage !== null;
  const isAnySelected =
    isDetailView || isSettingsView || isAboutOpen;

  const settingsModuleTitle = useMemo(() => {
    switch (settingsPage) {
      case 'apis':
        return 'APIs (Network)';
      case 'logs':
        return 'Console Logs';
      case 'crash':
        return 'Crash Protection';
      case 'analytics':
        return 'Analytics Logger';
      case 'redux':
        return 'Redux Inspector';
      case 'media':
        return 'Screencast (Media)';
      case 'push':
        return 'Push Notifications';
      default:
        return 'Settings & Modules';
    }
  }, [settingsPage]);

  const headerTopPadding = useMemo(() => {
    if (Platform.OS === 'ios') {
      if (modalHeightPercent >= 98) {
        return windowWidth >= 390 ? 50 : 44;
      }
      return 0;
    }
    if (Platform.OS === 'android' && modalHeightPercent >= 98) {
      return StatusBar.currentHeight || 24;
    }
    return 0;
  }, [modalHeightPercent, windowWidth]);

  const buttonSize = isNarrow ? 24 : isCompact ? 25.5 : 26;
  const logoSize = isNarrow ? 36 : isCompact ? 38 : 40;

  return (
    <>
      <View
        style={[
          styles.headerGradient,
          {
            minHeight: (isNarrow ? 44 : 48) + headerTopPadding,
          },
        ]}>
        {/* LinearGradient as absolute background layer to avoid Fabric view recycling crash.
            BVLinearGradient as a direct parent of conditionally-mounted children triggers
            RCTComponentViewRegistry 'Attempt to recycle a mounted view' assertion. */}
        <LinearGradient
          colors={[AppColors.indigo600, AppColors.violet600]}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 1}}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
          }}
          pointerEvents="none"
        />
        <View style={{paddingTop: headerTopPadding, width: '100%'}}>
          <View
            style={[
              styles.header,
              {
                width: '100%',
                justifyContent: 'space-between',
                paddingHorizontal: isNarrow ? 8 : 10,
                paddingVertical: 5,
                minHeight: isNarrow ? 44 : 48,
              },
            ]}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: isNarrow ? 6 : 8,
                flex: isDetailView ? undefined : 1,
                flexShrink: isDetailView ? 0 : 1,
                minWidth: 0,
              }}>
              {isAnySelected && (
                <TouchableScale
                  onPress={() => {
                    if (isAboutOpen) {
                      setIsAboutOpen(false);
                      return;
                    }
                    if (isSettingsView) {
                      if (settingsPage === 'main') {
                        setSettingsPage(null);
                      } else {
                        setSettingsPage('main');
                      }
                      return;
                    }
                    setSelected(null);
                    setSelectedEvent(null);
                    setSelectedLog(null);
                    setSelectedReduxSlice(null);
                    setSelectedReduxAction(null);
                    setSelectedCrash(null);
                    setSelectedPush(null);
                    setSelectedSocket(null);
                  }}
                  hitSlop={15}
                  style={{
                    width: isNarrow ? 30 : 34,
                    height: isNarrow ? 30 : 34,
                    borderRadius: isNarrow ? 15 : 17,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: `${AppColors.white}2E`,
                    borderWidth: 1,
                    borderColor: `${AppColors.white}4D`,
                    flexShrink: 0,
                  }}>
                  <View
                    style={{
                      position: 'absolute',
                      width: isNarrow ? 38 : 42,
                      height: isNarrow ? 38 : 42,
                      borderRadius: 21,
                      backgroundColor: `${AppColors.white}1A`,
                    }}
                  />
                  <WhiteBackNavigation />
                </TouchableScale>
              )}

              {isAboutOpen ? (
                <View
                  style={{
                    gap: 2.5,
                    flex: 1,
                    minWidth: 0,
                    marginRight: 6,
                    justifyContent: 'center',
                  }}>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                    }}>
                    <Text
                      style={{
                        fontFamily: AppFonts.interBold,
                        fontSize: isNarrow ? 14.5 : 16,
                        lineHeight: isNarrow ? 18 : 20,
                        color: AppColors.white,
                        letterSpacing: -0.2,
                      }}
                      numberOfLines={1}>
                      About & Specs
                    </Text>
                    <View
                      style={{
                        backgroundColor: `${AppColors.white}26`,
                        paddingHorizontal: isNarrow ? 5 : 6,
                        paddingVertical: 2,
                        borderRadius: 8,
                        borderWidth: 1,
                        borderColor: `${AppColors.white}20`,
                      }}>
                      <Text
                        style={{
                          fontFamily: AppFonts.interBold,
                          fontSize: isNarrow ? 8.5 : 9.5,
                          lineHeight: 12,
                          color: AppColors.white,
                        }}>
                        v{LIB_VERSION}
                      </Text>
                    </View>
                  </View>
                  <Text
                    style={{
                      fontFamily: AppFonts.interRegular,
                      fontSize: isNarrow ? 10 : 11,
                      lineHeight: isNarrow ? 13.5 : 14.5,
                      color: `${AppColors.white}CC`,
                      marginTop: 0.5,
                    }}
                    numberOfLines={1}
                    ellipsizeMode="tail">
                    {t('common.aboutSpecsSubtitle', 'Package info, runtime specs & diagnostic payload')}
                  </Text>
                </View>
              ) : isSettingsView ? (
                <View style={{gap: 2.5, flex: 1, minWidth: 0, marginRight: 6, justifyContent: 'center'}}>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                    }}>
                    <Text
                      style={{
                        fontFamily: AppFonts.interBold,
                        fontSize: isNarrow ? 14.5 : 16,
                        lineHeight: isNarrow ? 19 : 21,
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
                          paddingHorizontal: isNarrow ? 5 : 6,
                          paddingVertical: 2,
                          borderRadius: 8,
                          borderWidth: 1,
                          borderColor: `${AppColors.white}20`,
                        }}>
                        <Text
                          style={{
                            fontFamily: AppFonts.interBold,
                            fontSize: isNarrow ? 8.5 : 9.5,
                            lineHeight: 12,
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
                      fontSize: isNarrow ? 10 : 11,
                      lineHeight: isNarrow ? 14 : 15,
                      color: `${AppColors.white}CC`,
                      marginTop: 2,
                    }}
                    numberOfLines={1}
                    ellipsizeMode="tail">
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
                    gap: isNarrow ? 7 : 8.5,
                    flex: 1,
                    minWidth: 0,
                    marginRight: 6,
                  }}>
                  <BrandCircleIcon size={isNarrow ? 38 : isCompact ? 40 : 42} />
                  <View style={{gap: 3, flex: 1, minWidth: 0, justifyContent: 'center'}}>
                    {/* Top Row: Full prominent package name */}
                    <Text
                      style={[
                        styles.headerTitle,
                        {
                          fontFamily: AppFonts.interBold,
                          fontWeight: '700',
                          fontSize: isNarrow ? 12.5 : isCompact ? 13 : 14,
                          lineHeight: isNarrow ? 17 : isCompact ? 18 : 19,
                          color: AppColors.white,
                          letterSpacing: -0.2,
                          paddingBottom: 0,
                        },
                      ]}
                      numberOfLines={1}
                      ellipsizeMode="tail">
                      react-native-inapp-inspector
                    </Text>

                    {/* Sub Row: Language Selector, OS Chip, NPM Version Chip */}
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 4,
                        minWidth: 0,
                        marginTop: 2,
                        flexWrap: 'nowrap',
                        overflow: 'hidden',
                      }}>
                      {/* Country / Language Selector Pill */}
                      <TouchableScale
                        onPress={() => {
                          triggerNativeHaptic('light');
                          setShowLanguageModal(true);
                        }}
                        hitSlop={6}
                        accessible={true}
                        accessibilityRole="button"
                        accessibilityLabel={t('settings.general.selectLanguage', 'Select Language')}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          backgroundColor: `${AppColors.white}24`,
                          borderRadius: 5,
                          paddingHorizontal: 5,
                          paddingVertical: 1.5,
                          gap: 3,
                          borderWidth: 1,
                          borderColor: `${AppColors.white}38`,
                          flexShrink: 0,
                        }}>
                        <CountryFlag code={currentLang?.code || 'en'} size={9} borderRadius={2} />
                        <Text
                          style={{
                            fontFamily: AppFonts.interBold,
                            fontSize: 8,
                            lineHeight: 10.5,
                            color: AppColors.white,
                            letterSpacing: 0.2,
                          }}
                          numberOfLines={1}>
                          {currentLang?.code?.toUpperCase() || 'EN'}
                        </Text>
                        <ChevronDownIcon size={6} color={`${AppColors.white}CC`} />
                      </TouchableScale>

                      {/* Host OS & Version */}
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          backgroundColor: `${AppColors.white}1F`,
                          borderRadius: 5,
                          paddingHorizontal: 5,
                          paddingVertical: 1.5,
                          gap: 3,
                          borderWidth: 1,
                          borderColor: `${AppColors.white}2E`,
                          flexShrink: 1,
                          minWidth: 0,
                        }}>
                        {Platform.OS === 'ios' ? (
                          <AppleIcon
                            color={`${AppColors.white}E6`}
                            size={8.5}
                          />
                        ) : (
                          <AndroidIcon
                            color={`${AppColors.white}E6`}
                            size={8.5}
                          />
                        )}
                        <Text
                          style={{
                            fontFamily: AppFonts.interMedium,
                            fontSize: 8,
                            lineHeight: 10.5,
                            color: `${AppColors.white}EB`,
                            letterSpacing: 0.1,
                          }}
                          numberOfLines={1}
                          ellipsizeMode="tail">
                          {appVersionString}
                        </Text>
                      </View>

                      {/* NPM Package Version */}
                      <Pressable
                        onPress={() => {
                          Linking.openURL(
                            'https://www.npmjs.com/package/react-native-inapp-inspector',
                          ).catch(() => {});
                        }}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          backgroundColor: `${AppColors.white}1F`,
                          borderRadius: 5,
                          paddingHorizontal: 5.5,
                          paddingVertical: 1.5,
                          gap: 3,
                          borderWidth: 1,
                          borderColor: `${AppColors.white}2E`,
                          flexShrink: 0,
                        }}>
                        <NpmIcon
                          size={8.5}
                          color={AppColors.npmRedLight}
                        />
                        <Text
                          style={{
                            fontFamily: AppFonts.interMedium,
                            fontSize: 8,
                            lineHeight: 10.5,
                            color: `${AppColors.white}EB`,
                            letterSpacing: 0.1,
                          }}>
                          v{LIB_VERSION}
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                </View>
              ) : null}
            </View>

            {isDetailView && (
              <View
                style={[
                  styles.headerCenter,
                  {
                    flex: 1,
                    minWidth: 0,
                    flexShrink: 1,
                    paddingHorizontal: isNarrow ? 3 : 6,
                    overflow: 'hidden',
                  },
                ]}>
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
                            paddingHorizontal: isNarrow ? 5 : 6,
                            paddingVertical: isNarrow ? 2 : 3,
                            flexShrink: 0,
                          },
                        ]}>
                        <Text
                          style={[
                            styles.headerMethodText,
                            {fontSize: isNarrow ? 9 : 10},
                          ]}>
                          {selected.method}
                        </Text>
                      </View>
                      <Text
                        style={[
                          styles.headerDetailTitle,
                          {
                            fontSize: isNarrow ? 13 : 14.5,
                            flex: 1,
                            minWidth: 0,
                            flexShrink: 1,
                          },
                        ]}
                        numberOfLines={1}
                        ellipsizeMode="middle">
                        {detailTitle}
                      </Text>
                    </View>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: isNarrow ? 4 : 6,
                        marginTop: 3,
                        paddingVertical: 1,
                      }}>
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 4,
                          paddingHorizontal: isNarrow ? 6 : 8,
                          paddingVertical: 2.5,
                          borderRadius: 20,
                          backgroundColor: `${getStatusColor(
                            selected.status,
                          )}26`,
                          borderWidth: 1,
                          borderColor: `${getStatusColor(selected.status)}55`,
                        }}>
                        <View
                          style={[
                            styles.headerStatusDot,
                            {
                              backgroundColor: getStatusColor(selected.status),
                              width: isNarrow ? 6 : 7,
                              height: isNarrow ? 6 : 7,
                            },
                          ]}
                        />
                        <Text
                          style={[
                            styles.headerSubTitle,
                            {
                              fontFamily: AppFonts.interBold,
                              fontSize: isNarrow ? 10 : 11,
                            },
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
                          paddingHorizontal: isNarrow ? 6 : 8,
                          paddingVertical: 2.5,
                          borderRadius: 20,
                          backgroundColor: `${AppColors.white}29`,
                        }}>
                        <ClockIcon
                          color={AppColors.white}
                          size={isNarrow ? 10 : 11}
                        />
                        <Text
                          style={[
                            styles.headerSubTitle,
                            {fontSize: isNarrow ? 10 : 11},
                          ]}>
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
                            paddingHorizontal: isNarrow ? 6 : 8,
                            paddingVertical: 2.5,
                            borderRadius: 20,
                            backgroundColor: `${AppColors.white}29`,
                          }}>
                          <SizeIcon
                            color={AppColors.white}
                            size={isNarrow ? 10 : 11}
                          />
                          <Text
                            style={[
                              styles.headerSubTitle,
                              {fontSize: isNarrow ? 10 : 11},
                            ]}>
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
                            paddingHorizontal: isNarrow ? 5 : 6,
                            paddingVertical: isNarrow ? 2 : 3,
                            flexShrink: 0,
                          },
                        ]}>
                        <Text
                          style={[
                            styles.headerMethodText,
                            {fontSize: isNarrow ? 9 : 10},
                          ]}>
                          {selectedEvent.source === 'firebase' ? 'FB' : 'MAN'}
                        </Text>
                      </View>
                      <Text
                        style={[
                          styles.headerDetailTitle,
                          {
                            fontSize: isNarrow ? 13 : 14.5,
                            flex: 1,
                            minWidth: 0,
                            flexShrink: 1,
                          },
                        ]}
                        numberOfLines={1}
                        ellipsizeMode="middle">
                        #{selectedEvent.id != null ? selectedEvent.id + 1 : 1}{' '}
                        {selectedEvent.name}
                      </Text>
                    </View>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: isNarrow ? 4 : 6,
                        marginTop: 3,
                        paddingVertical: 1,
                      }}>
                      <View
                        style={[
                          styles.headerStatusDot,
                          {
                            backgroundColor:
                              selectedEvent.source === 'firebase'
                                ? AppColors.firebaseOrange
                                : AppColors.purple,
                            width: isNarrow ? 6 : 7,
                            height: isNarrow ? 6 : 7,
                          },
                        ]}
                      />
                      <Text
                        style={[
                          styles.headerSubTitle,
                          {fontSize: isNarrow ? 10 : 11},
                        ]}>
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
                            paddingHorizontal: isNarrow ? 5 : 6,
                            paddingVertical: isNarrow ? 2 : 3,
                            flexShrink: 0,
                          },
                        ]}>
                        <Text
                          style={[
                            styles.headerMethodText,
                            {fontSize: isNarrow ? 9 : 10},
                          ]}>
                          {selectedLog.type.toUpperCase()}
                        </Text>
                      </View>
                      <Text
                        style={[
                          styles.headerDetailTitle,
                          {
                            fontSize: isNarrow ? 13 : 14.5,
                            flex: 1,
                            minWidth: 0,
                            flexShrink: 1,
                          },
                        ]}
                        numberOfLines={1}
                        ellipsizeMode="middle">
                        #{selectedLog.id != null ? selectedLog.id + 1 : 1}{' '}
                        console.
                        {selectedLog.sourceMethod || selectedLog.type || 'log'}
                      </Text>
                    </View>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: isNarrow ? 4 : 6,
                        marginTop: 3,
                        paddingVertical: 1,
                      }}>
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 4,
                          paddingHorizontal: isNarrow ? 6 : 8,
                          paddingVertical: 2.5,
                          borderRadius: 20,
                          backgroundColor: `${AppColors.white}29`,
                        }}>
                        <ClockIcon
                          color={AppColors.white}
                          size={isNarrow ? 10 : 11}
                        />
                        <Text
                          style={[
                            styles.headerSubTitle,
                            {fontSize: isNarrow ? 10 : 11},
                          ]}>
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
                                paddingHorizontal: isNarrow ? 5 : 6,
                                paddingVertical: isNarrow ? 2 : 3,
                                flexShrink: 0,
                              },
                            ]}>
                            <Text
                              style={[
                                styles.headerMethodText,
                                {fontSize: isNarrow ? 9 : 10},
                              ]}>
                              SLICE
                            </Text>
                          </View>
                          <Text
                            style={[
                              styles.headerDetailTitle,
                              {
                                fontSize: isNarrow ? 13 : 14.5,
                                flex: 1,
                                minWidth: 0,
                                flexShrink: 1,
                              },
                            ]}
                            numberOfLines={1}
                            ellipsizeMode="middle">
                            {selectedReduxSlice}
                          </Text>
                        </View>
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: isNarrow ? 4 : 6,
                            marginTop: 3,
                            paddingVertical: 1,
                          }}>
                          <View
                            style={[
                              styles.headerStatusDot,
                              {
                                backgroundColor: AppColors.liveGreen,
                                width: isNarrow ? 6 : 7,
                                height: isNarrow ? 6 : 7,
                              },
                            ]}
                          />
                          <Text
                            style={[
                              styles.headerSubTitle,
                              {fontSize: isNarrow ? 10 : 11},
                            ]}>
                            Live
                          </Text>
                          <Text
                            style={[
                              styles.headerSubTitle,
                              {opacity: 0.6, fontSize: isNarrow ? 10 : 11},
                            ]}>
                            •
                          </Text>
                          <Text
                            style={[
                              styles.headerSubTitle,
                              {fontSize: isNarrow ? 10 : 11},
                            ]}>
                            {keyCount} keys
                          </Text>
                          <Text
                            style={[
                              styles.headerSubTitle,
                              {opacity: 0.6, fontSize: isNarrow ? 10 : 11},
                            ]}>
                            •
                          </Text>
                          <Text
                            style={[
                              styles.headerSubTitle,
                              {fontSize: isNarrow ? 10 : 11},
                            ]}>
                            {sliceSize}
                          </Text>
                          {lastAction?.timestamp && (
                            <>
                              <Text
                                style={[
                                  styles.headerSubTitle,
                                  {opacity: 0.6, fontSize: isNarrow ? 10 : 11},
                                ]}>
                                •
                              </Text>
                              <View
                                style={{
                                  flexDirection: 'row',
                                  alignItems: 'center',
                                  gap: 3,
                                }}>
                                <ClockIcon
                                  color={AppColors.white}
                                  size={isNarrow ? 9 : 10}
                                />
                                <Text
                                  style={[
                                    styles.headerSubTitle,
                                    {fontSize: isNarrow ? 10 : 11},
                                  ]}>
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
                            paddingHorizontal: isNarrow ? 5 : 6,
                            paddingVertical: isNarrow ? 2 : 3,
                            flexShrink: 0,
                          },
                        ]}>
                        <Text
                          style={[
                            styles.headerMethodText,
                            {fontSize: isNarrow ? 9 : 10},
                          ]}>
                          ACTION
                        </Text>
                      </View>
                      <Text
                        style={[
                          styles.headerDetailTitle,
                          {
                            fontSize: isNarrow ? 13 : 14.5,
                            flex: 1,
                            minWidth: 0,
                            flexShrink: 1,
                          },
                        ]}
                        numberOfLines={1}
                        ellipsizeMode="middle">
                        {selectedReduxAction.type}
                      </Text>
                    </View>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: isNarrow ? 4 : 6,
                        marginTop: 3,
                        paddingVertical: 1,
                      }}>
                      <View
                        style={[
                          styles.headerStatusDot,
                          {
                            backgroundColor: AppColors.purple,
                            width: isNarrow ? 6 : 7,
                            height: isNarrow ? 6 : 7,
                          },
                        ]}
                      />
                      <Text
                        style={[
                          styles.headerSubTitle,
                          {fontSize: isNarrow ? 10 : 11},
                        ]}>
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
                            paddingHorizontal: isNarrow ? 5 : 6,
                            paddingVertical: isNarrow ? 2 : 3,
                            flexShrink: 0,
                          },
                        ]}>
                        <Text
                          style={[
                            styles.headerMethodText,
                            {fontSize: isNarrow ? 9 : 10},
                          ]}>
                          {selectedCrash.isFatal
                            ? 'FATAL'
                            : selectedCrash.type.toUpperCase()}
                        </Text>
                      </View>
                      <Text
                        style={[
                          styles.headerDetailTitle,
                          {
                            fontSize: isNarrow ? 13 : 14.5,
                            flex: 1,
                            minWidth: 0,
                            flexShrink: 1,
                          },
                        ]}
                        numberOfLines={1}
                        ellipsizeMode="middle">
                        {selectedCrash.name || selectedCrash.message}
                      </Text>
                    </View>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: isNarrow ? 4 : 6,
                        marginTop: 3,
                        paddingVertical: 1,
                      }}>
                      <View
                        style={[
                          styles.headerStatusDot,
                          {
                            backgroundColor: selectedCrash.isFatal
                              ? AppColors.red600
                              : AppColors.amber500,
                            width: isNarrow ? 6 : 7,
                            height: isNarrow ? 6 : 7,
                          },
                        ]}
                      />
                      <Text
                        style={[
                          styles.headerSubTitle,
                          {fontSize: isNarrow ? 10 : 11},
                        ]}>
                        {selectedCrash.timeStr ||
                          new Date(
                            selectedCrash.timestamp,
                          ).toLocaleTimeString()}
                      </Text>
                      {selectedCrash.deviceInfo?.platform && (
                        <>
                          <Text
                            style={[
                              styles.headerSubTitle,
                              {opacity: 0.6, fontSize: isNarrow ? 10 : 11},
                            ]}>
                            •
                          </Text>
                          <Text
                            style={[
                              styles.headerSubTitle,
                              {fontSize: isNarrow ? 10 : 11},
                            ]}>
                            {selectedCrash.deviceInfo.platform.toUpperCase()}
                          </Text>
                        </>
                      )}
                    </View>
                  </View>
                ) : activeTab === 'push' && selectedPush != null ? (
                  <View style={styles.headerDetailCenter}>
                    <View style={styles.headerDetailRow}>
                      <View
                        style={[
                          styles.headerMethodBadge,
                          {
                            backgroundColor: AppColors.brandPurple,
                            paddingHorizontal: isNarrow ? 5 : 6,
                            paddingVertical: isNarrow ? 2 : 3,
                            flexShrink: 0,
                          },
                        ]}>
                        <Text
                          style={[
                            styles.headerMethodText,
                            {fontSize: isNarrow ? 9 : 10},
                          ]}>
                          {(selectedPush.source || 'PUSH').toUpperCase()}
                        </Text>
                      </View>
                      <Text
                        style={[
                          styles.headerDetailTitle,
                          {
                            fontSize: isNarrow ? 13 : 14.5,
                            flex: 1,
                            minWidth: 0,
                            flexShrink: 1,
                          },
                        ]}
                        numberOfLines={1}
                        ellipsizeMode="tail">
                        {selectedPush.title ||
                          selectedPush.body ||
                          'Push Notification'}
                      </Text>
                    </View>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: isNarrow ? 4 : 6,
                        marginTop: 3,
                        paddingVertical: 1,
                        maxWidth: '100%',
                      }}>
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 4,
                          paddingHorizontal: isNarrow ? 6 : 8,
                          paddingVertical: 2,
                          borderRadius: 20,
                          backgroundColor: `${
                            selectedPush.appState === 'foreground'
                              ? AppColors.greenColor
                              : selectedPush.appState === 'background'
                              ? AppColors.amber500
                              : AppColors.brandPurple
                          }26`,
                          borderWidth: 1,
                          borderColor: `${
                            selectedPush.appState === 'foreground'
                              ? AppColors.greenColor
                              : selectedPush.appState === 'background'
                              ? AppColors.amber500
                              : AppColors.brandPurple
                          }55`,
                        }}>
                        <View
                          style={[
                            styles.headerStatusDot,
                            {
                              backgroundColor:
                                selectedPush.appState === 'foreground'
                                  ? AppColors.greenColor
                                  : selectedPush.appState === 'background'
                                  ? AppColors.amber500
                                  : AppColors.brandPurple,
                              width: isNarrow ? 6 : 7,
                              height: isNarrow ? 6 : 7,
                            },
                          ]}
                        />
                        <Text
                          style={[
                            styles.headerSubTitle,
                            {
                              fontFamily: AppFonts.interBold,
                              fontSize: isNarrow ? 9.5 : 10.5,
                            },
                          ]}>
                          {selectedPush.appState
                            ? selectedPush.appState.toUpperCase()
                            : 'DELIVERED'}
                        </Text>
                      </View>
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 4,
                          paddingHorizontal: isNarrow ? 6 : 8,
                          paddingVertical: 2,
                          borderRadius: 20,
                          backgroundColor: `${AppColors.white}29`,
                        }}>
                        <ClockIcon
                          color={AppColors.white}
                          size={isNarrow ? 9.5 : 10.5}
                        />
                        <Text
                          style={[
                            styles.headerSubTitle,
                            {fontSize: isNarrow ? 9.5 : 10.5},
                          ]}>
                          {formatTimeShort(selectedPush.timestamp)}
                        </Text>
                      </View>
                    </View>
                  </View>
                ) : activeTab === 'socket' && selectedSocket != null ? (
                  <View style={styles.headerDetailCenter}>
                    <View style={styles.headerDetailRow}>
                      <View
                        style={[
                          styles.headerMethodBadge,
                          {
                            backgroundColor:
                              selectedSocket.client === 'socket.io' ||
                              selectedSocket.url.includes('/socket.io')
                                ? AppColors.violet600
                                : selectedSocket.url.startsWith('wss://')
                                ? AppColors.emerald600
                                : AppColors.blue600,
                            paddingHorizontal: isNarrow ? 5 : 6,
                            paddingVertical: isNarrow ? 2 : 3,
                            flexShrink: 0,
                          },
                        ]}>
                        <Text
                          style={[
                            styles.headerMethodText,
                            {fontSize: isNarrow ? 9 : 10},
                          ]}>
                          {selectedSocket.client === 'socket.io' ||
                          selectedSocket.url.includes('/socket.io')
                            ? 'SIO'
                            : selectedSocket.url.startsWith('wss://')
                            ? 'WSS'
                            : 'WS'}
                        </Text>
                      </View>
                      <Text
                        style={[
                          styles.headerDetailTitle,
                          {
                            fontSize: isNarrow ? 13 : 14.5,
                            flex: 1,
                            minWidth: 0,
                            flexShrink: 1,
                          },
                        ]}
                        numberOfLines={1}
                        ellipsizeMode="middle">
                        {selectedSocket.url}
                      </Text>
                    </View>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: isNarrow ? 4 : 6,
                        marginTop: 3,
                        paddingVertical: 1,
                      }}>
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 4,
                          paddingHorizontal: isNarrow ? 6 : 8,
                          paddingVertical: 2.5,
                          borderRadius: 20,
                          backgroundColor: `${
                            selectedSocket.status === 'open'
                              ? AppColors.greenColor
                              : selectedSocket.status === 'connecting'
                              ? AppColors.amber600
                              : selectedSocket.status === 'error'
                              ? AppColors.errorColor
                              : AppColors.slate500
                          }26`,
                          borderWidth: 1,
                          borderColor: `${
                            selectedSocket.status === 'open'
                              ? AppColors.greenColor
                              : selectedSocket.status === 'connecting'
                              ? AppColors.amber600
                              : selectedSocket.status === 'error'
                              ? AppColors.errorColor
                              : AppColors.slate500
                          }55`,
                        }}>
                        <View
                          style={[
                            styles.headerStatusDot,
                            {
                              backgroundColor:
                                selectedSocket.status === 'open'
                                  ? AppColors.greenColor
                                  : selectedSocket.status === 'connecting'
                                  ? AppColors.amber600
                                  : selectedSocket.status === 'error'
                                  ? AppColors.errorColor
                                  : AppColors.slate500,
                              width: isNarrow ? 6 : 7,
                              height: isNarrow ? 6 : 7,
                            },
                          ]}
                        />
                        <Text
                          style={[
                            styles.headerSubTitle,
                            {
                              fontFamily: AppFonts.interBold,
                              fontSize: isNarrow ? 10 : 11,
                            },
                          ]}>
                          {(selectedSocket.status || 'open').toUpperCase()}
                        </Text>
                      </View>
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 4,
                          paddingHorizontal: isNarrow ? 6 : 8,
                          paddingVertical: 2.5,
                          borderRadius: 20,
                          backgroundColor: `${AppColors.white}29`,
                        }}>
                        <ClockIcon
                          color={AppColors.white}
                          size={isNarrow ? 10 : 11}
                        />
                        <Text
                          style={[
                            styles.headerSubTitle,
                            {fontSize: isNarrow ? 10 : 11},
                          ]}>
                          {selectedSocket.duration != null
                            ? `${selectedSocket.duration}ms`
                            : formatTimeShort(selectedSocket.startTime)}
                        </Text>
                      </View>
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 4,
                          paddingHorizontal: isNarrow ? 6 : 8,
                          paddingVertical: 2.5,
                          borderRadius: 20,
                          backgroundColor: `${AppColors.white}29`,
                        }}>
                        <SizeIcon
                          color={AppColors.white}
                          size={isNarrow ? 10 : 11}
                        />
                        <Text
                          style={[
                            styles.headerSubTitle,
                            {fontSize: isNarrow ? 10 : 11},
                          ]}>
                          {selectedSocket.frames?.length || 0} frames · {formatByteSize(
                            (selectedSocket.totalBytesSent || 0) +
                              (selectedSocket.totalBytesReceived || 0),
                          )}
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
                {
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  flexShrink: 0,
                  marginLeft: 6,
                  gap: isNarrow ? 3.5 : 4.5,
                },
              ]}>
              {/* Settings / Reset & About buttons */}
              {isSettingsView ? (
                <>
                  {/* About / Specs button */}
                  <TouchableScale
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityLabel={t('about.heroTitle', 'About & Specs')}
                    onPress={() => {
                      triggerNativeHaptic('light');
                      setIsAboutOpen(true);
                    }}
                    hitSlop={15}
                    style={[
                      styles.closeButtonSquare,
                      {
                        width: buttonSize,
                        height: buttonSize,
                        borderRadius: isNarrow ? 6 : 7,
                        backgroundColor: 'rgba(255, 255, 255, 0.22)',
                        borderColor: 'rgba(255, 255, 255, 0.45)',
                        borderWidth: 1,
                      },
                    ]}>
                    <InfoCircleIcon
                      color={AppColors.white}
                      size={isNarrow ? 13 : 15}
                    />
                  </TouchableScale>

                  {/* Reset All Settings button */}
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
                    style={[
                      styles.closeButtonSquare,
                      {
                        width: buttonSize,
                        height: buttonSize,
                        borderRadius: isNarrow ? 6 : 7,
                        backgroundColor: 'rgba(245, 158, 11, 0.26)',
                        borderColor: 'rgba(252, 211, 77, 0.45)',
                        borderWidth: 1,
                      },
                    ]}>
                    <ResetIcon
                      color={AppColors.white}
                      size={isNarrow ? 12 : 14}
                    />
                  </TouchableScale>
                </>
              ) : !isAnySelected ? (
                <>
                  {/* Peek-through (Eye) toggle button */}
                  <TouchableScale
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityLabel={peekMode ? 'Disable peek-through' : 'Enable peek-through'}
                    onPress={() => {
                      triggerNativeHaptic('light');
                      setPeekMode(prev => !prev);
                    }}
                    hitSlop={15}
                    style={[
                      styles.closeButtonSquare,
                      {
                        width: buttonSize,
                        height: buttonSize,
                        borderRadius: isNarrow ? 6 : 7,
                        backgroundColor: peekMode
                          ? 'rgba(6, 182, 212, 0.38)'
                          : 'rgba(6, 182, 212, 0.18)',
                        borderColor: peekMode
                          ? 'rgba(103, 232, 249, 0.65)'
                          : 'rgba(103, 232, 249, 0.35)',
                        borderWidth: 1,
                      },
                    ]}>
                    <EyeIcon
                      color={AppColors.white}
                      size={isNarrow ? 12 : 14}
                    />
                  </TouchableScale>

                  {/* Settings button */}
                  <TouchableScale
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityLabel="Settings"
                    onPress={() => setSettingsPage('main')}
                    hitSlop={15}
                    style={[
                      styles.closeButtonSquare,
                      {
                        width: buttonSize,
                        height: buttonSize,
                        borderRadius: isNarrow ? 6 : 7,
                        backgroundColor: 'rgba(168, 85, 247, 0.28)',
                        borderColor: 'rgba(216, 180, 254, 0.45)',
                        borderWidth: 1,
                      },
                    ]}>
                    <SettingsIcon
                      color={AppColors.white}
                      size={isNarrow ? 12 : 14}
                    />
                  </TouchableScale>
                </>
              ) : null}

              {/* Minimize button */}
              <TouchableOpacity
                testID="inspector.header.minimizeBtn"
                onPress={minimizeInspector || closeModal}
                hitSlop={{top: 12, bottom: 12, left: 12, right: 12}}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={t('common.minimize', 'Minimize')}
                style={[
                  styles.closeButtonSquare,
                  {
                    width: buttonSize,
                    height: buttonSize,
                    borderRadius: isNarrow ? 6 : 7,
                    backgroundColor: 'rgba(56, 189, 248, 0.22)',
                    borderColor: 'rgba(125, 211, 252, 0.40)',
                    borderWidth: 1,
                  },
                ]}>
                <ChevronDownIcon size={isNarrow ? 14 : 16} color={AppColors.white} />
              </TouchableOpacity>

              {/* Close button */}
              <TouchableOpacity
                testID="inspector.header.closeBtn"
                onPress={closeModal}
                hitSlop={{top: 12, bottom: 12, left: 12, right: 12}}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={t('common.close', 'Close')}
                style={[
                  styles.closeButtonSquare,
                  {
                    width: buttonSize,
                    height: buttonSize,
                    borderRadius: isNarrow ? 6 : 7,
                    backgroundColor: 'rgba(244, 63, 94, 0.28)',
                    borderColor: 'rgba(251, 113, 133, 0.48)',
                    borderWidth: 1,
                  },
                ]}>
                <CloseWhite size={isNarrow ? 12 : 14} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      {/* Country / Language Selector Bottom Sheet Modal */}
      <LanguageSelectorModal
        visible={showLanguageModal}
        onClose={() => setShowLanguageModal(false)}
      />

      {/* Instant Media Preview Modal for Screenshots and Video Recordings */}
      <MediaPreviewModal
        item={previewMediaItem}
        visible={!!previewMediaItem}
        onClose={() => setPreviewMediaItem(null)}
        onDelete={async item => {
          await ScreenCapture.deleteMedia(item.uri);
          refreshMediaCount?.().catch(() => {});
          setPreviewMediaItem(null);
        }}
        onConvertToGif={async item => {
          const gif = await ScreenCapture.convertToGif(item.uri, {
            fps: 12,
            width: 480,
          });
          if (gif) {
            refreshMediaCount?.().catch(() => {});
            const captureId = generateCaptureId('anim', 'gif');
            setPreviewMediaItem({
              id: captureId,
              type: 'gif',
              format: 'gif',
              uri: gif.uri,
              filename: gif.uri.split('/').pop() || captureId,
              sizeBytes: gif.sizeBytes,
              timestamp: gif.timestamp,
              durationMs: gif.durationMs,
            });
          }
        }}
      />
    </>
  );
});

export default InspectorHeader;
