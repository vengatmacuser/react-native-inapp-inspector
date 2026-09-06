import React, {useEffect, useRef} from 'react';
import {Animated, DevSettings, Alert, View, Text} from 'react-native';

// Components
import TouchableScale from './TouchableScale';
import AnimatedEntrance from './AnimatedEntrance';

// Assets
import {EmptyRadarIcon} from './NetworkIcons';

// Stylesheet
import {AppColors} from '../styles/AppColors';
import styles from '../styles';

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
      'Reload',
      'App reload is typically only available in development mode.',
    );
  };

  return (
    <AnimatedEntrance style={styles.emptyContainer} distance={14}>
      <Animated.View
        style={[styles.emptyIconWrap, {transform: [{scale: iconPulse}]}]}>
        <EmptyRadarIcon color={AppColors.purple} size={32} />
      </Animated.View>
      <Text style={styles.emptyTitle}>
        {customTitle || (isSearch ? 'No matching results' : 'No network activity')}
      </Text>
      <Text style={styles.emptySub}>
        {customSub ||
          (isSearch
            ? searchQuery
              ? `No items matched "${searchQuery}"`
              : 'Try adjusting your filters or search keywords.'
            : 'Listening for incoming API calls...')}
      </Text>
      {isSearch && onClearSearch && (
        <TouchableScale style={styles.reloadBtn} onPress={onClearSearch}>
          <Text style={styles.reloadBtnText}>Clear Search & Filters</Text>
        </TouchableScale>
      )}
      {!isSearch && showReload && (
        <TouchableScale style={styles.reloadBtn} onPress={handleReload}>
          <Text style={styles.reloadBtnText}>Reload App</Text>
        </TouchableScale>
      )}
    </AnimatedEntrance>
  );
});

export default EmptyState;
