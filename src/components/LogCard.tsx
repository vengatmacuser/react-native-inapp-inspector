import {Method} from '../types';
import React, {useEffect, useRef, useMemo} from 'react';
import {
  Alert,
  Animated,
  Linking,
  View,
  Pressable,
  Text,
  StyleSheet,
} from 'react-native';
import Svg, {Path} from 'react-native-svg';
import {AppColors} from '../styles/AppColors';
import {METHOD_COLORS} from '../constants';
import {
  getStatusColor,
  getDurationColor,
  formatDateTime,
  getSize,
  getPath,
  getBaseUrl,
} from '../helpers';
import {
  CalendarIcon,
  ClockIcon,
  SizeIcon,
  GlobeIcon,
  CircleCheckIcon,
  CircleAlertIcon,
  CircleXIcon,
  RepeatIcon,
  PinIcon,
} from './NetworkIcons';
import {AppFonts} from '../styles/AppFonts';
import {LogCardProps} from '../types';
import HighlightText from './HighlightText';
import TouchableScale from './TouchableScale';
import {useTranslation} from '../i18n';

const LogCard = React.memo(function LogCard({
  item,
  onPress,
  timelineMinStart,
  timelineTotalRange,
  isNew,
  isSelected,
  onToggleSelect,
  searchStr,
}: LogCardProps) {
  const {t} = useTranslation();
  const methodColor = METHOD_COLORS[item.method as Method] ?? METHOD_COLORS.ALL;

  const urlParsed = useMemo(() => {
    try {
      const u = new URL(item.url);
      const host = u.host;
      const path = u.pathname + (u.search ? u.search : '');
      const isHttps = u.protocol === 'https:';
      return {host, path: path || '/', isHttps};
    } catch {
      const isHttps = item.url.toLowerCase().startsWith('https:');
      const path = getPath(item.url);
      const host = getBaseUrl(item.url).replace(/^https?:\/\//, '');
      return {host, path: path || item.url, isHttps};
    }
  }, [item.url]);

  const handleOpenUrl = (e?: any) => {
    e?.stopPropagation?.();
    Alert.alert(
      t('common.openInBrowser') || 'Open in Browser',
      `${t('common.openInBrowserPrompt') || 'Are you sure you want to open this URL in your external browser?'}\n\n${item.url}`,
      [
        {text: t('common.cancel') || 'Cancel', style: 'cancel'},
        {
          text: t('common.open') || 'Open',
          onPress: () => {
            Linking.canOpenURL(item.url)
              .then(supported => {
                if (supported) {
                  Linking.openURL(item.url);
                } else {
                  Linking.openURL(item.url).catch(() => {});
                }
              })
              .catch(() => {});
          },
        },
      ],
    );
  };

  const isFailed =
    item.status === 0 || (item.status != null && item.status >= 400);
  const isLoading = item.status == null;
  const statusColor = getStatusColor(item.status);
  const durationColor = getDurationColor(item.duration);

  const cardStatusColor = isLoading
    ? AppColors.darkOrange
    : isFailed
    ? AppColors.errorColor
    : AppColors.greenColor;

  const shimmerOpacity = useRef(new Animated.Value(isNew ? 0.35 : 0)).current;
  useEffect(() => {
    if (isNew) {
      Animated.timing(shimmerOpacity, {
        toValue: 0,
        duration: 1200,
        useNativeDriver: false,
      }).start();
    }
  }, [isNew]);

  const getStatusText = () => {
    if (isLoading) return '...';
    if (item.status === 0 || item.status == null) {
      return t('network.statusFailed') || 'FAILED';
    }
    const num = typeof item.status === 'number' ? item.status : parseInt(String(item.status || 0), 10);
    if (num === 200) return '200 OK';
    if (num === 201) return '201 Created';
    if (num === 204) return '204 No Content';
    if (num === 304) return '304 Not Modified';
    if (num === 400) return '400 Bad Req';
    if (num === 401) return '401 Unauth';
    if (num === 403) return '403 Forbidden';
    if (num === 404) return '404 Not Found';
    if (num === 500) return '500 Error';
    return String(item.status);
  };

  const renderStatusIcon = () => {
    if (isLoading) {
      return <ClockIcon color={AppColors.darkOrange} size={10} />;
    }
    const num = typeof item.status === 'number' ? item.status : parseInt(String(item.status || 0), 10);
    if (num >= 200 && num < 300) {
      return <CircleCheckIcon color={AppColors.greenColor} size={10} />;
    }
    if (num >= 300 && num < 400) {
      return <RepeatIcon color={AppColors.amber700} size={10} />;
    }
    if (num >= 400 && num < 500) {
      return <CircleAlertIcon color={AppColors.darkOrange} size={10} />;
    }
    return <CircleXIcon color={AppColors.errorColor} size={10} />;
  };

  const triggeredAt = formatDateTime(item.startTime);
  const isJson = item.url.split('?')[0].toLowerCase().endsWith('.json');

  return (
    <View style={styles.container}>
      <TouchableScale
        onPress={onPress}
        style={[
          styles.card,
          {
            borderLeftWidth: 3.5,
            borderLeftColor: cardStatusColor,
            backgroundColor: isFailed ? '#FFF8F8' : AppColors.white,
          },
        ]}>
        <View style={styles.cardBody}>
          {/* Row 1: Header (Checkbox, Serial, Method Badge, Client Tag, Protocol, Status Pill) */}
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardHeaderLeft}>
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

              <Text style={styles.serialNumber}>#{item.id + 1}</Text>

              <View
                style={[styles.methodBadge, {backgroundColor: methodColor}]}>
                <Text style={styles.methodBadgeText}>
                  {item.method}
                </Text>
              </View>

              {item.client && (
                <View
                  style={[
                    styles.chip,
                    {
                      backgroundColor:
                        item.client === 'axios'
                          ? `${AppColors.purple}14`
                          : item.client === 'apollo' || item.client === 'graphql'
                          ? `${AppColors.pink500}14`
                          : item.client === 'xhr'
                          ? `${AppColors.amber500}14`
                          : `${AppColors.sky500}14`,
                      borderColor:
                        item.client === 'axios'
                          ? `${AppColors.purple}30`
                          : item.client === 'apollo' || item.client === 'graphql'
                          ? `${AppColors.pink500}30`
                          : item.client === 'xhr'
                          ? `${AppColors.amber500}30`
                          : `${AppColors.sky500}30`,
                    },
                  ]}>
                  <Text
                    style={[
                      styles.chipText,
                      {
                        color:
                          item.client === 'axios'
                            ? AppColors.purple
                            : item.client === 'apollo' || item.client === 'graphql'
                            ? AppColors.pink500
                            : item.client === 'xhr'
                            ? AppColors.amber700
                            : AppColors.sky600,
                      },
                    ]}>
                    {item.client.toUpperCase()}
                  </Text>
                </View>
              )}

              {/* GraphQL Indicator */}
              {(item.url.toLowerCase().includes('graphql') ||
                item.client === 'apollo' ||
                item.client === 'graphql') && (
                <View
                  style={[
                    styles.chip,
                    {
                      backgroundColor: AppColors.roseBg,
                      borderColor: AppColors.roseBorder,
                    },
                  ]}>
                  <Text
                    style={[
                      styles.chipText,
                      {color: AppColors.pink600},
                    ]}>
                    GQL
                  </Text>
                </View>
              )}
            </View>

            <View
              style={[
                styles.statusPill,
                {
                  backgroundColor: isFailed
                    ? `${AppColors.errorColor}14`
                    : isLoading
                    ? `${AppColors.darkOrange}14`
                    : `${statusColor}14`,
                  borderColor: isFailed
                    ? `${AppColors.errorColor}33`
                    : isLoading
                    ? `${AppColors.darkOrange}33`
                    : `${statusColor}33`,
                },
              ]}>
              {renderStatusIcon()}
              <Text
                style={[
                  styles.statusPillText,
                  {
                    color: isFailed
                      ? AppColors.errorColor
                      : isLoading
                      ? AppColors.darkOrange
                      : statusColor,
                  },
                ]}>
                {getStatusText()}
              </Text>
            </View>
          </View>

          {/* Row 2: Clean Smart URL Container (Path prominent, Host subtitle) */}
          <Pressable
            onPress={handleOpenUrl}
            hitSlop={6}
            style={styles.urlBox}>
            <View style={styles.urlMainRow}>
              <HighlightText
                text={urlParsed.path}
                search={searchStr}
                style={styles.pathText}
                highlightStyle={styles.highlight}
                numberOfLines={2}
                ellipsizeMode="middle"
              />
              <View style={styles.urlBadgeRow}>
                {isJson && (
                  <View style={styles.jsonBadge}>
                    <Text style={styles.jsonBadgeText}>.json</Text>
                  </View>
                )}
                {item.duplicateCount != null && item.duplicateCount > 1 && (
                  <View style={styles.dupBadge}>
                    <Text style={styles.dupBadgeText}>×{item.duplicateCount}</Text>
                  </View>
                )}
              </View>
            </View>

            {urlParsed.host ? (
              <View style={styles.hostRow}>
                <View
                  style={[
                    styles.protoBadge,
                    {
                      backgroundColor: urlParsed.isHttps
                        ? `${AppColors.emerald600}12`
                        : `${AppColors.amber600}12`,
                      borderColor: urlParsed.isHttps
                        ? `${AppColors.emerald600}2B`
                        : `${AppColors.amber600}2B`,
                    },
                  ]}>
                  <Text
                    style={[
                      styles.protoBadgeText,
                      {
                        color: urlParsed.isHttps
                          ? AppColors.emerald600
                          : AppColors.amber700,
                      },
                    ]}>
                    {urlParsed.isHttps ? 'HTTPS' : 'HTTP'}
                  </Text>
                </View>
                <Text
                  style={styles.hostText}
                  numberOfLines={1}
                  ellipsizeMode="tail">
                  {urlParsed.host}
                </Text>
              </View>
            ) : null}
          </Pressable>

          {/* Row 3: Footer (Timestamp & Origin on Left, Response Size & Duration on Right) */}
          <View style={styles.cardFooterRow}>
            <View style={styles.footerLeft}>
              <View style={styles.cardDateRow}>
                <CalendarIcon color={AppColors.grayTextWeak} size={10} />
                <Text style={styles.cardDateText}>{triggeredAt}</Text>
              </View>

              {item.caller && item.caller !== 'Unknown' && (
                <View style={styles.callerChip}>
                  <PinIcon color={AppColors.sky600} size={8.5} />
                  <Text
                    style={styles.callerChipText}
                    numberOfLines={1}
                    ellipsizeMode="middle">
                    {item.caller}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.footerRight}>
              {item.response != null && (
                <View style={styles.metaStatChip}>
                  <SizeIcon color={AppColors.purple} size={9} />
                  <Text style={styles.metaStatText}>
                    {getSize(item.response)}
                  </Text>
                </View>
              )}

              {item.duration != null && !isFailed && (
                <View
                  style={[
                    styles.metaStatChip,
                    {
                      backgroundColor: `${durationColor}12`,
                      borderColor: `${durationColor}2E`,
                    },
                  ]}>
                  <ClockIcon color={durationColor} size={9} />
                  <Text style={[styles.metaStatText, {color: durationColor}]}>
                    {item.duration}ms
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Mini Latency Timing Waterfall Bar */}
          {typeof item.duration === 'number' && item.duration > 0 && !isFailed && (
            <View style={styles.waterfallContainer}>
              <View
                style={[
                  styles.waterfallBar,
                  {
                    width: `${Math.min(100, Math.max(6, (item.duration / 1200) * 100))}%`,
                    backgroundColor: durationColor,
                  },
                ]}
              />
            </View>
          )}
        </View>

        {isNew && (
          <Animated.View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFill,
              {backgroundColor: methodColor, opacity: shimmerOpacity},
            ]}
          />
        )}
      </TouchableScale>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 10,
    paddingVertical: 3.5,
  },
  card: {
    alignSelf: 'stretch',
    borderRadius: 11,
    overflow: 'hidden',
    shadowColor: AppColors.black,
    shadowOffset: {width: 0, height: 1.5},
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1.5,
    borderWidth: 1,
    borderColor: AppColors.grayBorderSecondary,
    backgroundColor: AppColors.white,
  },
  cardBody: {
    paddingHorizontal: 12,
    paddingTop: 9,
    paddingBottom: 8,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
    minHeight: 22,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 6,
    gap: 5.5,
    minWidth: 0,
    flexWrap: 'wrap',
  },
  smallCheckbox: {
    width: 15,
    height: 15,
    borderRadius: 4,
    borderWidth: 1.6,
    borderColor: AppColors.grayTextWeak,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppColors.white,
  },
  smallCheckboxChecked: {
    backgroundColor: AppColors.purple,
    borderColor: AppColors.purple,
  },
  serialNumber: {
    fontFamily: AppFonts.interBold,
    color: AppColors.grayTextWeak,
    fontSize: 10,
  },
  methodBadge: {
    paddingHorizontal: 6.5,
    paddingVertical: 2,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodBadgeText: {
    fontFamily: AppFonts.interBold,
    fontSize: 9.5,
    letterSpacing: 0.5,
    color: AppColors.white,
  },
  chip: {
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
    borderWidth: 1,
  },
  chipText: {
    fontFamily: AppFonts.interBold,
    fontSize: 8.5,
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
    fontSize: 9.5,
  },
  urlBox: {
    backgroundColor: AppColors.grayBackground,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: AppColors.dividerColor,
    paddingHorizontal: 9,
    paddingVertical: 6,
    marginVertical: 4,
    gap: 4,
  },
  urlMainRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 6,
  },
  pathText: {
    fontFamily: AppFonts.interBold,
    fontSize: 12,
    lineHeight: 16.5,
    color: AppColors.primaryBlack,
    flex: 1,
  },
  urlBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 0,
  },
  jsonBadge: {
    backgroundColor: `${AppColors.darkOrange}14`,
    borderColor: `${AppColors.darkOrange}2E`,
    borderWidth: 1,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
  jsonBadgeText: {
    fontFamily: AppFonts.interBold,
    fontSize: 8.5,
    color: AppColors.darkOrange,
  },
  dupBadge: {
    backgroundColor: `${AppColors.purple}14`,
    borderColor: `${AppColors.purple}2E`,
    borderWidth: 1,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
  dupBadgeText: {
    fontFamily: AppFonts.interBold,
    fontSize: 8.5,
    color: AppColors.purple,
  },
  hostRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  protoBadge: {
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
    borderWidth: 1,
  },
  protoBadgeText: {
    fontFamily: AppFonts.interBold,
    fontSize: 7.5,
  },
  hostText: {
    fontFamily: AppFonts.interMedium,
    fontSize: 10.5,
    color: AppColors.grayText,
    flex: 1,
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
    marginTop: 4,
    gap: 6,
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    minWidth: 0,
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
    fontSize: 9.5,
    color: AppColors.grayTextWeak,
  },
  callerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: `${AppColors.sky600}10`,
    borderColor: `${AppColors.sky600}2B`,
    borderWidth: 1,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    flexShrink: 1,
    minWidth: 0,
  },
  callerChipText: {
    color: AppColors.sky600,
    fontSize: 8.5,
    fontFamily: AppFonts.interBold,
  },
  metaStatChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: `${AppColors.purple}10`,
    borderColor: `${AppColors.purple}28`,
    borderWidth: 1,
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  metaStatText: {
    fontFamily: AppFonts.interBold,
    color: AppColors.purple,
    fontSize: 9,
  },
  waterfallContainer: {
    height: 2.5,
    width: '100%',
    backgroundColor: AppColors.grayBorderSecondary,
    borderRadius: 1.5,
    overflow: 'hidden',
    marginTop: 6,
  },
  waterfallBar: {
    height: '100%',
    borderRadius: 1.5,
  },
});

export default LogCard;
