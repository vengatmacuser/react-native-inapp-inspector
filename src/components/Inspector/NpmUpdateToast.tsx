import React, {useState, useEffect, useRef} from 'react';
import {
  Animated,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, {Path} from 'react-native-svg';
import {useInspector} from './InspectorContext';
import {LIB_VERSION} from '../../constants';
import {NpmIcon} from '../NetworkIcons';
import {copyToClipboard} from '../../helpers';
import {showToast} from '../../helpers/toast';
import {AppColors} from '../../styles/AppColors';
import {AppFonts} from '../../styles/AppFonts';
import {useTranslation} from '../../i18n';

const CloseSvg = ({size = 13, color = AppColors.slate400}: {size?: number; color?: string}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M18 6L6 18M6 6l12 12"
      stroke={color}
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const CopySvg = ({size = 11, color = AppColors.slate400}: {size?: number; color?: string}) => (
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

const CheckSvg = ({size = 11, color = AppColors.greenColor}: {size?: number; color?: string}) => (
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

const ExternalLinkSvg = ({size = 11, color = AppColors.white}: {size?: number; color?: string}) => (
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

const TOAST_TIMEOUT_MS = 7000;

export const NpmUpdateToast = () => {
  const {t} = useTranslation();
  const {updateAvailable, latestNpmVersion, showUpdateToast} = useInspector();
  const [dismissed, setDismissed] = useState(false);
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  const translateYAnim = useRef(new Animated.Value(60)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(1)).current;
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (showUpdateToast && updateAvailable && latestNpmVersion && !dismissed) {
      setVisible(true);

      // Slide and fade in
      Animated.parallel([
        Animated.spring(translateYAnim, {
          toValue: 0,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();

      // Progress bar countdown from 1 to 0
      progressAnim.setValue(1);
      Animated.timing(progressAnim, {
        toValue: 0,
        duration: TOAST_TIMEOUT_MS,
        useNativeDriver: false,
      }).start();

      // Auto-hide after timeout
      timerRef.current = setTimeout(() => {
        handleDismiss();
      }, TOAST_TIMEOUT_MS);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [showUpdateToast, updateAvailable, latestNpmVersion, dismissed]);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(translateYAnim, {
        toValue: 60,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setVisible(false);
      setDismissed(true);
    });
  };

  const handleCopyCommand = () => {
    copyToClipboard('npm install react-native-inapp-inspector@latest', 'Install Command');
    setCopied(true);
    showToast('Copied npm install command!');
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  const handleOpenNpm = () => {
    Linking.openURL('https://www.npmjs.com/package/react-native-inapp-inspector').catch(() => {});
    handleDismiss();
  };

  if (typeof __DEV__ === 'undefined' || !__DEV__ || !showUpdateToast || !visible || !updateAvailable || !latestNpmVersion) return null;

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: opacityAnim,
          transform: [{translateY: translateYAnim}],
        },
      ]}>
      <View style={styles.contentRow}>
        {/* Left NPM Badge Icon */}
        <View style={styles.npmIconContainer}>
          <NpmIcon size={15} color={AppColors.npmRed} />
        </View>

        <View style={styles.textContainer}>
          <View style={styles.titleRow}>
            <Text style={styles.titleText}>{t('header.newVersionAvailable', 'Update Available')}</Text>
            <View style={styles.versionPill}>
              <Text style={styles.versionPillText}>v{latestNpmVersion}</Text>
            </View>
          </View>
          <Text style={styles.subtitleText}>
            {t('header.updateAvailable', {latestVersion: latestNpmVersion, currentVersion: LIB_VERSION, defaultValue: `react-native-inapp-inspector v${latestNpmVersion} is available on NPM.`})}
          </Text>
        </View>

        {/* Copy command button */}
        <TouchableOpacity
          style={styles.copyButton}
          onPress={handleCopyCommand}
          activeOpacity={0.7}
          hitSlop={{top: 8, bottom: 8, left: 4, right: 4}}>
          {copied ? <CheckSvg size={11} color={AppColors.greenColor} /> : <CopySvg size={11} color={AppColors.slate400} />}
          <Text style={[styles.copyButtonText, copied && {color: AppColors.greenColor}]}>
            {copied ? t('common.copied', 'Copied') : t('header.copyCommand', 'Copy')}
          </Text>
        </TouchableOpacity>

        {/* View on npm button */}
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleOpenNpm}
          activeOpacity={0.8}
          hitSlop={{top: 8, bottom: 8, left: 4, right: 4}}>
          <Text style={styles.actionButtonText}>{t('header.viewNpm', 'View')}</Text>
          <ExternalLinkSvg size={10} color={AppColors.white} />
        </TouchableOpacity>

        {/* Dismiss button */}
        <TouchableOpacity
          style={styles.closeButton}
          onPress={handleDismiss}
          activeOpacity={0.7}
          hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
          <CloseSvg size={12} color={AppColors.slate400} />
        </TouchableOpacity>
      </View>

      {/* Animated Linear Timeout Progress Bar */}
      <View style={styles.progressBarTrack}>
        <Animated.View style={[styles.progressBarFill, {width: progressWidth}]} />
      </View>
    </Animated.View>
  );
};

const fontStack = {
  fontFamily: AppFonts.interRegular,
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 24,
    left: 14,
    right: 14,
    backgroundColor: AppColors.slate900,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: AppColors.slate700,
    shadowColor: AppColors.black,
    shadowOffset: {width: 0, height: 12},
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 24,
    overflow: 'hidden',
    zIndex: 99999,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 12,
    gap: 8,
  },
  npmIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: AppColors.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: AppColors.slate200,
    flexShrink: 0,
    shadowColor: AppColors.black,
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  textContainer: {
    flex: 1,
    minWidth: 0,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  titleText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: AppColors.slate50,
    letterSpacing: -0.2,
    ...fontStack,
  },
  versionPill: {
    backgroundColor: `${AppColors.offerPurple}33`,
    paddingHorizontal: 5.5,
    paddingVertical: 1.5,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: `${AppColors.violet500}80`,
  },
  versionPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: AppColors.purpleLightMuted,
    ...fontStack,
  },
  subtitleText: {
    fontSize: 10.5,
    color: AppColors.slate400,
    marginTop: 1,
    ...fontStack,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3.5,
    backgroundColor: AppColors.slate800,
    paddingVertical: 5.5,
    paddingHorizontal: 8,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: AppColors.slate700,
    flexShrink: 0,
  },
  copyButtonText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: AppColors.slate400,
    ...fontStack,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3.5,
    backgroundColor: AppColors.offerPurple,
    paddingVertical: 5.5,
    paddingHorizontal: 9,
    borderRadius: 7,
    flexShrink: 0,
    shadowColor: AppColors.offerPurple,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: AppColors.white,
    ...fontStack,
  },
  closeButton: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: AppColors.slate800,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  progressBarTrack: {
    height: 2.5,
    width: '100%',
    backgroundColor: AppColors.slate800,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: AppColors.violet500,
  },
});

export default NpmUpdateToast;
