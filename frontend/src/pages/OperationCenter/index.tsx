import {
  ApiOutlined,
  AuditOutlined,
  CheckCircleOutlined,
  ExportOutlined,
  GlobalOutlined,
  NodeIndexOutlined,
  SafetyCertificateOutlined,
  ScheduleOutlined,
} from '@ant-design/icons';
import { Access, useAccess } from '@umijs/max';
import { PageContainer } from '@ant-design/pro-components';
import { App, Button, Card, Col, Row, Tag, Timeline, Tooltip } from 'antd';
import { PERMISSIONS } from '@/constants/permissions';
import './index.less';

const ROADMAP = [
  {
    icon: <NodeIndexOutlined />,
    title: '操作任务',
    desc: '创建、分派与跟踪旅游订单相关操作任务',
    stage: '规划中',
  },
  {
    icon: <AuditOutlined />,
    title: '流程审批',
    desc: '为退款、改期等敏感操作接入审批流',
    stage: '规划中',
  },
  {
    icon: <ScheduleOutlined />,
    title: '操作日志',
    desc: '记录关键操作，支持审计与问题回溯',
    stage: '规划中',
  },
  {
    icon: <ExportOutlined />,
    title: '数据导出',
    desc: '按权限导出运营数据并生成归档文件',
    stage: '权限已预埋',
  },
];

const READY_ITEMS = [
  '菜单路由与页面容器已接入',
  'operation:view 菜单权限已生效',
  'operation:export 按钮权限已预埋',
  '页面已适配动态菜单与面包屑',
];

export default function OperationCenterPage() {
  const access = useAccess();
  const { message } = App.useApp();
  const canExport = access.hasPermission(PERMISSIONS.OPERATION_EXPORT);

  const handleExport = () => {
    message.info('操作中心业务模块尚未开放，当前仅完成权限预埋。');
  };

  return (
    <PageContainer
      title="操作中心"
      subTitle="旅游业务操作与流程的统一入口"
      extra={
        <Access
          accessible={canExport}
          fallback={
            <Tooltip title="当前账号缺少 operation:export 权限">
              <Button disabled icon={<ExportOutlined />}>
                导出操作数据
              </Button>
            </Tooltip>
          }
        >
          <Button type="primary" icon={<ExportOutlined />} onClick={handleExport}>
            导出操作数据
          </Button>
        </Access>
      }
    >
      <div className="operation-page">
        <section className="operation-hero">
          <div className="operation-hero__pattern" />
          <div className="operation-hero__content">
            <Tag className="operation-hero__tag" bordered={false}>
              业务模块预留
            </Tag>
            <h1>操作中心正在建设中</h1>
            <p>
              这里将承载旅游社的日常业务操作、流程审批与操作审计。当前已完成路由、菜单与按钮权限的基础接入，
              后续可按业务节奏逐步扩展。
            </p>
            <div className="operation-hero__meta">
              <span>
                <CheckCircleOutlined /> 页面路由已就绪
              </span>
              <span>
                <SafetyCertificateOutlined /> 权限标识已预埋
              </span>
              <span>
                <ApiOutlined /> 待接入业务 API
              </span>
            </div>
          </div>
          <div className="operation-hero__visual" aria-hidden="true">
            <div className="operation-hero__ring" />
            <div className="operation-hero__globe">
              <GlobalOutlined />
            </div>
            <div className="operation-hero__plane">GD</div>
          </div>
        </section>

        <Row gutter={[16, 16]} className="operation-cards">
          {ROADMAP.map((item, index) => (
            <Col xs={24} sm={12} xl={6} key={item.title}>
              <Card variant="borderless" className="operation-card gd-stat-card">
                <div className="operation-card__top">
                  <div className="operation-card__icon">{item.icon}</div>
                  <span className="operation-card__index">0{index + 1}</span>
                </div>
                <div className="operation-card__title">{item.title}</div>
                <div className="operation-card__desc">{item.desc}</div>
                <Tag
                  className="operation-card__stage"
                  color={item.stage === '权限已预埋' ? 'success' : 'default'}
                  bordered={false}
                >
                  {item.stage}
                </Tag>
              </Card>
            </Col>
          ))}
        </Row>

        <Row gutter={[16, 16]}>
          <Col xs={24} xl={14}>
            <Card
              variant="borderless"
              className="gd-table-card operation-panel"
              title="模块接入进度"
            >
              <Timeline
                items={[
                  {
                    color: 'green',
                    children: (
                      <div className="operation-timeline__item">
                        <strong>菜单与路由接入</strong>
                        <p>已配置 /operation-center 动态菜单，受 operation:view 控制。</p>
                      </div>
                    ),
                  },
                  {
                    color: 'green',
                    children: (
                      <div className="operation-timeline__item">
                        <strong>按钮权限预埋</strong>
                        <p>导出按钮使用 Access 组件校验 operation:export，超级管理员与运营专员可用。</p>
                      </div>
                    ),
                  },
                  {
                    color: 'blue',
                    children: (
                      <div className="operation-timeline__item">
                        <strong>业务接口对接</strong>
                        <p>待后端开放操作任务、审批流与日志相关接口后接入。</p>
                      </div>
                    ),
                  },
                  {
                    color: 'gray',
                    children: (
                      <div className="operation-timeline__item">
                        <strong>业务模块上线</strong>
                        <p>按订单、行程、客户等业务场景逐步扩展。</p>
                      </div>
                    ),
                  },
                ]}
              />
            </Card>
          </Col>
          <Col xs={24} xl={10}>
            <Card variant="borderless" className="gd-table-card operation-panel" title="已就绪能力">
              <div className="operation-ready">
                {READY_ITEMS.map((item) => (
                  <div className="operation-ready__item" key={item}>
                    <CheckCircleOutlined />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
              <div className="operation-hint">
                当前账号的导出权限：
                <Tag color={canExport ? 'success' : 'default'} bordered={false}>
                  {canExport ? '已授权' : '未授权'}
                </Tag>
                <div className="operation-hint__code">operation:export</div>
              </div>
            </Card>
          </Col>
        </Row>
      </div>
    </PageContainer>
  );
}
