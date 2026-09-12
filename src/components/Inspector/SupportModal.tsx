import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  Linking,
  ScrollView,
} from 'react-native';
import TouchableScale from '../TouchableScale';
import {AppColors} from '../../styles/AppColors';
import {AppFonts} from '../../styles/AppFonts';
import {
  SupportIcon,
  CloseWhite,
  ExternalLinkIcon,
  StarIcon,
  BugIcon,
  BookOpenIcon,
} from '../NetworkIcons';
import {triggerNativeHaptic} from '../../native/NativeInspector';
import {useTranslation} from '../../i18n';

interface SupportModalProps {
  visible: boolean;
  onClose: () => void;
}

export const SupportModal: React.FC<SupportModalProps> = ({
  visible,
  onClose,
}) => {
  const {t} = useTranslation();
  if (!visible) return null;

  const openUrl = async (url: string) => {
    try {
      triggerNativeHaptic('light');
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      }
    } catch {}
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.headerIconBadge}>
                <SupportIcon size={20} color={AppColors.purple} />
              </View>
              <View>
                <Text style={styles.title}>
                  {t('support.title', 'Support & Community')}
                </Text>
                <Text style={styles.subtitle}>
                  {t('support.subtitle', 'React Native In-App Inspector')}
                </Text>
              </View>
            </View>

            <TouchableScale onPress={onClose} hitSlop={10} style={styles.closeBtn}>
              <CloseWhite size={12} color={AppColors.grayText} />
            </TouchableScale>
          </View>

          {/* List of Support Actions */}
          <ScrollView
            style={styles.scrollList}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}>
            {/* Sponsor Card (Highlight) */}
            <TouchableScale
              onPress={() => openUrl('https://github.com/sponsors/vengatmacuser')}
              style={[styles.itemCard, styles.itemCardHighlight]}>
              <View style={[styles.itemIconWrap, styles.sponsorIconWrap]}>
                <Text style={styles.emojiIcon}>💖</Text>
              </View>
              <View style={styles.itemTextCol}>
                <View style={styles.itemTitleRow}>
                  <Text style={[styles.itemTitle, styles.sponsorTitle]}>
                    {t('support.sponsor', 'Sponsor on GitHub')}
                  </Text>
                  <View style={styles.heartBadge}>
                    <Text style={styles.heartBadgeText}>
                      {t('support.sponsorBadge', 'SPONSOR')}
                    </Text>
                  </View>
                </View>
                <Text style={styles.itemDesc}>
                  {t('support.sponsorDesc', 'Support ongoing maintenance, new features and release improvements.')}
                </Text>
              </View>
              <ExternalLinkIcon size={14} color={AppColors.pink600} />
            </TouchableScale>

            {/* Star on GitHub */}
            <TouchableScale
              onPress={() => openUrl('https://github.com/vengatmacuser/react-native-inapp-inspector')}
              style={styles.itemCard}>
              <View style={[styles.itemIconWrap, styles.starIconWrap]}>
                <StarIcon size={18} color={AppColors.amber600} />
              </View>
              <View style={styles.itemTextCol}>
                <Text style={styles.itemTitle}>
                  {t('support.star', 'Star on GitHub')}
                </Text>
                <Text style={styles.itemDesc}>
                  {t('support.starDesc', 'Star our repo to help more React Native developers discover this tool.')}
                </Text>
              </View>
              <ExternalLinkIcon size={14} color={AppColors.grayTextWeak} />
            </TouchableScale>

            {/* Report an Issue / Feature Request */}
            <TouchableScale
              onPress={() => openUrl('https://github.com/vengatmacuser/react-native-inapp-inspector/issues')}
              style={styles.itemCard}>
              <View style={[styles.itemIconWrap, styles.bugIconWrap]}>
                <BugIcon size={18} color={AppColors.purple} />
              </View>
              <View style={styles.itemTextCol}>
                <Text style={styles.itemTitle}>
                  {t('support.issues', 'Report Issue / Suggestion')}
                </Text>
                <Text style={styles.itemDesc}>
                  {t('support.issuesDesc', 'Found a bug or have an idea? Open an issue on GitHub.')}
                </Text>
              </View>
              <ExternalLinkIcon size={14} color={AppColors.grayTextWeak} />
            </TouchableScale>

            {/* Documentation & Website */}
            <TouchableScale
              onPress={() => openUrl('https://vengatmacuser.github.io/react-native-inapp-inspector/')}
              style={styles.itemCard}>
              <View style={[styles.itemIconWrap, styles.docsIconWrap]}>
                <BookOpenIcon size={18} color={AppColors.sky600} />
              </View>
              <View style={styles.itemTextCol}>
                <Text style={styles.itemTitle}>
                  {t('support.docs', 'Official Documentation')}
                </Text>
                <Text style={styles.itemDesc}>
                  {t('support.docsDesc', 'Interactive feature tour, search syntax & configuration guides.')}
                </Text>
              </View>
              <ExternalLinkIcon size={14} color={AppColors.grayTextWeak} />
            </TouchableScale>

            {/* Contact Maintainer */}
            <TouchableScale
              onPress={() => openUrl('mailto:vengatmacuser@gmail.com')}
              style={styles.itemCard}>
              <View style={[styles.itemIconWrap, styles.contactIconWrap]}>
                <Text style={styles.mailEmoji}>✉️</Text>
              </View>
              <View style={styles.itemTextCol}>
                <Text style={styles.itemTitle}>
                  {t('support.contact', 'Contact Author')}
                </Text>
                <Text style={styles.itemDesc}>
                  {t('support.contactDesc', 'vengatmacuser@gmail.com • Direct support & enterprise inquiries.')}
                </Text>
              </View>
              <ExternalLinkIcon size={14} color={AppColors.grayTextWeak} />
            </TouchableScale>
          </ScrollView>

          {/* Footer Dismiss Button */}
          <View style={styles.footer}>
            <TouchableScale
              onPress={onClose}
              style={styles.doneBtn}>
              <Text style={styles.doneBtnText}>{t('common.close', 'Close')}</Text>
            </TouchableScale>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: `${AppColors.slate900}B0`,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 18,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    maxHeight: '82%',
    backgroundColor: AppColors.white,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: `${AppColors.white}CC`,
    ...Platform.select({
      ios: {
        shadowColor: AppColors.slate900,
        shadowOffset: {width: 0, height: 16},
        shadowOpacity: 0.3,
        shadowRadius: 28,
      },
      android: {
        elevation: 16,
      },
    }),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: AppColors.grayBorderSecondary,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: AppColors.purple50,
    borderWidth: 1,
    borderColor: AppColors.purple200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: AppFonts.interBold,
    fontSize: 15.5,
    color: AppColors.slate900,
  },
  subtitle: {
    fontFamily: AppFonts.interRegular,
    fontSize: 11.5,
    color: AppColors.grayTextWeak,
    marginTop: 1,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: AppColors.graySurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollList: {
    maxHeight: 380,
  },
  scrollContent: {
    padding: 16,
    gap: 10,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    backgroundColor: AppColors.grayBackground,
    borderWidth: 1,
    borderColor: AppColors.grayBorderSecondary,
    gap: 12,
  },
  itemCardHighlight: {
    backgroundColor: `${AppColors.pink100}55`,
    borderColor: `${AppColors.pink400}66`,
  },
  itemIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sponsorIconWrap: {
    backgroundColor: AppColors.pink100,
    borderColor: `${AppColors.pink400}80`,
  },
  starIconWrap: {
    backgroundColor: AppColors.amber100,
    borderColor: AppColors.amber200,
  },
  bugIconWrap: {
    backgroundColor: AppColors.purple50,
    borderColor: AppColors.purple200,
  },
  docsIconWrap: {
    backgroundColor: AppColors.sky100,
    borderColor: `${AppColors.sky600}40`,
  },
  contactIconWrap: {
    backgroundColor: AppColors.graySurface,
    borderColor: AppColors.grayBorderSecondary,
  },
  emojiIcon: {
    fontSize: 18,
  },
  mailEmoji: {
    fontSize: 16,
  },
  itemTextCol: {
    flex: 1,
  },
  itemTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  itemTitle: {
    fontFamily: AppFonts.interBold,
    fontSize: 13,
    color: AppColors.slate900,
  },
  sponsorTitle: {
    color: AppColors.pink600,
  },
  itemDesc: {
    fontFamily: AppFonts.interRegular,
    fontSize: 11,
    color: AppColors.grayTextWeak,
    marginTop: 2,
    lineHeight: 15,
  },
  heartBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
    backgroundColor: AppColors.pink100,
    borderWidth: 0.5,
    borderColor: AppColors.pink400,
  },
  heartBadgeText: {
    fontFamily: AppFonts.interBold,
    fontSize: 9,
    color: AppColors.pink600,
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: AppColors.grayBorderSecondary,
    backgroundColor: AppColors.white,
  },
  doneBtn: {
    height: 42,
    borderRadius: 12,
    backgroundColor: AppColors.purple,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneBtnText: {
    fontFamily: AppFonts.interBold,
    fontSize: 13.5,
    color: AppColors.white,
  },
});
