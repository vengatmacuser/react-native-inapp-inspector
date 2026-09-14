import {element, by} from 'detox';
import {BaseScreen} from './BaseScreen';
import {LOCATORS} from '../helpers/locators';

export class StorageTabScreen extends BaseScreen {
  get addKeyButton() {
    return element(by.id(LOCATORS.STORAGE.ADD_BTN));
  }

  get keyInput() {
    return element(by.id(LOCATORS.STORAGE.KEY_INPUT));
  }

  get valueInput() {
    return element(by.id(LOCATORS.STORAGE.VALUE_INPUT));
  }

  get saveButton() {
    return element(by.id(LOCATORS.STORAGE.SAVE_BTN));
  }

  get clearAllButton() {
    return element(by.id(LOCATORS.STORAGE.CLEAR_ALL_BTN));
  }

  async addStorageItem(key: string, value: string) {
    await this.addKeyButton.tap();
    await this.keyInput.typeText(key);
    await this.valueInput.typeText(value);
    await this.saveButton.tap();
  }

  async clearAll() {
    await this.clearAllButton.tap();
  }
}
