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
  defaultExpandDepth,
}: {
  data: unknown;
  search?: string;
  forceOpen?: boolean;
  defaultExpandDepth?: number;
}) => {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={true}
      style={styles.codeBlockScroll}>
      <View style={styles.codeBlock}>
        <TreeNode
          data={data}
          search={search}
          forceOpen={forceOpen}
          defaultExpandDepth={defaultExpandDepth}
        />
      </View>
    </ScrollView>
  );
};

export default JsonViewer;
