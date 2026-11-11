import {
  CarOutlined,
  DeleteOutlined,
  DownloadOutlined,
  LockOutlined,
  PlusOutlined,
  SaveOutlined,
} from '@ant-design/icons';
import {
  Alert,
  App,
  Button,
  Input,
  InputNumber,
  Table,
  Tag,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useEffect, useMemo, useState } from 'react';
import {
  RESOURCE_STATUS_COLORS,
  type FleetRow,
  type OperationSummary,
  type TourGroup,
} from '../data';
import {
  MASKED_AMOUNT,
  displayMoney,
  downloadExcel,
} from '../utils';

interface FleetTabProps {
  tour: TourGroup;
  canViewAmount: boolean;
  canExport: boolean;
  onDone: (summary: OperationSummary) => void;
}

export default function FleetTab({
  tour,
  canViewAmount,
  canExport,
  onDone,
}: FleetTabProps) {
  const { message } = App.useApp();
  const [rows, setRows] = useState<FleetRow[]>([]);

  useEffect(() => {
    setRows(tour.fleet.map((row) => ({ ...row })));
  }, [tour.id]);

  const updateRow = (id: string, patch: Partial<FleetRow>) => {
    setRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, ...patch } : row)),
    );
  };

  const addVehicle = () => {
    setRows((prev) => [
      ...prev,
      {
        id: `fleet-${Date.now()}`,
        company: '',
        vehicle: '',
        seats: 0,
        dateRange: `${tour.departureDate.slice(5)} - ${tour.returnDate.slice(5)}`,
        days: tour.itinerary.length,
        amount: 0,
        remark: '',
        status: '待安排',
      },
    ]);
  };

  const removeVehicle = (id: string) => {
    setRows((prev) => prev.filter((row) => row.id !== id));
  };

  const summary = useMemo(() => {
    const amount = rows.reduce((sum, row) => sum + (row.amount || 0), 0);
    const days = rows.reduce((sum, row) => sum + (row.days || 0), 0);
    const pending = rows.filter((row) => row.status === '待安排').length;
    return { amount, days, pending };
  }, [rows]);

  const handleConfirm = () => {
    setRows((prev) => prev.map((row) => ({ ...row, status: '已安排' })));
    message.success(`已确认 ${rows.length} 台用车安排`);
    onDone({ state: 'done', text: `${rows.length}台已安排` });
  };

  const handleExport = async () => {
    try {
      await downloadExcel(
        `车队安排_${tour.tourNo}.xlsx`,
        '车队安排',
        ['车队公司', '车型', '座位数', '用车日期', '天数', '金额', '备注', '状态'],
        rows.map((row) => [
          row.company,
          row.vehicle,
          row.seats,
          row.dateRange,
          row.days,
          canViewAmount ? row.amount : MASKED_AMOUNT,
          row.remark,
          row.status,
        ]),
      );
      message.success('车队安排 Excel 已导出');
    } catch {
      message.error('Excel 导出失败，请稍后重试');
    }
  };

  const columns: ColumnsType<FleetRow> = [
    {
      title: '车队公司',
      dataIndex: 'company',
      width: 210,
      render: (value: string, row) => (
        <Input
          value={value}
          placeholder="填写车队 / 供应商名称"
          onChange={(event) => updateRow(row.id, { company: event.target.value })}
        />
      ),
    },
    {
      title: '车型',
      dataIndex: 'vehicle',
      width: 168,
      render: (value: string, row) => (
        <Input
          value={value}
          placeholder="如：38 座旅游大巴"
          onChange={(event) => updateRow(row.id, { vehicle: event.target.value })}
        />
      ),
    },
    {
      title: '座位',
      dataIndex: 'seats',
      width: 82,
      align: 'center',
      render: (value: number, row) => (
        <InputNumber
          min={0}
          value={value}
          precision={0}
          style={{ width: '100%' }}
          onChange={(next) => updateRow(row.id, { seats: Number(next) || 0 })}
        />
      ),
    },
    {
      title: '用车日期',
      dataIndex: 'dateRange',
      width: 170,
      render: (value: string, row) => (
        <Input
          value={value}
          placeholder="MM.DD-MM.DD"
          onChange={(event) =>
            updateRow(row.id, { dateRange: event.target.value })
          }
        />
      ),
    },
    {
      title: '天数',
      dataIndex: 'days',
      width: 80,
      align: 'center',
      render: (value: number, row) => (
        <InputNumber
          min={0}
          value={value}
          precision={0}
          style={{ width: '100%' }}
          onChange={(next) => updateRow(row.id, { days: Number(next) || 0 })}
        />
      ),
    },
    {
      title: '金额',
      dataIndex: 'amount',
      width: 128,
      align: 'right',
      render: (value: number, row) =>
        canViewAmount ? (
          <InputNumber
            min={0}
            value={value}
            prefix="¥"
            precision={2}
            style={{ width: '100%' }}
            onChange={(next) => updateRow(row.id, { amount: Number(next) || 0 })}
          />
        ) : (
          <span className="amount-masked">{MASKED_AMOUNT}</span>
        ),
    },
    {
      title: '用车要求 / 备注',
      dataIndex: 'remark',
      width: 260,
      render: (value: string, row) => (
        <Input
          value={value}
          placeholder="新车、司机餐补、行李空间等"
          onChange={(event) => updateRow(row.id, { remark: event.target.value })}
        />
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 88,
      align: 'center',
      render: (value: string) => (
        <Tag color={RESOURCE_STATUS_COLORS[value]} bordered={false}>
          {value}
        </Tag>
      ),
    },
    {
      title: '',
      key: 'action',
      width: 52,
      align: 'center',
      render: (_, row) => (
        <Button
          type="text"
          danger
          size="small"
          icon={<DeleteOutlined />}
          onClick={() => removeVehicle(row.id)}
        />
      ),
    },
  ];

  return (
    <div className="operation-tab fleet-tab">
      <div className="tab-heading">
        <div>
          <h3>
            车队安排
            <Tag color="geekblue" bordered={false}>
              交通资源
            </Tag>
          </h3>
          <p>
            记录用车日期、车型、座位数与特殊要求；同一车队可合并确认，导出后同步给财务。
          </p>
        </div>
        <div className="tab-heading__meta">
          <span>
            <CarOutlined /> {rows.length} 台车
          </span>
          <span>合计 {summary.days} 车天</span>
          {canViewAmount ? null : (
            <span className="amount-lock-hint">
              <LockOutlined /> 金额已隐藏
            </span>
          )}
        </div>
      </div>

      <Alert
        className="tab-alert"
        type={summary.pending ? 'warning' : 'success'}
        showIcon
        message={
          summary.pending
            ? `还有 ${summary.pending} 台车待确认`
            : '车队安排已齐全，可继续提交复核'
        }
        description="用车需求含司机房、餐补与行李空间时，请在备注中注明；车队确认后会汇总到操作中控台。"
      />

      <div className="resource-summary">
        <div>
          <span>车辆数量</span>
          <strong>{rows.length}</strong>
          <em>台</em>
        </div>
        <div>
          <span>用车天数</span>
          <strong>{summary.days}</strong>
          <em>车天</em>
        </div>
        <div>
          <span>预计车费</span>
          <strong>{displayMoney(summary.amount, canViewAmount)}</strong>
        </div>
        <div className="resource-summary__actions">
          <Button icon={<PlusOutlined />} onClick={addVehicle}>
            添加车辆
          </Button>
          {canExport ? (
            <Button icon={<DownloadOutlined />} onClick={handleExport}>
              导出 Excel
            </Button>
          ) : null}
          <Button
            type="primary"
            icon={<SaveOutlined />}
            disabled={!rows.length}
            onClick={handleConfirm}
          >
            确认车队安排
          </Button>
        </div>
      </div>

      <Table<FleetRow>
        className="operation-detail-table resource-table"
        rowKey="id"
        columns={columns}
        dataSource={rows}
        pagination={false}
        size="middle"
        scroll={{ x: 1250 }}
      />

      <div className="tab-footnote">
        <span>合计车费 {displayMoney(summary.amount, canViewAmount)}</span>
        <span>同一车队跨天用车可合并导出与请款</span>
      </div>
    </div>
  );
}
