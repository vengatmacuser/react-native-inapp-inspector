import {
  MediaEditor,
  ScreenCapture,
  ScreenRecorder,
  LIB_VERSION,
} from 'react-native-inapp-inspector';
import type {
  PhotoEditOptions,
  VideoTrimOptions,
  FilmstripOptions,
} from 'react-native-inapp-inspector';
import { NativeModules } from 'react-native';

describe('MediaEditor (Pure Native & Zero-Dependency)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    if (!NativeModules.NetworkInspector) {
      NativeModules.NetworkInspector = {};
    }
  });

  describe('Photo Editing (editPhoto)', () => {
    it('returns null safely when uri is empty or missing', async () => {
      // @ts-expect-error test invalid input
      const res1 = await MediaEditor.editPhoto(null);
      expect(res1).toBeNull();

      const res2 = await MediaEditor.editPhoto({ uri: '' });
      expect(res2).toBeNull();

      const res3 = await MediaEditor.editPhoto({ uri: '   ' });
      expect(res3).toBeNull();
    });

    it('passes sanitized photo edit parameters to native module', async () => {
      const mockResult = {
        uri: 'file:///data/user/0/com.example/cache/inspector_captures/edit_123.jpg',
        width: 1080,
        height: 1080,
        size: 154200,
        mimeType: 'image/jpeg',
        format: 'jpeg' as const,
      };

      const editPhotoMock = jest.fn().mockResolvedValue(mockResult);
      NativeModules.NetworkInspector.editPhoto = editPhotoMock;

      const options: PhotoEditOptions = {
        uri: 'file:///path/to/source.jpg',
        rotation: 90,
        flipHorizontal: true,
        flipVertical: false,
        crop: { x: 0.1, y: 0.1, width: 0.8, height: 0.8, isNormalized: true },
        filterPreset: 'vibrant',
        adjustments: {
          brightness: 0.2,
          contrast: 1.2,
          saturation: 1.4,
          temperature: 0.1,
          vignette: 0.3,
          sharpen: 0.5,
        },
        quality: 0.85,
        format: 'jpeg',
      };

      const result = await MediaEditor.editPhoto(options);

      expect(editPhotoMock).toHaveBeenCalledWith(
        expect.objectContaining({
          uri: 'file:///path/to/source.jpg',
          rotation: 90,
          flipHorizontal: true,
          quality: 0.85,
          filterPreset: 'vibrant',
        })
      );
      expect(result).toEqual(mockResult);
    });

    it('clamps quality within [0.01, 1.0]', async () => {
      const editPhotoMock = jest.fn().mockResolvedValue({ uri: 'out.jpg' });
      NativeModules.NetworkInspector.editPhoto = editPhotoMock;

      await MediaEditor.editPhoto({ uri: 'test.png', quality: 2.5 });
      expect(editPhotoMock).toHaveBeenCalledWith(
        expect.objectContaining({ quality: 1.0 })
      );

      await MediaEditor.editPhoto({ uri: 'test.png', quality: -0.5 });
      expect(editPhotoMock).toHaveBeenCalledWith(
        expect.objectContaining({ quality: 0.01 })
      );
    });

    it('handles native module failure gracefully without throwing', async () => {
      NativeModules.NetworkInspector.editPhoto = jest.fn().mockRejectedValue(new Error('Out of memory'));

      const result = await MediaEditor.editPhoto({ uri: 'test.png' });
      expect(result).toBeNull();
    });
  });

  describe('Video Trimming (trimVideo)', () => {
    it('returns null safely when uri is empty or range is invalid', async () => {
      // @ts-expect-error invalid uri
      expect(await MediaEditor.trimVideo(null)).toBeNull();
      expect(await MediaEditor.trimVideo({ uri: '', startTimeMs: 0, endTimeMs: 5000 })).toBeNull();
      // endTime <= startTime
      expect(await MediaEditor.trimVideo({ uri: 'video.mp4', startTimeMs: 5000, endTimeMs: 5000 })).toBeNull();
      expect(await MediaEditor.trimVideo({ uri: 'video.mp4', startTimeMs: 6000, endTimeMs: 2000 })).toBeNull();
    });

    it('forwards sanitized parameters and mute options', async () => {
      const mockTrimResult = {
        uri: 'file:///data/user/0/com.example/cache/inspector_captures/trim_123.mp4',
        durationMs: 4000,
        size: 3240000,
        width: 1920,
        height: 1080,
        format: 'mp4' as const,
      };

      const trimVideoMock = jest.fn().mockResolvedValue(mockTrimResult);
      NativeModules.NetworkInspector.trimVideo = trimVideoMock;

      const options: VideoTrimOptions = {
        uri: 'file:///path/to/source.mp4',
        startTimeMs: -500, // Negative should sanitize to 0
        endTimeMs: 4000,
        muteAudio: true,
        quality: 'high',
      };

      const result = await MediaEditor.trimVideo(options);

      expect(trimVideoMock).toHaveBeenCalledWith(
        expect.objectContaining({
          uri: 'file:///path/to/source.mp4',
          startTimeMs: 0,
          endTimeMs: 4000,
          mute: true,
        })
      );
      expect(result).toEqual(mockTrimResult);
    });

    it('handles native trim exceptions gracefully', async () => {
      NativeModules.NetworkInspector.trimVideo = jest.fn().mockRejectedValue(new Error('Codec unsupported'));

      const result = await MediaEditor.trimVideo({
        uri: 'test.mp4',
        startTimeMs: 0,
        endTimeMs: 3000,
      });
      expect(result).toBeNull();
    });
  });

  describe('Filmstrip Generation (generateFilmstrip)', () => {
    it('returns null safely when uri is invalid', async () => {
      // @ts-expect-error invalid uri
      expect(await MediaEditor.generateFilmstrip(null)).toBeNull();
      expect(await MediaEditor.generateFilmstrip({ uri: '' })).toBeNull();
    });

    it('clamps count within 1 to 50 bounds and provides default dimensions', async () => {
      const mockFilmstrip = {
        thumbnails: [
          { timeMs: 0, uri: 'data:image/jpeg;base64,abc', index: 0 },
          { timeMs: 1000, uri: 'data:image/jpeg;base64,def', index: 1 },
        ],
        durationMs: 2000,
      };

      const generateFilmstripMock = jest.fn().mockResolvedValue(mockFilmstrip);
      NativeModules.NetworkInspector.generateFilmstrip = generateFilmstripMock;

      const options: FilmstripOptions = {
        uri: 'video.mp4',
        count: 100, // Should be clamped to 50
        maxWidth: 200,
        maxHeight: 200,
      };

      const result = await MediaEditor.generateFilmstrip(options);

      expect(generateFilmstripMock).toHaveBeenCalledWith(
        expect.objectContaining({
          uri: 'video.mp4',
          count: 50,
          maxWidth: 200,
          maxHeight: 200,
        })
      );
      expect(result).toEqual(mockFilmstrip);
    });

    it('handles negative or zero count by defaulting to minimum 1', async () => {
      const generateFilmstripMock = jest.fn().mockResolvedValue({ thumbnails: [], durationMs: 0 });
      NativeModules.NetworkInspector.generateFilmstrip = generateFilmstripMock;

      await MediaEditor.generateFilmstrip({ uri: 'video.mp4', count: -5 });
      expect(generateFilmstripMock).toHaveBeenCalledWith(
        expect.objectContaining({ count: 1 })
      );
    });
  });

  describe('Tester Quick Tools (cropToDefect, redactSensitiveData, annotateDefect, trimReproClip, muteVideo)', () => {
    it('cropToDefect forwards crop region correctly', async () => {
      const editPhotoMock = jest.fn().mockResolvedValue({ uri: 'cropped.jpg' });
      NativeModules.NetworkInspector.editPhoto = editPhotoMock;

      await MediaEditor.cropToDefect('photo.jpg', { x: 10, y: 10, width: 200, height: 200 });
      expect(editPhotoMock).toHaveBeenCalledWith(
        expect.objectContaining({
          uri: 'photo.jpg',
          crop: { x: 10, y: 10, width: 200, height: 200 },
        })
      );
    });

    it('redactSensitiveData forwards redaction boxes', async () => {
      const editPhotoMock = jest.fn().mockResolvedValue({ uri: 'redacted.jpg' });
      NativeModules.NetworkInspector.editPhoto = editPhotoMock;

      await MediaEditor.redactSensitiveData('photo.jpg', [
        { x: 0.2, y: 0.3, width: 0.4, height: 0.1, style: 'blackout', isNormalized: true },
      ]);
      expect(editPhotoMock).toHaveBeenCalledWith(
        expect.objectContaining({
          uri: 'photo.jpg',
          redactions: [
            { x: 0.2, y: 0.3, width: 0.4, height: 0.1, style: 'blackout', isNormalized: true },
          ],
        })
      );
    });

    it('annotateDefect forwards annotation boxes', async () => {
      const editPhotoMock = jest.fn().mockResolvedValue({ uri: 'annotated.jpg' });
      NativeModules.NetworkInspector.editPhoto = editPhotoMock;

      await MediaEditor.annotateDefect('photo.jpg', [
        { x: 100, y: 100, width: 80, height: 40, color: '#EF4444', label: 'Bug here' },
      ]);
      expect(editPhotoMock).toHaveBeenCalledWith(
        expect.objectContaining({
          uri: 'photo.jpg',
          annotations: [
            { x: 100, y: 100, width: 80, height: 40, color: '#EF4444', label: 'Bug here' },
          ],
        })
      );
    });

    it('trimReproClip and muteVideo forward trim and mute parameters', async () => {
      const trimVideoMock = jest.fn().mockResolvedValue({ uri: 'trimmed.mp4' });
      NativeModules.NetworkInspector.trimVideo = trimVideoMock;

      await MediaEditor.trimReproClip('video.mp4', 1000, 4000);
      expect(trimVideoMock).toHaveBeenCalledWith(
        expect.objectContaining({
          uri: 'video.mp4',
          startTimeMs: 1000,
          endTimeMs: 4000,
        })
      );

      await MediaEditor.muteVideo('video.mp4');
      expect(trimVideoMock).toHaveBeenCalledWith(
        expect.objectContaining({
          uri: 'video.mp4',
          mute: true,
        })
      );
    });
  });

  describe('Package Integrity & Exports', () => {
    it('exports all expected core and media APIs without breaking changes', () => {
      expect(MediaEditor).toBeDefined();
      expect(typeof MediaEditor.editPhoto).toBe('function');
      expect(typeof MediaEditor.trimVideo).toBe('function');
      expect(typeof MediaEditor.generateFilmstrip).toBe('function');
      expect(typeof MediaEditor.cropToDefect).toBe('function');
      expect(typeof MediaEditor.redactSensitiveData).toBe('function');
      expect(typeof MediaEditor.annotateDefect).toBe('function');
      expect(typeof MediaEditor.trimReproClip).toBe('function');
      expect(typeof MediaEditor.muteVideo).toBe('function');
      expect(ScreenCapture).toBeDefined();
      expect(ScreenRecorder).toBeDefined();
      expect(typeof LIB_VERSION).toBe('string');
    });
  });
});
