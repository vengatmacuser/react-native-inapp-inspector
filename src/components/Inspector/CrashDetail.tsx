import React, {useMemo, useState} from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {useTranslation} from '../../i18n';
import {useInspector} from './InspectorContext';
import TouchableScale from '../TouchableScale';
import SegmentedTabs from '../SegmentedTabs';
import HighlightText from '../HighlightText';
import JsonViewer from '../JsonViewer';
import CopyButton from '../CopyButton';
import {AppColors} from '../../styles/AppColors';
import {AppFonts} from '../../styles/AppFonts';
import {
  ParsedStackFrame,
} from '../../types';
import {
  CrashDetailSubTab,
} from '../../types/enums';
import {
  exportCrashReport,
  parseCrashStackTrace,
} from '../../customHooks/crashHandler';
import {copyToClipboard} from '../../helpers';
import {
  SearchIcon,
  ClearIcon,
  CopyIcon,
  TerminalIcon,
  LayersIcon,
  ClockIcon,
  CircleCheckIcon,
  GlobeIcon,
  AppleIcon,
  AndroidIcon,
  StackTraceIcon,
  DiagnosticsIcon,
  TrailIcon,
  RawJsonIcon,
  AppFramesIcon,
  AllFramesIcon,
} from '../NetworkIcons';



const CrashDetail: React.FC = React.memo(() => {
  const {t} = useTranslation();
  const {selectedCrash} = useInspector();

  const [activeSubTab, setActiveSubTab] = useState<CrashDetailSubTab>('stack');
  const [searchQuery, setSearchQuery] = useState('');
  const [stackFilter, setStackFilter] = useState<'app' | 'all'>('app');
  const [copiedSuccess, setCopiedSuccess] = useState(false);
  const [copiedFrameIndex, setCopiedFrameIndex] = useState<number | null>(null);

  if (!selectedCrash) return null;

  const stackFrames: ParsedStackFrame[] = useMemo(() => {
    if (selectedCrash.parsedStack && selectedCrash.parsedStack.length > 0) {
      return selectedCrash.parsedStack;
    }
    if (selectedCrash.stack) {
      return parseCrashStackTrace(selectedCrash.stack);
    }
    return [];
  }, [selectedCrash]);

  // Strip keys holding explicit undefined values (e.g. componentStack) so the
  // Raw JSON tab never renders a literal "undefined".
  const rawCrashData = useMemo(() => {
    try {
      return JSON.parse(JSON.stringify(selectedCrash));
    } catch {
      return selectedCrash;
    }
  }, [selectedCrash]);

  const appStackFrames = useMemo(() => {
    return stackFrames.filter(f => f.isAppCode);
  }, [stackFrames]);

  const displayedFrames = useMemo(() => {
    if (stackFilter === 'app' && appStackFrames.length > 0) {
      return appStackFrames;
    }
    return stackFrames;
  }, [stackFilter, appStackFrames, stackFrames]);

  const originFrame = useMemo(() => {
    return appStackFrames[0] || stackFrames[0] || null;
  }, [appStackFrames, stackFrames]);

  const handleCopyReport = () => {
    const report = exportCrashReport(selectedCrash);
    copyToClipboard(report, 'Crash Report');
    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 2000);
  };

  const handleCopyFrame = (frame: ParsedStackFrame, index: number) => {
    const text = frame.raw || `${frame.method}@${frame.file}:${frame.lineNumber}:${frame.column}`;
    copyToClipboard(text, 'Stack Frame');
    setCopiedFrameIndex(index);
    setTimeout(() => setCopiedFrameIndex(null), 1500);
  };

  const tabsConfig = [
    {
      key: 'stack',
      label: t('crash.tabStack', {count: stackFrames.length}),
      icon: (isActive: boolean) => (
        <StackTraceIcon
          size={12}
          color={isActive ? AppColors.white : AppColors.grayText}
        />
      ),
    },
    {
      key: 'diagnostics',
      label: t('crash.tabDiagnostics'),
      icon: (isActive: boolean) => (
        <DiagnosticsIcon
          size={12}
          color={isActive ? AppColors.white : AppColors.grayText}
        />
      ),
    },
    {
      key: 'breadcrumbs',
      label: t('crash.tabTrail', {count: selectedCrash.breadcrumbs?.length || 0}),
      icon: (isActive: boolean) => (
        <TrailIcon
          size={12}
          color={isActive ? AppColors.white : AppColors.grayText}
        />
      ),
    },
    {
      key: 'raw',
      label: t('crash.tabRawJson'),
      icon: (isActive: boolean) => (
        <RawJsonIcon
          size={12}
          color={isActive ? AppColors.white : AppColors.grayText}
        />
      ),
    },
  ];

  return (
    <View style={{flex: 1, backgroundColor: AppColors.grayBackground}}>
      {/* ─── Top Info Bar (Similar to NetworkDetail / LogDetail) ─── */}
      <View style={{paddingHorizontal: 8, paddingTop: 6}}>
        <View style={localStyles.infoBar}>
          {/* Top Status Badges Row */}
          <View style={localStyles.badgeRow}>
            {/* Fatal / Non-fatal Pill */}
            <View
              style={[
                localStyles.pillBadge,
                {
                  backgroundColor: selectedCrash.isFatal
                    ? AppColors.errorCardBg
                    : AppColors.amberBg,
                  borderColor: selectedCrash.isFatal
                    ? AppColors.errorBorder
                    : AppColors.amberWarmBorder,
                },
              ]}>
              <View
                style={[
                  localStyles.statusDot,
                  {
                    backgroundColor: selectedCrash.isFatal
                      ? AppColors.red600
                      : AppColors.amber600,
                  },
                ]}
              />
              <Text
                style={[
                  localStyles.pillBadgeText,
                  {
                    color: selectedCrash.isFatal
                      ? AppColors.redErrorText
                      : AppColors.amberWarmText,
                  },
                ]}>
                {selectedCrash.isFatal ? t('crash.fatalCrash') : t('crash.handledException')}
              </Text>
            </View>

            {/* Type Pill */}
            <View
              style={[
                localStyles.pillBadge,
                {
                  backgroundColor: AppColors.violetSoftBg,
                  borderColor: AppColors.violetSoftBorder,
                },
              ]}>
              <Text style={[localStyles.pillBadgeText, {color: AppColors.purple700}]}>
                {selectedCrash.type.toUpperCase()}
              </Text>
            </View>

            <View style={{flex: 1}} />

            {/* Copy Report Action */}
            <TouchableScale
              onPress={handleCopyReport}
              hitSlop={10}
              style={[
                localStyles.actionButton,
                copiedSuccess && {backgroundColor: AppColors.mintGreenBg, borderColor: AppColors.mintGreenBorder},
              ]}>
              {copiedSuccess ? (
                <CircleCheckIcon color={AppColors.mintGreenText} size={12} />
              ) : (
                <CopyIcon color={AppColors.purple} size={12} />
              )}
              <Text
                style={[
                  localStyles.actionButtonText,
                  copiedSuccess && {color: AppColors.mintGreenText},
                ]}>
                {copiedSuccess ? t('crash.copied') : t('crash.copyReport')}
              </Text>
            </TouchableScale>
          </View>

          {/* Crash Title / Message */}
          <Text style={localStyles.titleText}>
            {selectedCrash.message}
          </Text>

          {/* Metadata Row */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={localStyles.metaRow}>
            {originFrame && (
              <View style={localStyles.metaChip}>
                <TerminalIcon color={AppColors.grayText} size={11} />
                <Text style={localStyles.metaChipText} numberOfLines={2}>
                  {originFrame.file}:{originFrame.lineNumber}
                </Text>
              </View>
            )}

            <View style={localStyles.metaChip}>
              <ClockIcon color={AppColors.grayText} size={11} />
              <Text style={localStyles.metaChipText}>
                {selectedCrash.timeStr || new Date(selectedCrash.timestamp).toLocaleTimeString()}
              </Text>
            </View>

            {selectedCrash.deviceInfo?.platform && (
              <View style={localStyles.metaChip}>
                {selectedCrash.deviceInfo.platform === 'ios' ? (
                  <AppleIcon color={AppColors.grayText} size={11} />
                ) : (
                  <AndroidIcon color={AppColors.grayText} size={11} />
                )}
                <Text style={localStyles.metaChipText}>
                  {selectedCrash.deviceInfo.platform.toUpperCase()} {selectedCrash.deviceInfo.osVersion}
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>

      {/* ─── Segmented Sub Tabs ─── */}
      <View style={{paddingHorizontal: 8, paddingTop: 6, paddingBottom: 4}}>
        <SegmentedTabs
          tabs={tabsConfig}
          activeKey={activeSubTab}
          onChange={tab => setActiveSubTab(tab as CrashDetailSubTab)}
        />
      </View>

      {/* ─── Search Bar (for Stack & Raw tabs) ─── */}
      {(activeSubTab === 'stack' || activeSubTab === 'raw') && (
        <View style={{paddingHorizontal: 12, paddingBottom: 6}}>
          <View style={localStyles.searchContainer}>
            <SearchIcon color={AppColors.grayText} size={14} />
            <TextInput
              style={localStyles.searchInput}
              placeholder={t('crash.searchDetailPlaceholder')}
              placeholderTextColor={AppColors.grayTextWeak}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <TouchableScale onPress={() => setSearchQuery('')} hitSlop={10}>
                <ClearIcon color={AppColors.grayText} size={13} />
              </TouchableScale>
            )}
          </View>
        </View>
      )}

      {/* ─── Tab Content ScrollView ─── */}
      <ScrollView
        style={{flex: 1}}
        contentContainerStyle={{padding: 12, paddingBottom: 40, gap: 12}}>
        {/* 1. STACK TRACE TAB */}
        {activeSubTab === 'stack' && (
          <View style={{gap: 10}}>
            {/* Filter Chips (App Code vs All Frames) */}
            <View style={localStyles.filterChipsRow}>
              <TouchableScale
                onPress={() => setStackFilter('app')}
                style={[
                  localStyles.filterChip,
                  stackFilter === 'app' && localStyles.filterChipActive,
                ]}>
                <AppFramesIcon
                  size={12}
                  color={
                    stackFilter === 'app'
                      ? AppColors.white
                      : AppColors.purple
                  }
                />
                <Text
                  style={[
                    localStyles.filterChipText,
                    stackFilter === 'app' && localStyles.filterChipTextActive,
                  ]}>
                  {t('crash.appFrames', {count: appStackFrames.length})}
                </Text>
              </TouchableScale>

              <TouchableScale
                onPress={() => setStackFilter('all')}
                style={[
                  localStyles.filterChip,
                  stackFilter === 'all' && localStyles.filterChipActive,
                ]}>
                <AllFramesIcon
                  size={12}
                  color={
                    stackFilter === 'all'
                      ? AppColors.white
                      : AppColors.purple
                  }
                />
                <Text
                  style={[
                    localStyles.filterChipText,
                    stackFilter === 'all' && localStyles.filterChipTextActive,
                  ]}>
                  {t('crash.allFrames', {count: stackFrames.length})}
                </Text>
              </TouchableScale>
            </View>

            {/* Frames List */}
            {displayedFrames.length > 0 ? (
              displayedFrames
                .filter(frame => {
                  if (!searchQuery.trim()) return true;
                  const q = searchQuery.toLowerCase();
                  return (
                    frame.method.toLowerCase().includes(q) ||
                    frame.file.toLowerCase().includes(q)
                  );
                })
                .map((frame, index) => {
                  const isOrigin = index === 0 && frame.isAppCode;
                  return (
                    <View
                      key={`frame_${index}`}
                      style={[
                        localStyles.frameCard,
                        isOrigin && localStyles.originFrameCard,
                      ]}>
                      <View style={localStyles.frameCardHeader}>
                        <View style={localStyles.frameIndexBadge}>
                          <Text style={localStyles.frameIndexBadgeText}>
                            #{index + 1}
                          </Text>
                        </View>
                        <View
                          style={[
                            localStyles.frameTypeBadge,
                            frame.isAppCode
                              ? {backgroundColor: '#ECFDF5', borderColor: '#A7F3D0'}
                              : {backgroundColor: '#F1F5F9', borderColor: '#E2E8F0'},
                          ]}>
                          <Text
                            style={[
                              localStyles.frameTypeBadgeText,
                              frame.isAppCode
                                ? {color: '#059669'}
                                : {color: '#64748B'},
                            ]}>
                            {frame.isAppCode ? t('crash.frameApp') : t('crash.frameLib')}
                          </Text>
                        </View>

                        <Text style={localStyles.frameMethodText} numberOfLines={1}>
                          <HighlightText
                            text={frame.method || t('crash.anonymous')}
                            highlight={searchQuery}
                          />
                        </Text>

                        <TouchableScale
                          onPress={() => handleCopyFrame(frame, index)}
                          hitSlop={8}
                          style={localStyles.frameCopyBtn}>
                          {copiedFrameIndex === index ? (
                            <CircleCheckIcon color={AppColors.greenColor} size={12} />
                          ) : (
                            <CopyIcon color={AppColors.grayText} size={12} />
                          )}
                          <Text style={localStyles.frameCopyBtnText}>
                            {copiedFrameIndex === index
                              ? t('crash.frameCopied')
                              : t('crash.frameCopy')}
                          </Text>
                        </TouchableScale>
                      </View>

                      <View style={localStyles.frameLocationRow}>
                        <Text style={localStyles.frameFileText} numberOfLines={1}>
                          <HighlightText
                            text={frame.file}
                            highlight={searchQuery}
                          />
                        </Text>
                        <Text style={localStyles.frameLineText}>
                          :{frame.lineNumber}
                          {frame.column ? `:${frame.column}` : ''}
                        </Text>
                      </View>

                      {frame.raw && (
                        <Text
                          style={localStyles.frameRawText}
                          numberOfLines={2}>
                          {frame.raw}
                        </Text>
                      )}
                    </View>
                  );
                })
            ) : (
              <View style={localStyles.emptyContainer}>
                <Text style={localStyles.emptyText}>
                  {selectedCrash.stack
                    ? selectedCrash.stack
                    : t('crash.noStackTrace')}
                </Text>
              </View>
            )}

            {selectedCrash.componentStack && (
              <View style={localStyles.sectionCard}>
                <View style={localStyles.sectionCardHeader}>
                  <LayersIcon color={AppColors.purple} size={14} />
                  <Text style={localStyles.sectionCardTitle}>
                    {t('crash.componentHierarchy')}
                  </Text>
                </View>
                <Text style={localStyles.componentStackText}>
                  {selectedCrash.componentStack}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* 2. DIAGNOSTICS TAB */}
        {activeSubTab === 'diagnostics' && (
          <View style={{gap: 12}}>
            {/* Device & OS Diagnostics Card */}
            <View style={localStyles.sectionCard}>
              <View
                style={[
                  localStyles.sectionCardHeader,
                  {justifyContent: 'space-between'},
                ]}>
                <View
                  style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
                  <GlobeIcon color={AppColors.purple} size={14} />
                  <Text style={localStyles.sectionCardTitle}>
                    {t('crash.deviceEnvironment')}
                  </Text>
                </View>
                <CopyButton
                  value={
                    selectedCrash.deviceInfo || {
                      platform: Platform.OS,
                      osVersion: String(Platform.Version),
                    }
                  }
                  label="Diagnostics"
                />
              </View>

              <View style={localStyles.diagGrid}>
                <View style={localStyles.diagItem}>
                  <Text style={localStyles.diagLabel}>{t('crash.platform')}</Text>
                  <Text style={localStyles.diagValue}>
                    {selectedCrash.deviceInfo?.platform?.toUpperCase() || Platform.OS.toUpperCase()}
                  </Text>
                </View>

                <View style={localStyles.diagItem}>
                  <Text style={localStyles.diagLabel}>{t('crash.osVersion')}</Text>
                  <Text style={localStyles.diagValue}>
                    {selectedCrash.deviceInfo?.osVersion || String(Platform.Version)}
                  </Text>
                </View>

                <View style={localStyles.diagItem}>
                  <Text style={localStyles.diagLabel}>{t('crash.reactNative')}</Text>
                  <Text style={localStyles.diagValue}>
                    {selectedCrash.deviceInfo?.rnVersion || '0.74+'}
                  </Text>
                </View>

                <View style={localStyles.diagItem}>
                  <Text style={localStyles.diagLabel}>{t('crash.jsEngine')}</Text>
                  <Text style={localStyles.diagValue}>
                    {selectedCrash.deviceInfo?.isHermes ? t('crash.hermesEngine') : t('crash.jsc')}
                  </Text>
                </View>

                <View style={localStyles.diagItem}>
                  <Text style={localStyles.diagLabel}>{t('crash.architecture')}</Text>
                  <Text style={localStyles.diagValue}>
                    {selectedCrash.deviceInfo?.isFabric ? t('crash.fabricNewArch') : t('crash.paperLegacy')}
                  </Text>
                </View>

                <View style={localStyles.diagItem}>
                  <Text style={localStyles.diagLabel}>{t('crash.appState')}</Text>
                  <Text style={localStyles.diagValue}>
                    {selectedCrash.deviceInfo?.appState || 'active'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Memory Metrics Card */}
            {selectedCrash.memoryInfo && (
              <View style={localStyles.sectionCard}>
                <View
                  style={[
                    localStyles.sectionCardHeader,
                    {justifyContent: 'space-between'},
                  ]}>
                  <View
                    style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
                    <LayersIcon color={AppColors.purple} size={14} />
                    <Text style={localStyles.sectionCardTitle}>
                      {t('crash.jsHeapMemory')}
                    </Text>
                  </View>
                  <CopyButton
                    value={selectedCrash.memoryInfo}
                    label="Memory Info"
                  />
                </View>

                <View style={localStyles.diagGrid}>
                  <View style={localStyles.diagItem}>
                    <Text style={localStyles.diagLabel}>{t('crash.usedHeap')}</Text>
                    <Text style={localStyles.diagValue}>
                      {selectedCrash.memoryInfo.usedJSHeapSize} MB
                    </Text>
                  </View>

                  <View style={localStyles.diagItem}>
                    <Text style={localStyles.diagLabel}>{t('crash.totalHeap')}</Text>
                    <Text style={localStyles.diagValue}>
                      {selectedCrash.memoryInfo.totalJSHeapSize} MB
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </View>
        )}

        {/* 3. BREADCRUMBS TAB */}
        {activeSubTab === 'breadcrumbs' && (
          <View style={{gap: 10}}>
            {selectedCrash.breadcrumbs && selectedCrash.breadcrumbs.length > 0 && (
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'flex-end',
                  marginBottom: 2,
                }}>
                <CopyButton
                  value={selectedCrash.breadcrumbs}
                  label="All Breadcrumbs"
                />
              </View>
            )}
            {selectedCrash.breadcrumbs && selectedCrash.breadcrumbs.length > 0 ? (
              selectedCrash.breadcrumbs.map((b, idx) => (
                <View key={`crumb_${idx}`} style={localStyles.breadcrumbCard}>
                  <View style={localStyles.breadcrumbHeader}>
                    <View style={localStyles.breadcrumbTag}>
                      <Text style={localStyles.breadcrumbTagText}>
                        {b.type.toUpperCase()}
                      </Text>
                    </View>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 8,
                      }}>
                      <Text style={localStyles.breadcrumbTime}>
                        {new Date(b.timestamp).toLocaleTimeString()}
                      </Text>
                      <CopyButton
                        value={`${new Date(b.timestamp).toLocaleTimeString()} [${b.type.toUpperCase()}] ${b.message}${b.data ? ' ' + JSON.stringify(b.data) : ''}`}
                        label="Breadcrumb"
                      />
                    </View>
                  </View>
                  <Text style={localStyles.breadcrumbMessage}>{b.message}</Text>
                  {b.data && (
                    <View style={{marginTop: 6}}>
                      <JsonViewer data={b.data} search="" wrap />
                    </View>
                  )}
                </View>
              ))
            ) : (
              <View style={localStyles.emptyContainer}>
                <Text style={localStyles.emptyText}>
                  {t('crash.noBreadcrumbs')}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* 4. RAW JSON TAB */}
        {activeSubTab === 'raw' && (
          <View style={localStyles.rawContainer}>
            <JsonViewer
              data={rawCrashData}
              search={searchQuery}
              wrap
            />
          </View>
        )}
      </ScrollView>
    </View>
  );
});

export default CrashDetail;

const localStyles = StyleSheet.create({
  infoBar: {
    backgroundColor: AppColors.primaryLight,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: AppColors.grayBorderSecondary,
    shadowColor: AppColors.black,
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    gap: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    gap: 5,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  pillBadgeText: {
    fontFamily: AppFonts.interBold,
    fontSize: 9.5,
    letterSpacing: 0.4,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: `${AppColors.purple}14`,
    borderColor: `${AppColors.purple}33`,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  actionButtonText: {
    fontFamily: AppFonts.interBold,
    fontSize: 10.5,
    color: AppColors.purple,
  },
  titleText: {
    fontFamily: AppFonts.interBold,
    fontSize: 14,
    color: AppColors.primaryBlack,
    lineHeight: 19,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 2,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: AppColors.grayBackground,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: AppColors.dividerColor,
  },
  metaChipText: {
    fontFamily: AppFonts.interMedium,
    fontSize: 10,
    color: AppColors.grayText,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.primaryLight,
    borderWidth: 1,
    borderColor: AppColors.grayBorderSecondary,
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 36,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: AppFonts.interRegular,
    fontSize: 12,
    color: AppColors.primaryBlack,
    paddingVertical: 0,
  },
  filterChipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: AppColors.primaryLight,
    borderWidth: 1,
    borderColor: AppColors.grayBorderSecondary,
  },
  filterChipActive: {
    backgroundColor: AppColors.purple,
    borderColor: AppColors.purple,
  },
  filterChipText: {
    fontFamily: AppFonts.interMedium,
    fontSize: 11,
    color: AppColors.grayText,
  },
  filterChipTextActive: {
    fontFamily: AppFonts.interBold,
    color: AppColors.white,
  },
  frameCard: {
    backgroundColor: AppColors.primaryLight,
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: AppColors.grayBorderSecondary,
    gap: 4,
  },
  originFrameCard: {
    borderColor: '#6EE7B7',
    backgroundColor: '#F0FDF4',
  },
  frameCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  frameIndexBadge: {
    minWidth: 24,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 4,
    backgroundColor: `${AppColors.purple}14`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  frameIndexBadgeText: {
    fontFamily: AppFonts.interBold,
    fontSize: 9,
    color: AppColors.purple,
  },
  frameTypeBadge: {
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  frameTypeBadgeText: {
    fontFamily: AppFonts.interBold,
    fontSize: 8.5,
  },
  frameMethodText: {
    fontFamily: AppFonts.interBold,
    fontSize: 12,
    color: AppColors.primaryBlack,
    flex: 1,
  },
  frameLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  frameFileText: {
    fontFamily: AppFonts.interRegular,
    fontSize: 11,
    color: AppColors.grayText,
    flex: 1,
  },
  frameLineText: {
    fontFamily: AppFonts.interBold,
    fontSize: 11,
    color: AppColors.purple,
  },
  frameCopyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 5,
    backgroundColor: AppColors.grayBackground,
    borderWidth: 1,
    borderColor: AppColors.dividerColor,
  },
  frameCopyBtnText: {
    fontFamily: AppFonts.interBold,
    fontSize: 9,
    color: AppColors.grayText,
  },
  frameRawText: {
    fontFamily: AppFonts.interRegular,
    fontSize: 9.5,
    color: AppColors.grayTextWeak,
    backgroundColor: `${AppColors.primaryBlack}06`,
    borderRadius: 5,
    paddingHorizontal: 7,
    paddingVertical: 4,
    overflow: 'hidden',
  },
  componentStackText: {
    fontFamily: AppFonts.interRegular,
    fontSize: 11,
    lineHeight: 16,
    color: AppColors.grayText,
    backgroundColor: `${AppColors.primaryBlack}06`,
    borderRadius: 6,
    padding: 10,
  },
  sectionCard: {
    backgroundColor: AppColors.primaryLight,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: AppColors.grayBorderSecondary,
    gap: 10,
  },
  sectionCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.dividerColor,
  },
  sectionCardTitle: {
    fontFamily: AppFonts.interBold,
    fontSize: 12.5,
    color: AppColors.primaryBlack,
  },
  diagGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 8,
    columnGap: 12,
  },
  diagItem: {
    width: '47%',
    gap: 2,
  },
  diagLabel: {
    fontFamily: AppFonts.interRegular,
    fontSize: 10,
    color: AppColors.grayTextWeak,
  },
  diagValue: {
    fontFamily: AppFonts.interBold,
    fontSize: 11.5,
    color: AppColors.primaryBlack,
  },
  breadcrumbCard: {
    backgroundColor: AppColors.primaryLight,
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: AppColors.grayBorderSecondary,
    gap: 4,
  },
  breadcrumbHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  breadcrumbTag: {
    backgroundColor: `${AppColors.purple}14`,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  breadcrumbTagText: {
    fontFamily: AppFonts.interBold,
    fontSize: 9,
    color: AppColors.purple,
  },
  breadcrumbTime: {
    fontFamily: AppFonts.interRegular,
    fontSize: 10,
    color: AppColors.grayTextWeak,
  },
  breadcrumbMessage: {
    fontFamily: AppFonts.interRegular,
    fontSize: 11.5,
    color: AppColors.primaryBlack,
    marginTop: 2,
  },
  rawContainer: {
    backgroundColor: AppColors.primaryLight,
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: AppColors.grayBorderSecondary,
  },
  emptyContainer: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppColors.primaryLight,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: AppColors.grayBorderSecondary,
  },
  emptyText: {
    fontFamily: AppFonts.interRegular,
    fontSize: 11,
    color: AppColors.grayText,
    textAlign: 'center',
  },
});
