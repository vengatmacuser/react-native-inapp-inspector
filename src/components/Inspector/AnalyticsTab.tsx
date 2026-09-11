import React, {useCallback, useState, useMemo, useRef} from 'react';
import {
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {animateNextLayout, useInspector} from './InspectorContext';
import AnalyticsEventCard from '../AnalyticsEventCard';
import AnalyticsFilterModal from './AnalyticsFilterModal';
import EndOfListFooter from '../EndOfListFooter';
import EmptyState from '../EmptyState';
import styles from '../../styles';
import {AppColors} from '../../styles/AppColors';
import {AppFonts} from '../../styles/AppFonts';
import {useTranslation} from '../../i18n';
import TouchableScale from '../TouchableScale';
import {getEventCategory} from '../../helpers';
import {
  LayersIcon,
  SearchIcon,
  ClearIcon,
  TrashIcon,
  FilterIcon,
  CartIcon,
  GlobeIcon,
  BoltIcon,
  SparkleIcon,
} from '../NetworkIcons';

const AnalyticsTab = React.memo(() => {
  const {t} = useTranslation();
  const {
    analyticsEvents,
    filteredAnalyticsEvents,
    analyticsSearch,
    setAnalyticsSearch,
    analyticsFilters,
    setAnalyticsFilters,
    handleDelete,
    selectedEvent,
    setSelectedEvent,
    newEventIds,
    logRouteMapRef,
    isAnalyticsLayoutReady,
    setIsAnalyticsLayoutReady,
    isAnalyticsFilterApplied,
  } = useInspector();

  const listRef = useRef<FlatList>(null);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [displayLimit, setDisplayLimit] = useState<number>(100);

  const displayedAnalyticsEvents = useMemo(
    () => filteredAnalyticsEvents.slice(0, displayLimit),
    [filteredAnalyticsEvents, displayLimit],
  );

  // Category counts across all session events
  const categoryStats = useMemo(() => {
    let ecommerce = 0;
    let page_view = 0;
    let system = 0;
    let custom = 0;

    for (const e of analyticsEvents) {
      const cat = getEventCategory(e.name);
      const c = (e as any).count || 1;
      if (cat === 'ecommerce') {
        ecommerce += c;
      } else if (cat === 'page_view') {
        page_view += c;
      } else if (cat === 'system') {
        system += c;
      } else {
        custom += c;
      }
    }

    const total = ecommerce + page_view + system + custom;
    return {
      ecommerce,
      page_view,
      system,
      custom,
      totalCount: total,
    };
  }, [analyticsEvents]);

  // Multi-select category toggle from top button group
  const toggleCategoryFilter = useCallback((cat: string) => {
    animateNextLayout();
    setAnalyticsFilters(prev => {
      if (cat === 'all') {
        return {...prev, categories: new Set(['all'])};
      }

      const nextCategories = new Set(prev.categories);
      if (nextCategories.has('all')) {
        nextCategories.delete('all');
        nextCategories.add(cat);
      } else {
        if (nextCategories.has(cat)) {
          nextCategories.delete(cat);
          if (nextCategories.size === 0) {
            nextCategories.add('all');
          }
        } else {
          nextCategories.add(cat);
          if (
            nextCategories.has('ecommerce') &&
            nextCategories.has('page_view') &&
            nextCategories.has('system') &&
            nextCategories.has('custom')
          ) {
            return {...prev, categories: new Set(['all'])};
          }
        }
      }

      return {...prev, categories: nextCategories};
    });
  }, [setAnalyticsFilters]);

  const keyExtractor = useCallback(
    (item: any, index: number) => item?.id?.toString() ?? index.toString(),
    [],
  );

  const renderItem = useCallback(
    ({item, index}: {item: any; index: number}) => {
      const prev = filteredAnalyticsEvents[index + 1];
      const next = filteredAnalyticsEvents[index - 1];
      const msSincePrev = prev
        ? item.timestamp - prev.timestamp
        : undefined;
      const thisMin = Math.floor(item.timestamp / 60000);
      const nextMin = next
        ? Math.floor(next.timestamp / 60000)
        : -1;
      const showTimestamp =
        index === 0 || thisMin !== nextMin;
      return (
        <AnalyticsEventCard
          event={item}
          onPress={() => {
            setSelectedEvent(item);
          }}
          isNew={newEventIds.has(item.id)}
          searchStr={analyticsSearch}
          isFirst={index === 0}
          isLast={
            index === filteredAnalyticsEvents.length - 1
          }
          msSincePrev={msSincePrev}
          showTimestamp={showTimestamp}
          computedScreenName={(() => {
            if (!item) return '';
            const rawScreenName =
              item.screenName ||
              item.screenClass ||
              item.pageTitle ||
              item.pageLocation ||
              item.params?.firebase_screen ||
              item.params?.screen_name ||
              item.params?.firebase_screen_class ||
              item.params?.screen_class;
            let screenName = typeof rawScreenName === 'string'
              ? rawScreenName
              : (rawScreenName ? JSON.stringify(rawScreenName) : '');
            const routeInfo = logRouteMapRef.current.get(
              item.id + 1000000,
            );
            if (!screenName) {
              if (
                routeInfo &&
                routeInfo.path !== 'Navigators'
              ) {
                const parts = routeInfo.path.split(' ➔ ');
                screenName = parts[parts.length - 1];
              }
            }
            return screenName;
          })()}
        />
      );
    },
    [filteredAnalyticsEvents, analyticsSearch, newEventIds, setSelectedEvent, logRouteMapRef],
  );

  const getItemLayout = useCallback(
    (_: any, index: number) => ({
      length: 86,
      offset: 86 * index,
      index,
    }),
    [],
  );

  return (
    <>
      {/* ─── Search + Shared Toolbar for Analytics ──────────────────────── */}
      {selectedEvent == null && (
        <View
          style={{
            backgroundColor: AppColors.white,
            borderBottomWidth: 1,
            borderBottomColor: AppColors.dividerColor,
            paddingBottom: 6,
          }}>
          <View
            style={[
              styles.toolbarRow,
              {marginTop: 12, marginBottom: 8},
            ]}>
            <View style={styles.searchContainer}>
              <SearchIcon
                color={AppColors.grayTextWeak}
                size={16}
              />
              <TextInput
                placeholder={t('analytics.searchPlaceholder', 'Search events...')}
                placeholderTextColor={AppColors.grayTextWeak}
                value={analyticsSearch}
                onChangeText={setAnalyticsSearch}
                style={styles.searchInput}
                autoCorrect={false}
                autoCapitalize="none"
              />
              {analyticsSearch.length > 0 && (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4,
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
                      {filteredAnalyticsEvents.length}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => setAnalyticsSearch('')}
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
              {/* GA Dashboard-style Filter Button */}
              <TouchableOpacity
                style={[
                  styles.toolbarBtn,
                  isAnalyticsFilterApplied && {
                    borderColor: `${AppColors.brandPurple}60`,
                    backgroundColor: `${AppColors.brandPurple}15`,
                  },
                ]}
                onPress={() => setIsFilterModalOpen(true)}
                hitSlop={6}>
                <FilterIcon
                  color={
                    isAnalyticsFilterApplied
                      ? AppColors.brandPurple
                      : AppColors.grayTextStrong
                  }
                  size={15}
                />
                {isAnalyticsFilterApplied && (
                  <View
                    style={{
                      position: 'absolute',
                      top: 2,
                      right: 2,
                      width: 7,
                      height: 7,
                      borderRadius: 3.5,
                      backgroundColor: AppColors.darkOrange,
                      borderWidth: 1,
                      borderColor: AppColors.white,
                    }}
                  />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.toolbarBtn,
                  {
                    borderColor: `${AppColors.errorColor}38`,
                    backgroundColor: `${AppColors.errorColor}0F`,
                  },
                ]}
                onPress={handleDelete}
                hitSlop={6}>
                <TrashIcon
                  color={AppColors.errorColor}
                  size={15}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* ── Category Filters Horizontal Chips Bar (Styled exactly like API Tab) ── */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 8,
              paddingHorizontal: 12,
              gap: 6,
            }}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{flex: 1}}
              contentContainerStyle={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                paddingRight: 6,
              }}>
              {(
                [
                  {
                    id: 'all',
                    label: t('common.all', 'All'),
                    count: categoryStats.totalCount,
                    color: AppColors.purple,
                    Icon: LayersIcon,
                  },
                  {
                    id: 'ecommerce',
                    label: 'Ecommerce',
                    count: categoryStats.ecommerce,
                    color: AppColors.amber600,
                    Icon: CartIcon,
                  },
                  {
                    id: 'page_view',
                    label: 'Screens',
                    count: categoryStats.page_view,
                    color: AppColors.sky600,
                    Icon: GlobeIcon,
                  },
                  {
                    id: 'system',
                    label: 'System',
                    count: categoryStats.system,
                    color: AppColors.violet600,
                    Icon: BoltIcon,
                  },
                  {
                    id: 'custom',
                    label: 'Custom',
                    count: categoryStats.custom,
                    color: AppColors.teal600,
                    Icon: SparkleIcon,
                  },
                ] as const
              ).map(chip => {
                const isActive =
                  chip.id === 'all'
                    ? analyticsFilters.categories.has('all')
                    : !analyticsFilters.categories.has('all') &&
                      analyticsFilters.categories.has(chip.id);
                const chipColor = chip.color || AppColors.purple;
                const iconColor = isActive ? AppColors.white : chipColor;
                const ChipIcon = chip.Icon;

                return (
                  <TouchableScale
                    key={chip.id}
                    onPress={() => toggleCategoryFilter(chip.id)}>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingHorizontal: 9,
                        paddingVertical: 4.5,
                        borderRadius: 8,
                        backgroundColor: isActive
                          ? chipColor
                          : `${chipColor}12`,
                        borderWidth: 1,
                        borderColor: isActive
                          ? chipColor
                          : `${chipColor}30`,
                        gap: 5,
                      }}>
                      <ChipIcon size={11} color={iconColor} />
                      <Text
                        style={{
                          fontFamily: AppFonts.interBold,
                          fontSize: 10.5,
                          color: isActive
                            ? AppColors.white
                            : AppColors.primaryBlack,
                        }}>
                        {chip.label}
                      </Text>
                      <View
                        style={{
                          backgroundColor: isActive
                            ? 'rgba(255,255,255,0.25)'
                            : `${chipColor}20`,
                          paddingHorizontal: 5,
                          paddingVertical: 1,
                          borderRadius: 8,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
                        <Text
                          style={{
                            fontFamily: AppFonts.interBold,
                            fontSize: 9.5,
                            color: isActive ? AppColors.white : chipColor,
                          }}>
                          {chip.count}
                        </Text>
                      </View>
                    </View>
                  </TouchableScale>
                );
              })}
            </ScrollView>
          </View>
        </View>
      )}

      {/* Filter Modal */}
      <AnalyticsFilterModal
        visible={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
      />

      <View
        style={{flex: 1}}
        onLayout={() => setIsAnalyticsLayoutReady(true)}>
        {isAnalyticsLayoutReady ? (
          <>
            <FlatList
              ref={listRef}
              data={displayedAnalyticsEvents}
              keyExtractor={keyExtractor}
              renderItem={renderItem}
              getItemLayout={getItemLayout}
              initialNumToRender={15}
              maxToRenderPerBatch={10}
              windowSize={9}
              removeClippedSubviews={Platform.OS === 'android'}
              renderToHardwareTextureAndroid={true}
              ListEmptyComponent={
                <EmptyState
                  isSearch={analyticsSearch.length > 0}
                  searchQuery={analyticsSearch}
                  customTitle={
                    analyticsSearch.length > 0
                      ? 'No matching analytics events'
                      : 'No analytics events yet'
                  }
                  customSub={
                    analyticsSearch.length > 0
                      ? `No events matched "${analyticsSearch}"`
                      : 'Call setupAnalyticsLogger(analytics()) at app start.'
                  }
                  onClearSearch={() => setAnalyticsSearch('')}
                />
              }
              ListFooterComponent={
                filteredAnalyticsEvents.length > 0 ? (
                  <EndOfListFooter
                    count={displayedAnalyticsEvents.length}
                    totalCount={filteredAnalyticsEvents.length}
                    label="events"
                    hasMore={displayedAnalyticsEvents.length < filteredAnalyticsEvents.length}
                    onLoadMore={() => setDisplayLimit(p => p + 10)}
                  />
                ) : null
              }
              contentContainerStyle={[
                styles.listContent,
                filteredAnalyticsEvents.length === 0 && {
                  flexGrow: 1,
                },
              ]}
              keyboardShouldPersistTaps="handled"
            />
          </>
        ) : null}
      </View>
    </>
  );
});

export default AnalyticsTab;
