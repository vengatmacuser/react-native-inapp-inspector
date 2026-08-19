import React from 'react';
import {useTranslation} from '../../i18n';
import {
  Alert,
  Image,
  Linking,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import Svg, {Circle} from 'react-native-svg';
import {animateNextLayout, useInspector} from './InspectorContext';
import TouchableScale from '../TouchableScale';
import SegmentedTabs from '../SegmentedTabs';
import MetaAccordion from '../MetaAccordion';
import HeadersSection from '../HeadersSection';
import SourcePageCard from '../SourcePageCard';
import SectionHeader from '../SectionHeader';
import JsonViewer from '../JsonViewer';
import DiffViewer from '../DiffViewer';
import CopyButton from '../CopyButton';
import styles from '../../styles';
import {AppColors} from '../../styles/AppColors';
import {AppFonts} from '../../styles/AppFonts';
import {METHOD_COLORS} from '../../constants';
import {Method} from '../../types';
import {
  getStatusColor,
  getSize,
  formatDateTime,
  getFetchCommand,
  getCurlCommand,
} from '../../helpers';
import {
  FailIcon,
  GlobeIcon,
  StatusIcon,
  HeadersIcon,
  RequestIcon,
  ResponseIcon,
  DownloadIcon,
  ClearIcon,
  SizeIcon,
  ExternalLinkIcon,
  ClockIcon,
} from '../NetworkIcons';

const NetworkDetail = React.memo(() => {
  const {t} = useTranslation();
  const {
    selected,
    detailDisplayUrl,
    apiDetailActiveTab,
    setApiDetailActiveTab,
    detailSearch,
    setDetailSearch,
    reqExpanded,
    setReqExpanded,
    resExpanded,
    setResExpanded,
    showReqDiff,
    setShowReqDiff,
    showResDiff,
    setShowResDiff,
    prevRequestData,
    prevResponseData,
    logRouteMapRef,
  } = useInspector();

  const handleOpenUrl = () => {
    Alert.alert(
      t('common.openInBrowser') || 'Open in Browser',
      `${t('common.openInBrowserPrompt') || 'Are you sure you want to open this URL in your external browser?'}\n\n${detailDisplayUrl}`,
      [
        {text: t('common.cancel') || 'Cancel', style: 'cancel'},
        {
          text: t('common.open') || 'Open',
          onPress: () => {
            Linking.canOpenURL(detailDisplayUrl)
              .then(supported => {
                if (supported) {
                  Linking.openURL(detailDisplayUrl);
                } else {
                  Linking.openURL(detailDisplayUrl).catch(() => {});
                }
              })
              .catch(() => {});
          },
        },
      ],
    );
  };

  if (!selected) return null;

  return (
    <View style={{flex: 1}}>
      {/* Non-scrollable details header */}
      <View style={{paddingHorizontal: 6, paddingTop: 4}}>
        <View style={styles.detailInfoBar}>
          {(() => {
            let schemeStr = '';
            let hostStr = '';
            let pathStr = detailDisplayUrl;
            let queryStr = '';
            try {
              // Simple parsing fallback for React Native environments
              const qIndex = detailDisplayUrl.indexOf('?');
              let cleanUrlForParsing = detailDisplayUrl;
              if (qIndex !== -1) {
                pathStr = detailDisplayUrl.substring(0, qIndex);
                queryStr = detailDisplayUrl.substring(qIndex);
                cleanUrlForParsing = pathStr;
              }
              const schemeIndex =
                cleanUrlForParsing.indexOf('://');
              if (schemeIndex !== -1) {
                schemeStr = cleanUrlForParsing.substring(
                  0,
                  schemeIndex + 3,
                );
                const withoutScheme =
                  cleanUrlForParsing.substring(schemeIndex + 3);
                const firstSlash = withoutScheme.indexOf('/');
                if (firstSlash !== -1) {
                  hostStr = withoutScheme.substring(
                    0,
                    firstSlash,
                  );
                  pathStr = withoutScheme.substring(firstSlash);
                } else {
                  hostStr = withoutScheme;
                  pathStr = '/';
                }
              } else {
                const firstSlash = cleanUrlForParsing.indexOf('/');
                if (firstSlash !== -1) {
                  hostStr = cleanUrlForParsing.substring(
                    0,
                    firstSlash,
                  );
                  pathStr = cleanUrlForParsing.substring(firstSlash);
                } else if (cleanUrlForParsing) {
                  hostStr = cleanUrlForParsing;
                  pathStr = '/';
                }
              }
            } catch (e) {}

            return (
              <>
                <View style={styles.detailInfoTop}>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                      flexWrap: 'wrap',
                      flex: 1,
                    }}>
                    {/* Method Chip */}
                    <View
                      style={[
                        styles.methodBadge,
                        {
                          backgroundColor:
                            METHOD_COLORS[
                              selected.method as Method
                            ] ?? METHOD_COLORS.ALL,
                          paddingHorizontal: 8,
                          paddingVertical: 4,
                          borderRadius: 7,
                        },
                      ]}>
                      <Text
                        style={[
                          styles.methodBadgeText,
                          {
                            color: AppColors.white,
                            fontSize: 10.5,
                          },
                        ]}>
                        {selected.method}
                      </Text>
                    </View>

                    {/* Client Chip (AXIOS / FETCH / XHR) */}
                    {selected.client && (
                      <View
                        style={[
                          styles.chip,
                          {
                            backgroundColor:
                              selected.client === 'axios'
                                ? `${AppColors.purple}14`
                                : selected.client === 'apollo' || selected.client === 'graphql'
                                ? `${AppColors.pink500}14`
                                : selected.client === 'xhr'
                                ? `${AppColors.amber500}14`
                                : `${AppColors.sky500}14`,
                            borderColor:
                              selected.client === 'axios'
                                ? `${AppColors.purple}30`
                                : selected.client === 'apollo' || selected.client === 'graphql'
                                ? `${AppColors.pink500}30`
                                : selected.client === 'xhr'
                                ? `${AppColors.amber500}30`
                                : `${AppColors.sky500}30`,
                            paddingHorizontal: 6,
                            paddingVertical: 3,
                            borderRadius: 6,
                          },
                        ]}>
                        <Text
                          style={[
                            styles.chipText,
                            {
                              fontFamily: AppFonts.interBold,
                              fontSize: 9.5,
                              color:
                                selected.client === 'axios'
                                ? AppColors.purple
                                : selected.client === 'apollo' || selected.client === 'graphql'
                                ? AppColors.pink500
                                : selected.client === 'xhr'
                                ? AppColors.amber700
                                : AppColors.sky600,
                            },
                          ]}>
                          {selected.client.toUpperCase()}
                        </Text>
                      </View>
                    )}

                    {/* Status Pill */}
                    {selected.status != null && (
                      <View
                        style={[
                          styles.chip,
                          {
                            backgroundColor:
                              selected.status === 0
                                ? `${AppColors.errorColor}18`
                                : `${getStatusColor(
                                    selected.status,
                                  )}18`,
                            borderColor:
                              selected.status === 0
                                ? `${AppColors.errorColor}40`
                                : `${getStatusColor(
                                    selected.status,
                                  )}40`,
                            paddingHorizontal: 7,
                            paddingVertical: 3.5,
                            borderRadius: 7,
                          },
                        ]}>
                        {selected.status === 0 ? (
                          <FailIcon
                            size={8}
                            color={AppColors.errorColor}
                          />
                        ) : (
                          <View
                            style={{
                              width: 6,
                              height: 6,
                              borderRadius: 3,
                              backgroundColor: getStatusColor(
                                selected.status,
                              ),
                            }}
                          />
                        )}
                        <Text
                          style={[
                            styles.chipText,
                            {
                              color:
                                selected.status === 0
                                  ? AppColors.errorColor
                                  : getStatusColor(
                                      selected.status,
                                    ),
                              fontFamily: AppFonts.interBold,
                              fontSize: 10.5,
                            },
                          ]}>
                          {selected.status === 0
                            ? 'Failed'
                            : `${selected.status} ${selected.status === 200 ? 'OK' : ''}`}
                        </Text>
                      </View>
                    )}

                    {/* Duration Pill */}
                    {selected.duration != null && (
                      <View
                        style={[
                          styles.chip,
                          {
                            backgroundColor: `${AppColors.brandPurple}14`,
                            borderColor: `${AppColors.brandPurple}30`,
                            paddingHorizontal: 7,
                            paddingVertical: 3.5,
                            borderRadius: 7,
                            gap: 4,
                          },
                        ]}>
                        <ClockIcon color={AppColors.brandPurple} size={10} />
                        <Text
                          style={[
                            styles.chipText,
                            {
                              color: AppColors.brandPurple,
                              fontFamily: AppFonts.interBold,
                              fontSize: 10.5,
                            },
                          ]}>
                          {selected.duration}ms
                        </Text>
                      </View>
                    )}

                    {/* Size Pill */}
                    {selected.response != null && (
                      <View
                        style={[
                          styles.chip,
                          {
                            backgroundColor: `${AppColors.sky600}14`,
                            borderColor: `${AppColors.sky600}30`,
                            paddingHorizontal: 7,
                            paddingVertical: 3.5,
                            borderRadius: 7,
                            gap: 4,
                          },
                        ]}>
                        <SizeIcon color={AppColors.sky600} size={10} />
                        <Text
                          style={[
                            styles.chipText,
                            {
                              color: AppColors.sky600,
                              fontFamily: AppFonts.interBold,
                              fontSize: 10.5,
                            },
                          ]}>
                          {getSize(selected.response)}
                        </Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.detailInfoRight}>
                    <TouchableScale
                      style={[styles.iconSquareBtn, {backgroundColor: `${AppColors.sky600}15`}]}
                      onPress={handleOpenUrl}
                      hitSlop={12}>
                      <ExternalLinkIcon
                        color={AppColors.sky600}
                        size={14}
                      />
                    </TouchableScale>
                    <CopyButton
                      value={getFetchCommand(selected)}
                      label="fetch()"
                      iconType="fetch"
                    />
                    <CopyButton
                      value={getCurlCommand(selected)}
                      label="cURL"
                      iconType="terminal"
                    />
                    <CopyButton
                      value={detailDisplayUrl}
                      label="URL"
                    />
                  </View>
                </View>

                {/* Full Live URL Analysis Card */}
                <Pressable
                  style={{
                    backgroundColor: AppColors.grayBackground,
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: AppColors.dividerColor,
                    padding: 10,
                    marginTop: 8,
                    gap: 6,
                  }}
                  onPress={handleOpenUrl}>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}>
                    <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
                      {schemeStr ? (
                        <View
                          style={{
                            backgroundColor: schemeStr.startsWith('https')
                              ? `${AppColors.green600}18`
                              : `${AppColors.amber500}18`,
                            paddingHorizontal: 6,
                            paddingVertical: 2,
                            borderRadius: 4,
                          }}>
                          <Text
                            style={{
                              fontFamily: AppFonts.interBold,
                              fontSize: 9,
                              color: schemeStr.startsWith('https')
                                ? AppColors.green600
                                : AppColors.amber500,
                            }}>
                            {schemeStr.replace('://', '').toUpperCase()}
                          </Text>
                        </View>
                      ) : null}

                      <Text
                        style={{
                          fontFamily: AppFonts.interBold,
                          fontSize: 10,
                          color: AppColors.grayTextWeak,
                          letterSpacing: 0.4,
                          textTransform: 'uppercase',
                        }}>
                        ENDPOINT URL ↗
                      </Text>
                    </View>

                    <View style={{flexDirection: 'row', alignItems: 'center', gap: 4}}>
                      {queryStr ? (
                        <View
                          style={{
                            backgroundColor: `${AppColors.purple}14`,
                            paddingHorizontal: 6,
                            paddingVertical: 2,
                            borderRadius: 4,
                          }}>
                          <Text
                            style={{
                              fontFamily: AppFonts.interBold,
                              fontSize: 8.5,
                              color: AppColors.purple,
                            }}>
                            {t('network.queryParams')}
                          </Text>
                        </View>
                      ) : null}

                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 3,
                          backgroundColor: `${AppColors.sky600}14`,
                          paddingHorizontal: 6,
                          paddingVertical: 2,
                          borderRadius: 4,
                        }}>
                        <ExternalLinkIcon color={AppColors.sky600} size={10} />
                        <Text
                          style={{
                            fontFamily: AppFonts.interBold,
                            fontSize: 9,
                            color: AppColors.sky600,
                          }}>
                          Open ↗
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Full Clickable Hyperlink */}
                  <Text
                    selectable={true}
                    style={{
                      fontFamily: AppFonts.interMedium,
                      fontSize: 12.5,
                      color: AppColors.skyBlue,
                      textDecorationLine: 'underline',
                      lineHeight: 18,
                    }}>
                    {detailDisplayUrl}
                  </Text>
                </Pressable>
              </>
            );
          })()}
        </View>
      </View>

      {/* Sticky Segment Control */}
      <SegmentedTabs
        tabs={[
          {
            key: 'metadata',
            label: t('network.detailTabs.metadata'),
            icon: (isActive: boolean) => (
              <StatusIcon color={isActive ? AppColors.white : AppColors.grayText} />
            ),
          },
          {
            key: 'headers',
            label: t('network.detailTabs.headers'),
            icon: (isActive: boolean) => (
              <HeadersIcon color={isActive ? AppColors.white : AppColors.grayText} />
            ),
          },
          ...(selected.request != null
            ? [
                {
                  key: 'request',
                  label: t('network.detailTabs.request'),
                  icon: (isActive: boolean) => (
                    <RequestIcon color={isActive ? AppColors.white : AppColors.grayText} />
                  ),
                },
              ]
            : []),
          {
            key: 'response',
            label: t('network.detailTabs.response'),
            icon: (isActive: boolean) => (
              <ResponseIcon color={isActive ? AppColors.white : AppColors.grayText} />
            ),
          },
        ]}
        activeKey={apiDetailActiveTab}
        onChange={tab => {
          animateNextLayout();
          setApiDetailActiveTab(
            tab as 'metadata' | 'headers' | 'request' | 'response',
          );
        }}
        style={{marginHorizontal: 6, marginBottom: 10, marginTop: 6}}
      />

      {/* Scrollable Tab Content */}
      <ScrollView
        style={styles.detailScroll}
        contentContainerStyle={{
          paddingHorizontal: 6,
          paddingBottom: 24,
        }}
        showsVerticalScrollIndicator={true}>
        {apiDetailActiveTab === 'metadata' && (
          <>
            <MetaAccordion
              status={selected.status}
              statusColor={getStatusColor(selected.status)}
              duration={selected.duration}
              size={getSize(selected.response)}
              triggeredAt={formatDateTime(selected.startTime)}
              method={selected.method}
              contentType={
                selected.responseHeaders?.['content-type'] ||
                selected.responseHeaders?.['Content-Type']
              }
              url={selected.url}
            />

            {(() => {
              const routeInfo = logRouteMapRef.current.get(
                selected.id,
              );
              if (!routeInfo || routeInfo.path === 'Navigators')
                return null;
              return <SourcePageCard routeInfo={routeInfo} />;
            })()}

            {(() => {
              const cType =
                selected.responseHeaders?.['content-type'] ||
                selected.responseHeaders?.['Content-Type'];
              if (cType?.includes('image/')) {
                return (
                  <View style={styles.imagePreviewWrapper}>
                    <Image
                      source={{uri: selected.url}}
                      style={styles.imagePreview}
                      resizeMode="contain"
                    />
                    <TouchableScale
                      style={styles.imageDownloadBtn}
                      onPress={() =>
                        Linking.openURL(selected.url)
                      }
                      hitSlop={10}>
                      <DownloadIcon
                        color={AppColors.purple}
                        size={18}
                      />
                    </TouchableScale>
                  </View>
                );
              }
              return null;
            })()}
          </>
        )}

        {apiDetailActiveTab === 'headers' && (
          <>
            <View style={styles.detailSearchRow}>
              <View style={styles.detailSearchBox}>
                <TextInput
                  placeholder={t('network.searchHeaders')}
                  placeholderTextColor={AppColors.grayTextWeak}
                  value={detailSearch}
                  onChangeText={setDetailSearch}
                  style={styles.detailSearchInput}
                  autoCorrect={false}
                  autoCapitalize="none"
                />
                {detailSearch.length > 0 && (
                  <Pressable
                    onPress={() => setDetailSearch('')}
                    hitSlop={10}
                    style={{padding: 8}}>
                    <ClearIcon
                      color={AppColors.grayTextWeak}
                      size={14}
                    />
                  </Pressable>
                )}
              </View>
            </View>

            <HeadersSection
              title="Request Headers"
              headers={selected.requestHeaders}
              search={detailSearch}
              resetKey={selected.id}
            />
            <HeadersSection
              title="Response Headers"
              headers={selected.responseHeaders}
              search={detailSearch}
              resetKey={selected.id}
            />
          </>
        )}

        {apiDetailActiveTab === 'request' &&
          selected.request != null && (
            <>
              <View style={styles.detailSearchRow}>
                <View style={styles.detailSearchBox}>
                  <TextInput
                    placeholder={t('network.searchRequest')}
                    placeholderTextColor={
                      AppColors.grayTextWeak
                    }
                    value={detailSearch}
                    onChangeText={setDetailSearch}
                    style={styles.detailSearchInput}
                    autoCorrect={false}
                    autoCapitalize="none"
                  />
                  {detailSearch.length > 0 && (
                    <Pressable
                      onPress={() => setDetailSearch('')}
                      hitSlop={10}
                      style={{padding: 8}}>
                      <ClearIcon
                        color={AppColors.grayTextWeak}
                        size={14}
                      />
                    </Pressable>
                  )}
                </View>
              </View>

              <View style={styles.sectionContainer}>
                <SectionHeader
                  title={t('network.requestTitle')}
                  value={selected.request}
                  expanded={reqExpanded}
                  onToggleExpand={() => setReqExpanded(v => !v)}
                  showDiff={prevRequestData != null}
                  isDiffing={showReqDiff}
                  onToggleDiff={() => {
                    setShowReqDiff(v => !v);
                    if (!reqExpanded && !showReqDiff)
                      setReqExpanded(true);
                  }}
                />
                {showReqDiff ? (
                  <DiffViewer
                    oldData={prevRequestData}
                    newData={selected.request}
                    forceOpen={reqExpanded}
                  />
                ) : reqExpanded ? (
                  <JsonViewer
                    data={selected.request}
                    search={detailSearch}
                  />
                ) : (
                  <View style={styles.codeBlock}>
                    <Text
                      style={[
                        styles.codeText,
                        {color: AppColors.grayTextWeak},
                      ]}>
                      {t('network.bodyHidden')}
                    </Text>
                  </View>
                )}
              </View>
            </>
          )}

        {apiDetailActiveTab === 'response' && (
          <>
            <View style={styles.detailSearchRow}>
              <View style={styles.detailSearchBox}>
                <TextInput
                  placeholder={t('network.searchResponse')}
                  placeholderTextColor={AppColors.grayTextWeak}
                  value={detailSearch}
                  onChangeText={setDetailSearch}
                  style={styles.detailSearchInput}
                  autoCorrect={false}
                  autoCapitalize="none"
                />
                {detailSearch.length > 0 && (
                  <Pressable
                    onPress={() => setDetailSearch('')}
                    hitSlop={10}
                    style={{padding: 8}}>
                    <ClearIcon
                      color={AppColors.grayTextWeak}
                      size={14}
                    />
                  </Pressable>
                )}
              </View>
            </View>

            <View style={styles.sectionContainer}>
              <SectionHeader
                title={t('network.responseTitle')}
                value={selected.response}
                expanded={resExpanded}
                onToggleExpand={() => setResExpanded(v => !v)}
                showDiff={prevResponseData != null}
                isDiffing={showResDiff}
                onToggleDiff={() => {
                  setShowResDiff(v => !v);
                  if (!resExpanded && !showResDiff)
                    setResExpanded(true);
                }}
              />
              {showResDiff ? (
                <DiffViewer
                  oldData={prevResponseData}
                  newData={selected.response}
                  forceOpen={resExpanded}
                />
              ) : resExpanded ? (
                <JsonViewer
                  data={selected.response}
                  search={detailSearch}
                  wrap
                />
              ) : (
                <View style={styles.codeBlock}>
                  <Text
                    style={[
                      styles.codeText,
                      {color: AppColors.grayTextWeak},
                    ]}>
                    {t('network.bodyHidden')}
                  </Text>
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
});

export default NetworkDetail;