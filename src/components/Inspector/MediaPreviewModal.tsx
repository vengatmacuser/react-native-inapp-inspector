import React, {useCallback, useMemo, useRef, useState} from 'react';
import {
  Animated,
  Dimensions,
  Image,
  Modal,
  PanResponder,
  Platform,
  SafeAreaView,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Svg, {
  Circle,
  Ellipse,
  G,
  Line,
  Path,
  Rect,
} from 'react-native-svg';
import {AppColors} from '../../styles/AppColors';
import {AppFonts} from '../../styles/AppFonts';
import TouchableScale from '../TouchableScale';
import {ConfirmationModal} from './ConfirmationModal';
import {
  AspectRatioIcon,
  BlurIcon,
  CircleIconOutline,
  CloseWhite,
  CopyIcon,
  CropIcon,
  EllipseIconOutline,
  FilmIcon,
  GifIcon,
  ImageIcon,
  PenIcon,
  PlayIcon,
  RectangleIcon,
  RedactIcon,
  ResizeIcon,
  RotateIcon,
  ScissorsIcon,
  ShapesIcon,
  ShareIcon,
  TrashIcon,
  TypeIcon,
  UndoIcon,
  VolumeXIcon,
  ZoomInIcon,
  ZoomOutIcon,
} from '../NetworkIcons';
import {CapturedMediaItem, ScreenCapture} from '../../capture';
import {MediaEditor} from '../../editor';
import {copyImageOrMediaToClipboard, formatBytes} from '../../helpers';
import {showToast} from '../../helpers/toast';
import {useTranslation} from '../../i18n';
import {triggerNativeHaptic} from '../../native/NativeInspector';

export type EditorTool =
  | 'none'
  | 'crop'
  | 'resize'
  | 'draw'
  | 'shapes'
  | 'text'
  | 'blur';

export type ShapeType = 'rect' | 'circle' | 'ellipse';

export type AspectRatioOption =
  | 'free'
  | '1:1'
  | '4:3'
  | '16:9'
  | '9:16'
  | '3:2';

export interface InkStroke {
  id: string;
  points: Array<{x: number; y: number}>;
  color: string;
  strokeWidth: number;
}

export interface ShapeItem {
  id: string;
  type: ShapeType;
  x: number; // percentage 0.0 - 1.0
  y: number; // percentage 0.0 - 1.0
  width: number; // percentage 0.0 - 1.0
  height: number; // percentage 0.0 - 1.0
  color: string;
}

export interface TextItem {
  id: string;
  text: string;
  x: number; // percentage 0.0 - 1.0
  y: number; // percentage 0.0 - 1.0
  color: string;
  bgColor: string;
}

export interface BlurBox {
  id: string;
  x: number; // percentage 0.0 - 1.0
  y: number; // percentage 0.0 - 1.0
  width: number; // percentage 0.0 - 1.0
  height: number; // percentage 0.0 - 1.0
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

export const MediaPreviewModal: React.FC<MediaPreviewModalProps> = ({
  item,
  visible,
  onClose,
  onDelete,
  onConvertToGif,
}) => {
  const {t} = useTranslation();

  // Basic modal & conversion state
  const [isConverting, setIsConverting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentUri, setCurrentUri] = useState<string | null>(null);
  const [currentWidth, setCurrentWidth] = useState<number | undefined>(item?.width);
  const [currentHeight, setCurrentHeight] = useState<number | undefined>(item?.height);
  const [currentSizeBytes, setCurrentSizeBytes] = useState<number | undefined>(item?.sizeBytes);
  const [currentDurationMs, setCurrentDurationMs] = useState<number | undefined>(item?.durationMs);
  const [imageError, setImageError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Editor mode & transformation states
  const [activeTool, setActiveTool] = useState<EditorTool>('none');
  const [zoomLevel, setZoomLevel] = useState(1.0);
  const [rotationAngle, setRotationAngle] = useState(0);

  // Crop & Aspect Ratio
  const [aspectRatio, setAspectRatio] = useState<AspectRatioOption>('free');
  const [cropBox, setCropBox] = useState({
    x: 0.1,
    y: 0.15,
    width: 0.8,
    height: 0.7,
  });

  // Free Ink Drawing
  const [selectedColor, setSelectedColor] = useState('#EF4444');
  const [selectedStrokeWidth, setSelectedStrokeWidth] = useState(4);
  const [inkPaths, setInkPaths] = useState<InkStroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<Array<{x: number; y: number}> | null>(null);

  // Shapes
  const [selectedShapeType, setSelectedShapeType] = useState<ShapeType>('rect');
  const [shapes, setShapes] = useState<ShapeItem[]>([]);

  // Text Annotations
  const [texts, setTexts] = useState<TextItem[]>([]);
  const [showTextInputModal, setShowTextInputModal] = useState(false);
  const [editingTextItem, setEditingTextItem] = useState<TextItem | null>(null);
  const [inputNoteText, setInputNoteText] = useState('');

  // Blur Redactions
  const [blurBoxes, setBlurBoxes] = useState<BlurBox[]>([]);

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
  const selectedColorRef = useRef(selectedColor);
  selectedColorRef.current = selectedColor;
  const selectedStrokeWidthRef = useRef(selectedStrokeWidth);
  selectedStrokeWidthRef.current = selectedStrokeWidth;
  const cropBoxRef = useRef(cropBox);
  cropBoxRef.current = cropBox;
  const canvasLayoutRef = useRef(canvasLayout);
  canvasLayoutRef.current = canvasLayout;

  // Freehand Ink Drawing Responder
  const inkPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => activeToolRef.current === 'draw',
      onMoveShouldSetPanResponder: () => activeToolRef.current === 'draw',
      onPanResponderGrant: evt => {
        const {locationX, locationY} = evt.nativeEvent;
        setCurrentStroke([{x: locationX, y: locationY}]);
      },
      onPanResponderMove: evt => {
        const {locationX, locationY} = evt.nativeEvent;
        setCurrentStroke(prev =>
          prev ? [...prev, {x: locationX, y: locationY}] : [{x: locationX, y: locationY}],
        );
      },
      onPanResponderRelease: () => {
        setCurrentStroke(pts => {
          if (pts && pts.length > 1) {
            setInkPaths(prev => [
              ...prev,
              {
                id: `stroke_${Date.now()}_${Math.random()}`,
                points: pts,
                color: selectedColorRef.current,
                strokeWidth: selectedStrokeWidthRef.current,
              },
            ]);
          }
          return null;
        });
      },
    }),
  ).current;

  // Unified Crop PanResponder with Inside-Drag + Drag-to-Draw + 8-Handle Resizing
  type CropDragMode =
    | 'none'
    | 'tl'
    | 'tr'
    | 'bl'
    | 'br'
    | 'top'
    | 'bottom'
    | 'left'
    | 'right'
    | 'center'
    | 'new';

  const cropDragStateRef = useRef<{
    mode: CropDragMode;
    startX: number;
    startY: number;
    origBox: {x: number; y: number; width: number; height: number};
  }>({
    mode: 'none',
    startX: 0,
    startY: 0,
    origBox: {x: 0.08, y: 0.1, width: 0.84, height: 0.75},
  });

  const cropPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => activeToolRef.current === 'crop',
      onStartShouldSetPanResponderCapture: () => activeToolRef.current === 'crop',
      onMoveShouldSetPanResponder: () => activeToolRef.current === 'crop',
      onMoveShouldSetPanResponderCapture: () => activeToolRef.current === 'crop',
      onPanResponderTerminationRequest: () => false,
      onShouldBlockNativeResponder: () => true,
      onPanResponderGrant: evt => {
        const layout = canvasLayoutRef.current;
        const W = layout.width > 50 ? layout.width : Dimensions.get('window').width - 16;
        const H = layout.height > 50 ? layout.height : Dimensions.get('window').height * 0.72;

        const {locationX, locationY} = evt.nativeEvent;
        const tX = Math.max(0, Math.min(1, locationX / W));
        const tY = Math.max(0, Math.min(1, locationY / H));

        const box = cropBoxRef.current;
        const x1 = box.x;
        const y1 = box.y;
        const x2 = box.x + box.width;
        const y2 = box.y + box.height;

        const Rx = Math.max(0.08, 40 / W);
        const Ry = Math.max(0.08, 40 / H);

        let mode: CropDragMode = 'none';

        // 1. Check 4 Corners
        if (Math.abs(tX - x1) <= Rx && Math.abs(tY - y1) <= Ry) {
          mode = 'tl';
        } else if (Math.abs(tX - x2) <= Rx && Math.abs(tY - y1) <= Ry) {
          mode = 'tr';
        } else if (Math.abs(tX - x1) <= Rx && Math.abs(tY - y2) <= Ry) {
          mode = 'bl';
        } else if (Math.abs(tX - x2) <= Rx && Math.abs(tY - y2) <= Ry) {
          mode = 'br';
        }
        // 2. Check 4 Edges
        else if (Math.abs(tY - y1) <= Ry && tX >= x1 && tX <= x2) {
          mode = 'top';
        } else if (Math.abs(tY - y2) <= Ry && tX >= x1 && tX <= x2) {
          mode = 'bottom';
        } else if (Math.abs(tX - x1) <= Rx && tY >= y1 && tY <= y2) {
          mode = 'left';
        } else if (Math.abs(tX - x2) <= Rx && tY >= y1 && tY <= y2) {
          mode = 'right';
        }
        // 3. Inside crop box -> move the entire frame
        else if (tX >= x1 && tX <= x2 && tY >= y1 && tY <= y2) {
          mode = 'center';
        }
        // 4. Outside crop box -> drag and drop to free select new box
        else {
          mode = 'new';
        }

        cropDragStateRef.current = {
          mode,
          startX: tX,
          startY: tY,
          origBox: {...box},
        };
      },
      onPanResponderMove: (_evt, gesture) => {
        const layout = canvasLayoutRef.current;
        const W = layout.width > 0 ? layout.width : Dimensions.get('window').width - 16;
        const H = layout.height > 0 ? layout.height : Dimensions.get('window').height * 0.7;
        if (!W || !H) return;

        const dX = gesture.dx / W;
        const dY = gesture.dy / H;
        const {mode, startX, startY, origBox} = cropDragStateRef.current;
        const {x: sX, y: sY, width: sW, height: sH} = origBox;

        if (mode === 'center') {
          // Inside drag: move entire box with boundaries
          const newX = Math.max(0, Math.min(1 - sW, sX + dX));
          const newY = Math.max(0, Math.min(1 - sH, sY + dY));
          setCropBox(prev => ({...prev, x: newX, y: newY}));
        } else if (mode === 'new') {
          // Free drag and drop selection: draw rectangle from finger start
          const curX = Math.max(0, Math.min(1, startX + dX));
          const curY = Math.max(0, Math.min(1, startY + dY));
          const minX = Math.min(startX, curX);
          const minY = Math.min(startY, curY);
          const boxW = Math.max(0.04, Math.abs(curX - startX));
          const boxH = Math.max(0.04, Math.abs(curY - startY));
          setCropBox({x: minX, y: minY, width: boxW, height: boxH});
        } else if (mode === 'tl') {
          const newX = Math.max(0, Math.min(sX + sW - 0.04, sX + dX));
          const newY = Math.max(0, Math.min(sY + sH - 0.04, sY + dY));
          setCropBox({x: newX, y: newY, width: sW - (newX - sX), height: sH - (newY - sY)});
        } else if (mode === 'tr') {
          const newY = Math.max(0, Math.min(sY + sH - 0.04, sY + dY));
          const newW = Math.max(0.04, Math.min(1 - sX, sW + dX));
          setCropBox({x: sX, y: newY, width: newW, height: sH - (newY - sY)});
        } else if (mode === 'bl') {
          const newX = Math.max(0, Math.min(sX + sW - 0.04, sX + dX));
          const newH = Math.max(0.04, Math.min(1 - sY, sH + dY));
          setCropBox({x: newX, y: sY, width: sW - (newX - sX), height: newH});
        } else if (mode === 'br') {
          const newW = Math.max(0.04, Math.min(1 - sX, sW + dX));
          const newH = Math.max(0.04, Math.min(1 - sY, sH + dY));
          setCropBox({x: sX, y: sY, width: newW, height: newH});
        } else if (mode === 'top') {
          const newY = Math.max(0, Math.min(sY + sH - 0.04, sY + dY));
          setCropBox({x: sX, y: newY, width: sW, height: sH - (newY - sY)});
        } else if (mode === 'bottom') {
          const newH = Math.max(0.04, Math.min(1 - sY, sH + dY));
          setCropBox({x: sX, y: sY, width: sW, height: newH});
        } else if (mode === 'left') {
          const newX = Math.max(0, Math.min(sX + sW - 0.04, sX + dX));
          setCropBox({x: newX, y: sY, width: sW - (newX - sX), height: sH});
        } else if (mode === 'right') {
          const newW = Math.max(0.04, Math.min(1 - sX, sW + dX));
          setCropBox({x: sX, y: sY, width: newW, height: sH});
        }
      },
      onPanResponderRelease: () => {
        cropDragStateRef.current.mode = 'none';
      },
      onPanResponderTerminate: () => {
        cropDragStateRef.current.mode = 'none';
      },
    }),
  ).current;

  // Reset state on new item
  React.useEffect(() => {
    if (item?.uri) {
      setCurrentUri(item.uri);
      setCurrentWidth(item.width);
      setCurrentHeight(item.height);
      setCurrentSizeBytes(item.sizeBytes);
      setCurrentDurationMs(item.durationMs);
      setImageError(false);
      setRotationAngle(0);
      setZoomLevel(1.0);
      setActiveTool('none');
      setInkPaths([]);
      setCurrentStroke(null);
      setShapes([]);
      setTexts([]);
      setBlurBoxes([]);
      setCropBox({x: 0.08, y: 0.1, width: 0.84, height: 0.75});
    }
  }, [item?.uri, item?.width, item?.height, item?.sizeBytes, item?.durationMs]);

  if (!item || !visible) return null;

  const activeUri = currentUri || item.uri;
  const activeWidth = currentWidth ?? item.width;
  const activeHeight = currentHeight ?? item.height;
  const activeSizeBytes = currentSizeBytes ?? item.sizeBytes;
  const activeDurationMs = currentDurationMs ?? item.durationMs;

  const isVideo = item.type === 'video';
  const isGif = item.type === 'gif';
  const isImage = item.type === 'image';

  // Compute rotation scale factor so 90/270 degree rotations never get clipped
  const isRotated90 = rotationAngle === 90 || rotationAngle === 270;
  const rotationFitScale = isRotated90
    ? activeWidth && activeHeight
      ? Math.min(activeHeight / activeWidth, activeWidth / activeHeight, 0.75)
      : 0.72
    : 1.0;

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
  };

  // Rotation handler with 90° increments
  const handleRotateImage = async () => {
    if (!activeUri || !isImage) return;
    triggerNativeHaptic('light');
    const nextAngle = (rotationAngle + 90) % 360;
    setRotationAngle(nextAngle);
    showToast(t('mediaGallery.rotatedSuccess', `Rotated ${nextAngle}°`));

    if (isEditing) return;
    setIsEditing(true);
    try {
      const res = await MediaEditor.editPhoto({
        uri: activeUri,
        rotation: 90,
      });
      if (res?.uri) {
        setCurrentUri(res.uri);
        if (res.width) setCurrentWidth(res.width);
        if (res.height) setCurrentHeight(res.height);
        if (res.size) setCurrentSizeBytes(res.size);
      }
    } catch {
      // Rotation visual transform stays active
    } finally {
      setIsEditing(false);
    }
  };

  // Undo last drawing stroke
  const handleUndoStroke = () => {
    triggerNativeHaptic('light');
    setInkPaths(prev => prev.slice(0, -1));
  };

  // Clear all drawing strokes
  const handleClearStrokes = () => {
    triggerNativeHaptic('medium');
    setInkPaths([]);
  };

  // Aspect ratio crop selector
  const handleSelectAspectRatio = (ratio: AspectRatioOption) => {
    triggerNativeHaptic('light');
    setActiveTool('crop');
    setAspectRatio(ratio);
    if (ratio === '1:1') {
      setCropBox({x: 0.15, y: 0.2, width: 0.7, height: 0.7});
    } else if (ratio === '4:3') {
      setCropBox({x: 0.1, y: 0.2, width: 0.8, height: 0.6});
    } else if (ratio === '16:9') {
      setCropBox({x: 0.05, y: 0.25, width: 0.9, height: 0.506});
    } else if (ratio === '9:16') {
      setCropBox({x: 0.25, y: 0.1, width: 0.5, height: 0.888});
    } else if (ratio === '3:2') {
      setCropBox({x: 0.1, y: 0.2, width: 0.8, height: 0.533});
    } else {
      setCropBox({x: 0.08, y: 0.1, width: 0.84, height: 0.75});
    }
  };

  // Apply Free Crop
  const handleApplyCrop = async () => {
    if (!activeUri || !isImage) return;
    triggerNativeHaptic('medium');
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
        showToast(t('mediaGallery.croppedSuccess', 'Image Cropped'));
        setActiveTool('none');
      }
    } catch {
      showToast(t('mediaGallery.cropFailed', 'Crop failed'));
    } finally {
      setIsEditing(false);
    }
  };

  // Add a shape annotation
  const handleAddShape = (type: ShapeType) => {
    triggerNativeHaptic('light');
    setSelectedShapeType(type);
    const newShape: ShapeItem = {
      id: `shape_${Date.now()}`,
      type,
      x: 0.25,
      y: 0.35,
      width: type === 'circle' ? 0.4 : 0.5,
      height: type === 'circle' ? 0.4 : 0.25,
      color: selectedColor,
    };
    setShapes(prev => [...prev, newShape]);
    showToast(t('mediaGallery.shapeAdded', `${type.toUpperCase()} Added`));
  };

  // Add Blur box
  const handleAddBlurBox = () => {
    triggerNativeHaptic('light');
    const newBlur: BlurBox = {
      id: `blur_${Date.now()}`,
      x: 0.12,
      y: 0.35,
      width: 0.76,
      height: 0.12,
    };
    setBlurBoxes(prev => [...prev, newBlur]);
    showToast(t('mediaGallery.blurAdded', 'Blur Mask Added'));
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

  const handleSaveTextNote = () => {
    if (!inputNoteText.trim()) {
      setShowTextInputModal(false);
      return;
    }
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
        x: 0.2,
        y: 0.4,
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
        showToast(t('mediaGallery.resizedSuccess', `Resized to ${Math.round(scale * 100)}% (${newW}×${newH})`));
        setActiveTool('none');
      }
    } catch {
      showToast(t('mediaGallery.resizeFailed', 'Resize failed'));
    } finally {
      setIsEditing(false);
    }
  };

  // Top header actions
  const handleCopyUri = () => {
    if (!activeUri) return;
    triggerNativeHaptic('light');
    copyImageOrMediaToClipboard(
      activeUri,
      isImage ? 'Image' : 'Media',
    );
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
          t('mediaGallery.shareUnavailable', 'Sharing not available on this device'),
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

  const durationSec = activeDurationMs ? (activeDurationMs / 1000).toFixed(1) : null;
  const formattedDuration = durationSec
    ? `00:${Number(durationSec) < 10 ? '0' : ''}${durationSec}`
    : null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      statusBarTranslucent={true}
      onRequestClose={onClose}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />
      <View style={previewStyles.overlay}>
        {/* Top Header Bar with LinearGradient */}
        <View style={previewStyles.header}>
          <LinearGradient
            colors={[AppColors.indigo600, AppColors.violet600]}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
          <View style={previewStyles.headerInner}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleCopyUri}
              style={previewStyles.headerLeft}>
              <View style={previewStyles.badge}>
                {isVideo ? (
                  <FilmIcon size={11} color={AppColors.white} />
                ) : isGif ? (
                  <GifIcon size={11} color={AppColors.white} />
                ) : (
                  <ImageIcon size={11} color={AppColors.white} />
                )}
                <Text style={previewStyles.badgeText}>
                  {(item.format || (isVideo ? 'mp4' : isGif ? 'gif' : 'png')).toUpperCase()}
                </Text>
              </View>
              <View style={previewStyles.headerTextCol}>
                <Text style={previewStyles.title} numberOfLines={1}>
                  {item.filename || (item.uri ? item.uri.split('/').pop() : '') || 'Capture'}
                </Text>
                <Text style={previewStyles.subtitle} numberOfLines={1}>
                  {formatBytes(activeSizeBytes || 0)}
                  {item.timestamp
                    ? ` • ${new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit', second: '2-digit'})}`
                    : ''}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Top Actions: GIF Convert, Copy, Share, Delete, Close */}
            <View style={previewStyles.headerRight}>
              {isVideo && onConvertToGif && (
                <TouchableScale
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel={t('mediaGallery.convertToGif', 'Convert to GIF')}
                  onPress={handleConvert}
                  disabled={isConverting}
                  style={[previewStyles.headerActionBtn, {backgroundColor: `${AppColors.warningAmber}33`, borderColor: `${AppColors.warningAmber}66`}]}
                  hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
                  <GifIcon size={13} color={AppColors.warningAmber} />
                </TouchableScale>
              )}

              <TouchableScale
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={t('mediaGallery.copyUri', 'Copy URI')}
                onPress={handleCopyUri}
                style={previewStyles.headerActionBtn}
                hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
                <CopyIcon size={13} color={AppColors.white} />
              </TouchableScale>

              <TouchableScale
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={t('mediaGallery.share', 'Share')}
                onPress={handleShare}
                style={previewStyles.headerActionBtn}
                hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
                <ShareIcon size={13} color={AppColors.white} />
              </TouchableScale>

              <TouchableScale
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={t('mediaGallery.delete', 'Delete')}
                onPress={handleDelete}
                style={previewStyles.headerDeleteBtn}
                hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
                <TrashIcon size={13} color={AppColors.white} />
              </TouchableScale>

              <TouchableOpacity
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={t('common.close', 'Close')}
                onPress={onClose}
                style={previewStyles.headerCloseBtn}
                hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
                <CloseWhite size={12} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Media Preview Stage */}
        <SafeAreaView style={previewStyles.stageSafe}>
          <View style={previewStyles.stage}>
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
                      {item.width && item.height ? `${item.width} × ${item.height}` : 'HD Video Recording'}
                    </Text>
                    <Text style={previewStyles.videoFallbackSubtitle}>
                      {durationSec ? `${durationSec}s duration` : 'MP4 Video'} • {formatBytes(item.sizeBytes)}
                    </Text>
                  </View>
                )
              ) : (
                /* Interactive Canvas Container with Rotation Fit & Zoom */
                <View
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
                        {scale: zoomLevel * rotationFitScale},
                        {rotate: `${rotationAngle}deg`},
                      ],
                    },
                  ]}
                  {...(activeTool === 'draw' ? inkPanResponder.panHandlers : {})}>
                  <Image
                    key={activeUri}
                    source={{uri: activeUri}}
                    style={previewStyles.image}
                    resizeMode="contain"
                    onError={() => setImageError(true)}
                  />

                  {/* Freehand SVG Ink Stroke Layer */}
                  <Svg
                    style={StyleSheet.absoluteFill}
                    pointerEvents={activeTool === 'draw' ? 'auto' : 'none'}>
                    <G>
                      {inkPaths.map(stroke => {
                        if (stroke.points.length < 2) return null;
                        const d = stroke.points.reduce((acc, pt, idx) => {
                          return idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
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
                      })}
                      {currentStroke && currentStroke.length > 1 && (
                        <Path
                          d={currentStroke.reduce((acc, pt, idx) => {
                            return idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
                          }, '')}
                          stroke={selectedColor}
                          strokeWidth={selectedStrokeWidth}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          fill="none"
                        />
                      )}
                    </G>
                  </Svg>

                  {/* Shapes Layer (Rectangles, Circles, Ellipses) */}
                  {shapes.map(shape => (
                    <View
                      key={shape.id}
                      style={[
                        previewStyles.shapeItem,
                        {
                          left: `${shape.x * 100}%`,
                          top: `${shape.y * 100}%`,
                          width: `${shape.width * 100}%`,
                          height: `${shape.height * 100}%`,
                          borderColor: shape.color,
                          borderRadius:
                            shape.type === 'circle'
                              ? 999
                              : shape.type === 'ellipse'
                              ? 36
                              : 8,
                        },
                      ]}>
                      <TouchableOpacity
                        style={previewStyles.shapeDeleteBadge}
                        onPress={() => {
                          triggerNativeHaptic('light');
                          setShapes(prev => prev.filter(s => s.id !== shape.id));
                        }}>
                        <CloseWhite size={8} />
                      </TouchableOpacity>
                    </View>
                  ))}

                  {/* Blur Privacy Masks */}
                  {blurBoxes.map(blur => (
                    <View
                      key={blur.id}
                      style={[
                        previewStyles.blurItem,
                        {
                          left: `${blur.x * 100}%`,
                          top: `${blur.y * 100}%`,
                          width: `${blur.width * 100}%`,
                          height: `${blur.height * 100}%`,
                        },
                      ]}>
                      <Text style={previewStyles.blurItemText}>PRIVACY MASK</Text>
                      <TouchableOpacity
                        style={previewStyles.shapeDeleteBadge}
                        onPress={() => {
                          triggerNativeHaptic('light');
                          setBlurBoxes(prev => prev.filter(b => b.id !== blur.id));
                        }}>
                        <CloseWhite size={8} />
                      </TouchableOpacity>
                    </View>
                  ))}

                  {/* Text Annotation Stickers */}
                  {texts.map(textItem => (
                    <TouchableOpacity
                      key={textItem.id}
                      activeOpacity={0.85}
                      onPress={() => handleOpenTextModal(textItem)}
                      style={[
                        previewStyles.textAnnotationPill,
                        {
                          left: `${textItem.x * 100}%`,
                          top: `${textItem.y * 100}%`,
                          backgroundColor: textItem.bgColor,
                        },
                      ]}>
                      <Text style={[previewStyles.textAnnotationText, {color: textItem.color}]}>
                        {textItem.text}
                      </Text>
                      <TouchableOpacity
                        style={previewStyles.textDeleteBtn}
                        onPress={() => {
                          triggerNativeHaptic('light');
                          setTexts(prev => prev.filter(t => t.id !== textItem.id));
                        }}>
                        <CloseWhite size={8} />
                      </TouchableOpacity>
                    </TouchableOpacity>
                  ))}

                  {/* Interactive Crop Frame Overlay with Dark Surround Mask, SVG Dashed Rect & Rule-of-Thirds Grid */}
                  {activeTool === 'crop' && (
                    <View
                      style={previewStyles.cropOverlayMask}
                      {...cropPanResponder.panHandlers}>
                      {/* 1. Top Dimmed Mask */}
                      <View
                        pointerEvents="none"
                        style={[
                          previewStyles.cropDimMask,
                          {
                            top: 0,
                            left: 0,
                            right: 0,
                            height: `${cropBox.y * 100}%`,
                          },
                        ]}
                      />
                      {/* 2. Bottom Dimmed Mask */}
                      <View
                        pointerEvents="none"
                        style={[
                          previewStyles.cropDimMask,
                          {
                            top: `${(cropBox.y + cropBox.height) * 100}%`,
                            left: 0,
                            right: 0,
                            bottom: 0,
                          },
                        ]}
                      />
                      {/* 3. Left Dimmed Mask */}
                      <View
                        pointerEvents="none"
                        style={[
                          previewStyles.cropDimMask,
                          {
                            top: `${cropBox.y * 100}%`,
                            left: 0,
                            width: `${cropBox.x * 100}%`,
                            height: `${cropBox.height * 100}%`,
                          },
                        ]}
                      />
                      {/* 4. Right Dimmed Mask */}
                      <View
                        pointerEvents="none"
                        style={[
                          previewStyles.cropDimMask,
                          {
                            top: `${cropBox.y * 100}%`,
                            left: `${(cropBox.x + cropBox.width) * 100}%`,
                            right: 0,
                            height: `${cropBox.height * 100}%`,
                          },
                        ]}
                      />

                      {/* SVG Dashed Rectangle & Dashed Rule-of-Thirds Grid */}
                      <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
                        <Rect
                          x={`${cropBox.x * 100}%`}
                          y={`${cropBox.y * 100}%`}
                          width={`${cropBox.width * 100}%`}
                          height={`${cropBox.height * 100}%`}
                          stroke="#FFFFFF"
                          strokeWidth="2.5"
                          strokeDasharray="8, 5"
                          fill="rgba(56, 189, 248, 0.10)"
                        />
                        <Line
                          x1={`${cropBox.x * 100}%`}
                          y1={`${(cropBox.y + cropBox.height * 0.333) * 100}%`}
                          x2={`${(cropBox.x + cropBox.width) * 100}%`}
                          y2={`${(cropBox.y + cropBox.height * 0.333) * 100}%`}
                          stroke="rgba(255, 255, 255, 0.55)"
                          strokeWidth="1.2"
                          strokeDasharray="4, 4"
                        />
                        <Line
                          x1={`${cropBox.x * 100}%`}
                          y1={`${(cropBox.y + cropBox.height * 0.666) * 100}%`}
                          x2={`${(cropBox.x + cropBox.width) * 100}%`}
                          y2={`${(cropBox.y + cropBox.height * 0.666) * 100}%`}
                          stroke="rgba(255, 255, 255, 0.55)"
                          strokeWidth="1.2"
                          strokeDasharray="4, 4"
                        />
                        <Line
                          x1={`${(cropBox.x + cropBox.width * 0.333) * 100}%`}
                          y1={`${cropBox.y * 100}%`}
                          x2={`${(cropBox.x + cropBox.width * 0.333) * 100}%`}
                          y2={`${(cropBox.y + cropBox.height) * 100}%`}
                          stroke="rgba(255, 255, 255, 0.55)"
                          strokeWidth="1.2"
                          strokeDasharray="4, 4"
                        />
                        <Line
                          x1={`${(cropBox.x + cropBox.width * 0.666) * 100}%`}
                          y1={`${cropBox.y * 100}%`}
                          x2={`${(cropBox.x + cropBox.width * 0.666) * 100}%`}
                          y2={`${(cropBox.y + cropBox.height) * 100}%`}
                          stroke="rgba(255, 255, 255, 0.55)"
                          strokeWidth="1.2"
                          strokeDasharray="4, 4"
                        />
                      </Svg>

                      {/* Interactive Crop Frame Handles and Overlays */}
                      <View
                        pointerEvents="none"
                        style={[
                          previewStyles.cropBoxFrame,
                          {
                            left: `${cropBox.x * 100}%`,
                            top: `${cropBox.y * 100}%`,
                            width: `${cropBox.width * 100}%`,
                            height: `${cropBox.height * 100}%`,
                          },
                        ]}>
                        {/* 4 Corner Grab Brackets */}
                        <View style={[previewStyles.cropCornerBracket, previewStyles.bracketTL]} />
                        <View style={[previewStyles.cropCornerBracket, previewStyles.bracketTR]} />
                        <View style={[previewStyles.cropCornerBracket, previewStyles.bracketBL]} />
                        <View style={[previewStyles.cropCornerBracket, previewStyles.bracketBR]} />

                        {/* 4 Edge Midpoint Indicator Bars */}
                        <View style={previewStyles.cropEdgeBarTop} />
                        <View style={previewStyles.cropEdgeBarBottom} />
                        <View style={previewStyles.cropEdgeBarLeft} />
                        <View style={previewStyles.cropEdgeBarRight} />

                        {/* Active Aspect Ratio Badge */}
                        <View style={previewStyles.cropCenterPill}>
                          <Text style={previewStyles.cropCenterPillText}>
                            {aspectRatio.toUpperCase()} • {Math.round(cropBox.width * 100)}% × {Math.round(cropBox.height * 100)}%
                          </Text>
                        </View>
                      </View>
                    </View>
                  )}
                </View>
              )}

              {/* Central Play Button Overlay for Videos */}
              {isVideo && (
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={handlePlayVideo}
                  style={previewStyles.centerPlayContainer}>
                  <View style={previewStyles.centerPlayGlow} />
                  <View style={previewStyles.centerPlayCircle}>
                    <PlayIcon size={28} color={AppColors.white} />
                  </View>
                  <View style={previewStyles.centerPlayPill}>
                    <Text style={previewStyles.centerPlayText}>
                      {isPlaying
                        ? t('mediaGallery.playing', 'Playing Video...')
                        : t('mediaGallery.playVideo', 'Play Video')}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}

              {/* Top-left Duration / Badge */}
              {isVideo && (
                <View style={previewStyles.topLeftBadgeOverlay} pointerEvents="none">
                  <View style={previewStyles.metaPill}>
                    <FilmIcon size={11} color={AppColors.sky400} />
                    <Text style={previewStyles.metaPillText}>
                      {formattedDuration || (durationSec ? `${durationSec}s` : 'VIDEO')}
                    </Text>
                  </View>
                </View>
              )}

              {/* Rotation angle badge */}
              {isImage && rotationAngle > 0 && (
                <View style={previewStyles.topLeftBadgeOverlay} pointerEvents="none">
                  <View style={[previewStyles.metaPill, {backgroundColor: 'rgba(99, 102, 241, 0.90)'}]}>
                    <RotateIcon size={11} color={AppColors.white} />
                    <Text style={previewStyles.metaPillText}>{rotationAngle}°</Text>
                  </View>
                </View>
              )}

              {/* Bottom-right Dimensions & Size Badge */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleCopyUri}
                style={previewStyles.bottomRightBadgeOverlay}>
                <View style={previewStyles.metaPill}>
                  <CopyIcon size={10} color={AppColors.sky400} />
                  <Text style={previewStyles.metaPillText}>
                    {activeWidth && activeHeight ? `${activeWidth} × ${activeHeight} • ` : ''}
                    {formatBytes(activeSizeBytes)}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Floating Vertical +/- Zoom Controls on Right */}
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
                </View>
              )}
            </View>

            {/* Sub-toolbar options for active editing mode */}
            {isImage && activeTool === 'crop' && (
              <View style={previewStyles.cropSubToolBar}>
                {/* Upper Action Row: Apply Crop & Cancel */}
                <View style={previewStyles.cropActionHeaderRow}>
                  <Text style={previewStyles.cropHeaderTitle}>Drag box or corners to crop</Text>
                  <View style={previewStyles.cropActionButtons}>
                    <TouchableOpacity
                      onPress={() => setActiveTool('none')}
                      style={previewStyles.cancelActionBtn}>
                      <Text style={previewStyles.cancelActionText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={handleApplyCrop}
                      style={previewStyles.applyActionBtn}>
                      <Text style={previewStyles.applyActionText}>Apply Crop</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Lower Aspect Ratio Presets Row */}
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={previewStyles.subToolScroll}>
                  {(['free', '1:1', '4:3', '16:9', '9:16', '3:2'] as AspectRatioOption[]).map(ratio => (
                    <TouchableOpacity
                      key={ratio}
                      onPress={() => handleSelectAspectRatio(ratio)}
                      style={[
                        previewStyles.ratioChip,
                        aspectRatio === ratio && previewStyles.ratioChipActive,
                      ]}>
                      <Text
                        style={[
                          previewStyles.ratioChipText,
                          aspectRatio === ratio && previewStyles.ratioChipTextActive,
                        ]}>
                        {ratio.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {isImage && activeTool === 'resize' && (
              <View style={previewStyles.subToolBar}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={previewStyles.subToolScroll}>
                  {[
                    {label: '75% HD', scale: 0.75},
                    {label: '50% Half', scale: 0.5},
                    {label: '25% Mini', scale: 0.25},
                  ].map(opt => (
                    <TouchableOpacity
                      key={opt.label}
                      onPress={() => handleApplyResize(opt.scale)}
                      style={previewStyles.ratioChip}>
                      <Text style={previewStyles.ratioChipText}>{opt.label}</Text>
                    </TouchableOpacity>
                  ))}
                  <TouchableOpacity
                    onPress={() => setActiveTool('none')}
                    style={previewStyles.cancelActionBtn}>
                    <Text style={previewStyles.cancelActionText}>Done</Text>
                  </TouchableOpacity>
                </ScrollView>
              </View>
            )}

            {isImage && activeTool === 'draw' && (
              <View style={previewStyles.subToolBar}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={previewStyles.subToolScroll}>
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
                  {[2, 4, 8].map(w => (
                    <TouchableOpacity
                      key={w}
                      onPress={() => {
                        triggerNativeHaptic('light');
                        setSelectedStrokeWidth(w);
                      }}
                      style={[
                        previewStyles.strokeWidthBtn,
                        selectedStrokeWidth === w && previewStyles.strokeWidthBtnActive,
                      ]}>
                      <View style={[previewStyles.strokeDot, {width: w + 2, height: w + 2, backgroundColor: selectedColor}]} />
                    </TouchableOpacity>
                  ))}
                  <TouchableOpacity
                    onPress={handleUndoStroke}
                    disabled={inkPaths.length === 0}
                    style={[previewStyles.actionPillBtn, inkPaths.length === 0 && {opacity: 0.4}]}>
                    <UndoIcon size={13} color={AppColors.white} />
                    <Text style={previewStyles.actionPillText}>Undo</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleClearStrokes}
                    disabled={inkPaths.length === 0}
                    style={[previewStyles.actionPillBtn, inkPaths.length === 0 && {opacity: 0.4}]}>
                    <Text style={previewStyles.actionPillText}>Clear</Text>
                  </TouchableOpacity>
                </ScrollView>
              </View>
            )}

            {isImage && activeTool === 'shapes' && (
              <View style={previewStyles.subToolBar}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={previewStyles.subToolScroll}>
                  <TouchableOpacity
                    onPress={() => handleAddShape('rect')}
                    style={previewStyles.shapeOptionBtn}>
                    <RectangleIcon size={14} color={AppColors.sky400} />
                    <Text style={previewStyles.shapeOptionText}>Rectangle</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleAddShape('circle')}
                    style={previewStyles.shapeOptionBtn}>
                    <CircleIconOutline size={14} color={AppColors.amber400} />
                    <Text style={previewStyles.shapeOptionText}>Circle</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleAddShape('ellipse')}
                    style={previewStyles.shapeOptionBtn}>
                    <EllipseIconOutline size={14} color={AppColors.violet600} />
                    <Text style={previewStyles.shapeOptionText}>Ellipse</Text>
                  </TouchableOpacity>
                  <View style={previewStyles.subDivider} />
                  {COLOR_PALETTE.slice(0, 4).map(c => (
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
                </ScrollView>
              </View>
            )}

            {/* Bottom Primary Tool Dock (Dedicated to editing markup) */}
            <View style={previewStyles.bottomTesterDock}>
              {isImage && (
                <>
                  <TouchableScale
                    onPress={() => setActiveTool(activeTool === 'crop' ? 'none' : 'crop')}
                    style={[
                      previewStyles.dockToolBtn,
                      activeTool === 'crop' && previewStyles.dockToolBtnActive,
                    ]}>
                    <CropIcon size={16} color={activeTool === 'crop' ? AppColors.white : AppColors.sky400} />
                    <Text style={[previewStyles.dockToolLabel, activeTool === 'crop' && {color: AppColors.white}]}>
                      Crop
                    </Text>
                  </TouchableScale>

                  <TouchableScale
                    onPress={() => setActiveTool(activeTool === 'resize' ? 'none' : 'resize')}
                    style={[
                      previewStyles.dockToolBtn,
                      activeTool === 'resize' && previewStyles.dockToolBtnActive,
                    ]}>
                    <ResizeIcon size={16} color={activeTool === 'resize' ? AppColors.white : AppColors.emerald400} />
                    <Text style={[previewStyles.dockToolLabel, activeTool === 'resize' && {color: AppColors.white}]}>
                      Resize
                    </Text>
                  </TouchableScale>

                  <TouchableScale
                    onPress={() => setActiveTool(activeTool === 'draw' ? 'none' : 'draw')}
                    style={[
                      previewStyles.dockToolBtn,
                      activeTool === 'draw' && previewStyles.dockToolBtnActive,
                    ]}>
                    <PenIcon size={16} color={activeTool === 'draw' ? AppColors.white : AppColors.rose400} />
                    <Text style={[previewStyles.dockToolLabel, activeTool === 'draw' && {color: AppColors.white}]}>
                      Draw
                    </Text>
                  </TouchableScale>

                  <TouchableScale
                    onPress={() => setActiveTool(activeTool === 'shapes' ? 'none' : 'shapes')}
                    style={[
                      previewStyles.dockToolBtn,
                      activeTool === 'shapes' && previewStyles.dockToolBtnActive,
                    ]}>
                    <ShapesIcon size={16} color={activeTool === 'shapes' ? AppColors.white : AppColors.amber400} />
                    <Text style={[previewStyles.dockToolLabel, activeTool === 'shapes' && {color: AppColors.white}]}>
                      Shapes
                    </Text>
                  </TouchableScale>

                  <TouchableScale
                    onPress={() => handleOpenTextModal()}
                    style={previewStyles.dockToolBtn}>
                    <TypeIcon size={16} color={AppColors.indigo400} />
                    <Text style={previewStyles.dockToolLabel}>Text</Text>
                  </TouchableScale>

                  <TouchableScale
                    onPress={handleAddBlurBox}
                    style={previewStyles.dockToolBtn}>
                    <BlurIcon size={16} color={AppColors.sky300} />
                    <Text style={previewStyles.dockToolLabel}>Blur</Text>
                  </TouchableScale>

                  <TouchableScale
                    onPress={handleRotateImage}
                    style={previewStyles.dockToolBtn}>
                    <RotateIcon size={16} color={AppColors.violet600} />
                    <Text style={previewStyles.dockToolLabel}>Rotate</Text>
                  </TouchableScale>
                </>
              )}

              {isVideo && (
                <>
                  <TouchableScale
                    onPress={handleTrimRepro}
                    disabled={isEditing}
                    style={previewStyles.dockToolBtn}>
                    <ScissorsIcon size={16} color={AppColors.sky400} />
                    <Text style={previewStyles.dockToolLabel}>{t('media.trim5s', 'Trim 5s')}</Text>
                  </TouchableScale>

                  <TouchableScale
                    onPress={handleMuteVideo}
                    disabled={isEditing}
                    style={previewStyles.dockToolBtn}>
                    <VolumeXIcon size={16} color={AppColors.amber400} />
                    <Text style={previewStyles.dockToolLabel}>{t('media.muteAudio', 'Mute Audio')}</Text>
                  </TouchableScale>

                  {onConvertToGif && (
                    <TouchableScale
                      onPress={handleConvert}
                      disabled={isConverting}
                      style={previewStyles.dockToolBtn}>
                      <GifIcon size={16} color={AppColors.violet600} />
                      <Text style={previewStyles.dockToolLabel}>{t('media.toGif', 'To GIF')}</Text>
                    </TouchableScale>
                  )}

                  <TouchableScale
                    onPress={handlePlayVideo}
                    style={[previewStyles.dockToolBtn, previewStyles.dockPrimaryBtn]}>
                    <PlayIcon size={16} color={AppColors.white} />
                    <Text style={[previewStyles.dockToolLabel, {color: AppColors.white}]}>{t('media.play', 'Play')}</Text>
                  </TouchableScale>
                </>
              )}
            </View>
          </View>
        </SafeAreaView>
      </View>

      {/* Text Annotation Input Modal */}
      <Modal
        visible={showTextInputModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowTextInputModal(false)}>
        <View style={previewStyles.modalBackdrop}>
          <View style={previewStyles.textModalCard}>
            <Text style={previewStyles.textModalTitle}>Add Text Note / Callout</Text>
            <TextInput
              style={previewStyles.textModalInput}
              placeholder="e.g. Defect: Button overlap"
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
                <Text style={previewStyles.modalConfirmText}>Place Text</Text>
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
  overlay: {
    flex: 1,
    backgroundColor: AppColors.slate900,
  },
  header: {
    width: '100%',
    zIndex: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255, 255, 255, 0.25)',
  },
  headerInner: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingTop:
      Platform.OS === 'ios'
        ? 52
        : StatusBar.currentHeight
        ? StatusBar.currentHeight + 8
        : 18,
    paddingBottom: 12,
    minHeight: Platform.OS === 'ios' ? 94 : 64,
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
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3.5,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.38)',
  },
  badgeText: {
    fontFamily: AppFonts.interBold,
    fontSize: 9.5,
    letterSpacing: 0.4,
    color: AppColors.white,
  },
  title: {
    fontFamily: AppFonts.interSemiBold,
    fontSize: 12.5,
    color: AppColors.white,
    letterSpacing: -0.1,
  },
  subtitle: {
    fontFamily: AppFonts.interRegular,
    fontSize: 10.5,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 1,
  },
  headerActionBtn: {
    width: 30,
    height: 30,
    borderRadius: 7,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.38)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerDeleteBtn: {
    width: 30,
    height: 30,
    borderRadius: 7,
    backgroundColor: 'rgba(239, 68, 68, 0.35)',
    borderWidth: 1,
    borderColor: 'rgba(252, 165, 165, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCloseBtn: {
    width: 30,
    height: 30,
    borderRadius: 7,
    backgroundColor: 'rgba(244, 63, 94, 0.28)',
    borderWidth: 1,
    borderColor: 'rgba(251, 113, 133, 0.48)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stageSafe: {
    flex: 1,
    width: '100%',
  },
  stage: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  previewCard: {
    flex: 1,
    width: '100%',
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#090D1A',
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
  image: {
    width: '100%',
    height: '100%',
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
  centerPlayContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  centerPlayGlow: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(56, 189, 248, 0.22)',
  },
  centerPlayCircle: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: AppColors.sky500,
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 3,
    shadowColor: AppColors.sky500,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  centerPlayPill: {
    backgroundColor: 'rgba(15, 23, 42, 0.90)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  centerPlayText: {
    fontFamily: AppFonts.interBold,
    fontSize: 11.5,
    color: AppColors.white,
    letterSpacing: 0.3,
  },
  topLeftBadgeOverlay: {
    position: 'absolute',
    top: 12,
    left: 12,
  },
  bottomRightBadgeOverlay: {
    position: 'absolute',
    bottom: 12,
    right: 12,
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(15, 23, 42, 0.90)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  metaPillText: {
    fontFamily: AppFonts.interSemiBold,
    fontSize: 11,
    color: AppColors.white,
    letterSpacing: 0.2,
  },
  floatingZoomBar: {
    position: 'absolute',
    right: 12,
    top: '35%',
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    paddingVertical: 6,
    paddingHorizontal: 4,
    alignItems: 'center',
    gap: 6,
    shadowColor: AppColors.black,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.45,
    shadowRadius: 8,
    elevation: 10,
  },
  zoomBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomLevelBadge: {
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  zoomLevelText: {
    fontFamily: AppFonts.interBold,
    fontSize: 9.5,
    color: AppColors.sky400,
    letterSpacing: 0.2,
  },
  subToolBar: {
    width: '100%',
    backgroundColor: 'rgba(15, 23, 42, 0.96)',
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 8,
    marginTop: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  subToolScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ratioChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
  },
  ratioChipActive: {
    backgroundColor: AppColors.indigo600,
    borderColor: AppColors.indigo400,
  },
  ratioChipText: {
    fontFamily: AppFonts.interSemiBold,
    fontSize: 10.5,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  ratioChipTextActive: {
    color: AppColors.white,
    fontFamily: AppFonts.interBold,
  },
  applyActionBtn: {
    backgroundColor: AppColors.emerald600,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
  },
  applyActionText: {
    fontFamily: AppFonts.interBold,
    fontSize: 11,
    color: AppColors.white,
  },
  cancelActionBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  cancelActionText: {
    fontFamily: AppFonts.interSemiBold,
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  colorDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  colorDotActive: {
    borderColor: AppColors.white,
    transform: [{scale: 1.25}],
  },
  subDivider: {
    width: 1,
    height: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    marginHorizontal: 4,
  },
  strokeWidthBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  strokeWidthBtnActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  strokeDot: {
    borderRadius: 99,
  },
  actionPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
  },
  actionPillText: {
    fontFamily: AppFonts.interSemiBold,
    fontSize: 10,
    color: AppColors.white,
  },
  shapeOptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  shapeOptionText: {
    fontFamily: AppFonts.interSemiBold,
    fontSize: 10.5,
    color: AppColors.white,
  },
  shapeItem: {
    position: 'absolute',
    borderWidth: 2.5,
    borderStyle: 'solid',
  },
  shapeDeleteBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: AppColors.rose500,
    alignItems: 'center',
    justifyContent: 'center',
  },
  blurItem: {
    position: 'absolute',
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderWidth: 1.5,
    borderColor: 'rgba(56, 189, 248, 0.7)',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  blurItemText: {
    fontFamily: AppFonts.interBold,
    fontSize: 9,
    color: AppColors.sky300,
    letterSpacing: 0.6,
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
  cropSubToolBar: {
    width: '100%',
    backgroundColor: 'rgba(15, 23, 42, 0.96)',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginTop: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    gap: 8,
  },
  cropActionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingBottom: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255, 255, 255, 0.12)',
  },
  cropHeaderTitle: {
    fontFamily: AppFonts.interSemiBold,
    fontSize: 10.5,
    color: 'rgba(255, 255, 255, 0.65)',
  },
  cropActionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
    borderStyle: 'dashed',
    borderColor: AppColors.white,
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    shadowColor: AppColors.black,
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  cropGridH: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    borderTopWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(255, 255, 255, 0.45)',
  },
  cropGridV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    borderLeftWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(255, 255, 255, 0.45)',
  },
  cropHandleTouchArea: {
    position: 'absolute',
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  handleAreaTL: {top: -19, left: -19},
  handleAreaTR: {top: -19, right: -19},
  handleAreaBL: {bottom: -19, left: -19},
  handleAreaBR: {bottom: -19, right: -19},
  cropCornerBracket: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderColor: AppColors.white,
    backgroundColor: AppColors.sky500,
    borderRadius: 2,
    borderWidth: 2,
    shadowColor: AppColors.black,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.6,
    shadowRadius: 3,
    elevation: 4,
  },
  bracketTL: {top: -7, left: -7},
  bracketTR: {top: -7, right: -7},
  bracketBL: {bottom: -7, left: -7},
  bracketBR: {bottom: -7, right: -7},
  cropEdgeBarTop: {
    position: 'absolute',
    top: -3,
    left: '35%',
    right: '35%',
    height: 6,
    backgroundColor: AppColors.white,
    borderRadius: 3,
  },
  cropEdgeBarBottom: {
    position: 'absolute',
    bottom: -3,
    left: '35%',
    right: '35%',
    height: 6,
    backgroundColor: AppColors.white,
    borderRadius: 3,
  },
  cropEdgeBarLeft: {
    position: 'absolute',
    left: -3,
    top: '35%',
    bottom: '35%',
    width: 6,
    backgroundColor: AppColors.white,
    borderRadius: 3,
  },
  cropEdgeBarRight: {
    position: 'absolute',
    right: -3,
    top: '35%',
    bottom: '35%',
    width: 6,
    backgroundColor: AppColors.white,
    borderRadius: 3,
  },
  cropCenterPill: {
    position: 'absolute',
    top: 6,
    alignSelf: 'center',
    backgroundColor: 'rgba(14, 165, 233, 0.92)',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  cropCenterPillText: {
    fontFamily: AppFonts.interBold,
    fontSize: 9,
    color: AppColors.white,
    letterSpacing: 0.4,
  },
  bottomTesterDock: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    paddingVertical: 10,
    paddingHorizontal: 6,
    marginTop: 6,
    backgroundColor: 'rgba(15, 23, 42, 0.94)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    gap: 4,
  },
  dockToolBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 2,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    gap: 3,
  },
  dockToolBtnActive: {
    backgroundColor: AppColors.indigo600,
    borderColor: AppColors.indigo400,
    borderWidth: 1,
  },
  dockPrimaryBtn: {
    backgroundColor: AppColors.indigo600,
  },
  dockToolLabel: {
    fontFamily: AppFonts.interSemiBold,
    fontSize: 9.5,
    color: 'rgba(255, 255, 255, 0.85)',
    letterSpacing: 0.1,
  },
  modalBackdrop: {
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
});
