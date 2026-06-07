let currentReduxState: any = null;
const listeners = new Set<() => void>();
let globalReduxAutoRefresh = true;

let lastActionForReducer: Record<string, any> = {};

export const getReduxState = () => currentReduxState;

export const setReduxAutoRefresh = (val: boolean) => {
  globalReduxAutoRefresh = val;
};

export const getReduxAutoRefresh = () => globalReduxAutoRefresh;

export const getLastActionForReducer = () => lastActionForReducer;

export const clearLastActionForReducer = () => {
  lastActionForReducer = {};
  listeners.forEach(cb => cb());
};

export const setReduxState = (state: any) => {
  currentReduxState = state;
  listeners.forEach(cb => cb());
};

export const subscribeReduxState = (cb: () => void) => {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
};

export const connectReduxStore = (store: any) => {
  if (!store || typeof store.getState !== 'function' || typeof store.subscribe !== 'function') {
    console.warn('[NetworkInspector] Invalid Redux store passed to connectReduxStore.');
    return;
  }

  // Intercept dispatch calls to log actions and tie them to modified state slices
  const originalDispatch = store.dispatch.bind(store);
  store.dispatch = (action: any) => {
    const prevState = store.getState();
    const result = originalDispatch(action);
    const nextState = store.getState();

    // Map the dispatched action to state slices that actually changed
    if (
      prevState &&
      nextState &&
      typeof prevState === 'object' &&
      typeof nextState === 'object' &&
      action &&
      typeof action === 'object'
    ) {
      Object.keys(nextState).forEach(key => {
        if (prevState[key] !== nextState[key]) {
          lastActionForReducer[key] = {
            type: action.type || 'UNKNOWN_ACTION',
            payload: action.payload !== undefined ? action.payload : null,
            timestamp: new Date().toLocaleTimeString(),
          };
        }
      });
    }

    if (globalReduxAutoRefresh) {
      setReduxState(nextState);
    }

    return result;
  };

  setReduxState(store.getState());

  // Listen to subscription for devtools updates or any other state changes
  store.subscribe(() => {
    if (globalReduxAutoRefresh) {
      setReduxState(store.getState());
    }
  });
};
