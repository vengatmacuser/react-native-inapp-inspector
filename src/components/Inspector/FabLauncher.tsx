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
import {
  AndroidIcon,
  AppleIcon,
  ScreenshotCaptureIcon,
  ScreenRecordIcon,
  CloseWhite,
  MaximizeIcon,
  NpmIcon,
} from '../NetworkIcons';
import {CapturedMediaItem, ScreenCapture, generateCaptureId} from '../../capture';
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
    dismissInspector,
    appIcon,
    fabPan,
    fabPanResponder,
    fabDraggedRef,
    pulseAnim,
    fabShineAnim,
    refreshMediaCount,
    captureFps,
    captureScale,
    captureBitrate,
    captureMaxDurationSeconds,
    captureAudioMode,
    previewMediaItem,
    setPreviewMediaItem,
  } = useInspector();
  const {width: screenWidth, height: screenHeight} = useWindowDimensions();
  const {t} = useTranslation();

  const [appVersionString] = useState<string>(() => {
    return getAppVersionAndBuild().formatted;
  });

  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // ─── Drag-to-Dismiss Bottom Center Zone State & Animations ───
  const [isDraggingFab, setIsDraggingFab] = useState(false);
  const [isOverDismissZone, setIsOverDismissZone] = useState(false);
  const isOverDismissZoneRef = useRef(false);
  const dismissZoneAnim = useRef(new Animated.Value(0)).current;
  const dismissZoneScale = useRef(new Animated.Value(1)).current;

  // Track absolute offset coordinates of the circular FAB
  const fabPanRef = useRef({x: 0, y: 0});
  useEffect(() => {
    const idX = fabPan.x.addListener(v => (fabPanRef.current.x = v.value));
    const idY = fabPan.y.addListener(v => (fabPanRef.current.y = v.value));
    return () => {
      fabPan.x.removeListener(idX);
      fabPan.y.removeListener(idY);
    };
  }, [fabPan]);

  // Clamp FAB within screen bounds after drag
  const FAB_SIZE = 68;
  const EDGE_PADDING = 8;
  const clampFabPosition = useCallback(() => {
    const currentX = fabPanRef.current.x;
    const currentY = fabPanRef.current.y;

    // Calculate the FAB's absolute position on screen
    // The FAB base position is: right: 20, bottom: 180
    // So its resting center is approximately at (screenWidth - 20 - FAB_SIZE/2, screenHeight - 180 - FAB_SIZE/2)
    const baseRight = 20;
    const baseBottom = 180;
    const absX = screenWidth - baseRight - FAB_SIZE / 2 + currentX;
    const absY = screenHeight - baseBottom - FAB_SIZE / 2 + currentY;

    let clampedX = currentX;
    let clampedY = currentY;
    let needsClamp = false;

    // Clamp horizontally
    if (absX < EDGE_PADDING + FAB_SIZE / 2) {
      clampedX = currentX + (EDGE_PADDING + FAB_SIZE / 2 - absX);
      needsClamp = true;
    } else if (absX > screenWidth - EDGE_PADDING - FAB_SIZE / 2) {
      clampedX = currentX - (absX - (screenWidth - EDGE_PADDING - FAB_SIZE / 2));
      needsClamp = true;
    }

    // Clamp vertically
    const topSafe = Platform.OS === 'ios' ? 60 : 40;
    const bottomSafe = Platform.OS === 'ios' ? 40 : 24;
    if (absY < topSafe + FAB_SIZE / 2) {
      clampedY = currentY + (topSafe + FAB_SIZE / 2 - absY);
      needsClamp = true;
    } else if (absY > screenHeight - bottomSafe - FAB_SIZE / 2) {
      clampedY = currentY - (absY - (screenHeight - bottomSafe - FAB_SIZE / 2));
      needsClamp = true;
    }

    if (needsClamp) {
      Animated.spring(fabPan, {
        toValue: {x: clampedX, y: clampedY},
        useNativeDriver: false,
        tension: 80,
        friction: 8,
      }).start();
    }
  }, [fabPan, screenWidth, screenHeight]);

  // Pan responder for the circular FAB with bottom-center drag-to-dismiss
  const circularPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_e, g) =>
        Math.abs(g.dx) > 4 || Math.abs(g.dy) > 4,
      onPanResponderGrant: () => {
        fabDraggedRef.current = true;
        fabPan.setOffset({
          x: fabPanRef.current.x,
          y: fabPanRef.current.y,
        });
        fabPan.setValue({x: 0, y: 0});
        isOverDismissZoneRef.current = false;
        setIsOverDismissZone(false);
        setIsDraggingFab(true);
        dismissZoneScale.setValue(1);
        Animated.spring(dismissZoneAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 80,
          friction: 8,
        }).start();
      },
      onPanResponderMove: (_e, g) => {
        fabPan.setValue({x: g.dx, y: g.dy});

        // Bottom-center dismiss target threshold
        const touchY = g.moveY;
        const touchX = g.moveX;
        const inBottomZone =
          touchY > screenHeight - 140 &&
          Math.abs(touchX - screenWidth / 2) < 85;

        if (inBottomZone && !isOverDismissZoneRef.current) {
          isOverDismissZoneRef.current = true;
          setIsOverDismissZone(true);
          triggerNativeHaptic('medium');
          Animated.spring(dismissZoneScale, {
            toValue: 1.25,
            useNativeDriver: true,
            tension: 100,
            friction: 6,
          }).start();
        } else if (!inBottomZone && isOverDismissZoneRef.current) {
          isOverDismissZoneRef.current = false;
          setIsOverDismissZone(false);
          Animated.spring(dismissZoneScale, {
            toValue: 1.0,
            useNativeDriver: true,
            tension: 100,
            friction: 6,
          }).start();
        }
      },
      onPanResponderRelease: () => {
        const wasInZone = isOverDismissZoneRef.current;
        fabPan.flattenOffset();
        Animated.timing(dismissZoneAnim, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }).start(() => {
          setIsDraggingFab(false);
          setIsOverDismissZone(false);
          isOverDismissZoneRef.current = false;
        });

        if (wasInZone) {
          triggerNativeHaptic('heavy');
          dismissInspector();
          showToast(
            t(
              'common.inspectorDismissed',
              'In-App Inspector closed for this session',
            ),
          );
        } else {
          // Clamp FAB within screen bounds after drag
          clampFabPosition();
        }

        setTimeout(() => {
          fabDraggedRef.current = false;
        }, 100);
      },
      onPanResponderTerminate: () => {
        fabPan.flattenOffset();
        fabDraggedRef.current = false;
        Animated.timing(dismissZoneAnim, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }).start(() => {
          setIsDraggingFab(false);
          setIsOverDismissZone(false);
          isOverDismissZoneRef.current = false;
        });
      },
    }),
  ).current;

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

        // Clamp player bar vertically within safe area
        const currentY = playerPanRef.current.y;
        const topLimit = -(screenHeight - (Platform.OS === 'ios' ? 34 : 18) - 70);
        const bottomLimit = Platform.OS === 'ios' ? 34 : 18;
        if (currentY < topLimit || currentY > bottomLimit) {
          const clampedY = Math.max(topLimit, Math.min(bottomLimit, currentY));
          Animated.spring(playerPan, {
            toValue: {x: playerPanRef.current.x, y: clampedY},
            useNativeDriver: false,
            tension: 80,
            friction: 8,
          }).start();
        }

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
            thumbnailUri: result.thumbnailUri,
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
          fps: captureFps,
          scale: captureScale,
          audioSource: captureAudioMode,
          bitrate: captureBitrate > 0 ? captureBitrate : undefined,
          maxDurationSeconds: captureMaxDurationSeconds,
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
  }, [isRecording, captureFps, captureScale, captureBitrate, captureMaxDurationSeconds, captureAudioMode, refreshMediaCount, t]);

  const handleExpandInspector = useCallback(() => {
    if (playerDraggedRef.current) return;
    triggerNativeHaptic('light');
    setIsMinimized?.(false);
    setVisible(true);
  }, [setIsMinimized, setVisible]);

  const handleCollapsePlayer = useCallback(() => {
    if (playerDraggedRef.current) return;
    triggerNativeHaptic('light');
    setIsMinimized?.(false);
    setVisible(false);
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

          {/* App Logo & Expand Info (Music Player Left Section) */}
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={handleExpandInspector}
            style={fabStyles.brandSection}
            accessibilityRole="button"
            accessibilityLabel={t('mediaGallery.expand', 'Expand Inspector')}>
            <AppHeaderLogo size={36} customIcon={appIcon} shape="circle" />
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

          {/* Action Buttons: Photo, Record, Expand, Collapse */}
          <View style={fabStyles.actionsRow}>
            {/* Photo Action */}
            <TouchableScale
              onPress={handleTakeScreenshot}
              hitSlop={{top: 6, bottom: 6, left: 4, right: 4}}
              style={fabStyles.actionBtn}>
              <ScreenshotCaptureIcon size={12} color={AppColors.white} />
              <Text style={fabStyles.actionText}>
                {t('header.photo', 'Photo')}
              </Text>
            </TouchableScale>

            {/* Record Action */}
            <TouchableScale
              onPress={handleToggleVideoRecording}
              hitSlop={{top: 6, bottom: 6, left: 4, right: 4}}
              style={[
                fabStyles.actionBtn,
                isRecording && fabStyles.recordingBtnActive,
              ]}>
              {isRecording ? (
                <View style={fabStyles.recordingDot} />
              ) : (
                <ScreenRecordIcon size={12} color={AppColors.white} />
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

            {/* Expand Action */}
            <TouchableScale
              onPress={handleExpandInspector}
              hitSlop={{top: 6, bottom: 6, left: 4, right: 4}}
              accessibilityRole="button"
              accessibilityLabel={t('common.expand', 'Expand')}
              style={fabStyles.actionBtnSquare}>
              <MaximizeIcon size={12} color={AppColors.white} />
            </TouchableScale>

            {/* Collapse / Close Action */}
            <TouchableScale
              onPress={handleCollapsePlayer}
              hitSlop={{top: 6, bottom: 6, left: 4, right: 6}}
              accessibilityRole="button"
              accessibilityLabel={t('common.close', 'Close')}
              style={fabStyles.actionBtnSquare}>
              <CloseWhite size={10} color={AppColors.white} />
            </TouchableScale>
          </View>
        </Animated.View>
      ) : (
        /* ─── Case 2: Full Original Circular Draggable FAB Icon (when Inspector is closed) ── */
        <Animated.View
          style={[styles.fabWrapper, {transform: fabPan.getTranslateTransform()}]}
          {...circularPanResponder.panHandlers}>
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
            <AppHeaderLogo size={68} customIcon={appIcon} shape="circle" />
          </TouchableScale>
        </Animated.View>
      )}

      {/* ─── Bottom-Center Drag-to-Dismiss Drop Target ─── */}
      {isDraggingFab && (
        <Animated.View
          pointerEvents="none"
          style={[
            fabStyles.dismissTargetContainer,
            {
              opacity: dismissZoneAnim,
              transform: [
                {
                  translateY: dismissZoneAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [30, 0],
                  }),
                },
                {scale: dismissZoneScale},
              ],
            },
          ]}>
          <View
            style={[
              fabStyles.dismissTargetCircle,
              isOverDismissZone && fabStyles.dismissTargetCircleActive,
            ]}>
            <CloseWhite size={18} color={AppColors.white} />
          </View>
          <Text
            style={[
              fabStyles.dismissTargetLabel,
              isOverDismissZone && fabStyles.dismissTargetLabelActive,
            ]}>
            {isOverDismissZone
              ? t('common.releaseToHide', 'Release to hide')
              : t('common.dragToHide', 'Drag here to hide')}
          </Text>
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
};

const fabStyles = StyleSheet.create({
  // ─── Drag-to-Dismiss Zone Styles ───
  dismissTargetContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 42 : 26,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999998,
  },
  dismissTargetCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(23, 23, 37, 0.82)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.28)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: AppColors.black,
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 16,
  },
  dismissTargetCircleActive: {
    backgroundColor: AppColors.red600,
    borderColor: AppColors.red300,
    shadowColor: AppColors.red600,
    shadowOpacity: 0.65,
    shadowRadius: 18,
    transform: [{scale: 1.06}],
  },
  dismissTargetLabel: {
    marginTop: 6,
    fontFamily: AppFonts.interSemiBold,
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.85)',
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 3,
  },
  dismissTargetLabelActive: {
    color: AppColors.red300,
    fontFamily: AppFonts.interBold,
  },

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
    overflow: 'hidden',
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
    gap: 4.5,
    flexShrink: 0,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    paddingHorizontal: 8,
    paddingVertical: 5.5,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.32)',
  },
  actionBtnSquare: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 27,
    height: 27,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
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
    fontSize: 10.5,
    color: AppColors.white,
  },
});

export default FabLauncher;
