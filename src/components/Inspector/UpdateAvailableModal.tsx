import React, {useState, useEffect} from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
  Linking,
} from 'react-native';
import Svg, {Path} from 'react-native-svg';
import {BrandSquareIcon} from '../BrandSquareIcon';
import {NpmIcon} from '../NetworkIcons';
import {LIB_VERSION} from '../../constants';
import {copyToClipboard} from '../../helpers';
import {showToast} from '../../helpers/toast';

// ─── Crisp SVG Icons ─────────────────────────────────────────────────────────

const CopySvg = ({size = 14, color = '#64748B'}: {size?: number; color?: string}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M8 4v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2h-8a2 2 0 0 0-2 2z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const CheckSvg = ({size = 14, color = '#10B981'}: {size?: number; color?: string}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M20 6L9 17l-5-5"
      stroke={color}
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const ExternalLinkSvg = ({size = 13, color = '#FFFFFF'}: {size?: number; color?: string}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M15 3h6v6"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M10 14L21 3"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const CloseSvg = ({size = 13, color = '#64748B'}: {size?: number; color?: string}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M18 6L6 18M6 6l12 12"
      stroke={color}
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const SparkleSvg = ({size = 14, color = '#F59E0B'}: {size?: number; color?: string}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 2l2.4 6.6L21 11l-6.6 2.4L12 20l-2.4-6.6L3 11l6.6-2.4L12 2z"
      fill={color}
    />
  </Svg>
);

const ArrowRightSvg = ({size = 14, color = '#94A3B8'}: {size?: number; color?: string}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M5 12h14M12 5l7 7-7 7"
      stroke={color}
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

interface UpdateAvailableModalProps {
  visible: boolean;
  latestVersion: string | null;
  onClose: () => void;
}

export const UpdateAvailableModal: React.FC<UpdateAvailableModalProps> = ({
  visible,
  latestVersion,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);
  const fadeAnim = useState(new Animated.Value(0))[0];
  const scaleAnim = useState(new Animated.Value(0.92))[0];

  const installCommand = `npm install react-native-inapp-inspector@latest`;

  if (typeof __DEV__ === 'undefined' || !__DEV__) return null;

  useEffect(() => {
    if (visible) {
      setCopied(false);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 50,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, fadeAnim, scaleAnim]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 160,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.92,
        duration: 160,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  const handleCopyCommand = () => {
    copyToClipboard(installCommand, 'Install Command');
    setCopied(true);
    showToast('Copied npm install command to clipboard!');
    setTimeout(() => {
      setCopied(false);
    }, 2500);
  };

  const handleOpenNpm = () => {
    Linking.openURL('https://www.npmjs.com/package/react-native-inapp-inspector').catch(() => {});
    handleClose();
  };

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.card,
            {
              opacity: fadeAnim,
              transform: [{scale: scaleAnim}],
            },
          ]}>
          {/* Top-Right Dismiss Button */}
          <TouchableOpacity
            style={styles.topCloseButton}
            onPress={handleClose}
            hitSlop={10}
            activeOpacity={0.7}>
            <CloseSvg size={13} color="#64748B" />
          </TouchableOpacity>

          {/* Header section with brand square icon & sparkle */}
          <View style={styles.headerSection}>
            <View style={styles.iconHaloRing}>
              <BrandSquareIcon size={52} />
              <View style={styles.sparkleBadge}>
                <SparkleSvg size={13} color="#F59E0B" />
              </View>
            </View>

            <Text style={styles.title}>Update Available</Text>
            <Text style={styles.subtitle}>
              A newer release of react-native-inapp-inspector is ready
            </Text>
          </View>

          {/* Version Comparison Card */}
          <View style={styles.versionComparisonCard}>
            <View style={styles.versionColumn}>
              <Text style={styles.versionLabel}>INSTALLED</Text>
              <View style={styles.installedChip}>
                <Text style={styles.installedText}>v{LIB_VERSION}</Text>
              </View>
            </View>

            <View style={styles.arrowContainer}>
              <ArrowRightSvg size={14} color="#94A3B8" />
            </View>

            <View style={styles.versionColumn}>
              <Text style={styles.versionLabel}>LATEST ON NPM</Text>
              <View style={styles.latestChip}>
                <NpmIcon size={12} color="#CB3837" />
                <Text style={styles.latestText}>v{latestVersion || 'latest'}</Text>
              </View>
            </View>
          </View>

          {/* Quick Install Snippet Box */}
          <View style={styles.codeSnippetBox}>
            <View style={styles.codeSnippetHeader}>
              <Text style={styles.codeSnippetLabel}>UPGRADE COMMAND</Text>
              {copied && (
                <View style={styles.copiedIndicator}>
                  <CheckSvg size={11} color="#10B981" />
                  <Text style={styles.copiedText}>Copied</Text>
                </View>
              )}
            </View>

            <TouchableOpacity
              style={styles.commandRow}
              onPress={handleCopyCommand}
              activeOpacity={0.75}>
              <Text style={styles.commandText} numberOfLines={1}>
                {installCommand}
              </Text>
              <View style={styles.copyIconWrapper}>
                {copied ? <CheckSvg size={14} color="#10B981" /> : <CopySvg size={14} color="#64748B" />}
              </View>
            </TouchableOpacity>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleClose}
              activeOpacity={0.7}>
              <Text style={styles.secondaryButtonText}>Later</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleOpenNpm}
              activeOpacity={0.85}>
              <Text style={styles.primaryButtonText}>View on NPM</Text>
              <ExternalLinkSvg size={12} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const fontStack = Platform.select({
  ios: {
    fontFamily: 'System',
  },
  android: {
    fontFamily: 'sans-serif',
  },
  default: {},
});

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.62)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 999999,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 20,
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOffset: {width: 0, height: 18},
    shadowOpacity: 0.24,
    shadowRadius: 36,
    elevation: 24,
  },
  topCloseButton: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    zIndex: 10,
  },
  headerSection: {
    alignItems: 'center',
    width: '100%',
    marginBottom: 12,
  },
  iconHaloRing: {
    width: 66,
    height: 66,
    borderRadius: 20,
    backgroundColor: '#FAF5FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#F3E8FF',
    marginBottom: 8,
    shadowColor: '#7C3AED',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.16,
    shadowRadius: 10,
    elevation: 4,
  },
  sparkleBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  title: {
    fontSize: 17.5,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.4,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 2,
    ...fontStack,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 8,
    ...fontStack,
  },
  versionComparisonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 12,
    width: '100%',
  },
  versionColumn: {
    alignItems: 'center',
    gap: 4,
  },
  versionLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.6,
    ...fontStack,
  },
  installedChip: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  installedText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    ...fontStack,
  },
  arrowContainer: {
    paddingHorizontal: 6,
  },
  arrowText: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '700',
  },
  latestChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  latestText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#6D28D9',
    ...fontStack,
  },
  codeSnippetBox: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 10,
    width: '100%',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  codeSnippetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  codeSnippetLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.6,
    ...fontStack,
  },
  copiedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  copiedText: {
    fontSize: 9.5,
    fontWeight: '600',
    color: '#10B981',
    ...fontStack,
  },
  commandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1E293B',
    borderRadius: 8,
    paddingVertical: 7,
    paddingHorizontal: 9,
    gap: 8,
  },
  commandText: {
    flex: 1,
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: '#38BDF8',
  },
  copyIconWrapper: {
    width: 22,
    height: 22,
    borderRadius: 6,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
    width: '100%',
  },
  secondaryButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  secondaryButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    ...fontStack,
  },
  primaryButton: {
    flex: 1.3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: '#7C3AED',
    shadowColor: '#7C3AED',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.28,
    shadowRadius: 6,
    elevation: 4,
  },
  primaryButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    ...fontStack,
  },
});

export default UpdateAvailableModal;
