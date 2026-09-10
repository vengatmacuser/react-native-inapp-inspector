import React, {useState} from 'react';
import {useTranslation} from '../i18n';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {AppColors} from '../styles/AppColors';
import {AppFonts} from '../styles/AppFonts';
import {ConsoleLogCardProps} from '../types';
import {
  formatTime,
  getJsonContent,
  getJsonPreviewText,
  parseStackLine,
  openInVSCode,
  getSize,
  getCleanCallerDisplay,
} from '../helpers';
import TouchableScale from './TouchableScale';
import CopyButton from './CopyButton';
import LogSyntaxHighlighter from './LogSyntaxHighlighter';
import {
  ForwardChevronIcon,
  ExternalLinkIcon,
  FlaskIcon,
  ZapIcon,
  GlobeIcon,
  DiceIcon,
  AtomIcon,
  BarChartIcon,
  KeyIcon,
  SmartphoneIcon,
  AlertTriangleIcon,
  BugIcon,
  TagIcon,
  MapPinIcon,
  StorageIcon,
  SignalIcon,
  FlameIcon,
  MoneyIcon,
  CircleCheckIcon,
  CircleAlertIcon,
  CircleXIcon,
  RefreshCcwIcon,
  PerformanceIcon,
  ChipIcon,
  SettingsIcon,
  TerminalIcon,
  InfoCircleIcon,
  ShieldAlertIcon,
  LayoutIcon,
  ClockIcon,
  SizeIcon,
  PinIcon,
} from './NetworkIcons';
import {useInspector} from './Inspector/InspectorContext';

const getLogMessageWithBadges = (
  message: string,
  searchStr: string,
  textStyle: any,
  highlightStyle: any,
  numberOfLines?: number,
) => {
  if (!message) return null;
  const prefixRegex = /^((?:\[[^\]]+\]\s*)+)/;
  const match = message.match(prefixRegex);
  if (match) {
    const fullPrefix = match[1];
    const remainingText = message.substring(fullPrefix.length);
    const tags = fullPrefix.match(/\[[^\]]+\]/g) || [];

    const getTagDecorator = (tag: string) => {
      const clean = tag
        .replace(/[\[\]]/g, '')
        .trim()
        .toUpperCase();

      // Network / HTTP / API
      if (clean === 'AXIOS') {
        return {color: AppColors.emerald600, Icon: ZapIcon, label: 'AXIOS'};
      }
      if (
        clean === 'API' ||
        clean === 'FETCH' ||
        clean === 'HTTP' ||
        clean === 'REST' ||
        clean === 'NETWORK'
      ) {
        return {color: AppColors.sky600, Icon: GlobeIcon, label: clean};
      }
      if (
        clean === 'GRAPHQL' ||
        clean === 'GQL' ||
        clean === 'APOLLO' ||
        clean === 'MUTATION' ||
        clean === 'QUERY'
      ) {
        return {color: AppColors.pink500, Icon: AtomIcon, label: clean};
      }
      if (
        clean === 'WS' ||
        clean === 'WEBSOCKET' ||
        clean === 'SOCKET' ||
        clean === 'SOCKET.IO' ||
        clean === 'REALTIME'
      ) {
        return {color: AppColors.cyan600, Icon: SignalIcon, label: clean};
      }

      // State Management
      if (
        clean === 'REDUX' ||
        clean === 'STORE' ||
        clean === 'STATE' ||
        clean === 'ZUSTAND' ||
        clean === 'MOBX' ||
        clean === 'RECOIL' ||
        clean === 'ACTION' ||
        clean === 'DISPATCH'
      ) {
        return {color: AppColors.violet600, Icon: AtomIcon, label: clean};
      }

      // Analytics & Tracking
      if (
        clean === 'ANALYTICS' ||
        clean === 'FIREBASE' ||
        clean === 'GA4' ||
        clean === 'GA' ||
        clean === 'SEGMENT' ||
        clean === 'MIXPANEL' ||
        clean === 'POSTHOG' ||
        clean === 'TRACK' ||
        clean === 'EVENT'
      ) {
        return {color: AppColors.teal600, Icon: BarChartIcon, label: clean};
      }

      // Auth & Security & User
      if (
        clean === 'AUTH' ||
        clean === 'TOKEN' ||
        clean === 'SESSION' ||
        clean === 'JWT' ||
        clean === 'LOGIN' ||
        clean === 'LOGOUT' ||
        clean === 'USER'
      ) {
        return {color: AppColors.amber600, Icon: KeyIcon, label: clean};
      }
      if (
        clean === 'SECURITY' ||
        clean === 'SHIELD' ||
        clean === 'PERMISSION' ||
        clean === 'PERMISSIONS'
      ) {
        return {
          color: AppColors.indigo600Alt,
          Icon: ShieldAlertIcon,
          label: clean,
        };
      }

      // Navigation & Routing & Screen
      if (
        clean === 'NAV' ||
        clean === 'NAVIGATION' ||
        clean === 'ROUTE' ||
        clean === 'SCREEN' ||
        clean === 'ROUTER' ||
        clean === 'DEEPLINK'
      ) {
        return {color: AppColors.indigo600Alt, Icon: MapPinIcon, label: clean};
      }

      // Storage & Database & Cache
      if (
        clean === 'STORAGE' ||
        clean === 'ASYNCSTORAGE' ||
        clean === 'MMKV' ||
        clean === 'SQLITE' ||
        clean === 'DB' ||
        clean === 'DATABASE' ||
        clean === 'REALM' ||
        clean === 'CACHE'
      ) {
        return {color: AppColors.purple500, Icon: StorageIcon, label: clean};
      }

      // Performance & Lifecycle
      if (
        clean === 'PERF' ||
        clean === 'RENDER' ||
        clean === 'PERFORMANCE' ||
        clean === 'FPS' ||
        clean === 'MEMORY'
      ) {
        return {
          color: AppColors.violet500,
          Icon: PerformanceIcon,
          label: clean,
        };
      }
      if (
        clean === 'INIT' ||
        clean === 'BOOT' ||
        clean === 'STARTUP' ||
        clean === 'LIFECYCLE' ||
        clean === 'MOUNT' ||
        clean === 'UNMOUNT'
      ) {
        return {color: AppColors.blue600, Icon: ZapIcon, label: clean};
      }

      // Sync & Background & Workers
      if (
        clean === 'SYNC' ||
        clean === 'REFRESH' ||
        clean === 'BACKGROUND' ||
        clean === 'JOB' ||
        clean === 'WORKER'
      ) {
        return {color: AppColors.sky600, Icon: RefreshCcwIcon, label: clean};
      }

      // Push Notifications
      if (
        clean === 'PUSH' ||
        clean === 'NOTIF' ||
        clean === 'NOTIFICATION' ||
        clean === 'FCM' ||
        clean === 'APNS'
      ) {
        return {color: AppColors.darkOrange, Icon: FlameIcon, label: clean};
      }

      // Payment & Commerce
      if (
        clean === 'PAY' ||
        clean === 'PAYMENT' ||
        clean === 'STRIPE' ||
        clean === 'IAP' ||
        clean === 'BILLING' ||
        clean === 'CHECKOUT' ||
        clean === 'CART'
      ) {
        return {color: AppColors.emerald600, Icon: MoneyIcon, label: clean};
      }

      // Device & Hardware & BLE
      if (
        clean === 'DEVICE' ||
        clean === 'HARDWARE' ||
        clean === 'BLE' ||
        clean === 'BLUETOOTH' ||
        clean === 'NFC' ||
        clean === 'SENSOR'
      ) {
        return {color: AppColors.slate600, Icon: ChipIcon, label: clean};
      }
      if (clean === 'LOCATION' || clean === 'GPS' || clean === 'GEO') {
        return {color: AppColors.emerald600, Icon: MapPinIcon, label: clean};
      }
      if (clean === 'APP') {
        return {
          color: AppColors.indigo600Alt,
          Icon: SmartphoneIcon,
          label: 'APP',
        };
      }

      // UI & Theme
      if (
        clean === 'UI' ||
        clean === 'VIEW' ||
        clean === 'THEME' ||
        clean === 'STYLE' ||
        clean === 'LAYOUT'
      ) {
        return {color: AppColors.pink600, Icon: LayoutIcon, label: clean};
      }

      // Testing & Samples
      if (clean === 'TEST' || clean === 'MOCK' || clean === 'SPEC') {
        return {color: AppColors.emerald500, Icon: FlaskIcon, label: 'TEST'};
      }
      if (clean === 'SAMPLE' || clean === 'BATCH') {
        return {color: AppColors.indigo600Alt, Icon: DiceIcon, label: clean};
      }

      // Debug / Config
      if (clean === 'CONFIG' || clean === 'ENV' || clean === 'SETTINGS') {
        return {color: AppColors.slate700, Icon: SettingsIcon, label: clean};
      }
      if (clean === 'DEBUG' || clean === 'TRACE') {
        return {color: AppColors.purpleText, Icon: TerminalIcon, label: clean};
      }
      if (clean === 'INFO') {
        return {color: AppColors.sky600, Icon: InfoCircleIcon, label: 'INFO'};
      }

      // Statuses & Warnings / Errors
      if (
        clean === 'SUCCESS' ||
        clean === 'OK' ||
        clean === 'DONE' ||
        clean === 'PASSED'
      ) {
        return {color: AppColors.green600, Icon: CircleCheckIcon, label: clean};
      }
      if (clean === 'WARN' || clean === 'WARNING') {
        return {
          color: AppColors.amber600,
          Icon: AlertTriangleIcon,
          label: 'WARN',
        };
      }
      if (
        clean === 'ERROR' ||
        clean === 'CRASH' ||
        clean === 'BUG' ||
        clean === 'FATAL' ||
        clean === 'EXCEPTION' ||
        clean === 'FAIL'
      ) {
        return {
          color: AppColors.red600,
          Icon: BugIcon,
          label:
            clean === 'CRASH' ||
            clean === 'BUG' ||
            clean === 'FATAL' ||
            clean === 'EXCEPTION' ||
            clean === 'FAIL'
              ? clean
              : 'ERROR',
        };
      }
      return {color: AppColors.slate600, Icon: TagIcon, label: clean};
    };

    return (
      <View style={{flexDirection: 'column', gap: 2}}>
        <View style={{flexDirection: 'row', gap: 4, overflow: 'hidden'}}>
          {tags.slice(0, 2).map((tag, i) => {
            const dec = getTagDecorator(tag);
            const IconComp = dec.Icon;
            return (
              <View
                key={i}
                style={[
                  styles.prefixTag,
                  {
                    backgroundColor: `${dec.color}12`,
                    borderColor: `${dec.color}30`,
                  },
                ]}>
                <IconComp color={dec.color} size={8.5} />
                <Text style={[styles.prefixTagText, {color: dec.color}]}>
                  {dec.label}
                </Text>
              </View>
            );
          })}
        </View>
        <LogSyntaxHighlighter
          text={remainingText}
          search={searchStr}
          style={textStyle}
          numberOfLines={1}
          detectLinks={false}
        />
      </View>
    );
  }

  return (
    <LogSyntaxHighlighter
      text={message}
      search={searchStr}
      style={textStyle}
      numberOfLines={numberOfLines || 2}
      detectLinks={false}
    />
  );
};

export const ConsoleLogCard = React.memo(function ConsoleLogCard({
  item,
  searchStr = '',
}: ConsoleLogCardProps) {
  const {setSelectedLog} = useInspector();
  const {t} = useTranslation();
  const jsonContent = getJsonContent(item.message);
  const isAnalyticsError = item.message
    .toLowerCase()
    .includes('[analytics error]');
  const parsedCaller = React.useMemo(() => {
    const info = getCleanCallerDisplay(item.caller);
    if (!info) return null;
    const parsed = parseStackLine(item.caller, true);
    return {
      ...parsed,
      display: info.display,
      fileName: info.fileName,
      lineNumber: info.lineNumber || parsed.lineNumber,
    };
  }, [item.caller]);

  const getLogColors = () => {
    const type = (item.type || 'log').toLowerCase();
    const method = ((item as any).sourceMethod || type).toLowerCase();

    if (isAnalyticsError || type === 'error' || method === 'error') {
      return {
        badgeColor: AppColors.errorColor,
        border: AppColors.errorColor,
        badgeBg: `${AppColors.errorColor}18`,
        badgeText: AppColors.errorColor,
        label: 'ERROR',
        cardBg: AppColors.errorCardBg,
        statusPillBg: `${AppColors.errorColor}14`,
        statusPillBorder: `${AppColors.errorColor}33`,
        statusPillText: AppColors.errorColor,
        StatusIcon: CircleXIcon,
      };
    }
    if (type === 'warn' || method === 'warn') {
      return {
        badgeColor: AppColors.darkOrange,
        border: AppColors.darkOrange,
        badgeBg: `${AppColors.darkOrange}18`,
        badgeText: AppColors.darkOrange,
        label: 'WARN',
        cardBg: AppColors.warnCardBg,
        statusPillBg: `${AppColors.darkOrange}14`,
        statusPillBorder: `${AppColors.darkOrange}33`,
        statusPillText: AppColors.darkOrange,
        StatusIcon: CircleAlertIcon,
      };
    }
    if (type === 'debug' || method === 'debug') {
      return {
        badgeColor: AppColors.purple,
        border: AppColors.purple,
        badgeBg: `${AppColors.purple}18`,
        badgeText: AppColors.purple,
        label: 'DEBUG',
        cardBg: AppColors.purpleTintBg,
        statusPillBg: `${AppColors.purple}14`,
        statusPillBorder: `${AppColors.purple}33`,
        statusPillText: AppColors.purple,
        StatusIcon: ZapIcon,
      };
    }
    if (method === 'info' || (type === 'info' && method !== 'log')) {
      return {
        badgeColor: AppColors.sky600,
        border: AppColors.sky600,
        badgeBg: `${AppColors.sky600}18`,
        badgeText: AppColors.sky600,
        label: 'INFO',
        cardBg: AppColors.blueTintBg,
        statusPillBg: `${AppColors.sky600}14`,
        statusPillBorder: `${AppColors.sky600}33`,
        statusPillText: AppColors.sky600,
        StatusIcon: InfoCircleIcon,
      };
    }

    // Default / Standard console.log
    return {
      badgeColor: AppColors.brandPurple,
      border: AppColors.brandPurple,
      badgeBg: `${AppColors.brandPurple}15`,
      badgeText: AppColors.brandPurple,
      label: 'LOG',
      cardBg: AppColors.white,
      statusPillBg: `${AppColors.brandPurple}12`,
      statusPillBorder: `${AppColors.brandPurple}2E`,
      statusPillText: AppColors.brandPurple,
      StatusIcon: CircleCheckIcon,
    };
  };

  const colors = getLogColors();
  const StatusIconComp = colors.StatusIcon;

  const jsonPreview = jsonContent ? getJsonPreviewText(jsonContent.data) : null;

  const openDetail = () => {
    setSelectedLog(item);
  };

  const sourceMethodName =
    ('sourceMethod' in item ? item.sourceMethod : undefined) ||
    item.type ||
    'log';

  return (
    <View style={styles.container}>
      <TouchableScale
        onPress={openDetail}
        style={[
          styles.card,
          {
            borderLeftWidth: 3.5,
            borderLeftColor: colors.border,
            backgroundColor: colors.cardBg,
          },
        ]}>
        <View style={styles.cardBody}>
          {/* Row 1: Header Row (Serial, Method Badge, Source Chip, JSON Type, Duplicate Badge, Status Pill) */}
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardHeaderLeft}>
              <Text style={styles.serialNumber}>
                #{item.id != null ? item.id + 1 : 1}
              </Text>

              {/* Vibrant Method Badge (like GET/POST in API list card) */}
              <View
                style={[
                  styles.methodBadge,
                  {backgroundColor: colors.badgeColor},
                ]}>
                <Text style={styles.methodBadgeText}>{colors.label}</Text>
              </View>

              {/* Source Method Chip */}
              <View
                style={[
                  styles.chip,
                  {
                    backgroundColor: `${colors.badgeColor}12`,
                    borderColor: `${colors.badgeColor}2E`,
                  },
                ]}>
                <Text style={[styles.chipText, {color: colors.badgeColor}]} numberOfLines={1}>
                  console.{sourceMethodName}
                </Text>
              </View>

              {/* Structured JSON Payload Type Badge */}
              {jsonContent && (
                <View
                  style={[
                    styles.chip,
                    {
                      backgroundColor: `${AppColors.teal600}14`,
                      borderColor: `${AppColors.teal600}33`,
                    },
                  ]}>
                  <Text style={[styles.chipText, {color: AppColors.teal600}]}>
                    {Array.isArray(jsonContent.data)
                      ? `Array[${jsonContent.data.length}]`
                      : `Object{${Object.keys(jsonContent.data).length}}`}
                  </Text>
                </View>
              )}

              {/* Duplicate Count Badge */}
              {'duplicateCount' in item &&
                item.duplicateCount != null &&
                item.duplicateCount > 1 && (
                  <View style={styles.dupBadge}>
                    <Text style={styles.dupBadgeText}>
                      ×{item.duplicateCount}
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
                    backgroundColor: colors.statusPillBg,
                    borderColor: colors.statusPillBorder,
                  },
                ]}>
                <StatusIconComp color={colors.statusPillText} size={9.5} />
                <Text
                  style={[styles.statusPillText, {color: colors.statusPillText}]}>
                  {colors.label}
                </Text>
              </View>
              <ForwardChevronIcon color={AppColors.grayTextWeak} size={13} />
            </View>
          </View>

          {/* Row 2: Message Box (Spacious 68px static height for 3 lines) */}
          <View style={styles.messageBox}>
            {jsonContent ? (
              <View style={styles.jsonPreviewRow}>
                {jsonContent.header ? (
                  <LogSyntaxHighlighter
                    text={jsonContent.header}
                    search={searchStr}
                    style={styles.messageText}
                    detectLinks={false}
                    numberOfLines={1}
                  />
                ) : null}
                {jsonPreview && (
                  <LogSyntaxHighlighter
                    text={jsonPreview.text.replace(/\s+/g, ' ')}
                    search={searchStr}
                    style={styles.jsonPreviewText}
                    detectLinks={false}
                    numberOfLines={jsonContent.header ? 2 : 3}
                  />
                )}
              </View>
            ) : (
              getLogMessageWithBadges(
                item.message,
                searchStr,
                styles.messageText,
                styles.highlight,
                3,
              )
            )}
          </View>

          {/* Row 3: Footer Row (Timestamp & File Caller on Left, JSON Size & Badges on Right) */}
          <View style={styles.cardFooterRow}>
            <View style={styles.footerLeft}>
              <View style={styles.cardDateRow}>
                <ClockIcon color={AppColors.grayTextWeak} size={10} />
                <Text style={styles.cardDateText} numberOfLines={1}>
                  {formatTime(item.timestamp)}
                </Text>
              </View>

              {parsedCaller && (
                <Pressable
                  onPress={e => {
                    e.stopPropagation?.();
                    openInVSCode(
                      parsedCaller.rawFilePath ||
                        parsedCaller.fullPath ||
                        parsedCaller.fileName,
                      parsedCaller.lineNumber,
                      parsedCaller.columnNumber,
                    );
                  }}
                  hitSlop={8}
                  style={styles.callerChip}>
                  {parsedCaller.fileExt && parsedCaller.fileExt !== 'other' && (
                    <View
                      style={[
                        styles.extBadge,
                        {
                          backgroundColor:
                            parsedCaller.fileExt === 'tsx' ||
                            parsedCaller.fileExt === 'ts'
                              ? `${AppColors.brandPurple}22`
                              : `${AppColors.teal600}22`,
                        },
                      ]}>
                      <Text
                        style={[
                          styles.extBadgeText,
                          {
                            color:
                              parsedCaller.fileExt === 'tsx' ||
                              parsedCaller.fileExt === 'ts'
                                ? AppColors.brandPurple
                                : AppColors.teal600,
                          },
                        ]}>
                        {parsedCaller.fileExt.toUpperCase()}
                      </Text>
                    </View>
                  )}
                  <Text
                    style={styles.callerChipText}
                    numberOfLines={1}
                    ellipsizeMode="middle">
                    {parsedCaller.display}
                  </Text>
                  <ExternalLinkIcon color={AppColors.sky600} size={8} />
                </Pressable>
              )}
            </View>

            <View style={styles.footerRight}>
              {jsonContent && (
                <View style={styles.metaStatChip}>
                  <SizeIcon color={AppColors.purple} size={8.5} />
                  <Text style={styles.metaStatText}>
                    {getSize(jsonContent.data)}
                  </Text>
                </View>
              )}

              {isAnalyticsError && (
                <View
                  style={[
                    styles.chip,
                    {
                      backgroundColor: `${AppColors.skyBlue}15`,
                      borderColor: `${AppColors.skyBlue}30`,
                    },
                  ]}>
                  <Text style={[styles.chipText, {color: AppColors.skyBlue}]}>
                    {t('console.analyticsBadge') || 'ANALYTICS'}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Bottom Accent Bar (matching LogCard waterfall bar height) */}
          <View
            style={[
              styles.bottomAccentBar,
              {backgroundColor: `${colors.border}35`},
            ]}
          />
        </View>
      </TouchableScale>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    height: 148,
    justifyContent: 'center',
  },
  card: {
    height: 140,
    alignSelf: 'stretch',
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: AppColors.dividerColor,
    shadowColor: AppColors.shadowColorString,
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
  dupBadge: {
    backgroundColor: `${AppColors.purple}14`,
    borderColor: `${AppColors.purple}2E`,
    borderWidth: 1,
    paddingHorizontal: 4.5,
    paddingVertical: 1,
    borderRadius: 3.5,
  },
  dupBadgeText: {
    fontFamily: AppFonts.interBold,
    fontSize: 8.5,
    color: AppColors.purple,
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
  messageText: {
    fontFamily: AppFonts.interMedium,
    fontSize: 12,
    color: AppColors.primaryBlack,
    lineHeight: 17,
  },
  highlight: {
    backgroundColor: AppColors.yellowHighlight,
    color: AppColors.primaryBlack,
    borderRadius: 2,
  },
  jsonPreviewRow: {
    flexDirection: 'column',
    justifyContent: 'center',
    gap: 2,
  },
  jsonPreviewText: {
    fontFamily: AppFonts.interMedium,
    fontSize: 11,
    color: AppColors.teal700,
    lineHeight: 15,
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
  extBadge: {
    borderRadius: 3,
    paddingHorizontal: 3,
    paddingVertical: 0.5,
  },
  extBadgeText: {
    fontFamily: AppFonts.interBold,
    fontSize: 7.5,
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
    backgroundColor: AppColors.violetSoftBg,
    borderColor: AppColors.violetSoftBorder,
    borderWidth: 1,
    paddingHorizontal: 5.5,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  metaStatText: {
    fontFamily: AppFonts.interBold,
    color: AppColors.violetSoftText,
    fontSize: 9,
    lineHeight: 12,
  },
  prefixTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2.5,
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 3.5,
    borderWidth: 1,
  },
  prefixTagText: {
    fontFamily: AppFonts.interBold,
    fontSize: 8.5,
    letterSpacing: 0.3,
  },
  bottomAccentBar: {
    height: 2.5,
    width: '100%',
    borderRadius: 1.5,
    marginTop: 2,
  },
});

export default ConsoleLogCard;
