import {element, by, expect} from 'detox';
import {HudBridge} from '../hud/hudBridge';
import {takeStepScreenshot} from '../helpers/screenshot';

export abstract class BaseScreen {
  async logStep(suiteName: string, stepDescription: string, suiteIndex = 1, totalSuites = 15) {
    HudBridge.update({
      suiteName,
      stepDescription,
      suiteIndex,
      totalSuites,
      status: 'RUNNING',
    });
  }

  async snapshot(suiteName: string, stepName: string): Promise<string> {
    HudBridge.update({
      status: 'SNAPSHOT',
      snapshotName: stepName,
    });
    const path = await takeStepScreenshot(suiteName, stepName);
    return path;
  }

  async expectVisible(testID: string, timeout = 5000) {
    await waitFor(element(by.id(testID)))
      .toBeVisible()
      .withTimeout(timeout);
  }

  async tap(testID: string, timeout = 5000) {
    try {
      await this.expectVisible(testID, timeout);
    } catch {}
    try {
      await element(by.id(testID)).atIndex(0).tap();
    } catch {
      await element(by.id(testID)).tap();
    }
  }
}
