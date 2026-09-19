import React from 'react';
import {
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
import {t} from '../../i18n';
import {LIB_VERSION} from '../../constants/version';
import AppHeaderLogo from '../AppHeaderLogo';
import {
  getAppName,
  getBundleIdentifier,
  getAppVersionAndBuild,
  copyToClipboard,
  showToast,
} from '../../helpers';
import {
  PackageIcon,
  GitHubIcon,
  NpmIcon,
  BoltIcon,
  StarIcon,
  BookOpenIcon,
  BugIcon,
  TagIcon,
  WifiIcon,
  TerminalIcon,
  AnalyticsIcon,
  DatabaseIcon,
  CameraIcon,
  CrashIcon,
  ExternalLinkIcon,
  CopyIcon,
} from '../NetworkIcons';

export interface AboutModalProps {
  onClose?: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({onClose: _onClose}) => {
  const {updateAvailable, latestNpmVersion} = useInspector();

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
              <AppHeaderLogo size={46} shape="circle" />
              <View style={{flex: 1}}>
                <View style={styles.heroTitleRow}>
                  <Text style={styles.heroTitle}>{t('about.heroTitle', 'In-App Inspector')}</Text>
                  <View style={styles.versionBadge}>
                    <Text style={styles.versionBadgeText}>v{LIB_VERSION}</Text>
                  </View>
                  {updateAvailable ? (
                    <View style={styles.updateBadge}>
                      <Text style={styles.updateBadgeText}>
                        {t('about.versionAvailable', 'v{{version}} Available').replace('{{version}}', latestNpmVersion || '')}
                      </Text>
                      <BoltIcon size={9} color={AppColors.amber600} />
                    </View>
                  ) : (
                    <View style={styles.upToDateBadge}>
                      <Text style={styles.upToDateBadgeText}>{t('about.upToDate', 'Up to date')}</Text>
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
            {t('about.heroDescription', 'The all-in-one on-device debugging, logging, and QA companion for React Native & Expo applications. Designed for developers, QA testers, and product teams.')}
          </Text>

          {updateAvailable && (
            <TouchableScale
              onPress={() => {
                copyToClipboard(
                  'npm install react-native-inapp-inspector@latest',
                  'Install Command',
                );
                showToast(t('about.copiedUpgradeCommand', 'Copied npm upgrade command!'));
              }}
              style={styles.upgradeBtn}>
              <BoltIcon size={12} color={AppColors.white} />
              <Text style={styles.upgradeBtnText}>
                {t('about.copyUpgradeCommand', 'Copy Upgrade Command (v{{version}})').replace('{{version}}', latestNpmVersion || '')}
              </Text>
            </TouchableScale>
          )}
        </View>

        {/* Section: Application Outline */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>{t('about.appInformation', 'APP INFORMATION')}</Text>

          <View style={{gap: 8}}>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>{t('about.appName', 'App Name')}</Text>
              <Text style={styles.rowValueBold}>{getAppName()}</Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.rowLabel}>{t('about.packageIdentifier', 'Package Identifier')}</Text>
              <Text style={styles.rowValueRegular}>{getBundleIdentifier()}</Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.rowLabel}>{t('about.appVersion', 'App Version')}</Text>
              <Text style={styles.rowValueBold}>
                {getAppVersionAndBuild().formatted}
              </Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.rowLabel}>{t('about.environment', 'Environment')}</Text>
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
                        ? AppColors.amber600
                        : AppColors.emerald600,
                    },
                  ]}>
                  {__DEV__ ? t('about.developmentDebug', 'Development (Debug)') : t('about.productionRelease', 'Production (Release)')}
                </Text>
              </View>
            </View>

            <View style={styles.row}>
              <Text style={styles.rowLabel}>{t('about.platform', 'Platform')}</Text>
              <Text style={styles.rowValueRegular}>
                {Platform.OS === 'ios' ? t('about.appleIos', 'Apple iOS') : t('about.googleAndroid', 'Google Android')}{' '}
                (v{Platform.Version})
              </Text>
            </View>
          </View>
        </View>

        {/* Section: Features & Capabilities Outline */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>{t('about.features', 'WHAT IN-APP INSPECTOR DOES')}</Text>

          <View style={styles.featuresList}>
            <View style={styles.featureItem}>
              <View
                style={[
                  styles.featureIconBox,
                  {backgroundColor: `${AppColors.brandPurple}15`},
                ]}>
                <WifiIcon color={AppColors.brandPurple} size={18} />
              </View>
              <View style={styles.featureTextBox}>
                <Text style={styles.featureTitle}>{t('about.featureNetwork', 'Network Traffic Monitor')}</Text>
                <Text style={styles.featureDesc}>
                  {t('about.featureNetworkDesc', 'Inspect HTTP and HTTPS API requests, responses, headers, and server latency with waterfall timing charts.')}
                </Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <View
                style={[
                  styles.featureIconBox,
                  {backgroundColor: `${AppColors.blue500}15`},
                ]}>
                <TerminalIcon color={AppColors.blue500} size={18} />
              </View>
              <View style={styles.featureTextBox}>
                <Text style={styles.featureTitle}>{t('about.featureConsole', 'Console Logger')}</Text>
                <Text style={styles.featureDesc}>
                  {t('about.featureConsoleDesc', 'View real-time console logs, warnings, and errors with source file origins and formatted stack traces.')}
                </Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <View
                style={[
                  styles.featureIconBox,
                  {backgroundColor: `${AppColors.firebaseOrange}15`},
                ]}>
                <AnalyticsIcon color={AppColors.firebaseOrange} size={18} />
              </View>
              <View style={styles.featureTextBox}>
                <Text style={styles.featureTitle}>{t('about.featureAnalytics', 'Analytics Telemetry')}</Text>
                <Text style={styles.featureDesc}>
                  {t('about.featureAnalyticsDesc', 'Track Firebase and custom analytics events, screen views, and user properties live on the device.')}
                </Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <View
                style={[
                  styles.featureIconBox,
                  {backgroundColor: `${AppColors.violet600}15`},
                ]}>
                <DatabaseIcon color={AppColors.violet600} size={18} />
              </View>
              <View style={styles.featureTextBox}>
                <Text style={styles.featureTitle}>{t('about.featureRedux', 'Redux State & Actions')}</Text>
                <Text style={styles.featureDesc}>
                  {t('about.featureReduxDesc', 'Inspect dispatched actions, payloads, and state tree diffs without connecting desktop companion tools.')}
                </Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <View
                style={[
                  styles.featureIconBox,
                  {backgroundColor: `${AppColors.teal600}15`},
                ]}>
                <CameraIcon color={AppColors.teal600} size={18} />
              </View>
              <View style={styles.featureTextBox}>
                <Text style={styles.featureTitle}>{t('about.featureCapture', 'Screen & Video Capture')}</Text>
                <Text style={styles.featureDesc}>
                  {t('about.featureCaptureDesc', 'Take screenshots and record test sessions to share with QA and engineering teams instantly.')}
                </Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <View
                style={[
                  styles.featureIconBox,
                  {backgroundColor: `${AppColors.emerald600}15`},
                ]}>
                <CrashIcon color={AppColors.emerald600} size={18} />
              </View>
              <View style={styles.featureTextBox}>
                <Text style={styles.featureTitle}>
                  {t('about.featureCrash', 'Crash Catcher & Diagnostics')}
                </Text>
                <Text style={styles.featureDesc}>
                  {t('about.featureCrashDesc', 'Protects against native crashes and provides device health metrics including RAM, battery, and storage.')}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Quick Links & Resources */}
        <View style={styles.gridContainer}>
          <TouchableScale
            onPress={() => {
              Linking.openURL(
                'https://github.com/vengatmacuser/react-native-inapp-inspector',
              ).catch(() => {});
            }}
            style={[
              styles.gridCard,
              {
                backgroundColor: `${AppColors.brandPurple}0F`,
                borderColor: `${AppColors.brandPurple}30`,
              },
            ]}>
            <GitHubIcon color={AppColors.brandPurple} size={18} />
            <View style={{flex: 1}}>
              <View
                style={{flexDirection: 'row', alignItems: 'center', gap: 5}}>
                <StarIcon color={AppColors.amber500} size={13} />
                <Text style={styles.gridCardTitle}>{t('about.github', 'GitHub')}</Text>
              </View>
              <Text style={styles.gridCardSub}>{t('about.githubSub', 'Star & source code')}</Text>
            </View>
            <ExternalLinkIcon size={12} color={AppColors.grayTextWeak} />
          </TouchableScale>

          <TouchableScale
            onPress={() => {
              Linking.openURL(
                'https://www.npmjs.com/package/react-native-inapp-inspector',
              ).catch(() => {});
            }}
            style={styles.gridCard}>
            <NpmIcon color={AppColors.npmRed} size={18} />
            <View style={{flex: 1}}>
              <Text style={styles.gridCardTitle}>{t('about.npmRegistry', 'NPM Registry')}</Text>
              <Text style={styles.gridCardSub}>{t('about.npmRegistrySub', 'Package updates')}</Text>
            </View>
            <ExternalLinkIcon size={12} color={AppColors.grayTextWeak} />
          </TouchableScale>

          <TouchableScale
            onPress={() => {
              Linking.openURL(
                'https://github.com/vengatmacuser/react-native-inapp-inspector#readme',
              ).catch(() => {});
            }}
            style={styles.gridCard}>
            <BookOpenIcon color={AppColors.brandPurple} size={18} />
            <View style={{flex: 1}}>
              <Text style={styles.gridCardTitle}>{t('about.documentation', 'Documentation')}</Text>
              <Text style={styles.gridCardSub}>{t('about.documentationSub', 'Integration guide')}</Text>
            </View>
            <ExternalLinkIcon size={12} color={AppColors.grayTextWeak} />
          </TouchableScale>

          <TouchableScale
            onPress={() => {
              Linking.openURL(
                'https://github.com/vengatmacuser/react-native-inapp-inspector/issues',
              ).catch(() => {});
            }}
            style={styles.gridCard}>
            <BugIcon color={AppColors.errorColor} size={18} />
            <View style={{flex: 1}}>
              <Text style={styles.gridCardTitle}>{t('about.reportIssue', 'Report Issue')}</Text>
              <Text style={styles.gridCardSub}>{t('about.reportIssueSub', 'Help & support')}</Text>
            </View>
            <ExternalLinkIcon size={12} color={AppColors.grayTextWeak} />
          </TouchableScale>

          <TouchableScale
            onPress={() => {
              Linking.openURL(
                'https://github.com/vengatmacuser/react-native-inapp-inspector/releases',
              ).catch(() => {});
            }}
            style={styles.gridCard}>
            <TagIcon color={AppColors.successGreen} size={18} />
            <View style={{flex: 1}}>
              <Text style={styles.gridCardTitle}>{t('about.releaseNotes', 'Release Notes')}</Text>
              <Text style={styles.gridCardSub}>{t('about.releaseNotesSub', 'What\'s new')}</Text>
            </View>
            <ExternalLinkIcon size={12} color={AppColors.grayTextWeak} />
          </TouchableScale>

          <TouchableScale
            onPress={() => {
              copyToClipboard(
                'npm install react-native-inapp-inspector',
                'NPM Command',
              );
              showToast(t('about.copiedInstallCommand', 'Copied package install command!'));
            }}
            style={styles.gridCard}>
            <CopyIcon color={AppColors.brandPurple} size={16} />
            <View style={{flex: 1}}>
              <Text style={styles.gridCardTitle}>{t('about.copyInstall', 'Copy Install')}</Text>
              <Text style={styles.gridCardSub}>{t('about.copyInstallSub', 'npm / yarn command')}</Text>
            </View>
          </TouchableScale>
        </View>

        {/* Footer info */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {t('about.footerLicense', 'React Native In-App Inspector · MIT License')}
          </Text>
          <Text style={styles.footerSubText}>
            {t('about.footerTagline', 'Zero-config on-device debugging tool')}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.grayBackground,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 14,
    paddingBottom: 32,
    gap: 12,
  },
  heroCard: {
    backgroundColor: AppColors.primaryLight,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: AppColors.dividerColor,
    shadowColor: AppColors.shadowColorString,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
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
    backgroundColor: `${AppColors.brandPurple}15`,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: `${AppColors.brandPurple}30`,
  },
  heroTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  heroTitle: {
    fontFamily: AppFonts.interBold,
    fontSize: 17,
    lineHeight: 22,
    color: AppColors.primaryBlack,
    letterSpacing: -0.3,
  },
  versionBadge: {
    backgroundColor: `${AppColors.brandPurple}18`,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: `${AppColors.brandPurple}30`,
  },
  versionBadgeText: {
    fontFamily: AppFonts.interBold,
    fontSize: 10,
    lineHeight: 13,
    color: AppColors.brandPurple,
  },
  updateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: `${AppColors.amber500}20`,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: `${AppColors.amber500}50`,
  },
  updateBadgeText: {
    fontFamily: AppFonts.interBold,
    fontSize: 9.5,
    lineHeight: 12,
    color: AppColors.amber600,
  },
  upToDateBadge: {
    backgroundColor: `${AppColors.emerald500}18`,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: `${AppColors.emerald500}35`,
  },
  upToDateBadgeText: {
    fontFamily: AppFonts.interMedium,
    fontSize: 9.5,
    lineHeight: 12,
    color: AppColors.emerald600,
  },
  heroPackageName: {
    fontFamily: AppFonts.interRegular,
    fontSize: 12,
    lineHeight: 16,
    color: AppColors.grayTextWeak,
    marginTop: 2,
  },
  heroDescription: {
    fontFamily: AppFonts.interRegular,
    fontSize: 13,
    lineHeight: 18,
    color: AppColors.grayText,
  },
  upgradeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: AppColors.brandPurple,
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  upgradeBtnText: {
    fontFamily: AppFonts.interBold,
    fontSize: 12,
    color: AppColors.white,
  },
  sectionCard: {
    backgroundColor: AppColors.primaryLight,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: AppColors.dividerColor,
    gap: 10,
  },
  sectionHeader: {
    fontFamily: AppFonts.interBold,
    fontSize: 11,
    lineHeight: 15,
    color: AppColors.grayTextWeak,
    letterSpacing: 0.6,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 3,
  },
  rowLabel: {
    fontFamily: AppFonts.interRegular,
    fontSize: 12.5,
    lineHeight: 17,
    color: AppColors.grayTextWeak,
  },
  rowValueBold: {
    fontFamily: AppFonts.interBold,
    fontSize: 12.5,
    lineHeight: 17,
    color: AppColors.primaryBlack,
  },
  rowValueRegular: {
    fontFamily: AppFonts.interRegular,
    fontSize: 12.5,
    lineHeight: 17,
    color: AppColors.grayTextStrong,
  },
  statusTag: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  statusTagText: {
    fontFamily: AppFonts.interSemiBold,
    fontSize: 10.5,
    lineHeight: 14,
  },
  featuresList: {
    gap: 10,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 4,
  },
  featureIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureTextBox: {
    flex: 1,
    gap: 2,
  },
  featureTitle: {
    fontFamily: AppFonts.interBold,
    fontSize: 13,
    lineHeight: 17,
    color: AppColors.primaryBlack,
  },
  featureDesc: {
    fontFamily: AppFonts.interRegular,
    fontSize: 11.5,
    lineHeight: 16,
    color: AppColors.grayTextWeak,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  gridCard: {
    width: '48.5%',
    flexGrow: 1,
    backgroundColor: AppColors.primaryLight,
    borderRadius: 10,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    borderWidth: 1,
    borderColor: AppColors.dividerColor,
  },
  gridCardTitle: {
    fontFamily: AppFonts.interBold,
    fontSize: 12,
    lineHeight: 16,
    color: AppColors.primaryBlack,
  },
  gridCardSub: {
    fontFamily: AppFonts.interRegular,
    fontSize: 10,
    lineHeight: 13,
    color: AppColors.grayTextWeak,
  },
  footer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 3,
  },
  footerText: {
    fontFamily: AppFonts.interMedium,
    fontSize: 11,
    lineHeight: 15,
    color: AppColors.grayTextWeak,
  },
  footerSubText: {
    fontFamily: AppFonts.interRegular,
    fontSize: 10,
    lineHeight: 14,
    color: AppColors.slate400,
  },
});

export default AboutModal;
