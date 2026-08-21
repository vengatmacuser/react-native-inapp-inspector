import React, { useState, useEffect, useMemo } from 'react';
import {
  Text,
  Pressable,
  View,
  ScrollView,
  SafeAreaView,
  Linking,
  Dimensions,
} from 'react-native';
import Svg, { Path, Circle, Rect, Ellipse, Line } from 'react-native-svg';
import axios from 'axios';
import {
  subscribeNetworkLogs,
  subscribeConsoleLogs,
  logAnalyticsEvent,
  subscribeAnalyticsEvents,
  simulateTestCrash,
  getNativeDeviceMetrics,
  isNativeModuleAvailable,
} from 'react-native-inapp-inspector';
import { mockStore } from '../store/mockStore';
import { styles } from '../styles/appStyles';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Crisp SVG Vector Icons ───────────────────────────────────────────────────

const SvgBolt = ({
  color = '#FFFFFF',
  size = 14,
}: {
  color?: string;
  size?: number;
}) => (
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

const SvgPackage = ({
  color = '#64748B',
  size = 14,
}: {
  color?: string;
  size?: number;
}) => (
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

const SvgGitHub = ({
  color = '#64748B',
  size = 14,
}: {
  color?: string;
  size?: number;
}) => (
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

const SvgGlobe = ({
  color = '#0284C7',
  size = 14,
}: {
  color?: string;
  size?: number;
}) => (
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

const SvgTerminal = ({
  color = '#4F46E5',
  size = 14,
}: {
  color?: string;
  size?: number;
}) => (
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

const SvgAnalytics = ({
  color = '#0D9488',
  size = 14,
}: {
  color?: string;
  size?: number;
}) => (
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

const SvgAtom = ({
  color = '#7C3AED',
  size = 14,
}: {
  color?: string;
  size?: number;
}) => (
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

const SvgExternalLink = ({
  color = '#FFFFFF',
  size = 12,
}: {
  color?: string;
  size?: number;
}) => (
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

// ─── Tactile Interactive Button Component ─────────────────────────────────────
interface TactileButtonProps {
  label: string;
  onPress: () => void | Promise<void>;
  color: string;
  bgColor: string;
  fullWidth?: boolean;
  icon?: React.ReactNode;
}

const TactileButton = ({
  label,
  onPress,
  color,
  bgColor,
  fullWidth,
  icon,
}: TactileButtonProps) => {
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
          gap: 6,
        },
      ]}
      android_ripple={{ color: 'rgba(0,0,0,0.1)' }}
    >
      {icon}
      <Text
        style={[
          fullWidth ? styles.fullWidthBtnText : styles.btnText,
          !fullWidth ? { color } : undefined,
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
  const chartWidth = SCREEN_WIDTH - 64;
  const chartHeight = 70;

  const totalEvents = apiCount + logCount + analyticsCount;
  const apiPct =
    totalEvents > 0 ? Math.round((apiCount / totalEvents) * 100) : 33;
  const logPct =
    totalEvents > 0 ? Math.round((logCount / totalEvents) * 100) : 45;
  const analyticsPct =
    totalEvents > 0 ? Math.max(0, 100 - apiPct - logPct) : 22;

  // 10 chronological time bars (-18s to NOW)
  const barData = useMemo(() => {
    const raw =
      history.length >= 10
        ? history.slice(-10)
        : [2, 4, 3, 7, 5, 8, 12, 9, 14, 18];
    const maxVal = Math.max(...raw, 15);
    return raw.map(val => ({
      val,
      height: Math.max(6, (val / maxVal) * (chartHeight - 20)),
    }));
  }, [history, chartHeight]);

  const barSlotWidth = chartWidth / barData.length;
  const barWidth = Math.max(8, barSlotWidth - 8);

  return (
    <View style={styles.statsCard}>
      {/* Header: Title + Live Status Badge */}
      <View style={styles.sectionTitleRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <SvgAnalytics color="#4F46E5" size={15} />
          <Text style={styles.sectionTitle}>Live Event Telemetry</Text>
        </View>
        <View style={styles.liveIndicator}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>
            {status ? status.toUpperCase() : 'STREAMING'}
          </Text>
        </View>
      </View>

      {/* Understandable Bar Chart with Time Axis and Grid lines */}
      <View
        style={{
          backgroundColor: '#F8FAFC',
          borderRadius: 12,
          borderWidth: 1,
          borderColor: '#E2E8F0',
          paddingTop: 8,
          paddingBottom: 4,
          paddingHorizontal: 8,
        }}
      >
        {/* Top rate indicator */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginBottom: 4,
          }}
        >
          <Text style={{ fontSize: 10, fontWeight: '700', color: '#64748B' }}>
            Throughput:{' '}
            <Text style={{ color: '#4F46E5' }}>{totalEvents} Total Events</Text>
          </Text>
          <Text style={{ fontSize: 10, fontWeight: '700', color: '#16A34A' }}>
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
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            paddingTop: 2,
            borderTopWidth: 1,
            borderTopColor: '#E2E8F0',
          }}
        >
          <Text style={{ fontSize: 9, color: '#94A3B8', fontWeight: '700' }}>
            -18s
          </Text>
          <Text style={{ fontSize: 9, color: '#94A3B8', fontWeight: '700' }}>
            -12s
          </Text>
          <Text style={{ fontSize: 9, color: '#94A3B8', fontWeight: '700' }}>
            -6s
          </Text>
          <Text style={{ fontSize: 9, color: '#4F46E5', fontWeight: '800' }}>
            NOW ●
          </Text>
        </View>
      </View>

      {/* Proportional Category Distribution Bar */}
      <View style={{ gap: 6 }}>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Text
            style={{
              fontSize: 10.5,
              fontWeight: '800',
              color: '#0F172A',
              textTransform: 'uppercase',
            }}
          >
            Event Breakdown
          </Text>
          <Text style={{ fontSize: 10, color: '#64748B', fontWeight: '600' }}>
            {totalEvents} Captured
          </Text>
        </View>

        <View
          style={{
            flexDirection: 'row',
            height: 8,
            borderRadius: 4,
            overflow: 'hidden',
            backgroundColor: '#E2E8F0',
          }}
        >
          <View
            style={{ flex: Math.max(5, apiPct), backgroundColor: '#4F46E5' }}
          />
          <View
            style={{ flex: Math.max(5, logPct), backgroundColor: '#F59E0B' }}
          />
          <View
            style={{
              flex: Math.max(5, analyticsPct),
              backgroundColor: '#0D9488',
            }}
          />
        </View>

        {/* Legend Ratio Breakdown */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 2,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <View
              style={{
                width: 7,
                height: 7,
                borderRadius: 3.5,
                backgroundColor: '#4F46E5',
              }}
            />
            <Text style={{ fontSize: 10, fontWeight: '700', color: '#4F46E5' }}>
              APIs {apiPct}%
            </Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <View
              style={{
                width: 7,
                height: 7,
                borderRadius: 3.5,
                backgroundColor: '#F59E0B',
              }}
            />
            <Text style={{ fontSize: 10, fontWeight: '700', color: '#D97706' }}>
              Logs {logPct}%
            </Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <View
              style={{
                width: 7,
                height: 7,
                borderRadius: 3.5,
                backgroundColor: '#0D9488',
              }}
            />
            <Text style={{ fontSize: 10, fontWeight: '700', color: '#0D9488' }}>
              Events {analyticsPct}%
            </Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <View
              style={{
                width: 7,
                height: 7,
                borderRadius: 3.5,
                backgroundColor: '#7C3AED',
              }}
            />
            <Text style={{ fontSize: 10, fontWeight: '700', color: '#7C3AED' }}>
              {sidebarOpen ? 'Open' : 'Closed'}
            </Text>
          </View>
        </View>
      </View>

      {/* KPI Counters Grid */}
      <View style={styles.statsGrid}>
        <View style={styles.statBox}>
          <Text style={[styles.statVal, { color: '#4F46E5' }]}>{apiCount}</Text>
          <Text style={styles.statLbl}>APIs</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statVal, { color: '#D97706' }]}>{logCount}</Text>
          <Text style={styles.statLbl}>Logs</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statVal, { color: '#0D9488' }]}>
            {analyticsCount}
          </Text>
          <Text style={styles.statLbl}>Events</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statVal, { color: '#7C3AED' }]}>
            {sidebarOpen ? 'Open' : 'Closed'}
          </Text>
          <Text style={styles.statLbl}>Store</Text>
        </View>
      </View>
    </View>
  );
};

export function HomeScreen({ navigation }: any) {
  const [activeTab, setActiveTab] = useState<'tests' | 'npm' | 'github'>(
    'tests',
  );
  const [apiCount, setApiCount] = useState(0);
  const [logCount, setLogCount] = useState(0);
  const [analyticsCount, setAnalyticsCount] = useState(0);
  const [reduxState, setReduxState] = useState(mockStore.getState());
  const [lastActionStatus, setLastActionStatus] = useState<string | null>(null);
  const [activityHistory, setActivityHistory] = useState<number[]>([
    3, 5, 8, 4, 12, 16, 9, 15, 20, 24,
  ]);

  const notifyAction = (name: string) => {
    setLastActionStatus(name);
    setActivityHistory(prev => {
      const nextVal = Math.floor(Math.random() * 8 + 6);
      const updated = [...prev, nextVal];
      return updated.slice(-10);
    });
  };

  useEffect(() => {
    // Subscribe to logs to display live dashboard counters
    const unsubNet = subscribeNetworkLogs(logs => {
      setApiCount(logs.length);
      setActivityHistory(prev => [
        ...prev.slice(-9),
        Math.max(2, (logs.length % 20) + 2),
      ]);
    });
    const unsubConsole = subscribeConsoleLogs(logs => {
      setLogCount(logs.length);
      setActivityHistory(prev => [
        ...prev.slice(-9),
        Math.max(2, (logs.length % 20) + 3),
      ]);
    });
    const unsubAnalytics = subscribeAnalyticsEvents(events => {
      setAnalyticsCount(events.length);
      setActivityHistory(prev => [
        ...prev.slice(-9),
        Math.max(2, (events.length % 20) + 1),
      ]);
    });
    const unsubRedux = mockStore.subscribe(() =>
      setReduxState(mockStore.getState()),
    );

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
      const response = await fetch(
        'https://jsonplaceholder.typicode.com/users/1',
      );
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
    console.log(
      '[App] Manual log triggered at ' + new Date().toLocaleTimeString(),
    );
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

    console.log(
      `[Sample] Firing sample-all at ${new Date().toLocaleTimeString()}`,
    );
    console.warn('[Sample] Randomized warning: throttled API response');
    console.error('[Sample] Randomized error: timeout on retry attempt #3');
    console.log(
      randomConsoleMessages[
        Math.floor(Math.random() * randomConsoleMessages.length)
      ],
    );

    triggerAxiosGet();
    triggerAxiosPost();
    triggerAxiosPut();
    triggerAxiosPatch();
    triggerAxiosDelete();
    triggerNetworkRequest();
    triggerFailedNetworkRequest();

    logAnalyticsEvent(
      randomAnalyticsEvents[
        Math.floor(Math.random() * randomAnalyticsEvents.length)
      ],
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

    fetch(
      `https://jsonplaceholder.typicode.com/posts/${Math.floor(
        Math.random() * 8 + 1,
      )}`,
    )
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
    Linking.openURL(url).catch(err =>
      console.error('Failed to open URL:', err),
    );
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Hero Section */}
        <View style={styles.headerHero}>
          <View style={styles.headerBadgeContainer}>
            <SvgBolt color="#4F46E5" size={12} />
            <Text style={[styles.headerBadge, { marginLeft: 4 }]}>
              react-native-inapp-inspector
            </Text>
          </View>
          <Text style={styles.headerTitle}>Playground Workbench</Text>
          <Text style={styles.headerSubtitle}>
            Interactive testing suite, NPM package specs, and open-source
            documentation.
          </Text>
        </View>

        {/* Multi-Tab Navigation Switcher with crisp SVG icons */}
        <View style={styles.tabBarContainer}>
          <Pressable
            style={[
              styles.tabItem,
              activeTab === 'tests' && styles.tabItemActive,
            ]}
            onPress={() => setActiveTab('tests')}
          >
            <SvgBolt
              color={activeTab === 'tests' ? '#FFFFFF' : '#64748B'}
              size={13}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === 'tests' && styles.tabTextActive,
              ]}
            >
              Tests
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.tabItem,
              activeTab === 'npm' && styles.tabItemActive,
            ]}
            onPress={() => setActiveTab('npm')}
          >
            <SvgPackage
              color={activeTab === 'npm' ? '#FFFFFF' : '#64748B'}
              size={13}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === 'npm' && styles.tabTextActive,
              ]}
            >
              NPM
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.tabItem,
              activeTab === 'github' && styles.tabItemActive,
            ]}
            onPress={() => setActiveTab('github')}
          >
            <SvgGitHub
              color={activeTab === 'github' ? '#FFFFFF' : '#64748B'}
              size={13}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === 'github' && styles.tabTextActive,
              ]}
            >
              GitHub
            </Text>
          </Pressable>
        </View>

        {/* ─── TAB 1: TESTS SUITE ────────────────────────────────────────────── */}
        {activeTab === 'tests' && (
          <>
            {/* Live Activity Telemetry Card */}
            <ActivityGraphicsCard
              apiCount={apiCount}
              logCount={logCount}
              analyticsCount={analyticsCount}
              sidebarOpen={Boolean(reduxState.ui?.sidebarOpen)}
              history={activityHistory}
              status={lastActionStatus}
            />

            {/* API & Network Tests */}
            <View style={styles.panelCard}>
              <View style={styles.panelHeaderRow}>
                <View
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
                >
                  <SvgGlobe color="#0284C7" size={14} />
                  <Text style={styles.panelHeader}>
                    Standard Fetch Requests
                  </Text>
                </View>
                <Text style={styles.panelHeaderBadge}>HTTP / REST</Text>
              </View>
              <View style={styles.btnRow}>
                <TactileButton
                  label="Fetch (200 OK)"
                  onPress={triggerNetworkRequest}
                  color="#0284C7"
                  bgColor="#F0F9FF"
                />
                <TactileButton
                  label="Fetch (404 Error)"
                  onPress={triggerFailedNetworkRequest}
                  color="#E11D48"
                  bgColor="#FFF1F2"
                />
              </View>
            </View>

            {/* Axios Interception */}
            <View style={styles.panelCard}>
              <View style={styles.panelHeaderRow}>
                <View
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
                >
                  <SvgBolt color="#059669" size={14} />
                  <Text style={styles.panelHeader}>
                    Axios Auto-Interception
                  </Text>
                </View>
                <Text style={styles.panelHeaderBadge}>AXIOS METHODS</Text>
              </View>
              <View style={{ gap: 8 }}>
                <View style={styles.btnRow}>
                  <TactileButton
                    label="GET (200 OK)"
                    onPress={triggerAxiosGet}
                    color="#059669"
                    bgColor="#ECFDF5"
                  />
                  <TactileButton
                    label="POST (Create)"
                    onPress={triggerAxiosPost}
                    color="#7C3AED"
                    bgColor="#F5F3FF"
                  />
                </View>
                <View style={styles.btnRow}>
                  <TactileButton
                    label="PUT (Replace)"
                    onPress={triggerAxiosPut}
                    color="#D97706"
                    bgColor="#FFFBEB"
                  />
                  <TactileButton
                    label="PATCH (Update)"
                    onPress={triggerAxiosPatch}
                    color="#0284C7"
                    bgColor="#F0F9FF"
                  />
                  <TactileButton
                    label="DELETE"
                    onPress={triggerAxiosDelete}
                    color="#DC2626"
                    bgColor="#FEF2F2"
                  />
                </View>
              </View>
            </View>

            {/* Console & Stack Traces */}
            <View style={styles.panelCard}>
              <View style={styles.panelHeaderRow}>
                <View
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
                >
                  <SvgTerminal color="#4F46E5" size={14} />
                  <Text style={styles.panelHeader}>
                    Console Logs & Stack Traces
                  </Text>
                </View>
                <Text style={styles.panelHeaderBadge}>CALL STACK</Text>
              </View>
              <TactileButton
                label="Trigger Log, Warn & Error Levels"
                onPress={triggerConsoleLogs}
                color="#4F46E5"
                bgColor="#4F46E5"
                fullWidth
              />

              <View style={[styles.btnRow, { marginTop: 4 }]}>
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
                      [
                        'permissions.read',
                        'permissions.write',
                        'permissions.admin',
                      ],
                      {
                        device: 'iPhone 15 Pro',
                        os: 'iOS 18.0',
                        battery: '92%',
                      },
                    );
                  }}
                  color="#7C3AED"
                  bgColor="#F5F3FF"
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
                />
              </View>
            </View>

            {/* Analytics Events */}
            <View style={styles.panelCard}>
              <View style={styles.panelHeaderRow}>
                <View
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
                >
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
                    console.log(
                      '[App] Logged custom analytics event: screen_view',
                    );
                    logAnalyticsEvent('screen_view', {
                      screen_name: 'HomeScreen',
                      screen_class: 'HomeScreenComponent',
                      viewed_at: new Date().toLocaleTimeString(),
                    });
                  }}
                  color="#0284C7"
                  bgColor="#F0F9FF"
                />
                <TactileButton
                  label="Ecommerce Purchase"
                  onPress={() => {
                    notifyAction('Purchase Logged');
                    console.log(
                      '[App] Logged analytics ecommerce event: item_purchase',
                    );
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
                />
              </View>
            </View>

            {/* Redux State Actions */}
            <View style={styles.panelCard}>
              <View style={styles.panelHeaderRow}>
                <View
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
                >
                  <SvgAtom color="#7C3AED" size={14} />
                  <Text style={styles.panelHeader}>
                    Redux Store & Time-Travel
                  </Text>
                </View>
                <Text style={styles.panelHeaderBadge}>STATE TIMELINE</Text>
              </View>
              <View style={styles.btnRow}>
                <TactileButton
                  label="Toggle Sidebar"
                  onPress={handleToggleSidebar}
                  color="#059669"
                  bgColor="#ECFDF5"
                />
                <TactileButton
                  label="Toggle Theme"
                  onPress={() => {
                    notifyAction('Theme Toggled');
                    mockStore.dispatch({
                      type: 'SET_THEME',
                      payload:
                        mockStore.getState().settings.theme === 'dark'
                          ? 'light'
                          : 'dark',
                    });
                  }}
                  color="#0891B2"
                  bgColor="#ECFEFF"
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
                fullWidth
              />
              <TactileButton
                label="Dispatch: Toggle Sidebar & Update Timestamp"
                onPress={handleToggleSidebar}
                color="#7C3AED"
                bgColor="#7C3AED"
                fullWidth
              />
            </View>

            {/* Navigation Routing */}
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

            {/* Crash Exception Simulation */}
            <View style={[styles.panelCard, { borderColor: '#FECDD3' }]}>
              <View style={styles.panelHeaderRow}>
                <Text style={[styles.panelHeader, { color: '#E11D48' }]}>
                  Exception Simulation
                </Text>
                <Text
                  style={[
                    styles.panelHeaderBadge,
                    { backgroundColor: '#FFE4E6', color: '#BE123C' },
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
                />
                <TactileButton
                  label="Simulate Native Exception"
                  onPress={() => {
                    simulateTestCrash('native');
                  }}
                  color="#DC2626"
                  bgColor="#FEF2F2"
                />
              </View>
            </View>
          </>
        )}

        {/* ─── TAB 2: NPM REGISTRY ───────────────────────────────────────────── */}
        {activeTab === 'npm' && (
          <>
            <View style={styles.panelCard}>
              <View style={styles.panelHeaderRow}>
                <View
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
                >
                  <SvgPackage color="#0F172A" size={15} />
                  <Text style={styles.panelHeader}>NPM Package Specs</Text>
                </View>
                <Text
                  style={[
                    styles.panelHeaderBadge,
                    { backgroundColor: '#DCFCE7', color: '#16A34A' },
                  ]}
                >
                  PUBLISHED • v1.1.24
                </Text>
              </View>

              {/* Install Code Snippet */}
              <View style={styles.codeSnippet}>
                <Text style={styles.codeText}>
                  npm i react-native-inapp-inspector
                </Text>
              </View>

              <View style={{ gap: 2 }}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Package Name</Text>
                  <Text style={styles.infoValue}>
                    react-native-inapp-inspector
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Latest Version</Text>
                  <Text style={styles.infoValue}>1.1.35</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Native Architecture</Text>
                  <Text style={[styles.infoValue, { color: '#6366F1' }]}>
                    Kotlin (Android) + Obj-C (iOS)
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Native Module Linked</Text>
                  <Text style={[styles.infoValue, { color: isNativeModuleAvailable() ? '#16A34A' : '#D97706' }]}>
                    {isNativeModuleAvailable() ? 'YES (Active)' : 'NO (JS Fallback)'}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Module Formats</Text>
                  <Text style={styles.infoValue}>
                    CommonJS + ESM + TypeScript
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>License</Text>
                  <Text style={styles.infoValue}>MIT</Text>
                </View>
              </View>

              <TactileButton
                label="Fetch Native Device Telemetry"
                onPress={async () => {
                  const metrics = await getNativeDeviceMetrics();
                  if (metrics) {
                    console.log('[PERF] ⚡ Native Hardware Telemetry:', metrics);
                  } else {
                    console.log('[PERF] ⚡ Native module not linked or running in pure JS mode.');
                  }
                }}
                color="#6366F1"
                bgColor="#EEF2FF"
                icon={<SvgBolt color="#6366F1" size={13} />}
                fullWidth
              />

              <TactileButton
                label="View Package on NPM Registry"
                onPress={() =>
                  openUrl(
                    'https://www.npmjs.com/package/react-native-inapp-inspector',
                  )
                }
                color="#CC3534"
                bgColor="#CC3534"
                icon={<SvgExternalLink color="#FFFFFF" size={13} />}
                fullWidth
              />
            </View>

            <View style={styles.panelCard}>
              <View style={styles.panelHeaderRow}>
                <Text style={styles.panelHeader}>Key Features</Text>
                <Text style={styles.panelHeaderBadge}>ALL-IN-ONE</Text>
              </View>
              <View style={{ gap: 6 }}>
                <Text
                  style={{ fontSize: 12, color: '#334155', lineHeight: 18 }}
                >
                  •{' '}
                  <Text style={{ fontWeight: '700' }}>Network Inspector:</Text>{' '}
                  Auto-intercepts Axios, Fetch, and XMLHttpRequest with cURL
                  copy and headers.
                </Text>
                <Text
                  style={{ fontSize: 12, color: '#334155', lineHeight: 18 }}
                >
                  •{' '}
                  <Text style={{ fontWeight: '700' }}>
                    Console & Stack Trace:
                  </Text>{' '}
                  Symbolicated source line and column coordinates directly from
                  Metro.
                </Text>
                <Text
                  style={{ fontSize: 12, color: '#334155', lineHeight: 18 }}
                >
                  •{' '}
                  <Text style={{ fontWeight: '700' }}>Redux Time-Travel:</Text>{' '}
                  Dispatched action timeline, slice diff viewer, and state
                  inspection.
                </Text>
                <Text
                  style={{ fontSize: 12, color: '#334155', lineHeight: 18 }}
                >
                  •{' '}
                  <Text style={{ fontWeight: '700' }}>
                    Firebase & GA4 Analytics:
                  </Text>{' '}
                  Automatic screen and ecommerce event category detection.
                </Text>
                <Text
                  style={{ fontSize: 12, color: '#334155', lineHeight: 18 }}
                >
                  •{' '}
                  <Text style={{ fontWeight: '700' }}>
                    Bundle & Performance Analyzer:
                  </Text>{' '}
                  Real-time FPS monitor and JS asset ratio treemaps.
                </Text>
              </View>
            </View>
          </>
        )}

        {/* ─── TAB 3: GITHUB & DOCS ─────────────────────────────────────────── */}
        {activeTab === 'github' && (
          <>
            <View style={styles.panelCard}>
              <View style={styles.panelHeaderRow}>
                <View
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
                >
                  <SvgGitHub color="#0F172A" size={15} />
                  <Text style={styles.panelHeader}>Open Source Repository</Text>
                </View>
                <Text
                  style={[
                    styles.panelHeaderBadge,
                    { backgroundColor: '#EEF2FF', color: '#4F46E5' },
                  ]}
                >
                  GITHUB
                </Text>
              </View>

              <View style={{ gap: 2 }}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Repository</Text>
                  <Text style={styles.infoValue}>
                    vengatmacuser/react-native-inapp-inspector
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Author / Creator</Text>
                  <Text style={styles.infoValue}>
                    Vengateswaran Balakrishnan
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Platform Support</Text>
                  <Text style={styles.infoValue}>
                    iOS, Android, Expo, RN 0.60+
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Documentation</Text>
                  <Text style={[styles.infoValue, { color: '#4F46E5' }]}>
                    Interactive Showcase
                  </Text>
                </View>
              </View>

              <View style={{ gap: 8, marginTop: 4 }}>
                <TactileButton
                  label="Star & View on GitHub"
                  onPress={() =>
                    openUrl(
                      'https://github.com/vengatmacuser/react-native-inapp-inspector',
                    )
                  }
                  color="#24292F"
                  bgColor="#24292F"
                  icon={<SvgExternalLink color="#FFFFFF" size={13} />}
                  fullWidth
                />
                <TactileButton
                  label="Report Issue / Request Feature"
                  onPress={() =>
                    openUrl(
                      'https://github.com/vengatmacuser/react-native-inapp-inspector/issues',
                    )
                  }
                  color="#0284C7"
                  bgColor="#0284C7"
                  icon={<SvgExternalLink color="#FFFFFF" size={13} />}
                  fullWidth
                />
                <TactileButton
                  label="Sponsor on GitHub ❤️"
                  onPress={() =>
                    openUrl('https://github.com/sponsors/vengatmacuser')
                  }
                  color="#DB2777"
                  bgColor="#DB2777"
                  icon={<SvgExternalLink color="#FFFFFF" size={13} />}
                  fullWidth
                />
              </View>
            </View>

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
          </>
        )}
      </ScrollView>

      {/* ─── STATIC FOOTER ACTION BAR: FAST BATCH SIMULATION ──────────────── */}
      <View style={styles.staticFooterContainer}>
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
          <Text style={styles.footerButtonText}>
            Trigger Fast Batch Sample Data
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
