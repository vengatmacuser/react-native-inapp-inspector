const LightColors = {
  primaryLight: '#FFFFFF',
  purple: '#684B9B',
  purpleShade50: '#F9F5FF',
  offerPurple: '#F246CB',
  grayBorderSecondary: '#DFE0EB',
  grayBackground: '#F9F9FC',
  grayText: '#6A6D87',
  grayTextWeak: '#9596AC',
  greenColor: '#55CD7D',
  graySurface: '#DFE0EB',
  skyBlue: '#007AFF',
  primaryBlack: '#2C3059',
  grayTextStrong: '#2C3059',
  dividerColor: '#EBECEF',
  warningIconGold: '#BFA252',
  shadowColorString: '#101828',
  errorColor: '#FF2E57',
  lightOrange: '#FFC738',
  darkOrange: '#996F04',
  successGreen: '#55CD7D',
  purpleShade700: '#6941C6',
  greenStatus: '#D0F8DE',
  greenBaggageText: '#159E44',
  paleYellow: '#F9DB7C',
};

const DarkColors = {
  primaryLight: '#1E1E24',
  purple: '#A78BFA',
  purpleShade50: '#2E224E',
  offerPurple: '#F472B6',
  grayBorderSecondary: '#374151',
  grayBackground: '#121214',
  grayText: '#9CA3AF',
  grayTextWeak: '#6B7280',
  greenColor: '#34D399',
  graySurface: '#374151',
  skyBlue: '#60A5FA',
  primaryBlack: '#F3F4F6',
  grayTextStrong: '#F3F4F6',
  dividerColor: '#1F2937',
  warningIconGold: '#F59E0B',
  shadowColorString: '#000000',
  errorColor: '#EF4444',
  lightOrange: '#FCD34D',
  darkOrange: '#D97706',
  successGreen: '#34D399',
  purpleShade700: '#8B5CF6',
  greenStatus: '#064E3B',
  greenBaggageText: '#34D399',
  paleYellow: '#78350F',
};

export const getThemeColors = (isDark: boolean) => {
  return isDark ? DarkColors : LightColors;
};

export const AppColors = {} as typeof LightColors;
Object.assign(AppColors, LightColors);

export const updateAppColorsTheme = (isDark: boolean) => {
  Object.assign(AppColors, getThemeColors(isDark));
};

export default AppColors;
