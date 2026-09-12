import React, { useEffect } from 'react';
import { Text, TouchableOpacity, View, ScrollView, Platform, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { styles } from '../styles/appStyles';

const SvgTerminal = ({ color = '#FFFFFF', size = 14 }: { color?: string; size?: number }) => (
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

const SvgArrowLeft = ({ color = '#FFFFFF', size = 14 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M19 12H5M12 19l-7-7 7-7"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export function DetailsScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const topPadding = Math.max(insets.top, Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 12 : 12);

  const triggerDetailLogs = () => {
    console.log('[Details] User triggered log from Details screen.');
  };

  useEffect(() => {
    console.log('[Test] DetailsScreen mounted!');
  }, []);

  return (
    <View style={[styles.safeContainer, { paddingTop: topPadding }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerCard}>
          <View style={styles.headerBrandRow}>
            <View style={styles.headerBrandLeft}>
              <View style={styles.headerBrandTextCol}>
                <Text style={styles.headerTitle}>Navigation Tracking</Text>
                <Text style={styles.headerSubtitle}>
                  Route State & Screen Transitions
                </Text>
              </View>
            </View>
            <View style={styles.headerLiveBadge}>
              <View style={styles.headerLiveDot} />
              <Text style={styles.headerLiveText}>ROUTE ACTIVE</Text>
            </View>
          </View>
          <Text style={styles.headerFeatureDesc}>
            The breadcrumbs inside the inspector track your screen transitions and route state in real-time.
          </Text>
        </View>

        <View style={styles.panelCard}>
          <View style={styles.panelHeaderRow}>
            <Text style={styles.panelHeader}>Module Actions</Text>
            <Text style={styles.panelHeaderBadge}>ROUTE ACTIVE</Text>
          </View>
          <TouchableOpacity
            style={styles.detailsLogBtn}
            onPress={triggerDetailLogs}
          >
            <SvgTerminal color="#FFFFFF" size={14} />
            <Text style={styles.fullWidthBtnText}>Trigger Log from Details Screen</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.detailsBackBtn}
            onPress={() => navigation.goBack()}
          >
            <SvgArrowLeft color="#FFFFFF" size={14} />
            <Text style={styles.fullWidthBtnText}>Go Back Home</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
