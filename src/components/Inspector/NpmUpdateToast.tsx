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

const ExternalLinkSvg = ({size = 12, color = '#FFFFFF'}: {size?: number; color?: string}) => (
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

const TOAST_TIMEOUT_MS = 6500;

export const NpmUpdateToast = () => {
  const {updateAvailable, latestNpmVersion, showUpdateToast} = useInspector();
  const [dismissed, setDismissed] = useState(false);
  const [visible, setVisible] = useState(false);

  const translateYAnim = useRef(new Animated.Value(50)).current;
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
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(translateYAnim, {
        toValue: 50,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setVisible(false);
      setDismissed(true);
    });
  };

  const handleOpenNpm = () => {
    Linking.openURL('https://www.npmjs.com/package/react-native-inapp-inspector').catch(() => {});
    handleDismiss();
  };

  if (!showUpdateToast || !visible || !updateAvailable || !latestNpmVersion) return null;

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
          <NpmIcon size={14} color="#CB3837" />
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
    left: 16,
    right: 16,
    backgroundColor: '#0F172A',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
    shadowColor: '#000000',
    shadowOffset: {width: 0, height: 10},
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 20,
    overflow: 'hidden',
    zIndex: 99999,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 10,
  },
  npmIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    flexShrink: 0,
  },
  textContainer: {
    flex: 1,
    minWidth: 0,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  titleText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F8FAFC',
    letterSpacing: -0.2,
    ...fontStack,
  },
  versionPill: {
    backgroundColor: '#7C3AED26',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#7C3AED59',
  },
  versionPillText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#A78BFA',
    ...fontStack,
  },
  subtitleText: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 1.5,
    ...fontStack,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#7C3AED',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    flexShrink: 0,
    shadowColor: '#7C3AED',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtonText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#FFFFFF',
    ...fontStack,
  },
  closeButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  progressBarTrack: {
    height: 3,
    width: '100%',
    backgroundColor: '#1E293B',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#7C3AED',
  },
});

export default NpmUpdateToast;
