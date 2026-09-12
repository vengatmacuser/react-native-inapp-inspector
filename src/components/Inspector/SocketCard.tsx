import React, {useMemo, useRef, useEffect} from 'react';
import {
  Alert,
  Animated,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, {Path} from 'react-native-svg';
import {AppColors} from '../../styles/AppColors';
import {AppFonts} from '../../styles/AppFonts';
import {formatDateTime, formatTime} from '../../helpers';
import {
  CalendarIcon,
  ClockIcon,
  CircleCheckIcon,
  CircleAlertIcon,
  CircleXIcon,
  ForwardChevronIcon,
  GlobeIcon,
  LockIcon,
  ReceiveFrameIcon,
  SendFrameIcon,
  SizeIcon,
} from '../NetworkIcons';
import HighlightText from '../HighlightText';
import TouchableScale from '../TouchableScale';
import {useTranslation} from '../../i18n';
import type {SocketCardProps} from '../../types';

function formatByteSize(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function SocketCard({
  item,
  onPress,
  searchStr,
  isNew,
  isSelected,
  onToggleSelect,
  serialNumber,
}: SocketCardProps) {
  const {t} = useTranslation();
  const isWss = item.url.startsWith('wss://') || item.url.startsWith('https://');
  const isSocketIo = item.client === 'socket.io' || item.url.includes('/socket.io');

  const protocolPill = useMemo(() => {
    if (isSocketIo) {
      return {
        label: 'SIO',
        color: AppColors.violet600,
        bg: `${AppColors.violet600}14`,
        border: `${AppColors.violet600}35`,
      };
    }
    if (isWss) {
      return {
        label: 'WSS',
        color: AppColors.emerald600,
        bg: `${AppColors.emerald600}14`,
        border: `${AppColors.emerald600}35`,
      };
    }
    return {
      label: 'WS',
      color: AppColors.blue600,
      bg: `${AppColors.blue600}14`,
      border: `${AppColors.blue600}35`,
    };
  }, [isSocketIo, isWss]);

  const status = item.status || 'open';
  const isOpen = status === 'open';
  const isConnecting = status === 'connecting';
  const isError = status === 'error';

  const cardStatusColor = useMemo(() => {
    if (isOpen) return AppColors.greenColor;
    if (isConnecting) return AppColors.amber600;
    if (isError) return AppColors.errorColor;
    return AppColors.slate400;
  }, [isOpen, isConnecting, isError]);

  const statusPill = useMemo(() => {
    if (isOpen) {
      return {
        label: 'OPEN',
        color: AppColors.greenColor,
        bg: `${AppColors.greenColor}15`,
        border: `${AppColors.greenColor}40`,
      };
    }
    if (isConnecting) {
      return {
        label: 'CONNECTING',
        color: AppColors.amber600,
        bg: `${AppColors.amber600}15`,
        border: `${AppColors.amber600}40`,
      };
    }
    if (isError) {
      return {
        label: item.closeCode ? `ERR ${item.closeCode}` : 'ERROR',
        color: AppColors.errorColor,
        bg: `${AppColors.errorColor}15`,
        border: `${AppColors.errorColor}40`,
      };
    }
    return {
      label: item.closeCode ? `CLOSED (${item.closeCode})` : 'CLOSED',
      color: AppColors.slate500,
      bg: `${AppColors.slate500}15`,
      border: `${AppColors.slate500}40`,
    };
  }, [isOpen, isConnecting, isError, item.closeCode]);

  const urlParsed = useMemo(() => {
    try {
      const clean = item.url.replace(/^(wss?|https?):\/\//, '');
      const slashIdx = clean.indexOf('/');
      if (slashIdx >= 0) {
        const host = clean.substring(0, slashIdx);
        const path = clean.substring(slashIdx);
        return {host, path};
      }
      return {host: clean, path: '/'};
    } catch {
      return {host: item.url, path: '/'};
    }
  }, [item.url]);

  const handleOpenUrl = (e?: any) => {
    e?.stopPropagation?.();
    const httpUrl = item.url
      .replace(/^wss:\/\//i, 'https://')
      .replace(/^ws:\/\//i, 'http://');

    Alert.alert(
      t('common.openInBrowser', 'Open in Browser'),
      `${t('common.openInBrowserPrompt', 'Are you sure you want to open this URL in your external browser?')}\n\n${httpUrl}`,
      [
        {text: t('common.cancel', 'Cancel'), style: 'cancel'},
        {
          text: t('common.open', 'Open'),
          onPress: () => {
            Linking.canOpenURL(httpUrl)
              .then(supported => {
                if (supported) {
                  Linking.openURL(httpUrl);
                } else {
                  Linking.openURL(httpUrl).catch(() => {});
                }
              })
              .catch(() => {});
          },
        },
      ],
    );
  };

  const shimmerOpacity = useRef(new Animated.Value(isNew ? 0.35 : 0)).current;
  useEffect(() => {
    if (isNew) {
      Animated.timing(shimmerOpacity, {
        toValue: 0,
        duration: 1200,
        useNativeDriver: false,
      }).start();
    }
  }, [isNew, shimmerOpacity]);

  const totalBytes = (item.totalBytesSent || 0) + (item.totalBytesReceived || 0);
  const durationLabel = item.duration != null ? `${item.duration}ms` : 'Active';
  const triggeredAt = formatDateTime(item.startTime);

  return (
    <View style={styles.container}>
      <TouchableScale
        onPress={onPress}
        style={[
          styles.card,
          {
            borderLeftWidth: 3.5,
            borderLeftColor: cardStatusColor,
            backgroundColor: isError ? AppColors.errorCardBg : AppColors.white,
          },
          isNew && styles.cardNew,
        ]}>
        <View style={styles.cardBody}>
          {/* Row 1: Header (Checkbox, Serial, Protocol Badge, Client Chip, Status Pill, Globe, Chevron) */}
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardHeaderLeft}>
              {onToggleSelect && (
                <Pressable
                  onPress={() => onToggleSelect(item.id)}
                  hitSlop={12}
                  style={[
                    styles.smallCheckbox,
                    isSelected && styles.smallCheckboxChecked,
                  ]}>
                  {isSelected && (
                    <Svg width={9} height={9} viewBox="0 0 24 24" fill="none">
                      <Path
                        d="M20 6L9 17l-5-5"
                        stroke={AppColors.white}
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </Svg>
                  )}
                </Pressable>
              )}

              {serialNumber != null && (
                <Text style={styles.serialNumber}>#{serialNumber}</Text>
              )}

              {/* Protocol Badge */}
              <View
                style={[
                  styles.protocolBadge,
                  {backgroundColor: protocolPill.bg, borderColor: protocolPill.border},
                ]}>
                <Text style={[styles.protocolBadgeText, {color: protocolPill.color}]}>
                  {protocolPill.label}
                </Text>
              </View>

              {/* Client / Framework Chip */}
              {isSocketIo && (
                <View
                  style={[
                    styles.chip,
                    {
                      backgroundColor: `${AppColors.violet600}12`,
                      borderColor: `${AppColors.violet600}2B`,
                    },
                  ]}>
                  <Text style={[styles.chipText, {color: AppColors.violet600}]}>
                    SOCKET.IO
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.cardHeaderRight}>
              {/* Status Pill */}
              <View
                style={[
                  styles.statusPill,
                  {
                    backgroundColor: statusPill.bg,
                    borderColor: statusPill.border,
                  },
                ]}>
                {isOpen ? (
                  <View style={styles.pulsingDot} />
                ) : isConnecting ? (
                  <ClockIcon color={AppColors.amber600} size={9} />
                ) : isError ? (
                  <CircleXIcon color={AppColors.errorColor} size={9} />
                ) : (
                  <CircleCheckIcon color={AppColors.slate500} size={9} />
                )}
                <Text style={[styles.statusPillText, {color: statusPill.color}]}>
                  {statusPill.label}
                </Text>
              </View>

              <Pressable
                onPress={handleOpenUrl}
                hitSlop={8}
                style={styles.globeBtn}
                accessibilityRole="button"
                accessibilityLabel="Open in Browser">
                <GlobeIcon color={AppColors.grayTextWeak} size={12} />
              </Pressable>

              <ForwardChevronIcon color={AppColors.grayTextWeak} size={13} />
            </View>
          </View>

          {/* Row 2: Smart URL Box (Path Prominent, Host Subtitle) */}
          <View style={styles.urlBox}>
            <View style={styles.urlMainRow}>
              <HighlightText
                text={urlParsed.path}
                search={searchStr}
                style={styles.pathText}
                highlightStyle={styles.highlight}
                numberOfLines={1}
                ellipsizeMode="middle"
              />
            </View>

            <View style={styles.hostRow}>
              <View
                style={[
                  styles.protoBadge,
                  {
                    backgroundColor: isWss
                      ? `${AppColors.emerald600}12`
                      : `${AppColors.blue600}12`,
                    borderColor: isWss
                      ? `${AppColors.emerald600}2B`
                      : `${AppColors.blue600}2B`,
                  },
                ]}>
                {isWss ? (
                  <LockIcon size={9} color={AppColors.emerald600} />
                ) : (
                  <GlobeIcon size={9} color={AppColors.blue600} />
                )}
                <Text
                  style={[
                    styles.protoBadgeText,
                    {
                      color: isWss ? AppColors.emerald600 : AppColors.blue600,
                    },
                  ]}>
                  {isWss ? 'WSS' : 'WS'}
                </Text>
              </View>

              <Text
                style={styles.hostText}
                numberOfLines={1}
                ellipsizeMode="tail">
                {urlParsed.host}
              </Text>
            </View>
          </View>

          {/* Row 3: Footer (Timestamp on Left, Frame Counts, Size & Duration on Right) */}
          <View style={styles.cardFooterRow}>
            <View style={styles.footerLeft}>
              <View style={styles.cardDateRow}>
                <CalendarIcon color={AppColors.grayTextWeak} size={10} />
                <Text style={styles.cardDateText} numberOfLines={1}>
                  {triggeredAt || formatTime(item.startTime)}
                </Text>
              </View>
            </View>

            <View style={styles.footerRight}>
              {/* Sent Frames Chip */}
              <View
                style={[
                  styles.metaStatChip,
                  {
                    backgroundColor: `${AppColors.blue600}10`,
                    borderColor: `${AppColors.blue600}26`,
                  },
                ]}>
                <SendFrameIcon size={9} color={AppColors.blue600} />
                <Text style={[styles.metaStatText, {color: AppColors.blue600}]}>
                  {item.sentCount || 0}
                </Text>
              </View>

              {/* Received Frames Chip */}
              <View
                style={[
                  styles.metaStatChip,
                  {
                    backgroundColor: `${AppColors.emerald600}10`,
                    borderColor: `${AppColors.emerald600}26`,
                  },
                ]}>
                <ReceiveFrameIcon size={9} color={AppColors.emerald600} />
                <Text style={[styles.metaStatText, {color: AppColors.emerald600}]}>
                  {item.receivedCount || 0}
                </Text>
              </View>

              {/* Total Size Chip */}
              {totalBytes > 0 && (
                <View
                  style={[
                    styles.metaStatChip,
                    {
                      backgroundColor: `${AppColors.purple}10`,
                      borderColor: `${AppColors.purple}26`,
                    },
                  ]}>
                  <SizeIcon size={9} color={AppColors.purple} />
                  <Text style={[styles.metaStatText, {color: AppColors.purple}]}>
                    {formatByteSize(totalBytes)}
                  </Text>
                </View>
              )}

              {/* Duration / Live Chip */}
              <View
                style={[
                  styles.metaStatChip,
                  {
                    backgroundColor: isOpen
                      ? `${AppColors.greenColor}10`
                      : `${AppColors.slate400}10`,
                    borderColor: isOpen
                      ? `${AppColors.greenColor}26`
                      : `${AppColors.slate400}26`,
                  },
                ]}>
                <ClockIcon
                  size={9}
                  color={isOpen ? AppColors.greenColor : AppColors.grayTextWeak}
                />
                <Text
                  style={[
                    styles.metaStatText,
                    {
                      color: isOpen
                        ? AppColors.greenColor
                        : AppColors.grayTextWeak,
                    },
                  ]}>
                  {durationLabel}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </TouchableScale>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 4,
    marginBottom: 6,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AppColors.dividerColor,
    shadowColor: AppColors.shadowColorString,
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    overflow: 'hidden',
  },
  cardNew: {
    borderColor: `${AppColors.brandPurple}66`,
    backgroundColor: `${AppColors.brandPurple}05`,
  },
  cardBody: {
    padding: 10,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    minWidth: 0,
  },
  smallCheckbox: {
    width: 15,
    height: 15,
    borderRadius: 3.5,
    borderWidth: 1.2,
    borderColor: AppColors.grayTextWeak,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppColors.white,
    marginRight: 2,
  },
  smallCheckboxChecked: {
    backgroundColor: AppColors.purple,
    borderColor: AppColors.purple,
  },
  serialNumber: {
    fontFamily: AppFonts.interSemiBold,
    fontSize: 10.5,
    color: AppColors.grayTextWeak,
  },
  protocolBadge: {
    paddingHorizontal: 5.5,
    paddingVertical: 1.5,
    borderRadius: 5,
    borderWidth: 1,
  },
  protocolBadgeText: {
    fontFamily: AppFonts.interBold,
    fontSize: 9.5,
    letterSpacing: 0.3,
  },
  chip: {
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
    borderWidth: 1,
  },
  chipText: {
    fontFamily: AppFonts.interBold,
    fontSize: 9,
    letterSpacing: 0.2,
  },
  cardHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
    borderWidth: 1,
  },
  statusPillText: {
    fontFamily: AppFonts.interBold,
    fontSize: 9.5,
    letterSpacing: 0.3,
  },
  pulsingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: AppColors.greenColor,
  },
  globeBtn: {
    padding: 3,
    borderRadius: 4,
    backgroundColor: `${AppColors.grayTextWeak}12`,
  },
  urlBox: {
    marginBottom: 8,
  },
  urlMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
    marginBottom: 3,
  },
  pathText: {
    flex: 1,
    fontFamily: AppFonts.interBold,
    fontSize: 12.5,
    color: AppColors.grayTextStrong,
    lineHeight: 17,
  },
  highlight: {
    backgroundColor: 'rgba(250, 204, 21, 0.40)',
    color: AppColors.grayTextStrong,
    borderRadius: 2,
  },
  hostRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  protoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 4.5,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 1,
  },
  protoBadgeText: {
    fontFamily: AppFonts.interBold,
    fontSize: 8.5,
    letterSpacing: 0.2,
  },
  hostText: {
    flex: 1,
    fontFamily: AppFonts.interMedium,
    fontSize: 11,
    color: AppColors.grayTextWeak,
  },
  cardFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: AppColors.dividerColor,
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
    marginRight: 6,
  },
  cardDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cardDateText: {
    fontFamily: AppFonts.interMedium,
    fontSize: 10,
    color: AppColors.grayTextWeak,
  },
  footerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaStatChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  metaStatText: {
    fontFamily: AppFonts.interSemiBold,
    fontSize: 9.5,
  },
});

function areSocketPropsEqual(
  prev: SocketCardProps,
  next: SocketCardProps,
): boolean {
  return (
    prev.item === next.item &&
    prev.isSelected === next.isSelected &&
    prev.isNew === next.isNew &&
    prev.searchStr === next.searchStr &&
    prev.serialNumber === next.serialNumber &&
    prev.onPress === next.onPress &&
    prev.onToggleSelect === next.onToggleSelect
  );
}

export default React.memo(SocketCard, areSocketPropsEqual);

