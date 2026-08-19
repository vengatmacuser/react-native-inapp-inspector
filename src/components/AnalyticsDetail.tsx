import React, {useState, useMemo} from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

// Components
import CopyButton from './CopyButton';
import JsonViewer from './JsonViewer';
import SegmentedTabs from './SegmentedTabs';
import TouchableScale from './TouchableScale';
import HighlightText from './HighlightText';
import AnimatedEntrance from './AnimatedEntrance';

// Helpers & Icons
import {AppFonts} from '../styles/AppFonts';
import {AppColors} from '../styles/AppColors';
import {getSize, formatDateTime, formatTime} from '../helpers';
import {getEventCategory} from '../helpers/gaAnalyticsRegistry';
import {useTranslation} from '../i18n';
import {
  SparkleIcon,
  ClockIcon,
  SearchIcon,
  ClearIcon,
  LayersIcon,
  CartIcon,
  GlobeIcon,
  BoltIcon,
  PinIcon,
  MoneyIcon,
  PrettyIcon,
  RawIcon,
  TableIcon,
  DocIcon,
} from './NetworkIcons';

// Type Definition
import {AnalyticsEvent} from '../types';

type DetailViewTab = 'overview' | 'tree' | 'raw';

const AnalyticsDetail = ({
  event,
}: {
  event: AnalyticsEvent;
}): React.JSX.Element => {
  const {t} = useTranslation();
  const [activeViewTab, setActiveViewTab] = useState<DetailViewTab>('overview');
  const [paramSearch, setParamSearch] = useState('');

  const params = useMemo(() => event.params ?? {}, [event.params]);
  const userProperties = useMemo(() => event.userProperties ?? {}, [event.userProperties]);

  const paramKeys = useMemo(() => Object.keys(params), [params]);
  const userPropKeys = useMemo(() => Object.keys(userProperties), [userProperties]);

  const category = useMemo(() => getEventCategory(event.name, params), [event.name, params]);

  // Combined full JSON payload
  const fullJsonData = useMemo(() => ({
    name: event.name,
    timestamp: event.timestamp,
    source: event.source,
    ...(event.screenName ? {screenName: event.screenName} : {}),
    ...(event.screenClass ? {screenClass: event.screenClass} : {}),
    ...(event.userId ? {userId: event.userId} : {}),
    ...(event.sessionId ? {sessionId: event.sessionId} : {}),
    ...(event.trackingId ? {trackingId: event.trackingId} : {}),
    params,
    ...(userPropKeys.length > 0 ? {userProperties} : {}),
  }), [event, params, userPropKeys.length, userProperties]);

  // E-commerce revenue calculation
  const revenueInfo = useMemo(() => {
    const val = params.value ?? params.price;
    const currency = params.currency ?? 'USD';
    if (val !== undefined && val !== null && !isNaN(Number(val))) {
      return {
        amount: Number(val).toFixed(2),
        currency: String(currency).toUpperCase(),
      };
    }
    return null;
  }, [params]);

  // Items count if an items array exists
  const itemsCount = useMemo(() => {
    if (Array.isArray(params.items)) {
      return params.items.length;
    }
    return null;
  }, [params.items]);

  // Screen Context
  const screenContext = useMemo(() => {
    return (
      event.screenName ||
      params.firebase_screen ||
      params.screen_name ||
      params.page_title ||
      event.screenClass ||
      params.firebase_screen_class
    );
  }, [event.screenName, event.screenClass, params]);

  // Filtered parameter entries
  const filteredParamEntries = useMemo(() => {
    const entries = Object.entries(params);
    if (!paramSearch.trim()) return entries;
    const q = paramSearch.toLowerCase();
    return entries.filter(([k, v]) => {
      const valStr = typeof v === 'object' ? JSON.stringify(v) : String(v);
      return k.toLowerCase().includes(q) || valStr.toLowerCase().includes(q);
    });
  }, [params, paramSearch]);

  // Category Theme Meta
  const catMeta = useMemo(() => {
    switch (category) {
      case 'ecommerce':
        return {
          label: t('analytics.ecommerceCategory'),
          color: AppColors.amber700,
          bg: AppColors.amber100,
          border: AppColors.amber200,
          icon: (color: string) => <CartIcon color={color} size={11} />,
        };
      case 'page_view':
        return {
          label: t('analytics.screensCategory'),
          color: AppColors.sky600,
          bg: AppColors.sky100,
          border: AppColors.sky400,
          icon: (color: string) => <GlobeIcon color={color} size={11} />,
        };
      case 'system':
        return {
          label: t('analytics.systemCategory'),
          color: AppColors.purple,
          bg: AppColors.purple100,
          border: AppColors.purple200,
          icon: (color: string) => <BoltIcon color={color} size={11} />,
        };
      default:
        return {
          label: t('analytics.customCategory'),
          color: AppColors.brandPurple,
          bg: AppColors.purple100,
          border: AppColors.purple200,
          icon: (color: string) => <SparkleIcon color={color} size={11} />,
        };
    }
  }, [category, t]);

  const viewTabs = [
    {
      key: 'overview',
      label: `${t('analytics.overviewTab')} (${paramKeys.length})`,
      icon: (isActive: boolean) => (
        <TableIcon
          color={isActive ? AppColors.white : AppColors.grayText}
          size={12}
        />
      ),
    },
    {
      key: 'tree',
      label: t('analytics.jsonTreeTab'),
      icon: (isActive: boolean) => (
        <PrettyIcon
          color={isActive ? AppColors.white : AppColors.grayText}
          size={12}
        />
      ),
    },
    {
      key: 'raw',
      label: t('analytics.rawPayloadTab'),
      icon: (isActive: boolean) => (
        <RawIcon
          color={isActive ? AppColors.white : AppColors.grayText}
          size={12}
        />
      ),
    },
  ];

  return (
    <ScrollView
      style={detailStyles.scroll}
      contentContainerStyle={detailStyles.content}
      showsVerticalScrollIndicator
      contentInsetAdjustmentBehavior="never"
      automaticallyAdjustContentInsets={false}>
      
      {/* ── 1. Hero Event Header Card ────────────────────────────────────── */}
      <View style={detailStyles.heroCard}>
        {/* Top Badges Row */}
        <View style={detailStyles.heroTopRow}>
          <View style={{flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap', flex: 1}}>
            {/* Source Badge */}
            <View
              style={[
                detailStyles.sourceBadge,
                event.source === 'firebase'
                  ? {backgroundColor: AppColors.amberBg, borderColor: AppColors.amberBorder}
                  : {backgroundColor: AppColors.purpleBg, borderColor: AppColors.purpleBorder},
              ]}>
              <View
                style={[
                  detailStyles.sourceDot,
                  {
                    backgroundColor:
                      event.source === 'firebase'
                        ? AppColors.firebaseOrange
                        : AppColors.purple,
                  },
                ]}
              />
              <Text
                style={[
                  detailStyles.sourceBadgeText,
                  {
                    color:
                      event.source === 'firebase'
                        ? AppColors.amber800Warm
                        : AppColors.purple,
                  },
                ]}>
                {event.source === 'firebase' ? t('analytics.sourceFirebase') : t('analytics.sourceCustom')}
              </Text>
            </View>

            {/* Category Badge */}
            <View
              style={[
                detailStyles.catBadge,
                {backgroundColor: catMeta.bg, borderColor: catMeta.border},
              ]}>
              {catMeta.icon(catMeta.color)}
              <Text style={[detailStyles.catBadgeText, {color: catMeta.color}]}>
                {catMeta.label}
              </Text>
            </View>
          </View>

          {/* Copy Full Event JSON Button */}
          <CopyButton
            value={JSON.stringify(fullJsonData, null, 2)}
            label={t('analytics.eventDetails')}
          />
        </View>

        {/* Event Name Heading */}
        <View style={detailStyles.titleRow}>
          <Text style={detailStyles.eventTitle} selectable numberOfLines={2}>
            {event.name}
          </Text>
        </View>

        {/* Sub Details Row: Timestamp & Screen Location */}
        <View style={detailStyles.metaRow}>
          <View style={detailStyles.timePill}>
            <ClockIcon color={AppColors.purple} size={11} />
            <Text style={detailStyles.timeText}>
              {formatDateTime(event.timestamp)}
            </Text>
          </View>

          {screenContext && (
            <View style={detailStyles.screenPill}>
              <PinIcon color={AppColors.sky600} size={11} />
              <Text style={detailStyles.screenText} numberOfLines={1}>
                {String(screenContext)}
              </Text>
            </View>
          )}
        </View>

        {/* ── 2. Metric Pills Summary ──────────────────────────────────────── */}
        <View style={detailStyles.metricsBar}>
          <View style={detailStyles.metricPill}>
            <Text style={detailStyles.metricLabel}>Params:</Text>
            <Text style={detailStyles.metricValue}>{paramKeys.length}</Text>
          </View>

          {userPropKeys.length > 0 && (
            <View style={detailStyles.metricPill}>
              <Text style={detailStyles.metricLabel}>User Props:</Text>
              <Text style={detailStyles.metricValue}>{userPropKeys.length}</Text>
            </View>
          )}

          <View style={detailStyles.metricPill}>
            <Text style={detailStyles.metricLabel}>Size:</Text>
            <Text style={detailStyles.metricValue}>{getSize(fullJsonData)}</Text>
          </View>

          {revenueInfo && (
            <View style={detailStyles.revenuePill}>
              <MoneyIcon color={AppColors.emerald600} size={11} />
              <Text style={detailStyles.revenueValue}>
                ${revenueInfo.amount} {revenueInfo.currency}
              </Text>
            </View>
          )}

          {itemsCount !== null && (
            <View style={detailStyles.itemsPill}>
              <Text style={detailStyles.itemsValue}>
                📦 {itemsCount} items
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* ── 3. View Switcher Tabs (Overview, Tree, Raw) ───────────────────── */}
      <View style={detailStyles.tabsWrap}>
        <SegmentedTabs
          tabs={viewTabs}
          activeKey={activeViewTab}
          onChange={key => setActiveViewTab(key as DetailViewTab)}
        />
      </View>

      {/* ── 4. Main Tab Body Content ───────────────────────────────────────── */}
      {activeViewTab === 'overview' && (
        <View style={detailStyles.tabContent}>
          {/* Metadata Card (Session, User ID, Client ID) */}
          {(event.userId || event.sessionId || event.trackingId) && (
            <View style={detailStyles.sectionCard}>
              <View style={detailStyles.sectionHeader}>
                <LayersIcon color={AppColors.purple} size={12} />
                <Text style={detailStyles.sectionTitle}>SESSION & IDENTITY</Text>
              </View>
              <View style={detailStyles.sectionBody}>
                {event.userId && (
                  <View style={detailStyles.kvRow}>
                    <Text style={detailStyles.kvKey}>User ID:</Text>
                    <Text style={detailStyles.kvVal} selectable>{event.userId}</Text>
                  </View>
                )}
                {event.sessionId && (
                  <View style={detailStyles.kvRow}>
                    <Text style={detailStyles.kvKey}>Session ID:</Text>
                    <Text style={detailStyles.kvVal} selectable>{event.sessionId}</Text>
                  </View>
                )}
                {event.trackingId && (
                  <View style={detailStyles.kvRow}>
                    <Text style={detailStyles.kvKey}>Tracking ID:</Text>
                    <Text style={detailStyles.kvVal} selectable>{event.trackingId}</Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Parameters Table Section */}
          <View style={detailStyles.sectionCard}>
            <View style={detailStyles.sectionHeaderBetween}>
              <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
                <TableIcon color={AppColors.brandPurple} size={12} />
                <Text style={detailStyles.sectionTitle}>
                  EVENT PARAMETERS ({paramKeys.length})
                </Text>
              </View>
              <Text style={detailStyles.sectionSubtitle}>
                Key-Value Attributes
              </Text>
            </View>

            {/* Search filter within parameters (if > 4 params) */}
            {paramKeys.length > 4 && (
              <View style={detailStyles.searchBar}>
                <SearchIcon color={AppColors.grayTextWeak} size={13} />
                <TextInput
                  placeholder="Filter parameters by key or value..."
                  placeholderTextColor={AppColors.grayTextWeak}
                  value={paramSearch}
                  onChangeText={setParamSearch}
                  style={detailStyles.searchInput}
                  autoCorrect={false}
                  autoCapitalize="none"
                />
                {paramSearch.length > 0 && (
                  <Pressable onPress={() => setParamSearch('')} hitSlop={8}>
                    <ClearIcon color={AppColors.grayTextWeak} size={13} />
                  </Pressable>
                )}
              </View>
            )}

            {paramKeys.length === 0 ? (
              <View style={detailStyles.emptyParamsBox}>
                <DocIcon color={AppColors.grayTextWeak} size={16} />
                <Text style={detailStyles.emptyParamsText}>
                  No custom parameters recorded for this event.
                </Text>
              </View>
            ) : filteredParamEntries.length === 0 ? (
              <View style={detailStyles.emptyParamsBox}>
                <Text style={detailStyles.emptyParamsText}>
                  No parameters matching "{paramSearch}"
                </Text>
              </View>
            ) : (
              <View style={detailStyles.paramList}>
                {filteredParamEntries.map(([key, val], pIdx) => {
                  const isObject = typeof val === 'object' && val !== null;
                  const isArray = Array.isArray(val);
                  let typeStr: string = typeof val;
                  if (val === null) typeStr = 'null';
                  else if (isArray) typeStr = `array [${val.length}]`;
                  else if (isObject) typeStr = 'object';

                  const valString = isObject ? JSON.stringify(val, null, 2) : String(val);

                  // Highlight standard GA4 ecom/screen keys
                  const isKeyHighlighted =
                    key === 'value' ||
                    key === 'price' ||
                    key === 'currency' ||
                    key === 'screen_name' ||
                    key === 'item_id' ||
                    key === 'item_name';

                  return (
                    <AnimatedEntrance key={key} index={pIdx} distance={4}>
                      <View style={detailStyles.paramCard}>
                        {/* Param Top Row: Key + Type + Copy */}
                        <View style={detailStyles.paramCardHeader}>
                          <View style={{flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, minWidth: 0}}>
                            <HighlightText
                              text={key}
                              search={paramSearch}
                              style={[
                                detailStyles.paramKeyText,
                                isKeyHighlighted && detailStyles.paramKeyHighlighted,
                              ]}
                              highlightStyle={detailStyles.highlight}
                            />
                            <View style={detailStyles.typeBadge}>
                              <Text style={detailStyles.typeBadgeText}>
                                {typeStr.toUpperCase()}
                              </Text>
                            </View>
                          </View>

                          <CopyButton
                            value={valString}
                            label={key}
                          />
                        </View>

                        {/* Param Value Display */}
                        <View style={detailStyles.paramValBox}>
                          {isObject ? (
                            <JsonViewer
                              data={val}
                              search={paramSearch}
                              hideTabs
                              wrap
                            />
                          ) : (
                            <HighlightText
                              text={valString}
                              search={paramSearch}
                              style={detailStyles.paramValText}
                              highlightStyle={detailStyles.highlight}
                              selectable
                            />
                          )}
                        </View>
                      </View>
                    </AnimatedEntrance>
                  );
                })}
              </View>
            )}
          </View>

          {/* User Properties Section (if any) */}
          {userPropKeys.length > 0 && (
            <View style={detailStyles.sectionCard}>
              <View style={detailStyles.sectionHeader}>
                <SparkleIcon color={AppColors.purple} size={12} />
                <Text style={detailStyles.sectionTitle}>
                  USER PROPERTIES SNAPSHOT ({userPropKeys.length})
                </Text>
              </View>
              <View style={detailStyles.sectionBody}>
                {userPropKeys.map(k => (
                  <View key={k} style={detailStyles.kvRow}>
                    <Text style={detailStyles.kvKey}>{k}:</Text>
                    <Text style={detailStyles.kvVal} selectable>
                      {String(userProperties[k])}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      )}

      {/* ── JSON Tree View ────────────────────────────────────────────────── */}
      {activeViewTab === 'tree' && (
        <View style={detailStyles.jsonContainer}>
          <JsonViewer
            data={fullJsonData}
            defaultExpandDepth={1}
            mode="pretty"
            fullHeight
          />
        </View>
      )}

      {/* ── Raw Payload View ──────────────────────────────────────────────── */}
      {activeViewTab === 'raw' && (
        <View style={detailStyles.jsonContainer}>
          <JsonViewer
            data={fullJsonData}
            mode="raw"
            fullHeight
          />
        </View>
      )}
    </ScrollView>
  );
};

const detailStyles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: AppColors.grayBackground,
  },
  content: {
    paddingTop: 12,
    paddingBottom: 40,
    paddingHorizontal: 12,
  },
  heroCard: {
    backgroundColor: AppColors.white,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: AppColors.dividerColor,
    shadowColor: AppColors.primaryBlack,
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 12,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sourceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4.5,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 5,
    borderWidth: 1,
  },
  sourceDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  sourceBadgeText: {
    fontFamily: AppFonts.interBold,
    fontSize: 9.5,
    letterSpacing: 0.4,
  },
  catBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 5,
    borderWidth: 1,
  },
  catBadgeText: {
    fontFamily: AppFonts.interBold,
    fontSize: 9.5,
    letterSpacing: 0.3,
  },
  titleRow: {
    marginBottom: 8,
  },
  eventTitle: {
    fontFamily: AppFonts.interBold,
    fontSize: 16,
    color: AppColors.primaryBlack,
    lineHeight: 22,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  timePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: `${AppColors.purple}14`,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: `${AppColors.purple}2E`,
  },
  timeText: {
    fontFamily: AppFonts.interMedium,
    fontSize: 10.5,
    color: AppColors.purple,
  },
  screenPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: `${AppColors.sky500}14`,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: `${AppColors.sky500}2E`,
    maxWidth: 220,
  },
  screenText: {
    fontFamily: AppFonts.interMedium,
    fontSize: 10.5,
    color: AppColors.sky600,
  },
  metricsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: AppColors.dividerColor,
  },
  metricPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: AppColors.grayBackground,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: AppColors.dividerColor,
  },
  metricLabel: {
    fontFamily: AppFonts.interMedium,
    fontSize: 10.5,
    color: AppColors.grayTextWeak,
  },
  metricValue: {
    fontFamily: AppFonts.interBold,
    fontSize: 10.5,
    color: AppColors.primaryBlack,
  },
  revenuePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: AppColors.emeraldBg,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: AppColors.emeraldBorder,
  },
  revenueValue: {
    fontFamily: AppFonts.interBold,
    fontSize: 10.5,
    color: '#047857',
  },
  itemsPill: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  itemsValue: {
    fontFamily: AppFonts.interBold,
    fontSize: 10.5,
    color: '#1D4ED8',
  },
  tabsWrap: {
    marginBottom: 12,
  },
  tabContent: {
    gap: 12,
  },
  sectionCard: {
    backgroundColor: AppColors.white,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: AppColors.dividerColor,
    shadowColor: AppColors.primaryBlack,
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.dividerColor,
  },
  sectionHeaderBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.dividerColor,
  },
  sectionTitle: {
    fontFamily: AppFonts.interBold,
    fontSize: 11,
    color: AppColors.slate700,
    letterSpacing: 0.4,
  },
  sectionSubtitle: {
    fontFamily: AppFonts.interMedium,
    fontSize: 10,
    color: AppColors.grayTextWeak,
  },
  sectionBody: {
    gap: 6,
  },
  kvRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  kvKey: {
    fontFamily: AppFonts.interMedium,
    fontSize: 11,
    color: AppColors.grayTextWeak,
  },
  kvVal: {
    fontFamily: AppFonts.interBold,
    fontSize: 11,
    color: AppColors.primaryBlack,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.grayBackground,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: AppColors.dividerColor,
    marginBottom: 10,
    gap: 6,
  },
  searchInput: {
    flex: 1,
    fontFamily: AppFonts.interRegular,
    fontSize: 11,
    color: AppColors.primaryBlack,
    paddingVertical: 0,
  },
  emptyParamsBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 6,
  },
  emptyParamsText: {
    fontFamily: AppFonts.interMedium,
    fontSize: 11,
    color: AppColors.grayTextWeak,
  },
  paramList: {
    gap: 8,
  },
  paramCard: {
    backgroundColor: AppColors.grayBackground,
    borderRadius: 8,
    padding: 9,
    borderWidth: 1,
    borderColor: AppColors.dividerColor,
  },
  paramCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  paramKeyText: {
    fontFamily: AppFonts.interBold,
    fontSize: 11.5,
    color: AppColors.primaryBlack,
  },
  paramKeyHighlighted: {
    color: AppColors.brandPurple,
  },
  typeBadge: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 3,
  },
  typeBadgeText: {
    fontFamily: AppFonts.interBold,
    fontSize: 8.5,
    color: AppColors.slate700,
    letterSpacing: 0.3,
  },
  paramValBox: {
    marginTop: 2,
  },
  paramValText: {
    fontFamily: AppFonts.interRegular,
    fontSize: 11,
    color: AppColors.slate700,
    lineHeight: 16,
  },
  jsonContainer: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AppColors.dividerColor,
    overflow: 'hidden',
    backgroundColor: AppColors.white,
    minHeight: 300,
  },
  highlight: {
    backgroundColor: '#FEF08A',
    color: '#854D0E',
    fontFamily: AppFonts.interBold,
  },
});

export default AnalyticsDetail;
