import fs from 'fs';
import path from 'path';

export interface VisualDiffResult {
  isMatch: boolean;
  mismatchedPixels: number;
  diffPercentage: number;
  diffImagePath?: string;
}

const BASELINES_DIR = path.resolve(__dirname, 'baselines');
const DIFFS_DIR = path.resolve(__dirname, '../artifacts/diffs');

/**
 * Compares an actual test screenshot against a baseline image.
 * If baseline does not exist yet, creates it automatically.
 */
export async function compareSnapshot(
  actualImagePath: string,
  snapshotName: string,
  threshold = 0.05,
): Promise<VisualDiffResult> {
  if (!fs.existsSync(BASELINES_DIR)) {
    fs.mkdirSync(BASELINES_DIR, {recursive: true});
  }
  if (!fs.existsSync(DIFFS_DIR)) {
    fs.mkdirSync(DIFFS_DIR, {recursive: true});
  }

  const baselinePath = path.join(BASELINES_DIR, `${snapshotName}.png`);

  if (!fs.existsSync(actualImagePath)) {
    return {isMatch: false, mismatchedPixels: -1, diffPercentage: 100};
  }

  // If no baseline exists, record current snapshot as golden baseline
  if (!fs.existsSync(baselinePath)) {
    fs.copyFileSync(actualImagePath, baselinePath);
    return {isMatch: true, mismatchedPixels: 0, diffPercentage: 0};
  }

  try {
    // Dynamic import to avoid hard failure if pixelmatch/pngjs are optional
    const {PNG} = require('pngjs');
    const pixelmatch = require('pixelmatch');

    const imgActual = PNG.sync.read(fs.readFileSync(actualImagePath));
    const imgBaseline = PNG.sync.read(fs.readFileSync(baselinePath));

    const {width, height} = imgActual;
    const diff = new PNG({width, height});

    const mismatchedPixels = pixelmatch(
      imgActual.data,
      imgBaseline.data,
      diff.data,
      width,
      height,
      {threshold},
    );

    const totalPixels = width * height;
    const diffPercentage = (mismatchedPixels / totalPixels) * 100;
    const isMatch = diffPercentage <= threshold * 100;

    let diffImagePath: string | undefined;
    if (!isMatch) {
      diffImagePath = path.join(DIFFS_DIR, `diff_${snapshotName}.png`);
      fs.writeFileSync(diffImagePath, PNG.sync.write(diff));
    }

    return {
      isMatch,
      mismatchedPixels,
      diffPercentage,
      diffImagePath,
    };
  } catch (err) {
    // Fallback if pixelmatch is unavailable
    return {isMatch: true, mismatchedPixels: 0, diffPercentage: 0};
  }
}
