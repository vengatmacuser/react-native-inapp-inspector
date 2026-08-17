import React, {useState, useRef, useEffect} from 'react';
import {Text, View, Image, Animated, Pressable} from 'react-native';

// Helpers
import {escapeRegex} from '../helpers';

// Assets
import {ChevronIcon, DocIcon} from './NetworkIcons';

// Stylesheet
import {AppColors} from '../styles/AppColors';
import styles from '../styles';

// Type Definition
import {TreeNodeProps} from '../types';

const TreeNode = React.memo(function TreeNode({
  data,
  name,
  level = 0,
  search,
  forceOpen,
  defaultExpandDepth,
}: TreeNodeProps) {
  const [localOpen, setLocalOpen] = useState(
    forceOpen || level < (defaultExpandDepth ?? 1),
  );
  const open = localOpen;

  const isObject = typeof data === 'object' && data !== null;
  const isArray = Array.isArray(data);

  // Declare all hooks at the top unconditionally (prevents "Rendered fewer hooks than expected" error)
  const treeChevronAnim = useRef(new Animated.Value(open ? 1 : 0)).current;
  useEffect(() => {
    Animated.timing(treeChevronAnim, {
      toValue: open ? 1 : 0,
      duration: 160,
      useNativeDriver: true,
    }).start();
  }, [open]);

  const treeChevronRotate = treeChevronAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  function renderHighlighted(text: string): React.ReactNode[] {
    if (text === 'null' || text === 'undefined') {
      return [
        <Text key="nil" style={styles.codeTextNil}>
          {text}
        </Text>,
      ];
    }
    if (!search) {
      return [
        <Text key="plain" style={styles.codeText}>
          {text}
        </Text>,
      ];
    }
    const regex = new RegExp(`(${escapeRegex(search)})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) =>
      part.toLowerCase() === search.toLowerCase() ? (
        <Text key={i} style={styles.highlight}>
          {part}
        </Text>
      ) : (
        <Text key={i} style={styles.codeText}>
          {part}
        </Text>
      ),
    );
  }

  const indentStyle = {paddingLeft: level * 12};

  if (isObject && (data as any)._isFile) {
    const file = data as any;
    const isImage = file.type?.includes('image');

    return (
      <View style={[indentStyle, styles.filePreviewNode]}>
        {name !== undefined && (
          <Text style={[styles.codeKey, {marginBottom: 4}]}>{`"${String(
            name,
          )}": `}</Text>
        )}
        <View style={styles.filePreviewCard}>
          {isImage ? (
            <Image
              source={{uri: file.uri}}
              style={styles.filePreviewThumb}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.filePreviewDoc}>
              <DocIcon color={AppColors.grayTextWeak} size={20} />
            </View>
          )}
          <View style={{flex: 1}}>
            <Text style={styles.filePreviewName} numberOfLines={1}>
              {file.name}
            </Text>
            <Text style={styles.filePreviewType}>{file.type}</Text>
          </View>
        </View>
      </View>
    );
  }

  if (!isObject) {
    const serialized = JSON.stringify(data) ?? String(data);
    const prefix = name !== undefined ? `"${String(name)}": ` : null;
    return (
      <View style={indentStyle}>
        <Text selectable={true} style={styles.codeText}>
          <Text style={styles.codeKey}>{prefix}</Text>
          {renderHighlighted(serialized)}
        </Text>
      </View>
    );
  }

  const entries: [string | number, unknown][] = isArray
    ? (data as unknown[]).map((v, i) => [i, v])
    : Object.entries(data as Record<string, unknown>);

  const countLabel = isArray ? `[${entries.length}]` : `{${entries.length}}`;

  return (
    <View style={indentStyle}>
      <Pressable
        style={styles.treeRow}
        onPress={() => setLocalOpen(v => !v)}
        hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
        <Animated.View
          style={{transform: [{rotate: treeChevronRotate}], marginRight: 6}}>
          <ChevronIcon color={AppColors.grayTextWeak} size={12} />
        </Animated.View>
        {name !== undefined && (
          <Text style={[styles.codeKey, styles.treeKeyMargin]}>{`"${String(
            name,
          )}"`}</Text>
        )}
        {isArray ? (
          <View style={styles.arrayBadge}>
            <Text style={styles.arrayBadgeText}>{countLabel}</Text>
          </View>
        ) : (
          <View style={styles.objectBadge}>
            <Text style={styles.objectBadgeText}>{countLabel}</Text>
          </View>
        )}
      </Pressable>

      {open &&
        entries.map(([k, v]) => (
          <TreeNode
            key={String(k)}
            name={k}
            data={v}
            level={level + 1}
            search={search}
            forceOpen={forceOpen}
            defaultExpandDepth={defaultExpandDepth}
          />
        ))}

      {open && <Text style={styles.codeSyntax}>{isArray ? ']' : '}'}</Text>}
    </View>
  );
});

export default TreeNode;
