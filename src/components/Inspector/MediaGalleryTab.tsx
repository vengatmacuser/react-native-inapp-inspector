import React, {useState, useEffect, useMemo, useCallback} from 'react';
import {
  Alert,
  Dimensions,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {AppColors} from '../../styles/AppColors';
import {AppFonts} from '../../styles/AppFonts';
import TouchableScale from '../TouchableScale';
import EmptyState from '../EmptyState';
import {
  CameraIcon,
  FilmIcon,
  GifIcon,
  ImageIcon,
  SendIcon,
  TrashIcon,
  VideoCameraIcon,
} from '../NetworkIcons';
import {MediaPreviewModal} from './MediaPreviewModal';
import {
  ScreenCapture,
  CapturedMediaItem,
} from '../../capture';
import {formatBytes} from '../../helpers';
import {showToast} from '../../helpers/toast';
import {useTranslation} from '../../i18n';

export const MediaGalleryTab: React.FC = () => {
  const {t} = useTranslation();
  const [mediaList, setMediaList] = useState<CapturedMediaItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'image' | 'video' | 'gif'>('all');
  const [selectedItem, setSelectedItem] = useState<CapturedMediaItem | null>(null);

  const loadMedia = useCallback(async () => {
    try {
      const items = await ScreenCapture.getMediaList();
      setMediaList(items);
    } catch {
      setMediaList([]);
    }
  }, []);

  useEffect(() => {
    loadMedia();
  }, [loadMedia]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMedia();
    setRefreshing(false);
  };

  const filteredMedia = useMemo(() => {
    if (selectedFilter === 'all') return mediaList;
    return mediaList.filter(item => item.type === selectedFilter);
  }, [mediaList, selectedFilter]);

  const totalStorageBytes = useMemo(() => {
    return mediaList.reduce((sum, item) => sum + (item.sizeBytes || 0), 0);
  }, [mediaList]);

  const handleDeleteItem = async (item: CapturedMediaItem) => {
    await ScreenCapture.deleteMedia(item.uri);
    await loadMedia();
    showToast(t('mediaGallery.deleted'));
  };

  const handleClearAll = () => {
    Alert.alert(
      t('mediaGallery.purgeTitle'),
      t('mediaGallery.purgeMessage', {count: mediaList.length, size: formatBytes(totalStorageBytes)}),
      [
        {text: t('common.cancel'), style: 'cancel'},
        {
          text: t('common.clearAll'),
          style: 'destructive',
          onPress: async () => {
            await ScreenCapture.clearAllMedia();
            await loadMedia();
            showToast(t('mediaGallery.allPurged'));
          },
        },
      ],
    );
  };

  const handleConvertToGif = async (item: CapturedMediaItem) => {
    const gifResult = await ScreenCapture.convertToGif(item.uri, {fps: 12, width: 480});
    if (gifResult) {
      await loadMedia();
    }
  };

  const renderItem = ({item}: {item: CapturedMediaItem}) => {
    const isVideo = item.type === 'video';
    const isGif = item.type === 'gif';

    return (
      <TouchableScale
        onPress={() => setSelectedItem(item)}
        style={galleryStyles.card}>
        <View style={galleryStyles.thumbnailContainer}>
          <Image
            source={{uri: item.uri}}
            style={galleryStyles.thumbnail}
            resizeMode="cover"
          />
          <View style={galleryStyles.typeBadge}>
            {isVideo ? (
              <FilmIcon size={11} color={AppColors.sky400} />
            ) : isGif ? (
              <GifIcon size={11} color={AppColors.warningAmber} />
            ) : (
              <ImageIcon size={11} color={AppColors.emerald500} />
            )}
            <Text style={galleryStyles.typeBadgeText}>
              {item.format.toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={galleryStyles.cardInfo}>
          <Text style={galleryStyles.cardTitle} numberOfLines={1}>
            {item.filename}
          </Text>
          <View style={galleryStyles.cardMetaRow}>
            <Text style={galleryStyles.cardMeta}>
              {formatBytes(item.sizeBytes)}
            </Text>
            <Text style={galleryStyles.cardMetaDot}>•</Text>
            <Text style={galleryStyles.cardMeta}>
              {new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}
            </Text>
          </View>
        </View>
      </TouchableScale>
    );
  };

  return (
    <View style={galleryStyles.container}>
      {/* Top Bar with Filter Chips and Clear All */}
      <View style={galleryStyles.filterBar}>
        <View style={galleryStyles.chipGroup}>
          {(['all', 'image', 'video', 'gif'] as const).map(filterKey => {
            const isActive = selectedFilter === filterKey;
            const label =
              filterKey === 'all'
                ? t('mediaGallery.all', {count: mediaList.length})
                : filterKey === 'image'
                ? t('mediaGallery.photos')
                : filterKey === 'video'
                ? t('mediaGallery.videos')
                : t('mediaGallery.gifs');

            return (
              <TouchableOpacity
                key={filterKey}
                onPress={() => setSelectedFilter(filterKey)}
                style={[
                  galleryStyles.chip,
                  isActive && galleryStyles.chipActive,
                ]}>
                <Text
                  style={[
                    galleryStyles.chipText,
                    isActive && galleryStyles.chipTextActive,
                  ]}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {mediaList.length > 0 && (
          <TouchableOpacity
            onPress={handleClearAll}
            style={galleryStyles.clearBtn}
            hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
            <TrashIcon size={13} color={AppColors.red500} />
            <Text style={galleryStyles.clearBtnText}>{t('mediaGallery.purge', {size: formatBytes(totalStorageBytes)})}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Grid of Media Items */}
      <FlatList
        data={filteredMedia}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        numColumns={2}
        columnWrapperStyle={galleryStyles.columnWrapper}
        contentContainerStyle={galleryStyles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={AppColors.sky400} />
        }
        ListEmptyComponent={
          <EmptyState
            customTitle={t('mediaGallery.noMediaTitle')}
            customSub={t('mediaGallery.noMediaDesc')}
          />
        }
      />


      {/* Fullscreen Preview Modal */}
      <MediaPreviewModal
        item={selectedItem}
        visible={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        onDelete={handleDeleteItem}
        onConvertToGif={handleConvertToGif}
      />
    </View>
  );
};

const {width: WINDOW_WIDTH} = Dimensions.get('window');
const CARD_WIDTH = (WINDOW_WIDTH - 36) / 2;

const galleryStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.slate850,
  },
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.borderGlassLight,
    flexWrap: 'wrap',
    gap: 8,
  },
  chipGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chip: {
    paddingHorizontal: 9,
    paddingVertical: 4.5,
    borderRadius: 6,
    backgroundColor: AppColors.whiteAlpha06,
    borderWidth: 1,
    borderColor: AppColors.whiteAlpha10,
  },
  chipActive: {
    backgroundColor: `${AppColors.sky400}2E`,
    borderColor: AppColors.sky400,
  },
  chipText: {
    fontFamily: AppFonts.interMedium,
    fontSize: 11,
    color: AppColors.slate400,
  },
  chipTextActive: {
    fontFamily: AppFonts.interBold,
    color: AppColors.sky400,
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: `${AppColors.red500}1F`,
    borderWidth: 1,
    borderColor: `${AppColors.red500}4D`,
  },
  clearBtnText: {
    fontFamily: AppFonts.interMedium,
    fontSize: 10.5,
    color: AppColors.red500,
  },
  listContent: {
    padding: 12,
    gap: 12,
  },
  columnWrapper: {
    gap: 12,
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: AppColors.slate800,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: AppColors.borderGlassLight,
    overflow: 'hidden',
  },
  thumbnailContainer: {
    width: '100%',
    height: 110,
    backgroundColor: AppColors.slate850,
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  typeBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: AppColors.badgeGlassDark,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: AppColors.borderGlassMedium,
  },
  typeBadgeText: {
    fontFamily: AppFonts.interBold,
    fontSize: 9,
    color: AppColors.slate200,
  },
  cardInfo: {
    padding: 8,
    gap: 3,
  },
  cardTitle: {
    fontFamily: AppFonts.interMedium,
    fontSize: 11.5,
    color: AppColors.white,
  },
  cardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cardMeta: {
    fontFamily: AppFonts.interRegular,
    fontSize: 10,
    color: AppColors.slate400,
  },
  cardMetaDot: {
    fontSize: 10,
    color: AppColors.whiteAlpha30,
  },
});
