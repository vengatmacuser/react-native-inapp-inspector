import React from 'react';
import {View, Pressable, Text} from 'react-native';

// Stylesheet
import {AppColors} from '../styles/AppColors';

// Components
import CopyButton from './CopyButton';
import TouchableScale from './TouchableScale';

// Assets
import {
  RequestIcon,
  ResponseIcon,
  HeadersIcon,
  DiffIcon,
  ChevronIcon,
  SearchIcon,
} from './NetworkIcons';

// Stylesheet
import styles from '../styles';

// Type Definition
import {SectionHeaderProps} from '../types';

const SectionHeader = ({
  title,
  value,
  expanded,
  onToggleExpand,
  showDiff,
  isDiffing,
  onToggleDiff,
  showSearch,
  isSearching,
  onToggleSearch,
}: SectionHeaderProps) => {
  const isOpen = expanded === undefined ? false : !!expanded;

  return (
    <View style={styles.sectionHeaderGradient}>
      <View style={styles.sectionHeaderRow}>
        <Pressable
          style={styles.sectionTitleRow}
          onPress={onToggleExpand}
          hitSlop={12}>
          {title === 'Request' || title === 'API' ? (
            <RequestIcon color={AppColors.offerPurple} />
          ) : title === 'Response' ? (
            <ResponseIcon color={AppColors.greenColor} />
          ) : (
            <HeadersIcon color={AppColors.skyBlue} />
          )}
          <Text style={styles.sectionTitle}>{title}</Text>
        </Pressable>
        <View style={styles.sectionHeaderActions}>
          {showSearch && (
            <TouchableScale
              onPress={onToggleSearch}
              hitSlop={12}
              style={[
                styles.iconSquareBtn,
                isSearching ? styles.iconSquareBtnActive : null,
              ]}>
              <SearchIcon
                color={isSearching ? AppColors.skyBlue : AppColors.grayTextWeak}
                size={14}
              />
            </TouchableScale>
          )}
          {showDiff && (
            <TouchableScale
              onPress={onToggleDiff}
              hitSlop={12}
              style={[
                styles.iconSquareBtn,
                isDiffing ? styles.iconSquareBtnActive : null,
              ]}>
              <DiffIcon
                color={isDiffing ? AppColors.skyBlue : AppColors.grayTextWeak}
                size={14}
              />
            </TouchableScale>
          )}
          <CopyButton value={value} label={title} />
          <TouchableScale
            onPress={onToggleExpand}
            hitSlop={12}
            style={styles.iconSquareBtn}>
            <View style={{transform: [{rotate: isOpen ? '180deg' : '0deg'}]}}>
              <ChevronIcon color={AppColors.grayTextStrong} size={14} />
            </View>
          </TouchableScale>
        </View>
      </View>
    </View>
  );
};

export default SectionHeader;
