import React, {useEffect, useMemo, useRef, useState} from 'react';
import {
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
import {getNativeDeviceMetrics, NativeDeviceMetrics} from '../../native/NativeInspector';
import {subscribeNetworkLogs} from '../../customHooks/networkLogger';
import {useInspector} from './InspectorContext';
import {useTranslation} from '../../i18n';

export const SecondaryTelemetryStrip: React.FC = () => {
  const {t} = useTranslation();
  const {switchActiveTab, peekMode} = useInspector();
  const [fps, setFps] = useState<number>(60);
  const [metrics, setMetrics] = useState<NativeDeviceMetrics | null>(null);
  const [networkSpeedKbps, setNetworkSpeedKbps] = useState<number>(0);

  // ─── Real-Time 60 FPS Engine ───────────────────────────────────────────────
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(Date.now());

  useEffect(() => {
    let animId: number;
    const calcFps = () => {
      frameCountRef.current++;
      const now = Date.now();
      const delta = now - lastTimeRef.current;
      if (delta >= 1000) {
        const measuredFps = Math.min(60, Math.round((frameCountRef.current * 1000) / delta));
        setFps(measuredFps);
        frameCountRef.current = 0;
        lastTimeRef.current = now;
      }
      animId = requestAnimationFrame(calcFps);
    };

    animId = requestAnimationFrame(calcFps);
    return () => cancelAnimationFrame(animId);
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
      // Look at the 10 most recent logs to compute recent transfer speed
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
        // Smoothly decay to 0 after 15 seconds of inactivity
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
    fps >= 55
      ? AppColors.emerald400
      : fps >= 30
      ? AppColors.amber400
      : AppColors.rose400;

  // RAM Usage / Total RAM formatted in GB
  const ramUsageStr = useMemo(() => {
    if (metrics?.usedRAM && metrics?.totalRAM) {
      const usedGB = (metrics.usedRAM / (1024 * 1024 * 1024)).toFixed(2);
      const totalGB = (metrics.totalRAM / (1024 * 1024 * 1024)).toFixed(1);
      return `${usedGB} / ${totalGB} GB RAM`;
    }
    if (metrics?.residentMemory) {
      const usedGB = (metrics.residentMemory / (1024 * 1024 * 1024)).toFixed(2);
      return `${usedGB} GB RAM`;
    }
    if (metrics?.usedRAM) {
      const usedGB = (metrics.usedRAM / (1024 * 1024 * 1024)).toFixed(2);
      return `${usedGB} GB RAM`;
    }
    return null;
  }, [metrics]);

  const batteryPercent = metrics?.batteryPercent;
  const isCharging = metrics?.isCharging;

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
        activeOpacity={0.8}
        onPress={() => switchActiveTab?.('device')}
        style={stripStyles.inner}>
        {/* FPS Indicator */}
        <View style={stripStyles.item}>
          <ActivityIcon size={11.5} color={fpsColor} />
          <Text style={[stripStyles.label, {color: fpsColor, fontFamily: AppFonts.interBold}]}>
            {fps} {t('telemetry.fps', 'FPS')}
          </Text>
        </View>

        <View style={stripStyles.divider} />

        {/* Network Throughput in kbps / Mbps */}
        <View style={stripStyles.item}>
          <SpeedIcon size={11.5} color={AppColors.sky300} />
          <Text style={[stripStyles.label, {color: AppColors.sky300}]}>
            {networkSpeedKbps >= 1000
              ? `${(networkSpeedKbps / 1000).toFixed(2)} Mbps`
              : networkSpeedKbps > 0
              ? `${networkSpeedKbps.toFixed(1)} kbps`
              : '0.0 kbps'}
          </Text>
        </View>

        {/* RAM Usage / Total RAM in GB */}
        {ramUsageStr && (
          <>
            <View style={stripStyles.divider} />
            <View style={stripStyles.item}>
              <BoltIcon size={11} color={AppColors.purple400} />
              <Text style={[stripStyles.label, {color: AppColors.purple400}]}>
                {ramUsageStr}
              </Text>
            </View>
          </>
        )}

        {/* Battery & Power status if available */}
        {batteryPercent !== undefined && batteryPercent >= 0 && (
          <>
            <View style={stripStyles.divider} />
            <View style={stripStyles.item}>
              {isCharging ? (
                <BatteryChargingIcon size={11.5} color={AppColors.emerald400} />
              ) : (
                <BatteryFullIcon size={11.5} color={AppColors.slate400} />
              )}
              <Text style={stripStyles.label}>
                {Math.round(batteryPercent)}%
              </Text>
            </View>
          </>
        )}
      </TouchableOpacity>
    </LinearGradient>
  );
};

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
    paddingVertical: 3.5,
    minHeight: 23,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  divider: {
    width: 1,
    height: 10,
    backgroundColor: AppColors.borderSubtle,
  },
  label: {
    fontFamily: AppFonts.interMedium,
    fontSize: 9,
    lineHeight: 11.5,
    color: AppColors.textPrimary,
    letterSpacing: 0.1,
  },
});
