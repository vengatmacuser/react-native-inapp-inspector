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
import {useInspector} from './InspectorContext';
import {Method} from '../../types';
import {AppColors} from '../../styles/AppColors';
import {AppFonts} from '../../styles/AppFonts';
import {useTranslation} from '../../i18n';
import {METHOD_COLORS} from '../../constants';
import {
  FilterIcon,
  CloseWhite,
  ClockIcon,
  CircleCheckIcon,
  CircleAlertIcon,
  CircleXIcon,
  LayersIcon,
  RepeatIcon,
  ShieldAlertIcon,
  BoltIcon,
  GlobeIcon,
  LockIcon,
  UnlockIcon,
  RocketIcon,
  TurtleIcon,
  HourglassIcon,
  PackageIcon,
} from '../NetworkIcons';
import TouchableScale from '../TouchableScale';

export interface NetworkFilterState {
  statusCodes: Set<string>;
  methods: Set<string>;
  latency: 'all' | 'fast' | 'normal' | 'slow';
  protocol: 'all' | 'https' | 'http';
  sortBy: 'time_desc' | 'time_asc' | 'duration_desc' | 'duration_asc' | 'size_desc';
}

export const DEFAULT_NETWORK_FILTERS: NetworkFilterState = {
  statusCodes: new Set(['all']),
  methods: new Set(['all']),
  latency: 'all',
  protocol: 'all',
  sortBy: 'time_desc',
};

export const isNetworkFiltersDefault = (f: NetworkFilterState): boolean =>
  (f.statusCodes.has('all') || f.statusCodes.size === 0) &&
  (f.methods.has('all') || f.methods.size === 0) &&
  f.latency === 'all' &&
  f.protocol === 'all' &&
  f.sortBy === 'time_desc';

interface NetworkFilterModalProps {
  visible: boolean;
  onClose: () => void;
  filters: NetworkFilterState;
  onApply: (filters: NetworkFilterState) => void;
  searchQuery?: string;
}

export const NetworkFilterModal: React.FC<NetworkFilterModalProps> = ({
  visible,
  onClose,
  filters,
  onApply,
  searchQuery = '',
}) => {
  const {t} = useTranslation();
  const {logs} = useInspector();

  const [draft, setDraft] = useState<NetworkFilterState>(() => ({
    ...filters,
    statusCodes: new Set(filters.statusCodes),
    methods: new Set(filters.methods),
  }));

  useEffect(() => {
    if (visible) {
      setDraft({
        ...filters,
        statusCodes: new Set(filters.statusCodes),
        methods: new Set(filters.methods),
      });
    }
  }, [visible, filters]);

  // Live count calculators
  const counts = useMemo(() => {
    const statusMap: Record<string, number> = {
      all: logs.length,
      '2xx': 0,
      '3xx': 0,
      '4xx': 0,
      '5xx': 0,
      failed: 0,
    };
    const methodMap: Record<string, number> = {all: logs.length};
    let fastCount = 0;
    let normalCount = 0;
    let slowCount = 0;
    let httpsCount = 0;
    let httpCount = 0;

    for (const log of logs) {
      const s = typeof log.status === 'number' ? log.status : parseInt(String(log.status), 10);
      if (log.status === 0 || log.status == null) {
        statusMap.failed = (statusMap.failed || 0) + 1;
      } else if (!isNaN(s)) {
        if (s >= 200 && s < 300) statusMap['2xx'] = (statusMap['2xx'] || 0) + 1;
        else if (s >= 300 && s < 400) statusMap['3xx'] = (statusMap['3xx'] || 0) + 1;
        else if (s >= 400 && s < 500) statusMap['4xx'] = (statusMap['4xx'] || 0) + 1;
        else if (s >= 500) statusMap['5xx'] = (statusMap['5xx'] || 0) + 1;
      }

      const m = (log.method || 'GET').toUpperCase();
      methodMap[m] = (methodMap[m] || 0) + 1;

      const dur = log.duration || 0;
      if (dur < 200) fastCount++;
      else if (dur <= 500) normalCount++;
      else slowCount++;

      if ((log.url || '').toLowerCase().startsWith('https')) httpsCount++;
      else httpCount++;
    }

    return {
      statusMap,
      methodMap,
      fastCount,
      normalCount,
      slowCount,
      httpsCount,
      httpCount,
    };
  }, [logs]);

  // Count matching results with current draft filters
  const previewMatchCount = useMemo(() => {
    return logs.filter(log => {
      // Status filter
      if (!draft.statusCodes.has('all') && draft.statusCodes.size > 0) {
        const s = typeof log.status === 'number' ? log.status : parseInt(String(log.status), 10);
        let matches = false;
        if (draft.statusCodes.has('failed') && (log.status === 0 || log.status == null)) matches = true;
        if (draft.statusCodes.has('2xx') && !isNaN(s) && s >= 200 && s < 300) matches = true;
        if (draft.statusCodes.has('3xx') && !isNaN(s) && s >= 300 && s < 400) matches = true;
        if (draft.statusCodes.has('4xx') && !isNaN(s) && s >= 400 && s < 500) matches = true;
        if (draft.statusCodes.has('5xx') && !isNaN(s) && s >= 500) matches = true;
        if (!matches) return false;
      }

      // Method filter
      if (!draft.methods.has('all') && draft.methods.size > 0) {
        const m = (log.method || 'GET').toUpperCase();
        if (!draft.methods.has(m)) return false;
      }

      // Latency filter
      const dur = log.duration || 0;
      if (draft.latency === 'fast' && dur >= 200) return false;
      if (draft.latency === 'normal' && (dur < 200 || dur > 500)) return false;
      if (draft.latency === 'slow' && dur <= 500) return false;

      // Protocol filter
      const isHttps = (log.url || '').toLowerCase().startsWith('https');
      if (draft.protocol === 'https' && !isHttps) return false;
      if (draft.protocol === 'http' && isHttps) return false;

      // Search query
      if (searchQuery.trim().length > 0) {
        const q = searchQuery.toLowerCase();
        const u = (log.url || '').toLowerCase();
        if (!u.includes(q)) return false;
      }

      return true;
    }).length;
  }, [logs, draft, searchQuery]);

  const toggleStatus = (key: string) => {
    setDraft(prev => {
      const next = new Set(prev.statusCodes);
      if (key === 'all') {
        return {...prev, statusCodes: new Set(['all'])};
      }
      next.delete('all');
      if (next.has(key)) {
        next.delete(key);
        if (next.size === 0) next.add('all');
      } else {
        next.add(key);
      }
      return {...prev, statusCodes: next};
    });
  };

  const toggleMethod = (key: string) => {
    setDraft(prev => {
      const next = new Set(prev.methods);
      if (key === 'all') {
        return {...prev, methods: new Set(['all'])};
      }
      next.delete('all');
      if (next.has(key)) {
        next.delete(key);
        if (next.size === 0) next.add('all');
      } else {
        next.add(key);
      }
      return {...prev, methods: next};
    });
  };

  const handleReset = () => {
    setDraft({
      statusCodes: new Set(['all']),
      methods: new Set(['all']),
      latency: 'all',
      protocol: 'all',
      sortBy: 'time_desc',
    });
  };

  const handleApply = () => {
    onApply(draft);
    onClose();
  };

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (!draft.statusCodes.has('all') && draft.statusCodes.size > 0) count += draft.statusCodes.size;
    if (!draft.methods.has('all') && draft.methods.size > 0) count += draft.methods.size;
    if (draft.latency !== 'all') count++;
    if (draft.protocol !== 'all') count++;
    if (draft.sortBy !== 'time_desc') count++;
    return count;
  }, [draft]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.modalCard} onPress={e => e.stopPropagation()}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.iconCircle}>
                <FilterIcon size={16} color={AppColors.purple} />
              </View>
              <View>
                <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
                  <Text style={styles.title}>Network Filters</Text>
                  {activeFiltersCount > 0 && (
                    <View style={styles.activeBadge}>
                      <Text style={styles.activeBadgeText}>{activeFiltersCount} active</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.subtitle}>Filter requests by status, method & speed</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={10} style={styles.closeBtn}>
              <CloseWhite size={14} color={AppColors.grayText} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}>
            {/* Section 1: HTTP Status Codes */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>HTTP STATUS CODE</Text>
              <View style={styles.chipsWrap}>
                {[
                  {key: 'all', label: 'All Statuses', color: AppColors.purple, icon: LayersIcon, count: counts.statusMap.all},
                  {key: '2xx', label: '2xx Success', color: AppColors.greenColor, icon: CircleCheckIcon, count: counts.statusMap['2xx'] || 0},
                  {key: '3xx', label: '3xx Redirect', color: AppColors.warningIconGold, icon: RepeatIcon, count: counts.statusMap['3xx'] || 0},
                  {key: '4xx', label: '4xx Client Error', color: AppColors.darkOrange, icon: CircleAlertIcon, count: counts.statusMap['4xx'] || 0},
                  {key: '5xx', label: '5xx Server Error', color: AppColors.errorColor, icon: CircleXIcon, count: counts.statusMap['5xx'] || 0},
                  {key: 'failed', label: 'Network Failed / 0', color: AppColors.errorColor, icon: ShieldAlertIcon, count: counts.statusMap.failed || 0},
                ].map(item => {
                  const isSelected = draft.statusCodes.has(item.key);
                  const IconComp = item.icon;
                  return (
                    <TouchableOpacity
                      key={item.key}
                      activeOpacity={0.7}
                      onPress={() => toggleStatus(item.key)}
                      style={[
                        styles.chip,
                        isSelected && {
                          backgroundColor: `${item.color}15`,
                          borderColor: item.color,
                        },
                      ]}>
                      <IconComp size={13} color={isSelected ? item.color : AppColors.grayTextWeak} />
                      <Text
                        style={[
                          styles.chipLabel,
                          isSelected && {color: item.color, fontFamily: AppFonts.interBold},
                        ]}>
                        {item.label}
                      </Text>
                      <View
                        style={[
                          styles.countPill,
                          isSelected && {backgroundColor: `${item.color}25`},
                        ]}>
                        <Text
                          style={[
                            styles.countPillText,
                            isSelected && {color: item.color},
                          ]}>
                          {item.count}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Section 2: HTTP Method */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>HTTP METHOD</Text>
              <View style={styles.chipsWrap}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => toggleMethod('all')}
                  style={[
                    styles.chip,
                    draft.methods.has('all') && {
                      backgroundColor: `${AppColors.purple}15`,
                      borderColor: AppColors.purple,
                    },
                  ]}>
                  <LayersIcon size={12} color={draft.methods.has('all') ? AppColors.purple : AppColors.grayTextWeak} />
                  <Text
                    style={[
                      styles.chipLabel,
                      draft.methods.has('all') && {color: AppColors.purple, fontFamily: AppFonts.interBold},
                    ]}>
                    All Methods
                  </Text>
                  <View style={[styles.countPill, draft.methods.has('all') && {backgroundColor: `${AppColors.purple}25`}]}>
                    <Text style={[styles.countPillText, draft.methods.has('all') && {color: AppColors.purple}]}>
                      {counts.methodMap.all}
                    </Text>
                  </View>
                </TouchableOpacity>

                {(['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'QUERY', 'OPTIONS', 'HEAD'] as const).map(m => {
                  const isSelected = draft.methods.has(m);
                  const mColor = METHOD_COLORS[m as Method] || AppColors.grayText;
                  const count = counts.methodMap[m] || 0;
                  return (
                    <TouchableOpacity
                      key={m}
                      activeOpacity={0.7}
                      onPress={() => toggleMethod(m)}
                      style={[
                        styles.chip,
                        isSelected && {
                          backgroundColor: `${mColor}18`,
                          borderColor: mColor,
                        },
                      ]}>
                      <View style={[styles.methodDot, {backgroundColor: mColor}]} />
                      <Text
                        style={[
                          styles.chipLabel,
                          isSelected && {color: mColor, fontFamily: AppFonts.interBold},
                        ]}>
                        {m}
                      </Text>
                      <View
                        style={[
                          styles.countPill,
                          isSelected && {backgroundColor: `${mColor}25`},
                        ]}>
                        <Text
                          style={[
                            styles.countPillText,
                            isSelected && {color: mColor},
                          ]}>
                          {count}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Section 3: Latency & Speed */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>LATENCY & SPEED</Text>
              <View style={styles.chipsWrap}>
                {[
                  {key: 'all' as const, label: 'All Speeds', color: AppColors.purple, icon: LayersIcon},
                  {key: 'fast' as const, label: 'Fast (<200ms)', color: AppColors.greenColor, icon: BoltIcon, count: counts.fastCount},
                  {key: 'normal' as const, label: 'Normal (200-500ms)', color: AppColors.skyBlue, icon: ClockIcon, count: counts.normalCount},
                  {key: 'slow' as const, label: 'Slow (>500ms)', color: AppColors.errorColor, icon: CircleAlertIcon, count: counts.slowCount},
                ].map(item => {
                  const isSelected = draft.latency === item.key;
                  const IconComp = item.icon;
                  return (
                    <TouchableOpacity
                      key={item.key}
                      activeOpacity={0.7}
                      onPress={() => setDraft(prev => ({...prev, latency: item.key}))}
                      style={[
                        styles.chip,
                        isSelected && {
                          backgroundColor: `${item.color}15`,
                          borderColor: item.color,
                        },
                      ]}>
                      <IconComp
                        size={13}
                        color={isSelected ? item.color : AppColors.grayTextWeak}
                      />
                      <Text
                        style={[
                          styles.chipLabel,
                          isSelected && {color: item.color, fontFamily: AppFonts.interBold},
                        ]}>
                        {item.label}
                      </Text>
                      {item.count != null && (
                        <View style={[styles.countPill, isSelected && {backgroundColor: `${item.color}25`}]}>
                          <Text style={[styles.countPillText, isSelected && {color: item.color}]}>
                            {item.count}
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Section 4: Protocol (HTTPS / HTTP) */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>PROTOCOL</Text>
              <View style={styles.chipsWrap}>
                {[
                  {key: 'all' as const, label: 'All Protocols', color: AppColors.purple, icon: GlobeIcon},
                  {key: 'https' as const, label: 'HTTPS Secure', color: AppColors.mintGreenText, icon: LockIcon, count: counts.httpsCount},
                  {key: 'http' as const, label: 'HTTP Insecure', color: AppColors.amber700, icon: UnlockIcon, count: counts.httpCount},
                ].map(item => {
                  const isSelected = draft.protocol === item.key;
                  const IconComp = item.icon;
                  return (
                    <TouchableOpacity
                      key={item.key}
                      activeOpacity={0.7}
                      onPress={() => setDraft(prev => ({...prev, protocol: item.key}))}
                      style={[
                        styles.chip,
                        isSelected && {
                          backgroundColor: `${item.color}15`,
                          borderColor: item.color,
                        },
                      ]}>
                      <IconComp
                        size={13}
                        color={isSelected ? item.color : AppColors.grayTextWeak}
                      />
                      <Text
                        style={[
                          styles.chipLabel,
                          isSelected && {color: item.color, fontFamily: AppFonts.interBold},
                        ]}>
                        {item.label}
                      </Text>
                      {item.count != null && (
                        <View style={[styles.countPill, isSelected && {backgroundColor: `${item.color}25`}]}>
                          <Text style={[styles.countPillText, isSelected && {color: item.color}]}>
                            {item.count}
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Section 5: Sort By */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>SORT BY</Text>
              <View style={styles.chipsWrap}>
                {[
                  {key: 'time_desc' as const, label: 'Newest First (Default)', icon: ClockIcon},
                  {key: 'time_asc' as const, label: 'Oldest First', icon: HourglassIcon},
                  {key: 'duration_desc' as const, label: 'Slowest Response', icon: TurtleIcon},
                  {key: 'duration_asc' as const, label: 'Fastest Response', icon: RocketIcon},
                  {key: 'size_desc' as const, label: 'Largest Response Size', icon: PackageIcon},
                ].map(item => {
                  const isSelected = draft.sortBy === item.key;
                  const IconComp = item.icon;
                  return (
                    <TouchableOpacity
                      key={item.key}
                      activeOpacity={0.7}
                      onPress={() => setDraft(prev => ({...prev, sortBy: item.key}))}
                      style={[
                        styles.chip,
                        isSelected && {
                          backgroundColor: `${AppColors.purple}15`,
                          borderColor: AppColors.purple,
                        },
                      ]}>
                      <IconComp
                        size={13}
                        color={isSelected ? AppColors.purple : AppColors.grayTextWeak}
                      />
                      <Text
                        style={[
                          styles.chipLabel,
                          isSelected && {color: AppColors.purple, fontFamily: AppFonts.interBold},
                        ]}>
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </ScrollView>

          {/* Footer Action Buttons */}
          <View style={styles.footer}>
            <TouchableScale onPress={handleReset} style={styles.resetBtn}>
              <Text style={styles.resetBtnText}>Reset All</Text>
            </TouchableScale>

            <TouchableScale onPress={handleApply} style={styles.applyBtn}>
              <Text style={styles.applyBtnText}>
                Apply ({previewMatchCount} Request{previewMatchCount === 1 ? '' : 's'})
              </Text>
            </TouchableScale>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: AppColors.primaryLight,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    shadowColor: AppColors.black,
    shadowOffset: {width: 0, height: -4},
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.grayBorderSecondary,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: `${AppColors.purple}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: AppFonts.interBold,
    fontSize: 16,
    color: AppColors.primaryBlack,
  },
  subtitle: {
    fontFamily: AppFonts.interRegular,
    fontSize: 11,
    color: AppColors.grayText,
    marginTop: 1,
  },
  activeBadge: {
    backgroundColor: `${AppColors.purple}20`,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: `${AppColors.purple}40`,
  },
  activeBadgeText: {
    fontFamily: AppFonts.interBold,
    fontSize: 9.5,
    color: AppColors.purple,
  },
  closeBtn: {
    padding: 6,
  },
  scrollArea: {
    maxHeight: 460,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    fontFamily: AppFonts.interBold,
    fontSize: 11,
    color: AppColors.grayTextWeak,
    letterSpacing: 0.8,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: AppColors.grayBackground,
    borderWidth: 1,
    borderColor: AppColors.grayBorderSecondary,
  },
  chipLabel: {
    fontFamily: AppFonts.interMedium,
    fontSize: 12,
    color: AppColors.primaryBlack,
  },
  methodDot: {
    width: 6.5,
    height: 6.5,
    borderRadius: 3.5,
  },
  countPill: {
    backgroundColor: `${AppColors.grayBorderSecondary}50`,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 6,
  },
  countPillText: {
    fontFamily: AppFonts.interBold,
    fontSize: 9.5,
    color: AppColors.grayText,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: AppColors.grayBorderSecondary,
    backgroundColor: AppColors.primaryLight,
  },
  resetBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: AppColors.grayBorderSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppColors.grayBackground,
  },
  resetBtnText: {
    fontFamily: AppFonts.interBold,
    fontSize: 13,
    color: AppColors.grayTextStrong,
  },
  applyBtn: {
    flex: 2,
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppColors.purple,
    shadowColor: AppColors.purple,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  applyBtnText: {
    fontFamily: AppFonts.interBold,
    fontSize: 13,
    color: AppColors.white,
  },
});

export default NetworkFilterModal;
