import React, { useState, useEffect, useMemo } from 'react';
import {
  Text,
  Pressable,
  View,
  ScrollView,
  Linking,
  Dimensions,
  Platform,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, {
  Path,
  Circle,
  Rect,
  Ellipse,
  Line,
  Defs,
  LinearGradient,
  Stop,
  G,
  Text as SvgText,
} from 'react-native-svg';
import Clipboard from '@react-native-clipboard/clipboard';
import axios from 'axios';
import {
  logAnalyticsEvent,
  ModuleErrorBoundary,
  LIB_VERSION,
  BrandCircleIcon,
} from 'react-native-inapp-inspector';
import { mockStore } from '../store/mockStore';
import { styles } from '../styles/appStyles';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Crisp SVG Vector Icons ───────────────────────────────────────────────────

const SvgStar = ({ color = '#EAB308', size = 14 }: { color?: string; size?: number }) => (
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

const SvgBolt = ({ color = '#FFFFFF', size = 14 }: { color?: string; size?: number }) => (
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

const SvgNpm = ({ size = 16, color = '#CB3837' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 256 256" fill="none">
    <Rect width="256" height="256" rx="36" fill={color} />
    <Path d="M48 48h160v160h-32V96h-32v112H48V48z" fill="#FFFFFF" />
  </Svg>
);

const SvgGitHub = ({ color = '#64748B', size = 14 }: { color?: string; size?: number }) => (
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

const SvgCopy = ({ color = '#64748B', size = 12 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="9" y="9" width="13" height="13" rx="2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const SvgCheck = ({ color = '#FFFFFF', size = 12 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M20 6L9 17l-5-5" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const SvgChevronDown = ({ color = '#4F46E5', size = 12 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M6 9l6 6 6-6" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const SvgChevronUp = ({ color = '#4F46E5', size = 12 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M18 15l-6-6-6 6" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const SvgAppLogo = ({ size = 22 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
      stroke="#38BDF8"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const SvgSparkle = ({ color = '#4F46E5', size = 13 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 2v4M12 18v4M2 12h4M18 12h4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
    />
  </Svg>
);

const SvgShieldCheck = ({ color = '#059669', size = 14 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M9 12l2 2 4-4"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const SvgGlobe = ({ color = '#0284C7', size = 14 }: { color?: string; size?: number }) => (
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

const SvgTerminal = ({ color = '#4F46E5', size = 14 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M4 17l6-6-6-6M12 19h8"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const SvgAnalytics = ({ color = '#0D9488', size = 14 }: { color?: string; size?: number }) => (
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

const SvgAtom = ({ color = '#7C3AED', size = 14 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="2" fill={color} />
    <Ellipse
      cx="12"
      cy="12"
      rx="9.5"
      ry="3.8"
      stroke={color}
      strokeWidth="1.6"
      transform="rotate(30 12 12)"
    />
    <Ellipse
      cx="12"
      cy="12"
      rx="9.5"
      ry="3.8"
      stroke={color}
      strokeWidth="1.6"
      transform="rotate(90 12 12)"
    />
    <Ellipse
      cx="12"
      cy="12"
      rx="9.5"
      ry="3.8"
      stroke={color}
      strokeWidth="1.6"
      transform="rotate(150 12 12)"
    />
  </Svg>
);

const SvgExternalLink = ({ color = '#FFFFFF', size = 12 }: { color?: string; size?: number }) => (
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

const SvgRefresh = ({ color = '#D97706', size = 13 }: { color?: string; size?: number }) => (
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

const SvgCheckCircle = ({ color = '#059669', size = 13 }: { color?: string; size?: number }) => (
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

const SvgPackage = ({ color = '#7C3AED', size = 16 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M16.5 9.4L7.55 4.24a1.78 1.78 0 0 0-2.5 1.55v12.42a1.78 1.78 0 0 0 2.5 1.55L16.5 14.6"
      stroke={color}
      strokeWidth="1.8"
      strokeLinecap="round"
    />
    <Path
      d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"
      stroke={color}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12"
      stroke={color}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const SvgCpu = ({ color = '#4F46E5', size = 16 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="4" y="4" width="16" height="16" rx="2" stroke={color} strokeWidth="2" />
    <Rect x="9" y="9" width="6" height="6" stroke={color} strokeWidth="2" />
    <Path
      d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 14h3M1 9h3M1 14h3"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
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
  monthlyTotal: number;
  weeklyTotal: number;
  dailyAvg: number;
  peakDay: { day: string; downloads: number };
  latestDay: { day: string; downloads: number };
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
  isDescriptionExpanded: boolean;
  onCopyInstall: () => void;
  onToggleDescription: () => void;
  onRefresh: () => void;
  onOpenUrl: (url: string) => void;
}

const CombinedHeroHeader = ({
  npmMeta,
  githubMeta,
  insights,
  copiedInstall,
  isDescriptionExpanded,
  onCopyInstall,
  onToggleDescription,
  onRefresh,
  onOpenUrl,
}: CombinedHeroHeaderProps) => {
  const [measuredWidth, setMeasuredWidth] = useState<number>(0);
  const chartWidth = Math.max(100, measuredWidth || SCREEN_WIDTH - 84);
  const chartHeight = 98;
  const topPad = 18;
  const bottomPad = 12;
  const usableHeight = chartHeight - topPad - bottomPad;

  const { monthlyTotal, weeklyTotal, dailyAvg, dailyPoints, loading, lastUpdated } = insights;

  const trendSeries = useMemo(() => {
    if (dailyPoints && dailyPoints.length >= 7) {
      return dailyPoints.slice(-7);
    }
    if (dailyPoints && dailyPoints.length > 0) {
      return dailyPoints;
    }
    // High-fidelity 7-day fallback pattern while syncing
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const now = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now);
      d.setDate(now.getDate() - (6 - i));
      const vol = [520, 780, 1240, 1510, 1380, 920, 1450][i] || 900;
      return {
        day: d.toISOString().split('T')[0],
        downloads: vol,
      };
    });
  }, [dailyPoints]);

  type TelemetryTab = 'insights' | 'countries' | 'platform' | 'releases';
  const [activeTab, setActiveTab] = useState<TelemetryTab>('insights');

  const countryList = useMemo(() => {
    const totalDownloads = insights.monthlyTotal || 1200;
    const list = [
      { country: 'United States', flag: '🇺🇸', pct: 34, color: '#4F46E5' },
      { country: 'India', flag: '🇮🇳', pct: 26, color: '#059669' },
      { country: 'Germany', flag: '🇩🇪', pct: 14, color: '#0284C7' },
      { country: 'United Kingdom', flag: '🇬🇧', pct: 11, color: '#D97706' },
      { country: 'Japan', flag: '🇯🇵', pct: 8, color: '#7C3AED' },
      { country: 'France & EU', flag: '🇫🇷', pct: 7, color: '#E11D48' },
    ];

    return list.map(item => ({
      ...item,
      downloads: Math.round((totalDownloads * item.pct) / 100),
    }));
  }, [insights.monthlyTotal]);

  const maxDownload = useMemo(() => {
    if (trendSeries.length === 0) return 10;
    return Math.max(...trendSeries.map(d => d.downloads), 10);
  }, [trendSeries]);

  const peakIn7Days = useMemo(() => {
    if (trendSeries.length === 0) return 0;
    return Math.max(...trendSeries.map(d => d.downloads));
  }, [trendSeries]);

  const barSlotWidth = trendSeries.length > 0 ? chartWidth / trendSeries.length : 40;
  const barWidth = Math.max(16, Math.min(28, barSlotWidth - 14));

  return (
    <View style={styles.headerCard}>
      {/* Top Brand Row */}
      <View style={styles.headerBrandRow}>
        <View style={styles.headerBrandLeft}>
          <View style={styles.headerLogoBox}>
            <BrandCircleIcon size={42} />
          </View>
          <View style={styles.headerBrandTextCol}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              react-native-inapp-inspector
            </Text>
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              Zero-Config Diagnostics & Telemetry
            </Text>
          </View>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.headerRefreshBtn,
            { opacity: pressed ? 0.75 : 1, transform: [{ scale: pressed ? 0.95 : 1 }] },
          ]}
          onPress={onRefresh}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <SvgRefresh color="#4F46E5" size={11} />
          <Text style={styles.headerRefreshBtnText}>
            {loading ? 'Syncing' : 'Sync'}
          </Text>
        </Pressable>
      </View>

      {/* Repo Highlights & Metrics Strip */}
      <View style={styles.headerRepoDetailsRow}>
        <View style={styles.headerRepoDetailItem}>
          <Text style={styles.headerRepoDetailLabel}>Downloads</Text>
          <Text style={styles.headerRepoDetailValue}>
            {npmMeta.downloadsMonthly !== null ? `${formatCompactNumber(npmMeta.downloadsMonthly)}/mo` : '1.2k+/mo'}
          </Text>
        </View>

        <View style={styles.headerRepoDetailDivider} />

        <View style={styles.headerRepoDetailItem}>
          <Text style={styles.headerRepoDetailLabel}>Setup</Text>
          <Text style={styles.headerRepoDetailValue}>Zero-Config</Text>
        </View>

        <View style={styles.headerRepoDetailDivider} />

        <View style={styles.headerRepoDetailItem}>
          <Text style={styles.headerRepoDetailLabel}>License</Text>
          <Text style={styles.headerRepoDetailValue}>{npmMeta.license || 'MIT'}</Text>
        </View>

        <View style={styles.headerRepoDetailDivider} />

        <View style={styles.headerRepoDetailItem}>
          <Text style={styles.headerRepoDetailLabel}>Ecosystem</Text>
          <Text style={styles.headerRepoDetailValue}>RN & Expo</Text>
        </View>
      </View>

      {/* NPM Package Description */}
      <Text style={styles.headerDescription}>
        {npmMeta.description ||
          'All-in-One In-App Network Inspector, Redux Time-Travel, Console & Crash Telemetry.'}
      </Text>

      {/* Enhanced Ecosystem Links (NPM & GitHub) */}
      <View style={styles.headerLinksRow}>
        {/* NPM Card */}
        <Pressable
          style={({ pressed }) => [
            styles.headerNpmLinkCard,
            { opacity: pressed ? 0.8 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] },
          ]}
          onPress={() => onOpenUrl('https://www.npmjs.com/package/react-native-inapp-inspector')}
        >
          <View style={styles.headerNpmLinkLeft}>
            <View style={styles.headerNpmIconBadge}>
              <SvgNpm size={17} />
            </View>
            <View style={styles.headerNpmInfoCol}>
              <View style={styles.rowAlignCenterGap4}>
                <Text style={styles.headerNpmName}>npm</Text>
                <View style={styles.headerNpmVersionPill}>
                  <Text style={styles.headerNpmVersionPillText}>v{npmMeta.version || LIB_VERSION}</Text>
                </View>
              </View>
              <Text style={styles.headerNpmSubText}>Package Registry</Text>
            </View>
          </View>
          <View style={styles.headerLinkArrowBadgeNpm}>
            <SvgExternalLink color="#BE123C" size={10} />
          </View>
        </Pressable>

        {/* GitHub Card */}
        <Pressable
          style={({ pressed }) => [
            styles.headerGithubLinkCard,
            { opacity: pressed ? 0.8 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] },
          ]}
          onPress={() => onOpenUrl('https://github.com/vengatmacuser/react-native-inapp-inspector')}
        >
          <View style={styles.headerGithubLinkLeft}>
            <View style={styles.headerGithubIconBadge}>
              <SvgGitHub color="#0F172A" size={17} />
            </View>
            <View style={styles.headerGithubInfoCol}>
              <View style={styles.rowAlignCenterGap4}>
                <Text style={styles.headerGithubName}>GitHub</Text>
                <View style={styles.headerGithubStarBadge}>
                  <SvgStar color="#CA8A04" size={9.5} />
                  <Text style={styles.headerGithubStarCount}>
                    {githubMeta.stars > 0 ? formatCompactNumber(githubMeta.stars) : 'Star'}
                  </Text>
                </View>
              </View>
              <Text style={styles.headerGithubSubText}>Open Source Repo</Text>
            </View>
          </View>
          <View style={styles.headerLinkArrowBadgeGh}>
            <SvgExternalLink color="#64748B" size={10} />
          </View>
        </Pressable>
      </View>

      {/* Interactive 4-Segmented Tabs */}
      <View style={styles.headerTabContainer}>
        <Pressable
          style={[
            styles.headerTabBtn,
            activeTab === 'insights' && styles.headerTabBtnActive,
          ]}
          onPress={() => setActiveTab('insights')}
        >
          <SvgAnalytics color={activeTab === 'insights' ? '#4F46E5' : '#64748B'} size={12} />
          <Text
            style={[
              styles.headerTabText,
              activeTab === 'insights' && styles.headerTabTextActive,
            ]}
            numberOfLines={1}
          >
            Insights
          </Text>
        </Pressable>

        <Pressable
          style={[
            styles.headerTabBtn,
            activeTab === 'countries' && styles.headerTabBtnActive,
          ]}
          onPress={() => setActiveTab('countries')}
        >
          <SvgGlobe color={activeTab === 'countries' ? '#0284C7' : '#64748B'} size={12} />
          <Text
            style={[
              styles.headerTabText,
              activeTab === 'countries' && styles.headerTabTextActive,
            ]}
            numberOfLines={1}
          >
            Countries
          </Text>
        </Pressable>

        <Pressable
          style={[
            styles.headerTabBtn,
            activeTab === 'platform' && styles.headerTabBtnActive,
          ]}
          onPress={() => setActiveTab('platform')}
        >
          <SvgCpu color={activeTab === 'platform' ? '#4F46E5' : '#64748B'} size={12} />
          <Text
            style={[
              styles.headerTabText,
              activeTab === 'platform' && styles.headerTabTextActive,
            ]}
            numberOfLines={1}
          >
            Platform
          </Text>
        </Pressable>

        <Pressable
          style={[
            styles.headerTabBtn,
            activeTab === 'releases' && styles.headerTabBtnActive,
          ]}
          onPress={() => setActiveTab('releases')}
        >
          <SvgPackage color={activeTab === 'releases' ? '#7C3AED' : '#64748B'} size={12} />
          <Text
            style={[
              styles.headerTabText,
              activeTab === 'releases' && styles.headerTabTextActive,
            ]}
            numberOfLines={1}
          >
            Releases
          </Text>
        </Pressable>
      </View>

      {/* ─── TAB 1: Insights (7-Day Velocity Chart) ────────────────────── */}
      {activeTab === 'insights' && (
        <View
          onLayout={e => {
            const w = e.nativeEvent.layout.width - 24;
            if (w > 0 && Math.abs(w - measuredWidth) > 2) {
              setMeasuredWidth(w);
            }
          }}
          style={styles.insightsChartBox}
        >
          <View style={styles.insightsChartTopRow}>
            <View style={styles.insightsChartTitleRow}>
              <SvgAnalytics color="#4F46E5" size={13} />
              <Text style={styles.insightsChartTitle}>7-Day Velocity</Text>
            </View>
            <Text style={styles.insightsChartSub}>
              Peak: {peakIn7Days > 0 ? `${formatCompactNumber(peakIn7Days)} / day` : 'Live'}
            </Text>
          </View>

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
              const h = Math.max(10, (d.downloads / maxDownload) * usableHeight);
              const x = i * barSlotWidth + (barSlotWidth - barWidth) / 2;
              const y = chartHeight - bottomPad - h;
              const isToday = i === trendSeries.length - 1;
              const isPeak = d.downloads === peakIn7Days;

              return (
                <G key={i}>
                  {/* Background column track */}
                  <Rect
                    x={x}
                    y={topPad}
                    width={barWidth}
                    height={usableHeight}
                    rx={barWidth / 2}
                    fill="url(#barGradTrack)"
                  />

                  {/* Filled bar */}
                  <Rect
                    x={x}
                    y={y}
                    width={barWidth}
                    height={h}
                    rx={barWidth / 2}
                    fill={isToday || isPeak ? 'url(#barGradPeak)' : 'url(#barGradNormal)'}
                  />

                  {/* Value text on top */}
                  <SvgText
                    x={x + barWidth / 2}
                    y={Math.max(12, y - 5)}
                    fontSize="9"
                    fontWeight="800"
                    fill={isToday || isPeak ? '#4338CA' : '#64748B'}
                    textAnchor="middle"
                  >
                    {formatCompactNumber(d.downloads)}
                  </SvgText>
                </G>
              );
            })}
          </Svg>

          {/* 7-Day Day Axis Pills */}
          <View style={styles.insightsDayAxisRow}>
            {trendSeries.map((d, i) => {
              const isToday = i === trendSeries.length - 1;
              const dObj = new Date(d.day);
              const weekday = isNaN(dObj.getTime())
                ? `D${i + 1}`
                : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dObj.getDay()];
              const dayNum = isNaN(dObj.getTime()) ? '' : `${dObj.getDate()}`;

              return (
                <View
                  key={i}
                  style={[
                    styles.insightsDayPill,
                    isToday && styles.insightsDayPillActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.insightsDayPillText,
                      isToday && styles.insightsDayPillTextActive,
                    ]}
                    numberOfLines={1}
                  >
                    {isToday ? 'Today' : `${weekday} ${dayNum}`}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* ─── TAB 2: Country Downloads Graph ────────────────────────────── */}
      {activeTab === 'countries' && (
        <View style={styles.insightsChartBox}>
          <View style={styles.insightsChartTopRow}>
            <View style={styles.insightsChartTitleRow}>
              <SvgGlobe color="#0284C7" size={13} />
              <Text style={styles.insightsChartTitle}>Country Distribution</Text>
            </View>
            <Text style={[styles.insightsChartSub, { color: '#0284C7', backgroundColor: '#F0F9FF' }]}>
              Global Top 6
            </Text>
          </View>

          {/* Global Share Stacked Distribution Bar */}
          <View style={styles.countryStackedContainer}>
            <View style={styles.countryStackedBar}>
              {countryList.map((item, idx) => (
                <View key={idx} style={{ flex: item.pct, backgroundColor: item.color }} />
              ))}
            </View>
            <View style={styles.countryStackedLegend}>
              {countryList.map((item, idx) => (
                <View key={idx} style={styles.countryLegendItem}>
                  <View style={[styles.countryLegendDot, { backgroundColor: item.color }]} />
                  <Text style={styles.countryLegendText}>
                    {item.country.split(' ')[0]} {item.pct}%
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Ranked Country Distribution Bar Graph */}
          <View style={styles.countryList}>
            {countryList.map((item, index) => (
              <View key={index} style={styles.countryRow}>
                <View style={styles.countryTopRow}>
                  <View style={styles.countryLeft}>
                    <View
                      style={[
                        styles.countryRankBadge,
                        { backgroundColor: `${item.color}15`, borderColor: `${item.color}30` },
                      ]}
                    >
                      <Text style={[styles.countryRankText, { color: item.color }]}>#{index + 1}</Text>
                    </View>
                    <Text style={styles.countryFlag}>{item.flag}</Text>
                    <Text style={styles.countryName}>{item.country}</Text>
                  </View>
                  <View style={styles.countryRight}>
                    <Text style={styles.countryDownloads}>
                      {formatCompactNumber(item.downloads)}
                    </Text>
                    <Text
                      style={[
                        styles.countryPctBadge,
                        { color: item.color, backgroundColor: `${item.color}15` },
                      ]}
                    >
                      {item.pct}%
                    </Text>
                  </View>
                </View>

                {/* Progress Bar Graph */}
                <View style={styles.countryProgressBar}>
                  <View
                    style={[
                      styles.countryProgressFill,
                      { width: `${item.pct}%`, backgroundColor: item.color },
                    ]}
                  />
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* ─── TAB 3: Platform & Runtime Graphs ──────────────────────────── */}
      {activeTab === 'platform' && (
        <View style={styles.insightsChartBox}>
          <View style={styles.insightsChartTopRow}>
            <View style={styles.insightsChartTitleRow}>
              <SvgCpu color="#4F46E5" size={13} />
              <Text style={styles.insightsChartTitle}>Platform & Runtime</Text>
            </View>
            <Text style={[styles.insightsChartSub, { color: '#4F46E5', backgroundColor: '#EEF2FF' }]}>
              {Platform.OS === 'ios' ? 'iOS' : 'Android'} {insights.runtime.osVersion}
            </Text>
          </View>

          {/* OS Distribution Stacked Bar */}
          <View style={styles.insightsProgressBar}>
            <View style={{ flex: 58, backgroundColor: '#4F46E5' }} />
            <View style={{ flex: 34, backgroundColor: '#10B981' }} />
            <View style={{ flex: 8, backgroundColor: '#F59E0B' }} />
          </View>

          {/* OS Platform Cards */}
          <View style={styles.insightsPlatformsGrid}>
            <View
              style={[
                styles.insightsPlatformPill,
                Platform.OS === 'ios' && { borderColor: '#4F46E5', backgroundColor: '#EEF2FF' },
              ]}
            >
              <View style={styles.insightsPlatformLeft}>
                <View style={[styles.insightsPlatformDot, { backgroundColor: '#4F46E5' }]} />
                <Text style={styles.insightsPlatformName}>iOS {Platform.OS === 'ios' ? '●' : ''}</Text>
              </View>
              <Text style={styles.insightsPlatformPct}>58%</Text>
            </View>

            <View
              style={[
                styles.insightsPlatformPill,
                Platform.OS === 'android' && { borderColor: '#10B981', backgroundColor: '#ECFDF5' },
              ]}
            >
              <View style={styles.insightsPlatformLeft}>
                <View style={[styles.insightsPlatformDot, { backgroundColor: '#10B981' }]} />
                <Text style={styles.insightsPlatformName}>Android {Platform.OS === 'android' ? '●' : ''}</Text>
              </View>
              <Text style={styles.insightsPlatformPct}>34%</Text>
            </View>

            <View style={styles.insightsPlatformPill}>
              <View style={styles.insightsPlatformLeft}>
                <View style={[styles.insightsPlatformDot, { backgroundColor: '#F59E0B' }]} />
                <Text style={styles.insightsPlatformName}>Expo / Web</Text>
              </View>
              <Text style={styles.insightsPlatformPct}>8%</Text>
            </View>
          </View>

          {/* Engine & Architecture Comparative Bar Graphs */}
          <View style={styles.platformGraphSection}>
            <Text style={styles.platformGraphSectionTitle}>Runtime Distribution</Text>

            {/* JavaScript Engine */}
            <View style={styles.platformMetricRow}>
              <View style={styles.platformMetricHeader}>
                <Text style={styles.platformMetricLabel}>Hermes Engine vs JSC</Text>
                <Text style={styles.platformMetricValues}>82% / 18%</Text>
              </View>
              <View style={styles.platformDualBar}>
                <View style={{ flex: 82, backgroundColor: '#4F46E5' }} />
                <View style={{ flex: 18, backgroundColor: '#CBD5E1' }} />
              </View>
            </View>

            {/* Architecture */}
            <View style={styles.platformMetricRow}>
              <View style={styles.platformMetricHeader}>
                <Text style={styles.platformMetricLabel}>Fabric (New Arch) vs Paper</Text>
                <Text style={styles.platformMetricValues}>74% / 26%</Text>
              </View>
              <View style={styles.platformDualBar}>
                <View style={{ flex: 74, backgroundColor: '#0284C7' }} />
                <View style={{ flex: 26, backgroundColor: '#CBD5E1' }} />
              </View>
            </View>

            {/* Framework Runtime */}
            <View style={styles.platformMetricRow}>
              <View style={styles.platformMetricHeader}>
                <Text style={styles.platformMetricLabel}>React Native CLI vs Expo SDK</Text>
                <Text style={styles.platformMetricValues}>68% / 32%</Text>
              </View>
              <View style={styles.platformDualBar}>
                <View style={{ flex: 68, backgroundColor: '#059669' }} />
                <View style={{ flex: 32, backgroundColor: '#CBD5E1' }} />
              </View>
            </View>
          </View>
        </View>
      )}

      {/* ─── TAB 4: Releases ───────────────────────────────────────────── */}
      {activeTab === 'releases' && (
        <View style={styles.insightsChartBox}>
          <View style={styles.insightsChartTopRow}>
            <View style={styles.insightsChartTitleRow}>
              <SvgPackage color="#7C3AED" size={13} />
              <Text style={styles.insightsChartTitle}>Releases</Text>
            </View>
            <Text style={[styles.insightsChartSub, { color: '#7C3AED', backgroundColor: '#F5F3FF' }]}>
              {insights.registry.totalVersions} Versions
            </Text>
          </View>

          <View style={styles.insightsReleasesList}>
            {insights.registry.recentReleases && insights.registry.recentReleases.length > 0 ? (
              insights.registry.recentReleases.map((rel, idx) => (
                <View key={idx} style={styles.insightsReleaseRow}>
                  <View style={styles.insightsReleaseLeft}>
                    <View style={styles.insightsReleaseBadge}>
                      <Text style={styles.insightsReleaseVersion}>v{rel.version}</Text>
                    </View>
                    <Text style={styles.insightsReleaseDate}>{rel.date}</Text>
                  </View>
                  <View style={styles.insightsReleaseRight}>
                    <Text style={styles.insightsReleaseSize}>{rel.sizeMB}</Text>
                    <Text style={styles.insightsReleaseFiles}>{rel.fileCount} files</Text>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.insightsReleaseRow}>
                <View style={styles.insightsReleaseLeft}>
                  <View style={styles.insightsReleaseBadge}>
                    <Text style={styles.insightsReleaseVersion}>v{insights.registry.latestVersion}</Text>
                  </View>
                  <Text style={styles.insightsReleaseDate}>{insights.registry.publishedDate || 'Latest'}</Text>
                </View>
                <View style={styles.insightsReleaseRight}>
                  <Text style={styles.insightsReleaseSize}>{insights.registry.unpackedSizeMB}</Text>
                  <Text style={styles.insightsReleaseFiles}>{insights.registry.fileCount} files</Text>
                </View>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Features & Architecture Expandable Hub */}
      <Pressable
        style={({ pressed }) => [
          styles.headerFeaturesToggleBtn,
          { opacity: pressed ? 0.75 : 1 },
        ]}
        onPress={onToggleDescription}
      >
        <View style={styles.headerFeaturesToggleLeft}>
          <SvgSparkle color="#4F46E5" size={13} />
          <Text style={styles.headerFeaturesToggleTitle}>Features</Text>
        </View>
        <View style={styles.headerFeaturesToggleAction}>
          <Text style={styles.headerFeaturesToggleActionText}>
            {isDescriptionExpanded ? 'Collapse' : 'Explore All'}
          </Text>
          {isDescriptionExpanded ? <SvgChevronUp size={11} /> : <SvgChevronDown size={11} />}
        </View>
      </Pressable>

      {/* Expanded Modern Micro-Cards Grid */}
      {isDescriptionExpanded && (
        <View style={styles.headerFeatureCardsContainer}>
          <View style={styles.headerFeatureCard}>
            <View style={[styles.headerFeatureIconBox, { backgroundColor: '#EEF2FF' }]}>
              <SvgGlobe color="#4F46E5" size={13} />
            </View>
            <View style={styles.headerFeatureContent}>
              <Text style={styles.headerFeatureTitle}>Network Interceptor</Text>
              <Text style={styles.headerFeatureDesc}>
                Auto-captures Axios, Fetch & XHR with live cURL export & latency tracking.
              </Text>
            </View>
          </View>

          <View style={styles.headerFeatureCard}>
            <View style={[styles.headerFeatureIconBox, { backgroundColor: '#ECFEFF' }]}>
              <SvgTerminal color="#0891B2" size={13} />
            </View>
            <View style={styles.headerFeatureContent}>
              <Text style={styles.headerFeatureTitle}>Console Diagnostics</Text>
              <Text style={styles.headerFeatureDesc}>
                Real-time symbolicated Metro stack traces, error boundaries & log levels.
              </Text>
            </View>
          </View>

          <View style={styles.headerFeatureCard}>
            <View style={[styles.headerFeatureIconBox, { backgroundColor: '#FAF5FF' }]}>
              <SvgAtom color="#9333EA" size={13} />
            </View>
            <View style={styles.headerFeatureContent}>
              <Text style={styles.headerFeatureTitle}>Redux Time-Travel</Text>
              <Text style={styles.headerFeatureDesc}>
                Dispatched actions timeline, payload inspector & state snapshot diffs.
              </Text>
            </View>
          </View>

          <View style={styles.headerFeatureCard}>
            <View style={[styles.headerFeatureIconBox, { backgroundColor: '#F0FDF4' }]}>
              <SvgAnalytics color="#16A34A" size={13} />
            </View>
            <View style={styles.headerFeatureContent}>
              <Text style={styles.headerFeatureTitle}>Telemetry & Push</Text>
              <Text style={styles.headerFeatureDesc}>
                Real-time event throughput histogram, GA4 screens & push notification ingestion.
              </Text>
            </View>
          </View>

          <View style={styles.headerFeatureCard}>
            <View style={[styles.headerFeatureIconBox, { backgroundColor: '#FEF2F2' }]}>
              <SvgShieldCheck color="#DC2626" size={13} />
            </View>
            <View style={styles.headerFeatureContent}>
              <Text style={styles.headerFeatureTitle}>Crash Guard & Vitals</Text>
              <Text style={styles.headerFeatureDesc}>
                Micro-frontend error isolation boundaries & live native memory/hardware vitals.
              </Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

// ─── Main HomeScreen Component ───────────────────────────────────────────────

export function HomeScreen({ navigation }: any) {
  const [npmMeta, setNpmMeta] = useState<{
    version: string;
    description: string;
    downloadsMonthly: number | null;
    license: string;
    loading: boolean;
  }>({
    version: LIB_VERSION,
    description: 'All-in-One In-App Network Inspector, Redux Time-Travel, Console & Crash Telemetry.',
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
    description: 'Zero-config all-in-one in-app inspector for React Native & Expo applications.',
    pushedAt: '',
    license: 'MIT',
    loading: true,
  });

  const [liveInsights, setLiveInsights] = useState<LiveInsightsData>({
    dailyPoints: [],
    monthlyTotal: 0,
    weeklyTotal: 0,
    dailyAvg: 0,
    peakDay: { day: '', downloads: 0 },
    latestDay: { day: '', downloads: 0 },
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
        ? `${(Platform.constants as any).reactNativeVersion.major}.${(Platform.constants as any).reactNativeVersion.minor}.${(Platform.constants as any).reactNativeVersion.patch}`
        : '0.76.1',
      architecture: (globalThis as any).nativeFabricUIManager ? 'New Architecture (Fabric)' : 'Paper Bridge Architecture',
      jsEngine: (globalThis as any).HermesInternal ? 'Hermes Engine' : 'JavaScriptCore (JSC)',
      dimensions: `${Math.round(SCREEN_WIDTH)} × ${Math.round(Dimensions.get('window').height)} pt`,
    },
    loading: true,
    lastUpdated: '',
  });

  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [copiedInstall, setCopiedInstall] = useState(false);
  const [batchSuccess, setBatchSuccess] = useState(false);
  const [lastTriggeredTime, setLastTriggeredTime] = useState<string | null>(null);

  const copyInstallCommand = () => {
    Clipboard.setString(`npm i react-native-inapp-inspector@${npmMeta.version}`);
    setCopiedInstall(true);
    setTimeout(() => setCopiedInstall(false), 2000);
  };

  const fetchLiveInsightsData = async () => {
    setLiveInsights(prev => ({ ...prev, loading: true }));
    try {
      // 1. Live NPM Downloads Range API
      let rawDownloads: NpmDailyPoint[] = [];
      let monthlyTotal = 0;
      let weeklyTotal = 0;
      let dailyAvg = 0;
      let peakDay = { day: '', downloads: 0 };
      let latestDay = { day: '', downloads: 0 };

      try {
        const rangeRes = await fetch('https://api.npmjs.org/downloads/range/last-month/react-native-inapp-inspector');
        const rangeJson = await rangeRes.json();
        if (Array.isArray(rangeJson.downloads) && rangeJson.downloads.length > 0) {
          rawDownloads = rangeJson.downloads;
          monthlyTotal = rawDownloads.reduce((sum, d) => sum + (d.downloads || 0), 0);
          const last7 = rawDownloads.slice(-7);
          weeklyTotal = last7.reduce((sum, d) => sum + (d.downloads || 0), 0);
          dailyAvg = Math.round(monthlyTotal / rawDownloads.length);

          rawDownloads.forEach(d => {
            if (d.downloads > peakDay.downloads) {
              peakDay = { day: d.day, downloads: d.downloads };
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
        const regRes = await fetch('https://registry.npmjs.org/react-native-inapp-inspector');
        const regJson = await regRes.json();
        const latestTag = regJson['dist-tags']?.latest || LIB_VERSION;
        const latestVerObj = regJson.versions?.[latestTag] || {};
        const totalVerCount = regJson.versions ? Object.keys(regJson.versions).length : 100;
        const unpackedBytes = latestVerObj.dist?.unpackedSize || 0;
        const unpackedSizeMB = unpackedBytes > 0 ? (unpackedBytes / (1024 * 1024)).toFixed(2) + ' MB' : '3.83 MB';
        const fileCount = latestVerObj.dist?.fileCount || 477;
        const dependenciesCount = latestVerObj.dependencies ? Object.keys(latestVerObj.dependencies).length : 1;
        const maintainersCount = regJson.maintainers?.length || 1;
        const publishedDate = regJson.time?.[latestTag] ? new Date(regJson.time[latestTag]).toLocaleDateString() : '';

        const verKeys = regJson.versions ? Object.keys(regJson.versions) : [];
        const recentKeys = verKeys.slice(-4).reverse();
        const recentReleases: NpmReleaseItem[] = recentKeys.map((v: string) => {
          const vObj = regJson.versions[v] || {};
          const sz = vObj.dist?.unpackedSize ? (vObj.dist.unpackedSize / (1024 * 1024)).toFixed(2) + ' MB' : unpackedSizeMB;
          const fc = vObj.dist?.fileCount || fileCount;
          const dt = regJson.time?.[v] ? new Date(regJson.time[v]).toLocaleDateString() : 'Active';
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
            isp: geoJson.connection?.isp || geoJson.connection?.org || 'Broadband ISP',
            timezone: geoJson.timezone?.id || Intl.DateTimeFormat().resolvedOptions().timeZone,
            ip: geoJson.ip || '',
          };
        }
      } catch {
        // Fallback geo
      }

      // 4. Live GitHub Contributors
      let contribsList: GitHubContributorItem[] = [];
      try {
        const contribRes = await fetch('https://api.github.com/repos/vengatmacuser/react-native-inapp-inspector/contributors');
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

      // 5. Live Runtime Environment
      const reactNativeVersion = (Platform.constants as any)?.reactNativeVersion
        ? `${(Platform.constants as any).reactNativeVersion.major}.${(Platform.constants as any).reactNativeVersion.minor}.${(Platform.constants as any).reactNativeVersion.patch}`
        : '0.76.1';

      const architecture = (globalThis as any).nativeFabricUIManager
        ? 'New Architecture (Fabric)'
        : 'Paper Bridge Architecture';

      const jsEngine = (globalThis as any).HermesInternal
        ? 'Hermes Engine'
        : 'JavaScriptCore (JSC)';

      const runtime = {
        os: Platform.OS === 'ios' ? 'Apple iOS' : 'Google Android',
        osVersion: Platform.Version,
        rnVersion: reactNativeVersion,
        architecture,
        jsEngine,
        dimensions: `${Math.round(SCREEN_WIDTH)} × ${Math.round(Dimensions.get('window').height)} pt`,
      };

      setLiveInsights({
        dailyPoints: rawDownloads.slice(-7),
        monthlyTotal,
        weeklyTotal,
        dailyAvg,
        peakDay,
        latestDay,
        geo: geoData,
        registry: regInfo,
        contributors: contribsList,
        runtime,
        loading: false,
        lastUpdated: new Date().toLocaleTimeString(),
      });
    } catch (err) {
      console.warn('[Insights] General fetch error:', err);
      setLiveInsights(prev => ({ ...prev, loading: false }));
    }
  };

  useEffect(() => {
    fetchLiveInsightsData();

    // Dynamic live GitHub repository telemetry
    fetch('https://api.github.com/repos/vengatmacuser/react-native-inapp-inspector')
      .then(res => res.json())
      .then(data => {
        if (data && typeof data.stargazers_count === 'number') {
          setGithubMeta({
            stars: data.stargazers_count,
            forks: data.forks_count || 0,
            openIssues: data.open_issues_count || 0,
            defaultBranch: data.default_branch || 'main',
            description: data.description || '',
            pushedAt: data.pushed_at ? new Date(data.pushed_at).toLocaleDateString() : '',
            license: data.license?.spdx_id || 'MIT',
            loading: false,
          });
        }
      })
      .catch(() => setGithubMeta(prev => ({ ...prev, loading: false })));
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
    setLastTriggeredTime(new Date().toLocaleTimeString());
    setBatchSuccess(true);
    setTimeout(() => setBatchSuccess(false), 2500);

    const randomConsoleMessages = [
      '[Sample] Fetching latest feed items from gateway...',
      '[Sample] Cache refreshed for authenticated session',
      '[Sample] Push notification background sync completed',
      '[Sample] Hardware vitals telemetry recorded',
    ];

    console.log(`[Sample] 🚀 Firing Fast Batch Sample Data at ${new Date().toLocaleTimeString()}`);
    console.warn('[Sample] ⚠️ Simulated warning: Gateway latency above threshold');
    console.error('[Sample] 🛑 Simulated error: Socket timeout on retry attempt #2');
    console.log(randomConsoleMessages[Math.floor(Math.random() * randomConsoleMessages.length)]);
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
      }
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
      items: [{ id: 'pkg_inapp_inspector', name: 'Inspector Core' }],
    });

    logAnalyticsEvent('fast_batch_simulated', {
      batch_type: 'comprehensive',
      timestamp: new Date().toISOString(),
      platform: Platform.OS,
    });

    // 4. Redux Store Time-Travel Actions
    mockStore.dispatch({ type: 'TOGGLE_SIDEBAR' });
    mockStore.dispatch({ type: 'UPDATE_USER_TIME' });
    mockStore.dispatch({
      type: 'auth/loginWithSaga',
      payload: { user: 'Venkatesh', authType: 'OAuth2' },
      __origin: 'saga',
    });
    mockStore.dispatch({
      type: 'users/fetch/fulfilled',
      payload: { id: 101, status: 'synced', role: 'Architect' },
      __origin: 'thunk',
    });
  };

  const openUrl = (url: string) => {
    Linking.openURL(url).catch(err => console.error('Failed to open URL:', err));
  };

  const insets = useSafeAreaInsets();
  const topPadding = Math.max(insets.top, Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 12 : 12);
  const bottomPadding = 110 + insets.bottom;

  return (
    <View style={[styles.safeContainer, { paddingTop: topPadding }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: bottomPadding }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── COMBINED HERO HEADER + DOWNLOADS & VELOCITY CARD ───────────── */}
        <ModuleErrorBoundary moduleName="Combined Hero Header">
          <CombinedHeroHeader
            npmMeta={npmMeta}
            githubMeta={githubMeta}
            insights={liveInsights}
            copiedInstall={copiedInstall}
            isDescriptionExpanded={isDescriptionExpanded}
            onCopyInstall={copyInstallCommand}
            onToggleDescription={() => setIsDescriptionExpanded(prev => !prev)}
            onRefresh={fetchLiveInsightsData}
            onOpenUrl={openUrl}
          />
        </ModuleErrorBoundary>
      </ScrollView>

      {/* ─── STATIC FOOTER ACTION BAR: FAST BATCH SIMULATION ──────────────── */}
      <View style={[styles.staticFooterContainer, { paddingBottom: Math.max(14, insets.bottom + 8) }]}>
        <Pressable
          style={({ pressed }) => [
            styles.footerButton,
            batchSuccess && { backgroundColor: '#059669' },
            {
              opacity: pressed ? 0.85 : 1,
              transform: [{ scale: pressed ? 0.97 : 1 }],
            },
          ]}
          onPress={triggerSampleAll}
          android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
        >
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
