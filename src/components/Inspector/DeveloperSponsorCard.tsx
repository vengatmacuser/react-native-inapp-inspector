import React, {useEffect, useState} from 'react';
import {
  Image,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import TouchableScale from '../TouchableScale';
import {AppColors} from '../../styles/AppColors';
import {AppFonts} from '../../styles/AppFonts';
import {
  DeveloperSponsorAd,
  fetchDeveloperSponsor,
  trackSponsorImpression,
  handleSponsorClick,
} from '../../helpers/sponsorService';
import {
  SparklesIcon,
  ExternalLinkIcon,
  GlobeIcon,
  ShieldCheckIcon,
} from '../NetworkIcons';

export interface DeveloperSponsorCardProps {
  publisherId?: string;
  customEndpoint?: string;
  containerStyle?: object;
  compact?: boolean;
}

export const DeveloperSponsorCard: React.FC<DeveloperSponsorCardProps> = ({
  publisherId,
  customEndpoint,
  containerStyle,
  compact = false,
}) => {
  const [ad, setAd] = useState<DeveloperSponsorAd | null>(null);

  useEffect(() => {
    let isMounted = true;
    fetchDeveloperSponsor(publisherId, customEndpoint).then(fetchedAd => {
      if (isMounted && fetchedAd) {
        setAd(fetchedAd);
        trackSponsorImpression(fetchedAd);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [publisherId, customEndpoint]);

  if (!ad) return null;

  const accentColor = ad.accentColor || AppColors.indigo600;

  return (
    <TouchableScale
      onPress={() => handleSponsorClick(ad)}
      style={[
        styles.cardContainer,
        {
          borderColor: `${accentColor}40`,
        },
        containerStyle,
      ]}>
      {/* Background Accent Glow */}
      <View
        style={[
          styles.glowBackground,
          {backgroundColor: `${accentColor}0A`},
        ]}
      />

      {/* Top Header Row */}
      <View style={styles.headerRow}>
        <View style={styles.badgeRow}>
          <View
            style={[
              styles.sponsorBadge,
              {
                backgroundColor: `${accentColor}1F`,
                borderColor: `${accentColor}44`,
              },
            ]}>
            <SparklesIcon size={10} color={accentColor} />
            <Text style={[styles.sponsorBadgeText, {color: accentColor}]}>
              {ad.badgeText || 'SPONSORED'}
            </Text>
          </View>
          {ad.sponsorName ? (
            <Text style={styles.sponsorNameText}>· {ad.sponsorName}</Text>
          ) : null}
        </View>

        <View style={styles.verifiedRow}>
          {ad.type === 'ethicalads' ? (
            <Pressable
              hitSlop={8}
              onPress={() =>
                Linking.openURL(
                  'https://www.ethicalads.io/?ref=react-native-inapp-inspector',
                ).catch(() => {})
              }
              style={{flexDirection: 'row', alignItems: 'center', gap: 3.5}}>
              <Text style={styles.verifiedText}>Ad by EthicalAds</Text>
              <ExternalLinkIcon size={10} color={AppColors.grayTextWeak} />
            </Pressable>
          ) : (
            <>
              <ShieldCheckIcon size={11} color={AppColors.emerald500} />
              <Text style={styles.verifiedText}>Verified Dev Tool</Text>
              <ExternalLinkIcon size={11} color={AppColors.grayTextWeak} />
            </>
          )}
        </View>
      </View>

      {/* Content Row: Logo (if available) + Title & Description */}
      <View style={styles.contentRow}>
        {ad.logoUrl ? (
          <Image
            source={{uri: ad.logoUrl}}
            style={styles.logoImage}
            resizeMode="contain"
          />
        ) : (
          <View
            style={[
              styles.iconPlaceholder,
              {backgroundColor: `${accentColor}18`},
            ]}>
            <GlobeIcon size={18} color={accentColor} />
          </View>
        )}

        <View style={styles.textColumn}>
          <Text
            style={[styles.headlineText, compact && {fontSize: 12.5, lineHeight: 16}]}
            numberOfLines={compact ? 1 : 2}>
            {ad.title}
          </Text>
          {ad.description && !compact ? (
            <Text style={styles.descText} numberOfLines={2}>
              {ad.description}
            </Text>
          ) : null}
        </View>
      </View>

      {/* Action CTA Bar */}
      <View style={styles.footerRow}>
        <View
          style={[
            styles.ctaButton,
            {
              backgroundColor: accentColor,
              shadowColor: accentColor,
            },
          ]}>
          <Text style={styles.ctaButtonText}>{ad.ctaText || 'Learn More'}</Text>
          <ExternalLinkIcon size={11} color={AppColors.white} />
        </View>
      </View>
    </TouchableScale>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: AppColors.primaryLight,
    borderRadius: 14,
    padding: 13,
    borderWidth: 1.2,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: AppColors.shadowColorString,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    gap: 10,
  },
  glowBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sponsorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
    borderWidth: 1,
  },
  sponsorBadgeText: {
    fontFamily: AppFonts.interBold,
    fontSize: 9,
    lineHeight: 12,
    letterSpacing: 0.6,
  },
  sponsorNameText: {
    fontFamily: AppFonts.interSemiBold,
    fontSize: 11,
    color: AppColors.grayTextWeak,
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3.5,
  },
  verifiedText: {
    fontFamily: AppFonts.interMedium,
    fontSize: 9.5,
    color: AppColors.grayTextWeak,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoImage: {
    width: 38,
    height: 38,
    borderRadius: 8,
  },
  iconPlaceholder: {
    width: 38,
    height: 38,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textColumn: {
    flex: 1,
    gap: 2,
  },
  headlineText: {
    fontFamily: AppFonts.interBold,
    fontSize: 13.5,
    lineHeight: 18,
    color: AppColors.primaryBlack,
    letterSpacing: -0.2,
  },
  descText: {
    fontFamily: AppFonts.interRegular,
    fontSize: 11,
    lineHeight: 15,
    color: AppColors.grayTextWeak,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 2,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6.5,
    borderRadius: 8,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  ctaButtonText: {
    fontFamily: AppFonts.interBold,
    fontSize: 11.5,
    lineHeight: 15,
    color: AppColors.white,
  },
});

export default DeveloperSponsorCard;
