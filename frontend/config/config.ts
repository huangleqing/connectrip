import { defineConfig } from '@umijs/max';
import defaultSettings from './defaultSettings';
import routes from './routes';

export default defineConfig({
  title: defaultSettings.title,
  favicons: ['/logo.svg'],
  routes,

  // Umi 4 已将 access / initialState / layout / model 等能力内置在 @umijs/max 中。
  // access.ts 中的权限对象会被 <Access>、useAccess() 与路由级 access 共同消费。
  access: {},
  initialState: {
    loading: '@/components/PageLoading',
  },
  model: {},
  layout: {
    title: defaultSettings.title,
    locale: false,
  },

  antd: {
    theme: {
      token: {
        colorPrimary: '#1677ff',
        borderRadius: 8,
        colorBgLayout: '#f3f6fb',
      },
      components: {
        Layout: {
          headerBg: '#ffffff',
          siderBg: '#ffffff',
        },
        Menu: {
          itemBorderRadius: 8,
        },
      },
    },
  },

  // 开发环境默认启用 mock/ 下的接口。
  // 连接 NestJS 后端时使用 `MOCK=none npm run dev`，/api 会代理到 API_PROXY_TARGET。
  mock: {},
  proxy:
    process.env.MOCK === 'none'
      ? {
          '/api': {
            target: process.env.API_PROXY_TARGET || 'http://localhost:3000',
            changeOrigin: true,
          },
        }
      : undefined,

  hash: true,
  fastRefresh: true,
  npmClient: 'npm',
  jsMinifier: 'esbuild',
});
