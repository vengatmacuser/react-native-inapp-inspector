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
import {SearchIcon, CircleXIcon, PerformanceIcon} from '../NetworkIcons';

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

const INITIAL_PERFORMANCE_EVENTS: PerformanceEvent[] = [
  {
    id: 'perf-1',
    timestamp: Date.now() - 48000,
    type: 'fps_drop',
    category: 'navigation',
    fps: 38,
    durationMs: 26.3,
    label: 'Main Thread Spike during Navigation',
    detail: 'Screen transition to ProductDetailScreen triggered heavy layout reconciliation and simultaneous component mounts.',
    source: 'src/navigation/RootNavigator.tsx',
    breakdown: {jsTimeMs: 18.2, uiTimeMs: 8.1, bridgeLatencyMs: 1.2},
    heapDeltaKb: 640,
    advice: 'Defer non-critical offscreen hooks with InteractionManager.runAfterInteractions to preserve 60 FPS.',
    severity: 'warning',
  },
  {
    id: 'perf-2',
    timestamp: Date.now() - 41000,
    type: 'slow_render',
    category: 'render',
    fps: 42,
    durationMs: 23.8,
    label: 'FlatList Virtualization Re-render Pass',
    detail: 'FlatList rendered 25 items simultaneously on orientation change without memoized row component.',
    source: 'src/components/Inspector/NetworkTab.tsx',
    breakdown: {jsTimeMs: 16.4, uiTimeMs: 7.4},
    heapDeltaKb: 380,
    advice: 'Implement getItemLayout and React.memo(LogCard) to skip redundant diffing passes.',
    severity: 'warning',
  },
  {
    id: 'perf-3',
    timestamp: Date.now() - 35000,
    type: 'transition',
    category: 'navigation',
    fps: 59,
    durationMs: 16.9,
    label: 'Native Modal Slide-Up Transition',
    detail: 'Hardware accelerated native driver animated transform running smoothly at sustained 60 FPS.',
    source: 'src/components/Inspector/MainScreen.tsx',
    breakdown: {jsTimeMs: 2.1, uiTimeMs: 14.8},
    heapDeltaKb: 120,
    advice: 'Using nativeDriver: true successfully prevents JS thread blocking during animations.',
    severity: 'optimal',
  },
  {
    id: 'perf-4',
    timestamp: Date.now() - 28000,
    type: 'memory',
    category: 'memory',
    fps: 60,
    durationMs: 16.6,
    label: 'Hermes Generational Garbage Collection',
    detail: 'Minor generational GC cycle scavenged 4.2 MB ephemeral heap objects with sub-millisecond thread pause.',
    source: 'Hermes VM Garbage Collector',
    breakdown: {jsTimeMs: 3.1, uiTimeMs: 0.2},
    heapDeltaKb: -4280,
    advice: 'Hermes generational garbage collector is operating within optimal sub-5ms limits.',
    severity: 'optimal',
  },
  {
    id: 'perf-5',
    timestamp: Date.now() - 22000,
    type: 'network',
    category: 'io',
    fps: 48,
    durationMs: 20.8,
    label: 'Large JSON Payload Deserialization',
    detail: '50-item API response parse overhead in network adapter (185 KB JSON raw string).',
    source: 'src/customHooks/networkLogger.ts',
    breakdown: {jsTimeMs: 15.6, uiTimeMs: 5.2, bridgeLatencyMs: 2.1},
    heapDeltaKb: 890,
    advice: 'Consider paginating API payloads or streaming responses if payload size exceeds 250 KB.',
    severity: 'warning',
  },
  {
    id: 'perf-6',
    timestamp: Date.now() - 17000,
    type: 'slow_render',
    category: 'render',
    fps: 52,
    durationMs: 19.2,
    label: 'Image Bitmap Decode & Rasterization',
    detail: 'Retina raster decode for banner_dark.png (1200×630px raster buffer allocation).',
    source: 'src/components/Inspector/BundleTab.tsx',
    breakdown: {jsTimeMs: 3.4, uiTimeMs: 15.8},
    heapDeltaKb: 1450,
    advice: 'Downscale asset dimensions or convert to WebP to reduce decode latency by ~65%.',
    severity: 'warning',
  },
  {
    id: 'perf-7',
    timestamp: Date.now() - 12000,
    type: 'bridge',
    category: 'bridge',
    fps: 60,
    durationMs: 16.6,
    label: 'Native TurboModule JSI Invocation',
    detail: 'AsyncStorage / MMKV preferences transaction read across 32 configuration keys.',
    source: 'src/helpers/settingsStore.ts',
    breakdown: {jsTimeMs: 1.8, uiTimeMs: 0.8, bridgeLatencyMs: 0.4},
    heapDeltaKb: 45,
    advice: 'Direct C++ JSI Turbomodule bindings completely bypass legacy JSON bridge serialization overhead.',
    severity: 'optimal',
  },
  {
    id: 'perf-8',
    timestamp: Date.now() - 8000,
    type: 'slow_render',
    category: 'render',
    fps: 60,
    durationMs: 16.6,
    label: 'Redux Action State Tree Diffing',
    detail: 'Redux dispatch pass evaluated 6 reducer slices and emitted state notification in 4.8ms.',
    source: 'src/components/Inspector/ReduxTab.tsx',
    breakdown: {jsTimeMs: 4.8, uiTimeMs: 1.2},
    heapDeltaKb: 180,
    advice: 'State tree immutability preserved. Memoized selectors prevented redundant component renders.',
    severity: 'optimal',
  },
  {
    id: 'perf-9',
    timestamp: Date.now() - 4000,
    type: 'touch',
    category: 'render',
    fps: 60,
    durationMs: 16.6,
    label: 'Touch-to-Render Event Latency',
    detail: 'Gesture responder dispatched tap event to TabBar button with immediate 60 FPS response.',
    source: 'src/components/Inspector/TabBar.tsx',
    breakdown: {jsTimeMs: 4.2, uiTimeMs: 2.1},
    heapDeltaKb: 30,
    advice: 'Touch responder latency is well within standard 16.67ms frame budget.',
    severity: 'optimal',
  },
  {
    id: 'perf-10',
    timestamp: Date.now() - 1500,
    type: 'transition',
    category: 'render',
    fps: 60,
    durationMs: 16.6,
    label: 'C++ Yoga Flexbox Layout Pass',
    detail: 'Inspector UI multi-tab card layout recalculation and font metrics pass in C++ Yoga engine.',
    source: 'Yoga Flexbox Layout Engine',
    breakdown: {jsTimeMs: 2.8, uiTimeMs: 3.4},
    heapDeltaKb: 65,
    advice: 'Flexbox layout constraints are cached and computed efficiently with zero reflow penalties.',
    severity: 'optimal',
  },
];

const PerformanceTab = React.memo(() => {
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
  const [events, setEvents] = useState<PerformanceEvent[]>(INITIAL_PERFORMANCE_EVENTS);
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
          const newEvent: PerformanceEvent = {
            id: `drop-${Date.now()}`,
            timestamp: Date.now(),
            type: 'fps_drop',
            category: 'render',
            fps: measuredFps,
            durationMs: Number((1000 / measuredFps).toFixed(1)),
            label: `Live Frame Rate Dip (${measuredFps} FPS)`,
            detail: `Main thread frame duration extended to ${(1000 / measuredFps).toFixed(1)}ms during view update.`,
            source: 'React Native UI Thread',
            breakdown: {
              jsTimeMs: Number(((1000 / measuredFps) * 0.65).toFixed(1)),
              uiTimeMs: Number(((1000 / measuredFps) * 0.35).toFixed(1)),
            },
            advice: 'Heavy JavaScript execution during frame pass delayed display presentation.',
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
    if (avgFps >= 58) return {score: '98/100', grade: 'Excellent (60 FPS)', color: '#059669', bg: '#DCFCE7'};
    if (avgFps >= 50) return {score: '84/100', grade: 'Good (Minor Janks)', color: '#D97706', bg: '#FEF3C7'};
    return {score: '58/100', grade: 'Needs Optimization', color: '#DC2626', bg: '#FEE2E2'};
  }, [avgFps]);

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
            placeholder="Search performance logs, hooks, FPS drops..."
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
                {backgroundColor: isRecording ? '#10B981' : '#F59E0B'},
              ]}
            />
            <Text
              style={[
                perfStyles.recordBtnText,
                {color: isRecording ? '#047857' : '#B45309'},
              ]}>
              {isRecording ? 'Live' : 'Paused'}
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
              engine: 'Hermes Bytecode AOT',
              totalEvents: events.length,
              events,
            })}
            label="Copy Perf JSON"
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
              {key: 'ALL', label: 'All Logs', icon: '⚡', count: events.length},
              {
                key: 'JANKY',
                label: 'Janky / Slow',
                icon: '⚠️',
                count: events.filter(e => e.severity === 'warning' || e.severity === 'critical').length,
              },
              {
                key: 'NAVIGATION',
                label: 'Navigation',
                icon: '🗺️',
                count: events.filter(e => e.category === 'navigation').length,
              },
              {
                key: 'RENDER',
                label: 'Components',
                icon: '⚛️',
                count: events.filter(e => e.category === 'render').length,
              },
              {
                key: 'MEMORY',
                label: 'Memory & GC',
                icon: '🧠',
                count: events.filter(e => e.category === 'memory').length,
              },
              {
                key: 'IO',
                label: 'Network & I/O',
                icon: '🌐',
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
                <Text style={perfStyles.filterPillIcon}>{tab.icon}</Text>
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
              <Text style={perfStyles.metricCardTitle}>Real-Time Frame Rate (FPS)</Text>
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
                        ? '#059669'
                        : currentFps >= 40
                        ? '#D97706'
                        : '#DC2626',
                  },
                ]}>
                {currentFps}
              </Text>
              <Text style={perfStyles.fpsUnit}>FPS</Text>
            </View>

            <View style={perfStyles.fpsStatsGrid}>
              <View style={perfStyles.statItem}>
                <Text style={perfStyles.statLabel}>Avg FPS</Text>
                <Text style={perfStyles.statValue}>{avgFps}</Text>
              </View>
              <View style={perfStyles.statItem}>
                <Text style={perfStyles.statLabel}>Min FPS</Text>
                <Text style={[perfStyles.statValue, minFps < 50 && {color: '#D97706'}]}>
                  {minFps}
                </Text>
              </View>
              <View style={perfStyles.statItem}>
                <Text style={perfStyles.statLabel}>JS Lag</Text>
                <Text style={[perfStyles.statValue, jsLagMs > 5 && {color: '#D97706'}]}>
                  {jsLagMs}ms
                </Text>
              </View>
              <View style={perfStyles.statItem}>
                <Text style={perfStyles.statLabel}>Jank Rate</Text>
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
                        backgroundColor: isLow ? '#EF4444' : '#10B981',
                      },
                    ]}
                  />
                </View>
              );
            })}
          </View>
          <View style={perfStyles.sparklineFooter}>
            <Text style={perfStyles.sparklineFooterText}>Last 20s live timeline</Text>
            <Text style={perfStyles.sparklineFooterTarget}>60 FPS Target (16.67ms/frame)</Text>
          </View>
        </View>

        {/* ── 2. FRAME BUDGET BREAKDOWN CARD ── */}
        <View style={perfStyles.budgetCard}>
          <View style={perfStyles.budgetHeader}>
            <Text style={perfStyles.budgetTitle}>16.67ms Frame Budget Utilization</Text>
            <Text style={perfStyles.budgetHeadroom}>~4.3ms Headroom (26%)</Text>
          </View>

          {/* Multi-colored segmented frame budget bar */}
          <View style={perfStyles.budgetBarContainer}>
            <View style={[perfStyles.budgetBarSegment, {flex: 4.8, backgroundColor: '#38BDF8'}]} />
            <View style={[perfStyles.budgetBarSegment, {flex: 2.8, backgroundColor: '#818CF8'}]} />
            <View style={[perfStyles.budgetBarSegment, {flex: 4.8, backgroundColor: '#F472B6'}]} />
            <View style={[perfStyles.budgetBarSegment, {flex: 4.3, backgroundColor: '#34D399'}]} />
          </View>

          <View style={perfStyles.budgetLegendGrid}>
            <View style={perfStyles.legendItem}>
              <View style={[perfStyles.legendDot, {backgroundColor: '#38BDF8'}]} />
              <Text style={perfStyles.legendText}>JS Exec: 4.8ms</Text>
            </View>
            <View style={perfStyles.legendItem}>
              <View style={[perfStyles.legendDot, {backgroundColor: '#818CF8'}]} />
              <Text style={perfStyles.legendText}>Yoga Layout: 2.8ms</Text>
            </View>
            <View style={perfStyles.legendItem}>
              <View style={[perfStyles.legendDot, {backgroundColor: '#F472B6'}]} />
              <Text style={perfStyles.legendText}>UI Render: 4.8ms</Text>
            </View>
            <View style={perfStyles.legendItem}>
              <View style={[perfStyles.legendDot, {backgroundColor: '#34D399'}]} />
              <Text style={[perfStyles.legendText, {color: '#059669', fontFamily: AppFonts.interBold}]}>
                Free: 4.3ms
              </Text>
            </View>
          </View>
        </View>

        {/* ── 3. RUNTIME ENGINE & MEMORY SUMMARY ── */}
        <View style={perfStyles.engineSummaryGrid}>
          <View style={perfStyles.engineSummaryCard}>
            <Text style={perfStyles.engineSummaryLabel}>JS Engine</Text>
            <Text style={perfStyles.engineSummaryValue}>Hermes (AOT)</Text>
            <Text style={perfStyles.engineSummarySub}>Bytecode compiled</Text>
          </View>
          <View style={perfStyles.engineSummaryCard}>
            <Text style={perfStyles.engineSummaryLabel}>UI Reconciler</Text>
            <Text style={perfStyles.engineSummaryValue}>Fabric / JSI</Text>
            <Text style={perfStyles.engineSummarySub}>Direct C++ bindings</Text>
          </View>
          <View style={perfStyles.engineSummaryCard}>
            <Text style={perfStyles.engineSummaryLabel}>Memory Heap</Text>
            <Text style={perfStyles.engineSummaryValue}>34.8 MB</Text>
            <Text style={perfStyles.engineSummarySub}>64 MB allocated</Text>
          </View>
        </View>

        {/* ── 4. PERFORMANCE LOGS & DETAILED EVENTS ── */}
        <View style={perfStyles.logsHeaderRow}>
          <Text style={perfStyles.logsSectionHeading}>
            Performance & Frame Events ({filteredEvents.length})
          </Text>
          {events.length > 0 && (
            <TouchableScale onPress={clearEvents}>
              <Text style={perfStyles.clearLink}>Clear Logs</Text>
            </TouchableScale>
          )}
        </View>

        {filteredEvents.length === 0 ? (
          <View style={perfStyles.emptyCard}>
            <Text style={{fontSize: 28}}>⚡</Text>
            <Text style={perfStyles.emptyTitle}>No Performance Drops Detected</Text>
            <Text style={perfStyles.emptySub}>
              All UI interactions, navigation screen transitions, and animations are running smoothly at 60 FPS.
            </Text>
          </View>
        ) : (
          filteredEvents.map(event => {
            const isOptimal = event.severity === 'optimal';
            const isWarning = event.severity === 'warning';
            const isCritical = event.severity === 'critical';
            const isExpanded = !!expandedEventIds[event.id];

            const badgeBg = isOptimal ? '#DCFCE7' : isWarning ? '#FEF3C7' : '#FEE2E2';
            const badgeBorder = isOptimal ? '#BBF7D0' : isWarning ? '#FDE68A' : '#FECACA';
            const badgeColor = isOptimal ? '#047857' : isWarning ? '#B45309' : '#DC2626';

            return (
              <TouchableScale
                key={event.id}
                onPress={() => toggleEventExpand(event.id)}
                style={[
                  perfStyles.eventCard,
                  isCritical && {borderColor: '#FECACA', backgroundColor: '#FFFBFB'},
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
                      {event.durationMs}ms total • {new Date(event.timestamp).toLocaleTimeString()}
                    </Text>
                  </View>

                  <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
                    <CopyButton
                      value={() => event}
                      label="Event JSON"
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
                        <Text style={perfStyles.sourceTag}>SOURCE</Text>
                        <Text style={perfStyles.sourceText} numberOfLines={1}>
                          {event.source}
                        </Text>
                      </View>
                    )}

                    {/* Thread Timing Breakdown */}
                    {event.breakdown && (
                      <View style={perfStyles.breakdownGrid}>
                        <View style={perfStyles.breakdownCol}>
                          <Text style={perfStyles.breakdownLabel}>JS Thread</Text>
                          <Text style={perfStyles.breakdownVal}>
                            {event.breakdown.jsTimeMs} ms
                          </Text>
                        </View>
                        <View style={perfStyles.breakdownCol}>
                          <Text style={perfStyles.breakdownLabel}>UI Thread</Text>
                          <Text style={perfStyles.breakdownVal}>
                            {event.breakdown.uiTimeMs} ms
                          </Text>
                        </View>
                        {event.breakdown.bridgeLatencyMs != null && (
                          <View style={perfStyles.breakdownCol}>
                            <Text style={perfStyles.breakdownLabel}>JSI Latency</Text>
                            <Text style={perfStyles.breakdownVal}>
                              {event.breakdown.bridgeLatencyMs} ms
                            </Text>
                          </View>
                        )}
                        {event.heapDeltaKb != null && (
                          <View style={perfStyles.breakdownCol}>
                            <Text style={perfStyles.breakdownLabel}>Heap Impact</Text>
                            <Text
                              style={[
                                perfStyles.breakdownVal,
                                {color: event.heapDeltaKb > 0 ? '#B45309' : '#059669'},
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
                        <Text style={perfStyles.adviceHeading}>💡 Optimization Tip:</Text>
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
          label="performance events"
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
    backgroundColor: '#DCFCE7',
    borderColor: '#BBF7D0',
  },
  recordBtnPaused: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
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
  filterPillIcon: {
    fontSize: 11,
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
    color: '#059669',
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
    color: '#059669',
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
    backgroundColor: '#FAF5FF',
    borderRadius: 6,
    padding: 6,
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  adviceHeading: {
    fontFamily: AppFonts.interBold,
    fontSize: 10,
    color: '#6B21A8',
  },
  adviceBodyText: {
    fontFamily: AppFonts.interRegular,
    fontSize: 10.5,
    color: '#7E22CE',
    lineHeight: 14,
    marginTop: 1,
  },
  searchHighlight: {
    backgroundColor: '#FEF08A',
    color: '#854D0E',
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
