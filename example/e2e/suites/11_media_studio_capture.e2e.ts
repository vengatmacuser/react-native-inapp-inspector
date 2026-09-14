import {HomeScreen} from '../screens/HomeScreen';
import {InspectorModalScreen} from '../screens/InspectorModalScreen';

describe('11 - Media Studio & Quick Capture', () => {
  const home = new HomeScreen();
  const inspector = new InspectorModalScreen();
  const suiteName = '11_media_studio_capture';

  it('should view Media Gallery tab and capture controls', async () => {
    await home.logStep(suiteName, 'Opening Media tab in inspector', 11, 15);
    await inspector.openInspector();
    await inspector.switchTab('MEDIA');
    await home.snapshot(suiteName, '11_media_gallery_grid');
    await inspector.closeInspector();
  });
});
