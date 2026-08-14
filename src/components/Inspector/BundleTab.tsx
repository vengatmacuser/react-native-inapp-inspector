import React, {useState, useMemo, useCallback} from 'react';
import {
  FlatList,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {useTranslation} from 'react-i18next';
import TouchableScale from '../TouchableScale';
import CopyButton from '../CopyButton';
import HighlightText from '../HighlightText';
import SegmentedTabs from '../SegmentedTabs';
import AnimatedEntrance from '../AnimatedEntrance';
import EndOfListFooter from '../EndOfListFooter';
import {AppColors} from '../../styles/AppColors';
import {AppFonts} from '../../styles/AppFonts';
import styles from '../../styles';
import {
  PackageIcon,
  SearchIcon,
  ClearIcon,
  CheckIcon,
  CircleAlertIcon,
  LayersIcon,
  TimelineIcon,
  LiveStateIcon,
  StorageIcon,
  MetadataIcon,
} from '../NetworkIcons';

import Svg, {
  Path,
  Rect,
  Circle,
  Ellipse,
  G,
  Defs,
  LinearGradient,
  Stop,
} from 'react-native-svg';

export type BundleSubTab = 'overview' | 'files' | 'packages' | 'media' | 'optimizer';

export type FileTypeCategory = 'image' | 'typescript' | 'javascript' | 'font' | 'json';

export interface BundleFileItem {
  id: string;
  name: string;
  path: string;
  ext: string;
  category: FileTypeCategory;
  sizeKb: number;
  meta: string;
  color: string;
  status?: 'optimal' | 'warning' | 'info';
  advice?: string;
  previewUri?: string;
  isConsumed?: boolean;
}

export interface BundlePackageItem {
  id: string;
  name: string;
  version: string;
  sizeKb: number;
  percentage: number;
  type: 'direct' | 'peer' | 'transitive';
  category: 'core' | 'navigation' | 'network' | 'ui' | 'utils';
  color: string;
  description: string;
  logoUri?: string;
}

// ─── High-Fidelity Vector Package & NPM Logos ────────────────────────────────

const PackageLogoRenderer: React.FC<{
  name: string;
  color?: string;
  size?: number;
}> = ({name, size = 28}) => {
  const lowerName = name.toLowerCase();

  // 1. React & React Native (Official Cyan Atom Orbital)
  if (
    lowerName === 'react' ||
    (lowerName.includes('react-native') &&
      !lowerName.includes('svg') &&
      !lowerName.includes('screens') &&
      !lowerName.includes('gradient'))
  ) {
    return (
      <View
        style={[
          bundleStyles.pkgLogoWrap,
          {width: size, height: size, backgroundColor: '#20232A'},
        ]}>
        <Svg width={size - 6} height={size - 6} viewBox="0 0 100 100" fill="none">
          <Circle cx="50" cy="50" r="9" fill="#61DAFB" />
          <Ellipse
            cx="50"
            cy="50"
            rx="42"
            ry="16"
            stroke="#61DAFB"
            strokeWidth="6"
          />
          <Ellipse
            cx="50"
            cy="50"
            rx="42"
            ry="16"
            stroke="#61DAFB"
            strokeWidth="6"
            transform="rotate(60 50 50)"
          />
          <Ellipse
            cx="50"
            cy="50"
            rx="42"
            ry="16"
            stroke="#61DAFB"
            strokeWidth="6"
            transform="rotate(120 50 50)"
          />
        </Svg>
      </View>
    );
  }

  // 2. React Navigation (Official Violet/Cyan Compass)
  if (lowerName.includes('navigation')) {
    return (
      <View
        style={[
          bundleStyles.pkgLogoWrap,
          {width: size, height: size, backgroundColor: '#5B44E0'},
        ]}>
        <Svg width={size - 8} height={size - 8} viewBox="0 0 100 100" fill="none">
          <Circle cx="50" cy="50" r="38" stroke="#FFFFFF" strokeWidth="8" />
          <Path d="M50 20 L68 50 L50 80 L32 50 Z" fill="#61DAFB" />
          <Circle cx="50" cy="50" r="6" fill="#FFFFFF" />
        </Svg>
      </View>
    );
  }

  // 3. React Native SVG (Bezier Path Vector Art)
  if (lowerName.includes('svg')) {
    return (
      <View
        style={[
          bundleStyles.pkgLogoWrap,
          {width: size, height: size, backgroundColor: '#F472B6'},
        ]}>
        <Svg width={size - 8} height={size - 8} viewBox="0 0 100 100" fill="none">
          <Path
            d="M20 75 C35 25, 65 25, 80 75"
            stroke="#FFFFFF"
            strokeWidth="10"
            strokeLinecap="round"
          />
          <Circle cx="20" cy="75" r="8" fill="#FFFFFF" />
          <Circle cx="80" cy="75" r="8" fill="#FFFFFF" />
          <Circle
            cx="50"
            cy="38"
            r="7"
            fill="#FCE7F3"
            stroke="#FFFFFF"
            strokeWidth="3"
          />
        </Svg>
      </View>
    );
  }

  // 4. Axios (Official Indigo & Cyan Network Adapter)
  if (lowerName.includes('axios')) {
    return (
      <View
        style={[
          bundleStyles.pkgLogoWrap,
          {width: size, height: size, backgroundColor: '#5A29E4'},
        ]}>
        <Svg width={size - 6} height={size - 6} viewBox="0 0 100 100" fill="none">
          <Path
            d="M22 75 L50 20 L78 75 M33 58 L67 58"
            stroke="#FFFFFF"
            strokeWidth="12"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Circle cx="50" cy="20" r="7" fill="#61DAFB" />
        </Svg>
      </View>
    );
  }

  // 5. React Native Screens (Software Mansion Deep Indigo Stack)
  if (lowerName.includes('screens') || lowerName.includes('software-mansion')) {
    return (
      <View
        style={[
          bundleStyles.pkgLogoWrap,
          {width: size, height: size, backgroundColor: '#001A72'},
        ]}>
        <Svg width={size - 8} height={size - 8} viewBox="0 0 100 100" fill="none">
          <Path d="M50 15 L88 35 L50 55 L12 35 Z" fill="#38BDF8" />
          <Path
            d="M12 50 L50 70 L88 50"
            stroke="#FFFFFF"
            strokeWidth="8"
            strokeLinecap="round"
          />
          <Path
            d="M12 65 L50 85 L88 65"
            stroke="#93C5FD"
            strokeWidth="8"
            strokeLinecap="round"
          />
        </Svg>
      </View>
    );
  }

  // 6. Linear Gradient (Vibrant Color Spectrum)
  if (lowerName.includes('gradient')) {
    return (
      <View
        style={[
          bundleStyles.pkgLogoWrap,
          {width: size, height: size, backgroundColor: '#FB7185'},
        ]}>
        <Svg width={size - 4} height={size - 4} viewBox="0 0 100 100" fill="none">
          <Defs>
            <LinearGradient
              id="pkgGrad"
              x1="0"
              y1="0"
              x2="100"
              y2="100"
              gradientUnits="userSpaceOnUse">
              <Stop offset="0" stopColor="#FF0080" />
              <Stop offset="0.5" stopColor="#7928CA" />
              <Stop offset="1" stopColor="#0070F3" />
            </LinearGradient>
          </Defs>
          <Rect width="100" height="100" rx="18" fill="url(#pkgGrad)" />
        </Svg>
      </View>
    );
  }

  // 7. i18next & Translations (Emerald Globe)
  if (lowerName.includes('i18n')) {
    return (
      <View
        style={[
          bundleStyles.pkgLogoWrap,
          {width: size, height: size, backgroundColor: '#059669'},
        ]}>
        <Svg width={size - 8} height={size - 8} viewBox="0 0 100 100" fill="none">
          <Circle cx="50" cy="50" r="38" stroke="#FFFFFF" strokeWidth="8" />
          <Ellipse
            cx="50"
            cy="50"
            rx="18"
            ry="38"
            stroke="#FFFFFF"
            strokeWidth="6"
          />
          <Path d="M14 50 L86 50" stroke="#FFFFFF" strokeWidth="7" />
        </Svg>
      </View>
    );
  }

  // 8. Official Red NPM Logo Box (Universal Default NPM Branding)
  return (
    <View
      style={[
        bundleStyles.pkgLogoWrap,
        {width: size, height: size, backgroundColor: '#CB3837'},
      ]}>
      <Svg width={size - 4} height={size - 4} viewBox="0 0 100 100" fill="none">
        <Rect width="100" height="100" rx="14" fill="#CB3837" />
        <Path
          d="M18 24 H82 V76 H50 V40 H38 V76 H18 Z"
          fill="#FFFFFF"
        />
      </Svg>
    </View>
  );
};

// ─── Media File Thumbnail Component ──────────────────────────────────────────

const MediaPreviewThumbnail: React.FC<{file: BundleFileItem}> = ({file}) => {
  const [loadError, setLoadError] = useState(false);

  // 1. If it's an SVG file, render an inline vector thumbnail preview
  if (file.ext === 'SVG' || file.name.toLowerCase().endsWith('.svg')) {
    return (
      <View
        style={[
          bundleStyles.mediaThumbWrap,
          {
            backgroundColor: '#FFF1F2',
            alignItems: 'center',
            justifyContent: 'center',
            borderColor: '#FECDD3',
          },
        ]}>
        <Svg width={22} height={22} viewBox="0 0 100 100" fill="none">
          <Defs>
            <LinearGradient
              id="svgGradThumb"
              x1="0"
              y1="0"
              x2="100"
              y2="100"
              gradientUnits="userSpaceOnUse">
              <Stop offset="0" stopColor="#F43F5E" />
              <Stop offset="1" stopColor="#FB7185" />
            </LinearGradient>
          </Defs>
          <Circle cx="50" cy="50" r="44" fill="url(#svgGradThumb)" />
          {/* Vector bezier path pen graphic */}
          <Path
            d="M25 70 C35 30, 65 30, 75 70"
            stroke="#FFFFFF"
            strokeWidth="8"
            strokeLinecap="round"
          />
          <Circle cx="25" cy="70" r="7" fill="#FFFFFF" />
          <Circle cx="75" cy="70" r="7" fill="#FFFFFF" />
          <Circle
            cx="50"
            cy="40"
            r="6"
            fill="#FFE4E6"
            stroke="#FFFFFF"
            strokeWidth="2"
          />
        </Svg>
      </View>
    );
  }

  // 2. Raster Image (PNG, JPG, WebP) with valid preview URI
  if (file.category === 'image' && file.previewUri && !loadError) {
    return (
      <View style={bundleStyles.mediaThumbWrap}>
        <Image
          source={{uri: file.previewUri}}
          style={bundleStyles.mediaThumbImg}
          resizeMode="cover"
          onError={() => setLoadError(true)}
        />
      </View>
    );
  }

  const categoryMeta = CATEGORY_COLORS[file.category] || CATEGORY_COLORS.typescript;
  return (
    <View
      style={[
        bundleStyles.extChip,
        {
          backgroundColor: categoryMeta.bg,
          borderColor: `${categoryMeta.color}40`,
        },
      ]}>
      <Text style={[bundleStyles.extChipText, {color: categoryMeta.color}]}>
        {file.ext}
      </Text>
    </View>
  );
};

// ─── Directory Tree Hierarchy Data Structure & Component ─────────────────────

export interface TreeNode {
  id: string;
  name: string;
  fullPath: string;
  isFolder: boolean;
  fileItem?: BundleFileItem;
  sizeKb: number;
  fileCount: number;
  children: TreeNode[];
}

function buildBundleFileTree(files: BundleFileItem[]): TreeNode[] {
  const rootMap = new Map<string, any>();

  for (const file of files) {
    const parts = file.path.split('/');
    let currentLevel = rootMap;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isFile = i === parts.length - 1;

      if (!currentLevel.has(part)) {
        currentLevel.set(part, {
          name: part,
          fullPath: parts.slice(0, i + 1).join('/'),
          isFile,
          fileItem: isFile ? file : undefined,
          children: new Map<string, any>(),
        });
      }

      if (!isFile) {
        currentLevel = currentLevel.get(part).children;
      }
    }
  }

  function convertMapToNodes(map: Map<string, any>): TreeNode[] {
    const nodes: TreeNode[] = [];
    for (const [, val] of map.entries()) {
      const children = convertMapToNodes(val.children);
      const isFolder = !val.isFile;
      const fileCount = isFolder
        ? children.reduce((acc, c) => acc + (c.isFolder ? c.fileCount : 1), 0)
        : 1;
      const sizeKb = isFolder
        ? children.reduce((acc, c) => acc + c.sizeKb, 0)
        : val.fileItem
        ? val.fileItem.sizeKb
        : 0;

      nodes.push({
        id: val.fullPath,
        name: val.name,
        fullPath: val.fullPath,
        isFolder,
        fileItem: val.fileItem,
        sizeKb,
        fileCount,
        children,
      });
    }

    // Sort folders first, then files alphabetically
    return nodes.sort((a, b) => {
      if (a.isFolder && !b.isFolder) return -1;
      if (!a.isFolder && b.isFolder) return 1;
      return a.name.localeCompare(b.name);
    });
  }

  return convertMapToNodes(rootMap);
}

const BundleTreeNodeView: React.FC<{
  node: TreeNode;
  level: number;
  search: string;
  totalBundleKb: number;
  collapsedFolders: Record<string, boolean>;
  toggleFolder: (path: string) => void;
  isLastChild: boolean;
}> = ({
  node,
  level,
  search,
  totalBundleKb,
  collapsedFolders,
  toggleFolder,
  isLastChild,
}) => {
  const isCollapsed = !!collapsedFolders[node.fullPath];

  if (node.isFolder) {
    return (
      <View style={bundleStyles.treeFolderContainer}>
        <TouchableScale
          onPress={() => toggleFolder(node.fullPath)}
          style={[
            bundleStyles.treeFolderHeader,
            {paddingLeft: Math.max(10, level * 14 + 10)},
          ]}>
          <View style={{flexDirection: 'row', alignItems: 'center', gap: 7, flex: 1}}>
            <View style={bundleStyles.treeFolderChevronWrap}>
              <Text style={bundleStyles.treeFolderChevron}>
                {isCollapsed ? '▶' : '▼'}
              </Text>
            </View>
            <Text style={{fontSize: 16}}>{isCollapsed ? '📁' : '📂'}</Text>
            <HighlightText
              text={node.name + '/'}
              search={search}
              style={bundleStyles.treeFolderName}
              highlightStyle={bundleStyles.searchHighlight}
            />
            <View style={bundleStyles.treeCountBadge}>
              <Text style={bundleStyles.treeCountBadgeText}>
                {node.fileCount} {node.fileCount === 1 ? 'file' : 'files'}
              </Text>
            </View>
          </View>

          <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
            <Text style={bundleStyles.treeFolderSize}>
              {node.sizeKb >= 1024
                ? `${(node.sizeKb / 1024).toFixed(2)} MB`
                : `${node.sizeKb} KB`}
            </Text>
            <CopyButton
              value={() => ({
                folder: node.fullPath,
                sizeKb: node.sizeKb,
                fileCount: node.fileCount,
              })}
              label={`Copy ${node.name} Info`}
            />
          </View>
        </TouchableScale>

        {!isCollapsed && (
          <View style={[bundleStyles.treeChildrenWrap, {borderLeftWidth: level > 0 ? 1.5 : 0, marginLeft: Math.max(6, level * 14 + 16)}]}>
            {node.children.map((child, cIdx) => (
              <BundleTreeNodeView
                key={child.id}
                node={child}
                level={level + 1}
                search={search}
                totalBundleKb={totalBundleKb}
                collapsedFolders={collapsedFolders}
                toggleFolder={toggleFolder}
                isLastChild={cIdx === node.children.length - 1}
              />
            ))}
          </View>
        )}
      </View>
    );
  }

  // File item inside tree
  const file = node.fileItem;
  if (!file) return null;

  const pctOfTotal = ((file.sizeKb / totalBundleKb) * 100).toFixed(1);
  const isUnused = file.isConsumed === false;

  return (
    <View style={[bundleStyles.treeFileCard, isUnused && bundleStyles.treeFileCardUnused]}>
      <View style={bundleStyles.fileCardTop}>
        <View style={bundleStyles.treeBranchGlyph}>
          <Text style={bundleStyles.treeBranchGlyphText}>
            {isLastChild ? '└─' : '├─'}
          </Text>
        </View>

        <MediaPreviewThumbnail file={file} />

        <View style={{flex: 1, paddingHorizontal: 4}}>
          <View style={{flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap'}}>
            <HighlightText
              text={file.name}
              search={search}
              style={bundleStyles.fileName}
              highlightStyle={bundleStyles.searchHighlight}
            />
            {isUnused ? (
              <View style={bundleStyles.unusedBadge}>
                <Text style={bundleStyles.unusedBadgeText}>🚫 Not Consumed</Text>
              </View>
            ) : (
              <View style={bundleStyles.consumedBadge}>
                <Text style={bundleStyles.consumedBadgeText}>⚡ Consumed</Text>
              </View>
            )}
          </View>
          <Text style={bundleStyles.filePath} numberOfLines={1}>
            {file.meta}
          </Text>
        </View>

        <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
          <View style={bundleStyles.fileSizeBox}>
            <Text style={[bundleStyles.fileSizeKb, isUnused && {color: '#B45309'}]}>
              {file.sizeKb >= 1024
                ? `${(file.sizeKb / 1024).toFixed(2)} MB`
                : `${file.sizeKb} KB`}
            </Text>
            <Text style={bundleStyles.filePercent}>{pctOfTotal}%</Text>
          </View>
          <CopyButton
            value={() => file}
            label="File Details JSON"
          />
        </View>
      </View>

      {file.advice && (
        <View
          style={[
            bundleStyles.adviceBadge,
            file.status === 'warning' && bundleStyles.adviceWarning,
            file.status === 'optimal' && bundleStyles.adviceOptimal,
            isUnused && bundleStyles.adviceUnused,
            {marginLeft: 26, marginTop: 4},
          ]}>
          <Text
            style={[
              bundleStyles.adviceText,
              file.status === 'warning' && {color: '#B45309'},
              file.status === 'optimal' && {color: '#047857'},
              isUnused && {color: '#DC2626'},
            ]}>
            {isUnused ? '🗑️ ' : file.status === 'warning' ? '💡 ' : '✨ '}
            {file.advice}
          </Text>
        </View>
      )}
    </View>
  );
};

// ─── Sample Bundle Files Data ────────────────────────────────────────────────

const BUNDLE_FILES_DATA: BundleFileItem[] = [
  // ── Images & Media ──
  {
    id: 'img-1',
    name: 'banner_dark.png',
    path: 'assets/images/banner_dark.png',
    ext: 'PNG',
    category: 'image',
    sizeKb: 460,
    meta: '1200×630px @2x • Raster Image',
    color: '#EC4899',
    status: 'warning',
    advice: 'Convert to .webp to save ~65% (160 KB)',
    previewUri: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 'img-2',
    name: 'banner_light.svg',
    path: 'assets/images/banner_light.svg',
    ext: 'SVG',
    category: 'image',
    sizeKb: 34,
    meta: 'Scalable Vector Graphic',
    color: '#F43F5E',
    status: 'optimal',
    advice: 'Optimal vector format for sharp rendering',
    previewUri: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 'img-3',
    name: 'logo_hero@3x.png',
    path: 'assets/brand/logo_hero@3x.png',
    ext: 'PNG',
    category: 'image',
    sizeKb: 285,
    meta: '768×768px @3x Retina Asset',
    color: '#EC4899',
    status: 'warning',
    advice: 'High density PNG. Consider tintable SVG vector',
    previewUri: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 'img-4',
    name: 'avatar_placeholder.webp',
    path: 'assets/placeholders/avatar_placeholder.webp',
    ext: 'WEBP',
    category: 'image',
    sizeKb: 28,
    meta: '256×256px Lossy WebP',
    color: '#F472B6',
    status: 'warning',
    advice: 'Unused in bundle: 0 active imports detected (28 KB unused)',
    previewUri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    isConsumed: false,
  },
  {
    id: 'img-5',
    name: 'walkthrough_thumb.jpg',
    path: 'assets/previews/walkthrough_thumb.jpg',
    ext: 'JPG',
    category: 'image',
    sizeKb: 175,
    meta: '1080×600px Progressive JPEG',
    color: '#FB7185',
    status: 'warning',
    advice: 'Dead asset: 0 component references (175 KB unused)',
    previewUri: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=200&auto=format&fit=crop&q=80',
    isConsumed: false,
  },

  // ── TypeScript & JSX ──
  {
    id: 'ts-1',
    name: 'LogDetail.tsx',
    path: 'src/components/Inspector/LogDetail.tsx',
    ext: 'TSX',
    category: 'typescript',
    sizeKb: 44,
    meta: '1,238 lines • React Component',
    color: '#38BDF8',
    status: 'optimal',
    advice: 'Clean React.memo and useCallback optimization',
  },
  {
    id: 'ts-2',
    name: 'ReduxDetail.tsx',
    path: 'src/components/Inspector/ReduxDetail.tsx',
    ext: 'TSX',
    category: 'typescript',
    sizeKb: 38,
    meta: '680 lines • Slice state tree & action timeline',
    color: '#38BDF8',
    status: 'optimal',
    advice: 'Multi-tab subview with live state diffing',
  },
  {
    id: 'ts-3',
    name: 'NetworkTab.tsx',
    path: 'src/components/Inspector/NetworkTab.tsx',
    ext: 'TSX',
    category: 'typescript',
    sizeKb: 15,
    meta: '486 lines • Network request virtualization list',
    color: '#0EA5E9',
    status: 'optimal',
    advice: 'FlatList windowSize=7 tuned for 60fps',
  },
  {
    id: 'ts-4',
    name: 'SettingsPanel.tsx',
    path: 'src/components/Inspector/SettingsPanel.tsx',
    ext: 'TSX',
    category: 'typescript',
    sizeKb: 65,
    meta: '1,845 lines • Preferences & storage manager',
    color: '#38BDF8',
    status: 'info',
    advice: 'Self-contained settings subviews',
  },
  {
    id: 'ts-5',
    name: 'consoleLogger.ts',
    path: 'src/customHooks/consoleLogger.ts',
    ext: 'TS',
    category: 'typescript',
    sizeKb: 12,
    meta: '360 lines • Metro symbolication bridge',
    color: '#0284C7',
    status: 'optimal',
    advice: 'Zero-overhead in-memory stack capture',
  },
  {
    id: 'ts-6',
    name: 'App.tsx (Playground)',
    path: 'example/App.tsx',
    ext: 'TSX',
    category: 'typescript',
    sizeKb: 25,
    meta: '820 lines • Interactive test scenarios',
    color: '#38BDF8',
    status: 'optimal',
    advice: 'Sample harness for logs, APIs, and Redux',
  },

  // ── JavaScript & Node Modules ──
  {
    id: 'js-1',
    name: 'react-native/Libraries/Renderer',
    path: 'node_modules/react-native/Libraries/Renderer/implementations/ReactNativeRenderer-prod.js',
    ext: 'JS',
    category: 'javascript',
    sizeKb: 480,
    meta: 'Fabric & Paper UI reconciler bundle',
    color: '#6366F1',
    status: 'optimal',
    advice: 'AOT compiled with Hermes Bytecode',
  },
  {
    id: 'js-2',
    name: '@react-navigation/native-stack',
    path: 'node_modules/@react-navigation/native-stack/lib/module/index.js',
    ext: 'JS',
    category: 'javascript',
    sizeKb: 195,
    meta: 'Native screen animation & transition engine',
    color: '#818CF8',
    status: 'optimal',
    advice: 'Optimized modular ES bundle',
  },
  {
    id: 'js-3',
    name: 'axios/dist/esm/axios.js',
    path: 'node_modules/axios/dist/esm/axios.js',
    ext: 'JS',
    category: 'javascript',
    sizeKb: 88,
    meta: 'HTTP client core with interceptors',
    color: '#F59E0B',
    status: 'optimal',
    advice: 'Standard lightweight network adapter',
  },
  {
    id: 'js-4',
    name: 'react-native-svg',
    path: 'node_modules/react-native-svg/lib/module/index.js',
    ext: 'JS',
    category: 'javascript',
    sizeKb: 140,
    meta: 'Native SVG drawing and vector paths',
    color: '#4F46E5',
    status: 'optimal',
    advice: 'Native Fabric/Paper vector bridge',
  },

  // ── Fonts & Typography ──
  {
    id: 'font-1',
    name: 'Inter-Bold.ttf',
    path: 'fonts/Inter-Bold.ttf',
    ext: 'TTF',
    category: 'font',
    sizeKb: 165,
    meta: 'Custom UI Font • Full Latin Charset (480 glyphs)',
    color: '#8B5CF6',
    status: 'info',
    advice: 'High readability modern typography',
  },
  {
    id: 'font-2',
    name: 'Inter-Regular.ttf',
    path: 'fonts/Inter-Regular.ttf',
    ext: 'TTF',
    category: 'font',
    sizeKb: 160,
    meta: 'Custom Body Font • 400 Weight (480 glyphs)',
    color: '#8B5CF6',
    status: 'info',
    advice: 'Applied across inspector UI cards and text',
  },
  {
    id: 'font-3',
    name: 'JetBrainsMono-Regular.ttf',
    path: 'fonts/JetBrainsMono-Regular.ttf',
    ext: 'TTF',
    category: 'font',
    sizeKb: 95,
    meta: 'Monospace Code Font • Raw / Table / Stack Traces',
    color: '#A855F7',
    status: 'optimal',
    advice: 'Crisp font for code snippets and stack traces',
  },

  // ── JSON & Localizations ──
  {
    id: 'json-1',
    name: 'en.json (i18n Translations)',
    path: 'src/i18n/locales/en.json',
    ext: 'JSON',
    category: 'json',
    sizeKb: 18,
    meta: '124 localization translation keys',
    color: '#10B981',
    status: 'optimal',
    advice: 'Static JSON locale dictionary',
  },
  {
    id: 'json-2',
    name: 'package.json',
    path: 'package.json',
    ext: 'JSON',
    category: 'json',
    sizeKb: 3,
    meta: 'Manifest & peer dependencies config',
    color: '#059669',
    status: 'optimal',
    advice: 'Stripped during production bundle export',
  },
];

// ─── Packages / Node Modules Breakdown Data ──────────────────────────────────

const BUNDLE_PACKAGES_DATA: BundlePackageItem[] = [
  {
    id: 'pkg-1',
    name: 'react-native',
    version: '0.85.3',
    sizeKb: 680,
    percentage: 38.5,
    type: 'direct',
    category: 'core',
    color: '#38BDF8',
    description: 'React Native runtime, Fabric UI engine, Native Bridge, and Turbomodules.',
    logoUri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/React-icon.svg/512px-React-icon.svg.png',
  },
  {
    id: 'pkg-2',
    name: '@react-navigation/native-stack',
    version: '^7.16.0',
    sizeKb: 245,
    percentage: 13.9,
    type: 'direct',
    category: 'navigation',
    color: '#818CF8',
    description: 'Native screen router, UIViewController / Fragment animations and transitions.',
    logoUri: 'https://reactnavigation.org/img/spiro.svg',
  },
  {
    id: 'pkg-3',
    name: 'react',
    version: '19.2.3',
    sizeKb: 185,
    percentage: 10.5,
    type: 'direct',
    category: 'core',
    color: '#06B6D4',
    description: 'React core virtual DOM reconciler, hooks engine, and JSX runtime.',
    logoUri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/React-icon.svg/512px-React-icon.svg.png',
  },
  {
    id: 'pkg-4',
    name: 'react-native-svg',
    version: '^15.15.5',
    sizeKb: 140,
    percentage: 7.9,
    type: 'direct',
    category: 'ui',
    color: '#F472B6',
    description: 'Scalable Vector Graphics XML parser and native canvas path rasterizer.',
    logoUri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/SVG_logo.svg/512px-SVG_logo.svg.png',
  },
  {
    id: 'pkg-5',
    name: 'react-native-screens',
    version: '^4.25.2',
    sizeKb: 110,
    percentage: 6.2,
    type: 'transitive',
    category: 'navigation',
    color: '#A78BFA',
    description: 'Native navigation container primitives for iOS and Android memory management.',
    logoUri: 'https://reactnavigation.org/img/spiro.svg',
  },
  {
    id: 'pkg-6',
    name: 'axios',
    version: '^1.17.0',
    sizeKb: 88,
    percentage: 5.0,
    type: 'direct',
    category: 'network',
    color: '#F59E0B',
    description: 'HTTP client, request/response interceptors, and adapter pipelines.',
    logoUri: 'https://axios-http.com/assets/logo.svg',
  },
  {
    id: 'pkg-7',
    name: 'react-native-linear-gradient',
    version: '^2.8.3',
    sizeKb: 45,
    percentage: 2.5,
    type: 'direct',
    category: 'ui',
    color: '#FB7185',
    description: 'Hardware accelerated native gradient drawing shaders.',
    logoUri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/React-icon.svg/512px-React-icon.svg.png',
  },
  {
    id: 'pkg-8',
    name: 'i18next & react-i18next',
    version: '^26.3.6',
    sizeKb: 62,
    percentage: 3.5,
    type: 'direct',
    category: 'utils',
    color: '#10B981',
    description: 'Internationalization framework, language interpolator, and locale switcher.',
    logoUri: 'https://raw.githubusercontent.com/i18next/i18next/master/assets/i18next-logo.png',
  },
];

const CATEGORY_TABS = [
  {key: 'ALL', label: 'All Files', icon: '📁'},
  {key: 'UNUSED', label: 'Not Consumed (Dead)', icon: '🚫'},
  {key: 'CONSUMED', label: 'In-Use / Active', icon: '⚡'},
  {key: 'image', label: 'Images & Media', icon: '🖼️'},
  {key: 'typescript', label: 'TypeScript / TSX', icon: '📜'},
  {key: 'javascript', label: 'JS & Node Modules', icon: '⚙️'},
  {key: 'font', label: 'Fonts & Glyphs', icon: '🔤'},
  {key: 'json', label: 'JSON & Data', icon: '📄'},
];

const CATEGORY_COLORS: Record<FileTypeCategory, {label: string; color: string; bg: string}> = {
  image: {label: 'Images & Media', color: '#EC4899', bg: '#FCE7F3'},
  typescript: {label: 'TypeScript', color: '#0EA5E9', bg: '#E0F2FE'},
  javascript: {label: 'JavaScript', color: '#6366F1', bg: '#EEF2FF'},
  font: {label: 'Fonts', color: '#8B5CF6', bg: '#F3E8FF'},
  json: {label: 'JSON / Data', color: '#10B981', bg: '#D1FAE5'},
};

const BundleTab = React.memo(() => {
  const {t} = useTranslation();
  const [activeSubTab, setActiveSubTab] = useState<BundleSubTab>('overview');
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('ALL');

  // Check if Hermes is running
  const isHermes = Boolean((global as any).HermesInternal);

  // Group summary calculations
  const summary = useMemo(() => {
    let imagesKb = 0;
    let tsKb = 0;
    let jsKb = 0;
    let fontsKb = 0;
    let jsonKb = 0;
    let imagesCount = 0;
    let tsCount = 0;
    let jsCount = 0;
    let fontsCount = 0;
    let jsonCount = 0;

    BUNDLE_FILES_DATA.forEach(f => {
      if (f.category === 'image') {
        imagesKb += f.sizeKb;
        imagesCount++;
      } else if (f.category === 'typescript') {
        tsKb += f.sizeKb;
        tsCount++;
      } else if (f.category === 'javascript') {
        jsKb += f.sizeKb;
        jsCount++;
      } else if (f.category === 'font') {
        fontsKb += f.sizeKb;
        fontsCount++;
      } else if (f.category === 'json') {
        jsonKb += f.sizeKb;
        jsonCount++;
      }
    });

    const totalKb = imagesKb + tsKb + jsKb + fontsKb + jsonKb;

    return {
      totalKb,
      totalMb: (totalKb / 1024).toFixed(2),
      totalCount: BUNDLE_FILES_DATA.length,
      images: {
        count: imagesCount,
        kb: imagesKb,
        pct: Number(((imagesKb / totalKb) * 100).toFixed(1)),
      },
      ts: {
        count: tsCount,
        kb: tsKb,
        pct: Number(((tsKb / totalKb) * 100).toFixed(1)),
      },
      js: {
        count: jsCount,
        kb: jsKb,
        pct: Number(((jsKb / totalKb) * 100).toFixed(1)),
      },
      fonts: {
        count: fontsCount,
        kb: fontsKb,
        pct: Number(((fontsKb / totalKb) * 100).toFixed(1)),
      },
      json: {
        count: jsonCount,
        kb: jsonKb,
        pct: Number(((jsonKb / totalKb) * 100).toFixed(1)),
      },
    };
  }, []);

  // Filtered files
  const filteredFiles = useMemo(() => {
    return BUNDLE_FILES_DATA.filter(file => {
      const matchSearch =
        !search ||
        file.name.toLowerCase().includes(search.toLowerCase()) ||
        file.path.toLowerCase().includes(search.toLowerCase()) ||
        file.ext.toLowerCase().includes(search.toLowerCase()) ||
        file.meta.toLowerCase().includes(search.toLowerCase());
      const matchCategory =
        activeCategory === 'ALL'
          ? true
          : activeCategory === 'UNUSED'
          ? file.isConsumed === false
          : activeCategory === 'CONSUMED'
          ? file.isConsumed !== false
          : file.category === activeCategory;
      return matchSearch && matchCategory;
    });
  }, [search, activeCategory]);

  const filteredTotalKb = useMemo(() => {
    return filteredFiles.reduce((acc, f) => acc + f.sizeKb, 0);
  }, [filteredFiles]);

  // Tree View State & Node Generation
  const [filesViewMode, setFilesViewMode] = useState<'tree' | 'list'>('tree');
  const [collapsedFolders, setCollapsedFolders] = useState<Record<string, boolean>>({});

  const fileTreeNodes = useMemo(() => {
    return buildBundleFileTree(filteredFiles);
  }, [filteredFiles]);

  const toggleFolder = useCallback((path: string) => {
    setCollapsedFolders(prev => ({
      ...prev,
      [path]: !prev[path],
    }));
  }, []);

  const expandAllFolders = useCallback(() => {
    setCollapsedFolders({});
  }, []);

  const collapseAllFolders = useCallback(() => {
    const all: Record<string, boolean> = {};
    function collect(nodes: TreeNode[]) {
      for (const n of nodes) {
        if (n.isFolder) {
          all[n.fullPath] = true;
          collect(n.children);
        }
      }
    }
    collect(fileTreeNodes);
    setCollapsedFolders(all);
  }, [fileTreeNodes]);

  // Filtered Packages
  const filteredPackages = useMemo(() => {
    if (!search) return BUNDLE_PACKAGES_DATA;
    const q = search.toLowerCase();
    return BUNDLE_PACKAGES_DATA.filter(
      pkg =>
        pkg.name.toLowerCase().includes(q) ||
        pkg.description.toLowerCase().includes(q) ||
        pkg.category.toLowerCase().includes(q),
    );
  }, [search]);

  const packagesTotalKb = useMemo(() => {
    return filteredPackages.reduce((acc, p) => acc + p.sizeKb, 0);
  }, [filteredPackages]);

  // Media files (Images + Fonts)
  const mediaFiles = useMemo(() => {
    return BUNDLE_FILES_DATA.filter(
      f => f.category === 'image' || f.category === 'font',
    );
  }, []);

  const mediaTotalKb = useMemo(() => {
    return mediaFiles.reduce((acc, m) => acc + m.sizeKb, 0);
  }, [mediaFiles]);

  const subTabs = [
    {
      key: 'overview',
      label: 'Overview',
      icon: (isActive: boolean) => (
        <LiveStateIcon color={isActive ? AppColors.white : AppColors.purple} size={12} />
      ),
    },
    {
      key: 'files',
      label: `Files (${BUNDLE_FILES_DATA.length})`,
      icon: (isActive: boolean) => (
        <LayersIcon color={isActive ? AppColors.white : AppColors.purple} size={12} />
      ),
    },
    {
      key: 'packages',
      label: `Packages (${BUNDLE_PACKAGES_DATA.length})`,
      icon: (isActive: boolean) => (
        <PackageIcon color={isActive ? AppColors.white : AppColors.purple} size={12} />
      ),
    },
    {
      key: 'media',
      label: `Media (${mediaFiles.length})`,
      icon: (isActive: boolean) => (
        <StorageIcon color={isActive ? AppColors.white : AppColors.purple} size={12} />
      ),
    },
    {
      key: 'optimizer',
      label: 'Optimizer',
      icon: (isActive: boolean) => (
        <MetadataIcon color={isActive ? AppColors.white : AppColors.purple} size={12} />
      ),
    },
  ];

  return (
    <View style={{flex: 1, backgroundColor: AppColors.grayBackground}}>
      {/* ─── Top Sub-Tabs Navigation Bar (Scrollable Pill Bar) ─── */}
      <View style={bundleStyles.topTabWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={bundleStyles.subTabsScroll}>
          {subTabs.map(tab => {
            const isActive = activeSubTab === tab.key;
            return (
              <TouchableScale
                key={tab.key}
                onPress={() => setActiveSubTab(tab.key as BundleSubTab)}
                style={[
                  bundleStyles.subTabPill,
                  isActive && bundleStyles.subTabPillActive,
                ]}>
                {tab.icon(isActive)}
                <Text
                  style={[
                    bundleStyles.subTabPillText,
                    isActive && bundleStyles.subTabPillTextActive,
                  ]}>
                  {tab.label}
                </Text>
              </TouchableScale>
            );
          })}
        </ScrollView>
      </View>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* ── 1. TAB: OVERVIEW & TREEMAP ───────────────────────────────────────── */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeSubTab === 'overview' && (
        <ScrollView
          style={{flex: 1}}
          contentContainerStyle={bundleStyles.contentContainer}
          keyboardShouldPersistTaps="handled">
          
          {/* Hero Overview Card */}
          <View style={bundleStyles.heroCard}>
            <View style={bundleStyles.heroTopRow}>
              <View style={bundleStyles.heroIconWrap}>
                <PackageIcon color={AppColors.brandPurple} size={24} />
              </View>
              <View style={{flex: 1}}>
                <Text style={bundleStyles.heroTitle}>Bundle & Asset Architecture</Text>
                <Text style={bundleStyles.heroSubtitle}>
                  Real-time size breakdown across all assets, code, and dependencies
                </Text>
              </View>
              <CopyButton
                value={() => summary}
                label="Bundle Overview JSON"
              />
            </View>

            {/* 4-Stat Metric Grid */}
            <View style={bundleStyles.metricsGrid}>
              <View style={bundleStyles.metricBox}>
                <Text style={bundleStyles.metricLabel}>TOTAL BUNDLE ASSETS</Text>
                <Text style={bundleStyles.metricValue}>~{summary.totalMb} MB</Text>
                <Text style={bundleStyles.metricHint}>{BUNDLE_FILES_DATA.length} Tracked files</Text>
              </View>

              <View style={bundleStyles.metricBox}>
                <Text style={bundleStyles.metricLabel}>IMAGES & MEDIA</Text>
                <Text style={[bundleStyles.metricValue, {color: '#EC4899'}]}>
                  {summary.images.kb} KB
                </Text>
                <Text style={bundleStyles.metricHint}>{summary.images.pct}% of package</Text>
              </View>

              <View style={bundleStyles.metricBox}>
                <Text style={bundleStyles.metricLabel}>TS / JS SOURCE</Text>
                <Text style={[bundleStyles.metricValue, {color: '#0EA5E9'}]}>
                  {summary.ts.kb + summary.js.kb} KB
                </Text>
                <Text style={bundleStyles.metricHint}>
                  {(summary.ts.pct + summary.js.pct).toFixed(1)}% of package
                </Text>
              </View>

              <View style={bundleStyles.metricBox}>
                <Text style={bundleStyles.metricLabel}>JS ENGINE</Text>
                <View style={{flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2}}>
                  <View
                    style={[
                      bundleStyles.statusIndicator,
                      {backgroundColor: isHermes ? AppColors.greenColor : AppColors.darkOrange},
                    ]}
                  />
                  <Text style={bundleStyles.metricValue}>
                    {isHermes ? 'Hermes' : 'JSC'}
                  </Text>
                </View>
                <Text style={bundleStyles.metricHint}>{isHermes ? 'Bytecode AOT' : 'Standard'}</Text>
              </View>
            </View>
          </View>

          {/* Visual Type Distribution Ratio Bar */}
          <View style={bundleStyles.sectionCard}>
            <View style={bundleStyles.sectionHeaderRow}>
              <View>
                <Text style={bundleStyles.sectionTitle}>Asset & File Type Ratio Treemap</Text>
                <Text style={bundleStyles.sectionSub}>Total ~{summary.totalMb} MB</Text>
              </View>
              <CopyButton
                value={() => ({
                  totalMb: summary.totalMb,
                  totalKb: summary.totalKb,
                  images: summary.images,
                  ts: summary.ts,
                  js: summary.js,
                  fonts: summary.fonts,
                  json: summary.json,
                })}
                label="Ratio Treemap JSON"
              />
            </View>

            {/* Stacked Colored Bar */}
            <View style={bundleStyles.treemapBar}>
              <View style={{flex: summary.images.pct, backgroundColor: '#EC4899', height: 16}} />
              <View style={{flex: summary.ts.pct, backgroundColor: '#0EA5E9', height: 16}} />
              <View style={{flex: summary.js.pct, backgroundColor: '#6366F1', height: 16}} />
              <View style={{flex: summary.fonts.pct, backgroundColor: '#8B5CF6', height: 16}} />
              <View style={{flex: summary.json.pct, backgroundColor: '#10B981', height: 16}} />
            </View>

            {/* Legend Grid */}
            <View style={bundleStyles.legendGrid}>
              <View style={bundleStyles.legendItem}>
                <View style={[bundleStyles.legendDot, {backgroundColor: '#EC4899'}]} />
                <Text style={bundleStyles.legendText}>
                  🖼️ Images: <Text style={bundleStyles.legendVal}>{summary.images.kb} KB ({summary.images.pct}%)</Text>
                </Text>
              </View>
              <View style={bundleStyles.legendItem}>
                <View style={[bundleStyles.legendDot, {backgroundColor: '#0EA5E9'}]} />
                <Text style={bundleStyles.legendText}>
                  📜 TS/TSX: <Text style={bundleStyles.legendVal}>{summary.ts.kb} KB ({summary.ts.pct}%)</Text>
                </Text>
              </View>
              <View style={bundleStyles.legendItem}>
                <View style={[bundleStyles.legendDot, {backgroundColor: '#6366F1'}]} />
                <Text style={bundleStyles.legendText}>
                  ⚙️ JS Libs: <Text style={bundleStyles.legendVal}>{summary.js.kb} KB ({summary.js.pct}%)</Text>
                </Text>
              </View>
              <View style={bundleStyles.legendItem}>
                <View style={[bundleStyles.legendDot, {backgroundColor: '#8B5CF6'}]} />
                <Text style={bundleStyles.legendText}>
                  🔤 Fonts: <Text style={bundleStyles.legendVal}>{summary.fonts.kb} KB ({summary.fonts.pct}%)</Text>
                </Text>
              </View>
              <View style={bundleStyles.legendItem}>
                <View style={[bundleStyles.legendDot, {backgroundColor: '#10B981'}]} />
                <Text style={bundleStyles.legendText}>
                  📄 JSON: <Text style={bundleStyles.legendVal}>{summary.json.kb} KB ({summary.json.pct}%)</Text>
                </Text>
              </View>
            </View>
          </View>

          {/* Detailed Category Footprint Cards */}
          <View style={bundleStyles.sectionCard}>
            <View style={bundleStyles.sectionHeaderRow}>
              <Text style={bundleStyles.sectionTitle}>Category Breakdown</Text>
              <CopyButton
                value={() => ({
                  totalAssets: summary.totalCount,
                  totalSizeKb: summary.totalKb,
                  categories: {
                    images: summary.images,
                    javascript: summary.js,
                    fonts: summary.fonts,
                    typescript: summary.ts,
                    json: summary.json,
                  },
                })}
                label="Categories Breakdown JSON"
              />
            </View>
            
            {[
              {
                icon: '🖼️',
                title: 'Images & Media Assets',
                count: summary.images.count,
                size: `${summary.images.kb} KB`,
                pct: summary.images.pct,
                color: '#EC4899',
                desc: 'PNG, WebP, SVG, and JPG assets in bundle',
              },
              {
                icon: '⚙️',
                title: 'Compiled Node Modules & JS',
                count: summary.js.count,
                size: `${summary.js.kb} KB`,
                pct: summary.js.pct,
                color: '#6366F1',
                desc: 'Third-party dependencies and native bridges',
              },
              {
                icon: '🔤',
                title: 'Custom Fonts & Vector Glyphs',
                count: summary.fonts.count,
                size: `${summary.fonts.kb} KB`,
                pct: summary.fonts.pct,
                color: '#8B5CF6',
                desc: 'Inter, JetBrainsMono, and UI typography fonts',
              },
              {
                icon: '📜',
                title: 'TypeScript & JSX Components',
                count: summary.ts.count,
                size: `${summary.ts.kb} KB`,
                pct: summary.ts.pct,
                color: '#0EA5E9',
                desc: 'App screen components, hooks, and business logic',
              },
              {
                icon: '📄',
                title: 'JSON Data & Localizations',
                count: summary.json.count,
                size: `${summary.json.kb} KB`,
                pct: summary.json.pct,
                color: '#10B981',
                desc: 'i18n translation dictionaries and static configs',
              },
            ].map((cat, cIdx) => (
              <View key={cIdx} style={bundleStyles.catRowCard}>
                <View style={bundleStyles.catRowTop}>
                  <Text style={bundleStyles.catRowIcon}>{cat.icon}</Text>
                  <View style={{flex: 1}}>
                    <Text style={bundleStyles.catRowTitle}>{cat.title}</Text>
                    <Text style={bundleStyles.catRowDesc}>{cat.count} items • {cat.desc}</Text>
                  </View>
                  <View style={{alignItems: 'flex-end'}}>
                    <Text style={bundleStyles.catRowSize}>{cat.size}</Text>
                    <Text style={bundleStyles.catRowPct}>{cat.pct}%</Text>
                  </View>
                </View>
                <View style={bundleStyles.catProgressTrack}>
                  <View
                    style={[
                      bundleStyles.catProgressBar,
                      {width: `${cat.pct}%`, backgroundColor: cat.color},
                    ]}
                  />
                </View>
              </View>
            ))}

            {/* Total Summation Card */}
            <View style={bundleStyles.totalSummaryCard}>
              <View style={bundleStyles.totalSummaryRow}>
                <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
                  <PackageIcon color={AppColors.purple} size={16} />
                  <Text style={bundleStyles.totalSummaryLabel}>TOTAL BUNDLE ASSETS</Text>
                </View>
                <Text style={bundleStyles.totalSummaryValue}>
                  {summary.totalKb} KB (~{summary.totalMb} MB)
                </Text>
              </View>
              <Text style={bundleStyles.totalSummaryFormula}>
                Sum: {summary.images.kb} KB + {summary.js.kb} KB + {summary.fonts.kb} KB + {summary.ts.kb} KB + {summary.json.kb} KB = {summary.totalKb} KB ({summary.totalCount} items • 100%)
              </Text>
            </View>
          </View>
        </ScrollView>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* ── 2. TAB: FILES BREAKDOWN ─────────────────────────────────────────── */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeSubTab === 'files' && (
        <View style={{flex: 1}}>
          {/* Search & Category Filter */}
          <View style={bundleStyles.filterContainer}>
            <View style={bundleStyles.searchRow}>
              <SearchIcon color={AppColors.grayTextWeak} size={15} />
              <TextInput
                placeholder="Search by file name (.png, .tsx, .ttf, path)..."
                placeholderTextColor={AppColors.grayTextWeak}
                value={search}
                onChangeText={setSearch}
                style={bundleStyles.searchInput}
                autoCorrect={false}
                autoCapitalize="none"
              />
              {search.length > 0 && (
                <Pressable onPress={() => setSearch('')} hitSlop={10}>
                  <ClearIcon color={AppColors.grayTextWeak} size={14} />
                </Pressable>
              )}
              <CopyButton
                value={() => filteredFiles}
                label="Filtered Files JSON"
              />
            </View>

            {/* Category Filter Chips */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={bundleStyles.categoryPillsScroll}>
              {CATEGORY_TABS.map(tab => {
                const isActive = activeCategory === tab.key;
                const count =
                  tab.key === 'ALL'
                    ? BUNDLE_FILES_DATA.length
                    : tab.key === 'UNUSED'
                    ? BUNDLE_FILES_DATA.filter(f => f.isConsumed === false).length
                    : tab.key === 'CONSUMED'
                    ? BUNDLE_FILES_DATA.filter(f => f.isConsumed !== false).length
                    : BUNDLE_FILES_DATA.filter(f => f.category === tab.key).length;

                return (
                  <TouchableScale
                    key={tab.key}
                    onPress={() => setActiveCategory(tab.key)}
                    style={[
                      bundleStyles.catPill,
                      isActive && bundleStyles.catPillActive,
                      tab.key === 'UNUSED' && isActive && {backgroundColor: '#EF4444', borderColor: '#DC2626'},
                      tab.key === 'CONSUMED' && isActive && {backgroundColor: '#059669', borderColor: '#047857'},
                    ]}>
                    <Text style={bundleStyles.catPillIcon}>{tab.icon}</Text>
                    <Text
                      style={[
                        bundleStyles.catPillText,
                        isActive && bundleStyles.catPillTextActive,
                      ]}>
                      {tab.label} ({count})
                    </Text>
                  </TouchableScale>
                );
              })}
            </ScrollView>
          </View>

          {/* Files List / Tree Content */}
          <ScrollView
            style={{flex: 1}}
            contentContainerStyle={bundleStyles.contentContainer}
            keyboardShouldPersistTaps="handled">
            
            {/* View Mode Toggle Header Bar */}
            <View style={bundleStyles.treeHeaderRow}>
              <View style={bundleStyles.viewModeToggleGroup}>
                <TouchableScale
                  onPress={() => setFilesViewMode('tree')}
                  style={[
                    bundleStyles.viewModeBtn,
                    filesViewMode === 'tree' && bundleStyles.viewModeBtnActive,
                  ]}>
                  <Text
                    style={[
                      bundleStyles.viewModeBtnText,
                      filesViewMode === 'tree' && bundleStyles.viewModeBtnTextActive,
                    ]}>
                    🌳 Tree View
                  </Text>
                </TouchableScale>
                <TouchableScale
                  onPress={() => setFilesViewMode('list')}
                  style={[
                    bundleStyles.viewModeBtn,
                    filesViewMode === 'list' && bundleStyles.viewModeBtnActive,
                  ]}>
                  <Text
                    style={[
                      bundleStyles.viewModeBtnText,
                      filesViewMode === 'list' && bundleStyles.viewModeBtnTextActive,
                    ]}>
                    📄 Flat List
                  </Text>
                </TouchableScale>
              </View>

              {filesViewMode === 'tree' ? (
                <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
                  <TouchableScale onPress={expandAllFolders}>
                    <Text style={bundleStyles.treeActionLink}>Expand</Text>
                  </TouchableScale>
                  <Text style={{color: AppColors.grayTextWeak, fontSize: 11}}>•</Text>
                  <TouchableScale onPress={collapseAllFolders}>
                    <Text style={bundleStyles.treeActionLink}>Collapse</Text>
                  </TouchableScale>
                </View>
              ) : (
                <Text style={bundleStyles.listHeaderCount}>
                  Showing {filteredFiles.length} of {BUNDLE_FILES_DATA.length} files
                </Text>
              )}
            </View>

            {/* ── MODE 1: DIRECTORY TREE VIEW ── */}
            {filesViewMode === 'tree' ? (
              <View style={bundleStyles.treeRootContainer}>
                {fileTreeNodes.map((node, nIdx) => (
                  <BundleTreeNodeView
                    key={node.id}
                    node={node}
                    level={0}
                    search={search}
                    totalBundleKb={summary.totalKb}
                    collapsedFolders={collapsedFolders}
                    toggleFolder={toggleFolder}
                    isLastChild={nIdx === fileTreeNodes.length - 1}
                  />
                ))}
              </View>
            ) : (
              /* ── MODE 2: FLAT LIST VIEW ── */
              filteredFiles.map((file, index) => {
                const categoryMeta = CATEGORY_COLORS[file.category] || CATEGORY_COLORS.typescript;
                const pctOfTotal = ((file.sizeKb / summary.totalKb) * 100).toFixed(1);
                const isUnused = file.isConsumed === false;

                return (
                  <View key={file.id} style={[bundleStyles.fileCard, isUnused && bundleStyles.treeFileCardUnused]}>
                    <View style={bundleStyles.fileCardTop}>
                      <View style={bundleStyles.sNoBadge}>
                        <Text style={bundleStyles.sNoText}>#{index + 1}</Text>
                      </View>

                      <MediaPreviewThumbnail file={file} />

                      <View style={{flex: 1, paddingHorizontal: 4}}>
                        <View style={{flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap'}}>
                          <HighlightText
                            text={file.name}
                            search={search}
                            style={bundleStyles.fileName}
                            highlightStyle={bundleStyles.searchHighlight}
                          />
                          {isUnused ? (
                            <View style={bundleStyles.unusedBadge}>
                              <Text style={bundleStyles.unusedBadgeText}>🚫 Not Consumed</Text>
                            </View>
                          ) : (
                            <View style={bundleStyles.consumedBadge}>
                              <Text style={bundleStyles.consumedBadgeText}>⚡ Consumed</Text>
                            </View>
                          )}
                        </View>
                        <HighlightText
                          text={file.path}
                          search={search}
                          style={bundleStyles.filePath}
                          highlightStyle={bundleStyles.searchHighlight}
                          numberOfLines={1}
                        />
                      </View>

                      <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
                        <View style={bundleStyles.fileSizeBox}>
                          <Text style={[bundleStyles.fileSizeKb, isUnused && {color: '#B45309'}]}>
                            {file.sizeKb >= 1024
                              ? `${(file.sizeKb / 1024).toFixed(2)} MB`
                              : `${file.sizeKb} KB`}
                          </Text>
                          <Text style={bundleStyles.filePercent}>{pctOfTotal}%</Text>
                        </View>
                        <CopyButton
                          value={() => file}
                          label="File Details JSON"
                        />
                      </View>
                    </View>

                    <View style={bundleStyles.fileProgressTrack}>
                      <View
                        style={[
                          bundleStyles.fileProgressBar,
                          {
                            width: `${Math.min(100, Math.max(4, Number(pctOfTotal) * 4))}%`,
                            backgroundColor: isUnused ? '#EF4444' : categoryMeta.color,
                          },
                        ]}
                      />
                    </View>

                    <View style={bundleStyles.fileCardBottom}>
                      <Text style={bundleStyles.fileMetaText}>{file.meta}</Text>
                      {file.advice && (
                        <View style={[
                          bundleStyles.adviceBadge,
                          file.status === 'warning' && bundleStyles.adviceWarning,
                          file.status === 'optimal' && bundleStyles.adviceOptimal,
                          isUnused && bundleStyles.adviceUnused,
                        ]}>
                          <Text style={[
                            bundleStyles.adviceText,
                            file.status === 'warning' && {color: '#B45309'},
                            file.status === 'optimal' && {color: '#047857'},
                            isUnused && {color: '#DC2626'},
                          ]}>
                            {isUnused ? '🗑️ ' : file.status === 'warning' ? '💡 ' : '✨ '}
                            {file.advice}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>

          {/* Sticky Total Bundle Size Footer */}
          <View style={bundleStyles.stickyFooterBar}>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
              <LayersIcon color={AppColors.purple} size={14} />
              <Text style={bundleStyles.footerTitle}>
                {filteredFiles.length} of {summary.totalCount} Files
              </Text>
            </View>
            <Text style={bundleStyles.footerSizeVal}>
              {filteredTotalKb} KB ({ (filteredTotalKb / 1024).toFixed(2) } MB)
            </Text>
          </View>
        </View>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* ── 3. TAB: PACKAGES & NODE_MODULES ─────────────────────────────────── */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeSubTab === 'packages' && (
        <View style={{flex: 1}}>
          <ScrollView
            style={{flex: 1}}
            contentContainerStyle={bundleStyles.contentContainer}
            keyboardShouldPersistTaps="handled">
            
            <View style={bundleStyles.filterContainer}>
              <View style={bundleStyles.searchRow}>
                <SearchIcon color={AppColors.grayTextWeak} size={15} />
                <TextInput
                  placeholder="Search package (react-native, axios, navigation)..."
                  placeholderTextColor={AppColors.grayTextWeak}
                  value={search}
                  onChangeText={setSearch}
                  style={bundleStyles.searchInput}
                  autoCorrect={false}
                  autoCapitalize="none"
                />
                {search.length > 0 && (
                  <Pressable onPress={() => setSearch('')} hitSlop={10}>
                    <ClearIcon color={AppColors.grayTextWeak} size={14} />
                  </Pressable>
                )}
                <CopyButton
                  value={() => filteredPackages}
                  label="Dependencies JSON"
                />
              </View>
            </View>

            <Text style={bundleStyles.listHeaderCount}>
              Showing {filteredPackages.length} dependencies
            </Text>

            {filteredPackages.map((pkg, index) => (
              <View key={pkg.id} style={bundleStyles.fileCard}>
                {/* Header Row: #s.no + Logo + Package Name + Version Pill + Size & Copy */}
                <View style={bundleStyles.fileCardTop}>
                  <View style={bundleStyles.sNoBadge}>
                    <Text style={bundleStyles.sNoText}>#{index + 1}</Text>
                  </View>

                  <PackageLogoRenderer
                    name={pkg.name}
                    color={pkg.color}
                    size={28}
                  />

                  <View style={{flex: 1, paddingHorizontal: 4}}>
                    <View style={{flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap'}}>
                      <HighlightText
                        text={pkg.name}
                        search={search}
                        style={bundleStyles.fileName}
                        highlightStyle={bundleStyles.searchHighlight}
                      />
                      <View style={bundleStyles.versionPill}>
                        <Text style={bundleStyles.versionPillText}>
                          v{pkg.version.replace(/^\^/, '')}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
                    <View style={bundleStyles.fileSizeBox}>
                      <Text style={bundleStyles.fileSizeKb}>{pkg.sizeKb} KB</Text>
                      <Text style={bundleStyles.filePercent}>{pkg.percentage}%</Text>
                    </View>
                    <CopyButton
                      value={() => pkg}
                      label="Package Details JSON"
                    />
                  </View>
                </View>

                {/* Subtitle Row: Category Chip + Description */}
                <View style={{flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4, marginBottom: 2}}>
                  <View style={[bundleStyles.pkgBadge, {backgroundColor: `${pkg.color}1F`, borderColor: `${pkg.color}4D`}]}>
                    <Text style={[bundleStyles.pkgBadgeText, {color: pkg.color}]}>
                      {pkg.category.toUpperCase()}
                    </Text>
                  </View>
                  <Text style={[bundleStyles.filePath, {flex: 1, marginTop: 0}]} numberOfLines={1}>
                    {pkg.description}
                  </Text>
                </View>

                <View style={bundleStyles.fileProgressTrack}>
                  <View
                    style={[
                      bundleStyles.fileProgressBar,
                      {width: `${pkg.percentage * 2}%`, backgroundColor: pkg.color},
                    ]}
                  />
                </View>

                <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 2}}>
                  <View style={bundleStyles.typeTag}>
                    <Text style={bundleStyles.typeTagText}>
                      {pkg.type === 'direct' ? '📦 Direct Dependency' : '🔗 Transitive Peer'}
                    </Text>
                  </View>
                  <Text style={bundleStyles.fileMetaText}>
                    ~{pkg.sizeKb} KB minified
                  </Text>
                </View>
              </View>
            ))}
          </ScrollView>

          {/* Sticky Total Package Size Footer */}
          <View style={bundleStyles.stickyFooterBar}>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
              <PackageIcon color={AppColors.purple} size={14} />
              <Text style={bundleStyles.footerTitle}>
                {filteredPackages.length} Dependencies
              </Text>
            </View>
            <Text style={bundleStyles.footerSizeVal}>
              {packagesTotalKb} KB ({ (packagesTotalKb / 1024).toFixed(2) } MB)
            </Text>
          </View>
        </View>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* ── 4. TAB: MEDIA & ASSET AUDITOR ───────────────────────────────────── */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeSubTab === 'media' && (
        <View style={{flex: 1}}>
          <ScrollView
            style={{flex: 1}}
            contentContainerStyle={bundleStyles.contentContainer}
            keyboardShouldPersistTaps="handled">
            
            <View style={bundleStyles.tipsCard}>
              <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8}}>
                <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
                  <StorageIcon color={AppColors.purple} size={18} />
                  <Text style={bundleStyles.tipsHeading}>Media Compression Auditor</Text>
                </View>
                <CopyButton
                  value={() => mediaFiles}
                  label="Media Assets JSON"
                />
              </View>
              <Text style={bundleStyles.tipDesc}>
                Images & Fonts constitute <Text style={{fontFamily: AppFonts.interBold, color: AppColors.purple}}>{summary.images.pct + summary.fonts.pct}%</Text> of total assets (~{summary.images.kb + summary.fonts.kb} KB). Converting PNGs to WebP and font subsetting can reduce size by up to <Text style={{fontFamily: AppFonts.interBold, color: '#047857'}}>540 KB</Text>.
              </Text>
            </View>

            <Text style={bundleStyles.listHeaderCount}>
              Media Assets & Fonts ({mediaFiles.length} items)
            </Text>

            {mediaFiles.map((file, index) => (
              <View key={file.id} style={bundleStyles.fileCard}>
                <View style={bundleStyles.fileCardTop}>
                  <View style={bundleStyles.sNoBadge}>
                    <Text style={bundleStyles.sNoText}>#{index + 1}</Text>
                  </View>

                  <MediaPreviewThumbnail file={file} />

                  <View style={{flex: 1}}>
                    <Text style={bundleStyles.fileName}>{file.name}</Text>
                    <Text style={bundleStyles.filePath}>{file.path}</Text>
                  </View>

                  <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
                    <View style={bundleStyles.fileSizeBox}>
                      <Text style={bundleStyles.fileSizeKb}>{file.sizeKb} KB</Text>
                    </View>
                    <CopyButton
                      value={() => file}
                      label="Media Item JSON"
                    />
                  </View>
                </View>

                <View style={bundleStyles.fileCardBottom}>
                  <Text style={bundleStyles.fileMetaText}>{file.meta}</Text>
                  {file.advice && (
                    <View style={[
                      bundleStyles.adviceBadge,
                      file.status === 'warning' && bundleStyles.adviceWarning,
                      file.status === 'optimal' && bundleStyles.adviceOptimal,
                    ]}>
                      <Text style={[
                        bundleStyles.adviceText,
                        file.status === 'warning' && {color: '#B45309'},
                        file.status === 'optimal' && {color: '#047857'},
                      ]}>
                        {file.status === 'warning' ? '💡 ' : '✨ '}
                        {file.advice}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            ))}
          </ScrollView>

          {/* Sticky Total Media Size Footer */}
          <View style={bundleStyles.stickyFooterBar}>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
              <StorageIcon color={AppColors.purple} size={14} />
              <Text style={bundleStyles.footerTitle}>
                {mediaFiles.length} Media & Fonts
              </Text>
            </View>
            <Text style={bundleStyles.footerSizeVal}>
              {mediaTotalKb} KB ({ (mediaTotalKb / 1024).toFixed(2) } MB)
            </Text>
          </View>
        </View>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* ── 5. TAB: OPTIMIZER CHECKLIST ─────────────────────────────────────── */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeSubTab === 'optimizer' && (
        <ScrollView
          style={{flex: 1}}
          contentContainerStyle={bundleStyles.contentContainer}
          keyboardShouldPersistTaps="handled">
          
          <View style={bundleStyles.tipsCard}>
            <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12}}>
              <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
                <CircleAlertIcon color={AppColors.purple} size={18} />
                <Text style={bundleStyles.tipsHeading}>React Native Bundle Optimization Checklist</Text>
              </View>
              <CopyButton
                value={() => [
                  'Convert Heavy PNGs to WebP / SVGs (High Impact)',
                  `Enable Hermes Bytecode Engine (${isHermes ? 'Active' : 'Action Required'})`,
                  'Font Subsetting & Weight Pruning (Medium Impact)',
                  'Selective Path Imports Tree-shaking (Best Practice)',
                  'Screen Lazy-Loading (Best Practice)',
                ]}
                label="Optimization Checklist"
              />
            </View>

            {[
              {
                title: '🖼️ Convert Heavy PNGs to WebP / SVGs',
                desc: 'Images account for >40% of final app download size. Converting 2x/3x raster PNGs to WebP saves 60-70% size with no visible fidelity loss.',
                badge: 'High Impact',
                badgeColor: '#EC4899',
              },
              {
                title: '📜 Enable Hermes Bytecode Engine',
                desc: isHermes
                  ? '✅ Hermes is active! JavaScript is compiled into optimized bytecode Ahead-Of-Time.'
                  : '⚠️ Hermes is disabled. Enable hermes in your app config for ~40% smaller payload and instant TTI startup.',
                badge: isHermes ? 'Active' : 'Action Required',
                badgeColor: isHermes ? '#10B981' : '#F59E0B',
              },
              {
                title: '🔤 Font Subsetting & Weight Pruning',
                desc: 'Include only the font weights you actively use (e.g. Regular & Bold). Remove unused glyph ranges to save 100KB+ per font file.',
                badge: 'Medium Impact',
                badgeColor: '#8B5CF6',
              },
              {
                title: '🌲 Selective Path Imports (Tree-shaking)',
                desc: 'Import from specific subpaths (e.g. lodash/get or specific vector icon sets) instead of importing large monolithic packages.',
                badge: 'Best Practice',
                badgeColor: '#0EA5E9',
              },
              {
                title: '⚡ Screen Lazy-Loading',
                desc: 'Lazy load secondary screens and heavy modal sheets using dynamic imports and InteractionManager to reduce initial bundle evaluation.',
                badge: 'Best Practice',
                badgeColor: '#6366F1',
              },
            ].map((tip, tIdx) => (
              <View key={tIdx} style={bundleStyles.tipItem}>
                <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2}}>
                  <View style={{flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1}}>
                    <View style={bundleStyles.sNoBadge}>
                      <Text style={bundleStyles.sNoText}>#{tIdx + 1}</Text>
                    </View>
                    <Text style={bundleStyles.tipTitle}>{tip.title}</Text>
                  </View>
                  <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
                    <View style={[bundleStyles.impactBadge, {backgroundColor: `${tip.badgeColor}1F`, borderColor: `${tip.badgeColor}4D`}]}>
                      <Text style={[bundleStyles.impactBadgeText, {color: tip.badgeColor}]}>
                        {tip.badge}
                      </Text>
                    </View>
                    <CopyButton
                      value={() => tip}
                      label="Tip Details"
                    />
                  </View>
                </View>
                <Text style={bundleStyles.tipDesc}>{tip.desc}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );
});

const bundleStyles = StyleSheet.create({
  topTabWrap: {
    backgroundColor: AppColors.white,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.dividerColor,
  },
  subTabsScroll: {
    paddingHorizontal: 12,
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  subTabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: AppColors.grayBackground,
    borderWidth: 1,
    borderColor: AppColors.dividerColor,
  },
  subTabPillActive: {
    backgroundColor: AppColors.brandPurple,
    borderColor: AppColors.brandPurple,
    shadowColor: AppColors.brandPurple,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  subTabPillText: {
    fontFamily: AppFonts.interMedium,
    fontSize: 11.5,
    color: AppColors.grayTextStrong,
  },
  subTabPillTextActive: {
    fontFamily: AppFonts.interBold,
    color: AppColors.white,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
    gap: 14,
  },
  heroCard: {
    backgroundColor: AppColors.white,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: AppColors.dividerColor,
    shadowColor: AppColors.primaryBlack,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  heroIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: `${AppColors.brandPurple}12`,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: `${AppColors.brandPurple}25`,
  },
  heroTitle: {
    fontFamily: AppFonts.interBold,
    fontSize: 16,
    color: AppColors.primaryBlack,
  },
  heroSubtitle: {
    fontFamily: AppFonts.interRegular,
    fontSize: 12,
    color: AppColors.grayTextWeak,
    marginTop: 2,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metricBox: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: AppColors.grayBackground,
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: AppColors.dividerColor,
  },
  metricLabel: {
    fontFamily: AppFonts.interBold,
    fontSize: 9.5,
    color: AppColors.grayTextWeak,
    letterSpacing: 0.5,
  },
  metricValue: {
    fontFamily: AppFonts.interBold,
    fontSize: 14,
    color: AppColors.primaryBlack,
    marginTop: 3,
  },
  metricHint: {
    fontFamily: AppFonts.interMedium,
    fontSize: 10.5,
    color: AppColors.grayText,
    marginTop: 2,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  sectionCard: {
    backgroundColor: AppColors.white,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: AppColors.dividerColor,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontFamily: AppFonts.interBold,
    fontSize: 13,
    color: AppColors.primaryBlack,
  },
  sectionSub: {
    fontFamily: AppFonts.interMedium,
    fontSize: 11,
    color: AppColors.grayTextWeak,
  },
  treemapBar: {
    flexDirection: 'row',
    borderRadius: 6,
    overflow: 'hidden',
    height: 16,
    marginBottom: 12,
    backgroundColor: AppColors.slate200,
  },
  legendGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    minWidth: '45%',
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontFamily: AppFonts.interMedium,
    fontSize: 11,
    color: AppColors.grayTextStrong,
  },
  legendVal: {
    fontFamily: AppFonts.interBold,
    color: AppColors.primaryBlack,
  },
  catRowCard: {
    backgroundColor: AppColors.grayBackground,
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: AppColors.dividerColor,
  },
  catRowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  catRowIcon: {
    fontSize: 16,
  },
  catRowTitle: {
    fontFamily: AppFonts.interBold,
    fontSize: 12,
    color: AppColors.primaryBlack,
  },
  catRowDesc: {
    fontFamily: AppFonts.interRegular,
    fontSize: 10,
    color: AppColors.grayTextWeak,
  },
  catRowSize: {
    fontFamily: AppFonts.interBold,
    fontSize: 12,
    color: AppColors.primaryBlack,
  },
  catRowPct: {
    fontFamily: AppFonts.interMedium,
    fontSize: 10,
    color: AppColors.grayTextWeak,
  },
  catProgressTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: `${AppColors.slate200}`,
    overflow: 'hidden',
  },
  catProgressBar: {
    height: '100%',
    borderRadius: 2,
  },
  filterContainer: {
    backgroundColor: AppColors.white,
    borderRadius: 12,
    padding: 10,
    marginHorizontal: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: AppColors.dividerColor,
    gap: 8,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.grayBackground,
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 36,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: AppFonts.interRegular,
    fontSize: 12,
    color: AppColors.primaryBlack,
    padding: 0,
  },
  categoryPillsScroll: {
    gap: 6,
    paddingVertical: 2,
  },
  catPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    backgroundColor: AppColors.grayBackground,
    borderWidth: 1,
    borderColor: AppColors.dividerColor,
  },
  catPillActive: {
    backgroundColor: AppColors.brandPurple,
    borderColor: AppColors.brandPurple,
  },
  catPillIcon: {
    fontSize: 11,
  },
  catPillText: {
    fontFamily: AppFonts.interMedium,
    fontSize: 11,
    color: AppColors.grayTextStrong,
  },
  catPillTextActive: {
    fontFamily: AppFonts.interBold,
    color: AppColors.white,
  },
  listHeaderCount: {
    fontFamily: AppFonts.interMedium,
    fontSize: 11,
    color: AppColors.grayTextWeak,
    paddingHorizontal: 4,
  },
  treeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
    marginBottom: 6,
  },
  viewModeToggleGroup: {
    flexDirection: 'row',
    backgroundColor: AppColors.grayBackground,
    borderRadius: 8,
    padding: 2,
    borderWidth: 1,
    borderColor: AppColors.dividerColor,
  },
  viewModeBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  viewModeBtnActive: {
    backgroundColor: AppColors.brandPurple,
    shadowColor: AppColors.brandPurple,
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  viewModeBtnText: {
    fontFamily: AppFonts.interMedium,
    fontSize: 11,
    color: AppColors.grayTextStrong,
  },
  viewModeBtnTextActive: {
    fontFamily: AppFonts.interBold,
    color: AppColors.white,
  },
  treeActionLink: {
    fontFamily: AppFonts.interBold,
    fontSize: 11.5,
    color: AppColors.purple,
  },
  treeRootContainer: {
    gap: 6,
  },
  treeFolderContainer: {
    backgroundColor: AppColors.white,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: AppColors.dividerColor,
    overflow: 'hidden',
    marginBottom: 6,
  },
  treeFolderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingRight: 10,
    backgroundColor: `${AppColors.purple}08`,
    borderBottomWidth: 1,
    borderBottomColor: `${AppColors.purple}14`,
  },
  treeFolderChevron: {
    fontSize: 11,
    color: AppColors.purple,
    fontFamily: AppFonts.interBold,
    width: 14,
  },
  treeFolderName: {
    fontFamily: AppFonts.interBold,
    fontSize: 12.5,
    color: AppColors.primaryBlack,
  },
  treeCountBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
    backgroundColor: `${AppColors.purple}1A`,
  },
  treeCountBadgeText: {
    fontFamily: AppFonts.interMedium,
    fontSize: 10,
    color: AppColors.purple,
  },
  treeFolderSize: {
    fontFamily: AppFonts.interBold,
    fontSize: 11.5,
    color: AppColors.primaryBlack,
  },
  treeChildrenWrap: {
    borderLeftColor: `${AppColors.purple}26`,
    paddingVertical: 6,
    paddingRight: 8,
    gap: 4,
  },
  treeFileCard: {
    backgroundColor: AppColors.white,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: AppColors.dividerColor,
    marginBottom: 4,
  },
  treeBranchGlyph: {
    width: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  treeBranchGlyphText: {
    fontFamily: AppFonts.interRegular,
    fontSize: 11,
    color: AppColors.grayTextWeak,
  },
  fileCard: {
    backgroundColor: AppColors.white,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: AppColors.dividerColor,
    gap: 6,
    marginBottom: 8,
  },
  fileCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sNoBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: `${AppColors.purple}14`,
    borderWidth: 1,
    borderColor: `${AppColors.purple}30`,
    minWidth: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sNoText: {
    fontFamily: AppFonts.interBold,
    fontSize: 10,
    color: AppColors.purple,
  },
  extChip: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 5,
    borderWidth: 1,
  },
  extChipText: {
    fontFamily: AppFonts.interBold,
    fontSize: 10,
    letterSpacing: 0.4,
  },
  pkgBadge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 5,
    borderWidth: 1,
  },
  pkgBadgeText: {
    fontFamily: AppFonts.interBold,
    fontSize: 9,
    letterSpacing: 0.4,
  },
  pkgLogoWrap: {
    borderRadius: 7,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppColors.white,
    borderColor: AppColors.dividerColor,
    overflow: 'hidden',
  },
  pkgLogoFallbackText: {
    fontFamily: AppFonts.interBold,
  },
  mediaThumbWrap: {
    width: 32,
    height: 32,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: AppColors.grayBackground,
    borderWidth: 1,
    borderColor: AppColors.dividerColor,
  },
  mediaThumbImg: {
    width: '100%',
    height: '100%',
  },
  fileName: {
    fontFamily: AppFonts.interBold,
    fontSize: 12.5,
    color: AppColors.primaryBlack,
  },
  versionPill: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    backgroundColor: `${AppColors.purple}14`,
    borderWidth: 1,
    borderColor: `${AppColors.purple}26`,
  },
  versionPillText: {
    fontFamily: AppFonts.interMedium,
    fontSize: 10,
    color: AppColors.purple,
  },
  pkgVersion: {
    fontFamily: AppFonts.interMedium,
    fontSize: 11,
    color: AppColors.grayTextWeak,
  },
  filePath: {
    fontFamily: AppFonts.interRegular,
    fontSize: 10.5,
    color: AppColors.grayTextWeak,
    marginTop: 1,
  },
  fileSizeBox: {
    alignItems: 'flex-end',
  },
  fileSizeKb: {
    fontFamily: AppFonts.interBold,
    fontSize: 12,
    color: AppColors.primaryBlack,
  },
  filePercent: {
    fontFamily: AppFonts.interMedium,
    fontSize: 10,
    color: AppColors.grayTextWeak,
  },
  fileProgressTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: AppColors.grayBackground,
    overflow: 'hidden',
    marginVertical: 2,
  },
  fileProgressBar: {
    height: '100%',
    borderRadius: 2,
  },
  fileCardBottom: {
    gap: 4,
  },
  fileMetaText: {
    fontFamily: AppFonts.interRegular,
    fontSize: 10.5,
    color: AppColors.grayTextWeak,
  },
  typeTag: {
    backgroundColor: AppColors.grayBackground,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: AppColors.dividerColor,
  },
  typeTagText: {
    fontFamily: AppFonts.interMedium,
    fontSize: 9.5,
    color: AppColors.grayText,
  },
  unusedBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  unusedBadgeText: {
    fontFamily: AppFonts.interBold,
    fontSize: 9.5,
    color: '#DC2626',
  },
  consumedBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  consumedBadgeText: {
    fontFamily: AppFonts.interBold,
    fontSize: 9.5,
    color: '#059669',
  },
  treeFolderChevronWrap: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: `${AppColors.purple}14`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  treeFileCardUnused: {
    borderColor: '#FECACA',
    backgroundColor: '#FFFBFB',
  },
  adviceUnused: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  adviceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 2,
  },
  adviceWarning: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  adviceOptimal: {
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  adviceText: {
    fontFamily: AppFonts.interMedium,
    fontSize: 10.5,
    lineHeight: 14,
  },
  impactBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  impactBadgeText: {
    fontFamily: AppFonts.interBold,
    fontSize: 9,
  },
  searchHighlight: {
    backgroundColor: '#FEF08A',
    color: '#854D0E',
    fontFamily: AppFonts.interBold,
  },
  tipsCard: {
    backgroundColor: '#FAF5FF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  tipsHeading: {
    fontFamily: AppFonts.interBold,
    fontSize: 13.5,
    color: '#6B21A8',
  },
  totalSummaryCard: {
    marginTop: 10,
    backgroundColor: `${AppColors.purple}0D`,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: `${AppColors.purple}26`,
    gap: 4,
  },
  totalSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalSummaryLabel: {
    fontFamily: AppFonts.interBold,
    fontSize: 11,
    color: AppColors.purple,
    letterSpacing: 0.5,
  },
  totalSummaryValue: {
    fontFamily: AppFonts.interBold,
    fontSize: 13,
    color: AppColors.primaryBlack,
  },
  totalSummaryFormula: {
    fontFamily: AppFonts.interRegular,
    fontSize: 10.5,
    color: AppColors.grayText,
    lineHeight: 15,
  },
  stickyFooterBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: AppColors.white,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: AppColors.dividerColor,
    shadowColor: AppColors.primaryBlack,
    shadowOffset: {width: 0, height: -2},
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  footerTitle: {
    fontFamily: AppFonts.interBold,
    fontSize: 12,
    color: AppColors.primaryBlack,
  },
  footerSizeVal: {
    fontFamily: AppFonts.interBold,
    fontSize: 12.5,
    color: AppColors.purple,
  },
  tipItem: {
    marginBottom: 12,
    backgroundColor: AppColors.white,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  tipTitle: {
    fontFamily: AppFonts.interBold,
    fontSize: 12,
    color: '#581C87',
  },
  tipDesc: {
    fontFamily: AppFonts.interRegular,
    fontSize: 11,
    color: '#6B7280',
    lineHeight: 16,
    marginTop: 4,
  },
});

export default BundleTab;
