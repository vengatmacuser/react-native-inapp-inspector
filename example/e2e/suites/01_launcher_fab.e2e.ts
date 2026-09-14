import {expect} from 'detox';
import {HomeScreen} from '../screens/HomeScreen';
import {InspectorModalScreen} from '../screens/InspectorModalScreen';

describe('01 - Launcher & Floating Action Button (FAB)', () => {
  const home = new HomeScreen();
  const inspector = new InspectorModalScreen();
  const suiteName = '01_launcher_fab';

  it('should render floating launcher button on screen mount', async () => {
    await home.logStep(suiteName, 'Verifying FAB initial position', 1, 15);
    await home.verifyMounted();
    await home.snapshot(suiteName, '01_fab_initial_position');
  });

  it('should open and close inspector modal via launcher and close button', async () => {
    await home.logStep(suiteName, 'Opening inspector modal via FAB', 1, 15);
    await inspector.openInspector();
    await home.snapshot(suiteName, '02_inspector_modal_opened');

    await home.logStep(suiteName, 'Closing inspector modal', 1, 15);
    await inspector.closeInspector();
    await home.snapshot(suiteName, '03_inspector_closed_to_fab');
  });
});
