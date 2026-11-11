import {
  LockOutlined,
  LogoutOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import { ModalForm, ProFormText } from '@ant-design/pro-components';
import { useModel } from '@umijs/max';
import { useRequest } from 'ahooks';
import { Alert, App, Dropdown, Tag } from 'antd';
import type { MenuProps } from 'antd';
import type { PropsWithChildren } from 'react';
import { useState } from 'react';
import {
  changePassword,
  getCurrentUser,
  logout as logoutService,
} from '@/services/auth';
import type { ChangePasswordParams, InitialState } from '@/types';
import { clearToken } from '@/utils/auth';

interface ChangePasswordFormValues extends ChangePasswordParams {
  confirmPassword: string;
}

export default function AvatarDropdown({ children }: PropsWithChildren) {
  const { message } = App.useApp();
  const { initialState, setInitialState } = useModel('@@initialState');
  const [menuOpen, setMenuOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);

  const currentUser = initialState?.currentUser;

  const { runAsync: runLogout, loading } = useRequest(logoutService, {
    manual: true,
  });
  const { runAsync: runChangePassword, loading: changingPassword } = useRequest(
    changePassword,
    { manual: true },
  );

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

  const handleChangePassword = async (values: ChangePasswordFormValues) => {
    try {
      await runChangePassword({
        oldPassword: values.oldPassword,
        newPassword: values.newPassword,
      });
      message.success('密码修改成功，下次登录请使用新密码');
      return true;
    } catch {
      return false;
    }
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
    { type: 'divider' },
    {
      key: 'change-password',
      icon: <LockOutlined />,
      label: '修改密码',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      disabled: loading,
    },
  ];

  const onClick: MenuProps['onClick'] = ({ key }) => {
    setMenuOpen(false);
    if (key === 'change-password') {
      setPasswordOpen(true);
    }
    if (key === 'logout') {
      handleLogout();
    }
  };

  return (
    <>
      <Dropdown
        menu={{ items, onClick }}
        open={menuOpen}
        onOpenChange={setMenuOpen}
        placement="bottomRight"
        trigger={['click']}
      >
        <span className="gd-avatar-trigger">{children}</span>
      </Dropdown>

      <ModalForm<ChangePasswordFormValues>
        title="修改登录密码"
        open={passwordOpen}
        onOpenChange={setPasswordOpen}
        width={440}
        layout="vertical"
        modalProps={{ destroyOnHidden: true, maskClosable: false }}
        submitter={{
          searchConfig: { submitText: '确认修改' },
          submitButtonProps: { loading: changingPassword },
        }}
        onFinish={handleChangePassword}
      >
        <Alert
          type="info"
          showIcon
          message="密码使用单向哈希存储，无法查看原文；修改成功后当前登录状态保持，下次登录请使用新密码。"
          style={{ marginBottom: 16 }}
        />

        <ProFormText.Password
          name="oldPassword"
          label="当前密码"
          placeholder="请输入当前登录密码"
          rules={[{ required: true, message: '请输入当前密码' }]}
          fieldProps={{ autoComplete: 'current-password' }}
        />
        <ProFormText.Password
          name="newPassword"
          label="新密码"
          placeholder="请输入 6-32 位新密码"
          rules={[
            { required: true, message: '请输入新密码' },
            { min: 6, max: 32, message: '密码长度需为 6-32 位' },
          ]}
          fieldProps={{ autoComplete: 'new-password' }}
        />
        <ProFormText.Password
          name="confirmPassword"
          label="确认新密码"
          placeholder="请再次输入新密码"
          dependencies={['newPassword']}
          rules={[
            { required: true, message: '请再次输入新密码' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('newPassword') === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error('两次输入的密码不一致'));
              },
            }),
          ]}
          fieldProps={{ autoComplete: 'new-password' }}
        />
      </ModalForm>
    </>
  );
}
