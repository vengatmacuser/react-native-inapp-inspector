/**
 * Sub-module entry point: react-native-inapp-inspector/performance
 * Clean tree-shaking & isolated performance tracker and profiler.
 */
export {
  usePerformanceTracker,
  useComponentProfiler,
  useNavigationProfiler,
  trackComponentRender,
  trackNavigationTransition,
  trackHeavyTask,
  measureAsync,
  getHermesMemoryStats,
  registerComponentProfile,
  subscribeRenderProfiles,
  getRenderProfiles,
  logPerformanceEvent,
  clearPerformanceEvents,
  subscribePerformanceEvents,
  getPerformanceEvents,
  getInitialRenderProfiles,
  getInitialPerformanceEvents,
  generateFixSnippet,
  setPerformanceModuleEnabled,
  getPerformanceModuleEnabled,
  setMaxPerformanceEventsLimit,
  getMaxPerformanceEventsLimit,
  prunePerformanceEvents,
  type PerformanceEvent,
  type LiveMemoryStats,
  type ComponentRenderProfile,
  type CoreMobileVitals,
  type PerformanceFixKey,
} from './customHooks/performanceTracker';

export {
  PerformanceSubTab,
} from './types';
