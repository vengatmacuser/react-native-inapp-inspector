import {createContext, useContext} from 'react';
import {InspectorContextValue} from '../../types';

export {
  InspectorContextValue,
  InspectorStorage,
  ModalAnimationType,
  SettingsPage,
  SettingsSubTab,
  LogFilter,
} from '../../types';

export const InspectorContext = createContext<InspectorContextValue | null>(
  null,
);

export const useInspector = (): InspectorContextValue => {
  const ctx = useContext(InspectorContext);
  if (!ctx) {
    throw new Error('useInspector must be used within <InspectorContext.Provider>');
  }
  return ctx;
};

export const animateNextLayout = () => {
  // Disabled LayoutAnimation to prevent iOS NSRangeException crashes under Fabric
  // and Android rendering performance freezes.
};