import React, {useState, useEffect, useMemo, useCallback} from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  Pressable,
  ScrollView,
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
import {
  analyzeHostAppBundle,
  getCachedBundleAnalysis,
  HostBundleAnalysisResult,
} from '../../customHooks/bundleAnalyzer';

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
                {node.fileCount} {node.fileCount === 1 ? t('bundle.file') : t('bundle.files')}
              </Text>
            </View>
          </View>

          <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
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
                <Text style={bundleStyles.unusedBadgeText}>{t('bundle.notConsumed')}</Text>
              </View>
            ) : (
              <View style={bundleStyles.consumedBadge}>
                <Text style={bundleStyles.consumedBadgeText}>{t('bundle.consumed')}</Text>
              </View>
            )}
          </View>
          <Text style={bundleStyles.filePath} numberOfLines={1}>
            {file.meta}
          </Text>
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
          <CopyButton
            value={() => file}
            label={t('bundle.fileDetailsJson')}
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
              file.status === 'warning' && {color: AppColors.amber800Warm},
              file.status === 'optimal' && {color: AppColors.emerald700},
              isUnused && {color: AppColors.red600},
            ]}>
            {isUnused ? '🗑️ ' : file.status === 'warning' ? '💡 ' : '✨ '}
            {file.advice}
          </Text>
        </View>
      )}
    </View>
  );
};



const CATEGORY_TABS = [
  {key: 'ALL', labelKey: 'bundle.catAll', icon: '📁'},
  {key: 'UNUSED', labelKey: 'bundle.catUnused', icon: '🚫'},
  {key: 'CONSUMED', labelKey: 'bundle.catConsumed', icon: '⚡'},
  {key: 'image', labelKey: 'bundle.catImages', icon: '🖼️'},
  {key: 'typescript', labelKey: 'bundle.catTypescript', icon: '📜'},
  {key: 'javascript', labelKey: 'bundle.catJavascript', icon: '⚙️'},
  {key: 'font', labelKey: 'bundle.catFonts', icon: '🔤'},
  {key: 'json', labelKey: 'bundle.catJson', icon: '📄'},
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
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('ALL');

  // ─── Live Host App Bundle Analysis (fetched from Metro / runtime) ─────────
  const [analysis, setAnalysis] = useState<HostBundleAnalysisResult | null>(() =>
    getCachedBundleAnalysis(),
  );
  const [isAnalyzing, setIsAnalyzing] = useState(!getCachedBundleAnalysis());

  useEffect(() => {
    let mounted = true;
    analyzeHostAppBundle().then(result => {
      if (mounted) {
        setAnalysis(result);
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

    bundleFiles.forEach(f => {
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
      totalCount: bundleFiles.length,
      images: {
        count: imagesCount,
        kb: imagesKb,
        pct: totalKb ? Number(((imagesKb / totalKb) * 100).toFixed(1)) : 0,
      },
      ts: {
        count: tsCount,
        kb: tsKb,
        pct: totalKb ? Number(((tsKb / totalKb) * 100).toFixed(1)) : 0,
      },
      js: {
        count: jsCount,
        kb: jsKb,
        pct: totalKb ? Number(((jsKb / totalKb) * 100).toFixed(1)) : 0,
      },
      fonts: {
        count: fontsCount,
        kb: fontsKb,
        pct: totalKb ? Number(((fontsKb / totalKb) * 100).toFixed(1)) : 0,
      },
      json: {
        count: jsonCount,
        kb: jsonKb,
        pct: totalKb ? Number(((jsonKb / totalKb) * 100).toFixed(1)) : 0,
      },
    };
  }, [bundleFiles]);

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

      {/* ─── Live Bundle Analysis Loading State ─── */}
      {isAnalyzing && (
        <View style={bundleStyles.analyzingContainer}>
          <ActivityIndicator size="small" color={AppColors.brandPurple} />
          <Text style={bundleStyles.analyzingText}>
            {t('bundle.analyzingTitle')}
          </Text>
          <Text style={bundleStyles.analyzingHint}>
            {t('bundle.analyzingHint')}
          </Text>
        </View>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* ── 1. TAB: OVERVIEW & TREEMAP ───────────────────────────────────────── */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeSubTab === 'overview' && !isAnalyzing && (
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
                <Text style={bundleStyles.heroSubtitle}>
                  {analysis?.isLive
                    ? t('bundle.heroSubtitleLive', {scriptUrl: analysis.scriptURL})
                    : t('bundle.heroSubtitle')}
                </Text>
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

          {/* Development Bundle Split-Up (derived from the real running bundle) */}
          {analysis && (
            <View style={bundleStyles.sectionCard}>
              <View style={bundleStyles.sectionHeaderRow}>
                <View>
                  <Text style={bundleStyles.sectionTitle}>{t('bundle.splitUpTitle')}</Text>
                  <Text style={bundleStyles.sectionSub}>
                    {t('bundle.splitUpSub', {
                      mb: analysis.totalDevMb,
                      files: analysis.filesCount,
                      packages: analysis.packageCount,
                    })}
                  </Text>
                </View>
                <CopyButton
                  value={() => analysis.splitUp}
                  label={t('bundle.splitUpJson')}
                />
              </View>

              {[
                {
                  label: t('bundle.splitAppSource'),
                  color: AppColors.sky500,
                  ...analysis.splitUp.appSource,
                },
                {
                  label: t('bundle.splitNodeModules'),
                  color: AppColors.indigo500,
                  ...analysis.splitUp.nodeModules,
                },
                {
                  label: t('bundle.splitAssetsMedia'),
                  color: AppColors.pink500,
                  ...analysis.splitUp.assetsMedia,
                },
                {
                  label: t('bundle.splitMetroOverhead'),
                  color: AppColors.amber500,
                  ...analysis.splitUp.metroDevOverhead,
                },
              ].map((part, idx) => (
                <View key={idx} style={bundleStyles.catRowCard}>
                  <View style={bundleStyles.catRowTop}>
                    <Text style={bundleStyles.catRowIcon}>{['📦', '🧩', '🖼️', '⚙️'][idx]}</Text>
                    <View style={{flex: 1}}>
                      <Text style={bundleStyles.catRowTitle}>{part.label}</Text>
                      <Text style={bundleStyles.catRowDesc}>
                        {t('bundle.splitSize', {kb: part.kb, mb: part.mb})}
                      </Text>
                    </View>
                    <View style={{alignItems: 'flex-end'}}>
                      <Text style={bundleStyles.catRowSize}>{part.pct}%</Text>
                    </View>
                  </View>
                  <View style={bundleStyles.catProgressTrack}>
                    <View
                      style={[
                        bundleStyles.catProgressBar,
                        {width: `${part.pct}%`, backgroundColor: part.color},
                      ]}
                    />
                  </View>
                </View>
              ))}

              {/* Production Binary Footprint */}
              <View style={bundleStyles.totalSummaryCard}>
                <View style={bundleStyles.totalSummaryRow}>
                  <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
                    <PackageIcon color={AppColors.purple} size={16} />
                    <Text style={bundleStyles.totalSummaryLabel}>
                      {t('bundle.productionFootprint')}
                    </Text>
                  </View>
                  <Text style={bundleStyles.totalSummaryValue}>
                    {t('bundle.productionValue', {
                      ios: analysis.production.ios.totalInstallMb,
                      android: analysis.production.android.totalInstallMb,
                    })}
                  </Text>
                </View>
                <Text style={bundleStyles.totalSummaryFormula}>
                  {t('bundle.productionDownload', {
                    ios: analysis.production.ios.totalDownloadMb,
                    aab: analysis.production.androidAab.totalDownloadMb,
                    apk: analysis.production.androidApk.totalDownloadMb,
                  })}
                </Text>
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
                  images: summary.images,
                  ts: summary.ts,
                  js: summary.js,
                  fonts: summary.fonts,
                  json: summary.json,
                })}
                label={t('bundle.treemapJson')}
              />
            </View>

            {/* Stacked Colored Bar */}
            <View style={bundleStyles.treemapBar}>
              <View style={{flex: summary.images.pct, backgroundColor: AppColors.pink500, height: 16}} />
              <View style={{flex: summary.ts.pct, backgroundColor: AppColors.sky500, height: 16}} />
              <View style={{flex: summary.js.pct, backgroundColor: AppColors.indigo500, height: 16}} />
              <View style={{flex: summary.fonts.pct, backgroundColor: AppColors.purple500, height: 16}} />
              <View style={{flex: summary.json.pct, backgroundColor: AppColors.emerald500, height: 16}} />
            </View>

            {/* Legend Grid */}
            <View style={bundleStyles.legendGrid}>
              <View style={bundleStyles.legendItem}>
                <View style={[bundleStyles.legendDot, {backgroundColor: AppColors.pink500}]} />
                <Text style={bundleStyles.legendText}>
                  {t('bundle.legendImages')}{' '}
                  <Text style={bundleStyles.legendVal}>
                    {t('bundle.legendValue', {kb: summary.images.kb, pct: summary.images.pct})}
                  </Text>
                </Text>
              </View>
              <View style={bundleStyles.legendItem}>
                <View style={[bundleStyles.legendDot, {backgroundColor: AppColors.sky500}]} />
                <Text style={bundleStyles.legendText}>
                  {t('bundle.legendTs')}{' '}
                  <Text style={bundleStyles.legendVal}>
                    {t('bundle.legendValue', {kb: summary.ts.kb, pct: summary.ts.pct})}
                  </Text>
                </Text>
              </View>
              <View style={bundleStyles.legendItem}>
                <View style={[bundleStyles.legendDot, {backgroundColor: AppColors.indigo500}]} />
                <Text style={bundleStyles.legendText}>
                  {t('bundle.legendJs')}{' '}
                  <Text style={bundleStyles.legendVal}>
                    {t('bundle.legendValue', {kb: summary.js.kb, pct: summary.js.pct})}
                  </Text>
                </Text>
              </View>
              <View style={bundleStyles.legendItem}>
                <View style={[bundleStyles.legendDot, {backgroundColor: AppColors.purple500}]} />
                <Text style={bundleStyles.legendText}>
                  {t('bundle.legendFonts')}{' '}
                  <Text style={bundleStyles.legendVal}>
                    {t('bundle.legendValue', {kb: summary.fonts.kb, pct: summary.fonts.pct})}
                  </Text>
                </Text>
              </View>
              <View style={bundleStyles.legendItem}>
                <View style={[bundleStyles.legendDot, {backgroundColor: AppColors.emerald500}]} />
                <Text style={bundleStyles.legendText}>
                  {t('bundle.legendJson')}{' '}
                  <Text style={bundleStyles.legendVal}>
                    {t('bundle.legendValue', {kb: summary.json.kb, pct: summary.json.pct})}
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
                label={t('bundle.categoriesJson')}
              />
            </View>
            
            {[
              {
                icon: '🖼️',
                title: t('bundle.catImagesTitle'),
                count: summary.images.count,
                size: t('bundle.fileSizeKb', {size: summary.images.kb}),
                pct: summary.images.pct,
                color: AppColors.pink500,
                desc: t('bundle.catImagesDesc'),
              },
              {
                icon: '⚙️',
                title: t('bundle.catJsTitle'),
                count: summary.js.count,
                size: t('bundle.fileSizeKb', {size: summary.js.kb}),
                pct: summary.js.pct,
                color: AppColors.indigo500,
                desc: t('bundle.catJsDesc'),
              },
              {
                icon: '🔤',
                title: t('bundle.catFontsTitle'),
                count: summary.fonts.count,
                size: t('bundle.fileSizeKb', {size: summary.fonts.kb}),
                pct: summary.fonts.pct,
                color: AppColors.purple500,
                desc:
                  bundleFiles
                    .filter(f => f.category === 'font')
                    .map(f => f.name)
                    .join(', ') || t('bundle.catFontsDesc'),
              },
              {
                icon: '📜',
                title: t('bundle.catTsTitle'),
                count: summary.ts.count,
                size: t('bundle.fileSizeKb', {size: summary.ts.kb}),
                pct: summary.ts.pct,
                color: AppColors.sky500,
                desc: t('bundle.catTsDesc'),
              },
              {
                icon: '📄',
                title: t('bundle.catJsonTitle'),
                count: summary.json.count,
                size: t('bundle.fileSizeKb', {size: summary.json.kb}),
                pct: summary.json.pct,
                color: AppColors.emerald500,
                desc: t('bundle.catJsonDesc'),
              },
            ].map((cat, cIdx) => (
              <View key={cIdx} style={bundleStyles.catRowCard}>
                <View style={bundleStyles.catRowTop}>
                  <Text style={bundleStyles.catRowIcon}>{cat.icon}</Text>
                  <View style={{flex: 1}}>
                    <Text style={bundleStyles.catRowTitle}>{cat.title}</Text>
                    <Text style={bundleStyles.catRowDesc}>
                      {t('bundle.catRowSub', {count: cat.count, desc: cat.desc})}
                    </Text>
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
                  <Text style={bundleStyles.totalSummaryLabel}>
                    {t('bundle.totalBundleAssets')}
                  </Text>
                </View>
                <Text style={bundleStyles.totalSummaryValue}>
                  {t('bundle.totalBundleValue', {kb: summary.totalKb, mb: summary.totalMb})}
                </Text>
              </View>
              <Text style={bundleStyles.totalSummaryFormula}>
                {t('bundle.totalFormula', {
                  images: summary.images.kb,
                  js: summary.js.kb,
                  fonts: summary.fonts.kb,
                  ts: summary.ts.kb,
                  json: summary.json.kb,
                  total: summary.totalKb,
                  count: summary.totalCount,
                })}
              </Text>
            </View>
          </View>
        </ScrollView>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* ── 2. TAB: FILES BREAKDOWN ─────────────────────────────────────────── */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeSubTab === 'files' && !isAnalyzing && (
        <View style={{flex: 1}}>
          {/* Search & Category Filter */}
          <View style={bundleStyles.filterContainer}>
            <View style={bundleStyles.searchRow}>
              <SearchIcon color={AppColors.grayTextWeak} size={15} />
              <TextInput
                placeholder={t('bundle.searchFilesPlaceholder')}
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
                    onPress={() => setActiveCategory(tab.key)}
                    style={[
                      bundleStyles.catPill,
                      isActive && bundleStyles.catPillActive,
                      tab.key === 'UNUSED' && isActive && {backgroundColor: AppColors.red500, borderColor: AppColors.red600},
                      tab.key === 'CONSUMED' && isActive && {backgroundColor: AppColors.emerald600, borderColor: AppColors.emerald700},
                    ]}>
                    <Text style={bundleStyles.catPillIcon}>{tab.icon}</Text>
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
                  <TouchableScale onPress={expandAllFolders}>
                    <Text style={bundleStyles.treeActionLink}>{t('bundle.expand')}</Text>
                  </TouchableScale>
                  <Text style={{color: AppColors.grayTextWeak, fontSize: 11}}>•</Text>
                  <TouchableScale onPress={collapseAllFolders}>
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
                        <View style={[
                          bundleStyles.adviceBadge,
                          file.status === 'warning' && bundleStyles.adviceWarning,
                          file.status === 'optimal' && bundleStyles.adviceOptimal,
                          isUnused && bundleStyles.adviceUnused,
                        ]}>
                          <Text style={[
                            bundleStyles.adviceText,
                            file.status === 'warning' && {color: AppColors.amber800Warm},
                            file.status === 'optimal' && {color: AppColors.emerald700},
                            isUnused && {color: AppColors.red600},
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
      {activeSubTab === 'packages' && !isAnalyzing && (
        <View style={{flex: 1}}>
          <ScrollView
            style={{flex: 1}}
            contentContainerStyle={bundleStyles.contentContainer}
            keyboardShouldPersistTaps="handled">
            
            <View style={bundleStyles.filterContainer}>
              <View style={bundleStyles.searchRow}>
                <SearchIcon color={AppColors.grayTextWeak} size={15} />
                <TextInput
                  placeholder={t('bundle.searchPackagesPlaceholder')}
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
                <View key={pkg.id} style={[bundleStyles.fileCard, pkg.isDeprecated && {borderColor: AppColors.errorBorder, backgroundColor: '#FFFDFD'}]}>
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
                      <Text style={bundleStyles.deprecationText}>
                        ⚠️ {pkg.deprecationReason}
                      </Text>
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
                        <Text style={bundleStyles.lastActiveText}>
                          🕒 {pkg.lastActive}
                        </Text>
                      )}
                    </View>

                    <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
                      <Text style={bundleStyles.fileMetaText}>
                        {t('bundle.minified', {size: pkg.sizeKb})}
                      </Text>
                      <TouchableScale
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
      {activeSubTab === 'media' && !isAnalyzing && (
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
                    <CopyButton
                      value={() => file}
                      label={t('bundle.mediaItemJson')}
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
                        file.status === 'warning' && {color: AppColors.amber800Warm},
                        file.status === 'optimal' && {color: AppColors.emerald700},
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
                title: t('bundle.optTip1Title'),
                desc: t('bundle.optTip1Desc'),
                badge: t('bundle.highImpact'),
                badgeColor: AppColors.pink500,
              },
              {
                title: t('bundle.optTip2Title'),
                desc: isHermes
                  ? t('bundle.optTip2DescActive')
                  : t('bundle.optTip2DescInactive'),
                badge: isHermes ? t('bundle.active') : t('bundle.actionRequired'),
                badgeColor: isHermes ? AppColors.emerald500 : AppColors.amber500,
              },
              {
                title: t('bundle.optTip3Title'),
                desc: t('bundle.optTip3Desc'),
                badge: t('bundle.mediumImpact'),
                badgeColor: AppColors.purple500,
              },
              {
                title: t('bundle.optTip4Title'),
                desc: t('bundle.optTip4Desc'),
                badge: t('bundle.bestPractice'),
                badgeColor: AppColors.sky500,
              },
              {
                title: t('bundle.optTip5Title'),
                desc: t('bundle.optTip5Desc'),
                badge: t('bundle.bestPractice'),
                badgeColor: AppColors.indigo500,
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
  adviceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 2,
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
    borderColor: AppColors.purple200,
  },
  tipTitle: {
    fontFamily: AppFonts.interBold,
    fontSize: 12,
    color: AppColors.purple900,
  },
  tipDesc: {
    fontFamily: AppFonts.interRegular,
    fontSize: 11,
    color: AppColors.gray500,
    lineHeight: 16,
    marginTop: 4,
  },
});

export default BundleTab;
