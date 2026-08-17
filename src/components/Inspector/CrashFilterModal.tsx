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
import {CrashFilterType} from '../../types/enums';
import {AppColors} from '../../styles/AppColors';
import {AppFonts} from '../../styles/AppFonts';
import {useTranslation} from '../../i18n';
import {
  FilterIcon,
  CloseWhite,
  CheckIcon,
  ClockIcon,
  HourglassIcon,
  SkullIcon,
  JsIcon,
  LayoutIcon,
  ChipIcon,
  AppleIcon,
  AndroidIcon,
  BoltIcon,
} from '../NetworkIcons';
import TouchableScale from '../TouchableScale';

export interface CrashFilters {
  types: Set<CrashFilterType>;
  timeWindow: 'all' | '15m' | '1h' | '24h' | '7d';
  platform: 'all' | 'ios' | 'android';
  engine: 'all' | 'hermes' | 'jsc';
  sortBy: 'time_desc' | 'time_asc';
}

export const DEFAULT_CRASH_FILTERS: CrashFilters = {
  types: new Set(['all']),
  timeWindow: 'all',
  platform: 'all',
  engine: 'all',
  sortBy: 'time_desc',
};

export const isCrashFiltersDefault = (f: CrashFilters): boolean =>
  (f.types.has('all') || f.types.size === 0) &&
  f.timeWindow === 'all' &&
  f.platform === 'all' &&
  f.engine === 'all' &&
  f.sortBy === 'time_desc';

interface CrashFilterModalProps {
  visible: boolean;
  onClose: () => void;
  filters: CrashFilters;
  onApply: (filters: CrashFilters) => void;
  searchQuery?: string;
}

const CrashFilterModal: React.FC<CrashFilterModalProps> = ({
  visible,
  onClose,
  filters,
  onApply,
  searchQuery = '',
}) => {
  const {t} = useTranslation();
  const {crashRecords} = useInspector();

  const [draft, setDraft] = useState<CrashFilters>(() => ({
    ...filters,
    types: new Set(filters.types),
  }));

  useEffect(() => {
    if (visible) {
      setDraft({
        ...filters,
        types: new Set(filters.types),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const toggleType = (key: CrashFilterType) => {
    setDraft(prev => {
      const next = new Set(prev.types);
      if (key === 'all') {
        return {...prev, types: new Set(['all'])};
      }
      next.delete('all');
      if (next.has(key)) {
        next.delete(key);
        if (next.size === 0) next.add('all');
      } else {
        next.add(key);
      }
      return {...prev, types: next};
    });
  };

  const setTimeWindow = (tw: CrashFilters['timeWindow']) => {
    setDraft(prev => ({...prev, timeWindow: tw}));
  };

  const setPlatform = (p: CrashFilters['platform']) => {
    setDraft(prev => ({...prev, platform: p}));
  };

  const setEngine = (e: CrashFilters['engine']) => {
    setDraft(prev => ({...prev, engine: e}));
  };

  const setSort = (sortBy: CrashFilters['sortBy']) => {
    setDraft(prev => ({...prev, sortBy}));
  };

  const handleResetDraft = () => {
    setDraft({
      ...DEFAULT_CRASH_FILTERS,
      types: new Set(DEFAULT_CRASH_FILTERS.types),
    });
  };

  const handleApply = () => {
    onApply({
      ...draft,
      types: new Set(draft.types),
    });
    onClose();
  };

  const handleDiscard = () => {
    setDraft({
      ...filters,
      types: new Set(filters.types),
    });
    onClose();
  };

  const draftMatchCount = useMemo(() => {
    let crashes = crashRecords;

    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase();
      crashes = crashes.filter(
        c =>
          (c.message || '').toLowerCase().includes(q) ||
          (c.name || '').toLowerCase().includes(q) ||
          (c.stack || '').toLowerCase().includes(q),
      );
    }

    if (draft.types.size > 0 && !draft.types.has('all')) {
      crashes = crashes.filter(c => {
        if (draft.types.has('fatal') && c.isFatal) return true;
        if (draft.types.has('js') && c.type === 'js') return true;
        if (draft.types.has('promise') && c.type === 'promise') return true;
        if (draft.types.has('render') && c.type === 'render') return true;
        if (draft.types.has('native') && c.type === 'native') return true;
        return false;
      });
    }

    if (draft.timeWindow !== 'all') {
      const now = Date.now();
      const cutoff =
        draft.timeWindow === '15m'
          ? now - 15 * 60 * 1000
          : draft.timeWindow === '1h'
          ? now - 60 * 60 * 1000
          : draft.timeWindow === '24h'
          ? now - 24 * 60 * 60 * 1000
          : now - 7 * 24 * 60 * 60 * 1000;
      crashes = crashes.filter(c => c.timestamp >= cutoff);
    }

    if (draft.platform !== 'all') {
      crashes = crashes.filter(
        c =>
          (c.deviceInfo?.platform || '').toLowerCase() === draft.platform,
      );
    }

    if (draft.engine !== 'all') {
      crashes = crashes.filter(c => {
        const isHermes = c.deviceInfo?.isHermes;
        if (draft.engine === 'hermes') return isHermes === true;
        return isHermes === false || isHermes === undefined;
      });
    }

    return crashes.length;
  }, [crashRecords, searchQuery, draft]);

  const isAllTypes = draft.types.has('all') || draft.types.size === 0;

  const typeChips: Array<{
    key: CrashFilterType;
    label: string;
    Icon: React.ComponentType<{size?: number; color?: string}>;
    color: string;
  }> = [
    {key: 'all', label: t('crash.filterTypeAll'), Icon: FilterIcon, color: AppColors.grayTextStrong},
    {key: 'fatal', label: t('crash.filterFatal'), Icon: SkullIcon, color: AppColors.errorColor},
    {key: 'js', label: t('crash.filterJsError'), Icon: JsIcon, color: AppColors.sky600},
    {key: 'promise', label: t('crash.filterPromise'), Icon: HourglassIcon, color: AppColors.darkOrange},
    {key: 'render', label: t('crash.filterRender'), Icon: LayoutIcon, color: AppColors.purple},
    {key: 'native', label: t('crash.filterNative'), Icon: ChipIcon, color: AppColors.amber700},
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleDiscard}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleDiscard} />

        <View style={styles.modalCard}>
          <View style={styles.header}>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
              <View style={styles.headerIconBox}>
                <FilterIcon color={AppColors.brandPurple} size={15} />
              </View>
              <View>
                <Text style={styles.headerTitle}>{t('crash.filterTitle')}</Text>
                <Text style={styles.headerSubtitle}>
                  {t('crash.filterSubtitle')}
                </Text>
              </View>
            </View>

            <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
              <TouchableOpacity
                onPress={handleResetDraft}
                hitSlop={8}
                style={styles.resetBtn}>
                <Text style={styles.resetBtnText}>{t('crash.filterReset')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleDiscard}
                hitSlop={10}
                style={styles.closeBtn}>
                <CloseWhite />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView
            style={{maxHeight: 460}}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={true}>
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <SkullIcon color={AppColors.grayTextWeak} size={12} />
                <Text style={styles.sectionTitle}>
                  {t('crash.filterTypeSection')}
                </Text>
              </View>
              <View style={styles.chipsWrap}>
                {typeChips.map(chip => {
                  const isSelected =
                    chip.key === 'all' ? isAllTypes : draft.types.has(chip.key);
                  return (
                    <TouchableScale
                      key={chip.key}
                      onPress={() => toggleType(chip.key)}
                      style={[
                        styles.filterPill,
                        isSelected && styles.filterPillActive,
                      ]}>
                      {chip.key === 'all' && isSelected && (
                        <CheckIcon color={AppColors.white} size={12} />
                      )}
                      <chip.Icon
                        size={12}
                        color={
                          isSelected ? AppColors.white : chip.color
                        }
                      />
                      <Text
                        style={[
                          styles.filterPillText,
                          isSelected && styles.filterPillTextActive,
                        ]}>
                        {chip.label}
                      </Text>
                    </TouchableScale>
                  );
                })}
              </View>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <ClockIcon color={AppColors.grayTextWeak} size={12} />
                <Text style={styles.sectionTitle}>
                  {t('crash.filterTimeSection')}
                </Text>
              </View>
              <View style={styles.chipsWrap}>
                {[
                  {key: 'all' as const, label: t('crash.filterTimeAll')},
                  {key: '15m' as const, label: t('crash.filterTime15m')},
                  {key: '1h' as const, label: t('crash.filterTime1h')},
                  {key: '24h' as const, label: t('crash.filterTime24h')},
                  {key: '7d' as const, label: t('crash.filterTime7d')},
                ].map(item => (
                  <TouchableScale
                    key={item.key}
                    onPress={() => setTimeWindow(item.key)}
                    style={[
                      styles.filterPill,
                      draft.timeWindow === item.key && styles.filterPillActive,
                    ]}>
                    <Text
                      style={[
                        styles.filterPillText,
                        draft.timeWindow === item.key &&
                          styles.filterPillTextActive,
                      ]}>
                      {item.label}
                    </Text>
                  </TouchableScale>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <AppleIcon color={AppColors.grayTextWeak} size={12} />
                <Text style={styles.sectionTitle}>
                  {t('crash.filterPlatformSection')}
                </Text>
              </View>
              <View style={styles.chipsWrap}>
                <TouchableScale
                  onPress={() => setPlatform('all')}
                  style={[
                    styles.filterPill,
                    draft.platform === 'all' && styles.filterPillActive,
                  ]}>
                  <Text
                    style={[
                      styles.filterPillText,
                      draft.platform === 'all' && styles.filterPillTextActive,
                    ]}>
                    {t('crash.filterPlatformAll')}
                  </Text>
                </TouchableScale>

                <TouchableScale
                  onPress={() => setPlatform('ios')}
                  style={[
                    styles.filterPill,
                    draft.platform === 'ios' && styles.filterPillActive,
                  ]}>
                  <AppleIcon
                    size={12}
                    color={
                      draft.platform === 'ios'
                        ? AppColors.white
                        : AppColors.grayTextStrong
                    }
                  />
                  <Text
                    style={[
                      styles.filterPillText,
                      draft.platform === 'ios' && styles.filterPillTextActive,
                    ]}>
                    {t('crash.filterPlatformIos')}
                  </Text>
                </TouchableScale>

                <TouchableScale
                  onPress={() => setPlatform('android')}
                  style={[
                    styles.filterPill,
                    draft.platform === 'android' && styles.filterPillActive,
                  ]}>
                  <AndroidIcon
                    size={12}
                    color={
                      draft.platform === 'android'
                        ? AppColors.white
                        : AppColors.greenColor
                    }
                  />
                  <Text
                    style={[
                      styles.filterPillText,
                      draft.platform === 'android' && styles.filterPillTextActive,
                    ]}>
                    {t('crash.filterPlatformAndroid')}
                  </Text>
                </TouchableScale>
              </View>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <BoltIcon color={AppColors.grayTextWeak} size={12} />
                <Text style={styles.sectionTitle}>
                  {t('crash.filterEngineSection')}
                </Text>
              </View>
              <View style={styles.chipsWrap}>
                <TouchableScale
                  onPress={() => setEngine('all')}
                  style={[
                    styles.filterPill,
                    draft.engine === 'all' && styles.filterPillActive,
                  ]}>
                  <Text
                    style={[
                      styles.filterPillText,
                      draft.engine === 'all' && styles.filterPillTextActive,
                    ]}>
                    {t('crash.filterEngineAll')}
                  </Text>
                </TouchableScale>

                <TouchableScale
                  onPress={() => setEngine('hermes')}
                  style={[
                    styles.filterPill,
                    draft.engine === 'hermes' && styles.filterPillActive,
                  ]}>
                  <BoltIcon
                    size={12}
                    color={
                      draft.engine === 'hermes'
                        ? AppColors.white
                        : AppColors.brandPurple
                    }
                  />
                  <Text
                    style={[
                      styles.filterPillText,
                      draft.engine === 'hermes' && styles.filterPillTextActive,
                    ]}>
                    {t('crash.filterEngineHermes')}
                  </Text>
                </TouchableScale>

                <TouchableScale
                  onPress={() => setEngine('jsc')}
                  style={[
                    styles.filterPill,
                    draft.engine === 'jsc' && styles.filterPillActive,
                  ]}>
                  <Text
                    style={[
                      styles.filterPillText,
                      draft.engine === 'jsc' && styles.filterPillTextActive,
                    ]}>
                    {t('crash.jsc')}
                  </Text>
                </TouchableScale>
              </View>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <ClockIcon color={AppColors.grayTextWeak} size={12} />
                <Text style={styles.sectionTitle}>
                  {t('crash.filterSortSection')}
                </Text>
              </View>
              <View style={styles.chipsWrap}>
                <TouchableScale
                  onPress={() => setSort('time_desc')}
                  style={[
                    styles.filterPill,
                    draft.sortBy === 'time_desc' && styles.filterPillActive,
                  ]}>
                  <ClockIcon
                    size={12}
                    color={
                      draft.sortBy === 'time_desc'
                        ? AppColors.white
                        : AppColors.grayText
                    }
                  />
                  <Text
                    style={[
                      styles.filterPillText,
                      draft.sortBy === 'time_desc' &&
                        styles.filterPillTextActive,
                    ]}>
                    {t('crash.filterSortNewest')}
                  </Text>
                </TouchableScale>

                <TouchableScale
                  onPress={() => setSort('time_asc')}
                  style={[
                    styles.filterPill,
                    draft.sortBy === 'time_asc' && styles.filterPillActive,
                  ]}>
                  <HourglassIcon
                    size={12}
                    color={
                      draft.sortBy === 'time_asc'
                        ? AppColors.white
                        : AppColors.grayText
                    }
                  />
                  <Text
                    style={[
                      styles.filterPillText,
                      draft.sortBy === 'time_asc' &&
                        styles.filterPillTextActive,
                    ]}>
                    {t('crash.filterSortOldest')}
                  </Text>
                </TouchableScale>
              </View>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              onPress={handleDiscard}
              style={styles.discardBtn}
              activeOpacity={0.8}>
              <Text style={styles.discardBtnText}>
                {t('crash.filterDiscard')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleApply}
              style={styles.applyBtn}
              activeOpacity={0.85}>
              <Text style={styles.applyBtnText}>
                {t('crash.filterApply', {count: draftMatchCount})}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: `${AppColors.primaryBlack}85`,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: AppColors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: AppColors.dividerColor,
    shadowColor: AppColors.black,
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: {width: 0, height: 4},
    elevation: 8,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.dividerColor,
    backgroundColor: `${AppColors.brandPurple}08`,
  },
  headerIconBox: {
    width: 28,
    height: 28,
    borderRadius: 7,
    backgroundColor: `${AppColors.brandPurple}18`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: AppFonts.interBold,
    fontSize: 13.5,
    color: AppColors.primaryBlack,
  },
  headerSubtitle: {
    fontFamily: AppFonts.interMedium,
    fontSize: 10,
    color: AppColors.grayTextWeak,
  },
  resetBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 5,
    backgroundColor: `${AppColors.darkOrange}14`,
    borderWidth: 1,
    borderColor: `${AppColors.darkOrange}30`,
  },
  resetBtnText: {
    fontFamily: AppFonts.interBold,
    fontSize: 10,
    color: AppColors.darkOrange,
  },
  closeBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: `${AppColors.primaryBlack}18`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 14,
    gap: 14,
  },
  section: {
    gap: 7,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  sectionTitle: {
    fontFamily: AppFonts.interBold,
    fontSize: 9.5,
    color: AppColors.grayTextWeak,
    letterSpacing: 0.5,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6.5,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 5.5,
    borderRadius: 7,
    backgroundColor: AppColors.grayBackground,
    borderWidth: 1,
    borderColor: AppColors.dividerColor,
  },
  filterPillActive: {
    backgroundColor: AppColors.brandPurple,
    borderColor: AppColors.brandPurple,
    shadowColor: AppColors.brandPurple,
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 2,
  },
  filterPillText: {
    fontFamily: AppFonts.interMedium,
    fontSize: 11,
    color: AppColors.primaryBlack,
  },
  filterPillTextActive: {
    color: AppColors.white,
    fontFamily: AppFonts.interBold,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: AppColors.dividerColor,
    backgroundColor: AppColors.grayBackground,
  },
  discardBtn: {
    flex: 1,
    paddingVertical: 9.5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: AppColors.dividerColor,
    backgroundColor: AppColors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  discardBtnText: {
    fontFamily: AppFonts.interBold,
    fontSize: 12.5,
    color: AppColors.grayTextStrong,
  },
  applyBtn: {
    flex: 2,
    backgroundColor: AppColors.brandPurple,
    paddingVertical: 9.5,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: AppColors.brandPurple,
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 2,
  },
  applyBtnText: {
    fontFamily: AppFonts.interBold,
    fontSize: 12.5,
    color: AppColors.white,
  },
});

export default CrashFilterModal;