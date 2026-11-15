import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import {
  ModalForm,
  PageContainer,
  ProFormDigit,
  ProFormSwitch,
  ProFormText,
  ProTable,
} from '@ant-design/pro-components';
import { useAccess } from '@umijs/max';
import { useRequest } from 'ahooks';
import { App, Button, Popconfirm, Tag } from 'antd';
import { useEffect, useRef, useState } from 'react';
import { PERMISSIONS } from '@/constants/permissions';
import {
  createOperationLine,
  deleteOperationLine,
  getOperationLines,
  updateOperationLine,
  type CreateOperationLineParams,
  type UpdateOperationLineParams,
} from '@/services/operation';
import { notifyOperationDataChanged, subscribeOperationDataChanged } from '@/utils/operationEvents';
import type { OperationLine } from '../data';
import './index.less';

interface LineFormValues {
  name: string;
  code: string;
  sort?: number;
  enabled: boolean;
}

interface LineModalState {
  open: boolean;
  mode: 'create' | 'edit';
  record?: OperationLine;
}

interface LineQuery {
  keyword?: string;
  status?: 'enabled' | 'disabled';
}

export default function LinesPage() {
  const access = useAccess();
  const { message } = App.useApp();
  const actionRef = useRef<ActionType>();
  const canCreateLine = access.hasPermission(PERMISSIONS.OPERATION_LINE_CONFIG_CREATE);
  const canUpdateLine = access.hasPermission(PERMISSIONS.OPERATION_LINE_CONFIG_UPDATE);
  const canDeleteLine = access.hasPermission(PERMISSIONS.OPERATION_LINE_CONFIG_DELETE);
  const [modal, setModal] = useState<LineModalState>({ open: false, mode: 'create' });

  const { runAsync: runCreate, loading: creating } = useRequest(createOperationLine, {
    manual: true,
  });
  const { runAsync: runUpdate, loading: updating } = useRequest(updateOperationLine, {
    manual: true,
  });
  const { runAsync: runDelete } = useRequest(deleteOperationLine, { manual: true });

  useEffect(
    () =>
      subscribeOperationDataChanged((change) => {
        if (change.source !== 'lines') {
          actionRef.current?.reload();
        }
      }),
    [],
  );

  const openCreate = () => {
    setModal({ open: true, mode: 'create' });
  };

  const openEdit = (record: OperationLine) => {
    setModal({ open: true, mode: 'edit', record });
  };

  const handleFinish = async (values: LineFormValues) => {
    const payload: CreateOperationLineParams = {
      name: values.name.trim(),
      code: values.code.trim(),
      sort: values.sort,
      enabled: values.enabled,
    };

    try {
      if (modal.mode === 'create') {
        const created = await runCreate(payload);
        message.success(
          `线路「${created.name}」已创建，可在角色管理中分配线路权限`,
        );
      } else if (modal.record) {
        const patch: UpdateOperationLineParams = payload;
        await runUpdate(modal.record.id, patch);
        message.success(`线路「${payload.name}」已更新`);
      }

      setModal((previous) => ({ ...previous, open: false }));
      actionRef.current?.reload();
      notifyOperationDataChanged({ source: 'lines' });
      return true;
    } catch {
      return false;
    }
  };

  const handleDelete = async (record: OperationLine) => {
    try {
      const result = await runDelete(record.id);
      message.success(
        result.affectedTours
          ? `线路「${record.name}」已删除，${result.affectedTours} 个团队已一并隐藏`
          : `线路「${record.name}」已删除`,
      );
      actionRef.current?.reload();
      notifyOperationDataChanged({ source: 'lines' });
    } catch {
      // 错误提示由请求层统一处理
    }
  };

  const columns: ProColumns<OperationLine>[] = [
    {
      title: '关键字',
      dataIndex: 'keyword',
      hideInTable: true,
      fieldProps: { placeholder: '搜索线路名称 / 编码 / 权限标识' },
    },
    {
      title: '状态',
      dataIndex: 'status',
      hideInTable: true,
      valueType: 'select',
      valueEnum: {
        enabled: { text: '启用' },
        disabled: { text: '停用' },
      },
      fieldProps: { allowClear: true, placeholder: '全部状态' },
    },
    {
      title: '线路名称',
      dataIndex: 'name',
      hideInSearch: true,
      width: 220,
      render: (_, record) => (
        <div className="line-name-cell">
          <strong>{record.name}</strong>
          <span>{record.code}</span>
        </div>
      ),
    },
    {
      title: '权限标识',
      dataIndex: 'permissionCode',
      hideInSearch: true,
      width: 230,
      render: (_, record) => <code className="line-permission-code">{record.permissionCode}</code>,
    },
    {
      title: '排序',
      dataIndex: 'sort',
      hideInSearch: true,
      width: 80,
      align: 'center',
    },
    {
      title: '团队数',
      dataIndex: 'tourCount',
      hideInSearch: true,
      width: 90,
      align: 'center',
      render: (_, record) => record.tourCount ?? 0,
    },
    {
      title: '状态',
      dataIndex: 'enabled',
      hideInSearch: true,
      width: 90,
      align: 'center',
      render: (_, record) => (
        <Tag color={record.enabled ? 'success' : 'default'} bordered={false}>
          {record.enabled ? '启用' : '停用'}
        </Tag>
      ),
    },
    {
      title: '操作',
      valueType: 'option',
      key: 'action',
      width: 150,
      fixed: 'right',
      render: (_, record) => {
        if (!canUpdateLine && !canDeleteLine) {
          return <span className="gd-muted">—</span>;
        }
        return (
          <div className="gd-table-actions">
            {canUpdateLine ? (
              <a onClick={() => openEdit(record)}>
                <EditOutlined /> 修改
              </a>
            ) : null}
            {canDeleteLine ? (
              <Popconfirm
                title={`确定删除 ${record.name} 吗？`}
                okText="确定"
                okButtonProps={{ danger: true }}
                cancelText="取消"
                onConfirm={() => handleDelete(record)}
              >
                <a className="gd-danger-link">
                  <DeleteOutlined /> 删除
                </a>
              </Popconfirm>
            ) : null}
          </div>
        );
      },
    },
  ];

  return (
    <PageContainer
      title="线路管理"
      subTitle="维护线路、国家分类及其对应权限，团队统一在操作中控台中管理"
      breadcrumbRender={false}
    >
      <ProTable<OperationLine, LineQuery>
        className="lines-table"
        rowKey="id"
        actionRef={actionRef}
        columns={columns}
        headerTitle="线路列表"
        cardBordered={false}
        search={{ labelWidth: 'auto', defaultCollapsed: false }}
        pagination={{ pageSize: 10, showSizeChanger: true }}
        options={{ reload: true, density: false, setting: false, fullScreen: false }}
        scroll={{ x: 860 }}
        toolBarRender={() =>
          canCreateLine
            ? [
                <Button
                  key="create"
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={openCreate}
                >
                  新增线路
                </Button>,
              ]
            : []
        }
        request={async (params) => {
          const list = await getOperationLines({ includeDisabled: true });
          const keyword = String(params.keyword ?? '').trim().toLowerCase();
          const status = params.status as LineQuery['status'] | undefined;

          const filtered = list.filter((line) => {
            if (status === 'enabled' && !line.enabled) return false;
            if (status === 'disabled' && line.enabled) return false;
            if (!keyword) return true;
            return `${line.name} ${line.code} ${line.permissionCode}`
              .toLowerCase()
              .includes(keyword);
          });

          const current = Number(params.current) || 1;
          const pageSize = Number(params.pageSize) || 10;
          const start = (current - 1) * pageSize;

          return {
            data: filtered.slice(start, start + pageSize),
            total: filtered.length,
            success: true,
          };
        }}
      />

      <ModalForm<LineFormValues>
        key={`${modal.mode}-${modal.record?.id ?? 'new'}`}
        title={modal.mode === 'create' ? '新增线路' : `修改线路 · ${modal.record?.name ?? ''}`}
        open={modal.open}
        width={560}
        layout="vertical"
        initialValues={
          modal.mode === 'edit' && modal.record
            ? {
                name: modal.record.name,
                code: modal.record.code,
                sort: modal.record.sort,
                enabled: modal.record.enabled,
              }
            : { enabled: true }
        }
        modalProps={{ destroyOnHidden: true, maskClosable: false }}
        submitter={{
          searchConfig: {
            submitText: modal.mode === 'create' ? '创建线路' : '保存修改',
          },
          submitButtonProps: { loading: creating || updating },
        }}
        onOpenChange={(open) => {
          if (!open) {
            setModal((previous) => ({ ...previous, open: false }));
          }
        }}
        onFinish={handleFinish}
      >
        <ProFormText
          name="name"
          label="线路名称"
          placeholder="例如：日本-JPN"
          rules={[
            { required: true, message: '请输入线路名称' },
            { max: 64, message: '线路名称最多 64 个字符' },
          ]}
        />
        <ProFormText
          name="code"
          label="线路编码"
          placeholder="例如：japan-jpn"
          extra="用于生成权限标识；修改编码不会改变已经生成的权限标识"
          rules={[
            { required: true, message: '请输入线路编码' },
            {
              pattern: /^[a-zA-Z0-9][a-zA-Z0-9_-]{1,63}$/,
              message: '2-64 位字母、数字、下划线或连字符',
            },
          ]}
        />
        <ProFormDigit
          name="sort"
          label="排序"
          min={0}
          fieldProps={{ precision: 0 }}
          placeholder="数字越小越靠前"
        />
        <ProFormSwitch
          name="enabled"
          label="启用状态"
          checkedChildren="启用"
          unCheckedChildren="停用"
        />
      </ModalForm>
    </PageContainer>
  );
}
