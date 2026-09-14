import {element, by, expect} from 'detox';
import {BaseScreen} from './BaseScreen';
import {LOCATORS} from '../helpers/locators';

export class NetworkTabScreen extends BaseScreen {
  get copyCurlButton() {
    return element(by.id(LOCATORS.NETWORK.COPY_CURL));
  }

  get responseBody() {
    return element(by.id(LOCATORS.NETWORK.RESPONSE_BODY));
  }

  async selectRequestAtIndex(index: number) {
    const itemLocator = `${LOCATORS.NETWORK.ITEM_PREFIX}${index}`;
    await this.tap(itemLocator);
  }

  async filterByErrors() {
    await this.tap(LOCATORS.NETWORK.FILTER_ERRORS);
  }

  async filterByGraphQL() {
    await this.tap(LOCATORS.NETWORK.FILTER_GRAPHQL);
  }

  async copyCurl() {
    await this.copyCurlButton.tap();
  }
}
