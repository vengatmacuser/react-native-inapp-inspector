import React, {useCallback, useRef} from 'react';
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
} from '../NetworkIcons';

const STATUS_META: Record<
  string,
  {color: string; Icon: (props: {color?: string; size?: number}) => React.JSX.Element}
> = {
  ALL: {color: AppColors.grayText, Icon: LayersIcon},
  '2xx': {color: AppColors.greenColor, Icon: CircleCheckIcon},
  '3xx': {color: AppColors.warningIconGold, Icon: CircleAlertIcon},
  '4xx': {color: AppColors.darkOrange, Icon: CircleAlertIcon},
  '5xx': {color: AppColors.errorColor, Icon: CircleXIcon},
  Failed: {color: AppColors.errorColor, Icon: CircleXIcon},
};

const FilterChip = ({
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
            <View style={styles.filterChipIcon}>
              <Icon color={iconColor} size={13} />
            </View>
          )
        )}
        <Text
          style={[
            styles.statusFilterText,
            active && {color, fontFamily: AppFonts.interBold},
          ]}>
          {label}
        </Text>
      </View>
    </TouchableScale>
  );
};

const NetworkTab = () => {
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

  const filtersAccordion = useAccordion(false, 300, 260);
  const apisListRef = useRef<FlatList<any>>(null);

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
        <AnimatedEntrance index={index} distance={8} style={styles.treeNodeRow}>
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
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews={true}
        ListHeaderComponent={
          <View style={{marginTop: 8}}>
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
                    const meta = STATUS_META[filter] ?? {
                      color: AppColors.grayText,
                      Icon: LayersIcon,
                    };
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
          apisListRef.current?.scrollToOffset({
            offset: 0,
            animated: true,
          });
        }}
        hitSlop={10}
        style={styles.scrollTopBtn}>
        <View style={{transform: [{rotate: '180deg'}]}}>
          <ChevronIcon color={AppColors.white} size={18} />
        </View>
      </TouchableScale>
    </View>
  );
};

export default NetworkTab;