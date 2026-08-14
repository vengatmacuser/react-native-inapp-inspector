import React, {useState, useCallback} from 'react';

// Components
import TouchableScale from './TouchableScale';

// Helpers
import {copyToClipboard} from '../helpers';

// Assets
import {TerminalIcon, FetchIcon, CopyIcon, CheckIcon} from './NetworkIcons';

// Stylesheet
import {AppColors} from '../styles/AppColors';
import styles from '../styles';

// Type Definition
import {CopyButtonProps} from '../types';

const CopyButton = React.memo(({value, label, iconType = 'copy'}: CopyButtonProps) => {
  const [copied, setCopied] = useState<boolean>(false);

  const handlePress = useCallback(() => {
    const resolvedValue = typeof value === 'function' ? (value as Function)() : value;
    copyToClipboard(resolvedValue, label);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }, [value, label]);

  const containerStyle = [
    styles.iconSquareBtn,
    copied && styles.iconSquareBtnSuccess,
  ];

  const IconComponent =
    iconType === 'terminal'
      ? TerminalIcon
      : iconType === 'fetch'
      ? FetchIcon
      : CopyIcon;

  return (
    <TouchableScale onPress={handlePress} hitSlop={12} style={containerStyle}>
      {copied ? (
        <CheckIcon color={AppColors.greenColor} size={14} />
      ) : (
        <IconComponent color={AppColors.grayTextWeak} size={14} />
      )}
    </TouchableScale>
  );
});

export default CopyButton;
