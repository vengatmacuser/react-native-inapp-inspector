import React, {useState} from 'react';
import {
  Image,
  Modal,
  Platform,
  SafeAreaView,
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
  CloseWhite,
  CopyIcon,
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
      showToast(t('mediaGallery.convertedSuccess', 'Converted to GIF!'));
    } catch {
      showToast(t('mediaGallery.convertFailed', 'Conversion failed'));
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
        <View style={previewStyles.header}>
          <LinearGradient
            colors={[AppColors.indigo600, AppColors.violet600]}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
          <View style={previewStyles.headerInner}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleCopyUri}
              style={previewStyles.headerLeft}>
              <View style={previewStyles.badge}>
                {isVideo ? (
                  <FilmIcon size={11} color={AppColors.white} />
                ) : isGif ? (
                  <GifIcon size={11} color={AppColors.white} />
                ) : (
                  <ImageIcon size={11} color={AppColors.white} />
                )}
                <Text style={previewStyles.badgeText}>
                  {item.format.toUpperCase()}
                </Text>
              </View>
              <View style={previewStyles.headerTextCol}>
                <Text style={previewStyles.title} numberOfLines={1}>
                  {item.filename}
                </Text>
                <Text style={previewStyles.subtitle} numberOfLines={1}>
                  {formatBytes(item.sizeBytes)} • {new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit', second: '2-digit'})}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Top Actions: GIF Convert (if video), Copy, Share, Delete, Close */}
            <View style={previewStyles.headerRight}>
              {isVideo && onConvertToGif && (
                <TouchableScale
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel={t('mediaGallery.convertToGif', 'Convert to GIF')}
                  onPress={handleConvert}
                  disabled={isConverting}
                  style={[previewStyles.headerActionBtn, {backgroundColor: `${AppColors.warningAmber}33`, borderColor: `${AppColors.warningAmber}66`}]}
                  hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
                  <GifIcon size={13} color={AppColors.warningAmber} />
                </TouchableScale>
              )}

              <TouchableScale
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={t('mediaGallery.copyUri', 'Copy URI')}
                onPress={handleCopyUri}
                style={previewStyles.headerActionBtn}
                hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
                <CopyIcon size={13} color={AppColors.white} />
              </TouchableScale>

              <TouchableScale
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={t('mediaGallery.share', 'Share')}
                onPress={handleShare}
                style={previewStyles.headerActionBtn}
                hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
                <ShareIcon size={13} color={AppColors.white} />
              </TouchableScale>

              <TouchableScale
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={t('mediaGallery.delete', 'Delete')}
                onPress={handleDelete}
                style={previewStyles.headerDeleteBtn}
                hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
                <TrashIcon size={13} color={AppColors.white} />
              </TouchableScale>

              <TouchableOpacity
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={t('common.close', 'Close')}
                onPress={onClose}
                style={previewStyles.headerCloseBtn}
                hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
                <CloseWhite size={12} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Media Preview Stage - Sticking directly to SafeAreaView */}
        <SafeAreaView style={previewStyles.stageSafe}>
          <View style={previewStyles.stage}>
            <TouchableOpacity
              activeOpacity={isVideo ? 0.92 : 1}
              onPress={isVideo ? handlePlayVideo : undefined}
              style={previewStyles.previewCard}>
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
                      {isPlaying
                        ? t('mediaGallery.playing', 'Playing Video...')
                        : t('mediaGallery.playVideo', 'Play Video')}
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
        </SafeAreaView>
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
  },
  header: {
    width: '100%',
    zIndex: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255, 255, 255, 0.25)',
  },
  headerInner: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingTop:
      Platform.OS === 'ios'
        ? 52
        : StatusBar.currentHeight
        ? StatusBar.currentHeight + 8
        : 18,
    paddingBottom: 12,
    minHeight: Platform.OS === 'ios' ? 94 : 64,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    minWidth: 0,
    marginRight: 6,
  },
  headerTextCol: {
    flex: 1,
    minWidth: 0,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3.5,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.38)',
  },
  badgeText: {
    fontFamily: AppFonts.interBold,
    fontSize: 9.5,
    letterSpacing: 0.4,
    color: AppColors.white,
  },
  title: {
    fontFamily: AppFonts.interSemiBold,
    fontSize: 12.5,
    color: AppColors.white,
    letterSpacing: -0.1,
  },
  subtitle: {
    fontFamily: AppFonts.interRegular,
    fontSize: 10.5,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 1,
  },
  headerActionBtn: {
    width: 30,
    height: 30,
    borderRadius: 7,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.38)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerDeleteBtn: {
    width: 30,
    height: 30,
    borderRadius: 7,
    backgroundColor: 'rgba(239, 68, 68, 0.35)',
    borderWidth: 1,
    borderColor: 'rgba(252, 165, 165, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCloseBtn: {
    width: 30,
    height: 30,
    borderRadius: 7,
    backgroundColor: 'rgba(244, 63, 94, 0.28)',
    borderWidth: 1,
    borderColor: 'rgba(251, 113, 133, 0.48)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stageSafe: {
    flex: 1,
    width: '100%',
  },
  stage: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  previewCard: {
    flex: 1,
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
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
});
