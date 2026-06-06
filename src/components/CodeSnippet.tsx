import React, {useMemo} from 'react';
import {StyleSheet, Text, View, Platform, FlatList} from 'react-native';

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
    /(\/\/.*|\/\*[\s\S]*?\*\/)|("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`)|(\b(?:const|let|var|function|return|if|else|for|while|import|export|class|try|catch|new|this|async|await|break|continue|switch|case|default|throw|typeof|yield|let)\b)|(\b(?:console|window|document|fetch|global|require|module|exports|Promise|Map|Set|Array|Object|String|Number|Boolean)\b)|(\b\d+(?:\.\d+)?\b)/g;

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
    /(<!--[\s\S]*?-->)|(<\/?[a-zA-Z0-9:-]+>?)|("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')|([a-zA-Z0-9:-]+(?=\s*=))/g;

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

const CodeSnippetLine = React.memo(
  ({
    line,
    lineIndex,
    language,
    search,
  }: {
    line: string;
    lineIndex: number;
    language: 'html' | 'css' | 'javascript';
    search: string;
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
      <View style={styles.lineRow}>
        {/* Gutter Line Number */}
        <View style={styles.gutter}>
          <Text style={styles.lineNumber}>{lineIndex + 1}</Text>
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
  search = '',
}) => {
  const formattedCode = useMemo(() => {
    if (!code) return '';
    if (language === 'html') return formatHTML(code);
    if (language === 'css') return formatCSS(code);
    if (language === 'javascript') return formatJS(code);
    return code;
  }, [code, language]);

  const lines = useMemo(() => {
    if (!formattedCode) return [];
    return formattedCode.split(/\r?\n/);
  }, [formattedCode]);

  const renderLine = ({item, index}: {item: string; index: number}) => (
    <CodeSnippetLine
      line={item}
      lineIndex={index}
      language={language}
      search={search}
    />
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={lines}
        renderItem={renderLine}
        keyExtractor={(_, index) => String(index)}
        maxToRenderPerBatch={50}
        windowSize={10}
        initialNumToRender={30}
        removeClippedSubviews={Platform.OS === 'android'}
      />
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
  lineRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    minHeight: 20,
    paddingVertical: 1,
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
  lineNumber: {
    fontFamily: monoFont,
    fontSize: 9,
    color: '#94A3B8',
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
