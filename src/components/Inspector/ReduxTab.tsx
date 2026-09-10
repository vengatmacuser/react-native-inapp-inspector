import React, {useCallback, useMemo, useRef, useState} from 'react';
import {
  FlatList,
  Platform,
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
import {getSize, openInVSCode, getCleanCallerDisplay} from '../../helpers';
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
  SizeIcon,
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
  ChevronIcon,
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

  const listRef = useRef<FlatList>(null);
  const [displayLimit, setDisplayLimit] = useState<number>(100);

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

  const displayedSlices = useMemo(
    () => filteredSlices.slice(0, displayLimit),
    [filteredSlices, displayLimit],
  );

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

      const cardStatusColor =
        item.status === 'error'
          ? AppColors.errorColor
          : item.status === 'loading'
          ? AppColors.warningIconGold
          : item.status === 'empty'
          ? AppColors.grayTextWeak
          : AppColors.greenColor;

      const statusPillBg =
        item.status === 'error'
          ? AppColors.red100
          : item.status === 'loading'
          ? AppColors.amber100
          : item.status === 'empty'
          ? AppColors.grayBackground
          : AppColors.emeraldBg;

      const statusPillBorder =
        item.status === 'error'
          ? AppColors.errorBorder
          : item.status === 'loading'
          ? AppColors.amber200
          : item.status === 'empty'
          ? AppColors.dividerColor
          : AppColors.emeraldBorder;

      const statusPillColor =
        item.status === 'error'
          ? AppColors.red600
          : item.status === 'loading'
          ? AppColors.amber800Warm
          : item.status === 'empty'
          ? AppColors.grayTextWeak
          : AppColors.emerald700;

      const callerDisplay = item.lastAction?.callerFile
        ? getCleanCallerDisplay(item.lastAction.callerFile)
        : null;

      return (
        <AnimatedEntrance index={index} distance={8}>
          <View style={reduxTabStyles.cardContainer}>
            <TouchableScale
              onPress={() => {
                setSelectedReduxSlice(item.name);
              }}
              style={[
                reduxTabStyles.card,
                {
                  borderLeftWidth: 3.5,
                  borderLeftColor: cardStatusColor,
                  backgroundColor:
                    item.status === 'error'
                      ? AppColors.errorCardBg
                      : AppColors.white,
                },
                isRecentlyUpdated && reduxTabStyles.cardRecentlyUpdated,
              ]}>
              <View style={reduxTabStyles.cardBody}>
                {/* Row 1: Header (Serial Number, REDUX Badge, Type Chip, Origin Chip, Status Pill, Forward Chevron) */}
                <View style={reduxTabStyles.cardHeaderRow}>
                  <View style={reduxTabStyles.cardHeaderLeft}>
                    <Text style={reduxTabStyles.serialNumber}>#{index + 1}</Text>
                    <View
                      style={[
                        reduxTabStyles.methodBadge,
                        {backgroundColor: AppColors.violet600},
                      ]}>
                      <Text style={reduxTabStyles.methodBadgeText}>REDUX</Text>
                    </View>
                    <View
                      style={[
                        reduxTabStyles.chip,
                        {
                          backgroundColor: `${AppColors.violet600}14`,
                          borderColor: `${AppColors.violet600}2E`,
                        },
                      ]}>
                      <Text
                        style={[
                          reduxTabStyles.chipText,
                          {color: AppColors.violet600},
                        ]}>
                        {item.typeLabel.toUpperCase()}
                      </Text>
                    </View>

                    {item.lastAction?.originType && (() => {
                      const origin = getOriginBadge(item.lastAction.originType);
                      return (
                        <View
                          style={[
                            reduxTabStyles.chip,
                            {
                              backgroundColor: origin.bg,
                              borderColor: origin.border,
                            },
                          ]}>
                          {origin.renderIcon(origin.text, 8.5)}
                          <Text
                            style={[
                              reduxTabStyles.chipText,
                              {color: origin.text},
                            ]}>
                            {origin.label}
                          </Text>
                        </View>
                      );
                    })()}
                  </View>

                  <View style={reduxTabStyles.cardHeaderRight}>
                    <View
                      style={[
                        reduxTabStyles.statusPill,
                        {
                          backgroundColor: statusPillBg,
                          borderColor: statusPillBorder,
                        },
                      ]}>
                      {item.status === 'loading' ? (
                        <LoadingSpinnerIcon
                          color={AppColors.amber800Warm}
                          size={10}
                        />
                      ) : item.status === 'error' ? (
                        <CircleAlertIcon
                          color={AppColors.red600}
                          size={10}
                        />
                      ) : item.status === 'empty' ? null : (
                        <View style={reduxTabStyles.liveDot} />
                      )}
                      <Text
                        style={[
                          reduxTabStyles.statusPillText,
                          {color: statusPillColor},
                        ]}>
                        {item.status === 'loading'
                          ? 'Loading'
                          : item.status === 'error'
                          ? item.statusMessage || 'Error'
                          : item.status === 'empty'
                          ? 'Empty'
                          : 'Live'}
                      </Text>
                    </View>
                    <ForwardChevronIcon
                      color={AppColors.grayTextWeak}
                      size={13}
                    />
                  </View>
                </View>

                {/* Row 2: Slice Name & Last Action Preview (Spacious URL-like block) */}
                <View style={reduxTabStyles.cardMainRow}>
                  <View style={reduxTabStyles.sliceNameRow}>
                    <HighlightText
                      text={item.name}
                      search={reduxSearch}
                      style={reduxTabStyles.sliceNameText}
                      highlightStyle={reduxTabStyles.highlight}
                      numberOfLines={1}
                    />
                    {item.timelineCount > 0 && (
                      <View style={reduxTabStyles.actionCountChip}>
                        <BoltIcon color={AppColors.violet600} size={9} />
                        <Text style={reduxTabStyles.actionCountChipText}>
                          {item.timelineCount}
                        </Text>
                      </View>
                    )}
                  </View>
                  <View style={reduxTabStyles.actionPreviewRow}>
                    <TerminalIcon color={AppColors.grayTextWeak} size={10} />
                    {item.lastAction ? (
                      <HighlightText
                        text={
                          item.lastAction.type +
                          (item.lastAction.payloadPreview
                            ? ` · ${item.lastAction.payloadPreview}`
                            : '')
                        }
                        search={reduxSearch}
                        style={reduxTabStyles.actionPreviewText}
                        highlightStyle={reduxTabStyles.highlight}
                        numberOfLines={1}
                      />
                    ) : (
                      <Text
                        style={reduxTabStyles.actionPreviewEmptyText}
                        numberOfLines={1}>
                        Initial state (no actions dispatched yet)
                      </Text>
                    )}
                  </View>
                </View>

                {/* Row 3: Footer (Timestamp on Left, Size & Keys on Right) */}
                <View style={reduxTabStyles.cardFooterRow}>
                  <View style={reduxTabStyles.footerLeft}>
                    <ClockIcon color={AppColors.grayTextWeak} size={10} />
                    <Text
                      style={reduxTabStyles.footerTimestampText}
                      numberOfLines={1}>
                      {item.lastAction?.timestamp || 'Initial state'}
                    </Text>
                    {callerDisplay && (
                      <Pressable
                        onPress={() =>
                          openInVSCode(
                            item.lastAction!.callerFile!,
                            item.lastAction!.callerLine,
                            item.lastAction!.callerCol,
                          )
                        }
                        hitSlop={6}
                        style={reduxTabStyles.callerChip}>
                        <DocIcon color={AppColors.sky600} size={9} />
                        <Text style={reduxTabStyles.callerChipText}>
                          {callerDisplay.display}
                        </Text>
                      </Pressable>
                    )}
                  </View>

                  <View style={reduxTabStyles.footerRight}>
                    <View style={reduxTabStyles.metaStatChip}>
                      <SizeIcon color={AppColors.violet600} size={9.5} />
                      <Text style={reduxTabStyles.metaStatText}>
                        {item.sizeStr}
                      </Text>
                    </View>
                    <View style={reduxTabStyles.metaStatChip}>
                      <LayersIcon color={AppColors.violet600} size={9.5} />
                      <Text style={reduxTabStyles.metaStatText}>
                        {item.keysCount} keys
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Waterfall Status Accent Bar */}
              <View style={reduxTabStyles.waterfallContainer}>
                <View
                  style={[
                    reduxTabStyles.waterfallBar,
                    {
                      backgroundColor: cardStatusColor,
                      width: isRecentlyUpdated ? '100%' : '35%',
                    },
                  ]}
                />
              </View>
            </TouchableScale>
          </View>
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
        <Text style={styles.emptyTitle}>{t('redux.noStoreConnected', 'No Redux Store Connected')}</Text>
        <Text style={styles.emptySub}>
          {t('redux.connectStoreTip', 'Call connectReduxStore(store) or use inspectorReduxMiddleware at app initialization.')}
        </Text>
      </View>
    );
  }

  return (
    <View style={{flex: 1, backgroundColor: AppColors.grayBackground}}>
      {/* ─── Top Stats Overview Card ─── */}
      <View style={reduxTabStyles.overviewCard}>
        <View style={reduxTabStyles.statCol}>
          <Text style={reduxTabStyles.statHeading}>{t('redux.activeSlices', 'ACTIVE SLICES')}</Text>
          <Text style={reduxTabStyles.statBigVal}>{sliceItems.length}</Text>
        </View>
        <View style={reduxTabStyles.statDivider} />
        <View style={reduxTabStyles.statCol}>
          <Text style={reduxTabStyles.statHeading}>{t('redux.totalState', 'TOTAL STATE')}</Text>
          <Text style={reduxTabStyles.statBigVal}>{totalStateSize}</Text>
        </View>
        <View style={reduxTabStyles.statDivider} />
        <View style={[reduxTabStyles.statCol, {flex: 1.6}]}>
          <View style={{flexDirection: 'row', alignItems: 'center', gap: 4}}>
            <Text style={reduxTabStyles.statHeading}>{t('redux.lastActionHeader', 'LAST ACTION')}</Text>
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
              placeholder={t('redux.searchPlaceholder', 'Search state or actions...')}
              placeholderTextColor={AppColors.grayTextWeak}
              value={reduxSearch}
              onChangeText={setReduxSearch}
              style={styles.searchInput}
              autoCorrect={false}
              autoCapitalize="none"
            />
            {reduxSearch.length > 0 && (
              <View style={{flexDirection: 'row', alignItems: 'center', gap: 4}}>
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
                    {filteredSlices.length}
                  </Text>
                </View>
                <Pressable
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel="Clear search input"
                  onPress={() => setReduxSearch('')}
                  hitSlop={10}>
                  <ClearIcon color={AppColors.grayTextWeak} size={14} />
                </Pressable>
              </View>
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
        ref={listRef}
        data={displayedSlices}
        keyExtractor={item => item.id}
        renderItem={renderSliceItem}
        getItemLayout={(_data, index) => ({
          length: 126,
          offset: 126 * index,
          index,
        })}
        initialNumToRender={12}
        maxToRenderPerBatch={8}
        windowSize={5}
        removeClippedSubviews={Platform.OS === 'android'}
        renderToHardwareTextureAndroid={true}
        ListEmptyComponent={
          <EmptyState
            isSearch={reduxSearch.trim().length > 0}
            searchQuery={reduxSearch}
            onClearSearch={() => setReduxSearch('')}
            customTitle={reduxSearch.trim().length > 0 ? 'No Matching Slices' : 'No Redux State Detected'}
            customSub={
              reduxSearch.trim().length > 0
                ? `No Redux slices match "${reduxSearch}"`
                : 'Attach the Redux store or dispatch actions to see state slices.'
            }
          />
        }
        ListFooterComponent={
          filteredSlices.length > 0 ? (
            <EndOfListFooter
              count={displayedSlices.length}
              totalCount={filteredSlices.length}
              label="slices"
              hasMore={displayedSlices.length < filteredSlices.length}
              onLoadMore={() => setDisplayLimit(p => p + 10)}
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
    paddingVertical: 8,
    paddingBottom: 36,
  },
  cardContainer: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    height: 126,
  },
  card: {
    backgroundColor: AppColors.white,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: AppColors.grayBorderSecondary,
    shadowColor: AppColors.shadowColorString,
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2.5,
    elevation: 1.5,
    height: 118,
    overflow: 'hidden',
  },
  cardRecentlyUpdated: {
    borderColor: `${AppColors.brandPurple}66`,
    backgroundColor: AppColors.purpleTintBg,
  },
  cardBody: {
    paddingHorizontal: 12,
    paddingTop: 9,
    paddingBottom: 7,
    flex: 1,
    justifyContent: 'space-between',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 22,
    minHeight: 22,
    maxHeight: 22,
    gap: 6,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    minWidth: 0,
  },
  cardHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  serialNumber: {
    fontFamily: AppFonts.interBold,
    fontSize: 10.5,
    lineHeight: 13,
    color: AppColors.grayTextWeak,
  },
  methodBadge: {
    paddingHorizontal: 5.5,
    paddingVertical: 2,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodBadgeText: {
    fontFamily: AppFonts.interBold,
    color: AppColors.white,
    fontSize: 9,
    lineHeight: 12,
    letterSpacing: 0.4,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
    borderWidth: 1,
  },
  chipText: {
    fontFamily: AppFonts.interBold,
    fontSize: 8.5,
    lineHeight: 11,
    letterSpacing: 0.3,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3.5,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: AppColors.emerald500,
  },
  statusPillText: {
    fontFamily: AppFonts.interBold,
    fontSize: 9.5,
    lineHeight: 12,
  },
  cardMainRow: {
    height: 48,
    minHeight: 48,
    maxHeight: 48,
    justifyContent: 'space-between',
    gap: 3,
  },
  sliceNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  sliceNameText: {
    fontFamily: AppFonts.interBold,
    fontSize: 12.5,
    lineHeight: 16,
    color: AppColors.primaryBlack,
    flex: 1,
  },
  actionCountChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2.5,
    backgroundColor: `${AppColors.violet600}14`,
    borderColor: `${AppColors.violet600}2E`,
    borderWidth: 1,
    paddingHorizontal: 4.5,
    paddingVertical: 1,
    borderRadius: 3.5,
  },
  actionCountChipText: {
    fontFamily: AppFonts.interBold,
    fontSize: 8.5,
    lineHeight: 11,
    color: AppColors.violet600,
  },
  actionPreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4.5,
    minHeight: 15,
  },
  actionPreviewText: {
    fontFamily: Platform.select({ios: 'Menlo', default: 'monospace'}),
    fontSize: 10,
    lineHeight: 13,
    color: AppColors.grayTextWeak,
    flex: 1,
  },
  actionPreviewEmptyText: {
    fontFamily: AppFonts.interRegular,
    fontSize: 10,
    lineHeight: 13,
    color: AppColors.slate400,
    fontStyle: 'italic',
    flex: 1,
  },
  cardFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 18,
    minHeight: 18,
    maxHeight: 18,
    gap: 6,
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flex: 1,
    minWidth: 0,
    overflow: 'hidden',
  },
  footerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flexShrink: 0,
  },
  footerTimestampText: {
    fontFamily: AppFonts.interRegular,
    fontSize: 10,
    lineHeight: 13,
    color: AppColors.slate400,
  },
  callerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2.5,
    backgroundColor: AppColors.sky100,
    paddingHorizontal: 4.5,
    paddingVertical: 1,
    borderRadius: 3,
    borderWidth: 0.5,
    borderColor: AppColors.sky400,
    marginLeft: 4,
  },
  callerChipText: {
    fontFamily: AppFonts.interMedium,
    fontSize: 8.5,
    lineHeight: 11,
    color: AppColors.sky600,
  },
  metaStatChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: AppColors.violetSoftBg,
    borderColor: AppColors.violetSoftBorder,
    borderWidth: 1,
    paddingHorizontal: 5.5,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  metaStatText: {
    fontFamily: AppFonts.interBold,
    color: AppColors.violetSoftText,
    fontSize: 9,
    lineHeight: 12,
  },
  waterfallContainer: {
    height: 2.5,
    width: '100%',
    backgroundColor: AppColors.graySurface,
    borderRadius: 1.5,
    overflow: 'hidden',
  },
  waterfallBar: {
    height: '100%',
    borderRadius: 1.5,
  },
  highlight: {
    backgroundColor: AppColors.yellowHighlight,
    color: AppColors.primaryBlack,
    borderRadius: 2,
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