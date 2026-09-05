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
import {
  SearchIcon,
  ClearIcon,
  SortArrowIcon,
  TrashIcon,
  LayersIcon,
  CheckIcon,
  UserIcon,
  InfoCircleIcon,
  WarningTriangleIcon,
  ErrorCircleIcon,
  AnalyticsIcon,
  HeaderPauseIcon,
  ChevronIcon,
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
    isConsolePaused,
    setIsConsolePaused,
  } = useInspector();

  const listRef = useRef<FlatList>(null);

  const renderItem = useCallback(
    ({item, index}: {item: any; index: number}) => (
      <AnimatedEntrance index={index} distance={8}>
        <ConsoleLogCard item={item} searchStr={logSearch} />
      </AnimatedEntrance>
    ),
    [logSearch],
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
    () => ['[AXIOS]', '[API]', '[REDUX]', '[ANALYTICS]', '[AUTH]', '[WARN]', '[ERROR]'],
    [],
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
              style={[
                styles.toolbarBtn,
                isConsolePaused && {
                  borderColor: `${AppColors.darkOrange}50`,
                  backgroundColor: `${AppColors.darkOrange}18`,
                },
              ]}
              onPress={() => setIsConsolePaused(p => !p)}
              hitSlop={6}>
              <HeaderPauseIcon
                isPaused={isConsolePaused}
                color={
                  isConsolePaused
                    ? AppColors.darkOrange
                    : AppColors.grayTextStrong
                }
                size={16}
              />
            </TouchableScale>
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

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{marginVertical: 4, maxHeight: 46}}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: 4,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
          }}>
          {/* All Filter */}
          {(() => {
            const active = logFilters.has('all');
            return (
              <TouchableScale
                onPress={() => {
                  setLogFilters(new Set(['all']));
                }}>
                <View
                  style={[
                    styles.statusFilterChip,
                    {
                      backgroundColor: active ? AppColors.indigo600Alt : AppColors.indigo50,
                      borderColor: active ? AppColors.indigo600 : AppColors.indigo400,
                      borderRadius: 8,
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                    },
                    active && {
                      shadowColor: AppColors.indigo600Alt,
                      shadowOffset: {width: 0, height: 1},
                      shadowOpacity: 0.28,
                      shadowRadius: 2.5,
                      elevation: 2,
                    },
                  ]}>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                    }}>
                    <LayersIcon
                      size={13}
                      color={active ? AppColors.white : AppColors.indigo600Alt}
                    />
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.statusFilterText,
                        {
                          color: active ? AppColors.white : AppColors.indigo600Alt,
                          fontFamily: AppFonts.interBold,
                        },
                      ]}>
                      {t('common.all', 'All')} ({logCounts.all})
                    </Text>
                  </View>
                </View>
              </TouchableScale>
            );
          })()}

          {/* User Log / Standard Log Filter */}
          {(() => {
            const active = logFilters.has('user-log');
            return (
              <TouchableScale
                onPress={() => {
                  setLogFilters(prev => {
                    const next = new Set(prev);
                    next.delete('all');
                    next.has('user-log')
                      ? next.delete('user-log')
                      : next.add('user-log');
                    if (next.size === 0) next.add('all');
                    return next;
                  });
                }}>
                <View
                  style={[
                    styles.statusFilterChip,
                    {
                      backgroundColor: active ? AppColors.teal600 : AppColors.teal100,
                      borderColor: active ? AppColors.teal600 : AppColors.teal400,
                      borderRadius: 8,
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                    },
                    active && {
                      shadowColor: AppColors.teal600,
                      shadowOffset: {width: 0, height: 1},
                      shadowOpacity: 0.28,
                      shadowRadius: 2.5,
                      elevation: 2,
                    },
                  ]}>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                    }}>
                    <UserIcon
                      size={13}
                      color={active ? AppColors.white : AppColors.teal600}
                    />
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.statusFilterText,
                        {
                          color: active ? AppColors.white : AppColors.teal600,
                          fontFamily: AppFonts.interBold,
                        },
                      ]}>
                      {t('console.log', 'Log')} ({logCounts['user-log']})
                    </Text>
                  </View>
                </View>
              </TouchableScale>
            );
          })()}

          {/* Info Filter */}
          {(() => {
            const active = logFilters.has('info');
            return (
              <TouchableScale
                onPress={() => {
                  setLogFilters(prev => {
                    const next = new Set(prev);
                    next.delete('all');
                    next.has('info')
                      ? next.delete('info')
                      : next.add('info');
                    if (next.size === 0) next.add('all');
                    return next;
                  });
                }}>
                <View
                  style={[
                    styles.statusFilterChip,
                    {
                      backgroundColor: active ? AppColors.sky600 : AppColors.sky100,
                      borderColor: active ? AppColors.blue700 : AppColors.sky400,
                      borderRadius: 8,
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                    },
                    active && {
                      shadowColor: AppColors.sky600,
                      shadowOffset: {width: 0, height: 1},
                      shadowOpacity: 0.28,
                      shadowRadius: 2.5,
                      elevation: 2,
                    },
                  ]}>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                    }}>
                    <InfoCircleIcon
                      size={13}
                      color={active ? AppColors.white : AppColors.sky600}
                    />
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.statusFilterText,
                        {
                          color: active ? AppColors.white : AppColors.sky600,
                          fontFamily: AppFonts.interBold,
                        },
                      ]}>
                      {t('console.info', 'Info')} ({logCounts.info})
                    </Text>
                  </View>
                </View>
              </TouchableScale>
            );
          })()}

          {/* Warning Filter */}
          {(() => {
            const active = logFilters.has('warn');
            return (
              <TouchableScale
                onPress={() => {
                  setLogFilters(prev => {
                    const next = new Set(prev);
                    next.delete('all');
                    next.has('warn')
                      ? next.delete('warn')
                      : next.add('warn');
                    if (next.size === 0) next.add('all');
                    return next;
                  });
                }}>
                <View
                  style={[
                    styles.statusFilterChip,
                    {
                      backgroundColor: active ? AppColors.amber600 : AppColors.amber100,
                      borderColor: active ? AppColors.amber700 : AppColors.amber200,
                      borderRadius: 8,
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                    },
                    active && {
                      shadowColor: AppColors.amber600,
                      shadowOffset: {width: 0, height: 1},
                      shadowOpacity: 0.28,
                      shadowRadius: 2.5,
                      elevation: 2,
                    },
                  ]}>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                    }}>
                    <WarningTriangleIcon
                      size={13}
                      color={active ? AppColors.white : AppColors.amber700}
                    />
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.statusFilterText,
                        {
                          color: active ? AppColors.white : AppColors.amber800Warm,
                          fontFamily: AppFonts.interBold,
                        },
                      ]}>
                      {t('console.warning', 'Warn')} ({logCounts.warn})
                    </Text>
                  </View>
                </View>
              </TouchableScale>
            );
          })()}

          {/* Error Filter */}
          {(() => {
            const active = logFilters.has('error');
            return (
              <TouchableScale
                onPress={() => {
                  setLogFilters(prev => {
                    const next = new Set(prev);
                    next.delete('all');
                    next.has('error')
                      ? next.delete('error')
                      : next.add('error');
                    if (next.size === 0) next.add('all');
                    return next;
                  });
                }}>
                <View
                  style={[
                    styles.statusFilterChip,
                    {
                      backgroundColor: active ? AppColors.red500 : AppColors.red100,
                      borderColor: active ? AppColors.red600 : AppColors.errorBorder,
                      borderRadius: 8,
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                    },
                    active && {
                      shadowColor: AppColors.red500,
                      shadowOffset: {width: 0, height: 1},
                      shadowOpacity: 0.28,
                      shadowRadius: 2.5,
                      elevation: 2,
                    },
                  ]}>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                    }}>
                    <ErrorCircleIcon
                      size={13}
                      color={active ? AppColors.white : AppColors.red500}
                    />
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.statusFilterText,
                        {
                          color: active ? AppColors.white : AppColors.redErrorText,
                          fontFamily: AppFonts.interBold,
                        },
                      ]}>
                      {t('console.error', 'Error')} ({logCounts.error})
                    </Text>
                  </View>
                </View>
              </TouchableScale>
            );
          })()}

          {/* Analytics Filter */}
          {(() => {
            const active = logFilters.has('analytics');
            return (
              <TouchableScale
                onPress={() => {
                  setLogFilters(prev => {
                    const next = new Set(prev);
                    next.delete('all');
                    next.has('analytics')
                      ? next.delete('analytics')
                      : next.add('analytics');
                    if (next.size === 0) next.add('all');
                    return next;
                  });
                }}>
                <View
                  style={[
                    styles.statusFilterChip,
                    {
                      backgroundColor: active ? AppColors.violet600 : AppColors.purple100,
                      borderColor: active ? AppColors.purple700 : AppColors.purple200,
                      borderRadius: 8,
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                    },
                    active && {
                      shadowColor: AppColors.violet600,
                      shadowOffset: {width: 0, height: 1},
                      shadowOpacity: 0.28,
                      shadowRadius: 2.5,
                      elevation: 2,
                    },
                  ]}>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                    }}>
                    <AnalyticsIcon
                      size={13}
                      color={active ? AppColors.white : AppColors.violet600}
                    />
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.statusFilterText,
                        {
                          color: active ? AppColors.white : AppColors.purpleText,
                          fontFamily: AppFonts.interBold,
                        },
                      ]}>
                      {t('console.analytics', 'Analytics')} ({logCounts.analytics})
                    </Text>
                  </View>
                </View>
              </TouchableScale>
            );
          })()}
        </ScrollView>
      </View>

      <FlatList
        ref={listRef}
        data={filteredConsoleLogs}
        keyExtractor={keyExtractor}
        ListHeaderComponent={listHeader}
        renderItem={renderItem}
        initialNumToRender={12}
        maxToRenderPerBatch={8}
        windowSize={5}
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
            <EndOfListFooter count={filteredConsoleLogs.length} label="logs" />
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