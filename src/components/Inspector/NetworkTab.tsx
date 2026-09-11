import React, {useCallback, useMemo, useRef} from 'react';
import {
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import {useInspector} from './InspectorContext';
import TouchableScale from '../TouchableScale';
import AnimatedEntrance from '../AnimatedEntrance';
import DomainHeader from '../DomainHeader';
import LogCard from '../LogCard';
import EmptyState from '../EmptyState';
import EndOfListFooter from '../EndOfListFooter';
import NetworkFilterModal, {
  NetworkFilterState,
} from './NetworkFilterModal';
import styles from '../../styles';
import {AppColors} from '../../styles/AppColors';
import {AppFonts} from '../../styles/AppFonts';
import {METHOD_COLORS} from '../../constants';
import {GroupedListItem, Method} from '../../types';
import {useTranslation} from '../../i18n';
import {
  SearchIcon,
  ClearIcon,
  TrashIcon,
  SortArrowIcon,
  FilterIcon,
  ChevronIcon,
  CheckIcon,
  CircleCheckIcon,
  CircleXIcon,
  LayersIcon,
  ClockIcon,
  RequestIcon,
  ResponseIcon,
  AtomIcon,
} from '../NetworkIcons';

const NetworkTab = React.memo(() => {
  const {
    groupedData,
    loadMoreSection,
    search,
    setSearch,
    setSearchScope,
    quickFilter,
    setQuickFilter,
    handleDelete,
    selectedLogs,
    sortOrder,
    setSortOrder,
    statusFilters,
    setStatusFilters,
    methodFilters,
    setMethodFilters,
    filteredLogs,
    logs,
    toggleSectionFilter,
    toggleSectionCollapse,
    minStart,
    totalRange,
    newLogIds,
    toggleSelect,
    setSelected,
  } = useInspector();

  const {t} = useTranslation();
  const apisListRef = useRef<FlatList<any>>(null);

  const [isFilterModalOpen, setIsFilterModalOpen] = React.useState(false);
  const [isSearchFocused, setIsSearchFocused] = React.useState(false);

  const modalFilterState: NetworkFilterState = useMemo(
    () => ({
      statusCodes:
        statusFilters.size > 0 ? new Set(statusFilters) : new Set(['all']),
      methods:
        methodFilters.size > 0 ? new Set(methodFilters) : new Set(['all']),
      latency: 'all',
      protocol: 'all',
      sortBy: sortOrder === 'newest' ? 'time_desc' : 'time_asc',
    }),
    [statusFilters, methodFilters, sortOrder],
  );

  const handleApplyNetworkFilters = useCallback(
    (newFilters: NetworkFilterState) => {
      if (
        newFilters.statusCodes.has('all') ||
        newFilters.statusCodes.size === 0
      ) {
        setStatusFilters(new Set());
      } else {
        setStatusFilters(new Set(newFilters.statusCodes));
      }

      if (newFilters.methods.has('all') || newFilters.methods.size === 0) {
        setMethodFilters(new Set());
      } else {
        setMethodFilters(
          new Set([...newFilters.methods].map(m => m as Method)),
        );
      }

      if (newFilters.sortBy === 'time_asc') {
        setSortOrder('oldest');
      } else {
        setSortOrder('newest');
      }
    },
    [setStatusFilters, setMethodFilters, setSortOrder],
  );

  const quickCounts = useMemo(() => {
    let errorCount = 0;
    let successCount = 0;
    let slowCount = 0;
    let postCount = 0;
    let getCount = 0;
    let gqlCount = 0;

    logs.forEach(l => {
      const s =
        typeof l.status === 'number'
          ? l.status
          : parseInt(String(l.status), 10);
      if (l.status === 0 || l.status == null || (!isNaN(s) && s >= 400)) {
        errorCount++;
      } else if (!isNaN(s) && s >= 200 && s < 400) {
        successCount++;
      }
      if ((l.duration || 0) >= 500) {
        slowCount++;
      }
      const m = (l.method || '').toUpperCase();
      if (m === 'POST') postCount++;
      if (m === 'GET') getCount++;
      const u = (l.url || '').toLowerCase();
      const c = (l.client || '').toLowerCase();
      if (
        u.includes('graphql') ||
        c.includes('graphql') ||
        c.includes('apollo')
      ) {
        gqlCount++;
      }
    });

    return {
      all: logs.length,
      errors: errorCount,
      success: successCount,
      slow: slowCount,
      post: postCount,
      get: getCount,
      graphql: gqlCount,
    };
  }, [logs]);

  const QUICK_CHIPS = useMemo(
    () => [
      {
        id: 'all',
        label: 'All',
        count: quickCounts.all,
        color: AppColors.purple,
      },
      {
        id: 'errors',
        label: 'Errors',
        count: quickCounts.errors,
        color: AppColors.errorColor,
      },
      {
        id: 'success',
        label: '2xx OK',
        count: quickCounts.success,
        color: AppColors.greenColor,
      },
      {
        id: 'slow',
        label: 'Slow >500ms',
        count: quickCounts.slow,
        color: AppColors.warningIconGold,
      },
      {
        id: 'POST',
        label: 'POST',
        count: quickCounts.post,
        color: METHOD_COLORS.POST || '#3B82F6',
      },
      {
        id: 'GET',
        label: 'GET',
        count: quickCounts.get,
        color: METHOD_COLORS.GET || '#10B981',
      },
      {
        id: 'graphql',
        label: 'GraphQL',
        count: quickCounts.graphql,
        color: AppColors.graphqlPink,
      },
    ],
    [quickCounts],
  );



  const renderItem = useCallback(
    ({item, index}: {item: GroupedListItem; index: number}) => {
      if (item.type === 'header') {
        return (
          <AnimatedEntrance index={index} distance={8}>
            <DomainHeader
              pageName={item.pageName}
              color={item.color}
              stats={item.stats}
              activeFilters={item.activeFilters}
              onToggleFilter={toggleSectionFilter}
              isCollapsed={item.isCollapsed}
              onToggleCollapse={toggleSectionCollapse}
              isFirst={item.isFirst}
              timestamp={item.timestamp}
            />
          </AnimatedEntrance>
        );
      }

      if (item.type === 'loadMore') {
        const {
          pageName,
          color,
          remainingCount,
          totalCount,
          loadedCount,
          loadMoreStep,
          hasMore,
        } = item;
        return (
          <View
            style={[
              styles.treeNodeRow,
              styles.treeNodeRowLast,
            ]}>
            <View style={styles.treeLines}>
              <View
                style={[
                  styles.modernTreeLine,
                  {borderColor: color},
                  styles.modernTreeLineLast,
                ]}
              />
            </View>
            <View style={styles.treeCardWrapper}>
              {hasMore ? (
                <TouchableScale
                  onPress={() => loadMoreSection(pageName, 50)}
                  hitSlop={6}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingVertical: 9,
                    paddingHorizontal: 12,
                    marginVertical: 3,
                    marginRight: 2,
                    borderRadius: 10,
                    backgroundColor: `${color}14`,
                    borderWidth: 1.5,
                    borderColor: `${color}40`,
                    shadowColor: color,
                    shadowOffset: {width: 0, height: 1.5},
                    shadowOpacity: 0.1,
                    shadowRadius: 3,
                    elevation: 2,
                  }}>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 8,
                    }}>
                    <View
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 11,
                        backgroundColor: color,
                        alignItems: 'center',
                        justifyContent: 'center',
                        shadowColor: color,
                        shadowOffset: {width: 0, height: 1},
                        shadowOpacity: 0.25,
                        shadowRadius: 2,
                        elevation: 1,
                      }}>
                      <ChevronIcon
                        color={AppColors.white}
                        size={9}
                        direction="down"
                      />
                    </View>
                    <View>
                      <Text
                        style={{
                          fontFamily: AppFonts.interBold,
                          fontSize: 12,
                          color: color,
                        }}>
                        {t('footer.loadMoreRequests', {
                          count: loadMoreStep,
                          defaultValue: `Load ${loadMoreStep} More Requests`,
                        })}
                      </Text>
                      <Text
                        style={{
                          fontFamily: AppFonts.interRegular,
                          fontSize: 9.5,
                          color: AppColors.grayTextWeak,
                          marginTop: 1,
                        }}>
                        Showing {loadedCount} of {totalCount} requests
                      </Text>
                    </View>
                  </View>

                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: `${color}25`,
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: `${color}40`,
                      gap: 3,
                    }}>
                    <Text
                      style={{
                        fontFamily: AppFonts.interBold,
                        fontSize: 10.5,
                        color: color,
                      }}>
                      +{remainingCount}
                    </Text>
                    <Text
                      style={{
                        fontFamily: AppFonts.interRegular,
                        fontSize: 9,
                        color: color,
                      }}>
                      more
                    </Text>
                  </View>
                </TouchableScale>
              ) : (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingVertical: 7,
                    paddingHorizontal: 11,
                    marginVertical: 3,
                    marginRight: 2,
                    borderRadius: 9,
                    backgroundColor: `${color}0A`,
                    borderWidth: 1,
                    borderColor: `${color}25`,
                  }}>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 7,
                    }}>
                    <View
                      style={{
                        width: 17,
                        height: 17,
                        borderRadius: 8.5,
                        backgroundColor: `${color}25`,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                      <CheckIcon color={color} size={8} />
                    </View>
                    <Text
                      style={{
                        fontFamily: AppFonts.interMedium,
                        fontSize: 11,
                        color: AppColors.grayTextStrong,
                      }}>
                      {t('footer.allLoaded', {
                        count: totalCount,
                        defaultValue: `All ${totalCount} requests loaded`,
                      })}
                    </Text>
                  </View>

                  <View
                    style={{
                      backgroundColor: `${color}18`,
                      paddingHorizontal: 7,
                      paddingVertical: 2,
                      borderRadius: 6,
                    }}>
                    <Text
                      style={{
                        fontFamily: AppFonts.interBold,
                        fontSize: 9.5,
                        color: color,
                      }}>
                      {totalCount}/{totalCount}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        );
      }

      const {log, isLast, color} = item;
      return (
        <AnimatedEntrance
          index={index}
          distance={8}
          style={[
            styles.treeNodeRow,
            isLast && styles.treeNodeRowLast,
          ]}>
          <View style={styles.treeLines}>
            <View
              style={[
                styles.modernTreeLine,
                {borderColor: color},
                isLast && styles.modernTreeLineLast,
              ]}
            />
            {!isLast && (
              <View style={[styles.modernTreeBranch, {borderColor: color}]} />
            )}
          </View>
          <View style={styles.treeCardWrapper}>
            <LogCard
              item={log}
              isSelected={selectedLogs.has(log.id)}
              onToggleSelect={toggleSelect}
              onPress={() => {
                setSelected(log);
              }}
              timelineMinStart={minStart}
              timelineTotalRange={totalRange}
              isNew={newLogIds.has(log.id)}
              searchStr={search}
            />
          </View>
        </AnimatedEntrance>
      );
    },
    [
      minStart,
      totalRange,
      newLogIds,
      selectedLogs,
      toggleSelect,
      search,
      toggleSectionFilter,
      toggleSectionCollapse,
      loadMoreSection,
      setSelected,
      t,
    ],
  );

  return (
    <View style={{flex: 1}}>
      <View style={{marginTop: 6}}>
            {/* Toolbar Row with Search & Actions */}
            <View style={styles.toolbarRow}>
              <View
                style={[
                  styles.searchContainer,
                  isSearchFocused && {
                    borderColor: AppColors.purple,
                    borderWidth: 1.5,
                  },
                ]}>
                <SearchIcon
                  color={
                    isSearchFocused
                      ? AppColors.purple
                      : AppColors.grayTextWeak
                  }
                  size={15}
                />
                <TextInput
                  placeholder="Search URL, status, method, headers, body..."
                  placeholderTextColor={AppColors.grayTextWeak}
                  value={search}
                  onChangeText={setSearch}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setIsSearchFocused(false)}
                  style={styles.searchInput}
                  autoCorrect={false}
                  autoCapitalize="none"
                />

                {search.length > 0 && (
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
                        {filteredLogs.length}
                      </Text>
                    </View>
                    <Pressable
                      onPress={() => setSearch('')}
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
                  {selectedLogs.size > 0 && (
                    <View style={styles.trashBadge}>
                      <Text style={styles.trashBadgeText}>
                        {selectedLogs.size}
                      </Text>
                    </View>
                  )}
                </TouchableScale>

                <TouchableScale
                  style={styles.toolbarBtn}
                  onPress={() =>
                    setSortOrder(o =>
                      o === 'newest' ? 'oldest' : 'newest',
                    )
                  }
                  hitSlop={10}>
                  <SortArrowIcon
                    direction={
                      sortOrder === 'newest' ? 'down' : 'up'
                    }
                    color={AppColors.grayTextStrong}
                    size={18}
                  />
                </TouchableScale>

                <TouchableScale
                  style={[
                    styles.toolbarBtn,
                    (statusFilters.size > 0 || methodFilters.size > 0) && {
                      borderColor: AppColors.purple,
                      backgroundColor: `${AppColors.purple}15`,
                    },
                  ]}
                  onPress={() => setIsFilterModalOpen(true)}
                  hitSlop={6}>
                  <FilterIcon
                    color={
                      statusFilters.size > 0 || methodFilters.size > 0
                        ? AppColors.purple
                        : AppColors.grayTextStrong
                    }
                    size={16}
                  />
                  {(statusFilters.size > 0 ||
                    methodFilters.size > 0) && (
                    <View style={styles.activeFilterDot} />
                  )}
                </TouchableScale>
              </View>
            </View>

            {/* Quick Filter Horizontal Chips Bar with Sticky "More Filters" on Right */}
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
                {QUICK_CHIPS.map(chip => {
                  const isActive = quickFilter === chip.id;
                  const chipColor = chip.color || AppColors.purple;
                  const iconColor = isActive ? AppColors.white : chipColor;
                  return (
                    <TouchableScale
                      key={chip.id}
                      onPress={() => {
                        setQuickFilter(isActive ? 'all' : chip.id);
                      }}>
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
                        {chip.id === 'all' && <LayersIcon size={11} color={iconColor} />}
                        {chip.id === 'errors' && <CircleXIcon size={11} color={iconColor} />}
                        {chip.id === 'success' && <CircleCheckIcon size={11} color={iconColor} />}
                        {chip.id === 'slow' && <ClockIcon size={11} color={iconColor} />}
                        {chip.id === 'POST' && <RequestIcon size={11} color={iconColor} />}
                        {chip.id === 'GET' && <ResponseIcon size={11} color={iconColor} />}
                        {chip.id === 'graphql' && <AtomIcon size={11} color={iconColor} />}
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
                          }}>
                          <Text
                            style={{
                              fontFamily: AppFonts.interBold,
                              fontSize: 9,
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

              <TouchableScale
                onPress={() => setIsFilterModalOpen(true)}
                style={{flexShrink: 0}}>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 10,
                    paddingVertical: 4.5,
                    borderRadius: 8,
                    backgroundColor:
                      statusFilters.size > 0 || methodFilters.size > 0
                        ? `${AppColors.purple}20`
                        : AppColors.grayBackground,
                    borderWidth: 1,
                    borderColor:
                      statusFilters.size > 0 || methodFilters.size > 0
                        ? AppColors.purple
                        : AppColors.grayBorderSecondary,
                    gap: 5,
                    shadowColor: AppColors.black,
                    shadowOpacity: 0.04,
                    shadowRadius: 2,
                    shadowOffset: {width: 0, height: 1},
                    elevation: 1,
                  }}>
                  <FilterIcon
                    size={11}
                    color={
                      statusFilters.size > 0 || methodFilters.size > 0
                        ? AppColors.purple
                        : AppColors.grayText
                    }
                  />
                  <Text
                    style={{
                      fontFamily: AppFonts.interBold,
                      fontSize: 10.5,
                      color:
                        statusFilters.size > 0 || methodFilters.size > 0
                          ? AppColors.purple
                          : AppColors.grayText,
                    }}>
                    More Filters
                  </Text>
                  {(statusFilters.size > 0 || methodFilters.size > 0) && (
                    <View
                      style={{
                        backgroundColor: AppColors.purple,
                        paddingHorizontal: 4.5,
                        paddingVertical: 1,
                        borderRadius: 6,
                      }}>
                      <Text
                        style={{
                          fontFamily: AppFonts.interBold,
                          fontSize: 8.5,
                          color: AppColors.white,
                        }}>
                        {statusFilters.size + methodFilters.size}
                      </Text>
                    </View>
                  )}
                </View>
              </TouchableScale>
            </View>

            {/* Active Filter Helper Status Bar */}
            {(quickFilter !== 'all' ||
              search.trim().length > 0 ||
              statusFilters.size > 0 ||
              methodFilters.size > 0 ||
              filteredLogs.length !== logs.length) && (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginHorizontal: 12,
                  marginBottom: 8,
                  paddingHorizontal: 10,
                  paddingVertical: 5.5,
                  backgroundColor: `${AppColors.purple}10`,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: `${AppColors.purple}25`,
                }}>
                <Text
                  style={{
                    fontFamily: AppFonts.interMedium,
                    fontSize: 10.5,
                    color: AppColors.purple,
                  }}>
                  Showing {filteredLogs.length} of {logs.length} requests
                </Text>
                <TouchableScale
                  onPress={() => {
                    setSearch('');
                    setQuickFilter('all');
                    setStatusFilters(new Set());
                    setMethodFilters(new Set());
                  }}>
                  <Text
                    style={{
                      fontFamily: AppFonts.interBold,
                      fontSize: 10.5,
                      color: AppColors.errorColor,
                    }}>
                    Clear All Filters
                  </Text>
                </TouchableScale>
              </View>
            )}
          </View>

        <FlatList
          ref={apisListRef}
          data={groupedData}
          keyExtractor={item => item?.id?.toString()}
          renderItem={renderItem}
          initialNumToRender={15}
          maxToRenderPerBatch={10}
          windowSize={9}
          removeClippedSubviews={Platform.OS === 'android'}
          renderToHardwareTextureAndroid={true}
          ListEmptyComponent={
          <EmptyState
            isSearch={
              search.length > 0 ||
              statusFilters.size > 0 ||
              methodFilters.size > 0 ||
              quickFilter !== 'all'
            }
            searchQuery={search}
            customTitle={
              search.length > 0
                ? 'No matching API requests'
                : 'No network activity'
            }
            onClearSearch={() => {
              setSearch('');
              setStatusFilters(new Set());
              setMethodFilters(new Set());
              setQuickFilter('all');
              setSearchScope('all');
            }}
          />
        }
        ListFooterComponent={
          groupedData.length > 0 ? (
            <EndOfListFooter
              count={filteredLogs.length}
              totalCount={filteredLogs.length}
              label="requests"
            />
          ) : null
        }
        contentContainerStyle={[
          styles.listContent,
          filteredLogs.length === 0 && {flexGrow: 1},
        ]}
        keyboardShouldPersistTaps="handled"
      />

      {/* Modern Network Filter Modal */}
      <NetworkFilterModal
        visible={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        filters={modalFilterState}
        onApply={handleApplyNetworkFilters}
        searchQuery={search}
      />
    </View>
  );
});

export default NetworkTab;