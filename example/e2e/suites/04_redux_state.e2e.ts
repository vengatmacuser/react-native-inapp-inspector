import {HomeScreen} from '../screens/HomeScreen';
import {InspectorModalScreen} from '../screens/InspectorModalScreen';
import {ReduxTabScreen} from '../screens/ReduxTabScreen';

describe('04 - Redux & State Inspector', () => {
  const home = new HomeScreen();
  const inspector = new InspectorModalScreen();
  const reduxTab = new ReduxTabScreen();
  const suiteName = '04_redux_state';

  it('should inspect Redux slice state and dispatched actions history', async () => {
    await home.logStep(suiteName, 'Dispatching sample Redux action', 4, 15);
    await home.triggerReduxAction();

    await inspector.openInspector();
    await inspector.switchTab('REDUX');
    await home.snapshot(suiteName, '04_redux_state_tree');

    await inspector.closeInspector();
  });
});
