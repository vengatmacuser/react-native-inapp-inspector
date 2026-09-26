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
  TerminalIcon,
  CircleCheckIcon,
  InfoCircleIcon,
  WarningTriangleIcon,
  ErrorCircleIcon,
  LayersIcon,
  FilterIcon,
  CheckIcon,
  ZapIcon,
  PenIcon,
} from '../NetworkIcons';
import {
  triggerNativeHaptic,
  writeNativeExportFile,
  shareNativeFile,
} from '../../native/NativeInspector';
import {copyToClipboard, showToast} from '../../helpers';
import {
  formatConsoleLogsExport,
  estimateConsoleLogsExportSize,
  generateConsoleLogsFilename,
  ConsoleLogExportFormat,
  ConsoleLogExportOptions,
} from '../../helpers/shareFormatter';
import {useTranslation} from '../../i18n';
import type {ConsoleLog} from '../../types';

export interface ConsoleExportModalProps {
  visible: boolean;
  onClose: () => void;
  filteredLogs: ConsoleLog[];
  allLogs: ConsoleLog[];
}

type ExportStage = 'config' | 'progress' | 'complete';
type ScopeType = 'filtered' | 'all';
type LevelFilterType = 'all' | 'info' | 'warn' | 'error';
type RangeMode = 'all' | 'custom';

export const ConsoleExportModal: React.FC<ConsoleExportModalProps> = ({
  visible,
  onClose,
  filteredLogs,
  allLogs,
}) => {
  const {t} = useTranslation();

  const [stage, setStage] = useState<ExportStage>('config');
  const [scope, setScope] = useState<ScopeType>('filtered');
  const [levelFilter, setLevelFilter] = useState<LevelFilterType>('info');
  const [rangeMode, setRangeMode] = useState<RangeMode>('all');
  const [customCount, setCustomCount] = useState<string>('50');
  const [ignorePattern, setIgnorePattern] = useState<string>('');
  const [format, setFormat] = useState<ConsoleLogExportFormat>('txt');

  // Content options toggles (selected by default)
  const [includeStackTrace, setIncludeStackTrace] = useState<boolean>(true);
  const [includeArguments, setIncludeArguments] = useState<boolean>(true);
  const [includeCaller, setIncludeCaller] = useState<boolean>(true);
  const [includeTimestamps, setIncludeTimestamps] = useState<boolean>(true);
  const [includeAppInfo, setIncludeAppInfo] = useState<boolean>(true);

  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [processedCount, setProcessedCount] = useState<number>(0);
  const [exportedContent, setExportedContent] = useState<string>('');
  const [exportedFilename, setExportedFilename] = useState<string>('');
  const [finalSizeInBytes, setFinalSizeInBytes] = useState<number>(0);

  const progressAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

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

  const exportOptions: ConsoleLogExportOptions = useMemo(
    () => ({
      includeStackTrace,
      includeArguments,
      includeCaller,
      includeTimestamps,
      includeAppInfo,
      includeDuplicates: false,
      ignorePattern:
        rangeMode === 'custom' && regexValidation.isValid
          ? ignorePattern.trim()
          : undefined,
    }),
    [
      includeStackTrace,
      includeArguments,
      includeCaller,
      includeTimestamps,
      includeAppInfo,
      rangeMode,
      regexValidation.isValid,
      ignorePattern,
    ],
  );

  // Pulse animation during progress stage
  useEffect(() => {
    if (stage === 'progress') {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 600,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      );
      loop.start();
      return () => loop.stop();
    }
  }, [stage, pulseAnim]);

  // Reset modal state when opened
  useEffect(() => {
    if (visible) {
      setStage('config');
      setRangeMode('all');
      setLevelFilter('info');
      setFormat('txt');
      setCustomCount('50');
      setIgnorePattern('');
      setIncludeStackTrace(false);
      setIncludeArguments(false);
      setIncludeCaller(false);
      setIncludeTimestamps(false);
      setIncludeAppInfo(false);
      setProgressPercent(0);
      setProcessedCount(0);
      setExportedContent('');
      setExportedFilename('');
      setFinalSizeInBytes(0);
      progressAnim.setValue(0);
    }
  }, [visible, progressAnim]);

  // Available logs pool based on scope
  const targetLogsPool = useMemo(() => {
    return scope === 'filtered' ? filteredLogs : allLogs;
  }, [scope, filteredLogs, allLogs]);

  // Filter logs by selected log level (All, Info/Log, Warn, Error)
  const levelFilteredLogs = useMemo(() => {
    if (levelFilter === 'all') return targetLogsPool;
    return targetLogsPool.filter(l => {
      if (levelFilter === 'info') {
        return (
          l.type === 'info' ||
          l.sourceMethod === 'log' ||
          l.sourceMethod === 'info'
        );
      }
      if (levelFilter === 'warn') {
        return l.type === 'warn';
      }
      if (levelFilter === 'error') {
        return l.type === 'error';
      }
      return true;
    });
  }, [targetLogsPool, levelFilter]);

  // Level counts for badges
  const levelCounts = useMemo(() => {
    let info = 0;
    let warn = 0;
    let error = 0;
    targetLogsPool.forEach(l => {
      if (l.type === 'error') error++;
      else if (l.type === 'warn') warn++;
      else info++;
    });
    return {all: targetLogsPool.length, info, warn, error};
  }, [targetLogsPool]);

  // Target logs to export based on rangeMode, count, and ignore regex pattern
  const {selectedLogs, ignoredCount} = useMemo(() => {
    const total = levelFilteredLogs.length;
    if (total === 0) return {selectedLogs: [] as ConsoleLog[], ignoredCount: 0};

    let pool = levelFilteredLogs;
    let ignored = 0;

    // Apply regex ignore pattern if in custom mode
    if (rangeMode === 'custom' && regexValidation.regex) {
      const reg = regexValidation.regex;
      const beforeCount = pool.length;
      pool = pool.filter(l => {
        const msg = l.message || '';
        const argsStr = l.rawArgs ? JSON.stringify(l.rawArgs) : '';
        const callerStr = l.caller || '';
        return !reg.test(msg) && !reg.test(argsStr) && !reg.test(callerStr);
      });
      ignored = beforeCount - pool.length;
    }

    let count = pool.length;
    if (rangeMode === 'all') {
      count = pool.length;
    } else if (rangeMode === 'custom') {
      const parsed = parseInt(customCount, 10);
      count =
        isNaN(parsed) || parsed <= 0 ? pool.length : Math.min(parsed, pool.length);
    }

    return {
      selectedLogs: pool.slice(-count),
      ignoredCount: ignored,
    };
  }, [levelFilteredLogs, rangeMode, customCount, regexValidation.regex]);

  // Live estimated byte size before export
  const estimatedBytes = useMemo(() => {
    return estimateConsoleLogsExportSize(selectedLogs, format, exportOptions);
  }, [selectedLogs, format, exportOptions]);

  // Size display formatter: below 1 MB -> KB (e.g. 450 KB), >= 1 MB -> MB (e.g. 1.25 MB)
  const formatEstimatedSize = (bytes: number): string => {
    if (bytes <= 0) return '0 KB';
    if (bytes < 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleStartExport = useCallback(() => {
    if (selectedLogs.length === 0) {
      showToast(t('console.noLogsToExport', 'No logs available to export'));
      return;
    }

    triggerNativeHaptic('medium');
    setStage('progress');
    setProgressPercent(0);
    setProcessedCount(0);
    progressAnim.setValue(0);

    const total = selectedLogs.length;
    const chunkSize = Math.max(1, Math.floor(total / 10));
    let currentIdx = 0;

    const interval = setInterval(() => {
      currentIdx = Math.min(currentIdx + chunkSize, total);
      const ratio = currentIdx / total;
      setProgressPercent(Math.round(ratio * 100));
      setProcessedCount(currentIdx);

      Animated.timing(progressAnim, {
        toValue: ratio,
        duration: 120,
        easing: Easing.linear,
        useNativeDriver: false,
      }).start();

      if (currentIdx >= total) {
        clearInterval(interval);
        setTimeout(() => {
          const content = formatConsoleLogsExport(
            selectedLogs,
            format,
            exportOptions,
          );
          const filename = generateConsoleLogsFilename(format);

          setExportedContent(content);
          setExportedFilename(filename);
          setFinalSizeInBytes(content.length);
          setStage('complete');
          triggerNativeHaptic('heavy');
        }, 180);
      }
    }, 45);
  }, [selectedLogs, format, exportOptions, progressAnim, t]);

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
          format === 'log' ? 'text/plain' : 'text/plain',
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
          format === 'log' ? 'text/plain' : 'text/plain',
          `Save ${exportedFilename}`,
        );
        if (shared) {
          showToast(t('console.savePromptOpened', 'Opened save to disk dialog'));
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
      showToast(t('console.savePromptOpened', 'Opened save to disk dialog'));
    } catch (err: any) {
      if (err?.message !== 'User did not share') {
        showToast(err?.message || 'Save error');
      }
    }
  }, [exportedContent, exportedFilename, format, t]);

  const handleCopy = useCallback(() => {
    if (!exportedContent) return;
    triggerNativeHaptic('light');
    copyToClipboard(exportedContent, 'Console Logs');
    showToast(t('console.copiedLogs', 'Logs copied to clipboard!'));
  }, [exportedContent, t]);

  const hasFilterDifference = filteredLogs.length !== allLogs.length;

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

          {/* Sticky Header with Glowing Shadow */}
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <View style={styles.iconBadge}>
                <ExportIcon size={18} color={AppColors.purple} />
              </View>
              <View style={styles.headerTextGroup}>
                <Text style={styles.title}>
                  {t('console.exportTitle', 'Export Console Logs')}
                </Text>
                <Text style={styles.subtitle}>
                  {stage === 'config'
                    ? `${selectedLogs.length} logs ready for export`
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
                {/* Scope Selector (Only if active filter is applied) */}
                {hasFilterDifference && (
                  <View style={styles.section}>
                    <Text style={styles.sectionLabel}>
                      {t('console.exportScope', 'LOG SOURCE SCOPE')}
                    </Text>
                    <View style={styles.segmentedRow}>
                      <TouchableScale
                        onPress={() => {
                          triggerNativeHaptic('light');
                          setScope('filtered');
                        }}
                        style={[
                          styles.segmentBtn,
                          scope === 'filtered' && styles.segmentBtnActive,
                        ]}>
                        <FilterIcon
                          size={13}
                          color={
                            scope === 'filtered'
                              ? AppColors.purple
                              : AppColors.grayTextWeak
                          }
                        />
                        <Text
                          style={[
                            styles.segmentBtnText,
                            scope === 'filtered' && styles.segmentBtnTextActive,
                          ]}>
                          {t('console.filteredView', 'Active Filter')} (
                          {filteredLogs.length})
                        </Text>
                      </TouchableScale>

                      <TouchableScale
                        onPress={() => {
                          triggerNativeHaptic('light');
                          setScope('all');
                        }}
                        style={[
                          styles.segmentBtn,
                          scope === 'all' && styles.segmentBtnActive,
                        ]}>
                        <LayersIcon
                          size={13}
                          color={
                            scope === 'all'
                              ? AppColors.purple
                              : AppColors.grayTextWeak
                          }
                        />
                        <Text
                          style={[
                            styles.segmentBtnText,
                            scope === 'all' && styles.segmentBtnTextActive,
                          ]}>
                          {t('console.allLogsScope', 'All Logs')} ({allLogs.length})
                        </Text>
                      </TouchableScale>
                    </View>
                  </View>
                )}

                {/* Log Level / Severity Filter */}
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>LOG LEVEL FILTER</Text>
                  <View style={styles.levelRow}>
                    {[
                      {
                        id: 'all',
                        label: 'All',
                        count: levelCounts.all,
                        color: AppColors.purple,
                        Icon: LayersIcon,
                      },
                      {
                        id: 'info',
                        label: 'Info / Log',
                        count: levelCounts.info,
                        color: AppColors.sky600,
                        Icon: InfoCircleIcon,
                      },
                      {
                        id: 'warn',
                        label: 'Warn',
                        count: levelCounts.warn,
                        color: AppColors.amber600,
                        Icon: WarningTriangleIcon,
                      },
                      {
                        id: 'error',
                        label: 'Error',
                        count: levelCounts.error,
                        color: AppColors.errorColor,
                        Icon: ErrorCircleIcon,
                      },
                    ].map(item => {
                      const isSelected = levelFilter === item.id;
                      const IconComp = item.Icon;
                      return (
                        <TouchableScale
                          key={item.id}
                          onPress={() => {
                            triggerNativeHaptic('light');
                            setLevelFilter(item.id as LevelFilterType);
                          }}
                          style={[
                            styles.levelChip,
                            isSelected && {
                              backgroundColor: `${item.color}15`,
                              borderColor: item.color,
                            },
                          ]}>
                          <IconComp
                            size={11}
                            color={
                              isSelected ? item.color : AppColors.grayTextWeak
                            }
                          />
                          <Text
                            style={[
                              styles.levelChipText,
                              isSelected && {
                                color: item.color,
                                fontFamily: AppFonts.interBold,
                              },
                            ]}>
                            {item.label}
                          </Text>
                          <View
                            style={[
                              styles.levelCountBadge,
                              isSelected && {
                                backgroundColor: `${item.color}25`,
                              },
                            ]}>
                            <Text
                              style={[
                                styles.levelCountText,
                                isSelected && {color: item.color},
                              ]}>
                              {item.count}
                            </Text>
                          </View>
                        </TouchableScale>
                      );
                    })}
                  </View>
                </View>

                {/* Range Selection Mode */}
                <View style={styles.section}>
                  <View style={styles.sectionHeaderRow}>
                    <Text style={styles.sectionLabel}>LOGS COUNT RANGE</Text>
                    <View style={styles.countPill}>
                      <Text style={styles.countPillText}>
                        Matched: {levelFilteredLogs.length}
                      </Text>
                    </View>
                  </View>

                  {/* Primary Mode Selector: All Logs | Custom */}
                  <View style={styles.segmentedRow}>
                    <TouchableScale
                      onPress={() => {
                        triggerNativeHaptic('light');
                        setRangeMode('all');
                      }}
                      style={[
                        styles.segmentBtn,
                        rangeMode === 'all' && styles.segmentBtnActive,
                      ]}>
                      <ZapIcon
                        size={13}
                        color={
                          rangeMode === 'all'
                            ? AppColors.purple
                            : AppColors.grayTextStrong
                        }
                      />
                      <Text
                        style={[
                          styles.segmentBtnText,
                          rangeMode === 'all' && styles.segmentBtnTextActive,
                        ]}>
                        All ({levelFilteredLogs.length})
                      </Text>
                    </TouchableScale>

                    <TouchableScale
                      onPress={() => {
                        triggerNativeHaptic('light');
                        setRangeMode('custom');
                      }}
                      style={[
                        styles.segmentBtn,
                        rangeMode === 'custom' && styles.segmentBtnActive,
                      ]}>
                      <PenIcon
                        size={12}
                        color={
                          rangeMode === 'custom'
                            ? AppColors.purple
                            : AppColors.grayTextStrong
                        }
                      />
                      <Text
                        style={[
                          styles.segmentBtnText,
                          rangeMode === 'custom' && styles.segmentBtnTextActive,
                        ]}>
                        Custom
                      </Text>
                    </TouchableScale>
                  </View>

                  {/* Sub-view when Custom is selected */}
                  {rangeMode === 'custom' && (
                    <View style={styles.customOptionsContainer}>
                      {/* 1. Custom Count */}
                      <View style={styles.customFieldRow}>
                        <Text style={styles.customFieldLabel}>
                          {t('console.enterCount', 'Enter number of logs:')}
                        </Text>
                        <TextInput
                          keyboardType="number-pad"
                          value={customCount}
                          onChangeText={setCustomCount}
                          style={styles.customCountInput}
                          placeholder="e.g. 50"
                          placeholderTextColor={AppColors.slate400}
                        />
                      </View>

                      {/* 2. Ignore Patterns (Regex) */}
                      <View style={styles.regexFieldBlock}>
                        <View style={styles.regexLabelRow}>
                          <Text style={styles.customFieldLabel}>
                            {t(
                              'console.ignorePatterns',
                              'Ignore Patterns (Regex):',
                            )}
                          </Text>
                          {regexValidation.isValid && ignoredCount > 0 && (
                            <View style={styles.regexExclusionBadge}>
                              <Text style={styles.regexExclusionBadgeText}>
                                -{ignoredCount} excluded
                              </Text>
                            </View>
                          )}
                        </View>

                        <TextInput
                          autoCapitalize="none"
                          autoCorrect={false}
                          value={ignorePattern}
                          onChangeText={setIgnorePattern}
                          style={[
                            styles.regexInput,
                            !regexValidation.isValid && styles.regexInputError,
                          ]}
                          placeholder="e.g. ^\[DEBUG\]|analytics|token=.*"
                          placeholderTextColor={AppColors.slate400}
                        />

                        {!regexValidation.isValid ? (
                          <Text style={styles.regexErrorText}>
                            ⚠️{' '}
                            {t(
                              'console.invalidRegex',
                              'Invalid regular expression syntax',
                            )}
                          </Text>
                        ) : (
                          <Text style={styles.regexHelpText}>
                            {t(
                              'console.ignorePatternsDesc',
                              'Logs matching this regex will be excluded from export.',
                            )}
                          </Text>
                        )}
                      </View>
                    </View>
                  )}
                </View>

                {/* Export Format in the SAME Row */}
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>EXPORT FORMAT</Text>
                  <View style={styles.formatRowInline}>
                    {[
                      {
                        id: 'txt',
                        label: 'Plain Text (.txt)',
                        desc: 'Universal text with structured banners',
                      },
                      {
                        id: 'log',
                        label: 'Log File (.log)',
                        desc: 'Standard log format with frame blocks',
                      },
                    ].map(fmt => {
                      const isActive = format === fmt.id;
                      return (
                        <TouchableScale
                          key={fmt.id}
                          onPress={() => {
                            triggerNativeHaptic('light');
                            setFormat(fmt.id as ConsoleLogExportFormat);
                          }}
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
                                styles.formatCardTitle,
                                isActive && styles.formatCardTitleActive,
                              ]}>
                              {fmt.label}
                            </Text>
                          </View>
                          <Text style={styles.formatCardDesc}>{fmt.desc}</Text>
                        </TouchableScale>
                      );
                    })}
                  </View>
                </View>

                {/* Export Content Details & Options */}
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>CONTENT OPTIONS</Text>
                  <View style={styles.optionsGrid}>
                    {[
                      {
                        key: 'stack',
                        label: 'Stack Trace & Frames',
                        value: includeStackTrace,
                        toggle: () => setIncludeStackTrace(v => !v),
                      },
                      {
                        key: 'args',
                        label: 'Arguments & Payloads',
                        value: includeArguments,
                        toggle: () => setIncludeArguments(v => !v),
                      },
                      {
                        key: 'caller',
                        label: 'Caller & File Origin',
                        value: includeCaller,
                        toggle: () => setIncludeCaller(v => !v),
                      },
                      {
                        key: 'timestamps',
                        label: 'Exact Timestamps',
                        value: includeTimestamps,
                        toggle: () => setIncludeTimestamps(v => !v),
                      },
                      {
                        key: 'appinfo',
                        label: 'System Header Banner',
                        value: includeAppInfo,
                        toggle: () => setIncludeAppInfo(v => !v),
                      },
                    ].map(opt => (
                      <TouchableScale
                        key={opt.key}
                        onPress={() => {
                          triggerNativeHaptic('light');
                          opt.toggle();
                        }}
                        style={[
                          styles.optionRow,
                          opt.value && styles.optionRowActive,
                        ]}>
                        <View
                          style={[
                            styles.checkbox,
                            opt.value && styles.checkboxActive,
                          ]}>
                          {opt.value && (
                            <CheckIcon size={10} color={AppColors.white} />
                          )}
                        </View>
                        <Text
                          style={[
                            styles.optionLabel,
                            opt.value && styles.optionLabelActive,
                          ]}>
                          {opt.label}
                        </Text>
                      </TouchableScale>
                    ))}
                  </View>
                </View>
              </ScrollView>

              {/* Static Glowing Bottom Footer with Action Button & Minimal Size View */}
              <View style={styles.staticFooter}>
                <View style={styles.footerMinimalSummary}>
                  <View style={styles.footerSummaryLeft}>
                    <View style={styles.footerSummaryDot} />
                    <Text style={styles.footerSummaryCountText}>
                      {selectedLogs.length} logs
                    </Text>
                    <Text style={styles.footerSummaryDivider}>•</Text>
                    <Text style={styles.footerSummarySizeText}>
                      ~{formatEstimatedSize(estimatedBytes)}
                    </Text>
                    <Text style={styles.footerSummaryDivider}>•</Text>
                    <Text style={styles.footerSummaryFormatText}>
                      .{format.toUpperCase()}
                    </Text>
                  </View>

                  {ignoredCount > 0 && (
                    <View style={styles.footerIgnoredPill}>
                      <Text style={styles.footerIgnoredPillText}>
                        -{ignoredCount} ignored
                      </Text>
                    </View>
                  )}
                </View>

                <TouchableScale
                  onPress={handleStartExport}
                  disabled={selectedLogs.length === 0}
                  style={[
                    styles.exportActionBtn,
                    selectedLogs.length === 0 && styles.exportActionBtnDisabled,
                  ]}>
                  <ExportIcon size={17} color={AppColors.white} />
                  <Text style={styles.exportActionBtnText}>
                    {t('console.exportLogsAction', {
                      count: selectedLogs.length,
                      size: formatEstimatedSize(estimatedBytes),
                      defaultValue: `Export ${selectedLogs.length} Logs (${formatEstimatedSize(
                        estimatedBytes,
                      )})`,
                    })}
                  </Text>
                </TouchableScale>
              </View>
            </>
          )}

          {/* Progress Stage */}
          {stage === 'progress' && (
            <View style={styles.progressContainer}>
              <Animated.View
                style={[
                  styles.progressIconBadge,
                  {transform: [{scale: pulseAnim}]},
                ]}>
                <ExportIcon size={30} color={AppColors.purple} />
              </Animated.View>

              <Text style={styles.progressHeading}>
                {t('console.exportingLogs', 'Exporting Console Logs...')}
              </Text>
              <Text style={styles.progressSub}>
                {t('console.processingItem', 'Processing')} {processedCount} /{' '}
                {selectedLogs.length} {t('console.records', 'records')} (
                {progressPercent}%)
              </Text>

              {/* Progress Track */}
              <View style={styles.progressTrack}>
                <Animated.View
                  style={[
                    styles.progressBar,
                    {
                      width: progressAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0%', '100%'],
                      }),
                    },
                  ]}
                />
              </View>

              <Text style={styles.progressFootnote}>
                Formatting .{format.toUpperCase()} payload with separators •{' '}
                {formatEstimatedSize(estimatedBytes)}
              </Text>
            </View>
          )}

          {/* Complete Stage */}
          {stage === 'complete' && (
            <View style={styles.completeContainer}>
              <View style={styles.completeSuccessBadge}>
                <CircleCheckIcon size={34} color={AppColors.emerald500} />
              </View>

              <Text style={styles.completeTitle}>
                {t('console.exportSuccessTitle', 'Logs Export Ready!')}
              </Text>
              <Text style={styles.completeSub}>
                {t(
                  'console.exportSuccessDesc',
                  'Generated full formatted log bundle ready to share or save.',
                )}
              </Text>

              {/* Metadata Details Card */}
              <View style={styles.fileDetailsCard}>
                <View style={styles.fileDetailsRow}>
                  <Text style={styles.fileDetailLabel}>📁 {t('console.exportFileLabel', 'File:')}</Text>
                  <Text style={styles.fileDetailValue} numberOfLines={1}>
                    {exportedFilename}
                  </Text>
                </View>
                <View style={styles.fileDetailsRow}>
                  <Text style={styles.fileDetailLabel}>📊 {t('console.exportLogCountLabel', 'Log Count:')}</Text>
                  <Text style={styles.fileDetailValue}>
                    {selectedLogs.length} logs
                  </Text>
                </View>
                <View style={styles.fileDetailsRow}>
                  <Text style={styles.fileDetailLabel}>💾 {t('console.exportFinalSizeLabel', 'Final Size:')}</Text>
                  <Text
                    style={[
                      styles.fileDetailValue,
                      {
                        color: AppColors.emerald500,
                        fontFamily: AppFonts.interBold,
                      },
                    ]}>
                    {formatEstimatedSize(finalSizeInBytes)}
                  </Text>
                </View>
                <View style={styles.fileDetailsRow}>
                  <Text style={styles.fileDetailLabel}>⚙️ {t('console.exportFormatLabel', 'Format:')}</Text>
                  <Text style={styles.fileDetailValue}>
                    .{format.toUpperCase()}
                  </Text>
                </View>
              </View>

              {/* Action Buttons: Share & Save to Disk */}
              <View style={styles.actionButtonGroup}>
                {/* Share Button */}
                <TouchableScale
                  onPress={handleShare}
                  style={[styles.primaryActionBtn, styles.shareBtn]}>
                  <ShareIcon size={15} color={AppColors.white} />
                  <Text style={styles.primaryActionBtnText}>
                    {t('console.shareReport', 'Share Logs')}
                  </Text>
                </TouchableScale>

                {/* Save to Disk Button */}
                <TouchableScale
                  onPress={handleSaveToDisk}
                  style={[styles.primaryActionBtn, styles.saveDiskBtn]}>
                  <SaveIcon size={15} color={AppColors.white} />
                  <Text style={styles.primaryActionBtnText}>
                    {t('console.saveToDisk', 'Save to Disk')}
                  </Text>
                </TouchableScale>

                {/* Copy to Clipboard */}
                <TouchableScale
                  onPress={handleCopy}
                  style={styles.secondaryActionBtn}>
                  <CopyIcon size={14} color={AppColors.purple} />
                  <Text style={styles.secondaryActionBtnText}>
                    {t('console.copyToClipboard', 'Copy Content')}
                  </Text>
                </TouchableScale>
              </View>

              {/* Bottom footer buttons */}
              <View style={styles.bottomFooterRow}>
                <TouchableScale
                  onPress={() => setStage('config')}
                  style={styles.textBtn}>
                  <Text style={styles.textBtnText}>
                    {t('console.exportAnother', '← Export Another')}
                  </Text>
                </TouchableScale>

                <TouchableScale onPress={onClose} style={styles.doneBtn}>
                  <Text style={styles.doneBtnText}>
                    {t('common.done', 'Done')}
                  </Text>
                </TouchableScale>
              </View>
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
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  bottomSheetCard: {
    width: '100%',
    maxHeight: '86%',
    backgroundColor: AppColors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -6},
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 24,
  },
  sheetHandleContainer: {
    width: '100%',
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 4,
    backgroundColor: '#FAF9FE',
  },
  sheetHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: `${AppColors.grayTextWeak}40`,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.dividerColor,
    backgroundColor: '#FAF9FE',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 3,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  headerTextGroup: {
    gap: 2,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: `${AppColors.purple}14`,
    borderWidth: 1,
    borderColor: `${AppColors.purple}28`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontFamily: AppFonts.interBold,
    fontSize: 15.5,
    lineHeight: 20,
    color: AppColors.primaryBlack,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontFamily: AppFonts.interMedium,
    fontSize: 11.5,
    lineHeight: 15,
    color: AppColors.grayTextWeak,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: AppColors.dividerColor,
    justifyContent: 'center',
    alignItems: 'center',
  },
  configContainer: {
    padding: 16,
    gap: 14,
  },
  section: {
    gap: 7,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionLabel: {
    fontFamily: AppFonts.interBold,
    fontSize: 10.5,
    lineHeight: 14,
    color: AppColors.grayTextWeak,
    letterSpacing: 0.6,
  },
  levelRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  levelChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 5.5,
    borderRadius: 8,
    backgroundColor: AppColors.grayBackground,
    borderWidth: 1,
    borderColor: AppColors.dividerColor,
    gap: 5,
  },
  levelChipText: {
    fontFamily: AppFonts.interMedium,
    fontSize: 11,
    lineHeight: 15,
    color: AppColors.primaryBlack,
  },
  levelCountBadge: {
    backgroundColor: 'rgba(0,0,0,0.06)',
    paddingHorizontal: 4.5,
    paddingVertical: 1,
    borderRadius: 5,
  },
  levelCountText: {
    fontFamily: AppFonts.interBold,
    fontSize: 9.5,
    color: AppColors.grayTextStrong,
  },
  countPill: {
    backgroundColor: `${AppColors.purple}12`,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  countPillText: {
    fontFamily: AppFonts.interSemiBold,
    fontSize: 10.5,
    color: AppColors.purple,
  },
  segmentedRow: {
    flexDirection: 'row',
    gap: 7,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8.5,
    borderRadius: 9,
    backgroundColor: AppColors.grayBackground,
    borderWidth: 1,
    borderColor: AppColors.dividerColor,
  },
  segmentBtnActive: {
    backgroundColor: `${AppColors.purple}14`,
    borderColor: AppColors.purple,
  },
  segmentBtnText: {
    fontFamily: AppFonts.interMedium,
    fontSize: 11.5,
    lineHeight: 15,
    color: AppColors.grayTextStrong,
  },
  segmentBtnTextActive: {
    color: AppColors.purple,
    fontFamily: AppFonts.interBold,
  },
  customOptionsContainer: {
    marginTop: 6,
    padding: 11,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: AppColors.dividerColor,
    gap: 10,
  },
  customFieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  customFieldLabel: {
    fontFamily: AppFonts.interSemiBold,
    fontSize: 11.5,
    lineHeight: 15,
    color: AppColors.grayTextStrong,
  },
  customCountInput: {
    width: 90,
    backgroundColor: AppColors.white,
    borderWidth: 1,
    borderColor: AppColors.dividerColor,
    borderRadius: 7,
    paddingHorizontal: 10,
    paddingVertical: 5.5,
    fontSize: 12.5,
    fontFamily: AppFonts.interSemiBold,
    color: AppColors.primaryBlack,
    textAlign: 'center',
  },
  regexFieldBlock: {
    gap: 5,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: AppColors.dividerColor,
  },
  regexLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  regexExclusionBadge: {
    backgroundColor: `${AppColors.purple}14`,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
  },
  regexExclusionBadgeText: {
    fontFamily: AppFonts.interBold,
    fontSize: 10,
    color: AppColors.purple,
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
  regexErrorText: {
    fontFamily: AppFonts.interMedium,
    fontSize: 10.5,
    lineHeight: 14,
    color: AppColors.errorColor,
  },
  regexHelpText: {
    fontFamily: AppFonts.interRegular,
    fontSize: 10.5,
    lineHeight: 14,
    color: AppColors.grayTextWeak,
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
  formatCardTitle: {
    fontFamily: AppFonts.interSemiBold,
    fontSize: 11.5,
    lineHeight: 15,
    color: AppColors.grayTextStrong,
  },
  formatCardTitleActive: {
    fontFamily: AppFonts.interBold,
    color: AppColors.purple,
  },
  formatCardDesc: {
    fontFamily: AppFonts.interRegular,
    fontSize: 10,
    lineHeight: 13,
    color: AppColors.grayTextWeak,
    paddingLeft: 20,
  },
  optionsGrid: {
    flexDirection: 'column',
    gap: 5,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: AppColors.grayBackground,
    borderWidth: 1,
    borderColor: AppColors.dividerColor,
    gap: 8,
  },
  optionRowActive: {
    backgroundColor: `${AppColors.purple}0A`,
    borderColor: `${AppColors.purple}30`,
  },
  checkbox: {
    width: 15,
    height: 15,
    borderRadius: 3.5,
    borderWidth: 1.5,
    borderColor: AppColors.grayTextWeak,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxActive: {
    backgroundColor: AppColors.purple,
    borderColor: AppColors.purple,
  },
  optionLabel: {
    fontFamily: AppFonts.interMedium,
    fontSize: 11.5,
    lineHeight: 15,
    color: AppColors.grayTextStrong,
  },
  optionLabelActive: {
    fontFamily: AppFonts.interSemiBold,
    color: AppColors.primaryBlack,
  },
  staticFooter: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 26 : 14,
    backgroundColor: AppColors.white,
    borderTopWidth: 1,
    borderTopColor: AppColors.dividerColor,
    shadowColor: AppColors.purple,
    shadowOffset: {width: 0, height: -4},
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 8,
    gap: 8,
  },
  footerMinimalSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  footerSummaryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footerSummaryDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: AppColors.emerald500 || '#10B981',
  },
  footerSummaryCountText: {
    fontFamily: AppFonts.interSemiBold,
    fontSize: 11.5,
    lineHeight: 15,
    color: AppColors.grayTextStrong,
  },
  footerSummaryDivider: {
    fontSize: 10,
    color: AppColors.grayTextWeak,
  },
  footerSummarySizeText: {
    fontFamily: AppFonts.interBold,
    fontSize: 11.5,
    lineHeight: 15,
    color: AppColors.purple,
  },
  footerSummaryFormatText: {
    fontFamily: AppFonts.interMedium,
    fontSize: 11,
    lineHeight: 14,
    color: AppColors.grayTextWeak,
  },
  footerIgnoredPill: {
    backgroundColor: `${AppColors.errorColor}12`,
    paddingHorizontal: 7,
    paddingVertical: 1.5,
    borderRadius: 5,
  },
  footerIgnoredPillText: {
    fontFamily: AppFonts.interSemiBold,
    fontSize: 10,
    color: AppColors.errorColor,
  },
  exportActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppColors.purple,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 7,
    shadowColor: AppColors.purple,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  exportActionBtnDisabled: {
    opacity: 0.5,
  },
  exportActionBtnText: {
    fontFamily: AppFonts.interBold,
    fontSize: 13.5,
    lineHeight: 17,
    color: AppColors.white,
    letterSpacing: 0.1,
  },
  progressContainer: {
    padding: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressIconBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: `${AppColors.purple}18`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  progressHeading: {
    fontFamily: AppFonts.interBold,
    fontSize: 15.5,
    lineHeight: 21,
    color: AppColors.primaryBlack,
    marginBottom: 3,
  },
  progressSub: {
    fontFamily: AppFonts.interMedium,
    fontSize: 12,
    lineHeight: 16,
    color: AppColors.grayTextWeak,
    marginBottom: 18,
  },
  progressTrack: {
    width: '100%',
    height: 9,
    backgroundColor: AppColors.grayBackground,
    borderRadius: 4.5,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: AppColors.dividerColor,
    marginBottom: 10,
  },
  progressBar: {
    height: '100%',
    backgroundColor: AppColors.purple,
    borderRadius: 4.5,
  },
  progressFootnote: {
    fontFamily: AppFonts.interMedium,
    fontSize: 11,
    lineHeight: 14,
    color: AppColors.grayTextWeak,
  },
  completeContainer: {
    padding: 20,
    alignItems: 'center',
  },
  completeSuccessBadge: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: `${AppColors.emerald500}18`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  completeTitle: {
    fontFamily: AppFonts.interBold,
    fontSize: 16.5,
    lineHeight: 22,
    color: AppColors.primaryBlack,
  },
  completeSub: {
    fontFamily: AppFonts.interMedium,
    fontSize: 12,
    lineHeight: 16,
    color: AppColors.grayTextWeak,
    textAlign: 'center',
    marginTop: 3,
    marginBottom: 16,
  },
  fileDetailsCard: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: AppColors.dividerColor,
    gap: 7,
    marginBottom: 16,
  },
  fileDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fileDetailLabel: {
    fontFamily: AppFonts.interMedium,
    fontSize: 11.5,
    lineHeight: 15,
    color: AppColors.grayTextStrong,
  },
  fileDetailValue: {
    fontFamily: AppFonts.interSemiBold,
    fontSize: 11.5,
    lineHeight: 15,
    color: AppColors.primaryBlack,
  },
  actionButtonGroup: {
    width: '100%',
    gap: 8,
    marginBottom: 14,
  },
  primaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 7,
  },
  shareBtn: {
    backgroundColor: AppColors.purple,
    shadowColor: AppColors.purple,
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  saveDiskBtn: {
    backgroundColor: AppColors.teal600,
    shadowColor: AppColors.teal600,
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  primaryActionBtnText: {
    fontFamily: AppFonts.interBold,
    fontSize: 13,
    lineHeight: 17,
    color: AppColors.white,
  },
  secondaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: `${AppColors.purple}40`,
    backgroundColor: `${AppColors.purple}0C`,
    gap: 6,
  },
  secondaryActionBtnText: {
    fontFamily: AppFonts.interSemiBold,
    fontSize: 12,
    lineHeight: 15,
    color: AppColors.purple,
  },
  bottomFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: AppColors.dividerColor,
  },
  textBtn: {
    paddingVertical: 5,
    paddingHorizontal: 8,
  },
  textBtnText: {
    fontFamily: AppFonts.interMedium,
    fontSize: 11.5,
    lineHeight: 15,
    color: AppColors.grayTextStrong,
  },
  doneBtn: {
    paddingVertical: 5,
    paddingHorizontal: 14,
    borderRadius: 6,
    backgroundColor: AppColors.dividerColor,
  },
  doneBtnText: {
    fontFamily: AppFonts.interBold,
    fontSize: 11.5,
    lineHeight: 15,
    color: AppColors.primaryBlack,
  },
});

export default ConsoleExportModal;
