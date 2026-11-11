# GD旅游社管理系统

旅游社后台管理系统，前后端分离：

- **前端**：[frontend/](frontend/) — Umi 4 + Ant Design Pro Components + RBAC
- **后端**：[backend/](backend/) — NestJS 11 + Prisma 6 + MySQL 8 + JWT
- **接口契约**：[docs/backend-integration.md](docs/backend-integration.md)

## 目录结构

```text
connectrip/
├── frontend/                  # Umi 4 管理端
│   ├── src/
│   ├── mock/                  # 可选的前端 Mock（不依赖后端）
│   └── package.json
├── backend/                   # NestJS API
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── migrations/
│   │   └── seed.ts
│   ├── src/
│   │   ├── auth/              # 登录、JWT
│   │   ├── users/             # 用户管理
│   │   ├── roles/             # 角色与权限
│   │   ├── dashboard/         # 工作台
│   │   ├── common/            # 守卫、过滤器、拦截器、权限常量
│   │   └── prisma/
│   ├── docker-compose.yml     # MySQL 8
│   ├── .env.example
│   └── package.json
├── docs/
└── README.md
```

## 环境要求

- Node.js >= 20
- MySQL 8（或 Docker Desktop）

## 启动步骤

> 需要手动安装 MySQL、使用 DBeaver 查询数据或在同一个工具里管理多套数据库？
> 请阅读完整教程：[MySQL 手动搭建与数据库管理工具教程](docs/mysql-setup-and-gui-guide.md)。

### 1. 启动 MySQL

**方式 A：Docker（推荐，需要 Docker Desktop）**

```bash
cd backend
docker compose up -d
```

数据库会自动创建：

- 数据库：`gd_travel`
- 用户：`gd_travel`
- 密码：`gd_travel_password`
- 端口：`3306`

**方式 B：本机已安装 MySQL 8**

```sql
CREATE DATABASE gd_travel CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE USER 'gd_travel'@'localhost' IDENTIFIED BY 'gd_travel_password';
CREATE USER 'gd_travel'@'127.0.0.1' IDENTIFIED BY 'gd_travel_password';

GRANT ALL PRIVILEGES ON gd_travel.* TO 'gd_travel'@'localhost';
GRANT ALL PRIVILEGES ON gd_travel.* TO 'gd_travel'@'127.0.0.1';
FLUSH PRIVILEGES;
```

如果使用已有数据库/账号，修改 `backend/.env` 中的 `DATABASE_URL` 即可。

### 2. 初始化并启动后端

```bash
cd backend
copy .env.example .env      # Windows
# cp .env.example .env      # macOS / Linux
npm install
npm run db:setup      # 应用数据库迁移 + 写入种子数据
npm run start:dev
```

后端地址：

- API：http://localhost:3000/api
- 健康检查：http://localhost:3000/api/health

### 3. 启动前端

```bash
cd frontend
npm install
npm run dev:server    # 关闭 Mock，代理 /api 到 http://localhost:3000
```

前端地址：http://localhost:8000

如果只想查看前端演示、不启动后端：

```bash
cd frontend
npm run dev           # 使用 frontend/mock 内存数据
```

## 演示账号

| 角色 | 账号 | 密码 | 权限 |
| --- | --- | --- | --- |
| 超级管理员 | `admin` | `admin123` | 全部菜单与按钮 |
| 运营专员 | `operator` | `operator123` | 操作中心 + 用户列表只读 |
| 只读访客 | `viewer` | `viewer123` | 仅工作台 |
| 计调专员 | `zhouhang` | `123456` | 仅操作中心（无导出按钮） |

## 后端说明

- 所有接口统一前缀 `/api`
- 登录返回 JWT，前端通过 `Authorization: Bearer <token>` 访问
- 成功响应：`{ code: 0, message: "ok", data: ... }`
- 错误响应：`{ code: 401, message: "...", data: null }`
- JWT 守卫会在每次请求时读取数据库中的最新用户、角色和权限
- 接口权限由 `@RequirePermissions()` 与全局 `PermissionsGuard` 双重校验
- 超级管理员角色/账号、当前登录账号等关键对象有服务端保护
- 密码使用 bcrypt 哈希存储
- `todayOperations` 目前返回 `0`，待操作中心业务接入后再基于操作日志统计

后端详细接口契约、Prisma 模型和 NestJS 实现建议见 [docs/backend-integration.md](docs/backend-integration.md)。

## 常用命令

### 前端

```bash
cd frontend
npm run dev           # Mock 开发
npm run dev:server    # 连接真实后端
npm run build
npm run tsc
```

### 后端

```bash
cd backend
npm run start:dev
npm run build
npm run start:prod
npm run prisma:migrate   # 应用迁移
npm run prisma:seed      # 重新写入种子数据
npm run db:setup         # 迁移 + 种子
npm run db:studio        # Prisma Studio
```

## 安全提示

- 生产环境必须替换 `JWT_SECRET`，不要把 `backend/.env` 提交到仓库
- 生产环境使用 HTTPS，并限制 `CORS_ORIGIN`
- 建议为 JWT 增加 refresh token / 黑名单或版本号机制
- 前端权限只控制展示，真正的授权校验在后端守卫
- 种子数据包含演示密码，生产环境请删除或重置
