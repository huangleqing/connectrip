import {
  ArrowRightOutlined,
  CheckCircleFilled,
  ClockCircleOutlined,
  CompassOutlined,
  GlobalOutlined,
  SafetyCertificateOutlined,
  SettingOutlined,
  TeamOutlined,
  ThunderboltOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Access, history, useAccess, useModel } from '@umijs/max';
import { useRequest } from 'ahooks';
import { Button, Card, Col, Empty, List, Row, Skeleton, Tag, Tooltip } from 'antd';
import dayjs from 'dayjs';
import type { ReactNode } from 'react';
import UserAvatar from '@/components/UserAvatar';
import { PERMISSIONS, PERMISSION_LABELS } from '@/constants/permissions';
import { getDashboardSummary } from '@/services/dashboard';
import type { RoleBrief } from '@/types';
import './index.less';

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 6) return '夜深了';
  if (hour < 9) return '早上好';
  if (hour < 12) return '上午好';
  if (hour < 14) return '中午好';
  if (hour < 18) return '下午好';
  return '晚上好';
}

interface QuickAction {
  key: string;
  title: string;
  description: string;
  icon: ReactNode;
  permission: string;
  path: string;
  tone: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    key: 'operation',
    title: '操作中心',
    description: '业务操作与流程任务入口',
    icon: <GlobalOutlined />,
    permission: PERMISSIONS.OPERATION_VIEW,
    path: '/operation-center',
    tone: 'cyan',
  },
  {
    key: 'users',
    title: '用户管理',
    description: '登录账号、状态与角色归属',
    icon: <UserOutlined />,
    permission: PERMISSIONS.USER_VIEW,
    path: '/system/users',
    tone: 'blue',
  },
  {
    key: 'roles',
    title: '角色管理',
    description: '角色权限与成员范围配置',
    icon: <TeamOutlined />,
    permission: PERMISSIONS.ROLE_VIEW,
    path: '/system/roles',
    tone: 'violet',
  },
];

function RoleTags({ roles }: { roles: RoleBrief[] }) {
  if (!roles?.length) return <span className="gd-muted">未分配角色</span>;

  return (
    <span className="gd-inline-tags">
      {roles.map((role) => (
        <Tag key={role.id} color={role.code === 'super_admin' ? 'gold' : 'blue'} bordered={false}>
          {role.name}
        </Tag>
      ))}
    </span>
  );
}

export default function DashboardPage() {
  const access = useAccess();
  const { initialState } = useModel('@@initialState');
  const currentUser = initialState?.currentUser;

  const { data: summary, loading } = useRequest(getDashboardSummary);

  const canViewUsers = access.hasPermission(PERMISSIONS.USER_VIEW);
  const visibleActions = QUICK_ACTIONS.filter((action) => access.hasPermission(action.permission));
  const permissionCount = currentUser?.permissions?.length ?? 0;

  const statCards = [
    {
      key: 'users',
      title: '系统用户',
      value: summary?.userCount ?? 0,
      hint: `其中 ${summary?.activeUserCount ?? 0} 个正常账号`,
      icon: <UserOutlined />,
      tone: 'blue',
    },
    {
      key: 'roles',
      title: '角色数量',
      value: summary?.roleCount ?? 0,
      hint: '按职责划分权限边界',
      icon: <TeamOutlined />,
      tone: 'violet',
    },
    {
      key: 'operations',
      title: '今日操作',
      value: summary?.todayOperations ?? 0,
      hint: '来自操作中心与系统管理',
      icon: <ThunderboltOutlined />,
      tone: 'orange',
    },
    {
      key: 'permissions',
      title: '权限项',
      value: summary?.permissionCount ?? 0,
      hint: '菜单级 + 按钮级权限标识',
      icon: <SafetyCertificateOutlined />,
      tone: 'green',
    },
  ];

  return (
    <div className="dashboard-page">
      <section className="dash-hero">
        <div className="dash-hero__grid" />
        <div className="dash-hero__content">
          <div className="dash-hero__eyebrow">
            <span className="dash-hero__status-dot" />
            系统运行正常 · {dayjs().format('YYYY年M月D日 dddd')}
          </div>
          <h1>
            {getGreeting()}，{currentUser?.nickname || currentUser?.username}
          </h1>
          <p>欢迎回到 GD旅游社管理系统。菜单与操作均已按你的角色权限过滤。</p>
          <div className="dash-hero__meta">
            <span className="dash-hero__meta-label">当前角色</span>
            <RoleTags roles={currentUser?.roles ?? []} />
            <span className="dash-hero__divider" />
            <span className="dash-hero__meta-label">权限</span>
            <span className="dash-hero__permission-count">{permissionCount} 项</span>
          </div>
          <Access accessible={access.hasPermission(PERMISSIONS.OPERATION_VIEW)} fallback={null}>
            <Button
              type="primary"
              size="large"
              className="dash-hero__button"
              onClick={() => history.push('/operation-center')}
            >
              进入操作中心 <ArrowRightOutlined />
            </Button>
          </Access>
        </div>

        <div className="dash-hero__visual" aria-hidden="true">
          <div className="dash-hero__ring dash-hero__ring--outer" />
          <div className="dash-hero__ring dash-hero__ring--inner" />
          <div className="dash-hero__compass">
            <CompassOutlined />
          </div>
          <div className="dash-float dash-float--top">
            <TeamOutlined /> {summary?.roleCount ?? 0} 个角色
          </div>
          <div className="dash-float dash-float--bottom">
            <CheckCircleFilled /> {summary?.activeUserCount ?? 0} 个活跃账号
          </div>
          <div className="dash-hero__dot dash-hero__dot--one" />
          <div className="dash-hero__dot dash-hero__dot--two" />
          <div className="dash-hero__dot dash-hero__dot--three" />
        </div>
      </section>

      <Row gutter={[16, 16]} className="dash-stats">
        {statCards.map((stat) => (
          <Col xs={24} sm={12} xl={6} key={stat.key}>
            <Card className="gd-stat-card" variant="borderless">
              <Skeleton loading={loading} active paragraph={{ rows: 1 }} title={false}>
                <div className="dash-stat">
                  <div className={`dash-stat__icon dash-stat__icon--${stat.tone}`}>{stat.icon}</div>
                  <div className="dash-stat__body">
                    <div className="dash-stat__title">{stat.title}</div>
                    <div className="dash-stat__value">{stat.value.toLocaleString()}</div>
                    <div className="dash-stat__hint">{stat.hint}</div>
                  </div>
                </div>
              </Skeleton>
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]} className="dash-main">
        {canViewUsers && (
          <Col xs={24} xl={16}>
            <Card
              variant="borderless"
              className="gd-table-card dash-panel"
              title={
                <span className="dash-panel__title">
                  <ClockCircleOutlined /> 最近登录
                </span>
              }
              extra={
                <Access accessible={access.hasPermission(PERMISSIONS.USER_VIEW)} fallback={null}>
                  <Button type="link" size="small" onClick={() => history.push('/system/users')}>
                    全部用户 <ArrowRightOutlined />
                  </Button>
                </Access>
              }
            >
              {loading ? (
                <Skeleton active paragraph={{ rows: 6 }} />
              ) : summary?.recentUsers?.length ? (
              <List
                className="dash-login-list"
                dataSource={summary.recentUsers}
                renderItem={(user) => (
                  <List.Item>
                    <div className="dash-login-item">
                      <UserAvatar name={user.nickname} size={38} />
                      <div className="dash-login-item__main">
                        <div className="dash-login-item__name">
                          {user.nickname}
                          <span>@{user.username}</span>
                        </div>
                        <div className="dash-login-item__roles">
                          <RoleTags roles={user.roles} />
                        </div>
                      </div>
                      <div className="dash-login-item__meta">
                        <span className="dash-login-item__time">
                          {user.lastLoginAt ? dayjs(user.lastLoginAt).format('MM-DD HH:mm') : '从未登录'}
                        </span>
                        <Tag color={user.status === 'active' ? 'success' : 'default'} bordered={false}>
                          {user.status === 'active' ? '正常' : '停用'}
                        </Tag>
                      </div>
                    </div>
                  </List.Item>
                )}
              />
            ) : (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无登录记录" />
            )}
            </Card>
          </Col>
        )}

        <Col xs={24} xl={canViewUsers ? 8 : 24}>
          <div className={`dash-side${canViewUsers ? '' : ' dash-side--wide'}`}>
            {visibleActions.length > 0 && (
              <Card
                variant="borderless"
                className="gd-table-card dash-panel"
                title={
                  <span className="dash-panel__title">
                    <CompassOutlined /> 快捷入口
                  </span>
                }
              >
                <div className="dash-actions">
                  {QUICK_ACTIONS.map((action) => (
                    <Access
                      key={action.key}
                      accessible={access.hasPermission(action.permission)}
                      fallback={null}
                    >
                      <button
                        type="button"
                        className="dash-action"
                        onClick={() => history.push(action.path)}
                      >
                        <span className={`dash-action__icon dash-action__icon--${action.tone}`}>
                          {action.icon}
                        </span>
                        <span className="dash-action__text">
                          <strong>{action.title}</strong>
                          <span>{action.description}</span>
                        </span>
                        <ArrowRightOutlined className="dash-action__arrow" />
                      </button>
                    </Access>
                  ))}
                </div>
              </Card>
            )}

            {permissionCount > 0 && (
              <Card
                variant="borderless"
                className="gd-table-card dash-panel"
                title={
                  <span className="dash-panel__title">
                    <SafetyCertificateOutlined /> 我的权限
                  </span>
                }
                extra={
                  <Tooltip title="权限由后端在登录时下发，并随角色调整实时刷新">
                    <Tag color={currentUser?.isSuperAdmin ? 'gold' : 'blue'} bordered={false}>
                      {currentUser?.isSuperAdmin ? '超级管理员' : '角色授权'}
                    </Tag>
                  </Tooltip>
                }
              >
                <div className="dash-permissions">
                  {currentUser?.permissions.map((code) => (
                    <Tag key={code} className="dash-permission-tag" bordered={false}>
                      {PERMISSION_LABELS[code] || code}
                    </Tag>
                  ))}
                </div>
              </Card>
            )}

            {visibleActions.length === 0 && permissionCount === 0 && (
              <Card variant="borderless" className="gd-table-card dash-restricted">
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="当前角色暂无业务权限"
                >
                  <p className="dash-restricted__hint">
                    你的账号目前只能访问工作台。请联系超级管理员在「角色管理」中分配菜单与按钮权限。
                  </p>
                </Empty>
              </Card>
            )}

            <Card variant="borderless" className="dash-system-card">
              <div className="dash-system">
                <div className="dash-system__icon">
                  <SettingOutlined />
                </div>
                <div>
                  <div className="dash-system__title">
                    系统服务正常
                    <span className="dash-system__dot" />
                  </div>
                  <div className="dash-system__desc">
                    Umi 4 · Ant Design Pro · JWT / RBAC
                    <br />
                    后端：NestJS + Prisma + MySQL
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </Col>
      </Row>
    </div>
  );
}
