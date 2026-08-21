import React from 'react';
import {StyleSheet, Text, View, TextStyle, Linking} from 'react-native';
import {AppColors} from '../styles/AppColors';
import {AppFonts} from '../styles/AppFonts';
import {escapeRegex, handleOpenExternalLink} from '../helpers';

export interface LogSyntaxHighlighterProps {
  text: string;
  search?: string;
  numberOfLines?: number;
  style?: TextStyle | TextStyle[];
  detectLinks?: boolean;
}

interface Token {
  type:
    | 'key'
    | 'string'
    | 'number'
    | 'boolean'
    | 'null'
    | 'url'
    | 'bracket'
    | 'tag'
    | 'plain';
  value: string;
}

const TOKEN_REGEX =
  /("(?:\\.|[^"\\])*"(?=\s*:))|("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')|(\b-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b)|(\b(?:true|false)\b)|(\b(?:null|undefined|NaN)\b)|(https?:\/\/[^\s"',]+)|(\[[\w\s_-]+\])|([{}[\],:])|([^"'\d\s{}[\],:]+|[ \t\r\n]+)/g;

export const tokenizeText = (input: string): Token[] => {
  if (!input) return [];
  const tokens: Token[] = [];
  let match: RegExpExecArray | null;
  TOKEN_REGEX.lastIndex = 0;

  while ((match = TOKEN_REGEX.exec(input)) !== null) {
    if (match[1]) {
      tokens.push({type: 'key', value: match[1]});
    } else if (match[2]) {
      tokens.push({type: 'string', value: match[2]});
    } else if (match[3]) {
      tokens.push({type: 'number', value: match[3]});
    } else if (match[4]) {
      tokens.push({type: 'boolean', value: match[4]});
    } else if (match[5]) {
      tokens.push({type: 'null', value: match[5]});
    } else if (match[6]) {
      tokens.push({type: 'url', value: match[6]});
    } else if (match[7]) {
      tokens.push({type: 'tag', value: match[7]});
    } else if (match[8]) {
      tokens.push({type: 'bracket', value: match[8]});
    } else if (match[9]) {
      tokens.push({type: 'plain', value: match[9]});
    }
  }

  return tokens;
};

const getTokenColor = (type: Token['type']): string => {
  switch (type) {
    case 'key':
      return AppColors.sky600 || '#0369a1';
    case 'string':
      return AppColors.emerald600 || '#059669';
    case 'number':
      return AppColors.amber600 || '#d97706';
    case 'boolean':
      return AppColors.purple || '#7c3aed';
    case 'null':
      return AppColors.red600 || '#dc2626';
    case 'url':
      return '#0284c7';
    case 'tag':
      return AppColors.violet600 || '#7c3aed';
    case 'bracket':
      return AppColors.slate500 || '#64748b';
    case 'plain':
    default:
      return AppColors.primaryBlack || '#1e293b';
  }
};

export const LogSyntaxHighlighter: React.FC<LogSyntaxHighlighterProps> = React.memo(
  ({text, search, numberOfLines, style, detectLinks = true}) => {
    if (!text) return null;

    const tokens = React.useMemo(() => tokenizeText(text), [text]);

    const renderToken = (token: Token, tokenIdx: number) => {
      const baseColor = getTokenColor(token.type);
      const isUrl = token.type === 'url';
      const isKey = token.type === 'key';

      const tokenStyle: TextStyle = {
        color: baseColor,
        fontFamily: isKey ? AppFonts.interBold : AppFonts.interRegular,
        textDecorationLine: isUrl ? 'underline' : 'none',
      };

      if (!search || search.trim().length === 0) {
        return (
          <Text
            key={tokenIdx}
            style={tokenStyle}
            onPress={
              isUrl && detectLinks
                ? () => handleOpenExternalLink(token.value)
                : undefined
            }>
            {token.value}
          </Text>
        );
      }

      const regex = new RegExp(`(${escapeRegex(search.trim())})`, 'gi');
      const parts = token.value.split(regex);

      return (
        <Text key={tokenIdx} style={tokenStyle}>
          {parts.map((part, partIdx) => {
            const isMatch =
              part.toLowerCase() === search.trim().toLowerCase();
            return isMatch ? (
              <Text
                key={partIdx}
                style={[
                  tokenStyle,
                  styles.searchHighlight,
                ]}>
                {part}
              </Text>
            ) : (
              <Text
                key={partIdx}
                style={tokenStyle}
                onPress={
                  isUrl && detectLinks
                    ? () => handleOpenExternalLink(token.value)
                    : undefined
                }>
                {part}
              </Text>
            );
          })}
        </Text>
      );
    };

    return (
      <Text
        style={[styles.containerText, style]}
        numberOfLines={numberOfLines}>
        {tokens.map(renderToken)}
      </Text>
    );
  },
);

const styles = StyleSheet.create({
  containerText: {
    fontFamily: AppFonts.interRegular,
    fontSize: 12,
    lineHeight: 18,
    color: AppColors.primaryBlack,
  },
  searchHighlight: {
    backgroundColor: '#fef08a',
    color: '#854d0e',
    fontFamily: AppFonts.interBold,
    borderRadius: 2,
  },
});

export default LogSyntaxHighlighter;
