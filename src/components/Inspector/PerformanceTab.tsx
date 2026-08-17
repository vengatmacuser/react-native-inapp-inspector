import React, {useState, useEffect, useMemo, useRef} from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import TouchableScale from '../TouchableScale';
import CopyButton from '../CopyButton';
import HighlightText from '../HighlightText';
import EndOfListFooter from '../EndOfListFooter';
import {AppColors} from '../../styles/AppColors';
import {AppFonts} from '../../styles/AppFonts';
import {useTranslation} from '../../i18n';
import {getRuntimeDiagnostics} from '../../helpers';
import {
  SearchIcon,
  CircleXIcon,
  PerformanceIcon,
  BoltIcon,
  LightbulbIcon,
  WarningTriangleIcon,
  MapIcon,
  AtomIcon,
  BrainIcon,
  GlobeIcon,
} from '../NetworkIcons';

export interface PerformanceEvent {
  id: string;
  timestamp: number;
  type: 'fps_drop' | 'slow_render' | 'transition' | 'memory' | 'network' | 'bridge' | 'touch';
  category: 'render' | 'navigation' | 'memory' | 'io' | 'bridge';
  fps: number;
  durationMs: number;
  label: string;
  detail: string;
  source?: string;
  breakdown?: {
    jsTimeMs: number;
    uiTimeMs: number;
    bridgeLatencyMs?: number;
  };
  heapDeltaKb?: number;
  advice?: string;
  severity: 'optimal' | 'warning' | 'critical';
}

const PerformanceTab = React.memo(() => {
  const {t} = useTranslation();
  // ─── Real-Time FPS Tracking ────────────────────────────────────────────────
  const [isRecording, setIsRecording] = useState(true);
  const [currentFps, setCurrentFps] = useState(60);
  const [minFps, setMinFps] = useState(57);
  const [maxFps, setMaxFps] = useState(60);
  const [avgFps, setAvgFps] = useState(59);
  const [totalFrames, setTotalFrames] = useState(4820);
  const [jankyFrameCount, setJankyFrameCount] = useState(4);
  const [jsLagMs, setJsLagMs] = useState(1.2);

  // Expanded Event Card IDs
  const [expandedEventIds, setExpandedEventIds] = useState<Record<string, boolean>>({
    'perf-1': true,
  });

  const toggleEventExpand = (id: string) => {
    setExpandedEventIds(prev => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // FPS history for sparkline
  const [fpsHistory, setFpsHistory] = useState<number[]>([
    60, 59, 60, 60, 58, 60, 59, 60, 60, 60, 57, 60, 59, 60, 60, 58, 60, 60, 59, 60,
  ]);

  // Performance Log Events
  const [events, setEvents] = useState<PerformanceEvent[]>([]);
  const [filterCategory, setFilterCategory] = useState<'ALL' | 'JANKY' | 'NAVIGATION' | 'RENDER' | 'MEMORY' | 'IO'>('ALL');
  const [search, setSearch] = useState('');

  // ─── Live Frame Measurement Loop (1-Second Batch Interval) ────────────────
  const lastFrameTimeRef = useRef<number>(Date.now());
  const rafIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isRecording) return;

    let isMounted = true;
    let frameCount = 0;
    let maxLagInSecond = 0;
    let lastSecond = Date.now();

    const measureFrame = () => {
      if (!isMounted) return;

      const now = Date.now();
      const delta = now - lastFrameTimeRef.current;
      lastFrameTimeRef.current = now;

      // Track peak JS event loop lag during this 1s interval (without triggering re-renders)
      const lag = Math.max(0, delta - 16.67);
      if (lag > maxLagInSecond) {
        maxLagInSecond = lag;
      }

      frameCount++;

      // Update React state ONCE every 1 second (1000ms) to prevent UI shaking/re-rendering
      if (now - lastSecond >= 1000) {
        const elapsed = now - lastSecond;
        const measuredFps = Math.min(60, Math.max(0, Math.round((frameCount * 1000) / elapsed)));

        setCurrentFps(measuredFps);
        setMinFps(prev => Math.min(prev, measuredFps));
        setMaxFps(prev => Math.max(prev, measuredFps));
        setTotalFrames(prev => prev + frameCount);
        setJsLagMs(Number(maxLagInSecond.toFixed(1)));

        if (measuredFps < 55) {
          setJankyFrameCount(prev => prev + 1);
        }

        setFpsHistory(prev => {
          const next = [...prev.slice(-19), measuredFps];
          const sum = next.reduce((a, b) => a + b, 0);
          setAvgFps(Math.round(sum / next.length));
          return next;
        });

        // Trigger log if noticeable frame drop
        if (measuredFps < 50) {
          const durationStr = (1000 / measuredFps).toFixed(1);
          const newEvent: PerformanceEvent = {
            id: `drop-${Date.now()}`,
            timestamp: Date.now(),
            type: 'fps_drop',
            category: 'render',
            fps: measuredFps,
            durationMs: Number(durationStr),
            label: t('performance.liveFpsDip', {fps: measuredFps}),
            detail: t('performance.liveFpsDipDetail', {duration: durationStr}),
            source: t('performance.uiRenderThread'),
            breakdown: {
              jsTimeMs: Number(((1000 / measuredFps) * 0.65).toFixed(1)),
              uiTimeMs: Number(((1000 / measuredFps) * 0.35).toFixed(1)),
            },
            advice: t('performance.liveFpsDipAdvice'),
            severity: measuredFps < 30 ? 'critical' : 'warning',
          };
          setEvents(prev => [newEvent, ...prev.slice(0, 49)]);
        }

        frameCount = 0;
        maxLagInSecond = 0;
        lastSecond = now;
      }

      rafIdRef.current = requestAnimationFrame(measureFrame);
    };

    lastFrameTimeRef.current = Date.now();
    rafIdRef.current = requestAnimationFrame(measureFrame);

    return () => {
      isMounted = false;
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, [isRecording]);

  // Filtered Events
  const filteredEvents = useMemo(() => {
    return events.filter(e => {
      const matchSearch =
        !search ||
        e.label.toLowerCase().includes(search.toLowerCase()) ||
        e.detail.toLowerCase().includes(search.toLowerCase()) ||
        (e.source && e.source.toLowerCase().includes(search.toLowerCase()));

      const matchFilter =
        filterCategory === 'ALL'
          ? true
          : filterCategory === 'JANKY'
          ? e.severity === 'warning' || e.severity === 'critical'
          : filterCategory === 'NAVIGATION'
          ? e.category === 'navigation'
          : filterCategory === 'RENDER'
          ? e.category === 'render'
          : filterCategory === 'MEMORY'
          ? e.category === 'memory'
          : e.category === 'io' || e.category === 'bridge';

      return matchSearch && matchFilter;
    });
  }, [events, search, filterCategory]);

  // Overall Performance Score
  const performanceScore = useMemo(() => {
    if (avgFps >= 58) {
      return {
        score: '98/100',
        grade: t('performance.excellent'),
        color: AppColors.emerald600,
        bg: AppColors.greenBg,
      };
    }
    if (avgFps >= 50) {
      return {
        score: '84/100',
        grade: t('performance.good'),
        color: AppColors.firebaseOrange,
        bg: AppColors.amberBg,
      };
    }
    return {
      score: '58/100',
      grade: t('performance.needsOptimization'),
      color: AppColors.errorColor,
      bg: AppColors.errorCardBg,
    };
  }, [avgFps, t]);

  // ─── Dynamic Runtime Environment & Engine Diagnostics ──────────────────────
  const runtimeDiagnostics = useMemo(() => {
    const raw = getRuntimeDiagnostics();

    const engineNameMap: Record<string, string> = {
      hermes: t('performance.hermesAot'),
      v8: t('performance.v8Jit'),
      jsc: t('performance.jscEngine'),
    };
    const engineSubMap: Record<string, string> = {
      hermes: t('performance.bytecodeCompiled'),
      v8: t('performance.jitEngine'),
      jsc: t('performance.webkitEngine'),
    };
    const archNameMap: Record<string, string> = {
      fabric: t('performance.fabricJsi'),
      paper: t('performance.paperBridge'),
    };
    const archSubMap: Record<string, string> = {
      fabric: t('performance.directCppBindings'),
      paper: t('performance.asyncJsonBridge'),
    };

    return {
      jsEngineName: engineNameMap[raw.engineType],
      jsEngineSub: engineSubMap[raw.engineType],
      uiArchName: archNameMap[raw.archType],
      uiArchSub: archSubMap[raw.archType],
      usedHeapMb: raw.usedHeapMb,
      totalAllocMb: raw.totalAllocMb,
    };
  }, [t]);

  // ─── Dynamic 16.67ms Frame Budget Utilization ─────────────────────────────
  const frameBudgetStats = useMemo(() => {
    const frameDuration = avgFps > 0 ? 1000 / avgFps : 16.67;
    const jsTime = Number(Math.max(1.0, Math.min(frameDuration * 0.45, 2.0 + jsLagMs)).toFixed(1));
    const layoutTime = Number(Math.max(1.0, frameDuration * 0.2).toFixed(1));
    const renderTime = Number(Math.max(1.0, frameDuration * 0.25).toFixed(1));
    const totalUsed = jsTime + layoutTime + renderTime;
    const freeTime = Math.max(0, Number((16.67 - totalUsed).toFixed(1)));
    const headroomPercent = Math.max(0, Math.min(100, Math.round((freeTime / 16.67) * 100)));

    return {
      jsTime,
      layoutTime,
      renderTime,
      freeTime,
      headroomPercent,
    };
  }, [avgFps, jsLagMs]);

  const clearEvents = () => {
    setEvents([]);
  };

  return (
    <View style={perfStyles.container}>
      {/* Search & Live Control Header */}
      <View style={perfStyles.headerBar}>
        <View style={perfStyles.searchBox}>
          <SearchIcon color={AppColors.grayTextWeak} size={15} />
          <TextInput
            placeholder={t('performance.searchPlaceholder')}
            placeholderTextColor={AppColors.grayTextWeak}
            value={search}
            onChangeText={setSearch}
            style={perfStyles.searchInput}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {search ? (
            <TouchableScale onPress={() => setSearch('')}>
              <CircleXIcon color={AppColors.grayTextWeak} size={16} />
            </TouchableScale>
          ) : null}
        </View>

        <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
          <TouchableScale
            onPress={() => setIsRecording(prev => !prev)}
            style={[
              perfStyles.recordBtn,
              isRecording ? perfStyles.recordBtnActive : perfStyles.recordBtnPaused,
            ]}>
            <View
              style={[
                perfStyles.recordDot,
                {backgroundColor: isRecording ? AppColors.emerald500 : AppColors.amber500},
              ]}
            />
            <Text
              style={[
                perfStyles.recordBtnText,
                {color: isRecording ? AppColors.emerald600 : AppColors.amber700},
              ]}>
              {isRecording ? t('performance.live') : t('redux.paused')}
            </Text>
          </TouchableScale>

          <CopyButton
            value={() => ({
              currentFps,
              minFps,
              maxFps,
              avgFps,
              jankyFrameCount,
              jsLagMs,
              platform: Platform.OS,
              engine: runtimeDiagnostics.jsEngineName,
              totalEvents: events.length,
              events,
            })}
            label={t('common.copyJson')}
          />
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={perfStyles.filterRow}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{gap: 6, paddingHorizontal: 12, paddingVertical: 4}}>
          {(
            [
              {key: 'ALL', label: t('performance.allLogs'), Icon: BoltIcon, count: events.length},
              {
                key: 'JANKY',
                label: t('performance.jankySlow'),
                Icon: WarningTriangleIcon,
                count: events.filter(e => e.severity === 'warning' || e.severity === 'critical').length,
              },
              {
                key: 'NAVIGATION',
                label: t('performance.navigation'),
                Icon: MapIcon,
                count: events.filter(e => e.category === 'navigation').length,
              },
              {
                key: 'RENDER',
                label: t('performance.components'),
                Icon: AtomIcon,
                count: events.filter(e => e.category === 'render').length,
              },
              {
                key: 'MEMORY',
                label: t('performance.memoryGc'),
                Icon: BrainIcon,
                count: events.filter(e => e.category === 'memory').length,
              },
              {
                key: 'IO',
                label: t('performance.networkIo'),
                Icon: GlobeIcon,
                count: events.filter(e => e.category === 'io' || e.category === 'bridge').length,
              },
            ] as const
          ).map(tab => {
            const isActive = filterCategory === tab.key;
            return (
              <TouchableScale
                key={tab.key}
                onPress={() => setFilterCategory(tab.key)}
                style={[
                  perfStyles.filterPill,
                  isActive && perfStyles.filterPillActive,
                ]}>
                <tab.Icon color={isActive ? AppColors.white : AppColors.grayTextStrong} size={12} />
                <Text
                  style={[
                    perfStyles.filterPillText,
                    isActive && perfStyles.filterPillTextActive,
                  ]}>
                  {tab.label} ({tab.count})
                </Text>
              </TouchableScale>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        style={{flex: 1}}
        contentContainerStyle={perfStyles.scrollContent}
        keyboardShouldPersistTaps="handled">
        {/* ── 1. REALTIME FPS METRIC DASHBOARD ── */}
        <View style={perfStyles.metricCard}>
          <View style={perfStyles.metricCardHeader}>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
              <PerformanceIcon color={AppColors.purple} size={18} />
              <Text style={perfStyles.metricCardTitle}>{t('performance.liveFps')}</Text>
            </View>
            <View
              style={[
                perfStyles.scorePill,
                {backgroundColor: performanceScore.bg},
              ]}>
              <Text
                style={[
                  perfStyles.scorePillText,
                  {color: performanceScore.color},
                ]}>
                {performanceScore.grade}
              </Text>
            </View>
          </View>

          {/* Primary Gauge Counter */}
          <View style={perfStyles.primaryFpsRow}>
            <View style={perfStyles.fpsBigNumberBox}>
              <Text
                style={[
                  perfStyles.fpsBigNumber,
                  {
                    color:
                      currentFps >= 55
                        ? AppColors.emerald600
                        : currentFps >= 40
                        ? AppColors.firebaseOrange
                        : AppColors.errorColor,
                  },
                ]}>
                {currentFps}
              </Text>
              <Text style={perfStyles.fpsUnit}>{t('performance.fpsUnit')}</Text>
            </View>

            <View style={perfStyles.fpsStatsGrid}>
              <View style={perfStyles.statItem}>
                <Text style={perfStyles.statLabel}>{t('performance.avgFrameTime')}</Text>
                <Text style={perfStyles.statValue}>{avgFps}</Text>
              </View>
              <View style={perfStyles.statItem}>
                <Text style={perfStyles.statLabel}>{t('performance.peakTime')}</Text>
                <Text style={[perfStyles.statValue, minFps < 50 && {color: AppColors.firebaseOrange}]}>
                  {minFps}
                </Text>
              </View>
              <View style={perfStyles.statItem}>
                <Text style={perfStyles.statLabel}>{t('performance.jsLag')}</Text>
                <Text style={[perfStyles.statValue, jsLagMs > 5 && {color: AppColors.firebaseOrange}]}>
                  {jsLagMs}ms
                </Text>
              </View>
              <View style={perfStyles.statItem}>
                <Text style={perfStyles.statLabel}>{t('performance.jankRate')}</Text>
                <Text style={perfStyles.statValue}>
                  {totalFrames > 0
                    ? `${((jankyFrameCount / Math.max(1, totalFrames / 60)) * 100).toFixed(0)}%`
                    : '0%'}
                </Text>
              </View>
            </View>
          </View>

          {/* Sparkline Bar Graph */}
          <View style={perfStyles.sparklineTrack}>
            {fpsHistory.map((fpsVal, idx) => {
              const barHeight = Math.max(6, (fpsVal / 60) * 36);
              const isLow = fpsVal < 50;
              return (
                <View key={idx} style={perfStyles.sparklineCol}>
                  <View
                    style={[
                      perfStyles.sparklineBar,
                      {
                        height: barHeight,
                        backgroundColor: isLow ? AppColors.errorColor : AppColors.emerald500,
                      },
                    ]}
                  />
                </View>
              );
            })}
          </View>
          <View style={perfStyles.sparklineFooter}>
            <Text style={perfStyles.sparklineFooterText}>{t('performance.realtimeWindow')}</Text>
            <Text style={perfStyles.sparklineFooterTarget}>{t('performance.fpsTarget')}</Text>
          </View>
        </View>

        {/* ── 2. FRAME BUDGET BREAKDOWN CARD ── */}
        <View style={perfStyles.budgetCard}>
          <View style={perfStyles.budgetHeader}>
            <Text style={perfStyles.budgetTitle}>{t('performance.budgetUsage')}</Text>
            <Text style={perfStyles.budgetHeadroom}>
              {t('performance.budgetHeadroom', {
                time: frameBudgetStats.freeTime,
                percent: frameBudgetStats.headroomPercent,
              })}
            </Text>
          </View>

          {/* Multi-colored segmented frame budget bar */}
          <View style={perfStyles.budgetBarContainer}>
            <View
              style={[
                perfStyles.budgetBarSegment,
                {flex: Math.max(0.5, frameBudgetStats.jsTime), backgroundColor: AppColors.sky400},
              ]}
            />
            <View
              style={[
                perfStyles.budgetBarSegment,
                {flex: Math.max(0.5, frameBudgetStats.layoutTime), backgroundColor: AppColors.indigo500},
              ]}
            />
            <View
              style={[
                perfStyles.budgetBarSegment,
                {flex: Math.max(0.5, frameBudgetStats.renderTime), backgroundColor: AppColors.pink400},
              ]}
            />
            <View
              style={[
                perfStyles.budgetBarSegment,
                {flex: Math.max(0.5, frameBudgetStats.freeTime), backgroundColor: AppColors.emerald400},
              ]}
            />
          </View>

          <View style={perfStyles.budgetLegendGrid}>
            <View style={perfStyles.legendItem}>
              <View style={[perfStyles.legendDot, {backgroundColor: AppColors.sky400}]} />
              <Text style={perfStyles.legendText}>
                {t('performance.jsExec', {time: frameBudgetStats.jsTime})}
              </Text>
            </View>
            <View style={perfStyles.legendItem}>
              <View style={[perfStyles.legendDot, {backgroundColor: AppColors.indigo500}]} />
              <Text style={perfStyles.legendText}>
                {t('performance.yogaLayoutTime', {time: frameBudgetStats.layoutTime})}
              </Text>
            </View>
            <View style={perfStyles.legendItem}>
              <View style={[perfStyles.legendDot, {backgroundColor: AppColors.pink400}]} />
              <Text style={perfStyles.legendText}>
                {t('performance.uiRenderTime', {time: frameBudgetStats.renderTime})}
              </Text>
            </View>
            <View style={perfStyles.legendItem}>
              <View style={[perfStyles.legendDot, {backgroundColor: AppColors.emerald400}]} />
              <Text style={[perfStyles.legendText, {color: AppColors.emerald600, fontFamily: AppFonts.interBold}]}>
                {t('performance.freeTime', {time: frameBudgetStats.freeTime})}
              </Text>
            </View>
          </View>
        </View>

        {/* ── 3. RUNTIME ENGINE & MEMORY SUMMARY ── */}
        <View style={perfStyles.engineSummaryGrid}>
          <View style={perfStyles.engineSummaryCard}>
            <Text style={perfStyles.engineSummaryLabel}>{t('performance.jsEngine')}</Text>
            <Text style={perfStyles.engineSummaryValue}>{runtimeDiagnostics.jsEngineName}</Text>
            <Text style={perfStyles.engineSummarySub}>{runtimeDiagnostics.jsEngineSub}</Text>
          </View>
          <View style={perfStyles.engineSummaryCard}>
            <Text style={perfStyles.engineSummaryLabel}>{t('performance.uiRenderThread')}</Text>
            <Text style={perfStyles.engineSummaryValue}>{runtimeDiagnostics.uiArchName}</Text>
            <Text style={perfStyles.engineSummarySub}>{runtimeDiagnostics.uiArchSub}</Text>
          </View>
          <View style={perfStyles.engineSummaryCard}>
            <Text style={perfStyles.engineSummaryLabel}>{t('performance.tabMemory')}</Text>
            <Text style={perfStyles.engineSummaryValue}>{runtimeDiagnostics.usedHeapMb} MB</Text>
            <Text style={perfStyles.engineSummarySub}>
              {t('performance.heapAllocatedSub', {allocated: runtimeDiagnostics.totalAllocMb})}
            </Text>
          </View>
        </View>

        {/* ── 4. PERFORMANCE LOGS & DETAILED EVENTS ── */}
        <View style={perfStyles.logsHeaderRow}>
          <Text style={perfStyles.logsSectionHeading}>
            {t('performance.recordedEvents')} ({filteredEvents.length})
          </Text>
          {events.length > 0 && (
            <TouchableScale onPress={clearEvents}>
              <Text style={perfStyles.clearLink}>{t('common.clear')}</Text>
            </TouchableScale>
          )}
        </View>

        {filteredEvents.length === 0 ? (
          <View style={perfStyles.emptyCard}>
            <BoltIcon color={AppColors.amber500} size={30} />
            <Text style={perfStyles.emptyTitle}>{t('performance.emptyTitle')}</Text>
            <Text style={perfStyles.emptySub}>
              {t('performance.emptySubtitle')}
            </Text>
          </View>
        ) : (
          filteredEvents.map(event => {
            const isOptimal = event.severity === 'optimal';
            const isWarning = event.severity === 'warning';
            const isCritical = event.severity === 'critical';
            const isExpanded = !!expandedEventIds[event.id];

            const badgeBg = isOptimal ? AppColors.greenBg : isWarning ? AppColors.amberBg : AppColors.errorCardBg;
            const badgeBorder = isOptimal ? AppColors.greenBorder : isWarning ? AppColors.lightOrange : AppColors.errorBorder;
            const badgeColor = isOptimal ? AppColors.emerald600 : isWarning ? AppColors.amber700 : AppColors.errorColor;

            return (
              <TouchableScale
                key={event.id}
                onPress={() => toggleEventExpand(event.id)}
                style={[
                  perfStyles.eventCard,
                  isCritical && {borderColor: AppColors.errorBorder, backgroundColor: AppColors.errorCardBg},
                ]}>
                <View style={perfStyles.eventTopRow}>
                  <View
                    style={[
                      perfStyles.fpsBadge,
                      {backgroundColor: badgeBg, borderColor: badgeBorder},
                    ]}>
                    <Text style={[perfStyles.fpsBadgeText, {color: badgeColor}]}>
                      {event.fps} FPS
                    </Text>
                  </View>

                  <View style={{flex: 1, paddingHorizontal: 6}}>
                    <HighlightText
                      text={event.label}
                      search={search}
                      style={perfStyles.eventLabel}
                      highlightStyle={perfStyles.searchHighlight}
                    />
                    <Text style={perfStyles.eventMeta}>
                      {t('performance.msTotal', {duration: event.durationMs, time: new Date(event.timestamp).toLocaleTimeString()})}
                    </Text>
                  </View>

                  <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
                    <CopyButton
                      value={() => event}
                      label={t('common.copyJson')}
                    />
                    <Text style={perfStyles.expandChevron}>
                      {isExpanded ? '▲' : '▼'}
                    </Text>
                  </View>
                </View>

                <HighlightText
                  text={event.detail}
                  search={search}
                  style={perfStyles.eventDetail}
                  highlightStyle={perfStyles.searchHighlight}
                />

                {/* ── EXPANDABLE IN-DEPTH METRICS ACCORDION ── */}
                {isExpanded && (
                  <View style={perfStyles.expandedDetailBox}>
                    {/* Source file / hook tag */}
                    {event.source && (
                      <View style={perfStyles.sourceRow}>
                        <Text style={perfStyles.sourceTag}>{t('common.source')}</Text>
                        <Text style={perfStyles.sourceText} numberOfLines={1}>
                          {event.source}
                        </Text>
                      </View>
                    )}

                    {/* Thread Timing Breakdown */}
                    {event.breakdown && (
                      <View style={perfStyles.breakdownGrid}>
                        <View style={perfStyles.breakdownCol}>
                          <Text style={perfStyles.breakdownLabel}>{t('performance.jsThread')}</Text>
                          <Text style={perfStyles.breakdownVal}>
                            {event.breakdown.jsTimeMs} ms
                          </Text>
                        </View>
                        <View style={perfStyles.breakdownCol}>
                          <Text style={perfStyles.breakdownLabel}>{t('performance.uiThread')}</Text>
                          <Text style={perfStyles.breakdownVal}>
                            {event.breakdown.uiTimeMs} ms
                          </Text>
                        </View>
                        {event.breakdown.bridgeLatencyMs != null && (
                          <View style={perfStyles.breakdownCol}>
                            <Text style={perfStyles.breakdownLabel}>{t('performance.jsiLatency')}</Text>
                            <Text style={perfStyles.breakdownVal}>
                              {event.breakdown.bridgeLatencyMs} ms
                            </Text>
                          </View>
                        )}
                        {event.heapDeltaKb != null && (
                          <View style={perfStyles.breakdownCol}>
                            <Text style={perfStyles.breakdownLabel}>{t('performance.heapImpact')}</Text>
                            <Text
                              style={[
                                perfStyles.breakdownVal,
                                {color: event.heapDeltaKb > 0 ? AppColors.amber700 : AppColors.emerald600},
                              ]}>
                              {event.heapDeltaKb > 0 ? `+${event.heapDeltaKb}` : event.heapDeltaKb} KB
                            </Text>
                          </View>
                        )}
                      </View>
                    )}

                    {/* Actionable Optimization Tip */}
                    {event.advice && (
                      <View style={perfStyles.adviceCard}>
                        <View style={{flexDirection: 'row', alignItems: 'center', gap: 5}}>
                          <LightbulbIcon color={AppColors.purpleShade700} size={12} />
                          <Text style={perfStyles.adviceHeading}>{t('performance.optimizationTip')}</Text>
                        </View>
                        <Text style={perfStyles.adviceBodyText}>{event.advice}</Text>
                      </View>
                    )}
                  </View>
                )}
              </TouchableScale>
            );
          })
        )}

        <EndOfListFooter
          count={filteredEvents.length}
          label={t('performance.recordedEvents')}
        />
      </ScrollView>
    </View>
  );
});

const perfStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.grayBackground,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: AppColors.white,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.dividerColor,
    gap: 8,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.grayBackground,
    borderRadius: 8,
    paddingHorizontal: 8,
    height: 36,
    gap: 6,
    borderWidth: 1,
    borderColor: AppColors.dividerColor,
  },
  searchInput: {
    flex: 1,
    fontFamily: AppFonts.interRegular,
    fontSize: 12,
    color: AppColors.primaryBlack,
    paddingVertical: 0,
  },
  recordBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 7,
    borderWidth: 1,
  },
  recordBtnActive: {
    backgroundColor: AppColors.greenBg,
    borderColor: AppColors.greenBorder,
  },
  recordBtnPaused: {
    backgroundColor: AppColors.amberBg,
    borderColor: AppColors.lightOrange,
  },
  recordDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  recordBtnText: {
    fontFamily: AppFonts.interBold,
    fontSize: 11,
  },
  filterRow: {
    backgroundColor: AppColors.white,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.dividerColor,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    backgroundColor: AppColors.grayBackground,
    borderWidth: 1,
    borderColor: AppColors.dividerColor,
  },
  filterPillActive: {
    backgroundColor: AppColors.brandPurple,
    borderColor: AppColors.brandPurple,
  },
  filterPillText: {
    fontFamily: AppFonts.interMedium,
    fontSize: 11,
    color: AppColors.grayTextStrong,
  },
  filterPillTextActive: {
    fontFamily: AppFonts.interBold,
    color: AppColors.white,
  },
  scrollContent: {
    padding: 12,
    gap: 10,
  },
  metricCard: {
    backgroundColor: AppColors.white,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: AppColors.dividerColor,
    shadowColor: AppColors.black,
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  metricCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  metricCardTitle: {
    fontFamily: AppFonts.interBold,
    fontSize: 13.5,
    color: AppColors.primaryBlack,
  },
  scorePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  scorePillText: {
    fontFamily: AppFonts.interBold,
    fontSize: 10.5,
  },
  primaryFpsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  fpsBigNumberBox: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    minWidth: 80,
  },
  fpsBigNumber: {
    fontFamily: AppFonts.interBold,
    fontSize: 42,
    lineHeight: 48,
    letterSpacing: -1,
    minWidth: 54,
  },
  fpsUnit: {
    fontFamily: AppFonts.interBold,
    fontSize: 14,
    color: AppColors.grayTextWeak,
  },
  fpsStatsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statItem: {
    alignItems: 'center',
    minWidth: 50,
  },
  statLabel: {
    fontFamily: AppFonts.interRegular,
    fontSize: 10,
    color: AppColors.grayTextWeak,
  },
  statValue: {
    fontFamily: AppFonts.interBold,
    fontSize: 13,
    color: AppColors.primaryBlack,
    marginTop: 2,
    textAlign: 'center',
  },
  sparklineTrack: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 38,
    marginTop: 10,
    paddingTop: 4,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.dividerColor,
  },
  sparklineCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: '100%',
    paddingHorizontal: 1,
  },
  sparklineBar: {
    width: '80%',
    borderRadius: 2,
  },
  sparklineFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  sparklineFooterText: {
    fontFamily: AppFonts.interRegular,
    fontSize: 10,
    color: AppColors.grayTextWeak,
  },
  sparklineFooterTarget: {
    fontFamily: AppFonts.interMedium,
    fontSize: 10,
    color: AppColors.emerald600,
  },
  budgetCard: {
    backgroundColor: AppColors.white,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: AppColors.dividerColor,
    gap: 8,
  },
  budgetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  budgetTitle: {
    fontFamily: AppFonts.interBold,
    fontSize: 12.5,
    color: AppColors.primaryBlack,
  },
  budgetHeadroom: {
    fontFamily: AppFonts.interBold,
    fontSize: 11,
    color: AppColors.emerald600,
  },
  budgetBarContainer: {
    flexDirection: 'row',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: AppColors.grayBackground,
    gap: 2,
  },
  budgetBarSegment: {
    height: '100%',
    borderRadius: 2,
  },
  budgetLegendGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 2,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  legendText: {
    fontFamily: AppFonts.interRegular,
    fontSize: 10,
    color: AppColors.grayTextStrong,
  },
  engineSummaryGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  engineSummaryCard: {
    flex: 1,
    backgroundColor: AppColors.white,
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: AppColors.dividerColor,
  },
  engineSummaryLabel: {
    fontFamily: AppFonts.interMedium,
    fontSize: 10,
    color: AppColors.grayTextWeak,
  },
  engineSummaryValue: {
    fontFamily: AppFonts.interBold,
    fontSize: 11.5,
    color: AppColors.primaryBlack,
    marginTop: 2,
  },
  engineSummarySub: {
    fontFamily: AppFonts.interRegular,
    fontSize: 9.5,
    color: AppColors.grayTextWeak,
    marginTop: 1,
  },
  logsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  logsSectionHeading: {
    fontFamily: AppFonts.interBold,
    fontSize: 13,
    color: AppColors.primaryBlack,
  },
  clearLink: {
    fontFamily: AppFonts.interBold,
    fontSize: 11.5,
    color: AppColors.purple,
  },
  eventCard: {
    backgroundColor: AppColors.white,
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: AppColors.dividerColor,
    gap: 6,
  },
  eventTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fpsBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
    borderWidth: 1,
  },
  fpsBadgeText: {
    fontFamily: AppFonts.interBold,
    fontSize: 10,
  },
  eventLabel: {
    fontFamily: AppFonts.interBold,
    fontSize: 12,
    color: AppColors.primaryBlack,
  },
  eventMeta: {
    fontFamily: AppFonts.interRegular,
    fontSize: 10,
    color: AppColors.grayTextWeak,
    marginTop: 1,
  },
  eventDetail: {
    fontFamily: AppFonts.interRegular,
    fontSize: 11,
    color: AppColors.grayTextStrong,
    lineHeight: 15,
  },
  expandChevron: {
    fontSize: 10,
    color: AppColors.grayTextWeak,
    marginLeft: 2,
  },
  expandedDetailBox: {
    backgroundColor: AppColors.grayBackground,
    borderRadius: 8,
    padding: 8,
    marginTop: 4,
    gap: 6,
    borderWidth: 1,
    borderColor: AppColors.dividerColor,
  },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sourceTag: {
    fontFamily: AppFonts.interBold,
    fontSize: 8.5,
    color: AppColors.purple,
    backgroundColor: `${AppColors.purple}14`,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
  sourceText: {
    fontFamily: AppFonts.interMedium,
    fontSize: 10.5,
    color: AppColors.grayTextStrong,
    flex: 1,
  },
  breakdownGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.white,
    borderRadius: 6,
    padding: 6,
    borderWidth: 1,
    borderColor: AppColors.dividerColor,
    justifyContent: 'space-between',
  },
  breakdownCol: {
    alignItems: 'center',
    flex: 1,
  },
  breakdownLabel: {
    fontFamily: AppFonts.interRegular,
    fontSize: 9,
    color: AppColors.grayTextWeak,
  },
  breakdownVal: {
    fontFamily: AppFonts.interBold,
    fontSize: 11,
    color: AppColors.primaryBlack,
    marginTop: 1,
  },
  adviceCard: {
    backgroundColor: AppColors.purpleTintBg,
    borderRadius: 6,
    padding: 6,
    borderWidth: 1,
    borderColor: AppColors.purpleBorder,
  },
  adviceHeading: {
    fontFamily: AppFonts.interBold,
    fontSize: 10,
    color: AppColors.purpleShade700,
  },
  adviceBodyText: {
    fontFamily: AppFonts.interRegular,
    fontSize: 10.5,
    color: AppColors.purple,
    lineHeight: 14,
    marginTop: 1,
  },
  searchHighlight: {
    backgroundColor: AppColors.yellowHighlight,
    color: AppColors.amber800,
    fontFamily: AppFonts.interBold,
  },
  emptyCard: {
    backgroundColor: AppColors.white,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: AppColors.dividerColor,
  },
  emptyTitle: {
    fontFamily: AppFonts.interBold,
    fontSize: 14,
    color: AppColors.primaryBlack,
  },
  emptySub: {
    fontFamily: AppFonts.interRegular,
    fontSize: 11.5,
    color: AppColors.grayTextWeak,
    textAlign: 'center',
    lineHeight: 16,
  },
});

export default PerformanceTab;
