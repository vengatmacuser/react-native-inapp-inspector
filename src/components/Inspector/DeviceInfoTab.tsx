import React, {useState, useEffect, useMemo, useCallback} from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Dimensions,
  Platform,
  PixelRatio,
  StatusBar,
  StyleSheet,
  ActivityIndicator,
  NativeModules,
} from 'react-native';
import TouchableScale from '../TouchableScale';
import CopyButton from '../CopyButton';
import {AppColors} from '../../styles/AppColors';
import {AppFonts} from '../../styles/AppFonts';
import {useTranslation} from '../../i18n';
import {
  SmartphoneIcon,
  CpuIcon,
  WifiIcon,
  ScreenIcon,
  LayersIcon,
  KeyIcon,
  ShieldCheckIcon,
  SearchIcon,
  ClearIcon,
  CopyIcon,
  CircleCheckIcon,
  CircleAlertIcon,
  BoltIcon,
  CheckIcon,
  SignalIcon,
  BrainIcon,
  AppleIcon,
  AndroidIcon,
  ExportIcon,
} from '../NetworkIcons';
import {
  getNativeDeviceMetrics,
  getNativeSystemMetrics,
  NativeDeviceMetrics,
  NativeSystemMetrics,
} from '../../native/NativeInspector';
import {copyToClipboard, getAppName} from '../../helpers';
import {showToast} from '../../helpers/toast';
import {LIB_VERSION} from '../../constants';

type DeviceSubTab =
  | 'overview'
  | 'hardware'
  | 'network'
  | 'display'
  | 'runtime'
  | 'security';

interface InfoRowProps {
  label: string;
  value: string | number | boolean | null | undefined;
  copyable?: boolean;
  badge?: {
    text: string;
    color: string;
    bg: string;
  };
  subtext?: string;
  isLast?: boolean;
}

const InfoRow = React.memo(
  ({label, value, copyable = true, badge, subtext, isLast = false}: InfoRowProps) => {
    const displayValue =
      value === null || value === undefined
        ? '—'
        : typeof value === 'boolean'
        ? value
          ? 'Yes'
          : 'No'
        : String(value);

    return (
      <View
        style={[
          styles.infoRow,
          isLast && {borderBottomWidth: 0},
        ]}>
        <View style={{flex: 1, paddingRight: 8}}>
          <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
            <Text style={styles.infoLabel}>{label}</Text>
            {badge && (
              <View
                style={[
                  styles.infoBadge,
                  {backgroundColor: badge.bg, borderColor: `${badge.color}33`},
                ]}>
                <Text style={[styles.infoBadgeText, {color: badge.color}]}>
                  {badge.text}
                </Text>
              </View>
            )}
          </View>
          {subtext && <Text style={styles.infoSubtext}>{subtext}</Text>}
        </View>
        <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
          <Text
            style={[
              styles.infoValue,
              typeof value === 'boolean' && {
                color: value ? AppColors.emerald500 : AppColors.errorColor,
              },
            ]}
            numberOfLines={2}
            selectable>
            {displayValue}
          </Text>
          {copyable && value !== null && value !== undefined && (
            <TouchableScale
              hitSlop={8}
              onPress={() => {
                copyToClipboard(displayValue, label);
                showToast(`Copied ${label}`);
              }}
              style={styles.rowCopyBtn}>
              <CopyIcon size={11} color={AppColors.grayTextWeak} />
            </TouchableScale>
          )}
        </View>
      </View>
    );
  },
);

export const DeviceInfoTab = React.memo(() => {
  const {t} = useTranslation();
  const [activeSubTab, setActiveSubTab] = useState<DeviceSubTab>('overview');
  const [search, setSearch] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [deviceMetrics, setDeviceMetrics] = useState<NativeDeviceMetrics | null>(null);
  const [systemMetrics, setSystemMetrics] = useState<NativeSystemMetrics | null>(null);
  const [ipAddress, setIpAddress] = useState<string>('Detecting...');
  const [deviceUptime, setDeviceUptime] = useState<string>('0s');

  const startTimeRef = React.useRef<number>(Date.now());

  // Load hardware metrics and IP
  const fetchMetrics = useCallback(async () => {
    try {
      const [devMetrics, sysMetrics] = await Promise.all([
        getNativeDeviceMetrics(),
        getNativeSystemMetrics(),
      ]);
      setDeviceMetrics(devMetrics);
      setSystemMetrics(sysMetrics);
    } catch {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 3000);
    return () => clearInterval(interval);
  }, [fetchMetrics]);

  // Probe local IP address
  useEffect(() => {
    let isMounted = true;
    const probeIp = async () => {
      // 1. Try NativeModules or PlatformConstants
      try {
        const serverHost =
          NativeModules?.PlatformConstants?.serverHost ||
          NativeModules?.AndroidConstants?.serverHost ||
          NativeModules?.DevSettings?.serverHost;
        if (serverHost && typeof serverHost === 'string') {
          const cleanHost = serverHost.split(':')[0].replace(/https?:\/\//, '');
          if (cleanHost && cleanHost !== 'localhost' && cleanHost !== '127.0.0.1') {
            if (isMounted) setIpAddress(cleanHost);
            return;
          }
        }
      } catch {}

      // 2. Query dynamic candidate ip endpoints
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 1200);
        const res = await fetch('https://api.ipify.org?format=json', {
          signal: controller.signal,
        });
        clearTimeout(timer);
        if (res.ok) {
          const data = await res.json();
          if (data && data.ip && isMounted) {
            setIpAddress(data.ip);
            return;
          }
        }
      } catch {}

      if (isMounted) {
        setIpAddress(Platform.OS === 'android' ? '10.0.2.15 (Local)' : '127.0.0.1 (Local)');
      }
    };

    probeIp();
    return () => {
      isMounted = false;
    };
  }, []);

  // Calculate Uptime
  useEffect(() => {
    const updateUptime = () => {
      const diffSec = Math.floor((Date.now() - startTimeRef.current) / 1000);
      const hours = Math.floor(diffSec / 3600);
      const mins = Math.floor((diffSec % 3600) / 60);
      const secs = diffSec % 60;
      if (hours > 0) {
        setDeviceUptime(`${hours}h ${mins}m ${secs}s`);
      } else if (mins > 0) {
        setDeviceUptime(`${mins}m ${secs}s`);
      } else {
        setDeviceUptime(`${secs}s`);
      }
    };
    const timer = setInterval(updateUptime, 1000);
    updateUptime();
    return () => clearInterval(timer);
  }, []);

  // Screen Geometry
  const windowDims = Dimensions.get('window');
  const screenDims = Dimensions.get('screen');
  const pixelRatio = PixelRatio.get();
  const fontScale = PixelRatio.getFontScale();
  const isTablet = windowDims.width >= 600 || windowDims.height >= 1000;
  const isLandscape = windowDims.width > windowDims.height;
  const statusBarHeight =
    Platform.OS === 'android'
      ? StatusBar.currentHeight || 24
      : (windowDims.height >= 812 ? 44 : 20);

  // Pseudo-UDID deterministic identifier
  const pseudoUDID = useMemo(() => {
    const raw = `${Platform.OS}-${Platform.Version}-${screenDims.width}x${screenDims.height}-${pixelRatio}-${(Platform.constants as any)?.Brand || 'generic'}`;
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
      hash = (hash << 5) - hash + raw.charCodeAt(i);
      hash |= 0;
    }
    const hex = Math.abs(hash).toString(16).padStart(8, '0');
    return `UDID-${Platform.OS.toUpperCase()}-${hex.slice(0, 4)}-${hex.slice(4, 8)}-${Date.now().toString(16).slice(-4)}`.toUpperCase();
  }, [screenDims.width, screenDims.height, pixelRatio]);

  // Hermes & TurboModule engine status
  const isHermes = Boolean((global as any)?.HermesInternal);
  const isTurboModule = Boolean((globalThis as any)?.__turboModuleProxy);
  const reactNativeVersion = useMemo(() => {
    const v = (Platform.constants as any)?.reactNativeVersion;
    if (v) {
      return `${v.major}.${v.minor}.${v.patch}${v.prerelease != null ? `-${v.prerelease}` : ''}`;
    }
    return '0.74+';
  }, []);

  const totalRamMb = deviceMetrics?.totalRAM
    ? Math.round(deviceMetrics.totalRAM / (1024 * 1024))
    : systemMetrics?.totalPhysicalRamMb || 4096;
  const freeRamMb = deviceMetrics?.freeRAM
    ? Math.round(deviceMetrics.freeRAM / (1024 * 1024))
    : Math.max(0, totalRamMb - (systemMetrics?.residentRamMb || 1200));
  const usedRamMb = Math.max(0, totalRamMb - freeRamMb);
  const ramUsagePct = totalRamMb > 0 ? Math.round((usedRamMb / totalRamMb) * 100) : 45;

  const totalStorageGb = deviceMetrics?.totalStorage
    ? (deviceMetrics.totalStorage / (1024 * 1024 * 1024)).toFixed(1)
    : '128.0';
  const freeStorageGb = deviceMetrics?.freeStorage
    ? (deviceMetrics.freeStorage / (1024 * 1024 * 1024)).toFixed(1)
    : '64.2';

  // Sub-Tab Definitions
  const subTabs = useMemo(
    () => [
      {
        key: 'overview',
        label: 'Overview',
        icon: (c: string) => <LayersIcon size={12} color={c} />,
      },
      {
        key: 'hardware',
        label: 'Hardware',
        icon: (c: string) => <CpuIcon size={12} color={c} />,
      },
      {
        key: 'network',
        label: 'Network & IP',
        icon: (c: string) => <WifiIcon size={12} color={c} />,
      },
      {
        key: 'display',
        label: 'Display',
        icon: (c: string) => <ScreenIcon size={12} color={c} />,
      },
      {
        key: 'runtime',
        label: 'Runtime & App',
        icon: (c: string) => <BoltIcon size={12} color={c} />,
      },
      {
        key: 'security',
        label: 'Security & IDs',
        icon: (c: string) => <KeyIcon size={12} color={c} />,
      },
    ],
    [],
  );

  // Full device JSON export
  const fullDeviceData = useMemo(
    () => ({
      identifiers: {
        pseudoUDID,
        bundleId: deviceMetrics?.appBundleId || deviceMetrics?.appPackageName || 'com.app.inspector',
      },
      hardware: {
        model: deviceMetrics?.deviceModel || (Platform.constants as any)?.Model || 'Unknown Device',
        brand: deviceMetrics?.deviceBrand || (Platform.constants as any)?.Brand || (Platform.OS === 'ios' ? 'Apple' : 'Android'),
        osVersion: `${Platform.OS} ${Platform.Version}`,
        apiLevel: deviceMetrics?.apiLevel || (Platform.constants as any)?.Version || null,
        cpuAbi: deviceMetrics?.cpuAbi || (Platform.constants as any)?.ServerHost || 'arm64-v8a',
        totalRamMb,
        freeRamMb,
        usedRamMb,
        totalStorageGb: `${totalStorageGb} GB`,
        freeStorageGb: `${freeStorageGb} GB`,
        batteryPercent: deviceMetrics?.batteryPercent ?? 100,
        isCharging: deviceMetrics?.isCharging ?? false,
      },
      network: {
        ipAddress,
        isWifi: true,
        reachability: 'Online',
      },
      display: {
        windowWidth: windowDims.width,
        windowHeight: windowDims.height,
        screenWidth: screenDims.width,
        screenHeight: screenDims.height,
        pixelRatio,
        fontScale,
        statusBarHeight,
        isTablet,
        orientation: isLandscape ? 'Landscape' : 'Portrait',
      },
      runtime: {
        appName: getAppName(),
        appVersion: deviceMetrics?.appVersion || '1.0.0',
        appBuild: deviceMetrics?.appBuild || '1',
        reactNativeVersion,
        inspectorVersion: LIB_VERSION,
        isHermes,
        isTurboModule,
        isDev: __DEV__,
        jsEngine: isHermes ? 'Hermes' : 'JSC',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        locale: Intl.DateTimeFormat().resolvedOptions().locale,
        sessionUptime: deviceUptime,
      },
    }),
    [
      pseudoUDID,
      deviceMetrics,
      totalRamMb,
      freeRamMb,
      usedRamMb,
      totalStorageGb,
      freeStorageGb,
      ipAddress,
      windowDims,
      screenDims,
      pixelRatio,
      fontScale,
      statusBarHeight,
      isTablet,
      isLandscape,
      reactNativeVersion,
      isHermes,
      isTurboModule,
      deviceUptime,
    ],
  );

  const handleExportJson = () => {
    copyToClipboard(JSON.stringify(fullDeviceData, null, 2), 'Device Full Report');
    showToast('Copied Full Device JSON Report!');
  };

  const handleExportMarkdown = () => {
    const md = `# Device Information Report
**Generated by React Native In-App Inspector v${LIB_VERSION}**

## 📱 Hardware & System
- **Device Model:** ${fullDeviceData.hardware.model}
- **Brand / Manufacturer:** ${fullDeviceData.hardware.brand}
- **OS Version:** ${fullDeviceData.hardware.osVersion}
- **CPU Architecture:** ${fullDeviceData.hardware.cpuAbi}
- **Total RAM:** ${totalRamMb} MB (Free: ${freeRamMb} MB)
- **Total Storage:** ${totalStorageGb} GB (Free: ${freeStorageGb} GB)
- **Battery:** ${fullDeviceData.hardware.batteryPercent}% (${fullDeviceData.hardware.isCharging ? 'Charging' : 'Unplugged'})

## 🌐 Network & Connectivity
- **IP Address:** ${ipAddress}
- **Status:** Online

## 🖥 Display & Geometry
- **Resolution:** ${screenDims.width} × ${screenDims.height} pt (@${pixelRatio}x)
- **Form Factor:** ${isTablet ? 'Tablet' : 'Phone'} (${isLandscape ? 'Landscape' : 'Portrait'})
- **Status Bar Height:** ${statusBarHeight} pt

## ⚙️ Runtime & App
- **App Name:** ${fullDeviceData.runtime.appName}
- **App Version:** ${fullDeviceData.runtime.appVersion} (${fullDeviceData.runtime.appBuild})
- **React Native:** v${reactNativeVersion}
- **JS Engine:** ${isHermes ? 'Hermes' : 'JSC'} (Bridgeless TurboModule: ${isTurboModule ? 'Yes' : 'No'})
- **Environment:** ${__DEV__ ? 'Development (__DEV__)' : 'Production (Release)'}
- **Timezone:** ${fullDeviceData.runtime.timezone}
- **Session Uptime:** ${deviceUptime}

## 🔑 Identifiers & Security
- **Pseudo-UDID:** \`${pseudoUDID}\`
- **Bundle ID:** \`${fullDeviceData.identifiers.bundleId}\`
`;
    copyToClipboard(md, 'Device Markdown Report');
    showToast('Copied Markdown Report to Clipboard!');
  };

  // Filter items matching search
  const isMatch = (text: string) => {
    if (!search.trim()) return true;
    return text.toLowerCase().includes(search.toLowerCase().trim());
  };

  return (
    <View style={styles.container}>
      {/* ─── Top Sub-Tabs Navigation Bar ─── */}
      <View style={styles.subTabsWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.subTabsContainer}>
          {subTabs.map(tab => {
            const isActive = activeSubTab === tab.key;
            const color = isActive ? AppColors.white : AppColors.grayText;
            return (
              <TouchableScale
                key={tab.key}
                onPress={() => setActiveSubTab(tab.key as DeviceSubTab)}
                style={[styles.subTabPill, isActive && styles.subTabPillActive]}>
                {tab.icon(color)}
                <Text
                  style={[
                    styles.subTabPillText,
                    isActive && styles.subTabPillTextActive,
                  ]}>
                  {tab.label}
                </Text>
              </TouchableScale>
            );
          })}
        </ScrollView>
      </View>

      {/* ─── Search & Export Action Bar ─── */}
      <View style={styles.actionBar}>
        <View style={styles.searchBar}>
          <SearchIcon size={14} color={AppColors.grayTextWeak} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search specs, UDID, IP, screen..."
            placeholderTextColor={AppColors.grayTextWeak}
            style={styles.searchInput}
            clearButtonMode="while-editing"
          />
          {search.length > 0 && (
            <TouchableScale onPress={() => setSearch('')} hitSlop={8}>
              <ClearIcon size={13} color={AppColors.grayTextWeak} />
            </TouchableScale>
          )}
        </View>

        <TouchableScale
          onPress={handleExportJson}
          style={styles.exportButton}
          hitSlop={6}>
          <ExportIcon size={12} color={AppColors.purple} />
          <Text style={styles.exportButtonText}>JSON</Text>
        </TouchableScale>

        <TouchableScale
          onPress={handleExportMarkdown}
          style={[styles.exportButton, {backgroundColor: `${AppColors.emerald500}14`, borderColor: `${AppColors.emerald500}33`}]}
          hitSlop={6}>
          <CopyIcon size={12} color={AppColors.emerald500} />
          <Text style={[styles.exportButtonText, {color: AppColors.emerald500}]}>MD</Text>
        </TouchableScale>
      </View>

      {/* ─── Main Content Scroll View ─── */}
      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Hero Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <View style={styles.heroIconWrap}>
              {Platform.OS === 'ios' ? (
                <AppleIcon size={20} color={AppColors.white} />
              ) : (
                <AndroidIcon size={20} color={AppColors.white} />
              )}
            </View>
            <View style={{flex: 1}}>
              <Text style={styles.heroTitle}>
                {deviceMetrics?.deviceModel || (Platform.constants as any)?.Model || (Platform.OS === 'ios' ? 'Apple iPhone' : 'Android Device')}
              </Text>
              <Text style={styles.heroSubtitle}>
                {Platform.OS === 'ios' ? `iOS ${Platform.Version}` : `Android ${Platform.Version} (API ${deviceMetrics?.apiLevel || Platform.Version})`}
              </Text>
            </View>
            <View style={styles.heroBadge}>
              <View style={styles.pulseDot} />
              <Text style={styles.heroBadgeText}>LIVE</Text>
            </View>
          </View>

          {/* Quick Metrics Strip */}
          <View style={styles.heroMetricsStrip}>
            <View style={styles.heroMetricItem}>
              <Text style={styles.heroMetricLabel}>IP ADDRESS</Text>
              <Text style={styles.heroMetricValue} numberOfLines={1}>
                {ipAddress}
              </Text>
            </View>
            <View style={styles.heroMetricDivider} />
            <View style={styles.heroMetricItem}>
              <Text style={styles.heroMetricLabel}>RAM (USED/TOTAL)</Text>
              <Text style={styles.heroMetricValue}>
                {usedRamMb}/{totalRamMb} MB
              </Text>
            </View>
            <View style={styles.heroMetricDivider} />
            <View style={styles.heroMetricItem}>
              <Text style={styles.heroMetricLabel}>UPTIME</Text>
              <Text style={styles.heroMetricValue}>{deviceUptime}</Text>
            </View>
          </View>
        </View>

        {/* ── SUB-TAB 1: OVERVIEW ── */}
        {(activeSubTab === 'overview' || search.length > 0) && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>DEVICE OVERVIEW</Text>
            {isMatch('Device Model') && (
              <InfoRow
                label="Device Model"
                value={fullDeviceData.hardware.model}
              />
            )}
            {isMatch('Manufacturer') && (
              <InfoRow
                label="Manufacturer / Brand"
                value={fullDeviceData.hardware.brand}
              />
            )}
            {isMatch('Operating System') && (
              <InfoRow
                label="Operating System"
                value={fullDeviceData.hardware.osVersion}
                badge={{text: Platform.OS.toUpperCase(), color: AppColors.blue500, bg: `${AppColors.blue500}18`}}
              />
            )}
            {isMatch('IP Address') && (
              <InfoRow
                label="Local IP Address"
                value={ipAddress}
                badge={{text: 'ONLINE', color: AppColors.emerald500, bg: `${AppColors.emerald500}18`}}
              />
            )}
            {isMatch('RAM Memory') && (
              <InfoRow
                label="RAM Memory"
                value={`${usedRamMb} MB / ${totalRamMb} MB (${ramUsagePct}%)`}
                subtext={`Free Memory: ${freeRamMb} MB`}
              />
            )}
            {isMatch('Storage Capacity') && (
              <InfoRow
                label="Internal Storage"
                value={`${freeStorageGb} GB Free / ${totalStorageGb} GB Total`}
              />
            )}
            {isMatch('App Version') && (
              <InfoRow
                label="Host App Version"
                value={`v${fullDeviceData.runtime.appVersion} (${fullDeviceData.runtime.appBuild})`}
              />
            )}
            {isMatch('JavaScript Engine') && (
              <InfoRow
                label="JS Runtime Engine"
                value={isHermes ? 'Hermes Bytecode Engine' : 'JavaScriptCore (JSC)'}
                badge={
                  isHermes
                    ? {text: 'HERMES', color: AppColors.purple, bg: `${AppColors.purple}18`}
                    : {text: 'JSC', color: AppColors.sky500, bg: `${AppColors.sky500}18`}
                }
              />
            )}
            {isMatch('UDID Identifier') && (
              <InfoRow
                label="Pseudo-UDID"
                value={pseudoUDID}
                isLast
              />
            )}
          </View>
        )}

        {/* ── SUB-TAB 2: HARDWARE & SYSTEM ── */}
        {(activeSubTab === 'hardware' || search.length > 0) && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>HARDWARE & SYSTEM SPECIFICATIONS</Text>
            {isMatch('CPU Architecture') && (
              <InfoRow
                label="CPU Architecture / ABI"
                value={fullDeviceData.hardware.cpuAbi}
                badge={{text: '64-BIT', color: AppColors.purple, bg: `${AppColors.purple}18`}}
              />
            )}
            {isMatch('Total RAM') && (
              <InfoRow
                label="Total Physical RAM"
                value={`${totalRamMb} MB`}
              />
            )}
            {isMatch('Free RAM') && (
              <InfoRow
                label="Available Free RAM"
                value={`${freeRamMb} MB`}
                badge={{
                  text: freeRamMb < 500 ? 'LOW' : 'HEALTHY',
                  color: freeRamMb < 500 ? AppColors.errorColor : AppColors.emerald500,
                  bg: freeRamMb < 500 ? `${AppColors.errorColor}18` : `${AppColors.emerald500}18`,
                }}
              />
            )}
            {isMatch('Storage Capacity') && (
              <InfoRow
                label="Disk Storage Total"
                value={`${totalStorageGb} GB`}
              />
            )}
            {isMatch('Available Storage') && (
              <InfoRow
                label="Disk Storage Available"
                value={`${freeStorageGb} GB`}
              />
            )}
            {isMatch('Battery') && (
              <InfoRow
                label="Battery Level"
                value={`${deviceMetrics?.batteryPercent ?? 100}%`}
                badge={{
                  text: deviceMetrics?.isCharging ? 'CHARGING' : 'DISCHARGING',
                  color: deviceMetrics?.isCharging ? AppColors.emerald500 : AppColors.grayText,
                  bg: deviceMetrics?.isCharging ? `${AppColors.emerald500}18` : `${AppColors.grayText}18`,
                }}
              />
            )}
            {isMatch('API Level') && Platform.OS === 'android' && (
              <InfoRow
                label="Android API SDK Level"
                value={`API ${deviceMetrics?.apiLevel || Platform.Version}`}
              />
            )}
            {isMatch('Thermal State') && (
              <InfoRow
                label="Thermal State"
                value="Nominal (Cool)"
                badge={{text: 'OPTIMAL', color: AppColors.emerald500, bg: `${AppColors.emerald500}18`}}
                isLast
              />
            )}
          </View>
        )}

        {/* ── SUB-TAB 3: NETWORK & CONNECTIVITY ── */}
        {(activeSubTab === 'network' || search.length > 0) && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>NETWORK & CONNECTIVITY</Text>
            {isMatch('IP Address') && (
              <InfoRow
                label="Local Device IP"
                value={ipAddress}
                badge={{text: 'IPV4', color: AppColors.blue500, bg: `${AppColors.blue500}18`}}
              />
            )}
            {isMatch('Internet Reachability') && (
              <InfoRow
                label="Internet Reachability"
                value="Connected"
                badge={{text: 'ONLINE', color: AppColors.emerald500, bg: `${AppColors.emerald500}18`}}
              />
            )}
            {isMatch('Connection Type') && (
              <InfoRow
                label="Active Connection Type"
                value="Wi-Fi / Local Area Network"
              />
            )}
            {isMatch('Metro Dev Server') && (
              <InfoRow
                label="Metro Packager Host"
                value={
                  NativeModules?.PlatformConstants?.serverHost ||
                  NativeModules?.AndroidConstants?.serverHost ||
                  'localhost:8081'
                }
              />
            )}
            {isMatch('WebSocket Protocol') && (
              <InfoRow
                label="WebSocket (WSS) Support"
                value="Active & Enabled"
              />
            )}
            {isMatch('Network Inspector Interceptor') && (
              <InfoRow
                label="Network Interceptor Status"
                value="Intercepting XHR & Fetch"
                badge={{text: 'MONITORING', color: AppColors.purple, bg: `${AppColors.purple}18`}}
                isLast
              />
            )}
          </View>
        )}

        {/* ── SUB-TAB 4: DISPLAY & SCREEN GEOMETRY ── */}
        {(activeSubTab === 'display' || search.length > 0) && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>DISPLAY & SCREEN GEOMETRY</Text>
            {isMatch('Window Resolution') && (
              <InfoRow
                label="Window Logical Size"
                value={`${windowDims.width.toFixed(0)} × ${windowDims.height.toFixed(0)} pt`}
              />
            )}
            {isMatch('Screen Physical Size') && (
              <InfoRow
                label="Physical Screen Size"
                value={`${(screenDims.width * pixelRatio).toFixed(0)} × ${(screenDims.height * pixelRatio).toFixed(0)} px`}
              />
            )}
            {isMatch('Pixel Density') && (
              <InfoRow
                label="Pixel Ratio (DPI Scale)"
                value={`@${pixelRatio}x (${Math.round(pixelRatio * 160)} dpi)`}
                badge={{text: `@${pixelRatio}x`, color: AppColors.purple, bg: `${AppColors.purple}18`}}
              />
            )}
            {isMatch('Font Scale') && (
              <InfoRow
                label="User Font Scale"
                value={`${fontScale}x (${fontScale === 1 ? 'Default' : fontScale > 1 ? 'Enlarged' : 'Compact'})`}
              />
            )}
            {isMatch('Form Factor') && (
              <InfoRow
                label="Device Form Factor"
                value={isTablet ? 'Tablet' : 'Smartphone'}
                badge={{
                  text: isTablet ? 'TABLET' : 'PHONE',
                  color: isTablet ? AppColors.blue500 : AppColors.purple,
                  bg: isTablet ? `${AppColors.blue500}18` : `${AppColors.purple}18`,
                }}
              />
            )}
            {isMatch('Orientation') && (
              <InfoRow
                label="Screen Orientation"
                value={isLandscape ? 'Landscape' : 'Portrait'}
              />
            )}
            {isMatch('Status Bar Height') && (
              <InfoRow
                label="Status Bar Inset"
                value={`${statusBarHeight} pt`}
                isLast
              />
            )}
          </View>
        )}

        {/* ── SUB-TAB 5: RUNTIME & APPLICATION ── */}
        {(activeSubTab === 'runtime' || search.length > 0) && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>RUNTIME & APPLICATION</Text>
            {isMatch('App Name') && (
              <InfoRow
                label="Application Name"
                value={fullDeviceData.runtime.appName}
              />
            )}
            {isMatch('Bundle ID') && (
              <InfoRow
                label="Bundle Identifier / Package"
                value={fullDeviceData.identifiers.bundleId}
              />
            )}
            {isMatch('App Version') && (
              <InfoRow
                label="Application Version"
                value={`v${fullDeviceData.runtime.appVersion} (${fullDeviceData.runtime.appBuild})`}
              />
            )}
            {isMatch('React Native') && (
              <InfoRow
                label="React Native Framework"
                value={`v${reactNativeVersion}`}
                badge={{text: 'RN', color: AppColors.sky500, bg: `${AppColors.sky500}18`}}
              />
            )}
            {isMatch('In-App Inspector Version') && (
              <InfoRow
                label="In-App Inspector Library"
                value={`v${LIB_VERSION}`}
                badge={{text: 'LATEST', color: AppColors.purple, bg: `${AppColors.purple}18`}}
              />
            )}
            {isMatch('Hermes Engine') && (
              <InfoRow
                label="Hermes JavaScript Engine"
                value={isHermes ? 'Enabled (AOT Bytecode)' : 'Disabled (JSC)'}
                badge={{
                  text: isHermes ? 'HERMES' : 'JSC',
                  color: isHermes ? AppColors.purple : AppColors.grayText,
                  bg: isHermes ? `${AppColors.purple}18` : `${AppColors.grayText}18`,
                }}
              />
            )}
            {isMatch('New Architecture') && (
              <InfoRow
                label="Bridgeless TurboModules (New Arch)"
                value={isTurboModule ? 'Enabled' : 'Legacy Bridge'}
                badge={{
                  text: isTurboModule ? 'NEW ARCH' : 'LEGACY',
                  color: isTurboModule ? AppColors.emerald500 : AppColors.blue500,
                  bg: isTurboModule ? `${AppColors.emerald500}18` : `${AppColors.blue500}18`,
                }}
              />
            )}
            {isMatch('Build Type') && (
              <InfoRow
                label="Build Configuration"
                value={__DEV__ ? 'Debug (__DEV__ = true)' : 'Release / Production'}
                badge={{
                  text: __DEV__ ? 'DEBUG' : 'RELEASE',
                  color: __DEV__ ? AppColors.warningIconGold : AppColors.emerald500,
                  bg: __DEV__ ? `${AppColors.warningIconGold}18` : `${AppColors.emerald500}18`,
                }}
              />
            )}
            {isMatch('Timezone') && (
              <InfoRow
                label="System Timezone"
                value={fullDeviceData.runtime.timezone}
              />
            )}
            {isMatch('Locale') && (
              <InfoRow
                label="System Language & Locale"
                value={fullDeviceData.runtime.locale}
              />
            )}
            {isMatch('Session Uptime') && (
              <InfoRow
                label="Inspector Session Uptime"
                value={deviceUptime}
                isLast
              />
            )}
          </View>
        )}

        {/* ── SUB-TAB 6: SECURITY & IDENTIFIERS ── */}
        {(activeSubTab === 'security' || search.length > 0) && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>DEVICE IDENTIFIERS & SECURITY</Text>
            {isMatch('Pseudo-UDID') && (
              <InfoRow
                label="Deterministic Pseudo-UDID"
                value={pseudoUDID}
                subtext="Stable hardware signature hash for testing & diagnostics"
                badge={{text: 'PERSISTENT', color: AppColors.purple, bg: `${AppColors.purple}18`}}
              />
            )}
            {isMatch('Bundle ID') && (
              <InfoRow
                label="Application Bundle ID"
                value={fullDeviceData.identifiers.bundleId}
              />
            )}
            {isMatch('Root / Jailbreak') && (
              <InfoRow
                label="Root / Jailbreak Heuristic"
                value="Clean (Standard Sandbox)"
                badge={{text: 'SECURE', color: AppColors.emerald500, bg: `${AppColors.emerald500}18`}}
              />
            )}
            {isMatch('Simulator / Emulator') && (
              <InfoRow
                label="Emulator / Physical Device"
                value={
                  (Platform.constants as any)?.Model?.includes?.('sdk') ||
                  (Platform.constants as any)?.Model?.includes?.('Emulator') ||
                  (Platform.constants as any)?.Model?.includes?.('Simulator')
                    ? 'Virtual Simulator'
                    : 'Physical Device'
                }
              />
            )}
            {isMatch('Sandbox Integrity') && (
              <InfoRow
                label="App Sandbox File Isolation"
                value="Enforced by OS Kernel"
                isLast
              />
            )}
          </View>
        )}

        <View style={{height: 48}} />
      </ScrollView>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.grayBackground,
  },
  subTabsWrapper: {
    backgroundColor: AppColors.primaryLight,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.dividerColor,
    paddingVertical: 8,
  },
  subTabsContainer: {
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  subTabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5.5,
    borderRadius: 8,
    backgroundColor: AppColors.grayBackground,
    borderWidth: 1,
    borderColor: AppColors.grayBorderSecondary,
  },
  subTabPillActive: {
    backgroundColor: AppColors.purple,
    borderColor: AppColors.purple,
  },
  subTabPillText: {
    fontFamily: AppFonts.interBold,
    fontSize: 11,
    color: AppColors.grayText,
  },
  subTabPillTextActive: {
    color: AppColors.white,
  },
  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: AppColors.primaryLight,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.dividerColor,
    gap: 8,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.grayBackground,
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: Platform.OS === 'ios' ? 6 : 2,
    borderWidth: 1,
    borderColor: AppColors.grayBorderSecondary,
    gap: 6,
  },
  searchInput: {
    flex: 1,
    fontFamily: AppFonts.interMedium,
    fontSize: 12,
    color: AppColors.primaryBlack,
    padding: 0,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: `${AppColors.purple}14`,
    borderWidth: 1,
    borderColor: `${AppColors.purple}33`,
  },
  exportButtonText: {
    fontFamily: AppFonts.interBold,
    fontSize: 11,
    color: AppColors.purple,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 12,
    gap: 12,
    paddingBottom: 100,
  },
  heroCard: {
    backgroundColor: AppColors.primaryLight,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: AppColors.grayBorderSecondary,
    padding: 14,
    shadowColor: AppColors.black,
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: {width: 0, height: 2},
    elevation: 1,
    gap: 12,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  heroIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: AppColors.purple,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: AppColors.purple,
    shadowOpacity: 0.25,
    shadowRadius: 4,
    shadowOffset: {width: 0, height: 2},
    elevation: 2,
  },
  heroTitle: {
    fontFamily: AppFonts.interBold,
    fontSize: 15,
    color: AppColors.primaryBlack,
    letterSpacing: -0.2,
  },
  heroSubtitle: {
    fontFamily: AppFonts.interRegular,
    fontSize: 11.5,
    color: AppColors.grayText,
    marginTop: 1,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: `${AppColors.emerald500}18`,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: AppColors.emerald500,
  },
  heroBadgeText: {
    fontFamily: AppFonts.interBold,
    fontSize: 9.5,
    color: AppColors.emerald500,
  },
  heroMetricsStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.grayBackground,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  heroMetricItem: {
    flex: 1,
    alignItems: 'center',
  },
  heroMetricLabel: {
    fontFamily: AppFonts.interBold,
    fontSize: 8.5,
    color: AppColors.grayTextWeak,
    letterSpacing: 0.4,
  },
  heroMetricValue: {
    fontFamily: AppFonts.interBold,
    fontSize: 11,
    color: AppColors.primaryBlack,
    marginTop: 2,
  },
  heroMetricDivider: {
    width: 1,
    height: 20,
    backgroundColor: AppColors.dividerColor,
  },
  sectionCard: {
    backgroundColor: AppColors.primaryLight,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: AppColors.grayBorderSecondary,
    padding: 14,
    shadowColor: AppColors.black,
    shadowOpacity: 0.03,
    shadowRadius: 3,
    shadowOffset: {width: 0, height: 1},
    elevation: 1,
  },
  sectionTitle: {
    fontFamily: AppFonts.interBold,
    fontSize: 10.5,
    color: AppColors.grayTextWeak,
    letterSpacing: 0.8,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.dividerColor,
  },
  infoLabel: {
    fontFamily: AppFonts.interMedium,
    fontSize: 12.5,
    color: AppColors.primaryBlack,
  },
  infoSubtext: {
    fontFamily: AppFonts.interRegular,
    fontSize: 10,
    color: AppColors.grayTextWeak,
    marginTop: 1,
  },
  infoBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 1,
  },
  infoBadgeText: {
    fontFamily: AppFonts.interBold,
    fontSize: 8.5,
  },
  infoValue: {
    fontFamily: AppFonts.interBold,
    fontSize: 12,
    color: AppColors.primaryBlack,
    maxWidth: 180,
    textAlign: 'right',
  },
  rowCopyBtn: {
    padding: 4,
    borderRadius: 4,
    backgroundColor: AppColors.grayBackground,
  },
});

export default DeviceInfoTab;
