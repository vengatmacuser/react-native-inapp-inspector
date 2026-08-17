import React, {useCallback, useMemo, useState} from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {useInspector} from './InspectorContext';
import TouchableScale from '../TouchableScale';
import AnimatedEntrance from '../AnimatedEntrance';
import EmptyState from '../EmptyState';
import EndOfListFooter from '../EndOfListFooter';
import HighlightText from '../HighlightText';
import {getSize} from '../../helpers';
import styles from '../../styles';
import {AppColors} from '../../styles/AppColors';
import {AppFonts} from '../../styles/AppFonts';
import {
  TerminalIcon,
  SearchIcon,
  ClearIcon,
  LayersIcon,
  ClockIcon,
  ForwardChevronIcon,
  SortArrowIcon,
} from '../NetworkIcons';

interface ReduxSliceItem {
  id: string;
  name: string;
  keysCount: number;
  sizeStr: string;
  lastAction?: {
    type: string;
    timestamp: string;
    updatedAt?: number;
  };
  updatedAt: number;
}

const ReduxTab = React.memo(() => {
  const {
    reduxState,
    reduxLastActionMap,
    reduxSearch,
    setReduxSearch,
    setSelectedReduxSlice,
  } = useInspector();

  // Sort mode: 'latest' (newest updated first) vs 'alpha' (A-Z)
  const [sortMode, setSortMode] = useState<'latest' | 'alpha'>('latest');

  // Total state size calculation
  const totalStateSize = useMemo(() => {
    return getSize(reduxState);
  }, [reduxState]);

  // Compute slice items with exact timestamps
  const sliceItems: ReduxSliceItem[] = useMemo(() => {
    if (!reduxState || typeof reduxState !== 'object') return [];
    const keys = Object.keys(reduxState);
    return keys.map(key => {
      const sliceVal = reduxState[key];
      const keysCount =
        sliceVal && typeof sliceVal === 'object'
          ? Object.keys(sliceVal).length
          : typeof sliceVal !== 'undefined'
          ? 1
          : 0;
      const lastAction = reduxLastActionMap[key];
      const updatedAt = lastAction?.updatedAt || 0;

      return {
        id: `slice-${key}`,
        name: key,
        keysCount,
        sizeStr: getSize(sliceVal),
        lastAction,
        updatedAt,
      };
    });
  }, [reduxState, reduxLastActionMap]);

  // Filter & Sort slices: by default, the most recently updated item is at the FIRST position
  const filteredSlices = useMemo(() => {
    let list = sliceItems;
    if (reduxSearch.trim().length > 0) {
      const q = reduxSearch.toLowerCase();
      list = list.filter(item =>
        item.name.toLowerCase().includes(q) ||
        (item.lastAction && item.lastAction.type.toLowerCase().includes(q)),
      );
    }

    return [...list].sort((a, b) => {
      if (sortMode === 'latest') {
        // Most recently updated item first
        if (b.updatedAt !== a.updatedAt) {
          return b.updatedAt - a.updatedAt;
        }
        return a.name.localeCompare(b.name);
      } else {
        // Alphabetical A-Z
        return a.name.localeCompare(b.name);
      }
    });
  }, [sliceItems, reduxSearch, sortMode]);

  const lastGlobalAction = useMemo(() => {
    const actions = Object.values(reduxLastActionMap);
    if (actions.length === 0) return null;
    return actions.reduce((latest, curr) => {
      if (!latest) return curr;
      return (curr.updatedAt || 0) > (latest.updatedAt || 0) ? curr : latest;
    }, null as any);
  }, [reduxLastActionMap]);

  const renderSliceItem = useCallback(
    ({item, index}: {item: ReduxSliceItem; index: number}) => {
      const isRecentlyUpdated =
        item.updatedAt > 0 && Date.now() - item.updatedAt < 5000;

      return (
        <AnimatedEntrance index={index} distance={8}>
          <TouchableScale
            onPress={() => setSelectedReduxSlice(item.name)}
            style={[
              reduxTabStyles.card,
              isRecentlyUpdated && reduxTabStyles.cardRecentlyUpdated,
            ]}>
            {/* Top row: Badge + Slice Name + Timestamp + Chevron */}
            <View style={reduxTabStyles.cardHeader}>
              <View style={reduxTabStyles.sliceBadge}>
                <Text style={reduxTabStyles.sliceBadgeText}>SLICE</Text>
              </View>

              <HighlightText
                text={item.name}
                search={reduxSearch}
                style={reduxTabStyles.sliceName}
                highlightStyle={reduxTabStyles.highlight}
              />

              {item.lastAction?.timestamp && (
                <View style={reduxTabStyles.timePill}>
                  <ClockIcon color={AppColors.purple} size={10} />
                  <Text style={reduxTabStyles.timeText}>
                    {item.lastAction.timestamp}
                  </Text>
                </View>
              )}

              <ForwardChevronIcon color={AppColors.grayTextWeak} size={13} />
            </View>

            {/* Middle row: Stats pills */}
            <View style={reduxTabStyles.statsRow}>
              <View style={reduxTabStyles.pill}>
                <Text style={reduxTabStyles.pillLabel}>Keys:</Text>
                <Text style={reduxTabStyles.pillValue}>{item.keysCount}</Text>
              </View>
              <View style={reduxTabStyles.pill}>
                <Text style={reduxTabStyles.pillLabel}>Size:</Text>
                <Text style={reduxTabStyles.pillValue}>{item.sizeStr}</Text>
              </View>
              <View style={reduxTabStyles.livePill}>
                <View style={reduxTabStyles.liveDot} />
                <Text style={reduxTabStyles.livePillText}>Live</Text>
              </View>
            </View>

            {/* Bottom row: Last Dispatched Action */}
            {item.lastAction && (
              <View style={reduxTabStyles.lastActionRow}>
                <Text style={reduxTabStyles.lastActionLabel}>Last Action:</Text>
                <HighlightText
                  text={item.lastAction.type}
                  search={reduxSearch}
                  style={reduxTabStyles.lastActionValue}
                  highlightStyle={reduxTabStyles.highlight}
                  numberOfLines={1}
                />
              </View>
            )}
          </TouchableScale>
        </AnimatedEntrance>
      );
    },
    [reduxSearch, setSelectedReduxSlice],
  );

  if (!reduxState) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconWrap}>
          <TerminalIcon color={AppColors.purple} size={32} />
        </View>
        <Text style={styles.emptyTitle}>No Redux Store Connected</Text>
        <Text style={styles.emptySub}>
          Call connectReduxStore(store) or use inspectorReduxMiddleware at app initialization.
        </Text>
      </View>
    );
  }

  return (
    <View style={{flex: 1, backgroundColor: AppColors.grayBackground}}>
      {/* ─── Top Stats Overview Card ─── */}
      <View style={reduxTabStyles.overviewCard}>
        <View style={reduxTabStyles.statCol}>
          <Text style={reduxTabStyles.statHeading}>ACTIVE SLICES</Text>
          <Text style={reduxTabStyles.statBigVal}>{sliceItems.length}</Text>
        </View>
        <View style={reduxTabStyles.statDivider} />
        <View style={reduxTabStyles.statCol}>
          <Text style={reduxTabStyles.statHeading}>TOTAL STATE</Text>
          <Text style={reduxTabStyles.statBigVal}>{totalStateSize}</Text>
        </View>
        <View style={reduxTabStyles.statDivider} />
        <View style={[reduxTabStyles.statCol, {flex: 1.5}]}>
          <Text style={reduxTabStyles.statHeading}>LAST ACTION</Text>
          <Text style={reduxTabStyles.statLastAction} numberOfLines={1}>
            {lastGlobalAction ? lastGlobalAction.type : 'Initial'}
          </Text>
          {lastGlobalAction?.timestamp && (
            <Text style={reduxTabStyles.statLastTime}>
              {lastGlobalAction.timestamp}
            </Text>
          )}
        </View>
      </View>

      {/* ─── Search & Sort Bar ─── */}
      <View style={reduxTabStyles.toolbarContainer}>
        <View style={reduxTabStyles.searchRow}>
          <View style={styles.searchContainer}>
            <SearchIcon color={AppColors.grayTextWeak} size={15} />
            <TextInput
              placeholder="Search Redux slices or actions..."
              placeholderTextColor={AppColors.grayTextWeak}
              value={reduxSearch}
              onChangeText={setReduxSearch}
              style={styles.searchInput}
              autoCorrect={false}
              autoCapitalize="none"
            />
            {reduxSearch.length > 0 && (
              <Pressable onPress={() => setReduxSearch('')} hitSlop={10}>
                <ClearIcon color={AppColors.grayTextWeak} size={14} />
              </Pressable>
            )}
          </View>

          {/* Sort Button */}
          <TouchableOpacity
            style={[
              styles.toolbarBtn,
              sortMode === 'latest' && {backgroundColor: `${AppColors.brandPurple}1F`, borderColor: AppColors.brandPurple},
            ]}
            onPress={() => setSortMode(prev => (prev === 'latest' ? 'alpha' : 'latest'))}
            hitSlop={6}>
            <SortArrowIcon
              color={sortMode === 'latest' ? AppColors.brandPurple : AppColors.grayTextStrong}
              size={16}
            />
          </TouchableOpacity>
        </View>

        <View style={reduxTabStyles.headerSubRow}>
          <Text style={reduxTabStyles.resultCount}>
            Showing {filteredSlices.length} of {sliceItems.length} state slices
          </Text>
          <Text style={reduxTabStyles.sortLabel}>
            {sortMode === 'latest' ? '⚡ Newest Updates First' : '🔤 Alphabetical (A-Z)'}
          </Text>
        </View>
      </View>

      {/* ─── FlatList of Slices ─── */}
      <FlatList
        data={filteredSlices}
        keyExtractor={item => item.id}
        renderItem={renderSliceItem}
        initialNumToRender={15}
        maxToRenderPerBatch={10}
        windowSize={7}
        removeClippedSubviews={true}
        ListEmptyComponent={
          <EmptyState
            isSearch={reduxSearch.length > 0}
          />
        }
        ListFooterComponent={
          filteredSlices.length > 0 ? (
            <EndOfListFooter
              count={filteredSlices.length}
              label="slices"
            />
          ) : null
        }
        contentContainerStyle={[
          reduxTabStyles.listContent,
          filteredSlices.length === 0 && {flexGrow: 1},
        ]}
        keyboardShouldPersistTaps="handled"
      />
    </View>
  );
});

const reduxTabStyles = StyleSheet.create({
  overviewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.white,
    marginHorizontal: 12,
    marginTop: 10,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: AppColors.dividerColor,
    shadowColor: AppColors.primaryBlack,
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  statCol: {
    flex: 1,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: AppColors.dividerColor,
    marginHorizontal: 8,
  },
  statHeading: {
    fontFamily: AppFonts.interBold,
    fontSize: 9,
    color: AppColors.grayTextWeak,
    letterSpacing: 0.5,
  },
  statBigVal: {
    fontFamily: AppFonts.interBold,
    fontSize: 14,
    color: AppColors.primaryBlack,
    marginTop: 2,
  },
  statLastAction: {
    fontFamily: AppFonts.interBold,
    fontSize: 11,
    color: AppColors.purple,
    marginTop: 2,
  },
  statLastTime: {
    fontFamily: AppFonts.interRegular,
    fontSize: 9.5,
    color: AppColors.grayTextWeak,
  },
  toolbarContainer: {
    backgroundColor: AppColors.white,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.dividerColor,
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 6,
    marginTop: 8,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerSubRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    paddingHorizontal: 2,
  },
  resultCount: {
    fontFamily: AppFonts.interMedium,
    fontSize: 11,
    color: AppColors.grayTextWeak,
  },
  sortLabel: {
    fontFamily: AppFonts.interMedium,
    fontSize: 10.5,
    color: AppColors.brandPurple,
  },
  listContent: {
    padding: 12,
    paddingBottom: 36,
  },
  card: {
    backgroundColor: AppColors.white,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: AppColors.dividerColor,
    shadowColor: AppColors.primaryBlack,
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  cardRecentlyUpdated: {
    borderColor: `${AppColors.brandPurple}66`,
    backgroundColor: '#FAFAFF',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  sliceBadge: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  sliceBadgeText: {
    fontFamily: AppFonts.interBold,
    fontSize: 9.5,
    color: '#6D28D9',
    letterSpacing: 0.4,
  },
  sliceName: {
    flex: 1,
    fontFamily: AppFonts.interBold,
    fontSize: 13.5,
    color: AppColors.primaryBlack,
  },
  timePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: `${AppColors.purple}14`,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: `${AppColors.purple}2E`,
  },
  timeText: {
    fontFamily: AppFonts.interMedium,
    fontSize: 10,
    color: AppColors.purple,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
    marginBottom: 6,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: AppColors.grayBackground,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: AppColors.dividerColor,
  },
  pillLabel: {
    fontFamily: AppFonts.interMedium,
    fontSize: 10.5,
    color: AppColors.grayTextWeak,
  },
  pillValue: {
    fontFamily: AppFonts.interBold,
    fontSize: 10.5,
    color: AppColors.primaryBlack,
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: AppColors.emeraldBg,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: AppColors.emeraldBorder,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: AppColors.emerald500,
  },
  livePillText: {
    fontFamily: AppFonts.interBold,
    fontSize: 10,
    color: '#047857',
  },
  lastActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: AppColors.grayBackground,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 2,
    borderWidth: 1,
    borderColor: AppColors.dividerColor,
  },
  lastActionLabel: {
    fontFamily: AppFonts.interMedium,
    fontSize: 10.5,
    color: AppColors.grayTextWeak,
  },
  lastActionValue: {
    flex: 1,
    fontFamily: AppFonts.interBold,
    fontSize: 11,
    color: AppColors.primaryBlack,
  },
  highlight: {
    backgroundColor: '#FEF08A',
    color: '#854D0E',
    fontFamily: AppFonts.interBold,
  },
});

export default ReduxTab;