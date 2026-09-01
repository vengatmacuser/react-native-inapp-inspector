import React, {useState, useEffect, useRef} from 'react';
import {
  ActivityIndicator,
  Animated,
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
import SkeletonPlaceholder from './SkeletonPlaceholder';
import ReduxTab from './ReduxTab';
import ReduxDetail from './ReduxDetail';
import BundleTab from './BundleTab';
import PerformanceTab from './PerformanceTab';
import CrashTab from './CrashTab';
import CrashDetail from './CrashDetail';
import DeviceInfoTab from './DeviceInfoTab';
import StorageTab from './StorageTab';
import SettingsPanel from './SettingsPanel';
import NpmUpdateToast from './NpmUpdateToast';
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
    enabled,
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

  // ─── 60 FPS Transition Animations ──────────────────────────────────────────
  const detailAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (isDetailActive) {
      detailAnim.setValue(0);
      Animated.spring(detailAnim, {
        toValue: 1,
        friction: 8,
        tension: 65,
        useNativeDriver: true,
      }).start();
    }
  }, [isDetailActive]);

  const settingsAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (settingsPage !== null) {
      settingsAnim.setValue(0);
      Animated.spring(settingsAnim, {
        toValue: 1,
        friction: 8,
        tension: 65,
        useNativeDriver: true,
      }).start();
    }
  }, [settingsPage !== null]);

  const tabAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    tabAnim.setValue(0);
    Animated.timing(tabAnim, {
      toValue: 1,
      duration: 150,
      useNativeDriver: true,
    }).start();
  }, [activeTab]);

  return (
    <>
      {(Platform.OS === 'ios' || Platform.OS === 'android') &&
        enabled &&
        !visible &&
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

              <View style={{flex: 1}}>
                {/* ─── Horizontal Scrollable Tab Bar inside Content (Always visible) ─── */}
                {!isDetailActive && <TabBar />}

                {isReady ? (
                  <View style={{flex: 1}}>
                    {/* Persistent List Layer - Never unmounted, preserves 100% native scroll with smooth tab transition */}
                    <Animated.View
                      style={[
                        {
                          flex: 1,
                          opacity: tabAnim,
                          transform: [
                            {
                              translateY: tabAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [6, 0],
                              }),
                            },
                          ],
                        },
                        (isDetailActive || settingsPage !== null) && {
                          pointerEvents: 'none',
                        },
                      ]}>
                      {activeTab === 'apis' && <NetworkTab />}
                      {activeTab === 'logs' && <ConsoleTab />}
                      {activeTab === 'analytics' && <AnalyticsTab />}
                      {activeTab === 'redux' && <ReduxTab />}
                      {activeTab === 'bundle' && <BundleTab />}
                      {activeTab === 'performance' && <PerformanceTab />}
                      {activeTab === 'crash' && <CrashTab />}
                      {activeTab === 'device' && <DeviceInfoTab />}
                      {activeTab === 'storage' && <StorageTab />}
                    </Animated.View>

                    {/* Detail View Layer - Rendered on top with smooth slide & spring transition */}
                    {isDetailActive && (
                      <Animated.View
                        style={[
                          StyleSheet.absoluteFill,
                          {
                            backgroundColor: AppColors.contentBg,
                            opacity: detailAnim,
                            transform: [
                              {
                                translateX: detailAnim.interpolate({
                                  inputRange: [0, 1],
                                  outputRange: [32, 0],
                                }),
                              },
                            ],
                          },
                        ]}>
                        {activeTab === 'apis' && selected != null && (
                          <NetworkDetail />
                        )}
                        {activeTab === 'analytics' && selectedEvent != null && (
                          <AnalyticsDetail event={selectedEvent} />
                        )}
                        {activeTab === 'logs' && selectedLog != null && (
                          <LogDetail />
                        )}
                        {activeTab === 'redux' && <ReduxDetail />}
                        {activeTab === 'crash' && selectedCrash != null && (
                          <CrashDetail />
                        )}
                      </Animated.View>
                    )}
                  </View>
                ) : (
                  <SkeletonPlaceholder />
                )}

                {/* Settings Panel Layer - Rendered on top with smooth slide & spring transition */}
                {settingsPage !== null && (
                  <Animated.View
                    style={[
                      StyleSheet.absoluteFill,
                      {
                        backgroundColor: AppColors.grayBackground,
                        opacity: settingsAnim,
                        transform: [
                          {
                            translateY: settingsAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [24, 0],
                            }),
                          },
                        ],
                      },
                    ]}>
                    <SettingsPanel />
                  </Animated.View>
                )}
              </View>

              {/* Bottom floating toast notification */}
              <Toast />

              {/* NPM Version Update Toast with timeout progress bar */}
              <NpmUpdateToast />
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