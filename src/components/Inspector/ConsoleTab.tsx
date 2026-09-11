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
import {useTranslation} from '../../i18n';
import TouchableScale from '../TouchableScale';
import AnimatedEntrance from '../AnimatedEntrance';
import {ConsoleLogCard} from '../ConsoleLogCard';
import EmptyState from '../EmptyState';
import EndOfListFooter from '../EndOfListFooter';
import styles from '../../styles';
import {AppColors} from '../../styles/AppColors';
import {AppFonts} from '../../styles/AppFonts';
import {LogFilter} from '../../types';
import {
  SearchIcon,
  ClearIcon,
  SortArrowIcon,
  TrashIcon,
  LayersIcon,
  UserIcon,
  InfoCircleIcon,
  WarningTriangleIcon,
  ErrorCircleIcon,
  AnalyticsIcon,
} from '../NetworkIcons';

const ConsoleTab = React.memo(() => {
  const {t} = useTranslation();
  const {
    logSearch,
    setLogSearch,
    logSortOrder,
    setLogSortOrder,
    handleDelete,
    logFilters,
    setLogFilters,
    logCounts,
    filteredConsoleLogs,
    visibleConsoleLogs,
  } = useInspector();

  const listRef = useRef<FlatList>(null);
  const [displayLimit, setDisplayLimit] = React.useState<number>(100);

  const displayedConsoleLogs = useMemo(
    () => filteredConsoleLogs.slice(0, displayLimit),
    [filteredConsoleLogs, displayLimit],
  );

  const renderItem = useCallback(
    ({item, index}: {item: any; index: number}) => (
      <AnimatedEntrance index={index} distance={8}>
        <ConsoleLogCard item={item} searchStr={logSearch} />
      </AnimatedEntrance>
    ),
    [logSearch],
  );

  const getItemLayout = useCallback(
    (_: any, index: number) => ({
      length: 148,
      offset: 148 * index,
      index,
    }),
    [],
  );

  const keyExtractor = useCallback(
    (item: any, index: number) => item?.id?.toString() ?? index.toString(),
    [],
  );

  const listHeader = useMemo(() => {
    const total = visibleConsoleLogs.length;
    const filtered = filteredConsoleLogs.length;
    const isAllSelected =
      logFilters.has('all') ||
      !Array.from(logFilters).some(f => f !== 'all');
    if (isAllSelected) {
      return (
        <View style={{paddingHorizontal: 12, paddingTop: 8, paddingBottom: 3}}>
          <Text
            style={{
              fontFamily: AppFonts.interMedium,
              fontSize: 11,
              color: AppColors.grayTextWeak,
              letterSpacing: 0.2,
            }}>
            {filtered === total
              ? `Showing ${total} logs`
              : `Showing ${filtered} of ${total} logs`}
          </Text>
        </View>
      );
    } else {
      const activeFilterNames = Array.from(logFilters)
        .filter(f => f !== 'all')
        .map(f => {
          if (f === 'user-log') return 'Log';
          if (f === 'analytics') return 'Analytics';
          return (
            (f as string).charAt(0).toUpperCase() +
            (f as string).slice(1)
          );
        });
      return (
        <View style={{paddingHorizontal: 12, paddingTop: 8, paddingBottom: 3}}>
          <Text
            style={{
              fontFamily: AppFonts.interMedium,
              fontSize: 11,
              color: AppColors.grayTextWeak,
              letterSpacing: 0.2,
            }}>
            Filtered by {activeFilterNames.join(', ')} ({filtered} of {total} logs)
          </Text>
        </View>
      );
    }
  }, [visibleConsoleLogs.length, filteredConsoleLogs.length, logFilters]);

  const [isSearchFocused, setIsSearchFocused] = React.useState(false);

  const QUICK_TAG_SUGGESTIONS = useMemo(
    () => [
      '[AXIOS]',
      '[API]',
      '[GRAPHQL]',
      '[REDUX]',
      '[ANALYTICS]',
      '[AUTH]',
      '[NAV]',
      '[STORAGE]',
      '[PERF]',
      '[WS]',
      '[PUSH]',
      '[PAYMENT]',
      '[SYNC]',
      '[BLE]',
      '[LOCATION]',
      '[TEST]',
      '[DEBUG]',
    ],
    [],
  );

  const LOG_QUICK_CHIPS: {
    id: LogFilter;
    label: string;
    count: string;
    color: string;
    Icon: any;
  }[] = useMemo(
    () => [
      {
        id: LogFilter.All,
        label: t('common.all', 'All'),
        count: logCounts.all?.split('/')?.[0] ?? '0',
        color: AppColors.purple,
        Icon: LayersIcon,
      },
      {
        id: LogFilter.UserLog,
        label: t('console.log', 'Log'),
        count: logCounts['user-log']?.split('/')?.[0] ?? '0',
        color: AppColors.teal600,
        Icon: UserIcon,
      },
      {
        id: LogFilter.Info,
        label: t('console.info', 'Info'),
        count: logCounts.info?.split('/')?.[0] ?? '0',
        color: AppColors.sky600,
        Icon: InfoCircleIcon,
      },
      {
        id: LogFilter.Warn,
        label: t('console.warning', 'Warn'),
        count: logCounts.warn?.split('/')?.[0] ?? '0',
        color: AppColors.amber600,
        Icon: WarningTriangleIcon,
      },
      {
        id: LogFilter.Error,
        label: t('console.error', 'Error'),
        count: logCounts.error?.split('/')?.[0] ?? '0',
        color: AppColors.errorColor,
        Icon: ErrorCircleIcon,
      },
      {
        id: LogFilter.Analytics,
        label: t('console.analytics', 'Analytics'),
        count: logCounts.analytics?.split('/')?.[0] ?? '0',
        color: AppColors.violet600,
        Icon: AnalyticsIcon,
      },
    ],
    [logCounts, t],
  );

  return (
    <View style={{flex: 1}}>
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
          <View
            style={[
              styles.searchContainer,
              isSearchFocused && {
                borderColor: AppColors.purple,
                borderWidth: 1.5,
              },
            ]}>
            <SearchIcon
              color={isSearchFocused ? AppColors.purple : AppColors.grayTextWeak}
              size={16}
            />
            <TextInput
              placeholder={t('console.searchPlaceholder')}
              placeholderTextColor={AppColors.grayTextWeak}
              value={logSearch}
              onChangeText={setLogSearch}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              style={styles.searchInput}
              autoCorrect={false}
              autoCapitalize="none"
            />
            {logSearch.length > 0 && (
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
                    paddingVertical: 2,
                  }}>
                  <Text
                    style={{
                      color: AppColors.purple,
                      fontSize: 10,
                      fontFamily: AppFonts.interBold,
                    }}>
                    {filteredConsoleLogs.length}
                  </Text>
                </View>
                <Pressable
                  onPress={() => setLogSearch('')}
                  hitSlop={10}
                  style={styles.clearBtn}>
                  <ClearIcon
                    color={AppColors.grayTextWeak}
                    size={14}
                  />
                </Pressable>
              </View>
            )}
          </View>

          <View style={styles.toolbarRight}>
            <TouchableScale
              style={styles.toolbarBtn}
              onPress={() =>
                setLogSortOrder(o =>
                  o === 'newest' ? 'oldest' : 'newest',
                )
              }
              hitSlop={10}>
              <SortArrowIcon
                color={AppColors.grayTextStrong}
                size={18}
                direction={
                  logSortOrder === 'newest' ? 'down' : 'up'
                }
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
            </TouchableScale>
          </View>
        </View>

        {/* Quick Tag Search Suggestions Bar */}
        {(isSearchFocused || logSearch.length > 0) && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{marginBottom: 6, maxHeight: 30}}
            contentContainerStyle={{
              paddingHorizontal: 16,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
            }}>
            {QUICK_TAG_SUGGESTIONS.map(tag => {
              const isSelected = logSearch.includes(tag);
              return (
                <TouchableScale
                  key={tag}
                  onPress={() => {
                    if (isSelected) {
                      setLogSearch(prev =>
                        prev.replace(tag, '').trim(),
                      );
                    } else {
                      setLogSearch(prev =>
                        prev ? `${prev} ${tag}`.trim() : tag,
                      );
                    }
                  }}>
                  <View
                    style={{
                      paddingHorizontal: 8,
                      paddingVertical: 3,
                      borderRadius: 6,
                      backgroundColor: isSelected
                        ? AppColors.purple
                        : `${AppColors.purple}14`,
                      borderWidth: 1,
                      borderColor: isSelected
                        ? AppColors.purple
                        : `${AppColors.purple}30`,
                    }}>
                    <Text
                      style={{
                        fontFamily: AppFonts.interBold,
                        fontSize: 10,
                        color: isSelected
                          ? AppColors.white
                          : AppColors.purple,
                      }}>
                      {tag}
                    </Text>
                  </View>
                </TouchableScale>
              );
            })}
          </ScrollView>
        )}

        {/* Quick Filter Horizontal Chips Bar (Styled exactly like API Tab) */}
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
            {LOG_QUICK_CHIPS.map(chip => {
              const isActive =
                chip.id === 'all'
                  ? logFilters.has('all')
                  : logFilters.has(chip.id) && !logFilters.has('all');
              const chipColor = chip.color || AppColors.purple;
              const iconColor = isActive ? AppColors.white : chipColor;
              const ChipIcon = chip.Icon;

              return (
                <TouchableScale
                  key={chip.id}
                  onPress={() => {
                    if (chip.id === 'all') {
                      setLogFilters(new Set(['all']));
                    } else {
                      setLogFilters(prev => {
                        const next = new Set(prev);
                        next.delete('all');
                        if (next.has(chip.id)) {
                          next.delete(chip.id);
                        } else {
                          next.add(chip.id);
                        }
                        if (next.size === 0) next.add('all');
                        return next;
                      });
                    }
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
      </View>

      <FlatList
        ref={listRef}
        data={displayedConsoleLogs}
        keyExtractor={keyExtractor}
        ListHeaderComponent={listHeader}
        renderItem={renderItem}
        getItemLayout={getItemLayout}
        initialNumToRender={15}
        maxToRenderPerBatch={10}
        windowSize={9}
        removeClippedSubviews={Platform.OS === 'android'}
        renderToHardwareTextureAndroid={true}
        ListEmptyComponent={
          <EmptyState
            isSearch={
              logSearch.length > 0 || !logFilters.has('all')
            }
            searchQuery={logSearch}
            customTitle={
              logSearch.length > 0
                ? 'No matching console logs'
                : 'No console logs'
            }
            onClearSearch={() => {
              setLogSearch('');
              setLogFilters(new Set(['all']));
            }}
          />
        }
        ListFooterComponent={
          filteredConsoleLogs.length > 0 ? (
            <EndOfListFooter
              count={displayedConsoleLogs.length}
              totalCount={filteredConsoleLogs.length}
              label="logs"
              hasMore={displayedConsoleLogs.length < filteredConsoleLogs.length}
              onLoadMore={() => setDisplayLimit(prev => prev + 10)}
            />
          ) : null
        }
        contentContainerStyle={[
          styles.listContent,
          filteredConsoleLogs.length === 0 && {flexGrow: 1},
        ]}
        keyboardShouldPersistTaps="handled"
      />
    </View>
  );
});

export default ConsoleTab;