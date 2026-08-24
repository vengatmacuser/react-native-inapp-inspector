/**
 * Sub-module entry point: react-native-inapp-inspector/bundle
 * Clean tree-shaking & isolated JS bundle size analyzer.
 */
export {
  analyzeHostAppBundle,
  parseBundleSource,
  getInitialBundleAnalysis,
  getCachedBundleAnalysis,
  clearCachedBundleAnalysis,
  setBundleModuleEnabled,
  getBundleModuleEnabled,
  getHostScriptURL,
  trackRuntimeModuleExecution,
  trackRuntimeDefine,
  type HostBundleAnalysisResult,
  type HostBundleFileItem,
  type HostBundlePackageItem,
  type HostBinaryComponentItem,
  type FileTypeCategory,
} from './customHooks/bundleAnalyzer';

export {
  BundleSubTab,
} from './types';
