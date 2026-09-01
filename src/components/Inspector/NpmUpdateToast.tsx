import React, {useState, useEffect, useRef} from 'react';
import {
  Animated,
  Linking,
  Platform,
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

const CloseSvg = ({size = 13, color = '#94A3B8'}: {size?: number; color?: string}) => (
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

const CopySvg = ({size = 11, color = '#94A3B8'}: {size?: number; color?: string}) => (
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

const CheckSvg = ({size = 11, color = '#10B981'}: {size?: number; color?: string}) => (
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

const ExternalLinkSvg = ({size = 11, color = '#FFFFFF'}: {size?: number; color?: string}) => (
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
          <NpmIcon size={15} color="#CB3837" />
        </View>

        {/* Text Details */}
        <View style={styles.textContainer}>
          <View style={styles.titleRow}>
            <Text style={styles.titleText}>Update Available</Text>
            <View style={styles.versionPill}>
              <Text style={styles.versionPillText}>v{latestNpmVersion}</Text>
            </View>
          </View>
          <Text style={styles.subtitleText} numberOfLines={1}>
            Installed: v{LIB_VERSION} • New version is ready
          </Text>
        </View>

        {/* Copy command quick button */}
        <TouchableOpacity
          style={styles.copyButton}
          onPress={handleCopyCommand}
          hitSlop={6}
          activeOpacity={0.75}>
          {copied ? <CheckSvg size={11} color="#10B981" /> : <CopySvg size={11} color="#94A3B8" />}
          <Text style={[styles.copyButtonText, copied && {color: '#10B981'}]}>
            {copied ? 'Copied' : 'Copy'}
          </Text>
        </TouchableOpacity>

        {/* Action Button: View */}
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleOpenNpm}
          activeOpacity={0.8}>
          <Text style={styles.actionButtonText}>View</Text>
          <ExternalLinkSvg size={10} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Close Button */}
        <TouchableOpacity
          style={styles.closeButton}
          onPress={handleDismiss}
          hitSlop={8}
          activeOpacity={0.7}>
          <CloseSvg size={12} color="#94A3B8" />
        </TouchableOpacity>
      </View>

      {/* Animated Linear Timeout Progress Bar */}
      <View style={styles.progressBarTrack}>
        <Animated.View style={[styles.progressBarFill, {width: progressWidth}]} />
      </View>
    </Animated.View>
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
  container: {
    position: 'absolute',
    bottom: 24,
    left: 14,
    right: 14,
    backgroundColor: '#0F172A',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
    shadowColor: '#000000',
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
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexShrink: 0,
    shadowColor: '#000000',
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
    color: '#F8FAFC',
    letterSpacing: -0.2,
    ...fontStack,
  },
  versionPill: {
    backgroundColor: '#7C3AED33',
    paddingHorizontal: 5.5,
    paddingVertical: 1.5,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#8B5CF680',
  },
  versionPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#C4B5FD',
    ...fontStack,
  },
  subtitleText: {
    fontSize: 10.5,
    color: '#94A3B8',
    marginTop: 1,
    ...fontStack,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3.5,
    backgroundColor: '#1E293B',
    paddingVertical: 5.5,
    paddingHorizontal: 8,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: '#334155',
    flexShrink: 0,
  },
  copyButtonText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#94A3B8',
    ...fontStack,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3.5,
    backgroundColor: '#7C3AED',
    paddingVertical: 5.5,
    paddingHorizontal: 9,
    borderRadius: 7,
    flexShrink: 0,
    shadowColor: '#7C3AED',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    ...fontStack,
  },
  closeButton: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  progressBarTrack: {
    height: 2.5,
    width: '100%',
    backgroundColor: '#1E293B',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#8B5CF6',
  },
});

export default NpmUpdateToast;
