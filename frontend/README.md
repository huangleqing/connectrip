# GD旅游社管理系统

面向旅游社的 RBAC 管理端，基于 **Umi 4 + Ant Design 5 + Pro Components** 搭建。包含登录鉴权、动态菜单、按钮级权限、用户管理、角色管理与「操作中心」业务模块。

本目录是仓库的前端工程（`frontend/`），后端位于 [backend/](../backend/)，接口契约位于 [docs/backend-integration.md](../docs/backend-integration.md)。

## 技术栈

| 能力 | 选型 |
| --- | --- |
| 应用框架 | Umi 4（`@umijs/max`） |
| 页面组件 | Ant Design 5 + `@ant-design/pro-components` 2 |
| 权限控制 | Umi access 插件（Umi 4 内置） |
| 异步请求 | ahooks `useRequest` + axios |
| Excel 导出 | SheetJS `xlsx`（动态加载） |
| 登录鉴权 | JWT（Bearer Token） |
| 语言 | TypeScript |
| 配套后端 | NestJS + Prisma + MySQL（接口契约见 [backend-integration.md](../docs/backend-integration.md)） |

> **关于框架版本**：Ant Design Pro v5 官方脚手架基于 Umi 3；本项目指定 Umi 4，因此使用 Umi 4 官方推荐组合 `@umijs/max` + `@ant-design/pro-components`，保留 Pro 的布局、表格与表单体验。
>
> **关于 `@umijs/plugin-access`**：该包是 Umi 3 的独立插件。Umi 4 已把同样的能力内置到 `@umijs/max`，API 完全一致：`src/access.ts`、`useAccess()`、`<Access>`、路由 `access` 字段。本项目无需再额外安装 Umi 3 插件。

## 快速开始

要求 Node.js >= 18。

```bash
cd frontend
npm install
npm run dev
```

访问 http://localhost:8000 。开发环境默认启用 `mock/` 下的接口，可直接体验完整流程。需要连接真实 NestJS 后端时，先启动 [backend/](../backend/)，再执行 `npm run dev:server`。

### 演示账号

| 角色 | 账号 | 密码 | 权限范围 |
| --- | --- | --- | --- |
| 超级管理员 | `admin` | `admin123` | 全部菜单与按钮 |
| 运营专员 | `operator` | `operator123` | 操作中心 + 只读用户列表 |
| 只读访客 | `viewer` | `viewer123` | 仅工作台 |
| 计调专员 | `zhouhang` | `123456` | 仅操作中心（无导出按钮） |

### 常用命令

```bash
npm run dev         # 本地开发（启用 mock）
npm run dev:server  # 对接本地 NestJS，关闭 mock 并代理 /api
npm run tsc         # TypeScript 类型检查
npm run build       # 生产构建，输出到 dist/
npm run preview     # 预览生产构建
```

## 功能清单

- 登录 / 退出登录，图形验证码校验，JWT 自动注入与失效回跳；支持当前用户修改登录密码
- `initialState` 保存当前用户、角色、权限列表
- 登录后按后端权限动态生成侧边菜单，无权限路由不渲染菜单
- 路由级权限校验，直接访问无权限页面展示 403
- 按钮级权限控制，统一使用 `<Access>` 组件
- 用户管理：搜索、分页、新建、编辑、启停、重置密码、删除
- 角色管理：权限树分配、新建、编辑、查看、删除、当前角色的批量成员添加/移除（支持多用户），内置角色保护；支持按线路/国家、Excel 导出、金额查看逐项授权
- 工作台：用户/角色/权限概览、最近登录、快捷入口
- 操作中心 → 操作中控台：按线路/国家、出团日期、团队状态和关键词筛选；今日/明日出团/送团统计；团队列表展示订单编号、团号、航班、客源、组团社、人数、负责人及 9 项操作进度；支持导出 Excel
- 团队操作详情：行程表格、转包地接、酒店安排、餐厅安排、车队安排与其他操作（机票、签证、景点、演出、区间交通）六个页签，支持成本编辑、安排确认与单页 Excel 导出
- 金额权限：角色勾选「查看操作金额」后才展示金额；未勾选时页面和导出文件统一显示 `****`
- 开发 Mock 与真实 NestJS 后端一键切换

> 操作中控台当前使用 [data.ts](src/pages/OperationCenter/data.ts) 中的前端样例数据，页面内的修改保存在当前会话；接入 NestJS 操作接口后可替换为持久化数据。角色权限已控制前端线路筛选与金额展示；接入真实操作接口后，后端仍需按 `operation:line:*` 过滤团队，并在响应中脱敏未授权金额。

## RBAC 设计

### 权限标识

命名约定：`模块:资源:动作`。

| 权限标识 | 说明 |
| --- | --- |
| `operation:view` | 查看操作中心 |
| `operation:export` | 导出操作数据（Excel） |
| `operation:amount:view` | 查看操作金额；未授权时显示 `****` |
| `operation:line:<line>` | 线路 / 国家数据权限（17 个线路标签，角色管理中勾选） |
| `system:user:view` | 查看用户列表 |
| `system:user:create` | 新增用户 |
| `system:user:update` | 编辑用户 / 启停账号 |
| `system:user:delete` | 删除用户 |
| `system:user:reset-password` | 重置用户密码 |
| `system:role:view` | 查看角色列表 |
| `system:role:create` | 新增角色 |
| `system:role:update` | 编辑角色 / 分配权限 |
| `system:role:delete` | 删除角色 |

内置角色：

- `super_admin` 超级管理员：拥有全部权限，系统内置，不可编辑或删除
- `operator` 运营专员：操作中心全部线路 + Excel 导出 + 用户列表只读，金额默认隐藏
- `viewer` 只读访客：无业务菜单
- `dispatcher` 计调专员：操作中心全部线路 + 金额查看，无 Excel 导出权限

### 权限流转

1. 登录接口返回 `{ token, user }`，`user.permissions` 为后端计算出的权限标识集合。
2. 前端保存 Token，并把用户与权限写入 Umi `initialState`。
3. 刷新页面时，`getInitialState()` 调用 `GET /api/auth/me` 恢复登录态。
4. `src/access.ts` 将权限列表映射为权限布尔对象，并提供 `hasPermission()`。
5. 路由的 `access` 字段消费该对象；Umi 会自动隐藏无权限菜单，并阻止直接访问。
6. 页面按钮通过 `<Access accessible={access.hasPermission('...')}>` 控制显示。

### 代码示例

路由配置（[config/routes.ts](config/routes.ts)）：

```ts
{
  path: '/operation-center',
  name: '操作中心',
  icon: 'global',
  access: 'operation:view',
  component: './OperationCenter',
}
```

权限工厂（[src/access.ts](src/access.ts)）：

```ts
export default function access(initialState: InitialState | undefined) {
  const permissionSet = new Set(initialState?.permissions ?? []);
  return {
    ...permissionFlags,
    canAccessSystem: hasPermission([PERMISSIONS.USER_VIEW, PERMISSIONS.ROLE_VIEW], 'any'),
    hasPermission,
  };
}
```

按钮权限：

```tsx
<Access accessible={access.hasPermission(PERMISSIONS.USER_CREATE)} fallback={null}>
  <Button type="primary" onClick={openCreateModal}>
    新建用户
  </Button>
</Access>
```

> 前端权限只用于交互控制。后端必须对每个接口再次校验权限，不能信任前端隐藏按钮。

## 请求层

`src/utils/request.ts` 基于 axios 封装：

- 自动注入 `Authorization: Bearer <token>`
- 统一解析后端响应体 `{ code, message, data }`
- 统一错误提示
- 401 时清理本地 Token 并跳转登录页，保留回跳地址

列表页通过 [useTableRequest.ts](src/hooks/useTableRequest.ts) 把 ahooks `useRequest` 适配为 ProTable 的 `request`；其余查询和变更使用 `useRequest` 的 `runAsync`。

## Mock 与 NestJS 对接

### 本地 Mock

```bash
npm run dev
```

Mock 位于 `mock/` 目录，数据保存在进程内存中，重启开发服务器后恢复初始数据。Mock Token 仅用于演示，不是真正签名的 JWT。

### 连接 NestJS

```bash
# 默认代理到 http://localhost:3000
npm run dev:server

# 自定义后端地址（Windows / macOS / Linux 通用）
npx cross-env MOCK=none API_PROXY_TARGET=http://localhost:3000 npm run dev
```

原理：

- 设置 `MOCK=none` 后 Umi 不加载 `mock/`
- `config/config.ts` 只在 `MOCK=none` 时启用 `/api` 代理，避免 Mock 与代理冲突
- 后端需提供与 [接口契约](../docs/backend-integration.md) 一致的响应体

生产环境通常由 Nginx / API 网关把 `/api` 反向代理到 NestJS 服务。

## 目录结构

```text
.
├── config/
│   ├── config.ts              # Umi 配置、主题、代理、mock 开关
│   ├── routes.ts              # 路由与 access 权限标记
│   └── defaultSettings.ts     # ProLayout 布局设置
├── mock/                      # 开发环境接口
│   ├── auth.ts
│   ├── users.ts
│   ├── roles.ts
│   ├── dashboard.ts
│   ├── permissions.ts
│   ├── db.ts
│   └── helpers.ts
├── public/logo.svg
├── src/
│   ├── access.ts              # RBAC 权限工厂
│   ├── app.tsx                # initialState / 布局 / 登录态守卫
│   ├── components/            # AccessDenied、PermissionTree、头像、页脚等
│   ├── constants/permissions.ts
│   ├── hooks/useTableRequest.ts
│   ├── pages/
│   │   ├── Login/
│   │   ├── Dashboard/
│   │   ├── OperationCenter/   # 操作中控台 + 团队操作详情页签
│   │   ├── System/Users/
│   │   ├── System/Roles/
│   │   └── Exception/
│   ├── services/              # 后端接口封装
│   ├── types/
│   └── utils/                 # token、axios 请求封装
├── package.json
└── README.md
```

后端工程与接口契约位于仓库根目录：[backend/](../backend/)、[docs/backend-integration.md](../docs/backend-integration.md)。

## 实现说明

- **动态菜单**：借助 Umi access 插件与 ProLayout，菜单会过滤 `unaccessible` 路由。所有菜单可见性由 `config/routes.ts` 的 `access` 字段决定。
- **菜单与按钮双控**：例如运营专员能看到「用户管理」菜单，但看不到「新建用户」和行内编辑按钮。
- **内置角色保护**：超级管理员角色不可编辑/删除；超级管理员账号不可停用/删除；当前登录账号不可修改自身角色和状态。
- **角色权限刷新**：角色保存后会刷新当前用户的 `initialState`，确保权限变化及时生效；其他在线用户需重新登录或刷新页面。
- **操作中心**：`/operation-center` 承载「操作中控台」，团队操作详情采用抽屉 + 页签承载。行程、转包地接、酒店、餐厅、车队等子页面按《中控台》需求文档落地；导出按钮受 `operation:export` 控制，主控台与详情页均导出 `.xlsx` 文件。
- **线路权限**：`operation:line:*` 由角色管理分配，未授权的线路标签不会出现在中控台，列表和导出也只包含已授权线路。
- **金额权限**：`operation:amount:view` 控制详情页及 Excel 中的金额；未授权时页面显示 `****`，导出文件中的金额列同样脱敏。

## 生产部署

```bash
npm run build
```

将 `dist/` 部署到静态服务器，并配置 history 路由回退和 `/api` 反向代理：

```nginx
server {
  listen 80;
  server_name travel.example.com;
  root /var/www/gd-travel-admin/dist;

  location / {
    try_files $uri $uri/ /index.html;
  }

  location /api/ {
    proxy_pass http://127.0.0.1:3000/api/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

## 安全注意事项

- 生产后端请使用 bcrypt/argon2 存储密码哈希
- JWT 密钥放入环境变量，并设置合理有效期
- 后端接口必须使用权限守卫进行二次校验
- 建议开启 HTTPS，并配置 Token 失效/登出策略
- Mock 中内置了演示账号与明文密码，请勿用于生产
