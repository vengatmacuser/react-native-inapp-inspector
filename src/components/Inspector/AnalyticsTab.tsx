import React, {useCallback} from 'react';
import {
  FlatList,
  Pressable,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {animateNextLayout, useInspector} from './InspectorContext';
import AnalyticsEventCard from '../AnalyticsEventCard';
import AnalyticsDetail from '../AnalyticsDetail';
import EndOfListFooter from '../EndOfListFooter';
import styles from '../../styles';
import {AppColors} from '../../styles/AppColors';
import {
  getCurrentUserId,
  getCurrentUserProperties,
  getDefaultEventParameters,
  getCollectionEnabled,
} from '../../customHooks/analyticsLogger';
import {
  SearchIcon,
  ClearIcon,
  TrashIcon,
  EmptyRadarIcon,
  HeaderPauseIcon,
} from '../NetworkIcons';

const AnalyticsHeader = () => {
  const {
    filteredAnalyticsEvents,
    analyticsHeaderExpanded,
    setAnalyticsHeaderExpanded,
  } = useInspector();

  const keyExtractor = useCallback(
    (item: any, index: number) => item?.id?.toString() ?? index.toString(),
    [],
  );


  const userId = getCurrentUserId();
  const userProperties = getCurrentUserProperties();
  const defaultParams = getDefaultEventParameters();
  const isTrackingEnabled = getCollectionEnabled();

  const hasUserProps = Object.keys(userProperties).length > 0;
  const hasDefaultParams = Object.keys(defaultParams).length > 0;
  const totalEvents = filteredAnalyticsEvents.length;

  return (
    <View style={styles.analyticsHeaderCard}>
      <View style={[styles.analyticsHeaderTop, !analyticsHeaderExpanded && {marginBottom: 0}]}>
        <View style={{flex: 1}}>
          <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
            <Text style={styles.analyticsHeaderTitle}>Session Info</Text>
            <View style={[
              styles.statusDot, 
              {backgroundColor: isTrackingEnabled ? AppColors.greenColor : AppColors.errorColor}
            ]} />
            <Text style={styles.statusText}>
              {isTrackingEnabled ? 'Active' : 'Paused'}
            </Text>
          </View>
          <Text style={styles.analyticsHeaderSubtitle} numberOfLines={1}>
            {userId ? `User ID: ${userId}` : 'Anonymous Session'}
          </Text>
        </View>
        
        <TouchableOpacity
          style={styles.analyticsHeaderToggle}
          activeOpacity={0.7}
          onPress={() => {
            animateNextLayout();
            setAnalyticsHeaderExpanded(!analyticsHeaderExpanded);
          }}>
          <Text style={styles.analyticsHeaderToggleText}>
            {analyticsHeaderExpanded ? 'Collapse' : 'Expand'}
          </Text>
        </TouchableOpacity>
      </View>

      {analyticsHeaderExpanded && (
        <>
          {/* Stats Row */}
          <View style={styles.analyticsStatsRow}>
            <View style={styles.analyticsStatBox}>
              <Text style={styles.analyticsStatValue}>{totalEvents}</Text>
              <Text style={styles.analyticsStatLabel}>Events</Text>
            </View>
            <View style={styles.analyticsStatBox}>
              <Text style={styles.analyticsStatValue}>
                {Object.keys(userProperties).length}
              </Text>
              <Text style={styles.analyticsStatLabel}>User Props</Text>
            </View>
            <View style={styles.analyticsStatBox}>
              <Text style={styles.analyticsStatValue}>
                {Object.keys(defaultParams).length}
              </Text>
              <Text style={styles.analyticsStatLabel}>Defaults</Text>
            </View>
          </View>

          {/* Details Section */}
          {(hasUserProps || hasDefaultParams) && (
            <View style={styles.analyticsHeaderDetails}>
              {hasUserProps && (
                <View style={{marginBottom: 10}}>
                  <Text style={styles.detailsGroupTitle}>Active User Properties</Text>
                  {Object.entries(userProperties).map(([k, v]) => (
                    <View key={k} style={styles.detailsRow}>
                      <Text style={styles.detailsKey} selectable={true}>{k}</Text>
                      <Text style={styles.detailsValue} selectable={true}>{String(v)}</Text>
                    </View>
                  ))}
                </View>
              )}

              {hasDefaultParams && (
                <View>
                  <Text style={styles.detailsGroupTitle}>Default Event Parameters</Text>
                  {Object.entries(defaultParams).map(([k, v]) => (
                    <View key={k} style={styles.detailsRow}>
                      <Text style={styles.detailsKey} selectable={true}>{k}</Text>
                      <Text style={styles.detailsValue} selectable={true}>{String(v)}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}
        </>
      )}
    </View>
  );
};

const AnalyticsTab = () => {
  const {
    analyticsSearch,
    setAnalyticsSearch,
    handleDelete,
    filteredAnalyticsEvents,
    selectedEvent,
    setSelectedEvent,
    newEventIds,
    logRouteMapRef,
    isAnalyticsLayoutReady,
    setIsAnalyticsLayoutReady,
    isAnalyticsPaused,
    setIsAnalyticsPaused,
  } = useInspector();
  const renderItem = useCallback(
    ({item, index}: {item: any; index: number}) => {
const prev = filteredAnalyticsEvents[index + 1];
              const next = filteredAnalyticsEvents[index - 1];
              const msSincePrev = prev
                ? item.timestamp - prev.timestamp
                : undefined;
              const thisMin = Math.floor(item.timestamp / 60000);
              const nextMin = next
                ? Math.floor(next.timestamp / 60000)
                : -1;
              const showTimestamp =
                index === 0 || thisMin !== nextMin;
              return (
                <AnalyticsEventCard
                  event={item}
                  onPress={() => {
                    animateNextLayout();
                    setSelectedEvent(item);
                  }}
                  isNew={newEventIds.has(item.id)}
                  searchStr={analyticsSearch}
                  isFirst={index === 0}
                  isLast={
                    index === filteredAnalyticsEvents.length - 1
                  }
                  msSincePrev={msSincePrev}
                  showTimestamp={showTimestamp}
                  computedScreenName={(() => {
                    if (!item) return '';
                    const rawScreenName =
                      item.screenName ||
                      item.screenClass ||
                      item.pageTitle ||
                      item.pageLocation ||
                      item.params?.firebase_screen ||
                      item.params?.screen_name ||
                      item.params?.firebase_screen_class ||
                      item.params?.screen_class;
                    let screenName = typeof rawScreenName === 'string'
                      ? rawScreenName
                      : (rawScreenName ? JSON.stringify(rawScreenName) : '');
                    const routeInfo = logRouteMapRef.current.get(
                      item.id + 1000000,
                    );
                    if (!screenName) {
                      if (
                        routeInfo &&
                        routeInfo.path !== 'Navigators'
                      ) {
                        const parts = routeInfo.path.split(' ➔ ');
                        screenName = parts[parts.length - 1];
                      }
                    }
                    return screenName;
                  })()}
                />
              );
    },
    [filteredAnalyticsEvents, analyticsSearch, newEventIds, setSelectedEvent],
  );

  const keyExtractor = useCallback(
    (item: any, index: number) => item?.id?.toString() ?? index.toString(),
    [],
  );


  return (
    <>
      {/* ─── Search + Shared Toolbar for Analytics ──────────────────────── */}
      {selectedEvent == null && (
      <View
        style={[
          styles.toolbarRow,
          {marginTop: 12, marginBottom: 8},
        ]}>
        <View style={styles.searchContainer}>
          <SearchIcon
            color={AppColors.grayTextWeak}
            size={16}
          />
          <TextInput
            placeholder="Search events..."
            placeholderTextColor={AppColors.grayTextWeak}
            value={analyticsSearch}
            onChangeText={setAnalyticsSearch}
            style={styles.searchInput}
            autoCorrect={false}
            autoCapitalize="none"
          />
          {analyticsSearch.length > 0 && (
            <Pressable
              onPress={() => setAnalyticsSearch('')}
              hitSlop={10}
              style={styles.clearBtn}>
              <ClearIcon
                color={AppColors.grayTextWeak}
                size={14}
              />
            </Pressable>
          )}
        </View>
        <View style={styles.toolbarRight}>
          <TouchableOpacity
            style={[
              styles.toolbarBtn,
              isAnalyticsPaused && {
                borderColor: `${AppColors.darkOrange}50`,
                backgroundColor: `${AppColors.darkOrange}18`,
              },
            ]}
            onPress={() => setIsAnalyticsPaused(p => !p)}
            hitSlop={6}>
            <HeaderPauseIcon
              isPaused={isAnalyticsPaused}
              color={
                isAnalyticsPaused
                  ? AppColors.darkOrange
                  : AppColors.grayTextStrong
              }
              size={16}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.toolbarBtn,
              {
                borderColor: `${AppColors.errorColor}38`,
                backgroundColor: `${AppColors.errorColor}0F`,
              },
            ]}
            onPress={handleDelete}
            hitSlop={6}>
            <TrashIcon
              color={AppColors.errorColor}
              size={15}
            />
          </TouchableOpacity>
        </View>
      </View>
      )}

      <View
        style={{flex: 1}}
        onLayout={() => setIsAnalyticsLayoutReady(true)}>
        {selectedEvent != null ? (
          <AnalyticsDetail event={selectedEvent} />
        ) : isAnalyticsLayoutReady ? (
          <FlatList
            data={filteredAnalyticsEvents}
            keyExtractor={keyExtractor}
            ListHeaderComponent={AnalyticsHeader}
            renderItem={renderItem}
            initialNumToRender={20}
            maxToRenderPerBatch={20}
            windowSize={5}
            removeClippedSubviews={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIconWrap}>
                  <EmptyRadarIcon
                    color={AppColors.purple}
                    size={32}
                  />
                </View>
                <Text style={styles.emptyTitle}>
                  {analyticsSearch.length > 0
                    ? 'No matching events'
                    : 'No analytics events yet'}
                </Text>
                <Text style={styles.emptySub}>
                  {analyticsSearch.length > 0
                    ? 'Try adjusting your search.'
                    : 'Call setupAnalyticsLogger(analytics()) at app start.'}
                </Text>
              </View>
            }
            ListFooterComponent={
              filteredAnalyticsEvents.length > 0 ? (
                <EndOfListFooter
                  count={filteredAnalyticsEvents.length}
                  label="events"
                />
              ) : null
            }
            contentContainerStyle={[
              styles.listContent,
              filteredAnalyticsEvents.length === 0 && {
                flexGrow: 1,
              },
            ]}
            keyboardShouldPersistTaps="handled"
          />
        ) : null}
      </View>
    </>
  );
};

export default AnalyticsTab;
