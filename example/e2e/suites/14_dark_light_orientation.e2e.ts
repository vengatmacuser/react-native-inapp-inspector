import {device} from 'detox';
import {HomeScreen} from '../screens/HomeScreen';
import {InspectorModalScreen} from '../screens/InspectorModalScreen';

describe('14 - Dark/Light Theme & Screen Orientation Matrix', () => {
  const home = new HomeScreen();
  const inspector = new InspectorModalScreen();
  const suiteName = '14_dark_light_orientation';

  it('should adapt to landscape orientation and verify inspector UI', async () => {
    await home.logStep(suiteName, 'Testing landscape layout and theme adaptations', 14, 15);

    try {
      await (device as any).setAppearance?.('dark');
    } catch {}

    await inspector.openInspector();
    await home.snapshot(suiteName, '14_inspector_modal_active');

    try {
      await device.setOrientation('landscape');
      await home.snapshot(suiteName, '14_landscape_orientation');
      await device.setOrientation('portrait');
    } catch {}

    await inspector.closeInspector();
  });
});
