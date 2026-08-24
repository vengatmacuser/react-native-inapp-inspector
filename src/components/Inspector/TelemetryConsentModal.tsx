import React, {useState, useEffect} from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
} from 'react-native';
import Svg, {Path} from 'react-native-svg';
import {BrandSquareIcon} from '../BrandSquareIcon';
import {
  getTelemetryConsentStatus,
  setTelemetryConsent,
  sendSessionTelemetryPing,
} from '../../helpers/telemetry';

// ─── Inline Crisp SVG Icons ───────────────────────────────────────────────────

const ShieldCheckSvg = ({size = 15, color = '#7C3AED'}: {size?: number; color?: string}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M9 12l2 2 4-4"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const CheckSvg = ({size = 14, color = '#FFFFFF'}: {size?: number; color?: string}) => (
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

const GearSvg = ({size = 13, color = '#6366F1'}: {size?: number; color?: string}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1Z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const TelemetryConsentModal = () => {
  const [visible, setVisible] = useState(false);
  const fadeAnim = useState(new Animated.Value(0))[0];
  const scaleAnim = useState(new Animated.Value(0.92))[0];

  useEffect(() => {
    let isMounted = true;
    getTelemetryConsentStatus().then(status => {
      if (isMounted && status === 'undetermined') {
        setVisible(true);
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 250,
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            friction: 8,
            tension: 45,
            useNativeDriver: true,
          }),
        ]).start();
      }
    });
    return () => {
      isMounted = false;
    };
  }, [fadeAnim, scaleAnim]);

  const handleDecision = async (granted: boolean) => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.92,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(async () => {
      setVisible(false);
      await setTelemetryConsent(granted);
      if (granted) {
        // Immediately trigger the session initialization ping
        sendSessionTelemetryPing({force: true});
      }
    });
  };

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      statusBarTranslucent>
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.card,
            {
              opacity: fadeAnim,
              transform: [{scale: scaleAnim}],
            },
          ]}>
          {/* Top-Right Dismiss Icon Button */}
          <TouchableOpacity
            style={styles.topCloseButton}
            onPress={() => handleDecision(false)}
            hitSlop={10}
            activeOpacity={0.7}>
            <CloseSvg size={13} color="#64748B" />
          </TouchableOpacity>

          {/* Centered Enlarged Square Brand Icon Header */}
          <View style={styles.headerSection}>
            <View style={styles.iconHaloRing}>
              <BrandSquareIcon size={54} />
            </View>

            <Text style={styles.title}>Help Improve In-App Inspector</Text>
            <Text style={styles.subtitle}>Anonymous Diagnostic Insights</Text>

            {/* Subheading instruction hint badge */}
            <View style={styles.hintBadge}>
              <GearSvg size={12} color="#6366F1" />
              <Text style={styles.hintBadgeText}>
                You can enable or disable this anytime in Settings
              </Text>
            </View>
          </View>

          {/* Description */}
          <Text style={styles.description}>
            To help us continually enhance tooling performance and compatibility,
            would you mind sharing anonymous diagnostics (such as React Native
            version, JavaScript engine, and device architecture)?
          </Text>

          {/* Privacy Callout Box */}
          <View style={styles.privacyBadge}>
            <View style={styles.privacyShieldWrapper}>
              <ShieldCheckSvg size={15} color="#7C3AED" />
            </View>
            <Text style={styles.privacyText}>
              <Text style={styles.privacyHighlight}>Privacy Guaranteed:</Text> We
              strictly collect non-identifiable technical metrics. No user data,
              passwords, tokens, or network payload bodies are ever captured.
            </Text>
          </View>

          {/* Enhanced Action Buttons with Icons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.declineButton}
              onPress={() => handleDecision(false)}
              activeOpacity={0.7}>
              <CloseSvg size={12} color="#64748B" />
              <Text style={styles.declineText}>Not Now</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.allowButton}
              onPress={() => handleDecision(true)}
              activeOpacity={0.85}>
              <CheckSvg size={13} color="#FFFFFF" />
              <Text style={styles.allowText}>Allow & Share</Text>
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
    backgroundColor: 'rgba(15, 23, 42, 0.56)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 999999,
  },
  card: {
    width: '100%',
    maxWidth: 356,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 20,
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOffset: {width: 0, height: 16},
    shadowOpacity: 0.22,
    shadowRadius: 32,
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
    marginBottom: 4,
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
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.4,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 2,
    ...fontStack,
  },
  subtitle: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#7C3AED',
    textAlign: 'center',
    letterSpacing: 0.2,
    marginBottom: 6,
    ...fontStack,
  },
  hintBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: '#EDE9FE80',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    borderRadius: 7,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 8,
  },
  hintBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6D28D9',
    textAlign: 'center',
    ...fontStack,
  },
  description: {
    fontSize: 12,
    lineHeight: 17.5,
    color: '#475569',
    textAlign: 'center',
    marginBottom: 12,
    paddingHorizontal: 2,
    ...fontStack,
  },
  privacyBadge: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
    width: '100%',
  },
  privacyShieldWrapper: {
    marginRight: 7,
    marginTop: 1,
  },
  privacyText: {
    flex: 1,
    fontSize: 10.8,
    lineHeight: 15,
    color: '#475569',
    ...fontStack,
  },
  privacyHighlight: {
    fontWeight: '700',
    color: '#1E293B',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
    width: '100%',
  },
  declineButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  declineText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    ...fontStack,
  },
  allowButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: '#7C3AED',
    shadowColor: '#7C3AED',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.28,
    shadowRadius: 6,
    elevation: 4,
  },
  allowText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    ...fontStack,
  },
});

export default TelemetryConsentModal;
