import React, {useEffect, useMemo, useRef, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {View, Pressable, Text, Animated} from 'react-native';

// Components
import CopyButton from './CopyButton';
import TouchableScale from './TouchableScale';

// Helpers
import {copyToClipboard} from '../helpers';

// Custom Hooks
import useAccordion from '../customHooks/useAccordion';

// Assets
import {HeadersIcon, ChevronIcon, CopyIcon} from './NetworkIcons';

// Stylesheet
import {AppColors} from '../styles/AppColors';
import styles from '../styles';

// Type Definition
import {HeadersSectionProps} from '../types';

const HeaderRow = React.memo(function HeaderRow({
  headerKey,
  value,
  isLast,
  index,
}: {
  headerKey: string;
  value: string;
  isLast: boolean;
  index: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const isLong = value.length > 35;

  const entryAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(entryAnim, {
      toValue: 1,
      duration: 220,
      delay: index * 30,
      useNativeDriver: true,
    }).start();
  }, []);

  const rowAnimStyle = {
    opacity: entryAnim,
    transform: [
      {
        translateY: entryAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [8, 0],
        }),
      },
    ],
  };

  return (
    <Animated.View
      style={[styles.htRow, !isLast && styles.htRowBorder, rowAnimStyle]}>
      <View style={styles.htKeyCell}>
        <Text style={styles.htKey} numberOfLines={2}>
          {headerKey}
        </Text>
      </View>
      <View style={styles.htCellDivider} />
      <Pressable
        style={styles.htValueCell}
        onPress={() => isLong && setExpanded(v => !v)}
        hitSlop={8}>
        <Text
          style={styles.htValue}
          selectable
          numberOfLines={expanded ? undefined : 3}>
          {value}
        </Text>
        {isLong && (
          <View style={styles.htExpandRow}>
            <Text style={styles.htExpandText}>
              {expanded ? '▲ less' : '▼ more'}
            </Text>
          </View>
        )}
      </Pressable>
      <TouchableScale
        onPress={() => copyToClipboard(value, headerKey)}
        hitSlop={8}
        style={styles.htCopyBtn}>
        <CopyIcon color={AppColors.grayTextWeak} size={14} />
      </TouchableScale>
    </Animated.View>
  );
});

const HeadersSection = ({
  title,
  headers,
  search,
  resetKey,
}: HeadersSectionProps) => {
  const {t} = useTranslation();
  const {toggleOpen, forceOpen, chevronStyle, bodyStyle} = useAccordion(
    false,
    2400,
    300,
  );

  useEffect(() => {
    forceOpen(false);
  }, [resetKey]);

  const entries = useMemo(
    () => (headers ? Object.entries(headers) : []),
    [headers],
  );

  const filtered = useMemo(() => {
    if (!search) return entries;
    const q = search.toLowerCase();
    return entries.filter(
      ([k, v]) => k.toLowerCase().includes(q) || v.toLowerCase().includes(q),
    );
  }, [entries, search]);

  if (entries.length === 0) return null;

  const isRequest =
    title.toLowerCase().includes('request') ||
    title.toLowerCase().includes('api');
  const accentColor = isRequest ? AppColors.offerPurple : AppColors.greenColor;
  const accentBg = isRequest
    ? `${AppColors.offerPurple}10`
    : `${AppColors.greenColor}10`;

  return (
    <View style={[styles.htCard, {borderLeftColor: accentColor}]}>
      <Pressable onPress={toggleOpen} hitSlop={10}>
        <View style={styles.htCardHeader}>
          <View style={[styles.htIconWrap, {backgroundColor: accentBg}]}>
            <HeadersIcon color={accentColor} />
          </View>
          <Text style={styles.htTitle}>{title}</Text>
          <View
            style={[
              styles.htBadge,
              {backgroundColor: accentBg, borderColor: accentColor},
            ]}>
            <Text style={[styles.htBadgeText, {color: accentColor}]}>
              {entries.length}
            </Text>
          </View>
          <View style={styles.htHeaderSpacer} />
          <CopyButton value={headers} label={title} />
          <View style={styles.htChevronBtn}>
            <Animated.View style={chevronStyle}>
              <ChevronIcon color={AppColors.grayTextStrong} size={14} />
            </Animated.View>
          </View>
        </View>
      </Pressable>

      <Animated.View style={bodyStyle}>
        <View style={styles.htColHeadRow}>
          <Text style={[styles.htColHead, {width: '30%'}]}>{t('network.jsonViewer.key')}</Text>
          <Text style={[styles.htColHead, {flex: 1}]}>{t('network.jsonViewer.value')}</Text>
        </View>

        {filtered.length > 0 ? (
          filtered.map(([k, v], i) => (
            <HeaderRow
              key={k}
              headerKey={k}
              value={v}
              isLast={i === filtered.length - 1}
              index={i}
            />
          ))
        ) : (
          <View style={styles.htEmpty}>
            <Text style={styles.htEmptyText}>{t('network.noMatchingHeaders')}</Text>
          </View>
        )}
      </Animated.View>
    </View>
  );
};

export default HeadersSection;
