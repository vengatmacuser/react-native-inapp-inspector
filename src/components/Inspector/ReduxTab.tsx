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
import {useTranslation} from '../../i18n';
import {useInspector} from './InspectorContext';
import TouchableScale from '../TouchableScale';
import AnimatedEntrance from '../AnimatedEntrance';
import EmptyState from '../EmptyState';
import EndOfListFooter from '../EndOfListFooter';
import HighlightText from '../HighlightText';
import {getSize, openInVSCode} from '../../helpers';
import styles from '../../styles';
import {AppColors} from '../../styles/AppColors';
import {AppFonts} from '../../styles/AppFonts';
import {
  getActionHistory,
  getReduxAutoRefresh,
  setReduxAutoRefresh,
} from '../../customHooks/reduxLogger';
import {
  TerminalIcon,
  SearchIcon,
  ClearIcon,
  LayersIcon,
  ClockIcon,
  ForwardChevronIcon,
  SortArrowIcon,
  BoltIcon,
  AtomIcon,
  ScreenIcon,
  ListenerIcon,
  DocIcon,
  LoadingSpinnerIcon,
  CircleAlertIcon,
  TextAaIcon,
  StorageIcon,
  HeaderPauseIcon,
} from '../NetworkIcons';

interface ReduxSliceItem {
  id: string;
  name: string;
  keysCount: number;
  sizeStr: string;
  typeLabel: string;
  status: 'live' | 'loading' | 'error' | 'empty';
  statusMessage?: string;
  timelineCount: number;
  lastAction?: {
    type: string;
    timestamp: string;
    updatedAt: number;
    payloadPreview?: string;
    originType?: 'saga' | 'thunk' | 'ui' | 'direct' | 'listener';
    callerFile?: string;
    callerLine?: number;
    callerCol?: number;
  };
  updatedAt: number;
}

const getOriginBadge = (originType?: string) => {
  switch (originType) {
    case 'saga':
      return {
        label: 'SAGA',
        renderIcon: (color: string, size = 9) => <BoltIcon color={color} size={size} />,
        bg: AppColors.purple100,
        text: AppColors.brandPurple,
        border: AppColors.purple200,
      };
    case 'thunk':
      return {
        label: 'THUNK',
        renderIcon: (color: string, size = 9) => <AtomIcon color={color} size={size} />,
        bg: AppColors.amber100,
        text: AppColors.amber800Warm,
        border: AppColors.amber200,
      };
    case 'ui':
      return {
        label: 'UI',
        renderIcon: (color: string, size = 9) => <ScreenIcon color={color} size={size} />,
        bg: AppColors.sky100,
        text: AppColors.sky600,
        border: AppColors.sky400,
      };
    case 'listener':
      return {
        label: 'LISTENER',
        renderIcon: (color: string, size = 9) => <ListenerIcon color={color} size={size} />,
        bg: AppColors.teal100,
        text: AppColors.teal700,
        border: AppColors.teal400,
      };
    default:
      return {
        label: 'DIRECT',
        renderIcon: (color: string, size = 9) => <BoltIcon color={color} size={size} />,
        bg: AppColors.slate100,
        text: AppColors.slate700,
        border: AppColors.slate200,
      };
  }
};

const ReduxTab = React.memo(() => {
  const {t} = useTranslation();
  const {
    reduxState,
    reduxLastActionMap,
    reduxSearch,
    setReduxSearch,
    setSelectedReduxSlice,
  } = useInspector();

  // Sort mode: 'latest' (newest updated first) vs 'alpha' (A-Z)
  const [sortMode, setSortMode] = useState<'latest' | 'alpha'>('latest');

  // Pause / Live Auto-Refresh State
  const [isReduxPaused, setIsReduxPaused] = useState<boolean>(
    !getReduxAutoRefresh(),
  );

  const handleTogglePause = useCallback(() => {
    setIsReduxPaused(prev => {
      const next = !prev;
      setReduxAutoRefresh(!next);
      return next;
    });
  }, []);

  // Total state size calculation
  const totalStateSize = useMemo(() => {
    return getSize(reduxState);
  }, [reduxState]);

  // Fetch full action history for timeline counts
  const allActions = useMemo(() => {
    return getActionHistory();
  }, [reduxLastActionMap]);

  // Compute slice items with exact timestamps & rich details
  const sliceItems: ReduxSliceItem[] = useMemo(() => {
    if (!reduxState || typeof reduxState !== 'object') return [];
    const keys = Object.keys(reduxState);
    return keys.map(key => {
      const sliceVal = reduxState[key];
      const isArray = Array.isArray(sliceVal);
      const isObject = sliceVal && typeof sliceVal === 'object';

      let typeLabel = 'Primitive';
      let keysCount = 0;

      if (isArray) {
        keysCount = sliceVal.length;
        typeLabel = `Array [${keysCount}]`;
      } else if (isObject) {
        keysCount = Object.keys(sliceVal).length;
        typeLabel = `Object {${keysCount}}`;
      } else if (typeof sliceVal !== 'undefined') {
        keysCount = 1;
        typeLabel = typeof sliceVal;
      }

      // Determine state status
      let status: 'live' | 'loading' | 'error' | 'empty' = 'live';
      let statusMessage: string | undefined;

      if (isObject) {
        if (
          sliceVal.loading === true ||
          sliceVal.isLoading === true ||
          sliceVal.status === 'loading' ||
          sliceVal.status === 'pending'
        ) {
          status = 'loading';
          statusMessage = 'Loading';
        } else if (
          sliceVal.error ||
          sliceVal.hasError ||
          sliceVal.status === 'error' ||
          sliceVal.status === 'failed'
        ) {
          status = 'error';
          statusMessage = typeof sliceVal.error === 'string' ? sliceVal.error : 'Error';
        } else if (keysCount === 0) {
          status = 'empty';
          statusMessage = 'Empty';
        }
      }

      const lastActionRaw = reduxLastActionMap[key];
      const updatedAt = lastActionRaw?.updatedAt || 0;

      // Count actions affecting this slice in timeline
      const timelineCount = allActions.filter(action => {
        if (!action.affectedSlices || action.affectedSlices.length === 0) return true;
        return action.affectedSlices.includes(key);
      }).length;

      let lastAction: ReduxSliceItem['lastAction'] = undefined;
      if (lastActionRaw) {
        let payloadPreview: string | undefined;
        if (lastActionRaw.payload !== undefined && lastActionRaw.payload !== null) {
          try {
            if (typeof lastActionRaw.payload === 'object') {
              const pKeys = Object.keys(lastActionRaw.payload);
              payloadPreview = `{ ${pKeys.slice(0, 3).join(', ')}${pKeys.length > 3 ? '...' : ''} }`;
            } else {
              payloadPreview = String(lastActionRaw.payload);
            }
          } catch {}
        }

        lastAction = {
          type: lastActionRaw.type,
          timestamp: lastActionRaw.timestamp,
          updatedAt: lastActionRaw.updatedAt,
          payloadPreview,
          originType: lastActionRaw.originType,
          callerFile: lastActionRaw.callerFile,
          callerLine: lastActionRaw.callerLine,
          callerCol: lastActionRaw.callerCol,
        };
      }

      return {
        id: `slice-${key}`,
        name: key,
        keysCount,
        sizeStr: getSize(sliceVal),
        typeLabel,
        status,
        statusMessage,
        timelineCount,
        lastAction,
        updatedAt,
      };
    });
  }, [reduxState, reduxLastActionMap, allActions]);

  // Filter & Sort slices: by default, the most recently updated item is at the FIRST position
  const filteredSlices = useMemo(() => {
    let list = sliceItems;
    if (reduxSearch && reduxSearch.trim().length > 0) {
      const queryTokens = reduxSearch.trim().toLowerCase().split(/\s+/).filter(Boolean);
      list = list.filter(item => {
        const sliceVal = reduxState ? reduxState[item.name] : null;
        const searchTarget = [
          item.name || '',
          item.lastAction?.type || '',
          item.lastAction?.payloadPreview || '',
          item.lastAction?.originType || '',
          item.status || '',
          item.statusMessage || '',
          sliceVal ? (typeof sliceVal === 'string' ? sliceVal : JSON.stringify(sliceVal)) : '',
        ].join(' ').toLowerCase();

        return queryTokens.every(tok => searchTarget.includes(tok));
      });
    }

    return [...list].sort((a, b) => {
      if (sortMode === 'latest') {
        // Most recently updated item first
        if (b.updatedAt !== a.updatedAt) {
          return b.updatedAt - a.updatedAt;
        }
        return a.name.localeCompare(b.name);
      }
      return a.name.localeCompare(b.name);
    });
  }, [sliceItems, reduxSearch, sortMode, reduxState]);

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
            {/* Top row: Badge + Slice Name + Status + Timestamp + Chevron */}
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

              {/* Status Badge */}
              {item.status === 'loading' ? (
                <View style={reduxTabStyles.loadingPill}>
                  <LoadingSpinnerIcon color={AppColors.amber800Warm} size={10} />
                  <Text style={reduxTabStyles.loadingPillText}>Loading</Text>
                </View>
              ) : item.status === 'error' ? (
                <View style={reduxTabStyles.errorPill}>
                  <CircleAlertIcon color={AppColors.red600} size={10} />
                  <Text style={reduxTabStyles.errorPillText}>Error</Text>
                </View>
              ) : item.status === 'empty' ? (
                <View style={reduxTabStyles.emptyPill}>
                  <Text style={reduxTabStyles.emptyPillText}>Empty</Text>
                </View>
              ) : (
                <View style={reduxTabStyles.livePill}>
                  <View style={reduxTabStyles.liveDot} />
                  <Text style={reduxTabStyles.livePillText}>Live</Text>
                </View>
              )}

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
                <LayersIcon color={AppColors.grayTextWeak} size={11} />
                <Text style={reduxTabStyles.pillValue}>{item.typeLabel}</Text>
              </View>
              <View style={reduxTabStyles.pill}>
                <Text style={reduxTabStyles.pillLabel}>Size:</Text>
                <Text style={reduxTabStyles.pillValue}>{item.sizeStr}</Text>
              </View>
              {item.timelineCount > 0 && (
                <View style={reduxTabStyles.pill}>
                  <Text style={reduxTabStyles.pillLabel}>Actions:</Text>
                  <Text style={reduxTabStyles.pillValue}>{item.timelineCount}</Text>
                </View>
              )}
            </View>

            {/* Bottom row: Last Dispatched Action with Origin & Trigger Line */}
            {item.lastAction && (
              <View style={reduxTabStyles.lastActionRow}>
                <View style={{flexDirection: 'row', alignItems: 'center', gap: 5, flex: 1, minWidth: 0, flexWrap: 'wrap'}}>
                  <BoltIcon color={AppColors.brandPurple} size={12} />
                  <Text style={reduxTabStyles.lastActionLabel}>{t('redux.last', 'Last')}:</Text>

                  {/* Origin Badge */}
                  {item.lastAction.originType && (() => {
                    const origin = getOriginBadge(item.lastAction.originType);
                    return (
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 2.5,
                          backgroundColor: origin.bg,
                          paddingHorizontal: 4.5,
                          paddingVertical: 1.5,
                          borderRadius: 3.5,
                          borderWidth: 1,
                          borderColor: origin.border,
                        }}>
                        {origin.renderIcon(origin.text, 8.5)}
                        <Text
                          style={{
                            fontFamily: AppFonts.interBold,
                            fontSize: 8,
                            color: origin.text,
                            letterSpacing: 0.3,
                          }}>
                          {origin.label}
                        </Text>
                      </View>
                    );
                  })()}

                  <HighlightText
                    text={item.lastAction.type}
                    search={reduxSearch}
                    style={reduxTabStyles.lastActionValue}
                    highlightStyle={reduxTabStyles.highlight}
                    numberOfLines={1}
                  />

                  {/* Triggered from file preview */}
                  {item.lastAction.callerFile && (
                    <Pressable
                      onPress={() =>
                        openInVSCode(
                          item.lastAction!.callerFile!,
                          item.lastAction!.callerLine,
                          item.lastAction!.callerCol,
                        )
                      }
                      hitSlop={6}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 2.5,
                        backgroundColor: AppColors.sky100,
                        paddingHorizontal: 4.5,
                        paddingVertical: 1.5,
                        borderRadius: 3,
                        borderWidth: 0.5,
                        borderColor: AppColors.sky400,
                      }}>
                      <DocIcon color={AppColors.sky600} size={9} />
                      <Text
                        style={{
                          fontFamily: AppFonts.interMedium,
                          fontSize: 8.5,
                          color: AppColors.sky600,
                        }}>
                        {item.lastAction.callerFile.split('/').pop()}:{item.lastAction.callerLine || 1}
                      </Text>
                    </Pressable>
                  )}

                  {item.lastAction.payloadPreview && (
                    <Text style={reduxTabStyles.payloadPreviewText} numberOfLines={1}>
                      {item.lastAction.payloadPreview}
                    </Text>
                  )}
                </View>
              </View>
            )}
          </TouchableScale>
        </AnimatedEntrance>
      );
    },
    [reduxSearch, setSelectedReduxSlice, t],
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
        <View style={[reduxTabStyles.statCol, {flex: 1.6}]}>
          <View style={{flexDirection: 'row', alignItems: 'center', gap: 4}}>
            <Text style={reduxTabStyles.statHeading}>LAST ACTION</Text>
            {lastGlobalAction?.originType && (() => {
              const origin = getOriginBadge(lastGlobalAction.originType);
              return (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 2,
                    backgroundColor: origin.bg,
                    paddingHorizontal: 4,
                    paddingVertical: 1,
                    borderRadius: 3,
                  }}>
                  {origin.renderIcon(origin.text, 8)}
                  <Text
                    style={{
                      fontFamily: AppFonts.interBold,
                      fontSize: 7.5,
                      color: origin.text,
                    }}>
                    {origin.label}
                  </Text>
                </View>
              );
            })()}
          </View>
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
              accessible={true}
              accessibilityRole="search"
              accessibilityLabel="Search Redux slices or actions"
              accessibilityHint="Type to filter state slices in real time"
              placeholder="Search Redux slices or actions..."
              placeholderTextColor={AppColors.grayTextWeak}
              value={reduxSearch}
              onChangeText={setReduxSearch}
              style={styles.searchInput}
              autoCorrect={false}
              autoCapitalize="none"
            />
            {reduxSearch.length > 0 && (
              <Pressable
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Clear search input"
                onPress={() => setReduxSearch('')}
                hitSlop={10}>
                <ClearIcon color={AppColors.grayTextWeak} size={14} />
              </Pressable>
            )}
          </View>

          {/* Pause / Resume Live Updates Button */}
          <TouchableOpacity
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={
              isReduxPaused
                ? 'Resume live Redux updates'
                : 'Pause live Redux updates'
            }
            accessibilityHint="Toggles automatic recording of Redux state updates"
            style={[
              styles.toolbarBtn,
              isReduxPaused && {
                backgroundColor: `${AppColors.darkOrange}1F`,
                borderColor: AppColors.darkOrange,
              },
            ]}
            onPress={handleTogglePause}
            hitSlop={6}>
            <HeaderPauseIcon
              isPaused={isReduxPaused}
              color={
                isReduxPaused
                  ? AppColors.darkOrange
                  : AppColors.grayTextStrong
              }
              size={16}
            />
          </TouchableOpacity>

          {/* Sort Button */}
          <TouchableOpacity
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={`Sort order: ${
              sortMode === 'latest'
                ? 'Recently updated first'
                : 'Alphabetical A to Z'
            }`}
            accessibilityHint="Switches sorting between recently updated and alphabetical"
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
          <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
            {isReduxPaused && (
              <View style={reduxTabStyles.pausedBannerPill}>
                <Text style={reduxTabStyles.pausedBannerText}>PAUSED</Text>
              </View>
            )}
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 4}}>
              {sortMode === 'latest' ? (
                <BoltIcon color={AppColors.brandPurple} size={11} />
              ) : (
                <TextAaIcon color={AppColors.brandPurple} size={11} />
              )}
              <Text style={reduxTabStyles.sortLabel}>
                {sortMode === 'latest' ? 'Newest Updates First' : 'Alphabetical (A-Z)'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* ─── FlatList of Slices ─── */}
      <FlatList
        data={filteredSlices}
        keyExtractor={item => item.id}
        renderItem={renderSliceItem}
        initialNumToRender={12}
        maxToRenderPerBatch={8}
        windowSize={5}
        removeClippedSubviews={true}
        renderToHardwareTextureAndroid={true}
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
    backgroundColor: AppColors.purpleTintBg,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  sliceBadge: {
    backgroundColor: AppColors.violetSoftBg,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: AppColors.violetSoftBorder,
  },
  sliceBadgeText: {
    fontFamily: AppFonts.interBold,
    fontSize: 9.5,
    color: AppColors.purple700,
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
    color: AppColors.emerald700,
  },
  loadingPill: {
    backgroundColor: AppColors.amber100,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: AppColors.amber200,
  },
  loadingPillText: {
    fontFamily: AppFonts.interBold,
    fontSize: 9.5,
    color: AppColors.amber800Warm,
  },
  errorPill: {
    backgroundColor: AppColors.red100,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: AppColors.errorBorder,
  },
  errorPillText: {
    fontFamily: AppFonts.interBold,
    fontSize: 9.5,
    color: AppColors.red600,
  },
  emptyPill: {
    backgroundColor: AppColors.grayBackground,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: AppColors.dividerColor,
  },
  emptyPillText: {
    fontFamily: AppFonts.interMedium,
    fontSize: 9.5,
    color: AppColors.grayTextWeak,
  },
  lastActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: AppColors.grayBackground,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 5,
    marginTop: 4,
    borderWidth: 1,
    borderColor: AppColors.dividerColor,
  },
  lastActionLabel: {
    fontFamily: AppFonts.interMedium,
    fontSize: 10.5,
    color: AppColors.grayTextWeak,
  },
  lastActionValue: {
    fontFamily: AppFonts.interBold,
    fontSize: 11,
    color: AppColors.primaryBlack,
  },
  payloadPreviewText: {
    flex: 1,
    fontFamily: AppFonts.interRegular,
    fontSize: 10,
    color: AppColors.grayTextWeak,
    marginLeft: 4,
  },
  highlight: {
    backgroundColor: AppColors.yellow200,
    color: AppColors.yellow800,
    fontFamily: AppFonts.interBold,
  },
  pausedBannerPill: {
    backgroundColor: AppColors.amber100,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: AppColors.amber200,
  },
  pausedBannerText: {
    fontFamily: AppFonts.interBold,
    fontSize: 9,
    color: AppColors.amber800Warm,
    letterSpacing: 0.5,
  },
});

export default ReduxTab;