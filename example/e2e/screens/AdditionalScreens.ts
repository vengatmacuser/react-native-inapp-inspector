import {element, by} from 'detox';
import {BaseScreen} from './BaseScreen';
import {LOCATORS} from '../helpers/locators';

export class CrashTabScreen extends BaseScreen {
  get globalCrashModal() {
    return element(by.id(LOCATORS.CRASH.GLOBAL_MODAL));
  }

  get viewInInspectorBtn() {
    return element(by.id(LOCATORS.CRASH.VIEW_IN_INSPECTOR_BTN));
  }

  get dismissBtn() {
    return element(by.id(LOCATORS.CRASH.DISMISS_BTN));
  }

  async viewCrashInInspector() {
    await this.viewInInspectorBtn.tap();
  }

  async dismissGlobalCrash() {
    await this.dismissBtn.tap();
  }
}

export class AnalyticsTabScreen extends BaseScreen {
  // Custom analytics events verification
}

export class SocketTabScreen extends BaseScreen {
  // WebSocket frames verification
}

export class PushTabScreen extends BaseScreen {
  // Push notification payload verification
}

export class DeviceTabScreen extends BaseScreen {
  // Hardware and React Native telemetry specs verification
}

export class MediaStudioScreen extends BaseScreen {
  get recordBtn() {
    return element(by.id(LOCATORS.MEDIA.RECORD_TRIGGER));
  }

  get screenshotBtn() {
    return element(by.id(LOCATORS.MEDIA.SCREENSHOT_TRIGGER));
  }

  async triggerScreenshotCapture() {
    await this.screenshotBtn.tap();
  }

  async triggerRecordingCapture() {
    await this.recordBtn.tap();
  }
}

export class SettingsTabScreen extends BaseScreen {
  // Theming, i18n & HAR export verification
}
