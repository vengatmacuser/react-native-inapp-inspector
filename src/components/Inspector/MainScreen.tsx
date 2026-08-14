import React from 'react';
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
import ReduxTab from './ReduxTab';
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
    settingsPage,
    activeTab,
    isReady,
    isEnabled,
    hasNavigationContext,
    setNavState,
  } = useInspector();

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
              {selected == null &&
              selectedEvent == null &&
              selectedLog == null &&
              settingsPage === null ? (
                <TabBar />
              ) : null}

              {isReady ? (
                activeTab === 'analytics' ? (
                  <AnalyticsTab />
                ) : activeTab === 'apis' && selected == null ? (
                  <NetworkTab />
                ) : activeTab === 'logs' && selectedLog == null ? (
                  <ConsoleTab />
                ) : activeTab === 'logs' ? (
                  <LogDetail />
                ) : activeTab === 'redux' ? (
                  <ReduxTab />
                ) : (
                  <NetworkDetail />
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