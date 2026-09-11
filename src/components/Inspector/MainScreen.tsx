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
import TabBar from './TabBar';
import NetworkTab from './NetworkTab';
import NetworkDetail from './NetworkDetail';
import LogDetail from './LogDetail';
import ConsoleTab from './ConsoleTab';
import AnalyticsTab from './AnalyticsTab';
import AnalyticsDetail from '../AnalyticsDetail';
import ReduxTab from './ReduxTab';
import ReduxDetail from './ReduxDetail';
import CrashTab from './CrashTab';
import CrashDetail from './CrashDetail';
import PushTab from './PushTab';
import PushDetail from './PushDetail';
import DeviceInfoTab from './DeviceInfoTab';
import StorageTab from './StorageTab';
import DebuggingTab from './DebuggingTab';
import {MediaGalleryTab} from './MediaGalleryTab';
import SettingsPanel from './SettingsPanel';
import AboutModal from './AboutModal';

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
    settingsPage,
    isAboutOpen,
    setIsAboutOpen,
    activeTab,
    isReady,
    enabled,
    hasNavigationContext,
    setNavState,
  } = useInspector();

  const isDetailActive =
    (activeTab === 'apis' && selected != null) ||
    (activeTab === 'analytics' && selectedEvent != null) ||
    (activeTab === 'logs' && selectedLog != null) ||
    (activeTab === 'redux' && (selectedReduxSlice != null || selectedReduxAction != null)) ||
    (activeTab === 'crash' && selectedCrash != null) ||
    (activeTab === 'push' && selectedPush != null);

  // ─── 60 FPS Transition Animations ──────────────────────────────────────────

  const settingsAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (settingsPage !== null) {
      settingsAnim.setValue(0);
      Animated.spring(settingsAnim, {
        toValue: 1,
        friction: 8,
        tension: 65,
        useNativeDriver: false,
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
        useNativeDriver: false,
      }).start();
    }
  }, [isAboutOpen]);

  return (
    <>
      {(Platform.OS === 'ios' || Platform.OS === 'android') &&
        enabled &&
        !visible && <FabLauncher />}
      <Modal
        visible={visible}
        animationType={modalAnimationType}
        transparent
        statusBarTranslucent={true}
        onRequestClose={closeModal}>
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
                {/* ─── Persistent Content Layer (TabBar + List, never unmounted or hidden with display:none) ─── */}
                <View
                  style={{flex: 1}}
                  pointerEvents={
                    isDetailActive ||
                    settingsPage !== null ||
                    isAboutOpen
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
                      {Platform.OS === 'android' &&
                        isLocalDebugEnvironment() &&
                        activeTab === 'debugging' && (
                          <ModuleErrorBoundary moduleName="Debugging Utilities">
                            <DebuggingTab />
                          </ModuleErrorBoundary>
                        )}
                    </View>
                  ) : (
                    <MainScreenSkeleton />
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
              </View>

              {/* Bottom floating toast notification */}
              <Toast />

              {/* NPM Version Update Toast with timeout progress bar */}
              <NpmUpdateToast />

              {/* 5-Day Periodic Star & Support Prompt */}
              <NpmStarPrompt />
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

const MainScreenSkeleton = React.memo(function MainScreenSkeleton() {
  const shimmerAnim = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 0.85,
          duration: 750,
          useNativeDriver: false,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0.35,
          duration: 750,
          useNativeDriver: false,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [shimmerAnim]);

  return (
    <View style={skeletonStyles.container}>
      {/* ─── Search & Scope Toolbar Skeleton ─── */}
      <View style={skeletonStyles.toolbarSkeleton}>
        <Animated.View
          style={[skeletonStyles.searchBarSkeleton, {opacity: shimmerAnim}]}
        />
        <View style={skeletonStyles.actionButtonsRow}>
          <Animated.View
            style={[skeletonStyles.iconButtonSkeleton, {opacity: shimmerAnim}]}
          />
          <Animated.View
            style={[skeletonStyles.iconButtonSkeleton, {opacity: shimmerAnim}]}
          />
        </View>
      </View>

      {/* ─── Quick Filter Chips Skeleton Strip ─── */}
      <View style={skeletonStyles.chipStripSkeleton}>
        <Animated.View
          style={[skeletonStyles.chipSkeleton, {width: 48, opacity: shimmerAnim}]}
        />
        <Animated.View
          style={[skeletonStyles.chipSkeleton, {width: 68, opacity: shimmerAnim}]}
        />
        <Animated.View
          style={[skeletonStyles.chipSkeleton, {width: 76, opacity: shimmerAnim}]}
        />
        <Animated.View
          style={[skeletonStyles.chipSkeleton, {width: 58, opacity: shimmerAnim}]}
        />
      </View>

      {/* ─── List Cards Skeleton ─── */}
      {[0, 1, 2, 3].map(i => (
        <Animated.View
          key={`skeleton_card_${i}`}
          style={[skeletonStyles.cardSkeleton, {opacity: shimmerAnim}]}>
          <View style={skeletonStyles.cardTopRow}>
            <View style={skeletonStyles.badgeGroup}>
              <View style={skeletonStyles.statusBadgeSkeleton} />
              <View style={skeletonStyles.methodBadgeSkeleton} />
            </View>
            <View style={skeletonStyles.timeSkeleton} />
          </View>
          <View style={skeletonStyles.urlLineLong} />
          <View style={skeletonStyles.urlLineShort} />
          <View style={skeletonStyles.cardBottomRow}>
            <View style={skeletonStyles.metaPillSkeleton} />
            <View style={skeletonStyles.metaPillSkeleton} />
          </View>
        </Animated.View>
      ))}
    </View>
  );
});

const skeletonStyles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  toolbarSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  searchBarSkeleton: {
    flex: 1,
    height: 36,
    borderRadius: 8,
    backgroundColor: AppColors.graySurface,
    borderWidth: 1,
    borderColor: AppColors.dividerColor,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  iconButtonSkeleton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: AppColors.graySurface,
    borderWidth: 1,
    borderColor: AppColors.dividerColor,
  },
  chipStripSkeleton: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
  },
  chipSkeleton: {
    height: 24,
    borderRadius: 6,
    backgroundColor: AppColors.graySurface,
    borderWidth: 1,
    borderColor: AppColors.dividerColor,
  },
  cardSkeleton: {
    backgroundColor: AppColors.primaryLight,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: AppColors.dividerColor,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  badgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusBadgeSkeleton: {
    width: 38,
    height: 18,
    borderRadius: 4,
    backgroundColor: AppColors.graySurface,
  },
  methodBadgeSkeleton: {
    width: 44,
    height: 18,
    borderRadius: 4,
    backgroundColor: AppColors.graySurface,
  },
  timeSkeleton: {
    width: 48,
    height: 12,
    borderRadius: 4,
    backgroundColor: AppColors.graySurface,
  },
  urlLineLong: {
    height: 13,
    borderRadius: 4,
    backgroundColor: AppColors.graySurface,
    marginBottom: 5,
    width: '90%',
  },
  urlLineShort: {
    height: 11,
    borderRadius: 4,
    backgroundColor: AppColors.graySurface,
    marginBottom: 8,
    width: '55%',
  },
  cardBottomRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
  },
  metaPillSkeleton: {
    width: 52,
    height: 14,
    borderRadius: 4,
    backgroundColor: AppColors.graySurface,
  },
});

export default MainScreen;