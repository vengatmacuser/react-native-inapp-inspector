import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  Animated,
  PanResponder,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {useInspector} from './InspectorContext';
import TouchableScale from '../TouchableScale';
import {
  ScreenshotCaptureIcon,
  ScreenRecordIcon,
} from '../NetworkIcons';
import {CapturedMediaItem, ScreenCapture} from '../../capture';
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
  } = useInspector();

  const {t} = useTranslation();

  const [isRecording, setIsRecording] = useState(false);
  const [isExcludingForCapture, setIsExcludingForCapture] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [previewMediaItem, setPreviewMediaItem] =
    useState<CapturedMediaItem | null>(null);

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
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_e, g) =>
        Math.abs(g.dx) > 4 || Math.abs(g.dy) > 4,
      onPanResponderGrant: () => {
        isDraggedRef.current = true;
        pan.setOffset({
          x: panRef.current.x,
          y: panRef.current.y,
        });
        pan.setValue({x: 0, y: 0});
      },
      onPanResponderMove: Animated.event(
        [null, {dx: pan.x, dy: pan.y}],
        {useNativeDriver: false},
      ),
      onPanResponderRelease: () => {
        pan.flattenOffset();
        setTimeout(() => {
          isDraggedRef.current = false;
        }, 120);
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

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`;
  };

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

      {!isExcludingForCapture && (
        <Animated.View
          {...panResponder.panHandlers}
          style={[
            styles.container,
            {
              transform: [{translateX: pan.x}, {translateY: pan.y}],
            },
          ]}>
          {/* Recording active state: Glowing pill with live timer */}
          {isRecording ? (
            <TouchableScale
              onPress={handleToggleVideoRecording}
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
            </TouchableScale>
          ) : (
            /* Directly Rendered Centered Floating Capture Dock */
            <View style={styles.dockBar}>
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
                  <ScreenshotCaptureIcon size={14} color="#38BDF8" />
                </View>
                <Text style={styles.menuItemText}>Screenshot</Text>
              </TouchableScale>

              {/* 2. Record Screen Action */}
              <TouchableScale
                onPress={handleToggleVideoRecording}
                style={styles.menuItemBtn}
                accessible={true}
                accessibilityLabel="Record Screen">
                <View
                  style={[
                    styles.menuItemIconCircle,
                    {backgroundColor: 'rgba(239, 68, 68, 0.22)'},
                  ]}>
                  <ScreenRecordIcon size={14} color="#EF4444" />
                </View>
                <Text style={styles.menuItemText}>Record</Text>
              </TouchableScale>
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

const styles = StyleSheet.create({
  flashOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFFFFF',
    zIndex: 999999,
  },
  container: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 22 : 16,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    elevation: 20,
    pointerEvents: 'box-none',
  },
  dockBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(15, 23, 42, 0.94)',
    borderRadius: 22,
    paddingVertical: 4.5,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 8},
        shadowOpacity: 0.45,
        shadowRadius: 16,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  menuItemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5.5,
    paddingVertical: 4.5,
    paddingHorizontal: 8.5,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  menuItemIconCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuItemText: {
    fontFamily: AppFonts.interSemiBold,
    fontSize: 10.5,
    color: AppColors.white,
    letterSpacing: 0.1,
  },
  recordingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: 'rgba(225, 29, 72, 0.95)',
    paddingVertical: 6.5,
    paddingHorizontal: 11,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#FDA4AF',
    ...Platform.select({
      ios: {
        shadowColor: '#E11D48',
        shadowOffset: {width: 0, height: 6},
        shadowOpacity: 0.5,
        shadowRadius: 12,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  recordingDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: AppColors.white,
  },
  recordingText: {
    fontFamily: AppFonts.interBold,
    fontSize: 11,
    color: AppColors.white,
    letterSpacing: 0.3,
  },
  stopIconBadge: {
    width: 15,
    height: 15,
    borderRadius: 7.5,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2,
  },
  stopIconSquare: {
    width: 5,
    height: 5,
    borderRadius: 1,
    backgroundColor: AppColors.white,
  },
});

export default FloatingCaptureWidget;
