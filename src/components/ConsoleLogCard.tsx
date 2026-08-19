import React from 'react';
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
import {ChevronIcon, ExternalLinkIcon} from './NetworkIcons';
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
        return { color: '#059669', icon: '⚡', label: 'AXIOS' };
      }
      if (clean === 'API' || clean === 'FETCH' || clean === 'HTTP' || clean === 'NETWORK') {
        return { color: '#0284C7', icon: '🌐', label: clean };
      }
      if (clean === 'SAMPLE' || clean === 'BATCH') {
        return { color: '#4F46E5', icon: '🎲', label: clean };
      }
      if (clean === 'REDUX' || clean === 'STORE' || clean === 'STATE') {
        return { color: '#7C3AED', icon: '⚛️', label: clean };
      }
      if (clean === 'ANALYTICS' || clean === 'FIREBASE' || clean === 'GA4' || clean === 'GA') {
        return { color: '#0D9488', icon: '📊', label: clean };
      }
      if (clean === 'AUTH' || clean === 'TOKEN' || clean === 'SESSION') {
        return { color: '#D97706', icon: '🔑', label: clean };
      }
      if (clean === 'APP') {
        return { color: '#4F46E5', icon: '📱', label: 'APP' };
      }
      if (clean === 'TEST') {
        return { color: '#10B981', icon: '🧪', label: 'TEST' };
      }
      if (clean === 'WARN' || clean === 'WARNING') {
        return { color: '#D97706', icon: '⚠️', label: 'WARN' };
      }
      if (clean === 'ERROR' || clean === 'CRASH' || clean === 'BUG') {
        return { color: '#DC2626', icon: '💥', label: 'ERROR' };
      }
      if (clean === 'PERF' || clean === 'RENDER') {
        return { color: '#8B5CF6', icon: '⚡', label: clean };
      }
      return { color: AppColors.slate600, icon: '🏷️', label: clean };
    };

    return (
      <View style={{flexDirection: 'column', gap: 6}}>
        <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 5}}>
          {tags.map((tag, i) => {
            const dec = getTagDecorator(tag);
            return (
              <View
                key={i}
                style={[
                  styles.prefixTag,
                  {
                    backgroundColor: `${dec.color}15`,
                    borderColor: `${dec.color}35`,
                  },
                ]}>
                <Text style={{fontSize: 9.5}}>{dec.icon}</Text>
                <Text style={[styles.prefixTagText, {color: dec.color}]}>
                  {dec.label}
                </Text>
              </View>
            );
          })}
        </View>
        <HighlightText
          text={remainingText}
          search={searchStr}
          style={textStyle}
          highlightStyle={highlightStyle}
          numberOfLines={numberOfLines}
          detectLinks={true}
        />
      </View>
    );
  }

  return (
    <HighlightText
      text={message}
      search={searchStr}
      style={textStyle}
      highlightStyle={highlightStyle}
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
  const jsonContent = getJsonContent(item.message);
  const isAnalyticsError = item.message
    .toLowerCase()
    .includes('[analytics error]');
  const isUserLog = item.sourceMethod === 'log';
  const parsedCaller = item.caller && item.caller !== 'Unknown'
    ? parseStackLine(item.caller, true)
    : null;

  const getLogColors = () => {
    const isDark = AppColors.primaryLight !== AppColors.white;
    if (isAnalyticsError) {
      return {
        border: AppColors.skyBlue,
        badgeBg: `${AppColors.skyBlue}15`,
        badgeText: AppColors.skyBlue,
        label: 'ERROR',
        cardBg: isDark ? `${AppColors.skyBlue}26` : AppColors.blueTintBg,
      };
    }
    switch (item.type) {
      case 'error':
        return {
          border: AppColors.errorColor,
          badgeBg: `${AppColors.errorColor}15`,
          badgeText: AppColors.errorColor,
          label: 'ERROR',
          cardBg: isDark ? `${AppColors.errorColor}26` : AppColors.errorCardBg,
        };
      case 'warn':
        return {
          border: AppColors.lightOrange,
          badgeBg: `${AppColors.lightOrange}15`,
          badgeText: AppColors.darkOrange || AppColors.lightOrange,
          label: 'WARN',
          cardBg: isDark ? `${AppColors.amber500}26` : AppColors.warnCardBg,
        };
      default:
        if (isUserLog) {
          return {
            border: AppColors.slate600,
            badgeBg: isDark ? AppColors.gray700 : AppColors.slate200,
            badgeText: isDark ? AppColors.gray300 : AppColors.slate700,
            label: 'INFO',
            cardBg: isDark ? AppColors.primaryLight : AppColors.slate100,
          };
        }
        return {
          border: AppColors.purple,
          badgeBg: `${AppColors.purple}15`,
          badgeText: AppColors.purple,
          label: 'INFO',
          cardBg: isDark ? `${AppColors.purple}1F` : AppColors.purpleShade50,
        };
    }
  };

  const colors = getLogColors();

  const jsonPreview = jsonContent
    ? getJsonPreviewText(jsonContent.data)
    : null;

  const openDetail = () => {
    setSelectedLog(item);
  };

  return (
    <View style={styles.container}>
      <Pressable
        onPress={openDetail}
        style={({pressed}) => [
          styles.card,
          {
            borderLeftColor: colors.border,
            backgroundColor: colors.cardBg,
          },
          pressed && styles.cardPressed,
        ]}>
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <View style={[styles.typeChip, {backgroundColor: colors.badgeBg}]}>
              <View
                style={[styles.typeDot, {backgroundColor: colors.badgeText}]}
              />
              <Text style={[styles.typeChipText, {color: colors.badgeText}]}>
                {colors.label}
              </Text>
            </View>
            <View
              style={[
                styles.metaChip,
                {
                  backgroundColor: `${AppColors.brandPurple}12`,
                  borderColor: `${AppColors.brandPurple}30`,
                },
              ]}>
              <Text
                style={[styles.metaChipText, {color: AppColors.brandPurple}]}>
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
                    backgroundColor: `${AppColors.teal600}12`,
                    borderColor: `${AppColors.teal600}2B`,
                  },
                ]}>
                <Text
                  style={[styles.metaChipText, {color: AppColors.teal600}]}>
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
                    style={[styles.metaChipText, {color: AppColors.purple}]}>
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

        <View style={styles.cardBody}>
          {jsonContent ? (
            <>
              {jsonContent.header ? (
                getLogMessageWithBadges(
                  jsonContent.header,
                  searchStr,
                  [styles.messageText, {color: AppColors.primaryBlack}],
                  styles.highlight,
                  2,
                )
              ) : null}
              {jsonPreview && (
                <View style={styles.jsonPreviewContainer}>
                  <HighlightText
                    text={jsonPreview.text}
                    search={searchStr}
                    style={[
                      styles.jsonPreviewText,
                      {color: AppColors.primaryBlack},
                    ]}
                    highlightStyle={styles.highlight}
                    detectLinks={false}
                    numberOfLines={5}
                  />
                </View>
              )}
            </>
          ) : (
            getLogMessageWithBadges(
              item.message,
              searchStr,
              [styles.messageText, {color: AppColors.primaryBlack}],
              styles.highlight,
              3,
            )
          )}
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.footerLeft}>
            <Text style={styles.footerText}>#{item.id + 1}</Text>
            <View style={styles.footerDot} />
            <Text style={styles.footerText}>{formatTime(item.timestamp)}</Text>
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
                  style={{
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
                  }}>
                  {parsedCaller.fileExt && parsedCaller.fileExt !== 'other' && (
                    <View
                      style={{
                        backgroundColor:
                          parsedCaller.fileExt === 'tsx' || parsedCaller.fileExt === 'ts'
                            ? `${AppColors.brandPurple}22`
                            : `${AppColors.teal600}22`,
                        borderRadius: 3,
                        paddingHorizontal: 3.5,
                        paddingVertical: 0.5,
                      }}>
                      <Text
                        style={{
                          fontFamily: AppFonts.interBold,
                          fontSize: 8,
                          color:
                            parsedCaller.fileExt === 'tsx' || parsedCaller.fileExt === 'ts'
                              ? AppColors.brandPurple
                              : AppColors.teal600,
                        }}>
                        {parsedCaller.fileExt.toUpperCase()}
                      </Text>
                    </View>
                  )}
                  <Text
                    style={[
                      styles.footerText,
                      {
                        fontFamily: AppFonts.interBold,
                        color: AppColors.sky600,
                        fontSize: 9.5,
                      },
                    ]}
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
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  card: {
    alignSelf: 'stretch',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AppColors.grayBorderSecondary,
    borderLeftWidth: 3.5,
    padding: 12,
    backgroundColor: AppColors.primaryLight,
    shadowColor: AppColors.black,
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: {width: 0, height: 2},
    elevation: 2,
  },
  cardPressed: {
    opacity: 0.85,
    transform: [{scale: 0.99}],
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
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
    gap: 4,
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
    paddingVertical: 2.5,
    borderRadius: 6,
    borderWidth: 1,
  },
  metaChipText: {
    fontFamily: AppFonts.interBold,
    fontSize: 9.5,
    letterSpacing: 0.2,
  },
  cardBody: {
    backgroundColor: AppColors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: AppColors.grayBorderSecondary,
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
    borderRadius: 7,
    borderWidth: 1,
    borderColor: AppColors.grayBorderSecondary,
    padding: 8,
  },
  jsonPreviewText: {
    fontFamily: AppFonts.interRegular,
    fontSize: 11,
    color: AppColors.primaryBlack,
    lineHeight: 16,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
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
  footerText: {
    fontFamily: AppFonts.interRegular,
    fontSize: 10,
    color: AppColors.grayTextWeak,
    letterSpacing: 0.1,
  },
  footerCaller: {
    flexShrink: 1,
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
