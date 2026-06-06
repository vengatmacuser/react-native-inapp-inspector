import React from 'react';
import {ScrollView, View} from 'react-native';

// Components
import TreeNode from './TreeNode';

// Stylesheet
import styles from '../styles';

const JsonViewer = ({
  data,
  search,
  forceOpen,
}: {
  data: unknown;
  search?: string;
  forceOpen?: boolean;
}) => {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={true}
      style={styles.codeBlockScroll}>
      <View style={styles.codeBlock}>
        <TreeNode data={data} search={search} forceOpen={forceOpen} />
      </View>
    </ScrollView>
  );
};

export default JsonViewer;
