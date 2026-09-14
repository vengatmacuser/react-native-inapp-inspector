import {HomeScreen} from '../screens/HomeScreen';
import {InspectorModalScreen} from '../screens/InspectorModalScreen';

describe('10 - Device Telemetry', () => {
  const home = new HomeScreen();
  const inspector = new InspectorModalScreen();
  const suiteName = '10_device_telemetry';

  it('should display hardware stats, React Native architecture and Hermes flags', async () => {
    await home.logStep(suiteName, 'Viewing Device Info tab', 10, 15);
    await inspector.openInspector();
    await inspector.switchTab('DEVICE');
    await home.snapshot(suiteName, '10_device_info_specs');
    await inspector.closeInspector();
  });
});
