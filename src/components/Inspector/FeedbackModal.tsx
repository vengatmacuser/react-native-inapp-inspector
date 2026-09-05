import React, {useState, useEffect} from 'react';
import {
  Alert,
  Dimensions,
  PixelRatio,
  Platform,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
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
import {
  HeadphonesIcon,
  SendIcon,
  StarIcon,
  CopyIcon,
  InfoCircleIcon,
  CheckIcon,
} from '../NetworkIcons';

const DEVELOPER_EMAIL = 'vengatmacuser@gmail.com';

export interface FeedbackModalProps {
  visible?: boolean;
  onClose: () => void;
}

type FeedbackCategory = 'feedback' | 'bug' | 'feature' | 'performance' | 'help';

const CATEGORIES: {key: FeedbackCategory; label: string; icon: string}[] = [
  {key: 'feedback', label: 'Feedback', icon: '💬'},
  {key: 'bug', label: 'Bug Report', icon: '🐛'},
  {key: 'feature', label: 'Feature Request', icon: '✨'},
  {key: 'performance', label: 'Performance', icon: '⚡'},
  {key: 'help', label: 'Support / Help', icon: '❓'},
];

const RATING_LABELS = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent!'];

export const FeedbackModal: React.FC<FeedbackModalProps> = ({onClose}) => {
  const [category, setCategory] = useState<FeedbackCategory>('feedback');
  const [rating, setRating] = useState<number>(5);
  const [subject, setSubject] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [showDiagnostics, setShowDiagnostics] = useState<boolean>(false);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [copiedDraft, setCopiedDraft] = useState<boolean>(false);

  useEffect(() => {
    trackTelemetryEvent('feedback_modal_opened', {category});
  }, []);

  const appName = getAppName() || 'React Native App';
  const bundleId = getBundleIdentifier() || 'unknown';
  const appVersion = getAppVersionAndBuild() || '1.0.0';
  const {width, height} = Dimensions.get('window');

  const getDiagnosticsText = () => {
    return [
      `• Package: react-native-inapp-inspector@${LIB_VERSION}`,
      `• Platform: ${Platform.OS.toUpperCase()} (${Platform.Version})`,
      `• App: ${appName} (${bundleId}) v${appVersion}`,
      `• Screen: ${Math.round(width)} x ${Math.round(height)} (Scale ${PixelRatio.get()})`,
      `• Timestamp: ${new Date().toISOString()}`,
    ].join('\n');
  };

  const buildEmailDraft = () => {
    const activeCat = CATEGORIES.find(c => c.key === category)?.label || category;
    const emailSubject = `[In-App Inspector] [${activeCat}] ${subject.trim() || 'User Feedback'}`;
    const bodyLines = [
      `Category: ${activeCat}`,
      `Rating: ${rating} / 5 (${RATING_LABELS[rating] || ''})`,
      ...(subject.trim() ? [`Subject: ${subject.trim()}`] : []),
      '',
      'Feedback / Message:',
      message.trim() || '(No message provided)',
      '',
      '----------------------------------------',
      'System & Diagnostic Info:',
      getDiagnosticsText(),
      '----------------------------------------',
    ];
    return {
      activeCat,
      subject: emailSubject,
      body: bodyLines.join('\n'),
    };
  };

  const handleCopyDraft = () => {
    const draft = buildEmailDraft();
    const fullText = `To: ${DEVELOPER_EMAIL}\nSubject: ${draft.subject}\n\n${draft.body}`;
    copyToClipboard(fullText, 'Email Draft & Diagnostics');
    setCopiedDraft(true);
    setTimeout(() => setCopiedDraft(false), 2000);
    showToast('Feedback draft copied to clipboard');
  };

  const handleSendEmail = async () => {
    if (isSending) return;
    setIsSending(true);

    try {
      const draft = buildEmailDraft();
      const mailtoUrl = `mailto:${DEVELOPER_EMAIL}?subject=${encodeURIComponent(
        draft.subject,
      )}&body=${encodeURIComponent(draft.body)}`;

      // Track telemetry event
      trackTelemetryEvent('feedback_submitted', {
        category,
        rating,
        has_subject: Boolean(subject.trim()),
        has_message: Boolean(message.trim()),
      });

      let opened = false;
      try {
        const canOpen = await Linking.canOpenURL(mailtoUrl);
        if (canOpen) {
          await Linking.openURL(mailtoUrl);
          opened = true;
        } else {
          await Linking.openURL(mailtoUrl);
          opened = true;
        }
      } catch (err) {
        opened = false;
      }

      if (opened) {
        showToast('Opening mail client...');
        onClose();
      } else {
        // Fallback: Copy to clipboard and alert user with action options
        const fullDraft = `To: ${DEVELOPER_EMAIL}\nSubject: ${draft.subject}\n\n${draft.body}`;
        copyToClipboard(fullDraft, 'Feedback Draft');
        Alert.alert(
          'Email Client Not Available',
          `Your feedback and diagnostics have been copied to the clipboard!\n\nYou can paste and send directly to:\n${DEVELOPER_EMAIL}`,
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
      {/* Top Banner inside sheet */}
      <View style={styles.bannerBar}>
        <View style={styles.bannerIconBox}>
          <HeadphonesIcon size={18} color={AppColors.purple} />
        </View>
        <View style={{flex: 1}}>
          <Text style={styles.bannerTitle}>Share your feedback or report an issue</Text>
          <Text style={styles.bannerSub}>
            Direct communication with the maintainers. Diagnostic info is auto-attached.
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollContent}
        contentContainerStyle={styles.scrollInner}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        {/* Category selection */}
        <Text style={styles.sectionLabel}>WHAT CAN WE HELP WITH?</Text>
        <View style={styles.categoryGrid}>
          {CATEGORIES.map(cat => {
            const isSelected = category === cat.key;
            return (
              <TouchableOpacity
                key={cat.key}
                activeOpacity={0.7}
                onPress={() => setCategory(cat.key)}
                style={[
                  styles.categoryChip,
                  isSelected && styles.categoryChipSelected,
                ]}>
                <Text style={styles.categoryIcon}>{cat.icon}</Text>
                <Text
                  style={[
                    styles.categoryText,
                    isSelected && styles.categoryTextSelected,
                  ]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Rating Stars */}
        <View style={styles.ratingCard}>
          <View style={styles.ratingHeader}>
            <Text style={styles.ratingTitle}>Rate your experience</Text>
            {rating > 0 && (
              <Text style={styles.ratingBadge}>
                {RATING_LABELS[rating]}
              </Text>
            )}
          </View>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map(star => {
              const filled = star <= rating;
              return (
                <TouchableOpacity
                  key={star}
                  activeOpacity={0.7}
                  onPress={() => setRating(star)}
                  style={styles.starTouch}>
                  <StarIcon
                    size={26}
                    color={filled ? '#FFB800' : AppColors.grayTextWeak}
                  />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Subject Input */}
        <Text style={styles.sectionLabel}>SUBJECT (OPTIONAL)</Text>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.textInput}
            placeholder="Brief summary..."
            placeholderTextColor={AppColors.grayTextWeak}
            value={subject}
            onChangeText={setSubject}
            maxLength={80}
          />
        </View>

        {/* Message Input */}
        <Text style={styles.sectionLabel}>YOUR MESSAGE / DETAILS</Text>
        <View style={[styles.inputWrapper, styles.textareaWrapper]}>
          <TextInput
            style={[styles.textInput, styles.textarea]}
            placeholder="Describe your issue, feature request, or suggestion in detail..."
            placeholderTextColor={AppColors.grayTextWeak}
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Diagnostics Card */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setShowDiagnostics(!showDiagnostics)}
          style={styles.diagnosticsToggle}>
          <View style={styles.diagnosticsHeader}>
            <InfoCircleIcon size={14} color={AppColors.purple} />
            <Text style={styles.diagnosticsTitle}>
              Diagnostics & System Details (Auto-attached)
            </Text>
          </View>
          <Text style={styles.diagnosticsArrow}>
            {showDiagnostics ? '▲' : '▼'}
          </Text>
        </TouchableOpacity>

        {showDiagnostics && (
          <View style={styles.diagnosticsBox}>
            <Text style={styles.diagnosticsText}>
              {getDiagnosticsText()}
            </Text>
          </View>
        )}

        {/* Recipient Notice */}
        <View style={styles.recipientBadge}>
          <Text style={styles.recipientText}>
            📧 Emails to: <Text style={styles.recipientHighlight}>{DEVELOPER_EMAIL}</Text>
          </Text>
        </View>
      </ScrollView>

      {/* Footer Actions */}
      <View style={styles.footer}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleCopyDraft}
          style={styles.copyDraftBtn}>
          {copiedDraft ? (
            <CheckIcon size={14} color={AppColors.emerald500} />
          ) : (
            <CopyIcon size={14} color={AppColors.grayText} />
          )}
          <Text
            style={[
              styles.copyDraftBtnText,
              copiedDraft && {color: AppColors.emerald500},
            ]}>
            {copiedDraft ? 'Copied!' : 'Copy Draft'}
          </Text>
        </TouchableOpacity>

        <View style={styles.footerRight}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onClose}
            style={styles.cancelBtn}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleSendEmail}
            style={styles.submitBtn}>
            <SendIcon size={16} color={AppColors.white} />
            <Text style={styles.submitBtnText}>
              {isSending ? 'Sending...' : 'Send via Email'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
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
    gap: 10,
    backgroundColor: `${AppColors.purple}12`,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: `${AppColors.purple}20`,
  },
  bannerIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: `${AppColors.purple}20`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerTitle: {
    fontFamily: AppFonts.interSemiBold,
    fontSize: 12.5,
    color: AppColors.purple,
  },
  bannerSub: {
    fontFamily: AppFonts.interRegular,
    fontSize: 10.5,
    color: AppColors.grayText,
    marginTop: 1,
  },
  scrollContent: {
    flex: 1,
  },
  scrollInner: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
  },
  sectionLabel: {
    fontFamily: AppFonts.interSemiBold,
    fontSize: 10.5,
    color: AppColors.grayText,
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 10,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingBottom: 4,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: AppColors.grayBackground,
    borderWidth: 1,
    borderColor: AppColors.dividerColor,
  },
  categoryChipSelected: {
    backgroundColor: `${AppColors.purple}15`,
    borderColor: AppColors.purple,
  },
  categoryIcon: {
    fontSize: 13,
  },
  categoryText: {
    fontFamily: AppFonts.interMedium,
    fontSize: 12,
    color: AppColors.grayText,
  },
  categoryTextSelected: {
    color: AppColors.purple,
    fontFamily: AppFonts.interSemiBold,
  },
  ratingCard: {
    backgroundColor: AppColors.grayBackground,
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: AppColors.dividerColor,
  },
  ratingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  ratingTitle: {
    fontFamily: AppFonts.interSemiBold,
    fontSize: 12.5,
    color: AppColors.primaryBlack,
  },
  ratingBadge: {
    fontFamily: AppFonts.interSemiBold,
    fontSize: 11,
    color: '#D97706',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
  },
  starTouch: {
    padding: 2,
  },
  inputWrapper: {
    backgroundColor: AppColors.grayBackground,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: AppColors.dividerColor,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  textareaWrapper: {
    minHeight: 88,
    paddingVertical: 10,
  },
  textInput: {
    fontFamily: AppFonts.interRegular,
    fontSize: 13,
    color: AppColors.primaryBlack,
    padding: 0,
  },
  textarea: {
    height: 72,
  },
  diagnosticsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: `${AppColors.purple}10`,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginTop: 14,
    borderWidth: 1,
    borderColor: `${AppColors.purple}25`,
  },
  diagnosticsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  diagnosticsTitle: {
    fontFamily: AppFonts.interMedium,
    fontSize: 11.5,
    color: AppColors.purple,
  },
  diagnosticsArrow: {
    fontSize: 10,
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
  recipientBadge: {
    marginTop: 12,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: AppColors.grayBackground,
    borderWidth: 1,
    borderColor: AppColors.dividerColor,
    alignSelf: 'flex-start',
  },
  recipientText: {
    fontFamily: AppFonts.interRegular,
    fontSize: 11,
    color: AppColors.grayText,
  },
  recipientHighlight: {
    fontFamily: AppFonts.interSemiBold,
    color: AppColors.purple,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 14,
    borderTopWidth: 1,
    borderTopColor: AppColors.dividerColor,
    backgroundColor: AppColors.primaryLight,
  },
  copyDraftBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: AppColors.grayBackground,
    borderWidth: 1,
    borderColor: AppColors.dividerColor,
  },
  copyDraftBtnText: {
    fontFamily: AppFonts.interMedium,
    fontSize: 11.5,
    color: AppColors.grayText,
  },
  footerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: AppColors.grayBackground,
    borderWidth: 1,
    borderColor: AppColors.dividerColor,
  },
  cancelBtnText: {
    fontFamily: AppFonts.interMedium,
    fontSize: 12.5,
    color: AppColors.grayText,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: AppColors.purple,
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 8,
    shadowColor: AppColors.purple,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  submitBtnText: {
    fontFamily: AppFonts.interSemiBold,
    fontSize: 12.5,
    color: AppColors.white,
  },
});

export default FeedbackModal;
