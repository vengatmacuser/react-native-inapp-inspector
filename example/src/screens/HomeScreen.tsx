import React, { useState, useEffect, useMemo } from 'react';
import { Text, Pressable, View, ScrollView, Linking, Dimensions, Platform, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Rect, Ellipse, Line } from 'react-native-svg';
import axios from 'axios';
import {
  subscribeNetworkLogs,
  subscribeConsoleLogs,
  logAnalyticsEvent,
  subscribeAnalyticsEvents,
  simulateTestCrash,
  simulateTestPush,
  getNativeDeviceMetrics,
  isNativeModuleAvailable,
  ModuleErrorBoundary,
  LIB_VERSION,
} from 'react-native-inapp-inspector';
import { mockStore } from '../store/mockStore';
import { styles } from '../styles/appStyles';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const FaultySimulatedModule = ({ shouldFail }: { shouldFail: boolean }) => {
  if (shouldFail) {
    throw new Error('Simulated Micro-Frontend Crash: Module failed during render. Other modules continue unaffected!');
  }
  return null;
};

// ─── Crisp SVG Vector Icons ───────────────────────────────────────────────────

const SvgStar = ({ color = '#EAB308', size = 14 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <Path
      d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const SvgFork = ({ color = '#64748B', size = 14 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="18" r="3" stroke={color} strokeWidth="2" />
    <Circle cx="6" cy="6" r="3" stroke={color} strokeWidth="2" />
    <Circle cx="18" cy="6" r="3" stroke={color} strokeWidth="2" />
    <Path
      d="M18 9v2a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V9M12 13v2"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);



const SvgBell = ({ color = '#4F46E5', size = 14 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M13.73 21a2 2 0 0 1-3.46 0"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const SvgBolt = ({ color = '#FFFFFF', size = 14 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"
      stroke={color}
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const SvgPackage = ({ color = '#64748B', size = 14 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M16.5 9.4L7.55 4.24a1.78 1.78 0 0 0-2.5 1.55v12.42a1.78 1.78 0 0 0 2.5 1.55L16.5 14.6"
      stroke={color}
      strokeWidth="1.8"
      strokeLinecap="round"
    />
    <Path
      d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"
      stroke={color}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12"
      stroke={color}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const SvgGitHub = ({ color = '#64748B', size = 14 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"
      stroke={color}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const SvgGlobe = ({ color = '#0284C7', size = 14 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
    <Path
      d="M12 2C8 7 8 17 12 22M12 2c4 5 4 15 0 20M2 12h20"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
    />
  </Svg>
);

const SvgTerminal = ({ color = '#4F46E5', size = 14 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M4 17l6-6-6-6M12 19h8"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const SvgAnalytics = ({ color = '#0D9488', size = 14 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M18 20V10M12 20V4M6 20v-6"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const SvgAtom = ({ color = '#7C3AED', size = 14 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="2" fill={color} />
    <Ellipse
      cx="12"
      cy="12"
      rx="9.5"
      ry="3.8"
      stroke={color}
      strokeWidth="1.6"
      transform="rotate(30 12 12)"
    />
    <Ellipse
      cx="12"
      cy="12"
      rx="9.5"
      ry="3.8"
      stroke={color}
      strokeWidth="1.6"
      transform="rotate(90 12 12)"
    />
    <Ellipse
      cx="12"
      cy="12"
      rx="9.5"
      ry="3.8"
      stroke={color}
      strokeWidth="1.6"
      transform="rotate(150 12 12)"
    />
  </Svg>
);

const SvgExternalLink = ({ color = '#FFFFFF', size = 12 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M15 3h6v6M10 14L21 3"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const SvgCheckCircle = ({ color = '#059669', size = 13 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
    <Path
      d="M8 12l3 3 6-6"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const SvgAlertCircle = ({ color = '#E11D48', size = 13 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
    <Path d="M12 8v4M12 16h.01" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </Svg>
);

const SvgPlus = ({ color = '#7C3AED', size = 13 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 5v14M5 12h14"
      stroke={color}
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const SvgRefresh = ({ color = '#D97706', size = 13 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M23 4v6h-6M1 20v-6h6"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const SvgEdit = ({ color = '#0284C7', size = 13 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const SvgTrash = ({ color = '#DC2626', size = 13 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);



const SvgCode = ({ color = '#7C3AED', size = 13 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M16 18l6-6-6-6M8 6l-6 6 6 6"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const SvgAlertTriangle = ({ color = '#DC2626', size = 13 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const SvgEye = ({ color = '#0284C7', size = 13 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth="2" />
  </Svg>
);

const SvgShoppingBag = ({ color = '#059669', size = 13 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M16 10a4 4 0 0 1-8 0"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const SvgSidebar = ({ color = '#059669', size = 13 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="3" y="3" width="18" height="18" rx="2" stroke={color} strokeWidth="2" />
    <Path d="M9 3v18" stroke={color} strokeWidth="2" />
  </Svg>
);

const SvgMoon = ({ color = '#0891B2', size = 13 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const SvgCpu = ({ color = '#DC2626', size = 13 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="4" y="4" width="16" height="16" rx="2" stroke={color} strokeWidth="2" />
    <Rect x="9" y="9" width="6" height="6" stroke={color} strokeWidth="2" />
    <Path
      d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 14h3M1 9h3M1 14h3"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
    />
  </Svg>
);

const SvgHeart = ({ color = '#FFFFFF', size = 13 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <Path
      d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
      stroke={color}
      strokeWidth="1.5"
    />
  </Svg>
);

const SvgBug = ({ color = '#FFFFFF', size = 13 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="8" y="9" width="8" height="10" rx="4" stroke={color} strokeWidth="2" />
    <Path
      d="M6 3l3 3M18 3l-3 3M4 13h4M16 13h4M5 19l3-2M19 19l-3-2M12 6v3"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
    />
  </Svg>
);

// ─── Tactile Interactive Button Component ─────────────────────────────────────
interface TactileButtonProps {
  label: string;
  onPress: () => void | Promise<void>;
  color: string;
  bgColor: string;
  fullWidth?: boolean;
  icon?: React.ReactNode;
}

const TactileButton = ({ label, onPress, color, bgColor, fullWidth, icon }: TactileButtonProps) => {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        fullWidth ? styles.fullWidthBtn : styles.gridBtn,
        {
          borderColor: color,
          backgroundColor: fullWidth ? color : bgColor,
          opacity: pressed ? 0.75 : 1,
          transform: [{ scale: pressed ? 0.96 : 1 }],
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
        },
      ]}
      android_ripple={{ color: 'rgba(0,0,0,0.1)' }}
    >
      {icon}
      <Text
        numberOfLines={1}
        ellipsizeMode="tail"
        style={[
          fullWidth ? styles.fullWidthBtnText : styles.btnText,
          !fullWidth ? { color } : undefined,
          styles.flexShrink1,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
};

// ─── Clear, Understandable Live Activity Telemetry Card ───────────────────────
interface ActivityGraphProps {
  apiCount: number;
  logCount: number;
  analyticsCount: number;
  sidebarOpen: boolean;
  history: number[];
  status: string | null;
}

const ActivityGraphicsCard = ({
  apiCount,
  logCount,
  analyticsCount,
  sidebarOpen,
  history,
  status,
}: ActivityGraphProps) => {
  const [measuredWidth, setMeasuredWidth] = useState<number>(0);
  const chartWidth = Math.max(100, measuredWidth || SCREEN_WIDTH - 84);
  const chartHeight = 70;

  const totalEvents = apiCount + logCount + analyticsCount;
  const apiPct = totalEvents > 0 ? Math.round((apiCount / totalEvents) * 100) : 0;
  const logPct = totalEvents > 0 ? Math.round((logCount / totalEvents) * 100) : 0;
  const analyticsPct = totalEvents > 0 ? Math.max(0, 100 - apiPct - logPct) : 0;

  // 10 chronological time bars (-18s to NOW)
  const barData = useMemo(() => {
    const raw = history.length >= 10 ? history.slice(-10) : [2, 4, 3, 7, 5, 8, 12, 9, 14, 18];
    const maxVal = Math.max(...raw, 15);
    return raw.map(val => ({
      val,
      height: Math.max(6, (val / maxVal) * (chartHeight - 20)),
    }));
  }, [history, chartHeight]);

  const barSlotWidth = chartWidth / barData.length;
  const barWidth = Math.max(6, Math.min(22, barSlotWidth - 8));

  return (
    <View style={styles.statsCard}>
      {/* Header: Title + Live Status Badge */}
      <View style={styles.sectionTitleRow}>
        <View style={styles.rowAlignCenterGap6}>
          <SvgAnalytics color="#4F46E5" size={15} />
          <Text style={styles.sectionTitle}>Live Event Telemetry</Text>
        </View>
        <View style={styles.liveIndicator}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>{status ? status.toUpperCase() : 'STREAMING'}</Text>
        </View>
      </View>

      {/* Understandable Bar Chart with Time Axis and Grid lines */}
      <View
        onLayout={e => {
          const w = e.nativeEvent.layout.width - 16; // account for paddingHorizontal: 8
          if (w > 0 && Math.abs(w - measuredWidth) > 2) {
            setMeasuredWidth(w);
          }
        }}
        style={styles.telemetryBox}
      >
        {/* Top rate indicator */}
        <View style={styles.telemetryTopRow}>
          <Text style={styles.telemetryTextLeft}>
            Throughput: <Text style={styles.telemetryTextIndigo}>{totalEvents} Total Events</Text>
          </Text>
          <Text style={styles.telemetryTextGreen}>
            ⚡ Live Activity Stream
          </Text>
        </View>

        {/* SVG Time-Series Histogram */}
        <Svg width={chartWidth} height={chartHeight}>
          {/* Subtle Grid Guidelines */}
          <Line
            x1="0"
            y1={chartHeight - 16}
            x2={chartWidth}
            y2={chartHeight - 16}
            stroke="#E2E8F0"
            strokeWidth="1"
          />
          <Line
            x1="0"
            y1={(chartHeight - 16) / 2}
            x2={chartWidth}
            y2={(chartHeight - 16) / 2}
            stroke="#E2E8F0"
            strokeWidth="1"
            strokeDasharray="3,3"
          />

          {/* Time Bars */}
          {barData.map((bar, i) => {
            const x = i * barSlotWidth + (barSlotWidth - barWidth) / 2;
            const y = chartHeight - 16 - bar.height;
            const isLatest = i === barData.length - 1;

            return (
              <React.Fragment key={i}>
                <Rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={bar.height}
                  rx={3.5}
                  fill={isLatest ? '#4F46E5' : '#818CF8'}
                  opacity={isLatest ? 1 : 0.65 + (i / barData.length) * 0.3}
                />
              </React.Fragment>
            );
          })}
        </Svg>

        {/* X-Axis Time Labels */}
        <View style={styles.telemetryAxisRow}>
          <Text style={styles.telemetryAxisLabel}>-18s</Text>
          <Text style={styles.telemetryAxisLabel}>-12s</Text>
          <Text style={styles.telemetryAxisLabel}>-6s</Text>
          <Text style={styles.telemetryAxisLabelNow}>NOW ●</Text>
        </View>
      </View>

      {/* Proportional Category Distribution Bar */}
      <View style={styles.gap6}>
        <View style={styles.rowBetweenCenter}>
          <Text style={styles.eventBreakdownTitle}>
            Event Breakdown
          </Text>
          <Text style={styles.eventBreakdownSubtitle}>
            {totalEvents} Captured
          </Text>
        </View>

        <Svg width={chartWidth} height={8}>
          <Rect x="0" y="0" width={chartWidth} height={8} rx={4} fill="#E2E8F0" />
          {totalEvents === 0 ? (
            <Rect x="0" y="0" width={chartWidth} height={8} rx={4} fill="#CBD5E1" />
          ) : (
            <>
              {apiPct > 0 && (
                <Rect
                  x="0"
                  y="0"
                  width={(apiPct / 100) * chartWidth}
                  height={8}
                  rx={4}
                  fill="#4F46E5"
                />
              )}
              {logPct > 0 && (
                <Rect
                  x={(apiPct / 100) * chartWidth}
                  y="0"
                  width={(logPct / 100) * chartWidth}
                  height={8}
                  fill="#F59E0B"
                />
              )}
              {analyticsPct > 0 && (
                <Rect
                  x={((apiPct + logPct) / 100) * chartWidth}
                  y="0"
                  width={(analyticsPct / 100) * chartWidth}
                  height={8}
                  rx={4}
                  fill="#0D9488"
                />
              )}
            </>
          )}
        </Svg>

        {/* Legend Ratio Breakdown */}
        <View style={styles.legendRow}>
          <View style={styles.rowAlignCenterGap4}>
            <View style={styles.legendDotApi} />
            <Text style={styles.legendTextApi}>
              APIs {apiPct}%
            </Text>
          </View>

          <View style={styles.rowAlignCenterGap4}>
            <View style={styles.legendDotLog} />
            <Text style={styles.legendTextLog}>
              Logs {logPct}%
            </Text>
          </View>

          <View style={styles.rowAlignCenterGap4}>
            <View style={styles.legendDotAnalytics} />
            <Text style={styles.legendTextAnalytics}>
              Events {analyticsPct}%
            </Text>
          </View>

          <View style={styles.rowAlignCenterGap4}>
            <View style={styles.legendDotStore} />
            <Text style={styles.legendTextStore}>
              {sidebarOpen ? 'Open' : 'Closed'}
            </Text>
          </View>
        </View>
      </View>

      {/* KPI Counters Grid */}
      <View style={styles.statsGrid}>
        <View style={styles.statBox}>
          <Text style={[styles.statVal, styles.textApiColor]}>{apiCount}</Text>
          <Text style={styles.statLbl}>APIs</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statVal, styles.textLogColor]}>{logCount}</Text>
          <Text style={styles.statLbl}>Logs</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statVal, styles.textAnalyticsColor]}>{analyticsCount}</Text>
          <Text style={styles.statLbl}>Events</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statVal, styles.textStoreColor]}>
            {sidebarOpen ? 'Open' : 'Closed'}
          </Text>
          <Text style={styles.statLbl}>Store</Text>
        </View>
      </View>
    </View>
  );
};

export function HomeScreen({ navigation }: any) {
  const [activeTab, setActiveTab] = useState<'tests' | 'npm' | 'github'>('tests');
  const [apiCount, setApiCount] = useState(0);
  const [logCount, setLogCount] = useState(0);
  const [analyticsCount, setAnalyticsCount] = useState(0);
  const [reduxState, setReduxState] = useState(mockStore.getState());
  const [lastActionStatus, setLastActionStatus] = useState<string | null>(null);
  const [faultyModuleBroken, setFaultyModuleBroken] = useState(false);
  const [activityHistory, setActivityHistory] = useState<number[]>([
    3, 5, 8, 4, 12, 16, 9, 15, 20, 24,
  ]);

  // ─── Dynamic Live NPM & GitHub Telemetry State ─────────────────────────────
  const [npmMeta, setNpmMeta] = useState<{
    version: string;
    description: string;
    downloadsMonthly: number | null;
    license: string;
    loading: boolean;
  }>({
    version: LIB_VERSION,
    description: 'All-in-One In-App Network Inspector, Redux Time-Travel, Console & Crash Telemetry.',
    downloadsMonthly: null,
    license: 'MIT',
    loading: true,
  });

  const [githubMeta, setGithubMeta] = useState<{
    stars: number;
    forks: number;
    openIssues: number;
    defaultBranch: string;
    description: string;
    pushedAt: string;
    license: string;
    loading: boolean;
  }>({
    stars: 0,
    forks: 0,
    openIssues: 0,
    defaultBranch: 'main',
    description: 'Zero-config all-in-one in-app inspector for React Native & Expo applications.',
    pushedAt: '',
    license: 'MIT',
    loading: true,
  });

  const notifyAction = (name: string) => {
    setLastActionStatus(name);
    setActivityHistory(prev => {
      const nextVal = Math.floor(Math.random() * 8 + 6);
      const updated = [...prev, nextVal];
      return updated.slice(-10);
    });
  };

  useEffect(() => {
    // Dynamic live NPM metadata
    fetch('https://registry.npmjs.org/react-native-inapp-inspector')
      .then(res => res.json())
      .then(data => {
        const latest = data['dist-tags']?.latest || LIB_VERSION;
        const desc = data.description || '';
        const lic = data.license || 'MIT';
        setNpmMeta(prev => ({
          ...prev,
          version: latest,
          description: desc || prev.description,
          license: lic,
          loading: false,
        }));
      })
      .catch(() => setNpmMeta(prev => ({ ...prev, loading: false })));

    // Dynamic live NPM downloads
    fetch('https://api.npmjs.org/downloads/point/last-month/react-native-inapp-inspector')
      .then(res => res.json())
      .then(data => {
        if (typeof data.downloads === 'number') {
          setNpmMeta(prev => ({ ...prev, downloadsMonthly: data.downloads }));
        }
      })
      .catch(() => {});

    // Dynamic live GitHub repository telemetry
    fetch('https://api.github.com/repos/vengatmacuser/react-native-inapp-inspector')
      .then(res => res.json())
      .then(data => {
        if (data && typeof data.stargazers_count === 'number') {
          setGithubMeta({
            stars: data.stargazers_count,
            forks: data.forks_count || 0,
            openIssues: data.open_issues_count || 0,
            defaultBranch: data.default_branch || 'main',
            description: data.description || '',
            pushedAt: data.pushed_at ? new Date(data.pushed_at).toLocaleDateString() : '',
            license: data.license?.spdx_id || 'MIT',
            loading: false,
          });
        }
      })
      .catch(() => setGithubMeta(prev => ({ ...prev, loading: false })));
  }, []);

  useEffect(() => {
    // Subscribe to logs to display live dashboard counters
    const unsubNet = subscribeNetworkLogs(logs => {
      setApiCount(logs.length);
      setActivityHistory(prev => [...prev.slice(-9), Math.max(2, (logs.length % 20) + 2)]);
    });
    const unsubConsole = subscribeConsoleLogs(logs => {
      setLogCount(logs.length);
      setActivityHistory(prev => [...prev.slice(-9), Math.max(2, (logs.length % 20) + 3)]);
    });
    const unsubAnalytics = subscribeAnalyticsEvents(events => {
      setAnalyticsCount(events.length);
      setActivityHistory(prev => [...prev.slice(-9), Math.max(2, (events.length % 20) + 1)]);
    });
    const unsubRedux = mockStore.subscribe(() => setReduxState(mockStore.getState()));

    // Initial Logs to populate stats
    console.log('[App] HomeScreen mounted and ready.');
    console.warn('[App] Check the Redux tab to inspect the connected state!');

    return () => {
      unsubNet();
      unsubConsole();
      unsubAnalytics();
      unsubRedux();
    };
  }, []);

  // Axios client — interceptors are automatically applied by setupNetworkLogger()
  const axiosClient = useMemo(
    () =>
      axios.create({
        baseURL: 'https://jsonplaceholder.typicode.com',
      }),
    [],
  );

  const triggerAxiosGet = async () => {
    notifyAction('Axios GET fired');
    try {
      console.log('[Axios] Triggering GET...');
      const response = await axiosClient.get('/posts/1');
      console.log('[Axios] GET response data title:', response.data.title);
    } catch (error: any) {
      console.error('[Axios] GET failed:', error.message);
    }
  };

  const triggerAxiosPost = async () => {
    notifyAction('Axios POST fired');
    try {
      console.log('[Axios] Triggering POST...');
      const response = await axiosClient.post('/posts', {
        title: 'New Post via Axios',
        body: 'This is a test post body sent via Axios auto-intercept.',
        userId: 1,
      });
      console.log('[Axios] POST response data:', response.data);
    } catch (error: any) {
      console.error('[Axios] POST failed:', error.message);
    }
  };

  const triggerAxiosPut = async () => {
    notifyAction('Axios PUT fired');
    try {
      console.log('[Axios] Triggering PUT...');
      const response = await axiosClient.put('/posts/1', {
        id: 1,
        title: 'Updated Title via Axios',
        body: 'This is updated post body content sent via Axios.',
        userId: 1,
      });
      console.log('[Axios] PUT response data:', response.data);
    } catch (error: any) {
      console.error('[Axios] PUT failed:', error.message);
    }
  };

  const triggerAxiosPatch = async () => {
    notifyAction('Axios PATCH fired');
    try {
      console.log('[Axios] Triggering PATCH...');
      const response = await axiosClient.patch('/posts/1', {
        title: 'Partially Updated Title via Axios',
      });
      console.log('[Axios] PATCH response data:', response.data);
    } catch (error: any) {
      console.error('[Axios] PATCH failed:', error.message);
    }
  };

  const triggerAxiosDelete = async () => {
    notifyAction('Axios DELETE fired');
    try {
      console.log('[Axios] Triggering DELETE...');
      const response = await axiosClient.delete('/posts/1');
      console.log('[Axios] DELETE response status:', response.status);
    } catch (error: any) {
      console.error('[Axios] DELETE failed:', error.message);
    }
  };

  const triggerNetworkRequest = async () => {
    notifyAction('Fetch (200 OK) fired');
    try {
      console.log('[API] Triggering fetch user...');
      const response = await fetch('https://jsonplaceholder.typicode.com/users/1');
      const data = await response.json();
      console.log('[API] Fetch completed successfully:', data.name);
    } catch (error) {
      console.error('[API] Fetch failed:', error);
    }
  };

  const triggerFailedNetworkRequest = async () => {
    notifyAction('Fetch (404 Err) fired');
    try {
      console.log('[API] Triggering failing fetch request...');
      await fetch('https://jsonplaceholder.typicode.com/invalid-route-error');
    } catch (error) {
      console.error('[API] Fetch failed with error:', error);
    }
  };

  const triggerConsoleLogs = () => {
    notifyAction('Console Logs fired');
    console.log('[App] Manual log triggered at ' + new Date().toLocaleTimeString());
  };

  const triggerSampleAll = () => {
    notifyAction('Sample All Fired');
    const randomConsoleMessages = [
      '[Sample] Fetching latest feed...',
      '[Sample] Cache refreshed for user session',
      '[Sample] Push notification permission granted',
      '[Sample] Background sync completed',
    ];
    const randomAnalyticsEvents = [
      'screen_view',
      'button_tapped',
      'list_scrolled',
      'session_started',
    ];

    console.log(`[Sample] Firing sample-all at ${new Date().toLocaleTimeString()}`);
    console.warn('[Sample] Randomized warning: throttled API response');
    console.error('[Sample] Randomized error: timeout on retry attempt #3');
    console.log(randomConsoleMessages[Math.floor(Math.random() * randomConsoleMessages.length)]);

    triggerAxiosGet();
    triggerAxiosPost();
    triggerAxiosPut();
    triggerAxiosPatch();
    triggerAxiosDelete();
    triggerNetworkRequest();
    triggerFailedNetworkRequest();

    logAnalyticsEvent(
      randomAnalyticsEvents[Math.floor(Math.random() * randomAnalyticsEvents.length)],
      {
        sample_batch: 'all',
        triggered_at: new Date().toISOString(),
        random_value: Math.floor(Math.random() * 1000),
      },
    );
    logAnalyticsEvent('item_purchase', {
      item_id: 'prod_999',
      item_name: 'Premium Debug Kit',
      price: 29.99,
      currency: 'USD',
    });

    mockStore.dispatch({ type: 'TOGGLE_SIDEBAR' });
    mockStore.dispatch({ type: 'UPDATE_USER_TIME' });

    fetch(`https://jsonplaceholder.typicode.com/posts/${Math.floor(Math.random() * 8 + 1)}`)
      .then(r => r.json())
      .then(d => console.log('[Sample] Random fetch completed:', d.title))
      .catch(e => console.error('[Sample] Random fetch failed:', e));
  };

  const handleToggleSidebar = () => {
    notifyAction('Redux Action Dispatched');
    mockStore.dispatch({ type: 'TOGGLE_SIDEBAR' });
    mockStore.dispatch({ type: 'UPDATE_USER_TIME' });
  };

  const openUrl = (url: string) => {
    Linking.openURL(url).catch(err => console.error('Failed to open URL:', err));
  };

  const insets = useSafeAreaInsets();
  const topPadding = Math.max(insets.top, Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 14 : 12);
  const bottomPadding = 110 + insets.bottom;

  return (
    <View style={[styles.safeContainer, { paddingTop: topPadding }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: bottomPadding }]}
        showsVerticalScrollIndicator={false}>
        {/* Header Hero Section */}
        <View style={styles.headerHero}>
          <View style={styles.headerBadgeContainer}>
            <SvgBolt color="#5C2D91" size={12} />
            <Text style={[styles.headerBadge, styles.headerBadgeText]}>
              react-native-inapp-inspector
            </Text>
          </View>
          <Text style={styles.headerTitle}>Playground Workbench</Text>
          <Text style={styles.headerSubtitle}>
            Interactive testing suite, NPM package specs, and open-source documentation.
          </Text>
        </View>

        {/* Multi-Tab Navigation Switcher with crisp SVG icons */}
        <View style={styles.tabBarContainer}>
          <Pressable
            style={[styles.tabItem, activeTab === 'tests' && styles.tabItemActive]}
            onPress={() => setActiveTab('tests')}
          >
            <SvgBolt color={activeTab === 'tests' ? '#FFFFFF' : '#64748B'} size={13} />
            <Text style={[styles.tabText, activeTab === 'tests' && styles.tabTextActive]}>
              Tests
            </Text>
          </Pressable>

          <Pressable
            style={[styles.tabItem, activeTab === 'npm' && styles.tabItemActive]}
            onPress={() => setActiveTab('npm')}
          >
            <SvgPackage color={activeTab === 'npm' ? '#FFFFFF' : '#64748B'} size={13} />
            <Text style={[styles.tabText, activeTab === 'npm' && styles.tabTextActive]}>NPM</Text>
          </Pressable>

          <Pressable
            style={[styles.tabItem, activeTab === 'github' && styles.tabItemActive]}
            onPress={() => setActiveTab('github')}
          >
            <SvgGitHub color={activeTab === 'github' ? '#FFFFFF' : '#64748B'} size={13} />
            <Text style={[styles.tabText, activeTab === 'github' && styles.tabTextActive]}>
              GitHub
            </Text>
          </Pressable>
        </View>

        {/* ─── TAB 1: TESTS SUITE ────────────────────────────────────────────── */}
        {activeTab === 'tests' && (
          <>
            {/* Live Activity Telemetry Card */}
            <ModuleErrorBoundary moduleName="Live Telemetry Module">
              <ActivityGraphicsCard
                apiCount={apiCount}
                logCount={logCount}
                analyticsCount={analyticsCount}
                sidebarOpen={Boolean(reduxState.ui?.sidebarOpen)}
                history={activityHistory}
                status={lastActionStatus}
              />
            </ModuleErrorBoundary>

            {/* API & Network Tests */}
            <ModuleErrorBoundary moduleName="Standard Fetch Module">
              <View style={styles.panelCard}>
                <View style={styles.panelHeaderRow}>
                  <View style={styles.rowAlignCenterGap6}>
                    <SvgGlobe color="#0284C7" size={14} />
                    <Text style={styles.panelHeader}>Standard Fetch Requests</Text>
                  </View>
                  <Text style={styles.panelHeaderBadge}>HTTP / REST</Text>
                </View>
                <View style={styles.btnRow}>
                  <TactileButton
                    label="Fetch (200 OK)"
                    onPress={triggerNetworkRequest}
                    color="#0284C7"
                    bgColor="#F0F9FF"
                    icon={<SvgCheckCircle color="#0284C7" size={13} />}
                  />
                  <TactileButton
                    label="Fetch (404 Error)"
                    onPress={triggerFailedNetworkRequest}
                    color="#E11D48"
                    bgColor="#FFF1F2"
                    icon={<SvgAlertCircle color="#E11D48" size={13} />}
                  />
                </View>
              </View>
            </ModuleErrorBoundary>

            {/* Axios Interception */}
            <ModuleErrorBoundary moduleName="Axios Suite Module">
              <View style={styles.panelCard}>
                <View style={styles.panelHeaderRow}>
                  <View style={styles.rowAlignCenterGap6}>
                    <SvgBolt color="#059669" size={14} />
                    <Text style={styles.panelHeader}>Axios Auto-Interception</Text>
                  </View>
                  <Text style={styles.panelHeaderBadge}>AXIOS METHODS</Text>
                </View>
                <View style={styles.gap8}>
                  <View style={styles.btnRow}>
                    <TactileButton
                      label="GET (200 OK)"
                      onPress={triggerAxiosGet}
                      color="#059669"
                      bgColor="#ECFDF5"
                      icon={<SvgCheckCircle color="#059669" size={13} />}
                    />
                    <TactileButton
                      label="POST (Create)"
                      onPress={triggerAxiosPost}
                      color="#7C3AED"
                      bgColor="#F5F3FF"
                      icon={<SvgPlus color="#7C3AED" size={13} />}
                    />
                  </View>
                  <View style={styles.btnRow}>
                    <TactileButton
                      label="PUT (Replace)"
                      onPress={triggerAxiosPut}
                      color="#D97706"
                      bgColor="#FFFBEB"
                      icon={<SvgRefresh color="#D97706" size={13} />}
                    />
                    <TactileButton
                      label="PATCH (Update)"
                      onPress={triggerAxiosPatch}
                      color="#0284C7"
                      bgColor="#F0F9FF"
                      icon={<SvgEdit color="#0284C7" size={13} />}
                    />
                  </View>
                  <TactileButton
                    label="DELETE (Remove Resource)"
                    onPress={triggerAxiosDelete}
                    color="#DC2626"
                    bgColor="#FEF2F2"
                    icon={<SvgTrash color="#DC2626" size={13} />}
                    fullWidth
                  />
                </View>
              </View>
            </ModuleErrorBoundary>

            {/* Console & Stack Traces */}
            <ModuleErrorBoundary moduleName="Console & Stack Logger Module">
              <View style={styles.panelCard}>
                <View style={styles.panelHeaderRow}>
                  <View style={styles.rowAlignCenterGap6}>
                    <SvgTerminal color="#4F46E5" size={14} />
                    <Text style={styles.panelHeader}>Console Logs & Stack Traces</Text>
                  </View>
                  <Text style={styles.panelHeaderBadge}>CALL STACK</Text>
                </View>
                <TactileButton
                  label="Trigger Log, Warn & Error Levels"
                  onPress={triggerConsoleLogs}
                  color="#4F46E5"
                  bgColor="#4F46E5"
                  icon={<SvgTerminal color="#FFFFFF" size={13} />}
                  fullWidth
                />

                <View style={[styles.btnRow, styles.mt4]}>
                  <TactileButton
                    label="Multi-Arg Object"
                    onPress={() => {
                      notifyAction('Multi-Arg Logged');
                      console.log(
                        'Multi-argument payload inspection:',
                        {
                          userId: 101,
                          username: 'venkatesh',
                          role: 'Lead Architect',
                        },
                        ['permissions.read', 'permissions.write', 'permissions.admin'],
                        {
                          device: 'iPhone 15 Pro',
                          os: 'iOS 18.0',
                          battery: '92%',
                        },
                      );
                    }}
                    color="#7C3AED"
                    bgColor="#F5F3FF"
                    icon={<SvgCode color="#7C3AED" size={13} />}
                  />
                  <TactileButton
                    label="Deep Error Stack"
                    onPress={() => {
                      notifyAction('Error Stack Logged');
                      try {
                        throw new TypeError(
                          'Cannot read properties of undefined (reading "authToken")',
                        );
                      } catch (err) {
                        console.error(err);
                      }
                    }}
                    color="#DC2626"
                    bgColor="#FEF2F2"
                    icon={<SvgAlertTriangle color="#DC2626" size={13} />}
                  />
                </View>
              </View>
            </ModuleErrorBoundary>

            {/* Analytics Events */}
            <ModuleErrorBoundary moduleName="Analytics & GA4 Events Module">
              <View style={styles.panelCard}>
                <View style={styles.panelHeaderRow}>
                  <View style={styles.rowAlignCenterGap6}>
                    <SvgAnalytics color="#0D9488" size={14} />
                    <Text style={styles.panelHeader}>Analytics & GA4 Events</Text>
                  </View>
                  <Text style={styles.panelHeaderBadge}>GA4 / FIREBASE</Text>
                </View>
                <View style={styles.btnRow}>
                  <TactileButton
                    label="Screen View"
                    onPress={() => {
                      notifyAction('Screen View Logged');
                      console.log('[App] Logged custom analytics event: screen_view');
                      logAnalyticsEvent('screen_view', {
                        screen_name: 'HomeScreen',
                        screen_class: 'HomeScreenComponent',
                        viewed_at: new Date().toLocaleTimeString(),
                      });
                    }}
                    color="#0284C7"
                    bgColor="#F0F9FF"
                    icon={<SvgEye color="#0284C7" size={13} />}
                  />
                  <TactileButton
                    label="Ecommerce Purchase"
                    onPress={() => {
                      notifyAction('Purchase Logged');
                      console.log('[App] Logged analytics ecommerce event: item_purchase');
                      logAnalyticsEvent(
                        'item_purchase',
                        {
                          item_id: 'prod_999',
                          item_name: 'Premium Debug Kit',
                          price: 29.99,
                          currency: 'USD',
                          items: [
                            {
                              id: 'prod_999',
                              name: 'Premium Debug Kit',
                              price: 29.99,
                            },
                          ],
                        },
                        {
                          user_tier: 'gold_member',
                          signup_platform: 'ios_app',
                        },
                      );
                    }}
                    color="#059669"
                    bgColor="#ECFDF5"
                    icon={<SvgShoppingBag color="#059669" size={13} />}
                  />
                </View>
              </View>
            </ModuleErrorBoundary>

            {/* Redux State Actions */}
            <ModuleErrorBoundary moduleName="Redux Store & Time-Travel Module">
              <View style={styles.panelCard}>
                <View style={styles.panelHeaderRow}>
                  <View style={styles.rowAlignCenterGap6}>
                    <SvgAtom color="#7C3AED" size={14} />
                    <Text style={styles.panelHeader}>Redux Store & Time-Travel</Text>
                  </View>
                  <Text style={styles.panelHeaderBadge}>STATE TIMELINE</Text>
                </View>
                <View style={styles.btnRow}>
                  <TactileButton
                    label="Toggle Sidebar"
                    onPress={handleToggleSidebar}
                    color="#059669"
                    bgColor="#ECFDF5"
                    icon={<SvgSidebar color="#059669" size={13} />}
                  />
                  <TactileButton
                    label="Toggle Theme"
                    onPress={() => {
                      notifyAction('Theme Toggled');
                      mockStore.dispatch({
                        type: 'SET_THEME',
                        payload: mockStore.getState().settings.theme === 'dark' ? 'light' : 'dark',
                      });
                    }}
                    color="#0891B2"
                    bgColor="#ECFEFF"
                    icon={<SvgMoon color="#0891B2" size={13} />}
                  />
                </View>
                <TactileButton
                  label="⚡ Dispatch Saga Action: auth/loginWithSaga"
                  onPress={() => {
                    notifyAction('Saga Action Dispatched');
                    mockStore.dispatch({
                      type: 'auth/loginWithSaga',
                      payload: { user: 'Venkatesh', authType: 'OAuth2' },
                      __origin: 'saga',
                    });
                  }}
                  color="#7C3AED"
                  bgColor="#F5F3FF"
                  icon={<SvgBolt color="#7C3AED" size={13} />}
                  fullWidth
                />
                <TactileButton
                  label="⚛️ Dispatch Thunk Action: users/fetch/fulfilled"
                  onPress={() => {
                    notifyAction('Thunk Action Dispatched');
                    mockStore.dispatch({
                      type: 'users/fetch/fulfilled',
                      payload: { id: 101, status: 'synced', role: 'Architect' },
                      __origin: 'thunk',
                    });
                  }}
                  color="#D97706"
                  bgColor="#FFFBEB"
                  icon={<SvgAtom color="#D97706" size={13} />}
                  fullWidth
                />
                <TactileButton
                  label="Dispatch: Toggle Sidebar & Update Timestamp"
                  onPress={handleToggleSidebar}
                  color="#7C3AED"
                  bgColor="#7C3AED"
                  icon={<SvgRefresh color="#FFFFFF" size={13} />}
                  fullWidth
                />
              </View>
            </ModuleErrorBoundary>

            {/* Navigation Routing */}
            <ModuleErrorBoundary moduleName="Screen Navigation Module">
              <View style={styles.panelCard}>
                <View style={styles.panelHeaderRow}>
                  <Text style={styles.panelHeader}>Screen Navigation</Text>
                  <Text style={styles.panelHeaderBadge}>BREADCRUMBS</Text>
                </View>
                <TactileButton
                  label="Go to Details Screen"
                  onPress={() => navigation.navigate('Details')}
                  color="#059669"
                  bgColor="#059669"
                  icon={<SvgExternalLink color="#FFFFFF" size={12} />}
                  fullWidth
                />
              </View>
            </ModuleErrorBoundary>

            {/* Crash Exception Simulation with Fault Isolation */}
            <ModuleErrorBoundary
              moduleName="Fault-Isolated Simulation Module"
              onRetry={() => setFaultyModuleBroken(false)}
            >
              <FaultySimulatedModule shouldFail={faultyModuleBroken} />
              <View style={[styles.panelCard, styles.panelCardCrash]}>
                <View style={styles.panelHeaderRow}>
                  <Text style={[styles.panelHeader, styles.panelHeaderCrash]}>Exception Simulation</Text>
                  <Text
                    style={[
                      styles.panelHeaderBadge,
                      styles.panelHeaderBadgeCrash,
                    ]}
                  >
                    CRASH TESTING
                  </Text>
                </View>
                <View style={styles.btnRow}>
                  <TactileButton
                    label="Simulate JS Exception"
                    onPress={() => {
                      simulateTestCrash('js');
                    }}
                    color="#E11D48"
                    bgColor="#FFF1F2"
                    icon={<SvgAlertTriangle color="#E11D48" size={13} />}
                  />
                  <TactileButton
                    label="Simulate Native Exception"
                    onPress={() => {
                      simulateTestCrash('native');
                    }}
                    color="#DC2626"
                    bgColor="#FEF2F2"
                    icon={<SvgCpu color="#DC2626" size={13} />}
                  />
                </View>
                <TactileButton
                  label={
                    faultyModuleBroken
                      ? 'Recover Fault-Isolated Module'
                      : '💥 Trigger Fault-Isolated Module Crash'
                  }
                  onPress={() => {
                    const nextState = !faultyModuleBroken;
                    setFaultyModuleBroken(nextState);
                    notifyAction(
                      nextState
                        ? 'Micro-UI Crashed (Isolated)'
                        : 'Micro-UI Recovered',
                    );
                  }}
                  color="#B91C1C"
                  bgColor="#FEF2F2"
                  icon={<SvgAlertTriangle color="#B91C1C" size={13} />}
                  fullWidth
                />
              </View>
            </ModuleErrorBoundary>

            {/* Push Notifications Simulation Panel */}
            <ModuleErrorBoundary moduleName="Push Notification Simulation Module">
              <View style={styles.panelCard}>
                <View style={styles.panelHeaderRow}>
                  <View style={styles.rowAlignCenterGap6}>
                    <SvgBell color="#4F46E5" size={15} />
                    <Text style={styles.panelHeader}>Push Notifications</Text>
                  </View>
                  <Text
                    style={[
                      styles.panelHeaderBadge,
                      {backgroundColor: '#EEF2FF', color: '#4F46E5'},
                    ]}
                  >
                    UNIVERSAL INGESTION
                  </Text>
                </View>

                <View style={styles.btnRow}>
                  <TactileButton
                    label="Salesforce MC Push"
                    onPress={() => {
                      simulateTestPush('salesforce');
                      notifyAction('Salesforce MC Push Received');
                    }}
                    color="#0284C7"
                    bgColor="#F0F9FF"
                    icon={<SvgBell color="#0284C7" size={13} />}
                  />
                  <TactileButton
                    label="Firebase FCM Push"
                    onPress={() => {
                      simulateTestPush('fcm');
                      notifyAction('Firebase FCM Push Received');
                    }}
                    color="#EA580C"
                    bgColor="#FFF7ED"
                    icon={<SvgBell color="#EA580C" size={13} />}
                  />
                </View>

                <View style={styles.btnRow}>
                  <TactileButton
                    label="Apple APNs Push"
                    onPress={() => {
                      simulateTestPush('apns');
                      notifyAction('Apple APNs Push Received');
                    }}
                    color="#334155"
                    bgColor="#F8FAFC"
                    icon={<SvgBell color="#334155" size={13} />}
                  />
                  <TactileButton
                    label="Deep Link Push (Open)"
                    onPress={() => {
                      simulateTestPush('deeplink');
                      notifyAction('Deep Link Push Opened');
                    }}
                    color="#7C3AED"
                    bgColor="#F5F3FF"
                    icon={<SvgBolt color="#7C3AED" size={13} />}
                  />
                </View>
              </View>
            </ModuleErrorBoundary>
          </>
        )}

        {/* ─── TAB 2: NPM REGISTRY ───────────────────────────────────────────── */}
        {activeTab === 'npm' && (
          <>
            <ModuleErrorBoundary moduleName="NPM Package Registry Specs">
              <View style={styles.panelCard}>
                <View style={styles.panelHeaderRow}>
                  <View style={styles.rowAlignCenterGap6}>
                    <SvgPackage color="#5C2D91" size={15} />
                    <Text style={styles.panelHeader}>NPM Package Specs</Text>
                  </View>
                  <Text
                    style={[
                      styles.panelHeaderBadge,
                      styles.panelHeaderBadgeNpm,
                    ]}
                  >
                    PUBLISHED • v{npmMeta.version}
                  </Text>
                </View>

                {/* Dynamic Install Code Snippet */}
                <View style={styles.codeSnippet}>
                  <Text style={styles.codeText}>npm i react-native-inapp-inspector@{npmMeta.version}</Text>
                </View>

                {/* Dynamic Live Metrics Strip */}
                <View style={styles.metricsStrip}>
                  <View style={[styles.statBox, styles.statBoxPv8]}>
                    <Text style={[styles.statVal, styles.statValPurple]}>v{npmMeta.version}</Text>
                    <Text style={styles.statLbl}>NPM LATEST</Text>
                  </View>
                  <View style={[styles.statBox, styles.statBoxPv8]}>
                    <Text style={[styles.statVal, styles.statValGreen]}>
                      {npmMeta.downloadsMonthly !== null ? `${npmMeta.downloadsMonthly.toLocaleString()}` : '1.2k+'}
                    </Text>
                    <Text style={styles.statLbl}>DOWNLOADS/MO</Text>
                  </View>
                  <View style={[styles.statBox, styles.statBoxPv8]}>
                    <Text style={[styles.statVal, styles.statValBlue]}>{npmMeta.license}</Text>
                    <Text style={styles.statLbl}>LICENSE</Text>
                  </View>
                </View>

                <View style={styles.gap2Mt4}>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Package Name</Text>
                    <Text style={styles.infoValue}>react-native-inapp-inspector</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Installed Library Version</Text>
                    <Text style={[styles.infoValue, styles.infoValuePurple]}>v{LIB_VERSION}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>NPM Published Version</Text>
                    <Text style={[styles.infoValue, styles.infoValueGreen]}>v{npmMeta.version}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Native Architecture</Text>
                    <Text style={[styles.infoValue, styles.infoValueIndigo]}>
                      Kotlin (Android) + Obj-C (iOS)
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Native Module Linked</Text>
                    <Text
                      style={[
                        styles.infoValue,
                        isNativeModuleAvailable() ? styles.infoValueGreen : styles.infoValueAmber,
                      ]}
                    >
                      {isNativeModuleAvailable() ? 'YES (Active)' : 'NO (JS Fallback)'}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Module Formats</Text>
                    <Text style={styles.infoValue}>CommonJS + ESM + TypeScript</Text>
                  </View>
                </View>

                <TactileButton
                  label="Fetch Native Device Telemetry"
                  onPress={async () => {
                    notifyAction('Native Metrics Fetched');
                    const metrics = await getNativeDeviceMetrics();
                    if (metrics) {
                      console.log('[PERF] ⚡ Native Hardware Telemetry:', metrics);
                    } else {
                      console.log('[PERF] ⚡ Native module not linked or running in pure JS mode.');
                    }
                  }}
                  color="#5C2D91"
                  bgColor="#F3E8FF"
                  icon={<SvgBolt color="#5C2D91" size={13} />}
                  fullWidth
                />

                <TactileButton
                  label="View Package on NPM Registry"
                  onPress={() =>
                    openUrl('https://www.npmjs.com/package/react-native-inapp-inspector')
                  }
                  color="#CC3534"
                  bgColor="#CC3534"
                  icon={<SvgPackage color="#FFFFFF" size={13} />}
                  fullWidth
                />
              </View>
            </ModuleErrorBoundary>

            <ModuleErrorBoundary moduleName="Key Features Overview">
              <View style={styles.panelCard}>
                <View style={styles.panelHeaderRow}>
                  <Text style={styles.panelHeader}>Key Features</Text>
                  <Text style={styles.panelHeaderBadge}>ALL-IN-ONE</Text>
                </View>
                <View style={styles.gap6}>
                  <Text style={styles.featureBulletText}>
                    • <Text style={styles.featureBulletBold}>Network Inspector:</Text> Auto-intercepts
                    Axios, Fetch, and XMLHttpRequest with cURL copy and headers.
                  </Text>
                  <Text style={styles.featureBulletText}>
                    • <Text style={styles.featureBulletBold}>Console & Stack Trace:</Text> Symbolicated
                    source line and column coordinates directly from Metro.
                  </Text>
                  <Text style={styles.featureBulletText}>
                    • <Text style={styles.featureBulletBold}>Redux Time-Travel:</Text> Dispatched action
                    timeline, slice diff viewer, and state inspection.
                  </Text>
                  <Text style={styles.featureBulletText}>
                    • <Text style={styles.featureBulletBold}>Firebase & GA4 Analytics:</Text> Automatic
                    screen and ecommerce event category detection.
                  </Text>
                  <Text style={styles.featureBulletText}>
                    • <Text style={styles.featureBulletBold}>Bundle & Performance Analyzer:</Text>{' '}
                    Real-time FPS monitor and JS asset ratio treemaps.
                  </Text>
                </View>
              </View>
            </ModuleErrorBoundary>
          </>
        )}

        {/* ─── TAB 3: GITHUB & DOCS ─────────────────────────────────────────── */}
        {activeTab === 'github' && (
          <>
            <ModuleErrorBoundary moduleName="Open Source GitHub Repository">
              <View style={styles.panelCard}>
                <View style={styles.panelHeaderRow}>
                  <View style={styles.rowAlignCenterGap6}>
                    <SvgGitHub color="#0F172A" size={15} />
                    <Text style={styles.panelHeader}>Open Source Repository</Text>
                  </View>
                  <Text
                    style={[
                      styles.panelHeaderBadge,
                      styles.panelHeaderBadgeGithub,
                    ]}
                  >
                    GITHUB • {githubMeta.defaultBranch}
                  </Text>
                </View>

                {/* Dynamic Live GitHub Metrics Strip */}
                <View style={styles.metricsStrip}>
                  <View style={[styles.statBox, styles.statBoxPv8]}>
                    <View style={styles.rowAlignCenterGap4}>
                      <SvgStar color="#EAB308" size={13} />
                      <Text style={[styles.statVal, styles.statValDark]}>
                        {githubMeta.stars}
                      </Text>
                    </View>
                    <Text style={styles.statLbl}>STARS</Text>
                  </View>
                  <View style={[styles.statBox, styles.statBoxPv8]}>
                    <View style={styles.rowAlignCenterGap4}>
                      <SvgFork color="#64748B" size={13} />
                      <Text style={[styles.statVal, styles.statValDark]}>
                        {githubMeta.forks}
                      </Text>
                    </View>
                    <Text style={styles.statLbl}>FORKS</Text>
                  </View>
                  <View style={[styles.statBox, styles.statBoxPv8]}>
                    <Text style={[styles.statVal, styles.statValRed]}>
                      {githubMeta.openIssues}
                    </Text>
                    <Text style={styles.statLbl}>ISSUES</Text>
                  </View>
                </View>

                <View style={styles.gap2Mt4}>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Repository</Text>
                    <Text style={styles.infoValue}>vengatmacuser/react-native-inapp-inspector</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Author / Creator</Text>
                    <Text style={styles.infoValue}>Vengateswaran Balakrishnan</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Release Version</Text>
                    <Text style={[styles.infoValue, styles.infoValuePurple]}>v{LIB_VERSION}</Text>
                  </View>
                  {githubMeta.pushedAt ? (
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Last Updated</Text>
                      <Text style={styles.infoValue}>{githubMeta.pushedAt}</Text>
                    </View>
                  ) : null}
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Platform Support</Text>
                    <Text style={styles.infoValue}>iOS, Android, Expo, RN 0.60+</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>License</Text>
                    <Text style={styles.infoValue}>{githubMeta.license}</Text>
                  </View>
                </View>

                <View style={styles.gap8Mt4}>
                  <TactileButton
                    label="Star & View on GitHub"
                    onPress={() =>
                      openUrl('https://github.com/vengatmacuser/react-native-inapp-inspector')
                    }
                    color="#24292F"
                    bgColor="#24292F"
                    icon={<SvgStar color="#FACC15" size={13} />}
                    fullWidth
                  />
                  <TactileButton
                    label="Report Issue / Request Feature"
                    onPress={() =>
                      openUrl('https://github.com/vengatmacuser/react-native-inapp-inspector/issues')
                    }
                    color="#0284C7"
                    bgColor="#0284C7"
                    icon={<SvgBug color="#FFFFFF" size={13} />}
                    fullWidth
                  />
                  <TactileButton
                    label="Sponsor on GitHub ❤️"
                    onPress={() => openUrl('https://github.com/sponsors/vengatmacuser')}
                    color="#DB2777"
                    bgColor="#DB2777"
                    icon={<SvgHeart color="#FFFFFF" size={13} />}
                    fullWidth
                  />
                </View>
              </View>
            </ModuleErrorBoundary>

            <ModuleErrorBoundary moduleName="Quick Setup Guide">
              <View style={styles.panelCard}>
                <View style={styles.panelHeaderRow}>
                  <Text style={styles.panelHeader}>Quick Setup Guide</Text>
                  <Text style={styles.panelHeaderBadge}>ZERO CONFIG</Text>
                </View>
                <View style={styles.codeSnippet}>
                  <Text style={styles.codeText}>
                    {`import NetworkInspector, {\n  setupNetworkLogger\n} from 'react-native-inapp-inspector';\n\nsetupNetworkLogger();\n\nexport default function App() {\n  return <NetworkInspector />;\n}`}
                  </Text>
                </View>
              </View>
            </ModuleErrorBoundary>
          </>
        )}
      </ScrollView>

      {/* ─── STATIC FOOTER ACTION BAR: FAST BATCH SIMULATION ──────────────── */}
      <View style={[styles.staticFooterContainer, { paddingBottom: Math.max(14, insets.bottom + 8) }]}>
        <Pressable
          style={({ pressed }) => [
            styles.footerButton,
            {
              opacity: pressed ? 0.85 : 1,
              transform: [{ scale: pressed ? 0.97 : 1 }],
            },
          ]}
          onPress={triggerSampleAll}
          android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
        >
          <SvgBolt color="#FFFFFF" size={16} />
          <Text style={styles.footerButtonText}>Trigger Fast Batch Sample Data</Text>
        </Pressable>
      </View>
    </View>
  );
}
