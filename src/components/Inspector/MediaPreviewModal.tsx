import React, {useCallback, useContext, useEffect, useMemo, useRef, useState} from 'react';
import {
  Animated,
  Dimensions,
  Image,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Svg, {Circle, Ellipse, G, Line, Path, Polygon, Rect, Text as SvgText} from 'react-native-svg';
import {AppColors} from '../../styles/AppColors';
import {AppFonts} from '../../styles/AppFonts';
import TouchableScale from '../TouchableScale';
import SegmentedTabs from '../SegmentedTabs';
import {InspectorContext} from './InspectorContext';
import styles from '../../styles';
import {ConfirmationModal} from './ConfirmationModal';
import {
  ArrowRightIcon,
  CameraRollIcon,
  CheckIcon,
  ClockIcon,
  CloseWhite,
  CropIcon,
  DownloadExportIcon,
  EyeCompareIcon,
  EyeIcon,
  FilmIcon,
  FlaskAiIcon,
  GifIcon,
  GridlinesIcon,
  HighlighterIcon,
  ImageIcon,
  MaximizeIcon,
  MoreDotsIcon,
  PauseIcon,
  PenIcon,
  PixelateIcon,
  PlayIcon,
  RedactIcon,
  RedoIcon,
  ResetIcon,
  ResizeIcon,
  RotateIcon,
  SaveIcon,
  ScissorsIcon,
  ShareIcon,
  SizeIcon,
  SunAdjustIcon,
  TrashIcon,
  TypeIcon,
  UndoIcon,
  VolumeXIcon,
  WhiteBackNavigation,
  ZoomInIcon,
  ZoomOutIcon,
  BrightnessIcon,
  ContrastIcon,
  SaturationIcon,
  WarmthIcon,
  ExposureIcon,
  VignetteIcon,
  ZapIcon,
} from '../NetworkIcons';
import {CapturedMediaItem, ScreenCapture} from '../../capture';
import {MediaEditor} from '../../editor';
import {formatBytes} from '../../helpers';
import {showToast} from '../../helpers/toast';
import {useTranslation} from '../../i18n';
import {triggerNativeHaptic} from '../../native/NativeInspector';

export type EditorTool =
  | 'none'
  | 'crop'
  | 'adjust'
  | 'draw'
  | 'text'
  | 'resize'
  | 'preview'
  | 'trim'
  | 'audio'
  | 'speed'
  | 'gif'
  | 'snapshot';

export type DrawModeOption =
  | 'brush'
  | 'highlighter'
  | 'arrow'
  | 'rect'
  | 'circle'
  | 'spotlight'
  | 'step'
  | 'redact'
  | 'pixelate';

export type AdjustModeOption =
  | 'brightness'
  | 'contrast'
  | 'saturation'
  | 'warmth'
  | 'exposure'
  | 'vignette';

export type PhotoFilterPreset =
  | 'none'
  | 'vibrant'
  | 'mono'
  | 'sepia'
  | 'vintage'
  | 'noir'
  | 'cool'
  | 'warm'
  | 'fade';

export interface ImageAdjustments {
  brightness: number; // -50 to +50 (default 0)
  contrast: number;   // -50 to +50 (default 0)
  saturation: number; // -50 to +50 (default 0)
  warmth: number;     // -50 to +50 (default 0)
  exposure: number;   // -50 to +50 (default 0)
  vignette: number;   // 0 to 100 (default 0)
}

export type AspectRatioOption =
  | 'free'
  | '1:1'
  | '4:3'
  | '16:9'
  | '9:16'
  | '3:2';

export interface InkStroke {
  id: string;
  type: DrawModeOption;
  points: Array<{x: number; y: number}>;
  color: string;
  strokeWidth: number;
  rect?: {x: number; y: number; width: number; height: number};
  stepNumber?: number;
}

export interface TextItem {
  id: string;
  text: string;
  x: number; // percentage 0.0 - 1.0
  y: number; // percentage 0.0 - 1.0
  color: string;
  bgColor: string;
}

interface MediaPreviewModalProps {
  item: CapturedMediaItem | null;
  visible: boolean;
  onClose: () => void;
  onDelete: (item: CapturedMediaItem) => void;
  onConvertToGif?: (item: CapturedMediaItem) => void;
}

const COLOR_PALETTE = [
  '#EF4444', // Red
  '#F59E0B', // Amber
  '#38BDF8', // Sky
  '#10B981', // Emerald
  '#A855F7', // Violet
  '#FFFFFF', // White
  '#0F172A', // Black
];

interface DraggableTextProps {
  textItem: TextItem;
  canvasWidth: number;
  canvasHeight: number;
  scale: number;
  onUpdate: (id: string, updates: Partial<TextItem>) => void;
  onDelete: (id: string) => void;
  onEdit: (textItem: TextItem) => void;
}

const DraggableText: React.FC<DraggableTextProps> = ({
  textItem,
  canvasWidth,
  canvasHeight,
  scale,
  onUpdate,
  onDelete,
  onEdit,
}) => {
  const pan = useRef(new Animated.ValueXY({x: 0, y: 0})).current;

  const textRef = useRef(textItem);
  textRef.current = textItem;
  const canvasWidthRef = useRef(canvasWidth);
  canvasWidthRef.current = canvasWidth;
  const canvasHeightRef = useRef(canvasHeight);
  canvasHeightRef.current = canvasHeight;
  const scaleRef = useRef(scale);
  scaleRef.current = scale;
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  const isDraggingRef = useRef(false);

  const movePanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponder: (_e, g) =>
        Math.abs(g.dx) > 3 || Math.abs(g.dy) > 3,
      onMoveShouldSetPanResponderCapture: () => false,
      onPanResponderTerminationRequest: () => false,
      onShouldBlockNativeResponder: () => true,
      onPanResponderGrant: () => {
        isDraggingRef.current = false;
        pan.setValue({x: 0, y: 0});
      },
      onPanResponderMove: (_e, gesture) => {
        if (Math.abs(gesture.dx) > 3 || Math.abs(gesture.dy) > 3) {
          isDraggingRef.current = true;
        }
        pan.setValue({x: gesture.dx, y: gesture.dy});
      },
      onPanResponderRelease: (_e, gesture) => {
        if (!isDraggingRef.current) {
          onEdit(textRef.current);
          pan.setValue({x: 0, y: 0});
          return;
        }
        const W = (canvasWidthRef.current || 300) * (scaleRef.current || 1);
        const H = (canvasHeightRef.current || 500) * (scaleRef.current || 1);
        const dX = gesture.dx / W;
        const dY = gesture.dy / H;
        const current = textRef.current;
        const newX = Math.max(0, Math.min(0.85, current.x + dX));
        const newY = Math.max(0, Math.min(0.92, current.y + dY));
        pan.setValue({x: 0, y: 0});
        onUpdateRef.current(current.id, {x: newX, y: newY});
      },
      onPanResponderTerminate: () => {
        pan.setValue({x: 0, y: 0});
        isDraggingRef.current = false;
      },
    }),
  ).current;

  return (
    <Animated.View
      {...movePanResponder.panHandlers}
      style={[
        previewStyles.textAnnotationPill,
        {
          left: `${textItem.x * 100}%`,
          top: `${textItem.y * 100}%`,
          backgroundColor: textItem.bgColor,
          transform: pan.getTranslateTransform(),
        },
      ]}>
      <Text
        style={[previewStyles.textAnnotationText, {color: textItem.color}]}
        pointerEvents="none">
        {textItem.text}
      </Text>
      <TouchableOpacity
        style={previewStyles.textDeleteBtn}
        onPress={() => onDelete(textItem.id)}
        hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
        <CloseWhite size={8} />
      </TouchableOpacity>
    </Animated.View>
  );
};

interface CropOverlayProps {
  cropBox: {x: number; y: number; width: number; height: number};
  imageWidth: number;
  imageHeight: number;
  imageOffsetX: number;
  imageOffsetY: number;
  scale: number;
  onUpdateCropBox: (box: {
    x: number;
    y: number;
    width: number;
    height: number;
  }) => void;
  onApplyCrop?: () => void;
  onCancelCrop?: () => void;
}

const CropOverlay: React.FC<CropOverlayProps> = ({
  cropBox,
  imageWidth,
  imageHeight,
  imageOffsetX,
  imageOffsetY,
  scale,
  onUpdateCropBox,
  onApplyCrop,
  onCancelCrop,
}) => {
  // Sanitize crop box values
  const safeX = Math.max(0, Math.min(0.9, isFinite(cropBox?.x) ? cropBox.x : 0.08));
  const safeY = Math.max(0, Math.min(0.9, isFinite(cropBox?.y) ? cropBox.y : 0.12));
  const safeW = Math.max(0.1, Math.min(1 - safeX, isFinite(cropBox?.width) ? cropBox.width : 0.84));
  const safeH = Math.max(0.1, Math.min(1 - safeY, isFinite(cropBox?.height) ? cropBox.height : 0.76));

  // Convert normalized crop to pixel values relative to the previewCard
  const pxLeft = imageOffsetX + safeX * imageWidth;
  const pxTop = imageOffsetY + safeY * imageHeight;
  const pxWidth = safeW * imageWidth;
  const pxHeight = safeH * imageHeight;

  // Refs to avoid stale closures in PanResponder
  const cropRef = useRef({x: safeX, y: safeY, width: safeW, height: safeH});
  cropRef.current = {x: safeX, y: safeY, width: safeW, height: safeH};
  const imgWRef = useRef(imageWidth);
  imgWRef.current = imageWidth;
  const imgHRef = useRef(imageHeight);
  imgHRef.current = imageHeight;
  const scaleRef = useRef(scale);
  scaleRef.current = scale;
  const updateRef = useRef(onUpdateCropBox);
  updateRef.current = onUpdateCropBox;

  const dragRef = useRef({
    origBox: {x: 0.08, y: 0.12, width: 0.84, height: 0.76},
  });

  // Single pan responder for moving the entire crop box
  const movePan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dx) > 3 || Math.abs(g.dy) > 3,
      onPanResponderTerminationRequest: () => false,
      onShouldBlockNativeResponder: () => true,
      onPanResponderGrant: () => {
        dragRef.current.origBox = {...cropRef.current};
      },
      onPanResponderMove: (_e, g) => {
        const W = imgWRef.current * (scaleRef.current || 1);
        const H = imgHRef.current * (scaleRef.current || 1);
        if (!W || !H) return;
        const {x: ox, y: oy, width: ow, height: oh} = dragRef.current.origBox;
        const nx = Math.max(0, Math.min(1 - ow, ox + g.dx / W));
        const ny = Math.max(0, Math.min(1 - oh, oy + g.dy / H));
        updateRef.current({x: nx, y: ny, width: ow, height: oh});
      },
      onPanResponderRelease: () => {},
    }),
  ).current;

  // Corner/edge resize pan responder factory
  const mkResize = (mode: string) =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dx) > 2 || Math.abs(g.dy) > 2,
      onPanResponderTerminationRequest: () => false,
      onShouldBlockNativeResponder: () => true,
      onPanResponderGrant: () => {
        dragRef.current.origBox = {...cropRef.current};
      },
      onPanResponderMove: (_e, g) => {
        const W = imgWRef.current * (scaleRef.current || 1);
        const H = imgHRef.current * (scaleRef.current || 1);
        if (!W || !H) return;
        const dx = g.dx / W;
        const dy = g.dy / H;
        const {x: ox, y: oy, width: ow, height: oh} = dragRef.current.origBox;
        const minS = 0.1;
        let nx = ox, ny = oy, nw = ow, nh = oh;
        if (mode === 'tl' || mode === 'left' || mode === 'bl') {
          nx = Math.max(0, Math.min(ox + ow - minS, ox + dx));
          nw = ow - (nx - ox);
        }
        if (mode === 'tr' || mode === 'right' || mode === 'br') {
          nw = Math.max(minS, Math.min(1 - ox, ow + dx));
        }
        if (mode === 'tl' || mode === 'top' || mode === 'tr') {
          ny = Math.max(0, Math.min(oy + oh - minS, oy + dy));
          nh = oh - (ny - oy);
        }
        if (mode === 'bl' || mode === 'bottom' || mode === 'br') {
          nh = Math.max(minS, Math.min(1 - oy, oh + dy));
        }
        updateRef.current({x: nx, y: ny, width: nw, height: nh});
      },
      onPanResponderRelease: () => {},
    });

  const resizers = useRef({
    tl: mkResize('tl'), tr: mkResize('tr'),
    bl: mkResize('bl'), br: mkResize('br'),
    top: mkResize('top'), bottom: mkResize('bottom'),
    left: mkResize('left'), right: mkResize('right'),
  }).current;

  // Don't render if image dimensions are too small
  if (imageWidth < 20 || imageHeight < 20) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* Dimmed overlay masks - using pixel positions for precision */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {/* Top dim */}
        <View style={{position: 'absolute', top: 0, left: 0, right: 0, height: pxTop, backgroundColor: 'rgba(0,0,0,0.6)'}} />
        {/* Bottom dim */}
        <View style={{position: 'absolute', top: pxTop + pxHeight, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)'}} />
        {/* Left dim */}
        <View style={{position: 'absolute', top: pxTop, left: 0, width: pxLeft, height: pxHeight, backgroundColor: 'rgba(0,0,0,0.6)'}} />
        {/* Right dim */}
        <View style={{position: 'absolute', top: pxTop, left: pxLeft + pxWidth, right: 0, height: pxHeight, backgroundColor: 'rgba(0,0,0,0.6)'}} />
      </View>

      {/* The crop frame box */}
      <View
        style={{
          position: 'absolute',
          left: pxLeft,
          top: pxTop,
          width: pxWidth,
          height: pxHeight,
          borderWidth: 2,
          borderColor: '#00E5FF',
          backgroundColor: 'transparent',
          zIndex: 200,
        }}
        pointerEvents="box-none">

        {/* Rule-of-thirds grid lines */}
        <View pointerEvents="none" style={{position: 'absolute', left: 0, right: 0, top: '33.33%', height: 1, backgroundColor: 'rgba(0,229,255,0.35)'}} />
        <View pointerEvents="none" style={{position: 'absolute', left: 0, right: 0, top: '66.66%', height: 1, backgroundColor: 'rgba(0,229,255,0.35)'}} />
        <View pointerEvents="none" style={{position: 'absolute', top: 0, bottom: 0, left: '33.33%', width: 1, backgroundColor: 'rgba(0,229,255,0.35)'}} />
        <View pointerEvents="none" style={{position: 'absolute', top: 0, bottom: 0, left: '66.66%', width: 1, backgroundColor: 'rgba(0,229,255,0.35)'}} />

        {/* Center drag surface */}
        <View style={StyleSheet.absoluteFill} {...movePan.panHandlers} />

        {/* Corner L-brackets (bright cyan) */}
        <View pointerEvents="none" style={{position: 'absolute', top: -2, left: -2, width: 22, height: 22, borderTopWidth: 4, borderLeftWidth: 4, borderColor: '#00E5FF'}} />
        <View pointerEvents="none" style={{position: 'absolute', top: -2, right: -2, width: 22, height: 22, borderTopWidth: 4, borderRightWidth: 4, borderColor: '#00E5FF'}} />
        <View pointerEvents="none" style={{position: 'absolute', bottom: -2, left: -2, width: 22, height: 22, borderBottomWidth: 4, borderLeftWidth: 4, borderColor: '#00E5FF'}} />
        <View pointerEvents="none" style={{position: 'absolute', bottom: -2, right: -2, width: 22, height: 22, borderBottomWidth: 4, borderRightWidth: 4, borderColor: '#00E5FF'}} />

        {/* Edge center bars */}
        <View pointerEvents="none" style={{position: 'absolute', top: -3, left: '50%', marginLeft: -16, width: 32, height: 5, backgroundColor: '#00E5FF', borderRadius: 3}} />
        <View pointerEvents="none" style={{position: 'absolute', bottom: -3, left: '50%', marginLeft: -16, width: 32, height: 5, backgroundColor: '#00E5FF', borderRadius: 3}} />
        <View pointerEvents="none" style={{position: 'absolute', left: -3, top: '50%', marginTop: -16, width: 5, height: 32, backgroundColor: '#00E5FF', borderRadius: 3}} />
        <View pointerEvents="none" style={{position: 'absolute', right: -3, top: '50%', marginTop: -16, width: 5, height: 32, backgroundColor: '#00E5FF', borderRadius: 3}} />

        {/* Corner touch hitboxes */}
        <View style={{position: 'absolute', top: -22, left: -22, width: 44, height: 44, zIndex: 30}} {...resizers.tl.panHandlers} />
        <View style={{position: 'absolute', top: -22, right: -22, width: 44, height: 44, zIndex: 30}} {...resizers.tr.panHandlers} />
        <View style={{position: 'absolute', bottom: -22, left: -22, width: 44, height: 44, zIndex: 30}} {...resizers.bl.panHandlers} />
        <View style={{position: 'absolute', bottom: -22, right: -22, width: 44, height: 44, zIndex: 30}} {...resizers.br.panHandlers} />

        {/* Edge touch hitboxes */}
        <View style={{position: 'absolute', top: -20, left: '25%', right: '25%', height: 40, zIndex: 25}} {...resizers.top.panHandlers} />
        <View style={{position: 'absolute', bottom: -20, left: '25%', right: '25%', height: 40, zIndex: 25}} {...resizers.bottom.panHandlers} />
        <View style={{position: 'absolute', left: -20, top: '25%', bottom: '25%', width: 40, zIndex: 25}} {...resizers.left.panHandlers} />
        <View style={{position: 'absolute', right: -20, top: '25%', bottom: '25%', width: 40, zIndex: 25}} {...resizers.right.panHandlers} />
      </View>

      {/* Cancel button - top left of card */}
      {onCancelCrop && (
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {
            triggerNativeHaptic('light');
            onCancelCrop();
          }}
          style={previewStyles.cropCancelBtn}
          accessibilityLabel="Cancel Crop">
          <CloseWhite size={14} color={AppColors.white} />
        </TouchableOpacity>
      )}

      {/* Confirm button - top right of card */}
      {onApplyCrop && (
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {
            triggerNativeHaptic('medium');
            onApplyCrop();
          }}
          style={previewStyles.cropConfirmBtn}
          accessibilityLabel="Apply Crop Selection">
          <CheckIcon size={18} color={AppColors.white} />
        </TouchableOpacity>
      )}
    </View>
  );
};

export const MediaPreviewModal: React.FC<MediaPreviewModalProps> = ({
  item,
  visible,
  onClose,
  onDelete,
  onConvertToGif,
}) => {
  const {t} = useTranslation();
  const inspectorCtx = useContext(InspectorContext);
  const modalHeightPercent = inspectorCtx?.modalHeightPercent ?? 90;
  const {width: windowWidth} = useWindowDimensions();

  const headerTopPadding = useMemo(() => {
    if (Platform.OS === 'ios') {
      if (modalHeightPercent >= 98) {
        return windowWidth >= 390 ? 50 : 44;
      }
      return 0;
    }
    if (Platform.OS === 'android' && modalHeightPercent >= 98) {
      return StatusBar.currentHeight || 24;
    }
    return 0;
  }, [modalHeightPercent, windowWidth]);

  // Basic modal & conversion state
  const [isConverting, setIsConverting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentUri, setCurrentUri] = useState<string | null>(null);
  const [currentWidth, setCurrentWidth] = useState<number | undefined>(
    item?.width,
  );
  const [currentHeight, setCurrentHeight] = useState<number | undefined>(
    item?.height,
  );
  const [currentSizeBytes, setCurrentSizeBytes] = useState<number | undefined>(
    item?.sizeBytes,
  );
  const [currentDurationMs, setCurrentDurationMs] = useState<
    number | undefined
  >(item?.durationMs);
  const [imageError, setImageError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Editor mode & transformation states
  const [activeTool, setActiveTool] = useState<EditorTool>('none');
  const [zoomLevel, setZoomLevel] = useState(1.0);
  const [rotationAngle, setRotationAngle] = useState(0);

  // Undo / Redo History Stack
  interface EditorSnapshot {
    uri: string | null;
    inkPaths: InkStroke[];
    texts: TextItem[];
    adjustments?: ImageAdjustments;
    filterPreset?: PhotoFilterPreset;
    showWatermark?: boolean;
    showGridlines?: boolean;
    rotationAngle?: number;
    flipH?: boolean;
    flipV?: boolean;
    width?: number;
    height?: number;
    sizeBytes?: number;
  }
  const [history, setHistory] = useState<EditorSnapshot[]>([]);
  const [redoHistory, setRedoHistory] = useState<EditorSnapshot[]>([]);
  const [isComparingOriginal, setIsComparingOriginal] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [drawMode, setDrawMode] = useState<DrawModeOption>('brush');
  const [blurIntensity, setBlurIntensity] = useState(24);
  const [adjustMode, setAdjustMode] = useState<AdjustModeOption>('brightness');
  const [activeFilterPreset, setActiveFilterPreset] = useState<PhotoFilterPreset>('none');
  const [showWatermark, setShowWatermark] = useState(false);
  const [showGridlines, setShowGridlines] = useState(false);
  const [adjustments, setAdjustments] = useState<ImageAdjustments>({
    brightness: 0,
    contrast: 0,
    saturation: 0,
    warmth: 0,
    exposure: 0,
    vignette: 0,
  });
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);

  // Video Editing, Trimming & Playback States
  const [videoTrimStartMs, setVideoTrimStartMs] = useState(0);
  const [videoTrimEndMs, setVideoTrimEndMs] = useState(item?.durationMs || 10000);
  const [videoTrimTarget, setVideoTrimTarget] = useState<'start' | 'end'>('end');
  const [videoIsMuted, setVideoIsMuted] = useState(false);
  const [videoVolume, setVideoVolume] = useState(100);
  const [videoSpeed, setVideoSpeed] = useState(1.0);
  const [gifFps, setGifFps] = useState(12);
  const [gifWidth, setGifWidth] = useState(480);
  const [filmstripThumbs, setFilmstripThumbs] = useState<
    Array<{timeMs: number; uri: string; index: number}>
  >([]);
  const [isLoadingFilmstrip, setIsLoadingFilmstrip] = useState(false);
  const [playbackCurrentTimeMs, setPlaybackCurrentTimeMs] = useState(0);

  // Crop & Aspect Ratio
  const [aspectRatio, setAspectRatio] = useState<AspectRatioOption>('free');
  const [cropBox, setCropBox] = useState({
    x: 0.08,
    y: 0.12,
    width: 0.84,
    height: 0.76,
  });

  // Free Ink Drawing & Annotations
  const [selectedColor, setSelectedColor] = useState('#EF4444');
  const [selectedStrokeWidth, setSelectedStrokeWidth] = useState(4);
  const [inkPaths, setInkPaths] = useState<InkStroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<Array<{
    x: number;
    y: number;
  }> | null>(null);

  // Text Annotations
  const [texts, setTexts] = useState<TextItem[]>([]);
  const [showTextInputModal, setShowTextInputModal] = useState(false);
  const [editingTextItem, setEditingTextItem] = useState<TextItem | null>(null);
  const [inputNoteText, setInputNoteText] = useState('');
  const [pendingTextPos, setPendingTextPos] = useState<{x: number; y: number}>({
    x: 0.3,
    y: 0.4,
  });

  // Push snapshot to undo history
  const pushSnapshot = useCallback(() => {
    setRedoHistory([]); // clear redo stack on new modification
    setHistory(prev => [
      ...prev,
      {
        uri: currentUri || item?.uri || null,
        inkPaths: [...inkPaths],
        texts: [...texts],
        adjustments: {...adjustments},
        filterPreset: activeFilterPreset,
        showWatermark,
        showGridlines,
        rotationAngle,
        flipH,
        flipV,
        width: currentWidth,
        height: currentHeight,
        sizeBytes: currentSizeBytes,
      },
    ]);
  }, [
    currentUri,
    item?.uri,
    inkPaths,
    texts,
    adjustments,
    activeFilterPreset,
    showWatermark,
    showGridlines,
    rotationAngle,
    flipH,
    flipV,
    currentWidth,
    currentHeight,
    currentSizeBytes,
  ]);

  const pushSnapshotRef = useRef(pushSnapshot);
  pushSnapshotRef.current = pushSnapshot;

  // Canvas layout dimensions with default fallback to window dimensions
  const canvasContainerRef = useRef<View>(null);
  const [canvasLayout, setCanvasLayout] = useState({
    width: Dimensions.get('window').width - 16,
    height: Dimensions.get('window').height * 0.72,
    pageX: 0,
    pageY: 0,
  });

  // Refs for PanResponder state to prevent stale closures
  const activeToolRef = useRef(activeTool);
  activeToolRef.current = activeTool;
  const drawModeRef = useRef(drawMode);
  drawModeRef.current = drawMode;
  const selectedColorRef = useRef(selectedColor);
  selectedColorRef.current = selectedColor;
  const selectedStrokeWidthRef = useRef(selectedStrokeWidth);
  selectedStrokeWidthRef.current = selectedStrokeWidth;

  // Freehand Ink Drawing & Shape Gesture Responder
  const inkPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => activeToolRef.current === 'draw',
      onMoveShouldSetPanResponder: () => activeToolRef.current === 'draw',
      onPanResponderGrant: evt => {
        pushSnapshotRef.current();
        const {locationX, locationY} = evt.nativeEvent;
        setCurrentStroke([{x: locationX, y: locationY}]);
      },
      onPanResponderMove: evt => {
        const {locationX, locationY} = evt.nativeEvent;
        const mode = drawModeRef.current;
        if (mode === 'brush' || mode === 'highlighter') {
          setCurrentStroke(prev =>
            prev
              ? [...prev, {x: locationX, y: locationY}]
              : [{x: locationX, y: locationY}],
          );
        } else {
          setCurrentStroke(prev => {
            const p0 = prev && prev.length > 0 ? prev[0] : {x: locationX, y: locationY};
            return [p0, {x: locationX, y: locationY}];
          });
        }
      },
      onPanResponderRelease: () => {
        setCurrentStroke(pts => {
          if (pts && pts.length > 0) {
            const mode = drawModeRef.current;
            const p0 = pts[0];
            const p1 = pts[pts.length - 1] || p0;
            if ((mode === 'brush' || mode === 'highlighter') && pts.length > 1) {
              setInkPaths(prev => [
                ...prev,
                {
                  id: `stroke_${Date.now()}_${Math.random()}`,
                  type: mode,
                  points: pts,
                  color: selectedColorRef.current,
                  strokeWidth: selectedStrokeWidthRef.current,
                },
              ]);
            } else if (mode === 'arrow' && pts.length > 1) {
              const dist = Math.hypot(p1.x - p0.x, p1.y - p0.y);
              if (dist > 6) {
                setInkPaths(prev => [
                  ...prev,
                  {
                    id: `stroke_${Date.now()}_${Math.random()}`,
                    type: 'arrow',
                    points: [p0, p1],
                    color: selectedColorRef.current,
                    strokeWidth: selectedStrokeWidthRef.current,
                  },
                ]);
              }
            } else if (mode === 'circle' || mode === 'spotlight') {
              const dist = Math.hypot(p1.x - p0.x, p1.y - p0.y);
              if (dist > 6) {
                setInkPaths(prev => [
                  ...prev,
                  {
                    id: `stroke_${Date.now()}_${Math.random()}`,
                    type: mode,
                    points: [p0, p1],
                    color: selectedColorRef.current,
                    strokeWidth: selectedStrokeWidthRef.current,
                  },
                ]);
              }
            } else if (mode === 'step') {
              const existingSteps = inkPaths.filter(p => p.type === 'step').length;
              setInkPaths(prev => [
                ...prev,
                {
                  id: `stroke_${Date.now()}_${Math.random()}`,
                  type: 'step',
                  points: [p0],
                  color: selectedColorRef.current,
                  strokeWidth: selectedStrokeWidthRef.current,
                  stepNumber: existingSteps + 1,
                },
              ]);
            } else if (mode === 'rect' || mode === 'redact' || mode === 'pixelate') {
              const rx = Math.min(p0.x, p1.x);
              const ry = Math.min(p0.y, p1.y);
              const rw = Math.abs(p1.x - p0.x);
              const rh = Math.abs(p1.y - p0.y);
              if (rw > 4 && rh > 4) {
                setInkPaths(prev => [
                  ...prev,
                  {
                    id: `stroke_${Date.now()}_${Math.random()}`,
                    type: mode,
                    points: [p0, p1],
                    rect: {x: rx, y: ry, width: rw, height: rh},
                    color: selectedColorRef.current,
                    strokeWidth: selectedStrokeWidthRef.current,
                  },
                ]);
              }
            }
          }
          return null;
        });
      },
    }),
  ).current;

  // Helper to compute mathematically centered crop coordinates for any aspect ratio
  const getCenteredCropBoxForRatio = (
    ratio: AspectRatioOption,
    imgWidth?: number,
    imgHeight?: number,
  ) => {
    const w = imgWidth && imgWidth > 0 ? imgWidth : 1000;
    const h = imgHeight && imgHeight > 0 ? imgHeight : 1000;
    const imgAspect = w / h;

    if (ratio === 'free') {
      const width = 0.84;
      const height = 0.76;
      return {
        x: parseFloat(((1 - width) / 2).toFixed(4)),
        y: parseFloat(((1 - height) / 2).toFixed(4)),
        width,
        height,
      };
    }

    let targetR = 1.0;
    if (ratio === '1:1') targetR = 1.0;
    else if (ratio === '4:3') targetR = 4 / 3;
    else if (ratio === '16:9') targetR = 16 / 9;
    else if (ratio === '9:16') targetR = 9 / 16;
    else if (ratio === '3:2') targetR = 3 / 2;

    const K = targetR / imgAspect;
    let normW = 0.88;
    let normH = 0.88;

    if (K >= 1) {
      normW = 0.88;
      normH = 0.88 / K;
      if (normH > 0.88) {
        const scaleDown = 0.88 / normH;
        normW *= scaleDown;
        normH = 0.88;
      }
    } else {
      normH = 0.88;
      normW = 0.88 * K;
      if (normW > 0.88) {
        const scaleDown = 0.88 / normW;
        normH *= scaleDown;
        normW = 0.88;
      }
    }

    normW = Math.max(0.1, Math.min(0.96, parseFloat(normW.toFixed(4))));
    normH = Math.max(0.1, Math.min(0.96, parseFloat(normH.toFixed(4))));
    const normX = parseFloat(((1 - normW) / 2).toFixed(4));
    const normY = parseFloat(((1 - normH) / 2).toFixed(4));

    return {
      x: normX,
      y: normY,
      width: normW,
      height: normH,
    };
  };

  // Reset state on new item
  React.useEffect(() => {
    if (item?.uri) {
      setCurrentUri(item.uri);
      setCurrentWidth(item.width);
      setCurrentHeight(item.height);
      setCurrentSizeBytes(item.sizeBytes);
      setCurrentDurationMs(item.durationMs);
      setImageError(false);
      setZoomLevel(1.0);
      setActiveTool('none');
      setInkPaths([]);
      setCurrentStroke(null);
      setTexts([]);
      setCropBox(getCenteredCropBoxForRatio('free', item.width, item.height));

      // Reset video editing parameters
      setVideoTrimStartMs(0);
      setVideoTrimEndMs(item.durationMs || 10000);
      setVideoTrimTarget('end');
      setVideoIsMuted(false);
      setVideoVolume(100);
      setVideoSpeed(1.0);
      setPlaybackCurrentTimeMs(0);
    }
  }, [item?.uri, item?.width, item?.height, item?.sizeBytes, item?.durationMs]);

  // Load video filmstrip thumbnails for video scrubbing & frame selection
  React.useEffect(() => {
    if (item?.type === 'video' && item?.uri) {
      let isMounted = true;
      setIsLoadingFilmstrip(true);
      MediaEditor.generateFilmstrip({
        uri: item.uri,
        count: 10,
        targetWidth: 120,
        targetHeight: 120,
      })
        .then(result => {
          if (isMounted && result?.thumbnails) {
            setFilmstripThumbs(result.thumbnails);
          }
        })
        .catch(() => {})
        .finally(() => {
          if (isMounted) {
            setIsLoadingFilmstrip(false);
          }
        });
      return () => {
        isMounted = false;
      };
    } else {
      setFilmstripThumbs([]);
    }
  }, [item?.type, item?.uri]);

  // Load image dimensions if not provided
  React.useEffect(() => {
    if (currentUri || item?.uri) {
      const uriToInspect = currentUri || item?.uri;
      if (uriToInspect && item?.type === 'image') {
        if (!currentWidth || !currentHeight) {
          Image.getSize(
            uriToInspect,
            (w, h) => {
              if (w > 0 && h > 0) {
                setCurrentWidth(w);
                setCurrentHeight(h);
              }
            },
            () => {},
          );
        }
      }
    }
  }, [currentUri, item?.uri, item?.type, currentWidth, currentHeight]);

  // Compute exact displayed image rect (contain mode) so crop overlay aligns 1:1 with photo pixels
  const imageDisplayRect = useMemo(() => {
    const containerW = canvasLayout.width;
    const containerH = canvasLayout.height;
    if (!containerW || !containerH) {
      return {width: containerW, height: containerH};
    }
    const targetW = currentWidth ?? item?.width;
    const targetH = currentHeight ?? item?.height;
    if (!targetW || !targetH || targetW <= 0 || targetH <= 0) {
      return {width: containerW, height: containerH};
    }
    const imgAspect = targetW / targetH;
    const containerAspect = containerW / containerH;

    let w = containerW;
    let h = containerH;

    if (imgAspect > containerAspect) {
      w = containerW;
      h = containerW / imgAspect;
    } else {
      h = containerH;
      w = containerH * imgAspect;
    }
    return {
      width: Math.max(20, Math.floor(w)),
      height: Math.max(20, Math.floor(h)),
    };
  }, [canvasLayout.width, canvasLayout.height, currentWidth, currentHeight, item?.width, item?.height]);

  const activeUri = currentUri || item?.uri;
  const activeWidth = currentWidth ?? item?.width;
  const activeHeight = currentHeight ?? item?.height;
  const activeSizeBytes = currentSizeBytes ?? item?.sizeBytes;
  const activeDurationMs = currentDurationMs ?? item?.durationMs;

  const isVideo = item?.type === 'video';
  const isGif = item?.type === 'gif';
  const isImage = item?.type === 'image';

  // Zoom pan offset for dragging within a zoomed image
  const zoomPan = useRef(new Animated.ValueXY({x: 0, y: 0})).current;
  const zoomPanRef = useRef({x: 0, y: 0});
  const zoomPanOffsetRef = useRef({x: 0, y: 0});

  useEffect(() => {
    const idX = zoomPan.x.addListener(v => (zoomPanRef.current.x = v.value));
    const idY = zoomPan.y.addListener(v => (zoomPanRef.current.y = v.value));
    return () => {
      zoomPan.x.removeListener(idX);
      zoomPan.y.removeListener(idY);
    };
  }, [zoomPan]);

  // Ref copies for PanResponder closure
  const zoomLevelRef = useRef(zoomLevel);
  zoomLevelRef.current = zoomLevel;
  const imageDisplayRectRef = useRef(imageDisplayRect);
  imageDisplayRectRef.current = imageDisplayRect;
  const canvasLayoutRef = useRef(canvasLayout);
  canvasLayoutRef.current = canvasLayout;

  // Compute max pan bounds: how far the image can be dragged from center
  const getZoomPanBounds = useCallback(() => {
    const z = zoomLevelRef.current;
    if (z <= 1) return {maxX: 0, maxY: 0};
    const imgW = imageDisplayRectRef.current.width;
    const imgH = imageDisplayRectRef.current.height;
    const viewW = canvasLayoutRef.current.width;
    const viewH = canvasLayoutRef.current.height;
    // The scaled image overflows the viewport by (scaled - viewport) / 2
    // Since transforms are in the scaled coordinate space, divide by zoom
    const maxX = Math.max(0, (imgW * z - viewW) / 2 / z);
    const maxY = Math.max(0, (imgH * z - viewH) / 2 / z);
    return {maxX, maxY};
  }, []);

  const clampZoomPan = useCallback((x: number, y: number) => {
    const {maxX, maxY} = getZoomPanBounds();
    return {
      x: Math.max(-maxX, Math.min(maxX, x)),
      y: Math.max(-maxY, Math.min(maxY, y)),
    };
  }, [getZoomPanBounds]);

  // PanResponder for zoom panning (active when zoomed and no tool active)
  const zoomPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => zoomLevelRef.current > 1,
      onMoveShouldSetPanResponder: (_e, g) =>
        zoomLevelRef.current > 1 && (Math.abs(g.dx) > 4 || Math.abs(g.dy) > 4),
      onMoveShouldSetPanResponderCapture: (_e, g) =>
        zoomLevelRef.current > 1 && (Math.abs(g.dx) > 6 || Math.abs(g.dy) > 6),
      onPanResponderTerminationRequest: () => false,
      onShouldBlockNativeResponder: () => true,
      onPanResponderGrant: () => {
        zoomPanOffsetRef.current = {...zoomPanRef.current};
      },
      onPanResponderMove: (_e, gesture) => {
        const z = zoomLevelRef.current;
        // Divide gesture delta by zoom to convert screen pixels to content coordinates
        const rawX = zoomPanOffsetRef.current.x + gesture.dx / z;
        const rawY = zoomPanOffsetRef.current.y + gesture.dy / z;
        const {maxX, maxY} = (() => {
          const zl = zoomLevelRef.current;
          if (zl <= 1) return {maxX: 0, maxY: 0};
          const imgW = imageDisplayRectRef.current.width;
          const imgH = imageDisplayRectRef.current.height;
          const viewW = canvasLayoutRef.current.width;
          const viewH = canvasLayoutRef.current.height;
          return {
            maxX: Math.max(0, (imgW * zl - viewW) / 2 / zl),
            maxY: Math.max(0, (imgH * zl - viewH) / 2 / zl),
          };
        })();
        const clampedX = Math.max(-maxX, Math.min(maxX, rawX));
        const clampedY = Math.max(-maxY, Math.min(maxY, rawY));
        zoomPan.setValue({x: clampedX, y: clampedY});
      },
      onPanResponderRelease: () => {
        // Snap back if still out of bounds (shouldn't happen, but safety)
        const {maxX, maxY} = (() => {
          const zl = zoomLevelRef.current;
          if (zl <= 1) return {maxX: 0, maxY: 0};
          const imgW = imageDisplayRectRef.current.width;
          const imgH = imageDisplayRectRef.current.height;
          const viewW = canvasLayoutRef.current.width;
          const viewH = canvasLayoutRef.current.height;
          return {
            maxX: Math.max(0, (imgW * zl - viewW) / 2 / zl),
            maxY: Math.max(0, (imgH * zl - viewH) / 2 / zl),
          };
        })();
        const cur = zoomPanRef.current;
        const clamped = {
          x: Math.max(-maxX, Math.min(maxX, cur.x)),
          y: Math.max(-maxY, Math.min(maxY, cur.y)),
        };
        if (clamped.x !== cur.x || clamped.y !== cur.y) {
          Animated.spring(zoomPan, {
            toValue: clamped,
            friction: 7,
            tension: 60,
            useNativeDriver: false,
          }).start();
        }
      },
      onPanResponderTerminate: () => {},
    }),
  ).current;

  // Reset zoom pan offset when zoom level changes
  useEffect(() => {
    if (zoomLevel <= 1) {
      zoomPan.setValue({x: 0, y: 0});
      zoomPanOffsetRef.current = {x: 0, y: 0};
    } else {
      // Re-clamp when zoom decreases
      const clamped = clampZoomPan(zoomPanRef.current.x, zoomPanRef.current.y);
      if (clamped.x !== zoomPanRef.current.x || clamped.y !== zoomPanRef.current.y) {
        Animated.spring(zoomPan, {
          toValue: clamped,
          friction: 7,
          tension: 60,
          useNativeDriver: false,
        }).start();
      }
    }
  }, [zoomLevel, zoomPan, clampZoomPan]);

  // Zoom controls
  const handleZoomIn = () => {
    triggerNativeHaptic('light');
    setZoomLevel(prev => Math.min(4.0, parseFloat((prev + 0.25).toFixed(2))));
  };

  const handleZoomOut = () => {
    triggerNativeHaptic('light');
    setZoomLevel(prev => Math.max(1.0, parseFloat((prev - 0.25).toFixed(2))));
  };

  const handleResetZoom = () => {
    triggerNativeHaptic('medium');
    setZoomLevel(1.0);
    zoomPan.setValue({x: 0, y: 0});
    zoomPanOffsetRef.current = {x: 0, y: 0};
  };

  // Slider Drag / Touch Gesture Handler
  const sliderTrackWidthRef = useRef(240);

  const updateSliderFromLocation = useCallback((locX: number) => {
    const trackW = Math.max(50, sliderTrackWidthRef.current);
    const ratio = Math.max(0, Math.min(1, locX / trackW));

    if (activeToolRef.current === 'draw') {
      const mode = drawModeRef.current;
      if (
        mode === 'brush' ||
        mode === 'highlighter' ||
        mode === 'arrow' ||
        mode === 'rect' ||
        mode === 'circle' ||
        mode === 'spotlight' ||
        mode === 'step'
      ) {
        const sw = Math.round(2 + ratio * 22); // 2px to 24px
        setSelectedStrokeWidth(sw);
      } else if (mode === 'pixelate') {
        const blur = Math.round(4 + ratio * 36);
        setBlurIntensity(blur);
      }
    } else if (activeToolRef.current === 'adjust') {
      if (adjustMode === 'vignette') {
        const val = Math.round(ratio * 100);
        setAdjustments(prev => ({...prev, vignette: val}));
      } else {
        const val = Math.round(ratio * 100 - 50); // -50 to +50
        setAdjustments(prev => ({...prev, [adjustMode]: val}));
      }
    } else if (activeToolRef.current === 'crop') {
      const rot = Math.round(ratio * 360);
      setRotationAngle(rot);
    } else if (activeToolRef.current === 'trim') {
      const maxDur = activeDurationMs || 10000;
      const targetTime = Math.round(ratio * maxDur);
      if (videoTrimTarget === 'start') {
        setVideoTrimStartMs(Math.min(videoTrimEndMs - 500, targetTime));
      } else {
        setVideoTrimEndMs(Math.max(videoTrimStartMs + 500, targetTime));
      }
    } else if (activeToolRef.current === 'audio') {
      const vol = Math.round(ratio * 100);
      setVideoVolume(vol);
      setVideoIsMuted(vol === 0);
    } else if (activeToolRef.current === 'speed') {
      const spd = parseFloat((0.5 + ratio * 1.5).toFixed(2));
      setVideoSpeed(spd);
    } else if (activeToolRef.current === 'gif') {
      const fps = Math.round(6 + ratio * 18);
      setGifFps(fps);
    } else if (activeToolRef.current === 'none') {
      const z = parseFloat((1.0 + ratio * 3.0).toFixed(2));
      setZoomLevel(z);
    }
  }, [adjustMode, activeDurationMs, videoTrimTarget, videoTrimStartMs, videoTrimEndMs]);

  const sliderPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      onPanResponderGrant: evt => {
        triggerNativeHaptic('light');
        updateSliderFromLocation(evt.nativeEvent.locationX);
      },
      onPanResponderMove: evt => {
        updateSliderFromLocation(evt.nativeEvent.locationX);
      },
      onPanResponderRelease: () => {
        triggerNativeHaptic('light');
      },
    }),
  ).current;

  const sliderPercent = useMemo(() => {
    if (activeTool === 'draw') {
      if (
        drawMode === 'brush' ||
        drawMode === 'highlighter' ||
        drawMode === 'arrow' ||
        drawMode === 'rect' ||
        drawMode === 'circle' ||
        drawMode === 'spotlight' ||
        drawMode === 'step'
      ) {
        return Math.min(100, Math.max(0, ((selectedStrokeWidth - 2) / 22) * 100));
      }
      if (drawMode === 'pixelate') {
        return Math.min(100, Math.max(0, ((blurIntensity - 4) / 36) * 100));
      }
      if (drawMode === 'redact') {
        return 100;
      }
    }
    if (activeTool === 'adjust') {
      if (adjustMode === 'vignette') {
        return Math.min(100, Math.max(0, adjustments.vignette));
      }
      return Math.min(100, Math.max(0, adjustments[adjustMode] + 50));
    }
    if (activeTool === 'crop') {
      return Math.min(100, Math.max(0, (rotationAngle / 360) * 100));
    }
    if (activeTool === 'trim') {
      const maxDur = activeDurationMs || 10000;
      const currentVal = videoTrimTarget === 'start' ? videoTrimStartMs : videoTrimEndMs;
      return Math.min(100, Math.max(0, (currentVal / maxDur) * 100));
    }
    if (activeTool === 'audio') {
      return videoIsMuted ? 0 : videoVolume;
    }
    if (activeTool === 'speed') {
      return Math.min(100, Math.max(0, ((videoSpeed - 0.5) / 1.5) * 100));
    }
    if (activeTool === 'gif') {
      return Math.min(100, Math.max(0, ((gifFps - 6) / 18) * 100));
    }
    if (activeTool === 'none') {
      return Math.min(100, Math.max(0, ((zoomLevel - 1) / 3) * 100));
    }
    return 50;
  }, [
    activeTool,
    drawMode,
    selectedStrokeWidth,
    blurIntensity,
    adjustMode,
    adjustments,
    rotationAngle,
    zoomLevel,
    activeDurationMs,
    videoTrimTarget,
    videoTrimStartMs,
    videoTrimEndMs,
    videoIsMuted,
    videoVolume,
    videoSpeed,
    gifFps,
  ]);

  // Undo handler (pops top state from history)
  const handleUndo = useCallback(() => {
    if (history.length === 0) return;
    triggerNativeHaptic('light');
    const previousSnapshot = history[history.length - 1];
    setRedoHistory(prev => [
      ...prev,
      {
        uri: currentUri || item?.uri || null,
        inkPaths: [...inkPaths],
        texts: [...texts],
        adjustments: {...adjustments},
        filterPreset: activeFilterPreset,
        showWatermark,
        rotationAngle,
        flipH,
        flipV,
        width: currentWidth,
        height: currentHeight,
        sizeBytes: currentSizeBytes,
      },
    ]);
    setHistory(prev => prev.slice(0, prev.length - 1));

    if (previousSnapshot) {
      setCurrentUri(previousSnapshot.uri);
      setInkPaths(previousSnapshot.inkPaths);
      setTexts(previousSnapshot.texts);
      if (previousSnapshot.adjustments) setAdjustments(previousSnapshot.adjustments);
      if (previousSnapshot.filterPreset) setActiveFilterPreset(previousSnapshot.filterPreset);
      if (previousSnapshot.showWatermark !== undefined) setShowWatermark(previousSnapshot.showWatermark);
      if (previousSnapshot.showGridlines !== undefined) setShowGridlines(previousSnapshot.showGridlines);
      if (previousSnapshot.rotationAngle !== undefined) setRotationAngle(previousSnapshot.rotationAngle);
      if (previousSnapshot.flipH !== undefined) setFlipH(previousSnapshot.flipH);
      if (previousSnapshot.flipV !== undefined) setFlipV(previousSnapshot.flipV);
      if (previousSnapshot.width) setCurrentWidth(previousSnapshot.width);
      if (previousSnapshot.height) setCurrentHeight(previousSnapshot.height);
      if (previousSnapshot.sizeBytes) setCurrentSizeBytes(previousSnapshot.sizeBytes);
      showToast(t('mediaGallery.undone', 'Action Undone'));
    }
  }, [
    history,
    currentUri,
    item?.uri,
    inkPaths,
    texts,
    adjustments,
    activeFilterPreset,
    showWatermark,
    showGridlines,
    rotationAngle,
    flipH,
    flipV,
    currentWidth,
    currentHeight,
    currentSizeBytes,
    t,
  ]);

  // Redo handler (pops top state from redoHistory)
  const handleRedo = useCallback(() => {
    if (redoHistory.length === 0) return;
    triggerNativeHaptic('light');
    const nextSnapshot = redoHistory[redoHistory.length - 1];
    setHistory(prev => [
      ...prev,
      {
        uri: currentUri || item?.uri || null,
        inkPaths: [...inkPaths],
        texts: [...texts],
        adjustments: {...adjustments},
        filterPreset: activeFilterPreset,
        showWatermark,
        showGridlines,
        rotationAngle,
        flipH,
        flipV,
        width: currentWidth,
        height: currentHeight,
        sizeBytes: currentSizeBytes,
      },
    ]);
    setRedoHistory(prev => prev.slice(0, prev.length - 1));

    if (nextSnapshot) {
      setCurrentUri(nextSnapshot.uri);
      setInkPaths(nextSnapshot.inkPaths);
      setTexts(nextSnapshot.texts);
      if (nextSnapshot.adjustments) setAdjustments(nextSnapshot.adjustments);
      if (nextSnapshot.filterPreset) setActiveFilterPreset(nextSnapshot.filterPreset);
      if (nextSnapshot.showWatermark !== undefined) setShowWatermark(nextSnapshot.showWatermark);
      if (nextSnapshot.showGridlines !== undefined) setShowGridlines(nextSnapshot.showGridlines);
      if (nextSnapshot.rotationAngle !== undefined) setRotationAngle(nextSnapshot.rotationAngle);
      if (nextSnapshot.flipH !== undefined) setFlipH(nextSnapshot.flipH);
      if (nextSnapshot.flipV !== undefined) setFlipV(nextSnapshot.flipV);
      if (nextSnapshot.width) setCurrentWidth(nextSnapshot.width);
      if (nextSnapshot.height) setCurrentHeight(nextSnapshot.height);
      if (nextSnapshot.sizeBytes) setCurrentSizeBytes(nextSnapshot.sizeBytes);
      showToast(t('mediaGallery.redone', 'Action Redone'));
    }
  }, [
    redoHistory,
    currentUri,
    item?.uri,
    inkPaths,
    texts,
    adjustments,
    activeFilterPreset,
    showWatermark,
    showGridlines,
    rotationAngle,
    flipH,
    flipV,
    currentWidth,
    currentHeight,
    currentSizeBytes,
    t,
  ]);

  // Reset handler (reverts to original image or video)
  const handleReset = useCallback(() => {
    if (!item) return;
    triggerNativeHaptic('medium');
    pushSnapshot();
    setCurrentUri(item.uri);
    setInkPaths([]);
    setTexts([]);
    setAdjustments({
      brightness: 0,
      contrast: 0,
      saturation: 0,
      warmth: 0,
      exposure: 0,
      vignette: 0,
    });
    setActiveFilterPreset('none');
    setShowWatermark(false);
    setShowGridlines(false);
    setRotationAngle(0);
    setFlipH(false);
    setFlipV(false);
    setCurrentWidth(item.width);
    setCurrentHeight(item.height);
    setCurrentSizeBytes(item.sizeBytes);
    setCurrentDurationMs(item.durationMs);
    setZoomLevel(1.0);
    setActiveTool('none');

    // Reset video states
    setVideoTrimStartMs(0);
    setVideoTrimEndMs(item.durationMs || 10000);
    setVideoTrimTarget('end');
    setVideoIsMuted(false);
    setVideoVolume(100);
    setVideoSpeed(1.0);

    showToast(
      t(
        'mediaGallery.resetSuccess',
        item.type === 'video' ? 'Reset to original video' : 'Reset to original image',
      ),
    );
  }, [item, pushSnapshot, t]);

  // Save handler with native photo & video editor execution
  const handleSave = useCallback(async () => {
    if (!item || !activeUri) return;
    triggerNativeHaptic('medium');
    setIsEditing(true);

    if (isVideo) {
      try {
        const maxDur = activeDurationMs || item.durationMs || 10000;
        const res = await MediaEditor.trimVideo({
          uri: activeUri,
          startTimeMs: videoTrimStartMs,
          endTimeMs: videoTrimEndMs < maxDur ? videoTrimEndMs : undefined,
          muteAudio: videoIsMuted || videoVolume === 0,
          quality: 'high',
        });

        if (res?.uri) {
          setCurrentUri(res.uri);
          if (res.width) setCurrentWidth(res.width);
          if (res.height) setCurrentHeight(res.height);
          if (res.size) setCurrentSizeBytes(res.size);
          if (res.durationMs) setCurrentDurationMs(res.durationMs);
          showToast(t('mediaGallery.videoSaved', 'Video Saved Successfully'));
          inspectorCtx?.refreshMediaCount?.().catch(() => {});
        } else {
          showToast(t('mediaGallery.videoSaved', 'Video Saved'));
        }
      } catch {
        showToast(t('mediaGallery.saveFailed', 'Failed to save video'));
      } finally {
        setIsEditing(false);
      }
      return;
    }

    try {
      const imgW = Math.max(1, activeWidth || 1000);
      const imgH = Math.max(1, activeHeight || 1000);

      const redactions = inkPaths
        .filter(p => (p.type === 'redact' || p.type === 'pixelate') && p.rect)
        .map(p => {
          const r = p.rect!;
          return {
            x: r.x / imgW,
            y: r.y / imgH,
            width: r.width / imgW,
            height: r.height / imgH,
            style: p.type === 'pixelate' ? ('blur' as const) : ('blackout' as const),
            isNormalized: true,
          };
        });

      const annotations = [
        ...texts.map(t => ({
          x: t.x,
          y: t.y,
          width: 0.22,
          height: 0.06,
          color: t.bgColor || '#EF4444',
          label: t.text,
          isNormalized: true,
        })),
        ...inkPaths
          .filter(p => p.type === 'rect' || p.type === 'arrow' || p.type === 'circle')
          .map(p => {
            const p0 = p.points[0] || {x: 0, y: 0};
            const p1 = p.points[p.points.length - 1] || p0;
            const minX = Math.min(p0.x, p1.x);
            const minY = Math.min(p0.y, p1.y);
            const w = Math.max(10, Math.abs(p1.x - p0.x));
            const h = Math.max(10, Math.abs(p1.y - p0.y));
            return {
              x: minX / imgW,
              y: minY / imgH,
              width: w / imgW,
              height: h / imgH,
              color: p.color || '#EF4444',
              isNormalized: true,
            };
          }),
      ];

      const res = await MediaEditor.editPhoto({
        uri: activeUri,
        rotation: rotationAngle !== 0 ? rotationAngle : undefined,
        flipHorizontal: flipH,
        flipVertical: flipV,
        adjustments: {
          brightness: adjustments.brightness / 50,
          contrast: 1 + adjustments.contrast / 50,
          saturation: 1 + adjustments.saturation / 50,
          temperature: adjustments.warmth / 50,
          vignette: adjustments.vignette / 100,
        },
        filterPreset: activeFilterPreset !== 'none' ? activeFilterPreset : undefined,
        redactions: redactions.length > 0 ? redactions : undefined,
        annotations: annotations.length > 0 ? annotations : undefined,
        format: item.format === 'png' ? 'png' : 'jpeg',
        quality: 0.92,
      });

      if (res?.uri) {
        setCurrentUri(res.uri);
        if (res.width) setCurrentWidth(res.width);
        if (res.height) setCurrentHeight(res.height);
        if (res.size) setCurrentSizeBytes(res.size);
        setInkPaths([]);
        setTexts([]);
        setAdjustments({
          brightness: 0,
          contrast: 0,
          saturation: 0,
          warmth: 0,
          exposure: 0,
          vignette: 0,
        });
        setRotationAngle(0);
        setFlipH(false);
        setFlipV(false);
        showToast(t('mediaGallery.savedSuccess', 'Image Saved Successfully'));
        inspectorCtx?.refreshMediaCount?.().catch(() => {});
      } else {
        showToast(t('mediaGallery.savedSuccess', 'Image Saved'));
      }
    } catch {
      showToast(t('mediaGallery.saveFailed', 'Failed to save image'));
    } finally {
      setIsEditing(false);
    }
  }, [
    item,
    activeUri,
    isVideo,
    activeDurationMs,
    videoTrimStartMs,
    videoTrimEndMs,
    videoIsMuted,
    videoVolume,
    activeWidth,
    activeHeight,
    rotationAngle,
    flipH,
    flipV,
    adjustments,
    activeFilterPreset,
    inkPaths,
    texts,
    inspectorCtx,
    t,
  ]);

  // Snapshot frame as standalone PNG photo in gallery
  const handleSnapshotFrame = useCallback(async () => {
    if (!item || !activeUri || !isVideo || isEditing) return;
    triggerNativeHaptic('medium');
    setIsEditing(true);
    try {
      const res = await MediaEditor.generateFilmstrip({
        uri: activeUri,
        count: 1,
        targetWidth: activeWidth || 1080,
        targetHeight: activeHeight || 1920,
      });
      if (res?.thumbnails && res.thumbnails.length > 0) {
        showToast(t('mediaGallery.snapshotSaved', 'Frame Snapshot Saved (PNG)'));
        inspectorCtx?.refreshMediaCount?.().catch(() => {});
      } else {
        showToast(t('mediaGallery.snapshotFailed', 'Failed to snapshot frame'));
      }
    } catch {
      showToast(t('mediaGallery.snapshotFailed', 'Failed to snapshot frame'));
    } finally {
      setIsEditing(false);
    }
  }, [item, activeUri, isVideo, isEditing, activeWidth, activeHeight, inspectorCtx, t]);

  // Video change detection
  const hasVideoChanges = useMemo(() => {
    if (!isVideo || !item) return false;
    const maxDur = item.durationMs || 10000;
    const isTrimmed = videoTrimStartMs > 0 || videoTrimEndMs < maxDur;
    const isMuted = videoIsMuted || videoVolume < 100;
    const speedChanged = videoSpeed !== 1.0;
    const uriChanged = currentUri != null && currentUri !== item.uri;
    return isTrimmed || isMuted || speedChanged || uriChanged;
  }, [
    isVideo,
    item,
    videoTrimStartMs,
    videoTrimEndMs,
    videoIsMuted,
    videoVolume,
    videoSpeed,
    currentUri,
  ]);

  // Check if any edits/changes have occurred
  const hasChanges = useMemo(() => {
    if (!item) return false;
    const uriChanged = currentUri != null && currentUri !== item.uri;
    const hasDrawings = inkPaths.length > 0;
    const hasTexts = texts.length > 0;
    const hasHistory = history.length > 0;
    const hasAdjustments =
      adjustments.brightness !== 0 ||
      adjustments.contrast !== 0 ||
      adjustments.saturation !== 0 ||
      adjustments.warmth !== 0 ||
      adjustments.exposure !== 0 ||
      adjustments.vignette !== 0;
    const hasTransforms = rotationAngle !== 0 || flipH || flipV;
    const hasFilters = activeFilterPreset !== 'none';
    const hasWatermarkState = showWatermark;
    return (
      uriChanged ||
      hasDrawings ||
      hasTexts ||
      hasHistory ||
      hasAdjustments ||
      hasTransforms ||
      hasFilters ||
      hasWatermarkState ||
      showGridlines
    );
  }, [
    currentUri,
    item,
    inkPaths.length,
    texts.length,
    history.length,
    adjustments,
    rotationAngle,
    flipH,
    flipV,
    activeFilterPreset,
    showWatermark,
    showGridlines,
  ]);

  // Undo last drawing stroke
  const handleUndoStroke = () => {
    triggerNativeHaptic('light');
    handleUndo();
  };

  // Clear all drawing strokes
  const handleClearStrokes = () => {
    triggerNativeHaptic('medium');
    pushSnapshot();
    setInkPaths([]);
  };

  // Aspect ratio crop selector
  const handleSelectAspectRatio = (ratio: AspectRatioOption) => {
    triggerNativeHaptic('light');
    setActiveTool('crop');
    setAspectRatio(ratio);
    setCropBox(getCenteredCropBoxForRatio(ratio, activeWidth, activeHeight));
  };

  // Apply Free Crop
  const handleApplyCrop = async () => {
    if (!activeUri || !isImage) return;
    triggerNativeHaptic('medium');
    pushSnapshot();
    setIsEditing(true);
    try {
      const res = await MediaEditor.cropToDefect(activeUri, {
        x: cropBox.x,
        y: cropBox.y,
        width: cropBox.width,
        height: cropBox.height,
        isNormalized: true,
      });
      if (res?.uri) {
        setCurrentUri(res.uri);
        if (res.width) setCurrentWidth(res.width);
        if (res.height) setCurrentHeight(res.height);
        if (res.size) setCurrentSizeBytes(res.size);
        setCropBox(getCenteredCropBoxForRatio('free', res.width, res.height));
        setAspectRatio('free');
        showToast(t('mediaGallery.croppedSuccess', 'Image Cropped'));
        setActiveTool('none');
      } else {
        showToast(t('mediaGallery.cropFailed', 'Crop failed'));
      }
    } catch {
      showToast(t('mediaGallery.cropFailed', 'Crop failed'));
    } finally {
      setIsEditing(false);
    }
  };

  // Text annotations
  const handleOpenTextModal = (itemToEdit?: TextItem) => {
    triggerNativeHaptic('light');
    if (itemToEdit) {
      setEditingTextItem(itemToEdit);
      setInputNoteText(itemToEdit.text);
    } else {
      setEditingTextItem(null);
      setInputNoteText('');
    }
    setShowTextInputModal(true);
  };

  const handleDeleteTextNote = (id: string) => {
    triggerNativeHaptic('light');
    pushSnapshot();
    setTexts(prev => prev.filter(t => t.id !== id));
  };

  const handleSaveTextNote = () => {
    if (!inputNoteText.trim()) {
      setShowTextInputModal(false);
      return;
    }
    pushSnapshot();
    if (editingTextItem) {
      setTexts(prev =>
        prev.map(tItem =>
          tItem.id === editingTextItem.id
            ? {...tItem, text: inputNoteText.trim(), color: selectedColor}
            : tItem,
        ),
      );
    } else {
      const newText: TextItem = {
        id: `text_${Date.now()}`,
        text: inputNoteText.trim(),
        x: pendingTextPos.x,
        y: pendingTextPos.y,
        color: AppColors.white,
        bgColor: selectedColor === '#FFFFFF' ? '#0F172A' : selectedColor,
      };
      setTexts(prev => [...prev, newText]);
    }
    setShowTextInputModal(false);
    setInputNoteText('');
    showToast(t('mediaGallery.textAdded', 'Text Added'));
  };

  // Resize handler
  const handleApplyResize = async (scale: number) => {
    if (!activeUri || !isImage || isEditing) return;
    triggerNativeHaptic('medium');
    pushSnapshot();
    setIsEditing(true);
    try {
      const res = await MediaEditor.editPhoto({
        uri: activeUri,
        quality: 0.85,
        crop: {
          x: 0,
          y: 0,
          width: 1,
          height: 1,
          isNormalized: true,
        },
      });
      if (res?.uri) {
        setCurrentUri(res.uri);
        const newW = Math.round((activeWidth || 1080) * scale);
        const newH = Math.round((activeHeight || 1920) * scale);
        setCurrentWidth(newW);
        setCurrentHeight(newH);
        if (res.size) setCurrentSizeBytes(Math.round(res.size * scale * scale));
        showToast(
          t(
            'mediaGallery.resizedSuccess',
            `Resized to ${Math.round(scale * 100)}% (${newW}×${newH})`,
          ),
        );
        setActiveTool('none');
      }
    } catch {
      showToast(t('mediaGallery.resizeFailed', 'Resize failed'));
    } finally {
      setIsEditing(false);
    }
  };

  const handleShare = async () => {
    try {
      triggerNativeHaptic('light');
      const shareUri =
        activeUri.startsWith('file://') ||
        activeUri.startsWith('content://') ||
        activeUri.startsWith('http')
          ? activeUri
          : `file://${activeUri}`;

      const shareOptions = Platform.select({
        ios: {
          url: shareUri,
          title: item.filename,
        },
        default: {
          title: item.filename,
          message: item.filename,
          url: shareUri,
        },
      });

      const result = await Share.share(shareOptions);
      if (result.action === Share.sharedAction) {
        showToast(t('mediaGallery.shareSuccess', 'Shared successfully'));
      }
    } catch (err: any) {
      if (err?.message !== 'User did not share') {
        showToast(
          t(
            'mediaGallery.shareUnavailable',
            'Sharing not available on this device',
          ),
        );
      }
    }
  };

  const handleDelete = () => {
    triggerNativeHaptic('medium');
    setShowDeleteConfirm(true);
  };

  const handleConvert = async () => {
    if (!onConvertToGif) return;
    setIsConverting(true);
    try {
      await onConvertToGif(item);
      showToast(t('mediaGallery.convertedSuccess', 'Converted to GIF!'));
    } catch {
      showToast(t('mediaGallery.convertFailed', 'Conversion failed'));
    } finally {
      setIsConverting(false);
    }
  };

  const handlePlayVideo = async () => {
    try {
      setIsPlaying(true);
      await ScreenCapture.playVideo(activeUri);
    } catch {
      showToast(t('mediaGallery.playError', 'Unable to play video'));
    } finally {
      setIsPlaying(false);
    }
  };

  const handleTrimRepro = async () => {
    if (!activeUri || !isVideo || isEditing) return;
    setIsEditing(true);
    triggerNativeHaptic('light');
    try {
      const maxDuration = activeDurationMs || 10000;
      const targetEnd = Math.min(maxDuration, 5000);
      const res = await MediaEditor.trimReproClip(activeUri, 0, targetEnd, {
        quality: 'medium',
      });
      if (res?.uri) {
        setCurrentUri(res.uri);
        if (res.width) setCurrentWidth(res.width);
        if (res.height) setCurrentHeight(res.height);
        if (res.size) setCurrentSizeBytes(res.size);
        if (res.durationMs) setCurrentDurationMs(res.durationMs);
        showToast(t('mediaGallery.trimmedSuccess', 'Trimmed to 5s Repro Clip'));
      }
    } catch {
      showToast(t('mediaGallery.trimFailed', 'Trim failed'));
    } finally {
      setIsEditing(false);
    }
  };

  const handleMuteVideo = async () => {
    if (!activeUri || !isVideo || isEditing) return;
    setIsEditing(true);
    triggerNativeHaptic('light');
    try {
      const res = await MediaEditor.muteVideo(activeUri);
      if (res?.uri) {
        setCurrentUri(res.uri);
        if (res.width) setCurrentWidth(res.width);
        if (res.height) setCurrentHeight(res.height);
        if (res.size) setCurrentSizeBytes(res.size);
        if (res.durationMs) setCurrentDurationMs(res.durationMs);
        showToast(t('mediaGallery.mutedSuccess', 'Audio Stripped'));
      }
    } catch {
      showToast(t('mediaGallery.muteFailed', 'Mute failed'));
    } finally {
      setIsEditing(false);
    }
  };

  const durationSec = activeDurationMs
    ? (activeDurationMs / 1000).toFixed(1)
    : null;
  const formattedDuration = durationSec
    ? `00:${Number(durationSec) < 10 ? '0' : ''}${durationSec}`
    : null;

  const editorTabs = [
    {
      key: 'none',
      label: t('mediaGallery.preview', 'Preview'),
      themeColor: AppColors.brandPurple,
      icon: (isActive: boolean) => (
        <EyeIcon size={16} color={isActive ? '#38BDF8' : 'rgba(255,255,255,0.55)'} />
      ),
    },
    {
      key: 'crop',
      label: 'Crop',
      themeColor: AppColors.sky600,
      icon: (isActive: boolean) => (
        <CropIcon size={16} color={isActive ? '#38BDF8' : 'rgba(255,255,255,0.55)'} />
      ),
    },
    {
      key: 'adjust',
      label: 'Adjust',
      themeColor: AppColors.amber500,
      icon: (isActive: boolean) => (
        <SunAdjustIcon size={16} color={isActive ? '#38BDF8' : 'rgba(255,255,255,0.55)'} />
      ),
    },
    {
      key: 'draw',
      label: 'Markup',
      themeColor: AppColors.sky400,
      icon: (isActive: boolean) => (
        <PenIcon size={16} color={isActive ? '#38BDF8' : 'rgba(255,255,255,0.55)'} />
      ),
    },
    {
      key: 'text',
      label: 'Text',
      themeColor: AppColors.violet600,
      icon: (isActive: boolean) => (
        <TypeIcon size={16} color={isActive ? '#38BDF8' : 'rgba(255,255,255,0.55)'} />
      ),
    },
  ];

  const videoTabs = [
    {
      key: 'none',
      label: t('mediaGallery.preview', 'Player'),
      themeColor: AppColors.brandPurple,
      icon: (isActive: boolean) => (
        <EyeIcon size={14} color={isActive ? '#38BDF8' : 'rgba(255,255,255,0.55)'} />
      ),
    },
    {
      key: 'trim',
      label: t('media.trim', 'Trim'),
      themeColor: AppColors.sky600,
      icon: (isActive: boolean) => (
        <ScissorsIcon size={14} color={isActive ? '#38BDF8' : 'rgba(255,255,255,0.55)'} />
      ),
      hasBadge: videoTrimStartMs > 0 || videoTrimEndMs < (activeDurationMs || 10000),
    },
    {
      key: 'audio',
      label: t('media.audio', 'Audio'),
      themeColor: AppColors.amber600,
      icon: (isActive: boolean) => (
        <VolumeXIcon size={14} color={isActive ? '#38BDF8' : 'rgba(255,255,255,0.55)'} />
      ),
      hasBadge: videoIsMuted || videoVolume < 100,
    },
    {
      key: 'speed',
      label: t('media.speed', 'Speed'),
      themeColor: AppColors.violet600,
      icon: (isActive: boolean) => (
        <ZapIcon size={14} color={isActive ? '#38BDF8' : 'rgba(255,255,255,0.55)'} />
      ),
      hasBadge: videoSpeed !== 1.0,
    },
    {
      key: 'gif',
      label: t('media.toGif', 'To GIF'),
      themeColor: AppColors.emerald500,
      icon: (isActive: boolean) => (
        <GifIcon size={14} color={isActive ? '#38BDF8' : 'rgba(255,255,255,0.55)'} />
      ),
    },
    {
      key: 'snapshot',
      label: t('media.snapshot', 'Snapshot'),
      themeColor: AppColors.pink500,
      icon: (isActive: boolean) => (
        <CameraRollIcon size={14} color={isActive ? '#38BDF8' : 'rgba(255,255,255,0.55)'} />
      ),
    },
  ];

  if (!item || !visible) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      statusBarTranslucent={true}
      onRequestClose={onClose}>
      <View style={previewStyles.modalBackdrop}>
        <Pressable
          style={previewStyles.modalBackdropPressable}
          onPress={onClose}
        />
        <View
          style={[
            previewStyles.modalContentCard,
            {
              height: `${modalHeightPercent}%`,
              borderTopLeftRadius: modalHeightPercent >= 100 ? 0 : 20,
              borderTopRightRadius: modalHeightPercent >= 100 ? 0 : 20,
            },
          ]}>
          <StatusBar
            translucent
            backgroundColor="transparent"
            barStyle="light-content"
          />
          {/* Top Header Bar with API Detail Indigo-Violet Gradient */}
          <View
            style={[
              previewStyles.header,
              {
                paddingTop: headerTopPadding,
                borderTopLeftRadius: modalHeightPercent >= 100 ? 0 : 20,
                borderTopRightRadius: modalHeightPercent >= 100 ? 0 : 20,
              },
            ]}>
            <LinearGradient
              colors={[AppColors.indigo600, AppColors.violet600]}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 1}}
              style={[
                StyleSheet.absoluteFill,
                {
                  borderTopLeftRadius: modalHeightPercent >= 100 ? 0 : 20,
                  borderTopRightRadius: modalHeightPercent >= 100 ? 0 : 20,
                },
              ]}
              pointerEvents="none"
            />
            <View style={previewStyles.headerInner}>
              {/* Left: Back Arrow Navigation & Filename / Meta */}
              <View style={previewStyles.headerLeft}>
                <TouchableScale
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel={t('common.back', 'Back')}
                  onPress={onClose}
                  hitSlop={15}
                  style={previewStyles.headerBackBtn}>
                  <WhiteBackNavigation size={17} />
                </TouchableScale>
                <View style={previewStyles.headerTextCol}>
                  <View style={previewStyles.headerTitleRow}>
                    <Text style={previewStyles.title} numberOfLines={1}>
                      {item.filename || (isImage ? 'debug_session.png' : 'recording.mp4')}
                    </Text>
                    <View style={previewStyles.formatBadge}>
                      <Text style={previewStyles.formatBadgeText}>
                        {(
                          item.filename?.split('.').pop() ||
                          (isImage ? 'PNG' : isVideo ? 'MP4' : 'GIF')
                        ).toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  <View style={previewStyles.headerSubtitleRow}>
                    <Text style={previewStyles.subtitleDim} numberOfLines={1}>
                      {activeWidth && activeHeight
                        ? `${activeWidth} × ${activeHeight}`
                        : isImage ? '1320 × 2868' : '1080 × 1920'}
                    </Text>
                    {activeSizeBytes ? (
                      <>
                        <Text style={previewStyles.subtitleDot}>•</Text>
                        <Text style={previewStyles.subtitleSize}>
                          {formatBytes(activeSizeBytes)}
                        </Text>
                      </>
                    ) : (
                      <>
                        <Text style={previewStyles.subtitleDot}>•</Text>
                        <Text style={previewStyles.subtitleSize}>774 KB</Text>
                      </>
                    )}
                  </View>
                </View>
              </View>

              {/* Right: Dual Undo/Redo capsule, More Options •••, Primary Save/Export button */}
              <View style={previewStyles.headerRight}>
                {/* Dual Undo / Redo Combined Capsule */}
                {isImage && (
                  <View style={previewStyles.undoRedoGroup}>
                    <TouchableOpacity
                      accessible={true}
                      accessibilityRole="button"
                      accessibilityLabel={t('common.undo', 'Undo')}
                      onPress={handleUndo}
                      disabled={history.length === 0}
                      style={[
                        previewStyles.undoHalfBtn,
                        history.length === 0 && previewStyles.actionDisabled,
                      ]}
                      hitSlop={{top: 8, bottom: 8, left: 6, right: 4}}>
                      <UndoIcon
                        size={14}
                        color={
                          history.length > 0
                            ? AppColors.white
                            : 'rgba(255, 255, 255, 0.35)'
                        }
                      />
                    </TouchableOpacity>
                    <View style={previewStyles.undoDivider} />
                    <TouchableOpacity
                      accessible={true}
                      accessibilityRole="button"
                      accessibilityLabel="Redo"
                      onPress={handleRedo}
                      disabled={redoHistory.length === 0}
                      style={[
                        previewStyles.redoHalfBtn,
                        redoHistory.length === 0 && previewStyles.actionDisabled,
                      ]}
                      hitSlop={{top: 8, bottom: 8, left: 4, right: 6}}>
                      <RedoIcon
                        size={14}
                        color={
                          redoHistory.length > 0
                            ? AppColors.white
                            : 'rgba(255, 255, 255, 0.35)'
                        }
                      />
                    </TouchableOpacity>
                  </View>
                )}

                {/* More Options Pill (•••) */}
                <TouchableScale
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel="More Options"
                  onPress={() => {
                    triggerNativeHaptic('light');
                    setShowMoreMenu(prev => !prev);
                  }}
                  style={previewStyles.headerMoreBtn}
                  hitSlop={{top: 8, bottom: 8, left: 6, right: 6}}>
                  <MoreDotsIcon size={16} color={AppColors.white} />
                </TouchableScale>

                {/* Primary Save Action Button (Available for both Photo & Video) */}
                <TouchableScale
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel={t('common.save', 'Save')}
                  onPress={handleSave}
                  disabled={isEditing}
                  style={[previewStyles.headerSaveBtn, isEditing && {opacity: 0.6}]}
                  hitSlop={{top: 8, bottom: 8, left: 6, right: 6}}>
                  <SaveIcon size={14} color={AppColors.white} />
                  <Text style={previewStyles.headerSaveText}>{t('common.save', 'Save')}</Text>
                </TouchableScale>

                {/* Explicit Close (X) Button */}
                <TouchableScale
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel={t('common.close', 'Close')}
                  onPress={onClose}
                  style={previewStyles.headerCloseBtn}
                  hitSlop={{top: 8, bottom: 8, left: 6, right: 6}}>
                  <CloseWhite size={15} color={AppColors.white} />
                </TouchableScale>
              </View>
            </View>
          </View>

          {/* Quick Context Menu Dropdown for More Options (•••) */}
          {showMoreMenu && (
            <View style={previewStyles.moreMenuDropdown}>
              {((isImage && hasChanges) || (isVideo && hasVideoChanges)) && (
                <TouchableOpacity
                  onPress={() => {
                    setShowMoreMenu(false);
                    handleReset();
                  }}
                  style={previewStyles.moreMenuItem}>
                  <ResetIcon size={14} color={AppColors.sky400} />
                  <Text style={previewStyles.moreMenuItemText}>
                    {t('common.reset', 'Reset to Original')}
                  </Text>
                </TouchableOpacity>
              )}
              {isImage && (
                <TouchableOpacity
                  onPress={() => {
                    triggerNativeHaptic('light');
                    setShowGridlines(prev => !prev);
                    setShowMoreMenu(false);
                  }}
                  style={previewStyles.moreMenuItem}>
                  <GridlinesIcon size={14} color={showGridlines ? AppColors.sky400 : AppColors.white} />
                  <Text style={previewStyles.moreMenuItemText}>
                    {showGridlines
                      ? t('mediaGallery.hideGridlines', 'Hide Instagram Grid (3×3)')
                      : t('mediaGallery.showGridlines', 'Show Instagram Grid (3×3)')}
                  </Text>
                </TouchableOpacity>
              )}
              {isImage && (
                <TouchableOpacity
                  onPress={() => {
                    triggerNativeHaptic('light');
                    pushSnapshot();
                    setShowWatermark(prev => !prev);
                    setShowMoreMenu(false);
                  }}
                  style={previewStyles.moreMenuItem}>
                  <Text style={previewStyles.moreMenuItemIconText}>🛡</Text>
                  <Text style={previewStyles.moreMenuItemText}>
                    {showWatermark
                      ? t('mediaGallery.hideWatermark', 'Hide QA Watermark')
                      : t('mediaGallery.showWatermark', 'Show QA Watermark')}
                  </Text>
                </TouchableOpacity>
              )}
              {isVideo && (
                <TouchableOpacity
                  onPress={() => {
                    setShowMoreMenu(false);
                    handleConvert();
                  }}
                  style={previewStyles.moreMenuItem}>
                  <GifIcon size={14} color={AppColors.violet600} />
                  <Text style={previewStyles.moreMenuItemText}>
                    {t('mediaGallery.exportGif', 'Export as Animated GIF')}
                  </Text>
                </TouchableOpacity>
              )}
              {isVideo && (
                <TouchableOpacity
                  onPress={() => {
                    setShowMoreMenu(false);
                    handleSnapshotFrame();
                  }}
                  style={previewStyles.moreMenuItem}>
                  <CameraRollIcon size={14} color={AppColors.sky400} />
                  <Text style={previewStyles.moreMenuItemText}>
                    {t('mediaGallery.snapshotFrame', 'Snapshot Frame (PNG)')}
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={() => {
                  setShowMoreMenu(false);
                  handleShare();
                }}
                style={previewStyles.moreMenuItem}>
                <ShareIcon size={14} color={AppColors.white} />
                <Text style={previewStyles.moreMenuItemText}>
                  {t('mediaGallery.share', isVideo ? 'Share Video' : 'Share Image')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setShowMoreMenu(false);
                  handleDelete();
                }}
                style={[previewStyles.moreMenuItem, previewStyles.moreMenuItemDestructive]}>
                <TrashIcon size={14} color={AppColors.rose500} />
                <Text style={[previewStyles.moreMenuItemText, {color: AppColors.rose500}]}>
                  {t('mediaGallery.delete', 'Delete Media')}
                </Text>
              </TouchableOpacity>
            </View>
          )}

        {/* Media Preview Stage (Flex 1 container - scales image automatically without collision) */}
        <View style={previewStyles.stageWrapper}>
          <View
            onLayout={e => {
              const {width, height} = e.nativeEvent.layout;
              if (width > 20 && height > 20) {
                setCanvasLayout(prev => ({...prev, width, height}));
              }
            }}
            style={previewStyles.previewCard}>
            {isVideo ? (
              item.thumbnailUri && !imageError ? (
                <>
                  <Image
                    source={{uri: item.thumbnailUri}}
                    style={previewStyles.image}
                    resizeMode="contain"
                    onError={() => setImageError(true)}
                  />
                  <View style={previewStyles.videoImageOverlay} />
                </>
              ) : (
                <View style={previewStyles.videoFallbackBackdrop}>
                  <View style={previewStyles.videoFallbackGlow} />
                  <FilmIcon size={52} color={AppColors.sky400} />
                  <Text style={previewStyles.videoFallbackTitle}>
                    {item.width && item.height
                      ? `${item.width} × ${item.height}`
                      : 'HD Video Recording'}
                  </Text>
                  <Text style={previewStyles.videoFallbackSubtitle}>
                    {durationSec ? `${durationSec}s duration` : 'MP4 Video'} •{' '}
                    {formatBytes(item.sizeBytes)}
                  </Text>
                </View>
              )
            ) : (
              /* Interactive Canvas Container with Rotation Fit & Zoom */
              <Animated.View
                onLayout={e => {
                  const {width, height} = e.nativeEvent.layout;
                  if (width > 20 && height > 20) {
                    setCanvasLayout(prev => ({...prev, width, height}));
                  }
                }}
                style={[
                  previewStyles.canvasContainer,
                  {
                    transform: [
                      ...zoomPan.getTranslateTransform(),
                      {scale: zoomLevel},
                    ],
                  },
                ]}
                {...(activeTool === 'draw'
                  ? inkPanResponder.panHandlers
                  : activeTool === 'none' && zoomLevel > 1
                    ? zoomPanResponder.panHandlers
                    : {})}>
                <View
                  style={[
                    previewStyles.imageCanvasWrapper,
                    {
                      width: imageDisplayRect.width,
                      height: imageDisplayRect.height,
                      transform: [
                        {rotate: `${rotationAngle}deg`},
                        {scaleX: flipH ? -1 : 1},
                        {scaleY: flipV ? -1 : 1},
                      ],
                    },
                  ]}>
                  {/* Active or Original Image */}
                  <Image
                    key={isComparingOriginal ? item?.uri : activeUri}
                    source={{uri: isComparingOriginal ? item?.uri : activeUri}}
                    style={previewStyles.image}
                    resizeMode="cover"
                    onError={() => setImageError(true)}
                  />

                  {/* Visual Adjustment Filters Layer (Hidden during Compare) */}
                  {!isComparingOriginal && (
                    <>
                      {/* Brightness & Exposure Filter Overlay */}
                      {(adjustments.brightness + adjustments.exposure) !== 0 && (
                        <View
                          pointerEvents="none"
                          style={[
                            StyleSheet.absoluteFill,
                            {
                              backgroundColor:
                                adjustments.brightness + adjustments.exposure > 0
                                  ? '#FFFFFF'
                                  : '#000000',
                              opacity: Math.min(
                                0.65,
                                (Math.abs(adjustments.brightness + adjustments.exposure) / 100) *
                                  0.7,
                              ),
                            },
                          ]}
                        />
                      )}

                      {/* Warmth / Color Temperature Filter Overlay */}
                      {adjustments.warmth !== 0 && (
                        <View
                          pointerEvents="none"
                          style={[
                            StyleSheet.absoluteFill,
                            {
                              backgroundColor:
                                adjustments.warmth > 0 ? '#F59E0B' : '#0284C7',
                              opacity: Math.min(
                                0.4,
                                (Math.abs(adjustments.warmth) / 50) * 0.35,
                              ),
                            },
                          ]}
                        />
                      )}

                      {/* Saturation / Vibrant Tint Filter Overlay */}
                      {adjustments.saturation > 0 && (
                        <View
                          pointerEvents="none"
                          style={[
                            StyleSheet.absoluteFill,
                            {
                              backgroundColor: '#A855F7',
                              opacity: Math.min(
                                0.2,
                                (adjustments.saturation / 50) * 0.15,
                              ),
                            },
                          ]}
                        />
                      )}

                      {/* Vignette Shadow Border Ring */}
                      {adjustments.vignette > 0 && (
                        <View
                          pointerEvents="none"
                          style={[
                            StyleSheet.absoluteFill,
                            {
                              borderRadius: 6,
                              borderWidth: Math.max(
                                2,
                                (adjustments.vignette / 100) * 44,
                              ),
                              borderColor: `rgba(0, 0, 0, ${
                                0.85 * (adjustments.vignette / 100)
                              })`,
                            },
                          ]}
                        />
                      )}

                      {/* Filter Presets Simulation Overlays */}
                      {activeFilterPreset === 'mono' && (
                        <View
                          pointerEvents="none"
                          style={[
                            StyleSheet.absoluteFill,
                            {backgroundColor: 'rgba(100, 116, 139, 0.45)'},
                          ]}
                        />
                      )}
                      {activeFilterPreset === 'noir' && (
                        <View
                          pointerEvents="none"
                          style={[
                            StyleSheet.absoluteFill,
                            {backgroundColor: 'rgba(0, 0, 0, 0.48)'},
                          ]}
                        />
                      )}
                      {activeFilterPreset === 'sepia' && (
                        <View
                          pointerEvents="none"
                          style={[
                            StyleSheet.absoluteFill,
                            {backgroundColor: 'rgba(120, 53, 15, 0.32)'},
                          ]}
                        />
                      )}
                      {activeFilterPreset === 'vintage' && (
                        <View
                          pointerEvents="none"
                          style={[
                            StyleSheet.absoluteFill,
                            {backgroundColor: 'rgba(217, 119, 6, 0.22)'},
                          ]}
                        />
                      )}
                      {activeFilterPreset === 'vibrant' && (
                        <View
                          pointerEvents="none"
                          style={[
                            StyleSheet.absoluteFill,
                            {backgroundColor: 'rgba(236, 72, 153, 0.16)'},
                          ]}
                        />
                      )}
                      {activeFilterPreset === 'cool' && (
                        <View
                          pointerEvents="none"
                          style={[
                            StyleSheet.absoluteFill,
                            {backgroundColor: 'rgba(14, 165, 233, 0.22)'},
                          ]}
                        />
                      )}
                      {activeFilterPreset === 'warm' && (
                        <View
                          pointerEvents="none"
                          style={[
                            StyleSheet.absoluteFill,
                            {backgroundColor: 'rgba(249, 115, 22, 0.22)'},
                          ]}
                        />
                      )}
                      {activeFilterPreset === 'fade' && (
                        <View
                          pointerEvents="none"
                          style={[
                            StyleSheet.absoluteFill,
                            {backgroundColor: 'rgba(255, 255, 255, 0.18)'},
                          ]}
                        />
                      )}
                    </>
                  )}

                  {/* Freehand SVG Ink Stroke & Shapes Layer (Hidden during Compare) */}
                  {!isComparingOriginal && (
                    <Svg
                      style={StyleSheet.absoluteFill}
                      pointerEvents={activeTool === 'draw' ? 'auto' : 'none'}>
                      <G>
                        {/* Saved Strokes & Shapes */}
                        {inkPaths.map(stroke => {
                          if (stroke.type === 'brush') {
                            if (stroke.points.length < 2) return null;
                            const d = stroke.points.reduce((acc, pt, idx) => {
                              return idx === 0
                                ? `M ${pt.x} ${pt.y}`
                                : `${acc} L ${pt.x} ${pt.y}`;
                            }, '');
                            return (
                              <Path
                                key={stroke.id}
                                d={d}
                                stroke={stroke.color}
                                strokeWidth={stroke.strokeWidth}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                fill="none"
                              />
                            );
                          }

                          if (stroke.type === 'highlighter') {
                            if (stroke.points.length < 2) return null;
                            const d = stroke.points.reduce((acc, pt, idx) => {
                              return idx === 0
                                ? `M ${pt.x} ${pt.y}`
                                : `${acc} L ${pt.x} ${pt.y}`;
                            }, '');
                            return (
                              <Path
                                key={stroke.id}
                                d={d}
                                stroke={stroke.color}
                                strokeWidth={stroke.strokeWidth * 2.5}
                                strokeOpacity={0.4}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                fill="none"
                              />
                            );
                          }

                          if (stroke.type === 'arrow') {
                            if (stroke.points.length < 2) return null;
                            const p0 = stroke.points[0];
                            const p1 = stroke.points[1];
                            const dx = p1.x - p0.x;
                            const dy = p1.y - p0.y;
                            const angle = Math.atan2(dy, dx);
                            const headLen = Math.min(
                              28,
                              Math.max(14, stroke.strokeWidth * 3.5),
                            );
                            const headAngle = Math.PI / 6;
                            const x1 = p1.x - headLen * Math.cos(angle - headAngle);
                            const y1 = p1.y - headLen * Math.sin(angle - headAngle);
                            const x2 = p1.x - headLen * Math.cos(angle + headAngle);
                            const y2 = p1.y - headLen * Math.sin(angle + headAngle);
                            return (
                              <G key={stroke.id}>
                                <Line
                                  x1={p0.x}
                                  y1={p0.y}
                                  x2={p1.x}
                                  y2={p1.y}
                                  stroke={stroke.color}
                                  strokeWidth={stroke.strokeWidth}
                                  strokeLinecap="round"
                                />
                                <Polygon
                                  points={`${p1.x},${p1.y} ${x1},${y1} ${x2},${y2}`}
                                  fill={stroke.color}
                                />
                              </G>
                            );
                          }

                          if (stroke.type === 'rect') {
                            const r = stroke.rect || {
                              x: Math.min(
                                stroke.points[0]?.x || 0,
                                stroke.points[1]?.x || 0,
                              ),
                              y: Math.min(
                                stroke.points[0]?.y || 0,
                                stroke.points[1]?.y || 0,
                              ),
                              width: Math.abs(
                                (stroke.points[1]?.x || 0) -
                                  (stroke.points[0]?.x || 0),
                              ),
                              height: Math.abs(
                                (stroke.points[1]?.y || 0) -
                                  (stroke.points[0]?.y || 0),
                              ),
                            };
                            return (
                              <Rect
                                key={stroke.id}
                                x={r.x}
                                y={r.y}
                                width={r.width}
                                height={r.height}
                                stroke={stroke.color}
                                strokeWidth={stroke.strokeWidth}
                                rx={6}
                                ry={6}
                                fill="none"
                              />
                            );
                          }

                          if (stroke.type === 'circle') {
                            const p0 = stroke.points[0] || {x: 0, y: 0};
                            const p1 = stroke.points[1] || p0;
                            const rx = Math.min(p0.x, p1.x);
                            const ry = Math.min(p0.y, p1.y);
                            const rw = Math.max(10, Math.abs(p1.x - p0.x));
                            const rh = Math.max(10, Math.abs(p1.y - p0.y));
                            return (
                              <Ellipse
                                key={stroke.id}
                                cx={rx + rw / 2}
                                cy={ry + rh / 2}
                                rx={rw / 2}
                                ry={rh / 2}
                                stroke={stroke.color}
                                strokeWidth={stroke.strokeWidth}
                                fill="none"
                              />
                            );
                          }

                          if (stroke.type === 'spotlight') {
                            const p0 = stroke.points[0] || {x: 0, y: 0};
                            const p1 = stroke.points[1] || p0;
                            const rx = Math.min(p0.x, p1.x);
                            const ry = Math.min(p0.y, p1.y);
                            const rw = Math.max(16, Math.abs(p1.x - p0.x));
                            const rh = Math.max(16, Math.abs(p1.y - p0.y));
                            return (
                              <G key={stroke.id}>
                                <Ellipse
                                  cx={rx + rw / 2}
                                  cy={ry + rh / 2}
                                  rx={rw / 2}
                                  ry={rh / 2}
                                  stroke="#FBBF24"
                                  strokeWidth={2.5}
                                  strokeDasharray="5,3"
                                  fill="rgba(255, 255, 255, 0.15)"
                                />
                              </G>
                            );
                          }

                          if (stroke.type === 'step') {
                            const pt = stroke.points[0] || {x: 0, y: 0};
                            const badgeRadius = Math.max(12, Math.min(20, stroke.strokeWidth * 2.2 + 8));
                            return (
                              <G key={stroke.id}>
                                <Circle
                                  cx={pt.x}
                                  cy={pt.y}
                                  r={badgeRadius}
                                  fill={stroke.color || '#EF4444'}
                                  stroke="#FFFFFF"
                                  strokeWidth={1.5}
                                />
                                <SvgText
                                  x={pt.x}
                                  y={pt.y + badgeRadius * 0.35}
                                  fill="#FFFFFF"
                                  fontSize={Math.round(badgeRadius * 0.95)}
                                  fontWeight="bold"
                                  textAnchor="middle">
                                  {stroke.stepNumber || 1}
                                </SvgText>
                              </G>
                            );
                          }

                          if (stroke.type === 'redact') {
                            const r = stroke.rect || {
                              x: Math.min(
                                stroke.points[0]?.x || 0,
                                stroke.points[1]?.x || 0,
                              ),
                              y: Math.min(
                                stroke.points[0]?.y || 0,
                                stroke.points[1]?.y || 0,
                              ),
                              width: Math.abs(
                                (stroke.points[1]?.x || 0) -
                                  (stroke.points[0]?.x || 0),
                              ),
                              height: Math.abs(
                                (stroke.points[1]?.y || 0) -
                                  (stroke.points[0]?.y || 0),
                              ),
                            };
                            return (
                              <Rect
                                key={stroke.id}
                                x={r.x}
                                y={r.y}
                                width={r.width}
                                height={r.height}
                                fill="#000000"
                                rx={4}
                                ry={4}
                              />
                            );
                          }

                          if (stroke.type === 'pixelate') {
                            const r = stroke.rect || {
                              x: Math.min(
                                stroke.points[0]?.x || 0,
                                stroke.points[1]?.x || 0,
                              ),
                              y: Math.min(
                                stroke.points[0]?.y || 0,
                                stroke.points[1]?.y || 0,
                              ),
                              width: Math.abs(
                                (stroke.points[1]?.x || 0) -
                                  (stroke.points[0]?.x || 0),
                              ),
                              height: Math.abs(
                                (stroke.points[1]?.y || 0) -
                                  (stroke.points[0]?.y || 0),
                              ),
                            };
                            return (
                              <G key={stroke.id}>
                                <Rect
                                  x={r.x}
                                  y={r.y}
                                  width={r.width}
                                  height={r.height}
                                  fill="rgba(255,255,255,0.22)"
                                  stroke="rgba(255,255,255,0.5)"
                                  strokeWidth={1.5}
                                  strokeDasharray="4,4"
                                  rx={4}
                                  ry={4}
                                />
                                <Line
                                  x1={r.x}
                                  y1={r.y + r.height * 0.33}
                                  x2={r.x + r.width}
                                  y2={r.y + r.height * 0.33}
                                  stroke="rgba(255,255,255,0.35)"
                                  strokeWidth={1}
                                />
                                <Line
                                  x1={r.x}
                                  y1={r.y + r.height * 0.66}
                                  x2={r.x + r.width}
                                  y2={r.y + r.height * 0.66}
                                  stroke="rgba(255,255,255,0.35)"
                                  strokeWidth={1}
                                />
                                <Line
                                  x1={r.x + r.width * 0.33}
                                  y1={r.y}
                                  x2={r.x + r.width * 0.33}
                                  y2={r.y + r.height}
                                  stroke="rgba(255,255,255,0.35)"
                                  strokeWidth={1}
                                />
                                <Line
                                  x1={r.x + r.width * 0.66}
                                  y1={r.y}
                                  x2={r.x + r.width * 0.66}
                                  y2={r.y + r.height}
                                  stroke="rgba(255,255,255,0.35)"
                                  strokeWidth={1}
                                />
                              </G>
                            );
                          }

                          return null;
                        })}

                        {/* Live Active Gesture Stroke Preview */}
                        {currentStroke && currentStroke.length > 0 && (
                          <>
                            {drawMode === 'brush' && currentStroke.length > 1 && (
                              <Path
                                d={currentStroke.reduce((acc, pt, idx) => {
                                  return idx === 0
                                    ? `M ${pt.x} ${pt.y}`
                                    : `${acc} L ${pt.x} ${pt.y}`;
                                }, '')}
                                stroke={selectedColor}
                                strokeWidth={selectedStrokeWidth}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                fill="none"
                              />
                            )}

                            {drawMode === 'highlighter' && currentStroke.length > 1 && (
                              <Path
                                d={currentStroke.reduce((acc, pt, idx) => {
                                  return idx === 0
                                    ? `M ${pt.x} ${pt.y}`
                                    : `${acc} L ${pt.x} ${pt.y}`;
                                }, '')}
                                stroke={selectedColor}
                                strokeWidth={selectedStrokeWidth * 2.5}
                                strokeOpacity={0.4}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                fill="none"
                              />
                            )}

                            {drawMode === 'arrow' && currentStroke.length > 1 && (() => {
                              const p0 = currentStroke[0];
                              const p1 = currentStroke[currentStroke.length - 1];
                              const dx = p1.x - p0.x;
                              const dy = p1.y - p0.y;
                              const angle = Math.atan2(dy, dx);
                              const headLen = Math.min(
                                28,
                                Math.max(14, selectedStrokeWidth * 3.5),
                              );
                              const headAngle = Math.PI / 6;
                              const x1 = p1.x - headLen * Math.cos(angle - headAngle);
                              const y1 = p1.y - headLen * Math.sin(angle - headAngle);
                              const x2 = p1.x - headLen * Math.cos(angle + headAngle);
                              const y2 = p1.y - headLen * Math.sin(angle + headAngle);
                              return (
                                <G>
                                  <Line
                                    x1={p0.x}
                                    y1={p0.y}
                                    x2={p1.x}
                                    y2={p1.y}
                                    stroke={selectedColor}
                                    strokeWidth={selectedStrokeWidth}
                                    strokeLinecap="round"
                                  />
                                  <Polygon
                                    points={`${p1.x},${p1.y} ${x1},${y1} ${x2},${y2}`}
                                    fill={selectedColor}
                                  />
                                </G>
                              );
                            })()}

                            {drawMode === 'rect' && currentStroke.length > 1 && (() => {
                              const p0 = currentStroke[0];
                              const p1 = currentStroke[currentStroke.length - 1];
                              const rx = Math.min(p0.x, p1.x);
                              const ry = Math.min(p0.y, p1.y);
                              const rw = Math.abs(p1.x - p0.x);
                              const rh = Math.abs(p1.y - p0.y);
                              return (
                                <Rect
                                  x={rx}
                                  y={ry}
                                  width={rw}
                                  height={rh}
                                  stroke={selectedColor}
                                  strokeWidth={selectedStrokeWidth}
                                  rx={6}
                                  ry={6}
                                  fill="none"
                                />
                              );
                            })()}

                            {drawMode === 'circle' && currentStroke.length > 1 && (() => {
                              const p0 = currentStroke[0];
                              const p1 = currentStroke[currentStroke.length - 1];
                              const rx = Math.min(p0.x, p1.x);
                              const ry = Math.min(p0.y, p1.y);
                              const rw = Math.max(10, Math.abs(p1.x - p0.x));
                              const rh = Math.max(10, Math.abs(p1.y - p0.y));
                              return (
                                <Ellipse
                                  cx={rx + rw / 2}
                                  cy={ry + rh / 2}
                                  rx={rw / 2}
                                  ry={rh / 2}
                                  stroke={selectedColor}
                                  strokeWidth={selectedStrokeWidth}
                                  fill="none"
                                />
                              );
                            })()}

                            {drawMode === 'spotlight' && currentStroke.length > 1 && (() => {
                              const p0 = currentStroke[0];
                              const p1 = currentStroke[currentStroke.length - 1];
                              const rx = Math.min(p0.x, p1.x);
                              const ry = Math.min(p0.y, p1.y);
                              const rw = Math.max(16, Math.abs(p1.x - p0.x));
                              const rh = Math.max(16, Math.abs(p1.y - p0.y));
                              return (
                                <G>
                                  <Ellipse
                                    cx={rx + rw / 2}
                                    cy={ry + rh / 2}
                                    rx={rw / 2}
                                    ry={rh / 2}
                                    stroke="#FBBF24"
                                    strokeWidth={2.5}
                                    strokeDasharray="5,3"
                                    fill="rgba(255, 255, 255, 0.15)"
                                  />
                                </G>
                              );
                            })()}

                            {drawMode === 'step' && currentStroke.length > 0 && (() => {
                              const pt = currentStroke[0];
                              const existingSteps = inkPaths.filter(p => p.type === 'step').length;
                              const badgeRadius = Math.max(12, Math.min(20, selectedStrokeWidth * 2.2 + 8));
                              return (
                                <G>
                                  <Circle
                                    cx={pt.x}
                                    cy={pt.y}
                                    r={badgeRadius}
                                    fill={selectedColor || '#EF4444'}
                                    stroke="#FFFFFF"
                                    strokeWidth={1.5}
                                  />
                                  <SvgText
                                    x={pt.x}
                                    y={pt.y + badgeRadius * 0.35}
                                    fill="#FFFFFF"
                                    fontSize={Math.round(badgeRadius * 0.95)}
                                    fontWeight="bold"
                                    textAnchor="middle">
                                    {existingSteps + 1}
                                  </SvgText>
                                </G>
                              );
                            })()}

                            {drawMode === 'redact' && currentStroke.length > 1 && (() => {
                              const p0 = currentStroke[0];
                              const p1 = currentStroke[currentStroke.length - 1];
                              const rx = Math.min(p0.x, p1.x);
                              const ry = Math.min(p0.y, p1.y);
                              const rw = Math.abs(p1.x - p0.x);
                              const rh = Math.abs(p1.y - p0.y);
                              return (
                                <Rect
                                  x={rx}
                                  y={ry}
                                  width={rw}
                                  height={rh}
                                  fill="#000000"
                                  stroke="rgba(255,255,255,0.4)"
                                  strokeWidth={1}
                                  strokeDasharray="3,3"
                                  rx={4}
                                  ry={4}
                                />
                              );
                            })()}

                            {drawMode === 'pixelate' && currentStroke.length > 1 && (() => {
                              const p0 = currentStroke[0];
                              const p1 = currentStroke[currentStroke.length - 1];
                              const rx = Math.min(p0.x, p1.x);
                              const ry = Math.min(p0.y, p1.y);
                              const rw = Math.abs(p1.x - p0.x);
                              const rh = Math.abs(p1.y - p0.y);
                              return (
                                <Rect
                                  x={rx}
                                  y={ry}
                                  width={rw}
                                  height={rh}
                                  fill="rgba(255,255,255,0.22)"
                                  stroke="rgba(255,255,255,0.6)"
                                  strokeWidth={1.5}
                                  strokeDasharray="4,4"
                                  rx={4}
                                  ry={4}
                                />
                              );
                            })()}
                          </>
                        )}
                      </G>
                    </Svg>
                  )}

                  {/* Toggleable QA Diagnostic Watermark Bar Overlay */}
                  {showWatermark && !isComparingOriginal && (
                    <View
                      pointerEvents="none"
                      style={previewStyles.watermarkOverlay}>
                      <Text style={previewStyles.watermarkText}>
                        {Platform.OS.toUpperCase()} • {activeWidth}×{activeHeight} • QA DIAGNOSTIC
                      </Text>
                      <Text style={previewStyles.watermarkTime}>
                        {new Date().toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}
                      </Text>
                    </View>
                  )}

                  {/* Tap Anywhere on Canvas to Add Text */}
                  {activeTool === 'text' && (
                    <Pressable
                      style={StyleSheet.absoluteFill}
                      onPress={e => {
                        const {locationX, locationY} = e.nativeEvent;
                        const imgW = Math.max(1, imageDisplayRect.width);
                        const imgH = Math.max(1, imageDisplayRect.height);
                        const normX = Math.max(0.05, Math.min(0.85, locationX / imgW));
                        const normY = Math.max(0.05, Math.min(0.85, locationY / imgH));
                        setPendingTextPos({x: normX, y: normY});
                        handleOpenTextModal();
                      }}
                    />
                  )}

                  {/* Text Annotation Stickers with Dragging (Hidden during Compare) */}
                  {!isComparingOriginal &&
                    texts.map(textItem => (
                      <DraggableText
                        key={textItem.id}
                        textItem={textItem}
                        canvasWidth={imageDisplayRect.width}
                        canvasHeight={imageDisplayRect.height}
                        scale={zoomLevel}
                        onUpdate={(id, updates) => {
                          pushSnapshot();
                          setTexts(prev =>
                            prev.map(t =>
                              t.id === id ? {...t, ...updates} : t,
                            ),
                          );
                        }}
                        onDelete={id => {
                          handleDeleteTextNote(id);
                        }}
                        onEdit={itemToEdit => handleOpenTextModal(itemToEdit)}
                      />
                    ))}

                  {/* Instagram 3x3 Composition & Alignment Grid (Rule of Thirds) */}
                  {(showGridlines || activeTool === 'crop') && !isComparingOriginal && (
                    <View pointerEvents="none" style={previewStyles.instagramGridOverlay}>
                      <View style={[previewStyles.instagramGridHLine, {top: '33.33%'}]} />
                      <View style={[previewStyles.instagramGridHLine, {top: '66.67%'}]} />
                      <View style={[previewStyles.instagramGridVLine, {left: '33.33%'}]} />
                      <View style={[previewStyles.instagramGridVLine, {left: '66.67%'}]} />
                    </View>
                  )}
                </View>
              </Animated.View>
            )}



            {/* Bottom-Left Floating Hold to Compare Pill */}
            {isImage && hasChanges && (
              <Pressable
                onPressIn={() => {
                  triggerNativeHaptic('light');
                  setIsComparingOriginal(true);
                }}
                onPressOut={() => {
                  triggerNativeHaptic('light');
                  setIsComparingOriginal(false);
                }}
                style={({pressed}) => [
                  previewStyles.holdCompareBtn,
                  pressed && previewStyles.holdCompareBtnPressed,
                ]}>
                <EyeCompareIcon size={14} color={AppColors.white} />
                <Text style={previewStyles.holdCompareText}>
                  {isComparingOriginal ? 'Original Image' : 'Hold to Compare'}
                </Text>
              </Pressable>
            )}

            {/* Modern Frosted Center Play / Pause Button */}
            {isVideo && (
              <TouchableOpacity
                onPress={handlePlayVideo}
                activeOpacity={0.85}
                style={previewStyles.modernCenterPlayBtn}>
                {isPlaying ? (
                  <PauseIcon size={24} color={AppColors.white} />
                ) : (
                  <View style={{marginLeft: 3}}>
                    <PlayIcon size={24} color={AppColors.white} />
                  </View>
                )}
              </TouchableOpacity>
            )}

            {/* Floating Video Scrubber HUD at bottom of Video Stage */}
            {isVideo && (
              <View style={previewStyles.videoFloatingHud}>
                <TouchableOpacity
                  onPress={handlePlayVideo}
                  hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
                  {isPlaying ? (
                    <PauseIcon size={13} color={AppColors.white} />
                  ) : (
                    <PlayIcon size={13} color={AppColors.white} />
                  )}
                </TouchableOpacity>
                <View style={previewStyles.videoHudProgressBar}>
                  <View
                    style={[
                      previewStyles.videoHudProgressFill,
                      {
                        left: `${(videoTrimStartMs / (activeDurationMs || 10000)) * 100}%`,
                        width: `${Math.max(4, ((videoTrimEndMs - videoTrimStartMs) / (activeDurationMs || 10000)) * 100)}%`,
                      },
                    ]}
                  />
                </View>
                <Text style={previewStyles.videoHudTimeText}>
                  {formattedDuration || '00:05'}
                </Text>
                {videoIsMuted && (
                  <View style={previewStyles.videoHudBadge}>
                    <VolumeXIcon size={10} color="#F87171" />
                  </View>
                )}
                {videoSpeed !== 1.0 && (
                  <View style={previewStyles.videoHudBadge}>
                    <Text style={previewStyles.videoHudBadgeText}>{videoSpeed}x</Text>
                  </View>
                )}
              </View>
            )}

            {/* Floating Vertical Pro Zoom Dock on Right */}
            {isImage && (
              <View style={previewStyles.floatingZoomBar}>
                <TouchableScale
                  onPress={handleZoomIn}
                  style={previewStyles.zoomBtn}
                  accessibilityLabel="Zoom In">
                  <ZoomInIcon size={15} color={AppColors.white} />
                </TouchableScale>

                <TouchableOpacity
                  onPress={handleResetZoom}
                  activeOpacity={0.8}
                  style={previewStyles.zoomLevelBadge}>
                  <Text style={previewStyles.zoomLevelText}>
                    {Math.round(zoomLevel * 100)}%
                  </Text>
                </TouchableOpacity>

                <TouchableScale
                  onPress={handleZoomOut}
                  style={previewStyles.zoomBtn}
                  accessibilityLabel="Zoom Out">
                  <ZoomOutIcon size={15} color={AppColors.white} />
                </TouchableScale>

                <TouchableScale
                  onPress={handleResetZoom}
                  style={previewStyles.zoomBtn}
                  accessibilityLabel="Fit to Screen">
                  <MaximizeIcon size={14} color={AppColors.white} />
                </TouchableScale>
              </View>
            )}

            {/* Interactive Crop Frame Overlay */}
            {isImage && activeTool === 'crop' && (
              <CropOverlay
                cropBox={cropBox}
                imageWidth={imageDisplayRect.width}
                imageHeight={imageDisplayRect.height}
                imageOffsetX={(canvasLayout.width - imageDisplayRect.width) / 2}
                imageOffsetY={(canvasLayout.height - imageDisplayRect.height) / 2}
                scale={zoomLevel}
                onUpdateCropBox={setCropBox}
                onApplyCrop={handleApplyCrop}
                onCancelCrop={() => setActiveTool('none')}
              />
            )}
          </View>
        </View>

        {/* Bottom Controls Area (Contextual Sub-Toolbar + Dedicated Pro Studio Dock) */}
        <View style={previewStyles.bottomControlsContainer}>
          {/* Pro Contextual Tool Sub-Bar Header & Interactive Slider */}
          {(isImage || isVideo) && (
            <View style={previewStyles.contextToolPanel}>
              {/* Row 1: Glowing Dot + Tool Name & Right Metric Badge */}
              <View style={previewStyles.panelHeaderRow}>
                <View style={previewStyles.panelHeaderLeft}>
                  <View
                    style={[
                      previewStyles.panelGlowDot,
                      isImage && activeTool === 'draw' && {backgroundColor: '#818CF8'},
                      isImage && activeTool === 'crop' && {backgroundColor: '#38BDF8'},
                      isImage && activeTool === 'adjust' && {backgroundColor: '#F59E0B'},
                      isImage && activeTool === 'text' && {backgroundColor: '#A855F7'},
                      isVideo && activeTool === 'trim' && {backgroundColor: '#38BDF8'},
                      isVideo && activeTool === 'audio' && {backgroundColor: '#F59E0B'},
                      isVideo && activeTool === 'speed' && {backgroundColor: '#8B5CF6'},
                      isVideo && activeTool === 'gif' && {backgroundColor: '#10B981'},
                      isVideo && activeTool === 'snapshot' && {backgroundColor: '#EC4899'},
                      isVideo && activeTool === 'none' && {backgroundColor: '#818CF8'},
                    ]}
                  />
                  <Text style={previewStyles.panelHeaderTitle}>
                    {isImage ? (
                      activeTool === 'draw'
                        ? drawMode === 'redact'
                          ? 'BLACKOUT REDACTION'
                          : drawMode === 'pixelate'
                            ? 'PIXELATE BLUR'
                            : drawMode === 'highlighter'
                              ? 'HIGHLIGHTER'
                              : drawMode === 'arrow'
                                ? 'ARROW CALLOUT'
                                : drawMode === 'rect'
                                  ? 'RECTANGLE BOX'
                                  : drawMode === 'circle'
                                    ? 'CIRCLE / ELLIPSE'
                                    : drawMode === 'spotlight'
                                      ? 'SPOTLIGHT FOCUS'
                                      : drawMode === 'step'
                                        ? 'STEP NUMBER BADGE'
                                        : 'PEN BRUSH'
                        : activeTool === 'crop'
                          ? 'CROP & ROTATE'
                          : activeTool === 'adjust'
                            ? `ADJUST: ${adjustMode.toUpperCase()}`
                            : activeTool === 'text'
                              ? 'TEXT & BUG BADGES'
                              : 'CANVAS PREVIEW'
                    ) : (
                      activeTool === 'trim'
                        ? 'VIDEO TRIMMER'
                        : activeTool === 'audio'
                          ? 'AUDIO CONTROLS'
                          : activeTool === 'speed'
                            ? 'SPEED MULTIPLIER'
                            : activeTool === 'gif'
                              ? 'GIF EXPORT STUDIO'
                              : activeTool === 'snapshot'
                                ? 'FRAME SNAPSHOT'
                                : 'VIDEO STUDIO & PLAYER'
                    )}
                  </Text>
                </View>
                <View style={previewStyles.panelValueBadge}>
                  <Text style={previewStyles.panelValueText}>
                    {isImage ? (
                      activeTool === 'draw'
                        ? drawMode === 'redact'
                          ? '100% Solid'
                          : drawMode === 'pixelate'
                            ? `+${blurIntensity} px`
                            : drawMode === 'step'
                              ? `Badge #${inkPaths.filter(p => p.type === 'step').length + 1}`
                              : `+${selectedStrokeWidth} px`
                        : activeTool === 'crop'
                          ? `${aspectRatio.toUpperCase()} • ${rotationAngle}°`
                          : activeTool === 'adjust'
                            ? adjustMode === 'vignette'
                              ? `+${adjustments.vignette}%`
                              : `${adjustments[adjustMode] >= 0 ? '+' : ''}${adjustments[adjustMode]}%`
                            : activeTool === 'text'
                              ? `${texts.length} Notes`
                              : `${Math.round(zoomLevel * 100)}%`
                    ) : (
                      activeTool === 'trim'
                        ? `${(videoTrimStartMs / 1000).toFixed(1)}s - ${(videoTrimEndMs / 1000).toFixed(1)}s (${((videoTrimEndMs - videoTrimStartMs) / 1000).toFixed(1)}s)`
                        : activeTool === 'audio'
                          ? videoIsMuted ? 'Muted (0%)' : `${videoVolume}% Vol`
                          : activeTool === 'speed'
                            ? `${videoSpeed}x Speed`
                            : activeTool === 'gif'
                              ? `${gifFps} FPS • ${gifWidth}px`
                              : activeTool === 'snapshot'
                                ? `${activeWidth || 1080}×${activeHeight || 1920}`
                                : formattedDuration || '00:05'
                    )}
                  </Text>
                </View>
              </View>

              {/* Horizontal Filmstrip Video Frame Thumbnails (Trim Mode) */}
              {isVideo && activeTool === 'trim' && filmstripThumbs.length > 0 && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={previewStyles.filmstripScroll}>
                  {filmstripThumbs.map(thumb => {
                    const isWithinTrim =
                      thumb.timeMs >= videoTrimStartMs && thumb.timeMs <= videoTrimEndMs;
                    return (
                      <TouchableOpacity
                        key={`thumb_${thumb.index}_${thumb.timeMs}`}
                        onPress={() => {
                          triggerNativeHaptic('light');
                          if (videoTrimTarget === 'start') {
                            setVideoTrimStartMs(Math.min(videoTrimEndMs - 500, thumb.timeMs));
                          } else {
                            setVideoTrimEndMs(Math.max(videoTrimStartMs + 500, thumb.timeMs));
                          }
                        }}
                        style={[
                          previewStyles.filmstripThumbItem,
                          isWithinTrim && previewStyles.filmstripThumbActive,
                        ]}>
                        <Image
                          source={{uri: thumb.uri}}
                          style={previewStyles.filmstripThumbImg}
                          resizeMode="cover"
                        />
                        <Text style={previewStyles.filmstripThumbTime}>
                          {(thumb.timeMs / 1000).toFixed(1)}s
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              )}

              {/* Row 2: Sleek Interactive Draggable Slider Track */}
              <View style={previewStyles.sliderRowContainer}>
                <Text style={previewStyles.sliderMinIndicator}>
                  {isVideo && activeTool === 'speed' ? '0.5x' : isVideo && activeTool === 'gif' ? '6fps' : '○'}
                </Text>
                <View
                  onLayout={e => {
                    const w = e.nativeEvent.layout.width;
                    if (w > 20) {
                      sliderTrackWidthRef.current = w;
                    }
                  }}
                  style={previewStyles.sliderTrackTouchable}
                  {...sliderPanResponder.panHandlers}>
                  <View style={previewStyles.sliderTrackBg}>
                    <View
                      style={[
                        previewStyles.sliderFillTrack,
                        {
                          width: `${sliderPercent}%`,
                        },
                        isVideo && activeTool === 'trim' && {
                          left: `${(videoTrimStartMs / (activeDurationMs || 10000)) * 100}%`,
                          width: `${Math.max(4, ((videoTrimEndMs - videoTrimStartMs) / (activeDurationMs || 10000)) * 100)}%`,
                          backgroundColor: '#38BDF8',
                        },
                      ]}
                    />
                    <View
                      pointerEvents="none"
                      style={[
                        previewStyles.sliderThumbHandle,
                        {
                          left: `${sliderPercent}%`,
                        },
                      ]}>
                      <View style={previewStyles.sliderThumbInnerGlow} />
                    </View>
                  </View>
                </View>
                <Text style={previewStyles.sliderMaxIndicator}>
                  {isVideo && activeTool === 'speed' ? '2.0x' : isVideo && activeTool === 'gif' ? '24fps' : '●'}
                </Text>
              </View>

              {/* Row 3: Horizontal Sub-Tool Mode Chips */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={previewStyles.modeChipsScroll}>
                {isVideo ? (
                  activeTool === 'trim' ? (
                    <>
                      {/* Handle Selectors */}
                      <TouchableOpacity
                        onPress={() => {
                          triggerNativeHaptic('light');
                          setVideoTrimTarget('start');
                        }}
                        style={[
                          previewStyles.modeChip,
                          videoTrimTarget === 'start' && previewStyles.modeChipActive,
                        ]}>
                        <Text
                          style={[
                            previewStyles.modeChipText,
                            videoTrimTarget === 'start' && previewStyles.modeChipTextActive,
                          ]}>
                          Start: {(videoTrimStartMs / 1000).toFixed(1)}s
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => {
                          triggerNativeHaptic('light');
                          setVideoTrimTarget('end');
                        }}
                        style={[
                          previewStyles.modeChip,
                          videoTrimTarget === 'end' && previewStyles.modeChipActive,
                        ]}>
                        <Text
                          style={[
                            previewStyles.modeChipText,
                            videoTrimTarget === 'end' && previewStyles.modeChipTextActive,
                          ]}>
                          End: {(videoTrimEndMs / 1000).toFixed(1)}s
                        </Text>
                      </TouchableOpacity>

                      <View style={previewStyles.subDivider} />

                      {/* Trim Quick Presets */}
                      <TouchableOpacity
                        onPress={() => {
                          triggerNativeHaptic('light');
                          const maxDur = activeDurationMs || 10000;
                          setVideoTrimStartMs(0);
                          setVideoTrimEndMs(Math.min(maxDur, 3000));
                        }}
                        style={previewStyles.modeChip}>
                        <Text style={previewStyles.modeChipText}>{t('media.first3s', 'First 3s')}</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => {
                          triggerNativeHaptic('light');
                          const maxDur = activeDurationMs || 10000;
                          setVideoTrimStartMs(0);
                          setVideoTrimEndMs(Math.min(maxDur, 5000));
                        }}
                        style={previewStyles.modeChip}>
                        <Text style={previewStyles.modeChipText}>{t('media.first5s', 'First 5s')}</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => {
                          triggerNativeHaptic('light');
                          const maxDur = activeDurationMs || 10000;
                          setVideoTrimStartMs(0);
                          setVideoTrimEndMs(Math.min(maxDur, 10000));
                        }}
                        style={previewStyles.modeChip}>
                        <Text style={previewStyles.modeChipText}>{t('media.first10s', 'First 10s')}</Text>
                      </TouchableOpacity>

                      <View style={previewStyles.subDivider} />

                      <TouchableOpacity
                        onPress={handleSave}
                        style={previewStyles.applyActionBtn}>
                        <Text style={previewStyles.applyActionText}>{t('media.applyTrim', 'Apply Trim')}</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => {
                          triggerNativeHaptic('light');
                          setVideoTrimStartMs(0);
                          setVideoTrimEndMs(activeDurationMs || 10000);
                        }}
                        style={previewStyles.cancelActionBtn}>
                        <Text style={previewStyles.cancelActionText}>Reset</Text>
                      </TouchableOpacity>
                    </>
                  ) : activeTool === 'audio' ? (
                    <>
                      <TouchableOpacity
                        onPress={() => {
                          triggerNativeHaptic('light');
                          setVideoIsMuted(prev => !prev);
                        }}
                        style={[
                          previewStyles.modeChip,
                          videoIsMuted && previewStyles.modeChipActive,
                        ]}>
                        <VolumeXIcon
                          size={14}
                          color={videoIsMuted ? AppColors.white : 'rgba(255,255,255,0.7)'}
                        />
                        <Text
                          style={[
                            previewStyles.modeChipText,
                            videoIsMuted && previewStyles.modeChipTextActive,
                          ]}>
                          {videoIsMuted ? 'Muted' : 'Unmuted'}
                        </Text>
                      </TouchableOpacity>

                      <View style={previewStyles.subDivider} />

                      {[100, 75, 50, 25, 0].map(vol => (
                        <TouchableOpacity
                          key={vol}
                          onPress={() => {
                            triggerNativeHaptic('light');
                            setVideoVolume(vol);
                            setVideoIsMuted(vol === 0);
                          }}
                          style={[
                            previewStyles.modeChip,
                            !videoIsMuted && videoVolume === vol && previewStyles.modeChipActive,
                          ]}>
                          <Text
                            style={[
                              previewStyles.modeChipText,
                              !videoIsMuted &&
                                videoVolume === vol &&
                                previewStyles.modeChipTextActive,
                            ]}>
                            {vol}%
                          </Text>
                        </TouchableOpacity>
                      ))}

                      <View style={previewStyles.subDivider} />

                      <TouchableOpacity
                        onPress={handleMuteVideo}
                        style={previewStyles.applyActionBtn}>
                        <Text style={previewStyles.applyActionText}>{t('media.stripAudio', 'Strip Audio')}</Text>
                      </TouchableOpacity>
                    </>
                  ) : activeTool === 'speed' ? (
                    <>
                      {[0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map(spd => (
                        <TouchableOpacity
                          key={spd}
                          onPress={() => {
                            triggerNativeHaptic('light');
                            setVideoSpeed(spd);
                          }}
                          style={[
                            previewStyles.modeChip,
                            videoSpeed === spd && previewStyles.modeChipActive,
                          ]}>
                          <ZapIcon
                            size={13}
                            color={videoSpeed === spd ? AppColors.white : 'rgba(255,255,255,0.7)'}
                          />
                          <Text
                            style={[
                              previewStyles.modeChipText,
                              videoSpeed === spd && previewStyles.modeChipTextActive,
                            ]}>
                            {spd === 1.0 ? '1.0x (Normal)' : `${spd}x`}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </>
                  ) : activeTool === 'gif' ? (
                    <>
                      {/* FPS Presets */}
                      {[
                        {fps: 8, label: '8 FPS (Small)'},
                        {fps: 12, label: '12 FPS (Smooth)'},
                        {fps: 20, label: '20 FPS (HD)'},
                      ].map(item => (
                        <TouchableOpacity
                          key={item.fps}
                          onPress={() => {
                            triggerNativeHaptic('light');
                            setGifFps(item.fps);
                          }}
                          style={[
                            previewStyles.modeChip,
                            gifFps === item.fps && previewStyles.modeChipActive,
                          ]}>
                          <Text
                            style={[
                              previewStyles.modeChipText,
                              gifFps === item.fps && previewStyles.modeChipTextActive,
                            ]}>
                            {item.label}
                          </Text>
                        </TouchableOpacity>
                      ))}

                      <View style={previewStyles.subDivider} />

                      {/* Width Presets */}
                      {[
                        {w: 320, label: '320px'},
                        {w: 480, label: '480px'},
                        {w: 640, label: '640px'},
                      ].map(item => (
                        <TouchableOpacity
                          key={item.w}
                          onPress={() => {
                            triggerNativeHaptic('light');
                            setGifWidth(item.w);
                          }}
                          style={[
                            previewStyles.modeChip,
                            gifWidth === item.w && previewStyles.modeChipActive,
                          ]}>
                          <Text
                            style={[
                              previewStyles.modeChipText,
                              gifWidth === item.w && previewStyles.modeChipTextActive,
                            ]}>
                            {item.label}
                          </Text>
                        </TouchableOpacity>
                      ))}

                      <View style={previewStyles.subDivider} />

                      <TouchableOpacity
                        onPress={handleConvert}
                        disabled={isConverting}
                        style={[previewStyles.applyActionBtn, isConverting && {opacity: 0.6}]}>
                        <Text style={previewStyles.applyActionText}>
                          {isConverting ? 'Exporting...' : 'Export GIF'}
                        </Text>
                      </TouchableOpacity>
                    </>
                  ) : activeTool === 'snapshot' ? (
                    <>
                      <TouchableOpacity
                        onPress={handleSnapshotFrame}
                        disabled={isEditing}
                        style={previewStyles.applyActionBtn}>
                        <CameraRollIcon size={14} color={AppColors.white} />
                        <Text style={previewStyles.applyActionText}>
                          Snapshot Current Frame (PNG)
                        </Text>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <>
                      <TouchableOpacity
                        onPress={handlePlayVideo}
                        style={previewStyles.modeChipActive}>
                        <PlayIcon size={14} color={AppColors.white} />
                        <Text style={previewStyles.modeChipTextActive}>{t('media.playVideo', 'Play Video')}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => {
                          triggerNativeHaptic('light');
                          setActiveTool('trim');
                        }}
                        style={previewStyles.modeChip}>
                        <ScissorsIcon size={14} color="rgba(255,255,255,0.7)" />
                        <Text style={previewStyles.modeChipText}>{t('media.trimClip', 'Trim Clip')}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => {
                          triggerNativeHaptic('light');
                          setActiveTool('audio');
                        }}
                        style={previewStyles.modeChip}>
                        <VolumeXIcon size={14} color="rgba(255,255,255,0.7)" />
                        <Text style={previewStyles.modeChipText}>Audio</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => {
                          triggerNativeHaptic('light');
                          setActiveTool('speed');
                        }}
                        style={previewStyles.modeChip}>
                        <ZapIcon size={14} color="rgba(255,255,255,0.7)" />
                        <Text style={previewStyles.modeChipText}>{t('media.speed', 'Speed')}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => {
                          triggerNativeHaptic('light');
                          setActiveTool('gif');
                        }}
                        style={previewStyles.modeChip}>
                        <GifIcon size={14} color="rgba(255,255,255,0.7)" />
                        <Text style={previewStyles.modeChipText}>{t('media.exportGif', 'Export GIF')}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => {
                          triggerNativeHaptic('light');
                          setActiveTool('snapshot');
                        }}
                        style={previewStyles.modeChip}>
                        <CameraRollIcon size={14} color="rgba(255,255,255,0.7)" />
                        <Text style={previewStyles.modeChipText}>{t('media.snapshot', 'Snapshot')}</Text>
                      </TouchableOpacity>
                    </>
                  )
                ) : activeTool === 'draw' ? (
                  <>
                    {/* Brush / Pen */}
                    <TouchableOpacity
                      onPress={() => {
                        triggerNativeHaptic('light');
                        setDrawMode('brush');
                      }}
                      style={[
                        previewStyles.modeChip,
                        drawMode === 'brush' && previewStyles.modeChipActive,
                      ]}>
                      <PenIcon
                        size={14}
                        color={drawMode === 'brush' ? AppColors.white : 'rgba(255,255,255,0.6)'}
                      />
                      <Text
                        style={[
                          previewStyles.modeChipText,
                          drawMode === 'brush' && previewStyles.modeChipTextActive,
                        ]}>
                        Brush
                      </Text>
                    </TouchableOpacity>

                    {/* Highlighter */}
                    <TouchableOpacity
                      onPress={() => {
                        triggerNativeHaptic('light');
                        setDrawMode('highlighter');
                      }}
                      style={[
                        previewStyles.modeChip,
                        drawMode === 'highlighter' && previewStyles.modeChipActive,
                      ]}>
                      <HighlighterIcon
                        size={14}
                        color={drawMode === 'highlighter' ? AppColors.white : 'rgba(255,255,255,0.6)'}
                      />
                      <Text
                        style={[
                          previewStyles.modeChipText,
                          drawMode === 'highlighter' && previewStyles.modeChipTextActive,
                        ]}>
                        Highlighter
                      </Text>
                    </TouchableOpacity>

                    {/* Arrow */}
                    <TouchableOpacity
                      onPress={() => {
                        triggerNativeHaptic('light');
                        setDrawMode('arrow');
                      }}
                      style={[
                        previewStyles.modeChip,
                        drawMode === 'arrow' && previewStyles.modeChipActive,
                      ]}>
                      <ArrowRightIcon
                        size={14}
                        color={drawMode === 'arrow' ? AppColors.white : 'rgba(255,255,255,0.6)'}
                      />
                      <Text
                        style={[
                          previewStyles.modeChipText,
                          drawMode === 'arrow' && previewStyles.modeChipTextActive,
                        ]}>
                        Arrow
                      </Text>
                    </TouchableOpacity>

                    {/* Rectangle Box */}
                    <TouchableOpacity
                      onPress={() => {
                        triggerNativeHaptic('light');
                        setDrawMode('rect');
                      }}
                      style={[
                        previewStyles.modeChip,
                        drawMode === 'rect' && previewStyles.modeChipActive,
                      ]}>
                      <Text
                        style={[
                          previewStyles.modeChipIconText,
                          drawMode === 'rect' && {color: AppColors.white},
                        ]}>
                        □
                      </Text>
                      <Text
                        style={[
                          previewStyles.modeChipText,
                          drawMode === 'rect' && previewStyles.modeChipTextActive,
                        ]}>
                        Rectangle
                      </Text>
                    </TouchableOpacity>

                    {/* Circle Tool */}
                    <TouchableOpacity
                      onPress={() => {
                        triggerNativeHaptic('light');
                        setDrawMode('circle');
                      }}
                      style={[
                        previewStyles.modeChip,
                        drawMode === 'circle' && previewStyles.modeChipActive,
                      ]}>
                      <Text
                        style={[
                          previewStyles.modeChipIconText,
                          drawMode === 'circle' && {color: AppColors.white},
                        ]}>
                        ○
                      </Text>
                      <Text
                        style={[
                          previewStyles.modeChipText,
                          drawMode === 'circle' && previewStyles.modeChipTextActive,
                        ]}>
                        Circle
                      </Text>
                    </TouchableOpacity>

                    {/* Spotlight Focus Tool */}
                    <TouchableOpacity
                      onPress={() => {
                        triggerNativeHaptic('light');
                        setDrawMode('spotlight');
                      }}
                      style={[
                        previewStyles.modeChip,
                        drawMode === 'spotlight' && previewStyles.modeChipActive,
                      ]}>
                      <Text
                        style={[
                          previewStyles.modeChipIconText,
                          drawMode === 'spotlight' && {color: AppColors.white},
                        ]}>
                        🔦
                      </Text>
                      <Text
                        style={[
                          previewStyles.modeChipText,
                          drawMode === 'spotlight' && previewStyles.modeChipTextActive,
                        ]}>
                        Spotlight
                      </Text>
                    </TouchableOpacity>

                    {/* Step Number Badges ①②③ */}
                    <TouchableOpacity
                      onPress={() => {
                        triggerNativeHaptic('light');
                        setDrawMode('step');
                        showToast(
                          t(
                            'mediaGallery.tapToPlaceStep',
                            'Tap or drag on image to place numbered steps ① ② ③',
                          ),
                        );
                      }}
                      style={[
                        previewStyles.modeChip,
                        drawMode === 'step' && previewStyles.modeChipActive,
                      ]}>
                      <Text
                        style={[
                          previewStyles.modeChipIconText,
                          drawMode === 'step' && {color: AppColors.white},
                        ]}>
                        ①
                      </Text>
                      <Text
                        style={[
                          previewStyles.modeChipText,
                          drawMode === 'step' && previewStyles.modeChipTextActive,
                        ]}>
                        Step #{inkPaths.filter(p => p.type === 'step').length + 1}
                      </Text>
                    </TouchableOpacity>

                    {/* Redact */}
                    <TouchableOpacity
                      onPress={() => {
                        triggerNativeHaptic('light');
                        setDrawMode('redact');
                      }}
                      style={[
                        previewStyles.modeChip,
                        drawMode === 'redact' && previewStyles.modeChipActive,
                      ]}>
                      <RedactIcon
                        size={14}
                        color={drawMode === 'redact' ? AppColors.white : 'rgba(255,255,255,0.6)'}
                      />
                      <Text
                        style={[
                          previewStyles.modeChipText,
                          drawMode === 'redact' && previewStyles.modeChipTextActive,
                        ]}>
                        Redact
                      </Text>
                    </TouchableOpacity>

                    {/* Pixelate */}
                    <TouchableOpacity
                      onPress={() => {
                        triggerNativeHaptic('light');
                        setDrawMode('pixelate');
                      }}
                      style={[
                        previewStyles.modeChip,
                        drawMode === 'pixelate' && previewStyles.modeChipActive,
                      ]}>
                      <PixelateIcon
                        size={14}
                        color={drawMode === 'pixelate' ? AppColors.white : 'rgba(255,255,255,0.6)'}
                      />
                      <Text
                        style={[
                          previewStyles.modeChipText,
                          drawMode === 'pixelate' && previewStyles.modeChipTextActive,
                        ]}>
                        Pixelate
                      </Text>
                    </TouchableOpacity>

                    <View style={previewStyles.subDivider} />

                    {COLOR_PALETTE.map(c => (
                      <TouchableOpacity
                        key={c}
                        onPress={() => {
                          triggerNativeHaptic('light');
                          setSelectedColor(c);
                        }}
                        style={[
                          previewStyles.colorDot,
                          {backgroundColor: c},
                          selectedColor === c && previewStyles.colorDotActive,
                        ]}
                      />
                    ))}

                    <View style={previewStyles.subDivider} />

                    <TouchableOpacity
                      onPress={handleUndoStroke}
                      disabled={inkPaths.length === 0}
                      style={[
                        previewStyles.actionPillBtn,
                        inkPaths.length === 0 && {opacity: 0.4},
                      ]}>
                      <UndoIcon size={13} color={AppColors.white} />
                      <Text style={previewStyles.actionPillText}>Undo</Text>
                    </TouchableOpacity>

                    {inkPaths.length > 0 && (
                      <TouchableOpacity
                        onPress={handleClearStrokes}
                        style={[
                          previewStyles.actionPillBtn,
                          {backgroundColor: 'rgba(239, 68, 68, 0.2)'},
                        ]}>
                        <Text
                          style={[
                            previewStyles.actionPillText,
                            {color: AppColors.rose400},
                          ]}>
                          Clear ({inkPaths.length})
                        </Text>
                      </TouchableOpacity>
                    )}
                  </>
                ) : activeTool === 'adjust' ? (
                  <>
                    {/* Horizontal Filter Presets Strip */}
                    {([
                      {key: 'none', label: 'Original', icon: '✦'},
                      {key: 'vibrant', label: 'Vibrant', icon: '🌈'},
                      {key: 'mono', label: 'Mono', icon: '◐'},
                      {key: 'sepia', label: 'Sepia', icon: '☕'},
                      {key: 'vintage', label: 'Vintage', icon: '🎞'},
                      {key: 'noir', label: 'Noir', icon: '🌑'},
                      {key: 'cool', label: 'Cool', icon: '❄'},
                      {key: 'warm', label: 'Warm', icon: '☀'},
                      {key: 'fade', label: 'Fade', icon: '🌫'},
                    ] as const).map(fp => (
                      <TouchableOpacity
                        key={fp.key}
                        onPress={() => {
                          triggerNativeHaptic('light');
                          pushSnapshot();
                          setActiveFilterPreset(fp.key);
                        }}
                        style={[
                          previewStyles.modeChip,
                          activeFilterPreset === fp.key && previewStyles.modeChipActive,
                        ]}>
                        <Text
                          style={[
                            previewStyles.modeChipIconText,
                            activeFilterPreset === fp.key && {color: AppColors.white},
                          ]}>
                          {fp.icon}
                        </Text>
                        <Text
                          style={[
                            previewStyles.modeChipText,
                            activeFilterPreset === fp.key && previewStyles.modeChipTextActive,
                          ]}>
                          {fp.label}
                        </Text>
                      </TouchableOpacity>
                    ))}

                    <View style={previewStyles.subDivider} />

                    {/* Toggle QA Diagnostic Watermark Bar */}
                    <TouchableOpacity
                      onPress={() => {
                        triggerNativeHaptic('light');
                        pushSnapshot();
                        setShowWatermark(prev => !prev);
                      }}
                      style={[
                        previewStyles.modeChip,
                        showWatermark && previewStyles.modeChipActive,
                      ]}>
                      <Text
                        style={[
                          previewStyles.modeChipIconText,
                          showWatermark && {color: AppColors.white},
                        ]}>
                        🛡
                      </Text>
                      <Text
                        style={[
                          previewStyles.modeChipText,
                          showWatermark && previewStyles.modeChipTextActive,
                        ]}>
                        QA Bar {showWatermark ? 'ON' : 'OFF'}
                      </Text>
                    </TouchableOpacity>

                    {/* Instagram Grid (3x3) Toggle */}
                    <TouchableOpacity
                      onPress={() => {
                        triggerNativeHaptic('light');
                        setShowGridlines(prev => !prev);
                      }}
                      style={[
                        previewStyles.modeChip,
                        showGridlines && previewStyles.modeChipActive,
                      ]}>
                      <GridlinesIcon
                        size={13}
                        color={showGridlines ? AppColors.white : 'rgba(255,255,255,0.8)'}
                      />
                      <Text
                        style={[
                          previewStyles.modeChipText,
                          showGridlines && previewStyles.modeChipTextActive,
                        ]}>
                        Grid 3×3
                      </Text>
                    </TouchableOpacity>

                    <View style={previewStyles.subDivider} />

                    {/* Fine-Tuning Adjustment Controls */}
                    {([
                      {key: 'brightness', label: t('media.brightness', 'Brightness'), IconComponent: BrightnessIcon},
                      {key: 'contrast', label: t('media.contrast', 'Contrast'), IconComponent: ContrastIcon},
                      {key: 'saturation', label: t('media.saturation', 'Saturation'), IconComponent: SaturationIcon},
                      {key: 'warmth', label: t('media.warmth', 'Warmth'), IconComponent: WarmthIcon},
                      {key: 'exposure', label: t('media.exposure', 'Exposure'), IconComponent: ExposureIcon},
                      {key: 'vignette', label: t('media.vignette', 'Vignette'), IconComponent: VignetteIcon},
                    ] as const).map(adj => {
                      const Icon = adj.IconComponent;
                      const isActive = adjustMode === adj.key;
                      return (
                        <TouchableOpacity
                          key={adj.key}
                          onPress={() => {
                            triggerNativeHaptic('light');
                            setAdjustMode(adj.key);
                          }}
                          style={[
                            previewStyles.modeChip,
                            isActive && previewStyles.modeChipActive,
                          ]}>
                          <Icon
                            size={14}
                            color={isActive ? AppColors.white : AppColors.grayTextWeak}
                          />
                          <Text
                            style={[
                              previewStyles.modeChipText,
                              isActive && previewStyles.modeChipTextActive,
                            ]}>
                            {adj.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                    <View style={previewStyles.subDivider} />
                    <TouchableOpacity
                      onPress={() => {
                        triggerNativeHaptic('medium');
                        pushSnapshot();
                        setActiveFilterPreset('none');
                        setShowWatermark(false);
                        setAdjustments({
                          brightness: 0,
                          contrast: 0,
                          saturation: 0,
                          warmth: 0,
                          exposure: 0,
                          vignette: 0,
                        });
                        showToast(t('mediaGallery.resetAdjustments', 'Adjustments Reset'));
                      }}
                      style={previewStyles.modeChip}>
                      <ResetIcon size={12} color="rgba(255,255,255,0.7)" />
                      <Text style={previewStyles.modeChipText}>Reset</Text>
                    </TouchableOpacity>
                  </>
                ) : activeTool === 'crop' ? (
                  <>
                    {(['free', '1:1', '4:3', '16:9', '9:16', '3:2'] as AspectRatioOption[]).map(r => (
                      <TouchableOpacity
                        key={r}
                        onPress={() => {
                          triggerNativeHaptic('light');
                          setAspectRatio(r);
                          const newBox = getCenteredCropBoxForRatio(
                            r,
                            activeWidth,
                            activeHeight,
                          );
                          setCropBox(newBox);
                        }}
                        style={[
                          previewStyles.modeChip,
                          aspectRatio === r && previewStyles.modeChipActive,
                        ]}>
                        <Text
                          style={[
                            previewStyles.modeChipText,
                            aspectRatio === r && previewStyles.modeChipTextActive,
                          ]}>
                          {r === 'free' ? 'Free' : r}
                        </Text>
                      </TouchableOpacity>
                    ))}
                    <View style={previewStyles.subDivider} />
                    {/* Rotate 90° CW */}
                    <TouchableOpacity
                      onPress={() => {
                        triggerNativeHaptic('light');
                        pushSnapshot();
                        setRotationAngle(prev => (prev + 90) % 360);
                      }}
                      style={previewStyles.modeChip}>
                      <RotateIcon size={13} color="rgba(255,255,255,0.8)" />
                      <Text style={previewStyles.modeChipText}>{t('media.rotate90', 'Rotate 90°')}</Text>
                    </TouchableOpacity>
                    {/* Flip H */}
                    <TouchableOpacity
                      onPress={() => {
                        triggerNativeHaptic('light');
                        pushSnapshot();
                        setFlipH(prev => !prev);
                      }}
                      style={[
                        previewStyles.modeChip,
                        flipH && previewStyles.modeChipActive,
                      ]}>
                      <Text
                        style={[
                          previewStyles.modeChipIconText,
                          flipH && {color: AppColors.white},
                        ]}>
                        ⇄
                      </Text>
                      <Text
                        style={[
                          previewStyles.modeChipText,
                          flipH && previewStyles.modeChipTextActive,
                        ]}>
                        Flip H
                      </Text>
                    </TouchableOpacity>
                    {/* Flip V */}
                    <TouchableOpacity
                      onPress={() => {
                        triggerNativeHaptic('light');
                        pushSnapshot();
                        setFlipV(prev => !prev);
                      }}
                      style={[
                        previewStyles.modeChip,
                        flipV && previewStyles.modeChipActive,
                      ]}>
                      <Text
                        style={[
                          previewStyles.modeChipIconText,
                          flipV && {color: AppColors.white},
                        ]}>
                        ⇅
                      </Text>
                      <Text
                        style={[
                          previewStyles.modeChipText,
                          flipV && previewStyles.modeChipTextActive,
                        ]}>
                        Flip V
                      </Text>
                    </TouchableOpacity>
                    {/* Instagram Grid (3x3) Toggle */}
                    <TouchableOpacity
                      onPress={() => {
                        triggerNativeHaptic('light');
                        setShowGridlines(prev => !prev);
                      }}
                      style={[
                        previewStyles.modeChip,
                        showGridlines && previewStyles.modeChipActive,
                      ]}>
                      <GridlinesIcon
                        size={13}
                        color={showGridlines ? AppColors.white : 'rgba(255,255,255,0.8)'}
                      />
                      <Text
                        style={[
                          previewStyles.modeChipText,
                          showGridlines && previewStyles.modeChipTextActive,
                        ]}>
                        Grid 3×3
                      </Text>
                    </TouchableOpacity>
                    <View style={previewStyles.subDivider} />
                    <TouchableOpacity
                      onPress={handleApplyCrop}
                      style={previewStyles.applyActionBtn}>
                      <Text style={previewStyles.applyActionText}>Apply</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => setActiveTool('none')}
                      style={previewStyles.cancelActionBtn}>
                      <Text style={previewStyles.cancelActionText}>Cancel</Text>
                    </TouchableOpacity>
                  </>
                ) : activeTool === 'text' ? (
                  <>
                    <TouchableOpacity
                      onPress={() => handleOpenTextModal()}
                      style={previewStyles.modeChipActive}>
                      <Text style={previewStyles.modeChipTextActive}>{t('media.customNote', '+ Custom Note')}</Text>
                    </TouchableOpacity>

                    <View style={previewStyles.subDivider} />

                    {/* Fast QA Bug Tag Preset Badges */}
                    {([
                      {label: '🐞 BUG', color: '#EF4444'},
                      {label: '⚠️ OVERFLOW', color: '#F59E0B'},
                      {label: '⚡ SLOW >3s', color: '#8B5CF6'},
                      {label: '🚫 API 500', color: '#DC2626'},
                      {label: '💥 CRASH', color: '#991B1B'},
                    ] as const).map(tag => (
                      <TouchableOpacity
                        key={tag.label}
                        onPress={() => {
                          triggerNativeHaptic('light');
                          pushSnapshot();
                          setTexts(prev => [
                            ...prev,
                            {
                              id: `text_${Date.now()}_${Math.random()}`,
                              text: tag.label,
                              x: pendingTextPos?.x ?? 0.35,
                              y: pendingTextPos?.y ?? 0.35,
                              color: '#FFFFFF',
                              bgColor: tag.color,
                              fontSize: 13,
                            },
                          ]);
                          showToast(t('mediaGallery.tagPlaced', `Placed tag: ${tag.label}`));
                        }}
                        style={[
                          previewStyles.modeChip,
                          {
                            borderColor: tag.color,
                            backgroundColor: `${tag.color}26`,
                          },
                        ]}>
                        <Text
                          style={[
                            previewStyles.modeChipText,
                            {color: tag.color, fontWeight: '700'},
                          ]}>
                          {tag.label}
                        </Text>
                      </TouchableOpacity>
                    ))}

                    <View style={previewStyles.subDivider} />

                    {COLOR_PALETTE.map(c => (
                      <TouchableOpacity
                        key={c}
                        onPress={() => {
                          triggerNativeHaptic('light');
                          setSelectedColor(c);
                        }}
                        style={[
                          previewStyles.colorDot,
                          {backgroundColor: c},
                          selectedColor === c && previewStyles.colorDotActive,
                        ]}
                      />
                    ))}
                    {texts.length > 0 && (
                      <>
                        <View style={previewStyles.subDivider} />
                        <TouchableOpacity
                          onPress={() => {
                            triggerNativeHaptic('medium');
                            pushSnapshot();
                            setTexts([]);
                          }}
                          style={[
                            previewStyles.modeChip,
                            {backgroundColor: 'rgba(239, 68, 68, 0.2)'},
                          ]}>
                          <Text style={[previewStyles.modeChipText, {color: AppColors.rose500}]}>
                            Clear All ({texts.length})
                          </Text>
                        </TouchableOpacity>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    <TouchableOpacity
                      onPress={() => {
                        triggerNativeHaptic('light');
                        setActiveTool('draw');
                        setDrawMode('brush');
                      }}
                      style={previewStyles.modeChip}>
                      <PenIcon size={14} color="rgba(255,255,255,0.7)" />
                      <Text style={previewStyles.modeChipText}>{t('media.markup', 'Markup')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => {
                        triggerNativeHaptic('light');
                        const defaultBox = getCenteredCropBoxForRatio(
                          'free',
                          activeWidth,
                          activeHeight,
                        );
                        setCropBox(defaultBox);
                        setAspectRatio('free');
                        setActiveTool('crop');
                      }}
                      style={previewStyles.modeChip}>
                      <CropIcon size={14} color="rgba(255,255,255,0.7)" />
                      <Text style={previewStyles.modeChipText}>{t('media.crop', 'Crop')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => {
                        triggerNativeHaptic('light');
                        setActiveTool('adjust');
                      }}
                      style={previewStyles.modeChip}>
                      <SunAdjustIcon size={14} color="rgba(255,255,255,0.7)" />
                      <Text style={previewStyles.modeChipText}>{t('media.adjust', 'Adjust')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => {
                        triggerNativeHaptic('light');
                        setActiveTool('text');
                        showToast(
                          t(
                            'mediaGallery.tapToAddText',
                            'Tap anywhere on the image to add text',
                          ),
                        );
                      }}
                      style={previewStyles.modeChip}>
                      <TypeIcon size={14} color="rgba(255,255,255,0.7)" />
                      <Text style={previewStyles.modeChipText}>{t('media.addText', 'Add Text')}</Text>
                    </TouchableOpacity>
                  </>
                )}
              </ScrollView>
            </View>
          )}

          {/* Dedicated Pro Dark Studio Bottom Toolbar */}
          <View style={previewStyles.studioToolbar}>
            {(isImage ? editorTabs : videoTabs).map(tab => {
              const isActive = activeTool === tab.key;
              return (
                <TouchableScale
                  key={tab.key}
                  onPress={() => {
                    triggerNativeHaptic('light');
                    if (tab.key === 'crop') {
                      const defaultBox = getCenteredCropBoxForRatio(
                        'free',
                        activeWidth,
                        activeHeight,
                      );
                      setCropBox(defaultBox);
                      setAspectRatio('free');
                      setActiveTool('crop');
                    } else if (tab.key === 'text') {
                      setActiveTool('text');
                      showToast(
                        t(
                          'mediaGallery.tapToAddText',
                          'Tap anywhere on the image to add text',
                        ),
                      );
                    } else {
                      setActiveTool(tab.key as EditorTool);
                    }
                  }}
                  style={[
                    previewStyles.studioToolItem,
                    isActive && previewStyles.studioToolItemActive,
                  ]}>
                  {tab.icon(isActive)}
                  <Text
                    style={[
                      previewStyles.studioToolLabel,
                      isActive && previewStyles.studioToolLabelActive,
                    ]}>
                    {tab.label}
                  </Text>
                  {'hasBadge' in tab && (tab as any).hasBadge && (
                    <View style={previewStyles.studioTabBadgeDot} />
                  )}
                </TouchableScale>
              );
            })}
          </View>
        </View>
      </View>
    </View>

      {/* Text Annotation Input Modal */}
      <Modal
        visible={showTextInputModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowTextInputModal(false)}>
        <View style={previewStyles.textModalBackdrop}>
          <View style={previewStyles.textModalCard}>
            <Text style={previewStyles.textModalTitle}>
              Add Text Note / Callout
            </Text>
            <TextInput
              style={previewStyles.textModalInput}
              placeholder={t('media.textPlaceholder', 'e.g. Defect: Button overlap')}
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={inputNoteText}
              onChangeText={setInputNoteText}
              autoFocus={true}
              multiline={true}
            />
            <View style={previewStyles.textModalActions}>
              <TouchableOpacity
                onPress={() => setShowTextInputModal(false)}
                style={previewStyles.modalCancelBtn}>
                <Text style={previewStyles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveTextNote}
                style={previewStyles.modalConfirmBtn}>
                <Text style={previewStyles.modalConfirmText}>{t('media.placeText', 'Place Text')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Confirmation Modal */}
      <ConfirmationModal
        visible={showDeleteConfirm}
        title={t('mediaGallery.deleteTitle', 'Delete Media?')}
        message={t('mediaGallery.deleteMessage', {filename: item.filename})}
        confirmText={t('mediaGallery.delete', 'Delete')}
        cancelText={t('common.cancel', 'Cancel')}
        isDestructive={true}
        icon="trash"
        onConfirm={() => {
          setShowDeleteConfirm(false);
          onDelete(item);
          onClose();
        }}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </Modal>
  );
};

const previewStyles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.70)',
    justifyContent: 'flex-end',
    zIndex: 999999,
    elevation: 999999,
  },
  modalBackdropPressable: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContentCard: {
    backgroundColor: '#070A14',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
    shadowColor: AppColors.black,
    shadowOffset: {width: 0, height: -4},
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 16,
  },
  header: {
    width: '100%',
    zIndex: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255, 255, 255, 0.12)',
  },
  headerInner: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingTop: 6,
    paddingBottom: 8,
    minHeight: 48,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    minWidth: 0,
    marginRight: 6,
  },
  headerTextCol: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    fontFamily: AppFonts.interBold,
    fontSize: 13,
    color: AppColors.white,
    letterSpacing: -0.1,
    flexShrink: 1,
  },
  formatBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  formatBadgeText: {
    fontFamily: AppFonts.interBold,
    fontSize: 8.5,
    color: AppColors.white,
    letterSpacing: 0.4,
  },
  headerSubtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 1,
  },
  subtitleDim: {
    fontFamily: AppFonts.interMedium,
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.85)',
  },
  subtitleDot: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.45)',
  },
  subtitleSize: {
    fontFamily: AppFonts.interBold,
    fontSize: 10,
    color: '#38BDF8',
  },
  headerBackBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  undoRedoGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    height: 30,
    overflow: 'hidden',
  },
  undoHalfBtn: {
    paddingHorizontal: 8,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  redoHalfBtn: {
    paddingHorizontal: 8,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  undoDivider: {
    width: 1,
    height: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  actionDisabled: {
    opacity: 0.35,
  },
  headerMoreBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCloseBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSaveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#059669',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.45)',
    paddingHorizontal: 11,
    height: 30,
  },
  headerSaveText: {
    fontFamily: AppFonts.interBold,
    fontSize: 11,
    color: AppColors.white,
  },
  headerExportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#0284C7',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.5)',
    paddingHorizontal: 10,
    height: 30,
  },
  headerExportText: {
    fontFamily: AppFonts.interBold,
    fontSize: 11,
    color: AppColors.white,
  },
  headerActionBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreMenuDropdown: {
    position: 'absolute',
    top: 52,
    right: 12,
    backgroundColor: '#0F172A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    padding: 6,
    zIndex: 100,
    elevation: 12,
    shadowColor: AppColors.black,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.5,
    shadowRadius: 8,
    minWidth: 160,
  },
  moreMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  moreMenuItemDestructive: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    marginTop: 4,
    paddingTop: 8,
  },
  moreMenuItemText: {
    fontFamily: AppFonts.interMedium,
    fontSize: 12,
    color: AppColors.white,
  },
  stageWrapper: {
    flex: 1,
    width: '100%',
    backgroundColor: '#03050A',
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 4,
    minHeight: 0,
  },
  previewCard: {
    flex: 1,
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#03050A',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  canvasContainer: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  imageCanvasWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  instagramGridOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.45)',
    zIndex: 15,
  },
  instagramGridHLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    shadowColor: '#000000',
    shadowOpacity: 0.6,
    shadowRadius: 1,
    shadowOffset: {width: 0, height: 0.5},
  },
  instagramGridVLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    shadowColor: '#000000',
    shadowOpacity: 0.6,
    shadowRadius: 1,
    shadowOffset: {width: 0.5, height: 0},
  },
  image: {
    width: '100%',
    height: '100%',
  },
  stageTopLeftBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(10, 15, 29, 0.88)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    zIndex: 20,
  },
  badgeGlowDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#38BDF8',
    shadowColor: '#38BDF8',
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.9,
    shadowRadius: 4,
  },
  badgeGlowText: {
    fontFamily: AppFonts.interSemiBold,
    fontSize: 10.5,
    color: 'rgba(255, 255, 255, 0.92)',
  },
  holdCompareBtn: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(10, 15, 29, 0.90)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    shadowColor: AppColors.black,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 20,
  },
  holdCompareBtnPressed: {
    backgroundColor: AppColors.indigo600,
    borderColor: AppColors.indigo400,
  },
  holdCompareText: {
    fontFamily: AppFonts.interSemiBold,
    fontSize: 11,
    color: AppColors.white,
  },
  floatingZoomBar: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    backgroundColor: 'rgba(10, 15, 29, 0.92)',
    borderRadius: 22,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    paddingVertical: 5,
    paddingHorizontal: 5,
    alignItems: 'center',
    gap: 4,
    shadowColor: AppColors.black,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 12,
    zIndex: 35,
  },
  zoomBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomLevelBadge: {
    paddingHorizontal: 4,
    paddingVertical: 3,
  },
  zoomLevelText: {
    fontFamily: AppFonts.interBold,
    fontSize: 9.5,
    color: '#38BDF8',
    letterSpacing: 0.2,
  },
  videoImageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 13, 20, 0.28)',
  },
  videoFallbackBackdrop: {
    flex: 1,
    width: '100%',
    backgroundColor: AppColors.slate900,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  videoFallbackGlow: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
  },
  videoFallbackTitle: {
    fontFamily: AppFonts.interSemiBold,
    fontSize: 15,
    color: AppColors.white,
    marginTop: 12,
  },
  videoFallbackSubtitle: {
    fontFamily: AppFonts.interRegular,
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 4,
  },
  modernCenterPlayBtn: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(15, 23, 42, 0.78)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: AppColors.black,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 12,
    zIndex: 25,
  },
  videoFloatingHud: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    backgroundColor: 'rgba(10, 15, 29, 0.88)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 10,
    shadowColor: AppColors.black,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 6,
    zIndex: 20,
  },
  videoHudProgressBar: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 2,
    position: 'relative',
    overflow: 'hidden',
  },
  videoHudProgressFill: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    backgroundColor: '#38BDF8',
    borderRadius: 2,
  },
  videoHudTimeText: {
    fontFamily: AppFonts.interBold,
    fontSize: 10.5,
    color: AppColors.white,
    letterSpacing: 0.2,
  },
  videoHudBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 6,
  },
  videoHudBadgeText: {
    fontFamily: AppFonts.interBold,
    fontSize: 9,
    color: '#C084FC',
  },
  filmstripScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 2,
  },
  filmstripThumbItem: {
    width: 48,
    height: 48,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#0F172A',
  },
  filmstripThumbActive: {
    borderColor: '#38BDF8',
    borderWidth: 2,
    transform: [{scale: 1.05}],
  },
  filmstripThumbImg: {
    width: '100%',
    height: '100%',
  },
  filmstripThumbTime: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: 3,
    paddingVertical: 1,
    borderRadius: 3,
    fontFamily: AppFonts.interBold,
    fontSize: 7.5,
    color: AppColors.white,
  },
  bottomControlsContainer: {
    width: '100%',
    backgroundColor: '#070A14',
    paddingHorizontal: 8,
    paddingTop: 6,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    gap: 6,
  },
  contextToolPanel: {
    width: '100%',
    backgroundColor: 'rgba(10, 15, 29, 0.96)',
    borderRadius: 16,
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    gap: 8,
  },
  panelHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  panelHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  panelGlowDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#818CF8',
    shadowColor: '#818CF8',
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.9,
    shadowRadius: 4,
  },
  panelHeaderTitle: {
    fontFamily: AppFonts.interBold,
    fontSize: 11,
    color: AppColors.white,
    letterSpacing: 0.6,
  },
  panelValueBadge: {
    backgroundColor: 'rgba(2, 132, 199, 0.22)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.45)',
  },
  panelValueText: {
    fontFamily: AppFonts.interBold,
    fontSize: 10.5,
    color: '#38BDF8',
  },
  sliderRowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    gap: 8,
    paddingHorizontal: 2,
  },
  sliderMinIndicator: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  sliderMaxIndicator: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.85)',
  },
  sliderTrackTouchable: {
    flex: 1,
    height: 36,
    justifyContent: 'center',
  },
  sliderTrackBg: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    borderRadius: 2,
    position: 'relative',
    justifyContent: 'center',
  },
  sliderFillTrack: {
    height: 4,
    backgroundColor: '#0284C7',
    borderRadius: 2,
  },
  sliderThumbHandle: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#38BDF8',
    marginLeft: -10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#38BDF8',
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.9,
    shadowRadius: 6,
    elevation: 6,
  },
  sliderThumbInnerGlow: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: AppColors.white,
  },
  modeChipsScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 2,
  },
  modeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  modeChipActive: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: 'rgba(2, 132, 199, 0.28)',
    borderColor: '#38BDF8',
    borderWidth: 1.2,
  },
  modeChipText: {
    fontFamily: AppFonts.interSemiBold,
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.75)',
  },
  modeChipTextActive: {
    color: AppColors.white,
    fontFamily: AppFonts.interBold,
    fontSize: 11,
  },
  modeChipIconText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
    marginRight: 1,
  },
  subDivider: {
    width: 1,
    height: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    marginHorizontal: 4,
  },
  colorDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  colorDotActive: {
    borderColor: AppColors.white,
    transform: [{scale: 1.25}],
  },
  actionPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
  },
  actionPillText: {
    fontFamily: AppFonts.interSemiBold,
    fontSize: 10.5,
    color: AppColors.white,
  },
  applyActionBtn: {
    backgroundColor: AppColors.emerald600,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 10,
  },
  applyActionText: {
    fontFamily: AppFonts.interBold,
    fontSize: 11.5,
    color: AppColors.white,
  },
  cancelActionBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  cancelActionText: {
    fontFamily: AppFonts.interSemiBold,
    fontSize: 11.5,
    color: 'rgba(255, 255, 255, 0.85)',
  },
  studioToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(15, 20, 36, 0.95)',
    borderRadius: 16,
    paddingVertical: 4,
    paddingHorizontal: 5,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 4,
  },
  studioToolItem: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingVertical: 7,
    paddingHorizontal: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
    position: 'relative',
  },
  studioToolItemActive: {
    backgroundColor: 'rgba(2, 132, 199, 0.22)',
    borderColor: '#38BDF8',
    borderWidth: 1.2,
  },
  studioToolLabel: {
    fontFamily: AppFonts.interSemiBold,
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.60)',
    letterSpacing: 0.1,
  },
  studioToolLabelActive: {
    color: '#38BDF8',
    fontFamily: AppFonts.interBold,
  },
  studioTabBadgeDot: {
    position: 'absolute',
    top: 6,
    right: 12,
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#C084FC',
  },
  textAnnotationPill: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    shadowColor: AppColors.black,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  textAnnotationText: {
    fontFamily: AppFonts.interBold,
    fontSize: 11,
  },
  textDeleteBtn: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cropOverlayMask: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
    elevation: 100,
  },
  cropDimMask: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.58)',
  },
  cropBoxFrame: {
    position: 'absolute',
    borderWidth: 2,
    borderStyle: 'solid',
    borderColor: '#FFFFFF',
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    shadowColor: AppColors.black,
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.9,
    shadowRadius: 5,
    elevation: 10,
  },
  cropGridH: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
  },
  cropGridV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
  },
  cropCornerBracket: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: '#FFFFFF',
    shadowColor: AppColors.black,
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.8,
    shadowRadius: 3,
    elevation: 6,
  },
  bracketTL: {
    top: -3,
    left: -3,
    borderTopWidth: 4,
    borderLeftWidth: 4,
  },
  bracketTR: {
    top: -3,
    right: -3,
    borderTopWidth: 4,
    borderRightWidth: 4,
  },
  bracketBL: {
    bottom: -3,
    left: -3,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
  },
  bracketBR: {
    bottom: -3,
    right: -3,
    borderBottomWidth: 4,
    borderRightWidth: 4,
  },
  cropEdgeBarTop: {
    position: 'absolute',
    top: -3,
    left: '50%',
    marginLeft: -18,
    width: 36,
    height: 5,
    backgroundColor: '#FFFFFF',
    borderRadius: 2.5,
  },
  cropEdgeBarBottom: {
    position: 'absolute',
    bottom: -3,
    left: '50%',
    marginLeft: -18,
    width: 36,
    height: 5,
    backgroundColor: '#FFFFFF',
    borderRadius: 2.5,
  },
  cropEdgeBarLeft: {
    position: 'absolute',
    left: -3,
    top: '50%',
    marginTop: -18,
    width: 5,
    height: 36,
    backgroundColor: '#FFFFFF',
    borderRadius: 2.5,
  },
  cropEdgeBarRight: {
    position: 'absolute',
    right: -3,
    top: '50%',
    marginTop: -18,
    width: 5,
    height: 36,
    backgroundColor: '#FFFFFF',
    borderRadius: 2.5,
  },
  cropHandleTouchArea: {
    position: 'absolute',
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 30,
  },
  handleAreaTL: {top: -22, left: -22},
  handleAreaTR: {top: -22, right: -22},
  handleAreaBL: {bottom: -22, left: -22},
  handleAreaBR: {bottom: -22, right: -22},
  cropEdgeTouchAreaTop: {
    position: 'absolute',
    top: -20,
    left: '25%',
    right: '25%',
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 25,
  },
  cropEdgeTouchAreaBottom: {
    position: 'absolute',
    bottom: -20,
    left: '25%',
    right: '25%',
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 25,
  },
  cropEdgeTouchAreaLeft: {
    position: 'absolute',
    left: -20,
    top: '25%',
    bottom: '25%',
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 25,
  },
  cropEdgeTouchAreaRight: {
    position: 'absolute',
    right: -20,
    top: '25%',
    bottom: '25%',
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 25,
  },
  cropCancelBtn: {
    position: 'absolute',
    top: 14,
    left: 14,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#DC2626',
    borderWidth: 2,
    borderColor: AppColors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: AppColors.black,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 16,
    zIndex: 200,
  },
  cropConfirmBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: AppColors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: AppColors.black,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 16,
    zIndex: 200,
  },
  textModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.70)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  textModalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#0F172A',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    padding: 16,
    gap: 12,
  },
  textModalTitle: {
    fontFamily: AppFonts.interBold,
    fontSize: 14,
    color: AppColors.white,
  },
  textModalInput: {
    minHeight: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    padding: 12,
    fontFamily: AppFonts.interRegular,
    fontSize: 13,
    color: AppColors.white,
    textAlignVertical: 'top',
  },
  textModalActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
  },
  modalCancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalCancelText: {
    fontFamily: AppFonts.interSemiBold,
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  modalConfirmBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: AppColors.indigo600,
  },
  modalConfirmText: {
    fontFamily: AppFonts.interBold,
    fontSize: 12,
    color: AppColors.white,
  },
  watermarkOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(3, 7, 18, 0.85)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  watermarkText: {
    fontFamily: AppFonts.interBold,
    fontSize: 9.5,
    color: '#38BDF8',
    letterSpacing: 0.2,
  },
  watermarkTime: {
    fontFamily: AppFonts.interSemiBold,
    fontSize: 9.5,
    color: '#94A3B8',
  },
  moreMenuItemIconText: {
    fontSize: 14,
  },
});
