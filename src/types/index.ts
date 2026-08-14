// All interfaces live in ./interfaces (re-exported here for convenience).
import type {NetworkLog} from './interfaces';
import type {LocalFilter} from './enums';
export * from './interfaces';
export * from './enums';

// ─── Data type aliases ────────────────────────────────────────────────────────

export type GroupedListItem =
  | {
      type: 'header';
      id: string;
      pageName: string;
      color: string;
      stats: {success: number; failed: number; loading: number};
      timestamp: number;
      activeFilters: Set<LocalFilter>;
      isCollapsed: boolean;
      isFirst: boolean;
    }
  | {
      type: 'log';
      id: number;
      log: NetworkLog;
      isLast: boolean;
      color: string;
    };

export type DiffResult = {
  type: 'added' | 'removed' | 'changed';
  path: string;
  oldVal?: any;
  newVal?: any;
};
