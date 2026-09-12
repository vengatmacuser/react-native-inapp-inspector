/**
 * Sub-module entry point: react-native-inapp-inspector/socket
 * Real-time WebSocket & Socket.IO message inspector and traffic logger engine.
 */
export {
  setupSocketLogger,
  clearSocketRecords,
  deleteSocketRecord,
  deleteMultipleSocketRecords,
  subscribeSocketRecords,
  getSocketRecords,
  setSocketModuleEnabled,
  getSocketModuleEnabled,
  setMaxSocketRecordsLimit,
  getMaxSocketRecordsLimit,
  pruneSocketRecords,
  recordSocketConnection,
  recordSocketFrame,
  recordSocketClose,
  recordSocketError,
  simulateTestSocket,
  analyzeSocketPayload,
} from './customHooks/socketLogger';

export {
  shareSocketReport,
  formatSocketReport,
} from './helpers/shareFormatter';

export type {
  SocketConnectionRecord,
  SocketFrame,
  SocketFilterState,
  SocketStats,
  SocketCardProps,
  SocketDetailProps,
} from './types';

export {
  SocketStatus,
  SocketFrameDirection,
  SocketFrameType,
  SocketDetailSubTab,
  SocketFilterType,
} from './types';
