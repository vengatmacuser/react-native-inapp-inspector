import React, {useMemo, useState} from 'react';
import {useTranslation} from '../../i18n';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {useInspector} from './InspectorContext';
import HighlightText from '../HighlightText';
import JsonViewer from '../JsonViewer';
import CopyButton from '../CopyButton';
import SegmentedTabs from '../SegmentedTabs';
import {
  ClearIcon,
  SearchIcon,
  PrettyIcon,
  RawIcon,
  TableIcon,
  HeadersIcon,
  LayersIcon,
  TerminalIcon,
  RequestIcon,
  InfoCircleIcon,
  DocIcon,
  ExternalLinkIcon,
} from '../NetworkIcons';
import {AppColors} from '../../styles/AppColors';
import {AppFonts} from '../../styles/AppFonts';
import styles from '../../styles';
import {
  getJsonContent,
  getSize,
  formatDateTime,
  parseStackLine,
  ParsedStackFrame,
  openInVSCode,
} from '../../helpers';

type DetailSubTab = 'output' | 'arguments' | 'stack' | 'metadata';

const getRelativeTime = (timestamp: number): string => {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return `${seconds}s ago`;
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
};

const LogDetail = React.memo(() => {
  const {t} = useTranslation();
  const {selectedLog} = useInspector();
  const [activeTab, setActiveTab] = useState<DetailSubTab>('output');
  const [detailSearch, setDetailSearch] = useState('');
  const [viewMode, setViewMode] = useState<'pretty' | 'raw' | 'table'>('pretty');

  const jsonContent = useMemo(
    () => (selectedLog ? getJsonContent(selectedLog.message) : null),
    [selectedLog],
  );

  const [stackViewMode, setStackViewMode] = useState<'structured' | 'raw'>('structured');
  const [stackSource, setStackSource] = useState<'caller' | 'error'>('caller');
  const [stackFilter, setStackFilter] = useState<'app' | 'all'>('app');

  const activeStackString = useMemo(() => {
    if (!selectedLog) return '';
    if (stackSource === 'error' && selectedLog.errorStack) {
      return selectedLog.errorStack;
    }
    return selectedLog.stack || selectedLog.caller || '';
  }, [selectedLog, stackSource]);

  const parsedStackFrames: ParsedStackFrame[] = useMemo(() => {
    if (!activeStackString) return [];
    return activeStackString
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 0)
      .map((line, idx) => parseStackLine(line, idx === 0));
  }, [activeStackString]);

  const appStackFrames = useMemo(() => {
    return parsedStackFrames.filter(f => f.frameType === 'app' || !f.isRuntimeNoise);
  }, [parsedStackFrames]);

  const displayedFrames = useMemo(() => {
    if (stackFilter === 'app' && appStackFrames.length > 0) {
      return appStackFrames;
    }
    return parsedStackFrames;
  }, [stackFilter, appStackFrames, parsedStackFrames]);

  const originFrame: ParsedStackFrame | null = useMemo(() => {
    if (!selectedLog) return null;
    if (appStackFrames.length > 0) {
      return appStackFrames[0];
    }
    if (selectedLog.caller && selectedLog.caller !== 'Unknown') {
      return parseStackLine(selectedLog.caller, true);
    }
    if (parsedStackFrames.length > 0) {
      return parsedStackFrames[0];
    }
    return null;
  }, [selectedLog, appStackFrames, parsedStackFrames]);

  if (!selectedLog) return null;

  const isDark = AppColors.primaryLight !== AppColors.white;
  const getTypeColors = () => {
    const type = (selectedLog.type || 'log').toLowerCase();
    const method = ((selectedLog as any).sourceMethod || type).toLowerCase();

    if (type === 'error' || method === 'error') {
      return {
        border: AppColors.red500,
        badgeBg: AppColors.red100,
        badgeText: AppColors.redErrorText,
        label: 'ERROR',
        methodBorder: AppColors.errorBorder,
        methodBg: AppColors.red100,
        methodText: AppColors.redErrorText,
      };
    }
    if (type === 'warn' || method === 'warn') {
      return {
        border: AppColors.amber500,
        badgeBg: AppColors.amber100,
        badgeText: AppColors.amber800Warm,
        label: 'WARN',
        methodBorder: AppColors.amber200,
        methodBg: AppColors.amber100,
        methodText: AppColors.amber800Warm,
      };
    }
    if (type === 'debug' || method === 'debug') {
      return {
        border: AppColors.violet500,
        badgeBg: AppColors.purple100,
        badgeText: AppColors.violet600,
        label: 'DEBUG',
        methodBorder: AppColors.purple200,
        methodBg: AppColors.purple100,
        methodText: AppColors.violet600,
      };
    }
    if (type === 'info' || method === 'info') {
      return {
        border: AppColors.sky500,
        badgeBg: AppColors.sky100,
        badgeText: AppColors.sky600,
        label: 'INFO',
        methodBorder: AppColors.sky400,
        methodBg: AppColors.sky100,
        methodText: AppColors.sky600,
      };
    }
    return {
      border: AppColors.indigo500,
      badgeBg: AppColors.indigo50,
      badgeText: AppColors.indigo600Alt,
      label: 'LOG',
      methodBorder: AppColors.indigo400,
      methodBg: AppColors.indigo50,
      methodText: AppColors.indigo600Alt,
    };
  };

  const typeColors = getTypeColors();
  const hasMultipleArgs =
    selectedLog.rawArgs != null && selectedLog.rawArgs.length > 1;
  const hasStack = Boolean(
    selectedLog.stack && selectedLog.stack.trim().length > 0,
  );

  const subTabs = [
    {
      key: 'output',
      label: t('console.tabOutput'),
      icon: (isActive: boolean) => (
        <TerminalIcon
          color={isActive ? AppColors.white : AppColors.grayTextWeak}
          size={12}
        />
      ),
    },
    ...(hasMultipleArgs
      ? [
          {
            key: 'arguments',
            label: t('console.tabArgs', {count: selectedLog.rawArgs?.length}),
            icon: (isActive: boolean) => (
              <RequestIcon
                color={isActive ? AppColors.white : AppColors.grayTextWeak}
                size={12}
              />
            ),
          },
        ]
      : []),
    ...(hasStack
      ? [
          {
            key: 'stack',
            label: t('console.tabStack'),
            icon: (isActive: boolean) => (
              <LayersIcon
                color={isActive ? AppColors.white : AppColors.grayTextWeak}
                size={12}
              />
            ),
          },
        ]
      : []),
    {
      key: 'metadata',
      label: t('console.tabMetadata'),
      icon: (isActive: boolean) => (
        <InfoCircleIcon
          color={isActive ? AppColors.white : AppColors.grayTextWeak}
          size={12}
        />
      ),
    },
  ];

  return (
    <View style={{flex: 1}}>
      {/* Enhanced details header bar */}
      <View style={styles.detailInfoBar}>
        <View style={{flexDirection: 'column', gap: 10}}>
          {/* Top Row: Type badge, method, content pill & Copy button */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 8,
            }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                flex: 1,
                flexWrap: 'wrap',
              }}>
              {/* Type Badge */}
              <View
                style={[
                  styles.typeChip,
                  {
                    backgroundColor: typeColors.badgeBg,
                    borderWidth: 1,
                    borderColor: `${typeColors.border}40`,
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                  },
                ]}>
                <View
                  style={[
                    styles.typeDot,
                    {backgroundColor: typeColors.badgeText},
                  ]}
                />
                <Text
                  style={[
                    styles.typeChipText,
                    {color: typeColors.badgeText, fontSize: 10},
                  ]}>
                  {typeColors.label}
                </Text>
              </View>

              {/* Method chip */}
              <View
                style={[
                  styles.metaChip,
                  {
                    backgroundColor: `${AppColors.brandPurple}12`,
                    borderColor: `${AppColors.brandPurple}30`,
                  },
                ]}>
                <Text
                  style={[
                    styles.metaChipText,
                    {color: AppColors.brandPurple, fontSize: 10},
                  ]}>
                  console.
                  {selectedLog.sourceMethod || selectedLog.type || 'log'}
                </Text>
              </View>

              {/* JSON content type chip */}
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
                    style={[
                      styles.metaChipText,
                      {color: AppColors.teal600, fontSize: 10},
                    ]}>
                    {Array.isArray(jsonContent.data)
                      ? `Array[${jsonContent.data.length}]`
                      : `Object{${Object.keys(jsonContent.data).length}}`}
                  </Text>
                </View>
              )}

              {/* Duplicate count chip */}
              {selectedLog.duplicateCount != null &&
                selectedLog.duplicateCount > 1 && (
                  <View
                    style={[
                      styles.metaChip,
                      {
                        backgroundColor: `${AppColors.purple}1A`,
                        borderColor: `${AppColors.purple}3D`,
                      },
                    ]}>
                    <Text
                      style={[
                        styles.metaChipText,
                        {color: AppColors.purple, fontWeight: '700'},
                      ]}>
                      {t('console.duplicates', {
                        count: selectedLog.duplicateCount,
                      })}
                    </Text>
                  </View>
                )}
            </View>

            {/* Quick Copy button */}
            <CopyButton
              value={selectedLog.message}
              label={t('console.logMessage')}
            />
          </View>

          {/* Caller & Trace origin info */}
          <View style={{gap: 4}}>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap'}}>
              {originFrame?.fileExt && originFrame.fileExt !== 'other' && (
                <View
                  style={{
                    backgroundColor:
                      originFrame.fileExt === 'tsx' || originFrame.fileExt === 'ts'
                        ? AppColors.brandPurple
                        : AppColors.teal600,
                    borderRadius: 4,
                    paddingHorizontal: 5,
                    paddingVertical: 1.5,
                  }}>
                  <Text
                    style={{
                      fontFamily: AppFonts.interBold,
                      fontSize: 9.5,
                      color: AppColors.white,
                      letterSpacing: 0.5,
                    }}>
                    {originFrame.fileExt.toUpperCase()}
                  </Text>
                </View>
              )}

              <Text
                selectable
                style={{
                  fontFamily: AppFonts.interBold,
                  fontSize: 13,
                  color: AppColors.primaryBlack,
                  lineHeight: 18,
                  flexShrink: 1,
                }}>
                {originFrame?.functionName && originFrame.functionName !== '<anonymous>'
                  ? `${originFrame.functionName}()`
                  : originFrame?.fileName || t('console.consoleLog')}
              </Text>

              {originFrame?.fileName && (
                <Pressable
                  onPress={() =>
                    openInVSCode(
                      originFrame.rawFilePath ||
                        originFrame.fullPath ||
                        originFrame.fileName,
                      originFrame.lineNumber,
                      originFrame.columnNumber,
                    )
                  }
                  hitSlop={8}
                  style={[
                    styles.metaChip,
                    {
                      backgroundColor: `${AppColors.brandPurple}15`,
                      borderColor: `${AppColors.brandPurple}40`,
                      paddingHorizontal: 7,
                      paddingVertical: 2,
                    },
                  ]}>
                  <View style={{flexDirection: 'row', alignItems: 'center', gap: 4, flexShrink: 1}}>
                    <DocIcon color={AppColors.brandPurple} size={10} />
                    <Text
                      style={[
                        styles.metaChipText,
                        {color: AppColors.brandPurple, fontSize: 10, fontFamily: AppFonts.interBold, flexShrink: 1},
                      ]}>
                      {originFrame.fileName}
                      {originFrame.lineNumber ? `:${originFrame.lineNumber}` : ''}
                      {originFrame.columnNumber ? `:${originFrame.columnNumber}` : ''}
                    </Text>
                    <ExternalLinkIcon color={AppColors.brandPurple} size={9} />
                  </View>
                </Pressable>
              )}
            </View>

            {/* Enhanced metadata metrics row */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                flexWrap: 'wrap',
              }}>
              <Text
                style={{
                  fontFamily: AppFonts.interBold,
                  fontSize: 10,
                  color: AppColors.grayTextWeak,
                }}>
                #{selectedLog.id + 1}
              </Text>
              <Text style={detailStyles.metaDot}>•</Text>
              <Text
                style={{
                  fontFamily: AppFonts.interRegular,
                  fontSize: 10,
                  color: AppColors.grayTextWeak,
                }}>
                {formatDateTime(selectedLog.timestamp)} ({getRelativeTime(selectedLog.timestamp)})
              </Text>
              <Text style={detailStyles.metaDot}>•</Text>
              <Text
                style={{
                  fontFamily: AppFonts.interRegular,
                  fontSize: 10,
                  color: AppColors.grayTextWeak,
                }}>
                {getSize(selectedLog.message)}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Sub-tabs header */}
      <View style={detailStyles.tabsHeaderWrap}>
        <SegmentedTabs
          tabs={subTabs}
          activeKey={activeTab}
          onChange={key => setActiveTab(key as DetailSubTab)}
        />
      </View>

      {/* Search row (only for output/arguments/stack tabs) */}
      {activeTab !== 'metadata' && (
        <View style={{paddingHorizontal: 12, paddingTop: 6, paddingBottom: 4}}>
          <View style={[styles.detailSearchRow, {marginBottom: 0}]}>
            <View
              style={[
                styles.detailSearchBox,
                {
                  backgroundColor: isDark
                    ? `${AppColors.brandPurple}10`
                    : AppColors.purpleShade50,
                  borderWidth: 1,
                  borderColor: AppColors.dividerColor,
                },
              ]}>
              <SearchIcon color={AppColors.grayTextWeak} size={15} />
              <TextInput
                placeholder="Search in log details..."
                placeholderTextColor={AppColors.grayTextWeak}
                value={detailSearch}
                onChangeText={setDetailSearch}
                style={styles.detailSearchInput}
                autoCorrect={false}
                autoCapitalize="none"
              />
              {detailSearch.length > 0 && (
                <Pressable
                  onPress={() => setDetailSearch('')}
                  hitSlop={10}
                  style={{padding: 6}}>
                  <ClearIcon color={AppColors.grayTextWeak} size={13} />
                </Pressable>
              )}
            </View>
          </View>
        </View>
      )}

      {/* Tab Content Container */}
      <ScrollView
        style={{flex: 1}}
        contentContainerStyle={{
          paddingHorizontal: 12,
          paddingTop: 6,
          paddingBottom: 28,
          flexGrow: 1,
        }}
        showsVerticalScrollIndicator={true}
        keyboardShouldPersistTaps="handled">
        {/* Tab 1: Output / Message */}
        {activeTab === 'output' && (
          <View
            style={[
              styles.sectionContainer,
              {
                backgroundColor: isDark
                  ? `${AppColors.purple}12`
                  : AppColors.purpleShade50,
                borderWidth: 1,
                borderColor: AppColors.dividerColor,
                borderRadius: 12,
                overflow: 'hidden',
                flex: 1,
              },
            ]}>
            {/* Section Header with View Modes */}
            <View
              style={{
                flexDirection: 'column',
                gap: 8,
                paddingHorizontal: 12,
                paddingVertical: 10,
                borderBottomWidth: 1,
                borderBottomColor: AppColors.dividerColor,
                backgroundColor: isDark
                  ? AppColors.primaryLight
                  : AppColors.grayBackground,
              }}>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                <Text
                  style={{
                    fontFamily: AppFonts.interBold,
                    fontSize: 11.5,
                    color: AppColors.purple,
                    letterSpacing: 0.4,
                    textTransform: 'uppercase',
                  }}>
                  {jsonContent
                    ? t('console.jsonTitle')
                    : t('console.messageTitle')}
                </Text>
                <CopyButton
                  value={selectedLog.message}
                  label={t('console.logMessage')}
                />
              </View>

              {jsonContent && (
                <SegmentedTabs
                  tabs={[
                    {
                      key: 'pretty',
                      label: t('network.jsonViewer.pretty'),
                      icon: (isActive: boolean) => (
                        <PrettyIcon
                          color={
                            isActive
                              ? AppColors.white
                              : AppColors.grayTextWeak
                          }
                          size={12}
                        />
                      ),
                    },
                    {
                      key: 'raw',
                      label: t('network.jsonViewer.raw'),
                      icon: (isActive: boolean) => (
                        <RawIcon
                          color={
                            isActive
                              ? AppColors.white
                              : AppColors.grayTextWeak
                          }
                          size={12}
                        />
                      ),
                    },
                    {
                      key: 'table',
                      label: t('network.jsonViewer.table'),
                      icon: (isActive: boolean) => (
                        <TableIcon
                          color={
                            isActive
                              ? AppColors.white
                              : AppColors.grayTextWeak
                          }
                          size={12}
                        />
                      ),
                    },
                  ]}
                  activeKey={viewMode}
                  onChange={key =>
                    setViewMode(key as 'pretty' | 'raw' | 'table')
                  }
                />
              )}
            </View>

            {/* Content Body */}
            <View style={{padding: 12, flex: 1}}>
              {jsonContent ? (
                <>
                  {jsonContent.header ? (
                    <View
                      style={{
                        backgroundColor: AppColors.primaryLight,
                        borderRadius: 8,
                        borderWidth: 1,
                        borderColor: AppColors.dividerColor,
                        padding: 10,
                        marginBottom: 8,
                      }}>
                      <Text
                        selectable
                        style={{
                          fontFamily: AppFonts.interRegular,
                          fontSize: 12,
                          color: AppColors.primaryBlack,
                          lineHeight: 17,
                        }}>
                        {jsonContent.header}
                      </Text>
                    </View>
                  ) : null}
                  <JsonViewer
                    data={jsonContent.data}
                    search={detailSearch}
                    wrap
                    forceOpen
                    hideTabs
                    fullHeight
                    mode={viewMode}
                    defaultExpandDepth={
                      jsonContent.data &&
                      typeof jsonContent.data === 'object' &&
                      Object.keys(jsonContent.data).length > 10
                        ? 1
                        : 2
                    }
                  />
                </>
              ) : (
                <View
                  style={{
                    backgroundColor: AppColors.primaryLight,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: AppColors.dividerColor,
                    padding: 10,
                  }}>
                  <HighlightText
                    text={selectedLog.message}
                    search={detailSearch}
                    style={{
                      fontFamily: AppFonts.interRegular,
                      fontSize: 12,
                      color: AppColors.primaryBlack,
                      lineHeight: 18,
                    }}
                    highlightStyle={{
                      backgroundColor: AppColors.yellowHighlight,
                      color: AppColors.primaryBlack,
                      borderRadius: 3,
                      paddingHorizontal: 2,
                    }}
                    detectLinks={true}
                  />
                </View>
              )}
            </View>
          </View>
        )}

        {/* Tab 2: Individual Arguments */}
        {activeTab === 'arguments' && selectedLog.rawArgs && (
          <View style={{gap: 10}}>
            {selectedLog.rawArgs.map((arg, idx) => {
              const argType =
                arg === null
                  ? 'null'
                  : Array.isArray(arg)
                  ? `Array[${arg.length}]`
                  : typeof arg === 'object'
                  ? `Object{${Object.keys(arg).length}}`
                  : typeof arg;
              const isObj =
                arg != null &&
                (typeof arg === 'object' || Array.isArray(arg));
              const argStr = isObj
                ? JSON.stringify(arg, null, 2)
                : String(arg);

              return (
                <View
                  key={idx}
                  style={[
                    styles.sectionContainer,
                    {
                      backgroundColor: AppColors.primaryLight,
                      borderRadius: 10,
                      borderWidth: 1,
                      borderColor: AppColors.dividerColor,
                      overflow: 'hidden',
                    },
                  ]}>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      backgroundColor: AppColors.grayBackground,
                      borderBottomWidth: 1,
                      borderBottomColor: AppColors.dividerColor,
                    }}>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 6,
                      }}>
                      <Text
                        style={{
                          fontFamily: AppFonts.interBold,
                          fontSize: 11,
                          color: AppColors.purple,
                        }}>
                        Arg #{idx + 1}
                      </Text>
                      <View
                        style={[
                          styles.metaChip,
                          {
                            backgroundColor: `${AppColors.teal600}12`,
                            borderColor: `${AppColors.teal600}2B`,
                            paddingHorizontal: 5,
                            paddingVertical: 1.5,
                          },
                        ]}>
                        <Text
                          style={[
                            styles.metaChipText,
                            {color: AppColors.teal600, fontSize: 9},
                          ]}>
                          {argType}
                        </Text>
                      </View>
                    </View>
                    <CopyButton value={argStr} label={`Arg #${idx + 1}`} />
                  </View>

                  <View style={{padding: 10}}>
                    {isObj ? (
                      <JsonViewer
                        data={arg}
                        search={detailSearch}
                        wrap
                        forceOpen
                        hideTabs
                        defaultExpandDepth={2}
                      />
                    ) : (
                      <HighlightText
                        text={argStr}
                        search={detailSearch}
                        style={{
                          fontFamily: AppFonts.interRegular,
                          fontSize: 12,
                          color: AppColors.primaryBlack,
                          lineHeight: 17,
                        }}
                        highlightStyle={{
                          backgroundColor: AppColors.yellowHighlight,
                          color: AppColors.primaryBlack,
                        }}
                      />
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Tab 3: Call Stack Trace */}
        {activeTab === 'stack' && (
          <View
            style={[
              styles.sectionContainer,
              {
                backgroundColor: isDark
                  ? `${AppColors.purple}12`
                  : AppColors.purpleShade50,
                borderWidth: 1,
                borderColor: AppColors.dividerColor,
                borderRadius: 12,
                overflow: 'hidden',
              },
            ]}>
            {/* Section Header with Mode Switch */}
            <View
              style={{
                flexDirection: 'column',
                gap: 8,
                paddingHorizontal: 12,
                paddingVertical: 10,
                borderBottomWidth: 1,
                borderBottomColor: AppColors.dividerColor,
                backgroundColor: isDark
                  ? AppColors.primaryLight
                  : AppColors.grayBackground,
              }}>
              {/* Header Top Row: Title, Mode switcher & Full copy */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 8,
                }}>
                <Text
                  style={{
                    fontFamily: AppFonts.interBold,
                    fontSize: 11.5,
                    color: AppColors.purple,
                    textTransform: 'uppercase',
                    letterSpacing: 0.4,
                  }}>
                  {stackSource === 'error'
                    ? t('console.errorStack', {count: parsedStackFrames.length})
                    : t('console.callStack', {count: parsedStackFrames.length})}
                </Text>

                <View style={{flexDirection: 'row', alignItems: 'center', gap: 5}}>
                  <View
                    style={{
                      flexDirection: 'row',
                      backgroundColor: isDark ? AppColors.primaryLight : AppColors.white,
                      borderRadius: 7,
                      padding: 2,
                      borderWidth: 1,
                      borderColor: AppColors.dividerColor,
                    }}>
                    <Pressable
                      onPress={() => setStackViewMode('structured')}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 3,
                        paddingVertical: 3.5,
                        paddingHorizontal: 7,
                        borderRadius: 5,
                        backgroundColor:
                          stackViewMode === 'structured'
                            ? AppColors.brandPurple
                            : 'transparent',
                      }}>
                      <LayersIcon
                        color={
                          stackViewMode === 'structured'
                            ? AppColors.white
                            : AppColors.grayTextWeak
                        }
                        size={11}
                      />
                      <Text
                        style={{
                          fontFamily: AppFonts.interBold,
                          fontSize: 10,
                          color:
                            stackViewMode === 'structured'
                              ? AppColors.white
                              : AppColors.grayTextStrong,
                        }}>
                        {t('console.cardsView')}
                      </Text>
                    </Pressable>

                    <Pressable
                      onPress={() => setStackViewMode('raw')}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 3,
                        paddingVertical: 3.5,
                        paddingHorizontal: 7,
                        borderRadius: 5,
                        backgroundColor:
                          stackViewMode === 'raw'
                            ? AppColors.brandPurple
                            : 'transparent',
                      }}>
                      <RawIcon
                        color={
                          stackViewMode === 'raw'
                            ? AppColors.white
                            : AppColors.grayTextWeak
                        }
                        size={11}
                      />
                      <Text
                        style={{
                          fontFamily: AppFonts.interBold,
                          fontSize: 10,
                          color:
                            stackViewMode === 'raw'
                              ? AppColors.white
                              : AppColors.grayTextStrong,
                        }}>
                        {t('console.rawTraceView')}
                      </Text>
                    </Pressable>
                  </View>

                  <CopyButton
                    value={activeStackString}
                    label={t('console.fullStackTrace')}
                  />
                </View>
              </View>

              {/* Source Switcher if Error Stack exists */}
              {selectedLog.errorStack && (
                <SegmentedTabs
                  tabs={[
                    {
                      key: 'caller',
                      label: t('console.callOriginStack'),
                    },
                    {
                      key: 'error',
                      label: t('console.errorThrownStack'),
                    },
                  ]}
                  activeKey={stackSource}
                  onChange={key => setStackSource(key as 'caller' | 'error')}
                />
              )}

              {/* Scope Filter Tabs (Full Width) */}
              <SegmentedTabs
                tabs={[
                  {
                    key: 'app',
                    label: t('console.appCodeScope', {count: appStackFrames.length}),
                  },
                  {
                    key: 'all',
                    label: t('console.allFramesScope', {count: parsedStackFrames.length}),
                  },
                ]}
                activeKey={stackFilter}
                onChange={key => setStackFilter(key as 'app' | 'all')}
              />
            </View>

            {/* Stack Content: Structured Cards or Raw Full Trace */}
            {stackViewMode === 'structured' ? (
              <View style={{padding: 12, gap: 10}}>
                {displayedFrames.length > 0 ? (
                  displayedFrames.map((frame, frameIdx) => {
                    const isTopFrame = frameIdx === 0;

                    const frameBadgeBg =
                      frame.frameType === 'app'
                        ? `${AppColors.brandPurple}15`
                        : frame.frameType === 'dependency'
                        ? `${AppColors.amber500}18`
                        : frame.frameType === 'native'
                        ? `${AppColors.sky500}18`
                        : AppColors.grayBorderSecondary;

                    const frameBadgeText =
                      frame.frameType === 'app'
                        ? AppColors.brandPurple
                        : frame.frameType === 'dependency'
                        ? AppColors.amber700
                        : frame.frameType === 'native'
                        ? AppColors.sky500
                        : AppColors.grayTextWeak;

                    return (
                      <View
                        key={frameIdx}
                        style={{
                          backgroundColor: isTopFrame
                            ? `${AppColors.brandPurple}0A`
                            : AppColors.primaryLight,
                          borderRadius: 10,
                          borderWidth: 1,
                          borderColor: isTopFrame
                            ? `${AppColors.brandPurple}35`
                            : AppColors.dividerColor,
                          padding: 11,
                          gap: 6,
                        }}>
                        {/* Frame Top Row: Origin / Category, File, Line badge, Copy */}
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 6,
                          }}>
                          <View style={{flexDirection: 'row', alignItems: 'center', gap: 5, flex: 1, flexWrap: 'wrap'}}>
                            {isTopFrame && (
                              <View
                                style={{
                                  backgroundColor: AppColors.brandPurple,
                                  borderRadius: 4,
                                  paddingHorizontal: 5,
                                  paddingVertical: 1.5,
                                }}>
                                <Text
                                  style={{
                                    fontFamily: AppFonts.interBold,
                                    fontSize: 8.5,
                                    color: AppColors.white,
                                  }}>
                                  {t('console.originBadge')}
                                </Text>
                              </View>
                            )}

                            {frame.fileExt && frame.fileExt !== 'other' && (
                              <View
                                style={{
                                  backgroundColor:
                                    frame.fileExt === 'tsx' || frame.fileExt === 'ts'
                                      ? `${AppColors.brandPurple}18`
                                      : `${AppColors.teal600}18`,
                                  borderRadius: 4,
                                  paddingHorizontal: 4.5,
                                  paddingVertical: 1.5,
                                }}>
                                <Text
                                  style={{
                                    fontFamily: AppFonts.interBold,
                                    fontSize: 8.5,
                                    color:
                                      frame.fileExt === 'tsx' || frame.fileExt === 'ts'
                                        ? AppColors.brandPurple
                                        : AppColors.teal600,
                                  }}>
                                  {frame.fileExt.toUpperCase()}
                                </Text>
                              </View>
                            )}

                            <Text
                              style={{
                                fontFamily: AppFonts.interBold,
                                fontSize: 11.5,
                                color: isTopFrame
                                  ? AppColors.brandPurple
                                  : AppColors.primaryBlack,
                              }}>
                              {frame.fileName}
                            </Text>
                          </View>

                          <View style={{flexDirection: 'row', alignItems: 'center', gap: 4}}>
                            {frame.lineNumber && (
                              <View
                                style={{
                                  backgroundColor: `${AppColors.teal600}15`,
                                  borderColor: `${AppColors.teal600}30`,
                                  borderWidth: 1,
                                  borderRadius: 4,
                                  paddingHorizontal: 5,
                                  paddingVertical: 1.5,
                                }}>
                                <Text
                                  style={{
                                    fontFamily: AppFonts.interBold,
                                    fontSize: 9.5,
                                    color: AppColors.teal600,
                                  }}>
                                  L{frame.lineNumber}{frame.columnNumber ? `:C${frame.columnNumber}` : ''}
                                </Text>
                              </View>
                            )}
                            <CopyButton
                              value={frame.copyableLocation}
                              label={frame.fileName}
                            />
                          </View>
                        </View>

                        {/* Middle Row: Function / Symbol Invocation */}
                        <View style={{flexDirection: 'row', alignItems: 'center', gap: 5}}>
                          <HighlightText
                            text={frame.functionName !== '<anonymous>' ? `${frame.functionName}()` : '<anonymous>'}
                            search={detailSearch}
                            style={{
                              fontFamily: AppFonts.interBold,
                              fontSize: 12.5,
                              color: AppColors.primaryBlack,
                            }}
                            highlightStyle={{
                              backgroundColor: AppColors.yellowHighlight,
                              color: AppColors.primaryBlack,
                            }}
                          />
                        </View>

                        {/* Bottom Row: Clean Relative Path & Execution Scope Tag */}
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            backgroundColor: isDark ? `${AppColors.primaryBlack}25` : AppColors.grayBackground,
                            borderRadius: 6,
                            paddingHorizontal: 8,
                            paddingVertical: 4.5,
                            gap: 6,
                          }}>
                          <Text
                            selectable
                            style={{
                              fontFamily: AppFonts.interRegular,
                              fontSize: 9.5,
                              color: AppColors.grayTextStrong,
                              flex: 1,
                            }}
                            numberOfLines={1}>
                            📂 {frame.fullPath}
                          </Text>

                          <View
                            style={{
                              backgroundColor: frameBadgeBg,
                              borderRadius: 4,
                              paddingHorizontal: 5,
                              paddingVertical: 1.5,
                            }}>
                            <Text
                              style={{
                                fontFamily: AppFonts.interBold,
                                fontSize: 8.5,
                                color: frameBadgeText,
                              }}>
                              {frame.frameType === 'app'
                                ? t('console.appCodeBadge')
                                : frame.frameType === 'dependency'
                                ? t('console.dependencyBadge')
                                : frame.frameType === 'native'
                                ? t('console.nativeBadge')
                                : t('console.hermesVmBadge')}
                            </Text>
                          </View>
                        </View>
                      </View>
                    );
                  })
                ) : (
                  <Text
                    style={{
                      fontFamily: AppFonts.interRegular,
                      fontSize: 11.5,
                      color: AppColors.grayTextWeak,
                      textAlign: 'center',
                      paddingVertical: 16,
                    }}>
                    {t('console.noStackAvailable')}
                  </Text>
                )}
              </View>
            ) : (
              /* Raw Full Trace Monospace Block */
              <View
                style={{
                  backgroundColor: AppColors.primaryLight,
                  padding: 12,
                }}>
                {activeStackString.split('\n').filter(l => l.trim().length > 0).map((line, lineIdx) => (
                  <View
                    key={lineIdx}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'flex-start',
                      paddingVertical: 2,
                    }}>
                    <Text
                      style={{
                        width: 28,
                        textAlign: 'right',
                        paddingRight: 8,
                        fontFamily: AppFonts.interRegular,
                        fontSize: 11,
                        color: AppColors.grayTextWeak,
                        lineHeight: 17,
                      }}>
                      {lineIdx + 1}
                    </Text>
                    <HighlightText
                      text={line.trim()}
                      search={detailSearch}
                      style={{
                        flex: 1,
                        fontFamily: AppFonts.interRegular,
                        fontSize: 12,
                        color: AppColors.primaryBlack,
                        lineHeight: 17,
                      }}
                      highlightStyle={{
                        backgroundColor: AppColors.yellowHighlight,
                        color: AppColors.primaryBlack,
                      }}
                    />
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Tab 4: Structured Metadata */}
        {activeTab === 'metadata' && (
          <View
            style={[
              styles.sectionContainer,
              {
                backgroundColor: AppColors.primaryLight,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: AppColors.dividerColor,
                overflow: 'hidden',
              },
            ]}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: 12,
                paddingVertical: 9,
                backgroundColor: AppColors.grayBackground,
                borderBottomWidth: 1,
                borderBottomColor: AppColors.dividerColor,
              }}>
              <Text
                style={{
                  fontFamily: AppFonts.interBold,
                  fontSize: 11.5,
                  color: AppColors.purple,
                  textTransform: 'uppercase',
                  letterSpacing: 0.4,
                }}>
                Log Properties
              </Text>
              <CopyButton
                value={JSON.stringify(
                  {
                    id: selectedLog.id + 1,
                    type: selectedLog.type,
                    sourceMethod: selectedLog.sourceMethod || 'log',
                    timestamp: selectedLog.timestamp,
                    dateTime: formatDateTime(selectedLog.timestamp),
                    caller: selectedLog.caller,
                    triggerFile: originFrame?.fileName,
                    triggerLine: originFrame?.lineNumber,
                    triggerFunction: originFrame?.functionName,
                    charCount: selectedLog.message.length,
                    size: getSize(selectedLog.message),
                    duplicates: selectedLog.duplicateCount || 1,
                  },
                  null,
                  2,
                )}
                label="Metadata JSON"
              />
            </View>

            <View style={{paddingHorizontal: 12, paddingVertical: 4}}>
              {[
                {label: 'Log ID', value: `#${selectedLog.id + 1}`},
                {label: 'Level', value: selectedLog.type.toUpperCase()},
                {
                  label: 'Source Method',
                  value: `console.${selectedLog.sourceMethod || selectedLog.type || 'log'}`,
                },
                {
                  label: 'Triggered At',
                  value: `${formatDateTime(selectedLog.timestamp)} (${getRelativeTime(selectedLog.timestamp)})`,
                },
                {label: 'Timestamp (ms)', value: String(selectedLog.timestamp)},
                {
                  label: 'Trigger File',
                  value: originFrame?.fileName || 'Unknown',
                },
                ...(originFrame?.lineNumber
                  ? [
                      {
                        label: 'Trigger Location',
                        value: `Line ${originFrame.lineNumber}, Col ${originFrame.columnNumber || 0}`,
                      },
                    ]
                  : []),
                ...(originFrame?.functionName && originFrame.functionName !== '<anonymous>'
                  ? [
                      {
                        label: 'Trigger Function',
                        value: `${originFrame.functionName}()`,
                      },
                    ]
                  : []),
                {
                  label: 'Full Location',
                  value: selectedLog.caller || 'Unknown',
                },
                {
                  label: 'Character Length',
                  value: `${selectedLog.message.length} chars`,
                },
                {
                  label: 'Approx. Size',
                  value: getSize(selectedLog.message),
                },
                {
                  label: 'Duplicate Count',
                  value: String(selectedLog.duplicateCount || 1),
                },
                ...(hasMultipleArgs
                  ? [
                      {
                        label: 'Arguments Count',
                        value: `${selectedLog.rawArgs?.length} arguments`,
                      },
                    ]
                  : []),
              ].map((row, rIdx, arr) => (
                <View
                  key={rIdx}
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingVertical: 8,
                    borderBottomWidth: rIdx < arr.length - 1 ? 1 : 0,
                    borderBottomColor: AppColors.grayBorderSecondary,
                  }}>
                  <Text
                    style={{
                      fontFamily: AppFonts.interMedium,
                      fontSize: 11.5,
                      color: AppColors.grayTextWeak,
                    }}>
                    {row.label}
                  </Text>
                  <Text
                    selectable
                    style={{
                      fontFamily: AppFonts.interBold,
                      fontSize: 11.5,
                      color: AppColors.primaryBlack,
                      maxWidth: '60%',
                      textAlign: 'right',
                    }}
                    numberOfLines={2}>
                    {row.value}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
});

const detailStyles = StyleSheet.create({
  metaDot: {
    fontSize: 10,
    color: AppColors.grayTextWeak,
    opacity: 0.7,
  },
  tabsHeaderWrap: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 4,
  },
});

export default LogDetail;
