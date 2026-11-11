import {
  CoffeeOutlined,
  DownloadOutlined,
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
  type OperationSummary,
  type RestaurantRow,
  type TourGroup,
} from '../data';
import {
  MASKED_AMOUNT,
  displayMoney,
  downloadExcel,
} from '../utils';

interface RestaurantTabProps {
  tour: TourGroup;
  canViewAmount: boolean;
  canExport: boolean;
  onDone: (summary: OperationSummary) => void;
}

const MEAL_COLORS: Record<RestaurantRow['meal'], string> = {
  早: 'gold',
  中: 'blue',
  晚: 'purple',
};

export default function RestaurantTab({
  tour,
  canViewAmount,
  canExport,
  onDone,
}: RestaurantTabProps) {
  const { message } = App.useApp();
  const [rows, setRows] = useState<RestaurantRow[]>([]);

  useEffect(() => {
    setRows(tour.restaurants.map((row) => ({ ...row })));
  }, [tour.id]);

  const updateRow = (id: string, patch: Partial<RestaurantRow>) => {
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
    message.success(`已确认 ${rows.length} 餐的餐厅安排`);
    onDone({ state: 'done', text: `${rows.length}餐已安排` });
  };

  const handleExport = async () => {
    try {
      await downloadExcel(
        `餐厅安排_${tour.tourNo}.xlsx`,
        '餐厅安排',
        [
          '天数',
          '日期',
          '餐次',
          '餐厅',
          '电话',
          '餐标',
          '司导餐数',
          '用餐详情',
          '金额',
          '备注',
          '状态',
        ],
        rows.map((row) => [
          row.day,
          row.date,
          row.meal,
          row.restaurant,
          row.phone,
          canViewAmount ? row.standard : MASKED_AMOUNT,
          row.staffCount,
          row.details,
          canViewAmount ? row.amount : MASKED_AMOUNT,
          row.remark,
          row.status,
        ]),
      );
      message.success('餐厅安排 Excel 已导出');
    } catch {
      message.error('Excel 导出失败，请稍后重试');
    }
  };

  const columns: ColumnsType<RestaurantRow> = [
    {
      title: '日期',
      key: 'date',
      width: 88,
      fixed: 'left',
      render: (_, row) => (
        <div className="resource-date">
          <strong>{row.day}</strong>
          <span>{row.date}</span>
        </div>
      ),
    },
    {
      title: '餐次',
      dataIndex: 'meal',
      width: 70,
      align: 'center',
      render: (value: RestaurantRow['meal']) => (
        <Tag color={MEAL_COLORS[value]} bordered={false}>
          {value}餐
        </Tag>
      ),
    },
    {
      title: '餐厅',
      dataIndex: 'restaurant',
      width: 178,
      render: (value: string, row) => (
        <Input
          value={value}
          placeholder="填写餐厅名称"
          onChange={(event) =>
            updateRow(row.id, { restaurant: event.target.value })
          }
        />
      ),
    },
    {
      title: '电话',
      dataIndex: 'phone',
      width: 128,
      render: (value: string, row) => (
        <Input
          value={value}
          placeholder="餐厅电话"
          onChange={(event) => updateRow(row.id, { phone: event.target.value })}
        />
      ),
    },
    {
      title: '餐标',
      dataIndex: 'standard',
      width: 92,
      align: 'right',
      render: (value: number, row) =>
        canViewAmount ? (
          <InputNumber
            min={0}
            value={value}
            prefix="¥"
            precision={0}
            style={{ width: '100%' }}
            onChange={(next) => updateRow(row.id, { standard: Number(next) || 0 })}
          />
        ) : (
          <span className="amount-masked">{MASKED_AMOUNT}</span>
        ),
    },
    {
      title: '司导餐',
      dataIndex: 'staffCount',
      width: 82,
      align: 'center',
      render: (value: number, row) => (
        <InputNumber
          min={0}
          value={value}
          precision={0}
          style={{ width: '100%' }}
          onChange={(next) =>
            updateRow(row.id, { staffCount: Number(next) || 0 })
          }
        />
      ),
    },
    {
      title: '用餐详情',
      dataIndex: 'details',
      width: 160,
      render: (value: string, row) => (
        <Input
          value={value}
          placeholder="桌数、忌口等"
          onChange={(event) => updateRow(row.id, { details: event.target.value })}
        />
      ),
    },
    {
      title: '金额',
      dataIndex: 'amount',
      width: 116,
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
      width: 196,
      render: (value: string, row) => (
        <Input
          value={value}
          placeholder="忌口、包房等要求"
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
  ];

  return (
    <div className="operation-tab restaurant-tab">
      <div className="tab-heading">
        <div>
          <h3>
            餐厅安排
            <Tag color="gold" bordered={false}>
              用餐预订
            </Tag>
          </h3>
          <p>
            按行程逐日确认早餐、午餐与晚餐；同一餐厅跨天使用时合并导出，并与财务请款联动。
          </p>
        </div>
        <div className="tab-heading__meta">
          <span>
            <CoffeeOutlined /> {rows.length} 餐
          </span>
          <span>{tour.people.total} 位客人</span>
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
            ? `还有 ${summary.pending} 餐待安排`
            : '餐厅安排已齐全，可继续提交复核'
        }
        description="早餐通常由酒店提供，午餐与晚餐需确认餐厅、餐标、桌数及司导餐补；特殊忌口会同步到餐厅安排单。"
      />

      <div className="resource-summary">
        <div>
          <span>用餐总数</span>
          <strong>{rows.length}</strong>
          <em>餐</em>
        </div>
        <div>
          <span>预计餐费</span>
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

      <Table<RestaurantRow>
        className="operation-detail-table resource-table"
        rowKey="id"
        columns={columns}
        dataSource={rows}
        pagination={false}
        size="middle"
        scroll={{ x: 1280 }}
      />

      <div className="tab-footnote">
        <span>合计餐费 {displayMoney(summary.amount, canViewAmount)}</span>
        <span>餐厅变更将同步提醒业务负责人与销售</span>
      </div>
    </div>
  );
}
