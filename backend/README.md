# GD旅游社管理系统 API

NestJS 11 + Prisma 6 + MySQL 8 后端，配合 [frontend](../frontend/) 使用。

## 目录

```text
src/
├── auth/              # 登录与 JWT
├── users/             # 用户管理
├── roles/             # 角色、权限树
├── dashboard/         # 工作台概览
├── prisma/            # PrismaService
├── common/
│   ├── constants/     # 权限定义、角色常量、状态映射
│   ├── decorators/    # @Public、@RequirePermissions、@CurrentUser
│   ├── filters/       # 统一异常响应
│   ├── guards/        # JWT 与权限守卫
│   ├── interceptors/  # 统一响应包络
│   └── utils/         # CurrentUser 构建
├── app.module.ts
└── main.ts
prisma/
├── schema.prisma
├── migrations/
└── seed.ts
```

## 快速启动

前置条件：Node.js 20+，MySQL 8 或 Docker。

```bash
cd backend
copy .env.example .env      # Windows
# cp .env.example .env      # macOS / Linux
npm install
docker compose up -d        # 可选：启动 MySQL 容器
npm run db:setup
npm run start:dev
```

服务地址：http://localhost:3000/api

健康检查：`GET /api/health`

## 环境变量

| 变量 | 默认值 | 说明 |
| --- | --- | --- |
| `DATABASE_URL` | `mysql://gd_travel:...@localhost:3306/gd_travel` | MySQL 连接串 |
| `JWT_SECRET` | 开发密钥 | 生产必须修改 |
| `JWT_EXPIRES_IN` | `8h` | Token 有效期 |
| `PORT` | `3000` | API 端口 |
| `CORS_ORIGIN` | `http://localhost:8000` | 允许的前端来源，多个用逗号分隔 |

## 数据库

```bash
npm run prisma:migrate     # 应用 migrations
npm run prisma:migrate:dev # 开发时创建新迁移
npm run prisma:seed        # 写入演示数据
npm run db:setup           # 迁移 + 种子
npm run db:studio          # Prisma Studio
```

手动安装 MySQL、创建数据库/账号、使用 DBeaver 多连接管理等详细步骤：
[MySQL 手动搭建与数据库管理工具教程](../docs/mysql-setup-and-gui-guide.md)。

种子会创建 29 个权限、4 个角色、12 个用户。重复执行会重置演示账号的密码、角色与资料，但不会删除其他用户。

已有数据库升级操作中心线路/金额权限时，可执行：

```bash
npm run permissions:sync
```

该命令只新增并授权 `operation:amount:view` 与 `operation:line:*` 权限，不会重置用户或已有自定义角色。目前内置角色的默认授权：

- `operator`：全部操作线路 + Excel 导出，金额默认隐藏
- `dispatcher`：全部操作线路 + 金额查看，无 Excel 导出权限

## 鉴权与权限

- `GET /api/auth/captcha`：获取 2 分钟有效的一次性图形验证码
- `POST /api/auth/login`：账号密码 + 图形验证码登录，成功返回 JWT 与当前用户权限
- 全局 `JwtAuthGuard`：校验 Bearer Token，并从数据库加载最新角色/权限
- 全局 `PermissionsGuard`：按 `@RequirePermissions()` 声明的权限校验
- `super_admin` 具有全部权限，并在服务端绕过权限集合检查
- 操作中心数据权限：`operation:line:*` 控制可见线路，`operation:amount:view` 控制金额，`operation:export` 控制 Excel 导出；当前操作数据仍由前端样例数据提供，接入操作接口时需在服务端再次校验并脱敏
- 关键保护：
  - 超级管理员角色不可编辑/删除
  - 超级管理员账号不可停用/删除
  - 当前登录账号不能修改自己的角色与启用状态
  - 角色下存在成员时不能删除该角色
  - 只有超级管理员可以分配或批量追加 `super_admin` 角色成员

## 响应格式

成功：

```json
{ "code": 0, "message": "ok", "data": {} }
```

失败（HTTP 状态码同步）：

```json
{ "code": 403, "message": "当前账号无权执行该操作", "data": null }
```

## 接口

完整请求/响应示例见 [docs/backend-integration.md](../docs/backend-integration.md)。

| 方法 | 路径 | 权限 |
| --- | --- | --- |
| GET | `/api/auth/captcha` | 公开 |
| POST | `/api/auth/login` | 公开 |
| GET | `/api/auth/me` | 登录 |
| POST | `/api/auth/change-password` | 登录 |
| POST | `/api/auth/logout` | 登录 |
| GET | `/api/dashboard/summary` | 登录 |
| GET | `/api/system/users` | `system:user:view` |
| POST | `/api/system/users` | `system:user:create` |
| PUT | `/api/system/users/:id` | `system:user:update` |
| PATCH | `/api/system/users/:id/status` | `system:user:update` |
| POST | `/api/system/users/:id/reset-password` | `system:user:reset-password` |
| DELETE | `/api/system/users/:id` | `system:user:delete` |
| GET | `/api/system/roles` | `system:role:view` |
| GET | `/api/system/roles/options` | 登录 |
| GET | `/api/system/roles/:id/user-options` | `system:role:update` |
| GET | `/api/system/permissions` | `system:role:view` |
| POST | `/api/system/roles` | `system:role:create` |
| POST | `/api/system/roles/:id/members` | `system:role:update` |
| PUT | `/api/system/roles/:id` | `system:role:update` |
| DELETE | `/api/system/roles/:id` | `system:role:delete` |

## 演示账号

| 账号 | 密码 | 角色 |
| --- | --- | --- |
| admin | admin123 | super_admin |
| operator | operator123 | operator |
| viewer | viewer123 | viewer |
| zhouhang | 123456 | dispatcher |
