import {HomeScreen} from '../screens/HomeScreen';
import {InspectorModalScreen} from '../screens/InspectorModalScreen';
import {NetworkThrottler} from '../chaos/networkThrottler';

describe('13 - Network Chaos & Stress Testing', () => {
  const home = new HomeScreen();
  const inspector = new InspectorModalScreen();
  const suiteName = '13_network_chaos_stress';

  it('should handle simulated high latency and degraded network gracefully', async () => {
    await home.logStep(suiteName, 'Injecting 1500ms simulated 3G latency', 13, 15);
    NetworkThrottler.enableChaos({latencyMs: 1500});

    await home.triggerGetRequest();
    await inspector.openInspector();
    await inspector.switchTab('APIS');
    await home.snapshot(suiteName, '13_chaos_throttled_latency');

    NetworkThrottler.disableChaos();
    await inspector.closeInspector();
  });
});
