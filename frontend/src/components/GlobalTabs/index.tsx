import { history, useLocation } from '@umijs/max';
import { Spin, Tabs } from 'antd';
import KeepAlive, { useKeepAliveRef } from 'keepalive-for-react';
import {
  Suspense,
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useOutlet } from 'react-router-dom';
import { GlobalTabsContext } from './context';
import './index.less';

interface TabRecord {
  key: string;
  label: string;
  path: string;
  closable: boolean;
}

const DASHBOARD_TAB: TabRecord = {
  key: '/dashboard',
  label: '工作台',
  path: '/dashboard',
  closable: false,
};

const ROUTE_LABELS: Record<string, string> = {
  '/dashboard': '工作台',
  '/operation-center/console': '操作中控台',
  '/operation-center/lines': '线路管理',
  '/system/users': '用户管理',
  '/system/roles': '角色管理',
  '/403': '无权限',
};

const TRANSIENT_PATHS = new Set(['/', '/operation-center']);

function getLocationStateLabel(state: unknown) {
  if (!state || typeof state !== 'object' || !('tabLabel' in state)) {
    return undefined;
  }
  const label = (state as { tabLabel?: unknown }).tabLabel;
  return typeof label === 'string' && label.trim() ? label.trim() : undefined;
}

function getFallbackLabel(pathname: string, _search: string) {
  const matched = ROUTE_LABELS[pathname];
  if (matched) {
    return matched;
  }

  const segment = pathname.split('/').filter(Boolean).pop();
  return segment ? decodeURIComponent(segment) : '工作台';
}

function buildTabKey(pathname: string, search: string) {
  return `${pathname}${search}`;
}

function buildTab(location: ReturnType<typeof useLocation>): TabRecord {
  const key = buildTabKey(location.pathname, location.search);
  const isDashboard = location.pathname === '/dashboard';
  return {
    key,
    label:
      getLocationStateLabel(location.state) ||
      getFallbackLabel(location.pathname, location.search),
    path: key,
    closable: !isDashboard,
  };
}

function buildInitialTabs(location: ReturnType<typeof useLocation>) {
  if (
    location.pathname === DASHBOARD_TAB.path ||
    TRANSIENT_PATHS.has(location.pathname)
  ) {
    return [DASHBOARD_TAB];
  }
  return [DASHBOARD_TAB, buildTab(location)];
}

export default function GlobalTabs() {
  const location = useLocation();
  const outlet = useOutlet();
  const aliveRef = useKeepAliveRef();
  const pageCacheRef = useRef(new Map<string, ReactNode>());
  const [tabs, setTabs] = useState<TabRecord[]>(() => buildInitialTabs(location));

  const routeKey = buildTabKey(location.pathname, location.search);

  // KeepAlive 每次激活都会把 children 写回缓存节点。如果这里直接传新的
  // <Outlet />，页面会被重新挂载，页签状态就丢了。按页签缓存首次拿到的
  // 路由元素，切回时复用同一个元素，保证页面实例和表单状态不变。
  const pageContent = useMemo(() => {
    if (!pageCacheRef.current.has(routeKey)) {
      pageCacheRef.current.set(
        routeKey,
        <Suspense
          fallback={
            <div className="global-tabs__loading">
              <Spin size="large" />
            </div>
          }
        >
          {outlet}
        </Suspense>,
      );
    }
    return pageCacheRef.current.get(routeKey);
  }, [outlet, routeKey]);

  useLayoutEffect(() => {
    if (TRANSIENT_PATHS.has(location.pathname)) {
      return;
    }

    setTabs((previous) => {
      if (previous.some((tab) => tab.key === routeKey)) {
        // 已有页签的标题可能已被页面内逻辑更新（例如团队改名），
        // 不能再用浏览器历史里的旧 state 覆盖。
        return previous;
      }
      return [...previous, buildTab(location)];
    });
  }, [location, routeKey]);

  const updateTabLabel = useCallback((key: string, label: string) => {
    const nextLabel = label.trim();
    if (!nextLabel) return;
    setTabs((previous) => {
      const target = previous.find((tab) => tab.key === key);
      if (!target || target.label === nextLabel) {
        return previous;
      }
      return previous.map((tab) =>
        tab.key === key ? { ...tab, label: nextLabel } : tab,
      );
    });
  }, []);

  const contextValue = useMemo(
    () => ({ updateTabLabel }),
    [updateTabLabel],
  );

  const handleChange = useCallback(
    (key: string) => {
      if (key === routeKey) return;
      const target = tabs.find((tab) => tab.key === key);
      if (target) {
        history.push(target.path);
      }
    },
    [routeKey, tabs],
  );

  const closeTab = useCallback(
    (targetKey: string) => {
      const targetIndex = tabs.findIndex((tab) => tab.key === targetKey);
      const target = tabs[targetIndex];
      if (!target || !target.closable) {
        return;
      }

      const nextTab = tabs[targetIndex + 1] ?? tabs[targetIndex - 1] ?? DASHBOARD_TAB;
      const closingActive = targetKey === routeKey;

      pageCacheRef.current.delete(targetKey);
      void aliveRef.current?.destroy(targetKey);
      setTabs((previous) => previous.filter((tab) => tab.key !== targetKey));

      if (closingActive) {
        history.push(nextTab.path);
      }
    },
    [aliveRef, routeKey, tabs],
  );

  const handleEdit = useCallback(
    (
      targetKey: React.MouseEvent | React.KeyboardEvent | string,
      action: 'add' | 'remove',
    ) => {
      if (action === 'remove' && typeof targetKey === 'string') {
        closeTab(targetKey);
      }
    },
    [closeTab],
  );

  return (
    <GlobalTabsContext.Provider value={contextValue}>
      <div className="global-tabs">
        <div className="global-tabs__bar">
          <Tabs
            type="editable-card"
            size="small"
            hideAdd
            activeKey={routeKey}
            items={tabs.map((tab) => ({
              key: tab.key,
              closable: tab.closable,
              label: <span className="global-tabs__label">{tab.label}</span>,
            }))}
            onChange={handleChange}
            onEdit={handleEdit}
          />
        </div>
        <div className="global-tabs__content">
          <KeepAlive
            activeCacheKey={routeKey}
            aliveRef={aliveRef}
            max={30}
            containerClassName="global-tabs__cache"
          >
            {pageContent}
          </KeepAlive>
        </div>
      </div>
    </GlobalTabsContext.Provider>
  );
}
