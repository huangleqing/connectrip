# GD旅游社管理系统 · 后端对接说明

本文档面向 NestJS + Prisma + MySQL 后端开发者，描述前端已使用的鉴权方式、接口契约与权限校验要求。前端代码中的 `frontend/src/services/*`、`frontend/mock/*` 与本文档保持一致。本仓库已按本文档实现后端，代码位于 [`backend/`](../backend/)。

## 1. 基础约定

- API 前缀：`/api`
- 请求格式：`application/json`
- 鉴权头：`Authorization: Bearer <JWT>`
- 成功响应统一包络：

```json
{
  "code": 0,
  "message": "ok",
  "data": {}
}
```

- 失败响应使用正确 HTTP 状态码，并返回：

```json
{
  "code": 401,
  "message": "登录状态已过期，请重新登录",
  "data": null
}
```

前端会读取 `message` 做统一提示；`message` 也可以是字符串数组（NestJS 默认校验错误格式）。401 会清理本地 Token 并跳转登录页。

## 2. 鉴权与权限模型

### 2.1 登录

- 使用账号 + 密码登录
- 密码使用 bcrypt 或 argon2 哈希存储
- JWT 建议包含 `sub`（用户 ID）与 `username`
- 建议有效期：2~8 小时，可配合 refresh token
- 登录成功后更新 `lastLoginAt`
- 被停用账号不能登录

### 2.2 权限计算

- 一个用户可以有多个角色
- 一个角色拥有多个权限标识
- 用户的有效权限 = 所有角色权限的并集
- `super_admin` 角色视为拥有全部权限，后端仍需保护关键操作

权限标识约定：`模块:资源:动作`。前端使用的完整列表：

| 权限标识 | 说明 |
| --- | --- |
| `operation:view` | 查看操作中心 |
| `operation:export` | 导出操作数据 |
| `system:user:view` | 查看用户列表 |
| `system:user:create` | 新增用户 |
| `system:user:update` | 编辑用户 / 启停账号 |
| `system:user:delete` | 删除用户 |
| `system:user:reset-password` | 重置密码 |
| `system:role:view` | 查看角色 |
| `system:role:create` | 新增角色 |
| `system:role:update` | 编辑角色 / 分配权限 |
| `system:role:delete` | 删除角色 |

### 2.3 前端权限流程

1. `POST /api/auth/login` 返回 `token` 与包含 `permissions` 的 `user`
2. 前端把 Token 存入 localStorage，把用户与权限写入 `initialState`
3. 刷新页面时调用 `GET /api/auth/me`
4. `src/access.ts` 将 `permissions` 转成菜单/按钮判断
5. 路由 `access` 控制菜单显示，`<Access>` 控制按钮显示

后端必须在每个受保护接口上再次校验权限，不能依赖前端隐藏按钮。

## 3. 数据结构

### 3.1 CurrentUser

```ts
interface CurrentUser {
  id: number;
  username: string;
  nickname: string;
  avatar?: string;
  email?: string;
  phone?: string;
  roles: Array<{ id: number; code: string; name: string }>;
  permissions: string[];
  isSuperAdmin: boolean;
}
```

### 3.2 User（用户列表项）

```ts
interface User {
  id: number;
  username: string;
  nickname: string;
  avatar?: string;
  email?: string;
  phone?: string;
  roleIds: number[];
  roles: Array<{ id: number; code: string; name: string }>;
  status: 'active' | 'disabled';
  lastLoginAt?: string | null;
  createdAt: string;
}
```

### 3.3 Role

```ts
interface Role {
  id: number;
  name: string;
  code: string;
  description?: string;
  permissions: string[];
  userCount: number;
  isSystem: boolean;
  createdAt: string;
}
```

### 3.4 分页

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "list": [],
    "total": 12,
    "page": 1,
    "pageSize": 10
  }
}
```

## 4. 接口清单

| 方法 | 路径 | 权限 | 说明 |
| --- | --- | --- | --- |
| POST | `/api/auth/login` | 公开 | 登录 |
| GET | `/api/auth/me` | 登录 | 当前用户与权限 |
| POST | `/api/auth/logout` | 登录 | 退出（无状态 JWT 可直接返回成功） |
| GET | `/api/dashboard/summary` | 登录 | 工作台概览 |
| GET | `/api/system/users` | `system:user:view` | 用户分页列表 |
| POST | `/api/system/users` | `system:user:create` | 新建用户 |
| PUT | `/api/system/users/:id` | `system:user:update` | 编辑用户 |
| PATCH | `/api/system/users/:id/status` | `system:user:update` | 启用 / 停用 |
| POST | `/api/system/users/:id/reset-password` | `system:user:reset-password` | 重置密码 |
| DELETE | `/api/system/users/:id` | `system:user:delete` | 删除用户 |
| GET | `/api/system/roles` | `system:role:view` | 角色分页列表 |
| GET | `/api/system/roles/options` | 登录 | 角色下拉选项 |
| GET | `/api/system/permissions` | `system:role:view` | 权限树 |
| POST | `/api/system/roles` | `system:role:create` | 新建角色 |
| PUT | `/api/system/roles/:id` | `system:role:update` | 编辑角色 / 分配权限 |
| DELETE | `/api/system/roles/:id` | `system:role:delete` | 删除角色 |

### 4.1 登录

```http
POST /api/auth/login
Content-Type: application/json

{ "username": "admin", "password": "admin123" }
```

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": 1,
      "username": "admin",
      "nickname": "林悦",
      "roles": [{ "id": 1, "code": "super_admin", "name": "超级管理员" }],
      "permissions": ["operation:view", "operation:export", "system:user:view"],
      "isSuperAdmin": true
    }
  }
}
```

错误示例：

- 账号/密码错误：HTTP 401，`message: "账号或密码错误"`
- 账号停用：HTTP 403，`message: "该账号已被停用，请联系管理员"`

### 4.2 当前用户

```http
GET /api/auth/me
Authorization: Bearer <token>
```

返回 `CurrentUser`。该接口必须返回**最新的角色权限**，以便前端刷新 `initialState`。

### 4.3 用户列表

```http
GET /api/system/users?page=1&pageSize=10&keyword=林&roleCode=operator&status=active
```

- `page`、`pageSize` 必传
- `keyword` 模糊匹配账号、昵称、邮箱、手机号
- `roleCode` 按角色编码过滤
- `status` 取值 `active` / `disabled`
- 返回分页的 `User[]`

### 4.4 新建用户

```http
POST /api/system/users
Authorization: Bearer <token>

{
  "username": "tester01",
  "nickname": "联调测试",
  "password": "123456",
  "email": "tester01@gdtravel.cn",
  "phone": "13900000001",
  "roleIds": [4],
  "status": "active"
}
```

校验要求：

- `username` 3-20 位字母/数字/下划线，字母开头，唯一
- `password` 6-32 位
- 至少一个有效角色
- 只有超级管理员可以分配 `super_admin` 角色

### 4.5 编辑用户

```http
PUT /api/system/users/:id

{
  "nickname": "联调测试",
  "email": "tester01@gdtravel.cn",
  "phone": "13900000001",
  "roleIds": [4],
  "status": "active"
}
```

- `username` 不可修改
- 当前登录账号不能修改自己的角色与启用状态
- 超级管理员账号不能被停用，不能移除 `super_admin` 角色

### 4.6 启停用户

```http
PATCH /api/system/users/:id/status

{ "status": "disabled" }
```

### 4.7 重置密码

```http
POST /api/system/users/:id/reset-password

{ "password": "newPassword123" }
```

建议记录操作日志，并使旧 Token 失效（例如增加 `tokenVersion`）。

### 4.8 删除用户

```http
DELETE /api/system/users/:id
```

保护规则：

- 不能删除自己
- 不能删除超级管理员账号
- 建议软删除或保留审计记录

### 4.9 角色列表

```http
GET /api/system/roles?page=1&pageSize=10&keyword=运营
```

返回分页 `Role[]`，其中 `userCount` 为该角色成员数。

### 4.10 角色选项

```http
GET /api/system/roles/options
```

```json
{
  "code": 0,
  "message": "ok",
  "data": [
    { "label": "超级管理员", "value": 1, "code": "super_admin" },
    { "label": "运营专员", "value": 2, "code": "operator" }
  ]
}
```

用户管理页需要加载该接口来渲染角色筛选和角色选择器，因此登录用户均可访问。

### 4.11 权限树

```http
GET /api/system/permissions
```

```json
{
  "code": 0,
  "message": "ok",
  "data": [
    {
      "key": "group:operation",
      "title": "操作中心",
      "type": "group",
      "children": [
        { "key": "operation:view", "title": "查看操作中心", "type": "menu" },
        { "key": "operation:export", "title": "导出操作数据", "type": "button" }
      ]
    }
  ]
}
```

- `group` 仅用于分组，不会保存到角色权限
- 角色 `permissions` 只保存 `menu` / `button` 的权限标识
- 前端权限树会自动过滤父级节点，只提交叶子权限

### 4.12 新建角色

```http
POST /api/system/roles

{
  "name": "计调专员",
  "code": "dispatcher",
  "description": "负责旅行团计调工作",
  "permissions": ["operation:view"]
}
```

- `code` 唯一，3-32 位小写字母/数字/下划线，创建后不可修改
- `name` 不超过 20 个字符
- 至少选择一项权限

### 4.13 编辑角色

```http
PUT /api/system/roles/:id

{
  "name": "计调专员",
  "code": "dispatcher",
  "description": "负责旅行团计调工作",
  "permissions": ["operation:view", "operation:export"]
}
```

- `super_admin`（`isSystem: true`）不可编辑
- `permissions` 为全量替换
- 保存后当前用户可调用 `/auth/me` 刷新权限

### 4.14 删除角色

```http
DELETE /api/system/roles/:id
```

- 系统内置角色不可删除
- 角色下还有成员时禁止删除，前端会提示先移除成员

### 4.15 工作台概览

```http
GET /api/dashboard/summary
```

```json
{
  "userCount": 12,
  "activeUserCount": 10,
  "roleCount": 4,
  "permissionCount": 11,
  "todayOperations": 168,
  "systemStatus": "operational",
  "recentUsers": []
}
```

`recentUsers` 每项包含 `id`、`nickname`、`username`、`roles`、`status`、`lastLoginAt`。

建议只有具备 `system:user:view` 权限的账号才返回 `recentUsers`，其他账号返回空数组，避免在无权查看用户列表时泄露登录信息。

## 5. Prisma 参考模型

```prisma
enum UserStatus {
  ACTIVE
  DISABLED
}

enum PermissionType {
  MENU
  BUTTON
}

model User {
  id           Int        @id @default(autoincrement())
  username     String     @unique
  passwordHash String
  nickname     String
  email        String?
  phone        String?
  avatar       String?
  status       UserStatus @default(ACTIVE)
  lastLoginAt  DateTime?
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt

  roles        UserRole[]
}

model Role {
  id          Int             @id @default(autoincrement())
  code        String          @unique
  name        String
  description String?
  isSystem    Boolean         @default(false)
  createdAt   DateTime        @default(now())
  updatedAt   DateTime        @updatedAt

  users       UserRole[]
  permissions RolePermission[]
}

model Permission {
  id        Int            @id @default(autoincrement())
  code      String         @unique
  name      String
  type      PermissionType
  module    String
  sort      Int            @default(0)

  roles     RolePermission[]
}

model UserRole {
  userId Int
  roleId Int
  user   User @relation(fields: [userId], references: [id], onDelete: Cascade)
  role   Role @relation(fields: [roleId], references: [id], onDelete: Cascade)

  @@id([userId, roleId])
}

model RolePermission {
  roleId       Int
  permissionId Int
  role         Role       @relation(fields: [roleId], references: [id], onDelete: Cascade)
  permission   Permission @relation(fields: [permissionId], references: [id], onDelete: Cascade)

  @@id([roleId, permissionId])
}
```

权限树分组可以由 `Permission.module` + 固定的模块名称映射构建，也可以使用独立的分组表。

## 6. NestJS 实现要点

### 6.1 统一响应拦截器

```ts
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(_context: ExecutionContext, next: CallHandler) {
    return next.handle().pipe(
      map((data) => ({ code: 0, message: 'ok', data })),
    );
  }
}

// main.ts
app.setGlobalPrefix('api');
app.useGlobalInterceptors(new TransformInterceptor());
```

异常过滤器保持 HTTP 状态码并返回 `{ code, message, data: null }`。

### 6.2 权限装饰器与守卫

```ts
export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata('permissions', permissions);

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required =
      this.reflector.getAllAndOverride<string[]>('permissions', [
        context.getHandler(),
        context.getClass(),
      ]) ?? [];
    if (!required.length) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user as { sub: number };

    const dbUser = await this.prisma.user.findUnique({
      where: { id: user.sub },
      include: {
        roles: { include: { permissions: true } },
      },
    });

    if (!dbUser || dbUser.status === 'DISABLED') {
      throw new UnauthorizedException('账号已被停用');
    }

    if (dbUser.roles.some((role) => role.code === 'super_admin')) {
      return true;
    }

    const granted = new Set(
      dbUser.roles.flatMap((role) => role.permissions.map((p) => p.code)),
    );
    return required.every((code) => granted.has(code));
  }
}
```

在 Controller 上使用：

```ts
@Post()
@RequirePermissions('system:user:create')
create(@Body() dto: CreateUserDto) {
  return this.usersService.create(dto);
}
```

### 6.3 登录逻辑

```ts
async login(username: string, password: string) {
  const user = await this.prisma.user.findUnique({
    where: { username },
    include: { roles: { include: { permissions: true } } },
  });

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new UnauthorizedException('账号或密码错误');
  }
  if (user.status === 'DISABLED') {
    throw new ForbiddenException('该账号已被停用，请联系管理员');
  }

  await this.prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  return {
    token: this.jwtService.sign({ sub: user.id, username: user.username }),
    user: toCurrentUser(user),
  };
}
```

`toCurrentUser` 需要计算：

- `roles` 简表
- 去重后的 `permissions`
- `super_admin` 角色时返回全部权限并设置 `isSuperAdmin: true`

## 7. 前端切换真实后端

1. 后端监听 `http://localhost:3000`，全局前缀设置为 `api`
2. 启动前端：

```bash
cd frontend
npm run dev:server
```

3. 自定义后端地址：

```bash
cd frontend
npx cross-env MOCK=none API_PROXY_TARGET=http://localhost:3000 npm run dev
```

4. 如部署到其他域名，生产环境由 Nginx 将 `/api` 反向代理至 NestJS。前端 `BASE_URL` 定义在 `frontend/src/utils/request.ts`。

## 8. 安全清单

- [ ] 密码使用 bcrypt/argon2，不返回 `passwordHash`
- [ ] JWT 秘钥通过环境变量注入，不提交到仓库
- [ ] 所有业务接口都加 JWT 守卫 + 权限守卫
- [ ] 当前用户状态每次鉴权时从数据库读取，避免停用后旧 Token 继续可用
- [ ] 超级管理员角色与账号有服务端保护
- [ ] 角色删除前检查成员数量
- [ ] 用户删除/停用、重置密码记录操作日志
- [ ] 生产环境启用 HTTPS 与 CORS 白名单
- [ ] 不让前端权限判断替代服务端授权
