import React, {useState, useEffect, useMemo, useCallback, useRef} from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  NativeModules,
  Share,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Platform,
} from 'react-native';
import {useInspector} from './InspectorContext';
import {AppColors} from '../../styles/AppColors';
import {AppFonts} from '../../styles/AppFonts';
import QRCodeView from '../QRCodeView';
import TouchableScale from '../TouchableScale';
import CopyButton from '../CopyButton';
import {copyToClipboard} from '../../helpers';
import {showToast} from '../../helpers/toast';
import {triggerNativeHaptic} from '../../native/NativeInspector';
import {
  PackageIcon,
  InfoCircleIcon,
  CheckIcon,
  BoltIcon,
  CircleXIcon,
  CopyIcon,
  ExternalLinkIcon,
  SparkleIcon,
  AndroidIcon,
  RepeatIcon,
} from '../NetworkIcons';
import Svg, {Path} from 'react-native-svg';

const TerminalConsoleIcon = ({color = AppColors.purple, size = 13}: {color?: string; size?: number}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M4 17l6-6-6-6M12 19h8" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

interface BuildStatusData {
  status: 'idle' | 'running' | 'completed' | 'failed';
  scheme: string;
  clean: boolean;
  progress: number;
  currentTask: string;
  logs?: string[];
  error: string | null;
  apkName: string | null;
  apkSize: number | null;
}

export const DebuggingTab: React.FC = () => {
  // Auto-detect host IP and initial port from NativeModules.SourceCode.scriptURL
  const detectedConfig = useMemo(() => {
    const scriptURL = NativeModules.SourceCode?.scriptURL || '';
    let host = 'localhost';
    let port = 8081;

    try {
      if (scriptURL.includes('://')) {
        const urlWithoutScheme = scriptURL.split('://')[1];
        const hostAndPort = urlWithoutScheme.split('/')[0];
        if (hostAndPort.includes(':')) {
          const parts = hostAndPort.split(':');
          host = parts[0];
          const parsedPort = parseInt(parts[1], 10);
          if (!isNaN(parsedPort)) port = parsedPort;
        } else {
          host = hostAndPort;
        }
      }
    } catch {}

    return {host, port, scriptURL};
  }, []);

  const [hostIp, setHostIp] = useState<string>(() => {
    if (
      detectedConfig.host &&
      detectedConfig.host !== 'localhost' &&
      detectedConfig.host !== '127.0.0.1' &&
      detectedConfig.host !== '10.0.2.2'
    ) {
      return detectedConfig.host;
    }
    return '192.168.1.2';
  });

  const [port, setPort] = useState<number>(detectedConfig.port || 8083);
  const [apkFileName, setApkFileName] = useState<string>('app-debug.apk');
  const [apkSizeMb, setApkSizeMb] = useState<string | null>(null);

  // Build generation state
  const [selectedScheme, setSelectedScheme] = useState<'assembleRelease' | 'assembleDebug'>('assembleRelease');
  const [isCleanBuild, setIsCleanBuild] = useState<boolean>(true);
  const [buildStatus, setBuildStatus] = useState<BuildStatusData>({
    status: 'idle',
    scheme: 'assembleRelease',
    clean: true,
    progress: 0,
    currentTask: '',
    error: null,
    apkName: null,
    apkSize: null,
  });

  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const [showVerboseLogs, setShowVerboseLogs] = useState<boolean>(true);
  const verboseScrollRef = useRef<ScrollView | null>(null);

  // Animate progress bar smoothly
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: Math.max(0, Math.min(100, buildStatus.progress)),
      duration: 350,
      useNativeDriver: false,
    }).start();
  }, [buildStatus.progress, progressAnim]);

  // Auto-scroll verbose console to bottom
  useEffect(() => {
    if (buildStatus.logs && buildStatus.logs.length > 0) {
      setTimeout(() => {
        verboseScrollRef.current?.scrollToEnd({ animated: true });
      }, 50);
    }
  }, [buildStatus.logs]);

  // Auto-fetch dynamic IP and APK metadata from Metro / Standalone Server
  const fetchMetroTelemetry = useCallback(async () => {
    const hostsToTry = Array.from(
      new Set([detectedConfig.host, '10.0.2.2', 'localhost', '127.0.0.1'].filter(Boolean)),
    );
    const portsToTry = Array.from(
      new Set([detectedConfig.port, 8083, 8081, 8082].filter(Boolean)),
    );

    for (const h of hostsToTry) {
      for (const p of portsToTry) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 1200);
          const res = await fetch(`http://${h}:${p}/__inapp_inspector/apk-info`, {
            signal: controller.signal,
          });
          clearTimeout(timeoutId);
          if (res.ok) {
            const data = await res.json();
            if (
              data.hostIp &&
              data.hostIp !== '127.0.0.1' &&
              data.hostIp !== 'localhost' &&
              data.hostIp !== '10.0.2.2'
            ) {
              setHostIp(data.hostIp);
            }
            if (data.port) {
              setPort(data.port);
            }
            if (data.apkName) {
              setApkFileName(data.apkName);
            }
            if (data.apkSize) {
              setApkSizeMb((data.apkSize / (1024 * 1024)).toFixed(1));
            }
            return;
          }
        } catch {}
      }
    }
  }, [detectedConfig.host, detectedConfig.port]);

  useEffect(() => {
    fetchMetroTelemetry();
  }, [fetchMetroTelemetry]);

  // Clean up polling interval on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  // Poll build status from Metro
  const pollBuildStatus = useCallback(() => {
    if (pollingRef.current) clearInterval(pollingRef.current);

    const targetHost = detectedConfig.host || '10.0.2.2';
    pollingRef.current = setInterval(async () => {
      try {
        const res = await fetch(`http://${targetHost}:${port}/__inapp_inspector/build-status`);
        if (res.ok) {
          const data: BuildStatusData = await res.json();
          setBuildStatus(data);

          if (data.status === 'completed') {
            if (pollingRef.current) clearInterval(pollingRef.current);
            triggerNativeHaptic('success');
            showToast('✓ APK Build Generated Successfully!');
            if (data.apkSize) {
              setApkSizeMb((data.apkSize / (1024 * 1024)).toFixed(1));
            }
            if (data.apkName) {
              setApkFileName(data.apkName);
            }
            fetchMetroTelemetry();
          } else if (data.status === 'failed') {
            if (pollingRef.current) clearInterval(pollingRef.current);
            triggerNativeHaptic('error');
            showToast('✕ Build Failed: ' + (data.error || 'Gradle error'));
          }
        }
      } catch {}
    }, 1000);
  }, [detectedConfig.host, port, fetchMetroTelemetry]);

  // Start Gradle build on computer via Metro / Standalone Server
  const handleStartBuild = async () => {
    triggerNativeHaptic('medium');
    setBuildStatus({
      status: 'running',
      scheme: selectedScheme,
      clean: isCleanBuild,
      progress: 5,
      currentTask: isCleanBuild ? 'Cleaning build cache...' : 'Initializing build...',
      error: null,
      apkName: null,
      apkSize: null,
    });

    const hostsToTry = Array.from(
      new Set([detectedConfig.host, '10.0.2.2', 'localhost', '127.0.0.1'].filter(Boolean)),
    );
    const portsToTry = Array.from(new Set([port, 8083, 8081, 8082].filter(Boolean)));

    let buildTriggered = false;

    for (const h of hostsToTry) {
      for (const p of portsToTry) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 2000);
          const res = await fetch(
            `http://${h}:${p}/__inapp_inspector/build-apk?scheme=${selectedScheme}&clean=${isCleanBuild}`,
            { signal: controller.signal },
          );
          clearTimeout(timeoutId);
          if (res.ok) {
            buildTriggered = true;
            pollBuildStatus();
            return;
          }
        } catch {}
      }
    }

    if (!buildTriggered) {
      setBuildStatus(prev => ({
        ...prev,
        status: 'failed',
        error: 'Cannot reach build server. Ensure npm start or npm run serve-apk is running on host.',
      }));
    }
  };

  // Stop Gradle build on computer via Metro / Standalone Server
  const handleStopBuild = async () => {
    triggerNativeHaptic('warning');
    if (pollingRef.current) clearInterval(pollingRef.current);

    const hostsToTry = Array.from(
      new Set([detectedConfig.host, '10.0.2.2', 'localhost', '127.0.0.1'].filter(Boolean)),
    );
    const portsToTry = Array.from(new Set([port, 8083, 8081, 8082].filter(Boolean)));

    for (const h of hostsToTry) {
      for (const p of portsToTry) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 1500);
          await fetch(`http://${h}:${p}/__inapp_inspector/stop-build`, {
            signal: controller.signal,
          });
          clearTimeout(timeoutId);
        } catch {}
      }
    }

    setBuildStatus(prev => ({
      ...prev,
      status: 'idle',
      currentTask: 'Build cancelled by user',
      logs: [...(prev.logs || []), '🛑 Build cancelled by user.'],
    }));
    showToast('Build cancelled');
  };

  // Construct target download URL
  const apkDownloadUrl = `http://${hostIp}:${port}/${apkFileName.replace(/^\/+/, '')}`;

  const handleShare = () => {
    triggerNativeHaptic('light');
    Share.share({
      message: apkDownloadUrl,
      title: 'Install Android APK',
    });
  };

  const isBuilding = buildStatus.status === 'running';

  return (
    <ScrollView
      style={styles.scrollArea}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}>
      {/* ─── Hero Card: Multi-Device APK Installer ───────────────────── */}
      <View style={styles.heroCard}>
        <View style={styles.heroHeader}>
          <View style={styles.heroIconWrap}>
            <AndroidIcon size={20} color={AppColors.white} />
          </View>
          <View style={{flex: 1, minWidth: 0}}>
            <Text style={styles.heroTitle} numberOfLines={1}>
              Multi-Device APK Installer
            </Text>
            <Text style={styles.heroSubtitle} numberOfLines={1}>
              Scan QR code with another Android device to download
            </Text>
          </View>
          <View style={styles.heroBadge}>
            <View style={styles.pulseDot} />
            <Text style={styles.heroBadgeText}>Live Metro</Text>
          </View>
        </View>

        {/* Hero Metrics Strip (Matching DeviceInfoTab & PerformanceTab) */}
        <View style={styles.heroMetricsStrip}>
          <View style={styles.heroMetricItem}>
            <Text style={styles.heroMetricLabel}>HOST IP</Text>
            <Text style={styles.heroMetricValue} numberOfLines={1}>
              {hostIp}
            </Text>
          </View>
          <View style={styles.heroMetricDivider} />
          <View style={styles.heroMetricItem}>
            <Text style={styles.heroMetricLabel}>PORT</Text>
            <Text style={styles.heroMetricValue}>{port}</Text>
          </View>
          <View style={styles.heroMetricDivider} />
          <View style={styles.heroMetricItem}>
            <Text style={styles.heroMetricLabel}>APK SIZE</Text>
            <Text
              style={[
                styles.heroMetricValue,
                {color: apkSizeMb ? AppColors.emerald500 : AppColors.grayTextWeak},
              ]}>
              {apkSizeMb ? `${apkSizeMb} MB` : 'Detected'}
            </Text>
          </View>
          <View style={styles.heroMetricDivider} />
          <View style={styles.heroMetricItem}>
            <Text style={styles.heroMetricLabel}>STATUS</Text>
            <Text
              style={[
                styles.heroMetricValue,
                {color: AppColors.emerald500},
              ]}>
              Ready
            </Text>
          </View>
        </View>
      </View>

      {/* ─── Section Card: QR Code & Direct Download ─────────────────── */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>QR CODE & DIRECT DOWNLOAD</Text>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={fetchMetroTelemetry}
            style={styles.refreshBtn}>
            <RepeatIcon size={12} color={AppColors.purple} />
            <Text style={styles.refreshBtnText}>Refresh</Text>
          </TouchableOpacity>
        </View>

        {/* QR Code Container */}
        <View style={styles.qrCenteredWrapper}>
          <View style={styles.qrInnerFrame}>
            <QRCodeView
              value={apkDownloadUrl}
              size={235}
              color={AppColors.primaryBlack}
              backgroundColor={AppColors.white}
            />
          </View>
        </View>
      </View>

      {/* ─── Section Card: Build Generator (Gradle) ─────────────────── */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeaderRow}>
          <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
            <BoltIcon size={13} color={AppColors.purple} />
            <Text style={styles.sectionTitle}>BUILD GENERATOR (GRADLE)</Text>
          </View>
          {buildStatus.status === 'completed' && (
            <View style={styles.completedBadge}>
              <CheckIcon size={10} color={AppColors.emerald500} />
              <Text style={styles.completedBadgeText}>100% Ready</Text>
            </View>
          )}
        </View>

        {/* SubTab Segmented Strip (Matching DeviceInfoTab & PerformanceTab) */}
        <View style={styles.subTabStrip}>
          <TouchableOpacity
            disabled={isBuilding}
            activeOpacity={0.7}
            onPress={() => {
              triggerNativeHaptic('light');
              setSelectedScheme('assembleRelease');
            }}
            style={[
              styles.subTabItem,
              selectedScheme === 'assembleRelease' && styles.subTabItemActive,
            ]}>
            <Text
              style={[
                styles.subTabText,
                selectedScheme === 'assembleRelease' && styles.subTabTextActive,
              ]}>
              ⚡ Release (assembleRelease)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            disabled={isBuilding}
            activeOpacity={0.7}
            onPress={() => {
              triggerNativeHaptic('light');
              setSelectedScheme('assembleDebug');
            }}
            style={[
              styles.subTabItem,
              selectedScheme === 'assembleDebug' && styles.subTabItemActive,
            ]}>
            <Text
              style={[
                styles.subTabText,
                selectedScheme === 'assembleDebug' && styles.subTabTextActive,
              ]}>
              🛠 Debug (assembleDebug)
            </Text>
          </TouchableOpacity>
        </View>

        {/* Clean Build Checkbox */}
        <TouchableOpacity
          disabled={isBuilding}
          activeOpacity={0.7}
          onPress={() => {
            triggerNativeHaptic('light');
            setIsCleanBuild(!isCleanBuild);
          }}
          style={styles.cleanRow}>
          <View
            style={[
              styles.checkboxBox,
              isCleanBuild && styles.checkboxBoxActive,
            ]}>
            {isCleanBuild && <CheckIcon size={11} color={AppColors.white} />}
          </View>
          <Text style={styles.cleanLabel}>
            Clean build cache <Text style={styles.cleanCode}>(./gradlew clean)</Text>
          </Text>
        </TouchableOpacity>

        {/* Progress Display Bar (0% to 100%) */}
        {isBuilding && (
          <View style={styles.progressContainer}>
            <View style={styles.progressTopRow}>
              <View style={styles.progressTaskGroup}>
                <ActivityIndicator size="small" color={AppColors.purple} />
                <Text style={styles.progressTaskText} numberOfLines={1}>
                  {buildStatus.currentTask || 'Executing Gradle tasks...'}
                </Text>
              </View>
              <Text style={styles.progressPercentageText}>
                {buildStatus.progress}%
              </Text>
            </View>

            {/* Animated Progress Bar */}
            <View style={styles.progressBarTrack}>
              <Animated.View
                style={[
                  styles.progressBarFill,
                  {
                    width: progressAnim.interpolate({
                      inputRange: [0, 100],
                      outputRange: ['5%', '100%'],
                    }),
                  },
                ]}
              />
            </View>
          </View>
        )}

        {/* Error Container */}
        {buildStatus.status === 'failed' && (
          <View style={styles.errorContainer}>
            <CircleXIcon size={13} color={AppColors.errorColor} />
            <Text style={styles.errorText} numberOfLines={2}>
              {buildStatus.error || 'Build execution failed.'}
            </Text>
          </View>
        )}

        {/* Live Verbose Console Output */}
        {((buildStatus.logs && buildStatus.logs.length > 0) || isBuilding) && (
          <View style={styles.consoleContainer}>
            <View style={styles.consoleHeaderRow}>
              <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
                <TerminalConsoleIcon color="#38BDF8" size={12} />
                <Text style={styles.consoleHeaderTitle}>GRADLE VERBOSE OUTPUT</Text>
              </View>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setShowVerboseLogs(!showVerboseLogs)}
                style={styles.consoleToggleBtn}>
                <Text style={styles.consoleToggleText}>
                  {showVerboseLogs ? 'Hide Console' : 'Show Console'}
                </Text>
              </TouchableOpacity>
            </View>

            {showVerboseLogs && (
              <ScrollView
                ref={verboseScrollRef}
                style={styles.consoleLogBox}
                contentContainerStyle={styles.consoleLogContent}
                nestedScrollEnabled
                showsVerticalScrollIndicator>
                {buildStatus.logs && buildStatus.logs.length > 0 ? (
                  buildStatus.logs.map((logLine, idx) => {
                    let logColor = '#94A3B8';
                    if (logLine.startsWith('> Task :')) logColor = '#38BDF8';
                    else if (logLine.includes('BUILD SUCCESSFUL')) logColor = '#4ADE80';
                    else if (logLine.includes('FAILURE') || logLine.includes('error:')) logColor = '#F87171';
                    else if (logLine.includes('UP-TO-DATE')) logColor = '#A78BFA';

                    return (
                      <Text key={idx} style={[styles.consoleLogLine, {color: logColor}]}>
                        {logLine}
                      </Text>
                    );
                  })
                ) : (
                  <Text style={styles.consoleLogPlaceholder}>
                    Waiting for Gradle daemon output...
                  </Text>
                )}
              </ScrollView>
            )}
          </View>
        )}

        {/* Action Button Row */}
        {isBuilding ? (
          <View style={styles.buildingActionsRow}>
            <View style={styles.buildingStatusPill}>
              <ActivityIndicator size="small" color={AppColors.purple} />
              <Text style={styles.buildingStatusPillText} numberOfLines={1}>
                Building ({buildStatus.progress}%)
              </Text>
            </View>

            <TouchableScale
              onPress={handleStopBuild}
              style={styles.stopBtn}>
              <CircleXIcon size={13} color={AppColors.white} />
              <Text style={styles.stopBtnText}>Stop Build</Text>
            </TouchableScale>
          </View>
        ) : (
          <TouchableScale
            onPress={handleStartBuild}
            style={styles.generateBtn}>
            <View style={styles.ctaContentRow}>
              <SparkleIcon size={14} color={AppColors.white} />
              <Text style={styles.generateBtnText}>
                {isCleanBuild ? 'Clean & Generate Build' : 'Generate Build'}
              </Text>
            </View>
          </TouchableScale>
        )}
      </View>

      {/* ─── Footer Hint Note ───────────────────────────────────────── */}
      <View style={styles.footerNoteRow}>
        <InfoCircleIcon size={13} color={AppColors.grayTextWeak} />
        <Text style={styles.footerNoteText}>
          Ensure both Android devices are connected to the same Wi-Fi network.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollArea: {
    flex: 1,
    backgroundColor: AppColors.contentBg,
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
    paddingHorizontal: 2,
    minWidth: 0,
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
    gap: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontFamily: AppFonts.interBold,
    fontSize: 10.5,
    color: AppColors.grayTextWeak,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: `${AppColors.purple}12`,
  },
  refreshBtnText: {
    fontFamily: AppFonts.interBold,
    fontSize: 10,
    color: AppColors.purple,
  },
  qrCenteredWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppColors.grayBackground,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AppColors.grayBorderSecondary,
  },
  qrInnerFrame: {
    backgroundColor: AppColors.white,
    padding: 6,
    borderRadius: 8,
  },
  urlBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.grayBackground,
    borderRadius: 10,
    paddingLeft: 10,
    paddingRight: 6,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: AppColors.grayBorderSecondary,
    gap: 8,
  },
  urlText: {
    flex: 1,
    fontFamily: AppFonts.interMedium,
    fontSize: 11.5,
    color: AppColors.skyBlue,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionBtnSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: AppColors.grayBorderSecondary,
    backgroundColor: AppColors.grayBackground,
  },
  actionBtnSecondaryText: {
    fontFamily: AppFonts.interBold,
    fontSize: 12,
    color: AppColors.grayTextStrong,
  },
  actionBtnPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: AppColors.purple,
    shadowColor: AppColors.purple,
    shadowOpacity: 0.25,
    shadowRadius: 4,
    shadowOffset: {width: 0, height: 2},
    elevation: 2,
  },
  actionBtnPrimaryText: {
    fontFamily: AppFonts.interBold,
    fontSize: 12,
    color: AppColors.white,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: `${AppColors.emerald500}18`,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  completedBadgeText: {
    fontFamily: AppFonts.interBold,
    fontSize: 9.5,
    color: AppColors.emerald500,
  },
  subTabStrip: {
    flexDirection: 'row',
    backgroundColor: AppColors.grayBackground,
    borderRadius: 8,
    padding: 2,
    borderWidth: 1,
    borderColor: AppColors.grayBorderSecondary,
  },
  subTabItem: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subTabItemActive: {
    backgroundColor: AppColors.purple,
    shadowColor: AppColors.purple,
    shadowOpacity: 0.2,
    shadowRadius: 3,
    shadowOffset: {width: 0, height: 1},
    elevation: 1,
  },
  subTabText: {
    fontFamily: AppFonts.interMedium,
    fontSize: 11,
    color: AppColors.grayText,
  },
  subTabTextActive: {
    fontFamily: AppFonts.interBold,
    color: AppColors.white,
  },
  cleanRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 2,
  },
  checkboxBox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: AppColors.grayBorderSecondary,
    backgroundColor: AppColors.grayBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxBoxActive: {
    backgroundColor: AppColors.purple,
    borderColor: AppColors.purple,
  },
  cleanLabel: {
    fontFamily: AppFonts.interMedium,
    fontSize: 11.5,
    color: AppColors.grayTextStrong,
  },
  cleanCode: {
    fontFamily: AppFonts.interRegular,
    color: AppColors.grayTextWeak,
    fontSize: 10.5,
  },
  progressContainer: {
    backgroundColor: AppColors.grayBackground,
    borderRadius: 10,
    padding: 10,
    gap: 6,
    borderWidth: 1,
    borderColor: AppColors.grayBorderSecondary,
  },
  progressTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressTaskGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    paddingRight: 8,
  },
  progressTaskText: {
    fontFamily: AppFonts.interMedium,
    fontSize: 11,
    color: AppColors.primaryBlack,
    flex: 1,
  },
  progressPercentageText: {
    fontFamily: AppFonts.interBold,
    fontSize: 11.5,
    color: AppColors.purple,
  },
  progressBarTrack: {
    width: '100%',
    height: 6,
    borderRadius: 3,
    backgroundColor: AppColors.grayBorderSecondary,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: AppColors.purple,
    borderRadius: 3,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: `${AppColors.errorColor}12`,
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: `${AppColors.errorColor}25`,
  },
  errorText: {
    fontFamily: AppFonts.interRegular,
    fontSize: 11,
    color: AppColors.errorColor,
    flex: 1,
  },
  consoleContainer: {
    backgroundColor: '#0F172A',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1E293B',
    overflow: 'hidden',
    marginTop: 4,
  },
  consoleHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1E293B',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  consoleHeaderTitle: {
    fontFamily: AppFonts.interBold,
    fontSize: 10,
    color: '#38BDF8',
    letterSpacing: 0.5,
  },
  consoleToggleBtn: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  consoleToggleText: {
    fontFamily: AppFonts.interMedium,
    fontSize: 9.5,
    color: '#94A3B8',
  },
  consoleLogBox: {
    maxHeight: 140,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  consoleLogContent: {
    gap: 3,
  },
  consoleLogLine: {
    fontFamily: AppFonts.interRegular,
    fontSize: 10,
    lineHeight: 14,
  },
  consoleLogPlaceholder: {
    fontFamily: AppFonts.interRegular,
    fontSize: 10,
    color: '#64748B',
    fontStyle: 'italic',
  },
  generateBtn: {
    backgroundColor: AppColors.purple,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: AppColors.purple,
    shadowOpacity: 0.25,
    shadowRadius: 4,
    shadowOffset: {width: 0, height: 2},
    elevation: 2,
  },
  generateBtnDisabled: {
    opacity: 0.7,
  },
  buildingActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  buildingStatusPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: `${AppColors.purple}14`,
    borderRadius: 10,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: `${AppColors.purple}30`,
  },
  buildingStatusPillText: {
    fontFamily: AppFonts.interBold,
    fontSize: 12,
    color: AppColors.purple,
  },
  stopBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: AppColors.errorColor,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    shadowColor: AppColors.errorColor,
    shadowOpacity: 0.25,
    shadowRadius: 4,
    shadowOffset: {width: 0, height: 2},
    elevation: 2,
  },
  stopBtnText: {
    fontFamily: AppFonts.interBold,
    fontSize: 12,
    color: AppColors.white,
  },
  ctaContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  generateBtnText: {
    fontFamily: AppFonts.interBold,
    fontSize: 12.5,
    color: AppColors.white,
  },
  footerNoteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
  },
  footerNoteText: {
    fontFamily: AppFonts.interRegular,
    fontSize: 11,
    color: AppColors.grayTextWeak,
    textAlign: 'center',
    flex: 1,
  },
});

export default DebuggingTab;
