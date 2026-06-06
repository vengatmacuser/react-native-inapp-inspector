import React, {useMemo} from 'react';
import {View, Text, ScrollView} from 'react-native';

// Helpers
import {getDiff} from '../helpers';

// Stylesheet
import {AppColors} from '../styles/AppColors';
import styles from '../styles';

const DiffViewer = React.memo(
  ({
    oldData,
    newData,
    forceOpen,
  }: {
    oldData: any;
    newData: any;
    forceOpen?: boolean;
  }) => {
    const diffs = useMemo(() => getDiff(oldData, newData), [oldData, newData]);

    if (forceOpen === false) {
      return (
        <View style={styles.codeBlock}>
          <Text style={[styles.codeText, {color: AppColors.grayTextWeak}]}>
            {'{ Diff hidden }'}
          </Text>
        </View>
      );
    }

    if (diffs.length === 0) {
      return (
        <View style={styles.codeBlock}>
          <Text style={styles.codeText}>No differences from previous API.</Text>
        </View>
      );
    }

    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={true}
        style={styles.codeBlockScroll}>
        <View style={styles.diffBlock}>
          {diffs.map((d, i) => {
            const key = d.path === 'root' ? '' : `"${d.path}": `;
            if (d.type === 'added') {
              return (
                <Text key={i} selectable={true} style={styles.diffAdded}>
                  + <Text style={styles.codeKey}>{key}</Text>
                  {JSON.stringify(d.newVal)}
                </Text>
              );
            }
            if (d.type === 'removed') {
              return (
                <Text key={i} selectable={true} style={styles.diffRemoved}>
                  - <Text style={styles.codeKey}>{key}</Text>
                  {JSON.stringify(d.oldVal)}
                </Text>
              );
            }
            return (
              <Text key={i} selectable={true} style={styles.diffChanged}>
                ~ <Text style={styles.codeKey}>{key}</Text>
                {JSON.stringify(d.oldVal)}{' '}
                <Text style={{color: AppColors.grayTextWeak}}>➔</Text>{' '}
                {JSON.stringify(d.newVal)}
              </Text>
            );
          })}
        </View>
      </ScrollView>
    );
  },
);

export default DiffViewer;
