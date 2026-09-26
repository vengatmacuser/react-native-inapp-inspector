import {Platform} from 'react-native';

export interface AppFontConfig {
  interRegular?: string;
  interMedium?: string;
  interSemiBold?: string;
  interBold?: string;
  Sfprotext?: string;
  monoFont?: string;
  systemFont?: string;
}

const defaultMono = Platform.select({
  ios: 'Menlo',
  android: 'monospace',
  default: 'monospace',
});

const defaultRegular = Platform.select({
  ios: 'System',
  android: 'sans-serif',
  default: 'sans-serif',
});

const defaultMedium = Platform.select({
  ios: 'System',
  android: 'sans-serif-medium',
  default: 'sans-serif-medium',
});

export const AppFonts = {
  interRegular: 'Inter-Regular',
  interMedium: 'Inter-Medium',
  interSemiBold: 'Inter-SemiBold',
  interBold: 'Inter-Bold',
  Sfprotext: 'Inter-Regular',
  monoFont: defaultMono,
  systemFont: defaultRegular,
};

/**
 * Configure or override font families used across all inspector screens.
 * Useful when integrating into apps with custom font setups or system fonts.
 */
export const setAppFonts = (customFonts: Partial<typeof AppFonts>): void => {
  if (!customFonts || typeof customFonts !== 'object') return;
  Object.assign(AppFonts, customFonts);
};

export default AppFonts;
