import {
  takeNativeScreenshot,
  startNativeVideoRecording,
  stopNativeVideoRecording,
  isNativeRecordingActive,
  playNativeVideo,
  convertNativeVideoToGif,
  fetchCapturedMediaList,
  deleteCapturedMediaFile,
  clearAllCapturedMediaFiles,
  pickNativeMedia,
  ScreenshotOptions,
  ScreenshotResult,
  RecordingOptions,
  RecordingResult,
  GifConversionOptions,
  CapturedMediaItem,
  PickMediaOptions,
} from './native/NativeInspector';

export type {
  ScreenshotOptions,
  ScreenshotResult,
  RecordingOptions,
  RecordingResult,
  GifConversionOptions,
  CapturedMediaItem,
  PickMediaOptions,
};

export type ImageFormat = 'png' | 'jpeg' | 'webp';
export type AudioSource = 'none' | 'app' | 'mic' | 'mixed';
export type RecordingFormat = 'mp4' | 'gif';

/**
 * Generates a capture filename/ID in the format:
 * rn_iai_{YYYYMMDD_HHmmss_SSS}_{fileType}_{random6chars}.{ext}
 */
export const generateCaptureId = (
  fileType: string,
  ext: string,
): string => {
  const now = new Date();
  const pad = (n: number, len = 2) => String(n).padStart(len, '0');
  const dateStamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}_${pad(now.getMilliseconds(), 3)}`;
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let random = '';
  for (let i = 0; i < 6; i++) {
    random += chars[Math.floor(Math.random() * chars.length)];
  }
  return `rn_iai_${dateStamp}_${fileType}_${random}.${ext}`;
};

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
   * Alias for takeScreenshot.
   */
  captureScreenshot: async (
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
   * Plays a recorded video in the full-screen native media player.
   */
  playVideo: async (videoUri: string): Promise<boolean> => {
    return playNativeVideo(videoUri);
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

  /**
   * Opens native system Camera Roll / photo & video library picker
   * with strict media type filtering ('image' | 'video' | 'any').
   */
  pickMedia: async (
    options?: PickMediaOptions,
  ): Promise<CapturedMediaItem | null> => {
    return pickNativeMedia(options);
  },
};

export const ScreenRecorder = ScreenCapture;

export default ScreenCapture;
