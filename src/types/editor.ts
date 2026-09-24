export type ImageOutputFormat = 'jpeg' | 'png' | 'webp';
export type VideoExportQuality = 'high' | 'medium' | 'low' | 'original';

export type PhotoFilterPreset =
  | 'none'
  | 'mono'
  | 'sepia'
  | 'vibrant'
  | 'warm'
  | 'cool'
  | 'vintage'
  | 'noir'
  | 'fade';

export interface CropRect {
  /** X origin in percentage (0.0 to 1.0) or pixels */
  x: number;
  /** Y origin in percentage (0.0 to 1.0) or pixels */
  y: number;
  /** Width in percentage (0.0 to 1.0) or pixels */
  width: number;
  /** Height in percentage (0.0 to 1.0) or pixels */
  height: number;
  /** Whether coordinates are normalized (0.0 to 1.0) */
  isNormalized?: boolean;
}

export interface RedactionBox {
  /** X origin in percentage (0.0 to 1.0) or pixels */
  x: number;
  /** Y origin in percentage (0.0 to 1.0) or pixels */
  y: number;
  /** Width in percentage (0.0 to 1.0) or pixels */
  width: number;
  /** Height in percentage (0.0 to 1.0) or pixels */
  height: number;
  /** Style of redaction: 'blackout' (solid black box) or 'blur' */
  style?: 'blackout' | 'blur';
  /** Whether coordinates are normalized (0.0 to 1.0) */
  isNormalized?: boolean;
}

export interface AnnotationBox {
  /** X origin in percentage (0.0 to 1.0) or pixels */
  x: number;
  /** Y origin in percentage (0.0 to 1.0) or pixels */
  y: number;
  /** Width in percentage (0.0 to 1.0) or pixels */
  width: number;
  /** Height in percentage (0.0 to 1.0) or pixels */
  height: number;
  /** Hex color for the border/badge (default: '#EF4444' bug red) */
  color?: string;
  /** Optional text note or bug tag (e.g., "Expected 404", "Overflow") */
  label?: string;
  /** Whether coordinates are normalized (0.0 to 1.0) */
  isNormalized?: boolean;
}

export interface DrawingPoint {
  x: number;
  y: number;
}

export interface DrawingStroke {
  id?: string;
  type: 'brush' | 'highlighter' | 'arrow' | 'rect' | 'circle' | 'step' | 'spotlight';
  points: DrawingPoint[];
  color?: string;
  strokeWidth?: number;
  rect?: {x: number; y: number; width: number; height: number};
  stepNumber?: number;
  isNormalized?: boolean;
}

export interface TextAnnotation {
  id?: string;
  text: string;
  x: number;
  y: number;
  color?: string;
  bgColor?: string;
  fontSize?: number;
  isNormalized?: boolean;
}

export interface PhotoAdjustments {
  /** Brightness adjustment (-1.0 to 1.0, default: 0.0) */
  brightness?: number;
  /** Contrast adjustment (0.0 to 2.0, default: 1.0) */
  contrast?: number;
  /** Saturation adjustment (0.0 to 2.0, default: 1.0) */
  saturation?: number;
  /** Temperature / Warmth adjustment (-1.0 to 1.0, default: 0.0) */
  temperature?: number;
  /** Vignette intensity (0.0 to 1.0, default: 0.0) */
  vignette?: number;
  /** Sharpness adjustment (0.0 to 1.0, default: 0.0) */
  sharpen?: number;
}

export interface PhotoEditOptions {
  /** Path or URI of the input image */
  uri: string;
  /** Optional crop region to focus on the bug */
  crop?: CropRect;
  /** Sensitive data redaction boxes (blackout or blur masks for PII / tokens) */
  redactions?: RedactionBox[];
  /** High-visibility defect annotation boxes & callouts */
  annotations?: AnnotationBox[];
  /** Freehand drawing paths and shapes (brush, highlighter, arrow, rect, circle, step) */
  drawings?: DrawingStroke[];
  /** Text annotation badges and notes */
  texts?: TextAnnotation[];
  /** Rotation angle in degrees (90, 180, 270) */
  rotation?: number;
  /** Flip horizontally */
  flipHorizontal?: boolean;
  /** Flip vertically */
  flipVertical?: boolean;
  /** Basic brightness/contrast adjustments if needed */
  adjustments?: PhotoAdjustments;
  /** Preset filter style */
  filterPreset?: PhotoFilterPreset;
  /** Output file format (default: 'jpeg') */
  format?: ImageOutputFormat;
  /** Compression quality between 0.1 and 1.0 (default: 0.9) */
  quality?: number;
}

export interface PhotoEditResult {
  /** Absolute file URI of the saved edited image */
  uri: string;
  /** Image width in pixels */
  width: number;
  /** Image height in pixels */
  height: number;
  /** Output file size in bytes */
  size: number;
  /** Output MIME type */
  mimeType: string;
  /** Format of the output file */
  format: ImageOutputFormat;
}

export interface VideoTrimOptions {
  /** Path or URI of the source video */
  uri: string;
  /** Start time of trimmed segment in milliseconds */
  startTimeMs: number;
  /** End time of trimmed segment in milliseconds */
  endTimeMs: number;
  /** Export quality preset (default: 'high') */
  quality?: VideoExportQuality;
  /** Strip audio track from output video (default: false) */
  muteAudio?: boolean;
  /** Alias for muteAudio */
  mute?: boolean;
  /** Basic video adjustments */
  adjustments?: {
    brightness?: number;
    contrast?: number;
    saturation?: number;
  };
}

export interface VideoTrimResult {
  /** Absolute file URI of the exported trimmed MP4 video */
  uri: string;
  /** Duration of trimmed video in milliseconds */
  durationMs: number;
  /** Output video file size in bytes */
  size: number;
  /** Video width in pixels */
  width: number;
  /** Video height in pixels */
  height: number;
  /** Video format (mp4) */
  format: 'mp4';
}

export interface FilmstripOptions {
  /** Path or URI of the video file */
  uri: string;
  /** Number of thumbnail frames to generate (default: 10, max: 50) */
  count?: number;
  /** Target thumbnail width in pixels (default: 120) */
  targetWidth?: number;
  /** Target thumbnail height in pixels (default: 120) */
  targetHeight?: number;
  /** Alias for targetWidth */
  maxWidth?: number;
  /** Alias for targetHeight */
  maxHeight?: number;
  /** Format of thumbnails ('jpeg' | 'png', default: 'jpeg') */
  format?: 'jpeg' | 'png';
  /** Quality between 0.1 and 1.0 (default: 0.7) */
  quality?: number;
}

export interface FilmstripThumbnail {
  /** Timestamp in milliseconds where this thumbnail was extracted */
  timeMs: number;
  /** Local file URI or base64 data URL */
  uri: string;
  /** Frame index */
  index: number;
}

export interface FilmstripResult {
  /** Array of extracted frame thumbnails */
  thumbnails: FilmstripThumbnail[];
  /** Total video duration in milliseconds */
  durationMs: number;
}
