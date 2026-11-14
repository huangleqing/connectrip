import {
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  PlusOutlined,
  SafetyCertificateOutlined,
  TeamOutlined,
  UserAddOutlined,
} from '@ant-design/icons';
import type {
  ActionType,
  ProColumns,
  ProFormInstance,
} from '@ant-design/pro-components';
import {
  ModalForm,
  PageContainer,
  ProForm,
  ProFormSelect,
  ProFormText,
  ProFormTextArea,
  ProTable,
} from '@ant-design/pro-components';
import { Access, useAccess, useModel } from '@umijs/max';
import { useRequest } from 'ahooks';
import {
  Alert,
  App,
  Button,
  Descriptions,
  Drawer,
  Popconfirm,
  Segmented,
  Tag,
  Tooltip,
} from 'antd';
import dayjs from 'dayjs';
import { useRef, useState } from 'react';
import PermissionTree from '@/components/PermissionTree';
import { PERMISSIONS, PERMISSION_LABELS, ROLE_TAG_COLORS } from '@/constants/permissions';
import { useTableRequest } from '@/hooks/useTableRequest';
import {
  createRole,
  deleteRole,
  getPermissionTree,
  getRoleMemberUserOptions,
  queryRoles,
  updateRole,
  updateRoleMembers,
} from '@/services/role';
import type { Role, RoleQuery } from '@/types';
import './index.less';

interface RoleFormValues {
  name: string;
  code: string;
  description?: string;
  permissions: string[];
}

interface RoleModalState {
  open: boolean;
  mode: 'create' | 'edit';
  record?: Role;
}

interface MemberActionFormValues {
  action: 'add' | 'remove';
  userIds: number[];
}

export default function RolesPage() {
  const access = useAccess();
  const { message } = App.useApp();
  const { initialState, refresh } = useModel('@@initialState');
  const currentUser = initialState?.currentUser;

  const actionRef = useRef<ActionType>();
  const tableRequest = useTableRequest<Role, RoleQuery>(queryRoles);

  const [roleModal, setRoleModal] = useState<RoleModalState>({ open: false, mode: 'create' });
  const [viewRole, setViewRole] = useState<Role | null>(null);
  const [memberRole, setMemberRole] = useState<Role | null>(null);
  const [memberAction, setMemberAction] = useState<'add' | 'remove'>('add');
  const memberFormRef = useRef<ProFormInstance<MemberActionFormValues>>();

  const { data: permissionTree, loading: permissionLoading } = useRequest(getPermissionTree);
  const { runAsync: runCreate, loading: creating } = useRequest(createRole, { manual: true });
  const { runAsync: runUpdate, loading: updating } = useRequest(updateRole, { manual: true });
  const { runAsync: runDelete } = useRequest(deleteRole, { manual: true });
  const {
    data: memberUserOptions,
    loading: memberOptionsLoading,
    runAsync: loadMemberUserOptions,
  } = useRequest(getRoleMemberUserOptions, { manual: true });
  const { runAsync: runUpdateMembers, loading: updatingMembers } = useRequest(
    updateRoleMembers,
    { manual: true },
  );

  const memberOptions = (memberUserOptions ?? [])
    .filter((user) => (memberAction === 'add' ? !user.isMember : user.isMember))
    .map((user) => {
      const roleNames = user.roles.map((role) => role.name).join('、');
      return {
        label: `${user.nickname}（@${user.username}）${
          user.status === 'disabled' ? ' · 已停用' : ''
        }${roleNames ? ` · 当前角色：${roleNames}` : ' · 暂无角色'}`,
        value: user.id,
      };
    });

  const openCreateModal = () => {
    setRoleModal({ open: true, mode: 'create' });
  };

  const openEditModal = (record: Role) => {
    setRoleModal({ open: true, mode: 'edit', record });
  };

  const openMembersModal = (record: Role) => {
    setMemberAction('add');
    setMemberRole(record);
    loadMemberUserOptions(record.id).catch(() => {
      // 错误提示由请求层统一处理
    });
  };

  const handleMemberValuesChange = (changed: Partial<MemberActionFormValues>) => {
    if (changed.action !== undefined) {
      setMemberAction(changed.action);
      memberFormRef.current?.setFieldsValue({ userIds: [] });
    }
  };

  const handleMembers = async (values: MemberActionFormValues) => {
    if (!memberRole) return false;
    try {
      const result = await runUpdateMembers(memberRole.id, {
        action: values.action,
        userIds: values.userIds,
      });
      if (result.affected > 0) {
        message.success(
          result.action === 'add'
            ? `已为 ${result.affected} 位用户添加「${memberRole.name}」角色`
            : `已从「${memberRole.name}」移除 ${result.affected} 位用户`,
        );
      } else {
        message.info(
          result.action === 'add'
            ? '所选用户已拥有该角色'
            : '所选用户不属于该角色',
        );
      }
      actionRef.current?.reload();
      refresh();
      return true;
    } catch {
      return false;
    }
  };

  const handleFinish = async (values: RoleFormValues) => {
    const isCreate = roleModal.mode === 'create';
    const payload = {
      name: values.name.trim(),
      code: values.code.trim(),
      description: values.description?.trim() || undefined,
      permissions: values.permissions,
    };

    try {
      if (isCreate) {
        await runCreate(payload);
      } else if (roleModal.record) {
        await runUpdate(roleModal.record.id, payload);
      }
      message.success(
        isCreate
          ? '角色创建成功'
          : '角色权限已更新；相关成员需刷新页面或重新登录后生效',
      );
      actionRef.current?.reload();
      refresh();
      return true;
    } catch {
      return false;
    }
  };

  const handleDelete = async (record: Role) => {
    try {
      await runDelete(record.id);
      message.success(`已删除角色 ${record.name}`);
      actionRef.current?.reload();
      refresh();
    } catch {
      // 错误提示由请求层统一处理
    }
  };

  const columns: ProColumns<Role>[] = [
    {
      title: '关键字',
      dataIndex: 'keyword',
      hideInTable: true,
      fieldProps: { placeholder: '搜索角色名称 / 编码' },
    },
    {
      title: '角色',
      dataIndex: 'name',
      hideInSearch: true,
      width: 230,
      render: (_, record) => (
        <button type="button" className="role-name-cell" onClick={() => setViewRole(record)}>
          <span
            className={`role-name-cell__icon ${record.isSystem ? 'role-name-cell__icon--system' : ''}`}
          >
            <TeamOutlined />
          </span>
          <span className="gd-role-cell">
            <span className="gd-role-cell__name">
              {record.name}
              {record.isSystem && (
                <Tag color="gold" bordered={false} className="role-system-tag">
                  内置
                </Tag>
              )}
            </span>
            <span className="gd-role-cell__code">{record.code}</span>
          </span>
        </button>
      ),
    },
    {
      title: '角色说明',
      dataIndex: 'description',
      hideInSearch: true,
      ellipsis: true,
      width: 260,
      render: (_, record) => record.description || <span className="gd-muted">—</span>,
    },
    {
      title: '权限',
      dataIndex: 'permissions',
      hideInSearch: true,
      width: 120,
      render: (_, record) => (
        <Tooltip
          title={
            <div className="role-permission-tooltip">
              {record.permissions.length
                ? record.permissions.map((code) => (
                    <div key={code}>· {PERMISSION_LABELS[code] || code}</div>
                  ))
                : '暂未分配权限'}
            </div>
          }
        >
          <Tag color={record.permissions.length ? 'blue' : 'default'} bordered={false}>
            {record.permissions.length} 项
          </Tag>
        </Tooltip>
      ),
    },
    {
      title: '成员',
      dataIndex: 'userCount',
      hideInSearch: true,
      width: 90,
      render: (_, record) => (
        <span className="role-member-count">
          <TeamOutlined /> {record.userCount}
        </span>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      hideInSearch: true,
      width: 120,
      render: (_, record) => dayjs(record.createdAt).format('YYYY-MM-DD'),
    },
    {
      title: '操作',
      valueType: 'option',
      key: 'action',
      width: 260,
      fixed: 'right',
      render: (_, record) => {
        const editLink = (
          <a onClick={() => openEditModal(record)}>
            <EditOutlined /> 编辑
          </a>
        );
        const deleteLink = (
          <Popconfirm
            title="删除角色"
            description={`确定删除角色「${record.name}」吗？此操作不可恢复。`}
            okText="删除"
            okButtonProps={{ danger: true }}
            cancelText="取消"
            onConfirm={() => handleDelete(record)}
          >
            <a className="gd-danger-link">
              <DeleteOutlined /> 删除
            </a>
          </Popconfirm>
        );

        return (
          <div className="gd-table-actions">
            <a onClick={() => setViewRole(record)}>
              <EyeOutlined /> 查看
            </a>

            {record.isSystem && !currentUser?.isSuperAdmin ? (
              <Tooltip title="只有超级管理员可以管理超级管理员角色成员">
                <span className="role-action-disabled">
                  <UserAddOutlined /> 成员管理
                </span>
              </Tooltip>
            ) : (
              <Access
                accessible={access.hasPermission(PERMISSIONS.ROLE_UPDATE)}
                fallback={null}
              >
                <a onClick={() => openMembersModal(record)}>
                  <UserAddOutlined /> 成员管理
                </a>
              </Access>
            )}

            {record.isSystem ? (
              <Tooltip title="系统内置角色，不可编辑">
                <span className="role-action-disabled">
                  <EditOutlined /> 编辑
                </span>
              </Tooltip>
            ) : (
              <Access
                accessible={access.hasPermission(PERMISSIONS.ROLE_UPDATE)}
                fallback={null}
              >
                {editLink}
              </Access>
            )}

            {record.isSystem ? (
              <Tooltip title="系统内置角色，不可删除">
                <span className="role-action-disabled">
                  <DeleteOutlined /> 删除
                </span>
              </Tooltip>
            ) : record.userCount > 0 ? (
              <Tooltip title="请先将成员从该角色移出">
                <span className="role-action-disabled">
                  <DeleteOutlined /> 删除
                </span>
              </Tooltip>
            ) : (
              <Access
                accessible={access.hasPermission(PERMISSIONS.ROLE_DELETE)}
                fallback={null}
              >
                {deleteLink}
              </Access>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <PageContainer title="角色管理" subTitle="配置角色及其菜单、按钮权限，构建清晰的访问边界">
      <ProTable<Role, RoleQuery>
        className="roles-table"
        rowKey="id"
        actionRef={actionRef}
        columns={columns}
        request={tableRequest}
        headerTitle="角色列表"
        cardBordered={false}
        search={{ labelWidth: 'auto', defaultCollapsed: false }}
        pagination={{ pageSize: 10, showSizeChanger: true }}
        options={{ reload: true, density: false, setting: false, fullScreen: false }}
        scroll={{ x: 1080 }}
        toolBarRender={() => [
          <Access
            key="create"
            accessible={access.hasPermission(PERMISSIONS.ROLE_CREATE)}
            fallback={null}
          >
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
              新建角色
            </Button>
          </Access>,
        ]}
      />

      <ModalForm<RoleFormValues>
        key={`${roleModal.mode}-${roleModal.record?.id ?? 'new'}`}
        title={roleModal.mode === 'create' ? '新建角色' : `编辑角色 · ${roleModal.record?.name ?? ''}`}
        open={roleModal.open}
        onOpenChange={(open) => {
          if (!open) setRoleModal((prev) => ({ ...prev, open: false }));
        }}
        width={700}
        layout="vertical"
        initialValues={
          roleModal.mode === 'edit' && roleModal.record
            ? {
                name: roleModal.record.name,
                code: roleModal.record.code,
                description: roleModal.record.description,
                permissions: roleModal.record.permissions,
              }
            : { permissions: [] }
        }
        modalProps={{ destroyOnHidden: true, maskClosable: false }}
        submitter={{
          searchConfig: { submitText: roleModal.mode === 'create' ? '创建角色' : '保存权限' },
          submitButtonProps: { loading: creating || updating },
        }}
        onFinish={handleFinish}
      >
        <ProForm.Group>
          <ProFormText
            name="name"
            label="角色名称"
            placeholder="例如：计调专员"
            width="md"
            rules={[
              { required: true, message: '请输入角色名称' },
              { max: 20, message: '角色名称最多 20 个字符' },
            ]}
          />
          <ProFormText
            name="code"
            label="角色编码"
            placeholder="例如：dispatcher"
            width="md"
            disabled={roleModal.mode === 'edit'}
            rules={[
              { required: true, message: '请输入角色编码' },
              {
                pattern: /^[a-z][a-z0-9_]{2,31}$/,
                message: '3-32 位小写字母、数字或下划线，需以字母开头',
              },
            ]}
            fieldProps={{ autoComplete: 'off' }}
          />
        </ProForm.Group>

        <ProFormTextArea
          name="description"
          label="角色说明"
          placeholder="简要描述该角色的职责与适用人员"
          fieldProps={{ rows: 2, maxLength: 100, showCount: true }}
          rules={[{ max: 100, message: '角色说明最多 100 个字符' }]}
        />

        <ProForm.Item
          name="permissions"
          label={
            <span className="role-permission-label">
              权限配置
              <span>
                勾选父级可批量授权；未勾选「查看操作金额」时金额显示 ****。保存后相关成员需刷新页面或重新登录，超级管理员始终拥有全部权限。
              </span>
            </span>
          }
          rules={[
            {
              validator: (_: unknown, value: string[] | undefined) => {
                if (value?.length) return Promise.resolve();
                return Promise.reject(new Error('请至少选择一项权限'));
              },
            },
          ]}
        >
          <PermissionTree treeData={permissionTree ?? []} loading={permissionLoading} />
        </ProForm.Item>
      </ModalForm>

      <ModalForm<MemberActionFormValues>
        key={`members-${memberRole?.id ?? 'none'}`}
        formRef={memberFormRef}
        title={memberRole ? `成员管理 · ${memberRole.name}` : '成员管理'}
        open={Boolean(memberRole)}
        onOpenChange={(open) => {
          if (!open) {
            setMemberRole(null);
            setMemberAction('add');
          }
        }}
        width={640}
        layout="vertical"
        initialValues={{ action: 'add', userIds: [] }}
        modalProps={{ destroyOnHidden: true, maskClosable: false }}
        onValuesChange={handleMemberValuesChange}
        submitter={{
          searchConfig: {
            submitText: memberAction === 'add' ? '批量添加' : '批量移除',
          },
          submitButtonProps: {
            loading: updatingMembers,
            danger: memberAction === 'remove',
            disabled:
              memberOptionsLoading ||
              memberOptions.length === 0 ||
              (memberAction === 'remove' && memberRole?.code === 'super_admin'),
          },
        }}
        onFinish={handleMembers}
      >
        <Alert
          type={memberAction === 'add' ? 'info' : 'warning'}
          showIcon
          message={
            memberAction === 'add'
              ? `只会把用户加入「${memberRole?.name ?? ''}」，不会影响用户已有的其他角色。`
              : `只会把用户从「${memberRole?.name ?? ''}」移除，不会删除用户或其他角色。`
          }
          style={{ marginBottom: 16 }}
        />

        <ProForm.Item name="action" label="操作类型">
          <Segmented
            block
            options={[
              { label: '添加成员', value: 'add' },
              {
                label: '移除成员',
                value: 'remove',
                disabled: memberRole?.code === 'super_admin',
              },
            ]}
          />
        </ProForm.Item>

        <ProFormSelect
          name="userIds"
          label={
            memberRole
              ? `选择用户（该角色当前已有 ${memberRole.userCount} 位成员）`
              : '选择用户'
          }
          placeholder={
            memberAction === 'add'
              ? '搜索并选择要添加的用户'
              : '搜索并选择要移除的用户'
          }
          options={memberOptions}
          rules={[
            {
              required: true,
              type: 'array',
              min: 1,
              message: '请至少选择一个用户',
            },
          ]}
          fieldProps={{
            mode: 'multiple',
            showSearch: true,
            optionFilterProp: 'label',
            maxTagCount: 'responsive',
            loading: memberOptionsLoading,
            disabled: memberOptionsLoading,
          }}
        />

        {memberRole?.code === 'super_admin' && (
          <Alert
            type="info"
            showIcon
            message="超级管理员角色不允许批量移除成员，仅支持添加。"
          />
        )}

        {!memberOptionsLoading && memberOptions.length === 0 && (
          <Alert
            type="warning"
            showIcon
            message={
              memberAction === 'add'
                ? '所有用户都已加入该角色。'
                : '该角色暂无成员。'
            }
          />
        )}
      </ModalForm>

      <Drawer
        title="角色详情"
        width={560}
        open={Boolean(viewRole)}
        onClose={() => setViewRole(null)}
        destroyOnHidden
      >
        {viewRole && (
          <div className="role-view">
            <div className="role-view__head">
              <div className="role-view__icon">
                <SafetyCertificateOutlined />
              </div>
              <div>
                <div className="role-view__name">
                  {viewRole.name}
                  {viewRole.isSystem && <Tag color="gold">内置角色</Tag>}
                  <Tag color={ROLE_TAG_COLORS[viewRole.code] ?? 'purple'}>{viewRole.code}</Tag>
                </div>
                <div className="role-view__desc">{viewRole.description || '暂无角色说明'}</div>
              </div>
            </div>

            <Descriptions
              className="role-view__descriptions"
              size="small"
              column={2}
              items={[
                { key: 'members', label: '成员数量', children: `${viewRole.userCount} 人` },
                {
                  key: 'permissions',
                  label: '权限项',
                  children: `${viewRole.permissions.length} 项`,
                },
                {
                  key: 'createdAt',
                  label: '创建时间',
                  children: dayjs(viewRole.createdAt).format('YYYY-MM-DD HH:mm'),
                },
                {
                  key: 'type',
                  label: '角色类型',
                  children: viewRole.isSystem ? '系统内置' : '自定义角色',
                },
              ]}
            />

            <div className="role-view__section-title">
              <SafetyCertificateOutlined /> 权限明细
            </div>
            <PermissionTree
              className="role-view__tree"
              treeData={permissionTree ?? []}
              value={viewRole.permissions}
              loading={permissionLoading}
              disabled
            />
          </div>
        )}
      </Drawer>
    </PageContainer>
  );
}
