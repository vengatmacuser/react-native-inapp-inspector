import React, {useMemo, useState, useRef, useEffect} from 'react';
import {StyleSheet, Text, View, Platform, FlatList, TextInput, Pressable} from 'react-native';
import Svg, {Path} from 'react-native-svg';
import {SearchIcon, ClearIcon} from './NetworkIcons';
import CopyButton from './CopyButton';
import TouchableScale from './TouchableScale';
import {AppColors} from '../styles/AppColors';
import {AppFonts} from '../styles/AppFonts';

interface CodeSnippetProps {
  code: string;
  language: 'html' | 'css' | 'javascript';
  search?: string;
}

const escapeRegExp = (string: string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

// HTML pretty printer
const formatHTML = (html: string): string => {
  if (!html) return '';
  let indent = 0;
  const cleaned = html
    .replace(/<([a-zA-Z0-9:-]+)([^>]*)>\s*<\/([a-zA-Z0-9:-]+)>/g, '<$1$2></$3>')
    .replace(/(<[^>]+>)/g, '\n$1\n')
    .replace(/\n+/g, '\n');

  const lines = cleaned.split('\n');
  const formatted: string[] = [];
  const selfClosingTags =
    /^(?:area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)$/i;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    if (line.startsWith('</')) {
      indent = Math.max(0, indent - 1);
    }

    formatted.push('  '.repeat(indent) + line);

    if (
      line.startsWith('<') &&
      !line.startsWith('</') &&
      !line.startsWith('<!') &&
      !line.endsWith('/>')
    ) {
      const tagNameMatch = line.match(/^<([a-zA-Z0-9:-]+)/);
      if (tagNameMatch) {
        const tagName = tagNameMatch[1];
        if (!selfClosingTags.test(tagName)) {
          const closeTagRegex = new RegExp(`</${escapeRegExp(tagName)}>`);
          if (!closeTagRegex.test(line)) {
            indent++;
          }
        }
      }
    }
  }
  return formatted.join('\n');
};

// CSS pretty printer
const formatCSS = (css: string): string => {
  if (!css) return '';
  const cleaned = css
    .replace(/\s*\{\s*/g, ' {\n')
    .replace(/\s*;\s*/g, ';\n')
    .replace(/\s*\}\s*/g, '\n}\n')
    .replace(/\n+/g, '\n');

  const lines = cleaned.split('\n');
  let indent = 0;
  const formatted: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    if (line.startsWith('}')) {
      indent = Math.max(0, indent - 1);
    }

    formatted.push('  '.repeat(indent) + line);

    if (line.endsWith('{')) {
      indent++;
    }
  }
  return formatted.join('\n');
};

// JS pretty printer
const formatJS = (js: string): string => {
  if (!js) return '';
  const lines = js.split(/\r?\n/);
  let indent = 0;
  const formatted: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    let openCount = (line.match(/\{|\[/g) || []).length;
    let closeCount = (line.match(/\}|\]/g) || []).length;

    if (line.startsWith('}') || line.startsWith(']')) {
      indent = Math.max(0, indent - 1);
    } else if (closeCount > openCount) {
      indent = Math.max(0, indent - (closeCount - openCount));
    }

    formatted.push('  '.repeat(indent) + line);

    if (
      openCount > closeCount &&
      !line.startsWith('}') &&
      !line.startsWith(']')
    ) {
      indent += openCount - closeCount;
    } else if (line.endsWith('{') || line.endsWith('[')) {
      indent++;
    }
  }
  return formatted.join('\n');
};

const tokenizeJS = (text: string) => {
  const tokens: {text: string; type: string}[] = [];
  const regex =
    /(\/\/.*|\/\*[\s\S]*?\*\/)|(\"(?:\\.|[^\"\\])*\"|\'(?:\\.|[^\'\\])*\'|\`(?:\\.|[^\`\\])*\`)|(\b(const|let|var|function|return|if|else|for|while|import|export|class|try|catch|new|this|async|await|break|continue|switch|case|default|throw|typeof|yield)\b)|(\b(console|window|document|fetch|global|require|module|exports|Promise|Map|Set|Array|Object|String|Number|Boolean)\b)|(\b\d+(?:\.\d+)?\b)/g;

  let lastIndex = 0;
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (regex.lastIndex === match.index) {
      regex.lastIndex++;
    }
    if (match.index > lastIndex) {
      tokens.push({
        text: text.substring(lastIndex, match.index),
        type: 'plain',
      });
    }
    const matchedText = match[0];
    if (match[1]) tokens.push({text: matchedText, type: 'comment'});
    else if (match[2]) tokens.push({text: matchedText, type: 'string'});
    else if (match[3]) tokens.push({text: matchedText, type: 'keyword'});
    else if (match[4]) tokens.push({text: matchedText, type: 'builtin'});
    else if (match[5]) tokens.push({text: matchedText, type: 'number'});

    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) {
    tokens.push({text: text.substring(lastIndex), type: 'plain'});
  }
  return tokens;
};

const tokenizeCSS = (text: string) => {
  const tokens: {text: string; type: string}[] = [];
  const regex =
    /(\/\*[\s\S]*?\*\/)|(\.[a-zA-Z0-9_-]+|#[a-zA-Z0-9_-]+|[a-zA-Z0-9_-]+(?=\s*\{))|([a-zA-Z0-9_-]+(?=\s*:))|(:[^;]+;)/g;

  let lastIndex = 0;
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (regex.lastIndex === match.index) {
      regex.lastIndex++;
    }
    if (match.index > lastIndex) {
      tokens.push({
        text: text.substring(lastIndex, match.index),
        type: 'plain',
      });
    }
    const matchedText = match[0];
    if (match[1]) tokens.push({text: matchedText, type: 'comment'});
    else if (match[2]) tokens.push({text: matchedText, type: 'selector'});
    else if (match[3]) tokens.push({text: matchedText, type: 'property'});
    else if (match[4]) {
      tokens.push({text: ':', type: 'plain'});
      tokens.push({text: matchedText.substring(1), type: 'value'});
    }

    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) {
    tokens.push({text: text.substring(lastIndex), type: 'plain'});
  }
  return tokens;
};

const tokenizeHTML = (text: string) => {
  const tokens: {text: string; type: string}[] = [];
  const regex =
    /(<!--[\s\S]*?-->)|(<\/?[a-zA-Z0-9:-]+>?)|(\"(?:\\.|[^\"\\])*\"|\'(?:\\.|[^\'\\])*\')|([a-zA-Z0-9:-]+(?=\s*=))/g;

  let lastIndex = 0;
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (regex.lastIndex === match.index) {
      regex.lastIndex++;
    }
    if (match.index > lastIndex) {
      tokens.push({
        text: text.substring(lastIndex, match.index),
        type: 'plain',
      });
    }
    const matchedText = match[0];
    if (match[1]) tokens.push({text: matchedText, type: 'comment'});
    else if (match[2]) tokens.push({text: matchedText, type: 'tag'});
    else if (match[3]) tokens.push({text: matchedText, type: 'string'});
    else if (match[4]) tokens.push({text: matchedText, type: 'attribute'});

    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) {
    tokens.push({text: text.substring(lastIndex), type: 'plain'});
  }
  return tokens;
};

const getStyleForType = (type: string) => {
  switch (type) {
    case 'comment':
      return styles.comment;
    case 'string':
      return styles.string;
    case 'keyword':
      return styles.keyword;
    case 'builtin':
      return styles.builtin;
    case 'number':
      return styles.number;
    case 'tag':
      return styles.tag;
    case 'attribute':
      return styles.attribute;
    case 'selector':
      return styles.selector;
    case 'property':
      return styles.property;
    case 'value':
      return styles.value;
    default:
      return styles.plain;
  }
};

const ArrowUpIcon = ({color = '#64748B', size = 16}: {color?: string; size?: number}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M18 15l-6-6-6 6" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const ArrowDownIcon = ({color = '#64748B', size = 16}: {color?: string; size?: number}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M6 9l6 6 6-6" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const CodeSnippetLine = React.memo(
  ({
    line,
    lineIndex,
    language,
    search,
    isActiveMatch,
  }: {
    line: string;
    lineIndex: number;
    language: 'html' | 'css' | 'javascript';
    search: string;
    isActiveMatch: boolean;
  }) => {
    const tokens = useMemo(() => {
      if (language === 'html') return tokenizeHTML(line);
      if (language === 'css') return tokenizeCSS(line);
      return tokenizeJS(line);
    }, [line, language]);

    const renderTokenText = (text: string, type: string) => {
      const baseStyle = getStyleForType(type);
      if (!search) {
        return <Text style={baseStyle}>{text}</Text>;
      }

      const parts = text.split(new RegExp(`(${escapeRegExp(search)})`, 'gi'));
      return (
        <Text style={baseStyle}>
          {parts.map((part, index) => {
            const isMatch = part.toLowerCase() === search.toLowerCase();
            return isMatch ? (
              <Text key={index} style={styles.highlight}>
                {part}
              </Text>
            ) : (
              part
            );
          })}
        </Text>
      );
    };

    return (
      <View style={[styles.lineRow, isActiveMatch && styles.activeMatchRow]}>
        {/* Gutter Line Number */}
        <View style={[styles.gutter, isActiveMatch && styles.activeMatchGutter]}>
          <Text style={[styles.lineNumber, isActiveMatch && styles.activeMatchLineNumber]}>{lineIndex + 1}</Text>
        </View>

        {/* Highlighted Code Line */}
        <View style={styles.codeLine}>
          <Text style={styles.codeLineText}>
            {tokens.length === 0 ? (
              <Text style={styles.plain}> </Text>
            ) : (
              tokens.map((token, tokenIdx) => (
                <React.Fragment key={tokenIdx}>
                  {renderTokenText(token.text, token.type)}
                </React.Fragment>
              ))
            )}
          </Text>
        </View>
      </View>
    );
  },
);

const CodeSnippet: React.FC<CodeSnippetProps> = ({
  code,
  language,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [currentMatchIdx, setCurrentMatchIdx] = useState(-1);
  const [visibleLinesCount, setVisibleLinesCount] = useState(200);

  const flatListRef = useRef<FlatList>(null);

  // Debounce search query updates
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // If code is extremely large (e.g. > 150KB), skip the pretty printers
  // to avoid blocking the single JS thread.
  const formattedCode = useMemo(() => {
    if (!code) return '';
    if (code.length > 150000) {
      return code;
    }
    if (language === 'html') return formatHTML(code);
    if (language === 'css') return formatCSS(code);
    if (language === 'javascript') return formatJS(code);
    return code;
  }, [code, language]);

  const lines = useMemo(() => {
    if (!formattedCode) return [];
    return formattedCode.split(/\r?\n/);
  }, [formattedCode]);

  // Find all line indices matching the search query
  const matches = useMemo(() => {
    if (!debouncedQuery.trim() || debouncedQuery.length < 2) return [];
    const query = debouncedQuery.toLowerCase();
    const indices: number[] = [];
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].toLowerCase().includes(query)) {
        indices.push(i);
      }
    }
    return indices;
  }, [debouncedQuery, lines]);

  // Reset scroll and states on code/language changes
  useEffect(() => {
    setVisibleLinesCount(200);
    setSearchQuery('');
    setCurrentMatchIdx(-1);
  }, [code, language]);

  // Auto-scroll to the first match when search query returns matches
  useEffect(() => {
    if (matches.length > 0) {
      setCurrentMatchIdx(0);
      scrollToMatch(0);
    } else {
      setCurrentMatchIdx(-1);
    }
  }, [matches]);

  const scrollToMatch = (matchIdx: number) => {
    if (matches.length === 0 || matchIdx < 0 || matchIdx >= matches.length) return;
    const lineIdx = matches[matchIdx];

    // Ensure the targeted index is loaded in FlatList
    if (lineIdx >= visibleLinesCount) {
      setVisibleLinesCount(lineIdx + 100);
    }

    // Schedule scroll after state has applied
    setTimeout(() => {
      try {
        flatListRef.current?.scrollToIndex({
          index: lineIdx,
          animated: true,
          viewPosition: 0.5,
        });
      } catch (e) {
        // Fallback recovery is handled by onScrollToIndexFailed
      }
    }, 100);
  };

  const onScrollToIndexFailed = (error: any) => {
    flatListRef.current?.scrollToOffset({
      offset: error.averageItemLength * error.index,
      animated: true,
    });
    setTimeout(() => {
      try {
        flatListRef.current?.scrollToIndex({
          index: error.index,
          animated: true,
          viewPosition: 0.5,
        });
      } catch (err) {
        console.warn('Scroll to line index failed after fallback retry:', err);
      }
    }, 120);
  };

  const handleNextMatch = () => {
    if (matches.length === 0) return;
    const nextIdx = (currentMatchIdx + 1) % matches.length;
    setCurrentMatchIdx(nextIdx);
    scrollToMatch(nextIdx);
  };

  const handlePrevMatch = () => {
    if (matches.length === 0) return;
    const prevIdx = (currentMatchIdx - 1 + matches.length) % matches.length;
    setCurrentMatchIdx(prevIdx);
    scrollToMatch(prevIdx);
  };

  const visibleLines = useMemo(() => {
    return lines.slice(0, visibleLinesCount);
  }, [lines, visibleLinesCount]);

  const handleEndReached = () => {
    if (visibleLinesCount < lines.length) {
      setVisibleLinesCount(prev => Math.min(prev + 150, lines.length));
    }
  };

  const renderLine = ({item, index}: {item: string; index: number}) => {
    const isActiveMatch = matches.length > 0 && currentMatchIdx >= 0 && index === matches[currentMatchIdx];
    return (
      <CodeSnippetLine
        line={item}
        lineIndex={index}
        language={language}
        search={debouncedQuery}
        isActiveMatch={isActiveMatch}
      />
    );
  };

  return (
    <View style={{flex: 1}}>
      {/* Search Header Row */}
      <View style={styles.searchRow}>
        <View style={styles.searchBar}>
          <SearchIcon color={AppColors.grayTextWeak} size={15} />
          <TextInput
            placeholder={`Search ${language.toUpperCase()}...`}
            placeholderTextColor={AppColors.grayTextWeak}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
            autoCorrect={false}
            autoCapitalize="none"
          />

          {/* Matches Info */}
          {debouncedQuery.length >= 2 && (
            <Text style={styles.matchCountText}>
              {matches.length > 0 ? `${currentMatchIdx + 1}/${matches.length}` : '0/0'}
            </Text>
          )}

          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')} hitSlop={8} style={styles.clearBtn}>
              <ClearIcon color={AppColors.grayTextWeak} size={12} />
            </Pressable>
          )}
        </View>

        {/* Up / Down Arrow Navigation Buttons */}
        {matches.length > 0 && (
          <View style={styles.navArrowsGroup}>
            <TouchableScale onPress={handlePrevMatch} hitSlop={8} style={styles.navArrowBtn}>
              <ArrowUpIcon color="#475569" size={14} />
            </TouchableScale>
            <TouchableScale onPress={handleNextMatch} hitSlop={8} style={styles.navArrowBtn}>
              <ArrowDownIcon color="#475569" size={14} />
            </TouchableScale>
          </View>
        )}

        <CopyButton value={code} label={`${language.toUpperCase()} Source`} />
      </View>

      {/* Code Snippet list container */}
      <View style={styles.container}>
        <FlatList
          ref={flatListRef}
          data={visibleLines}
          renderItem={renderLine}
          keyExtractor={(_, index) => String(index)}
          maxToRenderPerBatch={30}
          windowSize={5}
          initialNumToRender={50}
          removeClippedSubviews={Platform.OS === 'android'}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.5}
          onScrollToIndexFailed={onScrollToIndexFailed}
        />
      </View>
    </View>
  );
};

const monoFont = Platform.OS === 'ios' ? 'Menlo' : 'monospace';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 8,
    height: 32,
  },
  searchInput: {
    flex: 1,
    fontFamily: AppFonts.interRegular,
    fontSize: 12,
    color: '#0F172A',
    marginLeft: 6,
    paddingVertical: 0,
  },
  matchCountText: {
    fontFamily: AppFonts.interMedium,
    fontSize: 10,
    color: '#64748B',
    marginHorizontal: 6,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  clearBtn: {
    padding: 4,
  },
  navArrowsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    height: 32,
    paddingHorizontal: 2,
  },
  navArrowBtn: {
    padding: 5,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lineRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    minHeight: 20,
    paddingVertical: 1,
  },
  activeMatchRow: {
    backgroundColor: 'rgba(234, 179, 8, 0.15)',
  },
  gutter: {
    width: 40,
    backgroundColor: '#F1F5F9',
    borderRightWidth: 1,
    borderRightColor: '#E2E8F0',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingRight: 6,
    paddingTop: 1,
  },
  activeMatchGutter: {
    backgroundColor: 'rgba(234, 179, 8, 0.25)',
    borderRightColor: 'rgba(234, 179, 8, 0.4)',
  },
  lineNumber: {
    fontFamily: monoFont,
    fontSize: 9,
    color: '#94A3B8',
  },
  activeMatchLineNumber: {
    color: '#854D0E',
    fontWeight: 'bold',
  },
  codeLine: {
    flex: 1,
    paddingLeft: 10,
    paddingRight: 12,
    justifyContent: 'center',
  },
  codeLineText: {
    fontFamily: monoFont,
    fontSize: 10.5,
    color: '#334155',
    flexWrap: 'wrap',
  },
  plain: {
    fontFamily: monoFont,
    fontSize: 10.5,
    color: '#334155',
  },
  comment: {
    fontFamily: monoFont,
    fontSize: 10.5,
    color: '#64748B',
    fontStyle: 'italic',
  },
  string: {
    fontFamily: monoFont,
    fontSize: 10.5,
    color: '#D97706',
  },
  keyword: {
    fontFamily: monoFont,
    fontSize: 10.5,
    color: '#7C3AED',
    fontWeight: 'bold',
  },
  builtin: {
    fontFamily: monoFont,
    fontSize: 10.5,
    color: '#0D9488',
  },
  number: {
    fontFamily: monoFont,
    fontSize: 10.5,
    color: '#2563EB',
  },
  tag: {
    fontFamily: monoFont,
    fontSize: 10.5,
    color: '#4F46E5',
    fontWeight: 'bold',
  },
  attribute: {
    fontFamily: monoFont,
    fontSize: 10.5,
    color: '#0D9488',
  },
  selector: {
    fontFamily: monoFont,
    fontSize: 10.5,
    color: '#7C3AED',
    fontWeight: 'bold',
  },
  property: {
    fontFamily: monoFont,
    fontSize: 10.5,
    color: '#0D9488',
  },
  value: {
    fontFamily: monoFont,
    fontSize: 10.5,
    color: '#EA580C',
  },
  highlight: {
    backgroundColor: '#FDE047',
    color: '#000000',
  },
});

export default CodeSnippet;

