// ─── Method & Class Decorators for React Native In-App Inspector ─────────────
//
// Clean TypeScript decorators to seamlessly annotate methods, asynchronous actions,
// and API services with automatic inspection, logging, timing, and error boundaries.
// ─────────────────────────────────────────────────────────────────────────────

export interface InspectLogOptions {
  tag?: string;
  logArgs?: boolean;
  logResult?: boolean;
  logDuration?: boolean;
}

/**
 * `@InspectLog`: Automatically logs method execution, arguments, duration, and return values
 * to the In-App Inspector Console.
 *
 * @example
 * ```ts
 * class UserService {
 *   @InspectLog({ tag: 'API', logArgs: true, logDuration: true })
 *   async fetchUser(id: string) {
 *     return api.get(`/users/${id}`);
 *   }
 * }
 * ```
 */
export function InspectLog(options: InspectLogOptions = {}) {
  const {
    tag = 'Inspect',
    logArgs = true,
    logResult = true,
    logDuration = true,
  } = options;

  return function (
    _target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = function (...args: any[]) {
      const start = Date.now();
      const prefix = `[${tag}] ${propertyKey}`;

      if (logArgs && args.length > 0) {
        console.log(`${prefix} called with arguments:`, ...args);
      } else {
        console.log(`${prefix} invoked`);
      }

      try {
        const result = originalMethod.apply(this, args);

        if (result && typeof result.then === 'function') {
          return result
            .then((asyncResult: any) => {
              const elapsed = Date.now() - start;
              if (logResult) {
                console.log(
                  `${prefix} resolved${logDuration ? ` in ${elapsed}ms` : ''}:`,
                  asyncResult,
                );
              }
              return asyncResult;
            })
            .catch((err: any) => {
              const elapsed = Date.now() - start;
              console.error(
                `${prefix} rejected${logDuration ? ` in ${elapsed}ms` : ''}:`,
                err,
              );
              throw err;
            });
        }

        const elapsed = Date.now() - start;
        if (logResult) {
          console.log(
            `${prefix} returned${logDuration ? ` in ${elapsed}ms` : ''}:`,
            result,
          );
        }
        return result;
      } catch (error) {
        const elapsed = Date.now() - start;
        console.error(
          `${prefix} failed${logDuration ? ` in ${elapsed}ms` : ''}:`,
          error,
        );
        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * `@InspectTrackTime`: Measures and logs execution duration for critical functions.
 *
 * @example
 * ```ts
 * class FeedManager {
 *   @InspectTrackTime('Feed Data Processing')
 *   processFeedItems(items: FeedItem[]) { ... }
 * }
 * ```
 */
export function InspectTrackTime(label?: string) {
  return function (
    _target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;
    const metricLabel = label || propertyKey;

    descriptor.value = function (...args: any[]) {
      const start = Date.now();
      try {
        const result = originalMethod.apply(this, args);
        if (result && typeof result.then === 'function') {
          return result.finally(() => {
            const duration = Date.now() - start;
            console.log(`[PERF] ⚡ ${metricLabel} took ${duration}ms`);
          });
        }
        const duration = Date.now() - start;
        console.log(`[PERF] ⚡ ${metricLabel} took ${duration}ms`);
        return result;
      } catch (err) {
        const duration = Date.now() - start;
        console.error(`[PERF] ⚡ ${metricLabel} failed after ${duration}ms:`, err);
        throw err;
      }
    };

    return descriptor;
  };
}

/**
 * `@InspectCatch`: Safely catches unhandled exceptions thrown inside the method,
 * logs them to the In-App Inspector, and returns a fallback value.
 *
 * @example
 * ```ts
 * class AuthService {
 *   @InspectCatch({ fallback: null, tag: 'AUTH' })
 *   async getCachedToken() { ... }
 * }
 * ```
 */
export function InspectCatch(options: { fallback?: any; tag?: string } = {}) {
  const { fallback = undefined, tag = 'Catch' } = options;

  return function (
    _target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = function (...args: any[]) {
      try {
        const result = originalMethod.apply(this, args);
        if (result && typeof result.then === 'function') {
          return result.catch((err: any) => {
            console.error(`[${tag}] Error caught in ${propertyKey}:`, err);
            return fallback;
          });
        }
        return result;
      } catch (err) {
        console.error(`[${tag}] Error caught in ${propertyKey}:`, err);
        return fallback;
      }
    };

    return descriptor;
  };
}
