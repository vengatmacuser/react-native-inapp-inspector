import {HomeScreen} from '../screens/HomeScreen';
import {InspectorModalScreen} from '../screens/InspectorModalScreen';

describe('07 - Analytics Events', () => {
  const home = new HomeScreen();
  const inspector = new InspectorModalScreen();
  const suiteName = '07_analytics_events';

  it('should capture custom and Firebase analytics events', async () => {
    await home.logStep(suiteName, 'Triggering analytics event', 7, 15);
    await home.triggerAnalyticsEvent();

    await inspector.openInspector();
    await inspector.switchTab('ANALYTICS');
    await home.snapshot(suiteName, '07_analytics_events_timeline');
    await inspector.closeInspector();
  });
});
