import {HomeScreen} from '../screens/HomeScreen';
import {InspectorModalScreen} from '../screens/InspectorModalScreen';

describe('06 - Crashes & Global Error Boundary', () => {
  const home = new HomeScreen();
  const inspector = new InspectorModalScreen();
  const suiteName = '06_crashes_and_errors';

  it('should capture crash and display in Crash tab', async () => {
    await home.logStep(suiteName, 'Triggering crash event', 6, 15);
    await home.triggerCrash();
    await home.snapshot(suiteName, '06_global_crash_screen');

    await inspector.openInspector();
    await inspector.switchTab('CRASH');
    await home.snapshot(suiteName, '06_crash_tab_detail_trace');
    await inspector.closeInspector();
  });
});
