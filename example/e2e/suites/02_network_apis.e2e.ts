import {HomeScreen} from '../screens/HomeScreen';
import {InspectorModalScreen} from '../screens/InspectorModalScreen';
import {NetworkTabScreen} from '../screens/NetworkTabScreen';

describe('02 - Network & APIs Inspector', () => {
  const home = new HomeScreen();
  const inspector = new InspectorModalScreen();
  const network = new NetworkTabScreen();
  const suiteName = '02_network_apis';

  it('should capture HTTP GET and POST requests with details and cURL copy', async () => {
    await home.logStep(suiteName, 'Triggering sample GET & POST requests', 2, 15);
    await home.triggerGetRequest();
    await home.triggerPostRequest();

    await home.logStep(suiteName, 'Opening inspector Network tab', 2, 15);
    await inspector.openInspector();
    await inspector.switchTab('APIS');
    await home.snapshot(suiteName, '02_network_tab_list');

    await home.logStep(suiteName, 'Selecting network request item', 2, 15);
    await network.selectRequestAtIndex(0);
    await home.snapshot(suiteName, '02_network_detail_headers');

    await inspector.closeInspector();
  });
});
