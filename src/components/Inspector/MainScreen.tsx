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
  TouchableOpacity,
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
import DeviceInfoTab from './DeviceInfoTab';
import StorageTab from './StorageTab';
import DebuggingTab from './DebuggingTab';
import {MediaGalleryTab} from './MediaGalleryTab';
import SettingsPanel from './SettingsPanel';

import NpmUpdateToast from './NpmUpdateToast';
import NpmStarPrompt from './NpmStarPrompt';
import FeedbackModal from './FeedbackModal';
import Toast from '../Toast';
import TouchableScale from '../TouchableScale';
import {HeadphonesIcon} from '../NetworkIcons';
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
    settingsPage,
    isFeedbackOpen,
    setIsFeedbackOpen,
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

  const feedbackAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (isFeedbackOpen) {
      feedbackAnim.setValue(0);
      Animated.spring(feedbackAnim, {
        toValue: 1,
        friction: 8,
        tension: 65,
        useNativeDriver: false,
      }).start();
    }
  }, [isFeedbackOpen]);

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
                    isDetailActive || settingsPage !== null || isFeedbackOpen
                      ? 'none'
                      : 'auto'
                  }>
                  <TabBar />
                  {isReady ? (
                    <View style={{flex: 1}}>
                      {activeTab === 'apis' && <NetworkTab />}
                      {activeTab === 'logs' && <ConsoleTab />}
                      {activeTab === 'analytics' && <AnalyticsTab />}
                      {activeTab === 'redux' && <ReduxTab />}
                      {activeTab === 'bundle' && <BundleTab />}
                      {activeTab === 'performance' && <PerformanceTab />}
                      {activeTab === 'crash' && <CrashTab />}
                      {activeTab === 'device' && <DeviceInfoTab />}
                      {activeTab === 'storage' && <StorageTab />}
                      {Platform.OS === 'android' &&
                        isLocalDebugEnvironment() &&
                        activeTab === 'debugging' && <DebuggingTab />}
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
                    <SettingsPanel />
                  </Animated.View>
                )}

                {/* Support & Feedback Layer - Rendered inside in-app inspector covering full content card */}
                {isFeedbackOpen && (
                  <Animated.View
                    style={[
                      StyleSheet.absoluteFill,
                      {
                        backgroundColor: AppColors.primaryLight,
                        opacity: feedbackAnim,
                        transform: [
                          {
                            translateY: feedbackAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [24, 0],
                            }),
                          },
                        ],
                      },
                    ]}>
                    <FeedbackModal onClose={() => setIsFeedbackOpen(false)} />
                  </Animated.View>
                )}

                {/* Floating Support & Feedback Button (in place of scroll-to-top) */}
                {!isDetailActive && settingsPage === null && !isFeedbackOpen && (
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => setIsFeedbackOpen(true)}
                    hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
                    style={styles.supportFab}>
                    <HeadphonesIcon color={AppColors.white} size={20} />
                  </TouchableOpacity>
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