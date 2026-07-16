import React, {useState} from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

// Components
import CopyButton from './CopyButton';
import JsonViewer from './JsonViewer';
import TouchableScale from './TouchableScale';

// Utils
import {AppFonts} from '../styles/AppFonts';

// Stylesheet
import {AppColors} from '../styles/AppColors';

// Type Definition
import {AnalyticsEvent} from '../types';

const AnalyticsDetail = ({
  event,
}: {
  event: AnalyticsEvent;
}): React.JSX.Element => {
  const [expandDepth, setExpandDepth] = useState(1);
  const [treeKey, setTreeKey] = useState(0);

  const params = event.params ?? {};
  const userProperties = event.userProperties ?? {};
  const upCount = Object.keys(userProperties).length;

  return (
    <ScrollView
      style={[detailStyles.scroll, {backgroundColor: AppColors.grayBackground}]}
      contentContainerStyle={detailStyles.content}
      showsVerticalScrollIndicator
      contentInsetAdjustmentBehavior="never"
      automaticallyAdjustContentInsets={false}>
      
      {/* Clean Toolbar */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: AppColors.grayBorderSecondary,
          backgroundColor: AppColors.primaryLight,
        }}>
        <TouchableScale
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            backgroundColor: AppColors.grayBackground,
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: AppColors.grayBorderSecondary,
          }}
          onPress={() => {
            const nextDepth = expandDepth === 99 ? 1 : 99;
            setExpandDepth(nextDepth);
            setTreeKey(prev => prev + 1);
          }}>
          <Text
            style={{
              fontFamily: AppFonts.interBold,
              fontSize: 12,
              color: AppColors.purple,
            }}>
            {expandDepth === 99 ? 'Collapse All' : 'Expand All'}
          </Text>
        </TouchableScale>

        <CopyButton
          value={JSON.stringify(
            {
              name: event.name,
              params: params,
              ...(upCount > 0 ? {userProperties} : {}),
            },
            null,
            2,
          )}
          label="Copy JSON"
        />
      </View>

      {/* Direct JSON Viewer View */}
      <View
        style={[
          detailStyles.jsonBlockContainer,
          {
            backgroundColor: AppColors.primaryLight,
            borderColor: AppColors.grayBorderSecondary,
            marginTop: 16,
          },
        ]}>
        <JsonViewer
          key={treeKey}
          data={{
            name: event.name,
            params: params,
            ...(upCount > 0
              ? {
                  userProperties: userProperties,
                }
              : {}),
          }}
          defaultExpandDepth={expandDepth}
        />
      </View>
    </ScrollView>
  );
};

const detailStyles = StyleSheet.create({
  scroll: {flex: 1, backgroundColor: AppColors.grayBackground},
  content: {
    paddingTop: 0,
    paddingBottom: 40,
  },
  jsonBlockContainer: {
    marginHorizontal: 16,
    marginTop: 8,
    padding: 12,
    borderWidth: 1,
    borderRadius: 12,
  },
});

export default AnalyticsDetail;
