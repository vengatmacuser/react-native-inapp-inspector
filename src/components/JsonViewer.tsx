import React, {useState, useEffect, useMemo} from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import {useTranslation} from '../i18n';

// Components
import TreeNode from './TreeNode';
import HighlightText from './HighlightText';
import TouchableScale from './TouchableScale';
import {
  PrettyIcon,
  RawIcon,
  TableIcon,
  ChevronIcon,
  CopyIcon,
  CheckIcon,
} from './NetworkIcons';

// Styles & Helpers
import {AppColors} from '../styles/AppColors';
import {getSize, copyToClipboard} from '../helpers';
import {triggerNativeHaptic} from '../native/NativeInspector';

const monoFont = Platform.select({
  ios: 'Menlo',
  android: 'monospace',
  default: 'monospace',
});

// ── Type Badge for Table Mode ────────────────────────────────────────────────

const getTypeDetails = (val: any) => {
  if (val === null) return {label: 'null', color: '#E11D48', bg: '#FFF1F2', border: '#FECDD3'};
  if (val === undefined) return {label: 'undef', color: '#E11D48', bg: '#FFF1F2', border: '#FECDD3'};
  if (Array.isArray(val)) return {label: `arr[${val.length}]`, color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE'};
  if (typeof val === 'object') return {label: `obj{${Object.keys(val).length}}`, color: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE'};
  if (typeof val === 'number') return {label: 'num', color: '#D97706', bg: '#FEF3C7', border: '#FDE68A'};
  if (typeof val === 'boolean') return {label: 'bool', color: '#DB2777', bg: '#FDF2F8', border: '#FBCFE8'};
  return {label: 'str', color: '#059669', bg: '#ECFDF5', border: '#A7F3D0'};
};

// ── Table Row Component with IDE Code Snippet Styling ─────────────────────────

const JsonTableRow = React.memo(({
  itemKey,
  val,
  search,
  index,
}: {
  itemKey: string;
  val: any;
  search?: string;
  index: number;
}) => {
  const [expanded, setExpanded] = useState(false);
  const isObject = val !== null && typeof val === 'object';
  const typeDetails = getTypeDetails(val);

  let rawStr = '';
  if (val === null) {
    rawStr = 'null';
  } else if (val === undefined) {
    rawStr = 'undefined';
  } else if (isObject) {
    try {
      rawStr = JSON.stringify(val, null, 2);
    } catch {
      rawStr = String(val);
    }
  } else {
    rawStr = String(val);
  }

  const isMultiline = rawStr.includes('\n') || rawStr.length > 80;

  return (
    <View
      style={[
        localStyles.tableRow,
        index % 2 === 1 && localStyles.tableRowAlt,
      ]}>
      {/* Key Column */}
      <View style={localStyles.tableColKey}>
        <HighlightText
          text={itemKey}
          search={search}
          style={localStyles.tableCellKey}
          highlightStyle={localStyles.highlight}
        />
        <View style={[localStyles.typePill, {backgroundColor: typeDetails.bg, borderColor: typeDetails.border}]}>
          <Text style={[localStyles.typePillText, {color: typeDetails.color}]}>
            {typeDetails.label}
          </Text>
        </View>
      </View>

      {/* Value Column */}
      <View style={localStyles.tableColVal}>
        <View style={isObject ? localStyles.tableCodeBox : undefined}>
          <HighlightText
            text={rawStr}
            search={search}
            style={[
              localStyles.tableCellValue,
              val === null || val === undefined ? localStyles.syntaxNull : undefined,
              typeof val === 'number' ? localStyles.syntaxNumber : undefined,
              typeof val === 'boolean' ? localStyles.syntaxBoolean : undefined,
              typeof val === 'string' ? localStyles.syntaxString : undefined,
            ]}
            highlightStyle={localStyles.highlight}
            numberOfLines={expanded ? undefined : 3}
            selectable={true}
          />
        </View>
        {isMultiline && (
          <TouchableOpacity
            onPress={() => setExpanded(prev => !prev)}
            hitSlop={6}
            style={localStyles.showMoreBtn}>
            <Text style={localStyles.showMoreText}>
              {expanded ? 'Collapse' : 'Expand'}
            </Text>
            <ChevronIcon
              direction={expanded ? 'up' : 'down'}
              size={9}
              color="#4F46E5"
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
});

// ── JsonViewer Component ─────────────────────────────────────────────────────

const JsonViewer = React.memo(({
  data,
  search,
  forceOpen,
  defaultExpandDepth = 1,
  wrap,
  fullHeight = false,
  maxHeight,
  mode: externalMode,
  onModeChange,
  hideTabs = false,
}: {
  data: unknown;
  search?: string;
  forceOpen?: boolean;
  defaultExpandDepth?: number;
  wrap?: boolean;
  fullHeight?: boolean;
  maxHeight?: number;
  mode?: 'pretty' | 'raw' | 'table';
  onModeChange?: (mode: 'pretty' | 'raw' | 'table') => void;
  hideTabs?: boolean;
}) => {
  const {t} = useTranslation();
  const [internalMode, setInternalMode] = useState<'pretty' | 'raw' | 'table'>(externalMode ?? 'pretty');
  const [copied, setCopied] = useState(false);
  const [isWrap, setIsWrap] = useState(wrap ?? false);
  const [allExpanded, setAllExpanded] = useState<boolean | undefined>(forceOpen);
  const mode = onModeChange && externalMode ? externalMode : internalMode;

  const setMode = (newMode: 'pretty' | 'raw' | 'table') => {
    setInternalMode(newMode);
    if (onModeChange) {
      onModeChange(newMode);
    }
  };

  useEffect(() => {
    if (wrap !== undefined) {
      setIsWrap(wrap);
    }
  }, [wrap]);

  useEffect(() => {
    if (forceOpen !== undefined) {
      setAllExpanded(forceOpen);
    }
  }, [forceOpen]);

  const rawText = useMemo(() => {
    if (data === undefined || data === null) {
      return '';
    }
    if (typeof data === 'string') {
      return data;
    }
    try {
      return JSON.stringify(data, null, 2) ?? '';
    } catch {
      return String(data) || '';
    }
  }, [data]);

  const rawCompactText = useMemo(() => {
    if (typeof data === 'string') return data;
    try {
      return JSON.stringify(data) ?? '';
    } catch {
      return String(data) || '';
    }
  }, [data]);

  const [showFullRaw, setShowFullRaw] = useState(false);
  const RAW_LIMIT = 50000;
  const safeRawText = typeof rawText === 'string' ? rawText : '';
  const isTruncated = safeRawText.length > RAW_LIMIT && !showFullRaw;
  const displayRawText = isTruncated ? safeRawText.slice(0, RAW_LIMIT) : safeRawText;

  // Split lines for gutter numbers in Raw mode
  const rawLines = useMemo(() => {
    if (!displayRawText) return [''];
    return displayRawText.split('\n');
  }, [displayRawText]);

  const lineCount = rawLines.length;
  const sizeFormatted = useMemo(() => getSize(data), [data]);

  useEffect(() => {
    if (externalMode) {
      setInternalMode(externalMode);
    }
  }, [externalMode]);

  const handleCopy = () => {
    triggerNativeHaptic('success');
    copyToClipboard(rawCompactText || rawText, 'JSON');
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  const isObject = typeof data === 'object' && data !== null;
  const isEmpty =
    data === null ||
    data === undefined ||
    (isObject && Object.keys(data as object).length === 0);

  // Render Table mode
  const renderTableMode = () => {
    if (!isObject) {
      return (
        <View style={localStyles.tableRow}>
          <View style={localStyles.tableColKey}>
            <Text style={localStyles.tableCellKey}>{t('network.jsonViewer.value')}</Text>
          </View>
          <View style={localStyles.tableColVal}>
            <Text style={localStyles.tableCellValue}>{String(data)}</Text>
          </View>
        </View>
      );
    }

    let keys = Object.keys(data as object);
    if (search && search.trim().length > 0) {
      const q = search.trim().toLowerCase();
      keys = keys.filter(key => {
        const val = (data as any)[key];
        const valStr = typeof val === 'object' && val !== null ? JSON.stringify(val) : String(val);
        return key.toLowerCase().includes(q) || valStr.toLowerCase().includes(q);
      });
    }

    if (keys.length === 0) {
      return (
        <View style={localStyles.emptyContainer}>
          <Text style={localStyles.emptyText}>
            {search && search.trim().length > 0
              ? 'No matching keys or values found'
              : t('network.jsonViewer.emptyTable')}
          </Text>
        </View>
      );
    }

    return (
      <View style={localStyles.tableView}>
        {/* Table Header Row */}
        <View style={localStyles.tableHeaderRow}>
          <Text style={[localStyles.tableHeaderCell, {flex: 2}]}>KEY / PROPERTY</Text>
          <Text style={[localStyles.tableHeaderCell, {flex: 3}]}>VALUE</Text>
        </View>
        {keys.map((key, i) => (
          <JsonTableRow
            key={key}
            index={i}
            itemKey={key}
            val={(data as any)[key]}
            search={search}
          />
        ))}
      </View>
    );
  };

  // Tree View
  const tree = (
    <TreeNode
      data={data}
      search={search}
      forceOpen={allExpanded}
      defaultExpandDepth={allExpanded ? 99 : defaultExpandDepth}
    />
  );

  return (
    <View style={[localStyles.container, fullHeight && {flex: 1}]}>
      {/* ── Code Snippet Window Header (Frosted Pearl Chrome) ── */}
      <View style={localStyles.snippetHeader}>
        {/* Left: Format Pill + Metadata Stats */}
        <View style={localStyles.headerLeft}>
          <View style={localStyles.langBadge}>
            <Text style={localStyles.langBadgeText}>JSON</Text>
          </View>
          <View style={localStyles.metaBadge}>
            <Text style={localStyles.metaBadgeText} numberOfLines={1} ellipsizeMode="tail">
              {lineCount} {lineCount === 1 ? 'line' : 'lines'} · {sizeFormatted}
            </Text>
          </View>
        </View>

        {/* Right: Mode Tabs + Action Tools */}
        <View style={localStyles.headerRight}>
          {!hideTabs && (
            <View style={localStyles.snippetTabs}>
              <TouchableOpacity
                onPress={() => setMode('pretty')}
                activeOpacity={0.7}
                hitSlop={{top: 8, bottom: 8, left: 4, right: 4}}
                style={[
                  localStyles.snippetTabBtn,
                  mode === 'pretty' && localStyles.snippetTabBtnActive,
                ]}>
                <PrettyIcon
                  color={mode === 'pretty' ? '#FFFFFF' : '#64748B'}
                  size={11}
                />
                <Text
                  style={[
                    localStyles.snippetTabText,
                    mode === 'pretty' && localStyles.snippetTabTextActive,
                  ]}>
                  {t('network.jsonViewer.pretty')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setMode('raw')}
                activeOpacity={0.7}
                hitSlop={{top: 8, bottom: 8, left: 4, right: 4}}
                style={[
                  localStyles.snippetTabBtn,
                  mode === 'raw' && localStyles.snippetTabBtnActive,
                ]}>
                <RawIcon
                  color={mode === 'raw' ? '#FFFFFF' : '#64748B'}
                  size={11}
                />
                <Text
                  style={[
                    localStyles.snippetTabText,
                    mode === 'raw' && localStyles.snippetTabTextActive,
                  ]}>
                  {t('network.jsonViewer.raw')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setMode('table')}
                activeOpacity={0.7}
                hitSlop={{top: 8, bottom: 8, left: 4, right: 4}}
                style={[
                  localStyles.snippetTabBtn,
                  mode === 'table' && localStyles.snippetTabBtnActive,
                ]}>
                <TableIcon
                  color={mode === 'table' ? '#FFFFFF' : '#64748B'}
                  size={11}
                />
                <Text
                  style={[
                    localStyles.snippetTabText,
                    mode === 'table' && localStyles.snippetTabTextActive,
                  ]}>
                  {t('network.jsonViewer.table')}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Pretty Mode: Expand / Collapse Toggle */}
          {mode === 'pretty' && isObject && (
            <TouchableOpacity
              onPress={() => setAllExpanded(prev => !prev)}
              hitSlop={{top: 6, bottom: 6, left: 4, right: 4}}
              style={localStyles.toolToggleBtn}>
              <Text style={localStyles.toolToggleText}>
                {allExpanded ? 'Fold' : 'Expand'}
              </Text>
            </TouchableOpacity>
          )}

          {/* Raw Mode: Word Wrap Toggle */}
          {mode === 'raw' && (
            <TouchableOpacity
              onPress={() => setIsWrap(prev => !prev)}
              hitSlop={{top: 6, bottom: 6, left: 4, right: 4}}
              style={[
                localStyles.toolToggleBtn,
                isWrap && localStyles.toolToggleBtnActive,
              ]}>
              <Text
                style={[
                  localStyles.toolToggleText,
                  isWrap && localStyles.toolToggleTextActive,
                ]}>
                Wrap
              </Text>
            </TouchableOpacity>
          )}

          {/* Quick Copy Button */}
          <TouchableScale
            onPress={handleCopy}
            hitSlop={8}
            style={[localStyles.copyBtn, copied && localStyles.copyBtnSuccess]}>
            {copied ? (
              <CheckIcon color="#10B981" size={13} />
            ) : (
              <CopyIcon color="#64748B" size={13} />
            )}
          </TouchableScale>
        </View>
      </View>
      {/* ── Snippet Body (Frosted Pearl Canvas #F8FAFC / #FFFFFF) ── */}
      <View
        style={[
          localStyles.editorBody,
          fullHeight && {flex: 1, maxHeight: undefined},
          !fullHeight && maxHeight != null && {maxHeight},
        ]}>
        {/* PRETTY MODE */}
        {mode === 'pretty' && (
          isEmpty ? (
            <View style={localStyles.emptyContainer}>
              <Text style={localStyles.emptyText}>
                {t('network.jsonViewer.emptyPayload')}
              </Text>
            </View>
          ) : isWrap ? (
            fullHeight ? (
              <ScrollView style={{flex: 1}} contentContainerStyle={localStyles.prettyContainer}>
                {tree}
              </ScrollView>
            ) : (
              <View style={localStyles.prettyContainer}>{tree}</View>
            )
          ) : fullHeight ? (
            <ScrollView style={{flex: 1}} contentContainerStyle={{flexGrow: 1}}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={true}
                contentContainerStyle={localStyles.prettyContainer}>
                {tree}
              </ScrollView>
            </ScrollView>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={true}
              contentContainerStyle={localStyles.prettyContainer}>
              {tree}
            </ScrollView>
          )
        )}

        {/* RAW MODE WITH LINE NUMBERS GUTTER & INDENT SPACE DOTS */}
        {mode === 'raw' && (
          fullHeight ? (
            <ScrollView
              style={{flex: 1}}
              contentContainerStyle={{flexGrow: 1}}
              showsVerticalScrollIndicator={true}>
              <View style={localStyles.rawEditorRow}>
                {/* Gutter with line numbers */}
                <View style={localStyles.gutter}>
                  {rawLines.map((_, i) => (
                    <Text key={i} style={localStyles.gutterNumber}>
                      {i + 1}
                    </Text>
                  ))}
                </View>

                {/* Raw Code Content with Indent Space Dots */}
                <ScrollView
                  horizontal={!isWrap}
                  showsHorizontalScrollIndicator={true}
                  style={{flex: 1}}>
                  <View style={localStyles.rawTextContainer}>
                    {rawLines.map((line, index) => {
                      const match = line.match(/^(\s+)(.*)$/);
                      if (match) {
                        const leadingSpaces = match[1];
                        const rest = match[2];
                        const dots = leadingSpaces.replace(/  /g, '· ').replace(/ /g, '·');
                        return (
                          <View key={index} style={localStyles.rawCodeLineRow}>
                            <Text style={localStyles.indentDots}>{dots}</Text>
                            <HighlightText
                              text={rest}
                              search={search}
                              detectLinks={rawText.length < 20000}
                              style={localStyles.rawMonospaceText}
                              selectable={true}
                              highlightStyle={localStyles.highlight}
                            />
                          </View>
                        );
                      }
                      return (
                        <View key={index} style={localStyles.rawCodeLineRow}>
                          <HighlightText
                            text={line}
                            search={search}
                            detectLinks={rawText.length < 20000}
                            style={localStyles.rawMonospaceText}
                            selectable={true}
                            highlightStyle={localStyles.highlight}
                          />
                        </View>
                      );
                    })}
                  </View>
                </ScrollView>
              </View>

              {isTruncated && (
                <TouchableOpacity
                  onPress={() => setShowFullRaw(true)}
                  style={localStyles.truncationBanner}>
                  <Text style={localStyles.truncationText}>
                    Showing first 50 KB ({Math.round(rawText.length / 1024)} KB total) · Tap to load full payload
                  </Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          ) : (
            <View>
              <View style={localStyles.rawEditorRow}>
                {/* Gutter with line numbers */}
                <View style={localStyles.gutter}>
                  {rawLines.map((_, i) => (
                    <Text key={i} style={localStyles.gutterNumber}>
                      {i + 1}
                    </Text>
                  ))}
                </View>

                {/* Raw Code Content with Indent Space Dots */}
                <ScrollView
                  horizontal={!isWrap}
                  showsHorizontalScrollIndicator={true}
                  style={{flex: 1}}>
                  <View style={localStyles.rawTextContainer}>
                    {rawLines.map((line, index) => {
                      const match = line.match(/^(\s+)(.*)$/);
                      if (match) {
                        const leadingSpaces = match[1];
                        const rest = match[2];
                        const dots = leadingSpaces.replace(/  /g, '· ').replace(/ /g, '·');
                        return (
                          <View key={index} style={localStyles.rawCodeLineRow}>
                            <Text style={localStyles.indentDots}>{dots}</Text>
                            <HighlightText
                              text={rest}
                              search={search}
                              detectLinks={rawText.length < 20000}
                              style={localStyles.rawMonospaceText}
                              selectable={true}
                              highlightStyle={localStyles.highlight}
                            />
                          </View>
                        );
                      }
                      return (
                        <View key={index} style={localStyles.rawCodeLineRow}>
                          <HighlightText
                            text={line}
                            search={search}
                            detectLinks={rawText.length < 20000}
                            style={localStyles.rawMonospaceText}
                            selectable={true}
                            highlightStyle={localStyles.highlight}
                          />
                        </View>
                      );
                    })}
                  </View>
                </ScrollView>
              </View>

              {isTruncated && (
                <TouchableOpacity
                  onPress={() => setShowFullRaw(true)}
                  style={localStyles.truncationBanner}>
                  <Text style={localStyles.truncationText}>
                    Showing first 50 KB ({Math.round(rawText.length / 1024)} KB total) · Tap to load full payload
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )
        )}

        {/* TABLE MODE */}
        {mode === 'table' && (
          fullHeight ? (
            <ScrollView style={{flex: 1}}>
              {renderTableMode()}
            </ScrollView>
          ) : (
            <View style={localStyles.tableView}>
              {renderTableMode()}
            </View>
          )
        )}
      </View>
    </View>
  );
});

const localStyles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0', // Slate 200
    overflow: 'hidden',
    shadowColor: '#4F46E5',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: {width: 0, height: 2},
    elevation: 2,
    width: '100%',
  },
  snippetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F1F5F9', // Slate 100
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 6,
    gap: 6,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flexShrink: 1,
    minWidth: 0,
  },
  langBadge: {
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  langBadgeText: {
    fontFamily: monoFont,
    fontSize: 9.5,
    color: '#475569',
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  metaBadge: {
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 5,
    paddingVertical: 2,
    flexShrink: 1,
  },
  metaBadgeText: {
    fontFamily: monoFont,
    fontSize: 9.5,
    color: '#64748B',
    fontWeight: '600',
  },
  metaStats: {
    fontFamily: monoFont,
    fontSize: 9.5,
    color: '#64748B',
    flexShrink: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  snippetTabs: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E2E8F0',
    borderRadius: 6,
    padding: 2,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    gap: 2,
  },
  snippetTabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3.5,
    paddingVertical: 2.5,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  snippetTabBtnActive: {
    backgroundColor: '#4F46E5', // Indigo 600
    shadowColor: '#4F46E5',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 1,
  },
  snippetTabText: {
    fontFamily: monoFont,
    fontSize: 9.5,
    color: '#64748B',
    fontWeight: '600',
  },
  snippetTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  toolToggleBtn: {
    paddingHorizontal: 6,
    paddingVertical: 2.5,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolToggleBtnActive: {
    backgroundColor: '#EEF2FF',
    borderColor: '#C7D2FE',
  },
  toolToggleText: {
    fontFamily: monoFont,
    fontSize: 9.5,
    color: '#64748B',
    fontWeight: '600',
  },
  toolToggleTextActive: {
    color: '#4F46E5',
    fontWeight: '700',
  },
  copyBtn: {
    width: 24,
    height: 24,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  copyBtnSuccess: {
    borderColor: '#10B981',
    backgroundColor: '#ECFDF5',
  },
  editorBody: {
    backgroundColor: '#FFFFFF',
    minHeight: 100,
  },
  prettyContainer: {
    padding: 12,
    minWidth: '100%',
    backgroundColor: '#FFFFFF',
  },
  rawEditorRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    minHeight: 100,
  },
  gutter: {
    backgroundColor: '#F1F5F9', // Slate 100
    borderRightWidth: 1,
    borderRightColor: '#E2E8F0',
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'flex-end',
    userSelect: 'none',
  },
  gutterNumber: {
    fontFamily: monoFont,
    fontSize: 11.5,
    height: 18,
    lineHeight: 18,
    color: '#94A3B8', // Slate 400
    textAlign: 'right',
  },
  rawTextContainer: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
  },
  rawCodeLineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 18,
  },
  indentDots: {
    fontFamily: monoFont,
    fontSize: 11.5,
    lineHeight: 18,
    color: '#CBD5E1', // Slate 300 indent dots
    letterSpacing: 0.5,
  },
  rawMonospaceText: {
    fontFamily: monoFont,
    fontSize: 11.5,
    lineHeight: 18,
    color: '#0F172A',
  },
  truncationBanner: {
    margin: 10,
    backgroundColor: '#EEF2FF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  truncationText: {
    fontFamily: monoFont,
    fontSize: 10.5,
    color: '#4F46E5',
    fontWeight: '600',
  },
  tableView: {
    flex: 1,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingVertical: 7,
    paddingHorizontal: 12,
  },
  tableHeaderCell: {
    fontFamily: monoFont,
    fontSize: 10,
    color: '#475569',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
  },
  tableRowAlt: {
    backgroundColor: '#F8FAFC',
  },
  tableColKey: {
    flex: 2,
    paddingRight: 8,
  },
  tableColVal: {
    flex: 3,
  },
  tableCellKey: {
    fontFamily: monoFont,
    fontSize: 11.5,
    fontWeight: '700',
    color: '#4F46E5', // Indigo 600
  },
  typePill: {
    alignSelf: 'flex-start',
    borderRadius: 4,
    borderWidth: 1,
    paddingHorizontal: 4,
    paddingVertical: 1,
    marginTop: 3,
  },
  typePillText: {
    fontFamily: monoFont,
    fontSize: 9,
    fontWeight: '700',
  },
  tableCellValue: {
    fontFamily: monoFont,
    fontSize: 11.5,
    color: '#0F172A',
    lineHeight: 17,
  },
  tableCodeBox: {
    backgroundColor: '#F1F5F9',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 6,
  },
  showMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    marginTop: 4,
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  showMoreText: {
    fontFamily: monoFont,
    fontSize: 10,
    color: '#4F46E5',
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontFamily: monoFont,
    fontSize: 11.5,
    color: '#64748B',
  },
  highlight: {
    backgroundColor: '#FEF08A',
    color: '#854D0E',
    fontFamily: monoFont,
    fontWeight: '700',
    borderRadius: 2,
    paddingHorizontal: 2,
  },
  syntaxNull: {
    color: '#E11D48',
    fontStyle: 'italic',
  },
  syntaxNumber: {
    color: '#D97706',
  },
  syntaxBoolean: {
    color: '#DB2777',
  },
  syntaxString: {
    color: '#059669',
  },
});

export default JsonViewer;

