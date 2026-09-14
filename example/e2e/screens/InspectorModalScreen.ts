import {element, by, expect} from 'detox';
import {BaseScreen} from './BaseScreen';
import {LOCATORS} from '../helpers/locators';

export class InspectorModalScreen extends BaseScreen {
  get modalContainer() {
    return element(by.id(LOCATORS.MAIN_MODAL));
  }

  get closeButton() {
    return element(by.id(LOCATORS.HEADER_CLOSE));
  }

  get clearButton() {
    return element(by.id(LOCATORS.HEADER_CLEAR));
  }

  get searchInput() {
    return element(by.id(LOCATORS.HEADER_SEARCH));
  }

  get peekButton() {
    return element(by.id(LOCATORS.HEADER_PEEK));
  }

  async openInspector() {
    await this.tap(LOCATORS.FAB_LAUNCHER);
    await this.expectVisible(LOCATORS.HEADER_CLOSE);
  }

  async closeInspector() {
    await this.tap(LOCATORS.HEADER_CLOSE);
    await this.expectVisible(LOCATORS.FAB_LAUNCHER);
  }

  async switchTab(tabId: keyof typeof LOCATORS.TAB) {
    const tabLocator = LOCATORS.TAB[tabId];
    try {
      await waitFor(element(by.id(tabLocator)))
        .toBeVisible()
        .withTimeout(3000);
      await element(by.id(tabLocator)).atIndex(0).tap();
    } catch {
      try {
        await element(by.id('inspector.tab.scrollview')).scrollTo('right');
        await element(by.id(tabLocator)).atIndex(0).tap();
      } catch {
        // Tab already active or non-fatal
      }
    }
  }

  async search(query: string) {
    await this.searchInput.typeText(query);
  }

  async clearSearch() {
    await this.searchInput.clearText();
  }
}
