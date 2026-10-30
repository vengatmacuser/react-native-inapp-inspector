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
  DatabaseIcon,
  LayersIcon,
  CheckIcon,
} from '../NetworkIcons';
import {
  triggerNativeHaptic,
  writeNativeExportFile,
  shareNativeFile,
} from '../../native/NativeInspector';
import {copyToClipboard, showToast} from '../../helpers';
import {
  formatStorageEntriesExport,
  estimateStorageExportSize,
  generateStorageFilename,
  StorageExportFormat,
  StorageExportOptions,
} from '../../helpers/shareFormatter';
import {useTranslation} from '../../i18n';
import type {StorageEntry, StorageDriver} from '../../customHooks/storageInspector';

export interface StorageExportModalProps {
  visible: boolean;
  onClose: () => void;
  driver: StorageDriver;
  instanceId?: string;
  entries: StorageEntry[];
  filteredEntries: StorageEntry[];
}

type ExportStage = 'config' | 'progress' | 'complete';
type ScopeType = 'filtered' | 'all';
type RangeMode = 'all' | 'custom';

export const StorageExportModal: React.FC<StorageExportModalProps> = ({
  visible,
  onClose,
  driver,
  instanceId,
  entries,
  filteredEntries,
}) => {
  const {t} = useTranslation();

  const [stage, setStage] = useState<ExportStage>('config');
  const [scope, setScope] = useState<ScopeType>('filtered');
  const [rangeMode, setRangeMode] = useState<RangeMode>('all');
  const [customCount, setCustomCount] = useState<string>('50');
  const [ignorePattern, setIgnorePattern] = useState<string>('');
  const [format, setFormat] = useState<StorageExportFormat>('json');

  // Content option toggles
  const [formatJsonValues, setFormatJsonValues] = useState<boolean>(true);
  const [includeMetadata, setIncludeMetadata] = useState<boolean>(true);
  const [includeDriverInfo, setIncludeDriverInfo] = useState<boolean>(true);

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

  const driverLabel = useMemo(() => {
    if (driver === 'asyncStorage') return 'AsyncStorage';
    return `MMKV (${instanceId || 'default'})`;
  }, [driver, instanceId]);

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

  const exportOptions: StorageExportOptions = useMemo(
    () => ({
      formatJsonValues,
      includeMetadata,
      includeDriverInfo,
      ignorePattern:
        rangeMode === 'custom' && regexValidation.isValid
          ? ignorePattern.trim()
          : undefined,
    }),
    [
      formatJsonValues,
      includeMetadata,
      includeDriverInfo,
      rangeMode,
      regexValidation,
      ignorePattern,
    ],
  );

  // Target entries based on scope and range
  const selectedEntries = useMemo(() => {
    let pool = scope === 'filtered' ? filteredEntries : entries;

    if (rangeMode === 'custom') {
      const count = parseInt(customCount, 10);
      if (!isNaN(count) && count > 0) {
        pool = pool.slice(0, count);
      }
    }

    return pool;
  }, [scope, filteredEntries, entries, rangeMode, customCount]);

  // Live estimated byte size before export
  const estimatedBytes = useMemo(() => {
    return estimateStorageExportSize(
      selectedEntries,
      format,
      exportOptions,
      driverLabel,
    );
  }, [selectedEntries, format, exportOptions, driverLabel]);

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleStartExport = useCallback(() => {
    if (selectedEntries.length === 0) {
      showToast(t('storage.noEntriesToExport', 'No storage entries available to export'));
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
          const content = formatStorageEntriesExport(
            selectedEntries,
            format,
            exportOptions,
            driverLabel,
          );
          const filename = generateStorageFilename(
            driver === 'asyncStorage' ? 'async_storage' : `mmkv_${instanceId || 'default'}`,
            format,
          );

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
  }, [selectedEntries, format, exportOptions, driverLabel, driver, instanceId, progressAnim, t]);

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
          showToast(t('storage.savePromptOpened', 'Opened save to disk dialog'));
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
      showToast(t('storage.savePromptOpened', 'Opened save to disk dialog'));
    } catch (err: any) {
      if (err?.message !== 'User did not share') {
        showToast(err?.message || 'Save error');
      }
    }
  }, [exportedContent, exportedFilename, format, t]);

  const handleCopy = useCallback(() => {
    if (!exportedContent) return;
    triggerNativeHaptic('light');
    copyToClipboard(exportedContent, `${driverLabel} Entries`);
    showToast(t('storage.copiedEntries', 'Storage entries copied to clipboard!'));
  }, [exportedContent, driverLabel, t]);

  const hasFilterDifference = filteredEntries.length !== entries.length;

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
              <View
                style={[
                  styles.iconBadge,
                  {
                    backgroundColor:
                      driver === 'asyncStorage'
                        ? `${AppColors.brandPurple}18`
                        : `${AppColors.teal600}18`,
                  },
                ]}>
                {driver === 'asyncStorage' ? (
                  <DatabaseIcon size={18} color={AppColors.brandPurple} />
                ) : (
                  <LayersIcon size={18} color={AppColors.teal600} />
                )}
              </View>
              <View style={styles.headerTextGroup}>
                <Text style={styles.title}>
                  {t('storage.exportTitle', 'Export Storage Entries')}
                </Text>
                <Text style={styles.subtitle}>
                  {stage === 'config'
                    ? `${selectedEntries.length} keys ready from ${driverLabel}`
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
                {/* Active Driver Badge */}
                <View style={styles.driverInfoBanner}>
                  <Text style={styles.driverInfoBannerLabel}>
                    TARGET DRIVER:
                  </Text>
                  <View style={styles.driverInfoBannerBadge}>
                    <Text style={styles.driverInfoBannerBadgeText}>
                      {driverLabel}
                    </Text>
                  </View>
                </View>

                {/* Scope Selector */}
                {hasFilterDifference && (
                  <View style={styles.section}>
                    <Text style={styles.sectionLabel}>
                      {t('storage.exportScope', 'KEY SCOPE')}
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
                            {t('storage.filteredKeys', 'Matching Search')}
                          </Text>
                        </View>
                        <Text style={styles.scopeCount}>
                          {filteredEntries.length} {t('storage.keys', 'keys')}
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
                            {t('storage.allKeys', 'All Driver Keys')}
                          </Text>
                        </View>
                        <Text style={styles.scopeCount}>
                          {entries.length} {t('storage.keys', 'keys')}
                        </Text>
                      </TouchableScale>
                    </View>
                  </View>
                )}

                {/* Export Format */}
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>
                    {t('storage.exportFormat', 'EXPORT FORMAT')}
                  </Text>
                  <View style={styles.formatRowInline}>
                    {(
                      [
                        {
                          key: 'json',
                          name: 'JSON',
                          desc: 'Full key-value dictionary with metadata',
                        },
                        {
                          key: 'csv',
                          name: 'CSV',
                          desc: 'Key, Type, Size & Value spreadsheet',
                        },
                        {
                          key: 'txt',
                          name: 'Text Report',
                          desc: 'Formatted inspect report for reading',
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
                    {t('storage.contentOptions', 'CONTENT INCLUSION')}
                  </Text>
                  <View style={styles.togglesCard}>
                    <Pressable
                      style={styles.toggleRow}
                      onPress={() => setFormatJsonValues(v => !v)}>
                      <View style={styles.toggleLeft}>
                        <View
                          style={[
                            styles.checkbox,
                            formatJsonValues && styles.checkboxActive,
                          ]}>
                          {formatJsonValues && (
                            <CheckIcon size={11} color={AppColors.white} />
                          )}
                        </View>
                        <Text style={styles.toggleTitle}>
                          {t('storage.formatJsonValues', 'Parse & Format JSON String Values')}
                        </Text>
                      </View>
                    </Pressable>

                    <Pressable
                      style={styles.toggleRow}
                      onPress={() => setIncludeMetadata(v => !v)}>
                      <View style={styles.toggleLeft}>
                        <View
                          style={[
                            styles.checkbox,
                            includeMetadata && styles.checkboxActive,
                          ]}>
                          {includeMetadata && (
                            <CheckIcon size={11} color={AppColors.white} />
                          )}
                        </View>
                        <Text style={styles.toggleTitle}>
                          {t('storage.includeMetadata', 'Include Type & Byte Size Metadata')}
                        </Text>
                      </View>
                    </Pressable>

                    <Pressable
                      style={styles.toggleRow}
                      onPress={() => setIncludeDriverInfo(v => !v)}>
                      <View style={styles.toggleLeft}>
                        <View
                          style={[
                            styles.checkbox,
                            includeDriverInfo && styles.checkboxActive,
                          ]}>
                          {includeDriverInfo && (
                            <CheckIcon size={11} color={AppColors.white} />
                          )}
                        </View>
                        <Text style={styles.toggleTitle}>
                          {t('storage.includeDriverInfo', 'Include Driver Info & Timestamp Headers')}
                        </Text>
                      </View>
                    </Pressable>
                  </View>
                </View>

                {/* Range & Pattern Filter */}
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>
                    {t('storage.rangeAndFilter', 'RANGE & KEY EXCLUSIONS')}
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
                          All Keys ({selectedEntries.length})
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
                          Max Keys:
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
                          Exclude keys matching pattern (Regex):
                        </Text>
                      </View>
                      <TextInput
                        value={ignorePattern}
                        onChangeText={setIgnorePattern}
                        placeholder="e.g. secret|pass|token|cached_image"
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
                    {selectedEntries.length} keys • {format.toUpperCase()}
                  </Text>
                  <Text style={styles.summarySize}>
                    Est. ~{formatSize(estimatedBytes)}
                  </Text>
                </View>

                <TouchableScale
                  onPress={handleStartExport}
                  disabled={selectedEntries.length === 0}
                  style={[
                    styles.primaryActionBtn,
                    selectedEntries.length === 0 && styles.primaryActionBtnDisabled,
                  ]}>
                  <ExportIcon size={16} color={AppColors.white} />
                  <Text style={styles.primaryActionBtnText}>
                    {t('storage.exportAction', 'Export Storage')}
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
                {t('storage.exportingTitle', 'Generating Storage Export...')}
              </Text>
              <Text style={styles.progressSubtitle}>
                Compiling {selectedEntries.length} entries into {format.toUpperCase()} format
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
                {t('storage.exportSuccessTitle', 'Export Ready!')}
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
  driverInfoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: AppColors.grayBackground,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: AppColors.dividerColor,
  },
  driverInfoBannerLabel: {
    fontFamily: AppFonts.interBold,
    fontSize: 10.5,
    color: AppColors.grayTextWeak,
    letterSpacing: 0.6,
  },
  driverInfoBannerBadge: {
    backgroundColor: `${AppColors.purple}14`,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  driverInfoBannerBadgeText: {
    fontFamily: AppFonts.interSemiBold,
    fontSize: 11,
    color: AppColors.purple,
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
    borderRadius: 12,
    borderTopWidth: 2,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 3.5,
    borderTopColor: 'rgba(255, 255, 255, 0.45)',
    borderLeftColor: 'rgba(255, 255, 255, 0.2)',
    borderRightColor: 'rgba(0, 0, 0, 0.1)',
    borderBottomColor: 'rgba(0, 0, 0, 0.28)',
    shadowColor: AppColors.purple,
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.35,
    shadowRadius: 6,
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

export default StorageExportModal;
