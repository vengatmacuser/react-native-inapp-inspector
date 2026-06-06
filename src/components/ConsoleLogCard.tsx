import React, {useState} from 'react';
import {StyleSheet, Text, View, Pressable, Platform} from 'react-native';
import {AppColors} from '../styles/AppColors';
import {AppFonts} from '../styles/AppFonts';
import {ConsoleLog} from '../types';
import HighlightText from './HighlightText';
import CopyButton from './CopyButton';
import {ChevronIcon} from './NetworkIcons';
import JsonViewer from './JsonViewer';
import {WebViewLog} from '../customHooks/webViewLogger';

interface ConsoleLogCardProps {
  item: ConsoleLog | WebViewLog;
  searchStr?: string;
  isWebView?: boolean;
}

const formatTime = (ts: number): string => {
  const d = new Date(ts);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  const ms = String(d.getMilliseconds()).padStart(3, '0');
  return `${hh}:${mm}:${ss}.${ms}`;
};

interface JsonContent {
  header: string;
  data: any;
}

const getJsonContent = (message: string): JsonContent | null => {
  if (!message) return null;

  const indices: number[] = [];
  for (let i = 0; i < message.length; i++) {
    if (message[i] === '{' || message[i] === '[') {
      indices.push(i);
    }
  }

  for (const index of indices) {
    const candidate = message.substring(index).trim();
    try {
      const parsed = JSON.parse(candidate);
      if (parsed !== null && typeof parsed === 'object') {
        const header = message.substring(0, index).trim();
        return {header, data: parsed};
      }
    } catch (e) {
      // Ignore
    }
  }

  return null;
};

const getJsonPreviewText = (data: any): {text: string; hasMore: boolean} => {
  try {
    const formatted = JSON.stringify(data, null, 2);
    const lines = formatted.split('\n');
    if (lines.length > 3) {
      return {
        text: lines.slice(0, 3).join('\n') + '\n...',
        hasMore: true,
      };
    }
    return {
      text: formatted,
      hasMore: false,
    };
  } catch (e) {
    return {
      text: String(data),
      hasMore: false,
    };
  }
};

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
    
    const getTagColor = (tag: string) => {
      const cleanTag = tag.replace(/[\[\]]/g, '').trim().toUpperCase();
      if (cleanTag === 'API') return '#0284C7';
      if (cleanTag === 'TEST') return '#16A34A';
      if (cleanTag === 'APP') return '#4F46E5';
      if (cleanTag === 'DETAILS') return '#7C3AED';
      if (cleanTag === 'WEBVIEW') return '#EA580C';
      if (cleanTag === 'MOCK REDUX' || cleanTag === 'REDUX') return '#DB2777';
      
      let hash = 0;
      for (let i = 0; i < cleanTag.length; i++) {
        hash = cleanTag.charCodeAt(i) + ((hash << 5) - hash);
      }
      const colors = ['#0891B2', '#0D9488', '#2563EB', '#D97706', '#E11D48', '#8B5CF6'];
      return colors[Math.abs(hash) % colors.length];
    };

    return (
      <Text style={textStyle} numberOfLines={numberOfLines}>
        {tags.map((tag, idx) => {
          const color = getTagColor(tag);
          return (
            <Text
              key={idx}
              style={{
                fontWeight: 'bold',
                color: color,
                fontFamily: AppFonts.interBold,
              }}>
              {tag}{' '}
            </Text>
          );
        })}
        <HighlightText
          text={remainingText}
          search={searchStr}
          style={textStyle}
          highlightStyle={highlightStyle}
          detectLinks={true}
        />
      </Text>
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
  isWebView = false,
}: ConsoleLogCardProps) {
  const [expanded, setExpanded] = useState(false);
  const jsonContent = getJsonContent(item.message);
  const isAnalyticsError = item.message
    .toLowerCase()
    .includes('[analytics error]');
  const isUserLog = !isWebView && (item as ConsoleLog).sourceMethod === 'log';
  const caller = 'caller' in item ? item.caller : undefined;

  const getLogColors = () => {
    if (isWebView) {
      const label = item.type.toUpperCase();
      switch (item.type) {
        case 'error':
          return {
            border: AppColors.errorColor,
            badgeBg: `${AppColors.errorColor}15`,
            badgeText: AppColors.errorColor,
            label,
            cardBg: '#FFF5F6',
          };
        case 'warn':
          return {
            border: AppColors.lightOrange,
            badgeBg: `${AppColors.lightOrange}15`,
            badgeText: AppColors.darkOrange || AppColors.lightOrange,
            label,
            cardBg: '#FFFDF6',
          };
        default:
          return {
            border: '#475569',
            badgeBg: '#F1F5F9',
            badgeText: '#475569',
            label,
            cardBg: '#F8FAFC',
          };
      }
    }
    if (isAnalyticsError) {
      return {
        border: AppColors.skyBlue,
        badgeBg: `${AppColors.skyBlue}15`,
        badgeText: AppColors.skyBlue,
        label: 'ERROR',
        cardBg: '#E6F2FF', // light sky blue background for analytics errors
      };
    }
    switch (item.type) {
      case 'error':
        return {
          border: AppColors.errorColor,
          badgeBg: `${AppColors.errorColor}15`,
          badgeText: AppColors.errorColor,
          label: 'ERROR',
          cardBg: '#FFF5F6', // light red background
        };
      case 'warn':
        return {
          border: AppColors.lightOrange,
          badgeBg: `${AppColors.lightOrange}15`,
          badgeText: AppColors.darkOrange || AppColors.lightOrange,
          label: 'WARN',
          cardBg: '#FFFDF6', // light yellow/orange background
        };
      default:
        if (isUserLog) {
          return {
            border: '#475569',
            badgeBg: '#E2E8F0',
            badgeText: '#334155',
            label: 'INFO',
            cardBg: '#F1F5F9', // slate-blue / steel-blue background for user log
          };
        }
        return {
          border: AppColors.purple,
          badgeBg: `${AppColors.purple}15`,
          badgeText: AppColors.purple,
          label: 'INFO',
          cardBg: '#F9F5FF', // light purple background for general info
        };
    }
  };

  const colors = getLogColors();

  // Show limited lines unless expanded
  const numLines = expanded ? undefined : 5;
  const hasLongMessage = jsonContent
    ? getJsonPreviewText(jsonContent.data).hasMore ||
      jsonContent.header.length > 120 ||
      jsonContent.header.includes('\n')
    : item.message.length > 120 || item.message.includes('\n');

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.card,
          {
            borderLeftWidth: 4,
            borderLeftColor: colors.border,
            backgroundColor: colors.cardBg,
          },
        ]}>
        <Pressable
          onPress={() => setExpanded(prev => !prev)}
          style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <CopyButton value={item.message} label="Log message" />
            <View style={[styles.badge, {backgroundColor: colors.badgeBg}]}>
              <Text style={[styles.badgeText, {color: colors.badgeText}]}>
                {colors.label}
              </Text>
            </View>
            {isAnalyticsError && (
              <View
                style={[
                  styles.badge,
                  {backgroundColor: `${AppColors.skyBlue}15`},
                ]}>
                <Text style={[styles.badgeText, {color: AppColors.skyBlue}]}>
                  Analytics
                </Text>
              </View>
            )}
            {isUserLog && (
              <View
                style={[
                  styles.badge,
                  {
                    backgroundColor: '#F3F4F6',
                    borderColor: '#D1D5DB',
                    borderWidth: 1,
                  },
                ]}>
                <Text style={[styles.badgeText, {color: '#4B5563'}]}>
                  user-log
                </Text>
              </View>
            )}
            {isWebView && (
              <View
                style={[
                  styles.badge,
                  {
                    backgroundColor: '#F1F5F9',
                    borderColor: '#E2E8F0',
                    borderWidth: 1,
                  },
                ]}>
                <Text style={[styles.badgeText, {color: '#475569'}]}>
                  webview
                </Text>
              </View>
            )}
            <Text style={styles.serialNumber}>#{item.id + 1}</Text>
            <Text style={styles.timestamp}>{formatTime(item.timestamp)}</Text>
          </View>
          <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
            {caller && caller !== 'Unknown' && (
              <Text
                style={styles.callerText}
                numberOfLines={1}
                ellipsizeMode="middle">
                {caller.split('/').pop() || caller}
              </Text>
            )}
            <View style={{transform: [{rotate: expanded ? '180deg' : '0deg'}]}}>
              <ChevronIcon size={14} color={AppColors.grayTextWeak} />
            </View>
          </View>
        </Pressable>

        <View style={styles.cardBody}>
          {jsonContent ? (
            <>
              {jsonContent.header ? (
                <Pressable onPress={() => setExpanded(prev => !prev)}>
                  {getLogMessageWithBadges(
                    jsonContent.header,
                    searchStr,
                    styles.messageText,
                    styles.highlight,
                    numLines,
                  )}
                </Pressable>
              ) : null}
              {expanded ? (
                <View style={styles.jsonContainer}>
                  <JsonViewer
                    data={jsonContent.data}
                    search={searchStr}
                    forceOpen={expanded}
                  />
                </View>
              ) : (
                <Pressable
                  onPress={() => setExpanded(prev => !prev)}
                  style={styles.jsonPreviewContainer}>
                  <HighlightText
                    text={getJsonPreviewText(jsonContent.data).text}
                    search={searchStr}
                    style={styles.jsonPreviewText}
                    highlightStyle={styles.highlight}
                    detectLinks={true}
                  />
                </Pressable>
              )}
            </>
          ) : (
            <Pressable onPress={() => setExpanded(prev => !prev)}>
              {getLogMessageWithBadges(
                item.message,
                searchStr,
                styles.messageText,
                styles.highlight,
                numLines,
              )}
            </Pressable>
          )}
          {hasLongMessage && (
            <Pressable
              onPress={() => setExpanded(prev => !prev)}
              style={styles.seeMoreBtn}
              hitSlop={8}>
              <Text style={styles.seeMoreText}>
                {expanded ? 'See Less' : 'See More'}
              </Text>
            </Pressable>
          )}
        </View>

        {caller && caller !== 'Unknown' && expanded && (
          <View style={styles.cardFooter}>
            <Text style={styles.fullCallerText}>Caller: {caller}</Text>
          </View>
        )}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingVertical: 3,
  },
  card: {
    alignSelf: 'stretch',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    padding: 8,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 3,
    shadowOffset: {width: 0, height: 1},
    elevation: 1,
    overflow: 'hidden',
  },
  cardHeader: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  badgeText: {
    fontFamily: AppFonts.interBold,
    fontSize: 9,
    letterSpacing: 0.5,
  },
  timestamp: {
    fontFamily: AppFonts.interMedium,
    fontSize: 11,
    color: AppColors.grayTextWeak,
  },
  serialNumber: {
    fontFamily: AppFonts.interBold,
    color: AppColors.grayTextWeak,
    fontSize: 11,
  },
  callerText: {
    fontFamily: AppFonts.interRegular,
    fontSize: 10,
    color: AppColors.grayTextWeak,
    maxWidth: '50%',
  },
  cardBody: {
    marginTop: 6,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#EBECEF',
  },
  messageText: {
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontSize: 12,
    color: AppColors.primaryBlack,
    lineHeight: 16,
  },
  highlight: {
    backgroundColor: '#FFE44D',
    color: AppColors.primaryBlack,
    borderRadius: 2,
  },
  jsonContainer: {
    marginTop: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 6,
  },
  jsonPreviewContainer: {
    marginTop: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 6,
  },
  jsonPreviewText: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 11,
    color: AppColors.primaryBlack,
    lineHeight: 15,
  },
  cardFooter: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: AppColors.dividerColor,
  },
  fullCallerText: {
    fontFamily: AppFonts.interRegular,
    fontSize: 10,
    color: AppColors.grayText,
  },
  seeMoreBtn: {
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  seeMoreText: {
    fontFamily: AppFonts.interBold,
    fontSize: 11,
    color: AppColors.purple,
    textDecorationLine: 'underline',
  },
});
