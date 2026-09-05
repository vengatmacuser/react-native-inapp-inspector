import React from 'react';
import {View, Pressable, Text} from 'react-native';
import Svg, {Rect, Path} from 'react-native-svg';

// Components
import CopyButton from './CopyButton';

// Custom Hooks
import useAccordion from '../customHooks/useAccordion';

// Assets
import {ChevronIcon} from './NetworkIcons';

// Type Definition
import {SourcePageCardProps} from '../types';

// Stylesheet
import {AppColors} from '../styles/AppColors';
import styles from '../styles';

const SourcePageCard = ({routeInfo}: SourcePageCardProps) => {
  const main = useAccordion(true);
  const params = useAccordion(false);

  const hasParams =
    routeInfo.params && Object.keys(routeInfo.params).length > 0;

  return (
    <View style={styles.sourcePageCard}>
      <Pressable onPress={main.toggleOpen} hitSlop={12}>
        <View style={styles.sourcePageAccordionHeader}>
          <View style={styles.sourcePageTop}>
            <View style={styles.sourcePageIcon}>
              <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                <Rect
                  x="3"
                  y="3"
                  width="7"
                  height="7"
                  rx="1.5"
                  stroke={AppColors.purple}
                  strokeWidth="2"
                />
                <Rect
                  x="14"
                  y="3"
                  width="7"
                  height="7"
                  rx="1.5"
                  stroke={AppColors.purple}
                  strokeWidth="2"
                />
                <Rect
                  x="3"
                  y="14"
                  width="7"
                  height="7"
                  rx="1.5"
                  stroke={AppColors.purple}
                  strokeWidth="2"
                />
                <Path
                  d="M14 17.5h7M17.5 14v7"
                  stroke={AppColors.purple}
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </Svg>
            </View>
            <View style={{flex: 1}}>
              <Text style={styles.sourcePageLabel}>Source Page</Text>
              <Text style={styles.sourcePageValue} numberOfLines={1}>
                {routeInfo.path}
              </Text>
            </View>
          </View>
          <View style={styles.sourcePageHeaderRight}>
            <CopyButton value={routeInfo.path} label="Source Path" />
            <View style={styles.iconSquareBtn}>
              <View style={main.chevronStyle}>
                <ChevronIcon color={AppColors.grayTextStrong} size={14} />
              </View>
            </View>
          </View>
        </View>
      </Pressable>

      {main.isOpen && (
        <View>
          {hasParams && (
            <View style={styles.sourceParamsBox}>
              <Pressable onPress={params.toggleOpen} hitSlop={10}>
                <View style={styles.paramsAccordionHeader}>
                  <View style={styles.paramsAccordionLeft}>
                    <Text style={styles.sourceParamsLabel}>Parameters</Text>
                    <View style={styles.headerCountBadge}>
                      <Text style={styles.headerCountText}>
                        {Object.keys(routeInfo.params).length}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.paramsAccordionRight}>
                    <CopyButton value={routeInfo.params} label="Parameters" />
                    <View style={styles.iconSquareBtn}>
                      <View style={params.chevronStyle}>
                        <ChevronIcon color={AppColors.grayTextStrong} size={14} />
                      </View>
                    </View>
                  </View>
                </View>
              </Pressable>

              {params.isOpen && (
                <View style={styles.paramsBody}>
                  {Object.entries(routeInfo.params).map(([key, val], i, arr) => (
                    <View
                      key={key}
                      style={[
                        styles.paramRow,
                        i < arr.length - 1 ? styles.paramRowBorder : null,
                      ]}>
                      <Text style={styles.paramKey}>{key}</Text>
                      <View style={styles.paramValueRow}>
                        <Text selectable style={styles.paramValue}>
                          {typeof val === 'object'
                            ? JSON.stringify(val)
                            : String(val)}
                        </Text>
                        <CopyButton
                          value={
                            typeof val === 'object'
                              ? JSON.stringify(val)
                              : String(val)
                          }
                          label={key}
                        />
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}
        </View>
      )}
    </View>
  );
};

export default SourcePageCard;
