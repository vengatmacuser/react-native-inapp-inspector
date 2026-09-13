import React, {useMemo, useState} from 'react';
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import styles from '../../styles';
import {AppColors} from '../../styles/AppColors';
import {AppFonts} from '../../styles/AppFonts';
import {useTranslation} from '../../i18n';
import {animateNextLayout, useInspector} from './InspectorContext';
import SourcePageCard from '../SourcePageCard';
import HeadersSection from '../HeadersSection';
import SegmentedTabs from '../SegmentedTabs';
import JsonViewer from '../JsonViewer';
import CopyButton from '../CopyButton';
import ShareButton from '../ShareButton';
import CodeSnippet from '../CodeSnippet';
import HighlightText from '../HighlightText';
import TouchableScale from '../TouchableScale';
import {formatDateTime, formatByteSize} from '../../helpers';
import {shareSocketReport} from '../../helpers/shareFormatter';
import {
  ClockIcon,
  ChevronIcon,
  GlobeIcon,
  LockIcon,
  SendFrameIcon,
  ReceiveFrameIcon,
  ClearIcon,
  SearchIcon,
  ExternalLinkIcon,
  LayersIcon,
  TerminalIcon,
  SizeIcon,
  FailIcon,
  HeadersIcon,
} from '../NetworkIcons';
import type {SocketDetailProps} from '../../types';

const SocketDetail: React.FC<SocketDetailProps> = ({item: propItem}) => {
  const {t} = useTranslation();
  const {selectedSocket, logRouteMapRef} = useInspector();
  const item = propItem || selectedSocket;
  const [activeSubTab, setActiveSubTab] = useState<string>('messages');
  const [frameSearch, setFrameSearch] = useState<string>('');
  const [frameDirectionFilter, setFrameDirectionFilter] = useState<'all' | 'send' | 'receive'>('all');
  const [expandedFrameIds, setExpandedFrameIds] = useState<Set<string>>(new Set());

  if (!item) return null;

  const isWss = item.url.startsWith('wss://') || item.url.startsWith('https://');
  const isSocketIo = item.client === 'socket.io' || item.url.includes('/socket.io');

  const statusColor = useMemo(() => {
    const s = (item.status || 'open').toLowerCase();
    if (s === 'open') return AppColors.greenColor;
    if (s === 'connecting') return AppColors.amber600;
    if (s === 'error') return AppColors.errorColor;
    return AppColors.slate500;
  }, [item.status]);

  const handleOpenUrl = () => {
    const httpUrl = item.url.replace(/^wss:\/\//, 'https://').replace(/^ws:\/\//, 'http://');
    Alert.alert(
      t('common.openInBrowser') || 'Open in Browser',
      `${t('common.openInBrowserPrompt') || 'Open URL in browser?'}\n\n${httpUrl}`,
      [
        {text: t('common.cancel') || 'Cancel', style: 'cancel'},
        {
          text: t('common.open') || 'Open',
          onPress: () => {
            Linking.canOpenURL(httpUrl).then(ok => {
              if (ok) Linking.openURL(httpUrl).catch(() => {});
            });
          },
        },
      ],
    );
  };

  const handleShare = async () => {
    await shareSocketReport(item);
  };

  const toggleFrameExpand = (frameId: string) => {
    setExpandedFrameIds(prev => {
      const next = new Set(prev);
      if (next.has(frameId)) next.delete(frameId);
      else next.add(frameId);
      return next;
    });
  };

  const expandAllFrames = () => {
    const allIds = new Set((item.frames || []).map(f => f.id));
    setExpandedFrameIds(allIds);
  };

  const collapseAllFrames = () => {
    setExpandedFrameIds(new Set());
  };

  // Filtered frames
  const filteredFrames = useMemo(() => {
    let result = item.frames || [];
    if (frameDirectionFilter !== 'all') {
      result = result.filter(f => f.direction === frameDirectionFilter);
    }
    if (frameSearch.trim()) {
      const q = frameSearch.trim().toLowerCase();
      result = result.filter(f => {
        if (f.eventName && f.eventName.toLowerCase().includes(q)) return true;
        if (f.type && f.type.toLowerCase().includes(q)) return true;
        if (typeof f.data === 'string' && f.data.toLowerCase().includes(q)) return true;
        if (f.data && typeof f.data === 'object' && JSON.stringify(f.data).toLowerCase().includes(q)) return true;
        return false;
      });
    }
    return result;
  }, [item.frames, frameDirectionFilter, frameSearch]);

  const totalBytes = (item.totalBytesSent || 0) + (item.totalBytesReceived || 0);

  // JS Code Snippet
  const jsSnippet = useMemo(() => {
    if (isSocketIo) {
      return `import { io } from 'socket.io-client';

const socket = io('${item.url}', {
  transports: ['websocket'],
  query: ${JSON.stringify(item.query || {}, null, 2)}
});

socket.on('connect', () => {
  console.log('Connected with socket ID:', socket.id);
});

socket.on('message', (data) => {
  console.log('Received:', data);
});`;
    }

    return `// Standard JavaScript WebSocket
const ws = new WebSocket('${item.url}'${item.protocols ? `, ${JSON.stringify(item.protocols)}` : ''});

ws.onopen = () => {
  console.log('WebSocket connection opened');
  ws.send(JSON.stringify({ type: 'ping' }));
};

ws.onmessage = (event) => {
  console.log('Message from server:', event.data);
};

ws.onerror = (error) => {
  console.error('WebSocket Error:', error);
};

ws.onclose = (event) => {
  console.log('WebSocket closed:', event.code, event.reason);
};`;
  }, [item.url, item.protocols, item.query, isSocketIo]);

  const wscatCommand = `wscat -c "${item.url}"`;

  const schemeIndex = item.url.indexOf('://');
  const schemeStr = schemeIndex !== -1 ? item.url.substring(0, schemeIndex + 3) : '';

  return (
    <View style={{flex: 1, backgroundColor: AppColors.contentBg}}>
      {/* Non-scrollable details header (matching NetworkDetail) */}
      <View style={{paddingHorizontal: 8, paddingTop: 4}}>
        <View style={styles.detailInfoBar}>
          {/* Status & Metrics Badges Row */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 6,
              paddingBottom: 8,
              borderBottomWidth: 1,
              borderBottomColor: AppColors.dividerColor,
            }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 5,
                flexWrap: 'wrap',
                flex: 1,
              }}>
              {/* Protocol / Method Badge */}
              <View
                style={[
                  styles.methodBadge,
                  {
                    backgroundColor: isSocketIo
                      ? AppColors.violet600
                      : isWss
                      ? AppColors.emerald600
                      : AppColors.blue600,
                    paddingHorizontal: 8,
                    paddingVertical: 3.5,
                    borderRadius: 6,
                  },
                ]}>
                <Text
                  style={[
                    styles.methodBadgeText,
                    {
                      color: AppColors.white,
                      fontSize: 10.5,
                      fontFamily: AppFonts.interBold,
                    },
                  ]}>
                  {isSocketIo ? 'SIO' : isWss ? 'WSS' : 'WS'}
                </Text>
              </View>

              {/* Client Chip (SOCKET.IO / WEBSOCKET) */}
              <View
                style={[
                  styles.chip,
                  {
                    backgroundColor: isSocketIo
                      ? `${AppColors.violet600}14`
                      : `${AppColors.sky500}14`,
                    borderColor: isSocketIo
                      ? `${AppColors.violet600}30`
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
                      color: isSocketIo ? AppColors.violet600 : AppColors.sky600,
                    },
                  ]}>
                  {(item.client || 'WEBSOCKET').toUpperCase()}
                </Text>
              </View>

              {/* Status Pill */}
              <View
                style={[
                  styles.chip,
                  {
                    backgroundColor: `${statusColor}18`,
                    borderColor: `${statusColor}40`,
                    paddingHorizontal: 7,
                    paddingVertical: 3,
                    borderRadius: 6,
                  },
                ]}>
                {item.status === 'error' ? (
                  <FailIcon size={8} color={AppColors.errorColor} />
                ) : (
                  <View
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: statusColor,
                    }}
                  />
                )}
                <Text
                  style={[
                    styles.chipText,
                    {
                      color: statusColor,
                      fontFamily: AppFonts.interBold,
                      fontSize: 10.5,
                    },
                  ]}>
                  {(item.status || 'open').toUpperCase()}
                </Text>
              </View>

              {/* Duration Pill */}
              <View
                style={[
                  styles.chip,
                  {
                    backgroundColor: `${AppColors.brandPurple}14`,
                    borderColor: `${AppColors.brandPurple}30`,
                    paddingHorizontal: 7,
                    paddingVertical: 3,
                    borderRadius: 6,
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
                  {item.duration != null ? `${item.duration}ms` : 'Active'}
                </Text>
              </View>

              {/* Frames Pill */}
              <View
                style={[
                  styles.chip,
                  {
                    backgroundColor: `${AppColors.teal600}14`,
                    borderColor: `${AppColors.teal600}30`,
                    paddingHorizontal: 7,
                    paddingVertical: 3,
                    borderRadius: 6,
                    gap: 4,
                  },
                ]}>
                <SendFrameIcon color={AppColors.teal600} size={10} />
                <Text
                  style={[
                    styles.chipText,
                    {
                      color: AppColors.teal600,
                      fontFamily: AppFonts.interBold,
                      fontSize: 10.5,
                    },
                  ]}>
                  {item.frames?.length || 0} frames
                </Text>
              </View>

              {/* Size Pill */}
              <View
                style={[
                  styles.chip,
                  {
                    backgroundColor: `${AppColors.sky600}14`,
                    borderColor: `${AppColors.sky600}30`,
                    paddingHorizontal: 7,
                    paddingVertical: 3,
                    borderRadius: 6,
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
                  {formatByteSize(totalBytes)}
                </Text>
              </View>
            </View>
          </View>

          {/* Full Live URL & Quick Actions Card */}
          <View
            style={{
              backgroundColor: AppColors.grayBackground,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: AppColors.dividerColor,
              padding: 10,
              marginTop: 8,
              gap: 8,
            }}>
            {/* Endpoint Header Bar with Action Buttons */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'nowrap',
                gap: 6,
              }}>
              <View style={{flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1, minWidth: 0}}>
                {schemeStr ? (
                  <View
                    style={{
                      backgroundColor: schemeStr.startsWith('wss') || schemeStr.startsWith('https')
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
                        color: schemeStr.startsWith('wss') || schemeStr.startsWith('https')
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
                  }}
                  numberOfLines={1}>
                  ENDPOINT URL
                </Text>
              </View>

              {/* Action Buttons: wscat, JS, Share, URL Copy, Open */}
              <View style={{flexDirection: 'row', alignItems: 'center', gap: 5, flexShrink: 0}}>
                <CopyButton
                  value={wscatCommand}
                  label="wscat"
                  iconType="terminal"
                />
                <ShareButton onShare={handleShare} />
                <CopyButton
                  value={jsSnippet}
                  label="JS"
                  iconType="fetch"
                />
                <CopyButton
                  value={item.url}
                  label="URL"
                  iconType="copy"
                />
                <TouchableScale
                  style={[
                    styles.iconSquareBtn,
                    {
                      backgroundColor: `${AppColors.sky600}15`,
                      borderColor: `${AppColors.sky600}35`,
                    },
                  ]}
                  onPress={handleOpenUrl}
                  hitSlop={10}
                  accessibilityLabel="Open in Browser">
                  <ExternalLinkIcon
                    color={AppColors.sky600}
                    size={13}
                  />
                </TouchableScale>
              </View>
            </View>

            {/* Full Clickable Hyperlink */}
            <Pressable onPress={handleOpenUrl}>
              <Text
                selectable={true}
                style={{
                  fontFamily: AppFonts.interMedium,
                  fontSize: 12.5,
                  color: AppColors.skyBlue,
                  textDecorationLine: 'underline',
                  lineHeight: 18,
                }}>
                {item.url}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>

      {/* Sticky Segment Control with SVG icons */}
      <SegmentedTabs
        tabs={[
          {
            key: 'messages',
            label: `${t('socket.messages', 'Messages')} (${item.frames?.length || 0})`,
            themeColor: AppColors.violet600,
            icon: (isActive: boolean) => (
              <SendFrameIcon
                size={12}
                color={isActive ? AppColors.white : AppColors.grayText}
              />
            ),
          },
          {
            key: 'overview',
            label: t('socket.overview', 'Overview'),
            themeColor: AppColors.sky600,
            icon: (isActive: boolean) => (
              <GlobeIcon
                size={12}
                color={isActive ? AppColors.white : AppColors.grayText}
              />
            ),
          },
          ...(item.headers && Object.keys(item.headers).length > 0
            ? [
                {
                  key: 'headers',
                  label: `${t('network.detailTabs.headers', 'Headers')} (${Object.keys(item.headers).length})`,
                  themeColor: AppColors.purple,
                  icon: (isActive: boolean) => (
                    <HeadersIcon
                      size={12}
                      color={isActive ? AppColors.white : AppColors.grayText}
                    />
                  ),
                },
              ]
            : []),
          {
            key: 'params',
            label: `${t('socket.params', 'Params')} (${Object.keys(item.query || {}).length})`,
            themeColor: AppColors.teal600,
            icon: (isActive: boolean) => (
              <LayersIcon
                size={12}
                color={isActive ? AppColors.white : AppColors.grayText}
              />
            ),
          },
          {
            key: 'raw',
            label: t('socket.rawAndCode', 'Raw & Code'),
            themeColor: AppColors.amber600,
            icon: (isActive: boolean) => (
              <TerminalIcon
                size={12}
                color={isActive ? AppColors.white : AppColors.grayText}
              />
            ),
          },
        ]}
        activeKey={activeSubTab}
        onChange={tab => {
          animateNextLayout();
          setActiveSubTab(tab);
        }}
        style={{marginHorizontal: 6, marginBottom: 10, marginTop: 6}}
      />

      {/* Tab 1: Messages / Frames */}
      {activeSubTab === 'messages' && (
        <View style={{flex: 1}}>
          {/* Sub-search & filter controls */}
          <View style={socketDetailStyles.frameControlBar}>
            <View style={socketDetailStyles.frameSearchBar}>
              <SearchIcon size={13} color={AppColors.grayTextWeak} />
              <TextInput
                style={socketDetailStyles.frameSearchInput}
                placeholder={t('socket.searchFramesPlaceholder', 'Search frame payloads or event names...')}
                placeholderTextColor={AppColors.grayTextWeak}
                value={frameSearch}
                onChangeText={setFrameSearch}
                clearButtonMode="while-editing"
              />
              {frameSearch.length > 0 && (
                <Pressable onPress={() => setFrameSearch('')}>
                  <ClearIcon size={12} color={AppColors.grayTextWeak} />
                </Pressable>
              )}
            </View>

            {/* Direction Pills & Expand/Collapse All */}
            <View style={socketDetailStyles.frameFilterRow}>
              <View style={socketDetailStyles.dirPillGroup}>
                <TouchableOpacity
                  onPress={() => setFrameDirectionFilter('all')}
                  style={[
                    socketDetailStyles.dirPill,
                    frameDirectionFilter === 'all' && socketDetailStyles.dirPillActive,
                  ]}>
                  <Text
                    style={[
                      socketDetailStyles.dirPillText,
                      frameDirectionFilter === 'all' && socketDetailStyles.dirPillTextActive,
                    ]}>
                    {t('common.all', 'All')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setFrameDirectionFilter('send')}
                  style={[
                    socketDetailStyles.dirPill,
                    frameDirectionFilter === 'send' && socketDetailStyles.dirPillActive,
                    {flexDirection: 'row', alignItems: 'center', gap: 4},
                  ]}>
                  <SendFrameIcon
                    size={10}
                    color={frameDirectionFilter === 'send' ? AppColors.white : AppColors.emerald600}
                  />
                  <Text
                    style={[
                      socketDetailStyles.dirPillText,
                      frameDirectionFilter === 'send' && socketDetailStyles.dirPillTextActive,
                    ]}>
                    {t('socket.sent', 'Sent')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setFrameDirectionFilter('receive')}
                  style={[
                    socketDetailStyles.dirPill,
                    frameDirectionFilter === 'receive' && socketDetailStyles.dirPillActive,
                    {flexDirection: 'row', alignItems: 'center', gap: 4},
                  ]}>
                  <ReceiveFrameIcon
                    size={10}
                    color={frameDirectionFilter === 'receive' ? AppColors.white : AppColors.sky600}
                  />
                  <Text
                    style={[
                      socketDetailStyles.dirPillText,
                      frameDirectionFilter === 'receive' && socketDetailStyles.dirPillTextActive,
                    ]}>
                    {t('socket.recv', 'Recv')}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={socketDetailStyles.expandGroup}>
                <TouchableOpacity onPress={expandAllFrames} style={socketDetailStyles.textBtn}>
                  <Text style={socketDetailStyles.textBtnLabel}>{t('common.expandAll', 'Expand All')}</Text>
                </TouchableOpacity>
                <Text style={socketDetailStyles.textBtnSep}>•</Text>
                <TouchableOpacity onPress={collapseAllFrames} style={socketDetailStyles.textBtn}>
                  <Text style={socketDetailStyles.textBtnLabel}>{t('common.collapseAll', 'Collapse All')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Frames List */}
          <ScrollView style={socketDetailStyles.framesScrollView} contentContainerStyle={{padding: 12}}>
            {filteredFrames.length === 0 ? (
              <View style={socketDetailStyles.emptyFrames}>
                <Text style={socketDetailStyles.emptyFramesText}>
                  {item.frames?.length === 0
                    ? 'No messages transferred on this connection yet'
                    : 'No frames match the active search or direction filter'}
                </Text>
              </View>
            ) : (
              filteredFrames.map((frame, index) => {
                const isSent = frame.direction === 'send';
                const isExpanded = expandedFrameIds.has(frame.id);
                const dirColor = isSent ? AppColors.blue600 : AppColors.emerald600;
                const dirBg = isSent ? `${AppColors.blue600}12` : `${AppColors.emerald600}12`;
                const msOffset = frame.timestamp - item.startTime;

                return (
                  <View key={frame.id} style={socketDetailStyles.frameCard}>
                    {/* Frame Header */}
                    <Pressable
                      onPress={() => toggleFrameExpand(frame.id)}
                      style={socketDetailStyles.frameCardHeader}>
                      <View style={socketDetailStyles.frameHeaderLeft}>
                        <View style={[socketDetailStyles.dirBadge, {backgroundColor: dirBg}]}>
                          {isSent ? (
                            <SendFrameIcon size={10} color={dirColor} />
                          ) : (
                            <ReceiveFrameIcon size={10} color={dirColor} />
                          )}
                          <Text style={[socketDetailStyles.dirBadgeText, {color: dirColor}]}>
                            {isSent ? 'SENT' : 'RECV'}
                          </Text>
                        </View>

                        {frame.eventName && (
                          <View style={socketDetailStyles.eventBadge}>
                            <Text style={socketDetailStyles.eventBadgeText} numberOfLines={1}>
                              {frame.eventName}
                            </Text>
                          </View>
                        )}

                        <Text style={socketDetailStyles.frameIndexText}>#{index + 1}</Text>
                      </View>

                      <View style={socketDetailStyles.frameHeaderRight}>
                        <Text style={socketDetailStyles.frameOffsetTime}>
                          +{msOffset}ms
                        </Text>
                        <View style={socketDetailStyles.frameSizePill}>
                          <Text style={socketDetailStyles.frameSizeText}>
                            {formatByteSize(frame.size || 0)}
                          </Text>
                        </View>
                        <CopyButton value={frame.raw ?? frame.data} label="Frame" />
                        <ChevronIcon
                          direction={isExpanded ? 'up' : 'down'}
                          size={12}
                          color={AppColors.grayTextWeak}
                        />
                      </View>
                    </Pressable>

                    {/* Frame Payload Body */}
                    <View style={socketDetailStyles.frameBody}>
                      {typeof frame.data === 'object' && frame.data !== null ? (
                        <JsonViewer
                          data={frame.data}
                          search={frameSearch}
                          forceOpen={isExpanded}
                        />
                      ) : (
                        <Text style={socketDetailStyles.frameRawText}>
                          <HighlightText text={String(frame.data)} search={frameSearch} />
                        </Text>
                      )}
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>
        </View>
      )}

      {/* Tab 2: Overview */}
      {activeSubTab === 'overview' && (
        <ScrollView style={socketDetailStyles.tabContentScroll} contentContainerStyle={{padding: 12}}>
          <View style={socketDetailStyles.sectionCard}>
            <Text style={socketDetailStyles.sectionHeading}>CONNECTION DETAILS</Text>

            <View style={socketDetailStyles.infoRow}>
              <Text style={socketDetailStyles.infoKey}>URL</Text>
              <Text style={socketDetailStyles.infoVal} selectable>{item.url}</Text>
            </View>

            <View style={socketDetailStyles.infoRow}>
              <Text style={socketDetailStyles.infoKey}>Client Engine</Text>
              <Text style={socketDetailStyles.infoVal}>{item.client?.toUpperCase() || 'WEBSOCKET'}</Text>
            </View>

            <View style={socketDetailStyles.infoRow}>
              <Text style={socketDetailStyles.infoKey}>Ready State</Text>
              <Text style={socketDetailStyles.infoVal}>
                {item.readyState === 1
                  ? '1 (OPEN)'
                  : item.readyState === 0
                  ? '0 (CONNECTING)'
                  : item.readyState === 2
                  ? '2 (CLOSING)'
                  : '3 (CLOSED)'}
              </Text>
            </View>

            <View style={socketDetailStyles.infoRow}>
              <Text style={socketDetailStyles.infoKey}>Connected At</Text>
              <Text style={socketDetailStyles.infoVal}>{formatDateTime(item.startTime)}</Text>
            </View>

            {item.endTime && (
              <View style={socketDetailStyles.infoRow}>
                <Text style={socketDetailStyles.infoKey}>Closed At</Text>
                <Text style={socketDetailStyles.infoVal}>{formatDateTime(item.endTime)}</Text>
              </View>
            )}

            {item.closeCode != null && (
              <View style={socketDetailStyles.infoRow}>
                <Text style={socketDetailStyles.infoKey}>Close Code & Reason</Text>
                <Text style={socketDetailStyles.infoVal}>{item.closeCode} ({item.closeReason || 'N/A'})</Text>
              </View>
            )}

            {item.protocols && (
              <View style={socketDetailStyles.infoRow}>
                <Text style={socketDetailStyles.infoKey}>Subprotocols</Text>
                <Text style={socketDetailStyles.infoVal}>
                  {Array.isArray(item.protocols) ? item.protocols.join(', ') : item.protocols}
                </Text>
              </View>
            )}

            {item.caller && (
              <View style={socketDetailStyles.infoRow}>
                <Text style={socketDetailStyles.infoKey}>Caller Stack</Text>
                <Text style={[socketDetailStyles.infoVal, {fontFamily: AppFonts.interMedium, color: AppColors.brandPurple}]} selectable>
                  {item.caller}
                </Text>
              </View>
            )}

            {item.error && (
              <View style={socketDetailStyles.infoRow}>
                <Text style={socketDetailStyles.infoKey}>Error</Text>
                <Text style={[socketDetailStyles.infoVal, {color: AppColors.errorColor}]} selectable>
                  {item.error}
                </Text>
              </View>
            )}
          </View>

          {/* Source Page Info Card */}
          {(() => {
            const routeInfo =
              item.routeInfo ||
              (logRouteMapRef?.current &&
                logRouteMapRef.current.get(item.id as unknown as number));
            if (!routeInfo || !routeInfo.path || routeInfo.path === 'Navigators')
              return null;
            return (
              <View style={{marginTop: 12}}>
                <SourcePageCard routeInfo={routeInfo} />
              </View>
            );
          })()}
        </ScrollView>
      )}

      {/* Tab: Headers (Handshake) */}
      {activeSubTab === 'headers' && item.headers && (
        <ScrollView style={socketDetailStyles.tabContentScroll} contentContainerStyle={{padding: 12}}>
          <HeadersSection
            title="Handshake Headers"
            headers={item.headers}
            search=""
            resetKey={item.id}
          />
        </ScrollView>
      )}

      {/* Tab 3: Params */}
      {activeSubTab === 'params' && (
        <ScrollView style={socketDetailStyles.tabContentScroll} contentContainerStyle={{padding: 12}}>
          <View style={socketDetailStyles.sectionCard}>
            <Text style={socketDetailStyles.sectionHeading}>HANDSHAKE QUERY PARAMETERS</Text>
            {!item.query || Object.keys(item.query).length === 0 ? (
              <Text style={socketDetailStyles.emptySectionText}>No query parameters passed in connection URL</Text>
            ) : (
              Object.entries(item.query).map(([key, value]) => (
                <View key={key} style={socketDetailStyles.paramRow}>
                  <Text style={socketDetailStyles.paramKey} selectable>{key}</Text>
                  <Text style={socketDetailStyles.paramVal} selectable>{value}</Text>
                  <CopyButton value={value} label={key} />
                </View>
              ))
            )}
          </View>
        </ScrollView>
      )}

      {/* Tab 4: Raw & Code */}
      {activeSubTab === 'raw' && (
        <ScrollView style={socketDetailStyles.tabContentScroll} contentContainerStyle={{padding: 12}}>
          <View style={socketDetailStyles.sectionCard}>
            <Text style={socketDetailStyles.sectionHeading}>JAVASCRIPT CLIENT CODE</Text>
            <CodeSnippet code={jsSnippet} language="javascript" />
          </View>

          <View style={[socketDetailStyles.sectionCard, {marginTop: 14}]}>
            <Text style={socketDetailStyles.sectionHeading}>TERMINAL WSCAT COMMAND</Text>
            <CodeSnippet code={wscatCommand} language="javascript" />
          </View>

          <View style={[socketDetailStyles.sectionCard, {marginTop: 14}]}>
            <Text style={socketDetailStyles.sectionHeading}>RAW CONNECTION JSON DUMP</Text>
            <JsonViewer data={item} />
          </View>
        </ScrollView>
      )}
    </View>
  );
};

export default SocketDetail;

const socketDetailStyles = StyleSheet.create({
  frameControlBar: {
    padding: 10,
    backgroundColor: AppColors.graySurface,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.dividerColor,
    gap: 8,
  },
  frameSearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.contentBg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: AppColors.dividerColor,
    paddingHorizontal: 8,
    height: 34,
    gap: 6,
  },
  frameSearchInput: {
    flex: 1,
    fontFamily: AppFonts.interRegular,
    fontSize: 12,
    color: AppColors.grayTextStrong,
    paddingVertical: 0,
  },
  frameFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dirPillGroup: {
    flexDirection: 'row',
    gap: 6,
  },
  dirPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: AppColors.dividerColor,
    backgroundColor: AppColors.contentBg,
  },
  dirPillActive: {
    backgroundColor: `${AppColors.brandPurple}18`,
    borderColor: AppColors.brandPurple,
  },
  dirPillText: {
    fontFamily: AppFonts.interMedium,
    fontSize: 11,
    color: AppColors.grayTextWeak,
  },
  dirPillTextActive: {
    color: AppColors.brandPurple,
    fontFamily: AppFonts.interBold,
  },
  expandGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  textBtn: {
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  textBtnLabel: {
    fontFamily: AppFonts.interMedium,
    fontSize: 11,
    color: AppColors.brandPurple,
  },
  textBtnSep: {
    color: AppColors.grayTextWeak,
    fontSize: 10,
  },
  framesScrollView: {
    flex: 1,
  },
  emptyFrames: {
    padding: 32,
    alignItems: 'center',
  },
  emptyFramesText: {
    fontFamily: AppFonts.interMedium,
    fontSize: 12.5,
    color: AppColors.grayTextWeak,
    textAlign: 'center',
  },
  frameCard: {
    backgroundColor: AppColors.contentBg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: AppColors.dividerColor,
    marginBottom: 8,
    overflow: 'hidden',
  },
  frameCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 7,
    backgroundColor: AppColors.graySurface,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.dividerColor,
  },
  frameHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dirBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 3,
  },
  dirBadgeText: {
    fontFamily: AppFonts.interBold,
    fontSize: 9.5,
  },
  eventBadge: {
    backgroundColor: `${AppColors.violet600}18`,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    maxWidth: 130,
  },
  eventBadgeText: {
    fontFamily: AppFonts.interBold,
    fontSize: 10,
    color: AppColors.violet600,
  },
  frameIndexText: {
    fontFamily: AppFonts.interMedium,
    fontSize: 10,
    color: AppColors.grayTextWeak,
  },
  frameHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  frameOffsetTime: {
    fontFamily: AppFonts.interRegular,
    fontSize: 10,
    color: AppColors.grayTextWeak,
  },
  frameSizePill: {
    backgroundColor: `${AppColors.slate400}18`,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  frameSizeText: {
    fontFamily: AppFonts.interMedium,
    fontSize: 9.5,
    color: AppColors.grayTextStrong,
  },
  frameBody: {
    padding: 8,
  },
  frameRawText: {
    fontFamily: AppFonts.interRegular,
    fontSize: 12,
    color: AppColors.grayTextStrong,
    lineHeight: 16,
  },
  tabContentScroll: {
    flex: 1,
  },
  sectionCard: {
    backgroundColor: AppColors.contentBg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: AppColors.dividerColor,
    padding: 12,
  },
  sectionHeading: {
    fontFamily: AppFonts.interBold,
    fontSize: 11,
    color: AppColors.grayTextWeak,
    letterSpacing: 0.6,
    marginBottom: 10,
  },
  infoRow: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.dividerColor,
  },
  infoKey: {
    fontFamily: AppFonts.interMedium,
    fontSize: 11,
    color: AppColors.grayTextWeak,
    marginBottom: 2,
  },
  infoVal: {
    fontFamily: AppFonts.interSemiBold,
    fontSize: 12.5,
    color: AppColors.grayTextStrong,
    lineHeight: 18,
  },
  emptySectionText: {
    fontFamily: AppFonts.interRegular,
    fontSize: 12,
    color: AppColors.grayTextWeak,
    fontStyle: 'italic',
    paddingVertical: 8,
  },
  paramRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.dividerColor,
    gap: 8,
  },
  paramKey: {
    fontFamily: AppFonts.interBold,
    fontSize: 12,
    color: AppColors.brandPurple,
    width: '30%',
  },
  paramVal: {
    flex: 1,
    fontFamily: AppFonts.interMedium,
    fontSize: 12,
    color: AppColors.grayTextStrong,
  },
});

