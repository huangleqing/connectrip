import {
  DownloadOutlined,
  HomeOutlined,
  LockOutlined,
  SaveOutlined,
  WarningOutlined,
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
  type HotelRow,
  type OperationSummary,
  type TourGroup,
} from '../data';
import {
  MASKED_AMOUNT,
  displayMoney,
  downloadExcel,
} from '../utils';

interface HotelTabProps {
  tour: TourGroup;
  canViewAmount: boolean;
  canExport: boolean;
  onDone: (summary: OperationSummary) => void;
}

export default function HotelTab({
  tour,
  canViewAmount,
  canExport,
  onDone,
}: HotelTabProps) {
  const { message } = App.useApp();
  const [rows, setRows] = useState<HotelRow[]>([]);

  useEffect(() => {
    setRows(tour.hotels.map((row) => ({ ...row })));
  }, [tour.id]);

  const updateRow = (id: string, patch: Partial<HotelRow>) => {
    setRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, ...patch } : row)),
    );
  };

  const summary = useMemo(() => {
    const amount = rows.reduce((sum, row) => sum + (row.amount || 0), 0);
    const pending = rows.filter((row) => row.status === '待安排').length;
    return { amount, pending };
  }, [rows]);

  const handleConfirm = () => {
    setRows((prev) => prev.map((row) => ({ ...row, status: '已安排' })));
    message.success(`已确认 ${rows.length} 晚酒店安排`);
    onDone({ state: 'done', text: `${rows.length}晚已安排` });
  };

  const handleExport = async () => {
    try {
      await downloadExcel(
        `酒店安排_${tour.tourNo}.xlsx`,
        '酒店安排',
        ['天数', '日期', '酒店', '房型/房数', '单价', '金额', '备注', '状态'],
        rows.map((row) => [
          row.day,
          row.date,
          row.hotel,
          row.roomSummary,
          canViewAmount ? row.price : MASKED_AMOUNT,
          canViewAmount ? row.amount : MASKED_AMOUNT,
          row.remark,
          row.status,
        ]),
      );
      message.success('酒店安排 Excel 已导出');
    } catch {
      message.error('Excel 导出失败，请稍后重试');
    }
  };

  const columns: ColumnsType<HotelRow> = [
    {
      title: '日期',
      key: 'date',
      width: 96,
      render: (_, row) => (
        <div className="resource-date">
          <strong>{row.day}</strong>
          <span>{row.date}</span>
        </div>
      ),
    },
    {
      title: '入住酒店',
      dataIndex: 'hotel',
      width: 226,
      render: (value: string, row) => (
        <Input
          value={value}
          placeholder="填写酒店名称"
          onChange={(event) => updateRow(row.id, { hotel: event.target.value })}
        />
      ),
    },
    {
      title: '房型 / 房数',
      dataIndex: 'roomSummary',
      width: 174,
      render: (value: string) => <span className="muted-text">{value}</span>,
    },
    {
      title: '单价',
      dataIndex: 'price',
      width: 118,
      align: 'right',
      render: (value: number, row) =>
        canViewAmount ? (
          <InputNumber
            min={0}
            value={value}
            prefix="¥"
            precision={2}
            style={{ width: '100%' }}
            onChange={(next) => updateRow(row.id, { price: Number(next) || 0 })}
          />
        ) : (
          <span className="amount-masked">{MASKED_AMOUNT}</span>
        ),
    },
    {
      title: '金额',
      dataIndex: 'amount',
      width: 132,
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
      title: '备注',
      dataIndex: 'remark',
      width: 180,
      render: (value: string, row) => (
        <Input
          value={value}
          placeholder="房型、早餐、特殊要求"
          onChange={(event) => updateRow(row.id, { remark: event.target.value })}
        />
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 90,
      align: 'center',
      render: (value: string) => (
        <Tag color={RESOURCE_STATUS_COLORS[value]} bordered={false}>
          {value}
        </Tag>
      ),
    },
  ];

  return (
    <div className="operation-tab hotel-tab">
      <div className="tab-heading">
        <div>
          <h3>
            酒店安排
            <Tag color="blue" bordered={false}>
              资源预订
            </Tag>
          </h3>
          <p>
            按天确认酒店、房型与协议价；同一家酒店跨多天时自动合并导出，出团结束后
            2 个工作日锁定。
          </p>
        </div>
        <div className="tab-heading__meta">
          <span>
            <HomeOutlined /> {rows.length} 晚
          </span>
          <span>{tour.people.adults} 大 {tour.people.children} 小</span>
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
        icon={<WarningOutlined />}
        message={
          summary.pending
            ? `还有 ${summary.pending} 晚酒店待安排`
            : '酒店安排已齐全，可继续提交复核'
        }
        description="价格默认带出协议价，可手动覆盖；修改后会同步到操作中控台与财务对账。"
      />

      <div className="resource-summary">
        <div>
          <span>入住晚数</span>
          <strong>{rows.length}</strong>
          <em>晚</em>
        </div>
        <div>
          <span>预计房费</span>
          <strong>{displayMoney(summary.amount, canViewAmount)}</strong>
        </div>
        <div>
          <span>待确认</span>
          <strong className={summary.pending ? 'is-warning' : ''}>
            {summary.pending}
          </strong>
          <em>项</em>
        </div>
        <div className="resource-summary__actions">
          {canExport ? (
            <Button icon={<DownloadOutlined />} onClick={handleExport}>
              导出 Excel
            </Button>
          ) : null}
          <Button type="primary" icon={<SaveOutlined />} onClick={handleConfirm}>
            确认全部安排
          </Button>
        </div>
      </div>

      <Table<HotelRow>
        className="operation-detail-table resource-table"
        rowKey="id"
        columns={columns}
        dataSource={rows}
        pagination={false}
        size="middle"
        scroll={{ x: 1050 }}
      />

      <div className="tab-footnote">
        <span>合计房费 {displayMoney(summary.amount, canViewAmount)}</span>
        <span>出团结束后 2 个工作日内完成复核与请款</span>
      </div>
    </div>
  );
}
