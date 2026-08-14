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

const EmptyState = React.memo(function EmptyState({isSearch}: {isSearch?: boolean}) {
  const iconPulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(iconPulse, {
          toValue: 1.06,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(iconPulse, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
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
        {isSearch ? 'No matching APIs' : 'No network activity'}
      </Text>
      <Text style={styles.emptySub}>
        {isSearch
          ? 'Try adjusting your filters or search.'
          : 'Listening for incoming API calls...'}
      </Text>
      {!isSearch && (
        <TouchableScale style={styles.reloadBtn} onPress={handleReload}>
          <Text style={styles.reloadBtnText}>Reload App</Text>
        </TouchableScale>
      )}
    </AnimatedEntrance>
  );
});

export default EmptyState;
