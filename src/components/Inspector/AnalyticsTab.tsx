import React, {useCallback, useState, useMemo} from 'react';
import {
  FlatList,
  Pressable,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {animateNextLayout, useInspector} from './InspectorContext';
import AnalyticsEventCard from '../AnalyticsEventCard';
import AnalyticsDetail from '../AnalyticsDetail';
import AnalyticsFilterModal from './AnalyticsFilterModal';
import EndOfListFooter from '../EndOfListFooter';
import styles from '../../styles';
import {AppColors} from '../../styles/AppColors';
import {AppFonts} from '../../styles/AppFonts';
import Svg, {
  Rect,
  Line,
  Circle,
  G,
  Defs,
  LinearGradient as SvgLinearGradient,
  Stop,
} from 'react-native-svg';
import TouchableScale from '../TouchableScale';
import {
  getCurrentUserId,
  getCurrentUserProperties,
  getDefaultEventParameters,
  getCollectionEnabled,
} from '../../customHooks/analyticsLogger';
import {
  getEventCategory,
  getCategoryColors,
} from '../../helpers';
import {
  SearchIcon,
  ClearIcon,
  TrashIcon,
  EmptyRadarIcon,
  HeaderPauseIcon,
  FilterIcon,
  CartIcon,
  GlobeIcon,
  BoltIcon,
  SparkleIcon,
  ClockIcon,
  TargetGoalIcon,
  PinIcon,
  MoneyIcon,
  UserCheckIcon,
} from '../NetworkIcons';

const AnalyticsHeader = React.memo(() => {
  const {
    analyticsEvents,
    filteredAnalyticsEvents,
    analyticsFilters,
    setAnalyticsFilters,
    analyticsHeaderExpanded,
    setAnalyticsHeaderExpanded,
  } = useInspector();

  const userId = getCurrentUserId();
  const userProperties = getCurrentUserProperties();
  const defaultParams = getDefaultEventParameters();
  const isTrackingEnabled = getCollectionEnabled();

  const hasUserProps = Object.keys(userProperties).length > 0;
  const hasDefaultParams = Object.keys(defaultParams).length > 0;
  const totalEvents = filteredAnalyticsEvents.length;

  // Category counts & breakdown across all session events
  const categoryStats = useMemo(() => {
    let ecommerce = 0;
    let page_view = 0;
    let system = 0;
    let custom = 0;
    let totalRevenue = 0;

    for (const e of analyticsEvents) {
      const cat = getEventCategory(e.name);
      const c = (e as any).count || 1;
      if (cat === 'ecommerce') {
        ecommerce += c;
        const val = e.params?.value ?? e.params?.price;
        if (val && !isNaN(Number(val))) {
          totalRevenue += Number(val);
        }
      } else if (cat === 'page_view') {
        page_view += c;
      } else if (cat === 'system') {
        system += c;
      } else {
        custom += c;
      }
    }

    const total = ecommerce + page_view + system + custom || 1;
    return {
      ecommerce,
      page_view,
      system,
      custom,
      totalRevenue,
      ecommercePct: Math.round((ecommerce / total) * 100),
      page_viewPct: Math.round((page_view / total) * 100),
      systemPct: Math.round((system / total) * 100),
      customPct: Math.round((custom / total) * 100),
      totalCount: total,
    };
  }, [analyticsEvents]);

  // Top Screen Views Leaderboard (GA4 Realtime Card)
  const topScreens = useMemo(() => {
    const screenMap = new Map<string, number>();
    for (const e of filteredAnalyticsEvents) {
      const scr =
        e.screenName ||
        e.params?.firebase_screen ||
        e.params?.screen_name ||
        e.params?.firebase_screen_class ||
        e.screenClass;
      if (scr && typeof scr === 'string' && scr.trim() !== '') {
        screenMap.set(scr, (screenMap.get(scr) || 0) + ((e as any).count || 1));
      }
    }
    const arr = Array.from(screenMap.entries()).sort((a, b) => b[1] - a[1]);
    const maxVal = arr.length > 0 ? arr[0][1] : 1;
    return arr.slice(0, 3).map(([name, count]) => ({
      name,
      count,
      pct: Math.round((count / (filteredAnalyticsEvents.length || 1)) * 100),
      barWidthPct: Math.round((count / maxVal) * 100),
    }));
  }, [filteredAnalyticsEvents]);

  // Toggle category filter from top button group
  const toggleCategoryFilter = (cat: string) => {
    animateNextLayout();
    setAnalyticsFilters(prev => {
      const isSelected =
        !prev.categories.has('all') && prev.categories.has(cat);
      if (isSelected) {
        return {...prev, categories: new Set(['all'])};
      } else {
        return {...prev, categories: new Set([cat])};
      }
    });
  };

  // 12-Bucket GA4 Realtime Stacked Histogram Graph (-30m / 30s to NOW)
  const BUCKET_COUNT = 12;
  const chartHeight = 56;
  const histogramBars = useMemo(() => {
    const buckets: {
      ecommerce: number;
      page_view: number;
      system: number;
      custom: number;
      total: number;
    }[] = Array.from({length: BUCKET_COUNT}, () => ({
      ecommerce: 0,
      page_view: 0,
      system: 0,
      custom: 0,
      total: 0,
    }));

    const now = Date.now();
    const windowMs = 60000; // 60s window
    const bucketDuration = windowMs / BUCKET_COUNT;

    for (const e of filteredAnalyticsEvents) {
      const age = now - e.timestamp;
      if (age >= 0 && age < windowMs) {
        const bucketIdx = Math.floor((windowMs - 1 - age) / bucketDuration);
        if (bucketIdx >= 0 && bucketIdx < BUCKET_COUNT) {
          const cat = getEventCategory(e.name);
          const c = (e as any).count || 1;
          buckets[bucketIdx].total += c;
          if (cat === 'ecommerce') buckets[bucketIdx].ecommerce += c;
          else if (cat === 'page_view') buckets[bucketIdx].page_view += c;
          else if (cat === 'system') buckets[bucketIdx].system += c;
          else buckets[bucketIdx].custom += c;
        }
      }
    }

    const maxVal = Math.max(...buckets.map(b => b.total), 4);
    return buckets.map((b, idx) => {
      const totalH = Math.max(
        (b.total / maxVal) * (chartHeight - 14),
        b.total > 0 ? 8 : 2.5,
      );
      const ecomH = b.total > 0 ? (b.ecommerce / b.total) * totalH : 0;
      const screenH = b.total > 0 ? (b.page_view / b.total) * totalH : 0;
      const sysH = b.total > 0 ? (b.system / b.total) * totalH : 0;
      const custH =
        b.total > 0 ? (b.custom / b.total) * totalH : totalH;

      return {
        index: idx,
        total: b.total,
        totalHeight: totalH,
        ecomHeight: ecomH,
        screenHeight: screenH,
        sysHeight: sysH,
        custHeight: custH,
        isLatest: idx === BUCKET_COUNT - 1,
      };
    });
  }, [filteredAnalyticsEvents, chartHeight]);

  return (
    <View style={styles.analyticsHeaderCard}>
      {/* ── Top Header Row (GA4 Style) ─────────────────────────────────────── */}
      <View style={styles.analyticsHeaderTop}>
        <View style={{flex: 1}}>
          <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
            <Text style={styles.analyticsHeaderTitle}>Users in last 30 minutes</Text>
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor: isTrackingEnabled
                    ? AppColors.greenColor
                    : AppColors.errorColor,
                },
              ]}
            />
            <Text
              style={[
                styles.statusText,
                {
                  color: isTrackingEnabled
                    ? AppColors.greenColor
                    : AppColors.errorColor,
                  fontFamily: AppFonts.interBold,
                },
              ]}>
              {isTrackingEnabled ? 'Realtime' : 'Paused'}
            </Text>
          </View>
          <Text style={styles.analyticsHeaderSubtitle} numberOfLines={1}>
            {userId ? `User: ${userId}` : 'Anonymous Session'}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.analyticsHeaderToggle}
          activeOpacity={0.7}
          onPress={() => {
            animateNextLayout();
            setAnalyticsHeaderExpanded(!analyticsHeaderExpanded);
          }}>
          <Text style={styles.analyticsHeaderToggleText}>
            {analyticsHeaderExpanded ? 'Hide Info' : 'Session Info'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── GA4 Realtime Metric Hero & Activity Chart ─────────────────────── */}
      <View
        style={{
          marginTop: 10,
          marginBottom: 8,
          backgroundColor: AppColors.grayBackground,
          borderRadius: 10,
          borderWidth: 1,
          borderColor: AppColors.dividerColor,
          padding: 10,
        }}>
        {/* Hero Metric Row */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: 8,
          }}>
          <View>
            <View style={{flexDirection: 'row', alignItems: 'baseline', gap: 6}}>
              <Text
                style={{
                  fontFamily: AppFonts.interBold,
                  fontSize: 22,
                  color: AppColors.primaryBlack,
                  lineHeight: 26,
                }}>
                {totalEvents}
              </Text>
              <Text
                style={{
                  fontFamily: AppFonts.interMedium,
                  fontSize: 10.5,
                  color: AppColors.grayTextWeak,
                }}>
                events in window
              </Text>
            </View>
          </View>

          {/* Realtime Badges */}
          <View style={{flexDirection: 'row', alignItems: 'center', gap: 5}}>
            {categoryStats.totalRevenue > 0 && (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 3,
                  backgroundColor: `${AppColors.emerald600}15`,
                  paddingHorizontal: 6,
                  paddingVertical: 2.5,
                  borderRadius: 4,
                  borderWidth: 1,
                  borderColor: `${AppColors.emerald600}30`,
                }}>
                <MoneyIcon color={AppColors.emerald600} size={10} />
                <Text
                  style={{
                    fontFamily: AppFonts.interBold,
                    fontSize: 9.5,
                    color: AppColors.emerald600,
                  }}>
                  ${categoryStats.totalRevenue.toFixed(2)}
                </Text>
              </View>
            )}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
                backgroundColor: `${AppColors.brandPurple}14`,
                paddingHorizontal: 6,
                paddingVertical: 2.5,
                borderRadius: 4,
                borderWidth: 1,
                borderColor: `${AppColors.brandPurple}2E`,
              }}>
              <TargetGoalIcon color={AppColors.brandPurple} size={10} />
              <Text
                style={{
                  fontFamily: AppFonts.interBold,
                  fontSize: 9.5,
                  color: AppColors.brandPurple,
                }}>
                Live Telemetry
              </Text>
            </View>
          </View>
        </View>

        {/* GA4 Stacked Realtime Histogram Bar Graph */}
        <View
          style={{
            height: chartHeight,
            flexDirection: 'row',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            paddingHorizontal: 2,
            paddingBottom: 2,
            borderBottomWidth: 1,
            borderBottomColor: AppColors.dividerColor,
          }}>
          {histogramBars.map(bar => (
            <View
              key={bar.index}
              style={{
                flex: 1,
                alignItems: 'center',
                justifyContent: 'flex-end',
                height: '100%',
                marginHorizontal: 1.5,
              }}>
              {bar.total > 0 && (
                <Text
                  style={{
                    fontFamily: AppFonts.interBold,
                    fontSize: 7.5,
                    color: bar.isLatest
                      ? AppColors.brandPurple
                      : AppColors.grayTextWeak,
                    marginBottom: 2,
                  }}>
                  {bar.total}
                </Text>
              )}
              {/* Stacked Category Segments Column */}
              <View
                style={{
                  width: '100%',
                  maxWidth: 15,
                  height: bar.totalHeight,
                  borderRadius: 3,
                  overflow: 'hidden',
                  backgroundColor:
                    bar.total > 0
                      ? `${AppColors.grayBorderSecondary}40`
                      : `${AppColors.grayBorderSecondary}40`,
                }}>
                {bar.total > 0 ? (
                  <>
                    {bar.ecomHeight > 0 && (
                      <View
                        style={{
                          height: bar.ecomHeight,
                          backgroundColor: AppColors.amber500,
                        }}
                      />
                    )}
                    {bar.screenHeight > 0 && (
                      <View
                        style={{
                          height: bar.screenHeight,
                          backgroundColor: AppColors.sky500,
                        }}
                      />
                    )}
                    {bar.sysHeight > 0 && (
                      <View
                        style={{
                          height: bar.sysHeight,
                          backgroundColor: AppColors.purple,
                        }}
                      />
                    )}
                    {bar.custHeight > 0 && (
                      <View
                        style={{
                          height: bar.custHeight,
                          backgroundColor: AppColors.brandPurple,
                        }}
                      />
                    )}
                  </>
                ) : (
                  <View
                    style={{
                      height: 2.5,
                      backgroundColor: `${AppColors.grayBorderSecondary}80`,
                    }}
                  />
                )}
              </View>
            </View>
          ))}
        </View>

        {/* Timeline Axis Labels */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginTop: 4,
            paddingHorizontal: 2,
          }}>
          <Text
            style={{
              fontFamily: AppFonts.interMedium,
              fontSize: 8,
              color: AppColors.grayTextWeak,
            }}>
            -30 min
          </Text>
          <Text
            style={{
              fontFamily: AppFonts.interMedium,
              fontSize: 8,
              color: AppColors.grayTextWeak,
            }}>
            -20 min
          </Text>
          <Text
            style={{
              fontFamily: AppFonts.interMedium,
              fontSize: 8,
              color: AppColors.grayTextWeak,
            }}>
            -10 min
          </Text>
          <Text
            style={{
              fontFamily: AppFonts.interBold,
              fontSize: 8,
              color: AppColors.brandPurple,
            }}>
            NOW
          </Text>
        </View>
      </View>

      {/* ── Category Breakdown Distribution Bar & Interactive Filter Buttons ─ */}
      <View style={{marginTop: 2, marginBottom: 4}}>
        {/* Multi-color Proportional Segmented Bar */}
        <View
          style={{
            height: 5,
            borderRadius: 2.5,
            backgroundColor: `${AppColors.grayBorderSecondary}40`,
            flexDirection: 'row',
            overflow: 'hidden',
            marginBottom: 8,
          }}>
          {categoryStats.ecommerce > 0 && (
            <View
              style={{
                flex: categoryStats.ecommerce,
                backgroundColor: AppColors.amber500,
              }}
            />
          )}
          {categoryStats.page_view > 0 && (
            <View
              style={{
                flex: categoryStats.page_view,
                backgroundColor: AppColors.sky500,
              }}
            />
          )}
          {categoryStats.system > 0 && (
            <View
              style={{
                flex: categoryStats.system,
                backgroundColor: AppColors.purple,
              }}
            />
          )}
          {categoryStats.custom > 0 && (
            <View
              style={{
                flex: categoryStats.custom,
                backgroundColor: AppColors.brandPurple,
              }}
            />
          )}
        </View>

        {/* 4 Interactive Category Filter Buttons */}
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 6,
          }}>
          {/* Ecommerce Button */}
          {(() => {
            const isSelected =
              !analyticsFilters.categories.has('all') &&
              analyticsFilters.categories.has('ecommerce');
            return (
              <TouchableScale
                onPress={() => toggleCategoryFilter('ecommerce')}
                style={[
                  {
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4.5,
                    backgroundColor: isSelected
                      ? AppColors.amber500
                      : `${AppColors.amber500}14`,
                    paddingHorizontal: 7,
                    paddingVertical: 4.5,
                    borderRadius: 6,
                    borderWidth: 1,
                    borderColor: isSelected
                      ? AppColors.amber500
                      : `${AppColors.amber500}35`,
                  },
                  isSelected && {
                    shadowColor: AppColors.amber500,
                    shadowOffset: {width: 0, height: 1},
                    shadowOpacity: 0.25,
                    shadowRadius: 2,
                    elevation: 2,
                  },
                ]}>
                <CartIcon
                  color={isSelected ? AppColors.white : AppColors.amber700}
                  size={11}
                />
                <Text
                  style={{
                    fontFamily: AppFonts.interBold,
                    fontSize: 10,
                    color: isSelected ? AppColors.white : AppColors.amber700,
                  }}>
                  Ecommerce: {categoryStats.ecommerce} ({categoryStats.ecommercePct}%)
                </Text>
              </TouchableScale>
            );
          })()}

          {/* Screens Button */}
          {(() => {
            const isSelected =
              !analyticsFilters.categories.has('all') &&
              analyticsFilters.categories.has('page_view');
            return (
              <TouchableScale
                onPress={() => toggleCategoryFilter('page_view')}
                style={[
                  {
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4.5,
                    backgroundColor: isSelected
                      ? AppColors.sky600
                      : `${AppColors.sky500}14`,
                    paddingHorizontal: 7,
                    paddingVertical: 4.5,
                    borderRadius: 6,
                    borderWidth: 1,
                    borderColor: isSelected
                      ? AppColors.sky600
                      : `${AppColors.sky500}35`,
                  },
                  isSelected && {
                    shadowColor: AppColors.sky600,
                    shadowOffset: {width: 0, height: 1},
                    shadowOpacity: 0.25,
                    shadowRadius: 2,
                    elevation: 2,
                  },
                ]}>
                <GlobeIcon
                  color={isSelected ? AppColors.white : AppColors.sky600}
                  size={11}
                />
                <Text
                  style={{
                    fontFamily: AppFonts.interBold,
                    fontSize: 10,
                    color: isSelected ? AppColors.white : AppColors.sky600,
                  }}>
                  Screens: {categoryStats.page_view} ({categoryStats.page_viewPct}%)
                </Text>
              </TouchableScale>
            );
          })()}

          {/* System Button */}
          {(() => {
            const isSelected =
              !analyticsFilters.categories.has('all') &&
              analyticsFilters.categories.has('system');
            return (
              <TouchableScale
                onPress={() => toggleCategoryFilter('system')}
                style={[
                  {
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4.5,
                    backgroundColor: isSelected
                      ? AppColors.purple
                      : `${AppColors.purple}14`,
                    paddingHorizontal: 7,
                    paddingVertical: 4.5,
                    borderRadius: 6,
                    borderWidth: 1,
                    borderColor: isSelected
                      ? AppColors.purple
                      : `${AppColors.purple}35`,
                  },
                  isSelected && {
                    shadowColor: AppColors.purple,
                    shadowOffset: {width: 0, height: 1},
                    shadowOpacity: 0.25,
                    shadowRadius: 2,
                    elevation: 2,
                  },
                ]}>
                <BoltIcon
                  color={isSelected ? AppColors.white : AppColors.purple}
                  size={11}
                />
                <Text
                  style={{
                    fontFamily: AppFonts.interBold,
                    fontSize: 10,
                    color: isSelected ? AppColors.white : AppColors.purple,
                  }}>
                  System: {categoryStats.system} ({categoryStats.systemPct}%)
                </Text>
              </TouchableScale>
            );
          })()}

          {/* Custom Button */}
          {(() => {
            const isSelected =
              !analyticsFilters.categories.has('all') &&
              analyticsFilters.categories.has('custom');
            return (
              <TouchableScale
                onPress={() => toggleCategoryFilter('custom')}
                style={[
                  {
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4.5,
                    backgroundColor: isSelected
                      ? AppColors.brandPurple
                      : `${AppColors.brandPurple}14`,
                    paddingHorizontal: 7,
                    paddingVertical: 4.5,
                    borderRadius: 6,
                    borderWidth: 1,
                    borderColor: isSelected
                      ? AppColors.brandPurple
                      : `${AppColors.brandPurple}35`,
                  },
                  isSelected && {
                    shadowColor: AppColors.brandPurple,
                    shadowOffset: {width: 0, height: 1},
                    shadowOpacity: 0.25,
                    shadowRadius: 2,
                    elevation: 2,
                  },
                ]}>
                <SparkleIcon
                  color={isSelected ? AppColors.white : AppColors.brandPurple}
                  size={11}
                />
                <Text
                  style={{
                    fontFamily: AppFonts.interBold,
                    fontSize: 10,
                    color: isSelected ? AppColors.white : AppColors.brandPurple,
                  }}>
                  Custom: {categoryStats.custom} ({categoryStats.customPct}%)
                </Text>
              </TouchableScale>
            );
          })()}
        </View>
      </View>

      {/* ── Top Screens / Views Mini Leaderboard (GA4 Realtime Overview) ──── */}
      {topScreens.length > 0 && (
        <View
          style={{
            marginTop: 8,
            backgroundColor: `${AppColors.sky500}0A`,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: `${AppColors.sky500}22`,
            padding: 8,
          }}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 6,
            }}>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 4}}>
              <PinIcon color={AppColors.sky600} size={11} />
              <Text
                style={{
                  fontFamily: AppFonts.interBold,
                  fontSize: 9.5,
                  color: AppColors.sky600,
                  letterSpacing: 0.3,
                }}>
                TOP SCREENS (REALTIME)
              </Text>
            </View>
            <Text
              style={{
                fontFamily: AppFonts.interMedium,
                fontSize: 9,
                color: AppColors.grayTextWeak,
              }}>
              Views
            </Text>
          </View>

          <View style={{gap: 4}}>
            {topScreens.map(scr => (
              <View key={scr.name}>
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 2,
                  }}>
                  <Text
                    style={{
                      fontFamily: AppFonts.interMedium,
                      fontSize: 10,
                      color: AppColors.primaryBlack,
                    }}
                    numberOfLines={1}>
                    {scr.name}
                  </Text>
                  <Text
                    style={{
                      fontFamily: AppFonts.interBold,
                      fontSize: 9.5,
                      color: AppColors.sky600,
                    }}>
                    {scr.count} ({scr.pct}%)
                  </Text>
                </View>
                {/* Mini Horizontal Progress Meter */}
                <View
                  style={{
                    height: 3,
                    borderRadius: 1.5,
                    backgroundColor: `${AppColors.sky500}22`,
                    overflow: 'hidden',
                  }}>
                  <View
                    style={{
                      height: '100%',
                      width: `${scr.barWidthPct}%`,
                      backgroundColor: AppColors.sky500,
                    }}
                  />
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* ── Expandable User Properties & Default Parameters ───────────────── */}
      {analyticsHeaderExpanded && (
        <>
          {/* Stats Row */}
          <View style={styles.analyticsStatsRow}>
            <View style={styles.analyticsStatBox}>
              <Text style={styles.analyticsStatValue}>{totalEvents}</Text>
              <Text style={styles.analyticsStatLabel}>Events</Text>
            </View>
            <View style={styles.analyticsStatBox}>
              <Text style={styles.analyticsStatValue}>
                {Object.keys(userProperties).length}
              </Text>
              <Text style={styles.analyticsStatLabel}>User Props</Text>
            </View>
            <View style={styles.analyticsStatBox}>
              <Text style={styles.analyticsStatValue}>
                {Object.keys(defaultParams).length}
              </Text>
              <Text style={styles.analyticsStatLabel}>Defaults</Text>
            </View>
          </View>

          {/* Details Section */}
          {(hasUserProps || hasDefaultParams) && (
            <View style={styles.analyticsHeaderDetails}>
              {hasUserProps && (
                <View style={{marginBottom: 10}}>
                  <Text style={styles.detailsGroupTitle}>Active User Properties</Text>
                  {Object.entries(userProperties).map(([k, v]) => (
                    <View key={k} style={styles.detailsRow}>
                      <Text style={styles.detailsKey} selectable={true}>{k}</Text>
                      <Text style={styles.detailsValue} selectable={true}>{String(v)}</Text>
                    </View>
                  ))}
                </View>
              )}

              {hasDefaultParams && (
                <View>
                  <Text style={styles.detailsGroupTitle}>Default Event Parameters</Text>
                  {Object.entries(defaultParams).map(([k, v]) => (
                    <View key={k} style={styles.detailsRow}>
                      <Text style={styles.detailsKey} selectable={true}>{k}</Text>
                      <Text style={styles.detailsValue} selectable={true}>{String(v)}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}
        </>
      )}
    </View>
  );
});

const AnalyticsTab = React.memo(() => {
  const {
    filteredAnalyticsEvents,
    analyticsSearch,
    setAnalyticsSearch,
    handleDelete,
    selectedEvent,
    setSelectedEvent,
    newEventIds,
    logRouteMapRef,
    isAnalyticsLayoutReady,
    setIsAnalyticsLayoutReady,
    isAnalyticsPaused,
    setIsAnalyticsPaused,
    isAnalyticsFilterApplied,
  } = useInspector();

  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  const keyExtractor = useCallback(
    (item: any, index: number) => item?.id?.toString() ?? index.toString(),
    [],
  );

  const renderItem = useCallback(
    ({item, index}: {item: any; index: number}) => {
      const prev = filteredAnalyticsEvents[index + 1];
      const next = filteredAnalyticsEvents[index - 1];
      const msSincePrev = prev
        ? item.timestamp - prev.timestamp
        : undefined;
      const thisMin = Math.floor(item.timestamp / 60000);
      const nextMin = next
        ? Math.floor(next.timestamp / 60000)
        : -1;
      const showTimestamp =
        index === 0 || thisMin !== nextMin;
      return (
        <AnalyticsEventCard
          event={item}
          onPress={() => {
            animateNextLayout();
            setSelectedEvent(item);
          }}
          isNew={newEventIds.has(item.id)}
          searchStr={analyticsSearch}
          isFirst={index === 0}
          isLast={
            index === filteredAnalyticsEvents.length - 1
          }
          msSincePrev={msSincePrev}
          showTimestamp={showTimestamp}
          computedScreenName={(() => {
            if (!item) return '';
            const rawScreenName =
              item.screenName ||
              item.screenClass ||
              item.pageTitle ||
              item.pageLocation ||
              item.params?.firebase_screen ||
              item.params?.screen_name ||
              item.params?.firebase_screen_class ||
              item.params?.screen_class;
            let screenName = typeof rawScreenName === 'string'
              ? rawScreenName
              : (rawScreenName ? JSON.stringify(rawScreenName) : '');
            const routeInfo = logRouteMapRef.current.get(
              item.id + 1000000,
            );
            if (!screenName) {
              if (
                routeInfo &&
                routeInfo.path !== 'Navigators'
              ) {
                const parts = routeInfo.path.split(' ➔ ');
                screenName = parts[parts.length - 1];
              }
            }
            return screenName;
          })()}
        />
      );
    },
    [filteredAnalyticsEvents, analyticsSearch, newEventIds, setSelectedEvent, logRouteMapRef],
  );


  return (
    <>
      {/* ─── Search + Shared Toolbar for Analytics ──────────────────────── */}
      {selectedEvent == null && (
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
            placeholder="Search events..."
            placeholderTextColor={AppColors.grayTextWeak}
            value={analyticsSearch}
            onChangeText={setAnalyticsSearch}
            style={styles.searchInput}
            autoCorrect={false}
            autoCapitalize="none"
          />
          {analyticsSearch.length > 0 && (
            <Pressable
              onPress={() => setAnalyticsSearch('')}
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
          <TouchableOpacity
            style={[
              styles.toolbarBtn,
              isAnalyticsPaused && {
                borderColor: `${AppColors.darkOrange}50`,
                backgroundColor: `${AppColors.darkOrange}18`,
              },
            ]}
            onPress={() => setIsAnalyticsPaused(p => !p)}
            hitSlop={6}>
            <HeaderPauseIcon
              isPaused={isAnalyticsPaused}
              color={
                isAnalyticsPaused
                  ? AppColors.darkOrange
                  : AppColors.grayTextStrong
              }
              size={16}
            />
          </TouchableOpacity>

          {/* GA Dashboard-style Filter Button */}
          <TouchableOpacity
            style={[
              styles.toolbarBtn,
              isAnalyticsFilterApplied && {
                borderColor: `${AppColors.brandPurple}60`,
                backgroundColor: `${AppColors.brandPurple}15`,
              },
            ]}
            onPress={() => setIsFilterModalOpen(true)}
            hitSlop={6}>
            <FilterIcon
              color={
                isAnalyticsFilterApplied
                  ? AppColors.brandPurple
                  : AppColors.grayTextStrong
              }
              size={15}
            />
            {isAnalyticsFilterApplied && (
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
          </TouchableOpacity>

          <TouchableOpacity
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
          </TouchableOpacity>
        </View>
      </View>
      )}

      {/* Filter Modal */}
      <AnalyticsFilterModal
        visible={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
      />

      <View
        style={{flex: 1}}
        onLayout={() => setIsAnalyticsLayoutReady(true)}>
        {selectedEvent != null ? (
          <AnalyticsDetail event={selectedEvent} />
        ) : isAnalyticsLayoutReady ? (
          <FlatList
            data={filteredAnalyticsEvents}
            keyExtractor={keyExtractor}
            ListHeaderComponent={AnalyticsHeader}
            renderItem={renderItem}
            initialNumToRender={20}
            maxToRenderPerBatch={20}
            windowSize={5}
            removeClippedSubviews={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIconWrap}>
                  <EmptyRadarIcon
                    color={AppColors.purple}
                    size={32}
                  />
                </View>
                <Text style={styles.emptyTitle}>
                  {analyticsSearch.length > 0
                    ? 'No matching events'
                    : 'No analytics events yet'}
                </Text>
                <Text style={styles.emptySub}>
                  {analyticsSearch.length > 0
                    ? 'Try adjusting your search.'
                    : 'Call setupAnalyticsLogger(analytics()) at app start.'}
                </Text>
              </View>
            }
            ListFooterComponent={
              filteredAnalyticsEvents.length > 0 ? (
                <EndOfListFooter
                  count={filteredAnalyticsEvents.length}
                  label="events"
                />
              ) : null
            }
            contentContainerStyle={[
              styles.listContent,
              filteredAnalyticsEvents.length === 0 && {
                flexGrow: 1,
              },
            ]}
            keyboardShouldPersistTaps="handled"
          />
        ) : null}
      </View>
    </>
  );
});

export default AnalyticsTab;
