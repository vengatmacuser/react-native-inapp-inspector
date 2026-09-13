import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  Animated,
  Dimensions,
  PanResponder,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useInspector} from './InspectorContext';
import TouchableScale from '../TouchableScale';
import {
  GripVerticalIcon,
  ScreenshotCaptureIcon,
  ScreenRecordIcon,
} from '../NetworkIcons';
import {CapturedMediaItem, ScreenCapture, generateCaptureId} from '../../capture';
import {triggerNativeHaptic} from '../../native/NativeInspector';
import {showToast} from '../../helpers/toast';
import {AppColors} from '../../styles/AppColors';
import {AppFonts} from '../../styles/AppFonts';
import {useTranslation} from '../../i18n';
import {MediaPreviewModal} from './MediaPreviewModal';

export const FloatingCaptureWidget: React.FC = () => {
  const {
    refreshMediaCount,
    captureFps,
    captureScale,
    captureBitrate,
    captureMaxDurationSeconds,
    captureAudioMode,
    activeTab,
    settingsPage,
    peekMode,
    previewMediaItem,
    setPreviewMediaItem,
  } = useInspector();

  const {t} = useTranslation();

  const [isRecording, setIsRecording] = useState(false);
  const [isExcludingForCapture, setIsExcludingForCapture] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Pulse animation for recording state
  const pulseAnim = useRef(new Animated.Value(1)).current;
  // Screen flash animation on screenshot
  const flashAnim = useRef(new Animated.Value(0)).current;

  // Draggable pan responder
  const pan = useRef(new Animated.ValueXY({x: 0, y: 0})).current;
  const panRef = useRef({x: 0, y: 0});
  useEffect(() => {
    const idX = pan.x.addListener(v => (panRef.current.x = v.value));
    const idY = pan.y.addListener(v => (panRef.current.y = v.value));
    return () => {
      pan.x.removeListener(idX);
      pan.y.removeListener(idY);
    };
  }, [pan]);

  const isDraggedRef = useRef(false);
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponder: (_e, g) =>
        Math.abs(g.dx) > 2 || Math.abs(g.dy) > 2,
      onMoveShouldSetPanResponderCapture: (_e, g) =>
        Math.abs(g.dx) > 4 || Math.abs(g.dy) > 4,
      onPanResponderGrant: () => {
        isDraggedRef.current = true;
        pan.setOffset({
          x: panRef.current.x,
          y: panRef.current.y,
        });
        pan.setValue({x: 0, y: 0});
      },
      onPanResponderMove: Animated.event([null, {dx: pan.x, dy: pan.y}], {
        useNativeDriver: false,
      }),
      onPanResponderTerminationRequest: () => false,
      onShouldBlockNativeResponder: () => true,
      onPanResponderRelease: () => {
        pan.flattenOffset();
        setTimeout(() => {
          isDraggedRef.current = false;
        }, 100);
        const {width, height} = Dimensions.get('window');
        const maxX = width / 2 - 20;
        const minX = -maxX;
        const maxY = 20;
        const minY = -(height - 140);
        const currentX = panRef.current.x;
        const currentY = panRef.current.y;
        if (currentX < minX || currentX > maxX || currentY < minY || currentY > maxY) {
          const clampedX = Math.min(Math.max(currentX, minX), maxX);
          const clampedY = Math.min(Math.max(currentY, minY), maxY);
          Animated.spring(pan, {
            toValue: {x: clampedX, y: clampedY},
            friction: 7,
            tension: 50,
            useNativeDriver: false,
          }).start();
        }
      },
      onPanResponderTerminate: () => {
        pan.flattenOffset();
        isDraggedRef.current = false;
      },
    }),
  ).current;

  // Check initial recording state
  useEffect(() => {
    ScreenCapture.isRecording()
      .then(active => {
        setIsRecording(active);
      })
      .catch(() => {});
  }, []);

  // Recording timer and pulsating effect
  useEffect(() => {
    let pulseLoop: Animated.CompositeAnimation | null = null;
    if (isRecording) {
      setRecordingSeconds(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds(s => s + 1);
      }, 1000);

      pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ]),
      );
      pulseLoop.start();
    } else {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
      setRecordingSeconds(0);
      pulseAnim.setValue(1);
    }
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      if (pulseLoop) {
        pulseLoop.stop();
      }
    };
  }, [isRecording, pulseAnim]);

  const handleTakeScreenshot = useCallback(async () => {
    if (isDraggedRef.current) return;
    try {
      triggerNativeHaptic('light');

      // Temporarily hide capture widget to completely exclude it from the screenshot
      setIsExcludingForCapture(true);
      await new Promise(resolve => setTimeout(resolve, 60));

      const result = await ScreenCapture.takeScreenshot({
        format: 'png',
        quality: 0.9,
        hideInspector: false,
      });

      // Restore widget visibility immediately
      setIsExcludingForCapture(false);

      // Visual camera flash feedback
      Animated.sequence([
        Animated.timing(flashAnim, {
          toValue: 0.65,
          duration: 70,
          useNativeDriver: true,
        }),
        Animated.timing(flashAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

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
      setIsExcludingForCapture(false);
      showToast(t('header.screenshotError', 'Error capturing screenshot'));
    }
  }, [refreshMediaCount, flashAnim, t]);

  const handleToggleVideoRecording = useCallback(async () => {
    if (isDraggedRef.current) return;
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
        // Instantly switch state so idle dock collapses before native recorder captures first frame
        setIsRecording(true);
        const started = await ScreenCapture.startRecording({
          fps: captureFps,
          scale: captureScale,
          audioSource: captureAudioMode,
          bitrate: captureBitrate > 0 ? captureBitrate : undefined,
          maxDurationSeconds: captureMaxDurationSeconds,
        });
        if (started) {
          showToast(t('header.recordingStarted', 'Recording started'));
        } else {
          setIsRecording(false);
          showToast(
            t('header.recordingStartFailed', 'Failed to start recording'),
          );
        }
      }
    } catch {
      showToast(t('header.recordingError', 'Error during screen recording'));
      setIsRecording(false);
    }
  }, [
    isRecording,
    captureFps,
    captureScale,
    captureBitrate,
    captureMaxDurationSeconds,
    captureAudioMode,
    refreshMediaCount,
    t,
  ]);

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // When inside the screencast/media gallery module or media settings, hide the floating widget
  if (activeTab === 'media' || settingsPage === 'media') {
    return null;
  }

  return (
    <>
      {/* Visual Screen Flash on Screenshot capture */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.flashOverlay,
          {
            opacity: flashAnim,
          },
        ]}
      />

      {!isExcludingForCapture && !previewMediaItem && (
        <Animated.View
          {...panResponder.panHandlers}
          style={[
            styles.container,
            {
              transform: pan.getTranslateTransform(),
            },
          ]}>
          {/* Recording active state: Glowing studio capsule with live timer */}
          {isRecording ? (
            <View style={styles.recordingShadowWrapper}>
              <TouchableScale
                onPress={handleToggleVideoRecording}
                style={styles.recordingPillWrapper}>
                <LinearGradient
                  colors={['#E11D48', '#BE123C']}
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 0}}
                  style={styles.recordingPill}>
                  <Animated.View
                    style={[
                      styles.recordingDot,
                      {transform: [{scale: pulseAnim}]},
                    ]}
                  />
                  <Text style={styles.recordingText}>
                    REC {formatTimer(recordingSeconds)}
                  </Text>
                  <View style={styles.stopIconBadge}>
                    <View style={styles.stopIconSquare} />
                  </View>
                </LinearGradient>
              </TouchableScale>
            </View>
          ) : (
            /* Modern Studio Floating Capture Dock */
            <View style={styles.dockShadowWrapper}>
              <LinearGradient
                colors={[
                  '#0E1326',
                  '#1A1E38',
                  '#0E1326',
                ]}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 0}}
                style={styles.dockBar}>
                {/* 1. Take Screenshot Action */}
                <TouchableScale
                  onPress={handleTakeScreenshot}
                  style={styles.menuItemBtn}
                  accessible={true}
                  accessibilityLabel="Take Screenshot">
                  <View
                    style={[
                      styles.menuItemIconCircle,
                      {backgroundColor: 'rgba(56, 189, 248, 0.22)'},
                    ]}>
                    <ScreenshotCaptureIcon size={14} color={AppColors.sky400} />
                  </View>
                  <Text style={styles.menuItemText}>
                    {t('header.screenshot', 'Screenshot')}
                  </Text>
                </TouchableScale>

                {/* Vertical Studio Divider */}
                <View style={styles.dockDivider} />

                {/* 2. Record Screen Action */}
                <TouchableScale
                  onPress={handleToggleVideoRecording}
                  style={styles.menuItemBtn}
                  accessible={true}
                  accessibilityLabel={t('header.recordScreen', 'Record Screen')}>
                  <View
                    style={[
                      styles.menuItemIconCircle,
                      {backgroundColor: 'rgba(244, 63, 94, 0.24)'},
                    ]}>
                    <ScreenRecordIcon size={14} color={AppColors.rose400 || '#FB7185'} />
                  </View>
                  <Text style={styles.menuItemText}>
                    {t('header.record', 'Record')}
                  </Text>
                </TouchableScale>

                {/* Visual Drag Handle Grip (Moved to the right after record) */}
                <View style={styles.dragGripArea}>
                  <GripVerticalIcon size={14} color="rgba(255, 255, 255, 0.55)" />
                </View>
              </LinearGradient>
            </View>
          )}
        </Animated.View>
      )}

      {/* Media Preview Modal for immediate review, GIF export or delete */}
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

const styles = StyleSheet.create({
  flashOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: AppColors.white,
    zIndex: 999999,
  },
  container: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 22 : 16,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999999,
    elevation: 999999,
  },
  dockShadowWrapper: {
    borderRadius: 24,
    backgroundColor: '#0D1120',
    ...Platform.select({
      ios: {
        shadowColor: AppColors.black,
        shadowOffset: {width: 0, height: 6},
        shadowOpacity: 0.45,
        shadowRadius: 14,
      },
      android: {
        elevation: 16,
      },
    }),
  },
  dockBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 24,
    overflow: 'hidden',
  },
  dragGripArea: {
    paddingLeft: 6,
    paddingRight: 12,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dockDivider: {
    width: 1,
    height: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
  },
  menuItemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: 8.5,
    paddingHorizontal: 12,
  },
  menuItemIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuItemText: {
    fontFamily: AppFonts.interSemiBold,
    fontSize: 12,
    color: AppColors.white,
    letterSpacing: 0.1,
  },
  recordingShadowWrapper: {
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#E11D48',
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.5,
        shadowRadius: 12,
      },
      android: {
        elevation: 14,
      },
    }),
  },
  recordingPillWrapper: {
    borderRadius: 22,
    overflow: 'hidden',
  },
  recordingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 38,
    paddingHorizontal: 14,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.45)',
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  recordingText: {
    fontFamily: AppFonts.interBold,
    fontSize: 12,
    color: AppColors.white,
    letterSpacing: 0.4,
  },
  stopIconBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(255, 255, 255, 0.28)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 3,
  },
  stopIconSquare: {
    width: 6,
    height: 6,
    borderRadius: 1.5,
    backgroundColor: AppColors.white,
  },
});

export default FloatingCaptureWidget;
