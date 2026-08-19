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
import {getSize, copyToClipboard, openInVSCode, parseStackLine} from '../../helpers';
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
  BoltIcon,
  ExternalLinkIcon,
} from '../NetworkIcons';

type SliceDetailSubTab = 'live' | 'timeline' | 'persisted' | 'metadata';

const getOriginBadge = (originType?: string) => {
  switch (originType) {
    case 'saga':
      return {
        label: 'SAGA',
        icon: '⚡',
        bg: AppColors.purple100,
        text: AppColors.brandPurple,
        border: AppColors.purple200,
      };
    case 'thunk':
      return {
        label: 'THUNK',
        icon: '⚛️',
        bg: AppColors.amber100,
        text: AppColors.amber800Warm,
        border: AppColors.amber200,
      };
    case 'ui':
      return {
        label: 'UI',
        icon: '📱',
        bg: AppColors.sky100,
        text: AppColors.sky600,
        border: AppColors.sky400,
      };
    case 'listener':
      return {
        label: 'LISTENER',
        icon: '👂',
        bg: AppColors.teal100,
        text: AppColors.teal700,
        border: AppColors.teal400,
      };
    default:
      return {
        label: 'DIRECT',
        icon: '⚡',
        bg: AppColors.slate100,
        text: AppColors.slate700,
        border: AppColors.slate200,
      };
  }
};

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
      {
        key: 'live',
        label: t('redux.liveState'),
        icon: (isActive: boolean) => (
          <LiveStateIcon
            color={isActive ? AppColors.white : AppColors.grayText}
            size={12}
          />
        ),
      },
      {
        key: 'timeline',
        label: `${t('redux.timeline')} (${sliceActions.length})`,
        icon: (isActive: boolean) => (
          <TimelineIcon
            color={isActive ? AppColors.white : AppColors.grayText}
            size={12}
          />
        ),
      },
      {
        key: 'persisted',
        label: isPersisted ? t('redux.persisted') : t('redux.storage'),
        icon: (isActive: boolean) => (
          <StorageIcon
            color={isActive ? AppColors.white : AppColors.grayText}
            size={12}
          />
        ),
      },
      {
        key: 'metadata',
        label: t('redux.metadata'),
        icon: (isActive: boolean) => (
          <MetadataIcon
            color={isActive ? AppColors.white : AppColors.grayText}
            size={12}
          />
        ),
      },
    ];

    return (
      <View style={{flex: 1, backgroundColor: AppColors.grayBackground}}>
        {/* Info Header Bar */}
        <View style={reduxDetailStyles.infoBar}>
          <View style={reduxDetailStyles.infoTopRow}>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap', flex: 1}}>
              <View style={[reduxDetailStyles.methodBadge, {backgroundColor: AppColors.indigo600Alt}]}>
                <Text style={reduxDetailStyles.methodBadgeText}>{t('redux.slice')}</Text>
              </View>
              <Text style={reduxDetailStyles.sliceNameText}>
                {selectedReduxSlice}
              </Text>
              {isPersisted ? (
                <View style={reduxDetailStyles.persistedChip}>
                  <StorageIcon color={AppColors.emerald700} size={10} />
                  <Text style={reduxDetailStyles.persistedChipText}>{t('redux.persisted').toUpperCase()}</Text>
                </View>
              ) : (
                <View style={reduxDetailStyles.inMemoryChip}>
                  <Text style={reduxDetailStyles.inMemoryChipText}>{t('redux.inMemory').toUpperCase()}</Text>
                </View>
              )}
              {lastAction?.timestamp && (
                <View style={reduxDetailStyles.timePill}>
                  <ClockIcon color={AppColors.violet600} size={10} />
                  <Text style={reduxDetailStyles.timeText}>
                    {lastAction.timestamp}
                  </Text>
                </View>
              )}
            </View>

            {/* Copy Button */}
            <CopyButton
              value={() => (sliceTab === 'live' ? sliceData : persistedData)}
              label={t('redux.sliceJson')}
            />
          </View>

          {/* Sub Stats Row */}
          <View style={reduxDetailStyles.subStatsRow}>
            <View style={[reduxDetailStyles.statPill, {backgroundColor: AppColors.indigo50, borderColor: AppColors.indigo400}]}>
              <LayersIcon color={AppColors.indigo600Alt} size={11} />
              <Text style={[reduxDetailStyles.statLabel, {color: AppColors.indigo600Alt}]}>{t('redux.keys')}:</Text>
              <Text style={[reduxDetailStyles.statValue, {color: AppColors.indigo600Alt}]}>{fieldsCount}</Text>
            </View>
            <View style={[reduxDetailStyles.statPill, {backgroundColor: AppColors.sky100, borderColor: AppColors.sky400}]}>
              <Text style={[reduxDetailStyles.statLabel, {color: AppColors.sky600}]}>{t('redux.size')}:</Text>
              <Text style={[reduxDetailStyles.statValue, {color: AppColors.sky600}]}>{getSize(sliceData)}</Text>
            </View>
            <View style={[reduxDetailStyles.statPill, {backgroundColor: AppColors.purple100, borderColor: AppColors.purple200}]}>
              <TimelineIcon color={AppColors.violet600} size={11} />
              <Text style={[reduxDetailStyles.statLabel, {color: AppColors.brandPurple}]}>{t('redux.timeline')}:</Text>
              <Text style={[reduxDetailStyles.statValue, {color: AppColors.brandPurple}]}>{sliceActions.length}</Text>
            </View>
            {lastAction && (
              <View style={[reduxDetailStyles.statPill, {backgroundColor: AppColors.amber100, borderColor: AppColors.amber200, flex: 1, minWidth: 140}]}>
                <BoltIcon color={AppColors.amber800Warm} size={11} />
                <Text style={[reduxDetailStyles.statLabel, {color: AppColors.amber800Warm}]}>{t('redux.last')}:</Text>
                <Text style={[reduxDetailStyles.statValue, {color: AppColors.amber800Warm}]} numberOfLines={1}>
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
                const originMeta = getOriginBadge(action.originType);
                const callerBasename = action.callerFile
                  ? action.callerFile.split('/').pop()
                  : null;

                return (
                  <AnimatedEntrance key={action.id} index={aIdx} distance={6}>
                    <TouchableScale
                      onPress={() =>
                        setExpandedActionId(isExpanded ? null : action.id)
                      }
                      style={reduxDetailStyles.timelineCard}>
                      <View style={reduxDetailStyles.timelineHeader}>
                        <View style={{flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, minWidth: 0, flexWrap: 'wrap'}}>
                          <View style={reduxDetailStyles.actionBadge}>
                            <Text style={reduxDetailStyles.actionBadgeText}>
                              #{action.id}
                            </Text>
                          </View>
                          {/* Origin Badge */}
                          <View
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              gap: 3,
                              backgroundColor: originMeta.bg,
                              paddingHorizontal: 6,
                              paddingVertical: 2,
                              borderRadius: 4,
                              borderWidth: 1,
                              borderColor: originMeta.border,
                            }}>
                            <Text style={{fontSize: 9}}>{originMeta.icon}</Text>
                            <Text
                              style={{
                                fontFamily: AppFonts.interBold,
                                fontSize: 8.5,
                                color: originMeta.text,
                                letterSpacing: 0.3,
                              }}>
                              {originMeta.label}
                            </Text>
                          </View>

                          <HighlightText
                            text={action.type}
                            search={detailSearch}
                            style={reduxDetailStyles.actionTitle}
                            highlightStyle={reduxDetailStyles.highlight}
                          />
                        </View>

                        <View style={reduxDetailStyles.timePill}>
                          <ClockIcon color={AppColors.purple} size={10} />
                          <Text style={reduxDetailStyles.timeText}>
                            {action.timestamp}
                          </Text>
                        </View>
                      </View>

                      {/* Trigger caller preview row */}
                      {action.callerFile && (
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginTop: 5,
                            marginBottom: 2,
                            paddingHorizontal: 7,
                            paddingVertical: 3,
                            backgroundColor: AppColors.grayBackground,
                            borderRadius: 5,
                            borderWidth: 1,
                            borderColor: AppColors.dividerColor,
                          }}>
                          <View style={{flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1, minWidth: 0}}>
                            <Text style={{fontFamily: AppFonts.interMedium, fontSize: 9.5, color: AppColors.grayTextWeak}}>
                              {t('redux.triggeredFrom')}
                            </Text>
                            <Text
                              style={{
                                fontFamily: AppFonts.interBold,
                                fontSize: 9.5,
                                color: AppColors.sky600,
                              }}
                              numberOfLines={1}>
                              {callerBasename}:{action.callerLine || 1}
                            </Text>
                          </View>

                          <Pressable
                            onPress={() =>
                              openInVSCode(
                                action.callerFile!,
                                action.callerLine,
                                action.callerCol,
                              )
                            }
                            hitSlop={8}
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              gap: 3,
                              backgroundColor: AppColors.sky100,
                              paddingHorizontal: 5,
                              paddingVertical: 1.5,
                              borderRadius: 3,
                            }}>
                            <ExternalLinkIcon color={AppColors.sky600} size={9} />
                            <Text style={{fontFamily: AppFonts.interBold, fontSize: 8.5, color: AppColors.sky600}}>
                              {t('redux.openInEditor')}
                            </Text>
                          </Pressable>
                        </View>
                      )}

                      {/* Expanded Payload, Diff Viewer & Call Stack */}
                      {isExpanded ? (
                        <View style={reduxDetailStyles.expandedContent}>
                          {/* Call Stack Trace Box */}
                          {action.stack ? (
                            <View style={{marginBottom: 10}}>
                              <Text style={reduxDetailStyles.expandedSectionTitle}>
                                {t('redux.callStack')}:
                              </Text>
                              <View
                                style={{
                                  backgroundColor: AppColors.grayBackground,
                                  borderRadius: 8,
                                  padding: 8,
                                  borderWidth: 1,
                                  borderColor: AppColors.dividerColor,
                                  gap: 4,
                                }}>
                                {action.stack
                                  .split('\n')
                                  .map(l => l.trim())
                                  .filter(l => l.length > 0 && !l.includes('reduxLogger') && !l.includes('inspectorReduxMiddleware'))
                                  .slice(0, 8)
                                  .map((frameLine, fIdx) => {
                                    const parsed = parseStackLine(frameLine, fIdx === 0);
                                    const isApp = parsed.frameType === 'app';
                                    return (
                                      <Pressable
                                        key={fIdx}
                                        onPress={() => {
                                          if (parsed.fileName !== 'Unknown') {
                                            openInVSCode(
                                              parsed.fullPath || parsed.fileName,
                                              parsed.lineNumber,
                                              parsed.columnNumber,
                                            );
                                          }
                                        }}
                                        style={{
                                          flexDirection: 'row',
                                          alignItems: 'center',
                                          justifyContent: 'space-between',
                                          paddingVertical: 2.5,
                                          borderBottomWidth: fIdx < 7 ? 0.5 : 0,
                                          borderBottomColor: AppColors.dividerColor,
                                        }}>
                                        <View style={{flex: 1, minWidth: 0}}>
                                          <Text
                                            style={{
                                              fontFamily: isApp ? AppFonts.interBold : AppFonts.interRegular,
                                              fontSize: 9.5,
                                              color: isApp ? AppColors.primaryBlack : AppColors.grayTextWeak,
                                            }}
                                            numberOfLines={1}>
                                            {parsed.functionName || 'anonymous'}
                                          </Text>
                                          <Text
                                            style={{
                                              fontFamily: AppFonts.interRegular,
                                              fontSize: 8.5,
                                              color: isApp ? AppColors.sky600 : AppColors.grayTextWeak,
                                            }}
                                            numberOfLines={1}>
                                            {parsed.fileName}:{parsed.lineNumber || 1}:{parsed.columnNumber || 1}
                                          </Text>
                                        </View>
                                        {isApp && (
                                          <ExternalLinkIcon color={AppColors.sky600} size={10} />
                                        )}
                                      </Pressable>
                                    );
                                  })}
                              </View>
                            </View>
                          ) : null}

                          {action.payload !== undefined && (
                            <View style={{marginBottom: 10}}>
                              <Text style={reduxDetailStyles.expandedSectionTitle}>
                                {t('redux.actionPayload')}
                              </Text>
                              <JsonViewer
                                data={action.payload}
                                search={detailSearch}
                                forceOpen={true}
                              />
                            </View>
                          )}

                          <Text style={reduxDetailStyles.expandedSectionTitle}>
                            {t('redux.stateChangesDiff')}
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
                            {t('redux.tapToInspectAction')}
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3.5,
    backgroundColor: '#ECFDF5',
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
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  inMemoryChipText: {
    fontFamily: AppFonts.interBold,
    fontSize: 9,
    color: '#4338CA',
  },
  subStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: AppColors.grayBackground,
    paddingHorizontal: 7,
    paddingVertical: 3.5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: AppColors.dividerColor,
  },
  statLabel: {
    fontFamily: AppFonts.interBold,
    fontSize: 10,
    color: AppColors.grayTextWeak,
  },
  statValue: {
    fontFamily: AppFonts.interBold,
    fontSize: 10.5,
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
    backgroundColor: AppColors.errorCardBg,
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
