import React, {useEffect, useRef} from 'react';
import {
  Animated,
  Modal,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import {useInspector} from './InspectorContext';
import ErrorBoundary from '../ErrorBoundary';
import ModuleErrorBoundary from '../ModuleErrorBoundary';
import FabLauncher from './FabLauncher';
import InspectorHeader from './InspectorHeader';
import {SecondaryTelemetryStrip} from './SecondaryTelemetryStrip';
import TabBar from './TabBar';
import NetworkTab from './NetworkTab';
import NetworkDetail from './NetworkDetail';
import LogDetail from './LogDetail';
import ConsoleTab from './ConsoleTab';
import {PerformanceTab} from './PerformanceTab';
import AnalyticsTab from './AnalyticsTab';
import AnalyticsDetail from '../AnalyticsDetail';
import ReduxTab from './ReduxTab';
import ReduxDetail from './ReduxDetail';
import CrashTab from './CrashTab';
import CrashDetail from './CrashDetail';
import PushTab from './PushTab';
import PushDetail from './PushDetail';
import SocketTab from './SocketTab';
import SocketDetail from './SocketDetail';
import DeviceInfoTab from './DeviceInfoTab';
import StorageTab from './StorageTab';
import {MediaGalleryTab} from './MediaGalleryTab';
import SettingsPanel from './SettingsPanel';
import AboutModal from './AboutModal';
import {SupportPage} from './SupportPage';
import {ConfirmationModal} from './ConfirmationModal';
import {FloatingCaptureWidget} from './FloatingCaptureWidget';
import SkeletonPlaceholder from './SkeletonPlaceholder';

import NpmUpdateToast from './NpmUpdateToast';
import NpmStarPrompt from './NpmStarPrompt';
import Toast from '../Toast';
import styles from '../../styles';
import {AppColors} from '../../styles/AppColors';
import NavigationTracker from './NavigationTracker';
import {isLocalDebugEnvironment} from '../../helpers';

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
    selectedPush,
    setSelectedPush,
    selectedSocket,
    setSelectedSocket,
    settingsPage,
    isAboutOpen,
    setIsAboutOpen,
    isSupportOpen,
    setIsSupportOpen,
    activeTab,
    isReady,
    enabled,
    isDismissed,
    hasNavigationContext,
    setNavState,
    confirmModal,
    setConfirmModal,
    peekMode,
    peekOpacity,
  } = useInspector();

  const isDetailActive =
    (activeTab === 'apis' && selected != null) ||
    (activeTab === 'analytics' && selectedEvent != null) ||
    (activeTab === 'logs' && selectedLog != null) ||
    (activeTab === 'redux' && (selectedReduxSlice != null || selectedReduxAction != null)) ||
    (activeTab === 'crash' && selectedCrash != null) ||
    (activeTab === 'push' && selectedPush != null) ||
    (activeTab === 'socket' && selectedSocket != null);

  // ─── 60 FPS Transition Animations ──────────────────────────────────────────

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

  const aboutAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (isAboutOpen) {
      aboutAnim.setValue(0);
      Animated.spring(aboutAnim, {
        toValue: 1,
        friction: 8,
        tension: 65,
        useNativeDriver: true,
      }).start();
    }
  }, [isAboutOpen]);

  const supportAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (isSupportOpen) {
      supportAnim.setValue(0);
      Animated.spring(supportAnim, {
        toValue: 1,
        friction: 8,
        tension: 65,
        useNativeDriver: true,
      }).start();
    }
  }, [isSupportOpen]);

  return (
    <>
      {(Platform.OS === 'ios' || Platform.OS === 'android') &&
        enabled &&
        !isDismissed &&
        !visible && <FabLauncher />}
      <Modal
        visible={visible}
        animationType={modalAnimationType}
        transparent
        statusBarTranslucent={true}
        onRequestClose={closeModal}>
        <ErrorBoundary onClose={closeModal}>
          <View
            style={[
              styles.modalBackdrop,
              {
                zIndex: 999999,
                elevation: 999999,
              },
            ]}>
            <Pressable
              style={styles.modalBackdropPressable}
              onPress={closeModal}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Dismiss Inspector"
              accessibilityHint="Double tap to dismiss the inspector modal"
            />
            <View
              accessible={false}
              accessibilityViewIsModal={true}
              style={[
                styles.modalContentCard,
                {
                  height: `${modalHeightPercent}%`,
                  borderTopLeftRadius: modalHeightPercent >= 100 ? 0 : 20,
                  borderTopRightRadius: modalHeightPercent >= 100 ? 0 : 20,
                  opacity: peekMode
                    ? Math.max(0.05, Math.min(1.0, typeof peekOpacity === 'number' ? peekOpacity : 0.3))
                    : 1,
                  zIndex: 9999999,
                  elevation: 999999,
                },
              ]}>
              <StatusBar
                translucent
                backgroundColor="transparent"
                barStyle="light-content"
              />

              <InspectorHeader />
              {!isDetailActive && settingsPage === null && !isAboutOpen && !isSupportOpen && (
                <SecondaryTelemetryStrip />
              )}

              <View
                style={{
                  flex: 1,
                  overflow: 'hidden',
                  backgroundColor: AppColors.grayBackground,
                }}>
                {/* ─── Persistent Content Layer (TabBar + List, never unmounted or hidden with display:none) ─── */}
                <View
                  style={{flex: 1}}
                  pointerEvents={
                    isDetailActive ||
                    settingsPage !== null ||
                    isAboutOpen ||
                    isSupportOpen
                      ? 'none'
                      : 'auto'
                  }>
                  <TabBar />
                  {isReady ? (
                    <View style={{flex: 1}}>
                      {activeTab === 'apis' && (
                        <ModuleErrorBoundary moduleName="Network API Monitor">
                          <NetworkTab />
                        </ModuleErrorBoundary>
                      )}
                      {activeTab === 'logs' && (
                        <ModuleErrorBoundary moduleName="Console Logs Monitor">
                          <ConsoleTab />
                        </ModuleErrorBoundary>
                      )}
                      {activeTab === 'perf' && (
                        <ModuleErrorBoundary moduleName="Performance & FPS Profiler">
                          <PerformanceTab />
                        </ModuleErrorBoundary>
                      )}
                      {activeTab === 'analytics' && (
                        <ModuleErrorBoundary moduleName="Analytics Event Tracker">
                          <AnalyticsTab />
                        </ModuleErrorBoundary>
                      )}
                      {activeTab === 'redux' && (
                        <ModuleErrorBoundary moduleName="Redux State Inspector">
                          <ReduxTab />
                        </ModuleErrorBoundary>
                      )}
                      {activeTab === 'crash' && (
                        <ModuleErrorBoundary moduleName="Crash Reporter">
                          <CrashTab />
                        </ModuleErrorBoundary>
                      )}
                      {activeTab === 'push' && (
                        <ModuleErrorBoundary moduleName="Push Notifications">
                          <PushTab />
                        </ModuleErrorBoundary>
                      )}
                      {activeTab === 'socket' && (
                        <ModuleErrorBoundary moduleName="WebSocket & Socket.IO">
                          <SocketTab />
                        </ModuleErrorBoundary>
                      )}
                      {activeTab === 'device' && (
                        <ModuleErrorBoundary moduleName="Device Diagnostics">
                          <DeviceInfoTab />
                        </ModuleErrorBoundary>
                      )}
                      {activeTab === 'storage' && (
                        <ModuleErrorBoundary moduleName="Storage Inspector">
                          <StorageTab />
                        </ModuleErrorBoundary>
                      )}
                      {activeTab === 'media' && (
                        <ModuleErrorBoundary moduleName="Media Gallery">
                          <MediaGalleryTab />
                        </ModuleErrorBoundary>
                      )}
                    </View>
                  ) : (
                    <SkeletonPlaceholder tab={activeTab} />
                  )}
                </View>

                {/* ─── Detail View Layer (Solid overlay covering TabBar + Content with zero layout flicker) ─── */}
                {isDetailActive && (
                  <View
                    style={[
                      StyleSheet.absoluteFill,
                      {
                        backgroundColor: AppColors.contentBg,
                        zIndex: 10,
                      },
                    ]}>
                    {activeTab === 'apis' && selected != null && (
                      <ModuleErrorBoundary moduleName="Network Request Details">
                        <NetworkDetail />
                      </ModuleErrorBoundary>
                    )}
                    {activeTab === 'analytics' && selectedEvent != null && (
                      <ModuleErrorBoundary moduleName="Analytics Event Details">
                        <AnalyticsDetail event={selectedEvent} />
                      </ModuleErrorBoundary>
                    )}
                    {activeTab === 'logs' && selectedLog != null && (
                      <ModuleErrorBoundary moduleName="Console Log Details">
                        <LogDetail />
                      </ModuleErrorBoundary>
                    )}
                    {activeTab === 'redux' && (
                      <ModuleErrorBoundary moduleName="Redux Action & State Details">
                        <ReduxDetail />
                      </ModuleErrorBoundary>
                    )}
                    {activeTab === 'crash' && selectedCrash != null && (
                      <ModuleErrorBoundary moduleName="Crash Log Details">
                        <CrashDetail />
                      </ModuleErrorBoundary>
                    )}
                    {activeTab === 'push' && selectedPush != null && (
                      <ModuleErrorBoundary moduleName="Push Notification Details">
                        <PushDetail
                          item={selectedPush}
                          onClose={() => setSelectedPush(null)}
                        />
                      </ModuleErrorBoundary>
                    )}
                    {activeTab === 'socket' && selectedSocket != null && (
                      <ModuleErrorBoundary moduleName="WebSocket & Socket.IO Details">
                        <SocketDetail
                          item={selectedSocket}
                          onClose={() => setSelectedSocket(null)}
                        />
                      </ModuleErrorBoundary>
                    )}
                  </View>
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
                    <ModuleErrorBoundary moduleName="Settings Panel">
                      <SettingsPanel />
                    </ModuleErrorBoundary>
                  </Animated.View>
                )}

                {/* About & Specs Layer - Rendered inside in-app inspector covering full content card */}
                {isAboutOpen && (
                  <Animated.View
                    style={[
                      StyleSheet.absoluteFill,
                      {
                        backgroundColor: AppColors.primaryLight,
                        opacity: aboutAnim,
                        transform: [
                          {
                            translateY: aboutAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [24, 0],
                            }),
                          },
                        ],
                      },
                    ]}>
                    <ModuleErrorBoundary moduleName="About & Diagnostics">
                      <AboutModal onClose={() => setIsAboutOpen(false)} />
                    </ModuleErrorBoundary>
                  </Animated.View>
                )}

                {/* Support & Community Layer - Rendered inside in-app inspector covering full content card */}
                {isSupportOpen && (
                  <Animated.View
                    style={[
                      StyleSheet.absoluteFill,
                      {
                        backgroundColor: AppColors.primaryLight,
                        opacity: supportAnim,
                        transform: [
                          {
                            translateY: supportAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [24, 0],
                            }),
                          },
                        ],
                      },
                    ]}>
                    <ModuleErrorBoundary moduleName="Support & Community">
                      <SupportPage onClose={() => setIsSupportOpen(false)} />
                    </ModuleErrorBoundary>
                  </Animated.View>
                )}
              </View>

              {/* Bottom floating toast notification */}
              <Toast />

              {/* NPM Version Update Toast with timeout progress bar */}
              <NpmUpdateToast />

              {/* 5-Day Periodic Star & Support Prompt */}
              <NpmStarPrompt />

              {/* Floating Video/Screenshot Quick Capture Widget */}
              <FloatingCaptureWidget />

              {/* Global Confirmation Dialog */}
              <ConfirmationModal
                visible={confirmModal.visible}
                title={confirmModal.title}
                message={confirmModal.message}
                confirmText={confirmModal.confirmText}
                cancelText={confirmModal.cancelText}
                isDestructive={true}
                icon="trash"
                onConfirm={confirmModal.onConfirm}
                onCancel={() =>
                  setConfirmModal(prev => ({...prev, visible: false}))
                }
              />
            </View>
          </View>
        </ErrorBoundary>
      {hasNavigationContext && (
        <NavigationTracker onStateChange={setNavState} />
      )}
    </Modal>
    </>
  );
};

export default MainScreen;