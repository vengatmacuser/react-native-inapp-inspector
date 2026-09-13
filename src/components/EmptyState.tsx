import React, {useEffect, useRef} from 'react';
import {Animated, DevSettings, Alert, Text} from 'react-native';

// Components
import TouchableScale from './TouchableScale';
import AnimatedEntrance from './AnimatedEntrance';

// Assets
import {EmptyRadarIcon} from './NetworkIcons';

// Stylesheet
import {AppColors} from '../styles/AppColors';
import styles from '../styles';

import {useTranslation} from '../i18n';

interface EmptyStateProps {
  isSearch?: boolean;
  searchQuery?: string;
  customTitle?: string;
  customSub?: string;
  onClearSearch?: () => void;
  showReload?: boolean;
}

const EmptyState = React.memo(function EmptyState({
  isSearch,
  searchQuery,
  customTitle,
  customSub,
  onClearSearch,
  showReload = true,
}: EmptyStateProps) {
  const {t} = useTranslation();
  const iconPulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(iconPulse, {
          toValue: 1.06,
          duration: 900,
          useNativeDriver: false,
        }),
        Animated.timing(iconPulse, {
          toValue: 1,
          duration: 900,
          useNativeDriver: false,
        }),
      ]),
    );

    loop.start();
    return () => loop.stop();
  }, [iconPulse]);

  const handleReload = () => {
    if (__DEV__ && DevSettings && DevSettings.reload) {
      DevSettings.reload();
      return;
    }

    Alert.alert(
      t('common.reload', 'Reload'),
      t('common.reloadDevOnly', 'App reload is typically only available in development mode.'),
    );
  };

  return (
    <AnimatedEntrance style={styles.emptyContainer} distance={14}>
      <Animated.View
        style={[styles.emptyIconWrap, {transform: [{scale: iconPulse}]}]}>
        <EmptyRadarIcon color={AppColors.purple} size={32} />
      </Animated.View>
      <Text style={styles.emptyTitle}>
        {customTitle || (isSearch ? t('common.noMatches', 'No matching results') : t('network.noActivity', 'No network activity'))}
      </Text>
      <Text style={styles.emptySub}>
        {customSub ||
          (isSearch
            ? searchQuery
              ? `${t('common.noItemsMatched', 'No items matched')} "${searchQuery}"`
              : t('common.adjustFilters', 'Try adjusting your filters or search keywords.')
            : t('network.listening', 'Listening for incoming API calls...'))}
      </Text>
      {isSearch && onClearSearch && (
        <TouchableScale style={styles.reloadBtn} onPress={onClearSearch}>
          <Text style={styles.reloadBtnText}>{t('common.clearSearchFilters', 'Clear Search & Filters')}</Text>
        </TouchableScale>
      )}
      {!isSearch && showReload && (
        <TouchableScale style={styles.reloadBtn} onPress={handleReload}>
          <Text style={styles.reloadBtnText}>{t('common.reloadApp', 'Reload App')}</Text>
        </TouchableScale>
      )}
    </AnimatedEntrance>
  );
});

export default EmptyState;
