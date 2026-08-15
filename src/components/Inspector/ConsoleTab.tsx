import React, {useCallback, useMemo} from 'react';
import {
  FlatList,
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
  UserIcon,
  InfoCircleIcon,
  WarningTriangleIcon,
  ErrorCircleIcon,
  AnalyticsIcon,
  HeaderPauseIcon,
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
        <Text
          style={[
            styles.resultCount,
            {marginBottom: 4, marginTop: 12},
          ]}>
          Showing ({filtered}/{total}) logs showing
        </Text>
      );
    } else {
      const activeFilterNames = Array.from(logFilters)
        .filter(f => f !== 'all')
        .map(f => {
          if (f === 'user-log') return 'User Log';
          if (f === 'analytics') return 'Analytics';
          return (
            (f as string).charAt(0).toUpperCase() +
            (f as string).slice(1)
          );
        });
      return (
        <Text
          style={[
            styles.resultCount,
            {marginBottom: 4, marginTop: 12},
          ]}>
          Filtering with {activeFilterNames.join(', ')} (
          {filtered}/{total}) logs is showing
        </Text>
      );
    }
  }, [visibleConsoleLogs.length, filteredConsoleLogs.length, logFilters]);

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
          <View style={styles.searchContainer}>
            <SearchIcon
              color={AppColors.grayTextWeak}
              size={16}
            />
            <TextInput
              placeholder={t('console.searchPlaceholder')}
              placeholderTextColor={AppColors.grayTextWeak}
              value={logSearch}
              onChangeText={setLogSearch}
              style={styles.searchInput}
              autoCorrect={false}
              autoCapitalize="none"
            />
            {logSearch.length > 0 && (
              <Pressable
                onPress={() => setLogSearch('')}
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
                    active && {
                      borderColor: AppColors.purpleShade700,
                      backgroundColor: AppColors.purpleTintBg,
                    },
                  ]}>
                  {/* #7 */}
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 5,
                    }}>
                    <LayersIcon
                      size={12}
                      color={
                        active
                          ? AppColors.purpleShade700
                          : AppColors.grayTextStrong
                      }
                    />
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.statusFilterText,
                        active && {
                          color: AppColors.purpleShade700,
                          fontFamily: AppFonts.interBold,
                        },
                      ]}>
                      All ({logCounts.all})
                    </Text>
                  </View>
                </View>
              </TouchableScale>
            );
          })()}

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
                    active && {
                      borderColor: AppColors.slate500,
                      backgroundColor: AppColors.slate100,
                    },
                  ]}>
                  {/* #7 */}
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 5,
                    }}>
                    <UserIcon
                      size={12}
                      color={
                        active
                          ? AppColors.slate700
                          : AppColors.grayTextStrong
                      }
                    />
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.statusFilterText,
                        active && {
                          color: AppColors.slate700,
                          fontFamily: AppFonts.interBold,
                        },
                      ]}>
                      User Log ({logCounts['user-log']})
                    </Text>
                  </View>
                </View>
              </TouchableScale>
            );
          })()}

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
                    active && {
                      borderColor: AppColors.purple,
                      backgroundColor: AppColors.purpleShade50,
                    },
                  ]}>
                  {/* #7 */}
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 5,
                    }}>
                    <InfoCircleIcon
                      size={12}
                      color={
                        active
                          ? AppColors.purple
                          : AppColors.grayTextStrong
                      }
                    />
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.statusFilterText,
                        active && {
                          color: AppColors.purple,
                          fontFamily: AppFonts.interBold,
                        },
                      ]}>
                      Info ({logCounts.info})
                    </Text>
                  </View>
                </View>
              </TouchableScale>
            );
          })()}

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
                    active && {
                      borderColor: AppColors.lightOrange,
                      backgroundColor: AppColors.warnCardBg,
                    },
                  ]}>
                  {/* #7 */}
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 5,
                    }}>
                    <WarningTriangleIcon
                      size={12}
                      color={
                        active
                          ? AppColors.darkOrange ||
                            AppColors.lightOrange
                          : AppColors.grayTextStrong
                      }
                    />
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.statusFilterText,
                        active && {
                          color:
                            AppColors.darkOrange ||
                            AppColors.lightOrange,
                          fontFamily: AppFonts.interBold,
                        },
                      ]}>
                      Warning ({logCounts.warn})
                    </Text>
                  </View>
                </View>
              </TouchableScale>
            );
          })()}

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
                    active && {
                      borderColor: AppColors.errorColor,
                      backgroundColor: AppColors.errorCardBg,
                    },
                  ]}>
                  {/* #7 */}
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 5,
                    }}>
                    <ErrorCircleIcon
                      size={12}
                      color={
                        active
                          ? AppColors.errorColor
                          : AppColors.grayTextStrong
                      }
                    />
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.statusFilterText,
                        active && {
                          color: AppColors.errorColor,
                          fontFamily: AppFonts.interBold,
                        },
                      ]}>
                      Error ({logCounts.error})
                    </Text>
                  </View>
                </View>
              </TouchableScale>
            );
          })()}

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
                    active && {
                      borderColor: AppColors.skyBlue,
                      backgroundColor: `${AppColors.skyBlue}15`,
                    },
                  ]}>
                  {/* #7 */}
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 5,
                    }}>
                    <AnalyticsIcon
                      size={12}
                      color={
                        active
                          ? AppColors.skyBlue
                          : AppColors.grayTextStrong
                      }
                    />
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.statusFilterText,
                        active && {
                          color: AppColors.skyBlue,
                          fontFamily: AppFonts.interBold,
                        },
                      ]}>
                      Analytics ({logCounts.analytics})
                    </Text>
                  </View>
                </View>
              </TouchableScale>
            );
          })()}
        </ScrollView>
      </View>

      <FlatList
        data={filteredConsoleLogs}
        keyExtractor={keyExtractor}
        ListHeaderComponent={listHeader}
        renderItem={renderItem}
        initialNumToRender={15}
        maxToRenderPerBatch={15}
        windowSize={7}
        removeClippedSubviews={true}
        ListEmptyComponent={
          <EmptyState
            isSearch={
              logSearch.length > 0 || logFilters.size > 0
            }
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