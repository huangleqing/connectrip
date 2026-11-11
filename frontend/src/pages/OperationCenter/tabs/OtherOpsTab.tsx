import {
  ClockCircleOutlined,
  EnvironmentOutlined,
  IdcardOutlined,
  NodeIndexOutlined,
  ScheduleOutlined,
  StarOutlined,
} from '@ant-design/icons';
import { Alert, App, Button, Tag } from 'antd';
import type { ReactNode } from 'react';
import {
  OPERATION_STATE_META,
  type OperationKey,
  type OperationSummary,
  type TourGroup,
} from '../data';

type OtherOperationKey = Extract<
  OperationKey,
  'ticket' | 'visa' | 'scenic' | 'performance' | 'transport'
>;

interface OtherOperationCard {
  key: OtherOperationKey;
  title: string;
  icon: ReactNode;
  accent: string;
  hint: string;
  doneText: string;
}

const OTHER_OPERATIONS: OtherOperationCard[] = [
  {
    key: 'ticket',
    title: '机票',
    icon: <ScheduleOutlined />,
    accent: 'blue',
    hint: '出票需求、儿童/婴儿票、成本复核',
    doneText: '已出票',
  },
  {
    key: 'visa',
    title: '签证',
    icon: <IdcardOutlined />,
    accent: 'cyan',
    hint: '送签、出签、取签与交接记录',
    doneText: '已出签',
  },
  {
    key: 'scenic',
    title: '景点',
    icon: <EnvironmentOutlined />,
    accent: 'green',
    hint: '门票、索道、观光车等资源预订',
    doneText: '已确认',
  },
  {
    key: 'performance',
    title: '演出',
    icon: <StarOutlined />,
    accent: 'purple',
    hint: '场次确认、座位与票务交接',
    doneText: '已订',
  },
  {
    key: 'transport',
    title: '区间交通',
    icon: <NodeIndexOutlined />,
    accent: 'orange',
    hint: '城市间车次、座位与接驳安排',
    doneText: '已出票',
  },
];

interface OtherOpsTabProps {
  tour: TourGroup;
  onUpdate: (key: OperationKey, summary: OperationSummary) => void;
}

export default function OtherOpsTab({ tour, onUpdate }: OtherOpsTabProps) {
  const { message } = App.useApp();
  const pendingCount = OTHER_OPERATIONS.filter(
    (item) =>
      tour.operations[item.key].state === 'pending' ||
      tour.operations[item.key].state === 'processing',
  ).length;

  const handleDone = (item: OtherOperationCard) => {
    onUpdate(item.key, { state: 'done', text: item.doneText });
    message.success(`${item.title}已标记为完成`);
  };

  return (
    <div className="operation-tab other-ops-tab">
      <div className="tab-heading">
        <div>
          <h3>
            其他操作
            <Tag color="geekblue" bordered={false}>
              票务 / 资源
            </Tag>
          </h3>
          <p>
            统一跟进机票、签证、景点、演出与区间交通；完成状态会即时回写操作中控台，供业务与财务查看。
          </p>
        </div>
        <div className="tab-heading__meta">
          <span>
            <ClockCircleOutlined /> 待跟进 {pendingCount} 项
          </span>
          <span>团队 {tour.tourNo}</span>
        </div>
      </div>

      <Alert
        className="tab-alert"
        type={pendingCount ? 'warning' : 'success'}
        showIcon
        message={
          pendingCount
            ? `还有 ${pendingCount} 项票务 / 资源操作待跟进`
            : '所有票务与资源操作均已完成'
        }
        description="机票与签证的成本会进入财务对账；景点、演出和区间交通按实际出票 / 预订数量核算。"
      />

      <div className="other-ops-grid">
        {OTHER_OPERATIONS.map((item) => {
          const summary = tour.operations[item.key];
          const stateMeta = OPERATION_STATE_META[summary.state];
          const actionable =
            summary.state === 'pending' || summary.state === 'processing';
          return (
            <article
              className={`other-op-card other-op-card--${item.accent}`}
              key={item.key}
            >
              <div className="other-op-card__head">
                <span className="other-op-card__icon">{item.icon}</span>
                <div>
                  <h4>{item.title}</h4>
                  <em>{item.hint}</em>
                </div>
                <Tag color={stateMeta.color} bordered={false}>
                  {summary.text}
                </Tag>
              </div>
              <div className="other-op-card__body">
                <span>安排说明</span>
                <p>{tour[item.key]}</p>
              </div>
              <div className="other-op-card__footer">
                <span>
                  当前状态
                  <Tag color={stateMeta.color} bordered={false}>
                    {stateMeta.label}
                  </Tag>
                </span>
                {actionable ? (
                  <Button
                    size="small"
                    type="primary"
                    ghost
                    onClick={() => handleDone(item)}
                  >
                    标记已完成
                  </Button>
                ) : (
                  <span className="other-op-card__finished">
                    {summary.state === 'not_required' ? '无需安排' : '已完成'}
                  </span>
                )}
              </div>
            </article>
          );
        })}
      </div>

      <div className="tab-footnote">
        <span>状态以操作中控台为准</span>
        <span>所有变更会保留操作记录，便于后续审计</span>
      </div>
    </div>
  );
}
