import React, {useState, useEffect, useMemo} from 'react';
import {
  Alert,
  Dimensions,
  PixelRatio,
  Platform,
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, {Path} from 'react-native-svg';
import {AppColors} from '../../styles/AppColors';
import {AppFonts} from '../../styles/AppFonts';
import TouchableScale from '../TouchableScale';
import {LIB_VERSION} from '../../constants/version';
import {
  getAppName,
  getBundleIdentifier,
  getAppVersionAndBuild,
  copyToClipboard,
  showToast,
} from '../../helpers';
import {trackTelemetryEvent} from '../../helpers/telemetry';
import {triggerNativeHaptic} from '../../native/NativeInspector';
import {
  HeadphonesIcon,
  SendIcon,
  CopyIcon,
  InfoCircleIcon,
  CheckIcon,
  SearchIcon,
  ChevronDownIcon,
  CloseWhite,
} from '../NetworkIcons';

const DEVELOPER_EMAIL = 'vengatmacuser@gmail.com';
const GITHUB_REPO_URL = 'https://github.com/vengatmacuser/react-native-inapp-inspector';

export interface FeedbackModalProps {
  visible?: boolean;
  onClose: () => void;
}

export interface InspectorModuleItem {
  id: string;
  name: string;
  category: string;
  icon: string;
  description: string;
  color: string;
  quickChips: string[];
}

const INSPECTOR_MODULES: InspectorModuleItem[] = [
  {
    id: 'apis',
    name: 'Network (APIs)',
    category: 'Core Inspector',
    icon: '🌐',
    description: 'HTTP/HTTPS requests, WebSocket, status codes & latency',
    color: '#6366F1',
    quickChips: [
      'cURL / HAR Export',
      'Requests failing / missing',
      'GraphQL query filter',
      'Response format issue',
      'SSL pinning / certs',
      'Slow API response alerts',
    ],
  },
  {
    id: 'logs',
    name: 'Console Logs',
    category: 'Core Inspector',
    icon: '📝',
    description: 'console.log, warn, error, trace & regex search',
    color: '#8B5CF6',
    quickChips: [
      'Log regex search / filter',
      'Stack trace symbolication',
      'Error group collapse',
      'Custom tag / color highlight',
      'High log spam performance',
    ],
  },
  {
    id: 'redux',
    name: 'Redux Inspector',
    category: 'State Management',
    icon: '⚛️',
    description: 'Redux store slices, action dispatch history & state diff',
    color: '#7C3AED',
    quickChips: [
      'Action time-travel / replay',
      'State slice search & diff',
      'Auto action logger',
      'Persistence / rehydration',
      'Large state tree lag',
    ],
  },
  {
    id: 'analytics',
    name: 'Analytics Logger',
    category: 'Telemetry',
    icon: '📊',
    description: 'Firebase analytics & custom telemetry event tracking',
    color: '#F59E0B',
    quickChips: [
      'Firebase auto-interceptor',
      'Custom event param view',
      'Event export to CSV / JSON',
      'Filter by event name',
    ],
  },
  {
    id: 'crash',
    name: 'Crash Protection',
    category: 'Diagnostics',
    icon: '💥',
    description: 'Unhandled exceptions, fatal crash captures & stack trace',
    color: '#EF4444',
    quickChips: [
      'Auto screenshot on crash',
      'Native crash reporting',
      'Symbolicated stack trace',
      'Error boundary recovery',
    ],
  },
  {
    id: 'performance',
    name: 'Performance Tracker',
    category: 'Diagnostics',
    icon: '⚡',
    description: 'FPS monitor, memory footprint, CPU & render timing',
    color: '#10B981',
    quickChips: [
      'FPS drop alerts',
      'Memory leak detection',
      'Slow component render timings',
      'Screen transition metrics',
    ],
  },
  {
    id: 'bundle',
    name: 'Bundle Analyzer',
    category: 'Optimization',
    icon: '📦',
    description: 'Hermes JS bundle visualizer & package asset weight',
    color: '#3B82F6',
    quickChips: [
      'Package tree visualizer',
      'Duplicate dependency warning',
      'Asset size breakdown',
      'Sourcemap integration',
    ],
  },
  {
    id: 'storage',
    name: 'Storage Explorer',
    category: 'Storage',
    icon: '💾',
    description: 'AsyncStorage, MMKV & local key-value store viewer',
    color: '#06B6D4',
    quickChips: [
      'AsyncStorage live edit',
      'MMKV encrypted keys',
      'Clear storage cache',
      'Key search & filter',
    ],
  },
  {
    id: 'capture',
    name: 'Screen Capture',
    category: 'Media',
    icon: '📸',
    description: 'High-res screenshots, video & animated GIF recording',
    color: '#EC4899',
    quickChips: [
      'GIF conversion resolution',
      'Audio recording option',
      'Auto-hide inspector in shots',
      'Instant media preview',
    ],
  },
  {
    id: 'launcher',
    name: 'FAB Launcher & UI',
    category: 'Interface',
    icon: '🚀',
    description: 'Floating trigger, gestures, dark mode & modal themes',
    color: '#D946EF',
    quickChips: [
      'Draggable FAB positioning',
      'Custom dark / light theme',
      'Font scaling & line heights',
      'Custom app header logo',
    ],
  },
  {
    id: 'general',
    name: 'Entire Inspector / General',
    category: 'General',
    icon: '✨',
    description: 'General feedback, documentation, new ideas & support',
    color: '#64748B',
    quickChips: [
      'Love this tool! 🚀',
      'Super easy integration 🛠️',
      'Documentation clarification 📖',
      'Feature roadmap suggestion 🗺️',
    ],
  },
];

type FeedbackCategory = 'feedback' | 'bug' | 'feature' | 'performance' | 'help';

interface CategoryConfig {
  key: FeedbackCategory;
  label: string;
  icon: string;
  color: string;
  bgColor: string;
}

const CATEGORIES: CategoryConfig[] = [
  {
    key: 'feedback',
    label: 'Feedback',
    icon: '💬',
    color: '#8B5CF6',
    bgColor: '#8B5CF618',
  },
  {
    key: 'bug',
    label: 'Bug Report',
    icon: '🐛',
    color: '#EF4444',
    bgColor: '#EF444418',
  },
  {
    key: 'feature',
    label: 'Feature Request',
    icon: '✨',
    color: '#F59E0B',
    bgColor: '#F59E0B18',
  },
  {
    key: 'performance',
    label: 'Performance',
    icon: '⚡',
    color: '#10B981',
    bgColor: '#10B98118',
  },
  {
    key: 'help',
    label: 'Support / Help',
    icon: '❓',
    color: '#3B82F6',
    bgColor: '#3B82F618',
  },
];

interface MoodOption {
  value: number;
  emoji: string;
  label: string;
  color: string;
}

const MOODS: MoodOption[] = [
  {value: 1, emoji: '😡', label: 'Frustrated', color: '#EF4444'},
  {value: 2, emoji: '😐', label: 'Okay', color: '#F59E0B'},
  {value: 3, emoji: '🙂', label: 'Good', color: '#10B981'},
  {value: 4, emoji: '🤩', label: 'Great', color: '#8B5CF6'},
  {value: 5, emoji: '🚀', label: 'Loving it!', color: '#EC4899'},
];

const GitHubIcon = ({size = 14, color = AppColors.white}: {size?: number; color?: string}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <Path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
  </Svg>
);

export const FeedbackModal: React.FC<FeedbackModalProps> = ({onClose}) => {
  const [selectedModuleId, setSelectedModuleId] = useState<string>('apis');
  const [isModulePickerVisible, setIsModulePickerVisible] = useState<boolean>(false);
  const [moduleSearchQuery, setModuleSearchQuery] = useState<string>('');

  const [category, setCategory] = useState<FeedbackCategory>('feedback');
  const [selectedChips, setSelectedChips] = useState<string[]>([]);
  const [mood, setMood] = useState<number>(5);
  const [customNote, setCustomNote] = useState<string>('');
  const [showDiagnostics, setShowDiagnostics] = useState<boolean>(false);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [copiedDraft, setCopiedDraft] = useState<boolean>(false);

  useEffect(() => {
    trackTelemetryEvent('feedback_modal_opened', {category, module: selectedModuleId});
  }, []);

  const selectedModule = useMemo(() => {
    return INSPECTOR_MODULES.find(m => m.id === selectedModuleId) || INSPECTOR_MODULES[0];
  }, [selectedModuleId]);

  const filteredModules = useMemo(() => {
    const q = moduleSearchQuery.trim().toLowerCase();
    if (!q) return INSPECTOR_MODULES;
    return INSPECTOR_MODULES.filter(
      m =>
        m.name.toLowerCase().includes(q) ||
        m.category.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q),
    );
  }, [moduleSearchQuery]);

  const currentCategoryConfig = useMemo(() => {
    return CATEGORIES.find(c => c.key === category) || CATEGORIES[0];
  }, [category]);

  const activeChipsList = useMemo(() => {
    return selectedModule.quickChips;
  }, [selectedModule]);

  const appName = getAppName() || 'React Native App';
  const bundleId = getBundleIdentifier() || 'unknown';
  const appVersion = getAppVersionAndBuild()?.formatted || '1.0.0';
  const {width, height} = Dimensions.get('window');

  const getDiagnosticsText = () => {
    return [
      `• Module Context: ${selectedModule.name} (${selectedModule.category})`,
      `• Package: react-native-inapp-inspector@${LIB_VERSION}`,
      `• Platform: ${Platform.OS.toUpperCase()} (${Platform.Version})`,
      `• App: ${appName} (${bundleId}) v${appVersion}`,
      `• Screen: ${Math.round(width)} x ${Math.round(height)} (Scale ${PixelRatio.get()})`,
      `• Timestamp: ${new Date().toISOString()}`,
    ].join('\n');
  };

  const toggleChip = (chip: string) => {
    triggerNativeHaptic('light');
    setSelectedChips(prev => {
      if (prev.includes(chip)) {
        return prev.filter(c => c !== chip);
      }
      return [...prev, chip];
    });
  };

  const handleSelectModule = (moduleItem: InspectorModuleItem) => {
    triggerNativeHaptic('medium');
    setSelectedModuleId(moduleItem.id);
    setIsModulePickerVisible(false);
    setModuleSearchQuery('');
    setSelectedChips([]);
  };

  const handleCategoryChange = (cat: FeedbackCategory) => {
    triggerNativeHaptic('medium');
    setCategory(cat);
  };

  const buildFeedbackPayload = () => {
    const activeMood = MOODS.find(m => m.value === mood) || MOODS[4];
    const chipsSummary = selectedChips.length > 0 ? selectedChips.join(', ') : 'General thoughts';
    const emailSubject = `[In-App Inspector] [${selectedModule.name}] [${currentCategoryConfig.label}] ${chipsSummary.slice(0, 50)}`;

    const bodyLines = [
      `📦 Module: ${selectedModule.name} (${selectedModule.category})`,
      `🎯 Type: ${currentCategoryConfig.label}`,
      `🌟 Mood / Experience: ${activeMood.emoji} ${activeMood.label} (${mood}/5)`,
      ...(selectedChips.length > 0
        ? ['', '📌 Key Highlights / Items:', ...selectedChips.map(c => `  • ${c}`)]
        : []),
      ...(customNote.trim()
        ? ['', '📝 Additional Notes:', customNote.trim()]
        : []),
      '',
      '----------------------------------------',
      '⚡ System & Diagnostic Info (Auto-attached):',
      getDiagnosticsText(),
      '----------------------------------------',
    ];

    return {
      subject: emailSubject,
      body: bodyLines.join('\n'),
      activeMood,
    };
  };

  const handleCopyDraft = () => {
    triggerNativeHaptic('success');
    const {subject, body} = buildFeedbackPayload();
    const fullText = `To: ${DEVELOPER_EMAIL}\nSubject: ${subject}\n\n${body}`;
    copyToClipboard(fullText, 'Feedback Draft & Diagnostics');
    setCopiedDraft(true);
    setTimeout(() => setCopiedDraft(false), 2000);
    showToast('Feedback draft & diagnostics copied to clipboard');
  };

  const handleOpenGitHub = async () => {
    triggerNativeHaptic('medium');
    try {
      const {subject, body} = buildFeedbackPayload();
      const issueTitle = encodeURIComponent(subject);
      const issueBody = encodeURIComponent(body);
      const url = `${GITHUB_REPO_URL}/issues/new?title=${issueTitle}&body=${issueBody}`;
      await Linking.openURL(url);
      trackTelemetryEvent('feedback_github_opened', {
        category,
        module: selectedModuleId,
        mood,
      });
    } catch {
      showToast('Could not open GitHub browser');
    }
  };

  const handleSendEmail = async () => {
    if (isSending) return;
    setIsSending(true);
    triggerNativeHaptic('medium');

    try {
      const {subject, body} = buildFeedbackPayload();
      const mailtoUrl = `mailto:${DEVELOPER_EMAIL}?subject=${encodeURIComponent(
        subject,
      )}&body=${encodeURIComponent(body)}`;

      trackTelemetryEvent('feedback_submitted', {
        category,
        module: selectedModuleId,
        mood,
        chips_count: selectedChips.length,
        has_custom_note: Boolean(customNote.trim()),
      });

      let opened = false;
      try {
        await Linking.openURL(mailtoUrl);
        opened = true;
      } catch {
        opened = false;
      }

      if (opened) {
        showToast('Opening mail client...');
        onClose();
      } else {
        const fullDraft = `To: ${DEVELOPER_EMAIL}\nSubject: ${subject}\n\n${body}`;
        copyToClipboard(fullDraft, 'Feedback Draft');
        Alert.alert(
          'Email Client Not Available',
          `Your feedback and diagnostics have been copied to clipboard!\n\nYou can paste and send directly to:\n${DEVELOPER_EMAIL}`,
          [
            {
              text: 'Copy Email Address',
              onPress: () => {
                copyToClipboard(DEVELOPER_EMAIL, 'Email Address');
                showToast('Email address copied!');
              },
            },
            {
              text: 'Done',
              style: 'default',
              onPress: onClose,
            },
          ],
        );
      }
    } catch (err) {
      console.warn('[FeedbackModal] Error sending email:', err);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollContent}
        contentContainerStyle={styles.scrollInner}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        {/* Step 1: TARGET MODULE SELECTOR CARD */}
        <Text style={styles.sectionLabel}>1. TARGET MODULE</Text>
        
        <TouchableScale
          onPress={() => {
            triggerNativeHaptic('light');
            setIsModulePickerVisible(true);
          }}
          style={styles.moduleTriggerCard}>
          <View style={styles.moduleTriggerLeft}>
            <View
              style={[
                styles.moduleIconBox,
                {backgroundColor: `${selectedModule.color}1C`},
              ]}>
              <Text style={styles.moduleIconText}>{selectedModule.icon}</Text>
            </View>
            <View style={{flex: 1, minWidth: 0}}>
              <View style={styles.moduleNameRow}>
                <Text style={styles.moduleNameText}>{selectedModule.name}</Text>
                <View
                  style={[
                    styles.moduleCategoryBadge,
                    {backgroundColor: `${selectedModule.color}18`},
                  ]}>
                  <Text
                    style={[
                      styles.moduleCategoryBadgeText,
                      {color: selectedModule.color},
                    ]}>
                    {selectedModule.category}
                  </Text>
                </View>
              </View>
              <Text style={styles.moduleDescText} numberOfLines={1}>
                {selectedModule.description}
              </Text>
            </View>
          </View>
          
          <View style={styles.changeBadge}>
            <Text style={styles.changeBadgeText}>Change</Text>
            <ChevronDownIcon size={11} color={AppColors.purple} />
          </View>
        </TouchableScale>

        {/* Step 2: Smart Quick Chips Tailored to Module */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionLabel}>
            2. QUICK PRESETS FOR {selectedModule.name.toUpperCase()}
          </Text>
          {selectedChips.length > 0 && (
            <TouchableOpacity onPress={() => setSelectedChips([])}>
              <Text style={styles.clearChipsText}>Clear</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.chipsContainer}>
          {activeChipsList.map(chip => {
            const isSelected = selectedChips.includes(chip);
            return (
              <TouchableScale
                key={chip}
                onPress={() => toggleChip(chip)}
                style={[
                  styles.presetChip,
                  isSelected && [
                    styles.presetChipSelected,
                    {
                      borderColor: selectedModule.color,
                      backgroundColor: `${selectedModule.color}18`,
                    },
                  ],
                ]}>
                <Text
                  style={[
                    styles.presetChipCheck,
                    isSelected && {color: selectedModule.color},
                  ]}>
                  {isSelected ? '✓' : '+'}
                </Text>
                <Text
                  style={[
                    styles.presetChipText,
                    isSelected && [
                      styles.presetChipTextSelected,
                      {color: selectedModule.color},
                    ],
                  ]}>
                  {chip}
                </Text>
              </TouchableScale>
            );
          })}
        </View>

        {/* Step 3: Type of Feedback */}
        <Text style={styles.sectionLabel}>3. SELECT TOPIC</Text>
        <View style={styles.categoryGrid}>
          {CATEGORIES.map(cat => {
            const isSelected = category === cat.key;
            return (
              <TouchableScale
                key={cat.key}
                onPress={() => handleCategoryChange(cat.key)}
                style={[
                  styles.categoryChip,
                  isSelected && {
                    backgroundColor: cat.bgColor,
                    borderColor: cat.color,
                  },
                ]}>
                <Text style={styles.categoryIcon}>{cat.icon}</Text>
                <Text
                  style={[
                    styles.categoryText,
                    isSelected && {
                      color: cat.color,
                      fontFamily: AppFonts.interBold,
                    },
                  ]}>
                  {cat.label}
                </Text>
              </TouchableScale>
            );
          })}
        </View>

        {/* Step 4: Experience Mood Selector */}
        <Text style={styles.sectionLabel}>4. HOW IS YOUR EXPERIENCE?</Text>
        <View style={styles.moodCard}>
          <View style={styles.moodRow}>
            {MOODS.map(m => {
              const isSelected = mood === m.value;
              return (
                <TouchableScale
                  key={m.value}
                  onPress={() => {
                    triggerNativeHaptic('light');
                    setMood(m.value);
                  }}
                  style={[
                    styles.moodButton,
                    isSelected && [
                      styles.moodButtonSelected,
                      {
                        borderColor: m.color,
                        backgroundColor: `${m.color}15`,
                      },
                    ],
                  ]}>
                  <Text style={styles.moodEmoji}>{m.emoji}</Text>
                  <Text
                    style={[
                      styles.moodLabel,
                      isSelected && {
                        color: m.color,
                        fontFamily: AppFonts.interBold,
                      },
                    ]}>
                    {m.label}
                  </Text>
                </TouchableScale>
              );
            })}
          </View>
        </View>

        {/* Step 5: Optional Extra Notes */}
        <Text style={styles.sectionLabel}>5. ADDITIONAL DETAILS (OPTIONAL)</Text>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.textInput}
            placeholder="Type any extra thoughts, steps to reproduce, or notes here..."
            placeholderTextColor={AppColors.grayTextWeak}
            value={customNote}
            onChangeText={setCustomNote}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* System Diagnostics Attached Pill */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {
            triggerNativeHaptic('light');
            setShowDiagnostics(!showDiagnostics);
          }}
          style={styles.diagnosticsPill}>
          <View style={styles.diagnosticsLeft}>
            <InfoCircleIcon size={14} color={AppColors.purple} />
            <Text style={styles.diagnosticsPillTitle} numberOfLines={1}>
              {Platform.OS.toUpperCase()} {Platform.Version} • {appName} v{appVersion} (Auto-attached)
            </Text>
          </View>
          <Text style={styles.diagnosticsArrow}>
            {showDiagnostics ? '▲ Less' : '▼ Details'}
          </Text>
        </TouchableOpacity>

        {showDiagnostics && (
          <View style={styles.diagnosticsBox}>
            <Text style={styles.diagnosticsText}>{getDiagnosticsText()}</Text>
          </View>
        )}
      </ScrollView>

      {/* Modern Footer Actions */}
      <View style={styles.footer}>
        <View style={styles.footerLeft}>
          <TouchableScale
            onPress={handleCopyDraft}
            style={styles.actionPillBtn}>
            {copiedDraft ? (
              <CheckIcon size={14} color={AppColors.emerald500} />
            ) : (
              <CopyIcon size={14} color={AppColors.grayTextStrong} />
            )}
            <Text
              style={[
                styles.actionPillText,
                copiedDraft && {color: AppColors.emerald500},
              ]}>
              {copiedDraft ? 'Copied!' : 'Copy'}
            </Text>
          </TouchableScale>

          <TouchableScale
            onPress={handleOpenGitHub}
            style={[styles.actionPillBtn, styles.githubPillBtn]}>
            <GitHubIcon size={13} color={AppColors.primaryBlack} />
            <Text style={styles.actionPillText}>GitHub</Text>
          </TouchableScale>
        </View>

        <TouchableScale
          onPress={handleSendEmail}
          style={styles.primarySubmitBtn}>
          <SendIcon size={15} color={AppColors.white} />
          <Text style={styles.primarySubmitBtnText}>
            {isSending ? 'Sending...' : 'Send Feedback'}
          </Text>
        </TouchableScale>
      </View>

      {/* Dedicated Searchable Module Picker Modal */}
      <Modal
        visible={isModulePickerVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsModulePickerVisible(false)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setIsModulePickerVisible(false)}
          />
          <View style={styles.pickerModalContainer}>
            {/* Modal Header */}
            <View style={styles.pickerHeader}>
              <View style={{flex: 1}}>
                <Text style={styles.pickerHeaderTitle}>Select Target Module</Text>
                <Text style={styles.pickerHeaderSub}>
                  Choose which inspector feature you want to report on
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsModulePickerVisible(false)}
                hitSlop={12}
                style={styles.pickerCloseBtn}>
                <CloseWhite size={12} />
              </TouchableOpacity>
            </View>

            {/* Search Input */}
            <View style={styles.pickerSearchWrapper}>
              <SearchIcon size={14} color={AppColors.purple} />
              <TextInput
                style={styles.pickerSearchInput}
                placeholder="Search all 11 modules..."
                placeholderTextColor={AppColors.grayTextWeak}
                value={moduleSearchQuery}
                onChangeText={setModuleSearchQuery}
                autoFocus={false}
              />
              {moduleSearchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => setModuleSearchQuery('')}
                  hitSlop={10}>
                  <Text style={styles.pickerClearSearchText}>✕</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Modules List */}
            <ScrollView
              style={styles.pickerListScroll}
              contentContainerStyle={{paddingBottom: 20}}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled">
              {filteredModules.length === 0 ? (
                <View style={styles.emptySearchWrap}>
                  <Text style={styles.emptySearchText}>
                    No modules match "{moduleSearchQuery}"
                  </Text>
                </View>
              ) : (
                filteredModules.map(m => {
                  const isSelected = m.id === selectedModuleId;
                  return (
                    <TouchableScale
                      key={m.id}
                      onPress={() => handleSelectModule(m)}
                      style={[
                        styles.pickerItemCard,
                        isSelected && [
                          styles.pickerItemCardSelected,
                          {
                            borderColor: m.color,
                            backgroundColor: `${m.color}0E`,
                          },
                        ],
                      ]}>
                      <View
                        style={[
                          styles.pickerItemIconBox,
                          {backgroundColor: `${m.color}1C`},
                        ]}>
                        <Text style={styles.moduleIconText}>{m.icon}</Text>
                      </View>
                      <View style={{flex: 1, minWidth: 0}}>
                        <View style={styles.pickerItemTitleRow}>
                          <Text
                            style={[
                              styles.pickerItemTitle,
                              isSelected && {
                                color: m.color,
                                fontFamily: AppFonts.interBold,
                              },
                            ]}>
                            {m.name}
                          </Text>
                          <View
                            style={[
                              styles.moduleCategoryBadge,
                              {backgroundColor: `${m.color}18`},
                            ]}>
                            <Text
                              style={[
                                styles.moduleCategoryBadgeText,
                                {color: m.color},
                              ]}>
                              {m.category}
                            </Text>
                          </View>
                        </View>
                        <Text
                          style={styles.pickerItemDesc}
                          numberOfLines={2}>
                          {m.description}
                        </Text>
                      </View>
                      {isSelected && (
                        <View
                          style={[
                            styles.pickerItemCheck,
                            {backgroundColor: `${m.color}25`},
                          ]}>
                          <CheckIcon size={12} color={m.color} />
                        </View>
                      )}
                    </TouchableScale>
                  );
                })
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.primaryLight,
  },
  bannerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: `${AppColors.purple}10`,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: `${AppColors.purple}20`,
  },
  bannerIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: `${AppColors.purple}20`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bannerTitle: {
    fontFamily: AppFonts.interBold,
    fontSize: 13.5,
    lineHeight: 18,
    color: AppColors.purple,
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: `${AppColors.liveGreen}20`,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: `${AppColors.liveGreen}40`,
  },
  liveDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: AppColors.liveGreen,
  },
  liveText: {
    fontFamily: AppFonts.interBold,
    fontSize: 8.5,
    color: AppColors.liveGreen,
  },
  bannerSub: {
    fontFamily: AppFonts.interRegular,
    fontSize: 11,
    lineHeight: 15,
    color: AppColors.grayText,
    marginTop: 2,
  },
  scrollContent: {
    flex: 1,
  },
  scrollInner: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 24,
  },
  sectionLabel: {
    fontFamily: AppFonts.interBold,
    fontSize: 10.5,
    color: AppColors.grayTextStrong,
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    marginBottom: 8,
  },
  clearChipsText: {
    fontFamily: AppFonts.interSemiBold,
    fontSize: 11,
    color: AppColors.purple,
  },

  /* Module Trigger Card */
  moduleTriggerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: AppColors.grayBackground,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: AppColors.dividerColor,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
    shadowColor: AppColors.black,
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  moduleTriggerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 8,
  },
  moduleIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moduleIconText: {
    fontSize: 18,
  },
  moduleNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  moduleNameText: {
    fontFamily: AppFonts.interBold,
    fontSize: 13,
    color: AppColors.primaryBlack,
  },
  moduleCategoryBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
  },
  moduleCategoryBadgeText: {
    fontFamily: AppFonts.interSemiBold,
    fontSize: 9,
    letterSpacing: 0.2,
  },
  moduleDescText: {
    fontFamily: AppFonts.interRegular,
    fontSize: 10.5,
    color: AppColors.grayTextWeak,
    marginTop: 2,
  },
  changeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: `${AppColors.purple}14`,
    paddingHorizontal: 8,
    paddingVertical: 4.5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: `${AppColors.purple}30`,
  },
  changeBadgeText: {
    fontFamily: AppFonts.interSemiBold,
    fontSize: 10.5,
    color: AppColors.purple,
  },

  /* Preset Chips */
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
    marginBottom: 14,
  },
  presetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 6.5,
    paddingHorizontal: 11,
    borderRadius: 8,
    backgroundColor: AppColors.grayBackground,
    borderWidth: 1.2,
    borderColor: AppColors.dividerColor,
  },
  presetChipSelected: {
    shadowColor: AppColors.black,
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  presetChipCheck: {
    fontFamily: AppFonts.interBold,
    fontSize: 11,
    color: AppColors.grayTextWeak,
  },
  presetChipText: {
    fontFamily: AppFonts.interMedium,
    fontSize: 11.5,
    lineHeight: 15,
    color: AppColors.primaryBlack,
  },
  presetChipTextSelected: {
    fontFamily: AppFonts.interSemiBold,
  },

  /* Categories */
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: AppColors.grayBackground,
    borderWidth: 1.5,
    borderColor: AppColors.dividerColor,
  },
  categoryIcon: {
    fontSize: 13,
  },
  categoryText: {
    fontFamily: AppFonts.interMedium,
    fontSize: 12,
    lineHeight: 16,
    color: AppColors.grayText,
  },

  /* Mood Card */
  moodCard: {
    backgroundColor: AppColors.grayBackground,
    borderRadius: 12,
    padding: 8,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: AppColors.dividerColor,
  },
  moodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4,
  },
  moodButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 2,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  moodButtonSelected: {
    shadowColor: AppColors.black,
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  moodEmoji: {
    fontSize: 22,
    marginBottom: 4,
  },
  moodLabel: {
    fontFamily: AppFonts.interMedium,
    fontSize: 9.5,
    color: AppColors.grayText,
    textAlign: 'center',
  },

  /* Input */
  inputWrapper: {
    backgroundColor: AppColors.grayBackground,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: AppColors.dividerColor,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 70,
    marginBottom: 12,
  },
  textInput: {
    fontFamily: AppFonts.interRegular,
    fontSize: 12.5,
    lineHeight: 18,
    color: AppColors.primaryBlack,
    padding: 0,
    minHeight: 54,
  },

  /* Diagnostics */
  diagnosticsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: `${AppColors.purple}0C`,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: `${AppColors.purple}20`,
  },
  diagnosticsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    flex: 1,
    marginRight: 6,
  },
  diagnosticsPillTitle: {
    fontFamily: AppFonts.interMedium,
    fontSize: 11,
    color: AppColors.purple,
    flexShrink: 1,
  },
  diagnosticsArrow: {
    fontFamily: AppFonts.interSemiBold,
    fontSize: 10.5,
    color: AppColors.purple,
  },
  diagnosticsBox: {
    backgroundColor: '#1E1B2E',
    borderRadius: 8,
    padding: 10,
    marginTop: 6,
    borderWidth: 1,
    borderColor: AppColors.dividerColor,
  },
  diagnosticsText: {
    fontFamily: AppFonts.interRegular,
    fontSize: 11,
    color: '#E2DFEB',
    lineHeight: 17,
  },

  /* Footer */
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 34 : 14,
    borderTopWidth: 1,
    borderTopColor: AppColors.dividerColor,
    backgroundColor: AppColors.primaryLight,
    gap: 10,
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 8,
    paddingHorizontal: 11,
    borderRadius: 8,
    backgroundColor: AppColors.grayBackground,
    borderWidth: 1,
    borderColor: AppColors.dividerColor,
  },
  githubPillBtn: {
    backgroundColor: `${AppColors.black}08`,
  },
  actionPillText: {
    fontFamily: AppFonts.interSemiBold,
    fontSize: 11.5,
    color: AppColors.grayTextStrong,
  },
  primarySubmitBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: AppColors.purple,
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 8,
    shadowColor: AppColors.purple,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  primarySubmitBtnText: {
    fontFamily: AppFonts.interBold,
    fontSize: 12.5,
    color: AppColors.white,
  },

  /* Dedicated Picker Modal */
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  pickerModalContainer: {
    backgroundColor: AppColors.primaryLight,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '82%',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    shadowColor: AppColors.black,
    shadowOffset: {width: 0, height: -4},
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 20,
  },
  pickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  pickerHeaderTitle: {
    fontFamily: AppFonts.interBold,
    fontSize: 15,
    color: AppColors.primaryBlack,
  },
  pickerHeaderSub: {
    fontFamily: AppFonts.interRegular,
    fontSize: 11,
    color: AppColors.grayText,
    marginTop: 1,
  },
  pickerCloseBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: `${AppColors.black}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerSearchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.grayBackground,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: AppColors.dividerColor,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 8,
    marginBottom: 12,
  },
  pickerSearchInput: {
    flex: 1,
    fontFamily: AppFonts.interRegular,
    fontSize: 13,
    color: AppColors.primaryBlack,
    padding: 0,
  },
  pickerClearSearchText: {
    fontFamily: AppFonts.interBold,
    fontSize: 12,
    color: AppColors.grayTextWeak,
    paddingHorizontal: 4,
  },
  pickerListScroll: {
    maxHeight: 380,
  },
  emptySearchWrap: {
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptySearchText: {
    fontFamily: AppFonts.interMedium,
    fontSize: 12,
    color: AppColors.grayTextWeak,
  },
  pickerItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 10,
    borderRadius: 10,
    backgroundColor: AppColors.grayBackground,
    borderWidth: 1.5,
    borderColor: AppColors.dividerColor,
    marginBottom: 8,
  },
  pickerItemCardSelected: {
    shadowColor: AppColors.black,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  pickerItemIconBox: {
    width: 36,
    height: 36,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerItemTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  pickerItemTitle: {
    fontFamily: AppFonts.interSemiBold,
    fontSize: 12.5,
    color: AppColors.primaryBlack,
  },
  pickerItemDesc: {
    fontFamily: AppFonts.interRegular,
    fontSize: 10.5,
    lineHeight: 14,
    color: AppColors.grayTextWeak,
  },
  pickerItemCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default FeedbackModal;
