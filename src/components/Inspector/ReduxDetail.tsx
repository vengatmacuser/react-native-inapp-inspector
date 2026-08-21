import React, {useState, useMemo, useEffect, useCallback} from 'react';
import {
  Alert,
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
import {getActionHistory} from '../../customHooks/reduxLogger';
import {getSize, openInVSCode, parseStackLine} from '../../helpers';
import {getCustomStorage} from '../../helpers/settingsStore';
import {AppColors} from '../../styles/AppColors';
import {AppFonts} from '../../styles/AppFonts';
import {
  TerminalIcon,
  SearchIcon,
  ClearIcon,
  ClockIcon,
  LayersIcon,
  TrashIcon,
  ForwardChevronIcon,
  LiveStateIcon,
  TimelineIcon,
  StorageIcon,
  MetadataIcon,
  BoltIcon,
  AtomIcon,
  ScreenIcon,
  ListenerIcon,
  DocIcon,
  LoadingSpinnerIcon,
  CircleAlertIcon,
  ExternalLinkIcon,
  SizeIcon,
  CodeBracketsIcon,
} from '../NetworkIcons';

type SliceDetailSubTab = 'live' | 'timeline' | 'persisted' | 'metadata';
type ActionDetailSubTab = 'payload' | 'diff' | 'stack' | 'raw';

const getOriginBadge = (originType?: string) => {
  switch (originType) {
    case 'saga':
      return {
        label: 'SAGA',
        renderIcon: (color: string, size = 9) => (
          <BoltIcon color={color} size={size} />
        ),
        bg: AppColors.purple100,
        text: AppColors.brandPurple,
        border: AppColors.purple200,
      };
    case 'thunk':
      return {
        label: 'THUNK',
        renderIcon: (color: string, size = 9) => (
          <AtomIcon color={color} size={size} />
        ),
        bg: AppColors.amber100,
        text: AppColors.amber800Warm,
        border: AppColors.amber200,
      };
    case 'ui':
      return {
        label: 'UI',
        renderIcon: (color: string, size = 9) => (
          <ScreenIcon color={color} size={size} />
        ),
        bg: AppColors.sky100,
        text: AppColors.sky600,
        border: AppColors.sky400,
      };
    case 'listener':
      return {
        label: 'LISTENER',
        renderIcon: (color: string, size = 9) => (
          <ListenerIcon color={color} size={size} />
        ),
        bg: AppColors.teal100,
        text: AppColors.teal700,
        border: AppColors.teal400,
      };
    default:
      return {
        label: 'DIRECT',
        renderIcon: (color: string, size = 9) => (
          <BoltIcon color={color} size={size} />
        ),
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
  } = useInspector();

  // Search filter within details
  const [detailSearch, setDetailSearch] = useState('');

  // Sub-tabs for Slice & Action
  const [sliceTab, setSliceTab] = useState<SliceDetailSubTab>('live');
  const [actionTab, setActionTab] = useState<ActionDetailSubTab>('payload');
  const [viewMode, setViewMode] = useState<'pretty' | 'raw' | 'table'>(
    'pretty',
  );

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
      if (!action.affectedSlices || action.affectedSlices.length === 0)
        return true;
      return action.affectedSlices.includes(selectedReduxSlice);
    });
  }, [allActionHistory, selectedReduxSlice]);

  // Filtered slice actions by search query in timeline tab
  const filteredTimelineActions = useMemo(() => {
    if (!detailSearch.trim()) return sliceActions;
    const q = detailSearch.toLowerCase();
    return sliceActions.filter(action => {
      return (
        action.type.toLowerCase().includes(q) ||
        (action.callerFile && action.callerFile.toLowerCase().includes(q)) ||
        (action.payload &&
          JSON.stringify(action.payload).toLowerCase().includes(q))
      );
    });
  }, [sliceActions, detailSearch]);

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
              setPersistedData(
                typeof nested === 'string' ? JSON.parse(nested) : nested,
              );
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
                await (storage as any).removeItem(
                  `persist:${selectedReduxSlice}`,
                );
              } else {
                await storage.setItem(`persist:${selectedReduxSlice}`, '');
              }

              setIsPersisted(false);
              setPersistedData(null);
              setSliceTab('live');

              if (Platform.OS === 'android') {
                ToastAndroid.show(
                  'Persisted state cleared',
                  ToastAndroid.SHORT,
                );
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
        label: t('redux.liveState', 'Live State'),
        icon: (isActive: boolean) => (
          <LiveStateIcon
            color={isActive ? AppColors.white : AppColors.grayText}
            size={12}
          />
        ),
      },
      {
        key: 'timeline',
        label: `${t('redux.timeline', 'Timeline')} (${sliceActions.length})`,
        icon: (isActive: boolean) => (
          <TimelineIcon
            color={isActive ? AppColors.white : AppColors.grayText}
            size={12}
          />
        ),
      },
      {
        key: 'persisted',
        label: isPersisted
          ? t('redux.persisted', 'Persisted')
          : t('redux.storage', 'Storage'),
        icon: (isActive: boolean) => (
          <StorageIcon
            color={isActive ? AppColors.white : AppColors.grayText}
            size={12}
          />
        ),
      },
      {
        key: 'metadata',
        label: t('redux.metadata', 'Metadata'),
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
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                flexWrap: 'wrap',
                flex: 1,
                minWidth: 0,
              }}>
              <View
                style={[
                  reduxDetailStyles.methodBadge,
                  {backgroundColor: AppColors.indigo600Alt},
                ]}>
                <Text style={reduxDetailStyles.methodBadgeText}>
                  {t('redux.slice', 'SLICE')}
                </Text>
              </View>
              <Text style={reduxDetailStyles.sliceNameText} numberOfLines={1}>
                {selectedReduxSlice}
              </Text>
              {isPersisted ? (
                <View style={reduxDetailStyles.persistedChip}>
                  <StorageIcon color={AppColors.emerald700} size={10} />
                  <Text style={reduxDetailStyles.persistedChipText}>
                    {t('redux.persisted', 'Persisted').toUpperCase()}
                  </Text>
                </View>
              ) : (
                <View style={reduxDetailStyles.inMemoryChip}>
                  <Text style={reduxDetailStyles.inMemoryChipText}>
                    {t('redux.inMemory', 'In-Memory').toUpperCase()}
                  </Text>
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
              label={t('redux.sliceJson', 'Slice JSON')}
            />
          </View>

          {/* Sub Stats Row */}
          <View style={reduxDetailStyles.subStatsRow}>
            <View
              style={[
                reduxDetailStyles.statPill,
                {
                  backgroundColor: AppColors.indigo50,
                  borderColor: AppColors.indigo400,
                },
              ]}>
              <LayersIcon color={AppColors.indigo600Alt} size={11} />
              <Text
                style={[
                  reduxDetailStyles.statLabel,
                  {color: AppColors.indigo600Alt},
                ]}>
                {t('redux.keys', 'Keys')}:
              </Text>
              <Text
                style={[
                  reduxDetailStyles.statValue,
                  {color: AppColors.indigo600Alt},
                ]}>
                {fieldsCount}
              </Text>
            </View>
            <View
              style={[
                reduxDetailStyles.statPill,
                {
                  backgroundColor: AppColors.sky100,
                  borderColor: AppColors.sky400,
                },
              ]}>
              <Text
                style={[
                  reduxDetailStyles.statLabel,
                  {color: AppColors.sky600},
                ]}>
                {t('redux.size', 'Size')}:
              </Text>
              <Text
                style={[
                  reduxDetailStyles.statValue,
                  {color: AppColors.sky600},
                ]}>
                {getSize(sliceData)}
              </Text>
            </View>
            <View
              style={[
                reduxDetailStyles.statPill,
                {
                  backgroundColor: AppColors.purple100,
                  borderColor: AppColors.purple200,
                },
              ]}>
              <TimelineIcon color={AppColors.violet600} size={11} />
              <Text
                style={[
                  reduxDetailStyles.statLabel,
                  {color: AppColors.brandPurple},
                ]}>
                {t('redux.timeline', 'Timeline')}:
              </Text>
              <Text
                style={[
                  reduxDetailStyles.statValue,
                  {color: AppColors.brandPurple},
                ]}>
                {sliceActions.length}
              </Text>
            </View>
            {lastAction && (
              <View
                style={[
                  reduxDetailStyles.statPill,
                  {
                    backgroundColor: AppColors.amber100,
                    borderColor: AppColors.amber200,
                    flexShrink: 1,
                    maxWidth: 160,
                  },
                ]}>
                <BoltIcon color={AppColors.amber800Warm} size={11} />
                <Text
                  style={[
                    reduxDetailStyles.statLabel,
                    {color: AppColors.amber800Warm},
                  ]}>
                  {t('redux.last', 'Last')}:
                </Text>
                <Text
                  style={[
                    reduxDetailStyles.statValue,
                    {color: AppColors.amber800Warm, flexShrink: 1},
                  ]}
                  numberOfLines={1}>
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

        {/* Search Bar within slice (for Live, Timeline, Persisted) */}
        {sliceTab !== 'metadata' && (
          <View style={reduxDetailStyles.searchContainer}>
            <SearchIcon color={AppColors.grayTextWeak} size={14} />
            <TextInput
              placeholder={
                sliceTab === 'timeline'
                  ? 'Search action type, file, or payload...'
                  : 'Search keys or values...'
              }
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
            {filteredTimelineActions.length === 0 ? (
              <View style={reduxDetailStyles.emptyBox}>
                <TimelineIcon color={AppColors.grayTextWeak} size={28} />
                <Text style={reduxDetailStyles.emptyBoxText}>
                  {detailSearch.trim()
                    ? 'No actions matching your search query.'
                    : 'No dispatched actions recorded for this slice yet.'}
                </Text>
              </View>
            ) : (
              filteredTimelineActions.map((action, aIdx) => {
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
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 6,
                            flex: 1,
                            minWidth: 0,
                            flexWrap: 'wrap',
                          }}>
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
                              paddingHorizontal: 5,
                              paddingVertical: 2,
                              borderRadius: 4,
                              borderWidth: 1,
                              borderColor: originMeta.border,
                            }}>
                            {originMeta.renderIcon(originMeta.text, 8.5)}
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
                            marginTop: 6,
                            marginBottom: 2,
                            paddingHorizontal: 8,
                            paddingVertical: 4,
                            backgroundColor: AppColors.grayBackground,
                            borderRadius: 6,
                            borderWidth: 1,
                            borderColor: AppColors.dividerColor,
                          }}>
                          <View
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              gap: 5,
                              flex: 1,
                              minWidth: 0,
                            }}>
                            <DocIcon color={AppColors.sky600} size={10} />
                            <Text
                              style={{
                                fontFamily: AppFonts.interMedium,
                                fontSize: 9.5,
                                color: AppColors.grayTextWeak,
                              }}>
                              {t('redux.triggeredFrom', 'Triggered From:')}
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
                              paddingVertical: 2,
                              borderRadius: 4,
                            }}>
                            <ExternalLinkIcon
                              color={AppColors.sky600}
                              size={9}
                            />
                            <Text
                              style={{
                                fontFamily: AppFonts.interBold,
                                fontSize: 8.5,
                                color: AppColors.sky600,
                              }}>
                              {t('redux.openInEditor', 'Open in Editor')}
                            </Text>
                          </Pressable>
                        </View>
                      )}

                      {/* Expanded Payload, Diff Viewer & Call Stack */}
                      {isExpanded ? (
                        <View style={reduxDetailStyles.expandedContent}>
                          {/* Call Stack Trace Box */}
                          {action.stack ? (
                            <View style={{marginBottom: 12}}>
                              <Text
                                style={reduxDetailStyles.expandedSectionTitle}>
                                {t('redux.callStack', 'Call Stack Trace')}:
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
                                  .filter(
                                    l =>
                                      l.length > 0 &&
                                      !l.includes('reduxLogger') &&
                                      !l.includes('inspectorReduxMiddleware'),
                                  )
                                  .slice(0, 8)
                                  .map((frameLine, fIdx) => {
                                    const parsed = parseStackLine(
                                      frameLine,
                                      fIdx === 0,
                                    );
                                    const isApp = parsed.frameType === 'app';
                                    return (
                                      <Pressable
                                        key={fIdx}
                                        onPress={() => {
                                          if (parsed.fileName !== 'Unknown') {
                                            openInVSCode(
                                              parsed.fullPath ||
                                                parsed.fileName,
                                              parsed.lineNumber,
                                              parsed.columnNumber,
                                            );
                                          }
                                        }}
                                        style={{
                                          flexDirection: 'row',
                                          alignItems: 'center',
                                          justifyContent: 'space-between',
                                          paddingVertical: 3,
                                          borderBottomWidth: fIdx < 7 ? 0.5 : 0,
                                          borderBottomColor:
                                            AppColors.dividerColor,
                                        }}>
                                        <View style={{flex: 1, minWidth: 0}}>
                                          <Text
                                            style={{
                                              fontFamily: isApp
                                                ? AppFonts.interBold
                                                : AppFonts.interRegular,
                                              fontSize: 9.5,
                                              color: isApp
                                                ? AppColors.primaryBlack
                                                : AppColors.grayTextWeak,
                                            }}
                                            numberOfLines={1}>
                                            {parsed.functionName || 'anonymous'}
                                          </Text>
                                          <Text
                                            style={{
                                              fontFamily: AppFonts.interRegular,
                                              fontSize: 8.5,
                                              color: isApp
                                                ? AppColors.sky600
                                                : AppColors.grayTextWeak,
                                            }}
                                            numberOfLines={1}>
                                            {parsed.fileName}:
                                            {parsed.lineNumber || 1}:
                                            {parsed.columnNumber || 1}
                                          </Text>
                                        </View>
                                        {isApp && (
                                          <ExternalLinkIcon
                                            color={AppColors.sky600}
                                            size={10}
                                          />
                                        )}
                                      </Pressable>
                                    );
                                  })}
                              </View>
                            </View>
                          ) : null}

                          {action.payload !== undefined && (
                            <View style={{marginBottom: 12}}>
                              <Text
                                style={reduxDetailStyles.expandedSectionTitle}>
                                {t('redux.actionPayload', 'Action Payload:')}
                              </Text>
                              <JsonViewer
                                data={action.payload}
                                search={detailSearch}
                                forceOpen={true}
                                wrap={true}
                              />
                            </View>
                          )}

                          <Text style={reduxDetailStyles.expandedSectionTitle}>
                            {t(
                              'redux.stateChangesDiff',
                              'State Changes (Diff):',
                            )}
                          </Text>
                          <DiffViewer
                            oldData={
                              action.prevState?.[selectedReduxSlice] || {}
                            }
                            newData={
                              action.nextState?.[selectedReduxSlice] || {}
                            }
                            forceOpen={true}
                          />
                        </View>
                      ) : (
                        <View style={reduxDetailStyles.collapsedPrompt}>
                          <Text style={reduxDetailStyles.collapsedPromptText}>
                            {t(
                              'redux.tapToInspectAction',
                              'Tap to inspect action payload & diff changes',
                            )}
                          </Text>
                          <ForwardChevronIcon
                            color={AppColors.grayTextWeak}
                            size={12}
                          />
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
                  value: isPersisted
                    ? `Persisted (${getSize(persistedData)})`
                    : 'Not Persisted (In-Memory)',
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
                  <Text
                    style={reduxDetailStyles.metaValue}
                    selectable
                    numberOfLines={2}>
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
        ) : sliceTab === 'persisted' ? (
          <View style={{flex: 1, padding: 10}}>
            {isPersisted ? (
              <View style={{flex: 1}}>
                <View style={reduxDetailStyles.persistedInfoCard}>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 6,
                      }}>
                      <StorageIcon color={AppColors.emerald700} size={14} />
                      <Text style={reduxDetailStyles.persistedInfoTitle}>
                        Stored in persistent storage ({getSize(persistedData)})
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={reduxDetailStyles.clearPersistMiniBtn}
                      onPress={handleClearPersistence}>
                      <TrashIcon color={AppColors.errorColor} size={12} />
                      <Text style={reduxDetailStyles.clearPersistMiniText}>
                        Clear
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={{flex: 1, marginTop: 8}}>
                  <JsonViewer
                    data={persistedData}
                    search={detailSearch}
                    forceOpen={detailSearch.length > 0 ? true : undefined}
                    mode={viewMode}
                    onModeChange={setViewMode}
                    fullHeight={true}
                    wrap={true}
                  />
                </View>
              </View>
            ) : (
              <View style={reduxDetailStyles.emptyBox}>
                <StorageIcon color={AppColors.grayTextWeak} size={32} />
                <Text style={reduxDetailStyles.emptyBoxTitle}>
                  Not Persisted in Storage
                </Text>
                <Text style={reduxDetailStyles.emptyBoxText}>
                  This slice is not stored in AsyncStorage or redux-persist.
                  State exists purely in active JavaScript memory.
                </Text>
              </View>
            )}
          </View>
        ) : (
          /* Live State JsonViewer: Direct flex: 1 with fullHeight to prevent nested scroll conflicts */
          <View style={{flex: 1, padding: 10}}>
            <JsonViewer
              data={sliceData}
              search={detailSearch}
              forceOpen={detailSearch.length > 0 ? true : undefined}
              mode={viewMode}
              onModeChange={setViewMode}
              fullHeight={true}
              wrap={true}
            />
          </View>
        )}
      </View>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // ── 2. RENDER ACTION DETAIL VIEW (when an action is selected directly) ────
  // ══════════════════════════════════════════════════════════════════════════
  if (selectedReduxAction != null) {
    const originMeta = getOriginBadge(selectedReduxAction.originType);
    const callerBasename = selectedReduxAction.callerFile
      ? selectedReduxAction.callerFile.split('/').pop()
      : null;

    const actionTabs = [
      {
        key: 'payload',
        label: t('redux.payload', 'Payload'),
        icon: (isActive: boolean) => (
          <CodeBracketsIcon
            color={isActive ? AppColors.white : AppColors.grayText}
            size={12}
          />
        ),
      },
      {
        key: 'diff',
        label: t('redux.diff', 'State Diff'),
        icon: (isActive: boolean) => (
          <TimelineIcon
            color={isActive ? AppColors.white : AppColors.grayText}
            size={12}
          />
        ),
      },
      {
        key: 'stack',
        label: t('redux.callStack', 'Call Stack'),
        icon: (isActive: boolean) => (
          <DocIcon
            color={isActive ? AppColors.white : AppColors.grayText}
            size={12}
          />
        ),
      },
      {
        key: 'raw',
        label: 'Raw Action',
        icon: (isActive: boolean) => (
          <LiveStateIcon
            color={isActive ? AppColors.white : AppColors.grayText}
            size={12}
          />
        ),
      },
    ];

    return (
      <View style={{flex: 1, backgroundColor: AppColors.grayBackground}}>
        {/* Top Info Bar */}
        <View style={reduxDetailStyles.infoBar}>
          <View style={reduxDetailStyles.infoTopRow}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                flexWrap: 'wrap',
                flex: 1,
                minWidth: 0,
              }}>
              <View style={reduxDetailStyles.actionBadge}>
                <Text style={reduxDetailStyles.actionBadgeText}>
                  #{selectedReduxAction.id}
                </Text>
              </View>
              {/* Origin Badge */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 3,
                  backgroundColor: originMeta.bg,
                  paddingHorizontal: 5,
                  paddingVertical: 2,
                  borderRadius: 4,
                  borderWidth: 1,
                  borderColor: originMeta.border,
                }}>
                {originMeta.renderIcon(originMeta.text, 8.5)}
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
              <Text style={reduxDetailStyles.sliceNameText} numberOfLines={1}>
                {selectedReduxAction.type}
              </Text>
              {selectedReduxAction.timestamp && (
                <View style={reduxDetailStyles.timePill}>
                  <ClockIcon color={AppColors.purple} size={10} />
                  <Text style={reduxDetailStyles.timeText}>
                    {selectedReduxAction.timestamp}
                  </Text>
                </View>
              )}
            </View>

            {/* Copy Button */}
            <CopyButton value={() => selectedReduxAction} label="Copy Action" />
          </View>

          {/* Sub Stats Row */}
          <View style={reduxDetailStyles.subStatsRow}>
            {selectedReduxAction.affectedSlices &&
              selectedReduxAction.affectedSlices.length > 0 && (
                <View
                  style={[
                    reduxDetailStyles.statPill,
                    {
                      backgroundColor: AppColors.indigo50,
                      borderColor: AppColors.indigo400,
                    },
                  ]}>
                  <LayersIcon color={AppColors.indigo600Alt} size={11} />
                  <Text
                    style={[
                      reduxDetailStyles.statLabel,
                      {color: AppColors.indigo600Alt},
                    ]}>
                    Slices:
                  </Text>
                  <Text
                    style={[
                      reduxDetailStyles.statValue,
                      {color: AppColors.indigo600Alt},
                    ]}>
                    {selectedReduxAction.affectedSlices.join(', ')}
                  </Text>
                </View>
              )}
            <View
              style={[
                reduxDetailStyles.statPill,
                {
                  backgroundColor: AppColors.sky100,
                  borderColor: AppColors.sky400,
                },
              ]}>
              <Text
                style={[
                  reduxDetailStyles.statLabel,
                  {color: AppColors.sky600},
                ]}>
                Payload Size:
              </Text>
              <Text
                style={[
                  reduxDetailStyles.statValue,
                  {color: AppColors.sky600},
                ]}>
                {getSize(selectedReduxAction.payload)}
              </Text>
            </View>
          </View>

          {/* Triggered from caller preview row */}
          {selectedReduxAction.callerFile && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginTop: 8,
                paddingHorizontal: 8,
                paddingVertical: 4,
                backgroundColor: AppColors.grayBackground,
                borderRadius: 6,
                borderWidth: 1,
                borderColor: AppColors.dividerColor,
              }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 5,
                  flex: 1,
                  minWidth: 0,
                }}>
                <DocIcon color={AppColors.sky600} size={10} />
                <Text
                  style={{
                    fontFamily: AppFonts.interMedium,
                    fontSize: 9.5,
                    color: AppColors.grayTextWeak,
                  }}>
                  Triggered from:
                </Text>
                <Text
                  style={{
                    fontFamily: AppFonts.interBold,
                    fontSize: 9.5,
                    color: AppColors.sky600,
                  }}
                  numberOfLines={1}>
                  {callerBasename}:{selectedReduxAction.callerLine || 1}
                </Text>
              </View>

              <Pressable
                onPress={() =>
                  openInVSCode(
                    selectedReduxAction.callerFile!,
                    selectedReduxAction.callerLine,
                    selectedReduxAction.callerCol,
                  )
                }
                hitSlop={8}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 3,
                  backgroundColor: AppColors.sky100,
                  paddingHorizontal: 5,
                  paddingVertical: 2,
                  borderRadius: 4,
                }}>
                <ExternalLinkIcon color={AppColors.sky600} size={9} />
                <Text
                  style={{
                    fontFamily: AppFonts.interBold,
                    fontSize: 8.5,
                    color: AppColors.sky600,
                  }}>
                  Open in Editor
                </Text>
              </Pressable>
            </View>
          )}

          {/* Sub-Tabs */}
          <SegmentedTabs
            tabs={actionTabs}
            activeKey={actionTab}
            onChange={key => setActionTab(key as ActionDetailSubTab)}
            style={{marginTop: 10}}
          />
        </View>

        {/* Content Body */}
        {actionTab === 'payload' ? (
          <View style={{flex: 1, padding: 10}}>
            {selectedReduxAction.payload !== undefined ? (
              <JsonViewer
                data={selectedReduxAction.payload}
                search={detailSearch}
                forceOpen={true}
                fullHeight={true}
                wrap={true}
              />
            ) : (
              <View style={reduxDetailStyles.emptyBox}>
                <Text style={reduxDetailStyles.emptyBoxText}>
                  This action has no payload dispatched.
                </Text>
              </View>
            )}
          </View>
        ) : actionTab === 'diff' ? (
          <ScrollView
            style={{flex: 1}}
            contentContainerStyle={{padding: 12, paddingBottom: 40}}
            keyboardShouldPersistTaps="handled">
            <DiffViewer
              oldData={selectedReduxAction.prevState || {}}
              newData={selectedReduxAction.nextState || {}}
              forceOpen={true}
            />
          </ScrollView>
        ) : actionTab === 'stack' ? (
          <ScrollView
            style={{flex: 1}}
            contentContainerStyle={{padding: 12, paddingBottom: 40}}
            keyboardShouldPersistTaps="handled">
            {selectedReduxAction.stack ? (
              <View
                style={{
                  backgroundColor: AppColors.white,
                  borderRadius: 10,
                  padding: 10,
                  borderWidth: 1,
                  borderColor: AppColors.dividerColor,
                }}>
                <Text style={reduxDetailStyles.expandedSectionTitle}>
                  Dispatched from call stack:
                </Text>
                {selectedReduxAction.stack
                  .split('\n')
                  .map(l => l.trim())
                  .filter(
                    l =>
                      l.length > 0 &&
                      !l.includes('reduxLogger') &&
                      !l.includes('inspectorReduxMiddleware'),
                  )
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
                          paddingVertical: 5,
                          borderBottomWidth: 0.5,
                          borderBottomColor: AppColors.dividerColor,
                        }}>
                        <View style={{flex: 1, minWidth: 0}}>
                          <Text
                            style={{
                              fontFamily: isApp
                                ? AppFonts.interBold
                                : AppFonts.interRegular,
                              fontSize: 10.5,
                              color: isApp
                                ? AppColors.primaryBlack
                                : AppColors.grayTextWeak,
                            }}
                            numberOfLines={1}>
                            {parsed.functionName || 'anonymous'}
                          </Text>
                          <Text
                            style={{
                              fontFamily: AppFonts.interRegular,
                              fontSize: 9,
                              color: isApp
                                ? AppColors.sky600
                                : AppColors.grayTextWeak,
                            }}
                            numberOfLines={1}>
                            {parsed.fileName}:{parsed.lineNumber || 1}:
                            {parsed.columnNumber || 1}
                          </Text>
                        </View>
                        {isApp && (
                          <ExternalLinkIcon
                            color={AppColors.sky600}
                            size={11}
                          />
                        )}
                      </Pressable>
                    );
                  })}
              </View>
            ) : (
              <View style={reduxDetailStyles.emptyBox}>
                <Text style={reduxDetailStyles.emptyBoxText}>
                  No call stack trace captured for this action.
                </Text>
              </View>
            )}
          </ScrollView>
        ) : (
          <View style={{flex: 1, padding: 10}}>
            <JsonViewer
              data={selectedReduxAction}
              forceOpen={true}
              fullHeight={true}
              wrap={true}
            />
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={reduxDetailStyles.emptyBox}>
      <TerminalIcon color={AppColors.purple} size={32} />
      <Text style={reduxDetailStyles.emptyBoxTitle}>
        No Redux Slice Selected
      </Text>
      <Text style={reduxDetailStyles.emptyBoxText}>
        Select a slice from the Redux tab to inspect its state and dispatched
        actions.
      </Text>
    </View>
  );
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
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 5,
  },
  methodBadgeText: {
    fontFamily: AppFonts.interBold,
    fontSize: 9.5,
    color: AppColors.white,
    letterSpacing: 0.4,
  },
  sliceNameText: {
    fontFamily: AppFonts.interBold,
    fontSize: 14,
    color: AppColors.primaryBlack,
    flexShrink: 1,
  },
  persistedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3.5,
    backgroundColor: AppColors.mintGreenBg,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: AppColors.mintGreenBorder,
  },
  persistedChipText: {
    fontFamily: AppFonts.interBold,
    fontSize: 9,
    color: AppColors.mintGreenText,
  },
  inMemoryChip: {
    backgroundColor: AppColors.indigo50,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: AppColors.blueBorder,
  },
  inMemoryChipText: {
    fontFamily: AppFonts.interBold,
    fontSize: 9,
    color: AppColors.indigo600Alt,
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
    paddingHorizontal: 6,
    paddingVertical: 2.5,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: AppColors.dividerColor,
  },
  statPillText: {
    fontFamily: AppFonts.interMedium,
    fontSize: 10,
    color: AppColors.grayText,
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
    shadowColor: AppColors.primaryBlack,
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  timelineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionBadge: {
    backgroundColor: AppColors.indigo50,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: AppColors.blueBorder,
  },
  actionBadgeText: {
    fontFamily: AppFonts.interBold,
    fontSize: 9.5,
    color: AppColors.indigo600Alt,
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
    marginBottom: 6,
  },
  metadataCard: {
    backgroundColor: AppColors.white,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: AppColors.dividerColor,
    shadowColor: AppColors.primaryBlack,
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
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
  persistedInfoCard: {
    backgroundColor: AppColors.mintGreenBg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: AppColors.mintGreenBorder,
    padding: 10,
  },
  persistedInfoTitle: {
    fontFamily: AppFonts.interBold,
    fontSize: 11,
    color: AppColors.mintGreenText,
  },
  clearPersistMiniBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: AppColors.errorCardBg,
    paddingHorizontal: 6,
    paddingVertical: 2.5,
    borderRadius: 4,
  },
  clearPersistMiniText: {
    fontFamily: AppFonts.interBold,
    fontSize: 9.5,
    color: AppColors.errorColor,
  },
  clearPersistBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: AppColors.errorCardBg,
    borderWidth: 1,
    borderColor: AppColors.errorBorder,
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
    margin: 12,
    gap: 8,
  },
  emptyBoxTitle: {
    fontFamily: AppFonts.interBold,
    fontSize: 14,
    color: AppColors.primaryBlack,
  },
  emptyBoxText: {
    fontFamily: AppFonts.interMedium,
    fontSize: 12,
    color: AppColors.grayTextWeak,
    textAlign: 'center',
    lineHeight: 18,
  },
  highlight: {
    backgroundColor: AppColors.yellowHighlight,
    color: AppColors.amber800Warm,
    fontFamily: AppFonts.interBold,
  },
});

export default ReduxDetail;
