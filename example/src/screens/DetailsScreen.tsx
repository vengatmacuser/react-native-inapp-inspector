import React, { useEffect } from 'react';
import {
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { styles } from '../styles/appStyles';

export function DetailsScreen({ navigation }: any) {
  const triggerDetailLogs = () => {
    console.log('[Details] User triggered log from Details screen.');
  };

  useEffect(() => {
    console.log('[Test] DetailsScreen mounted!');
  }, []);

  return (
    <SafeAreaView style={styles.safeContainer}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerHero}>
          <View style={styles.headerBadgeContainer}>
            <Text style={styles.headerBadge}>DETAILS MODULE</Text>
          </View>
          <Text style={styles.headerTitle}>Navigation Tracking</Text>
          <Text style={styles.headerSubtitle}>
            The breadcrumbs inside the inspector track your screen transitions and route state in real-time.
          </Text>
        </View>

        <View style={styles.panelCard}>
          <View style={styles.panelHeaderRow}>
            <Text style={styles.panelHeader}>Module Actions</Text>
            <Text style={styles.panelHeaderBadge}>ROUTE ACTIVE</Text>
          </View>
          <TouchableOpacity
            style={[
              styles.fullWidthBtn,
              { backgroundColor: '#059669', marginBottom: 10 },
            ]}
            onPress={triggerDetailLogs}
          >
            <Text style={styles.fullWidthBtnText}>
              Trigger Log from Details Screen
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.fullWidthBtn, { backgroundColor: '#475569' }]}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.fullWidthBtnText}>← Go Back Home</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
