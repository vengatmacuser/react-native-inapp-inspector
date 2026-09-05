import React, {useEffect, useRef, useState} from 'react';
import {
  Animated,
  Linking,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {AppColors} from '../../styles/AppColors';
import {AppFonts} from '../../styles/AppFonts';
import TouchableScale from '../TouchableScale';
import {loadSettings, saveSettings} from '../../helpers/settingsStore';
import {trackTelemetryEvent} from '../../helpers/telemetry';
import {
  StarIcon,
  CloseWhite,
  CheckIcon,
  GitHubIcon,
  NpmIcon,
  ClockIcon,
} from '../NetworkIcons';

// 5-day interval in milliseconds
const FIVE_DAYS_MS = 5 * 24 * 60 * 60 * 1000;
const GITHUB_REPO_URL =
  'https://github.com/vengatmacuser/react-native-inapp-inspector';
const NPM_PACKAGE_URL =
  'https://www.npmjs.com/package/react-native-inapp-inspector';

export const NpmStarPrompt: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const slideAnim = useRef(new Animated.Value(200)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let isMounted = true;

    async function checkEligibility() {
      try {
        const settings = await loadSettings();

        // 1. If user already actioned the prompt, never show again permanently
        if (settings.starPromptActioned) {
          return;
        }

        const now = Date.now();
        const firstSeen = settings.starPromptFirstSeen || now;

        // If first seen is not set, initialize it
        if (!settings.starPromptFirstSeen) {
          await saveSettings({
            ...settings,
            starPromptFirstSeen: now,
          });
        }

        const lastShown = settings.starPromptLastShown || firstSeen;
        const timeElapsed = now - lastShown;

        // 2. Check if at least 5 days have passed since last prompt / first install
        if (timeElapsed >= FIVE_DAYS_MS) {
          // Random probability factor to make it feel natural across sessions
          const shouldShow = Math.random() < 0.65;
          if (shouldShow && isMounted) {
            // Delay slightly after modal open so it does not interfere with startup
            setTimeout(() => {
              if (isMounted) {
                openPrompt();
              }
            }, 1800);
          }
        }
      } catch {
        // silent fallback
      }
    }

    checkEligibility();

    return () => {
      isMounted = false;
    };
  }, []);

  const openPrompt = async () => {
    setIsOpen(true);
    try {
      const settings = await loadSettings();
      await saveSettings({
        ...settings,
        starPromptLastShown: Date.now(),
      });
      trackTelemetryEvent('npm_star_prompt_shown', {
        trigger: '5_day_interval',
        platform: Platform.OS,
      });
    } catch {}

    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 50,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();

    // Subtle star pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  };

  const closePrompt = (callback?: () => void) => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 200,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsOpen(false);
      if (callback) callback();
    });
  };

  const handleStarNow = async () => {
    try {
      const settings = await loadSettings();
      await saveSettings({
        ...settings,
        starPromptActioned: true,
      });
      trackTelemetryEvent('npm_star_prompt_action', {
        action: 'starred',
        platform: Platform.OS,
      });
    } catch {}

    closePrompt(() => {
      Linking.openURL(GITHUB_REPO_URL).catch(() => {
        Linking.openURL(NPM_PACKAGE_URL).catch(() => {});
      });
    });
  };

  const handleAlreadyStarred = async () => {
    try {
      const settings = await loadSettings();
      await saveSettings({
        ...settings,
        starPromptActioned: true,
      });
      trackTelemetryEvent('npm_star_prompt_action', {
        action: 'already_starred',
        platform: Platform.OS,
      });
    } catch {}

    closePrompt();
  };

  const handleRemindLater = async () => {
    try {
      const settings = await loadSettings();
      await saveSettings({
        ...settings,
        starPromptLastShown: Date.now(),
      });
      trackTelemetryEvent('npm_star_prompt_action', {
        action: 'remind_later',
        platform: Platform.OS,
      });
    } catch {}

    closePrompt();
  };

  const handleDontAskAgain = async () => {
    try {
      const settings = await loadSettings();
      await saveSettings({
        ...settings,
        starPromptActioned: true,
      });
      trackTelemetryEvent('npm_star_prompt_action', {
        action: 'dont_ask_again',
        platform: Platform.OS,
      });
    } catch {}

    closePrompt();
  };

  if (!isOpen) return null;

  return (
    <Modal
      transparent
      visible={isOpen}
      animationType="none"
      onRequestClose={handleRemindLater}>
      <Animated.View
        style={[
          styles.backdrop,
          {
            opacity: fadeAnim,
          },
        ]}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={handleRemindLater}
        />

        <Animated.View
          style={[
            styles.cardContainer,
            {
              transform: [{translateY: slideAnim}],
            },
          ]}>
          {/* Glowing Star Icon Header */}
          <View style={styles.headerIconWrapper}>
            <Animated.View
              style={[
                styles.iconGlow,
                {
                  transform: [{scale: pulseAnim}],
                },
              ]}
            />
            <View style={styles.iconCircle}>
              <StarIcon size={26} color="#F59E0B" />
            </View>
          </View>

          {/* Close X */}
          <TouchableOpacity
            onPress={handleRemindLater}
            hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
            style={styles.closeBtn}>
            <CloseWhite size={12} color={AppColors.grayText} />
          </TouchableOpacity>

          {/* Pill Badge */}
          <View style={styles.pillBadge}>
            <Text style={styles.pillBadgeText}>SUPPORT OPEN SOURCE</Text>
          </View>

          {/* Title & Description */}
          <Text style={styles.title}>Enjoying In-App Inspector?</Text>
          <Text style={styles.description}>
            If this debugging tool saves you time, please consider giving us a
            star on GitHub & npm. Your support helps us build more features!
          </Text>

          {/* Quick Metrics Bar */}
          <View style={styles.metricsBar}>
            <View style={styles.metricItem}>
              <GitHubIcon size={13} color={AppColors.grayText} />
              <Text style={styles.metricText}>GitHub Star</Text>
            </View>
            <View style={styles.metricDot} />
            <View style={styles.metricItem}>
              <NpmIcon size={13} color="#CB3837" />
              <Text style={styles.metricText}>npm Package</Text>
            </View>
            <View style={styles.metricDot} />
            <View style={styles.metricItem}>
              <Text style={styles.metricText}>100% Free</Text>
            </View>
          </View>

          {/* Primary Button: Star on GitHub */}
          <TouchableScale
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Star on GitHub"
            onPress={handleStarNow}
            style={styles.primaryButton}>
            <View style={styles.primaryButtonContent}>
              <StarIcon size={16} color={AppColors.white} />
              <Text style={styles.primaryButtonText}>⭐ Star on GitHub & npm</Text>
            </View>
          </TouchableScale>

          {/* Secondary Action: Already Starred */}
          <TouchableScale
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="I already starred"
            onPress={handleAlreadyStarred}
            style={styles.secondaryButton}>
            <View style={styles.secondaryButtonContent}>
              <CheckIcon size={13} color={AppColors.purple} />
              <Text style={styles.secondaryButtonText}>I Already Starred</Text>
            </View>
          </TouchableScale>

          {/* Bottom Link Row: Remind Later & Don't Ask Again */}
          <View style={styles.footerRow}>
            <TouchableOpacity
              onPress={handleRemindLater}
              hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
              <Text style={styles.footerLinkText}>Remind Me Later</Text>
            </TouchableOpacity>

            <View style={styles.footerSeparator} />

            <TouchableOpacity
              onPress={handleDontAskAgain}
              hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
              <Text style={styles.footerLinkTextMuted}>Don't Ask Again</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 99999,
  },
  cardContainer: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: AppColors.white,
    borderRadius: 22,
    padding: 22,
    alignItems: 'center',
    shadowColor: AppColors.black,
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.22,
    shadowRadius: 20,
    elevation: 12,
    borderWidth: 1.5,
    borderColor: `${AppColors.purple}25`,
  },
  headerIconWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  iconGlow: {
    position: 'absolute',
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#F59E0B22',
  },
  iconCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#FEF3C7',
    borderWidth: 2,
    borderColor: '#FDE68A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: AppColors.grayBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillBadge: {
    backgroundColor: `${AppColors.purple}14`,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 10,
    marginBottom: 8,
  },
  pillBadgeText: {
    fontFamily: AppFonts.interBold,
    fontSize: 9.5,
    color: AppColors.purple,
    letterSpacing: 0.6,
  },
  title: {
    fontFamily: AppFonts.interBold,
    fontSize: 18,
    lineHeight: 23,
    color: AppColors.primaryBlack,
    textAlign: 'center',
    marginBottom: 6,
  },
  description: {
    fontFamily: AppFonts.interRegular,
    fontSize: 12.5,
    lineHeight: 18,
    color: AppColors.grayText,
    textAlign: 'center',
    marginBottom: 14,
    paddingHorizontal: 8,
  },
  metricsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppColors.grayBackground,
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 10,
    marginBottom: 16,
    gap: 8,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metricText: {
    fontFamily: AppFonts.interMedium,
    fontSize: 11,
    color: AppColors.primaryBlack,
  },
  metricDot: {
    width: 3.5,
    height: 3.5,
    borderRadius: 2,
    backgroundColor: AppColors.dividerColor,
  },
  primaryButton: {
    width: '100%',
    backgroundColor: AppColors.purple,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    shadowColor: AppColors.purple,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  primaryButtonText: {
    fontFamily: AppFonts.interBold,
    fontSize: 14,
    color: AppColors.white,
  },
  secondaryButton: {
    width: '100%',
    backgroundColor: `${AppColors.purple}10`,
    borderWidth: 1,
    borderColor: `${AppColors.purple}30`,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  secondaryButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  secondaryButtonText: {
    fontFamily: AppFonts.interBold,
    fontSize: 13,
    color: AppColors.purple,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  footerLinkText: {
    fontFamily: AppFonts.interMedium,
    fontSize: 11.5,
    color: AppColors.grayText,
  },
  footerSeparator: {
    width: 1,
    height: 12,
    backgroundColor: AppColors.dividerColor,
  },
  footerLinkTextMuted: {
    fontFamily: AppFonts.interRegular,
    fontSize: 11.5,
    color: AppColors.grayTextWeak,
  },
});

export default NpmStarPrompt;
