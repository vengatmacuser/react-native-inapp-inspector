import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  Animated,
  PanResponder,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useInspector} from './InspectorContext';
import TouchableScale from '../TouchableScale';
import AppHeaderLogo from '../AppHeaderLogo';
import BrandCircleIcon from '../BrandCircleIcon';
import {
  AndroidIcon,
  AppleIcon,
  CameraIcon,
  NpmIcon,
  VideoCameraIcon,
} from '../NetworkIcons';
import {CapturedMediaItem, ScreenCapture} from '../../capture';
import {triggerNativeHaptic} from '../../native/NativeInspector';
import {showToast} from '../../helpers/toast';
import {getAppName, getAppVersionAndBuild} from '../../helpers';
import {LIB_VERSION} from '../../constants';
import {AppColors} from '../../styles/AppColors';
import {AppFonts} from '../../styles/AppFonts';
import styles from '../../styles';
import {useTranslation} from '../../i18n';
import {MediaPreviewModal} from './MediaPreviewModal';

const FabLauncher = () => {
  const {
    setVisible,
    isMinimized,
    setIsMinimized,
    appIcon,
    fabPan,
    fabPanResponder,
    fabDraggedRef,
    pulseAnim,
    fabShineAnim,
    unreadPulseAnim,
    logs,
    analyticsEvents,
    refreshMediaCount,
  } = useInspector();
  const {width: screenWidth} = useWindowDimensions();
  const {t} = useTranslation();

  const [appVersionString] = useState<string>(() => {
    return getAppVersionAndBuild().formatted;
  });

  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [previewMediaItem, setPreviewMediaItem] =
    useState<CapturedMediaItem | null>(null);

  // Draggable pan responder for the minimized floating player bar
  const playerPan = useRef(new Animated.ValueXY({x: 0, y: 0})).current;
  const playerPanRef = useRef({x: 0, y: 0});
  useEffect(() => {
    const idX = playerPan.x.addListener(v => (playerPanRef.current.x = v.value));
    const idY = playerPan.y.addListener(v => (playerPanRef.current.y = v.value));
    return () => {
      playerPan.x.removeListener(idX);
      playerPan.y.removeListener(idY);
    };
  }, [playerPan]);
  const playerDraggedRef = useRef(false);
  const playerPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_e, g) =>
        Math.abs(g.dx) > 4 || Math.abs(g.dy) > 4,
      onPanResponderGrant: () => {
        playerDraggedRef.current = true;
        playerPan.setOffset({
          x: playerPanRef.current.x,
          y: playerPanRef.current.y,
        });
        playerPan.setValue({x: 0, y: 0});
      },
      onPanResponderMove: Animated.event(
        [null, {dx: playerPan.x, dy: playerPan.y}],
        {useNativeDriver: false},
      ),
      onPanResponderRelease: () => {
        playerPan.flattenOffset();
        setTimeout(() => {
          playerDraggedRef.current = false;
        }, 50);
      },
      onPanResponderTerminate: () => {
        playerPan.flattenOffset();
        playerDraggedRef.current = false;
      },
    }),
  ).current;

  // Sync initial recording state
  useEffect(() => {
    ScreenCapture.isRecording()
      .then(active => {
        setIsRecording(Boolean(active));
      })
      .catch(() => {});
  }, []);

  // Timer tick for video recording
  useEffect(() => {
    if (isRecording) {
      setRecordingSeconds(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds(prev => prev + 1);
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

  const handleTakeScreenshot = useCallback(async () => {
    if (playerDraggedRef.current) return;
    try {
      triggerNativeHaptic('light');
      const result = await ScreenCapture.takeScreenshot({
        format: 'png',
        quality: 0.9,
        hideInspector: true,
      });
      if (result) {
        triggerNativeHaptic('success');
        const newItem: CapturedMediaItem = {
          id: `screenshot_${result.timestamp}.png`,
          type: 'image',
          format: result.format,
          uri: result.uri,
          filename:
            result.uri.split('/').pop() || `screenshot_${result.timestamp}.png`,
          sizeBytes: result.sizeBytes,
          timestamp: result.timestamp,
          width: result.width,
          height: result.height,
        };
        setPreviewMediaItem(newItem);
        refreshMediaCount?.().catch(() => {});
        showToast(t('header.screenshotCaptured', 'Screenshot captured'));
      } else {
        showToast(t('header.screenshotFailed', 'Failed to capture screenshot'));
      }
    } catch {
      showToast(t('header.screenshotError', 'Error capturing screenshot'));
    }
  }, [refreshMediaCount, t]);

  const handleToggleVideoRecording = useCallback(async () => {
    if (playerDraggedRef.current) return;
    try {
      if (isRecording) {
        triggerNativeHaptic('medium');
        const result = await ScreenCapture.stopRecording();
        setIsRecording(false);
        if (result) {
          triggerNativeHaptic('success');
          const newItem: CapturedMediaItem = {
            id: `video_${result.timestamp}.${result.format}`,
            type: result.format === 'gif' ? 'gif' : 'video',
            format: result.format,
            uri: result.uri,
            filename:
              result.uri.split('/').pop() ||
              `video_${result.timestamp}.${result.format}`,
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
              defaultValue: `Recording saved (${(result.durationMs / 1000).toFixed(1)}s)`,
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
          showToast(t('header.recordingStarted', 'Recording started'));
        } else {
          showToast(t('header.recordingStartFailed', 'Failed to start recording'));
        }
      }
    } catch {
      showToast(t('header.recordingError', 'Error during screen recording'));
      setIsRecording(false);
    }
  }, [isRecording, refreshMediaCount, t]);

  const handleExpandInspector = useCallback(() => {
    if (playerDraggedRef.current) return;
    triggerNativeHaptic('light');
    setIsMinimized?.(false);
    setVisible(true);
  }, [setIsMinimized, setVisible]);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins}:${remainingSecs < 10 ? '0' : ''}${remainingSecs}`;
  };

  return (
    <>
      {/* ─── Case 1: Minimized Music Player-Style Bottom Bar (Draggable) ─── */}
      {isMinimized ? (
        <Animated.View
          style={[
            fabStyles.playerContainer,
            {transform: playerPan.getTranslateTransform()},
          ]}
          {...playerPanResponder.panHandlers}>
          {/* Header-matched Gradient Background */}
          <LinearGradient
            colors={[AppColors.indigo600, AppColors.violet600]}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            style={fabStyles.gradientBg}
            pointerEvents="none"
          />

          {/* Enhanced Shining sweep streak across the player bar */}
          <View pointerEvents="none" style={fabStyles.playerShineClip}>
            <Animated.View
              style={[
                fabStyles.playerShineStreak,
                {
                  transform: [
                    {
                      translateX: fabShineAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-80, screenWidth + 80],
                      }),
                    },
                    {rotate: '28deg'},
                  ],
                },
              ]}>
              <LinearGradient
                colors={[
                  'rgba(255, 255, 255, 0)',
                  'rgba(255, 255, 255, 0.18)',
                  'rgba(255, 255, 255, 0.70)',
                  'rgba(255, 255, 255, 1)',
                  'rgba(255, 255, 255, 0.70)',
                  'rgba(255, 255, 255, 0.18)',
                  'rgba(255, 255, 255, 0)',
                ]}
                locations={[0, 0.22, 0.44, 0.5, 0.56, 0.78, 1]}
                start={{x: 0, y: 0.5}}
                end={{x: 1, y: 0.5}}
                style={{flex: 1}}
              />
            </Animated.View>
          </View>

          {/* App Logo & Expand Info (Music Player Left Section) */}
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={handleExpandInspector}
            style={fabStyles.brandSection}
            accessibilityRole="button"
            accessibilityLabel={t('mediaGallery.expand', 'Expand Inspector')}>
            <AppHeaderLogo size={36} customIcon={appIcon} />
            <View style={fabStyles.titleWrapper}>
              <Text style={fabStyles.appTitle} numberOfLines={1}>
                {getAppName()}
              </Text>
              <View style={fabStyles.versionRow}>
                {/* OS Version Chip */}
                <View style={fabStyles.versionChip}>
                  {Platform.OS === 'ios' ? (
                    <AppleIcon
                      color={`${AppColors.white}E6`}
                      size={9}
                    />
                  ) : (
                    <AndroidIcon
                      color={`${AppColors.white}E6`}
                      size={9}
                    />
                  )}
                  <Text style={fabStyles.versionChipText} numberOfLines={1}>
                    {appVersionString}
                  </Text>
                </View>

                {/* NPM Version Chip */}
                <View style={fabStyles.versionChip}>
                  <NpmIcon size={9} color={AppColors.npmRedLight} />
                  <Text style={fabStyles.versionChipText} numberOfLines={1}>
                    v{LIB_VERSION}
                  </Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>

          {/* Action Buttons: Photo & Record (Matching Header Toolbar Style) */}
          <View style={fabStyles.actionsRow}>
            {/* Photo Action */}
            <TouchableScale
              onPress={handleTakeScreenshot}
              hitSlop={{top: 6, bottom: 6, left: 6, right: 6}}
              style={fabStyles.actionBtn}>
              <CameraIcon size={13} color={AppColors.white} />
              <Text style={fabStyles.actionText}>
                {t('header.photo', 'Photo')}
              </Text>
            </TouchableScale>

            {/* Record Action */}
            <TouchableScale
              onPress={handleToggleVideoRecording}
              hitSlop={{top: 6, bottom: 6, left: 6, right: 6}}
              style={[
                fabStyles.actionBtn,
                isRecording && fabStyles.recordingBtnActive,
              ]}>
              {isRecording ? (
                <View style={fabStyles.recordingDot} />
              ) : (
                <VideoCameraIcon size={13} color={AppColors.white} />
              )}
              <Text
                style={[
                  fabStyles.actionText,
                  isRecording && {color: AppColors.red300},
                ]}>
                {isRecording
                  ? `${t('header.rec', 'REC')} ${formatTime(recordingSeconds)}`
                  : t('header.record', 'Record')}
              </Text>
            </TouchableScale>
          </View>
        </Animated.View>
      ) : (
        /* ─── Case 2: Full Original Circular Draggable FAB Icon (when Inspector is closed) ── */
        <Animated.View
          style={[styles.fabWrapper, {transform: fabPan.getTranslateTransform()}]}
          {...fabPanResponder.panHandlers}>
          <TouchableScale
            style={{alignItems: 'center', justifyContent: 'center'}}
            onPress={() => {
              if (fabDraggedRef.current) return;
              triggerNativeHaptic('light');
              setVisible(true);
            }}
            hitSlop={10}>
            <Animated.View
              style={[styles.fabPulseRing, {transform: [{scale: pulseAnim}]}]}
            />
            <BrandCircleIcon size={62} />
            {/* Shining sweep, clipped inside the circular launcher */}
            <View pointerEvents="none" style={styles.fabShineClip}>
              <Animated.View
                style={[
                  styles.fabShineStreak,
                  {
                    transform: [
                      {
                        translateX: fabShineAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [-48, 96],
                        }),
                      },
                      {rotate: '25deg'},
                    ],
                  },
                ]}>
                <LinearGradient
                  colors={[
                    'rgba(255, 255, 255, 0)',
                    'rgba(255, 255, 255, 0.25)',
                    'rgba(255, 255, 255, 0.95)',
                    'rgba(255, 255, 255, 0.25)',
                    'rgba(255, 255, 255, 0)',
                  ]}
                  locations={[0, 0.25, 0.5, 0.75, 1]}
                  start={{x: 0, y: 0.5}}
                  end={{x: 1, y: 0.5}}
                  style={{flex: 1}}
                />
              </Animated.View>
            </View>
            {(logs.length > 0 || analyticsEvents.length > 0) && (
              <Animated.View
                style={[
                  styles.fabGreenDot,
                  {transform: [{scale: unreadPulseAnim}]},
                ]}
              />
            )}
          </TouchableScale>
        </Animated.View>
      )}

      {/* Instant Media Preview Modal for Screenshots and Screen Recordings */}
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
            setPreviewMediaItem({
              id: `anim_${gif.timestamp}.gif`,
              type: 'gif',
              format: 'gif',
              uri: gif.uri,
              filename: gif.uri.split('/').pop() || `anim_${gif.timestamp}.gif`,
              sizeBytes: gif.sizeBytes,
              timestamp: gif.timestamp,
              durationMs: gif.durationMs,
            });
          }
        }}
      />
    </>
  );
};

const fabStyles = StyleSheet.create({
  // ─── Music Player Bar Styles (Matching Header Gradient & Aesthetic) ───
  playerContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 34 : 18,
    left: 12,
    right: 12,
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.28)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    gap: 8,
    zIndex: 99999,
    elevation: 25,
    shadowColor: AppColors.indigo600,
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.45,
    shadowRadius: 14,
    overflow: 'hidden',
  },
  gradientBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 16,
  },
  playerShineClip: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 16,
    overflow: 'hidden',
  },
  playerShineStreak: {
    position: 'absolute',
    top: -60,
    width: 75,
    height: 200,
  },
  brandSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    flex: 1,
    minWidth: 0,
    paddingVertical: 2,
  },
  titleWrapper: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
    gap: 2,
  },
  appTitle: {
    fontFamily: AppFonts.interBold,
    fontSize: 13.5,
    color: AppColors.white,
    letterSpacing: -0.2,
  },
  versionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minWidth: 0,
  },
  versionChip: {
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
  },
  versionChipText: {
    fontFamily: AppFonts.interMedium,
    fontSize: 8.5,
    color: `${AppColors.white}EB`,
    letterSpacing: 0.1,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4.5,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.32)',
  },
  recordingBtnActive: {
    backgroundColor: 'rgba(239, 68, 68, 0.32)',
    borderColor: AppColors.red500,
  },
  recordingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: AppColors.red500,
  },
  actionText: {
    fontFamily: AppFonts.interSemiBold,
    fontSize: 11,
    color: AppColors.white,
  },
});

export default FabLauncher;
