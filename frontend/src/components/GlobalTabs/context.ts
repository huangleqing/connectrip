import { createContext, useContext } from 'react';

export interface GlobalTabsContextValue {
  updateTabLabel: (key: string, label: string) => void;
}

export const GlobalTabsContext = createContext<GlobalTabsContextValue | null>(null);

export function useGlobalTabs() {
  const context = useContext(GlobalTabsContext);
  if (!context) {
    throw new Error('useGlobalTabs 必须在 GlobalTabs 内使用');
  }
  return context;
}
