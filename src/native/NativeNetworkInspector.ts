import type {TurboModule} from 'react-native';
import {TurboModuleRegistry} from 'react-native';

export interface Spec extends TurboModule {
  enableNativeCrashProtection(): Promise<boolean>;
  getDeviceMetrics(): Promise<Object>;
  showFloatingButton(options: Object): Promise<boolean>;
  hideFloatingButton(): Promise<boolean>;
  setFloatingButtonBadge(hasBadge: boolean): Promise<boolean>;
  setFloatingButtonPosition(x: number, y: number): Promise<boolean>;
  startFpsMonitoring(): Promise<boolean>;
  stopFpsMonitoring(): Promise<boolean>;
  getFpsMetrics(): Promise<Object>;
  getNativeStorageItem(key: string): Promise<string | null>;
  setNativeStorageItem(key: string, value: string | null): Promise<boolean>;
  triggerHaptic(style: string): Promise<boolean>;
  getNativeSystemMetrics(): Promise<Object>;
  pushNativeLogRecord(pageKey: string, jsonPayload: string): Promise<boolean>;
  checkFloatingButtonPress(): Promise<boolean>;
  addListener(eventName: string): void;
  removeListeners(count: number): void;
}

export default TurboModuleRegistry.get<Spec>('NetworkInspectorModule');
