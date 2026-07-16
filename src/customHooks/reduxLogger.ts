// #8 — Redux inspector module.
//
// Two integration paths, both feeding the same timeline/state snapshot:
//
//   1. `inspectorReduxMiddleware` (recommended) — a standard Redux middleware.
//      Because it sits inside the middleware chain it sees EVERY action,
//      including ones dispatched from thunks, sagas, listeners and RTK Query.
//
//   2. `connectReduxStore(store)` — zero-config fallback. It wraps the outer
//      `store.dispatch` AND diffs state on `store.subscribe`, so even actions
//      that bypass the wrapped dispatch (thunk/saga internals capture the raw
//      dispatch reference at store-creation time) still update the state tree
//      and per-reducer "last action" consistently.

let currentReduxState: any = null;
const listeners = new Set<() => void>();
let globalReduxAutoRefresh = true;

let lastActionForReducer: Record<string, any> = {};

export interface ReduxHistoryEntry {
  id: number;
  type: string;
  payload: any;
  timestamp: string;
  affectedSlices: string[];
  prevState?: any;
  nextState?: any;
}

let actionHistory: ReduxHistoryEntry[] = [];

const MAX_HISTORY = 50;
let historyIdSeq = 0;

// Guards against double-instrumentation (e.g. connectReduxStore called twice,
// or middleware + connect used together) which previously produced duplicate
// timeline entries and inconsistent counts.
const connectedStores = new WeakSet<object>();
let middlewareAttached = false;

export const getReduxState = () => currentReduxState;

export const setReduxAutoRefresh = (val: boolean) => {
  globalReduxAutoRefresh = val;
};

export const getReduxAutoRefresh = () => globalReduxAutoRefresh;

export const getLastActionForReducer = () => lastActionForReducer;

export const clearLastActionForReducer = () => {
  lastActionForReducer = {};
  notify();
};

export const getActionHistory = () => actionHistory;

export const clearActionHistory = () => {
  actionHistory = [];
  notify();
};

export const setReduxState = (state: any) => {
  currentReduxState = state;
  notify();
};

export const subscribeReduxState = (cb: () => void) => {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
};

function notify() {
  listeners.forEach(cb => cb());
}

function actionTypeOf(action: any): string {
  if (typeof action === 'string') return action;
  if (action && typeof action === 'object' && action.type != null) {
    return String(action.type);
  }
  if (typeof action === 'function') {
    return action.name ? `thunk: ${action.name}` : 'thunk';
  }
  return 'UNKNOWN_ACTION';
}

function recordAction(action: any, prevState: any, nextState: any) {
  const type = actionTypeOf(action);
  const payload =
    action && typeof action === 'object' && action.payload !== undefined
      ? action.payload
      : null;
  const timestamp = new Date().toLocaleTimeString();

  const affectedSlices: string[] = [];
  if (
    prevState &&
    nextState &&
    typeof prevState === 'object' &&
    typeof nextState === 'object'
  ) {
    Object.keys(nextState).forEach(key => {
      if (prevState[key] !== nextState[key]) {
        lastActionForReducer[key] = {type, payload, timestamp};
        affectedSlices.push(key);
      }
    });
  }

  actionHistory.unshift({
    id: ++historyIdSeq,
    type,
    payload,
    timestamp,
    affectedSlices,
    prevState,
    nextState,
  });
  if (actionHistory.length > MAX_HISTORY) {
    actionHistory.length = MAX_HISTORY;
  }

  if (globalReduxAutoRefresh) {
    currentReduxState = nextState;
  }
  // Timeline / last-action map always changed — notify even when the state
  // tree snapshot is paused so those panels stay live.
  notify();
}

/**
 * Standard Redux middleware — add it to your store to capture every action,
 * including those dispatched from thunks, sagas and RTK Query:
 *
 *   const store = configureStore({
 *     reducer,
 *     middleware: gDM => gDM().concat(inspectorReduxMiddleware),
 *   });
 *
 * Pair with `connectReduxStore(store)` (safe — they de-duplicate) or rely on
 * the middleware alone; the initial snapshot is taken on the first action.
 */
export const inspectorReduxMiddleware =
  (storeApi: any) => (next: (action: any) => any) => (action: any) => {
    middlewareAttached = true;
    // Thunks are functions — let them run; their inner plain-action dispatches
    // pass back through this same middleware, so nothing is lost.
    if (typeof action === 'function') {
      return next(action);
    }
    const prevState = storeApi.getState();
    const result = next(action);
    const nextState = storeApi.getState();
    if (currentReduxState == null) currentReduxState = nextState;
    recordAction(action, prevState, nextState);
    return result;
  };

export const connectReduxStore = (store: any) => {
  if (
    !store ||
    typeof store.getState !== 'function' ||
    typeof store.subscribe !== 'function'
  ) {
    console.warn(
      '[NetworkInspector] Invalid Redux store passed to connectReduxStore.',
    );
    return;
  }

  // Idempotent — connecting the same store twice must not double-wrap
  // dispatch or double-record the timeline.
  if (connectedStores.has(store)) {
    return;
  }
  connectedStores.add(store);

  // Wrap the outer dispatch so directly dispatched actions get full
  // type/payload attribution. Skipped when the middleware is already
  // attached, otherwise every direct dispatch would be recorded twice.
  const originalDispatch = store.dispatch.bind(store);
  let inWrappedDispatch = false;
  store.dispatch = (action: any) => {
    if (middlewareAttached || typeof action === 'function') {
      // Middleware handles recording, or it's a thunk whose inner dispatches
      // will be picked up individually.
      inWrappedDispatch = true;
      try {
        return originalDispatch(action);
      } finally {
        inWrappedDispatch = false;
      }
    }
    const prevState = store.getState();
    inWrappedDispatch = true;
    let result;
    try {
      result = originalDispatch(action);
    } finally {
      inWrappedDispatch = false;
    }
    recordAction(action, prevState, store.getState());
    return result;
  };

  setReduxState(store.getState());

  // Subscribe-diff fallback: catches state changes whose dispatch bypassed
  // the wrapper above (thunk/saga internals hold the raw dispatch reference).
  // Without this, the tree and per-reducer last-action drifted out of sync.
  let lastSeenState = store.getState();
  store.subscribe(() => {
    const nextState = store.getState();
    if (nextState === lastSeenState) return;
    const prevState = lastSeenState;
    lastSeenState = nextState;

    if (inWrappedDispatch || middlewareAttached) {
      // Already recorded with proper attribution; just refresh the snapshot.
      if (globalReduxAutoRefresh) {
        currentReduxState = nextState;
        notify();
      }
      return;
    }
    // Change arrived outside the wrapped dispatch — record it so the
    // timeline stays consistent, even without the original action type.
    recordAction(
      {type: '@@inspector/EXTERNAL_STATE_CHANGE'},
      prevState,
      nextState,
    );
  });
};
