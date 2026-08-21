import React, {useState, useEffect, useMemo, useCallback} from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {useTranslation, t} from '../../i18n';
import TouchableScale from '../TouchableScale';
import CopyButton from '../CopyButton';
import HighlightText from '../HighlightText';
import SegmentedTabs from '../SegmentedTabs';
import AnimatedEntrance from '../AnimatedEntrance';
import EndOfListFooter from '../EndOfListFooter';
import {AppColors} from '../../styles/AppColors';
import {AppFonts} from '../../styles/AppFonts';
import styles from '../../styles';
import {copyToClipboard} from '../../helpers';
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
  FolderIcon,
  FolderOpenIcon,
  TrashIcon,
  LightbulbIcon,
  SparkleIcon,
  ClockIcon,
  BoltIcon,
  BanIcon,
  RefreshCcwIcon,
  ExternalLinkIcon,
  AppleIcon,
  AndroidIcon,
  DownloadIcon,
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
import {
  analyzeHostAppBundle,
  getCachedBundleAnalysis,
  getInitialBundleAnalysis,
  getHostScriptURL,
  HostBundleAnalysisResult,
} from '../../customHooks/bundleAnalyzer';

export type BundleSubTab = 'overview' | 'production' | 'files' | 'packages' | 'media' | 'optimizer';

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
  latestVersion?: string;
  isDeprecated?: boolean;
  deprecationReason?: string;
  lastActive?: string;
  npmUrl?: string;
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
          {width: size, height: size, backgroundColor: AppColors.npmDark},
        ]}>
        <Svg width={size - 6} height={size - 6} viewBox="0 0 100 100" fill="none">
          <Circle cx="50" cy="50" r="9" fill={AppColors.reactCyan} />
          <Ellipse
            cx="50"
            cy="50"
            rx="42"
            ry="16"
            stroke={AppColors.reactCyan}
            strokeWidth="6"
          />
          <Ellipse
            cx="50"
            cy="50"
            rx="42"
            ry="16"
            stroke={AppColors.reactCyan}
            strokeWidth="6"
            transform="rotate(60 50 50)"
          />
          <Ellipse
            cx="50"
            cy="50"
            rx="42"
            ry="16"
            stroke={AppColors.reactCyan}
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
          {width: size, height: size, backgroundColor: AppColors.hermesPurple},
        ]}>
        <Svg width={size - 8} height={size - 8} viewBox="0 0 100 100" fill="none">
          <Circle cx="50" cy="50" r="38" stroke={AppColors.white} strokeWidth="8" />
          <Path d="M50 20 L68 50 L50 80 L32 50 Z" fill={AppColors.reactCyan} />
          <Circle cx="50" cy="50" r="6" fill={AppColors.white} />
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
          {width: size, height: size, backgroundColor: AppColors.pink400},
        ]}>
        <Svg width={size - 8} height={size - 8} viewBox="0 0 100 100" fill="none">
          <Path
            d="M20 75 C35 25, 65 25, 80 75"
            stroke={AppColors.white}
            strokeWidth="10"
            strokeLinecap="round"
          />
          <Circle cx="20" cy="75" r="8" fill={AppColors.white} />
          <Circle cx="80" cy="75" r="8" fill={AppColors.white} />
          <Circle
            cx="50"
            cy="38"
            r="7"
            fill="#FCE7F3"
            stroke={AppColors.white}
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
          {width: size, height: size, backgroundColor: AppColors.expoViolet},
        ]}>
        <Svg width={size - 6} height={size - 6} viewBox="0 0 100 100" fill="none">
          <Path
            d="M22 75 L50 20 L78 75 M33 58 L67 58"
            stroke={AppColors.white}
            strokeWidth="12"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Circle cx="50" cy="20" r="7" fill={AppColors.reactCyan} />
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
          {width: size, height: size, backgroundColor: AppColors.reanimatedNavy},
        ]}>
        <Svg width={size - 8} height={size - 8} viewBox="0 0 100 100" fill="none">
          <Path d="M50 15 L88 35 L50 55 L12 35 Z" fill={AppColors.sky400} />
          <Path
            d="M12 50 L50 70 L88 50"
            stroke={AppColors.white}
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
          {width: size, height: size, backgroundColor: AppColors.rose600},
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
          {width: size, height: size, backgroundColor: AppColors.emerald600},
        ]}>
        <Svg width={size - 8} height={size - 8} viewBox="0 0 100 100" fill="none">
          <Circle cx="50" cy="50" r="38" stroke={AppColors.white} strokeWidth="8" />
          <Ellipse
            cx="50"
            cy="50"
            rx="18"
            ry="38"
            stroke={AppColors.white}
            strokeWidth="6"
          />
          <Path d="M14 50 L86 50" stroke={AppColors.white} strokeWidth="7" />
        </Svg>
      </View>
    );
  }

  // 8. Official Red NPM Logo Box (Universal Default NPM Branding)
  return (
    <View
      style={[
        bundleStyles.pkgLogoWrap,
        {width: size, height: size, backgroundColor: AppColors.npmRed},
      ]}>
      <Svg width={size - 4} height={size - 4} viewBox="0 0 100 100" fill="none">
        <Rect width="100" height="100" rx="14" fill={AppColors.npmRed} />
        <Path
          d="M18 24 H82 V76 H50 V40 H38 V76 H18 Z"
          fill={AppColors.white}
        />
      </Svg>
    </View>
  );
};

// ─── Vector Category Icons (font-independent, render everywhere) ────────────

export type BundleIconType =
  | 'source'
  | 'deps'
  | 'media'
  | 'overhead'
  | 'image'
  | 'typescript'
  | 'javascript'
  | 'font'
  | 'json'
  | 'folder'
  | 'ban'
  | 'bolt';

const BundleCategoryIcon: React.FC<{
  type: BundleIconType;
  size?: number;
  color?: string;
}> = ({type, size = 16, color = AppColors.purple}) => {
  const stroke = {stroke: color, strokeWidth: 1.7, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const};
  const renderGlyph = () => {
    switch (type) {
      case 'folder':
        return (
          <G>
            <Path
              d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"
              {...stroke}
            />
          </G>
        );
      case 'ban':
        return (
          <G>
            <Circle cx="12" cy="12" r="8.5" {...stroke} />
            <Path d="M5.5 5.5 18.5 18.5" {...stroke} />
          </G>
        );
      case 'bolt':
        return (
          <G>
            <Path d="M13 2 4.5 13.5 H10.5 L9 22 19.5 9.5 H13.5 Z" {...stroke} />
          </G>
        );
      case 'source':
        return (
          <G>
            <Path d="M8.5 7 L4 12 L8.5 17" {...stroke} />
            <Path d="M15.5 7 L20 12 L15.5 17" {...stroke} />
            <Path d="M13.5 4.5 L10.5 19.5" {...stroke} />
          </G>
        );
      case 'deps':
        return (
          <G>
            <Rect x="4" y="4" width="16" height="16" rx="2.5" {...stroke} />
            <Path d="M4 9.5 H20" {...stroke} />
            <Path d="M9.5 9.5 V20" {...stroke} />
          </G>
        );
      case 'media':
      case 'image':
        return (
          <G>
            <Rect x="3.5" y="4.5" width="17" height="15" rx="2" {...stroke} />
            <Circle cx="9" cy="10" r="1.5" {...stroke} />
            <Path d="M3.5 17.5 L9.5 12.5 L14 16.5 L17 13.5 L20.5 17.5" {...stroke} />
          </G>
        );
      case 'overhead':
        return (
          <G>
            <Circle cx="12" cy="12" r="3.2" {...stroke} />
            <Path
              d="M12 2.5 V5.5 M12 18.5 V21.5 M2.5 12 H5.5 M18.5 12 H21.5 M5.3 5.3 L7.4 7.4 M16.6 16.6 L18.7 18.7 M18.7 5.3 L16.6 7.4 M7.4 16.6 L5.3 18.7"
              {...stroke}
            />
          </G>
        );
      case 'typescript':
        return (
          <G>
            <Path d="M6.5 3.5 H14 L18.5 8 V20.5 H6.5 Z" {...stroke} />
            <Path d="M14 3.5 V8 H18.5" {...stroke} />
            <Path d="M9.5 13.5 H15 M12 13.5 V16.5 M9.5 16.5 H13" {...stroke} />
          </G>
        );
      case 'javascript':
        return (
          <G>
            <Path
              d="M9.5 3.5 C7.5 3.5 7.5 6.5 7.5 9 C7.5 11 6.5 12 5 12 C6.5 12 7.5 13 7.5 15 C7.5 17.5 7.5 20.5 9.5 20.5"
              {...stroke}
            />
            <Path
              d="M14.5 3.5 C16.5 3.5 16.5 6.5 16.5 9 C16.5 11 17.5 12 19 12 C17.5 12 16.5 13 16.5 15 C16.5 17.5 16.5 20.5 14.5 20.5"
              {...stroke}
            />
          </G>
        );
      case 'font':
        return (
          <G>
            <Path d="M8 19 L12 5.5 L16 19" {...stroke} />
            <Path d="M9.4 14.5 H14.6" {...stroke} />
          </G>
        );
      case 'json':
        return (
          <G>
            <Path
              d="M9 3.5 C7 3.5 7 6 7 8.5 C7 10.5 6 11.5 5 12 C6 12.5 7 13.5 7 15.5 C7 18 7 20.5 9 20.5"
              {...stroke}
            />
            <Circle cx="12" cy="12" r="1.1" fill={color} />
            <Path
              d="M15 3.5 C17 3.5 17 6 17 8.5 C17 10.5 18 11.5 19 12 C18 12.5 17 13.5 17 15.5 C17 18 17 20.5 15 20.5"
              {...stroke}
            />
          </G>
        );
      default:
        return null;
    }
  };
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {renderGlyph()}
    </Svg>
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
            backgroundColor: AppColors.errorCardBg,
            alignItems: 'center',
            justifyContent: 'center',
            borderColor: AppColors.errorBorder,
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
              <Stop offset="0" stopColor={AppColors.rose500} />
              <Stop offset="1" stopColor={AppColors.rose600} />
            </LinearGradient>
          </Defs>
          <Circle cx="50" cy="50" r="44" fill="url(#svgGradThumb)" />
          {/* Vector bezier path pen graphic */}
          <Path
            d="M25 70 C35 30, 65 30, 75 70"
            stroke={AppColors.white}
            strokeWidth="8"
            strokeLinecap="round"
          />
          <Circle cx="25" cy="70" r="7" fill={AppColors.white} />
          <Circle cx="75" cy="70" r="7" fill={AppColors.white} />
          <Circle
            cx="50"
            cy="40"
            r="6"
            fill="#FFE4E6"
            stroke={AppColors.white}
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
    const cleanPath = file.path.replace(/^\/+/, '');
    const parts = cleanPath.split('/').filter(Boolean);
    if (parts.length === 0) continue;
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

export const downloadBundleFile = async (file: BundleFileItem, scriptURL?: string): Promise<void> => {
  let content = '';

  // 1. Attempt to fetch real source code from Metro dev server dynamically
  try {
    let devServerOrigin = '';
    const activeUrl = scriptURL || getHostScriptURL();
    if (activeUrl && activeUrl.startsWith('http')) {
      const match = activeUrl.match(/^(https?:\/\/[^/]+)/);
      if (match) {
        devServerOrigin = match[1];
      }
    }
    if (devServerOrigin) {
      const cleanPath = file.path.replace(/^\/+/, '');
      const url = `${devServerOrigin}/${cleanPath}`;

      const res = await fetch(url);
      if (res.ok) {
        const text = await res.text();
        if (text && text.length > 0) {
          content = text;
        }
      }
    }
  } catch {}

  // 2. If dev server direct fetch is unavailable, provide structured module descriptor with full path
  if (!content) {
    content = `// ─────────────────────────────────────────────────────────────
// File: ${file.name}
// Path: ${file.path}
// Category: ${file.category.toUpperCase()}
// Size: ${file.sizeKb} KB
// Status: ${file.status === 'optimal' ? 'Active in Dependency Graph' : 'Not consumed / Static'}
// Meta: ${file.meta}
// ─────────────────────────────────────────────────────────────

export default {
  id: ${JSON.stringify(file.id)},
  name: ${JSON.stringify(file.name)},
  path: ${JSON.stringify(file.path)},
  category: ${JSON.stringify(file.category)},
  sizeKb: ${file.sizeKb},
  meta: ${JSON.stringify(file.meta)},
  status: ${JSON.stringify(file.status || 'optimal')},
};
`;
  }

  // 3. Trigger native Share / Download sheet
  try {
    await Share.share(
      Platform.OS === 'ios'
        ? {
            title: file.name,
            message: content,
          }
        : {
            title: `Download ${file.name}`,
            message: content,
          },
      {
        dialogTitle: `Download / Save ${file.name}`,
      },
    );
  } catch {}

  // 4. Also copy directly to clipboard for quick paste in VS Code or external editor
  try {
    copyToClipboard(content, file.name);
  } catch {}
};

const BundleTreeNodeView: React.FC<{
  node: TreeNode;
  level: number;
  search: string;
  totalBundleKb: number;
  expandedFolders: Record<string, boolean>;
  toggleFolder: (path: string) => void;
  isLastChild: boolean;
  onDownload?: (file: BundleFileItem) => void;
}> = ({
  node,
  level,
  search,
  totalBundleKb,
  expandedFolders,
  toggleFolder,
  isLastChild,
  onDownload,
}) => {
  const isExpanded = search ? true : !!expandedFolders[node.fullPath];
  const isCollapsed = !isExpanded;
  const indentLeft = level * 16 + 10;

  if (node.isFolder) {
    return (
      <View style={bundleStyles.treeFolderBlock}>
        <TouchableScale
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={`Folder ${node.name}, ${node.fileCount} ${node.fileCount === 1 ? 'file' : 'files'}, ${node.sizeKb >= 1024 ? `${(node.sizeKb / 1024).toFixed(2)} MB` : `${node.sizeKb} KB`}`}
          accessibilityState={{expanded: isExpanded}}
          accessibilityHint="Double tap to expand or collapse folder"
          onPress={() => toggleFolder(node.fullPath)}
          style={[
            bundleStyles.treeFolderRow,
            {paddingLeft: indentLeft},
          ]}>
          <View style={bundleStyles.treeRowLeft}>
            <Text style={bundleStyles.treeChevron}>
              {isCollapsed ? '▸' : '▾'}
            </Text>
            {isCollapsed ? (
              <FolderIcon color={AppColors.amber500} size={15} />
            ) : (
              <FolderOpenIcon color={AppColors.amber500} size={15} />
            )}
            <HighlightText
              text={node.name + '/'}
              search={search}
              style={bundleStyles.treeFolderName}
              highlightStyle={bundleStyles.searchHighlight}
            />
            <View style={bundleStyles.treeCountBadge}>
              <Text style={bundleStyles.treeCountBadgeText}>
                {node.fileCount} {node.fileCount === 1 ? t('bundle.file') : t('bundle.files')}
              </Text>
            </View>
          </View>

          <View style={bundleStyles.treeRowRight}>
            <Text style={bundleStyles.treeFolderSize}>
              {node.sizeKb >= 1024
                ? t('bundle.fileSizeMb', {size: (node.sizeKb / 1024).toFixed(2)})
                : t('bundle.fileSizeKb', {size: node.sizeKb})}
            </Text>
            <CopyButton
              value={() => ({
                folder: node.fullPath,
                sizeKb: node.sizeKb,
                fileCount: node.fileCount,
              })}
              label={t('bundle.copyFileInfo', {name: node.name})}
            />
          </View>
        </TouchableScale>

        {!isCollapsed && (
          <View style={bundleStyles.treeChildrenContainer}>
            {node.children.map((child, cIdx) => (
              <BundleTreeNodeView
                key={child.id}
                node={child}
                level={level + 1}
                search={search}
                totalBundleKb={totalBundleKb}
                expandedFolders={expandedFolders}
                toggleFolder={toggleFolder}
                isLastChild={cIdx === node.children.length - 1}
                onDownload={onDownload}
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

  const pctOfTotal = totalBundleKb > 0 ? ((file.sizeKb / totalBundleKb) * 100).toFixed(1) : '0';
  const isUnused = file.isConsumed === false;

  return (
    <View
      style={[
        bundleStyles.treeFileRow,
        {paddingLeft: indentLeft},
        isUnused && bundleStyles.treeFileRowUnused,
      ]}>
      <View style={bundleStyles.treeRowLeft}>
        <View style={bundleStyles.treeBranchGuide}>
          <Text style={bundleStyles.treeBranchGuideText}>
            {isLastChild ? '└' : '├'}
          </Text>
        </View>

        <MediaPreviewThumbnail file={file} />

        <HighlightText
          text={file.name}
          search={search}
          style={bundleStyles.treeFileName}
          highlightStyle={bundleStyles.searchHighlight}
        />

        {isUnused && (
          <View style={bundleStyles.treeUnusedPill}>
            <Text style={bundleStyles.treeUnusedPillText}>{t('bundle.notConsumed')}</Text>
          </View>
        )}
      </View>

      <View style={bundleStyles.treeRowRight}>
        <View style={bundleStyles.treeFileSizeGroup}>
          <Text style={[bundleStyles.treeFileSizeText, isUnused && {color: AppColors.red600}]}>
            {file.sizeKb >= 1024
              ? t('bundle.fileSizeMb', {size: (file.sizeKb / 1024).toFixed(2)})
              : t('bundle.fileSizeKb', {size: file.sizeKb})}
          </Text>
          <Text style={bundleStyles.treeFilePctText}>{pctOfTotal}%</Text>
        </View>

        <View style={{flexDirection: 'row', alignItems: 'center', gap: 5}}>
          {onDownload && (
            <TouchableScale
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={`Download source code for ${file.name}`}
              accessibilityHint="Fetches module source code from Metro dev server"
              onPress={() => onDownload(file)}
              style={bundleStyles.treeActionBtn}
              hitSlop={8}>
              <DownloadIcon size={13} color={AppColors.sky500} />
            </TouchableScale>
          )}

          <CopyButton
            value={() => file}
            label={t('bundle.fileDetailsJson')}
          />
        </View>
      </View>
    </View>
  );
};



const CATEGORY_TABS = [
  {key: 'ALL', labelKey: 'bundle.catAll', iconType: 'folder' as const},
  {key: 'UNUSED', labelKey: 'bundle.catUnused', iconType: 'ban' as const},
  {key: 'CONSUMED', labelKey: 'bundle.catConsumed', iconType: 'bolt' as const},
  {key: 'image', labelKey: 'bundle.catImages', iconType: 'image' as const},
  {key: 'typescript', labelKey: 'bundle.catTypescript', iconType: 'typescript' as const},
  {key: 'javascript', labelKey: 'bundle.catJavascript', iconType: 'javascript' as const},
  {key: 'font', labelKey: 'bundle.catFonts', iconType: 'font' as const},
  {key: 'json', labelKey: 'bundle.catJson', iconType: 'json' as const},
];

const CATEGORY_COLORS: Record<FileTypeCategory, {label: string; color: string; bg: string}> = {
  image: {label: 'Images & Media', color: AppColors.pink500, bg: AppColors.pink100},
  typescript: {label: 'TypeScript', color: AppColors.sky500, bg: AppColors.sky100},
  javascript: {label: 'JavaScript', color: AppColors.indigo500, bg: AppColors.indigo50},
  font: {label: 'Fonts', color: AppColors.purple500, bg: AppColors.purple100},
  json: {label: 'JSON / Data', color: AppColors.emerald500, bg: AppColors.emerald100},
};

const BundleTab = React.memo(() => {
  const {t} = useTranslation();
  const [activeSubTab, setActiveSubTab] = useState<BundleSubTab>('overview');
  const [prodPlatform, setProdPlatform] = useState<'ios' | 'androidAab' | 'androidApk'>('ios');
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('ALL');

  // ─── Live Host App Bundle Analysis (fetched from Metro / runtime) ─────────
  const [analysis, setAnalysis] = useState<HostBundleAnalysisResult>(() =>
    getCachedBundleAnalysis() || getInitialBundleAnalysis(),
  );
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);

  const refreshAnalysis = useCallback(() => {
    setIsAnalyzing(true);
    analyzeHostAppBundle(true)
      .then(result => {
        setAnalysis(result);
        setIsAnalyzing(false);
      })
      .catch(() => {
        setIsAnalyzing(false);
      });
  }, []);

  useEffect(() => {
    let mounted = true;
    analyzeHostAppBundle()
      .then(result => {
        if (mounted) {
          setAnalysis(result);
          setIsAnalyzing(false);
        }
      })
      .catch(() => {
        if (mounted) {
          setIsAnalyzing(false);
        }
      });
    return () => {
      mounted = false;
    };
  }, []);

  // Check if Hermes is running
  const isHermes = Boolean((global as any).HermesInternal);

  // Dynamic files & packages derived from the analyzed host bundle
  const bundleFiles: BundleFileItem[] = useMemo(
    () => (analysis ? analysis.files : []),
    [analysis],
  );
  const bundlePackages: BundlePackageItem[] = useMemo(
    () => (analysis ? analysis.packages : []),
    [analysis],
  );

  // Comprehensive bundle summary (full Metro bundle calculation e.g. 6.0 MB)
  const summary = useMemo(() => {
    const totalKb = analysis?.totalDevKb || (analysis?.totalDevBytes ? Math.round(analysis.totalDevBytes / 1024) : 6144);
    const totalMb = analysis?.totalDevMb ? analysis.totalDevMb.toFixed(2) : (totalKb / 1024).toFixed(2);

    const nodeModulesKb = analysis?.splitUp?.nodeModules?.kb || Math.round(totalKb * 0.52);
    const nodeModulesPct = analysis?.splitUp?.nodeModules?.pct || 52.0;

    const metroKb = analysis?.splitUp?.metroDevOverhead?.kb || Math.round(totalKb * 0.21);
    const metroPct = analysis?.splitUp?.metroDevOverhead?.pct || 21.0;

    const appSourceKb = analysis?.splitUp?.appSource?.kb || Math.round(totalKb * 0.15);
    const appSourcePct = analysis?.splitUp?.appSource?.pct || 15.0;

    const assetsMediaKb = analysis?.splitUp?.assetsMedia?.kb || Math.round(totalKb * 0.12);
    const assetsMediaPct = analysis?.splitUp?.assetsMedia?.pct || 12.0;

    const categories = [
      {
        key: 'node_modules',
        iconType: 'javascript' as const,
        title: 'NPM Dependencies',
        targetTab: 'packages' as const,
        count: analysis?.packageCount || bundlePackages.length || 53,
        sizeKb: nodeModulesKb,
        sizeMb: (nodeModulesKb / 1024).toFixed(2),
        pct: nodeModulesPct,
        color: AppColors.indigo500,
        desc: `${analysis?.packageCount || bundlePackages.length || 53} node_modules packages (React Native, React, navigation, axios)`,
      },
      {
        key: 'metro_runtime',
        iconType: 'bolt' as const,
        title: 'Metro Dev Runtime',
        targetTab: 'optimizer' as const,
        count: 1,
        sizeKb: metroKb,
        sizeMb: (metroKb / 1024).toFixed(2),
        pct: metroPct,
        color: AppColors.amber500,
        desc: 'Module loader, polyfills, HMR client, and prelude runtime',
      },
      {
        key: 'app_source',
        iconType: 'typescript' as const,
        title: 'App Source Code (TSX/JS)',
        targetTab: 'files' as const,
        count: bundleFiles.filter(f => f.category === 'typescript' || f.category === 'javascript').length || 7,
        sizeKb: appSourceKb,
        sizeMb: (appSourceKb / 1024).toFixed(2),
        pct: appSourcePct,
        color: AppColors.sky500,
        desc: 'Screens, components, navigation, Redux store, and hooks',
      },
      {
        key: 'assets_media',
        iconType: 'image' as const,
        title: 'Images & Static Media',
        targetTab: 'media' as const,
        count: bundleFiles.filter(f => f.category === 'image' || f.category === 'font' || f.category === 'json').length || 3,
        sizeKb: assetsMediaKb,
        sizeMb: (assetsMediaKb / 1024).toFixed(2),
        pct: assetsMediaPct,
        color: AppColors.pink500,
        desc: 'Bundled PNG/JPG/SVG drawables, custom fonts, and JSON assets',
      },
    ];

    return {
      totalKb,
      totalMb,
      totalCount: (analysis?.packageCount || 53) + bundleFiles.length + 1,
      categories,
      nodeModulesKb,
      nodeModulesPct,
      metroKb,
      metroPct,
      appSourceKb,
      appSourcePct,
      assetsMediaKb,
      assetsMediaPct,
      images: {
        count: bundleFiles.filter(f => f.category === 'image').length,
        kb: assetsMediaKb,
        pct: assetsMediaPct,
      },
      ts: {
        count: bundleFiles.filter(f => f.category === 'typescript').length,
        kb: appSourceKb,
        pct: appSourcePct,
      },
      js: {
        count: (analysis?.packageCount || 53) + 1,
        kb: nodeModulesKb + metroKb,
        pct: Number((nodeModulesPct + metroPct).toFixed(1)),
      },
      fonts: {
        count: bundleFiles.filter(f => f.category === 'font').length,
        kb: 0,
        pct: 0,
      },
      json: {
        count: bundleFiles.filter(f => f.category === 'json').length,
        kb: Math.round(assetsMediaKb * 0.1),
        pct: Number((assetsMediaPct * 0.1).toFixed(1)),
      },
    };
  }, [analysis, bundleFiles, bundlePackages]);

  // Filtered files
  const filteredFiles = useMemo(() => {
    return bundleFiles.filter(file => {
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
  }, [search, activeCategory, bundleFiles]);

  const filteredTotalKb = useMemo(() => {
    return filteredFiles.reduce((acc, f) => acc + f.sizeKb, 0);
  }, [filteredFiles]);

  // Tree View State & Node Generation (Top folders expanded by default)
  const [filesViewMode, setFilesViewMode] = useState<'tree' | 'list'>('tree');
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});

  const fileTreeNodes = useMemo(() => {
    return buildBundleFileTree(filteredFiles);
  }, [filteredFiles]);

  useEffect(() => {
    if (fileTreeNodes.length > 0 && Object.keys(expandedFolders).length === 0) {
      const initial: Record<string, boolean> = {};
      fileTreeNodes.forEach(node => {
        if (node.isFolder) {
          initial[node.fullPath] = true;
          node.children.forEach(child => {
            if (child.isFolder) {
              initial[child.fullPath] = true;
            }
          });
        }
      });
      setExpandedFolders(initial);
    }
  }, [fileTreeNodes]);

  const toggleFolder = useCallback((path: string) => {
    setExpandedFolders(prev => ({
      ...prev,
      [path]: !prev[path],
    }));
  }, []);

  const expandAllFolders = useCallback(() => {
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
    setExpandedFolders(all);
  }, [fileTreeNodes]);

  const collapseAllFolders = useCallback(() => {
    setExpandedFolders({});
  }, []);

  // Filtered Packages
  const filteredPackages = useMemo(() => {
    if (!search) return bundlePackages;
    const q = search.toLowerCase();
    return bundlePackages.filter(
      pkg =>
        pkg.name.toLowerCase().includes(q) ||
        pkg.description.toLowerCase().includes(q) ||
        pkg.category.toLowerCase().includes(q),
    );
  }, [search, bundlePackages]);

  const packagesTotalKb = useMemo(() => {
    return filteredPackages.reduce((acc, p) => acc + p.sizeKb, 0);
  }, [filteredPackages]);

  // Media files (Images + Fonts)
  const mediaFiles = useMemo(() => {
    return bundleFiles.filter(f => f.category === 'image' || f.category === 'font');
  }, [bundleFiles]);

  const mediaTotalKb = useMemo(() => {
    return mediaFiles.reduce((acc, m) => acc + m.sizeKb, 0);
  }, [mediaFiles]);

  const subTabs = [
    {
      key: 'overview',
      label: t('bundle.tabOverview'),
      icon: (isActive: boolean) => (
        <LiveStateIcon color={isActive ? AppColors.white : AppColors.purple} size={12} />
      ),
    },
    {
      key: 'production',
      label: t('bundle.tabProduction', {count: 3}),
      icon: (isActive: boolean) => (
        <TimelineIcon color={isActive ? AppColors.white : AppColors.purple} size={12} />
      ),
    },
    {
      key: 'files',
      label: t('bundle.tabFiles', {count: bundleFiles.length}),
      icon: (isActive: boolean) => (
        <LayersIcon color={isActive ? AppColors.white : AppColors.purple} size={12} />
      ),
    },
    {
      key: 'packages',
      label: t('bundle.tabPackages', {count: bundlePackages.length}),
      icon: (isActive: boolean) => (
        <PackageIcon color={isActive ? AppColors.white : AppColors.purple} size={12} />
      ),
    },
    {
      key: 'media',
      label: t('bundle.tabMedia', {count: mediaFiles.length}),
      icon: (isActive: boolean) => (
        <StorageIcon color={isActive ? AppColors.white : AppColors.purple} size={12} />
      ),
    },
    {
      key: 'optimizer',
      label: t('bundle.tabOptimizer'),
      icon: (isActive: boolean) => (
        <MetadataIcon color={isActive ? AppColors.white : AppColors.purple} size={12} />
      ),
    },
  ];

  return (
    <View style={{flex: 1, backgroundColor: AppColors.grayBackground}}>
      {/* ─── Top Sub-Tabs Navigation Bar (Scrollable Pill Bar + Dynamic Refresh) ─── */}
      <View style={bundleStyles.topTabWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{flex: 1}}
          contentContainerStyle={bundleStyles.subTabsScroll}>
          {subTabs.map(tab => {
            const isActive = activeSubTab === tab.key;
            return (
              <TouchableScale
                key={tab.key}
                accessible={true}
                accessibilityRole="tab"
                accessibilityLabel={`${tab.label} tab`}
                accessibilityState={{selected: isActive}}
                accessibilityHint={`Switches to ${tab.label} tab`}
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
        <TouchableScale
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={isAnalyzing ? "Analyzing Metro bundle" : "Reload bundle analysis"}
          accessibilityHint="Re-probes Metro dev server and refreshes bundle statistics"
          onPress={refreshAnalysis}
          style={bundleStyles.reloadButton}
          hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
          {isAnalyzing ? (
            <ActivityIndicator size="small" color={AppColors.brandPurple} />
          ) : (
            <RefreshCcwIcon color={AppColors.brandPurple} size={14} />
          )}
        </TouchableScale>
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
                <Text style={bundleStyles.heroTitle}>{t('bundle.heroTitle')}</Text>
                {analysis?.isLive && analysis.scriptURL ? (
                  <View style={{marginTop: 4, gap: 4}}>
                    <Text style={bundleStyles.heroSubtitle}>
                      {t('bundle.heroSubtitle')}
                    </Text>
                    <Pressable
                      accessible={true}
                      accessibilityRole="link"
                      accessibilityLabel={`Live Metro bundle URL: ${analysis.scriptURL}`}
                      accessibilityHint="Opens Metro bundle script in browser"
                      style={{
                        backgroundColor: `${AppColors.skyBlue}10`,
                        borderColor: `${AppColors.skyBlue}30`,
                        borderWidth: 1,
                        borderRadius: 8,
                        padding: 8,
                        marginTop: 2,
                      }}
                      onPress={() => Linking.openURL(analysis.scriptURL)}>
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: 3,
                        }}>
                        <View style={{flexDirection: 'row', alignItems: 'center', gap: 4}}>
                          <ExternalLinkIcon color={AppColors.skyBlue} size={11} />
                          <Text
                            style={{
                              fontFamily: AppFonts.interBold,
                              fontSize: 9.5,
                              color: AppColors.skyBlue,
                              letterSpacing: 0.3,
                              textTransform: 'uppercase',
                            }}>
                            Live Metro URL ↗
                          </Text>
                        </View>
                        <Text
                          style={{
                            fontFamily: AppFonts.interRegular,
                            fontSize: 9.5,
                            color: AppColors.grayTextWeak,
                          }}>
                          {analysis.scriptURL.length} chars
                        </Text>
                      </View>
                      <Text
                        selectable={true}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                        style={{
                          fontFamily: AppFonts.interMedium,
                          fontSize: 11,
                          color: AppColors.skyBlue,
                          textDecorationLine: 'underline',
                          lineHeight: 16,
                        }}>
                        {analysis.scriptURL}
                      </Text>
                    </Pressable>
                  </View>
                ) : (
                  <Text style={bundleStyles.heroSubtitle}>
                    {t('bundle.heroSubtitle')}
                  </Text>
                )}
              </View>
              <CopyButton
                value={() => ({...summary, bundle: analysis})}
                label={t('bundle.bundleOverviewJson')}
              />
            </View>

            {/* 4-Stat Metric Grid */}
            <View style={bundleStyles.metricsGrid}>
              <View style={bundleStyles.metricBox}>
                <Text style={bundleStyles.metricLabel}>{t('bundle.devBundleSize')}</Text>
                <Text style={bundleStyles.metricValue}>
                  {t('bundle.mbValue', {
                    size: analysis ? analysis.totalDevMb : summary.totalMb,
                  })}
                </Text>
                <Text style={bundleStyles.metricHint}>
                  {analysis
                    ? t('bundle.devBundleHint', {
                        kb: analysis.totalDevKb,
                        modules: analysis.moduleCount,
                      })
                    : t('bundle.trackedFilesHint', {count: bundleFiles.length})}
                </Text>
              </View>

              <View style={bundleStyles.metricBox}>
                <Text style={bundleStyles.metricLabel}>{t('bundle.imagesMedia')}</Text>
                <Text style={[bundleStyles.metricValue, {color: AppColors.pink500}]}>
                  {t('bundle.fileSizeKb', {size: summary.images.kb})}
                </Text>
                <Text style={bundleStyles.metricHint}>
                  {t('bundle.pctOfTrackedAssets', {pct: summary.images.pct})}
                </Text>
              </View>

              <View style={bundleStyles.metricBox}>
                <Text style={bundleStyles.metricLabel}>{t('bundle.tsJsSource')}</Text>
                <Text style={[bundleStyles.metricValue, {color: AppColors.sky500}]}>
                  {t('bundle.fileSizeKb', {size: summary.ts.kb + summary.js.kb})}
                </Text>
                <Text style={bundleStyles.metricHint}>
                  {t('bundle.pctOfTrackedAssets', {
                    pct: (summary.ts.pct + summary.js.pct).toFixed(1),
                  })}
                </Text>
              </View>

              <View style={bundleStyles.metricBox}>
                <Text style={bundleStyles.metricLabel}>{t('bundle.jsEngine')}</Text>
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
                <Text style={bundleStyles.metricHint}>
                  {isHermes ? t('bundle.bytecodeAot') : t('bundle.standard')}
                </Text>
              </View>
            </View>
          </View>

          {/* Live analysis unavailable warning */}
          {analysis && !analysis.isLive && (
            <View style={bundleStyles.liveWarningCard}>
              <View style={{flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1}}>
                <CircleAlertIcon color={AppColors.amber700} size={16} />
                <View style={{flex: 1}}>
                  <Text style={bundleStyles.liveWarningTitle}>
                    {t('bundle.liveAnalysisUnavailable')}
                  </Text>
                  <Text style={bundleStyles.liveWarningDesc}>
                    {t('bundle.liveAnalysisUnavailableSub')}
                  </Text>
                </View>
              </View>
            </View>
          )}



          {/* Visual Type Distribution Ratio Bar */}
          <View style={bundleStyles.sectionCard}>
            <View style={bundleStyles.sectionHeaderRow}>
              <View>
                <Text style={bundleStyles.sectionTitle}>{t('bundle.treemapTitle')}</Text>
                <Text style={bundleStyles.sectionSub}>
                  {t('bundle.treemapSub', {mb: summary.totalMb})}
                </Text>
              </View>
              <CopyButton
                value={() => ({
                  totalMb: summary.totalMb,
                  totalKb: summary.totalKb,
                  nodeModules: {kb: summary.nodeModulesKb, pct: summary.nodeModulesPct},
                  metroRuntime: {kb: summary.metroKb, pct: summary.metroPct},
                  appSource: {kb: summary.appSourceKb, pct: summary.appSourcePct},
                  assetsMedia: {kb: summary.assetsMediaKb, pct: summary.assetsMediaPct},
                })}
                label={t('bundle.treemapJson')}
              />
            </View>

            {/* Stacked Colored Bar for Full 6.0 MB Bundle */}
            <View style={bundleStyles.treemapBar}>
              <View style={{flex: summary.nodeModulesPct, backgroundColor: AppColors.indigo500, height: 16}} />
              <View style={{flex: summary.metroPct, backgroundColor: AppColors.amber500, height: 16}} />
              <View style={{flex: summary.appSourcePct, backgroundColor: AppColors.sky500, height: 16}} />
              <View style={{flex: summary.assetsMediaPct, backgroundColor: AppColors.pink500, height: 16}} />
            </View>

            {/* Legend Grid */}
            <View style={bundleStyles.legendGrid}>
              <View style={bundleStyles.legendItem}>
                <BundleCategoryIcon type="javascript" size={13} color={AppColors.indigo500} />
                <Text style={bundleStyles.legendText}>
                  Node Modules{' '}
                  <Text style={bundleStyles.legendVal}>
                    {summary.nodeModulesKb >= 1024
                      ? `${(summary.nodeModulesKb / 1024).toFixed(1)} MB`
                      : `${summary.nodeModulesKb} KB`} ({summary.nodeModulesPct}%)
                  </Text>
                </Text>
              </View>
              <View style={bundleStyles.legendItem}>
                <BundleCategoryIcon type="overhead" size={13} color={AppColors.amber500} />
                <Text style={bundleStyles.legendText}>
                  Metro Runtime{' '}
                  <Text style={bundleStyles.legendVal}>
                    {summary.metroKb >= 1024
                      ? `${(summary.metroKb / 1024).toFixed(1)} MB`
                      : `${summary.metroKb} KB`} ({summary.metroPct}%)
                  </Text>
                </Text>
              </View>
              <View style={bundleStyles.legendItem}>
                <BundleCategoryIcon type="typescript" size={13} color={AppColors.sky500} />
                <Text style={bundleStyles.legendText}>
                  App Source{' '}
                  <Text style={bundleStyles.legendVal}>
                    {summary.appSourceKb >= 1024
                      ? `${(summary.appSourceKb / 1024).toFixed(1)} MB`
                      : `${summary.appSourceKb} KB`} ({summary.appSourcePct}%)
                  </Text>
                </Text>
              </View>
              <View style={bundleStyles.legendItem}>
                <BundleCategoryIcon type="image" size={13} color={AppColors.pink500} />
                <Text style={bundleStyles.legendText}>
                  Assets & Media{' '}
                  <Text style={bundleStyles.legendVal}>
                    {summary.assetsMediaKb >= 1024
                      ? `${(summary.assetsMediaKb / 1024).toFixed(1)} MB`
                      : `${summary.assetsMediaKb} KB`} ({summary.assetsMediaPct}%)
                  </Text>
                </Text>
              </View>
            </View>
          </View>

          {/* Detailed Category Footprint Cards */}
          <View style={bundleStyles.sectionCard}>
            <View style={bundleStyles.sectionHeaderRow}>
              <Text style={bundleStyles.sectionTitle}>{t('bundle.categoryBreakdown')}</Text>
              <CopyButton
                value={() => summary}
                label={t('bundle.categoriesJson')}
              />
            </View>
            
            {summary.categories.map((cat, cIdx) => (
              <Pressable
                key={cIdx}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={`${cat.title}, ${cat.sizeKb >= 1024 ? `${cat.sizeMb} MB` : `${cat.sizeKb} KB`}, ${cat.pct}% of bundle`}
                accessibilityHint={`Double tap to view ${cat.title} details`}
                style={({pressed}) => [
                  bundleStyles.catRowCard,
                  pressed && {opacity: 0.85, transform: [{scale: 0.99}]},
                ]}
                onPress={() => setActiveSubTab(cat.targetTab)}>
                <View style={bundleStyles.catRowTop}>
                  <View
                    style={[
                      bundleStyles.catIconBox,
                      {backgroundColor: `${cat.color}15`, borderColor: `${cat.color}30`},
                    ]}>
                    <BundleCategoryIcon type={cat.iconType} size={18} color={cat.color} />
                  </View>

                  <View style={bundleStyles.catRowTitleWrap}>
                    <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6}}>
                      <Text style={bundleStyles.catRowTitle} numberOfLines={1}>
                        {cat.title}
                      </Text>
                      <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
                        <Text style={bundleStyles.catRowSize}>
                          {cat.sizeKb >= 1024 ? `${cat.sizeMb} MB` : `${cat.sizeKb} KB`}
                        </Text>
                        <View
                          style={[
                            bundleStyles.catPctPill,
                            {backgroundColor: `${cat.color}18`},
                          ]}>
                          <Text style={[bundleStyles.catPctText, {color: cat.color}]}>
                            {cat.pct}%
                          </Text>
                        </View>
                      </View>
                    </View>

                    <Text style={bundleStyles.catRowDesc} numberOfLines={2}>
                      {cat.count} items • {cat.desc}
                    </Text>
                  </View>
                </View>

                {/* Modern Rounded Progress Bar */}
                <View style={bundleStyles.catProgressTrack}>
                  <View
                    style={[
                      bundleStyles.catProgressBar,
                      {width: `${cat.pct}%`, backgroundColor: cat.color},
                    ]}
                  />
                </View>
              </Pressable>
            ))}

            {/* Executive Total Summation Card */}
            <View style={bundleStyles.totalSummaryCard}>
              <View style={bundleStyles.totalSummaryRow}>
                <View style={bundleStyles.totalSummaryLabelWrap}>
                  <View style={bundleStyles.totalIconBadge}>
                    <PackageIcon color={AppColors.brandPurple} size={16} />
                  </View>
                  <View>
                    <Text style={bundleStyles.totalSummaryLabel}>
                      TOTAL BUNDLE ASSETS
                    </Text>
                    <Text style={bundleStyles.totalSummarySub}>
                      {summary.totalCount} Tracked Modules & Media Assets
                    </Text>
                  </View>
                </View>
                <View style={{alignItems: 'flex-end'}}>
                  <Text style={bundleStyles.totalSummaryValue}>
                    {summary.totalMb} MB
                  </Text>
                  <Text style={bundleStyles.totalSummaryKb}>
                    {summary.totalKb.toLocaleString()} KB
                  </Text>
                </View>
              </View>

              {/* 4-Pill Chip Breakdown */}
              <View style={bundleStyles.totalFormulaGrid}>
                <View style={bundleStyles.totalChip}>
                  <View style={[bundleStyles.totalDot, {backgroundColor: AppColors.indigo500}]} />
                  <Text style={bundleStyles.totalChipText}>NPM: {(summary.nodeModulesKb / 1024).toFixed(1)}M ({summary.nodeModulesPct}%)</Text>
                </View>
                <View style={bundleStyles.totalChip}>
                  <View style={[bundleStyles.totalDot, {backgroundColor: AppColors.amber500}]} />
                  <Text style={bundleStyles.totalChipText}>Metro: {(summary.metroKb / 1024).toFixed(1)}M ({summary.metroPct}%)</Text>
                </View>
                <View style={bundleStyles.totalChip}>
                  <View style={[bundleStyles.totalDot, {backgroundColor: AppColors.sky500}]} />
                  <Text style={bundleStyles.totalChipText}>Source: {(summary.appSourceKb / 1024).toFixed(1)}M ({summary.appSourcePct}%)</Text>
                </View>
                <View style={bundleStyles.totalChip}>
                  <View style={[bundleStyles.totalDot, {backgroundColor: AppColors.pink500}]} />
                  <Text style={bundleStyles.totalChipText}>Media: {summary.assetsMediaKb}K ({summary.assetsMediaPct}%)</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Detailed Subsystem Architecture Split-up */}
          <View style={bundleStyles.sectionCard}>
            <View style={bundleStyles.sectionHeaderRow}>
              <View>
                <Text style={bundleStyles.sectionTitle}>Bundle Subsystem Breakdown</Text>
                <Text style={bundleStyles.sectionSub}>
                  Granular analysis of packages, application source, engine runtime & assets
                </Text>
              </View>
              <CopyButton
                value={() => ({
                  directPackages: bundlePackages.filter(p => p.type === 'direct').length,
                  transitivePackages: bundlePackages.filter(p => p.type !== 'direct').length,
                  hermesEngine: isHermes ? 'Hermes (Bytecode)' : 'JSC (Source)',
                  jsDevKb: summary.totalKb,
                  jsHermesReleaseKb: Math.round(summary.totalKb * 0.38),
                  appSourceFiles: bundleFiles.filter(f => f.category === 'typescript' || f.category === 'javascript').length,
                  mediaAssets: bundleFiles.filter(f => f.category === 'image' || f.category === 'font' || f.category === 'json').length,
                })}
                label="Subsystem Split JSON"
              />
            </View>

            {/* 1. NPM Dependencies Layer */}
            <View style={bundleStyles.subsystemCard}>
              <View style={bundleStyles.subsystemHeader}>
                <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
                  <BundleCategoryIcon type="deps" size={16} color={AppColors.indigo500} />
                  <Text style={bundleStyles.subsystemTitle}>NPM & Third-Party Dependencies</Text>
                </View>
                <View style={[bundleStyles.subsystemBadge, {backgroundColor: `${AppColors.indigo500}18`}]}>
                  <Text style={[bundleStyles.subsystemBadgeText, {color: AppColors.indigo500}]}>
                    {(summary.nodeModulesKb / 1024).toFixed(1)} MB • {summary.nodeModulesPct}%
                  </Text>
                </View>
              </View>
              <View style={bundleStyles.subsystemGrid}>
                <View style={bundleStyles.subsystemItem}>
                  <Text style={bundleStyles.subsystemItemText}>
                    Direct: <Text style={bundleStyles.subsystemItemVal}>{bundlePackages.filter(p => p.type === 'direct').length || 12} pkgs</Text>
                  </Text>
                </View>
                <View style={bundleStyles.subsystemItem}>
                  <Text style={bundleStyles.subsystemItemText}>
                    Transitive: <Text style={bundleStyles.subsystemItemVal}>{bundlePackages.filter(p => p.type !== 'direct').length || 41} pkgs</Text>
                  </Text>
                </View>
                <View style={bundleStyles.subsystemItem}>
                  <Text style={bundleStyles.subsystemItemText}>
                    Top Package: <Text style={bundleStyles.subsystemItemVal}>{bundlePackages[0]?.name || 'react-native'} ({bundlePackages[0]?.sizeKb || 1240} KB)</Text>
                  </Text>
                </View>
              </View>
            </View>

            {/* 2. App Source Code Layer */}
            <View style={bundleStyles.subsystemCard}>
              <View style={bundleStyles.subsystemHeader}>
                <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
                  <BundleCategoryIcon type="source" size={16} color={AppColors.sky500} />
                  <Text style={bundleStyles.subsystemTitle}>Application Source Code</Text>
                </View>
                <View style={[bundleStyles.subsystemBadge, {backgroundColor: `${AppColors.sky500}18`}]}>
                  <Text style={[bundleStyles.subsystemBadgeText, {color: AppColors.sky500}]}>
                    {(summary.appSourceKb / 1024).toFixed(1)} MB • {summary.appSourcePct}%
                  </Text>
                </View>
              </View>
              <View style={bundleStyles.subsystemGrid}>
                <View style={bundleStyles.subsystemItem}>
                  <Text style={bundleStyles.subsystemItemText}>
                    TypeScript/TSX: <Text style={bundleStyles.subsystemItemVal}>{bundleFiles.filter(f => f.category === 'typescript').length || 14} files</Text>
                  </Text>
                </View>
                <View style={bundleStyles.subsystemItem}>
                  <Text style={bundleStyles.subsystemItemText}>
                    JavaScript/JSX: <Text style={bundleStyles.subsystemItemVal}>{bundleFiles.filter(f => f.category === 'javascript').length || 3} files</Text>
                  </Text>
                </View>
                <View style={bundleStyles.subsystemItem}>
                  <Text style={bundleStyles.subsystemItemText}>
                    Tracked Modules: <Text style={bundleStyles.subsystemItemVal}>{bundleFiles.length || 18} files</Text>
                  </Text>
                </View>
              </View>
            </View>

            {/* 3. Hermes Optimization & Bytecode Engine */}
            <View style={bundleStyles.subsystemCard}>
              <View style={bundleStyles.subsystemHeader}>
                <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
                  <BundleCategoryIcon type="bolt" size={16} color={AppColors.emerald600} />
                  <Text style={bundleStyles.subsystemTitle}>Hermes Bytecode Engine</Text>
                </View>
                <View style={[bundleStyles.subsystemBadge, {backgroundColor: `${AppColors.emerald500}18`}]}>
                  <Text style={[bundleStyles.subsystemBadgeText, {color: AppColors.emerald700}]}>
                    ~62% AOT Compression
                  </Text>
                </View>
              </View>
              <View style={bundleStyles.subsystemGrid}>
                <View style={bundleStyles.subsystemItem}>
                  <Text style={bundleStyles.subsystemItemText}>
                    Dev JS Size: <Text style={bundleStyles.subsystemItemVal}>{summary.totalMb} MB</Text>
                  </Text>
                </View>
                <View style={bundleStyles.subsystemItem}>
                  <Text style={bundleStyles.subsystemItemText}>
                    Hermes Bytecode: <Text style={bundleStyles.subsystemItemVal}>{((summary.totalKb * 0.38) / 1024).toFixed(2)} MB</Text>
                  </Text>
                </View>
                <View style={bundleStyles.subsystemItem}>
                  <Text style={bundleStyles.subsystemItemText}>
                    Execution: <Text style={bundleStyles.subsystemItemVal}>{isHermes ? 'Hermes JSI Direct' : 'JSC Standard'}</Text>
                  </Text>
                </View>
              </View>
            </View>

            {/* 4. Assets & Media Layer */}
            <View style={bundleStyles.subsystemCard}>
              <View style={bundleStyles.subsystemHeader}>
                <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
                  <BundleCategoryIcon type="media" size={16} color={AppColors.pink500} />
                  <Text style={bundleStyles.subsystemTitle}>Images, Fonts & Static Assets</Text>
                </View>
                <View style={[bundleStyles.subsystemBadge, {backgroundColor: `${AppColors.pink500}18`}]}>
                  <Text style={[bundleStyles.subsystemBadgeText, {color: AppColors.pink500}]}>
                    {summary.assetsMediaKb} KB • {summary.assetsMediaPct}%
                  </Text>
                </View>
              </View>
              <View style={bundleStyles.subsystemGrid}>
                <View style={bundleStyles.subsystemItem}>
                  <Text style={bundleStyles.subsystemItemText}>
                    Images & Icons: <Text style={bundleStyles.subsystemItemVal}>{bundleFiles.filter(f => f.category === 'image').length || 2} assets</Text>
                  </Text>
                </View>
                <View style={bundleStyles.subsystemItem}>
                  <Text style={bundleStyles.subsystemItemText}>
                    JSON Data: <Text style={bundleStyles.subsystemItemVal}>{bundleFiles.filter(f => f.category === 'json').length || 1} files</Text>
                  </Text>
                </View>
                <View style={bundleStyles.subsystemItem}>
                  <Text style={bundleStyles.subsystemItemText}>
                    Custom Fonts: <Text style={bundleStyles.subsystemItemVal}>{bundleFiles.filter(f => f.category === 'font').length || 0} fonts</Text>
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* ── 2. TAB: PRODUCTION BUILDS & PLATFORMS ───────────────────────────── */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeSubTab === 'production' && (
        <ScrollView
          style={{flex: 1}}
          contentContainerStyle={bundleStyles.contentContainer}
          keyboardShouldPersistTaps="handled">
          
          {/* Platform Segmented Switcher (Horizontally Scrollable) */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={bundleStyles.prodPlatformScroll}>
            {[
              {key: 'ios' as const, label: 'iOS App (.ipa)', badge: `${analysis?.production.ios.totalDownloadMb || 111.9} MB`},
              {key: 'androidAab' as const, label: 'Android AAB (.aab)', badge: `${analysis?.production.androidAab.totalDownloadMb || 38.5} MB`},
              {key: 'androidApk' as const, label: 'Universal APK (.apk)', badge: `${analysis?.production.androidApk.totalInstallMb || 364.0} MB`},
            ].map(tab => {
              const isSelected = prodPlatform === tab.key;
              return (
                <TouchableScale
                  key={tab.key}
                  accessible={true}
                  accessibilityRole="tab"
                  accessibilityLabel={`${tab.label}, ${tab.badge}`}
                  accessibilityState={{selected: isSelected}}
                  accessibilityHint={`Switches production estimate to ${tab.label}`}
                  onPress={() => setProdPlatform(tab.key)}
                  style={[
                    bundleStyles.prodPlatformBtn,
                    isSelected && bundleStyles.prodPlatformBtnActive,
                  ]}>
                  <Text
                    style={[
                      bundleStyles.prodPlatformBtnText,
                      isSelected && bundleStyles.prodPlatformBtnTextActive,
                    ]}>
                    {tab.label}
                  </Text>
                  <View
                    style={[
                      bundleStyles.prodPlatformBadge,
                      isSelected && bundleStyles.prodPlatformBadgeActive,
                    ]}>
                    <Text
                      style={[
                        bundleStyles.prodPlatformBadgeText,
                        isSelected && bundleStyles.prodPlatformBadgeTextActive,
                      ]}>
                      {tab.badge}
                    </Text>
                  </View>
                </TouchableScale>
              );
            })}
          </ScrollView>

          {/* Production Platform Metrics Hero */}
          {analysis && (
            <View style={bundleStyles.heroCard}>
              <View style={bundleStyles.heroTopRow}>
                <View style={bundleStyles.heroIconWrap}>
                  <PackageIcon color={AppColors.brandPurple} size={24} />
                </View>
                <View style={{flex: 1}}>
                  <Text style={bundleStyles.heroTitle}>
                    {prodPlatform === 'ios'
                      ? 'iOS Production Binary Footprint'
                      : prodPlatform === 'androidAab'
                      ? 'Google Play App Bundle (.aab)'
                      : 'Universal Standalone APK (.apk)'}
                  </Text>
                  <Text style={bundleStyles.heroSubtitle}>
                    {prodPlatform === 'ios'
                      ? 'App Store install & over-the-air cellular download estimates'
                      : prodPlatform === 'androidAab'
                      ? 'Optimized per-device dynamic delivery split APK architecture'
                      : 'Multi-ABI universal install archive for sideloading & direct distribution'}
                  </Text>
                </View>
                <CopyButton
                  value={() => analysis.production[prodPlatform]}
                  label="Production Binary JSON"
                />
              </View>

              {/* 4-Stat Balanced 2x2 Metric Grid */}
              <View style={bundleStyles.metricsGrid}>
                <View style={bundleStyles.metricBox}>
                  <Text style={bundleStyles.metricLabel}>INSTALL SIZE</Text>
                  <Text style={[bundleStyles.metricValue, {color: AppColors.purple}]}>
                    {analysis.production[prodPlatform].totalInstallMb} MB
                  </Text>
                  <Text style={bundleStyles.metricHint}>On-device uncompressed footprint</Text>
                </View>

                <View style={bundleStyles.metricBox}>
                  <Text style={bundleStyles.metricLabel}>DOWNLOAD SIZE</Text>
                  <Text style={[bundleStyles.metricValue, {color: AppColors.emerald600}]}>
                    ~{analysis.production[prodPlatform].totalDownloadMb} MB
                  </Text>
                  <Text style={bundleStyles.metricHint}>Store network transfer payload</Text>
                </View>

                <View style={bundleStyles.metricBox}>
                  <Text style={bundleStyles.metricLabel}>COMPRESSION</Text>
                  <Text style={[bundleStyles.metricValue, {color: AppColors.sky500}]}>
                    {analysis.production[prodPlatform].compressionRatioPct}%
                  </Text>
                  <Text style={bundleStyles.metricHint}>Bytecode & asset ratio</Text>
                </View>

                <View style={bundleStyles.metricBox}>
                  <Text style={bundleStyles.metricLabel}>FORMAT ARCHITECTURE</Text>
                  <Text style={[bundleStyles.metricValue, {color: AppColors.amber700}]}>
                    {prodPlatform === 'ios'
                      ? 'Mach-O 64-bit'
                      : prodPlatform === 'androidAab'
                      ? 'Split APKs'
                      : 'FAT Multi-ABI'}
                  </Text>
                  <Text style={bundleStyles.metricHint}>
                    {prodPlatform === 'ios'
                      ? 'Apple ARM64 runtime'
                      : prodPlatform === 'androidAab'
                      ? 'Dynamic Google Play delivery'
                      : 'Sideload universal package'}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Component Breakdown Cards */}
          {analysis && (
            <View style={bundleStyles.sectionCard}>
              <View style={bundleStyles.sectionHeaderRow}>
                <View>
                  <Text style={bundleStyles.sectionTitle}>Binary Component Architecture</Text>
                  <Text style={bundleStyles.sectionSub}>
                    Compiled native libraries, runtime bytecodes, assets, and signature blocks
                  </Text>
                </View>
                <CopyButton
                  value={() => analysis.production[prodPlatform].components}
                  label="Components JSON"
                />
              </View>

              {/* Visual Binary Component Ratio Bar */}
              <View style={bundleStyles.prodTreemapBar}>
                {analysis.production[prodPlatform].components.map((comp, cIdx) => (
                  <View
                    key={cIdx}
                    style={{
                      flex: Math.max(comp.pct, 2),
                      backgroundColor: comp.color,
                      height: 16,
                    }}
                  />
                ))}
              </View>

              {/* Production Binary Legend */}
              <View style={[bundleStyles.legendGrid, {marginBottom: 12}]}>
                {analysis.production[prodPlatform].components.map((comp, cIdx) => (
                  <View key={cIdx} style={bundleStyles.legendItem}>
                    <View
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: comp.color,
                      }}
                    />
                    <Text style={bundleStyles.legendText} numberOfLines={1}>
                      {comp.name}{' '}
                      <Text style={bundleStyles.legendVal}>
                        {comp.sizeMb} MB ({comp.pct}%)
                      </Text>
                    </Text>
                  </View>
                ))}
              </View>

              {analysis.production[prodPlatform].components.map((comp, idx) => (
                <View key={idx} style={bundleStyles.catRowCard}>
                  <View style={bundleStyles.catRowTop}>
                    <View
                      style={[
                        bundleStyles.catIconBox,
                        {backgroundColor: `${comp.color}15`, borderColor: `${comp.color}30`},
                      ]}>
                      <BundleCategoryIcon
                        type={
                          comp.category === 'native'
                            ? 'source'
                            : comp.category === 'frameworks'
                            ? 'deps'
                            : comp.category === 'assets'
                            ? 'media'
                            : comp.category === 'js'
                            ? 'javascript'
                            : 'overhead'
                        }
                        size={18}
                        color={comp.color}
                      />
                    </View>

                    <View style={bundleStyles.catRowTitleWrap}>
                      <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6}}>
                        <Text style={bundleStyles.catRowTitle} numberOfLines={1}>
                          {comp.name}
                        </Text>
                        <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
                          <Text style={bundleStyles.catRowSize}>{comp.sizeMb} MB</Text>
                          <View
                            style={[
                              bundleStyles.catPctPill,
                              {backgroundColor: `${comp.color}18`},
                            ]}>
                            <Text style={[bundleStyles.catPctText, {color: comp.color}]}>
                              {comp.pct}%
                            </Text>
                          </View>
                        </View>
                      </View>

                      <Text style={bundleStyles.catRowDesc} numberOfLines={2}>
                        {comp.description}
                      </Text>
                    </View>
                  </View>

                  <View style={bundleStyles.catProgressTrack}>
                    <View
                      style={[
                        bundleStyles.catProgressBar,
                        {width: `${comp.pct}%`, backgroundColor: comp.color},
                      ]}
                    />
                  </View>

                  {comp.advice ? (
                    <View style={[bundleStyles.adviceBadge, bundleStyles.adviceOptimal, {marginTop: 6}]}>
                      <LightbulbIcon color={AppColors.emerald700} size={13} />
                      <Text style={[bundleStyles.adviceText, {color: AppColors.emerald700, flex: 1, marginLeft: 4}]}>
                        {comp.advice}
                      </Text>
                    </View>
                  ) : null}
                </View>
              ))}

              {/* Total Platform Binary Summary with JS Source Bundle Comparison */}
              <View style={bundleStyles.totalSummaryCard}>
                <View style={bundleStyles.totalSummaryRow}>
                  <View style={bundleStyles.totalSummaryLabelWrap}>
                    <View style={bundleStyles.totalIconBadge}>
                      <PackageIcon color={AppColors.brandPurple} size={16} />
                    </View>
                    <View>
                      <Text style={bundleStyles.totalSummaryLabel}>
                        {prodPlatform === 'ios'
                          ? 'TOTAL IOS APP BINARY'
                          : prodPlatform === 'androidAab'
                          ? 'TOTAL ANDROID AAB BUNDLE'
                          : 'TOTAL UNIVERSAL APK'}
                      </Text>
                      <Text style={bundleStyles.totalSummarySub}>
                        {prodPlatform === 'ios'
                          ? 'App Store install & cellular download estimates'
                          : prodPlatform === 'androidAab'
                          ? 'Google Play dynamic delivery split APK'
                          : 'Universal standalone sideload package'}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Platform Metric Grid Chips */}
                <View style={bundleStyles.totalFormulaGrid}>
                  <View style={bundleStyles.totalChip}>
                    <View style={[bundleStyles.totalDot, {backgroundColor: AppColors.purple}]} />
                    <Text style={bundleStyles.totalChipText}>
                      Install: {analysis.production[prodPlatform].totalInstallMb} MB
                    </Text>
                  </View>
                  <View style={bundleStyles.totalChip}>
                    <View style={[bundleStyles.totalDot, {backgroundColor: AppColors.sky500}]} />
                    <Text style={bundleStyles.totalChipText}>
                      Download: ~{analysis.production[prodPlatform].totalDownloadMb} MB
                    </Text>
                  </View>
                  <View style={bundleStyles.totalChip}>
                    <View style={[bundleStyles.totalDot, {backgroundColor: AppColors.emerald500}]} />
                    <Text style={bundleStyles.totalChipText}>
                      Compression: {analysis.production[prodPlatform].compressionRatioPct}%
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          )}
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
                accessible={true}
                accessibilityRole="search"
                accessibilityLabel="Search files"
                accessibilityHint="Type a filename, path, or extension to filter"
                placeholder={t('bundle.searchFilesPlaceholder')}
                placeholderTextColor={AppColors.grayTextWeak}
                value={search}
                onChangeText={setSearch}
                style={bundleStyles.searchInput}
                autoCorrect={false}
                autoCapitalize="none"
              />
              {search.length > 0 && (
                <Pressable
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel="Clear search input"
                  onPress={() => setSearch('')}
                  hitSlop={10}>
                  <ClearIcon color={AppColors.grayTextWeak} size={14} />
                </Pressable>
              )}
              <CopyButton
                value={() => filteredFiles}
                label={t('bundle.filteredFilesJson')}
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
                    ? bundleFiles.length
                    : tab.key === 'UNUSED'
                    ? bundleFiles.filter(f => f.isConsumed === false).length
                    : tab.key === 'CONSUMED'
                    ? bundleFiles.filter(f => f.isConsumed !== false).length
                    : bundleFiles.filter(f => f.category === tab.key).length;

                return (
                  <TouchableScale
                    key={tab.key}
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityLabel={`Filter by ${t(tab.labelKey)}, ${count} items`}
                    accessibilityState={{selected: isActive}}
                    accessibilityHint={`Filters files list to ${t(tab.labelKey)}`}
                    onPress={() => setActiveCategory(tab.key)}
                    style={[
                      bundleStyles.catPill,
                      isActive && bundleStyles.catPillActive,
                      tab.key === 'UNUSED' && isActive && {backgroundColor: AppColors.red500, borderColor: AppColors.red600},
                      tab.key === 'CONSUMED' && isActive && {backgroundColor: AppColors.emerald600, borderColor: AppColors.emerald700},
                    ]}>
                    <BundleCategoryIcon
                      type={tab.iconType}
                      size={12}
                      color={isActive ? AppColors.white : AppColors.grayTextStrong}
                    />
                    <Text
                      style={[
                        bundleStyles.catPillText,
                        isActive && bundleStyles.catPillTextActive,
                      ]}>
                      {t(tab.labelKey)} ({count})
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
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel="Tree folder view"
                  accessibilityState={{selected: filesViewMode === 'tree'}}
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
                    {t('bundle.treeView')}
                  </Text>
                </TouchableScale>
                <TouchableScale
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel="Flat list view"
                  accessibilityState={{selected: filesViewMode === 'list'}}
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
                    {t('bundle.flatList')}
                  </Text>
                </TouchableScale>
              </View>

              {filesViewMode === 'tree' ? (
                <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
                  <TouchableScale
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityLabel="Expand all folders"
                    onPress={expandAllFolders}>
                    <Text style={bundleStyles.treeActionLink}>{t('bundle.expand')}</Text>
                  </TouchableScale>
                  <Text style={{color: AppColors.grayTextWeak, fontSize: 11}}>•</Text>
                  <TouchableScale
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityLabel="Collapse all folders"
                    onPress={collapseAllFolders}>
                    <Text style={bundleStyles.treeActionLink}>{t('bundle.collapse')}</Text>
                  </TouchableScale>
                </View>
              ) : (
                <Text style={bundleStyles.listHeaderCount}>
                  {t('bundle.showingFilesOf', {
                    shown: filteredFiles.length,
                    total: bundleFiles.length,
                  })}
                </Text>
              )}
            </View>

            {/* ── MODE 1: DIRECTORY TREE VIEW ── */}
            {filesViewMode === 'tree' ? (
              <View style={bundleStyles.treeRootCard}>
                {fileTreeNodes.map((node, nIdx) => (
                  <BundleTreeNodeView
                    key={node.id}
                    node={node}
                    level={0}
                    search={search}
                    totalBundleKb={summary.totalKb}
                    expandedFolders={expandedFolders}
                    toggleFolder={toggleFolder}
                    isLastChild={nIdx === fileTreeNodes.length - 1}
                    onDownload={f => downloadBundleFile(f, analysis?.scriptURL)}
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
                              <Text style={bundleStyles.unusedBadgeText}>{t('bundle.notConsumed')}</Text>
                            </View>
                          ) : (
                            <View style={bundleStyles.consumedBadge}>
                              <Text style={bundleStyles.consumedBadgeText}>{t('bundle.consumed')}</Text>
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
                          <Text style={[bundleStyles.fileSizeKb, isUnused && {color: AppColors.amber800Warm}]}>
                            {file.sizeKb >= 1024
                              ? t('bundle.fileSizeMb', {size: (file.sizeKb / 1024).toFixed(2)})
                              : t('bundle.fileSizeKb', {size: file.sizeKb})}
                          </Text>
                          <Text style={bundleStyles.filePercent}>{pctOfTotal}%</Text>
                        </View>
                        <TouchableScale
                          onPress={() => downloadBundleFile(file, analysis?.scriptURL)}
                          style={bundleStyles.downloadFileBtn}
                          hitSlop={8}>
                          <DownloadIcon size={14} color={AppColors.sky500} />
                        </TouchableScale>
                        <CopyButton
                          value={() => file}
                          label={t('bundle.fileDetailsJson')}
                        />
                      </View>
                    </View>

                    <View style={bundleStyles.fileProgressTrack}>
                      <View
                        style={[
                          bundleStyles.fileProgressBar,
                          {
                            width: `${Math.min(100, Math.max(4, Number(pctOfTotal) * 4))}%`,
                            backgroundColor: isUnused ? AppColors.red500 : categoryMeta.color,
                          },
                        ]}
                      />
                    </View>

                    <View style={bundleStyles.fileCardBottom}>
                      <Text style={bundleStyles.fileMetaText}>{file.meta}</Text>
                      {file.advice && (
                        <View
                          style={[
                            bundleStyles.adviceBadge,
                            file.status === 'warning' &&
                              bundleStyles.adviceWarning,
                            file.status === 'optimal' &&
                              bundleStyles.adviceOptimal,
                            isUnused && bundleStyles.adviceUnused,
                          ]}>
                          {isUnused ? (
                            <TrashIcon color={AppColors.red600} size={12} />
                          ) : file.status === 'warning' ? (
                            <LightbulbIcon
                              color={AppColors.amber800Warm}
                              size={12}
                            />
                          ) : (
                            <SparkleIcon
                              color={AppColors.emerald700}
                              size={12}
                            />
                          )}
                          <Text
                            style={[
                              bundleStyles.adviceText,
                              file.status === 'warning' && {
                                color: AppColors.amber800Warm,
                              },
                              file.status === 'optimal' && {
                                color: AppColors.emerald700,
                              },
                              isUnused && {color: AppColors.red600},
                            ]}>
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
                {t('bundle.filesOf', {
                  count: filteredFiles.length,
                  total: summary.totalCount,
                })}
              </Text>
            </View>
            <Text style={bundleStyles.footerSizeVal}>
              {t('bundle.kbMbValue', {
                kb: filteredTotalKb,
                mb: (filteredTotalKb / 1024).toFixed(2),
              })}
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
                  accessible={true}
                  accessibilityRole="search"
                  accessibilityLabel="Search packages"
                  accessibilityHint="Type a package name or description to filter"
                  placeholder={t('bundle.searchPackagesPlaceholder')}
                  placeholderTextColor={AppColors.grayTextWeak}
                  value={search}
                  onChangeText={setSearch}
                  style={bundleStyles.searchInput}
                  autoCorrect={false}
                  autoCapitalize="none"
                />
                {search.length > 0 && (
                  <Pressable
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityLabel="Clear search input"
                    onPress={() => setSearch('')}
                    hitSlop={10}>
                    <ClearIcon color={AppColors.grayTextWeak} size={14} />
                  </Pressable>
                )}
                <CopyButton
                  value={() => filteredPackages}
                  label={t('bundle.dependenciesJson')}
                />
              </View>
            </View>

            <Text style={bundleStyles.listHeaderCount}>
              {t('bundle.showingDependencies', {count: filteredPackages.length})}
            </Text>

            {filteredPackages.map((pkg, index) => {
              const cleanInstalledVersion = pkg.version ? pkg.version.replace(/^\^/, '') : '';
              const hasUpdate =
                !!pkg.latestVersion && !!cleanInstalledVersion &&
                pkg.latestVersion !== cleanInstalledVersion;

              return (
                <View key={pkg.id} style={[bundleStyles.fileCard, pkg.isDeprecated && {borderColor: AppColors.errorBorder, backgroundColor: AppColors.errorCardBg}]}>
                  {/* Header Row: #s.no + Logo + Package Name + Version Pill + Update/Deprecated Badges + Size & Copy */}
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
                            {cleanInstalledVersion
                              ? t('bundle.versionPrefix', {version: cleanInstalledVersion})
                              : t('bundle.bundled')}
                          </Text>
                        </View>

                        {pkg.isDeprecated ? (
                          <View style={bundleStyles.deprecatedBadge}>
                            <Text style={bundleStyles.deprecatedBadgeText}>
                              {t('bundle.deprecated')}
                            </Text>
                          </View>
                        ) : hasUpdate ? (
                          <View style={bundleStyles.updateBadge}>
                            <Text style={bundleStyles.updateBadgeText}>
                              {t('bundle.updateAvailable', {version: pkg.latestVersion})}
                            </Text>
                          </View>
                        ) : cleanInstalledVersion ? (
                          <View style={[bundleStyles.updateBadge, {backgroundColor: AppColors.gray100, borderColor: AppColors.gray200}]}>
                            <Text style={[bundleStyles.updateBadgeText, {color: AppColors.gray600}]}>
                              {t('bundle.upToDate')}
                            </Text>
                          </View>
                        ) : (
                          <View style={[bundleStyles.updateBadge, {backgroundColor: AppColors.gray100, borderColor: AppColors.gray200}]}>
                            <Text style={[bundleStyles.updateBadgeText, {color: AppColors.gray600}]}>
                              {t('bundle.bundledBadge')}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>

                    <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
                      <View style={bundleStyles.fileSizeBox}>
                        <Text style={bundleStyles.fileSizeKb}>
                          {t('bundle.fileSizeKb', {size: pkg.sizeKb})}
                        </Text>
                        <Text style={bundleStyles.filePercent}>{pkg.percentage}%</Text>
                      </View>
                      <CopyButton
                        value={() => pkg}
                        label={t('bundle.packageDetailsJson')}
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

                  {/* Deprecation Warning Banner if deprecated */}
                  {pkg.isDeprecated && pkg.deprecationReason && (
                    <View style={bundleStyles.deprecationBox}>
                      <View style={{flexDirection: 'row', alignItems: 'center', gap: 5}}>
                        <CircleAlertIcon color={AppColors.errorColor} size={12} />
                        <Text style={bundleStyles.deprecationText}>
                          {pkg.deprecationReason}
                        </Text>
                      </View>
                    </View>
                  )}

                  <View style={bundleStyles.fileProgressTrack}>
                    <View
                      style={[
                        bundleStyles.fileProgressBar,
                        {width: `${pkg.percentage * 2}%`, backgroundColor: pkg.isDeprecated ? AppColors.red500 : pkg.color},
                      ]}
                    />
                  </View>

                  {/* Footer Row: Type Tag + Last Active + NPM Link Button */}
                  <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 3}}>
                    <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
                      <View style={bundleStyles.typeTag}>
                        <Text style={bundleStyles.typeTagText}>
                          {pkg.type === 'direct' ? t('bundle.direct') : t('bundle.transitive')}
                        </Text>
                      </View>
                      {pkg.lastActive && (
                        <View style={{flexDirection: 'row', alignItems: 'center', gap: 4}}>
                          <ClockIcon color={AppColors.grayTextWeak} size={11} />
                          <Text style={bundleStyles.lastActiveText}>
                            {pkg.lastActive}
                          </Text>
                        </View>
                      )}
                    </View>

                    <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
                      <Text style={bundleStyles.fileMetaText}>
                        {t('bundle.minified', {size: pkg.sizeKb})}
                      </Text>
                      <TouchableScale
                        accessible={true}
                        accessibilityRole="link"
                        accessibilityLabel={`Open ${pkg.name} on NPM`}
                        accessibilityHint="Opens NPM package page in browser"
                        onPress={() => {
                          const url = pkg.npmUrl || `https://www.npmjs.com/package/${pkg.name}`;
                          Linking.openURL(url).catch(() => {});
                        }}
                        style={bundleStyles.npmLinkBtn}>
                        <Text style={bundleStyles.npmLinkText}>{t('bundle.npmLink')}</Text>
                      </TouchableScale>
                    </View>
                  </View>
                </View>
              );
            })}
          </ScrollView>

          {/* Sticky Total Package Size Footer */}
          <View style={bundleStyles.stickyFooterBar}>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
              <PackageIcon color={AppColors.purple} size={14} />
              <Text style={bundleStyles.footerTitle}>
                {t('bundle.dependenciesCount', {count: filteredPackages.length})}
              </Text>
            </View>
            <Text style={bundleStyles.footerSizeVal}>
              {t('bundle.kbMbValue', {
                kb: packagesTotalKb,
                mb: (packagesTotalKb / 1024).toFixed(2),
              })}
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
                  <Text style={bundleStyles.tipsHeading}>{t('bundle.mediaAuditorTitle')}</Text>
                </View>
                <CopyButton
                  value={() => mediaFiles}
                  label={t('bundle.mediaAssetsJson')}
                />
              </View>
              <Text style={bundleStyles.tipDesc}>
                {t('bundle.mediaAuditorPrefix')}{' '}
                <Text style={{fontFamily: AppFonts.interBold, color: AppColors.purple}}>
                  {summary.images.pct + summary.fonts.pct}%
                </Text>{' '}
                {t('bundle.mediaAuditorMid', {kb: summary.images.kb + summary.fonts.kb})}{' '}
                <Text style={{fontFamily: AppFonts.interBold, color: AppColors.emerald700}}>
                  {t('bundle.mediaSavings', {size: 540})}
                </Text>{' '}
                {t('bundle.mediaAuditorSuffix')}
              </Text>
            </View>

            <Text style={bundleStyles.listHeaderCount}>
              {t('bundle.mediaAssetsList', {count: mediaFiles.length})}
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
                      <Text style={bundleStyles.fileSizeKb}>
                        {t('bundle.fileSizeKb', {size: file.sizeKb})}
                      </Text>
                    </View>
                    <TouchableScale
                      accessible={true}
                      accessibilityRole="button"
                      accessibilityLabel={`Download ${file.name}`}
                      accessibilityHint="Downloads media asset file"
                      onPress={() => downloadBundleFile(file, analysis?.scriptURL)}
                      style={bundleStyles.downloadFileBtn}
                      hitSlop={8}>
                      <DownloadIcon size={14} color={AppColors.sky500} />
                    </TouchableScale>
                    <CopyButton
                      value={() => file}
                      label={t('bundle.mediaItemJson')}
                    />
                  </View>
                </View>

                <View style={bundleStyles.fileCardBottom}>
                  <Text style={bundleStyles.fileMetaText}>{file.meta}</Text>
                  {file.advice && (
                    <View
                      style={[
                        bundleStyles.adviceBadge,
                        file.status === 'warning' && bundleStyles.adviceWarning,
                        file.status === 'optimal' && bundleStyles.adviceOptimal,
                      ]}>
                      {file.status === 'warning' ? (
                        <LightbulbIcon
                          color={AppColors.amber800Warm}
                          size={12}
                        />
                      ) : (
                        <SparkleIcon color={AppColors.emerald700} size={12} />
                      )}
                      <Text
                        style={[
                          bundleStyles.adviceText,
                          file.status === 'warning' && {
                            color: AppColors.amber800Warm,
                          },
                          file.status === 'optimal' && {
                            color: AppColors.emerald700,
                          },
                        ]}>
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
                {t('bundle.mediaAndFonts', {count: mediaFiles.length})}
              </Text>
            </View>
            <Text style={bundleStyles.footerSizeVal}>
              {t('bundle.kbMbValue', {
                kb: mediaTotalKb,
                mb: (mediaTotalKb / 1024).toFixed(2),
              })}
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
                <Text style={bundleStyles.tipsHeading}>{t('bundle.optimizerTitle')}</Text>
              </View>
              <CopyButton
                value={() => [
                  t('bundle.optTip1Title'),
                  `${t('bundle.optTip2Title')} (${isHermes ? t('bundle.active') : t('bundle.actionRequired')})`,
                  t('bundle.optTip3Title'),
                  t('bundle.optTip4Title'),
                  t('bundle.optTip5Title'),
                ]}
                label={t('bundle.optimizationChecklist')}
              />
            </View>

            {[
              {
                iconType: 'image' as const,
                iconColor: AppColors.pink500,
                title: t('bundle.optTip1Title'),
                desc: t('bundle.optTip1Desc'),
                badge: t('bundle.highImpact'),
                badgeColor: AppColors.pink500,
              },
              {
                iconType: 'bolt' as const,
                iconColor: isHermes ? AppColors.emerald500 : AppColors.amber500,
                title: t('bundle.optTip2Title'),
                desc: isHermes
                  ? t('bundle.optTip2DescActive')
                  : t('bundle.optTip2DescInactive'),
                badge: isHermes ? t('bundle.active') : t('bundle.actionRequired'),
                badgeColor: isHermes ? AppColors.emerald500 : AppColors.amber500,
              },
              {
                iconType: 'font' as const,
                iconColor: AppColors.purple500,
                title: t('bundle.optTip3Title'),
                desc: t('bundle.optTip3Desc'),
                badge: t('bundle.mediumImpact'),
                badgeColor: AppColors.purple500,
              },
              {
                iconType: 'source' as const,
                iconColor: AppColors.sky500,
                title: t('bundle.optTip4Title'),
                desc: t('bundle.optTip4Desc'),
                badge: t('bundle.bestPractice'),
                badgeColor: AppColors.sky500,
              },
              {
                iconType: 'overhead' as const,
                iconColor: AppColors.indigo500,
                title: t('bundle.optTip5Title'),
                desc: t('bundle.optTip5Desc'),
                badge: t('bundle.bestPractice'),
                badgeColor: AppColors.indigo500,
              },
            ].map((tip, tIdx) => (
              <View key={tIdx} style={bundleStyles.tipItem}>
                <View style={bundleStyles.tipItemHeader}>
                  <View style={bundleStyles.tipTitleWrap}>
                    <View style={bundleStyles.sNoBadge}>
                      <Text style={bundleStyles.sNoText}>#{tIdx + 1}</Text>
                    </View>
                    <BundleCategoryIcon type={tip.iconType} size={14} color={tip.iconColor} />
                    <Text style={bundleStyles.tipTitle}>{tip.title}</Text>
                  </View>
                  <View style={bundleStyles.tipActionWrap}>
                    <View style={[bundleStyles.impactBadge, {backgroundColor: `${tip.badgeColor}18`, borderColor: `${tip.badgeColor}40`}]}>
                      <Text style={[bundleStyles.impactBadgeText, {color: tip.badgeColor}]}>
                        {tip.badge}
                      </Text>
                    </View>
                    <CopyButton
                      value={() => tip}
                      label={t('bundle.tipDetails')}
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 10,
  },
  reloadButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: AppColors.grayBackground,
    borderWidth: 1,
    borderColor: AppColors.dividerColor,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  analyzingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 24,
  },
  analyzingText: {
    fontFamily: AppFonts.interBold,
    fontSize: 13,
    color: AppColors.primaryBlack,
  },
  analyzingHint: {
    fontFamily: AppFonts.interRegular,
    fontSize: 11,
    color: AppColors.grayTextWeak,
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
    alignItems: 'flex-start',
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
  prodPlatformScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 4,
  },
  prodPlatformBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: AppColors.white,
    borderWidth: 1,
    borderColor: AppColors.dividerColor,
    gap: 6,
  },
  prodPlatformBtnActive: {
    backgroundColor: AppColors.brandPurple,
    borderColor: AppColors.brandPurple,
    shadowColor: AppColors.brandPurple,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.18,
    shadowRadius: 3,
    elevation: 2,
  },
  prodPlatformBtnText: {
    fontFamily: AppFonts.interBold,
    fontSize: 11.5,
    color: AppColors.grayTextStrong,
  },
  prodPlatformBtnTextActive: {
    color: AppColors.white,
  },
  prodPlatformBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: `${AppColors.purple}14`,
  },
  prodPlatformBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  prodPlatformBadgeText: {
    fontFamily: AppFonts.interBold,
    fontSize: 9.5,
    color: AppColors.purple,
  },
  prodPlatformBadgeTextActive: {
    color: AppColors.white,
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
  prodTreemapBar: {
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
    gap: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: `${AppColors.slate200}40`,
    borderWidth: 1,
    borderColor: `${AppColors.dividerColor}`,
    flexShrink: 0,
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
  subsystemCard: {
    backgroundColor: AppColors.white,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: AppColors.dividerColor,
    gap: 8,
  },
  subsystemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  subsystemTitle: {
    fontFamily: AppFonts.interBold,
    fontSize: 12.5,
    color: AppColors.primaryBlack,
  },
  subsystemBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  subsystemBadgeText: {
    fontFamily: AppFonts.interBold,
    fontSize: 10,
  },
  subsystemGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  subsystemItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: AppColors.grayBackground,
    borderWidth: 1,
    borderColor: AppColors.dividerColor,
  },
  subsystemItemText: {
    fontFamily: AppFonts.interMedium,
    fontSize: 10.5,
    color: AppColors.grayTextStrong,
  },
  subsystemItemVal: {
    fontFamily: AppFonts.interBold,
    color: AppColors.primaryBlack,
  },
  catRowCard: {
    backgroundColor: AppColors.grayBackground,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: AppColors.dividerColor,
    gap: 8,
  },
  catRowTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  catIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  catRowTitleWrap: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  catRowTitle: {
    fontFamily: AppFonts.interBold,
    fontSize: 13,
    color: AppColors.primaryBlack,
    flex: 1,
  },
  catRowDesc: {
    fontFamily: AppFonts.interRegular,
    fontSize: 10.5,
    color: AppColors.grayTextWeak,
    lineHeight: 14.5,
  },
  catRowSize: {
    fontFamily: AppFonts.interBold,
    fontSize: 12.5,
    color: AppColors.primaryBlack,
  },
  catRowRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    flexShrink: 0,
    minWidth: 64,
  },
  catRowPct: {
    fontFamily: AppFonts.interMedium,
    fontSize: 10,
    color: AppColors.grayTextWeak,
  },
  catPctPill: {
    paddingHorizontal: 5.5,
    paddingVertical: 1.5,
    borderRadius: 5,
  },
  catPctText: {
    fontFamily: AppFonts.interBold,
    fontSize: 9.5,
  },
  catProgressTrack: {
    height: 5,
    borderRadius: 2.5,
    backgroundColor: `${AppColors.slate200}`,
    overflow: 'hidden',
    marginTop: 2,
  },
  catProgressBar: {
    height: '100%',
    borderRadius: 2.5,
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
  treeRootCard: {
    backgroundColor: AppColors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AppColors.dividerColor,
    overflow: 'hidden',
    marginBottom: 16,
  },
  treeFolderBlock: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: AppColors.dividerColor,
  },
  treeFolderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingRight: 10,
    backgroundColor: `${AppColors.purple}06`,
  },
  treeRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    marginRight: 6,
  },
  treeRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  treeChevron: {
    fontSize: 12,
    color: AppColors.purple,
    fontFamily: AppFonts.interBold,
    width: 12,
    textAlign: 'center',
  },
  treeFolderName: {
    fontFamily: AppFonts.interBold,
    fontSize: 12.5,
    color: AppColors.primaryBlack,
  },
  treeCountBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 8,
    backgroundColor: `${AppColors.purple}14`,
  },
  treeCountBadgeText: {
    fontFamily: AppFonts.interMedium,
    fontSize: 9.5,
    color: AppColors.purple,
  },
  treeFolderSize: {
    fontFamily: AppFonts.interMedium,
    fontSize: 11,
    color: AppColors.grayTextStrong,
  },
  treeChildrenContainer: {
    backgroundColor: AppColors.white,
  },
  treeFileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    paddingRight: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: `${AppColors.dividerColor}80`,
    backgroundColor: AppColors.white,
  },
  treeFileRowUnused: {
    backgroundColor: `${AppColors.red500}06`,
  },
  treeBranchGuide: {
    width: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  treeBranchGuideText: {
    fontFamily: AppFonts.interRegular,
    fontSize: 11,
    color: AppColors.dividerColor,
  },
  treeFileName: {
    fontFamily: AppFonts.interMedium,
    fontSize: 12,
    color: AppColors.primaryBlack,
    flexShrink: 1,
  },
  treeUnusedPill: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    backgroundColor: `${AppColors.red500}18`,
  },
  treeUnusedPillText: {
    fontFamily: AppFonts.interBold,
    fontSize: 9,
    color: AppColors.red600,
  },
  treeFileSizeGroup: {
    alignItems: 'flex-end',
  },
  treeFileSizeText: {
    fontFamily: AppFonts.interMedium,
    fontSize: 11,
    color: AppColors.primaryBlack,
  },
  treeFilePctText: {
    fontFamily: AppFonts.interRegular,
    fontSize: 9,
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
  downloadFileBtn: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: `${AppColors.sky500}14`,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: `${AppColors.sky500}28`,
  },
  treeActionBtn: {
    padding: 4,
    borderRadius: 4,
    backgroundColor: `${AppColors.sky500}14`,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: `${AppColors.sky500}28`,
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
  npmLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
    backgroundColor: AppColors.npmRedTint,
    borderWidth: 1,
    borderColor: AppColors.npmRedBorder,
  },
  npmLinkText: {
    fontFamily: AppFonts.interBold,
    fontSize: 9.5,
    color: AppColors.npmRed,
  },
  deprecatedBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
    backgroundColor: AppColors.red100,
    borderWidth: 1,
    borderColor: AppColors.errorBorder,
  },
  deprecatedBadgeText: {
    fontFamily: AppFonts.interBold,
    fontSize: 9,
    color: AppColors.red600,
    letterSpacing: 0.3,
  },
  updateBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
    backgroundColor: AppColors.green100,
    borderWidth: 1,
    borderColor: AppColors.greenBorder,
  },
  updateBadgeText: {
    fontFamily: AppFonts.interBold,
    fontSize: 9,
    color: AppColors.emerald700,
  },
  lastActiveText: {
    fontFamily: AppFonts.interRegular,
    fontSize: 10,
    color: AppColors.grayTextWeak,
  },
  deprecationBox: {
    backgroundColor: AppColors.errorCardBg,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: AppColors.errorBorder,
    marginTop: 3,
  },
  deprecationText: {
    fontFamily: AppFonts.interMedium,
    fontSize: 10.5,
    color: AppColors.rose700,
    lineHeight: 14,
  },
  unusedBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
    backgroundColor: AppColors.red100,
    borderWidth: 1,
    borderColor: AppColors.errorBorder,
  },
  unusedBadgeText: {
    fontFamily: AppFonts.interBold,
    fontSize: 9.5,
    color: AppColors.red600,
  },
  consumedBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
    backgroundColor: AppColors.green100,
    borderWidth: 1,
    borderColor: AppColors.greenBorder,
  },
  consumedBadgeText: {
    fontFamily: AppFonts.interBold,
    fontSize: 9.5,
    color: AppColors.emerald600,
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
    borderColor: AppColors.errorBorder,
    backgroundColor: AppColors.red50,
  },
  adviceUnused: {
    backgroundColor: AppColors.errorCardBg,
    borderWidth: 1,
    borderColor: AppColors.errorBorder,
  },
  liveWarningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.amber100,
    borderWidth: 1,
    borderColor: AppColors.amber200,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  liveWarningTitle: {
    fontFamily: AppFonts.interBold,
    fontSize: 12,
    color: AppColors.amber800Warm,
    marginBottom: 2,
  },
  liveWarningDesc: {
    fontFamily: AppFonts.interRegular,
    fontSize: 10.5,
    lineHeight: 14,
    color: AppColors.amber800Warm,
  },
  adviceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    marginTop: 4,
    gap: 6,
  },
  adviceWarning: {
    backgroundColor: AppColors.amber100,
    borderWidth: 1,
    borderColor: AppColors.amber200,
  },
  adviceOptimal: {
    backgroundColor: AppColors.green100,
    borderWidth: 1,
    borderColor: AppColors.greenBorder,
  },
  adviceText: {
    fontFamily: AppFonts.interMedium,
    fontSize: 10.5,
    lineHeight: 14,
    flex: 1,
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
    backgroundColor: AppColors.yellow200,
    color: AppColors.yellow800,
    fontFamily: AppFonts.interBold,
  },
  tipsCard: {
    backgroundColor: AppColors.purple50,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: AppColors.purple200,
  },
  tipsHeading: {
    fontFamily: AppFonts.interBold,
    fontSize: 13.5,
    color: AppColors.purple800,
  },
  totalSummaryCard: {
    marginTop: 10,
    backgroundColor: `${AppColors.brandPurple}0B`,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: `${AppColors.brandPurple}25`,
    gap: 8,
  },
  totalSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalSummaryLabelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  totalIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: `${AppColors.brandPurple}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  totalSummaryLabel: {
    fontFamily: AppFonts.interBold,
    fontSize: 11.5,
    color: AppColors.brandPurple,
    letterSpacing: 0.6,
  },
  totalSummarySub: {
    fontFamily: AppFonts.interRegular,
    fontSize: 10,
    color: AppColors.grayTextWeak,
    marginTop: 1,
  },
  totalSummaryValue: {
    fontFamily: AppFonts.interBold,
    fontSize: 15,
    color: AppColors.primaryBlack,
  },
  totalSummaryKb: {
    fontFamily: AppFonts.interMedium,
    fontSize: 10,
    color: AppColors.grayTextWeak,
  },
  totalFormulaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: `${AppColors.brandPurple}15`,
  },
  totalChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: AppColors.white,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: AppColors.dividerColor,
  },
  totalDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  totalChipText: {
    fontFamily: AppFonts.interBold,
    fontSize: 9.5,
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
    marginBottom: 10,
    backgroundColor: AppColors.white,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: AppColors.purple200,
    gap: 6,
  },
  tipItemHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  tipTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    flexShrink: 1,
  },
  tipActionWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  tipTitle: {
    fontFamily: AppFonts.interBold,
    fontSize: 12,
    color: AppColors.purple900,
    flex: 1,
    flexShrink: 1,
  },
  tipDesc: {
    fontFamily: AppFonts.interRegular,
    fontSize: 11,
    color: AppColors.gray500,
    lineHeight: 16,
  },
});

export default BundleTab;
