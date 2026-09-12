import React, {useEffect, useMemo, useState} from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {AppColors} from '../../styles/AppColors';
import {AppFonts} from '../../styles/AppFonts';
import {
  FilterIcon,
  CloseWhite,
  ClockIcon,
  GlobeIcon,
  LockIcon,
  BoltIcon,
  LayersIcon,
} from '../NetworkIcons';
import TouchableScale from '../TouchableScale';
import type {SocketConnectionRecord, SocketFilterState} from '../../types';

export const DEFAULT_SOCKET_FILTERS: SocketFilterState = {
  search: '',
  status: new Set(['all']),
  types: new Set(['all']),
  sortBy: 'time_desc',
};

export const isSocketFiltersDefault = (f: SocketFilterState): boolean =>
  (f.status.has('all') || f.status.size === 0) &&
  (f.types.has('all') || f.types.size === 0) &&
  f.sortBy === 'time_desc';

interface SocketFilterModalProps {
  visible: boolean;
  onClose: () => void;
  filters: SocketFilterState;
  onApply: (filters: SocketFilterState) => void;
  records: SocketConnectionRecord[];
}

export const SocketFilterModal: React.FC<SocketFilterModalProps> = ({
  visible,
  onClose,
  filters,
  onApply,
  records,
}) => {
  const [draft, setDraft] = useState<SocketFilterState>(() => ({
    ...filters,
    status: new Set(filters.status),
    types: new Set(filters.types),
  }));

  useEffect(() => {
    if (visible) {
      setDraft({
        ...filters,
        status: new Set(filters.status),
        types: new Set(filters.types),
      });
    }
  }, [visible, filters]);

  // Live Counts
  const counts = useMemo(() => {
    let open = 0;
    let closed = 0;
    let connecting = 0;
    let error = 0;
    let wss = 0;
    let ws = 0;
    let sio = 0;

    records.forEach(r => {
      const s = r.status || 'open';
      if (s === 'open') open++;
      else if (s === 'closed') closed++;
      else if (s === 'connecting') connecting++;
      else if (s === 'error') error++;

      if (r.client === 'socket.io' || r.url.includes('/socket.io')) sio++;
      else if (r.url.startsWith('wss://')) wss++;
      else ws++;
    });

    return {
      all: records.length,
      open,
      closed,
      connecting,
      error,
      wss,
      ws,
      sio,
    };
  }, [records]);

  const toggleStatus = (st: string) => {
    const next = new Set(draft.status);
    if (st === 'all') {
      next.clear();
      next.add('all');
    } else {
      next.delete('all');
      if (next.has(st)) next.delete(st);
      else next.add(st);
      if (next.size === 0) next.add('all');
    }
    setDraft(prev => ({...prev, status: next}));
  };

  const toggleType = (ty: string) => {
    const next = new Set(draft.types);
    if (ty === 'all') {
      next.clear();
      next.add('all');
    } else {
      next.delete('all');
      if (next.has(ty)) next.delete(ty);
      else next.add(ty);
      if (next.size === 0) next.add('all');
    }
    setDraft(prev => ({...prev, types: next}));
  };

  const handleReset = () => {
    setDraft({
      search: draft.search,
      status: new Set(['all']),
      types: new Set(['all']),
      sortBy: 'time_desc',
    });
  };

  const handleApply = () => {
    onApply(draft);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={styles.backdropPress} onPress={onClose} />
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <FilterIcon size={18} color={AppColors.brandPurple} />
              <Text style={styles.headerTitle}>Filter WebSockets</Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}
              style={styles.closeBtn}>
              <CloseWhite size={14} color={AppColors.grayTextWeak} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Connection Status Section */}
            <Text style={styles.sectionTitle}>CONNECTION STATUS</Text>
            <View style={styles.chipRow}>
              {[
                {key: 'all', label: 'All', count: counts.all, color: AppColors.brandPurple},
                {key: 'open', label: 'Open', count: counts.open, color: AppColors.greenColor},
                {key: 'closed', label: 'Closed', count: counts.closed, color: AppColors.slate500},
                {key: 'connecting', label: 'Connecting', count: counts.connecting, color: AppColors.amber600},
                {key: 'error', label: 'Error', count: counts.error, color: AppColors.errorColor},
              ].map(item => {
                const isSelected = draft.status.has(item.key);
                return (
                  <TouchableOpacity
                    key={item.key}
                    onPress={() => toggleStatus(item.key)}
                    style={[
                      styles.chip,
                      isSelected && {
                        backgroundColor: `${item.color}18`,
                        borderColor: item.color,
                      },
                    ]}>
                    <Text
                      style={[
                        styles.chipText,
                        isSelected && {color: item.color, fontFamily: AppFonts.interBold},
                      ]}>
                      {item.label}
                    </Text>
                    <View
                      style={[
                        styles.countPill,
                        isSelected && {backgroundColor: `${item.color}30`},
                      ]}>
                      <Text
                        style={[
                          styles.countText,
                          isSelected && {color: item.color},
                        ]}>
                        {item.count}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Protocol & Client Type Section */}
            <Text style={styles.sectionTitle}>PROTOCOL & CLIENT</Text>
            <View style={styles.chipRow}>
              {[
                {key: 'all', label: 'All Protocols', count: counts.all, color: AppColors.brandPurple},
                {key: 'wss', label: 'Secure (WSS)', count: counts.wss, color: AppColors.emerald600},
                {key: 'ws', label: 'Standard (WS)', count: counts.ws, color: AppColors.blue600},
                {key: 'sio', label: 'Socket.IO', count: counts.sio, color: AppColors.violet600},
              ].map(item => {
                const isSelected = draft.types.has(item.key);
                return (
                  <TouchableOpacity
                    key={item.key}
                    onPress={() => toggleType(item.key)}
                    style={[
                      styles.chip,
                      isSelected && {
                        backgroundColor: `${item.color}18`,
                        borderColor: item.color,
                      },
                    ]}>
                    <Text
                      style={[
                        styles.chipText,
                        isSelected && {color: item.color, fontFamily: AppFonts.interBold},
                      ]}>
                      {item.label}
                    </Text>
                    <View
                      style={[
                        styles.countPill,
                        isSelected && {backgroundColor: `${item.color}30`},
                      ]}>
                      <Text
                        style={[
                          styles.countText,
                          isSelected && {color: item.color},
                        ]}>
                        {item.count}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Sort Order */}
            <Text style={styles.sectionTitle}>SORT BY</Text>
            <View style={styles.chipRow}>
              {[
                {key: 'time_desc', label: 'Newest First'},
                {key: 'time_asc', label: 'Oldest First'},
                {key: 'frames_desc', label: 'Most Frames'},
                {key: 'duration_desc', label: 'Longest Duration'},
              ].map(item => {
                const isSelected = draft.sortBy === item.key;
                return (
                  <TouchableOpacity
                    key={item.key}
                    onPress={() =>
                      setDraft(prev => ({...prev, sortBy: item.key as any}))
                    }
                    style={[
                      styles.chip,
                      isSelected && styles.chipActiveSort,
                    ]}>
                    <Text
                      style={[
                        styles.chipText,
                        isSelected && styles.chipTextActiveSort,
                      ]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          {/* Footer Buttons */}
          <View style={styles.footer}>
            <TouchableOpacity onPress={handleReset} style={styles.resetBtn}>
              <Text style={styles.resetBtnText}>Reset</Text>
            </TouchableOpacity>
            <TouchableScale onPress={handleApply} style={styles.applyBtn}>
              <Text style={styles.applyBtnText}>Apply Filters</Text>
            </TouchableScale>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default SocketFilterModal;

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  backdropPress: {
    ...StyleSheet.absoluteFillObject,
  },
  container: {
    width: '100%',
    maxHeight: '80%',
    backgroundColor: AppColors.contentBg,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: AppColors.black,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.dividerColor,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontFamily: AppFonts.interBold,
    fontSize: 16,
    color: AppColors.grayTextStrong,
  },
  closeBtn: {
    padding: 4,
  },
  content: {
    padding: 16,
  },
  sectionTitle: {
    fontFamily: AppFonts.interBold,
    fontSize: 11,
    color: AppColors.grayTextWeak,
    letterSpacing: 0.6,
    marginBottom: 8,
    marginTop: 10,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: AppColors.dividerColor,
    backgroundColor: AppColors.graySurface,
    gap: 6,
  },
  chipActiveSort: {
    backgroundColor: `${AppColors.brandPurple}18`,
    borderColor: AppColors.brandPurple,
  },
  chipText: {
    fontFamily: AppFonts.interMedium,
    fontSize: 12,
    color: AppColors.grayTextStrong,
  },
  chipTextActiveSort: {
    color: AppColors.brandPurple,
    fontFamily: AppFonts.interBold,
  },
  countPill: {
    backgroundColor: `${AppColors.slate500}18`,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 10,
  },
  countText: {
    fontFamily: AppFonts.interBold,
    fontSize: 10,
    color: AppColors.grayTextWeak,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: AppColors.dividerColor,
    gap: 12,
  },
  resetBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: AppColors.dividerColor,
  },
  resetBtnText: {
    fontFamily: AppFonts.interSemiBold,
    fontSize: 13,
    color: AppColors.grayTextWeak,
  },
  applyBtn: {
    flex: 1,
    backgroundColor: AppColors.brandPurple,
    paddingVertical: 11,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyBtnText: {
    fontFamily: AppFonts.interBold,
    fontSize: 13,
    color: AppColors.white,
  },
});
