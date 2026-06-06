import React from 'react';
import {DevSettings, Alert, View, Text} from 'react-native';

// Components
import TouchableScale from './TouchableScale';

// Assets
import {EmptyRadarIcon} from './NetworkIcons';

// Stylesheet
import {AppColors} from '../styles/AppColors';
import styles from '../styles';

const EmptyState = ({isSearch}: {isSearch?: boolean}) => {
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
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconWrap}>
        <EmptyRadarIcon color={AppColors.purple} size={32} />
      </View>
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
    </View>
  );
};

export default EmptyState;
