/**
 * Configuration for console logs to ignore.
 * Logs matching any of these starting prefixes will be filtered out.
 */
export const IGNORED_LOG_PREFIXES: Record<'info' | 'warn' | 'error', string[]> =
  {
    info: [
      // Add prefixes of info logs you want to ignore, e.g.:
      // 'Starting server',
      'VirtualizedList: You have a large list that is slow to update',
    ],
    warn: [
      // Add prefixes of warning logs you want to ignore, e.g.:
      // 'Require cycle:',
      // 'ViewPropTypes will be removed',
      'This method is deprecated (as well as all React Native Firebase namespaced API) and will be removed in the next major release as part of move to match Firebase Web modular SDK API.',
      'SerializableStateInvariantMiddleware took',
      'Non-serializable values were found in the navigation state.',
      'SafeAreaView has been deprecated and will be removed in a future release.',
      'Clipboard has been extracted from react-native core and will be removed in a future release.',
      'You should always pass contentWidth prop to properly handle screen rotations and have a seamless support for images scaling.',
      'Selector unknown returned a different result when called with the same parameters.',
      'You seem to update props of the "TRenderEngineProvider" component in short periods of time',
      'A non-serializable value was detected in an action',
    ],
    error: [
      // Add prefixes of error logs you want to ignore, e.g.:
      // 'Warning: Each child in a list should have a unique',
      'A non-serializable value was detected in the state, in the path: `tierStatusCalculator.date`',
      'VirtualizedLists should never be nested inside plain ScrollViews with the same orientation because it can break windowing and other functionality - use another VirtualizedList-backed container instead.',
    ],
  };
