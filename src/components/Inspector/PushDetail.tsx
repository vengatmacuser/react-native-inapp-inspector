import React, {useMemo, useState} from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import styles from '../../styles';
import {AppColors} from '../../styles/AppColors';
import {AppFonts} from '../../styles/AppFonts';
import {formatDateTime} from '../../helpers';
import {sharePushReport} from '../../helpers/shareFormatter';
import ShareButton from '../ShareButton';
import CopyButton from '../CopyButton';
import JsonViewer from '../JsonViewer';
import SegmentedTabs from '../SegmentedTabs';
import {
  BellIcon,
  ClockIcon,
  CloudPushIcon,
  EyeIcon,
  LayersIcon,
  MetadataIcon,
  RawJsonIcon,
} from '../NetworkIcons';
import type {PushDetailProps} from '../../types';

const PushDetail = React.memo(function PushDetail({
  item,
}: PushDetailProps) {
  const [activeSubTab, setActiveSubTab] = useState<'preview' | 'payload' | 'headers' | 'raw'>('preview');

  const formattedTime = useMemo(() => (item ? formatDateTime(item.timestamp) : ''), [item]);

  if (!item) return null;

  const handleShare = async () => {
    await sharePushReport(item);
  };

  const tabs = [
    {
      key: 'preview',
      label: 'Preview',
      themeColor: AppColors.brandPurple,
      icon: (isActive: boolean) => (
        <EyeIcon
          size={12}
          color={isActive ? AppColors.white : AppColors.grayText}
        />
      ),
    },
    {
      key: 'payload',
      label: 'Custom Payload',
      themeColor: AppColors.violet600,
      icon: (isActive: boolean) => (
        <LayersIcon
          size={12}
          color={isActive ? AppColors.white : AppColors.grayText}
        />
      ),
    },
    {
      key: 'headers',
      label: 'Delivery Metadata',
      themeColor: AppColors.teal600,
      icon: (isActive: boolean) => (
        <MetadataIcon
          size={12}
          color={isActive ? AppColors.white : AppColors.grayText}
        />
      ),
    },
    {
      key: 'raw',
      label: 'Raw Payload',
      themeColor: AppColors.sky600,
      icon: (isActive: boolean) => (
        <RawJsonIcon
          size={12}
          color={isActive ? AppColors.white : AppColors.grayText}
        />
      ),
    },
  ];

  const sourceName = (item.source || 'PUSH').toUpperCase();
  const appStateName = (item.appState || 'STATE').toUpperCase();
  const hasDeepLink = Boolean(
    item.data?.deepLink ||
    item.data?.openDirectUrl ||
    item.data?._od ||
    item.customDomainAttributes?.openDirectUrl,
  );
  const deepLinkUrl =
    item.data?.deepLink ||
    item.data?.openDirectUrl ||
    item.data?._od ||
    item.customDomainAttributes?.openDirectUrl ||
    '';

  return (
    <View style={{flex: 1}}>
      {/* Non-scrollable Details Header Bar (Matching NetworkDetail) */}
      <View style={{paddingHorizontal: 8, paddingTop: 4}}>
        <View style={styles.detailInfoBar}>
          {/* Status & Metrics Badges Row */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 6,
              paddingBottom: 8,
              borderBottomWidth: 1,
              borderBottomColor: AppColors.dividerColor,
            }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 5,
                flexWrap: 'wrap',
                flex: 1,
              }}>
              {/* Source / Domain Badge */}
              <View
                style={[
                  styles.methodBadge,
                  {
                    backgroundColor: AppColors.brandPurple,
                    paddingHorizontal: 8,
                    paddingVertical: 3.5,
                    borderRadius: 6,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4,
                  },
                ]}>
                <CloudPushIcon size={10} color={AppColors.white} />
                <Text
                  style={[
                    styles.methodBadgeText,
                    {
                      color: AppColors.white,
                      fontSize: 10.5,
                      fontFamily: AppFonts.interBold,
                    },
                  ]}>
                  {sourceName}
                </Text>
              </View>

              {/* App State Chip */}
              <View
                style={[
                  styles.chip,
                  {
                    backgroundColor:
                      item.appState === 'foreground'
                        ? `${AppColors.greenColor}18`
                        : `${AppColors.amber600}18`,
                    borderColor:
                      item.appState === 'foreground'
                        ? `${AppColors.greenColor}40`
                        : `${AppColors.amber600}40`,
                    paddingHorizontal: 6,
                    paddingVertical: 3,
                    borderRadius: 6,
                  },
                ]}>
                <Text
                  style={[
                    styles.chipText,
                    {
                      fontFamily: AppFonts.interBold,
                      fontSize: 9.5,
                      color:
                        item.appState === 'foreground'
                          ? AppColors.greenColor
                          : AppColors.amber700,
                    },
                  ]}>
                  {appStateName}
                </Text>
              </View>

              {/* Action Chip */}
              {item.action && (
                <View
                  style={[
                    styles.chip,
                    {
                      backgroundColor: `${AppColors.purple}14`,
                      borderColor: `${AppColors.purple}30`,
                      paddingHorizontal: 6,
                      paddingVertical: 3,
                      borderRadius: 6,
                    },
                  ]}>
                  <Text
                    style={[
                      styles.chipText,
                      {
                        fontFamily: AppFonts.interBold,
                        fontSize: 9.5,
                        color: AppColors.purple,
                      },
                    ]}>
                    {item.action.toUpperCase()}
                  </Text>
                </View>
              )}

              {/* Timestamp Pill */}
              <View
                style={[
                  styles.chip,
                  {
                    backgroundColor: `${AppColors.brandPurple}10`,
                    borderColor: `${AppColors.brandPurple}25`,
                    paddingHorizontal: 7,
                    paddingVertical: 3,
                    borderRadius: 6,
                    gap: 4,
                  },
                ]}>
                <ClockIcon color={AppColors.brandPurple} size={10} />
                <Text
                  style={[
                    styles.chipText,
                    {
                      color: AppColors.brandPurple,
                      fontFamily: AppFonts.interBold,
                      fontSize: 10.5,
                    },
                  ]}>
                  {formattedTime}
                </Text>
              </View>
            </View>
          </View>

          {/* Notification Target & Actions Card */}
          <View
            style={{
              backgroundColor: AppColors.grayBackground,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: AppColors.dividerColor,
              padding: 10,
              marginTop: 8,
              gap: 8,
            }}>
            {/* Target Header Bar with Action Buttons */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'nowrap',
                gap: 6,
              }}>
              <View style={{flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1, minWidth: 0}}>
                <Text
                  style={{
                    fontFamily: AppFonts.interBold,
                    fontSize: 10,
                    color: AppColors.grayTextWeak,
                    letterSpacing: 0.4,
                    textTransform: 'uppercase',
                  }}
                  numberOfLines={1}>
                  {item.domain ? item.domain.toUpperCase() : 'NOTIFICATION PAYLOAD'}
                </Text>
              </View>

              {/* Action Buttons: Share & Copy */}
              <View style={{flexDirection: 'row', alignItems: 'center', gap: 5, flexShrink: 0}}>
                <ShareButton onShare={handleShare} />
                <CopyButton
                  value={
                    typeof item.rawPayload === 'object'
                      ? JSON.stringify(item.rawPayload, null, 2)
                      : JSON.stringify(item.data, null, 2)
                  }
                  label="JSON"
                  iconType="copy"
                />
                <CopyButton
                  value={item.id || ''}
                  label="ID"
                  iconType="copy"
                />
              </View>
            </View>

            {/* Notification Title & Body Summary */}
            <View style={{gap: 2}}>
              <Text
                style={{
                  fontFamily: AppFonts.interBold,
                  fontSize: 12.5,
                  color: AppColors.primaryBlack,
                  lineHeight: 18,
                }}
                numberOfLines={2}
                selectable>
                {item.title || '(No Title)'}
              </Text>
              {item.body ? (
                <Text
                  style={{
                    fontFamily: AppFonts.interRegular,
                    fontSize: 11.5,
                    color: AppColors.grayText,
                    lineHeight: 16,
                  }}
                  numberOfLines={2}
                  selectable>
                  {item.body}
                </Text>
              ) : null}
              {hasDeepLink ? (
                <View style={{flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2}}>
                  <Text style={{fontSize: 10, fontFamily: AppFonts.interBold, color: AppColors.brandPurple}}>
                    🔗 LINK:
                  </Text>
                  <Text style={{fontSize: 10.5, fontFamily: AppFonts.interRegular, color: AppColors.sky600}} numberOfLines={1}>
                    {deepLinkUrl}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
        </View>
      </View>

      {/* ── Scrollable Segmented Sub Tabs (No Text Cut) ── */}
      <View style={{paddingHorizontal: 8, paddingVertical: 6}}>
        <SegmentedTabs
          tabs={tabs}
          activeKey={activeSubTab}
          onChange={key => setActiveSubTab(key as any)}
          scrollable={true}
        />
      </View>

      {/* Content Area */}
      <View style={{flex: 1, paddingHorizontal: 8, paddingBottom: 10}}>
        {activeSubTab === 'preview' && (
          <ScrollView contentContainerStyle={detailStyles.scrollContent}>
            {/* Visual Notification Preview Card */}
            <View style={detailStyles.mockupCard}>
              <View style={detailStyles.mockupHeader}>
                <View style={detailStyles.mockupAppIcon}>
                  <BellIcon size={12} color={AppColors.white} />
                </View>
                <Text style={detailStyles.mockupAppName}>
                  {item.domain || 'App Notification'}
                </Text>
                <Text style={detailStyles.mockupTime}>• now</Text>
              </View>

              {/* Notification Banner Image */}
              {item.imageUrl ? (
                <Image
                  source={{uri: item.imageUrl}}
                  style={detailStyles.mockupImage}
                  resizeMode="cover"
                />
              ) : null}

              {/* Notification Texts */}
              <View style={{gap: 2}}>
                <Text style={detailStyles.mockupTitle} numberOfLines={2}>
                  {item.title || '(No Title)'}
                </Text>
                {item.subtitle ? (
                  <Text style={detailStyles.mockupSubtitle} numberOfLines={1}>
                    {item.subtitle}
                  </Text>
                ) : null}
                <Text style={detailStyles.mockupBody}>
                  {item.body || '(No message body provided in notification payload)'}
                </Text>
              </View>

              {/* Footer Meta Chips */}
              <View style={detailStyles.mockupFooterTags}>
                {item.channelId ? (
                  <View style={detailStyles.tagPill}>
                    <Text style={detailStyles.tagPillText}>Channel: {item.channelId}</Text>
                  </View>
                ) : null}
                {item.sound ? (
                  <View style={detailStyles.tagPill}>
                    <Text style={detailStyles.tagPillText}>🔊 {item.sound}</Text>
                  </View>
                ) : null}
                {item.badge != null ? (
                  <View style={detailStyles.tagPill}>
                    <Text style={detailStyles.tagPillText}>Badge: {item.badge}</Text>
                  </View>
                ) : null}
                {item.priority ? (
                  <View style={detailStyles.tagPill}>
                    <Text style={detailStyles.tagPillText}>⚡ {item.priority}</Text>
                  </View>
                ) : null}
              </View>
            </View>

            {/* Custom Domain Attributes (Dynamic Extracted Fields) */}
            {item.customDomainAttributes && Object.keys(item.customDomainAttributes).length > 0 && (
              <View style={detailStyles.sectionCard}>
                <Text style={detailStyles.sectionTitle}>🏢 Domain Specific Fields</Text>
                {Object.entries(item.customDomainAttributes).map(([k, v]) => (
                  <View key={k} style={detailStyles.keyValRow}>
                    <Text style={detailStyles.keyText}>{k}:</Text>
                    <Text style={detailStyles.valText} numberOfLines={2}>
                      {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
        )}

        {activeSubTab === 'payload' && (
          <JsonViewer
            data={item.data && Object.keys(item.data).length > 0 ? item.data : {message: 'No custom key-value data found in payload'}}
            fullHeight={true}
          />
        )}

        {activeSubTab === 'headers' && (
          <ScrollView contentContainerStyle={detailStyles.scrollContent}>
            <View style={detailStyles.sectionCard}>
              <Text style={detailStyles.sectionTitle}>⚙️ Delivery & Message Metadata</Text>
              <View style={detailStyles.keyValRow}>
                <Text style={detailStyles.keyText}>Message ID:</Text>
                <Text style={detailStyles.valText} selectable>{item.id || 'N/A'}</Text>
              </View>
              <View style={detailStyles.keyValRow}>
                <Text style={detailStyles.keyText}>Source / Domain:</Text>
                <Text style={detailStyles.valText}>{item.domain || item.source || 'N/A'}</Text>
              </View>
              <View style={detailStyles.keyValRow}>
                <Text style={detailStyles.keyText}>App State:</Text>
                <Text style={detailStyles.valText}>{item.appState}</Text>
              </View>
              <View style={detailStyles.keyValRow}>
                <Text style={detailStyles.keyText}>Action Type:</Text>
                <Text style={detailStyles.valText}>{item.action}</Text>
              </View>
              <View style={detailStyles.keyValRow}>
                <Text style={detailStyles.keyText}>Timestamp:</Text>
                <Text style={detailStyles.valText}>{formattedTime}</Text>
              </View>
              <View style={detailStyles.keyValRow}>
                <Text style={detailStyles.keyText}>Channel ID:</Text>
                <Text style={detailStyles.valText}>{item.channelId || 'default'}</Text>
              </View>
              <View style={detailStyles.keyValRow}>
                <Text style={detailStyles.keyText}>Sound:</Text>
                <Text style={detailStyles.valText}>{item.sound || 'default'}</Text>
              </View>
              <View style={detailStyles.keyValRow}>
                <Text style={detailStyles.keyText}>Badge Count:</Text>
                <Text style={detailStyles.valText}>{item.badge != null ? item.badge : 'None'}</Text>
              </View>
              <View style={detailStyles.keyValRow}>
                <Text style={detailStyles.keyText}>Collapse Key:</Text>
                <Text style={detailStyles.valText}>{item.collapseKey || 'None'}</Text>
              </View>
            </View>
          </ScrollView>
        )}

        {activeSubTab === 'raw' && (
          <JsonViewer
            data={item.rawPayload || item}
            fullHeight={true}
          />
        )}
      </View>
    </View>
  );
});

const detailStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.white,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.dividerColor,
    backgroundColor: AppColors.white,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: AppColors.grayBackground,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: AppColors.dividerColor,
  },
  titleWrap: {
    flex: 1,
    gap: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  sourceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: `${AppColors.brandPurple}14`,
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: `${AppColors.brandPurple}30`,
  },
  sourceBadgeText: {
    fontSize: 9,
    fontFamily: AppFonts.interBold,
    color: AppColors.brandPurple,
  },
  stateBadge: {
    backgroundColor: `${AppColors.greenColor}14`,
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: `${AppColors.greenColor}30`,
  },
  stateBadgeText: {
    fontSize: 9,
    fontFamily: AppFonts.interBold,
    color: AppColors.greenColor,
  },
  headerTitle: {
    fontSize: 13,
    fontFamily: AppFonts.interSemiBold,
    color: AppColors.primaryBlack,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tabsContainer: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: AppColors.grayBackground,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.dividerColor,
  },
  bodyContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 12,
    gap: 12,
  },
  mockupCard: {
    backgroundColor: AppColors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: AppColors.dividerColor,
    padding: 14,
    gap: 8,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: {width: 0, height: 2},
    shadowRadius: 6,
    elevation: 2,
  },
  mockupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  mockupAppIcon: {
    width: 20,
    height: 20,
    borderRadius: 5,
    backgroundColor: AppColors.brandPurple,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mockupAppName: {
    fontSize: 11,
    fontFamily: AppFonts.interSemiBold,
    color: AppColors.primaryBlack,
    textTransform: 'uppercase',
  },
  mockupTime: {
    fontSize: 10,
    fontFamily: AppFonts.interRegular,
    color: AppColors.grayTextWeak,
  },
  mockupImage: {
    width: '100%',
    height: 140,
    borderRadius: 8,
    marginVertical: 4,
  },
  mockupTitle: {
    fontSize: 14,
    fontFamily: AppFonts.interBold,
    color: AppColors.primaryBlack,
  },
  mockupSubtitle: {
    fontSize: 12,
    fontFamily: AppFonts.interMedium,
    color: AppColors.grayText,
  },
  mockupBody: {
    fontSize: 12.5,
    fontFamily: AppFonts.interRegular,
    color: AppColors.grayText,
    lineHeight: 18,
  },
  mockupFooterTags: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: AppColors.dividerColor,
  },
  tagPill: {
    backgroundColor: AppColors.grayBackground,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: AppColors.dividerColor,
  },
  tagPillText: {
    fontSize: 10,
    fontFamily: AppFonts.interMedium,
    color: AppColors.grayText,
  },
  sectionCard: {
    backgroundColor: AppColors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AppColors.dividerColor,
    padding: 12,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: AppFonts.interBold,
    color: AppColors.primaryBlack,
    marginBottom: 4,
  },
  keyValRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 3,
    borderBottomWidth: 0.5,
    borderBottomColor: `${AppColors.dividerColor}40`,
    gap: 8,
  },
  keyText: {
    fontSize: 11,
    fontFamily: AppFonts.interMedium,
    color: AppColors.grayTextWeak,
  },
  valText: {
    fontSize: 11,
    fontFamily: AppFonts.interSemiBold,
    color: AppColors.primaryBlack,
    textAlign: 'right',
    flexShrink: 1,
  },
});

PushDetail.displayName = 'PushDetail';

export default PushDetail;
