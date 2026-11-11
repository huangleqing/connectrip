import {
  ApartmentOutlined,
  LockOutlined,
  SafetyCertificateOutlined,
  ThunderboltOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { ProForm, ProFormText, type ProFormInstance } from '@ant-design/pro-components';
import { history, useModel } from '@umijs/max';
import { useRequest } from 'ahooks';
import { App, Tag } from 'antd';
import { useEffect, useRef } from 'react';
import { getCurrentUser, login } from '@/services/auth';
import type { InitialState, LoginParams } from '@/types';
import { AUTH_NOTICE_KEY, getSafeRedirect, setToken } from '@/utils/auth';
import './index.less';

const FEATURES = [
  {
    icon: <SafetyCertificateOutlined />,
    title: '权限精细到按钮',
    desc: '基于角色的访问控制，菜单与操作双重校验',
  },
  {
    icon: <ApartmentOutlined />,
    title: '动态菜单',
    desc: '登录后按权限实时生成，未授权入口自动隐藏',
  },
  {
    icon: <ThunderboltOutlined />,
    title: 'JWT 安全鉴权',
    desc: '统一请求封装，登录态失效自动回跳',
  },
];

const DEMO_ACCOUNTS = [
  {
    role: '超级管理员',
    username: 'admin',
    password: 'admin123',
    color: 'gold',
    description: '全量菜单与按钮权限',
  },
  {
    role: '运营专员',
    username: 'operator',
    password: 'operator123',
    color: 'blue',
    description: '操作中心与只读用户列表',
  },
  {
    role: '只读访客',
    username: 'viewer',
    password: 'viewer123',
    color: 'default',
    description: '仅可访问工作台',
  },
];

function resolveRedirect() {
  const redirect = new URLSearchParams(window.location.search).get('redirect');
  return getSafeRedirect(redirect);
}

export default function LoginPage() {
  const { message } = App.useApp();
  const { initialState, setInitialState } = useModel('@@initialState');
  const formRef = useRef<ProFormInstance<LoginParams>>();

  const { runAsync: submitLogin, loading } = useRequest(login, { manual: true });

  useEffect(() => {
    if (initialState?.currentUser) {
      history.replace(resolveRedirect());
    }
  }, [initialState?.currentUser]);

  useEffect(() => {
    const notice = sessionStorage.getItem(AUTH_NOTICE_KEY);
    if (notice) {
      sessionStorage.removeItem(AUTH_NOTICE_KEY);
      message.warning(notice);
    }
  }, [message]);

  const handleFinish = async (values: LoginParams) => {
    try {
      const result = await submitLogin(values);
      setToken(result.token);
      await setInitialState((prev: InitialState | undefined) => ({
        currentUser: result.user,
        permissions: result.user.permissions,
        fetchUserInfo: prev?.fetchUserInfo ?? getCurrentUser,
      }));
      message.success(`欢迎回来，${result.user.nickname}`);
      history.replace(resolveRedirect());
    } catch {
      // 错误提示由 request 拦截器统一展示
    }
  };

  const fillDemoAccount = (account: (typeof DEMO_ACCOUNTS)[number]) => {
    formRef.current?.setFieldsValue({
      username: account.username,
      password: account.password,
    });
  };

  return (
    <div className="login-page">
      <div className="login-page__glow login-page__glow--one" />
      <div className="login-page__glow login-page__glow--two" />

      <div className="login-shell">
        <section className="login-story">
          <div className="login-story__grid" />
          <div className="login-story__orbit login-story__orbit--one" />
          <div className="login-story__orbit login-story__orbit--two" />

          <div className="login-story__brand">
            <img src="/logo.svg" width={44} height={44} alt="GD旅游社" />
            <div>
              <strong>GD TRAVEL</strong>
              <span>旅游社管理系统</span>
            </div>
          </div>

          <div className="login-story__content">
            <div className="login-story__eyebrow">TRAVEL OPERATIONS · RBAC</div>
            <h1>
              让每一段旅程，
              <br />
              都被妥善管理。
            </h1>
            <p>面向旅游社的账号、角色与权限中台，让团队协作清晰、可控、高效。</p>

            <div className="login-story__features">
              {FEATURES.map((feature) => (
                <div className="login-feature" key={feature.title}>
                  <div className="login-feature__icon">{feature.icon}</div>
                  <div>
                    <div className="login-feature__title">{feature.title}</div>
                    <div className="login-feature__desc">{feature.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="login-story__preview">
            <div className="login-story__preview-head">
              <span>
                <SafetyCertificateOutlined /> 角色权限预览
              </span>
              <em>RBAC</em>
            </div>
            <div className="login-story__preview-tags">
              <Tag color="gold">超级管理员</Tag>
              <Tag color="blue">运营专员</Tag>
              <Tag>只读访客</Tag>
              <span>菜单级 + 按钮级权限</span>
            </div>
          </div>

          <div className="login-story__footer">GD Travel · 旅行社数字化管理平台</div>
        </section>

        <section className="login-panel">
          <div className="login-card">
            <div className="login-card__mobile-brand">
              <img src="/logo.svg" width={38} height={38} alt="GD旅游社" />
              <span>GD旅游社管理系统</span>
            </div>

            <div className="login-card__header">
              <div className="login-card__eyebrow">GD TRAVEL WORKSPACE</div>
              <h2>欢迎回来</h2>
              <p>登录你的工作台，开始今天的旅程管理。</p>
            </div>

            <ProForm<LoginParams>
              formRef={formRef}
              layout="vertical"
              requiredMark={false}
              onFinish={handleFinish}
              submitter={{
                searchConfig: { submitText: '登 录' },
                submitButtonProps: {
                  size: 'large',
                  block: true,
                  loading,
                  style: { height: 48, fontSize: 15, fontWeight: 600 },
                },
                resetButtonProps: false,
              }}
            >
              <ProFormText
                name="username"
                label="账号"
                placeholder="请输入登录账号"
                rules={[{ required: true, message: '请输入登录账号' }]}
                fieldProps={{
                  size: 'large',
                  prefix: <UserOutlined className="login-field-icon" />,
                  autoComplete: 'username',
                  allowClear: true,
                }}
              />
              <ProFormText.Password
                name="password"
                label="密码"
                placeholder="请输入登录密码"
                rules={[{ required: true, message: '请输入登录密码' }]}
                fieldProps={{
                  size: 'large',
                  prefix: <LockOutlined className="login-field-icon" />,
                  autoComplete: 'current-password',
                }}
              />
              <div className="login-card__security">
                <span>
                  <SafetyCertificateOutlined /> JWT 安全鉴权
                </span>
                <span>登录态自动续期校验</span>
              </div>
            </ProForm>

            <div className="login-demo">
              <div className="login-demo__head">
                <span>体验账号</span>
                <em>点击卡片自动填充</em>
              </div>
              <div className="login-demo__list">
                {DEMO_ACCOUNTS.map((account) => (
                  <button
                    key={account.username}
                    type="button"
                    className="login-demo__account"
                    onClick={() => fillDemoAccount(account)}
                    aria-label={`使用${account.role}账号 ${account.username}`}
                  >
                    <span className="login-demo__role">
                      <Tag color={account.color} bordered={false}>
                        {account.role}
                      </Tag>
                    </span>
                    <span className="login-demo__credential">
                      <strong>{account.username}</strong>
                      <span>/ {account.password}</span>
                    </span>
                    <span className="login-demo__desc">{account.description}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="login-copyright">
            © {new Date().getFullYear()} GD Travel · GD旅游社管理系统
          </div>
        </section>
      </div>
    </div>
  );
}
