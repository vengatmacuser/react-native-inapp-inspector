import React, {useState, useEffect} from 'react';
import {
  Dimensions,
  PixelRatio,
  Platform,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {AppColors} from '../../styles/AppColors';
import {AppFonts} from '../../styles/AppFonts';
import TouchableScale from '../TouchableScale';
import {useInspector} from './InspectorContext';
import {LIB_VERSION} from '../../constants/version';
import {
  getAppName,
  getBundleIdentifier,
  getAppVersionAndBuild,
  copyToClipboard,
  showToast,
  isLocalDebugEnvironment,
} from '../../helpers';
import {isPersistentStorageAvailable} from '../../helpers/settingsStore';
import {isReduxConnected} from '../../customHooks/reduxLogger';
import {isAnalyticsConnected} from '../../customHooks/analyticsLogger';
import {
  PackageIcon,
  GitHubIcon,
  NpmIcon,
  BoltIcon,
  CopyIcon,
  CheckIcon,
} from '../NetworkIcons';

export interface AboutModalProps {
  onClose?: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({onClose: _onClose}) => {
  const {updateAvailable, latestNpmVersion} = useInspector();
  const [copiedSpecs, setCopiedSpecs] = useState<boolean>(false);

  const handleCopySpecs = () => {
    const win = Dimensions.get('window');
    const scr = Dimensions.get('screen');
    const rnVer = (Platform.constants as any)?.reactNativeVersion;
    const specsPayload = {
      package: {
        name: 'react-native-inapp-inspector',
        version: `v${LIB_VERSION}`,
        latestNpmVersion: latestNpmVersion
          ? `v${latestNpmVersion}`
          : 'Checking...',
        license: 'MIT',
        repository:
          'https://github.com/vengatmacuser/react-native-inapp-inspector',
      },
      hostApp: {
        name: getAppName(),
        bundleId: getBundleIdentifier(),
        versionAndBuild: getAppVersionAndBuild().formatted,
        buildVariant: __DEV__
          ? 'Development (Debug)'
          : 'Production (Release)',
        metroConnected: isLocalDebugEnvironment(),
      },
      runtime: {
        reactNativeVersion: rnVer
          ? `${rnVer.major}.${rnVer.minor}.${rnVer.patch}`
          : '0.74+',
        reactVersion: React.version,
        jsEngine: Boolean((global as any)?.HermesInternal)
          ? 'Hermes'
          : 'JavaScriptCore (JSC)',
        architecture: Boolean((global as any)?.nativeFabricUIManager)
          ? 'Fabric (New Architecture)'
          : 'Paper (Legacy Bridge)',
        turboModules: Boolean(
          (global as any)?.__turboModuleProxy ||
            (global as any)?.TurboModuleRegistry,
        ),
      },
      device: {
        platform: Platform.OS,
        osVersion: Platform.Version,
        deviceModel:
          (Platform.constants as any)?.Model || 'Unknown Device',
        windowDimensions: `${Math.round(win.width)}x${Math.round(
          win.height,
        )} pt`,
        screenDimensions: `${Math.round(scr.width)}x${Math.round(
          scr.height,
        )} pt`,
        pixelRatio: PixelRatio.get(),
        fontScale: PixelRatio.getFontScale(),
        timezone:
          Intl.DateTimeFormat().resolvedOptions().timeZone || 'Unknown',
        locale:
          Intl.DateTimeFormat().resolvedOptions().locale || 'en',
      },
      storageAndCapabilities: {
        storageEngine: isPersistentStorageAvailable()
          ? 'MMKV (Fast Native Storage)'
          : 'In-Memory State',
        hasNativeModule: Boolean(
          (global as any)?.NativeInspectorModule ||
            (global as any)?.__IN_APP_INSPECTOR_NATIVE__,
        ),
        reduxConnected: isReduxConnected(),
        analyticsConnected: isAnalyticsConnected(),
      },
    };

    copyToClipboard(
      JSON.stringify(specsPayload, null, 2),
      'Diagnostic Specifications',
    );
    setCopiedSpecs(true);
    showToast('Copied full diagnostic specs to clipboard!');
    setTimeout(() => setCopiedSpecs(false), 2000);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Header Hero Branding Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroHeaderRow}>
            <View style={styles.heroBrandRow}>
              <View style={styles.heroIconBox}>
                <PackageIcon color={AppColors.purple} size={22} />
              </View>
              <View style={{flex: 1}}>
                <View style={styles.heroTitleRow}>
                  <Text style={styles.heroTitle}>In-App Inspector</Text>
                  <View style={styles.versionBadge}>
                    <Text style={styles.versionBadgeText}>v{LIB_VERSION}</Text>
                  </View>
                  {updateAvailable ? (
                    <View style={styles.updateBadge}>
                      <Text style={styles.updateBadgeText}>
                        v{latestNpmVersion} Available
                      </Text>
                      <BoltIcon size={9} color="#D97706" />
                    </View>
                  ) : (
                    <View style={styles.upToDateBadge}>
                      <Text style={styles.upToDateBadgeText}>Up to date</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.heroPackageName}>
                  react-native-inapp-inspector
                </Text>
              </View>
            </View>
          </View>

          <Text style={styles.heroDescription}>
            High-performance in-app debugging, network logging, console
            inspection, performance profiling, storage viewer & telemetry
            diagnostics for React Native.
          </Text>

          {updateAvailable && (
            <TouchableScale
              onPress={() => {
                copyToClipboard(
                  'npm install react-native-inapp-inspector@latest',
                  'Install Command',
                );
                showToast('Copied npm upgrade command!');
              }}
              style={styles.upgradeBtn}>
              <BoltIcon size={12} color={AppColors.white} />
              <Text style={styles.upgradeBtnText}>
                Copy Upgrade Command (v{latestNpmVersion})
              </Text>
            </TouchableScale>
          )}
        </View>

        {/* Quick Actions & Developer Community Grid */}
        <View style={styles.gridContainer}>
          <TouchableScale
            onPress={() => {
              Linking.openURL(
                'https://github.com/vengatmacuser/react-native-inapp-inspector',
              ).catch(() => {});
            }}
            style={[styles.gridCard, {backgroundColor: `${AppColors.purple}0F`, borderColor: `${AppColors.purple}30`}]}>
            <GitHubIcon color={AppColors.purple} size={18} />
            <View style={{flex: 1}}>
              <Text style={styles.gridCardTitle}>⭐ Star on GitHub</Text>
              <Text style={styles.gridCardSub}>Support open source</Text>
            </View>
          </TouchableScale>

          <TouchableScale
            onPress={() => {
              Linking.openURL(
                'https://www.npmjs.com/package/react-native-inapp-inspector',
              ).catch(() => {});
            }}
            style={styles.gridCard}>
            <NpmIcon color="#CB3837" size={18} />
            <View style={{flex: 1}}>
              <Text style={styles.gridCardTitle}>NPM Registry</Text>
              <Text style={styles.gridCardSub}>Package repository</Text>
            </View>
          </TouchableScale>

          <TouchableScale
            onPress={() => {
              Linking.openURL(
                'https://github.com/vengatmacuser/react-native-inapp-inspector#readme',
              ).catch(() => {});
            }}
            style={styles.gridCard}>
            <Text style={{fontSize: 16}}>📖</Text>
            <View style={{flex: 1}}>
              <Text style={styles.gridCardTitle}>Documentation</Text>
              <Text style={styles.gridCardSub}>Setup & API guide</Text>
            </View>
          </TouchableScale>

          <TouchableScale
            onPress={() => {
              Linking.openURL(
                'https://github.com/vengatmacuser/react-native-inapp-inspector/issues',
              ).catch(() => {});
            }}
            style={styles.gridCard}>
            <Text style={{fontSize: 16}}>🐞</Text>
            <View style={{flex: 1}}>
              <Text style={styles.gridCardTitle}>Report Issue</Text>
              <Text style={styles.gridCardSub}>Bugs & feature requests</Text>
            </View>
          </TouchableScale>

          <TouchableScale
            onPress={() => {
              Linking.openURL(
                'https://github.com/vengatmacuser/react-native-inapp-inspector/releases',
              ).catch(() => {});
            }}
            style={styles.gridCard}>
            <Text style={{fontSize: 16}}>🏷️</Text>
            <View style={{flex: 1}}>
              <Text style={styles.gridCardTitle}>Release Notes</Text>
              <Text style={styles.gridCardSub}>Version changelog</Text>
            </View>
          </TouchableScale>

          <TouchableScale
            onPress={handleCopySpecs}
            style={styles.gridCard}>
            {copiedSpecs ? (
              <CheckIcon color={AppColors.emerald600} size={16} />
            ) : (
              <CopyIcon color={AppColors.purple} size={16} />
            )}
            <View style={{flex: 1}}>
              <Text style={styles.gridCardTitle}>
                {copiedSpecs ? 'Specs Copied!' : 'Copy Specs JSON'}
              </Text>
              <Text style={styles.gridCardSub}>Diagnostics payload</Text>
            </View>
          </TouchableScale>
        </View>

        {/* Section: Package Version & Upgrades */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>PACKAGE VERSION & UPGRADES</Text>

          <View style={styles.versionRow}>
            <View style={styles.versionLeft}>
              <View style={styles.npmIconBox}>
                <NpmIcon color="#CB3837" size={17} />
              </View>
              <View style={{flex: 1}}>
                <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
                  <Text style={styles.versionTitle}>v{LIB_VERSION}</Text>
                  {updateAvailable ? (
                    <View style={styles.updateBadge}>
                      <Text style={styles.updateBadgeText}>
                        v{latestNpmVersion} Available
                      </Text>
                      <BoltIcon size={9} color="#D97706" />
                    </View>
                  ) : (
                    <View style={styles.upToDateBadge}>
                      <Text style={styles.upToDateBadgeText}>Up to date</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.versionSubtitle}>
                  {updateAvailable
                    ? `A newer release (v${latestNpmVersion}) is available on npm registry.`
                    : 'You are running the latest version from npm registry.'}
                </Text>
              </View>
            </View>

            <TouchableScale
              onPress={() => {
                copyToClipboard(
                  'npm install react-native-inapp-inspector@latest',
                  'Install Command',
                );
                showToast('Copied npm install command!');
              }}
              style={[
                styles.copyActionBtn,
                {
                  backgroundColor: updateAvailable
                    ? AppColors.purple
                    : `${AppColors.purple}18`,
                },
              ]}>
              <CopyIcon
                color={updateAvailable ? AppColors.white : AppColors.purple}
                size={12}
              />
              <Text
                style={[
                  styles.copyActionText,
                  {
                    color: updateAvailable
                      ? AppColors.white
                      : AppColors.purple,
                  },
                ]}>
                {updateAvailable ? 'Copy Upgrade' : 'Copy Install'}
              </Text>
            </TouchableScale>
          </View>
        </View>

        {/* Section 1: Host Application Specs */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>HOST APPLICATION & BUILD</Text>

          <View style={{gap: 8}}>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Application Name</Text>
              <Text style={styles.rowValueBold}>{getAppName()}</Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.rowLabel}>Bundle ID / Package</Text>
              <Text style={styles.rowValueRegular}>{getBundleIdentifier()}</Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.rowLabel}>Version & Build Number</Text>
              <Text style={styles.rowValueBold}>{getAppVersionAndBuild().formatted}</Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.rowLabel}>Build Variant</Text>
              <View
                style={[
                  styles.statusTag,
                  {
                    backgroundColor: __DEV__
                      ? `${AppColors.amber500}20`
                      : `${AppColors.emerald500}20`,
                    borderColor: __DEV__
                      ? `${AppColors.amber500}50`
                      : `${AppColors.emerald500}50`,
                  },
                ]}>
                <Text
                  style={[
                    styles.statusTagText,
                    {
                      color: __DEV__
                        ? AppColors.amber500
                        : AppColors.emerald600,
                    },
                  ]}>
                  {__DEV__ ? 'Development (Debug)' : 'Production (Release)'}
                </Text>
              </View>
            </View>

            <View style={styles.row}>
              <Text style={styles.rowLabel}>Metro Bundler Connection</Text>
              <Text
                style={[
                  styles.rowValueBold,
                  {
                    color: isLocalDebugEnvironment()
                      ? AppColors.emerald600
                      : AppColors.grayText,
                  },
                ]}>
                {isLocalDebugEnvironment()
                  ? 'Connected (Hot Reload Active)'
                  : 'Offline / Standalone'}
              </Text>
            </View>
          </View>
        </View>

        {/* Section 2: React Native Engine & Runtime Specs */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>FRAMEWORK & RUNTIME ENGINE</Text>

          <View style={{gap: 8}}>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>React Native Version</Text>
              <Text style={styles.rowValueBold}>
                v
                {(Platform.constants as any)?.reactNativeVersion?.major != null
                  ? `${(Platform.constants as any).reactNativeVersion.major}.${(Platform.constants as any).reactNativeVersion.minor}.${(Platform.constants as any).reactNativeVersion.patch}`
                  : '0.74+'}
              </Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.rowLabel}>React Core Version</Text>
              <Text style={styles.rowValueBold}>v{React.version}</Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.rowLabel}>JavaScript Engine</Text>
              <View
                style={[
                  styles.statusTag,
                  {
                    backgroundColor: `${AppColors.purple}15`,
                    borderColor: `${AppColors.purple}40`,
                  },
                ]}>
                <Text
                  style={[
                    styles.statusTagText,
                    {color: AppColors.purple, fontSize: 10.5},
                  ]}>
                  {Boolean((global as any)?.HermesInternal)
                    ? 'Hermes Engine (Active)'
                    : 'JavaScriptCore (JSC)'}
                </Text>
              </View>
            </View>

            <View style={styles.row}>
              <Text style={styles.rowLabel}>Rendering Architecture</Text>
              <Text style={styles.rowValueBold}>
                {Boolean((global as any)?.nativeFabricUIManager)
                  ? 'Fabric (New Architecture)'
                  : 'Paper (Legacy Bridge)'}
              </Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.rowLabel}>TurboModules Support</Text>
              <Text style={styles.rowValueBold}>
                {Boolean(
                  (global as any)?.__turboModuleProxy ||
                    (global as any)?.TurboModuleRegistry,
                )
                  ? 'Enabled (C++ JSI)'
                  : 'Standard Bridge'}
              </Text>
            </View>
          </View>
        </View>

        {/* Section 3: Device & Display Metrics */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>DEVICE & DISPLAY METRICS</Text>

          <View style={{gap: 8}}>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Operating System</Text>
              <Text style={styles.rowValueBold}>
                {Platform.OS === 'ios'
                  ? 'Apple iOS'
                  : Platform.OS === 'android'
                  ? 'Google Android'
                  : Platform.OS}{' '}
                {Platform.Version}
              </Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.rowLabel}>Device Hardware Model</Text>
              <Text style={styles.rowValueBold}>
                {(Platform.constants as any)?.Model ||
                  (Platform.OS === 'ios' ? 'Apple Device' : 'Android Device')}
              </Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.rowLabel}>Window Viewport (Points)</Text>
              <Text style={styles.rowValueBold}>
                {Math.round(Dimensions.get('window').width)} ×{' '}
                {Math.round(Dimensions.get('window').height)} pt
              </Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.rowLabel}>Native Physical Resolution</Text>
              <Text style={styles.rowValueBold}>
                {Math.round(Dimensions.get('screen').width * PixelRatio.get())}{' '}
                ×{' '}
                {Math.round(Dimensions.get('screen').height * PixelRatio.get())}{' '}
                px
              </Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.rowLabel}>Pixel Density & Font Scale</Text>
              <Text style={styles.rowValueBold}>
                {PixelRatio.get().toFixed(1)}x (
                {PixelRatio.get() >= 3
                  ? '@3x'
                  : PixelRatio.get() >= 2
                  ? '@2x'
                  : '@1x'}
                ) • Font: {PixelRatio.getFontScale().toFixed(2)}x
              </Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.rowLabel}>Timezone & Locale</Text>
              <Text style={styles.rowValueBold}>
                {Intl.DateTimeFormat().resolvedOptions().timeZone || 'System'}{' '}
                ({Intl.DateTimeFormat().resolvedOptions().locale || 'en'})
              </Text>
            </View>
          </View>
        </View>

        {/* Section 4: Inspector Capabilities & Storage */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>INSPECTOR STORAGE & CAPABILITIES</Text>

          <View style={{gap: 8}}>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Storage Persistence Engine</Text>
              <View
                style={[
                  styles.statusTag,
                  {
                    backgroundColor: isPersistentStorageAvailable()
                      ? `${AppColors.emerald500}18`
                      : `${AppColors.amber500}18`,
                    borderColor: isPersistentStorageAvailable()
                      ? `${AppColors.emerald500}50`
                      : `${AppColors.amber500}50`,
                  },
                ]}>
                <Text
                  style={[
                    styles.statusTagText,
                    {
                      color: isPersistentStorageAvailable()
                        ? AppColors.emerald600
                        : AppColors.amber500,
                    },
                  ]}>
                  {isPersistentStorageAvailable()
                    ? 'MMKV Fast Native Storage'
                    : 'In-Memory State'}
                </Text>
              </View>
            </View>

            <View style={styles.row}>
              <Text style={styles.rowLabel}>Native Module Status</Text>
              <Text
                style={[
                  styles.rowValueBold,
                  {
                    color: Boolean((global as any)?.NativeInspectorModule)
                      ? AppColors.emerald600
                      : AppColors.grayText,
                  },
                ]}>
                {Boolean((global as any)?.NativeInspectorModule)
                  ? 'Linked & Active'
                  : 'JavaScript Only'}
              </Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.rowLabel}>Network Logger Interceptor</Text>
              <Text
                style={[
                  styles.rowValueBold,
                  {color: AppColors.emerald600},
                ]}>
                Active (XMLHttpRequest & Fetch Hooked)
              </Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.rowLabel}>Redux & Analytics Watchers</Text>
              <Text style={styles.rowValueBold}>
                Redux: {isReduxConnected() ? 'Connected' : 'Listening'} •
                Analytics: {isAnalyticsConnected() ? 'Connected' : 'Listening'}
              </Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.rowLabel}>Crash & Exception Boundary</Text>
              <Text
                style={[
                  styles.rowValueBold,
                  {color: AppColors.emerald600},
                ]}>
                Global JS Exception Handler Active
              </Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.rowLabel}>Memory Management</Text>
              <Text
                style={[
                  styles.rowValueBold,
                  {color: AppColors.emerald600},
                ]}>
                Dynamic Auto RAM Tiering Active
              </Text>
            </View>
          </View>
        </View>

        {/* Section 5: License & Copyright */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>LICENSE & CREDITS</Text>

          <View style={styles.row}>
            <Text style={styles.rowLabel}>License</Text>
            <Text style={[styles.rowValueBold, {color: AppColors.emerald600}]}>
              MIT Permissive Open Source
            </Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.rowLabel}>Created & Maintained By</Text>
            <Text style={styles.rowValueBold}>Vengateswaran</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.rowLabel}>Repository</Text>
            <Text style={[styles.rowValueRegular, {color: AppColors.purple}]}>
              github.com/vengatmacuser/react-native-inapp-inspector
            </Text>
          </View>
        </View>

        <View style={{height: 48}} />
      </ScrollView>
    </View>
  );
};

export default AboutModal;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.grayBackground,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 14,
  },
  heroCard: {
    backgroundColor: AppColors.primaryLight,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: AppColors.grayBorderSecondary,
    padding: 16,
    gap: 12,
  },
  heroHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  heroIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: `${AppColors.purple}1A`,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: `${AppColors.purple}33`,
  },
  heroTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  heroTitle: {
    fontFamily: AppFonts.interBold,
    fontSize: 15,
    lineHeight: 20,
    color: AppColors.primaryBlack,
  },
  versionBadge: {
    backgroundColor: `${AppColors.purple}18`,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: `${AppColors.purple}33`,
  },
  versionBadgeText: {
    fontFamily: AppFonts.interBold,
    fontSize: 10,
    color: AppColors.purple,
  },
  updateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#F59E0B20',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#F59E0B60',
  },
  updateBadgeText: {
    fontFamily: AppFonts.interBold,
    fontSize: 9.5,
    color: '#D97706',
  },
  upToDateBadge: {
    backgroundColor: `${AppColors.emerald500}20`,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: `${AppColors.emerald500}50`,
  },
  upToDateBadgeText: {
    fontFamily: AppFonts.interBold,
    fontSize: 9.5,
    color: AppColors.emerald600,
  },
  heroPackageName: {
    fontFamily: AppFonts.interRegular,
    fontSize: 11,
    lineHeight: 15,
    color: AppColors.grayText,
    marginTop: 2,
  },
  heroDescription: {
    fontFamily: AppFonts.interRegular,
    fontSize: 11.5,
    lineHeight: 16,
    color: AppColors.grayText,
  },
  upgradeBtn: {
    backgroundColor: AppColors.purple,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  upgradeBtnText: {
    fontFamily: AppFonts.interBold,
    fontSize: 12,
    color: AppColors.white,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  gridCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: AppColors.primaryLight,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AppColors.grayBorderSecondary,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  gridCardTitle: {
    fontFamily: AppFonts.interBold,
    fontSize: 11.5,
    color: AppColors.primaryBlack,
  },
  gridCardSub: {
    fontFamily: AppFonts.interRegular,
    fontSize: 9.5,
    color: AppColors.grayText,
  },
  sectionCard: {
    backgroundColor: AppColors.primaryLight,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: AppColors.grayBorderSecondary,
    padding: 14,
    gap: 10,
  },
  sectionHeader: {
    fontFamily: AppFonts.interBold,
    fontSize: 11,
    lineHeight: 14,
    color: AppColors.grayTextWeak,
    letterSpacing: 0.8,
  },
  versionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  versionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 8,
  },
  npmIconBox: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: '#CB383715',
    alignItems: 'center',
    justifyContent: 'center',
  },
  versionTitle: {
    fontFamily: AppFonts.interBold,
    fontSize: 14,
    lineHeight: 18,
    color: AppColors.primaryBlack,
  },
  versionSubtitle: {
    fontFamily: AppFonts.interRegular,
    fontSize: 11,
    lineHeight: 15,
    color: AppColors.grayText,
    marginTop: 1,
  },
  copyActionBtn: {
    paddingVertical: 7,
    paddingHorizontal: 11,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  copyActionText: {
    fontFamily: AppFonts.interBold,
    fontSize: 11,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowLabel: {
    fontFamily: AppFonts.interRegular,
    fontSize: 11.5,
    color: AppColors.grayText,
  },
  rowValueBold: {
    fontFamily: AppFonts.interBold,
    fontSize: 11.5,
    color: AppColors.primaryBlack,
  },
  rowValueRegular: {
    fontFamily: AppFonts.interRegular,
    fontSize: 11,
    color: AppColors.primaryBlack,
  },
  statusTag: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 5,
    borderWidth: 1,
  },
  statusTagText: {
    fontFamily: AppFonts.interBold,
    fontSize: 10,
  },
});
