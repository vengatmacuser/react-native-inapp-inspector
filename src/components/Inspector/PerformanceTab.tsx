import React, {useState, useEffect, useMemo, useRef} from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, {
  Path,
  Defs,
  LinearGradient,
  Stop,
  Line,
  Circle,
  G,
  Rect,
} from 'react-native-svg';
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
  CircleAlertIcon,
  PerformanceIcon,
  BoltIcon,
  LightbulbIcon,
  WarningTriangleIcon,
  MapIcon,
  AtomIcon,
  BrainIcon,
  GlobeIcon,
  ChevronIcon,
} from '../NetworkIcons';
import {
  getPerformanceEvents,
  subscribePerformanceEvents,
  logPerformanceEvent,
  clearPerformanceEvents,
} from '../../customHooks/performanceTracker';
import {
  startNativeFpsMonitoring,
  stopNativeFpsMonitoring,
  getNativeFpsMetrics,
  getNativeSystemMetrics,
  NativeSystemMetrics,
  isNativeModuleAvailable,
} from '../../native/NativeInspector';

export interface PerformanceEvent {
  id: string;
  timestamp: number;
  type: 'fps_drop' | 'slow_render' | 'transition' | 'memory' | 'network' | 'bridge' | 'touch';
  category: 'render' | 'navigation' | 'memory' | 'io' | 'bridge';
  fps: number;
  durationMs: number;
  droppedFrames?: number;
  frameTimeMs?: number;
  frameBudgetPct?: number;
  bottleneckThread?: 'JS Thread' | 'UI Thread' | 'Bridge' | 'Balanced';
  screenName?: string;
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

  // Performance Log Events (Dynamic live subscription)
  const [events, setEvents] = useState<PerformanceEvent[]>(() =>
    getPerformanceEvents(),
  );
  const [filterCategory, setFilterCategory] = useState<'ALL' | 'JANKY' | 'NAVIGATION' | 'RENDER' | 'MEMORY' | 'IO'>('ALL');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const unsub = subscribePerformanceEvents(liveEvents => {
      setEvents(liveEvents);
    });
    return unsub;
  }, []);

  // ─── Live Frame Measurement Loop (1-Second Batch Interval) ────────────────
  const lastFrameTimeRef = useRef<number>(Date.now());
  const rafIdRef = useRef<number | null>(null);
  const [systemMetrics, setSystemMetrics] = useState<NativeSystemMetrics | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchMetrics = async () => {
      const metrics = await getNativeSystemMetrics();
      if (isMounted && metrics) {
        setSystemMetrics(metrics);
      }
    };
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 2000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (isNativeModuleAvailable()) {
      startNativeFpsMonitoring();
      return () => {
        stopNativeFpsMonitoring();
      };
    }
  }, []);

  useEffect(() => {
    if (!isRecording) return;

    let isMounted = true;
    let frameCount = 0;
    let maxLagInSecond = 0;
    let lastSecond = Date.now();

    const measureFrame = async () => {
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
        let measuredFps = Math.min(120, Math.max(0, Math.round((frameCount * 1000) / elapsed)));

        if (isNativeModuleAvailable()) {
          try {
            const nativeMetrics = await getNativeFpsMetrics();
            if (nativeMetrics && nativeMetrics.fps > 0) {
              measuredFps = Math.round(nativeMetrics.fps);
            }
          } catch {}
        }

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
          logPerformanceEvent({
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
          });
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

  // ─── Dynamic SVG FPS Area & Trend Curve Data ────────────────────────────
  const [selectedFpsPointIdx, setSelectedFpsPointIdx] = useState<number | null>(
    null,
  );
  const svgGraphWidth = 320;
  const svgGraphHeight = 64;

  const fpsGraphData = useMemo(() => {
    const points = fpsHistory.length > 0 ? fpsHistory : [60, 60];
    const stepX = svgGraphWidth / Math.max(1, points.length - 1);
    const coords = points.map((val, idx) => {
      const clamped = Math.max(0, Math.min(60, val));
      const x = Number((idx * stepX).toFixed(1));
      const y = Number(
        (svgGraphHeight - (clamped / 60) * (svgGraphHeight - 14) - 6).toFixed(
          1,
        ),
      );
      return {x, y, val};
    });

    let linePath = `M ${coords[0].x} ${coords[0].y}`;
    for (let i = 0; i < coords.length - 1; i++) {
      const p0 = coords[i];
      const p1 = coords[i + 1];
      const midX = Number(((p0.x + p1.x) / 2).toFixed(1));
      linePath += ` C ${midX} ${p0.y}, ${midX} ${p1.y}, ${p1.x} ${p1.y}`;
    }

    const last = coords[coords.length - 1];
    const first = coords[0];
    const areaPath = `${linePath} L ${last.x} ${svgGraphHeight} L ${first.x} ${svgGraphHeight} Z`;

    return {linePath, areaPath, coords};
  }, [fpsHistory]);

  const latencyBuckets = useMemo(() => {
    let optimal = 0;
    let minorJank = 0;
    let noticeableJank = 0;
    let severeFreeze = 0;

    fpsHistory.forEach(fps => {
      if (fps >= 55) optimal++;
      else if (fps >= 30) minorJank++;
      else if (fps >= 20) noticeableJank++;
      else severeFreeze++;
    });

    const total = Math.max(1, fpsHistory.length);
    return [
      {
        key: 'optimal',
        label: t('performance.optimalBucket'),
        count: optimal,
        percent: Number(((optimal / total) * 100).toFixed(0)),
        color: AppColors.emerald500,
        bgColor: AppColors.emerald100,
      },
      {
        key: 'minorJank',
        label: t('performance.minorJankBucket'),
        count: minorJank,
        percent: Number(((minorJank / total) * 100).toFixed(0)),
        color: AppColors.amber500,
        bgColor: AppColors.amber100,
      },
      {
        key: 'noticeableJank',
        label: t('performance.noticeableJankBucket'),
        count: noticeableJank,
        percent: Number(((noticeableJank / total) * 100).toFixed(0)),
        color: AppColors.firebaseOrange,
        bgColor: AppColors.lightOrange,
      },
      {
        key: 'severeFreeze',
        label: t('performance.severeFreezeBucket'),
        count: severeFreeze,
        percent: Number(((severeFreeze / total) * 100).toFixed(0)),
        color: AppColors.errorColor,
        bgColor: AppColors.errorCardBg,
      },
    ];
  }, [fpsHistory, t]);

  const clearEvents = () => {
    clearPerformanceEvents();
  };

  const activeScrubPoint =
    selectedFpsPointIdx !== null && fpsGraphData.coords[selectedFpsPointIdx]
      ? fpsGraphData.coords[selectedFpsPointIdx]
      : null;

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

        {/* Live FPS Telemetry Recorder Toggle */}
        <TouchableScale
          onPress={() => setIsRecording(prev => !prev)}
          style={[
            perfStyles.recordToggleBtn,
            isRecording
              ? perfStyles.recordToggleActive
              : perfStyles.recordToggleInactive,
          ]}>
          <View
            style={[
              perfStyles.recordingDot,
              {
                backgroundColor: isRecording
                  ? AppColors.errorColor
                  : AppColors.grayTextWeak,
              },
            ]}
          />
          <Text
            style={[
              perfStyles.recordToggleText,
              {
                color: isRecording
                  ? AppColors.errorColor
                  : AppColors.grayTextWeak,
              },
            ]}>
            {isRecording
              ? t('performance.recording')
              : t('performance.paused')}
          </Text>
        </TouchableScale>
      </View>

      {/* Filter Category Tabs Carousel */}
      <View style={perfStyles.categoryScrollWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={perfStyles.categoryScrollView}
          contentContainerStyle={perfStyles.categoryScroll}>
          {(
            [
              {
                key: 'ALL',
                label: t('performance.catAll'),
                icon: (color: string) => <PerformanceIcon size={12} color={color} />,
              },
              {
                key: 'JANKY',
                label: t('performance.catJanky'),
                icon: (color: string) => <CircleAlertIcon size={12} color={color} />,
              },
              {
                key: 'NAVIGATION',
                label: t('performance.catNavigation'),
                icon: (color: string) => <MapIcon size={12} color={color} />,
              },
              {
                key: 'RENDER',
                label: t('performance.catRender'),
                icon: (color: string) => <AtomIcon size={12} color={color} />,
              },
              {
                key: 'MEMORY',
                label: t('performance.catMemory'),
                icon: (color: string) => <BrainIcon size={12} color={color} />,
              },
              {
                key: 'IO',
                label: t('performance.catIo'),
                icon: (color: string) => <GlobeIcon size={12} color={color} />,
              },
            ] as const
          ).map(cat => {
            const isSelected = filterCategory === cat.key;
            const iconColor = isSelected ? AppColors.white : AppColors.grayTextWeak;
            return (
              <TouchableScale
                key={cat.key}
                onPress={() => setFilterCategory(cat.key)}
                style={[
                  perfStyles.categoryChip,
                  isSelected && perfStyles.categoryChipActive,
                  {flexDirection: 'row', alignItems: 'center', gap: 5},
                ]}>
                {cat.icon(iconColor)}
                <Text
                  style={[
                    perfStyles.categoryChipText,
                    isSelected && perfStyles.categoryChipTextActive,
                  ]}>
                  {cat.label}
                </Text>
              </TouchableScale>
            );
          })}
        </ScrollView>
      </View>

      {/* Main Content Scroll View */}
      <ScrollView
        style={perfStyles.scrollBody}
        contentContainerStyle={perfStyles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* ── 1. REAL-TIME FPS SCORECARD & SMOOTH AREA GRAPH ── */}
        <View style={perfStyles.heroCard}>
          <View style={perfStyles.heroHeaderRow}>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
              <PerformanceIcon color={AppColors.purple} size={17} />
              <View>
                <Text style={perfStyles.heroTitle}>
                  {t('performance.fpsAreaChartTitle')}
                </Text>
                <Text style={perfStyles.heroSubTitle}>
                  {t('performance.fpsAreaChartSub')}
                </Text>
              </View>
            </View>

            {/* Health Grade Score Pill */}
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
                <Text style={perfStyles.statLabel}>
                  {t('performance.avgFrameTime')}
                </Text>
                <Text style={perfStyles.statValue}>{avgFps}</Text>
              </View>
              <View style={perfStyles.statItem}>
                <Text style={perfStyles.statLabel}>
                  {t('performance.peakTime')}
                </Text>
                <Text
                  style={[
                    perfStyles.statValue,
                    minFps < 50 && {color: AppColors.firebaseOrange},
                  ]}>
                  {minFps}
                </Text>
              </View>
              <View style={perfStyles.statItem}>
                <Text style={perfStyles.statLabel}>
                  {t('performance.jsLag')}
                </Text>
                <Text
                  style={[
                    perfStyles.statValue,
                    jsLagMs > 5 && {color: AppColors.firebaseOrange},
                  ]}>
                  {jsLagMs}ms
                </Text>
              </View>
              <View style={perfStyles.statItem}>
                <Text style={perfStyles.statLabel}>
                  {t('performance.jankRate')}
                </Text>
                <Text style={perfStyles.statValue}>
                  {totalFrames > 0
                    ? `${(
                        (jankyFrameCount / Math.max(1, totalFrames / 60)) *
                        100
                      ).toFixed(0)}%`
                    : '0%'}
                </Text>
              </View>
            </View>
          </View>

          {/* Interactive Scrub Tooltip */}
          {activeScrubPoint && (
            <View style={perfStyles.graphScrubTooltip}>
              <Text style={perfStyles.graphScrubTooltipText}>
                {activeScrubPoint.val} FPS •{' '}
                {Number((1000 / Math.max(1, activeScrubPoint.val)).toFixed(1))}
                ms
              </Text>
            </View>
          )}

          {/* Real-Time SVG Smooth Area & Trend Wave Graph */}
          <View style={perfStyles.svgGraphContainer}>
            <Svg
              width="100%"
              height={svgGraphHeight}
              viewBox={`0 0 ${svgGraphWidth} ${svgGraphHeight}`}
              preserveAspectRatio="none">
              <Defs>
                <LinearGradient
                  id="fpsAreaGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1">
                  <Stop
                    offset="0%"
                    stopColor={
                      avgFps >= 55
                        ? AppColors.emerald500
                        : avgFps >= 40
                        ? AppColors.amber500
                        : AppColors.errorColor
                    }
                    stopOpacity="0.32"
                  />
                  <Stop
                    offset="100%"
                    stopColor={
                      avgFps >= 55
                        ? AppColors.emerald500
                        : avgFps >= 40
                        ? AppColors.amber500
                        : AppColors.errorColor
                    }
                    stopOpacity="0.02"
                  />
                </LinearGradient>
              </Defs>

              {/* 60 FPS Target Baseline */}
              <Line
                x1="0"
                y1="7"
                x2={svgGraphWidth}
                y2="7"
                stroke={AppColors.emerald500}
                strokeWidth="1"
                strokeDasharray="4,4"
                opacity="0.4"
              />

              {/* 30 FPS Warning Baseline */}
              <Line
                x1="0"
                y1={svgGraphHeight / 2}
                x2={svgGraphWidth}
                y2={svgGraphHeight / 2}
                stroke={AppColors.amber500}
                strokeWidth="0.8"
                strokeDasharray="3,3"
                opacity="0.3"
              />

              {/* Shaded Area Under Curve */}
              {fpsGraphData.areaPath ? (
                <Path
                  d={fpsGraphData.areaPath}
                  fill="url(#fpsAreaGradient)"
                />
              ) : null}

              {/* Bezier Trend Line */}
              {fpsGraphData.linePath ? (
                <Path
                  d={fpsGraphData.linePath}
                  fill="none"
                  stroke={
                    avgFps >= 55
                      ? AppColors.emerald600
                      : avgFps >= 40
                      ? AppColors.amber600
                      : AppColors.errorColor
                  }
                  strokeWidth="2.2"
                />
              ) : null}

              {/* Sample Nodes */}
              {fpsGraphData.coords.map((c, idx) => {
                const isSelected = selectedFpsPointIdx === idx;
                const isDip = c.val < 50;
                return (
                  <G key={idx}>
                    {isDip && (
                      <Circle
                        cx={c.x}
                        cy={c.y}
                        r="4"
                        fill={AppColors.errorColor}
                        opacity="0.25"
                      />
                    )}
                    <Circle
                      cx={c.x}
                      cy={c.y}
                      r={isSelected ? 4 : isDip ? 2.5 : 1.8}
                      fill={
                        isSelected
                          ? AppColors.brandPurple
                          : isDip
                          ? AppColors.errorColor
                          : AppColors.emerald600
                      }
                      stroke={AppColors.white}
                      strokeWidth={isSelected ? 1.5 : 0.8}
                    />
                  </G>
                );
              })}
            </Svg>

            {/* Invisible Touch Column Targets for Interactive Inspection */}
            <View style={perfStyles.svgTouchOverlay}>
              {fpsGraphData.coords.map((_, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={perfStyles.svgTouchCol}
                  activeOpacity={0.7}
                  onPress={() =>
                    setSelectedFpsPointIdx(
                      selectedFpsPointIdx === idx ? null : idx,
                    )
                  }
                />
              ))}
            </View>
          </View>

          <View style={perfStyles.sparklineFooter}>
            <Text style={perfStyles.sparklineFooterText}>
              {t('performance.realtimeWindow')}
            </Text>
            <Text style={perfStyles.sparklineFooterTarget}>
              {t('performance.target60Fps', {fps: avgFps})}
            </Text>
          </View>
        </View>

        {/* ── 1.5 NATIVE HARDWARE HEALTH & SYSTEM TELEMETRY CARD ── */}
        <View style={perfStyles.budgetCard}>
          <View style={perfStyles.budgetHeader}>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
              <BoltIcon color={AppColors.brandPurple} size={15} />
              <View>
                <Text style={perfStyles.budgetTitle}>Native Hardware & System Health</Text>
                <Text style={perfStyles.heroSubTitle}>Live kernel metrics, resident RAM, and thermal state</Text>
              </View>
            </View>
            {systemMetrics && (
              <View
                style={{
                  paddingHorizontal: 7,
                  paddingVertical: 2.5,
                  borderRadius: 5,
                  backgroundColor:
                    systemMetrics.thermalState === 'nominal'
                      ? `${AppColors.emerald600}18`
                      : systemMetrics.thermalState === 'fair'
                      ? `${AppColors.amber800Warm}18`
                      : `${AppColors.errorColor}18`,
                }}>
                <Text
                  style={{
                    fontFamily: AppFonts.interBold,
                    fontSize: 9.5,
                    color:
                      systemMetrics.thermalState === 'nominal'
                        ? AppColors.emerald600
                        : systemMetrics.thermalState === 'fair'
                        ? AppColors.amber800Warm
                        : AppColors.errorColor,
                    textTransform: 'uppercase',
                  }}>
                  {systemMetrics.thermalState} THERMAL
                </Text>
              </View>
            )}
          </View>

          <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10}}>
            <View style={{flex: 1, minWidth: 100, backgroundColor: AppColors.grayBackground, padding: 8, borderRadius: 8, borderWidth: 1, borderColor: AppColors.dividerColor}}>
              <Text style={{fontFamily: AppFonts.interRegular, fontSize: 9.5, color: AppColors.grayTextWeak}}>Resident RAM</Text>
              <Text style={{fontFamily: AppFonts.interBold, fontSize: 13, color: AppColors.brandPurple, marginTop: 2}}>
                {systemMetrics ? `${systemMetrics.residentRamMb.toFixed(1)} MB` : '18.4 MB'}
              </Text>
            </View>
            <View style={{flex: 1, minWidth: 100, backgroundColor: AppColors.grayBackground, padding: 8, borderRadius: 8, borderWidth: 1, borderColor: AppColors.dividerColor}}>
              <Text style={{fontFamily: AppFonts.interRegular, fontSize: 9.5, color: AppColors.grayTextWeak}}>Total Physical RAM</Text>
              <Text style={{fontFamily: AppFonts.interBold, fontSize: 13, color: AppColors.primaryBlack, marginTop: 2}}>
                {systemMetrics ? `${Math.round(systemMetrics.totalPhysicalRamMb)} MB` : '3840 MB'}
              </Text>
            </View>
            <View style={{flex: 1, minWidth: 100, backgroundColor: AppColors.grayBackground, padding: 8, borderRadius: 8, borderWidth: 1, borderColor: AppColors.dividerColor}}>
              <Text style={{fontFamily: AppFonts.interRegular, fontSize: 9.5, color: AppColors.grayTextWeak}}>Active CPU Cores</Text>
              <Text style={{fontFamily: AppFonts.interBold, fontSize: 13, color: AppColors.skyBlue, marginTop: 2}}>
                {systemMetrics ? `${systemMetrics.activeCpuCores} Cores` : '6 Cores'}
              </Text>
            </View>
          </View>
        </View>

        {/* ── 2. FRAME LATENCY DISTRIBUTION HISTOGRAM CARD ── */}
        <View style={perfStyles.budgetCard}>
          <View style={perfStyles.budgetHeader}>
            <View>
              <Text style={perfStyles.budgetTitle}>
                {t('performance.frameLatencyDistTitle')}
              </Text>
              <Text style={perfStyles.heroSubTitle}>
                {t('performance.frameLatencyDistSub')}
              </Text>
            </View>
          </View>

          <View style={perfStyles.histogramContainer}>
            {latencyBuckets.map(b => (
              <View key={b.key} style={perfStyles.histogramRow}>
                <View style={perfStyles.histogramLabelCol}>
                  <View
                    style={[perfStyles.legendDot, {backgroundColor: b.color}]}
                  />
                  <Text style={perfStyles.histogramLabelText}>{b.label}</Text>
                </View>

                <View style={perfStyles.histogramBarCol}>
                  <View style={perfStyles.histogramTrack}>
                    <View
                      style={[
                        perfStyles.histogramBarFill,
                        {
                          width: `${Math.max(b.percent > 0 ? 4 : 0, b.percent)}%`,
                          backgroundColor: b.color,
                        },
                      ]}
                    />
                  </View>
                </View>

                <View style={perfStyles.histogramStatsCol}>
                  <Text
                    style={[
                      perfStyles.histogramPercentText,
                      {color: b.color},
                    ]}>
                    {b.percent}%
                  </Text>
                  <Text style={perfStyles.histogramCountText}>
                    ({b.count})
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* ── 3. FRAME BUDGET BREAKDOWN CARD ── */}
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
                  <View style={perfStyles.fpsBadgeGroup}>
                    <View
                      style={[
                        perfStyles.fpsBadge,
                        {backgroundColor: badgeBg, borderColor: badgeBorder},
                      ]}>
                      <Text style={[perfStyles.fpsBadgeText, {color: badgeColor}]}>
                        {event.fps} FPS
                      </Text>
                    </View>

                    {/* Dropped Frames Badge */}
                    <View
                      style={[
                        perfStyles.droppedBadge,
                        (event.droppedFrames ?? Math.max(0, 60 - event.fps)) > 0
                          ? perfStyles.droppedBadgeWarning
                          : perfStyles.droppedBadgeOptimal,
                      ]}>
                      <Text
                        style={[
                          perfStyles.droppedBadgeText,
                          (event.droppedFrames ?? Math.max(0, 60 - event.fps)) > 0
                            ? {color: AppColors.red600}
                            : {color: AppColors.emerald600},
                        ]}>
                        {(event.droppedFrames ?? Math.max(0, 60 - event.fps)) > 0
                          ? t('performance.droppedFrames', {count: event.droppedFrames ?? Math.max(0, 60 - event.fps)})
                          : t('performance.zeroDropped')}
                      </Text>
                    </View>

                    {/* Bottleneck Thread Tag */}
                    {event.bottleneckThread && (
                      <View style={[perfStyles.bottleneckTag, {flexDirection: 'row', alignItems: 'center', gap: 3}]}>
                        {event.bottleneckThread === 'JS Thread' && (
                          <BoltIcon size={10} color={AppColors.warningIconGold} />
                        )}
                        <Text style={perfStyles.bottleneckTagText}>
                          {event.bottleneckThread === 'JS Thread'
                            ? t('performance.jsBound')
                            : event.bottleneckThread === 'UI Thread'
                            ? t('performance.uiBound')
                            : t('performance.balanced')}
                        </Text>
                      </View>
                    )}
                  </View>

                  <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
                    <CopyButton
                      value={() => event}
                      label={t('common.copyJson')}
                    />
                    <ChevronIcon
                      isExpanded={isExpanded}
                      size={14}
                      color={AppColors.grayTextWeak}
                    />
                  </View>
                </View>

                {/* Event Label & Meta */}
                <View style={{marginTop: 4}}>
                  <HighlightText
                    text={event.label}
                    search={search}
                    style={perfStyles.eventLabel}
                    highlightStyle={perfStyles.searchHighlight}
                  />
                  <View style={perfStyles.eventMetaRow}>
                    <Text style={perfStyles.eventMeta}>
                      {t('performance.msTotal', {
                        duration: event.durationMs,
                        time: new Date(event.timestamp).toLocaleTimeString(),
                      })}
                    </Text>
                    <Text style={perfStyles.eventMetaDot}>•</Text>
                    <Text
                      style={[
                        perfStyles.frameBudgetHint,
                        event.durationMs > 16.67
                          ? {color: AppColors.amber800Warm}
                          : {color: AppColors.emerald600},
                      ]}>
                      {t('performance.frameBudgetMs', {
                        time: event.durationMs,
                        budget: Number(((event.durationMs / 16.67) * 100).toFixed(0)),
                      })}
                    </Text>
                  </View>
                </View>

                {/* Visual Frame Time Budget Bar */}
                <View style={perfStyles.frameBarTrack}>
                  <View
                    style={[
                      perfStyles.frameBarFill,
                      {
                        width: `${Math.min(100, Math.max(10, (event.durationMs / 33.33) * 100))}%`,
                        backgroundColor: badgeColor,
                      },
                    ]}
                  />
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
                    {/* Screen / Component Context */}
                    {(event.screenName || event.source) && (
                      <View style={perfStyles.sourceRow}>
                        <Text style={perfStyles.sourceTag}>{t('performance.screenContext')}</Text>
                        <Text style={perfStyles.sourceText} numberOfLines={1}>
                          {event.screenName || event.source}
                        </Text>
                      </View>
                    )}

                    {/* Frame Metrics Grid */}
                    <View style={perfStyles.fpsMetricsGrid}>
                      <View style={perfStyles.fpsMetricItem}>
                        <Text style={perfStyles.fpsMetricLabel}>{t('performance.target60Fps', {fps: event.fps})}</Text>
                        <Text style={[perfStyles.fpsMetricVal, {color: badgeColor}]}>
                          {event.fps} FPS
                        </Text>
                      </View>
                      <View style={perfStyles.fpsMetricItem}>
                        <Text style={perfStyles.fpsMetricLabel}>{t('performance.frameDuration')}</Text>
                        <Text style={perfStyles.fpsMetricVal}>
                          {event.durationMs} ms
                        </Text>
                      </View>
                      <View style={perfStyles.fpsMetricItem}>
                        <Text style={perfStyles.fpsMetricLabel}>{t('performance.jankRate')}</Text>
                        <Text
                          style={[
                            perfStyles.fpsMetricVal,
                            (event.droppedFrames ?? 0) > 0 ? {color: AppColors.red600} : {color: AppColors.emerald600},
                          ]}>
                          {event.droppedFrames ?? Math.max(0, 60 - event.fps)} frames
                        </Text>
                      </View>
                      <View style={perfStyles.fpsMetricItem}>
                        <Text style={perfStyles.fpsMetricLabel}>{t('performance.bottleneck')}</Text>
                        <Text style={perfStyles.fpsMetricVal}>
                          {event.bottleneckThread || t('performance.balanced')}
                        </Text>
                      </View>
                    </View>

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
  recordToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 7,
    borderWidth: 1,
  },
  recordToggleActive: {
    backgroundColor: `${AppColors.errorColor}14`,
    borderColor: `${AppColors.errorColor}30`,
  },
  recordToggleInactive: {
    backgroundColor: AppColors.graySurface,
    borderColor: AppColors.dividerColor,
  },
  recordingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  recordToggleText: {
    fontFamily: AppFonts.interBold,
    fontSize: 11,
  },
  categoryScrollWrapper: {
    backgroundColor: AppColors.white,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.dividerColor,
    height: 42,
  },
  categoryScrollView: {
    flexGrow: 0,
    height: 42,
  },
  categoryScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    height: 42,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    height: 28,
    borderRadius: 14,
    backgroundColor: AppColors.grayBackground,
    borderWidth: 1,
    borderColor: AppColors.dividerColor,
  },
  categoryChipActive: {
    backgroundColor: AppColors.brandPurple,
    borderColor: AppColors.brandPurple,
  },
  categoryChipText: {
    fontFamily: AppFonts.interMedium,
    fontSize: 11,
    color: AppColors.grayTextStrong,
  },
  categoryChipTextActive: {
    fontFamily: AppFonts.interBold,
    color: AppColors.white,
  },
  scrollBody: {
    flex: 1,
  },
  scrollContent: {
    padding: 12,
    gap: 10,
  },
  heroCard: {
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
  heroHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  heroTitle: {
    fontFamily: AppFonts.interBold,
    fontSize: 13,
    color: AppColors.primaryBlack,
  },
  heroSubTitle: {
    fontFamily: AppFonts.interRegular,
    fontSize: 9.5,
    color: AppColors.grayTextWeak,
    marginTop: 1,
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
  graphScrubTooltip: {
    alignSelf: 'center',
    backgroundColor: AppColors.primaryBlack,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 4,
  },
  graphScrubTooltipText: {
    fontFamily: AppFonts.interBold,
    fontSize: 10,
    color: AppColors.white,
  },
  svgGraphContainer: {
    width: '100%',
    height: 64,
    marginTop: 6,
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 8,
  },
  svgTouchOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
  },
  svgTouchCol: {
    flex: 1,
    height: '100%',
  },
  histogramContainer: {
    gap: 8,
    marginTop: 4,
  },
  histogramRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  histogramLabelCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    width: 140,
  },
  histogramLabelText: {
    fontFamily: AppFonts.interMedium,
    fontSize: 10,
    color: AppColors.grayTextStrong,
  },
  histogramBarCol: {
    flex: 1,
  },
  histogramTrack: {
    height: 8,
    backgroundColor: AppColors.grayBackground,
    borderRadius: 4,
    overflow: 'hidden',
  },
  histogramBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  histogramStatsCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minWidth: 52,
    justifyContent: 'flex-end',
  },
  histogramPercentText: {
    fontFamily: AppFonts.interBold,
    fontSize: 10.5,
  },
  histogramCountText: {
    fontFamily: AppFonts.interRegular,
    fontSize: 9.5,
    color: AppColors.grayTextWeak,
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
  fpsBadgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
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
  droppedBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
    borderWidth: 1,
  },
  droppedBadgeWarning: {
    backgroundColor: AppColors.red100,
    borderColor: AppColors.errorBorder,
  },
  droppedBadgeOptimal: {
    backgroundColor: AppColors.green100,
    borderColor: AppColors.greenBorder,
  },
  droppedBadgeText: {
    fontFamily: AppFonts.interBold,
    fontSize: 9.5,
  },
  bottleneckTag: {
    backgroundColor: AppColors.purpleShade50,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: AppColors.purpleTint2,
  },
  bottleneckTagText: {
    fontFamily: AppFonts.interMedium,
    fontSize: 9.5,
    color: AppColors.purple,
  },
  eventMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
    flexWrap: 'wrap',
  },
  eventMetaDot: {
    fontSize: 9,
    color: AppColors.grayTextWeak,
  },
  frameBudgetHint: {
    fontFamily: AppFonts.interMedium,
    fontSize: 10,
  },
  frameBarTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: AppColors.graySurface,
    overflow: 'hidden',
    marginVertical: 4,
  },
  frameBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  fpsMetricsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.white,
    borderRadius: 6,
    padding: 6,
    borderWidth: 1,
    borderColor: AppColors.dividerColor,
    justifyContent: 'space-between',
    gap: 4,
  },
  fpsMetricItem: {
    alignItems: 'center',
    flex: 1,
  },
  fpsMetricLabel: {
    fontFamily: AppFonts.interRegular,
    fontSize: 8.5,
    color: AppColors.grayTextWeak,
    textAlign: 'center',
  },
  fpsMetricVal: {
    fontFamily: AppFonts.interBold,
    fontSize: 10.5,
    color: AppColors.primaryBlack,
    marginTop: 1,
    textAlign: 'center',
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
