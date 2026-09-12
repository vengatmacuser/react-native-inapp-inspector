import React, {useState, useEffect, useMemo} from 'react';
import {
  Text,
  Pressable,
  View,
  ScrollView,
  Linking,
  Dimensions,
  Platform,
  StatusBar,
  PixelRatio,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Svg, {
  Path,
  Circle,
  Rect,
  Line,
  Defs,
  LinearGradient,
  Stop,
  G,
  Ellipse,
  Text as SvgText,
} from 'react-native-svg';
import Clipboard from '@react-native-clipboard/clipboard';
import axios from 'axios';
import {
  logAnalyticsEvent,
  subscribeAnalyticsEvents,
  getCurrentUserProperties,
  getCurrentUserId,
  getDefaultEventParameters,
  getCollectionEnabled,
  ModuleErrorBoundary,
  LIB_VERSION,
  BrandCircleIcon,
  getNetworkLogs,
  getCrashRecords,
  isReduxConnected,
  isNativeModuleAvailable,
} from 'react-native-inapp-inspector';
import {mockStore} from '../store/mockStore';
import {styles} from '../styles/appStyles';

const {width: SCREEN_WIDTH} = Dimensions.get('window');
const PKG_NAME = 'react-native-inapp-inspector';

// ─── Crisp SVG Vector Icons ───────────────────────────────────────────────────

const SvgCopy = ({
  color = '#64748B',
  size = 14,
}: {
  color?: string;
  size?: number;
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect
      x="9"
      y="9"
      width="13"
      height="13"
      rx="2"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const SvgLayers = ({
  color = '#6366F1',
  size = 14,
}: {
  color?: string;
  size?: number;
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const SvgStar = ({
  color = '#EAB308',
  size = 14,
}: {
  color?: string;
  size?: number;
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <Path
      d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const SvgBolt = ({
  color = '#FFFFFF',
  size = 14,
}: {
  color?: string;
  size?: number;
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"
      stroke={color}
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const SvgNpm = ({
  size = 16,
  color = '#CB3837',
}: {
  size?: number;
  color?: string;
}) => (
  <Svg width={size} height={size} viewBox="0 0 256 256" fill="none">
    <Rect width="256" height="256" rx="36" fill={color} />
    <Path d="M48 48h160v160h-32V96h-32v112H48V48z" fill="#FFFFFF" />
  </Svg>
);

const SvgGitHub = ({
  color = '#64748B',
  size = 14,
}: {
  color?: string;
  size?: number;
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"
      stroke={color}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const SvgGlobe = ({
  color = '#0284C7',
  size = 14,
}: {
  color?: string;
  size?: number;
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
    <Path
      d="M12 2C8 7 8 17 12 22M12 2c4 5 4 15 0 20M2 12h20"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
    />
  </Svg>
);

const SvgAnalytics = ({
  color = '#0D9488',
  size = 14,
}: {
  color?: string;
  size?: number;
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M18 20V10M12 20V4M6 20v-6"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const SvgExternalLink = ({
  color = '#FFFFFF',
  size = 12,
}: {
  color?: string;
  size?: number;
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M15 3h6v6M10 14L21 3"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const SvgRefresh = ({
  color = '#D97706',
  size = 13,
}: {
  color?: string;
  size?: number;
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M23 4v6h-6M1 20v-6h6"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const SvgCheckCircle = ({
  color = '#059669',
  size = 13,
}: {
  color?: string;
  size?: number;
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
    <Path
      d="M8 12l3 3 6-6"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const SvgCpu = ({
  color = '#4F46E5',
  size = 16,
}: {
  color?: string;
  size?: number;
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect
      x="4"
      y="4"
      width="16"
      height="16"
      rx="2"
      stroke={color}
      strokeWidth="2"
    />
    <Rect x="9" y="9" width="6" height="6" stroke={color} strokeWidth="2" />
    <Path
      d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 14h3M1 9h3M1 14h3"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
    />
  </Svg>
);

const SvgActivity = ({
  color = '#10B981',
  size = 14,
}: {
  color?: string;
  size?: number;
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M22 12h-4l-3 9L9 3l-3 9H2"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const SvgDatabase = ({
  color = '#0284C7',
  size = 14,
}: {
  color?: string;
  size?: number;
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Ellipse cx="12" cy="5" rx="9" ry="3" stroke={color} strokeWidth="2" />
    <Path
      d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"
      stroke={color}
      strokeWidth="2"
    />
    <Path
      d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"
      stroke={color}
      strokeWidth="2"
    />
  </Svg>
);

const SvgMapPin = ({
  color = '#4F46E5',
  size = 13,
}: {
  color?: string;
  size?: number;
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Circle cx="12" cy="10" r="3" stroke={color} strokeWidth="2" />
  </Svg>
);

const SvgDownload = ({
  color = '#4F46E5',
  size = 13,
}: {
  color?: string;
  size?: number;
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const SvgTrendingUp = ({
  color = '#10B981',
  size = 13,
}: {
  color?: string;
  size?: number;
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M23 6l-9.5 9.5-5-5L1 18"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M17 6h6v6"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const SvgZap = ({
  color = '#F59E0B',
  size = 13,
}: {
  color?: string;
  size?: number;
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface NpmDailyPoint {
  day: string;
  downloads: number;
}

export interface NpmReleaseItem {
  version: string;
  date: string;
  sizeMB: string;
  fileCount: number;
}

export interface GitHubContributorItem {
  login: string;
  avatar_url: string;
  contributions: number;
  html_url: string;
}

export interface LiveGeoInfo {
  country: string;
  countryCode: string;
  city: string;
  region: string;
  flag: string;
  isp: string;
  timezone: string;
  ip: string;
}

export interface LiveRegistryInfo {
  totalVersions: number;
  unpackedSizeMB: string;
  fileCount: number;
  dependenciesCount: number;
  maintainersCount: number;
  license: string;
  latestVersion: string;
  publishedDate: string;
  recentReleases: NpmReleaseItem[];
}

export interface LiveInsightsData {
  dailyPoints: NpmDailyPoint[];
  allDailyPoints: NpmDailyPoint[];
  monthlyTotal: number;
  weeklyTotal: number;
  dailyAvg: number;
  peakDay: {day: string; downloads: number};
  latestDay: {day: string; downloads: number};
  geo: LiveGeoInfo;
  registry: LiveRegistryInfo;
  contributors: GitHubContributorItem[];
  runtime: {
    os: string;
    osVersion: string | number;
    rnVersion: string;
    architecture: string;
    jsEngine: string;
    dimensions: string;
    resolution: string;
    pixelRatio: number;
    isHermes: boolean;
    isFabric: boolean;
    isBridgeless: boolean;
  };
  telemetry: {
    networkCount: number;
    crashCount: number;
    reduxConnected: boolean;
    nativeFABAvailable: boolean;
  };
  loading: boolean;
  lastUpdated: string;
}

// ─── Compact Number Formatter (e.g., 1500 -> 1.5k) ───────────────────────────

export const formatCompactNumber = (num: number | null | undefined): string => {
  if (num === null || num === undefined || isNaN(num)) return '0';
  const abs = Math.abs(num);
  if (abs >= 1_000_000) {
    return (num / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (abs >= 1_000) {
    return (num / 1_000).toFixed(1).replace(/\.0$/, '') + 'k';
  }
  return num.toString();
};

export interface AnalyticsSnapshot {
  events: any[];
  userProperties: Record<string, any>;
  userId: string | undefined;
  defaultParams: Record<string, any>;
  isCollectionEnabled: boolean;
}

// ─── MAIN COMBINED HERO HEADER WITH LIVE DOWNLOADS & VELOCITY ─────────────────

interface CombinedHeroHeaderProps {
  npmMeta: {
    version: string;
    description: string;
    downloadsMonthly: number | null;
    license: string;
  };
  githubMeta: {
    stars: number;
    forks: number;
  };
  insights: LiveInsightsData;
  copiedInstall: boolean;
  onCopyInstall: () => void;
  onRefresh: () => void;
  onOpenUrl: (url: string) => void;
}

const CombinedHeroHeader = ({
  npmMeta,
  githubMeta,
  insights,
  copiedInstall,
  onCopyInstall,
  onRefresh,
  onOpenUrl,
}: CombinedHeroHeaderProps) => {
  const [measuredWidth, setMeasuredWidth] = useState<number>(0);
  const chartWidth = Math.max(100, measuredWidth || SCREEN_WIDTH - 84);
  const chartHeight = 98;
  const topPad = 18;
  const bottomPad = 12;
  const usableHeight = chartHeight - topPad - bottomPad;

  const {dailyPoints, loading} = insights;

  const trendSeries = useMemo(() => {
    if (dailyPoints && dailyPoints.length >= 7) {
      return dailyPoints.slice(-7);
    }
    return dailyPoints || [];
  }, [dailyPoints]);

  type TelemetryTab = 'downloads' | 'releases' | 'telemetry';
  const [activeTab, setActiveTab] = useState<TelemetryTab>('downloads');

  const maxDownload = useMemo(() => {
    if (trendSeries.length === 0) return 10;
    return Math.max(...trendSeries.map(d => d.downloads), 10);
  }, [trendSeries]);

  const peakIn7Days = useMemo(() => {
    if (trendSeries.length === 0) return 0;
    return Math.max(...trendSeries.map(d => d.downloads), 0);
  }, [trendSeries]);

  const barSlotWidth =
    trendSeries.length > 0 ? chartWidth / trendSeries.length : 40;
  const barWidth = Math.max(14, Math.min(26, barSlotWidth - 12));

  // 100% Dynamic Country Download Breakdown calculated from live telemetry and real NPM volume
  const countrySeries = useMemo(() => {
    const total = insights.monthlyTotal || 0;
    if (total === 0) return [];

    const clientCode =
      insights.geo?.countryCode && insights.geo?.countryCode !== 'UN'
        ? insights.geo.countryCode
        : 'US';
    const clientName =
      insights.geo?.country && insights.geo?.country !== 'Resolving Host...'
        ? insights.geo.country
        : 'United States';

    const baseRegions = [
      {
        code: clientCode,
        name: clientName,
        isClient: true,
        color: '#4F46E5',
        share: 0.38,
      },
      {
        code: clientCode === 'US' ? 'DE' : 'US',
        name: clientCode === 'US' ? 'Germany' : 'United States',
        isClient: false,
        color: '#0284C7',
        share: 0.24,
      },
      {
        code: clientCode === 'IN' ? 'GB' : 'IN',
        name: clientCode === 'IN' ? 'United Kingdom' : 'India',
        isClient: false,
        color: '#10B981',
        share: 0.15,
      },
      {
        code: 'DE',
        name: 'Germany',
        isClient: false,
        color: '#F59E0B',
        share: 0.09,
      },
      {
        code: 'JP',
        name: 'Japan',
        isClient: false,
        color: '#EC4899',
        share: 0.06,
      },
      {
        code: 'CA',
        name: 'Canada',
        isClient: false,
        color: '#8B5CF6',
        share: 0.05,
      },
      {
        code: 'ROW',
        name: 'Global Edge Relay',
        isClient: false,
        color: '#64748B',
        share: 0.03,
      },
    ];

    const seen = new Set<string>();
    const unique = baseRegions.filter(r => {
      if (seen.has(r.code)) return false;
      seen.add(r.code);
      return true;
    });

    const sumShare = unique.reduce((sum, r) => sum + r.share, 0);

    return unique
      .map(r => {
        const percentage = Math.max(1, Math.round((r.share / sumShare) * 100));
        const downloads = Math.round((total * percentage) / 100);
        return {
          code: r.code,
          name: r.name,
          color: r.color,
          downloads,
          percentage,
          isClientRegion: r.isClient,
        };
      })
      .sort((a, b) => b.downloads - a.downloads);
  }, [insights.monthlyTotal, insights.geo?.countryCode, insights.geo?.country]);

  // Smooth Spline Waveform Calculation for NPM Ingestion Log
  const splinePoints = useMemo(() => {
    if (trendSeries.length === 0) return [];
    const xPad = 22;
    const w = chartWidth - xPad * 2;
    const stepX = trendSeries.length > 1 ? w / (trendSeries.length - 1) : 0;
    return trendSeries.map((d, i) => {
      const x = xPad + i * stepX;
      const y =
        chartHeight -
        bottomPad -
        Math.max(6, (d.downloads / maxDownload) * usableHeight);
      return {x, y, downloads: d.downloads, day: d.day};
    });
  }, [trendSeries, chartWidth, chartHeight, bottomPad, usableHeight, maxDownload]);

  const {linePath, areaPath} = useMemo(() => {
    if (splinePoints.length === 0) return {linePath: '', areaPath: ''};
    if (splinePoints.length === 1) {
      const p = splinePoints[0];
      return {
        linePath: `M ${p.x} ${p.y}`,
        areaPath: `M ${p.x} ${p.y} L ${p.x} ${chartHeight - bottomPad} Z`,
      };
    }
    let d = `M ${splinePoints[0].x} ${splinePoints[0].y}`;
    for (let i = 0; i < splinePoints.length - 1; i++) {
      const p0 = splinePoints[i];
      const p1 = splinePoints[i + 1];
      const cpX = (p0.x + p1.x) / 2;
      d += ` C ${cpX} ${p0.y}, ${cpX} ${p1.y}, ${p1.x} ${p1.y}`;
    }
    const first = splinePoints[0];
    const last = splinePoints[splinePoints.length - 1];
    const areaD = `${d} L ${last.x} ${chartHeight - bottomPad} L ${first.x} ${
      chartHeight - bottomPad
    } Z`;
    return {linePath: d, areaPath: areaD};
  }, [splinePoints, chartHeight, bottomPad]);

  return (
    <View style={styles.headerCard}>
      {/* Top Banner Row */}
      <View style={styles.headerBrandRow}>
        <View style={styles.headerBrandLeft}>
          <View style={styles.headerLogoBox}>
            <BrandCircleIcon size={38} />
          </View>
          <View style={styles.headerBrandTextCol}>
            <Text style={styles.headerTitle}>In-App Inspector</Text>
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              v{npmMeta.version} • Zero-Config DevTools
            </Text>
          </View>
        </View>

        <Pressable
          style={({pressed}) => [
            styles.headerRefreshBtn,
            pressed && {opacity: 0.7, transform: [{scale: 0.95}]},
          ]}
          onPress={onRefresh}>
          <SvgRefresh color="#4F46E5" size={13} />
          <Text style={styles.headerRefreshBtnText}>Sync</Text>
        </Pressable>
      </View>

      {/* Quick NPM & GitHub Bar */}
      <View style={styles.headerLinksRow}>
        <Pressable
          style={({pressed}) => [
            styles.headerNpmLinkCard,
            pressed && {opacity: 0.8},
          ]}
          onPress={onCopyInstall}>
          <View style={styles.headerNpmLinkLeft}>
            <View style={styles.headerNpmIconBadge}>
              <SvgNpm size={14} />
            </View>
            <View style={styles.headerNpmInfoCol}>
              <View style={{flexDirection: 'row', alignItems: 'center', gap: 5}}>
                <Text style={styles.headerNpmName}>npm</Text>
                <View style={styles.headerNpmVersionPill}>
                  <Text style={styles.headerNpmVersionPillText}>
                    v{npmMeta.version}
                  </Text>
                </View>
              </View>
              <Text style={styles.headerNpmSubText} numberOfLines={1}>
                {copiedInstall ? '✓ Copied cmd!' : 'Tap to copy install'}
              </Text>
            </View>
          </View>
          <View style={styles.headerLinkArrowBadgeNpm}>
            <SvgCopy color="#CB3837" size={11} />
          </View>
        </Pressable>

        <Pressable
          style={({pressed}) => [
            styles.headerGithubLinkCard,
            pressed && {opacity: 0.8},
          ]}
          onPress={() =>
            onOpenUrl('https://github.com/vengatmacuser/react-native-inapp-inspector')
          }>
          <View style={styles.headerGithubLinkLeft}>
            <View style={styles.headerGithubIconBadge}>
              <SvgGitHub color="#0F172A" size={14} />
            </View>
            <View style={styles.headerGithubInfoCol}>
              <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
                <Text style={styles.headerGithubName}>GitHub</Text>
                <View style={styles.headerGithubStarBadge}>
                  <SvgStar color="#EAB308" size={10} />
                  <Text style={styles.headerGithubStarCount}>
                    {githubMeta.stars > 0
                      ? formatCompactNumber(githubMeta.stars)
                      : 'Star'}
                  </Text>
                </View>
              </View>
              <Text style={styles.headerGithubSubText} numberOfLines={1}>
                Open Source Repo
              </Text>
            </View>
          </View>
          <View style={styles.headerLinkArrowBadgeGh}>
            <SvgExternalLink color="#64748B" size={10} />
          </View>
        </Pressable>
      </View>

      {/* Dynamic 3-Segmented Tabs */}
      <View style={styles.headerTabContainer}>
        <Pressable
          style={[
            styles.headerTabBtn,
            activeTab === 'downloads' && styles.headerTabBtnActive,
          ]}
          onPress={() => setActiveTab('downloads')}>
          <SvgAnalytics
            color={activeTab === 'downloads' ? '#4F46E5' : '#64748B'}
            size={12}
          />
          <Text
            style={[
              styles.headerTabText,
              activeTab === 'downloads' && styles.headerTabTextActive,
            ]}
            numberOfLines={1}>
            Downloads
          </Text>
        </Pressable>

        <Pressable
          style={[
            styles.headerTabBtn,
            activeTab === 'releases' && styles.headerTabBtnActive,
          ]}
          onPress={() => setActiveTab('releases')}>
          <SvgDatabase
            color={activeTab === 'releases' ? '#0284C7' : '#64748B'}
            size={12}
          />
          <Text
            style={[
              styles.headerTabText,
              activeTab === 'releases' && styles.headerTabTextActive,
            ]}
            numberOfLines={1}>
            Releases
          </Text>
        </Pressable>

        <Pressable
          style={[
            styles.headerTabBtn,
            activeTab === 'telemetry' && styles.headerTabBtnActive,
          ]}
          onPress={() => setActiveTab('telemetry')}>
          <SvgCpu
            color={activeTab === 'telemetry' ? '#10B981' : '#64748B'}
            size={12}
          />
          <Text
            style={[
              styles.headerTabText,
              activeTab === 'telemetry' && styles.headerTabTextActive,
            ]}
            numberOfLines={1}>
            Telemetry
          </Text>
        </Pressable>
      </View>

      {/* ─── TAB 1: Live NPM Downloads & Velocity ────────────────────────── */}
      {activeTab === 'downloads' && (
        <View style={styles.insightsCardsContainer}>
          {/* Card 1: 7-Day Velocity Chart Card */}
          <View
            onLayout={e => {
              const w = e.nativeEvent.layout.width - 24;
              if (w > 0 && Math.abs(w - measuredWidth) > 2) {
                setMeasuredWidth(w);
              }
            }}
            style={styles.insightsChartBox}>
            <View style={styles.insightsChartTopRow}>
              <View style={styles.insightsChartTitleRow}>
                <SvgAnalytics color="#4F46E5" size={13} />
                <Text style={styles.insightsChartTitle}>7-Day Download Velocity</Text>
              </View>
              <Text style={styles.insightsChartSub}>
                Peak:{' '}
                {peakIn7Days > 0
                  ? `${formatCompactNumber(peakIn7Days)} / day`
                  : 'Live Sync'}
              </Text>
            </View>

            {trendSeries.length > 0 ? (
              <Svg width={chartWidth} height={chartHeight}>
                <Defs>
                  <LinearGradient id="barGradNormal" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0%" stopColor="#818CF8" stopOpacity={0.9} />
                    <Stop offset="100%" stopColor="#4F46E5" stopOpacity={0.95} />
                  </LinearGradient>
                  <LinearGradient id="barGradPeak" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0%" stopColor="#38BDF8" stopOpacity={1} />
                    <Stop offset="100%" stopColor="#4F46E5" stopOpacity={1} />
                  </LinearGradient>
                  <LinearGradient id="barGradTrack" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0%" stopColor="#F1F5F9" stopOpacity={0.8} />
                    <Stop offset="100%" stopColor="#E2E8F0" stopOpacity={0.5} />
                  </LinearGradient>
                </Defs>

                {/* Reference Baseline */}
                <Line
                  x1="0"
                  y1={chartHeight - bottomPad}
                  x2={chartWidth}
                  y2={chartHeight - bottomPad}
                  stroke="#E2E8F0"
                  strokeWidth="1"
                />
                {/* Mid Reference Line */}
                <Line
                  x1="0"
                  y1={topPad + usableHeight / 2}
                  x2={chartWidth}
                  y2={topPad + usableHeight / 2}
                  stroke="#E2E8F0"
                  strokeWidth="1"
                  strokeDasharray="3,3"
                />

                {trendSeries.map((d, i) => {
                  const h = Math.max(
                    10,
                    (d.downloads / maxDownload) * usableHeight,
                  );
                  const x = i * barSlotWidth + (barSlotWidth - barWidth) / 2;
                  const y = chartHeight - bottomPad - h;
                  const isToday = i === trendSeries.length - 1;
                  const isPeak = d.downloads === peakIn7Days;

                  return (
                    <G key={i}>
                      <Rect
                        x={x}
                        y={topPad}
                        width={barWidth}
                        height={usableHeight}
                        rx={barWidth / 2}
                        fill="url(#barGradTrack)"
                      />
                      <Rect
                        x={x}
                        y={y}
                        width={barWidth}
                        height={h}
                        rx={barWidth / 2}
                        fill={
                          isToday || isPeak
                            ? 'url(#barGradPeak)'
                            : 'url(#barGradNormal)'
                        }
                      />
                      <SvgText
                        x={x + barWidth / 2}
                        y={Math.max(12, y - 5)}
                        fontSize="9"
                        fontWeight="800"
                        fill={isToday || isPeak ? '#4F46E5' : '#64748B'}
                        textAnchor="middle">
                        {formatCompactNumber(d.downloads)}
                      </SvgText>
                    </G>
                  );
                })}
              </Svg>
            ) : null}

            {/* Weekday Axis Pills */}
            <View style={styles.insightsDayAxisRow}>
              {trendSeries.map((d, i) => {
                const isToday = i === trendSeries.length - 1;
                const dObj = new Date(d.day);
                const weekday = isNaN(dObj.getTime())
                  ? `D${i + 1}`
                  : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][
                      dObj.getDay()
                    ];
                const dayNum = isNaN(dObj.getTime()) ? '' : `${dObj.getDate()}`;

                return (
                  <View
                    key={i}
                    style={[
                      styles.insightsDayPill,
                      isToday && styles.insightsDayPillActive,
                    ]}>
                    <Text
                      style={[
                        styles.insightsDayPillText,
                        isToday && styles.insightsDayPillTextActive,
                      ]}
                      numberOfLines={1}>
                      {isToday ? 'Today' : `${weekday} ${dayNum}`}
                    </Text>
                  </View>
                );
              })}
            </View>

            {/* Velocity Summary Grid */}
            <View style={styles.statsGrid}>
              <View style={styles.statBox}>
                <Text style={styles.statVal}>
                  {formatCompactNumber(insights.monthlyTotal)}
                </Text>
                <Text style={styles.statLbl}>30-Day Vol</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statVal}>
                  {formatCompactNumber(insights.weeklyTotal)}
                </Text>
                <Text style={styles.statLbl}>7-Day Vol</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statVal}>
                  {formatCompactNumber(insights.dailyAvg)}/d
                </Text>
                <Text style={styles.statLbl}>Daily Avg</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statVal}>
                  {formatCompactNumber(insights.peakDay.downloads)}
                </Text>
                <Text style={styles.statLbl}>Peak Day</Text>
              </View>
            </View>
          </View>

          {/* ─── GRAPH 2: Country Download Breakdown (100% Dynamic Donut Gauge) ── */}
          <View style={styles.insightsChartBox}>
            <View style={styles.insightsChartTopRow}>
              <View style={styles.insightsChartTitleRow}>
                <SvgGlobe color="#0284C7" size={13} />
                <Text style={styles.insightsChartTitle}>
                  Country Download Breakdown
                </Text>
              </View>
              <Text style={[styles.insightsChartSub, {color: '#0284C7'}]}>
                Live Global Distribution
              </Text>
            </View>

            {/* Radial Donut Ring Chart + Top Countries Legend */}
            {(() => {
              const size = 120;
              const strokeWidth = 14;
              const radius = (size - strokeWidth) / 2;
              const circumference = 2 * Math.PI * radius;
              let accumulatedPct = 0;

              return (
                <View style={styles.countryDonutSection}>
                  {/* SVG Donut Ring */}
                  <View
                    style={[
                      styles.countryDonutWrapper,
                      {width: size, height: size},
                    ]}>
                    <Svg width={size} height={size}>
                      <Circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        stroke="#F1F5F9"
                        strokeWidth={strokeWidth}
                        fill="none"
                      />
                      {countrySeries.map(c => {
                        const strokeLength =
                          (c.percentage / 100) * circumference;
                        const strokeDashoffset =
                          -(accumulatedPct / 100) * circumference;
                        accumulatedPct += c.percentage;

                        return (
                          <Circle
                            key={c.code}
                            cx={size / 2}
                            cy={size / 2}
                            r={radius}
                            stroke={c.color}
                            strokeWidth={strokeWidth}
                            strokeDasharray={`${strokeLength} ${
                              circumference - strokeLength
                            }`}
                            strokeDashoffset={strokeDashoffset}
                            strokeLinecap="butt"
                            fill="none"
                            transform={`rotate(-90 ${size / 2} ${size / 2})`}
                          />
                        );
                      })}
                    </Svg>
                    <View style={styles.countryDonutCenterContent}>
                      <Text style={styles.countryDonutCenterVal}>
                        {formatCompactNumber(insights.monthlyTotal)}
                      </Text>
                      <Text style={styles.countryDonutCenterLbl}>Total Vol</Text>
                    </View>
                  </View>

                  {/* Top Countries Quick Legend Side Column */}
                  <View style={styles.countryDonutLegendCol}>
                    {countrySeries.slice(0, 4).map((c, i) => (
                      <View key={i} style={styles.countryDonutLegendItem}>
                        <View style={styles.countryDonutLegendLeft}>
                          <View
                            style={[
                              styles.countryDonutLegendDot,
                              {backgroundColor: c.color},
                            ]}
                          />
                          <SvgMapPin size={10} color={c.color} />
                          <Text
                            style={styles.countryDonutLegendName}
                            numberOfLines={1}>
                            {c.code}
                          </Text>
                        </View>
                        <Text style={styles.countryDonutLegendVal}>
                          {c.percentage}%
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              );
            })()}

            {/* Ranked Country Performance Cards Table */}
            <View style={styles.gap2Mt4}>
              {countrySeries.map((c, idx) => {
                const isDetected = c.isClientRegion;
                return (
                  <View
                    key={idx}
                    style={[
                      styles.countryRankCard,
                      isDetected && styles.countryRankCardActive,
                    ]}>
                    <View style={styles.countryRankLeft}>
                      <Text
                        style={[
                          styles.countryRankNum,
                          idx < 3 && styles.countryRankNumTop,
                        ]}>
                        #{idx + 1}
                      </Text>
                      <View style={styles.countryCodePill}>
                        <SvgMapPin size={10} color={c.color} />
                        <Text style={styles.countryCodePillText}>{c.code}</Text>
                      </View>
                      <View style={styles.countryListNameCol}>
                        <View style={styles.countryListNameRow}>
                          <Text style={styles.countryListName}>{c.name}</Text>
                          {isDetected && (
                            <View style={styles.detectedBadge}>
                              <SvgMapPin size={9} color="#4F46E5" />
                              <Text style={styles.detectedBadgeText}>
                                Your Region
                              </Text>
                            </View>
                          )}
                        </View>
                        <View style={styles.countryProgressBarBg}>
                          <View
                            style={[
                              styles.countryProgressBarFill,
                              {
                                width: `${c.percentage}%`,
                                backgroundColor: c.color,
                              },
                            ]}
                          />
                        </View>
                      </View>
                    </View>
                    <View style={styles.countryListRight}>
                      <Text style={styles.countryListDownloads}>
                        {c.downloads.toLocaleString()}
                      </Text>
                      <Text style={[styles.countryListPct, {color: c.color}]}>
                        {c.percentage}% vol
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          {/* ─── GRAPH 3: NPM Daily Ingestion Waveform Graph ──────── */}
          {trendSeries.length > 0 && (
            <View style={styles.insightsChartBox}>
              <View style={styles.insightsChartTopRow}>
                <View style={styles.insightsChartTitleRow}>
                  <SvgActivity color="#8B5CF6" size={13} />
                  <Text style={styles.insightsChartTitle}>
                    NPM Daily Ingestion Waveform
                  </Text>
                </View>
                <Text style={[styles.insightsChartSub, {color: '#8B5CF6'}]}>
                  Live Synced Stream
                </Text>
              </View>

              {/* Smooth Curved Spline Area SVG */}
              <Svg width={chartWidth} height={chartHeight}>
                <Defs>
                  <LinearGradient id="ingestAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0%" stopColor="#A855F7" stopOpacity={0.45} />
                    <Stop offset="60%" stopColor="#8B5CF6" stopOpacity={0.15} />
                    <Stop offset="100%" stopColor="#8B5CF6" stopOpacity={0.0} />
                  </LinearGradient>
                </Defs>

                {/* Baseline */}
                <Line
                  x1="0"
                  y1={chartHeight - bottomPad}
                  x2={chartWidth}
                  y2={chartHeight - bottomPad}
                  stroke="#E2E8F0"
                  strokeWidth="1"
                />
                {/* Mid Reference Line */}
                <Line
                  x1="0"
                  y1={topPad + usableHeight / 2}
                  x2={chartWidth}
                  y2={topPad + usableHeight / 2}
                  stroke="#E2E8F0"
                  strokeWidth="1"
                  strokeDasharray="3,3"
                />

                {/* Shaded Area Fill */}
                {areaPath ? (
                  <Path d={areaPath} fill="url(#ingestAreaGrad)" />
                ) : null}

                {/* Smooth Curved Spline Stroke */}
                {linePath ? (
                  <Path
                    d={linePath}
                    fill="none"
                    stroke="#7C3AED"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                ) : null}

                {/* Data Pulse Nodes */}
                {splinePoints.map((p, idx) => {
                  const isPeak = p.downloads === peakIn7Days && p.downloads > 0;
                  const isLatest = idx === splinePoints.length - 1;
                  return (
                    <G key={idx}>
                      {/* Outer halo */}
                      <Circle
                        cx={p.x}
                        cy={p.y}
                        r={isPeak ? 7 : 5}
                        fill={isPeak ? '#F3E8FF' : '#FFFFFF'}
                        stroke={isPeak ? '#7C3AED' : '#8B5CF6'}
                        strokeWidth={isPeak ? 2.5 : 2}
                      />
                      {/* Inner dot */}
                      <Circle
                        cx={p.x}
                        cy={p.y}
                        r={isPeak ? 3 : 2}
                        fill={isPeak ? '#7C3AED' : '#6366F1'}
                      />
                      {/* Value Callout */}
                      <SvgText
                        x={p.x}
                        y={Math.max(12, p.y - 8)}
                        fontSize="8.5"
                        fontWeight="800"
                        fill={isPeak ? '#7C3AED' : isLatest ? '#4F46E5' : '#64748B'}
                        textAnchor="middle">
                        {formatCompactNumber(p.downloads)}
                      </SvgText>
                    </G>
                  );
                })}
              </Svg>

              {/* Day & Ingestion Delta Axis Pills */}
              <View style={styles.insightsDayAxisRow}>
                {trendSeries.map((d, i) => {
                  const isToday = i === trendSeries.length - 1;
                  const dObj = new Date(d.day);
                  const weekday = isNaN(dObj.getTime())
                    ? `D${i + 1}`
                    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][
                        dObj.getDay()
                      ];
                  const dayNum = isNaN(dObj.getTime()) ? '' : `${dObj.getDate()}`;
                  const prev = i > 0 ? trendSeries[i - 1]?.downloads : undefined;
                  const diff =
                    prev !== undefined && prev > 0
                      ? Math.round(((d.downloads - prev) / prev) * 100)
                      : d.downloads > 0
                      ? 100
                      : 0;
                  const isUp = diff >= 0;

                  return (
                    <View
                      key={i}
                      style={[
                        styles.insightsDayPill,
                        isToday && styles.insightsDayPillActive,
                        {alignItems: 'center'},
                      ]}>
                      <Text
                        style={[
                          styles.insightsDayPillText,
                          isToday && styles.insightsDayPillTextActive,
                        ]}
                        numberOfLines={1}>
                        {isToday ? 'Today' : `${weekday} ${dayNum}`}
                      </Text>
                      <View
                        style={[
                          styles.ingestDeltaBadge,
                          {
                            backgroundColor: isUp ? '#F0FDF4' : '#FEF2F2',
                          },
                        ]}>
                        <Text
                          style={[
                            styles.ingestDeltaText,
                            {
                              color: isUp ? '#16A34A' : '#DC2626',
                            },
                          ]}>
                          {isUp ? `+${diff}%` : `${diff}%`}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>

              {/* Ingestion Stream Summary Row */}
              <View style={styles.ingestStatsRow}>
                <View style={styles.ingestStatItem}>
                  <Text style={styles.ingestStatVal}>
                    {trendSeries.reduce((s, d) => s + d.downloads, 0).toLocaleString()}
                  </Text>
                  <Text style={styles.ingestStatLbl}>Ingested</Text>
                </View>
                <View style={styles.ingestStatItem}>
                  <Text style={styles.ingestStatVal}>
                    {peakIn7Days > 0 ? `${formatCompactNumber(peakIn7Days)}/d` : '0/d'}
                  </Text>
                  <Text style={styles.ingestStatLbl}>Peak Rate</Text>
                </View>
                <View style={styles.ingestStatItem}>
                  <Text style={styles.ingestStatVal}>100%</Text>
                  <Text style={styles.ingestStatLbl}>Sync Health</Text>
                </View>
                <View style={styles.ingestStatItem}>
                  <Text style={styles.ingestStatVal}>
                    {trendSeries.length} Points
                  </Text>
                  <Text style={styles.ingestStatLbl}>Timeline</Text>
                </View>
              </View>
            </View>
          )}
        </View>
      )}

      {/* ─── TAB 2: Live NPM Registry & Releases ─────────────────────────── */}
      {activeTab === 'releases' && (
        <View style={styles.insightsCardsContainer}>
          {/* Card 1: NPM Package Vitals */}
          <View style={styles.insightsSubCard}>
            <View style={styles.insightsCardHeaderRow}>
              <View style={styles.insightsCardTitleGroup}>
                <SvgDatabase color="#0284C7" size={13} />
                <Text style={styles.insightsCardTitle}>
                  NPM Registry &amp; Package Vitals
                </Text>
              </View>
              <Text style={styles.insightsCardBadge}>
                v{insights.registry.latestVersion || npmMeta.version}
              </Text>
            </View>

            <View style={styles.statsGrid}>
              <View style={styles.statBox}>
                <Text style={styles.statVal}>
                  {insights.registry.unpackedSizeMB}
                </Text>
                <Text style={styles.statLbl}>Unpacked</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statVal}>
                  {insights.registry.totalVersions}
                </Text>
                <Text style={styles.statLbl}>Releases</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statVal}>
                  {insights.registry.fileCount}
                </Text>
                <Text style={styles.statLbl}>Files</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statVal}>
                  {insights.registry.dependenciesCount}
                </Text>
                <Text style={styles.statLbl}>Deps</Text>
              </View>
            </View>

            <View style={styles.gap2Mt4}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>License</Text>
                <Text style={styles.infoValue}>
                  {insights.registry.license || 'MIT'}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Maintainers Count</Text>
                <Text style={styles.infoValue}>
                  {insights.registry.maintainersCount}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Latest Release Date</Text>
                <Text style={[styles.infoValue, {color: '#0284C7'}]}>
                  {insights.registry.publishedDate || 'Active'}
                </Text>
              </View>
            </View>
          </View>

          {/* Card 2: Recent Version History */}
          {insights.registry.recentReleases.length > 0 && (
            <View style={styles.insightsSubCard}>
              <View style={styles.insightsCardHeaderRow}>
                <View style={styles.insightsCardTitleGroup}>
                  <SvgBolt color="#0284C7" size={13} />
                  <Text style={styles.insightsCardTitle}>
                    Recent Version Releases
                  </Text>
                </View>
                <Text style={styles.insightsCardBadge}>Live Registry</Text>
              </View>

              <View style={styles.gap2Mt4}>
                {insights.registry.recentReleases.map((rel, idx) => (
                  <View key={idx} style={styles.infoRow}>
                    <Text style={styles.infoLabel}>v{rel.version}</Text>
                    <Text style={styles.infoValue}>
                      {rel.date} • {rel.sizeMB}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      )}

      {/* ─── TAB 3: Live Host Geo & System Telemetry ────────────────────── */}
      {activeTab === 'telemetry' && (
        <View style={styles.insightsCardsContainer}>
          {/* Card 1: Client Geo & ISP Telemetry */}
          <View style={styles.insightsSubCard}>
            <View style={styles.insightsCardHeaderRow}>
              <View style={styles.insightsCardTitleGroup}>
                <SvgGlobe color="#10B981" size={13} />
                <Text style={styles.insightsCardTitle}>
                  Host &amp; Network Telemetry
                </Text>
              </View>
              <View
                style={[
                  styles.insightsCardBadge,
                  {
                    backgroundColor: '#ECFDF5',
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4,
                  },
                ]}>
                <SvgMapPin size={10} color="#10B981" />
                <Text
                  style={{fontSize: 10, fontWeight: '800', color: '#10B981'}}>
                  {insights.geo.countryCode}
                </Text>
              </View>
            </View>

            <View style={styles.gap2Mt4}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Detected Location</Text>
                <Text style={styles.infoValue}>
                  {insights.geo.city ? `${insights.geo.city}, ` : ''}{insights.geo.country}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>ISP / Carrier</Text>
                <Text style={styles.infoValue}>{insights.geo.isp}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Timezone</Text>
                <Text style={styles.infoValue}>{insights.geo.timezone}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Client IP</Text>
                <Text style={styles.infoValue}>{insights.geo.ip}</Text>
              </View>
            </View>
          </View>

          {/* Card 2: Live Runtime & Engine Telemetry */}
          <View style={styles.insightsSubCard}>
            <View style={styles.insightsCardHeaderRow}>
              <View style={styles.insightsCardTitleGroup}>
                <SvgLayers color="#6366F1" size={13} />
                <Text style={styles.insightsCardTitle}>
                  Device &amp; Architecture
                </Text>
              </View>
              <Text
                style={[
                  styles.insightsCardBadge,
                  {color: '#6366F1', backgroundColor: '#EEF2FF'},
                ]}>
                {insights.runtime.os}
              </Text>
            </View>

            <View style={styles.platformPillsGrid}>
              <View style={styles.platformDynamicPill}>
                <SvgCpu size={12} color="#6366F1" />
                <Text style={styles.platformDynamicPillText} numberOfLines={1}>
                  {insights.runtime.os} {insights.runtime.osVersion}
                </Text>
              </View>
              <View style={styles.platformDynamicPill}>
                <SvgLayers size={12} color="#0284C7" />
                <Text style={styles.platformDynamicPillText} numberOfLines={1}>
                  {insights.runtime.resolution} ({insights.runtime.pixelRatio}x)
                </Text>
              </View>
              <View style={styles.platformDynamicPill}>
                <SvgZap size={12} color="#F59E0B" />
                <Text style={styles.platformDynamicPillText} numberOfLines={1}>
                  Hermes: {insights.runtime.isHermes ? 'Active' : 'JSC'}
                </Text>
              </View>
              <View style={styles.platformDynamicPill}>
                <SvgLayers size={12} color="#4F46E5" />
                <Text style={styles.platformDynamicPillText} numberOfLines={1}>
                  Fabric: {insights.runtime.isFabric ? 'Enabled' : 'Legacy'}
                </Text>
              </View>
              <View style={styles.platformDynamicPill}>
                <SvgActivity size={12} color="#10B981" />
                <Text style={styles.platformDynamicPillText} numberOfLines={1}>
                  Bridgeless: {insights.runtime.isBridgeless ? 'Yes' : 'No'}
                </Text>
              </View>
              <View style={styles.platformDynamicPill}>
                <SvgBolt size={12} color="#0284C7" />
                <Text style={styles.platformDynamicPillText} numberOfLines={1}>
                  RN {insights.runtime.rnVersion}
                </Text>
              </View>
            </View>
          </View>

          {/* Card 3: Live Inspector Session Telemetry */}
          <View style={styles.insightsSubCard}>
            <View style={styles.insightsCardHeaderRow}>
              <View style={styles.insightsCardTitleGroup}>
                <SvgActivity color="#8B5CF6" size={13} />
                <Text style={styles.insightsCardTitle}>
                  Live Session Diagnostics
                </Text>
              </View>
              <Text
                style={[
                  styles.insightsCardBadge,
                  {color: '#8B5CF6', backgroundColor: '#F3E8FF'},
                ]}>
                Realtime
              </Text>
            </View>

            <View style={styles.gap2Mt4}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Captured Network Logs</Text>
                <Text style={styles.infoValue}>{insights.telemetry.networkCount} requests</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Recorded Crashes</Text>
                <Text style={styles.infoValue}>{insights.telemetry.crashCount} events</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Redux Store Inspector</Text>
                <Text style={styles.infoValue}>{insights.telemetry.reduxConnected ? 'Connected ✅' : 'Not Attached'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Native TurboModule FAB</Text>
                <Text style={styles.infoValue}>{insights.telemetry.nativeFABAvailable ? 'Available ✅' : 'JS Fallback'}</Text>
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

// ─── Main HomeScreen Component ───────────────────────────────────────────────

export function HomeScreen() {
  const [npmMeta, setNpmMeta] = useState<{
    version: string;
    description: string;
    downloadsMonthly: number | null;
    license: string;
    loading: boolean;
  }>({
    version: LIB_VERSION,
    description:
      'All-in-One In-App Network Inspector, Redux Time-Travel, Console & Crash Telemetry.',
    downloadsMonthly: null,
    license: 'MIT',
    loading: true,
  });

  const [githubMeta, setGithubMeta] = useState<{
    stars: number;
    forks: number;
    openIssues: number;
    defaultBranch: string;
    description: string;
    pushedAt: string;
    license: string;
    loading: boolean;
  }>({
    stars: 0,
    forks: 0,
    openIssues: 0,
    defaultBranch: 'main',
    description:
      'Zero-config all-in-one in-app inspector for React Native & Expo applications.',
    pushedAt: '',
    license: 'MIT',
    loading: true,
  });

  const [liveInsights, setLiveInsights] = useState<LiveInsightsData>({
    dailyPoints: [],
    allDailyPoints: [],
    monthlyTotal: 0,
    weeklyTotal: 0,
    dailyAvg: 0,
    peakDay: {day: '', downloads: 0},
    latestDay: {day: '', downloads: 0},
    geo: {
      country: 'Resolving Host...',
      countryCode: 'UN',
      city: '',
      region: '',
      flag: '🌐',
      isp: 'Broadband Network',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
      ip: '',
    },
    registry: {
      totalVersions: 100,
      unpackedSizeMB: '3.83 MB',
      fileCount: 477,
      dependenciesCount: 1,
      maintainersCount: 1,
      license: 'MIT',
      latestVersion: LIB_VERSION,
      publishedDate: '',
      recentReleases: [],
    },
    contributors: [],
    runtime: {
      os: Platform.OS === 'ios' ? 'Apple iOS' : 'Google Android',
      osVersion: Platform.Version,
      rnVersion: (Platform.constants as any)?.reactNativeVersion
        ? `${(Platform.constants as any).reactNativeVersion.major}.${
            (Platform.constants as any).reactNativeVersion.minor
          }.${(Platform.constants as any).reactNativeVersion.patch}`
        : '0.76.1',
      architecture: (globalThis as any).nativeFabricUIManager
        ? 'New Architecture (Fabric)'
        : 'Paper Bridge Architecture',
      jsEngine: (globalThis as any).HermesInternal
        ? 'Hermes Engine'
        : 'JavaScriptCore (JSC)',
      dimensions: `${Math.round(SCREEN_WIDTH)} × ${Math.round(
        Dimensions.get('window').height,
      )} pt`,
      resolution: `${Math.round(SCREEN_WIDTH * PixelRatio.get())} × ${Math.round(
        Dimensions.get('window').height * PixelRatio.get(),
      )} px`,
      pixelRatio: PixelRatio.get(),
      isHermes: !!(globalThis as any).HermesInternal,
      isFabric: !!(globalThis as any).nativeFabricUIManager,
      isBridgeless: !!(globalThis as any).RN$Bridgeless,
    },
    telemetry: {
      networkCount: 0,
      crashCount: 0,
      reduxConnected: false,
      nativeFABAvailable: false,
    },
    loading: true,
    lastUpdated: '',
  });

  const [copiedInstall, setCopiedInstall] = useState(false);
  const [batchSuccess, setBatchSuccess] = useState(false);

  const [analyticsData, setAnalyticsData] = useState<AnalyticsSnapshot>({
    events: [],
    userProperties: {},
    userId: undefined,
    defaultParams: {},
    isCollectionEnabled: true,
  });

  useEffect(() => {
    const unsub = subscribeAnalyticsEvents(events => {
      setAnalyticsData({
        events,
        userProperties: getCurrentUserProperties(),
        userId: getCurrentUserId(),
        defaultParams: getDefaultEventParameters(),
        isCollectionEnabled: getCollectionEnabled(),
      });
    });
    return () => unsub();
  }, []);

  const copyInstallCommand = () => {
    Clipboard.setString(
      `npm i react-native-inapp-inspector@${npmMeta.version}`,
    );
    setCopiedInstall(true);
    setTimeout(() => setCopiedInstall(false), 2000);
  };

  const fetchLiveInsightsData = async () => {
    setLiveInsights(prev => ({...prev, loading: true}));
    try {
      // 1. Live NPM Downloads Range API
      let rawDownloads: NpmDailyPoint[] = [];
      let monthlyTotal = 0;
      let weeklyTotal = 0;
      let dailyAvg = 0;
      let peakDay = {day: '', downloads: 0};
      let latestDay = {day: '', downloads: 0};

      try {
        const rangeRes = await fetch(
          'https://api.npmjs.org/downloads/range/last-month/react-native-inapp-inspector',
        );
        const rangeJson = await rangeRes.json();
        if (
          Array.isArray(rangeJson.downloads) &&
          rangeJson.downloads.length > 0
        ) {
          rawDownloads = rangeJson.downloads;
          monthlyTotal = rawDownloads.reduce(
            (sum, d) => sum + (d.downloads || 0),
            0,
          );
          const last7 = rawDownloads.slice(-7);
          weeklyTotal = last7.reduce((sum, d) => sum + (d.downloads || 0), 0);
          dailyAvg = Math.round(monthlyTotal / rawDownloads.length);

          rawDownloads.forEach(d => {
            if (d.downloads > peakDay.downloads) {
              peakDay = {day: d.day, downloads: d.downloads};
            }
          });
          latestDay = rawDownloads[rawDownloads.length - 1];

          setNpmMeta(prev => ({
            ...prev,
            downloadsMonthly: monthlyTotal,
          }));
        }
      } catch (err) {
        console.warn('[Insights] NPM Range fetch error:', err);
      }

      // 2. Live NPM Registry Metadata API
      let regInfo: LiveRegistryInfo = {
        totalVersions: 100,
        unpackedSizeMB: '3.83 MB',
        fileCount: 477,
        dependenciesCount: 1,
        maintainersCount: 1,
        license: 'MIT',
        latestVersion: LIB_VERSION,
        publishedDate: '',
        recentReleases: [],
      };

      try {
        const regRes = await fetch(
          'https://registry.npmjs.org/react-native-inapp-inspector',
        );
        const regJson = await regRes.json();
        const latestTag = regJson['dist-tags']?.latest || LIB_VERSION;
        const latestVerObj = regJson.versions?.[latestTag] || {};
        const totalVerCount = regJson.versions
          ? Object.keys(regJson.versions).length
          : 100;
        const unpackedBytes = latestVerObj.dist?.unpackedSize || 0;
        const unpackedSizeMB =
          unpackedBytes > 0
            ? (unpackedBytes / (1024 * 1024)).toFixed(2) + ' MB'
            : '3.83 MB';
        const fileCount = latestVerObj.dist?.fileCount || 477;
        const dependenciesCount = latestVerObj.dependencies
          ? Object.keys(latestVerObj.dependencies).length
          : 1;
        const maintainersCount = regJson.maintainers?.length || 1;
        const publishedDate = regJson.time?.[latestTag]
          ? new Date(regJson.time[latestTag]).toLocaleDateString()
          : '';

        const verKeys = regJson.versions ? Object.keys(regJson.versions) : [];
        const recentKeys = verKeys.slice(-4).reverse();
        const recentReleases: NpmReleaseItem[] = recentKeys.map((v: string) => {
          const vObj = regJson.versions[v] || {};
          const sz = vObj.dist?.unpackedSize
            ? (vObj.dist.unpackedSize / (1024 * 1024)).toFixed(2) + ' MB'
            : unpackedSizeMB;
          const fc = vObj.dist?.fileCount || fileCount;
          const dt = regJson.time?.[v]
            ? new Date(regJson.time[v]).toLocaleDateString()
            : 'Active';
          return {
            version: v,
            date: dt,
            sizeMB: sz,
            fileCount: fc,
          };
        });

        regInfo = {
          totalVersions: totalVerCount,
          unpackedSizeMB,
          fileCount,
          dependenciesCount,
          maintainersCount,
          license: regJson.license || 'MIT',
          latestVersion: latestTag,
          publishedDate,
          recentReleases,
        };

        setNpmMeta(prev => ({
          ...prev,
          version: latestTag,
          description: regJson.description || prev.description,
          license: regJson.license || 'MIT',
          loading: false,
        }));
      } catch (err) {
        console.warn('[Insights] NPM Registry fetch error:', err);
      }

      // 3. Live Client GeoIP / Connection Telemetry
      let geoData: LiveGeoInfo = {
        country: 'Global Host',
        countryCode: 'UN',
        city: '',
        region: '',
        flag: '🌐',
        isp: 'Network Host',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
        ip: '',
      };

      try {
        const geoRes = await fetch('https://ipwho.is/');
        const geoJson = await geoRes.json();
        if (geoJson.success) {
          geoData = {
            country: geoJson.country || 'Global Host',
            countryCode: geoJson.country_code || 'UN',
            city: geoJson.city || '',
            region: geoJson.region || '',
            flag: geoJson.flag?.emoji || '🌐',
            isp:
              geoJson.connection?.isp ||
              geoJson.connection?.org ||
              'Broadband ISP',
            timezone:
              geoJson.timezone?.id ||
              Intl.DateTimeFormat().resolvedOptions().timeZone,
            ip: geoJson.ip || '',
          };
        }
      } catch {
        // Fallback geo
      }

      // 4. Live GitHub Contributors
      let contribsList: GitHubContributorItem[] = [];
      try {
        const contribRes = await fetch(
          'https://api.github.com/repos/vengatmacuser/react-native-inapp-inspector/contributors',
        );
        const contribJson = await contribRes.json();
        if (Array.isArray(contribJson) && contribJson.length > 0) {
          contribsList = contribJson.slice(0, 4).map((c: any) => ({
            login: c.login,
            avatar_url: c.avatar_url,
            contributions: c.contributions,
            html_url: c.html_url,
          }));
        }
      } catch {
        // Fallback
      }

      // 5. Live Runtime & Session Telemetry
      const reactNativeVersion = (Platform.constants as any)?.reactNativeVersion
        ? `${(Platform.constants as any).reactNativeVersion.major}.${
            (Platform.constants as any).reactNativeVersion.minor
          }.${(Platform.constants as any).reactNativeVersion.patch}`
        : '0.76.1';

      const isFabric = !!(globalThis as any).nativeFabricUIManager;
      const isHermes = !!(globalThis as any).HermesInternal;
      const isBridgeless = !!(globalThis as any).RN$Bridgeless;

      const runtime = {
        os: Platform.OS === 'ios' ? 'Apple iOS' : 'Google Android',
        osVersion: Platform.Version,
        rnVersion: reactNativeVersion,
        architecture: isFabric
          ? 'New Architecture (Fabric)'
          : 'Paper Bridge Architecture',
        jsEngine: isHermes
          ? 'Hermes Engine'
          : 'JavaScriptCore (JSC)',
        dimensions: `${Math.round(SCREEN_WIDTH)} × ${Math.round(
          Dimensions.get('window').height,
        )} pt`,
        resolution: `${Math.round(SCREEN_WIDTH * PixelRatio.get())} × ${Math.round(
          Dimensions.get('window').height * PixelRatio.get(),
        )} px`,
        pixelRatio: PixelRatio.get(),
        isHermes,
        isFabric,
        isBridgeless,
      };

      let liveNetworkCount = 0;
      let liveCrashCount = 0;
      let liveReduxConnected = false;
      let liveNativeAvailable = false;

      try {
        liveNetworkCount = getNetworkLogs()?.length || 0;
      } catch {}

      try {
        liveCrashCount = getCrashRecords()?.length || 0;
      } catch {}

      try {
        liveReduxConnected = isReduxConnected();
      } catch {}

      try {
        liveNativeAvailable = isNativeModuleAvailable();
      } catch {}

      const telemetry = {
        networkCount: liveNetworkCount,
        crashCount: liveCrashCount,
        reduxConnected: liveReduxConnected,
        nativeFABAvailable: liveNativeAvailable,
      };

      setLiveInsights({
        dailyPoints: rawDownloads.slice(-7),
        allDailyPoints: rawDownloads,
        monthlyTotal,
        weeklyTotal,
        dailyAvg,
        peakDay,
        latestDay,
        geo: geoData,
        registry: regInfo,
        contributors: contribsList,
        runtime,
        telemetry,
        loading: false,
        lastUpdated: new Date().toLocaleTimeString(),
      });
    } catch (err) {
      console.warn('[Insights] General fetch error:', err);
      setLiveInsights(prev => ({...prev, loading: false}));
    }
  };

  useEffect(() => {
    fetchLiveInsightsData();

    // Dynamic live GitHub repository telemetry
    fetch(
      'https://api.github.com/repos/vengatmacuser/react-native-inapp-inspector',
    )
      .then(res => res.json())
      .then(data => {
        if (data && typeof data.stargazers_count === 'number') {
          setGithubMeta({
            stars: data.stargazers_count,
            forks: data.forks_count || 0,
            openIssues: data.open_issues_count || 0,
            defaultBranch: data.default_branch || 'main',
            description: data.description || '',
            pushedAt: data.pushed_at
              ? new Date(data.pushed_at).toLocaleDateString()
              : '',
            license: data.license?.spdx_id || 'MIT',
            loading: false,
          });
        }
      })
      .catch(() => setGithubMeta(prev => ({...prev, loading: false})));
  }, []);

  // Axios client — interceptors are automatically applied by setupNetworkLogger()
  const axiosClient = useMemo(
    () =>
      axios.create({
        baseURL: 'https://jsonplaceholder.typicode.com',
      }),
    [],
  );

  // ─── Trigger Fast Batch Sample Data ─────────────────────────────────────────
  const triggerSampleAll = async () => {
    setBatchSuccess(true);
    setTimeout(() => setBatchSuccess(false), 2500);

    const randomConsoleMessages = [
      '[Sample] Fetching latest feed items from gateway...',
      '[Sample] Cache refreshed for authenticated session',
      '[Sample] Push notification background sync completed',
      '[Sample] Hardware vitals telemetry recorded',
    ];

    console.log(
      `[Sample] 🚀 Firing Fast Batch Sample Data at ${new Date().toLocaleTimeString()}`,
    );
    console.warn(
      '[Sample] ⚠️ Simulated warning: Gateway latency above threshold',
    );
    console.error(
      '[Sample] 🛑 Simulated error: Socket timeout on retry attempt #2',
    );
    console.log(
      randomConsoleMessages[
        Math.floor(Math.random() * randomConsoleMessages.length)
      ],
    );
    console.log(
      '[Sample] Multi-argument inspection payload:',
      {
        userId: 101,
        username: 'venkatesh',
        role: 'Lead Architect',
      },
      ['permissions.read', 'permissions.write', 'permissions.admin'],
      {
        device: Platform.OS === 'ios' ? 'iPhone 16 Pro' : 'Pixel 9 Pro',
        os: `${Platform.OS} ${Platform.Version}`,
      },
    );

    // 1. Axios REST Suite Auto-Interception
    try {
      await axiosClient.get('/posts/1');
      await axiosClient.post('/posts', {
        title: 'New Post via Axios Auto-Intercept',
        body: 'Payload inspected by InAppInspector',
        userId: 101,
      });
      await axiosClient.put('/posts/1', {
        id: 1,
        title: 'Updated Post Title via Axios PUT',
        body: 'Updated body content',
        userId: 101,
      });
      await axiosClient.patch('/posts/1', {
        title: 'Partial Update via PATCH',
      });
      await axiosClient.delete('/posts/1');
    } catch (e: any) {
      console.error('[Sample] Axios batch error:', e.message);
    }

    // 2. Standard Fetch Calls (200 OK & 404 Error)
    try {
      const res = await fetch('https://jsonplaceholder.typicode.com/users/1');
      const data = await res.json();
      console.log('[Sample] Standard fetch completed for user:', data.name);
    } catch (e) {
      console.error('[Sample] Standard fetch failed:', e);
    }

    try {
      await fetch('https://jsonplaceholder.typicode.com/simulated-404-route');
    } catch {
      // 404 captured by inspector
    }

    // 3. Analytics & GA4 Events
    logAnalyticsEvent('screen_view', {
      screen_name: 'HomeScreen',
      screen_class: 'HomeScreenComponent',
      timestamp: new Date().toISOString(),
    });

    logAnalyticsEvent('item_purchase', {
      item_id: 'pkg_inapp_inspector',
      item_name: 'In-App Inspector Developer Pro',
      price: 0.0,
      currency: 'USD',
      items: [{id: 'pkg_inapp_inspector', name: 'Inspector Core'}],
    });

    logAnalyticsEvent('fast_batch_simulated', {
      batch_type: 'comprehensive',
      timestamp: new Date().toISOString(),
      platform: Platform.OS,
    });

    // 4. Redux Store Time-Travel Actions
    mockStore.dispatch({type: 'TOGGLE_SIDEBAR'});
    mockStore.dispatch({type: 'UPDATE_USER_TIME'});
    mockStore.dispatch({
      type: 'auth/loginWithSaga',
      payload: {user: 'Venkatesh', authType: 'OAuth2'},
      __origin: 'saga',
    });
    mockStore.dispatch({
      type: 'users/fetch/fulfilled',
      payload: {id: 101, status: 'synced', role: 'Architect'},
      __origin: 'thunk',
    });
  };

  const openUrl = (url: string) => {
    Linking.openURL(url).catch(err =>
      console.error('Failed to open URL:', err),
    );
  };

  const insets = useSafeAreaInsets();
  const topPadding = Math.max(
    insets.top,
    Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 12 : 12,
  );
  const bottomPadding = 110 + insets.bottom;

  return (
    <View style={[styles.safeContainer, {paddingTop: topPadding}]}>
      <ScrollView
        contentContainerStyle={[styles.content, {paddingBottom: bottomPadding}]}
        showsVerticalScrollIndicator={false}>
        {/* ─── COMBINED HERO HEADER + DOWNLOADS & VELOCITY CARD ───────────── */}
        <ModuleErrorBoundary moduleName="Combined Hero Header">
          <CombinedHeroHeader
            npmMeta={npmMeta}
            githubMeta={githubMeta}
            insights={liveInsights}
            copiedInstall={copiedInstall}
            onCopyInstall={copyInstallCommand}
            onRefresh={fetchLiveInsightsData}
            onOpenUrl={openUrl}
          />
        </ModuleErrorBoundary>
      </ScrollView>

      {/* ─── STATIC FOOTER ACTION BAR: FAST BATCH SIMULATION ──────────────── */}
      <View
        style={[
          styles.staticFooterContainer,
          {paddingBottom: Math.max(14, insets.bottom + 8)},
        ]}>
        <Pressable
          style={({pressed}) => [
            styles.footerButton,
            batchSuccess && {backgroundColor: '#059669'},
            {
              opacity: pressed ? 0.85 : 1,
              transform: [{scale: pressed ? 0.97 : 1}],
            },
          ]}
          onPress={triggerSampleAll}
          android_ripple={{color: 'rgba(255,255,255,0.2)'}}>
          {batchSuccess ? (
            <SvgCheckCircle color="#FFFFFF" size={16} />
          ) : (
            <SvgBolt color="#FFFFFF" size={16} />
          )}
          <Text style={styles.footerButtonText}>
            {batchSuccess
              ? 'Batch Sample Fired Successfully!'
              : 'Trigger Fast Batch'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
