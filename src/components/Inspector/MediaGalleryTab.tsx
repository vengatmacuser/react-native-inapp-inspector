import React, {useState, useEffect, useMemo, useCallback} from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  RefreshControl,
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
  CameraIcon,
  CameraRollIcon,
  CheckIcon,
  CloseWhite,
  CopyIcon,
  FilmIcon,
  GifIcon,
  GridIcon,
  ImageIcon,
  ListIcon,
  PlayIcon,
  ScreencastIcon,
  ShareIcon,
  TrashIcon,
  VideoCameraIcon,
  WhiteBackNavigation,
} from '../NetworkIcons';
import {MediaPreviewModal} from './MediaPreviewModal';
import {
  ScreenCapture,
  CapturedMediaItem,
  generateCaptureId,
} from '../../capture';
import {
  copyImageOrMediaToClipboard,
  copyToClipboard,
  formatBytes,
} from '../../helpers';
import {triggerNativeHaptic} from '../../native/NativeInspector';
import {showToast} from '../../helpers/toast';
import {useTranslation} from '../../i18n';
import {useInspector} from './InspectorContext';
import {ConfirmationModal} from './ConfirmationModal';

export const MediaGalleryTab: React.FC = () => {
  const {t} = useTranslation();
  const {
    refreshMediaCount,
    switchActiveTab,
    previewMediaItem,
    setPreviewMediaItem,
  } = useInspector();

  const [mediaList, setMediaList] = useState<CapturedMediaItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'image' | 'video' | 'gif'>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const recordingTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  const [confirmConfig, setConfirmConfig] = useState<{
    visible: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
  }>({
    visible: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const loadMedia = useCallback(async () => {
    try {
      const items = await ScreenCapture.getMediaList();
      setMediaList(items);
      refreshMediaCount?.().catch(() => {});
    } catch {
      setMediaList([]);
    }
  }, [refreshMediaCount]);

  useEffect(() => {
    loadMedia();
  }, [loadMedia]);

  // Sync active recording status
  useEffect(() => {
    ScreenCapture.isRecording()
      .then(active => setIsRecording(active))
      .catch(() => {});
  }, []);

  useEffect(() => {
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

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMedia();
    setRefreshing(false);
  };

  const counts = useMemo(() => {
    let images = 0;
    let videos = 0;
    let gifs = 0;
    mediaList.forEach(item => {
      if (item.type === 'image') images++;
      else if (item.type === 'video') videos++;
      else if (item.type === 'gif') gifs++;
    });
    return {all: mediaList.length, image: images, video: videos, gif: gifs};
  }, [mediaList]);

  const filteredMedia = useMemo(() => {
    if (selectedFilter === 'all') return mediaList;
    return mediaList.filter(item => item.type === selectedFilter);
  }, [mediaList, selectedFilter]);

  const totalStorageBytes = useMemo(() => {
    return mediaList.reduce((sum, item) => sum + (item.sizeBytes || 0), 0);
  }, [mediaList]);

  // Capture Actions
  const handleTakeScreenshot = useCallback(async () => {
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
          filename: result.uri.split('/').pop() || captureId,
          sizeBytes: result.sizeBytes,
          timestamp: result.timestamp,
          width: result.width,
          height: result.height,
        };
        setPreviewMediaItem(newItem);
        await loadMedia();
        refreshMediaCount?.().catch(() => {});
        showToast(t('header.screenshotCaptured', 'Screenshot captured & saved'));
      } else {
        showToast(t('header.screenshotFailed', 'Failed to capture screenshot'));
      }
    } catch {
      showToast(t('header.screenshotError', 'Error capturing screenshot'));
    }
  }, [loadMedia, refreshMediaCount, setPreviewMediaItem, t]);

  const handleToggleVideoRecording = useCallback(async () => {
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
            filename: result.uri.split('/').pop() || captureId,
            sizeBytes: result.sizeBytes,
            timestamp: result.timestamp,
            durationMs: result.durationMs,
            width: result.width,
            height: result.height,
            hasAudio: result.hasAudio,
          };
          setPreviewMediaItem(newItem);
          await loadMedia();
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
          showToast(t('header.recordingStarted', 'Screen recording started'));
        } else {
          showToast(t('header.recordingStartFailed', 'Failed to start screen recording'));
        }
      }
    } catch {
      showToast(t('header.recordingError', 'Screen recording error'));
      setIsRecording(false);
    }
  }, [isRecording, loadMedia, refreshMediaCount, setPreviewMediaItem, t]);

  const handleOpenPicker = async () => {
    try {
      triggerNativeHaptic('light');
      const mediaType: 'image' | 'video' | 'any' =
        selectedFilter === 'image'
          ? 'image'
          : selectedFilter === 'video'
          ? 'video'
          : 'any';

      const pickedItem = await ScreenCapture.pickMedia({mediaType});
      if (pickedItem) {
        triggerNativeHaptic('success');
        await loadMedia();
        refreshMediaCount?.().catch(() => {});
        showToast(
          pickedItem.type === 'video'
            ? t('mediaGallery.importedVideo', 'Video imported from Camera Roll')
            : t('mediaGallery.importedPhoto', 'Photo imported from Camera Roll'),
        );
        setPreviewMediaItem(pickedItem);
      }
    } catch {
      showToast(t('mediaGallery.importFailed', 'Failed to import media'));
    }
  };

  const toggleSelect = useCallback((id: string) => {
    triggerNativeHaptic('light');
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleDeleteItem = async (item: CapturedMediaItem) => {
    triggerNativeHaptic('medium');
    await ScreenCapture.deleteMedia(item.uri);
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.delete(item.id);
      return next;
    });
    await loadMedia();
    await refreshMediaCount?.();
    showToast(t('mediaGallery.deleted', 'Media deleted'));
  };

  const handleCopyItemUri = (item: CapturedMediaItem) => {
    if (!item?.uri) return;
    triggerNativeHaptic('light');
    copyImageOrMediaToClipboard(
      item.uri,
      item.type === 'image' ? 'Image' : 'Media',
    );
  };

  const handleCopySelectedUris = () => {
    const itemsToCopy = mediaList.filter(item => selectedIds.has(item.id));
    if (itemsToCopy.length === 0) return;
    triggerNativeHaptic('light');
    const urisText = itemsToCopy.map(i => i.uri).join('\n');
    copyToClipboard(urisText, `${itemsToCopy.length} Media URIs`);
    showToast(`${itemsToCopy.length} file URIs copied to clipboard`);
  };

  const handleShareItem = async (item: CapturedMediaItem) => {
    try {
      triggerNativeHaptic('light');
      const shareUri =
        item.uri.startsWith('file://') ||
        item.uri.startsWith('content://') ||
        item.uri.startsWith('http')
          ? item.uri
          : `file://${item.uri}`;

      await Share.share({
        url: shareUri,
        title: item.filename,
        message: item.filename,
      });
    } catch {
      showToast(
        t('mediaGallery.shareUnavailable', 'Sharing not available on this device'),
      );
    }
  };

  const handleShareSelected = async () => {
    const itemsToShare = mediaList.filter(item => selectedIds.has(item.id));
    if (itemsToShare.length === 0) return;

    try {
      triggerNativeHaptic('light');
      const firstItem = itemsToShare[0];
      const shareUri =
        firstItem.uri.startsWith('file://') ||
        firstItem.uri.startsWith('content://') ||
        firstItem.uri.startsWith('http')
          ? firstItem.uri
          : `file://${firstItem.uri}`;

      await Share.share({
        url: shareUri,
        title: firstItem.filename,
        message:
          itemsToShare.length === 1
            ? firstItem.filename
            : `${itemsToShare.length} items: ${itemsToShare.map(i => i.filename).join(', ')}`,
      });
    } catch {
      showToast(
        t('mediaGallery.shareUnavailable', 'Sharing not available on this device'),
      );
    }
  };

  const handleDeleteSelected = () => {
    const count = selectedIds.size;
    if (count === 0) return;

    setConfirmConfig({
      visible: true,
      title: t('mediaGallery.deleteSelectedTitle', 'Delete Selected Media'),
      message: t('mediaGallery.deleteSelectedMessage', {
        count,
        defaultValue: `Are you sure you want to permanently delete ${count} media items?`,
      }),
      confirmText: t('mediaGallery.delete', 'Delete'),
      cancelText: t('common.cancel', 'Cancel'),
      onConfirm: async () => {
        setConfirmConfig(prev => ({...prev, visible: false}));
        const itemsToDelete = mediaList.filter(item => selectedIds.has(item.id));
        for (const item of itemsToDelete) {
          await ScreenCapture.deleteMedia(item.uri);
        }
        setSelectedIds(new Set());
        await loadMedia();
        await refreshMediaCount?.();
        showToast(t('mediaGallery.deletedCount', {count: itemsToDelete.length, defaultValue: `Deleted ${itemsToDelete.length} items`}));
      },
    });
  };

  const handleClearAll = () => {
    setConfirmConfig({
      visible: true,
      title: t('mediaGallery.purgeTitle', 'Purge Gallery'),
      message: t('mediaGallery.purgeMessage', {
        count: mediaList.length,
        size: formatBytes(totalStorageBytes),
        defaultValue: `Are you sure you want to delete all ${mediaList.length} media files (${formatBytes(totalStorageBytes)})? This cannot be undone.`,
      }),
      confirmText: t('common.clearAll', 'Clear All'),
      cancelText: t('common.cancel', 'Cancel'),
      onConfirm: async () => {
        setConfirmConfig(prev => ({...prev, visible: false}));
        await ScreenCapture.clearAllMedia();
        setSelectedIds(new Set());
        await loadMedia();
        await refreshMediaCount?.();
        showToast(t('mediaGallery.allPurged', 'All screencast files deleted'));
      },
    });
  };

  const handleConvertToGif = async (item: CapturedMediaItem) => {
    const gifResult = await ScreenCapture.convertToGif(item.uri, {fps: 12, width: 480});
    if (gifResult) {
      await loadMedia();
      refreshMediaCount?.().catch(() => {});
    }
  };

  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const renderGridItem = ({item}: {item: CapturedMediaItem}) => {
    if (!item) return null;
    const isVideo = item.type === 'video';
    const isGif = item.type === 'gif';
    const thumbUri = isVideo ? (item.thumbnailUri || item.uri) : item.uri;
    const isSelected = Boolean(item.id && selectedIds.has(item.id));
    const formatLabel = (item.format || (isVideo ? 'mp4' : isGif ? 'gif' : 'png')).toUpperCase();
    const filename = item.filename || (item.uri ? item.uri.split('/').pop() : '') || 'Capture';
    const timeStr = item.timestamp
      ? new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})
      : '';

    return (
      <TouchableScale
        onPress={() => setPreviewMediaItem(item)}
        style={[galleryStyles.card, isSelected && galleryStyles.cardSelected]}>
        <View style={galleryStyles.thumbnailContainer}>
          {thumbUri ? (
            <Image
              source={{uri: thumbUri}}
              style={galleryStyles.thumbnail as any}
              resizeMode="cover"
            />
          ) : (
            <View style={galleryStyles.thumbnailFallback}>
              {isVideo ? (
                <FilmIcon size={28} color={AppColors.sky500} />
              ) : (
                <ImageIcon size={28} color={AppColors.grayTextWeak} />
              )}
            </View>
          )}

          {/* Checkbox top-left */}
          <TouchableOpacity
            onPress={() => item.id && toggleSelect(item.id)}
            style={[
              galleryStyles.checkbox,
              isSelected && galleryStyles.checkboxSelected,
            ]}
            hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
            {isSelected && <CheckIcon size={11} color={AppColors.white} />}
          </TouchableOpacity>

          {/* Center Play Icon for Videos */}
          {isVideo && (
            <View style={galleryStyles.miniPlayCircle}>
              <PlayIcon size={14} color={AppColors.white} />
            </View>
          )}

          {/* Format Badge top-right */}
          <View
            style={[
              galleryStyles.typeBadge,
              {
                backgroundColor: isVideo
                  ? 'rgba(14, 165, 233, 0.88)'
                  : isGif
                  ? 'rgba(245, 158, 11, 0.88)'
                  : 'rgba(16, 185, 129, 0.88)',
              },
            ]}>
            <Text style={galleryStyles.typeBadgeText}>
              {formatLabel}
            </Text>
          </View>

          {/* Duration badge bottom-right for video */}
          {isVideo && item.durationMs ? (
            <View style={galleryStyles.durationBadge}>
              <Text style={galleryStyles.durationBadgeText}>
                {formatTimer(Math.round(item.durationMs / 1000))}
              </Text>
            </View>
          ) : null}
        </View>

        <View style={galleryStyles.cardInfo}>
          <Text style={galleryStyles.cardTitle} numberOfLines={1}>
            {filename}
          </Text>
          <View style={galleryStyles.cardMetaRow}>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1, minWidth: 0}}>
              <Text style={galleryStyles.cardMeta} numberOfLines={1}>
                {formatBytes(item.sizeBytes || 0)}
              </Text>
              {timeStr ? (
                <>
                  <Text style={galleryStyles.cardMetaDot}>•</Text>
                  <Text style={galleryStyles.cardMeta} numberOfLines={1}>
                    {timeStr}
                  </Text>
                </>
              ) : null}
            </View>
            <TouchableOpacity
              onPress={() => handleCopyItemUri(item)}
              style={galleryStyles.gridCopyBtn}
              hitSlop={{top: 6, bottom: 6, left: 6, right: 6}}>
              <CopyIcon size={11} color={AppColors.grayText} />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableScale>
    );
  };

  const renderListItem = ({item}: {item: CapturedMediaItem}) => {
    if (!item) return null;
    const isVideo = item.type === 'video';
    const isGif = item.type === 'gif';
    const thumbUri = isVideo ? (item.thumbnailUri || item.uri) : item.uri;
    const isSelected = Boolean(item.id && selectedIds.has(item.id));
    const formatLabel = (item.format || (isVideo ? 'mp4' : isGif ? 'gif' : 'png')).toUpperCase();
    const filename = item.filename || (item.uri ? item.uri.split('/').pop() : '') || 'Capture';
    const dateStr = item.timestamp
      ? `${new Date(item.timestamp).toLocaleDateString([], {month: 'short', day: 'numeric'})} ${new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}`
      : '';

    return (
      <TouchableScale
        onPress={() => setPreviewMediaItem(item)}
        style={[galleryStyles.listRow, isSelected && galleryStyles.listRowSelected]}>
        {/* Checkbox */}
        <TouchableOpacity
          onPress={() => item.id && toggleSelect(item.id)}
          style={[
            galleryStyles.listCheckbox,
            isSelected && galleryStyles.checkboxSelected,
          ]}
          hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
          {isSelected && <CheckIcon size={11} color={AppColors.white} />}
        </TouchableOpacity>

        {/* Square Thumbnail */}
        <View style={galleryStyles.listThumbContainer}>
          {thumbUri ? (
            <Image
              source={{uri: thumbUri}}
              style={galleryStyles.listThumb as any}
              resizeMode="cover"
            />
          ) : (
            <View style={galleryStyles.listThumbFallback}>
              {isVideo ? (
                <FilmIcon size={18} color={AppColors.sky500} />
              ) : (
                <ImageIcon size={18} color={AppColors.grayTextWeak} />
              )}
            </View>
          )}
          {isVideo && (
            <View style={galleryStyles.listMiniPlay}>
              <PlayIcon size={10} color={AppColors.white} />
            </View>
          )}
        </View>

        {/* Text Metadata */}
        <View style={galleryStyles.listInfo}>
          <Text style={galleryStyles.listTitle} numberOfLines={1}>
            {filename}
          </Text>
          <View style={galleryStyles.listMetaRow}>
            <View
              style={[
                galleryStyles.listBadge,
                {
                  backgroundColor: isVideo
                    ? `${AppColors.sky500}18`
                    : isGif
                    ? `${AppColors.amber500}18`
                    : `${AppColors.green600}18`,
                },
              ]}>
              <Text
                style={[
                  galleryStyles.listBadgeText,
                  {
                    color: isVideo
                      ? AppColors.sky600
                      : isGif
                      ? AppColors.amber500
                      : AppColors.green600,
                  },
                ]}>
                {formatLabel}
              </Text>
            </View>
            <Text style={galleryStyles.cardMeta}>
              {formatBytes(item.sizeBytes || 0)}
            </Text>
            {dateStr ? (
              <>
                <Text style={galleryStyles.cardMetaDot}>•</Text>
                <Text style={galleryStyles.cardMeta}>
                  {dateStr}
                </Text>
              </>
            ) : null}
          </View>
        </View>

        {/* Actions: Copy, Share & Delete */}
        <View style={galleryStyles.listActionsRow}>
          <TouchableOpacity
            onPress={() => handleCopyItemUri(item)}
            style={galleryStyles.listActionBtn}
            hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
            <CopyIcon size={13} color={AppColors.grayText} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleShareItem(item)}
            style={galleryStyles.listActionBtn}
            hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
            <ShareIcon size={13} color={AppColors.sky600} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleDeleteItem(item)}
            style={galleryStyles.listActionBtn}
            hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
            <TrashIcon size={13} color={AppColors.red500} />
          </TouchableOpacity>
        </View>
      </TouchableScale>
    );
  };

  return (
    <View style={galleryStyles.container}>
      {/* ─── Top Studio Navigation Bar ─── */}
      <View style={galleryStyles.topHeaderBar}>
        <TouchableOpacity
          onPress={() => switchActiveTab('apis')}
          style={galleryStyles.backToTabBtn}
          accessibilityLabel="Back to Inspector"
          hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
          <WhiteBackNavigation size={14} color={AppColors.purple} />
          <Text style={galleryStyles.backToTabText}>
            {t('common.back', 'Back')}
          </Text>
        </TouchableOpacity>

        <View style={galleryStyles.headerCenterTitle}>
          <ScreencastIcon size={15} color={AppColors.purple} />
          <Text style={galleryStyles.headerStudioTitle}>
            {t('tabs.media', 'Screencast')}
          </Text>
          {counts.all > 0 && (
            <View style={galleryStyles.headerBadge}>
              <Text style={galleryStyles.headerBadgeText}>{counts.all}</Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          onPress={() => switchActiveTab('apis')}
          style={galleryStyles.closeCircleBtn}
          accessibilityLabel="Close Screencast"
          hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
          <CloseWhite size={12} color={AppColors.grayTextStrong} />
        </TouchableOpacity>
      </View>

      {/* ─── Active Recording Indicator Banner ─── */}
      {isRecording && (
        <View style={galleryStyles.recordingBanner}>
          <View style={galleryStyles.recordingDot} />
          <Text style={galleryStyles.recordingBannerText}>
            {t('header.recordingScreen', 'Screen Recording Active')} • {formatTimer(recordingSeconds)}
          </Text>
          <TouchableOpacity
            onPress={handleToggleVideoRecording}
            style={galleryStyles.stopRecordBtn}
            activeOpacity={0.8}>
            <View style={galleryStyles.stopSquare} />
            <Text style={galleryStyles.stopRecordBtnText}>Stop & Save</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ─── Quick Capture Hero Action Buttons Bar ─── */}
      <View style={galleryStyles.quickActionsBar}>
        <TouchableScale
          onPress={handleTakeScreenshot}
          style={[galleryStyles.quickBtn, {backgroundColor: `${AppColors.purple}10`, borderColor: `${AppColors.purple}30`}]}>
          <CameraIcon size={14} color={AppColors.purple} />
          <Text style={[galleryStyles.quickBtnText, {color: AppColors.purple}]}>
            {t('header.screenshot', 'Screenshot')}
          </Text>
        </TouchableScale>

        <TouchableScale
          onPress={handleToggleVideoRecording}
          style={[
            galleryStyles.quickBtn,
            isRecording
              ? {backgroundColor: `${AppColors.red500}18`, borderColor: AppColors.red500}
              : {backgroundColor: `${AppColors.sky600}10`, borderColor: `${AppColors.sky600}30`},
          ]}>
          <VideoCameraIcon size={14} color={isRecording ? AppColors.red500 : AppColors.sky600} />
          <Text style={[galleryStyles.quickBtnText, {color: isRecording ? AppColors.red500 : AppColors.sky600}]}>
            {isRecording ? `Stop (${formatTimer(recordingSeconds)})` : t('header.videoRecord', 'Record Video')}
          </Text>
        </TouchableScale>

        <TouchableScale
          onPress={handleOpenPicker}
          style={[galleryStyles.quickBtn, {backgroundColor: `${AppColors.emerald500}10`, borderColor: `${AppColors.emerald500}30`}]}>
          <CameraRollIcon size={14} color={AppColors.green600} />
          <Text style={[galleryStyles.quickBtnText, {color: AppColors.green600}]}>
            {t('common.import', 'Import')}
          </Text>
        </TouchableScale>
      </View>

      {/* ─── Filter Tabs & View Toggle Bar ─── */}
      <View style={galleryStyles.filterBar}>
        <View style={galleryStyles.chipGroup}>
          {[
            {key: 'all' as const, label: t('common.all', 'All'), count: counts.all},
            {key: 'image' as const, label: t('mediaGallery.photos', 'Photos'), count: counts.image},
            {key: 'video' as const, label: t('mediaGallery.videos', 'Videos'), count: counts.video},
            {key: 'gif' as const, label: t('mediaGallery.gifs', 'GIFs'), count: counts.gif},
          ].map(tab => {
            const isActive = selectedFilter === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                onPress={() => {
                  triggerNativeHaptic('light');
                  setSelectedFilter(tab.key);
                }}
                style={[
                  galleryStyles.chip,
                  isActive && galleryStyles.chipActive,
                ]}>
                <Text
                  style={[
                    galleryStyles.chipText,
                    isActive && galleryStyles.chipTextActive,
                  ]}>
                  {tab.label}
                </Text>
                <View
                  style={[
                    galleryStyles.chipBadge,
                    isActive && galleryStyles.chipBadgeActive,
                  ]}>
                  <Text
                    style={[
                      galleryStyles.chipBadgeText,
                      isActive && galleryStyles.chipBadgeTextActive,
                    ]}>
                    {tab.count}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* View Mode Toggle Button Group */}
        <View style={galleryStyles.viewToggleContainer}>
          <TouchableOpacity
            onPress={() => {
              triggerNativeHaptic('light');
              setViewMode('grid');
            }}
            style={[
              galleryStyles.viewToggleBtn,
              viewMode === 'grid' && galleryStyles.viewToggleBtnActive,
            ]}>
            <GridIcon size={13} color={viewMode === 'grid' ? AppColors.white : AppColors.grayText} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              triggerNativeHaptic('light');
              setViewMode('list');
            }}
            style={[
              galleryStyles.viewToggleBtn,
              viewMode === 'list' && galleryStyles.viewToggleBtnActive,
            ]}>
            <ListIcon size={13} color={viewMode === 'list' ? AppColors.white : AppColors.grayText} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ─── Batch Action Sub-Bar ─── */}
      {mediaList.length > 0 && (
        <View style={galleryStyles.subBar}>
          <View style={galleryStyles.resultCountWrapper}>
            <Text
              style={[
                galleryStyles.resultCountText,
                selectedIds.size > 0 && galleryStyles.resultCountTextSelected,
              ]}>
              {selectedIds.size > 0
                ? `${selectedIds.size} of ${filteredMedia.length} selected`
                : `${filteredMedia.length} ${filteredMedia.length === 1 ? 'item' : 'items'} • ${formatBytes(totalStorageBytes)}`}
            </Text>
          </View>

          <View style={galleryStyles.actionsGroup}>
            {selectedIds.size > 0 ? (
              <>
                <TouchableOpacity
                  onPress={handleCopySelectedUris}
                  style={galleryStyles.copySelectedBtn}
                  hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
                  <CopyIcon size={11} color={AppColors.grayTextStrong} />
                  <Text style={galleryStyles.copySelectedBtnText}>
                    Copy
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleShareSelected}
                  style={galleryStyles.shareSelectedBtn}
                  hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
                  <ShareIcon size={11} color={AppColors.sky600} />
                  <Text style={galleryStyles.shareSelectedBtnText}>
                    Share
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleDeleteSelected}
                  style={galleryStyles.deleteBtn}
                  hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
                  <TrashIcon size={11} color={AppColors.red500} />
                  <Text style={galleryStyles.deleteBtnText}>
                    Delete ({selectedIds.size})
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity
                onPress={handleClearAll}
                style={galleryStyles.clearBtn}
                hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
                <TrashIcon size={11} color={AppColors.red500} />
                <Text style={galleryStyles.clearBtnText}>
                  Purge All
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* ─── Media Items Grid/List or Polished Studio Empty State ─── */}
      <FlatList
        key={viewMode}
        data={filteredMedia}
        keyExtractor={item => item.id}
        renderItem={viewMode === 'grid' ? renderGridItem : renderListItem}
        numColumns={viewMode === 'grid' ? 2 : 1}
        columnWrapperStyle={viewMode === 'grid' ? galleryStyles.columnWrapper : undefined}
        style={{flex: 1}}
        contentContainerStyle={[
          galleryStyles.listContent,
          {flexGrow: 1},
        ]}
        nestedScrollEnabled={true}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={AppColors.purple} />
        }
        ListEmptyComponent={
          <View style={galleryStyles.emptyHeroCard}>
            <View style={galleryStyles.emptyIconCircle}>
              <ScreencastIcon size={32} color={AppColors.purple} />
            </View>

            <Text style={galleryStyles.emptyHeroTitle}>
              {selectedFilter === 'image'
                ? 'No Screenshots Yet'
                : selectedFilter === 'video'
                ? 'No Screen Recordings Yet'
                : selectedFilter === 'gif'
                ? 'No Animated GIFs Yet'
                : 'Screencast & Media Studio'}
            </Text>

            <Text style={galleryStyles.emptyHeroSubtitle}>
              {selectedFilter === 'image'
                ? 'Take a full-screen application snapshot or import photos from your device library.'
                : selectedFilter === 'video'
                ? 'Record high-FPS screen videos with audio narration to reproduce and debug issues.'
                : 'Capture pixel-perfect screenshots, record 60fps screen videos, and export GIF animations with zero background overhead.'}
            </Text>

            {/* 3 Interactive Quick Launch Studio Cards */}
            <View style={galleryStyles.emptyActionsGrid}>
              <TouchableScale
                onPress={handleTakeScreenshot}
                style={galleryStyles.emptyActionCard}>
                <View style={[galleryStyles.actionCardIconBox, {backgroundColor: `${AppColors.purple}14`}]}>
                  <CameraIcon size={18} color={AppColors.purple} />
                </View>
                <View style={galleryStyles.actionCardTextBox}>
                  <Text style={galleryStyles.actionCardTitle}>Take Screenshot</Text>
                  <Text style={galleryStyles.actionCardDesc}>Full-window lossless PNG</Text>
                </View>
              </TouchableScale>

              <TouchableScale
                onPress={handleToggleVideoRecording}
                style={galleryStyles.emptyActionCard}>
                <View style={[galleryStyles.actionCardIconBox, {backgroundColor: `${AppColors.sky600}14`}]}>
                  <VideoCameraIcon size={18} color={AppColors.sky600} />
                </View>
                <View style={galleryStyles.actionCardTextBox}>
                  <Text style={galleryStyles.actionCardTitle}>Record Screen Video</Text>
                  <Text style={galleryStyles.actionCardDesc}>High-FPS MP4 with audio</Text>
                </View>
              </TouchableScale>

              <TouchableScale
                onPress={handleOpenPicker}
                style={galleryStyles.emptyActionCard}>
                <View style={[galleryStyles.actionCardIconBox, {backgroundColor: `${AppColors.emerald500}14`}]}>
                  <CameraRollIcon size={18} color={AppColors.green600} />
                </View>
                <View style={galleryStyles.actionCardTextBox}>
                  <Text style={galleryStyles.actionCardTitle}>Import from Camera Roll</Text>
                  <Text style={galleryStyles.actionCardDesc}>Device photos & videos</Text>
                </View>
              </TouchableScale>
            </View>

            {/* Micro Feature Highlights Footer */}
            <View style={galleryStyles.featurePillsRow}>
              <View style={galleryStyles.featurePill}>
                <Text style={galleryStyles.featurePillText}>⚡ Zero Overhead</Text>
              </View>
              <View style={galleryStyles.featurePill}>
                <Text style={galleryStyles.featurePillText}>✂️ Crop & Annotate</Text>
              </View>
              <View style={galleryStyles.featurePill}>
                <Text style={galleryStyles.featurePillText}>🎞️ Convert to GIF</Text>
              </View>
            </View>
          </View>
        }
      />

      {/* Fullscreen Preview Modal */}
      <MediaPreviewModal
        item={previewMediaItem}
        visible={!!previewMediaItem}
        onClose={() => setPreviewMediaItem(null)}
        onDelete={handleDeleteItem}
        onConvertToGif={handleConvertToGif}
      />

      {/* Confirmation Modal */}
      <ConfirmationModal
        visible={confirmConfig.visible}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmText={confirmConfig.confirmText}
        cancelText={confirmConfig.cancelText}
        isDestructive={true}
        icon="trash"
        onConfirm={confirmConfig.onConfirm}
        onCancel={() => setConfirmConfig(prev => ({...prev, visible: false}))}
      />
    </View>
  );
};

const {width: WINDOW_WIDTH} = Dimensions.get('window');
const CARD_WIDTH = (WINDOW_WIDTH - 36) / 2;

const galleryStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.grayBackground,
  },
  topHeaderBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: AppColors.primaryLight,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.grayBorderSecondary,
  },
  backToTabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: `${AppColors.purple}12`,
  },
  backToTabText: {
    fontFamily: AppFonts.interBold,
    fontSize: 11.5,
    color: AppColors.purple,
  },
  headerCenterTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerStudioTitle: {
    fontFamily: AppFonts.interBold,
    fontSize: 13.5,
    color: AppColors.grayTextStrong,
  },
  headerBadge: {
    backgroundColor: `${AppColors.purple}1A`,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 10,
  },
  headerBadgeText: {
    fontFamily: AppFonts.interBold,
    fontSize: 9.5,
    color: AppColors.purple,
  },
  closeCircleBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: AppColors.grayBackground,
    borderWidth: 1,
    borderColor: AppColors.grayBorderSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: `${AppColors.red500}15`,
    borderBottomWidth: 1,
    borderBottomColor: `${AppColors.red500}30`,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: AppColors.red500,
    marginRight: 6,
  },
  recordingBannerText: {
    fontFamily: AppFonts.interBold,
    fontSize: 12,
    color: AppColors.red500,
    flex: 1,
  },
  stopRecordBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: AppColors.red500,
    paddingHorizontal: 10,
    paddingVertical: 4.5,
    borderRadius: 6,
  },
  stopSquare: {
    width: 8,
    height: 8,
    backgroundColor: AppColors.white,
    borderRadius: 1,
  },
  stopRecordBtnText: {
    fontFamily: AppFonts.interBold,
    fontSize: 11,
    color: AppColors.white,
  },
  quickActionsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 6,
  },
  quickBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 7,
    paddingHorizontal: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  quickBtnText: {
    fontFamily: AppFonts.interBold,
    fontSize: 11,
  },
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.grayBorderSecondary,
    gap: 8,
  },
  chipGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 1,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4.5,
    borderRadius: 8,
    backgroundColor: AppColors.primaryLight,
    borderWidth: 1,
    borderColor: AppColors.grayBorderSecondary,
  },
  chipActive: {
    backgroundColor: `${AppColors.purple}14`,
    borderColor: AppColors.purple,
  },
  chipText: {
    fontFamily: AppFonts.interMedium,
    fontSize: 11,
    color: AppColors.grayText,
  },
  chipTextActive: {
    fontFamily: AppFonts.interBold,
    color: AppColors.purple,
  },
  chipBadge: {
    backgroundColor: AppColors.grayBackground,
    paddingHorizontal: 4.5,
    paddingVertical: 1,
    borderRadius: 6,
  },
  chipBadgeActive: {
    backgroundColor: AppColors.purple,
  },
  chipBadgeText: {
    fontFamily: AppFonts.interBold,
    fontSize: 9,
    color: AppColors.grayTextWeak,
  },
  chipBadgeTextActive: {
    color: AppColors.white,
  },
  viewToggleContainer: {
    flexDirection: 'row',
    backgroundColor: AppColors.primaryLight,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: AppColors.grayBorderSecondary,
    padding: 2,
  },
  viewToggleBtn: {
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 6,
  },
  viewToggleBtnActive: {
    backgroundColor: AppColors.purple,
  },
  subBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 6.5,
    backgroundColor: AppColors.primaryLight,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.grayBorderSecondary,
  },
  resultCountWrapper: {
    flex: 1,
  },
  resultCountText: {
    fontFamily: AppFonts.interMedium,
    fontSize: 11,
    color: AppColors.grayTextWeak,
  },
  resultCountTextSelected: {
    fontFamily: AppFonts.interBold,
    color: AppColors.purple,
  },
  actionsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  copySelectedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3.5,
    paddingHorizontal: 7,
    paddingVertical: 3.5,
    borderRadius: 6,
    backgroundColor: AppColors.grayBackground,
    borderWidth: 1,
    borderColor: AppColors.grayBorderSecondary,
  },
  copySelectedBtnText: {
    fontFamily: AppFonts.interBold,
    fontSize: 10,
    color: AppColors.grayTextStrong,
  },
  shareSelectedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3.5,
    paddingHorizontal: 7,
    paddingVertical: 3.5,
    borderRadius: 6,
    backgroundColor: `${AppColors.sky600}14`,
    borderWidth: 1,
    borderColor: `${AppColors.sky600}30`,
  },
  shareSelectedBtnText: {
    fontFamily: AppFonts.interBold,
    fontSize: 10,
    color: AppColors.sky600,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3.5,
    paddingHorizontal: 7,
    paddingVertical: 3.5,
    borderRadius: 6,
    backgroundColor: `${AppColors.red500}14`,
    borderWidth: 1,
    borderColor: `${AppColors.red500}30`,
  },
  deleteBtnText: {
    fontFamily: AppFonts.interBold,
    fontSize: 10,
    color: AppColors.red500,
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3.5,
    paddingHorizontal: 7,
    paddingVertical: 3.5,
    borderRadius: 6,
    backgroundColor: `${AppColors.red500}10`,
  },
  clearBtnText: {
    fontFamily: AppFonts.interBold,
    fontSize: 10,
    color: AppColors.red500,
  },
  listContent: {
    padding: 12,
    paddingBottom: 40,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: AppColors.primaryLight,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AppColors.grayBorderSecondary,
    overflow: 'hidden',
    shadowColor: AppColors.black,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  cardSelected: {
    borderColor: AppColors.purple,
    borderWidth: 2,
  },
  thumbnailContainer: {
    width: '100%',
    height: 110,
    backgroundColor: AppColors.grayBackground,
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  thumbnailFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkbox: {
    position: 'absolute',
    top: 7,
    left: 7,
    width: 19,
    height: 19,
    borderRadius: 5,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    borderWidth: 1.5,
    borderColor: AppColors.white,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  checkboxSelected: {
    backgroundColor: AppColors.purple,
    borderColor: AppColors.purple,
  },
  miniPlayCircle: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{translateX: -16}, {translateY: -16}],
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeBadge: {
    position: 'absolute',
    top: 7,
    right: 7,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  typeBadgeText: {
    fontFamily: AppFonts.interBold,
    fontSize: 8.5,
    color: AppColors.white,
    letterSpacing: 0.3,
  },
  durationBadge: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  durationBadgeText: {
    fontFamily: AppFonts.interBold,
    fontSize: 9,
    color: AppColors.white,
  },
  cardInfo: {
    padding: 8,
    gap: 4,
  },
  cardTitle: {
    fontFamily: AppFonts.interSemiBold,
    fontSize: 11,
    color: AppColors.grayTextStrong,
  },
  cardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardMeta: {
    fontFamily: AppFonts.interRegular,
    fontSize: 10,
    color: AppColors.grayTextWeak,
  },
  cardMetaDot: {
    fontSize: 9,
    color: AppColors.grayTextWeak,
  },
  gridCopyBtn: {
    padding: 2,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.primaryLight,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: AppColors.grayBorderSecondary,
    padding: 8,
    marginBottom: 8,
    gap: 10,
  },
  listRowSelected: {
    borderColor: AppColors.purple,
    borderWidth: 1.5,
  },
  listCheckbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: AppColors.grayBorderSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listThumbContainer: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: AppColors.grayBackground,
    overflow: 'hidden',
    position: 'relative',
  },
  listThumb: {
    width: '100%',
    height: '100%',
  },
  listThumbFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listMiniPlay: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    borderRadius: 3,
    padding: 1.5,
  },
  listInfo: {
    flex: 1,
    gap: 3,
  },
  listTitle: {
    fontFamily: AppFonts.interSemiBold,
    fontSize: 12,
    color: AppColors.grayTextStrong,
  },
  listMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  listBadge: {
    paddingHorizontal: 4.5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  listBadgeText: {
    fontFamily: AppFonts.interBold,
    fontSize: 9,
    letterSpacing: 0.3,
  },
  listActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  listActionBtn: {
    padding: 5,
    borderRadius: 6,
    backgroundColor: AppColors.grayBackground,
  },
  emptyHeroCard: {
    backgroundColor: AppColors.primaryLight,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: AppColors.grayBorderSecondary,
    padding: 20,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: AppColors.black,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: `${AppColors.purple}14`,
    borderWidth: 1,
    borderColor: `${AppColors.purple}25`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyHeroTitle: {
    fontFamily: AppFonts.interBold,
    fontSize: 16,
    color: AppColors.grayTextStrong,
    textAlign: 'center',
    marginBottom: 6,
  },
  emptyHeroSubtitle: {
    fontFamily: AppFonts.interRegular,
    fontSize: 12,
    lineHeight: 17,
    color: AppColors.grayText,
    textAlign: 'center',
    marginBottom: 18,
    paddingHorizontal: 8,
  },
  emptyActionsGrid: {
    width: '100%',
    gap: 8,
    marginBottom: 16,
  },
  emptyActionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.grayBackground,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: AppColors.grayBorderSecondary,
    padding: 10,
    gap: 12,
  },
  actionCardIconBox: {
    width: 38,
    height: 38,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionCardTextBox: {
    flex: 1,
    gap: 1.5,
  },
  actionCardTitle: {
    fontFamily: AppFonts.interBold,
    fontSize: 12.5,
    color: AppColors.grayTextStrong,
  },
  actionCardDesc: {
    fontFamily: AppFonts.interRegular,
    fontSize: 10.5,
    color: AppColors.grayTextWeak,
  },
  featurePillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    flexWrap: 'wrap',
    paddingTop: 4,
  },
  featurePill: {
    backgroundColor: AppColors.grayBackground,
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AppColors.grayBorderSecondary,
  },
  featurePillText: {
    fontFamily: AppFonts.interMedium,
    fontSize: 9.5,
    color: AppColors.grayTextWeak,
  },
});
