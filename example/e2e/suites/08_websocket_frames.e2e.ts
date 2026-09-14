import {HomeScreen} from '../screens/HomeScreen';
import {InspectorModalScreen} from '../screens/InspectorModalScreen';

describe('08 - WebSockets Inspector', () => {
  const home = new HomeScreen();
  const inspector = new InspectorModalScreen();
  const suiteName = '08_websocket_frames';

  it('should capture WebSocket frames sent and received', async () => {
    await home.logStep(suiteName, 'Transmitting test socket message', 8, 15);
    await home.triggerSocketMessage();

    await inspector.openInspector();
    await inspector.switchTab('SOCKET');
    await home.snapshot(suiteName, '08_websocket_tab_frames');
    await inspector.closeInspector();
  });
});
