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
import {AnalyticsFilters, AnalyticsEvent} from '../../types';
import {AppColors} from '../../styles/AppColors';
import {AppFonts} from '../../styles/AppFonts';
import {getEventCategory} from '../../helpers';
import {
  FilterIcon,
  CloseWhite,
  CheckIcon,
  CartIcon,
  GlobeIcon,
  BoltIcon,
  SparkleIcon,
  MoneyIcon,
  ClockIcon,
  HourglassIcon,
  FlameIcon,
  PinIcon,
  RepeatIcon,
  TargetGoalIcon,
  UserIcon,
  UserCheckIcon,
  PackageBoxIcon,
  CodeBracketsIcon,
} from '../NetworkIcons';
import TouchableScale from '../TouchableScale';

interface AnalyticsFilterModalProps {
  visible: boolean;
  onClose: () => void;
}

const DEFAULT_FILTERS: AnalyticsFilters = {
  categories: new Set(['all']),
  screens: new Set(),
  sources: new Set(['all']),
  userTypes: new Set(['all']),
  timeWindow: 'all',
  payloadComplexity: 'all',
  hasRevenue: false,
  hasItems: false,
  hasUserProps: false,
  hasParams: false,
  onlyDuplicates: false,
  onlyConversions: false,
  sortBy: 'time_desc',
};

const AnalyticsFilterModal: React.FC<AnalyticsFilterModalProps> = ({
  visible,
  onClose,
}) => {
  const {
    analyticsEvents,
    analyticsSearch,
    analyticsFilters,
    setAnalyticsFilters,
  } = useInspector();

  // Staged Draft State: applied ONLY on tapping "Apply Filters"
  const [draft, setDraft] = useState<AnalyticsFilters>(() => ({
    ...analyticsFilters,
    categories: new Set(analyticsFilters.categories),
    screens: new Set(analyticsFilters.screens),
    sources: new Set(analyticsFilters.sources || ['all']),
    userTypes: new Set(analyticsFilters.userTypes || ['all']),
  }));

  // Re-sync draft whenever modal opens
  useEffect(() => {
    if (visible) {
      setDraft({
        ...analyticsFilters,
        categories: new Set(analyticsFilters.categories),
        screens: new Set(analyticsFilters.screens),
        sources: new Set(analyticsFilters.sources || ['all']),
        userTypes: new Set(analyticsFilters.userTypes || ['all']),
      });
    }
  }, [visible, analyticsFilters]);

  // Extract unique screen names from logged events
  const uniqueScreens = useMemo(() => {
    const screens = new Set<string>();
    for (const e of analyticsEvents) {
      const scr =
        e.screenName ||
        e.params?.firebase_screen ||
        e.params?.screen_name ||
        e.params?.firebase_screen_class ||
        e.screenClass;
      if (scr && typeof scr === 'string' && scr.trim() !== '') {
        screens.add(scr.trim());
      }
    }
    return Array.from(screens);
  }, [analyticsEvents]);

  // Toggle Category in Draft
  const toggleCategory = (cat: string) => {
    setDraft(prev => {
      const next = new Set(prev.categories);
      if (cat === 'all') {
        return {...prev, categories: new Set(['all'])};
      }
      next.delete('all');
      if (next.has(cat)) {
        next.delete(cat);
        if (next.size === 0) next.add('all');
      } else {
        next.add(cat);
      }
      return {...prev, categories: next};
    });
  };

  // Toggle Screen in Draft
  const toggleScreen = (scr: string) => {
    setDraft(prev => {
      const next = new Set(prev.screens);
      if (next.has(scr)) {
        next.delete(scr);
      } else {
        next.add(scr);
      }
      return {...prev, screens: next};
    });
  };

  // Toggle Source in Draft
  const toggleSource = (src: string) => {
    setDraft(prev => {
      const next = new Set(prev.sources);
      if (src === 'all') {
        return {...prev, sources: new Set(['all'])};
      }
      next.delete('all');
      if (next.has(src)) {
        next.delete(src);
        if (next.size === 0) next.add('all');
      } else {
        next.add(src);
      }
      return {...prev, sources: next};
    });
  };

  // Toggle User Type in Draft
  const toggleUserType = (ut: string) => {
    setDraft(prev => {
      const next = new Set(prev.userTypes);
      if (ut === 'all') {
        return {...prev, userTypes: new Set(['all'])};
      }
      next.delete('all');
      if (next.has(ut)) {
        next.delete(ut);
        if (next.size === 0) next.add('all');
      } else {
        next.add(ut);
      }
      return {...prev, userTypes: next};
    });
  };

  // Toggle Boolean Flag in Draft
  const toggleFlag = (
    key:
      | 'hasRevenue'
      | 'hasItems'
      | 'hasUserProps'
      | 'hasParams'
      | 'onlyDuplicates'
      | 'onlyConversions',
  ) => {
    setDraft(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Set Time Window in Draft
  const setTimeWindow = (tw: 'all' | '1m' | '5m' | '15m' | '1h') => {
    setDraft(prev => ({...prev, timeWindow: tw}));
  };

  // Set Payload Complexity in Draft
  const setPayloadComplexity = (
    pc: 'all' | 'none' | 'simple' | 'heavy',
  ) => {
    setDraft(prev => ({...prev, payloadComplexity: pc}));
  };

  // Set Sort in Draft
  const setSort = (
    sortBy: 'time_desc' | 'time_asc' | 'revenue_desc' | 'count_desc',
  ) => {
    setDraft(prev => ({...prev, sortBy}));
  };

  // Reset Draft to default
  const handleResetDraft = () => {
    setDraft({
      categories: new Set(['all']),
      screens: new Set(),
      sources: new Set(['all']),
      userTypes: new Set(['all']),
      timeWindow: 'all',
      payloadComplexity: 'all',
      hasRevenue: false,
      hasItems: false,
      hasUserProps: false,
      hasParams: false,
      onlyDuplicates: false,
      onlyConversions: false,
      sortBy: 'time_desc',
    });
  };

  // Commit Draft to actual filters
  const handleApply = () => {
    setAnalyticsFilters({
      ...draft,
      categories: new Set(draft.categories),
      screens: new Set(draft.screens),
      sources: new Set(draft.sources),
      userTypes: new Set(draft.userTypes),
    });
    onClose();
  };

  // Discard changes & close
  const handleDiscard = () => {
    setDraft({
      ...analyticsFilters,
      categories: new Set(analyticsFilters.categories),
      screens: new Set(analyticsFilters.screens),
      sources: new Set(analyticsFilters.sources || ['all']),
      userTypes: new Set(analyticsFilters.userTypes || ['all']),
    });
    onClose();
  };

  // Calculate matching count for Draft in real-time
  const draftMatchCount = useMemo(() => {
    let events = analyticsEvents;

    if (analyticsSearch) {
      const s = analyticsSearch.toLowerCase();
      events = events.filter(
        e =>
          e.name.toLowerCase().includes(s) ||
          JSON.stringify(e.params || {}).toLowerCase().includes(s) ||
          (e.screenName ?? '').toLowerCase().includes(s) ||
          (e.pageTitle ?? '').toLowerCase().includes(s),
      );
    }

    if (draft.categories.size > 0 && !draft.categories.has('all')) {
      events = events.filter(e => {
        const cat = getEventCategory(e.name);
        return draft.categories.has(cat);
      });
    }

    if (draft.timeWindow !== 'all') {
      const now = Date.now();
      const cutoff =
        draft.timeWindow === '1m'
          ? now - 60 * 1000
          : draft.timeWindow === '5m'
          ? now - 5 * 60 * 1000
          : draft.timeWindow === '15m'
          ? now - 15 * 60 * 1000
          : now - 60 * 60 * 1000;
      events = events.filter(e => e.timestamp >= cutoff);
    }

    if (draft.sources.size > 0 && !draft.sources.has('all')) {
      events = events.filter(e => draft.sources.has(e.source || 'manual'));
    }

    if (draft.userTypes.size > 0 && !draft.userTypes.has('all')) {
      events = events.filter(e => {
        const isIdentified = Boolean(e.userId && e.userId.trim() !== '');
        if (draft.userTypes.has('identified') && isIdentified) return true;
        if (draft.userTypes.has('anonymous') && !isIdentified) return true;
        return false;
      });
    }

    if (draft.payloadComplexity !== 'all') {
      events = events.filter(e => {
        const count = e.params ? Object.keys(e.params).length : 0;
        if (draft.payloadComplexity === 'none') return count === 0;
        if (draft.payloadComplexity === 'simple') return count >= 1 && count <= 5;
        if (draft.payloadComplexity === 'heavy') return count > 5;
        return true;
      });
    }

    if (draft.onlyConversions) {
      const CONVERSION_PATTERNS = [
        'purchase',
        'item_purchase',
        'ecommerce_purchase',
        'sign_up',
        'login',
        'lead',
        'generate_lead',
        'tutorial_complete',
        'add_payment_info',
        'begin_checkout',
      ];
      events = events.filter(e =>
        CONVERSION_PATTERNS.some(pat => e.name.toLowerCase().includes(pat)),
      );
    }

    if (draft.screens.size > 0) {
      events = events.filter(e => {
        const scr =
          e.screenName ||
          e.params?.firebase_screen ||
          e.params?.screen_name ||
          e.params?.firebase_screen_class ||
          e.screenClass ||
          '';
        return draft.screens.has(scr);
      });
    }

    if (draft.hasRevenue) {
      events = events.filter(e => {
        const val = e.params?.value ?? e.params?.price;
        return val !== undefined && val !== null && Number(val) > 0;
      });
    }

    if (draft.hasItems) {
      events = events.filter(
        e => Array.isArray(e.params?.items) && e.params.items.length > 0,
      );
    }

    if (draft.hasUserProps) {
      events = events.filter(
        e => e.userProperties && Object.keys(e.userProperties).length > 0,
      );
    }

    if (draft.hasParams) {
      events = events.filter(
        e => e.params && Object.keys(e.params).length > 0,
      );
    }

    return events.length;
  }, [analyticsEvents, analyticsSearch, draft]);

  const isAllCategories =
    draft.categories.has('all') || draft.categories.size === 0;
  const isAllSources = draft.sources.has('all') || draft.sources.size === 0;
  const isAllUserTypes =
    draft.userTypes.has('all') || draft.userTypes.size === 0;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleDiscard}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleDiscard} />

        <View style={styles.modalCard}>
          {/* ─── Header ──────────────────────────────────────────────────────── */}
          <View style={styles.header}>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
              <View style={styles.headerIconBox}>
                <FilterIcon color={AppColors.brandPurple} size={15} />
              </View>
              <View>
                <Text style={styles.headerTitle}>Analytics Filters</Text>
                <Text style={styles.headerSubtitle}>
                  GA4 Telemetry Dimensions & Metrics
                </Text>
              </View>
            </View>

            <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
              <TouchableOpacity
                onPress={handleResetDraft}
                hitSlop={8}
                style={styles.resetBtn}>
                <Text style={styles.resetBtnText}>Reset All</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleDiscard}
                hitSlop={10}
                style={styles.closeBtn}>
                <CloseWhite />
              </TouchableOpacity>
            </View>
          </View>

          {/* ─── Scrollable Filter Options ──────────────────────────────────── */}
          <ScrollView
            style={{maxHeight: 460}}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={true}>
            {/* 1. Time Horizon Window */}
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <ClockIcon color={AppColors.grayTextWeak} size={12} />
                <Text style={styles.sectionTitle}>TIME HORIZON</Text>
              </View>
              <View style={styles.chipsWrap}>
                {[
                  {key: 'all' as const, label: 'All Time'},
                  {key: '1m' as const, label: 'Last 1 min'},
                  {key: '5m' as const, label: 'Last 5 mins'},
                  {key: '15m' as const, label: 'Last 15 mins'},
                  {key: '1h' as const, label: 'Last 1 hour'},
                ].map(item => (
                  <TouchableScale
                    key={item.key}
                    onPress={() => setTimeWindow(item.key)}
                    style={[
                      styles.filterPill,
                      draft.timeWindow === item.key &&
                        styles.filterPillActive,
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

            {/* 2. Category Dimensions */}
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <TargetGoalIcon color={AppColors.grayTextWeak} size={12} />
                <Text style={styles.sectionTitle}>EVENT CATEGORIES</Text>
              </View>
              <View style={styles.chipsWrap}>
                <TouchableScale
                  onPress={() => toggleCategory('all')}
                  style={[
                    styles.filterPill,
                    isAllCategories && styles.filterPillActive,
                  ]}>
                  {isAllCategories && (
                    <CheckIcon color={AppColors.white} size={12} />
                  )}
                  <Text
                    style={[
                      styles.filterPillText,
                      isAllCategories && styles.filterPillTextActive,
                    ]}>
                    All Categories
                  </Text>
                </TouchableScale>

                <TouchableScale
                  onPress={() => toggleCategory('ecommerce')}
                  style={[
                    styles.filterPill,
                    draft.categories.has('ecommerce') &&
                      styles.filterPillActive,
                  ]}>
                  <CartIcon
                    color={
                      draft.categories.has('ecommerce')
                        ? AppColors.white
                        : AppColors.amber700
                    }
                    size={13}
                  />
                  <Text
                    style={[
                      styles.filterPillText,
                      draft.categories.has('ecommerce') &&
                        styles.filterPillTextActive,
                    ]}>
                    Ecommerce
                  </Text>
                </TouchableScale>

                <TouchableScale
                  onPress={() => toggleCategory('page_view')}
                  style={[
                    styles.filterPill,
                    draft.categories.has('page_view') &&
                      styles.filterPillActive,
                  ]}>
                  <GlobeIcon
                    color={
                      draft.categories.has('page_view')
                        ? AppColors.white
                        : AppColors.sky600
                    }
                    size={13}
                  />
                  <Text
                    style={[
                      styles.filterPillText,
                      draft.categories.has('page_view') &&
                        styles.filterPillTextActive,
                    ]}>
                    Screens & Pages
                  </Text>
                </TouchableScale>

                <TouchableScale
                  onPress={() => toggleCategory('system')}
                  style={[
                    styles.filterPill,
                    draft.categories.has('system') &&
                      styles.filterPillActive,
                  ]}>
                  <BoltIcon
                    color={
                      draft.categories.has('system')
                        ? AppColors.white
                        : AppColors.purple
                    }
                    size={13}
                  />
                  <Text
                    style={[
                      styles.filterPillText,
                      draft.categories.has('system') &&
                        styles.filterPillTextActive,
                    ]}>
                    System & Lifecycle
                  </Text>
                </TouchableScale>

                <TouchableScale
                  onPress={() => toggleCategory('custom')}
                  style={[
                    styles.filterPill,
                    draft.categories.has('custom') &&
                      styles.filterPillActive,
                  ]}>
                  <SparkleIcon
                    color={
                      draft.categories.has('custom')
                        ? AppColors.white
                        : AppColors.brandPurple
                    }
                    size={13}
                  />
                  <Text
                    style={[
                      styles.filterPillText,
                      draft.categories.has('custom') &&
                        styles.filterPillTextActive,
                    ]}>
                    Custom Events
                  </Text>
                </TouchableScale>
              </View>
            </View>

            {/* 3. Goals, Monetization & Attributes */}
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <MoneyIcon color={AppColors.grayTextWeak} size={12} />
                <Text style={styles.sectionTitle}>
                  MONETIZATION & ATTRIBUTES
                </Text>
              </View>
              <View style={styles.chipsWrap}>
                <TouchableScale
                  onPress={() => toggleFlag('onlyConversions')}
                  style={[
                    styles.filterPill,
                    draft.onlyConversions && styles.filterPillActive,
                  ]}>
                  <TargetGoalIcon
                    color={
                      draft.onlyConversions
                        ? AppColors.white
                        : AppColors.brandPurple
                    }
                    size={13}
                  />
                  <Text
                    style={[
                      styles.filterPillText,
                      draft.onlyConversions && styles.filterPillTextActive,
                    ]}>
                    Conversion Events Only
                  </Text>
                </TouchableScale>

                <TouchableScale
                  onPress={() => toggleFlag('hasRevenue')}
                  style={[
                    styles.filterPill,
                    draft.hasRevenue && styles.filterPillActive,
                  ]}>
                  <MoneyIcon
                    color={
                      draft.hasRevenue
                        ? AppColors.white
                        : AppColors.emerald600
                    }
                    size={13}
                  />
                  <Text
                    style={[
                      styles.filterPillText,
                      draft.hasRevenue && styles.filterPillTextActive,
                    ]}>
                    With Revenue (Value &gt; 0)
                  </Text>
                </TouchableScale>

                <TouchableScale
                  onPress={() => toggleFlag('hasItems')}
                  style={[
                    styles.filterPill,
                    draft.hasItems && styles.filterPillActive,
                  ]}>
                  <PackageBoxIcon
                    color={
                      draft.hasItems
                        ? AppColors.white
                        : AppColors.amber700
                    }
                    size={13}
                  />
                  <Text
                    style={[
                      styles.filterPillText,
                      draft.hasItems && styles.filterPillTextActive,
                    ]}>
                    With Items Payload
                  </Text>
                </TouchableScale>

                <TouchableScale
                  onPress={() => toggleFlag('hasUserProps')}
                  style={[
                    styles.filterPill,
                    draft.hasUserProps && styles.filterPillActive,
                  ]}>
                  <SparkleIcon
                    color={
                      draft.hasUserProps
                        ? AppColors.white
                        : AppColors.brandPurple
                    }
                    size={13}
                  />
                  <Text
                    style={[
                      styles.filterPillText,
                      draft.hasUserProps && styles.filterPillTextActive,
                    ]}>
                    With User Properties
                  </Text>
                </TouchableScale>

                <TouchableScale
                  onPress={() => toggleFlag('hasParams')}
                  style={[
                    styles.filterPill,
                    draft.hasParams && styles.filterPillActive,
                  ]}>
                  <CodeBracketsIcon
                    color={
                      draft.hasParams
                        ? AppColors.white
                        : AppColors.grayText
                    }
                    size={13}
                  />
                  <Text
                    style={[
                      styles.filterPillText,
                      draft.hasParams && styles.filterPillTextActive,
                    ]}>
                    With Custom Params
                  </Text>
                </TouchableScale>

                <TouchableScale
                  onPress={() => toggleFlag('onlyDuplicates')}
                  style={[
                    styles.filterPill,
                    draft.onlyDuplicates && styles.filterPillActive,
                  ]}>
                  <RepeatIcon
                    color={
                      draft.onlyDuplicates
                        ? AppColors.white
                        : AppColors.rose600
                    }
                    size={13}
                  />
                  <Text
                    style={[
                      styles.filterPillText,
                      draft.onlyDuplicates && styles.filterPillTextActive,
                    ]}>
                    Frequent Only (&gt; 1×)
                  </Text>
                </TouchableScale>
              </View>
            </View>

            {/* 4. User Identification */}
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <UserIcon color={AppColors.grayTextWeak} size={12} />
                <Text style={styles.sectionTitle}>USER IDENTIFICATION</Text>
              </View>
              <View style={styles.chipsWrap}>
                <TouchableScale
                  onPress={() => toggleUserType('all')}
                  style={[
                    styles.filterPill,
                    isAllUserTypes && styles.filterPillActive,
                  ]}>
                  {isAllUserTypes && (
                    <CheckIcon color={AppColors.white} size={12} />
                  )}
                  <Text
                    style={[
                      styles.filterPillText,
                      isAllUserTypes && styles.filterPillTextActive,
                    ]}>
                    All Users
                  </Text>
                </TouchableScale>

                <TouchableScale
                  onPress={() => toggleUserType('identified')}
                  style={[
                    styles.filterPill,
                    draft.userTypes.has('identified') &&
                      styles.filterPillActive,
                  ]}>
                  <UserCheckIcon
                    color={
                      draft.userTypes.has('identified')
                        ? AppColors.white
                        : AppColors.greenColor
                    }
                    size={13}
                  />
                  <Text
                    style={[
                      styles.filterPillText,
                      draft.userTypes.has('identified') &&
                        styles.filterPillTextActive,
                    ]}>
                    Identified (User ID)
                  </Text>
                </TouchableScale>

                <TouchableScale
                  onPress={() => toggleUserType('anonymous')}
                  style={[
                    styles.filterPill,
                    draft.userTypes.has('anonymous') &&
                      styles.filterPillActive,
                  ]}>
                  <UserIcon
                    color={
                      draft.userTypes.has('anonymous')
                        ? AppColors.white
                        : AppColors.grayTextWeak
                    }
                    size={13}
                  />
                  <Text
                    style={[
                      styles.filterPillText,
                      draft.userTypes.has('anonymous') &&
                        styles.filterPillTextActive,
                    ]}>
                    Anonymous
                  </Text>
                </TouchableScale>
              </View>
            </View>

            {/* 5. Source Logger SDK */}
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <BoltIcon color={AppColors.grayTextWeak} size={12} />
                <Text style={styles.sectionTitle}>EVENT SOURCE</Text>
              </View>
              <View style={styles.chipsWrap}>
                <TouchableScale
                  onPress={() => toggleSource('all')}
                  style={[
                    styles.filterPill,
                    isAllSources && styles.filterPillActive,
                  ]}>
                  {isAllSources && (
                    <CheckIcon color={AppColors.white} size={12} />
                  )}
                  <Text
                    style={[
                      styles.filterPillText,
                      isAllSources && styles.filterPillTextActive,
                    ]}>
                    All Sources
                  </Text>
                </TouchableScale>

                <TouchableScale
                  onPress={() => toggleSource('firebase')}
                  style={[
                    styles.filterPill,
                    draft.sources.has('firebase') &&
                      styles.filterPillActive,
                  ]}>
                  <Text
                    style={[
                      styles.filterPillText,
                      draft.sources.has('firebase') &&
                        styles.filterPillTextActive,
                    ]}>
                    Firebase / GA SDK
                  </Text>
                </TouchableScale>

                <TouchableScale
                  onPress={() => toggleSource('manual')}
                  style={[
                    styles.filterPill,
                    draft.sources.has('manual') &&
                      styles.filterPillActive,
                  ]}>
                  <Text
                    style={[
                      styles.filterPillText,
                      draft.sources.has('manual') &&
                        styles.filterPillTextActive,
                    ]}>
                    In-App Logger
                  </Text>
                </TouchableScale>
              </View>
            </View>

            {/* 6. Payload Complexity */}
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <CodeBracketsIcon color={AppColors.grayTextWeak} size={12} />
                <Text style={styles.sectionTitle}>PAYLOAD COMPLEXITY</Text>
              </View>
              <View style={styles.chipsWrap}>
                {[
                  {key: 'all' as const, label: 'All Payloads'},
                  {key: 'none' as const, label: '0 Params'},
                  {key: 'simple' as const, label: '1 - 5 Params'},
                  {key: 'heavy' as const, label: '> 5 Params'},
                ].map(item => (
                  <TouchableScale
                    key={item.key}
                    onPress={() => setPayloadComplexity(item.key)}
                    style={[
                      styles.filterPill,
                      draft.payloadComplexity === item.key &&
                        styles.filterPillActive,
                    ]}>
                    <Text
                      style={[
                        styles.filterPillText,
                        draft.payloadComplexity === item.key &&
                          styles.filterPillTextActive,
                      ]}>
                      {item.label}
                    </Text>
                  </TouchableScale>
                ))}
              </View>
            </View>

            {/* 7. Discovered Screens (Dimensions) */}
            {uniqueScreens.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeaderRow}>
                  <PinIcon color={AppColors.grayTextWeak} size={12} />
                  <Text style={styles.sectionTitle}>
                    DISCOVERED SCREENS ({uniqueScreens.length})
                  </Text>
                </View>
                <View style={styles.chipsWrap}>
                  {uniqueScreens.map(scr => {
                    const isSelected = draft.screens.has(scr);
                    return (
                      <TouchableScale
                        key={scr}
                        onPress={() => toggleScreen(scr)}
                        style={[
                          styles.filterPill,
                          isSelected && styles.filterPillActive,
                        ]}>
                        <PinIcon
                          color={
                            isSelected
                              ? AppColors.white
                              : AppColors.amber700
                          }
                          size={12}
                        />
                        <Text
                          style={[
                            styles.filterPillText,
                            isSelected && styles.filterPillTextActive,
                          ]}>
                          {scr}
                        </Text>
                      </TouchableScale>
                    );
                  })}
                </View>
              </View>
            )}

            {/* 8. Sort Order */}
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <ClockIcon color={AppColors.grayTextWeak} size={12} />
                <Text style={styles.sectionTitle}>SORT ORDER</Text>
              </View>
              <View style={styles.chipsWrap}>
                <TouchableScale
                  onPress={() => setSort('time_desc')}
                  style={[
                    styles.filterPill,
                    draft.sortBy === 'time_desc' &&
                      styles.filterPillActive,
                  ]}>
                  <ClockIcon
                    color={
                      draft.sortBy === 'time_desc'
                        ? AppColors.white
                        : AppColors.grayText
                    }
                    size={12}
                  />
                  <Text
                    style={[
                      styles.filterPillText,
                      draft.sortBy === 'time_desc' &&
                        styles.filterPillTextActive,
                    ]}>
                    Newest First (Default)
                  </Text>
                </TouchableScale>

                <TouchableScale
                  onPress={() => setSort('time_asc')}
                  style={[
                    styles.filterPill,
                    draft.sortBy === 'time_asc' &&
                      styles.filterPillActive,
                  ]}>
                  <HourglassIcon
                    color={
                      draft.sortBy === 'time_asc'
                        ? AppColors.white
                        : AppColors.grayText
                    }
                    size={12}
                  />
                  <Text
                    style={[
                      styles.filterPillText,
                      draft.sortBy === 'time_asc' &&
                        styles.filterPillTextActive,
                    ]}>
                    Oldest First
                  </Text>
                </TouchableScale>

                <TouchableScale
                  onPress={() => setSort('revenue_desc')}
                  style={[
                    styles.filterPill,
                    draft.sortBy === 'revenue_desc' &&
                      styles.filterPillActive,
                  ]}>
                  <MoneyIcon
                    color={
                      draft.sortBy === 'revenue_desc'
                        ? AppColors.white
                        : AppColors.emerald600
                    }
                    size={12}
                  />
                  <Text
                    style={[
                      styles.filterPillText,
                      draft.sortBy === 'revenue_desc' &&
                        styles.filterPillTextActive,
                    ]}>
                    Highest Revenue
                  </Text>
                </TouchableScale>

                <TouchableScale
                  onPress={() => setSort('count_desc')}
                  style={[
                    styles.filterPill,
                    draft.sortBy === 'count_desc' &&
                      styles.filterPillActive,
                  ]}>
                  <FlameIcon
                    color={
                      draft.sortBy === 'count_desc'
                        ? AppColors.white
                        : AppColors.darkOrange
                    }
                    size={12}
                  />
                  <Text
                    style={[
                      styles.filterPillText,
                      draft.sortBy === 'count_desc' &&
                        styles.filterPillTextActive,
                    ]}>
                    Most Frequent
                  </Text>
                </TouchableScale>
              </View>
            </View>
          </ScrollView>

          {/* ─── Footer Action Bar (Discard + Apply) ────────────────────────── */}
          <View style={styles.footer}>
            <TouchableOpacity
              onPress={handleDiscard}
              style={styles.discardBtn}
              activeOpacity={0.8}>
              <Text style={styles.discardBtnText}>Discard</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleApply}
              style={styles.applyBtn}
              activeOpacity={0.85}>
              <Text style={styles.applyBtnText}>
                Apply ({draftMatchCount} Events)
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

export default AnalyticsFilterModal;
