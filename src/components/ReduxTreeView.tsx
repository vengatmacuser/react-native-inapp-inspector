import React, {useEffect, useRef, useState} from 'react';
import {
  Animated,
  LayoutAnimation,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  UIManager,
  View,
} from 'react-native';
import {AppColors} from '../styles/AppColors';
import {AppFonts} from '../styles/AppFonts';
import {ChevronIcon} from './NetworkIcons';
import Svg, {Path} from 'react-native-svg';

const FolderIcon = ({color = AppColors.grayTextWeak, size = 12}: any) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const ReduxStoreIcon = ({
  color = AppColors.grayTextWeak,
  size = 12,
}: any) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3 9l1.5-5h15L21 9M3 9v10a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V9M3 9h18M7 9v3a2 2 0 0 0 4 0V9m2 0v3a2 2 0 0 0 4 0V9"
      stroke={color}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const animateTreeLayout = () => {
  if (Platform.OS === 'ios') {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  }
};

const AnimatedChevron = ({
  color,
  expanded,
  size,
  style,
}: {
  color: string;
  expanded: boolean;
  size: number;
  style: any;
}) => {
  const progress = useRef(new Animated.Value(expanded ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: expanded ? 1 : 0,
      duration: 180,
      useNativeDriver: true,
    }).start();
  }, [expanded, progress]);

  const rotate = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '90deg'],
  });

  return (
    <Animated.View style={[style, {transform: [{rotate}]}]}>
      <ChevronIcon color={color} size={size} />
    </Animated.View>
  );
};

interface ReduxValueNodeProps {
  name: string | number;
  value: any;
  level: number;
  search?: string;
  lastAction?: {
    type: string;
    payload: any;
    timestamp: string;
  } | null;
}

const ReduxValueNode = ({name, value, level, search, lastAction}: ReduxValueNodeProps) => {
  const [expanded, setExpanded] = useState(level < 1);
  const isObject = typeof value === 'object' && value !== null;
  const isArray = Array.isArray(value);

  const nameStr = String(name);

  // Filter check if search query matches key or value
  const matchesSearch = (k: string, val: any): boolean => {
    if (!search) return true;
    const s = search.toLowerCase();
    if (k.toLowerCase().includes(s)) return true;
    if (typeof val !== 'object' && String(val).toLowerCase().includes(s))
      return true;
    if (typeof val === 'object' && val !== null) {
      return Object.keys(val).some(key => matchesSearch(key, val[key]));
    }
    return false;
  };

  if (!matchesSearch(nameStr, value)) {
    return null;
  }

  if (!isObject) {
    const valStr =
      value === null
        ? 'null'
        : value === undefined
        ? 'undefined'
        : String(value);

    let valColor = '#0D9488'; // String
    if (value === null || value === undefined) {
      valColor = AppColors.grayTextWeak;
    } else if (typeof value === 'number') {
      valColor = '#D97706';
    } else if (typeof value === 'boolean') {
      valColor = '#4F46E5';
    }

    return (
      <View style={[reduxValueStyles.treeRow, {paddingLeft: 12}]}>
        <View style={reduxValueStyles.treeLeafConnector} />
        <View style={{flexDirection: 'row', alignItems: 'center', flex: 1, flexWrap: 'wrap', gap: 6}}>
          <Text style={reduxValueStyles.keyText} selectable={true}>
            {nameStr}
            <Text style={reduxValueStyles.colonText}>: </Text>
            <Text
              style={[reduxValueStyles.valText, {color: valColor}]}
              selectable={true}>
              {valStr}
            </Text>
          </Text>
          {lastAction && (
            <View style={styles.actionTypeBadge}>
              <Text style={styles.actionTypeText} numberOfLines={1}>
                {lastAction.type}
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  }

  const keys = Object.keys(value);
  const summaryText = isArray
    ? `Array [${keys.length}]`
    : `Object {${keys.length}}`;

  return (
    <View style={reduxValueStyles.treeNodeBlock}>
      <Pressable
        onPress={() => {
          animateTreeLayout();
          setExpanded(!expanded);
        }}
        style={reduxValueStyles.treeRow}>
        <View style={reduxValueStyles.treeLeafConnector} />
        <AnimatedChevron
          color={AppColors.grayTextWeak}
          expanded={expanded}
          size={10}
          style={reduxValueStyles.chevronWrap}
        />
        <View style={{flexDirection: 'row', alignItems: 'center', flex: 1, flexWrap: 'wrap', gap: 6}}>
          <Text style={reduxValueStyles.keyText} selectable={true}>
            {nameStr}
            <Text style={reduxValueStyles.colonText}>: </Text>
            <Text style={reduxValueStyles.summaryText}>{summaryText}</Text>
          </Text>
          {lastAction && (
            <View style={styles.actionTypeBadge}>
              <Text style={styles.actionTypeText} numberOfLines={1}>
                {lastAction.type}
              </Text>
            </View>
          )}
        </View>
      </Pressable>
      {expanded && (
        <View style={reduxValueStyles.treeChildrenContainer}>
          {keys.map(key => (
            <ReduxValueNode
              key={key}
              name={key}
              value={value[key]}
              level={level + 1}
              search={search}
            />
          ))}
        </View>
      )}
    </View>
  );
};

export const ReduxTreeView = ({
  state,
  lastActionMap,
  search,
}: {
  state: any;
  lastActionMap: Record<string, any>;
  search?: string;
}) => {
  const [storeExpanded, setStoreExpanded] = useState(true);
  const [reducerExpanded, setReducerExpanded] = useState<
    Record<string, boolean>
  >({});

  useEffect(() => {
    if (Platform.OS === 'android') {
      UIManager.setLayoutAnimationEnabledExperimental?.(true);
    }
  }, []);

  if (!state || typeof state !== 'object') {
    return (
      <Text
        style={{
          fontFamily: AppFonts.interRegular,
          fontSize: 12,
          color: AppColors.grayTextWeak,
          padding: 12,
        }}>
        No state object to display.
      </Text>
    );
  }

  const reducers = Object.keys(state);

  const toggleReducer = (key: string) => {
    animateTreeLayout();
    setReducerExpanded(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <View style={styles.container}>
      {/* Root Node: Store */}
      <Pressable
        onPress={() => {
          animateTreeLayout();
          setStoreExpanded(!storeExpanded);
        }}
        style={styles.storeHeader}>
        <AnimatedChevron
          color="#FFFFFF"
          expanded={storeExpanded}
          size={12}
          style={styles.chevronWrap}
        />
        <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
          <ReduxStoreIcon color="#FFFFFF" size={14} />
          <Text style={styles.storeTitle}>Redux Store</Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{reducers.length} Slices</Text>
        </View>
      </Pressable>

      {storeExpanded && (
        <View style={styles.storeChildren}>
          {reducers.map((reducerKey, index) => {
            const isLastReducer = index === reducers.length - 1;
            const isExpanded = !!reducerExpanded[reducerKey];
            const sliceData = state[reducerKey];
            const lastAction = lastActionMap[reducerKey];

            return (
              <View key={reducerKey} style={styles.reducerContainer}>
                {/* Visual Branch Line for Reducer */}
                <View
                  style={[
                    styles.reducerVerticalLine,
                    isLastReducer && !isExpanded && {bottom: '50%'},
                  ]}
                />

                {/* Reducer Header */}
                <Pressable
                  onPress={() => toggleReducer(reducerKey)}
                  style={styles.reducerHeader}>
                  <View style={styles.reducerHorizontalLine} />
                  <AnimatedChevron
                    color={AppColors.purple}
                    expanded={isExpanded}
                    size={10}
                    style={styles.chevronWrap}
                  />
                  <View style={styles.iconWrap}>
                    <FolderIcon color={AppColors.purple} size={11} />
                  </View>
                  <View style={{flexDirection: 'row', alignItems: 'center', flex: 1, flexWrap: 'wrap', gap: 6}}>
                    <Text style={styles.reducerText}>{reducerKey}</Text>
                    {lastAction && (
                      <View style={styles.actionTypeBadge}>
                        <Text style={styles.actionTypeText} numberOfLines={1}>
                          {lastAction.type}
                        </Text>
                      </View>
                    )}
                  </View>
                </Pressable>

                {isExpanded && (
                  <View style={styles.reducerChildren}>
                    {/* Vertical line connecting children */}
                    <View style={styles.childrenVerticalLine} />
                    {typeof sliceData === 'object' && sliceData !== null ? (
                      Object.keys(sliceData).map(k => (
                        <ReduxValueNode
                          key={k}
                          name={k}
                          value={sliceData[k]}
                          level={0}
                          search={search}
                        />
                      ))
                    ) : (
                      <ReduxValueNode
                        name={reducerKey}
                        value={sliceData}
                        level={0}
                        search={search}
                        lastAction={lastAction}
                      />
                    )}
                  </View>
                )}
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
};

const reduxValueStyles = StyleSheet.create({
  treeNodeBlock: {
    marginTop: 4,
  },
  treeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
    gap: 4,
    position: 'relative',
  },
  treeLeafConnector: {
    position: 'absolute',
    left: -12,
    top: '50%',
    width: 8,
    height: 1,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.dividerColor,
    opacity: 0.5,
  },
  treeChildrenContainer: {
    paddingLeft: 14,
    borderLeftWidth: 1,
    borderLeftColor: AppColors.dividerColor,
    marginLeft: 6,
  },
  chevronWrap: {
    width: 10,
    height: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyText: {
    fontFamily: AppFonts.interMedium,
    fontSize: 11.5,
    color: AppColors.grayTextStrong,
  },
  colonText: {
    color: AppColors.grayTextWeak,
  },
  valText: {
    fontFamily: AppFonts.interRegular,
    fontSize: 11.5,
  },
  summaryText: {
    fontFamily: AppFonts.interRegular,
    fontSize: 11,
    color: AppColors.grayTextWeak,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  storeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.purple,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 8,
  },
  chevronWrap: {
    width: 12,
    height: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storeTitle: {
    fontFamily: AppFonts.interBold,
    fontSize: 14,
    color: '#FFFFFF',
  },
  badge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 'auto',
  },
  badgeText: {
    fontFamily: AppFonts.interBold,
    fontSize: 10,
    color: '#FFFFFF',
  },
  storeChildren: {
    paddingLeft: 12,
    marginTop: 4,
  },
  reducerContainer: {
    position: 'relative',
    paddingLeft: 16,
    paddingVertical: 4,
  },
  reducerVerticalLine: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: AppColors.dividerColor,
  },
  reducerHorizontalLine: {
    position: 'absolute',
    left: -16,
    top: '50%',
    width: 16,
    height: 1,
    backgroundColor: AppColors.dividerColor,
  },
  reducerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    gap: 6,
  },
  iconWrap: {
    width: 18,
    height: 18,
    borderRadius: 4,
    backgroundColor: AppColors.purpleShade50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reducerText: {
    fontFamily: AppFonts.interBold,
    fontSize: 13,
    color: AppColors.primaryBlack,
  },
  reducerChildren: {
    paddingLeft: 20,
    position: 'relative',
    marginTop: 4,
    gap: 10,
  },
  childrenVerticalLine: {
    position: 'absolute',
    left: 8,
    top: 0,
    bottom: 16,
    width: 1,
    backgroundColor: AppColors.dividerColor,
  },
  actionTypeBadge: {
    backgroundColor: '#FCE7F3',
    borderColor: '#FBCFE8',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  actionTypeText: {
    fontFamily: AppFonts.interBold,
    fontSize: 10,
    color: '#BE185D',
  },
});
