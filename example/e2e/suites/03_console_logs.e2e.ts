import {HomeScreen} from '../screens/HomeScreen';
import {InspectorModalScreen} from '../screens/InspectorModalScreen';
import {ConsoleTabScreen} from '../screens/ConsoleTabScreen';

describe('03 - Console Logs & Metro Symbolication', () => {
  const home = new HomeScreen();
  const inspector = new InspectorModalScreen();
  const consoleTab = new ConsoleTabScreen();
  const suiteName = '03_console_logs';

  it('should capture console log, warning, and error events', async () => {
    await home.logStep(suiteName, 'Triggering console events', 3, 15);
    await home.triggerConsoleLog();
    await home.triggerConsoleWarn();
    await home.triggerConsoleError();

    await inspector.openInspector();
    await inspector.switchTab('LOGS');
    await home.snapshot(suiteName, '03_console_tab_logs');

    await consoleTab.filterWarnings();
    await home.snapshot(suiteName, '03_console_filtered_warnings');

    await inspector.closeInspector();
  });
});
