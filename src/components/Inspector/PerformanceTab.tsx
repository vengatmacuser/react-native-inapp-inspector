import React, {useState, useMemo} from 'react';
import {
  Dimensions,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, {Line, Path, Rect} from 'react-native-svg';
import {AppColors} from '../../styles/AppColors';
import {AppFonts} from '../../styles/AppFonts';
import TouchableScale from '../TouchableScale';
import {
  SpeedometerIcon,
  CpuChipIcon,
  PulseGraphIcon,
  FlameIcon,
  MemoryRamIcon,
  ShareIcon,
  CopyIcon,
  ResetIcon,
  CheckIcon,
} from '../NetworkIcons';
import {usePerformanceMonitor, JankEvent} from '../../helpers/performanceSampler';
import {triggerNativeHaptic} from '../../native/NativeInspector';
import {copyToClipboard} from '../../helpers';
import {showToast} from '../../helpers/toast';
import {useTranslation} from '../../i18n';

const {width: WINDOW_WIDTH} = Dimensions.get('window');
const CHART_WIDTH = WINDOW_WIDTH - 56;
const CHART_HEIGHT = 110;

type PerfSubTab = 'overview' | 'percentiles' | 'engine' | 'janks' | 'benchmark';

export const PerformanceTab: React.FC = () => {
  const {t} = useTranslation();
  const perf = usePerformanceMonitor(true);
  const [activeSubTab, setActiveSubTab] = useState<PerfSubTab>('overview');
  const [jankFilter, setJankFilter] = useState<'all' | 'moderate' | 'severe' | 'frozen'>('all');
  const [selectedJank, setSelectedJank] = useState<JankEvent | null>(null);

  // Generate SVG path for live 50-frame scrolling graph
  const frameSvgPath = useMemo(() => {
    const history = perf.frameHistory;
    if (history.length < 2) return '';

    const maxVal = Math.max(40, ...history);
    const stepX = CHART_WIDTH / (history.length - 1);

    let path = '';
    history.forEach((duration, index) => {
      const x = index * stepX;
      const y = CHART_HEIGHT - (Math.min(duration, maxVal) / maxVal) * (CHART_HEIGHT - 16) - 8;
      if (index === 0) {
        path += `M ${x.toFixed(1)} ${y.toFixed(1)}`;
      } else {
        path += ` L ${x.toFixed(1)} ${y.toFixed(1)}`;
      }
    });
    return path;
  }, [perf.frameHistory]);

  // Filtered Janks list
  const filteredJanks = useMemo(() => {
    if (jankFilter === 'all') return perf.recentJanks;
    return perf.recentJanks.filter(j => j.severity === jankFilter);
  }, [perf.recentJanks, jankFilter]);

  // Export full diagnostic report
  const handleExportReport = async () => {
    try {
      triggerNativeHaptic('light');
      const report = {
        title: 'React Native In-App Inspector Performance Diagnostic Report',
        algorithm: 'New Relic Apdex & Datadog RUM Mobile Vitals',
        generatedAt: new Date().toISOString(),
        sessionDurationSeconds: perf.sessionDurationSec,
        engine: perf.memory.engine,
        displayRefreshRate: `${perf.refreshRateHz}Hz`,
        healthScore: `${perf.healthScore}/100 (${perf.healthStatus})`,
        apdex: {
          score: perf.apdexScore,
          status: perf.apdexStatus,
          targetThresholdT: '16.6ms',
          satisfiedFrames: perf.satisfiedCount,
          toleratingSlowFrames: perf.toleratingCount,
          frustratedFrozenFrames: perf.frustratedCount,
        },
        percentiles: perf.percentiles,
        datadogVitals: {
          slowFrames: perf.toleratingCount,
          frozenFrames: perf.frustratedCount,
          longTasksOver50ms: perf.longTaskCount,
        },
        distribution: perf.distribution,
        metrics: {
          currentFps: perf.fps,
          averageFps: perf.avgFps,
          minimumFps: perf.minFps,
          maximumFps: perf.maxFps,
          currentFrameDurationMs: `${perf.frameDurationMs}ms`,
          targetFrameDurationMs: '16.6ms',
          headroomRemainingMs: `${perf.budgetHeadroomMs}ms`,
          jankFramesCount: perf.jankCount,
          frozenFramesCount: perf.frozenCount,
          jankRatio: `${perf.jankPercent}%`,
          jsEventLoopLagMs: `${perf.jsEventLoopLagMs}ms`,
          averageJsLagMs: `${perf.avgJsLagMs}ms`,
          peakJsLagMs: `${perf.peakJsLagMs}ms`,
        },
        memory: {
          usedHeapMb: `${perf.memory.usedHeapMb} MB`,
          totalAllocatedMb: `${perf.memory.totalAllocMb} MB`,
          peakHeapMb: `${perf.memory.peakHeapMb} MB`,
          gcCollections: perf.memory.gcCount ?? 'N/A',
          gcCpuTimeMs: perf.memory.gcTimeMs ?? 'N/A',
        },
        engineDetails: perf.engineDetails,
        recentJankEvents: perf.recentJanks,
      };

      const markdown = `## ⚡ RN In-App Inspector Performance Report (Datadog & New Relic)
- **Health Score**: ${perf.healthScore}/100 (${perf.healthStatus})
- **Apdex Score**: ${perf.apdexScore} (${perf.apdexStatus}) [T=16.6ms]
- **Percentiles**: p50: ${perf.percentiles.p50Ms}ms | p90: ${perf.percentiles.p90Ms}ms | p95: ${perf.percentiles.p95Ms}ms | p99: ${perf.percentiles.p99Ms}ms
- **Vitals Breakdown**: ${perf.satisfiedCount} Satisfied | ${perf.toleratingCount} Slow | ${perf.frustratedCount} Frozen | ${perf.longTaskCount} Long Tasks
- **FPS**: ${perf.fps} current | ${perf.avgFps} avg | ${perf.minFps} min | ${perf.maxFps} max
- **JS Event Loop Lag**: ${perf.jsEventLoopLagMs}ms (Avg: ${perf.avgJsLagMs}ms, Peak: ${perf.peakJsLagMs}ms)
- **Memory**: ${perf.memory.usedHeapMb} MB / ${perf.memory.totalAllocMb} MB (Peak: ${perf.memory.peakHeapMb} MB)
- **Engine**: ${perf.memory.engine}
- **Session Duration**: ${perf.sessionDurationSec}s`;

      await Share.share({
        title: t('perf.title', 'Performance & FPS Profiler Studio'),
        message: `${markdown}\n\n\`\`\`json\n${JSON.stringify(report, null, 2)}\n\`\`\``,
      });
    } catch {
      showToast(t('perf.shareUnavailable', 'Share unavailable'));
    }
  };

  const handleCopyReport = () => {
    triggerNativeHaptic('light');
    const summary = `⚡ Performance: ${perf.healthScore}/100 (${perf.healthStatus}) | Apdex: ${perf.apdexScore} | ${perf.fps} FPS (Avg ${perf.avgFps}) | p95: ${perf.percentiles.p95Ms}ms | JS Lag: ${perf.jsEventLoopLagMs}ms | Datadog Vitals: ${perf.satisfiedCount}S / ${perf.toleratingCount}T / ${perf.frustratedCount}F / ${perf.longTaskCount}LT`;
    copyToClipboard(summary, t('perf.title', 'Performance Summary'));
    showToast(t('perf.summaryCopied', 'Performance summary copied to clipboard'));
  };

  // Color tokens
  const healthColor =
    perf.healthStatus === 'EXCELLENT'
      ? AppColors.green600
      : perf.healthStatus === 'GOOD'
      ? AppColors.sky600
      : perf.healthStatus === 'FAIR'
      ? AppColors.amber500
      : AppColors.red500;

  const fpsColor =
    perf.fps >= 55
      ? AppColors.green600
      : perf.fps >= 40
      ? AppColors.amber500
      : AppColors.red500;

  const lagColor =
    perf.jsEventLoopLagMs <= 4
      ? AppColors.green600
      : perf.jsEventLoopLagMs <= 20
      ? AppColors.amber500
      : AppColors.red500;

  return (
    <ScrollView
      style={styles.perfContainer}
      contentContainerStyle={styles.perfContent}
      showsVerticalScrollIndicator={false}>
      {/* ─── Top Control Toolbar ─── */}
      <View style={styles.topToolbar}>
        <View style={styles.engineBadgeRow}>
          <View style={[styles.enginePill, {backgroundColor: `${AppColors.purple}14`, borderColor: `${AppColors.purple}30`}]}>
            <CpuChipIcon size={12} color={AppColors.purple} />
            <Text style={[styles.enginePillText, {color: AppColors.purple}]}>
              {perf.memory.engine}
            </Text>
          </View>
          <View style={[styles.enginePill, {backgroundColor: `${AppColors.sky600}14`, borderColor: `${AppColors.sky600}30`}]}>
            <SpeedometerIcon size={12} color={AppColors.sky600} />
            <Text style={[styles.enginePillText, {color: AppColors.sky600}]}>
              {t('perf.target60Fps', '60 FPS Target')}
            </Text>
          </View>
        </View>

        <View style={styles.topActionsRow}>
          <TouchableScale
            onPress={() => {
              triggerNativeHaptic('light');
              perf.triggerGC();
              showToast(t('perf.gcTriggered', 'Garbage collection triggered'));
            }}
            style={styles.topActionBtn}
            accessibilityLabel={t('perf.triggerGc', 'GC')}>
            <FlameIcon size={12} color={AppColors.amber500} />
            <Text style={[styles.topActionBtnText, {color: AppColors.amber500}]}>
              {t('perf.triggerGc', 'GC')}
            </Text>
          </TouchableScale>

          <TouchableScale
            onPress={() => {
              triggerNativeHaptic('light');
              perf.resetStats();
              showToast(t('perf.statsReset', 'Performance counters reset'));
            }}
            style={styles.topActionBtn}
            accessibilityLabel={t('perf.resetStats', 'Reset')}>
            <ResetIcon size={12} color={AppColors.grayText} />
          </TouchableScale>

          <TouchableScale
            onPress={handleCopyReport}
            style={styles.topActionBtn}
            accessibilityLabel={t('perf.copySummary', 'Copy')}>
            <CopyIcon size={12} color={AppColors.grayTextStrong} />
          </TouchableScale>

          <TouchableScale
            onPress={handleExportReport}
            style={[styles.topActionBtn, {backgroundColor: `${AppColors.purple}14`, borderColor: `${AppColors.purple}35`}]}
            accessibilityLabel={t('perf.exportReport', 'Export')}>
            <ShareIcon size={12} color={AppColors.purple} />
            <Text style={[styles.topActionBtnText, {color: AppColors.purple}]}>
              {t('perf.exportReport', 'Export')}
            </Text>
          </TouchableScale>
        </View>
      </View>

      {/* ─── Hero Diagnostic Health Scorecard ─── */}
      <View style={styles.heroScoreCard}>
        <View style={styles.scoreRow}>
          <View style={styles.scoreCircleWrapper}>
            <View style={[styles.scoreCircle, {borderColor: healthColor, backgroundColor: `${healthColor}12`}]}>
              <Text style={[styles.scoreNumber, {color: healthColor}]}>
                {perf.healthScore}
              </Text>
              <Text style={styles.scoreMax}>/100</Text>
            </View>
          </View>

          <View style={styles.scoreDetails}>
            <View style={styles.scoreHeaderRow}>
              <Text style={[styles.scoreStatusLabel, {color: healthColor}]}>
                {perf.healthStatus === 'EXCELLENT'
                  ? t('perf.statusExcellent', 'EXCELLENT')
                  : perf.healthStatus === 'GOOD'
                  ? t('perf.statusGood', 'GOOD')
                  : perf.healthStatus === 'FAIR'
                  ? t('perf.statusFair', 'FAIR')
                  : t('perf.statusPoor', 'POOR')}
              </Text>
              <View style={[styles.liveDotPill, {backgroundColor: `${fpsColor}18`}]}>
                <View style={[styles.liveDot, {backgroundColor: fpsColor}]} />
                <Text style={[styles.liveDotText, {color: fpsColor}]}>
                  {t('perf.liveApm', 'LIVE APM')}
                </Text>
              </View>
            </View>
            <Text style={styles.scoreDesc}>
              {perf.healthScore >= 88
                ? t('perf.descExcellent', 'UI and JS threads are buttery smooth. Zero performance bottlenecks detected.')
                : perf.healthScore >= 72
                ? t('perf.descGood', 'Good performance with occasional frame drops during heavy operations.')
                : t('perf.descPoor', 'Performance jank detected. JS event loop is being blocked by synchronous tasks.')}
            </Text>
            <View style={styles.sessionMetaRow}>
              <Text style={styles.sessionDurationText}>
                ⏱️ {t('perf.session', 'Session')}: {perf.sessionDurationSec}s
              </Text>
              <View style={[styles.apdexBadge, {backgroundColor: `${healthColor}15`}]}>
                <Text style={[styles.apdexBadgeText, {color: healthColor}]}>
                  {t('perf.apdex', 'Apdex')}: {perf.apdexScore} ({perf.apdexStatus})
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* 4-Metric Grid */}
        <View style={styles.metricGrid}>
          {/* Card 1: FPS */}
          <View style={styles.metricCard}>
            <View style={styles.metricCardHeader}>
              <SpeedometerIcon size={13} color={fpsColor} />
              <Text style={styles.metricCardLabel}>{t('perf.uiFps', 'UI FPS')}</Text>
            </View>
            <Text style={[styles.metricCardValue, {color: fpsColor}]}>
              {perf.fps}
            </Text>
            <Text style={styles.metricCardSub}>
              {t('perf.avg', 'Avg')}: {perf.avgFps} • {t('perf.min', 'Min')}: {perf.minFps}
            </Text>
          </View>

          {/* Card 2: Frame Time */}
          <View style={styles.metricCard}>
            <View style={styles.metricCardHeader}>
              <PulseGraphIcon size={13} color={AppColors.sky600} />
              <Text style={styles.metricCardLabel}>{t('perf.frameTime', 'Frame Time')}</Text>
            </View>
            <Text style={[styles.metricCardValue, {color: AppColors.sky600}]}>
              {perf.frameDurationMs}
              <Text style={styles.metricUnit}>ms</Text>
            </Text>
            <Text style={styles.metricCardSub}>
              {t('perf.target', 'Target')}: 16.6ms (60fps)
            </Text>
          </View>

          {/* Card 3: JS Event Loop Lag */}
          <View style={styles.metricCard}>
            <View style={styles.metricCardHeader}>
              <CpuChipIcon size={13} color={lagColor} />
              <Text style={styles.metricCardLabel}>{t('perf.jsThreadLag', 'JS Thread Lag')}</Text>
            </View>
            <Text style={[styles.metricCardValue, {color: lagColor}]}>
              {perf.jsEventLoopLagMs}
              <Text style={styles.metricUnit}>ms</Text>
            </Text>
            <Text style={styles.metricCardSub}>
              {t('perf.peak', 'Peak')}: {perf.peakJsLagMs}ms
            </Text>
          </View>

          {/* Card 4: JS Heap */}
          <View style={styles.metricCard}>
            <View style={styles.metricCardHeader}>
              <MemoryRamIcon size={13} color={AppColors.purple} />
              <Text style={styles.metricCardLabel}>{t('perf.jsHeap', 'JS Heap')}</Text>
            </View>
            <Text style={[styles.metricCardValue, {color: AppColors.purple}]}>
              {perf.memory.isAvailable ? (
                <>
                  {perf.memory.usedHeapMb}
                  <Text style={styles.metricUnit}>MB</Text>
                </>
              ) : (
                <Text style={{fontSize: 12, color: AppColors.grayTextWeak}}>N/A</Text>
              )}
            </Text>
            <Text style={styles.metricCardSub} numberOfLines={1}>
              {perf.memory.isAvailable
                ? `${t('perf.peak', 'Peak')}: ${perf.memory.peakHeapMb}MB`
                : t('perf.engineProtected', 'Engine Protected')}
            </Text>
          </View>
        </View>

        {/* ─── 16.6ms Vsync Frame Budget Headroom Bar ─── */}
        <View style={styles.budgetBarContainer}>
          <View style={styles.budgetHeaderRow}>
            <Text style={styles.budgetLabel}>{t('perf.vsyncBudgetConsumption', '16.6ms Vsync Budget Consumption')}</Text>
            <Text style={[styles.budgetPercentText, {color: perf.frameDurationMs <= 16.6 ? AppColors.green600 : AppColors.amber500}]}>
              {perf.frameDurationMs}ms ({perf.budgetUsedPercent}%)
            </Text>
          </View>
          <View style={styles.budgetTrack}>
            <View
              style={[
                styles.budgetFill,
                {
                  width: `${Math.min(100, (perf.frameDurationMs / 16.6) * 100)}%`,
                  backgroundColor:
                    perf.frameDurationMs <= 16.6
                      ? AppColors.green600
                      : perf.frameDurationMs <= 25
                      ? AppColors.amber500
                      : AppColors.red500,
                },
              ]}
            />
          </View>
          <View style={styles.budgetFooterRow}>
            <Text style={styles.budgetFooterText}>
              {perf.budgetHeadroomMs > 0
                ? `⚡ +${perf.budgetHeadroomMs}ms ${t('perf.budgetHeadroomAvailable', 'budget headroom available')}`
                : `⚠️ ${t('perf.budgetExceededBy', 'Budget exceeded by')} ${(perf.frameDurationMs - 16.6).toFixed(1)}ms`}
            </Text>
            <Text style={styles.budgetTargetText}>{t('perf.budgetTarget', 'Budget: 16.6ms')}</Text>
          </View>
        </View>
      </View>

      {/* ─── Interactive Sub-Tabs Navigation Bar ─── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.subTabsContent}
        style={styles.subTabsScrollView}>
        <TouchableOpacity
          onPress={() => {
            triggerNativeHaptic('light');
            setActiveSubTab('overview');
          }}
          style={[styles.subTabPill, activeSubTab === 'overview' && styles.subTabPillActive]}>
          <SpeedometerIcon size={12} color={activeSubTab === 'overview' ? AppColors.purple : AppColors.grayTextWeak} />
          <Text style={[styles.subTabPillText, activeSubTab === 'overview' && styles.subTabPillTextActive]}>
            {t('perf.tabOverview', 'Overview & Vitals')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            triggerNativeHaptic('light');
            setActiveSubTab('percentiles');
          }}
          style={[styles.subTabPill, activeSubTab === 'percentiles' && styles.subTabPillActive]}>
          <PulseGraphIcon size={12} color={activeSubTab === 'percentiles' ? AppColors.purple : AppColors.grayTextWeak} />
          <Text style={[styles.subTabPillText, activeSubTab === 'percentiles' && styles.subTabPillTextActive]}>
            {t('perf.tabPercentiles', 'Percentiles & Latency')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            triggerNativeHaptic('light');
            setActiveSubTab('engine');
          }}
          style={[styles.subTabPill, activeSubTab === 'engine' && styles.subTabPillActive]}>
          <CpuChipIcon size={12} color={activeSubTab === 'engine' ? AppColors.purple : AppColors.grayTextWeak} />
          <Text style={[styles.subTabPillText, activeSubTab === 'engine' && styles.subTabPillTextActive]}>
            {t('perf.tabEngine', 'Engine & Heap')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            triggerNativeHaptic('light');
            setActiveSubTab('janks');
          }}
          style={[styles.subTabPill, activeSubTab === 'janks' && styles.subTabPillActive]}>
          <View style={[styles.jankCountBadge, {backgroundColor: perf.recentJanks.length > 0 ? `${AppColors.red500}25` : `${AppColors.green600}25`}]}>
            <Text style={[styles.jankCountBadgeText, {color: perf.recentJanks.length > 0 ? AppColors.red500 : AppColors.green600}]}>
              {perf.recentJanks.length}
            </Text>
          </View>
          <Text style={[styles.subTabPillText, activeSubTab === 'janks' && styles.subTabPillTextActive]}>
            {t('perf.tabJanks', 'Janks Log')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            triggerNativeHaptic('light');
            setActiveSubTab('benchmark');
          }}
          style={[styles.subTabPill, activeSubTab === 'benchmark' && styles.subTabPillActive]}>
          <FlameIcon size={12} color={activeSubTab === 'benchmark' ? AppColors.amber500 : AppColors.grayTextWeak} />
          <Text style={[styles.subTabPillText, activeSubTab === 'benchmark' && styles.subTabPillTextActive]}>
            {t('perf.tabBenchmark', 'Stress Tests')}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ─── TAB 1: OVERVIEW & VITALS ─── */}
      {activeSubTab === 'overview' && (
        <>
          {/* Real-time Frame Duration Distribution Histogram */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <PulseGraphIcon size={15} color={AppColors.sky600} />
                <Text style={styles.sectionTitle}>{t('perf.distributionTitle', 'Frame Duration Distribution (Histogram)')}</Text>
              </View>
              <Text style={styles.histogramTotalText}>
                {perf.distribution.totalSamples} {t('perf.framesSampled', 'frames sampled')}
              </Text>
            </View>

            <View style={styles.histogramList}>
              {/* Row 1: Ultra Smooth */}
              <View style={styles.histogramRow}>
                <View style={styles.histogramLabelCol}>
                  <Text style={styles.histogramLabel}>≤16.6ms (60+ FPS)</Text>
                  <Text style={styles.histogramSub}>{t('perf.ultraSmooth', 'Ultra-smooth')}</Text>
                </View>
                <View style={styles.histogramTrack}>
                  <View
                    style={[
                      styles.histogramFill,
                      {
                        width: `${Math.min(100, ((perf.distribution.ultraSmoothCount / Math.max(1, perf.distribution.totalSamples)) * 100))}%`,
                        backgroundColor: AppColors.green600,
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.histogramCountText, {color: AppColors.green600}]}>
                  {perf.distribution.ultraSmoothCount} ({Math.round((perf.distribution.ultraSmoothCount / Math.max(1, perf.distribution.totalSamples)) * 100)}%)
                </Text>
              </View>

              {/* Row 2: Smooth (16.7 - 24ms) */}
              <View style={styles.histogramRow}>
                <View style={styles.histogramLabelCol}>
                  <Text style={styles.histogramLabel}>16.7–24ms (40–60 FPS)</Text>
                  <Text style={styles.histogramSub}>{t('perf.normalUiLayout', 'Normal UI Layout')}</Text>
                </View>
                <View style={styles.histogramTrack}>
                  <View
                    style={[
                      styles.histogramFill,
                      {
                        width: `${Math.min(100, ((perf.distribution.smoothCount / Math.max(1, perf.distribution.totalSamples)) * 100))}%`,
                        backgroundColor: AppColors.sky600,
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.histogramCountText, {color: AppColors.sky600}]}>
                  {perf.distribution.smoothCount} ({Math.round((perf.distribution.smoothCount / Math.max(1, perf.distribution.totalSamples)) * 100)}%)
                </Text>
              </View>

              {/* Row 3: Degraded (24.1 - 34ms) */}
              <View style={styles.histogramRow}>
                <View style={styles.histogramLabelCol}>
                  <Text style={styles.histogramLabel}>24.1–34ms (30–40 FPS)</Text>
                  <Text style={styles.histogramSub}>{t('perf.minorVariance', 'Minor Variance')}</Text>
                </View>
                <View style={styles.histogramTrack}>
                  <View
                    style={[
                      styles.histogramFill,
                      {
                        width: `${Math.min(100, ((perf.distribution.degradedCount / Math.max(1, perf.distribution.totalSamples)) * 100))}%`,
                        backgroundColor: AppColors.amber500,
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.histogramCountText, {color: AppColors.amber500}]}>
                  {perf.distribution.degradedCount} ({Math.round((perf.distribution.degradedCount / Math.max(1, perf.distribution.totalSamples)) * 100)}%)
                </Text>
              </View>

              {/* Row 4: Stuttered (34.1 - 66.6ms) */}
              <View style={styles.histogramRow}>
                <View style={styles.histogramLabelCol}>
                  <Text style={styles.histogramLabel}>34.1–66ms (15–30 FPS)</Text>
                  <Text style={styles.histogramSub}>{t('perf.droppedFrame', 'Dropped Frame')}</Text>
                </View>
                <View style={styles.histogramTrack}>
                  <View
                    style={[
                      styles.histogramFill,
                      {
                        width: `${Math.min(100, ((perf.distribution.stutteredCount / Math.max(1, perf.distribution.totalSamples)) * 100))}%`,
                        backgroundColor: AppColors.red500,
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.histogramCountText, {color: AppColors.red500}]}>
                  {perf.distribution.stutteredCount} ({Math.round((perf.distribution.stutteredCount / Math.max(1, perf.distribution.totalSamples)) * 100)}%)
                </Text>
              </View>

              {/* Row 5: Frozen (> 66.6ms) */}
              <View style={styles.histogramRow}>
                <View style={styles.histogramLabelCol}>
                  <Text style={styles.histogramLabel}>&gt;66.6ms (&lt;15 FPS)</Text>
                  <Text style={styles.histogramSub}>{t('perf.frozenFrame', 'Frozen Frame')}</Text>
                </View>
                <View style={styles.histogramTrack}>
                  <View
                    style={[
                      styles.histogramFill,
                      {
                        width: `${Math.min(100, ((perf.distribution.frozenCount / Math.max(1, perf.distribution.totalSamples)) * 100))}%`,
                        backgroundColor: '#881337',
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.histogramCountText, {color: '#881337'}]}>
                  {perf.distribution.frozenCount} ({Math.round((perf.distribution.frozenCount / Math.max(1, perf.distribution.totalSamples)) * 100)}%)
                </Text>
              </View>
            </View>
          </View>

          {/* Datadog RUM & New Relic Apdex Vitals (At Bottom of Overview) */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <SpeedometerIcon size={15} color={AppColors.purple} />
                <Text style={styles.sectionTitle}>{t('perf.datadogVitalsTitle', 'Datadog & New Relic APM Vitals')}</Text>
              </View>
              <View style={[styles.targetBadge, {backgroundColor: `${healthColor}18`}]}>
                <Text style={[styles.targetBadgeText, {color: healthColor}]}>
                  {t('perf.apdex', 'Apdex')}: {perf.apdexScore} ({perf.apdexStatus})
                </Text>
              </View>
            </View>

            <Text style={styles.sectionDesc}>
              {t('perf.datadogVitalsDesc', 'Real-time Mobile APM metrics computed via official New Relic Apdex (T=16.6ms) and Datadog RUM Mobile Vitals algorithms.')}
            </Text>

            <View style={styles.datadogGrid}>
              <View style={[styles.datadogPill, {borderColor: `${AppColors.green600}30`, backgroundColor: `${AppColors.green600}10`}]}>
                <Text style={[styles.datadogCount, {color: AppColors.green600}]}>{perf.satisfiedCount}</Text>
                <Text style={styles.datadogLabel}>{t('perf.satisfiedFrames', 'Satisfied (≤16.6ms)')}</Text>
              </View>

              <View style={[styles.datadogPill, {borderColor: `${AppColors.amber500}30`, backgroundColor: `${AppColors.amber500}10`}]}>
                <Text style={[styles.datadogCount, {color: AppColors.amber500}]}>{perf.toleratingCount}</Text>
                <Text style={styles.datadogLabel}>{t('perf.slowFrames', 'Slow Frames (17-66ms)')}</Text>
              </View>

              <View style={[styles.datadogPill, {borderColor: `${AppColors.red500}30`, backgroundColor: `${AppColors.red500}10`}]}>
                <Text style={[styles.datadogCount, {color: AppColors.red500}]}>{perf.frustratedCount}</Text>
                <Text style={styles.datadogLabel}>{t('perf.frozenFrames', 'Frozen Frames (>66ms)')}</Text>
              </View>

              <View style={[styles.datadogPill, {borderColor: `${AppColors.purple}30`, backgroundColor: `${AppColors.purple}10`}]}>
                <Text style={[styles.datadogCount, {color: AppColors.purple}]}>{perf.longTaskCount}</Text>
                <Text style={styles.datadogLabel}>{t('perf.longTasks', 'JS Long Tasks (>50ms)')}</Text>
              </View>
            </View>
          </View>
        </>
      )}

      {/* ─── TAB 2: PERCENTILES & LATENCY TELEMETRY ─── */}
      {activeSubTab === 'percentiles' && (
        <>
          {/* Latency Percentiles Card */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <PulseGraphIcon size={15} color={AppColors.purple} />
                <Text style={styles.sectionTitle}>{t('perf.percentilesTitle', 'Latency Percentile Matrix (p50 / p90 / p95 / p99)')}</Text>
              </View>
              <View style={styles.targetBadge}>
                <Text style={styles.targetBadgeText}>{t('perf.percentilesSubtitle', 'Computed from Live Frames')}</Text>
              </View>
            </View>
            <Text style={styles.sectionDesc}>
              {t('perf.percentilesDesc', 'Exact mathematical distribution of frame times sampled from the active rolling window.')}
            </Text>

            <View style={styles.percentileGrid}>
              <View style={styles.percentileCard}>
                <Text style={styles.percentileTag}>{t('perf.p50Label', 'p50 (Median)')}</Text>
                <Text style={[styles.percentileVal, {color: AppColors.green600}]}>
                  {perf.percentiles.p50Ms}
                  <Text style={styles.percentileUnit}>ms</Text>
                </Text>
                <Text style={styles.percentileSub}>{t('perf.p50Sub', '50% of frames faster')}</Text>
              </View>

              <View style={styles.percentileCard}>
                <Text style={styles.percentileTag}>{t('perf.p90Label', 'p90')}</Text>
                <Text style={[styles.percentileVal, {color: AppColors.sky600}]}>
                  {perf.percentiles.p90Ms}
                  <Text style={styles.percentileUnit}>ms</Text>
                </Text>
                <Text style={styles.percentileSub}>{t('perf.p90Sub', '90% of frames faster')}</Text>
              </View>

              <View style={styles.percentileCard}>
                <Text style={styles.percentileTag}>{t('perf.p95Label', 'p95')}</Text>
                <Text style={[styles.percentileVal, {color: perf.percentiles.p95Ms <= 20 ? AppColors.green600 : AppColors.amber500}]}>
                  {perf.percentiles.p95Ms}
                  <Text style={styles.percentileUnit}>ms</Text>
                </Text>
                <Text style={styles.percentileSub}>{t('perf.p95Sub', '95% of frames faster')}</Text>
              </View>

              <View style={styles.percentileCard}>
                <Text style={styles.percentileTag}>{t('perf.p99Label', 'p99 (Tail Latency)')}</Text>
                <Text style={[styles.percentileVal, {color: perf.percentiles.p99Ms <= 33 ? AppColors.amber500 : AppColors.red500}]}>
                  {perf.percentiles.p99Ms}
                  <Text style={styles.percentileUnit}>ms</Text>
                </Text>
                <Text style={styles.percentileSub}>{t('perf.p99Sub', 'Worst 1% outlier frames')}</Text>
              </View>
            </View>
          </View>

          {/* Live SVG Graph */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <PulseGraphIcon size={15} color={AppColors.purple} />
                <Text style={styles.sectionTitle}>{t('perf.realtimeFrameTimes', 'Real-Time Frame Times (50 Frames)')}</Text>
              </View>
              <View style={styles.targetBadge}>
                <Text style={styles.targetBadgeText}>{t('perf.target60FpsLabel', '16.6ms Target (60fps)')}</Text>
              </View>
            </View>

            <View style={styles.chartWrapper}>
              <Svg width={CHART_WIDTH} height={CHART_HEIGHT} style={styles.chartSvg}>
                <Line
                  x1="0"
                  y1={CHART_HEIGHT - (16.6 / 40) * (CHART_HEIGHT - 16) - 8}
                  x2={CHART_WIDTH}
                  y2={CHART_HEIGHT - (16.6 / 40) * (CHART_HEIGHT - 16) - 8}
                  stroke={AppColors.green600}
                  strokeWidth="1"
                  strokeDasharray="4,4"
                  opacity={0.6}
                />
                <Line
                  x1="0"
                  y1={CHART_HEIGHT - (33.3 / 40) * (CHART_HEIGHT - 16) - 8}
                  x2={CHART_WIDTH}
                  y2={CHART_HEIGHT - (33.3 / 40) * (CHART_HEIGHT - 16) - 8}
                  stroke={AppColors.red500}
                  strokeWidth="1"
                  strokeDasharray="3,3"
                  opacity={0.4}
                />

                {perf.frameHistory.length > 0 &&
                  perf.frameHistory.map((dur, idx) => {
                    const maxVal = Math.max(40, ...perf.frameHistory);
                    const stepX = CHART_WIDTH / Math.max(1, perf.frameHistory.length);
                    const barWidth = Math.max(2, stepX - 1.5);
                    const barHeight = (Math.min(dur, maxVal) / maxVal) * (CHART_HEIGHT - 20);
                    const x = idx * stepX;
                    const y = CHART_HEIGHT - barHeight - 4;
                    const barColor =
                      dur <= 18
                        ? AppColors.green600
                        : dur <= 33
                        ? AppColors.amber500
                        : AppColors.red500;

                    return (
                      <Rect
                        key={idx}
                        x={x}
                        y={y}
                        width={barWidth}
                        height={Math.max(2, barHeight)}
                        rx={1}
                        fill={barColor}
                        opacity={0.75}
                      />
                    );
                  })}

                {frameSvgPath ? (
                  <Path
                    d={frameSvgPath}
                    fill="none"
                    stroke={AppColors.purple}
                    strokeWidth="2"
                  />
                ) : null}
              </Svg>

              <View style={styles.chartAxisRow}>
                <Text style={styles.chartAxisLabel}>{t('perf.past50Frames', '← Past 50 Frames')}</Text>
                <Text style={styles.chartAxisLabel}>{t('perf.nowInstant', 'Now (Instantaneous) →')}</Text>
              </View>
            </View>

            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, {backgroundColor: AppColors.green600}]} />
                <Text style={styles.legendText}>{t('perf.smoothLegend', 'Smooth (<18ms)')}</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, {backgroundColor: AppColors.amber500}]} />
                <Text style={styles.legendText}>{t('perf.jankLegend', 'Jank (18-33ms)')}</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, {backgroundColor: AppColors.red500}]} />
                <Text style={styles.legendText}>{t('perf.frozenLegend', 'Frozen (>33ms)')}</Text>
              </View>
            </View>
          </View>

          {/* JS Thread Responsiveness */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <CpuChipIcon size={15} color={AppColors.sky600} />
                <Text style={styles.sectionTitle}>{t('perf.jsResponsiveness', 'JS Thread Responsiveness')}</Text>
              </View>
              <View style={[styles.targetBadge, {backgroundColor: `${lagColor}14`}]}>
                <Text style={[styles.targetBadgeText, {color: lagColor}]}>
                  {perf.jsEventLoopLagMs <= 2 ? t('perf.instantaneous', '⚡ Instantaneous') : `${perf.jsEventLoopLagMs} ${t('perf.lagUnit', 'ms Lag')}`}
                </Text>
              </View>
            </View>

            <View style={styles.lagBarsRow}>
              {perf.jsLagHistory.map((lagVal, idx) => {
                const barH = Math.min(48, Math.max(4, lagVal * 2.5));
                const barCol =
                  lagVal <= 3
                    ? AppColors.green600
                    : lagVal <= 20
                    ? AppColors.amber500
                    : AppColors.red500;
                return (
                  <View
                    key={idx}
                    style={[
                      styles.lagBar,
                      {
                        height: barH,
                        backgroundColor: barCol,
                      },
                    ]}
                  />
                );
              })}
            </View>

            <View style={styles.lagInfoRow}>
              <Text style={styles.lagInfoText}>
                {t('perf.avgJsQueueLag', 'Average JS Queue Lag')}: <Text style={styles.boldText}>{perf.avgJsLagMs}ms</Text>
              </Text>
              <Text style={styles.lagInfoText}>
                {t('perf.peakLagSpike', 'Peak Lag Spike')}: <Text style={styles.boldText}>{perf.peakJsLagMs}ms</Text>
              </Text>
            </View>
          </View>
        </>
      )}

      {/* ─── TAB 3: ENGINE & MEMORY ARCHITECTURE ─── */}
      {activeSubTab === 'engine' && (
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <MemoryRamIcon size={15} color={AppColors.purple} />
              <Text style={styles.sectionTitle}>{t('perf.engineTelemetryTitle', 'Engine & Runtime Telemetry')}</Text>
            </View>
            <View style={[styles.targetBadge, {backgroundColor: `${AppColors.purple}14`}]}>
              <Text style={[styles.targetBadgeText, {color: AppColors.purple}]}>
                {perf.engineDetails.engineName}
              </Text>
            </View>
          </View>
          <Text style={styles.sectionDesc}>
            {t('perf.engineTelemetryDesc', 'Deep inspection of the active JavaScript Virtual Machine, memory allocations, and React Native architecture.')}
          </Text>

          <View style={styles.engineDetailsTable}>
            <View style={styles.engineDetailRow}>
              <Text style={styles.engineDetailKey}>{t('perf.jsEngine', 'JavaScript Engine')}</Text>
              <Text style={styles.engineDetailVal}>{perf.engineDetails.engineName}</Text>
            </View>

            <View style={styles.engineDetailRow}>
              <Text style={styles.engineDetailKey}>{t('perf.architectureMode', 'Architecture Mode')}</Text>
              <View style={[styles.enginePillMini, {backgroundColor: perf.engineDetails.isFabric ? `${AppColors.green600}18` : `${AppColors.sky600}18`}]}>
                <Text style={[styles.enginePillMiniText, {color: perf.engineDetails.isFabric ? AppColors.green600 : AppColors.sky600}]}>
                  {perf.engineDetails.architectureName}
                </Text>
              </View>
            </View>

            <View style={styles.engineDetailRow}>
              <Text style={styles.engineDetailKey}>{t('perf.turboModulesBridge', 'TurboModules Bridge')}</Text>
              <Text style={[styles.engineDetailVal, {color: perf.engineDetails.isTurboModules ? AppColors.green600 : AppColors.grayTextStrong}]}>
                {perf.engineDetails.isTurboModules ? t('perf.turboModulesEnabled', '⚡ Enabled (JSI Direct)') : t('perf.standardBridge', 'Standard Bridge')}
              </Text>
            </View>

            <View style={styles.engineDetailRow}>
              <Text style={styles.engineDetailKey}>{t('perf.liveHeapSize', 'Live Heap Size')}</Text>
              <Text style={styles.engineDetailVal}>
                {perf.memory.isAvailable ? `${perf.memory.usedHeapMb} MB` : t('perf.engineProtected', 'Protected by Engine')}
              </Text>
            </View>

            <View style={styles.engineDetailRow}>
              <Text style={styles.engineDetailKey}>{t('perf.totalHeapAllocated', 'Total Heap Allocated')}</Text>
              <Text style={styles.engineDetailVal}>
                {perf.memory.isAvailable ? `${perf.memory.totalAllocMb} MB` : t('perf.engineProtected', 'Protected by Engine')}
              </Text>
            </View>

            <View style={styles.engineDetailRow}>
              <Text style={styles.engineDetailKey}>{t('perf.sessionPeakHeap', 'Session Peak Heap')}</Text>
              <Text style={styles.engineDetailVal}>
                {perf.memory.isAvailable ? `${perf.memory.peakHeapMb} MB` : 'N/A'}
              </Text>
            </View>

            <View style={styles.engineDetailRow}>
              <Text style={styles.engineDetailKey}>{t('perf.gcCollections', 'GC Collections')}</Text>
              <Text style={styles.engineDetailVal}>
                {perf.memory.gcCount !== undefined ? `${perf.memory.gcCount} runs` : t('perf.nativeManaged', 'Native Managed')}
              </Text>
            </View>

            <View style={styles.engineDetailRow}>
              <Text style={styles.engineDetailKey}>{t('perf.gcCpuTime', 'GC CPU Time')}</Text>
              <Text style={styles.engineDetailVal}>
                {perf.memory.gcTimeMs !== undefined ? `${perf.memory.gcTimeMs}ms` : t('perf.nativeManaged', 'Native Managed')}
              </Text>
            </View>
          </View>

          {/* Trigger GC Action */}
          <TouchableScale
            onPress={() => {
              triggerNativeHaptic('medium');
              perf.triggerGC();
              showToast(t('perf.invokedHermesGc', 'Invoked Hermes GC cycle'));
            }}
            style={styles.gcActionBtn}>
            <FlameIcon size={16} color={AppColors.amber500} />
            <Text style={styles.gcActionBtnText}>{t('perf.triggerHermesGc', 'Trigger Hermes Garbage Collection')}</Text>
          </TouchableScale>
        </View>
      )}

      {/* ─── TAB 4: JANK & FROZEN FRAMES TIMELINE ─── */}
      {activeSubTab === 'janks' && (
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <FlameIcon size={15} color={AppColors.red500} />
              <Text style={styles.sectionTitle}>{t('perf.jankIncidentLog', 'Jank & Frozen Frame Incident Log')}</Text>
            </View>
            <Text style={styles.jankRatioBadge}>
              {perf.jankCount} {t('perf.janksCount', 'janks')} ({perf.jankPercent}%)
            </Text>
          </View>

          {/* Filter Chips */}
          <View style={styles.jankFilterRow}>
            {(['all', 'moderate', 'severe', 'frozen'] as const).map(flt => (
              <TouchableOpacity
                key={flt}
                onPress={() => {
                  triggerNativeHaptic('light');
                  setJankFilter(flt);
                }}
                style={[styles.jankFilterChip, jankFilter === flt && styles.jankFilterChipActive]}>
                <Text style={[styles.jankFilterChipText, jankFilter === flt && styles.jankFilterChipTextActive]}>
                  {flt === 'all'
                    ? t('perf.allFilter', 'ALL')
                    : flt === 'moderate'
                    ? t('perf.moderateFilter', 'MODERATE')
                    : flt === 'severe'
                    ? t('perf.severeFilter', 'SEVERE')
                    : t('perf.frozenFilter', 'FROZEN')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {filteredJanks.length === 0 ? (
            <View style={styles.emptyJankBox}>
              <CheckIcon size={22} color={AppColors.green600} />
              <Text style={styles.emptyJankTitle}>{t('perf.zeroJanksDetected', 'Zero Janks Detected')}</Text>
              <Text style={styles.emptyJankDesc}>
                {t('perf.zeroJanksDesc', 'All frames rendered smoothly within the target vsync budget.')}
              </Text>
            </View>
          ) : (
            <View style={styles.janksList}>
              {filteredJanks.map(jank => {
                const sevColor =
                  jank.severity === 'frozen'
                    ? AppColors.red500
                    : jank.severity === 'severe'
                    ? AppColors.amber500
                    : AppColors.sky600;

                const isSelected = selectedJank?.id === jank.id;

                return (
                  <TouchableOpacity
                    key={jank.id}
                    onPress={() => setSelectedJank(isSelected ? null : jank)}
                    style={[styles.jankItemRow, isSelected && {borderColor: sevColor}]}>
                    <View style={[styles.jankSevBadge, {backgroundColor: `${sevColor}18`}]}>
                      <Text style={[styles.jankSevText, {color: sevColor}]}>
                        {jank.severity.toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.jankDetailsCol}>
                      <Text style={styles.jankDurationText}>
                        {jank.durationMs}ms ({jank.fps} FPS)
                      </Text>
                      <Text style={styles.jankTimeText}>{jank.timeStr}</Text>
                    </View>
                    <Text style={styles.jankTapHint}>{isSelected ? t('perf.hide', 'Hide') : t('perf.inspect', 'Inspect')}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {selectedJank && (
            <View style={styles.jankInspectorBox}>
              <Text style={styles.jankInspectorTitle}>{t('perf.incidentDiagnostics', 'Incident Diagnostics')}</Text>
              <Text style={styles.jankInspectorDesc}>
                {t('perf.frameTime', 'Frame Time')}: <Text style={styles.boldText}>{selectedJank.durationMs}ms</Text> ({t('perf.target', 'Target')}: 16.6ms).
                {' '}{t('perf.delayedBy', 'Frame delayed by')} {(selectedJank.durationMs - 16.6).toFixed(1)}ms {t('perf.beyondDeadline', 'beyond standard vsync deadline')}.
              </Text>
            </View>
          )}
        </View>
      )}

      {/* ─── TAB 5: BENCHMARKS & STRESS TESTS ─── */}
      {activeSubTab === 'benchmark' && (
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <FlameIcon size={15} color={AppColors.amber500} />
              <Text style={styles.sectionTitle}>{t('perf.stressTitle', 'Interactive Stress Test & Benchmark Suite')}</Text>
            </View>
          </View>
          <Text style={styles.sectionDesc}>
            {t('perf.stressDesc', 'Trigger synchronous workloads or render bursts to watch the live FPS and JS lag meters react dynamically.')}
          </Text>

          <View style={styles.stressButtonsGrid}>
            <TouchableScale
              onPress={() => {
                triggerNativeHaptic('medium');
                perf.runJsStressTest(120);
                showToast(t('perf.jsStressRan', 'Ran 120ms synchronous JS blocking loop'));
              }}
              style={[styles.stressBtn, {backgroundColor: `${AppColors.amber500}14`, borderColor: `${AppColors.amber500}35`}]}>
              <FlameIcon size={16} color={AppColors.amber500} />
              <View style={styles.stressBtnTextBox}>
                <Text style={[styles.stressBtnTitle, {color: AppColors.amber500}]}>
                  {t('perf.jsStressTitle', 'JS Loop Stress (120ms)')}
                </Text>
                <Text style={styles.stressBtnSub}>{t('perf.jsStressSub', 'Simulates heavy compute / blocking synchronous loop')}</Text>
              </View>
            </TouchableScale>

            <TouchableScale
              onPress={() => {
                triggerNativeHaptic('medium');
                perf.runRenderStressTest();
                showToast(t('perf.renderStressRan', 'Fired 25 rapid re-render cycles'));
              }}
              style={[styles.stressBtn, {backgroundColor: `${AppColors.purple}14`, borderColor: `${AppColors.purple}35`}]}>
              <PulseGraphIcon size={16} color={AppColors.purple} />
              <View style={styles.stressBtnTextBox}>
                <Text style={[styles.stressBtnTitle, {color: AppColors.purple}]}>
                  {t('perf.renderStressTitle', 'Re-render Burst (25 frames)')}
                </Text>
                <Text style={styles.stressBtnSub}>{t('perf.renderStressSub', 'Simulates rapid state & layout reconciliation passes')}</Text>
              </View>
            </TouchableScale>
          </View>
        </View>
      )}

      <View style={{height: 36}} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  perfContainer: {
    flex: 1,
    backgroundColor: AppColors.grayBackground,
  },
  perfContent: {
    padding: 12,
    gap: 12,
  },
  topToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 4,
  },
  engineBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 1,
  },
  enginePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3.5,
    borderRadius: 6,
    borderWidth: 1,
  },
  enginePillText: {
    fontFamily: AppFonts.interSemiBold,
    fontSize: 10,
  },
  topActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  topActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: AppColors.grayBorderSecondary,
    backgroundColor: AppColors.grayBackground,
  },
  topActionBtnText: {
    fontFamily: AppFonts.interSemiBold,
    fontSize: 10,
    color: AppColors.grayTextStrong,
  },
  heroScoreCard: {
    backgroundColor: AppColors.white,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: AppColors.grayBorderSecondary,
    gap: 12,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  scoreCircleWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreNumber: {
    fontFamily: AppFonts.interBold,
    fontSize: 22,
    lineHeight: 24,
  },
  scoreMax: {
    fontFamily: AppFonts.interMedium,
    fontSize: 8.5,
    color: AppColors.grayTextWeak,
  },
  scoreDetails: {
    flex: 1,
    gap: 3,
  },
  scoreHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  scoreStatusLabel: {
    fontFamily: AppFonts.interBold,
    fontSize: 15,
    letterSpacing: 0.5,
  },
  liveDotPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  liveDotText: {
    fontFamily: AppFonts.interBold,
    fontSize: 8.5,
  },
  scoreDesc: {
    fontFamily: AppFonts.interRegular,
    fontSize: 11,
    color: AppColors.grayTextWeak,
    lineHeight: 15,
  },
  sessionMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  sessionDurationText: {
    fontFamily: AppFonts.interMedium,
    fontSize: 10,
    color: AppColors.grayTextWeak,
  },
  apdexBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  apdexBadgeText: {
    fontFamily: AppFonts.interBold,
    fontSize: 9,
  },
  metricGrid: {
    flexDirection: 'row',
    gap: 6,
  },
  metricCard: {
    flex: 1,
    backgroundColor: AppColors.grayBackground,
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: AppColors.grayBorderSecondary,
    gap: 2,
  },
  metricCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metricCardLabel: {
    fontFamily: AppFonts.interMedium,
    fontSize: 9.5,
    color: AppColors.grayTextWeak,
  },
  metricCardValue: {
    fontFamily: AppFonts.interBold,
    fontSize: 16,
    lineHeight: 18,
  },
  metricUnit: {
    fontSize: 10,
    fontFamily: AppFonts.interMedium,
    color: AppColors.grayTextWeak,
  },
  metricCardSub: {
    fontFamily: AppFonts.interRegular,
    fontSize: 8.5,
    color: AppColors.grayTextWeak,
  },
  budgetBarContainer: {
    gap: 4,
    backgroundColor: AppColors.grayBackground,
    borderRadius: 8,
    padding: 9,
    borderWidth: 1,
    borderColor: AppColors.grayBorderSecondary,
  },
  budgetHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  budgetLabel: {
    fontFamily: AppFonts.interMedium,
    fontSize: 10,
    color: AppColors.grayTextStrong,
  },
  budgetPercentText: {
    fontFamily: AppFonts.interBold,
    fontSize: 10,
  },
  budgetTrack: {
    height: 6,
    backgroundColor: AppColors.grayBorderSecondary,
    borderRadius: 3,
    overflow: 'hidden',
  },
  budgetFill: {
    height: '100%',
    borderRadius: 3,
  },
  budgetFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  budgetFooterText: {
    fontFamily: AppFonts.interRegular,
    fontSize: 9,
    color: AppColors.grayTextWeak,
  },
  budgetTargetText: {
    fontFamily: AppFonts.interMedium,
    fontSize: 9,
    color: AppColors.grayTextWeak,
  },
  subTabsScrollView: {
    flexGrow: 0,
  },
  subTabsContent: {
    gap: 6,
    paddingVertical: 2,
  },
  subTabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: AppColors.grayBorderSecondary,
    backgroundColor: AppColors.white,
  },
  subTabPillActive: {
    borderColor: `${AppColors.purple}60`,
    backgroundColor: `${AppColors.purple}14`,
  },
  subTabPillText: {
    fontFamily: AppFonts.interMedium,
    fontSize: 11,
    color: AppColors.grayTextWeak,
  },
  subTabPillTextActive: {
    fontFamily: AppFonts.interBold,
    color: AppColors.purple,
  },
  jankCountBadge: {
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  jankCountBadgeText: {
    fontFamily: AppFonts.interBold,
    fontSize: 8.5,
  },
  sectionCard: {
    backgroundColor: AppColors.white,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: AppColors.grayBorderSecondary,
    gap: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  sectionTitle: {
    fontFamily: AppFonts.interBold,
    fontSize: 12.5,
    color: AppColors.grayTextStrong,
  },
  sectionDesc: {
    fontFamily: AppFonts.interRegular,
    fontSize: 10.5,
    color: AppColors.grayTextWeak,
    lineHeight: 14,
  },
  targetBadge: {
    backgroundColor: `${AppColors.green600}14`,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  targetBadgeText: {
    fontFamily: AppFonts.interBold,
    fontSize: 9,
    color: AppColors.green600,
  },
  datadogGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 2,
  },
  datadogPill: {
    flexBasis: '48%',
    flexGrow: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    gap: 2,
  },
  datadogCount: {
    fontFamily: AppFonts.interBold,
    fontSize: 16,
  },
  datadogLabel: {
    fontFamily: AppFonts.interRegular,
    fontSize: 9.5,
    color: AppColors.grayTextWeak,
  },
  histogramTotalText: {
    fontFamily: AppFonts.interMedium,
    fontSize: 9.5,
    color: AppColors.grayTextWeak,
  },
  histogramList: {
    gap: 8,
  },
  histogramRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  histogramLabelCol: {
    width: 110,
  },
  histogramLabel: {
    fontFamily: AppFonts.interBold,
    fontSize: 9.5,
    color: AppColors.grayTextStrong,
  },
  histogramSub: {
    fontFamily: AppFonts.interRegular,
    fontSize: 8.5,
    color: AppColors.grayTextWeak,
  },
  histogramTrack: {
    flex: 1,
    height: 6,
    backgroundColor: AppColors.grayBackground,
    borderRadius: 3,
    overflow: 'hidden',
  },
  histogramFill: {
    height: '100%',
    borderRadius: 3,
  },
  histogramCountText: {
    width: 65,
    textAlign: 'right',
    fontFamily: AppFonts.interBold,
    fontSize: 9.5,
  },
  percentileGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  percentileCard: {
    flexBasis: '48%',
    flexGrow: 1,
    backgroundColor: AppColors.grayBackground,
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: AppColors.grayBorderSecondary,
    gap: 2,
  },
  percentileTag: {
    fontFamily: AppFonts.interSemiBold,
    fontSize: 10,
    color: AppColors.grayTextWeak,
  },
  percentileVal: {
    fontFamily: AppFonts.interBold,
    fontSize: 18,
  },
  percentileUnit: {
    fontSize: 11,
    fontFamily: AppFonts.interMedium,
    color: AppColors.grayTextWeak,
  },
  percentileSub: {
    fontFamily: AppFonts.interRegular,
    fontSize: 9,
    color: AppColors.grayTextWeak,
  },
  chartWrapper: {
    backgroundColor: AppColors.grayBackground,
    borderRadius: 8,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: AppColors.grayBorderSecondary,
    alignItems: 'center',
  },
  chartSvg: {
    alignSelf: 'center',
  },
  chartAxisRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: CHART_WIDTH,
    paddingTop: 4,
  },
  chartAxisLabel: {
    fontFamily: AppFonts.interRegular,
    fontSize: 9,
    color: AppColors.grayTextWeak,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    paddingTop: 2,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  legendText: {
    fontFamily: AppFonts.interMedium,
    fontSize: 10,
    color: AppColors.grayTextWeak,
  },
  lagBarsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 52,
    backgroundColor: AppColors.grayBackground,
    borderRadius: 8,
    padding: 6,
    borderWidth: 1,
    borderColor: AppColors.grayBorderSecondary,
  },
  lagBar: {
    flex: 1,
    marginHorizontal: 1,
    borderRadius: 2,
  },
  lagInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lagInfoText: {
    fontFamily: AppFonts.interRegular,
    fontSize: 10.5,
    color: AppColors.grayTextWeak,
  },
  boldText: {
    fontFamily: AppFonts.interBold,
    color: AppColors.grayTextStrong,
  },
  engineDetailsTable: {
    gap: 8,
  },
  engineDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.grayBorderSecondary,
  },
  engineDetailKey: {
    fontFamily: AppFonts.interMedium,
    fontSize: 11,
    color: AppColors.grayTextWeak,
  },
  engineDetailVal: {
    fontFamily: AppFonts.interBold,
    fontSize: 11,
    color: AppColors.grayTextStrong,
  },
  enginePillMini: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  enginePillMiniText: {
    fontFamily: AppFonts.interBold,
    fontSize: 9.5,
  },
  gcActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: `${AppColors.amber500}15`,
    borderRadius: 8,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: `${AppColors.amber500}35`,
    marginTop: 4,
  },
  gcActionBtnText: {
    fontFamily: AppFonts.interBold,
    fontSize: 11,
    color: AppColors.amber500,
  },
  jankFilterRow: {
    flexDirection: 'row',
    gap: 6,
  },
  jankFilterChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: AppColors.grayBorderSecondary,
    backgroundColor: AppColors.grayBackground,
  },
  jankFilterChipActive: {
    borderColor: AppColors.purple,
    backgroundColor: `${AppColors.purple}15`,
  },
  jankFilterChipText: {
    fontFamily: AppFonts.interMedium,
    fontSize: 9.5,
    color: AppColors.grayTextWeak,
  },
  jankFilterChipTextActive: {
    fontFamily: AppFonts.interBold,
    color: AppColors.purple,
  },
  emptyJankBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 4,
    backgroundColor: AppColors.grayBackground,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: AppColors.grayBorderSecondary,
  },
  emptyJankTitle: {
    fontFamily: AppFonts.interBold,
    fontSize: 12,
    color: AppColors.green600,
  },
  emptyJankDesc: {
    fontFamily: AppFonts.interRegular,
    fontSize: 10.5,
    color: AppColors.grayTextWeak,
  },
  janksList: {
    gap: 6,
  },
  jankItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: AppColors.grayBackground,
    borderRadius: 6,
    padding: 7,
    borderWidth: 1,
    borderColor: AppColors.grayBorderSecondary,
  },
  jankSevBadge: {
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  jankSevText: {
    fontFamily: AppFonts.interBold,
    fontSize: 8.5,
  },
  jankDetailsCol: {
    flex: 1,
  },
  jankDurationText: {
    fontFamily: AppFonts.interBold,
    fontSize: 11,
    color: AppColors.grayTextStrong,
  },
  jankTimeText: {
    fontFamily: AppFonts.interRegular,
    fontSize: 9,
    color: AppColors.grayTextWeak,
  },
  jankTapHint: {
    fontFamily: AppFonts.interMedium,
    fontSize: 10,
    color: AppColors.purple,
  },
  jankInspectorBox: {
    backgroundColor: AppColors.grayBackground,
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: AppColors.grayBorderSecondary,
    gap: 4,
  },
  jankInspectorTitle: {
    fontFamily: AppFonts.interBold,
    fontSize: 11,
    color: AppColors.grayTextStrong,
  },
  jankInspectorDesc: {
    fontFamily: AppFonts.interRegular,
    fontSize: 10.5,
    color: AppColors.grayTextWeak,
    lineHeight: 14,
  },
  stressButtonsGrid: {
    gap: 8,
  },
  stressBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  stressBtnTextBox: {
    flex: 1,
    gap: 2,
  },
  stressBtnTitle: {
    fontFamily: AppFonts.interBold,
    fontSize: 11.5,
  },
  stressBtnSub: {
    fontFamily: AppFonts.interRegular,
    fontSize: 10,
    color: AppColors.grayTextWeak,
  },
  jankRatioBadge: {
    fontFamily: AppFonts.interMedium,
    fontSize: 10,
    color: AppColors.grayTextWeak,
  },
});
