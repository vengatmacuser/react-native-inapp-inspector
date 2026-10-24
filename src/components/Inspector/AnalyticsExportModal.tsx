import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  Animated,
  Easing,
  ScrollView,
  Platform,
  Share,
} from 'react-native';
import TouchableScale from '../TouchableScale';
import {AppColors} from '../../styles/AppColors';
import {AppFonts} from '../../styles/AppFonts';
import {
  ExportIcon,
  ShareIcon,
  SaveIcon,
  CopyIcon,
  CloseWhite,
  CircleCheckIcon,
  LayersIcon,
  CheckIcon,
  SparkleIcon,
  CartIcon,
  GlobeIcon,
  BoltIcon,
} from '../NetworkIcons';
import {
  triggerNativeHaptic,
  writeNativeExportFile,
  shareNativeFile,
} from '../../native/NativeInspector';
import {copyToClipboard, showToast, getEventCategory} from '../../helpers';
import {
  formatAnalyticsEventsExport,
  estimateAnalyticsExportSize,
  generateAnalyticsFilename,
  AnalyticsExportFormat,
  AnalyticsExportOptions,
} from '../../helpers/shareFormatter';
import {useTranslation} from '../../i18n';
import type {AnalyticsEvent} from '../../types';

export interface AnalyticsExportModalProps {
  visible: boolean;
  onClose: () => void;
  filteredEvents: AnalyticsEvent[];
  allEvents: AnalyticsEvent[];
}

type ExportStage = 'config' | 'progress' | 'complete';
type ScopeType = 'filtered' | 'all';
type CategoryFilterType = 'all' | 'ecommerce' | 'page_view' | 'system' | 'custom';
type RangeMode = 'all' | 'custom';

export const AnalyticsExportModal: React.FC<AnalyticsExportModalProps> = ({
  visible,
  onClose,
  filteredEvents,
  allEvents,
}) => {
  const {t} = useTranslation();

  const [stage, setStage] = useState<ExportStage>('config');
  const [scope, setScope] = useState<ScopeType>('filtered');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilterType>('all');
  const [rangeMode, setRangeMode] = useState<RangeMode>('all');
  const [customCount, setCustomCount] = useState<string>('50');
  const [ignorePattern, setIgnorePattern] = useState<string>('');
  const [format, setFormat] = useState<AnalyticsExportFormat>('json');

  // Content option toggles
  const [includeParameters, setIncludeParameters] = useState<boolean>(true);
  const [includeScreen, setIncludeScreen] = useState<boolean>(true);
  const [includeTimestamps, setIncludeTimestamps] = useState<boolean>(true);
  const [includeCategory, setIncludeCategory] = useState<boolean>(true);
  const [includeUserProps, setIncludeUserProps] = useState<boolean>(true);
  const [includeAppInfo, setIncludeAppInfo] = useState<boolean>(true);

  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [exportedContent, setExportedContent] = useState<string>('');
  const [exportedFilename, setExportedFilename] = useState<string>('');
  const [finalSizeInBytes, setFinalSizeInBytes] = useState<number>(0);

  const progressAnim = useRef(new Animated.Value(0)).current;

  // Reset state on open
  useEffect(() => {
    if (visible) {
      setStage('config');
      setProgressPercent(0);
      setExportedContent('');
      setExportedFilename('');
      setFinalSizeInBytes(0);
      progressAnim.setValue(0);
    }
  }, [visible, progressAnim]);

  // Regex validation for ignore pattern
  const regexValidation = useMemo(() => {
    if (!ignorePattern || ignorePattern.trim().length === 0) {
      return {isValid: true, error: null as string | null, regex: null as RegExp | null};
    }
    try {
      const reg = new RegExp(ignorePattern.trim(), 'i');
      return {isValid: true, error: null, regex: reg};
    } catch (e: any) {
      return {isValid: false, error: e?.message || 'Invalid pattern', regex: null};
    }
  }, [ignorePattern]);

  const exportOptions: AnalyticsExportOptions = useMemo(
    () => ({
      includeParameters,
      includeScreen,
      includeTimestamps,
      includeCategory,
      includeUserProps,
      includeAppInfo,
      ignorePattern:
        rangeMode === 'custom' && regexValidation.isValid
          ? ignorePattern.trim()
          : undefined,
    }),
    [
      includeParameters,
      includeScreen,
      includeTimestamps,
      includeCategory,
      includeUserProps,
      includeAppInfo,
      rangeMode,
      regexValidation,
      ignorePattern,
    ],
  );

  // Target events to export based on scope, category filter, and range
  const selectedEvents = useMemo(() => {
    let pool = scope === 'filtered' ? filteredEvents : allEvents;

    if (categoryFilter !== 'all') {
      pool = pool.filter(e => getEventCategory(e.name) === categoryFilter);
    }

    if (rangeMode === 'custom') {
      const count = parseInt(customCount, 10);
      if (!isNaN(count) && count > 0) {
        pool = pool.slice(0, count);
      }
    }

    return pool;
  }, [scope, filteredEvents, allEvents, categoryFilter, rangeMode, customCount]);

  // Live estimated byte size before export
  const estimatedBytes = useMemo(() => {
    return estimateAnalyticsExportSize(selectedEvents, format, exportOptions);
  }, [selectedEvents, format, exportOptions]);

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleStartExport = useCallback(() => {
    if (selectedEvents.length === 0) {
      showToast(t('analytics.noEventsToExport', 'No analytics events available to export'));
      return;
    }

    triggerNativeHaptic('medium');
    setStage('progress');
    setProgressPercent(0);
    progressAnim.setValue(0);

    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 600,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();

    let current = 0;
    const interval = setInterval(() => {
      current += 15;
      if (current >= 100) {
        current = 100;
        setProgressPercent(100);
        clearInterval(interval);
        setTimeout(() => {
          const content = formatAnalyticsEventsExport(
            selectedEvents,
            format,
            exportOptions,
          );
          const filename = generateAnalyticsFilename(format);

          setExportedContent(content);
          setExportedFilename(filename);
          setFinalSizeInBytes(content.length);
          setStage('complete');
          triggerNativeHaptic('heavy');
        }, 150);
      } else {
        setProgressPercent(current);
      }
    }, 40);
  }, [selectedEvents, format, exportOptions, progressAnim, t]);

  const handleShare = useCallback(async () => {
    if (!exportedContent) return;
    triggerNativeHaptic('light');
    try {
      const fileUri = await writeNativeExportFile(
        exportedFilename,
        exportedContent,
      );
      if (fileUri) {
        const shared = await shareNativeFile(
          fileUri,
          format === 'csv' ? 'text/csv' : format === 'json' ? 'application/json' : 'text/plain',
          exportedFilename,
        );
        if (shared) return;
      }
      await Share.share(
        {
          title: exportedFilename,
          message: exportedContent,
          url: fileUri || undefined,
        },
        {
          dialogTitle: `Share ${exportedFilename}`,
          subject: exportedFilename,
        },
      );
    } catch (err: any) {
      if (err?.message !== 'User did not share') {
        showToast(err?.message || 'Failed to open share sheet');
      }
    }
  }, [exportedContent, exportedFilename, format]);

  const handleSaveToDisk = useCallback(async () => {
    if (!exportedContent) return;
    triggerNativeHaptic('medium');
    try {
      const fileUri = await writeNativeExportFile(
        exportedFilename,
        exportedContent,
      );
      if (fileUri) {
        const shared = await shareNativeFile(
          fileUri,
          format === 'csv' ? 'text/csv' : format === 'json' ? 'application/json' : 'text/plain',
          `Save ${exportedFilename}`,
        );
        if (shared) {
          showToast(t('analytics.savePromptOpened', 'Opened save to disk dialog'));
          return;
        }
      }
      await Share.share(
        {
          title: `Save ${exportedFilename}`,
          message: exportedContent,
          url: fileUri || undefined,
        },
        {
          dialogTitle: `Save to Disk (${exportedFilename})`,
          subject: exportedFilename,
        },
      );
      showToast(t('analytics.savePromptOpened', 'Opened save to disk dialog'));
    } catch (err: any) {
      if (err?.message !== 'User did not share') {
        showToast(err?.message || 'Save error');
      }
    }
  }, [exportedContent, exportedFilename, format, t]);

  const handleCopy = useCallback(() => {
    if (!exportedContent) return;
    triggerNativeHaptic('light');
    copyToClipboard(exportedContent, 'Analytics Events');
    showToast(t('analytics.copiedEvents', 'Events copied to clipboard!'));
  }, [exportedContent, t]);

  const hasFilterDifference = filteredEvents.length !== allEvents.length;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View style={styles.bottomSheetCard}>
          {/* Top Sheet Handle */}
          <View style={styles.sheetHandleContainer}>
            <View style={styles.sheetHandle} />
          </View>

          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <View style={styles.iconBadge}>
                <ExportIcon size={18} color={AppColors.purple} />
              </View>
              <View style={styles.headerTextGroup}>
                <Text style={styles.title}>
                  {t('analytics.exportTitle', 'Export Analytics Events')}
                </Text>
                <Text style={styles.subtitle}>
                  {stage === 'config'
                    ? `${selectedEvents.length} events ready for export`
                    : stage === 'progress'
                    ? 'Preparing exported file...'
                    : 'Export complete'}
                </Text>
              </View>
            </View>
            <TouchableScale onPress={onClose} hitSlop={10} style={styles.closeBtn}>
              <CloseWhite size={12} color={AppColors.grayTextWeak} />
            </TouchableScale>
          </View>

          {/* Body */}
          {stage === 'config' && (
            <>
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.configContainer}>
                {/* Scope Selector */}
                {hasFilterDifference && (
                  <View style={styles.section}>
                    <Text style={styles.sectionLabel}>
                      {t('analytics.exportScope', 'EVENT SCOPE')}
                    </Text>
                    <View style={styles.scopeRow}>
                      <TouchableScale
                        onPress={() => setScope('filtered')}
                        style={[
                          styles.scopeCard,
                          scope === 'filtered' && styles.scopeCardActive,
                        ]}>
                        <View style={styles.scopeHeader}>
                          <View
                            style={[
                              styles.radioCircle,
                              scope === 'filtered' && styles.radioCircleActive,
                            ]}>
                            {scope === 'filtered' && <View style={styles.radioDot} />}
                          </View>
                          <Text
                            style={[
                              styles.scopeTitle,
                              scope === 'filtered' && styles.scopeTitleActive,
                            ]}>
                            {t('analytics.filteredView', 'Active Filter')}
                          </Text>
                        </View>
                        <Text style={styles.scopeCount}>
                          {filteredEvents.length} {t('analytics.events', 'events')}
                        </Text>
                      </TouchableScale>

                      <TouchableScale
                        onPress={() => setScope('all')}
                        style={[
                          styles.scopeCard,
                          scope === 'all' && styles.scopeCardActive,
                        ]}>
                        <View style={styles.scopeHeader}>
                          <View
                            style={[
                              styles.radioCircle,
                              scope === 'all' && styles.radioCircleActive,
                            ]}>
                            {scope === 'all' && <View style={styles.radioDot} />}
                          </View>
                          <Text
                            style={[
                              styles.scopeTitle,
                              scope === 'all' && styles.scopeTitleActive,
                            ]}>
                            {t('analytics.allEventsScope', 'All Session Events')}
                          </Text>
                        </View>
                        <Text style={styles.scopeCount}>
                          {allEvents.length} {t('analytics.events', 'events')}
                        </Text>
                      </TouchableScale>
                    </View>
                  </View>
                )}

                {/* Category Filters */}
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>
                    {t('analytics.categoryFilter', 'CATEGORY FILTER')}
                  </Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.categoryPillsRow}>
                    {(
                      [
                        {key: 'all', label: 'All Categories', icon: LayersIcon},
                        {key: 'ecommerce', label: 'E-Commerce', icon: CartIcon},
                        {key: 'page_view', label: 'Screen & Pages', icon: GlobeIcon},
                        {key: 'system', label: 'System', icon: BoltIcon},
                        {key: 'custom', label: 'Custom Events', icon: SparkleIcon},
                      ] as const
                    ).map(cat => {
                      const isActive = categoryFilter === cat.key;
                      const IconComp = cat.icon;
                      return (
                        <TouchableScale
                          key={cat.key}
                          onPress={() => setCategoryFilter(cat.key)}
                          style={[
                            styles.categoryPill,
                            isActive && styles.categoryPillActive,
                          ]}>
                          <IconComp
                            size={12}
                            color={isActive ? AppColors.white : AppColors.grayTextStrong}
                          />
                          <Text
                            style={[
                              styles.categoryPillText,
                              isActive && styles.categoryPillTextActive,
                            ]}>
                            {cat.label}
                          </Text>
                        </TouchableScale>
                      );
                    })}
                  </ScrollView>
                </View>

                {/* Export Format */}
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>
                    {t('analytics.exportFormat', 'EXPORT FORMAT')}
                  </Text>
                  <View style={styles.formatRowInline}>
                    {(
                      [
                        {
                          key: 'json',
                          name: 'JSON',
                          ext: '.json',
                          desc: 'Full event payload & nested params',
                        },
                        {
                          key: 'csv',
                          name: 'CSV',
                          ext: '.csv',
                          desc: 'Table for Excel, Sheets, & BI tools',
                        },
                        {
                          key: 'txt',
                          name: 'Text Report',
                          ext: '.txt',
                          desc: 'Human-readable formatted event stream',
                        },
                      ] as const
                    ).map(item => {
                      const isActive = format === item.key;
                      return (
                        <TouchableScale
                          key={item.key}
                          onPress={() => setFormat(item.key)}
                          style={[
                            styles.formatCardInline,
                            isActive && styles.formatCardInlineActive,
                          ]}>
                          <View style={styles.formatCardInlineHeader}>
                            <View
                              style={[
                                styles.radioCircle,
                                isActive && styles.radioCircleActive,
                              ]}>
                              {isActive && <View style={styles.radioDot} />}
                            </View>
                            <Text
                              style={[
                                styles.formatCardInlineTitle,
                                isActive && styles.formatCardInlineTitleActive,
                              ]}>
                              {item.name}
                            </Text>
                          </View>
                          <Text style={styles.formatCardInlineDesc}>
                            {item.desc}
                          </Text>
                        </TouchableScale>
                      );
                    })}
                  </View>
                </View>

                {/* Content Option Toggles */}
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>
                    {t('analytics.contentOptions', 'CONTENT INCLUSION')}
                  </Text>
                  <View style={styles.togglesCard}>
                    <Pressable
                      style={styles.toggleRow}
                      onPress={() => setIncludeParameters(v => !v)}>
                      <View style={styles.toggleLeft}>
                        <View
                          style={[
                            styles.checkbox,
                            includeParameters && styles.checkboxActive,
                          ]}>
                          {includeParameters && (
                            <CheckIcon size={11} color={AppColors.white} />
                          )}
                        </View>
                        <Text style={styles.toggleTitle}>
                          {t('analytics.includeParameters', 'Event Parameters & Attributes')}
                        </Text>
                      </View>
                    </Pressable>

                    <Pressable
                      style={styles.toggleRow}
                      onPress={() => setIncludeScreen(v => !v)}>
                      <View style={styles.toggleLeft}>
                        <View
                          style={[
                            styles.checkbox,
                            includeScreen && styles.checkboxActive,
                          ]}>
                          {includeScreen && (
                            <CheckIcon size={11} color={AppColors.white} />
                          )}
                        </View>
                        <Text style={styles.toggleTitle}>
                          {t('analytics.includeScreen', 'Screen Names & Classes')}
                        </Text>
                      </View>
                    </Pressable>

                    <Pressable
                      style={styles.toggleRow}
                      onPress={() => setIncludeTimestamps(v => !v)}>
                      <View style={styles.toggleLeft}>
                        <View
                          style={[
                            styles.checkbox,
                            includeTimestamps && styles.checkboxActive,
                          ]}>
                          {includeTimestamps && (
                            <CheckIcon size={11} color={AppColors.white} />
                          )}
                        </View>
                        <Text style={styles.toggleTitle}>
                          {t('analytics.includeTimestamps', 'Timestamps & Formatted Time')}
                        </Text>
                      </View>
                    </Pressable>

                    <Pressable
                      style={styles.toggleRow}
                      onPress={() => setIncludeCategory(v => !v)}>
                      <View style={styles.toggleLeft}>
                        <View
                          style={[
                            styles.checkbox,
                            includeCategory && styles.checkboxActive,
                          ]}>
                          {includeCategory && (
                            <CheckIcon size={11} color={AppColors.white} />
                          )}
                        </View>
                        <Text style={styles.toggleTitle}>
                          {t('analytics.includeCategory', 'Event Category Tagging')}
                        </Text>
                      </View>
                    </Pressable>

                    <Pressable
                      style={styles.toggleRow}
                      onPress={() => setIncludeUserProps(v => !v)}>
                      <View style={styles.toggleLeft}>
                        <View
                          style={[
                            styles.checkbox,
                            includeUserProps && styles.checkboxActive,
                          ]}>
                          {includeUserProps && (
                            <CheckIcon size={11} color={AppColors.white} />
                          )}
                        </View>
                        <Text style={styles.toggleTitle}>
                          {t('analytics.includeUserProps', 'User ID & User Properties')}
                        </Text>
                      </View>
                    </Pressable>
                  </View>
                </View>

                {/* Range & Pattern Filter */}
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>
                    {t('analytics.rangeAndFilter', 'RANGE & EXCLUSIONS')}
                  </Text>
                  <View style={styles.rangeBox}>
                    <View style={styles.rangeToggleRow}>
                      <TouchableScale
                        onPress={() => setRangeMode('all')}
                        style={[
                          styles.rangeBtn,
                          rangeMode === 'all' && styles.rangeBtnActive,
                        ]}>
                        <Text
                          style={[
                            styles.rangeBtnText,
                            rangeMode === 'all' && styles.rangeBtnTextActive,
                          ]}>
                          All Events ({selectedEvents.length})
                        </Text>
                      </TouchableScale>
                      <TouchableScale
                        onPress={() => setRangeMode('custom')}
                        style={[
                          styles.rangeBtn,
                          rangeMode === 'custom' && styles.rangeBtnActive,
                        ]}>
                        <Text
                          style={[
                            styles.rangeBtnText,
                            rangeMode === 'custom' && styles.rangeBtnTextActive,
                          ]}>
                          Custom Limit
                        </Text>
                      </TouchableScale>
                    </View>

                    {rangeMode === 'custom' && (
                      <View style={styles.customCountRow}>
                        <Text style={styles.customCountLabel}>
                          Max Events:
                        </Text>
                        <TextInput
                          value={customCount}
                          onChangeText={setCustomCount}
                          keyboardType="number-pad"
                          style={styles.customCountInput}
                        />
                      </View>
                    )}

                    <View style={styles.regexFieldBlock}>
                      <View style={styles.regexLabelRow}>
                        <Text style={styles.regexHelpText}>
                          Exclude events matching pattern (Regex):
                        </Text>
                      </View>
                      <TextInput
                        value={ignorePattern}
                        onChangeText={setIgnorePattern}
                        placeholder="e.g. heartbeat|ping|nav_debug"
                        placeholderTextColor={AppColors.grayTextWeak}
                        style={[
                          styles.regexInput,
                          !regexValidation.isValid && styles.regexInputError,
                        ]}
                        autoCapitalize="none"
                        autoCorrect={false}
                      />
                    </View>
                  </View>
                </View>
              </ScrollView>

              {/* Bottom Sticky Action Bar */}
              <View style={styles.footerBar}>
                <View style={styles.footerSummary}>
                  <Text style={styles.summaryTitle}>
                    {selectedEvents.length} events • {format.toUpperCase()}
                  </Text>
                  <Text style={styles.summarySize}>
                    Est. ~{formatSize(estimatedBytes)}
                  </Text>
                </View>

                <TouchableScale
                  onPress={handleStartExport}
                  disabled={selectedEvents.length === 0}
                  style={[
                    styles.primaryActionBtn,
                    selectedEvents.length === 0 && styles.primaryActionBtnDisabled,
                  ]}>
                  <ExportIcon size={16} color={AppColors.white} />
                  <Text style={styles.primaryActionBtnText}>
                    {t('analytics.exportAction', 'Export Events')}
                  </Text>
                </TouchableScale>
              </View>
            </>
          )}

          {/* Progress Stage */}
          {stage === 'progress' && (
            <View style={styles.progressContainer}>
              <View style={styles.progressIconBadge}>
                <ExportIcon size={30} color={AppColors.purple} />
              </View>
              <Text style={styles.progressTitle}>
                {t('analytics.exportingTitle', 'Generating Analytics Export...')}
              </Text>
              <Text style={styles.progressSubtitle}>
                Compiling {selectedEvents.length} events into {format.toUpperCase()} format
              </Text>

              <View style={styles.progressBarWrapper}>
                <Animated.View
                  style={[
                    styles.progressBarFill,
                    {
                      width: progressAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0%', '100%'],
                      }),
                    },
                  ]}
                />
              </View>
              <Text style={styles.progressPercentText}>{progressPercent}%</Text>
            </View>
          )}

          {/* Complete Stage */}
          {stage === 'complete' && (
            <View style={styles.completeContainer}>
              <View style={styles.completeIconBadge}>
                <CircleCheckIcon size={34} color={AppColors.successGreen} />
              </View>
              <Text style={styles.completeTitle}>
                {t('analytics.exportSuccessTitle', 'Export Ready!')}
              </Text>
              <Text style={styles.completeSubtitle}>
                {exportedFilename} • {formatSize(finalSizeInBytes)}
              </Text>

              {/* Preview Snippet */}
              <View style={styles.previewBox}>
                <Text style={styles.previewLabel}>PREVIEW (FIRST LINES):</Text>
                <ScrollView
                  style={styles.previewScroll}
                  nestedScrollEnabled
                  showsVerticalScrollIndicator={false}>
                  <Text style={styles.previewCode} numberOfLines={12}>
                    {exportedContent.substring(0, 800)}
                    {exportedContent.length > 800 ? '...' : ''}
                  </Text>
                </ScrollView>
              </View>

              {/* Action Buttons */}
              <View style={styles.actionButtonGroup}>
                <TouchableScale
                  style={[styles.actionBtn, styles.shareBtn]}
                  onPress={handleShare}>
                  <ShareIcon size={16} color={AppColors.white} />
                  <Text style={styles.actionBtnText}>
                    {t('common.share', 'Share File')}
                  </Text>
                </TouchableScale>

                <TouchableScale
                  style={[styles.actionBtn, styles.saveDiskBtn]}
                  onPress={handleSaveToDisk}>
                  <SaveIcon size={16} color={AppColors.white} />
                  <Text style={styles.actionBtnText}>
                    {t('common.saveToDisk', 'Save to Files')}
                  </Text>
                </TouchableScale>

                <TouchableScale
                  style={[styles.actionBtn, styles.copyBtn]}
                  onPress={handleCopy}>
                  <CopyIcon size={16} color={AppColors.purple} />
                  <Text style={[styles.actionBtnText, {color: AppColors.purple}]}>
                    {t('common.copy', 'Copy All')}
                  </Text>
                </TouchableScale>
              </View>

              <TouchableScale
                style={styles.doneBtn}
                onPress={onClose}>
                <Text style={styles.doneBtnText}>
                  {t('common.done', 'Done')}
                </Text>
              </TouchableScale>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  bottomSheetCard: {
    backgroundColor: AppColors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -4},
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 16,
  },
  sheetHandleContainer: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 4,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: AppColors.dividerColor,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.dividerColor,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  iconBadge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: `${AppColors.purple}14`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextGroup: {
    flex: 1,
  },
  title: {
    fontFamily: AppFonts.interBold,
    fontSize: 16,
    color: AppColors.primaryBlack,
  },
  subtitle: {
    fontFamily: AppFonts.interRegular,
    fontSize: 11.5,
    color: AppColors.grayTextStrong,
    marginTop: 1,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: AppColors.grayBackground,
    justifyContent: 'center',
    alignItems: 'center',
  },
  configContainer: {
    padding: 16,
    gap: 16,
  },
  section: {
    gap: 8,
  },
  sectionLabel: {
    fontFamily: AppFonts.interBold,
    fontSize: 10.5,
    color: AppColors.grayTextWeak,
    letterSpacing: 0.8,
  },
  scopeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  scopeCard: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    backgroundColor: AppColors.grayBackground,
    borderWidth: 1,
    borderColor: AppColors.dividerColor,
    gap: 6,
  },
  scopeCardActive: {
    backgroundColor: `${AppColors.purple}0C`,
    borderColor: AppColors.purple,
  },
  scopeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  scopeTitle: {
    fontFamily: AppFonts.interSemiBold,
    fontSize: 12.5,
    color: AppColors.grayTextStrong,
  },
  scopeTitleActive: {
    color: AppColors.purple,
    fontFamily: AppFonts.interBold,
  },
  scopeCount: {
    fontFamily: AppFonts.interRegular,
    fontSize: 11,
    color: AppColors.grayTextWeak,
    paddingLeft: 20,
  },
  radioCircle: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: AppColors.grayTextWeak,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioCircleActive: {
    borderColor: AppColors.purple,
  },
  radioDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: AppColors.purple,
  },
  categoryPillsRow: {
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 2,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: AppColors.grayBackground,
    borderWidth: 1,
    borderColor: AppColors.dividerColor,
  },
  categoryPillActive: {
    backgroundColor: AppColors.purple,
    borderColor: AppColors.purple,
  },
  categoryPillText: {
    fontFamily: AppFonts.interMedium,
    fontSize: 11.5,
    color: AppColors.grayTextStrong,
  },
  categoryPillTextActive: {
    color: AppColors.white,
    fontFamily: AppFonts.interSemiBold,
  },
  formatRowInline: {
    flexDirection: 'row',
    gap: 8,
  },
  formatCardInline: {
    flex: 1,
    padding: 10,
    borderRadius: 10,
    backgroundColor: AppColors.grayBackground,
    borderWidth: 1,
    borderColor: AppColors.dividerColor,
    gap: 4,
  },
  formatCardInlineActive: {
    backgroundColor: `${AppColors.purple}0C`,
    borderColor: AppColors.purple,
  },
  formatCardInlineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  formatCardInlineTitle: {
    fontFamily: AppFonts.interBold,
    fontSize: 12.5,
    color: AppColors.grayTextStrong,
  },
  formatCardInlineTitleActive: {
    color: AppColors.purple,
  },
  formatCardInlineDesc: {
    fontFamily: AppFonts.interRegular,
    fontSize: 10,
    lineHeight: 13,
    color: AppColors.grayTextWeak,
    paddingLeft: 20,
  },
  togglesCard: {
    borderRadius: 10,
    backgroundColor: AppColors.grayBackground,
    borderWidth: 1,
    borderColor: AppColors.dividerColor,
    paddingHorizontal: 12,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.dividerColor,
  },
  toggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: AppColors.grayTextWeak,
    backgroundColor: AppColors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxActive: {
    backgroundColor: AppColors.purple,
    borderColor: AppColors.purple,
  },
  toggleTitle: {
    fontFamily: AppFonts.interMedium,
    fontSize: 12,
    color: AppColors.primaryBlack,
  },
  rangeBox: {
    padding: 12,
    borderRadius: 10,
    backgroundColor: AppColors.grayBackground,
    borderWidth: 1,
    borderColor: AppColors.dividerColor,
    gap: 10,
  },
  rangeToggleRow: {
    flexDirection: 'row',
    gap: 8,
  },
  rangeBtn: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 7,
    backgroundColor: AppColors.white,
    borderWidth: 1,
    borderColor: AppColors.dividerColor,
    alignItems: 'center',
  },
  rangeBtnActive: {
    backgroundColor: `${AppColors.purple}14`,
    borderColor: AppColors.purple,
  },
  rangeBtnText: {
    fontFamily: AppFonts.interMedium,
    fontSize: 11.5,
    color: AppColors.grayTextStrong,
  },
  rangeBtnTextActive: {
    color: AppColors.purple,
    fontFamily: AppFonts.interBold,
  },
  customCountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  customCountLabel: {
    fontFamily: AppFonts.interMedium,
    fontSize: 12,
    color: AppColors.grayTextStrong,
  },
  customCountInput: {
    width: 80,
    backgroundColor: AppColors.white,
    borderWidth: 1,
    borderColor: AppColors.dividerColor,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 12,
    fontFamily: AppFonts.interSemiBold,
    textAlign: 'center',
  },
  regexFieldBlock: {
    gap: 4,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: AppColors.dividerColor,
  },
  regexLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  regexHelpText: {
    fontFamily: AppFonts.interRegular,
    fontSize: 10.5,
    color: AppColors.grayTextWeak,
  },
  regexInput: {
    backgroundColor: AppColors.white,
    borderWidth: 1,
    borderColor: AppColors.dividerColor,
    borderRadius: 7,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 12,
    fontFamily: AppFonts.interRegular,
    color: AppColors.primaryBlack,
  },
  regexInputError: {
    borderColor: AppColors.errorColor,
    backgroundColor: `${AppColors.errorColor}08`,
  },
  footerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: AppColors.dividerColor,
    backgroundColor: AppColors.white,
  },
  footerSummary: {
    flex: 1,
  },
  summaryTitle: {
    fontFamily: AppFonts.interBold,
    fontSize: 12.5,
    color: AppColors.primaryBlack,
  },
  summarySize: {
    fontFamily: AppFonts.interRegular,
    fontSize: 11,
    color: AppColors.grayTextWeak,
  },
  primaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: AppColors.purple,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    shadowColor: AppColors.purple,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryActionBtnDisabled: {
    opacity: 0.5,
  },
  primaryActionBtnText: {
    fontFamily: AppFonts.interBold,
    fontSize: 13,
    color: AppColors.white,
  },
  progressContainer: {
    alignItems: 'center',
    padding: 36,
    gap: 12,
  },
  progressIconBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: `${AppColors.purple}14`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  progressTitle: {
    fontFamily: AppFonts.interBold,
    fontSize: 16,
    color: AppColors.primaryBlack,
  },
  progressSubtitle: {
    fontFamily: AppFonts.interRegular,
    fontSize: 12,
    color: AppColors.grayTextWeak,
  },
  progressBarWrapper: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    backgroundColor: AppColors.grayBackground,
    overflow: 'hidden',
    marginTop: 10,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: AppColors.purple,
    borderRadius: 4,
  },
  progressPercentText: {
    fontFamily: AppFonts.interSemiBold,
    fontSize: 12,
    color: AppColors.purple,
  },
  completeContainer: {
    alignItems: 'center',
    padding: 20,
    gap: 12,
  },
  completeIconBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: `${AppColors.successGreen}14`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  completeTitle: {
    fontFamily: AppFonts.interBold,
    fontSize: 17,
    color: AppColors.primaryBlack,
  },
  completeSubtitle: {
    fontFamily: AppFonts.interRegular,
    fontSize: 12,
    color: AppColors.grayTextWeak,
  },
  previewBox: {
    width: '100%',
    backgroundColor: AppColors.grayBackground,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: AppColors.dividerColor,
    padding: 10,
    maxHeight: 140,
    gap: 6,
  },
  previewLabel: {
    fontFamily: AppFonts.interBold,
    fontSize: 9.5,
    color: AppColors.grayTextWeak,
    letterSpacing: 0.6,
  },
  previewScroll: {
    maxHeight: 110,
  },
  previewCode: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 10,
    lineHeight: 14,
    color: AppColors.grayTextStrong,
  },
  actionButtonGroup: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
    marginTop: 4,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  shareBtn: {
    backgroundColor: AppColors.purple,
  },
  saveDiskBtn: {
    backgroundColor: AppColors.emerald500,
  },
  copyBtn: {
    backgroundColor: `${AppColors.purple}14`,
    borderWidth: 1,
    borderColor: `${AppColors.purple}30`,
  },
  actionBtnText: {
    fontFamily: AppFonts.interSemiBold,
    fontSize: 12,
    color: AppColors.white,
  },
  doneBtn: {
    paddingVertical: 10,
    paddingHorizontal: 28,
    borderRadius: 8,
    backgroundColor: AppColors.grayBackground,
    marginTop: 4,
  },
  doneBtnText: {
    fontFamily: AppFonts.interSemiBold,
    fontSize: 13,
    color: AppColors.grayTextStrong,
  },
});

export default AnalyticsExportModal;
