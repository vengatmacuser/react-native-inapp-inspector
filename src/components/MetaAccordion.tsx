import React, {useState} from 'react';
import {View, Pressable, Text, Animated, Linking} from 'react-native';

// Constants
import {DURATION_FAST_MS, DURATION_SLOW_MS} from '../constants';

// Custom Hooks
import useAccordion from '../customHooks/useAccordion';

// Helpers
import {getDurationColor, handleOpenExternalLink} from '../helpers';

// Assets
import {
  ChevronIcon,
  CalendarIcon,
  StatusIcon,
  ClockIcon,
  SizeIcon,
  TerminalIcon,
  GlobeIcon,
} from './NetworkIcons';

// Components
import TouchableScale from './TouchableScale';

// Stylesheet
import {AppColors} from '../styles/AppColors';
import {AppFonts} from '../styles/AppFonts';
import styles from '../styles';

export interface MetaAccordionProps {
  status: number | null | undefined;
  statusColor: string;
  duration: number | null | undefined;
  size: string;
  triggeredAt: string;
  method: string;
  contentType?: string;
  url: string;
}

const MetaAccordion = ({
  status,
  statusColor,
  duration,
  size,
  triggeredAt,
  method,
  contentType,
  url,
}: MetaAccordionProps) => {
  const [urlExpanded, setUrlExpanded] = useState(false);
  const {toggleOpen, chevronStyle, bodyStyle} = useAccordion(true, 400, 390);
  const isFailed = status === 0 || status == null;

  const renderFormattedUrl = (rawUrl: string) => {
    if (!rawUrl) return '—';
    try {
      const doubleSlashIndex = rawUrl.indexOf('//');
      let temp = rawUrl;
      let protocol = '';
      if (doubleSlashIndex !== -1) {
        protocol = rawUrl.substring(0, doubleSlashIndex + 2);
        temp = rawUrl.substring(doubleSlashIndex + 2);
      }

      const slashIndex = temp.indexOf('/');
      let host = temp;
      let pathAndSearch = '';
      if (slashIndex !== -1) {
        host = temp.substring(0, slashIndex);
        pathAndSearch = temp.substring(slashIndex);
      }

      const queryIndex = pathAndSearch.indexOf('?');
      let pathname = pathAndSearch;
      let search = '';
      if (queryIndex !== -1) {
        pathname = pathAndSearch.substring(0, queryIndex);
        search = pathAndSearch.substring(queryIndex);
      }

      return (
        <Text style={{lineHeight: 16}}>
          {protocol ? (
            <Text style={{color: '#94A3B8', fontFamily: AppFonts.interRegular}}>{protocol}</Text>
          ) : null}
          <Text style={{color: AppColors.purple, fontFamily: AppFonts.interBold}}>{host}</Text>
          <Text style={{color: '#334155', fontFamily: AppFonts.interMedium}}>{pathname}</Text>
          {search ? (
            <Text style={{color: '#0D9488', fontFamily: AppFonts.interRegular}}>{search}</Text>
          ) : null}
        </Text>
      );
    } catch {
      return rawUrl;
    }
  };

  return (
    <View style={styles.metaContainer}>
      <Pressable onPress={toggleOpen} hitSlop={12}>
        <View style={styles.metaHeader}>
          <Text style={styles.metaTitle}>Metadata</Text>
          <Animated.View style={chevronStyle}>
            <ChevronIcon color={AppColors.grayTextWeak} size={14} />
          </Animated.View>
        </View>
      </Pressable>

      <Animated.View style={bodyStyle}>
        <View style={styles.metaBody}>
          <View style={styles.metaRow}>
            <View style={styles.metaLabelRow}>
              <CalendarIcon color={AppColors.grayTextWeak} size={14} />
              <Text style={styles.metaLabel}>Triggered At</Text>
            </View>
            <Text
              style={[
                styles.metaValue,
                {color: AppColors.purple, fontSize: 12},
              ]}>
              {triggeredAt}
            </Text>
          </View>
          <View style={styles.metaDivider} />

          <View style={styles.metaRow}>
            <View style={styles.metaLabelRow}>
              <TerminalIcon color={AppColors.grayTextWeak} size={14} />
              <Text style={styles.metaLabel}>Method</Text>
            </View>
            <View
              style={[
                styles.statusChip,
                {
                  borderColor: 'rgba(107, 78, 255, 0.25)',
                  backgroundColor: 'rgba(107, 78, 255, 0.08)',
                },
              ]}>
              <Text
                style={[
                  styles.statusText,
                  {color: AppColors.purple, fontFamily: AppFonts.interBold},
                ]}>
                {method || 'GET'}
              </Text>
            </View>
          </View>
          <View style={styles.metaDivider} />

          <View style={styles.metaRow}>
            <View style={styles.metaLabelRow}>
              <StatusIcon color={AppColors.grayTextWeak} />
              <Text style={styles.metaLabel}>Status</Text>
            </View>
            <View
              style={[
                styles.statusChip,
                {
                  borderColor: isFailed
                    ? `${AppColors.errorColor}40`
                    : `${statusColor}40`,
                  backgroundColor: isFailed
                    ? `${AppColors.errorColor}15`
                    : `${statusColor}15`,
                },
              ]}>
              <Text
                style={[
                  styles.statusText,
                  {color: isFailed ? AppColors.errorColor : statusColor},
                ]}>
                {isFailed ? 'Failed (Network Error)' : String(status)}
              </Text>
            </View>
          </View>
          <View style={styles.metaDivider} />

          <View style={styles.metaRow}>
            <View style={styles.metaLabelRow}>
              <GlobeIcon color={AppColors.grayTextWeak} size={14} />
              <Text style={styles.metaLabel}>Content Type</Text>
            </View>
            <Text style={styles.metaValue}>
              {contentType || 'application/json'}
            </Text>
          </View>
          <View style={styles.metaDivider} />

          <View style={styles.metaRow}>
            <View style={styles.metaLabelRow}>
              <ClockIcon color={AppColors.grayTextWeak} size={14} />
              <Text style={styles.metaLabel}>Duration</Text>
            </View>
            <View style={styles.metaValueRow}>
              {duration != null && !isFailed && (
                <View
                  style={[
                    styles.perfBadge,
                    {
                      backgroundColor: `${getDurationColor(duration)}15`,
                      borderColor: `${getDurationColor(duration)}40`,
                    },
                  ]}>
                  <Text
                    style={[
                      styles.perfBadgeText,
                      {color: getDurationColor(duration)},
                    ]}>
                    {duration < DURATION_FAST_MS
                      ? 'Fast'
                      : duration < DURATION_SLOW_MS
                      ? 'Moderate'
                      : 'Slow'}
                  </Text>
                </View>
              )}
              <Text style={styles.metaValue}>
                {duration != null ? `${duration} ms` : '—'}
              </Text>
            </View>
          </View>
          <View style={styles.metaDivider} />

          <View style={styles.metaRow}>
            <View style={styles.metaLabelRow}>
              <SizeIcon color={AppColors.grayTextWeak} />
              <Text style={styles.metaLabel}>Size</Text>
            </View>
            <Text style={styles.metaValue}>{size}</Text>
          </View>
          <View style={styles.metaDivider} />

          <View style={[styles.metaRow, {alignItems: 'flex-start', flexDirection: 'column', gap: 6}]}>
            <View style={{flexDirection: 'row', justifyContent: 'space-between', width: '100%', alignItems: 'center'}}>
              <View style={styles.metaLabelRow}>
                <GlobeIcon color={AppColors.grayTextWeak} size={14} />
                <Text style={styles.metaLabel}>Full URL</Text>
              </View>
              
              <View style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
                {url && url.length > 50 && (
                  <TouchableScale onPress={() => setUrlExpanded(prev => !prev)} hitSlop={8}>
                    <Text style={{
                      fontFamily: AppFonts.interBold,
                      fontSize: 10.5,
                      color: AppColors.purple,
                    }}>
                      {urlExpanded ? 'Show Less' : 'Show More'}
                    </Text>
                  </TouchableScale>
                )}
                
                {url && (
                  <TouchableScale onPress={() => handleOpenExternalLink(url)} hitSlop={8}>
                    <Text style={{
                      fontFamily: AppFonts.interBold,
                      fontSize: 10.5,
                      color: AppColors.purple,
                      textDecorationLine: 'underline',
                    }}>
                      Open
                    </Text>
                  </TouchableScale>
                )}
              </View>
            </View>
            
            <View style={{
              backgroundColor: '#F8FAFC',
              borderRadius: 8,
              padding: 8,
              borderWidth: 1.5,
              borderColor: '#E2E8F0',
              width: '100%',
              marginTop: 2,
            }}>
              <Text
                selectable={true}
                numberOfLines={urlExpanded ? undefined : 2}
                ellipsizeMode="tail"
                style={{
                  fontSize: 11,
                  textAlign: 'left',
                  lineHeight: 16.5,
                }}>
                {renderFormattedUrl(url)}
              </Text>
            </View>
          </View>
        </View>
      </Animated.View>
    </View>
  );
};

export default MetaAccordion;
