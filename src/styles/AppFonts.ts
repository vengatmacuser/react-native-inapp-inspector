export interface AppFontConfig {
  interRegular?: string;
  interMedium?: string;
  interSemiBold?: string;
  interBold?: string;
  Sfprotext?: string;
}

export const AppFonts = {
  interRegular: 'Inter-Regular',
  interMedium: 'Inter-Medium',
  interSemiBold: 'Inter-SemiBold',
  interBold: 'Inter-Bold',
  Sfprotext: 'Inter-Regular',
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
