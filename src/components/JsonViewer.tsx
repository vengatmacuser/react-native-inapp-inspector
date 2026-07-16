import React, {useState, useEffect} from 'react';
import {ScrollView, View, Text, StyleSheet, Platform} from 'react-native';

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
          {(['pretty', 'raw', 'table'] as const).map((t) => (
            <TouchableScale
              key={t}
              onPress={() => setMode(t)}
              style={[
                localStyles.segButton,
                mode === t && localStyles.segButtonActive,
              ]}>
              <Text
                style={[
                  localStyles.segText,
                  mode === t && localStyles.segTextActive,
                ]}>
                {t.toUpperCase()}
              </Text>
            </TouchableScale>
          ))}
        </View>

        {/* Right Info Badges & Copy button */}
        <View style={localStyles.rightActions}>
          <View style={localStyles.badge}>
            <Text style={localStyles.badgeText}>
              {typeLabel.toUpperCase()} {countLabel ? `(${countLabel})` : ''}
            </Text>
          </View>
          <View style={localStyles.badge}>
            <Text style={localStyles.badgeText}>{getSize(data)}</Text>
          </View>
          <TouchableScale onPress={handleCopy} style={localStyles.copyButton} hitSlop={8}>
            <CopyIcon color={AppColors.purple} size={13} />
          </TouchableScale>
        </View>
      </View>

      {/* ── Main View Content Area (Royal Monospace Theme) ── */}
      <View style={[localStyles.contentWrapper, fullHeight && {flex: 1, maxHeight: undefined}]}>
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
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={true}
                style={styles.codeBlockScroll}>
                <ScrollView style={{flex: 1}} contentContainerStyle={{flexGrow: 1}}>
                  <View style={styles.codeBlock}>{tree}</View>
                </ScrollView>
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
