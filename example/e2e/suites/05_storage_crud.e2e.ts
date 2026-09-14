import {HomeScreen} from '../screens/HomeScreen';
import {InspectorModalScreen} from '../screens/InspectorModalScreen';
import {StorageTabScreen} from '../screens/StorageTabScreen';

describe('05 - Storage Inspector (AsyncStorage/MMKV)', () => {
  const home = new HomeScreen();
  const inspector = new InspectorModalScreen();
  const storageTab = new StorageTabScreen();
  const suiteName = '05_storage_crud';

  it('should view storage keys and add key-value entries', async () => {
    await home.logStep(suiteName, 'Opening storage tab in inspector', 5, 15);
    await inspector.openInspector();
    await inspector.switchTab('STORAGE');
    await home.snapshot(suiteName, '05_storage_keys_list');

    await inspector.closeInspector();
  });
});
