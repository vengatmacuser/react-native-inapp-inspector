import React, {useCallback, useMemo, useRef} from 'react';
import {
  Animated,
  FlatList,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import {animateNextLayout, useInspector} from './InspectorContext';
import useAccordion from '../../customHooks/useAccordion';
import TouchableScale from '../TouchableScale';
import AnimatedEntrance from '../AnimatedEntrance';
import DomainHeader from '../DomainHeader';
import LogCard from '../LogCard';
import EmptyState from '../EmptyState';
import EndOfListFooter from '../EndOfListFooter';
import styles from '../../styles';
import {AppColors} from '../../styles/AppColors';
import {AppFonts} from '../../styles/AppFonts';
import {STATUS_FILTERS, METHOD_COLORS} from '../../constants';
import {GroupedListItem, Method, SearchScope} from '../../types';
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
  CircleAlertIcon,
  LayersIcon,
  HeaderPauseIcon,
  ClockIcon,
  GlobeIcon,
  RequestIcon,
  ResponseIcon,
  HeadersIcon,
  AtomIcon,
  BoltIcon,
  ShieldAlertIcon,
} from '../NetworkIcons';

const STATUS_META: Record<
  string,
  {color: string; Icon: (props: {color?: string; size?: number}) => React.JSX.Element}
> = {
  ALL: {color: AppColors.grayText, Icon: LayersIcon},
  '2xx': {color: AppColors.greenColor, Icon: CircleCheckIcon},
  '200': {color: AppColors.greenColor, Icon: CircleCheckIcon},
  '3xx': {color: AppColors.warningIconGold, Icon: CircleAlertIcon},
  '300': {color: AppColors.warningIconGold, Icon: CircleAlertIcon},
  '4xx': {color: AppColors.darkOrange, Icon: CircleAlertIcon},
  '400': {color: AppColors.darkOrange, Icon: CircleAlertIcon},
  '404': {color: AppColors.darkOrange, Icon: CircleAlertIcon},
  '5xx': {color: AppColors.errorColor, Icon: CircleXIcon},
  '500': {color: AppColors.errorColor, Icon: CircleXIcon},
  Failed: {color: AppColors.errorColor, Icon: CircleXIcon},
};

const getStatusMeta = (filter: string) => {
  if (STATUS_META[filter]) return STATUS_META[filter];
  const num = parseInt(filter, 10);
  if (!isNaN(num)) {
    if (num >= 200 && num < 300) return {color: AppColors.greenColor, Icon: CircleCheckIcon};
    if (num >= 300 && num < 400) return {color: AppColors.warningIconGold, Icon: CircleAlertIcon};
    if (num >= 400 && num < 500) return {color: AppColors.darkOrange, Icon: CircleAlertIcon};
    if (num >= 500) return {color: AppColors.errorColor, Icon: CircleXIcon};
  }
  if (filter.startsWith('2')) return {color: AppColors.greenColor, Icon: CircleCheckIcon};
  if (filter.startsWith('3')) return {color: AppColors.warningIconGold, Icon: CircleAlertIcon};
  if (filter.startsWith('4')) return {color: AppColors.darkOrange, Icon: CircleAlertIcon};
  if (filter.startsWith('5')) return {color: AppColors.errorColor, Icon: CircleXIcon};
  return {color: AppColors.grayText, Icon: LayersIcon};
};

const FilterChip = React.memo(({
  label,
  color,
  Icon,
  badge,
  active,
  onPress,
}: {
  label: string;
  color: string;
  Icon?: (props: {color?: string; size?: number}) => React.JSX.Element;
  badge?: string;
  active: boolean;
  onPress: () => void;
}) => {
  const iconColor = active ? color : AppColors.grayTextWeak;
  return (
    <TouchableScale
      style={styles.statusFilterWrap}
      onPress={onPress}
      hitSlop={10}>
      <View
        style={[
          styles.statusFilterChip,
          {
            paddingHorizontal: 9,
            paddingVertical: 5,
            borderRadius: 7,
            borderWidth: 1,
            borderColor: active ? color : `${AppColors.grayBorderSecondary}`,
            backgroundColor: active ? `${color}14` : AppColors.grayBackground,
          },
          active && {
            shadowColor: color,
            shadowOffset: {width: 0, height: 1},
            shadowOpacity: 0.2,
            shadowRadius: 2,
            elevation: 1.5,
          },
        ]}>
        {badge != null ? (
          <View
            style={[
              styles.methodBadgeMini,
              {backgroundColor: badge},
            ]}
          />
        ) : (
          Icon && (
            <Icon
              color={iconColor}
              size={13}
            />
          )
        )}
        <Text
          numberOfLines={1}
          style={[
            styles.statusFilterText,
            {
              color: active ? color : AppColors.grayText,
              fontFamily: active ? AppFonts.interBold : AppFonts.interMedium,
            },
          ]}>
          {label}
        </Text>
      </View>
    </TouchableScale>
  );
});

const NetworkTab = React.memo(() => {
  const {
    groupedData,
    search,
    setSearch,
    searchScope,
    setSearchScope,
    isRegexSearch,
    setIsRegexSearch,
    isCaseSensitive,
    setIsCaseSensitive,
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
    availableMethods,
    filteredLogs,
    logs,
    toggleSectionFilter,
    toggleSectionCollapse,
    minStart,
    totalRange,
    newLogIds,
    toggleSelect,
    setSelected,
    isNetworkPaused,
    setIsNetworkPaused,
  } = useInspector();

  const {t} = useTranslation();
  const filtersAccordion = useAccordion(false, 300, 260);
  const apisListRef = useRef<FlatList<any>>(null);

  const [isSearchFocused, setIsSearchFocused] = React.useState(false);

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
        color: '#E10098',
      },
    ],
    [quickCounts],
  );

  const SEARCH_SCOPES: Array<{
    id: SearchScope;
    label: string;
    icon: (color: string) => React.JSX.Element;
  }> = [
    {
      id: 'all',
      label: 'All',
      icon: color => <LayersIcon size={9.5} color={color} />,
    },
    {
      id: 'url',
      label: 'URL / Path',
      icon: color => <GlobeIcon size={9.5} color={color} />,
    },
    {
      id: 'reqBody',
      label: 'Payload',
      icon: color => <RequestIcon size={9.5} color={color} />,
    },
    {
      id: 'resBody',
      label: 'Response',
      icon: color => <ResponseIcon size={9.5} color={color} />,
    },
    {
      id: 'headers',
      label: 'Headers',
      icon: color => <HeadersIcon size={9.5} color={color} />,
    },
  ];

  const QUICK_API_QUERY_TAGS = useMemo(
    () => [
      {
        label: 'Failed',
        query: 'is:error',
        icon: (color: string) => <CircleXIcon size={9.5} color={color} />,
      },
      {
        label: 'Slow (>1s)',
        query: 'slow:>1s',
        icon: (color: string) => <ClockIcon size={9.5} color={color} />,
      },
      {
        label: 'POST',
        query: 'm:POST',
        icon: (color: string) => <RequestIcon size={9.5} color={color} />,
      },
      {
        label: 'GET',
        query: 'm:GET',
        icon: (color: string) => <ResponseIcon size={9.5} color={color} />,
      },
      {
        label: 'GraphQL',
        query: 'is:graphql',
        icon: (color: string) => <AtomIcon size={9.5} color={color} />,
      },
      {
        label: 'Axios',
        query: 'client:axios',
        icon: (color: string) => <BoltIcon size={9.5} color={color} />,
      },
      {
        label: '200 OK',
        query: 'status:200',
        icon: (color: string) => <CircleCheckIcon size={9.5} color={color} />,
      },
      {
        label: '404',
        query: 'status:404',
        icon: (color: string) => <CircleAlertIcon size={9.5} color={color} />,
      },
      {
        label: '500',
        query: 'status:500',
        icon: (color: string) => <CircleXIcon size={9.5} color={color} />,
      },
      {
        label: 'HTTPS',
        query: 'is:https',
        icon: (color: string) => <ShieldAlertIcon size={9.5} color={color} />,
      },
    ],
    [],
  );

  const networkMetrics = useMemo(() => {
    if (!logs || logs.length === 0) return null;
    let successCount = 0;
    let completedCount = 0;
    let totalDuration = 0;
    let totalBytes = 0;
    const durations: number[] = [];

    logs.forEach(log => {
      if (log.status != null) {
        completedCount++;
        const s = typeof log.status === 'number' ? log.status : parseInt(String(log.status), 10);
        if (!isNaN(s)) {
          if (s >= 200 && s < 400) {
            successCount++;
          }
        }
      }
      if (typeof log.duration === 'number' && log.duration > 0) {
        durations.push(log.duration);
        totalDuration += log.duration;
      }
    });

    durations.sort((a, b) => a - b);
    const avgDuration = durations.length > 0 ? Math.round(totalDuration / durations.length) : 0;
    const p95 = durations.length > 0 ? durations[Math.floor(durations.length * 0.95)] : 0;
    const successRate = completedCount > 0 ? Math.round((successCount / completedCount) * 100) : 100;

    return {
      successRate,
      avgDuration,
      p95,
      totalCount: logs.length,
    };
  }, [logs]);

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
                animateNextLayout();
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
      setSelected,
    ],
  );

  return (
    <View style={{flex: 1}}>
      <FlatList
        ref={apisListRef}
        data={groupedData}
        keyExtractor={item => item?.id?.toString()}
        renderItem={renderItem}
        initialNumToRender={12}
        maxToRenderPerBatch={8}
        windowSize={5}
        removeClippedSubviews={true}
        renderToHardwareTextureAndroid={true}
        ListHeaderComponent={
          <View style={{marginTop: 6}}>
            {/* Network Health & Telemetry Strip */}
            {networkMetrics != null && networkMetrics.totalCount > 0 && (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: AppColors.grayBackground,
                  borderRadius: 8,
                  paddingHorizontal: 10,
                  paddingVertical: 5.5,
                  marginHorizontal: 12,
                  marginBottom: 6,
                  borderWidth: 1,
                  borderColor: AppColors.dividerColor,
                }}>
                {/* Success Rate */}
                <View style={{flexDirection: 'row', alignItems: 'center', gap: 4.5}}>
                  <View
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: 3,
                      backgroundColor:
                        networkMetrics.successRate >= 95
                          ? AppColors.greenColor
                          : networkMetrics.successRate >= 80
                          ? AppColors.amber500
                          : AppColors.errorColor,
                    }}
                  />
                  <Text style={{fontFamily: AppFonts.interBold, fontSize: 10.5, color: AppColors.primaryBlack}}>
                    {networkMetrics.successRate}%
                  </Text>
                  <Text style={{fontFamily: AppFonts.interRegular, fontSize: 10, color: AppColors.grayTextWeak}}>
                    {t('network.successRate')}
                  </Text>
                </View>

                <View style={{width: 1, height: 11, backgroundColor: AppColors.dividerColor}} />

                {/* Avg Latency */}
                <View style={{flexDirection: 'row', alignItems: 'center', gap: 4}}>
                  <ClockIcon color={AppColors.purple} size={10} />
                  <Text style={{fontFamily: AppFonts.interBold, fontSize: 10.5, color: AppColors.purple}}>
                    {networkMetrics.avgDuration}ms
                  </Text>
                  <Text style={{fontFamily: AppFonts.interRegular, fontSize: 10, color: AppColors.grayTextWeak}}>
                    {t('network.avgLatency')}
                  </Text>
                </View>

                <View style={{width: 1, height: 11, backgroundColor: AppColors.dividerColor}} />

                {/* P95 Latency */}
                <View style={{flexDirection: 'row', alignItems: 'center', gap: 4}}>
                  <Text style={{fontFamily: AppFonts.interBold, fontSize: 10.5, color: AppColors.primaryBlack}}>
                    {networkMetrics.p95}ms
                  </Text>
                  <Text style={{fontFamily: AppFonts.interRegular, fontSize: 10, color: AppColors.grayTextWeak}}>
                    P95
                  </Text>
                </View>
              </View>
            )}

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
                  placeholder="Search url, body, is:error, slow:>1s..."
                  placeholderTextColor={AppColors.grayTextWeak}
                  value={search}
                  onChangeText={setSearch}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setIsSearchFocused(false)}
                  style={styles.searchInput}
                  autoCorrect={false}
                  autoCapitalize="none"
                />

                {/* Match Case (Aa) & Regex (.*) Quick Toggles */}
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 3,
                    marginRight: 2,
                  }}>
                  <Pressable
                    hitSlop={8}
                    onPress={() => setIsCaseSensitive(prev => !prev)}
                    style={{
                      paddingHorizontal: 4.5,
                      paddingVertical: 2,
                      borderRadius: 4,
                      backgroundColor: isCaseSensitive
                        ? AppColors.purple
                        : 'transparent',
                      borderWidth: 1,
                      borderColor: isCaseSensitive
                        ? AppColors.purple
                        : `${AppColors.grayBorderSecondary}`,
                    }}>
                    <Text
                      style={{
                        fontFamily: AppFonts.interBold,
                        fontSize: 9.5,
                        color: isCaseSensitive
                          ? AppColors.white
                          : AppColors.grayTextWeak,
                      }}>
                      Aa
                    </Text>
                  </Pressable>

                  <Pressable
                    hitSlop={8}
                    onPress={() => setIsRegexSearch(prev => !prev)}
                    style={{
                      paddingHorizontal: 4.5,
                      paddingVertical: 2,
                      borderRadius: 4,
                      backgroundColor: isRegexSearch
                        ? AppColors.purple
                        : 'transparent',
                      borderWidth: 1,
                      borderColor: isRegexSearch
                        ? AppColors.purple
                        : `${AppColors.grayBorderSecondary}`,
                    }}>
                    <Text
                      style={{
                        fontFamily: AppFonts.interBold,
                        fontSize: 9.5,
                        color: isRegexSearch
                          ? AppColors.white
                          : AppColors.grayTextWeak,
                      }}>
                      .*
                    </Text>
                  </Pressable>
                </View>

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
                        paddingHorizontal: 5,
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
                    isNetworkPaused && {
                      borderColor: `${AppColors.darkOrange}50`,
                      backgroundColor: `${AppColors.darkOrange}18`,
                    },
                  ]}
                  onPress={() => setIsNetworkPaused(p => !p)}
                  hitSlop={6}>
                  <HeaderPauseIcon
                    isPaused={isNetworkPaused}
                    color={
                      isNetworkPaused
                        ? AppColors.darkOrange
                        : AppColors.grayTextStrong
                    }
                    size={16}
                  />
                </TouchableScale>

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
                    filtersAccordion.isOpen &&
                      styles.toolbarBtnActive,
                  ]}
                  onPress={filtersAccordion.toggleOpen}
                  hitSlop={10}>
                  <FilterIcon
                    color={
                      filtersAccordion.isOpen
                        ? AppColors.purple
                        : AppColors.grayTextStrong
                    }
                    size={18}
                  />
                </TouchableScale>
              </View>
            </View>

            {/* Quick Filter Horizontal Chips Bar with Live Counts */}
            <View style={{marginBottom: 8}}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{
                  paddingHorizontal: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
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
            </View>

            {/* Search Scope Selector Bar (Visible on search or focus) */}
            {(isSearchFocused || search.length > 0) && (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 12,
                  marginBottom: 6,
                  gap: 6,
                }}>
                <Text
                  style={{
                    fontFamily: AppFonts.interBold,
                    fontSize: 9.5,
                    color: AppColors.grayTextWeak,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                  }}>
                  Scope:
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 5,
                  }}>
                  {SEARCH_SCOPES.map(s => {
                    const isSelected = searchScope === s.id;
                    const iconColor = isSelected ? AppColors.white : AppColors.grayText;
                    return (
                      <TouchableScale
                        key={s.id}
                        onPress={() => setSearchScope(s.id)}>
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 4,
                            paddingHorizontal: 7,
                            paddingVertical: 2.5,
                            borderRadius: 5,
                            backgroundColor: isSelected
                              ? AppColors.purple
                              : `${AppColors.grayBorderSecondary}40`,
                            borderWidth: 1,
                            borderColor: isSelected
                              ? AppColors.purple
                              : AppColors.grayBorderSecondary,
                          }}>
                          {s.icon(iconColor)}
                          <Text
                            style={{
                              fontFamily: AppFonts.interBold,
                              fontSize: 9.5,
                              color: isSelected
                                ? AppColors.white
                                : AppColors.grayText,
                            }}>
                            {s.label}
                          </Text>
                        </View>
                      </TouchableScale>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            {/* Advanced Search Quick Query Suggestions Bar */}
            {(isSearchFocused || search.length > 0) && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{marginBottom: 8, maxHeight: 28}}
                contentContainerStyle={{
                  paddingHorizontal: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 5,
                }}>
                {QUICK_API_QUERY_TAGS.map(item => {
                  const isSelected = search.includes(item.query);
                  return (
                    <TouchableScale
                      key={item.query}
                      onPress={() => {
                        if (isSelected) {
                          setSearch(prev =>
                            prev.replace(item.query, '').trim(),
                          );
                        } else {
                          setSearch(prev =>
                            prev ? `${prev} ${item.query}`.trim() : item.query,
                          );
                        }
                      }}>
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 4,
                          paddingHorizontal: 7,
                          paddingVertical: 2.5,
                          borderRadius: 5,
                          backgroundColor: isSelected
                            ? AppColors.purple
                            : `${AppColors.purple}14`,
                          borderWidth: 1,
                          borderColor: isSelected
                            ? AppColors.purple
                            : `${AppColors.purple}30`,
                        }}>
                        {item.icon(isSelected ? AppColors.white : AppColors.purple)}
                        <Text
                          style={{
                            fontFamily: AppFonts.interBold,
                            fontSize: 9.5,
                            color: isSelected
                              ? AppColors.white
                              : AppColors.purple,
                          }}>
                          {item.label}
                        </Text>
                      </View>
                    </TouchableScale>
                  );
                })}
              </ScrollView>
            )}

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

            <Animated.View
              style={[
                filtersAccordion.bodyStyle,
                {overflow: 'hidden'},
              ]}>
              <View style={styles.filtersContainer}>
                <Text style={styles.filtersHeading}>
                  STATUS
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={
                    styles.statusRowContent
                  }>
                  {STATUS_FILTERS.map(filter => {
                    const isAll = filter === 'ALL';
                    const active = isAll
                      ? statusFilters.size === 0
                      : statusFilters.has(filter);
                    const meta = getStatusMeta(filter);
                    return (
                      <FilterChip
                        key={filter}
                        label={filter}
                        color={meta.color}
                        Icon={meta.Icon}
                        active={active}
                        onPress={() => {
                          if (isAll) {
                            setStatusFilters(new Set());
                          } else {
                            setStatusFilters(prev => {
                              const next = new Set(prev);
                              next.has(filter)
                                ? next.delete(filter)
                                : next.add(filter);
                              return next;
                            });
                          }
                        }}
                      />
                    );
                  })}
                </ScrollView>

                <Text
                  style={[
                    styles.filtersHeading,
                    {marginTop: 16},
                  ]}>
                  METHOD
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={
                    styles.statusRowContent
                  }>
                  {availableMethods.map(filter => {
                    const isAll = filter === 'ALL';
                    const active = isAll
                      ? methodFilters.size === 0
                      : methodFilters.has(filter as Method);
                    const methodColor =
                      METHOD_COLORS[filter as Method] ??
                      METHOD_COLORS.ALL;
                    return (
                      <FilterChip
                        key={filter}
                        label={filter}
                        color={methodColor}
                        badge={methodColor}
                        active={active}
                        onPress={() => {
                          if (isAll) {
                            setMethodFilters(new Set());
                          } else {
                            setMethodFilters(prev => {
                              const next = new Set(prev);
                              next.has(filter as Method)
                                ? next.delete(filter as Method)
                                : next.add(filter as Method);
                              return next;
                            });
                          }
                        }}
                      />
                    );
                  })}
                </ScrollView>
              </View>
            </Animated.View>

            {(search ||
              statusFilters.size > 0 ||
              methodFilters.size > 0) && (
              <Text style={styles.resultCount}>
                {filteredLogs.length === logs.length
                  ? `${logs.length} requests`
                  : `${filteredLogs.length} of ${logs.length} filtered requests`}
              </Text>
            )}
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            isSearch={
              search.length > 0 || statusFilters.size > 0
            }
          />
        }
        ListFooterComponent={
          groupedData.length > 0 ? (
            <EndOfListFooter count={filteredLogs.length} label="requests" />
          ) : null
        }
        contentContainerStyle={[
          styles.listContent,
          filteredLogs.length === 0 && {flexGrow: 1},
        ]}
        keyboardShouldPersistTaps="handled"
      />
      {/* #2 — always-visible scroll-to-top, bottom right */}
      <TouchableScale
        onPress={() => {
          try {
            apisListRef.current?.scrollToOffset({
              offset: 0,
              animated: true,
            });
          } catch {
            try {
              apisListRef.current?.scrollToIndex({
                index: 0,
                animated: true,
              });
            } catch {}
          }
        }}
        hitSlop={12}
        style={styles.scrollTopBtn}>
        <View style={{transform: [{rotate: '180deg'}]}}>
          <ChevronIcon color={AppColors.white} size={18} />
        </View>
      </TouchableScale>
    </View>
  );
});

export default NetworkTab;