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
  CheckIcon,
  FilmIcon,
  GifIcon,
  GridIcon,
  ImageIcon,
  ListIcon,
  PlayIcon,
  ScreencastIcon,
  TrashIcon,
} from '../NetworkIcons';
import {MediaPreviewModal} from './MediaPreviewModal';
import {
  ScreenCapture,
  CapturedMediaItem,
} from '../../capture';
import {formatBytes} from '../../helpers';
import {showToast} from '../../helpers/toast';
import {useTranslation} from '../../i18n';

import {useInspector} from './InspectorContext';

export const MediaGalleryTab: React.FC = () => {
  const {t} = useTranslation();
  const {refreshMediaCount, switchActiveTab} = useInspector();
  const [mediaList, setMediaList] = useState<CapturedMediaItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'image' | 'video' | 'gif'>('all');
  const [selectedItem, setSelectedItem] = useState<CapturedMediaItem | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

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

  const toggleSelect = useCallback((id: string) => {
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
    await ScreenCapture.deleteMedia(item.uri);
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.delete(item.id);
      return next;
    });
    await loadMedia();
    const count = await refreshMediaCount?.();
    if (count === 0) {
      switchActiveTab('apis');
    }
    showToast(t('mediaGallery.deleted'));
  };

  const handleDeleteSelected = () => {
    const count = selectedIds.size;
    if (count === 0) return;

    Alert.alert(
      t('mediaGallery.deleteSelectedTitle'),
      t('mediaGallery.deleteSelectedMessage', {count}),
      [
        {text: t('common.cancel'), style: 'cancel'},
        {
          text: t('mediaGallery.delete'),
          style: 'destructive',
          onPress: async () => {
            const itemsToDelete = mediaList.filter(item => selectedIds.has(item.id));
            for (const item of itemsToDelete) {
              await ScreenCapture.deleteMedia(item.uri);
            }
            setSelectedIds(new Set());
            await loadMedia();
            const remainingCount = await refreshMediaCount?.();
            if (remainingCount === 0) {
              switchActiveTab('apis');
            }
            showToast(t('mediaGallery.deletedCount', {count: itemsToDelete.length}));
          },
        },
      ],
    );
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
            setSelectedIds(new Set());
            await loadMedia();
            await refreshMediaCount?.();
            switchActiveTab('apis');
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
      refreshMediaCount?.().catch(() => {});
    }
  };

  const renderFilterIcon = (filterKey: 'all' | 'image' | 'video' | 'gif', isActive: boolean) => {
    const iconColor = isActive ? AppColors.sky400 : AppColors.slate400;
    const iconSize = 12;

    switch (filterKey) {
      case 'all':
        return <ScreencastIcon size={iconSize} color={iconColor} />;
      case 'image':
        return <ImageIcon size={iconSize} color={iconColor} />;
      case 'video':
        return <FilmIcon size={iconSize} color={iconColor} />;
      case 'gif':
        return <GifIcon size={iconSize} color={iconColor} />;
    }
  };

  const renderGridItem = ({item}: {item: CapturedMediaItem}) => {
    const isVideo = item.type === 'video';
    const isGif = item.type === 'gif';
    const thumbUri = isVideo ? item.thumbnailUri : item.uri;
    const isSelected = selectedIds.has(item.id);

    return (
      <TouchableScale
        onPress={() => setSelectedItem(item)}
        style={[galleryStyles.card, isSelected && galleryStyles.cardSelected]}>
        <View style={galleryStyles.thumbnailContainer}>
          {thumbUri ? (
            <Image
              source={{uri: thumbUri}}
              style={galleryStyles.thumbnail}
              resizeMode="cover"
            />
          ) : (
            <View style={galleryStyles.thumbnailFallback}>
              {isVideo ? (
                <FilmIcon size={26} color={AppColors.sky400} />
              ) : (
                <ImageIcon size={26} color={AppColors.slate400} />
              )}
            </View>
          )}

          {/* Checkbox top-left */}
          <TouchableOpacity
            onPress={() => toggleSelect(item.id)}
            style={[
              galleryStyles.checkbox,
              isSelected && galleryStyles.checkboxSelected,
            ]}
            hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
            {isSelected && <CheckIcon size={12} color={AppColors.white} />}
          </TouchableOpacity>

          {isVideo && (
            <View style={galleryStyles.miniPlayCircle}>
              <PlayIcon size={14} color={AppColors.white} />
            </View>
          )}
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

  const renderListItem = ({item}: {item: CapturedMediaItem}) => {
    const isVideo = item.type === 'video';
    const isGif = item.type === 'gif';
    const thumbUri = isVideo ? item.thumbnailUri : item.uri;
    const isSelected = selectedIds.has(item.id);

    return (
      <TouchableScale
        onPress={() => setSelectedItem(item)}
        style={[galleryStyles.listRow, isSelected && galleryStyles.listRowSelected]}>
        {/* Checkbox */}
        <TouchableOpacity
          onPress={() => toggleSelect(item.id)}
          style={[
            galleryStyles.listCheckbox,
            isSelected && galleryStyles.checkboxSelected,
          ]}
          hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
          {isSelected && <CheckIcon size={12} color={AppColors.white} />}
        </TouchableOpacity>

        {/* Square Thumbnail */}
        <View style={galleryStyles.listThumbContainer}>
          {thumbUri ? (
            <Image
              source={{uri: thumbUri}}
              style={galleryStyles.listThumb}
              resizeMode="cover"
            />
          ) : (
            <View style={galleryStyles.listThumbFallback}>
              {isVideo ? (
                <FilmIcon size={18} color={AppColors.sky400} />
              ) : (
                <ImageIcon size={18} color={AppColors.slate400} />
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
            {item.filename}
          </Text>
          <View style={galleryStyles.listMetaRow}>
            <View style={galleryStyles.listBadge}>
              {isVideo ? (
                <FilmIcon size={10} color={AppColors.sky400} />
              ) : isGif ? (
                <GifIcon size={10} color={AppColors.warningAmber} />
              ) : (
                <ImageIcon size={10} color={AppColors.emerald500} />
              )}
              <Text style={galleryStyles.listBadgeText}>
                {item.format.toUpperCase()}
              </Text>
            </View>
            <Text style={galleryStyles.cardMeta}>
              {formatBytes(item.sizeBytes)}
            </Text>
            <Text style={galleryStyles.cardMetaDot}>•</Text>
            <Text style={galleryStyles.cardMeta}>
              {new Date(item.timestamp).toLocaleDateString([], {month: 'short', day: 'numeric'})}{' '}
              {new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}
            </Text>
          </View>
        </View>

        {/* Delete button */}
        <TouchableOpacity
          onPress={() => handleDeleteItem(item)}
          style={galleryStyles.listDeleteBtn}
          hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
          <TrashIcon size={14} color={AppColors.red500} />
        </TouchableOpacity>
      </TouchableScale>
    );
  };

  return (
    <View style={galleryStyles.container}>
      {/* Top Bar with Filter Chips on Left & Grid/List Toggle on Right */}
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
                {renderFilterIcon(filterKey, isActive)}
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

        {/* View Mode Toggle Button Group */}
        <View style={galleryStyles.viewToggleContainer}>
          <TouchableOpacity
            onPress={() => setViewMode('grid')}
            style={[
              galleryStyles.viewToggleBtn,
              viewMode === 'grid' && galleryStyles.viewToggleBtnActive,
            ]}>
            <GridIcon size={13} color={viewMode === 'grid' ? AppColors.white : AppColors.slate400} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setViewMode('list')}
            style={[
              galleryStyles.viewToggleBtn,
              viewMode === 'list' && galleryStyles.viewToggleBtnActive,
            ]}>
            <ListIcon size={13} color={viewMode === 'list' ? AppColors.white : AppColors.slate400} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Sub Bar with Results Counter on Left & Actions on Right */}
      {mediaList.length > 0 && (
        <View style={galleryStyles.subBar}>
          <View style={galleryStyles.resultCountWrapper}>
            <Text
              style={[
                galleryStyles.resultCountText,
                selectedIds.size > 0 && galleryStyles.resultCountTextSelected,
              ]}>
              {selectedIds.size > 0
                ? t('mediaGallery.selectedOfResults', {
                    selected: selectedIds.size,
                    total: filteredMedia.length,
                    defaultValue: `Selected ${selectedIds.size} of ${filteredMedia.length} results`,
                  })
                : filteredMedia.length !== mediaList.length
                ? t('mediaGallery.showingFilteredResults', {
                    count: filteredMedia.length,
                    total: mediaList.length,
                    defaultValue: `Showing ${filteredMedia.length} of ${mediaList.length} results`,
                  })
                : t('mediaGallery.showingResults', {
                    count: filteredMedia.length,
                    defaultValue: `Showing ${filteredMedia.length} results`,
                  })}
            </Text>
          </View>

          <View style={galleryStyles.actionsGroup}>
            {selectedIds.size > 0 && (
              <TouchableOpacity
                onPress={handleDeleteSelected}
                style={galleryStyles.deleteBtn}
                hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
                <TrashIcon size={13} color={AppColors.red500} />
                <Text style={galleryStyles.deleteBtnText}>
                  {t('mediaGallery.deleteSelected', {count: selectedIds.size})}
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={handleClearAll}
              style={galleryStyles.clearBtn}
              hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
              <TrashIcon size={13} color={AppColors.red500} />
              <Text style={galleryStyles.clearBtnText}>
                {t('mediaGallery.purge', {size: formatBytes(totalStorageBytes)})}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Media Items (Grid or List) */}
      <FlatList
        key={viewMode}
        data={filteredMedia}
        keyExtractor={item => item.id}
        renderItem={viewMode === 'grid' ? renderGridItem : renderListItem}
        numColumns={viewMode === 'grid' ? 2 : 1}
        columnWrapperStyle={viewMode === 'grid' ? galleryStyles.columnWrapper : undefined}
        contentContainerStyle={galleryStyles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={AppColors.sky400} />
        }
        ListEmptyComponent={
          <EmptyState
            customTitle={t('mediaGallery.noMediaTitle')}
            customSub={t('mediaGallery.noMediaDesc')}
            showReload={false}
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
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.borderGlassLight,
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
    gap: 4.5,
    paddingHorizontal: 8,
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
  subBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: `${AppColors.slate900}99`,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.borderGlassLight,
    gap: 8,
  },
  resultCountWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
  },
  resultCountText: {
    fontFamily: AppFonts.interMedium,
    fontSize: 11,
    color: AppColors.slate400,
  },
  resultCountTextSelected: {
    fontFamily: AppFonts.interSemiBold,
    color: AppColors.sky400,
  },
  actionsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  viewToggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.whiteAlpha06,
    borderRadius: 6,
    padding: 2,
    borderWidth: 1,
    borderColor: AppColors.whiteAlpha10,
  },
  viewToggleBtn: {
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewToggleBtnActive: {
    backgroundColor: `${AppColors.violet600}80`,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: `${AppColors.red500}26`,
    borderWidth: 1,
    borderColor: `${AppColors.red500}80`,
  },
  deleteBtnText: {
    fontFamily: AppFonts.interBold,
    fontSize: 10.5,
    color: AppColors.red500,
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
    gap: 10,
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
  cardSelected: {
    borderColor: AppColors.violet600,
    borderWidth: 1.5,
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
  thumbnailFallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppColors.slate900,
  },
  checkbox: {
    position: 'absolute',
    top: 6,
    left: 6,
    width: 22,
    height: 22,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.65)',
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  checkboxSelected: {
    backgroundColor: AppColors.violet600,
    borderColor: AppColors.violet600,
  },
  miniPlayCircle: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 32,
    height: 32,
    marginTop: -16,
    marginLeft: -16,
    borderRadius: 16,
    backgroundColor: `${AppColors.sky400}D9`,
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
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
  /* List View Styles */
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.slate800,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: AppColors.borderGlassLight,
    padding: 8,
    gap: 10,
  },
  listRowSelected: {
    borderColor: AppColors.violet600,
    borderWidth: 1.5,
    backgroundColor: `${AppColors.violet600}14`,
  },
  listCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.65)',
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  listThumbContainer: {
    width: 46,
    height: 46,
    borderRadius: 6,
    backgroundColor: AppColors.slate850,
    overflow: 'hidden',
    position: 'relative',
  },
  listThumb: {
    width: '100%',
    height: '100%',
  },
  listThumbFallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppColors.slate900,
  },
  listMiniPlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 20,
    height: 20,
    marginTop: -10,
    marginLeft: -10,
    borderRadius: 10,
    backgroundColor: `${AppColors.sky400}D9`,
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 1,
  },
  listInfo: {
    flex: 1,
    gap: 4,
    minWidth: 0,
  },
  listTitle: {
    fontFamily: AppFonts.interMedium,
    fontSize: 12,
    color: AppColors.white,
  },
  listMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  listBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: AppColors.badgeGlassDark,
    paddingHorizontal: 4,
    paddingVertical: 1.5,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: AppColors.borderGlassMedium,
  },
  listBadgeText: {
    fontFamily: AppFonts.interBold,
    fontSize: 8.5,
    color: AppColors.slate200,
  },
  listDeleteBtn: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: `${AppColors.red500}14`,
    borderWidth: 1,
    borderColor: `${AppColors.red500}33`,
  },
});

