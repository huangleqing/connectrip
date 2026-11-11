import { LogoutOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { useModel } from '@umijs/max';
import { useRequest } from 'ahooks';
import { App, Dropdown, Tag } from 'antd';
import type { MenuProps } from 'antd';
import type { PropsWithChildren } from 'react';
import { getCurrentUser, logout as logoutService } from '@/services/auth';
import type { InitialState } from '@/types';
import { clearToken } from '@/utils/auth';

export default function AvatarDropdown({ children }: PropsWithChildren) {
  const { message } = App.useApp();
  const { initialState, setInitialState } = useModel('@@initialState');

  const currentUser = initialState?.currentUser;

  const { runAsync: runLogout, loading } = useRequest(logoutService, {
    manual: true,
  });

  const handleLogout = async () => {
    try {
      await runLogout();
    } catch {
      // JWT 无状态退出：即使接口失败也继续清理本地登录态
    }
    clearToken();
    await setInitialState((prev: InitialState | undefined) => ({
      currentUser: undefined,
      permissions: [],
      fetchUserInfo: prev?.fetchUserInfo ?? getCurrentUser,
    }));
    message.success('已安全退出');
    window.history.replaceState(null, '', '/login');
    window.location.reload();
  };

  const items: MenuProps['items'] = [
    {
      key: 'profile',
      disabled: true,
      label: (
        <div className="gd-avatar-profile">
          <div className="gd-avatar-profile__name">{currentUser?.nickname || '未登录'}</div>
          <div className="gd-avatar-profile__account">@{currentUser?.username}</div>
          <div className="gd-avatar-profile__roles">
            {currentUser?.roles?.map((role) => (
              <Tag key={role.id} color="blue" bordered={false}>
                {role.name}
              </Tag>
            ))}
          </div>
        </div>
      ),
    },
    { type: 'divider' },
    {
      key: 'permission',
      icon: <SafetyCertificateOutlined />,
      label: (
        <span>
          权限标识 <span className="gd-muted">{currentUser?.permissions?.length ?? 0} 项</span>
        </span>
      ),
      disabled: true,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      disabled: loading,
    },
  ];

  const onClick: MenuProps['onClick'] = ({ key }) => {
    if (key === 'logout') {
      handleLogout();
    }
  };

  return (
    <Dropdown menu={{ items, onClick }} placement="bottomRight" trigger={['click']}>
      <span className="gd-avatar-trigger">{children}</span>
    </Dropdown>
  );
}
