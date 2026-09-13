import React, {useMemo} from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  View,
  ScrollView,
  SafeAreaView,
  Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import TouchableScale from '../TouchableScale';
import {AppColors} from '../../styles/AppColors';
import {AppFonts} from '../../styles/AppFonts';
import {CrashRecord} from '../../types';
import {exportCrashReport} from '../../customHooks/crashHandler';
import {copyToClipboard} from '../../helpers';
import {showToast} from '../../helpers/toast';
import {useTranslation} from '../../i18n';
import {
  WarningTriangleIcon,
  CopyIcon,
  RefreshCcwIcon,
  CloseWhite,
  CircleAlertIcon,
  TerminalIcon,
  CodeBracketsIcon,
  RepeatIcon,
  ShieldAlertIcon,
  FlameIcon,
  ChipIcon,
  LayoutIcon,
  HourglassIcon,
  JsIcon,
} from '../NetworkIcons';

interface GlobalCrashScreenModalProps {
  visible: boolean;
  crash: CrashRecord | null;
  onDismiss: () => void;
  onOpenInspector: () => void;
  onRetry?: () => void;
}

export const GlobalCrashScreenModal: React.FC<GlobalCrashScreenModalProps> = React.memo(
  ({visible, crash, onDismiss, onOpenInspector, onRetry}) => {
    const {t} = useTranslation();

    const reportText = useMemo(() => {
      if (!crash) return '';
      return exportCrashReport(crash, 'markdown');
    }, [crash]);

    if (!visible || !crash) {
      return null;
    }

    const isFatal = crash.isFatal;
    const crashType = crash.type || 'js';
    const topFrame =
      crash.parsedStack && crash.parsedStack.length > 0
        ? crash.parsedStack.find(f => f.isAppCode) || crash.parsedStack[0]
        : null;

    const handleCopy = () => {
      if (reportText) {
        copyToClipboard(reportText, t('errors.errorReport', 'Crash Report'));
        showToast(t('common.copied', 'Copied crash diagnostics to clipboard'));
      }
    };

    const getTypeIcon = () => {
      switch (crashType) {
        case 'native':
          return <ChipIcon size={12} color={AppColors.cyan600} />;
        case 'render':
          return <LayoutIcon size={12} color={AppColors.purple400} />;
        case 'promise':
          return <HourglassIcon size={12} color={AppColors.amber400} />;
        default:
          return <JsIcon size={12} color={AppColors.yellow400} />;
      }
    };

    return (
      <Modal
        visible={visible}
        transparent={false}
        animationType="fade"
        statusBarTranslucent={true}
        onRequestClose={onDismiss}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.container}>
            {/* ─── Top Header Banner ─── */}
            <View style={styles.header}>
              <LinearGradient
                colors={[AppColors.red600, AppColors.rose600]}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 1}}
                style={styles.iconGlowWrap}>
                <WarningTriangleIcon color={AppColors.white} size={24} />
              </LinearGradient>

              <View style={styles.headerTextCol}>
                <View style={styles.badgeRow}>
                  <View
                    style={[
                      styles.crashBadge,
                      isFatal && styles.crashBadgeFatal,
                    ]}>
                    {isFatal ? (
                      <FlameIcon size={10} color={AppColors.red500} />
                    ) : (
                      getTypeIcon()
                    )}
                    <Text
                      style={[
                        styles.crashBadgeText,
                        isFatal && styles.crashBadgeTextFatal,
                      ]}>
                      {isFatal
                        ? t('crash.fatalBadge', 'FATAL CRASH')
                        : `${crashType.toUpperCase()} ERROR`}
                    </Text>
                  </View>

                  <View style={styles.shieldBadge}>
                    <ShieldAlertIcon size={10} color={AppColors.emerald400} />
                    <Text style={styles.shieldBadgeText}>
                      {t('errors.protected', 'SHIELD PROTECTED')}
                    </Text>
                  </View>
                </View>

                <Text style={styles.title}>
                  {t('errors.rootCauseTitle', 'Crash Intercepted')}
                </Text>
                <Text style={styles.subtitle} numberOfLines={1}>
                  {t(
                    'errors.rootCauseSubtitle',
                    'Native crash prevented • Diagnostics captured',
                  )}
                </Text>
              </View>

              <TouchableScale
                onPress={onDismiss}
                hitSlop={10}
                style={styles.closeBtn}>
                <CloseWhite size={12} color={AppColors.slate400} />
              </TouchableScale>
            </View>

            {/* ─── Scrollable Diagnostics & Stack Trace ─── */}
            <ScrollView
              style={styles.scrollArea}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={true}>
              {/* Error Message Box */}
              <View style={styles.errorBox}>
                <View style={styles.errorBoxHeader}>
                  <CircleAlertIcon size={14} color={AppColors.red500} />
                  <Text style={styles.errorBoxTitle}>
                    {crash.name || t('crash.unknownException', 'Exception')}
                  </Text>
                </View>
                <Text style={styles.errorMessage} selectable={true}>
                  {crash.message || t('crash.unknownException', 'Unknown Exception')}
                </Text>
              </View>

              {/* Exact Location Card */}
              {topFrame && (
                <View style={styles.locationCard}>
                  <View style={styles.cardHeaderRow}>
                    <TerminalIcon size={13} color={AppColors.sky400} />
                    <Text style={styles.cardHeaderTitle}>
                      {t('errors.exactLocation', 'EXACT ROOT CAUSE')}
                    </Text>
                  </View>

                  <View style={styles.locRow}>
                    <Text style={styles.locLabel}>
                      {t('errors.file', 'File:')}
                    </Text>
                    <Text style={styles.locValFile} numberOfLines={1} selectable={true}>
                      {topFrame.file}
                    </Text>
                  </View>

                  <View style={styles.locRow}>
                    <Text style={styles.locLabel}>
                      {t('errors.lineCol', 'Line / Col:')}
                    </Text>
                    <Text style={styles.locValNum}>
                      {topFrame.lineNumber}:{topFrame.column}
                    </Text>
                  </View>

                  <View style={styles.locRow}>
                    <Text style={styles.locLabel}>
                      {t('errors.function', 'Function:')}
                    </Text>
                    <Text style={styles.locValMethod} numberOfLines={1}>
                      {topFrame.method}()
                    </Text>
                  </View>

                  {topFrame.raw && (
                    <Text style={styles.fullPathText} numberOfLines={2} selectable={true}>
                      {topFrame.raw}
                    </Text>
                  )}
                </View>
              )}

              {/* Call Stack Frames */}
              {crash.parsedStack && crash.parsedStack.length > 0 && (
                <View style={styles.stackCard}>
                  <View style={styles.cardHeaderRow}>
                    <CodeBracketsIcon size={13} color={AppColors.purple400} />
                    <Text style={styles.cardHeaderTitle}>
                      {t('errors.callStack', 'CALL STACK')}
                    </Text>
                    <Text style={styles.cardHeaderCount}>
                      {crash.parsedStack.length} frames
                    </Text>
                  </View>

                  {crash.parsedStack.slice(0, 10).map((frame, idx) => (
                    <View
                      key={idx}
                      style={[
                        styles.frameItem,
                        frame.isAppCode && styles.frameItemProject,
                      ]}>
                      <View style={styles.frameNumBadge}>
                        <Text
                          style={[
                            styles.frameNumText,
                            frame.isAppCode && {color: AppColors.sky400},
                          ]}>
                          #{idx + 1}
                        </Text>
                      </View>
                      <View style={{flex: 1}}>
                        <Text
                          style={[
                            styles.frameMethod,
                            frame.isAppCode && styles.frameMethodProject,
                          ]}
                          numberOfLines={1}>
                          {frame.method}
                        </Text>
                        <Text style={styles.frameLoc} numberOfLines={1}>
                          {frame.file}:{frame.lineNumber}
                        </Text>
                      </View>
                      {frame.isAppCode && (
                        <View style={styles.appTag}>
                          <Text style={styles.appTagText}>APP</Text>
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              )}

              {/* Component Hierarchy (for React Render errors) */}
              {crash.componentStack && (
                <View style={styles.stackCard}>
                  <View style={styles.cardHeaderRow}>
                    <LayoutIcon size={13} color={AppColors.purple400} />
                    <Text style={styles.cardHeaderTitle}>
                      {t('crash.componentHierarchy', 'COMPONENT HIERARCHY')}
                    </Text>
                  </View>
                  <Text style={styles.rawStackText} selectable={true}>
                    {crash.componentStack}
                  </Text>
                </View>
              )}

              {/* Recent Breadcrumbs Trail */}
              {crash.breadcrumbs && crash.breadcrumbs.length > 0 && (
                <View style={styles.stackCard}>
                  <View style={styles.cardHeaderRow}>
                    <RepeatIcon size={13} color={AppColors.amber400} />
                    <Text style={styles.cardHeaderTitle}>
                      {t('crash.breadcrumbTrail', 'RECENT TRAIL')}
                    </Text>
                    <Text style={styles.cardHeaderCount}>
                      {crash.breadcrumbs.length} events
                    </Text>
                  </View>

                  {crash.breadcrumbs.slice(0, 6).map((b, idx) => {
                    const time = new Date(b.timestamp).toLocaleTimeString();
                    return (
                      <View key={idx} style={styles.breadcrumbItem}>
                        <View style={styles.breadcrumbTag}>
                          <Text style={styles.breadcrumbTagText}>
                            {b.type.toUpperCase()}
                          </Text>
                        </View>
                        <Text style={styles.breadcrumbMsg} numberOfLines={2}>
                          {b.message}
                        </Text>
                        <Text style={styles.breadcrumbTime}>{time}</Text>
                      </View>
                    );
                  })}
                </View>
              )}

              {/* Device Telemetry Specs */}
              {crash.deviceInfo && (
                <View style={styles.telemetryCard}>
                  <Text style={styles.telemetryTitle}>
                    {t('crash.deviceDiagnostics', 'HARDWARE & RUNTIME TELEMETRY')}
                  </Text>
                  <View style={styles.telemetryGrid}>
                    <View style={styles.telemetryPill}>
                      <Text style={styles.telemetryLabel}>OS</Text>
                      <Text style={styles.telemetryValue}>
                        {crash.deviceInfo.platform?.toUpperCase()}{' '}
                        {crash.deviceInfo.osVersion}
                      </Text>
                    </View>
                    <View style={styles.telemetryPill}>
                      <Text style={styles.telemetryLabel}>RN Version</Text>
                      <Text style={styles.telemetryValue}>
                        {crash.deviceInfo.rnVersion || 'N/A'}
                      </Text>
                    </View>
                    <View style={styles.telemetryPill}>
                      <Text style={styles.telemetryLabel}>Engine</Text>
                      <Text style={styles.telemetryValue}>
                        {crash.deviceInfo.isHermes ? 'Hermes' : 'JSC'}
                      </Text>
                    </View>
                    <View style={styles.telemetryPill}>
                      <Text style={styles.telemetryLabel}>Architecture</Text>
                      <Text style={styles.telemetryValue}>
                        {crash.deviceInfo.isFabric ? 'Fabric (New)' : 'Paper'}
                      </Text>
                    </View>
                    {crash.memoryInfo && (
                      <View style={styles.telemetryPill}>
                        <Text style={styles.telemetryLabel}>JS Heap</Text>
                        <Text style={styles.telemetryValue}>
                          {crash.memoryInfo.usedJSHeapSize} / {crash.memoryInfo.totalJSHeapSize} MB
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              )}
            </ScrollView>

            {/* ─── Bottom Action Bar ─── */}
            <View style={styles.footer}>
              {onRetry && (
                <TouchableScale
                  onPress={onRetry}
                  style={styles.retryBtn}>
                  <RefreshCcwIcon size={14} color={AppColors.white} />
                  <Text style={styles.retryBtnText}>
                    {t('errors.retry', 'Try Again')}
                  </Text>
                </TouchableScale>
              )}

              <TouchableScale
                onPress={onOpenInspector}
                style={styles.inspectorBtn}>
                <LinearGradient
                  colors={[AppColors.indigo600, AppColors.violet600]}
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 1}}
                  style={styles.inspectorBtnGradient}>
                  <ShieldAlertIcon size={14} color={AppColors.white} />
                  <Text style={styles.inspectorBtnText}>
                    {t('crash.openInInspector', 'Open in Inspector')}
                  </Text>
                </LinearGradient>
              </TouchableScale>

              <TouchableScale
                onPress={handleCopy}
                style={styles.copyBtn}>
                <CopyIcon size={14} color={AppColors.slate200} />
                <Text style={styles.copyBtnText}>
                  {t('errors.copy', 'Copy')}
                </Text>
              </TouchableScale>
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    );
  },
);

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: AppColors.slate900,
  },
  container: {
    flex: 1,
    backgroundColor: AppColors.slate900,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 24 : 12,
    paddingBottom: 12,
    backgroundColor: AppColors.slate850,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.slate800,
    gap: 12,
  },
  iconGlowWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: AppColors.red500,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  headerTextCol: {
    flex: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 3,
  },
  crashBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: `${AppColors.red500}22`,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: `${AppColors.red500}44`,
  },
  crashBadgeFatal: {
    backgroundColor: `${AppColors.red500}33`,
    borderColor: AppColors.red500,
  },
  crashBadgeText: {
    fontFamily: AppFonts.interBold,
    fontSize: 9.5,
    color: AppColors.red500,
    letterSpacing: 0.4,
  },
  crashBadgeTextFatal: {
    color: AppColors.red500,
  },
  shieldBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: `${AppColors.emerald500}20`,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: `${AppColors.emerald500}44`,
  },
  shieldBadgeText: {
    fontFamily: AppFonts.interBold,
    fontSize: 9,
    color: AppColors.emerald400,
    letterSpacing: 0.4,
  },
  title: {
    fontFamily: AppFonts.interBold,
    fontSize: 16,
    color: AppColors.white,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontFamily: AppFonts.interRegular,
    fontSize: 11,
    color: AppColors.slate400,
    marginTop: 1,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: AppColors.slate800,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 12,
    paddingBottom: 24,
  },
  errorBox: {
    backgroundColor: `${AppColors.red500}16`,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: `${AppColors.red500}40`,
    padding: 14,
    gap: 6,
  },
  errorBoxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  errorBoxTitle: {
    fontFamily: AppFonts.interBold,
    fontSize: 12,
    color: AppColors.red500,
    letterSpacing: 0.4,
  },
  errorMessage: {
    fontFamily: AppFonts.interBold,
    fontSize: 13.5,
    color: AppColors.red100,
    lineHeight: 19,
  },
  locationCard: {
    backgroundColor: AppColors.slate850,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: AppColors.slate800,
    gap: 8,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  cardHeaderTitle: {
    fontFamily: AppFonts.interBold,
    fontSize: 10.5,
    color: AppColors.slate200,
    letterSpacing: 0.6,
    flex: 1,
  },
  cardHeaderCount: {
    fontFamily: AppFonts.interMedium,
    fontSize: 10,
    color: AppColors.slate400,
  },
  locRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  locLabel: {
    fontFamily: AppFonts.interMedium,
    fontSize: 11.5,
    color: AppColors.slate400,
    minWidth: 80,
  },
  locValFile: {
    fontFamily: AppFonts.interBold,
    fontSize: 12,
    color: AppColors.sky400,
    flex: 1,
    textAlign: 'right',
  },
  locValNum: {
    fontFamily: AppFonts.interBold,
    fontSize: 12,
    color: AppColors.white,
  },
  locValMethod: {
    fontFamily: AppFonts.interMedium,
    fontSize: 12,
    color: AppColors.purple400,
  },
  fullPathText: {
    fontFamily: AppFonts.interRegular,
    fontSize: 10,
    color: AppColors.slate400,
    marginTop: 4,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: AppColors.slate800,
  },
  stackCard: {
    backgroundColor: AppColors.slate850,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: AppColors.slate800,
    gap: 6,
  },
  frameItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.slate900,
    padding: 9,
    borderRadius: 8,
    gap: 8,
    borderWidth: 1,
    borderColor: AppColors.slate800,
  },
  frameItemProject: {
    borderColor: `${AppColors.sky400}44`,
    backgroundColor: `${AppColors.sky400}0F`,
  },
  frameNumBadge: {
    width: 22,
    alignItems: 'center',
  },
  frameNumText: {
    fontFamily: AppFonts.interBold,
    fontSize: 10,
    color: AppColors.slate400,
  },
  frameMethod: {
    fontFamily: AppFonts.interBold,
    fontSize: 11.5,
    color: AppColors.slate200,
  },
  frameMethodProject: {
    color: AppColors.white,
  },
  frameLoc: {
    fontFamily: AppFonts.interRegular,
    fontSize: 10,
    color: AppColors.slate400,
    marginTop: 1,
  },
  appTag: {
    backgroundColor: `${AppColors.sky400}26`,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  appTagText: {
    fontFamily: AppFonts.interBold,
    fontSize: 8.5,
    color: AppColors.sky400,
  },
  rawStackText: {
    fontFamily: AppFonts.interRegular,
    fontSize: 10.5,
    color: AppColors.slate200,
    lineHeight: 16,
    backgroundColor: AppColors.slate900,
    padding: 10,
    borderRadius: 8,
  },
  breadcrumbItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: AppColors.slate900,
    padding: 8,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: AppColors.slate800,
  },
  breadcrumbTag: {
    backgroundColor: `${AppColors.indigo600}20`,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  breadcrumbTagText: {
    fontFamily: AppFonts.interBold,
    fontSize: 8.5,
    color: AppColors.purple400,
  },
  breadcrumbMsg: {
    flex: 1,
    fontFamily: AppFonts.interRegular,
    fontSize: 11,
    color: AppColors.slate200,
  },
  breadcrumbTime: {
    fontFamily: AppFonts.interMedium,
    fontSize: 9.5,
    color: AppColors.slate400,
  },
  telemetryCard: {
    backgroundColor: AppColors.slate850,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: AppColors.slate800,
    gap: 8,
  },
  telemetryTitle: {
    fontFamily: AppFonts.interBold,
    fontSize: 10,
    color: AppColors.slate400,
    letterSpacing: 0.6,
  },
  telemetryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  telemetryPill: {
    backgroundColor: AppColors.slate900,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: AppColors.slate800,
  },
  telemetryLabel: {
    fontFamily: AppFonts.interMedium,
    fontSize: 9.5,
    color: AppColors.slate400,
  },
  telemetryValue: {
    fontFamily: AppFonts.interBold,
    fontSize: 11,
    color: AppColors.white,
    marginTop: 2,
  },
  footer: {
    flexDirection: 'row',
    padding: 14,
    backgroundColor: AppColors.slate850,
    borderTopWidth: 1,
    borderTopColor: AppColors.slate800,
    gap: 10,
    alignItems: 'center',
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: AppColors.red600,
    paddingHorizontal: 14,
    height: 42,
    borderRadius: 10,
  },
  retryBtnText: {
    fontFamily: AppFonts.interBold,
    fontSize: 12.5,
    color: AppColors.white,
  },
  inspectorBtn: {
    flex: 1,
    height: 42,
    borderRadius: 10,
    overflow: 'hidden',
  },
  inspectorBtnGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 12,
  },
  inspectorBtnText: {
    fontFamily: AppFonts.interBold,
    fontSize: 12.5,
    color: AppColors.white,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: AppColors.slate800,
    borderWidth: 1,
    borderColor: AppColors.slate700,
    paddingHorizontal: 14,
    height: 42,
    borderRadius: 10,
  },
  copyBtnText: {
    fontFamily: AppFonts.interBold,
    fontSize: 12.5,
    color: AppColors.slate200,
  },
});

export default GlobalCrashScreenModal;
