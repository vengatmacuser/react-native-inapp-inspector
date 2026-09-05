import {
  takeNativeScreenshot,
  startNativeVideoRecording,
  stopNativeVideoRecording,
  isNativeRecordingActive,
  convertNativeVideoToGif,
  fetchCapturedMediaList,
  deleteCapturedMediaFile,
  clearAllCapturedMediaFiles,
  ScreenshotOptions,
  ScreenshotResult,
  RecordingOptions,
  RecordingResult,
  GifConversionOptions,
  CapturedMediaItem,
} from './native/NativeInspector';

export type {
  ScreenshotOptions,
  ScreenshotResult,
  RecordingOptions,
  RecordingResult,
  GifConversionOptions,
  CapturedMediaItem,
};

export type ImageFormat = 'png' | 'jpeg' | 'webp';
export type AudioSource = 'none' | 'app' | 'mic' | 'mixed';
export type RecordingFormat = 'mp4' | 'gif';

/**
 * ScreenCapture & Video Recording API for React Native In-App Inspector.
 * 100% native, zero-dependency screen capture, audio-enabled video recording,
 * and animated GIF conversion.
 */
export const ScreenCapture = {
  /**
   * Captures a high-resolution screenshot of the full application window.
   */
  takeScreenshot: async (
    options?: ScreenshotOptions,
  ): Promise<ScreenshotResult | null> => {
    return takeNativeScreenshot(options);
  },

  /**
   * Starts native video or animated GIF recording with optional audio/mic narration.
   */
  startRecording: async (options?: RecordingOptions): Promise<boolean> => {
    return startNativeVideoRecording(options);
  },

  /**
   * Stops active video/GIF recording and returns the final file metadata.
   */
  stopRecording: async (): Promise<RecordingResult | null> => {
    return stopNativeVideoRecording();
  },

  /**
   * Checks if video/GIF recording is currently in progress.
   */
  isRecording: async (): Promise<boolean> => {
    return isNativeRecordingActive();
  },

  /**
   * Converts a recorded MP4 video to an animated GIF.
   */
  convertToGif: async (
    videoUri: string,
    options?: GifConversionOptions,
  ): Promise<RecordingResult | null> => {
    return convertNativeVideoToGif(videoUri, options);
  },

  /**
   * Retrieves the list of all captured screenshots, videos, and GIFs from local cache.
   */
  getMediaList: async (): Promise<CapturedMediaItem[]> => {
    return fetchCapturedMediaList();
  },

  /**
   * Deletes a specific captured media file from disk.
   */
  deleteMedia: async (uri: string): Promise<boolean> => {
    return deleteCapturedMediaFile(uri);
  },

  /**
   * Purges all captured screenshots, videos, and GIFs from local storage cache.
   */
  clearAllMedia: async (): Promise<boolean> => {
    return clearAllCapturedMediaFiles();
  },
};

export const ScreenRecorder = ScreenCapture;

export default ScreenCapture;
