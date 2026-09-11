import React, {useState, useEffect} from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Linking,
} from 'react-native';
import Svg, {Path} from 'react-native-svg';
import {BrandCircleIcon} from '../BrandCircleIcon';
import {NpmIcon} from '../NetworkIcons';
import {LIB_VERSION} from '../../constants';
import {copyToClipboard} from '../../helpers';
import {showToast} from '../../helpers/toast';
import {AppFonts} from '../../styles/AppFonts';
import {AppColors} from '../../styles/AppColors';

// ─── Crisp SVG Icons ─────────────────────────────────────────────────────────

const CopySvg = ({size = 14, color = AppColors.grayTextWeak}: {size?: number; color?: string}) => (
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

const CheckSvg = ({size = 14, color = AppColors.emerald500}: {size?: number; color?: string}) => (
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

const ExternalLinkSvg = ({size = 13, color = AppColors.white}: {size?: number; color?: string}) => (
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

const CloseSvg = ({size = 13, color = AppColors.grayTextWeak}: {size?: number; color?: string}) => (
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

const SparkleSvg = ({size = 14, color = AppColors.amber500}: {size?: number; color?: string}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 2l2.4 6.6L21 11l-6.6 2.4L12 20l-2.4-6.6L3 11l6.6-2.4L12 2z"
      fill={color}
    />
  </Svg>
);

const ArrowRightSvg = ({size = 14, color = AppColors.slate400}: {size?: number; color?: string}) => (
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
            <CloseSvg size={13} color={AppColors.grayTextWeak} />
          </TouchableOpacity>

          {/* Icon Halo + Sparkle */}
          <View style={styles.headerSection}>
            <View style={styles.iconHaloRing}>
              <BrandCircleIcon size={38} />
              <View style={styles.sparkleBadge}>
                <SparkleSvg size={13} color={AppColors.amber500} />
              </View>
            </View>
            <Text style={styles.title}>Update Available</Text>
            <Text style={styles.subtitle}>
              A new version of react-native-inapp-inspector is ready to install
            </Text>
          </View>

          {/* Version Diff Card */}
          <View style={styles.versionComparisonCard}>
            <View style={styles.versionColumn}>
              <Text style={styles.versionLabel}>INSTALLED</Text>
              <View style={styles.installedChip}>
                <Text style={styles.installedText}>v{LIB_VERSION}</Text>
              </View>
            </View>

            <View style={styles.arrowContainer}>
              <ArrowRightSvg size={14} color={AppColors.slate400} />
            </View>

            <View style={styles.versionColumn}>
              <Text style={styles.versionLabel}>LATEST</Text>
              <View style={styles.latestChip}>
                <NpmIcon size={12} color={AppColors.npmRed} />
                <Text style={styles.latestText}>v{latestVersion}</Text>
              </View>
            </View>
          </View>

          {/* Terminal / Code Snippet */}
          <View style={styles.codeSnippetBox}>
            <View style={styles.codeSnippetHeader}>
              <Text style={styles.codeSnippetLabel}>UPGRADE COMMAND</Text>
              {copied && (
                <View style={styles.copiedIndicator}>
                  <CheckSvg size={11} color={AppColors.emerald500} />
                  <Text style={styles.copiedText}>Copied</Text>
                </View>
              )}
            </View>

            <TouchableOpacity
              activeOpacity={0.75}
              onPress={handleCopyCommand}
              style={styles.commandRow}>
              <Text style={styles.commandText} numberOfLines={1}>
                {installCommand}
              </Text>
              <View style={styles.copyIconWrapper}>
                {copied ? <CheckSvg size={14} color={AppColors.emerald500} /> : <CopySvg size={14} color={AppColors.grayTextWeak} />}
              </View>
            </TouchableOpacity>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleClose}
              style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>Later</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleOpenNpm}
              style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>View on NPM</Text>
              <ExternalLinkSvg size={12} color={AppColors.white} />
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const fontStack = {
  fontFamily: AppFonts.interRegular,
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: AppColors.overlayDark,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 999999,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: AppColors.primaryLight,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: AppColors.dividerColor,
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 20,
    alignItems: 'center',
    shadowColor: AppColors.shadowColorString,
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
    backgroundColor: AppColors.grayBackground,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: AppColors.dividerColor,
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
    backgroundColor: AppColors.purple50,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: AppColors.purple100,
    marginBottom: 8,
    shadowColor: AppColors.offerPurple,
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
    backgroundColor: AppColors.paleYellow,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: AppColors.white,
  },
  title: {
    fontSize: 17.5,
    fontWeight: '800',
    color: AppColors.primaryBlack,
    letterSpacing: -0.4,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 2,
    ...fontStack,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: AppColors.grayTextWeak,
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 8,
    ...fontStack,
  },
  versionComparisonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: AppColors.grayBackground,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: AppColors.dividerColor,
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
    color: AppColors.slate400,
    letterSpacing: 0.6,
    ...fontStack,
  },
  installedChip: {
    backgroundColor: AppColors.grayBorderSecondary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  installedText: {
    fontSize: 12,
    fontWeight: '700',
    color: AppColors.grayText,
    ...fontStack,
  },
  arrowContainer: {
    paddingHorizontal: 6,
  },
  arrowText: {
    fontSize: 14,
    color: AppColors.slate400,
    fontWeight: '700',
  },
  latestChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: AppColors.violetSoftBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: AppColors.violetSoftBorder,
  },
  latestText: {
    fontSize: 12,
    fontWeight: '800',
    color: AppColors.offerPurple,
    ...fontStack,
  },
  codeSnippetBox: {
    backgroundColor: AppColors.slate900,
    borderRadius: 12,
    padding: 10,
    width: '100%',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: AppColors.slate800,
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
    color: AppColors.grayTextWeak,
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
    color: AppColors.emerald500,
    ...fontStack,
  },
  commandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: AppColors.slate800,
    borderRadius: 8,
    paddingVertical: 7,
    paddingHorizontal: 9,
    gap: 8,
  },
  commandText: {
    flex: 1,
    fontSize: 11,
    fontFamily: AppFonts.interRegular,
    color: AppColors.sky400,
  },
  copyIconWrapper: {
    width: 22,
    height: 22,
    borderRadius: 6,
    backgroundColor: AppColors.slate700,
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
    backgroundColor: AppColors.graySurface,
    borderWidth: 1,
    borderColor: AppColors.dividerColor,
  },
  secondaryButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: AppColors.grayText,
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
    backgroundColor: AppColors.offerPurple,
    shadowColor: AppColors.offerPurple,
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.28,
    shadowRadius: 6,
    elevation: 4,
  },
  primaryButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: AppColors.white,
    ...fontStack,
  },
});

export default UpdateAvailableModal;
