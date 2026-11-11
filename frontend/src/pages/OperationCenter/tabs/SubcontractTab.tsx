import {
  DeleteOutlined,
  LockOutlined,
  PlusOutlined,
  SendOutlined,
  ShopOutlined,
} from '@ant-design/icons';
import {
  App,
  Button,
  Col,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Table,
  Tag,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useEffect, useMemo, useState } from 'react';
import type {
  OperationSummary,
  SubcontractItem,
  TourGroup,
} from '../data';
import { MASKED_AMOUNT, displayMoney } from '../utils';

interface SubcontractTabProps {
  tour: TourGroup;
  canViewAmount: boolean;
  onDone: (summary: OperationSummary) => void;
}

interface SubcontractFormValues {
  agency: string;
  region: string;
  contact: string;
  phone: string;
  fax?: string;
  shopName: string;
  payment: string;
  pickup: string;
  notice: string;
  transport: string;
}

const AGENCY_OPTIONS = [
  '老挝高登',
  '重庆海外旅业（集团）有限公司',
  '重庆中国青年旅行社',
  '重庆渝之旅国际旅行社',
  '泰国金旅',
  '马来西亚阳光假期',
];

export default function SubcontractTab({
  tour,
  canViewAmount,
  onDone,
}: SubcontractTabProps) {
  const { message } = App.useApp();
  const [form] = Form.useForm<SubcontractFormValues>();
  const [items, setItems] = useState<SubcontractItem[]>([]);

  useEffect(() => {
    form.setFieldsValue({
      agency: tour.subcontract.agency,
      region: tour.subcontract.region,
      contact: tour.subcontract.contact,
      phone: tour.subcontract.phone,
      fax: tour.subcontract.fax,
      shopName: tour.subcontract.shopName,
      payment: tour.subcontract.payment,
      pickup: tour.subcontract.pickup,
      notice: tour.subcontract.notice,
      transport: tour.subcontract.transport,
    });
    setItems(tour.subcontract.items.map((item) => ({ ...item })));
  }, [tour.id]);

  const updateItem = (id: string, patch: Partial<SubcontractItem>) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
  };

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: `item-${Date.now()}`,
        name: '新增项目',
        count: 1,
        unitPrice: 0,
        remark: '',
      },
    ]);
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const totals = useMemo(() => {
    const count = items.reduce((sum, item) => sum + (item.count || 0), 0);
    const amount = items.reduce(
      (sum, item) => sum + (item.count || 0) * (item.unitPrice || 0),
      0,
    );
    return { count, amount };
  }, [items]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      message.success(`地接安排已提交给 ${values.agency}`);
      onDone({ state: 'done', text: '已安排' });
    } catch {
      // 表单校验提示由 Ant Design 展示
    }
  };

  const itemColumns: ColumnsType<SubcontractItem> = [
    {
      title: '项目',
      dataIndex: 'name',
      width: 180,
      render: (value: string, record) => (
        <Input
          value={value}
          placeholder="如：大人 / 小孩 / 全陪"
          onChange={(event) => updateItem(record.id, { name: event.target.value })}
        />
      ),
    },
    {
      title: '项数',
      dataIndex: 'count',
      width: 120,
      render: (value: number, record) => (
        <InputNumber
          min={0}
          value={value}
          precision={0}
          style={{ width: '100%' }}
          onChange={(next) => updateItem(record.id, { count: Number(next) || 0 })}
        />
      ),
    },
    {
      title: '单价',
      dataIndex: 'unitPrice',
      width: 150,
      render: (value: number, record) =>
        canViewAmount ? (
          <InputNumber
            min={0}
            value={value}
            precision={2}
            prefix="¥"
            style={{ width: '100%' }}
            onChange={(next) =>
              updateItem(record.id, { unitPrice: Number(next) || 0 })
            }
          />
        ) : (
          <span className="amount-masked">{MASKED_AMOUNT}</span>
        ),
    },
    {
      title: '项目备注',
      dataIndex: 'remark',
      render: (value: string, record) => (
        <Input
          value={value}
          placeholder="特殊要求、房差等"
          onChange={(event) => updateItem(record.id, { remark: event.target.value })}
        />
      ),
    },
    {
      title: '',
      key: 'action',
      width: 52,
      align: 'center',
      render: (_, record) => (
        <Button
          type="text"
          danger
          size="small"
          icon={<DeleteOutlined />}
          disabled={items.length <= 1}
          onClick={() => removeItem(record.id)}
        />
      ),
    },
  ];

  return (
    <div className="operation-tab subcontract-tab">
      <div className="tab-heading">
        <div>
          <h3>
            转包地接
            <Tag color="orange" bordered={false}>
              成本安排
            </Tag>
          </h3>
          <p>
            确认地接社、联系人及项目成本，提交后同步到操作中控台，供业务和财务复核。
          </p>
        </div>
        <div className="tab-heading__meta">
          <span>
            <ShopOutlined /> {tour.tourNo}
          </span>
          <span>团队人数 {tour.people.total} 人</span>
          {canViewAmount ? null : (
            <span className="amount-lock-hint">
              <LockOutlined /> 金额已隐藏
            </span>
          )}
        </div>
      </div>

      <Form<SubcontractFormValues>
        form={form}
        layout="vertical"
        className="subcontract-form"
        requiredMark={false}
      >
        <div className="form-section-title">地接社信息</div>
        <Row gutter={16}>
          <Col xs={24} md={8}>
            <Form.Item
              label="地接社"
              name="agency"
              rules={[{ required: true, message: '请选择地接社' }]}
            >
              <Select
                showSearch
                options={Array.from(
                  new Set([tour.agency, ...AGENCY_OPTIONS]),
                ).map((agency) => ({ label: agency, value: agency }))}
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item label="联系人" name="contact">
              <Input placeholder="地接联系人姓名" />
            </Form.Item>
          </Col>
          <Col xs={12} md={4}>
            <Form.Item label="电话" name="phone">
              <Input placeholder="联系电话" />
            </Form.Item>
          </Col>
          <Col xs={12} md={4}>
            <Form.Item label="传真" name="fax">
              <Input placeholder="选填" />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item label="门市名称" name="shopName">
              <Input placeholder="地接社门市 / 公司全称" />
            </Form.Item>
          </Col>
          <Col xs={12} md={4}>
            <Form.Item label="地区" name="region">
              <Input placeholder="如：重庆" />
            </Form.Item>
          </Col>
          <Col xs={12} md={4}>
            <Form.Item label="付款方式" name="payment">
              <Select
                options={['默认付款', '现结', '月结', '预付'].map((value) => ({
                  label: value,
                  value,
                }))}
              />
            </Form.Item>
          </Col>
        </Row>

        <div className="form-section-title form-section-title--row">
          <span>地接项目</span>
          <Button icon={<PlusOutlined />} size="small" onClick={addItem}>
            添加项目
          </Button>
        </div>

        <Table<SubcontractItem>
          className="operation-detail-table editable-table"
          rowKey="id"
          columns={itemColumns}
          dataSource={items}
          pagination={false}
          size="small"
          scroll={{ x: 760 }}
        />

        <div className="subcontract-totals">
          <span>
            合计项数 <strong>{totals.count}</strong>
          </span>
          <span>
            预计成本{' '}
            <strong>{displayMoney(totals.amount, canViewAmount)}</strong>
          </span>
          <em>实际金额以财务对账为准</em>
        </div>

        <div className="form-section-title">接团信息</div>
        <Row gutter={16}>
          <Col xs={24} md={8}>
            <Form.Item label="接站举牌" name="pickup">
              <Input.TextArea rows={3} placeholder="如：接 15 位贵宾" />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item label="接团注意" name="notice">
              <Input.TextArea rows={3} placeholder="饮食禁忌、房型要求等" />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item label="交通信息" name="transport">
              <Input.TextArea rows={3} placeholder="航班、车次及接送时间" />
            </Form.Item>
          </Col>
        </Row>
      </Form>

      <div className="tab-submit-bar">
        <div>
          <span>提交后状态变为「已安排」</span>
          <em>如需调整项目，可在出团前随时修改并重新提交</em>
        </div>
        <Button type="primary" icon={<SendOutlined />} onClick={handleSubmit}>
          提交地接安排
        </Button>
      </div>
    </div>
  );
}
