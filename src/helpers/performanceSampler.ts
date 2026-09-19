import {useState, useEffect, useRef, useCallback, useMemo} from 'react';

export interface FrameSample {
  timestamp: number;
  durationMs: number;
  fps: number;
  isJank: boolean;
  isFrozen: boolean;
}

export interface JankEvent {
  id: string;
  timestamp: number;
  timeStr: string;
  durationMs: number;
  fps: number;
  severity: 'moderate' | 'severe' | 'frozen';
}

export interface MemoryStats {
  usedHeapMb: number;
  totalAllocMb: number;
  peakHeapMb: number;
  engine: string;
  isAvailable: boolean;
  gcCount?: number;
  gcTimeMs?: number;
}

export interface PercentileStats {
  p50Ms: number;
  p90Ms: number;
  p95Ms: number;
  p99Ms: number;
}

export interface BucketDistribution {
  ultraSmoothCount: number; // <= 16.6ms (60+ FPS)
  smoothCount: number;      // 16.7 - 24ms (40-60 FPS)
  degradedCount: number;    // 24.1 - 34ms (30-40 FPS)
  stutteredCount: number;   // 34.1 - 66.6ms (15-30 FPS)
  frozenCount: number;      // > 66.6ms (< 15 FPS)
  totalSamples: number;
}

export interface EngineDetails {
  engineName: string;
  isHermes: boolean;
  isFabric: boolean;
  isTurboModules: boolean;
  architectureName: string;
  gcCollections?: number;
  gcCpuTimeMs?: number;
  heapUsedMb: number;
  heapTotalMb: number;
  peakHeapMb: number;
}

export interface LivePerformanceData {
  fps: number;
  avgFps: number;
  minFps: number;
  maxFps: number;
  frameDurationMs: number;
  refreshRateHz: number;
  jankCount: number;
  frozenCount: number;
  jankPercent: number;
  // Datadog RUM & New Relic APM Metrics
  apdexScore: number;
  apdexStatus: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
  satisfiedCount: number;
  toleratingCount: number;
  frustratedCount: number;
  longTaskCount: number;
  // Latency Percentiles (p50, p90, p95, p99)
  percentiles: PercentileStats;
  // Vsync Budget (16.6ms)
  budgetUsedPercent: number;
  budgetHeadroomMs: number;
  // Histogram distribution
  distribution: BucketDistribution;
  // Deep Engine & Runtime Details
  engineDetails: EngineDetails;
  jsEventLoopLagMs: number;
  avgJsLagMs: number;
  peakJsLagMs: number;
  healthScore: number;
  healthStatus: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
  frameHistory: number[];
  jsLagHistory: number[];
  recentJanks: JankEvent[];
  memory: MemoryStats;
  sessionDurationSec: number;
  isStressTesting: boolean;
  runJsStressTest: (durationMs?: number) => void;
  runRenderStressTest: () => void;
  triggerGC: () => void;
  resetStats: () => void;
}

/**
 * 100% Dynamic Performance Profiler powered by New Relic Apdex & Datadog RUM Mobile Vitals algorithms.
 * - New Relic Apdex Formula: (Satisfied + Tolerating/2) / Total Frames with T = 16.6ms
 * - Datadog RUM Mobile Vitals: Slow Frames (17ms-66ms), Frozen Frames (>66ms), and JS Long Tasks (>50ms)
 */
export const usePerformanceMonitor = (active: boolean = true): LivePerformanceData => {
  // ─── 1. Measurement Refs (Declared FIRST so initializers can safely access) ───
  const lastRafTimeRef = useRef<number>(0);
  const totalFramesRef = useRef<number>(0);
  const rollingFramesRef = useRef<number[]>([]);
  const rollingLagRef = useRef<number[]>([]);
  const sessionMinFpsRef = useRef<number>(0);
  const sessionMaxFpsRef = useRef<number>(0);
  const sessionPeakLagRef = useRef<number>(0);
  const sessionPeakHeapRef = useRef<number>(0);
  const satisfiedCountRef = useRef<number>(0);
  const toleratingCountRef = useRef<number>(0);
  const frustratedCountRef = useRef<number>(0);
  const longTaskCountRef = useRef<number>(0);
  const jankCountRef = useRef<number>(0);
  const frozenCountRef = useRef<number>(0);
  const janksListRef = useRef<JankEvent[]>([]);
  const rafIdRef = useRef<number | null>(null);
  const timerLagRef = useRef<NodeJS.Timeout | null>(null);
  const memTimerRef = useRef<NodeJS.Timeout | null>(null);
  const sessionTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Dynamically inspect the active JavaScript runtime engine & heap memory
  const sampleRealEngineMemory = useCallback((): MemoryStats => {
    const isHermes = Boolean((global as any).HermesInternal);
    const isV8 = Boolean((global as any)._v8runtime);
    const isFabric =
      typeof (global as any).nativeFabricUIManager !== 'undefined' ||
      Boolean((global as any).__turboModuleProxy);

    const engineBase = isHermes ? 'Hermes' : isV8 ? 'V8 Engine' : 'JavaScriptCore';
    const engine = `${engineBase} • ${isFabric ? 'Fabric' : 'Paper'}`;

    let usedMb = 0;
    let totalMb = 0;
    let isAvailable = false;
    let gcCount: number | undefined;
    let gcTimeMs: number | undefined;

    try {
      const hermes = (global as any).HermesInternal;
      if (hermes?.getInstrumentedStats) {
        const stats = hermes.getInstrumentedStats();
        if (stats && typeof stats === 'object') {
          const rawHeap =
            stats.js_heap_size ??
            stats.heapSize ??
            stats['js.heap_size'] ??
            stats.js_allocated_bytes ??
            0;
          const rawAlloc =
            stats.js_allocated_bytes ??
            stats.allocatedBytes ??
            stats['js.allocated_bytes'] ??
            stats.totalAllocatedBytes ??
            rawHeap;

          if (rawHeap > 0 || rawAlloc > 0) {
            usedMb = Number((rawHeap / (1024 * 1024)).toFixed(2));
            totalMb = Number((rawAlloc / (1024 * 1024)).toFixed(2));
            gcCount = stats.gc_num_collections ?? stats.num_gc_collections ?? stats['gc.num_collections'];
            gcTimeMs = stats.gc_cpu_time ?? stats.gc_time ?? stats['gc.cpu_time'];
            isAvailable = true;
          }
        }
      } else if ((global as any).performance?.memory?.usedJSHeapSize) {
        const perfMem = (global as any).performance.memory;
        usedMb = Number((perfMem.usedJSHeapSize / (1024 * 1024)).toFixed(2));
        totalMb = Number((perfMem.totalJSHeapSize / (1024 * 1024)).toFixed(2));
        isAvailable = true;
      }
    } catch {}

    const currentPeak = sessionPeakHeapRef?.current || 0;
    const newPeak = Math.max(currentPeak, usedMb);
    if (sessionPeakHeapRef) {
      sessionPeakHeapRef.current = newPeak;
    }

    return {
      usedHeapMb: usedMb,
      totalAllocMb: totalMb,
      peakHeapMb: newPeak,
      engine,
      isAvailable,
      gcCount,
      gcTimeMs,
    };
  }, []);

  // ─── 2. Reactive State ───
  const [fps, setFps] = useState<number>(60);
  const [avgFps, setAvgFps] = useState<number>(60);
  const [minFps, setMinFps] = useState<number>(60);
  const [maxFps, setMaxFps] = useState<number>(60);
  const [frameDurationMs, setFrameDurationMs] = useState<number>(16.6);
  const [refreshRateHz, setRefreshRateHz] = useState<number>(60);
  const [jankCount, setJankCount] = useState<number>(0);
  const [frozenCount, setFrozenCount] = useState<number>(0);
  const [jankPercent, setJankPercent] = useState<number>(0);
  const [apdexScore, setApdexScore] = useState<number>(1.0);
  const [satisfiedCount, setSatisfiedCount] = useState<number>(0);
  const [toleratingCount, setToleratingCount] = useState<number>(0);
  const [frustratedCount, setFrustratedCount] = useState<number>(0);
  const [longTaskCount, setLongTaskCount] = useState<number>(0);
  const [percentiles, setPercentiles] = useState<PercentileStats>({
    p50Ms: 16.6,
    p90Ms: 16.6,
    p95Ms: 16.6,
    p99Ms: 16.6,
  });
  const [budgetUsedPercent, setBudgetUsedPercent] = useState<number>(100);
  const [budgetHeadroomMs, setBudgetHeadroomMs] = useState<number>(0);
  const [distribution, setDistribution] = useState<BucketDistribution>({
    ultraSmoothCount: 0,
    smoothCount: 0,
    degradedCount: 0,
    stutteredCount: 0,
    frozenCount: 0,
    totalSamples: 0,
  });
  const [jsEventLoopLagMs, setJsEventLoopLagMs] = useState<number>(0);
  const [avgJsLagMs, setAvgJsLagMs] = useState<number>(0);
  const [peakJsLagMs, setPeakJsLagMs] = useState<number>(0);
  const [frameHistory, setFrameHistory] = useState<number[]>(() => Array(45).fill(16.6));
  const [jsLagHistory, setJsLagHistory] = useState<number[]>(() => Array(25).fill(0));
  const [recentJanks, setRecentJanks] = useState<JankEvent[]>([]);
  const [isStressTesting, setIsStressTesting] = useState<boolean>(false);
  const [sessionDurationSec, setSessionDurationSec] = useState<number>(0);
  const [memory, setMemory] = useState<MemoryStats>(() => sampleRealEngineMemory());

  // Engine Details
  const engineDetails: EngineDetails = useMemo(() => {
    const isHermes = Boolean((global as any).HermesInternal);
    const isV8 = Boolean((global as any)._v8runtime);
    const isFabric =
      typeof (global as any).nativeFabricUIManager !== 'undefined' ||
      Boolean((global as any).__turboModuleProxy);
    const isTurboModules = Boolean((global as any).__turboModuleProxy);

    const engineName = isHermes ? 'Hermes' : isV8 ? 'V8 Engine' : 'JavaScriptCore';
    const architectureName = isFabric ? 'Fabric (New Architecture)' : 'Paper (Legacy)';

    return {
      engineName,
      isHermes,
      isFabric,
      isTurboModules,
      architectureName,
      heapUsedMb: memory.usedHeapMb,
      heapTotalMb: memory.totalAllocMb,
      peakHeapMb: memory.peakHeapMb,
      gcCollections: memory.gcCount,
      gcCpuTimeMs: memory.gcTimeMs,
    };
  }, [memory]);

  // ─── 1. New Relic & Datadog Frame Sampler ───
  // Targets T = 16.6ms standard:
  // - Satisfied (<= 18.0ms): On-time 60fps frame
  // - Tolerating (18.1ms - 66.6ms / 4T): Datadog Slow Frame
  // - Frustrated (> 66.6ms): Datadog Frozen Frame
  useEffect(() => {
    if (!active) return;

    let isRunning = true;
    let warmupFrames = 6;
    lastRafTimeRef.current = performance.now();

    const onFrame = (now: number) => {
      if (!isRunning) return;

      if (warmupFrames > 0) {
        lastRafTimeRef.current = now;
        warmupFrames--;
        rafIdRef.current = requestAnimationFrame(onFrame);
        return;
      }

      const delta = now - lastRafTimeRef.current;
      lastRafTimeRef.current = now;

      // Filter out long background / sleep pauses (> 800ms)
      if (delta > 0 && delta < 800) {
        totalFramesRef.current++;

        const instantFps = Math.min(60, Math.max(1, Math.round(1000 / Math.max(16.0, delta))));
        const duration = Number(delta.toFixed(1));

        // New Relic & Datadog RUM Classification:
        if (delta <= 18.5) {
          satisfiedCountRef.current++;
        } else if (delta <= 66.6) {
          toleratingCountRef.current++; // Datadog Slow Frame
          jankCountRef.current++;
          if (delta > 36.0) {
            const newJank: JankEvent = {
              id: `jank_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
              timestamp: Date.now(),
              timeStr: new Date().toLocaleTimeString([], {hour: '2-digit', minute: '2-digit', second: '2-digit'}),
              durationMs: duration,
              fps: instantFps,
              severity: 'moderate',
            };
            janksListRef.current = [newJank, ...janksListRef.current.slice(0, 19)];
          }
        } else {
          frustratedCountRef.current++; // Datadog Frozen Frame (> 4T)
          frozenCountRef.current++;
          const newJank: JankEvent = {
            id: `jank_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            timestamp: Date.now(),
            timeStr: new Date().toLocaleTimeString([], {hour: '2-digit', minute: '2-digit', second: '2-digit'}),
            durationMs: duration,
            fps: instantFps,
            severity: 'frozen',
          };
          janksListRef.current = [newJank, ...janksListRef.current.slice(0, 19)];
        }

        // Rolling history (last 45 frames)
        rollingFramesRef.current.push(duration);
        if (rollingFramesRef.current.length > 45) {
          rollingFramesRef.current.shift();
        }

        // Session Min/Max FPS
        if (totalFramesRef.current === 1) {
          sessionMinFpsRef.current = instantFps;
          sessionMaxFpsRef.current = instantFps;
        } else {
          if (instantFps < sessionMinFpsRef.current && instantFps >= 15) {
            sessionMinFpsRef.current = instantFps;
          }
          if (instantFps > sessionMaxFpsRef.current) {
            sessionMaxFpsRef.current = instantFps;
          }
        }
      }

      rafIdRef.current = requestAnimationFrame(onFrame);
    };

    rafIdRef.current = requestAnimationFrame(onFrame);

    return () => {
      isRunning = false;
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, [active]);

  // ─── 2. Datadog RUM Long Task & JS Responsiveness Detector ───
  // Measures JS thread blockages. Any delay > 50ms is classified as a Datadog Long Task.
  useEffect(() => {
    if (!active) return;

    const PULSE_INTERVAL = 30;
    let expected = performance.now() + PULSE_INTERVAL;
    let warmupPulses = 5;

    const checkEventLoop = () => {
      const now = performance.now();
      const drift = now - expected;
      expected = now + PULSE_INTERVAL;

      if (warmupPulses > 0) {
        warmupPulses--;
        timerLagRef.current = setTimeout(checkEventLoop, PULSE_INTERVAL);
        return;
      }

      const realLag = Math.max(0, Number((drift - 8).toFixed(1)));

      if (realLag > sessionPeakLagRef.current) {
        sessionPeakLagRef.current = realLag;
      }

      // Datadog Long Task Standard (> 50ms)
      if (realLag >= 50.0) {
        longTaskCountRef.current++;
      }

      rollingLagRef.current.push(realLag);
      if (rollingLagRef.current.length > 30) {
        rollingLagRef.current.shift();
      }

      timerLagRef.current = setTimeout(checkEventLoop, PULSE_INTERVAL);
    };

    timerLagRef.current = setTimeout(checkEventLoop, PULSE_INTERVAL);

    return () => {
      if (timerLagRef.current) clearTimeout(timerLagRef.current);
    };
  }, [active]);

  // ─── 3. Decoupled UI State Flush (3.3 Hz / every 300ms) ───
  useEffect(() => {
    if (!active) return;

    const flushMetricsToUI = () => {
      const frames = rollingFramesRef.current;
      const lags = rollingLagRef.current;

      if (frames.length > 0) {
        const latestDuration = frames[frames.length - 1] ?? 16.6;
        const sumDuration = frames.reduce((a, b) => a + b, 0);
        const avgDuration = sumDuration / frames.length;

        const computedAvgFps = Math.min(60, Math.max(1, Math.round(1000 / Math.max(16.0, avgDuration))));
        const computedInstantFps = Math.min(60, Math.max(1, Math.round(1000 / Math.max(16.0, latestDuration))));

        setFps(computedInstantFps);
        setAvgFps(computedAvgFps);
        setFrameDurationMs(latestDuration);
        setFrameHistory([...frames]);
        setMinFps(sessionMinFpsRef.current || computedInstantFps);
        setMaxFps(sessionMaxFpsRef.current || computedInstantFps);

        const totalRecorded = Math.max(1, totalFramesRef.current);
        const s = satisfiedCountRef.current;
        const t = toleratingCountRef.current;
        const f = frustratedCountRef.current;

        // Official New Relic Apdex Formula: (Satisfied + Tolerating/2) / Total
        const computedApdex = Number(((s + t / 2) / Math.max(1, s + t + f)).toFixed(2));
        setApdexScore(Math.max(0, Math.min(1.0, computedApdex)));

        setSatisfiedCount(s);
        setToleratingCount(t);
        setFrustratedCount(f);
        setLongTaskCount(longTaskCountRef.current);

        // 1. Dynamic Percentiles (p50, p90, p95, p99) computed from real observed frames
        const sorted = [...frames].sort((a, b) => a - b);
        const p50 = sorted[Math.floor(sorted.length * 0.50)] ?? 16.6;
        const p90 = sorted[Math.floor(sorted.length * 0.90)] ?? 16.6;
        const p95 = sorted[Math.floor(sorted.length * 0.95)] ?? 16.6;
        const p99 = sorted[Math.floor(sorted.length * 0.99)] ?? 16.6;
        setPercentiles({
          p50Ms: Number(p50.toFixed(1)),
          p90Ms: Number(p90.toFixed(1)),
          p95Ms: Number(p95.toFixed(1)),
          p99Ms: Number(p99.toFixed(1)),
        });

        // 2. Vsync 16.6ms Budget Consumption & Headroom
        const budgetPct = Math.min(250, Number(((latestDuration / 16.6) * 100).toFixed(0)));
        const headroom = Number(Math.max(0, 16.6 - latestDuration).toFixed(1));
        setBudgetUsedPercent(budgetPct);
        setBudgetHeadroomMs(headroom);

        // 3. Real Histogram Distribution Buckets
        let ultra = 0, smooth = 0, degraded = 0, stutter = 0, frozen = 0;
        for (const d of frames) {
          if (d <= 16.6) ultra++;
          else if (d <= 24.0) smooth++;
          else if (d <= 34.0) degraded++;
          else if (d <= 66.6) stutter++;
          else frozen++;
        }
        setDistribution({
          ultraSmoothCount: ultra,
          smoothCount: smooth,
          degradedCount: degraded,
          stutteredCount: stutter,
          frozenCount: frozen,
          totalSamples: frames.length,
        });

        const jankRatio = Number(
          (((jankCountRef.current + frozenCountRef.current) / totalRecorded) * 100).toFixed(1),
        );
        setJankPercent(jankRatio);
        setJankCount(jankCountRef.current);
        setFrozenCount(frozenCountRef.current);
        setRecentJanks([...janksListRef.current]);
      }

      if (lags.length > 0) {
        const currentLag = lags[lags.length - 1] ?? 0;
        const sumLag = lags.reduce((a, b) => a + b, 0);
        const avgLag = Number((sumLag / lags.length).toFixed(1));

        setJsEventLoopLagMs(currentLag);
        setAvgJsLagMs(avgLag);
        setPeakJsLagMs(sessionPeakLagRef.current);
        setJsLagHistory([...lags]);
      }
    };

    const flushInterval = setInterval(flushMetricsToUI, 300);

    return () => {
      clearInterval(flushInterval);
    };
  }, [active]);

  // ─── 4. Periodic Engine Memory & Session Timer ───
  useEffect(() => {
    if (!active) return;

    memTimerRef.current = setInterval(() => {
      setMemory(sampleRealEngineMemory());
    }, 1500);

    sessionTimerRef.current = setInterval(() => {
      setSessionDurationSec(s => s + 1);
    }, 1000);

    return () => {
      if (memTimerRef.current) clearInterval(memTimerRef.current);
      if (sessionTimerRef.current) clearInterval(sessionTimerRef.current);
    };
  }, [active, sampleRealEngineMemory]);

  // ─── 5. Datadog RUM & New Relic Composite Health Score ───
  // Based on New Relic Apdex Index (T=16.6ms) + Datadog Long Tasks Penalty
  const healthScore = useMemo(() => {
    const rawScore = Math.round(apdexScore * 100 - Math.min(longTaskCount * 2, 10));
    return Math.max(0, Math.min(100, rawScore));
  }, [apdexScore, longTaskCount]);

  const healthStatus: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' =
    healthScore >= 88
      ? 'EXCELLENT'
      : healthScore >= 72
      ? 'GOOD'
      : healthScore >= 55
      ? 'FAIR'
      : 'POOR';

  const apdexStatus: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' =
    apdexScore >= 0.94
      ? 'EXCELLENT'
      : apdexScore >= 0.85
      ? 'GOOD'
      : apdexScore >= 0.70
      ? 'FAIR'
      : 'POOR';

  // Interactive Live Stress Tests
  const runJsStressTest = useCallback((durationMs: number = 120) => {
    setIsStressTesting(true);
    setTimeout(() => {
      const start = performance.now();
      // Block JS event loop synchronously to create measurable real lag
      while (performance.now() - start < durationMs) {
        Math.sqrt(Math.random() * 1000000);
      }
      setIsStressTesting(false);
    }, 50);
  }, []);

  const runRenderStressTest = useCallback(() => {
    setIsStressTesting(true);
    let count = 0;
    const interval = setInterval(() => {
      count++;
      // Fire rapid state changes
      setFrameDurationMs(prev => Number((prev + 0.1).toFixed(1)));
      if (count > 25) {
        clearInterval(interval);
        setIsStressTesting(false);
      }
    }, 16);
  }, []);

  const triggerGC = useCallback(() => {
    try {
      const hermes = (global as any).HermesInternal;
      if (hermes?.gc) {
        hermes.gc();
      } else if ((global as any).gc) {
        (global as any).gc();
      }
      setTimeout(() => {
        setMemory(sampleRealEngineMemory());
      }, 200);
    } catch {}
  }, []);

  const resetStats = useCallback(() => {
    totalFramesRef.current = 0;
    satisfiedCountRef.current = 0;
    toleratingCountRef.current = 0;
    frustratedCountRef.current = 0;
    longTaskCountRef.current = 0;
    jankCountRef.current = 0;
    frozenCountRef.current = 0;
    sessionMinFpsRef.current = 0;
    sessionMaxFpsRef.current = 0;
    sessionPeakLagRef.current = 0;
    sessionPeakHeapRef.current = 0;
    rollingFramesRef.current = [];
    rollingLagRef.current = [];
    janksListRef.current = [];

    setFps(60);
    setAvgFps(60);
    setMinFps(60);
    setMaxFps(60);
    setFrameDurationMs(16.6);
    setApdexScore(1.0);
    setSatisfiedCount(0);
    setToleratingCount(0);
    setFrustratedCount(0);
    setLongTaskCount(0);
    setJankCount(0);
    setFrozenCount(0);
    setJankPercent(0);
    setJsEventLoopLagMs(0);
    setAvgJsLagMs(0);
    setPeakJsLagMs(0);
    setFrameHistory(Array(45).fill(16.6));
    setJsLagHistory(Array(25).fill(0));
    setRecentJanks([]);
    setSessionDurationSec(0);
    setMemory(sampleRealEngineMemory());
  }, [sampleRealEngineMemory]);

  return {
    fps,
    avgFps,
    minFps,
    maxFps,
    frameDurationMs,
    refreshRateHz,
    jankCount,
    frozenCount,
    jankPercent,
    apdexScore,
    apdexStatus,
    satisfiedCount,
    toleratingCount,
    frustratedCount,
    longTaskCount,
    percentiles,
    budgetUsedPercent,
    budgetHeadroomMs,
    distribution,
    engineDetails,
    jsEventLoopLagMs,
    avgJsLagMs,
    peakJsLagMs,
    healthScore,
    healthStatus,
    frameHistory,
    jsLagHistory,
    recentJanks,
    memory,
    sessionDurationSec,
    isStressTesting,
    runJsStressTest,
    runRenderStressTest,
    triggerGC,
    resetStats,
  };
};
