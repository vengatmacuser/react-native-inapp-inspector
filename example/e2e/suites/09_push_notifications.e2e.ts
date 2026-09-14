import {HomeScreen} from '../screens/HomeScreen';
import {InspectorModalScreen} from '../screens/InspectorModalScreen';

describe('09 - Push Notifications', () => {
  const home = new HomeScreen();
  const inspector = new InspectorModalScreen();
  const suiteName = '09_push_notifications';

  it('should capture push notification payloads', async () => {
    await home.logStep(suiteName, 'Triggering push payload', 9, 15);
    await home.triggerPushNotification();

    await inspector.openInspector();
    await inspector.switchTab('PUSH');
    await home.snapshot(suiteName, '09_push_notifications_list');
    await inspector.closeInspector();
  });
});
