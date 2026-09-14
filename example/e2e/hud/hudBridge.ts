export interface TestProgressState {
  suiteIndex: number;
  totalSuites: number;
  suiteName: string;
  stepDescription: string;
  progressPercent: number;
  status: 'RUNNING' | 'PASSED' | 'FAILED' | 'SNAPSHOT';
  snapshotName?: string;
  elapsedSeconds: number;
}

let currentState: TestProgressState = {
  suiteIndex: 1,
  totalSuites: 15,
  suiteName: 'Initializing Detox Simulator...',
  stepDescription: 'Connecting to React Native Bridge',
  progressPercent: 0,
  status: 'RUNNING',
  elapsedSeconds: 0,
};

type ProgressListener = (state: TestProgressState) => void;
const listeners: Set<ProgressListener> = new Set();

export const HudBridge = {
  subscribe(listener: ProgressListener): () => void {
    listeners.add(listener);
    listener(currentState);
    return () => {
      listeners.delete(listener);
    };
  },

  update(partial: Partial<TestProgressState>) {
    currentState = {
      ...currentState,
      ...partial,
      progressPercent: Math.min(
        100,
        Math.max(
          0,
          partial.progressPercent ??
            Math.round(((partial.suiteIndex ?? currentState.suiteIndex) / (partial.totalSuites ?? currentState.totalSuites)) * 100),
        ),
      ),
    };
    listeners.forEach(l => l(currentState));
  },

  getState(): TestProgressState {
    return currentState;
  },
};
