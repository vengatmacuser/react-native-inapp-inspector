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
  wrap,
}: {
  data: unknown;
  search?: string;
  forceOpen?: boolean;
  defaultExpandDepth?: number;
  // #14 — when true, content wraps to the container width instead of
  // scrolling horizontally (used for the Response viewer).
  wrap?: boolean;
}) => {
  const tree = (
    <TreeNode
      data={data}
      search={search}
      forceOpen={forceOpen}
      defaultExpandDepth={defaultExpandDepth}
    />
  );

  if (wrap) {
    return <View style={[styles.codeBlock, {width: '100%'}]}>{tree}</View>;
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={true}
      style={styles.codeBlockScroll}>
      <View style={styles.codeBlock}>{tree}</View>
    </ScrollView>
  );
};

export default JsonViewer;
