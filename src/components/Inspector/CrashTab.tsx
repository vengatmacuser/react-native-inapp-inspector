import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Platform,
  Pressable,
  ScrollView,
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
import JsonViewer from '../JsonViewer';
import styles from '../../styles';
import {AppColors} from '../../styles/AppColors';
import {AppFonts} from '../../styles/AppFonts';
import {
  CrashRecord,
  ParsedStackFrame,
  CrashBreadcrumb,
} from '../../types';
import {
  CrashFilterType,
  CrashType,
} from '../../types/enums';
import {
  clearCrashRecords,
} from '../../customHooks/crashHandler';
import CrashFilterModal, {
  CrashFilters,
  DEFAULT_CRASH_FILTERS,
  isCrashFiltersDefault,
} from './CrashFilterModal';
import {
  CrashIcon,
  SearchIcon,
  ClearIcon,
  TrashIcon,
  WarningTriangleIcon,
  TerminalIcon,
  LayersIcon,
  ClockIcon,
  ShieldAlertIcon,
  CircleAlertIcon,
  CircleCheckIcon,
  CloseWhite,
  WhiteBackNavigation,
  GlobeIcon,
  FlameIcon,
  JsIcon,
  HourglassIcon,
  SkullIcon,
  LayoutIcon,
  ChipIcon,
  AppleIcon,
  AndroidIcon,
  RepeatIcon,
  CodeBracketsIcon,
  FilterIcon,
} from '../NetworkIcons';

const getRelativeTime = (timestamp: number): string => {
  const now = Date.now();
  const diff = Math.max(0, now - timestamp);
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return `${seconds}s ago`;
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
};



const CrashTab = React.memo(() => {
  const {t} = useTranslation();
  const {crashRecords, selectedCrash, setSelectedCrash} = useInspector();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<CrashFilterType>('all');
  const [crashFilters, setCrashFilters] = useState<CrashFilters>(
    DEFAULT_CRASH_FILTERS,
  );
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [detailSubTab, setDetailSubTab] = useState<
    'stack' | 'device' | 'breadcrumbs' | 'raw'
  >('stack');

  // Calculate statistics
  const stats = useMemo(() => {
    const total = crashRecords.length;
    let fatalCount = 0;
    let jsCount = 0;
    let promiseCount = 0;
    let renderCount = 0;
    let nativeCount = 0;

    crashRecords.forEach(c => {
      if (c.isFatal) fatalCount++;
      if (c.type === 'js') jsCount++;
      else if (c.type === 'promise') promiseCount++;
      else if (c.type === 'render') renderCount++;
      else if (c.type === 'native') nativeCount++;
    });

    return {total, fatalCount, jsCount, promiseCount, renderCount, nativeCount};
  }, [crashRecords]);

  // Filtered crash list
  const filteredList = useMemo(() => {
    let list = crashRecords.filter(item => {
      // Type filter
      if (filterType === 'fatal' && !item.isFatal) return false;
      if (filterType === 'js' && item.type !== 'js') return false;
      if (filterType === 'promise' && item.type !== 'promise') return false;
      if (filterType === 'render' && item.type !== 'render') return false;
      if (filterType === 'native' && item.type !== 'native') return false;

      // Modal filters: crash types
      if (crashFilters.types.size > 0 && !crashFilters.types.has('all')) {
        const matches =
          (crashFilters.types.has('fatal') && item.isFatal) ||
          (crashFilters.types.has('js') && item.type === 'js') ||
          (crashFilters.types.has('promise') && item.type === 'promise') ||
          (crashFilters.types.has('render') && item.type === 'render') ||
          (crashFilters.types.has('native') && item.type === 'native');
        if (!matches) return false;
      }

      // Modal filters: time window
      if (crashFilters.timeWindow !== 'all') {
        const now = Date.now();
        const cutoff =
          crashFilters.timeWindow === '15m'
            ? now - 15 * 60 * 1000
            : crashFilters.timeWindow === '1h'
            ? now - 60 * 60 * 1000
            : crashFilters.timeWindow === '24h'
            ? now - 24 * 60 * 60 * 1000
            : now - 7 * 24 * 60 * 60 * 1000;
        if (item.timestamp < cutoff) return false;
      }

      // Modal filters: platform
      if (crashFilters.platform !== 'all') {
        const platform = (item.deviceInfo?.platform || '').toLowerCase();
        if (platform !== crashFilters.platform) return false;
      }

      // Modal filters: engine
      if (crashFilters.engine !== 'all') {
        const isHermes = item.deviceInfo?.isHermes;
        if (crashFilters.engine === 'hermes' && isHermes !== true) return false;
        if (crashFilters.engine === 'jsc' && (isHermes === true)) return false;
      }

      // Search filter
      if (searchQuery.trim().length > 0) {
        const q = searchQuery.toLowerCase();
        const msg = (item.message || '').toLowerCase();
        const name = (item.name || '').toLowerCase();
        const stack = (item.stack || '').toLowerCase();
        return msg.includes(q) || name.includes(q) || stack.includes(q);
      }

      return true;
    });

    // Modal filters: sort order
    if (crashFilters.sortBy === 'time_asc') {
      list = [...list].sort((a, b) => a.timestamp - b.timestamp);
    }

    return list;
  }, [crashRecords, filterType, searchQuery, crashFilters]);

  const handleClearAll = () => {
    Alert.alert(
      t('crash.clearTitle'),
      t('crash.clearMessage'),
      [
        {text: t('crash.clearCancel'), style: 'cancel'},
        {
          text: t('crash.clearConfirm'),
          style: 'destructive',
          onPress: () => clearCrashRecords(),
        },
      ],
    );
  };

  const renderCard = useCallback(
    ({item, index}: {item: CrashRecord; index: number}) => {
      const isFatal = item.isFatal;
      const typeLabel = item.type.toUpperCase();
      const topFrame = item.parsedStack && item.parsedStack.length > 0
        ? item.parsedStack.find(f => f.isAppCode) || item.parsedStack[0]
        : null;

      const typeBadgeBg =
        item.type === 'native'
          ? `${AppColors.errorColor}22`
          : item.type === 'render'
          ? `${AppColors.purple}22`
          : item.type === 'promise'
          ? `${AppColors.darkOrange}22`
          : `${AppColors.offerPurple}22`;

      const typeBadgeColor =
        item.type === 'native'
          ? AppColors.errorColor
          : item.type === 'render'
          ? AppColors.purple
          : item.type === 'promise'
          ? AppColors.darkOrange
          : AppColors.offerPurple;

      return (
        <AnimatedEntrance index={index} distance={8}>
          <TouchableScale
            onPress={() => setSelectedCrash(item)}
            style={[
              localStyles.cardContainer,
              isFatal && localStyles.fatalCardBorder,
            ]}>
            {/* Header: #S.No, Badges & Timestamp */}
            <View style={localStyles.cardHeader}>
              <View style={localStyles.badgeRow}>
                <View style={localStyles.sNoBadge}>
                  <Text style={localStyles.sNoBadgeText}>#{index + 1}</Text>
                </View>

                {isFatal ? (
                  <View style={localStyles.fatalBadge}>
                    <FlameIcon size={10} color={AppColors.white} />
                    <Text style={localStyles.fatalBadgeText}>{t('crash.fatalBadge')}</Text>
                  </View>
                ) : (
                  <View style={localStyles.caughtBadge}>
                    <Text style={localStyles.caughtBadgeText}>{t('crash.handledBadge')}</Text>
                  </View>
                )}

                <View
                  style={[
                    localStyles.typeBadge,
                    {backgroundColor: typeBadgeBg},
                  ]}>
                  <Text
                    style={[
                      localStyles.typeBadgeText,
                      {color: typeBadgeColor},
                    ]}>
                    {typeLabel}
                  </Text>
                </View>
              </View>

              <View style={localStyles.timeRow}>
                <ClockIcon size={11} color={AppColors.grayTextWeak} />
                <Text style={localStyles.timestampText}>
                  {item.timeStr || new Date(item.timestamp).toLocaleTimeString()}
                </Text>
                <Text style={localStyles.relativeTimeText}>
                  {getRelativeTime(item.timestamp)}
                </Text>
              </View>
            </View>

            {/* Error Message */}
            <View style={{marginVertical: 6}}>
              <HighlightText
                text={item.message || t('crash.unknownException')}
                highlight={searchQuery}
                numberOfLines={3}
                style={localStyles.errorMessageText}
              />
            </View>

            {/* Top stack frame location if available */}
            {topFrame && (
              <View style={localStyles.locationRow}>
                <TerminalIcon size={12} color={AppColors.grayTextWeak} />
                <Text
                  numberOfLines={1}
                  ellipsizeMode="middle"
                  style={localStyles.locationText}>
                  {topFrame.method !== '<anonymous>' ? `${topFrame.method} ` : ''}
                  <Text style={{color: AppColors.purple, fontFamily: AppFonts.interBold}}>
                    {topFrame.file}:{topFrame.lineNumber}
                  </Text>
                </Text>
              </View>
            )}

            {/* Footer row: Actions */}
            <View style={localStyles.cardFooter}>
              <View style={{flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap'}}>
                {item.deviceInfo && (
                  <View style={localStyles.metaPill}>
                    {item.deviceInfo.platform === 'ios' ? (
                      <AppleIcon size={10} color={AppColors.grayText} />
                    ) : item.deviceInfo.platform === 'android' ? (
                      <AndroidIcon size={10} color={AppColors.grayText} />
                    ) : null}
                    <Text style={localStyles.metaPillText}>
                      {item.deviceInfo.platform?.toUpperCase()}{' '}
                      {item.deviceInfo.osVersion || ''}
                    </Text>
                  </View>
                )}
                {item.deviceInfo && (
                  <View style={localStyles.metaPill}>
                    <Text style={localStyles.metaPillText}>
                      {item.deviceInfo.isHermes ? 'Hermes' : 'JSC'}
                    </Text>
                  </View>
                )}
                {item.parsedStack && item.parsedStack.length > 0 && (
                  <View style={localStyles.metaPill}>
                    <CodeBracketsIcon size={10} color={AppColors.grayText} />
                    <Text style={localStyles.metaPillText}>
                      {item.parsedStack.length}
                    </Text>
                  </View>
                )}
                {item.breadcrumbs && item.breadcrumbs.length > 0 && (
                  <View style={localStyles.metaPill}>
                    <RepeatIcon size={10} color={AppColors.grayText} />
                    <Text style={localStyles.metaPillText}>
                      {item.breadcrumbs.length} trail
                    </Text>
                  </View>
                )}
                {item.memoryInfo && (
                  <View style={localStyles.metaPill}>
                    <Text style={localStyles.metaPillText}>
                      {item.memoryInfo.usedJSHeapSize} MB
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </TouchableScale>
        </AnimatedEntrance>
      );
    },
    [searchQuery, setSelectedCrash],
  );

  return (
    <View style={localStyles.container}>
      {/* ─── Top Stats Bar ─── */}
      <View style={localStyles.statsBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={localStyles.statsScrollContent}>
          <View style={[localStyles.statChip, localStyles.statChipActive]}>
            <Text style={localStyles.statChipValue}>{stats.total}</Text>
            <Text style={localStyles.statChipLabel}>{t('crash.statCrashes')}</Text>
          </View>

          <View style={localStyles.statChip}>
            <Text style={[localStyles.statChipValue, {color: AppColors.errorColor}]}>
              {stats.fatalCount}
            </Text>
            <Text style={localStyles.statChipLabel}>{t('crash.statFatal')}</Text>
          </View>

          <View style={localStyles.statChip}>
            <Text style={[localStyles.statChipValue, {color: AppColors.offerPurple}]}>
              {stats.jsCount}
            </Text>
            <Text style={localStyles.statChipLabel}>{t('crash.statJsErrors')}</Text>
          </View>

          <View style={localStyles.statChip}>
            <Text style={[localStyles.statChipValue, {color: AppColors.darkOrange}]}>
              {stats.promiseCount}
            </Text>
            <Text style={localStyles.statChipLabel}>{t('crash.statPromises')}</Text>
          </View>

          <View style={localStyles.statChip}>
            <Text style={[localStyles.statChipValue, {color: AppColors.purple}]}>
              {stats.renderCount}
            </Text>
            <Text style={localStyles.statChipLabel}>{t('crash.statRender')}</Text>
          </View>

          <View style={localStyles.statChip}>
            <Text style={[localStyles.statChipValue, {color: AppColors.skyBlue}]}>
              {stats.nativeCount}
            </Text>
            <Text style={localStyles.statChipLabel}>{t('crash.statNative')}</Text>
          </View>
        </ScrollView>
      </View>

      {/* ─── Search & Controls ─── */}
      <View style={localStyles.controlsContainer}>
        <View style={localStyles.searchRow}>
          <View style={localStyles.searchInputWrapper}>
            <SearchIcon color={AppColors.grayTextWeak} size={14} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder={t('crash.searchPlaceholder')}
              placeholderTextColor={AppColors.grayTextWeak}
              style={localStyles.searchInput}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={8}>
                <ClearIcon color={AppColors.grayTextWeak} size={14} />
              </TouchableOpacity>
            )}
          </View>

          {/* Crash Filters */}
          {crashRecords.length > 0 && (
            <TouchableScale
              onPress={() => setIsFilterModalOpen(true)}
              style={[
                localStyles.filterButton,
                !isCrashFiltersDefault(crashFilters) && {
                  borderColor: `${AppColors.brandPurple}60`,
                  backgroundColor: `${AppColors.brandPurple}15`,
                },
              ]}>
              <FilterIcon
                size={14}
                color={
                  isCrashFiltersDefault(crashFilters)
                    ? AppColors.grayTextStrong
                    : AppColors.brandPurple
                }
              />
              {!isCrashFiltersDefault(crashFilters) && (
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
            </TouchableScale>
          )}

          {/* Clear Crashes */}
          {crashRecords.length > 0 && (
            <TouchableScale
              onPress={handleClearAll}
              style={localStyles.clearButton}>
              <TrashIcon size={14} color={AppColors.errorColor} />
            </TouchableScale>
          )}
        </View>

        {/* ─── Filter Chips ─── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={localStyles.filterScrollContent}>
          {(
            [
              {key: 'all', label: t('crash.filterAll'), Icon: LayersIcon},
              {key: 'fatal', label: t('crash.filterFatal'), Icon: SkullIcon},
              {key: 'js', label: t('crash.filterJsError'), Icon: JsIcon},
              {key: 'promise', label: t('crash.filterPromise'), Icon: HourglassIcon},
              {key: 'render', label: t('crash.filterRender'), Icon: LayoutIcon},
              {key: 'native', label: t('crash.filterNative'), Icon: ChipIcon},
            ] as const
          ).map(chip => {
            const isActive = filterType === chip.key;
            return (
              <TouchableOpacity
                key={chip.key}
                onPress={() => setFilterType(chip.key)}
                style={[
                  localStyles.filterChip,
                  isActive && localStyles.filterChipActive,
                ]}>
                <chip.Icon
                  size={12}
                  color={isActive ? AppColors.white : AppColors.grayTextStrong}
                />
                <Text
                  style={[
                    localStyles.filterChipText,
                    isActive && localStyles.filterChipTextActive,
                  ]}>
                  {chip.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ─── Crash List or Empty State ─── */}
      {filteredList.length === 0 ? (
        <ScrollView
          contentContainerStyle={localStyles.emptyContainer}
          showsVerticalScrollIndicator={false}>
          <View style={localStyles.emptyIconCircle}>
            <ShieldAlertIcon size={38} color={AppColors.greenColor} />
          </View>
          <Text style={localStyles.emptyTitle}>{t('crash.emptyTitle')}</Text>
          <Text style={localStyles.emptySub}>
            {searchQuery
              ? t('crash.emptySearchSubtitle')
              : t('crash.emptySubtitle')}
          </Text>
        </ScrollView>
      ) : (
        <FlatList
          data={filteredList}
          keyExtractor={item => item.id}
          renderItem={renderCard}
          contentContainerStyle={localStyles.listContent}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={<EndOfListFooter />}
        />
      )}

      {/* Filter Modal */}
      <CrashFilterModal
        visible={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        filters={crashFilters}
        onApply={setCrashFilters}
        searchQuery={searchQuery}
      />
    </View>
  );
});

export default CrashTab;

const localStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.grayBackground,
  },
  statsBar: {
    backgroundColor: AppColors.primaryLight,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.grayBorderSecondary,
    paddingVertical: 10,
  },
  statsScrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: AppColors.purpleShade50,
    borderWidth: 1,
    borderColor: `${AppColors.purple}14`,
  },
  statChipActive: {
    backgroundColor: `${AppColors.purple}14`,
    borderColor: `${AppColors.purple}33`,
  },
  statChipValue: {
    fontFamily: AppFonts.interBold,
    fontSize: 13,
    color: AppColors.primaryBlack,
  },
  statChipLabel: {
    fontFamily: AppFonts.interMedium,
    fontSize: 11,
    color: AppColors.grayText,
  },
  controlsContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 6,
    backgroundColor: AppColors.grayBackground,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.primaryLight,
    borderWidth: 1,
    borderColor: AppColors.grayBorderSecondary,
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 38,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: AppFonts.interRegular,
    fontSize: 13,
    color: AppColors.primaryBlack,
    paddingVertical: 0,
  },
  clearButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: `${AppColors.errorColor}14`,
    borderWidth: 1,
    borderColor: `${AppColors.errorColor}22`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: `${AppColors.brandPurple}0F`,
    borderWidth: 1,
    borderColor: `${AppColors.brandPurple}30`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterScrollContent: {
    paddingVertical: 10,
    gap: 6,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: AppColors.primaryLight,
    borderWidth: 1,
    borderColor: AppColors.grayBorderSecondary,
  },
  filterChipActive: {
    backgroundColor: AppColors.purple,
    borderColor: AppColors.purple,
  },
  filterChipText: {
    fontFamily: AppFonts.interMedium,
    fontSize: 12,
    color: AppColors.grayText,
  },
  filterChipTextActive: {
    fontFamily: AppFonts.interBold,
    color: AppColors.white,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 24,
    gap: 10,
  },
  cardContainer: {
    backgroundColor: AppColors.primaryLight,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AppColors.grayBorderSecondary,
    padding: 14,
    shadowColor: AppColors.shadowColorString,
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  fatalCardBorder: {
    borderColor: `${AppColors.errorColor}44`,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 1,
  },
  sNoBadge: {
    backgroundColor: AppColors.grayBackground,
    borderWidth: 1,
    borderColor: AppColors.grayBorderSecondary,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 5,
  },
  sNoBadgeText: {
    fontFamily: AppFonts.interBold,
    fontSize: 9.5,
    color: AppColors.grayText,
    letterSpacing: 0.3,
  },
  fatalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: AppColors.errorColor,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 5,
  },
  fatalBadgeText: {
    fontFamily: AppFonts.interBold,
    fontSize: 9.5,
    color: AppColors.white,
    letterSpacing: 0.5,
  },
  caughtBadge: {
    backgroundColor: `${AppColors.greenColor}1F`,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 5,
  },
  caughtBadgeText: {
    fontFamily: AppFonts.interBold,
    fontSize: 9.5,
    color: AppColors.greenColor,
    letterSpacing: 0.5,
  },
  typeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 5,
  },
  typeBadgeText: {
    fontFamily: AppFonts.interBold,
    fontSize: 9.5,
    letterSpacing: 0.5,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 1,
  },
  timestampText: {
    fontFamily: AppFonts.interRegular,
    fontSize: 11,
    color: AppColors.grayTextWeak,
  },
  relativeTimeText: {
    fontFamily: AppFonts.interBold,
    fontSize: 10,
    color: AppColors.grayTextWeak,
    backgroundColor: AppColors.grayBackground,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    overflow: 'hidden',
  },
  errorMessageText: {
    fontFamily: AppFonts.interBold,
    fontSize: 13.5,
    color: AppColors.primaryBlack,
    lineHeight: 18,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
    marginBottom: 6,
    backgroundColor: AppColors.purpleShade50,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  locationText: {
    fontFamily: AppFonts.interRegular,
    fontSize: 11,
    color: AppColors.grayText,
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: AppColors.dividerColor,
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: AppColors.purpleShade50,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  metaPillText: {
    fontFamily: AppFonts.interMedium,
    fontSize: 10,
    color: AppColors.grayTextWeak,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    marginTop: 40,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: `${AppColors.greenColor}1F`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontFamily: AppFonts.interBold,
    fontSize: 17,
    color: AppColors.primaryBlack,
    marginBottom: 6,
  },
  emptySub: {
    fontFamily: AppFonts.interRegular,
    fontSize: 13,
    color: AppColors.grayText,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 280,
  },
});
