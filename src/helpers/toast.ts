type ToastListener = (message: string) => void;
const listeners: Set<ToastListener> = new Set();

export const showToast = (message: string) => {
  listeners.forEach(fn => {
    try {
      fn(message);
    } catch {}
  });
};

export const subscribeToast = (listener: ToastListener) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
