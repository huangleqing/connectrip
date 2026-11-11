import { AccessDenied, AvatarDropdown, Footer, HeaderActions } from '@/components';
import { getCurrentUser } from '@/services/auth';
import type { CurrentUser, InitialState } from '@/types';
import { getToken } from '@/utils/auth';
import { App as AntdApp, ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import type { RunTimeLayoutConfig } from '@umijs/max';
import { history } from '@umijs/max';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import type { ReactNode } from 'react';
import defaultSettings from '../config/defaultSettings';

dayjs.locale('zh-cn');

const LOGIN_PATH = '/login';

export async function getInitialState(): Promise<InitialState> {
  const fetchUserInfo = async () => getCurrentUser();

  let currentUser: CurrentUser | undefined;
  if (getToken()) {
    try {
      currentUser = await fetchUserInfo();
    } catch {
      // 登录态失效时由 request 拦截器统一跳转登录页
    }
  }

  return {
    currentUser,
    permissions: currentUser?.permissions ?? [],
    fetchUserInfo,
  };
}

export const layout: RunTimeLayoutConfig = ({ initialState }) => {
  return {
    ...defaultSettings,
    logo: '/logo.svg',
    avatarProps: {
      src: initialState?.currentUser?.avatar,
      size: 'small',
      title: initialState?.currentUser?.nickname || '未登录',
      children: initialState?.currentUser?.nickname?.slice(0, 1),
      style: { backgroundColor: '#1677ff', fontWeight: 600 },
      render: (_, avatarChildren) => <AvatarDropdown>{avatarChildren}</AvatarDropdown>,
    },
    actionsRender: () => [<HeaderActions key="header-help" />],
    footerRender: () => <Footer />,
    menuFooterRender: (props) =>
      props?.collapsed ? null : <div className="gd-sider-footer">RBAC · 精细化权限控制</div>,
    unAccessible: <AccessDenied />,
    onPageChange: () => {
      const { location } = history;
      if (!initialState?.currentUser && location.pathname !== LOGIN_PATH) {
        const redirect = encodeURIComponent(`${location.pathname}${location.search}`);
        history.replace(`${LOGIN_PATH}?redirect=${redirect}`);
      }
    },
  };
};

export function rootContainer(container: ReactNode) {
  return (
    <ConfigProvider locale={zhCN}>
      <AntdApp style={{ height: '100%' }}>{container}</AntdApp>
    </ConfigProvider>
  );
}
