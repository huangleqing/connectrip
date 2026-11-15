import { SaveOutlined } from '@ant-design/icons';
import { useRequest } from 'ahooks';
import {
  Alert,
  App,
  Button,
  Card,
  Col,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Space,
  Tag,
} from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { useEffect, useMemo, useState } from 'react';
import {
  createOperationTour,
  updateOperationTour,
  type CreateOperationTourParams,
  type UpdateOperationTourParams,
} from '@/services/operation';
import {
  STAGE_META,
  type ItineraryDay,
  type OperationLine,
  type TourGroup,
  type TourStage,
} from '../data';
import './index.less';

const { RangePicker } = DatePicker;

const STAGE_OPTIONS = Object.entries(STAGE_META).map(([value, meta]) => ({
  label: meta.label,
  value,
}));

export interface TeamFormProps {
  mode: 'create' | 'edit';
  tour?: TourGroup;
  lines: OperationLine[];
  linesLoading?: boolean;
  onSaved: (tour: TourGroup, mode: 'create' | 'edit') => void;
  onCancel: () => void;
}

interface TeamFormValues {
  lineId: number;
  name: string;
  stage: TourStage;
  dateRange: [Dayjs, Dayjs];
  peopleTotal: number;
  peopleAdults: number;
  peopleChildren: number;
  flightsOutbound?: string;
  flightsInbound?: string;
  source?: string;
  agency?: string;
  owner?: string;
  assistant?: string;
  itineraryText?: string;
  ticket?: string;
  visa?: string;
  scenic?: string;
  performance?: string;
  transport?: string;
}

function stageForDates(dates: [Dayjs, Dayjs] | null | undefined): TourStage | undefined {
  if (!dates?.[0] || !dates?.[1]) return undefined;
  const today = dayjs().startOf('day');
  const departure = dates[0].startOf('day');
  const returnDate = dates[1].startOf('day');
  if (departure.isSame(today, 'day')) return 'today_depart';
  if (departure.isSame(today.add(1, 'day'), 'day')) return 'tomorrow_depart';
  if (returnDate.isSame(today, 'day')) return 'today_return';
  if (returnDate.isSame(today.add(1, 'day'), 'day')) return 'tomorrow_return';
  return undefined;
}

function buildItinerary(
  dateRange: [Dayjs, Dayjs],
  text: string | undefined,
): ItineraryDay[] {
  const contents = (text ?? '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const totalDays = Math.max(1, dateRange[1].diff(dateRange[0], 'day') + 1);
  return Array.from({ length: totalDays }, (_, index) => {
    const date = dateRange[0].add(index, 'day');
    return {
      day: `D${index + 1}`,
      date: date.format('MM.DD'),
      content: contents[index] || '行程待补充',
    };
  });
}

function itineraryToText(itinerary: unknown) {
  if (!Array.isArray(itinerary)) return '';
  return itinerary
    .map((item) => {
      if (!item || typeof item !== 'object') return '';
      return String((item as { content?: unknown }).content ?? '');
    })
    .filter(Boolean)
    .join('\n');
}

function createInitialValues(lineId: number | undefined): TeamFormValues {
  return {
    lineId: lineId ?? 0,
    name: '',
    stage: 'today_depart',
    dateRange: [dayjs(), dayjs().add(4, 'day')],
    peopleTotal: 1,
    peopleAdults: 1,
    peopleChildren: 0,
  };
}

function tourToFormValues(tour: TourGroup): TeamFormValues {
  return {
    lineId: tour.lineId ?? tour.line?.id ?? 0,
    name: tour.name,
    stage: tour.stage,
    dateRange: [dayjs(tour.departureDate), dayjs(tour.returnDate)],
    flightsOutbound: tour.flights.outbound,
    flightsInbound: tour.flights.inbound,
    source: tour.source,
    agency: tour.agency,
    peopleTotal: tour.people.total,
    peopleAdults: tour.people.adults,
    peopleChildren: tour.people.children,
    owner: tour.owner,
    assistant: tour.assistant,
    itineraryText: itineraryToText(tour.itinerary),
    ticket: tour.ticket,
    visa: tour.visa,
    scenic: tour.scenic,
    performance: tour.performance,
    transport: tour.transport,
  };
}

function buildBasePayload(values: TeamFormValues) {
  return {
    lineId: values.lineId,
    name: values.name.trim(),
    stage: values.stage,
    departureDate: values.dateRange[0].format('YYYY-MM-DD'),
    returnDate: values.dateRange[1].format('YYYY-MM-DD'),
    flightsOutbound: values.flightsOutbound?.trim(),
    flightsInbound: values.flightsInbound?.trim(),
    source: values.source?.trim(),
    agency: values.agency?.trim(),
    peopleTotal: values.peopleTotal,
    peopleAdults: values.peopleAdults,
    peopleChildren: values.peopleChildren,
    owner: values.owner?.trim(),
    assistant: values.assistant?.trim(),
    itinerary: buildItinerary(values.dateRange, values.itineraryText),
    ticket: values.ticket?.trim(),
    visa: values.visa?.trim(),
    scenic: values.scenic?.trim(),
    performance: values.performance?.trim(),
    transport: values.transport?.trim(),
  };
}

export default function TeamForm({
  mode,
  tour,
  lines,
  linesLoading,
  onSaved,
  onCancel,
}: TeamFormProps) {
  const { message } = App.useApp();
  const [form] = Form.useForm<TeamFormValues>();
  const [createdTour, setCreatedTour] = useState<TourGroup>();
  const { runAsync: runCreate, loading: creating } = useRequest(createOperationTour, {
    manual: true,
  });
  const { runAsync: runUpdate, loading: updating } = useRequest(updateOperationTour, {
    manual: true,
  });

  const initialValues = useMemo(
    () =>
      mode === 'edit' && tour
        ? tourToFormValues(tour)
        : createInitialValues(lines[0]?.id),
    // 表单只在打开新增/编辑页签时挂载一次，之后由用户操作维护。
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useEffect(() => {
    if (mode !== 'create' || lines.length === 0) return;
    if (form.getFieldValue('lineId')) return;
    form.setFieldValue('lineId', lines[0].id);
  }, [form, lines, mode]);

  const resetForm = () => {
    setCreatedTour(undefined);
    form.resetFields();
    form.setFieldsValue(
      mode === 'edit' && tour
        ? tourToFormValues(tour)
        : createInitialValues(lines[0]?.id),
    );
  };

  const handleFinish = async (values: TeamFormValues) => {
    const basePayload = buildBasePayload(values);
    try {
      if (mode === 'create') {
        const created = await runCreate(
          basePayload as CreateOperationTourParams,
        );
        setCreatedTour(created);
        message.success(`团队「${created.name}」已创建`);
        onSaved(created, 'create');
        form.resetFields();
        form.setFieldsValue(createInitialValues(created.lineId));
      } else if (tour) {
        const updated = await runUpdate(
          tour.id,
          basePayload as UpdateOperationTourParams,
        );
        setCreatedTour(undefined);
        form.setFieldsValue(tourToFormValues(updated));
        message.success('团队信息已更新');
        onSaved(updated, 'edit');
      }
    } catch {
      // 错误提示由请求层统一处理
    }
  };

  const saving = creating || updating;
  const noLines = !linesLoading && lines.length === 0;

  return (
    <div className="team-form">
      <Card variant="borderless" className="team-form__card">
        <div className="team-form__heading">
          <div>
            <h2>
              {mode === 'create' ? '新增团队' : `编辑团队 · ${tour?.name ?? ''}`}
              <Tag color={mode === 'create' ? 'blue' : 'orange'} bordered={false}>
                {mode === 'create' ? '保存到 tour_groups' : '修改团队资料'}
              </Tag>
            </h2>
            <p>
              订单编号和团号由系统自动生成；保存后可切换到「列表」继续查看或编辑其他团队。
            </p>
          </div>
          <Button onClick={onCancel}>返回列表</Button>
        </div>

        {createdTour ? (
          <Alert
            type="success"
            showIcon
            closable
            className="team-form__alert"
            message={`团队「${createdTour.name}」已创建`}
            onClose={() => setCreatedTour(undefined)}
            description={
              <Space wrap>
                <span>
                  订单编号：{createdTour.orderNo} · 团号：{createdTour.tourNo}
                </span>
              </Space>
            }
          />
        ) : null}

        {noLines ? (
          <Alert
            type="warning"
            showIcon
            className="team-form__alert"
            message="暂无可创建团队的线路"
            description="请先在「线路管理」新增线路，或在角色管理中为当前账号分配线路权限。"
          />
        ) : null}

        <Form<TeamFormValues>
          form={form}
          layout="vertical"
          requiredMark={false}
          initialValues={initialValues}
          onFinish={handleFinish}
        >
          <div className="team-form__section">团队基础信息</div>
          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Form.Item
                name="lineId"
                label="所属线路"
                rules={[{ required: true, message: '请选择线路' }]}
              >
                <Select
                  showSearch
                  loading={linesLoading}
                  optionFilterProp="label"
                  placeholder="选择线路 / 国家"
                  options={lines.map((line) => ({
                    label: `${line.name}（${line.code}）`,
                    value: line.id,
                  }))}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                name="name"
                label="团队名称"
                rules={[
                  { required: true, message: '请输入团队名称' },
                  { max: 120, message: '团队名称最多 120 个字符' },
                ]}
              >
                <Input placeholder="如：日本东京大阪6日游" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                name="stage"
                label="团队状态"
                rules={[{ required: true, message: '请选择团队状态' }]}
              >
                <Select options={STAGE_OPTIONS} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                name="dateRange"
                label="出团 / 返程日期"
                rules={[{ required: true, message: '请选择出团日期' }]}
              >
                <RangePicker
                  style={{ width: '100%' }}
                  onChange={(dates) => {
                    const nextStage = stageForDates(
                      dates as [Dayjs, Dayjs] | null,
                    );
                    if (nextStage) {
                      form.setFieldValue('stage', nextStage);
                    }
                  }}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="source" label="客源地">
                <Input placeholder="如：日本" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="agency" label="组团社">
                <Input placeholder="如：日本樱花旅行社" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="owner" label="业务负责人">
                <Input placeholder="负责人姓名" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="assistant" label="助理员">
                <Input placeholder="助理姓名" />
              </Form.Item>
            </Col>
            <Col xs={8} md={4}>
              <Form.Item name="peopleTotal" label="总人数" rules={[{ required: true }]}>
                <InputNumber min={0} precision={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={8} md={4}>
              <Form.Item name="peopleAdults" label="大人" rules={[{ required: true }]}>
                <InputNumber min={0} precision={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={8} md={4}>
              <Form.Item name="peopleChildren" label="小孩" rules={[{ required: true }]}>
                <InputNumber min={0} precision={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="flightsOutbound" label="来程航班">
                <Input placeholder="如：东京-重庆，CAxxx，09:00/12:00" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="flightsInbound" label="回程航班">
                <Input placeholder="如：重庆-东京，CAxxx，14:00/18:00" />
              </Form.Item>
            </Col>
          </Row>

          <div className="team-form__section">行程安排</div>
          <Form.Item
            name="itineraryText"
            label="每日行程（每天一行，留空自动生成占位行程）"
          >
            <Input.TextArea
              rows={5}
              placeholder={'D1 抵达目的地，入住酒店\nD2 城市观光\nD3 返程'}
            />
          </Form.Item>

          <div className="team-form__section">其他操作说明</div>
          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Form.Item name="ticket" label="机票备注">
                <Input.TextArea rows={2} placeholder="出票要求、儿童票等" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="visa" label="签证备注">
                <Input.TextArea rows={2} placeholder="送签、团签等" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="scenic" label="景点备注">
                <Input.TextArea rows={2} placeholder="门票、索道等" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="performance" label="演出备注">
                <Input.TextArea rows={2} placeholder="场次、座位等" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="transport" label="区间交通备注">
                <Input.TextArea rows={2} placeholder="车次、时间等" />
              </Form.Item>
            </Col>
          </Row>

          <div className="team-form__actions">
            <Button
              type="primary"
              htmlType="submit"
              icon={<SaveOutlined />}
              loading={saving}
              disabled={mode === 'create' && !lines.length}
            >
              {mode === 'create' ? '保存团队' : '保存修改'}
            </Button>
            <Button onClick={resetForm}>重置</Button>
            <Button onClick={onCancel}>返回列表</Button>
          </div>
        </Form>
      </Card>
    </div>
  );
}
