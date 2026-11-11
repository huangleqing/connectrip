import { DeleteOutlined, EditOutlined, KeyOutlined, PlusOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ModalForm, PageContainer, ProForm, ProFormSelect, ProFormText, ProTable } from '@ant-design/pro-components';
import { Access, useAccess, useModel } from '@umijs/max';
import { useRequest } from 'ahooks';
import { Alert, App, Button, Popconfirm, Switch, Tag, Tooltip } from 'antd';
import dayjs from 'dayjs';
import { useRef, useState } from 'react';
import UserAvatar from '@/components/UserAvatar';
import { PERMISSIONS, ROLE_TAG_COLORS } from '@/constants/permissions';
import { useTableRequest } from '@/hooks/useTableRequest';
import { getRoleOptions } from '@/services/role';
import {
  createUser,
  deleteUser,
  queryUsers,
  resetUserPassword,
  updateUser,
  updateUserStatus,
} from '@/services/user';
import type { User, UserQuery, UserStatus } from '@/types';
import './index.less';

interface UserFormValues {
  username?: string;
  nickname: string;
  email?: string;
  phone?: string;
  roleIds: number[];
  status: UserStatus;
  password?: string;
}

interface UserModalState {
  open: boolean;
  mode: 'create' | 'edit';
  record?: User;
}

interface ResetPasswordValues {
  password: string;
  confirmPassword: string;
}

export default function UsersPage() {
  const access = useAccess();
  const { message } = App.useApp();
  const { initialState } = useModel('@@initialState');
  const currentUser = initialState?.currentUser;

  const actionRef = useRef<ActionType>();
  const tableRequest = useTableRequest<User, UserQuery>(queryUsers);

  const [userModal, setUserModal] = useState<UserModalState>({ open: false, mode: 'create' });
  const [resetTarget, setResetTarget] = useState<User | null>(null);
  const [statusLoadingId, setStatusLoadingId] = useState<number>();

  const { data: roleOptions } = useRequest(getRoleOptions);
  const { runAsync: runCreate, loading: creating } = useRequest(createUser, { manual: true });
  const { runAsync: runUpdate, loading: updating } = useRequest(updateUser, { manual: true });
  const { runAsync: runUpdateStatus } = useRequest(updateUserStatus, { manual: true });
  const { runAsync: runResetPassword, loading: resetting } = useRequest(resetUserPassword, {
    manual: true,
  });
  const { runAsync: runDelete } = useRequest(deleteUser, { manual: true });

  const formRoleOptions = (roleOptions ?? []).map((role) => ({ label: role.label, value: role.value }));
  const searchRoleOptions = (roleOptions ?? []).map((role) => ({ label: role.label, value: role.code }));
  const canManageUsers = access.hasPermission(
    [PERMISSIONS.USER_UPDATE, PERMISSIONS.USER_RESET_PASSWORD, PERMISSIONS.USER_DELETE],
    'any',
  );
  const editingSelf =
    userModal.mode === 'edit' && Boolean(currentUser) && userModal.record?.id === currentUser?.id;

  const openCreateModal = () => {
    setUserModal({ open: true, mode: 'create' });
  };

  const openEditModal = (record: User) => {
    setUserModal({ open: true, mode: 'edit', record });
  };

  const handleFinish = async (values: UserFormValues) => {
    const isCreate = userModal.mode === 'create';
    try {
      if (isCreate) {
        await runCreate({
          username: values.username!.trim(),
          nickname: values.nickname.trim(),
          password: values.password!,
          email: values.email?.trim() || undefined,
          phone: values.phone?.trim() || undefined,
          roleIds: values.roleIds,
          status: values.status,
        });
      } else if (userModal.record) {
        await runUpdate(userModal.record.id, {
          nickname: values.nickname.trim(),
          email: values.email?.trim() || undefined,
          phone: values.phone?.trim() || undefined,
          roleIds: values.roleIds,
          status: values.status,
        });
      }
      message.success(isCreate ? '用户创建成功' : '用户信息已更新');
      actionRef.current?.reload();
      return true;
    } catch {
      return false;
    }
  };

  const handleResetPassword = async (values: ResetPasswordValues) => {
    if (!resetTarget) return false;
    try {
      await runResetPassword(resetTarget.id, values.password);
      message.success(`已修改 ${resetTarget.nickname} 的登录密码`);
      return true;
    } catch {
      return false;
    }
  };

  const handleToggleStatus = async (record: User, checked: boolean) => {
    setStatusLoadingId(record.id);
    try {
      await runUpdateStatus(record.id, checked ? 'active' : 'disabled');
      message.success(checked ? `已启用 ${record.nickname}` : `已停用 ${record.nickname}`);
      actionRef.current?.reload();
    } catch {
      // 错误提示由请求层统一处理
    } finally {
      setStatusLoadingId(undefined);
    }
  };

  const handleDelete = async (record: User) => {
    try {
      await runDelete(record.id);
      message.success(`已删除用户 ${record.nickname}`);
      actionRef.current?.reload();
    } catch {
      // 错误提示由请求层统一处理
    }
  };

  const columns: ProColumns<User>[] = [
    {
      title: '关键字',
      dataIndex: 'keyword',
      hideInTable: true,
      fieldProps: { placeholder: '搜索账号 / 昵称 / 手机号' },
    },
    {
      title: '角色',
      dataIndex: 'roleCode',
      hideInTable: true,
      valueType: 'select',
      fieldProps: {
        placeholder: '按角色筛选',
        options: searchRoleOptions,
        allowClear: true,
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      hideInTable: true,
      valueType: 'select',
      valueEnum: {
        active: { text: '正常' },
        disabled: { text: '停用' },
      },
    },
    {
      title: '用户',
      dataIndex: 'nickname',
      hideInSearch: true,
      width: 220,
      render: (_, record) => (
        <div className="gd-user-cell">
          <UserAvatar name={record.nickname} src={record.avatar} size={36} />
          <div className="gd-user-cell__main">
            <span className="gd-user-cell__name">
              {record.nickname}
              {record.id === currentUser?.id && (
                <Tag color="blue" bordered={false} className="user-self-tag">
                  我
                </Tag>
              )}
            </span>
            <span className="gd-user-cell__account">@{record.username}</span>
          </div>
        </div>
      ),
    },
    {
      title: '角色',
      dataIndex: 'roles',
      hideInSearch: true,
      width: 180,
      render: (_, record) => (
        <div className="gd-inline-tags">
          {record.roles?.length ? (
            record.roles.map((role) => (
              <Tag key={role.id} color={ROLE_TAG_COLORS[role.code] ?? 'purple'} bordered={false}>
                {role.name}
              </Tag>
            ))
          ) : (
            <span className="gd-muted">未分配</span>
          )}
        </div>
      ),
    },
    {
      title: '联系方式',
      dataIndex: 'contact',
      hideInSearch: true,
      width: 200,
      render: (_, record) => (
        <div className="user-contact">
          <span className="user-contact__email">{record.email || '—'}</span>
          <span className="user-contact__phone">{record.phone || '—'}</span>
        </div>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      hideInSearch: true,
      width: 120,
      render: (_, record) => {
        const canOperate =
          access.hasPermission(PERMISSIONS.USER_UPDATE) && record.id !== currentUser?.id;
        const statusTag = (
          <Tag color={record.status === 'active' ? 'success' : 'default'} bordered={false}>
            {record.status === 'active' ? '正常' : '停用'}
          </Tag>
        );

        if (!canOperate) {
          return record.id === currentUser?.id ? (
            <Tooltip title="不能停用当前登录账号">{statusTag}</Tooltip>
          ) : (
            statusTag
          );
        }

        return (
          <Access accessible={canOperate} fallback={statusTag}>
            <Switch
              size="small"
              checked={record.status === 'active'}
              loading={statusLoadingId === record.id}
              checkedChildren="正常"
              unCheckedChildren="停用"
              onChange={(checked) => handleToggleStatus(record, checked)}
            />
          </Access>
        );
      },
    },
    {
      title: '最后登录',
      dataIndex: 'lastLoginAt',
      hideInSearch: true,
      width: 150,
      render: (_, record) =>
        record.lastLoginAt ? (
          dayjs(record.lastLoginAt).format('YYYY-MM-DD HH:mm')
        ) : (
          <span className="gd-muted">从未登录</span>
        ),
    },
    {
      title: '操作',
      valueType: 'option',
      key: 'action',
      width: 220,
      fixed: 'right',
      hideInTable: !canManageUsers,
      render: (_, record) => (
        <div className="gd-table-actions">
          <Access accessible={access.hasPermission(PERMISSIONS.USER_UPDATE)} fallback={null}>
            <a onClick={() => openEditModal(record)}>
              <EditOutlined /> 编辑
            </a>
          </Access>
          <Access
            accessible={access.hasPermission(PERMISSIONS.USER_RESET_PASSWORD)}
            fallback={null}
          >
            <a onClick={() => setResetTarget(record)} title="修改登录密码">
              <KeyOutlined /> 修改密码
            </a>
          </Access>
          <Access
            accessible={
              access.hasPermission(PERMISSIONS.USER_DELETE) && record.id !== currentUser?.id
            }
            fallback={null}
          >
            <Popconfirm
              title="删除用户"
              description={`删除 ${record.nickname} 后不可恢复，是否继续？`}
              okText="删除"
              okButtonProps={{ danger: true }}
              cancelText="取消"
              onConfirm={() => handleDelete(record)}
            >
              <a className="gd-danger-link">
                <DeleteOutlined /> 删除
              </a>
            </Popconfirm>
          </Access>
        </div>
      ),
    },
  ];

  return (
    <PageContainer
      title="用户管理"
      subTitle="维护系统登录账号、角色归属与账号状态"
    >
      <ProTable<User, UserQuery>
        className="users-table"
        rowKey="id"
        actionRef={actionRef}
        columns={columns}
        request={tableRequest}
        headerTitle="登录用户列表"
        cardBordered={false}
        search={{ labelWidth: 'auto', defaultCollapsed: false }}
        pagination={{ pageSize: 10, showSizeChanger: true }}
        scroll={canManageUsers ? { x: 1090 } : undefined}
        options={{ reload: true, density: false, setting: false, fullScreen: false }}
        toolBarRender={() => [
          <Access
            key="create"
            accessible={access.hasPermission(PERMISSIONS.USER_CREATE)}
            fallback={null}
          >
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
              新建用户
            </Button>
          </Access>,
        ]}
      />

      <ModalForm<UserFormValues>
        key={`${userModal.mode}-${userModal.record?.id ?? 'new'}`}
        title={userModal.mode === 'create' ? '新建用户' : `编辑用户 · ${userModal.record?.nickname ?? ''}`}
        open={userModal.open}
        onOpenChange={(open) => {
          if (!open) setUserModal((prev) => ({ ...prev, open: false }));
        }}
        width={640}
        layout="vertical"
        initialValues={
          userModal.mode === 'edit' && userModal.record
            ? {
                username: userModal.record.username,
                nickname: userModal.record.nickname,
                email: userModal.record.email,
                phone: userModal.record.phone,
                roleIds: userModal.record.roleIds,
                status: userModal.record.status,
              }
            : { status: 'active', roleIds: [] }
        }
        modalProps={{ destroyOnHidden: true, maskClosable: false }}
        submitter={{
          searchConfig: { submitText: userModal.mode === 'create' ? '创建用户' : '保存修改' },
          submitButtonProps: { loading: creating || updating },
        }}
        onFinish={handleFinish}
      >
        <ProForm.Group>
          <ProFormText
            name="username"
            label="登录账号"
            placeholder="请输入登录账号"
            disabled={userModal.mode === 'edit'}
            width="md"
            rules={[
              { required: userModal.mode === 'create', message: '请输入登录账号' },
              { pattern: /^[a-zA-Z][a-zA-Z0-9_]{2,19}$/, message: '3-20 位字母、数字或下划线，需以字母开头' },
            ]}
            fieldProps={{ autoComplete: 'off' }}
          />
          <ProFormText
            name="nickname"
            label="用户昵称"
            placeholder="请输入用户昵称"
            width="md"
            rules={[{ required: true, message: '请输入用户昵称' }, { max: 20, message: '昵称最多 20 个字符' }]}
          />
        </ProForm.Group>

        {userModal.mode === 'create' && (
          <ProFormText.Password
            name="password"
            label="初始密码"
            placeholder="请设置初始密码"
            rules={[
              { required: true, message: '请设置初始密码' },
              { min: 6, max: 32, message: '密码长度为 6-32 位' },
            ]}
            fieldProps={{ autoComplete: 'new-password' }}
          />
        )}

        <ProForm.Group>
          <ProFormText
            name="email"
            label="邮箱"
            placeholder="name@example.com"
            width="md"
            rules={[{ type: 'email', message: '请输入有效的邮箱地址' }]}
          />
          <ProFormText
            name="phone"
            label="手机号"
            placeholder="请输入手机号"
            width="md"
            rules={[{ pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号' }]}
          />
        </ProForm.Group>

        <ProForm.Group>
          <ProFormSelect
            name="roleIds"
            label="所属角色"
            width="md"
            placeholder="请选择角色"
            options={formRoleOptions}
            rules={[{ required: true, message: '请至少选择一个角色' }]}
            fieldProps={{ mode: 'multiple', allowClear: true, disabled: editingSelf }}
          />
          <ProFormSelect
            name="status"
            label="账号状态"
            width="md"
            options={[
              { label: '正常', value: 'active' },
              { label: '停用', value: 'disabled' },
            ]}
            rules={[{ required: true, message: '请选择账号状态' }]}
            fieldProps={{ disabled: editingSelf }}
          />
        </ProForm.Group>

        <div className="gd-form-tip">
          {editingSelf
            ? '当前登录账号不可修改自身的角色与启用状态，避免误操作导致权限丢失。'
            : '账号创建后不可修改登录名；角色权限变更会在用户下次刷新登录态后生效。'}
        </div>
      </ModalForm>

      <ModalForm<ResetPasswordValues>
        key={`reset-${resetTarget?.id ?? 'none'}`}
        title={`修改密码 · ${resetTarget?.nickname ?? ''}`}
        open={Boolean(resetTarget)}
        onOpenChange={(open) => {
          if (!open) setResetTarget(null);
        }}
        width={480}
        layout="vertical"
        modalProps={{ destroyOnHidden: true, maskClosable: false }}
        submitter={{
          searchConfig: { submitText: '保存新密码' },
          submitButtonProps: { loading: resetting },
        }}
        onFinish={handleResetPassword}
      >
        <Alert
          type="info"
          showIcon
          message="密码使用 bcrypt 单向哈希存储，无法查看原文；超级管理员只能为用户设置新密码。"
          style={{ marginBottom: 16 }}
        />
        <ProFormText.Password
          name="password"
          label="新密码"
          placeholder="请输入 6-32 位新密码"
          rules={[
            { required: true, message: '请输入新密码' },
            { min: 6, max: 32, message: '密码长度为 6-32 位' },
          ]}
          fieldProps={{ autoComplete: 'new-password' }}
        />
        <ProFormText.Password
          name="confirmPassword"
          label="确认新密码"
          placeholder="请再次输入新密码"
          dependencies={['password']}
          rules={[
            { required: true, message: '请再次输入新密码' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('password') === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error('两次输入的密码不一致'));
              },
            }),
          ]}
          fieldProps={{ autoComplete: 'new-password' }}
        />
      </ModalForm>
    </PageContainer>
  );
}
