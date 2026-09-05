import React, {useState} from 'react';
import {useTranslation} from '../i18n';
import {View, Pressable, Text} from 'react-native';

// Constants
import {DURATION_FAST_MS, DURATION_SLOW_MS} from '../constants';

// Custom Hooks
import useAccordion from '../customHooks/useAccordion';

// Helpers
import {getDurationColor, handleOpenExternalLink} from '../helpers';

// Types
import {MetaAccordionProps} from '../types';

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
import CopyButton from './CopyButton';

// Stylesheet
import {AppColors} from '../styles/AppColors';
import {AppFonts} from '../styles/AppFonts';
import styles from '../styles';

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
  const {t} = useTranslation();
  const [urlExpanded, setUrlExpanded] = useState(false);
  const {isOpen, toggleOpen, chevronStyle} = useAccordion(true);
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
            <Text style={{color: AppColors.slate400, fontFamily: AppFonts.interRegular}}>{protocol}</Text>
          ) : null}
          <Text style={{color: AppColors.purple, fontFamily: AppFonts.interBold}}>{host}</Text>
          <Text style={{color: AppColors.slate700, fontFamily: AppFonts.interMedium}}>{pathname}</Text>
          {search ? (
            <Text style={{color: AppColors.teal600, fontFamily: AppFonts.interRegular}}>{search}</Text>
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
          <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
            <CopyButton
              value={{
                status: status ?? 0,
                duration: duration != null ? `${duration} ms` : '—',
                size: size || '—',
                triggeredAt: triggeredAt || '',
                method: method || 'GET',
                contentType: contentType || 'application/json',
                url: url || '',
              }}
              label="Metadata"
            />
            <View style={chevronStyle}>
              <ChevronIcon color={AppColors.grayTextWeak} size={14} />
            </View>
          </View>
        </View>
      </Pressable>

      {isOpen && (
        <View style={styles.metaBody}>
          <View style={styles.metaRow}>
            <View style={styles.metaLabelRow}>
              <CalendarIcon color={AppColors.grayTextWeak} size={14} />
              <Text style={styles.metaLabel}>{t('network.triggeredAt')}</Text>
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
              <Text style={styles.metaLabel}>{t('network.methodHeader')}</Text>
            </View>
            <View
              style={[
                styles.statusChip,
                {
                  borderColor: `${AppColors.brandPurple}40`,
                  backgroundColor: `${AppColors.brandPurple}14`,
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
              <Text style={styles.metaLabel}>{t('network.statusHeader')}</Text>
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
                {isFailed ? t('network.failedNetworkError') : String(status)}
              </Text>
            </View>
          </View>
          <View style={styles.metaDivider} />

          <View style={styles.metaRow}>
            <View style={styles.metaLabelRow}>
              <GlobeIcon color={AppColors.grayTextWeak} size={14} />
              <Text style={styles.metaLabel}>{t('network.contentType')}</Text>
            </View>
            <Text style={styles.metaValue}>
              {contentType || 'application/json'}
            </Text>
          </View>
          <View style={styles.metaDivider} />

          <View style={styles.metaRow}>
            <View style={styles.metaLabelRow}>
              <ClockIcon color={AppColors.grayTextWeak} size={14} />
              <Text style={styles.metaLabel}>{t('network.durationHeader')}</Text>
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
                      ? t('network.perf.fast')
                      : duration < DURATION_SLOW_MS
                      ? t('network.perf.moderate')
                      : t('network.perf.slow')}
                  </Text>
                </View>
              )}
              <Text style={styles.metaValue}>
                {duration != null ? `${duration} ms` : '—'}
              </Text>
            </View>
          </View>

          {/* Visual Latency Timing Breakdown Waterfall */}
          {duration != null && !isFailed && (
            <View style={{paddingVertical: 8, gap: 6}}>
              <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                <Text style={{fontFamily: AppFonts.interBold, fontSize: 11, color: AppColors.primaryBlack}}>
                  {t('network.timingWaterfall')}
                </Text>
                <Text style={{fontFamily: AppFonts.interMedium, fontSize: 10.5, color: getDurationColor(duration)}}>
                  {duration < DURATION_FAST_MS
                    ? t('network.perf.fast')
                    : duration < DURATION_SLOW_MS
                    ? t('network.perf.moderate')
                    : t('network.perf.slow')}
                </Text>
              </View>

              <View
                style={{
                  height: 6,
                  backgroundColor: AppColors.grayBorderSecondary,
                  borderRadius: 3,
                  overflow: 'hidden',
                }}>
                <View
                  style={{
                    height: '100%',
                    width: `${Math.min(100, Math.max(8, (duration / 1200) * 100))}%`,
                    backgroundColor: getDurationColor(duration),
                    borderRadius: 3,
                  }}
                />
              </View>

              <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 1}}>
                <Text style={{fontFamily: AppFonts.interRegular, fontSize: 9.5, color: AppColors.grayTextWeak}}>
                  0 ms
                </Text>
                <Text style={{fontFamily: AppFonts.interBold, fontSize: 10, color: getDurationColor(duration)}}>
                  {duration} ms
                </Text>
                <Text style={{fontFamily: AppFonts.interRegular, fontSize: 9.5, color: AppColors.grayTextWeak}}>
                  1,200+ ms
                </Text>
              </View>
            </View>
          )}
          <View style={styles.metaDivider} />

          <View style={styles.metaRow}>
            <View style={styles.metaLabelRow}>
              <SizeIcon color={AppColors.grayTextWeak} />
              <Text style={styles.metaLabel}>{t('network.sizeHeader')}</Text>
            </View>
            <Text style={styles.metaValue}>{size}</Text>
          </View>
          <View style={styles.metaDivider} />

          <View style={[styles.metaRow, {alignItems: 'flex-start', flexDirection: 'column', gap: 6}]}>
            <View style={{flexDirection: 'row', justifyContent: 'space-between', width: '100%', alignItems: 'center'}}>
              <View style={styles.metaLabelRow}>
                <GlobeIcon color={AppColors.grayTextWeak} size={14} />
                <Text style={styles.metaLabel}>{t('network.fullUrl')}</Text>
              </View>
              
              <View style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
                {url && url.length > 50 && (
                  <TouchableScale onPress={() => setUrlExpanded(prev => !prev)} hitSlop={8}>
                    <Text style={{
                      fontFamily: AppFonts.interBold,
                      fontSize: 10.5,
                      color: AppColors.purple,
                    }}>
                      {urlExpanded ? t('network.showLess') : t('network.showMore')}
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
                      {t('network.open')}
                    </Text>
                  </TouchableScale>
                )}
              </View>
            </View>
            
            <View style={{
              backgroundColor: AppColors.slate50,
              borderRadius: 8,
              padding: 8,
              borderWidth: 1.5,
              borderColor: AppColors.slate200,
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
      )}
    </View>
  );
};

export default MetaAccordion;
