import React, {useState} from 'react';
import {
  Dimensions,
  Image,
  Modal,
  Platform,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {AppColors} from '../../styles/AppColors';
import {AppFonts} from '../../styles/AppFonts';
import TouchableScale from '../TouchableScale';
import {ConfirmationModal} from './ConfirmationModal';
import {
  ChevronDownIcon,
  CopyIcon,
  ExpandCollapseIcon,
  FilmIcon,
  GifIcon,
  ImageIcon,
  PlayIcon,
  ShareIcon,
  TrashIcon,
} from '../NetworkIcons';
import {CapturedMediaItem, ScreenCapture} from '../../capture';
import {copyImageOrMediaToClipboard, formatBytes} from '../../helpers';
import {showToast} from '../../helpers/toast';
import {useTranslation} from '../../i18n';
import {triggerNativeHaptic} from '../../native/NativeInspector';

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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!item) return null;

  const handleCopyUri = () => {
    if (!item?.uri) return;
    copyImageOrMediaToClipboard(
      item.uri,
      item.type === 'image' ? 'Image' : 'Media',
    );
  };

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
    triggerNativeHaptic('medium');
    setShowDeleteConfirm(true);
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

  const handleShare = async () => {
    try {
      const shareUri =
        item.uri.startsWith('file://') ||
        item.uri.startsWith('content://') ||
        item.uri.startsWith('http')
          ? item.uri
          : `file://${item.uri}`;

      const shareOptions = Platform.select({
        ios: {
          url: shareUri,
          title: item.filename,
        },
        default: {
          title: item.filename,
          message: item.filename,
          url: shareUri,
        },
      });

      const result = await Share.share(shareOptions);
      if (result.action === Share.sharedAction) {
        showToast(t('mediaGallery.shareSuccess', 'Shared successfully'));
      }
    } catch (err: any) {
      if (err?.message !== 'User did not share') {
        showToast(
          t('mediaGallery.shareUnavailable', 'Sharing not available on this device'),
        );
      }
    }
  };

  const isVideo = item.type === 'video';
  const isGif = item.type === 'gif';
  const durationSec = item.durationMs ? (item.durationMs / 1000).toFixed(1) : null;
  const formattedDuration = durationSec
    ? `00:${Number(durationSec) < 10 ? '0' : ''}${durationSec}`
    : null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      statusBarTranslucent={true}
      onRequestClose={onClose}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />
      <View style={previewStyles.overlay}>
        {/* Top Header Bar with Inspector LinearGradient */}
        <LinearGradient
          colors={[AppColors.indigo600, AppColors.violet600]}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 1}}
          style={previewStyles.header}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleCopyUri}
            style={previewStyles.headerLeft}>
            <View style={previewStyles.badge}>
              {isVideo ? (
                <FilmIcon size={12} color={AppColors.white} />
              ) : isGif ? (
                <GifIcon size={12} color={AppColors.white} />
              ) : (
                <ImageIcon size={12} color={AppColors.white} />
              )}
              <Text style={previewStyles.badgeText}>
                {item.format.toUpperCase()}
              </Text>
            </View>
            <View style={previewStyles.headerTextCol}>
              <Text style={previewStyles.title} numberOfLines={1}>
                {item.filename}
              </Text>
              <Text style={previewStyles.subtitle}>
                {formatBytes(item.sizeBytes)} • {new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit', second: '2-digit'})}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Top Actions: Copy, Share, Delete, Expand, Close */}
          <View style={previewStyles.headerRight}>
            <TouchableScale
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={t('mediaGallery.copyUri', 'Copy URI')}
              onPress={handleCopyUri}
              style={previewStyles.headerActionBtn}
              hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
              <CopyIcon size={13} color={AppColors.white} />
            </TouchableScale>

            <TouchableScale
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={t('mediaGallery.share', 'Share')}
              onPress={handleShare}
              style={previewStyles.headerActionBtn}
              hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
              <ShareIcon size={13} color={AppColors.white} />
            </TouchableScale>

            <TouchableScale
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={t('mediaGallery.delete')}
              onPress={handleDelete}
              style={previewStyles.headerDeleteBtn}
              hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
              <TrashIcon size={13} color={AppColors.white} />
            </TouchableScale>

            <TouchableOpacity
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={isExpanded ? t('mediaGallery.collapse', 'Exit Fullscreen') : t('mediaGallery.expand', 'Expand Fullscreen')}
              onPress={() => setIsExpanded(!isExpanded)}
              style={previewStyles.headerIconBtn}
              hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
              <ExpandCollapseIcon
                size={13}
                isExpanded={isExpanded}
                color={AppColors.white}
              />
            </TouchableOpacity>

            <TouchableOpacity
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={t('mediaGallery.minimize', 'Minimize')}
              onPress={onClose}
              style={previewStyles.headerIconBtn}
              hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
              <ChevronDownIcon size={14} color={AppColors.white} />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Media Preview Stage */}
        <View
          style={[
            previewStyles.stage,
            isExpanded && previewStyles.stageExpanded,
          ]}>
          <TouchableOpacity
            activeOpacity={isVideo ? 0.92 : 1}
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
                    {item.width && item.height ? `${item.width} × ${item.height}` : 'HD Video Recording'}
                  </Text>
                  <Text style={previewStyles.videoFallbackSubtitle}>
                    {durationSec ? `${durationSec}s duration` : 'MP4 Video'} • {formatBytes(item.sizeBytes)}
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
              <View style={previewStyles.centerPlayContainer} pointerEvents="box-none">
                <View style={previewStyles.centerPlayGlow} />
                <View style={previewStyles.centerPlayCircle}>
                  <PlayIcon size={28} color={AppColors.white} />
                </View>
                <View style={previewStyles.centerPlayPill}>
                  <Text style={previewStyles.centerPlayText}>
                    {t('mediaGallery.playVideo', 'Play Video')}
                  </Text>
                </View>
              </View>
            )}

            {/* Top-left Duration Badge for Video / GIF */}
            {isVideo && (
              <View style={previewStyles.topLeftBadgeOverlay} pointerEvents="none">
                <View style={previewStyles.metaPill}>
                  <FilmIcon size={11} color={AppColors.sky400} />
                  <Text style={previewStyles.metaPillText}>
                    {formattedDuration || (durationSec ? `${durationSec}s` : 'VIDEO')}
                  </Text>
                </View>
              </View>
            )}

            {isGif && (
              <View style={previewStyles.topLeftBadgeOverlay} pointerEvents="none">
                <View style={[previewStyles.metaPill, {backgroundColor: 'rgba(245, 158, 11, 0.85)'}]}>
                  <GifIcon size={11} color={AppColors.white} />
                  <Text style={previewStyles.metaPillText}>ANIMATED GIF</Text>
                </View>
              </View>
            )}

            {/* Bottom-right Dimensions & Size Badge */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleCopyUri}
              style={previewStyles.bottomRightBadgeOverlay}>
              <View style={previewStyles.metaPill}>
                <CopyIcon size={10} color={AppColors.sky400} />
                <Text style={previewStyles.metaPillText}>
                  {item.width && item.height ? `${item.width} × ${item.height} • ` : ''}
                  {formatBytes(item.sizeBytes)}
                </Text>
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </View>

        {/* Bottom Actions Panel */}
        <View style={previewStyles.footer}>
          {isVideo && (
            <TouchableScale
              onPress={handlePlayVideo}
              style={previewStyles.primaryPlayBtn}>
              <PlayIcon size={16} color={AppColors.white} />
              <Text style={previewStyles.primaryPlayText}>
                {isPlaying
                  ? t('mediaGallery.playing', 'Playing Video...')
                  : t('mediaGallery.playInPlayer', 'Play Fullscreen Video')}
              </Text>
            </TouchableScale>
          )}

          <View style={previewStyles.actionsRow}>
            <TouchableScale
              onPress={handleCopyUri}
              style={previewStyles.actionBtn}>
              <CopyIcon size={14} color={AppColors.grayText} />
              <Text style={previewStyles.actionText}>
                {t('mediaGallery.copyUri', 'Copy URI')}
              </Text>
            </TouchableScale>

            {onConvertToGif && isVideo && (
              <TouchableScale
                onPress={handleConvert}
                disabled={isConverting}
                style={[
                  previewStyles.actionBtn,
                  {
                    backgroundColor: AppColors.amber100,
                    borderColor: AppColors.amber200,
                  },
                ]}>
                <GifIcon size={15} color={AppColors.amber600} />
                <Text style={[previewStyles.actionText, {color: AppColors.amber600, fontFamily: AppFonts.interBold}]}>
                  {isConverting ? t('mediaGallery.converting') : t('mediaGallery.convertToGif')}
                </Text>
              </TouchableScale>
            )}

            <TouchableScale
              onPress={handleShare}
              style={[
                previewStyles.actionBtn,
                {
                  backgroundColor: AppColors.indigo600,
                  borderColor: AppColors.indigo600,
                },
              ]}>
              <ShareIcon size={14} color={AppColors.white} />
              <Text style={[previewStyles.actionText, {color: AppColors.white, fontFamily: AppFonts.interBold}]}>
                {t('mediaGallery.share', 'Share')}
              </Text>
            </TouchableScale>

            {!isVideo && (
              <TouchableScale
                onPress={handleDelete}
                style={[
                  previewStyles.actionBtn,
                  {
                    backgroundColor: AppColors.red100,
                    borderColor: `${AppColors.red500}4D`,
                  },
                ]}>
                <TrashIcon size={14} color={AppColors.red500} />
                <Text style={[previewStyles.actionText, {color: AppColors.red500, fontFamily: AppFonts.interBold}]}>
                  {t('mediaGallery.delete', 'Delete')}
                </Text>
              </TouchableScale>
            )}
          </View>
        </View>
      </View>

      {/* Custom In-App Confirmation Modal */}
      <ConfirmationModal
        visible={showDeleteConfirm}
        title={t('mediaGallery.deleteTitle', 'Delete Media?')}
        message={t('mediaGallery.deleteMessage', {filename: item.filename})}
        confirmText={t('mediaGallery.delete', 'Delete')}
        cancelText={t('common.cancel', 'Cancel')}
        isDestructive={true}
        icon="trash"
        onConfirm={() => {
          setShowDeleteConfirm(false);
          onDelete(item);
          onClose();
        }}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </Modal>
  );
};

const previewStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: AppColors.slate900,
    justifyContent: 'space-between',
  },
  header: {
    flexShrink: 0,
    minHeight: Platform.OS === 'ios' ? 96 : 66,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop:
      Platform.OS === 'ios'
        ? 48
        : StatusBar.currentHeight
        ? StatusBar.currentHeight + 8
        : 18,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255, 255, 255, 0.25)',
    zIndex: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 0,
    marginRight: 8,
  },
  headerTextCol: {
    flex: 1,
    minWidth: 0,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3.5,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.38)',
  },
  badgeText: {
    fontFamily: AppFonts.interBold,
    fontSize: 10,
    letterSpacing: 0.4,
    color: AppColors.white,
  },
  title: {
    fontFamily: AppFonts.interSemiBold,
    fontSize: 13,
    color: AppColors.white,
  },
  subtitle: {
    fontFamily: AppFonts.interRegular,
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 1,
  },
  headerActionBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.38)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerDeleteBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.35)',
    borderWidth: 1,
    borderColor: 'rgba(252, 165, 165, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIconBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.38)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stage: {
    flex: 1,
    minHeight: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    overflow: 'hidden',
  },
  stageExpanded: {
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  previewCard: {
    flex: 1,
    width: '100%',
    minHeight: 0,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: AppColors.slate900,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
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
    backgroundColor: 'rgba(10, 13, 20, 0.28)',
  },
  videoFallbackBackdrop: {
    flex: 1,
    width: '100%',
    backgroundColor: AppColors.slate900,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  videoFallbackGlow: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
  },
  videoFallbackTitle: {
    fontFamily: AppFonts.interSemiBold,
    fontSize: 15,
    color: AppColors.white,
    marginTop: 12,
  },
  videoFallbackSubtitle: {
    fontFamily: AppFonts.interRegular,
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 4,
  },
  centerPlayContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  centerPlayGlow: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(56, 189, 248, 0.22)',
  },
  centerPlayCircle: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: AppColors.sky500,
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 3,
    shadowColor: AppColors.sky500,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  centerPlayPill: {
    backgroundColor: 'rgba(15, 23, 42, 0.90)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  centerPlayText: {
    fontFamily: AppFonts.interBold,
    fontSize: 11.5,
    color: AppColors.white,
    letterSpacing: 0.3,
  },
  topLeftBadgeOverlay: {
    position: 'absolute',
    top: 12,
    left: 12,
  },
  bottomRightBadgeOverlay: {
    position: 'absolute',
    bottom: 12,
    right: 12,
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(15, 23, 42, 0.90)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  metaPillText: {
    fontFamily: AppFonts.interSemiBold,
    fontSize: 11,
    color: AppColors.white,
    letterSpacing: 0.2,
  },
  footer: {
    flexShrink: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    borderTopWidth: 1,
    borderTopColor: AppColors.grayBorderSecondary,
    backgroundColor: AppColors.white,
    gap: 10,
    zIndex: 10,
    ...Platform.select({
      ios: {
        shadowColor: AppColors.slate900,
        shadowOffset: {width: 0, height: -3},
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  primaryPlayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: AppColors.indigo600,
    shadowColor: AppColors.indigo600,
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  primaryPlayText: {
    fontFamily: AppFonts.interBold,
    fontSize: 13.5,
    color: AppColors.white,
    letterSpacing: 0.3,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: AppColors.graySurface,
    borderWidth: 1,
    borderColor: AppColors.grayBorderSecondary,
  },
  actionText: {
    fontFamily: AppFonts.interSemiBold,
    fontSize: 12,
    color: AppColors.grayText,
  },
});

