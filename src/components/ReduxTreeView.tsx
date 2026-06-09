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
import AnimatedEntrance from './AnimatedEntrance';

// Custom icons
const DatabaseIcon = ({color = AppColors.grayTextWeak, size = 12}: any) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 2C6.5 2 2 4.2 2 7v10c0 2.8 4.5 5 10 5s10-2.2 10-5V7c0-2.8-4.5-5-10-5z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M2 12c0 2.8 4.5 5 10 5s10-2.2 10-5"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M2 7c0 2.8 4.5 5 10 5s10-2.2 10-5"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const BoltIcon = ({color = AppColors.grayTextWeak, size = 12}: any) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"
      fill={color}
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

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

const animateTreeLayout = () => {
  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
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
}

const ReduxValueNode = ({name, value, level, search}: ReduxValueNodeProps) => {
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

    // Pick different colors for primitives
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
        <Text style={reduxValueStyles.keyText} selectable={true}>
          {nameStr}
          <Text style={reduxValueStyles.colonText}>: </Text>
          <Text
            style={[reduxValueStyles.valText, {color: valColor}]}
            selectable={true}>
            {valStr}
          </Text>
        </Text>
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
        <Text style={reduxValueStyles.keyText} selectable={true}>
          {nameStr}
          <Text style={reduxValueStyles.colonText}>: </Text>
          <Text style={reduxValueStyles.summaryText}>{summaryText}</Text>
        </Text>
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
        <Text style={styles.storeTitle}>🏪 Redux Store</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{reducers.length} Reducers</Text>
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
                    isLastReducer && {bottom: '50%'},
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
                  <Text style={styles.reducerText}>{reducerKey}</Text>
                </Pressable>

                {isExpanded && (
                  <View style={styles.reducerChildren}>
                    {/* Vertical line connecting children */}
                    <View style={styles.childrenVerticalLine} />

                    {/* Node 1: Last Action */}
                    <View style={styles.childItem}>
                      <View style={styles.childHorizontalLine} />
                      <View
                        style={[styles.iconWrap, {backgroundColor: '#FDF2F8'}]}>
                        <BoltIcon color="#DB2777" size={11} />
                      </View>
                      <View style={{flex: 1}}>
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: 6,
                          }}>
                          <Text style={styles.childLabel}>Last Action:</Text>
                          {lastAction ? (
                            <View style={styles.actionTypeBadge}>
                              <Text style={styles.actionTypeText}>
                                {lastAction.type}
                              </Text>
                            </View>
                          ) : (
                            <Text style={styles.noActionText}>
                              None dispatched
                            </Text>
                          )}
                        </View>
                        {lastAction && (
                          <Text style={styles.timestampText}>
                            Dispatched: {lastAction.timestamp}
                          </Text>
                        )}
                        {lastAction && lastAction.payload !== null && (
                          <View style={{marginTop: 6}}>
                            <ReduxValueNode
                              name="payload"
                              value={lastAction.payload}
                              level={0}
                              search={search}
                            />
                          </View>
                        )}
                      </View>
                    </View>

                    {/* Node 2: State Data */}
                    <View style={styles.childItem}>
                      <View
                        style={[styles.childHorizontalLine, {bottom: '50%'}]}
                      />
                      <View
                        style={[styles.iconWrap, {backgroundColor: '#ECFDF5'}]}>
                        <DatabaseIcon color="#059669" size={11} />
                      </View>
                      <View style={{flex: 1}}>
                        <Text style={styles.childLabel}>State Slice Data</Text>
                        <View style={{marginTop: 6}}>
                          <ReduxValueNode
                            name="state"
                            value={sliceData}
                            level={0}
                            search={search}
                          />
                        </View>
                      </View>
                    </View>
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

export const ReduxActionTimeline = ({
  history,
  onClear,
  search,
}: {
  history: Array<{
    id: number;
    type: string;
    payload: any;
    timestamp: string;
    affectedSlices: string[];
  }>;
  onClear: () => void;
  search?: string;
}) => {
  const [expandedActionId, setExpandedActionId] = useState<number | null>(null);

  const toggleExpand = (id: number) => {
    animateTreeLayout();
    setExpandedActionId(prev => (prev === id ? null : id));
  };

  const filteredHistory = history.filter(action => {
    if (!search) return true;
    const s = search.toLowerCase();
    if (action.type.toLowerCase().includes(s)) return true;
    if (action.affectedSlices.some(slice => slice.toLowerCase().includes(s)))
      return true;
    if (action.payload && typeof action.payload === 'object') {
      return JSON.stringify(action.payload).toLowerCase().includes(s);
    }
    return false;
  });

  return (
    <View style={timelineStyles.container}>
      <View style={timelineStyles.headerRow}>
        <Text style={timelineStyles.headerTitle}>
          ⚡ Dispatched Actions ({filteredHistory.length})
        </Text>
        {history.length > 0 && (
          <Pressable onPress={onClear} style={timelineStyles.clearBtn}>
            <Text style={timelineStyles.clearBtnText}>Clear Log</Text>
          </Pressable>
        )}
      </View>

      {filteredHistory.length === 0 ? (
        <View style={timelineStyles.emptyContainer}>
          <Text style={timelineStyles.emptyText}>
            {history.length === 0
              ? 'No actions dispatched yet.\nDispatch actions in your application to see the timeline.'
              : 'No matching actions found.'}
          </Text>
        </View>
      ) : (
        <View style={timelineStyles.listContainer}>
          {filteredHistory.map((item, index) => {
            const isLast = index === filteredHistory.length - 1;
            const isExpanded = expandedActionId === item.id;

            return (
              <AnimatedEntrance
                key={item.id}
                index={index}
                distance={8}
                style={timelineStyles.timelineItem}>
                {/* Visual Line */}
                <View
                  style={[
                    timelineStyles.verticalLine,
                    isLast && {bottom: '50%'},
                  ]}
                />
                <View style={timelineStyles.circleIndicator}>
                  <View style={timelineStyles.circleInner} />
                </View>

                {/* Card */}
                <Pressable
                  onPress={() => toggleExpand(item.id)}
                  style={[
                    timelineStyles.card,
                    isExpanded && {
                      borderColor: AppColors.purple,
                      backgroundColor: AppColors.purpleShade50,
                    },
                  ]}>
                  <View style={timelineStyles.cardHeader}>
                    <View style={timelineStyles.typeBadge}>
                      <Text style={timelineStyles.typeText}>{item.type}</Text>
                    </View>
                    <Text style={timelineStyles.timestamp}>
                      {item.timestamp}
                    </Text>
                  </View>

                  {item.affectedSlices.length > 0 && (
                    <View style={timelineStyles.slicesRow}>
                      <Text style={timelineStyles.slicesLabel}>Affected:</Text>
                      {item.affectedSlices.map(slice => (
                        <View key={slice} style={timelineStyles.slicePill}>
                          <Text style={timelineStyles.sliceText}>{slice}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {isExpanded && (
                    <View style={timelineStyles.payloadContainer}>
                      <Text style={timelineStyles.payloadTitle}>Payload</Text>
                      {item.payload !== null &&
                      typeof item.payload === 'object' ? (
                        <ReduxValueNode
                          name="action.payload"
                          value={item.payload}
                          level={0}
                          search={search}
                        />
                      ) : (
                        <Text style={timelineStyles.primitivePayload}>
                          {item.payload === null
                            ? 'null'
                            : String(item.payload)}
                        </Text>
                      )}
                    </View>
                  )}
                </Pressable>
              </AnimatedEntrance>
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

const timelineStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerTitle: {
    fontFamily: AppFonts.interBold,
    fontSize: 14,
    color: AppColors.primaryBlack,
  },
  clearBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderColor: 'rgba(239, 68, 68, 0.2)',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  clearBtnText: {
    fontFamily: AppFonts.interBold,
    fontSize: 10,
    color: '#EF4444',
  },
  emptyContainer: {
    paddingVertical: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontFamily: AppFonts.interRegular,
    fontSize: 12,
    color: AppColors.grayTextWeak,
    textAlign: 'center',
    lineHeight: 18,
  },
  listContainer: {
    paddingLeft: 12,
  },
  timelineItem: {
    position: 'relative',
    paddingLeft: 20,
    marginBottom: 12,
  },
  verticalLine: {
    position: 'absolute',
    left: 4,
    top: 0,
    bottom: -12,
    width: 1,
    backgroundColor: AppColors.dividerColor,
  },
  circleIndicator: {
    position: 'absolute',
    left: 0,
    top: 10,
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: AppColors.purpleShade50,
    borderWidth: 1,
    borderColor: AppColors.purple,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleInner: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: AppColors.purple,
  },
  card: {
    backgroundColor: AppColors.primaryLight,
    borderWidth: 1,
    borderColor: AppColors.grayBorderSecondary,
    borderRadius: 8,
    padding: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  typeBadge: {
    backgroundColor: 'rgba(104,75,155,0.08)',
    borderColor: 'rgba(104,75,155,0.18)',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2.5,
    flexShrink: 1,
  },
  typeText: {
    fontFamily: AppFonts.interBold,
    fontSize: 11,
    color: AppColors.purple,
  },
  timestamp: {
    fontFamily: AppFonts.interRegular,
    fontSize: 10,
    color: AppColors.grayTextWeak,
  },
  slicesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 6,
  },
  slicesLabel: {
    fontFamily: AppFonts.interMedium,
    fontSize: 10,
    color: AppColors.grayTextWeak,
    marginRight: 2,
  },
  slicePill: {
    backgroundColor: AppColors.grayBackground,
    borderColor: AppColors.dividerColor,
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  sliceText: {
    fontFamily: AppFonts.interMedium,
    fontSize: 9,
    color: AppColors.grayText,
  },
  payloadContainer: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: AppColors.dividerColor,
    paddingTop: 8,
  },
  payloadTitle: {
    fontFamily: AppFonts.interBold,
    fontSize: 10,
    color: AppColors.grayTextWeak,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  primitivePayload: {
    fontFamily: AppFonts.interRegular,
    fontSize: 11,
    color: AppColors.grayTextStrong,
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
  childItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    position: 'relative',
    paddingLeft: 12,
  },
  childHorizontalLine: {
    position: 'absolute',
    left: -12,
    top: 10,
    width: 12,
    height: 1,
    backgroundColor: AppColors.dividerColor,
  },
  childLabel: {
    fontFamily: AppFonts.interBold,
    fontSize: 11.5,
    color: AppColors.grayText,
    marginTop: 2,
  },
  actionTypeBadge: {
    backgroundColor: '#FCE7F3',
    borderColor: '#FBCFE8',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  actionTypeText: {
    fontFamily: AppFonts.interBold,
    fontSize: 10.5,
    color: '#BE185D',
  },
  noActionText: {
    fontFamily: AppFonts.interRegular,
    fontSize: 11,
    color: AppColors.grayTextWeak,
  },
  timestampText: {
    fontFamily: AppFonts.interRegular,
    fontSize: 9.5,
    color: AppColors.grayTextWeak,
    marginTop: 2,
  },
});
