import React, {useState} from 'react';
import {useTranslation} from '../i18n';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {AppColors} from '../styles/AppColors';
import {AppFonts} from '../styles/AppFonts';
import {ConsoleLogCardProps} from '../types';
import {
  formatTime,
  getJsonContent,
  getJsonPreviewText,
  parseStackLine,
  openInVSCode,
} from '../helpers';
import HighlightText from './HighlightText';
import CopyButton from './CopyButton';
import LogSyntaxHighlighter from './LogSyntaxHighlighter';
import {
  ChevronIcon,
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
      const clean = tag.replace(/[\[\]]/g, '').trim().toUpperCase();
      if (clean === 'AXIOS') {
        return { color: AppColors.emerald600, Icon: ZapIcon, label: 'AXIOS' };
      }
      if (clean === 'API' || clean === 'FETCH' || clean === 'HTTP' || clean === 'NETWORK') {
        return { color: AppColors.sky600, Icon: GlobeIcon, label: clean };
      }
      if (clean === 'SAMPLE' || clean === 'BATCH') {
        return { color: AppColors.indigo600Alt, Icon: DiceIcon, label: clean };
      }
      if (clean === 'REDUX' || clean === 'STORE' || clean === 'STATE') {
        return { color: AppColors.violet600, Icon: AtomIcon, label: clean };
      }
      if (clean === 'ANALYTICS' || clean === 'FIREBASE' || clean === 'GA4' || clean === 'GA') {
        return { color: AppColors.teal600, Icon: BarChartIcon, label: clean };
      }
      if (clean === 'AUTH' || clean === 'TOKEN' || clean === 'SESSION') {
        return { color: AppColors.amber600, Icon: KeyIcon, label: clean };
      }
      if (clean === 'APP') {
        return { color: AppColors.indigo600Alt, Icon: SmartphoneIcon, label: 'APP' };
      }
      if (clean === 'TEST') {
        return { color: AppColors.emerald500, Icon: FlaskIcon, label: 'TEST' };
      }
      if (clean === 'WARN' || clean === 'WARNING') {
        return { color: AppColors.amber600, Icon: AlertTriangleIcon, label: 'WARN' };
      }
      if (clean === 'ERROR' || clean === 'CRASH' || clean === 'BUG') {
        return { color: AppColors.red600, Icon: BugIcon, label: 'ERROR' };
      }
      if (clean === 'PERF' || clean === 'RENDER') {
        return { color: AppColors.violet500, Icon: ZapIcon, label: clean };
      }
      return { color: AppColors.slate600, Icon: TagIcon, label: clean };
    };

    return (
      <View style={{flexDirection: 'column', gap: 6}}>
        <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 5}}>
          {tags.map((tag, i) => {
            const dec = getTagDecorator(tag);
            const IconComp = dec.Icon;
            return (
              <View
                key={i}
                style={[
                  styles.prefixTag,
                  {
                    backgroundColor: `${dec.color}14`,
                    borderColor: `${dec.color}33`,
                  },
                ]}>
                <IconComp color={dec.color} size={10} />
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
          numberOfLines={numberOfLines}
          detectLinks={true}
        />
      </View>
    );
  }

  return (
    <LogSyntaxHighlighter
      text={message}
      search={searchStr}
      style={textStyle}
      numberOfLines={numberOfLines}
      detectLinks={true}
    />
  );
};

export const ConsoleLogCard = React.memo(function ConsoleLogCard({
  item,
  searchStr = '',
}: ConsoleLogCardProps) {
  const {setSelectedLog} = useInspector();
  const {t} = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const jsonContent = getJsonContent(item.message);
  const isAnalyticsError = item.message
    .toLowerCase()
    .includes('[analytics error]');
  const isUserLog = item.sourceMethod === 'log';
  const parsedCaller = item.caller && item.caller !== 'Unknown'
    ? parseStackLine(item.caller, true)
    : null;

  const getLogColors = () => {
    const type = (item.type || 'log').toLowerCase();
    const method = ((item as any).sourceMethod || type).toLowerCase();

    if (isAnalyticsError || type === 'error' || method === 'error') {
      return {
        border: AppColors.errorColor,
        badgeBg: `${AppColors.errorColor}18`,
        badgeText: AppColors.errorColor,
        label: 'ERROR',
        cardBg: '#FFF8F8',
        methodBorder: `${AppColors.errorColor}30`,
        methodBg: `${AppColors.errorColor}12`,
        methodText: AppColors.errorColor,
        textColor: AppColors.redErrorText,
      };
    }
    if (type === 'warn' || method === 'warn') {
      return {
        border: AppColors.amber600,
        badgeBg: `${AppColors.amber600}18`,
        badgeText: AppColors.amber800,
        label: 'WARN',
        cardBg: '#FFFDF5',
        methodBorder: `${AppColors.amber600}33`,
        methodBg: `${AppColors.amber600}14`,
        methodText: AppColors.amber800,
        textColor: AppColors.amber800,
      };
    }
    if (type === 'debug' || method === 'debug') {
      return {
        border: AppColors.purple500,
        badgeBg: `${AppColors.purple500}18`,
        badgeText: AppColors.purple,
        label: 'DEBUG',
        cardBg: '#FAF8FD',
        methodBorder: `${AppColors.purple500}33`,
        methodBg: `${AppColors.purple500}12`,
        methodText: AppColors.purple,
        textColor: AppColors.purpleText,
      };
    }
    if (type === 'info' || method === 'info') {
      return {
        border: AppColors.sky500,
        badgeBg: `${AppColors.sky500}18`,
        badgeText: AppColors.sky600,
        label: 'INFO',
        cardBg: '#F8FAFC',
        methodBorder: `${AppColors.sky500}33`,
        methodBg: `${AppColors.sky500}12`,
        methodText: AppColors.sky600,
        textColor: AppColors.blue800,
      };
    }

    // Default / Standard console.log
    return {
      border: AppColors.indigo500,
      badgeBg: `${AppColors.indigo500}15`,
      badgeText: AppColors.indigo600Alt,
      label: 'LOG',
      cardBg: AppColors.white,
      methodBorder: AppColors.dividerColor,
      methodBg: AppColors.indigo50,
      methodText: AppColors.indigo600Alt,
      textColor: AppColors.primaryBlack,
    };
  };

  const colors = getLogColors();

  const jsonPreview = jsonContent
    ? getJsonPreviewText(jsonContent.data)
    : null;

  const openDetail = () => {
    setSelectedLog(item);
  };

  const toggleExpand = (e?: any) => {
    e?.stopPropagation?.();
    setIsExpanded(prev => !prev);
  };

  return (
    <View style={styles.container}>
      <Pressable
        onPress={openDetail}
        style={({pressed}) => [
          styles.card,
          {
            borderLeftColor: colors.border,
            borderLeftWidth: 3.5,
            backgroundColor: colors.cardBg,
          },
          pressed && styles.cardPressed,
        ]}>
        {/* Header Row */}
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <View style={[styles.typeChip, {backgroundColor: colors.badgeBg}]}>
              <View
                style={[styles.typeDot, {backgroundColor: colors.badgeText}]}
              />
              <Text style={[styles.typeChipText, {color: colors.badgeText, fontFamily: AppFonts.interBold}]}>
                {colors.label}
              </Text>
            </View>
            <View
              style={[
                styles.metaChip,
                {
                  backgroundColor: colors.methodBg,
                  borderColor: colors.methodBorder,
                },
              ]}>
              <Text
                style={[styles.metaChipText, {color: colors.methodText, fontFamily: AppFonts.interBold}]}>
                console.
                {('sourceMethod' in item ? item.sourceMethod : undefined) ||
                  item.type ||
                  'log'}
              </Text>
            </View>
            {jsonContent && (
              <View
                style={[
                  styles.metaChip,
                  {
                    backgroundColor: `${AppColors.teal600}14`,
                    borderColor: `${AppColors.teal600}33`,
                  },
                ]}>
                <Text
                  style={[styles.metaChipText, {color: AppColors.teal600, fontFamily: AppFonts.interBold}]}>
                  {Array.isArray(jsonContent.data)
                    ? `Array[${jsonContent.data.length}]`
                    : `Object{${Object.keys(jsonContent.data).length}}`}
                </Text>
              </View>
            )}
            {'duplicateCount' in item &&
              item.duplicateCount != null &&
              item.duplicateCount > 1 && (
                <View
                  style={[
                    styles.metaChip,
                    {
                      backgroundColor: `${AppColors.purple}1A`,
                      borderColor: `${AppColors.purple}3D`,
                    },
                  ]}>
                  <Text
                    style={[styles.metaChipText, {color: AppColors.purple, fontFamily: AppFonts.interBold}]}>
                    ×{item.duplicateCount}
                  </Text>
                </View>
              )}
          </View>

          <View style={styles.headerRight}>
            <CopyButton value={item.message} label={t('console.logMessage')} />
            <ChevronIcon color={AppColors.grayTextWeak} size={14} />
          </View>
        </View>

        {/* Body Content */}
        <View style={styles.cardBody}>
          {jsonContent ? (
            <>
              {jsonContent.header ? (
                getLogMessageWithBadges(
                  jsonContent.header,
                  searchStr,
                  [styles.messageText, {color: AppColors.primaryBlack}],
                  styles.highlight,
                  isExpanded ? undefined : 2,
                )
              ) : null}
              {jsonPreview && (
                <View style={styles.jsonPreviewContainer}>
                  <LogSyntaxHighlighter
                    text={jsonPreview.text}
                    search={searchStr}
                    style={[
                      styles.jsonPreviewText,
                      {color: AppColors.primaryBlack},
                    ]}
                    detectLinks={false}
                    numberOfLines={isExpanded ? undefined : 4}
                  />
                  {jsonPreview.text.split('\n').length > 4 && (
                    <Pressable
                      onPress={toggleExpand}
                      hitSlop={6}
                      style={styles.expandToggle}>
                      <Text style={styles.expandToggleText}>
                        {isExpanded ? 'Show less' : 'Show full preview'}
                      </Text>
                      <ChevronIcon
                        color={AppColors.purple}
                        size={11}
                        direction={isExpanded ? 'up' : 'down'}
                      />
                    </Pressable>
                  )}
                </View>
              )}
            </>
          ) : (
            getLogMessageWithBadges(
              item.message,
              searchStr,
              [styles.messageText, {color: AppColors.primaryBlack}],
              styles.highlight,
              isExpanded ? undefined : 4,
            )
          )}
        </View>

        {/* Footer Row */}
        <View style={styles.cardFooter}>
          <View style={styles.footerLeft}>
            <Text style={styles.footerId}>#{item.id + 1}</Text>
            <View style={styles.footerDot} />
            <Text style={styles.footerTime}>{formatTime(item.timestamp)}</Text>
            {parsedCaller && (
              <>
                <View style={styles.footerDot} />
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
                  style={styles.callerPill}>
                  {parsedCaller.fileExt && parsedCaller.fileExt !== 'other' && (
                    <View
                      style={[
                        styles.extBadge,
                        {
                          backgroundColor:
                            parsedCaller.fileExt === 'tsx' || parsedCaller.fileExt === 'ts'
                              ? `${AppColors.brandPurple}22`
                              : `${AppColors.teal600}22`,
                        },
                      ]}>
                      <Text
                        style={[
                          styles.extBadgeText,
                          {
                            color:
                              parsedCaller.fileExt === 'tsx' || parsedCaller.fileExt === 'ts'
                                ? AppColors.brandPurple
                                : AppColors.teal600,
                          },
                        ]}>
                        {parsedCaller.fileExt.toUpperCase()}
                      </Text>
                    </View>
                  )}
                  <Text
                    style={styles.callerFileName}
                    numberOfLines={1}
                    ellipsizeMode="middle">
                    {parsedCaller.fileName}
                    {parsedCaller.lineNumber ? `:${parsedCaller.lineNumber}` : ''}
                  </Text>
                  <ExternalLinkIcon color={AppColors.sky600} size={8.5} />
                </Pressable>
              </>
            )}
          </View>

          <View style={styles.footerRight}>
            {isAnalyticsError && (
              <View
                style={[
                  styles.footerBadge,
                  {
                    backgroundColor: `${AppColors.skyBlue}15`,
                    borderColor: `${AppColors.skyBlue}30`,
                  },
                ]}>
                <Text style={[styles.footerBadgeText, {color: AppColors.skyBlue}]}>
                  {t('console.analyticsBadge')}
                </Text>
              </View>
            )}
            {isUserLog && (
              <View
                style={[
                  styles.footerBadge,
                  {
                    backgroundColor: `${AppColors.slate600}12`,
                    borderColor: `${AppColors.slate600}26`,
                  },
                ]}>
                <Text style={[styles.footerBadgeText, {color: AppColors.grayTextStrong}]}>
                  {t('console.userLogBadge')}
                </Text>
              </View>
            )}
          </View>
        </View>
      </Pressable>
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
    borderWidth: 1,
    borderColor: AppColors.grayBorderSecondary,
    borderLeftWidth: 3.5,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 9,
    backgroundColor: AppColors.white,
    shadowColor: AppColors.black,
    shadowOpacity: 0.04,
    shadowRadius: 3,
    shadowOffset: {width: 0, height: 1.5},
    elevation: 1.5,
  },
  cardPressed: {
    opacity: 0.88,
    transform: [{scale: 0.995}],
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  typeDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  typeChipText: {
    fontFamily: AppFonts.interBold,
    fontSize: 9.5,
    letterSpacing: 0.5,
  },
  metaChip: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  metaChipText: {
    fontFamily: AppFonts.interBold,
    fontSize: 9.5,
    letterSpacing: 0.2,
  },
  cardBody: {
    paddingVertical: 2,
  },
  messageText: {
    fontFamily: AppFonts.interMedium,
    fontSize: 12.5,
    color: AppColors.primaryBlack,
    lineHeight: 18,
  },
  highlight: {
    backgroundColor: AppColors.yellowHighlight,
    color: AppColors.primaryBlack,
    borderRadius: 2,
  },
  jsonPreviewContainer: {
    marginTop: 6,
    backgroundColor: AppColors.grayBackground,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: AppColors.grayBorderSecondary,
    paddingHorizontal: 9,
    paddingVertical: 7,
  },
  jsonPreviewText: {
    fontFamily: AppFonts.interRegular,
    fontSize: 11,
    color: AppColors.primaryBlack,
    lineHeight: 16,
  },
  expandToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 5,
    paddingVertical: 2,
    borderTopWidth: 1,
    borderTopColor: AppColors.dividerColor,
  },
  expandToggleText: {
    fontFamily: AppFonts.interBold,
    fontSize: 10,
    color: AppColors.purple,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 7,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: `${AppColors.dividerColor}88`,
    gap: 6,
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flex: 1,
    flexWrap: 'wrap',
  },
  footerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  footerDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: AppColors.grayTextWeak,
    opacity: 0.6,
  },
  footerId: {
    fontFamily: AppFonts.interBold,
    fontSize: 10,
    color: AppColors.grayTextWeak,
  },
  footerTime: {
    fontFamily: AppFonts.interMedium,
    fontSize: 10,
    color: AppColors.grayTextWeak,
    letterSpacing: 0.1,
  },
  callerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    maxWidth: 185,
    backgroundColor: `${AppColors.sky600}10`,
    borderColor: `${AppColors.sky600}2B`,
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 5,
    paddingVertical: 1.5,
  },
  extBadge: {
    borderRadius: 3,
    paddingHorizontal: 3.5,
    paddingVertical: 0.5,
  },
  extBadgeText: {
    fontFamily: AppFonts.interBold,
    fontSize: 8,
  },
  callerFileName: {
    fontFamily: AppFonts.interBold,
    color: AppColors.sky600,
    fontSize: 9.5,
  },
  footerBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 5,
    borderWidth: 1,
  },
  footerBadgeText: {
    fontFamily: AppFonts.interBold,
    fontSize: 9,
  },
  prefixTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3.5,
    paddingHorizontal: 6.5,
    paddingVertical: 2,
    borderRadius: 5,
    borderWidth: 1,
  },
  prefixTagText: {
    fontFamily: AppFonts.interBold,
    fontSize: 9.5,
    letterSpacing: 0.3,
  },
});
