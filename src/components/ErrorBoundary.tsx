import React, { Component, ErrorInfo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { AppColors } from '../styles/AppColors';
import { AppFonts } from '../styles/AppFonts';
import { copyToClipboard } from '../helpers';
import { t } from '../i18n';
import { ErrorBoundaryProps, ErrorBoundaryState } from '../types';
import {
  WarningTriangleIcon,
  CopyIcon,
  RefreshCcwIcon,
  ClearIcon,
  CircleAlertIcon,
} from './NetworkIcons';
import { handleInterceptedCrash } from '../customHooks/crashHandler';
import { CrashType } from '../types/enums';
import {
  showNativeFloatingButton,
  setNativeFloatingButtonBadge,
} from '../native/NativeInspector';

interface ParsedFrame {
  method: string;
  file: string;
  fullPath: string;
  line: string;
  column: string;
  isProjectFile: boolean;
}

function parseStackTrace(stack: string): { rootFrame: ParsedFrame | null; frames: ParsedFrame[] } {
  if (!stack) return { rootFrame: null, frames: [] };
  const lines = stack.split('\n');
  const frames: ParsedFrame[] = [];

  for (const line of lines) {
    if (
      line.includes('ErrorBoundary') ||
      line.includes('getDerivedStateFromError') ||
      line.includes('componentDidCatch') ||
      line.includes('handleInterceptedCrash')
    ) {
      continue;
    }

    // iOS format: method@url:line:col
    const iosMatch = line.match(/^([^@]*)@(.*):(\d+):(\d+)$/);
    if (iosMatch) {
      const [, method, fullPath, lineNum, colNum] = iosMatch;
      const cleanFile = fullPath.split('?')[0].split('/').pop() || fullPath;
      const isProject = !fullPath.includes('node_modules') && !fullPath.includes('Libraries/Core');
      frames.push({
        method: method.trim() || 'anonymous',
        file: cleanFile,
        fullPath: fullPath.split('?')[0],
        line: lineNum,
        column: colNum,
        isProjectFile: isProject,
      });
      continue;
    }

    // Android format: at method (url:line:col) or at url:line:col
    const androidMatch = line.match(/^\s*at\s+(.+)\s+\((.+):(\d+):(\d+)\)$/);
    if (androidMatch) {
      const [, method, fullPath, lineNum, colNum] = androidMatch;
      const cleanFile = fullPath.split('?')[0].split('/').pop() || fullPath;
      const isProject = !fullPath.includes('node_modules') && !fullPath.includes('Libraries/Core');
      frames.push({
        method: method.trim(),
        file: cleanFile,
        fullPath: fullPath.split('?')[0],
        line: lineNum,
        column: colNum,
        isProjectFile: isProject,
      });
      continue;
    }

    const androidMatchSimple = line.match(/^\s*at\s+(.+):(\d+):(\d+)$/);
    if (androidMatchSimple) {
      const [, fullPath, lineNum, colNum] = androidMatchSimple;
      const cleanFile = fullPath.split('?')[0].split('/').pop() || fullPath;
      const isProject = !fullPath.includes('node_modules') && !fullPath.includes('Libraries/Core');
      frames.push({
        method: 'anonymous',
        file: cleanFile,
        fullPath: fullPath.split('?')[0],
        line: lineNum,
        column: colNum,
        isProjectFile: isProject,
      });
    }
  }

  // Find topmost project frame, or fallback to first frame
  const rootFrame = frames.find(f => f.isProjectFile) || frames[0] || null;
  return { rootFrame, frames };
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    try {
      const stack = error?.stack || errorInfo?.componentStack || '';
      handleInterceptedCrash(
        error,
        stack,
        false,
        CrashType.Render,
        errorInfo?.componentStack,
      );
      showNativeFloatingButton();
      setNativeFloatingButtonBadge(true);
    } catch {}
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  private handleCopyTrace = () => {
    const error = this.state.error;
    if (error) {
      const { rootFrame } = parseStackTrace(error.stack || '');
      const detailStr = `─────────────────────────────────────────────────────────────
IN-APP INSPECTOR • INTERCEPTED CRASH REPORT
─────────────────────────────────────────────────────────────
Error: ${error.name || 'Error'}
Message: ${error.message}
${rootFrame ? `Location: ${rootFrame.file}:${rootFrame.line}:${rootFrame.column}\nMethod: ${rootFrame.method}\nPath: ${rootFrame.fullPath}` : ''}
Timestamp: ${new Date().toISOString()}

Stack Trace:
${error.stack || 'No stack trace available'}
─────────────────────────────────────────────────────────────`;
      copyToClipboard(detailStr, t('errors.errorReport'));
    }
  };

  public render() {
    const { hasError, error } = this.state;
    if (!hasError || !error) {
      return this.props.children;
    }

    const { rootFrame, frames } = parseStackTrace(error.stack || '');
    const errorType = error.name || t('errors.title');
    const isSyntaxOrType =
      errorType.includes('Syntax') ||
      errorType.includes('Type') ||
      errorType.includes('Reference');

    // ─── Inline Fallback View ─────────────────────────────────────────────
    if (this.props.fallbackType === 'inline') {
      return (
        <View style={styles.inlineContainer}>
          <View style={styles.inlineHeader}>
            <WarningTriangleIcon color={AppColors.red600} size={18} />
            <View style={{ flex: 1 }}>
              <Text style={styles.inlineTitle} numberOfLines={1}>
                {errorType}: {error.message}
              </Text>
              {rootFrame && (
                <Text style={styles.inlineLoc} numberOfLines={1}>
                  {rootFrame.file}:{rootFrame.line} ({rootFrame.method})
                </Text>
              )}
            </View>
          </View>
          <View style={styles.inlineActions}>
            <TouchableOpacity
              onPress={this.handleReset}
              style={styles.inlineBtn}
              activeOpacity={0.7}>
              <RefreshCcwIcon size={12} color={AppColors.white} />
              <Text style={styles.inlineBtnText}>{t('errors.retry')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={this.handleCopyTrace}
              style={styles.inlineCopyBtn}
              activeOpacity={0.7}>
              <CopyIcon size={12} color={AppColors.redErrorText} />
              <Text style={styles.inlineCopyBtnText}>{t('errors.copy')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    // ─── Full-Screen Custom Native Recovery Modal ─────────────────────────
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          {/* Header Banner */}
          <View style={styles.header}>
            <View style={styles.iconGlowWrap}>
              <WarningTriangleIcon color={AppColors.red500} size={28} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.badgeRow}>
                <View style={styles.crashBadge}>
                  <Text style={styles.crashBadgeText}>
                    {isSyntaxOrType ? `JS ${errorType.toUpperCase()}` : t('errors.crashIntercepted')}
                  </Text>
                </View>
                <View style={styles.shieldBadge}>
                  <Text style={styles.shieldBadgeText}>{t('errors.protected')}</Text>
                </View>
              </View>
              <Text style={styles.title}>{t('errors.rootCauseTitle')}</Text>
              <Text style={styles.subtitle}>{t('errors.rootCauseSubtitle')}</Text>
            </View>
            {this.props.onClose && (
              <TouchableOpacity
                onPress={this.props.onClose}
                style={styles.closeIconBtn}
                activeOpacity={0.7}>
                <ClearIcon size={16} color={AppColors.slate400} />
              </TouchableOpacity>
            )}
          </View>

          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}>
            {/* Error Message Box */}
            <View style={styles.errorBox}>
              <View style={styles.errorBoxHeader}>
                <CircleAlertIcon size={14} color={AppColors.red500} />
                <Text style={styles.errorBoxTitle}>{errorType}</Text>
              </View>
              <Text style={styles.errorMessage}>{error.message}</Text>
            </View>

            {/* Root Cause Location Card */}
            {rootFrame && (
              <View style={styles.locationCard}>
                <Text style={styles.cardHeaderTitle}>{t('errors.exactLocation')}</Text>
                <View style={styles.locRow}>
                  <Text style={styles.locLabel}>{t('errors.file')}</Text>
                  <Text style={styles.locValFile} numberOfLines={1}>
                    {rootFrame.file}
                  </Text>
                </View>
                <View style={styles.locRow}>
                  <Text style={styles.locLabel}>{t('errors.lineCol')}</Text>
                  <Text style={styles.locValNum}>
                    {t('errors.lineColVal', {line: rootFrame.line, col: rootFrame.column})}
                  </Text>
                </View>
                <View style={styles.locRow}>
                  <Text style={styles.locLabel}>{t('errors.function')}</Text>
                  <Text style={styles.locValMethod}>{rootFrame.method}()</Text>
                </View>
                {rootFrame.fullPath ? (
                  <Text style={styles.fullPathText} numberOfLines={2}>
                    {rootFrame.fullPath}
                  </Text>
                ) : null}
              </View>
            )}

            {/* Formatted Stack Frames */}
            <View style={styles.stackCard}>
              <View style={styles.stackCardHeader}>
                <Text style={styles.cardHeaderTitle}>{t('errors.callStack')}</Text>
                <Text style={styles.frameCountText}>
                  {t('errors.framesCount', {count: frames.length})}
                </Text>
              </View>

              {frames.slice(0, 8).map((frame, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.frameItem,
                    frame.isProjectFile && styles.frameItemProject,
                  ]}>
                  <View style={styles.frameNumBadge}>
                    <Text
                      style={[
                        styles.frameNumText,
                        frame.isProjectFile && { color: AppColors.sky400 },
                      ]}>
                      #{idx + 1}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.frameMethod,
                        frame.isProjectFile && styles.frameMethodProject,
                      ]}
                      numberOfLines={1}>
                      {frame.method}
                    </Text>
                    <Text style={styles.frameLoc} numberOfLines={1}>
                      {frame.file}:{frame.line}:{frame.column}
                    </Text>
                  </View>
                  {frame.isProjectFile && (
                    <View style={styles.appTag}>
                      <Text style={styles.appTagText}>{t('errors.appTag')}</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          </ScrollView>

          {/* Action Buttons Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              onPress={this.handleReset}
              style={styles.retryBtn}
              activeOpacity={0.8}>
              <RefreshCcwIcon size={16} color={AppColors.white} />
              <Text style={styles.retryBtnText}>{t('errors.tryAgainRecover')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={this.handleCopyTrace}
              style={styles.copyBtn}
              activeOpacity={0.8}>
              <CopyIcon size={16} color={AppColors.slate900} />
              <Text style={styles.copyBtnText}>{t('errors.copyDiagnostics')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: AppColors.slate850,
  },
  container: {
    flex: 1,
    backgroundColor: AppColors.slate850,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.slate800,
    gap: 12,
  },
  iconGlowWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: `${AppColors.red500}26`,
    borderWidth: 1,
    borderColor: `${AppColors.red500}59`,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  crashBadge: {
    backgroundColor: `${AppColors.red500}33`,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: `${AppColors.red500}66`,
  },
  crashBadgeText: {
    fontFamily: AppFonts.interBold,
    fontSize: 9.5,
    color: AppColors.red500,
    letterSpacing: 0.5,
  },
  shieldBadge: {
    backgroundColor: `${AppColors.emerald500}26`,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: `${AppColors.emerald500}4D`,
  },
  shieldBadgeText: {
    fontFamily: AppFonts.interBold,
    fontSize: 9,
    color: AppColors.emerald500,
    letterSpacing: 0.5,
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
  closeIconBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: AppColors.slate800,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 12,
  },
  errorBox: {
    backgroundColor: `${AppColors.red500}1A`,
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
    letterSpacing: 0.3,
  },
  errorMessage: {
    fontFamily: AppFonts.interBold,
    fontSize: 13.5,
    color: AppColors.red100,
    lineHeight: 19,
  },
  locationCard: {
    backgroundColor: AppColors.slate800,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: AppColors.slate700,
    gap: 8,
  },
  cardHeaderTitle: {
    fontFamily: AppFonts.interBold,
    fontSize: 10.5,
    color: AppColors.slate400,
    letterSpacing: 0.8,
  },
  locRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  locLabel: {
    fontFamily: AppFonts.interMedium,
    fontSize: 12,
    color: AppColors.slate400,
    minWidth: 80,
  },
  locValFile: {
    fontFamily: AppFonts.interBold,
    fontSize: 12.5,
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
    color: AppColors.slate500,
    marginTop: 2,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: AppColors.slate700,
  },
  stackCard: {
    backgroundColor: AppColors.slate800,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: AppColors.slate700,
    gap: 8,
  },
  stackCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  frameCountText: {
    fontFamily: AppFonts.interMedium,
    fontSize: 10.5,
    color: AppColors.slate400,
  },
  frameItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.slate850,
    padding: 10,
    borderRadius: 8,
    gap: 10,
    borderWidth: 1,
    borderColor: AppColors.slate800,
  },
  frameItemProject: {
    borderColor: `${AppColors.sky400}4D`,
    backgroundColor: `${AppColors.sky400}0D`,
  },
  frameNumBadge: {
    width: 24,
    alignItems: 'center',
  },
  frameNumText: {
    fontFamily: AppFonts.interBold,
    fontSize: 10.5,
    color: AppColors.slate500,
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
    backgroundColor: `${AppColors.sky400}33`,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  appTagText: {
    fontFamily: AppFonts.interBold,
    fontSize: 8.5,
    color: AppColors.sky400,
  },
  footer: {
    flexDirection: 'row',
    padding: 14,
    backgroundColor: AppColors.slate800,
    borderTopWidth: 1,
    borderTopColor: AppColors.slate700,
    gap: 10,
  },
  retryBtn: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: AppColors.purple,
    height: 44,
    borderRadius: 10,
  },
  retryBtnText: {
    fontFamily: AppFonts.interBold,
    fontSize: 13,
    color: AppColors.white,
  },
  copyBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: AppColors.slate100,
    height: 44,
    borderRadius: 10,
  },
  copyBtnText: {
    fontFamily: AppFonts.interBold,
    fontSize: 13,
    color: AppColors.slate900,
  },
  inlineContainer: {
    padding: 12,
    backgroundColor: AppColors.red50,
    borderWidth: 1,
    borderColor: AppColors.errorBorder,
    borderRadius: 10,
    margin: 8,
    gap: 10,
  },
  inlineHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  inlineTitle: {
    fontFamily: AppFonts.interBold,
    fontSize: 12,
    color: AppColors.red600,
  },
  inlineLoc: {
    fontFamily: AppFonts.interMedium,
    fontSize: 10.5,
    color: AppColors.redErrorText,
    marginTop: 2,
  },
  inlineActions: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'flex-end',
  },
  inlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: AppColors.red600,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  inlineBtnText: {
    fontFamily: AppFonts.interBold,
    fontSize: 11,
    color: AppColors.white,
  },
  inlineCopyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: AppColors.red100,
    borderWidth: 1,
    borderColor: AppColors.errorBorder,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  inlineCopyBtnText: {
    fontFamily: AppFonts.interMedium,
    fontSize: 11,
    color: AppColors.redErrorText,
  },
});

export default ErrorBoundary;

