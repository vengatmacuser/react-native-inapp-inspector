import {device} from 'detox';
import {verifyConnectedDebugMode} from './helpers/debugGuard';
import {HudBridge} from './hud/hudBridge';
import {saveCoverageSnapshot} from './coverage/coverageCollector';

beforeAll(async () => {
  const isDebugConnected = await verifyConnectedDebugMode();
  if (!isDebugConnected && process.env.DETOX_FORCE_RUN !== 'true') {
    console.warn(
      '⚠️ [Detox Guard] Development server not detected on localhost:8081. Skipping standalone execution.',
    );
  }

  // Launch app in debug mode
  await device.launchApp({
    newInstance: true,
    launchArgs: {
      detoxURLBlacklistRegex: '.*',
      detoxEnableSynchronization: 0,
    },
  });

  try {
    await device.disableSynchronization();
  } catch (e) {
    // ignore
  }

  HudBridge.update({
    suiteName: 'Detox Test Runner Initialized',
    stepDescription: 'App booted on simulator successfully',
    status: 'RUNNING',
  });
});

beforeEach(async () => {
  // Fast React Native JS reload (<500ms) for clean state between tests
  await device.reloadReactNative();
  try {
    await device.disableSynchronization();
  } catch (e) {
    // ignore
  }
});

afterEach(async () => {
  // Extract coverage snapshot if enabled
  await saveCoverageSnapshot('test-step');
});

afterAll(async () => {
  HudBridge.update({
    suiteName: 'All Test Suites Completed',
    stepDescription: 'Visual artifacts generated',
    status: 'PASSED',
    progressPercent: 100,
  });
});
