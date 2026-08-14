import React, {useState, useEffect} from 'react';
import {ScrollView, View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {useTranslation} from 'react-i18next';

// Components
import TreeNode from './TreeNode';
import SegmentedTabs from './SegmentedTabs';
import HighlightText from './HighlightText';
import {PrettyIcon, RawIcon, TableIcon} from './NetworkIcons';

// Styles
import {AppColors} from '../styles/AppColors';
import {AppFonts} from '../styles/AppFonts';
import styles from '../styles';

// ── Table Row Component with 3-Line Clamp & Show More/Less ───────────────────

const JsonTableRow = React.memo(({
  itemKey,
  val,
  search,
}: {
  itemKey: string;
  val: any;
  search?: string;
}) => {
  const [expanded, setExpanded] = useState(false);
  const isObject = val !== null && typeof val === 'object';

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

  const isMultiline = rawStr.includes('\n') || rawStr.length > 90;

  return (
    <View style={localStyles.tableRow}>
      <View style={{flex: 2, paddingRight: 8}}>
        <HighlightText
          text={itemKey}
          search={search}
          style={localStyles.tableCellKey}
          highlightStyle={localStyles.highlight}
        />
        {isObject && (
          <Text style={localStyles.tableTypeBadge}>
            {Array.isArray(val) ? `Array(${val.length})` : 'Object'}
          </Text>
        )}
      </View>

      <View style={{flex: 3}}>
        <HighlightText
          text={rawStr}
          search={search}
          style={[
            localStyles.tableCellValue,
            isObject && localStyles.tableCellRawCode,
          ]}
          highlightStyle={localStyles.highlight}
          numberOfLines={expanded ? undefined : 3}
          selectable={true}
        />
        {isMultiline && (
          <TouchableOpacity
            onPress={() => setExpanded(prev => !prev)}
            hitSlop={6}
            style={localStyles.showMoreBtn}>
            <Text style={localStyles.showMoreText}>
              {expanded ? 'Show less ▲' : 'Show more ▼'}
            </Text>
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
  defaultExpandDepth,
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
  const [internalMode, setInternalMode] = useState<'pretty' | 'raw' | 'table'>('pretty');
  const mode = externalMode ?? internalMode;

  const setMode = (newMode: 'pretty' | 'raw' | 'table') => {
    if (onModeChange) {
      onModeChange(newMode);
    } else {
      setInternalMode(newMode);
    }
  };

  const rawText = React.useMemo(() => {
    if (typeof data === 'string') {
      return data;
    }
    try {
      return JSON.stringify(data);
    } catch {
      return String(data);
    }
  }, [data]);

  useEffect(() => {
    if (externalMode) {
      setInternalMode(externalMode);
    }
  }, [externalMode]);

  const contentWrapperStyle = [
    localStyles.contentWrapper,
    {backgroundColor: AppColors.contentBg},
    fullHeight && {flex: 1, maxHeight: undefined},
    !fullHeight && maxHeight != null && {maxHeight},
  ];
  const scrollStyle = [
    localStyles.rawScroll,
    !fullHeight && maxHeight != null && {maxHeight},
  ];

  // Determine type and size details
  const isObject = typeof data === 'object' && data !== null;
  const isEmpty =
    data === null ||
    data === undefined ||
    (isObject && Object.keys(data as object).length === 0);

  // Render Table view (Key-Value flat table for root keys)
  const renderTableMode = () => {
    if (!isObject) {
      return (
        <View style={localStyles.tableRow}>
          <Text style={localStyles.tableCellKey}>{t('network.jsonViewer.value')}</Text>
          <Text style={localStyles.tableCellValue}>{String(data)}</Text>
        </View>
      );
    }

    const keys = Object.keys(data as object);
    if (keys.length === 0) {
      return (
        <View style={localStyles.emptyTable}>
          <Text style={localStyles.emptyTableText}>{t('network.jsonViewer.emptyTable')}</Text>
        </View>
      );
    }

    return (
      <View style={localStyles.tableView}>
        <View style={localStyles.tableHeaderRow}>
          <Text style={[localStyles.tableHeaderCell, {flex: 2}]}>{t('network.jsonViewer.key')}</Text>
          <Text style={[localStyles.tableHeaderCell, {flex: 3}]}>{t('network.jsonViewer.value')}</Text>
        </View>
        {keys.map((key) => (
          <JsonTableRow
            key={key}
            itemKey={key}
            val={(data as any)[key]}
            search={search}
          />
        ))}
      </View>
    );
  };

  // Tree View Content
  const tree = (
    <TreeNode
      data={data}
      search={search}
      forceOpen={forceOpen}
      defaultExpandDepth={defaultExpandDepth}
    />
  );

  return (
    <View style={[localStyles.container, fullHeight && {flex: 1}]}>
      {/* ── Top Toolbar (Postman-style) ── */}
      {!hideTabs && (
        <View style={localStyles.toolbar}>
          <SegmentedTabs
            tabs={[
              {
                key: 'pretty',
                label: t('network.jsonViewer.pretty'),
                icon: (isActive: boolean) => (
                  <PrettyIcon
                    color={isActive ? AppColors.white : AppColors.slate400}
                    size={12}
                  />
                ),
              },
              {
                key: 'raw',
                label: t('network.jsonViewer.raw'),
                icon: (isActive: boolean) => (
                  <RawIcon
                    color={isActive ? AppColors.white : AppColors.slate400}
                    size={12}
                  />
                ),
              },
              {
                key: 'table',
                label: t('network.jsonViewer.table'),
                icon: (isActive: boolean) => (
                  <TableIcon
                    color={isActive ? AppColors.white : AppColors.slate400}
                    size={12}
                  />
                ),
              },
            ]}
            activeKey={mode}
            onChange={key =>
              setMode(key as 'pretty' | 'raw' | 'table')
            }
          />
        </View>
      )}

      {/* ── Main View Content Area (Royal Monospace Theme) ── */}
      <View style={contentWrapperStyle}>
        {mode === 'pretty' && (
          isEmpty ? (
            <View style={localStyles.emptyTable}>
              <Text style={localStyles.emptyTableText}>
                {t('network.emptyResponse')}
              </Text>
            </View>
          ) : (
          wrap ? (
            fullHeight ? (
              <ScrollView style={{flex: 1}} contentContainerStyle={{flexGrow: 1}}>
                <View style={[styles.codeBlock, {width: '100%'}]}>{tree}</View>
              </ScrollView>
            ) : (
              <ScrollView style={scrollStyle} contentContainerStyle={{flexGrow: 1}}>
                <View style={[styles.codeBlock, {width: '100%'}]}>{tree}</View>
              </ScrollView>
            )
          ) : (
            fullHeight ? (
              <ScrollView style={{flex: 1}} contentContainerStyle={{flexGrow: 1}}>
                <View style={styles.codeBlock}>{tree}</View>
              </ScrollView>
            ) : (
              <ScrollView style={scrollStyle}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={true}
                  style={styles.codeBlockScroll}>
                  <View style={styles.codeBlock}>{tree}</View>
                </ScrollView>
              </ScrollView>
            )
          )
          )
        )}

        {mode === 'raw' && (
          <ScrollView
            style={scrollStyle}
            contentContainerStyle={localStyles.rawContainer}
            showsVerticalScrollIndicator={true}
            nestedScrollEnabled={true}>
            <HighlightText
              text={rawText}
              search={search}
              detectLinks={true}
              style={localStyles.rawPlainText}
              highlightStyle={{
                backgroundColor: AppColors.yellowHighlight,
                color: AppColors.primaryBlack,
                borderRadius: 3,
                paddingHorizontal: 2,
              }}
            />
          </ScrollView>
        )}

        {mode === 'table' && (
          fullHeight ? (
            <ScrollView style={scrollStyle}>
              {renderTableMode()}
            </ScrollView>
          ) : (
            <ScrollView style={scrollStyle}>
              {renderTableMode()}
            </ScrollView>
          )
        )}
      </View>
    </View>
  );
});

const localStyles = StyleSheet.create({
  container: {
    backgroundColor: AppColors.white,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: AppColors.slate200,
    overflow: 'hidden',
    shadowColor: AppColors.black,
    shadowOpacity: 0.04,
    shadowRadius: 5,
    shadowOffset: {width: 0, height: 2},
    elevation: 2,
    width: '100%',
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: AppColors.slate50,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.slate200,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  contentWrapper: {
    backgroundColor: AppColors.white,
    minHeight: 120,
  },
  rawScroll: {
    flex: 1,
    backgroundColor: AppColors.paperBg, // Royal off-white paper tone
  },
  rawContainer: {
    padding: 12,
  },
  rawPlainText: {
    fontFamily: AppFonts.interRegular,
    fontSize: 12.5,
    color: AppColors.primaryBlack,
    lineHeight: 18,
  },
  tableView: {
    flex: 1,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: AppColors.slate100,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.slate200,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  tableHeaderCell: {
    fontFamily: AppFonts.interBold,
    fontSize: 11,
    color: AppColors.slate600,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: AppColors.slate100,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  tableCellKey: {
    fontFamily: AppFonts.interBold,
    fontSize: 12.5,
    color: AppColors.purple,
  },
  tableTypeBadge: {
    fontFamily: AppFonts.interMedium,
    fontSize: 9.5,
    color: AppColors.slate400,
    marginTop: 2,
  },
  tableCellValue: {
    fontFamily: AppFonts.interRegular,
    fontSize: 12,
    color: AppColors.primaryBlack,
    lineHeight: 17,
  },
  tableCellRawCode: {
    fontFamily: AppFonts.interRegular,
    fontSize: 11.5,
    color: AppColors.slate700,
    backgroundColor: `${AppColors.slate100}80`,
    padding: 6,
    borderRadius: 6,
  },
  showMoreBtn: {
    alignSelf: 'flex-start',
    marginTop: 4,
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  showMoreText: {
    fontFamily: AppFonts.interBold,
    fontSize: 11,
    color: AppColors.purple,
  },
  emptyTable: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTableText: {
    fontFamily: AppFonts.interMedium,
    fontSize: 12.5,
    color: AppColors.slate400,
  },
  highlight: {
    backgroundColor: '#FEF08A',
    color: '#854D0E',
    fontFamily: AppFonts.interBold,
  },
});

export default JsonViewer;
