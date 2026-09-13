import React, {useState, useMemo} from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  Pressable,
  TouchableWithoutFeedback,
  Platform,
  Dimensions,
  DevSettings,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import TouchableScale from '../TouchableScale';
import {AppColors} from '../../styles/AppColors';
import {AppFonts} from '../../styles/AppFonts';
import {
  GlobeIcon,
  CheckIcon,
  CloseWhite,
  SearchIcon,
  ResetIcon,
} from '../NetworkIcons';
import {
  useTranslation,
  SUPPORTED_LANGUAGES,
  setLanguage,
  getLanguage,
} from '../../i18n';
import {loadSettings, saveSettings} from '../../helpers/settingsStore';
import {triggerNativeHaptic} from '../../native/NativeInspector';
import {showToast} from '../../helpers/toast';

export interface CountryOption {
  id: string;
  name: string;
  flag: string;
  badge?: string;
  langCodes?: string[];
}

export const COUNTRY_OPTIONS: CountryOption[] = [
  {id: 'all', name: 'All', flag: '🌐', badge: '25'},
  {
    id: 'in',
    name: 'India',
    flag: '🇮🇳',
    badge: '9',
    langCodes: ['hi', 'ta', 'te', 'kn', 'ml', 'bn', 'mr', 'gu', 'pa'],
  },
  {
    id: 'us',
    name: 'United States',
    flag: '🇺🇸',
    badge: '2',
    langCodes: ['en', 'es'],
  },
  {
    id: 'gb',
    name: 'United Kingdom',
    flag: '🇬🇧',
    badge: '1',
    langCodes: ['en'],
  },
  {
    id: 'de',
    name: 'Germany',
    flag: '🇩🇪',
    badge: '1',
    langCodes: ['de'],
  },
  {
    id: 'jp',
    name: 'Japan',
    flag: '🇯🇵',
    badge: '1',
    langCodes: ['ja'],
  },
  {
    id: 'ca',
    name: 'Canada',
    flag: '🇨🇦',
    badge: '2',
    langCodes: ['en', 'fr'],
  },
  {
    id: 'global',
    name: 'Global / Europe & Asia',
    flag: '🌍',
    badge: '11',
    langCodes: [
      'it',
      'id',
      'tr',
      'vi',
      'nl',
      'pl',
      'pt',
      'ru',
      'ar',
      'zh',
      'ko',
    ],
  },
];

const LANGUAGE_ENGLISH_NAMES: Record<string, string> = {
  en: 'English (Default)',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  zh: 'Chinese (Simplified)',
  ja: 'Japanese',
  ko: 'Korean',
  pt: 'Portuguese',
  ru: 'Russian',
  hi: 'Hindi',
  ta: 'Tamil',
  te: 'Telugu',
  kn: 'Kannada',
  ml: 'Malayalam',
  bn: 'Bengali',
  mr: 'Marathi',
  gu: 'Gujarati',
  pa: 'Punjabi',
  ar: 'Arabic',
  it: 'Italian',
  id: 'Indonesian',
  tr: 'Turkish',
  vi: 'Vietnamese',
  nl: 'Dutch',
  pl: 'Polish',
};

interface PendingLang {
  code: string;
  flag: string;
  nativeName: string;
}

interface LanguageSelectorModalProps {
  visible: boolean;
  onClose: () => void;
}

export const LanguageSelectorModal = React.memo(({visible, onClose}: LanguageSelectorModalProps) => {
  const {t} = useTranslation();
  const [search, setSearch] = useState('');
  const [selectedCountryId, setSelectedCountryId] = useState<string>('all');
  const [pendingLang, setPendingLang] = useState<PendingLang | null>(null);

  const currentLangCode = getLanguage();
  const isDark = AppColors.primaryLight !== AppColors.white;

  const selectedCountry = useMemo(() => {
    return COUNTRY_OPTIONS.find(c => c.id === selectedCountryId) || COUNTRY_OPTIONS[0];
  }, [selectedCountryId]);

  const filteredLanguages = useMemo(() => {
    return SUPPORTED_LANGUAGES.filter(lang => {
      // 1. Filter by selected country (unless 'all')
      if (selectedCountryId !== 'all' && selectedCountry?.langCodes) {
        if (!selectedCountry.langCodes.includes(lang.code)) {
          return false;
        }
      }

      // 2. Search query filter across name, native name, code, flag, and english name
      if (!search.trim()) return true;
      const q = search.trim().toLowerCase();
      const engName = LANGUAGE_ENGLISH_NAMES[lang.code]?.toLowerCase() || '';
      return (
        lang.name.toLowerCase().includes(q) ||
        lang.nativeName.toLowerCase().includes(q) ||
        lang.code.toLowerCase().includes(q) ||
        engName.includes(q)
      );
    });
  }, [search, selectedCountryId, selectedCountry]);

  const handleSelectLanguage = (code: string, flag: string, nativeName: string) => {
    // If already selected, do nothing
    if (code === currentLangCode) return;
    triggerNativeHaptic('light');
    setPendingLang({code, flag, nativeName});
  };

  const handleConfirmLanguageChange = async () => {
    if (!pendingLang) return;
    triggerNativeHaptic('medium');
    setLanguage(pendingLang.code);
    try {
      const current = await loadSettings();
      await saveSettings({...current, language: pendingLang.code});
    } catch (_) {}
    const {flag, nativeName} = pendingLang;
    setPendingLang(null);
    onClose();
    setSearch('');
    showToast(`🔄 ${flag} ${nativeName}`);

    if (__DEV__ && DevSettings && DevSettings.reload) {
      DevSettings.reload();
    }
  };

  const handleCancelLanguageChange = () => {
    triggerNativeHaptic('light');
    setPendingLang(null);
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      statusBarTranslucent={true}
      onRequestClose={onClose}>
      <View style={styles.overlay}>
        {/* Backdrop tap to dismiss */}
        <TouchableWithoutFeedback
          onPress={onClose}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Close bottom sheet">
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>

        {/* Bottom Sheet Container */}
        <View
          style={[
            styles.bottomSheet,
            {
              backgroundColor: isDark ? AppColors.npmDark : AppColors.white,
            },
          ]}>
          {/* Pull Handle Bar */}
          <View style={styles.handleBarWrap}>
            <View
              style={[
                styles.handleBar,
                {
                  backgroundColor: isDark
                    ? 'rgba(255,255,255,0.25)'
                    : 'rgba(0,0,0,0.18)',
                },
              ]}
            />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <LinearGradient
                colors={[AppColors.indigo600, AppColors.violet600]}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 1}}
                style={styles.globeIconWrap}>
                <GlobeIcon size={17} color={AppColors.white} />
              </LinearGradient>
              <View>
                <View style={styles.titleRow}>
                  <Text style={styles.titleText}>
                    {t('settings.general.selectLanguage', 'Select Language')}
                  </Text>
                  <View style={styles.countBadge}>
                    <Text style={styles.countBadgeText}>25</Text>
                  </View>
                </View>
                <Text style={styles.subTitleText}>
                  {t('settings.general.languageDescription', 'Choose preferred display language')}
                </Text>
              </View>
            </View>
            <TouchableScale
              onPress={onClose}
              hitSlop={12}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Close language selector"
              style={[
                styles.closeBtn,
                {
                  backgroundColor: isDark
                    ? 'rgba(255, 255, 255, 0.16)'
                    : 'rgba(0, 0, 0, 0.08)',
                  borderColor: isDark
                    ? 'rgba(255, 255, 255, 0.30)'
                    : 'rgba(0, 0, 0, 0.18)',
                },
              ]}>
              <CloseWhite
                size={14}
                color={isDark ? AppColors.white : '#0F172A'}
              />
            </TouchableScale>
          </View>

          {/* Search bar with dedicated icon and clear action */}
          <View style={styles.searchContainer}>
            <SearchIcon color={AppColors.grayTextWeak} size={15} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder={t('common.search', 'Search language, country or code...')}
              placeholderTextColor={AppColors.grayTextWeak}
              style={styles.searchInput}
              autoCapitalize="none"
              autoCorrect={false}
              clearButtonMode="never"
            />
            {search.length > 0 && (
              <TouchableScale
                onPress={() => setSearch('')}
                hitSlop={8}
                style={styles.searchClearBtn}>
                <CloseWhite size={11} color={AppColors.grayText} />
              </TouchableScale>
            )}
          </View>

          {/* Horizontal Country Filter Chips */}
          <View style={styles.countryScrollWrap}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.countryScrollContent}>
              {COUNTRY_OPTIONS.map(country => {
                const isActive = country.id === selectedCountryId;
                return (
                  <TouchableScale
                    key={country.id}
                    onPress={() => {
                      triggerNativeHaptic('light');
                      setSelectedCountryId(country.id);
                    }}
                    style={[
                      styles.countryChip,
                      isActive && styles.countryChipActive,
                    ]}>
                    <Text style={styles.countryChipFlag}>{country.flag}</Text>
                    <Text
                      style={[
                        styles.countryChipText,
                        isActive && styles.countryChipTextActive,
                      ]}>
                      {country.name}
                    </Text>
                    {country.badge && (
                      <View
                        style={[
                          styles.countryChipBadge,
                          isActive && styles.countryChipBadgeActive,
                        ]}>
                        <Text
                          style={[
                            styles.countryChipBadgeText,
                            isActive && styles.countryChipBadgeTextActive,
                          ]}>
                          {country.badge}
                        </Text>
                      </View>
                    )}
                  </TouchableScale>
                );
              })}
            </ScrollView>
          </View>

          {/* Languages List */}
          <ScrollView
            style={styles.scrollList}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={true}
            keyboardShouldPersistTaps="handled">
            {filteredLanguages.length === 0 ? (
              <View style={styles.emptyStateWrap}>
                <Text style={styles.emptyStateText}>
                  {t('common.noMatches', 'No languages match your search')}
                </Text>
              </View>
            ) : (
              filteredLanguages.map(lang => {
                const isSelected = lang.code === currentLangCode;
                const englishSubtitle =
                  LANGUAGE_ENGLISH_NAMES[lang.code] || lang.name;

                return (
                  <TouchableScale
                    key={lang.code}
                    onPress={() =>
                      handleSelectLanguage(lang.code, lang.flag, lang.nativeName)
                    }
                    style={[
                      styles.langRow,
                      isSelected && styles.langRowSelected,
                    ]}>
                    {/* Active Accent Left Indicator */}
                    {isSelected && <View style={styles.activeAccentBar} />}

                    <View style={styles.langRowLeft}>
                      <View
                        style={[
                          styles.flagContainer,
                          isSelected && styles.flagContainerSelected,
                        ]}>
                        <Text style={styles.langFlag}>{lang.flag}</Text>
                      </View>
                      <View style={styles.langTextCol}>
                        <View style={styles.langTitleRow}>
                          <Text
                            style={[
                              styles.langNativeName,
                              isSelected && styles.langNativeNameSelected,
                            ]}>
                            {lang.nativeName}
                          </Text>
                          <View
                            style={[
                              styles.codePill,
                              isSelected && styles.codePillSelected,
                            ]}>
                            <Text
                              style={[
                                styles.codePillText,
                                isSelected && styles.codePillTextSelected,
                              ]}>
                              {lang.code.toUpperCase()}
                            </Text>
                          </View>
                        </View>
                        <Text
                          style={[
                            styles.langEnglishName,
                            isSelected && styles.langEnglishNameSelected,
                          ]}>
                          {englishSubtitle}
                        </Text>
                      </View>
                    </View>

                    {isSelected ? (
                      <LinearGradient
                        colors={[AppColors.indigo600, AppColors.violet600]}
                        start={{x: 0, y: 0}}
                        end={{x: 1, y: 1}}
                        style={styles.checkIconWrap}>
                        <CheckIcon size={12} color={AppColors.white} />
                      </LinearGradient>
                    ) : (
                      <View style={styles.uncheckPlaceholder} />
                    )}
                  </TouchableScale>
                );
              })
            )}
          </ScrollView>
        </View>

        {/* ─── Language Change Confirmation Dialog ─── */}
        {pendingLang != null && (
          <View style={[StyleSheet.absoluteFill, confirmStyles.overlay]}>
            <TouchableWithoutFeedback onPress={handleCancelLanguageChange}>
              <View style={confirmStyles.backdrop} />
            </TouchableWithoutFeedback>
            <View style={confirmStyles.card}>
              {/* Close corner button */}
              <TouchableScale
                onPress={handleCancelLanguageChange}
                hitSlop={8}
                style={confirmStyles.cornerCloseBtn}>
                <CloseWhite size={11} color={AppColors.grayTextWeak} />
              </TouchableScale>

              {/* Top icon badge with flag */}
              <View style={confirmStyles.iconBadge}>
                <Text style={confirmStyles.iconFlag}>{pendingLang.flag}</Text>
              </View>

              {/* Title & Message */}
              <Text style={confirmStyles.title}>
                {t('language.confirmTitle', 'Change Language?')}
              </Text>
              <Text style={confirmStyles.message}>
                {t(
                  'language.confirmMessage',
                  `Switch to ${pendingLang.nativeName} (${LANGUAGE_ENGLISH_NAMES[pendingLang.code] || pendingLang.nativeName})? The inspector will reload to apply the new language.`,
                )}
              </Text>

              {/* Language switch preview */}
              <View style={confirmStyles.switchPreview}>
                <View style={confirmStyles.switchItem}>
                  <Text style={confirmStyles.switchLabel}>
                    {t('language.current', 'Current')}
                  </Text>
                  <Text style={confirmStyles.switchValue}>
                    {SUPPORTED_LANGUAGES.find(l => l.code === currentLangCode)?.flag || '🌐'}{' '}
                    {currentLangCode.toUpperCase()}
                  </Text>
                </View>
                <View style={confirmStyles.switchArrow}>
                  <Text style={confirmStyles.switchArrowText}>→</Text>
                </View>
                <View style={confirmStyles.switchItem}>
                  <Text style={[confirmStyles.switchLabel, {color: AppColors.indigo600}]}>
                    {t('language.new', 'New')}
                  </Text>
                  <Text style={[confirmStyles.switchValue, {color: AppColors.indigo600, fontFamily: AppFonts.interBold}]}>
                    {pendingLang.flag} {pendingLang.code.toUpperCase()}
                  </Text>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={confirmStyles.buttonRow}>
                <TouchableScale
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel={t('common.cancel', 'Cancel')}
                  onPress={handleCancelLanguageChange}
                  style={confirmStyles.cancelBtn}>
                  <Text style={confirmStyles.cancelBtnText}>
                    {t('common.cancel', 'Cancel')}
                  </Text>
                </TouchableScale>

                <TouchableScale
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel={t('language.confirmApply', 'Apply & Reload')}
                  onPress={handleConfirmLanguageChange}
                  style={confirmStyles.confirmBtn}>
                  <LinearGradient
                    colors={[AppColors.indigo600, AppColors.violet600]}
                    start={{x: 0, y: 0}}
                    end={{x: 1, y: 1}}
                    style={confirmStyles.confirmBtnGradient}>
                    <ResetIcon size={13} color={AppColors.white} />
                    <Text style={confirmStyles.confirmBtnText}>
                      {t('language.confirmApply', 'Apply & Reload')}
                    </Text>
                  </LinearGradient>
                </TouchableScale>
              </View>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(10, 15, 30, 0.60)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  bottomSheet: {
    width: '100%',
    height: Math.min(Math.max(Dimensions.get('window').height * 0.74, 520), 620),
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 28 : 16,
    shadowColor: AppColors.black,
    shadowOpacity: 0.28,
    shadowRadius: 20,
    shadowOffset: {width: 0, height: -6},
    elevation: 16,
  },
  handleBarWrap: {
    alignItems: 'center',
    paddingVertical: 5,
  },
  handleBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: AppColors.grayBorderSecondary,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  globeIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: AppColors.indigo600,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  titleText: {
    fontFamily: AppFonts.interBold,
    fontSize: 15.5,
    color: AppColors.primaryBlack,
    letterSpacing: -0.2,
  },
  countBadge: {
    backgroundColor: `${AppColors.indigo600}18`,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
  },
  countBadgeText: {
    fontFamily: AppFonts.interBold,
    fontSize: 10,
    color: AppColors.indigo600,
  },
  subTitleText: {
    fontFamily: AppFonts.interRegular,
    fontSize: 11,
    color: AppColors.grayText,
    marginTop: 1,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: `${AppColors.black}0D`,
    borderWidth: 1,
    borderColor: `${AppColors.black}1A`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 14,
    marginTop: 10,
    marginBottom: 6,
    paddingHorizontal: 10,
    height: 40,
    borderRadius: 12,
    backgroundColor: AppColors.grayBackground,
    borderWidth: 1,
    borderColor: AppColors.grayBorderSecondary,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 12.5,
    fontFamily: AppFonts.interMedium,
    color: AppColors.primaryBlack,
    paddingVertical: 0,
  },
  searchClearBtn: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: `${AppColors.grayText}22`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countryScrollWrap: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: AppColors.grayBorderSecondary,
    paddingVertical: 7,
  },
  countryScrollContent: {
    paddingHorizontal: 14,
    gap: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  countryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: AppColors.grayBackground,
    borderWidth: 1,
    borderColor: AppColors.grayBorderSecondary,
    gap: 5,
  },
  countryChipActive: {
    backgroundColor: `${AppColors.brandPurple}14`,
    borderColor: `${AppColors.brandPurple}55`,
  },
  countryChipFlag: {
    fontSize: 13,
  },
  countryChipText: {
    fontFamily: AppFonts.interMedium,
    fontSize: 11.5,
    color: AppColors.primaryBlack,
  },
  countryChipTextActive: {
    fontFamily: AppFonts.interBold,
    color: AppColors.brandPurple,
  },
  countryChipBadge: {
    paddingHorizontal: 5.5,
    paddingVertical: 1,
    borderRadius: 8,
    backgroundColor: `${AppColors.black}0A`,
  },
  countryChipBadgeActive: {
    backgroundColor: `${AppColors.brandPurple}22`,
  },
  countryChipBadgeText: {
    fontFamily: AppFonts.interSemiBold,
    fontSize: 9.5,
    color: AppColors.grayText,
  },
  countryChipBadgeTextActive: {
    color: AppColors.brandPurple,
    fontFamily: AppFonts.interBold,
  },
  scrollList: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 16,
  },
  emptyStateWrap: {
    padding: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    fontFamily: AppFonts.interMedium,
    fontSize: 13,
    color: AppColors.grayText,
  },
  langRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: AppColors.grayBorderSecondary,
    position: 'relative',
  },
  langRowSelected: {
    backgroundColor: `${AppColors.indigo600}0C`,
  },
  activeAccentBar: {
    position: 'absolute',
    left: 0,
    top: 4,
    bottom: 4,
    width: 3.5,
    borderTopRightRadius: 3,
    borderBottomRightRadius: 3,
    backgroundColor: AppColors.indigo600,
  },
  langRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  flagContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: AppColors.grayBackground,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: AppColors.grayBorderSecondary,
  },
  flagContainerSelected: {
    borderColor: `${AppColors.indigo600}44`,
    backgroundColor: `${AppColors.indigo600}14`,
  },
  langFlag: {
    fontSize: 19,
  },
  langTextCol: {
    flex: 1,
  },
  langTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  langNativeName: {
    fontFamily: AppFonts.interSemiBold,
    fontSize: 14,
    color: AppColors.primaryBlack,
  },
  langNativeNameSelected: {
    fontFamily: AppFonts.interBold,
    color: AppColors.indigo600,
  },
  codePill: {
    backgroundColor: `${AppColors.black}0A`,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  codePillSelected: {
    backgroundColor: `${AppColors.indigo600}18`,
  },
  codePillText: {
    fontSize: 9.5,
    fontFamily: AppFonts.interBold,
    color: AppColors.grayText,
    letterSpacing: 0.4,
  },
  codePillTextSelected: {
    color: AppColors.indigo600,
  },
  langEnglishName: {
    fontFamily: AppFonts.interRegular,
    fontSize: 11.5,
    color: AppColors.grayText,
    marginTop: 1.5,
  },
  langEnglishNameSelected: {
    color: AppColors.indigo600,
    fontFamily: AppFonts.interMedium,
  },
  checkIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: AppColors.indigo600,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.35,
    shadowRadius: 3,
    elevation: 3,
  },
  uncheckPlaceholder: {
    width: 24,
    height: 24,
  },
});

const confirmStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(10, 15, 30, 0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    zIndex: 999999,
    elevation: 999,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: AppColors.white,
    borderRadius: 22,
    paddingTop: 24,
    paddingBottom: 18,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: `${AppColors.white}CC`,
    ...Platform.select({
      ios: {
        shadowColor: AppColors.indigo600,
        shadowOffset: {width: 0, height: 12},
        shadowOpacity: 0.28,
        shadowRadius: 24,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  cornerCloseBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: AppColors.graySurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBadge: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 1.5,
    borderColor: `${AppColors.indigo600}33`,
    backgroundColor: `${AppColors.indigo600}14`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  iconFlag: {
    fontSize: 28,
  },
  title: {
    fontFamily: AppFonts.interBold,
    fontSize: 17,
    color: AppColors.slate900,
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.2,
  },
  message: {
    fontFamily: AppFonts.interRegular,
    fontSize: 13,
    color: AppColors.grayTextWeak,
    textAlign: 'center',
    lineHeight: 19,
    paddingHorizontal: 4,
    marginBottom: 16,
  },
  switchPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: AppColors.grayBackground,
    borderWidth: 1,
    borderColor: AppColors.grayBorderSecondary,
    width: '100%',
  },
  switchItem: {
    alignItems: 'center',
    gap: 3,
    flex: 1,
  },
  switchLabel: {
    fontFamily: AppFonts.interMedium,
    fontSize: 10,
    color: AppColors.grayText,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  switchValue: {
    fontFamily: AppFonts.interSemiBold,
    fontSize: 14,
    color: AppColors.primaryBlack,
  },
  switchArrow: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: `${AppColors.indigo600}18`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  switchArrowText: {
    fontFamily: AppFonts.interBold,
    fontSize: 14,
    color: AppColors.indigo600,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: AppColors.graySurface,
    borderWidth: 1,
    borderColor: AppColors.grayBorderSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontFamily: AppFonts.interSemiBold,
    fontSize: 14,
    color: AppColors.grayText,
  },
  confirmBtn: {
    flex: 1.15,
    height: 44,
    borderRadius: 12,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: AppColors.indigo600,
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.35,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  confirmBtnGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 12,
  },
  confirmBtnText: {
    fontFamily: AppFonts.interBold,
    fontSize: 13.5,
    color: AppColors.white,
    letterSpacing: 0.2,
  },
});

export default LanguageSelectorModal;
