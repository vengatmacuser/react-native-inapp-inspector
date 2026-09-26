import type {TurboModule} from 'react-native';
import {TurboModuleRegistry} from 'react-native';

export interface Spec extends TurboModule {
  enableNativeCrashProtection(): Promise<boolean>;
  getLastNativeCrash(): Promise<Object | null>;
  clearLastNativeCrash(): Promise<boolean>;
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
  takeScreenshot(options: Object): Promise<Object>;
  startVideoRecording(options: Object): Promise<boolean>;
  stopVideoRecording(): Promise<Object>;
  isRecording(): Promise<boolean>;
  convertToGif(videoUri: string, options: Object): Promise<Object>;
  playVideo(videoUri: string): Promise<boolean>;
  getCapturedMedia(): Promise<string>;
  deleteCapturedMedia(uri: string): Promise<boolean>;
  clearAllCapturedMedia(): Promise<boolean>;
  copyMediaToClipboard(filePath: string): Promise<Object>;
  editPhoto(options: Object): Promise<Object>;
  trimVideo(options: Object): Promise<Object>;
  generateFilmstrip(options: Object): Promise<Object>;
  pickMedia(options: Object): Promise<Object | null>;
  writeExportFile(filename: string, content: string): Promise<string>;
  shareFile(filePath: string, mimeType: string, title: string): Promise<boolean>;
  addListener(eventName: string): void;
  removeListeners(count: number): void;
}

export default TurboModuleRegistry.get<Spec>('NetworkInspectorModule');
