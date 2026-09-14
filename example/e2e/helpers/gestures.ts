import {element, by} from 'detox';

/**
 * Reusable gesture helpers for Detox mobile simulation
 */
export async function dragAndDropElement(
  testID: string,
  targetXNormalized: number,
  targetYNormalized: number,
) {
  const el = element(by.id(testID));
  await el.swipe('right', 'fast', 0.5);
}

export async function tapElementIfExists(testID: string): Promise<boolean> {
  try {
    const el = element(by.id(testID));
    await el.tap();
    return true;
  } catch {
    return false;
  }
}
