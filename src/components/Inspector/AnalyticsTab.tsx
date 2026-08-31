import React, {useCallback, useState, useMemo, useEffect} from 'react';
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
import AnalyticsFilterModal from './AnalyticsFilterModal';
import EndOfListFooter from '../EndOfListFooter';
import EmptyState from '../EmptyState';
import styles from '../../styles';
import {AppColors} from '../../styles/AppColors';
import {AppFonts} from '../../styles/AppFonts';
import {useTranslation} from '../../i18n';
import Svg, {
  Path,
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
  LayersIcon,
  CheckIcon,
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
  const {t} = useTranslation();
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

  // If there are no analytics events in the session, hide the graph, category breakdown, and realtime card
  if (analyticsEvents.length === 0) {
    return null;
  }

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

  // Multi-select category toggle from top button group
  const toggleCategoryFilter = (cat: string) => {
    animateNextLayout();
    setAnalyticsFilters(prev => {
      if (cat === 'all') {
        return {...prev, categories: new Set(['all'])};
      }

      const nextCategories = new Set(prev.categories);
      if (nextCategories.has('all')) {
        nextCategories.delete('all');
        nextCategories.add(cat);
      } else {
        if (nextCategories.has(cat)) {
          nextCategories.delete(cat);
          if (nextCategories.size === 0) {
            nextCategories.add('all');
          }
        } else {
          nextCategories.add(cat);
          if (
            nextCategories.has('ecommerce') &&
            nextCategories.has('page_view') &&
            nextCategories.has('system') &&
            nextCategories.has('custom')
          ) {
            return {...prev, categories: new Set(['all'])};
          }
        }
      }

      return {...prev, categories: nextCategories};
    });
  };

  // 12-Bucket GA4 Realtime Stacked Histogram & Spline Wave Graph (60s live rolling stream)
  const BUCKET_COUNT = 12;
  const chartHeight = 64;
  const svgWidth = 320;
  const [selectedBucketIdx, setSelectedBucketIdx] = useState<number | null>(null);
  const [liveTick, setLiveTick] = useState<number>(0);

  useEffect(() => {
    if (!isTrackingEnabled) return;
    const interval = setInterval(() => {
      setLiveTick(t => (t + 1) % 100000);
    }, 1000);
    return () => clearInterval(interval);
  }, [isTrackingEnabled]);

  const histogramData = useMemo(() => {
    const buckets: {
      index: number;
      ecommerce: number;
      page_view: number;
      system: number;
      custom: number;
      total: number;
      x: number;
      y: number;
      isLatest: boolean;
      ageLabel: string;
    }[] = [];

    const now = Date.now();
    const windowMs = 60000; // 60s live rolling window
    const bucketDuration = windowMs / BUCKET_COUNT; // 5s per bucket

    for (let i = 0; i < BUCKET_COUNT; i++) {
      const bucketAgeSec = Math.round(((BUCKET_COUNT - 1 - i) * bucketDuration) / 1000);
      buckets.push({
        index: i,
        ecommerce: 0,
        page_view: 0,
        system: 0,
        custom: 0,
        total: 0,
        x: (i / (BUCKET_COUNT - 1)) * (svgWidth - 24) + 12,
        y: chartHeight - 12,
        isLatest: i === BUCKET_COUNT - 1,
        ageLabel: i === BUCKET_COUNT - 1 ? t('analytics.timeNow') : `-${bucketAgeSec}s`,
      });
    }

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
    buckets.forEach(b => {
      const normalizedH = (b.total / maxVal) * (chartHeight - 22);
      b.y = chartHeight - 10 - normalizedH;
    });

    // Generate Cubic Bézier Spline paths
    let linePath = `M ${buckets[0].x.toFixed(1)} ${buckets[0].y.toFixed(1)}`;
    for (let i = 0; i < buckets.length - 1; i++) {
      const p0 = buckets[Math.max(0, i - 1)];
      const p1 = buckets[i];
      const p2 = buckets[i + 1];
      const p3 = buckets[Math.min(buckets.length - 1, i + 2)];

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      linePath += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
    }

    const lastB = buckets[buckets.length - 1];
    const firstB = buckets[0];
    const areaPath = `${linePath} L ${lastB.x.toFixed(1)} ${chartHeight - 4} L ${firstB.x.toFixed(1)} ${chartHeight - 4} Z`;

    const peakVal = Math.max(...buckets.map(b => b.total), 0);
    const eventRate = Math.round(buckets.reduce((a, b) => a + b.total, 0));

    return {
      buckets,
      linePath,
      areaPath,
      peakVal,
      eventRate,
    };
  }, [filteredAnalyticsEvents, chartHeight, svgWidth, liveTick, t]);

  const selectedBucket = selectedBucketIdx != null ? histogramData.buckets[selectedBucketIdx] : null;

  return (
    <View style={styles.analyticsHeaderCard}>
      {/* ── 1. Top Header Row (GA4 Style) ─────────────────────────────────── */}
      <View style={styles.analyticsHeaderTop}>
        <View style={{flex: 1}}>
          <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
            <Text style={styles.analyticsHeaderTitle}>{t('analytics.realtimeStream')}</Text>
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
              {isTrackingEnabled ? t('performance.live') : t('common.pause')}
            </Text>
          </View>
          <Text style={styles.analyticsHeaderSubtitle} numberOfLines={1}>
            {userId ? `${t('analytics.userId')}: ${userId}` : t('analytics.emptySubtitle')}
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
            {analyticsHeaderExpanded ? t('common.close') : t('analytics.eventDetails')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── 2. Multi-Select Category Filter Buttons (AT THE TOP) ──────────── */}
      <View style={{marginTop: 10, marginBottom: 8}}>
        {/* Multi-color Proportional Segmented Bar */}
        <View
          style={{
            height: 4.5,
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

        {/* Multi-Select Category Buttons */}
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 6,
          }}>
          {/* All Button */}
          {(() => {
            const isAllSelected = analyticsFilters.categories.has('all');
            return (
              <TouchableScale
                onPress={() => toggleCategoryFilter('all')}
                style={[
                  {
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 5,
                    backgroundColor: isAllSelected ? AppColors.indigo600Alt : AppColors.indigo50,
                    paddingHorizontal: 8,
                    paddingVertical: 5,
                    borderRadius: 7,
                    borderWidth: 1,
                    borderColor: isAllSelected ? AppColors.indigo600 : AppColors.indigo400,
                  },
                  isAllSelected && {
                    shadowColor: AppColors.indigo600Alt,
                    shadowOffset: {width: 0, height: 1},
                    shadowOpacity: 0.28,
                    shadowRadius: 2.5,
                    elevation: 2,
                  },
                ]}>
                <LayersIcon
                  color={isAllSelected ? AppColors.white : AppColors.indigo600Alt}
                  size={11}
                />
                <Text
                  style={{
                    fontFamily: AppFonts.interBold,
                    fontSize: 10,
                    color: isAllSelected ? AppColors.white : AppColors.indigo600Alt,
                  }}>
                  {t('analytics.allCategory')}: {categoryStats.totalCount}
                </Text>
              </TouchableScale>
            );
          })()}

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
                    gap: 5,
                    backgroundColor: isSelected ? AppColors.amber600 : AppColors.amber100,
                    paddingHorizontal: 8,
                    paddingVertical: 5,
                    borderRadius: 7,
                    borderWidth: 1,
                    borderColor: isSelected ? AppColors.amber700 : AppColors.amber200,
                  },
                  isSelected && {
                    shadowColor: AppColors.amber600,
                    shadowOffset: {width: 0, height: 1},
                    shadowOpacity: 0.28,
                    shadowRadius: 2.5,
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
                    color: isSelected ? AppColors.white : AppColors.amber800Warm,
                  }}>
                  {t('analytics.ecommerceCategory')}: {categoryStats.ecommerce} ({categoryStats.ecommercePct}%)
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
                    gap: 5,
                    backgroundColor: isSelected ? AppColors.sky600 : AppColors.sky100,
                    paddingHorizontal: 8,
                    paddingVertical: 5,
                    borderRadius: 7,
                    borderWidth: 1,
                    borderColor: isSelected ? AppColors.blue700 : AppColors.sky400,
                  },
                  isSelected && {
                    shadowColor: AppColors.sky600,
                    shadowOffset: {width: 0, height: 1},
                    shadowOpacity: 0.28,
                    shadowRadius: 2.5,
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
                  {t('analytics.screensCategory')}: {categoryStats.page_view} ({categoryStats.page_viewPct}%)
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
                    gap: 5,
                    backgroundColor: isSelected ? AppColors.violet600 : AppColors.purple100,
                    paddingHorizontal: 8,
                    paddingVertical: 5,
                    borderRadius: 7,
                    borderWidth: 1,
                    borderColor: isSelected ? AppColors.purpleShade700 : AppColors.purple200,
                  },
                  isSelected && {
                    shadowColor: AppColors.violet600,
                    shadowOffset: {width: 0, height: 1},
                    shadowOpacity: 0.28,
                    shadowRadius: 2.5,
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
                    color: isSelected ? AppColors.white : AppColors.brandPurple,
                  }}>
                  {t('analytics.systemCategory')}: {categoryStats.system} ({categoryStats.systemPct}%)
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
                    gap: 5,
                    backgroundColor: isSelected ? AppColors.pink600 : AppColors.pink100,
                    paddingHorizontal: 8,
                    paddingVertical: 5,
                    borderRadius: 7,
                    borderWidth: 1,
                    borderColor: isSelected ? AppColors.rose700 : AppColors.roseBorder,
                  },
                  isSelected && {
                    shadowColor: AppColors.pink600,
                    shadowOffset: {width: 0, height: 1},
                    shadowOpacity: 0.28,
                    shadowRadius: 2.5,
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
                    color: isSelected ? AppColors.white : AppColors.pink600,
                  }}>
                  {t('analytics.customCategory')}: {categoryStats.custom} ({categoryStats.customPct}%)
                </Text>
              </TouchableScale>
            );
          })()}
        </View>
      </View>

      {/* ── 3. GA4 Realtime Metric Hero & Activity Chart (UNDER CATEGORIES) ─ */}
      <View
        style={{
          marginTop: 2,
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
            marginBottom: 6,
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
                {t('analytics.eventsInWindow')}
              </Text>
            </View>
          </View>

          {/* Realtime Rate Badges */}
          <View style={{flexDirection: 'row', alignItems: 'center', gap: 5}}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 3,
                backgroundColor: `${AppColors.purple}14`,
                paddingHorizontal: 6,
                paddingVertical: 2.5,
                borderRadius: 4,
                borderWidth: 1,
                borderColor: `${AppColors.purple}2E`,
              }}>
              <Text
                style={{
                  fontFamily: AppFonts.interBold,
                  fontSize: 9.5,
                  color: AppColors.purple,
                }}>
                {t('analytics.eventVelocity', {rate: histogramData.eventRate})}
              </Text>
            </View>

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
          </View>
        </View>

        {/* ── Crashlytics-Style Multi-Bar Histogram with Trendline Overlay ── */}
        <View style={{height: chartHeight, position: 'relative', overflow: 'hidden', borderRadius: 8}}>
          <Svg width="100%" height={chartHeight} viewBox={`0 0 ${svgWidth} ${chartHeight}`} preserveAspectRatio="none">
            <Defs>
              <SvgLinearGradient id="crashlyticsBarGrad" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.9" />
                <Stop offset="100%" stopColor="#6366F1" stopOpacity="0.6" />
              </SvgLinearGradient>
              <SvgLinearGradient id="crashlyticsAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.25" />
                <Stop offset="80%" stopColor="#8B5CF6" stopOpacity="0.04" />
                <Stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.0" />
              </SvgLinearGradient>
            </Defs>

            {/* Subtle Grid Guidelines */}
            <Line
              x1="6"
              y1={chartHeight - 6}
              x2={svgWidth - 6}
              y2={chartHeight - 6}
              stroke="#E2E8F0"
              strokeWidth="1"
            />
            <Line
              x1="6"
              y1={chartHeight / 2}
              x2={svgWidth - 6}
              y2={chartHeight / 2}
              stroke="#F1F5F9"
              strokeWidth="1"
              strokeDasharray="4,4"
            />

            {/* Glowing Area Underlay */}
            <Path d={histogramData.areaPath} fill="url(#crashlyticsAreaGrad)" />

            {/* Vertical Crashlytics Histogram Bars */}
            {histogramData.buckets.map((b, idx) => {
              const isSelected = selectedBucketIdx === idx;
              const barWidth = 10;
              const barX = b.x - barWidth / 2;
              const barHeight = Math.max(3, chartHeight - 8 - b.y);
              const barY = chartHeight - 8 - barHeight;

              return (
                <G key={`bar-${b.index}`}>
                  {/* Background slot */}
                  <Rect
                    x={barX}
                    y={6}
                    width={barWidth}
                    height={chartHeight - 14}
                    rx={3}
                    fill={isSelected ? '#EDE9FE' : '#F8FAFC'}
                  />

                  {/* Active Event Bar */}
                  {b.total > 0 && (
                    <Rect
                      x={barX}
                      y={barY}
                      width={barWidth}
                      height={barHeight}
                      rx={3}
                      fill="url(#crashlyticsBarGrad)"
                    />
                  )}

                  {/* Selected Cursor Line */}
                  {isSelected && (
                    <Line
                      x1={b.x}
                      y1={4}
                      x2={b.x}
                      y2={chartHeight - 6}
                      stroke="#8B5CF6"
                      strokeWidth="1.5"
                      strokeDasharray="2,2"
                    />
                  )}
                </G>
              );
            })}

            {/* Crashlytics Apex Trendline */}
            <Path
              d={histogramData.linePath}
              fill="none"
              stroke="#8B5CF6"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Pulsing Dot on Current Active Time Bucket */}
            {histogramData.buckets.length > 0 && (
              <G>
                <Circle
                  cx={histogramData.buckets[histogramData.buckets.length - 1].x}
                  cy={histogramData.buckets[histogramData.buckets.length - 1].y}
                  r="5.5"
                  fill="#8B5CF6"
                  opacity="0.25"
                />
                <Circle
                  cx={histogramData.buckets[histogramData.buckets.length - 1].x}
                  cy={histogramData.buckets[histogramData.buckets.length - 1].y}
                  r="3"
                  fill="#7C3AED"
                />
              </G>
            )}
          </Svg>

          {/* Invisible Touch Columns for Interactive Bucket Selection */}
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              flexDirection: 'row',
            }}>
            {histogramData.buckets.map((b, idx) => (
              <TouchableOpacity
                key={b.index}
                style={{flex: 1, height: '100%'}}
                activeOpacity={0.8}
                onPress={() => setSelectedBucketIdx(selectedBucketIdx === idx ? null : idx)}
              />
            ))}
          </View>
        </View>

        {/* Selected Bucket Quick Breakdown Overlay */}
        {selectedBucket && (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: AppColors.white,
              borderRadius: 6,
              paddingHorizontal: 8,
              paddingVertical: 4,
              marginTop: 4,
              borderWidth: 1,
              borderColor: AppColors.brandPurple,
            }}>
            <Text
              style={{
                fontFamily: AppFonts.interBold,
                fontSize: 10,
                color: AppColors.primaryBlack,
              }}>
              {t('analytics.selectedBucket', {
                time: selectedBucket.ageLabel,
                count: selectedBucket.total,
              })}
            </Text>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
              {selectedBucket.ecommerce > 0 && (
                <Text style={{fontSize: 9, fontFamily: AppFonts.interBold, color: AppColors.amber700}}>
                  Ecom: {selectedBucket.ecommerce}
                </Text>
              )}
              {selectedBucket.page_view > 0 && (
                <Text style={{fontSize: 9, fontFamily: AppFonts.interBold, color: AppColors.sky500}}>
                  Screen: {selectedBucket.page_view}
                </Text>
              )}
              {selectedBucket.custom > 0 && (
                <Text style={{fontSize: 9, fontFamily: AppFonts.interBold, color: AppColors.brandPurple}}>
                  Custom: {selectedBucket.custom}
                </Text>
              )}
            </View>
          </View>
        )}

        {/* Timeline Axis Labels (60s Realtime Rolling Stream) */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginTop: 4,
            paddingHorizontal: 4,
          }}>
          <Text
            style={{
              fontFamily: AppFonts.interMedium,
              fontSize: 8.5,
              color: AppColors.grayTextWeak,
            }}>
            -60s
          </Text>
          <Text
            style={{
              fontFamily: AppFonts.interMedium,
              fontSize: 8.5,
              color: AppColors.grayTextWeak,
            }}>
            -40s
          </Text>
          <Text
            style={{
              fontFamily: AppFonts.interMedium,
              fontSize: 8.5,
              color: AppColors.grayTextWeak,
            }}>
            -20s
          </Text>
          <Text
            style={{
              fontFamily: AppFonts.interBold,
              fontSize: 8.5,
              color: AppColors.brandPurple,
            }}>
            {t('analytics.timeNow')}
          </Text>
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
              <Text style={styles.analyticsStatLabel}>{t('analytics.eventCount', {count: totalEvents})}</Text>
            </View>
            <View style={styles.analyticsStatBox}>
              <Text style={styles.analyticsStatValue}>
                {Object.keys(userProperties).length}
              </Text>
              <Text style={styles.analyticsStatLabel}>{t('analytics.props')}</Text>
            </View>
            <View style={styles.analyticsStatBox}>
              <Text style={styles.analyticsStatValue}>
                {Object.keys(defaultParams).length}
              </Text>
              <Text style={styles.analyticsStatLabel}>{t('analytics.defaultParameters')}</Text>
            </View>
          </View>

          {/* Details Section */}
          {(hasUserProps || hasDefaultParams) && (
            <View style={styles.analyticsHeaderDetails}>
              {hasUserProps && (
                <View style={{marginBottom: 10}}>
                  <Text style={styles.detailsGroupTitle}>{t('analytics.userProperties')}</Text>
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
                  <Text style={styles.detailsGroupTitle}>{t('analytics.defaultParameters')}</Text>
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
  const {t} = useTranslation();
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
                  paddingVertical: 1.5,
                }}>
                <Text
                  style={{
                    color: AppColors.purple,
                    fontSize: 9.5,
                    fontFamily: AppFonts.interBold,
                  }}>
                  {filteredAnalyticsEvents.length}
                </Text>
              </View>
              <Pressable
                onPress={() => setAnalyticsSearch('')}
                hitSlop={10}
                style={styles.clearBtn}>
                <ClearIcon
                  color={AppColors.grayTextWeak}
                  size={13}
                />
              </Pressable>
            </View>
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
        {isAnalyticsLayoutReady ? (
          <FlatList
            data={filteredAnalyticsEvents}
            keyExtractor={keyExtractor}
            ListHeaderComponent={AnalyticsHeader}
            renderItem={renderItem}
            initialNumToRender={12}
            maxToRenderPerBatch={8}
            windowSize={5}
            removeClippedSubviews={true}
            renderToHardwareTextureAndroid={true}
            ListEmptyComponent={
              <EmptyState
                isSearch={analyticsSearch.length > 0}
                searchQuery={analyticsSearch}
                customTitle={
                  analyticsSearch.length > 0
                    ? 'No matching analytics events'
                    : 'No analytics events yet'
                }
                customSub={
                  analyticsSearch.length > 0
                    ? `No events matched "${analyticsSearch}"`
                    : 'Call setupAnalyticsLogger(analytics()) at app start.'
                }
                onClearSearch={() => setAnalyticsSearch('')}
              />
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
