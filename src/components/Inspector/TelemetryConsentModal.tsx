import React, {useState, useEffect} from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import {AppColors} from '../../styles/AppColors';
import {BrandCircleIcon} from '../BrandCircleIcon';
import {
  getTelemetryConsentStatus,
  setTelemetryConsent,
  sendSessionTelemetryPing,
} from '../../helpers/telemetry';

export const TelemetryConsentModal = () => {
  const [visible, setVisible] = useState(false);
  const fadeAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    let isMounted = true;
    getTelemetryConsentStatus().then(status => {
      if (isMounted && status === 'undetermined') {
        setVisible(true);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      }
    });
    return () => {
      isMounted = false;
    };
  }, [fadeAnim]);

  const handleDecision = async (granted: boolean) => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(async () => {
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
        <Animated.View style={[styles.card, {opacity: fadeAnim}]}>
          <View style={styles.headerRow}>
            <View style={styles.iconWrapper}>
              <BrandCircleIcon size={40} />
            </View>
            <View style={styles.titleContainer}>
              <Text style={styles.title}>Help Improve In-App Inspector</Text>
              <Text style={styles.subtitle}>Anonymous Diagnostic Insights</Text>
            </View>
          </View>

          <Text style={styles.description}>
            To help us continually enhance tooling performance and compatibility,
            would you mind sharing anonymous diagnostics (such as React Native
            version, JavaScript engine, and platform architecture)?
          </Text>

          <View style={styles.privacyBadge}>
            <Text style={styles.privacyText}>
              🔒 <Text style={{fontWeight: '700'}}>Privacy Guaranteed:</Text> We
              only collect non-identifiable environment metrics. No personal
              data, tokens, or network request payloads are ever collected.
            </Text>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.declineButton}
              onPress={() => handleDecision(false)}
              activeOpacity={0.7}>
              <Text style={styles.declineText}>Not Now</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.allowButton}
              onPress={() => handleDecision(true)}
              activeOpacity={0.8}>
              <Text style={styles.allowText}>Allow & Share</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    zIndex: 999999,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#1E1F29',
    borderRadius: 20,
    padding: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 10},
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  iconWrapper: {
    marginRight: 14,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 12,
    color: AppColors.purple || '#9055FF',
    fontWeight: '600',
    marginTop: 2,
  },
  description: {
    fontSize: 13,
    lineHeight: 19,
    color: 'rgba(255, 255, 255, 0.75)',
    marginBottom: 14,
  },
  privacyBadge: {
    backgroundColor: 'rgba(144, 85, 255, 0.12)',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(144, 85, 255, 0.25)',
    marginBottom: 20,
  },
  privacyText: {
    fontSize: 11,
    lineHeight: 16,
    color: '#D8C6FF',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 12,
  },
  declineButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  declineText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  allowButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: '#7C3AED',
  },
  allowText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default TelemetryConsentModal;
