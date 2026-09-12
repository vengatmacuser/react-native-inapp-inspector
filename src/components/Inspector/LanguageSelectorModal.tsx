import React, {useState, useMemo} from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  Pressable,
  Platform,
  Dimensions,
} from 'react-native';
import TouchableScale from '../TouchableScale';
import {AppColors} from '../../styles/AppColors';
import {AppFonts} from '../../styles/AppFonts';
import {
  GlobeIcon,
  CheckIcon,
  CloseWhite,
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
    badge: '38% Vol',
    langCodes: ['hi', 'ta', 'te', 'kn', 'ml', 'bn', 'mr', 'gu', 'pa'],
  },
  {
    id: 'us',
    name: 'United States',
    flag: '🇺🇸',
    badge: '24% Vol',
    langCodes: ['en', 'es'],
  },
  {
    id: 'gb',
    name: 'United Kingdom',
    flag: '🇬🇧',
    badge: '15% Vol',
    langCodes: ['en'],
  },
  {
    id: 'de',
    name: 'Germany',
    flag: '🇩🇪',
    badge: '9% Vol',
    langCodes: ['de'],
  },
  {
    id: 'jp',
    name: 'Japan',
    flag: '🇯🇵',
    badge: '6% Vol',
    langCodes: ['ja'],
  },
  {
    id: 'ca',
    name: 'Canada',
    flag: '🇨🇦',
    badge: '5% Vol',
    langCodes: ['en', 'fr'],
  },
  {
    id: 'global',
    name: 'Global / ROW',
    flag: '🌐',
    badge: '3% Vol',
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

interface LanguageSelectorModalProps {
  visible: boolean;
  onClose: () => void;
}

export const LanguageSelectorModal = React.memo(({visible, onClose}: LanguageSelectorModalProps) => {
  const {t} = useTranslation();
  const [search, setSearch] = useState('');
  const [selectedCountryId, setSelectedCountryId] = useState<string>('all');

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

      // 2. Search query filter across name, native name, code, flag
      if (!search.trim()) return true;
      const q = search.trim().toLowerCase();
      return (
        lang.name.toLowerCase().includes(q) ||
        lang.nativeName.toLowerCase().includes(q) ||
        lang.code.toLowerCase().includes(q)
      );
    });
  }, [search, selectedCountryId, selectedCountry]);

  const handleSelectLanguage = async (code: string, flag: string, nativeName: string) => {
    triggerNativeHaptic('light');
    setLanguage(code);
    try {
      const current = await loadSettings();
      saveSettings({...current, language: code});
    } catch (_) {}
    onClose();
    setSearch('');
    showToast(`${flag} ${nativeName}`);
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}>
      <View style={styles.overlay}>
        {/* Backdrop tap to dismiss */}
        <Pressable
          style={styles.backdrop}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close bottom sheet"
        />

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
              <View style={styles.globeIconWrap}>
                <GlobeIcon size={16} color={AppColors.blue600} />
              </View>
              <View>
                <Text style={styles.titleText}>
                  {t('settings.general.selectLanguage', 'Select Language')}
                </Text>
                <Text style={styles.subTitleText}>
                  {t('settings.general.languageDescription', 'Choose preferred display language')}
                </Text>
              </View>
            </View>
            <TouchableScale
              onPress={onClose}
              hitSlop={10}
              style={styles.closeBtn}>
              <CloseWhite size={12} color={AppColors.grayText} />
            </TouchableScale>
          </View>

          {/* Search bar */}
          <View style={styles.searchContainer}>
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder={t('common.search', 'Search language, country or code...')}
              placeholderTextColor={AppColors.grayTextWeak}
              style={styles.searchInput}
              autoCapitalize="none"
              autoCorrect={false}
              clearButtonMode="while-editing"
            />
            {search.length > 0 && (
              <TouchableScale
                onPress={() => setSearch('')}
                style={styles.searchClearBtn}>
                <CloseWhite size={11} color={AppColors.grayText} />
              </TouchableScale>
            )}
          </View>

          {/* Horizontal All Countries Filter List */}
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
                    <View style={styles.langRowLeft}>
                      <Text style={styles.langFlag}>{lang.flag}</Text>
                      <View style={styles.langTextCol}>
                        <View style={styles.langTitleRow}>
                          <Text
                            style={[
                              styles.langNativeName,
                              isSelected && styles.langNativeNameSelected,
                            ]}>
                            {lang.nativeName}
                          </Text>
                          <View style={styles.codePill}>
                            <Text style={styles.codePillText}>
                              {lang.code.toUpperCase()}
                            </Text>
                          </View>
                        </View>
                        <Text style={styles.langEnglishName}>
                          {lang.name}
                        </Text>
                      </View>
                    </View>
                    {isSelected && (
                      <View style={styles.checkIconWrap}>
                        <CheckIcon size={13} color={AppColors.white} />
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
  );
});

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  bottomSheet: {
    width: '100%',
    height: Math.min(Math.max(Dimensions.get('window').height * 0.70, 480), 580),
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 28 : 16,
    shadowColor: AppColors.black,
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: {width: 0, height: -4},
    elevation: 12,
  },
  handleBarWrap: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  handleBar: {
    width: 38,
    height: 4.5,
    borderRadius: 2.5,
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
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: `${AppColors.blue600}14`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleText: {
    fontFamily: AppFonts.interBold,
    fontSize: 15,
    color: AppColors.primaryBlack,
  },
  subTitleText: {
    fontFamily: AppFonts.interRegular,
    fontSize: 11,
    color: AppColors.grayText,
    marginTop: 1,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: AppColors.grayBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontFamily: AppFonts.interBold,
    fontSize: 12,
    color: AppColors.grayText,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 14,
    marginTop: 10,
    marginBottom: 6,
    paddingHorizontal: 10,
    height: 38,
    borderRadius: 10,
    backgroundColor: AppColors.grayBackground,
    borderWidth: 1,
    borderColor: AppColors.grayBorderSecondary,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 12.5,
    fontFamily: AppFonts.interRegular,
    color: AppColors.primaryBlack,
    paddingVertical: 0,
  },
  searchClearBtn: {
    padding: 4,
  },
  searchClearText: {
    fontSize: 12,
    color: AppColors.grayText,
    fontFamily: AppFonts.interBold,
  },
  countryScrollWrap: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: AppColors.grayBorderSecondary,
    paddingVertical: 6,
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
    borderRadius: 16,
    backgroundColor: AppColors.grayBackground,
    borderWidth: 1,
    borderColor: AppColors.grayBorderSecondary,
    gap: 5,
  },
  countryChipActive: {
    backgroundColor: `${AppColors.purple}14`,
    borderColor: `${AppColors.purple}55`,
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
    color: AppColors.purple,
  },
  countryChipBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 8,
    backgroundColor: `${AppColors.black}0A`,
  },
  countryChipBadgeActive: {
    backgroundColor: `${AppColors.purple}22`,
  },
  countryChipBadgeText: {
    fontFamily: AppFonts.interSemiBold,
    fontSize: 9.5,
    color: AppColors.grayText,
  },
  countryChipBadgeTextActive: {
    color: AppColors.purple,
    fontFamily: AppFonts.interBold,
  },
  scrollList: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 16,
  },
  emptyStateWrap: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    fontFamily: AppFonts.interRegular,
    fontSize: 12.5,
    color: AppColors.grayText,
  },
  langRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: AppColors.grayBorderSecondary,
  },
  langRowSelected: {
    backgroundColor: `${AppColors.purple}10`,
  },
  langRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  langFlag: {
    fontSize: 20,
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
    fontSize: 13.5,
    color: AppColors.primaryBlack,
  },
  langNativeNameSelected: {
    fontFamily: AppFonts.interBold,
    color: AppColors.purple,
  },
  codePill: {
    backgroundColor: `${AppColors.purple}14`,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  codePillText: {
    fontSize: 9.5,
    fontFamily: AppFonts.interBold,
    color: AppColors.purple,
    letterSpacing: 0.5,
  },
  langEnglishName: {
    fontFamily: AppFonts.interRegular,
    fontSize: 11,
    color: AppColors.grayText,
    marginTop: 1,
  },
  checkIconWrap: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: AppColors.purple,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
