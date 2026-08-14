import React from 'react';
import {useTranslation} from 'react-i18next';
import {
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
} from '../NetworkIcons';

const NetworkDetail = () => {
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
                      gap: 8,
                    }}>
                    <View
                      style={[
                        styles.methodBadge,
                        {
                          backgroundColor:
                            METHOD_COLORS[
                              selected.method as Method
                            ] ?? METHOD_COLORS.ALL,
                        },
                      ]}>
                      <Text
                        style={[
                          styles.methodBadgeText,
                          {
                            color: AppColors.white,
                          },
                        ]}>
                        {selected.method}
                      </Text>
                    </View>

                    {selected.status != null && (
                      <View
                        style={[
                          styles.chip,
                          {
                            backgroundColor:
                              selected.status === 0
                                ? `${AppColors.errorColor}15`
                                : `${getStatusColor(
                                    selected.status,
                                  )}15`,
                            borderColor:
                              selected.status === 0
                                ? `${AppColors.errorColor}40`
                                : `${getStatusColor(
                                    selected.status,
                                  )}40`,
                          },
                        ]}>
                        {selected.status === 0 ? (
                          <FailIcon
                            size={8}
                            color={AppColors.errorColor}
                          />
                        ) : (
                          <Svg
                            width={6}
                            height={6}
                            viewBox="0 0 10 10"
                            fill="none">
                            <Circle
                              cx="5"
                              cy="5"
                              r="5"
                              fill={getStatusColor(
                                selected.status,
                              )}
                            />
                          </Svg>
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
                            },
                          ]}>
                          {selected.status === 0
                            ? 'Failed'
                            : String(selected.status)}
                        </Text>
                      </View>
                    )}

                    {selected.duration != null && (
                      <View
                        style={[
                          styles.chip,
                          {
                            backgroundColor:
                              `${AppColors.purple}14`,
                            borderColor:
                              `${AppColors.purple}2E`,
                          },
                        ]}>
                        <Text
                          style={[
                            styles.chipText,
                            {color: AppColors.purple},
                          ]}>
                          {selected.duration}ms
                        </Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.detailInfoRight}>
                    <TouchableScale
                      style={styles.iconSquareBtn}
                      onPress={() =>
                        Linking.openURL(detailDisplayUrl)
                      }
                      hitSlop={12}>
                      <GlobeIcon
                        color={AppColors.grayTextWeak}
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

                <Pressable
                  style={{
                    backgroundColor: AppColors.grayBackground,
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: AppColors.dividerColor,
                    padding: 10,
                    marginTop: 6,
                  }}
                  onPress={() =>
                    Linking.openURL(detailDisplayUrl)
                  }>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: 2,
                    }}>
                    <Text
                      style={{
                        fontFamily: AppFonts.interMedium,
                        fontSize: 10,
                        color: AppColors.grayTextWeak,
                        flex: 1,
                      }}
                      numberOfLines={1}>
                      {schemeStr ? (
                        <>
                          <Text
                            style={{
                              color: AppColors.slate400,
                              fontFamily: AppFonts.interRegular,
                            }}>
                            {schemeStr}
                          </Text>
                          {hostStr}
                        </>
                      ) : (
                        hostStr || 'API Endpoint'
                      )}
                    </Text>
                    {queryStr ? (
                      <View
                        style={{
                          backgroundColor:
                            `${AppColors.purple}14`,
                          paddingHorizontal: 5,
                          paddingVertical: 1,
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
                  </View>
                  <Text
                    selectable={true}
                    style={{
                      fontFamily: AppFonts.interBold,
                      fontSize: 12,
                      color: AppColors.primaryBlack,
                      marginTop: 2,
                    }}
                    numberOfLines={2}>
                    {pathStr}
                  </Text>
                  {queryStr ? (
                    <Text
                      selectable={true}
                      style={{
                        fontFamily: AppFonts.interRegular,
                        fontSize: 10,
                        color: AppColors.grayTextWeak,
                        marginTop: 4,
                      }}
                      numberOfLines={1}>
                      {queryStr}
                    </Text>
                  ) : null}
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
                    forceOpen
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
              {selected.response != null && (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4,
                    paddingHorizontal: 10,
                    height: 34,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: `${AppColors.purple}30`,
                    backgroundColor: `${AppColors.purple}10`,
                  }}>
                  <SizeIcon color={AppColors.purple} size={12} />
                  <Text
                    style={{
                      fontFamily: AppFonts.interBold,
                      fontSize: 10.5,
                      color: AppColors.purple,
                    }}>
                    {getSize(selected.response)}
                  </Text>
                </View>
              )}
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
                  forceOpen
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
};

export default NetworkDetail;