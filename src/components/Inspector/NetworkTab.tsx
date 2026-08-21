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
  CircleAlertIcon,
  LayersIcon,
  HeaderPauseIcon,
  ClockIcon,
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
          active && {
            borderColor: color,
            backgroundColor: `${color}12`,
          },
        ]}>
        <View
          style={[
            styles.filterCheckbox,
            active && [
              styles.filterCheckboxActive,
              {backgroundColor: color},
            ],
          ]}>
          {active && (
            <CheckIcon color={AppColors.white} size={10} />
          )}
        </View>
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
            active && {
              color,
              fontFamily: AppFonts.interBold,
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

            <View style={styles.toolbarRow}>
              <View style={styles.searchContainer}>
                <SearchIcon
                  color={AppColors.grayTextWeak}
                  size={16}
                />
                <TextInput
                  placeholder="Search endpoints..."
                  placeholderTextColor={AppColors.grayTextWeak}
                  value={search}
                  onChangeText={setSearch}
                  style={styles.searchInput}
                  autoCorrect={false}
                  autoCapitalize="none"
                />
                {search.length > 0 && (
                  <Pressable
                    onPress={() => setSearch('')}
                    hitSlop={10}
                    style={styles.clearBtn}>
                    <ClearIcon
                      color={AppColors.grayTextWeak}
                      size={14}
                    />
                  </Pressable>
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