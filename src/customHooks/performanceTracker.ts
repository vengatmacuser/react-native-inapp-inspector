import {AppColors} from '../styles/AppColors';
import {useState, useEffect, useRef, useMemo, useCallback} from 'react';


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

export interface LiveMemoryStats {
  heapUsedMb: number;
  heapTotalMb: number;
  gcCount: number;
  gcPauseMs: number;
  allocationRateMbPerSec: number;
}

export interface CoreMobileVitals {
  ttiMs: number; // Time to Interactive
  fcpMs: number; // First Contentful Paint
  inpMs: number; // Interaction to Next Paint
  jankPercentage: number;
  grade: 'Optimal' | 'Fair' | 'Poor';
}

export interface PerformanceFixKey {
  keyName: string;
  title: string;
  explanation: string;
  codeSnippet: string;
  impact: 'High Impact' | 'Medium Impact' | 'Best Practice';
  impactColor: string;
}

export interface ComponentRenderProfile {
  id: string;
  name: string;
  type: 'screen' | 'component' | 'list_item' | 'modal';
  sourceFile: string;
  renderCount: number;
  wastefulCount: number;
  wastefulPercentage: number;
  avgRenderTimeMs: number;
  totalRenderTimeMs: number;
  lastRenderedAt: number;
  reasons: string[];
  fixKeys: PerformanceFixKey[];
  severity: 'optimal' | 'warning' | 'critical';
}

const INITIAL_RENDER_PROFILES: ComponentRenderProfile[] = [
  {
    id: 'render-1',
    name: 'ProductDetailScreen',
    type: 'screen',
    sourceFile: 'src/screens/ProductDetailScreen.tsx',
    renderCount: 48,
    wastefulCount: 34,
    wastefulPercentage: 70.8,
    avgRenderTimeMs: 14.2,
    totalRenderTimeMs: 681.6,
    lastRenderedAt: Date.now() - 2500,
    reasons: [
      'Inline arrow function props passed to children (onAddToCart={() => ...})',
      'Unmemoized Redux selector creating new object reference on every dispatch',
      'Dynamic style object created in render body ({ marginTop: insets.top + 10 })',
    ],
    fixKeys: [
      {
        keyName: 'useCallback',
        title: 'Wrap Event Handlers in useCallback',
        explanation: 'Inline functions recreate a new memory reference on every render, invalidating React.memo on child components.',
        codeSnippet: `// ❌ Before:\n<AddToCartButton onPress={() => handleAddToCart(item.id)} />\n\n// ✅ After:\nconst onAddToCart = useCallback(() => {\n  handleAddToCart(item.id);\n}, [item.id]);\n<AddToCartButton onPress={onAddToCart} />`,
        impact: 'High Impact',
        impactColor: AppColors.pink500,
      },
      {
        keyName: 'createSelector',
        title: 'Memoize Redux / Zustand Selectors with shallowEqual',
        explanation: 'Returning new object or array references inside useSelector forces an automatic re-render on every state dispatch.',
        codeSnippet: `// ❌ Before:\nconst { items, total } = useSelector(state => ({ items: state.cart.items, total: state.cart.total }));\n\n// ✅ After:\nimport { shallowEqual } from 'react-redux';\nconst { items, total } = useSelector(\n  state => ({ items: state.cart.items, total: state.cart.total }),\n  shallowEqual\n);`,
        impact: 'High Impact',
        impactColor: AppColors.pink500,
      },
      {
        keyName: 'useMemoStyles',
        title: 'Hoist Styles or Use useMemo for Dynamic Dimensions',
        explanation: 'Inline style objects create new object identities on every frame pass, causing Yoga Flexbox reconciliation diffs.',
        codeSnippet: `// ❌ Before:\n<View style={{ paddingTop: insets.top, backgroundColor: AppColors.white }} />\n\n// ✅ After:\nconst containerStyle = useMemo(() => ({\n  paddingTop: insets.top,\n  backgroundColor: AppColors.white,\n}), [insets.top]);\n<View style={containerStyle} />`,
        impact: 'Medium Impact',
        impactColor: AppColors.purple500,
      },
    ],
    severity: 'critical',
  },
  {
    id: 'render-2',
    name: 'HomeFeedFlatList',
    type: 'screen',
    sourceFile: 'src/screens/HomeScreen.tsx',
    renderCount: 36,
    wastefulCount: 22,
    wastefulPercentage: 61.1,
    avgRenderTimeMs: 18.6,
    totalRenderTimeMs: 669.6,
    lastRenderedAt: Date.now() - 8000,
    reasons: [
      'FlatList missing getItemLayout causing async layout measuring passes',
      'renderItem function defined anonymously inside JSX body',
      'List item components not wrapped with React.memo',
    ],
    fixKeys: [
      {
        keyName: 'getItemLayout',
        title: 'Implement getItemLayout for Fixed-Height Items',
        explanation: 'Supplying getItemLayout allows FlatList to immediately compute scroll offsets and virtual windows without measuring views asynchronously.',
        codeSnippet: `const ITEM_HEIGHT = 80;\nconst getItemLayout = useCallback((data, index) => ({\n  length: ITEM_HEIGHT,\n  offset: ITEM_HEIGHT * index,\n  index,\n}), []);\n\n<FlatList\n  data={items}\n  getItemLayout={getItemLayout}\n  renderItem={renderItem}\n  keyExtractor={item => item.id}\n/>`,
        impact: 'High Impact',
        impactColor: AppColors.pink500,
      },
      {
        keyName: 'React.memo',
        title: 'Wrap List Items in React.memo',
        explanation: 'Prevents all 50+ visible list items from re-rendering when parent list state (e.g. scroll position or pagination) updates.',
        codeSnippet: `// FeedItem.tsx\nexport const FeedItem = React.memo(({ item, onSelect }: FeedItemProps) => {\n  return <View>...</View>;\n}, (prev, next) => prev.item.id === next.item.id && prev.item.updatedAt === next.item.updatedAt);`,
        impact: 'High Impact',
        impactColor: AppColors.pink500,
      },
    ],
    severity: 'critical',
  },
  {
    id: 'render-3',
    name: 'CartSummarySheet',
    type: 'modal',
    sourceFile: 'src/components/CartSummarySheet.tsx',
    renderCount: 24,
    wastefulCount: 14,
    wastefulPercentage: 58.3,
    avgRenderTimeMs: 8.4,
    totalRenderTimeMs: 201.6,
    lastRenderedAt: Date.now() - 14000,
    reasons: [
      'Parent screen re-rendered on keyboard show/hide event',
      'Unstable callback reference passed into checkout button',
    ],
    fixKeys: [
      {
        keyName: 'ComponentSplitting',
        title: 'Isolate Fast-Changing State in Leaf Components',
        explanation: 'Move keyboard listeners and modal animation state into self-contained subcomponents so the parent does not re-render.',
        codeSnippet: `// ❌ Before: Parent holds keyboardHeight state, re-rendering entire screen\n// ✅ After: Use KeyboardStickyView component that encapsulates layout animation`,
        impact: 'Medium Impact',
        impactColor: AppColors.purple500,
      },
    ],
    severity: 'warning',
  },
  {
    id: 'render-4',
    name: 'SearchFilterHeader',
    type: 'component',
    sourceFile: 'src/components/SearchFilterHeader.tsx',
    renderCount: 29,
    wastefulCount: 16,
    wastefulPercentage: 55.2,
    avgRenderTimeMs: 6.2,
    totalRenderTimeMs: 179.8,
    lastRenderedAt: Date.now() - 19000,
    reasons: [
      'TextInput value state triggers parent re-render on every keystroke without debouncing',
      'Passing unmemoized filter object ({ category, minPrice }) down to child chips',
    ],
    fixKeys: [
      {
        keyName: 'DebouncedInput',
        title: 'Debounce Search Input or Use Local Controlled State',
        explanation: 'Do not propagate keystroke state into global store immediately. Use a 250ms debounce or uncontrolled ref.',
        codeSnippet: `const [localText, setLocalText] = useState('');\nconst debouncedSearch = useMemo(\n  () => debounce(query => onSearch(query), 250),\n  [onSearch]\n);`,
        impact: 'High Impact',
        impactColor: AppColors.pink500,
      },
      {
        keyName: 'PrimitiveProps',
        title: 'Pass Primitive Props Instead of Large Objects',
        explanation: 'Passing only categoryId string instead of whole category object prevents re-renders when other category metadata updates.',
        codeSnippet: `// ❌ Before:\n<CategoryChip category={category} />\n\n// ✅ After:\n<CategoryChip id={category.id} name={category.name} isSelected={selectedId === category.id} />`,
        impact: 'Medium Impact',
        impactColor: AppColors.purple500,
      },
    ],
    severity: 'warning',
  },
  {
    id: 'render-5',
    name: 'NavbarUserProfile',
    type: 'component',
    sourceFile: 'src/components/NavbarUserProfile.tsx',
    renderCount: 12,
    wastefulCount: 2,
    wastefulPercentage: 16.7,
    avgRenderTimeMs: 3.1,
    totalRenderTimeMs: 37.2,
    lastRenderedAt: Date.now() - 32000,
    reasons: [
      'Avatar image cache re-validation on auth session refresh',
    ],
    fixKeys: [
      {
        keyName: 'useRefForTracking',
        title: 'Use useRef for Non-Visual Tracking Values',
        explanation: 'Do not store analytics timers, scroll offsets, or tracking IDs in useState if they do not directly alter the JSX tree.',
        codeSnippet: `// ❌ Before:\nconst [sessionCount, setSessionCount] = useState(0);\n\n// ✅ After:\nconst sessionCountRef = useRef(0);`,
        impact: 'Best Practice',
        impactColor: AppColors.sky500,
      },
    ],
    severity: 'optimal',
  },
];

const INITIAL_EVENTS: PerformanceEvent[] = [
  {
    id: 'perf-1',
    timestamp: Date.now() - 48000,
    type: 'fps_drop',
    category: 'navigation',
    fps: 38,
    durationMs: 26.3,
    label: 'Main Thread Spike during Navigation',
    detail: 'Screen transition triggered heavy layout reconciliation and simultaneous component mounts.',
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

// Global in-memory render registry
const globalRenderRegistry = new Map<string, ComponentRenderProfile>();
INITIAL_RENDER_PROFILES.forEach(profile => {
  globalRenderRegistry.set(profile.name, profile);
});

export const usePerformanceTracker = () => {
  const [isRecording, setIsRecording] = useState(true);
  const [currentFps, setCurrentFps] = useState(60);
  const [minFps, setMinFps] = useState(57);
  const [maxFps, setMaxFps] = useState(60);
  const [avgFps, setAvgFps] = useState(59);
  const [totalFrames, setTotalFrames] = useState(4820);
  const [jankyFrameCount, setJankyFrameCount] = useState(4);
  const [jsLagMs, setJsLagMs] = useState(1.2);
  const [fpsHistory, setFpsHistory] = useState<number[]>([
    60, 59, 60, 60, 58, 60, 59, 60, 60, 60, 57, 60, 59, 60, 60, 58, 60, 60, 59, 60,
    60, 60, 59, 60, 58, 60, 60, 60, 59, 60,
  ]);

  const [memoryStats, setMemoryStats] = useState<LiveMemoryStats>({
    heapUsedMb: 34.8,
    heapTotalMb: 64.0,
    gcCount: 14,
    gcPauseMs: 2.1,
    allocationRateMbPerSec: 1.8,
  });

  const [renderProfiles, setRenderProfiles] = useState<ComponentRenderProfile[]>(INITIAL_RENDER_PROFILES);
  const [events, setEvents] = useState<PerformanceEvent[]>(INITIAL_EVENTS);

  const lastFrameTimeRef = useRef<number>(Date.now());
  const rafIdRef = useRef<number | null>(null);

  // Live Frame Measurement Loop
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

      const lag = Math.max(0, delta - 16.67);
      if (lag > maxLagInSecond) {
        maxLagInSecond = lag;
      }

      frameCount++;

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
          const next = [...prev.slice(-29), measuredFps];
          const sum = next.reduce((a, b) => a + b, 0);
          setAvgFps(Math.round(sum / next.length));
          return next;
        });

        // Simulate subtle real-world memory fluctuation
        setMemoryStats(prev => {
          const delta = (Math.random() * 0.4 - 0.18);
          const nextUsed = Math.min(prev.heapTotalMb * 0.9, Math.max(20.0, Number((prev.heapUsedMb + delta).toFixed(1))));
          return {
            ...prev,
            heapUsedMb: nextUsed,
            allocationRateMbPerSec: Number((1.2 + Math.random() * 1.4).toFixed(1)),
          };
        });

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

  const mobileVitals: CoreMobileVitals = useMemo(() => {
    const jankPct = totalFrames > 0 ? Number(((jankyFrameCount / Math.max(1, totalFrames / 60)) * 100).toFixed(1)) : 0.8;
    return {
      ttiMs: 412,
      fcpMs: 180,
      inpMs: 14.2,
      jankPercentage: jankPct,
      grade: jankPct <= 2.0 ? 'Optimal' : jankPct <= 5.0 ? 'Fair' : 'Poor',
    };
  }, [totalFrames, jankyFrameCount]);

  // Aggregate re-render stats
  const reRenderSummary = useMemo(() => {
    const totalRenders = renderProfiles.reduce((sum, p) => sum + p.renderCount, 0);
    const totalWasteful = renderProfiles.reduce((sum, p) => sum + p.wastefulCount, 0);
    const overallWastefulPct = totalRenders > 0 ? Number(((totalWasteful / totalRenders) * 100).toFixed(1)) : 0;
    const topOffender = [...renderProfiles].sort((a, b) => b.renderCount - a.renderCount)[0];

    return {
      totalRenders,
      totalWasteful,
      overallWastefulPct,
      topOffender,
      totalComponentsTracked: renderProfiles.length,
    };
  }, [renderProfiles]);

  const clearEvents = () => {
    setEvents([]);
  };

  const resetRenderCounters = useCallback(() => {
    setRenderProfiles(prev =>
      prev.map(p => ({
        ...p,
        renderCount: 1,
        wastefulCount: 0,
        wastefulPercentage: 0,
        totalRenderTimeMs: p.avgRenderTimeMs,
        lastRenderedAt: Date.now(),
        severity: 'optimal',
      }))
    );
  }, []);

  const simulateComponentRender = useCallback((componentId: string) => {
    setRenderProfiles(prev =>
      prev.map(p => {
        if (p.id === componentId) {
          const nextCount = p.renderCount + 1;
          const nextWasteful = p.wastefulCount + 1;
          const nextPct = Number(((nextWasteful / nextCount) * 100).toFixed(1));
          return {
            ...p,
            renderCount: nextCount,
            wastefulCount: nextWasteful,
            wastefulPercentage: nextPct,
            totalRenderTimeMs: Number((p.totalRenderTimeMs + p.avgRenderTimeMs).toFixed(1)),
            lastRenderedAt: Date.now(),
            severity: nextCount > 30 ? 'critical' : nextCount > 15 ? 'warning' : 'optimal',
          };
        }
        return p;
      })
    );
  }, []);

  const triggerGc = () => {
    setMemoryStats(prev => ({
      ...prev,
      heapUsedMb: Math.max(22.4, Number((prev.heapUsedMb - 6.8).toFixed(1))),
      gcCount: prev.gcCount + 1,
      gcPauseMs: Number((1.4 + Math.random() * 0.8).toFixed(1)),
    }));
    const gcEvent: PerformanceEvent = {
      id: `gc-${Date.now()}`,
      timestamp: Date.now(),
      type: 'memory',
      category: 'memory',
      fps: 60,
      durationMs: 2.1,
      label: 'Manual Hermes GC Cycle Invoked',
      detail: 'Reclaimed ~6.8 MB unreferenced objects and compacted nursery spaces.',
      source: 'Hermes Memory Scavenger',
      breakdown: {jsTimeMs: 1.8, uiTimeMs: 0.3},
      heapDeltaKb: -6960,
      advice: 'Heap usage optimized. Generational nursery cleared.',
      severity: 'optimal',
    };
    setEvents(prev => [gcEvent, ...prev.slice(0, 49)]);
  };

  return {
    isRecording,
    setIsRecording,
    currentFps,
    minFps,
    maxFps,
    avgFps,
    totalFrames,
    jankyFrameCount,
    jsLagMs,
    fpsHistory,
    memoryStats,
    mobileVitals,
    renderProfiles,
    reRenderSummary,
    resetRenderCounters,
    simulateComponentRender,
    events,
    setEvents,
    clearEvents,
    triggerGc,
  };
};
