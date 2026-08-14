import React, {useEffect, useState, useMemo} from 'react';
import {
  LayoutAnimation,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  UIManager,
  View,
  ScrollView,
  ToastAndroid,
  Alert,
} from 'react-native';
import {AppColors} from '../styles/AppColors';
import {AppFonts} from '../styles/AppFonts';
import {
  ChevronIcon,
  FolderIcon,
  TrashIcon,
  HeaderPauseIcon,
  CopyIcon,
  SearchIcon,
  ClearIcon,
  ClockIcon,
  ExpandCollapseIcon,
  SignalIcon,
  LayersIcon,
  TerminalIcon,
  RequestIcon,
  DiffIcon,
  SortIcon,
  CalendarIcon,
} from './NetworkIcons';
import JsonViewer from './JsonViewer';
import DiffViewer from './DiffViewer';
import TouchableScale from './TouchableScale';
import SegmentedTabs from './SegmentedTabs';
import CopyButton from './CopyButton';
import {copyToClipboard, getSize} from '../helpers';
import {getCustomStorage} from '../helpers/settingsStore';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

const animateLayout = () => {
  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
};

// Chevron pointing left (for back buttons)
const BackChevronIcon = ({color = AppColors.purple, size = 12}: {color?: string; size?: number}) => (
  <View style={{transform: [{rotate: '180deg'}], marginRight: 4}}>
    <ChevronIcon color={color} size={size} />
  </View>
);

// Chevron pointing right (for list items)
const ForwardChevronIcon = ({color = AppColors.grayTextWeak, size = 12}: {color?: string; size?: number}) => (
  <View style={{transform: [{rotate: '0deg'}], marginLeft: 'auto'}}>
    <ChevronIcon color={color} size={size} />
  </View>
);

// Helper: check if a value recursively contains a string term
const valueContainsTerm = (val: any, term: string): boolean => {
  if (!term) return true;
  const t = term.toLowerCase();
  if (val === null || val === undefined) return false;
  if (typeof val !== 'object') {
    return String(val).toLowerCase().includes(t);
  }
  if (Array.isArray(val)) {
    return val.some(item => valueContainsTerm(item, term));
  }
  return Object.keys(val).some(key =>
    key.toLowerCase().includes(t) || valueContainsTerm(val[key], term)
  );
};

export const ReduxTreeView = React.memo(({
  state,
  actionHistory = [],
  lastActionMap = {},
  search = '',
  onSearchChange,
  autoRefresh = true,
  onToggleAutoRefresh,
  onClearHistory,
  onDetailOpenChange,
  selectedSliceKey = null,
  onSelectSliceKey,
  selectedActionId = null,
  onSelectActionId,
}: {
  state: any;
  actionHistory?: any[];
  lastActionMap?: Record<string, any>;
  search?: string;
  onSearchChange?: (val: string) => void;
  autoRefresh?: boolean;
  onToggleAutoRefresh?: () => void;
  onClearHistory?: () => void;
  onDetailOpenChange?: (isOpen: boolean) => void;
  selectedSliceKey?: string | null;
  onSelectSliceKey?: (key: string | null) => void;
  selectedActionId?: number | null;
  onSelectActionId?: (id: number | null) => void;
}) => {
  const [activeTab, setActiveTab] = useState<'state' | 'timeline'>('state');
  const [actionSubTab, setActionSubTab] = useState<'payload' | 'diff' | 'state' | 'metadata'>('payload');

  // local fallbacks if props are not provided
  const [localSliceKey, setLocalSliceKey] = useState<string | null>(null);
  const [localActionId, setLocalActionId] = useState<number | null>(null);

  const activeSliceKey = onSelectSliceKey ? selectedSliceKey : localSliceKey;
  const activeActionId = onSelectActionId ? selectedActionId : localActionId;

  const setActiveSliceKey = (key: string | null) => {
    if (onSelectSliceKey) onSelectSliceKey(key);
    else setLocalSliceKey(key);
  };

  const setActiveActionId = (id: number | null) => {
    if (onSelectActionId) onSelectActionId(id);
    else setLocalActionId(id);
  };

  // Expand / collapse all states for detail views
  const [sliceForceOpen, setSliceForceOpen] = useState<boolean | undefined>(undefined);
  const [actionForceOpen, setActionForceOpen] = useState<boolean | undefined>(undefined);

  const [searchModeType, setSearchModeType] = useState<boolean>(true);
  const [searchModeData, setSearchModeData] = useState<boolean>(true);

  // Sorting directions
  const [stateSortAsc, setStateSortAsc] = useState<boolean>(true);
  const [actionSortAsc, setActionSortAsc] = useState<boolean>(false);

  // Persistence-related states for State Slice details
  const [sliceDetailTab, setSliceDetailTab] = useState<'live' | 'persisted' | 'metadata'>('live');
  const [isPersisted, setIsPersisted] = useState<boolean>(false);
  const [persistedData, setPersistedData] = useState<any>(null);

  useEffect(() => {
    if (activeSliceKey === null) {
      setIsPersisted(false);
      setPersistedData(null);
      setSliceDetailTab('live');
      return;
    }

    async function checkPersistence() {
      try {
        const storage = getCustomStorage();
        if (!storage) {
          setIsPersisted(false);
          setPersistedData(null);
          return;
        }

        // Check direct key: persist:sliceKey
        let raw = await storage.getItem(`persist:${activeSliceKey}`);
        if (raw) {
          try {
            setPersistedData(JSON.parse(raw));
          } catch {
            setPersistedData(raw);
          }
          setIsPersisted(true);
          return;
        }

        // Check root key: persist:root
        let rootRaw = await storage.getItem('persist:root');
        if (rootRaw) {
          const parsedRoot = JSON.parse(rootRaw);
          if (parsedRoot && parsedRoot[activeSliceKey] !== undefined) {
            const nested = parsedRoot[activeSliceKey];
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
        console.log('Error checking Redux persistence:', e);
      }
      setIsPersisted(false);
      setPersistedData(null);
    }

    checkPersistence();
  }, [activeSliceKey]);

  const handleClearPersistence = () => {
    Alert.alert(
      'Clear Persisted State',
      `Are you sure you want to delete the persisted storage item for the slice "${activeSliceKey}"? This will clear the value from device storage, but the current active in-memory Redux state will remain unchanged until the next app reload.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const storage = getCustomStorage();
              if (!storage) return;

              // Delete direct key
              if (typeof (storage as any).removeItem === 'function') {
                await (storage as any).removeItem(`persist:${activeSliceKey}`);
              } else {
                await storage.setItem(`persist:${activeSliceKey}`, '');
              }

              // Delete from root key
              let rootRaw = await storage.getItem('persist:root');
              if (rootRaw) {
                const parsed = JSON.parse(rootRaw);
                if (parsed && parsed[activeSliceKey] !== undefined) {
                  delete parsed[activeSliceKey];
                  await storage.setItem('persist:root', JSON.stringify(parsed));
                }
              }

              setIsPersisted(false);
              setPersistedData(null);
              setSliceDetailTab('live');
              
              if (Platform.OS === 'android') {
                ToastAndroid.show('Persisted state cleared', ToastAndroid.SHORT);
              } else {
                Alert.alert('Cleared', 'Persisted state has been cleared from device storage.');
              }
            } catch (err) {
              Alert.alert('Error', 'Failed to clear persisted state.');
            }
          }
        }
      ]
    );
  };

  const isSearching = search.trim().length > 0;

  useEffect(() => {
    onDetailOpenChange?.(activeSliceKey !== null || activeActionId !== null);
    return () => {
      onDetailOpenChange?.(false);
    };
  }, [activeSliceKey, activeActionId, onDetailOpenChange]);

  // Reset details view when tab changes
  const switchTab = (tab: 'state' | 'timeline') => {
    animateLayout();
    setActiveTab(tab);
    setActiveSliceKey(null);
    setActiveActionId(null);
    setSliceForceOpen(undefined);
    setActionForceOpen(undefined);
  };

  const handleGoBackSlice = () => {
    animateLayout();
    setActiveSliceKey(null);
    setSliceForceOpen(undefined);
  };

  const handleGoBackAction = () => {
    animateLayout();
    setActiveActionId(null);
    setActionForceOpen(undefined);
  };

  // Filtered state keys based on search query
  const filteredStateKeys = useMemo(() => {
    if (!state || typeof state !== 'object') return [];
    const keys = Object.keys(state);
    let result = keys;
    if (isSearching) {
      result = keys.filter(key => {
        const typeMatch = searchModeType && key.toLowerCase().includes(search.toLowerCase());
        const dataMatch = searchModeData && valueContainsTerm(state[key], search);
        return typeMatch || dataMatch;
      });
    }
    return [...result].sort((a, b) => {
      const comparison = a.localeCompare(b);
      return stateSortAsc ? comparison : -comparison;
    });
  }, [state, search, isSearching, searchModeType, searchModeData, stateSortAsc]);

  // Filtered action history based on search query
  const filteredActionHistory = useMemo(() => {
    if (!actionHistory) return [];
    let result = actionHistory;
    if (isSearching) {
      result = actionHistory.filter(action => {
        const typeMatch = searchModeType && action.type.toLowerCase().includes(search.toLowerCase());
        const payloadMatch = searchModeData && action.payload && valueContainsTerm(action.payload, search);
        return typeMatch || payloadMatch;
      });
    }
    return [...result].sort((a, b) => {
      const comparison = a.id - b.id;
      return actionSortAsc ? comparison : -comparison;
    });
  }, [actionHistory, search, isSearching, searchModeType, searchModeData, actionSortAsc]);

  // Find currently selected action object
  const selectedAction = useMemo(() => {
    if (activeActionId === null) return null;
    return actionHistory.find(a => a.id === activeActionId) || null;
  }, [activeActionId, actionHistory]);

  if (!state || typeof state !== 'object') {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>No connected Redux store state found.</Text>
      </View>
    );
  }

  // ── Render Detail View: State Slice ──
  if (activeTab === 'state' && activeSliceKey !== null) {
    const sliceData = state[activeSliceKey];
    const fieldsCount =
      typeof sliceData === 'object' && sliceData !== null
        ? Object.keys(sliceData).length
        : 1;

    const sliceTabs = [
      {key: 'live', label: 'Live State'},
      ...(isPersisted
        ? [{key: 'persisted', label: `Persisted (${getSize(persistedData)})`}]
        : []),
      {key: 'metadata', label: 'Metadata'},
    ];

    return (
      <View style={{flex: 1}}>
        {/* Detail info header bar */}
        <View style={styles.apiLikeInfoBar}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 8,
            }}>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap'}}>
              <View style={[styles.apiMethodBadge, {backgroundColor: AppColors.purple}]}>
                <Text style={styles.apiMethodBadgeText}>REDUX</Text>
              </View>
              <View
                style={[
                  styles.apiMethodBadge,
                  {
                    backgroundColor: `${AppColors.brandPurple}18`,
                    borderWidth: 1,
                    borderColor: `${AppColors.brandPurple}40`,
                  },
                ]}>
                <Text style={[styles.apiMethodBadgeText, {color: AppColors.brandPurple}]}>
                  SLICE
                </Text>
              </View>
              {isPersisted && (
                <View style={[styles.apiMethodBadge, {backgroundColor: AppColors.emerald500}]}>
                  <Text style={styles.apiMethodBadgeText}>PERSISTED</Text>
                </View>
              )}
              <View style={styles.apiChip}>
                <Text style={styles.apiChipText}>{getSize(sliceData)}</Text>
              </View>
              <View style={styles.apiChip}>
                <Text style={styles.apiChipText}>
                  {fieldsCount} {fieldsCount === 1 ? 'field' : 'fields'}
                </Text>
              </View>
            </View>

            <CopyButton
              value={JSON.stringify(sliceDetailTab === 'live' ? sliceData : persistedData, null, 2)}
              label={`Slice '${activeSliceKey}'`}
            />
          </View>

          <Text style={styles.apiTitleText} selectable={true}>
            {activeSliceKey}
          </Text>

          <View style={styles.apiMetaRow}>
            <ClockIcon color={AppColors.grayTextWeak} size={11} />
            <Text style={styles.apiMetaText}>
              Last updated: {lastActionMap[activeSliceKey] ? lastActionMap[activeSliceKey].timestamp : 'Initial'}
            </Text>
          </View>
        </View>

        {/* Back button row + sub-tabs */}
        <View style={{paddingHorizontal: 12, paddingTop: 8, paddingBottom: 4}}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 8,
            }}>
            <TouchableScale onPress={handleGoBackSlice} style={styles.backBtn} hitSlop={12}>
              <BackChevronIcon color={AppColors.purple} size={12} />
              <Text style={styles.backBtnText}>State Slices</Text>
            </TouchableScale>

            {isPersisted && sliceDetailTab === 'persisted' && (
              <TouchableScale
                onPress={handleClearPersistence}
                style={[styles.detailHeaderBtn, {borderColor: `${AppColors.errorColor}40`}]}
                hitSlop={8}>
                <TrashIcon color={AppColors.errorColor} size={14} />
              </TouchableScale>
            )}
          </View>

          <SegmentedTabs
            tabs={sliceTabs}
            activeKey={sliceDetailTab}
            onChange={key => {
              animateLayout();
              setSliceDetailTab(key as 'live' | 'persisted' | 'metadata');
            }}
          />
        </View>

        {/* Search row (for live/persisted tabs) */}
        {sliceDetailTab !== 'metadata' && (
          <View style={{paddingHorizontal: 12, paddingTop: 4, paddingBottom: 4}}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: AppColors.purpleShade50,
                borderRadius: 8,
                paddingHorizontal: 10,
                borderWidth: 1,
                borderColor: AppColors.dividerColor,
                height: 36,
              }}>
              <SearchIcon color={AppColors.grayTextWeak} size={15} />
              <TextInput
                placeholder="Search in slice keys or values..."
                placeholderTextColor={AppColors.grayTextWeak}
                value={search}
                onChangeText={onSearchChange}
                style={{
                  flex: 1,
                  fontFamily: AppFonts.interRegular,
                  fontSize: 12,
                  color: AppColors.grayTextStrong,
                  paddingHorizontal: 8,
                  paddingVertical: 0,
                }}
                autoCorrect={false}
                autoCapitalize="none"
              />
              {search.length > 0 && (
                <Pressable onPress={() => onSearchChange?.('')} hitSlop={10}>
                  <ClearIcon color={AppColors.grayTextWeak} size={13} />
                </Pressable>
              )}
            </View>
          </View>
        )}

        {/* Scrollable Tab Content */}
        <ScrollView
          style={{flex: 1}}
          contentContainerStyle={{paddingHorizontal: 12, paddingTop: 6, paddingBottom: 28, flexGrow: 1}}
          showsVerticalScrollIndicator={true}
          keyboardShouldPersistTaps="handled">
          {sliceDetailTab === 'metadata' ? (
            <View
              style={{
                backgroundColor: AppColors.primaryLight,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: AppColors.dividerColor,
                overflow: 'hidden',
                paddingHorizontal: 12,
                paddingVertical: 4,
              }}>
              {[
                {label: 'Slice Name', value: activeSliceKey},
                {label: 'Fields Count', value: `${fieldsCount} root keys`},
                {label: 'State Size', value: getSize(sliceData)},
                {
                  label: 'Persistence',
                  value: isPersisted ? `Persisted (${getSize(persistedData)})` : 'Not Persisted',
                },
                {
                  label: 'Last Dispatched Action',
                  value: lastActionMap[activeSliceKey] ? lastActionMap[activeSliceKey].type : 'None',
                },
                {
                  label: 'Last Updated At',
                  value: lastActionMap[activeSliceKey] ? lastActionMap[activeSliceKey].timestamp : 'Initial',
                },
              ].map((row, rIdx) => (
                <View
                  key={rIdx}
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingVertical: 9,
                    borderBottomWidth: rIdx < 5 ? 1 : 0,
                    borderBottomColor: AppColors.grayBorderSecondary,
                  }}>
                  <Text style={{fontFamily: AppFonts.interMedium, fontSize: 11.5, color: AppColors.grayTextWeak}}>
                    {row.label}
                  </Text>
                  <Text
                    selectable
                    style={{
                      fontFamily: AppFonts.interBold,
                      fontSize: 11.5,
                      color: AppColors.primaryBlack,
                      maxWidth: '60%',
                      textAlign: 'right',
                    }}>
                    {row.value}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <JsonViewer
              data={sliceDetailTab === 'live' ? sliceData : (persistedData ?? 'No persisted data')}
              search={search}
              forceOpen={sliceForceOpen !== undefined ? sliceForceOpen : (isSearching ? true : undefined)}
              fullHeight={true}
            />
          )}
        </ScrollView>
      </View>
    );
  }

  // ── Render Detail View: Timeline Action ──
  if (activeTab === 'timeline' && selectedAction !== null) {
    const affectedSlices = selectedAction.affectedSlices || [];

    const actionTabs = [
      {key: 'payload', label: 'Payload'},
      {key: 'diff', label: 'Diff Changes'},
      {key: 'state', label: 'Snapshot'},
      {key: 'metadata', label: 'Metadata'},
    ];

    return (
      <View style={{flex: 1}}>
        {/* Detail info header bar */}
        <View style={styles.apiLikeInfoBar}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 8,
            }}>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap'}}>
              <View style={[styles.apiMethodBadge, {backgroundColor: AppColors.purple}]}>
                <Text style={styles.apiMethodBadgeText}>REDUX</Text>
              </View>
              <View style={[styles.apiMethodBadge, {backgroundColor: AppColors.amber500}]}>
                <Text style={styles.apiMethodBadgeText}>ACTION</Text>
              </View>
              <View style={styles.apiChip}>
                <Text style={styles.apiChipText}>#{selectedAction.id}</Text>
              </View>
              <View style={styles.apiChip}>
                <Text style={styles.apiChipText}>{getSize(selectedAction.payload)}</Text>
              </View>
            </View>

            <CopyButton
              value={JSON.stringify(
                actionSubTab === 'payload'
                  ? selectedAction.payload
                  : actionSubTab === 'diff'
                  ? {prev: selectedAction.prevState, next: selectedAction.nextState}
                  : selectedAction.nextState,
                null,
                2,
              )}
              label={actionSubTab === 'payload' ? 'Action Payload' : 'State Snapshot'}
            />
          </View>

          <Text style={styles.apiTitleText} selectable={true}>
            {selectedAction.type}
          </Text>

          <View style={styles.apiMetaRow}>
            <ClockIcon color={AppColors.grayTextWeak} size={11} />
            <Text style={styles.apiMetaText}>
              Dispatched: {selectedAction.timestamp}
            </Text>
          </View>

          {/* Affected Slices Tags list */}
          {affectedSlices.length > 0 && (
            <View style={[styles.detailAffectedTags, {marginTop: 6, paddingHorizontal: 0, paddingBottom: 0}]}>
              <Text style={styles.affectedTagsLabel}>AFFECTED SLICES:</Text>
              <View style={styles.detailTagsList}>
                {affectedSlices.map(slice => (
                  <View key={slice} style={styles.sliceTag}>
                    <Text style={styles.sliceTagText}>{slice}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* Back button row + sub-tabs */}
        <View style={{paddingHorizontal: 12, paddingTop: 8, paddingBottom: 4}}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 8,
            }}>
            <TouchableScale onPress={handleGoBackAction} style={styles.backBtn} hitSlop={12}>
              <BackChevronIcon color={AppColors.purple} size={12} />
              <Text style={styles.backBtnText}>Actions Timeline</Text>
            </TouchableScale>
          </View>

          <SegmentedTabs
            tabs={actionTabs}
            activeKey={actionSubTab}
            onChange={key => {
              animateLayout();
              setActionSubTab(key as 'payload' | 'diff' | 'state' | 'metadata');
            }}
          />
        </View>

        {/* Scrollable Tab Content */}
        <ScrollView
          style={{flex: 1}}
          contentContainerStyle={{paddingHorizontal: 12, paddingTop: 6, paddingBottom: 28, flexGrow: 1}}
          showsVerticalScrollIndicator={true}
          keyboardShouldPersistTaps="handled">
          {actionSubTab === 'payload' && (
            <JsonViewer
              data={selectedAction.payload ?? 'No payload data'}
              wrap
              forceOpen={actionForceOpen !== undefined ? actionForceOpen : undefined}
              fullHeight={true}
            />
          )}

          {actionSubTab === 'diff' && (
            <DiffViewer oldData={selectedAction.prevState} newData={selectedAction.nextState} />
          )}

          {actionSubTab === 'state' && (
            <JsonViewer
              data={selectedAction.nextState}
              wrap
              forceOpen={actionForceOpen !== undefined ? actionForceOpen : undefined}
              fullHeight={true}
            />
          )}

          {actionSubTab === 'metadata' && (
            <View
              style={{
                backgroundColor: AppColors.primaryLight,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: AppColors.dividerColor,
                overflow: 'hidden',
                paddingHorizontal: 12,
                paddingVertical: 4,
              }}>
              {[
                {label: 'Action Type', value: selectedAction.type},
                {label: 'Action ID', value: `#${selectedAction.id}`},
                {label: 'Dispatched At', value: selectedAction.timestamp},
                {label: 'Payload Size', value: getSize(selectedAction.payload)},
                {label: 'Snapshot Size', value: getSize(selectedAction.nextState)},
                {
                  label: 'Affected Slices',
                  value: affectedSlices.length > 0 ? affectedSlices.join(', ') : 'None',
                },
              ].map((row, rIdx) => (
                <View
                  key={rIdx}
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingVertical: 9,
                    borderBottomWidth: rIdx < 5 ? 1 : 0,
                    borderBottomColor: AppColors.grayBorderSecondary,
                  }}>
                  <Text style={{fontFamily: AppFonts.interMedium, fontSize: 11.5, color: AppColors.grayTextWeak}}>
                    {row.label}
                  </Text>
                  <Text
                    selectable
                    style={{
                      fontFamily: AppFonts.interBold,
                      fontSize: 11.5,
                      color: AppColors.primaryBlack,
                      maxWidth: '60%',
                      textAlign: 'right',
                    }}>
                    {row.value}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </View>
    );
  }

  // ── Render List Views (Default) ──
  return (
    <View style={styles.container}>
      {/* ── Control Bar ── */}
      <View style={styles.toolbar}>
        <View style={styles.statusSection}>
          <View style={[styles.statusBadge, autoRefresh ? styles.statusBadgeActive : styles.statusBadgePaused]}>
            <View style={[styles.statusDot, autoRefresh ? styles.statusDotActive : styles.statusDotPaused]} />
            <Text style={[styles.statusBadgeText, autoRefresh ? styles.statusTextActive : styles.statusTextPaused]}>
              {autoRefresh ? 'LIVE' : 'PAUSED'}
            </Text>
          </View>
        </View>

        <View style={styles.toolbarActions}>
          {/* Sorting Toggle Button */}
          <TouchableScale
            onPress={() => {
              animateLayout();
              if (activeTab === 'state') {
                setStateSortAsc(prev => !prev);
              } else {
                setActionSortAsc(prev => !prev);
              }
            }}
            style={styles.iconBtn}
            hitSlop={8}>
            <SortIcon
              ascending={activeTab === 'state' ? stateSortAsc : actionSortAsc}
              color={AppColors.purple}
              size={15}
            />
          </TouchableScale>

          {onToggleAutoRefresh && (
            <TouchableScale
              onPress={onToggleAutoRefresh}
              style={styles.iconBtn}
              hitSlop={8}>
              <HeaderPauseIcon isPaused={!autoRefresh} color={AppColors.purple} size={15} />
            </TouchableScale>
          )}
          {onClearHistory && (
            <TouchableScale
              onPress={onClearHistory}
              style={[styles.iconBtn, {borderColor: AppColors.errorColor + '40', backgroundColor: AppColors.errorColor + '08'}]}
              hitSlop={8}>
              <TrashIcon color={AppColors.errorColor} size={15} />
            </TouchableScale>
          )}
        </View>
      </View>

      {/* ── Search Bar ── */}
      {onSearchChange && (
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <SearchIcon color={AppColors.grayTextWeak} size={14} />
            <TextInput
              placeholder="Search keys, values, or action payloads..."
              placeholderTextColor={AppColors.grayTextWeak}
              value={search}
              onChangeText={onSearchChange}
              style={styles.searchInput}
              autoCorrect={false}
              autoCapitalize="none"
            />
            {search.length > 0 && (
              <TouchableScale onPress={() => onSearchChange('')} hitSlop={10}>
                <ClearIcon color={AppColors.grayTextWeak} size={14} />
              </TouchableScale>
            )}
          </View>
          <View style={styles.filterChipRow}>
            <Text style={styles.filterChipLabel}>FILTER BY:</Text>
            <Pressable
              onPress={() => {
                animateLayout();
                if (searchModeType && !searchModeData) return; // Prevent disabling both
                setSearchModeType(!searchModeType);
              }}
              style={[styles.filterChip, searchModeType && styles.filterChipActive]}>
              <View style={{flexDirection: 'row', alignItems: 'center', gap: 4}}>
                <SignalIcon color={searchModeType ? AppColors.purple : AppColors.grayText} size={11} />
                <Text style={[styles.filterChipText, searchModeType && styles.filterChipTextActive]}>
                  Type / Key
                </Text>
              </View>
            </Pressable>
            <Pressable
              onPress={() => {
                animateLayout();
                if (!searchModeType && searchModeData) return; // Prevent disabling both
                setSearchModeData(!searchModeData);
              }}
              style={[styles.filterChip, searchModeData && styles.filterChipActive]}>
              <View style={{flexDirection: 'row', alignItems: 'center', gap: 4}}>
                <LayersIcon color={searchModeData ? AppColors.purple : AppColors.grayText} size={11} />
                <Text style={[styles.filterChipText, searchModeData && styles.filterChipTextActive]}>
                  Payload Data
                </Text>
              </View>
            </Pressable>
          </View>
        </View>
      )}

      {/* ── Tab Selector ── */}
      <View style={styles.tabContainer}>
        <Pressable
          style={[styles.tabButton, activeTab === 'state' && styles.tabButtonActive]}
          onPress={() => switchTab('state')}>
          <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
            <LayersIcon color={activeTab === 'state' ? AppColors.purple : AppColors.grayText} size={12} />
            <Text style={[styles.tabButtonText, activeTab === 'state' && styles.tabButtonTextActive]}>
              State Slices ({filteredStateKeys.length})
            </Text>
          </View>
        </Pressable>
        <Pressable
          style={[styles.tabButton, activeTab === 'timeline' && styles.tabButtonActive]}
          onPress={() => switchTab('timeline')}>
          <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
            <TerminalIcon color={activeTab === 'timeline' ? AppColors.purple : AppColors.grayText} size={12} />
            <Text style={[styles.tabButtonText, activeTab === 'timeline' && styles.tabButtonTextActive]}>
              Actions ({filteredActionHistory.length})
            </Text>
          </View>
        </Pressable>
      </View>

      {/* ── State List View ── */}
      {activeTab === 'state' && (
        <ScrollView style={styles.scrollList} contentContainerStyle={styles.scrollContent}>
          {filteredStateKeys.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                {isSearching ? 'No store slices match your search.' : 'Redux store contains no state.'}
              </Text>
            </View>
          ) : (
            filteredStateKeys.map(reducerKey => {
              const sliceData = state[reducerKey];
              const fieldsCount =
                typeof sliceData === 'object' && sliceData !== null
                  ? Object.keys(sliceData).length
                  : 1;

              const lastAction = lastActionMap[reducerKey];
              const lastUpdatedTime = lastAction ? lastAction.timestamp : 'Initial';

              return (
                <TouchableScale
                  key={reducerKey}
                  onPress={() => {
                    animateLayout();
                    setActiveSliceKey(reducerKey);
                  }}
                  style={styles.listRow}>
                  <View style={styles.sliceIcon}>
                    <FolderIcon color={AppColors.purple} size={11} />
                  </View>
                  <View style={styles.rowMain}>
                    <Text style={styles.rowTitle}>{reducerKey}</Text>
                    <Text style={styles.rowSub}>
                      {getSize(sliceData)} • {fieldsCount} {fieldsCount === 1 ? 'field' : 'fields'} • Updated: {lastUpdatedTime}
                    </Text>
                  </View>
                  <ForwardChevronIcon color={AppColors.grayTextWeak} size={10} />
                </TouchableScale>
              );
            })
          )}
        </ScrollView>
      )}

      {/* ── Timeline List View ── */}
      {activeTab === 'timeline' && (
        <ScrollView style={styles.scrollList} contentContainerStyle={styles.scrollContent}>
          {filteredActionHistory.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                {isSearching
                  ? 'No actions match your search.'
                  : 'No actions dispatched yet. Trigger an action in the app to populate history.'}
              </Text>
            </View>
          ) : (
            filteredActionHistory.map(action => {
              const id = action.id;
              const affectedSlices = action.affectedSlices || [];

              return (
                <TouchableScale
                  key={id}
                  onPress={() => {
                    animateLayout();
                    setActiveActionId(id);
                  }}
                  style={styles.listRow}>
                  <View style={styles.seqBadge}>
                    <Text style={styles.seqText}>#{action.id}</Text>
                  </View>
                  <View style={styles.rowMain}>
                    <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
                      <TerminalIcon color={AppColors.purple} size={11} />
                      <Text style={styles.actionTitleText} numberOfLines={1}>{action.type}</Text>
                    </View>
                    <View style={styles.actionMetaRow}>
                      <ClockIcon color={AppColors.grayTextWeak} size={9} />
                      <Text style={styles.actionTimeText}>{action.timestamp} • {getSize(action.payload)}</Text>
                    </View>
                    {affectedSlices.length > 0 && (
                      <View style={styles.tagsContainer}>
                        {affectedSlices.map(slice => (
                          <View key={slice} style={styles.sliceTagMini}>
                            <Text style={styles.sliceTagMiniText}>{slice}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                  <ForwardChevronIcon color={AppColors.grayTextWeak} size={10} />
                </TouchableScale>
              );
            })
          )}
        </ScrollView>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.grayBackground,
  },
  scrollList: {
    flex: 1,
  },
  errorContainer: {
    padding: 24,
    alignItems: 'center',
  },
  errorText: {
    fontFamily: AppFonts.interRegular,
    fontSize: 12,
    color: AppColors.grayTextWeak,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: AppColors.primaryLight,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.dividerColor,
  },
  statusSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusBadgeActive: {
    backgroundColor: AppColors.greenStatus,
    borderColor: AppColors.greenColor + '30',
  },
  statusBadgePaused: {
    backgroundColor: AppColors.grayBackground,
    borderColor: AppColors.grayBorderSecondary,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusDotActive: {
    backgroundColor: AppColors.greenBaggageText,
  },
  statusDotPaused: {
    backgroundColor: AppColors.grayTextWeak,
  },
  statusBadgeText: {
    fontFamily: AppFonts.interBold,
    fontSize: 9,
    letterSpacing: 0.5,
  },
  statusTextActive: {
    color: AppColors.greenBaggageText,
  },
  statusTextPaused: {
    color: AppColors.grayText,
  },
  toolbarActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: AppColors.purple + '40',
    backgroundColor: AppColors.purpleShade50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    backgroundColor: AppColors.primaryLight,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.dividerColor,
    paddingBottom: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.grayBackground,
    borderRadius: 8,
    marginHorizontal: 12,
    marginTop: 10,
    marginBottom: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: AppColors.dividerColor,
    height: 36,
  },
  filterChipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 8,
  },
  filterChipLabel: {
    fontFamily: AppFonts.interBold,
    fontSize: 9,
    color: AppColors.grayTextWeak,
    letterSpacing: 0.5,
    marginRight: 2,
  },
  filterChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: AppColors.grayBackground,
    borderWidth: 1,
    borderColor: AppColors.grayBorderSecondary,
  },
  filterChipActive: {
    backgroundColor: AppColors.purpleShade50,
    borderColor: AppColors.purple,
  },
  filterChipText: {
    fontFamily: AppFonts.interMedium,
    fontSize: 10,
    color: AppColors.grayText,
  },
  filterChipTextActive: {
    color: AppColors.purple,
    fontFamily: AppFonts.interBold,
  },
  searchInput: {
    flex: 1,
    fontFamily: AppFonts.interRegular,
    fontSize: 12,
    color: AppColors.grayTextStrong,
    marginLeft: 6,
    padding: 0,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: AppColors.dividerColor,
    borderRadius: 8,
    padding: 3,
    marginHorizontal: 12,
    marginTop: 10,
    marginBottom: 10,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
  },
  tabButtonActive: {
    backgroundColor: AppColors.primaryLight,
    shadowColor: AppColors.shadowColorString,
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  tabButtonText: {
    fontFamily: AppFonts.interMedium,
    fontSize: 12,
    color: AppColors.grayText,
  },
  tabButtonTextActive: {
    color: AppColors.purple,
    fontFamily: AppFonts.interBold,
  },
  scrollContent: {
    paddingBottom: 24,
    paddingHorizontal: 12,
  },
  emptyState: {
    padding: 24,
    alignItems: 'center',
  },
  emptyStateText: {
    fontFamily: AppFonts.interRegular,
    fontSize: 12,
    color: AppColors.grayTextWeak,
    textAlign: 'center',
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: AppColors.grayBorderSecondary,
    marginBottom: 8,
    shadowColor: AppColors.shadowColorString,
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  rowMain: {
    flex: 1,
    marginLeft: 10,
  },
  rowTitle: {
    fontFamily: AppFonts.interBold,
    fontSize: 13.5,
    color: AppColors.primaryBlack,
  },
  rowSub: {
    fontFamily: AppFonts.interRegular,
    fontSize: 10,
    color: AppColors.grayTextWeak,
    marginTop: 2,
  },
  sliceIcon: {
    width: 22,
    height: 22,
    borderRadius: 6,
    backgroundColor: AppColors.purpleShade50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  seqBadge: {
    backgroundColor: AppColors.grayBackground,
    borderColor: AppColors.grayBorderSecondary,
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 28,
  },
  seqText: {
    fontFamily: AppFonts.interBold,
    fontSize: 9.5,
    color: AppColors.grayText,
  },
  actionTitleText: {
    fontFamily: AppFonts.interBold,
    fontSize: 13,
    color: AppColors.purple,
  },
  actionMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  actionTimeText: {
    fontFamily: AppFonts.interRegular,
    fontSize: 9.5,
    color: AppColors.grayTextWeak,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 4,
  },
  sliceTagMini: {
    backgroundColor: AppColors.purpleShade50,
    borderColor: AppColors.purple + '20',
    borderWidth: 1,
    borderRadius: 3,
    paddingHorizontal: 4,
    paddingVertical: 0.5,
  },
  sliceTagMiniText: {
    fontFamily: AppFonts.interMedium,
    fontSize: 8.5,
    color: AppColors.purple,
  },
  // ── Detail Views Styles ──
  detailHeaderBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: AppColors.primaryLight,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.dividerColor,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingRight: 8,
  },
  backBtnText: {
    fontFamily: AppFonts.interBold,
    fontSize: 12.5,
    color: AppColors.purple,
  },
  detailHeaderInfo: {
    flex: 1,
    marginLeft: 10,
    marginRight: 10,
  },
  detailTitle: {
    fontFamily: AppFonts.interBold,
    fontSize: 13.5,
    color: AppColors.primaryBlack,
  },
  detailSub: {
    fontFamily: AppFonts.interRegular,
    fontSize: 10,
    color: AppColors.grayTextWeak,
    marginTop: 2,
  },
  detailHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailHeaderBtn: {
    padding: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: AppColors.purple + '20',
    backgroundColor: AppColors.purpleShade50,
    alignItems: 'center',
    justifyContent: 'center',
    width: 28,
    height: 28,
  },
  detailCopyBtn: {
    padding: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: AppColors.purple + '20',
    backgroundColor: AppColors.purpleShade50,
  },
  detailTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 1,
  },
  detailTimeText: {
    fontFamily: AppFonts.interRegular,
    fontSize: 10,
    color: AppColors.grayTextWeak,
  },
  detailAffectedTags: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: AppColors.grayBackground,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.dividerColor,
  },
  affectedTagsLabel: {
    fontFamily: AppFonts.interBold,
    fontSize: 9,
    color: AppColors.grayTextWeak,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  detailTagsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  sliceTag: {
    backgroundColor: AppColors.purpleShade50,
    borderColor: AppColors.purple + '20',
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
  },
  sliceTagText: {
    fontFamily: AppFonts.interMedium,
    fontSize: 9.5,
    color: AppColors.purple,
  },
  subTabRow: {
    flexDirection: 'row',
    padding: 8,
    gap: 8,
    backgroundColor: AppColors.primaryLight,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.dividerColor,
  },
  subTabPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: AppColors.grayBackground,
    borderWidth: 1,
    borderColor: AppColors.grayBorderSecondary,
  },
  subTabPillActive: {
    backgroundColor: AppColors.purple,
    borderColor: AppColors.purple,
  },
  subTabPillText: {
    fontFamily: AppFonts.interMedium,
    fontSize: 10.5,
    color: AppColors.grayText,
  },
  subTabPillTextActive: {
    color: AppColors.white,
    fontFamily: AppFonts.interBold,
  },
  detailScrollContent: {
    paddingBottom: 24,
  },
  jsonViewerContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  detailBox: {
    padding: 10,
  },
  detailBoxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  detailBoxTitle: {
    fontFamily: AppFonts.interBold,
    fontSize: 10,
    color: AppColors.grayTextWeak,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  apiLikeInfoBar: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: AppColors.primaryLight,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.dividerColor,
  },
  apiBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  apiMethodBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  apiMethodBadgeText: {
    fontFamily: AppFonts.interBold,
    fontSize: 9.5,
    color: AppColors.white,
    letterSpacing: 0.5,
  },
  apiChip: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: `${AppColors.purple}0F`,
    borderWidth: 1,
    borderColor: `${AppColors.purple}26`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  apiChipText: {
    fontFamily: AppFonts.interBold,
    fontSize: 9.5,
    color: AppColors.purple,
  },
  apiTitleText: {
    fontFamily: AppFonts.interBold,
    fontSize: 16,
    color: AppColors.primaryBlack,
    marginBottom: 8,
  },
  apiMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  apiMetaText: {
    fontFamily: AppFonts.interRegular,
    fontSize: 11,
    color: AppColors.grayTextWeak,
  },
  contentDetailSubHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.dividerColor,
    backgroundColor: AppColors.primaryLight,
  },
});
