import React, {useState, useEffect} from 'react';
import {ScrollView, View, Text, StyleSheet, Platform} from 'react-native';
import Svg, {Path, Rect} from 'react-native-svg';

// Components
import TreeNode from './TreeNode';
import TouchableScale from './TouchableScale';
import {CopyIcon} from './NetworkIcons';

// Helpers
import {copyToClipboard, getSize} from '../helpers';

// Styles
import {AppColors} from '../styles/AppColors';
import {AppFonts} from '../styles/AppFonts';
import styles from '../styles';

// ── Tab Icons ────────────────────────────────────────────────────────────────

const PrettyIcon = ({color = '#94A3B8', size = 12}: {color?: string; size?: number}) => (
  <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <Path
      d="M5 3C3.9 3 3 3.9 3 5v1.5c0 .8-.7 1.5-1.5 1.5S0 7.3 0 6.5V5c0-2.8 2.2-5 5-5 .6 0 1 .4 1 1s-.4 1-1 1zm6 0c-1.1 0-2 .9-2 2v1.5c0 .8-.7 1.5-1.5 1.5S6 9.3 6 8.5V5c0-2.8 2.2-5 5-5 .6 0 1 .4 1 1s-.4 1-1 1z"
      fill={color}
      opacity={0.9}
    />
    <Path d="M3 11v1.5c0 .8.7 1.5 1.5 1.5S6 13.3 6 12.5V11H3zm7 0v1.5c0 .8.7 1.5 1.5 1.5S13 13.3 13 12.5V11H10z" fill={color} opacity={0.6} />
  </Svg>
);

const RawIcon = ({color = '#94A3B8', size = 12}: {color?: string; size?: number}) => (
  <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <Rect x="1" y="2" width="10" height="1.5" rx="0.75" fill={color} opacity={0.9} />
    <Rect x="1" y="5.5" width="14" height="1.5" rx="0.75" fill={color} opacity={0.6} />
    <Rect x="1" y="9" width="8" height="1.5" rx="0.75" fill={color} opacity={0.45} />
    <Rect x="1" y="12.5" width="12" height="1.5" rx="0.75" fill={color} opacity={0.3} />
  </Svg>
);

const TableIcon = ({color = '#94A3B8', size = 12}: {color?: string; size?: number}) => (
  <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <Rect x="1" y="1" width="14" height="14" rx="2" stroke={color} strokeWidth={1.2} opacity={0.7} />
    <Path d="M1 5.5h14M1 10h14M5.5 1v14M10.5 1v14" stroke={color} strokeWidth={0.8} opacity={0.5} />
  </Svg>
);

// ── JsonViewer Component ─────────────────────────────────────────────────────

const JsonViewer = ({
  data,
  search,
  forceOpen,
  defaultExpandDepth,
  wrap,
  fullHeight = false,
  onModeChange,
}: {
  data: unknown;
  search?: string;
  forceOpen?: boolean;
  defaultExpandDepth?: number;
  wrap?: boolean;
  fullHeight?: boolean;
  onModeChange?: (mode: 'pretty' | 'raw' | 'table') => void;
}) => {
  const [mode, setMode] = useState<'pretty' | 'raw' | 'table'>('pretty');

  useEffect(() => {
    onModeChange?.(mode);
  }, [mode, onModeChange]);

  // Determine type and size details
  const isObject = typeof data === 'object' && data !== null;
  const isArray = Array.isArray(data);
  let typeLabel: string = typeof data;
  let countLabel = '';

  if (data === null) {
    typeLabel = 'null';
  } else if (isArray) {
    typeLabel = 'array';
    countLabel = `${data.length} items`;
  } else if (isObject) {
    typeLabel = 'object';
    countLabel = `${Object.keys(data).length} keys`;
  }

  // Copy helper
  const handleCopy = () => {
    copyToClipboard(data, 'JSON data');
  };

  // Render Table view (Key-Value flat table for root keys)
  const renderTableMode = () => {
    if (!isObject) {
      return (
        <View style={localStyles.tableRow}>
          <Text style={localStyles.tableCellKey}>value</Text>
          <Text style={localStyles.tableCellValue}>{String(data)}</Text>
        </View>
      );
    }

    const keys = Object.keys(data as object);
    if (keys.length === 0) {
      return (
        <View style={localStyles.emptyTable}>
          <Text style={localStyles.emptyTableText}>Empty Object</Text>
        </View>
      );
    }

    return (
      <View style={localStyles.tableView}>
        <View style={localStyles.tableHeaderRow}>
          <Text style={[localStyles.tableHeaderCell, {flex: 2}]}>Key</Text>
          <Text style={[localStyles.tableHeaderCell, {flex: 3}]}>Value</Text>
        </View>
        {keys.map((key) => {
          const val = (data as any)[key];
          let displayVal = '';
          if (val === null) {
            displayVal = 'null';
          } else if (val === undefined) {
            displayVal = 'undefined';
          } else if (typeof val === 'object') {
            displayVal = Array.isArray(val) ? `[Array(${val.length})]` : '{Object}';
          } else {
            displayVal = String(val);
          }

          return (
            <View key={key} style={localStyles.tableRow}>
              <Text style={[localStyles.tableCellKey, {flex: 2}]}>{key}</Text>
              <Text style={[localStyles.tableCellValue, {flex: 3}]} numberOfLines={2}>
                {displayVal}
              </Text>
            </View>
          );
        })}
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
      {/* ── Top Toolbar Bar (Postman-style) ── */}
      <View style={localStyles.toolbar}>
        {/* Left Segmented Control */}
        <View style={localStyles.segmentedControl}>
          {([
            {key: 'pretty', label: 'Pretty', icon: PrettyIcon},
            {key: 'raw', label: 'Raw', icon: RawIcon},
            {key: 'table', label: 'Table', icon: TableIcon},
          ] as const).map(({key, label, icon: Icon}) => (
            <TouchableScale
              key={key}
              onPress={() => setMode(key)}
              style={[
                localStyles.segButton,
                mode === key && localStyles.segButtonActive,
              ]}>
              <Icon color={mode === key ? AppColors.purple : '#94A3B8'} size={12} />
              <Text
                style={[
                  localStyles.segText,
                  mode === key && localStyles.segTextActive,
                ]}>
                {label}
              </Text>
            </TouchableScale>
          ))}
        </View>

        {/* Right Actions — badges & copy removed (caller provides header) */}

      </View>

      {/* ── Main View Content Area (Royal Monospace Theme) ── */}
      <View style={[localStyles.contentWrapper, {backgroundColor: '#F8F9FB'}, fullHeight && {flex: 1, maxHeight: undefined}]}>
        {mode === 'pretty' && (
          wrap ? (
            fullHeight ? (
              <ScrollView style={{flex: 1}} contentContainerStyle={{flexGrow: 1}}>
                <View style={[styles.codeBlock, {width: '100%'}]}>{tree}</View>
              </ScrollView>
            ) : (
              <View style={[styles.codeBlock, {width: '100%'}]}>{tree}</View>
            )
          ) : (
            fullHeight ? (
              <ScrollView style={{flex: 1}} contentContainerStyle={{flexGrow: 1}}>
                <View style={styles.codeBlock}>{tree}</View>
              </ScrollView>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={true}
                style={styles.codeBlockScroll}>
                <View style={styles.codeBlock}>{tree}</View>
              </ScrollView>
            )
          )
        )}

        {mode === 'raw' && (
          fullHeight ? (
            <ScrollView style={localStyles.rawScroll} contentContainerStyle={localStyles.rawContent}>
              <Text selectable={true} style={localStyles.rawMonospaceText}>
                {JSON.stringify(data, null, 2)}
              </Text>
            </ScrollView>
          ) : (
            <View style={localStyles.rawContent}>
              <Text selectable={true} style={localStyles.rawMonospaceText}>
                {JSON.stringify(data, null, 2)}
              </Text>
            </View>
          )
        )}

        {mode === 'table' && (
          fullHeight ? (
            <ScrollView style={localStyles.rawScroll}>
              {renderTableMode()}
            </ScrollView>
          ) : (
            <View style={localStyles.rawScroll}>
              {renderTableMode()}
            </View>
          )
        )}
      </View>
    </View>
  );
};

const localStyles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    shadowColor: '#000',
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
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 8,
    padding: 2,
  },
  segButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  segButtonActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 2,
    shadowOffset: {width: 0, height: 1},
    elevation: 1,
  },
  segText: {
    fontFamily: AppFonts.interBold,
    fontSize: 9.5,
    color: '#64748B',
    letterSpacing: 0.3,
  },
  segTextActive: {
    color: AppColors.purple,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badge: {
    backgroundColor: 'rgba(104,75,155,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(104,75,155,0.15)',
    borderRadius: 5,
    paddingHorizontal: 6,
    paddingVertical: 2.5,
  },
  badgeText: {
    fontFamily: AppFonts.interBold,
    fontSize: 9,
    color: AppColors.purple,
  },
  copyButton: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: 'rgba(104,75,155,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentWrapper: {
    backgroundColor: '#FFFFFF',
    minHeight: 120,
    maxHeight: 480,
  },
  rawScroll: {
    flex: 1,
    backgroundColor: '#FAF9F6', // Royal off-white paper tone
  },
  rawContent: {
    padding: 12,
  },
  rawMonospaceText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    fontSize: 11.5,
    color: '#0F172A',
    lineHeight: 16,
  },
  tableView: {
    flex: 1,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  tableHeaderCell: {
    fontFamily: AppFonts.interBold,
    fontSize: 9.5,
    color: '#475569',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  tableCellKey: {
    fontFamily: Platform.OS === 'ios' ? 'Courier-Bold' : 'monospace',
    fontSize: 11.5,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  tableCellValue: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 11.5,
    color: '#475569',
  },
  emptyTable: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTableText: {
    fontFamily: AppFonts.interMedium,
    fontSize: 12,
    color: '#94A3B8',
  },
});

export default JsonViewer;
