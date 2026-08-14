import React, { Component, ErrorInfo } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { AppColors } from '../styles/AppColors';
import { AppFonts } from '../styles/AppFonts';
import { copyToClipboard } from '../helpers';
import {ErrorBoundaryProps, ErrorBoundaryState} from '../types';

function parseStackTrace(stack: string) {
  if (!stack) return null;
  const lines = stack.split('\n');
  for (const line of lines) {
    if (
      line.includes('ErrorBoundary') ||
      line.includes('getDerivedStateFromError') ||
      line.includes('componentDidCatch')
    ) {
      continue;
    }
    // Matching ios format: method@url:line:col
    const iosMatch = line.match(/^([^@]+)@(.*):(\d+):(\d+)$/);
    if (iosMatch) {
      const [, method, file, lineNum, colNum] = iosMatch;
      const cleanFile = file.split('?')[0].split('/').pop() || file;
      return { method: method.trim(), file: cleanFile, line: lineNum, column: colNum };
    }
    // Matching android format: at method (url:line:col) or at url:line:col
    const androidMatch = line.match(/^\s*at\s+(.+)\s+\((.+):(\d+):(\d+)\)$/);
    if (androidMatch) {
      const [, method, file, lineNum, colNum] = androidMatch;
      const cleanFile = file.split('?')[0].split('/').pop() || file;
      return { method: method.trim(), file: cleanFile, line: lineNum, column: colNum };
    }
    const androidMatchSimple = line.match(/^\s*at\s+(.+):(\d+):(\d+)$/);
    if (androidMatchSimple) {
      const [, file, lineNum, colNum] = androidMatchSimple;
      const cleanFile = file.split('?')[0].split('/').pop() || file;
      return { method: 'anonymous', file: cleanFile, line: lineNum, column: colNum };
    }
  }
  return null;
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
    console.error('InAppInspector ErrorBoundary caught a crash:', error, errorInfo);
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
      const isNativeCrash = error.message.includes('Native') || error.message.includes('native') || error.message.includes('Swift') || error.message.includes('Java');
      const parsed = error.stack ? parseStackTrace(error.stack) : null;
      const detailStr = `Crash Source: ${isNativeCrash ? 'Native Crash' : 'JavaScript Crash'}
Message: ${error.message}
${parsed ? `Method: ${parsed.method}\nFile: ${parsed.file}\nLine: ${parsed.line}:${parsed.column}` : ''}
Stack Trace:
${error.stack}`;
      copyToClipboard(detailStr, 'Crash traceback');
    }
  };

  public render() {
    if (this.state.hasError) {
      const isInline = this.props.fallbackType === 'inline';

      if (isInline) {
        return (
          <View style={styles.inlineContainer}>
            <Text style={styles.inlineTitle}>⚠️ Inspector Crash</Text>
            <TouchableOpacity style={styles.inlineResetBtn} onPress={this.handleReset}>
              <Text style={styles.inlineResetText}>Reload</Text>
            </TouchableOpacity>
          </View>
        );
      }

      const error = this.state.error;
      const isNativeCrash = error ? (error.message.includes('Native') || error.message.includes('native') || error.message.includes('Swift') || error.message.includes('Java')) : false;
      const parsed = error && error.stack ? parseStackTrace(error.stack) : null;

      return (
        <View style={styles.container}>
          <View style={styles.card}>
            <Text style={styles.emoji}>⚠️</Text>
            <Text style={styles.title}>Something went wrong</Text>
            
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: isNativeCrash ? `${AppColors.errorColor}1A` : `${AppColors.amber500}1A`,
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 20,
              marginBottom: 12,
              gap: 4
            }}>
              <Text style={{
                fontSize: 10,
                fontWeight: 'bold',
                color: isNativeCrash ? AppColors.errorColor : AppColors.amber500,
                fontFamily: AppFonts.interBold || 'System'
              }}>
                {isNativeCrash ? '🔴 NATIVE CRASH' : '🟡 JAVASCRIPT CRASH'}
              </Text>
            </View>

            <Text style={styles.subtitle}>
              The In-App Inspector or active view encountered an error. Traceback details are parsed below:
            </Text>

            {parsed && (
              <View style={{
                backgroundColor: AppColors.slate100,
                borderRadius: 8,
                padding: 10,
                width: '100%',
                marginBottom: 10,
                borderWidth: 1,
                borderColor: AppColors.slate200,
                gap: 4
              }}>
                <Text style={{ fontSize: 11, color: AppColors.slate600, fontFamily: AppFonts.interMedium }} numberOfLines={1}>
                  <Text style={{ fontWeight: 'bold' }}>Method:</Text> {parsed.method}
                </Text>
                <Text style={{ fontSize: 11, color: AppColors.slate600, fontFamily: AppFonts.interMedium }} numberOfLines={1}>
                  <Text style={{ fontWeight: 'bold' }}>File:</Text> {parsed.file}
                </Text>
                <Text style={{ fontSize: 11, color: AppColors.slate600, fontFamily: AppFonts.interMedium }}>
                  <Text style={{ fontWeight: 'bold' }}>Line:</Text> {parsed.line}  <Text style={{ fontWeight: 'bold' }}>Col:</Text> {parsed.column}
                </Text>
              </View>
            )}

            {error && (
              <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
                <Text style={styles.code}>
                  {error.message}
                  {'\n\n'}
                  {error.stack}
                </Text>
              </ScrollView>
            )}

            <View style={{ width: '100%', gap: 8, marginBottom: 12 }}>
              <TouchableOpacity
                style={{
                  backgroundColor: AppColors.slate900,
                  height: 38,
                  borderRadius: 8,
                  justifyContent: 'center',
                  alignItems: 'center',
                  flexDirection: 'row',
                  gap: 6
                }}
                onPress={this.handleCopyTrace}
              >
                <Text style={{ color: AppColors.white, fontSize: 12, fontWeight: 'bold', fontFamily: AppFonts.interBold || 'System' }}>
                  📋 Copy Crash Traceback
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.btnRow}>
              <TouchableOpacity style={styles.resetBtn} onPress={this.handleReset}>
                <Text style={styles.resetBtnText}>Retry / Reload</Text>
              </TouchableOpacity>
              
              {this.props.onClose && (
                <TouchableOpacity style={styles.closeBtn} onPress={this.props.onClose}>
                  <Text style={styles.closeBtnText}>Close Inspector</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const monoFont = AppFonts.interRegular;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: `${AppColors.black}4D`,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: AppColors.white,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: AppColors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  emoji: {
    fontSize: 40,
    marginBottom: 12,
  },
  title: {
    fontFamily: AppFonts.interBold || 'System',
    fontSize: 18,
    color: AppColors.slate900,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: AppFonts.interRegular || 'System',
    fontSize: 12,
    color: AppColors.slate500,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 16,
  },
  scroll: {
    width: '100%',
    maxHeight: 180,
    backgroundColor: AppColors.slate50,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: AppColors.slate200,
    padding: 10,
    marginBottom: 20,
  },
  scrollContent: {
    paddingBottom: 10,
  },
  code: {
    fontFamily: monoFont,
    fontSize: 11,
    color: AppColors.rose600,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  resetBtn: {
    flex: 1,
    backgroundColor: AppColors.purple,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resetBtnText: {
    fontFamily: AppFonts.interBold || 'System',
    fontSize: 13,
    color: AppColors.white,
  },
  closeBtn: {
    flex: 1,
    backgroundColor: AppColors.slate100,
    borderWidth: 1,
    borderColor: AppColors.slate200,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnText: {
    fontFamily: AppFonts.interBold || 'System',
    fontSize: 13,
    color: AppColors.slate600,
  },
  inlineContainer: {
    padding: 8,
    backgroundColor: AppColors.roseBg,
    borderWidth: 1,
    borderColor: AppColors.errorBorder,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    margin: 8,
  },
  inlineTitle: {
    fontFamily: AppFonts.interBold || 'System',
    fontSize: 11,
    color: AppColors.redErrorText,
  },
  inlineResetBtn: {
    backgroundColor: AppColors.redErrorText,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  inlineResetText: {
    fontFamily: AppFonts.interBold || 'System',
    fontSize: 10,
    color: AppColors.white,
  },
});

export default ErrorBoundary;
