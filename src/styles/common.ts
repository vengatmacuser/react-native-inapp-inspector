import {StyleSheet} from 'react-native';
import {AppFonts} from './AppFonts';
import {AppColors} from './AppColors';

// Shared styles for the Inspector UI (repeated patterns + page-level layout).
// Built dynamically so dark-mode colors stay in sync with toggleGlobalTheme()
// (see rebuildCommonStyles wired into styles/index.ts).

const commonStyles: Record<string, any> = {};

const buildCommonStyles = (colors: any) => {
  const newStyles = StyleSheet.create({
    // ─── Layout ──────────────────────────────────────────────────────────────
    pageContainer: {
      flex: 1,
      backgroundColor: colors.grayBackground,
    },
    listHeader: {
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 8,
    },
    rowCenter: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    rowCenterWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      flexWrap: 'wrap',
    },
    rowSpaceBetween: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
    },

    // ─── Cards / rows ────────────────────────────────────────────────────────
    card: {
      backgroundColor: colors.primaryLight,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.grayBorderSecondary,
    },
    listCard: {
      marginHorizontal: 16,
      marginVertical: 6,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.grayBorderSecondary,
      backgroundColor: colors.primaryLight,
      padding: 14,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      shadowColor: colors.black,
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.04,
      shadowRadius: 4,
      elevation: 2,
    },
    consoleRow: {
      marginHorizontal: 12,
      marginVertical: 3,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.grayBorderSecondary,
      padding: 10,
      flexDirection: 'row',
      gap: 8,
      alignItems: 'flex-start',
    },

    // ─── Search bar ──────────────────────────────────────────────────────────
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.grayBackground,
      borderRadius: 8,
      marginHorizontal: 16,
      marginTop: 16,
      marginBottom: 12,
      paddingHorizontal: 10,
      borderWidth: 1,
      borderColor: colors.dividerColor,
      height: 36,
    },

    // ─── Tabs / pills ────────────────────────────────────────────────────────
    tabBarStrip: {
      backgroundColor: colors.primaryLight,
      borderBottomWidth: 1,
      borderBottomColor: colors.dividerColor,
      paddingVertical: 6,
    },
    subTabPill: {
      paddingVertical: 6,
      paddingHorizontal: 14,
      borderRadius: 8,
      alignItems: 'center',
      flexDirection: 'row',
      gap: 6,
      backgroundColor: `${colors.black}08`,
      borderWidth: 1,
      borderColor: 'transparent',
    },
    subTabPillActive: {
      backgroundColor: colors.purple,
      borderColor: colors.purple,
    },
    subTabPillText: {
      fontFamily: AppFonts.interMedium,
      fontSize: 12,
      color: colors.grayTextStrong,
    },
    subTabPillTextActive: {
      fontFamily: AppFonts.interBold,
      fontSize: 12,
      color: colors.white,
    },
    innerTab: {
      paddingVertical: 8,
      paddingHorizontal: 4,
      borderBottomWidth: 2,
      borderBottomColor: 'transparent',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    countBadge: {
      minWidth: 20,
      height: 18,
      borderRadius: 9,
      paddingHorizontal: 5,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.grayBackground,
    },

    // ─── Header / address bar ────────────────────────────────────────────────
    addressBar: {
      paddingHorizontal: 12,
      paddingTop: 6,
      paddingBottom: 6,
      backgroundColor: colors.primaryLight,
      borderBottomWidth: 1,
      borderBottomColor: colors.dividerColor,
    },
    addressBarInner: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.grayBackground,
      borderRadius: 8,
      borderWidth: 1.5,
      borderColor: colors.grayBorderSecondary,
      paddingHorizontal: 10,
      paddingVertical: 5,
      gap: 8,
    },
    inspectBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.purpleShade50,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderBottomWidth: 1,
      borderBottomColor: colors.dividerColor,
    },

    // ─── Badges / buttons ────────────────────────────────────────────────────
    badgeActive: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: colors.greenStatus,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 12,
    },
    iconButton: {
      width: 26,
      height: 26,
      borderRadius: 13,
      backgroundColor: colors.grayBackground,
      borderWidth: 1,
      borderColor: colors.grayBorderSecondary,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });

  // Clear old keys and copy new ones (keeps the exported object identity).
  Object.keys(commonStyles).forEach(key => delete commonStyles[key]);
  Object.assign(commonStyles, newStyles);
};

// Initial build
buildCommonStyles(AppColors);

export const rebuildCommonStyles = (colors: any) => {
  buildCommonStyles(colors);
};

export default commonStyles;