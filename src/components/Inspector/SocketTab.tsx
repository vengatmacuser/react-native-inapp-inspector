import React, {useCallback, useMemo, useRef, useState} from 'react';
import {
  Alert,
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {useInspector} from './InspectorContext';
import SocketCard from './SocketCard';
import SocketFilterModal, {
  DEFAULT_SOCKET_FILTERS,
  isSocketFiltersDefault,
} from './SocketFilterModal';
import {ConfirmationModal} from './ConfirmationModal';
import TouchableScale from '../TouchableScale';
import AnimatedEntrance from '../AnimatedEntrance';
import EmptyState from '../EmptyState';
import EndOfListFooter from '../EndOfListFooter';
import styles from '../../styles';
import {AppColors} from '../../styles/AppColors';
import {AppFonts} from '../../styles/AppFonts';
import {useTranslation} from '../../i18n';
import {copyToClipboard} from '../../helpers';
import {showToast} from '../../helpers/toast';
import {
  ClearIcon,
  SearchIcon,
  TrashIcon,
  WebsocketIcon,
  BoltIcon,
  FilterIcon,
  GlobeIcon,
  LockIcon,
  ClockIcon,
  FailIcon,
  CopyIcon,
  ShareIcon,
} from '../NetworkIcons';
import type {SocketConnectionRecord, SocketFilterState} from '../../types';

const LOAD_MORE_STEP = 10;

const SocketTab = React.memo(() => {
  const {t} = useTranslation();
  const {
    socketRecords,
    filteredSocketRecords,
    socketSearch,
    setSocketSearch,
    socketQuickFilter,
    setSocketQuickFilter,
    setSelectedSocket,
    clearAllSocketLogs,
    deleteMultipleSocketRecords,
    simulateSocket,
    maxSocketLogs,
  } = useInspector();

  const initialLimit = maxSocketLogs || 50;
  const listRef = useRef<FlatList>(null);
  const [simIndex, setSimIndex] = useState(0);
  const [displayLimit, setDisplayLimit] = useState<number>(initialLimit);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [modalFilters, setModalFilters] = useState<SocketFilterState>(DEFAULT_SOCKET_FILTERS);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSearchFocused, setIsSearchFocused] = useState(false);
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

  // Reset displayLimit when search, quickFilter, or maxSocketLogs changes
  React.useEffect(() => {
    setDisplayLimit(maxSocketLogs || 50);
    listRef.current?.scrollToOffset({offset: 0, animated: false});
  }, [socketSearch, socketQuickFilter, maxSocketLogs]);

  const presets: Array<'chat' | 'crypto' | 'socketio' | 'echo'> = [
    'chat',
    'crypto',
    'socketio',
    'echo',
  ];

  const handleSimulatePress = useCallback(() => {
    const preset = presets[simIndex % presets.length];
    simulateSocket(preset);
    setSimIndex(prev => prev + 1);
    showToast(`Simulated ${preset.toUpperCase()} WebSocket`);
  }, [simIndex, simulateSocket]);

  // Compute live quick counts
  const quickCounts = useMemo(() => {
    let open = 0;
    let closed = 0;
    let error = 0;
    let wss = 0;
    let ws = 0;
    let sio = 0;

    socketRecords.forEach(r => {
      const s = (r.status || 'open').toLowerCase();
      if (s === 'open') open++;
      else if (s === 'closed') closed++;
      else if (s === 'error') error++;

      if (r.client === 'socket.io' || r.url.includes('/socket.io')) sio++;
      else if (r.url.startsWith('wss://')) wss++;
      else ws++;
    });

    return {
      all: socketRecords.length,
      open,
      closed,
      error,
      wss,
      ws,
      sio,
    };
  }, [socketRecords]);

  // Apply modal filters on top of filteredSocketRecords
  const processedRecords = useMemo(() => {
    let result = filteredSocketRecords;

    if (!isSocketFiltersDefault(modalFilters)) {
      if (!modalFilters.status.has('all')) {
        result = result.filter(r => modalFilters.status.has(r.status || 'open'));
      }
      if (!modalFilters.types.has('all')) {
        result = result.filter(r => {
          if (modalFilters.types.has('sio') && (r.client === 'socket.io' || r.url.includes('/socket.io'))) return true;
          if (modalFilters.types.has('wss') && r.url.startsWith('wss://')) return true;
          if (modalFilters.types.has('ws') && r.url.startsWith('ws://')) return true;
          return false;
        });
      }
      if (modalFilters.sortBy === 'time_asc') {
        result = [...result].sort((a, b) => a.startTime - b.startTime);
      } else if (modalFilters.sortBy === 'frames_desc') {
        result = [...result].sort((a, b) => (b.frames?.length || 0) - (a.frames?.length || 0));
      } else if (modalFilters.sortBy === 'duration_desc') {
        result = [...result].sort((a, b) => (b.duration || 0) - (a.duration || 0));
      }
    }

    return result;
  }, [filteredSocketRecords, modalFilters]);

  const displayedSocketRecords = useMemo(
    () => processedRecords.slice(0, displayLimit),
    [processedRecords, displayLimit],
  );

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

  const handleSelectAll = useCallback(() => {
    if (selectedIds.size === processedRecords.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(processedRecords.map(r => r.id)));
    }
  }, [selectedIds.size, processedRecords]);

  const handleCopySelectedUris = useCallback(() => {
    const selected = processedRecords.filter(r => selectedIds.has(r.id));
    if (selected.length === 0) return;
    const text = selected.map(r => r.url).join('\n');
    copyToClipboard(text, `${selected.length} WebSocket URLs`);
    showToast(`${selected.length} URLs copied to clipboard`);
  }, [processedRecords, selectedIds]);

  const handleShareSelected = useCallback(async () => {
    const selected = processedRecords.filter(r => selectedIds.has(r.id));
    if (selected.length === 0) return;
    try {
      const payload = JSON.stringify(
        selected.map(r => ({
          url: r.url,
          status: r.status,
          startTime: new Date(r.startTime).toISOString(),
          duration: r.duration,
          framesCount: r.frames?.length || 0,
          totalBytesSent: r.totalBytesSent,
          totalBytesReceived: r.totalBytesReceived,
        })),
        null,
        2,
      );
      await Share.share({
        message: payload,
        title: `WebSocket Traffic (${selected.length} connections)`,
      });
    } catch {}
  }, [processedRecords, selectedIds]);

  const handleDeleteSelected = useCallback(() => {
    if (selectedIds.size === 0) return;
    setConfirmConfig({
      visible: true,
      title: t('socket.deleteSelectedTitle', 'Delete Selected WebSockets'),
      message: t('socket.deleteSelectedMsg', {
        count: selectedIds.size,
        defaultValue: `Are you sure you want to delete ${selectedIds.size} selected WebSocket logs?`,
      }),
      confirmText: t('common.delete', 'Delete'),
      cancelText: t('common.cancel', 'Cancel'),
      onConfirm: () => {
        setConfirmConfig(prev => ({...prev, visible: false}));
        const ids = Array.from(selectedIds);
        deleteMultipleSocketRecords?.(ids);
        setSelectedIds(new Set());
        showToast(`Deleted ${ids.length} WebSocket logs`);
      },
    });
  }, [selectedIds, deleteMultipleSocketRecords, t]);

  const handleClearAllConfirm = useCallback(() => {
    setConfirmConfig({
      visible: true,
      title: t('socket.clearTitle', 'Clear All WebSocket Logs'),
      message: t('socket.clearMessage', 'Are you sure you want to delete all recorded WebSocket sessions?'),
      confirmText: t('common.clear', 'Clear All'),
      cancelText: t('common.cancel', 'Cancel'),
      onConfirm: () => {
        setConfirmConfig(prev => ({...prev, visible: false}));
        clearAllSocketLogs();
        setSelectedIds(new Set());
        showToast(t('socket.cleared', 'All WebSocket logs cleared'));
      },
    });
  }, [clearAllSocketLogs, t]);

  const QUICK_CHIPS = useMemo(() => [
    {
      id: 'all',
      label: 'All',
      count: quickCounts.all,
      color: AppColors.purple,
      icon: (color: string) => <WebsocketIcon size={12} color={color} />,
    },
    {
      id: 'open',
      label: 'Open',
      count: quickCounts.open,
      color: AppColors.greenColor,
      icon: (color: string) => (
        <View
          style={{
            width: 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: color,
          }}
        />
      ),
    },
    {
      id: 'closed',
      label: 'Closed',
      count: quickCounts.closed,
      color: AppColors.slate500,
      icon: (color: string) => <ClockIcon size={11} color={color} />,
    },
    {
      id: 'error',
      label: 'Error',
      count: quickCounts.error,
      color: AppColors.errorColor,
      icon: (color: string) => <FailIcon size={9} color={color} />,
    },
    {
      id: 'sio',
      label: 'Socket.IO',
      count: quickCounts.sio,
      color: AppColors.violet600,
      icon: (color: string) => <BoltIcon size={11} color={color} />,
    },
    {
      id: 'wss',
      label: 'WSS',
      count: quickCounts.wss,
      color: AppColors.emerald600,
      icon: (color: string) => <LockIcon size={11} color={color} />,
    },
    {
      id: 'ws',
      label: 'WS',
      count: quickCounts.ws,
      color: AppColors.blue600,
      icon: (color: string) => <GlobeIcon size={11} color={color} />,
    },
  ], [quickCounts]);

  const handleLoadMore = useCallback(() => {
    if (displayLimit < processedRecords.length) {
      setDisplayLimit(prev => Math.min(prev + LOAD_MORE_STEP, processedRecords.length));
    }
  }, [displayLimit, processedRecords.length]);

  const handleSelectSocket = useCallback(
    (item: SocketConnectionRecord) => {
      setSelectedSocket(item);
    },
    [setSelectedSocket],
  );

  const keyExtractor = useCallback((item: SocketConnectionRecord) => {
    return item?.id ? String(item.id) : '';
  }, []);

  const renderItem = useCallback(
    ({item, index}: {item: SocketConnectionRecord; index: number}) => (
      <AnimatedEntrance index={index} distance={8}>
        <SocketCard
          item={item}
          onPress={() => handleSelectSocket(item)}
          searchStr={socketSearch}
          isSelected={selectedIds.has(item.id)}
          onToggleSelect={toggleSelect}
          serialNumber={index + 1}
        />
      </AnimatedEntrance>
    ),
    [socketSearch, selectedIds, toggleSelect, handleSelectSocket],
  );

  return (
    <View style={{flex: 1, backgroundColor: AppColors.primaryLight}}>
      {/* ── Search & Filter Action Bar ── */}
      <View style={{marginTop: 6}}>
        <View style={styles.toolbarRow}>
          <View
            style={[
              styles.searchContainer,
              {flex: 1, marginRight: 8, height: 38},
              isSearchFocused && {
                borderColor: AppColors.purple,
                borderWidth: 1.5,
              },
            ]}>
            <View style={styles.searchIcon}>
              <SearchIcon
                color={
                  isSearchFocused
                    ? AppColors.purple
                    : AppColors.grayTextWeak
                }
                size={15}
              />
            </View>
            <TextInput
              style={[styles.searchInput, {paddingVertical: 0}]}
              placeholder={t('socket.searchSocketsPlaceholder', 'Search WebSocket URL, payload...')}
              placeholderTextColor={AppColors.grayTextWeak}
              value={socketSearch}
              onChangeText={setSocketSearch}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              autoCorrect={false}
              autoCapitalize="none"
              returnKeyType="search"
              clearButtonMode="while-editing"
            />
            {socketSearch.length > 0 && (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                  marginRight: 6,
                }}>
                <View
                  style={{
                    backgroundColor: `${AppColors.purple}20`,
                    borderRadius: 10,
                    paddingHorizontal: 6,
                    paddingVertical: 1.5,
                  }}>
                  <Text
                    style={{
                      color: AppColors.purple,
                      fontSize: 9.5,
                      fontFamily: AppFonts.interBold,
                    }}>
                    {processedRecords.length}
                  </Text>
                </View>
                {Platform.OS === 'android' && (
                  <Pressable
                    onPress={() => setSocketSearch('')}
                    hitSlop={10}
                    style={styles.clearBtn}>
                    <ClearIcon
                      color={AppColors.grayTextWeak}
                      size={13}
                    />
                  </Pressable>
                )}
              </View>
            )}
          </View>

          <View style={styles.toolbarRight}>
            <TouchableScale
              style={[
                styles.toolbarBtn,
                !isSocketFiltersDefault(modalFilters) && {
                  borderColor: AppColors.purple,
                  backgroundColor: `${AppColors.purple}15`,
                },
              ]}
              onPress={() => setIsFilterModalOpen(true)}
              hitSlop={6}
              accessibilityRole="button"
              accessibilityLabel="Filter WebSockets">
              <FilterIcon
                color={
                  !isSocketFiltersDefault(modalFilters)
                    ? AppColors.purple
                    : AppColors.grayTextStrong
                }
                size={15}
              />
              {!isSocketFiltersDefault(modalFilters) && (
                <View style={styles.activeFilterDot} />
              )}
            </TouchableScale>

            <TouchableScale
              style={[
                styles.toolbarBtn,
                {
                  backgroundColor: `${AppColors.amber600}14`,
                  borderColor: `${AppColors.amber600}30`,
                },
              ]}
              onPress={handleSimulatePress}
              hitSlop={6}
              accessibilityRole="button"
              accessibilityLabel="Simulate test WebSocket traffic">
              <BoltIcon color={AppColors.amber600} size={15} />
            </TouchableScale>

            {socketRecords.length > 0 && (
              <TouchableScale
                style={[
                  styles.toolbarBtn,
                  {
                    borderColor: `${AppColors.errorColor}38`,
                    backgroundColor: `${AppColors.errorColor}0F`,
                  },
                ]}
                onPress={handleClearAllConfirm}
                hitSlop={6}
                accessibilityRole="button"
                accessibilityLabel="Clear all socket logs">
                <TrashIcon color={AppColors.errorColor} size={15} />
              </TouchableScale>
            )}
          </View>
        </View>
      </View>

      {/* ── Quick Filter Carousel ── */}
      <View style={socketTabStyles.carouselWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={socketTabStyles.carouselContent}>
          {QUICK_CHIPS.map(chip => {
            const isSelected = socketQuickFilter === chip.id;
            return (
              <TouchableScale
                key={chip.id}
                onPress={() => setSocketQuickFilter(chip.id)}
                style={[
                  socketTabStyles.filterPill,
                  isSelected && {
                    backgroundColor: chip.color,
                    borderColor: chip.color,
                  },
                ]}>
                {chip.icon ? chip.icon(isSelected ? AppColors.white : chip.color) : null}
                <Text
                  style={[
                    socketTabStyles.filterPillText,
                    isSelected && {color: AppColors.white, fontFamily: AppFonts.interBold},
                  ]}>
                  {chip.label}
                </Text>
                {chip.count > 0 && (
                  <View
                    style={[
                      socketTabStyles.countBadge,
                      {
                        backgroundColor: isSelected
                          ? 'rgba(255, 255, 255, 0.25)'
                          : `${chip.color}20`,
                      },
                    ]}>
                    <Text
                      style={[
                        socketTabStyles.countBadgeText,
                        {color: isSelected ? AppColors.white : chip.color},
                      ]}>
                      {chip.count > 99 ? '99+' : chip.count}
                    </Text>
                  </View>
                )}
              </TouchableScale>
            );
          })}
        </ScrollView>
      </View>

      {/* ── Multi-Selection Action Toolbar ── */}
      {selectedIds.size > 0 && (
        <View style={socketTabStyles.selectionBar}>
          <View style={socketTabStyles.selectionLeft}>
            <TouchableOpacity
              onPress={handleSelectAll}
              style={socketTabStyles.selectAllBtn}
              hitSlop={{top: 6, bottom: 6, left: 6, right: 6}}>
              <Text style={socketTabStyles.selectAllText}>
                {selectedIds.size === processedRecords.length
                  ? t('common.deselectAll', 'Deselect')
                  : t('common.selectAll', 'Select All')}
              </Text>
            </TouchableOpacity>

            <Text style={socketTabStyles.selectionCountText}>
              {selectedIds.size} / {processedRecords.length}
            </Text>
          </View>

          <View style={socketTabStyles.selectionRight}>
            <TouchableOpacity
              onPress={handleCopySelectedUris}
              style={socketTabStyles.actionBtn}
              hitSlop={{top: 6, bottom: 6, left: 6, right: 6}}>
              <CopyIcon size={12} color={AppColors.slate600} />
              <Text style={socketTabStyles.actionBtnText}>
                {t('common.copy', 'Copy')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleShareSelected}
              style={socketTabStyles.actionBtn}
              hitSlop={{top: 6, bottom: 6, left: 6, right: 6}}>
              <ShareIcon size={12} color={AppColors.sky600} />
              <Text style={[socketTabStyles.actionBtnText, {color: AppColors.sky600}]}>
                {t('common.share', 'Share')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleDeleteSelected}
              style={[socketTabStyles.actionBtn, socketTabStyles.deleteActionBtn]}
              hitSlop={{top: 6, bottom: 6, left: 6, right: 6}}>
              <TrashIcon size={12} color={AppColors.red500} />
              <Text style={[socketTabStyles.actionBtnText, {color: AppColors.red500}]}>
                {t('common.delete', 'Delete')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Sockets List */}
      <FlatList
        ref={listRef}
        data={displayedSocketRecords}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        initialNumToRender={10}
        maxToRenderPerBatch={8}
        windowSize={5}
        updateCellsBatchingPeriod={40}
        removeClippedSubviews={true}
        renderToHardwareTextureAndroid={true}
        contentContainerStyle={[
          socketTabStyles.listContent,
          displayedSocketRecords.length === 0 && {flex: 1},
        ]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={socketTabStyles.emptyWrapper}>
            <EmptyState
              isSearch={Boolean(socketSearch || socketQuickFilter !== 'all')}
              searchQuery={socketSearch}
              customTitle={
                socketSearch || socketQuickFilter !== 'all'
                  ? t('socket.noMatching', 'No matching WebSockets')
                  : t('socket.noSockets', 'No WebSockets recorded yet')
              }
              customSub={
                socketSearch || socketQuickFilter !== 'all'
                  ? t('socket.adjustSearchFilter', 'Try adjusting your search query or filter chips.')
                  : t('socket.noSocketsDesc', 'WebSocket connections and Socket.IO messages will appear here in real-time.')
              }
              onClearSearch={() => {
                setSocketSearch('');
                setSocketQuickFilter('all');
              }}
              showReload={false}
            />
            {!socketSearch && socketQuickFilter === 'all' && (
              <TouchableScale
                onPress={handleSimulatePress}
                style={socketTabStyles.simulateEmptyBtn}>
                <BoltIcon color={AppColors.white} size={14} />
                <Text style={socketTabStyles.simulateEmptyBtnText}>
                  {t('socket.simulateTraffic', 'Simulate Demo WebSocket Traffic')}
                </Text>
              </TouchableScale>
            )}
          </View>
        }
        ListFooterComponent={
          displayedSocketRecords.length > 0 ? (
            <EndOfListFooter
              totalCount={processedRecords.length}
              count={displayedSocketRecords.length}
              hasMore={displayedSocketRecords.length < processedRecords.length}
              onLoadMore={handleLoadMore}
            />
          ) : null
        }
      />

      {/* Filter Modal */}
      <SocketFilterModal
        visible={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        filters={modalFilters}
        onApply={setModalFilters}
        records={socketRecords}
      />

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
});

export default SocketTab;

const socketTabStyles = StyleSheet.create({
  carouselWrapper: {
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.dividerColor,
    backgroundColor: AppColors.white,
  },
  carouselContent: {
    paddingHorizontal: 8,
    gap: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4.5,
    borderRadius: 20,
    backgroundColor: AppColors.grayBackground,
    borderWidth: 1,
    borderColor: AppColors.dividerColor,
  },
  filterPillText: {
    fontSize: 11,
    fontFamily: AppFonts.interMedium,
    color: AppColors.primaryBlack,
  },
  countBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 10,
  },
  countBadgeText: {
    fontSize: 9.5,
    fontFamily: AppFonts.interBold,
  },
  selectionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: `${AppColors.purple}0D`,
    borderBottomWidth: 1,
    borderBottomColor: `${AppColors.purple}25`,
  },
  selectionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selectAllBtn: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 5,
    backgroundColor: `${AppColors.purple}1E`,
  },
  selectAllText: {
    fontFamily: AppFonts.interSemiBold,
    fontSize: 10.5,
    color: AppColors.purple,
  },
  selectionCountText: {
    fontFamily: AppFonts.interMedium,
    fontSize: 11,
    color: AppColors.grayTextStrong,
  },
  selectionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3.5,
    borderRadius: 5,
    backgroundColor: AppColors.white,
    borderWidth: 1,
    borderColor: AppColors.dividerColor,
  },
  deleteActionBtn: {
    backgroundColor: `${AppColors.red500}10`,
    borderColor: `${AppColors.red500}30`,
  },
  actionBtnText: {
    fontFamily: AppFonts.interMedium,
    fontSize: 10.5,
    color: AppColors.grayTextStrong,
  },
  listContent: {
    padding: 6,
    paddingBottom: 24,
  },
  emptyWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  simulateEmptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: AppColors.amber600,
    shadowColor: AppColors.amber600,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  simulateEmptyBtnText: {
    fontFamily: AppFonts.interBold,
    fontSize: 12,
    color: AppColors.white,
    letterSpacing: 0.2,
  },
});

