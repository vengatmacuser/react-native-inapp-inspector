import React, {Component, ErrorInfo, ReactNode} from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  StyleProp,
  ViewStyle,
  Platform,
} from 'react-native';
import {AppFonts} from '../styles/AppFonts';
import {AppColors} from '../styles/AppColors';
import {copyToClipboard} from '../helpers';
import {WarningTriangleIcon, RefreshCcwIcon, CopyIcon} from './NetworkIcons';
import {handleInterceptedCrash} from '../customHooks/crashHandler';
import {CrashType} from '../types/enums';

export interface ModuleErrorBoundaryProps {
  /** Name of the UI module / micro-feature */
  moduleName?: string;
  /** Custom fallback view or render function */
  fallback?: ReactNode | ((error: Error, retry: () => void) => ReactNode);
  /** Component children inside this isolated fault boundary */
  children: ReactNode;
  /** Callback fired when an error is caught */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** Callback fired when the user attempts a retry */
  onRetry?: () => void;
  /** Custom container style for the error card */
  containerStyle?: StyleProp<ViewStyle>;
}

interface ModuleErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  copied: boolean;
}

export class ModuleErrorBoundary extends Component<
  ModuleErrorBoundaryProps,
  ModuleErrorBoundaryState
> {
  state: ModuleErrorBoundaryState = {
    hasError: false,
    error: null,
    copied: false,
  };

  static getDerivedStateFromError(
    error: Error,
  ): Partial<ModuleErrorBoundaryState> {
    return {hasError: true, error};
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Intercept and register the crash into InAppInspector's Crash telemetry
    try {
      handleInterceptedCrash(
        error,
        error?.stack,
        false,
        CrashType.Js,
        errorInfo.componentStack || undefined,
      );
    } catch {
      // safe fallback
    }

    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({hasError: false, error: null, copied: false});
    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };

  handleCopy = () => {
    if (!this.state.error) return;
    const details = `[Module Error: ${
      this.props.moduleName || 'Micro-Feature'
    }]\nMessage: ${this.state.error.message}\nStack: ${
      this.state.error.stack || 'N/A'
    }`;
    copyToClipboard(details);
    this.setState({copied: true});
    setTimeout(() => {
      this.setState({copied: false});
    }, 2000);
  };

  render() {
    if (this.state.hasError && this.state.error) {
      const {fallback, moduleName = 'UI Module', containerStyle} = this.props;

      if (typeof fallback === 'function') {
        return fallback(this.state.error, this.handleRetry);
      }
      if (fallback) {
        return fallback;
      }

      return (
        <View style={[styles.card, containerStyle]}>
          <View style={styles.headerRow}>
            <View style={styles.titleRow}>
              <WarningTriangleIcon color="#DC2626" size={16} />
              <Text style={styles.moduleName} numberOfLines={1}>
                {moduleName}
              </Text>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>FAULT ISOLATED</Text>
            </View>
          </View>

          <Text style={styles.message} numberOfLines={2}>
            {this.state.error.message ||
              'An unexpected rendering error occurred in this module.'}
          </Text>

          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={this.handleRetry}
              activeOpacity={0.7}>
              <RefreshCcwIcon color="#FFFFFF" size={12} />
              <Text style={styles.retryText}>Retry Module</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.copyButton}
              onPress={this.handleCopy}
              activeOpacity={0.7}>
              <CopyIcon color="#475569" size={12} />
              <Text style={styles.copyText}>
                {this.state.copied ? 'Copied' : 'Copy Error'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

export default ModuleErrorBoundary;

const styles = StyleSheet.create({
  card: {
    backgroundColor: AppColors.red50,
    borderColor: `${AppColors.red500}33`,
    borderWidth: 1.2,
    borderRadius: 16,
    padding: 14,
    marginVertical: 6,
    gap: 10,
    ...Platform.select({
      ios: {
        shadowColor: AppColors.red600,
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.06,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 1,
  },
  moduleName: {
    fontSize: 12.5,
    fontWeight: '800',
    color: AppColors.redErrorText,
    fontFamily: AppFonts.interBold,
    flexShrink: 1,
  },
  badge: {
    backgroundColor: AppColors.red100,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: `${AppColors.red500}4D`,
  },
  badgeText: {
    fontSize: 8.5,
    fontWeight: '800',
    color: AppColors.rose700,
    letterSpacing: 0.4,
  },
  message: {
    fontSize: 11.5,
    color: AppColors.redErrorText,
    lineHeight: 16,
    fontFamily: AppFonts.interRegular,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  retryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: AppColors.red600,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 9,
  },
  retryText: {
    fontSize: 11,
    fontWeight: '700',
    color: AppColors.white,
    fontFamily: AppFonts.interBold,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: AppColors.graySurface,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: AppColors.grayBorderSecondary,
  },
  copyText: {
    fontSize: 11,
    fontWeight: '600',
    color: AppColors.grayText,
    fontFamily: AppFonts.interMedium,
  },
});
