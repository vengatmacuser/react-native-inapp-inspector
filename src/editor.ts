import {
  editNativePhoto,
  trimNativeVideo,
  generateNativeFilmstrip,
} from './native/NativeInspector';
import type {
  PhotoEditOptions,
  PhotoEditResult,
  VideoTrimOptions,
  VideoTrimResult,
  FilmstripOptions,
  FilmstripResult,
} from './types/editor';

export * from './types/editor';

/**
 * 100% Native, zero-dependency Photo & Video Editing API for React Native.
 * Uses hardware-accelerated Apple AVFoundation & CoreImage on iOS,
 * and AndroidX Media3 / Android Graphics on Android.
 */
export const MediaEditor = {
  /**
   * Applies lossless crop, rotation, flip, and GPU color grading (brightness,
   * contrast, saturation, warmth, vignette, sharpen, LUT presets) to a photo.
   *
   * @param options Photo editing options including crop rect, rotation, and color adjustments.
   * @returns Metadata of the edited image with absolute file URI.
   */
  editPhoto: async (options: PhotoEditOptions): Promise<PhotoEditResult | null> => {
    if (!options || typeof options.uri !== 'string' || !options.uri.trim()) {
      return null;
    }

    const sanitizedOptions: PhotoEditOptions = {
      ...options,
      uri: options.uri.trim(),
      quality: typeof options.quality === 'number' 
        ? Math.max(0.01, Math.min(1.0, options.quality)) 
        : 0.9,
    };

    return editNativePhoto(sanitizedOptions);
  },

  /**
   * Hardware-accelerated video trimmer and processor.
   * Cuts video to exact start/end time in milliseconds and exports as MP4.
   *
   * @param options Video trim parameters including time range, export quality, and mute.
   * @returns Metadata of the exported trimmed MP4 video.
   */
  trimVideo: async (options: VideoTrimOptions): Promise<VideoTrimResult | null> => {
    if (!options || typeof options.uri !== 'string' || !options.uri.trim()) {
      return null;
    }

    const startMs = Math.max(0, Number(options.startTimeMs) || 0);
    const endMs = Number(options.endTimeMs) || 0;

    if (endMs > 0 && endMs <= startMs) {
      return null;
    }

    const isMuted = Boolean(options.mute || options.muteAudio);
    const sanitizedOptions: VideoTrimOptions = {
      ...options,
      uri: options.uri.trim(),
      startTimeMs: startMs,
      endTimeMs: endMs,
      mute: isMuted,
      muteAudio: isMuted,
    };

    return trimNativeVideo(sanitizedOptions);
  },

  /**
   * Generates evenly-spaced video frame thumbnails for timeline filmstrips and scrubbers.
   *
   * @param options Options including video URI, count of thumbnails, and target dimensions.
   * @returns Array of thumbnail objects with timestamp and file URI.
   */
  generateFilmstrip: async (options: FilmstripOptions): Promise<FilmstripResult | null> => {
    if (!options || typeof options.uri !== 'string' || !options.uri.trim()) {
      return null;
    }

    const count = Math.max(1, Math.min(50, Math.floor(Number(options.count) || 8)));
    const width = options.maxWidth || options.targetWidth;
    const height = options.maxHeight || options.targetHeight;
    const targetW = width ? Math.max(32, Math.min(1920, Math.floor(width))) : 160;
    const targetH = height ? Math.max(32, Math.min(1080, Math.floor(height))) : 160;

    const sanitizedOptions: FilmstripOptions = {
      ...options,
      uri: options.uri.trim(),
      count,
      maxWidth: targetW,
      targetWidth: targetW,
      maxHeight: targetH,
      targetHeight: targetH,
    };

    return generateNativeFilmstrip(sanitizedOptions);
  },

  /**
   * Tester Quick Tool: Crop image directly to isolate a defect region.
   */
  cropToDefect: async (
    uri: string,
    crop: import('./types/editor').CropRect,
    options?: Partial<PhotoEditOptions>,
  ): Promise<PhotoEditResult | null> => {
    return MediaEditor.editPhoto({
      uri,
      crop,
      ...options,
    });
  },

  /**
   * Tester Quick Tool: Mask out sensitive PII, auth tokens, passwords, or emails.
   */
  redactSensitiveData: async (
    uri: string,
    redactions: import('./types/editor').RedactionBox[],
    options?: Partial<PhotoEditOptions>,
  ): Promise<PhotoEditResult | null> => {
    return MediaEditor.editPhoto({
      uri,
      redactions,
      ...options,
    });
  },

  /**
   * Tester Quick Tool: Add high-visibility bug boxes or defect callouts.
   */
  annotateDefect: async (
    uri: string,
    annotations: import('./types/editor').AnnotationBox[],
    options?: Partial<PhotoEditOptions>,
  ): Promise<PhotoEditResult | null> => {
    return MediaEditor.editPhoto({
      uri,
      annotations,
      ...options,
    });
  },

  /**
   * Tester Quick Tool: Cut video to exact bug reproduction window (strips setup/teardown).
   */
  trimReproClip: async (
    uri: string,
    startTimeMs: number,
    endTimeMs: number,
    options?: Partial<VideoTrimOptions>,
  ): Promise<VideoTrimResult | null> => {
    return MediaEditor.trimVideo({
      uri,
      startTimeMs,
      endTimeMs,
      ...options,
    });
  },

  /**
   * Tester Quick Tool: Mute ambient room noise and mic audio from bug recording.
   */
  muteVideo: async (
    uri: string,
    options?: Partial<VideoTrimOptions>,
  ): Promise<VideoTrimResult | null> => {
    return MediaEditor.trimVideo({
      uri,
      startTimeMs: 0,
      endTimeMs: 0,
      muteAudio: true,
      ...options,
    });
  },
};

export default MediaEditor;

