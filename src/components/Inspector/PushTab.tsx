import React, {useCallback, useMemo, useRef, useState} from 'react';
import {
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {useInspector} from './InspectorContext';
import PushCard from './PushCard';
import TouchableScale from '../TouchableScale';
import AnimatedEntrance from '../AnimatedEntrance';
import EmptyState from '../EmptyState';
import EndOfListFooter from '../EndOfListFooter';
import styles from '../../styles';
import {AppColors} from '../../styles/AppColors';
import {AppFonts} from '../../styles/AppFonts';
import {useTranslation} from '../../i18n';
import {
  ClearIcon,
  SearchIcon,
  TrashIcon,
  BellIcon,
  SunIcon,
  MoonIcon,
  ExternalLinkIcon,
  CloudPushIcon,
  BoltIcon,
} from '../NetworkIcons';
import type {PushNotificationRecord} from '../../types';

const LOAD_MORE_STEP = 10;

const PushTab = React.memo(() => {
  const {t} = useTranslation();
  const {
    pushRecords,
    filteredPushRecords,
    pushSearch,
    setPushSearch,
    pushQuickFilter,
    setPushQuickFilter,
    setSelectedPush,
    clearAllPushLogs,
    simulatePush,
    maxPushLogs,
  } = useInspector();

  const initialLimit = maxPushLogs || 50;
  const listRef = useRef<FlatList>(null);
  const [simIndex, setSimIndex] = useState(0);
  const [displayLimit, setDisplayLimit] = useState<number>(initialLimit);

  // Reset displayLimit to dynamic settings page size when search query, filter chip, or maxPushLogs setting changes
  React.useEffect(() => {
    setDisplayLimit(maxPushLogs || 50);
    listRef.current?.scrollToOffset({offset: 0, animated: false});
  }, [pushSearch, pushQuickFilter, maxPushLogs]);

  const displayedPushRecords = useMemo(
    () => filteredPushRecords.slice(0, displayLimit),
    [filteredPushRecords, displayLimit],
  );

  const presets: Array<'salesforce' | 'fcm' | 'apns' | 'deeplink' | 'rich_media'> = [
    'salesforce',
    'fcm',
    'apns',
    'deeplink',
    'rich_media',
  ];

  const handleSimulatePress = useCallback(() => {
    const preset = presets[simIndex % presets.length];
    simulatePush(preset);
    setSimIndex(prev => prev + 1);
  }, [simIndex, simulatePush]);

  // Compute live filter counts
  const quickCounts = useMemo(() => {
    let foregroundCount = 0;
    let backgroundCount = 0;
    let openedCount = 0;
    const sourceCounts: Record<string, number> = {};

    pushRecords.forEach(r => {
      const state = (r.appState || '').toLowerCase();
      if (state === 'foreground') foregroundCount++;
      if (state === 'background') backgroundCount++;
      if (r.action === 'opened') openedCount++;

      const src = (r.source || 'other').toLowerCase();
      sourceCounts[src] = (sourceCounts[src] || 0) + 1;
    });

    return {
      all: pushRecords.length,
      foreground: foregroundCount,
      background: backgroundCount,
      opened: openedCount,
      sources: sourceCounts,
    };
  }, [pushRecords]);

  // Dynamic Horizontal Quick Filter Chips with Icons
  const QUICK_CHIPS = useMemo(() => {
    const chips: Array<{
      id: string;
      label: string;
      color: string;
      icon: (color: string) => React.ReactNode;
    }> = [
      {
        id: 'all',
        label: 'All',
        color: AppColors.purple,
        icon: (c: string) => <BellIcon size={12} color={c} />,
      },
      {
        id: 'foreground',
        label: 'Foreground',
        color: AppColors.greenColor,
        icon: (c: string) => <SunIcon size={12} color={c} />,
      },
      {
        id: 'background',
        label: 'Background',
        color: AppColors.darkOrange,
        icon: (c: string) => <MoonIcon size={12} color={c} />,
      },
      {
        id: 'opened',
        label: 'Opened',
        color: AppColors.brandPurple,
        icon: (c: string) => <ExternalLinkIcon size={12} color={c} />,
      },
    ];

    // Add dynamic source chips for all discovered domains
    Object.entries(quickCounts.sources).forEach(([src, count]) => {
      if (count > 0 && src !== 'all') {
        chips.push({
          id: `source:${src}`,
          label: src.toUpperCase(),
          color: src === 'salesforce' ? AppColors.sky600 : AppColors.brandPurple,
          icon: (c: string) => <CloudPushIcon size={12} color={c} />,
        });
      }
    });

    return chips;
  }, [quickCounts]);

  const handleSelectPush = useCallback(
    (item: PushNotificationRecord) => {
      setSelectedPush(item);
    },
    [setSelectedPush],
  );

  const renderItem = useCallback(
    ({item, index}: {item: PushNotificationRecord; index: number}) => (
      <AnimatedEntrance index={index} distance={8}>
        <PushCard
          item={item}
          searchStr={pushSearch}
          onPress={() => handleSelectPush(item)}
        />
      </AnimatedEntrance>
    ),
    [pushSearch, handleSelectPush],
  );

  const keyExtractor = useCallback(
    (item: PushNotificationRecord) => item.id || `push_${item.timestamp}`,
    [],
  );

  return (
    <View style={{flex: 1}}>
      {/* ── Top Bar: Search + Actions (Matching NetworkTab Layout) ── */}
      <View style={{marginTop: 6}}>
        <View style={styles.toolbarRow}>
          <View
            style={[
              styles.searchContainer,
              {flex: 1, marginRight: 8, height: 38},
            ]}>
            <View style={styles.searchIcon}>
              <SearchIcon color={AppColors.grayTextWeak} size={15} />
            </View>
            <TextInput
              style={[styles.searchInput, {paddingVertical: 0}]}
              placeholder="Search notifications..."
              placeholderTextColor={AppColors.grayTextWeak}
              value={pushSearch}
              onChangeText={setPushSearch}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
              clearButtonMode="while-editing"
            />
            {pushSearch.length > 0 && Platform.OS === 'android' && (
              <View
                style={{
                  position: 'absolute',
                  right: 8,
                  top: 0,
                  bottom: 0,
                  justifyContent: 'center',
                }}>
                <Pressable
                  onPress={() => setPushSearch('')}
                  hitSlop={10}
                  style={styles.clearBtn}>
                  <ClearIcon
                    color={AppColors.grayTextWeak}
                    size={13}
                  />
                </Pressable>
              </View>
            )}
          </View>

          <View style={styles.toolbarRight}>
            <TouchableScale
              style={[
                styles.toolbarBtn,
                {
                  backgroundColor: `${AppColors.brandPurple}14`,
                  borderColor: `${AppColors.brandPurple}30`,
                },
              ]}
              onPress={handleSimulatePress}
              hitSlop={6}
              accessibilityRole="button"
              accessibilityLabel="Simulate incoming push notification">
              <BoltIcon color={AppColors.brandPurple} size={15} />
            </TouchableScale>

            {pushRecords.length > 0 && (
              <TouchableScale
                style={[
                  styles.toolbarBtn,
                  {
                    borderColor: `${AppColors.errorColor}38`,
                    backgroundColor: `${AppColors.errorColor}0F`,
                  },
                ]}
                onPress={clearAllPushLogs}
                hitSlop={6}
                accessibilityRole="button"
                accessibilityLabel="Clear all push notification history">
                <TrashIcon color={AppColors.errorColor} size={15} />
              </TouchableScale>
            )}
          </View>
        </View>
      </View>

      {/* ── Quick Filter Carousel ── */}
      <View style={pushTabStyles.carouselWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={pushTabStyles.carouselContent}>
          {QUICK_CHIPS.map(chip => {
            const isActive = pushQuickFilter === chip.id;
            return (
              <TouchableScale
                key={chip.id}
                onPress={() => setPushQuickFilter(chip.id)}
                style={[
                  pushTabStyles.filterPill,
                  isActive && {
                    backgroundColor: chip.color,
                    borderColor: chip.color,
                  },
                ]}>
                {chip.icon ? chip.icon(isActive ? AppColors.white : chip.color) : null}
                <Text
                  style={[
                    pushTabStyles.filterPillText,
                    isActive && {color: AppColors.white},
                  ]}>
                  {chip.label}
                </Text>
              </TouchableScale>
            );
          })}
        </ScrollView>
      </View>

      {/* ── Notification Records List ── */}
      <FlatList
        ref={listRef}
        data={displayedPushRecords}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={pushTabStyles.listContent}
        initialNumToRender={10}
        maxToRenderPerBatch={8}
        windowSize={5}
        updateCellsBatchingPeriod={40}
        removeClippedSubviews={true}
        renderToHardwareTextureAndroid={true}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            isSearch={Boolean(pushSearch || pushQuickFilter !== 'all')}
            searchQuery={pushSearch}
            customTitle={
              pushSearch || pushQuickFilter !== 'all'
                ? t('push.noMatching', 'No matching push notifications')
                : t('push.noNotifications', 'No push notifications captured yet')
            }
            customSub={
              pushSearch || pushQuickFilter !== 'all'
                ? t('push.adjustSearchFilter', 'Try adjusting your search query or filter chips.')
                : t('push.noNotificationsDesc', 'Incoming or opened push payloads from any domain (Salesforce, FCM, APNs, etc.) will appear here automatically.')
            }
            onClearSearch={() => {
              setPushSearch('');
              setPushQuickFilter('all');
            }}
            showReload={false}
          />
        }
        ListFooterComponent={
          filteredPushRecords.length > 0 ? (
            <EndOfListFooter
              count={displayedPushRecords.length}
              totalCount={filteredPushRecords.length}
              label="push notifications"
              loadMoreStep={LOAD_MORE_STEP}
              hasMore={displayedPushRecords.length < filteredPushRecords.length}
              onLoadMore={() => setDisplayLimit(prev => prev + LOAD_MORE_STEP)}
            />
          ) : null
        }
      />
    </View>
  );
});

const pushTabStyles = StyleSheet.create({
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
  listContent: {
    padding: 8,
    paddingBottom: 24,
  },
});

PushTab.displayName = 'PushTab';

export default PushTab;
