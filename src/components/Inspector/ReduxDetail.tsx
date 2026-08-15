import React, {useState, useMemo, useEffect, useCallback} from 'react';
import {
  Alert,
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  ToastAndroid,
  TouchableOpacity,
  View,
} from 'react-native';
import {useTranslation} from '../../i18n';
import {useInspector} from './InspectorContext';
import SegmentedTabs from '../SegmentedTabs';
import JsonViewer from '../JsonViewer';
import DiffViewer from '../DiffViewer';
import CopyButton from '../CopyButton';
import TouchableScale from '../TouchableScale';
import HighlightText from '../HighlightText';
import AnimatedEntrance from '../AnimatedEntrance';
import {getActionHistory, clearActionHistory} from '../../customHooks/reduxLogger';
import {getSize, copyToClipboard} from '../../helpers';
import {getCustomStorage} from '../../helpers/settingsStore';
import {AppColors} from '../../styles/AppColors';
import {AppFonts} from '../../styles/AppFonts';
import styles from '../../styles';
import {
  TerminalIcon,
  CopyIcon,
  SearchIcon,
  ClearIcon,
  ClockIcon,
  LayersIcon,
  TrashIcon,
  DiffIcon,
  RequestIcon,
  ForwardChevronIcon,
  LiveStateIcon,
  TimelineIcon,
  StorageIcon,
  MetadataIcon,
} from '../NetworkIcons';

type SliceDetailSubTab = 'live' | 'timeline' | 'persisted' | 'metadata';

const ReduxDetail = React.memo(() => {
  const {t} = useTranslation();
  const {
    reduxState,
    reduxLastActionMap,
    selectedReduxSlice,
    selectedReduxAction,
    setSelectedReduxSlice,
    setSelectedReduxAction,
  } = useInspector();

  // Search filter within details
  const [detailSearch, setDetailSearch] = useState('');

  // Sub-tabs for Slice
  const [sliceTab, setSliceTab] = useState<SliceDetailSubTab>('live');
  const [viewMode, setViewMode] = useState<'pretty' | 'raw' | 'table'>('pretty');

  // Selected Action inside Timeline
  const [expandedActionId, setExpandedActionId] = useState<number | null>(null);

  // Persistence data for active slice
  const [isPersisted, setIsPersisted] = useState(false);
  const [persistedData, setPersistedData] = useState<any>(null);

  // Fetch Action History
  const allActionHistory = useMemo(() => {
    return getActionHistory();
  }, [reduxLastActionMap]);

  // Slices-filtered actions
  const sliceActions = useMemo(() => {
    if (!selectedReduxSlice) return allActionHistory;
    return allActionHistory.filter(action => {
      if (!action.affectedSlices || action.affectedSlices.length === 0) return true;
      return action.affectedSlices.includes(selectedReduxSlice);
    });
  }, [allActionHistory, selectedReduxSlice]);

  useEffect(() => {
    if (!selectedReduxSlice) return;

    async function checkPersistence() {
      try {
        const storage = getCustomStorage();
        if (!storage) {
          setIsPersisted(false);
          setPersistedData(null);
          return;
        }

        let raw = await storage.getItem(`persist:${selectedReduxSlice}`);
        if (raw) {
          try {
            setPersistedData(JSON.parse(raw));
          } catch {
            setPersistedData(raw);
          }
          setIsPersisted(true);
          return;
        }

        let rootRaw = await storage.getItem('persist:root');
        if (rootRaw) {
          const parsedRoot = JSON.parse(rootRaw);
          if (parsedRoot && parsedRoot[selectedReduxSlice] !== undefined) {
            const nested = parsedRoot[selectedReduxSlice];
            try {
              setPersistedData(typeof nested === 'string' ? JSON.parse(nested) : nested);
            } catch {
              setPersistedData(nested);
            }
            setIsPersisted(true);
            return;
          }
        }
      } catch (e) {
        // silent catch
      }
      setIsPersisted(false);
      setPersistedData(null);
    }

    checkPersistence();
  }, [selectedReduxSlice]);

  const handleClearPersistence = () => {
    if (!selectedReduxSlice) return;
    Alert.alert(
      'Clear Persisted State',
      `Are you sure you want to delete persisted storage for slice "${selectedReduxSlice}"?`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const storage = getCustomStorage();
              if (!storage) return;

              if (typeof (storage as any).removeItem === 'function') {
                await (storage as any).removeItem(`persist:${selectedReduxSlice}`);
              } else {
                await storage.setItem(`persist:${selectedReduxSlice}`, '');
              }

              setIsPersisted(false);
              setPersistedData(null);
              setSliceTab('live');

              if (Platform.OS === 'android') {
                ToastAndroid.show('Persisted state cleared', ToastAndroid.SHORT);
              } else {
                Alert.alert('Cleared', 'Persisted state has been cleared.');
              }
            } catch (err) {
              Alert.alert('Error', 'Failed to clear persisted state.');
            }
          },
        },
      ],
    );
  };

  // ══════════════════════════════════════════════════════════════════════════
  // ── 1. RENDER SLICE DETAIL VIEW ───────────────────────────────────────────
  // ══════════════════════════════════════════════════════════════════════════
  if (selectedReduxSlice != null) {
    const sliceData = reduxState?.[selectedReduxSlice];
    const fieldsCount =
      sliceData && typeof sliceData === 'object'
        ? Object.keys(sliceData).length
        : typeof sliceData !== 'undefined'
        ? 1
        : 0;
    const lastAction = reduxLastActionMap[selectedReduxSlice];

    const sliceTabs = [
      {key: 'live', label: 'Live State', icon: () => <LiveStateIcon color={AppColors.purple} size={11} />},
      {key: 'timeline', label: `Timeline (${sliceActions.length})`, icon: () => <TimelineIcon color={AppColors.purple} size={11} />},
      {key: 'persisted', label: isPersisted ? 'Persisted' : 'Storage', icon: () => <StorageIcon color={AppColors.purple} size={11} />},
      {key: 'metadata', label: 'Metadata', icon: () => <MetadataIcon color={AppColors.purple} size={11} />},
    ];

    return (
      <View style={{flex: 1, backgroundColor: AppColors.grayBackground}}>
        {/* Info Header Bar */}
        <View style={reduxDetailStyles.infoBar}>
          <View style={reduxDetailStyles.infoTopRow}>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap', flex: 1}}>
              <View style={[reduxDetailStyles.methodBadge, {backgroundColor: AppColors.purple}]}>
                <Text style={reduxDetailStyles.methodBadgeText}>SLICE</Text>
              </View>
              <Text style={reduxDetailStyles.sliceNameText}>
                {selectedReduxSlice}
              </Text>
              {isPersisted ? (
                <View style={reduxDetailStyles.persistedChip}>
                  <Text style={reduxDetailStyles.persistedChipText}>PERSISTED</Text>
                </View>
              ) : (
                <View style={reduxDetailStyles.inMemoryChip}>
                  <Text style={reduxDetailStyles.inMemoryChipText}>IN-MEMORY</Text>
                </View>
              )}
              {lastAction?.timestamp && (
                <View style={reduxDetailStyles.timePill}>
                  <ClockIcon color={AppColors.purple} size={10} />
                  <Text style={reduxDetailStyles.timeText}>
                    {lastAction.timestamp}
                  </Text>
                </View>
              )}
            </View>

            {/* Copy Button */}
            <CopyButton
              value={() => (sliceTab === 'live' ? sliceData : persistedData)}
              label="Slice JSON"
            />
          </View>

          {/* Sub Stats Row */}
          <View style={reduxDetailStyles.subStatsRow}>
            <View style={reduxDetailStyles.statPill}>
              <Text style={reduxDetailStyles.statLabel}>Root Keys:</Text>
              <Text style={reduxDetailStyles.statValue}>{fieldsCount}</Text>
            </View>
            <View style={reduxDetailStyles.statPill}>
              <Text style={reduxDetailStyles.statLabel}>Size:</Text>
              <Text style={reduxDetailStyles.statValue}>{getSize(sliceData)}</Text>
            </View>
            <View style={reduxDetailStyles.statPill}>
              <Text style={reduxDetailStyles.statLabel}>Timeline:</Text>
              <Text style={reduxDetailStyles.statValue}>{sliceActions.length} actions</Text>
            </View>
            {lastAction && (
              <View style={[reduxDetailStyles.statPill, {flex: 1, minWidth: 140}]}>
                <Text style={reduxDetailStyles.statLabel}>Last Action:</Text>
                <Text style={reduxDetailStyles.statValue} numberOfLines={1}>
                  {lastAction.type}
                </Text>
              </View>
            )}
          </View>

          {/* Sub-Tabs */}
          <SegmentedTabs
            tabs={sliceTabs}
            activeKey={sliceTab}
            onChange={key => setSliceTab(key as SliceDetailSubTab)}
            style={{marginTop: 10}}
          />
        </View>

        {/* Search Bar within slice */}
        {sliceTab !== 'metadata' && (
          <View style={reduxDetailStyles.searchContainer}>
            <SearchIcon color={AppColors.grayTextWeak} size={14} />
            <TextInput
              placeholder="Search keys, values, or action types..."
              placeholderTextColor={AppColors.grayTextWeak}
              value={detailSearch}
              onChangeText={setDetailSearch}
              style={reduxDetailStyles.searchInput}
              autoCorrect={false}
              autoCapitalize="none"
            />
            {detailSearch.length > 0 && (
              <Pressable onPress={() => setDetailSearch('')} hitSlop={10}>
                <ClearIcon color={AppColors.grayTextWeak} size={14} />
              </Pressable>
            )}
          </View>
        )}

        {/* Content Body */}
        {sliceTab === 'timeline' ? (
          <ScrollView
            style={{flex: 1}}
            contentContainerStyle={{padding: 12, paddingBottom: 40}}
            keyboardShouldPersistTaps="handled">
            {sliceActions.length === 0 ? (
              <View style={reduxDetailStyles.emptyBox}>
                <Text style={reduxDetailStyles.emptyBoxText}>
                  No dispatched actions recorded for this slice yet.
                </Text>
              </View>
            ) : (
              sliceActions.map((action, aIdx) => {
                const isExpanded = expandedActionId === action.id;
                return (
                  <AnimatedEntrance key={action.id} index={aIdx} distance={6}>
                    <TouchableScale
                      onPress={() =>
                        setExpandedActionId(isExpanded ? null : action.id)
                      }
                      style={reduxDetailStyles.timelineCard}>
                      <View style={reduxDetailStyles.timelineHeader}>
                        <View style={reduxDetailStyles.actionBadge}>
                          <Text style={reduxDetailStyles.actionBadgeText}>
                            #{action.id}
                          </Text>
                        </View>
                        <HighlightText
                          text={action.type}
                          search={detailSearch}
                          style={reduxDetailStyles.actionTitle}
                          highlightStyle={reduxDetailStyles.highlight}
                        />
                        <View style={reduxDetailStyles.timePill}>
                          <ClockIcon color={AppColors.purple} size={10} />
                          <Text style={reduxDetailStyles.timeText}>
                            {action.timestamp}
                          </Text>
                        </View>
                      </View>

                      {/* Expanded Payload & Diff Viewer */}
                      {isExpanded ? (
                        <View style={reduxDetailStyles.expandedContent}>
                          {action.payload !== undefined && (
                            <View style={{marginBottom: 10}}>
                              <Text style={reduxDetailStyles.expandedSectionTitle}>
                                Action Payload:
                              </Text>
                              <JsonViewer
                                data={action.payload}
                                search={detailSearch}
                                forceOpen={true}
                              />
                            </View>
                          )}

                          <Text style={reduxDetailStyles.expandedSectionTitle}>
                            State Changes (Diff):
                          </Text>
                          <DiffViewer
                            oldData={action.prevState?.[selectedReduxSlice] || {}}
                            newData={action.nextState?.[selectedReduxSlice] || {}}
                            forceOpen={true}
                          />
                        </View>
                      ) : (
                        <View style={reduxDetailStyles.collapsedPrompt}>
                          <Text style={reduxDetailStyles.collapsedPromptText}>
                            Tap to inspect action payload & diff changes
                          </Text>
                          <ForwardChevronIcon color={AppColors.grayTextWeak} size={12} />
                        </View>
                      )}
                    </TouchableScale>
                  </AnimatedEntrance>
                );
              })
            )}
          </ScrollView>
        ) : sliceTab === 'metadata' ? (
          <ScrollView
            style={{flex: 1}}
            contentContainerStyle={{padding: 12, paddingBottom: 40}}
            keyboardShouldPersistTaps="handled">
            <View style={reduxDetailStyles.metadataCard}>
              {[
                {label: 'Slice Name', value: selectedReduxSlice},
                {label: 'Root Keys Count', value: `${fieldsCount} keys`},
                {label: 'In-Memory State Size', value: getSize(sliceData)},
                {
                  label: 'Persistence Status',
                  value: isPersisted ? `Persisted (${getSize(persistedData)})` : 'Not Persisted',
                },
                {
                  label: 'Dispatched Actions History',
                  value: `${sliceActions.length} recorded actions`,
                },
                {
                  label: 'Last Dispatched Action',
                  value: lastAction ? lastAction.type : 'None',
                },
                {
                  label: 'Last Action Timestamp',
                  value: lastAction ? lastAction.timestamp : 'Initial',
                },
              ].map((row, rIdx) => (
                <View
                  key={rIdx}
                  style={[
                    reduxDetailStyles.metaRow,
                    rIdx === 6 && {borderBottomWidth: 0},
                  ]}>
                  <Text style={reduxDetailStyles.metaLabel}>{row.label}</Text>
                  <Text style={reduxDetailStyles.metaValue} selectable numberOfLines={2}>
                    {row.value}
                  </Text>
                </View>
              ))}

              {isPersisted && (
                <TouchableOpacity
                  style={reduxDetailStyles.clearPersistBtn}
                  onPress={handleClearPersistence}>
                  <TrashIcon color={AppColors.errorColor} size={14} />
                  <Text style={reduxDetailStyles.clearPersistText}>
                    Clear Persisted Storage For This Slice
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        ) : (
          <ScrollView
            style={{flex: 1}}
            contentContainerStyle={{padding: 12, paddingBottom: 40}}
            keyboardShouldPersistTaps="handled">
            <JsonViewer
              data={sliceTab === 'live' ? sliceData : persistedData ?? 'No persisted state stored.'}
              search={detailSearch}
              forceOpen={detailSearch.length > 0 ? true : undefined}
              mode={viewMode}
              onModeChange={setViewMode}
            />
          </ScrollView>
        )}
      </View>
    );
  }

  return null;
});

const reduxDetailStyles = StyleSheet.create({
  infoBar: {
    backgroundColor: AppColors.white,
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.dividerColor,
  },
  infoTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  methodBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  methodBadgeText: {
    fontFamily: AppFonts.interBold,
    fontSize: 10,
    color: AppColors.white,
    letterSpacing: 0.5,
  },
  sliceNameText: {
    fontFamily: AppFonts.interBold,
    fontSize: 14,
    color: AppColors.primaryBlack,
  },
  persistedChip: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  persistedChipText: {
    fontFamily: AppFonts.interBold,
    fontSize: 9,
    color: '#047857',
  },
  inMemoryChip: {
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  inMemoryChipText: {
    fontFamily: AppFonts.interBold,
    fontSize: 9,
    color: '#7E22CE',
  },
  subStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: AppColors.grayBackground,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: AppColors.dividerColor,
  },
  statLabel: {
    fontFamily: AppFonts.interMedium,
    fontSize: 10.5,
    color: AppColors.grayTextWeak,
  },
  statValue: {
    fontFamily: AppFonts.interBold,
    fontSize: 11,
    color: AppColors.primaryBlack,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.white,
    borderRadius: 8,
    marginHorizontal: 12,
    marginTop: 10,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: AppColors.dividerColor,
    height: 36,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: AppFonts.interRegular,
    fontSize: 12,
    color: AppColors.primaryBlack,
    padding: 0,
  },
  timelineCard: {
    backgroundColor: AppColors.white,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: AppColors.dividerColor,
  },
  timelineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  actionBadgeText: {
    fontFamily: AppFonts.interBold,
    fontSize: 9.5,
    color: '#4338CA',
  },
  actionTitle: {
    flex: 1,
    fontFamily: AppFonts.interBold,
    fontSize: 12.5,
    color: AppColors.primaryBlack,
  },
  timePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: `${AppColors.purple}14`,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  timeText: {
    fontFamily: AppFonts.interMedium,
    fontSize: 10,
    color: AppColors.purple,
  },
  collapsedPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: AppColors.dividerColor,
  },
  collapsedPromptText: {
    fontFamily: AppFonts.interRegular,
    fontSize: 10.5,
    color: AppColors.grayTextWeak,
  },
  expandedContent: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: AppColors.dividerColor,
  },
  expandedSectionTitle: {
    fontFamily: AppFonts.interBold,
    fontSize: 11,
    color: AppColors.grayTextStrong,
    marginBottom: 4,
  },
  metadataCard: {
    backgroundColor: AppColors.white,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: AppColors.dividerColor,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.dividerColor,
  },
  metaLabel: {
    fontFamily: AppFonts.interMedium,
    fontSize: 12,
    color: AppColors.grayTextWeak,
  },
  metaValue: {
    fontFamily: AppFonts.interBold,
    fontSize: 12,
    color: AppColors.primaryBlack,
    maxWidth: '60%',
    textAlign: 'right',
  },
  clearPersistBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FEE2E2',
    borderRadius: 8,
    paddingVertical: 10,
    marginTop: 14,
  },
  clearPersistText: {
    fontFamily: AppFonts.interBold,
    fontSize: 12,
    color: AppColors.errorColor,
  },
  emptyBox: {
    backgroundColor: AppColors.white,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: AppColors.dividerColor,
  },
  emptyBoxText: {
    fontFamily: AppFonts.interMedium,
    fontSize: 12.5,
    color: AppColors.grayTextWeak,
  },
  highlight: {
    backgroundColor: '#FEF08A',
    color: '#854D0E',
    fontFamily: AppFonts.interBold,
  },
});

export default ReduxDetail;
