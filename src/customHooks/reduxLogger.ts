let currentReduxState: any = null;
const listeners = new Set<() => void>();

export const getReduxState = () => currentReduxState;

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
  setReduxState(store.getState());
  store.subscribe(() => {
    setReduxState(store.getState());
  });
};
