import React from 'react';
import {
  Linking,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {AppColors} from '../../styles/AppColors';
import {AppFonts} from '../../styles/AppFonts';
import TouchableScale from '../TouchableScale';
import {LIB_VERSION} from '../../constants/version';
import {copyToClipboard, showToast} from '../../helpers';
import {useTranslation} from '../../i18n';
import {triggerNativeHaptic} from '../../native/NativeInspector';
import {
  BookOpenIcon,
  BugIcon,
  CopyIcon,
  ExternalLinkIcon,
  GitHubIcon,
  HeartIcon,
  NpmIcon,
  ShareIcon,
  StarIcon,
} from '../NetworkIcons';

export interface SupportPageProps {
  onClose?: () => void;
}

export const SupportPage: React.FC<SupportPageProps> = () => {
  const {t} = useTranslation();

  const openUrl = async (url: string) => {
    try {
      triggerNativeHaptic('light');
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      }
    } catch {}
  };

  const handleShare = async () => {
    try {
      triggerNativeHaptic('medium');
      await Share.share({
        title: 'React Native In-App Inspector',
        message:
          'Check out react-native-inapp-inspector — the zero-config in-app debugger for React Native & Expo:\nhttps://github.com/vengatmacuser/react-native-inapp-inspector',
        url: 'https://github.com/vengatmacuser/react-native-inapp-inspector',
      });
    } catch {}
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* ─── Hero Card ─── */}
        <View style={styles.heroCard}>
          <View style={styles.heroHeaderRow}>
            <View style={styles.heroIconBox}>
              <HeartIcon color={AppColors.red500} size={28} />
            </View>
            <View style={styles.heroTitleCol}>
              <View style={styles.heroTitleRow}>
                <Text style={styles.heroTitle}>
                  {t('support.title', 'Support & Community')}
                </Text>
                <View style={styles.versionBadge}>
                  <Text style={styles.versionBadgeText}>v{LIB_VERSION}</Text>
                </View>
              </View>
              <Text style={styles.heroSubTitle}>
                {t('support.subtitle', 'React Native In-App Inspector')}
              </Text>
            </View>
          </View>

          <Text style={styles.heroDescription}>
            {t(
              'support.heroDescription',
              'Crafted with passion to provide an all-in-one on-device debugging suite for mobile teams worldwide. Your sponsorship, stars, and feedback directly fuel continuous improvements, native architecture support, and rapid releases.',
            )}
          </Text>

          {/* Quick Pill Badges */}
          <View style={styles.pillRow}>
            <View style={styles.pillBadge}>
              <Text style={styles.pillBadgeText}>MIT LICENSE</Text>
            </View>
            <View style={styles.pillBadge}>
              <Text style={styles.pillBadgeText}>ZERO CONFIG</Text>
            </View>
            <View style={styles.pillBadge}>
              <Text style={styles.pillBadgeText}>FABRIC & TURBO</Text>
            </View>
          </View>
        </View>

        {/* ─── Sponsor on GitHub Spotlight Card ─── */}
        <View style={styles.sponsorCard}>
          <View style={styles.sponsorTopRow}>
            <View style={styles.sponsorIconWrap}>
              <HeartIcon color={AppColors.red500} size={22} />
            </View>
            <View style={styles.sponsorTextWrap}>
              <View style={styles.sponsorTitleRow}>
                <Text style={styles.sponsorTitle}>
                  {t('support.sponsor', 'Sponsor on GitHub')}
                </Text>
                <View style={styles.sponsorPill}>
                  <Text style={styles.sponsorPillText}>
                    {t('support.sponsorBadge', 'SPONSOR')}
                  </Text>
                </View>
              </View>
              <Text style={styles.sponsorDesc}>
                {t(
                  'support.sponsorDesc',
                  'Support ongoing maintenance, new features and release improvements.',
                )}
              </Text>
            </View>
          </View>

          <View style={styles.sponsorActionsRow}>
            <TouchableScale
              onPress={() => openUrl('https://github.com/sponsors/vengatmacuser')}
              style={styles.primarySponsorBtn}>
              <HeartIcon color={AppColors.white} size={15} />
              <Text style={styles.primarySponsorBtnText}>
                {t('support.sponsorBtn', 'Become a Sponsor')}
              </Text>
              <ExternalLinkIcon size={12} color={AppColors.white} />
            </TouchableScale>

            <TouchableScale
              onPress={() => {
                copyToClipboard(
                  'https://github.com/sponsors/vengatmacuser',
                  'Sponsor URL',
                );
                showToast(
                  t('support.copiedSponsor', 'Copied GitHub Sponsors link!'),
                );
              }}
              style={styles.secondaryBtn}>
              <CopyIcon size={14} color={AppColors.grayText} />
              <Text style={styles.secondaryBtnText}>
                {t('common.copy', 'Copy Link')}
              </Text>
            </TouchableScale>
          </View>
        </View>

        {/* ─── Ways to Support & Contribute ─── */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>
            {t('support.waysToSupport', 'WAYS TO CONTRIBUTE & SUPPORT')}
          </Text>

          <View style={styles.actionsList}>
            {/* Star on GitHub */}
            <TouchableScale
              onPress={() =>
                openUrl(
                  'https://github.com/vengatmacuser/react-native-inapp-inspector',
                )
              }
              style={styles.itemCard}>
              <View style={[styles.itemIconWrap, styles.starIconWrap]}>
                <StarIcon size={18} color={AppColors.amber600} />
              </View>
              <View style={styles.itemTextCol}>
                <View style={styles.itemTitleRow}>
                  <Text style={styles.itemTitle}>
                    {t('support.star', 'Star on GitHub')}
                  </Text>
                  <View style={styles.badgeAmber}>
                    <Text style={styles.badgeAmberText}>RECOMMENDED</Text>
                  </View>
                </View>
                <Text style={styles.itemDesc}>
                  {t(
                    'support.starDesc',
                    'Star our repo to help more React Native developers discover this tool.',
                  )}
                </Text>
              </View>
              <ExternalLinkIcon size={14} color={AppColors.grayTextWeak} />
            </TouchableScale>

            {/* Report an Issue */}
            <TouchableScale
              onPress={() =>
                openUrl(
                  'https://github.com/vengatmacuser/react-native-inapp-inspector/issues',
                )
              }
              style={styles.itemCard}>
              <View style={[styles.itemIconWrap, styles.bugIconWrap]}>
                <BugIcon size={18} color={AppColors.purple} />
              </View>
              <View style={styles.itemTextCol}>
                <Text style={styles.itemTitle}>
                  {t('support.issues', 'Report Issue / Suggestion')}
                </Text>
                <Text style={styles.itemDesc}>
                  {t(
                    'support.issuesDesc',
                    'Found a bug or have an idea? Open an issue on GitHub.',
                  )}
                </Text>
              </View>
              <ExternalLinkIcon size={14} color={AppColors.grayTextWeak} />
            </TouchableScale>

            {/* Documentation & Website */}
            <TouchableScale
              onPress={() =>
                openUrl(
                  'https://vengatmacuser.github.io/react-native-inapp-inspector/',
                )
              }
              style={styles.itemCard}>
              <View style={[styles.itemIconWrap, styles.docsIconWrap]}>
                <BookOpenIcon size={18} color={AppColors.sky600} />
              </View>
              <View style={styles.itemTextCol}>
                <Text style={styles.itemTitle}>
                  {t('support.docs', 'Official Documentation')}
                </Text>
                <Text style={styles.itemDesc}>
                  {t(
                    'support.docsDesc',
                    'Interactive feature tour, search syntax & configuration guides.',
                  )}
                </Text>
              </View>
              <ExternalLinkIcon size={14} color={AppColors.grayTextWeak} />
            </TouchableScale>

            {/* NPM Registry */}
            <TouchableScale
              onPress={() =>
                openUrl(
                  'https://www.npmjs.com/package/react-native-inapp-inspector',
                )
              }
              style={styles.itemCard}>
              <View style={[styles.itemIconWrap, styles.npmIconWrap]}>
                <NpmIcon size={18} color={AppColors.red500} />
              </View>
              <View style={styles.itemTextCol}>
                <Text style={styles.itemTitle}>
                  {t('support.npmRegistry', 'NPM Package Registry')}
                </Text>
                <Text style={styles.itemDesc}>
                  {t(
                    'support.npmRegistryDesc',
                    'Explore published version release notes, tarball sizes, and install stats.',
                  )}
                </Text>
              </View>
              <ExternalLinkIcon size={14} color={AppColors.grayTextWeak} />
            </TouchableScale>
          </View>
        </View>

        {/* ─── Share with Team ─── */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>
            {t('support.shareTitle', 'SPREAD THE WORD')}
          </Text>
          <Text style={styles.shareSubtitle}>
            {t(
              'support.shareDesc',
              'Help your engineering teammates and QA specialists debug network, console logs, and Redux faster.',
            )}
          </Text>
          <View style={styles.shareButtonsRow}>
            <TouchableScale onPress={handleShare} style={styles.sharePrimaryBtn}>
              <ShareIcon size={15} color={AppColors.white} />
              <Text style={styles.sharePrimaryBtnText}>
                {t('support.shareWithTeam', 'Share with Teammates')}
              </Text>
            </TouchableScale>

            <TouchableScale
              onPress={() => {
                copyToClipboard(
                  'https://github.com/vengatmacuser/react-native-inapp-inspector',
                  'Repository Link',
                );
                showToast(t('support.copiedRepo', 'Copied repository link!'));
              }}
              style={styles.shareSecondaryBtn}>
              <CopyIcon size={14} color={AppColors.grayText} />
              <Text style={styles.shareSecondaryBtnText}>
                {t('support.copyRepo', 'Copy Repo URL')}
              </Text>
            </TouchableScale>
          </View>
        </View>

        {/* ─── Maintainer & Author ─── */}
        <View style={styles.authorCard}>
          <Text style={styles.sectionHeader}>
            {t('support.maintainer', 'PROJECT MAINTAINER')}
          </Text>
          <View style={styles.authorRow}>
            <View style={styles.authorAvatar}>
              <Text style={styles.authorAvatarText}>VB</Text>
            </View>
            <View style={styles.authorTextCol}>
              <Text style={styles.authorName}>Vengateswaran Balakrishnan</Text>
              <Text style={styles.authorRole}>
                Creator & Core Maintainer • @vengatmacuser
              </Text>
              <Text style={styles.authorEmail}>vengatmacuser@gmail.com</Text>
            </View>
          </View>

          <View style={styles.authorActionsRow}>
            <TouchableScale
              onPress={() => openUrl('mailto:vengatmacuser@gmail.com')}
              style={styles.authorActionBtn}>
              <Text style={styles.authorActionEmoji}>✉️</Text>
              <Text style={styles.authorActionText}>
                {t('support.sendEmail', 'Send Email')}
              </Text>
            </TouchableScale>

            <TouchableScale
              onPress={() => {
                copyToClipboard('vengatmacuser@gmail.com', 'Author Email');
                showToast(t('support.copiedEmail', 'Copied email address!'));
              }}
              style={styles.authorActionBtn}>
              <CopyIcon size={13} color={AppColors.grayText} />
              <Text style={styles.authorActionText}>
                {t('support.copyEmail', 'Copy Email')}
              </Text>
            </TouchableScale>

            <TouchableScale
              onPress={() => openUrl('https://github.com/vengatmacuser')}
              style={styles.authorActionBtn}>
              <GitHubIcon size={14} color={AppColors.grayText} />
              <Text style={styles.authorActionText}>GitHub</Text>
            </TouchableScale>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.primaryLight,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 44 : 24,
    gap: 16,
  },
  // ─── Hero ───
  heroCard: {
    backgroundColor: AppColors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: `${AppColors.red500}25`,
    ...Platform.select({
      ios: {
        shadowColor: AppColors.red500,
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.08,
        shadowRadius: 10,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  heroHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  heroIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: `${AppColors.red500}15`,
    borderWidth: 1,
    borderColor: `${AppColors.red500}30`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitleCol: {
    flex: 1,
  },
  heroTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  heroTitle: {
    fontFamily: AppFonts.interBold,
    fontSize: 18,
    color: AppColors.slate900,
    letterSpacing: -0.3,
  },
  versionBadge: {
    backgroundColor: AppColors.primaryLight,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: AppColors.grayBorderSecondary,
  },
  versionBadgeText: {
    fontFamily: AppFonts.interBold,
    fontSize: 10,
    color: AppColors.grayText,
  },
  heroSubTitle: {
    fontFamily: AppFonts.interMedium,
    fontSize: 12,
    color: AppColors.grayTextWeak,
    marginTop: 2,
  },
  heroDescription: {
    fontFamily: AppFonts.interRegular,
    fontSize: 12.5,
    lineHeight: 18,
    color: AppColors.grayText,
    marginBottom: 12,
  },
  pillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  pillBadge: {
    backgroundColor: AppColors.graySurface,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: AppColors.grayBorderSecondary,
  },
  pillBadgeText: {
    fontFamily: AppFonts.interBold,
    fontSize: 9.5,
    letterSpacing: 0.4,
    color: AppColors.grayTextWeak,
  },
  // ─── Sponsor ───
  sponsorCard: {
    backgroundColor: AppColors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: `${AppColors.red500}35`,
    ...Platform.select({
      ios: {
        shadowColor: AppColors.red500,
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  sponsorTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  sponsorIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: `${AppColors.red500}18`,
    borderWidth: 1,
    borderColor: `${AppColors.red500}35`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sponsorTextWrap: {
    flex: 1,
  },
  sponsorTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sponsorTitle: {
    fontFamily: AppFonts.interBold,
    fontSize: 15,
    color: AppColors.slate900,
  },
  sponsorPill: {
    backgroundColor: `${AppColors.red500}20`,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: `${AppColors.red500}40`,
  },
  sponsorPillText: {
    fontFamily: AppFonts.interBold,
    fontSize: 9,
    letterSpacing: 0.5,
    color: AppColors.red500,
  },
  sponsorDesc: {
    fontFamily: AppFonts.interRegular,
    fontSize: 12,
    lineHeight: 17,
    color: AppColors.grayText,
    marginTop: 4,
  },
  sponsorActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
  },
  primarySponsorBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: AppColors.red500,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    ...Platform.select({
      ios: {
        shadowColor: AppColors.red500,
        shadowOffset: {width: 0, height: 3},
        shadowOpacity: 0.35,
        shadowRadius: 6,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  primarySponsorBtnText: {
    fontFamily: AppFonts.interBold,
    fontSize: 12.5,
    color: AppColors.white,
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: AppColors.graySurface,
    borderWidth: 1,
    borderColor: AppColors.grayBorderSecondary,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  secondaryBtnText: {
    fontFamily: AppFonts.interSemiBold,
    fontSize: 12,
    color: AppColors.grayText,
  },
  // ─── Section Card ───
  sectionCard: {
    backgroundColor: AppColors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: AppColors.grayBorderSecondary,
    ...Platform.select({
      ios: {
        shadowColor: AppColors.slate900,
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.04,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  sectionHeader: {
    fontFamily: AppFonts.interBold,
    fontSize: 11,
    letterSpacing: 0.6,
    color: AppColors.grayTextWeak,
    marginBottom: 12,
  },
  actionsList: {
    gap: 10,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: AppColors.graySurface,
    borderWidth: 1,
    borderColor: AppColors.grayBorderSecondary,
  },
  itemIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  starIconWrap: {
    backgroundColor: `${AppColors.amber500}18`,
    borderWidth: 1,
    borderColor: `${AppColors.amber500}35`,
  },
  bugIconWrap: {
    backgroundColor: `${AppColors.purple}18`,
    borderWidth: 1,
    borderColor: `${AppColors.purple}35`,
  },
  docsIconWrap: {
    backgroundColor: `${AppColors.sky500}18`,
    borderWidth: 1,
    borderColor: `${AppColors.sky500}35`,
  },
  npmIconWrap: {
    backgroundColor: `${AppColors.red500}18`,
    borderWidth: 1,
    borderColor: `${AppColors.red500}35`,
  },
  itemTextCol: {
    flex: 1,
  },
  itemTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  itemTitle: {
    fontFamily: AppFonts.interBold,
    fontSize: 13,
    color: AppColors.slate900,
  },
  badgeAmber: {
    backgroundColor: `${AppColors.amber500}20`,
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: `${AppColors.amber500}45`,
  },
  badgeAmberText: {
    fontFamily: AppFonts.interBold,
    fontSize: 8.5,
    letterSpacing: 0.3,
    color: AppColors.amber600,
  },
  itemDesc: {
    fontFamily: AppFonts.interRegular,
    fontSize: 11.5,
    lineHeight: 16,
    color: AppColors.grayTextWeak,
    marginTop: 2,
  },
  // ─── Share ───
  shareSubtitle: {
    fontFamily: AppFonts.interRegular,
    fontSize: 12,
    lineHeight: 17,
    color: AppColors.grayText,
    marginBottom: 12,
  },
  shareButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sharePrimaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: AppColors.indigo600,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  sharePrimaryBtnText: {
    fontFamily: AppFonts.interBold,
    fontSize: 12,
    color: AppColors.white,
  },
  shareSecondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: AppColors.graySurface,
    borderWidth: 1,
    borderColor: AppColors.grayBorderSecondary,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  shareSecondaryBtnText: {
    fontFamily: AppFonts.interSemiBold,
    fontSize: 12,
    color: AppColors.grayText,
  },
  // ─── Author ───
  authorCard: {
    backgroundColor: AppColors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: AppColors.grayBorderSecondary,
    ...Platform.select({
      ios: {
        shadowColor: AppColors.slate900,
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.04,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  authorAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: AppColors.indigo600,
    alignItems: 'center',
    justifyContent: 'center',
  },
  authorAvatarText: {
    fontFamily: AppFonts.interBold,
    fontSize: 15,
    color: AppColors.white,
  },
  authorTextCol: {
    flex: 1,
  },
  authorName: {
    fontFamily: AppFonts.interBold,
    fontSize: 14,
    color: AppColors.slate900,
  },
  authorRole: {
    fontFamily: AppFonts.interRegular,
    fontSize: 11.5,
    color: AppColors.grayTextWeak,
    marginTop: 1,
  },
  authorEmail: {
    fontFamily: AppFonts.interMedium,
    fontSize: 11,
    color: AppColors.indigo600,
    marginTop: 2,
  },
  authorActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  authorActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: AppColors.graySurface,
    borderWidth: 1,
    borderColor: AppColors.grayBorderSecondary,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  authorActionEmoji: {
    fontSize: 12,
  },
  authorActionText: {
    fontFamily: AppFonts.interSemiBold,
    fontSize: 11,
    color: AppColors.grayText,
  },
});
