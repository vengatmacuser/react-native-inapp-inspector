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

import {getSize} from '../helpers';

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

  const jsonData = {
    name: event.name,
    params: params,
    ...(upCount > 0 ? {userProperties} : {}),
  };

  const isObject = typeof jsonData === 'object' && jsonData !== null;
  const isArray = Array.isArray(jsonData);
  let typeLabel: string = typeof jsonData;
  let countLabel = '';
  if (jsonData === null) {
    typeLabel = 'null';
  } else if (isArray) {
    typeLabel = 'array';
    countLabel = `${jsonData.length} items`;
  } else if (isObject) {
    typeLabel = 'object';
    countLabel = `${Object.keys(jsonData).length} keys`;
  }

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
        <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
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
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: AppColors.grayBackground,
              borderRadius: 6,
              overflow: 'hidden',
              borderWidth: 1,
              borderColor: AppColors.grayBorderSecondary,
            }}>
            <View style={{paddingHorizontal: 6, paddingVertical: 4, backgroundColor: AppColors.purple + '18'}}>
              <Text style={{fontFamily: AppFonts.interBold, fontSize: 9, color: AppColors.purple, letterSpacing: 0.3}}>
                {typeLabel.toUpperCase()}
              </Text>
            </View>
            {countLabel ? (
              <View style={{paddingHorizontal: 6, paddingVertical: 4}}>
                <Text style={{fontFamily: AppFonts.interMedium, fontSize: 9, color: AppColors.grayText}}>
                  {countLabel}
                </Text>
              </View>
            ) : null}
          </View>
          <View
            style={{
              backgroundColor: AppColors.grayBackground,
              borderRadius: 6,
              paddingHorizontal: 6,
              paddingVertical: 4,
              borderWidth: 1,
              borderColor: AppColors.grayBorderSecondary,
            }}>
            <Text style={{fontFamily: AppFonts.interMedium, fontSize: 9, color: AppColors.grayText}}>
              {getSize(jsonData)}
            </Text>
          </View>
        </View>

        <CopyButton
          value={JSON.stringify(jsonData, null, 2)}
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
          data={jsonData}
          defaultExpandDepth={expandDepth}
          fullHeight
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
    marginTop: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderRadius: 12,
  },
});

export default AnalyticsDetail;
