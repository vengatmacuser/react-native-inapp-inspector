import React, {useState} from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

// Components
import CopyButton from './CopyButton';
import JsonViewer from './JsonViewer';

// Icons
import {ClearIcon} from './NetworkIcons';

// Utils
import {AppFonts} from '../styles/AppFonts';

// Stylesheet
import {AppColors} from '../styles/AppColors';
import styles from '../styles';
import {getEventColor} from './AnalyticsEventCard';

// Type Definition
import {AnalyticsEvent, SectionCardProps} from '../types';

// Helpers
import {formatDateTimeToAnalytics} from '../helpers';

// Sub Components
const ParamRowItem = ({
  paramKey,
  value,
}: {
  paramKey: string;
  value: any;
}): React.JSX.Element => {
  const isObject = typeof value === 'object' && value !== null;
  const valStr = isObject ? JSON.stringify(value, null, 2) : String(value);
  const [expanded, setExpanded] = useState(false);
  const isLong = valStr.length > 80 || valStr.includes('\n') || isObject;

  return (
    <View style={detailStyles.dataBox}>
      <View style={detailStyles.dataBoxHeader}>
        <Text style={detailStyles.dataBoxKey} numberOfLines={1}>
          {paramKey}
        </Text>
        <CopyButton value={valStr} label={paramKey} />
      </View>
      {expanded && isObject ? (
        <View style={detailStyles.jsonBlock}>
          <JsonViewer data={value} />
        </View>
      ) : (
        <Text
          style={detailStyles.dataBoxVal}
          selectable
          numberOfLines={expanded ? undefined : 2}>
          {valStr}
        </Text>
      )}
      {isLong && (
        <Pressable
          onPress={() => setExpanded(!expanded)}
          style={detailStyles.showMoreBtn}>
          <Text style={detailStyles.showMoreText}>
            {expanded ? 'Show Less' : 'Show More'}
          </Text>
        </Pressable>
      )}
    </View>
  );
};

const ParamTable = ({
  data,
  emptyLabel,
}: {
  data: Record<string, any>;
  emptyLabel?: string;
}): React.JSX.Element => {
  const entries = Object.keys(data).map(key => ({
    key,
    value: data[key],
  }));

  if (entries.length === 0) {
    return (
      <View style={detailStyles.emptyParams}>
        <Text style={detailStyles.emptyParamsText}>
          {emptyLabel ?? 'No parameters'}
        </Text>
      </View>
    );
  }

  return (
    <View style={detailStyles.paramList}>
      {entries.map(({key, value}) => (
        <ParamRowItem key={key} paramKey={key} value={value} />
      ))}
    </View>
  );
};

const SectionCard = ({
  title,
  children,
  count,
  accentColor = AppColors.purple,
}: SectionCardProps): React.JSX.Element => {
  if (!title) {
    return (
      <View style={{paddingHorizontal: 16, paddingTop: 12, paddingBottom: 20}}>
        {children}
      </View>
    );
  }

  return (
    <View style={detailStyles.sectionCard}>
      <View style={detailStyles.sectionHeader}>
        <View style={detailStyles.sectionTitleRow}>
          <View
            style={[
              detailStyles.sectionAccentDot,
              {backgroundColor: accentColor},
            ]}
          />
          <Text style={detailStyles.sectionTitle}>{title.toUpperCase()}</Text>
        </View>
        {typeof count === 'number' && (
          <View
            style={[
              detailStyles.countBadge,
              {
                borderColor: `${accentColor}55`,
                backgroundColor: `${accentColor}12`,
              },
            ]}>
            <Text style={[detailStyles.countBadgeText, {color: accentColor}]}>
              {count}
            </Text>
          </View>
        )}
      </View>
      <View style={{paddingHorizontal: 14, paddingBottom: 14}}>{children}</View>
    </View>
  );
};

const AnalyticsDetail = ({
  event,
}: {
  event: AnalyticsEvent;
}): React.JSX.Element => {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'unformatted' | 'formatted'>(
    'unformatted',
  );
  const SOURCE_COLORS: Record<AnalyticsEvent['source'], string> = {
    firebase: '#E07B1A',
    manual: AppColors.purple,
  };

  const params = event.params ?? {};
  const userProperties = event.userProperties ?? {};

  const eventColor = getEventColor(event.name);
  const sourceColor = SOURCE_COLORS[event.source] ?? AppColors.purple;
  const paramCount = Object.keys(params).length;
  const upCount = Object.keys(userProperties).length;

  const topMetrics: {
    key: string;
    value: string;
    color: string;
  }[] = [];

  if (event.screenName) {
    topMetrics.push({
      key: 'Screen',
      value: event.screenName,
      color: AppColors.skyBlue,
    });
  }
  if (event.userId) {
    topMetrics.push({
      key: 'User ID',
      value: event.userId,
      color: AppColors.greenColor,
    });
  }
  if (event.pageTitle) {
    topMetrics.push({
      key: 'Page',
      value: event.pageTitle,
      color: AppColors.purple,
    });
  }

  if (params?.primary_category) {
    topMetrics.push({
      key: 'Category',
      value: String(params.primary_category),
      color: AppColors.purple,
    });
  }
  if (params?.flow) {
    topMetrics.push({
      key: 'Flow',
      value: String(params.flow),
      color: AppColors.greenColor,
    });
  }
  if (params?.market_language) {
    topMetrics.push({
      key: 'Language',
      value: String(params.market_language),
      color: '#F59E0B',
    }); // Amber
  }
  if (params?.tripType) {
    topMetrics.push({
      key: 'Trip Type',
      value: String(params.tripType),
      color: '#3B82F6',
    }); // Blue
  }
  if (userProperties?.platform_type) {
    topMetrics.push({
      key: 'Platform',
      value: String(userProperties.platform_type),
      color: AppColors.skyBlue,
    });
  }
  if (userProperties?.login_status) {
    topMetrics.push({
      key: 'Login Status',
      value: String(userProperties.login_status),
      color: '#64748B',
    });
  }

  topMetrics.unshift({
    key: 'Source',
    value: event.source,
    color: sourceColor,
  });

  return (
    <ScrollView
      style={detailStyles.scroll}
      contentContainerStyle={detailStyles.content}
      showsVerticalScrollIndicator
      contentInsetAdjustmentBehavior="never"
      automaticallyAdjustContentInsets={false}>
      <LinearGradient
        colors={[
          `${eventColor}18`,
          `${eventColor}06`,
          AppColors.grayBackground,
        ]}
        style={detailStyles.hero}>
        <View
          style={{
            flexDirection: 'row',
            width: '100%',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            paddingHorizontal: 16,
            paddingTop: 14,
            marginBottom: 8,
          }}>
          <View style={{flex: 1, paddingRight: 10}}>
            <Text
              style={{
                fontFamily: AppFonts.interBold,
                fontSize: 18,
                color: AppColors.primaryBlack,
                marginBottom: 4,
              }}
              numberOfLines={2}>
              {event.name}
            </Text>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: sourceColor,
                }}
              />
              <Text
                style={{
                  fontFamily: AppFonts.interMedium,
                  fontSize: 12,
                  color: AppColors.grayTextStrong,
                }}>
                {formatDateTimeToAnalytics(event.timestamp)}
              </Text>
            </View>
          </View>
          <CopyButton
            value={JSON.stringify({name: event.name, params: params}, null, 2)}
            label="Copy JSON"
          />
        </View>

        {topMetrics.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={detailStyles.metricsScroll}
            contentContainerStyle={detailStyles.metricsGrid}>
            {topMetrics.map((item, idx) => (
              <View
                key={idx}
                style={[
                  detailStyles.metricCard,
                  {borderLeftColor: item.color},
                ]}>
                <Text style={detailStyles.metricLabel}>{item.key}</Text>
                <Text
                  style={[detailStyles.metricValue, {color: item.color}]}
                  numberOfLines={1}>
                  {item.value}
                </Text>
              </View>
            ))}
          </ScrollView>
        )}
      </LinearGradient>

      <View style={detailStyles.tabRow}>
        <Pressable
          style={[
            detailStyles.tabButton,
            activeTab === 'unformatted' && detailStyles.tabActive,
          ]}
          onPress={() => setActiveTab('unformatted')}>
          <Text
            style={[
              detailStyles.tabText,
              activeTab === 'unformatted' && detailStyles.tabTextActive,
            ]}>
            JSON Viewer
          </Text>
        </Pressable>
        <Pressable
          style={[
            detailStyles.tabButton,
            activeTab === 'formatted' && detailStyles.tabActive,
          ]}
          onPress={() => setActiveTab('formatted')}>
          <Text
            style={[
              detailStyles.tabText,
              activeTab === 'formatted' && detailStyles.tabTextActive,
            ]}>
            Tabular View
          </Text>
        </Pressable>
      </View>

      {activeTab === 'unformatted' && (
        <View style={detailStyles.searchRow}>
          <View style={styles.detailSearchBox}>
            <TextInput
              placeholder="Search JSON data..."
              placeholderTextColor={AppColors.grayTextWeak}
              value={search}
              onChangeText={setSearch}
              style={styles.detailSearchInput}
              autoCorrect={false}
              autoCapitalize="none"
            />
            {search.length > 0 && (
              <Pressable
                onPress={() => setSearch('')}
                hitSlop={10}
                style={{padding: 8}}>
                <ClearIcon color={AppColors.grayTextWeak} size={14} />
              </Pressable>
            )}
          </View>
        </View>
      )}

      {activeTab === 'formatted' && (
        <View style={{gap: 10}}>
          {paramCount > 0 && (
            <SectionCard
              title="Event Parameters"
              count={paramCount}
              accentColor={eventColor}>
              <ParamTable data={params} emptyLabel="No parameters" />
            </SectionCard>
          )}

          {upCount > 0 && (
            <SectionCard
              title="User Properties"
              count={upCount}
              accentColor={AppColors.greenColor}>
              <ParamTable
                data={userProperties}
                emptyLabel="No user properties"
              />
            </SectionCard>
          )}
        </View>
      )}

      {activeTab === 'unformatted' && (
        <SectionCard accentColor={AppColors.purple}>
          <View style={[detailStyles.jsonBlock, {marginLeft: 0, marginTop: 0}]}>
            <JsonViewer
              data={{
                name: event.name,
                params: params,
                ...(upCount > 0
                  ? {
                      userProperties: userProperties,
                    }
                  : {}),
              }}
              search={search}
            />
          </View>
        </SectionCard>
      )}

      {/* Empty state */}
      {paramCount === 0 && upCount === 0 && activeTab !== 'unformatted' && (
        <View style={detailStyles.emptyParams}>
          <Text style={detailStyles.emptyParamsText}>
            No parameters recorded for this event
          </Text>
        </View>
      )}
    </ScrollView>
  );
};

const detailStyles = StyleSheet.create({
  scroll: {flex: 1, backgroundColor: AppColors.grayBackground},
  content: {
    paddingTop: 0,
    paddingBottom: 40,
  },
  hero: {
    paddingTop: 0,
    paddingBottom: 16,
    paddingHorizontal: 0,
    gap: 8,
    marginTop: 0,
    marginBottom: 0,
    width: '100%',
    alignSelf: 'stretch',
  },

  searchRow: {
    paddingHorizontal: 16,
    marginVertical: 6,
  },

  sectionCard: {
    marginHorizontal: 0,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: AppColors.grayBorderSecondary,
    backgroundColor: AppColors.primaryLight,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: {width: 0, height: 1},
    elevation: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  sectionAccentDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  sectionTitle: {
    fontFamily: AppFonts.interBold,
    fontSize: 13,
    color: AppColors.primaryBlack,
  },
  sectionActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  countBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
  },
  countBadgeText: {
    fontFamily: AppFonts.interBold,
    fontSize: 10,
  },
  paramList: {
    gap: 8,
  },
  emptyParams: {
    marginVertical: 12,
    paddingVertical: 18,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: AppColors.grayBorderSecondary,
    backgroundColor: AppColors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyParamsText: {
    fontFamily: AppFonts.interMedium,
    fontSize: 13,
    color: AppColors.grayTextWeak,
    textAlign: 'center',
    lineHeight: 18,
  },
  dataBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 12,
  },
  dataBoxHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dataBoxKey: {
    fontFamily: AppFonts.interBold,
    fontWeight: 'bold',
    fontSize: 13,
    color: AppColors.primaryBlack,
    flex: 1,
    paddingRight: 8,
  },
  dataBoxVal: {
    fontFamily: AppFonts.interRegular,
    fontSize: 13,
    color: AppColors.primaryBlack,
    lineHeight: 18,
  },
  showMoreBtn: {
    marginTop: 8,
    alignSelf: 'flex-start',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  showMoreText: {
    fontFamily: AppFonts.interMedium,
    fontSize: 11,
    color: '#4B5563', // matching previous UI color
  },
  jsonBlock: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#E0E7FF',
    borderRadius: 8,
    backgroundColor: '#EEF2FF',
  },
  metricsScroll: {
    height: 92,
    overflow: 'visible',
  },
  metricsGrid: {
    gap: 8,
    marginTop: 4,
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  metricCard: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderLeftWidth: 3,
    width: 130, // fixed width for horizontal scrolling
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: {width: 0, height: 2},
    elevation: 2,
    alignItems: 'flex-start',
  },
  metricLabel: {
    fontFamily: AppFonts.interMedium,
    fontSize: 10,
    color: AppColors.grayTextWeak,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  metricValue: {
    fontFamily: AppFonts.interBold,
    fontSize: 13,
  },
  tabRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 8,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 6,
    gap: 6,
  },
  tabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 2,
    shadowOffset: {width: 0, height: 1},
    elevation: 2,
  },
  tabText: {
    fontFamily: AppFonts.interMedium,
    fontSize: 13,
    color: AppColors.grayTextWeak,
  },
  tabTextActive: {
    fontFamily: AppFonts.interBold,
    color: AppColors.primaryBlack,
  },
  tabBadge: {
    backgroundColor: '#D1D5DB',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  tabBadgeActive: {
    backgroundColor: AppColors.primaryLight,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  tabBadgeText: {
    fontFamily: AppFonts.interBold,
    fontSize: 10,
    color: '#6B7280',
  },
  tabBadgeTextActive: {
    color: AppColors.primaryBlack,
  },
});

export default AnalyticsDetail;
