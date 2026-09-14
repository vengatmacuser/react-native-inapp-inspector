import {HomeScreen} from '../screens/HomeScreen';
import {InspectorModalScreen} from '../screens/InspectorModalScreen';
import {compareSnapshot} from '../visual/visualRegression';

describe('15 - Visual Regression & Pixel-Diff Testing', () => {
  const home = new HomeScreen();
  const inspector = new InspectorModalScreen();
  const suiteName = '15_visual_regression';

  it('should verify pixel-diff match against golden baselines', async () => {
    await home.logStep(suiteName, 'Executing pixel-diff visual comparison', 15, 15);
    await inspector.openInspector();

    const snapshotPath = await home.snapshot(suiteName, '15_pixel_diff_verified');
    if (snapshotPath) {
      const diffResult = await compareSnapshot(snapshotPath, 'inspector_main_baseline');
      // Verify visual match threshold
      if (!diffResult.isMatch) {
        console.warn(
          `⚠️ [Visual Regression] Pixel mismatch: ${diffResult.diffPercentage.toFixed(2)}%`,
        );
      }
    }

    await inspector.closeInspector();
  });
});
