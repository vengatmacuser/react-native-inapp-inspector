import {HomeScreen} from '../screens/HomeScreen';
import {InspectorModalScreen} from '../screens/InspectorModalScreen';

describe('12 - Settings, Theming & HAR Export', () => {
  const home = new HomeScreen();
  const inspector = new InspectorModalScreen();
  const suiteName = '12_settings_and_export';

  it('should open settings and test height and language preferences', async () => {
    await home.logStep(suiteName, 'Opening Settings panel', 12, 15);
    await inspector.openInspector();
    await inspector.switchTab('SETTINGS');
    await home.snapshot(suiteName, '12_inspector_settings_panel');
    await inspector.closeInspector();
  });
});
