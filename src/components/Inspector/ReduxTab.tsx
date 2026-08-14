import React from 'react';
import {
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import {useInspector} from './InspectorContext';
import {ReduxTreeView} from '../ReduxTreeView';
import styles from '../../styles';
import {AppColors} from '../../styles/AppColors';
import {AppFonts} from '../../styles/AppFonts';
import {TerminalIcon, ClearIcon} from '../NetworkIcons';

const ReduxTab = () => {
  const {
    reduxState,
    reduxLastActionMap,
    reduxSearch,
    setReduxSearch,
  } = useInspector();

  if (!reduxState) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconWrap}>
          <TerminalIcon color={AppColors.purple} size={32} />
        </View>
        <Text style={styles.emptyTitle}>No Redux Store</Text>
        <Text style={styles.emptySub}>
          To inspect Redux store, call connectReduxStore(store) at app start.
        </Text>
      </View>
    );
  }

  const reducerKeys = Object.keys(reduxState);
  if (reducerKeys.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>Empty Store</Text>
        <Text style={styles.emptySub}>Connected store state is empty.</Text>
      </View>
    );
  }

  const lastActionMap = reduxLastActionMap;

  return (
    <ScrollView
      style={styles.detailScroll}
      contentContainerStyle={{paddingBottom: 24}}>
      {/* Search Bar */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: AppColors.grayBackground,
          borderRadius: 8,
          marginHorizontal: 16,
          marginTop: 16,
          marginBottom: 12,
          paddingHorizontal: 10,
          borderWidth: 1,
          borderColor: AppColors.dividerColor,
          height: 36,
        }}>
        <TextInput
          placeholder="Search Redux keys or values..."
          placeholderTextColor={AppColors.grayTextWeak}
          value={reduxSearch}
          onChangeText={setReduxSearch}
          style={{
            flex: 1,
            fontFamily: AppFonts.interRegular,
            fontSize: 12,
            color: AppColors.grayTextStrong,
            padding: 0,
          }}
          autoCorrect={false}
          autoCapitalize="none"
        />
        {reduxSearch.length > 0 && (
          <Pressable onPress={() => setReduxSearch('')} hitSlop={10}>
            <ClearIcon color={AppColors.grayTextWeak} size={14} />
          </Pressable>
        )}
      </View>

      {/* Main Content Card */}
      <View
        style={{
          backgroundColor: AppColors.primaryLight,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: AppColors.grayBorderSecondary,
          marginHorizontal: 16,
          padding: 12,
        }}>
        <ReduxTreeView
          state={reduxState}
          lastActionMap={lastActionMap}
          search={reduxSearch}
        />
      </View>
    </ScrollView>
  );
};

export default ReduxTab;