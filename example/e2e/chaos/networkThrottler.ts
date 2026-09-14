/**
 * Network Chaos & Latency Simulator for E2E Testing
 */
export interface ChaosOptions {
  latencyMs?: number;
  failureRate?: number; // 0.0 - 1.0
  customStatusCode?: number;
}

export const NetworkThrottler = {
  activeChaos: null as ChaosOptions | null,

  enableChaos(options: ChaosOptions) {
    this.activeChaos = options;
  },

  disableChaos() {
    this.activeChaos = null;
  },

  async applyLatency(): Promise<void> {
    if (this.activeChaos?.latencyMs) {
      await new Promise(resolve => setTimeout(resolve, this.activeChaos!.latencyMs));
    }
  },

  shouldFail(): boolean {
    if (!this.activeChaos?.failureRate) return false;
    return Math.random() < this.activeChaos.failureRate;
  },
};
