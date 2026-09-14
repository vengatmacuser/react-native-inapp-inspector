import {element, by} from 'detox';
import {BaseScreen} from './BaseScreen';
import {LOCATORS} from '../helpers/locators';

export class ConsoleTabScreen extends BaseScreen {
  async filterLogs() {
    await this.tap(LOCATORS.CONSOLE.FILTER_LOG);
  }

  async filterWarnings() {
    await this.tap(LOCATORS.CONSOLE.FILTER_WARN);
  }

  async filterErrors() {
    await this.tap(LOCATORS.CONSOLE.FILTER_ERROR);
  }

  async selectLogAtIndex(index: number) {
    await this.tap(`${LOCATORS.CONSOLE.ITEM_PREFIX}${index}`);
  }
}
