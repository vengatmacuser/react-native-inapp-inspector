import React, {useMemo} from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {AppColors} from '../../styles/AppColors';
import {AppFonts} from '../../styles/AppFonts';
import {useTranslation} from '../../i18n';
import {formatTime} from '../../helpers';
import {
  BellIcon,
  ClockIcon,
  ForwardChevronIcon,
  SunIcon,
  MoonIcon,
  CloudPushIcon,
  LinkChainIcon,
  ExternalLinkIcon,
  KeyIcon,
} from '../NetworkIcons';
import HighlightText from '../HighlightText';
import TouchableScale from '../TouchableScale';
import type {PushCardProps} from '../../types';

interface PushSourceColorDef {
  badgeColor: string;
  border: string;
  cardBg: string;
  label: string;
}

const getSourceColors = (source: string): PushSourceColorDef => {
  const s = (source || '').toLowerCase();
  if (s.includes('salesforce') || s === 'sfmc') {
    return {
      badgeColor: AppColors.sky600,
      border: AppColors.sky600,
      cardBg: `${AppColors.sky600}04`,
      label: 'SALESFORCE',
    };
  }
  if (s.includes('fcm') || s.includes('firebase')) {
    return {
      badgeColor: AppColors.firebaseOrange,
      border: AppColors.firebaseOrange,
      cardBg: `${AppColors.firebaseOrange}04`,
      label: 'FCM',
    };
  }
  if (s.includes('apns') || s.includes('apple')) {
    return {
      badgeColor: AppColors.slate700,
      border: AppColors.slate700,
      cardBg: `${AppColors.slate700}04`,
      label: 'APNS',
    };
  }
  if (s.includes('expo')) {
    return {
      badgeColor: AppColors.brandPurple,
      border: AppColors.brandPurple,
      cardBg: `${AppColors.brandPurple}04`,
      label: 'EXPO',
    };
  }
  if (s.includes('notifee')) {
    return {
      badgeColor: AppColors.pink500,
      border: AppColors.pink500,
      cardBg: `${AppColors.pink500}04`,
      label: 'NOTIFEE',
    };
  }
  if (s.includes('onesignal')) {
    return {
      badgeColor: AppColors.errorColor,
      border: AppColors.errorColor,
      cardBg: `${AppColors.errorColor}04`,
      label: 'ONESIGNAL',
    };
  }
  return {
    badgeColor: AppColors.purple,
    border: AppColors.purple,
    cardBg: `${AppColors.purple}04`,
    label: (source || 'PUSH').toUpperCase(),
  };
};

const getAppStatePill = (appState?: string, action?: string) => {
  if (action === 'opened') {
    return {
      label: 'OPENED',
      text: AppColors.brandPurple,
      bg: `${AppColors.brandPurple}14`,
      border: `${AppColors.brandPurple}30`,
      Icon: ExternalLinkIcon,
    };
  }
  const s = (appState || '').toLowerCase();
  if (s === 'foreground') {
    return {
      label: 'FOREGROUND',
      text: AppColors.greenColor,
      bg: `${AppColors.greenColor}14`,
      border: `${AppColors.greenColor}30`,
      Icon: SunIcon,
    };
  }
  if (s === 'background') {
    return {
      label: 'BACKGROUND',
      text: AppColors.amber600,
      bg: `${AppColors.amber600}14`,
      border: `${AppColors.amber600}30`,
      Icon: MoonIcon,
    };
  }
  return {
    label: (appState || 'RECEIVED').toUpperCase(),
    text: AppColors.grayTextWeak,
    bg: `${AppColors.grayTextWeak}14`,
    border: `${AppColors.grayTextWeak}30`,
    Icon: CloudPushIcon,
  };
};

function PushCard({
  item,
  onPress,
  searchStr = '',
}: PushCardProps) {
  const {t} = useTranslation();
  const colors = useMemo(() => getSourceColors(item.source), [item.source]);
  const statePill = useMemo(
    () => getAppStatePill(item.appState, item.action),
    [item.appState, item.action],
  );

  const payloadKeysCount = useMemo(() => {
    if (!item.data) return 0;
    return Object.keys(item.data).length;
  }, [item.data]);

  const hasDeepLink = useMemo(() => {
    return Boolean(
      item.data?.deepLink ||
        item.data?.openDirectUrl ||
        item.data?._od ||
        item.customDomainAttributes?.openDirectUrl,
    );
  }, [item.data, item.customDomainAttributes]);

  const StatusIcon = statePill.Icon;

  return (
    <TouchableScale
      onPress={onPress}
      style={[
        styles.card,
        {
          borderLeftWidth: 3.5,
          borderLeftColor: colors.border,
          backgroundColor: colors.cardBg,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`Push Notification: ${item.title || 'Notification'}`}>
      <View style={styles.cardBody}>
        {/* Row 1: Header Row (Serial, Method Badge, Source Chip, JSON Type, Status Pill) */}
        <View style={styles.cardHeaderRow}>
          <View style={styles.cardHeaderLeft}>
            <Text style={styles.serialNumber}>
              #{item.id ? item.id.replace(/^push_/, '').slice(-4) : '1'}
            </Text>

            {/* Vibrant Method Badge (like GET/POST/LOG) */}
            <View
              style={[
                styles.methodBadge,
                {backgroundColor: colors.badgeColor},
              ]}>
              <Text style={styles.methodBadgeText}>{colors.label}</Text>
            </View>

            {/* Source Tag Chip */}
            <View
              style={[
                styles.chip,
                {
                  backgroundColor: `${colors.badgeColor}12`,
                  borderColor: `${colors.badgeColor}2E`,
                },
              ]}>
              <Text
                style={[styles.chipText, {color: colors.badgeColor}]}
                numberOfLines={1}>
                push.{(item.source || 'remote').toLowerCase()}
              </Text>
            </View>

            {/* Structured Payload Type Badge */}
            {payloadKeysCount > 0 && (
              <View
                style={[
                  styles.chip,
                  {
                    backgroundColor: `${AppColors.teal600}14`,
                    borderColor: `${AppColors.teal600}33`,
                  },
                ]}>
                <Text style={[styles.chipText, {color: AppColors.teal600}]}>
                  Payload{`{${payloadKeysCount}}`}
                </Text>
              </View>
            )}

            {/* DeepLink Chip */}
            {hasDeepLink && (
              <View
                style={[
                  styles.chip,
                  {
                    backgroundColor: `${AppColors.brandPurple}14`,
                    borderColor: `${AppColors.brandPurple}33`,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 3,
                  },
                ]}>
                <LinkChainIcon size={10} color={AppColors.brandPurple} />
                <Text style={[styles.chipText, {color: AppColors.brandPurple}]}>
                  {t('push.link', 'Link')}
                </Text>
              </View>
            )}
          </View>

          {/* Right Status Pill & Chevron */}
          <View style={styles.cardHeaderRight}>
            <View
              style={[
                styles.statusPill,
                {
                  backgroundColor: statePill.bg,
                  borderColor: statePill.border,
                },
              ]}>
              <StatusIcon color={statePill.text} size={9.5} />
              <Text style={[styles.statusPillText, {color: statePill.text}]}>
                {statePill.label}
              </Text>
            </View>
            <ForwardChevronIcon color={AppColors.grayTextWeak} size={13} />
          </View>
        </View>

        {/* Row 2: Message Box (Spacious 68px height matching ConsoleLogCard) */}
        <View style={styles.messageBox}>
          <HighlightText
            text={item.title || '(No Title)'}
            searchWords={searchStr ? [searchStr] : []}
            numberOfLines={1}
            style={styles.messageTitle}
            highlightStyle={styles.highlight}
          />
          <HighlightText
            text={item.body || '(No message body)'}
            searchWords={searchStr ? [searchStr] : []}
            numberOfLines={2}
            style={styles.messageBody}
            highlightStyle={styles.highlight}
          />
        </View>

        {/* Row 3: Footer Row (Timestamp & Channel on Left, Payload Keys on Right) */}
        <View style={styles.cardFooterRow}>
          <View style={styles.footerLeft}>
            <View style={styles.cardDateRow}>
              <ClockIcon color={AppColors.slate400} size={10} />
              <Text style={styles.cardDateText} numberOfLines={1}>
                {formatTime(item.timestamp)}
              </Text>
            </View>

            {item.channelId ? (
              <View style={styles.callerChip}>
                <BellIcon color={AppColors.skySoftText} size={8.5} />
                <Text
                  style={styles.callerChipText}
                  numberOfLines={1}
                  ellipsizeMode="middle">
                  {item.channelId}
                </Text>
              </View>
            ) : null}

            {item.customDomainAttributes?.journeyName ? (
              <View
                style={[
                  styles.callerChip,
                  {
                    backgroundColor: `${AppColors.brandPurple}14`,
                    borderColor: `${AppColors.brandPurple}30`,
                  },
                ]}>
                <Text
                  style={[
                    styles.callerChipText,
                    {color: AppColors.brandPurple},
                  ]}
                  numberOfLines={1}
                  ellipsizeMode="middle">
                  {item.customDomainAttributes.journeyName}
                </Text>
              </View>
            ) : null}
          </View>

          <View style={styles.footerRight}>
            {payloadKeysCount > 0 && (
              <View style={styles.metaStatChip}>
                <KeyIcon color={AppColors.purple} size={8.5} />
                <Text style={styles.metaStatText}>
                  {payloadKeysCount} {payloadKeysCount === 1 ? 'key' : 'keys'}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </TouchableScale>
  );
}

const styles = StyleSheet.create({
  card: {
    height: 140,
    alignSelf: 'stretch',
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: AppColors.dividerColor,
    shadowColor: AppColors.shadowColorString,
    marginBottom: 6,
  },
  cardBody: {
    height: '100%',
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 8,
    justifyContent: 'space-between',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 22,
    minHeight: 22,
    maxHeight: 22,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
    gap: 6,
    minWidth: 0,
    overflow: 'hidden',
  },
  cardHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  serialNumber: {
    fontFamily: AppFonts.interBold,
    color: AppColors.grayTextWeak,
    fontSize: 10,
  },
  methodBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodBadgeText: {
    fontFamily: AppFonts.interBold,
    fontSize: 9.5,
    lineHeight: 12,
    letterSpacing: 0.5,
    color: AppColors.white,
  },
  chip: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  chipText: {
    fontFamily: AppFonts.interBold,
    fontSize: 9,
    lineHeight: 12,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
    borderWidth: 1,
    flexShrink: 0,
  },
  statusPillText: {
    fontFamily: AppFonts.interBold,
    fontSize: 10,
    lineHeight: 13,
  },
  messageBox: {
    backgroundColor: AppColors.grayBackground,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: AppColors.dividerColor,
    paddingHorizontal: 10,
    paddingVertical: 6,
    height: 68,
    minHeight: 68,
    maxHeight: 68,
    justifyContent: 'center',
    gap: 2,
    overflow: 'hidden',
  },
  messageTitle: {
    fontFamily: AppFonts.interBold,
    fontSize: 12,
    color: AppColors.primaryBlack,
    lineHeight: 16,
  },
  messageBody: {
    fontFamily: AppFonts.interRegular,
    fontSize: 11,
    color: AppColors.grayText,
    lineHeight: 15,
  },
  highlight: {
    backgroundColor: AppColors.yellowHighlight,
    color: AppColors.primaryBlack,
    borderRadius: 2,
  },
  cardFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 18,
    minHeight: 18,
    maxHeight: 18,
    gap: 6,
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    minWidth: 0,
    overflow: 'hidden',
  },
  footerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flexShrink: 0,
  },
  cardDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3.5,
  },
  cardDateText: {
    fontFamily: AppFonts.interRegular,
    fontSize: 10,
    lineHeight: 13,
    color: AppColors.slate400,
  },
  callerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: AppColors.skySoftBg,
    borderColor: AppColors.skySoftBorder,
    borderWidth: 1,
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
    flexShrink: 1,
    minWidth: 0,
  },
  callerChipText: {
    color: AppColors.skySoftText,
    fontSize: 9,
    lineHeight: 12,
    fontFamily: AppFonts.interBold,
  },
  metaStatChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: `${AppColors.purple}14`,
    borderColor: `${AppColors.purple}2B`,
    borderWidth: 1,
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  metaStatText: {
    color: AppColors.purple,
    fontSize: 9,
    lineHeight: 12,
    fontFamily: AppFonts.interBold,
  },
});

function arePushPropsEqual(
  prev: PushCardProps,
  next: PushCardProps,
): boolean {
  return (
    prev.item === next.item &&
    prev.searchStr === next.searchStr &&
    prev.onPress === next.onPress
  );
}

export default React.memo(PushCard, arePushPropsEqual);
