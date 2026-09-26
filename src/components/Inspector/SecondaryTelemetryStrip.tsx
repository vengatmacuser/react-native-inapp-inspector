import React, {useEffect, useMemo, useRef, useState} from 'react';
import {
  Animated,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {AppColors} from '../../styles/AppColors';
import {AppFonts} from '../../styles/AppFonts';
import {
  ActivityIcon,
  BatteryChargingIcon,
  BatteryFullIcon,
  BoltIcon,
  SpeedIcon,
} from '../NetworkIcons';
import {
  getNativeDeviceMetrics,
  getNativeFpsMetrics,
  NativeDeviceMetrics,
  startNativeFpsMonitoring,
  stopNativeFpsMonitoring,
} from '../../native/NativeInspector';
import {subscribeNetworkLogs} from '../../customHooks/networkLogger';
import {useInspector} from './InspectorContext';
import {useTranslation} from '../../i18n';

export const SecondaryTelemetryStrip: React.FC = React.memo(() => {
  const {t} = useTranslation();
  const {switchActiveTab} = useInspector();
  const [fps, setFps] = useState<number>(60);
  const [targetFps, setTargetFps] = useState<number>(60);
  const [metrics, setMetrics] = useState<NativeDeviceMetrics | null>(null);
  const [networkSpeedKbps, setNetworkSpeedKbps] = useState<number>(0);

  // Live pulsing glow dot for telemetry activity
  const livePulseAnim = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(livePulseAnim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(livePulseAnim, {
          toValue: 0.4,
          duration: 900,
          useNativeDriver: true,
        }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, [livePulseAnim]);

  // ─── Real-Time Native Hardware & JS FPS Engine ───────────────────────────
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(Date.now());

  useEffect(() => {
    startNativeFpsMonitoring().catch(() => {});

    const fpsPollInterval = setInterval(async () => {
      try {
        const nativeFps = await getNativeFpsMetrics();
        if (nativeFps && typeof nativeFps.fps === 'number' && nativeFps.fps > 0) {
          setFps(Math.round(nativeFps.fps));
          if (nativeFps.targetFps) setTargetFps(Math.round(nativeFps.targetFps));
          return;
        }
      } catch {}

      // Fallback: JS frame delta calculation
      const now = Date.now();
      const delta = now - lastTimeRef.current;
      if (delta >= 1000) {
        const measuredFps = Math.min(60, Math.round((frameCountRef.current * 1000) / delta));
        setFps(measuredFps);
        frameCountRef.current = 0;
        lastTimeRef.current = now;
      }
    }, 1000);

    let animId: number;
    const countFrames = () => {
      frameCountRef.current++;
      animId = requestAnimationFrame(countFrames);
    };
    animId = requestAnimationFrame(countFrames);

    return () => {
      clearInterval(fpsPollInterval);
      cancelAnimationFrame(animId);
      stopNativeFpsMonitoring().catch(() => {});
    };
  }, []);

  // ─── Live Network Throughput in kbps / Mbps ──────────────────────────────
  const lastActiveSpeedRef = useRef<number>(0);
  const lastActiveTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    const unsub = subscribeNetworkLogs(allLogs => {
      if (!allLogs || allLogs.length === 0) {
        setNetworkSpeedKbps(0);
        return;
      }

      const now = Date.now();
      const recentLogs = allLogs.slice(0, 10);
      let totalBytes = 0;
      let totalDurationMs = 0;
      let latestSingleSpeed = 0;

      for (const log of recentLogs) {
        let reqBytes = 0;
        let respBytes = 0;

        if (log.request) {
          reqBytes = typeof log.request === 'string'
            ? log.request.length
            : JSON.stringify(log.request).length;
        }
        if (log.response) {
          respBytes = typeof log.response === 'string'
            ? log.response.length
            : JSON.stringify(log.response).length;
        }

        const logBytes = reqBytes + respBytes;
        if (logBytes > 0 && log.duration && log.duration > 0) {
          const singleSpeed = (logBytes * 8) / (log.duration / 1000) / 1000;
          if (singleSpeed > 0 && latestSingleSpeed === 0) {
            latestSingleSpeed = singleSpeed;
          }
          totalBytes += logBytes;
          totalDurationMs += log.duration;
        }
      }

      let speed = 0;
      if (totalDurationMs > 0 && totalBytes > 0) {
        speed = (totalBytes * 8) / (totalDurationMs / 1000) / 1000;
      } else if (latestSingleSpeed > 0) {
        speed = latestSingleSpeed;
      }

      if (speed > 0) {
        lastActiveSpeedRef.current = speed;
        lastActiveTimeRef.current = now;
        setNetworkSpeedKbps(Math.round(speed * 10) / 10);
      } else if (lastActiveSpeedRef.current > 0 && now - lastActiveTimeRef.current < 12000) {
        setNetworkSpeedKbps(Math.round(lastActiveSpeedRef.current * 10) / 10);
      }
    });

    const decayInterval = setInterval(() => {
      const now = Date.now();
      if (now - lastActiveTimeRef.current > 15000 && lastActiveSpeedRef.current > 0) {
        lastActiveSpeedRef.current = 0;
        setNetworkSpeedKbps(0);
      }
    }, 3000);

    return () => {
      unsub();
      clearInterval(decayInterval);
    };
  }, []);

  // ─── Periodic Telemetry Polling (Hardware & RAM) ───────────────────────────
  useEffect(() => {
    let isMounted = true;
    const updateMetrics = async () => {
      try {
        const data = await getNativeDeviceMetrics();
        if (isMounted && data) {
          setMetrics(data);
        }
      } catch {}
    };

    updateMetrics();
    const interval = setInterval(updateMetrics, 4000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const fpsColor =
    fps >= targetFps - 5
      ? AppColors.emerald400
      : fps >= targetFps / 2
      ? AppColors.amber400
      : AppColors.rose400;

  // RAM Usage formatted in MB or GB with resident app memory
  const ramUsageStr = useMemo(() => {
    if (metrics?.usedRAM && metrics?.totalRAM) {
      const usedGB = (metrics.usedRAM / (1024 * 1024 * 1024)).toFixed(2);
      const totalGB = (metrics.totalRAM / (1024 * 1024 * 1024)).toFixed(1);
      return `${usedGB} / ${totalGB} GB`;
    }
    if (metrics?.residentMemory) {
      const residentMB = Math.round(metrics.residentMemory / (1024 * 1024));
      return `${residentMB} MB RAM`;
    }
    if (metrics?.usedRAM) {
      const usedMB = Math.round(metrics.usedRAM / (1024 * 1024));
      return `${usedMB} MB RAM`;
    }
    return null;
  }, [metrics]);

  const batteryPercent = metrics?.batteryPercent;
  const isCharging = metrics?.isCharging;

  const a11ySummary = `Telemetry: ${fps} FPS of ${targetFps}, Network speed ${networkSpeedKbps} kbps, ${ramUsageStr || ''}`;

  return (
    <LinearGradient
      colors={[
        AppColors.telemetrySubHeaderGradStart,
        AppColors.telemetrySubHeaderGradMid,
        AppColors.telemetrySubHeaderGradEnd,
      ]}
      start={{x: 0, y: 0}}
      end={{x: 1, y: 0}}
      style={stripStyles.container}>
      <TouchableOpacity
        activeOpacity={0.75}
        onPress={() => switchActiveTab?.('device')}
        accessible={true}
        accessibilityRole="summary"
        accessibilityLabel={a11ySummary}
        accessibilityHint="Double tap to open Device Diagnostics tab"
        style={stripStyles.inner}>
        {/* ─── 1. Live Hardware FPS ─── */}
        <View style={stripStyles.item}>
          <Animated.View style={[stripStyles.pulseDot, {backgroundColor: fpsColor, opacity: livePulseAnim}]} />
          <ActivityIcon size={11} color={fpsColor} />
          <Text style={[stripStyles.monoLabel, {color: fpsColor}]}>
            {fps} {t('telemetry.fps', 'FPS')}
          </Text>
        </View>

        <View style={stripStyles.divider} />

        {/* ─── 2. Network Throughput ─── */}
        <View style={stripStyles.item}>
          <SpeedIcon size={11} color={AppColors.sky400} />
          <Text style={[stripStyles.monoLabel, {color: AppColors.sky400}]}>
            {networkSpeedKbps >= 1000
              ? `${(networkSpeedKbps / 1000).toFixed(2)} Mbps`
              : networkSpeedKbps > 0
              ? `${networkSpeedKbps.toFixed(1)} kbps`
              : '0.0 kbps'}
          </Text>
        </View>

        {/* ─── 3. RAM / Memory ─── */}
        {ramUsageStr && (
          <>
            <View style={stripStyles.divider} />
            <View style={stripStyles.item}>
              <BoltIcon size={11} color={AppColors.purple400} />
              <Text style={[stripStyles.monoLabel, {color: AppColors.purple400}]}>
                {ramUsageStr}
              </Text>
            </View>
          </>
        )}

        {/* ─── 4. Battery / Power ─── */}
        {batteryPercent !== undefined && batteryPercent >= 0 && (
          <>
            <View style={stripStyles.divider} />
            <View style={stripStyles.item}>
              {isCharging ? (
                <BatteryChargingIcon size={11} color={AppColors.emerald400} />
              ) : (
                <BatteryFullIcon size={11} color={AppColors.slate400} />
              )}
              <Text style={[stripStyles.monoLabel, {color: isCharging ? AppColors.emerald400 : AppColors.slate400}]}>
                {Math.round(batteryPercent)}%
              </Text>
            </View>
          </>
        )}
      </TouchableOpacity>
    </LinearGradient>
  );
});

const stripStyles = StyleSheet.create({
  container: {
    width: '100%',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: AppColors.telemetrySubHeaderBorder,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: AppColors.telemetrySubHeaderBorder,
    zIndex: 9,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 4.5,
    minHeight: 25,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pulseDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginRight: 1,
  },
  divider: {
    width: 1,
    height: 10,
    backgroundColor: AppColors.borderSubtle,
  },
  monoLabel: {
    fontFamily: AppFonts.monoFont,
    fontSize: 9.5,
    lineHeight: 12,
    letterSpacing: 0.2,
    fontVariant: ['tabular-nums'],
  },
});

export default SecondaryTelemetryStrip;
