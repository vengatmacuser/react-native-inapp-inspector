import React, {useState, useEffect, useMemo, useCallback} from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  TextInput,
  Modal,
  Alert,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import TouchableScale from '../TouchableScale';
import CopyButton from '../CopyButton';
import {AppColors} from '../../styles/AppColors';
import {AppFonts} from '../../styles/AppFonts';
import {useTranslation} from '../../i18n';
import {
  DatabaseIcon,
  SearchIcon,
  ClearIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CopyIcon,
  CheckIcon,
  CircleAlertIcon,
  LayersIcon,
  ResetIcon,
} from '../NetworkIcons';
import {
  fetchStorageEntries,
  setStorageEntry,
  removeStorageEntry,
  clearStorageDriver,
  isAsyncStorageConnected,
  isMMKVConnected,
  getRegisteredMMKVInstanceIds,
  subscribeToStorageChanges,
  StorageDriver,
  StorageEntry,
} from '../../customHooks/storageInspector';
import {copyToClipboard} from '../../helpers';
import {showToast} from '../../helpers/toast';

const getTypeBadge = (type: StorageEntry['type']) => {
  switch (type) {
    case 'json':
      return {label: 'JSON', color: AppColors.purple, bg: `${AppColors.purple}16`};
    case 'number':
      return {label: 'NUM', color: AppColors.warningIconGold, bg: `${AppColors.warningIconGold}16`};
    case 'boolean':
      return {label: 'BOOL', color: AppColors.emerald500, bg: `${AppColors.emerald500}16`};
    case 'null':
      return {label: 'NULL', color: AppColors.grayTextWeak, bg: `${AppColors.grayTextWeak}16`};
    default:
      return {label: 'STR', color: AppColors.blue500, bg: `${AppColors.blue500}16`};
  }
};

const StorageEntryCard = React.memo(function StorageEntryCard({
  entry,
  isExpanded,
  onToggleExpand,
  onCopy,
  onEdit,
  onDelete,
  badge,
}: {
  entry: StorageEntry;
  isExpanded: boolean;
  onToggleExpand: (key: string) => void;
  onCopy: (entry: StorageEntry) => void;
  onEdit: (entry: StorageEntry) => void;
  onDelete: (key: string) => void;
  badge: {label: string; color: string; bg: string};
}) {
  const formattedBytes = useMemo(() => {
    return entry.byteSize < 1024
      ? `${entry.byteSize} B`
      : `${(entry.byteSize / 1024).toFixed(1)} KB`;
  }, [entry.byteSize]);

  // Lazy compute displayed value to avoid layout thrashing on large JSON strings
  const displayValue = useMemo(() => {
    if (!isExpanded) {
      if (entry.value.length > 250) {
        return entry.value.slice(0, 250) + '...';
      }
      return entry.value;
    }

    if (entry.type === 'json') {
      try {
        const parsed = entry.parsedValue ?? JSON.parse(entry.value);
        return JSON.stringify(parsed, null, 2);
      } catch {
        return entry.value;
      }
    }
    return entry.value;
  }, [isExpanded, entry.value, entry.type, entry.parsedValue]);

  return (
    <View style={styles.entryCard}>
      {/* Entry Header: Key name, Type Badge, Size, Actions */}
      <View style={styles.entryHeader}>
        <View style={{flex: 1, marginRight: 8}}>
          <View style={{flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap'}}>
            <Text style={styles.entryKey} numberOfLines={1} selectable>
              {entry.key}
            </Text>
            <View
              style={[
                styles.typeBadge,
                {backgroundColor: badge.bg, borderColor: `${badge.color}33`},
              ]}>
              <Text style={[styles.typeBadgeText, {color: badge.color}]}>
                {badge.label}
              </Text>
            </View>
            <Text style={styles.sizeText}>{formattedBytes}</Text>
          </View>
        </View>

        {/* Actions: Copy, Edit, Delete */}
        <View style={styles.entryActions}>
          <TouchableScale
            hitSlop={6}
            onPress={() => onCopy(entry)}
            style={styles.entryActionBtn}>
            <CopyIcon size={12} color={AppColors.grayText} />
          </TouchableScale>

          <TouchableScale
            hitSlop={6}
            onPress={() => onEdit(entry)}
            style={styles.entryActionBtn}>
            <PencilIcon size={12} color={AppColors.purple} />
          </TouchableScale>

          <TouchableScale
            hitSlop={6}
            onPress={() => onDelete(entry.key)}
            style={[styles.entryActionBtn, {backgroundColor: `${AppColors.errorColor}12`}]}>
            <TrashIcon size={12} color={AppColors.errorColor} />
          </TouchableScale>
        </View>
      </View>

      {/* Entry Value Preview / Viewer */}
      <TouchableScale
        onPress={() => onToggleExpand(entry.key)}
        style={styles.valuePreviewBox}>
        <Text
          style={styles.valuePreviewText}
          numberOfLines={isExpanded ? undefined : 3}
          selectable={isExpanded}>
          {displayValue}
        </Text>
        {entry.value.length > 80 && (
          <Text style={styles.expandHint}>
            {isExpanded ? '▲ Collapse' : '▼ Expand'}
          </Text>
        )}
      </TouchableScale>
    </View>
  );
});

export const StorageTab = React.memo(() => {
  const {t} = useTranslation();
  const [activeDriver, setActiveDriver] = useState<StorageDriver>('asyncStorage');
  const [activeMMKVId, setActiveMMKVId] = useState<string>('default');
  const [entries, setEntries] = useState<StorageEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [expandedKeys, setExpandedKeys] = useState<Record<string, boolean>>({});

  // Modal State for Create / Edit
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editKeyName, setEditKeyName] = useState<string>('');
  const [editValue, setEditValue] = useState<string>('');
  const [editType, setEditType] = useState<'string' | 'json' | 'number' | 'boolean'>('string');
  const [jsonError, setJsonError] = useState<string | null>(null);

  const mmkvInstanceIds = useMemo(() => getRegisteredMMKVInstanceIds(), []);

  // Fetch entries
  const loadEntries = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchStorageEntries(
        activeDriver,
        activeDriver === 'mmkv' ? activeMMKVId : undefined,
      );
      setEntries(data);
    } catch {
      setEntries([]);
    } finally {
      setIsLoading(false);
    }
  }, [activeDriver, activeMMKVId]);

  useEffect(() => {
    loadEntries();
    const unsubscribe = subscribeToStorageChanges(loadEntries);
    return unsubscribe;
  }, [loadEntries]);

  // Toggle JSON accordion
  const toggleExpand = (key: string) => {
    setExpandedKeys(prev => ({...prev, [key]: !prev[key]}));
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    setModalMode('create');
    setEditKeyName('');
    setEditValue('');
    setEditType('string');
    setJsonError(null);
    setModalVisible(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (entry: StorageEntry) => {
    setModalMode('edit');
    setEditKeyName(entry.key);
    setEditValue(entry.value);
    setEditType(entry.type === 'json' ? 'json' : entry.type === 'number' ? 'number' : entry.type === 'boolean' ? 'boolean' : 'string');
    setJsonError(null);
    setModalVisible(true);
  };

  // Delete single key
  const handleDeleteKey = (key: string) => {
    Alert.alert(
      'Delete Storage Key',
      `Are you sure you want to permanently delete "${key}" from ${activeDriver === 'asyncStorage' ? 'AsyncStorage' : 'MMKV'}?`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const ok = await removeStorageEntry(
              activeDriver,
              key,
              activeDriver === 'mmkv' ? activeMMKVId : undefined,
            );
            if (ok) {
              showToast(`Deleted "${key}"`);
              loadEntries();
            } else {
              showToast(`Failed to delete "${key}"`);
            }
          },
        },
      ],
    );
  };

  // Clear all keys
  const handleClearAll = () => {
    Alert.alert(
      'Wipe All Storage Keys',
      `Are you sure you want to clear all ${entries.length} keys in ${activeDriver === 'asyncStorage' ? 'AsyncStorage' : 'MMKV'}? This cannot be undone.`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Wipe All',
          style: 'destructive',
          onPress: async () => {
            const ok = await clearStorageDriver(
              activeDriver,
              activeDriver === 'mmkv' ? activeMMKVId : undefined,
            );
            if (ok) {
              showToast('All storage keys wiped');
              loadEntries();
            }
          },
        },
      ],
    );
  };

  // Save Modal (Create / Update)
  const handleSaveModal = async () => {
    if (!editKeyName.trim()) {
      showToast('Key name cannot be empty');
      return;
    }

    let finalVal = editValue;

    if (editType === 'json') {
      try {
        // Validate JSON
        const parsed = JSON.parse(editValue);
        finalVal = JSON.stringify(parsed);
      } catch (err: any) {
        setJsonError('Invalid JSON: ' + err.message);
        return;
      }
    } else if (editType === 'number') {
      if (isNaN(Number(editValue))) {
        setJsonError('Value must be a valid number');
        return;
      }
    }

    const success = await setStorageEntry(
      activeDriver,
      editKeyName.trim(),
      finalVal,
      activeDriver === 'mmkv' ? activeMMKVId : undefined,
    );

    if (success) {
      showToast(modalMode === 'create' ? `Added "${editKeyName.trim()}"` : `Updated "${editKeyName.trim()}"`);
      setModalVisible(false);
      loadEntries();
    } else {
      showToast('Error saving storage key');
    }
  };

  // Format / Beautify JSON in modal
  const handleBeautifyJson = () => {
    try {
      const parsed = JSON.parse(editValue);
      setEditValue(JSON.stringify(parsed, null, 2));
      setJsonError(null);
      setEditType('json');
      showToast('Formatted JSON');
    } catch {
      setJsonError('Cannot format: invalid JSON syntax');
    }
  };

  // Filter entries
  const filteredEntries = useMemo(() => {
    if (!search.trim()) return entries;
    const q = search.toLowerCase().trim();
    return entries.filter(
      e => e.key.toLowerCase().includes(q) || e.value.toLowerCase().includes(q),
    );
  }, [entries, search]);

  const totalBytes = useMemo(() => {
    return entries.reduce((sum, e) => sum + e.byteSize, 0);
  }, [entries]);

  const formattedTotalSize = useMemo(() => {
    if (totalBytes < 1024) return `${totalBytes} B`;
    if (totalBytes < 1024 * 1024) return `${(totalBytes / 1024).toFixed(1)} KB`;
    return `${(totalBytes / (1024 * 1024)).toFixed(2)} MB`;
  }, [totalBytes]);

  const handleCopyEntry = useCallback((entry: StorageEntry) => {
    copyToClipboard(entry.value, entry.key);
    showToast(`Copied value of "${entry.key}"`);
  }, []);

  const renderItem = useCallback(
    ({item}: {item: StorageEntry}) => (
      <StorageEntryCard
        entry={item}
        isExpanded={Boolean(expandedKeys[item.key])}
        onToggleExpand={toggleExpand}
        onCopy={handleCopyEntry}
        onEdit={handleOpenEdit}
        onDelete={handleDeleteKey}
        badge={getTypeBadge(item.type)}
      />
    ),
    [expandedKeys, handleCopyEntry],
  );

  const isConnected =
    activeDriver === 'asyncStorage'
      ? isAsyncStorageConnected()
      : isMMKVConnected();

  return (
    <View style={styles.container}>
      {/* ── Driver Sub-Tabs ── */}
      <View style={styles.driverTabsWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.driverTabsContainer}>
          <TouchableScale
            onPress={() => setActiveDriver('asyncStorage')}
            style={[
              styles.driverTabPill,
              activeDriver === 'asyncStorage' && styles.driverTabPillActive,
            ]}>
            <DatabaseIcon
              size={13}
              color={
                activeDriver === 'asyncStorage'
                  ? AppColors.white
                  : AppColors.grayText
              }
            />
            <Text
              style={[
                styles.driverTabText,
                activeDriver === 'asyncStorage' && styles.driverTabTextActive,
              ]}>
              AsyncStorage
            </Text>
            {activeDriver === 'asyncStorage' && entries.length > 0 && (
              <View style={styles.driverCountBadge}>
                <Text style={styles.driverCountText}>{entries.length}</Text>
              </View>
            )}
          </TouchableScale>

          <TouchableScale
            onPress={() => setActiveDriver('mmkv')}
            style={[
              styles.driverTabPill,
              activeDriver === 'mmkv' && styles.driverTabPillActive,
            ]}>
            <LayersIcon
              size={13}
              color={
                activeDriver === 'mmkv'
                  ? AppColors.white
                  : AppColors.grayText
              }
            />
            <Text
              style={[
                styles.driverTabText,
                activeDriver === 'mmkv' && styles.driverTabTextActive,
              ]}>
              MMKV
            </Text>
            {activeDriver === 'mmkv' && entries.length > 0 && (
              <View style={styles.driverCountBadge}>
                <Text style={styles.driverCountText}>{entries.length}</Text>
              </View>
            )}
          </TouchableScale>

          {/* MMKV Named Instance Dropdown/Pills */}
          {activeDriver === 'mmkv' && mmkvInstanceIds.length > 1 && (
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: 6}}>
              {mmkvInstanceIds.map(id => (
                <TouchableScale
                  key={id}
                  onPress={() => setActiveMMKVId(id)}
                  style={[
                    styles.instancePill,
                    activeMMKVId === id && styles.instancePillActive,
                  ]}>
                  <Text
                    style={[
                      styles.instancePillText,
                      activeMMKVId === id && styles.instancePillTextActive,
                    ]}>
                    {id}
                  </Text>
                </TouchableScale>
              ))}
            </View>
          )}
        </ScrollView>
      </View>

      {/* ── Search & Actions Bar ── */}
      <View style={styles.actionBar}>
        <View style={styles.searchBar}>
          <SearchIcon size={14} color={AppColors.grayTextWeak} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder={`Search ${entries.length} keys & values...`}
            placeholderTextColor={AppColors.grayTextWeak}
            style={styles.searchInput}
            clearButtonMode="while-editing"
          />
          {search.length > 0 && (
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 4}}>
              <View
                style={{
                  backgroundColor: `${AppColors.purple}20`,
                  borderRadius: 10,
                  paddingHorizontal: 6,
                  paddingVertical: 1.5,
                }}>
                <Text
                  style={{
                    color: AppColors.purple,
                    fontSize: 9.5,
                    fontFamily: AppFonts.interBold,
                  }}>
                  {filteredEntries.length}
                </Text>
              </View>
              <TouchableScale onPress={() => setSearch('')} hitSlop={8}>
                <ClearIcon size={13} color={AppColors.grayTextWeak} />
              </TouchableScale>
            </View>
          )}
        </View>

        {/* Action Buttons: Add Key & Refresh */}
        <TouchableScale
          onPress={handleOpenCreate}
          style={styles.addKeyBtn}
          hitSlop={6}>
          <PlusIcon size={13} color={AppColors.white} />
          <Text style={styles.addKeyBtnText}>Add</Text>
        </TouchableScale>

        <TouchableScale
          onPress={loadEntries}
          style={styles.actionIconBtn}
          hitSlop={6}>
          <ResetIcon size={13} color={AppColors.grayText} />
        </TouchableScale>

        {entries.length > 0 && (
          <TouchableScale
            onPress={handleClearAll}
            style={[styles.actionIconBtn, {borderColor: `${AppColors.errorColor}33`, backgroundColor: `${AppColors.errorColor}12`}]}
            hitSlop={6}>
            <TrashIcon size={13} color={AppColors.errorColor} />
          </TouchableScale>
        )}
      </View>

      {/* ── Stats Strip ── */}
      <View style={styles.statsStrip}>
        <Text style={styles.statsText}>
          {filteredEntries.length} of {entries.length} Keys • {formattedTotalSize}
        </Text>
        <Text style={styles.statsSubtext}>
          {activeDriver === 'asyncStorage' ? 'SQLite Key-Value' : `MMKV (${activeMMKVId})`}
        </Text>
      </View>

      {/* ── Storage Entries List ── */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={AppColors.purple} />
          <Text style={styles.loadingText}>Loading storage entries...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredEntries}
          keyExtractor={item => item.key}
          renderItem={renderItem}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={5}
          removeClippedSubviews={Platform.OS === 'android'}
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconWrap}>
                <DatabaseIcon size={28} color={AppColors.grayTextWeak} />
              </View>
              <Text style={styles.emptyTitle}>
                {search ? 'No matching keys found' : `No ${activeDriver === 'asyncStorage' ? 'AsyncStorage' : 'MMKV'} Keys`}
              </Text>
              <Text style={styles.emptySubtitle}>
                {search
                  ? 'Try modifying your search query'
                  : `Storage is auto-detected. Tap "+ Add" above to create your first ${activeDriver === 'asyncStorage' ? 'AsyncStorage' : 'MMKV'} key!`}
              </Text>
            </View>
          }
          ListFooterComponent={<View style={{height: 60}} />}
        />
      )}

      {/* ── Create / Edit Key Modal ── */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {modalMode === 'create' ? 'Add Storage Key' : `Edit: ${editKeyName}`}
              </Text>
              <TouchableScale onPress={() => setModalVisible(false)} hitSlop={8}>
                <ClearIcon size={16} color={AppColors.grayText} />
              </TouchableScale>
            </View>

            {/* Key Name Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>KEY NAME</Text>
              <TextInput
                value={editKeyName}
                onChangeText={setEditKeyName}
                placeholder="e.g. user_session, auth_token"
                placeholderTextColor={AppColors.grayTextWeak}
                editable={modalMode === 'create'}
                style={[
                  styles.textInput,
                  modalMode === 'edit' && styles.textInputDisabled,
                ]}
                autoCapitalize="none"
              />
            </View>

            {/* Type Selector Strip */}
            <View style={styles.inputGroup}>
              <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4}}>
                <Text style={styles.inputLabel}>VALUE TYPE</Text>
                {editType === 'json' && (
                  <TouchableScale onPress={handleBeautifyJson} hitSlop={6}>
                    <Text style={styles.formatJsonBtn}>Beautify JSON</Text>
                  </TouchableScale>
                )}
              </View>
              <View style={styles.typeSelectorStrip}>
                {(['string', 'json', 'number', 'boolean'] as const).map(t => {
                  const isSel = editType === t;
                  return (
                    <TouchableScale
                      key={t}
                      onPress={() => {
                        setEditType(t);
                        setJsonError(null);
                      }}
                      style={[
                        styles.typePill,
                        isSel && styles.typePillActive,
                      ]}>
                      <Text
                        style={[
                          styles.typePillText,
                          isSel && styles.typePillTextActive,
                        ]}>
                        {t.toUpperCase()}
                      </Text>
                    </TouchableScale>
                  );
                })}
              </View>
            </View>

            {/* Value Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>VALUE CONTENT</Text>
              <TextInput
                value={editValue}
                onChangeText={v => {
                  setEditValue(v);
                  if (jsonError) setJsonError(null);
                }}
                placeholder={
                  editType === 'json'
                    ? '{"userId": 123, "isLoggedIn": true}'
                    : editType === 'number'
                    ? '42'
                    : editType === 'boolean'
                    ? 'true'
                    : 'String value...'
                }
                placeholderTextColor={AppColors.grayTextWeak}
                style={[styles.textInput, styles.textAreaInput]}
                multiline
                textAlignVertical="top"
                autoCapitalize="none"
              />
              {jsonError && (
                <Text style={styles.errorText}>⚠️ {jsonError}</Text>
              )}
            </View>

            {/* Modal Actions */}
            <View style={styles.modalActions}>
              <TouchableScale
                onPress={() => setModalVisible(false)}
                style={styles.cancelBtn}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableScale>
              <TouchableScale
                onPress={handleSaveModal}
                style={styles.saveBtn}>
                <CheckIcon size={14} color={AppColors.white} />
                <Text style={styles.saveBtnText}>Save Key</Text>
              </TouchableScale>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.grayBackground,
  },
  driverTabsWrapper: {
    backgroundColor: AppColors.primaryLight,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.dividerColor,
    paddingVertical: 8,
  },
  driverTabsContainer: {
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  driverTabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: AppColors.grayBackground,
    borderWidth: 1,
    borderColor: AppColors.grayBorderSecondary,
  },
  driverTabPillActive: {
    backgroundColor: AppColors.purple,
    borderColor: AppColors.purple,
  },
  driverTabText: {
    fontFamily: AppFonts.interBold,
    fontSize: 11.5,
    color: AppColors.grayText,
  },
  driverTabTextActive: {
    color: AppColors.white,
  },
  driverCountBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 6,
  },
  driverCountText: {
    fontFamily: AppFonts.interBold,
    fontSize: 9,
    color: AppColors.white,
  },
  instancePill: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: `${AppColors.purple}14`,
    borderWidth: 1,
    borderColor: `${AppColors.purple}30`,
  },
  instancePillActive: {
    backgroundColor: AppColors.purple,
    borderColor: AppColors.purple,
  },
  instancePillText: {
    fontFamily: AppFonts.interBold,
    fontSize: 10,
    color: AppColors.purple,
  },
  instancePillTextActive: {
    color: AppColors.white,
  },
  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: AppColors.primaryLight,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.dividerColor,
    gap: 6,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.grayBackground,
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: Platform.OS === 'ios' ? 6 : 2,
    borderWidth: 1,
    borderColor: AppColors.grayBorderSecondary,
    gap: 6,
  },
  searchInput: {
    flex: 1,
    fontFamily: AppFonts.interMedium,
    fontSize: 12,
    color: AppColors.primaryBlack,
    padding: 0,
  },
  addKeyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: AppColors.purple,
  },
  addKeyBtnText: {
    fontFamily: AppFonts.interBold,
    fontSize: 11,
    color: AppColors.white,
  },
  actionIconBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppColors.grayBackground,
    borderWidth: 1,
    borderColor: AppColors.grayBorderSecondary,
  },
  statsStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 5,
    backgroundColor: `${AppColors.grayBorderSecondary}40`,
  },
  statsText: {
    fontFamily: AppFonts.interMedium,
    fontSize: 10,
    color: AppColors.grayText,
  },
  statsSubtext: {
    fontFamily: AppFonts.interBold,
    fontSize: 9.5,
    color: AppColors.grayTextWeak,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 12,
    gap: 10,
    paddingBottom: 100,
  },
  entryCard: {
    backgroundColor: AppColors.primaryLight,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: AppColors.grayBorderSecondary,
    padding: 10,
    gap: 8,
    shadowColor: AppColors.black,
    shadowOpacity: 0.02,
    shadowRadius: 3,
    shadowOffset: {width: 0, height: 1},
    elevation: 1,
  },
  entryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  entryKey: {
    fontFamily: AppFonts.interBold,
    fontSize: 12.5,
    color: AppColors.primaryBlack,
  },
  typeBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 1,
  },
  typeBadgeText: {
    fontFamily: AppFonts.interBold,
    fontSize: 8.5,
  },
  sizeText: {
    fontFamily: AppFonts.interRegular,
    fontSize: 10,
    color: AppColors.grayTextWeak,
  },
  entryActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  entryActionBtn: {
    padding: 5,
    borderRadius: 5,
    backgroundColor: AppColors.grayBackground,
  },
  valuePreviewBox: {
    backgroundColor: AppColors.grayBackground,
    borderRadius: 6,
    padding: 8,
    borderWidth: 1,
    borderColor: `${AppColors.grayBorderSecondary}80`,
  },
  valuePreviewText: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 11,
    color: AppColors.primaryBlack,
    lineHeight: 16,
  },
  expandHint: {
    fontFamily: AppFonts.interBold,
    fontSize: 9.5,
    color: AppColors.purple,
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loadingText: {
    fontFamily: AppFonts.interMedium,
    fontSize: 12,
    color: AppColors.grayText,
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: `${AppColors.grayBorderSecondary}40`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontFamily: AppFonts.interBold,
    fontSize: 14,
    color: AppColors.primaryBlack,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontFamily: AppFonts.interRegular,
    fontSize: 11.5,
    color: AppColors.grayText,
    textAlign: 'center',
    maxWidth: 280,
  },
  connectGuideCard: {
    marginTop: 20,
    width: '100%',
    backgroundColor: AppColors.primaryLight,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: AppColors.grayBorderSecondary,
    padding: 12,
    gap: 6,
  },
  connectGuideTitle: {
    fontFamily: AppFonts.interBold,
    fontSize: 11,
    color: AppColors.purple,
  },
  connectGuideCode: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 10,
    color: AppColors.grayText,
    lineHeight: 15,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: AppColors.primaryLight,
    borderRadius: 14,
    padding: 16,
    gap: 12,
    shadowColor: AppColors.black,
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: {width: 0, height: 4},
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: AppColors.dividerColor,
    paddingBottom: 10,
  },
  modalTitle: {
    fontFamily: AppFonts.interBold,
    fontSize: 14,
    color: AppColors.primaryBlack,
  },
  inputGroup: {
    gap: 4,
  },
  inputLabel: {
    fontFamily: AppFonts.interBold,
    fontSize: 9.5,
    color: AppColors.grayTextWeak,
    letterSpacing: 0.5,
  },
  textInput: {
    backgroundColor: AppColors.grayBackground,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontFamily: AppFonts.interMedium,
    fontSize: 12,
    color: AppColors.primaryBlack,
    borderWidth: 1,
    borderColor: AppColors.grayBorderSecondary,
  },
  textInputDisabled: {
    backgroundColor: `${AppColors.grayBorderSecondary}40`,
    color: AppColors.grayText,
  },
  textAreaInput: {
    minHeight: 90,
    maxHeight: 160,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 11,
  },
  typeSelectorStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  typePill: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: AppColors.grayBackground,
    borderWidth: 1,
    borderColor: AppColors.grayBorderSecondary,
  },
  typePillActive: {
    backgroundColor: AppColors.purple,
    borderColor: AppColors.purple,
  },
  typePillText: {
    fontFamily: AppFonts.interBold,
    fontSize: 10,
    color: AppColors.grayText,
  },
  typePillTextActive: {
    color: AppColors.white,
  },
  formatJsonBtn: {
    fontFamily: AppFonts.interBold,
    fontSize: 10,
    color: AppColors.purple,
  },
  errorText: {
    fontFamily: AppFonts.interMedium,
    fontSize: 10,
    color: AppColors.errorColor,
    marginTop: 2,
  },
  modalActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  cancelBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: AppColors.grayBackground,
    borderWidth: 1,
    borderColor: AppColors.grayBorderSecondary,
  },
  cancelBtnText: {
    fontFamily: AppFonts.interBold,
    fontSize: 12,
    color: AppColors.grayText,
  },
  saveBtn: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: AppColors.purple,
  },
  saveBtnText: {
    fontFamily: AppFonts.interBold,
    fontSize: 12,
    color: AppColors.white,
  },
});

export default StorageTab;
