import React, {useState, useEffect} from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {useInspector} from './InspectorContext';
import ErrorBoundary from '../ErrorBoundary';
import FabLauncher from './FabLauncher';
import InspectorHeader from './InspectorHeader';
import TabBar from './TabBar';
import NetworkTab from './NetworkTab';
import NetworkDetail from './NetworkDetail';
import LogDetail from './LogDetail';
import ConsoleTab from './ConsoleTab';
import AnalyticsTab from './AnalyticsTab';
import AnalyticsDetail from '../AnalyticsDetail';
import ReduxTab from './ReduxTab';
import ReduxDetail from './ReduxDetail';
import BundleTab from './BundleTab';
import PerformanceTab from './PerformanceTab';
import SettingsPanel from './SettingsPanel';
import styles from '../../styles';
import {AppColors} from '../../styles/AppColors';
import NavigationTracker from './NavigationTracker';

const MainScreen = () => {
  const {
    visible,
    modalAnimationType,
    closeModal,
    modalHeightPercent,
    selected,
    selectedEvent,
    selectedLog,
    selectedReduxSlice,
    selectedReduxAction,
    settingsPage,
    activeTab,
    isReady,
    isEnabled,
    hasNavigationContext,
    setNavState,
  } = useInspector();

  // Lazy-mount each tab on first visit and cache it in memory for 0ms instantaneous switching
  const [mountedTabs, setMountedTabs] = useState<Record<string, boolean>>({
    [activeTab]: true,
  });

  useEffect(() => {
    setMountedTabs(prev => {
      if (prev[activeTab]) return prev;
      return {...prev, [activeTab]: true};
    });
  }, [activeTab]);

  const isDetailActive =
    (activeTab === 'apis' && selected != null) ||
    (activeTab === 'analytics' && selectedEvent != null) ||
    (activeTab === 'logs' && selectedLog != null) ||
    (activeTab === 'redux' && (selectedReduxSlice != null || selectedReduxAction != null));

  return (
    <>
      {isEnabled && <FabLauncher />}
      <Modal visible={visible} animationType={modalAnimationType} transparent>
      {visible && (
        <ErrorBoundary onClose={closeModal}>
          <View style={styles.modalBackdrop}>
            <Pressable
              style={styles.modalBackdropPressable}
              onPress={closeModal}
            />
            <View
              style={[
                styles.modalContentCard,
                {height: `${modalHeightPercent}%`},
              ]}>
              <StatusBar
                translucent
                backgroundColor="transparent"
                barStyle="light-content"
              />

              <InspectorHeader />

              {/* ─── Horizontal Scrollable Tab Bar inside Content ─── */}
              {!isDetailActive && settingsPage === null ? (
                <TabBar />
              ) : null}

              {isReady ? (
                isDetailActive ? (
                  activeTab === 'apis' && selected != null ? (
                    <NetworkDetail />
                  ) : activeTab === 'analytics' && selectedEvent != null ? (
                    <AnalyticsDetail event={selectedEvent} />
                  ) : activeTab === 'logs' && selectedLog != null ? (
                    <LogDetail />
                  ) : activeTab === 'redux' ? (
                    <ReduxDetail />
                  ) : null
                ) : (
                  <>
                    <View
                      style={{
                        flex: 1,
                        display: activeTab === 'apis' ? 'flex' : 'none',
                      }}>
                      {mountedTabs.apis && <NetworkTab />}
                    </View>
                    <View
                      style={{
                        flex: 1,
                        display: activeTab === 'logs' ? 'flex' : 'none',
                      }}>
                      {mountedTabs.logs && <ConsoleTab />}
                    </View>
                    <View
                      style={{
                        flex: 1,
                        display: activeTab === 'analytics' ? 'flex' : 'none',
                      }}>
                      {mountedTabs.analytics && <AnalyticsTab />}
                    </View>
                    <View
                      style={{
                        flex: 1,
                        display: activeTab === 'redux' ? 'flex' : 'none',
                      }}>
                      {mountedTabs.redux && <ReduxTab />}
                    </View>
                    <View
                      style={{
                        flex: 1,
                        display: activeTab === 'bundle' ? 'flex' : 'none',
                      }}>
                      {mountedTabs.bundle && <BundleTab />}
                    </View>
                    <View
                      style={{
                        flex: 1,
                        display: activeTab === 'performance' ? 'flex' : 'none',
                      }}>
                      {mountedTabs.performance && <PerformanceTab />}
                    </View>
                  </>
                )
              ) : (
                <View style={styles.empty}>
                  <ActivityIndicator size="large" color={AppColors.purple} />
                  <Text style={[styles.emptySub, {marginTop: 12}]}>
                    Loading logs...
                  </Text>
                </View>
              )}

              {settingsPage !== null && (
                <View
                  style={[
                    StyleSheet.absoluteFill,
                    {
                      backgroundColor: AppColors.grayBackground,
                      zIndex: 99999,
                    },
                  ]}>
                  <SettingsPanel />
                </View>
              )}
            </View>
          </View>
        </ErrorBoundary>
      )}
      {hasNavigationContext && (
        <NavigationTracker onStateChange={setNavState} />
      )}
    </Modal>
    </>
  );
};

export default MainScreen;