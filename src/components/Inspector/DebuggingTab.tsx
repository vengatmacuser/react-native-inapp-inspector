import React, {useState, useEffect, useMemo, useCallback} from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  NativeModules,
  Platform,
  Share,
} from 'react-native';
import {useInspector} from './InspectorContext';
import {AppColors} from '../../styles/AppColors';
import {AppFonts} from '../../styles/AppFonts';
import QRCodeView from '../QRCodeView';
import TouchableScale from '../TouchableScale';
import CopyButton from '../CopyButton';
import {copyToClipboard} from '../../helpers';
import {showToast} from '../../helpers/toast';
import {useTranslation} from '../../i18n';
import {
  BoltIcon,
  GlobeIcon,
  ClockIcon,
  CircleCheckIcon,
  CircleXIcon,
  SmartphoneIcon,
  PackageIcon,
  TerminalIcon,
  ExternalLinkIcon,
  RepeatIcon,
  ShieldAlertIcon,
  InfoCircleIcon,
} from '../NetworkIcons';

interface PortStatus {
  port: number;
  status: 'checking' | 'active' | 'inactive';
  latencyMs?: number;
}

const COMMON_PORTS = [8081, 8082, 8083, 19000];

export const DebuggingTab: React.FC = () => {
  const {t} = useTranslation();

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
    // If localhost or 127.0.0.1 or 10.0.2.2, default to 192.168.1.1 or detected host
    if (
      detectedConfig.host === 'localhost' ||
      detectedConfig.host === '127.0.0.1' ||
      detectedConfig.host === '10.0.2.2'
    ) {
      return '192.168.1.15';
    }
    return detectedConfig.host;
  });

  const [selectedPort, setSelectedPort] = useState<number>(detectedConfig.port);
  const [apkPath, setApkPath] = useState<string>('app-debug.apk');
  const [activeQrTab, setActiveQrTab] = useState<'metro' | 'apk' | 'host'>('metro');
  const [isAutoDetecting, setIsAutoDetecting] = useState<boolean>(false);
  const [portsStatus, setPortsStatus] = useState<Record<number, PortStatus>>({});

  // Auto-probe ports on mount
  const probePorts = useCallback(async () => {
    setIsAutoDetecting(true);
    const results: Record<number, PortStatus> = {};

    for (const p of COMMON_PORTS) {
      results[p] = {port: p, status: 'checking'};
    }
    setPortsStatus({...results});

    let foundActivePort: number | null = null;

    for (const p of COMMON_PORTS) {
      const startTime = Date.now();
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1500);
        // Ping /status endpoint of Metro Bundler
        const res = await fetch(`http://localhost:${p}/status`, {
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        const text = await res.text();
        const latency = Date.now() - startTime;

        if (res.ok && text.includes('packager-status:running')) {
          results[p] = {port: p, status: 'active', latencyMs: latency};
          if (!foundActivePort) foundActivePort = p;
        } else {
          results[p] = {port: p, status: 'inactive'};
        }
      } catch {
        results[p] = {port: p, status: 'inactive'};
      }
      setPortsStatus({...results});
    }

    if (foundActivePort) {
      setSelectedPort(foundActivePort);
      showToast(`Detected Metro running on Port ${foundActivePort}!`);
    }

    setIsAutoDetecting(false);
  }, []);

  useEffect(() => {
    probePorts();
  }, [probePorts]);

  // Construct target URLs for QR codes
  const metroBundleUrl = `http://${hostIp}:${selectedPort}/index.bundle?platform=android&dev=true`;
  const directServerUrl = `http://${hostIp}:${selectedPort}`;
  const apkDownloadUrl = `http://${hostIp}:${selectedPort}/${apkPath}`;
  const devSettingsHost = `${hostIp}:${selectedPort}`;

  const currentQrValue = useMemo(() => {
    if (activeQrTab === 'apk') return apkDownloadUrl;
    if (activeQrTab === 'host') return devSettingsHost;
    return directServerUrl;
  }, [activeQrTab, apkDownloadUrl, devSettingsHost, directServerUrl]);

  const activePortInfo = portsStatus[selectedPort];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}>
      {/* ─── Top Live Server Status Banner ────────────────────────────── */}
      <View style={styles.serverCard}>
        <View style={styles.serverCardTop}>
          <View style={styles.serverStatusLeft}>
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor:
                    activePortInfo?.status === 'active'
                      ? AppColors.greenColor
                      : activePortInfo?.status === 'checking'
                      ? AppColors.warningIconGold
                      : AppColors.errorColor,
                },
              ]}
            />
            <View>
              <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
                <Text style={styles.serverTitle}>Metro Dev Server</Text>
                <View style={styles.portPill}>
                  <Text style={styles.portPillText}>Port {selectedPort}</Text>
                </View>
              </View>
              <Text style={styles.serverSubtitle}>
                {activePortInfo?.status === 'active'
                  ? `Active & Bundling (${activePortInfo.latencyMs}ms)`
                  : activePortInfo?.status === 'checking'
                  ? 'Probing Metro Ports...'
                  : 'Standby / Select active port'}
              </Text>
            </View>
          </View>

          <TouchableScale
            onPress={probePorts}
            style={styles.scanBtn}
            hitSlop={8}>
            <RepeatIcon size={12} color={AppColors.purple} />
            <Text style={styles.scanBtnText}>Re-scan</Text>
          </TouchableScale>
        </View>

        {/* Port Selector Chips */}
        <View style={styles.portsRow}>
          {COMMON_PORTS.map(p => {
            const isSelected = selectedPort === p;
            const pInfo = portsStatus[p];
            const isActive = pInfo?.status === 'active';
            return (
              <TouchableOpacity
                key={p}
                activeOpacity={0.7}
                onPress={() => setSelectedPort(p)}
                style={[
                  styles.portChip,
                  isSelected && styles.portChipSelected,
                  isActive && {borderColor: AppColors.greenColor},
                ]}>
                <View
                  style={[
                    styles.portMiniDot,
                    {
                      backgroundColor: isActive
                        ? AppColors.greenColor
                        : AppColors.grayTextWeak,
                    },
                  ]}
                />
                <Text
                  style={[
                    styles.portChipText,
                    isSelected && styles.portChipTextSelected,
                  ]}>
                  {p}
                </Text>
                {isActive && (
                  <View style={styles.liveBadge}>
                    <Text style={styles.liveBadgeText}>LIVE</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* ─── Host IP Configuration Card ───────────────────────────────── */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>HOST IP & BUNDLE LOCATION</Text>
          <TouchableOpacity
            onPress={() => {
              if (
                detectedConfig.host !== 'localhost' &&
                detectedConfig.host !== '127.0.0.1' &&
                detectedConfig.host !== '10.0.2.2'
              ) {
                setHostIp(detectedConfig.host);
                showToast(`Reset to detected IP: ${detectedConfig.host}`);
              }
            }}>
            <Text style={styles.headerActionText}>Reset to Detected</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputPrefix}>http://</Text>
          <TextInput
            style={styles.input}
            value={hostIp}
            onChangeText={setHostIp}
            placeholder="192.168.1.15"
            placeholderTextColor={AppColors.grayTextWeak}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Text style={styles.inputSuffix}>:{selectedPort}</Text>
        </View>
        <View style={{flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6}}>
          <InfoCircleIcon size={13} color={AppColors.grayTextWeak} />
          <Text style={[styles.inputHint, {marginTop: 0, flex: 1}]}>
            Ensure your physical Android device and Mac are connected to the same Wi-Fi network.
          </Text>
        </View>
      </View>

      {/* ─── Interactive QR Code Generator Card ──────────────────────── */}
      <View style={styles.qrCard}>
        {/* Mode Selector Tabs */}
        <View style={styles.qrTabsRow}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setActiveQrTab('metro')}
            style={[
              styles.qrTab,
              activeQrTab === 'metro' && styles.qrTabActive,
            ]}>
            <BoltIcon
              size={13}
              color={activeQrTab === 'metro' ? AppColors.white : AppColors.grayText}
            />
            <Text
              style={[
                styles.qrTabText,
                activeQrTab === 'metro' && styles.qrTabTextActive,
              ]}>
              Metro Live Reload
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setActiveQrTab('apk')}
            style={[
              styles.qrTab,
              activeQrTab === 'apk' && styles.qrTabActive,
            ]}>
            <PackageIcon
              size={13}
              color={activeQrTab === 'apk' ? AppColors.white : AppColors.grayText}
            />
            <Text
              style={[
                styles.qrTabText,
                activeQrTab === 'apk' && styles.qrTabTextActive,
              ]}>
              Install Debug APK
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setActiveQrTab('host')}
            style={[
              styles.qrTab,
              activeQrTab === 'host' && styles.qrTabActive,
            ]}>
            <SmartphoneIcon
              size={13}
              color={activeQrTab === 'host' ? AppColors.white : AppColors.grayText}
            />
            <Text
              style={[
                styles.qrTabText,
                activeQrTab === 'host' && styles.qrTabTextActive,
              ]}>
              Dev Host Info
            </Text>
          </TouchableOpacity>
        </View>

        {/* QR Code Container */}
        <View style={styles.qrWrapper}>
          <QRCodeView
            value={currentQrValue}
            size={190}
            color={AppColors.primaryBlack}
            backgroundColor={AppColors.white}
          />

          <View style={styles.qrInfoBox}>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 2}}>
              {activeQrTab === 'apk' ? (
                <PackageIcon size={14} color={AppColors.purple} />
              ) : activeQrTab === 'host' ? (
                <SmartphoneIcon size={14} color={AppColors.purple} />
              ) : (
                <BoltIcon size={14} color={AppColors.amber500} />
              )}
              <Text style={styles.qrTargetTitle}>
                {activeQrTab === 'apk'
                  ? 'Direct APK Download URL'
                  : activeQrTab === 'host'
                  ? 'Dev Settings Bundle Host'
                  : 'Live Metro Fast-Refresh Endpoint'}
              </Text>
            </View>
            <Text style={styles.qrTargetUrl} numberOfLines={2} ellipsizeMode="middle">
              {currentQrValue}
            </Text>
          </View>
        </View>

        {/* Quick Action Row */}
        <View style={styles.qrActionsRow}>
          <TouchableScale
            onPress={() => copyToClipboard(currentQrValue, 'QR Link')}
            style={styles.actionBtn}>
            <Text style={styles.actionBtnText}>Copy Link</Text>
          </TouchableScale>

          <TouchableScale
            onPress={() => {
              Share.share({
                message: currentQrValue,
                title: 'Metro Debug Link',
              });
            }}
            style={[styles.actionBtn, styles.actionBtnPrimary]}>
            <Text style={styles.actionBtnPrimaryText}>Share to Device</Text>
          </TouchableScale>
        </View>
      </View>

      {/* ─── Bare React Native Multi-Device Setup Guide ───────────────── */}
      <View style={styles.guideCard}>
        <View style={{flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12}}>
          <SmartphoneIcon size={15} color={AppColors.primaryLight} />
          <Text style={[styles.guideHeading, {marginBottom: 0}]}>HOW TO CONNECT ANDROID DEVICE:</Text>
        </View>

        <View style={styles.stepRow}>
          <View style={styles.stepNumberBadge}>
            <Text style={styles.stepNumberText}>1</Text>
          </View>
          <View style={{flex: 1}}>
            <Text style={styles.stepTitle}>Connect to Same Wi-Fi</Text>
            <Text style={styles.stepDesc}>
              Make sure your Android phone is connected to the same Wi-Fi router or Mac Mobile Hotspot.
            </Text>
          </View>
        </View>

        <View style={styles.stepRow}>
          <View style={styles.stepNumberBadge}>
            <Text style={styles.stepNumberText}>2</Text>
          </View>
          <View style={{flex: 1}}>
            <Text style={styles.stepTitle}>Scan to Install / Connect</Text>
            <Text style={styles.stepDesc}>
              Open Android Camera or browser, scan the QR code above to download the APK or connect Metro.
            </Text>
          </View>
        </View>

        <View style={styles.stepRow}>
          <View style={styles.stepNumberBadge}>
            <Text style={styles.stepNumberText}>3</Text>
          </View>
          <View style={{flex: 1}}>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 4}}>
              <Text style={styles.stepTitle}>Simultaneous Live Fast-Refresh</Text>
              <BoltIcon size={13} color={AppColors.amber500} />
            </View>
            <Text style={styles.stepDesc}>
              Any changes saved in VS Code will immediately update <Text style={{fontWeight: '700'}}>both the iOS Simulator and physical Android phone</Text> in real-time!
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.contentBg,
  },
  content: {
    padding: 12,
    gap: 12,
    paddingBottom: 40,
  },
  serverCard: {
    backgroundColor: AppColors.primaryLight,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: AppColors.grayBorderSecondary,
    shadowColor: AppColors.black,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    gap: 12,
  },
  serverCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  serverStatusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  serverTitle: {
    fontFamily: AppFonts.interBold,
    fontSize: 15,
    color: AppColors.primaryBlack,
  },
  serverSubtitle: {
    fontFamily: AppFonts.interMedium,
    fontSize: 11,
    color: AppColors.grayText,
    marginTop: 2,
  },
  portPill: {
    backgroundColor: `${AppColors.purple}18`,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  portPillText: {
    fontFamily: AppFonts.interBold,
    fontSize: 10,
    color: AppColors.purple,
  },
  scanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: `${AppColors.purple}14`,
    borderWidth: 1,
    borderColor: `${AppColors.purple}30`,
  },
  scanBtnText: {
    fontFamily: AppFonts.interBold,
    fontSize: 11,
    color: AppColors.purple,
  },
  portsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  portChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: AppColors.grayBackground,
    borderWidth: 1,
    borderColor: AppColors.grayBorderSecondary,
  },
  portChipSelected: {
    backgroundColor: `${AppColors.purple}18`,
    borderColor: AppColors.purple,
  },
  portMiniDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  portChipText: {
    fontFamily: AppFonts.interBold,
    fontSize: 11,
    color: AppColors.grayTextStrong,
  },
  portChipTextSelected: {
    color: AppColors.purple,
  },
  liveBadge: {
    backgroundColor: AppColors.greenColor,
    paddingHorizontal: 3,
    paddingVertical: 0.5,
    borderRadius: 3,
  },
  liveBadgeText: {
    fontFamily: AppFonts.interBold,
    fontSize: 7.5,
    color: AppColors.white,
  },
  card: {
    backgroundColor: AppColors.primaryLight,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: AppColors.grayBorderSecondary,
    shadowColor: AppColors.black,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    gap: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontFamily: AppFonts.interBold,
    fontSize: 11,
    color: AppColors.grayTextWeak,
    letterSpacing: 0.6,
  },
  headerActionText: {
    fontFamily: AppFonts.interBold,
    fontSize: 11,
    color: AppColors.purple,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.grayBackground,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: AppColors.grayBorderSecondary,
    paddingHorizontal: 10,
    height: 40,
  },
  inputPrefix: {
    fontFamily: AppFonts.interMedium,
    fontSize: 12.5,
    color: AppColors.grayTextWeak,
  },
  input: {
    flex: 1,
    fontFamily: AppFonts.interBold,
    fontSize: 13,
    color: AppColors.primaryBlack,
    paddingVertical: 0,
  },
  inputSuffix: {
    fontFamily: AppFonts.interBold,
    fontSize: 12.5,
    color: AppColors.purple,
  },
  inputHint: {
    fontFamily: AppFonts.interRegular,
    fontSize: 11,
    color: AppColors.grayTextWeak,
    lineHeight: 15,
  },
  qrCard: {
    backgroundColor: AppColors.primaryLight,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: AppColors.grayBorderSecondary,
    shadowColor: AppColors.black,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    alignItems: 'center',
    gap: 14,
  },
  qrTabsRow: {
    flexDirection: 'row',
    backgroundColor: AppColors.grayBackground,
    borderRadius: 10,
    padding: 3,
    width: '100%',
    gap: 4,
  },
  qrTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 7,
    borderRadius: 8,
  },
  qrTabActive: {
    backgroundColor: AppColors.purple,
  },
  qrTabText: {
    fontFamily: AppFonts.interMedium,
    fontSize: 11,
    color: AppColors.grayText,
  },
  qrTabTextActive: {
    color: AppColors.white,
    fontFamily: AppFonts.interBold,
  },
  qrWrapper: {
    alignItems: 'center',
    gap: 12,
  },
  qrInfoBox: {
    alignItems: 'center',
    maxWidth: 280,
    gap: 2,
  },
  qrTargetTitle: {
    fontFamily: AppFonts.interBold,
    fontSize: 11.5,
    color: AppColors.primaryBlack,
  },
  qrTargetUrl: {
    fontFamily: AppFonts.interRegular,
    fontSize: 10.5,
    color: AppColors.skyBlue,
    textAlign: 'center',
  },
  qrActionsRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: AppColors.grayBorderSecondary,
    backgroundColor: AppColors.grayBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnText: {
    fontFamily: AppFonts.interBold,
    fontSize: 12,
    color: AppColors.grayTextStrong,
  },
  actionBtnPrimary: {
    backgroundColor: AppColors.purple,
    borderColor: AppColors.purple,
  },
  actionBtnPrimaryText: {
    fontFamily: AppFonts.interBold,
    fontSize: 12,
    color: AppColors.white,
  },
  guideCard: {
    backgroundColor: AppColors.primaryLight,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: AppColors.grayBorderSecondary,
    gap: 10,
  },
  guideHeading: {
    fontFamily: AppFonts.interBold,
    fontSize: 11,
    color: AppColors.grayTextWeak,
    letterSpacing: 0.6,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  stepNumberBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: `${AppColors.purple}18`,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  stepNumberText: {
    fontFamily: AppFonts.interBold,
    fontSize: 11,
    color: AppColors.purple,
  },
  stepTitle: {
    fontFamily: AppFonts.interBold,
    fontSize: 12.5,
    color: AppColors.primaryBlack,
  },
  stepDesc: {
    fontFamily: AppFonts.interRegular,
    fontSize: 11,
    color: AppColors.grayText,
    lineHeight: 16,
    marginTop: 1,
  },
});

export default DebuggingTab;
