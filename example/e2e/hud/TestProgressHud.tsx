import React, {useEffect, useState} from 'react';
import {Animated, StyleSheet, Text, View} from 'react-native';
import {HudBridge, TestProgressState} from './hudBridge';

/**
 * Modern Glassmorphic Live In-App Progress HUD
 * Renders at top of the simulator screen during active debug simulation runs.
 */
export const TestProgressHud: React.FC = () => {
  const [state, setState] = useState<TestProgressState>(HudBridge.getState());
  const [pulseAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    const unsub = HudBridge.subscribe(newState => {
      setState({...newState});
    });

    // Subtle pulsing animation on the live status pill
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.6,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    );
    pulse.start();

    return () => {
      unsub();
      pulse.stop();
    };
  }, [pulseAnim]);

  // Only render when in debug mode
  if (!__DEV__) {
    return null;
  }

  const getStatusColor = () => {
    switch (state.status) {
      case 'PASSED':
        return '#10B981';
      case 'FAILED':
        return '#EF4444';
      case 'SNAPSHOT':
        return '#F59E0B';
      default:
        return '#6366F1';
    }
  };

  return (
    <View style={styles.container} pointerEvents="none" testID="detox.hud.container">
      <View style={styles.hudCard}>
        {/* Top Header Row */}
        <View style={styles.topRow}>
          <View style={styles.titleCol}>
            <Text style={styles.badgeText}>🧪 DETOX RUNNER</Text>
            <Text style={styles.suiteTitle} numberOfLines={1}>
              {state.suiteName} ({state.suiteIndex}/{state.totalSuites})
            </Text>
          </View>
          <Animated.View
            style={[
              styles.statusPill,
              {backgroundColor: getStatusColor(), opacity: pulseAnim},
            ]}>
            <Text style={styles.statusPillText}>{state.status}</Text>
          </Animated.View>
        </View>

        {/* Dynamic Progress Bar */}
        <View style={styles.progressBarTrack}>
          <View
            style={[
              styles.progressBarFill,
              {
                width: `${state.progressPercent}%`,
                backgroundColor: getStatusColor(),
              },
            ]}
          />
        </View>

        {/* Action & Snapshot Tracker */}
        <View style={styles.bottomRow}>
          <Text style={styles.stepText} numberOfLines={1}>
            ⚡ {state.stepDescription}
          </Text>
          <Text style={styles.percentText}>{state.progressPercent}%</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    zIndex: 999999,
  },
  hudCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 10,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  titleCol: {
    flex: 1,
    marginRight: 8,
  },
  badgeText: {
    color: '#818CF8',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  suiteTitle: {
    color: '#F8FAFC',
    fontSize: 12,
    fontWeight: '700',
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusPillText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  progressBarTrack: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stepText: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '500',
    flex: 1,
    marginRight: 6,
  },
  percentText: {
    color: '#E2E8F0',
    fontSize: 10,
    fontWeight: '700',
  },
});
