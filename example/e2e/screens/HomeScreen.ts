import {element, by, expect} from 'detox';
import {BaseScreen} from './BaseScreen';
import {LOCATORS} from '../helpers/locators';

export class HomeScreen extends BaseScreen {
  get fabLauncher() {
    return element(by.id(LOCATORS.FAB_LAUNCHER));
  }

  get fabBadge() {
    return element(by.id(LOCATORS.FAB_BADGE));
  }

  async verifyMounted() {
    await this.expectVisible(LOCATORS.FAB_LAUNCHER);
  }

  async triggerGetRequest() {
    await this.tap(LOCATORS.HOME.TRIGGER_GET);
  }

  async triggerPostRequest() {
    await this.tap(LOCATORS.HOME.TRIGGER_GET);
  }

  async triggerGraphqlRequest() {
    await this.tap(LOCATORS.HOME.TRIGGER_GET);
  }

  async triggerErrorRequest() {
    await this.tap(LOCATORS.HOME.TRIGGER_GET);
  }

  async triggerConsoleLog() {
    await this.tap(LOCATORS.HOME.TRIGGER_GET);
  }

  async triggerConsoleWarn() {
    await this.tap(LOCATORS.HOME.TRIGGER_GET);
  }

  async triggerConsoleError() {
    await this.tap(LOCATORS.HOME.TRIGGER_GET);
  }

  async triggerReduxAction() {
    await this.tap(LOCATORS.HOME.TRIGGER_GET);
  }

  async triggerCrash() {
    await this.tap(LOCATORS.HOME.TRIGGER_GET);
  }

  async triggerAnalyticsEvent() {
    await this.tap(LOCATORS.HOME.TRIGGER_GET);
  }

  async triggerSocketMessage() {
    await this.tap(LOCATORS.HOME.TRIGGER_GET);
  }

  async triggerPushNotification() {
    await this.tap(LOCATORS.HOME.TRIGGER_GET);
  }
}
