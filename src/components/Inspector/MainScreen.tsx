import React, {useState, useEffect} from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
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
import CrashTab from './CrashTab';
import CrashDetail from './CrashDetail';
import SettingsPanel from './SettingsPanel';
import Toast from '../Toast';
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
    selectedCrash,
    settingsPage,
    activeTab,
    isReady,
    isEnabled,
    useNativeFab,
    hasNavigationContext,
    setNavState,
  } = useInspector();

  const isDetailActive =
    (activeTab === 'apis' && selected != null) ||
    (activeTab === 'analytics' && selectedEvent != null) ||
    (activeTab === 'logs' && selectedLog != null) ||
    (activeTab === 'redux' && (selectedReduxSlice != null || selectedReduxAction != null)) ||
    (activeTab === 'crash' && selectedCrash != null);

  return (
    <>
      {(Platform.OS === 'ios' || Platform.OS === 'android') &&
        isEnabled &&
        !useNativeFab && <FabLauncher />}
      <Modal
        visible={visible}
        animationType={modalAnimationType}
        transparent
        statusBarTranslucent={true}>
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
                {
                  height: `${modalHeightPercent}%`,
                  borderTopLeftRadius: modalHeightPercent >= 100 ? 0 : 20,
                  borderTopRightRadius: modalHeightPercent >= 100 ? 0 : 20,
                },
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

              {settingsPage !== null ? (
                <SettingsPanel />
              ) : isReady ? (
                isDetailActive ? (
                  activeTab === 'apis' && selected != null ? (
                    <NetworkDetail />
                  ) : activeTab === 'analytics' && selectedEvent != null ? (
                    <AnalyticsDetail event={selectedEvent} />
                  ) : activeTab === 'logs' && selectedLog != null ? (
                    <LogDetail />
                  ) : activeTab === 'redux' ? (
                    <ReduxDetail />
                  ) : activeTab === 'crash' && selectedCrash != null ? (
                    <CrashDetail />
                  ) : null
                ) : (
                  <View style={{flex: 1}}>
                    {activeTab === 'apis' && <NetworkTab />}
                    {activeTab === 'logs' && <ConsoleTab />}
                    {activeTab === 'analytics' && <AnalyticsTab />}
                    {activeTab === 'redux' && <ReduxTab />}
                    {activeTab === 'bundle' && <BundleTab />}
                    {activeTab === 'performance' && <PerformanceTab />}
                    {activeTab === 'crash' && <CrashTab />}
                  </View>
                )
              ) : (
                <View style={styles.empty}>
                  <ActivityIndicator size="large" color={AppColors.purple} />
                  <Text style={[styles.emptySub, {marginTop: 12}]}>
                    Loading logs...
                  </Text>
                </View>
              )}

              {/* Bottom floating toast notification */}
              <Toast />
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