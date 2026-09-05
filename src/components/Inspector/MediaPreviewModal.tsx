import React, {useState} from 'react';
import {
  Alert,
  Dimensions,
  Image,
  Modal,
  Platform,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {AppColors} from '../../styles/AppColors';
import {AppFonts} from '../../styles/AppFonts';
import TouchableScale from '../TouchableScale';
import {
  CloseWhite,
  CopyIcon,
  FilmIcon,
  GifIcon,
  ImageIcon,
  SendIcon,
  TrashIcon,
} from '../NetworkIcons';
import {CapturedMediaItem, ScreenCapture} from '../../capture';
import {copyToClipboard, formatBytes} from '../../helpers';
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

  if (!item) return null;

  const handleShare = async () => {
    try {
      await Share.share(
        Platform.OS === 'ios'
          ? {url: item.uri, title: item.filename}
          : {message: `Captured media: ${item.filename}`, url: item.uri},
      );
    } catch {
      showToast(t('mediaGallery.shareUnavailable'));
    }
  };

  const handleCopyUri = () => {
    copyToClipboard(item.uri);
    showToast(t('mediaGallery.uriCopied'));
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
          <TouchableOpacity
            onPress={onClose}
            style={previewStyles.closeBtn}
            hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
            <CloseWhite size={14} color={AppColors.white} />
          </TouchableOpacity>
        </View>

        {/* Media Preview Stage */}
        <View style={previewStyles.stage}>
          <View style={previewStyles.previewCard}>
            <Image
              source={{uri: item.uri}}
              style={previewStyles.image}
              resizeMode="contain"
              onError={() => setImageError(true)}
            />

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
          </View>

          {/* Quick Details Card */}
          <View style={previewStyles.metaPillRow}>
            {item.width && item.height ? (
              <View style={previewStyles.metaPill}>
                <Text style={previewStyles.metaPillLabel}>DIMENSIONS</Text>
                <Text style={previewStyles.metaPillValue}>{`${item.width} × ${item.height}`}</Text>
              </View>
            ) : null}
            <View style={previewStyles.metaPill}>
              <Text style={previewStyles.metaPillLabel}>SIZE</Text>
              <Text style={previewStyles.metaPillValue}>{formatBytes(item.sizeBytes)}</Text>
            </View>
            {durationSec ? (
              <View style={previewStyles.metaPill}>
                <Text style={previewStyles.metaPillLabel}>DURATION</Text>
                <Text style={previewStyles.metaPillValue}>{`${durationSec}s`}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Bottom Toolbar */}
        <View style={previewStyles.footer}>
          {isVideo && onConvertToGif && (
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

          <TouchableScale onPress={handleShare} style={previewStyles.actionBtn}>
            <SendIcon size={15} color={AppColors.sky400} />
            <Text style={previewStyles.actionText}>{t('mediaGallery.share')}</Text>
          </TouchableScale>

          <TouchableScale onPress={handleCopyUri} style={previewStyles.actionBtn}>
            <CopyIcon size={15} color={AppColors.white} />
            <Text style={previewStyles.actionText}>{t('mediaGallery.copyUri')}</Text>
          </TouchableScale>

          <TouchableScale
            onPress={handleDelete}
            style={[
              previewStyles.actionBtn,
              {
                backgroundColor: `${AppColors.red500}25`,
                borderColor: `${AppColors.red500}70`,
              },
            ]}>
            <TrashIcon size={15} color={AppColors.red500} />
            <Text style={[previewStyles.actionText, {color: AppColors.red500}]}>
              {t('mediaGallery.delete')}
            </Text>
          </TouchableScale>
        </View>
      </View>
    </Modal>
  );
};

const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} = Dimensions.get('window');

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
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: AppColors.whiteAlpha12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  previewCard: {
    width: SCREEN_WIDTH - 32,
    height: SCREEN_HEIGHT * 0.60,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#05070D',
    borderWidth: 1,
    borderColor: AppColors.borderGlassLight,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
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
  metaPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 14,
    flexWrap: 'wrap',
  },
  metaPill: {
    backgroundColor: AppColors.whiteAlpha08,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: AppColors.whiteAlpha12,
    alignItems: 'center',
  },
  metaPillLabel: {
    fontFamily: AppFonts.interMedium,
    fontSize: 9,
    color: AppColors.slate400,
    letterSpacing: 0.4,
  },
  metaPillValue: {
    fontFamily: AppFonts.interSemiBold,
    fontSize: 11.5,
    color: AppColors.white,
    marginTop: 1,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 36 : 20,
    borderTopWidth: 1,
    borderTopColor: AppColors.borderGlassLight,
    backgroundColor: AppColors.headerGlassDark,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
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
