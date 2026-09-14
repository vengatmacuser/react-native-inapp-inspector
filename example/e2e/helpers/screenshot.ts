import fs from 'fs';
import path from 'path';
import {device} from 'detox';

const SCREENSHOT_DIR = path.resolve(__dirname, '../artifacts/screenshots');

export interface ScreenshotMetadata {
  suiteName: string;
  stepName: string;
  timestamp: string;
  filePath: string;
}

export const capturedSnapshots: ScreenshotMetadata[] = [];

/**
 * Captures a high-resolution screenshot at a specific test milestone
 * and organizes it inside e2e/artifacts/screenshots/<suite-name>/
 */
export async function takeStepScreenshot(
  suiteName: string,
  stepName: string,
): Promise<string> {
  const sanitizedSuite = suiteName.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
  const sanitizedStep = stepName.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
  const targetDir = path.join(SCREENSHOT_DIR, sanitizedSuite);

  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, {recursive: true});
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const fileName = `${sanitizedStep}.png`;
  const fullPath = path.join(targetDir, fileName);

  try {
    const screenshotPath = await device.takeScreenshot(sanitizedStep);
    if (screenshotPath && fs.existsSync(screenshotPath)) {
      fs.copyFileSync(screenshotPath, fullPath);
    }

    capturedSnapshots.push({
      suiteName,
      stepName,
      timestamp,
      filePath: fullPath,
    });

    return fullPath;
  } catch (error) {
    // If native screenshot fails gracefully continue
    return '';
  }
}
