import React, {useState, useEffect, useMemo, useCallback} from 'react';
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
import {AppFonts} from '../styles/AppFonts';
import {getSize, copyToClipboard} from '../helpers';
import {triggerNativeHaptic} from '../native/NativeInspector';

const monoFont = Platform.select({
  ios: 'Menlo',
  android: 'monospace',
  default: 'monospace',
});

// ── Type Badge for Table Mode ────────────────────────────────────────────────

const getTypeDetails = (val: any) => {
  if (val === null)
    return {label: 'null', color: AppColors.errorColor, bg: AppColors.errorCardBg, border: AppColors.errorBorder};
  if (val === undefined)
    return {label: 'undef', color: AppColors.errorColor, bg: AppColors.errorCardBg, border: AppColors.errorBorder};
  if (Array.isArray(val))
    return {
      label: `arr[${val.length}]`,
      color: AppColors.blue600,
      bg: AppColors.blueBg,
      border: AppColors.sky100,
    };
  if (typeof val === 'object')
    return {
      label: `obj{${Object.keys(val).length}}`,
      color: AppColors.violet600,
      bg: AppColors.purple50,
      border: AppColors.purple200,
    };
  if (typeof val === 'number')
    return {label: 'num', color: AppColors.amber600, bg: AppColors.amber100, border: AppColors.amber200};
  if (typeof val === 'boolean')
    return {label: 'bool', color: AppColors.pink600, bg: AppColors.roseBg, border: AppColors.roseBorder};
  return {label: 'str', color: AppColors.emerald600, bg: AppColors.emeraldBg, border: AppColors.emeraldBorder};
};

// ── Raw Value Syntax Highlighter ─────────────────────────────────────────────

const RawValueText = React.memo(
  ({
    text,
    search,
    detectLinks,
  }: {
    text: string;
    search?: string;
    detectLinks?: boolean;
  }) => {
    const trimmed = text.trim();
    let style = localStyles.rawMonospaceText;

    if (trimmed.startsWith('"')) {
      style = localStyles.syntaxString;
    } else if (
      trimmed === 'null' ||
      trimmed.startsWith('null,') ||
      trimmed === 'undefined'
    ) {
      style = localStyles.syntaxNull;
    } else if (
      trimmed === 'true' ||
      trimmed.startsWith('true,') ||
      trimmed === 'false' ||
      trimmed.startsWith('false,')
    ) {
      style = localStyles.syntaxBoolean;
    } else if (/^-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?,?$/.test(trimmed)) {
      style = localStyles.syntaxNumber;
    }

    return (
      <HighlightText
        text={text}
        search={search}
        detectLinks={detectLinks}
        style={style}
        selectable={true}
        highlightStyle={localStyles.highlight}
      />
    );
  },
);

// ── Raw JSON Line Renderer with Syntax Highlighting ──────────────────────────

const RawJsonLine = React.memo(
  ({
    line,
    search,
    detectLinks,
  }: {
    line: string;
    search?: string;
    detectLinks?: boolean;
  }) => {
    // Extract leading spaces for indentation guide dots
    const match = line.match(/^(\s+)(.*)$/);
    const leadingSpaces = match ? match[1] : '';
    const rest = match ? match[2] : line;
    const dots = leadingSpaces
      ? leadingSpaces.replace(/  /g, '· ').replace(/ /g, '·')
      : '';

    // Match JSON key-value pattern: "key": value
    const keyValMatch = rest.match(/^("(?:[^"\\]|\\.)*")(\s*:\s*)(.*)$/);

    if (keyValMatch) {
      const jsonKey = keyValMatch[1];
      const colon = keyValMatch[2];
      const valPart = keyValMatch[3];

      return (
        <View style={localStyles.rawLineContentRow}>
          {dots.length > 0 && (
            <Text style={localStyles.indentDots}>{dots}</Text>
          )}
          <HighlightText
            text={jsonKey}
            search={search}
            style={localStyles.syntaxKey}
            selectable={true}
            highlightStyle={localStyles.highlight}
          />
          <Text style={localStyles.syntaxColon}>{colon}</Text>
          <RawValueText
            text={valPart}
            search={search}
            detectLinks={detectLinks}
          />
        </View>
      );
    }

    // Standalone lines (brackets, strings, numbers, etc.)
    return (
      <View style={localStyles.rawLineContentRow}>
        {dots.length > 0 && <Text style={localStyles.indentDots}>{dots}</Text>}
        <RawValueText text={rest} search={search} detectLinks={detectLinks} />
      </View>
    );
  },
);

// ── Table Row Component with IDE Code Snippet Styling ─────────────────────────

const JsonTableRow = React.memo(
  ({
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
          <View
            style={[
              localStyles.typePill,
              {
                backgroundColor: typeDetails.bg,
                borderColor: typeDetails.border,
              },
            ]}>
            <Text
              style={[localStyles.typePillText, {color: typeDetails.color}]}>
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
                val === null || val === undefined
                  ? localStyles.syntaxNull
                  : undefined,
                typeof val === 'number' ? localStyles.syntaxNumber : undefined,
                typeof val === 'boolean'
                  ? localStyles.syntaxBoolean
                  : undefined,
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
  },
);

// ── JsonViewer Component ─────────────────────────────────────────────────────

const JsonViewer = React.memo(
  ({
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
    const [internalMode, setInternalMode] = useState<
      'pretty' | 'raw' | 'table'
    >(externalMode ?? 'raw');
    const [copied, setCopied] = useState(false);
    const [isWrap, setIsWrap] = useState(wrap ?? true);
    const [rawIndentMode, setRawIndentMode] = useState<'formatted' | 'compact'>(
      'compact',
    );
    const [allExpanded, setAllExpanded] = useState<boolean | undefined>(
      forceOpen,
    );
    const [showFullRaw, setShowFullRaw] = useState(false);

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

    useEffect(() => {
      if (externalMode) {
        setInternalMode(externalMode);
      }
    }, [externalMode]);

    // Formatted Pretty String (Indented with 2 spaces by default)
    const prettyFormattedText = useMemo(() => {
      if (data === undefined || data === null) {
        return '';
      }
      if (typeof data === 'string') {
        const trimmed = data.trim();
        try {
          const parsed = JSON.parse(trimmed);
          return JSON.stringify(parsed, null, 2);
        } catch {
          return data;
        }
      }
      try {
        return JSON.stringify(data, null, 2) ?? '';
      } catch {
        return String(data) || '';
      }
    }, [data]);

    // Compact Single-Line String
    const compactText = useMemo(() => {
      if (typeof data === 'string') {
        const trimmed = data.trim();
        try {
          const parsed = JSON.parse(trimmed);
          return JSON.stringify(parsed);
        } catch {
          return data;
        }
      }
      try {
        return JSON.stringify(data) ?? '';
      } catch {
        return String(data) || '';
      }
    }, [data]);

    // Active Raw String based on Indent Mode
    const activeRawText =
      rawIndentMode === 'formatted' ? prettyFormattedText : compactText;

    const RAW_LIMIT = 50000;
    const safeRawText = typeof activeRawText === 'string' ? activeRawText : '';
    const isTruncated = safeRawText.length > RAW_LIMIT && !showFullRaw;
    const displayRawText = isTruncated
      ? safeRawText.slice(0, RAW_LIMIT)
      : safeRawText;

    // Split lines for gutter numbers in Raw mode
    const rawLines = useMemo(() => {
      if (!displayRawText) return [''];
      return displayRawText.split('\n');
    }, [displayRawText]);

    const lineCount = useMemo(() => {
      if (mode === 'raw') {
        return rawLines.length;
      }
      if (prettyFormattedText) {
        return prettyFormattedText.split('\n').length;
      }
      return 1;
    }, [mode, rawLines.length, prettyFormattedText]);

    const sizeFormatted = useMemo(() => getSize(data), [data]);

    const handleCopy = useCallback(() => {
      triggerNativeHaptic('success');
      copyToClipboard(
        rawIndentMode === 'compact' ? compactText : prettyFormattedText,
        'JSON',
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    }, [rawIndentMode, compactText, prettyFormattedText]);

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
              <Text style={localStyles.tableCellKey}>
                {t('network.jsonViewer.value')}
              </Text>
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
          const valStr =
            typeof val === 'object' && val !== null
              ? JSON.stringify(val)
              : String(val);
          return (
            key.toLowerCase().includes(q) || valStr.toLowerCase().includes(q)
          );
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
            <Text style={[localStyles.tableHeaderCell, {flex: 2}]}>
              KEY / PROPERTY
            </Text>
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

    // Tree View Node
    const tree = (
      <TreeNode
        data={data}
        search={search}
        forceOpen={allExpanded}
        defaultExpandDepth={allExpanded ? 99 : defaultExpandDepth}
      />
    );

    // Render Raw Code Lines
    const renderRawLines = () => {
      return (
        <View style={localStyles.rawLinesWrapper}>
          {rawLines.map((line, index) => (
            <View key={index} style={localStyles.rawCodeLineRow}>
              {/* Gutter Cell */}
              <View style={localStyles.gutterCell}>
                <Text style={localStyles.gutterNumber} selectable={false}>
                  {index + 1}
                </Text>
              </View>

              {/* Code Content Cell */}
              <View style={localStyles.rawTextCell}>
                <RawJsonLine
                  line={line}
                  search={search}
                  detectLinks={safeRawText.length < 20000}
                />
              </View>
            </View>
          ))}
        </View>
      );
    };

    // Render Truncation Banner
    const renderTruncationBanner = () => {
      if (!isTruncated) return null;
      return (
        <TouchableOpacity
          onPress={() => setShowFullRaw(true)}
          activeOpacity={0.8}
          style={localStyles.truncationBanner}>
          <Text style={localStyles.truncationText}>
            Showing first 50 KB ({Math.round(safeRawText.length / 1024)} KB
            total) · Tap to load full payload
          </Text>
        </TouchableOpacity>
      );
    };

    return (
      <View style={[localStyles.container, fullHeight && {flex: 1}]}>
        {/* ── Code Snippet Window Header ── */}
        <View style={localStyles.snippetHeader}>
          {/* Left: Button Group for Raw / Pretty / Table */}
          {!hideTabs && (
            <View style={localStyles.snippetTabs}>
              <TouchableScale
                onPress={() => setMode('raw')}
                style={[
                  localStyles.snippetTabBtn,
                  mode === 'raw' && localStyles.snippetTabBtnActive,
                ]}>
                <RawIcon
                  color={mode === 'raw' ? AppColors.white : AppColors.grayText}
                  size={11.5}
                />
                <Text
                  style={[
                    localStyles.snippetTabText,
                    mode === 'raw' && localStyles.snippetTabTextActive,
                  ]}>
                  {t('network.jsonViewer.raw', 'Raw')}
                </Text>
              </TouchableScale>

              <TouchableScale
                onPress={() => setMode('pretty')}
                style={[
                  localStyles.snippetTabBtn,
                  mode === 'pretty' && localStyles.snippetTabBtnActive,
                ]}>
                <PrettyIcon
                  color={mode === 'pretty' ? AppColors.white : AppColors.grayText}
                  size={11.5}
                />
                <Text
                  style={[
                    localStyles.snippetTabText,
                    mode === 'pretty' && localStyles.snippetTabTextActive,
                  ]}>
                  {t('network.jsonViewer.pretty', 'Pretty')}
                </Text>
              </TouchableScale>

              <TouchableScale
                onPress={() => setMode('table')}
                style={[
                  localStyles.snippetTabBtn,
                  mode === 'table' && localStyles.snippetTabBtnActive,
                ]}>
                <TableIcon
                  color={mode === 'table' ? AppColors.white : AppColors.grayText}
                  size={11.5}
                />
                <Text
                  style={[
                    localStyles.snippetTabText,
                    mode === 'table' && localStyles.snippetTabTextActive,
                  ]}>
                  {t('network.jsonViewer.table', 'Table')}
                </Text>
              </TouchableScale>
            </View>
          )}

          {/* Right: Options for Active Mode + Copy Action */}
          <View style={localStyles.headerRight}>
            {/* Raw Mode Options: Min & Wrap Toggles */}
            {mode === 'raw' && (
              <>
                <TouchableScale
                  onPress={() =>
                    setRawIndentMode(prev =>
                      prev === 'compact' ? 'formatted' : 'compact',
                    )
                  }
                  style={[
                    localStyles.toolToggleBtn,
                    rawIndentMode === 'compact' &&
                      localStyles.toolToggleBtnActive,
                  ]}>
                  <Text
                    style={[
                      localStyles.toolToggleText,
                      rawIndentMode === 'compact' &&
                        localStyles.toolToggleTextActive,
                    ]}>
                    {t('jsonViewer.min', 'Min')}
                  </Text>
                </TouchableScale>

                <TouchableScale
                  onPress={() => setIsWrap(prev => !prev)}
                  style={[
                    localStyles.toolToggleBtn,
                    isWrap && localStyles.toolToggleBtnActive,
                  ]}>
                  <Text
                    style={[
                      localStyles.toolToggleText,
                      isWrap && localStyles.toolToggleTextActive,
                    ]}>
                    {t('jsonViewer.wrap', 'Wrap')}
                  </Text>
                </TouchableScale>
              </>
            )}

            {/* Pretty Mode Option: Fold / Expand Toggle */}
            {mode === 'pretty' && isObject && (
              <TouchableScale
                onPress={() => setAllExpanded(prev => !prev)}
                style={[
                  localStyles.toolToggleBtn,
                  allExpanded && localStyles.toolToggleBtnActive,
                ]}>
                <Text
                  style={[
                    localStyles.toolToggleText,
                    allExpanded && localStyles.toolToggleTextActive,
                  ]}>
                  {allExpanded ? t('jsonViewer.fold', 'Fold') : t('jsonViewer.expand', 'Expand')}
                </Text>
              </TouchableScale>
            )}

            {/* Universal Copy Button */}
            <TouchableScale
              onPress={handleCopy}
              hitSlop={6}
              style={[
                localStyles.copyBtn,
                copied && localStyles.copyBtnSuccess,
              ]}>
              {copied ? (
                <CheckIcon color={AppColors.emerald500} size={13} />
              ) : (
                <CopyIcon color={AppColors.grayText} size={13} />
              )}
            </TouchableScale>
          </View>
        </View>

        {/* ── Snippet Body ── */}
        <View
          style={[
            localStyles.editorBody,
            fullHeight && {flex: 1, maxHeight: undefined},
            !fullHeight && maxHeight != null && {maxHeight},
          ]}>
          {/* PRETTY / TREE MODE */}
          {mode === 'pretty' &&
            (isEmpty ? (
              <View style={localStyles.emptyContainer}>
                <Text style={localStyles.emptyText}>
                  {t('network.jsonViewer.emptyPayload')}
                </Text>
              </View>
            ) : isWrap ? (
              fullHeight ? (
                <ScrollView
                  style={{flex: 1}}
                  contentContainerStyle={localStyles.prettyContainer}
                  showsVerticalScrollIndicator={true}>
                  {tree}
                </ScrollView>
              ) : (
                <View style={localStyles.prettyContainer}>{tree}</View>
              )
            ) : fullHeight ? (
              <ScrollView
                style={{flex: 1}}
                contentContainerStyle={{flexGrow: 1}}
                showsVerticalScrollIndicator={true}>
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
            ))}

          {/* RAW MODE WITH UNIFIED LINE NUMBERS GUTTER & FULL HEIGHT SUPPORT */}
          {mode === 'raw' &&
            (fullHeight ? (
              <ScrollView
                style={localStyles.fullHeightScrollView}
                contentContainerStyle={localStyles.fullHeightScrollContent}
                showsVerticalScrollIndicator={true}
                showsHorizontalScrollIndicator={false}>
                {isWrap ? (
                  <View style={localStyles.rawEditorFullWidth}>
                    {renderRawLines()}
                  </View>
                ) : (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={true}
                    contentContainerStyle={localStyles.rawHorizontalContent}>
                    <View style={{flexDirection: 'column'}}>
                      {renderRawLines()}
                    </View>
                  </ScrollView>
                )}
                {renderTruncationBanner()}
              </ScrollView>
            ) : (
              <View style={localStyles.rawEditorAutoHeight}>
                {isWrap ? (
                  <View style={localStyles.rawEditorFullWidth}>
                    {renderRawLines()}
                  </View>
                ) : (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={true}
                    contentContainerStyle={localStyles.rawHorizontalContent}>
                    <View style={{flexDirection: 'column'}}>
                      {renderRawLines()}
                    </View>
                  </ScrollView>
                )}
                {renderTruncationBanner()}
              </View>
            ))}

          {/* TABLE MODE */}
          {mode === 'table' &&
            (fullHeight ? (
              <ScrollView
                style={{flex: 1}}
                contentContainerStyle={{flexGrow: 1}}
                showsVerticalScrollIndicator={true}>
                {renderTableMode()}
              </ScrollView>
            ) : (
              <View style={localStyles.tableView}>{renderTableMode()}</View>
            ))}
        </View>
      </View>
    );
  },
);

const localStyles = StyleSheet.create({
  container: {
    backgroundColor: AppColors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AppColors.grayBorderSecondary,
    overflow: 'hidden',
    shadowColor: AppColors.brandPurple,
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: {width: 0, height: 2},
    elevation: 2,
    width: '100%',
  },
  snippetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: AppColors.grayBackground,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.grayBorderSecondary,
    paddingHorizontal: 8,
    paddingVertical: 5,
    gap: 6,
    minHeight: 38,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flexShrink: 1,
    minWidth: 0,
  },
  langBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.white,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: AppColors.grayBorderSecondary,
    paddingHorizontal: 6,
    paddingVertical: 2.5,
    gap: 4.5,
  },
  langDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: AppColors.emerald500,
  },
  langBadgeText: {
    fontFamily: monoFont,
    fontSize: 9.5,
    color: AppColors.primaryBlack,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  metaBadge: {
    backgroundColor: AppColors.white,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: AppColors.grayBorderSecondary,
    paddingHorizontal: 6,
    paddingVertical: 2.5,
    flexShrink: 1,
  },
  metaBadgeText: {
    fontFamily: monoFont,
    fontSize: 9.5,
    color: AppColors.grayTextWeak,
    fontWeight: '600',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4.5,
    flexShrink: 0,
  },
  snippetTabs: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${AppColors.slate200}80`,
    borderRadius: 8,
    padding: 2.5,
    borderWidth: 1,
    borderColor: AppColors.dividerColor,
    gap: 2,
  },
  snippetTabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 3.5,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  snippetTabBtnActive: {
    backgroundColor: AppColors.brandPurple,
    shadowColor: AppColors.brandPurple,
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.25,
    shadowRadius: 2,
    elevation: 1,
  },
  snippetTabText: {
    fontFamily: AppFonts.interSemiBold,
    fontSize: 10.5,
    color: AppColors.grayText,
  },
  snippetTabTextActive: {
    color: AppColors.white,
    fontFamily: AppFonts.interBold,
  },
  toolToggleBtn: {
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 6,
    backgroundColor: AppColors.white,
    borderWidth: 1,
    borderColor: AppColors.grayBorderSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolToggleBtnActive: {
    backgroundColor: AppColors.purpleShade50,
    borderColor: `${AppColors.brandPurple}60`,
  },
  toolToggleText: {
    fontFamily: AppFonts.interSemiBold,
    fontSize: 10.5,
    color: AppColors.grayText,
  },
  toolToggleTextActive: {
    color: AppColors.brandPurple,
    fontFamily: AppFonts.interBold,
  },
  copyBtn: {
    width: 27,
    height: 27,
    borderRadius: 6,
    backgroundColor: AppColors.white,
    borderWidth: 1,
    borderColor: AppColors.grayBorderSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copyBtnSuccess: {
    borderColor: AppColors.greenMintBorder,
    backgroundColor: AppColors.greenMintBg,
  },
  editorBody: {
    backgroundColor: '#FFFFFF',
    minHeight: 80,
  },
  prettyContainer: {
    padding: 10,
    minWidth: '100%',
    backgroundColor: '#FFFFFF',
  },
  fullHeightScrollView: {
    flex: 1,
  },
  fullHeightScrollContent: {
    flexGrow: 1,
  },
  rawEditorAutoHeight: {
    width: '100%',
  },
  rawEditorFullWidth: {
    width: '100%',
  },
  rawHorizontalContent: {
    minWidth: '100%',
  },
  rawLinesWrapper: {
    paddingVertical: 6,
    backgroundColor: '#FFFFFF',
    width: '100%',
  },
  rawCodeLineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    minHeight: 20,
    width: '100%',
  },
  gutterCell: {
    width: 38,
    paddingRight: 8,
    paddingTop: 1,
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
    borderRightWidth: 1,
    borderRightColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    userSelect: 'none',
  },
  gutterNumber: {
    fontFamily: monoFont,
    fontSize: 11,
    lineHeight: 18,
    color: '#94A3B8', // Slate 400
    textAlign: 'right',
  },
  rawTextCell: {
    flex: 1,
    paddingLeft: 8,
    paddingRight: 8,
    paddingTop: 1,
    alignItems: 'flex-start',
  },
  rawLineContentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    minHeight: 18,
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
    color: AppColors.slate900,
  },
  syntaxKey: {
    fontFamily: monoFont,
    fontSize: 11.5,
    lineHeight: 18,
    color: AppColors.syntaxKey,
    fontWeight: '700',
  },
  syntaxColon: {
    fontFamily: monoFont,
    fontSize: 11.5,
    lineHeight: 18,
    color: AppColors.syntaxColon,
    marginRight: 4,
  },
  syntaxString: {
    fontFamily: monoFont,
    fontSize: 11.5,
    lineHeight: 18,
    color: AppColors.syntaxString,
  },
  syntaxNumber: {
    fontFamily: monoFont,
    fontSize: 11.5,
    lineHeight: 18,
    color: AppColors.syntaxNumber,
  },
  syntaxBoolean: {
    fontFamily: monoFont,
    fontSize: 11.5,
    lineHeight: 18,
    color: AppColors.syntaxBoolean,
  },
  syntaxNull: {
    fontFamily: monoFont,
    fontSize: 11.5,
    lineHeight: 18,
    color: AppColors.syntaxNull,
    fontStyle: 'italic',
  },
  truncationBanner: {
    margin: 10,
    backgroundColor: AppColors.purple50,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: AppColors.purple200,
  },
  truncationText: {
    fontFamily: AppFonts.interSemiBold,
    fontSize: 11,
    color: AppColors.brandPurple,
  },
  tableView: {
    flex: 1,
    width: '100%',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: AppColors.slate100,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.slate200,
    paddingVertical: 7,
    paddingHorizontal: 12,
  },
  tableHeaderCell: {
    fontFamily: AppFonts.interBold,
    fontSize: 10.5,
    color: AppColors.slate600,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: AppColors.slate100,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'flex-start',
    backgroundColor: AppColors.white,
  },
  tableRowAlt: {
    backgroundColor: AppColors.slate50,
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
    color: AppColors.brandPurple,
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
    fontFamily: AppFonts.interBold,
    fontSize: 9,
  },
  tableCellValue: {
    fontFamily: monoFont,
    fontSize: 11.5,
    color: AppColors.slate900,
    lineHeight: 17,
  },
  tableCodeBox: {
    backgroundColor: AppColors.slate100,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: AppColors.slate200,
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
    fontFamily: AppFonts.interSemiBold,
    fontSize: 10.5,
    color: AppColors.brandPurple,
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontFamily: AppFonts.interMedium,
    fontSize: 12,
    color: AppColors.slate500,
  },
  highlight: {
    backgroundColor: AppColors.yellow200,
    color: AppColors.yellow800,
    fontFamily: monoFont,
    fontWeight: '700',
    borderRadius: 2,
    paddingHorizontal: 2,
  },
});

export default JsonViewer;
