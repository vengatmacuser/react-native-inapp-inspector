import React, {useState} from 'react';
import {
  Alert,
  Dimensions,
  Image,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {AppColors} from '../../styles/AppColors';
import {AppFonts} from '../../styles/AppFonts';
import TouchableScale from '../TouchableScale';
import {
  ChevronDownIcon,
  ExpandCollapseIcon,
  FilmIcon,
  GifIcon,
  ImageIcon,
  PauseIcon,
  PlayIcon,
  RepeatIcon,
  TrashIcon,
} from '../NetworkIcons';
import {CapturedMediaItem, ScreenCapture} from '../../capture';
import {formatBytes} from '../../helpers';
import {showToast} from '../../helpers/toast';
import {useTranslation} from '../../i18n';

interface MediaPreviewModalProps {
  item: CapturedMediaItem | null;
  visible: boolean;
  onClose: () => void;
  onDelete: (item: CapturedMediaItem) => void;
  onConvertToGif?: (item: CapturedMediaItem) => void;
}

export const MediaPreviewModal: React.FC<MediaPreviewModalProps> = ({
  item,
  visible,
  onClose,
  onDelete,
  onConvertToGif,
}) => {
  const {t} = useTranslation();
  const [isConverting, setIsConverting] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<'1.0x' | '1.5x' | '2.0x'>('1.0x');
  const [isLooping, setIsLooping] = useState(true);
  const [scrubPosition, setScrubPosition] = useState(0.4);

  if (!item) return null;

  const handlePlayVideo = async () => {
    try {
      setIsPlaying(true);
      await ScreenCapture.playVideo(item.uri);
    } catch {
      showToast(t('mediaGallery.playError', 'Unable to play video'));
    } finally {
      setIsPlaying(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      t('mediaGallery.deleteTitle'),
      t('mediaGallery.deleteMessage', {filename: item.filename}),
      [
        {text: t('common.cancel'), style: 'cancel'},
        {
          text: t('mediaGallery.delete'),
          style: 'destructive',
          onPress: () => {
            onDelete(item);
            onClose();
          },
        },
      ],
    );
  };

  const handleConvert = async () => {
    if (!onConvertToGif) return;
    setIsConverting(true);
    try {
      await onConvertToGif(item);
      showToast(t('mediaGallery.convertedSuccess'));
    } catch {
      showToast(t('mediaGallery.convertFailed'));
    } finally {
      setIsConverting(false);
    }
  };

  const isVideo = item.type === 'video';
  const isGif = item.type === 'gif';
  const durationSec = item.durationMs ? (item.durationMs / 1000).toFixed(1) : null;
  const formattedDuration = durationSec
    ? `00:${Number(durationSec) < 10 ? '0' : ''}${durationSec}`
    : '00:05.0';
  const hasBottomToolbar = isVideo || isGif;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}>
      <View style={previewStyles.overlay}>
        {/* Header Bar */}
        <View style={previewStyles.header}>
          <View style={previewStyles.headerLeft}>
            <View
              style={[
                previewStyles.badge,
                {
                  borderColor: isVideo
                    ? `${AppColors.sky400}80`
                    : isGif
                    ? `${AppColors.warningAmber}80`
                    : `${AppColors.emerald500}80`,
                  backgroundColor: isVideo
                    ? `${AppColors.sky400}20`
                    : isGif
                    ? `${AppColors.warningAmber}20`
                    : `${AppColors.emerald500}20`,
                },
              ]}>
              {isVideo ? (
                <FilmIcon size={13} color={AppColors.sky400} />
              ) : isGif ? (
                <GifIcon size={13} color={AppColors.warningAmber} />
              ) : (
                <ImageIcon size={13} color={AppColors.emerald500} />
              )}
              <Text
                style={[
                  previewStyles.badgeText,
                  {
                    color: isVideo
                      ? AppColors.sky400
                      : isGif
                      ? AppColors.warningAmber
                      : AppColors.emerald500,
                  },
                ]}>
                {item.format.toUpperCase()}
              </Text>
            </View>
            <View style={{flex: 1, minWidth: 0}}>
              <Text style={previewStyles.title} numberOfLines={1}>
                {item.filename}
              </Text>
              <Text style={previewStyles.subtitle}>
                {formatBytes(item.sizeBytes)} • {new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit', second: '2-digit'})}
              </Text>
            </View>
          </View>

          {/* Top Actions: Delete, Expand/Contract, Minimize */}
          <View style={previewStyles.headerRight}>
            <TouchableScale
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={t('mediaGallery.delete')}
              onPress={handleDelete}
              style={previewStyles.headerDeleteBtn}
              hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
              <TrashIcon size={14} color={AppColors.red500} />
            </TouchableScale>

            <TouchableOpacity
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={isExpanded ? t('mediaGallery.collapse', 'Exit Fullscreen') : t('mediaGallery.expand', 'Expand Fullscreen')}
              onPress={() => setIsExpanded(!isExpanded)}
              style={[
                previewStyles.headerIconBtn,
                isExpanded && {backgroundColor: `${AppColors.sky400}30`, borderColor: `${AppColors.sky400}70`},
              ]}
              hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
              <ExpandCollapseIcon
                size={14}
                isExpanded={isExpanded}
                color={isExpanded ? AppColors.sky400 : AppColors.white}
              />
            </TouchableOpacity>

            <TouchableOpacity
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={t('mediaGallery.minimize', 'Minimize')}
              onPress={onClose}
              style={previewStyles.headerIconBtn}
              hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
              <ChevronDownIcon size={15} color={AppColors.white} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Media Preview Stage */}
        <View
          style={[
            previewStyles.stage,
            isExpanded && previewStyles.stageExpanded,
            !hasBottomToolbar && {
              paddingBottom: Platform.OS === 'ios' ? 34 : 16,
            },
          ]}>
          <TouchableOpacity
            activeOpacity={isVideo ? 0.9 : 1}
            onPress={isVideo ? handlePlayVideo : undefined}
            style={[
              previewStyles.previewCard,
              isExpanded && previewStyles.previewCardExpanded,
            ]}>
            {isVideo ? (
              item.thumbnailUri && !imageError ? (
                <>
                  <Image
                    source={{uri: item.thumbnailUri}}
                    style={previewStyles.image}
                    resizeMode="contain"
                    onError={() => setImageError(true)}
                  />
                  <View style={previewStyles.videoImageOverlay} />
                </>
              ) : (
                <View style={previewStyles.videoFallbackBackdrop}>
                  <View style={previewStyles.videoFallbackGlow} />
                  <FilmIcon size={52} color={AppColors.sky400} />
                  <Text style={previewStyles.videoFallbackTitle}>
                    {t('mediaGallery.playVideo', 'Play Video')}
                  </Text>
                  <Text style={previewStyles.videoFallbackSubtitle}>
                    {item.width && item.height ? `${item.width} × ${item.height}` : 'HD Video'} • MP4
                  </Text>
                </View>
              )
            ) : (
              <Image
                source={{uri: item.uri}}
                style={previewStyles.image}
                resizeMode="contain"
                onError={() => setImageError(true)}
              />
            )}

            {/* Central Play Button Overlay for Videos */}
            {isVideo && (
              <View style={previewStyles.centerPlayOverlay}>
                <View style={previewStyles.centerPlayCircle}>
                  <PlayIcon size={30} color={AppColors.white} />
                </View>
                <Text style={previewStyles.centerPlayText}>
                  {t('mediaGallery.playVideo', 'Play Video')}
                </Text>
              </View>
            )}

            {/* Video overlay badge with playback duration */}
            {isVideo && (
              <View style={previewStyles.videoBadgeOverlay}>
                <View style={previewStyles.playPill}>
                  <FilmIcon size={13} color={AppColors.white} />
                  <Text style={previewStyles.playPillText}>
                    {durationSec ? `${durationSec}s` : 'VIDEO'}
                  </Text>
                </View>
              </View>
            )}

            {/* GIF loop badge */}
            {isGif && (
              <View style={previewStyles.videoBadgeOverlay}>
                <View style={[previewStyles.playPill, {backgroundColor: `${AppColors.warningAmber}CC`}]}>
                  <GifIcon size={13} color={AppColors.white} />
                  <Text style={previewStyles.playPillText}>ANIMATED GIF</Text>
                </View>
              </View>
            )}

            {/* Floating Meta Chip inside Card */}
            <View style={previewStyles.floatingMetaBadge}>
              <Text style={previewStyles.floatingMetaText}>
                {item.width && item.height ? `${item.width} × ${item.height}  •  ` : ''}
                {formatBytes(item.sizeBytes)}
                {durationSec ? `  •  ${durationSec}s` : ''}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Video Controls & Scrub Bar (For Videos) */}
        {isVideo && (
          <View style={previewStyles.videoControlsPanel}>
            {/* Timeline Progress Bar */}
            <View style={previewStyles.progressSection}>
              <Text style={previewStyles.timeLabel}>
                00:0{Math.floor(scrubPosition * (Number(durationSec) || 5))}
              </Text>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setScrubPosition(pos => (pos >= 0.9 ? 0.1 : pos + 0.3))}
                style={previewStyles.progressTrack}>
                <View
                  style={[
                    previewStyles.progressFill,
                    {width: `${Math.max(10, Math.min(100, scrubPosition * 100))}%`},
                  ]}
                />
                <View
                  style={[
                    previewStyles.scrubberThumb,
                    {left: `${Math.max(8, Math.min(96, scrubPosition * 100))}%`},
                  ]}
                />
              </TouchableOpacity>
              <Text style={previewStyles.timeLabel}>{formattedDuration}</Text>
            </View>

            {/* Extra Controls: Play/Pause, Speed, Loop */}
            <View style={previewStyles.controlsRow}>
              {/* Play / Pause toggle */}
              <TouchableOpacity
                onPress={handlePlayVideo}
                style={previewStyles.controlActionPill}>
                {isPlaying ? (
                  <PauseIcon size={14} color={AppColors.sky400} />
                ) : (
                  <PlayIcon size={14} color={AppColors.sky400} />
                )}
                <Text style={[previewStyles.controlActionText, {color: AppColors.sky400}]}>
                  {isPlaying ? t('mediaGallery.pause', 'Pause') : t('mediaGallery.play', 'Play')}
                </Text>
              </TouchableOpacity>

              {/* Playback Speed selector */}
              <View style={previewStyles.speedGroup}>
                {(['1.0x', '1.5x', '2.0x'] as const).map(speed => (
                  <TouchableOpacity
                    key={speed}
                    onPress={() => setPlaybackSpeed(speed)}
                    style={[
                      previewStyles.speedBtn,
                      playbackSpeed === speed && previewStyles.speedBtnActive,
                    ]}>
                    <Text
                      style={[
                        previewStyles.speedText,
                        playbackSpeed === speed && previewStyles.speedTextActive,
                      ]}>
                      {speed}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Loop Toggle */}
              <TouchableOpacity
                onPress={() => setIsLooping(!isLooping)}
                style={[
                  previewStyles.loopPill,
                  isLooping && previewStyles.loopPillActive,
                ]}>
                <RepeatIcon
                  size={12}
                  color={isLooping ? AppColors.sky400 : AppColors.whiteAlpha60}
                />
                <Text
                  style={[
                    previewStyles.loopText,
                    isLooping && previewStyles.loopTextActive,
                  ]}>
                  {isLooping ? 'Loop: ON' : 'Loop: OFF'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Bottom Primary Actions */}
        {hasBottomToolbar && (
          <View style={previewStyles.footer}>
            {isVideo && (
              <TouchableScale
                onPress={handlePlayVideo}
                style={[
                  previewStyles.actionBtn,
                  {
                    backgroundColor: `${AppColors.sky400}25`,
                    borderColor: `${AppColors.sky400}70`,
                  },
                ]}>
                <PlayIcon size={15} color={AppColors.sky400} />
                <Text style={[previewStyles.actionText, {color: AppColors.sky400, fontFamily: AppFonts.interSemiBold}]}>
                  {t('mediaGallery.playVideo', 'Play Video')}
                </Text>
              </TouchableScale>
            )}

            {onConvertToGif && isVideo && (
              <TouchableScale
                onPress={handleConvert}
                disabled={isConverting}
                style={[
                  previewStyles.actionBtn,
                  {
                    backgroundColor: `${AppColors.warningAmber}25`,
                    borderColor: `${AppColors.warningAmber}70`,
                  },
                ]}>
                <GifIcon size={15} color={AppColors.warningAmber} />
                <Text style={[previewStyles.actionText, {color: AppColors.warningAmber}]}>
                  {isConverting ? t('mediaGallery.converting') : t('mediaGallery.convertToGif')}
                </Text>
              </TouchableScale>
            )}
          </View>
        )}
      </View>
    </Modal>
  );
};

const previewStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: '#090D16FA',
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 52 : 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.borderGlassLight,
    backgroundColor: AppColors.headerGlassDark,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 0,
    marginRight: 10,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  badgeText: {
    fontFamily: AppFonts.interBold,
    fontSize: 10.5,
    letterSpacing: 0.4,
  },
  title: {
    fontFamily: AppFonts.interSemiBold,
    fontSize: 13.5,
    color: AppColors.white,
  },
  subtitle: {
    fontFamily: AppFonts.interRegular,
    fontSize: 11,
    color: AppColors.whiteAlpha60,
    marginTop: 1,
  },
  headerDeleteBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: `${AppColors.red500}20`,
    borderWidth: 1,
    borderColor: `${AppColors.red500}60`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: AppColors.whiteAlpha12,
    borderWidth: 1,
    borderColor: AppColors.whiteAlpha20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 10,
  },
  stageExpanded: {
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 0,
  },
  previewCard: {
    flex: 1,
    width: '100%',
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#05070D',
    borderWidth: 1,
    borderColor: AppColors.borderGlassLight,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  previewCardExpanded: {
    borderRadius: 0,
    borderWidth: 0,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  videoImageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(5, 7, 13, 0.25)',
  },
  videoFallbackBackdrop: {
    flex: 1,
    width: '100%',
    backgroundColor: '#070C18',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  videoFallbackGlow: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: `${AppColors.sky400}18`,
  },
  videoFallbackTitle: {
    fontFamily: AppFonts.interSemiBold,
    fontSize: 15,
    color: AppColors.white,
    marginTop: 8,
  },
  videoFallbackSubtitle: {
    fontFamily: AppFonts.interRegular,
    fontSize: 12,
    color: AppColors.whiteAlpha60,
  },
  centerPlayOverlay: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  centerPlayCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: `${AppColors.sky400}E0`,
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 3,
    shadowColor: AppColors.sky400,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  centerPlayText: {
    fontFamily: AppFonts.interSemiBold,
    fontSize: 13,
    color: AppColors.white,
    letterSpacing: 0.3,
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 3,
  },
  videoBadgeOverlay: {
    position: 'absolute',
    bottom: 12,
    left: 12,
  },
  playPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: `${AppColors.slate900}D9`,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: AppColors.whiteAlpha20,
  },
  playPillText: {
    fontFamily: AppFonts.interSemiBold,
    fontSize: 11,
    color: AppColors.white,
    letterSpacing: 0.3,
  },
  floatingMetaBadge: {
    position: 'absolute',
    bottom: 10,
    backgroundColor: `${AppColors.slate900}D9`,
    paddingHorizontal: 10,
    paddingVertical: 4.5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: AppColors.whiteAlpha15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingMetaText: {
    fontFamily: AppFonts.interMedium,
    fontSize: 10.5,
    color: AppColors.slate200,
    letterSpacing: 0.2,
  },
  videoControlsPanel: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 6,
    backgroundColor: AppColors.headerGlassDark,
    borderTopWidth: 1,
    borderTopColor: AppColors.borderGlassLight,
    gap: 8,
  },
  progressSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  timeLabel: {
    fontFamily: AppFonts.interMedium,
    fontSize: 11,
    color: AppColors.whiteAlpha60,
    minWidth: 42,
  },
  progressTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: AppColors.whiteAlpha15,
    justifyContent: 'center',
    position: 'relative',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: AppColors.sky400,
  },
  scrubberThumb: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: AppColors.white,
    borderWidth: 2,
    borderColor: AppColors.sky400,
    top: -3,
    marginLeft: -6,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  controlActionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: `${AppColors.sky400}18`,
    borderWidth: 1,
    borderColor: `${AppColors.sky400}50`,
  },
  controlActionText: {
    fontFamily: AppFonts.interSemiBold,
    fontSize: 11.5,
  },
  speedGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.whiteAlpha08,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: AppColors.whiteAlpha12,
    padding: 2,
    gap: 2,
  },
  speedBtn: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 4,
  },
  speedBtnActive: {
    backgroundColor: `${AppColors.sky400}30`,
  },
  speedText: {
    fontFamily: AppFonts.interMedium,
    fontSize: 10.5,
    color: AppColors.whiteAlpha60,
  },
  speedTextActive: {
    color: AppColors.sky400,
    fontFamily: AppFonts.interBold,
  },
  loopPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: AppColors.whiteAlpha08,
    borderWidth: 1,
    borderColor: AppColors.whiteAlpha12,
  },
  loopPillActive: {
    backgroundColor: `${AppColors.sky400}18`,
    borderColor: `${AppColors.sky400}50`,
  },
  loopText: {
    fontFamily: AppFonts.interMedium,
    fontSize: 10.5,
    color: AppColors.whiteAlpha60,
  },
  loopTextActive: {
    color: AppColors.sky400,
    fontFamily: AppFonts.interSemiBold,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    borderTopWidth: 1,
    borderTopColor: AppColors.borderGlassLight,
    backgroundColor: AppColors.headerGlassDark,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: AppColors.whiteAlpha08,
    borderWidth: 1,
    borderColor: AppColors.whiteAlpha15,
  },
  actionText: {
    fontFamily: AppFonts.interMedium,
    fontSize: 12,
    color: AppColors.white,
  },
});
