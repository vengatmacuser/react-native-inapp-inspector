import React from 'react';
import {Text, Linking} from 'react-native';

// Helpers
import {escapeRegex, handleOpenExternalLink} from '../helpers';

const HighlightText = ({
  text,
  search,
  style,
  highlightStyle,
  detectLinks,
  ...rest
}: any) => {
  const hasNumberOfLines = 'numberOfLines' in rest;
  const numLines = hasNumberOfLines ? rest.numberOfLines : 1;

  // Regex to detect absolute URLs
  const URL_REGEX = /(https?:\/\/[^\s]+)/g;

  const renderNormalOrHighlighted = (subText: string, keyPrefix: string) => {
    if (!search) {
      return <Text key={keyPrefix}>{subText}</Text>;
    }
    const regex = new RegExp(`(${escapeRegex(search)})`, 'gi');
    const parts = subText.split(regex);
    return (
      <Text key={keyPrefix}>
        {parts.map((part: any, i: number) =>
          part.toLowerCase() === search.toLowerCase() ? (
            <Text key={i} style={highlightStyle}>
              {part}
            </Text>
          ) : (
            <Text key={i}>{part}</Text>
          ),
        )}
      </Text>
    );
  };

  if (detectLinks && text) {
    const parts = text.split(URL_REGEX);
    return (
      <Text style={style} numberOfLines={numLines} {...rest}>
        {parts.map((part: string, i: number) => {
          if (part.match(URL_REGEX)) {
            return (
              <Text
                key={`link-${i}`}
                style={{
                  color: '#007AFF', // skyBlue link color
                  textDecorationLine: 'underline',
                }}
                onPress={() => {
                  handleOpenExternalLink(part);
                }}>
                {part}
              </Text>
            );
          }
          return renderNormalOrHighlighted(part, `text-${i}`);
        })}
      </Text>
    );
  }

  if (!search)
    return (
      <Text style={style} numberOfLines={numLines} {...rest}>
        {text}
      </Text>
    );

  const regex = new RegExp(`(${escapeRegex(search)})`, 'gi');
  const parts = text.split(regex);

  return (
    <Text style={style} numberOfLines={numLines} {...rest}>
      {parts.map((part: any, i: number) =>
        part.toLowerCase() === search.toLowerCase() ? (
          <Text key={i} style={highlightStyle}>
            {part}
          </Text>
        ) : (
          <Text key={i}>{part}</Text>
        ),
      )}
    </Text>
  );
};

export default HighlightText;
