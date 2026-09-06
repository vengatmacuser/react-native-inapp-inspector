import React, {useState, useEffect} from 'react';
import {Text, View, Image, Pressable, StyleSheet, Platform} from 'react-native';

// Helpers
import {escapeRegex} from '../helpers';

// Assets
import {ChevronIcon, DocIcon} from './NetworkIcons';

// Stylesheet
import {AppColors} from '../styles/AppColors';

// Type Definition
import {TreeNodeProps} from '../types';

const monoFont = Platform.select({
  ios: 'Menlo',
  android: 'monospace',
  default: 'monospace',
});

const IndentGuides = React.memo(({level}: {level: number}) => {
  if (level <= 0) return null;
  const guides = [];
  for (let i = 0; i < level; i++) {
    guides.push(
      <View key={i} style={nodeStyles.indentGuideCell}>
        <View style={nodeStyles.indentGuideLine} />
      </View>
    );
  }
  return <View style={nodeStyles.indentGuidesContainer}>{guides}</View>;
});

const TreeNode = React.memo(function TreeNode({
  data,
  name,
  level = 0,
  search,
  forceOpen,
  defaultExpandDepth = 1,
}: TreeNodeProps) {
  const [localOpen, setLocalOpen] = useState<boolean>(() => {
    if (forceOpen !== undefined) {
      return forceOpen;
    }
    return defaultExpandDepth !== undefined ? level < defaultExpandDepth : level < 1;
  });
  const open = localOpen;

  useEffect(() => {
    if (forceOpen !== undefined) {
      setLocalOpen(forceOpen);
    }
  }, [forceOpen]);

  const isObject = typeof data === 'object' && data !== null;
  const isArray = Array.isArray(data);

  function getSyntaxStyle(val: unknown) {
    if (val === null || val === undefined) return nodeStyles.syntaxNull;
    if (typeof val === 'number') return nodeStyles.syntaxNumber;
    if (typeof val === 'boolean') return nodeStyles.syntaxBoolean;
    return nodeStyles.syntaxString;
  }

  function renderHighlighted(text: string, val: unknown): React.ReactNode[] {
    const valStyle = getSyntaxStyle(val);
    if (text === 'null' || text === 'undefined') {
      return [
        <Text key="nil" style={nodeStyles.syntaxNull}>
          {text}
        </Text>,
      ];
    }
    if (!search) {
      return [
        <Text key="plain" style={valStyle}>
          {text}
        </Text>,
      ];
    }
    const regex = new RegExp(`(${escapeRegex(search)})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) =>
      part.toLowerCase() === search.toLowerCase() ? (
        <Text key={i} style={nodeStyles.highlight}>
          {part}
        </Text>
      ) : (
        <Text key={i} style={valStyle}>
          {part}
        </Text>
      ),
    );
  }

  if (isObject && (data as any)._isFile) {
    const file = data as any;
    const isImage = file.type?.includes('image');

    return (
      <View style={nodeStyles.treeNodeWrapper}>
        <IndentGuides level={level} />
        <View style={nodeStyles.filePreviewNode}>
          {name !== undefined && (
            <Text style={[nodeStyles.codeKey, {marginBottom: 4}]}>{`"${String(
              name,
            )}": `}</Text>
          )}
          <View style={nodeStyles.filePreviewCard}>
            {isImage ? (
              <Image
                source={{uri: file.uri}}
                style={nodeStyles.filePreviewThumb}
                resizeMode="cover"
              />
            ) : (
              <View style={nodeStyles.filePreviewDoc}>
                <DocIcon color={AppColors.slate400} size={18} />
              </View>
            )}
            <View style={{flex: 1}}>
              <Text style={nodeStyles.filePreviewName} numberOfLines={1}>
                {file.name}
              </Text>
              <Text style={nodeStyles.filePreviewType}>{file.type}</Text>
            </View>
          </View>
        </View>
      </View>
    );
  }

  if (!isObject) {
    const serialized = JSON.stringify(data) ?? String(data);
    const prefix = name !== undefined ? `"${String(name)}": ` : null;
    return (
      <View style={nodeStyles.treeNodeWrapper}>
        <IndentGuides level={level} />
        <View style={nodeStyles.leafRow}>
          <Text selectable={true} style={nodeStyles.codeLine}>
            {prefix && <Text style={nodeStyles.codeKey}>{prefix}</Text>}
            {renderHighlighted(serialized, data)}
          </Text>
        </View>
      </View>
    );
  }

  const entries: [string | number, unknown][] = isArray
    ? (data as unknown[]).map((v, i) => [i, v])
    : Object.entries(data as Record<string, unknown>);

  const countLabel = isArray ? `[${entries.length}]` : `{${entries.length}}`;

  return (
    <View>
      <View style={nodeStyles.treeNodeWrapper}>
        <IndentGuides level={level} />
        <Pressable
          style={nodeStyles.treeRow}
          onPress={() => setLocalOpen(v => !v)}
          hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
          <View
            style={{transform: [{rotate: open ? '180deg' : '0deg'}], marginRight: 6}}>
            <ChevronIcon color="#64748B" size={11} />
          </View>
          {name !== undefined && (
            <Text style={[nodeStyles.codeKey, nodeStyles.treeKeyMargin]}>{`"${String(
              name,
            )}": `}</Text>
          )}
          <Text style={nodeStyles.codeSyntax}>{isArray ? '[' : '{'}</Text>
          <View style={isArray ? nodeStyles.arrayBadge : nodeStyles.objectBadge}>
            <Text style={isArray ? nodeStyles.arrayBadgeText : nodeStyles.objectBadgeText}>
              {countLabel}
            </Text>
          </View>
        </Pressable>
      </View>

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

      {open && (
        <View style={nodeStyles.treeNodeWrapper}>
          <IndentGuides level={level} />
          <View style={{paddingLeft: 18}}>
            <Text style={nodeStyles.codeSyntax}>{isArray ? ']' : '}'}</Text>
          </View>
        </View>
      )}
    </View>
  );
});

const nodeStyles = StyleSheet.create({
  treeNodeWrapper: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  indentGuidesContainer: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  indentGuideCell: {
    width: 14,
    alignItems: 'flex-start',
    justifyContent: 'center',
    position: 'relative',
  },
  indentGuideLine: {
    position: 'absolute',
    left: 4,
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: '#E2E8F0', // subtle editor guide line
  },
  leafRow: {
    paddingVertical: 2,
    flex: 1,
  },
  treeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
    flex: 1,
  },
  treeKeyMargin: {
    marginRight: 2,
  },
  codeLine: {
    fontFamily: monoFont,
    fontSize: 12,
    lineHeight: 18,
    color: '#0F172A', // Slate 900
  },
  codeKey: {
    fontFamily: monoFont,
    fontSize: 12,
    color: '#4F46E5', // Indigo 600
    fontWeight: '600',
  },
  codeSyntax: {
    fontFamily: monoFont,
    fontSize: 12,
    color: '#64748B', // Slate 500
  },
  syntaxString: {
    fontFamily: monoFont,
    fontSize: 12,
    color: '#059669', // Emerald 600
  },
  syntaxNumber: {
    fontFamily: monoFont,
    fontSize: 12,
    color: '#D97706', // Warm Amber 600
  },
  syntaxBoolean: {
    fontFamily: monoFont,
    fontSize: 12,
    color: '#DB2777', // Fuchsia / Pink 600
  },
  syntaxNull: {
    fontFamily: monoFont,
    fontSize: 12,
    color: '#E11D48', // Rose 600
    fontStyle: 'italic',
  },
  highlight: {
    backgroundColor: '#FEF08A',
    color: '#854D0E',
    fontFamily: monoFont,
    fontWeight: '700',
    borderRadius: 2,
  },
  arrayBadge: {
    backgroundColor: '#EEF2FF',
    borderColor: '#C7D2FE',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 5,
    paddingVertical: 1,
    marginLeft: 6,
  },
  arrayBadgeText: {
    fontFamily: monoFont,
    color: '#4F46E5',
    fontSize: 10,
    fontWeight: '600',
  },
  objectBadge: {
    backgroundColor: '#F1F5F9',
    borderColor: '#CBD5E1',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 5,
    paddingVertical: 1,
    marginLeft: 6,
  },
  objectBadgeText: {
    fontFamily: monoFont,
    color: '#475569',
    fontSize: 10,
    fontWeight: '600',
  },
  filePreviewNode: {
    marginVertical: 4,
  },
  filePreviewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 8,
    gap: 8,
    marginTop: 2,
  },
  filePreviewThumb: {
    width: 36,
    height: 36,
    borderRadius: 4,
  },
  filePreviewDoc: {
    width: 36,
    height: 36,
    borderRadius: 4,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filePreviewName: {
    fontFamily: monoFont,
    fontSize: 11.5,
    color: '#0F172A',
  },
  filePreviewType: {
    fontFamily: monoFont,
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },
});

export default TreeNode;
